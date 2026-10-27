/**
 * watchlist.routes.ts — lazy-loaded routes for the watchlist feature.
 * The parent (app.routes.ts) mounts these under /watchlist.
 */
import { Route } from '@angular/router';
import { WatchlistComponent } from './watchlist.component';

export const watchlistRoutes: Route[] = [
  { path: '', component: WatchlistComponent },
];
