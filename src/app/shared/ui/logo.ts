import { Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

/** Eagle mark + "CARMEXIO" wordmark. */
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
      <span [style.font-size.px]="size() * 0.62" [class.white]="white()">CARMEXIO</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    span {
      font-weight: 800;
      letter-spacing: 0.08em;
      color: var(--cx-text);
    }
    span.white {
      color: var(--cx-on-dark);
    }
    /* Narrow phones: eagle only, so the header actions keep their room. */
    @media (max-width: 419px) {
      :host(.collapse) span {
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
}
