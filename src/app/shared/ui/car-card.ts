import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatKm, formatPrice, carSlug } from '../../core/utils/format';
import { BODY_LABELS, Car, FUEL_LABELS } from '../../domain/models';
import { FavoritesStore } from '../../core/state/favorites.store';

@Component({
  selector: 'cx-car-card',
  imports: [RouterLink],
  template: `
    <article class="card">
      <a class="photo" [routerLink]="['/autos', slug()]" [attr.aria-label]="title()">
        <img [src]="car().images[0]" [alt]="title()" loading="lazy" />
        <div class="badges">
          @if (car().isFeatured) {
            <span class="pill gold">★ Destacado</span>
          }
          @if (car().isVerified) {
            <span class="pill">✓ Certificado</span>
          }
        </div>
        <span class="meta">{{ body() }} · {{ fuel() }}</span>
      </a>
      <button
        class="fav"
        type="button"
        [attr.aria-pressed]="saved()"
        [attr.aria-label]="saved() ? 'Quitar de favoritos' : 'Guardar en favoritos'"
        (click)="favorites.toggle(car().id)"
      >
        {{ saved() ? '♥' : '♡' }}
      </button>
      <a class="body" [routerLink]="['/autos', slug()]">
        <h3>{{ car().brand }} {{ car().model }}</h3>
        <p>{{ car().year }} · {{ car().version ?? body() }}</p>
        <strong>{{ price() }}</strong>
        <p class="specs">{{ km() }} · {{ car().location?.name ?? car().city }}</p>
      </a>
    </article>
  `,
  styles: `
    :host {
      display: block;
    }
    article {
      position: relative;
      overflow: hidden;
      height: 100%;
      transition: transform 0.2s ease;
    }
    article:hover {
      transform: translateY(-3px);
    }
    .photo {
      position: relative;
      display: block;
      aspect-ratio: 4 / 3;
      background: var(--cx-surface-alt);
    }
    .photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .photo::after {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--cx-scrim);
      opacity: 0.55;
    }
    .badges {
      position: absolute;
      top: 10px;
      left: 10px;
      display: grid;
      gap: 6px;
      justify-items: start;
      z-index: 1;
    }
    .meta {
      position: absolute;
      left: 12px;
      bottom: 10px;
      z-index: 1;
      color: var(--cx-on-dark);
      font-size: 0.75rem;
      font-weight: 700;
    }
    .fav {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 2;
      width: 38px;
      height: 38px;
      border: 0;
      border-radius: 50%;
      background: var(--cx-photo-overlay);
      backdrop-filter: blur(10px);
      color: var(--cx-on-dark);
      font-size: 1.1rem;
      cursor: pointer;
    }
    .fav[aria-pressed='true'] {
      color: var(--cx-error);
    }
    .body {
      display: grid;
      gap: 4px;
      padding: 14px;
    }
    h3 {
      font-size: 1rem;
    }
    p {
      font-size: 0.85rem;
    }
    strong {
      margin-top: 6px;
      color: var(--cx-primary-text);
      font-size: 1.15rem;
      font-weight: 800;
    }
    .specs {
      color: var(--cx-text-3);
    }
  `,
})
export class CarCard {
  readonly car = input.required<Car>();
  protected readonly favorites = inject(FavoritesStore);

  protected readonly slug = computed(() => carSlug(this.car()));
  protected readonly title = computed(
    () => `${this.car().brand} ${this.car().model} ${this.car().year}`,
  );
  protected readonly price = computed(() => formatPrice(this.car().price));
  protected readonly km = computed(() => formatKm(this.car().mileageKm));
  protected readonly body = computed(() => BODY_LABELS[this.car().bodyType]);
  protected readonly fuel = computed(() => FUEL_LABELS[this.car().fuelType]);
  protected readonly saved = computed(() => this.favorites.ids().has(this.car().id));
}
