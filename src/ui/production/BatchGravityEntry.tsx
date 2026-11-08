import { actualBrewDate } from '../../domain/batchSchedule';
import { Input } from '../Input';
import React, { useState } from 'react';
import type { Batch } from '../../types';
import { catalogDate } from '../../domain/productionCatalog';
import { parseDecimal } from '../numericInput';
import { GRAVITY_CEILING, GRAVITY_FLOOR } from '../../domain/gravityBounds';

/** Température d'un échantillon de moût en fermentation : de la chambre froide (−5 °C) au moût encore chaud d'un départ (45 °C). */
const TEMP_MIN_C = -5;
const TEMP_MAX_C = 45;

type Reading = NonNullable<Batch['gravityLog']>[number];
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const field =
  'w-full min-h-touch px-3 rounded-control bg-cave-950 border border-cave-700 text-base text-cave-50';

/** A follow-up reading is not a final gravity; temperature must come from an actual observation. */
export function BatchGravityEntry({
  batch,
  onAdd
}: {
  batch: Batch;
  onAdd: (reading: Reading) => void;
}) {
  const [open, setOpen] = useState(false),
    [date, setDate] = useState(today),
    [sg, setSg] = useState(''),
    [temperature, setTemperature] = useState('');
  const [error, setError] = useState(''),
    [added, setAdded] = useState(false);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = parseDecimal(sg),
      temp = parseDecimal(temperature),
      timestamp = catalogDate(date),
      brewed = catalogDate(actualBrewDate(batch));
    // AM-40 : mêmes limites physiques que l'OG et la FG (`gravityBounds`), pas 0,900 à 1,300.
    const gravity = value;
    if (gravity === null || gravity < GRAVITY_FLOOR || gravity > GRAVITY_CEILING) {
      setError(`Saisis une densité entre ${GRAVITY_FLOOR.toFixed(3).replace('.', ',')} et ${GRAVITY_CEILING.toFixed(3).replace('.', ',')}, par exemple 1,024.`);
      return;
    }
    if (temperature.trim() && temp !== null && (temp < TEMP_MIN_C || temp > TEMP_MAX_C)) {
      setError(`Saisis une température entre ${TEMP_MIN_C} et ${TEMP_MAX_C} °C (celle de l’échantillon), ou laisse ce champ vide.`);
      return;
    }
    if (
      timestamp === undefined ||
      timestamp > catalogDate(today())! ||
      (brewed !== undefined && timestamp < brewed)
    ) {
      setError('Choisis une date entre le brassage et aujourd’hui.');
      return;
    }
    if (temperature.trim() && temp === null) {
      setError('Saisis la température mesurée, ou laisse ce champ vide.');
      return;
    }
    onAdd({ date, sg: gravity, ...(temp !== null ? { tempC: temp } : {}) });
    setSg('');
    setTemperature('');
    setError('');
    setOpen(false);
    setAdded(true);
  };
  return (
    <section aria-label="Ajouter une mesure de suivi" className="space-y-3">
      {!open ? (
        <>
          <button
            type="button"
            className="w-full min-h-touch rounded-control border border-water text-water text-base font-semibold"
            onClick={() => {
              setOpen(true);
              setAdded(false);
            }}
          >
            Ajouter un relevé de densité
          </button>
          {added && (
            <p className="text-sm text-hop" role="status">
              Relevé ajouté au suivi.
            </p>
          )}
        </>
      ) : (
        <form autoComplete="off" onSubmit={submit} noValidate className="panel p-3 space-y-3">
          <h4 className="font-semibold text-cave-50">Relevé de suivi</h4>
          <label className="block space-y-1.5 text-sm text-cave-400">
            Date du relevé
            <input
              aria-label="Date du relevé"
              className={field}
              type="date"
              value={date}
              max={today()}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5 text-sm text-cave-400">
              Densité (SG)
              <Input
                aria-label="Densité du relevé"
                inputMode="decimal"
                className={field}
                value={sg}
                placeholder="1,024"
                onChange={(e) => setSg(e.target.value)}
              />
            </label>
            <label className="block space-y-1.5 text-sm text-cave-400">
              Température (°C)
              <Input
                aria-label="Température du relevé"
                inputMode="decimal"
                className={field}
                value={temperature}
                placeholder="Facultative"
                onChange={(e) => setTemperature(e.target.value)}
              />
            </label>
          </div>
          <p className="text-sm text-cave-400">
            Ce relevé enrichit la courbe. La FG reste à confirmer séparément.
          </p>
          {error && (
            <p className="text-sm text-alert" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              className="min-h-touch px-3 rounded-control border border-cave-700 text-cave-200"
              onClick={() => {
                setOpen(false);
                setError('');
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!sg.trim()}
              className="flex-1 min-h-touch rounded-control bg-ebc-straw text-cave-950 font-semibold px-3 disabled:opacity-40"
            >
              Ajouter le relevé
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
