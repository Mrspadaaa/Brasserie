// Les pictos de lien au stock de r2b (0 mot au repos : le mot est dans l'aria-label et dans la pastille). Un cube, une pastille d'état.
import React from 'react';

export type LienStock = 'relie' | 'neuf' | 'precis' | 'aucun' | 'mouture';
export const MOT_LIEN: Record<LienStock, string> = { relie: 'relié', neuf: 'nouvel article', precis: 'unité à préciser', aucun: 'aucun mouvement de stock', mouture: 'mouture' };
const COULEUR: Record<LienStock, string> = { relie: 'text-cave-50', neuf: 'text-area-stocks', precis: 'text-attention', aucun: 'text-cave-400', mouture: 'text-cave-400' };

export function PictoLien({ lien, size = 20 }: { lien: LienStock; size?: number }) {
  const cube = <><path d="M10 2.5 17 6v8l-7 3.5L3 14V6z"/><path d="M3 6l7 3.5L17 6M10 9.5v8"/></>;
  return <svg role="img" aria-label={MOT_LIEN[lien]} width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={30 / size} className={`shrink-0 ${COULEUR[lien]}`}>
    {lien === 'mouture' ? <><path d="M5 3v8a3 3 0 0 0 3 3h8"/><path d="M13 11l3 3-3 3"/></> : <g strokeDasharray={lien === 'precis' ? '2.4 1.6' : undefined}>{cube}</g>}
    {lien === 'relie' ? <><circle cx="15" cy="15" r="4.6" fill="currentColor" stroke="none"/><path d="M12.8 15.1l1.6 1.6 2.9-3" stroke="#fff"/></> : null}
    {lien === 'neuf' ? <><circle cx="15" cy="15" r="4.6" fill="currentColor" stroke="none"/><path d="M15 12.6v4.8M12.6 15h4.8" stroke="#fff"/></> : null}
    {lien === 'precis' ? <><circle cx="15" cy="15" r="4.6" fill="#fff" strokeDasharray="2 1.4"/><path d="M13.6 13.9a1.5 1.5 0 1 1 2.2 1.3c-.6.3-.8.6-.8 1.1M15 17.5v.2"/></> : null}
  </svg>;
}
