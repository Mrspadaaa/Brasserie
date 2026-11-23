import { describe, expect, it } from 'vitest';
import { completeFromLocalReferences } from '../../src/domain/localIngredientFacts';
import { pitchedYeastSource, sameYeastForTargets } from '../../src/domain/wizardSourceValues';
import type { YeastSpec } from '../../src/types';

const us05: YeastSpec = { name: 'US-05', form: 'sèche', qty: 1, unit: 'sachet' };
const completed = (yeast: YeastSpec) => completeFromLocalReferences([], [], structuredClone(yeast), [], []).yeast;

describe('levure d’une source de preuve froide (décision n°22)', () => {
  it('ignore les sept champs posés par la complétion automatique et garde ce qui est ensemencé', () => {
    const after = completed(us05);
    const changed = [...new Set([...Object.keys(us05), ...Object.keys(after)])]
      .filter(key => JSON.stringify(us05[key as keyof YeastSpec]) !== JSON.stringify(after[key as keyof YeastSpec])).sort();
    expect(changed).toEqual(['fermTempMaxC', 'fermTempMinC', 'fermentationFacts', 'hopIndexId', 'lab', 'technicalFacts', 'technicalSource']);
    expect(pitchedYeastSource(after)).toEqual(pitchedYeastSource(us05));
    expect(pitchedYeastSource(us05)).toEqual({ name: 'US-05', qty: 1, unit: 'sachet' });
  });

  it('suit le nom, la dose, l’unité, l’ensemencement, sa température et l’hypothèse d’atténuation propre', () => {
    const base = pitchedYeastSource(us05);
    const pitching = { format: 'fixture-pitching' } as unknown as YeastSpec['pitching'];
    for (const patch of [{ name: 'US-04' }, { qty: 2 }, { unit: 'g' }, { pitchTempC: 18 }, { pitching },
      { attenuationPct: 78, attenuationBasis: 'recipe' as const }, { attenuationPct: 74, attenuationBasis: 'measured' as const }]) {
      expect(pitchedYeastSource({ ...us05, ...patch })).not.toEqual(base);
    }
    // A manufacturer's declared attenuation, a stock lot, a strain or a form are readings that refine, not recipe changes.
    for (const patch of [{ attenuationPct: 81, attenuationBasis: 'declared' as const }, { stockItemRef: 'lot-us05' },
      { strain: 'Chico' }, { form: 'liquide' }, { notes: 'Note documentaire.' }]) {
      expect(pitchedYeastSource({ ...us05, ...patch })).toEqual(base);
    }
  });

  it('laisse inchangée la règle des cibles FG/ABV', () => {
    expect(sameYeastForTargets(us05, completed(us05))).toBe(true);
    expect(sameYeastForTargets(us05, { ...us05, name: 'US-04' })).toBe(false);
    expect(sameYeastForTargets({ ...us05, hopIndexId: 'fermentis-us05' }, { ...us05, hopIndexId: 'fermentis-s04' })).toBe(false);
  });
});
