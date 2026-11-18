import { describe, expect, it } from 'vitest';
import type { Batch, CreativeItem, StockItem, Transaction } from '../../src/types';
import type { FinanceTransaction, FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';
import { buildForecast } from '../../src/domain/finance/forecast';
import { REGLAGES_VIDES } from '../../src/domain/fournisseurs';
import { lundiDe, numeroSemaine, semainesDe } from '../../src/domain/calendrier';
import {
  courbeCaisse, courbeDecalee, creuxDepuis, effetCaisse, lectureSemaine, minimumSuffixe, mouvementsDeSemaine, miseDeCoteA, miseDeCoteVisible, paliersApres, soldeAuJour, soldeFinDeMois, type MiseDeCote
} from '../../src/domain/calendrierCaisse';
import { construireModele, type EntreesModele } from '../../src/ui/calendrier/useDonneesCalendrier';
import { avecTendance, etatBanc } from '../../src/design/CalendrierPreview';

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

describe('E03 : la mise de côté nommée sur la courbe (z2s : « 1 140 mis de côté pour le frigo », CRITIQUE-2 n° 6 et 36)', () => {
  // Le frigo de z2s : 1 800 mis de côté de S6 à S35 (30 semaines), payé en S35. Au creux de S24 : 1 800 × 19 / 30 = 1 140.
  const frigo = { id: 'c-frigo', jour: '2027-09-01', centimes: -180000, nom: 'Frigo', choseId: 'c-frigo' };
  const mise: MiseDeCote = { id: 'c-frigo', titre: 'Frigo', du: '2027-02-08', au: '2027-08-30', centimes: 180000 };
  const avec = courbeCaisse({ depart: 500000, lundi0: '2026-11-16', mouvements: [frigo], mises: [mise] })!;
  const sans = courbeCaisse({ depart: 500000, lundi0: '2026-11-16', mouvements: [frigo] })!;
  const s24 = avec.semaines.findIndex(s => s.numero === 24 && s.lundi === '2027-06-14');

  it('au creux de S24, 1 140 mis de côté pour Frigo ; la caisse ne bouge pas, le libre baisse d’autant (aucun double compte, A10)', () => {
    expect(s24).toBe(30);
    expect(miseDeCoteA(avec, s24)).toEqual({ index: 30, lundi: '2027-06-14', numero: 24, centimes: 114000, titres: ['Frigo'] });
    expect(avec.semaines.map(s => s.caisse)).toEqual(sans.semaines.map(s => s.caisse));
    expect(avec.semaines[s24].libre).toBe(sans.semaines[s24].caisse - 114000);
    // Au paiement (S35), la caisse baisse une fois et la réserve est rendue : plus rien de mis de côté.
    const s35 = avec.semaines.findIndex(s => s.lundi === '2027-08-30');
    expect(avec.semaines[s35].reserve).toBe(0);
    expect(avec.semaines[s35].libre).toBe(avec.semaines[s35].caisse);
    expect(miseDeCoteA(avec, s35)).toBeNull();
  });

  it('la courbe nomme celle du creux ; sans rien mis de côté au creux, la semaine où la réserve est la plus haute ; sans mise, rien', () => {
    expect(miseDeCoteVisible(avec, { index: s24 })?.centimes).toBe(114000);
    const apres = miseDeCoteVisible(avec, { index: 45 })!;
    expect(apres.lundi).toBe('2027-08-23');
    expect(apres.centimes).toBe(174000);
    expect(apres.titres).toEqual(['Frigo']);
    expect(miseDeCoteVisible(sans, { index: s24 })).toBeNull();
    expect(miseDeCoteVisible(avec, null)?.centimes).toBe(174000);
  });
});

describe('CRITIQUE-3 n° 32 : le creux ne dit que sa semaine ; la tendance de Finances dans les hypothèses', () => {
  it('t7 : un loyer mensuel ne figure qu’une fois dans la semaine du creux ; deux lignes du même nom sont regroupées avec leur somme', () => {
    const courbe = courbeCaisse({
      depart: 100000, lundi0: '2026-11-16', nbSemaines: 26, mouvements: [
        ...['2026-11-27', '2026-12-27', '2027-01-27', '2027-02-27', '2027-03-27'].map((jour, i) => ({ id: `L:${i}`, jour, centimes: -40000, nom: 'Loyer du local' })),
        { id: 'H', jour: '2027-03-23', centimes: -90000, nom: 'Hotte' },
        { id: 'E1', jour: '2027-03-22', centimes: -1500, nom: 'Énergie · Porter' }, { id: 'E2', jour: '2027-03-24', centimes: -1500, nom: 'Énergie · Porter' }
      ]
    })!;
    const creux = creuxDepuis(courbe, 0)!;
    const lignes = mouvementsDeSemaine(courbe, creux.index);
    expect(lignes.filter(m => m.nom === 'Loyer du local')).toHaveLength(1);
    expect(lignes.map(m => m.libelle)).toEqual(['Hotte −900', 'Loyer du local −400', 'Énergie · Porter −30']);
    /* rien d'une autre semaine : la somme des lignes est la variation de la semaine */
    expect(lignes.reduce((s, m) => s + m.centimes, 0)).toBe(courbe.semaines[creux.index].variation);
    expect(mouvementsDeSemaine(courbe, 99)).toEqual([]);
    expect(lectureSemaine(courbe, creux.index)!.lignes[0]).toMatchObject({ genre: 'mouvement', texte: 'Hotte −900' });
  });

  it('la tendance de Finances (lignes « trend ») entre dans les hypothèses avec sa source ; sans tendance, rien', () => {
    const sans = construireModele(entrees(500000));
    expect(sans.hypotheses.map(h => h.id)).toEqual(['depart']);
    /* cinq mois de charges courantes payées (catégorie suivie par la tendance de Finances, TREND_CATEGORIES) */
    const historique = ['2026-06-10', '2026-07-10', '2026-08-10', '2026-09-10', '2026-10-10'].map((d, i) => ({ ...facture(`H${i}`, d, 60000), date: d, category: 'chargesFixes', finance: { version: 1, kind: 'expense', amountCents: 60000, lines: [], paymentStatus: 'paid', dueDate: d } }) as unknown as FinanceTransaction);
    /* sans plan de charges fixes qui couvrirait déjà la catégorie (le loyer de la fixture la couvre) */
    const avec = construireModele(entrees(500000, { plans: [], transactions: historique as unknown as Transaction[], profile: { ...profile(500000), historyCompleteFrom: '2026-05-01' } }));
    const tendance = avec.hypotheses.find(h => h.id === 'tendance')!;
    expect(tendance).toBeDefined();
    expect(tendance.texte).toMatch(/^Tendance de Finances : [−+][\d ]+ CHF\/mois$/);
    expect(tendance.source).toContain('Finances');
  });
});

describe('CRITIQUE-5 : le modèle (n° 4, 19, 24, 25, 30)', () => {
  it('n° 4 : une facture due le 10 nov., le 17 nov. : la chose garde son échéance et dit « en retard » (la prévision la compte à aujourd’hui)', () => {
    const modele = construireModele(entrees(500000, { aujourdhui: '2026-11-17', transactions: [facture('F-HOP', '2026-11-10', 26000)] as unknown as Transaction[], plans: [], batches: [] }));
    const c = modele.choses.find(x => x.id === 'argent-invoice:F-HOP')!;
    expect(c).toBeDefined();
    expect(c.debut).toBe('2026-11-17');
    expect(c.echeance).toBe('2026-11-10');
    expect(c.enRetard).toBe(true);
    expect(c.detail).toMatch(/^échéance le 10 nov\. · en retard/);
    // Une facture due plus tard n'est pas en retard et n'a pas d'échéance à part.
    const plusTard = construireModele(entrees(500000, { aujourdhui: '2026-11-17', plans: [], batches: [] })).choses.find(x => x.id === 'argent-invoice:F-OUT')!;
    expect(plusTard.enRetard).toBeUndefined();
    expect(plusTard.echeance).toBeUndefined();
  });
  it('n° 25 : le retard d’une facture dit « 260 CHF », en francs entiers, sans centimes', () => {
    const modele = construireModele(entrees(500000, { aujourdhui: '2026-11-17', transactions: [facture('F-HOP', '2026-11-10', 26000)] as unknown as Transaction[], plans: [], batches: [] }));
    const r = modele.retards.find(x => x.genre === 'facture')!;
    expect(r.detail).toBe('échéance le 10 nov. · 260 CHF');
    expect(modele.retards.map(x => x.detail).join(' ')).not.toMatch(/\d,\d\d/);
  });
  it('n° 24 : un calendrier vide n’a aucun retard (aucune pastille ⏰), solde connu ou non', () => {
    for (const depart of [500000, null]) {
      const vide = construireModele(entrees(depart, { transactions: [], plans: [], batches: [], items: [] }));
      expect(vide.retards).toEqual([]);
      expect(vide.icones.filter(i => i.genre === 'retard')).toEqual([]);
    }
  });
  it('n° 19 : un brassin planifié sans coût estimable porte « coût à venir » et partiel, jamais 0 ni rien', () => {
    const modele = construireModele(entrees(500000, { transactions: [], plans: [] }));
    const porter = modele.choses.find(x => x.id === 'brassin-LOT-7')!;
    expect(porter.centimes).toBeUndefined();
    expect(porter).toMatchObject({ coutAVenir: true, partiel: true, etiquette: 'Porter · coût à venir' });
  });
  it('n° 30 : « ensuite… » : les paliers suivants de « à dépenser » après le creux, dès la semaine qui suit chaque palier', () => {
    // Libre : 500, 300, 100 (creux S1-S2), 100, 400, 250, 900, 900 ; ensuite 250 dès S4, puis 900 dès S6.
    const lundi0 = '2026-11-16';
    const jour = (i: number) => ajouterJoursIso(lundi0, i * 7 + 1);
    const pas = [-20000, -20000, 0, 30000, -15000, 65000, 0];
    const courbe = courbeCaisse({ depart: 50000, lundi0, nbSemaines: 8, mouvements: pas.map((c, i) => ({ id: `m${i}`, jour: jour(i + 1), centimes: c, nom: `M${i}` })).filter(m => m.centimes !== 0) })!;
    expect(courbe.semaines.map(s => s.libre)).toEqual([50000, 30000, 10000, 10000, 40000, 25000, 90000, 90000]);
    const creux = creuxDepuis(courbe)!;
    expect(creux.index).toBe(2);
    expect(paliersApres(courbe, creux.index).map(p => [p.index, p.centimes])).toEqual([[4, 25000], [6, 90000]]);
    expect(paliersApres(courbe, 7)).toEqual([]);
  });
});

describe('CRITIQUE-6, doute : la tendance de Finances et le loyer ne sont pas comptés deux fois', () => {
  /* historique complet depuis juin : chaque mois, le loyer payé (400) et l'assurance payée (100), charges fixes ; le loyer est aussi un récurrent */
  const paye = (id: string, jour: string, cents: number, description: string): FinanceTransaction => ({
    id, date: jour, description, category: 'chargesFixes', subcategory: 'x', amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
    finance: { version: 1, kind: 'expense', amountCents: cents, lines: [], paymentStatus: 'paid', dueDate: jour, paidAt: jour }
  }) as unknown as FinanceTransaction;
  const historique = ['06', '07', '08', '09', '10'].flatMap(m => [paye(`L-${m}`, `2026-${m}-03`, 40000, 'Loyer du local'), paye(`A-${m}`, `2026-${m}-10`, 10000, 'Assurance')]);
  /* le récurrent commence ce mois-ci (20 nov.) : chaque mois de l'horizon a son loyer (s'il commençait en décembre, novembre garderait son enveloppe de 500) */
  const loyer = plan({ id: 'P-LOYER', title: 'Loyer du local', date: '2026-11-20', amountCents: 40000, category: 'chargesFixes', source: 'recurring', recurrence: { frequency: 'monthly' } });
  const e = entrees(500000, { transactions: historique, plans: [loyer], batches: [] });

  it('la tendance ne garde que le reste des charges fixes (500 − 400 = 100/mois) ; un mois futur sort 500, pas 900 ; A2 rejoué', () => {
    const prevision = buildForecast({ transactions: e.transactions as Transaction[] as FinanceTransaction[], payments: e.payments, plans: e.plans, profile: e.profile, assets: e.assets, asOf: e.aujourdhui, months: 13, batches: e.batches, stockItems: e.stockItems, includeEquipmentProjects: true });
    const janvier = prevision.items.filter(i => i.date.startsWith('2027-01'));
    const tendance = janvier.filter(i => i.source === 'trend').reduce((s, i) => s + i.amountCents, 0);
    const loyers = janvier.filter(i => i.source === 'recurring').reduce((s, i) => s + i.amountCents, 0);
    expect(loyers).toBe(40000);
    /* buildForecast retire de la médiane historique ce que le plan récurrent couvre déjà (forecast.ts l. 187-196) */
    expect(tendance).toBe(10000);
    const modele = construireModele(e);
    /* la courbe prend les mêmes lignes que Finances, une fois chacune : la sortie de janvier est 500, comme l'historique */
    const sortieJanvier = modele.courbe!.mouvements.filter(m => m.jour.startsWith('2027-01')).reduce((s, m) => s + m.centimes, 0);
    expect(sortieJanvier).toBe(-50000);
    expect(modele.courbe!.mouvements.filter(m => m.jour.startsWith('2027-01') && /Loyer/.test(m.nom))).toHaveLength(1);
    /* A2 rejoué sur cette fixture : en fin de chaque mois, la courbe égale le solde de Finances */
    for (const mois of prevision.months.slice(0, 6)) expect(soldeFinDeMois(modele.courbe!, mois.month)).toBe(mois.balanceCents);
    /* l'hypothèse dit la tendance nette : −100 CHF/mois */
    expect(modele.hypotheses.find(h => h.id === 'tendance')?.texte).toBe('Tendance de Finances : −100 CHF/mois');
  });

  it('CRITIQUE-7, doute : sur le banc servi (charges du local 650/mois payées, « Loyer du local −400 » récurrent), chaque mois sort 650, jamais 1 050', () => {
    const J = '2026-11-18';
    const b = avecTendance(etatBanc(J), J);
    const banc: EntreesModele = {
      aujourdhui: J, transactions: b.transactions, payments: b.paiements ?? [], plans: b.plans, profile: { ...profile(403200 + 6 * 65000), historyCompleteFrom: '2026-01-01' },
      assets: [], batches: b.batches, stockItems: [] as StockItem[], items: b.items, recettes: b.recettes, reglages: b.reglages ?? REGLAGES_VIDES, lignesCourses: b.lignesCourses ?? []
    };
    const prevision = buildForecast({ transactions: banc.transactions as unknown as FinanceTransaction[], payments: banc.payments, plans: banc.plans, profile: banc.profile, assets: [], asOf: J, months: 13, batches: banc.batches, stockItems: [], includeEquipmentProjects: true });
    const modele = construireModele(banc);
    /* l'hypothèse dit la tendance nette : 650 − 400 = 250 */
    expect(modele.hypotheses.find(h => h.id === 'tendance')?.texte).toBe('Tendance de Finances : −250 CHF/mois');
    for (const mois of ['2026-12', '2027-01', '2027-02', '2027-06', '2027-10']) {
      const lignes = prevision.items.filter(i => i.date.startsWith(mois));
      const loyer = lignes.filter(i => i.planId === 'P-LOYER').reduce((s, i) => s + i.amountCents, 0);
      const tendance = lignes.filter(i => i.source === 'trend').reduce((s, i) => s + i.amountCents, 0);
      /* un loyer et une tendance nette par mois : leur somme est la charge payée chaque mois (650), pas 650 + 400 */
      expect([mois, loyer, tendance, loyer + tendance]).toEqual([mois, 40000, 25000, 65000]);
      /* la courbe porte le loyer une fois par mois */
      expect(modele.courbe!.mouvements.filter(m => m.jour.startsWith(mois) && /Loyer/.test(m.nom))).toHaveLength(1);
    }
    /* la courbe et Finances tombent juste en fin de mois (A2) : aucun double compte dans le creux */
    for (const mois of prevision.months.slice(0, 12)) expect(soldeFinDeMois(modele.courbe!, mois.month)).toBe(mois.balanceCents);
  });

  it('CRITIQUE-10, doute m04 : sur la COURBE du banc servi, chaque mois de nov. ’26 à oct. ’27 sort un loyer (−400) et une tendance nette (−250), soit 650 ; la source le dit', () => {
    const J = '2026-11-18';
    const b = avecTendance(etatBanc(J), J);
    const banc: EntreesModele = {
      aujourdhui: J, transactions: b.transactions, payments: b.paiements ?? [], plans: b.plans, profile: { ...profile(403200 + 6 * 65000), historyCompleteFrom: '2026-01-01' },
      assets: [], batches: b.batches, stockItems: [] as StockItem[], items: b.items, recettes: b.recettes, reglages: b.reglages ?? REGLAGES_VIDES, lignesCourses: b.lignesCourses ?? []
    };
    const modele = construireModele(banc);
    const mvts = modele.courbe!.mouvements;
    const mois = Array.from({ length: 12 }, (_, i) => new Date(Date.UTC(2026, 10 + i, 1)).toISOString().slice(0, 7));
    const parMois = mois.map(m => {
      const du = mvts.filter(x => x.jour.startsWith(m));
      const loyer = du.filter(x => /Loyer/.test(x.nom));
      const tendance = du.filter(x => x.tendance).reduce((s, x) => s + x.centimes, 0);
      return [m, loyer.length, loyer.reduce((s, x) => s + x.centimes, 0), tendance];
    });
    /* le loyer entre une fois par mois en récurrent ; la tendance est la médiane des charges payées (650) MOINS ce loyer : 250, jamais 650 */
    expect(parMois).toEqual(mois.map(m => [m, 1, -40000, -25000]));
    /* les semaines du détail m04 : S34, S38 et S43 ’27 portent chacune un loyer, et leur mois une seule tendance nette */
    const semainesLoyer = mvts.filter(x => /Loyer/.test(x.nom) && x.jour >= '2027-08-01' && x.jour <= '2027-10-31').map(x => numeroSemaine(x.jour));
    expect(semainesLoyer).toEqual([34, 38, 43]);
    /* la source dit d'où vient −250 : la médiane des charges payées, moins celles déjà prévues (jamais « moyenne » seule, lue comme un double compte) */
    const h = modele.hypotheses.find(x => x.id === 'tendance')!;
    expect(h.texte).toBe('Tendance de Finances : −250 CHF/mois');
    expect(h.source).toBe('Finances › Prévision (médiane des charges payées, moins les charges déjà prévues)');
  });

  /* CRITIQUE-9, doute : le récurrent porte un fournisseur, ses paiements passés aussi ; buildForecast les retire de l'historique de la tendance */
  const payeChez = (id: string, jour: string, cents: number, description: string, vendor: string): FinanceTransaction => {
    const t = paye(id, jour, cents, description);
    return { ...t, finance: { ...t.finance!, vendor } } as FinanceTransaction;
  };
  const histoChez = (vendorLoyer: string) => ['06', '07', '08', '09', '10'].flatMap(m => [payeChez(`L-${m}`, `2026-${m}-03`, 40000, 'Loyer du local', vendorLoyer), payeChez(`A-${m}`, `2026-${m}-10`, 10000, 'Assurance', 'Assureur')]);
  const loyerChez = plan({ id: 'P-LOYER', title: 'Loyer du local', date: '2026-11-20', amountCents: 40000, category: 'chargesFixes', source: 'recurring', recurrence: { frequency: 'monthly' }, vendor: 'Régie du Bourg' });
  const sorties = (e2: EntreesModele) => {
    const prevision = buildForecast({ transactions: e2.transactions as Transaction[] as FinanceTransaction[], payments: e2.payments, plans: e2.plans, profile: e2.profile, assets: e2.assets, asOf: e2.aujourdhui, months: 13, batches: e2.batches, stockItems: e2.stockItems, includeEquipmentProjects: true });
    const modele = construireModele(e2);
    const parMois = ['2026-12', '2027-01', '2027-03'].map(mois => {
      const lignes = prevision.items.filter(i => i.date.startsWith(mois));
      return [mois, lignes.filter(i => i.planId === 'P-LOYER').reduce((s, i) => s + i.amountCents, 0), lignes.filter(i => i.source === 'trend').reduce((s, i) => s + i.amountCents, 0), modele.courbe!.mouvements.filter(m => m.jour.startsWith(mois) && /Loyer/.test(m.nom)).length];
    });
    for (const mois of prevision.months.slice(0, 12)) expect(soldeFinDeMois(modele.courbe!, mois.month)).toBe(mois.balanceCents);
    return parMois;
  };
  it('CRITIQUE-9, doute : récurrent et paiements chez le même fournisseur : un loyer (400) et la tendance du reste (100) par mois ; A2 tenu', () => {
    const e2 = entrees(500000, { transactions: histoChez('Régie du Bourg') as unknown as Transaction[], plans: [loyerChez], batches: [] });
    expect(sorties(e2)).toEqual([['2026-12', 40000, 10000, 1], ['2027-01', 40000, 10000, 1], ['2027-03', 40000, 10000, 1]]);
  });
  it('CRITIQUE-9, doute (constat buildForecast, non corrigé ici) : fournisseur sur le récurrent mais pas sur les paiements passés : la tendance garde le loyer', () => {
    const e2 = entrees(500000, { transactions: historique as unknown as Transaction[], plans: [loyerChez], batches: [] });
    /* la courbe suit Finances au centime (A2) : le double compte, s'il y en a, vient de la prévision, pas du calendrier */
    expect(sorties(e2)).toEqual([['2026-12', 40000, 50000, 1], ['2027-01', 40000, 50000, 1], ['2027-03', 40000, 50000, 1]]);
  });
});

const ajouterJoursIso =(iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
