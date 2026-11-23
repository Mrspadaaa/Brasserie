// D213 (« oui attention au unités ») : l'unité imprimée est gardée telle quelle, un prix se lit pour son unité,
// une ligne sans unité lisible n'est reliée à rien. Cas ajoutés à la voie l1-lecture.
import { describe, expect, it } from 'vitest';
import { normalizeInvoiceScan } from '../../../../functions/src/invoiceScanCore';
import { entete, lecture372765, ligne, trouve, verite372765 } from './aide';

const lire = (items: any[]) => normalizeInvoiceScan(entete({ items })) as any;

describe('D213 — l’unité imprimée est gardée, jamais réécrite en silence', () => {
  it('sa facture : « Kg », « Stk » et « g » sortent exactement comme imprimés', () => {
    const r = normalizeInvoiceScan(lecture372765()) as any;
    verite372765().lignes.forEach((vraie: any, i: number) => expect(r.items[i].unit).toBe(vraie.unite));
    expect(new Set(r.items.map((i: any) => i.unit))).toEqual(new Set(['Kg', 'g', 'Stk']));
  });

  it('seuls les espaces de bord sont retirés : pas de « kg », de « sachet » ni de conversion', () => {
    const r = lire([ligne({ unit: ' Kg ' }), ligne({ name: 'Levure', unit: 'Stk' }), ligne({ name: 'Houblon', unit: 'g', quantity: 100, price: 0.01, amountTTC: 1 })]);
    expect(r.items.map((i: any) => i.unit)).toEqual(['Kg', 'Stk', 'g']);
    expect(r.items[2].quantity).toBe(100);
  });
});

describe('D213 — un prix se lit pour son unité (par 100 g, par kg), jamais comparé à une autre unité', () => {
  it('quantité en g, prix par kg : 250 g × 8,00 = 2,00 → inverifiable, pas un écart', () => {
    const r = lire([ligne({ unit: 'g', quantity: 250, price: 8, amountTTC: 2 })]);
    expect(trouve(r.points, 'ligne-montant')).toEqual([]);
    expect(trouve(r.points, 'ligne-prix-par-lot')).toHaveLength(1);
    expect(r.items[0]).toMatchObject({ unit: 'g', quantity: 250, price: 8, amountTTC: 2 });
  });

  it('quantité en g, prix par 100 g : 250 g × 8,00 = 20,00 → inverifiable', () => {
    expect(trouve(lire([ligne({ unit: 'g', quantity: 250, price: 8, amountTTC: 20 })]).points, 'ligne-prix-par-lot')).toHaveLength(1);
  });

  it('quantité en kg, prix par 100 g : 2 kg × 8,00 = 160,00 → inverifiable', () => {
    const r = lire([ligne({ unit: 'Kg', quantity: 2, price: 8, amountTTC: 160 })]);
    expect(trouve(r.points, 'ligne-prix-par-lot')).toHaveLength(1);
    expect(trouve(r.points, 'ligne-montant')).toEqual([]);
  });

  it('un vrai écart de chiffre (60 Kg lus pour 6) reste un écart, pas un prix par lot', () => {
    const r = lire([ligne({ unit: 'Kg', quantity: 60, price: 2.3, amountTTC: 13.8 })]);
    expect(trouve(r.points, 'ligne-montant')).toHaveLength(1);
    expect(trouve(r.points, 'ligne-prix-par-lot')).toEqual([]);
  });

  it('un prix par lot est une ligne non vérifiée, comptée et nommée', () => {
    const r = lire([ligne({ unit: 'g', quantity: 250, price: 8, amountTTC: 20 })]);
    expect(r.controls.lines).toEqual({ checked: 0, failed: 0, skipped: 1, skippedIds: ['line-1'] });
  });
});

describe('D213 — une ligne sans unité lisible n’est reliée à rien', () => {
  it('une ligne de stock sans unité : point inverifiable, l’unité reste vide (jamais « kg » deviné)', () => {
    const r = lire([ligne({ unit: '', quantity: 5, price: 2, amountTTC: 10 })]);
    expect(trouve(r.points, 'unite-absente')).toEqual([expect.objectContaining({ gravite: 'inverifiable', ligne: 1, enjeu: 'stock', luTexte: '' })]);
    expect(r.items[0].unit).toBe('');
    expect(r.issues.join(' ')).toContain('aucun stock automatique');
  });

  it('une ligne de stock sans quantité : même point', () => {
    expect(trouve(lire([ligne({ quantity: null, price: null, amountTTC: null })]).points, 'unite-absente')).toHaveLength(1);
  });

  it('un port ou une pièce de matériel sans unité est normal : aucun point', () => {
    const r = lire([ligne({ kind: 'shipping', name: 'Port', unit: '', quantity: null, price: null, amountTTC: 5 }), ligne({ kind: 'equipment', name: 'Fermenteur', unit: '', quantity: 1, price: 5, amountTTC: 5 })]);
    expect(trouve(r.points, 'unite-absente')).toEqual([]);
  });

  it('sa facture : toutes les lignes ont une unité, aucun point d’unité', () => {
    expect(trouve((normalizeInvoiceScan(lecture372765()) as any).points, 'unite-absente')).toEqual([]);
  });
});
