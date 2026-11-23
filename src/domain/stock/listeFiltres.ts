// Filtres, groupes et comptes de la liste du Stock (maquette choisie sy/fA : pastilles d'état, rayon touché, bascule Recompter).
// Règles pures, sans lecture de stockage : l'écran passe les articles, leurs états (liste.ts) et les comptages.
import type { StockItem } from '../../types';
import type { FiltreDynamique, EnsemblesFiltres } from './filtresDynamiques';
import { familleRecompter, FAMILLES_RECOMPTER, type EtatLigne, type FamilleRecompter, type InfoLigne, type MouvementComptage, derniersComptages } from './liste';

/** Un seul filtre à la fois, comme la maquette : un état (pastille), une famille (nom d'un rayon ou tuile de Recompter), ou les épinglés. */
export type FiltreListe = EtatLigne | FamilleRecompter | 'epingles' | FiltreDynamique;

/** Le mot du filtre dans la ligne « Filtre Houblons : 19 articles ». */
export const MOT_FILTRE: Record<FiltreListe, string> = {
  manque: 'manque', bas: 'bas', epuise: 'épuisés', compter: 'à compter', ddm: 'DDM proche', epingles: 'épinglés', brassin: 'pour le prochain brassin', recents: 'récents',
  Malts: 'Malts', Houblons: 'Houblons', Levures: 'Levures', Additifs: 'Sels et additifs', Emballage: 'Emballage', Nettoyage: 'Nettoyage et gaz',
};

/** Le titre de chaque groupe de la liste : les six familles de la maquette, sucres compris dans Malts (comme le mur). */
export const LIBELLE_FAMILLE: Record<FamilleRecompter, string> = {
  Malts: 'Malts', Houblons: 'Houblons', Levures: 'Levures', Additifs: 'Sels et additifs', Emballage: 'Emballage', Nettoyage: 'Nettoyage et gaz',
};
export const GROUPES_LISTE: string[] = FAMILLES_RECOMPTER.map((f) => LIBELLE_FAMILLE[f]);
export const groupeListe = (i: StockItem): string => LIBELLE_FAMILLE[familleRecompter(i)];

const FAMILLES = new Set<string>(FAMILLES_RECOMPTER);
export const estFamille = (f: unknown): f is FamilleRecompter => typeof f === 'string' && FAMILLES.has(f);

export interface CriteresListe {
  filtre: FiltreListe | null;
  /** Références retenues par la recherche (2 lettres au moins) ; null : pas de recherche. */
  recherche: ReadonlySet<string> | null;
  /** Les articles des filtres « récents » et « brassin » (calculés hors de ce module, voir filtresDynamiques.ts). */
  ensembles?: EnsemblesFiltres;
}

/** Un article passe-t-il le filtre et la recherche ? Le même test pour l'étagère et pour Recompter (comptes égaux). */
export function retenu(item: StockItem, infos: ReadonlyMap<string, InfoLigne>, c: CriteresListe): boolean {
  if (c.recherche && !c.recherche.has(item.ref)) return false;
  const f = c.filtre;
  if (!f) return true;
  if (f === 'epingles') return !!item.favorite;
  if (f === 'recents' || f === 'brassin') return !!c.ensembles?.[f].has(item.ref);
  if (estFamille(f)) return familleRecompter(item) === f;
  return !!infos.get(item.ref)?.etats.includes(f);
}

export const lignesRetenues = (items: ReadonlyArray<StockItem>, infos: ReadonlyMap<string, InfoLigne>, c: CriteresListe): StockItem[] =>
  items.filter((i) => retenu(i, infos, c));

/** Le nombre d'articles de chaque famille : celui du mur (Malts, Houblons, Levures) et celui de la liste sont le même nombre. */
export function comptesFamilles(items: ReadonlyArray<StockItem>): Record<FamilleRecompter, number> {
  const r = { Malts: 0, Houblons: 0, Levures: 0, Additifs: 0, Emballage: 0, Nettoyage: 0 } as Record<FamilleRecompter, number>;
  for (const i of items) r[familleRecompter(i)]++;
  return r;
}

export interface TexteFiltre { filtre: string | null; recherche: string | null; n: number }
/** « Filtre manque et recherche « cit » : 4 articles » : les morceaux de la phrase, pour mettre le filtre en gras. */
export function texteFiltre(c: { filtre: FiltreListe | null; q: string }, n: number): TexteFiltre | null {
  const q = c.q.trim();
  if (!c.filtre && q.length < 2) return null;
  return { filtre: c.filtre ? MOT_FILTRE[c.filtre] : null, recherche: q.length >= 2 ? q : null, n };
}
export const motArticles = (n: number): string => `${n} article${n > 1 ? 's' : ''}`;

export interface ComptesRayon { compte: number; total: number; dernier: string | null }
/** « 6/15 comptés · 02.11 » : les articles comptés (un mouvement d'inventaire de motif comptage) de chaque famille, et le dernier jour. */
export function comptesRecompter(items: ReadonlyArray<StockItem>, mouvements: ReadonlyArray<MouvementComptage>): Record<FamilleRecompter, ComptesRayon> {
  const jours = derniersComptages(mouvements);
  const r = {} as Record<FamilleRecompter, ComptesRayon>;
  for (const f of FAMILLES_RECOMPTER) r[f] = { compte: 0, total: 0, dernier: null };
  for (const i of items) {
    const f = familleRecompter(i); r[f].total++;
    const j = jours.get(i.ref);
    if (j) { r[f].compte++; if (!r[f].dernier || j > r[f].dernier!) r[f].dernier = j; }
  }
  return r;
}

/** L'ordre de Recompter : nom A → Z, les épuisés en fin de rayon (la ligne « épuisés · 1 » les sépare). */
export function trierRecompter(items: ReadonlyArray<StockItem>, infos: ReadonlyMap<string, InfoLigne>): StockItem[] {
  const ep = (i: StockItem) => (infos.get(i.ref)?.etats.includes('epuise') ? 1 : 0);
  return [...items].sort((a, b) => ep(a) - ep(b) || a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
}

/** Lit une quantité saisie au clavier : virgule ou point décimal, jamais « 0 » pour un champ vide ou illisible (null). */
export function lireQuantite(texte: string): number | null {
  const t = texte.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export interface LigneComptee<T> { item: T; quantite: number }
export interface BilanRayon<T> {
  /** Les quantités tapées (l'écart, ou la même quantité confirmée). */
  tapes: LigneComptee<T>[];
  /** Champ vide et quantité connue : compté « comme prévu », à la quantité en stock. */
  prevus: LigneComptee<T>[];
  /** Quantité inconnue ou saisie illisible : reste « non compté », jamais 0. */
  nonComptes: T[];
  /** Parmi les tapées, celles qui changent le stock. */
  ecarts: number;
}
/**
 * F2 (D396, comptage tournant par rayon) : ce qu'un toucher sur « le reste du rayon » enregistre. On ne tape que ce qui a bougé ;
 * le reste du rayon est confirmé à sa quantité connue ; ce qui n'a pas de quantité connue n'est jamais compté à 0.
 */
export function bilanRayon<T extends Pick<StockItem, 'ref' | 'currentStock'>>(lignes: ReadonlyArray<T>, valeurs: Readonly<Record<string, string>>, connue: (i: T) => boolean): BilanRayon<T> {
  const r: BilanRayon<T> = { tapes: [], prevus: [], nonComptes: [], ecarts: 0 };
  for (const item of lignes) {
    const v = (valeurs[item.ref] ?? '').trim();
    const q = lireQuantite(v);
    if (q !== null) { r.tapes.push({ item, quantite: q }); if (q !== item.currentStock) r.ecarts++; }
    else if (v === '' && connue(item)) r.prevus.push({ item, quantite: item.currentStock });
    else r.nonComptes.push(item);
  }
  return r;
}
