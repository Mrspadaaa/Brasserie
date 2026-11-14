import React from 'react';
import './recette.css';

/**
 * Une mesure du bandeau de la fiche (maquette r1) : libellé, valeur en mono, piste du style en enfant.
 * Une case de chiffre ne porte jamais une consigne : « — », et la raison reste en info-bulle et pour les lecteurs d'écran (test en ligne n° 11).
 * La note (« 80 annoncé ») est hors de la valeur : on lit la valeur seule dans `.reading`.
 */
export function Rep({ label, value, hint, note, swatch, title, children }: {
  label: string;
  value: string | null;
  hint?: string;
  note?: string;
  swatch?: string;
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <div title={title}>
      <span className="rc-l">{label}</span>
      {value ? (
        <>
          {swatch && <span className={`inline-block w-3.5 h-3.5 rounded-full border border-cave-700 shrink-0 self-center ${swatch}`} aria-hidden />}
          <span className="rc-v reading">{value}</span>
        </>
      ) : (
        <span className="rc-v reading" title={hint ?? 'incalculable'}>—<span className="sr-only"> {hint ?? 'incalculable'}</span></span>
      )}
      {children}
      {note && <span className="rc-note">{note}</span>}
    </div>
  );
}
