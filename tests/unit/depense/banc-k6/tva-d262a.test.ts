// D262a (01.11, nuit) : « le ht, TVA semble pas super fonctionné comme illustré dans la capture ». La TVA imprimée est juste, la tuile porte ④.
// Cause prouvée ici : la règle du bloc TVA (`vatBlockCheck`, `totalsCheck`) ne lève RIEN sur la pièce imitée, lue seule ; c'est le rapprochement
// des deux Flash-Lite (`reconcileInvoiceVision`, boucle d'en-tête) qui pose un point « lectures-divergentes » sur `tvaAmount` quand l'une lit la somme
// des deux lignes de TVA et l'autre `null` (aucun total de TVA n'est imprimé : les deux lectures se défendent). Avec 2 lectures il n'y a jamais de majorité
// et le point pèse (`pese: true`) : tuile ④ « TVA » et « Référence et TVA du document : À vérifier ».
// Les tests « Correctif posé » sont le contrat du correctif posé le 01.11 (k6-correctifs) ; les autres décrivent ce qui est juste déjà.
import { describe, expect, it } from 'vitest';
import { reconcileInvoiceVision } from '../../../../functions/src/invoiceVisionReview';
import { invoiceFieldHints } from '../../../../src/services/purchasePrefill';
import { chipsDeLecture } from '../../../../src/ui/depense/etat';
import { BLOC_TVA, TVA_SOMME, items, lecture, lire, sommeLignes, trouve } from './piece';

const reconcilie = (a: any, b: any) => reconcileInvoiceVision([lire(a), lire(b)]);
const pointsTva = (points: any[]) => points.filter(p => p.pese && (['tva-incoherente', 'ht-tva-ttc', 'taux-tva-hors-plage'].includes(p.code) || /tva/i.test(p.champ) || p.champ === 'vat'));

describe('D262a — la règle de TVA, sur une pièce imitée (TVA comprise, deux taux, port, total arrondi)', () => {
  it('une lecture seule : ni tva-incoherente ni ht-tva-ttc (le bloc imprimé par taux sans base ne se contredit pas)', () => {
    const r = lire(lecture());
    expect(trouve(r.points, 'tva-incoherente')).toEqual([]);
    expect(trouve(r.points, 'ht-tva-ttc')).toEqual([]);
    expect(r.controls.vat.statut).not.toBe('ecart');
  });

  it('un port hors taux n’est pas une relation de TVA : ajouter ou retirer la ligne de port ne lève rien', () => {
    const sansPort = items().slice(0, -1);
    expect(trouve(lire(lecture({}, sansPort)).points, 'tva-incoherente')).toEqual([]);
  });

  it('deux lectures qui lisent la même TVA : aucun point de TVA, statut vérifié', () => {
    const r = reconcilie(lecture(), lecture());
    expect(pointsTva((r.result as any).points)).toEqual([]);
  });

  it('Correctif posé — la TVA lue 6,55 (somme des deux taux imprimés) contre null ne pèse pas, et la somme est recoupée par le bloc imprimé', () => {
    const a = lecture({ tvaAmount: TVA_SOMME }), b = lecture({ tvaAmount: null });
    expect(a.vat.reduce((s: number, row: any) => s + row.amount, 0)).toBeCloseTo(TVA_SOMME, 9);
    const r = reconcilie(a, b), points = (r.result as any).points as any[];
    // le contrat voulu : pas de point qui pèse, pas de chip « TVA », pas de « À vérifier » sur la TVA
    expect(pointsTva(points)).toEqual([]);
    expect(chipsDeLecture(points, []).map(c => c.nom)).not.toContain('TVA');
    const hints = invoiceFieldHints({ ...(r.result as any), review: r.review });
    expect(hints.tvaAmount).toBeUndefined();
  });

  it('Correctif posé — même cas, la lecture 1 lit null et la 2 la somme : la somme du bloc imprimé tranche, quel que soit l’ordre', () => {
    const r = reconcilie(lecture({ tvaAmount: null }), lecture({ tvaAmount: TVA_SOMME }));
    expect(pointsTva((r.result as any).points)).toEqual([]);
    expect(r.review.findings.join(' ')).not.toMatch(/TVA/);
    expect((r.result as any).tvaAmount).toBe(TVA_SOMME);   // la valeur recoupée est gardée, jamais perdue
  });

  it('Correctif posé — somme du bloc contre null : aucun point `lectures-divergentes` sur tvaAmount, ni règle de bloc ni de totaux, et la valeur recoupée est gardée', () => {
    const points = (reconcilie(lecture({ tvaAmount: TVA_SOMME }), lecture({ tvaAmount: null })).result as any).points as any[];
    expect(points.find(p => p.code === 'lectures-divergentes' && p.champ === 'tvaAmount')).toBeUndefined();
    expect(trouve(points, 'tva-incoherente')).toEqual([]);
    expect(trouve(points, 'ht-tva-ttc')).toEqual([]);
  });

  it('Correctif posé — une valeur qui ne vaut pas la somme du bloc de SA lecture (6,10 contre null, bloc à 6,55) reste un désaccord qui pèse, dans les deux ordres', () => {
    for (const [a, b] of [[6.1, null], [null, 6.1]] as const) {
      const points = (reconcilie(lecture({ tvaAmount: a }), lecture({ tvaAmount: b })).result as any).points as any[];
      expect(points.find(p => p.code === 'lectures-divergentes' && p.champ === 'tvaAmount')).toMatchObject({ pese: true });
    }
  });

  it('Correctif posé — la hint « Valeur corrigée… » n’apparaît pas sur la TVA quand la somme du bloc est recoupée', () => {
    const r = reconcilie(lecture({ tvaAmount: null }), lecture({ tvaAmount: TVA_SOMME }));
    expect(invoiceFieldHints({ ...(r.result as any), review: r.review }).tvaAmount).toBeUndefined();
  });

  it('Correctif posé — la remarque du modèle « deux taux, taux global fixé à null » (fieldWarnings.tvaRate) ne fait pas « À vérifier » quand le bloc par taux est cohérent', () => {
    // 2e contributeur de « Référence et TVA du document : À vérifier » (ExpenseSheet.tsx : hints.tvaAmount || hints.tvaRate) : `invoiceFieldHints` recopie
    // toute remarque du modèle. Précédent : la fixture 372765 (rapprochement/aide.ts, lectureB) porte exactement cette remarque sur une facture à deux taux.
    const remarque = { field: 'tvaRate', message: 'Plusieurs taux de TVA s’appliquent (2.5 % et 7.7 %), le champ global est fixé à null.' };
    const r = reconcilie(lecture({ fieldWarnings: [remarque] }), lecture({ fieldWarnings: [remarque] }));
    expect((r.result as any).controls.vat.statut).not.toBe('ecart');
    const hints = invoiceFieldHints({ ...(r.result as any), review: r.review });
    expect(hints.tvaRate).toBeUndefined();
  });

  it('une TVA lue qui ne vaut NI la somme du bloc imprimé NI null reste un désaccord qui pèse (le correctif ne masque pas un vrai écart)', () => {
    const r = reconcilie(lecture({ tvaAmount: TVA_SOMME }), lecture({ tvaAmount: 6.1 }));
    expect(pointsTva((r.result as any).points).length).toBeGreaterThan(0);
  });

  it('hypothèse H2 (à confirmer par la lecture réelle) : un « Sub-Total » TTC lu comme HT lève ht-tva-ttc (HT + TVA ≠ TTC) — la règle est juste, la lecture est fausse', () => {
    const r = lire(lecture({ amountHT: sommeLignes(items().slice(0, -1)) }));
    expect(trouve(r.points, 'ht-tva-ttc').length).toBe(1);
  });
});
