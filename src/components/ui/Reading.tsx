import React from 'react';

/**
 * Lecture d'instrument.
 *
 * Le geste central de l'application est de LIRE une mesure : une densité, un
 * volume, un montant, un nombre de bouteilles. On les présente donc comme les
 * affiche un densimètre ou une balance — le nombre en grand, l'unité petite à
 * côté, et l'écart à la cible en dessous s'il y en a une.
 *
 * Chiffres tabulaires obligatoires (voir index.css) : sans ça une colonne de
 * montants se déforme d'une ligne à l'autre et devient incomparable d'un coup
 * d'œil.
 */

export type ReadingSize = 'sm' | 'md' | 'lg';
export type ReadingTone = 'neutral' | 'beer' | 'good' | 'alert' | 'water';

interface ReadingProps {
  label: string;
  value: string | number;
  unit?: string;
  /** Écart à la cible, déjà formaté (« +2.5 kg », « J+12 »). */
  delta?: string;
  deltaTone?: ReadingTone;
  size?: ReadingSize;
  tone?: ReadingTone;
  /** Texte affiché quand la valeur est absente, plutôt qu'un tiret muet. */
  emptyHint?: string;
}

const SIZES: Record<ReadingSize, string> = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl'
};

const TONES: Record<ReadingTone, string> = {
  neutral: 'text-cave-50',
  beer: 'text-ebc-straw',
  good: 'text-hop',
  alert: 'text-alert',
  water: 'text-water'
};

export const Reading: React.FC<ReadingProps> = ({
  label,
  value,
  unit,
  delta,
  deltaTone = 'neutral',
  size = 'md',
  tone = 'neutral',
  emptyHint = 'pas encore mesuré'
}) => {
  const isEmpty =
    value === null || value === undefined || value === '' || value === '—';

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-cave-400">{label}</span>

      {isEmpty ? (
        <span className="text-base text-cave-400 italic">{emptyHint}</span>
      ) : (
        <div className="flex items-baseline gap-1.5">
          <span className={`reading ${SIZES[size]} ${TONES[tone]}`}>{value}</span>
          {unit && <span className="reading-unit">{unit}</span>}
        </div>
      )}

      {delta && !isEmpty && (
        <span className={`font-mono text-sm ${TONES[deltaTone]}`}>{delta}</span>
      )}
    </div>
  );
};
