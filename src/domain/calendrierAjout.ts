import { carnetDepuisPhrase } from './carnets/modele';
import type { Batch, Client, CreativeItem, FenetreCalendrier, Recipe } from '../types';
import type { FinanceTransaction, FinancialPlan } from './finance/types';
import type { AchatPasse } from './horizons';
import type { FinanceCategory } from '../types';
import { isoDate } from './finance/ledger';
import { ajouterJours, dimancheDe, ecartSemaines, etiquetteS, francs, jourLisible, lundiDe, nomRangee, numeroSemaine, type ChoseCalendrier, type Rangee } from './calendrier';
import type { Ecriture } from './calendrierGestes';
import { nomParDefaut } from './nomParDefaut';

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
  liens?: { batchId?: string; clientId?: string; evenementId?: string };
  confirmeGrosseSomme?: boolean;
  /** La vente probable choisie par sa puce : « Ajouter » l'ACCEPTE (même id, brouillon → confirmée), il n'en crée pas une autre (CRITIQUE-3 n° 8). */
  planProbableId?: string;
  /**
   * CAL-PASSE (20.11, « modifier un évènement ne l'update pas à la bonne date ») : le JOUR d'origine d'une chose rouverte par Modifier. La feuille
   * raisonne en semaines (lundis) ; sans ce jour, « Enregistrer » sans toucher à la semaine réécrivait le lundi (un mercredi 9 déc. devenait le 7).
   * Tant que la semaine est celle d'origine, c'est ce jour qui s'écrit ; une autre semaine s'écrit au lundi (comme le glisser, qui garde le jour
   * de la semaine, mais ici le doigt choisit une semaine).
   */
  jour?: string;
  /** Le jour a été choisi au doigt (rangée des jours) : il s'écrit tel quel, même dans la semaine en cours. Sinon, une autre semaine garde le rang du jour (mardi → mardi). */
  jourChoisi?: boolean;
  /**
   * CAL-PASSE : le brouillon vient d'une chose qui existe déjà (Modifier, Poser depuis « Sans date »). Le PREMIER toucher d'une semaine la DÉPLACE
   * (sa longueur reste, comme au glisser) ; il n'étend pas une fenêtre : « modifier un évènement ne l'update pas à la bonne date » (toucher
   * une semaine plus tard n'écrivait que la fin, la date de début restait où elle était). Les touchers suivants règlent la fin, comme à l'ajout.
   */
  rouvert?: boolean;
  /** G3 : le nom est celui posé (« Travaux · S48 ») ; il suit la semaine tant qu'il n'est ni tapé ni choisi. */
  nomPose?: boolean;
  /** C1 : la date vient d'un horizon (« 3 mois ») ; posée hors de la fenêtre affichée, la frise va la montrer pour la régler au glisser. */
  parHorizon?: boolean;
}

/**
 * Une puce de la feuille. Un nom récent et un client portent le montant de leur dernière fois (`centimes`, valeur absolue, et son `signe`) :
 * la toucher pose le nom ET le montant, sans clavier (E34, D-39, CAL-CLAV). Une puce `montant` donne un montant récent de la rangée.
 */
export type Puce =
  | { genre: 'recette'; id: string; libelle: string; recetteId: string }
  | { genre: 'temps'; id: string; libelle: string; jours: number }
  | { genre: 'client'; id: string; libelle: string; clientId: string; centimes?: number; /** Sa vente habituelle, « 1 fût » (CRITIQUE-4 n° 16). */ quoi?: string; /** Le titre de sa vente habituelle, repris tel quel. */ titreHabituel?: string }
  | { genre: 'vente-probable'; id: string; libelle: string; planId: string; centimes?: number; clientId?: string }
  | { genre: 'nom'; id: string; libelle: string; centimes?: number; signe?: '+' | '-' }
  | { genre: 'montant'; id: string; libelle: string; centimes: number; signe: '+' | '-' };

/** Au plus ce nombre de montants récents proposés en puces. */
export const NB_MONTANTS_RECENTS = 4;

export interface ContexteAjout {
  aujourdhui: string;
  recettes: ReadonlyArray<Pick<Recipe, 'id' | 'name' | 'style' | 'volumeL'> & { archivedAt?: string | null; favorite?: boolean }>;
  clients: ReadonlyArray<Pick<Client, 'id' | 'name'> & { archivedAt?: string | null }>;
  plans: readonly FinancialPlan[];
  /** Les choses déjà posées : noms récents, plus grosse somme de chaque rangée. */
  choses: readonly ChoseCalendrier[];
  /** D2 : les achats payés (lignes de dépense) : le prix du dernier achat semblable se propose, marqué « estimé ». */
  achats?: readonly AchatPasse[];
  /** Identifiants (injectés pour les tests). */
  nouvelId?: (prefixe: string) => string;
  idBrassin?: () => string;
  /** Horodatage ISO complet de la création. */
  maintenant?: string;
}

/** D2 : les lignes de dépense des pièces passées (rentrées exclues, montant > 0), comme la feuille d'achat (ExpenseSheet). */
export function achatsPasses(transactions: readonly unknown[]): AchatPasse[] {
  return (transactions as readonly FinanceTransaction[]).flatMap(t => t.finance?.kind === 'income' ? [] : (t.finance?.lines ?? [])
    .filter(l => l.amountCents > 0)
    .map(l => ({ libelle: l.description, centimes: l.amountCents, date: String(t.date).slice(0, 10), categorie: t.category, ref: (l as { stockItemRef?: string }).stockItemRef })));
}

const idPar = (ctx: ContexteAjout, prefixe: string) => (ctx.nouvelId ?? ((p: string) => `${p}-${globalThis.crypto.randomUUID()}`))(prefixe);

/** Les rangées où le montant s'écrit avec un signe à toucher. */
const RANGEES_ARGENT: readonly Rangee[] = ['fetes', 'ventes', 'achats', 'travaux', 'activites', 'papiers'];
/** Les rangées qui se posent sur une fenêtre de semaines (E45). Brassins : la fin vient du temps en cuve. Ventes et Papiers : une date seule. */
const RANGEES_FENETRE: readonly Rangee[] = ['fetes', 'achats', 'travaux', 'activites'];

export const aUneFenetre = (rangee: Rangee): boolean => RANGEES_FENETRE.includes(rangee);
/**
 * CAL-JALON-UN-JOUR (18.11, « une vente ou un Achat … est sur un seul moment, un seul jour ») : un achat se pose sur un jour, comme une vente.
 * Il n'a pas de jours actifs ; il garde une fenêtre seulement sur plusieurs semaines (mettre de côté), où il reste une barre.
 */
export const aDesJoursActifs = (rangee: Rangee): boolean => aUneFenetre(rangee) && rangee !== 'achats';
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
    ...(chose.joursActifs ? { joursActifs: chose.joursActifs } : {}), ...(chose.miseDeCote ? { miseDeCote: true } : {}), ...(chose.liens ? { liens: chose.liens } : {}),
    rouvert: true, ...(isoDate(chose.debut) ? { jour: chose.debut } : {})
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
    /*
     * CRITIQUE-4 n° 16 (E34, D-39) : la vente habituelle de ce client, la plus récente de ses prévisions de rentrée non annulées (brouillon compris).
     * Une prévision est à lui si elle porte son `clientId`, ou si son titre commence par son nom (« Café du Pont, 1 fût »). Ce qui suit le nom est
     * ce qu'il achète d'habitude (« 1 fût »). Aucune : pas de montant proposé (l'inconnu n'est pas 0).
     */
    const debutNom = (titre: string, nom: string) => {
      const t = titre.trim().toLocaleLowerCase('fr'), n = nom.trim().toLocaleLowerCase('fr');
      return !!n && t.startsWith(n) && (t.length === n.length || /^[\s,·:–-]/.test(t.slice(n.length)));
    };
    /* CRITIQUE-6 n° 15 : le nom peut aussi finir le titre, « 3 fûts La Cigogne » (la quantité devant) */
    const finNom = (titre: string, nom: string) => {
      const t = titre.trim().toLocaleLowerCase('fr'), n = nom.trim().toLocaleLowerCase('fr');
      return !!n && t.length > n.length && t.endsWith(n) && /[\s,·:–-]$/.test(t.slice(0, t.length - n.length));
    };
    const porteNom = (titre: string, nom: string) => debutNom(titre, nom) || finNom(titre, nom);
    const habituelle = (c: { id: string; name: string }) => ctx.plans
      .filter(p => p.direction === 'in' && p.status !== 'cancelled' && p.amountCents > 0 && (p.clientId === c.id || (!p.clientId && porteNom(p.title, c.name))))
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    /* ce qu'il achète d'habitude, lu dans le titre de sa vente (seule source de la quantité : `FinancialPlan` n'a ni lignes ni quantité) ; sinon rien */
    const quoiDe = (titre: string, nom: string) => {
      const t = titre.trim();
      if (debutNom(t, nom)) return t.slice(nom.trim().length).replace(/^[\s,·:–-]+/, '').trim();
      if (finNom(t, nom)) return t.slice(0, t.length - nom.trim().length).replace(/[\s,·:–-]+$/, '').trim();
      return '';
    };
    return [
      ...probables.map<Puce>(p => ({ genre: 'vente-probable', id: `probable-${p.id}`, libelle: p.title, planId: p.id, ...(p.amountCents > 0 ? { centimes: p.amountCents } : {}), ...(p.clientId ? { clientId: p.clientId } : {}) })),
      ...clients.map<Puce>(c => {
        const h = habituelle(c);
        const quoi = h ? quoiDe(h.title, c.name) : '';
        /* le titre de la vente habituelle n'est repris que s'il commence par le nom du client (« Café du Pont, 1 fût ») ; sinon, le nom du client */
        return { genre: 'client', id: `client-${c.id}`, libelle: c.name, clientId: c.id, ...(h ? { centimes: h.amountCents } : {}), ...(quoi && h ? { quoi, titreHabituel: h.title.trim() } : {}) };
      }),
      ...montantsRecents(rangee, ctx)
    ];
  }
  const vus = new Map<string, Extract<Puce, { genre: 'nom' }>>();
  for (const c of recentes(rangee, ctx).filter(x => x.titre.trim())) {
    const cle = c.titre.trim().toLocaleLowerCase('fr');
    const deja = vus.get(cle);
    const montant = c.centimes !== undefined && c.centimes !== 0 ? { centimes: Math.abs(c.centimes), signe: c.centimes > 0 ? '+' as const : '-' as const } : null;
    /* le montant de la dernière fois qui en avait un : une occurrence plus récente sans montant ne l'efface pas (l'inconnu n'est pas 0) */
    if (!deja) vus.set(cle, { genre: 'nom', id: `nom-${cle}`, libelle: c.titre.trim(), ...(montant ?? {}) });
    else if (deja.centimes === undefined && montant) vus.set(cle, { ...deja, ...montant });
  }
  return [...[...vus.values()].slice(0, 12), ...(aUnMontant(rangee) ? montantsRecents(rangee, ctx) : [])];
}

/** Les choses de la rangée, la plus tardive d'abord (hors propositions). */
function recentes(rangee: Rangee, ctx: ContexteAjout): ChoseCalendrier[] {
  return ctx.choses.filter(c => c.rangee === rangee && !c.proposition).slice().sort((a, b) => b.debut.localeCompare(a.debut));
}

/** « +1 180 », « −600 » : un montant signé, lisible. */
export function libelleMontant(centimes: number, signe: '+' | '-'): string {
  return `${signe === '+' ? '+' : '−'}${francs(centimes)}`;
}

/** Les montants récents de la rangée, distincts, la plus tardive d'abord : des puces qui posent le montant sans clavier. Aucun historique : aucune puce. */
export function montantsRecents(rangee: Rangee, ctx: ContexteAjout): Puce[] {
  const vus = new Set<number>();
  const sortie: Puce[] = [];
  for (const c of recentes(rangee, ctx)) {
    if (c.centimes === undefined || c.centimes === 0 || vus.has(c.centimes)) continue;
    vus.add(c.centimes);
    const signe = c.centimes > 0 ? '+' as const : '-' as const;
    sortie.push({ genre: 'montant', id: `montant-${c.centimes}`, libelle: libelleMontant(Math.abs(c.centimes), signe), centimes: Math.abs(c.centimes), signe });
    if (sortie.length >= NB_MONTANTS_RECENTS) break;
  }
  return sortie;
}

const sansProbable = (b: BrouillonAjout): BrouillonAjout => { const { planProbableId: _p, ...reste } = b; void _p; return reste; };

/**
 * Le jour où se pose une chose de la semaine `lundi` : le lundi, sauf dans la semaine courante, où c'est aujourd'hui. Une chose posée « cette
 * semaine » n'est jamais déjà passée : elle ne crée ni retard ni « pas brassée » (CRITIQUE-3 n° 34, doute ⏰2 → ⏰4).
 */
export const jourPose = (lundi: string, aujourdhui: string): string => (lundi < aujourdhui && lundiDe(aujourdhui) === lundiDe(lundi) ? aujourdhui : lundi);

/** Toucher une puce règle le brouillon sans clavier. Retoucher la même puce de temps la lâche. Un nom ou un client avec un montant connu le pose aussi. */
export function appliquerPuce(b: BrouillonAjout, puce: Puce): BrouillonAjout {
  switch (puce.genre) {
    case 'recette': return { ...b, recetteId: puce.recetteId, titre: puce.libelle };
    case 'temps': return { ...b, tempsEnCuve: b.tempsEnCuve === puce.jours ? undefined : puce.jours };
    case 'client': return { ...sansProbable(b), clientId: puce.clientId, titre: puce.titreHabituel ?? puce.libelle, signe: '+', ...(puce.centimes ? { centimes: puce.centimes } : {}) };
    case 'vente-probable': return { ...b, titre: puce.libelle, signe: '+', planProbableId: puce.planId, ...(puce.centimes ? { centimes: puce.centimes } : {}), ...(puce.clientId ? { clientId: puce.clientId } : {}) };
    case 'nom': return { ...sansProbable(b), titre: puce.libelle, nomPose: false, ...(puce.centimes ? { centimes: puce.centimes, signe: puce.signe ?? b.signe } : {}) };
    case 'montant': return { ...b, centimes: puce.centimes, signe: puce.signe };
  }
}

/**
 * E45 : toucher une semaine. Le premier toucher fixe le début ; un toucher sur une semaine plus tard fixe la fin (les semaines entre deux se
 * remplissent) ; toucher le début, ou une semaine avant lui, repart d'une seule semaine. Ventes, Papiers et Brassins : une date seule.
 */
export function toucherSemaine(b: BrouillonAjout, lundi: string): BrouillonAjout {
  const r = toucherSemaineBrut(b, lundi);
  return b.jour && r.debut !== null && lundiDe(b.jour) !== r.debut ? { ...r, jour: ajouterJours(r.debut, rangDuJour(b.jour)), jourChoisi: undefined } : r;
}

/** Le rang du jour dans sa semaine : 0 le lundi, 6 le dimanche. */
export const rangDuJour = (iso: string): number => Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${lundiDe(iso)}T00:00:00Z`)) / 86_400_000);

/**
 * CAL-PASSE (21.11, n° 2) : le doigt choisit le JOUR d'une chose rouverte, dans la semaine choisie (petite rangée sous les semaines). Une chose à
 * date seule (vente, achat, papier, fête, travaux, idée) ; une fenêtre de plusieurs semaines n'a pas de jour. Le jour choisi s'écrit tel quel.
 */
export function choisirJour(b: BrouillonAjout, jour: string): BrouillonAjout {
  return { ...b, jour, jourChoisi: true, debut: lundiDe(jour), debutChoisi: true };
}

/** La feuille propose la rangée des jours : une chose rouverte sur un jour précis, qui n'est pas posée sur plusieurs semaines. */
export const peutChoisirJour = (b: BrouillonAjout): boolean => !!b.jour && !!b.debut && !b.fin && b.rangee !== 'brassins' && !b.joursActifs;

function toucherSemaineBrut(b: BrouillonAjout, lundi: string): BrouillonAjout {
  const l = lundiDe(lundi);
  /* CAL-PASSE : une chose rouverte (Modifier) : le premier toucher d'une AUTRE semaine la déplace, sa longueur gardée (ventes, papiers : une date) */
  if (b.rouvert) {
    const { rouvert: _r, ...reste } = b;
    void _r;
    if (b.debut !== null && l !== b.debut) {
      const longueur = b.fin && aUneFenetre(b.rangee) ? ecartSemaines(b.debut, b.fin) : 0;
      return { ...reste, debut: l, fin: longueur > 0 ? lundiDe(ajouterJours(l, longueur * 7)) : null, debutChoisi: true };
    }
    return toucherSemaineBrut(reste, lundi);
  }
  if (!aUneFenetre(b.rangee)) return { ...b, debut: l, fin: null, debutChoisi: true };
  if (!b.debutChoisi || b.debut === null || l <= b.debut) return { ...b, debut: l, fin: null, debutChoisi: true, joursActifs: undefined };
  return { ...b, fin: l };
}

/** Les jours actifs qui tiennent encore dans la fenêtre (7 par semaine) ; au-delà, ils partent : l'inconnu n'est pas 0. */
function joursQuiTiennent(b: BrouillonAjout): BrouillonAjout {
  if (b.joursActifs === undefined || b.joursActifs <= 7 * (nbSemaines(b) ?? 1)) return b;
  const { joursActifs: _j, ...reste } = b;
  void _j;
  return reste;
}

/**
 * D404 : un horizon (« 6 mois ») pose le début ; une fenêtre déjà étirée garde sa durée (elle glisse avec lui). Le jour d'une chose rouverte
 * part (la semaine change).
 */
export function poserHorizon(b: BrouillonAjout, lundi: string): BrouillonAjout {
  const { jour: _j, jourChoisi: _c, ...reste } = b;
  void _j; void _c;
  const debut = lundiDe(lundi);
  const longueur = b.debut && b.fin && aUneFenetre(b.rangee) ? ecartSemaines(b.debut, b.fin) : 0;
  return { ...reste, debut, fin: longueur > 0 ? lundiDe(ajouterJours(debut, longueur * 7)) : null, debutChoisi: true, parHorizon: true };
}

/** D404 : la fin étirée au geste de la frise B (lundi de la dernière semaine ; `null` : une seule semaine). Jamais avant le début. */
export function etirerFin(b: BrouillonAjout, fin: string | null): BrouillonAjout {
  if (!b.debut || !aUneFenetre(b.rangee)) return b;
  const f = fin && lundiDe(fin) > b.debut ? lundiDe(fin) : null;
  return joursQuiTiennent({ ...b, fin: f, debutChoisi: true });
}

/**
 * Capture-11 et capture-12 (21.11) : le début tiré au geste de la frise B, vers le passé aussi (« j'ai oublié de noter une vente »). Le début
 * et la fin changent ensemble (le corps glissé) ou le début seul ; une chose à une seule date n'a pas de fin. Une chose rouverte à date seule
 * garde le rang de son jour dans la nouvelle semaine (samedi reste samedi, comme `toucherSemaine`, CAL-PASSE n° 2) ; à plusieurs semaines,
 * le jour part.
 */
export function etirerPlage(b: BrouillonAjout, debut: string, fin: string | null): BrouillonAjout {
  if (!b.debut) return b;
  const { jour, jourChoisi: _c, ...reste } = b;
  void _c;
  const d = lundiDe(debut);
  const f = aUneFenetre(b.rangee) && fin && lundiDe(fin) > d ? lundiDe(fin) : null;
  const garde = jour && !f ? { jour: ajouterJours(d, rangDuJour(jour)) } : {};
  return joursQuiTiennent({ ...reste, ...garde, debut: d, fin: f, debutChoisi: true });
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

/** « prête le 21 déc. », en direct, pour un brassin avec un temps en cuve. Dans la semaine courante, compté depuis `aujourdhui` (le jour où il se pose). */
export function preteLe(b: BrouillonAjout, aujourdhui?: string): string | null {
  if (b.rangee !== 'brassins' || !b.debut || !b.tempsEnCuve) return null;
  return `prête le ${jourLisible(ajouterJours(aujourdhui ? jourPose(b.debut, aujourdhui) : b.debut, b.tempsEnCuve))}`;
}

/** La fenêtre écrite : du lundi du début au dimanche de la fin ; jours actifs seulement si une puce est touchée. Sans fin ni jours actifs : aucune fenêtre. */
export function fenetreDuBrouillon(b: BrouillonAjout): FenetreCalendrier | null {
  if (!b.debut || !aUneFenetre(b.rangee)) return null;
  /* un achat : ses jours actifs ne comptent pas (CAL-JALON-UN-JOUR) ; sans fin, il s'écrit à une date, comme la vente, et se pose en jalon */
  const jours = aDesJoursActifs(b.rangee) ? b.joursActifs : undefined;
  if (!b.fin && !jours) return null;
  return {
    du: lundiDe(b.debut), au: dimancheDe(b.fin ?? b.debut),
    ...(jours ? { joursActifs: jours } : {}), ...(b.miseDeCote && b.centimes ? { miseDeCote: true } : {})
  };
}

/** « Mettre de côté » ne se propose qu'à une chose avec une fenêtre et un montant (E03, C13). */
export const peutMettreDeCote = (b: BrouillonAjout): boolean => (b.rangee === 'activites' || b.rangee === 'achats' || b.rangee === 'travaux') && !!b.fin && !!b.centimes && b.signe === '-';

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
  | { cible: 'plan'; collection: 'financialPlans'; document: FinancialPlan; /** Le document existe déjà (une vente probable acceptée) : il est remplacé, et Annuler le remet tel qu'avant. */ remplace?: true };

export type Conversion = { ok: true; enregistrement: Enregistrement; resume: string } | { ok: false; raison: string; confirmer?: Confirmation };

/* CRITIQUE-6 n° 3 : un achat posé est un achat de matières, `brassage` (la clé que la rangée Achats lit et que le lot D préremplit), jamais « divers » */
const CATEGORIE: Partial<Record<Rangee, FinanceCategory>> = { ventes: 'recettes', achats: 'brassage', travaux: 'renovation', papiers: 'chargesFixes' };

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
    const jour = jourPose(debut, ctx.aujourdhui);
    const document: Batch = {
      id: (ctx.idBrassin ?? (() => idPar(ctx, 'LOT')))(), brewDate: '', plannedBrewDate: jour, name: recette.name, style: recette.style, volumeL: recette.volumeL,
      status: 'planifie', stockAccountingVersion: 1, recipeRef: recette.id, gravityLog: [],
      ...(b.tempsEnCuve ? { finPrevue: ajouterJours(jour, b.tempsEnCuve) } : {})
    };
    return { ok: true, enregistrement: { cible: 'batch', collection: 'batches', document, recetteId: recette.id }, resume: `${recette.name} · ${etiquetteS(debut)}${b.tempsEnCuve ? ` · prête le ${jourLisible(ajouterJours(jour, b.tempsEnCuve))}` : ''}` };
  }
  /* D401 (21.11) : des Travaux SANS montant sont une activité marquée `travaux` (rangée Travaux), jamais un plan à 0 CHF ; avec un montant,
     ils restent un plan financier (plus bas) */
  const travauxSansMontant = b.rangee === 'travaux' && !b.centimes;
  if (b.rangee === 'fetes' || b.rangee === 'activites' || travauxSansMontant) {
    const document: CreativeItem = {
      id: idPar(ctx, 'CR'), type: 'event', title: b.titre.trim(), status: 'todo', date: fenetre ? lundiDe(debut) : jourPose(lundiDe(debut), ctx.aujourdhui),
      ...(b.rangee === 'activites' ? { activite: true as const } : {}), ...(travauxSansMontant ? { travaux: true as const } : {}),
      ...(b.centimes ? (b.rangee === 'fetes' && b.signe === '+' ? { estimatedRevenue: b.centimes / 100 } : { estimatedCost: b.centimes / 100 }) : {}),
      ...(fenetre ? { fenetre } : {}), ...(b.liens ? { liens: b.liens } : {})
    };
    return { ok: true, enregistrement: { cible: 'creative', collection: 'creativeItems', document }, resume: resumeAjout(document.title, debut) };
  }
  if (!b.centimes || b.centimes <= 0) return { ok: false, raison: 'Indique un montant : un montant inconnu n’est pas 0.' };
  const du = fenetre?.du ?? jourPose(lundiDe(debut), ctx.aujourdhui);
  const date = fenetre?.miseDeCote ? fenetre.au : du;
  /*
   * CRITIQUE-3 n° 8 : « Ajouter » enregistre une vente CONFIRMÉE (elle compte dans Ventes et dans la caisse), une seule fois. Choisie par la puce
   * d'une vente probable, elle accepte ce brouillon (même id, `draft` → `active`) au lieu d'en créer un autre à côté.
   */
  const probable = b.rangee === 'ventes' && b.planProbableId ? ctx.plans.find(p => p.id === b.planProbableId && p.status === 'draft') : undefined;
  if (probable) {
    const document: FinancialPlan = {
      ...probable, title: b.titre.trim() || probable.title, date, amountCents: Math.round(b.centimes), direction: 'in', status: 'active',
      ...(b.clientId ? { clientId: b.clientId } : {}), ...(b.liens?.batchId ? { batchId: b.liens.batchId } : {}), ...(b.liens?.evenementId ? { evenementId: b.liens.evenementId } : {})
    };
    return { ok: true, enregistrement: { cible: 'plan', collection: 'financialPlans', document, remplace: true }, resume: `${document.title} · ${etiquetteS(document.date)} · vente confirmée` };
  }
  const document: FinancialPlan = {
    id: idPar(ctx, 'PLAN'), title: b.titre.trim(), date, amountCents: Math.round(b.centimes), direction: b.signe === '+' ? 'in' : 'out',
    category: CATEGORIE[b.rangee] ?? 'divers', source: 'manual', status: 'active', createdAt: ctx.maintenant ?? `${ctx.aujourdhui}T12:00:00.000Z`,
    ...(fenetre ? { fenetre } : {}), ...(b.clientId ? { clientId: b.clientId } : {}), ...(b.liens?.batchId ? { batchId: b.liens.batchId } : {}), ...(b.liens?.evenementId ? { evenementId: b.liens.evenementId } : {})
  };
  return { ok: true, enregistrement: { cible: 'plan', collection: 'financialPlans', document }, resume: resumeAjout(document.title, document.date) };
}

/** « Rénovation · S48 » ; un nom posé qui dit déjà sa semaine (« Travaux · S48 », G3) ne la répète pas. */
function resumeAjout(titre: string, jour: string): string {
  const s = etiquetteS(jour);
  return titre.endsWith(` · ${s}`) || titre.endsWith(` ${s}`) ? titre : `${titre} · ${s}`;
}

/**
 * G3 et NOM-OBLIGE (D396, P2) : le nom posé d'une chose neuve des rangées qui n'ont pas de puce obligatoire : « Travaux · S48 », « Activités · S48 »,
 * « Papiers · S48 », suivi de « · 2 » si ce nom existe déjà (`nomParDefaut`). Brassins (une recette), Ventes (un client), Fêtes et Achats (leur
 * nom est la chose) : `null`, rien n'est posé.
 */
export const RANGEES_NOM_POSE: readonly Rangee[] = ['travaux', 'activites', 'papiers'];
export function nomPose(rangee: Rangee, lundi: string | null, choses: ReadonlyArray<Pick<ChoseCalendrier, 'titre'>>): string | null {
  if (!lundi || !RANGEES_NOM_POSE.includes(rangee)) return null;
  return nomParDefaut({ genre: 'evenement', rangee: nomRangee(rangee), semaine: numeroSemaine(lundiDe(lundi)) }, choses.map(c => c.titre));
}

/** Le brouillon dont le nom est encore celui posé suit sa semaine (« Travaux · S48 » devient « Travaux · S61 ») ; un nom tapé ou choisi reste. */
export function avecNomPose(b: BrouillonAjout, choses: ReadonlyArray<Pick<ChoseCalendrier, 'titre'>>): BrouillonAjout {
  if (b.titre.trim() && !b.nomPose) return b;
  const nom = nomPose(b.rangee, b.debut, choses);
  if (!nom) { const { nomPose: _n, ...reste } = b; void _n; return b.nomPose ? { ...reste, titre: '' } : b; }
  return { ...b, titre: nom, nomPose: true };
}

/** L'écriture de création d'un enregistrement (« Ajouter ») ; son inverse, fourni par `ecritures.ts`, retire ce qui vient d'être posé (Annuler). */
export function ecritureDeAjout(e: Enregistrement): Ecriture {
  const document = e.document as unknown as { id: string } & Record<string, unknown>;
  return e.cible === 'batch' ? { op: 'creer', collection: e.collection, document, recetteId: e.recetteId } : { op: 'creer', collection: e.collection, document };
}

/**
 * E36, R48 (L1 a et b) : une idée datée, envoyée au carnet d'idées (Stocks › Matériel › Carnets). Le document est un `carnet` construit par
 * `carnetDepuisPhrase` : état Idée, la phrase en titre et gardée telle quelle, la semaine en `date` (son lundi), aucune valeur inventée, sans IA.
 * Un seul document (`Enregistrement` « creative ») : l'Annuler du calendrier le retire. Les `recipe-idea` datées déjà écrites ne migrent pas.
 */
export function enregistrementIdee(titre: string, jour: string, ctx: Pick<ContexteAjout, 'nouvelId'>): { ok: true; enregistrement: Enregistrement } | { ok: false; raison: string } {
  const texte = titre.trim();
  const date = isoDate(jour);
  if (!texte) return { ok: false, raison: 'Écris l’idée en quelques mots.' };
  if (!date) return { ok: false, raison: 'Choisis une semaine.' };
  const document: CreativeItem | null = carnetDepuisPhrase(texte, { id: (ctx.nouvelId ?? ((p: string) => `${p}-${globalThis.crypto.randomUUID()}`))('CARNET'), date: lundiDe(date) });
  if (!document) return { ok: false, raison: 'Écris l’idée en quelques mots.' };
  return { ok: true, enregistrement: { cible: 'creative', collection: 'creativeItems', document } };
}

/** Modifier (E30) : le brouillon rouvert écrit ses changements dans la source existante, sans en créer une autre. Un brassin se rouvre par sa fiche. */
export function versModification(b: BrouillonAjout, chose: ChoseCalendrier, aujourdhui?: string): { ok: true; ecritures: Ecriture[] } | { ok: false; raison: string } {
  const v = valider(b);
  if ('raison' in v) return v;
  const debut = b.debut as string;
  let fenetre = fenetreDuBrouillon(b);
  /* CAL-PASSE : la semaine de début (et de fin) n'a pas bougé : la fenêtre d'origine reste telle qu'elle était écrite, jamais réalignée sur des lundis ;
     et le JOUR d'une chose sans fenêtre est celui d'avant (un mercredi reste ce mercredi), sinon le lundi de la semaine choisie, ou aujourd'hui
     dans la semaine en cours (comme « Ajouter » : une chose posée cette semaine n'est jamais déjà passée) */
  const memeSemaine = !!chose.debut && lundiDe(chose.debut) === debut;
  if (fenetre && chose.fenetre && memeSemaine && (b.fin ?? debut) === lundiDe(chose.fenetre.au)) fenetre = { ...fenetre, du: chose.fenetre.du, au: chose.fenetre.au };
  /* CAL-PASSE (21.11, n° 2, « mardi 22 déc. → S51 : mardi 15, pas le 14 ») : le jour du brouillon (celui d'origine, ou celui d'une autre semaine au même rang, ou
     celui que le doigt a choisi) s'écrit tel quel ; dans la semaine en cours, un jour déduit (non choisi) déjà passé devient aujourd'hui */
  const jourBrouillon = b.jour && lundiDe(b.jour) === debut ? b.jour : undefined;
  const jour = jourBrouillon
    ? (!b.jourChoisi && !memeSemaine && aujourdhui && jourBrouillon < aujourdhui && lundiDe(aujourdhui) === debut ? aujourdhui : jourBrouillon)
    : memeSemaine ? chose.debut : aujourdhui ? jourPose(lundiDe(debut), aujourdhui) : lundiDe(debut);
  /* lot A du test en ligne (18.11, n° 2, D386) : le lien à une fête, changé dans Modifier, s'écrit ; défait, il part (undefined). Inchangé :
     rien n'est écrit. Un plan le porte en `evenementId`, une chose du carnet dans `liens`. */
  const evenementChange = (b.liens?.evenementId ?? undefined) !== (chose.liens?.evenementId ?? undefined);
  if (chose.source.genre === 'creative') {
    const liens = b.liens && Object.keys(b.liens).length ? b.liens : undefined;
    return { ok: true, ecritures: [{ op: 'patch', collection: 'creativeItems', id: chose.source.id, patch: {
      title: b.titre.trim(), date: fenetre?.du ?? jour, fenetre: fenetre ?? undefined, ...(evenementChange ? { liens } : {}),
      ...(chose.rangee === 'fetes'
        ? (b.signe === '+' ? { estimatedRevenue: b.centimes ? b.centimes / 100 : undefined, estimatedCost: undefined } : { estimatedCost: b.centimes ? b.centimes / 100 : undefined, estimatedRevenue: undefined })
        : { estimatedCost: b.centimes ? b.centimes / 100 : undefined })
    } }] };
  }
  if (chose.source.genre === 'plan' && chose.source.origine === 'manual') {
    if (!b.centimes || b.centimes <= 0) return { ok: false, raison: 'Indique un montant : un montant inconnu n’est pas 0.' };
    return { ok: true, ecritures: [{ op: 'patch', collection: 'financialPlans', id: chose.source.id, patch: {
      title: b.titre.trim(), date: fenetre?.miseDeCote ? fenetre.au : fenetre?.du ?? jour, amountCents: Math.round(b.centimes), direction: b.signe === '+' ? 'in' : 'out', fenetre: fenetre ?? undefined,
      ...(evenementChange ? { evenementId: b.liens?.evenementId } : {})
    } }] };
  }
  return { ok: false, raison: 'Cette chose se modifie dans sa source : ouvre-la depuis son détail.' };
}
