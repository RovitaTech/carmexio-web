// DELETE WHEN LIVE — in-memory auth, favorites and dealer chat.
import { AppError, AppUser, ChatMessage, Conversation, ProfileChanges } from '../../domain/models';
import { AuthRepository, ChatRepository, FavoritesRepository } from '../../domain/repositories';
import { Row, toCar, toConversation, toMessage, toUser } from '../mappers';
import { DummyDb, requireUser } from './dummy-db';

export class DummyAuthRepository implements AuthRepository {
  constructor(private readonly db: DummyDb) {}

  private user(id: string | null): AppUser | null {
    const p = this.db.profiles.find((r) => r['id'] === id);
    return p ? toUser(p) : null;
  }

  async current() {
    return this.user(this.db.currentUserId);
  }

  async signIn(email: string, password: string) {
    await this.db.delay(2);
    const normalized = email.trim().toLowerCase();
    if (this.db.passwords.get(normalized) !== password) {
      throw new AppError('Correo o contraseña incorrectos.', 'auth');
    }
    const profile = this.db.profiles.find((p) => p['email'] === normalized)!;
    this.db.currentUserId = profile['id'];
    return this.user(profile['id'])!;
  }

  async signUp(fullName: string, email: string, phone: string, password: string) {
    await this.db.delay(2);
    const normalized = email.trim().toLowerCase();
    if (this.db.passwords.has(normalized)) {
      throw new AppError('Ya existe una cuenta con este correo.', 'auth');
    }
    const id = this.db.nextId('user');
    this.db.passwords.set(normalized, password);
    this.db.profiles.push({
      id,
      email: normalized,
      full_name: fullName.trim(),
      phone,
      role: 'user',
      created_at: new Date().toISOString(),
    });
    this.db.currentUserId = id;
    return this.user(id);
  }

  async signOut() {
    await this.db.delay(0.5);
    this.db.currentUserId = null;
  }

  async resetPassword() {
    await this.db.delay();
  }

  async updateProfile(changes: ProfileChanges) {
    await this.db.delay();
    const id = requireUser(this.db);
    const row = this.db.profiles.find((p) => p['id'] === id)!;
    if (changes.fullName !== undefined) row['full_name'] = changes.fullName;
    if (changes.phone !== undefined) row['phone'] = changes.phone;
    if (changes.city !== undefined) row['city'] = changes.city;
    return this.user(id)!;
  }

  /** In-memory sessions never change behind the app's back. */
  onChange() {
    return () => undefined;
  }
}

export class DummyFavoritesRepository implements FavoritesRepository {
  constructor(private readonly db: DummyDb) {}

  private set(): Set<string> {
    const user = requireUser(this.db);
    if (!this.db.favorites.has(user)) this.db.favorites.set(user, new Set());
    return this.db.favorites.get(user)!;
  }

  async ids() {
    await this.db.delay(0.4);
    return this.db.currentUserId ? new Set(this.set()) : new Set<string>();
  }

  async cars() {
    await this.db.delay();
    return [...this.set()]
      .map((id) => this.db.listing(id))
      .filter((r): r is Row => !!r)
      .map((r) => toCar(this.db.withLocation(r)));
  }

  async add(id: string) {
    await this.db.delay(0.3);
    this.set().add(id);
  }

  async remove(id: string) {
    await this.db.delay(0.3);
    this.set().delete(id);
  }
}

export class DummyChatRepository implements ChatRepository {
  private readonly listeners = new Map<string, Set<(m: ChatMessage[]) => void>>();
  private replyIndex = 0;

  constructor(private readonly db: DummyDb) {}

  private toConversation(row: Row): Conversation {
    const listing = row['listing_id'] ? this.db.listing(row['listing_id']) : undefined;
    return toConversation({ ...row, listing, location: this.db.location(row['location_id']) });
  }

  private snapshot(id: string): ChatMessage[] {
    return this.db.messages
      .filter((m) => m['conversation_id'] === id)
      .map(toMessage)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  private row(id: string): Row {
    const row = this.db.conversations.find((c) => c['id'] === id);
    if (!row) throw new AppError('Conversación no encontrada.', 'notFound');
    return row;
  }

  async conversations() {
    await this.db.delay();
    const user = requireUser(this.db);
    return this.db.conversations
      .filter((c) => c['user_id'] === user)
      .sort((a, b) => b['last_message_at'].localeCompare(a['last_message_at']))
      .map((c) => this.toConversation(c));
  }

  async conversation(id: string) {
    await this.db.delay(0.4);
    return this.toConversation(this.row(id));
  }

  async start(target: { listingId: string } | { locationId: string }) {
    await this.db.delay(0.6);
    const user = requireUser(this.db);
    const listingId = 'listingId' in target ? target.listingId : null;
    const locationId =
      'listingId' in target
        ? this.db.listing(target.listingId)?.['location_id']
        : target.locationId;
    if (!locationId) throw new AppError('Anuncio no encontrado.', 'notFound');
    const existing = this.db.conversations.find(
      (c) =>
        c['user_id'] === user && c['listing_id'] === listingId && c['location_id'] === locationId,
    );
    if (existing) return existing['id'] as string;
    const now = new Date().toISOString();
    const id = this.db.nextId('conv');
    this.db.conversations.push({
      id,
      user_id: user,
      listing_id: listingId,
      location_id: locationId,
      last_message: null,
      last_message_at: now,
      user_unread_count: 0,
      staff_unread_count: 0,
      created_at: now,
    });
    return id;
  }

  async messages(id: string) {
    await this.db.delay(0.4);
    return this.snapshot(id);
  }

  watch(id: string, onChange: (m: ChatMessage[]) => void) {
    const set = this.listeners.get(id) ?? new Set();
    set.add(onChange);
    this.listeners.set(id, set);
    return () => set.delete(onChange);
  }

  async send(id: string, body: string) {
    const text = body.trim();
    if (!text) throw new AppError('El mensaje está vacío.', 'validation');
    this.insert(id, requireUser(this.db), text, false);
    await this.db.delay(0.3);
    setTimeout(() => {
      const reply = this.db.autoReplies[this.replyIndex++ % this.db.autoReplies.length];
      this.insert(id, this.db.staffId, reply, true);
    }, 2000);
  }

  async markRead(id: string) {
    this.row(id)['user_unread_count'] = 0;
  }

  private insert(id: string, sender: string, body: string, fromStaff: boolean) {
    const now = new Date().toISOString();
    this.db.messages.push({
      id: this.db.nextId('msg'),
      conversation_id: id,
      sender_id: sender,
      sender_role: fromStaff ? 'staff' : 'user',
      body,
      created_at: now,
      read_at: fromStaff ? null : now,
    });
    const row = this.row(id);
    row['last_message'] = body;
    row['last_message_at'] = now;
    if (fromStaff) row['user_unread_count'] = (row['user_unread_count'] ?? 0) + 1;
    this.listeners.get(id)?.forEach((fn) => fn(this.snapshot(id)));
  }
}
