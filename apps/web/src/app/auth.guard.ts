/**
 * auth.guard.ts — the route guard for protected pages.
 *
 * WHERE IT IS USED: app.routes.ts attaches canActivate: [authGuard] to
 * /dashboard, /accounts, /planning, and /watchlist. Unauthenticated users
 * are redirected to /login before the lazy chunk even loads.
 *
 * WHY IT LIVES IN THE APP, NOT IN feature-auth: Nx forbids statically
 * importing a library that is also lazy-loaded (the static import would
 * pull the lazy chunk into the main bundle, defeating the split). The
 * guard must be statically imported by the route table, so it lives here
 * in the shell — app-level routing policy — while feature-auth stays
 * purely lazy-loaded. This is the standard Nx answer to "guard + lazy
 * feature" and a good interview talking point.
 *
 * WHY A FUNCTIONAL GUARD: guards used to be @Injectable classes; modern
 * Angular guards are functions (CanActivateFn) using inject(). Less
 * ceremony, same power. Returning a UrlTree (instead of navigating + false)
 * lets the router perform the redirect as part of the same navigation —
 * cleaner and testable: the guard is a pure function of auth state.
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@fidelity-portfolio-dashboard/data-access';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
