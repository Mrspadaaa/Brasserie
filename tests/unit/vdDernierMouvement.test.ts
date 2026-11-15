// Voie vd, point 9 (choix 14) : la colonne « Dernier mouvement » de la liste ≥ 900 px dit le vrai dernier mouvement, « — » sans mouvement (jamais 0).
import { describe, expect, it } from 'vitest';
import { dernierMouvementDit, mouvementsParRef } from '../../src/domain/stock/dernierMouvement';
import type { MouvementBrut } from '../../src/domain/stock/mouvementsArticle';

const malt = { ref: 'pils', currentStock: 120, unit: 'kg', supplier: 'Brouwland' };
const bruts: MouvementBrut[] = [
  { id: '1', type: 'receipt', stockItemRef: 'pils', quantity: 25, date: '2026-10-20' },
  { id: '2', type: 'inventory-adjustment', reasonCode: 'comptage', stockItemRef: 'pils', previousStock: 145, newStock: 120.5, date: '2026-11-01' },
  { id: '3', batchId: 'LOT-018', stockItemRef: 'pils', previousStock: 120.5, newStock: 120, date: '2026-11-09' },
  { id: '4', type: 'receipt', stockItemRef: 'autre', quantity: 3, date: '2026-11-10' },
];

describe('dernierMouvementDit', () => {
  it('le plus récent de l\'article, avec le nom du brassin, sa date jj.mm et sa variation signée', () => {
    const par = mouvementsParRef(bruts);
    expect(dernierMouvementDit(malt, par.get('pils') ?? [], [{ id: 'LOT-018', name: 'Blonde' }])).toBe('LOT-018 · 09.11 · −0,5 kg');
  });
  it('achat : « achat · 20.10 · +25 kg » ; inventaire à l\'écart nul : « ±0 »', () => {
    expect(dernierMouvementDit(malt, [bruts[0]])).toBe('achat · 20.10 · +25 kg');
    const inv: MouvementBrut = { id: '9', type: 'inventory-adjustment', reasonCode: 'comptage', stockItemRef: 'pils', previousStock: 120, newStock: 120, date: '2026-11-01' };
    expect(dernierMouvementDit(malt, [inv])).toBe('inventaire · 01.11 · ±0');
  });
  it('aucun mouvement : « — », jamais 0 ; la date absente n\'est pas inventée', () => {
    expect(dernierMouvementDit(malt, [])).toBe('—');
    expect(dernierMouvementDit(malt, [{ id: '5', type: 'receipt', stockItemRef: 'pils', quantity: 1 }])).toBe('achat · +1 kg');
  });
  it('mouvementsParRef ignore un mouvement sans article et ne mélange pas les articles', () => {
    const par = mouvementsParRef([...bruts, { id: '6', type: 'receipt', quantity: 1 }]);
    expect([...par.keys()].sort()).toEqual(['autre', 'pils']);
    expect(par.get('pils')).toHaveLength(3);
  });
});
