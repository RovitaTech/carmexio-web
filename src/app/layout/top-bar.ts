import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteStore } from '../core/state/site.store';
import { Icon } from '../shared/ui/icon';

/** Contact strip above the header (desktop): phones, hours, help links. */
@Component({
  selector: 'cx-top-bar',
  imports: [RouterLink, Icon],
  template: `
    <div class="strip">
      <div class="container row">
        <p class="phones">
          <cx-icon name="phone" [size]="16" />
          @for (phone of store.site.phones; track phone; let last = $last) {
            <a [href]="store.tel(phone)">{{ phone }}</a>
            @if (!last) {
              <span aria-hidden="true">·</span>
            }
          }
        </p>
        <p class="hours">
          <cx-icon name="clock" [size]="16" />
          <span i18n="@@site.hours">Lun – Sáb 10 a 19 hrs</span>
        </p>
        <nav i18n-aria-label="@@top.nav" aria-label="Ayuda y contacto">
          <a routerLink="/ayuda" i18n="@@nav.help">Ayuda</a>
          <a routerLink="/nosotros" i18n="@@nav.about">Nosotros</a>
          <a routerLink="/contacto" i18n="@@nav.contact">Contacto</a>
          @if (store.site.facebookUrl; as fb) {
            <a [href]="fb" target="_blank" rel="noopener">Facebook</a>
          }
        </nav>
      </div>
    </div>
  `,
  styles: `
    .strip {
      display: none;
      background: var(--cx-navy, #0b1220);
      color: var(--cx-on-dark);
      font-size: 0.82rem;
      font-weight: 600;
    }
    @media (min-width: 1024px) {
      .strip {
        display: block;
      }
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 24px;
      min-height: 36px;
    }
    p,
    nav {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    nav {
      gap: 0;
    }
    nav a {
      padding: 0 12px;
      border-left: 1px solid rgb(255 255 255 / 25%);
    }
    nav a:first-child {
      border-left: 0;
    }
    a:hover {
      text-decoration: underline;
    }
  `,
})
export class TopBar {
  protected readonly store = inject(SiteStore);
}
