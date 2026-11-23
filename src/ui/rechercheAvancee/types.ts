/**
 * Le contrat d'une recherche avancée (forme c6b, choisie le 09.11 pour la levure ; « Faire la même chose que levure pour la
 * recherche pour les houblons », 09.11). Un catalogue (levures, houblons) fournit ses fiches, ses filtres, ses comptes, ses
 * rayons de disponibilité, ses pistes et les pièces de sa ligne ; la vue `RechercheAvancee` ne connaît aucun catalogue.
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ComptesFacette } from '../../domain/rechercheAvancee/facettes';

export type Plage = { min: number; max: number };
/** Ce que le brasseur a posé, par filtre : des valeurs, une plage, une bascule. */
export type EtatFiltresRA = Partial<Record<string, string[] | Plage | boolean>>;

export interface DefFiltreRA {
  id: string;
  libelle: string;
  /** Le libellé court de l'index et des puces (« Tolérance à l'alcool » → « Tolérance »). */
  court?: string;
  rang: 'premier' | 'plus';
  genre: 'choix' | 'plage' | 'bascule';
  /** Montré dans la rangée de puces sous le résumé. */
  enPuce?: boolean;
  /** L'accord de « non documentée » avec le libellé (« non documenté » pour Rôle, « non documentés » pour Arômes) ; défaut : féminin singulier. */
  nonDoc?: 'non documenté' | 'non documentés' | 'non documentée' | 'non documentées';
  /** Champ non normalisé : l'index écrit « estimé » au lieu du nombre de non documentées. */
  estime?: boolean;
  /** Unité des bornes d'une plage (« % vol », « °C »). */
  unite?: string;
  /** Repère de la recette sur ce filtre (○ dans l'index, trait sur l'histogramme, bascule « ne garder que »). */
  repere?: number;
  /** La bascule du repère : « ≥ repère » (tolérance) ou « ce qui couvre le repère » (température). */
  repereGarde?: 'min' | 'couvre';
  /** Le filtre ne peut pas servir ici (le stock non relié) : la raison, dite dans le panneau ; « — » dans l'index. */
  indisponible?: string;
  /** Toujours posé (la boisson de la levure, « bière » par défaut) : point noir dans l'index, hors du compte des filtres posés. */
  deBase?: boolean;
}

export interface ResultatRA<T> {
  liste: T[];
  total: number;
  comptes: Partial<Record<string, ComptesFacette>>;
  /** « bière · repères 19 °C · 7 % · proche de 1056 · 1 339 » : le premier mot nomme la liste, le dernier est le compte. */
  resume: string;
  /** La fiche tapée (« 1056 ») : un repère, hors de `liste`, montrée en carte. */
  tapee?: T;
}

/** Un rayon de disponibilité, du plus proche au plus lointain. */
export interface RayonRA {
  id: string;
  /** Le titre long (« Vendue CH · FR · DE ») ; `court` à 390 px (« Ici · CH FR DE »). */
  titre: string;
  court: string;
  icone: LucideIcon;
  /** Combien de lignes montrées avant « + n … ». */
  pas: number;
  /** « vendues ici », « rares » : le bouton « + n … » et le « dont n … ». */
  reste: string;
  /** Le mot de la légende sous la barre de répartition (« vendue ici », « Europe »). */
  legende: string;
  /** La teinte du rayon (titre, barre de répartition). */
  teinte: 'vert' | 'neutre' | 'violet';
}

/** Une piste de la ligne (plage sur une échelle fixe), et son en-tête « lo · repère · hi ». */
export interface PisteRA<T> {
  id: string;
  lo: number;
  hi: number;
  /** Au milieu de l'en-tête quand il n'y a pas de repère. */
  unite: string;
  repere?: number;
  /** La teinte de la bande : `chaud` (bleu → rouge, température), `vert`, `neutre`. */
  teinte: 'chaud' | 'vert' | 'neutre';
  plage(t: T): Plage | undefined;
}

export interface CatalogueRA<T> {
  /** `data-vue` de la vue. */
  vue: string;
  libelleChamp: string;
  aucun: string;
  filtres: readonly DefFiltreRA[];
  idDe(t: T): string;
  /** Le nom tel qu'on l'écrit sur la ligne, en entier. */
  nomLigne(t: T): string;
  /** Les attributs de la ligne (data-levure, data-houblon) : tests et contrôles. */
  attrsLigne?(t: T): Record<string, string>;
  chercher(requete: string, filtres: EtatFiltresRA): ResultatRA<T>;
  rayons: readonly RayonRA[];
  rayonDe(t: T): string;
  /** Le rayon où une fiche qui ne documente pas le filtre le plus muet reste visible, en pâle (« ⌕ STA1 ? »). */
  rayonVerifier?: string;
  pistes: readonly PisteRA<T>[];
  tris: ReadonlyArray<readonly [string, string]>;
  cleTri(t: T, tri: string): number | undefined;
  triDecroissant?: readonly string[];
  /** La fiche documente-t-elle ce filtre ? */
  documente(t: T, filtre: string): boolean;
  chercherDonnee?(t: T, filtre: string): void;
  /** Les échelles de l'histogramme : les fiches de ce rayon posées sur la même échelle que le repère (« vendues ici · fiche »). */
  echelle?: { rayon: string; titre: ReactNode; plage(t: T, filtre: string): Plage | undefined; nomCourt(t: T): string };

  /** Après le nom, sur la ligne du nom : α, rôle, icône du stock ; fabricant et pays pour une levure. */
  ApresNom(p: { item: T; pale: boolean }): ReactNode;
  /** Sous le nom, hors du bouton : « épuisée au relevé du 27.09 ». */
  SousNom?(p: { item: T }): ReactNode;
  /** La deuxième ligne : arômes en couleur, « ⌕ … ? ». `poses` : les bascules posées (« sans STA1 · fiche »). */
  Pastilles(p: { item: T; ref?: T; poses: readonly DefFiltreRA[]; /** Ce que le brasseur a posé : une pastille de la famille filtrée se montre toujours sur la ligne (D167). */ filtres?: EtatFiltresRA }): ReactNode;
  /** La ligne ouverte : « Choisir pour ma recette · + Comparer », « Ajouter à ma recette · Fiche ». */
  Actions(p: { item: T }): ReactNode;
  /** « ⌕ STA1 ? » : la donnée qui manque, un toucher la cherche. */
  NonDoc(p: { item: T; filtre: string; texte: string }): ReactNode;
  /** La carte de la fiche tapée ; `basculer` l'ouvre et la ferme (toute la carte au toucher). */
  Carte?(p: { item: T; ouverte: boolean; basculer: () => void }): ReactNode;
}
