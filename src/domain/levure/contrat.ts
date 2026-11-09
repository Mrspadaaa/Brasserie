/**
 * Contrat du port de l'étape Levure (mission 2026-11-09-levure-port). Les quatre vues choisies par le brasseur le 09.11
 * (l5b étape, c6b Chercher, s5a Comparer, s7a Suggérer) lisent UNE seule liste d'axes, tirée des champs de la fiche
 * levure : un filtre dans Chercher, une rangée dans Comparer, un − / + dans Suggérer, une jauge dans l'étape
 * (savoir/AUDIT-FILTRES.md ; DEFAUTS LV-1 : « pas assez générique DU TOUT »).
 *
 * Ce fichier fixe les types et les signatures. La voie d1 les implémente dans `src/domain/levure/` ; les voies u1 et u2
 * les appellent sans recopier une règle. Un changement de signature passe par le pilote.
 */
import type { YeastReference } from '../yeastReferences';

/** Les trois groupes, dans l'ordre où le brasseur en parle. */
export type GroupeAxe = 'aromes' | 'corps' | 'conduite';
export type IdAxe =
  | 'esters' | 'phenols' | 'thiols' | 'terpenes'          // Arômes
  | 'attenuation' | 'clarte' | 'tolerance' | 'rondeur'    // Corps (clarté = floculation)
  | 'temperature' | 'vitesse' | 'soufre' | 'nutriments';  // Conduite
export interface Axe { id: IdAxe; groupe: GroupeAxe; libelle: string; unite?: '%' | '°C' | '% vol' | 'g/L' }

/** Une source affichable : « Fermentis · fiche », « Samia 2026 ». */
export interface SourceCourte { libelle: string; url?: string }
export type Niveau = 'faible' | 'moyen' | 'eleve';
/** La valeur d'un axe pour une levure. `null` = non documenté (« ⌕ chercher », recherche IA au toucher). */
export interface ValeurAxe {
  niveau?: Niveau;
  plage?: { min: number; max: number };
  /** Descripteurs lus (« banane », « girofle », « abricot · tropical »), en français. */
  mots?: string[];
  /** Déduit d'une recherche de mots ou d'un descripteur, pas d'un niveau publié : la vue écrit « estimé ». */
  estime?: boolean;
  source?: SourceCourte;
}

/** Où l'acheter, du plus proche au plus rare (c4, D du 09.11 : CH · FR · DE d'abord). */
export type RangDisponibilite = 'ici' | 'europe' | 'rare';
export interface Disponibilite { rang: RangDisponibilite; pays?: Array<'CH' | 'FR' | 'DE'>; offres: number; prixMin?: { montant: number; devise: 'CHF' | 'EUR' };
  /** L'état du stock au dernier relevé des offres (M6) : « épuisée au relevé du 27.09 », jamais une date de rupture (le relevé ne la donne pas). */
  stock?: { statut: 'en-stock' | 'epuise' | 'inconnu'; releveLe: string; note?: string } }

/** Les 18 filtres de Chercher (premier rang 11, « Plus de filtres » 7). */
export type IdFiltre =
  | 'boisson' | 'famille' | 'style' | 'temperature' | 'attenuation' | 'tolerance' | 'effets' | 'clarte' | 'forme' | 'disponibilite' | 'stock'
  | 'sansSta1' | 'labo' | 'vitesse' | 'rondeur' | 'soufre' | 'nutriments' | 'sansAlcool';
export interface DefFiltre { id: IdFiltre; libelle: string; rang: 'premier' | 'plus'; genre: 'choix' | 'plage' | 'bascule' }
export type EtatFiltres = Partial<Record<IdFiltre, string[] | { min: number; max: number } | boolean>>;
/** Par filtre : le compte de chaque option (comptée en excluant ce seul filtre, facettes disjonctives) et les fiches sans la donnée. */
export interface ComptesFiltre { options: Array<{ valeur: string; libelle: string; n: number }>; nonDocumentees: number }

export interface ResultatRecherche {
  liste: YeastReference[];
  total: number;
  comptes: Partial<Record<IdFiltre, ComptesFiltre>>;
  /** « bière · repères 19 °C · 7 % · proche de 1056 · 1 339 » : la ligne de résumé de c6b. */
  resume: string;
}

/** Repères tirés de la recette : posés en repère, JAMAIS en filtre imposé (règle du pilote sur c5b). */
export interface ReperesRecette { temperatureC?: number; abvVise?: number; styleId?: string; ogVisee?: number;
  /** Volume du lot (L), pour la ligne Dose de Comparer (09.11, demande de u2). */
  volumeL?: number }

/** Suggérer (s7a) : un ou deux axes choisis, chacun vers le bas ou le haut, depuis la levure de la recette. */
export interface ChoixAxe { axe: IdAxe; sens: -1 | 1 }
export interface Suggestion {
  levure: YeastReference;
  disponibilite: Disponibilite;
  /** L'écart sur chaque axe choisi, signé, dans l'unité de l'axe ou en crans de niveau. */
  ecarts: Array<{ axe: IdAxe; ecart: number; texte: string }>;
  raison: string;
  source?: SourceCourte;
  /** Le levier de conduite quand une source le documente (« °C : plus chaud », « empâtage → Malts/sucres »). */
  levier?: string;
  /** Le même levier, structuré : la vue lit l'axe et la plage ici, plus dans la phrase de preuve (S2). `texte` = `levier`. */
  levierDetail?: LevierDetail;
}
/** Un levier de conduite : ce qu'on fait, sur quel axe, dans quelle plage la preuve vaut, d'où cela vient. */
export interface LevierDetail { texte: string; axe?: 'temperature'; plage?: { min: number; max: number }; source?: SourceCourte }

export interface ApiLevure {
  AXES: readonly Axe[];
  FILTRES: readonly DefFiltre[];
  valeurAxe(levure: YeastReference, axe: IdAxe): ValeurAxe | null;
  disponibilite(levure: YeastReference): Disponibilite;
  /** Texte libre (nom, code, fabricant, arôme), puis filtres ; ordre c4 : la plus proche de la levure tapée d'abord, vendues ici devant. */
  chercher(requete: string, filtres: EtatFiltres, reperes?: ReperesRecette): ResultatRecherche;
  /** Distance de Gower (données mêlées, valeurs manquantes ignorées) entre deux levures sur les axes connus des deux. */
  proximite(a: YeastReference, b: YeastReference): number;
  /** Pour chaque axe : combien de levures sont en dessous (−) et au dessus (+) de la base, et combien n'en disent rien. */
  comptesAxes(base: YeastReference): Record<IdAxe, { moins: number; plus: number; sansDonnee: number; estime: boolean }>;
  suggerer(base: YeastReference, choix: ChoixAxe[], limite?: number): Suggestion[];
  /** La fiche documente-t-elle ce filtre ? (le « ⌕ » d'une ligne de Chercher ; 09.11, demande de u2). */
  documente(levure: YeastReference, filtre: IdFiltre): boolean;
  /** Une levure du catalogue par son id (colonnes de Comparer). */
  trouver(id: string): YeastReference | undefined;
}
