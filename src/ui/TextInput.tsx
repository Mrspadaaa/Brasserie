import React, { useRef, useEffect, useLayoutEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useCoarsePointer } from './useViewport';
import { inputClass } from './FormNav';

export interface TextInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  required?: boolean;
  enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

export interface TextInputHandle {
  focus: () => void;
  blur: () => void;
}

/**
 * Champ texte avec immunité contre la barre d'autocomplétion Chrome / Gboard sur mobile.
 *
 * Sur ordinateur (!coarse) :
 *   - Rendu <input type="text"> classique avec gestion Tab, FormNav et sélection.
 *
 * Sur mobile (coarse) :
 *   - Rendu <div contenteditable="plaintext-only" role="textbox">.
 *   - Pour Chromium, ce n'est pas un WebFormControlElement : le ManualFillingController
 *     ne s'active pas, ce qui élimine définitivement la barre d'accessoire
 *     avec la Clé 🔑, la Carte 💳 et la Localisation 📍 au-dessus de Gboard.
 *   - N'ouvre JAMAIS le clavier au montage (aucun focus automatique).
 *   - Au toucher délibéré de l'utilisateur, ouvre le clavier Gboard standard
 *     sans aucune barre parasite.
 */
export const TextInput = forwardRef<TextInputHandle, TextInputProps>(function TextInput(
  {
    id,
    name,
    value,
    onChange,
    placeholder,
    className = inputClass,
    disabled = false,
    autoFocus = false,
    required = false,
    enterKeyHint = 'done',
    onKeyDown,
    onBlur,
    onFocus,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid
  },
  ref
) {
  const coarse = useCoarsePointer();
  const inputRef = useRef<HTMLInputElement>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const [visibleLabel, setVisibleLabel] = useState<string>();

  // Un label HTML ne nomme ni ne cible un contentEditable. Conserver le vrai
  // libellé du champ au toucher, ainsi que le clic sur ce libellé.
  useLayoutEffect(() => {
    if (!coarse || !divRef.current) return;
    const field = divRef.current;
    const labels = [...document.querySelectorAll('label')].filter(label => (id && label.htmlFor === id) || label.contains(field));
    const siblingLabel = field.parentElement?.querySelector<HTMLLabelElement>(':scope > label:not([for])');
    if (!labels.length && siblingLabel) labels.push(siblingLabel);
    setVisibleLabel(labels.map(label => {
      const copy = label.cloneNode(true) as HTMLLabelElement;
      copy.querySelectorAll('input, select, textarea, [role="textbox"]').forEach(control => control.remove());
      return copy.textContent?.trim();
    }).filter(Boolean).join(' ') || undefined);
    const focus = () => { if (!disabled) field.focus(); };
    labels.forEach(label => label.addEventListener('click', focus));
    return () => labels.forEach(label => label.removeEventListener('click', focus));
  }, [coarse, id, disabled]);

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (coarse) divRef.current?.focus();
      else inputRef.current?.focus();
    },
    blur: () => {
      if (coarse) divRef.current?.blur();
      else inputRef.current?.blur();
    }
  }));

  // Synchronisation de la valeur externe vers le contentEditable
  useEffect(() => {
    if (coarse && divRef.current) {
      const current = (divRef.current.textContent || '').replace(/\r?\n/g, '');
      const next = value ?? '';
      if (current !== next) {
        divRef.current.textContent = next;
      }
    }
  }, [value, coarse]);

  if (!coarse) {
    return (
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoFocus={autoFocus}
        required={required}
        enterKeyHint={enterKeyHint}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        onFocus={onFocus}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        data-form-type="other"
        data-lpignore="true"
        data-1p-ignore="true"
        data-bwignore="true"
      />
    );
  }

  const isEmpty = !value || value.length === 0;

  return (
    <div
      ref={divRef}
      id={id}
      role="textbox"
      tabIndex={disabled ? -1 : 0}
      contentEditable={!disabled ? ('plaintext-only' as any) : false}
      suppressContentEditableWarning
      inputMode="text"
      enterKeyHint={enterKeyHint}
      aria-label={ariaLabel ?? visibleLabel ?? placeholder}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      aria-required={required || undefined}
      aria-disabled={disabled || undefined}
      data-placeholder={placeholder}
      className={`${className} ${isEmpty ? 'empty-text-input' : ''} whitespace-nowrap overflow-x-auto select-text`}
      onInput={(e) => {
        const text = (e.currentTarget.textContent || '').replace(/\r?\n/g, '');
        onChange(text);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
        onKeyDown?.(e);
      }}
      onFocus={onFocus}
      onBlur={(e) => {
        if (divRef.current) {
          const text = (divRef.current.textContent || '').replace(/\r?\n/g, '');
          if (divRef.current.textContent !== text) {
            divRef.current.textContent = text;
          }
        }
        onBlur?.(e);
      }}
    />
  );
});
