import { Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { carSlug, formatPrice, timeAgo } from '../../core/utils/format';
import { valueOr } from '../../core/utils/resource';
import { STAFF_REPOSITORY } from '../../domain/repositories';
import { ErrorState, Skeleton } from '../../shared/ui/state-views';
import { StaffScope } from './staff-scope.store';

/** KPIs for the selected branch + the oldest ads waiting for review. */
@Component({
  selector: 'cx-staff-dashboard',
  imports: [RouterLink, ErrorState, Skeleton],
  template: `
    <header class="head">
      <h1>Panel</h1>
      <p>{{ scope.label() }}</p>
    </header>

    @if (stats.error()) {
      <cx-error-state [error]="stats.error()" (retry)="stats.reload()" />
    } @else {
      <ul class="kpis" aria-label="Indicadores">
        @for (k of kpis(); track k.label) {
          <li class="card kpi" [class.alert]="k.alert">
            @if (stats.hasValue()) {
              <strong>{{ k.value }}</strong>
            } @else {
              <cx-skeleton height="34px" />
            }
            <span>{{ k.label }}</span>
          </li>
        }
      </ul>
    }

    <section class="card queue">
      <div class="section-head">
        <h2>Esperando revisión</h2>
        <a routerLink="/staff/revision">Ver todo</a>
      </div>
      @for (car of oldest(); track car.id) {
        <a class="row" [routerLink]="['/staff/revision', car.id]">
          <img [src]="car.images[0]" alt="" width="72" height="54" />
          <span class="title">{{ car.brand }} {{ car.model }} {{ car.year }}</span>
          <span class="muted">{{ car.location?.name }}</span>
          <span>{{ price(car.price) }}</span>
          <span class="muted">{{ ago(car.updatedAt) }}</span>
        </a>
      } @empty {
        <p class="muted">No hay anuncios pendientes. 🎉</p>
      }
    </section>
  `,
  styles: `
    :host {
      display: grid;
      gap: 20px;
    }
    .head p {
      color: var(--cx-text-2);
    }
    .kpis {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      padding: 0;
      margin: 0;
      list-style: none;
    }
    .kpi {
      display: grid;
      gap: 4px;
      padding: 18px;
    }
    .kpi strong {
      font-size: 2rem;
      font-weight: 800;
    }
    .kpi span {
      color: var(--cx-text-2);
      font-weight: 600;
    }
    .kpi.alert strong {
      color: var(--cx-warning-text);
    }
    .queue {
      display: grid;
      gap: 6px;
      padding: 18px;
    }
    .row {
      display: grid;
      grid-template-columns: 72px 1fr auto;
      align-items: center;
      gap: 4px 14px;
      padding: 8px;
      border-radius: var(--cx-radius-md);
    }
    .row:hover {
      background: var(--cx-surface-alt);
    }
    .row img {
      grid-row: span 2;
      border-radius: var(--cx-radius-sm);
      object-fit: cover;
    }
    .title {
      font-weight: 700;
    }
    @media (min-width: 768px) {
      .row {
        grid-template-columns: 72px 2fr 1.2fr 1fr auto;
      }
      .row img {
        grid-row: auto;
      }
    }
  `,
})
export class DashboardPage {
  protected readonly scope = inject(StaffScope);
  private readonly staff = inject(STAFF_REPOSITORY);

  protected readonly stats = resource({
    params: () => ({ location: this.scope.locationId() }),
    loader: ({ params }) => this.staff.stats(params.location),
  });
  private readonly queue = resource({
    params: () => ({ location: this.scope.locationId() }),
    loader: ({ params }) => this.staff.reviewQueue(params.location),
  });

  protected readonly oldest = computed(() => valueOr(this.queue, []).slice(0, 5));
  protected readonly kpis = computed(() => {
    const s = valueOr(this.stats, undefined);
    return [
      { label: 'Por revisar', value: s?.pending, alert: !!s?.pending },
      { label: 'Publicados', value: s?.active, alert: false },
      { label: 'Sin inspección', value: s?.withoutInspection, alert: !!s?.withoutInspection },
      { label: 'Cambios solicitados', value: s?.rejected, alert: false },
      { label: 'Vendidos este mes', value: s?.soldThisMonth, alert: false },
      { label: 'Chats sin leer', value: s?.unreadChats, alert: !!s?.unreadChats },
    ];
  });

  protected readonly price = formatPrice;
  protected readonly ago = timeAgo;
  protected readonly slug = carSlug;
}
