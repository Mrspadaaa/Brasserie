import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { Batch, Client, CreativeItem, Recipe, StockItem, Transaction } from '../types';
import type { FinancialPayment, FinancialPlan, FinancialProfile, FinanceTransaction } from '../domain/finance/types';
import { todayISO } from '../domain/finance/ledger';
import PLANNING_PORTE from '../../scripts/planning-vers-carnet/fixture-planning.json';
import { planMigration, type TachePlanning } from '../../scripts/planning-vers-carnet/correspondance';
import { REGLAGES_VIDES, type ReglagesFournisseurs } from '../domain/fournisseurs';
import { indiceSemaine, type LigneHorizon } from '../domain/stock/horizon';
import { plusMenuFor } from '../domain/plusEcran';
import { ajouterJours, lundiDe, numeroSemaine } from '../domain/calendrier';
import { brewBudgetDemands } from '../domain/finance/brewBudget';
import { BottomNav } from '../components/BottomNav';
import { Header } from '../components/Header';
import type { Periode } from '../components/periode/periode';
import { CalendrierTab } from '../components/tabs/CalendrierTab';
import { FloatingActions } from '../ui/FloatingActions';
import { Sheet } from '../ui/Sheet';
import { construireModele, type DonneesCalendrier } from '../ui/calendrier/useDonneesCalendrier';
import type { Document, PortEcritures } from '../ui/calendrier/ecritures';
import type { Collection } from '../domain/calendrierGestes';

/**
 * Banc du calendrier : `?preview=calendrier`. **Banc — données simulées** : aucune donnée de l'app, aucune écriture Firestore. Il rejoue
 * l'onglet Calendrier sur une fixture (brassins, fêtes, ventes, achats, travaux, activités, papiers, une promesse, un brassin habituel,
 * une échéance), avec un port d'écriture en mémoire : un geste écrit dans cette mémoire, la frise se recalcule, Annuler défait.
 * Il sert aux gestes (glisser, tirer, appui long, ajouter) et au contrôle `controle-calendrier-app.mjs`.
 */

export interface EtatBanc {
  batches: Batch[];
  plans: FinancialPlan[];
  items: CreativeItem[];
  recettes: Recipe[];
  clients: Client[];
  transactions: Transaction[];
  /** Les commandes des fournisseurs (livraisons attendues, n° 39) ; absent : aucune. */
  reglages?: ReglagesFournisseurs;
  /** Les courses datées des brassins (jalon « commander avant le … », n° 11) ; absent : aucune. */
  lignesCourses?: LigneHorizon[];
  /** Les paiements des pièces (la tendance de Finances, CRITIQUE-4 n° 23) ; absent : aucun. */
  paiements?: FinancialPayment[];
}

/**
 * CRITIQUE-4 n° 23 (E01, D-179, demande du lot q1) : la tendance de Finances, **banc — simulée**. Six mois de charges du local payées
 * (650 CHF par mois, catégorie `chargesFixes`, la seule que la prévision projette en tendance) : `buildForecast` en tire sa médiane, moins le
 * loyer déjà prévu (400), soit −250 CHF par mois de « dépenses courantes » ; le détail du creux la nomme avec sa source. Les pièces portent
 * « banc — simulé » dans leur nom ; leurs paiements sont datés du jour de la pièce, la caisse reste connue.
 */
export function avecTendance(etat: EtatBanc, aujourdhui: string): EtatBanc {
  const [a, m] = aujourdhui.split('-').map(Number);
  const pieces: FinanceTransaction[] = [];
  const paiements: FinancialPayment[] = [];
  for (let k = 1; k <= 6; k++) {
    const d = new Date(Date.UTC(a, m - 1 - k, 5));
    const jour = d.toISOString().slice(0, 10);
    const id = `F-CHARGES-${jour.slice(0, 7)}`;
    pieces.push({ ...facture(id, jour, 65000, 'expense', jour, 'Charges du local (banc — simulé)'), category: 'chargesFixes' } as FinanceTransaction);
    paiements.push({ id: `PAY-${id}`, transactionId: id, date: jour, amountCents: 65000, direction: 'out', method: 'bank', recordedAt: `${jour}T08:00:00.000Z` });
  }
  return { ...etat, transactions: [...etat.transactions, ...(pieces as unknown as Transaction[])], paiements: [...(etat.paiements ?? []), ...paiements] };
}

/** « 23.11.2026 » : le format des dates de brassin de l'app. */
const suisse = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

const profil = (centimes: number | null): FinancialProfile => ({
  id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, historyCompleteFrom: '2026-01-01',
  ...(centimes === null ? {} : { openingCash: { date: '2026-01-01', amountCents: centimes, confirmed: true } })
});

const plan = (p: Partial<FinancialPlan> & Pick<FinancialPlan, 'id' | 'title' | 'date' | 'amountCents'>): FinancialPlan => ({
  direction: 'out', category: 'divers', source: 'manual', status: 'active', createdAt: '2026-01-02T08:00:00.000Z', ...p
} as FinancialPlan);

const facture = (id: string, dueDate: string, cents: number, kind: 'expense' | 'income', date: string, nom: string = id): FinanceTransaction => ({
  id, date, description: nom, category: kind === 'income' ? 'recettes' : 'brassage', subcategory: 'x', amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind, amountCents: cents, lines: [], paymentStatus: 'unpaid', dueDate }
}) as unknown as FinanceTransaction;

const recette = (id: string, name: string, style: string): Recipe => ({ id, name, style, volumeL: 100, ingredients: [] } as unknown as Recipe);

/**
 * Une recette figée réaliste pour 100 L (banc — données simulées) : ses malts, ses houblons (dry hop daté au jour `dryHop` s'il y en a un), sa
 * levure, sa densité visée, et sa fermentation (primaire puis garde, avec leurs jours). Les jalons Brassage, Fermentation, Dry hop, Garde et
 * Conditionnement en sont lus (E25, D-191), et le budget du brassin en est estimé (`estimateBrewBudget`, n° 9).
 */
interface RecetteBanc {
  recetteId: string; og: number;
  malts: Array<[string, number]>; houblons: Array<[string, number]>; dryHop?: { nom: string; g: number; jour: number };
  levure: [string, number]; primaire: number; garde: number;
}
const RECETTES_BANC: Record<string, RecetteBanc> = {
  blonde: { recetteId: 'R-BLONDE', og: 1.048, malts: [['Malt pilsner', 20], ['Malt munich', 2]], houblons: [['Saaz', 250]], dryHop: { nom: 'Saaz', g: 300, jour: 7 }, levure: ['SafAle K-97', 2], primaire: 14, garde: 14 },
  porter: { recetteId: 'R-PORTER', og: 1.056, malts: [['Malt pale ale', 19], ['Malt chocolat', 1.5], ['Malt crystal 150', 1.5]], houblons: [['Fuggles', 350]], levure: ['SafAle S-04', 2], primaire: 14, garde: 21 },
  ipa: { recetteId: 'R-IPA', og: 1.062, malts: [['Malt pale ale', 22], ['Flocons d’avoine', 2]], houblons: [['Citra', 200]], dryHop: { nom: 'Citra', g: 600, jour: 6 }, levure: ['SafAle US-05', 2], primaire: 14, garde: 14 },
  saison: { recetteId: 'R-SAISON', og: 1.054, malts: [['Malt pilsner', 18], ['Malt de froment', 3]], houblons: [['Styrian Goldings', 300]], levure: ['Belle Saison', 2], primaire: 14, garde: 14 },
  stout: { recetteId: 'R-STOUT', og: 1.060, malts: [['Malt pale ale', 18], ['Orge torréfiée', 2], ['Flocons d’orge', 2]], houblons: [['East Kent Goldings', 300]], levure: ['SafAle S-04', 2], primaire: 14, garde: 14 },
  ambree: { recetteId: 'R-AMBREE', og: 1.052, malts: [['Malt pale ale', 18], ['Malt crystal 60', 2]], houblons: [['Hallertau Tradition', 300]], levure: ['SafAle S-04', 2], primaire: 14, garde: 14 }
};
/** Prix des ingrédients (banc — données simulées), au kg, au g ou au sachet. */
const PRIX_BANC: Record<string, { amount: number; quantity: number; unit: string }> = {
  'Malt pilsner': { amount: 1.55, quantity: 1, unit: 'kg' }, 'Malt munich': { amount: 1.8, quantity: 1, unit: 'kg' }, 'Malt pale ale': { amount: 1.6, quantity: 1, unit: 'kg' },
  'Malt chocolat': { amount: 3.2, quantity: 1, unit: 'kg' }, 'Malt crystal 150': { amount: 2.6, quantity: 1, unit: 'kg' }, 'Malt crystal 60': { amount: 2.4, quantity: 1, unit: 'kg' },
  'Malt de froment': { amount: 1.7, quantity: 1, unit: 'kg' }, 'Flocons d’avoine': { amount: 2.2, quantity: 1, unit: 'kg' }, 'Orge torréfiée': { amount: 3.4, quantity: 1, unit: 'kg' },
  'Flocons d’orge': { amount: 2.1, quantity: 1, unit: 'kg' }, Saaz: { amount: 7.5, quantity: 100, unit: 'g' }, Fuggles: { amount: 6, quantity: 100, unit: 'g' },
  Citra: { amount: 9.5, quantity: 100, unit: 'g' }, 'Styrian Goldings': { amount: 6.5, quantity: 100, unit: 'g' }, 'East Kent Goldings': { amount: 7, quantity: 100, unit: 'g' },
  'Hallertau Tradition': { amount: 6.5, quantity: 100, unit: 'g' }, 'SafAle K-97': { amount: 6.5, quantity: 1, unit: 'sachet' }, 'SafAle S-04': { amount: 5.9, quantity: 1, unit: 'sachet' },
  'SafAle US-05': { amount: 6.2, quantity: 1, unit: 'sachet' }, 'Belle Saison': { amount: 7.9, quantity: 1, unit: 'sachet' }
};

const snapshotDe = (nom: string, r: RecetteBanc) => ({
  name: nom, sourceRecipeId: r.recetteId, volumeL: 100, ogTarget: r.og,
  fermentables: r.malts.map(([name, weightKg]) => ({ name, weightKg, kind: 'grain' })),
  hops: [...r.houblons.map(([name, weightG]) => ({ name, weightG, stage: 'boil', time: 60 })), ...(r.dryHop ? [{ name: r.dryHop.nom, weightG: r.dryHop.g, stage: 'dryHop', dayOffset: r.dryHop.jour }] : [])],
  yeast: { name: r.levure[0], qty: r.levure[1], unit: 'sachet' },
  fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: r.primaire }, { kind: 'garde', name: 'Garde', tempC: 4, days: r.garde }]
});

const brassin = (id: string, name: string, plannedBrewDate: string, r: RecetteBanc, extra: Partial<Batch> = {}): Batch => ({
  id, name, style: name, volumeL: 100, brewDate: '', plannedBrewDate: suisse(plannedBrewDate), status: 'planifie', gravityLog: [], recipeRef: r.recetteId, stockAccountingVersion: 1,
  recipeSnapshot: snapshotDe(name, r),
  ...extra
} as unknown as Batch);

/**
 * L'estimation que `BrewBudgetSheet` aurait enregistrée pour ce brassin (« Prévoir ») : les prix de ses ingrédients, ses frais (énergie,
 * nettoyage, emballage) et ses litres nets saisis (l'impôt se calcule). `buildForecast` en tire les sorties du brassin : courses, frais, impôt.
 */
function planBudget(batch: Batch, le: string): FinancialPlan {
  const prices = Object.fromEntries(brewBudgetDemands(batch.recipeSnapshot as never).flatMap(d => {
    const p = PRIX_BANC[d.name];
    return p ? [[d.key, { ...p, basis: 'TTC', tvaRate: 0, source: 'manual', date: '2026-10-01' }]] : [];
  }));
  const brewEstimate = {
    id: `EST-${batch.id}`, createdAt: `${le}T08:00:00.000Z`, batchId: batch.id, recipeId: batch.recipeRef, title: batch.name, brewDate: le, volumeL: 100, netVolumeL: 95, netVolumeSource: 'saisi',
    recipeSnapshot: batch.recipeSnapshot, bindings: {}, prices, cashTreatments: {},
    settings: { costs: { energy: { enabled: true, amountTTC: 18 }, cleaning: { enabled: true, amountTTC: 6 }, packaging: { enabled: true, amountTTC: 45 } } },
    lines: [], ingredientsCost: 0, purchasesTTC: 0, operatingCashTTC: 0, operatingCost: 0, cashRequiredTTC: 0, fixedAllocation: 0, depreciationAllocation: 0, totalCost: 0, costPerL: null, complete: false, issues: []
  };
  return plan({ id: `P-BREW-${batch.id}`, title: `${batch.name} · budget`, date: le, amountCents: 0, category: 'brassage', source: 'brew', batchId: batch.id, brewEstimate } as Partial<FinancialPlan> as never);
}

/**
 * Le lundi de la prochaine semaine ISO numéro `n` (S50, S6…), dans les 53 semaines qui suivent `lundi` ; à défaut `null`.
 * La fixture parle en numéros de semaine (« Frigo de S6 à S35 », « idée en S50 ») : ils restent vrais quel que soit le jour du banc.
 */
function prochaineSemaine(lundi: string, n: number): string | null {
  for (let k = 0; k <= 53; k++) {
    const l = ajouterJours(lundi, k * 7);
    if (numeroSemaine(l) === n) return l;
  }
  return null;
}

/** Les courses d'un brassin, comme `vueHorizon(...).lignes` les rend : un article manque pour lui, la semaine de son besoin est connue. */
function courseDe(batch: Batch, article: string, unite: string, manque: number, semaineDuBesoin: number): LigneHorizon {
  const item = { id: `ST-${article}`, ref: `ST-${article}`, name: article, category: 'Malt', unit: unite, currentStock: 0, reorder: true } as StockItem;
  return {
    item, missing: manque, rupture: true, auMoins: false, semaine: semaineDuBesoin, pour: batch.name, recetteSeule: false,
    sources: [{ genre: 'brassin', id: batch.id, nom: batch.name, date: isoDe(batch.plannedBrewDate) }]
  } as unknown as LigneHorizon;
}

/** « 23.11.2026 » → « 2026-11-23 ». */
const isoDe = (suisseOuIso: string | undefined): string | null => {
  if (!suisseOuIso) return null;
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(suisseOuIso);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : suisseOuIso;
};

/** La fixture du banc, posée par rapport au jour. Rien ici ne vient de l'app. */
export function etatBanc(aujourdhui: string): EtatBanc {
  const L = lundiDe(aujourdhui);
  const s = (n: number, j = 0) => ajouterJours(L, n * 7 + j);
  /* n° 37 : la recette figée date un dry hop (J7) et une garde (après 14 j de primaire) ; n° 9 : son budget vient de son estimation (planBudget) */
  const blonde = brassin('LOT-BLONDE', 'Blonde d’automne', s(1), RECETTES_BANC.blonde);
  const porter = brassin('LOT-PORTER', 'Porter d’hiver', s(3), RECETTES_BANC.porter);
  /* CRITIQUE-3 n° 1 : en cuve depuis le lundi de S-1, avec sa recette (14 + 14 j) : le lundi suivant, « J7 / 28 » ; une densité relevée (aucun retard « densité ») */
  const ipa = brassin('LOT-IPA', 'IPA de printemps', s(-1), RECETTES_BANC.ipa, {
    status: 'fermentation', brewDate: suisse(s(-1)), actualBrewDate: suisse(s(-1)),
    gravityLog: [{ date: s(-1, 2), sg: 1.031, tempC: 19 }]
  } as Partial<Batch>);
  /* n° 25, CRITIQUE-3 n° 1 : un vrai retard, un brassin planifié dont le jour est passé sans brassage : « pas brassée », ni J ni « prête le » */
  const saison = brassin('LOT-SAISON', 'Saison de ferme', s(-1, 1), RECETTES_BANC.saison);
  /*
   * CRITIQUE-3 n° 18 et 19 : Stout maison brassée 3 fois tous les 56 jours (conditionnés, leurs dates passées), et la 4e est PLANIFIÉE en S+1 avec
   * sa recette (une barre « J0 / 28 · prête … ») : aucune proposition de Stout (E47 b). Avant, la 3e était « conditionnée » à une date future
   * (une icône en S+1) et rien n'était planifié : la proposition en S+5 était juste selon la règle, la fixture était absurde.
   */
  const stoutConditionne = (n: number, jour: string): Batch => brassin(`LOT-STOUT-${n}`, 'Stout maison', jour, RECETTES_BANC.stout, {
    brewDate: suisse(jour), actualBrewDate: suisse(jour), status: 'conditionne', bottlingDate: suisse(ajouterJours(jour, 28))
  } as Partial<Batch>);
  const dernierStout = ajouterJours(aujourdhui, -48);
  const stout = brassin('LOT-STOUT-4', 'Stout maison', s(1, 2), RECETTES_BANC.stout);
  /* E47 b gardé : l'Ambrée maison, brassée 2 fois à 70 j d'écart, la dernière il y a 35 j, rien de planifié : proposée 35 j plus tard */
  const dernierAmbree = ajouterJours(aujourdhui, -35);
  const ambree = (n: number, jour: string): Batch => brassin(`LOT-AMBREE-${n}`, 'Ambrée maison', jour, RECETTES_BANC.ambree, {
    brewDate: suisse(jour), actualBrewDate: suisse(jour), status: 'conditionne', bottlingDate: suisse(ajouterJours(jour, 28))
  } as Partial<Batch>);
  const batches = [
    blonde, porter, ipa, saison, stout,
    stoutConditionne(1, ajouterJours(dernierStout, -112)), stoutConditionne(2, ajouterJours(dernierStout, -56)), stoutConditionne(3, dernierStout),
    ambree(1, ajouterJours(dernierAmbree, -70)), ambree(2, dernierAmbree)
  ];

  /* n° 34 : l'idée datée tombe en S50 ; n° 6 et 36 : le frigo se met de côté de S6 à S35 (repli sur des semaines relatives si l'horizon ne les a pas) */
  const s50 = prochaineSemaine(L, 50) ?? s(3);
  const s6 = prochaineSemaine(L, 6) ?? s(11);
  const s35 = prochaineSemaine(s6, 35) ?? ajouterJours(s6, 29 * 7);
  const frigoFin = ajouterJours(s35, 6);

  const items: CreativeItem[] = [
    /* n° 9 : les fêtes ont leur montant (`estimatedRevenue` est en francs : 1 180 CHF) */
    { id: 'CR-NOEL', type: 'event', title: 'Marché de Noël', status: 'todo', date: s(5), estimatedRevenue: 1180 },
    { id: 'CR-FETE', type: 'event', title: 'Fête de village', status: 'todo', date: s(28), estimatedRevenue: 600 },
    { id: 'CR-RANGER', type: 'event', title: 'Ranger la réserve', status: 'todo', date: s(7), activite: true, fenetre: { du: s(7), au: ajouterJours(s(8), 6), joursActifs: 3 } },
    { id: 'CR-INV', type: 'event', title: 'Inventaire du stock', status: 'todo', date: s(2), activite: true },
    /* D386 : une fête qui dure (vendredi à dimanche de S+2) est une barre ; la tireuse louée pour elle (Achats) y est liée par un fil */
    { id: 'CR-FOIRE', type: 'event', title: 'Foire du Valais', status: 'todo', date: s(2, 4), estimatedRevenue: 2400, fenetre: { du: s(2, 4), au: s(2, 6) } },
    { id: 'CR-IDEE', type: 'recipe-idea', title: 'IPA brume', status: 'idea', date: s50 },
    /* n° 35 : une tâche sans date (la poche « Sans date ») */
    { id: 'CR-SANS', type: 'event', title: 'Appeler l’assurance', status: 'todo', activite: true }
  ];
  const plans: FinancialPlan[] = [
    plan({ id: 'P-HOTTE', title: 'Hotte', date: s(2), amountCents: 90000 }),
    /* n° 6 et 36 : « Frigo −1 800 », mis de côté de S6 à S35 ; le paiement tombe à la fin de la fenêtre (E45) */
    plan({ id: 'P-FRIGO', title: 'Frigo', date: frigoFin, amountCents: 180000, category: 'materiel', fenetre: { du: s6, au: frigoFin, miseDeCote: true } }),
    plan({ id: 'P-SOLS', title: 'Sols : colle et joints', date: s(14), amountCents: 32000, category: 'renovation', fenetre: { du: s(14), au: ajouterJours(s(16), 6), joursActifs: 5 } }),
    plan({ id: 'P-MALT', title: 'Commande groupée de malt', date: s(4), amountCents: 54000 }),
    /* D386 : deux choses d'un jour pendant la foire : la tireuse, liée à elle (fil, allumée au toucher de la foire) ; Dédé, sans lien (pâli) */
    plan({ id: 'P-TIREUSE', title: 'Tireuse', date: s(2, 4), amountCents: 15000, evenementId: 'CR-FOIRE' } as Partial<FinancialPlan> as never),
    plan({ id: 'P-DEDE', title: 'Dédé, 1 fût', date: s(2, 5), amountCents: 13000, direction: 'in', category: 'recettes' }),
    /* n° 9 : chaque brassin non conditionné a son estimation de BrewBudgetSheet : la prévision en tire ses courses, ses frais et son impôt */
    ...[blonde, porter, ipa, saison, stout].map(b => planBudget(b, ajouterJours(L, -10))),
    /* n° 38 : une échéance récurrente non payée */
    plan({ id: 'P-LOYER', title: 'Loyer du local', date: s(1, 3), amountCents: 40000, category: 'chargesFixes', source: 'recurring', recurrence: { frequency: 'monthly' } } as Partial<FinancialPlan> as never),
    /* n° 39 : la TVA T4 */
    plan({ id: 'P-TVA', title: 'TVA T4', date: s(10), amountCents: 30000, category: 'chargesFixes', source: 'tax' }),
    plan({ id: 'P-NOEL-PRIVES', title: 'Noël privés', date: s(5), amountCents: 64000, direction: 'in', category: 'recettes' }),
    /* n° 33 : la promesse liée à la Blonde */
    plan({ id: 'P-CIGOGNE', title: '3 fûts La Cigogne', date: ajouterJours(s(1), 30), amountCents: 90000, direction: 'in', category: 'recettes', batchId: 'LOT-BLONDE', clientId: 'CL-CIGOGNE' } as Partial<FinancialPlan> as never),
    /* n° 38 et 40 : la vente probable du Café du Pont, et une deuxième vente la même semaine */
    plan({ id: 'P-CAFE', title: 'Café du Pont, 1 fût', date: s(3), amountCents: 13000, direction: 'in', category: 'recettes', status: 'draft' }),
    plan({ id: 'P-EPICERIE', title: 'Épicerie du Bourg, 2 cartons', date: s(3, 3), amountCents: 18000, direction: 'in', category: 'recettes', clientId: 'CL-EPICERIE' } as Partial<FinancialPlan> as never)
  ];
  const transactions = [
    /* n° 39 : une facture à payer (Payé d'un toucher) */
    facture('F-BROUWLAND', s(2, 2), 42000, 'expense', ajouterJours(L, -9), 'Brouwland · malt'),
    facture('F-LAC', s(6), 120000, 'income', ajouterJours(L, -5), 'Facture Café du Lac'),
    /* n° 25 : un vrai retard, une facture due la semaine passée et non payée */
    facture('F-HOPFEN', s(-1, 1), 26000, 'expense', ajouterJours(L, -38), 'Hopfen · Hallertau Blanc')
  ] as unknown as Transaction[];
  const recettes = [
    recette('R-BLONDE', 'Blonde d’automne', 'Blonde'), recette('R-PORTER', 'Porter d’hiver', 'Porter'), recette('R-STOUT', 'Stout maison', 'Stout'),
    recette('R-IPA', 'IPA de printemps', 'IPA'), recette('R-SAISON', 'Saison de ferme', 'Saison'), recette('R-AMBREE', 'Ambrée maison', 'Ambrée')
  ];
  const clients = [
    { id: 'CL-CIGOGNE', name: 'La Cigogne', type: 'Pro', contact: '' }, { id: 'CL-PONT', name: 'Café du Pont', type: 'Pro', contact: '' },
    { id: 'CL-EPICERIE', name: 'Épicerie du Bourg', type: 'Pro', contact: '' }
  ] as unknown as Client[];
  /* n° 39 : une livraison attendue, le délai de Brouwland appris d'une commande reçue (7 j) ; la commande du lundi −2 j arrive à J+5 */
  const reglages: ReglagesFournisseurs = { ...REGLAGES_VIDES, commandes: { brouwland: [{ le: ajouterJours(L, -30), recue: ajouterJours(L, -23) }, { le: ajouterJours(L, -2) }] } };
  /*
   * n° 11 et 31 : les courses de la Blonde (deux articles manquent avant son brassage) : le jalon « commander avant le … » et « à acheter avant… »
   * dans son détail f4-b, à côté de son dry hop, de sa garde, de sa promesse et de son budget (le brassin complet du jouable).
   */
  const semaineBesoin = indiceSemaine(Math.floor(Date.parse(`${s(1)}T00:00:00Z`) / 86400000));
  const lignesCourses = [courseDe(blonde, 'Malt pilsner', 'kg', 12, semaineBesoin), courseDe(blonde, 'Saaz', 'g', 300, semaineBesoin)];
  return { batches, plans, items, recettes, clients, transactions, reglages, lignesCourses };
}

type Appel = { op: 'patch' | 'creer' | 'supprimer'; collection: Collection; id: string; patch?: Document };

/** Un port d'écriture en mémoire : les gestes écrivent ici, jamais dans l'app. `onAppel` rend la trace (les tests, le banc). */
export function creerPortMemoire(lire: () => EtatBanc, ecrire: (suivant: EtatBanc) => void, onAppel?: (a: Appel) => void): PortEcritures {
  const cle = (c: Collection) => (c === 'batches' ? 'batches' : c === 'creativeItems' ? 'items' : 'plans') as 'batches' | 'items' | 'plans';
  return {
    lire: (collection, id) => (lire()[cle(collection)] as unknown as Array<Document & { id: string }>).find(d => d.id === id),
    patcher: (collection, id, patch) => {
      onAppel?.({ op: 'patch', collection, id, patch });
      const e = lire();
      const liste = (e[cle(collection)] as unknown as Array<Document & { id: string }>).map(d => {
        if (d.id !== id) return d;
        const suivant: Document = { ...d, ...patch };
        for (const [k, v] of Object.entries(patch)) if (v === undefined) delete suivant[k];
        return suivant as Document & { id: string };
      });
      ecrire({ ...e, [cle(collection)]: liste });
    },
    creer: (collection, document) => {
      onAppel?.({ op: 'creer', collection, id: document.id, patch: document });
      const e = lire();
      /* comme l'app (savePlan, updateBatch) : un id qui existe déjà est remplacé, jamais doublé (une vente probable acceptée, CRITIQUE-3 n° 8) */
      const liste = e[cle(collection)] as unknown as Array<{ id: string }>;
      const suivante = liste.some(d => d.id === document.id) ? liste.map(d => (d.id === document.id ? document : d)) : [...liste, document];
      ecrire({ ...e, [cle(collection)]: suivante });
    },
    supprimer: (collection, id) => {
      onAppel?.({ op: 'supprimer', collection, id });
      const e = lire();
      ecrire({ ...e, [cle(collection)]: (e[cle(collection)] as unknown as Array<{ id: string }>).filter(d => d.id !== id) });
    }
  };
}

export interface BancProps {
  /** Le jour du banc (les tests le fixent) ; par défaut aujourd'hui. */
  aujourdhui?: string;
  /** La fixture (les tests passent la leur) ; par défaut celle du banc. */
  etat?: EtatBanc;
  /** Solde de départ en centimes ; `null` : inconnu (pas de courbe). */
  solde?: number | null;
  onAppel?: (a: Appel) => void;
  callbacks?: Partial<React.ComponentProps<typeof CalendrierTab>>;
  /** Sans la barre d'onglets ni le + volant (les tests de la frise seule). */
  sansChrome?: boolean;
  /** Paquet G n° 7 : l'en-tête de l'app, collé en haut (le banc servi pose le vrai `Header`) ; absent dans les tests. */
  enTeteApp?: React.ReactNode;
  /** Ce que le banc dit de ses données, à côté de « banc — données simulées ». */
  noteBanc?: string;
}

/**
 * Paquet G (CAL-PLACE-GACHEE, R3) : le jeu « brasseur », `?preview=calendrier&jeu=brasseur`. **Banc — données simulées**, posées comme sa
 * capture du 19.11 : ses brassins, sans coût connu (aucune estimation de budget : la prévision n'en tire rien, la courbe reste plate au solde de
 * départ) ; aucune fête, vente, achat ni facture. L'inconnu n'est pas 0 : ce qui n'est pas connu est absent, rien n'est inventé.
 */
export function etatBrasseur(aujourdhui: string): EtatBanc {
  const base = etatBanc(aujourdhui);
  return { batches: base.batches, plans: [], items: [], recettes: base.recettes, clients: [], transactions: [], reglages: REGLAGES_VIDES, lignesCourses: [] };
}

/** L'onglet Calendrier sur la fixture, avec la barre d'onglets et le + volant de l'app. */
export const BancCalendrier: React.FC<BancProps> = ({ aujourdhui: jour, etat, solde = 403200, onAppel, callbacks, sansChrome, enTeteApp, noteBanc }) => {
  const aujourdhui = jour ?? todayISO();
  const [e, setE] = useState<EtatBanc>(() => etat ?? etatBanc(aujourdhui));
  const ref = useRef(e);
  ref.current = e;
  const ecrire = useCallback((suivant: EtatBanc) => { ref.current = suivant; setE(suivant); }, []);
  const port = useMemo(() => creerPortMemoire(() => ref.current, ecrire, onAppel), [ecrire, onAppel]);
  const donnees: DonneesCalendrier = useMemo(() => {
    const modele = construireModele({
      aujourdhui, transactions: e.transactions, payments: e.paiements ?? [], plans: e.plans, profile: profil(solde), assets: [], batches: e.batches, stockItems: [] as StockItem[],
      items: e.items, recettes: e.recettes, reglages: e.reglages ?? REGLAGES_VIDES, lignesCourses: e.lignesCourses ?? []
    });
    return { modele, plans: e.plans, batches: e.batches, recettes: e.recettes, clients: e.clients, items: e.items, aujourdhui };
  }, [aujourdhui, e, solde]);
  /*
   * Les renvois vers les autres écrans de l'app (fiche du brassin, Finances, Courses, pièce, budget, Prévoir une dépense) : le banc ne monte pas
   * ces écrans (ils écrivent par les services de l'app). CRITIQUE-4 n° 13 c (E33) : il ouvre à leur place une feuille en bas, la vraie feuille de
   * l'app (`Sheet`, fermée par ×), titrée « banc — l’app ouvrirait », qui dit quel écran et avec quoi ; jamais une ligne sur l'en-tête.
   * Un renvoi qui, dans l'app, quitte l'onglet (fiche, Finances, Courses, Agenda, pièce, Poser une fête) démonte le calendrier tant que la feuille
   * est ouverte, comme l'app le démonte en changeant d'onglet : le bandeau Annuler part avec lui ; × le remonte (retour à l'onglet). Budget,
   * Prévoir une dépense et la quick action Brassin s'ouvrent, dans l'app, par-dessus le calendrier : il reste dessous.
   * La preuve que l'écran s'ouvre vraiment est aux tests (C17, C19) et au parcours /?dev-local.
   */
  const rien = () => undefined;
  const [renvoi, setRenvoi] = useState<{ texte: string; quitte: boolean } | null>(null);
  const vers = (texte: string, quitte = true) => () => setRenvoi({ texte, quitte });
  /* lot A (18.11, n° 3) : ce que « Plus de détails › » emporte, dit au banc (« · ZZ TEST — Tireuse · −150 CHF ») */
  const saisieLisible = (s?: { titre?: string; centimes?: number; direction?: 'in' | 'out' }) =>
    `${s?.titre ? ` · ${s.titre}` : ''}${s?.centimes ? ` · ${s.direction === 'in' ? '+' : '−'}${(s.centimes / 100).toLocaleString('fr-CH')} CHF` : ''}`;
  const nomBrassin = (id: string) => e.batches.find(b => b.id === id)?.name ?? id;
  const lundiLisible = (iso: string) => new Intl.DateTimeFormat('fr-CH', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
  return (
    <div className="min-h-screen bg-cave-950 text-cave-50" data-banc-calendrier>
      <p className="px-3 pt-1 text-sm text-cave-200" data-banc>banc — données simulées{noteBanc ? ` · ${noteBanc}` : ''}</p>
      {enTeteApp}
      {renvoi && (
        <Sheet open title="banc — l’app ouvrirait" onClose={() => setRenvoi(null)}>
          <div className="space-y-2 px-4 pb-4 text-sm text-cave-100" data-banc-renvoi data-banc-quitte={renvoi.quitte ? 'oui' : undefined}>
            <p className="text-base font-semibold text-cave-50">{renvoi.texte}</p>
            <p className="text-cave-300">{renvoi.quitte ? 'Dans l’app, cet écran remplace le calendrier.' : 'Dans l’app, cette feuille s’ouvre par-dessus le calendrier.'} Le banc ne le monte pas : il s’ouvre pour de vrai dans /?dev-local.</p>
          </div>
        </Sheet>
      )}
      {/* le même conteneur que le <main> de l'app : la barre latérale du 1280 a sa place, la vue large est centrée (E10) */}
      <main data-floating-actions-gap="nav" className="mx-auto w-full max-w-4xl px-2 xs:px-3 min-[1024px]:max-w-[calc(56rem+var(--rail-width,88px))] min-[1024px]:pl-[calc(var(--rail-width,88px)+0.75rem)]">
        {!renvoi?.quitte && (
          <CalendrierTab
            transactions={e.transactions} batches={e.batches} stockItems={[]}
            onOpenBatch={id => setRenvoi({ texte: `la fiche du brassin ${nomBrassin(id)}`, quitte: true })} onOpenFinances={vers('Finances')} onOpenAgenda={vers('l’Agenda')}
            onOpenCourses={vers('les Courses')} onPoserBrassin={vers('la quick action Brassin', false)}
            onPoserFete={(lundi, s) => setRenvoi({ texte: `Poser une fête, semaine du ${lundiLisible(lundi)}${saisieLisible(s)}`, quitte: true })}
            onPoserDepense={(lundi, _r, _c, s) => setRenvoi({ texte: `Prévoir une dépense, datée du ${lundiLisible(lundi)}${saisieLisible(s)}`, quitte: false })}
            onOuvrirBudget={id => setRenvoi({ texte: `le budget du brassin ${nomBrassin(id)}`, quitte: false })}
            onOpenPiece={id => setRenvoi({ texte: `la pièce ${id} (Payé)`, quitte: true })}
            donnees={donnees} port={port} aujourdhui={aujourdhui}
            {...callbacks}
          />
        )}
      </main>
      {!sansChrome && (
        <>
          <div className="app-bottom-dock">
            <BottomNav activeTab="calendrier" onChangeTab={rien} criticalStockCount={0} horsConnexion={false} />
          </div>
          <FloatingActions action={null} onAction={rien} companionLabel="Calendrier" menu={plusMenuFor('calendrier')} onPlus={rien} horsConnexion={false} anchor="nav" />
        </>
      )}
    </div>
  );
};

/** Le banc servi (`?preview=calendrier`) : la fixture, plus la tendance de Finances simulée (E01) ; les tests gardent `etatBanc` seul. */
export const CalendrierPreview: React.FC = () => {
  const aujourdhui = todayISO();
  const jeu = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('jeu') : null;
  /* `&jeu=planning` (20.11) : le jeu brasseur et les 19 étapes de son Planning portées dans le Carnet (scripts/planning-vers-carnet) */
  const brasseur = jeu === 'brasseur' || jeu === 'planning';
  const [etat] = useState(() => (jeu === 'planning' ? { ...etatBrasseur(aujourdhui), items: planMigration(PLANNING_PORTE as TachePlanning[], new Set(), '2026-11-20T12:00:00.000Z').aEcrire.flatMap(c => c.docs) }
    : brasseur ? etatBrasseur(aujourdhui) : avecTendance(etatBanc(aujourdhui), aujourdhui)));
  /* Paquet G n° 7 : le vrai en-tête de l'app (48 px au téléphone), collé ; il publie sa hauteur, la zone du calendrier se colle dessous */
  const [periode, setPeriode] = useState<Periode>({ genre: 'tout' });
  const enTeteApp = <Header globalTimeFilter={periode} onChangeGlobalTimeFilter={setPeriode} hidePeriod onGoHome={() => undefined} onOpenSearch={() => undefined} onOpenPlus={() => undefined} />;
  /* CRITIQUE-11 (état 35, D-81) : la trace des écritures du banc, lue par le harnais de vision (`window.__bancAppels`) ; en mémoire, rien ne part */
  const onAppel = useCallback((a: Appel) => {
    const w = window as unknown as { __bancAppels?: Appel[] };
    (w.__bancAppels ??= []).push(a);
  }, []);
  /* les six mois de charges payées (6 × 650) s'ajoutent au solde de départ : la caisse d'aujourd'hui reste celle de la fixture (4 032) */
  /* le jeu brasseur : sans tendance ni charges payées, la caisse est le solde du banc (4 032) */
  return <BancCalendrier aujourdhui={aujourdhui} etat={etat} solde={brasseur ? 403200 : 403200 + 6 * 65000} onAppel={onAppel} enTeteApp={enTeteApp}
    noteBanc={brasseur ? 'jeu brasseur : brassins sans coût connu, ni fête, ni vente, ni achat' : undefined} />;
};
