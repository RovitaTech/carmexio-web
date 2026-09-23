import { Component, computed, inject, resource } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';
import { compactPrice } from '../../core/utils/format';
import { BODY_LABELS, BodyType } from '../../domain/models';
import { CATALOG_REPOSITORY, LISTING_REPOSITORY } from '../../domain/repositories';
import { CarCard } from '../../shared/ui/car-card';
import { Skeleton } from '../../shared/ui/state-views';

@Component({
  selector: 'cx-home-page',
  imports: [RouterLink, CarCard, Skeleton],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  private readonly listings = inject(LISTING_REPOSITORY);
  private readonly catalog = inject(CATALOG_REPOSITORY);
  private readonly router = inject(Router);

  protected readonly featured = resource({ loader: () => this.listings.featured(8) });
  protected readonly recent = resource({ loader: () => this.listings.recent(8) });
  protected readonly brands = resource({ loader: () => this.catalog.brands() });
  protected readonly banners = resource({ loader: () => this.catalog.banners() });
  protected readonly locations = resource({ loader: () => this.catalog.locations() });

  protected readonly topBrands = computed(() =>
    (this.brands.value() ?? [])
      .filter((b) => b.listingsCount > 0)
      .sort((a, b) => b.listingsCount - a.listingsCount)
      .slice(0, 10),
  );

  protected readonly bodies = (Object.keys(BODY_LABELS) as BodyType[])
    .filter((b) => b !== 'convertible')
    .map((value) => ({ value, label: BODY_LABELS[value] }));

  protected readonly budgets = [
    { label: 'Hasta', value: compactPrice(250_000), query: { maxPrice: 250000 } },
    { label: 'Hasta', value: compactPrice(500_000), query: { minPrice: 250000, maxPrice: 500000 } },
    {
      label: 'Hasta',
      value: compactPrice(1_000_000),
      query: { minPrice: 500000, maxPrice: 1000000 },
    },
    { label: 'Más de', value: compactPrice(1_000_000), query: { minPrice: 1000000 } },
  ];

  protected readonly steps = [
    {
      icon: '📸',
      title: 'Publica gratis',
      text: 'Toma las 11 fotos guiadas y completa los datos.',
    },
    {
      icon: '🔍',
      title: 'Verificamos',
      text: 'Carmexio revisa tu anuncio y lo inspecciona en sucursal.',
    },
    { icon: '✅', title: 'Sale publicado', text: 'Con reporte de inspección de 150 puntos.' },
    {
      icon: '🤝',
      title: 'Nosotros vendemos',
      text: 'Atendemos a los compradores y agendamos visitas.',
    },
  ];

  constructor() {
    inject(SeoService).set({
      title: 'Autos seminuevos verificados',
      description:
        'Compra autos seminuevos verificados e inspeccionados por Carmexio en CDMX, Guadalajara, Querétaro y Tijuana.',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'AutoDealer',
        name: 'Carmexio',
        url: 'https://carmexio.mx',
      },
    });
  }

  /** Maps app deep links (`/search?body=pickup`, `/sell`) to web routes. */
  protected bannerLink(deepLink?: string): { path: string; query: Record<string, string> } {
    const [path, qs] = (deepLink ?? '/search').split('?');
    return {
      path: path === '/sell' ? '/vender' : '/autos',
      query: Object.fromEntries(new URLSearchParams(qs ?? '')),
    };
  }

  protected search(query: string): void {
    void this.router.navigate(['/autos'], { queryParams: query.trim() ? { q: query.trim() } : {} });
  }
}
