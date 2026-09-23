import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from './session.store';

/** Sends guests to /entrar and back afterwards. */
export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionStore);
  return session.isSignedIn()
    ? true
    : inject(Router).createUrlTree(['/entrar'], { queryParams: { from: state.url } });
};

/** Admin panel: role `admin` only; everyone else signs in at /admin/entrar. */
export const adminGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionStore);
  return session.isAdmin()
    ? true
    : inject(Router).createUrlTree(['/admin/entrar'], { queryParams: { from: state.url } });
};

/** Staff portal: Carmexio staff and admins only. */
export const staffGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionStore);
  if (session.isStaff()) return true;
  return inject(Router).createUrlTree(session.isSignedIn() ? ['/'] : ['/entrar'], {
    queryParams: session.isSignedIn() ? {} : { from: state.url },
  });
};
