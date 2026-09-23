import { Service, signal } from '@angular/core';
import { errorMessage } from '../utils/errors';

export type ToastTone = 'info' | 'success' | 'error';

export interface Toast {
  id: number;
  tone: ToastTone;
  text: string;
}

const DURATION_MS = 4000;

/** App-wide transient messages, rendered by `<cx-toast-outlet>` in the shell. */
@Service()
export class ToastStore {
  private nextId = 0;
  readonly toasts = signal<readonly Toast[]>([]);

  show(text: string, tone: ToastTone = 'info'): void {
    const id = ++this.nextId;
    this.toasts.update((list) => [...list.slice(-2), { id, tone, text }]);
    setTimeout(() => this.dismiss(id), DURATION_MS);
  }

  success(text: string): void {
    this.show(text, 'success');
  }

  /** Shows the repository's message (or a generic one) for a failed action. */
  error(error: unknown, fallback?: string): void {
    this.show(errorMessage(error, fallback), 'error');
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
