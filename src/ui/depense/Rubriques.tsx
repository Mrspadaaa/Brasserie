// Les rubriques de p3c-3 : des rangées de 36 px (titre à gauche, valeur grise à droite) qui s'ouvrent sur leurs champs. Des `details` : le DOM les ouvre (`viser`, `focusIssue`).
import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface ItemRubrique { cle: string; titre: string; valeur: string; corps: React.ReactNode; attention?: boolean; ouvert?: boolean; attrs?: Record<string, string | boolean> }

export function Rubriques({ items }: { items: ItemRubrique[] }) {
  return <div data-dp="rubriques" className="flex flex-col px-2 pb-3">
    {items.map(r => <details key={r.cle} data-dp-rubrique={r.cle} open={r.ouvert} {...(r.attrs ?? {})} className={`border-b border-cave-800 ${r.attention ? 'bg-attention/5' : ''}`}>
      <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 px-1 text-sm text-cave-200"><span>{r.titre}</span><em className="ml-auto max-w-[62%] truncate text-xs not-italic text-cave-400">{r.valeur}</em><ChevronDown size={14} className="shrink-0 text-cave-400"/></summary>
      <div className="space-y-2 px-1 pb-2 pt-1">{r.corps}</div>
    </details>)}
  </div>;
}
