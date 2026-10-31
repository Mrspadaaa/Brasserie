import React, { useCallback, useState } from 'react';
import { graduations, traitsRegle } from './regles';

/** La règle sous un curseur : traits fins à chaque pas, un chiffre de loin en loin, et « › » au dernier (elle s'ouvre). */
export function Regle({ max, pas, etiquette, nom }: { max: number; pas: number; etiquette: number; nom: string }) {
  const traits = traitsRegle(max, pas);
  const chiffres = graduations(max, etiquette);
  return (
    <>
      <div
        className="idn-regle"
        data-role={`regle-${nom}`}
        aria-hidden="true"
        style={{
          backgroundImage: 'linear-gradient(90deg, rgb(var(--cave-600)) 0 1px, transparent 1px)',
          backgroundSize: `calc(100% / ${Math.max(1, traits)}) 100%`
        }}
      />
      <div className="idn-ech" data-role={`echelle-${nom}`} aria-hidden="true">
        {chiffres.map((g) => (
          <span
            key={g.valeur}
            className={`${g.derniere ? 'idn-dern' : ''} ${g.valeur === max ? 'idn-fin' : ''}`.trim()}
            style={{ left: `${g.position}%` }}
          >
            {g.valeur}
          </span>
        ))}
      </div>
    </>
  );
}

/**
 * La règle ne bouge pas sous le pouce : elle se fige au toucher et se recalcule au relâché. Le doigt lâche n'importe où
 * (pointerup sur la fenêtre), et un curseur manié au clavier suit la valeur sans geler.
 */
export function useRegleFigee(courante: number) {
  const [figee, setFigee] = useState<number | null>(null);
  const debut = useCallback(() => {
    setFigee(courante);
    const fin = () => {
      setFigee(null);
      window.removeEventListener('pointerup', fin);
      window.removeEventListener('pointercancel', fin);
    };
    window.addEventListener('pointerup', fin);
    window.addEventListener('pointercancel', fin);
  }, [courante]);
  return { regle: figee ?? courante, auToucher: debut };
}
