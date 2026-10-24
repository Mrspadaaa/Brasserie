// Commande de pont vers l'écran suivant de la carte (« + floral › », « Comparer les 3 › »…), data-role="pont-<nom>".
// Dock : les commandes d'un outil sous le pouce (pied de PageShell).
import type { ReactNode } from 'react';

export function Pont({ nom, onClick, children, principal = true, disabled = false }: {
  nom: string; onClick: () => void; children: ReactNode; principal?: boolean; disabled?: boolean;
}) {
  return (
    <button type="button" data-role={`pont-${nom}`} onClick={onClick} disabled={disabled}
      className={`min-h-touch px-3 rounded-full text-sm font-semibold whitespace-nowrap disabled:opacity-40 ${principal ? 'bg-ebc-straw text-cave-950' : 'border border-cave-700 bg-cave-850 text-cave-50'}`}>
      {children} <span aria-hidden="true">›</span>
    </button>
  );
}

export function Dock({ children }: { children: ReactNode }) {
  return <div data-role="dock" className="flex items-center justify-end gap-2 py-1.5 overflow-x-auto scrollbar-none">{children}</div>;
}
