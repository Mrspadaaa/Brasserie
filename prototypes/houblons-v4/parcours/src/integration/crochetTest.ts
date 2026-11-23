// Le crochet de test `window.__parcours`, en UN seul module (voie p8, 23.10). Forme décrite dans ARCHITECTURE.md
// (« ## Crochet de test »). Lu par les contrôles du brasseur : outils/jouer-parcours.mjs, outils/parcours-complet.mjs,
// les jeu.mjs des écrans (verifier(p), mesurer(p) avec p = window.__parcours) et ecrans/suggerer/outils/instantane.mjs.
//
// Dans la maquette, il est toujours posé : ses pages construites sont jouées par ces contrôles. Dans l'app, il ne
// l'est qu'en développement (`import.meta.env.DEV`, serveur Vite et `?dev-local`) : la production ne l'embarque pas
// (le test est constant, le code mort est retiré par la construction). Au portage, supprimer MAQUETTE.
import { useEffect, type Dispatch } from 'react';
import * as moteur from '../moteur';
import { cransOf, getStyleScale, hopAlpha, hopRole } from '../../../../../src/domain/hopIndex/v4';
import type { Action, EtatParcours } from '../etat/types';

/** La maquette pose toujours le crochet. Dans l'app : `false`, et seul `import.meta.env.DEV` décide. */
const MAQUETTE = true;
export const CROCHET_TEST_ACTIF: boolean = import.meta.env.DEV || MAQUETTE;

/** Vue de l'état pour les vérifications des contrôles (jamais dans l'app en production). */
export interface VueParcours {
  /** L'état entier (recette inscrite, brouillon, visée, comparaison, compteur de gestes). */
  etat: EtatParcours;
  /** La route lue dans l'adresse (maquette : le hash, « #/comparer?h=… »). */
  route: string;
  /** Ma bière lue par le moteur (recette inscrite). */
  biere: () => moteur.BiereLue;
  /** Le brouillon de l'outil ouvert lu par le moteur, ou null. */
  brouillonLu: () => moteur.BiereLue | null;
  /** Journal des appels au moteur, médiane des vrais recalculs (cache manqué, L20), remise à zéro. */
  mesures: typeof moteur.mesures;
  medianeRecalcul: typeof moteur.medianeRecalcul;
  viderMesures: typeof moteur.viderMesures;
  /** Les actions de l'état, pour qu'un jeu.mjs pose un état sans passer par un autre écran (visée, comparaison…). */
  envoyer: Dispatch<Action>;
  /** L'adaptateur entier : un jeu.mjs compare ce que l'écran rend (data-crans, data-usage…) au moteur. */
  moteur: typeof moteur;
  /** Règles du moteur v4 utiles aux contrôles (crans du style à 0,6 près, D80 ; rôle, D90 ; α, D87). */
  regles: { cransOf: typeof cransOf; getStyleScale: typeof getStyleScale; hopRole: typeof hopRole; hopAlpha: typeof hopAlpha };
}
declare global { interface Window { __parcours?: VueParcours } }

/** Pose (ou repose, à chaque rendu) `window.__parcours` sur l'état courant. Sans effet si le crochet est inactif. */
export function useCrochetTest(etat: EtatParcours, dispatch: Dispatch<Action>): void {
  useEffect(() => {
    if (!CROCHET_TEST_ACTIF) return;
    window.__parcours = {
      etat, get route() { return location.hash; },
      biere: () => moteur.lireBiere(etat.recette),
      brouillonLu: () => (etat.brouillon ? moteur.lireBiere(etat.brouillon.recette) : null),
      mesures: moteur.mesures, medianeRecalcul: moteur.medianeRecalcul, viderMesures: moteur.viderMesures,
      moteur, regles: { cransOf, getStyleScale, hopRole, hopAlpha },
      envoyer: dispatch,
    };
  });
}
