import { beforeEach, expect, it, vi } from 'vitest';
const calls = vi.hoisted(() => ({ fail: false, count: 0 }));
vi.mock('../../functions/src/hopIndexSchema', async () => {
  const actual = await vi.importActual<typeof import('../../functions/src/hopIndexSchema')>('../../functions/src/hopIndexSchema');
  return { ...actual, assertHopDocument: (...args: Parameters<typeof actual.assertHopDocument>) => {
    calls.count += 1;
    if (calls.fail) throw Error('Fixture de chargement interrompu');
    return actual.assertHopDocument(...args);
  } };
});
beforeEach(() => { vi.resetModules(); calls.count = 0; calls.fail = false; });

it('shares loading, validates the bundled catalogue once, then exposes the same offline rows synchronously', async () => {
  const { loadGuideVarieties, peekGuideVarieties } = await import('../../src/ui/hopIndex/guideVarieties');
  expect(peekGuideVarieties()).toBeUndefined();
  const first = loadGuideVarieties(), second = loadGuideVarieties();
  expect(second).toBe(first);
  const rows = await first;
  expect(rows.length).toBeGreaterThan(100);
  expect(calls.count).toBe(rows.length);
  expect(peekGuideVarieties()).toBe(rows);
  expect(await loadGuideVarieties()).toBe(rows);
  expect(calls.count).toBe(rows.length);
});

it('allows a retry after a failed preparation without caching incomplete catalogue data', async () => {
  const { loadGuideVarieties, peekGuideVarieties } = await import('../../src/ui/hopIndex/guideVarieties');
  calls.fail = true;
  await expect(loadGuideVarieties()).rejects.toThrow('interrompu');
  expect(peekGuideVarieties()).toBeUndefined();
  calls.fail = false;
  const rows = await loadGuideVarieties();
  expect(peekGuideVarieties()).toBe(rows);
  expect(rows.length).toBeGreaterThan(100);
});
