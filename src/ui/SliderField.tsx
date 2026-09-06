import React, { useId } from 'react';
import { NumberInput } from './NumberInput';
import { Field } from './FormNav';

/**
 * Curseur couplé à un champ numérique.
 *
 * Un curseur seul est excellent au doigt et mauvais au clavier : impossible de
 * saisir 5.3 précisément, et la valeur exacte reste invisible. Un champ seul est
 * l'inverse. On garde donc les deux, sur la même valeur :
 *
 *   TÉLÉPHONE  — on glisse le curseur, piste de 44 px de haut pour ne pas rater.
 *   ORDINATEUR — on tape la valeur, ou on ajuste au clavier une fois le curseur
 *                focalisé (← → d'un pas, ⇞ ⇟ de dix pas, ⇱ ⇲ aux extrémités).
 *
 * Réservé aux valeurs BORNÉES qui ont un minimum et un maximum naturels :
 * carbonatation, température, pH, dilution. Jamais pour une quantité de stock,
 * qui n'a pas de plafond — c'est le rôle de `QuantityStepper`.
 */

interface SliderFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  /** Repères sous la piste : valeurs remarquables du métier. */
  marks?: Array<{ value: number; label: string }>;
  hint?: string;
  /** Interprétation de la valeur courante, affichée à côté du nombre. */
  readout?: React.ReactNode;
  /**
   * Commandes posées sur la MÊME ligne que la valeur.
   *
   * ⚠️ Sans ça, une grandeur qui se règle de deux façons — ici un pourcentage
   * et un litrage — occupe deux étages complets alors que les deux tiennent
   * côte à côte. La coupe d'eau prenait quatre rangs : intitulé, pourcentage,
   * piste, litres.
   */
  after?: React.ReactNode;
  disabled?: boolean;
}

export const SliderField: React.FC<SliderFieldProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.1,
  unit,
  marks,
  hint,
  readout,
  after,
  disabled = false
}) => {
  const id = useId();
  const decimals = step < 1 ? String(step).split('.')[1]?.length ?? 1 : 0;
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-center gap-2 sm:gap-3">
          {/*
            Le curseur reste le geste principal ; le champ sert à poser une
            valeur exacte.
          */}
          <NumberInput
            id={id}
            min={min}
            max={max}
            value={value}
            onValue={onChange}
            emptyValue={min}
            disabled={disabled}
            pad={false}
            className="w-16 sm:w-24 shrink-0 min-h-[38px] sm:min-h-touch px-1 sm:px-3 rounded-control
                       bg-cave-950 border border-cave-700
                       reading text-base sm:text-lg text-ebc-straw text-center
                       focus:outline-none focus:border-ebc-straw"
          />

          {unit && <span className="reading-unit shrink-0 text-xs sm:text-sm">{unit}</span>}
          {after}
          {readout && (
            <span className="text-2xs sm:text-sm text-cave-400 min-w-0 truncate ml-auto text-right">
              {readout}
            </span>
          )}
        </div>

        {/* Piste du curseur. Pas de marge propre : la zone d'attrape de
            44 px en fournit déjà de part et d'autre de la piste de 8 px. */}
        <div className="relative">
          <input
            type="range"
            name="slider_field_range"
            autoComplete="off"
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            aria-label={`${label} — curseur`}
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            /*
             * ⚠️ LA ZONE D'ATTRAPE FAIT 44 px, LA PISTE EN FAIT 8.
             *
             * Le champ mesurait 24 px de haut, piste comprise : c'est la
             * hauteur de ce qu'on VOIT, et c'était aussi tout ce qu'on pouvait
             * VISER. Un curseur se saisit en posant le pouce puis en glissant
             * — le doigt dérive verticalement pendant le geste, et sortir de
             * 24 px lâche la prise en pleine course. Mesuré sur l'écran, pas
             * deviné : 40×24 pour l'interrupteur, 293×24 ici.
             *
             * On sépare donc les deux : `h-11` donne 44 px de surface tactile,
             * le fond transparent et la piste dessinée en `::-webkit-slider-
             * runnable-track` gardent l'apparence fine. Rien ne grossit à
             * l'œil, tout devient attrapable au doigt.
             */
            className="w-full h-11 cursor-pointer appearance-none bg-transparent
                       focus:outline-none disabled:opacity-40
                       [&::-webkit-slider-runnable-track]:h-2
                       [&::-webkit-slider-runnable-track]:rounded-full
                       [&::-webkit-slider-runnable-track]:bg-cave-800
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-6
                       [&::-webkit-slider-thumb]:h-6
                       [&::-webkit-slider-thumb]:-mt-2
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-ebc-straw
                       [&::-webkit-slider-thumb]:border-2
                       [&::-webkit-slider-thumb]:border-cave-950
                       [&::-webkit-slider-thumb]:shadow-lift
                       [&::-moz-range-track]:h-2
                       [&::-moz-range-track]:rounded-full
                       [&::-moz-range-track]:bg-cave-800
                       [&::-moz-range-thumb]:w-6
                       [&::-moz-range-thumb]:h-6
                       [&::-moz-range-thumb]:rounded-full
                       [&::-moz-range-thumb]:bg-ebc-straw
                       [&::-moz-range-thumb]:border-2
                       [&::-moz-range-thumb]:border-cave-950"
          />
        </div>

        {marks && marks.length > 0 && (
          <div className="flex justify-between gap-1">
            {marks.map((m) => (
              <button
                key={m.value}
                type="button"
                tabIndex={-1}
                disabled={disabled}
                onClick={() => onChange(m.value)}
                className={`text-2xs sm:text-sm transition-colors min-h-[28px] px-1 ${
                  Math.abs(value - m.value) < step / 2
                    ? 'text-ebc-straw font-medium'
                    : 'text-cave-500 hover:text-cave-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </Field>
  );
};
