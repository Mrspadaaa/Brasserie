// Ligne de contexte d'un outil : les facteurs fixés, en jetons. Le facteur libre n'y figure pas (L10).
import type { ReactNode } from 'react';

export function LigneContexte({ items }: { items: { cle: string; contenu: ReactNode }[] }) {
  return (
    <p data-role="contexte" className="flex flex-wrap items-center gap-1 text-xs text-cave-400">
      <span>fixé</span>
      {items.map((i) => (
        <span key={i.cle} data-contexte={i.cle} className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-cave-850 text-cave-50">{i.contenu}</span>
      ))}
    </p>
  );
}
