import { Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';
import { ContentStore } from '../../core/state/content.store';
import { RecentlyViewedStore } from '../../core/state/recently-viewed.store';
import { SiteStore } from '../../core/state/site.store';
import { compactPrice } from '../../core/utils/format';
import { webLink } from '../../core/utils/links';
import { optional, valueOr } from '../../core/utils/resource';
import { CATALOG_REPOSITORY, LISTING_REPOSITORY } from '../../domain/repositories';
import { BrandCard } from '../../shared/ui/brand-card';
import { CarCard } from '../../shared/ui/car-card';
import { Icon, IconName } from '../../shared/ui/icon';
import { OfferCard } from '../../shared/ui/offer-card';
import { Skeleton } from '../../shared/ui/state-views';
import { HomeHero } from './home-hero';

@Component({
  selector: 'cx-home-page',
  imports: [RouterLink, BrandCard, CarCard, Icon, OfferCard, Skeleton, HomeHero],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  private readonly listings = inject(LISTING_REPOSITORY);
  private readonly catalog = inject(CATALOG_REPOSITORY);
  private readonly recentlyViewed = inject(RecentlyViewedStore);
  protected readonly content = inject(ContentStore);

  protected readonly site = inject(SiteStore);
  protected readonly region = this.site.site.region;
  private readonly branchId = this.site.site.branchId;

  /** In stock at this branch. */
  protected readonly local = resource({
    id: 'home:local',
    loader: () =>
      optional(
        this.listings
          .search({ locationId: this.branchId, sort: 'newest' }, 0, 8)
          .then((p) => p.items),
        [],
      ),
  });
  /** At the other branches: brought over on request. */
  protected readonly pickup = resource({
    id: 'home:pickup',
    loader: () =>
      optional(
        this.listings
          .search({ excludeLocationId: this.branchId, sort: 'newest' }, 0, 8)
          .then((p) => p.items),
        [],
      ),
  });
  protected readonly brands = resource({
    id: 'home:brands',
    loader: () => optional(this.catalog.brands(), []),
  });
  /** Browser-only history, so no SSR id. */
  protected readonly viewed = resource({
    params: () => (this.recentlyViewed.ids().length ? this.recentlyViewed.ids() : undefined),
    loader: ({ params }) => optional(this.listings.byIds(params), []),
  });

  protected readonly strip = computed(() => this.content.ads('home_strip'));
  protected readonly offers = computed(() => this.content.offers().slice(0, 3));
  protected readonly topBrands = computed(() =>
    valueOr(this.brands, [])
      .filter((b) => b.listingsCount > 0)
      .sort((a, b) => b.listingsCount - a.listingsCount)
      .slice(0, 11),
  );
  protected readonly totalCars = computed(() =>
    valueOr(this.brands, []).reduce((sum, b) => sum + b.listingsCount, 0),
  );
  protected readonly link = webLink;

  protected readonly budgets = [
    { max: 250_000, query: { maxPrice: 250000 } },
    { max: 500_000, query: { minPrice: 250000, maxPrice: 500000 } },
    { max: 1_000_000, query: { minPrice: 500000, maxPrice: 1000000 } },
  ].map((b) => ({ ...b, value: compactPrice(b.max) }));
  protected readonly overBudget = compactPrice(1_000_000);

  protected readonly steps: { icon: IconName; title: string; text: string }[] = [
    {
      icon: 'search',
      title: $localize`:@@buy.1.title:Elige tu auto`,
      text: $localize`:@@buy.1.text:Explora el inventario con fotos, precio y reporte de inspección.`,
    },
    {
      icon: 'chat',
      title: $localize`:@@buy.2.title:Escríbenos`,
      text: $localize`:@@buy.2.text:Por chat, WhatsApp o teléfono resolvemos tus dudas y agendamos tu visita.`,
    },
    {
      icon: 'car',
      title: $localize`:@@buy.3.title:Pruébalo`,
      text: $localize`:@@buy.3.text:Ven a la sucursal, revísalo y haz tu prueba de manejo.`,
    },
    {
      icon: 'shield',
      title: $localize`:@@buy.4.title:Recógelo en Guanajuato`,
      text: $localize`:@@buy.4.text:Revisamos papeles contigo y te lo entregamos en nuestra sucursal.`,
    },
  ];

  constructor() {
    const seo = inject(SeoService);
    seo.set({
      title: $localize`:@@home.seo.title:Autos seminuevos verificados`,
      description: $localize`:@@home.seo.description:Autos seminuevos verificados e inspeccionados por Carmexio Guanajuato. Míralos en la sucursal o recógelos en Guanajuato.`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'AutoDealer',
        name: `Carmexio ${this.region}`,
        url: seo.absolute('/'),
      },
    });
  }
}
