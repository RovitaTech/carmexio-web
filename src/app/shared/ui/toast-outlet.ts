import { Component, inject } from '@angular/core';
import { ToastStore } from '../../core/ui/toast.store';

/** Polite live region; errors are announced assertively. */
@Component({
  selector: 'cx-toast-outlet',
  template: `
    <div class="stack" aria-live="polite" aria-atomic="false">
      @for (t of store.toasts(); track t.id) {
        <div class="toast" [class]="t.tone" [attr.role]="t.tone === 'error' ? 'alert' : 'status'">
          <span>{{ t.text }}</span>
          <button type="button" aria-label="Cerrar aviso" (click)="store.dismiss(t.id)">✕</button>
        </div>
      }
    </div>
  `,
  styles: `
    .stack {
      position: fixed;
      inset: auto 16px calc(84px + env(safe-area-inset-bottom)) 16px;
      z-index: 60;
      display: grid;
      justify-items: center;
      gap: 8px;
      pointer-events: none;
    }
    @media (min-width: 768px) {
      .stack {
        inset: auto 24px 24px auto;
        justify-items: end;
      }
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 420px;
      padding: 12px 12px 12px 16px;
      border-radius: var(--cx-radius-md);
      background: var(--cx-navy);
      color: var(--cx-on-dark);
      font-weight: 600;
      box-shadow: var(--cx-elevated-shadow);
      pointer-events: auto;
      animation: in 180ms ease-out;
    }
    .toast.success {
      border-left: 4px solid var(--cx-success);
    }
    .toast.error {
      border-left: 4px solid var(--cx-error);
    }
    button {
      border: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 6px;
    }
    button:focus-visible {
      outline: 2px solid var(--cx-accent);
    }
    @keyframes in {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .toast {
        animation: none;
      }
    }
  `,
})
export class ToastOutlet {
  protected readonly store = inject(ToastStore);
}
