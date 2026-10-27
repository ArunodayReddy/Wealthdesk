/**
 * event-loop.spec.ts — tests that pin JavaScript's async ordering.
 *
 * WHAT THIS PROVES: microtasks run before macrotasks, always. If you can
 * explain WHY this test passes, you can explain the event loop in an
 * interview — the test is the explanation, executable.
 */
import {
  createCounter,
  doubleWithCallback,
  doubleWithPromise,
  runEventLoopDemo,
} from './event-loop';

describe('runEventLoopDemo', () => {
  it('orders sync, then microtasks, then macrotasks', async () => {
    // queueMicrotask was called BEFORE .then() in the demo, so its
    // callback sits earlier in the microtask queue and runs first.
    // Microtasks run in ENQUEUE order; the queue itself always drains
    // before any macrotask.
    await expect(runEventLoopDemo()).resolves.toEqual([
      'sync-1',
      'sync-2',
      'microtask: queueMicrotask',
      'microtask: promise.then',
      'macrotask: setTimeout',
    ]);
  });
});

describe('callbacks vs promises', () => {
  it('doubleWithCallback follows the error-first convention', (done) => {
    doubleWithCallback(21, (err, result) => {
      expect(err).toBeNull();
      expect(result).toBe(42);
      done();
    });
  });

  it('doubleWithCallback reports errors through the first argument', (done) => {
    doubleWithCallback(-1, (err, result) => {
      expect(err).toBeInstanceOf(Error);
      expect(result).toBeUndefined();
      done();
    });
  });

  it('doubleWithPromise lets callers await and try/catch', async () => {
    await expect(doubleWithPromise(21)).resolves.toBe(42);
    await expect(doubleWithPromise(-1)).rejects.toThrow(
      'input must be non-negative',
    );
  });
});

describe('createCounter (closures)', () => {
  it('keeps state private between instances', () => {
    const a = createCounter();
    const b = createCounter(100);
    expect(a.increment()).toBe(1);
    expect(a.increment()).toBe(2);
    expect(b.value()).toBe(100); // a's increments never touched b
    expect(a.value()).toBe(2);
  });
});
