import { Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentStore } from '../../../core/state/content.store';
import { ToastStore } from '../../../core/ui/toast.store';
import { valueOr } from '../../../core/utils/resource';
import { AD_PLACEMENTS, Advertisement } from '../../../domain/content';
import { CMS_REPOSITORY } from '../../../domain/repositories';
import { EmptyState, ErrorState, Skeleton } from '../../../shared/ui/state-views';
import { LiveBadge } from '../ui/live-badge';
import { AD_PLACEMENT_LABELS } from './ad-placements';

/** Hero slides, promo banners and ad slots, grouped by where they show. */
@Component({
  selector: 'cx-admin-ads-page',
  imports: [RouterLink, EmptyState, ErrorState, Skeleton, LiveBadge],
  template: `
    <header class="head">
      <div>
        <h1>Anuncios</h1>
        <p class="muted">Carrusel de portada, banners y espacios publicitarios.</p>
      </div>
      <a class="btn primary" routerLink="/admin/anuncios/nuevo">+ Nuevo anuncio</a>
    </header>

    @if (ads.error()) {
      <cx-error-state [error]="ads.error()" (retry)="ads.reload()" />
    } @else if (!ads.hasValue()) {
      <cx-skeleton height="200px" radius="20px" />
    } @else if (!ads.value().length) {
      <cx-empty-state icon="◧" title="Sin anuncios" message="Crea el primero para la portada." />
    } @else {
      @for (group of groups(); track group.placement) {
        <section [attr.aria-labelledby]="'g-' + group.placement">
          <h2 [id]="'g-' + group.placement">{{ group.label }}</h2>
          <ul class="list">
            @for (ad of group.items; track ad.id) {
              <li class="card row">
                @if (ad.mediaKind === 'video') {
                  <video class="thumb" [src]="ad.mediaUrl" [poster]="ad.posterUrl" muted></video>
                } @else {
                  <img class="thumb" [src]="ad.mediaUrl" alt="" loading="lazy" />
                }
                <div class="title">
                  <strong>{{ ad.title.es }}</strong>
                  <small>{{ ad.title.en || 'Sin traducción al inglés' }}</small>
                </div>
                <div class="row-actions">
                  <cx-live-badge [item]="ad" />
                  <a class="link-btn" [routerLink]="['/admin/anuncios', ad.id]">Editar</a>
                  <button class="link-btn danger" type="button" (click)="remove(ad)">
                    Eliminar
                  </button>
                </div>
              </li>
            }
          </ul>
        </section>
      }
    }
  `,
  styleUrls: ['../ui/admin-page.scss'],
  styles: `
    section {
      display: grid;
      gap: 10px;
    }
    h2 {
      font-size: 1.05rem;
    }
  `,
})
export class AdsPage {
  private readonly cms = inject(CMS_REPOSITORY);
  private readonly toast = inject(ToastStore);
  private readonly content = inject(ContentStore);

  protected readonly ads = resource({ loader: () => this.cms.ads() });
  protected readonly groups = computed(() => {
    const ads = valueOr(this.ads, []);
    return AD_PLACEMENTS.map((placement) => ({
      placement,
      label: AD_PLACEMENT_LABELS[placement],
      items: ads.filter((a) => a.placement === placement),
    })).filter((g) => g.items.length);
  });

  protected async remove(ad: Advertisement): Promise<void> {
    if (!confirm(`¿Eliminar "${ad.title.es}"?`)) return;
    try {
      await this.cms.deleteAd(ad.id);
      this.toast.success('Anuncio eliminado.');
      this.ads.reload();
      this.content.reload();
    } catch (e) {
      this.toast.error(e);
    }
  }
}
