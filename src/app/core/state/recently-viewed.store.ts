import { Service, afterNextRender, signal } from '@angular/core';

const KEY = 'cx-recently-viewed';
const MAX = 8;

/** Last cars this browser opened (newest first). Browser-only; empty on the server. */
@Service()
export class RecentlyViewedStore {
  readonly ids = signal<readonly string[]>([]);

  constructor() {
    afterNextRender(() => this.ids.set(read()));
  }

  track(id: string): void {
    const next = [id, ...this.ids().filter((x) => x !== id)].slice(0, MAX);
    this.ids.set(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage blocked: remembered for this visit only.
    }
  }
}

function read(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((v) => typeof v === 'string').slice(0, MAX) : [];
  } catch {
    return [];
  }
}
