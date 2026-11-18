// A2 — le statut vient des points qui pèsent (contrôles du code, désaccords), pas du bavardage du modèle. Un test par code (P1).
import { describe, expect, it } from 'vitest';
import { PESE_PAR_CODE, SCAN_POINT_CODES } from '../../../../functions/src/invoiceControls';
import { reconcileInvoiceVision } from '../../../../functions/src/invoiceVisionReview';
import { ligne, lectureA, lectureB, lire, malt, propre, simple } from './aide';

const deux = (raw: any) => reconcileInvoiceVision([lire(raw), lire(structuredClone(raw))]);

// code → [lecture qui le produit, pèse ?]
const parCode: Record<string, [() => any, boolean]> = {
  'ligne-montant': [() => propre({ amountTTC: 3, items: [ligne({ quantity: 2, price: 1, amountTTC: 3 })] }), true],
  'ligne-prix-par-lot': [() => propre({ amountTTC: 20, items: [ligne({ quantity: 250, unit: 'g', price: 8, amountTTC: 20 })] }), true],
  'somme-ecart': [() => propre({ amountTTC: 5 }), true],
  // fn-montant-seul : un `price` seul devient le montant de la ligne ; la ligne sans AUCUN montant (ni price ni amountTTC) reste incomplète.
  'somme-incomplete': [() => propre({ items: [ligne({ price: null, amountTTC: null })] }), true],
  'tva-incoherente': [() => lectureA(), true],
  'ht-tva-ttc': [() => propre({ amountHT: 8, tvaAmount: 1 }), true],
  'lignes-perdues': [() => propre({ amountTTC: 5, printedLineCount: 2 }), true],
  'lignes-annoncees': [() => propre({ printedLineCount: 2 }), true],
  'pro-forma-non-payee': [() => propre({ proForma: true, paymentEvidence: 'unknown' }), true],
  'type-deduit': [() => propre({ proForma: true, paymentEvidence: 'paid', documentType: 'quote' }), false],
  'devis': [() => propre({ documentType: 'quote' }), true],
  'alpha-libelle': [() => propre({ items: [ligne({ name: 'Target 11.3%', alphaPct: 9 })] }), true],
  'unite-absente': [() => propre({ items: [ligne({ unit: '' })] }), true],
  'forme-rejetee': [() => propre({ items: [ligne({ alphaPct: 45 })] }), true],
  'date-absente': [() => propre({ date: '' }), true],
  'devise-non-chf': [() => propre({ currency: 'EUR' }), true],
  'total-absent': [() => propre({ amountTTC: null }), true],
  'taux-tva-hors-plage': [() => propre({ tvaRate: 5 }), true],
  'document-livraison': [() => propre({ documentType: 'delivery_note' }), true],
  'avoir': [() => propre({ documentType: 'credit_note' }), true],
  'nature-a-preciser': [() => propre({ items: [ligne({ kind: 'unknown' })] }), true],
  'ambiguite-ligne': [() => propre({ items: [ligne({ ambiguity: 'Quantité illisible.' })] }), true],
};

describe('A2 — un test par code : pèse ou non', () => {
  it('la table couvre tous les codes de SCAN_POINT_CODES', () => {
    expect(Object.keys(PESE_PAR_CODE).sort()).toEqual([...SCAN_POINT_CODES].sort());
  });

  it('le témoin : une lecture propre lue deux fois est « checked », sans point', () => {
    const r = deux(propre());
    expect(r.review).toEqual({ status: 'checked', findings: [], readers: 2, correctedFields: [] });
    expect((r.result as any).points).toEqual([]);
  });

  it.each(Object.entries(parCode))('%s', (code, [fabrique, pese]) => {
    const r = deux(fabrique());
    const point = (r.result as any).points.find((p: any) => p.code === code);
    expect(point, `point ${code}`).toBeTruthy();
    expect(point.pese).toBe(pese);
    expect(point.source ?? 'contrôle').toMatch(/contrôle|modèle/);
    expect(r.review.status).toBe(pese ? 'disputed' : 'checked');
    // la phrase d'un point sans point d'avant (issues) est celle d'`issues`, identique
    if (pese && !['lectures-divergentes'].includes(code)) expect((r.result as any).issues.some((m: string) => m === point.message) || r.review.findings.includes(point.message)).toBe(true);
  });

  it('type-deduit reste un point visible, valeur marquée « déduite »', () => {
    const p = (deux(parCode['type-deduit'][0]()).result as any).points.find((x: any) => x.code === 'type-deduit');
    expect(p).toMatchObject({ luTexte: 'quote', pese: false });
    expect(p.regle).toMatch(/pro-forma/);
  });

  it('trois lectures concordantes, une remarque libre et des chiffres recoupés : checked, review à quatre clés', () => {
    const avecRemarque = propre({ fieldWarnings: [{ field: 'invoiceNumber', message: 'Numéro proche du titre.' }] });
    const r = reconcileInvoiceVision([lire(avecRemarque), lire(propre()), lire(propre())]);
    expect(r.review).toEqual({ status: 'checked', findings: [], readers: 3, correctedFields: [] });
  });

  it('un désaccord sans majorité pèse : disputed', () => {
    expect(reconcileInvoiceVision([lire(propre({ vendor: 'A' })), lire(propre({ vendor: 'B' }))]).review.status).toBe('disputed');
  });

  it('2 contre 1 sur un champ d\'argent : point présent, ne pèse pas, ni dans findings ni dans issues (N1)', () => {
    const { result, review } = reconcileInvoiceVision([lire(propre({ amountHT: 9 })), lire(propre()), lire(propre())]);
    const p = (result as any).points.find((x: any) => x.code === 'lectures-divergentes' && x.champ === 'amountHT');
    expect(p).toMatchObject({ pese: false, source: 'désaccord' });
    expect(p.valeurs).toEqual([{ lecture: 1, valeur: 9, retenue: false }, { lecture: 2, valeur: null, retenue: true }, { lecture: 3, valeur: null, retenue: true }]);
    expect(review.status).toBe('corrected');
    expect(review.findings).toEqual([]);
    expect((result as any).issues).toEqual([]);
  });

  it('une ambiguïté de ligne lue dans une lecture sur deux pèse (P3)', () => {
    const r = reconcileInvoiceVision([lire(simple()), lire(simple({}, [malt({ ambiguity: 'Quantité illisible.' })]))]);
    expect(r.review.status).toBe('disputed');
    expect(r.needsCorrection).toBe(true);
    expect((r.result as any).issues.join(' ')).toContain('Quantité illisible');
  });

  it('372765 (A et B) : disputed — désaccord TVA et bloc TVA incohérent', () => {
    expect(reconcileInvoiceVision([lire(lectureA()), lire(lectureB())]).review.status).toBe('disputed');
  });
});
