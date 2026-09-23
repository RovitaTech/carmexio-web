import { Component, computed, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionStore } from '../../core/auth/session.store';
import { SeoService } from '../../core/seo/seo.service';
import { carSlug, formatKm, formatPrice, timeAgo } from '../../core/utils/format';
import { Car, PHOTO_ANGLES } from '../../domain/models';
import { LISTING_REPOSITORY } from '../../domain/repositories';
import { EmptyState } from '../../shared/ui/state-views';

const REJECT_REASONS = [
  'La foto del tablero está borrosa; el kilometraje no se lee. Vuelve a tomarla.',
  'Faltan fotos claras del motor.',
  'El precio no corresponde al mercado. Ajústalo y reenvía.',
];

/**
 * Staff portal — first slice: review queue (approve / reject with reason).
 * Next: inspection editor, branch inbox, admin CRUD (FRONTEND_PLAN.md §7).
 */
@Component({
  selector: 'cx-staff-page',
  imports: [RouterLink, EmptyState],
  template: `
    <div class="container page">
      <header>
        <h1>Portal staff</h1>
        <p>
          Anuncios pendientes de verificación{{
            session.user()?.role === 'admin' ? ' (todas las sucursales)' : ''
          }}.
        </p>
      </header>
      <div class="kpis">
        <div class="card kpi">
          <strong>{{ queue.value()?.length ?? '–' }}</strong
          ><small>Pendientes</small>
        </div>
        <div class="card kpi">
          <strong>{{ PHOTO_ANGLES.length }}</strong
          ><small>Fotos obligatorias</small>
        </div>
      </div>
      @for (car of queue.value() ?? []; track car.id) {
        <article class="card review">
          <div class="photos">
            @for (url of car.images; track $index) {
              <figure>
                <img [src]="url" alt="" loading="lazy" />
                <figcaption>{{ angleLabel(car, $index) }}</figcaption>
              </figure>
            }
          </div>
          <div class="info">
            <h2>
              <a [routerLink]="['/autos', slug(car)]"
                >{{ car.brand }} {{ car.model }} {{ car.year }}</a
              >
            </h2>
            <p>
              {{ price(car.price) }} · {{ km(car.mileageKm) }} · {{ car.location?.name }} ·
              {{ ago(car.createdAt) }}
            </p>
            <p>{{ car.imageAngles.length }} / {{ PHOTO_ANGLES.length }} ángulos</p>
            <div class="actions">
              <button
                class="btn primary"
                type="button"
                [disabled]="busy() === car.id"
                (click)="approve(car)"
              >
                Aprobar y publicar
              </button>
              <select #reason aria-label="Motivo de rechazo">
                @for (r of reasons; track r) {
                  <option [value]="r">{{ r }}</option>
                }
              </select>
              <button
                class="btn outline"
                type="button"
                [disabled]="busy() === car.id"
                (click)="reject(car, reason.value)"
              >
                Solicitar cambios
              </button>
            </div>
          </div>
        </article>
      } @empty {
        <cx-empty-state
          icon="✅"
          title="Todo al día"
          message="No hay anuncios pendientes de revisión."
        />
      }
    </div>
  `,
  styles: `
    .page {
      display: grid;
      gap: 16px;
      padding-block: 28px;
    }
    .kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
    }
    .kpi {
      display: grid;
      padding: 18px;
    }
    .kpi strong {
      font-size: 2rem;
      font-weight: 800;
      color: var(--cx-primary);
    }
    .review {
      display: grid;
      gap: 14px;
      padding: 16px;
    }
    .photos {
      display: flex;
      gap: 8px;
      overflow-x: auto;
    }
    figure {
      margin: 0;
      flex: 0 0 140px;
    }
    figure img {
      width: 140px;
      height: 100px;
      object-fit: cover;
      border-radius: var(--cx-radius-sm);
    }
    figcaption {
      font-size: 0.72rem;
      color: var(--cx-text-3);
    }
    .info {
      display: grid;
      gap: 6px;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    select {
      min-height: 44px;
      max-width: 100%;
      padding: 0 10px;
      border-radius: var(--cx-radius-md);
      border: 1px solid var(--cx-border);
      background: var(--cx-surface);
    }
  `,
})
export class StaffPage {
  protected readonly session = inject(SessionStore);
  private readonly repo = inject(LISTING_REPOSITORY);

  protected readonly scope = computed(() =>
    this.session.user()?.role === 'admin' ? undefined : this.session.user()?.locationId,
  );
  protected readonly queue = resource({
    params: () => ({ location: this.scope() }),
    loader: ({ params }) => this.repo.reviewQueue(params.location),
  });
  protected readonly busy = signal<string | null>(null);
  protected readonly reasons = REJECT_REASONS;
  protected readonly PHOTO_ANGLES = PHOTO_ANGLES;
  protected readonly slug = carSlug;
  protected readonly price = formatPrice;
  protected readonly km = formatKm;
  protected readonly ago = timeAgo;

  constructor() {
    inject(SeoService).set({ title: 'Portal staff' });
  }

  protected angleLabel(car: Car, index: number): string {
    return PHOTO_ANGLES.find((a) => a.value === car.imageAngles[index])?.label ?? 'Sin ángulo';
  }

  protected approve(car: Car): Promise<void> {
    return this.act(car, () => this.repo.setStatus(car.id, 'active'));
  }

  protected reject(car: Car, reason: string): Promise<void> {
    return this.act(car, () => this.repo.setStatus(car.id, 'rejected', reason));
  }

  private async act(car: Car, action: () => Promise<void>): Promise<void> {
    this.busy.set(car.id);
    try {
      await action();
      this.queue.reload();
    } finally {
      this.busy.set(null);
    }
  }
}
