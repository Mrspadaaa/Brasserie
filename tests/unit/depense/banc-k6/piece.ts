// Voie k6-diagnostic (01.11) : une pièce INVENTÉE qui imite la FORME d'une commande en ligne de boutique de brassage (D261, D262) :
// prix imprimés TTC, une ligne de levure, des malts sans le mot « malt », du matériel, de l'emballage, un port compté dans le total,
// deux taux de TVA imprimés sans base ni total de TVA, un total arrondi à 5 centimes. Aucune valeur d'une vraie pièce. Gemini n'est jamais appelé :
// une « lecture » est l'objet JSON que le modèle aurait rendu.
import { normalizeInvoiceScan } from '../../../../functions/src/invoiceScanCore';
import { entete, ligne } from '../lecture/aide';

export const lire = (raw: any) => normalizeInvoiceScan(raw) as any;
const montant = (n: number) => Math.round(n * 100) / 100;

/** Les lignes de la pièce imitée : [nom, kind lu, référence, quantité, unité, prix]. Le port est la dernière (D249 : compté dans le total). */
export const LIGNES: Array<[string, string, string, number, string, number]> = [
  ['Levure fictive 1111, Souche Test', 'stock', 'HE1111', 2, '', 9.5],
  ['Cuve fictive 30 Liter rund mit Deckel', 'equipment', 'GA0005', 1, '', 39],
  ['Hopfensack fictif fein', 'equipment', 'SA2172', 4, '', 0.8],
  ['CARAFICTIF®, Kg', 'stock', 'MA0222', 2, '', 1.9],
  ['Sirop Candi fictif 460ml', 'stock', 'CAN005', 1, '', 7.5],
  ['Premium Pilsner Malz, Kg', 'stock', 'MA0020', 5, '', 1.65],
  ['Saaz fictif 3.5%', 'stock', 'HO0066', 87, '', 0.04],
  ['Hop Filter Bag fictif', 'equipment', 'FL1920', 1, '', 6.5],
  ['Kronkorken 100 Kapseln fictif', 'packaging', 'KR2173', 1, '', 2.5],
  ['Karton 24-fach 3 dl fictif', 'packaging', 'KA1703', 1, '', 1.25],
];
export const PORT = 30;
export const items = (overrides: Array<Record<string, unknown>> = []) =>
  [...LIGNES.map(([name, kind, reference, quantity, unit, price]) => ({ name, kind, reference, quantity, unit, price, amountTTC: montant(quantity * price) })),
    { name: 'Versand fictif', kind: 'shipping', reference: '', quantity: 1, unit: '', price: PORT, amountTTC: PORT }]
    .map((item, i) => ligne({ ...item, ...(overrides[i] ?? {}) }));
export const sommeLignes = (list = items()) => Math.round(list.reduce((s: number, l: any) => s + Math.round(l.amountTTC * 100), 0)) / 100;
/** Le total imprimé : la somme des lignes arrondie à 5 centimes (Rundung suisse). */
export const arrondi5 = (somme: number) => Math.round(Math.round(somme * 100) / 5) * 5 / 100;

/** Le bloc de TVA imprimé : deux taux, un montant chacun, ni base ni total de TVA. */
export const BLOC_TVA = [{ code: '', rate: 0.025, base: null, amount: 0.45 }, { code: '', rate: 0.077, base: null, amount: 6.1 }];
export const TVA_SOMME = 6.55;

/** Une lecture de la pièce : HT non imprimé (null), taux global null (deux taux), TVA = la somme des deux lignes de TVA. */
export const lecture = (over: Record<string, unknown> = {}, list = items()) =>
  entete({ vendor: 'Boutique fictive', date: '09.09.2026', documentType: 'other', paymentEvidence: 'unknown', invoiceNumber: '', orderNumber: '',
    amountHT: null, tvaRate: null, tvaAmount: TVA_SOMME, vat: BLOC_TVA, amountTTC: arrondi5(sommeLignes(list)), items: list, ...over });

export const trouve = (points: any[], code: string) => points.filter(p => p.code === code);
