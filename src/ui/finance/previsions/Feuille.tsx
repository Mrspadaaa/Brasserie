import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * La feuille de p5b : voile 28 %, 10 px des bords, 16 px de rayon, l'escalier reste visible derrière (B-4 : propre à Prévisions, `Sheet` sert toute l'app).
 * Focus à l'ouverture, Échap ferme, le focus revient à l'élément qui l'a ouverte.
 */
export function Feuille({ titre, onClose, children, haute = false, aside }: { titre: React.ReactNode; onClose: () => void; children: React.ReactNode; haute?: boolean; /** Petite mention à droite du titre (p5b : « exemple · 15.11 »). */ aside?: React.ReactNode }) {
  const id = useId(), ref = useRef<HTMLDivElement>(null), retour = useRef<HTMLElement | null>(null);
  useEffect(() => {
    retour.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    ref.current?.focus({ preventScroll: true });
    return () => { if (retour.current?.isConnected) retour.current.focus({ preventScroll: true }); };
  }, []);
  return <div className="prv-voile" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div ref={ref} className={`prv-fiche${haute ? ' prv-haute' : ''}`} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1}
      onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}>
      <div className="prv-fiche-tete"><h3 id={id}>{titre}</h3>{aside && <span className="prv-aside">{aside}</span>}<button type="button" className="prv-x" aria-label="Fermer" onClick={onClose}><X size={16} aria-hidden="true" /></button></div>
      {children}
    </div>
  </div>;
}
