// Légende derrière « ? », fermée au repos (D89) ; Échap ou un second toucher la ferment.
import { useEffect, useId, useState, type ReactNode } from 'react';

export function Legende({ children }: { children: ReactNode }) {
  const [ouverte, setOuverte] = useState(false);
  const id = useId();
  useEffect(() => {
    if (!ouverte) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOuverte(false); } };
    document.addEventListener('keydown', k, true);
    return () => document.removeEventListener('keydown', k, true);
  }, [ouverte]);
  return (
    <span className="relative inline-block">
      <button type="button" data-role="legende-bouton" aria-expanded={ouverte} aria-controls={id} aria-label="Lire la légende"
        onClick={() => setOuverte((o) => !o)}
        className="touch-target w-8 h-8 rounded-full border border-cave-700 bg-cave-850 font-semibold text-cave-200">?</button>
      <div id={id} data-role="legende" hidden={!ouverte}
        className="absolute left-0 top-10 z-20 w-64 rounded-control border border-cave-700 bg-cave-850 p-2 text-xs text-cave-200 shadow-lg space-y-1">
        {children}
      </div>
    </span>
  );
}
