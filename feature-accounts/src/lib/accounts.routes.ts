/**
 * accounts.routes.ts — lazy-loaded routes for the accounts feature.
 * The parent (app.routes.ts) mounts these under /accounts.
 */
import { Route } from '@angular/router';
import { AccountsComponent } from './accounts.component';

export const accountsRoutes: Route[] = [
  { path: '', component: AccountsComponent },
];
