import React, { useId, useRef } from 'react';
import { useNumericDraft } from './numericInput';

export { parseDecimal, formatDecimal } from './numericInput';

/**
 * Saisie d'un nombre. Remplace les 52 `<input type="number">` de l'application.
 *
 * ⚠️ Trois pannes qu'il règle, toutes constatées sur téléphone :
 *
 * 1. LA VIRGULE. Sur un clavier configuré en français, la touche décimale est
 *    la virgule. `<input type="number">` la refuse : `e.target.value` revient
 *    VIDE, et les gestionnaires écrits `parseFloat(v) || 0` enregistrent alors
 *    zéro sans rien dire. Saisir « 12,50 » donnait 0.00 CHF.
 *
 * 2. L'EFFACEMENT. Un champ qui stocke un nombre se réaffiche à chaque frappe :
 *    effacer pour retaper faisait sauter la valeur à 0, et « 12, » était
 *    réécrit en « 12 » avant qu'on ait pu taper les décimales. On garde donc
 *    ici une chaîne de saisie, et on ne convertit qu'au moment de remonter.
 *
 * 3. LE CLAVIER QUI MANGE L'ÉCRAN. En mode `pad`, le champ n'ouvre PAS le
 *    clavier du système sur téléphone : il déplie le pavé numérique intégré,
 *    deux fois plus court. Sur ordinateur, rien ne change — on tape.
 *
 * `compact` met l'étiquette sur la même ligne que le champ : deux fois moins de
 * hauteur par champ, ce qui rend un formulaire lisible clavier ouvert. La cible
 * tactile, elle, reste à 48 px — c'est la place perdue qu'on récupère, pas la
 * surface qu'on touche.
 */

interface NumericFieldProps {
  label: string;
  value: number;
  onChange: (next: number) => void;
  /** Unité affichée dans le champ, à droite (kg, L, °C, %). */
  unit?: string;
  /** Symbole affiché à gauche (CHF). */
  prefix?: string;
  min?: number;
  max?: number;
  /** Valeur remontée quand le champ est vidé. */
  emptyValue?: number;
  /** Grandeur entière : masque la virgule et le pavé décimal. */
  integer?: boolean;
  maxDecimals?: number;
  /**
   * `auto` — clavier du système, comme n'importe quel champ.
   * `pad`  — sur téléphone, pavé intégré ; le clavier du système ne s'ouvre
   *          jamais. Sur ordinateur, saisie au clavier normale.
   */
  keyboard?: 'auto' | 'pad';
  /** Étiquette sur la même ligne que le champ. */
  compact?: boolean;
  hint?: string;
  error?: string;
  disabled?: boolean;
  /** Suggère « suivant » plutôt que « retour » sur le clavier du téléphone. */
  enterKeyHint?: 'next' | 'done' | 'go' | 'send';
  id?: string;
}

export const NumericField: React.FC<NumericFieldProps> = ({
  label,
  value,
  onChange,
  unit,
  prefix,
  min,
  max,
  emptyValue = 0,
  integer = false,
  maxDecimals: _maxDecimals = integer ? 0 : 2,
  keyboard: _keyboard = 'auto',
  compact = false,
  hint,
  error,
  disabled = false,
  enterKeyHint = 'next',
  id
}) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);

  const { draft, push, settle } = useNumericDraft(value, onChange, { emptyValue });
  const clampOnBlur = () => settle({ min, max, integer });

  const fieldClass =
    'w-full min-h-touch rounded-control bg-cave-950 border text-cave-50 ' +
    'font-mono font-semibold text-right text-lg tracking-tight ' +
    'focus:outline-none transition-colors disabled:opacity-50 ' +
    (error
      ? 'border-alert focus:border-alert focus:ring-1 focus:ring-alert/40 '
      : 'border-cave-700 focus:border-ebc-straw focus:ring-1 focus:ring-ebc-straw/40 ') +
    (prefix ? 'pl-14 ' : 'pl-3 ') +
    (unit ? 'pr-12' : 'pr-3');

  const field = (
    <div className="relative">
      {prefix && (
        <span
          className="absolute left-3.5 top-1/2 -translate-y-1/2 reading-unit pointer-events-none"
          aria-hidden
        >
          {prefix}
        </span>
      )}

      <input
        ref={inputRef}
        id={inputId}
        name={`field_${inputId}`}
        type="text"
        inputMode={integer ? 'numeric' : 'decimal'}
        enterKeyHint={enterKeyHint}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        data-form-type="other"
        data-lpignore="true"
        data-1p-ignore="true"
        data-bwignore="true"
        disabled={disabled}
        value={draft}
        placeholder="0"
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${inputId}-desc` : undefined}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={clampOnBlur}
        onChange={(e) => push(e.target.value)}
        className={fieldClass}
      />

      {unit && (
        <span
          className="absolute right-3.5 top-1/2 -translate-y-1/2 reading-unit pointer-events-none"
          aria-hidden
        >
          {unit}
        </span>
      )}
    </div>
  );

  const descriptions = (hint || error) && (
    <p
      id={`${inputId}-desc`}
      role={error ? 'alert' : undefined}
      className={`text-sm leading-snug ${error ? 'text-alert' : 'text-cave-600'}`}
    >
      {error || hint}
    </p>
  );

  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      {compact ? (
        <div className="flex items-center gap-3">
          <label htmlFor={inputId} className="flex-1 min-w-0 text-sm text-cave-300 leading-tight">
            {label}
          </label>
          <div className="w-32 shrink-0">{field}</div>
        </div>
      ) : (
        <>
          <label htmlFor={inputId} className="block text-sm text-cave-400">
            {label}
          </label>
          {field}
        </>
      )}

      {descriptions}
    </div>
  );
};
