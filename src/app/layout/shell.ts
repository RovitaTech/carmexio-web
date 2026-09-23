import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AlertBar } from './alert-bar';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { TabBar } from './tab-bar';

/** Public site layout (route component for everything except /admin). */
@Component({
  selector: 'cx-shell',
  imports: [RouterOutlet, AlertBar, SiteHeader, SiteFooter, TabBar],
  template: `
    <a class="skip" href="#main" i18n="@@nav.skip">Saltar al contenido</a>
    <cx-alert-bar />
    <cx-site-header />
    <main id="main"><router-outlet /></main>
    <cx-site-footer />
    <cx-tab-bar />
  `,
  styles: `
    :host {
      display: block;
    }
    .skip {
      position: absolute;
      left: -999px;
      z-index: 100;
    }
    .skip:focus {
      left: 12px;
      top: 12px;
      padding: 8px 12px;
      background: var(--cx-surface);
    }
    main {
      min-height: 70vh;
      padding-bottom: 90px;
    }
    @media (min-width: 1024px) {
      main {
        padding-bottom: 0;
      }
    }
  `,
})
export class Shell {}
