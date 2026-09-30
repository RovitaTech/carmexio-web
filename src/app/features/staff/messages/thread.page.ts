import { Component, computed, effect, inject, input, resource, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastStore } from '../../../core/ui/toast.store';
import { ChatMessage } from '../../../domain/models';
import { CHAT_REPOSITORY, STAFF_REPOSITORY } from '../../../domain/repositories';
import { ErrorState, Skeleton } from '../../../shared/ui/state-views';
import { StaffScope } from '../staff-scope.store';

/** One customer thread, answered as Carmexio (live via the chat realtime stream). */
@Component({
  selector: 'cx-staff-thread-page',
  imports: [RouterLink, DatePipe, ErrorState, Skeleton],
  template: `
    <a class="back" routerLink="/staff/mensajes">← Mensajes</a>
    @if (thread.error()) {
      <cx-error-state [error]="thread.error()" (retry)="thread.reload()" />
    } @else if (!thread.hasValue()) {
      <cx-skeleton height="320px" radius="20px" />
    } @else {
      @let t = thread.value();
      <header class="card head">
        <div>
          <h1>{{ customer()?.customerName ?? 'Cliente' }}</h1>
          <p>
            {{ t.listingTitle ?? 'Consulta general' }} · {{ t.location.name }}
            @if (customer()?.customerPhone; as phone) {
              · <a [href]="'tel:' + phone">{{ phone }}</a>
            }
          </p>
        </div>
        @if (t.listingId) {
          <a class="btn" [routerLink]="['/staff/revision', t.listingId]">Ver anuncio</a>
        }
      </header>

      <ol class="card messages" aria-label="Mensajes" aria-live="polite">
        @for (m of messages(); track m.id) {
          <li [class.mine]="m.fromDealer">
            <p>{{ m.body }}</p>
            <small
              >{{ m.fromDealer ? 'Carmexio' : 'Cliente' }} ·
              {{ m.createdAt | date: 'short' }}</small
            >
          </li>
        } @empty {
          <li class="empty">Aún no hay mensajes.</li>
        }
      </ol>

      <form class="card reply" (submit)="$event.preventDefault(); send(box)">
        <label class="visually-hidden" for="reply">Respuesta</label>
        <textarea
          #box
          id="reply"
          rows="2"
          maxlength="1000"
          placeholder="Escribe tu respuesta como Carmexio…"
        ></textarea>
        <button class="btn primary" type="submit" [disabled]="sending()">
          {{ sending() ? 'Enviando…' : 'Enviar' }}
        </button>
      </form>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 12px;
    }
    .back {
      color: var(--cx-primary-text);
      font-weight: 600;
    }
    .head {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 12px;
      padding: 16px;
    }
    .head p {
      color: var(--cx-text-2);
    }
    .head a:not(.btn) {
      color: var(--cx-primary-text);
    }
    .messages {
      display: grid;
      gap: 8px;
      max-height: 60vh;
      margin: 0;
      padding: 16px;
      overflow-y: auto;
      list-style: none;
    }
    .messages li {
      max-width: min(520px, 85%);
      padding: 10px 12px;
      border-radius: var(--cx-radius-md);
      background: var(--cx-surface-alt);
    }
    .messages li.mine {
      justify-self: end;
      background: var(--cx-primary-soft);
    }
    .messages small {
      color: var(--cx-text-2);
      font-size: 0.75rem;
    }
    .empty {
      justify-self: center;
      background: none;
      color: var(--cx-text-2);
    }
    .reply {
      display: flex;
      gap: 8px;
      padding: 12px;
    }
    textarea {
      flex: 1;
      padding: 10px;
      border: 1px solid var(--cx-border);
      border-radius: var(--cx-radius-sm);
      background: var(--cx-bg);
      color: inherit;
      font: inherit;
      resize: vertical;
    }
  `,
})
export class StaffThreadPage {
  readonly id = input.required<string>();

  private readonly chat = inject(CHAT_REPOSITORY);
  private readonly staff = inject(STAFF_REPOSITORY);
  private readonly scope = inject(StaffScope);
  private readonly toast = inject(ToastStore);

  protected readonly thread = resource({
    params: () => this.id(),
    loader: ({ params }) => this.chat.conversation(params),
  });
  /** Customer name/phone come with the inbox row (profiles readable for this branch). */
  private readonly inbox = resource({
    params: () => this.scope.locationId(),
    loader: ({ params }) => this.staff.inbox(params),
  });
  protected readonly customer = computed(() => this.inbox.value()?.find((t) => t.id === this.id()));
  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly sending = signal(false);

  constructor() {
    effect((onCleanup) => {
      const id = this.id();
      this.chat.messages(id).then(
        (m) => this.messages.set(m),
        (e) => this.toast.error(e),
      );
      void this.staff.markRead(id).catch(() => undefined);
      const stop = this.chat.watch(id, (m) => this.messages.set(m));
      onCleanup(stop);
    });
  }

  protected async send(box: HTMLTextAreaElement): Promise<void> {
    const text = box.value.trim();
    if (!text || this.sending()) return;
    this.sending.set(true);
    try {
      await this.staff.reply(this.id(), text);
      box.value = '';
      this.messages.set(await this.chat.messages(this.id()));
    } catch (e) {
      this.toast.error(e);
    } finally {
      this.sending.set(false);
    }
  }
}
