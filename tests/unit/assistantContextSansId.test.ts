import { describe, expect, it } from 'vitest';
import { buildFinanceAssistantContext, type FinanceAssistantInput } from '../../src/domain/finance/assistantContext';
import type { FinanceTransaction, FinancialPlan } from '../../src/domain/finance/types';

/**
 * w2 (test d'écran efff31bd) : l'Aide au brasseur voyait « TX-… » et « cashComplete » dans les réponses du compagnon Finances.
 * Le contexte que le modèle lit nomme les pièces par leurs mots (fournisseur, date, montant) et les drapeaux en français :
 * jamais un identifiant interne, jamais un nom de champ anglais que le modèle peut recopier. Aucun appel Gemini ici.
 */
const tx = (id: string, description: string, amountCents: number, date: string, extra: Record<string, unknown> = {}): FinanceTransaction => ({
  id, date, description, category: 'brassage', subcategory: 'Malt', amountHT: amountCents / 100, amountTTC: amountCents / 100, tvaRate: 0, tvaAmount: 0,
  finance: { version: 1, kind: 'expense', amountCents, vendor: 'Malterie du Lac', dueDate: '2026-06-15', paymentStatus: 'unpaid', recordedAt: `${date}T10:00:00Z`, proofDocumentId: `PROOF-${id}`,
    lines: [{ id: 'malt', kind: 'ingredient', description, stockItemRef: 'MP-PILS', quantity: 2, unit: 'kg', amountCents }], ...extra }
} as FinanceTransaction);
const plan: FinancialPlan = { id: 'PL-HOTTE', title: 'Hotte inox', date: '2026-06-15', amountCents: 100000, direction: 'out', category: 'materiel', source: 'equipment', status: 'active', createdAt: '2026-06-01T10:00:00Z',
  upgrade: { version: 1, sourceCreativeItemId: 'CI-HOTTE', timing: 'soon', stage: 'quote', datePrecision: 'month', estimateSource: 'quote', purchaseCents: 90000, installationCents: 10000, budgetKnown: true, purpose: 'Évacuer la vapeur' } } as FinancialPlan;
const entree = (openingConfirmed = true): FinanceAssistantInput => ({
  transactions: [tx('TX-8F3A21', 'Malt Pilsner', 10_000, '2026-05-20'), tx('TX-BAD001', 'Facture sans montant', -5, '2026-05-21'), tx('TX-REFUND', 'Avoir malt', 2_000, '2026-05-25', { kind: 'refund', refundOfId: 'TX-8F3A21' })],
  payments: [{ id: 'PAY-77', transactionId: 'TX-8F3A21', date: '2026-05-22', amountCents: 4000, direction: 'out', method: 'bank', recordedAt: '2026-05-22T10:00:00Z' }],
  plans: [plan], assets: [{ id: 'ASSET-CUVE', name: 'Cuve inox', acquisitionDate: '2025-01-01', inServiceDate: '2025-01-01', acquisitionCents: 100_000, businessUsePct: 100, category: 'tanks', method: 'linear', ratePct: 10, openingYear: 2025, openingValueCents: 100_000, openingConfirmed: true, firstYearFraction: 1 }] as never,
  closings: [{ id: 'CLOSE-2025', year: 2025, createdAt: '2026-01-02T10:00:00Z', openingInventory: [], closingInventory: [], inventoriesConfirmed: true, adjustments: [] }], archives: [],
  stock: [{ id: 'MP-PILS', ref: 'MP-PILS', name: 'Malt Pilsner', category: 'Malt', unit: 'kg', currentStock: 2, minStock: 0, reorder: false }] as never,
  equipment: [{ id: 'EQ-CUVE', ref: 'EQ-REF-9', name: 'Cuve de fermentation', category: 'tanks', state: 'bon' }] as never,
  recipes: [{ id: 'REC-BLONDE', name: 'Blonde fictive', style: 'Blonde', volumeL: 20, malts: [{ name: 'Malt Pilsner', weightKg: 4 }], hops: [], yeast: { name: '', qty: 0, unit: 'sachet' } } as never],
  batches: [], creativeItems: [{ id: 'CI-HOTTE', type: 'equipment', title: 'Hotte inox', status: 'quote' }] as never,
  profile: { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, annualProductionL: 1000, historyCompleteFrom: '2025-01-01',
    ...(openingConfirmed ? { openingCash: { date: '2025-01-01', amountCents: 100_000, confirmed: true } } : {}) },
  coverage: Object.fromEntries(['transactions', 'financialPayments', 'financialPlans', 'financialAssets', 'financialClosings', 'creativeItems', 'stockItems', 'batches', 'recipes', 'equipment']
    .map(name => [name, { loaded: 1, limit: 1500, complete: true, totalAtLeast: 1, order: 'document-id' as const }])), asOf: '2026-06-01'
});
const texte = (input: FinanceAssistantInput) => JSON.stringify(buildFinanceAssistantContext(input));

const IDENTIFIANTS = ['TX-8F3A21', 'TX-BAD001', 'TX-REFUND', 'PAY-77', 'PL-HOTTE', 'CI-HOTTE', 'ASSET-CUVE', 'CLOSE-2025', 'MP-PILS', 'EQ-CUVE', 'EQ-REF-9', 'REC-BLONDE', 'PROOF-'];
const CHAMPS_INTERNES = ['cashComplete', 'proofId', 'sourceIds', 'planId', 'refundOfId', 'closingId', 'assetId', 'recipeId', 'batchId', 'stockItemRef', 'sourceCreativeItemId', '"id"', '"ref"'];

describe('contexte du compagnon Finances : aucun identifiant interne', () => {
  it('aucun « TX- » ni autre identifiant de pièce, de paiement, de projet, de matériel ou de recette dans le texte envoyé', () => {
    const json = texte(entree());
    expect(json).not.toMatch(/TX-/);
    for (const id of IDENTIFIANTS) expect(json, id).not.toContain(id);
  });
  it('aucun nom de champ interne ou anglais que le modèle pourrait recopier (cashComplete, sourceIds, proofId…)', () => {
    const json = texte(entree());
    for (const champ of CHAMPS_INTERNES) expect(json, champ).not.toContain(champ);
  });
  it('les pièces sont nommées par leurs mots : libellé, fournisseur, date, montant', () => {
    const { ledger } = buildFinanceAssistantContext(entree());
    const malt = ledger.recent.find(row => row.label === 'Malt Pilsner');
    expect(malt).toMatchObject({ date: '2026-05-20', vendor: 'Malterie du Lac', amountCents: 10_000 });
    expect(ledger.actionable.some(row => row.label === 'Malt Pilsner')).toBe(true);
  });
  it('les phrases d’alerte (date ou montant invalide, justificatif manquant) citent la pièce par ses mots, pas par son identifiant', () => {
    const contexte = buildFinanceAssistantContext(entree());
    const alertes = JSON.stringify([contexte.attention, contexte.annual.map(a => 'missing' in a ? a.missing : null), contexte.forecast.warnings]);
    expect(alertes).toContain('Facture sans montant');
    expect(alertes).not.toMatch(/TX-/);
  });
  it('le drapeau de caisse est en français : « caisse complète » ou rien (jamais un faux « complète » sur un solde inconnu)', () => {
    const sain = buildFinanceAssistantContext({ ...entree(), transactions: [tx('TX-8F3A21', 'Malt Pilsner', 10_000, '2026-05-20')] });
    expect(sain.ledger.caisse).toBe('complète');
    expect(sain.forecast.caisse).toBe('complète');
    const sansSolde = buildFinanceAssistantContext(entree(false));
    expect('caisse' in sansSolde.ledger).toBe(false);
    expect(sansSolde.ledger.cashCents).toBeNull();
    expect('caisse' in sansSolde.forecast).toBe(false);
  });
  it('la plomberie reste intacte : le montant compté et la prévision ne changent pas', () => {
    const contexte = buildFinanceAssistantContext({ ...entree(), transactions: [tx('TX-8F3A21', 'Malt Pilsner', 10_000, '2026-05-20')] });
    expect(contexte.ledger.cashCents).toBe(100_000 - 4_000);
    expect(contexte.equipmentProjects.records[0]).toMatchObject({ title: 'Hotte inox', inForecast: true, purpose: 'Évacuer la vapeur' });
    expect(contexte.forecast.windows[0].sourceCount).toBeGreaterThan(0);
  });
});

describe('outil d’investissement : la caisse lue dans le contexte français', () => {
  const hypotheses = { purchaseCents: 100_000, deliveryCents: 0, installationCents: 0, annualSavingsCents: 10_000, annualMaintenanceCents: 0, annualEnergyCents: 0, annualOtherCostsCents: 0, assumptionNote: 'Devis fictif de comparaison' };
  it('« caisse : complète » donne le solde après achat ; sans drapeau, il reste inconnu', async () => {
    const { simulateBreweryInvestment } = await import('../../src/domain/finance/assistantContext');
    expect(simulateBreweryInvestment(hypotheses, { cashCents: 300_000, caisse: 'complète' }).cashAfterImmediatePurchaseCents).toBe(200_000);
    expect(simulateBreweryInvestment(hypotheses, { cashCents: null }).cashAfterImmediatePurchaseCents).toBeNull();
    expect(simulateBreweryInvestment(hypotheses, { cashCents: 300_000 }).cashAfterImmediatePurchaseCents).toBeNull();
  });
});
