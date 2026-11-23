import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildForecast } from '../../src/domain/finance/forecast';
import type { FinanceForecast, ForecastItem } from '../../src/domain/finance/forecast';
import { actifLiePourProjet, mesurerAchat, usureAnnuelleLitre, usureLineaireActifCents, usureParAnCents } from '../../src/domain/finance/materielFutur';
import type { FinanceTransaction, FinancialAsset, FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';

afterEach(() => vi.useRealTimers());

/** Soldes de fin de mois, en centimes. Les mois partent de nov. 2026 ; `null` = solde inconnu. */
const MOIS = ['2026-11', '2026-12', '2027-01', '2027-02', '2027-03'];
const prevision = (soldes: Array<number | null>, items: ForecastItem[] = [], extra: Partial<FinanceForecast> = {}): FinanceForecast => ({
  months: MOIS.map((month, i) => ({ month, incomeCents: 0, expenseCents: 0, committedCents: 0, projectedCents: 0, balanceCents: soldes[i], items: [] })),
  items, warnings: [], cashComplete: true, trendMonths: [], openingCashCents: soldes[0], undated: [], undatedInCents: 0, undatedOutCents: 0, ...extra,
});
const SOLDES = [200_000, 150_000, 250_000, 400_000, 450_000];
const item = (patch: Partial<ForecastItem>): ForecastItem => ({ id: 'x', date: '2027-01-10', label: 'x', amountCents: 1000, direction: 'out', source: 'plan', category: 'divers', ...patch });
const FRIGO = 300_000;
const base = { coutInitialCents: FRIGO, moisAchat: '2027-01', usure: { dureeAns: 5 }, productionAnnuelleL: 1200, coutLitreCents: 751, prevision: prevision(SOLDES),
  format: { label: '33 cl', volumeL: 0.33, prixCents: 500 } };

describe('usure par an (P2 : linéaire, durée saisie, défaut = taux linéaire AFC de la catégorie)', () => {
  it('prix ÷ durée', () => expect(usureParAnCents(FRIGO, { dureeAns: 5 })).toBe(60_000));
  it('catégorie AFC : base × taux linéaire, sans arrondir la durée (22,5 % = 4,44 ans)', () => {
    expect(usureParAnCents(FRIGO, { categorie: 'production' })).toBe(45_000);
    expect(usureParAnCents(FRIGO, { categorie: 'tools' })).toBe(67_500);
    expect(usureParAnCents(FRIGO, { categorie: 'custom' })).toBeNull();
  });
  it('la durée saisie l’emporte sur la catégorie', () => expect(usureParAnCents(FRIGO, { dureeAns: 5, categorie: 'production' })).toBe(60_000));
  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('durée invalide %s sans catégorie : inconnu, jamais 0', d => {
    expect(usureParAnCents(FRIGO, { dureeAns: d })).toBeNull();
    expect(usureParAnCents(null, { dureeAns: 5 })).toBeNull();
    expect(usureParAnCents(FRIGO, undefined)).toBeNull();
  });
});

describe('mesurerAchat : usure, part dans le litre, ventes', () => {
  it('usure 600 CHF/an, part 0,50 CHF/L, litre 7,51 → 8,01', () => {
    const r = mesurerAchat(base);
    expect(r.usureParAnCents).toBe(60_000);
    expect(r.partParLitreCents).toBe(50);
    expect(r.coutLitreAvecCents).toBe(801);
  });
  it('la part du litre reste exacte, arrondie à l’affichage seulement (D3-8)', () => {
    const r = mesurerAchat({ ...base, usure: { dureeAns: 7 } });
    expect(r.usureParAnCents).toBe(42_857);
    expect(r.partParLitreCents).toBeCloseTo(35.714, 3);
    expect(r.coutLitreAvecCents).toBeCloseTo(751 + 35.714, 3);
  });
  it('durée inconnue : usure, part, coût avec → null ; la trésorerie reste calculée', () => {
    const r = mesurerAchat({ ...base, usure: undefined });
    expect([r.usureParAnCents, r.partParLitreCents, r.coutLitreAvecCents]).toEqual([null, null, null]);
    expect(r.tresorerie?.soldeMoisAchatCents).toBe(-50_000);
  });
  it('production absente ou nulle → part null', () => {
    expect(mesurerAchat({ ...base, productionAnnuelleL: 0 }).partParLitreCents).toBeNull();
    expect(mesurerAchat({ ...base, productionAnnuelleL: null }).partParLitreCents).toBeNull();
  });
  it('ventes sur la marge : 33 cl à 5,00 CHF, litre 7,51 → marge 2,52, 1 191 bouteilles, 393,0 L ; le prix seul en second : 600', () => {
    const v = mesurerAchat(base).ventes!;
    expect(v).toMatchObject({ formatLabel: '33 cl', margeApresTousCoutsCents: 252, bouteilles: 1191, litres: 393, bouteillesSiToutEstMarge: 600, bouteillesSurMargeVariable: null });
    expect(mesurerAchat(base).avertissements.join(' ')).toContain('coût complet moyen du litre');
    expect(mesurerAchat(base).avertissements.join(' ')).toContain('393,0 L'); // virgule, jamais « 393.0 »
  });
  it('coût du format fourni (d1) : pas de repli ; marge variable en second', () => {
    const r = mesurerAchat({ ...base, format: { ...base.format, coutCents: 300, coutVariableCents: 106 } });
    expect(r.ventes).toMatchObject({ margeApresTousCoutsCents: 200, bouteilles: 1500, bouteillesSurMargeVariable: 762 });
    expect(r.avertissements.join(' ')).not.toContain('coût complet moyen du litre');
  });
  it('marge ≤ 0 : aucune vente ne paie, pas de division par zéro', () => {
    const r = mesurerAchat({ ...base, format: { ...base.format, coutCents: 520 } });
    expect(r.ventes).toBeNull();
    expect(r.avertissements.join(' ')).toContain('perd de l’argent');
  });
  it('coût du litre et du format inconnus → ventes null', () => {
    expect(mesurerAchat({ ...base, coutLitreCents: null }).ventes).toBeNull();
    expect(mesurerAchat({ ...base, coutInitialCents: null }).ventes).toBeNull();
  });
  it('assujetti à la TVA : usure et ventes sur le HT (3 000 TTC → 2 775,21 HT : 1 102 bouteilles, pas 1 191) ; TVA préalable signalée (D3-4, D3-11)', () => {
    const r = mesurerAchat({ ...base, assujettiTva: true, baseUsureCents: 277_521 });
    expect(r.usureParAnCents).toBe(55_504);
    expect(r.ventes?.bouteilles).toBe(1102);
    expect(r.tresorerie?.soldeMoisAchatCents).toBe(-50_000); // la caisse sort le TTC
    expect(r.avertissements.join(' ')).toContain('TVA préalable');
  });
  it('assujetti sans prix HT : usure et ventes null, jamais le TTC par défaut', () => {
    const r = mesurerAchat({ ...base, assujettiTva: true });
    expect([r.usureParAnCents, r.partParLitreCents, r.ventes]).toEqual([null, null, null]);
    expect(r.avertissements.join(' ')).toContain('prix HT');
  });
  it('actif déjà au registre : l’usure du projet n’est pas rajoutée au litre (B d3-1)', () => {
    const r = mesurerAchat({ ...base, actifDejaEnregistre: true });
    expect([r.usureParAnCents, r.partParLitreCents, r.coutLitreAvecCents]).toEqual([null, null, null]);
    expect(r.avertissements.join(' ')).toContain('déjà dans le registre');
  });
});

describe('mesurerAchat : trésorerie et meilleur mois', () => {
  it('achat en novembre : solde −1 000, point bas en décembre −1 500', () => {
    const t = mesurerAchat({ ...base, moisAchat: '2026-11' }).tresorerie!;
    expect(t.soldeMoisAchatCents).toBe(-100_000);
    expect(t.pointBas).toEqual({ mois: '2026-12', soldeCents: -150_000 });
  });
  it('achat en janvier : solde −500, point bas −500 en janvier', () => {
    const t = mesurerAchat(base).tresorerie!;
    expect(t.soldeMoisAchatCents).toBe(-50_000);
    expect(t.pointBas).toEqual({ mois: '2027-01', soldeCents: -50_000 });
  });
  it('meilleur mois : le premier dont le point bas tient le seuil', () => {
    expect(mesurerAchat(base).meilleurMois).toEqual({ mois: '2027-02', soldeMiniCents: 100_000 });
  });
  it('seuil égal au point bas : retenu (150 000 → mars) ; juste au-dessus : aucun mois, avec avertissement (D3-1)', () => {
    expect(mesurerAchat({ ...base, seuilCents: 150_000 }).meilleurMois).toEqual({ mois: '2027-03', soldeMiniCents: 150_000 });
    const r = mesurerAchat({ ...base, seuilCents: 150_001 });
    expect(r.meilleurMois).toBeNull();
    expect(r.avertissements.join(' ')).toContain('aucun mois ne tient');
  });
  it('achat hors horizon ou avant le mois courant (celui de months[0]) : trésorerie null + avertissement', () => {
    for (const moisAchat of ['2028-06', '2026-10']) {
      const r = mesurerAchat({ ...base, moisAchat });
      expect(r.tresorerie).toBeNull();
      expect(r.avertissements.join(' ')).toMatch(/horizon|passé/);
    }
  });
  it('mois d’achat mal écrit → null', () => expect(mesurerAchat({ ...base, moisAchat: '2027-13' }).tresorerie).toBeNull());
  it('solde d’ouverture inconnu : trésorerie et meilleur mois null, jamais 0', () => {
    const r = mesurerAchat({ ...base, prevision: prevision([null, null, null, null, null], [], { openingCashCents: null }) });
    expect([r.tresorerie, r.meilleurMois]).toEqual([null, null]);
  });
  it('sans entrée prévue : encaissements 0 et avertissement ; une facture client à encaisser ne compte pas comme vente (D3-6)', () => {
    const sortie = item({ amountCents: 40_000, direction: 'out' });
    const sans = mesurerAchat({ ...base, prevision: prevision(SOLDES, [sortie]) });
    expect(sans.encaissementsPrevusCents).toBe(0);
    expect(sans.avertissements.join(' ')).toContain('ne couvrent pas');
    const facture = mesurerAchat({ ...base, prevision: prevision(SOLDES, [sortie, item({ id: 'f', source: 'invoice', direction: 'in', amountCents: 5000 })]) });
    expect(facture.encaissementsPrevusCents).toBe(0);
    const prevu = mesurerAchat({ ...base, prevision: prevision(SOLDES, [item({ id: 'v', source: 'plan', direction: 'in', amountCents: 80_000 })]) });
    expect(prevu.encaissementsPrevusCents).toBe(80_000);
    expect(prevu.avertissements.join(' ')).not.toContain('ne couvrent pas');
  });
  it('les sorties sans échéance sont signalées, non comptées', () => {
    const r = mesurerAchat({ ...base, prevision: prevision(SOLDES, [], { undatedOutCents: 12_000 }) });
    expect(r.avertissements.join(' ')).toContain('sans échéance');
  });
  it('les soldes sont de fin de mois : dit', () => expect(mesurerAchat(base).avertissements.join(' ')).toContain('fin de mois'));
  it('projet déjà dans la prévision : ignorerPlanId évite le double compte (sans lui : −3 500)', () => {
    const avecProjet = prevision([200_000, 150_000, -50_000, 100_000, 150_000], [item({ id: 'FRIGO:1', source: 'equipment', planId: 'FRIGO', amountCents: FRIGO, category: 'materiel' })]);
    expect(mesurerAchat({ ...base, prevision: avecProjet, ignorerPlanId: 'FRIGO' }).tresorerie).toEqual(mesurerAchat(base).tresorerie);
    expect(mesurerAchat({ ...base, prevision: avecProjet }).tresorerie?.soldeMoisAchatCents).toBe(-350_000);
  });
  it('facture de matériel liée au projet, due en mars : retirée aussi, le reste dû est rendu (D3-10)', () => {
    const avecFacture = prevision([200_000, 150_000, 250_000, 400_000, 350_000], [item({ id: 'invoice:F', date: '2027-03-05', source: 'invoice', planId: 'FRIGO', amountCents: 100_000 })]);
    const r = mesurerAchat({ ...base, moisAchat: '2027-03', prevision: avecFacture, ignorerPlanId: 'FRIGO' });
    expect(r.tresorerie?.soldeMoisAchatCents).toBe(450_000 - FRIGO);
  });
  it('ne modifie ni la prévision ni les entrées', () => {
    const p = prevision(SOLDES, [item({})]), entree = { ...base, prevision: p }, avant = structuredClone(entree);
    mesurerAchat(entree);
    expect(entree).toEqual(avant);
  });
});

describe('mesurerAchat sur le vrai buildForecast (horloge fixée)', () => {
  it('solde du mois d’achat = solde de la prévision AVEC le projet, qu’il soit déjà dedans ou non', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-09T10:00:00Z'));
    const profile: FinancialProfile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, openingCash: { date: '2026-11-01', amountCents: 400_000, confirmed: true } };
    const frigo: FinancialPlan = { id: 'FRIGO', title: 'Frigo', date: '2027-01-15', amountCents: FRIGO, direction: 'out', category: 'materiel', source: 'equipment', status: 'active', createdAt: '2026-11-01T00:00:00Z',
      upgrade: { version: 1, timing: 'soon', stage: 'quote', budgetKnown: true, datePrecision: 'day', estimateSource: 'quote', purchaseCents: FRIGO } };
    const loyer: FinancialPlan = { id: 'LOYER', title: 'Loyer', date: '2026-11-25', amountCents: 40_000, direction: 'out', category: 'chargesFixes', source: 'recurring', status: 'active', recurrence: { frequency: 'monthly' }, createdAt: '2026-11-01T00:00:00Z' };
    const run = (plans: FinancialPlan[]) => buildForecast({ plans, transactions: [], payments: [], profile, asOf: '2026-11-09', months: 5 });
    const sans = run([loyer]), avec = run([loyer, frigo]);
    const k = avec.months.findIndex(m => m.month === '2027-01');
    expect(avec.months[k].balanceCents).toBe(sans.months[k].balanceCents! - FRIGO);
    const depuisSans = mesurerAchat({ ...base, prevision: sans, moisAchat: '2027-01' }).tresorerie!;
    const depuisAvec = mesurerAchat({ ...base, prevision: avec, moisAchat: '2027-01', ignorerPlanId: 'FRIGO' }).tresorerie!;
    expect(depuisSans.soldeMoisAchatCents).toBe(avec.months[k].balanceCents);
    expect(depuisAvec).toEqual(depuisSans);
  });
});

/* ───── Usure comptée une seule fois dans le litre (décision du pilote, 09.11) ───── */
const projet = (patch: Partial<FinancialPlan> = {}): FinancialPlan => ({ id: 'FRIGO', title: 'Frigo', date: '2027-01-15', amountCents: FRIGO, direction: 'out', category: 'materiel', source: 'equipment', status: 'active', createdAt: '2026-11-01T00:00:00Z',
  upgrade: { version: 1, timing: 'soon', stage: 'ready', budgetKnown: true, datePrecision: 'day', estimateSource: 'quote', purchaseCents: FRIGO, usefulLifeYears: 5, inServiceMonth: '2027-01' }, ...patch });
const facture = (): FinanceTransaction => ({ id: 'T-FRIGO', date: '2027-01-15', description: 'Frigo', category: 'materiel', subcategory: '', amountHT: 3000, amountTTC: 3000, tvaRate: 0, tvaAmount: 0,
  finance: { version: 1, kind: 'expense', amountCents: FRIGO, planId: 'FRIGO', paymentStatus: 'paid', lines: [{ id: '1', kind: 'equipment', description: 'Frigo', amountCents: FRIGO }] } });
const actif = (patch: Partial<FinancialAsset> = {}): FinancialAsset => ({ id: 'A-FRIGO', name: 'Frigo', transactionId: 'T-FRIGO', acquisitionDate: '2027-01-15', inServiceDate: '2027-01-15', acquisitionCents: FRIGO, businessUsePct: 100,
  category: 'production', method: 'declining', ratePct: 30, openingYear: 2027, openingValueCents: FRIGO, openingConfirmed: true, firstYearFraction: 1, usefulLifeYears: 5, ...patch });

describe('usure du litre : un matériel, une usure (linéaire, jamais l’AFC dégressif)', () => {
  const total = (plans: FinancialPlan[], assets: FinancialAsset[], transactions: FinanceTransaction[], moisReference = '2027-06', ignorerPlanId?: string) =>
    usureAnnuelleLitre({ plans, assets, transactions, moisReference, ignorerPlanId });

  it('projet seul : son usure estimée, 600 CHF/an', () => {
    const r = total([projet()], [], []);
    expect(r.totalCents).toBe(60_000);
    expect(r.lignes).toEqual([{ id: 'FRIGO', nom: 'Frigo', source: 'projet', usureCents: 60_000 }]);
  });
  it('un brassin daté avant la mise en service ne la porte pas', () => expect(total([projet()], [], [], '2026-12').totalCents).toBe(0));
  it('facture seule, sans actif : l’usure du projet continue, et l’écran apprend « actif à créer »', () => {
    const r = total([projet({ status: 'completed' })], [], [facture()]);
    expect(r.totalCents).toBe(60_000);
    expect(r.avertissements.join(' ')).toContain('Actif à créer');
  });
  it('facture + actif : l’usure LINÉAIRE de l’actif remplace celle du projet, une seule fois (60 000, ni 120 000, ni 90 000 dégressifs)', () => {
    const r = total([projet({ status: 'completed' })], [actif()], [facture()]);
    expect(r.totalCents).toBe(60_000);
    expect(r.lignes).toHaveLength(1);
    expect(r.lignes[0]).toMatchObject({ source: 'actif', id: 'A-FRIGO', usureCents: 60_000 });
    expect(r.avertissements.join(' ')).not.toContain('Actif à créer');
  });
  it('même avec le projet encore actif : une seule usure', () => expect(total([projet()], [actif()], [facture()]).totalCents).toBe(60_000));
  it('ignorerPlanId : le projet évalué et son actif sont exclus du coût du litre « hors ce projet »', () => {
    expect(total([projet()], [actif()], [facture()], '2027-06', 'FRIGO').totalCents).toBe(0);
    expect(total([projet(), projet({ id: 'HOTTE', title: 'Hotte' })], [], [], '2027-06', 'FRIGO').lignes.map(l => l.id)).toEqual(['HOTTE']);
  });
  it('idée (brouillon) ou projet annulé sans facture : aucune usure', () => {
    expect(total([projet({ status: 'draft' }), projet({ id: 'B', status: 'cancelled' })], [], []).totalCents).toBe(0);
  });
  it('usure inconnue (ni durée ni catégorie) : signalée, jamais comptée comme 0 silencieux', () => {
    const sansDuree = projet(); delete sansDuree.upgrade!.usefulLifeYears;
    const r = total([sansDuree], [], []);
    expect(r.complet).toBe(false);
    expect(r.avertissements.join(' ')).toContain('Usure à renseigner');
  });
  it('un actif sans projet compte une fois, hors service ou cédé : rien', () => {
    expect(total([], [actif()], []).totalCents).toBe(60_000);
    expect(total([], [actif({ disposedDate: '2027-03-01' })], [], '2027-06').totalCents).toBe(0);
    expect(total([], [actif({ inServiceDate: '2027-09-01' })], [], '2027-06').totalCents).toBe(0);
  });
  it('actif : durée saisie > taux linéaire du registre > taux linéaire de la catégorie AFC ; durée écoulée = 0', () => {
    expect(usureLineaireActifCents(actif(), 2027)).toBe(60_000);
    expect(usureLineaireActifCents(actif({ usefulLifeYears: undefined, method: 'linear', ratePct: 10 }), 2027)).toBe(30_000);
    expect(usureLineaireActifCents(actif({ usefulLifeYears: undefined }), 2027)).toBe(45_000); // production : 15 % linéaire, pas 30 % dégressif
    expect(usureLineaireActifCents(actif({ usefulLifeYears: undefined, category: 'custom', method: 'declining' }), 2027)).toBeNull();
    expect(usureLineaireActifCents(actif(), 2032)).toBe(0);
    expect(usureLineaireActifCents(actif({ businessUsePct: 50 }), 2027)).toBe(30_000);
  });
  it('lien projet ↔ actif : par la pièce du projet (transactionId), pas par le nom', () => {
    expect(actifLiePourProjet(projet(), [actif()], [facture()])?.id).toBe('A-FRIGO');
    expect(actifLiePourProjet(projet(), [actif()], [])).toBeUndefined();
    expect(actifLiePourProjet(projet(), [actif({ transactionId: 'AUTRE' })], [facture()])).toBeUndefined();
  });
});
