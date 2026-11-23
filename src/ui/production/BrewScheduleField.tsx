import React from 'react';
import { DateField } from '../DateField';
import { SegmentedControl } from '../SegmentedControl';
import { breweryDay, normalizeBrewDate } from '../../domain/batchSchedule';

/** Undefined = no date, empty = a date is being chosen. No implicit day is saved. */
export function BrewScheduleField({ value, onChange, disabled = false }: {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}) {
  const now = Date.now(), today = breweryDay(now);
  const mode = value === undefined ? 'undated' : value === today ? 'today' : 'date';
  return <fieldset disabled={disabled} className="min-w-0 space-y-1.5">
    <legend className="mb-1 text-xs text-cave-200">Quand brasser ?</legend>
    <SegmentedControl label="Quand brasser ?" value={mode} layout="row"
      options={[{ value: 'undated', label: 'À définir', disabled }, { value: 'today', label: 'Aujourd’hui', disabled }, { value: 'date', label: 'Autre date', disabled }]}
      onChange={next => onChange(next === 'undated' ? undefined : next === 'today' ? today : '')} />
    {mode === 'date' && <DateField label="Jour prévu" value={value ?? ''} onChange={onChange} disabled={disabled}
      shortcutDate={offset => breweryDay(now, offset)}
      shortcuts={[{ label: 'Demain', offsetDays: 1 }, { label: 'Dans 7 jours', offsetDays: 7 }]}
      error={value && !normalizeBrewDate(value) ? 'Choisis un jour valide.' : undefined} />}
    <p className="text-xs text-cave-400">{value === undefined ? 'Le brassin restera à brasser, sans échéance.' : 'Jour prévu, modifiable avant de commencer.'}</p>
  </fieldset>;
}
