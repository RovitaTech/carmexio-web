import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionStore } from '../../core/auth/session.store';
import { SeoService } from '../../core/seo/seo.service';
import { Logo } from '../../shared/ui/logo';

/** Admin chrome: navy sidebar (desktop) / scrollable nav bar (mobile). */
@Component({
  selector: 'cx-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Logo],
  template: `
    <a class="skip" href="#admin-main">Saltar al contenido</a>
    <div class="layout">
      <aside class="side">
        <a class="brand" routerLink="/admin" aria-label="Resumen del panel">
          <cx-logo [size]="26" [white]="true" />
          <span class="tag">Admin</span>
        </a>
        <nav aria-label="Administración">
          @for (item of nav; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.exact }"
              ><span aria-hidden="true">{{ item.icon }}</span
              >{{ item.label }}</a
            >
          }
        </nav>
        <div class="foot">
          <a href="/" target="_blank" rel="noopener">Ver sitio ↗</a>
          <a routerLink="/staff">Portal staff</a>
          <p>{{ session.user()?.fullName }}</p>
          <button type="button" (click)="signOut()">Cerrar sesión</button>
        </div>
      </aside>
      <main id="admin-main" class="main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .skip {
      position: absolute;
      left: -999px;
    }
    .skip:focus {
      left: 12px;
      top: 12px;
      z-index: 100;
      padding: 8px 12px;
      background: var(--cx-surface);
    }
    .layout {
      min-height: 100vh;
      background: var(--cx-bg);
    }
    .side {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      background: var(--cx-gradient-hero);
      color: var(--cx-on-dark);
      overflow-x: auto;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .tag {
      padding: 2px 8px;
      border-radius: var(--cx-radius-pill);
      background: var(--cx-glass);
      border: 1px solid var(--cx-glass-border);
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    nav {
      display: flex;
      gap: 4px;
    }
    nav a,
    .foot a,
    .foot button {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: var(--cx-radius-md);
      color: var(--cx-on-dark-2);
      font-weight: 600;
      white-space: nowrap;
    }
    nav a:hover,
    .foot a:hover,
    .foot button:hover {
      background: var(--cx-glass);
      color: var(--cx-on-dark);
    }
    nav a.active {
      background: var(--cx-glass);
      border: 1px solid var(--cx-glass-border);
      color: var(--cx-on-dark);
    }
    .foot {
      display: none;
    }
    .foot button {
      border: 0;
      background: none;
      font: inherit;
      cursor: pointer;
      text-align: left;
    }
    .foot p {
      padding: 0 12px;
      color: var(--cx-on-dark-2);
      font-size: 0.85rem;
    }
    .main {
      min-width: 0;
      padding: 24px 16px 48px;
    }
    @media (min-width: 1024px) {
      .layout {
        display: grid;
        grid-template-columns: 250px minmax(0, 1fr);
      }
      .side {
        position: sticky;
        top: 0;
        flex-direction: column;
        align-items: stretch;
        height: 100vh;
        padding: 22px 16px;
        overflow: visible;
      }
      .brand {
        padding: 0 8px 18px;
        border-bottom: 1px solid var(--cx-glass-border);
      }
      nav {
        flex-direction: column;
      }
      .foot {
        display: grid;
        gap: 2px;
        margin-top: auto;
        padding-top: 14px;
        border-top: 1px solid var(--cx-glass-border);
      }
      .main {
        padding: 32px 36px 56px;
      }
    }
  `,
})
export class AdminShell {
  protected readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  protected readonly nav = [
    { path: '/admin', label: 'Resumen', icon: '▦', exact: true },
    { path: '/admin/anuncios', label: 'Anuncios', icon: '◧', exact: false },
    { path: '/admin/ofertas', label: 'Ofertas', icon: '％', exact: false },
    { path: '/admin/avisos', label: 'Avisos', icon: '📣', exact: false },
    { path: '/admin/medios', label: 'Medios', icon: '🖼', exact: false },
    { path: '/admin/textos', label: 'Textos', icon: '✎', exact: false },
  ];

  constructor() {
    inject(SeoService).set({ title: 'Admin', noindex: true });
  }

  protected async signOut(): Promise<void> {
    await this.session.signOut();
    await this.router.navigateByUrl('/admin/entrar');
  }
}
