// L'hôte de Suggérer (T13, #173) : ce que l'écran demande à qui le monte. Un seul code d'écran (q2b, base v4.10 : son choix),
// deux hôtes : la maquette (son état en mémoire, sa coquille et son hash : prototypes/houblons-v4/parcours/src/ecrans/suggerer/
// index.tsx) et l'app (le brouillon du wizard, la porte applyHopV4Change, la pile des outils : ./EcranApp.tsx). L'écran ne lit
// rien d'autre de son environnement ; le moteur (parcours/adaptateur.ts, parcours/useCalcul.ts) est commun.
import { createContext, useContext, useMemo, type ComponentType, type ReactNode } from 'react';
import { lireBiere, type BiereLue } from '../parcours/adaptateur';
import type { AjoutParcours, Cible, Quand, RecetteParcours } from '../parcours/types';
import type { Visee } from '../parcours/visee';

/** Les écrans que Suggérer ouvre (routes de la maquette ; l'app les traduit en couches de sa pile). */
export type RouteSuggerer = { ecran: 'suggerer' } | { ecran: 'comparer'; houblons: string[] };

export interface CadreSuggererProps {
  ecran: 'suggerer'; question: string; questionVisible?: boolean; elementTete?: string; contexte?: ReactNode; dock?: ReactNode;
  etat?: string; children: ReactNode;
}

export interface GestesSuggerer {
  ajouter: (sur: Cible, ajout: AjoutParcours) => void;
  moment: (sur: Cible, ajoutId: string, quand: Quand) => void;
  dose: (sur: Cible, ajoutId: string, grams: number) => void;
  remplacer: (sur: Cible, ajoutId: string, hopKey: string) => void;
  retirer: (sur: Cible, ajoutId: string) => void;
  basculerComparaison: (hopKey: string) => void;
  fixerComparaison: (houblons: string[]) => void;
}

export interface HoteSuggerer {
  /** La recette ouverte dessous (le brouillon). */
  recette: RecetteParcours;
  /** La visée posée dans Ma bière ({} : la demande dégustée vaut, parcours/visee.ts). */
  visee: Visee;
  /** Les houblons retenus (le « + » des voies), pour « Comparer (n) ». */
  aComparer: string[];
  /** L'écran du sommet : Suggérer, et la fiche qu'il ouvre par-dessus se repère à son changement (aller). */
  route: RouteSuggerer;
  /** Aller vers un écran (pousse une entrée d'historique ; la fiche s'ouvre ainsi). */
  aller: (r: RouteSuggerer) => void;
  /** Ouvrir un outil : Comparer avec les houblons retenus. */
  ouvrir: (r: RouteSuggerer) => void;
  gestes: GestesSuggerer;
  /** Le cadre de l'écran (en-tête à onglets, dock). */
  Cadre: ComponentType<CadreSuggererProps>;
  /** La fiche d'un houblon (appui long). */
  Fiche: ComponentType<{ houblon: string; onFermer?: () => void }>;
  /** Maquette seulement : le dossier du cas lu par controle-autres-ajouts (D76) ; absent dans l'app. */
  cas?: string;
}

const Ctx = createContext<HoteSuggerer | null>(null);

export function HoteSuggererProvider({ valeur, children }: { valeur: HoteSuggerer; children: ReactNode }) {
  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function useHoteSuggerer(): HoteSuggerer {
  const h = useContext(Ctx);
  if (!h) throw new Error('Suggérer hors de HoteSuggererProvider');
  return h;
}

// Les noms que l'écran employait dans la maquette, gardés pour que son code ne change pas.
export const useRecette = (): RecetteParcours => useHoteSuggerer().recette;
export const useVisee = (): Visee => useHoteSuggerer().visee;
export const useComparaison = (): string[] => useHoteSuggerer().aComparer;
export const useGestes = (): GestesSuggerer => useHoteSuggerer().gestes;
export const useOuvrir = () => useHoteSuggerer().ouvrir;
export const useCas = () => useHoteSuggerer().cas;
export function useNavigation() {
  const h = useHoteSuggerer();
  return { route: h.route, aller: h.aller };
}
export function useBiere(recette?: RecetteParcours): BiereLue {
  const r = useRecette();
  const cible = recette ?? r;
  return useMemo(() => lireBiere(cible), [cible]);
}
export function CadreOutil(p: CadreSuggererProps) {
  const { Cadre } = useHoteSuggerer();
  return <Cadre {...p} />;
}
export function FicheHote({ houblon, onFermer }: { houblon: string; onFermer?: () => void }) {
  const { Fiche } = useHoteSuggerer();
  return <Fiche houblon={houblon} onFermer={onFermer} />;
}
