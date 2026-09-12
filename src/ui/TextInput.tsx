import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Input, type InputElement, type InputProps } from './Input';
import { inputClass } from './FormNav';

export type TextInputProps = Omit<InputProps, 'value' | 'defaultValue' | 'onChange' | 'type'> & {
  value: string;
  onChange: (value: string) => void;
};

export interface TextInputHandle {
  focus: () => void;
  blur: () => void;
}

/** String-value adapter for the shared, protected native editor. */
export const TextInput = forwardRef<TextInputHandle, TextInputProps>(function TextInput(
  { value, onChange, className = inputClass, enterKeyHint = 'done', ...props }, ref
) {
  const fieldRef = useRef<InputElement>(null);
  useImperativeHandle(ref, () => ({
    focus: () => fieldRef.current?.focus(),
    blur: () => fieldRef.current?.blur()
  }), []);

  return <Input {...props} ref={fieldRef} type="text" value={value ?? ''}
    onChange={event => onChange(event.currentTarget.value)} className={className}
    enterKeyHint={enterKeyHint} aria-required={props.required || undefined} />;
});
