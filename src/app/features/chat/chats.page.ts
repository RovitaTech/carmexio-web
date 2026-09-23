import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';
import { compactPrice, timeAgo } from '../../core/utils/format';
import { ChatMessage } from '../../domain/models';
import { CHAT_REPOSITORY } from '../../domain/repositories';
import { EmptyState } from '../../shared/ui/state-views';
import { ChatInboxStore } from './chat-inbox.store';

const QUICK_REPLIES = [
  '¿Sigue disponible?',
  'Quiero agendar una visita',
  '¿Puedo hacer una prueba de manejo?',
  '¿Tienen financiamiento?',
];

/** Two-pane inbox (desktop) / single pane (mobile). `/mensajes/:id` opens a thread. */
@Component({
  selector: 'cx-chats-page',
  imports: [RouterLink, DatePipe, EmptyState],
  templateUrl: './chats.page.html',
  styleUrl: './chats.page.scss',
})
export class ChatsPage {
  readonly id = input<string>();

  protected readonly inbox = inject(ChatInboxStore);
  private readonly repo = inject(CHAT_REPOSITORY);

  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly draft = signal('');
  protected readonly sending = signal(false);
  protected readonly quickReplies = QUICK_REPLIES;
  protected readonly timeAgo = timeAgo;
  protected readonly compactPrice = compactPrice;

  protected readonly active = computed(() =>
    this.inbox.conversations().find((c) => c.id === this.id()),
  );

  constructor() {
    inject(SeoService).set({ title: 'Mensajes' });
    // Load + subscribe to the open thread; unsubscribe when it changes.
    effect((onCleanup) => {
      const id = this.id();
      if (!id) return;
      void this.repo.messages(id).then((m) => this.messages.set(m));
      untracked(() => {
        // Threads created from a car page aren't in the inbox yet.
        if (!this.inbox.conversations().some((c) => c.id === id)) void this.inbox.refresh();
        this.inbox.markOpened(id);
      });
      const stop = this.repo.watch(id, (m) => {
        this.messages.set(m);
        void this.inbox.refresh();
      });
      onCleanup(stop);
    });
  }

  protected async send(text = this.draft()): Promise<void> {
    const id = this.id();
    const body = text.trim();
    if (!id || !body || this.sending()) return;
    this.sending.set(true);
    this.draft.set('');
    try {
      await this.repo.send(id, body);
    } catch {
      this.draft.set(body);
    } finally {
      this.sending.set(false);
    }
  }
}
