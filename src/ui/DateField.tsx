import React, { useId, useMemo } from 'react';
import { Field } from './FormNav';
import { ChoixDate } from './ChoixDate';

/**
 * Saisie de date, avec les raccourcis qui couvrent la quasi-totalité des cas.
 *
 * ⚠️ Ce que ça règle : dans une brasserie, une écriture se saisit le soir pour
 * un achat du matin, ou le lundi pour le marché du samedi. Le sélecteur natif
 * demande trois gestes (ouvrir, naviguer, choisir) pour écrire « hier ». Les
 * pastilles règlent le cas courant en un appui, et le champ natif reste là pour
 * les autres — GESTE-DATE-PARTOUT (22.11) : la frise partagée du Calendrier, au jour (`ChoixDate`), à la place du champ natif et des ‹ › de mois.
 *
 * L'application stocke les dates en `JJ.MM.AAAA` (format suisse) ; l'élément
 * natif exige `AAAA-MM-JJ`. La conversion est faite ici, une seule fois, plutôt
 * que réinventée dans chaque écran.
 */

/** Les mois en français (fr-CH) : le sélecteur natif `type="month"` suit la langue du navigateur (« November 2026 »), jamais celle de l'app. */
export const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'] as const;

/** `JJ.MM.AAAA` ➔ `AAAA-MM-JJ`. Chaîne vide si la date est illisible. */
export function toIsoDate(swiss: string): string {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec((swiss || '').trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

/** `AAAA-MM-JJ` ➔ `JJ.MM.AAAA`. */
export function toSwissDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso || '').trim());
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
}

/** Keep the day when changing month, clamping only when that day does not exist. */
export function changeSwissMonth(swiss: string, month: string): string {
  const source = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(swiss);
  const target = /^(\d{4})-(\d{2})$/.exec(month);
  if (!source || !target || +target[2] < 1 || +target[2] > 12 || +target[1] < 1900 || +target[1] > 2200) return swiss;
  const lastDay = new Date(Date.UTC(+target[1], +target[2], 0)).getUTCDate();
  return `${String(Math.min(+source[1], lastDay)).padStart(2, '0')}.${target[2]}.${target[1]}`;
}

export function shiftSwissMonth(swiss: string, offset: number): string {
  const source = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(swiss);
  if (!source) return swiss;
  const date = new Date(Date.UTC(+source[3], +source[2] - 1 + offset, 1));
  return changeSwissMonth(swiss, `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`);
}

/** Date du jour, décalée de `offsetDays`, au format suisse. */
export function swissToday(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    d.getFullYear()
  ].join('.');
}

interface DateFieldProps {
  label: string;
  /** Date au format suisse `JJ.MM.AAAA`. */
  value: string;
  onChange: (swissDate: string) => void;
  hint?: string;
  error?: string;
  /** Raccourcis proposés. Par défaut : aujourd'hui, hier, il y a une semaine. `offsetMonths` pose le jour d'aujourd'hui dans un autre
   *  mois, borné au dernier jour (D262b). */
  shortcuts?: Array<{ label: string; offsetDays: number; offsetMonths?: number }>;
  /** Optional calendar for this usage; other fields keep the device's local day. */
  shortcutDate?: (offsetDays: number) => string;
  disabled?: boolean;
}

const DEFAULT_SHORTCUTS: NonNullable<DateFieldProps['shortcuts']> = [
  { label: "Aujourd'hui", offsetDays: 0 },
  { label: 'Hier', offsetDays: -1 },
  { label: 'Il y a 7 j', offsetDays: -7 }
];

export const DateField: React.FC<DateFieldProps> = ({
  label,
  value,
  onChange,
  hint,
  error,
  shortcuts = DEFAULT_SHORTCUTS,
  shortcutDate,
  disabled = false
}) => {
  const id = useId();
  const iso = useMemo(() => toIsoDate(value), [value]);

  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      <div className="space-y-1">
        <ChoixDate id={id} label={label} valeur={iso} onChange={d => onChange(toSwissDate(d))} disabled={disabled} />
        <div className="flex flex-wrap gap-1">
          {shortcuts.map((s) => {
            const day = shortcutDate ? shortcutDate(s.offsetDays) : swissToday(s.offsetDays);
            const target = s.offsetMonths ? shiftSwissMonth(day, s.offsetMonths) : day;
            const active = value === target;
            return (
              <button
                key={s.label}
                type="button"
                disabled={disabled}
                aria-pressed={active}
                onClick={() => onChange(target)}
                className={`min-h-touch-sm py-0.5 px-1.5 rounded-control border text-xs transition-colors ${
                  active
                    ? 'bg-ebc-straw/15 border-ebc-straw text-ebc-straw font-medium'
                    : 'bg-cave-900 border-cave-700 text-cave-200 hover:text-cave-50'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
    </Field>
  );
};
