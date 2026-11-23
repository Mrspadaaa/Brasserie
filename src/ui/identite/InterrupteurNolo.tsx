import React from 'react';

/** L'objectif NOLO (≤ 0,5 %) en interrupteur (r4-a). Le panneau NOLO s'ouvre dessous quand il est allumé. */
export function InterrupteurNolo({ actif, onBascule }: { actif: boolean; onBascule: (actif: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label="Objectif NOLO · ≤ 0,5 %"
      className="idn-nolo"
      data-element="r4a-nolo"
      onClick={() => onBascule(!actif)}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 3h12l-1.6 17.2a1 1 0 0 1-1 .8H8.6a1 1 0 0 1-1-.8Z" /><path d="M6.6 9h10.8" /><circle cx="12" cy="15" r="2.4" />
      </svg>
      <b>NOLO</b>
      <span className="idn-k" aria-hidden="true">≤ <span className="idn-m">0,5 %</span></span>
      <span className="idn-tg" aria-hidden="true" />
    </button>
  );
}
