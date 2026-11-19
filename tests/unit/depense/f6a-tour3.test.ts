/**
 * Carnet tour 3, voie f6a (vision locale v3) : LR1-5 (barré qui ne diffère que par la casse, ou pas du tout), v3-3 (fournisseur barré contenu dans le nom retenu),
 * v3-4 (Règlement supposé montré barré), LR3-3 (appariement des lignes entre lectures ; prix perdu au final), LR2-3 (le compte des désaccords dit ce qu'il compte).
 * Lectures FICTIVES, de la FORME des pièces du banc v3 (doc2, doc14, doc25) ; Gemini jamais appelé.
 */
import { describe, expect, it } from 'vitest';
import type { PurchaseDraft, PurchaseLineDraft } from '../../../src/services/purchaseEntry';
import type { ScannedInvoiceResult } from '../../../src/services/geminiScanner';
import type { StockItem } from '../../../src/types';
import * as finale from '../../../src/ui/depense/finale';
import { appliquerFinale, baseDeBrouillon, brouillonDeLecture, libelleAvant, type Registres } from '../../../src/ui/depense/finale';
import { lecturesLenteur } from '../../../src/ui/depense/apercuDev';
import * as croises from '../../../src/ui/finance/controlesCroises';

const AUJOURDHUI = '19.11.2026';
const item = (n: number, name: string, quantity: number | null, price: number | null, amountTTC: number | null, extra: Record<string, unknown> = {}) =>
  ({ id: `line-${n}`, name, kind: 'equipment', reference: '', variant: '', quantity, unit: '', price, amountTTC, stockCategory: '', evidence: '', ambiguity: '', vatCode: '', ...extra });
const lecture = (items: any[], over: Record<string, unknown> = {}): ScannedInvoiceResult => ({
  documentType: 'receipt', paymentEvidence: 'paid', fieldWarnings: [], orderNumber: '', vendor: 'Brico Fictif', date: '18.11.2026', currency: 'CHF', invoiceNumber: '', amountHT: null, tvaRate: null, tvaAmount: null,
  amountTTC: Math.round(items.reduce((s, i) => s + (i.amountTTC ?? 0), 0) * 100) / 100, category: 'renovation', subcategory: '', description: 'Travaux', items, issues: [], points: [],
  controls: { lines: { checked: items.length, failed: 0, skipped: 0, skippedIds: [] }, sum: { statut: 'ok', base: 'TTC' }, vat: { statut: 'non-verifiable', base: 'TTC' }, totals: { statut: 'non-verifiable' } },
  review: { status: 'checked', findings: [], readers: 2 }, ...over,
}) as unknown as ScannedInvoiceResult;
const vide = (): PurchaseDraft => ({ submissionId: 'S1', date: AUJOURDHUI, vendor: '', invoiceNumber: '', description: '', category: 'renovation', lines: [], paymentStatus: 'paid', paymentMethod: 'bank', paymentDate: AUJOURDHUI, dueDate: '', sourceCurrency: 'CHF' });
const ligneVide = (): PurchaseLineDraft => ({ id: 'x', description: '', kind: 'equipment', unit: '', stockAction: 'none', equipmentAction: 'none' });
function fusion(provisoire: ScannedInvoiceResult, final: ScannedInvoiceResult, stockItems: readonly StockItem[] = [], jeton = 'j1') {
  const { draft, propositions } = brouillonDeLecture(vide(), provisoire, { stockItems, today: AUJOURDHUI, model: 'simule', documentHash: 'h', ligneVide });
  const base = baseDeBrouillon(draft, jeton, propositions, provisoire.items.length);
  const registres: Registres = { reviewedFields: [], manuallyClassified: new Set(), proposes: new Set(propositions.proposedStock), neufsOffice: new Set(propositions.neufDOffice), reglees: new Set(), focus: null };
  return { base, s: appliquerFinale({ base, courant: draft, provisoire, final, stockItems, today: AUJOURDHUI, registres, ligneVide }) };
}
const deux = (vProv: string, vFin: string) => {
  const items = [item(1, 'CHEVILLE NYLON 6MM', 10, 0.2, 2), item(2, 'VIS BOIS 4X40', 1, 5.5, 5.5)];
  return fusion(lecture(items, { vendor: vProv }), lecture(items.map((i, k) => ({ ...i, rangProvisoire: k })), { vendor: vFin, provisoireJeton: 'j1' })).s;
};

// ------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('LR1-5 (en-tête) et v3-3 : le fournisseur lu autrement n’est pas une correction', () => {
  it('doc14 : « Brau- und Rauchshop » puis « BRAU- UND RAUCHSHOP » (la casse seule) : ni barré ni compte ; le nom de la 3.8 est repris', () => {
    const s = deux('Brau- und Rauchshop', 'BRAU- UND RAUCHSHOP');
    expect(s.corrections.entete.vendor).toBeUndefined();
    expect(s.nCorrigees).toBe(0);
    expect(s.draft.vendor).toBe('BRAU- UND RAUCHSHOP');
  });
  it('doc2 : le nom court contenu, mots entiers, dans le nom retenu (« … Sàrl » puis « … Sàrl - Médecins vétérinaires ») : variante, pas correction', () => {
    const s = deux('Drs A. et B. Fictif-Exemple Sàrl', 'Drs A. et B. Fictif-Exemple Sàrl - Médecins vétérinaires');
    expect(s.corrections.entete.vendor).toBeUndefined();
    expect(s.nCorrigees).toBe(0);
    expect(s.draft.vendor).toBe('Drs A. et B. Fictif-Exemple Sàrl - Médecins vétérinaires');
  });
  it('témoins : un autre fournisseur, ou un nom qui n’est contenu que dans un mot de l’autre, restent une correction barrée', () => {
    expect(deux('Brico Fictif', 'Jardin Autre SA').corrections.entete.vendor).toEqual({ avant: 'Brico Fictif', apres: 'Jardin Autre SA' });
    expect(deux('Migro', 'Migrolino Gare').corrections.entete.vendor).toBeDefined();
  });
});

// ------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('LR1-5 (ligne) : « 30 g » barré sous « 30 g » : l’unité lue égale l’unité déduite n’est pas une correction', () => {
  const stock = (nom: string, unit: string, category: string) => ({ id: nom, ref: `MP-${nom}`, name: nom, unit, category, currentStock: 1, minStock: 0, reorder: false }) as unknown as StockItem;
  const STOCK = [stock('Malt Pilsner', 'kg', 'Malt'), stock('Malt de Munich', 'kg', 'Malt'), stock('Carapils', 'kg', 'Malt'), stock('Sabro 13.4%', 'g', 'Houblon'), stock('Citra 12.5%', 'g', 'Houblon'), stock('Levure Ale sèche', 'sachet', 'Levure')];
  it('banc v3-lent (lenteur-perdue) : Sabro et Citra, unité déduite « g » puis lue « g » : aucune correction d’unité, rien de barré', () => {
    const { provisoire, final, jeton } = lecturesLenteur('perdue');
    const { s, base } = fusion(provisoire!, final, STOCK, jeton);
    expect(s.etat).toBe('finie');
    for (const l of s.draft.lines.filter(x => /Sabro|Citra/.test(x.description))) {
      const corr = s.corrections.lignes[l.id] ?? [];
      expect(corr.map(c => c.champ), l.description).not.toContain('unit');
      expect(corr.length ? libelleAvant(base.lignes[l.id], corr, l) : '', l.description).not.toBe('30 g');
    }
  });
});

// ------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('v3-4 : un règlement SUPPOSÉ par la 1re lecture n’est pas montré barré', () => {
  it('doc2 : 1re lecture sans preuve (« Payé » supposé), 3.8 lit « à payer » : À payer, sans barré ni compte', () => {
    const items = [item(1, 'Consultation fictive', 1, 80, 80)];
    const { s } = fusion(lecture(items, { paymentEvidence: 'unknown', documentType: 'invoice' }), lecture([{ ...items[0], rangProvisoire: 0 }], { paymentEvidence: 'unpaid', documentType: 'invoice', provisoireJeton: 'j1' }));
    expect(s.draft.paymentStatus).toBe('unpaid');
    expect(s.corrections.entete.paiement).toBeUndefined();
    expect(s.nCorrigees).toBe(0);
  });
  it('témoin : une 1re lecture qui LISAIT « payé » puis la 3.8 « à payer » reste une correction barrée', () => {
    const items = [item(1, 'Consultation fictive', 1, 80, 80)];
    const { s } = fusion(lecture(items, { paymentEvidence: 'paid', documentType: 'invoice' }), lecture([{ ...items[0], rangProvisoire: 0 }], { paymentEvidence: 'unpaid', documentType: 'invoice', provisoireJeton: 'j1' }));
    expect(s.corrections.entete.paiement).toEqual({ avant: 'paid', apres: 'unpaid' });
  });
});

// ------------------------------------------------------------------------------------------------------------------------------------------------------------
const NOMS = ['VITRIFICATEUR FICTIF 5L', 'SAC GRAND FICTIF', 'BROSSE METAL FICTIVE', 'CUTTER FICTIF', 'ROULEAU LAQUE 12CM TUBEQ', 'MASTIC BOIS FICTIF', 'MARQUEUR FICTIF', 'SEAU ROUGE FICTIF', 'COMBINAISON JETABLE', 'MASQUE DE PROTECT.'];
const MONTANTS = [69.95, 1.2, 4.95, 5.2, 9.5, 4.25, 3.95, 2.95, 9.5, 9.95];
describe('LR3-3 : l’appariement des lignes entre lectures se vérifie sur les noms', () => {
  it('doc25 : les rangs du serveur décalés d’une ligne dès « ROULEAU » : aucune ligne retirée ni ajoutée, aucune valeur de la voisine barrée', () => {
    const provisoire = lecture(NOMS.map((n, k) => item(k + 1, n, null, null, MONTANTS[k], { kind: 'other' })));
    // La forme du doc25 (tirage robuste-1 t2) : le final relit « ROULEAU … TUBEO » sans rang, puis donne à chaque ligne suivante le rang de la PRÉCÉDENTE.
    const rangs = [0, 1, 2, 3, null, 4, 5, null, 7, 8];
    const final = lecture(NOMS.map((n, k) => item(k + 1, k === 4 ? 'ROULEAU LAQUE 12CM TUBEO' : n, null, null, MONTANTS[k], { kind: 'other', rangProvisoire: rangs[k] })), { provisoireJeton: 'j1' });
    const { s } = fusion(provisoire, final);
    expect(s.perdues.map(p => p.ligne.description)).toEqual([]);
    expect(s.ajoutees).toEqual([]);
    expect(s.corrections.lignes).toEqual({});
    expect(s.draft.lines.map(l => [l.description, l.amount])).toEqual(NOMS.map((n, k) => [k === 4 ? 'ROULEAU LAQUE 12CM TUBEO' : n, MONTANTS[k]]));
  });
  it('repli par position (M4, final sans rang) : « ROULEAU » n’est jamais barré sous un autre nom à un autre montant ; il est retiré et l’autre ajouté', () => {
    const provisoire = lecture([item(1, 'CUTTER FICTIF', 1, 5.2, 5.2), item(2, 'ROULEAU LAQUE 12CM', 1, 9.5, 9.5), item(3, 'SEAU ROUGE FICTIF', 1, 2.95, 2.95)]);
    const final = lecture([item(1, 'CUTTER FICTIF', 1, 5.2, 5.2), item(2, 'DEBOUCHEUR GEL 1L', 1, 7.5, 7.5), item(3, 'SEAU ROUGE FICTIF', 1, 2.95, 2.95)]);
    const { s } = fusion(provisoire, final);
    expect(s.corrections.lignes).toEqual({});
    expect(s.perdues.map(p => p.ligne.description)).toEqual(['ROULEAU LAQUE 12CM']);
    expect(s.ajoutees.length).toBe(1);
  });
  it('témoin : une pièce d’une seule ligne garde sa paire (BROSSE devient PINCEAU : correction barrée)', () => {
    const { s } = fusion(lecture([item(1, 'BROSSE PLATE 50MM', 1, 3.9, 3.9)]), lecture([item(1, 'PINCEAU PLAT 50', 1, 3.9, 3.9, { rangProvisoire: 0 })], { provisoireJeton: 'j1' }));
    expect(s.corrections.lignes['line-1'].map(c => c.champ)).toContain('description');
  });
  it('alignement : l’ordre est gardé, une paire proposée qui contredit le nom et le montant est refusée', () => {
    const p = [{ name: 'ALPHA ROUGE', amountTTC: 1 }, { name: 'BETA VERT', amountTTC: 2 }, { name: 'GAMMA BLEU', amountTTC: 3 }];
    expect(finale.alignerLignesLues(p, p, [1, 2, null])).toEqual([0, 1, 2]);
    expect(finale.alignerLignesLues(p, [p[0], { name: 'ZZZ AUTRE', amountTTC: 9 }], [0, 1])).toEqual([0, null]);
    // Une paire proposée qui croise (le port rangé ailleurs par la 3.8) reste, quand les noms sont les mêmes.
    expect(finale.alignerLignesLues(p, [p[0], p[2], p[1]], [0, 2, 1])).toEqual([0, 2, 1]);
  });
});

describe('LR3-3 : un prix connu n’est jamais remplacé par l’inconnu de la 3.8 (« 1 ? × 4,95 » barré sous « ? × — »)', () => {
  it('1re lecture « 1 × total » (ligne divers), 3.8 en matériel sans quantité ni prix : la ligne garde 1 × 4,95, rien de barré', () => {
    const { s } = fusion(lecture([item(1, 'BROSSE METAL FICTIVE', null, null, 4.95, { kind: 'other' })]), lecture([item(1, 'BROSSE METAL FICTIVE', null, null, 4.95, { kind: 'equipment', rangProvisoire: 0 })], { provisoireJeton: 'j1' }));
    const l = s.draft.lines[0];
    expect([l.quantity, l.unitPrice, l.amount]).toEqual([1, 4.95, 4.95]);
    expect((s.corrections.lignes['line-1'] ?? []).map(c => c.champ)).not.toEqual(expect.arrayContaining(['quantity']));
    expect((s.corrections.lignes['line-1'] ?? []).map(c => c.champ)).not.toEqual(expect.arrayContaining(['unitPrice']));
  });
  it('le montant corrigé par la 3.8 (69,95 → 6,95) : seul le montant est barré, le prix « 1 × total » suit le montant', () => {
    const { s, base } = fusion(lecture([item(1, 'VITRIFICATEUR FICTIF 5L', 1, 69.95, 69.95, { kind: 'other' })]), lecture([item(1, 'VITRIFICATEUR FICTIF 5L', null, null, 6.95, { kind: 'stock', rangProvisoire: 0 })], { provisoireJeton: 'j1' }));
    const l = s.draft.lines[0], corr = s.corrections.lignes['line-1'];
    expect(corr.map(c => c.champ).filter(c => c !== 'kind')).toEqual(['amount']); // la nature lue autrement reste une correction (sans barré : `libelleAvant` ne la dit pas)
    expect([l.quantity, l.unitPrice, l.amount]).toEqual([1, 6.95, 6.95]);
    expect(libelleAvant(base.lignes['line-1'], corr, l)).toBe('69,95');
  });
});

// ------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('LR2-3 : le compte des désaccords dit ce qu’il compte, en mots du brasseur', () => {
  it('doc25 : 7 valeurs sans accord des lectures : « 3/3 · 7 valeurs en désaccord », en-tête « 7 valeurs en désaccord »', () => {
    const [r] = croises.rangDesLectures({ attente: false, lectures: 3, nPagesLues: 1, nDesaccords: 7 });
    expect(r).toMatchObject({ cle: 'lectures', verdict: 'ecart', texte: 'Lectures', valeurs: '3/3 · 7 valeurs en désaccord', resume: '7 valeurs en désaccord', geste: 'Voir le désaccord', renvoi: 'lectures' });
  });
  it('doc2 : une seule valeur (le fournisseur) : « 1 valeur en désaccord » ; sans désaccord : « d’accord » ; pendant la lecture : 2 sur 3', () => {
    expect(croises.rangDesLectures({ attente: false, lectures: 3, nPagesLues: 1, nDesaccords: 1 })[0].valeurs).toBe('3/3 · 1 valeur en désaccord');
    expect(croises.rangDesLectures({ attente: false, lectures: 3, nPagesLues: 1, nDesaccords: 0 })[0]).toMatchObject({ verdict: 'ok', valeurs: "3/3 d'accord" });
    expect(croises.rangDesLectures({ attente: false, lectures: 3, nPagesLues: 2, nDesaccords: 0 })[0]).toMatchObject({ verdict: 'ok', texte: '2 pages lues' });
    expect(croises.rangDesLectures({ attente: true, lectures: 3, nPagesLues: 1, nDesaccords: 4 })[0]).toMatchObject({ verdict: 'inconnu', lectures: { faites: 2, sur: 3 } });
    expect(croises.rangDesLectures({ attente: false, lectures: 0, nPagesLues: 1, nDesaccords: 2 })).toEqual([]);
  });
});
