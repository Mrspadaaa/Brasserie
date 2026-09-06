import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { BrewTag, BrewTagTone } from './BrewTag';
import { useKeyboardInset } from './useViewport';

export interface BrewChoiceOption {
  value: string;
  label: string;
  detail?: string;
  group?: string;
  tag?: { label: string; tone: BrewTagTone };
}

/** Choix sur toute une ligne : texte complet, aucune petite cible native superposée au titre. */
export function BrewChoice({
  label,
  title = label,
  value,
  options,
  onChange,
  placeholder = 'Choisir…',
  heading = false,
  searchable = false
}: {
  label: string;
  title?: string;
  value: string;
  options: BrewChoiceOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  heading?: boolean;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const inset = useKeyboardInset();
  const selected = options.find((option) => option.value === value);
  const normalize = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('fr');
  const filtered = options.filter((option) =>
    normalize(`${option.label} ${option.group ?? ''}`).includes(normalize(query.trim()))
  );
  useLayoutEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) {
      node.showModal();
      const target =
        node.querySelector<HTMLElement>('[aria-pressed="true"]') ??
        node.querySelector<HTMLElement>('[data-brew-choice]');
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: 'nearest' });
    } else if (!open && node.open) {
      node.close();
      trigger.current?.focus({ preventScroll: true });
    }
  }, [open]);
  const control = (
    <button
      ref={trigger}
      type="button"
      aria-label={label}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={id}
      className={`brew-choice-trigger ${heading ? 'is-heading' : ''}`}
      onClick={() => {
        setQuery('');
        setOpen(true);
      }}
    >
      <span>{selected?.label ?? placeholder}</span>
      <ChevronDown size={20} aria-hidden="true" />
    </button>
  );
  return (
    <>
      {heading ? <h2 aria-label={selected?.label ?? placeholder}>{control}</h2> : control}
      <dialog
        ref={dialog}
        id={id}
        aria-label={title}
        className="brew-choice-dialog"
        style={inset ? { bottom: inset, maxHeight: `calc(100dvh - ${inset + 12}px)` } : undefined}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') event.stopPropagation();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const box = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < box.left ||
              event.clientX > box.right ||
              event.clientY < box.top ||
              event.clientY > box.bottom
            )
              setOpen(false);
          }
        }}
      >
        <header>
          <h2>{title}</h2>
          <button type="button" aria-label="Fermer les choix" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </header>
        {searchable && (
          <label className="brew-choice-search">
            <Search size={18} />
            <input
              type="search"
              aria-label="Rechercher un ingrédient"
              placeholder="Rechercher un ingrédient"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        )}
        <div
          className="brew-choice-options"
          onKeyDown={(event) => {
            if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
            const rows = [
              ...event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-brew-choice]')
            ];
            const index = rows.indexOf(document.activeElement as HTMLButtonElement);
            const next =
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? rows.length - 1
                  : (index + (event.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length;
            event.preventDefault();
            rows[next]?.focus();
          }}
        >
          {filtered.map((option, index) => (
            <React.Fragment key={option.value}>
              {option.group && option.group !== filtered[index - 1]?.group && (
                <h3>{option.group}</h3>
              )}
              <button
                type="button"
                data-brew-choice
                aria-label={option.label}
                aria-description={[option.detail, option.tag?.label].filter(Boolean).join('. ')}
                aria-pressed={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span className="brew-choice-label">
                  <strong>{option.label}</strong>
                  {option.detail && <small>{option.detail}</small>}
                </span>
                {option.tag && <BrewTag tone={option.tag.tone}>{option.tag.label}</BrewTag>}
                <span className="brew-choice-check" aria-hidden="true">
                  {option.value === value && <Check size={18} />}
                </span>
              </button>
            </React.Fragment>
          ))}
          {!filtered.length && <p className="brew-choice-empty">Aucun ingrédient correspondant.</p>}
        </div>
        <footer>
          <button type="button" onClick={() => setOpen(false)}>
            Annuler
          </button>
        </footer>
      </dialog>
    </>
  );
}
