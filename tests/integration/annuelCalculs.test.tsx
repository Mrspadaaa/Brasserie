import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null } }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { FinanceService } from '../../src/services/financeService';
import { buildAnnualReport } from '../../src/domain/finance/annual';
import { emptyTaxClosing, taxBasisKey } from '../../src/domain/finance/fribourgTax';
import { demoData, AUJOURDHUI } from './annuelSupport';
import { baseProposee, escalierMateriel, etapesPiste, inventairesParNature, MESSAGES_NON_CLASSES, moisDeLAnnee, moisNotes, perteAvantStock, piecesNonClassees, plansManquants, plateaux, pontCaisse, valeurEstimee } from '../../src/ui/finance/annuel/calculs';
import { ecrireTax } from '../../src/ui/finance/annuel/Ecrire';
import type { FinancialClosing } from '../../src/domain/finance/types';

const YEAR = 2026;
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${AUJOURDHUI}T10:00:00`)); window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); });
afterEach(() => { vi.useRealTimers(); FirestoreRepo.stopSync(); });
const rapport = (closing?: FinancialClosing, d = demoData()) => buildAnnualReport({ year: YEAR, transactions: d.transactions, payments: d.payments, assets: d.assets, profile: d.profile, closing });
const cloture = (over: Partial<FinancialClosing> = {}): FinancialClosing => ({ id: 'C1', year: YEAR, createdAt: '2026-11-09T10:00:00Z', openingInventory: [], closingInventory: [], inventoriesConfirmed: true, adjustments: [], ...over });

describe('Annuel : tête et piste', () => {
  it('perte avant stock : le résultat du domaine, sans la variation de stock', () => {
    const r = rapport(cloture());
    expect(r.resultCents).not.toBeNull();
    expect(r.resultCents).toBe(perteAvantStock(r));
    const avecStock = rapport(cloture({ closingInventory: [{ id: 'I', name: 'Malt', kind: 'raw', quantity: 1, unit: 'kg', valueCents: 10_000 }] }));
    expect(avecStock.resultCents).toBe(perteAvantStock(avecStock) + 10_000);
    expect(rapport().resultCents).toBeNull(); // stock inconnu : jamais un résultat
  });
  it('une pièce « matériel » sans `finance` est non classée : résultat nul, la tête ne le prétend pas', () => {
    const d = demoData();
    d.transactions.push({ id: 'X-MAT', date: '2026-10-02', description: 'Pompe', amountHT: 100, amountTTC: 100, tvaAmount: 0, tvaRate: 0, category: 'materiel', subcategory: '' });
    const r = rapport(cloture(), d);
    expect(r.resultCents).toBeNull();
    expect(piecesNonClassees(r).length).toBeGreaterThan(0);
    expect(r.missing.some(m => m.includes(MESSAGES_NON_CLASSES[0]))).toBe(true); // le fragment suit le domaine
  });
  it('piste : sur la démo, les étapes 2 et 4 sont prêtes et la prochaine est la 1', () => {
    const d = demoData(), r = rapport(undefined, d);
    const e = etapesPiste({ report: r, tax: r.tax!, closing: undefined, profile: d.profile, assets: d.assets });
    expect(e.filter(x => x.prete).map(x => x.n)).toEqual([2, 4]);
    const tout = rapport(cloture({ tax: { ...emptyTaxClosing(), activity: 'main', reviewedBasis: undefined } }), d);
    expect(etapesPiste({ report: tout, tax: tout.tax!, closing: cloture(), profile: d.profile, assets: d.assets })[2].prete).toBe(true);
  });
});

describe('Annuel : étapes', () => {
  it('étape 1 : mois sans pièce « vide », mois futurs « à venir »', () => {
    const r = rapport(), m = moisNotes(r.documents, YEAR, AUJOURDHUI);
    expect(m.slice(0, 4).map(x => x.etat)).toEqual(['vide', 'vide', 'vide', 'vide']);
    expect(m[4].n).toBe(1); expect(m[11].etat).toBe('avenir');
    expect(moisNotes([], YEAR, '2027-02-01').filter(x => x.etat === 'vide')).toHaveLength(12);
  });
  it('étape 1 : un plan mensuel qui démarre avant le mois courant, apparié avec ou sans occurrenceId', () => {
    const d = demoData();
    const plan: any = { id: 'P-LOYER', title: 'Loyer', date: '2026-01-25', amountCents: 40_000, direction: 'out', category: 'chargesFixes', source: 'recurring', status: 'active', recurrence: { frequency: 'monthly' }, createdAt: '2026-01-01' };
    const tx = (id: string, date: string) => ({ ...d.transactions[0], id, date, finance: { ...d.transactions[0].finance, planId: 'P-LOYER' } });
    const r = plansManquants([plan], [tx('L3', '2026-03-25'), tx('L10', '2026-10-25')], YEAR, AUJOURDHUI);
    expect(r).toHaveLength(1); expect(r[0].attendus).toBe(10); expect(r[0].manquants).not.toContain('2026-03'); expect(r[0].manquants).toContain('2026-04');
    expect(plansManquants(d.plans, d.transactions, YEAR, AUJOURDHUI)).toEqual([]); // le loyer de la démo démarre en novembre : rien d'échu
  });
  it('étape 2 : pont de caisse cohérent seulement depuis un solde du 1er janvier', () => {
    const d = demoData(), r = rapport(undefined, d), p = pontCaisse(d.profile, r, YEAR)!;
    expect(p.ouvertureCents + p.recuCents - p.payeCents).toBe(p.finCents); expect(p.coherent).toBe(true);
    expect(pontCaisse({ ...d.profile, openingCash: { ...d.profile.openingCash, date: '2026-03-01' } }, r, YEAR)!.coherent).toBe(false);
  });
  it('étape 3 : estimation = dernière facture × stock courant, jamais 0, jamais pour une année passée', () => {
    const d = demoData(), malt = d.stockItems[0];
    expect(valeurEstimee(malt, d.transactions, YEAR, AUJOURDHUI)?.cents).toBe(2242); // 18 680 / 25 × 3
    expect(valeurEstimee(malt, d.transactions, 2025, AUJOURDHUI)).toBeNull();
    expect(valeurEstimee({ ...malt, currentStock: 0 }, d.transactions, YEAR, AUJOURDHUI)).toBeNull();
    expect(valeurEstimee({ ...malt, ref: 'AUTRE' }, d.transactions, YEAR, AUJOURDHUI)).toBeNull();
  });
  it('étape 3 : non confirmé = « ? » ; confirmé et nature sans ligne = 0 « aucune ligne »', () => {
    const d = demoData();
    expect(inventairesParNature(undefined, d.stockItems)[0].cloture).toEqual({ cents: null, aucuneLigne: true });
    expect(inventairesParNature(cloture(), d.stockItems)[0].cloture).toEqual({ cents: 0, aucuneLigne: true });
  });
  it('étape 4 : la cuve 1 800,00 → 1 440,00 → 1 152,00 (−288,00) → 921,60 prévu', () => {
    const d = demoData(), r = rapport(undefined, d), a = d.assets[0], e = escalierMateriel(r.depreciation[0], a, YEAR);
    expect([e.achatCents, e.ouvertureCents, e.usureCents, e.clotureCents, e.prevuCents]).toEqual([180_000, 144_000, 28_800, 115_200, 92_160]);
  });
  it('étape 5 : la somme des lignes « tu dois » = les dettes du domaine ; une prévue est hors total', () => {
    const d = demoData(), r = rapport(undefined, d), p = plateaux(r, d.plans, YEAR, AUJOURDHUI);
    expect(p.tuDois!.reduce((n, x) => n + x.amountCents, 0)).toBe(r.payablesCents);
    expect(p.prevues.every(x => x.date > AUJOURDHUI)).toBe(true);
  });
  it('étape 6 : la base proposée exclut une pièce déjà réduite (60 % pro)', () => {
    const d = demoData(), base = (pct: number | undefined) => ({ id: 'E', date: '2026-10-01', description: 'Électricité', amountHT: 100, amountTTC: 100, tvaAmount: 0, tvaRate: 0, category: 'chargesFixes', subcategory: '', finance: { version: 1, kind: 'expense', amountCents: 10_000, lines: [], businessUsePct: pct } }) as any;
    expect(baseProposee([base(100)], YEAR, ['électricité'])?.cents).toBe(10_000);
    expect(baseProposee([base(60)], YEAR, ['électricité'])).toBeNull();
    expect(baseProposee(d.transactions, YEAR, [])).toBeNull();
  });
  it('Mois par mois : Σ entré = ventes de l’année ; Σ dépensé + matériel à part = charges + capital du rapport', () => {
    const d = demoData(), r = rapport(undefined, d), m = moisDeLAnnee(d.transactions, d.payments, YEAR, AUJOURDHUI);
    expect(m.reduce((n, x) => n + x.entreCents, 0)).toBe(r.revenueCents);
    expect(m.reduce((n, x) => n + x.depenseCents + x.materielCents, 0)).toBe(r.operatingExpensesCents + r.capitalPurchasesCents);
  });
});

describe('Annuel : une seule voie d’écriture', () => {
  const rap = () => { const d = demoData(); return buildAnnualReport({ year: YEAR, transactions: d.transactions, payments: d.payments, assets: d.assets, profile: d.profile }); };
  it('une relecture posée sur d’autres comptes ne survit pas à « tout est noté »', () => {
    const r = rap();
    FinanceService.saveClosing(cloture({ inventoriesConfirmed: false, tax: { ...emptyTaxClosing(), reviewedBasis: 'AUTRES-COMPTES', reviews: { social: true, specialCases: true } } }));
    const saved = ecrireTax(YEAR, r, 'C1', t => { t.reviews = { ...t.reviews, journal: true }; });
    expect(saved.tax!.reviews).toEqual({ journal: true });
    expect(saved.tax!.reviewedBasis).toBe(taxBasisKey(r));
  });
  it('deux gestes consécutifs : une seule clôture, pas de doublon', () => {
    const r = rap();
    ecrireTax(YEAR, r, undefined, t => { t.activity = 'main'; });
    ecrireTax(YEAR, r, undefined, t => { t.reviews = { ...t.reviews, journal: true }; });
    const l = FinanceService.getClosings().filter(c => c.year === YEAR);
    expect(l).toHaveLength(1); expect(l[0].tax).toMatchObject({ activity: 'main', reviews: { journal: true } });
  });
  it('activité seule : ne pose pas reviewedBasis', () => {
    expect(ecrireTax(YEAR, rap(), undefined, t => { t.activity = 'secondary'; }).tax!.reviewedBasis).toBeUndefined();
  });
  it('soldes et corrections invalident leurs relectures', () => {
    const r = rap();
    ecrireTax(YEAR, r, undefined, t => { t.reviews = { journal: true, balance: true, privateUse: true, social: true }; });
    const a = ecrireTax(YEAR, r, 'CLOTURE-2026', t => { t.balances = [{ id: 'B', kind: 'bank', label: 'Banque', amountCents: 1, reference: 'x' }]; });
    expect(a.tax!.reviews).toMatchObject({ journal: true, balance: false });
    const b = ecrireTax(YEAR, r, 'CLOTURE-2026', t => { t.corrections = [{ id: 'F', kind: 'private-use', label: 'Électricité', amountCents: 100, treatment: 'add', note: 'estimé' }]; });
    expect(b.tax!.reviews).toMatchObject({ privateUse: false, social: false });
  });
  it('une version figée n’est jamais réécrite : le geste crée un brouillon neuf', () => {
    const r = rap();
    const gelee = FinanceService.saveClosing(cloture({ id: 'GELEE', report: r }));
    const neuf = ecrireTax(YEAR, r, 'GELEE', t => { t.activity = 'main'; });
    expect(neuf.id).not.toBe('GELEE'); expect(neuf.report).toBeUndefined();
    expect(FinanceService.getClosings().find(c => c.id === 'GELEE')!.report).toBeDefined();
    expect(gelee.tax?.activity).toBeUndefined();
  });
});
