import { useEffect, useState } from 'react';

const RAIL = '(min-width: 1024px)';

/** Vrai à partir de 1024 px : la navigation est un rail à gauche, le menu du + une liste à lettres. */
export function useRail(): boolean {
  const [rail, setRail] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(RAIL).matches);
  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia(RAIL);
    const update = () => setRail(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);
  return rail;
}
