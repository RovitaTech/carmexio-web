import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Brand } from '../../domain/models';
import { BrandLogo, brandColor } from './brand-logo';
import { Icon } from './icon';

/** "Explore by brand" tile: logo, name, stock and top models; links to the filtered search. */
@Component({
  selector: 'cx-brand-card',
  imports: [RouterLink, BrandLogo, Icon],
  template: `
    @let b = brand();
    <a
      class="card tile"
      routerLink="/autos"
      [queryParams]="{ brand: b.name }"
      [style.--glow]="glow()"
    >
      <span class="logo"><cx-brand-logo [name]="b.name" [logoUrl]="b.logoUrl" [size]="36" /></span>
      <span class="go"><cx-icon name="arrowRight" [size]="18" /></span>
      <strong>{{ b.name }}</strong>
      <span class="count" i18n="@@brand.count"
        >{b.listingsCount, plural, =1 {1 auto disponible} other {{{ b.listingsCount }} autos disponibles}}</span
      >
      @if (models()) {
        <span class="models">{{ models() }}</span>
      }
    </a>
  `,
  styles: `
    :host {
      display: block;
    }
    .tile {
      position: relative;
      isolation: isolate;
      display: grid;
      gap: 2px;
      height: 100%;
      padding: 18px;
      overflow: hidden;
      border: 1px solid var(--cx-border);
      box-shadow: none;
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        border-color 0.2s ease;
    }
    /* Soft brand-coloured glow in the corner, stronger on hover. */
    .tile::before {
      content: '';
      position: absolute;
      inset: -40% -40% auto auto;
      z-index: -1;
      width: 160px;
      height: 160px;
      border-radius: 50%;
      background: radial-gradient(circle, var(--glow) 0%, transparent 70%);
      opacity: 0.12;
      transition: opacity 0.2s ease;
    }
    .tile:hover,
    .tile:focus-visible {
      transform: translateY(-3px);
      border-color: color-mix(in srgb, var(--glow) 40%, var(--cx-border));
      box-shadow: var(--cx-shadow);
    }
    .tile:hover::before {
      opacity: 0.28;
    }
    .logo {
      display: grid;
      place-items: center;
      width: 56px;
      height: 56px;
      margin-bottom: 12px;
      border-radius: var(--cx-radius-md);
      background: var(--cx-surface-alt);
    }
    .go {
      position: absolute;
      top: 16px;
      right: 16px;
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--cx-surface-alt);
      color: var(--cx-text-2);
      transition:
        background-color 0.2s ease,
        color 0.2s ease,
        rotate 0.2s ease;
      rotate: -45deg;
    }
    .tile:hover .go {
      rotate: 0deg;
      background: var(--cx-primary-fill);
      color: var(--cx-on-dark);
    }
    strong {
      font-size: 1.1rem;
    }
    .count {
      color: var(--cx-text-2);
      font-size: 0.875rem;
      font-weight: 600;
    }
    .models {
      margin-top: 6px;
      overflow: hidden;
      color: var(--cx-text-3);
      font-size: 0.8rem;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  `,
})
export class BrandCard {
  readonly brand = input.required<Brand>();
  protected readonly glow = computed(() => brandColor(this.brand().name) ?? 'var(--cx-primary)');
  protected readonly models = computed(() => this.brand().models.slice(0, 3).join(' · '));
}
