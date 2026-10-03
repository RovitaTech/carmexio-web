import { Service, computed, inject, resource } from '@angular/core';
import { APP_CONFIG } from '../config/app-config';
import { optional, valueOr } from '../utils/resource';
import { DealerLocation } from '../../domain/models';
import { CATALOG_REPOSITORY } from '../../domain/repositories';

/**
 * The branch this website belongs to (carmexioguanajuato.com → Carmexio Guanajuato).
 * Cars at that branch are "en Guanajuato"; cars at any other branch can be brought
 * over ("para recoger en Guanajuato"). Buyers always deal with this branch.
 */
@Service()
export class SiteStore {
  readonly site = inject(APP_CONFIG).site;
  private readonly catalog = inject(CATALOG_REPOSITORY);

  /** Public and identical for everyone → shared with hydration. */
  readonly locations = resource({
    id: 'site:locations',
    loader: () => optional(this.catalog.locations(), [] as DealerLocation[]),
  });
  readonly branch = computed(() =>
    valueOr(this.locations, []).find((l) => l.id === this.site.branchId),
  );
  readonly whatsappUrl = `https://wa.me/${this.site.whatsapp}`;

  /** Is the car physically at this site's branch? */
  isLocal(car: { locationId: string }): boolean {
    return car.locationId === this.site.branchId;
  }

  tel(phone: string): string {
    return `tel:+52${phone.replace(/\D/g, '')}`;
  }
}
