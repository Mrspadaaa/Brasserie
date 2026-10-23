// Contexte de l'état du parcours et ses crochets. Un seul état de recette, partagé par tous les écrans.
// En mémoire (décision du pilote) ; la persistance de l'app est décrite dans ARCHITECTURE.md.
import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import * as moteur from '../moteur';
import { cransOf, getStyleScale, hopAlpha, hopRole } from '../../../src/engine';
import type { FamilyId } from '../../../src/engine';
import { reducteur } from './reducteur';
import type { Action, AjoutParcours, Brouillon, Cible, EtatParcours, Quand, RecetteParcours } from './types';

const Ctx = createContext<{ etat: EtatParcours; dispatch: Dispatch<Action> } | null>(null);

/** Vue de l'état pour les vérifications du script de parcours (maquette seulement, jamais dans l'app). */
export interface VueParcours {
  etat: EtatParcours;
  route: string;
  biere: () => moteur.BiereLue;
  brouillonLu: () => moteur.BiereLue | null;
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

export function EtatParcoursProvider({ initial, children }: { initial: EtatParcours; children: ReactNode }) {
  const [etat, dispatch] = useReducer(reducteur, initial);
  useEffect(() => {
    window.__parcours = {
      etat, get route() { return location.hash; },
      biere: () => moteur.lireBiere(etat.recette),
      brouillonLu: () => (etat.brouillon ? moteur.lireBiere(etat.brouillon.recette) : null),
      mesures: moteur.mesures, medianeRecalcul: moteur.medianeRecalcul, viderMesures: moteur.viderMesures,
      moteur, regles: { cransOf, getStyleScale, hopRole, hopAlpha },
      envoyer: dispatch,
    };
  });
  const valeur = useMemo(() => ({ etat, dispatch }), [etat]);
  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function useParcours() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useParcours hors de EtatParcoursProvider');
  return c;
}
/** La recette inscrite (Ma bière). */
export const useRecette = (): RecetteParcours => useParcours().etat.recette;
/** Le brouillon de l'outil ouvert, ou null. */
export const useBrouillon = (): Brouillon | null => useParcours().etat.brouillon;
/** La recette sur laquelle travaille un outil : le brouillon s'il y en a un, sinon la recette. */
export function useRecetteDeTravail(): { recette: RecetteParcours; sur: Cible } {
  const { etat } = useParcours();
  return etat.brouillon ? { recette: etat.brouillon.recette, sur: 'brouillon' } : { recette: etat.recette, sur: 'recette' };
}
/** La visée par famille (crans du style, ou « banni ») : réglée sur l'onglet Ma bière, lue par Suggérer (D32). */
export const useVisee = (): EtatParcours['visee'] => useParcours().etat.visee;
/** Les houblons retenus pour la comparaison. */
export const useComparaison = (): string[] => useParcours().etat.aComparer;
/** Ma bière lue par le moteur (recalculée à chaque changement de la recette). */
export function useBiere(recette?: RecetteParcours): moteur.BiereLue {
  const r = useRecette();
  const cible = recette ?? r;
  return useMemo(() => moteur.lireBiere(cible), [cible]);
}

/** Gestes nommés : chacun envoie une action. `sur` : la recette ou le brouillon de l'outil ouvert. */
export function useGestes() {
  const { dispatch } = useParcours();
  return useMemo(() => ({
    ajouter: (sur: Cible, ajout: AjoutParcours) => dispatch({ type: 'ajouter', sur, ajout }),
    moment: (sur: Cible, ajoutId: string, quand: Quand) => dispatch({ type: 'moment', sur, ajoutId, quand }),
    dose: (sur: Cible, ajoutId: string, grams: number) => dispatch({ type: 'dose', sur, ajoutId, grams }),
    retirer: (sur: Cible, ajoutId: string) => dispatch({ type: 'retirer', sur, ajoutId }),
    remplacer: (sur: Cible, ajoutId: string, hopKey: string) => dispatch({ type: 'remplacer', sur, ajoutId, hopKey }),
    levure: (sur: Cible, yeastId: string) => dispatch({ type: 'levure', sur, yeastId }),
    ouvrirBrouillon: (brouillon: Brouillon) => dispatch({ type: 'brouillon/ouvrir', brouillon }),
    inscrire: () => dispatch({ type: 'brouillon/inscrire' }),
    abandonner: () => dispatch({ type: 'brouillon/abandonner' }),
    basculerComparaison: (hopKey: string) => dispatch({ type: 'comparaison/basculer', hopKey }),
    fixerComparaison: (houblons: string[]) => dispatch({ type: 'comparaison/fixer', houblons }),
    fixerVisee: (famille: FamilyId, valeur: number | 'banni' | null) => dispatch({ type: 'visee/fixer', famille, valeur }),
    recommencer: () => dispatch({ type: 'recommencer' }),
  }), [dispatch]);
}
