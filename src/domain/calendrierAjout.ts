import type { Batch, Client, CreativeItem, FenetreCalendrier, Recipe } from '../types';
import type { FinancialPlan } from './finance/types';
import type { FinanceCategory } from '../types';
import { isoDate } from './finance/ledger';
import { ajouterJours, dimancheDe, ecartSemaines, etiquetteS, jourLisible, lundiDe, type ChoseCalendrier, type Rangee } from './calendrier';
import type { Ecriture } from './calendrierGestes';

/**
 * La feuille d'ajout du calendrier (E34, E45) : un brouillon par rangée, des puces proposées (jamais inventées), la garde ×10, et la
 * conversion en enregistrement de la source. Sans clavier pour les cas courants (D-39, CAL-CLAV).
 *
 * Les semaines du brouillon sont des LUNDIS ISO. La fenêtre s'écrit du lundi du début au dimanche de la fin (`fenetre.du`, `fenetre.au`).
 */

export const PUCES_JOURS = [1, 2, 3, 5, 10] as const;
export const TEMPS_EN_CUVE = [21, 28, 35, 42] as const;
/** Au-delà de ce multiple de la plus grosse somme de la rangée, une ligne demande confirmation (E34). */
export const FACTEUR_GARDE = 10;

export interface BrouillonAjout {
  rangee: Rangee;
  titre: string;
  /** Lundi ISO de la semaine de début ; `null` : aucune semaine choisie, rien n'est posé. */
  debut: string | null;
  /** Lundi ISO de la semaine de fin ; `null` : la chose tient sa semaine. */
  fin: string | null;
  /** Le début a été touché (le premier toucher d'une feuille ouverte sur une semaine préréglée fixe le début). */
  debutChoisi: boolean;
  signe: '+' | '-';
  /** Valeur absolue en centimes ; absent = montant non renseigné (jamais 0). */
  centimes?: number;
  /** Inconnu = absent. */
  joursActifs?: number;
  miseDeCote?: boolean;
  recetteId?: string;
  /** Brassin : 21, 28, 35 ou 42 jours en cuve ; la fin prévue en découle. */
  tempsEnCuve?: number;
  clientId?: string;
  liens?: { batchId?: string; clientId?: string };
  confirmeGrosseSomme?: boolean;
}

export type Puce =
  | { genre: 'recette'; id: string; libelle: string; recetteId: string }
  | { genre: 'temps'; id: string; libelle: string; jours: number }
  | { genre: 'client'; id: string; libelle: string; clientId: string }
  | { genre: 'vente-probable'; id: string; libelle: string; planId: string; centimes?: number; clientId?: string }
  | { genre: 'nom'; id: string; libelle: string };

export interface ContexteAjout {
  aujourdhui: string;
  recettes: ReadonlyArray<Pick<Recipe, 'id' | 'name' | 'style' | 'volumeL'> & { archivedAt?: string | null; favorite?: boolean }>;
  clients: ReadonlyArray<Pick<Client, 'id' | 'name'> & { archivedAt?: string | null }>;
  plans: readonly FinancialPlan[];
  /** Les choses déjà posées : noms récents, plus grosse somme de chaque rangée. */
  choses: readonly ChoseCalendrier[];
  /** Identifiants (injectés pour les tests). */
  nouvelId?: (prefixe: string) => string;
  idBrassin?: () => string;
  /** Horodatage ISO complet de la création. */
  maintenant?: string;
}

const idPar = (ctx: ContexteAjout, prefixe: string) => (ctx.nouvelId ?? ((p: string) => `${p}-${globalThis.crypto.randomUUID()}`))(prefixe);

/** Les rangées où le montant s'écrit avec un signe à toucher. */
const RANGEES_ARGENT: readonly Rangee[] = ['ventes', 'achats', 'travaux', 'activites', 'papiers'];
/** Les rangées qui se posent sur une fenêtre de semaines (E45). Brassins : la fin vient du temps en cuve. Ventes et Papiers : une date seule. */
const RANGEES_FENETRE: readonly Rangee[] = ['fetes', 'achats', 'travaux', 'activites'];

export const aUneFenetre = (rangee: Rangee): boolean => RANGEES_FENETRE.includes(rangee);
export const aUnMontant = (rangee: Rangee): boolean => RANGEES_ARGENT.includes(rangee);

/** Un brouillon vide sur une rangée ; `lundi` préréglé = la semaine choisie à l'ouverture. */
export function brouillonVide(rangee: Rangee, lundi: string | null = null): BrouillonAjout {
  return { rangee, titre: '', debut: lundi ? lundiDe(lundi) : null, fin: null, debutChoisi: false, signe: rangee === 'ventes' || rangee === 'fetes' ? '+' : '-' };
}

/** E47 b : accepter un brassin habituel ouvre la feuille Brassins avec la recette et la semaine proposées déjà choisies. */
export function brouillonDepuisProposition(proposition: Pick<ChoseCalendrier, 'rangee' | 'titre' | 'debut' | 'recipeRef' | 'proposition'>): BrouillonAjout | null {
  if (proposition.proposition !== 'brassin-habituel' || !proposition.recipeRef || !proposition.debut) return null;
  return { ...brouillonVide('brassins', proposition.debut), titre: proposition.titre, recetteId: proposition.recipeRef, debutChoisi: true };
}

/** Modifier (E30) : rouvre la feuille avec la fenêtre posée. */
export function brouillonDepuisChose(chose: ChoseCalendrier): BrouillonAjout {
  const fenetre = chose.fenetre ?? (chose.fin > chose.debut ? { du: chose.debut, au: chose.fin } : undefined);
  return {
    rangee: chose.rangee, titre: chose.titre, debut: chose.debut ? lundiDe(chose.debut) : null, fin: fenetre && chose.rangee !== 'brassins' ? lundiDe(fenetre.au) : null, debutChoisi: true,
    signe: chose.centimes !== undefined && chose.centimes > 0 ? '+' : chose.rangee === 'ventes' || chose.rangee === 'fetes' ? '+' : '-',
    ...(chose.centimes !== undefined ? { centimes: Math.abs(chose.centimes) } : {}),
    ...(chose.joursActifs ? { joursActifs: chose.joursActifs } : {}), ...(chose.miseDeCote ? { miseDeCote: true } : {}), ...(chose.liens ? { liens: chose.liens } : {})
  };
}

/**
 * Les puces de la rangée, lues dans l'app : recettes et temps en cuve pour un brassin ; clients et ventes probables pour une vente ; les noms
 * récents de la rangée pour le reste. Aucune proposition n'est inventée quand l'historique est vide (A7).
 */
export function puces(rangee: Rangee, ctx: ContexteAjout): Puce[] {
  if (rangee === 'brassins') {
    const recettes = ctx.recettes.filter(r => !r.archivedAt).sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || a.name.localeCompare(b.name, 'fr'));
    return [
      ...recettes.map<Puce>(r => ({ genre: 'recette', id: `recette-${r.id}`, libelle: r.name, recetteId: r.id })),
      ...TEMPS_EN_CUVE.map<Puce>(j => ({ genre: 'temps', id: `temps-${j}`, libelle: `${j} j`, jours: j }))
    ];
  }
  if (rangee === 'ventes') {
    const clients = ctx.clients.filter(c => !c.archivedAt).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    const probables = ctx.plans.filter(p => p.direction === 'in' && p.status === 'draft').sort((a, b) => a.title.localeCompare(b.title, 'fr'));
    return [
      ...probables.map<Puce>(p => ({ genre: 'vente-probable', id: `probable-${p.id}`, libelle: p.title, planId: p.id, ...(p.amountCents > 0 ? { centimes: p.amountCents } : {}), ...(p.clientId ? { clientId: p.clientId } : {}) })),
      ...clients.map<Puce>(c => ({ genre: 'client', id: `client-${c.id}`, libelle: c.name, clientId: c.id }))
    ];
  }
  const vus = new Set<string>();
  return ctx.choses.filter(c => c.rangee === rangee && !c.proposition && c.titre.trim()).sort((a, b) => b.debut.localeCompare(a.debut)).flatMap<Puce>(c => {
    const cle = c.titre.trim().toLocaleLowerCase('fr');
    if (vus.has(cle)) return [];
    vus.add(cle);
    return [{ genre: 'nom', id: `nom-${cle}`, libelle: c.titre.trim() }];
  }).slice(0, 12);
}

/** Toucher une puce règle le brouillon sans clavier. Retoucher la même puce de temps la lâche. */
export function appliquerPuce(b: BrouillonAjout, puce: Puce): BrouillonAjout {
  switch (puce.genre) {
    case 'recette': return { ...b, recetteId: puce.recetteId, titre: puce.libelle };
    case 'temps': return { ...b, tempsEnCuve: b.tempsEnCuve === puce.jours ? undefined : puce.jours };
    case 'client': return { ...b, clientId: puce.clientId, titre: puce.libelle, signe: '+' };
    case 'vente-probable': return { ...b, titre: puce.libelle, signe: '+', ...(puce.centimes ? { centimes: puce.centimes } : {}), ...(puce.clientId ? { clientId: puce.clientId } : {}) };
    case 'nom': return { ...b, titre: puce.libelle };
  }
}

/**
 * E45 : toucher une semaine. Le premier toucher fixe le début ; un toucher sur une semaine plus tard fixe la fin (les semaines entre deux se
 * remplissent) ; toucher le début, ou une semaine avant lui, repart d'une seule semaine. Ventes, Papiers et Brassins : une date seule.
 */
export function toucherSemaine(b: BrouillonAjout, lundi: string): BrouillonAjout {
  const l = lundiDe(lundi);
  if (!aUneFenetre(b.rangee)) return { ...b, debut: l, fin: null, debutChoisi: true };
  if (!b.debutChoisi || b.debut === null || l <= b.debut) return { ...b, debut: l, fin: null, debutChoisi: true, joursActifs: undefined };
  return { ...b, fin: l };
}

/** Le nombre de semaines de la fenêtre (1 pour une seule semaine) ; `null` sans début. */
export function nbSemaines(b: BrouillonAjout): number | null {
  if (!b.debut) return null;
  return b.fin ? ecartSemaines(b.debut, b.fin) + 1 : 1;
}

/** « S20 → S40 · 21 sem. » ; `null` tant qu'il n'y a pas de fin. */
export function resumeFenetre(b: BrouillonAjout): string | null {
  if (!b.debut || !b.fin) return null;
  return `${etiquetteS(b.debut)} → ${etiquetteS(b.fin)} · ${nbSemaines(b)} sem.`;
}

/** E45 : les puces de jours actifs ; une puce plus grande que les jours de la fenêtre (7 par semaine) est grisée. */
export function puceJours(b: BrouillonAjout): Array<{ jours: number; grisee: boolean; choisie: boolean }> {
  const max = 7 * (nbSemaines(b) ?? 1);
  return PUCES_JOURS.map(jours => ({ jours, grisee: jours > max, choisie: b.joursActifs === jours }));
}
/** Retoucher la puce choisie la lâche : l'inconnu n'est pas 0. */
export function choisirJours(b: BrouillonAjout, jours: number): BrouillonAjout {
  if (jours > 7 * (nbSemaines(b) ?? 1)) return b;
  return { ...b, joursActifs: b.joursActifs === jours ? undefined : jours };
}

/** « prête le 21 déc. », en direct, pour un brassin avec un temps en cuve. */
export function preteLe(b: BrouillonAjout): string | null {
  if (b.rangee !== 'brassins' || !b.debut || !b.tempsEnCuve) return null;
  return `prête le ${jourLisible(ajouterJours(b.debut, b.tempsEnCuve))}`;
}

/** La fenêtre écrite : du lundi du début au dimanche de la fin ; jours actifs seulement si une puce est touchée. Sans fin ni jours actifs : aucune fenêtre. */
export function fenetreDuBrouillon(b: BrouillonAjout): FenetreCalendrier | null {
  if (!b.debut || !aUneFenetre(b.rangee)) return null;
  if (!b.fin && !b.joursActifs) return null;
  return {
    du: lundiDe(b.debut), au: dimancheDe(b.fin ?? b.debut),
    ...(b.joursActifs ? { joursActifs: b.joursActifs } : {}), ...(b.miseDeCote && b.centimes ? { miseDeCote: true } : {})
  };
}

/** « Mettre de côté » ne se propose qu'à une chose avec une fenêtre et un montant (E03, C13). */
export const peutMettreDeCote = (b: BrouillonAjout): boolean => (b.rangee === 'activites' || b.rangee === 'achats' || b.rangee === 'travaux') && !!b.fin && !!b.centimes;

export interface Confirmation { confirmer: true; plafond: number; texte: string }
/** La garde ×10 : une somme au-delà de dix fois la plus grosse de la rangée demande confirmation. Sans somme connue dans la rangée, rien à comparer. */
export function demandeConfirmation(b: BrouillonAjout, ctx: ContexteAjout): Confirmation | null {
  if (!b.centimes || !aUnMontant(b.rangee)) return null;
  const sommes = ctx.choses.filter(c => c.rangee === b.rangee && c.centimes !== undefined && !c.proposition).map(c => Math.abs(c.centimes as number));
  const plus = sommes.length ? Math.max(...sommes) : 0;
  if (!plus || b.centimes <= FACTEUR_GARDE * plus) return null;
  return { confirmer: true, plafond: plus * FACTEUR_GARDE, texte: `C’est plus de ${FACTEUR_GARDE} fois ta plus grosse somme de cette rangée. C’est bien ça ?` };
}

export type Validation = { ok: true } | { ok: false; raison: string };
export function valider(b: BrouillonAjout): Validation {
  if (!b.debut) return { ok: false, raison: 'Choisis une semaine : sans date, rien n’est posé.' };
  if (b.rangee === 'brassins' && !b.recetteId) return { ok: false, raison: 'Choisis une recette.' };
  if (b.rangee !== 'brassins' && !b.titre.trim()) return { ok: false, raison: 'Choisis un nom.' };
  if (b.fin && b.fin < b.debut) return { ok: false, raison: 'La fin vient avant le début.' };
  if (b.joursActifs !== undefined && b.joursActifs > 7 * (nbSemaines(b) ?? 1)) return { ok: false, raison: `${b.joursActifs} jours actifs ne tiennent pas dans ${nbSemaines(b) === 1 ? 'une semaine' : `${nbSemaines(b)} semaines`}.` };
  return { ok: true };
}

/** Ce que « Ajouter » écrit dans la source. Brassin : un brassin planifié (la recette fige sa version au service). */
export type Enregistrement =
  | { cible: 'batch'; collection: 'batches'; document: Batch; recetteId: string }
  | { cible: 'creative'; collection: 'creativeItems'; document: CreativeItem }
  | { cible: 'plan'; collection: 'financialPlans'; document: FinancialPlan };

export type Conversion = { ok: true; enregistrement: Enregistrement; resume: string } | { ok: false; raison: string; confirmer?: Confirmation };

const CATEGORIE: Partial<Record<Rangee, FinanceCategory>> = { ventes: 'recettes', achats: 'divers', travaux: 'renovation', papiers: 'chargesFixes' };

/**
 * Le brouillon devient l'enregistrement de sa source (E34, E45) :
 * - Brassins : un `Batch` planifié, `plannedBrewDate` = lundi choisi ; avec un temps en cuve, `finPrevue` = brassage + n jours ;
 * - Fêtes et Activités : un `CreativeItem` `event` (Activités : `activite: true`), `date` = lundi du début ;
 * - Ventes, Achats, Travaux, Papiers : un `FinancialPlan` manuel. `date` = lundi du début, ou dimanche de la fin avec « Mettre de côté ».
 *   Une vente est un brouillon (probable) tant qu'elle n'est pas acceptée. Le montant est obligatoire : jamais 0 à la place de l'inconnu.
 */
export function versEnregistrement(b: BrouillonAjout, ctx: ContexteAjout): Conversion {
  const v = valider(b);
  if ('raison' in v) return v;
  const confirmation = demandeConfirmation(b, ctx);
  if (confirmation && !b.confirmeGrosseSomme) return { ok: false, raison: confirmation.texte, confirmer: confirmation };
  const debut = b.debut as string;
  const fenetre = fenetreDuBrouillon(b);
  if (b.rangee === 'brassins') {
    const recette = ctx.recettes.find(r => r.id === b.recetteId);
    if (!recette) return { ok: false, raison: 'Cette recette n’existe plus.' };
    const document: Batch = {
      id: (ctx.idBrassin ?? (() => idPar(ctx, 'LOT')))(), brewDate: '', plannedBrewDate: debut, name: recette.name, style: recette.style, volumeL: recette.volumeL,
      status: 'planifie', stockAccountingVersion: 1, recipeRef: recette.id, gravityLog: [],
      ...(b.tempsEnCuve ? { finPrevue: ajouterJours(debut, b.tempsEnCuve) } : {})
    };
    return { ok: true, enregistrement: { cible: 'batch', collection: 'batches', document, recetteId: recette.id }, resume: `${recette.name} · ${etiquetteS(debut)}${b.tempsEnCuve ? ` · ${preteLe(b)}` : ''}` };
  }
  if (b.rangee === 'fetes' || b.rangee === 'activites') {
    const document: CreativeItem = {
      id: idPar(ctx, 'CR'), type: 'event', title: b.titre.trim(), status: 'todo', date: lundiDe(debut),
      ...(b.rangee === 'activites' ? { activite: true as const } : {}),
      ...(b.rangee === 'activites' && b.centimes ? { estimatedCost: b.centimes / 100 } : {}),
      ...(fenetre ? { fenetre } : {}), ...(b.liens ? { liens: b.liens } : {})
    };
    return { ok: true, enregistrement: { cible: 'creative', collection: 'creativeItems', document }, resume: `${document.title} · ${etiquetteS(debut)}` };
  }
  if (!b.centimes || b.centimes <= 0) return { ok: false, raison: 'Indique un montant : un montant inconnu n’est pas 0.' };
  const du = fenetre?.du ?? lundiDe(debut);
  const document: FinancialPlan = {
    id: idPar(ctx, 'PLAN'), title: b.titre.trim(), date: fenetre?.miseDeCote ? fenetre.au : du, amountCents: Math.round(b.centimes), direction: b.signe === '+' ? 'in' : 'out',
    category: CATEGORIE[b.rangee] ?? 'divers', source: 'manual', status: b.rangee === 'ventes' ? 'draft' : 'active', createdAt: ctx.maintenant ?? `${ctx.aujourdhui}T12:00:00.000Z`,
    ...(fenetre ? { fenetre } : {}), ...(b.clientId ? { clientId: b.clientId } : {}), ...(b.liens?.batchId ? { batchId: b.liens.batchId } : {})
  };
  return { ok: true, enregistrement: { cible: 'plan', collection: 'financialPlans', document }, resume: `${document.title} · ${etiquetteS(document.date)}` };
}

/** L'écriture de création d'un enregistrement (« Ajouter ») ; son inverse, fourni par `ecritures.ts`, retire ce qui vient d'être posé (Annuler). */
export function ecritureDeAjout(e: Enregistrement): Ecriture {
  const document = e.document as unknown as { id: string } & Record<string, unknown>;
  return e.cible === 'batch' ? { op: 'creer', collection: e.collection, document, recetteId: e.recetteId } : { op: 'creer', collection: e.collection, document };
}

/** E36 : une idée datée, envoyée au carnet. Le carnet vit dans `CreativeItem` : une idée de bière est un `recipe-idea` (Atelier › Carnet › Bières). */
export function enregistrementIdee(titre: string, jour: string, ctx: Pick<ContexteAjout, 'nouvelId'>): { ok: true; enregistrement: Enregistrement } | { ok: false; raison: string } {
  const texte = titre.trim();
  const date = isoDate(jour);
  if (!texte) return { ok: false, raison: 'Écris l’idée en quelques mots.' };
  if (!date) return { ok: false, raison: 'Choisis une semaine.' };
  const document: CreativeItem = { id: (ctx.nouvelId ?? ((p: string) => `${p}-${globalThis.crypto.randomUUID()}`))('CR'), type: 'recipe-idea', title: texte, status: 'idea', date: lundiDe(date) };
  return { ok: true, enregistrement: { cible: 'creative', collection: 'creativeItems', document } };
}

/** Modifier (E30) : le brouillon rouvert écrit ses changements dans la source existante, sans en créer une autre. Un brassin se rouvre par sa fiche. */
export function versModification(b: BrouillonAjout, chose: ChoseCalendrier): { ok: true; ecritures: Ecriture[] } | { ok: false; raison: string } {
  const v = valider(b);
  if ('raison' in v) return v;
  const fenetre = fenetreDuBrouillon(b);
  const debut = b.debut as string;
  if (chose.source.genre === 'creative') {
    return { ok: true, ecritures: [{ op: 'patch', collection: 'creativeItems', id: chose.source.id, patch: {
      title: b.titre.trim(), date: fenetre?.du ?? lundiDe(debut), fenetre: fenetre ?? undefined,
      ...(chose.rangee === 'activites' ? { estimatedCost: b.centimes ? b.centimes / 100 : undefined } : {})
    } }] };
  }
  if (chose.source.genre === 'plan' && chose.source.origine === 'manual') {
    if (!b.centimes || b.centimes <= 0) return { ok: false, raison: 'Indique un montant : un montant inconnu n’est pas 0.' };
    return { ok: true, ecritures: [{ op: 'patch', collection: 'financialPlans', id: chose.source.id, patch: {
      title: b.titre.trim(), date: fenetre?.miseDeCote ? fenetre.au : fenetre?.du ?? lundiDe(debut), amountCents: Math.round(b.centimes), direction: b.signe === '+' ? 'in' : 'out', fenetre: fenetre ?? undefined
    } }] };
  }
  return { ok: false, raison: 'Cette chose se modifie dans sa source : ouvre-la depuis son détail.' };
}
