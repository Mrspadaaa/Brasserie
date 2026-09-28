import { describe, expect, it, vi } from 'vitest';
const validation = vi.hoisted(() => ({ rows: [] as unknown[] }));
vi.mock('../../functions/src/hopPredictionSchema', async () => {
  const actual = await vi.importActual<typeof import('../../functions/src/hopPredictionSchema')>('../../functions/src/hopPredictionSchema');
  return { ...actual, assertHopKnowledge: (...args: Parameters<typeof actual.assertHopKnowledge>) => {
    validation.rows.push(args[0]);
    return actual.assertHopKnowledge(...args);
  } };
});
import { yeastReferences } from '../../src/domain/yeastReferences';
import { resolveFermentationYeast } from '../../src/domain/fermentationScenario';
import { yeastRecipeCandidates } from '../../src/domain/yeastRecipeDesign';
import documented from '../../src/data/yeastRecipeReferences.json';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import { yeastCatalogueLibrary } from '../../src/domain/yeastCatalogueLibrary';

describe('existing recipe yeast references', () => {
  const stored = () => structuredClone(documented.find(y => y.id === 'wyeast-3068')!);
  const candidate = (row: unknown) => yeastRecipeCandidates('weissbier', 'balanced', yeastReferences([row as HopKnowledge]), 20).find(y => y.yeastId === 'wyeast-3068');
  it('relie le laboratoire et le code exact Wyeast 1056 à son seul produit documenté', () => {
    const recipe = { yeast: { name: 'Wyeast 1056' } } as Parameters<typeof resolveFermentationYeast>[0];
    expect(resolveFermentationYeast(recipe, yeastReferences([]))?.id).toBe('wyeast-1056');
  });
  it('enriches a valid earlier bootstrap of the exact product, preserving personal identity fields', () => {
    const row = stored(); delete row.catalogue; row.name = 'Ma 3068';
    const result = candidate(row)!;
    expect(result.reference.name).toBe('Ma 3068'); expect(result.reference.source).toEqual(row.source);
    expect(result.temperature?.range).toEqual({ min: 18, max: 24 }); expect(result.attenuation?.range).toEqual({ min: 73, max: 77 });
    expect(row.catalogue).toBeUndefined();
  });
  it('preserves a personal conflict without substituting a shipped interval', () => {
    const row = stored(), fact = row.catalogue.facts.find(f => f.key === 'temperature')!;
    row.catalogue.facts.push({ ...fact, reported: '19–23 °C', range: { min: 19, max: 23 } });
    expect(candidate(row)!.temperature).toBeUndefined();
    expect(candidate(row)!.reference.catalogue).toEqual(row.catalogue);
  });
  it('does not replace an invalid saved record or a deliberate empty catalogue', () => {
    expect(candidate({ ...stored(), catalogue: null })).toBeUndefined();
    const row = stored(); row.catalogue.facts = [];
    expect(candidate(row)!.temperature).toBeUndefined();
  });
  it('does not revalidate the exact immutable library rows, while changed personal documentary records still validate', () => {
    const library = yeastCatalogueLibrary();
    yeastReferences([]);
    validation.rows = [];
    const personal = stored(); personal.name = 'Référence personnelle corrigée';
    yeastReferences([personal]);
    const libraryRows = new Set(library);
    expect(validation.rows.some(row => libraryRows.has(row as any))).toBe(false);
    expect(validation.rows.some((row: any) => row?.id === personal.id && row?.name === personal.name)).toBe(true);
    const invalid = { ...personal, catalogue: { ...personal.catalogue } };
    // An invalid field uses the normal validator rather than the immutable cache.
    invalid.catalogue.facts = [{ ...personal.catalogue.facts[0], reported: '' }];
    expect(yeastReferences([invalid as HopKnowledge]).some(row => row.id === invalid.id)).toBe(false);
  });
});
