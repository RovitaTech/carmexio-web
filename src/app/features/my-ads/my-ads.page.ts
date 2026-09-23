import { Component, computed, inject, input, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';
import { carSlug, formatPrice } from '../../core/utils/format';
import { Car, ListingStatus, STATUS_OWNER_LABELS } from '../../domain/models';
import { LISTING_REPOSITORY } from '../../domain/repositories';
import { EmptyState, Skeleton } from '../../shared/ui/state-views';

type Tab = 'live' | 'review' | 'sold';
const TABS: { id: Tab; label: string; statuses: ListingStatus[] }[] = [
  { id: 'live', label: 'Publicados', statuses: ['active'] },
  { id: 'review', label: 'En revisión', statuses: ['pending', 'rejected'] },
  { id: 'sold', label: 'Vendidos', statuses: ['sold'] },
];

@Component({
  selector: 'cx-my-ads-page',
  imports: [RouterLink, EmptyState, Skeleton],
  template: `
    <div class="container page">
      <header>
        <h1>Mis anuncios</h1>
        <a class="btn primary" routerLink="/vender">+ Publicar auto</a>
      </header>
      @if (enviado()) {
        <p class="notice" role="status">
          ¡Anuncio enviado! Carmexio lo revisará y te escribirá en Mensajes para agendar la
          inspección.
        </p>
      }
      <div class="tabs" role="tablist">
        @for (t of tabs; track t.id) {
          <button
            class="chip"
            role="tab"
            type="button"
            [class.active]="tab() === t.id"
            [attr.aria-selected]="tab() === t.id"
            (click)="tab.set(t.id)"
          >
            {{ t.label }} ({{ count(t.statuses) }})
          </button>
        }
      </div>
      @if (ads.isLoading()) {
        <cx-skeleton height="140px" radius="20px" />
      } @else {
        @for (car of visible(); track car.id) {
          <article class="card ad">
            <a [routerLink]="['/autos', slug(car)]"><img [src]="car.images[0]" alt="" /></a>
            <div class="info">
              <h2>{{ car.brand }} {{ car.model }} {{ car.year }}</h2>
              <strong>{{ formatPrice(car.price) }}</strong>
              <span class="pill" [class]="car.status">{{ labels[car.status] }}</span>
              @if (car.status === 'pending') {
                <p>
                  Carmexio está revisando tus fotos. Te escribiremos en Mensajes para la inspección.
                </p>
              }
              @if (car.rejectionReason) {
                <p class="reason">{{ car.rejectionReason }}</p>
              }
              @if (car.status === 'active') {
                <p class="muted">
                  {{ car.viewsCount }} vistas · {{ car.favoritesCount }} guardados
                </p>
              }
              <div class="actions">
                @if (car.status !== 'sold') {
                  <a class="btn outline" [routerLink]="['/vender', car.id, 'editar']">
                    {{ car.status === 'rejected' ? 'Corregir y reenviar' : 'Editar' }}
                  </a>
                }
                @if (car.status === 'active') {
                  <button class="btn outline" type="button" (click)="setStatus(car, 'sold')">
                    Marcar vendido
                  </button>
                }
                @if (car.status === 'sold') {
                  <button class="btn outline" type="button" (click)="setStatus(car, 'pending')">
                    Volver a publicar
                  </button>
                }
                <button class="btn outline danger" type="button" (click)="remove(car)">
                  Eliminar
                </button>
              </div>
            </div>
          </article>
        } @empty {
          <cx-empty-state
            icon="📣"
            title="Nada por aquí"
            message="Publica tu auto y Carmexio se encarga del resto."
            actionLabel="Publicar auto"
            (action)="sell()"
          />
        }
      }
    </div>
  `,
  styles: `
    .page {
      display: grid;
      gap: 16px;
      padding-block: 28px;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .notice {
      padding: 14px;
      border-radius: var(--cx-radius-md);
      background: var(--cx-primary-soft);
      color: var(--cx-text);
    }
    .tabs {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .ad {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 14px;
      padding: 12px;
    }
    .ad img {
      width: 140px;
      height: 110px;
      object-fit: cover;
      border-radius: var(--cx-radius-md);
    }
    .info {
      display: grid;
      gap: 6px;
      justify-items: start;
    }
    h2 {
      font-size: 1.05rem;
    }
    strong {
      color: var(--cx-primary);
      font-weight: 800;
    }
    .pill.pending {
      background: var(--cx-warning);
    }
    .pill.rejected {
      background: var(--cx-error);
    }
    .pill.sold {
      background: var(--cx-navy-soft);
    }
    .pill.active {
      background: var(--cx-success);
    }
    .reason {
      color: var(--cx-error);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .actions .btn {
      min-height: 38px;
      padding: 0 14px;
    }
    .danger {
      color: var(--cx-error);
    }
  `,
})
export class MyAdsPage {
  /** `?enviado=1` after submitting the sell form. */
  readonly enviado = input<string>();

  private readonly repo = inject(LISTING_REPOSITORY);
  private readonly router = inject(Router);

  protected readonly ads = resource({ loader: () => this.repo.mine() });
  protected readonly tab = signal<Tab>('live');
  protected readonly tabs = TABS;
  protected readonly labels = STATUS_OWNER_LABELS;
  protected readonly formatPrice = formatPrice;
  protected readonly slug = carSlug;

  protected readonly visible = computed(() => {
    const statuses = TABS.find((t) => t.id === this.tab())!.statuses;
    return (this.ads.value() ?? []).filter((c) => statuses.includes(c.status));
  });

  constructor() {
    inject(SeoService).set({ title: 'Mis anuncios' });
  }

  protected count(statuses: ListingStatus[]): number {
    return (this.ads.value() ?? []).filter((c) => statuses.includes(c.status)).length;
  }

  protected async setStatus(car: Car, status: ListingStatus): Promise<void> {
    await this.repo.setStatus(car.id, status);
    this.ads.reload();
  }

  protected async remove(car: Car): Promise<void> {
    if (!confirm(`¿Eliminar ${car.brand} ${car.model}? No se puede deshacer.`)) return;
    await this.repo.remove(car.id);
    this.ads.reload();
  }

  protected sell(): void {
    void this.router.navigate(['/vender']);
  }
}
