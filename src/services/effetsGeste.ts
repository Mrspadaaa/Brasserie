import { useSyncExternalStore } from 'react';
import type { EffetLigne, Geste, RegleConsommation } from '../domain/consommation/gestes';

/**
 * Le dernier geste et ses effets, pour l'onglet du bas (pe1) et la question une fois (pe4).
 * Un seul geste à la fois : un nouveau geste remplace le bandeau du précédent, dont la trace reste sur la ligne de stock (pe3).
 */
export interface EffetsDuGeste {
  geste: Geste;
  gesteId: string;
  effets: EffetLigne[];
  manquantes: RegleConsommation[];
  alertes: string[];
  /** Message après Annuler (refus motivé compris). */
  issue?: string;
  annule?: boolean;
}

/**
 * Ce que le geste a écrit hors du stock (l'état d'un fût…) et que son Annuler doit défaire avec lui : un geste, un seul Annuler.
 * Un seul geste à la fois, comme le bandeau : le suivant remplace celui-ci.
 */
export interface DefaireDuGeste {
  /** Motif de refus si ce qu'il faudrait défaire a bougé depuis ; rien n'est alors rendu, ni ici ni au stock. */
  refus?: () => string | null;
  defaire: () => void;
  /** Ce que l'annulation rend en plus du stock, dit au brasseur (« le fût est remis à laver »). */
  dit: string;
}

let courant: EffetsDuGeste | null = null;
let aDefaire: { gesteId: string; d: DefaireDuGeste } | null = null;
const abonnes = new Set<() => void>();
const prevenir = () => abonnes.forEach(f => f());

export const EffetsGeste = {
  lire: () => courant,
  annoncer(suivant: EffetsDuGeste) {
    // Le même geste repassé (dose retenue après coup) cumule ses effets ; un autre geste remplace.
    if (courant && courant.gesteId === suivant.gesteId && !courant.annule) {
      const gardes = courant.effets.filter(e => !suivant.effets.some(n => n.regleId === e.regleId));
      courant = { ...suivant, effets: [...gardes, ...suivant.effets] };
    } else courant = suivant;
    prevenir();
  },
  /** Accroché après l'annonce du geste (le fût s'écrit avant son décompte) : le bandeau se redessine pour offrir l'Annuler, même sans aucun stock décompté (T4-7). */
  surAnnulation(gesteId: string, d: DefaireDuGeste) {
    aDefaire = { gesteId, d };
    if (courant && courant.gesteId === gesteId) { courant = { ...courant }; prevenir(); }
  },
  /** Le défaire accroché à ce geste, s'il y en a un. */
  defaireDe: (gesteId: string): DefaireDuGeste | null => (aDefaire?.gesteId === gesteId ? aDefaire.d : null),
  /** Rendu une seule fois : le geste défait, son défaire s'efface. */
  oublierDefaire(gesteId: string) { if (aDefaire?.gesteId === gesteId) aDefaire = null; },
  modifier(partiel: Partial<EffetsDuGeste>) { if (courant) { courant = { ...courant, ...partiel }; prevenir(); } },
  fermer() { courant = null; prevenir(); },
  abonner(f: () => void) { abonnes.add(f); return () => { abonnes.delete(f); }; }
};

export const useEffetsGeste = () => useSyncExternalStore(EffetsGeste.abonner, EffetsGeste.lire, EffetsGeste.lire);
