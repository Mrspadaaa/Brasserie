import React, { forwardRef, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useCoarsePointer } from './useViewport';

/** Hints for desktop autofill and password-manager extensions. Not sufficient on Android. */
export const noAutofillProps = {
  autoComplete: 'off',
  autoCorrect: 'off',
  autoCapitalize: 'none',
  spellCheck: false,
  'data-form-type': 'other',
  'data-lpignore': 'true',
  'data-1p-ignore': 'true',
  'data-bwignore': 'true'
} as const;

export type InputElement = HTMLInputElement | HTMLTextAreaElement;
export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof React.DOMAttributes<HTMLInputElement> | 'type'> & React.DOMAttributes<InputElement> & {
  type?: 'text' | 'search' | 'tel' | 'email' | 'url';
};

/**
 * Native text entry, kept on one line on touch devices.
 *
 * Chrome Android ignores autocomplete="off" for its manual password/card/address
 * accessory. Chromium's ManualFillingController excludes kFillableTextArea even
 * when suggestions exist. A real textarea also preserves selection, IME, labels,
 * required fields and form submission data, unlike a contenteditable replacement.
 * See chrome/browser/keyboard_accessory/android/manual_filling_controller_impl.cc
 * and components/autofill/content/renderer/password_autofill_agent.cc in Chromium.
 */
export const Input = forwardRef<InputElement, InputProps>(function Input(
  { type = 'text', autoFocus, inputMode, enterKeyHint, onChange, onKeyDown, className, style, ...props }, ref
) {
  const coarse = useCoarsePointer();
  const singleLine = coarse;
  const fieldRef = useRef<InputElement | null>(null);
  const validatorRef = useRef<HTMLInputElement | null>(null);
  const [siblingLabel, setSiblingLabel] = useState<string>();

  // Field also supports a label directly before the control without htmlFor.
  // Explicit and wrapping labels keep their native association and click behavior.
  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field || field.labels?.length) return;
    const label = field.parentElement?.querySelector<HTMLLabelElement>(':scope > label:not([for])');
    if (!label) return;
    setSiblingLabel(label.textContent?.trim() || undefined);
    const focus = () => { if (!field.disabled) field.focus(); };
    label.addEventListener('click', focus);
    return () => label.removeEventListener('click', focus);
  }, [singleLine, props.id]);

  const syncValidity = (field: InputElement) => {
    if (!singleLine || !(field instanceof HTMLTextAreaElement)) return;
    if (type !== 'email' && type !== 'url' && !props.pattern) {
      field.setCustomValidity('');
      return;
    }
    // Keep the browser's email/URL/pattern validation on the native mobile editor.
    // The probe is detached: it never receives focus or participates in autofill.
    const probe = validatorRef.current ??= document.createElement('input');
    probe.type = type;
    probe.multiple = props.multiple ?? false;
    if (props.pattern) probe.pattern = props.pattern;
    else probe.removeAttribute('pattern');
    probe.value = field.value;
    field.setCustomValidity(probe.validationMessage);
  };
  useLayoutEffect(() => {
    if (fieldRef.current) syncValidity(fieldRef.current);
  }, [singleLine, type, props.value, props.pattern, props.multiple]);

  const setRef = useCallback((field: InputElement | null) => {
    fieldRef.current = field;
    if (typeof ref === 'function') ref(field);
    else if (ref) ref.current = field;
  }, [ref]);

  const shared = {
    ...props,
    ...noAutofillProps,
    // Named search controls retain their searchbox role; combobox roles pass through.
    role: props.role ?? (type === 'search' ? 'searchbox' : undefined),
    'aria-label': props['aria-label'] ?? (props['aria-labelledby'] ? undefined : siblingLabel),
    autoFocus: !coarse && autoFocus,
    inputMode: inputMode ?? (type === 'search' ? 'search' : type === 'email' ? 'email' : type === 'tel' ? 'tel' : type === 'url' ? 'url' : 'text'),
    enterKeyHint,
    className,
    onChange: (event: React.ChangeEvent<InputElement>) => {
      if (singleLine && /[\r\n]/.test(event.currentTarget.value)) {
        const field = event.currentTarget;
        const start = field.selectionStart ?? field.value.length;
        const end = field.selectionEnd ?? start;
        const before = field.value;
        field.value = before.replace(/[\r\n]/g, '');
        field.setSelectionRange(before.slice(0, start).replace(/[\r\n]/g, '').length, before.slice(0, end).replace(/[\r\n]/g, '').length);
      }
      syncValidity(event.currentTarget);
      onChange?.(event);
    },
    onKeyDown: (event: React.KeyboardEvent<InputElement>) => {
      onKeyDown?.(event);
      if (!singleLine || event.defaultPrevented || event.key !== 'Enter' || event.nativeEvent.isComposing || event.keyCode === 229) return;
      // These containers own Enter (next field / select a search result).
      if (event.currentTarget.closest('[data-form-nav], [cmdk-root]')) return;
      event.preventDefault();
      if (event.currentTarget.form) event.currentTarget.form.requestSubmit();
      else if (enterKeyHint === 'done') event.currentTarget.blur();
    }
  };

  if (singleLine) {
    return <textarea {...shared} ref={setRef} rows={1} wrap="off" data-single-line="true" data-input-type={type}
      aria-multiline={props.role === 'combobox' ? undefined : false} style={{ ...style, resize: 'none', whiteSpace: 'pre', overflow: 'hidden', verticalAlign: 'middle' }} />;
  }
  return <input {...shared} ref={setRef} type={type} style={style} />;
});

/** Multiline entry has the same protection, with native line breaks and selection. */
export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { autoFocus, ...props }, ref
) {
  const coarse = useCoarsePointer();
  return <textarea {...props} {...noAutofillProps} ref={ref} autoFocus={!coarse && autoFocus} />;
});
