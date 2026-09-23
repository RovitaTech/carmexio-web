import { Component, computed, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContentStore } from '../../core/state/content.store';
import { webLink } from '../../core/utils/links';
import { Offer } from '../../domain/content';
import { Icon } from './icon';

@Component({
  selector: 'cx-offer-card',
  imports: [RouterLink, DatePipe, Icon],
  template: `
    @let o = offer();
    <article class="card offer">
      <div class="media">
        <img [src]="o.imageUrl" alt="" loading="lazy" />
        @if (o.badge) {
          <span class="badge">{{ content.t(o.badge) }}</span>
        }
      </div>
      <div class="body">
        <h3>{{ content.t(o.title) }}</h3>
        <p>{{ content.t(o.description) }}</p>
        <div class="meta">
          @if (o.code) {
            <span class="code">
              <ng-container i18n="@@offer.code">Código</ng-container> <b>{{ o.code }}</b>
            </span>
          }
          @if (o.validUntil) {
            <span class="until">
              <cx-icon name="clock" [size]="16" />
              <ng-container i18n="@@offer.until"
                >Hasta el {{ o.validUntil | date: 'd MMM' }}</ng-container
              >
            </span>
          }
        </div>
        @if (link(); as l) {
          @if (l.href) {
            <a class="go" [href]="l.href" target="_blank" rel="noopener">
              <ng-container i18n="@@offer.cta">Aprovechar</ng-container>
              <cx-icon name="arrowRight" [size]="18" />
            </a>
          } @else {
            <a class="go" [routerLink]="l.path" [queryParams]="l.query">
              <ng-container i18n="@@offer.cta">Aprovechar</ng-container>
              <cx-icon name="arrowRight" [size]="18" />
            </a>
          }
        }
      </div>
    </article>
  `,
  styles: `
    :host {
      display: block;
    }
    .offer {
      display: grid;
      height: 100%;
      overflow: hidden;
    }
    .media {
      position: relative;
    }
    img {
      width: 100%;
      aspect-ratio: 16 / 9;
      object-fit: cover;
    }
    .badge {
      position: absolute;
      top: 14px;
      left: 14px;
      padding: 6px 12px;
      border-radius: var(--cx-radius-pill);
      background: var(--cx-gold);
      color: var(--cx-on-gold);
      font-weight: 800;
      font-size: 0.95rem;
    }
    .body {
      display: grid;
      gap: 8px;
      align-content: start;
      padding: 18px;
    }
    h3 {
      font-size: 1.15rem;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 14px;
      color: var(--cx-text-2);
      font-size: 0.85rem;
    }
    .code b {
      padding: 2px 8px;
      border: 1px dashed var(--cx-primary);
      border-radius: var(--cx-radius-sm);
      color: var(--cx-primary-text);
      letter-spacing: 0.06em;
    }
    .until {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .go {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
      color: var(--cx-primary-text);
      font-weight: 800;
    }
  `,
})
export class OfferCard {
  readonly offer = input.required<Offer>();
  protected readonly content = inject(ContentStore);
  protected readonly link = computed(() => webLink(this.offer().link));
}
