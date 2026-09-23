import { Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { valueOr } from '../../core/utils/resource';
import { AD_PLACEMENT_LABELS } from './ads/ad-placements';
import { isLive } from '../../domain/content';
import { CMS_REPOSITORY } from '../../domain/repositories';
import { ErrorState, Skeleton } from '../../shared/ui/state-views';

/** What is on the public site right now + shortcuts to create content. */
@Component({
  selector: 'cx-admin-dashboard',
  imports: [RouterLink, ErrorState, Skeleton],
  template: `
    <header class="head">
      <div>
        <h1>Resumen</h1>
        <p class="muted">Contenido publicado en carmexio.mx ahora mismo.</p>
      </div>
      <div class="quick">
        <a class="btn primary" routerLink="/admin/anuncios/nuevo">+ Anuncio</a>
        <a class="btn outline" routerLink="/admin/ofertas/nuevo">+ Oferta</a>
        <a class="btn outline" routerLink="/admin/avisos">+ Aviso</a>
      </div>
    </header>

    @if (data.error()) {
      <cx-error-state [error]="data.error()" (retry)="data.reload()" />
    } @else if (!data.hasValue()) {
      <cx-skeleton height="140px" radius="20px" />
    } @else {
      <ul class="kpis">
        @for (k of kpis(); track k.label) {
          <li class="card">
            <a [routerLink]="k.link">
              <strong>{{ k.live }}</strong>
              <span>{{ k.label }}</span>
              <small class="muted">{{ k.total }} en total</small>
            </a>
          </li>
        }
      </ul>

      <section class="card block" aria-labelledby="live-title">
        <h2 id="live-title">Anuncios en el sitio</h2>
        <ul class="placements">
          @for (p of placements(); track p.id) {
            <li>
              <span class="name">{{ p.label }}</span>
              <span>{{ p.count }} activo{{ p.count === 1 ? '' : 's' }}</span>
            </li>
          }
        </ul>
      </section>
    }
  `,
  styleUrls: ['./ui/admin-page.scss'],
  styles: `
    .quick {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .kpis {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 12px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .kpis a {
      display: grid;
      gap: 2px;
      padding: 18px;
    }
    .kpis strong {
      font-size: 2rem;
      font-weight: 800;
    }
    .kpis span {
      font-weight: 700;
    }
    .block {
      display: grid;
      gap: 12px;
      padding: 20px;
    }
    h2 {
      font-size: 1.15rem;
    }
    .placements {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .placements li {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid var(--cx-border);
    }
    .name {
      font-weight: 600;
    }
  `,
})
export class AdminDashboardPage {
  private readonly cms = inject(CMS_REPOSITORY);

  protected readonly data = resource({
    loader: async () => {
      const [ads, alerts, offers, media] = await Promise.all([
        this.cms.ads(),
        this.cms.alerts(),
        this.cms.offers(),
        this.cms.media(),
      ]);
      return { ads, alerts, offers, media };
    },
  });

  protected readonly kpis = computed(() => {
    const d = valueOr(this.data, undefined);
    if (!d) return [];
    const offerLive = d.offers.filter(
      (o) => o.isActive && (!o.validUntil || Date.parse(o.validUntil) > Date.now()),
    );
    return [
      {
        label: 'Anuncios activos',
        live: d.ads.filter((a) => isLive(a)).length,
        total: d.ads.length,
        link: '/admin/anuncios',
      },
      {
        label: 'Ofertas vigentes',
        live: offerLive.length,
        total: d.offers.length,
        link: '/admin/ofertas',
      },
      {
        label: 'Avisos visibles',
        live: d.alerts.filter((a) => isLive(a)).length,
        total: d.alerts.length,
        link: '/admin/avisos',
      },
      { label: 'Archivos', live: d.media.length, total: d.media.length, link: '/admin/medios' },
    ];
  });

  protected readonly placements = computed(() => {
    const ads = valueOr(this.data, undefined)?.ads ?? [];
    return Object.entries(AD_PLACEMENT_LABELS).map(([id, label]) => ({
      id,
      label,
      count: ads.filter((a) => a.placement === id && isLive(a)).length,
    }));
  });
}
