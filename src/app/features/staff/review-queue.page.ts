import { Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatKm, formatPrice, timeAgo } from '../../core/utils/format';
import { PHOTO_ANGLES } from '../../domain/models';
import { STAFF_REPOSITORY } from '../../domain/repositories';
import { EmptyState, ErrorState, Skeleton } from '../../shared/ui/state-views';
import { StaffScope } from './staff-scope.store';

/** Pending ads for the branch, oldest first (FIFO review). */
@Component({
  selector: 'cx-review-queue-page',
  imports: [RouterLink, EmptyState, ErrorState, Skeleton],
  template: `
    <header>
      <h1>Revisión</h1>
      <p>Anuncios pendientes · {{ scope.label() }} · el más antiguo primero.</p>
    </header>

    @if (queue.error()) {
      <cx-error-state [error]="queue.error()" (retry)="queue.reload()" />
    } @else if (!queue.hasValue()) {
      <cx-skeleton height="120px" radius="20px" />
    } @else {
      @for (car of queue.value(); track car.id) {
        <a class="card item" [routerLink]="['/staff/revision', car.id]">
          <img [src]="car.images[0]" alt="" width="160" height="110" />
          <div class="info">
            <h2>{{ car.brand }} {{ car.model }} {{ car.year }}</h2>
            <p>{{ price(car.price) }} · {{ km(car.mileageKm) }} · {{ car.location?.name }}</p>
            <p class="muted">Enviado {{ ago(car.updatedAt) }}</p>
          </div>
          <span class="angles" [class.missing]="car.imageAngles.length < angleCount">
            {{ car.imageAngles.length }}/{{ angleCount }} fotos
          </span>
        </a>
      } @empty {
        <cx-empty-state
          icon="✓"
          title="Todo al día"
          message="No hay anuncios esperando revisión en esta sucursal."
        />
      }
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 14px;
    }
    header p {
      color: var(--cx-text-2);
    }
    .item {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 14px;
      align-items: center;
      padding: 12px;
      transition: transform 0.15s ease;
    }
    .item:hover {
      transform: translateY(-2px);
    }
    .item img {
      width: 120px;
      height: 90px;
      border-radius: var(--cx-radius-md);
      object-fit: cover;
    }
    h2 {
      font-size: 1.1rem;
    }
    .info p {
      color: var(--cx-text-2);
    }
    .angles {
      grid-column: 2;
      justify-self: start;
      font-weight: 700;
      color: var(--cx-success-text);
    }
    .angles.missing {
      color: var(--cx-error-text);
    }
    @media (min-width: 768px) {
      .item {
        grid-template-columns: 160px 1fr auto;
      }
      .item img {
        width: 160px;
        height: 110px;
      }
      .angles {
        grid-column: auto;
      }
    }
  `,
})
export class ReviewQueuePage {
  protected readonly scope = inject(StaffScope);
  private readonly staff = inject(STAFF_REPOSITORY);

  protected readonly queue = resource({
    params: () => ({ location: this.scope.locationId() }),
    loader: ({ params }) => this.staff.reviewQueue(params.location),
  });

  protected readonly angleCount = PHOTO_ANGLES.length;
  protected readonly price = formatPrice;
  protected readonly km = formatKm;
  protected readonly ago = timeAgo;
}
