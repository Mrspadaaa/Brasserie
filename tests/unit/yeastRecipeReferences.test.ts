import { describe, expect, it } from 'vitest';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { yeastRecipeCandidates } from '../../src/domain/yeastRecipeDesign';
import documented from '../../src/data/yeastRecipeReferences.json';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';

describe('existing recipe yeast references', () => {
  const stored = () => structuredClone(documented.find(y => y.id === 'wyeast-3068')!);
  const candidate = (row: unknown) => yeastRecipeCandidates('weissbier', 'balanced', yeastReferences([row as HopKnowledge]), 20).find(y => y.yeastId === 'wyeast-3068');
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
});
