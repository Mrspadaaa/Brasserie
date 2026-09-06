import React, { useId } from 'react';
import { IonRange } from '../domain/waterStyles';
import { WaterIons } from '../types';
import { ratioLabel, sulfateChlorideRatio } from '../domain/water/ions';
export { ratioLabel } from '../domain/water/ions';

/** La poignée commande une consigne ; le chiffre principal décrit l’eau réelle. */

interface RatioSliderProps {
  value: number;
  onChange: (ratio: number) => void;
  achieved?: number | null;
  followingTarget?: boolean;
  ions?: WaterIons;
  target?: IonRange;
  max?: number;
  className?: string;
}
export const RatioSlider: React.FC<RatioSliderProps> = ({
  value,
  onChange,
  achieved,
  followingTarget = true,
  ions,
  target,
  max = 9,
  className = ''
}) => {
  const id = useId();
  const actual = achieved === undefined ? value : achieved;
  const shown = actual != null && Number.isFinite(actual) ? actual : null;
  const thumb = followingTarget ? value : (shown ?? (ions?.so4 ? max : value));
  const clamped = Math.max(0, Math.min(max, Number.isFinite(thumb) ? thumb : 0));
  const inRange = shown !== null && (!target || (shown >= target.min && shown <= target.max));
  // Don't display "0.9 — outside 0.4–0.9" when the actual ratio is 0.91.
  const rounded = shown === null ? null : Number(shown.toFixed(1));
  const precision = !inRange && target && rounded !== null && rounded >= target.min && rounded <= target.max ? 2 : 1;
  const pct = (v: number) => (Math.max(0, Math.min(v, max)) / max) * 100;
  const label = ions
    ? sulfateChlorideRatio(ions).label
    : shown === null
      ? 'Sans rapport défini'
      : ratioLabel(shown);
  /** L'écart se dit à partir d'un dixième — en dessous, c'est l'arrondi. */
  const drift = followingTarget && shown !== null && Math.abs(shown - value) >= 0.1 ? value : null;

  return (
    <div className={`panel px-3 py-1 sm:py-1.5 ${className}`}>
      {/*
        ⚠️ Une seule ligne au lieu de trois blocs empilés. La commande, ce
        qu'elle annonce en bouche et sa valeur se lisent d'un regard, et la
        feuille de pesée récupère la soixantaine de pixels que le titre en gros
        et la pastille de verdict lui prenaient — c'est ce qui permet de voir
        la toile ET les neuf sels sans dérouler.
      */}
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-2xs sm:text-sm font-semibold text-cave-200 shrink-0">
          SO₄ ⇄ Cl
        </label>
        <span className={`text-2xs sm:text-sm truncate ${inRange ? 'text-hop' : 'text-ebc-amber'}`}>
          {label}
        </span>
        <span className="reading text-base sm:text-lg text-cave-50 shrink-0">
          {shown === null ? '—' : shown.toFixed(precision)}
          {shown !== null && <span className="reading-unit"> : 1</span>}
        </span>
      </div>

      <div className="relative">
        {/* Piste : du chlorure dominant vers le sulfate dominant. */}
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full"
          style={{
            background: 'linear-gradient(to right, #5B8AA6 0%, #9A8A7E 45%, #D6453D 100%)'
          }}
          aria-hidden
        />

        {/* Fourchette du style, posée sur la piste. */}
        {target && (
          <div
            className="absolute top-1/2 -translate-y-1/2 h-4 rounded-full border border-hop/70 bg-hop/25"
            style={{
              left: `${pct(target.min)}%`,
              width: `${Math.max(2, pct(target.max) - pct(target.min))}%`
            }}
            aria-hidden
          />
        )}

        <input
          id={id}
          name="ratio_slider_range"
          autoComplete="off"
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
          data-bwignore="true"
          type="range"
          min={0}
          max={max}
          step={0.05}
          value={clamped}
          aria-valuetext={`${shown === null ? 'Rapport indéfini' : `Réel ${shown.toFixed(2)} pour 1`} — ${label}${target ? ` ; profil ${target.min} à ${target.max}` : ''}${drift !== null ? ` ; consigne ${drift.toFixed(2)}` : ''}`}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="relative block w-full h-8 sm:h-10 cursor-pointer appearance-none bg-transparent
                     focus:outline-none
                     [&::-webkit-slider-runnable-track]:h-8 sm:[&::-webkit-slider-runnable-track]:h-10
                     [&::-webkit-slider-runnable-track]:bg-transparent
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-7
                     [&::-webkit-slider-thumb]:h-7
                     [&::-webkit-slider-thumb]:mt-0.5 sm:[&::-webkit-slider-thumb]:mt-1.5
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-ebc-straw
                     [&::-webkit-slider-thumb]:border-2
                     [&::-webkit-slider-thumb]:border-cave-950
                     [&::-webkit-slider-thumb]:shadow-lift
                     [&::-moz-range-track]:h-8 sm:[&::-moz-range-track]:h-10
                     [&::-moz-range-track]:bg-transparent
                     [&::-moz-range-thumb]:w-7
                     [&::-moz-range-thumb]:h-7
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:bg-ebc-straw
                     [&::-moz-range-thumb]:border-2
                     [&::-moz-range-thumb]:border-cave-950"
        />
      </div>

      <div className="flex justify-between gap-2 text-[0.6875rem] sm:text-2xs leading-tight text-cave-400 pb-0.5">
        <span>
          {target && (
            <>
              Profil {target.min}–{target.max}
              {shown !== null && !inRange && ' · hors plage'}
            </>
          )}
        </span>
        <span className="reading">
          {drift !== null
            ? `Consigne ${drift.toFixed(1)}`
            : ions
              ? `${Math.round(ions.so4)} SO₄ / ${Math.round(ions.cl)} Cl ppm`
              : ''}
        </span>
      </div>
    </div>
  );
};
