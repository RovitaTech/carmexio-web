import { Component, computed, input, output } from '@angular/core';
import { errorMessage } from '../../core/utils/errors';

@Component({
  selector: 'cx-empty-state',
  template: `
    <div class="icon" aria-hidden="true">{{ icon() }}</div>
    <h3>{{ title() }}</h3>
    <p>{{ message() }}</p>
    @if (actionLabel()) {
      <button class="btn primary" type="button" (click)="action.emit()">{{ actionLabel() }}</button>
    }
  `,
  styles: `
    :host {
      display: grid;
      justify-items: center;
      gap: 10px;
      padding: 48px 20px;
      text-align: center;
    }
    .icon {
      display: grid;
      place-items: center;
      width: 88px;
      height: 88px;
      border-radius: 50%;
      background: var(--cx-primary-soft);
      color: var(--cx-primary-text);
      font-size: 2.2rem;
    }
    p {
      max-width: 360px;
    }
    button {
      margin-top: 8px;
    }
  `,
})
export class EmptyState {
  readonly icon = input('🚗');
  readonly title = input.required<string>();
  readonly message = input('');
  readonly actionLabel = input<string>();
  readonly action = output<void>();
}

/** Failed primary content: the repository's message plus a retry button. */
@Component({
  selector: 'cx-error-state',
  imports: [EmptyState],
  template: `
    <cx-empty-state
      icon="⚠️"
      [title]="title()"
      [message]="message()"
      i18n-actionLabel="@@common.retry"
      actionLabel="Reintentar"
      (action)="retry.emit()"
    />
  `,
})
export class ErrorState {
  readonly error = input<unknown>();
  readonly title = input($localize`:@@error.section:No pudimos cargar esta sección`);
  readonly retry = output<void>();
  protected readonly message = computed(() =>
    errorMessage(
      this.error(),
      $localize`:@@error.connection:Revisa tu conexión e intenta de nuevo.`,
    ),
  );
}

@Component({
  selector: 'cx-skeleton',
  template: '',
  host: { '[style.height]': 'height()', '[style.border-radius]': 'radius()' },
  styles: `
    :host {
      display: block;
      width: 100%;
      background: linear-gradient(
        90deg,
        var(--cx-surface-alt) 25%,
        var(--cx-surface) 50%,
        var(--cx-surface-alt) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.2s infinite linear;
    }
    @keyframes shimmer {
      to {
        background-position: -200% 0;
      }
    }
  `,
})
export class Skeleton {
  readonly height = input('16px');
  readonly radius = input('10px');
}

@Component({
  selector: 'cx-score-ring',
  template: `
    <svg
      viewBox="0 0 36 36"
      [attr.width]="size()"
      [attr.height]="size()"
      role="img"
      [attr.aria-label]="ariaLabel()"
    >
      <circle
        cx="18"
        cy="18"
        r="15.9"
        fill="none"
        stroke="var(--cx-surface-alt)"
        stroke-width="3"
      />
      <circle
        cx="18"
        cy="18"
        r="15.9"
        fill="none"
        [attr.stroke]="color()"
        stroke-width="3"
        stroke-linecap="round"
        [attr.stroke-dasharray]="score() * 10 + ' 100'"
        transform="rotate(-90 18 18)"
      />
      <text x="18" y="21" text-anchor="middle" font-size="9" font-weight="800" fill="currentColor">
        {{ score().toFixed(1) }}
      </text>
    </svg>
  `,
})
export class ScoreRing {
  readonly score = input.required<number>();
  readonly size = input(64);
  protected readonly ariaLabel = computed(
    () => $localize`:@@score.aria:Calificación ${this.score()}:score: de 10`,
  );
  protected color() {
    const s = this.score();
    return s >= 8.5 ? 'var(--cx-success)' : s >= 7 ? 'var(--cx-warning)' : 'var(--cx-error)';
  }
}
