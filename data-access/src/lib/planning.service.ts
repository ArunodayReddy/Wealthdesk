/**
 * planning.service.ts — the projection submit pipeline.
 *
 * WHERE IT IS USED: the planner component calls submit(); the component
 * reads result/loading/error signals to render. It never touches HttpClient.
 *
 * TEACHING NOTE — exhaustMap, the double-submit guard: submit() pushes into
 * a Subject; exhaustMap subscribes to the API call for the FIRST submit and
 * IGNORES every further submit until that call completes. Double-clicking
 * "Project" fires one request, not two — and the second click is dropped
 * silently, which is exactly right for a non-idempotent-feeling action.
 * (Compare: switchMap would CANCEL the first and start a second;
 * mergeMap would run BOTH; concatMap would QUEUE the second. Only
 * exhaustMap says "I'm busy, your click waits" — the correct semantics
 * for submits and logins.)
 *
 * TEACHING NOTE — stream survival: if the API call errors and nothing
 * catches it, the exhaustMap pipeline DIES and every later submit is
 * ignored forever. The catchError(() => EMPTY) after tap's error handler
 * swallows the failure into an empty stream, so the pipeline stays alive
 * for the next submit. Forgetting this is the most common exhaustMap bug.
 */
import { inject, Injectable, signal } from '@angular/core';
import { Subject, catchError, EMPTY, exhaustMap, tap } from 'rxjs';
import {
  ProjectionInput,
  ProjectionResult,
} from '@fidelity-portfolio-dashboard/domain';
import { ApiClient } from './api-client';

@Injectable({ providedIn: 'root' })
export class PlanningService {
  private readonly api = inject(ApiClient);

  private readonly submitSubject = new Subject<ProjectionInput>();

  readonly result = signal<ProjectionResult | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.submitSubject
      .pipe(
        exhaustMap((input) => {
          this.loading.set(true);
          this.error.set(null);
          return this.api.postProjection(input).pipe(
            tap({
              next: (r) => {
                this.result.set(r);
                this.loading.set(false);
              },
              error: (e: Error) => {
                this.error.set(e.message);
                this.loading.set(false);
              },
            }),
            // Keep the pipeline alive after a failure (see note above).
            catchError(() => EMPTY),
          );
        }),
      )
      .subscribe();
  }

  /** Enqueue a projection request. Ignored while one is in flight. */
  submit(input: ProjectionInput): void {
    this.submitSubject.next(input);
  }
}
