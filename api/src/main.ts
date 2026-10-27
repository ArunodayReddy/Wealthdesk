/**
 * main.ts — the WealthDesk API server entry point.
 *
 * WHERE IT IS USED: built by webpack (api/webpack.config.js) and run by
 * `nx serve api` (port 3333) or by the Docker image. The Angular app never
 * talks to this file directly — it talks HTTP to /api/v1/*.
 *
 * WHY IT IS THIN: all routing lives in routes.ts, all data in data.ts, all
 * errors in errors.ts. main.ts only wires middleware in the right ORDER,
 * and middleware order in Express IS the behavior:
 *   1. express.json() — parses JSON bodies (without it, req.body is undefined).
 *   2. The /api/v1 router.
 *   3. A 404 handler for unknown /api/v1 paths (so typos get JSON, not HTML).
 *   4. The error middleware (4 arguments — that arity is how Express
 *      recognizes it as error-handling; a 3-arg function here would silently
 *      never run for errors).
 * No CORS middleware: the web app calls /api/... through the dev proxy and
 * the nginx proxy, so browser requests are same-origin by construction.
 * If a third-party client ever needs direct access, CORS gets added here,
 * deliberately, with an allow-list — never app.use(cors()) wide open.
 */
import express, { NextFunction, Request, Response } from 'express';
import { apiRouter } from './routes';
import { ApiError, toErrorBody } from './errors';

const app = express();

app.use(express.json());
app.use('/api/v1', apiRouter);

// Unknown /api/v1 path: JSON 404, not Express's default HTML page.
app.use('/api/v1', (_req: Request, res: Response) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Unknown API route' },
  });
});

// Error middleware. Must have exactly 4 parameters or Express ignores it.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    res.status(err.status).json(toErrorBody(err));
    return;
  }
  // Unexpected error: log it server-side, send a generic 500. Stack traces
  // never leave the server — they are a debugging aid, not a client API.
  console.error(err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' },
  });
});

const port = process.env.PORT || 3333;
const server = app.listen(port, async () => {
  console.log(`WealthDesk API listening at http://localhost:${port}/api/v1`);
  // Nx's serve target waits for this signal before considering the server
  // ready (used by `nx serve api` and by the e2e webServer setup).
  if (process.env.NX_READY_SIGNAL_SOCKET) {
    try {
      const load = new Function('s', 'return import(s)') as (
        s: string,
      ) => Promise<{ emitReadySignal(server: unknown): boolean }>;
      (await load('@nx/js/ready-signal')).emitReadySignal(server);
    } catch {
      // @nx/js isn't installed — the server still runs fine.
    }
  }
});
server.on('error', (error) => {
  console.error(error);
  if (!server.listening) {
    process.exit(1);
  }
});
