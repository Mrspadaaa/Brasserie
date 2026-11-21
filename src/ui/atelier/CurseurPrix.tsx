import React from 'react';
import { refCurseurNatif } from '../geste';

/**
 * Curseur m2 de l'Atelier (e9na) : un rail, trois repères, quatre graduations, un pouce de 24 px.
 * Une valeur inconnue n'est jamais 0 : tant que rien n'est saisi, le pouce est absent et la lecture le dit en mots.
 * La saisie est un `input[type=range]` transparent de 44 px de haut : tactile, clavier, lecteurs d'écran.
 */
export const CurseurPrix: React.FC<{
  label: string; min?: number; max: number; pas: number; grads: number[];
  valeur: number | undefined; onChange: (v: number) => void;
}> = ({ label, min = 0, max, pas, grads, valeur, onChange }) => {
  const pct = (v: number) => `${Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100))}%`;
  const hors = valeur != null && valeur > max;
  return (
    <div className="relative pt-5">
      <div className="absolute inset-x-0 top-0 h-5 font-mono text-xs text-cave-400" aria-hidden="true">
        {grads.map(g => (
          <span key={g} className="absolute whitespace-nowrap" style={{ left: pct(g), transform: g <= min ? 'none' : g >= max ? 'translateX(-100%)' : 'translateX(-50%)' }}>{g}</span>
        ))}
      </div>
      <div className="relative h-11">
        <div className="absolute inset-x-0 top-[17px] h-1.5 rounded-full bg-cave-800" aria-hidden="true" />
        {[1 / 6, 1 / 2, 5 / 6].map(t => <span key={t} className="absolute top-[22px] h-1.5 w-px bg-cave-700" aria-hidden="true" style={{ left: `${t * 100}%` }} />)}
        {valeur != null && (
          <span className="pointer-events-none absolute top-[18px] -translate-x-1/2 -translate-y-1/2" aria-hidden="true" style={{ left: pct(valeur) }}>
            <i className="absolute -top-3 left-1/2 h-3 w-0.5 -translate-x-1/2 bg-hop" />
            <b className={`block h-6 w-6 rounded-full border-2 border-cave-950 ring-2 ${hors ? 'bg-attention ring-attention/60' : 'bg-hop ring-hop/60'}`} />
          </span>
        )}
        <input ref={refCurseurNatif}
          type="range" min={min} max={max} step={pas} value={valeur == null ? min : Math.min(valeur, max)} aria-label={label}
          onChange={e => onChange(Number(e.target.value))}
          onClick={e => { if (valeur == null && e.detail === 0) onChange(Number(e.currentTarget.value)); }}
          className="absolute inset-0 h-11 w-full cursor-pointer opacity-0"
        />
      </div>
    </div>
  );
};
