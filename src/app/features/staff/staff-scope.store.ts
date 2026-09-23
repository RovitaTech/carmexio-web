import { Injectable, computed, inject, resource, signal } from '@angular/core';
import { SessionStore } from '../../core/auth/session.store';
import { optional } from '../../core/utils/resource';
import { CATALOG_REPOSITORY } from '../../domain/repositories';

/**
 * Which branch the portal is looking at. Staff are pinned to their branch
 * (RLS `is_staff(location_id)`); admins may pick one or see all.
 * Provided once on the `/staff` route so every staff page shares it.
 */
@Injectable()
export class StaffScope {
  private readonly session = inject(SessionStore);
  private readonly catalog = inject(CATALOG_REPOSITORY);

  private readonly chosen = signal<string | undefined>(undefined);

  readonly isAdmin = computed(() => this.session.user()?.role === 'admin');
  readonly locations = resource({ loader: () => optional(this.catalog.locations(), []) });

  /** `undefined` = all branches (admins only). */
  readonly locationId = computed(() =>
    this.isAdmin() ? this.chosen() : this.session.user()?.locationId,
  );
  readonly label = computed(() => {
    const id = this.locationId();
    if (!id) return 'Todas las sucursales';
    return this.locations.value()?.find((l) => l.id === id)?.name ?? 'Mi sucursal';
  });

  select(locationId: string | undefined): void {
    if (this.isAdmin()) this.chosen.set(locationId || undefined);
  }
}
