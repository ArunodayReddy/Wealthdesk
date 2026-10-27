/**
 * async-demo.spec.ts — pins the async/await behaviors from async-demo.ts.
 * Jest supports async tests natively: return/await the promise and Jest
 * waits for it. A test that forgets to await passes vacuously — these
 * tests await everything, so a failure is real.
 */
import {
  doubleOrFallback,
  doubleTwiceChained,
  doubleTwoParallel,
  doubleTwiceSequential,
} from './async-demo';

describe('async/await demos', () => {
  it('doubles twice sequentially (2 → 4 → 8)', async () => {
    await expect(doubleTwiceSequential(2)).resolves.toBe(8);
  });

  it('doubles two values in parallel', async () => {
    await expect(doubleTwoParallel(3, 5)).resolves.toEqual([6, 10]);
  });

  it('falls back to 0 on rejection instead of throwing', async () => {
    await expect(doubleOrFallback(-1)).resolves.toBe(0);
  });

  it('sequential await and .then() chain agree', async () => {
    const viaAwait = await doubleTwiceSequential(4);
    const viaChain = await doubleTwiceChained(4);
    expect(viaAwait).toBe(16);
    expect(viaChain).toBe(16);
  });
});
