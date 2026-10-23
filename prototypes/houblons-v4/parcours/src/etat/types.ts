// Types de l'état du parcours. La recette EST le type Recipe du moteur v4 ; un ajout est un Addition du moteur
// complété de ce que le parcours règle librement (minutes d'ébullition par 5′, jours de contact du dry hop).
import type { Addition, MomentId, Recipe } from '../../../src/engine';

/** Un ajout de houblon. `moment` reste l'identifiant du moteur ; pour l'ébullition, `minutes` fait foi
 * (pas de 5′, de la durée d'ébullition à 0) et `moment` n'en est que la classe la plus proche. Pour un dry
 * hop, `day` (moteur) est le jour de début et `jours` la durée de contact. */
export interface AjoutParcours extends Addition {
  minutes?: number;
  jours?: number;
}
export interface RecetteParcours extends Recipe {
  additions: AjoutParcours[];
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
  | { type: 'recommencer' }
  | { type: 'etat/poser'; etat: EtatParcours };

export type { MomentId };
