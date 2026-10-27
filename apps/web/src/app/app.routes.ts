/**
 * app.routes.ts — the root route table.
 *
 * WHERE IT IS USED: app.config.ts passes this to provideRouter().
 *
 * WHY LAZY LOAD BY FEATURE: each feature's code ships as its own chunk,
 * fetched on first visit. The initial bundle stays small (shell + router
 * only), and a change to the planner doesn't invalidate the dashboard's
 * cached chunk. loadChildren with a dynamic import is how Angular expresses
 * this: the import() is a code-split point for webpack.
 *
 * WHY GUARDS SIT ON THE PARENT ROUTE: canActivate runs BEFORE the lazy
 * chunk loads, so an unauthenticated user never downloads protected
 * feature code at all — the guard is both a UX redirect and a (thin)
 * code-privacy boundary. Real security still lives on the server.
 */
import { Route } from '@angular/router';
import { authGuard } from './auth.guard';

export const appRoutes: Route[] = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadChildren: () =>
      import('@fidelity-portfolio-dashboard/feature-auth').then(
        (m) => m.authRoutes,
      ),
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('@fidelity-portfolio-dashboard/feature-dashboard').then(
        (m) => m.dashboardRoutes,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'accounts',
    loadChildren: () =>
      import('@fidelity-portfolio-dashboard/feature-accounts').then(
        (m) => m.accountsRoutes,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'planning',
    loadChildren: () =>
      import('@fidelity-portfolio-dashboard/feature-planning').then(
        (m) => m.planningRoutes,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'watchlist',
    loadChildren: () =>
      import('@fidelity-portfolio-dashboard/feature-watchlist').then(
        (m) => m.watchlistRoutes,
      ),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'dashboard' },
];
