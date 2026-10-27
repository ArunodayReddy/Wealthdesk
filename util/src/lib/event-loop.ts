/**
 * event-loop.ts — JavaScript's async core, as runnable teaching demos.
 *
 * WHERE IT IS USED: nowhere in production UI — this file exists so Arun can
 * DEMONSTRATE the event loop, callbacks, and closures in an interview, and
 * so the test suite pins the behavior (see event-loop.spec.ts). It is
 * imported by nothing at runtime except its own spec. That is deliberate:
 * learning artifacts belong in the repo, labeled as such, not smuggled into
 * production code paths.
 *
 * ---------------------------------------------------------------------------
 * THE EVENT LOOP, IN ONE PARAGRAPH (learn this cold):
 * JavaScript runs on ONE thread with a call stack. Synchronous code runs
 * first. When the stack empties, the engine drains the MICROTASK queue
 * (promise callbacks, queueMicrotask) BEFORE it takes one task from the
 * MACROTASK queue (setTimeout, setInterval, I/O). That ordering — microtasks
 * always before the next macrotask — is why a resolved promise's .then()
 * prints before a zero-delay setTimeout, every single time.
 * ---------------------------------------------------------------------------
 */

/**
 * Runs a scripted ordering experiment and returns the lines in the order
 * they actually executed. Expected result (asserted in the spec):
 *   ['sync-1', 'sync-2', 'microtask: queueMicrotask',
 *    'microtask: promise.then', 'macrotask: setTimeout']
 * Note the microtask order follows ENQUEUE order: queueMicrotask was called
 * first in the code below, so it runs first. The invariant that matters is
 * the queue boundary — every microtask runs before any macrotask.
 *
 * WHY: 'sync' lines run immediately on the call stack. The promise callback
 * and queueMicrotask callback wait in the microtask queue. The setTimeout
 * callback waits in the macrotask queue — and the engine only visits the
 * macrotask queue AFTER the microtask queue is empty. The 0ms delay does
 * NOT mean "run immediately"; it means "run as soon as the queues allow".
 */
export async function runEventLoopDemo(): Promise<string[]> {
  const lines: string[] = [];

  lines.push('sync-1');
  // queueMicrotask: explicit "run this right after the current script".
  queueMicrotask(() => lines.push('microtask: queueMicrotask'));
  // A resolved promise's .then() is also a microtask — same queue.
  void Promise.resolve().then(() =>
    lines.push('microtask: promise.then'),
  );
  // setTimeout(..., 0) is a macrotask: it waits behind ALL microtasks.
  setTimeout(() => lines.push('macrotask: setTimeout'), 0);
  lines.push('sync-2');

  // Await one macrotask tick so every queued callback has run before we
  // return. (Awaiting a setTimeout promise yields to the macrotask queue.)
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  return lines;
}

/**
 * CALLBACKS, the pre-promise style. Node convention: error-first callbacks —
 * the first argument is an error (or null), the second is the result.
 * Callbacks compose badly (nested callbacks = "callback hell") and have no
 * standard way to propagate errors up a chain — which is exactly the problem
 * promises were invented to solve.
 */
export type ErrorFirstCallback<T> = (err: Error | null, result?: T) => void;

/** Fake async work in callback style: doubles the input after a tick. */
export function doubleWithCallback(
  input: number,
  cb: ErrorFirstCallback<number>,
): void {
  setTimeout(() => {
    if (input < 0) {
      cb(new Error('input must be non-negative'));
      return;
    }
    cb(null, input * 2);
  }, 0);
}

/**
 * PROMISIFYING: wrapping a callback API in a promise. This is the bridge
 * between old callback code and modern async/await — and it is literally
 * what Node's util.promisify does. After this, callers can await it and
 * use try/catch instead of nested callbacks.
 */
export function doubleWithPromise(input: number): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    doubleWithCallback(input, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result as number);
    });
  });
}

/**
 * CLOSURES: a function PLUS the variables from the scope where it was
 * created, kept alive after that scope has returned. createCounter's `count`
 * variable is private — no code outside can touch it except through the
 * returned functions. That is how JavaScript does encapsulation without
 * classes, and it is how React hooks and Angular signal factories work
 * under the hood.
 */
export function createCounter(start = 0): {
  increment: () => number;
  value: () => number;
} {
  let count = start; // lives on in the closure after createCounter returns
  return {
    increment: () => {
      count += 1;
      return count;
    },
    value: () => count,
  };
}
