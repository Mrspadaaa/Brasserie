// Voie g2b-logique : un test par règle (D343, moins de fixtures). La preuve qui compte est le compte avant / après sur les vraies pièces (`mesure-banc.test.ts`).
// D328b (unité d'une ligne `other` ou `maintenance`) et le désaccord à l'en-tête sont couverts par `confiance/niveaux.test.ts` et `confiance/points.test.ts`.
import { describe, expect, it } from 'vitest';
import type { ScannedInvoiceResult } from '../../../../src/services/geminiScanner';
import type { StockItem } from '../../../../src/types';
import { deduireUnite, confianceLigne, type LigneConfiance } from '../../../../src/ui/depense/confiance';
import { lignesDeLecture } from '../../../../src/ui/depense/finale';
import { bandes, texteQte, type LigneBande } from '../../../../src/ui/depense/groupes';
import { makePoint } from '../../../../functions/src/invoiceControls';
import { PESE_PAR_CODE, type InvoicePoint } from '../../../../src/domain/finance/invoicePoints';

const lc = (description: string, quantity: number, unitPrice: number, over: Partial<LigneConfiance> = {}): LigneConfiance =>
  ({ id: `line-${description.length}`, description, kind: 'stock', quantity, unit: '', unitPrice, amount: Math.round(quantity * unitPrice * 100) / 100, stockCategory: '', ...over });

describe('D328a — une pièce dont le calcul tombe juste est sûre, hors des familles d\'ingrédients', () => {
  it('un pot « 5,8KG » à 1, des brosses, un détartrant : sûrs ; calcul faux : repris ; sirop de la même forme (sucre) : repris', () => {
    for (const l of [lc('Vernis acrylique blanc 5,8KG', 1, 64.9), lc('Brosse plate 50 mm', 4, 3.9), lc('Détartrant liquide 1 L', 2, 6.5)]) {
      expect(deduireUnite(l, { lignes: [l] }), l.description).toMatchObject({ niveau: 'sur', valeur: 'Stk' });
    }
    const faux = lc('Brosse plate 50 mm', 4, 3.9, { amount: 17 }), sirop = lc('Sirop fictif 460ml', 1, 7.5, { stockCategory: 'Sucre' });
    expect(deduireUnite(faux, { lignes: [faux] })).toMatchObject({ niveau: 'repris' });
    expect(deduireUnite(sirop, { lignes: [sirop] })).toMatchObject({ niveau: 'repris', regle: 'mesure-contenance' });
  });
});

describe('D328b — aucun « ? » à l\'en-tête pour une ligne hors stock', () => {
  it('une ligne hors stock sans unité ni quantité entière n\'est pas comptée « ? » ; un ingrédient sans unité l\'est toujours', () => {
    const L = (id: string, extra: Partial<LigneBande>): LigneBande => ({ id, groupe: 'autres', amount: 5, quantity: 1, unit: '', uniteLisible: false, mouture: false, ...extra });
    expect(texteQte(bandes([L('a', { horsStock: true }), L('b', { horsStock: true, quantity: undefined }), L('c', { unit: 'Stk', uniteLisible: true, quantity: 3 })])[0].qte)).toBe('3 Stk');
    expect(texteQte(bandes([L('a', { groupe: 'malt', quantity: 2 }), L('b', { groupe: 'malt', horsStock: true })])[0].qte)).toBe('2 ?');
  });
});

const item = (n: number, name: string, kind: string, quantity: number, unit: string, price: number, extra: Record<string, unknown> = {}) =>
  ({ id: `line-${n}`, name, kind, reference: '', variant: '', quantity, unit, price, amountTTC: Math.round(quantity * price * 100) / 100, stockCategory: '', evidence: '', ambiguity: '', vatCode: '', ...extra });
const lecture = (items: any[], category: string): ScannedInvoiceResult => ({ vendor: 'Brico Fictif SA', date: '21.10.2026', currency: 'CHF', category, items, points: [], issues: [], amountTTC: Math.round(items.reduce((s, i) => s + i.amountTTC, 0) * 100) / 100 }) as unknown as ScannedInvoiceResult;

describe('D328c — la nature suit la famille (ligne lue « stock »)', () => {
  it('nettoyant → cleaning, vernis → equipment (Rénovation), bouteille → packaging, fermenteur → equipment ; rien en stock, aucun « nouveau » ; malt et houblon inchangés', () => {
    const r = lignesDeLecture(lecture([item(1, 'Détartrant liquide 1 L', 'stock', 2, '', 6.5), item(2, 'Vernis acrylique blanc 5,8KG', 'stock', 1, '', 64.9), item(3, 'Bouteille 33 cl brune', 'stock', 24, '', 0.6),
      item(4, 'Fermenteur 30 L', 'stock', 1, '', 89), item(5, 'Pilsner Malz, Kg', 'stock', 5, '', 1.65), item(6, 'Citra 12.5%', 'stock', 50, '', 0.09)], 'brassage'), [], 'S1');
    expect(r.lines.map(l => l.kind)).toEqual(['cleaning', 'equipment', 'packaging', 'equipment', 'ingredient', 'ingredient']);
    expect(r.lines.slice(0, 4).map(l => l.stockAction)).toEqual(['none', 'none', 'none', 'none']);
    expect([...r.propositions.neufDOffice].sort()).toEqual(['line-5', 'line-6']);
  });
  it('exceptions : un article déjà au stock garde le lien ; une ligne sans mot de famille sous Brassage reste ingrédient ; une nature lue autre que « stock » n\'est jamais réécrite', () => {
    const article = { id: 'a1', ref: 'MP-31', name: 'Détergent alcalin fictif', category: 'Détergent', unit: 'kg', currentStock: 3, minStock: 1 } as unknown as StockItem;
    const lie = lignesDeLecture(lecture([item(1, 'Détergent alcalin fictif', 'stock', 2, 'Kg', 6.5)], 'brassage'), [article], 'S1').lines[0];
    expect([lie.stockAction, lie.stockRef]).toEqual(['existing', 'MP-31']);
    expect(lignesDeLecture(lecture([item(1, 'Objet fictif XJ-17', 'stock', 1, '', 12)], 'brassage'), [], 'S1').lines[0].kind).toBe('ingredient');
    expect(lignesDeLecture(lecture([item(1, 'Brosse plate 50 mm', 'equipment', 1, 'Stk', 3.9), item(2, 'Vernis fictif', 'maintenance', 1, '', 9)], 'renovation'), [], 'S1').lines.map(l => l.kind)).toEqual(['equipment', 'maintenance']);
  });
});

describe('désaccord de lecture — « repris », jamais « inconnu »', () => {
  it('sur une cellule de ligne, sans lecture retenue : repris', () => {
    const l = lc('Brosse plate 50 mm', 4, 3.9, { id: 'line-3', unit: 'Stk' });
    const base = makePoint('lectures-divergentes', 'ecart', 'items', 3, { regle: 'règle fictive', message: 'message fictif', unite: 'texte', enjeu: 'info', lu: 1, calcule: 2 });
    const p = { ...base, pese: PESE_PAR_CODE['lectures-divergentes'], champs: ['items.3.quantity'], valeurs: [{ lecture: 1, valeur: 'a', retenue: false }, { lecture: 2, valeur: 'b', retenue: false }] } as unknown as InvoicePoint;
    expect(confianceLigne(l, { lignes: [l], points: [p] }).quantite.niveau).toBe('repris');
  });
});
