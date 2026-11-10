import { Input, type InputElement } from './Input';
import React, { useRef } from 'react';
import { parseDecimal, useNumericDraft } from './numericInput';
import { useCoarsePointer } from './useViewport';

/**
 * Champ numérique NU — remplaçant direct de `<input type="number">`.
 *
 * ⚠️ Pourquoi il existe à côté de `NumericField` : l'application compte une
 * quarantaine de champs numériques déjà posés dans leur propre `<Field>`, avec
 * leur étiquette, leur grille et leurs classes. `NumericField` apporte tout
 * cela avec lui et les aurait tous fait bouger. Celui-ci ne change QUE le
 * comportement de saisie et garde le `className` du site d'appel.
 *
 * Ce qu'il corrige par rapport à `type="number"` :
 *   - la VIRGULE du clavier français, que `type="number"` refuse en renvoyant
 *     une chaîne vide — d'où les zéros enregistrés à la place des montants ;
 *   - l'EFFACEMENT, qui remettait la valeur à zéro dès le premier caractère
 *     supprimé, empêchant de vider un champ pour retaper ;
 *   - le CLAVIER DU SYSTÈME, remplacé au doigt par le pavé intégré quand
 *     `pad` est demandé.
 *
 * L'ancien `onChange={(e) => setX(parseFloat(e.target.value) || 0)}` devient
 * `onValue={setX}` : le composant ne remonte QUE des nombres lisibles.
 */

interface NumberInputProps {
  /** Décimales affichées hors frappe (un montant : 2). Absent : affichage inchangé. */
  fractionDigits?: number;
  /** `undefined` sur un champ facultatif non renseigné. */
  value: number | undefined;
  /** Reçoit le nombre lu, ou la sentinelle emptyValue explicitement choisie. */
  onValue: (next: any) => void;
  className?: string;
  min?: number;
  max?: number;
  /** Grandeur entière : jours, minutes, nombre de sachets. */
  integer?: boolean;
  /**
   * Valeur remontée quand le champ est vidé. `undefined` pour un champ
   * facultatif, où « vide » signifie « non renseigné » et non « zéro ».
   */
  emptyValue?: number | undefined;
  /** Ouvre le pavé intégré au lieu du clavier du système, sur téléphone. */
  pad?: boolean;
  /**
   * Dit qu'une valeur tapée hors bornes a été ramenée (`{ saisi, retenu }`, à la sortie du champ), puis `null` à la frappe suivante.
   * Une valeur refusée ne disparaît jamais en silence ; l'appelant choisit où l'écrire.
   */
  onRefus?: (refus: { saisi: number; retenu: number | undefined } | null) => void;
  /**
   * Hors bornes, la saisie est REFUSÉE au lieu d'être ramenée à la borne : le champ reprend la valeur qu'il avait à l'entrée, `onRefus` la dit
   * (`retenu` = cette valeur ; `undefined` : le champ était vide) et le champ est `aria-invalid` tant que le message est là. Comme VI-9 (SaltDoseControl).
   */
  rejeter?: boolean;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: React.AriaAttributes['aria-invalid'];
}

export const NumberInput: React.FC<NumberInputProps> = (props) => {
  const {
    value,
    onValue,
    className = '',
    min,
    max,
    integer = false,
    pad: _pad = false,
    onRefus,
    rejeter = false,
    placeholder,
    disabled,
    required,
    autoFocus,
    id,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid
  } = props;
  const emptyValue = 'emptyValue' in props ? props.emptyValue : 0;
  const inputRef = useRef<InputElement>(null);
  const coarse = useCoarsePointer();
  const avant = useRef<number | undefined>(value);
  const { draft, push, settle, revert, onFocusChange } = useNumericDraft(value, onValue, { emptyValue, fractionDigits: props.fractionDigits });

  return (
    <Input
      ref={inputRef}
      id={id}
      name={id ? `num_${id}` : undefined}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      enterKeyHint="next"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      data-form-type="other"
      data-lpignore="true"
      data-1p-ignore="true"
      data-bwignore="true"
      autoFocus={!coarse && autoFocus}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      value={draft}
      onFocus={(e) => { avant.current = value; onFocusChange(true); e.currentTarget.select(); }}
      onBlur={() => {
        // Une valeur ramenée dans les bornes se dit (RX-2) : le nombre tapé (arrondi si l'entier est demandé) et celui que la recette retient.
        const saisi = parseDecimal(draft);
        if (rejeter && saisi !== null && ((min !== undefined && saisi < min) || (max !== undefined && saisi > max))) {
          revert(avant.current ?? emptyValue);
          onRefus?.({ saisi, retenu: avant.current });
          onFocusChange(false);
          return;
        }
        const retenu = settle({ min, max, integer });
        const voulu = saisi === null ? null : integer ? Math.round(saisi) : saisi;
        if (onRefus && saisi !== null && retenu !== null && retenu !== undefined && voulu !== retenu) onRefus({ saisi, retenu });
        onFocusChange(false);
      }}
      onChange={(e) => { onRefus?.(null); push(e.target.value); }}
      className={className}
    />
  );
};
