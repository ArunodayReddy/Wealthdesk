/**
 * planning.routes.ts — lazy-loaded routes for the planning feature.
 * The parent (app.routes.ts) mounts these under /planning.
 */
import { Route } from '@angular/router';
import { PlannerComponent } from './planner.component';

export const planningRoutes: Route[] = [
  { path: '', component: PlannerComponent },
];
