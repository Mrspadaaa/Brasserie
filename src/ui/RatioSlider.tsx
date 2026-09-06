import React, { useId } from 'react';
import { IonRange } from '../domain/waterStyles';

/**
 * Le curseur sulfate ⇄ chlorure.
 *
 * ⚠️ Ce n'est pas un affichage, c'est une **commande**. Le rapport
 * sulfate/chlorure est le seul réglage d'eau qu'un brasseur ressent
 * directement en bouche : au-dessus de 2, la bière est sèche et l'amertume
 * tranche ; en dessous de 0.5, elle est ronde et le malt ressort. Le poser
 * d'abord, et laisser les sels suivre, est plus juste que de doser du gypse au
 * gramme en espérant tomber au bon endroit.
 *
 * On tire le curseur, et la répartition entre sulfate et chlorure se refait
 * **à minéralité totale constante** : on déplace le goût, on n'ajoute pas de sel.
 *
 * ⚠️ HORIZONTAL, et c'est délibéré. La version verticale — celle des
 * calculateurs de bureau — demandait un `range` pivoté à 90°, avec deux
 * conséquences : l'origine de rotation le sortait de son rail, et surtout un
 * glissement vertical dans une page qui défile est ambigu, si bien que la page
 * bougeait au lieu du curseur. À l'horizontale, le geste ne peut pas être
 * confondu, et « malté ⟷ amer » se lit dans le sens de lecture.
 */

interface RatioSliderProps {
  /**
   * La position de la poignée — c'est-à-dire LE RAPPORT QUI COMMANDE L'EAU.
   *
   * ⚠️ Ce n'est pas toujours la consigne. Tant que les doses sont celles du
   * solveur, c'est elle ; dès qu'on retouche un sel à la main, c'est le rapport
   * RÉEL qui prend la poignée — sans quoi le curseur resterait immobile pendant
   * que l'eau bouge sous lui. L'appelant tranche, il en sait plus que nous.
   */
  value: number;
  onChange: (ratio: number) => void;
  /**
   * L'autre rapport, quand il y en a un à montrer — `null` sinon.
   *
   * ⚠️ Il n'est pas toujours égal à celui qu'on demande : les doses se pèsent
   * au dixième de gramme et la fourchette du style plafonne les ions. Afficher
   * la seule consigne laissait croire à une eau qu'on n'a pas.
   */
  achieved?: number | null;
  /** Fourchette recommandée par le style, marquée sur la piste. */
  target?: IonRange;
  max?: number;
  className?: string;
}

/** Ce que le rapport annonce en bouche. */
export function ratioLabel(ratio: number): string {
  if (ratio >= 4) return 'Très amère';
  if (ratio >= 2) return 'Amère';
  if (ratio >= 1.3) return 'Houblonnée';
  if (ratio >= 0.8) return 'Équilibrée';
  if (ratio >= 0.5) return 'Maltée';
  return 'Très maltée';
}

export const RatioSlider: React.FC<RatioSliderProps> = ({
  value,
  onChange,
  achieved,
  target,
  max = 9,
  className = ''
}) => {
  const id = useId();
  const clamped = Math.max(0, Math.min(max, value));
  const inRange = target ? clamped >= target.min && clamped <= target.max : true;
  const pct = (v: number) => (Math.min(v, max) / max) * 100;
  /** L'écart se dit à partir d'un dixième — en dessous, c'est l'arrondi. */
  const drift =
    achieved !== undefined && achieved !== null && Math.abs(achieved - clamped) >= 0.1
      ? achieved
      : null;

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
        <label
          htmlFor={id}
          className="text-2xs sm:text-sm font-semibold text-cave-200 shrink-0"
        >
          SO₄ ⇄ Cl
        </label>
        <span
          className={`text-2xs sm:text-sm truncate ${
            inRange ? 'text-hop' : 'text-ebc-amber'
          }`}
        >
          {ratioLabel(clamped)}
          {drift !== null && (
            <span className="text-ebc-amber reading"> · réel {drift.toFixed(1)}</span>
          )}
          {target && !inRange && (
            <span className="text-cave-500">
              {' '}
              · le style vise {target.min}–{target.max}
            </span>
          )}
        </span>
        <span className="reading text-base sm:text-lg text-cave-50 shrink-0">
          {clamped.toFixed(1)}
          <span className="reading-unit"> : 1</span>
        </span>
      </div>

      <div className="relative">
        {/* Piste : du malté (gauche) vers l'amer (droite). */}
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
          step={0.1}
          value={clamped}
          aria-valuetext={`${clamped.toFixed(1)} pour 1 — ${ratioLabel(clamped)}`}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="relative block w-full h-10 cursor-pointer appearance-none bg-transparent
                     focus:outline-none
                     [&::-webkit-slider-runnable-track]:h-10
                     [&::-webkit-slider-runnable-track]:bg-transparent
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-7
                     [&::-webkit-slider-thumb]:h-7
                     [&::-webkit-slider-thumb]:mt-1.5
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-ebc-straw
                     [&::-webkit-slider-thumb]:border-2
                     [&::-webkit-slider-thumb]:border-cave-950
                     [&::-webkit-slider-thumb]:shadow-lift
                     [&::-moz-range-track]:h-10
                     [&::-moz-range-track]:bg-transparent
                     [&::-moz-range-thumb]:w-7
                     [&::-moz-range-thumb]:h-7
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:bg-ebc-straw
                     [&::-moz-range-thumb]:border-2
                     [&::-moz-range-thumb]:border-cave-950"
        />
      </div>

    </div>
  );
};
