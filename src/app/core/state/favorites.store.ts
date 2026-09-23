import { Service, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SessionStore } from '../auth/session.store';
import { ToastStore } from '../ui/toast.store';
import { FAVORITES_REPOSITORY } from '../../domain/repositories';

/** Saved car ids for the signed-in user; optimistic toggle. */
@Service()
export class FavoritesStore {
  private readonly repo = inject(FAVORITES_REPOSITORY);
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastStore);

  readonly ids = signal<ReadonlySet<string>>(new Set());

  constructor() {
    effect((onCleanup) => {
      const user = this.session.user();
      if (!user) {
        this.ids.set(new Set());
        return;
      }
      let stale = false;
      onCleanup(() => (stale = true));
      this.repo
        .ids()
        .then((ids) => stale || this.ids.set(ids))
        .catch(() => undefined);
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
    if (adding) next.add(id);
    else next.delete(id);
    this.ids.set(next);
    try {
      await (adding ? this.repo.add(id) : this.repo.remove(id));
    } catch (e) {
      this.ids.set(previous);
      this.toast.error(e, 'No pudimos actualizar tus guardados.');
    }
  }
}
