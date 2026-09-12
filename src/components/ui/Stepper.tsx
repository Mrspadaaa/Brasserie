import React, { useRef, useCallback } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Units } from '../../services/units';

/**
 * Compteur tactile [−] valeur [+].
 *
 * Dimensionné pour la cuverie : 56 px de côté, soit largement au-dessus du
 * minimum de 48 px, parce qu'il se manipule avec des gants ou les doigts
 * mouillés. Les trois implémentations divergentes qui existaient auparavant
 * (deux dans QuickActionModal, une dans StocksTab) faisaient 24 px.
 *
 * L'appui long accélère : ajouter 25 kg de malt ne doit pas demander 50 taps.
 * Et la valeur elle-même est un champ — pour une grosse quantité, on la tape.
 */

interface StepperProps {
  value: number;
  onChange: (next: number) => void;
  unit: string;
  min?: number;
  max?: number;
  /** Pas personnalisé ; sinon déduit de l'unité (kg → 0.5, g → 25, pièce → 1). */
  step?: number;
  label?: string;
  disabled?: boolean;
}

export const Stepper: React.FC<StepperProps> = ({
  value,
  onChange,
  unit,
  min = 0,
  max,
  step,
  label,
  disabled = false
}) => {
  const holdTimer = useRef<number | null>(null);
  const accelTimer = useRef<number | null>(null);

  const stepSize = step ?? Units.stepFor(unit);

  const apply = useCallback(
    (direction: 1 | -1, multiplier = 1) => {
      const next = Units.round(value + direction * stepSize * multiplier, unit);
      const clamped = Math.min(max ?? Number.MAX_SAFE_INTEGER, Math.max(min, next));
      onChange(clamped);
    },
    [value, stepSize, unit, min, max, onChange]
  );

  const stopHold = useCallback(() => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    if (accelTimer.current) window.clearInterval(accelTimer.current);
    holdTimer.current = null;
    accelTimer.current = null;
  }, []);

  /** Appui long : répétition qui accélère après une seconde. */
  const startHold = useCallback(
    (direction: 1 | -1) => {
      stopHold();
      holdTimer.current = window.setTimeout(() => {
        let ticks = 0;
        accelTimer.current = window.setInterval(() => {
          ticks += 1;
          apply(direction, ticks > 12 ? 10 : ticks > 5 ? 4 : 1);
        }, 90);
      }, 450);
    },
    [apply, stopHold]
  );

  const btn =
    'w-touch-lg h-touch-lg shrink-0 rounded-control border border-cave-700 bg-cave-850 ' +
    'text-cave-50 flex items-center justify-center transition-colors ' +
    'active:bg-cave-800 disabled:opacity-40 disabled:pointer-events-none';

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-sm text-cave-400">{label}</span>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Retirer ${stepSize} ${unit}`}
          disabled={disabled || value <= min}
          className={btn}
          onClick={() => apply(-1)}
          onPointerDown={() => startHold(-1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
        >
          <Minus className="w-5 h-5" />
        </button>

        <div className="flex-1 flex items-baseline justify-center gap-1.5 min-w-0">
          <input
            type="text"
            inputMode="decimal"
            name="stepper_qty_input"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            value={value}
            disabled={disabled}
            aria-label={label || `Quantité en ${unit}`}
            onChange={(e) => {
              const parsed = parseFloat(e.target.value.replace(',', '.'));
              onChange(Number.isNaN(parsed) ? min : Math.max(min, parsed));
            }}
            className="w-full min-w-0 bg-transparent text-center reading text-2xl text-ebc-straw
                       focus:outline-none focus:bg-cave-850 rounded-control py-1
                       [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                       [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="reading-unit shrink-0">{unit}</span>
        </div>

        <button
          type="button"
          aria-label={`Ajouter ${stepSize} ${unit}`}
          disabled={disabled || (max !== undefined && value >= max)}
          className={btn}
          onClick={() => apply(1)}
          onPointerDown={() => startHold(1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
