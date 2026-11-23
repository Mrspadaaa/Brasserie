import { useSyncExternalStore } from 'react';

/**
 * L'orientation du téléphone (E10, D-205) : un seul écran, une mise en page par orientation, le même état. Media query lue par `matchMedia` et
 * `useSyncExternalStore` (MISSION § État de l'art) : la rotation change l'affichage, jamais de page à part.
 *
 * « Paysage » veut dire un téléphone couché : une fenêtre basse. Une fenêtre d'ordinateur ou une tablette, large et haute, garde la mise en
 * page portrait, centrée (E10 : « au 1280, la vue large est centrée »).
 */
export type Orientation = 'portrait' | 'paysage';

export const REQUETE_PAYSAGE = '(orientation: landscape) and (max-height: 540px)';

const liste = (): MediaQueryList | null => (typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(REQUETE_PAYSAGE) : null);

function abonner(rappel: () => void): () => void {
  const mq = liste();
  if (!mq) return () => undefined;
  if (typeof mq.addEventListener === 'function') { mq.addEventListener('change', rappel); return () => mq.removeEventListener('change', rappel); }
  // Anciens Safari : addListener.
  mq.addListener?.(rappel);
  return () => mq.removeListener?.(rappel);
}

const lire = (): Orientation => (liste()?.matches ? 'paysage' : 'portrait');

export function useOrientation(): Orientation {
  return useSyncExternalStore(abonner, lire, () => 'portrait');
}
