// LP-2 (lecture en ligne du 08.11, doc2 : facture vétérinaire à deux taux, TVA attendue 56,61 = 0,50 à 2,6 % + 56,11 à 8,1 %) : la TVA restait vide.
// Cas : la majorité des lectures écrit null (aucun total de TVA imprimé en toutes lettres) et une seule lit la somme des deux taux, recoupée par SON bloc imprimé ;
// la majorité l'emportait et la somme recoupée était perdue. Une somme recoupée par le bloc de TVA imprimé est gardée ; si aucune lecture ne la donne mais que toutes lisent le même bloc
// (chaque taux avec son montant), la somme du bloc est la TVA. Rien n'est inventé : tout vient de chiffres imprimés. Gemini n'est jamais appelé : lectures imitées (piece.ts) sur la forme de la réponse réelle de doc2.
import { describe, expect, it } from 'vitest';
import { reconcileInvoiceVision } from '../../../../functions/src/invoiceVisionReview';
import { BLOC_TVA, TVA_SOMME, lecture, lire } from './piece';

const DEUX_TAUX = [{ code: 'TVA', rate: 0.026, base: 19.2, amount: 0.5 }, { code: 'TVA', rate: 0.081, base: 692.74, amount: 56.11 }];
const reconcilie = (...tva: Array<number | null>) => reconcileInvoiceVision(tva.map(t => lire(lecture({ tvaAmount: t, vat: DEUX_TAUX, amountHT: 711.94, amountTTC: 768.55 })))) as any;

describe('LP-2 — la TVA d’une facture à deux taux n’est pas perdue', () => {
  it('deux lectures sur trois écrivent null, une lit 56,61 (= 0,50 + 56,11, recoupé par son bloc) : 56,61 est gardé', () => {
    const r = reconcilie(null, 56.61, null);
    expect(r.result.tvaAmount).toBe(56.61);
  });
  it('aucune lecture ne donne le total mais toutes lisent le même bloc à deux taux : la TVA est la somme du bloc imprimé', () => {
    const r = reconcilie(null, null);
    expect(r.result.tvaAmount).toBe(56.61);
  });
  it('un total lu qui n’est pas la somme du bloc n’est pas « recoupé » : rien n’est inventé, le désaccord reste', () => {
    const r = reconcilie(null, 40, null);
    expect(r.result.tvaAmount).not.toBe(40);
  });
  it('un bloc sans montants (pas de somme possible) : la TVA reste inconnue, pas 0', () => {
    const sansMontants = [{ code: '', rate: 0.026, base: null, amount: null }, { code: '', rate: 0.081, base: null, amount: null }];
    const r = reconcileInvoiceVision([lire(lecture({ tvaAmount: null, vat: sansMontants })), lire(lecture({ tvaAmount: null, vat: sansMontants }))]) as any;
    expect(r.result.tvaAmount).toBeNull();
  });
  it('la pièce imitée de k6 (6,55) garde son comportement', () => {
    const r = reconcileInvoiceVision([lire(lecture({ tvaAmount: TVA_SOMME, vat: BLOC_TVA })), lire(lecture({ tvaAmount: null, vat: BLOC_TVA }))]) as any;
    expect(r.result.tvaAmount).toBe(TVA_SOMME);
  });
});
