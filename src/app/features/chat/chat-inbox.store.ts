import { Service, computed, effect, inject, signal } from '@angular/core';
import { SessionStore } from '../../core/auth/session.store';
import { Conversation } from '../../domain/models';
import { CHAT_REPOSITORY } from '../../domain/repositories';

/** User ↔ Carmexio conversations + unread badge. Empty for guests. */
@Service()
export class ChatInboxStore {
  private readonly repo = inject(CHAT_REPOSITORY);
  private readonly session = inject(SessionStore);

  readonly conversations = signal<Conversation[]>([]);
  readonly loading = signal(false);
  readonly unread = computed(() => this.conversations().reduce((sum, c) => sum + c.unreadCount, 0));

  constructor() {
    effect(() => {
      if (this.session.user()) void this.refresh();
      else this.conversations.set([]);
    });
  }

  async refresh(): Promise<void> {
    if (!this.session.isSignedIn()) return;
    this.loading.set(true);
    try {
      this.conversations.set(await this.repo.conversations());
    } finally {
      this.loading.set(false);
    }
  }

  markOpened(id: string): void {
    this.conversations.update((list) =>
      list.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
    );
    void this.repo.markRead(id);
  }

  /** Opens (or creates) a thread about a car or with a branch. */
  start(target: { listingId: string } | { locationId: string }): Promise<string> {
    return this.repo.start(target);
  }
}
