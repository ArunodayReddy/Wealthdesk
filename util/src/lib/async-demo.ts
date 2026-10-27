/**
 * async-demo.ts — async/await patterns, as runnable teaching demos.
 *
 * WHERE IT IS USED: nowhere in production UI — like event-loop.ts, this
 * file exists so Arun can DEMONSTRATE async/await in an interview, with
 * the behavior pinned by async-demo.spec.ts. It is imported by nothing at
 * runtime except its own spec. (Real async/await also appears in
 * production code: api/src/main.ts awaits the Nx ready-signal, and
 * tools/generators/feature-lib/generator.ts awaits formatFiles.)
 *
 * ---------------------------------------------------------------------------
 * ASYNC/AWAIT, IN ONE PARAGRAPH (learn this cold):
 * An async function ALWAYS returns a promise. `await` pauses the function
 * until the promise settles, then resumes it with the value (or throws the
 * rejection, so try/catch works like synchronous code). Nothing blocks the
 * thread while awaiting — other code runs. And async/await is NOT a new
 * concurrency model: it is syntax sugar over promises. Every async
 * function below could be rewritten as a .then() chain; await just reads
 * like the synchronous version.
 * ---------------------------------------------------------------------------
 */

import { doubleWithPromise } from './event-loop';

/** Sequential await: each step waits for the previous one. Total time
 *  adds up (tick + tick). Use when step B needs step A's result. */
export async function doubleTwiceSequential(input: number): Promise<number> {
  const once = await doubleWithPromise(input);
  const twice = await doubleWithPromise(once);
  return twice;
}

/** Parallel await: Promise.all starts both operations, then awaits both.
 *  Total time is the SLOWEST single operation, not the sum. Use when the
 *  operations are independent — this is the most common async/await
 *  performance win, and the most commonly missed one. */
export async function doubleTwoParallel(
  a: number,
  b: number,
): Promise<[number, number]> {
  const [ra, rb] = await Promise.all([
    doubleWithPromise(a),
    doubleWithPromise(b),
  ]);
  return [ra, rb];
}

/** Error handling: a rejected await THROWS inside the async function, so
 *  ordinary try/catch applies — no .catch() chain, no error-first
 *  callback. The function converts the failure into a fallback value
 *  instead of propagating it. */
export async function doubleOrFallback(input: number): Promise<number> {
  try {
    return await doubleWithPromise(input);
  } catch {
    return 0;
  }
}

/** The desugar equivalence: this .then() chain is EXACTLY what
 *  doubleTwiceSequential compiles to. If an interviewer asks "what does
 *  await do under the hood," this is the answer: it suspends the function
 *  and registers the rest as a .then() callback. */
export function doubleTwiceChained(input: number): Promise<number> {
  return doubleWithPromise(input).then((once) => doubleWithPromise(once));
}
