import React, { useId, useRef } from 'react';
import { Field } from './FormNav';
import { useNumericDraft } from './numericInput';
import { useCoarsePointer } from './useViewport';

/**
 * Saisie d'un montant en francs, avec la ventilation TVA sous les doigts.
 *
 * ⚠️ Ce que ça règle : sur un ticket de caisse, le montant lisible est le
 * **TTC**. L'application, elle, raisonne en HT. On saisissait donc un chiffre
 * qu'il fallait calculer de tête, et les écarts d'arrondi se découvraient au
 * bouclement.
 *
 * On tape ce qui est imprimé sur le ticket, et la décomposition s'affiche
 * dessous, en direct.
 *
 * ⚠️ Deuxième point, propre à L'Affinée : tant que la brasserie n'est **pas
 * assujettie** (`config.fiscal.isTvaRegistered === false`), il n'y a aucune TVA
 * à ventiler — ni à facturer, ni à récupérer. Le composant n'affiche alors
 * rien : montrer une ventilation fictive donnerait à croire qu'elle est
 * récupérable.
 */

interface MoneyFieldProps {
  label: string;
  /** Montant TTC, celui du ticket. */
  valueTTC: number;
  onChange: (ttc: number) => void;
  /** Taux applicable : 0.026 (denrées), 0.081 (matériel), 0. */
  tvaRate: number;
  /** Assujettissement réel de la brasserie. */
  isTvaRegistered: boolean;
  hint?: string;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

const chf = (n: number) =>
  n.toLocaleString('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** HT et TVA déduits d'un TTC. Une seule règle d'arrondi, ici. */
export function splitTva(ttc: number, rate: number): { ht: number; tva: number } {
  if (!rate) return { ht: Math.round(ttc * 100) / 100, tva: 0 };
  const ht = Math.round((ttc / (1 + rate)) * 100) / 100;
  return { ht, tva: Math.round((ttc - ht) * 100) / 100 };
}

export const MoneyField: React.FC<MoneyFieldProps> = ({
  label,
  valueTTC,
  onChange,
  tvaRate,
  isTvaRegistered,
  hint,
  error,
  disabled = false,
  autoFocus = false
}) => {
  const id = useId();
  const coarse = useCoarsePointer();
  const { ht, tva } = splitTva(valueTTC, tvaRate);
  const showSplit = isTvaRegistered && tvaRate > 0 && valueTTC > 0;

  const inputRef = useRef<HTMLInputElement>(null);
  const { draft, push, settle } = useNumericDraft(valueTTC, onChange);

  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      <div className="space-y-2">
        <div className="relative">
          <span
            className="absolute left-3.5 top-1/2 -translate-y-1/2 reading-unit pointer-events-none"
            aria-hidden
          >
            CHF
          </span>
          <input
            ref={inputRef}
            id={id}
            name={`val_${id}`}
            type="text"
            inputMode="decimal"
            enterKeyHint="next"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            autoFocus={!coarse && autoFocus}
            value={draft}
            disabled={disabled}
            placeholder="0.00"
            onFocus={(e) => e.currentTarget.select()}
            onBlur={() => {
              settle({ min: 0 });
            }}
            onChange={(e) => push(e.target.value)}
            className="w-full min-h-touch pl-14 pr-3 rounded-control
                       bg-cave-950 border border-cave-700
                       reading text-xl text-cave-50 text-right
                       focus:outline-none focus:border-ebc-straw focus:ring-1 focus:ring-ebc-straw/40
                       transition-colors disabled:opacity-50"
          />
        </div>

        {showSplit && (
          <dl className="flex items-baseline justify-between gap-4 px-1 text-sm">
            <div className="flex items-baseline gap-2">
              <dt className="text-cave-500">Hors taxe</dt>
              <dd className="reading text-cave-100">{chf(ht)}</dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="text-cave-500">
                TVA {(tvaRate * 100).toLocaleString('fr-CH', { maximumFractionDigits: 1 })} %
              </dt>
              <dd className="reading text-cave-300">{chf(tva)}</dd>
            </div>
          </dl>
        )}

        {!isTvaRegistered && valueTTC > 0 && (
          <p className="px-1 text-sm text-cave-600 leading-snug">
            Brasserie non assujettie : aucune TVA à ventiler ni à récupérer.
          </p>
        )}
      </div>
    </Field>
  );
};
