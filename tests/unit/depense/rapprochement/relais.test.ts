// R2 — le vote prend vat, linesLost, rejets, alphaPct, vatCode de la lecture dont les lignes sont retenues ; documentTypeRetenu traverse.
import { describe, expect, it } from 'vitest';
import { reconcileInvoiceVision } from '../../../../functions/src/invoiceVisionReview';
import { lectureA, lectureB, lire, ligne, propre } from './aide';

describe('R2 — les champs de l1 viennent de la lecture dont les lignes sont retenues', () => {
  it('lignes retenues de la lecture 2 : vat et linesLost sont ceux de la lecture 2, pas ceux de la lecture 1', () => {
    const a = lectureA();
    const premiere = { ...a, vat: [], linesLost: 3, items: [...a.items, { ...a.items[0], name: 'Ligne en trop', reference: 'ZZ9', quantity: 3, price: 1, amountTTC: 3 }] };
    const r = reconcileInvoiceVision([lire(premiere), lire(lectureA()), lire(lectureA())]);
    const res = r.result as any;
    expect(res.items).toHaveLength(23);
    expect(res.vat).toHaveLength(2);
    expect(res.linesLost).toBe(0);
    expect(r.review.correctedFields).toContain('items');
  });

  it('une pro-forma payée lue « quote » : documentType reste quote, documentTypeRetenu = invoice, paiement payé', () => {
    const lecture = () => propre({ proForma: true, paymentEvidence: 'paid', documentType: 'quote' });
    const res = reconcileInvoiceVision([lecture(), lecture(), lecture()].map(lire)).result as any;
    expect(res).toMatchObject({ documentType: 'quote', documentTypeRetenu: 'invoice', documentTypeLu: 'quote', proForma: true, paymentEvidence: 'paid' });
  });

  it('alphaPct, vatCode et rejets de la base sont conservés', () => {
    const lecture = () => propre({ items: [ligne({ name: 'Target 11.3%', alphaPct: 11.3, vatCode: 'R' })] });
    const res = reconcileInvoiceVision([lire(lecture()), lire(lecture())]).result as any;
    expect(res.items[0]).toMatchObject({ alphaPct: 11.3, vatCode: 'R' });
    const rejet = () => propre({ items: [ligne({ alphaPct: 45 })] });
    const r2 = reconcileInvoiceVision([lire(rejet()), lire(rejet())]).result as any;
    expect(r2.rejets).toHaveLength(1);
  });

  it('372765 (A+B) : 23 lignes, vat de deux rangées, bloc TVA incohérent ET désaccord TVA', () => {
    const res = reconcileInvoiceVision([lire(lectureA()), lire(lectureB())]).result as any;
    expect(res.items).toHaveLength(23);
    expect(res.vat.map((v: any) => v.code)).toEqual(['N', 'R']);
    const codes = res.points.map((p: any) => p.code);
    expect(codes).toContain('tva-incoherente');
    expect(codes).toContain('lectures-divergentes');
  });

  it('vat[] comparé trié par taux : le même bloc dans un autre ordre n\'est pas un désaccord', () => {
    const inverse = { ...lectureA(), vat: [...lectureA().vat].reverse() };
    const res = reconcileInvoiceVision([lire(lectureA()), lire(inverse)]).result as any;
    expect(res.points.some((p: any) => p.code === 'lectures-divergentes' && p.champ === 'vat')).toBe(false);
  });

  it('vat[] différent : un point de désaccord, sans troisième lecture', () => {
    const autre = lectureA();
    autre.vat[0].amount = 1.9;
    const r = reconcileInvoiceVision([lire(lectureA()), lire(autre)]);
    expect((r.result as any).points.some((p: any) => p.code === 'lectures-divergentes' && p.champ === 'vat')).toBe(true);
    expect(r.needsCorrection).toBe(false);
  });
});
