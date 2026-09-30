import { Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { timeAgo } from '../../../core/utils/format';
import { STAFF_REPOSITORY } from '../../../domain/repositories';
import { EmptyState, ErrorState, Skeleton } from '../../../shared/ui/state-views';
import { StaffScope } from '../staff-scope.store';

/** Branch inbox: customers writing to this branch (RLS keeps other branches out). */
@Component({
  selector: 'cx-staff-inbox-page',
  imports: [RouterLink, EmptyState, ErrorState, Skeleton],
  template: `
    <header>
      <h1>Mensajes</h1>
      <p>{{ scope.label() }}</p>
    </header>
    @if (threads.error()) {
      <cx-error-state [error]="threads.error()" (retry)="threads.reload()" />
    } @else if (!threads.hasValue()) {
      <cx-skeleton height="240px" radius="20px" />
    } @else if (threads.value().length) {
      <ul class="card list">
        @for (t of threads.value(); track t.id) {
          <li>
            <a [routerLink]="['/staff/mensajes', t.id]" [class.unread]="t.unreadCount > 0">
              @if (t.listingImage) {
                <img [src]="t.listingImage" alt="" loading="lazy" />
              } @else {
                <span class="avatar" aria-hidden="true">{{ t.customerName.charAt(0) }}</span>
              }
              <span class="text">
                <strong>{{ t.customerName }}</strong>
                <small>{{ t.listingTitle ?? 'Consulta general' }} · {{ t.location.city }}</small>
                <span class="last">{{ t.lastMessage ?? 'Sin mensajes aún' }}</span>
              </span>
              <span class="meta">
                <small>{{ ago(t.lastMessageAt) }}</small>
                @if (t.unreadCount) {
                  <span class="badge"
                    >{{ t.unreadCount }}<span class="visually-hidden"> sin leer</span></span
                  >
                }
              </span>
            </a>
          </li>
        }
      </ul>
    } @else {
      <cx-empty-state
        icon="✉"
        title="Sin conversaciones"
        message="Aquí llegan los mensajes de los clientes."
      />
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }
    header p {
      color: var(--cx-text-2);
    }
    .list {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li + li {
      border-top: 1px solid var(--cx-border);
    }
    a {
      display: grid;
      grid-template-columns: 56px minmax(0, 1fr) auto;
      gap: 12px;
      align-items: center;
      padding: 12px 16px;
    }
    a:hover {
      background: var(--cx-surface-alt);
    }
    img,
    .avatar {
      width: 56px;
      height: 42px;
      border-radius: var(--cx-radius-sm);
      object-fit: cover;
    }
    .avatar {
      display: grid;
      place-items: center;
      background: var(--cx-primary-soft);
      color: var(--cx-primary-text);
      font-weight: 800;
    }
    .text {
      display: grid;
      min-width: 0;
    }
    .text small,
    .meta small {
      color: var(--cx-text-2);
    }
    .last {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      color: var(--cx-text-2);
    }
    .unread .last {
      color: var(--cx-text);
      font-weight: 600;
    }
    .meta {
      display: grid;
      justify-items: end;
      gap: 4px;
    }
    .badge {
      min-width: 22px;
      padding: 2px 7px;
      border-radius: var(--cx-radius-pill);
      background: var(--cx-primary-fill);
      color: var(--cx-on-dark);
      font-size: 0.75rem;
      font-weight: 800;
      text-align: center;
    }
  `,
})
export class StaffInboxPage {
  protected readonly scope = inject(StaffScope);
  private readonly staff = inject(STAFF_REPOSITORY);
  protected readonly threads = resource({
    params: () => ({ locationId: this.scope.locationId() }),
    loader: ({ params }) => this.staff.inbox(params.locationId),
  });

  protected ago(iso: string): string {
    return timeAgo(iso);
  }
}
