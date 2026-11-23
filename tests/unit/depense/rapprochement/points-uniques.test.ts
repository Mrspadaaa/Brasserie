// A1 — un seul avertissement par champ ; les remarques du modèle ne sont jamais jetées (liste `remarques`) et ne pèsent jamais (P2).
import { describe, expect, it } from 'vitest';
import { finirUneLecture, reconcileInvoiceVision } from '../../../../functions/src/invoiceVisionReview';
import { invoiceFieldHints } from '../../../../src/services/purchasePrefill';
import { avec, lectureA, lectureB, lectureC, lire, malt, propre, simple } from './aide';

const trois = () => reconcileInvoiceVision([lire(lectureA()), lire(lectureB()), lire(lectureC())]).result as any;
const parChamp = (liste: Array<{ field?: string; champ?: string }>) => {
  const n: Record<string, number> = {};
  for (const e of liste) { const k = (e.field ?? e.champ)!; n[k] = (n[k] ?? 0) + 1; }
  return n;
};

describe('A1 — un seul avertissement par champ', () => {
  it('sur les trois lectures simulées de 372765 : au plus une entrée de fieldWarnings par champ', () => {
    const r = trois();
    const n = parChamp(r.fieldWarnings);
    expect(Object.values(n).every(c => c <= 1), JSON.stringify(n)).toBe(true);
  });

  it('au plus une remarque par (champ, ligne) ; invoiceNumber levée par A et B = une remarque, lectures [1, 2]', () => {
    const r = trois();
    expect(Object.values(parChamp(r.remarques)).every(c => c <= 1)).toBe(true);
    expect(r.remarques.find((x: any) => x.champ === 'invoiceNumber')).toMatchObject({ lectures: [1, 2] });
    expect(r.remarques.find((x: any) => x.champ === 'tvaRate')).toMatchObject({ lectures: [1, 2, 3] });
  });

  it("une remarque d'une seule lecture reste dans la liste, avec la lecture qui l'a levée", () => {
    const r = trois();
    expect(r.remarques.find((x: any) => x.champ === 'documentType')).toMatchObject({ lectures: [1] });
    expect(r.remarques.find((x: any) => x.champ === 'amountHT')).toMatchObject({ lectures: [1] });
  });

  it('une remarque ne pèse jamais et n\'est pas un point', () => {
    const { result, review } = reconcileInvoiceVision([propre({ fieldWarnings: [{ field: 'vendor', message: 'Fournisseur peu lisible.' }] }), propre({ fieldWarnings: [{ field: 'vendor', message: 'Fournisseur peu lisible.' }] })].map(lire));
    expect(review.status).toBe('checked');
    expect((result as any).points).toEqual([]);
    expect((result as any).remarques).toEqual([{ champ: 'vendor', lectures: [1, 2], message: 'Fournisseur peu lisible.' }]);
  });

  it('un champ en désaccord n\'a que la phrase de désaccord dans fieldWarnings', () => {
    const r = reconcileInvoiceVision([lire(lectureA()), lire(lectureB())]).result as any;
    const tva = r.fieldWarnings.filter((w: any) => w.field === 'tvaAmount');
    expect(tva).toHaveLength(1);
    expect(tva[0].message).toMatch(/ne concordent pas/);
  });

  it('trois lectures identiques de 372765 : les points sont ceux de la lecture (le test de l1 reste vrai)', () => {
    const r = reconcileInvoiceVision([lire(lectureA()), lire(lectureA()), lire(lectureA())]).result as any;
    expect(r.points.map((p: any) => p.code)).toEqual(['tva-incoherente']);
  });

  it('aucun doublon de cle dans les points', () => {
    const cles = (reconcileInvoiceVision([lire(lectureA()), lire(lectureB())]).result as any).points.map((p: any) => p.cle);
    expect(new Set(cles).size).toBe(cles.length);
  });

  it('le chemin à une seule lecture applique le même tri', () => {
    const une = lire(propre({ fieldWarnings: [{ field: 'date', message: 'a' }, { field: 'date', message: 'b' }, { field: 'vendor', message: 'c' }] }));
    const r = finirUneLecture(une) as any;
    expect(parChamp(r.fieldWarnings)).toEqual({ date: 1, vendor: 1 });
    expect(r.remarques.map((x: any) => x.champ).sort()).toEqual(['date', 'vendor']);
  });
});

describe('A1 — chaque phrase tombe sous son champ dans invoiceFieldHints', () => {
  it('désaccord d\'en-tête, désaccord de ligne et lecture coupée ne tombent pas sous un mauvais champ', () => {
    const r = reconcileInvoiceVision([lire(simple({ vendor: 'Brasserie A' }, [malt({ quantity: 2 })])), lire(simple({ vendor: 'Brasserie B' }, [malt({ quantity: 3 })]))]).result as any;
    const hints = invoiceFieldHints({ ...r, items: r.items });
    expect(hints.vendor).toMatch(/ne concordent pas/);
    // le désaccord de quantité d'une ligne se range sous « items », jamais sous le total ni le fournisseur
    expect(hints.items).toBeTruthy();
    expect(hints.vendor).not.toMatch(/Malt fictif/);
    const coupee = invoiceFieldHints({ ...r, issues: ["Une des deux lectures a été coupée (limite de sortie atteinte) : le justificatif n'est lu qu'une fois. Vérifie le justificatif."], review: { status: 'unavailable', findings: [] } } as any);
    expect(coupee.amountTTC).not.toMatch(/coupée/);
  });
});
