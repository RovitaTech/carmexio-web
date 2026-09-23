import { Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';
import { ContentStore } from '../../core/state/content.store';
import { optional } from '../../core/utils/resource';
import { LISTING_REPOSITORY } from '../../domain/repositories';
import { CarCard } from '../../shared/ui/car-card';
import { OfferCard } from '../../shared/ui/offer-card';
import { EmptyState, Skeleton } from '../../shared/ui/state-views';

/** `/ofertas` — admin-managed promotions + certified cars they apply to. */
@Component({
  selector: 'cx-offers-page',
  imports: [RouterLink, CarCard, OfferCard, EmptyState, Skeleton],
  template: `
    <section class="band">
      <div class="container">
        <h1 i18n="@@offers.title">Ofertas Carmexio</h1>
        <p>{{ content.text('offers.intro') }}</p>
      </div>
    </section>

    <div class="container page">
      @if (!content.loaded()) {
        <cx-skeleton height="320px" radius="20px" />
      } @else if (content.offers().length) {
        <h2 class="visually-hidden" i18n="@@offers.current">Ofertas vigentes</h2>
        <div class="offers">
          @for (o of content.offers(); track o.id) {
            <cx-offer-card [offer]="o" />
          }
        </div>
      } @else {
        <cx-empty-state
          icon="％"
          i18n-title="@@offers.empty.title"
          title="No hay ofertas por ahora"
          i18n-message="@@offers.empty.message"
          message="Vuelve pronto: publicamos promociones cada mes."
        />
      }

      <section aria-labelledby="certified-title">
        <div class="section-head">
          <h2 id="certified-title" i18n="@@offers.certified">Autos Carmexio Certificados</h2>
          <a routerLink="/autos" [queryParams]="{ verified: true }" i18n="@@common.seeAll"
            >Ver todos</a
          >
        </div>
        <div class="grid-cars">
          @for (car of certified.value() ?? []; track car.id) {
            <cx-car-card [car]="car" />
          }
        </div>
      </section>
    </div>
  `,
  styles: `
    .band {
      padding: 56px 0 40px;
      background: var(--cx-gradient-hero);
      color: var(--cx-on-dark);
    }
    h1 {
      font-size: clamp(2rem, 5vw, 3rem);
    }
    .band p {
      max-width: 560px;
      margin-top: 8px;
      color: var(--cx-on-dark-2);
    }
    .page {
      display: grid;
      gap: 40px;
      padding-block: 32px 56px;
    }
    .offers {
      display: grid;
      gap: 18px;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
  `,
})
export class OffersPage {
  protected readonly content = inject(ContentStore);
  private readonly listings = inject(LISTING_REPOSITORY);

  protected readonly certified = resource({
    id: 'offers:certified',
    loader: () =>
      optional(
        this.listings.search({ verifiedOnly: true, sort: 'newest' }, 0, 8).then((p) => p.items),
        [],
      ),
  });

  constructor() {
    inject(SeoService).set({
      title: $localize`:@@offers.seo.title:Ofertas en autos seminuevos`,
      description: $localize`:@@offers.seo.description:Promociones vigentes en autos Carmexio Certificados: descuentos, enganche bajo y bonos por tu auto usado.`,
    });
  }
}
