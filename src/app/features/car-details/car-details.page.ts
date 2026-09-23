import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  resource,
  signal,
  untracked,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SessionStore } from '../../core/auth/session.store';
import { SeoService } from '../../core/seo/seo.service';
import { carSlug, formatKm, formatPrice, idFromSlug, timeAgo } from '../../core/utils/format';
import {
  AppError,
  BODY_LABELS,
  Car,
  FUEL_LABELS,
  PHOTO_ANGLES,
  STATUS_OWNER_LABELS,
  TRANSMISSION_LABELS,
} from '../../domain/models';
import { LISTING_REPOSITORY } from '../../domain/repositories';
import { ChatInboxStore } from '../../core/state/chat-inbox.store';
import { FavoritesStore } from '../../core/state/favorites.store';
import { RecentlyViewedStore } from '../../core/state/recently-viewed.store';
import { CarCard } from '../../shared/ui/car-card';
import { FinancingCalculator } from './financing-calculator';
import { EmptyState, ScoreRing, Skeleton } from '../../shared/ui/state-views';
import { optional, valueOr } from '../../core/utils/resource';

@Component({
  selector: 'cx-car-details-page',
  imports: [RouterLink, CarCard, FinancingCalculator, EmptyState, ScoreRing, Skeleton],
  templateUrl: './car-details.page.html',
  styleUrl: './car-details.page.scss',
})
export class CarDetailsPage {
  /** Route param `/autos/:slug` (bound via withComponentInputBinding). */
  readonly slug = input.required<string>();

  private readonly listings = inject(LISTING_REPOSITORY);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly recentlyViewed = inject(RecentlyViewedStore);
  private readonly inbox = inject(ChatInboxStore);
  protected readonly session = inject(SessionStore);
  protected readonly favorites = inject(FavoritesStore);

  protected readonly car = resource({
    id: 'car:detail',
    params: () => idFromSlug(this.slug()),
    loader: ({ params }) => this.listings.byId(params),
  });
  protected readonly similar = resource({
    id: 'car:similar',
    params: ({ chain }) => chain(this.car),
    loader: ({ params }) => optional(this.listings.similar(params, 8), []),
  });

  /** Selected photo; back to the cover whenever another car opens. */
  protected readonly photo = linkedSignal({ source: this.slug, computation: () => 0 });
  protected readonly starting = signal(false);

  protected readonly isOwner = computed(() => {
    const user = this.session.user();
    return !!user && valueOr(this.car, undefined)?.sellerId === user.id;
  });
  protected readonly photos = computed(() => {
    const car = valueOr(this.car, undefined);
    if (!car) return [];
    return car.images.map((url, i) => ({
      url,
      label:
        PHOTO_ANGLES.find((a) => a.value === car.imageAngles[i])?.label ??
        $localize`:@@car.photoN:Foto ${i + 1}:n:`,
    }));
  });
  protected readonly specs = computed(() => {
    const c = valueOr(this.car, undefined);
    if (!c) return [];
    return [
      { label: $localize`:@@car.ano:Año`, value: String(c.year) },
      { label: $localize`:@@car.kilometraje:Kilometraje`, value: formatKm(c.mileageKm) },
      { label: $localize`:@@car.combustible:Combustible`, value: FUEL_LABELS[c.fuelType] },
      {
        label: $localize`:@@car.transmision:Transmisión`,
        value: TRANSMISSION_LABELS[c.transmission],
      },
    ];
  });
  protected readonly overview = computed(() => {
    const c = valueOr(this.car, undefined);
    if (!c) return [];
    return [
      [$localize`:@@car.marca:Marca`, c.brand],
      [$localize`:@@car.modelo:Modelo`, c.model],
      [$localize`:@@car.version:Versión`, c.version ?? '—'],
      [$localize`:@@car.carroceria:Carrocería`, BODY_LABELS[c.bodyType]],
      [$localize`:@@car.motor:Motor`, c.engineCc ? `${c.engineCc} cc` : '—'],
      [$localize`:@@car.color:Color`, c.exteriorColor ?? '—'],
      [$localize`:@@car.duenos:Dueños`, c.owners != null ? String(c.owners) : '—'],
      [$localize`:@@car.sucursal:Sucursal`, c.location?.name ?? c.city],
      [$localize`:@@car.id-del-anuncio:ID del anuncio`, c.id.toUpperCase()],
    ];
  });

  protected readonly formatPrice = formatPrice;
  protected readonly timeAgo = timeAgo;
  protected readonly statusLabels = STATUS_OWNER_LABELS;

  constructor() {
    effect(() => {
      const c = valueOr(this.car, undefined);
      if (c) this.setSeo(c);
      else if (this.car.error()) {
        const error = this.car.error();
        this.seo.set({
          title: $localize`:@@car.auto-no-disponible:Auto no disponible`,
          noindex: true,
        });
        this.seo.setStatus(error instanceof AppError && error.kind === 'notFound' ? 404 : 503);
      }
    });
    // Browser only, so SSR renders and crawlers don't inflate the view count.
    effect(() => {
      const id = valueOr(this.car, undefined)?.id;
      if (!id || !this.isBrowser) return;
      untracked(() => {
        void this.listings.recordView(id).catch(() => undefined);
        this.recentlyViewed.track(id);
      });
    });
  }

  protected browse(): void {
    void this.router.navigate(['/autos']);
  }

  protected whatsappUrl(car: Car): string {
    const text = encodeURIComponent(
      $localize`:@@car.whatsappMessage:Hola Carmexio, me interesa el ${car.brand}:brand: ${car.model}:model: ${car.year}:year: (anuncio ${car.id.toUpperCase()}:id:).`,
    );
    return `https://wa.me/${car.location?.whatsapp ?? ''}?text=${text}`;
  }

  protected async chat(car: Car): Promise<void> {
    if (!this.session.isSignedIn()) {
      await this.router.navigate(['/entrar'], { queryParams: { from: this.router.url } });
      return;
    }
    this.starting.set(true);
    try {
      const id = await this.inbox.start({ listingId: car.id });
      await this.router.navigate(['/mensajes', id]);
    } finally {
      this.starting.set(false);
    }
  }

  protected async share(car: Car): Promise<void> {
    const data = { title: `${car.brand} ${car.model} ${car.year}`, url: location.href };
    if (navigator.share) await navigator.share(data).catch(() => undefined);
    else await navigator.clipboard?.writeText(data.url);
  }

  private setSeo(c: Car): void {
    const title = `${c.brand} ${c.model} ${c.year}`;
    this.seo.set({
      title: `${title} · ${formatPrice(c.price)}`,
      description: $localize`:@@car.seo.description:${title}:title: ${c.version ?? ''}:version:, ${formatKm(c.mileageKm)}:km:, verificado por ${c.location?.name ?? 'Carmexio'}:branch:.`,
      image: c.images[0],
      path: `/autos/${carSlug(c)}`,
      noindex: c.status !== 'active',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Car',
        name: title,
        brand: c.brand,
        model: c.model,
        vehicleModelDate: String(c.year),
        mileageFromOdometer: { '@type': 'QuantitativeValue', value: c.mileageKm, unitCode: 'KMT' },
        image: c.images,
        offers: {
          '@type': 'Offer',
          price: c.price,
          priceCurrency: 'MXN',
          availability:
            c.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
          seller: { '@type': 'AutoDealer', name: c.location?.name ?? 'Carmexio' },
        },
      },
    });
  }
}
