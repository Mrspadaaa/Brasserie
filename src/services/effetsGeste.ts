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

let courant: EffetsDuGeste | null = null;
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
  modifier(partiel: Partial<EffetsDuGeste>) { if (courant) { courant = { ...courant, ...partiel }; prevenir(); } },
  fermer() { courant = null; prevenir(); },
  abonner(f: () => void) { abonnes.add(f); return () => { abonnes.delete(f); }; }
};

export const useEffetsGeste = () => useSyncExternalStore(EffetsGeste.abonner, EffetsGeste.lire, EffetsGeste.lire);
