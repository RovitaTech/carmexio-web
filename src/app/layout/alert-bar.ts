import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentStore } from '../core/state/content.store';
import { webLink } from '../core/utils/links';
import { Icon } from '../shared/ui/icon';

const KEY = 'cx-dismissed-alert';

/** Admin-managed announcement above the header (newest live alert). */
@Component({
  selector: 'cx-alert-bar',
  imports: [RouterLink, Icon],
  template: `
    @if (alert(); as a) {
      <div
        class="bar"
        [class]="'bar ' + a.tone"
        role="region"
        aria-label="Aviso"
        i18n-aria-label="@@alert.region"
      >
        <p class="container msg">
          <span>{{ content.t(a.message) }}</span>
          @if (link(); as l) {
            @if (l.href) {
              <a [href]="l.href" target="_blank" rel="noopener"
                >{{ content.t(a.linkLabel) || more }} →</a
              >
            } @else {
              <a [routerLink]="l.path" [queryParams]="l.query"
                >{{ content.t(a.linkLabel) || more }} →</a
              >
            }
          }
        </p>
        <button type="button" class="close" (click)="dismiss(a.id)" [attr.aria-label]="closeLabel">
          <cx-icon name="close" [size]="18" />
        </button>
      </div>
    }
  `,
  styles: `
    .bar {
      position: relative;
      z-index: 45;
      color: var(--cx-on-dark);
      background: var(--cx-navy);
    }
    .bar.promo {
      background: var(--cx-gradient-primary);
    }
    .bar.warning {
      background: var(--cx-gold);
      color: var(--cx-on-gold);
    }
    .msg {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 4px 12px;
      padding-block: 9px;
      padding-right: 44px;
      color: inherit;
      font-size: 0.875rem;
      font-weight: 600;
      text-align: center;
    }
    a {
      color: inherit;
      font-weight: 800;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
    .close {
      position: absolute;
      top: 50%;
      right: 10px;
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      translate: 0 -50%;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: inherit;
      cursor: pointer;
    }
    .close:hover {
      background: var(--cx-glass);
    }
  `,
})
export class AlertBar {
  protected readonly content = inject(ContentStore);
  private readonly dismissed = signal<string | null>(null);

  protected readonly alert = computed(() =>
    this.content.alerts().find((a) => a.id !== this.dismissed()),
  );
  protected readonly link = computed(() => webLink(this.alert()?.link));
  protected readonly more = $localize`:@@alert.more:Ver más`;
  protected readonly closeLabel = $localize`:@@alert.close:Cerrar aviso`;

  constructor() {
    afterNextRender(() => this.dismissed.set(read()));
  }

  protected dismiss(id: string): void {
    this.dismissed.set(id);
    try {
      localStorage.setItem(KEY, id);
    } catch {
      // Storage blocked: dismissed for this visit only.
    }
  }
}

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
