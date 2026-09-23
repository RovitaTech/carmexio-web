import { Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';
import { ContentStore } from '../../core/state/content.store';
import { RecentlyViewedStore } from '../../core/state/recently-viewed.store';
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

  protected readonly featured = resource({
    id: 'home:featured',
    loader: () => optional(this.listings.featured(8), []),
  });
  protected readonly recent = resource({
    id: 'home:recent',
    loader: () => optional(this.listings.recent(8), []),
  });
  protected readonly brands = resource({
    id: 'home:brands',
    loader: () => optional(this.catalog.brands(), []),
  });
  protected readonly locations = resource({
    id: 'home:locations',
    loader: () => optional(this.catalog.locations(), []),
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
      icon: 'plus',
      title: $localize`:@@how.1.title:Publica gratis`,
      text: $localize`:@@how.1.text:Toma las 11 fotos guiadas y completa los datos.`,
    },
    {
      icon: 'search',
      title: $localize`:@@how.2.title:Verificamos`,
      text: $localize`:@@how.2.text:Carmexio revisa tu anuncio y lo inspecciona en sucursal.`,
    },
    {
      icon: 'shield',
      title: $localize`:@@how.3.title:Sale publicado`,
      text: $localize`:@@how.3.text:Con reporte de inspección de 150 puntos.`,
    },
    {
      icon: 'chat',
      title: $localize`:@@how.4.title:Nosotros vendemos`,
      text: $localize`:@@how.4.text:Atendemos a los compradores y agendamos visitas.`,
    },
  ];

  constructor() {
    inject(SeoService).set({
      title: $localize`:@@home.seo.title:Autos seminuevos verificados`,
      description: $localize`:@@home.seo.description:Compra autos seminuevos verificados e inspeccionados por Carmexio en CDMX, Guadalajara, Querétaro y Tijuana.`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'AutoDealer',
        name: 'Carmexio',
        url: 'https://carmexio.mx',
      },
    });
  }
}
