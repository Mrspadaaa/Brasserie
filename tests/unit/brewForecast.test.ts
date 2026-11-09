import { describe, expect, it } from 'vitest';
import type { Batch, Recipe, StockItem } from '../../src/types';
import { demandKey, estimateBrewBudget, type BrewBudgetSettings, type BrewBudgetSnapshot, type BrewPrice } from '../../src/domain/finance/brewBudget';
import { ajouterJours, estimerBrassinsPlanifies, finDePeriode, planBrewBatchId } from '../../src/domain/finance/brewForecast';
import { buildForecast } from '../../src/domain/finance/forecast';
import type { FinanceTransaction, FinancialAsset, FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';

// Fixture du brief (passe 3), la même que `tests/unit/brewBudget.test.ts` (d1) : Pale Ale de 27 L nets, OG 1.048 ;
// déjà payé 22,41 + à payer 64,26 (achats 22,42, énergie 8,00, nettoyage 3,00, emballage 24,00, impôt 6,84) + année 116,10 = 202,77 ; 7,51 CHF/L.
// Brassage le 15.09.2026, conditionnement estimé le 06.10.2026. Dates fixes, aucune horloge.
const ASOF = '2026-08-20';
const NOW = '2026-08-20T12:00:00Z';
const stock = (ref: string, name: string, currentStock: number): StockItem => ({ id: ref, ref, name, category: 'Malt', unit: 'kg', currentStock, minStock: 0, reorder: false });
const stocks = (pilsner = 6, pale = 0) => [stock('MP-1', 'Pilsner', pilsner), stock('MP-2', 'Pale', pale)];
const prix = (patch: Partial<BrewPrice> = {}): BrewPrice => ({ amount: 4, quantity: 1, unit: 'kg', basis: 'TTC', tvaRate: 0, date: '09.09.2026', source: 'manual', ...patch });
const prixMalts = (patch: Partial<BrewPrice> = {}) => ({ [demandKey('Pilsner', 'kg')]: prix(patch), [demandKey('Pale', 'kg')]: prix(patch) });
const recette = (patch: Record<string, unknown> = {}) => ({ id: 'R1', name: 'Pale Ale', volumeL: 30, style: 'Pale Ale', hops: [], yeast: { name: '', qty: 0, unit: 'sachet', form: 'dry' }, ogTarget: 1.048,
  fermentables: [{ name: 'Pilsner', weightKg: 5.6025, kind: 'grain', use: 'empatage' }, { name: 'Pale', weightKg: 5.605, kind: 'grain', use: 'empatage' }], ...patch }) as unknown as Recipe;
const reglages: BrewBudgetSettings = { costs: { energy: { enabled: true, amountTTC: 8 }, cleaning: { enabled: true, amountTTC: 3 }, packaging: { enabled: true, amountTTC: 24 }, beerTax: { enabled: true } },
  includeFixed: true, includeDepreciation: true, annualVolumeL: 1200, annualFixedCHF: 4800, annualDepreciationCHF: 360 };
const planifie = (patch: Partial<Batch> = {}, r: Recipe = recette()): Batch => ({ id: 'B1', name: 'Pale Ale de septembre', style: 'Pale Ale', volumeL: 30, brewDate: '', plannedBrewDate: '15.09.2026', status: 'planifie',
  stockAccountingVersion: 1, recipeRef: 'R1', recipeSnapshot: { ...r, sourceRecipeId: 'R1', capturedAt: '2026-08-01T00:00:00Z' }, og: '1.048', gravityLog: [], ...patch } as unknown as Batch);
const profile = (patch: Partial<FinancialProfile> = {}): FinancialProfile => ({ id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, annualProductionL: 1200,
  openingCash: { date: '2026-08-01', amountCents: 1_000_000, confirmed: true }, ...patch });
const loyer: FinancialPlan = { id: 'LOYER', title: 'Loyer', date: '2026-08-25', amountCents: 40_000, direction: 'out', category: 'chargesFixes', source: 'recurring', costAllocation: 'fixed', status: 'active',
  recurrence: { frequency: 'monthly' }, createdAt: '2026-01-01T00:00:00Z' };
const actif = (patch: Partial<FinancialAsset> = {}): FinancialAsset => ({ id: 'A1', name: 'Cuve', acquisitionDate: '2026-03-01', inServiceDate: '2026-03-01', acquisitionCents: 180_000, businessUsePct: 100,
  category: 'tanks', method: 'declining', ratePct: 20, openingYear: 2026, openingValueCents: 180_000, openingConfirmed: true, firstYearFraction: 1, usefulLifeYears: 5, ...patch } as FinancialAsset);
const projet = (patch: Partial<FinancialPlan> = {}): FinancialPlan => ({ id: 'FRIGO', title: 'Frigo', date: '2026-06-15', amountCents: 300_000, direction: 'out', category: 'materiel', source: 'equipment', status: 'active', createdAt: '2026-05-01T00:00:00Z',
  upgrade: { version: 1, timing: 'soon', stage: 'ready', budgetKnown: true, datePrecision: 'day', estimateSource: 'quote', purchaseCents: 300_000, usefulLifeYears: 5, inServiceMonth: '2026-06' }, ...patch });

/** L'instantané que la feuille c3a enregistre pour le brassin (litres nets saisis : 27). */
const instantane = (batch: Batch, opts: { settings?: BrewBudgetSettings; prices?: Record<string, BrewPrice>; net?: number | undefined; og?: string | undefined; tva?: boolean; stockItems?: StockItem[]; others?: Batch[] } = {}) => estimateBrewBudget({
  recipe: recette(), stockItems: opts.stockItems ?? stocks(), batches: [batch, ...(opts.others ?? [])], brewDate: '15.09.2026', batchId: batch.id, netVolumeL: 'net' in opts ? opts.net : 27, og: 'og' in opts ? opts.og : '1.048',
  settings: opts.settings ?? reglages, prices: opts.prices ?? prixMalts(), isTvaRegistered: opts.tva ?? false, now: '2026-08-10T12:00:00Z' });
const planDe = (snapshot: BrewBudgetSnapshot, patch: Partial<FinancialPlan> = {}): FinancialPlan => ({ id: `P-${snapshot.batchId}`, title: snapshot.title, date: '2026-09-15', amountCents: Math.round(snapshot.cashRequiredTTC * 100),
  direction: 'out', category: 'brassage', source: 'brew', status: 'draft', batchId: snapshot.batchId, brewEstimate: snapshot, createdAt: '2026-08-10T12:00:00Z', ...patch });

const base = (over: Partial<Parameters<typeof estimerBrassinsPlanifies>[0]> = {}) => {
  const batch = planifie();
  return { batches: [batch], stockItems: stocks(), transactions: [] as FinanceTransaction[], plans: [planDe(instantane(batch)), loyer], profile: profile(), assets: [actif({ acquisitionCents: 180_000 })], asOf: ASOF, ...over };
};
const parId = (r: ReturnType<typeof estimerBrassinsPlanifies>, id: string) => r.items.find(i => i.id === id);
const somme = (r: ReturnType<typeof estimerBrassinsPlanifies>) => r.items.reduce((n, i) => n + i.amountCents, 0);

describe('un brassin planifié : quatre sorties datées, la fixture du brief', () => {
  const r = estimerBrassinsPlanifies(base());
  it('achats 22,42 à J − 7, énergie et nettoyage 11,00 à J, emballage 24,00 à C − 7, impôt 6,84 au trimestre', () => {
    expect(r.items.map(i => [i.id, i.date, i.amountCents])).toEqual([
      ['brew:B1:achats', '2026-09-08', 2242], ['brew:B1:frais', '2026-09-15', 1100], ['brew:B1:emballage', '2026-09-29', 2400], ['brew:B1:impot', '2027-01-30', 684]]);
  });
  it('retrouve exactement c3a : 64,26 ; 33,42 avant le brassage · 30,84 plus tard', () => {
    const c3a = instantane(planifie());
    expect(somme(r)).toBe(Math.round(c3a.cashRequiredTTC * 100));
    expect(somme(r)).toBe(6426);
    expect(r.items.filter(i => !i.id.endsWith('emballage') && !i.id.endsWith('impot')).reduce((n, i) => n + i.amountCents, 0)).toBe(3342);
    expect(r.items.filter(i => i.id.endsWith('emballage') || i.id.endsWith('impot')).reduce((n, i) => n + i.amountCents, 0)).toBe(3084);
  });
  it('le coût du litre vaut 7,51 (usure linéaire du registre : 360 par an) et l’impôt vient de la densité du brassin', () => {
    expect(r.brassins[0].coutLitre?.affiche.complet).toBe(7.51);
    expect(r.brassins[0].densite).toBe('brassin');
    expect(r.brassins[0].litresNets).toEqual({ litres: 27, source: 'enregistre' });
  });
  it('dit d’où vient chaque montant et marque les dates estimées', () => {
    expect(parId(r, 'brew:B1:achats')!.lines![0]).toMatchObject({ label: 'Pale', amountCents: 2242 });
    expect(parId(r, 'brew:B1:achats')!.lines![0].origin).toContain('prix saisi');
    expect(parId(r, 'brew:B1:impot')!.label).toContain('date estimée');
    expect(parId(r, 'brew:B1:impot')!.lines![0].origin).toContain('densité du brassin');
    expect(parId(r, 'brew:B1:emballage')!.label).toContain('date estimée');
    expect(r.items.every(i => i.source === 'brew' && i.direction === 'out' && i.batchId === 'B1' && !i.planId)).toBe(true);
  });
  it('complet : rien de partiel, aucun avertissement', () => { expect(r.brassins[0].partiel).toEqual([]); expect(r.warnings).toEqual([]); });
  it('pur : entrées intactes, deux appels identiques', () => {
    const entree = base(), avant = structuredClone(entree);
    const a = estimerBrassinsPlanifies(entree), b = estimerBrassinsPlanifies(entree);
    expect(entree).toEqual(avant);
    expect(a.items).toEqual(b.items);
    expect(a.brassins).toEqual(b.brassins);
  });
});

describe('statuts : annulé, terminé, conditionné, commencé', () => {
  it('annulé ou terminé : aucun item, son plan « Prévoir » n’est plus compté', () => {
    for (const status of ['annule', 'termine'] as const) {
      const batch = planifie({ status });
      const e = base({ batches: [batch], plans: [planDe(instantane(planifie()), { status: 'active' })] });
      const r = estimerBrassinsPlanifies(e);
      expect(r.items).toEqual([]);
      expect(r.remplaces.has('B1')).toBe(true);
      const prevision = buildForecast({ transactions: [], payments: [], plans: e.plans, profile: e.profile, asOf: ASOF, batches: [batch], stockItems: stocks() });
      expect(prevision.items.filter(i => i.source === 'brew')).toEqual([]);
    }
  });
  it('sans les brassins, un plan « Prévoir » actif garde son comportement (compté)', () => {
    const plans = [planDe(instantane(planifie()), { status: 'active' })];
    expect(buildForecast({ transactions: [], payments: [], plans, profile: profile(), asOf: ASOF }).items.filter(i => i.source === 'brew')).toHaveLength(1);
  });
  it('conditionné : aucun item, le plan est sauté, et l’impôt à venir est dit (sans montant inventé)', () => {
    const batch = planifie({ status: 'conditionne', brewDate: '15.09.2026', bottlingDate: '06.10.2026', volumePackagedL: 26.6 });
    const r = estimerBrassinsPlanifies(base({ batches: [batch], asOf: '2026-10-20' }));
    expect(r.items).toEqual([]);
    expect(r.remplaces.has('B1')).toBe(true);
    expect(r.warnings.join(' ')).toContain('Impôt sur la bière des brassins conditionnés non prévu : « Pale Ale de septembre », échéance estimée le 30.01.2027.');
    expect(estimerBrassinsPlanifies(base({ batches: [batch], asOf: '2027-02-10' })).warnings).toEqual([]);
  });
  it('brassin commencé : ni achats ni frais, emballage et impôt gardés, daté depuis le jour réellement brassé', () => {
    const batch = planifie({ status: 'garde', brewDate: '15.09.2026', plannedBrewDate: '10.09.2026' });
    const plans = [planDe(instantane(planifie()), { status: 'active' })];
    const r = estimerBrassinsPlanifies(base({ batches: [batch], plans, asOf: '2026-09-20' }));
    expect(r.items.map(i => [i.id, i.date, i.amountCents])).toEqual([['brew:B1:emballage', '2026-09-29', 2400], ['brew:B1:impot', '2027-01-30', 684]]);
    expect(r.remplaces.has('B1')).toBe(true);
  });
  it('dates de conditionnement et de trimestre : bornes', () => {
    const impot = (bottlingDate: string, periode?: 'trimestre' | 'annee') => estimerBrassinsPlanifies(base({ batches: [planifie({ status: 'garde', brewDate: '15.09.2026', bottlingDate })], asOf: '2026-01-10', reglages: { periodeImpot: periode } })).items.find(i => i.id.endsWith('impot'))!.date;
    expect(impot('31.12.2026')).toBe('2027-01-30');
    expect(impot('01.01.2027')).toBe('2027-04-30');
    expect(impot('30.06.2026')).toBe('2026-07-30');
    expect(impot('06.10.2026', 'annee')).toBe('2027-01-30');
    expect(finDePeriode('2026-02-15', 'trimestre')).toBe('2026-03-31');
    expect(ajouterJours('2026-12-31', 30)).toBe('2027-01-30');
  });
});

describe('dates et brassins en retard', () => {
  it('date déplacée : toutes les sorties suivent', () => {
    const r = estimerBrassinsPlanifies(base({ batches: [planifie({ plannedBrewDate: '01.10.2026' })] }));
    expect(r.items.map(i => [i.id, i.date])).toEqual([['brew:B1:achats', '2026-09-24'], ['brew:B1:frais', '2026-10-01'], ['brew:B1:emballage', '2026-10-15'], ['brew:B1:impot', '2027-01-30']]);
  });
  it('brassage passé : sorties ramenées à aujourd’hui, avec avertissement', () => {
    const r = estimerBrassinsPlanifies(base({ batches: [planifie({ plannedBrewDate: '10.08.2026' })] }));
    expect(parId(r, 'brew:B1:achats')!.date).toBe(ASOF);
    expect(parId(r, 'brew:B1:frais')!.date).toBe(ASOF);
    expect(r.warnings.join(' ')).toContain('déjà passé');
  });
  it('date illisible : aucun item, avertissement, jamais une date inventée', () => {
    const r = estimerBrassinsPlanifies(base({ batches: [planifie({ plannedBrewDate: '31.02.2026' })] }));
    expect(r.items).toEqual([]);
    expect(r.warnings.join(' ')).toContain('date de brassage illisible');
  });
  it('au-delà de l’horizon : aucun item', () => {
    expect(estimerBrassinsPlanifies(base({ fin: '2026-09-10' })).items.map(i => i.id)).toEqual(['brew:B1:achats']);
  });
});

describe('stock partagé, stock modifié', () => {
  const b1 = planifie(), b2 = planifie({ id: 'B2', name: 'Seconde', plannedBrewDate: '20.09.2026' });
  const plans = () => [planDe(instantane(b1, { others: [b2] })), planDe(instantane(b2, { others: [b1] }), { id: 'P-B2' })];
  it('le premier brassin réserve le stock : le second doit acheter le Pilsner manquant (43,24 au lieu de 22,42)', () => {
    const r = estimerBrassinsPlanifies(base({ batches: [b1, b2], plans: plans() }));
    expect(parId(r, 'brew:B1:achats')!.amountCents).toBe(2242);
    expect(parId(r, 'brew:B2:achats')!.amountCents).toBe(4324);
  });
  it('l’ordre du tableau ne change rien', () => {
    const a = estimerBrassinsPlanifies(base({ batches: [b1, b2], plans: plans() })), b = estimerBrassinsPlanifies(base({ batches: [b2, b1], plans: plans() }));
    expect(b.items).toEqual(a.items);
  });
  it('stock suffisant : plus d’item achats ; le stock fait foi à chaque lecture', () => {
    const r = estimerBrassinsPlanifies(base({ stockItems: stocks(6, 6) }));
    expect(parId(r, 'brew:B1:achats')).toBeUndefined();
    expect(somme(r)).toBe(2400 + 1100 + 684);
  });
});

describe('l’inconnu n’est jamais 0', () => {
  it('prix du houblon inconnu : le connu seulement, « partiel » avec le nom, avertissement', () => {
    const r = r1();
    function r1() {
      const houblon = recette({ hops: [{ name: 'Citra', weightG: 50, alpha: 12, use: 'ebullition', timeMin: 60 }] });
      const batch = planifie({}, houblon);
      const plan = planDe(estimateBrewBudget({ recipe: houblon, stockItems: stocks(), batches: [batch], brewDate: '15.09.2026', batchId: 'B1', netVolumeL: 27, og: '1.048', settings: reglages, prices: prixMalts(), now: '2026-08-10T12:00:00Z' }));
      return estimerBrassinsPlanifies(base({ batches: [batch], plans: [plan, loyer] }));
    }
    const achats = parId(r, 'brew:B1:achats')!;
    expect(achats.amountCents).toBe(2242);
    expect(achats.partial).toContain('Citra');
    expect(achats.label).toContain('partiel');
    expect(r.warnings.join(' ')).toContain('Citra');
    expect(r.brassins[0].coutLitre).toBeNull();
  });
  it('brassin jamais enregistré : frais et emballage à compléter, impôt jamais calculé sur le volume à brasser (30 L, 7,60)', () => {
    const r = estimerBrassinsPlanifies(base({ plans: [loyer] }));
    expect(parId(r, 'brew:B1:frais')).toMatchObject({ amountCents: 0, partial: ['énergie', 'nettoyage'] });
    expect(parId(r, 'brew:B1:emballage')).toMatchObject({ amountCents: 0, partial: ['emballage'] });
    expect(parId(r, 'brew:B1:impot')).toMatchObject({ amountCents: 0, partial: ['impôt (litres nets)'] });
    expect(r.items.some(i => i.amountCents === 760 || i.amountCents === 759)).toBe(false);
    expect(r.brassins[0].litresNets).toBeNull();
    expect(r.brassins[0].coutLitre).toBeNull();
  });
  it('un instantané sans litres nets saisis (volume à brasser) est refusé comme net', () => {
    const batch = planifie();
    const ancien = instantane(batch, { net: undefined });
    expect(ancien.netVolumeSource).toBe('volume-a-brasser');
    const r = estimerBrassinsPlanifies(base({ plans: [planDe(ancien), loyer] }));
    expect(r.brassins[0].litresNets).toBeNull();
    expect(parId(r, 'brew:B1:impot')!.partial).toEqual(['impôt (litres nets)']);
  });
  it('litres conditionnés réels d’abord : 26,6 L donnent 6,74', () => {
    const r = estimerBrassinsPlanifies(base({ batches: [planifie({ volumePackagedL: 26.6 })] }));
    expect(parId(r, 'brew:B1:impot')!.amountCents).toBe(674);
    expect(r.brassins[0].litresNets).toEqual({ litres: 26.6, source: 'conditionne' });
  });
  it('densité du brassin absente : la cible de la recette (ogTarget), dite estimée', () => {
    const r = estimerBrassinsPlanifies(base({ batches: [planifie({ og: undefined })] }));
    expect(parId(r, 'brew:B1:impot')!.amountCents).toBe(684);
    expect(r.brassins[0].densite).toBe('cible');
    expect(parId(r, 'brew:B1:impot')!.lines![0].origin).toContain('estimé');
  });
  it('ni densité ni cible : impôt partiel (densité), pas de 0', () => {
    const batch = planifie({ og: undefined }, recette({ ogTarget: null }));
    const r = estimerBrassinsPlanifies(base({ batches: [batch], plans: [planDe(instantane(batch, { og: undefined })), loyer] }));
    expect(parId(r, 'brew:B1:impot')).toMatchObject({ amountCents: 0, partial: ['impôt (densité)'] });
  });
});

describe('impôt : alcool et réduction, comme c3a', () => {
  it('bière à 0,5 % vol. ou moins : exonérée, 0,00', () => {
    const batch = planifie({ abv: '0.4' });
    const r = estimerBrassinsPlanifies(base({ batches: [batch] }));
    expect(parId(r, 'brew:B1:impot')).toBeUndefined();
    expect(somme(r)).toBe(2242 + 1100 + 2400);
  });
  it('réduction confirmée pour l’année du brassage : 5,39 au lieu de 6,84 ; une autre année : taux plein', () => {
    expect(parId(estimerBrassinsPlanifies(base({ reductionImpot: { pct: 20, annee: 2026 } })), 'brew:B1:impot')!.amountCents).toBe(547);
    expect(parId(estimerBrassinsPlanifies(base({ reductionImpot: { pct: 20, annee: 2025 } })), 'brew:B1:impot')!.amountCents).toBe(684);
  });
});

describe('les mêmes montants que la feuille c3a, cas limites compris (somme = cashRequiredTTC)', () => {
  const cas: Array<[string, Parameters<typeof instantane>[1]]> = [
    ['base', {}],
    ['assujetti à la TVA, prix HT', { tva: true, prices: prixMalts({ basis: 'HT', tvaRate: 0.081 }), settings: { ...reglages, costs: { ...reglages.costs, energy: { enabled: true, amountTTC: 8, tvaRate: 0.081 }, cleaning: { enabled: true, amountTTC: 3, tvaRate: 0.081 }, packaging: { enabled: true, amountTTC: 24, tvaRate: 0.081 } } } }],
    ['énergie incluse dans le récurrent', { settings: { ...reglages, costs: { ...reglages.costs, energy: { enabled: true, amountTTC: 8, cashTreatment: 'included-in-recurring' } } } }],
    ['impôt saisi, inclus dans le récurrent', { og: undefined, settings: { ...reglages, costs: { ...reglages.costs, beerTax: { enabled: true, amountTTC: 6.84, cashTreatment: 'included-in-recurring' } } } }],
    ['emballage désactivé', { settings: { ...reglages, costs: { ...reglages.costs, packaging: { enabled: false } } } }]
  ];
  for (const [nom, opts] of cas) it(nom, () => {
    // Sans densité saisie, c3a et la prévision prennent la cible de la recette : le cas « impôt saisi » n'a donc pas de cible.
    const tva = !!opts?.tva, sansDensite = !!opts && 'og' in opts, batch = planifie(sansDensite ? { og: undefined } : {}, recette(sansDensite ? { ogTarget: null } : {}));
    const saved = instantane(batch, opts);
    const r = estimerBrassinsPlanifies(base({ batches: [batch], plans: [planDe(saved), loyer], profile: profile({ vatRegistered: tva }) }));
    expect(somme(r)).toBe(Math.round(saved.cashRequiredTTC * 100));
  });
});

describe('usure du litre comptée une fois (linéaire), jamais l’AFC dégressif', () => {
  const litre = (over: Partial<Parameters<typeof estimerBrassinsPlanifies>[0]>) => estimerBrassinsPlanifies(base(over)).brassins[0].coutLitre?.affiche.complet ?? null;
  it('un projet de frigo (3 000 CHF, 5 ans) en plus du registre : 7,51 + 0,50 = 8,01', () => {
    expect(litre({ plans: [planDe(instantane(planifie())), loyer, projet()] })).toBe(8.01);
  });
  it('hors ce projet (ignorerPlanId) : 7,51', () => {
    expect(litre({ plans: [planDe(instantane(planifie())), loyer, projet()], ignorerPlanId: 'FRIGO' })).toBe(7.51);
  });
  it('registre vide et aucun projet : inconnu, pas un litre sans usure', () => {
    expect(litre({ assets: [] })).toBeNull();
  });
  it('registre non fourni : inconnu', () => { expect(litre({ assets: undefined })).toBeNull(); });
  it('durée du projet inconnue : litre inconnu, jamais un minimum', () => {
    const sansDuree = projet({ upgrade: { ...projet().upgrade!, usefulLifeYears: undefined } });
    expect(litre({ plans: [planDe(instantane(planifie())), loyer, sansDuree] })).toBeNull();
  });
});

describe('dans buildForecast', () => {
  const entree = (over = {}) => ({ transactions: [] as FinanceTransaction[], payments: [], plans: [planDe(instantane(planifie()), { status: 'active' }), loyer], profile: profile(), asOf: ASOF, months: 13, ...over });
  it('sans brassins : comportement inchangé ; avec une liste vide : identique', () => {
    expect(buildForecast({ ...entree(), batches: [] })).toEqual(buildForecast(entree()));
  });
  it('doublon : le plan « Prévoir » actif du même brassin est remplacé par le dérivé, un seul compte ; un plan de recette sans brassin reste compté', () => {
    const recetteSeule = planDe(instantane(planifie()), { id: 'P-RECETTE', status: 'active', batchId: undefined, amountCents: 5000, date: '2026-09-15', brewEstimate: { ...instantane(planifie()), batchId: undefined } });
    const plans = [planDe(instantane(planifie()), { status: 'active' }), recetteSeule, loyer];
    const f = buildForecast({ ...entree({ plans }), batches: [planifie()], stockItems: stocks(), assets: [actif()] });
    const brew = f.items.filter(i => i.source === 'brew');
    expect(brew.filter(i => i.batchId === 'B1').reduce((n, i) => n + i.amountCents, 0)).toBe(6426);
    expect(brew.filter(i => i.planId === 'P-RECETTE').map(i => i.amountCents)).toEqual([5000]);
    expect(brew.some(i => i.planId === 'P-B1')).toBe(false);
    expect(plans[0].status).toBe('active');
    expect(planBrewBatchId(plans[0])).toBe('B1');
  });
  it('un brassin dont le plan n’est pas dans la liste des brassins : le plan reste compté (inconnu ≠ supprimé)', () => {
    const f = buildForecast({ ...entree(), batches: [], stockItems: stocks() });
    expect(f.items.filter(i => i.source === 'brew').map(i => i.planId)).toEqual(['P-B1']);
  });
  it('les sorties dérivées entrent dans les mois : le solde cumulé baisse de 64,26', () => {
    // Le brouillon enregistré (statut `draft`) n'est jamais compté : il ne fournit que les prix et les frais saisis.
    const brouillon = planDe(instantane(planifie()));
    const sans = buildForecast(entree({ plans: [brouillon, loyer] })), avec = buildForecast({ ...entree({ plans: [brouillon, loyer] }), batches: [planifie()], stockItems: stocks(), assets: [actif()] });
    const dernier = avec.months.length - 1;
    expect(avec.months[dernier].balanceCents).toBe(sans.months[dernier].balanceCents! - 6426);
    const mois = (f: typeof sans, m: string) => f.months.find(x => x.month === m)!;
    expect(mois(avec, '2026-09').expenseCents - mois(sans, '2026-09').expenseCents).toBe(2242 + 1100 + 2400);
    expect(mois(avec, '2027-01').expenseCents - mois(sans, '2027-01').expenseCents).toBe(684);
    expect(mois(avec, '2026-09').committedCents - mois(sans, '2026-09').committedCents).toBe(2242 + 1100 + 2400);
  });
  it('les avertissements du brassin remontent dans la prévision', () => {
    const f = buildForecast({ ...entree({ plans: [loyer] }), batches: [planifie()], stockItems: stocks() });
    expect(f.warnings.join(' ')).toContain('Pale Ale de septembre : à compléter');
  });
});

/** Grand livre : des factures d'achat des deux malts (prix par facture, stock en main) noyées dans des factures d'autres articles. */
const factureMalt = (id: string, ref: string, date: string, quantity: number, amountCents: number): FinanceTransaction => ({ id, date, description: 'Achat malt', category: 'brassage', subcategory: '', amountHT: amountCents / 100, amountTTC: amountCents / 100, tvaRate: 0, tvaAmount: 0,
  finance: { version: 1, kind: 'expense', amountCents, paymentStatus: 'paid', lines: [{ id: 'l', kind: 'ingredient', description: 'Malt', quantity, unit: 'kg', stockItemRef: ref, amountCents }] } } as unknown as FinanceTransaction);
const bruit = (n: number): FinanceTransaction[] => Array.from({ length: n }, (_, i) => ({ ...factureMalt(`N${i}`, `MP-X${i % 148}`, `${String(1 + i % 28).padStart(2, '0')}.0${1 + i % 8}.2026`, 1, 1000) }));

describe('pièces pertinentes : même résultat qu’avec tout le grand livre', () => {
  it('les prix viennent des factures (dernier prix, moyenne pondérée du stock) ; le bruit ne change aucun montant', () => {
    const utiles = [factureMalt('F1', 'MP-1', '01.07.2026', 10, 4000), factureMalt('F2', 'MP-1', '01.08.2026', 10, 4500), factureMalt('F3', 'MP-2', '01.08.2026', 10, 5000)];
    const batch = planifie();
    const saved = estimateBrewBudget({ recipe: recette(), stockItems: stocks(), batches: [batch], brewDate: '15.09.2026', batchId: 'B1', netVolumeL: 27, og: '1.048', settings: reglages, prices: {}, transactions: [...utiles, ...bruit(300)], now: NOW });
    expect(saved.complete).toBe(true);
    const r = estimerBrassinsPlanifies(base({ transactions: [...utiles, ...bruit(300)], plans: [planDe(saved), loyer] }));
    expect(somme(r)).toBe(Math.round(saved.cashRequiredTTC * 100));
    expect(parId(r, 'brew:B1:achats')!.amountCents).toBe(Math.round(saved.purchasesTTC * 100));
    expect(parId(r, 'brew:B1:achats')!.lines![0].origin).toContain('dernier prix de facture');
    expect(r.brassins[0].coutLitre?.complet).toBeCloseTo(saved.totalCost / 27, 10);
  });
});

describe('temps de calcul (L20) : 10 brassins planifiés, 2 000 factures, 150 articles, à froid', () => {
  const mesurer = (malts: number) => {
    const articles: StockItem[] = [...stocks(), ...Array.from({ length: 148 }, (_, i) => stock(`MP-X${i}`, `Article ${i}`, 10))];
    const transactions = [...bruit(2000 - malts), ...Array.from({ length: malts }, (_, i) => factureMalt(`M${i}`, i % 2 ? 'MP-1' : 'MP-2', `${String(1 + i % 28).padStart(2, '0')}.0${1 + i % 8}.2026`, 10, 4000 + i))];
    const batches = Array.from({ length: 10 }, (_, i) => planifie({ id: `B${i}`, name: `Brassin ${i}`, plannedBrewDate: `${String(1 + i).padStart(2, '0')}.10.2026` }));
    const plans = [...batches.map(b => planDe(instantane(b), { id: `P-${b.id}` })), loyer];
    const t0 = performance.now();
    const r = estimerBrassinsPlanifies({ batches, stockItems: articles, transactions, plans, profile: profile(), assets: [actif()], asOf: ASOF });
    const ms = performance.now() - t0;
    console.info(`[mesure d2] ${batches.length} brassins, ${transactions.length} factures dont ${malts} des malts, ${articles.length} articles : ${ms.toFixed(1)} ms, ${r.items.length} items`);
    expect(r.brassins).toHaveLength(10);
    return ms;
  };
  // Seuil décidé (20 ms) pour un grand livre réaliste (60 factures portent les articles du brassin) ; le cas lourd (300) n'a qu'une garde large.
  it('grand livre réaliste : sous 20 ms', () => { expect(mesurer(60)).toBeLessThan(20); });
  it('grand livre lourd : mesuré, garde large contre l’explosion', () => { expect(mesurer(300)).toBeLessThan(250); });
});

