import { DestroyRef, PLATFORM_ID, Service, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AppUser, ProfileChanges } from '../../domain/models';
import { AUTH_REPOSITORY } from '../../domain/repositories';
import { errorMessage } from '../utils/errors';

/** App-wide session (ViewModel for auth). Guests have `user() === null`. */
@Service()
export class SessionStore {
  private readonly repo = inject(AUTH_REPOSITORY);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = signal<AppUser | null>(null);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly isSignedIn = computed(() => this.user() !== null);
  readonly isStaff = computed(() => {
    const role = this.user()?.role;
    return role === 'staff' || role === 'admin';
  });

  /**
   * App initializer: loads the current session and, in the browser, follows
   * changes made outside the app (token expiry, sign-out in another tab).
   * On the server every render is a guest render.
   */
  async restore(): Promise<void> {
    this.user.set(await this.repo.current().catch(() => null));
    if (isPlatformBrowser(this.platformId)) {
      const stop = this.repo.onChange((user) => this.user.set(user));
      this.destroyRef.onDestroy(stop);
    }
  }

  signIn(email: string, password: string) {
    return this.run(async () => this.user.set(await this.repo.signIn(email, password)));
  }

  /** Resolves `true` when the account still needs email confirmation. */
  async signUp(fullName: string, email: string, phone: string, password: string) {
    let needsConfirmation = false;
    const ok = await this.run(async () => {
      const user = await this.repo.signUp(fullName, email, phone, password);
      needsConfirmation = user === null;
      this.user.set(user);
    });
    return ok && needsConfirmation;
  }

  resetPassword(email: string) {
    return this.run(() => this.repo.resetPassword(email));
  }

  updateProfile(changes: ProfileChanges) {
    return this.run(async () => this.user.set(await this.repo.updateProfile(changes)));
  }

  async signOut(): Promise<void> {
    await this.repo.signOut();
    this.user.set(null);
  }

  /** Runs an action, exposing `busy`/`error`; resolves `true` on success. */
  private async run(action: () => Promise<unknown>): Promise<boolean> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await action();
      return true;
    } catch (e) {
      this.error.set(errorMessage(e));
      return false;
    } finally {
      this.busy.set(false);
    }
  }
}
