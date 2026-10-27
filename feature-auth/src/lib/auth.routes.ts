/**
 * auth.routes.ts — the lazy-loaded routes for the auth feature.
 *
 * WHERE IT IS USED: app.routes.ts lazy-loads this array for the /login
 * path. Lazy loading means the login code ships in its own chunk, fetched
 * only when the user visits /login — the dashboard chunk stays smaller.
 */
import { Route } from '@angular/router';
import { LoginComponent } from './login.component';

export const authRoutes: Route[] = [
  { path: '', component: LoginComponent },
];
