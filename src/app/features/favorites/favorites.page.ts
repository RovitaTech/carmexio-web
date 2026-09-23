import { Component, computed, inject, resource } from '@angular/core';
import { Router } from '@angular/router';
import { SeoService } from '../../core/seo/seo.service';
import { FAVORITES_REPOSITORY } from '../../domain/repositories';
import { CarCard } from '../../shared/ui/car-card';
import { EmptyState, ErrorState, Skeleton } from '../../shared/ui/state-views';
import { FavoritesStore } from '../../core/state/favorites.store';
import { valueOr } from '../../core/utils/resource';

@Component({
  selector: 'cx-favorites-page',
  imports: [CarCard, EmptyState, ErrorState, Skeleton],
  template: `
    <div class="container page">
      <h1>Autos guardados</h1>
      @if (cars.error()) {
        <cx-error-state [error]="cars.error()" (retry)="cars.reload()" />
      } @else if (cars.isLoading() && !cars.hasValue()) {
        <cx-skeleton height="320px" radius="20px" />
      } @else if (visible().length) {
        <h2 class="visually-hidden">Lista de autos guardados</h2>
        <div class="grid-cars">
          @for (car of visible(); track car.id) {
            <cx-car-card [car]="car" />
          }
        </div>
      } @else {
        <cx-empty-state
          icon="♡"
          title="Aún no guardas autos"
          message="Toca el corazón en cualquier auto para verlo aquí."
          actionLabel="Ver autos"
          (action)="browse()"
        />
      }
    </div>
  `,
  styles: `
    .page {
      display: grid;
      gap: 20px;
      padding-block: 28px;
    }
  `,
})
export class FavoritesPage {
  private readonly repo = inject(FAVORITES_REPOSITORY);
  private readonly store = inject(FavoritesStore);
  private readonly router = inject(Router);

  protected readonly cars = resource({ loader: () => this.repo.cars() });
  /** Hides cars un-hearted on this page without refetching. */
  protected readonly visible = computed(() =>
    valueOr(this.cars, []).filter((c) => this.store.ids().has(c.id)),
  );

  constructor() {
    inject(SeoService).set({ title: 'Guardados', noindex: true });
  }

  protected browse(): void {
    void this.router.navigate(['/autos']);
  }
}
