// Types de l'état du parcours. La recette EST le type Recipe du moteur v4 ; un ajout est un Addition du moteur
// complété de ce que le parcours règle librement (minutes d'ébullition par 5′, jours de contact du dry hop).
import type { Addition, FamilyId, MomentId, Recipe } from '../../../../../src/domain/hopIndex/v4';
import type { Visee } from './visee';

/** Un ajout de houblon. `moment` reste l'identifiant du moteur ; pour l'ébullition, `minutes` fait foi
 * (pas de 5′, de la durée d'ébullition à 0) et `moment` n'en est que la classe la plus proche. Pour un dry
 * hop, `day` (moteur) est le jour de début et `jours` la durée de contact. */
export interface AjoutParcours extends Addition {
  /** Ébullition : minute d'ajout (fait foi). Whirlpool : durée de contact (minutes), venue de la recette de l'app. */
  minutes?: number;
  jours?: number;
  /** α du lot de la recette (HopIngredient.alpha), en % m/m : null = inconnu ; absent = l'α du stock ou de la plage
   * variétale (moteur/donnees.ts). Posé par la conversion de la recette de l'app ; effacé quand le houblon change. */
  alphaLot?: number | null;
  /** Whirlpool : température de contact (°C) de la recette de l'app ; absente = le préréglage du moteur (80 °C). */
  tempC?: number;
  /** Raison pour laquelle le moment de la recette de l'app est incomplet (durée de contact inconnue…) : l'IBU de
   * l'ajout est alors inconnu, jamais calculé sur une durée supposée. Effacée quand l'ajout est placé (placer). */
  momentInconnu?: string;
}
export interface RecetteParcours extends Recipe {
  additions: AjoutParcours[];
  /** Raison pour laquelle l'IBU à chaud est incalculable pour toute la recette (densité initiale inconnue), posée
   * par la conversion de la recette de l'app ; absente dans la maquette. */
  ibuInconnu?: string;
}

/** Où un ajout se place : la frise de Dryhopper en donne un par cran. */
export type Quand =
  | { type: 'premierMout' }
  | { type: 'ebullition'; minutes: number }
  | { type: 'whirlpool' }
  | { type: 'dryhop'; phase: 'actif' | 'apres'; jours: number };

export type Outil = 'dryhopper' | 'levure' | 'substituer';

/** Brouillon d'un outil : une copie de la recette, changée par l'outil. « Ajouter à ma bière » ou
 * « Remplacer » l'inscrit ; « ‹ » vers Ma bière l'abandonne, la recette reste intacte. */
export interface Brouillon {
  outil: Outil;
  /** L'ajout que l'outil travaille (dans brouillon.recette). */
  ajoutId: string;
  recette: RecetteParcours;
  /** Substituer : l'ajout d'origine et le houblon qu'il remplace. */
  remplace?: { ajoutId: string; hopKey: string };
}

export interface EtatParcours {
  recette: RecetteParcours;
  brouillon: Brouillon | null;
  /** Compteur des gestes qui ont changé la recette ou le brouillon (vérifications du script de parcours). */
  gestes: number;
  /** Houblons retenus pour la comparaison : le « + » de Suggérer (q2b), « Comparer (n) », l'onglet Comparer. */
  aComparer: string[];
  /** La visée par famille, comme sa base v4.10 (D108) : un palier sur l'échelle absolue 0 à 3 (0 bannie, 0,5 faible,
   * 1,5 moyen, 2,5 marqué) ; sans entrée, sans visée (la demande dégustée vaut alors : etat/visee.ts). Départ : aucune,
   * comme la base. Réglée sur l'onglet Ma bière ; lue par Suggérer en crans du style, et par la fiche (D32). */
  visee: Visee;
}

export type Cible = 'recette' | 'brouillon';
export type Action =
  | { type: 'ajouter'; sur: Cible; ajout: AjoutParcours }
  | { type: 'moment'; sur: Cible; ajoutId: string; quand: Quand }
  | { type: 'dose'; sur: Cible; ajoutId: string; grams: number }
  | { type: 'retirer'; sur: Cible; ajoutId: string }
  | { type: 'remplacer'; sur: Cible; ajoutId: string; hopKey: string }
  | { type: 'levure'; sur: Cible; yeastId: string }
  | { type: 'brouillon/ouvrir'; brouillon: Brouillon }
  | { type: 'brouillon/inscrire' }
  | { type: 'brouillon/abandonner' }
  | { type: 'comparaison/basculer'; hopKey: string }
  | { type: 'comparaison/fixer'; houblons: string[] }
  | { type: 'visee/fixer'; famille: FamilyId; valeur: number | null }
  | { type: 'recommencer' }
  | { type: 'etat/poser'; etat: EtatParcours };

export type { MomentId };
