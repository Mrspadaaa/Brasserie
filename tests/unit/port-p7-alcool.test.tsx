import { describe, expect, it } from 'vitest';
import { batchEntries } from '../../src/domain/productionCatalog';
import { lignesBilan, scoreBilan } from '../../src/ui/production/bilan/bilanModel';
import type { Batch } from '../../src/types';

/** e7a n° 1 (kp2) : la Pils en garde froide, OG 1,046 et dernier relevé 1,010, a un alcool calculable (≈ 4,7 %). */
const snap = { name: 'x', style: 'Pilsner', volumeL: 24, ogTarget: 1.05, fgTarget: 1.01, abvTarget: 5.2, hops: [] } as never;
const lot = (id: string, extra: Partial<Batch> & Record<string, unknown>): Batch =>
  ({ id, name: `ZZ ${id}`, style: 'Pilsner', volumeL: 24, status: 'garde', brewDate: '2026-10-20', recipeSnapshot: snap, ...extra }) as Batch;

describe('bilan e7a : alcool tiré de OG et FG mesurées', () => {
  const pils = lot('PILS', { og: '1,046', volumeBrewedL: 24, gravityLog: [{ date: '2026-11-02', sg: 1.02 }, { date: '2026-11-10', sg: 1.01 }] });
  const ferm = lot('FERM', { status: 'fermentation', og: '1,052', volumeBrewedL: 24, gravityLog: [{ date: '2026-11-03', sg: 1.018 }] });
  const fini = lot('FINI', { status: 'termine', og: '1,050', fg: '1,010', abv: '5,2', volumeBrewedL: 24 });
  const nu = lot('NU', { og: '1,046', volumeBrewedL: 24 });
  const entries = batchEntries([pils, ferm, fini, nu]);

  it('un lot en garde sans alcool saisi prend OG et dernier relevé : ≈ 4,7 %, à confirmer', () => {
    const l = lignesBilan(entries, 'abv');
    const p = l.find((x) => x.entry.id === 'PILS')!;
    expect(p).toBeDefined();
    expect(p.actual).toBeGreaterThanOrEqual(4.7); expect(p.actual).toBeLessThanOrEqual(4.8);
    expect(p.aConfirmer).toBe(true);
  });

  it('un lot en fermentation, FG pas encore mesurée, reste sans alcool ; sans relevé non plus (jamais 0)', () => {
    const ids = lignesBilan(entries, 'abv').map((x) => x.entry.id);
    expect(ids).not.toContain('FERM');
    expect(ids).not.toContain('NU');
  });

  it('le compte compte la Pils : 2 lots comparés', () => {
    expect(scoreBilan(lignesBilan(entries, 'abv')).n).toBe(2);
  });
});
