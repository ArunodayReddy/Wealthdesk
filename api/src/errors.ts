/**
 * errors.ts — the API's error model.
 *
 * WHERE IT IS USED: every route throws ApiError for expected failures
 * (bad input, unknown id); the error middleware in main.ts converts it to
 * the standard ApiErrorBody envelope. Unexpected errors (bugs) are caught
 * by the same middleware and returned as 500 without leaking internals.
 *
 * WHY IT EXISTS: without a shared error type, each route invents its own
 * status codes and shapes, and clients can't program against failures.
 * One type, one envelope, one place to change the contract.
 */
import { ApiErrorBody } from '@fidelity-portfolio-dashboard/domain';

/** An expected failure with an HTTP status and a machine-readable code. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function notFound(what: string): ApiError {
  return new ApiError(404, 'NOT_FOUND', `${what} was not found`);
}

export function badRequest(message: string, details?: string[]): ApiError {
  return new ApiError(400, 'VALIDATION_ERROR', message, details);
}

/** Shape the error middleware sends. Never includes stack traces. */
export function toErrorBody(err: ApiError): ApiErrorBody {
  return {
    error: {
      code: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    },
  };
}
