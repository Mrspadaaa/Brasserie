import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { Batch, Client, CreativeItem, Recipe, StockItem, Transaction } from '../types';
import type { FinancialPlan, FinancialProfile, FinanceTransaction } from '../domain/finance/types';
import { todayISO } from '../domain/finance/ledger';
import { REGLAGES_VIDES, type ReglagesFournisseurs } from '../domain/fournisseurs';
import { indiceSemaine, type LigneHorizon } from '../domain/stock/horizon';
import { plusMenuFor } from '../domain/plusEcran';
import { ajouterJours, lundiDe, numeroSemaine } from '../domain/calendrier';
import { brewBudgetDemands } from '../domain/finance/brewBudget';
import { BottomNav } from '../components/BottomNav';
import { CalendrierTab } from '../components/tabs/CalendrierTab';
import { FloatingActions } from '../ui/FloatingActions';
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
}

/** L'onglet Calendrier sur la fixture, avec la barre d'onglets et le + volant de l'app. */
export const BancCalendrier: React.FC<BancProps> = ({ aujourdhui: jour, etat, solde = 403200, onAppel, callbacks, sansChrome }) => {
  const aujourdhui = jour ?? todayISO();
  const [e, setE] = useState<EtatBanc>(() => etat ?? etatBanc(aujourdhui));
  const ref = useRef(e);
  ref.current = e;
  const ecrire = useCallback((suivant: EtatBanc) => { ref.current = suivant; setE(suivant); }, []);
  const port = useMemo(() => creerPortMemoire(() => ref.current, ecrire, onAppel), [ecrire, onAppel]);
  const donnees: DonneesCalendrier = useMemo(() => {
    const modele = construireModele({
      aujourdhui, transactions: e.transactions, payments: [], plans: e.plans, profile: profil(solde), assets: [], batches: e.batches, stockItems: [] as StockItem[],
      items: e.items, recettes: e.recettes, reglages: e.reglages ?? REGLAGES_VIDES, lignesCourses: e.lignesCourses ?? []
    });
    return { modele, plans: e.plans, batches: e.batches, recettes: e.recettes, clients: e.clients, items: e.items, aujourdhui };
  }, [aujourdhui, e, solde]);
  /*
   * Les renvois vers les autres écrans de l'app (fiche du brassin, Finances, Courses, pièce, budget, Prévoir une dépense) : le banc ne monte pas
   * ces écrans (ils écrivent par les services de l'app). Il dit, en clair et marqué « banc », quel écran l'app ouvrirait et avec quoi : le geste
   * est atteint et visible à la capture. La preuve que l'écran s'ouvre vraiment est aux tests (C17, C19) et au parcours /?dev-local.
   */
  const rien = () => undefined;
  const [renvoi, setRenvoi] = useState<string | null>(null);
  const vers = (texte: string) => () => setRenvoi(texte);
  const nomBrassin = (id: string) => e.batches.find(b => b.id === id)?.name ?? id;
  const lundiLisible = (iso: string) => new Intl.DateTimeFormat('fr-CH', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
  return (
    <div className="min-h-screen bg-cave-950 text-cave-50" data-banc-calendrier>
      <p className="px-3 pt-1 text-sm text-cave-200" data-banc>banc — données simulées</p>
      {renvoi && <p className="fixed left-2 top-1 z-[90] rounded bg-cave-800 px-2 py-0.5 text-sm text-cave-50 pointer-events-none" data-banc-renvoi>banc — l’app ouvrirait : {renvoi}</p>}
      {/* le même conteneur que le <main> de l'app : la barre latérale du 1280 a sa place, la vue large est centrée (E10) */}
      <main data-floating-actions-gap="nav" className="mx-auto w-full max-w-4xl px-2 xs:px-3 min-[1024px]:max-w-[calc(56rem+var(--rail-width,88px))] min-[1024px]:pl-[calc(var(--rail-width,88px)+0.75rem)]">
        <CalendrierTab
          transactions={e.transactions} batches={e.batches} stockItems={[]}
          onOpenBatch={id => setRenvoi(`la fiche du brassin ${nomBrassin(id)}`)} onOpenFinances={vers('Finances')} onOpenAgenda={vers('l’Agenda')}
          onOpenCourses={vers('les Courses')} onPoserBrassin={vers('la quick action Brassin')}
          onPoserFete={lundi => setRenvoi(`Poser une fête, semaine du ${lundiLisible(lundi)}`)}
          onPoserDepense={lundi => setRenvoi(`Prévoir une dépense, datée du ${lundiLisible(lundi)}`)}
          onOuvrirBudget={id => setRenvoi(`le budget du brassin ${nomBrassin(id)}`)}
          onOpenPiece={id => setRenvoi(`la pièce ${id} (Payé)`)}
          donnees={donnees} port={port} aujourdhui={aujourdhui}
          {...callbacks}
        />
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

export const CalendrierPreview: React.FC = () => <BancCalendrier />;
