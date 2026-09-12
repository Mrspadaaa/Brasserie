import { Input, type InputElement } from './Input';
import React, { useRef } from 'react';
import { useNumericDraft } from './numericInput';
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
  /** `undefined` sur un champ facultatif non renseigné. */
  value: number | undefined;
  /** Reçoit un nombre déjà lu, jamais `NaN`. */
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
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
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
    placeholder,
    disabled,
    required,
    autoFocus,
    id,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy
  } = props;
  const emptyValue = 'emptyValue' in props ? props.emptyValue : 0;
  const inputRef = useRef<InputElement>(null);
  const coarse = useCoarsePointer();
  const { draft, push, settle } = useNumericDraft(value, onValue, { emptyValue });

  return (
    <Input
      ref={inputRef}
      id={id}
      name={id ? `num_${id}` : undefined}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
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
      onFocus={(e) => e.currentTarget.select()}
      onBlur={() => {
        settle({ min, max, integer });
      }}
      onChange={(e) => push(e.target.value)}
      className={className}
    />
  );
};
