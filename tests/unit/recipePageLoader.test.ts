import { beforeEach, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({
  loadCatalogue: vi.fn(), RecipePage: () => null,
}));
vi.mock('../../src/pages/RecipePage', () => ({ RecipePage: fixture.RecipePage }));
vi.mock('../../src/ui/hopIndex/guideVarieties', () => ({ loadGuideVarieties: fixture.loadCatalogue }));
beforeEach(() => { vi.resetModules(); fixture.loadCatalogue.mockReset(); });

it('shares the route preparation and waits for unvisited offline references before exposing the ready surface', async () => {
  let finish!: (rows: unknown[]) => void;
  fixture.loadCatalogue.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const { loadRecipePage, preparedRecipePage } = await import('../../src/pages/recipePageLoader');
  const first = loadRecipePage();
  expect(loadRecipePage()).toBe(first);
  await vi.waitFor(() => expect(fixture.loadCatalogue).toHaveBeenCalledOnce());
  expect(preparedRecipePage()).toBeUndefined();
  finish([]);
  const page = await first;
  expect(preparedRecipePage()).toBe(page);
  expect(page.RecipePage).toBe(fixture.RecipePage);
  expect(await loadRecipePage()).toBe(page);
  expect(fixture.loadCatalogue).toHaveBeenCalledOnce();
});

it('keeps the saved reading surface available when optional documentary references cannot download', async () => {
  fixture.loadCatalogue.mockRejectedValue(Error('Catalogue hors ligne'));
  const { loadRecipePage, preparedRecipePage } = await import('../../src/pages/recipePageLoader');
  const page = await loadRecipePage();
  expect(preparedRecipePage()).toBe(page);
  expect(page.RecipePage).toBe(fixture.RecipePage);
});
