import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { filter, map } from 'rxjs';

/** Thin top bar while a lazy route loads / resolves. */
@Component({
  selector: 'cx-route-progress',
  template: '',
  host: {
    role: 'progressbar',
    'aria-label': 'Cargando página',
    '[class.active]': 'navigating()',
    '[attr.aria-hidden]': '!navigating()',
  },
  styles: `
    :host {
      position: fixed;
      inset: 0 0 auto;
      z-index: 70;
      height: 3px;
      background: var(--cx-gradient-primary);
      transform: scaleX(0);
      transform-origin: left;
      opacity: 0;
      pointer-events: none;
    }
    :host(.active) {
      opacity: 1;
      animation: grow 2s cubic-bezier(0.1, 0.7, 0.3, 1) forwards;
    }
    @keyframes grow {
      to {
        transform: scaleX(0.9);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :host(.active) {
        animation: none;
        transform: scaleX(1);
      }
    }
  `,
})
export class RouteProgress {
  protected readonly navigating = toSignal(
    inject(Router).events.pipe(
      filter(
        (e) =>
          e instanceof NavigationStart ||
          e instanceof NavigationEnd ||
          e instanceof NavigationCancel ||
          e instanceof NavigationError,
      ),
      map((e) => e instanceof NavigationStart),
    ),
    { initialValue: false },
  );
}
