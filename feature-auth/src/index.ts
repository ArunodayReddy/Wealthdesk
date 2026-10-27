/**
 * feature-auth — public API.
 *
 * WHERE IT IS USED: app.routes.ts lazy-loads authRoutes. Nothing else
 * imports this lib — auth is an entry point, not a shared dependency, so
 * it stays out of other features' graphs. The route guard intentionally
 * lives in the app shell (apps/web/src/app/auth.guard.ts), not here: Nx
 * forbids statically importing a lazy-loaded library, and the route table
 * must statically import the guard.
 */
export * from './lib/login.component';
export * from './lib/auth.routes';
