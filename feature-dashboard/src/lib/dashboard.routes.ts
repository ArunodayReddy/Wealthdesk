/**
 * dashboard.routes.ts — lazy-loaded routes for the dashboard feature.
 * The parent (app.routes.ts) mounts these under /dashboard.
 */
import { Route } from '@angular/router';
import { DashboardComponent } from './dashboard.component';

export const dashboardRoutes: Route[] = [
  { path: '', component: DashboardComponent },
];
