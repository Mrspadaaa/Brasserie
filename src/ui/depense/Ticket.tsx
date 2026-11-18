// L'interrupteur « Mettre en stock » (critique n° 4). La rangée de la ligne vit dans `Ligne.tsx` (p3c-3).
import React from 'react';

/** « Mettre en stock : oui / non » (critique n° 4) : un interrupteur dont l'état se voit. */
export function Interrupteur({ actif, onChange, label }: { actif: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={actif} aria-label={label} onClick={() => onChange(!actif)} className="min-h-7 inline-flex items-center gap-2 text-sm text-cave-200">
    <span className={`inline-flex h-5 w-9 items-center rounded-full border px-0.5 transition-colors ${actif ? 'border-hop bg-hop/30 justify-end' : 'border-cave-600 bg-cave-800 justify-start'}`}><span className={`size-4 rounded-full ${actif ? 'bg-hop' : 'bg-cave-400'}`}/></span>
    <span>Mettre en stock : <b className="font-semibold">{actif ? 'oui' : 'non'}</b></span></button>;
}
