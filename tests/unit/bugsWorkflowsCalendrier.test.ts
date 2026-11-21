/**
 * Bugs des workflows du 21.11 (Brasserie work/missions/2026-11-21-workflows-app/SYNTHESE.md § 1), règles de calcul. Les gestes sont joués au
 * doigt par scripts/parcours/calendrier.mjs (étape 9b).
 */
import { describe, expect, it } from 'vitest';
import { brewBudgetDemands } from '../../src/domain/finance/brewBudget';

const AUJ = '2026-11-18'; // mercredi, lundi 2026-11-16 (S47)

describe('B3 (WFR-11) : une levure sans nom ne fait pas tomber le calcul', () => {
  it('levure liée au stock, sans nom : une demande « Levure » par sa référence ; sans nom ni référence : rien', () => {
    const recette = { name: 'ZZ', volumeL: 100, fermentables: [{ name: 'Malt pilsner', weightKg: 20, kind: 'grain' }], hops: [], yeast: { stockItemRef: 'ZZ-US05', qty: 2, unit: 'sachet' } };
    const d = brewBudgetDemands(recette as never);
    expect(d.find(x => x.stockItemRef === 'ZZ-US05')).toMatchObject({ name: 'Levure', quantity: 2, unit: 'sachet' });
    const sansRef = brewBudgetDemands({ ...recette, yeast: { qty: 2, unit: 'sachet' } } as never);
    expect(sansRef.map(x => x.name)).toEqual(['Malt pilsner']);
  });
});
