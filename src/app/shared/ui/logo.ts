import { Component, inject, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { APP_CONFIG } from '../../core/config/app-config';

/** Eagle mark + "CARMEXIO" wordmark with the branch underneath ("GUANAJUATO"). */
@Component({
  selector: 'cx-logo',
  imports: [NgOptimizedImage],
  template: `
    <img
      [ngSrc]="white() ? '/images/logo_mark_white.png' : '/images/logo_mark.png'"
      [width]="size() * 1.34"
      [height]="size()"
      alt=""
    />
    @if (wordmark()) {
      <span class="word" [class.white]="white()">
        <span class="name" [style.font-size.px]="size() * 0.62">CARMEXIO</span>
        <span class="region" [style.font-size.px]="size() * 0.3">{{ region }}</span>
      </span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .word {
      display: grid;
      line-height: 1;
      color: var(--cx-text);
    }
    .word.white {
      color: var(--cx-on-dark);
    }
    .name {
      font-weight: 800;
      letter-spacing: 0.08em;
    }
    .region {
      margin-top: 3px;
      font-weight: 700;
      letter-spacing: 0.34em;
      opacity: 0.85;
    }
    /* Narrow phones: eagle only, so the header actions keep their room. */
    @media (max-width: 419px) {
      :host(.collapse) .word {
        display: none;
      }
    }
  `,
  host: { '[class.collapse]': 'collapseOnPhone()' },
})
export class Logo {
  readonly size = input(30);
  readonly wordmark = input(true);
  readonly white = input(false);
  readonly collapseOnPhone = input(false);
  protected readonly region = inject(APP_CONFIG).site.region.toUpperCase();
}
