import { DOCUMENT, PLATFORM_ID, Service, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'system' | 'light' | 'dark';
const KEY = 'cx-theme';

/** Light/dark toggle persisted per browser; `system` follows the OS. */
@Service()
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly mode = signal<ThemeMode>('system');

  init(): void {
    if (!this.isBrowser) return;
    const saved = safeGet(KEY) as ThemeMode | null;
    this.apply(saved ?? 'system');
  }

  apply(mode: ThemeMode): void {
    this.mode.set(mode);
    const root = this.document.documentElement;
    if (mode === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', mode);
    if (this.isBrowser) safeSet(KEY, mode);
  }
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode / blocked storage: theme simply isn't remembered.
  }
}
