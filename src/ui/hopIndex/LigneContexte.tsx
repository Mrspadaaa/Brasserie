// Ligne de contexte d'un outil : les facteurs fixés, en jetons. Le facteur libre n'y figure pas (L10).
import type { ReactNode } from 'react';

/** `sansMot` : le mot « fixé » n'est pas écrit (l'outil le dit dans le libellé de sa ligne, Comparer : « Fixé pour les trois »). */
export function LigneContexte({ items, sansMot = false }: { items: { cle: string; contenu: ReactNode }[]; sansMot?: boolean }) {
  return (
    <p data-role="contexte" className="flex flex-wrap items-center gap-1 text-xs text-cave-400">
      {!sansMot && <span>fixé</span>}
      {items.map((i) => (
        <span key={i.cle} data-contexte={i.cle} className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-cave-850 text-cave-50">{i.contenu}</span>
      ))}
    </p>
  );
}
