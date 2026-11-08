import { describe, expect, it } from 'vitest';
import { invoicePurchaseDescription } from '../../src/services/purchasePrefill';
import type { ScannedInvoiceResult } from '../../src/services/geminiScanner';

// LP-4 (lecture en ligne du 08.11, doc8 et doc10) : « Pour quoi ? : matériel, emballages » sur une commande de malts, houblons et levures de B&R.
// Cause : les familles étaient gardées dans l'ordre de première apparition ; la commande commence par du matériel (cuve, robinet, sacs) et le plafond de 60 caractères
// coupait les ingrédients, qui viennent en dernier. Les matières premières passent devant, et se disent « matières premières » quand les familles ne tiennent pas.
// Lecture imitée d'une vraie commande (types de lignes de doc8, cas-4.json), aucun appel à Gemini.
const ligne = (id: string, name: string, kind: string, stockCategory?: string) => ({ id, name, kind, quantity: 1, unit: kind === 'stock' ? 'Kg' : '', amountTTC: 10, stockCategory }) as any;
const commande = (items: any[], more: Partial<ScannedInvoiceResult> = {}): ScannedInvoiceResult => ({
  documentType: 'invoice', vendor: 'Brau- und Rauchshop GmbH', date: '06.08.2024', currency: 'CHF', invoiceNumber: '652093', amountHT: null, amountTTC: 100, tvaRate: null, tvaAmount: null,
  category: 'brassage', subcategory: '', description: 'Commande', items, issues: [], review: { status: 'checked', findings: [] }, ...more });
const MATERIEL = [ligne('a', 'Gärtank 30 Liter', 'equipment'), ligne('b', 'Auslaufhahn', 'equipment'), ligne('c', 'Siphon mit Ansaugpumpe', 'equipment')];
const EMBALLAGE = [ligne('d', 'Kronkorken 100 Kapseln', 'packaging')];
const MATIERES = [ligne('e', 'Pilsner Malz', 'stock', 'Malt'), ligne('f', 'Aramis 7.9%', 'stock', 'Houblon'), ligne('g', 'Wyeast 3944', 'stock', 'Levure')];

describe('LP-4 : « Pour quoi ? » d’une commande qui mêle matériel, emballages et matières premières', () => {
  it('doc8 : le matériel vient d’abord sur la facture, les matières premières passent devant et tiennent en 60 caractères', () => {
    const texte = invoicePurchaseDescription(commande([...MATERIEL, ...EMBALLAGE, ...MATIERES]));
    expect(texte).toBe('Brau- und Rauchshop GmbH · 652093 · matières premières');
    expect(texte.length).toBeLessThanOrEqual(60);
    expect(texte).not.toMatch(/matériel|emballages/);
  });
  it('quand tout tient, les matières premières sont nommées par famille et passent avant le matériel', () => {
    const texte = invoicePurchaseDescription(commande([...MATERIEL, ...MATIERES.slice(0, 1)], { vendor: 'B&R', invoiceNumber: '1' }));
    expect(texte).toBe('B&R · 1 · malts, matériel');
  });
  it('sans matières premières, l’ordre d’apparition reste (travaux, nettoyage, matériel…)', () => {
    expect(invoicePurchaseDescription(commande([...MATERIEL, ...EMBALLAGE], { vendor: 'B&R', invoiceNumber: '1' }))).toBe('B&R · 1 · matériel, emballages');
  });
  it('une seule famille de matières premières trop longue pour le plafond reste nommée par sa famille', () => {
    const texte = invoicePurchaseDescription(commande(MATIERES.slice(0, 1), { vendor: 'Brau- und Rauchshop GmbH Densbüren', invoiceNumber: '652093' }));
    expect(texte).toContain('malts');
  });
});
