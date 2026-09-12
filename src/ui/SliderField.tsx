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
 *   TÉLÉPHONE  — on glisse le curseur, zone active de 28 px de haut pour ne pas rater.
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
  displayDigits?: number;
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
  disabled = false,
  displayDigits
}) => {
  const id = useId();
  const decimals = step < 1 ? String(step).split('.')[1]?.length ?? 1 : 0;
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {/*
            Le curseur reste le geste principal ; le champ sert à poser une
            valeur exacte.
          */}
          <NumberInput
            id={id}
            min={min}
            max={max}
            value={displayDigits == null ? value : Number(value.toFixed(displayDigits))}
            onValue={onChange}
            emptyValue={min}
            disabled={disabled}
            pad={false}
            className="w-20 shrink-0 min-h-touch-lg px-1 rounded-control
                       bg-cave-950 border border-cave-700
                       reading text-base text-ebc-straw text-center
                       focus:outline-none focus:border-ebc-straw"
          />

          {unit && <span className="reading-unit shrink-0 text-sm">{unit}</span>}
          {after}
          {readout && (
            <span className="text-2xs sm:text-sm text-cave-400 min-w-0 break-words ml-auto text-right">
              {readout}
            </span>
          )}
        </div>

        {/* Piste fine, cible de 28 px dans sa propre rangée. */}
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
            /* Le pouce de 24 px reste dans la zone active de 28 px. */
            className="w-full h-7 cursor-pointer appearance-none bg-transparent
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
          /*
           * ⚠️ UN REPÈRE SE POSE À SA VALEUR, PAS À INTERVALLE ÉGAL.
           *
           * Ils étaient rangés en `flex justify-between` : trois repères
           * s'étalaient sur toute la largeur QUELLE QUE SOIT leur valeur.
           * Mesuré sur l'étape « Identité » :
           *
           *   Volume — piste 10→60, repères 20 · 30 · 50
           *            affichés à 0 % · 50 % · 100 %
           *            le 30 tombait au MILIEU alors que sa place est à 40 %,
           *            et la piste paraissait aller de 20 à 50.
           *   Ébullition — piste 30→120, repères 60 · 75 · 90
            *            le 60 s'affichait tout à GAUCHE, comme s'il était le
           *            minimum : le vrai minimum est 30, le vrai maximum 120.
           *            La moitié de la course était invisible à l'œil.
           *
           * Un brasseur qui lit la position du curseur lisait un volume faux.
           * Dans une application qui refuse d'inventer un chiffre plausible,
           * un instrument ne peut pas mentir sur sa propre graduation.
           *
           * Chaque repère est donc posé à son pourcentage réel. La correction
           * de 12 px suit le centre du pouce : sur un `input[type=range]`, le
           * centre du curseur ne va pas de 0 à 100 % mais de `pouce/2` à
           * `largeur − pouce/2` — le pouce fait 24 px.
           *
           * Le libellé possède sa propre cible de 24 px, sans chevauchement.
           */
          <div className="relative h-6">
            {marks.map((m) => {
              const at = ((m.value - min) / (max - min)) * 100;
              const active = Math.abs(value - m.value) < step / 2;
              return (
                <button
                  key={m.value}
                  type="button"
                  aria-pressed={active}
                  disabled={disabled}
                  onClick={() => onChange(m.value)}
                  style={{ left: `calc(${at}% + ${(12 - at * 0.24).toFixed(2)}px)` }}
                  className={`absolute top-0 min-h-touch-sm min-w-touch-sm px-1 -translate-x-1/2 flex items-center
                              whitespace-nowrap text-2xs sm:text-sm transition-colors ${
                    active ? 'text-ebc-straw font-medium' : 'text-cave-400 hover:text-cave-200'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Field>
  );
};
