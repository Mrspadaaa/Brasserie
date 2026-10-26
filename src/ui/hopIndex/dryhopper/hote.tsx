// L'hôte des trois outils à brouillon (T15c, #174) : Substituer (u4), Dryhopper (p4b2f) et Levure. Un seul code d'écran par outil
// (substituer/, dryhopper/, levure/), deux hôtes : la maquette (son état en mémoire, sa coquille et son hash : prototypes/
// houblons-v4/parcours/src/ecrans/<outil>/index.tsx) et l'app (le brouillon du wizard par la porte, la pile des outils :
// ./EcranApp.tsx). Les écrans ne lisent rien d'autre de leur environnement ; le moteur (parcours/adaptateur.ts) est commun.
// Même principe que comparer/hote.tsx et suggerer/hote.tsx. Les noms des crochets sont ceux que les écrans employaient dans la
// maquette (useBrouillon, useGestes…), pour que leur code ne change pas.
import { createContext, useContext, type ComponentType, type ReactNode } from 'react';
import type { AjoutParcours, Brouillon, Cible, Quand, RecetteParcours } from '../parcours/types';

/** Les écrans que ces outils ouvrent (routes de la maquette ; l'app les traduit en couches ou en étape de la couche). */
export type RouteOutil =
  | { ecran: 'comparer'; houblons: string[]; pin?: string }
  | { ecran: 'levure'; ajout: string };

export interface CadreOutilProps {
  ecran: 'substituer' | 'dryhopper' | 'levure'; question: string; contexte?: ReactNode; dock?: ReactNode; etat?: string; children: ReactNode;
}

export interface GestesOutil {
  moment: (sur: Cible, ajoutId: string, quand: Quand) => void;
  dose: (sur: Cible, ajoutId: string, grams: number) => void;
  remplacer: (sur: Cible, ajoutId: string, hopKey: string) => void;
  levure: (sur: Cible, yeastId: string) => void;
  /** Inscrit le brouillon dans la recette (l'app : par la porte unique) ; false si la porte le refuse (l'outil reste ouvert). */
  inscrire: () => boolean | void;
  basculerComparaison: (hopKey: string) => void;
}

/** La fiche d'un houblon posée sur l'écran (Substituer : appui long sur une ligne, survol long d'un nom). */
export interface FicheLocale {
  appui: (cle: string, onCourt?: () => void) => Record<string, unknown>;
  nom: (cle: string) => Record<string, unknown>;
  rendu: ReactNode;
}
/** La fiche posée sur Dryhopper et Levure (appui long ou survol long du jeton du houblon). */
export interface FicheSurOutil { declencheur: Record<string, unknown>; feuille: ReactNode }

export interface HoteOutil {
  /** Le brouillon de l'outil (une copie de la recette, changée par l'outil) ; null : aucun ouvert. */
  brouillon: Brouillon | null;
  /** La recette inscrite (celle de Ma bière, ou du wizard). */
  recette: RecetteParcours;
  /** Les houblons retenus pour Comparer. */
  aComparer: string[];
  gestes: GestesOutil;
  /** Aller vers un écran : Comparer (Substituer), Levure (Dryhopper). */
  aller: (r: RouteOutil) => void;
  /** Revenir à l'écran d'avant (Levure vers Dryhopper). */
  retour: () => void;
  /** Revenir à l'étape Houblons, après « Remplacer » ou « Ajouter à ma bière ». */
  revenirMaBiere: () => void;
  /** « Annuler » : jette le brouillon et ramène à l'étape Houblons (D120). */
  annuler: () => void;
  /** Le cadre de l'écran (tête, dock). */
  Cadre: ComponentType<CadreOutilProps>;
  useFiche: () => FicheLocale;
  useFicheSurOutil: (cle: string) => FicheSurOutil;
  /** Les mots de la bière (nom, style, date de la dégustation) ; absents : le cas S1 de la maquette. */
  termes?: TermesOutil;
  /** Dryhopper s'ouvre sur ★ pour un ajout neuf (posé par « Placer »), une fois. Maquette : un ajout absent de la recette inscrite. L'app : Placer écrit l'ajout tout de suite, la porte ne dit pas qu'il est neuf ; l'hôte le reconnaît à sa signature (EcranApp.tsx). */
  ajoutNeuf?: (ajoutId: string) => boolean;
}

const Ctx = createContext<HoteOutil | null>(null);

export function HoteOutilProvider({ valeur, children }: { valeur: HoteOutil; children: ReactNode }) {
  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function useHoteOutil(): HoteOutil {
  const h = useContext(Ctx);
  if (!h) throw new Error('Outil hors de HoteOutilProvider');
  return h;
}

export const useBrouillon = (): Brouillon | null => useHoteOutil().brouillon;
export const useRecette = (): RecetteParcours => useHoteOutil().recette;
export const useComparaison = (): string[] => useHoteOutil().aComparer;
export const useGestes = (): GestesOutil => useHoteOutil().gestes;
export function useNavigation() {
  const { aller, retour, revenirMaBiere } = useHoteOutil();
  return { aller, retour, revenirMaBiere };
}
export function CadreOutil(p: CadreOutilProps) {
  const { Cadre } = useHoteOutil();
  return <Cadre {...p} />;
}
export const useFiche = (): FicheLocale => useHoteOutil().useFiche();
export const useFicheSurOutil = (cle: string): FicheSurOutil => useHoteOutil().useFicheSurOutil(cle);

/** Le pied « Annuler · action » des outils qui changent la recette (D120, « Pas de bouton cancer », 23.10) : « Annuler » à gauche de
 * l'action, à la même hauteur (48 px, la cible du pouce), sur Substituer, Levure et Dryhopper, toujours la même forme. Annuler jette
 * le brouillon (la recette ne bouge pas) et ramène à l'étape Houblons (D118). Classes propres préfixées pq-annuler- (L26). */
export function PiedAnnuler({ resume, children }: { resume?: ReactNode; children: ReactNode }) {
  const { annuler } = useHoteOutil();
  return (
    <div data-pied="annuler" className="pq-annuler-pied">
      {resume != null && <div className="pq-annuler-resume">{resume}</div>}
      <div className="pq-annuler-rang">
        <button type="button" data-role="annuler" onClick={annuler} className="pq-annuler-bouton">Annuler</button>
        <div className="pq-annuler-action">{children}</div>
      </div>
    </div>
  );
}

export type { AjoutParcours };

// ---------- Les mots de la bière ----------
// Les écrans disent « ta stout », « Stout 16D », « ta demande du 18.10 » : c'est le cas S1 de la maquette. Sur une vraie recette de
// l'app, ces mots viennent de l'hôte (nom de la bière, code du style, date de la dégustation ; null : aucune dégustation, tout est
// simulé) : jamais la stout d'un autre cas (L14). Sans `termes`, l'hôte maquette garde exactement S1.
export interface TermesOutil { biere: string; style: string; degustation: string | null }
export const TERMES_S1: TermesOutil = { biere: 'stout', style: '16D', degustation: '18.10' };
export function useTermes(): TermesOutil & { Biere: string; duDeg: string } {
  const t = useHoteOutil().termes ?? TERMES_S1;
  return { ...t, Biere: t.biere.charAt(0).toUpperCase() + t.biere.slice(1), duDeg: t.degustation ? ` du ${t.degustation}` : '' };
}

/** Vrai pour l'hôte de la maquette (sans `termes` : cas S1 du 18.10). Seul le dessin de la maquette y garde ses trois familles
 * (floral, baies, résineux) ; l'app passe toujours ses `termes` (outilApp.tsx) et suit sa demande (comparer/demande.ts). */
export const useEstMaquette = (): boolean => !useHoteOutil().termes;

export const useAjoutNeuf = (): ((ajoutId: string) => boolean) => useHoteOutil().ajoutNeuf ?? (() => false);
