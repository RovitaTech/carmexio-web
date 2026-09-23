import { Component, computed, input } from '@angular/core';
import { ListingStatus, STATUS_OWNER_LABELS, STATUS_STAFF_LABELS } from '../../domain/models';

/** Listing status badge; owners and staff see different wording. */
@Component({
  selector: 'cx-status-pill',
  template: `{{ label() }}`,
  host: { '[class]': 'status()' },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: var(--cx-radius-pill);
      font-size: 0.75rem;
      font-weight: 700;
      white-space: nowrap;
      border: 1px solid currentColor;
    }
    :host(.active) {
      color: var(--cx-success-text);
      background: color-mix(in srgb, var(--cx-success) 12%, var(--cx-surface));
    }
    :host(.pending) {
      color: var(--cx-warning-text);
      background: color-mix(in srgb, var(--cx-warning) 12%, var(--cx-surface));
    }
    :host(.rejected) {
      color: var(--cx-error-text);
      background: color-mix(in srgb, var(--cx-error) 12%, var(--cx-surface));
    }
    :host(.sold) {
      color: var(--cx-text-2);
      background: var(--cx-surface-alt);
    }
  `,
})
export class StatusPill {
  readonly status = input.required<ListingStatus>();
  readonly audience = input<'owner' | 'staff'>('staff');
  protected readonly label = computed(
    () => (this.audience() === 'owner' ? STATUS_OWNER_LABELS : STATUS_STAFF_LABELS)[this.status()],
  );
}
