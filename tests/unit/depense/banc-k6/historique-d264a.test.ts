import { describe, expect, it, vi } from 'vitest';
// D264a (01.11, nuit) : « Est-ce que le stock se met bien à jour ? Les factures aussi, tout suit ... » (relecture de la production, AUDIT R1).
// Une commande déjà au registre en écritures HISTORIQUES (ids `B-001`… : ni `finance`, ni lignes, ni fournisseur ; le libellé commence par la référence
// d'article ; une écriture par ligne de la commande) a été ressaisie par un scan : même total, mêmes références, aucun avertissement.
// Cause prouvée : `duplicateMatch` ne regarde que `tx.finance`. Données INVENTÉES de la même forme : aucune valeur de la production.
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getTransactions: () => [], getConfig: () => ({ fiscal: { isTvaRegistered: false } }) } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false, FirestoreRepo: { find: () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ validateFinancialPayment: () => undefined, FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/financeDocuments', () => ({ prepareFinanceDocument: (id: string) => ({ id }), saveFinanceDocumentConfirmed: async () => undefined }));
import { purchaseDuplicateReasons, purchaseDuplicates, validatePurchase, type PurchaseDraft } from '../../../../src/services/purchaseEntry';

/** La commande historique inventée : [libellé (référence d'abord), montant TTC]. La dernière est un port sans référence. */
const ECRITURES: Array<[string, number]> = [
  ['HE1111 Levure fictive', 19], ['MA0222 Malt fictif', 3.8], ['MA0020 Malt de base fictif', 8.25], ['HO0066 Houblon fictif', 3.48], ['KR2173 Capsules fictives', 2.5],
  ['Versand fictif', 30],
];
const SOMME = Math.round(ECRITURES.reduce((s, [, m]) => s + Math.round(m * 100), 0)) / 100;   // 67,03
const historique = (date = '15.03.2026', prefixe = 'B', categorie = 'brassage') =>
  ECRITURES.map(([description, amountTTC], i) => ({
    id: `${prefixe}-${String(i + 1).padStart(3, '0')}`, date, description, amountHT: amountTTC, tvaRate: 0, tvaAmount: 0, amountTTC, category: categorie, subcategory: '',
  })) as any[];
const REFS = ['HE1111', 'MA0222', 'MA0020', 'HO0066', 'KR2173'];
const brouillon = (plus: Partial<PurchaseDraft> = {}): PurchaseDraft => ({
  submissionId: 'saisie-d264a', date: '15.03.2026', vendor: 'Boutique fictive', invoiceNumber: '', description: 'Commande en ligne', category: 'brassage', amount: SOMME,
  lines: [...REFS.map((reference, i) => ({ id: `l${i}`, description: `Article ${i}`, kind: 'ingredient' as const, amount: ECRITURES[i][1], quantity: 1, unit: '', stockAction: 'none' as const, equipmentAction: 'none' as const, sourceReference: reference })),
    { id: 'port', description: 'Versand', kind: 'shipping' as const, amount: 30, unit: '', stockAction: 'none' as const, equipmentAction: 'none' as const }],
  paymentStatus: 'unpaid', paymentMethod: 'bank', paymentDate: '', dueDate: '', sourceCurrency: 'CHF', ...plus,
});

describe('D264a — un achat déjà au registre en écritures historiques est signalé', () => {
  it('la forme de l’audit : mêmes références, même total (somme des écritures de la pièce), même jour : signalé une fois', () => {
    const trouves = purchaseDuplicates(brouillon(), historique());
    expect(trouves.map(tx => tx.id)).toEqual(['B-001']);   // une seule entrée pour la pièce, la première écriture
  });

  it('le motif dit ce qui a été reconnu : le nombre d’écritures, le total, les références (jamais un montant de la production)', () => {
    const saisie = brouillon();   // l'écran passe le même brouillon aux deux appels
    const [premiere] = purchaseDuplicates(saisie, historique());
    const motifs = purchaseDuplicateReasons(saisie, premiere);
    expect(purchaseDuplicateReasons(brouillon(), premiere)).toEqual([]);   // un autre brouillon n'hérite pas d'un motif périmé
    expect(motifs.length).toBeGreaterThanOrEqual(3);
    expect(motifs.join(' | ')).toMatch(/6 écritures historiques/);
    expect(motifs.join(' | ')).toMatch(/même total/i);
    expect(motifs.join(' | ')).toMatch(/5 références? d’article en commun/);
  });

  it('l’enregistrement est bloqué comme pour tout doublon, jusqu’à ce que le brasseur le confirme', () => {
    const erreurs = validatePurchase(brouillon(), { rawMaterials: [], cleaning: [], equipment: [] } as any, historique());
    expect(erreurs.join(' ')).toContain('achat similaire existe déjà');
    expect(validatePurchase(brouillon({ duplicateConfirmed: true }), { rawMaterials: [], cleaning: [], equipment: [] } as any, historique()).join(' ')).not.toContain('achat similaire');
  });

  it('un total arrondi à 5 centimes (Rundung) reste le même achat : 67,05 pour 67,03', () => {
    expect(purchaseDuplicates(brouillon({ amount: 67.05 }), historique()).map(tx => tx.id)).toEqual(['B-001']);
  });

  it('à côté d’une dépense au format actuel déjà reconnue : les deux sont rendues, la règle sûre d’abord', () => {
    const actuelle = { id: 'TX-actuelle', date: '15.03.2026', amountTTC: SOMME, description: 'Même fichier', category: 'brassage', finance: { kind: 'expense', version: 1, amountCents: Math.round(SOMME * 100), vendor: 'Boutique fictive', sourceDocumentHash: 'h'.repeat(64), recordedAt: '2026-11-01T07:00:00.000Z', lines: [] } } as any;
    expect(purchaseDuplicates(brouillon({ documentHash: 'h'.repeat(64) }), [...historique(), actuelle]).map(tx => tx.id)).toEqual(['TX-actuelle', 'B-001']);
  });

  // Ce qui ne doit PAS être signalé (aucun faux doublon).
  it('un autre total (plus de 5 centimes d’écart) : rien', () => {
    expect(purchaseDuplicates(brouillon({ amount: 67.1 }), historique())).toEqual([]);
    expect(purchaseDuplicates(brouillon({ amount: 66.9 }), historique())).toEqual([]);
  });
  it('aucune référence en commun : rien (même total, même jour)', () => {
    const autres = brouillon({ lines: brouillon().lines.map((l, i) => ({ ...l, sourceReference: l.sourceReference ? `ZZ${i}` : undefined })) });
    expect(purchaseDuplicates(autres, historique())).toEqual([]);
  });
  it('sans référence sur le brouillon : rien (le total seul ne prouve pas un doublon)', () => {
    expect(purchaseDuplicates(brouillon({ lines: brouillon().lines.map(l => ({ ...l, sourceReference: undefined })) }), historique())).toEqual([]);
  });
  it('une date éloignée (plus de 14 jours) ou absente : rien', () => {
    expect(purchaseDuplicates(brouillon({ date: '15.06.2026' }), historique())).toEqual([]);
    expect(purchaseDuplicates(brouillon({ date: '' }), historique())).toEqual([]);
  });
  it('des écritures d’un autre jour, d’une autre série (L-…) ou des apports : jamais additionnées à la pièce', () => {
    expect(purchaseDuplicates(brouillon(), historique('16.03.2026')).map(tx => tx.id)).toEqual(['B-001']);   // un jour d'écart : la même pièce (14 jours au plus)
    const dUnAutreJour = historique('16.03.2026').slice(0, 3).map((tx, i) => ({ ...tx, id: `B-90${i}` }));
    expect(purchaseDuplicates(brouillon(), [...historique(), ...dUnAutreJour]).map(tx => tx.id)).toEqual(['B-001']);   // elles ne s'ajoutent pas à la somme du 15.03
    expect(purchaseDuplicates(brouillon(), historique('15.04.2026'))).toEqual([]);
    expect(purchaseDuplicates(brouillon(), historique('15.03.2026', 'A', 'apports'))).toEqual([]);
    // une autre série le même jour ne fausse pas la somme de la pièce
    expect(purchaseDuplicates(brouillon(), [...historique(), ...historique('15.03.2026', 'L')]).map(tx => tx.id)).toEqual(['B-001', 'L-001']);
  });
  it('un autre achat historique le même jour, de la même série, change la somme : rien (limite connue, prudente)', () => {
    const intrus = { id: 'B-027', date: '15.03.2026', description: 'XX9999 Autre achat fictif', amountHT: 12, tvaRate: 0, tvaAmount: 0, amountTTC: 12, category: 'brassage', subcategory: '' } as any;
    expect(purchaseDuplicates(brouillon(), [...historique(), intrus])).toEqual([]);
  });
  it('une écriture historique annulée n’est pas un doublon, une écriture au format actuel (finance) n’est pas lue comme historique', () => {
    const annulee = historique().map(tx => ({ ...tx, finance: { kind: 'expense', version: 1, amountCents: Math.round(tx.amountTTC * 100), voidedAt: '2026-10-01T00:00:00.000Z', lines: [] } }));
    expect(purchaseDuplicates(brouillon(), annulee)).toEqual([]);
  });
  it('un brouillon sans total valide : rien', () => {
    expect(purchaseDuplicates(brouillon({ amount: 0 }), historique())).toEqual([]);
    expect(purchaseDuplicates(brouillon({ amount: undefined as any }), historique())).toEqual([]);
  });
});
