import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionStore } from '../../core/auth/session.store';
import { SeoService } from '../../core/seo/seo.service';
import { StaffScope } from './staff-scope.store';

/** Staff portal layout: sidebar (top bar on mobile) + branch scope. */
@Component({
  selector: 'cx-staff-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="container layout">
      <aside class="card side">
        <div class="who">
          <strong>Portal staff</strong>
          <small>{{ session.user()?.fullName }} · {{ roleLabel() }}</small>
        </div>
        @if (scope.isAdmin()) {
          <label class="field">
            <span class="visually-hidden">Sucursal</span>
            <select
              aria-label="Sucursal"
              [value]="scope.locationId() ?? ''"
              (change)="scope.select($any($event.target).value)"
            >
              <option value="">Todas las sucursales</option>
              @for (l of scope.locations.value() ?? []; track l.id) {
                <option [value]="l.id">{{ l.name }}</option>
              }
            </select>
          </label>
        } @else {
          <p class="branch">{{ scope.label() }}</p>
        }
        <nav aria-label="Portal staff">
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
      </aside>
      <section class="content">
        <router-outlet />
      </section>
    </div>
  `,
  styles: `
    .layout {
      display: grid;
      gap: 20px;
      padding-block: 24px 48px;
    }
    @media (min-width: 1024px) {
      .layout {
        grid-template-columns: 250px 1fr;
        align-items: start;
      }
      .side {
        position: sticky;
        top: 88px;
      }
    }
    .side {
      display: grid;
      gap: 14px;
      padding: 18px;
    }
    .who {
      display: grid;
      gap: 2px;
    }
    .who small,
    .branch {
      color: var(--cx-text-2);
    }
    .branch {
      font-weight: 700;
    }
    nav {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    @media (min-width: 1024px) {
      nav {
        display: grid;
      }
    }
    nav a {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: var(--cx-radius-md);
      font-weight: 600;
      color: var(--cx-text-2);
    }
    nav a:hover {
      background: var(--cx-surface-alt);
    }
    nav a.active {
      background: var(--cx-primary-soft);
      color: var(--cx-primary-dark);
    }
    .content {
      min-width: 0;
    }
  `,
})
export class StaffShell {
  protected readonly session = inject(SessionStore);
  protected readonly scope = inject(StaffScope);

  protected readonly nav = [
    { path: '/staff', label: 'Panel', icon: '▦', exact: true },
    { path: '/staff/revision', label: 'Revisión', icon: '✓', exact: false },
    { path: '/staff/anuncios', label: 'Anuncios', icon: '☰', exact: false },
  ];

  constructor() {
    inject(SeoService).set({ title: 'Portal staff', noindex: true });
  }

  protected roleLabel(): string {
    return this.session.user()?.role === 'admin' ? 'Administrador' : 'Staff de sucursal';
  }
}
