import { describe, expect, it } from 'vitest';
import type { Batch, CreativeItem, StockItem, Transaction } from '../../src/types';
import type { FinanceTransaction, FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';
import { buildForecast } from '../../src/domain/finance/forecast';
import { REGLAGES_VIDES } from '../../src/domain/fournisseurs';
import { lundiDe, semainesDe } from '../../src/domain/calendrier';
import {
  courbeCaisse, courbeDecalee, creuxDepuis, effetCaisse, lectureSemaine, minimumSuffixe, soldeAuJour, soldeFinDeMois, type MiseDeCote
} from '../../src/domain/calendrierCaisse';
import { construireModele, type EntreesModele } from '../../src/ui/calendrier/useDonneesCalendrier';

const profile = (opening: number | null): FinancialProfile => ({
  id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, historyCompleteFrom: '2026-06-01',
  ...(opening === null ? {} : { openingCash: { date: '2026-01-01', amountCents: opening, confirmed: true } })
});
const facture = (id: string, dueDate: string, cents: number, p: { kind?: 'expense' | 'income' } = {}): FinanceTransaction => ({
  id, date: '2026-11-02', description: id, category: p.kind === 'income' ? 'recettes' : 'brassage', subcategory: 'x', amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: p.kind ?? 'expense', amountCents: cents, lines: [], paymentStatus: 'unpaid', dueDate }
}) as FinanceTransaction;
const plan = (p: Partial<FinancialPlan>): FinancialPlan => ({ id: 'P', title: 'Plan', date: '2026-12-03', amountCents: 15000, direction: 'out', category: 'divers', source: 'manual', status: 'active', createdAt: '2026-11-01T00:00:00Z', ...p });
const planifie = { id: 'LOT-7', name: 'Porter', style: 'Porter', volumeL: 30, brewDate: '', plannedBrewDate: '08.12.2026', status: 'planifie', recipeSnapshot: { fermentation: [{ kind: 'primaire', name: 'P', tempC: 19, days: 14 }] } } as unknown as Batch;

/** Trois mois : une facture à payer, une à encaisser, un plan d'achat, un récurrent, une TVA et un brassin planifié. */
const entrees = (opening: number | null, p: Partial<EntreesModele> = {}): EntreesModele => ({
  aujourdhui: '2026-11-16', transactions: [facture('F-OUT', '2026-11-24', 42000), facture('F-IN', '2026-12-10', 120000, { kind: 'income' })],
  payments: [], plans: [
    plan({ id: 'P-ACHAT', title: 'Bouchons', date: '2026-12-03', amountCents: 15000 }),
    plan({ id: 'P-LOYER', title: 'Loyer', date: '2026-11-27', amountCents: 80000, category: 'chargesFixes', source: 'recurring', recurrence: { frequency: 'monthly' } }),
    plan({ id: 'P-TVA', title: 'TVA T3', date: '2026-12-20', amountCents: 30000, category: 'chargesFixes', source: 'tax' })
  ], profile: profile(opening), assets: [], batches: [planifie], stockItems: [] as StockItem[], items: [] as CreativeItem[], recettes: [], reglages: REGLAGES_VIDES, ...p
});

describe('A2 : vérité croisée avec buildForecast', () => {
  it('en fin de chaque mois, la courbe égale months[i].balanceCents ; sur 3 mois, factures, plans, récurrent et brassin', () => {
    const e = entrees(500000);
    const prevision = buildForecast({ transactions: e.transactions as Transaction[] as FinanceTransaction[], payments: e.payments, plans: e.plans, profile: e.profile, assets: e.assets, asOf: e.aujourdhui, months: 13, batches: e.batches, stockItems: e.stockItems, includeEquipmentProjects: true });
    const modele = construireModele(e);
    expect(modele.courbe).not.toBeNull();
    expect(prevision.items.filter(i => i.source !== 'trend').length).toBeGreaterThanOrEqual(5);
    for (const mois of prevision.months.slice(0, 3)) {
      expect(soldeFinDeMois(modele.courbe!, mois.month)).toBe(mois.balanceCents);
    }
    // la caisse d'une semaine est le solde au dimanche
    for (const s of modele.courbe!.semaines.slice(0, 20)) {
      const dimanche = new Date(Date.parse(`${s.lundi}T00:00:00Z`) + 6 * 86400000).toISOString().slice(0, 10);
      expect(s.caisse).toBe(soldeAuJour(modele.courbe!, dimanche));
    }
    expect(modele.courbe!.semaines).toHaveLength(52);
    expect(modele.courbe!.semaines[0].lundi).toBe('2026-11-16');
  });
  it('sans solde de départ la courbe vaut null, jamais 0 ; ni creux, ni « à dépenser »', () => {
    const modele = construireModele(entrees(null));
    expect(modele.courbe).toBeNull();
    expect(modele.soldeDepartInconnu).toBe(true);
    expect(modele.creux).toBeNull();
    expect(modele.hypotheses.find(h => h.id === 'depart')).toBeUndefined();
    expect(courbeCaisse({ depart: undefined, lundi0: '2026-11-16', mouvements: [] })).toBeNull();
    expect(courbeCaisse({ depart: null, lundi0: '2026-11-16', mouvements: [] })).toBeNull();
    expect(construireModele(entrees(0)).courbe).not.toBeNull(); // 0 est un solde connu
  });
  it('le modèle porte son solde de départ et son creux', () => {
    const modele = construireModele(entrees(500000));
    expect(modele.hypotheses[0]).toMatchObject({ id: 'depart', texte: 'Solde de départ : 5 000 CHF', ouvre: { ecran: 'solde' } });
    expect(modele.creux).toMatchObject({ centimes: Math.min(...modele.courbe!.semaines.map(s => s.libre)) });
  });
});

describe('A4 : à dépenser = minimum suffixe de la courbe libre, avec sa semaine', () => {
  const mouvements = [
    { id: 'a', jour: '2026-11-24', centimes: -300000, nom: 'Malt' }, { id: 'b', jour: '2026-12-08', centimes: +100000, nom: 'Vente' }, { id: 'c', jour: '2026-12-22', centimes: -50000, nom: 'Loyer' }
  ];
  const courbe = courbeCaisse({ depart: 400000, lundi0: '2026-11-16', mouvements })!;
  it('le creux est le plus bas de la semaine courante à la fin, avec sa semaine ; au creux égal, le plus proche', () => {
    expect(courbe.semaines.slice(0, 7).map(s => s.libre)).toEqual([400000, 100000, 100000, 200000, 200000, 150000, 150000]);
    expect(creuxDepuis(courbe)).toMatchObject({ index: 1, numero: 48, centimes: 100000, lundi: '2026-11-23' });
    expect(creuxDepuis(courbe, 2)).toMatchObject({ index: 2, centimes: 100000 });
    expect(creuxDepuis(courbe, 3)).toMatchObject({ index: 5, numero: 52, centimes: 150000 });
    expect(minimumSuffixe([5, 3, 4, 1, 2])).toEqual([1, 1, 1, 1, 2]);
  });
  it('en négatif, on passe déjà sous 0 : le creux est négatif', () => {
    const c = courbeCaisse({ depart: 10000, lundi0: '2026-11-16', mouvements: [{ id: 'x', jour: '2026-12-01', centimes: -50000, nom: 'Cuve' }] })!;
    expect(creuxDepuis(c)!.centimes).toBe(-40000);
  });
  it('une mise de côté de 1 800 sur S6–S35 retire au prorata à mi-fenêtre et rend tout au paiement', () => {
    const mise: MiseDeCote = { id: 'frigo', titre: 'Frigo', du: '2026-02-02', au: '2026-08-30', centimes: 180000 };
    const c = courbeCaisse({ depart: 1000000, lundi0: '2026-02-02', mouvements: [{ id: 'paiement', jour: '2026-08-30', centimes: -180000, nom: 'Frigo' }], mises: [mise] })!;
    const s = c.semaines;
    expect(s[0].numero).toBe(6);
    expect(s[29].numero).toBe(35);
    expect(s[0].reserve).toBe(6000); // 1/30
    expect(s[14].reserve).toBe(90000); // mi-fenêtre (S20) : 15/30 de 1 800
    expect(s[14].libre).toBe(s[14].caisse - 90000);
    expect(s[28].reserve).toBe(174000);
    expect(s[29].reserve).toBe(0); // rendu au paiement, la même semaine
    expect(s[29].libre).toBe(s[29].caisse);
    expect(s[29].caisse).toBe(1000000 - 180000);
    expect(s.slice(0, 29).every(x => x.caisse === 1000000)).toBe(true); // la caisse n'a baissé qu'au paiement
    expect(s[51].reserve).toBe(0);
  });
});

describe('A10 : la mise de côté ne crée aucun plan et ne touche pas la caisse', () => {
  it('poser fenetre.miseDeCote : la liste des plans ne change pas, la caisse est identique semaine par semaine, le libre baisse au prorata', () => {
    const f = (miseDeCote: boolean): CreativeItem => ({ id: 'CR-F', type: 'event', activite: true, title: 'Frigo', status: 'todo', date: '2026-02-02', estimatedCost: 1800, fenetre: { du: '2026-02-02', au: '2026-08-30', ...(miseDeCote ? { miseDeCote: true } : {}) } });
    const plans = [plan({ id: 'P-FRIGO', title: 'Frigo (paiement)', date: '2026-08-30', amountCents: 180000, category: 'materiel' })];
    const base = (item: CreativeItem) => entrees(1000000, { aujourdhui: '2026-02-02', transactions: [], plans, items: [item], batches: [] });
    const avant = construireModele(base(f(false))), apres = construireModele(base(f(true)));
    expect(plans).toHaveLength(1);
    expect(avant.courbe!.semaines.map(s => s.caisse)).toEqual(apres.courbe!.semaines.map(s => s.caisse));
    expect(avant.courbe!.semaines.map(s => s.libre)).toEqual(avant.courbe!.semaines.map(s => s.caisse));
    expect(apres.courbe!.semaines[14].libre).toBe(apres.courbe!.semaines[14].caisse - 90000);
    expect(apres.courbe!.semaines[29].libre).toBe(apres.courbe!.semaines[29].caisse);
    // la caisse ne baisse qu'une fois, à la date du paiement
    const baisses = apres.courbe!.semaines.filter((s, i, t) => i > 0 && s.caisse < t[i - 1].caisse);
    expect(baisses.map(s => s.numero)).toEqual([35]);
    expect(apres.choses.find(c => c.rangee === 'activites')).toMatchObject({ miseDeCote: true, centimes: -180000 });
  });
});

describe('E02, E11 : lecture et aperçu', () => {
  const c = courbeCaisse({ depart: 380100, lundi0: '2026-03-16', mouvements: [
    { id: '1', jour: '2026-03-17', centimes: -30000, nom: 'Malt' }, { id: '2', jour: '2026-03-18', centimes: -12000, nom: 'Levure' }, { id: '3', jour: '2026-03-19', centimes: 5000, nom: 'Vente' },
    { id: 't', jour: '2026-03-20', centimes: -2000, nom: 'Tendance', tendance: true }
  ] })!;
  it('la tête lit la semaine : libre, S, date, variation ; au plus trois lignes : plus gros mouvement, « +n autres », la semaine', () => {
    const l = lectureSemaine(c, 0)!;
    expect(l.tete).toBe('3 411 CHF · S12 · 16 mars −390');
    expect(l.lignes.map(x => x.texte)).toEqual(['Malt −300', '+2 autres', 'la semaine −390']);
    expect(l.date).toBe('S12, 16 – 22 mars');
    expect(lectureSemaine(c, 99)).toBeNull();
    expect(c.semaines[0].mouvements.map(m => m.libelle)).toEqual(['Malt −300', 'Levure −120', 'Vente +50']);
    expect(c.semaines[0].tendance).toBe(-2000);
  });
  it('la courbe décalée et l’effet : la première semaine qui change, jamais les écarts de moins d’un franc', () => {
    const apres = courbeDecalee({ ...c, mouvements: c.mouvements.map(m => (m.id === '1' ? { ...m, choseId: 'c1' } : m)) }, 'c1', 7);
    expect(apres.mouvements.find(m => m.id === '1')!.jour).toBe('2026-03-24');
    expect(effetCaisse(c, apres)).toMatchObject({ numero: 12, avant: 341100, apres: 371100 });
    expect(effetCaisse(c, c)).toBeNull();
    expect(effetCaisse(null, c)).toBeNull();
  });
  it('un mouvement daté avant la première semaine est dans le départ de la courbe', () => {
    const cc = courbeCaisse({ depart: 100000, lundi0: '2026-03-16', mouvements: [{ id: 'p', jour: '2026-03-02', centimes: -4000, nom: 'passé' }] })!;
    expect(cc.base).toBe(96000);
    expect(soldeAuJour(cc, '2026-03-15')).toBeNull();
    expect(soldeAuJour(cc, '2026-03-16')).toBe(96000);
    expect(soldeAuJour(cc, '2027-12-31')).toBeNull();
    expect(semainesDe('2026-03-18', 3).map(s => s.debut)).toEqual(['2026-03-16', '2026-03-23', '2026-03-30']);
    expect(lundiDe('2026-03-22')).toBe('2026-03-16');
  });
});
