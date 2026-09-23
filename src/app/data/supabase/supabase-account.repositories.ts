import { SupabaseClient, User } from '@supabase/supabase-js';
import { AppError, AppUser, ChatMessage, ProfileChanges } from '../../domain/models';
import { AuthRepository, ChatRepository, FavoritesRepository } from '../../domain/repositories';
import { Row, toCar, toConversation, toMessage, toUser } from '../mappers';
import { CONVERSATION_SELECT, LISTING_SELECT } from './supabase-constants';
import { check, toAppError, unwrap } from './supabase-errors';

/** Resolves the signed-in user id or rejects with an auth error. */
async function requireUserId(db: SupabaseClient): Promise<string> {
  const { data } = await db.auth.getSession();
  const id = data.session?.user.id;
  if (!id)
    throw new AppError(
      $localize`:@@errors.inicia-sesion-para-continuar:Inicia sesión para continuar.`,
      'auth',
    );
  return id;
}

export class SupabaseAuthRepository implements AuthRepository {
  constructor(
    private readonly db: SupabaseClient,
    /** Where the password-reset email links back to. */
    private readonly resetRedirectUrl: string,
  ) {}

  async current() {
    const { data } = await this.db.auth.getSession();
    return data.session ? this.profile(data.session.user) : null;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.db.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw toAppError(error);
    return this.profile(data.user);
  }

  /** `null` when the project requires email confirmation first. */
  async signUp(fullName: string, email: string, phone: string, password: string) {
    const { data, error } = await this.db.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      // Read by the `handle_new_user` trigger to create the profile row.
      options: { data: { full_name: fullName.trim(), phone } },
    });
    if (error) throw toAppError(error);
    return data.session && data.user ? this.profile(data.user) : null;
  }

  async signOut() {
    const { error } = await this.db.auth.signOut();
    if (error) throw toAppError(error);
  }

  async resetPassword(email: string) {
    const { error } = await this.db.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: this.resetRedirectUrl,
    });
    if (error) throw toAppError(error);
  }

  async updateProfile(changes: ProfileChanges) {
    const id = await requireUserId(this.db);
    const row: Row = {};
    if (changes.fullName !== undefined) row['full_name'] = changes.fullName.trim();
    if (changes.phone !== undefined) row['phone'] = changes.phone;
    if (changes.city !== undefined) row['city'] = changes.city;
    unwrap(await this.db.from('profiles').update(row).eq('id', id).select().single());
    return (await this.current())!;
  }

  onChange(listener: (user: AppUser | null) => void) {
    const { data } = this.db.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return; // `current()` already handled it.
      // Supabase warns against awaiting its own calls inside this callback.
      setTimeout(() => {
        if (!session) listener(null);
        else this.profile(session.user).then(listener, () => listener(null));
      });
    });
    return () => data.subscription.unsubscribe();
  }

  private async profile(user: User): Promise<AppUser> {
    const row = unwrap(await this.db.from('profiles').select('*').eq('id', user.id).single());
    return toUser({ ...row, email: user.email });
  }
}

export class SupabaseFavoritesRepository implements FavoritesRepository {
  constructor(private readonly db: SupabaseClient) {}

  async ids() {
    const { data } = await this.db.auth.getSession();
    if (!data.session) return new Set<string>();
    const rows = unwrap(await this.db.from('favorites').select('listing_id'));
    return new Set(rows.map((r: Row) => r['listing_id'] as string));
  }

  async cars() {
    await requireUserId(this.db);
    const rows = unwrap(
      await this.db
        .from('favorites')
        .select(`listing:listings(${LISTING_SELECT})`)
        .order('created_at', { ascending: false }),
    );
    // Listings that are no longer visible (sold/withdrawn) come back as null.
    return rows
      .map((r: Row) => r['listing'] as Row | null)
      .filter((l): l is Row => !!l)
      .map(toCar);
  }

  async add(listingId: string) {
    const userId = await requireUserId(this.db);
    check(
      await this.db
        .from('favorites')
        .upsert({ user_id: userId, listing_id: listingId }, { ignoreDuplicates: true }),
    );
  }

  async remove(listingId: string) {
    const userId = await requireUserId(this.db);
    check(
      await this.db.from('favorites').delete().eq('user_id', userId).eq('listing_id', listingId),
    );
  }
}

export class SupabaseChatRepository implements ChatRepository {
  constructor(private readonly db: SupabaseClient) {}

  async conversations() {
    const userId = await requireUserId(this.db);
    const rows = unwrap(
      await this.db
        .from('conversations')
        .select(CONVERSATION_SELECT)
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false }),
    );
    return rows.map(toConversation);
  }

  async conversation(id: string) {
    return toConversation(
      unwrap(await this.db.from('conversations').select(CONVERSATION_SELECT).eq('id', id).single()),
    );
  }

  async start(target: { listingId: string } | { locationId: string }) {
    await requireUserId(this.db);
    const params =
      'listingId' in target
        ? { p_listing_id: target.listingId }
        : { p_location_id: target.locationId };
    return unwrap(await this.db.rpc('get_or_create_conversation', params)) as string;
  }

  async messages(conversationId: string) {
    const rows = unwrap(
      await this.db
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at'),
    );
    return rows.map(toMessage);
  }

  /** Realtime on `messages`; re-reads the thread so ordering and read ticks stay exact. */
  watch(conversationId: string, onChange: (messages: ChatMessage[]) => void) {
    const channel = this.db
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          this.messages(conversationId).then(onChange, () => undefined);
        },
      )
      .subscribe();
    return () => void this.db.removeChannel(channel);
  }

  async send(conversationId: string, body: string) {
    const text = body.trim();
    if (!text)
      throw new AppError(
        $localize`:@@errors.el-mensaje-esta-vacio:El mensaje está vacío.`,
        'validation',
      );
    const senderId = await requireUserId(this.db);
    check(
      await this.db.from('messages').insert({
        conversation_id: conversationId,
        sender_id: senderId,
        sender_role: 'user',
        body: text,
      }),
    );
  }

  async markRead(conversationId: string) {
    check(await this.db.rpc('mark_conversation_read', { p_conversation_id: conversationId }));
  }
}
