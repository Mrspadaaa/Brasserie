// Aides communes des tests de la lecture (voie l1-lecture). Aucune donnée réelle ; Gemini n'est jamais appelé :
// une « lecture » est un objet JSON, ce que le modèle aurait rendu.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function fixture(nom: string): any {
  return JSON.parse(readFileSync(fileURLToPath(new URL(`./fixtures/${nom}`, import.meta.url)), 'utf8'));
}
/** Lecture simulée de la facture 372765, complétée des champs du nouveau schéma. Un nouvel exemplaire à chaque appel. */
export const lecture372765 = () => fixture('lecture-372765.json');
export const verite372765 = () => fixture('verite-372765.json');

/** Un en-tête CHF valide, sans ligne ; les tests ajoutent ce dont ils ont besoin. */
export const entete = (over: Record<string, unknown> = {}) => ({
  vendor: 'Fournisseur fictif', documentType: 'invoice', paymentEvidence: 'paid', date: '09.09.2026', currency: 'CHF',
  invoiceNumber: 'F-1', orderNumber: '', amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: null,
  category: 'brassage', subcategory: '', description: 'Achat fictif', fieldWarnings: [], items: [], ...over,
});
/** Une ligne de stock valide : quantité × prix = montant. */
export const ligne = (over: Record<string, unknown> = {}) => ({
  name: 'Malt fictif', kind: 'stock', reference: '', variant: '', quantity: 1, unit: 'kg', price: 1, amountTTC: 1,
  stockCategory: '', evidence: '', ambiguity: '', vatCode: '', alphaPct: null, ...over,
});
/** Remplace la ligne `index` (0-based) de la lecture. */
export function avecLigne(raw: any, index: number, patch: Record<string, unknown>) {
  return { ...raw, items: raw.items.map((item: any, i: number) => (i === index ? { ...item, ...patch } : item)) };
}
export const trouve = (points: any[], code: string) => points.filter(p => p.code === code);
