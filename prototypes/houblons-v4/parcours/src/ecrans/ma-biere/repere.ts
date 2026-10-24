// Repère de ce qui vient de changer dans Ma bière : la recette telle que Ma bière l'a montrée en dernier (quand un
// outil la recouvre ou la remplace), comparée à celle qu'elle montre au retour. L'instantané vit au niveau du
// module : la coquille ne monte pas Ma bière sous un outil plein écran. Un outil qui inscrit peut aussi le poser
// (noterAvant), pour une page ouverte directement sur l'outil.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RecetteParcours } from '../../etat/types';

let instantane: RecetteParcours | null = null;
const meme = (a: RecetteParcours, b: RecetteParcours) => JSON.stringify(a) === JSON.stringify(b);

/** À appeler par un outil juste avant d'inscrire son brouillon : la recette d'avant. */
export function noterAvant(r: RecetteParcours) { instantane = r; }

function prendre(r: RecetteParcours): RecetteParcours | null {
  const s = instantane;
  instantane = null;
  return s && !meme(s, r) ? s : null;
}

/** `visible` : Ma bière est à l'écran (elle, ou la fiche posée sur elle). */
export function useRepere(recette: RecetteParcours, visible: boolean) {
  const recetteRef = useRef(recette); recetteRef.current = recette;
  const [avant, setAvant] = useState<RecetteParcours | null>(() => (visible ? prendre(recette) : null));
  useLayoutEffect(() => {
    if (!visible) { if (!instantane) instantane = recetteRef.current; return; }
    const a = prendre(recetteRef.current);
    if (a) setAvant(a);
  }, [visible]);
  // Démontée (un outil plein écran la remplace) : elle garde ce qu'elle montrait.
  useEffect(() => () => { if (!instantane) instantane = recetteRef.current; }, []);
  return { avant, effacer: () => setAvant(null) };
}
