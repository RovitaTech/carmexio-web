import { Component, computed, input } from '@angular/core';
import { liveStatus } from '../../../domain/content';

const LABELS = {
  live: 'En el sitio',
  scheduled: 'Programado',
  expired: 'Vencido',
  off: 'Oculto',
} as const;

/** Whether an ad / alert / offer is showing on the public site right now. */
@Component({
  selector: 'cx-live-badge',
  template: `{{ label() }}`,
  host: { '[class]': 'status()' },
  styles: `
    :host {
      display: inline-flex;
      padding: 3px 10px;
      border: 1px solid currentColor;
      border-radius: var(--cx-radius-pill);
      font-size: 0.75rem;
      font-weight: 700;
      white-space: nowrap;
    }
    :host(.live) {
      color: var(--cx-success-text);
    }
    :host(.scheduled) {
      color: var(--cx-primary-text);
    }
    :host(.expired) {
      color: var(--cx-warning-text);
    }
    :host(.off) {
      color: var(--cx-text-2);
    }
  `,
})
export class LiveBadge {
  readonly item = input.required<{ isActive: boolean; startsAt?: string; endsAt?: string }>();
  protected readonly status = computed(() => liveStatus(this.item()));
  protected readonly label = computed(() => LABELS[this.status()]);
}
