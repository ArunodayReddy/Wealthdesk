/**
 * interceptors.ts — HTTP interceptors, as functions.
 *
 * WHERE IT IS USED: registered once in app.config.ts via
 * provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])).
 * Every HttpClient request in the app passes through them, in order.
 *
 * WHY FUNCTIONS, NOT CLASSES: modern Angular interceptors are plain
 * functions (HttpInterceptorFn). No @Injectable class, no multi-provider
 * ceremony — just a function that receives the request and a `next`
 * handler. This is the current idiom; class interceptors are legacy.
 *
 * TEACHING NOTE — the chain: interceptors wrap each other like onion
 * layers. authInterceptor runs first: it CLONES the request (requests are
 * immutable — you never mutate req, you clone with changes) and attaches
 * the Authorization header. errorInterceptor runs last: it does not touch
 * the request, it translates failures on the way back. Order in the
 * withInterceptors array IS the execution order — swapping these two
 * would still work here, but in real apps (retry-after-refresh flows)
 * order is load-bearing.
 */
import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiErrorBody } from '@fidelity-portfolio-dashboard/domain';
import { AuthService } from './auth.service';

/** Attaches the demo token, if logged in. Passes through when logged out. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  if (!token) {
    return next(req);
  }
  // Requests are immutable: clone with the new header, never mutate.
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

/**
 * Translates HTTP failures into plain Errors carrying the server's message.
 * Without this, every component would repeat the same HttpErrorResponse
 * unwrapping — and most would forget, showing "[object Object]" to users.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        const body = err.error as ApiErrorBody | undefined;
        const message =
          body?.error?.message ?? `Request failed (${err.status})`;
        return throwError(() => new Error(message));
      }
      return throwError(() => err);
    }),
  );
