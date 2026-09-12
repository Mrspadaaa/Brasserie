import { Input, type InputElement } from './Input';
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { Units } from '../services/units';
import { useNumericDraft } from './numericInput';
import { useCoarsePointer } from './useViewport';
import { NumPad } from './NumPad';

/**
 * Saisie de quantité.
 *
 * ⚠️ Le problème qu'il règle : les compteurs allaient de 1 en 1 (ou de 10 en 10,
 * codés en dur dans chaque carte). Réceptionner un sac de 25 kg de malt
 * demandait cinquante appuis sur un bouton de 28 px.
 *
 * Ici les paliers viennent de l'UNITÉ de l'article (`Units.stepLadder`) :
 *   kg      → ±1  ±5   (le pas fin, 0.5, vit sur les boutons − et +)
 *   g       → ±100  ±500
 *   sachet  → ±6  ±24     (conditionnements de vente réels)
 *
 * Trois façons de saisir, selon ce qu'on fait :
 *   - les paliers, pour le geste courant ;
 *   - − / +, pour l'ajustement fin, avec répétition à l'appui long ;
 *   - le champ lui-même, pour taper directement une grosse quantité.
 *
 * Toutes les cibles font 56 px : l'app se manipule avec des gants ou les doigts
 * mouillés.
 */

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  unit: string;
  category?: string;
  customLadder?: [number, number, number];
  customStep?: number;
  label?: string;
  /** Valeur de départ, pour proposer une remise à zéro explicite. */
  initialValue?: number;
  min?: number;
  max?: number;
  /** Affiché sous le champ : « 18.5 kg ➔ 43.5 kg ». */
  projection?: React.ReactNode;
  disabled?: boolean;
  autoFocus?: boolean;
  /**
   * Replie les paliers derrière la valeur : une seule rangée au lieu de trois.
   */
  compact?: boolean;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  onChange,
  unit,
  category,
  customLadder,
  customStep,
  label,
  initialValue,
  min = 0,
  max,
  projection,
  disabled = false,
  autoFocus = false,
  compact = false
}) => {
  const coarse = useCoarsePointer();
  const holdTimer = useRef<number | null>(null);
  const repeatTimer = useRef<number | null>(null);
  const inputRef = useRef<InputElement>(null);
  const ladder = customLadder ?? Units.stepLadder(unit, category);
  const fineStep = customStep ?? ladder[0];

  const clamp = useCallback(
    (n: number) => Math.min(max ?? Number.MAX_SAFE_INTEGER, Math.max(min, n)),
    [min, max]
  );

  const { draft, push, settle } = useNumericDraft(value, onChange, { emptyValue: min });

  /**
   * ⚠️ LA VALEUR VIVANTE, dans une ref.
   *
   * C'est LE bug de l'appui long, et il était invisible en lecture : la
   * répétition capturait `bump`, qui capturait `value` au moment où l'intervalle
   * démarrait. Chaque tic recalculait donc `value + delta` depuis la MÊME
   * valeur de départ, et réécrivait sans cesse le même résultat. Garder le
   * doigt appuyé ajoutait un seul palier, puis plus rien — exactement ce que
   * décrit Gaëtan : « l'appui prolongé ne fonctionne pas bien ».
   *
   * La ref est mise à jour AVANT d'appeler `onChange`, pour que le tic suivant
   * reparte du bon endroit sans attendre le rendu de React.
   */
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  /** Une répétition a-t-elle eu lieu ? Sinon le `click` final compterait double. */
  const repeated = useRef(false);

  const bump = useCallback(
    (delta: number) => {
      const next = clamp(Units.round(valueRef.current + delta, unit));
      valueRef.current = next;
      onChange(next);
    },
    [unit, clamp, onChange]
  );

  const stopHold = useCallback(() => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    if (repeatTimer.current) window.clearInterval(repeatTimer.current);
    holdTimer.current = null;
    repeatTimer.current = null;
  }, []);

  /** Appui long : répétition qui accélère, pour couvrir les grands écarts. */
  const startHold = useCallback(
    (direction: 1 | -1) => {
      stopHold();
      repeated.current = false;
      holdTimer.current = window.setTimeout(() => {
        let ticks = 0;
        repeatTimer.current = window.setInterval(() => {
          ticks += 1;
          repeated.current = true;
          const multiplier = ticks > 14 ? 10 : ticks > 6 ? 4 : 1;
          bump(direction * fineStep * multiplier);
        }, 90);
      }, 400);
    },
    [bump, fineStep, stopHold]
  );

  /**
   * L'appui simple, et lui seul.
   *
   * ⚠️ Le `click` partait AUSSI après une répétition : un appui long ajoutait
   * tous ses tics, puis un palier de plus au relâchement. On visait 25 kg et on
   * obtenait 25.5.
   */
  const tap = useCallback(
    (delta: number) => {
      if (repeated.current) {
        repeated.current = false;
        return;
      }
      bump(delta);
    },
    [bump]
  );

  /**
   * ⚠️ La capture du pointeur, sans quoi l'appui long lâche au moindre
   * glissement : le doigt bouge de deux pixels, `pointerleave` part, et la
   * répétition s'arrête. Capturé, l'événement de relâchement revient toujours
   * sur le bouton, où qu'ait glissé le doigt.
   */
  const holdProps = (direction: 1 | -1) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* Navigateur sans capture : on garde la répétition, sans la protection. */
      }
      startHold(direction);
    },
    onPointerUp: stopHold,
    onPointerCancel: stopHold
  });

  const roundBtn = compact
    ? 'w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-control border border-cave-700 bg-cave-850 text-cave-50 flex items-center justify-center transition-colors active:bg-cave-800 disabled:opacity-40 disabled:pointer-events-none'
    : 'w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-control border border-cave-700 bg-cave-850 text-cave-50 flex items-center justify-center transition-colors active:bg-cave-800 disabled:opacity-40 disabled:pointer-events-none';

  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      {label && (
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xs sm:text-sm text-cave-400 font-medium">{label}</span>
          {initialValue !== undefined && value !== initialValue && (
            <button
              type="button"
              onClick={() => onChange(initialValue)}
              className="text-2xs sm:text-sm text-cave-400 hover:text-cave-50 inline-flex items-center gap-1 min-h-touch-sm px-1"
            >
              <RotateCcw className="w-3 h-3" />
              {Units.format(initialValue, unit)}
            </button>
          )}
        </div>
      )}

      {/* Ligne principale : ajustement fin et valeur saisissable au clavier natif */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          type="button"
          aria-label={`Retirer ${fineStep} ${unit}`}
          disabled={disabled || value <= min}
          className={roundBtn}
          onClick={() => tap(-fineStep)}
          {...holdProps(-1)}
        >
          <Minus className={compact ? 'w-3.5 h-3.5 sm:w-4 sm:h-4' : 'w-4 h-4 sm:w-5 sm:h-5'} />
        </button>

        <div className="flex-1 flex items-baseline justify-center gap-0.5 sm:gap-1 min-w-0">
          <Input
            ref={inputRef}
            type="text"
            name="qty_stepper_input"
            inputMode="decimal"
            enterKeyHint="done"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            value={draft}
            disabled={disabled}
            autoFocus={!coarse && autoFocus}
            aria-label={label || `Quantité en ${unit}`}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={() => settle({ min, max })}
            onChange={(e) => push(e.target.value)}
            className={`w-full min-w-0 bg-transparent text-center reading ${
              compact ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'
            } text-ebc-straw rounded-control py-0.5 focus:outline-none focus:bg-cave-850`}
          />
          <span className="reading-unit shrink-0 text-2xs sm:text-sm">{unit}</span>
        </div>

        <button
          type="button"
          aria-label={`Ajouter ${fineStep} ${unit}`}
          disabled={disabled || (max !== undefined && value >= max)}
          className={roundBtn}
          onClick={() => tap(fineStep)}
          {...holdProps(1)}
        >
          <Plus className={compact ? 'w-3.5 h-3.5 sm:w-4 sm:h-4' : 'w-4 h-4 sm:w-5 sm:h-5'} />
        </button>
      </div>

      {/*
        Paliers : le geste courant du brasseur, adapté à l'unité.

        ⚠️ DANS LES DEUX SENS. Ils n'allaient que vers le haut : dépasser d'un
        kilo obligeait à retomber au bouton fin et à l'user, ou à tout retaper
        au clavier. « Je veux aussi une incrémentation de +1 +5 -1 -5. »

        Les deux plus GRANDS barreaux, pas les trois : le petit vit déjà sur les
        boutons − et +, le répéter ici prenait une case pour rien. Sur du kg,
        cela donne exactement −5 −1 +1 +5.
      */}
      {!compact && (
        <div className="grid grid-cols-4 gap-1.5">
          {[-ladder[2], -ladder[1], ladder[1], ladder[2]].map((step) => (
            <button
              key={step}
              type="button"
              disabled={disabled || (step < 0 && value <= min)}
              onClick={() => bump(step)}
              aria-label={`${step > 0 ? 'Ajouter' : 'Retirer'} ${Math.abs(step)} ${unit}`}
              className={`min-h-touch-sm sm:min-h-touch rounded-control border bg-cave-950
                         font-mono text-sm sm:text-base transition-colors active:bg-cave-850
                         disabled:opacity-40 disabled:pointer-events-none ${
                           step < 0
                             ? 'border-cave-700 text-cave-400 hover:border-cave-600 hover:text-cave-200'
                             : 'border-cave-700 text-cave-200 hover:border-ebc-straw hover:text-ebc-straw'
                         }`}
            >
              {step > 0 ? `+${step}` : `−${Math.abs(step)}`}
            </button>
          ))}
        </div>
      )}

      {projection && <div className="text-sm text-cave-400">{projection}</div>}
    </div>
  );
};
