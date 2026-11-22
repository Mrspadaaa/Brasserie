// D380 (« l'écran ne garde qu'une ligne okay mais tu vas fixer ça ??? ») : une lecture qui n'a rendu qu'une ligne d'une pièce de 300 ne parle
// jamais d'un plafond. Rouge sur ddc6539a : « 299 ligne(s) non conservée(s) (10000 lignes au plus) ».
import { describe, expect, it } from 'vitest';
import { normalizeInvoiceScan } from '../../../../functions/src/invoiceScanCore';

const lecture = {
  vendor: 'Malterie fictive', documentType: 'invoice', paymentEvidence: 'none', fieldWarnings: [], date: '03.11.2026', currency: 'CHF', invoiceNumber: 'F-300',
  orderNumber: '', proForma: false, vat: [], printedLineCount: 300, amountHT: null, tvaRate: 0.081, tvaAmount: 2695.25, amountTTC: 35970, category: 'brassage', description: '',
  items: [{ name: 'Malt Pilsner 5 kg', kind: 'stock', reference: '', variant: '', quantity: 5, unit: 'kg', price: 1.45, amountTTC: 7.25, stockCategory: 'malt', vatCode: '', alphaPct: null, evidence: '', ambiguity: '' }],
};

describe('D380 : le message des lignes manquantes dit la vraie cause', () => {
  it('299 lignes imprimées non lues, aucun plafond invoqué', () => {
    const r: any = normalizeInvoiceScan(lecture);
    const textes = [...r.issues, ...r.points.map((p: any) => `${p.regle} ${p.message}`)].join(' | ');
    expect(r.linesLost).toBe(299);
    expect(textes).toContain('299 ligne(s) imprimée(s) non lue(s)');
    expect(textes).not.toMatch(/au plus|plafond|10000/);
  });
});
