// L'hôte de Comparer (T15, #174) : ce que l'écran demande à qui le monte. Un seul code d'écran (cmc2k, son choix), deux
// hôtes : la maquette (son état en mémoire, sa coquille et son hash : prototypes/houblons-v4/parcours/src/ecrans/comparer/)
// et l'app (le brouillon du wizard, la porte applyHopV4Change, la pile des outils : ./EcranApp.tsx). L'écran ne lit rien
// d'autre de son environnement ; le moteur (parcours/adaptateur.ts) est commun.
import { createContext, useContext, type ComponentType, type ReactNode } from 'react';
import type { RecetteParcours } from '../parcours/types';

/** Les écrans que Comparer ouvre (routes de la maquette ; l'app les traduit en couches de sa pile). */
export type RouteComparer =
  | { ecran: 'comparer'; houblons: string[]; pin?: string }
  | { ecran: 'dryhopper'; ajout: string; houblon?: string }
  | { ecran: 'levure'; ajout: string; houblon?: string }
  | { ecran: 'suggerer' };

export interface CadreComparerProps {
  ecran: 'comparer'; question: string; questionVisible?: boolean; elementTete?: string; contexte?: ReactNode; dock?: ReactNode;
  etat?: string; children: ReactNode;
}

export interface HoteComparer {
  /** La recette ouverte dessous (le brouillon). */
  recette: RecetteParcours;
  /** L'écran du sommet : Comparer et, s'il y en a un, le houblon épinglé par Substituer. */
  route: { ecran: string; pin?: string };
  /** Aller vers un écran (pousse une entrée d'historique ; la fiche s'ouvre ainsi). */
  aller: (r: RouteComparer) => void;
  /** Ouvrir un outil : Dryhopper (« Placer »), Levure, Suggérer. */
  ouvrir: (r: RouteComparer) => void;
  /** Le cadre de l'écran (en-tête, onglets, dock). */
  Cadre: ComponentType<CadreComparerProps>;
  /** La fiche d'un houblon (appui long) ; absente, l'appui long n'ouvre rien. */
  Fiche?: ComponentType<{ houblon: string }>;
  /** Les mots de la bière (nom, style, date de la dégustation) ; absents : le cas S1 de la maquette. */
  termes?: TermesComparer;
}

const Ctx = createContext<HoteComparer | null>(null);

export function HoteComparerProvider({ valeur, children }: { valeur: HoteComparer; children: ReactNode }) {
  courants = valeur.termes ?? TERMES_S1;
  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function useHoteComparer(): HoteComparer {
  const h = useContext(Ctx);
  if (!h) throw new Error('Comparer hors de HoteComparerProvider');
  return h;
}

// Les noms que l'écran employait dans la maquette, gardés pour que son code ne change pas.
export const useRecette = (): RecetteParcours => useHoteComparer().recette;
export const useOuvrir = () => useHoteComparer().ouvrir;
export function useNavigation() {
  const h = useHoteComparer();
  return { route: h.route, aller: h.aller };
}
export function CadreOutil(p: CadreComparerProps) {
  const { Cadre } = useHoteComparer();
  return <Cadre {...p} />;
}
export function FicheHote({ houblon }: { houblon: string }) {
  const { Fiche } = useHoteComparer();
  return Fiche ? <Fiche houblon={houblon} /> : null;
}

// ---------- Les mots de la bière (T15b) ----------
// L'écran dit « ma stout », « ta 16D », « dégustation du 18.10 » : c'est le cas S1 de la maquette. Sur une vraie recette
// de l'app, ces mots viennent de l'hôte (nom de la bière, code du style, date de la dégustation ; null : aucune dégustation,
// tout est simulé). Lus au rendu, après le Provider : un seul Comparer est monté à la fois.
export interface TermesComparer { biere: string; style: string; degustation: string | null }
export const TERMES_S1: TermesComparer = { biere: 'stout', style: '16D', degustation: '18.10' };
let courants: TermesComparer = TERMES_S1;
export const termes = (): TermesComparer & { Biere: string } => ({ ...courants, Biere: courants.biere.charAt(0).toUpperCase() + courants.biere.slice(1) });
