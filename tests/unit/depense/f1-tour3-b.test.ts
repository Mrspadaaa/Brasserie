/**
 * Carnet tour 3, voie f1, ajouts du pilote (voie r, DÉCISIONS 1 à 3) : LR1-5 et LR3-3 (barrés qui ne corrigent rien), LR2-3, LR2-5 et LR3-4 (compteur de désaccords
 * gonflé par la nature), LR2-7 (actes vétérinaires rangés « Matériel »).
 * Lectures FICTIVES (noms de la forme des cas doc2 et doc25, aucune valeur d'une vraie pièce) ; Gemini jamais appelé.
 */
import { describe, expect, it } from 'vitest';
import type { PurchaseDraft, PurchaseLineDraft } from '../../../src/services/purchaseEntry';
import type { ScannedInvoiceResult } from '../../../src/services/geminiScanner';
import * as finale from '../../../src/ui/depense/finale';
import { appliquerFinale, baseDeBrouillon, brouillonDeLecture, libelleAvant, type Registres } from '../../../src/ui/depense/finale';
import { ressemblance as ressemblanceServeur } from '../../../functions/src/invoiceScanVote';
import * as confiance from '../../../src/ui/depense/confiance';
import type { LigneConfiance } from '../../../src/ui/depense/confiance';
import * as etat from '../../../src/ui/depense/etat';
import { chipsDeLecture } from '../../../src/ui/depense/etat';
import { familleDe } from '../../../src/ui/depense/familles';
import { makePoint } from '../../../functions/src/invoiceControls';
import { PESE_PAR_CODE, type InvoicePoint } from '../../../src/domain/finance/invoicePoints';

// ------------------------------------------------------------------------------------------------------------------------------------------------------------
// LR1-5, LR3-3 : une variante d'orthographe n'est pas une correction
// ------------------------------------------------------------------------------------------------------------------------------------------------------------
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
function fusion(provisoire: ScannedInvoiceResult, final: ScannedInvoiceResult) {
  const { draft, propositions } = brouillonDeLecture(vide(), provisoire, { stockItems: [], today: AUJOURDHUI, model: 'simule', documentHash: 'h', ligneVide });
  const base = baseDeBrouillon(draft, 'j1', propositions, provisoire.items.length);
  const registres: Registres = { reviewedFields: [], manuallyClassified: new Set(), proposes: new Set(propositions.proposedStock), neufsOffice: new Set(propositions.neufDOffice), reglees: new Set(), focus: null };
  return appliquerFinale({ base, courant: draft, provisoire, final, stockItems: [], today: AUJOURDHUI, registres, ligneVide });
}

/** Les paires de la forme du doc25 (lettre lue O / Q / 0, un point pour une virgule) : 94 à 100 % de ressemblance. */
const VARIANTES: Array<[string, string]> = [
  ['ROULEAU LAQUE 12CM TUBEO', 'ROULEAU LAQUE 12CM TUBEQ'],
  ['VITRIFICATEUR PARQUET MAT 2,5L', 'VITRIFICATEUR PARQUET MAT 2.5L'],
  ['DEBOUCHEUR GEL FICTIF 1L', 'DEBOUCHEER GEL FICTIF 1L'],
];

describe('LR1-5, LR3-3 : un nom lu autrement de quelques lettres ne pose pas de « corrigée »', () => {
  it('la ressemblance de l’app est celle du serveur (Levenshtein normalisée), au centième près', async () => {
    const { ressemblanceNoms, SEUIL_VARIANTE_NOM } = await import('../../../src/ui/depense/ressemblanceNoms');
    const paires: Array<[string, string]> = [...VARIANTES, ['BROSSE PLATE 50MM', 'PINCEAU PLAT 50'], ['Pilsner Malz', 'Pilsner Malt'], ['', 'X'], ['Café', 'cafe']];
    for (const [a, b] of paires) expect(ressemblanceNoms(a, b)).toBeCloseTo(ressemblanceServeur(a, b), 10);
    for (const [a, b] of VARIANTES) expect(ressemblanceNoms(a, b)).toBeGreaterThanOrEqual(SEUIL_VARIANTE_NOM);
  });

  it('chaque paire de variantes : ni correction, ni « corrigée », ni barré ; le nom de la 3.8 est repris', () => {
    for (const [avant, apres] of VARIANTES) {
      const provisoire = lecture([item(1, avant, 1, 9.9, 9.9), item(2, 'CHEVILLE NYLON 6MM', 10, 0.2, 2)]);
      const final = lecture([item(1, apres, 1, 9.9, 9.9, { rangProvisoire: 0 }), item(2, 'CHEVILLE NYLON 6MM', 10, 0.2, 2, { rangProvisoire: 1 })], { provisoireJeton: 'j1' });
      const s = fusion(provisoire, final);
      expect(s.etat).toBe('finie');
      expect(s.corrections.lignes['line-1'], `${avant} / ${apres}`).toBeUndefined();
      expect(s.nCorrigees).toBe(0);
      expect(s.draft.lines.find(l => l.id === 'line-1')!.description).toBe(apres);
    }
  });

  it('un vrai changement de nom reste une correction barrée (BROSSE devient PINCEAU)', () => {
    const provisoire = lecture([item(1, 'BROSSE PLATE 50MM', 1, 3.9, 3.9)]);
    const final = lecture([item(1, 'PINCEAU PLAT 50', 1, 3.9, 3.9, { rangProvisoire: 0 })], { provisoireJeton: 'j1' });
    const s = fusion(provisoire, final);
    expect(s.corrections.lignes['line-1'].map(c => c.champ)).toContain('description');
    expect(s.nCorrigees).toBe(1);
  });

  it('une variante de nom ET un montant corrigé : seul le montant est barré', () => {
    const provisoire = lecture([item(1, 'ROULEAU LAQUE 12CM TUBEO', 1, 9.9, 9.9)]);
    const final = lecture([item(1, 'ROULEAU LAQUE 12CM TUBEQ', 1, 6.95, 6.95, { rangProvisoire: 0 })], { provisoireJeton: 'j1' });
    const s = fusion(provisoire, final);
    const champs = s.corrections.lignes['line-1'].map(c => c.champ);
    expect(champs).not.toContain('description');
    expect(champs).toContain('amount');
    expect(libelleAvant({ description: 'ROULEAU LAQUE 12CM TUBEO', quantity: 1, unitPrice: 9.9, amount: 9.9 }, s.corrections.lignes['line-1'])).not.toContain('ROULEAU');
  });

  it('varianteDeNom : seulement les cellules de nom ; « imprime » compare son nom et garde sa variante', () => {
    expect(finale.varianteDeNom('description', 'ROULEAU LAQUE 12CM TUBEO', 'ROULEAU LAQUE 12CM TUBEQ')).toBe(true);
    expect(finale.varianteDeNom('amount', 9.9, 9.91)).toBe(false);
    expect(finale.varianteDeNom('imprime', { nom: 'ROULEAU LAQUE 12CM TUBEO' }, { nom: 'ROULEAU LAQUE 12CM TUBEQ' })).toBe(true);
    expect(finale.varianteDeNom('imprime', { nom: 'ROULEAU LAQUE 12CM', variante: 'blanc' }, { nom: 'ROULEAU LAQUE 12CM', variante: 'noir' })).toBe(false);
  });

  it('« ? × ? » : un barré qui ne dit que des inconnus est tu (la rangée n’affiche pas de barré vide de sens)', () => {
    const avant = libelleAvant({ description: 'X', quantity: undefined, unitPrice: undefined }, [{ champ: 'quantity' }, { champ: 'unitPrice' }]);
    expect(avant).toMatch(/\?/);
    expect(etat.barreMuet(avant)).toBe(true);
    expect(etat.barreMuet('? · ?')).toBe(true);
    expect(etat.barreMuet('2 × 4,50')).toBe(false);
    expect(etat.barreMuet('× 1,45')).toBe(false);
    expect(etat.barreMuet('30 ?')).toBe(false);
  });
});

// ------------------------------------------------------------------------------------------------------------------------------------------------------------
// LR2-3, LR2-5, LR3-4 : la nature disputée ne compte pas dans « n désaccords »
// ------------------------------------------------------------------------------------------------------------------------------------------------------------
const desaccord = (n: number, cellule: string, valeurs: string[]): InvoicePoint => {
  const base = makePoint('lectures-divergentes', 'ecart', 'items', n, { regle: 'règle fictive', message: `ligne ${n} — ${cellule} : lectures divergentes`, unite: 'texte', enjeu: 'stock', luTexte: valeurs[0] });
  return { ...base, pese: PESE_PAR_CODE['lectures-divergentes'], champs: [`items.${n}.${cellule}`], valeurs: valeurs.map((valeur, i) => ({ lecture: i + 1, valeur, retenue: i === 0 })) } as unknown as InvoicePoint;
};
const ligneC = (n: number, description: string, kind: string, quantity: number, unitPrice: number): LigneConfiance =>
  ({ id: `line-${n}`, description, kind, quantity, unit: '', unitPrice, amount: Math.round(quantity * unitPrice * 100) / 100, stockCategory: '' });
const nDesaccords = (points: readonly InvoicePoint[]) => chipsDeLecture(points, []).filter(c => c.source === 'point').reduce((t, c) => t + c.codes.filter(k => k === 'lectures-divergentes').length, 0);

describe('LR2-3, LR2-5, LR3-4 : le compte de désaccords ne compte pas la nature (`kind`) que l’app range elle-même', () => {
  const lignes = [ligneC(1, 'Détartrant liquide 1 L', 'cleaning', 2, 6.5), ligneC(2, 'Pilsner Malz, Kg', 'ingredient', 5, 1.65), ligneC(3, 'Fermenteur 30 L fictif', 'equipment', 1, 89)];
  const points = [desaccord(1, 'kind', ['cleaning', 'other', 'stock']), desaccord(2, 'kind', ['ingredient', 'stock', 'other']), desaccord(3, 'kind', ['equipment', 'other', 'stock']), desaccord(2, 'price', ['1.65', '1.56', '1.65'])];
  it('trois désaccords de nature (stock ou non) et un désaccord de prix : « 1 désaccord »', () => {
    expect(nDesaccords(points)).toBe(4); // le compte d'avant
    const montres = confiance.pointsAMontrer(points);
    expect(nDesaccords(montres)).toBe(1);
    expect(montres.every(p => !p.champs.some(c => /\.kind$/.test(c)))).toBe(true);
    // la rangée d'une famille qui entre en stock (le détartrant) garde sa marque : seul le compte se tait (D328a)
    expect(confiance.confianceLigne(lignes[0], { lignes, points, categorie: 'brassage' }).famille.niveau).toBe('repris');
  });
  it('seulement des désaccords de nature : aucun désaccord (« Lectures 3/3 d’accord »)', () => {
    expect(confiance.pointsAMontrer(points.slice(0, 3))).toHaveLength(0);
  });
  it('un point sans nom de champ (champs vide) n’est jamais tu', () => {
    const p = { ...desaccord(2, 'kind', ['a', 'b', 'c']), champs: [] } as InvoicePoint;
    expect(confiance.pointsAMontrer([p])).toHaveLength(1);
  });
});

// ------------------------------------------------------------------------------------------------------------------------------------------------------------
// LR2-7 : un acte vétérinaire est un service, jamais du Matériel
// ------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('LR2-7 : actes vétérinaires et prestations → Services, quelle que soit la nature lue', () => {
  const ACTES = [
    'Sédation IM, pose de cathéter, induction narcose, intubation et narcose gazeuse y compris perfusion IV',
    'Stérilisation de la chienne, ovariectomie',
    'Injection sous-cutanée, petits animaux',
    'Consultation vétérinaire',
    'Tierärztliche Untersuchung und Impfung',
    'Honoraires de pose',
  ];
  for (const nom of ACTES) for (const kind of ['other', 'equipment', 'stock', 'unknown']) {
    it(`« ${nom} » (${kind}) → Services`, () => expect(familleDe({ nom, kind, categorie: 'divers' })).toBe('service'));
  }
  it('le brassage ne change pas : un fermenteur, une pompe, une pierre de carbonatation restent du Matériel', () => {
    expect(familleDe({ nom: 'Fermenteur 30 L fictif', kind: 'equipment', categorie: 'materiel' })).toBe('materiel');
    expect(familleDe({ nom: 'Pompe de transfert', kind: 'equipment', categorie: 'materiel' })).toBe('materiel');
    expect(familleDe({ nom: 'Pierre de carbonatation inox', kind: 'equipment', categorie: 'materiel' })).toBe('materiel');
  });
});
