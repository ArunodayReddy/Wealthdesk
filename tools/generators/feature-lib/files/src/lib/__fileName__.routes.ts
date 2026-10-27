/**
 * <%= fileName %>.routes.ts — lazy-loaded routes for the <%= fileName %>
 * feature. The parent (app.routes.ts) mounts these under /<%= fileName %>.
 */
import { Route } from '@angular/router';
import { <%= className %>Component } from './<%= fileName %>.component';

export const <%= propertyName %>Routes: Route[] = [
  { path: '', component: <%= className %>Component },
];
