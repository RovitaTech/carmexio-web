import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  resource,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SessionStore } from '../../core/auth/session.store';
import { SeoService } from '../../core/seo/seo.service';
import { formatKm, formatPrice, idFromSlug, timeAgo } from '../../core/utils/format';
import {
  BODY_LABELS,
  Car,
  FUEL_LABELS,
  PHOTO_ANGLES,
  STATUS_OWNER_LABELS,
  TRANSMISSION_LABELS,
} from '../../domain/models';
import { LISTING_REPOSITORY } from '../../domain/repositories';
import { ChatInboxStore } from '../chat/chat-inbox.store';
import { FavoritesStore } from '../favorites/favorites.store';
import { CarCard } from '../../shared/ui/car-card';
import { EmptyState, ScoreRing, Skeleton } from '../../shared/ui/state-views';

@Component({
  selector: 'cx-car-details-page',
  imports: [RouterLink, CarCard, EmptyState, ScoreRing, Skeleton],
  templateUrl: './car-details.page.html',
  styleUrl: './car-details.page.scss',
})
export class CarDetailsPage {
  /** Route param `/autos/:slug` (bound via withComponentInputBinding). */
  readonly slug = input.required<string>();

  private readonly listings = inject(LISTING_REPOSITORY);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private readonly inbox = inject(ChatInboxStore);
  protected readonly session = inject(SessionStore);
  protected readonly favorites = inject(FavoritesStore);

  protected readonly car = resource({
    params: () => idFromSlug(this.slug()),
    loader: ({ params }) => this.listings.byId(params),
  });
  protected readonly similar = resource({
    params: () => this.car.value(),
    loader: ({ params }) => this.listings.similar(params, 8),
  });

  /** Selected photo; back to the cover whenever another car opens. */
  protected readonly photo = linkedSignal({ source: this.slug, computation: () => 0 });
  protected readonly starting = signal(false);

  protected readonly isOwner = computed(() => {
    const user = this.session.user();
    return !!user && this.car.value()?.sellerId === user.id;
  });
  protected readonly photos = computed(() => {
    const car = this.car.value();
    if (!car) return [];
    return car.images.map((url, i) => ({
      url,
      label: PHOTO_ANGLES.find((a) => a.value === car.imageAngles[i])?.label ?? `Foto ${i + 1}`,
    }));
  });
  protected readonly specs = computed(() => {
    const c = this.car.value();
    if (!c) return [];
    return [
      { label: 'Año', value: String(c.year) },
      { label: 'Kilometraje', value: formatKm(c.mileageKm) },
      { label: 'Combustible', value: FUEL_LABELS[c.fuelType] },
      { label: 'Transmisión', value: TRANSMISSION_LABELS[c.transmission] },
    ];
  });
  protected readonly overview = computed(() => {
    const c = this.car.value();
    if (!c) return [];
    return [
      ['Marca', c.brand],
      ['Modelo', c.model],
      ['Versión', c.version ?? '—'],
      ['Carrocería', BODY_LABELS[c.bodyType]],
      ['Motor', c.engineCc ? `${c.engineCc} cc` : '—'],
      ['Color', c.exteriorColor ?? '—'],
      ['Dueños', c.owners != null ? String(c.owners) : '—'],
      ['Sucursal', c.location?.name ?? c.city],
      ['ID del anuncio', c.id.toUpperCase()],
    ];
  });

  protected readonly formatPrice = formatPrice;
  protected readonly timeAgo = timeAgo;
  protected readonly statusLabels = STATUS_OWNER_LABELS;

  constructor() {
    effect(() => {
      const c = this.car.value();
      if (c) this.setSeo(c);
    });
  }

  protected browse(): void {
    void this.router.navigate(['/autos']);
  }

  protected whatsappUrl(car: Car): string {
    const text = encodeURIComponent(
      `Hola Carmexio, me interesa el ${car.brand} ${car.model} ${car.year} (anuncio ${car.id.toUpperCase()}).`,
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
      description: `${title} ${c.version ?? ''}, ${formatKm(c.mileageKm)}, verificado por ${c.location?.name ?? 'Carmexio'}.`,
      image: c.images[0],
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
