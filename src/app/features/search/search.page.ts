import { Component, computed, inject, linkedSignal, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';
import {
  BODY_LABELS,
  CarFilter,
  FUEL_LABELS,
  SORT_LABELS,
  TRANSMISSION_LABELS,
} from '../../domain/models';
import { CATALOG_REPOSITORY, LISTING_REPOSITORY } from '../../domain/repositories';
import { CarCard } from '../../shared/ui/car-card';
import { EmptyState, Skeleton } from '../../shared/ui/state-views';
import { SiteStore } from '../../core/state/site.store';
import { Stock, activeFilterCount, filterToParams, parseFilter, stockOf } from './search-query';
import { optional } from '../../core/utils/resource';

const PAGE_SIZE = 12;

@Component({
  selector: 'cx-search-page',
  imports: [CarCard, EmptyState, Skeleton],
  templateUrl: './search.page.html',
  styleUrl: './search.page.scss',
})
export class SearchPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listings = inject(LISTING_REPOSITORY);
  private readonly catalog = inject(CATALOG_REPOSITORY);

  private readonly params = toSignal(this.route.queryParamMap, { requireSync: true });
  protected readonly region = inject(SiteStore).site.region;
  private readonly branchId = inject(SiteStore).site.branchId;
  protected readonly filter = computed(() => parseFilter(this.params(), this.branchId));
  protected readonly stock = computed(() => stockOf(this.filter(), this.branchId));
  protected readonly stocks: { value: Stock | undefined; label: string }[] = [
    { value: undefined, label: $localize`:@@stock.all:Todos` },
    { value: 'local', label: $localize`:@@stock.local:Autos en ${this.region}:INTERPOLATION:` },
    {
      value: 'pickup',
      label: $localize`:@@stock.pickup:Autos que puedes recoger en ${this.region}:INTERPOLATION:`,
    },
  ];
  protected readonly activeCount = computed(() => activeFilterCount(this.filter()));

  /** Grows by one page on "load more"; resets whenever the filter changes. */
  protected readonly limit = linkedSignal({ source: this.filter, computation: () => PAGE_SIZE });

  protected readonly results = resource({
    id: 'search:results',
    params: () => ({ filter: this.filter(), limit: this.limit() }),
    loader: ({ params }) => this.listings.search(params.filter, 0, params.limit),
  });
  protected readonly brands = resource({
    id: 'search:brands',
    loader: () => optional(this.catalog.brands(), []),
  });
  protected readonly locations = resource({
    id: 'search:locations',
    loader: () => optional(this.catalog.locations(), []),
  });

  protected readonly bodies = Object.entries(BODY_LABELS);
  protected readonly fuels = Object.entries(FUEL_LABELS);
  protected readonly transmissions = Object.entries(TRANSMISSION_LABELS);
  protected readonly sorts = Object.entries(SORT_LABELS);
  protected readonly priceSteps = [
    150000, 250000, 400000, 600000, 800000, 1000000, 1500000, 3000000,
  ];
  protected readonly filtersOpen = signal(false);
  protected readonly clearLabel = $localize`:@@search.clearFilters:Limpiar filtros`;

  constructor() {
    inject(SeoService).set({
      title: $localize`:@@search.autos-seminuevos-en-venta:Autos seminuevos en venta`,
      description: $localize`:@@search.busca-autos-seminuevos-verificados-por:Inventario de Carmexio Guanajuato: autos en la sucursal y autos que puedes recoger en Guanajuato.`,
    });
  }

  protected update(changes: Partial<CarFilter>): void {
    void this.router.navigate([], {
      queryParams: filterToParams({ ...this.filter(), ...changes }, this.branchId),
    });
  }

  protected clear(): void {
    void this.router.navigate([], {
      queryParams: filterToParams(
        {
          query: this.filter().query,
          sort: this.filter().sort,
          locationId: this.filter().locationId,
          excludeLocationId: this.filter().excludeLocationId,
        },
        this.branchId,
      ),
    });
  }

  /** Switches between everything, cars at the branch, and cars to pick up here. */
  protected setStock(stock: Stock | undefined): void {
    this.update({
      locationId: stock === 'local' ? this.branchId : undefined,
      excludeLocationId: stock === 'pickup' ? this.branchId : undefined,
    });
  }

  protected loadMore(): void {
    this.limit.update((n) => n + PAGE_SIZE);
  }

  protected optional(value: string): string | undefined {
    return value || undefined;
  }

  protected optionalNumber(value: string): number | undefined {
    return value ? Number(value) : undefined;
  }
}
