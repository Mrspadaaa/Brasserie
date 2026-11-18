// Repère de ce qui vient de changer dans Ma bière : la recette telle que Ma bière l'a montrée en dernier (quand un
// outil la recouvre ou la remplace), comparée à celle qu'elle montre au retour. L'instantané vit au niveau du
// module : la coquille ne monte pas Ma bière sous un outil plein écran. Un outil qui inscrit peut aussi le poser
// (noterAvant), pour une page ouverte directement sur l'outil.
//
// Test en ligne du 07.11, n° 4 : l'instantané d'une recette survivait à sa fermeture et s'affichait dans la suivante (« à la place
// de Nuget » dans une autre recette, houblons « nouveau »). Cause : un instantané sans propriétaire, repris par la première recette
// qui monte. Il porte maintenant l'identifiant de SA recette (`prendre` ne rend que le sien), et l'assistant l'oublie en se fermant.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RecetteParcours } from '../parcours/types';

let instantane: { id: string | undefined; recette: RecetteParcours } | null = null;
/** L'identifiant de la recette quand la conversion en porte un (sinon tous les instantanés se ressemblent et seul oublierRepere les sépare). */
const idDe = (r: RecetteParcours) => (r as { id?: string }).id;
const meme = (a: RecetteParcours, b: RecetteParcours) => JSON.stringify(a) === JSON.stringify(b);

/** À appeler par un outil juste avant d'inscrire son brouillon : la recette d'avant. */
export function noterAvant(r: RecetteParcours) { instantane = { id: idDe(r), recette: r }; }

/** L'assistant se ferme : ce qu'il avait montré ne regarde plus personne. */
export function oublierRepere() { instantane = null; }

function prendre(r: RecetteParcours): RecetteParcours | null {
  const s = instantane;
  instantane = null;
  // Un instantané d'une autre recette n'est pas un « avant » de celle-ci.
  return s && s.id === idDe(r) && !meme(s.recette, r) ? s.recette : null;
}

/** `visible` : Ma bière est à l'écran (elle, ou la fiche posée sur elle). */
export function useRepere(recette: RecetteParcours, visible: boolean) {
  const recetteRef = useRef(recette); recetteRef.current = recette;
  const [avant, setAvant] = useState<RecetteParcours | null>(() => (visible ? prendre(recette) : null));
  useLayoutEffect(() => {
    if (!visible) { if (!instantane) instantane = { id: idDe(recetteRef.current), recette: recetteRef.current }; return; }
    const a = prendre(recetteRef.current);
    if (a) setAvant(a);
  }, [visible]);
  // Démontée (un outil plein écran la remplace) : elle garde ce qu'elle montrait.
  useEffect(() => () => { if (!instantane) instantane = { id: idDe(recetteRef.current), recette: recetteRef.current }; }, []);
  return { avant, effacer: () => setAvant(null) };
}
