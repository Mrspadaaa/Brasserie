import React, { useId, useRef } from 'react';
import { useDensity } from './useViewport';

/**
 * Choix parmi deux à cinq options mutuellement exclusives.
 *
 * ⚠️ Pourquoi ce n'est pas un `Combobox` : ouvrir une liste pour choisir entre
 * « TWINT / Espèces / Virement / Facture » coûte deux gestes là où un seul
 * suffit, et cache les options tant qu'on n'a pas tapé. Au doigt comme au
 * clavier, un choix court se montre entièrement.
 *
 * Au clavier, c'est un groupe radio conforme : Tab entre dans le groupe,
 * ← → ↑ ↓ parcourent et sélectionnent, Tab en sort. Un seul arrêt de
 * tabulation pour tout le groupe — c'est ce qui rend un formulaire rapide.
 */

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  /** Précision sous le libellé. Réservée aux dispositions verticales. */
  hint?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: NoInfer<T>) => void;
  /**
   * `NoInfer` : sans lui, TypeScript déduit `T` du tableau d'options, où les
   * chaînes littérales s'élargissent en `string` — et `onChange` recevait alors
   * un `string` incompatible avec l'état typé de l'appelant. Le type vient donc
   * de `value`, les options s'y conforment.
   */
  options: Array<SegmentOption<NoInfer<T>>>;
  /** Étiquette du groupe, lue par les lecteurs d'écran. */
  label: string;
  /** `row` tient sur une ligne ; `grid` empile quand les libellés sont longs. */
  layout?: 'row' | 'grid';
  className?: string;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  layout = 'row',
  className = ''
}: SegmentedControlProps<T>) {
  const groupId = useId();
  const groupRef = useRef<HTMLDivElement>(null);

  /*
   * ⚠️ Clavier ouvert, la disposition en grille est ruineuse : cinq options sur
   * deux colonnes font trois rangées, soit ~165 px — plus que le formulaire
   * qu'elles servent à remplir. Elles passent alors sur une seule ligne qui
   * défile latéralement, sans qu'aucune option ne disparaisse.
   *
   * Seule la grille bascule : une disposition `row` tient déjà sur une ligne.
   */
  const tight = useDensity() === 'tight';
  const scrolls = tight && layout === 'grid';

  const move = (direction: 1 | -1) => {
    const usable = options.filter((o) => !o.disabled);
    const i = usable.findIndex((o) => o.value === value);
    const next = usable[(i + direction + usable.length) % usable.length];
    if (next) {
      onChange(next.value);
      groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[options.indexOf(next)]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        move(1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        move(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={`${
        scrolls
          ? 'flex gap-1 p-0.5 overflow-x-auto overscroll-x-contain scrollbar-none'
          : layout === 'row'
            ? 'flex gap-1 p-0.5'
            : 'grid grid-cols-2 sm:grid-cols-3 gap-1 p-0.5'
      } rounded-control bg-cave-950 border border-cave-800 ${className}`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            id={`${groupId}-${opt.value}`}
            aria-checked={active}
            disabled={opt.disabled}
            // Un seul arrêt de tabulation pour le groupe : on entre sur
            // l'option cochée, les flèches font le reste.
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(opt.value)}
            className={`min-h-touch px-1.5 py-0.5 rounded-control text-2xs leading-tight transition-colors
                        flex items-center justify-center gap-1
                        ${scrolls ? 'shrink-0 whitespace-nowrap' : 'flex-1 min-w-0'}
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-ebc-straw
                        disabled:opacity-40 disabled:cursor-not-allowed
                        ${
                          active
                            ? 'bg-ebc-straw text-cave-950 font-semibold'
                            : 'text-cave-200 hover:text-cave-50 hover:bg-cave-900'
                        }`}
          >
            {opt.icon}
            <span className="min-w-0 break-words">
              {opt.label}
              {/* La précision sous le libellé est le premier sacrifice quand la
                  place manque : elle double la hauteur de chaque option. */}
              {opt.hint && layout === 'grid' && !tight && (
                <span
                  className={`block text-xs truncate ${
                    active ? 'text-cave-950/70' : 'text-cave-400'
                  }`}
                >
                  {opt.hint}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
