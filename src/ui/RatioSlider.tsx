import React, { useId, useRef } from 'react';
import { IonRange } from '../domain/waterStyles';
import { WaterIons } from '../types';
import { ratioLabel, sulfateChlorideRatio } from '../domain/water/ions';
import { ratioToShare, shareToRatio } from './water/ratioScale';
export { ratioLabel } from '../domain/water/ions';

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

const frenchNumber = (value: number, precision = 2) =>
  value.toLocaleString('fr-CH', { maximumFractionDigits: precision });

/** La poignée règle le rapport ; le repère bleu représente uniquement les ions obtenus. */
export const RatioSlider: React.FC<RatioSliderProps> = ({
  value, onChange, achieved, followingTarget = true, ions, target, max = 9, className = '',
}) => {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const activePointer = useRef<number | null>(null);
  const lastPointerRatio = useRef<number | null>(null);
  const limit = Number.isFinite(max) && max > 0 ? max : 9;
  const shareMax = ratioToShare(limit);
  // Un quotient préarrondi masquerait les écarts aux limites du profil.
  const actual = ions
    ? ions.cl > 0 ? ions.so4 / ions.cl : ions.so4 > 0 ? Infinity : null
    : achieved === undefined ? null : achieved;
  const knownActual = actual !== null && (actual === Infinity || Number.isFinite(actual) && actual >= 0);
  const finiteActual = knownActual && Number.isFinite(actual) ? actual as number : null;
  const withoutChloride = knownActual && actual === Infinity;
  const setting = !followingTarget && knownActual ? actual as number : value;
  const safeSetting = setting === Infinity ? Infinity : Number.isFinite(setting) ? Math.max(0, setting) : 0;
  const clampedSetting = Math.min(limit, safeSetting);
  const outside = !!target && knownActual && (withoutChloride || finiteActual! < target.min || finiteActual! > target.max);
  let precision = 2;
  while (finiteActual !== null && precision < 4) {
    const rounded = Number(finiteActual.toFixed(precision));
    const hidesOutside = target && outside && rounded >= target.min && rounded <= target.max;
    const changesOrientation = ratioLabel(rounded) !== ratioLabel(finiteActual);
    if (!hidesOutside && !changesOrientation) break;
    precision += 1;
  }
  const actualText = withoutChloride ? 'Sans chlorure' : finiteActual === null ? 'Indéfini' : frenchNumber(finiteActual, precision);
  const settingText = safeSetting === Infinity ? 'Sans chlorure' : frenchNumber(safeSetting, !followingTarget ? precision : 2);
  const label = ions ? sulfateChlorideRatio(ions).label : finiteActual === null ? '' : ratioLabel(finiteActual);
  const different = followingTarget && knownActual && (safeSetting === Infinity
    ? !withoutChloride
    : withoutChloride || Math.abs(finiteActual! - safeSetting) >= 0.05);
  const position = (ratio: number) => ratioToShare(Math.max(0, Math.min(limit, ratio))) / shareMax * 100;
  const profileText = target ? `Profil ${frenchNumber(target.min)}–${frenchNumber(target.max)} · ${!knownActual ? 'rapport non évaluable' : outside ? 'obtenu hors plage' : 'obtenu dans la plage'}` : '';
  const changeSetting = (ratio: number) => onChange(Math.min(limit, Math.max(0, Math.round(ratio * 20) / 20)));
  // Le contrôle natif conserve une vraie valeur SO₄/Cl pour l'accessibilité.
  // Seuls la géométrie visuelle et le geste suivent la part de sulfate.
  const pointerSetting = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (event.clientX - bounds.left - 14) / Math.max(1, bounds.width - 28)));
    const ratio = Math.min(limit, Math.max(0, Math.round(shareToRatio(fraction * shareMax) * 20) / 20));
    // One solve per graduation, including the first press in manual mode.
    if (ratio !== lastPointerRatio.current) {
      lastPointerRatio.current = ratio;
      onChange(ratio);
    }
  };
  const pointerStart: React.PointerEventHandler<HTMLDivElement> = event => {
    if (event.button !== 0 || activePointer.current !== null) return;
    event.preventDefault();
    inputRef.current?.focus();
    activePointer.current = event.pointerId;
    lastPointerRatio.current = null;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerSetting(event);
  };
  const pointerEnd: React.PointerEventHandler<HTMLDivElement> = event => {
    if (activePointer.current !== event.pointerId) return;
    if (event.type === 'pointerup') pointerSetting(event);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    activePointer.current = null;
  };
  const keyboardChange: React.KeyboardEventHandler<HTMLInputElement> = event => {
    const steps: Record<string, number> = { ArrowRight: 0.05, ArrowUp: 0.05, ArrowLeft: -0.05, ArrowDown: -0.05, PageUp: 0.5, PageDown: -0.5 };
    if (event.key in steps) {
      event.preventDefault();
      changeSetting(clampedSetting + steps[event.key]);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      changeSetting(event.key === 'Home' ? 0 : limit);
    }
  };

  return (
    <div className={`panel px-3 py-3 ${className}`}>
      <label htmlFor={id} className="ratio-title block text-sm font-semibold text-cave-200"><span className="sm:hidden">SO₄ ⇄ Cl</span><span className="hidden sm:inline">Rapport sulfate / chlorure</span><span className="ratio-orientation block text-2xs font-normal text-cave-400">{label}</span></label>
      <dl className="ratio-readings mt-2 grid grid-cols-2 gap-x-3">
        <div>
          <dt className="flex items-center gap-1.5 text-2xs text-cave-400"><span aria-hidden className="h-2 w-2 rounded-full bg-ebc-straw" />Réglage</dt>
          <dd aria-label="Rapport réglé" className="reading text-lg text-ebc-straw">{settingText}{safeSetting !== Infinity && <span className="reading-unit"> : 1</span>}</dd>
        </div>
        <div className="text-right">
          <dt className="flex items-center justify-end gap-1.5 text-2xs text-cave-400"><span aria-hidden className="h-2 w-2 rounded-full bg-water" />Obtenu</dt>
          <dd aria-label="Rapport obtenu" className={`reading text-lg ${outside ? 'text-ebc-amber' : 'text-water'}`}>{actualText}{finiteActual !== null && <span className="reading-unit"> : 1</span>}</dd>
        </div>
      </dl>
      <div className="ratio-track relative mt-1 touch-none cursor-pointer"
        onPointerDown={pointerStart}
        onPointerMove={event => { if (activePointer.current === event.pointerId) pointerSetting(event); }}
        onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={() => { activePointer.current = null; }}>
        <div className="pointer-events-none absolute inset-y-0 inset-x-3.5" aria-hidden>
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-cave-700" />
          {target && <div className="absolute top-1/2 -translate-y-1/2 h-4 rounded-full border border-hop bg-hop/25"
            style={{ left: `${position(target.min)}%`, width: `${Math.max(0, position(target.max) - position(target.min))}%` }} />}
          {[0, ...(limit > 1 ? [1] : []), limit].map(tick => <span key={tick} data-ratio-tick={tick}
            className="absolute top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-cave-400"
            style={{ left: `${position(tick)}%` }} />)}
        </div>
        <input ref={inputRef} id={id} name="ratio_slider_range" autoComplete="off" data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true"
          type="range" role="slider" min={0} max={limit} step="any" value={clampedSetting}
          data-ratio={clampedSetting} aria-label="SO₄ ⇄ Cl" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={clampedSetting}
          aria-describedby={`${id}-help`}
          aria-valuetext={`Réglage ${settingText}${safeSetting === Infinity ? '' : ' pour 1'} ; Obtenu ${actualText}${finiteActual === null ? '' : ' pour 1'}${label ? ` — ${label}` : ''}${profileText ? ` ; ${profileText}` : ''}`}
          onChange={event => changeSetting(Number(event.target.value))} onKeyDown={keyboardChange}
          className="pointer-events-none relative block w-full h-11 appearance-none bg-transparent rounded-control
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-ebc-straw focus-visible:outline-offset-2
            [&::-webkit-slider-runnable-track]:h-11 [&::-webkit-slider-runnable-track]:bg-transparent
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7
            [&::-webkit-slider-thumb]:mt-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ebc-straw
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-cave-950
            [&::-webkit-slider-thumb]:opacity-0
            [&::-moz-range-track]:h-11 [&::-moz-range-track]:bg-transparent
            [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-ebc-straw [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-cave-950 [&::-moz-range-thumb]:opacity-0" />
        <div aria-hidden className="pointer-events-none absolute inset-x-3.5 top-1/2">
          <span data-ratio-setting data-ratio={clampedSetting} className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cave-950 bg-ebc-straw"
            style={{ left: `${position(clampedSetting)}%` }} />
          {knownActual && <span data-ratio-obtained data-ratio={actual} className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cave-950 bg-water"
            style={{ left: `${position(actual as number)}%` }} />
          }
        </div>
      </div>
      <div className="ratio-ticks relative mx-3.5 h-4 text-2xs text-cave-400" aria-hidden>
        <span className="absolute left-0">0:1</span>
        {limit > 1 && <span className="absolute -translate-x-1/2" style={{ left: `${position(1)}%` }}>1:1</span>}
        <span className="absolute right-0">{frenchNumber(limit)}:1</span>
      </div>
      <div className="ratio-directions mt-1 flex justify-between gap-2 text-2xs text-cave-400"><span className="min-w-0 flex-1">Plus de chlorure</span><span className="min-w-0 flex-1 text-right">Plus de sulfate</span></div>
      <div id={`${id}-help`} className="ratio-help mt-2 space-y-1 text-2xs">
        {ions && <p aria-label="Concentrations du rapport" className="text-cave-200">SO₄ {frenchNumber(ions.so4, 1)} ppm · Cl {frenchNumber(ions.cl, 1)} ppm</p>}
        <div className="ratio-profile flex flex-wrap justify-between gap-x-2 gap-y-1">
          {target && <span className={outside ? 'text-ebc-amber' : 'text-cave-400'}><span className="ratio-profile-short hidden" aria-hidden>Profil {frenchNumber(target.min)}–{frenchNumber(target.max)}</span><span className="ratio-profile-full">{profileText}</span></span>}
        </div>
        {different && <p className="ratio-explanation text-cave-400">Les doses actuelles donnent un rapport différent du réglage.</p>}
        {(withoutChloride || finiteActual !== null && finiteActual > limit) && <p className="ratio-explanation text-cave-400">Rapport obtenu au-delà de la piste ({frenchNumber(limit)}:1).</p>}
        {safeSetting !== Infinity && safeSetting > limit && <p className="ratio-explanation text-cave-400">Réglage au-delà de la piste ({frenchNumber(limit)}:1).</p>}
        <p className="ratio-explanation text-cave-400">Déplacer recalcule les sels.{!followingTarget && ' Réglage initialisé depuis les doses actuelles.'}</p>
      </div>
    </div>
  );
};
