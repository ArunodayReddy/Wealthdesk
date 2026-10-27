/**
 * app.config.ts — the root application configuration.
 *
 * WHERE IT IS USED: main.ts passes this to bootstrapApplication().
 *
 * WHAT'S HERE AND WHY:
 * - provideRouter(appRoutes): the standalone replacement for
 *   RouterModule.forRoot — no NgModule anywhere in new code.
 * - provideHttpClient(withInterceptors([...])): registers the interceptor
 *   chain once, globally. ORDER MATTERS: authInterceptor runs first
 *   (attaches the token), then errorInterceptor (normalizes failures).
 *   Interceptors are a pipeline — each calls next() to hand off.
 * - provideClientHydration(withEventReplay()): the scaffold's SSR setup;
 *   the server-rendered HTML hydrates in the browser, and events fired
 *   before hydration replay instead of being lost. Kept from the scaffold
 *   because the SSR server (apps/web/server.ts) is still wired.
 */
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import {
  authInterceptor,
  errorInterceptor,
} from '@fidelity-portfolio-dashboard/data-access';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
  ],
};
