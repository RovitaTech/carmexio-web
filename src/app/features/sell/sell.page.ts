import { Component, computed, effect, inject, input, resource } from '@angular/core';
import { Router } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';
import { formatPrice } from '../../core/utils/format';
import {
  BODY_LABELS,
  BodyType,
  FUEL_LABELS,
  FuelType,
  PHOTO_ANGLES,
  TRANSMISSION_LABELS,
  Transmission,
} from '../../domain/models';
import { CATALOG_REPOSITORY, LISTING_REPOSITORY } from '../../domain/repositories';
import { AngleGrid } from './angle-grid';
import { FEATURES, SELL_STEPS, SellStore } from './sell.store';
import { optional, valueOr } from '../../core/utils/resource';

@Component({
  selector: 'cx-sell-page',
  imports: [AngleGrid],
  providers: [SellStore],
  templateUrl: './sell.page.html',
  styleUrl: './sell.page.scss',
})
export class SellPage {
  /** `/vender/:id/editar` → id of the ad being edited. */
  readonly id = input<string>();

  protected readonly store = inject(SellStore);
  private readonly catalog = inject(CATALOG_REPOSITORY);
  private readonly listings = inject(LISTING_REPOSITORY);
  private readonly router = inject(Router);

  protected readonly brands = resource({ loader: () => optional(this.catalog.brands(), []) });
  protected readonly locations = resource({ loader: () => optional(this.catalog.locations(), []) });
  private readonly existing = resource({
    params: () => this.id(),
    loader: ({ params }) => this.listings.byId(params),
  });

  protected readonly steps = SELL_STEPS;
  protected readonly features = FEATURES;
  protected readonly angles = PHOTO_ANGLES;
  protected readonly bodies = Object.entries(BODY_LABELS) as [BodyType, string][];
  protected readonly fuels = Object.entries(FUEL_LABELS) as [FuelType, string][];
  protected readonly transmissions = Object.entries(TRANSMISSION_LABELS) as [
    Transmission,
    string,
  ][];
  protected readonly years = Array.from({ length: 47 }, (_, i) => new Date().getFullYear() + 1 - i);
  protected readonly formatPrice = formatPrice;

  protected readonly models = computed(
    () => valueOr(this.brands, undefined)?.find((b) => b.name === this.store.brand())?.models ?? [],
  );
  protected readonly branch = computed(() =>
    valueOr(this.locations, undefined)?.find((l) => l.id === this.store.locationId()),
  );

  constructor() {
    inject(SeoService).set({ title: 'Vende tu auto', noindex: true });
    effect(() => {
      const car = valueOr(this.existing, undefined);
      if (car) this.store.load(car);
    });
  }

  protected num(value: string): number | null {
    const n = Number(value.replace(/[^0-9]/g, ''));
    return value.trim() && Number.isFinite(n) ? n : null;
  }

  protected async submit(): Promise<void> {
    const car = await this.store.submit();
    if (car) await this.router.navigate(['/mis-anuncios'], { queryParams: { enviado: 1 } });
  }
}
