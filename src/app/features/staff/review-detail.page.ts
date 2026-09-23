import { Component, computed, inject, input, linkedSignal, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ToastStore } from '../../core/ui/toast.store';
import { carSlug, formatKm, formatPrice, timeAgo } from '../../core/utils/format';
import { valueOr } from '../../core/utils/resource';
import {
  BODY_LABELS,
  Car,
  FUEL_LABELS,
  ListingFlags,
  PHOTO_ANGLES,
  PhotoAngle,
  TRANSMISSION_LABELS,
} from '../../domain/models';
import { LISTING_REPOSITORY, STAFF_REPOSITORY } from '../../domain/repositories';
import { ErrorState, ScoreRing, Skeleton } from '../../shared/ui/state-views';
import { StatusPill } from '../../shared/ui/status-pill';
import { REJECT_TEMPLATES, approvalBlockers, rejectionReason } from './review-rules';

/** One ad under review: all 11 angles side by side, details, approve / request changes. */
@Component({
  selector: 'cx-review-detail-page',
  imports: [RouterLink, ErrorState, ScoreRing, Skeleton, StatusPill],
  templateUrl: './review-detail.page.html',
  styleUrl: './review-detail.page.scss',
})
export class ReviewDetailPage {
  /** Route param `/staff/revision/:id`. */
  readonly id = input.required<string>();

  private readonly listings = inject(LISTING_REPOSITORY);
  private readonly staff = inject(STAFF_REPOSITORY);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastStore);

  protected readonly car = resource({
    params: () => this.id(),
    loader: ({ params }) => this.listings.byId(params),
  });
  protected readonly report = resource({
    params: () => this.id(),
    loader: ({ params }) => this.listings.inspection(params),
  });

  protected readonly busy = signal(false);
  /** Angles the owner must re-shoot; cleared when another ad opens. */
  protected readonly reshoot = linkedSignal<string, PhotoAngle[]>({
    source: this.id,
    computation: () => [],
  });
  protected readonly note = linkedSignal({ source: this.id, computation: () => '' });

  protected readonly photos = computed(() => {
    const car = valueOr(this.car, undefined);
    return PHOTO_ANGLES.map((angle) => {
      const index = car?.imageAngles.indexOf(angle.value) ?? -1;
      return { ...angle, url: index >= 0 ? car?.images[index] : undefined };
    });
  });
  protected readonly blockers = computed(() => {
    const car = valueOr(this.car, undefined);
    return car ? approvalBlockers(car, !!valueOr(this.report, null)) : [];
  });
  protected readonly reason = computed(() => rejectionReason(this.reshoot(), this.note()));
  protected readonly details = computed(() => {
    const c = valueOr(this.car, undefined);
    if (!c) return [];
    return [
      ['Año', String(c.year)],
      ['Versión', c.version ?? '—'],
      ['Kilometraje', formatKm(c.mileageKm)],
      ['Carrocería', BODY_LABELS[c.bodyType]],
      ['Combustible', FUEL_LABELS[c.fuelType]],
      ['Transmisión', TRANSMISSION_LABELS[c.transmission]],
      ['Motor', c.engineCc ? `${c.engineCc} cc` : '—'],
      ['Color', c.exteriorColor ?? '—'],
      ['Sucursal', c.location?.name ?? c.city],
      ['ID', c.id.toUpperCase()],
    ];
  });

  protected readonly templates = REJECT_TEMPLATES;
  protected readonly price = formatPrice;
  protected readonly ago = timeAgo;
  protected readonly slug = carSlug;

  protected toggleReshoot(angle: PhotoAngle, checked: boolean): void {
    this.reshoot.update((list) => (checked ? [...list, angle] : list.filter((a) => a !== angle)));
  }

  protected useTemplate(text: string): void {
    if (text) this.note.set(text);
  }

  protected approve(car: Car): Promise<void> {
    return this.act(() => this.staff.approve(car.id), 'Anuncio publicado.', true);
  }

  protected reject(car: Car): Promise<void> {
    return this.act(
      () => this.staff.reject(car.id, this.reason()),
      'Cambios solicitados al dueño.',
      true,
    );
  }

  protected setFlags(car: Car, flags: ListingFlags): Promise<void> {
    return this.act(() => this.staff.setFlags(car.id, flags), 'Distintivos actualizados.', false);
  }

  private async act(action: () => Promise<void>, done: string, leave: boolean): Promise<void> {
    this.busy.set(true);
    try {
      await action();
      this.toast.success(done);
      if (leave) await this.router.navigate(['/staff/revision']);
      else this.car.reload();
    } catch (e) {
      this.toast.error(e);
    } finally {
      this.busy.set(false);
    }
  }
}
