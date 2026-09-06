import React, { useId, useMemo } from 'react';
import { Field, inputClass } from './FormNav';

/**
 * Saisie de date, avec les raccourcis qui couvrent la quasi-totalité des cas.
 *
 * ⚠️ Ce que ça règle : dans une brasserie, une écriture se saisit le soir pour
 * un achat du matin, ou le lundi pour le marché du samedi. Le sélecteur natif
 * demande trois gestes (ouvrir, naviguer, choisir) pour écrire « hier ». Les
 * pastilles règlent le cas courant en un appui, et le champ natif reste là pour
 * les autres — c'est lui qui garde le clavier numérique du téléphone et le
 * calendrier de l'ordinateur.
 *
 * L'application stocke les dates en `JJ.MM.AAAA` (format suisse) ; l'élément
 * natif exige `AAAA-MM-JJ`. La conversion est faite ici, une seule fois, plutôt
 * que réinventée dans chaque écran.
 */

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
  /** Raccourcis proposés. Par défaut : aujourd'hui, hier, il y a une semaine. */
  shortcuts?: Array<{ label: string; offsetDays: number }>;
  disabled?: boolean;
}

const DEFAULT_SHORTCUTS = [
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
  disabled = false
}) => {
  const id = useId();
  const iso = useMemo(() => toIsoDate(value), [value]);

  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      <div className="space-y-1.5">
        <input
          id={id}
          name="date_picker_field"
          autoComplete="off"
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
          data-bwignore="true"
          type="date"
          value={iso}
          disabled={disabled}
          onChange={(e) => onChange(toSwissDate(e.target.value))}
          className={`${inputClass} [color-scheme:dark]`}
        />

        <div className="flex flex-wrap gap-1.5">
          {shortcuts.map((s) => {
            const target = swissToday(s.offsetDays);
            const active = value === target;
            return (
              <button
                key={s.label}
                type="button"
                // Hors du parcours de tabulation : ce sont des raccourcis, pas
                // des étapes du formulaire. Le champ reste le chemin principal.
                tabIndex={-1}
                disabled={disabled}
                onClick={() => onChange(target)}
                className={`min-h-[34px] sm:min-h-touch py-1 px-2.5 rounded-control border text-xs sm:text-sm transition-colors ${
                  active
                    ? 'bg-ebc-straw/15 border-ebc-straw text-ebc-straw font-medium'
                    : 'bg-cave-900 border-cave-700 text-cave-300 hover:text-cave-50'
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
