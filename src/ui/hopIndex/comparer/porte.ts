// Le pont de la porte unique vers Comparer (T15b, #174). La couche Comparer est posée AU-DESSUS du wizard : elle n'a ni
// son brouillon ni `applyHopV4Change`. Le wizard (BrewWizard.tsx) les pose ici à chaque rendu ; Comparer les lit. Rien
// d'autre n'est partagé : un brouillon, sa DI d'ébullition, son identifiant et la seule porte d'écriture.
// Le pont ne change d'identité (et ne prévient) que si le contenu lu par la conversion change ; `onChange` est toujours
// le dernier posé (il capte l'état du wizard à chaque rendu).
import { useSyncExternalStore } from 'react';
import type { Recipe } from '../../../types';
import type { ChangementHoublonsV4 } from '../../../domain/hopIndex/v4/recipeConversion';

export interface PorteEtape {
  /** Le brouillon exact du wizard (build()). */
  recipe: Recipe;
  boilOg?: number | null;
  draftId: string;
  /** La porte d'écriture du wizard (applyHopV4Change) ; elle lève une erreur si elle refuse. */
  onChange: (change: ChangementHoublonsV4) => void;
}

/** Ce que la conversion lit du brouillon (comme EtapeHoublons.tsx) : la recette n'est reconvertie que si l'un change. */
const signature = (p: Pick<PorteEtape, 'recipe' | 'boilOg' | 'draftId'>) => {
  const r = p.recipe;
  return JSON.stringify([r.hops, r.yeast, r.styleRef, r.style, r.boilMin, r.ogTarget, r.volumeL, r.name, r.fermentables?.map((f) => [f.use, f.weightKg]), p.boilOg, p.draftId]);
};

let courante: PorteEtape | null = null;
let sig = '';
const ecouteurs = new Set<() => void>();

/** Pose (ou retire, avec null) la porte. Même contenu : l'objet reste le même, seul `onChange` est remplacé. */
export function poserPorteEtape(p: PorteEtape | null): void {
  if (!p) {
    if (courante) { courante = null; sig = ''; ecouteurs.forEach((f) => f()); }
    return;
  }
  const s = signature(p);
  if (courante && s === sig) { courante.onChange = p.onChange; return; }
  courante = { ...p }; sig = s;
  ecouteurs.forEach((f) => f());
}

export const lirePorte = (): PorteEtape | null => courante;
const abonner = (f: () => void) => { ecouteurs.add(f); return () => { ecouteurs.delete(f); }; };

/** La porte posée par le wizard ; null : aucun brouillon ouvert dessous. */
export function usePorteEtape(): PorteEtape | null {
  return useSyncExternalStore(abonner, lirePorte, lirePorte);
}
