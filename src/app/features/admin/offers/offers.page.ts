import { Component, inject, resource } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContentStore } from '../../../core/state/content.store';
import { ToastStore } from '../../../core/ui/toast.store';
import { Offer } from '../../../domain/content';
import { CMS_REPOSITORY } from '../../../domain/repositories';
import { EmptyState, ErrorState, Skeleton } from '../../../shared/ui/state-views';
import { LiveBadge } from '../ui/live-badge';

/** Promotions shown on the home page and at /ofertas. */
@Component({
  selector: 'cx-admin-offers-page',
  imports: [RouterLink, DatePipe, EmptyState, ErrorState, Skeleton, LiveBadge],
  template: `
    <header class="head">
      <div>
        <h1>Ofertas</h1>
        <p class="muted">Promociones en la portada y en la página de ofertas.</p>
      </div>
      <a class="btn primary" routerLink="/admin/ofertas/nuevo">+ Nueva oferta</a>
    </header>

    @if (offers.error()) {
      <cx-error-state [error]="offers.error()" (retry)="offers.reload()" />
    } @else if (!offers.hasValue()) {
      <cx-skeleton height="200px" radius="20px" />
    } @else {
      <ul class="list">
        @for (o of offers.value(); track o.id) {
          <li class="card row">
            <img class="thumb" [src]="o.imageUrl" alt="" loading="lazy" />
            <div class="title">
              <strong>{{ o.badge?.es ? o.badge!.es + ' · ' : '' }}{{ o.title.es }}</strong>
              <small>
                {{ o.code ? 'Código ' + o.code + ' · ' : '' }}
                {{
                  o.validUntil ? 'Vence ' + (o.validUntil | date: 'mediumDate') : 'Sin vencimiento'
                }}
              </small>
            </div>
            <div class="row-actions">
              <cx-live-badge [item]="{ isActive: o.isActive, endsAt: o.validUntil }" />
              <a class="link-btn" [routerLink]="['/admin/ofertas', o.id]">Editar</a>
              <button class="link-btn danger" type="button" (click)="remove(o)">Eliminar</button>
            </div>
          </li>
        } @empty {
          <cx-empty-state
            icon="％"
            title="Sin ofertas"
            message="Crea una promoción para la portada."
          />
        }
      </ul>
    }
  `,
  styleUrls: ['../ui/admin-page.scss'],
})
export class OffersPage {
  private readonly cms = inject(CMS_REPOSITORY);
  private readonly toast = inject(ToastStore);
  private readonly content = inject(ContentStore);

  protected readonly offers = resource({ loader: () => this.cms.offers() });

  protected async remove(offer: Offer): Promise<void> {
    if (!confirm(`¿Eliminar la oferta "${offer.title.es}"?`)) return;
    try {
      await this.cms.deleteOffer(offer.id);
      this.toast.success('Oferta eliminada.');
      this.offers.reload();
      this.content.reload();
    } catch (e) {
      this.toast.error(e);
    }
  }
}
