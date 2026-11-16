import { describe, expect, it } from 'vitest';
import type { Batch } from '../../src/types';
import { bouteillesMax, ecartJours, fgBande, jourCourt, palierStable, repartition, titreDeDate } from '../../src/ui/production/fiche/ficheModel';

const batch = (p: Partial<Batch>): Batch => ({ id: 'ZZ-T', name: 'ZZ test', style: 'Pils', status: 'garde', ...p } as Batch);

describe('port p1 : modèle pur de la fiche', () => {
  it('titre et jour court depuis une date suisse', () => {
    expect(titreDeDate('16.11.2026')).toBe('Lundi 16.11');
    expect(jourCourt('14.11.2026')).toEqual({ nom: 'sa', n: '14' });
    expect(titreDeDate('n’importe quoi')).toBe('—');
  });
  it('écart en jours, signé', () => {
    expect(ecartJours('08.11.2026', '14.11.2026')).toBe(6);
    expect(ecartJours('14.11.2026', '08.11.2026')).toBe(-6);
    expect(ecartJours('x', '14.11.2026')).toBeNull();
  });
  it('la bande de FG vient de la FG cible, jamais inventée', () => {
    expect(fgBande(batch({ recipeSnapshot: { fgTarget: 1.01 } as Batch['recipeSnapshot'] }))).toEqual([1.008, 1.012]);
    expect(fgBande(batch({}))).toBeNull();
  });
  it('palier stable : les derniers relevés égaux', () => {
    const b = batch({ gravityLog: [{ date: '2026-11-03', sg: 1.02 }, { date: '2026-11-06', sg: 1.01 }, { date: '2026-11-10', sg: 1.01 }, { date: '2026-11-13', sg: 1.01 }] });
    const p = palierStable(b, Date.UTC(2026, 10, 14, 12));
    expect(p?.sg).toBe(1.01);
    expect(p?.releves).toHaveLength(3);
    expect(p?.egaux).toBe(true);
    expect(palierStable(batch({}), Date.now())).toBeNull();
  });
  it('répartition : bouteilles d’abord, fût dans sa capacité, le reste est la perte', () => {
    const r = repartition(22, 6, [{ id: 'F-02', capacityL: 20 }]);
    expect(r.bouteillesL).toBeCloseTo(1.98, 2);
    expect(r.futs[0].litres).toBe(20);
    expect(r.totalL).toBeCloseTo(21.98, 2);
    expect(r.pertesL).toBeCloseTo(0.02, 2);
    expect(repartition(10, 100, []).totalL).toBe(10);
  });
  it('bouteilles qui tiennent encore', () => {
    expect(bouteillesMax(22)).toBe(66);
    expect(bouteillesMax(22, 10)).toBe(36);
    expect(bouteillesMax(1, 5)).toBe(0);
  });
});
