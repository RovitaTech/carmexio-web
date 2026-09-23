import { Service, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SessionStore } from '../../core/auth/session.store';
import { FAVORITES_REPOSITORY } from '../../domain/repositories';

/** Saved car ids for the signed-in user; optimistic toggle. */
@Service()
export class FavoritesStore {
  private readonly repo = inject(FAVORITES_REPOSITORY);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  readonly ids = signal<ReadonlySet<string>>(new Set());

  constructor() {
    effect(async () => {
      const user = this.session.user();
      this.ids.set(user ? await this.repo.ids() : new Set());
    });
  }

  has(id: string): boolean {
    return this.ids().has(id);
  }

  async toggle(id: string): Promise<void> {
    if (!this.session.isSignedIn()) {
      await this.router.navigate(['/entrar'], { queryParams: { from: this.router.url } });
      return;
    }
    const previous = this.ids();
    const next = new Set(previous);
    const adding = !next.has(id);
    adding ? next.add(id) : next.delete(id);
    this.ids.set(next);
    try {
      await (adding ? this.repo.add(id) : this.repo.remove(id));
    } catch {
      this.ids.set(previous);
    }
  }
}
