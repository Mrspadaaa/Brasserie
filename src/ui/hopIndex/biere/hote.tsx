// L'hôte de l'onglet Ma bière (p6, #174) : ce que l'écran demande à qui le monte. Même principe que suggerer/hote.tsx : un seul
// code d'écran (./index.tsx, repris de prototypes/houblons-v4/parcours/src/ecrans/biere/index.tsx, base v4.10 : son choix), un
// hôte. Ici l'hôte de l'app (./EcranApp.tsx) : le brouillon du wizard, la visée posée (parcours/visee.ts), les couches de la pile.
// L'écran ne lit rien d'autre de son environnement ; le moteur (parcours/adaptateur.ts, parcours/useCalcul.ts) est commun.
import { createContext, useContext, useMemo, type ComponentType, type ReactNode } from 'react';
import type { FamilyId } from '../../../domain/hopIndex/v4';
import { lireBiere, type BiereLue } from '../parcours/adaptateur';
import type { RecetteParcours } from '../parcours/types';
import type { Visee } from '../parcours/visee';

/** Les écrans que Ma bière ouvre (les deux autres onglets ; l'app les traduit en couches de sa pile). */
export type RouteBiere = { ecran: 'suggerer' } | { ecran: 'comparer'; houblons: string[] };

export interface CadreBiereProps {
  /** L'attribut `data-element` de la tête des onglets (inventaire : biere-onglets). */
  elementTete?: string;
  children: ReactNode;
}

export interface HoteBiere {
  /** La recette ouverte dessous (le brouillon). */
  recette: RecetteParcours;
  /** La visée posée par le brasseur (palier par famille, 0 à 3 ; 0 = bannie). */
  visee: Visee;
  /** Pose ou retire (null) la visée d'une famille. */
  fixerVisee: (famille: FamilyId, niveau: number | null) => void;
  /** Les houblons retenus pour « Comparer (n) ». */
  aComparer: string[];
  /** Ouvrir l'un des deux autres onglets. */
  aller: (r: RouteBiere) => void;
  /** Le cadre de l'écran (en-tête à onglets, croix). */
  Cadre: ComponentType<CadreBiereProps>;
}

const Ctx = createContext<HoteBiere | null>(null);

export function HoteBiereProvider({ valeur, children }: { valeur: HoteBiere; children: ReactNode }) {
  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function useHoteBiere(): HoteBiere {
  const h = useContext(Ctx);
  if (!h) throw new Error('Ma bière hors de HoteBiereProvider');
  return h;
}

export const useRecette = (): RecetteParcours => useHoteBiere().recette;
export const useVisee = (): Visee => useHoteBiere().visee;
export const useGestes = () => { const h = useHoteBiere(); return { fixerVisee: h.fixerVisee }; };
export const useComparaison = (): string[] => useHoteBiere().aComparer;
export const useNavigation = () => ({ aller: useHoteBiere().aller });
export function useBiere(recette?: RecetteParcours): BiereLue {
  const r = useRecette();
  const cible = recette ?? r;
  return useMemo(() => lireBiere(cible), [cible]);
}
export function CadreBiere(p: CadreBiereProps) {
  const { Cadre } = useHoteBiere();
  return <Cadre {...p} />;
}
