// Rejeu en ligne ff0f822e (08.11), RL-4 : le choix d'unité d'une fiche article proposait « g », « kg » et « Kg » : deux graphies pour la même unité.
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/services/storage', async () => {
  const actual = await vi.importActual<typeof import('../../../src/services/storage')>('../../../src/services/storage');
  const stocks = { rawMaterials: [{ unit: 'Kg' }, { unit: 'G' }, { unit: 'sachet' }, { unit: 'Sachet' }, { unit: 'Stk' }], cleaning: [{ unit: 'l' }], equipment: [], kegs: [] };
  return { ...actual, StorageService: { ...actual.StorageService, getStocks: () => stocks } };
});

const { Suggestions } = await import('../../../src/services/suggestions');

describe('RL-4 — une seule écriture par unité', () => {
  it('« Kg » et « kg » se confondent en « kg » ; « G » en « g » ; « l » en « L » ; « Sachet » en « sachet »', () => {
    const unites = Suggestions.knownUnits();
    expect(unites.filter((u) => u.toLowerCase() === 'kg')).toEqual(['kg']);
    expect(unites.filter((u) => u.toLowerCase() === 'g')).toEqual(['g']);
    expect(unites.filter((u) => u.toLowerCase() === 'l')).toEqual(['L']);
    expect(unites.filter((u) => u.toLowerCase() === 'sachet')).toEqual(['sachet']);
    expect(unites).toContain('Stk');
  });
});
