import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentStore } from '../core/state/content.store';
import { SiteStore } from '../core/state/site.store';
import { ThemeMode, ThemeService } from '../core/theme/theme.service';
import { BODY_LABELS, BodyType } from '../domain/models';
import { Logo } from '../shared/ui/logo';
import { LangSwitch } from './lang-switch';

@Component({
  selector: 'cx-site-footer',
  imports: [RouterLink, Logo, LangSwitch],
  template: `
    <footer class="footer">
      <div class="container cols">
        <div class="about">
          <cx-logo [size]="30" [white]="true" />
          <p>{{ content.text('footer.about') }}</p>
          <div class="social">
            <a href="https://www.instagram.com/carmexio.mx/" target="_blank" rel="noopener"
              >Instagram</a
            >
            <a [href]="site.whatsappUrl" target="_blank" rel="noopener">WhatsApp</a>
            @if (site.site.facebookUrl; as fb) {
              <a [href]="fb" target="_blank" rel="noopener">Facebook</a>
            }
          </div>
        </div>
        <nav aria-labelledby="f-buy">
          <h2 id="f-buy" i18n="@@footer.buy">Comprar</h2>
          @for (b of bodies; track b.value) {
            <a routerLink="/autos" [queryParams]="{ body: b.value }">{{ b.label }}</a>
          }
          <a routerLink="/autos" [queryParams]="{ verified: true }" i18n="@@footer.certified"
            >Carmexio Certificado</a
          >
        </nav>
        <nav aria-labelledby="f-company">
          <h2 id="f-company">Carmexio</h2>
          <a routerLink="/nosotros" i18n="@@nav.about">Nosotros</a>
          <a routerLink="/como-funciona" i18n="@@nav.howItWorks">Cómo funciona</a>
          <a routerLink="/financiamiento" i18n="@@nav.financing">Financiamiento</a>
          <a routerLink="/ofertas" i18n="@@nav.offers">Ofertas</a>
          <a routerLink="/ayuda" i18n="@@nav.help">Ayuda</a>
        </nav>
        <div>
          <h2 i18n="@@nav.contact">Contacto</h2>
          <p class="branch">
            <strong>Carmexio {{ site.site.region }}</strong>
            @if (site.branch(); as b) {
              <span>{{ b.address }}</span>
            }
            <span i18n="@@site.hours">Lun – Sáb 10 a 19 hrs</span>
            @for (phone of site.site.phones; track phone) {
              <a [href]="site.tel(phone)">{{ phone }}</a>
            }
          </p>
        </div>
      </div>
      <div class="container bottom">
        <p i18n="@@footer.copyright">© {{ year }} Carmexio. Todos los derechos reservados.</p>
        <div class="prefs">
          <cx-lang-switch />
          <label>
            <span i18n="@@theme.label">Tema</span>
            <select [value]="theme.mode()" (change)="setTheme($any($event.target).value)">
              <option value="system" i18n="@@theme.system">Sistema</option>
              <option value="light" i18n="@@theme.light">Claro</option>
              <option value="dark" i18n="@@theme.dark">Oscuro</option>
            </select>
          </label>
        </div>
      </div>
    </footer>
  `,
  styles: `
    .footer {
      padding: 56px 0 24px;
      background: var(--cx-gradient-hero);
      color: var(--cx-on-dark);
    }
    .cols {
      display: grid;
      gap: 32px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .about {
      grid-column: 1 / -1;
      display: grid;
      align-content: start;
      gap: 14px;
    }
    @media (min-width: 1024px) {
      .cols {
        grid-template-columns: 2fr 1fr 1fr 1.3fr;
      }
      .about {
        grid-column: auto;
      }
    }
    p {
      max-width: 360px;
      color: var(--cx-on-dark-2);
    }
    h2 {
      margin-bottom: 12px;
      font-size: 0.8rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--cx-on-dark-2);
    }
    nav a,
    .social a {
      display: block;
      padding: 5px 0;
      color: var(--cx-on-dark);
      font-weight: 600;
    }
    nav a:hover,
    .social a:hover {
      text-decoration: underline;
    }
    .social {
      display: flex;
      gap: 18px;
    }
    .branch {
      display: grid;
      margin-bottom: 10px;
      color: var(--cx-on-dark-2);
      font-size: 0.875rem;
    }
    .branch strong {
      color: var(--cx-on-dark);
    }
    .bottom {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--cx-glass-border);
      font-size: 0.85rem;
    }
    .prefs {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .prefs label {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    select {
      padding: 6px 10px;
      border: 0;
      border-radius: var(--cx-radius-sm);
      background: var(--cx-surface);
      color: var(--cx-text);
    }
  `,
})
export class SiteFooter {
  protected readonly content = inject(ContentStore);
  protected readonly theme = inject(ThemeService);
  protected readonly site = inject(SiteStore);
  protected readonly bodies = (Object.keys(BODY_LABELS) as BodyType[])
    .filter((b) => b !== 'convertible')
    .map((value) => ({ value, label: BODY_LABELS[value] }));
  protected readonly year = new Date().getFullYear();

  protected setTheme(mode: string): void {
    this.theme.apply(mode as ThemeMode);
  }
}
