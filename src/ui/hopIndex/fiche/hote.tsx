// L'hôte de la fiche d'un houblon (T13, #173) : ce que la fiche demande à qui la monte. Un seul code d'écran (g1 et la matrice de
// flb5b, ses choix), deux hôtes : la maquette (son état en mémoire et sa pile : prototypes/houblons-v4/parcours/src/integration/
// hoteFiche.tsx) et l'app (le brouillon du wizard, la pile des outils : ./FicheApp.tsx). Elle ne lit rien d'autre de son
// environnement ; le moteur (parcours/adaptateur.ts) est commun.
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { lireBiere, type BiereLue } from '../parcours/adaptateur';
import type { RecetteParcours } from '../parcours/types';
import type { Visee } from '../parcours/visee';

/** Les écrans que la fiche ouvre depuis son pied (routes de la maquette ; l'app les traduit en couches de sa pile). */
export type RouteFiche = { ecran: 'comparer'; houblons: string[] } | { ecran: 'substituer'; houblon: string };

export interface HoteFiche {
  /** La recette ouverte dessous (le brouillon). */
  recette: RecetteParcours;
  /** La visée posée dans Ma bière ({} : la demande dégustée vaut, parcours/visee.ts). */
  visee: Visee;
  /** Les houblons retenus pour la comparaison, et la bascule d'un houblon. */
  aComparer: string[];
  basculerComparaison: (hopKey: string) => void;
  /** Aller vers Comparer ou Substituer (pousse une entrée d'historique ; l'app empile la couche). */
  aller: (r: RouteFiche) => void;
}

const Ctx = createContext<HoteFiche | null>(null);

export function HoteFicheProvider({ valeur, children }: { valeur: HoteFiche; children: ReactNode }) {
  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function useHoteFiche(): HoteFiche {
  const h = useContext(Ctx);
  if (!h) throw new Error('Fiche hors de HoteFicheProvider');
  return h;
}

// Les noms que l'écran employait dans la maquette, gardés pour que son code ne change pas.
export const useRecette = (): RecetteParcours => useHoteFiche().recette;
export const useVisee = (): Visee => useHoteFiche().visee;
export const useComparaison = (): string[] => useHoteFiche().aComparer;
export function useGestes() {
  const { basculerComparaison } = useHoteFiche();
  return useMemo(() => ({ basculerComparaison }), [basculerComparaison]);
}
export function useNavigation() {
  const { aller } = useHoteFiche();
  return useMemo(() => ({ aller }), [aller]);
}
export function useBiere(recette?: RecetteParcours): BiereLue {
  const r = useRecette();
  const cible = recette ?? r;
  return useMemo(() => lireBiere(cible), [cible]);
}
