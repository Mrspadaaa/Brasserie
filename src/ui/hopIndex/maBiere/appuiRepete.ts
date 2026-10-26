// D173 (s2-sources-une-fois, 26.10) : « Aussi ajouter des gramme de houblons, un appui long doit en ajouter en continu. »
// Les boutons − et + des grammes d'un ajout : un toucher court fait un pas, comme avant ; un appui long répète le pas en continu.
//  - la répétition part après DELAI_REPETITION (500 ms), d'abord un pas toutes les 240 ms, puis de plus en plus vite
//    (20 ms de moins à chaque pas, jusqu'à 60 ms) : on traverse vite 40 g sans dépasser la cible à l'œil ;
//  - elle s'arrête au relâché, à l'annulation, ou dès que le doigt sort du bouton (pointermove : un doigt tactile reste capturé
//    par le bouton, `pointerleave` ne vient qu'au relâché) ;
//  - le clic qui suit un appui long est avalé : il n'ajoute pas un pas de plus ; au clavier (Entrée, Espace), un clic = un pas ;
//  - le pas rend `false` quand il n'avance plus (borne : 0 g au minimum) : la répétition s'arrête là.
import { useEffect, useRef } from 'react';

export const DELAI_REPETITION = 500;
export const PAS_LENT = 240;
export const PAS_RAPIDE = 60;
export const ACCELERATION = 20;

/** Les propriétés d'un bouton à répéter. `pas` est lu à chaque tour : il voit toujours la valeur courante. */
export function useAppuiRepete(pas: () => boolean | void) {
  const pasRef = useRef(pas); pasRef.current = pas;
  const minuterie = useRef<number | null>(null);
  const fait = useRef(false);
  const arreter = () => { if (minuterie.current != null) window.clearTimeout(minuterie.current); minuterie.current = null; };
  useEffect(() => arreter, []);
  const tour = (k: number) => {
    if (pasRef.current() === false) { arreter(); return; }
    minuterie.current = window.setTimeout(() => tour(k + 1), Math.max(PAS_RAPIDE, PAS_LENT - ACCELERATION * k));
  };
  return {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button > 0) return;
      fait.current = false;
      arreter();
      minuterie.current = window.setTimeout(() => { fait.current = true; tour(0); }, DELAI_REPETITION);
    },
    onPointerUp: arreter,
    onPointerCancel: arreter,
    onPointerLeave: arreter,
    onPointerMove: (e: React.PointerEvent) => {
      if (minuterie.current == null) return;
      const r = (e.currentTarget as Element).getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) arreter();
    },
    onContextMenu: (e: React.SyntheticEvent) => e.preventDefault(),
    onClick: () => {
      if (fait.current) { fait.current = false; return; }
      pasRef.current();
    },
  };
}
