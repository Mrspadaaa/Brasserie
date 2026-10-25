// L'hôte de l'étape Houblons (T12, #170) : ce que l'écran demande à qui le monte. Un seul code d'écran, deux hôtes :
// la maquette (son état en mémoire, sa pile et son hash : prototypes/houblons-v4/parcours/src/integration/hoteMaBiere.tsx)
// et l'app (le brouillon du wizard, ses écritures par applyHopV4Change, la pile des outils : EtapeHoublons.tsx).
// L'écran ne lit rien d'autre de son environnement ; le moteur (parcours/adaptateur.ts) est commun.
import { createContext, useContext, useMemo, type ComponentType, type ReactNode } from 'react';
import { lireBiere, type BiereLue } from '../parcours/adaptateur';
import type { AjoutParcours, Cible, Quand, RecetteParcours } from '../parcours/types';

/** Les écrans que l'étape ouvre (routes de la maquette ; l'app les traduit en couches de la pile). */
export type RouteEtape =
  | { ecran: 'ma-biere' }
  | { ecran: 'biere' }
  | { ecran: 'fiche'; houblon: string }
  | { ecran: 'suggerer' }
  | { ecran: 'substituer'; houblon: string }
  | { ecran: 'dryhopper'; ajout: string }
  | { ecran: 'levure'; ajout: string };

export interface GestesEtape {
  ajouter: (sur: Cible, ajout: AjoutParcours) => void;
  dose: (sur: Cible, ajoutId: string, grams: number) => void;
  retirer: (sur: Cible, ajoutId: string) => void;
  moment?: (sur: Cible, ajoutId: string, quand: Quand) => void;
}

export interface HoteEtape {
  /** La recette inscrite. */
  recette: RecetteParcours;
  /** L'écran du sommet (« ma-biere », « fiche »…) : l'étape garde ses repères tant qu'elle est à l'écran. */
  route: { ecran: string };
  /** Aller vers un écran (pousse une entrée d'historique). */
  aller: (r: RouteEtape) => void;
  /** Ouvrir un outil en préparant son brouillon. */
  ouvrir: (r: RouteEtape) => void;
  gestes: GestesEtape;
  /** Changer un ajout en place pendant un geste continu (le glisser du rail), l'ordre de la recette gardé. */
  modifierAjout: (id: string, f: (a: AjoutParcours, r: RecetteParcours) => AjoutParcours) => void;
  /** Les commandes de l'en-tête (maquette : thème et Recommencer ; app : aucune). */
  Actions?: ComponentType;
}

const Ctx = createContext<HoteEtape | null>(null);

export function HoteEtapeProvider({ valeur, children }: { valeur: HoteEtape; children: ReactNode }) {
  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function useHote(): HoteEtape {
  const h = useContext(Ctx);
  if (!h) throw new Error('Étape Houblons hors de HoteEtapeProvider');
  return h;
}

// Les noms que l'écran employait dans la maquette, gardés pour que son code ne change pas.
export const useRecette = (): RecetteParcours => useHote().recette;
export function useBiere(recette?: RecetteParcours): BiereLue {
  const r = useRecette();
  const cible = recette ?? r;
  return useMemo(() => lireBiere(cible), [cible]);
}
export const useGestes = (): GestesEtape => useHote().gestes;
export const useOuvrir = () => useHote().ouvrir;
export function useNavigation() {
  const h = useHote();
  return { route: h.route, aller: h.aller };
}
export function ActionsCoquille() {
  const A = useHote().Actions;
  return A ? <A /> : null;
}
