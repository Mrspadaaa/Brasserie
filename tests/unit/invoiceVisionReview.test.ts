import { describe, expect, it } from 'vitest';
import { normalizeInvoiceScan } from '../../functions/src/invoiceScanCore';
import { reconcileInvoiceVision } from '../../functions/src/invoiceVisionReview';

const item = (overrides: Record<string, unknown> = {}) => ({
  name: 'Cascade 100 g', kind: 'stock', quantity: 2, unit: 'pièces', price: 5,
  amountTTC: 10, stockCategory: 'Houblon', evidence: '2 × Cascade 100 g : CHF 10.00', ambiguity: '', ...overrides,
});
const read = (overrides: Record<string, unknown> = {}) => normalizeInvoiceScan({
  vendor: 'Brasserie SA', date: '09.09.2026', currency: 'CHF', invoiceNumber: 'F-17',
  amountHT: 10, tvaRate: 0, tvaAmount: 0, amountTTC: 10, category: 'brassage', subcategory: 'Houblon',
  items: [item()], ...overrides,
});

describe('Deux visions indépendantes et correction par majorité', () => {
  it('préserve un total absent et ses alertes sans acheter une troisième lecture inutile', () => {
    const source={documentType:'delivery_note',paymentEvidence:'unknown',amountTTC:null,amountHT:null,tvaAmount:null,tvaRate:null,fieldWarnings:[{field:'amountTTC',message:'Total non imprimé.'}]};
    const result=reconcileInvoiceVision([read(source),read(source)]);
    expect(result.result.amountTTC).toBeNull();
    expect(result.result.fieldWarnings).toEqual([{field:'amountTTC',message:'Total non imprimé.'}]);
    expect(result.needsCorrection).toBe(false);
    expect(result.review.status).toBe('disputed');
  });
  it('ne confirme pas des références ou tailles divergentes sous un même libellé', () => {
    const first=read({items:[item({reference:'ABC-1',variant:'30 L'})]});
    const second=read({items:[item({reference:'ABC-2',variant:'50 L'})]});
    const result=reconcileInvoiceVision([first,second]);
    expect(result.needsCorrection).toBe(true);
    expect(result.review.findings.join(' ')).toContain('référence article');
    expect(result.review.findings.join(' ')).toContain('taille ou variante');
    expect(result.result.items[0].reference).toBe('ABC-1');
  });
  it('confirme deux lectures concordantes sans modifier leurs données ni leurs preuves', () => {
    const first = read(), second = read();
    const before = JSON.stringify([first, second]);
    const { result, review, needsCorrection } = reconcileInvoiceVision([first, second]);
    expect(review).toEqual({ status: 'checked', findings: [], readers: 2, correctedFields: [] });
    expect(needsCorrection).toBe(false);
    expect(result.items[0].evidence).toBe(first.items[0].evidence);
    expect(JSON.stringify([first, second])).toBe(before);
  });

  it('accepte les accents, espaces, casse et synonymes de pièces sans convertir la quantité', () => {
    const { result, review } = reconcileInvoiceVision([read(), read({ vendor: ' BRASSERIE SA ', items: [item({ name: 'cascade  100 g', unit: 'pcs.' })] })]);
    expect(review.status).toBe('checked');
    expect(result.items[0].unit).toBe('pièces');
    expect(result.items[0].quantity).toBe(2);
  });

  it('compare les dates après normalisation calendaire', () => {
    expect(reconcileInvoiceVision([read(), read({ date: '2026-09-09' })]).review.status).toBe('checked');
  });

  it.each(['vendor', 'date', 'currency', 'invoiceNumber', 'amountHT', 'amountTTC', 'tvaAmount', 'tvaRate', 'category'])('demande une correction du champ %s divergent', field => {
    const changed: Record<string, unknown> = { vendor: 'Autre SA', date: '10.09.2026', currency: 'EUR', invoiceNumber: 'F-71', amountHT: 9, amountTTC: 11, tvaAmount: 1, tvaRate: .081, category: 'materiel', subcategory: 'Malt' };
    const result = reconcileInvoiceVision([read(), read({ [field]: changed[field] })]);
    expect(result.review.status).toBe('disputed');
    expect(result.needsCorrection).toBe(true);
    expect(result.result[field as keyof typeof result.result]).toEqual(read()[field as keyof ReturnType<typeof read>]);
  });

  it('laisse une sous-catégorie éditoriale divergente au choix humain sans arbitrage payant', () => {
    const result = reconcileInvoiceVision([read({ subcategory: 'Houblon' }), read({ subcategory: 'Ingrédients de brassage' })]);
    expect(result.result.subcategory).toBe('');
    expect(result.review).toEqual({ status: 'checked', readers: 2, findings: [], correctedFields: [] });
    expect(result.needsCorrection).toBe(false);
  });

  it('conserve la sous-catégorie seulement si deux lecteurs partagent cette suggestion', () => {
    const result = reconcileInvoiceVision([read({ subcategory: 'Ingrédients' }), read({ subcategory: 'Houblon' }), read({ subcategory: 'Houblon' })]);
    expect(result.result.subcategory).toBe('Houblon');
    expect(result.review.status).toBe('checked');
    expect(result.review.correctedFields).toEqual([]);
    const disagreement = reconcileInvoiceVision([read({ subcategory: 'Ingrédients' }), read({ subcategory: 'Houblon' }), read({ subcategory: 'Matières premières' })]);
    expect(disagreement.result.subcategory).toBe('');
    expect(disagreement.review.status).toBe('checked');
  });

  it('une divergence de classification principale exige toujours une relecture', () => {
    const result = reconcileInvoiceVision([read({ category: 'brassage', subcategory: 'Houblon' }), read({ category: 'materiel', subcategory: 'Consommables' })]);
    expect(result.result.category).toBe('brassage');
    expect(result.review.status).toBe('disputed');
    expect(result.review.findings.join(' ')).toContain('Catégorie');
    expect(result.needsCorrection).toBe(true);
  });

  it.each(['kind', 'quantity', 'unit', 'price', 'amountTTC', 'stockCategory'])('contrôle aussi %s sur chaque ligne', field => {
    const changed: Record<string, unknown> = { kind: 'equipment', quantity: 3, unit: 'kg', price: 4, amountTTC: 8, stockCategory: 'Malt' };
    const result = reconcileInvoiceVision([read(), read({ items: [item({ [field]: changed[field] })] })]);
    expect(result.needsCorrection).toBe(true);
    expect(result.review.findings.join(' ')).toContain('Cascade 100 g');
  });

  it('ne convertit pas grammes en kilos pour créer artificiellement un accord', () => {
    const first = read({ items: [item({ quantity: 1000, unit: 'g' })] });
    const second = read({ items: [item({ quantity: 1, unit: 'kg' })] });
    expect(reconcileInvoiceVision([first, second]).review.status).toBe('disputed');
  });

  it('ne complète aucune valeur absente à partir d’une seule lecture', () => {
    const first = read({ invoiceNumber: '', items: [item({ quantity: null })] });
    const second = read();
    const { result, review } = reconcileInvoiceVision([first, second]);
    expect(result.invoiceNumber).toBe('');
    expect(result.items[0].quantity).toBeNull();
    expect(review.status).toBe('disputed');
  });

  it('accepte le vote de deux relecteurs pour corriger un total source, sans modifier l’original', () => {
    const first = read({ amountTTC: 100 });
    const { result, review, needsCorrection } = reconcileInvoiceVision([first, read(), read()]);
    expect(result.amountTTC).toBe(10);
    expect(first.amountTTC).toBe(100);
    expect(result.issues).toEqual([]);
    expect(review).toMatchObject({ status: 'corrected', readers: 3, correctedFields: ['amountTTC'] });
    expect(needsCorrection).toBe(false);
  });

  it('une majorité qui confirme la première lecture résout le désaccord sans inventer de correction', () => {
    const result = reconcileInvoiceVision([read(), read({ invoiceNumber: 'F-71' }), read()]);
    expect(result.review.status).toBe('checked');
    expect(result.review.correctedFields).toEqual([]);
  });

  it('garde le champ initial si les trois lectures divergent', () => {
    const { result, review, needsCorrection } = reconcileInvoiceVision([read(), read({ invoiceNumber: 'F-71' }), read({ invoiceNumber: 'F-77' })]);
    expect(result.invoiceNumber).toBe('F-17');
    expect(review.status).toBe('disputed');
    expect(needsCorrection).toBe(false);
  });

  it('ne comble pas null quand deux lecteurs ne voient pas la valeur', () => {
    const first = read({ tvaAmount: null });
    const result = reconcileInvoiceVision([first, read(), read({ tvaAmount: null })]);
    expect(result.result.tvaAmount).toBeNull();
    expect(result.review.correctedFields).not.toContain('tvaAmount');
  });

  it('ne laisse pas une lecture tardive seule écraser deux lectures concordantes', () => {
    const result = reconcileInvoiceVision([read(), read(), read({ amountTTC: 100, items: [item({ quantity: 20 })] })]);
    expect(result.result.amountTTC).toBe(10);
    expect(result.result.items[0].quantity).toBe(2);
    expect(result.review.status).toBe('checked');
  });

  it('rapproche les noms uniques malgré un ordre différent sans échanger les quantités', () => {
    const malt = item({ name: 'Malt Pils 1 kg', quantity: 5, amountTTC: 20, price: 4, stockCategory: 'Malt' });
    const first = read({ amountHT: 30, amountTTC: 30, items: [item(), malt] });
    const second = read({ amountHT: 30, amountTTC: 30, items: [malt, item()] });
    const { result, review } = reconcileInvoiceVision([first, second]);
    expect(review.status).toBe('checked');
    expect(result.items.map(line => [line.name, line.quantity])).toEqual([['Cascade 100 g', 2], ['Malt Pils 1 kg', 5]]);
  });

  it('ne mélange pas les lignes de noms OCR proches, même à la même position', () => {
    const result = reconcileInvoiceVision([read(), read({ items: [item({ name: 'Cascade 1000 g', quantity: 1 })] })]);
    expect(result.result.items[0].quantity).toBe(2);
    expect(result.review.status).toBe('disputed');
    expect(result.review.findings.join(' ')).toContain('rapprochées');
  });

  it('corrige la structure seulement si deux relevés complets concordent', () => {
    const first = read({ items: [item({ name: 'Cascadc 100 g', quantity: 20 })] });
    const result = reconcileInvoiceVision([first, read(), read()]);
    expect(result.result.items[0].name).toBe('Cascade 100 g');
    expect(result.result.items[0].quantity).toBe(2);
    expect(result.review.correctedFields).toContain('items');
    expect(result.review.status).toBe('corrected');
  });

  it('ne joint jamais des lignes dupliquées par leur position quand leurs quantités divergent', () => {
    const a = read({ amountHT: 20, amountTTC: 20, items: [item(), item({ quantity: 5 })] });
    const b = read({ amountHT: 20, amountTTC: 20, items: [item({ quantity: 5 }), item()] });
    const result = reconcileInvoiceVision([a, b]);
    expect(result.review.status).toBe('disputed');
    expect(result.result.items.map(line => line.quantity)).toEqual([2, 5]);
  });

  it('accepte deux transcriptions intégralement identiques de lignes aux libellés dupliqués', () => {
    const a = read({ amountHT: 20, amountTTC: 20, items: [item(), item({ quantity: 5 })] });
    expect(reconcileInvoiceVision([a, structuredClone(a)]).review.status).toBe('checked');
  });

  it('conserve une ambiguïté explicite même si les valeurs numériques concordent', () => {
    const result = reconcileInvoiceVision([read(), read({ items: [item({ ambiguity: 'Quantité difficile à lire.' })] })]);
    expect(result.review.status).toBe('disputed');
    expect(result.review.findings.join(' ')).toContain('Quantité difficile à lire');
  });

  it('recalcule les contrôles et ne confirme pas des totaux incohérents même si les lecteurs sont d’accord', () => {
    const first = read({ amountHT: 8, tvaAmount: 1, amountTTC: 10 });
    const result = reconcileInvoiceVision([first, structuredClone(first)]);
    expect(result.review.status).toBe('disputed');
    expect(result.result.amountHT).toBe(8);
    expect(result.result.issues.join(' ')).toContain('ne correspondent');
  });

  it('ignore uniquement le bruit binaire et ne masque pas un vrai écart inférieur au centime', () => {
    const base = { amountHT: null, tvaAmount: null, items: [] };
    expect(reconcileInvoiceVision([read({ ...base, amountTTC: .1 + .2 }), read({ ...base, amountTTC: .3 })]).review.status).toBe('checked');
    expect(reconcileInvoiceVision([read({ ...base, amountTTC: 1.001 }), read({ ...base, amountTTC: 1.004 })]).review.status).toBe('disputed');
  });

  it('conserve la limite de lignes visible après une seconde normalisation', () => {
    const first = read({ amountHT: 350, amountTTC: 350, items: Array.from({ length: 36 }, (_, index) => item({ name: `Article ${index}` })) });
    const result = reconcileInvoiceVision([first, structuredClone(first)]);
    expect(result.result.items).toHaveLength(35);
    expect(result.result.issues.join(' ')).toContain('Plus de 35 lignes');
    expect(result.review.status).toBe('disputed');
    expect(result.needsCorrection).toBe(false);
  });

  it('ne dépense pas une correction pour une devise étrangère lue à l’identique', () => {
    const a = read({ currency: 'EUR', tvaAmount: null, tvaRate: null });
    const result = reconcileInvoiceVision([a, structuredClone(a)]);
    expect(result.review.status).toBe('disputed');
    expect(result.needsCorrection).toBe(false);
    expect(result.result.currency).toBe('EUR');
  });

  it('ne répète pas l’OCR pour des montants absents à l’identique', () => {
    const a = read({ amountTTC: null, amountHT: null, tvaAmount: null, items: [] });
    const result = reconcileInvoiceVision([a, structuredClone(a)]);
    expect(result.review.status).toBe('disputed');
    expect(result.needsCorrection).toBe(false);
  });

  it.each([0, 1, 4])('rejette %i lectures pour maintenir la borne explicite', count => {
    expect(() => reconcileInvoiceVision(Array.from({ length: count }, () => read()))).toThrow('deux ou trois');
  });
});
