import React, { useState } from 'react';
import { BrewDayState, RecipeSnapshot } from '../types';
import { READING, parseReading, readingKey } from '../domain/brewDay';
import { brewIngredients } from '../domain/brewCompanion';
import { ACIDS } from '../domain/water';
import { BrewUpdate, brewControl, brewInput } from './BrewDayMeasurements';

export function BrewJournal({
  state,
  recipe,
  update
}: {
  state: BrewDayState;
  recipe: RecipeSnapshot;
  update: BrewUpdate;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [undo, setUndo] = useState<(() => void) | null>(null);
  const ingredients = brewIngredients(recipe);
  const entries = [
    ...(state.readings ?? []).map((r) => ({
      key: `r-${readingKey(r)}`,
      at: r.at,
      step: r.stepId,
      label: READING[r.kind].label,
      value: String(r.value),
      unit: r.unit,
      kind: r.kind as string,
      type: 'readings' as const,
      raw: r,
      identity: readingKey(r)
    })),
    ...(state.notes ?? []).map((n) => ({
      key: `n-${n.id}`,
      at: n.at,
      step: n.stepId,
      label: 'Note',
      value: n.text,
      unit: '',
      kind: 'note',
      type: 'notes' as const,
      raw: n,
      identity: n.id
    })),
    ...(state.acidCorrections ?? []).map((c) => ({
      key: `c-${c.id}`,
      at: c.at,
      step: c.stepId,
      label: `Ajout ${ACIDS[c.acid].name}`,
      value: String(c.amount),
      unit: ACIDS[c.acid].unit,
      kind: 'dose',
      type: 'acidCorrections' as const,
      raw: c,
      identity: c.id
    }))
  ].sort((a, b) => b.at - a.at);
  const remove = (entry: (typeof entries)[number]) => {
    const match = (x: any) =>
      entry.type === 'readings' ? readingKey(x) === entry.identity : x.id === entry.identity;
    update((s) => ({
      ...s,
      [entry.type]: ((s[entry.type] as any[]) ?? []).filter((x) => !match(x))
    }));
    setUndo(
      () => () =>
        update((s) => ({
          ...s,
          [entry.type]: [
            ...((s[entry.type] as any[]) ?? []).filter((x) => !match(x)),
            entry.raw
          ].sort((a, b) => a.at - b.at)
        }))
    );
    setEditing(null);
  };
  const save = (entry: (typeof entries)[number]) => {
    const value =
      entry.kind === 'note'
        ? text.trim()
        : entry.kind === 'dose'
          ? /^\d+(?:[.,]\d*)?$/.test(text.trim())
            ? Number(text.replace(',', '.'))
            : null
          : parseReading(text, entry.kind as any);
    if (
      value == null ||
      value === '' ||
      (typeof value === 'number' && (!Number.isFinite(value) || value > 100000))
    ) {
      setError('Valeur invalide : vérifie la quantité et son unité.');
      return;
    }
    setError('');
    update((s) => ({
      ...s,
      [entry.type]: ((s[entry.type] as any[]) ?? []).map((x) =>
        (entry.type === 'readings' ? readingKey(x) : x.id) === entry.identity
          ? {
              ...x,
              [entry.kind === 'note' ? 'text' : entry.kind === 'dose' ? 'amount' : 'value']: value
            }
          : x
      )
    }));
    setEditing(null);
  };
  const download = () => {
    const lines = [
      `${recipe.name} — carnet de brassage`,
      ...ingredients
        .filter((i) => i.planned > 0 || state.additions?.[i.id])
        .map(
          (i) =>
            `${state.additions?.[i.id]?.doneAt != null ? '[x]' : '[ ]'} ${state.additions?.[i.id]?.replacement?.name ?? i.name} : ${state.additions?.[i.id]?.amount ?? i.planned} ${i.unit} (prévu ${i.planned})`
        ),
      '',
      ...entries.map(
        (e) =>
          `${new Date(e.at).toLocaleString('fr-CH')} · ${state.steps.find((s) => s.id === e.step)?.label ?? 'Sans étape'} · ${e.label} ${e.value} ${e.unit}`
      )
    ];
    const url = URL.createObjectURL(
      new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'carnet-brassage.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section aria-label="Journal modifiable" className="space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-cave-50">Journal de cuve</h2>
        <button type="button" className={brewControl} onClick={download}>
          Exporter .txt
        </button>
      </div>
      {undo && (
        <p role="status" className="text-sm text-cave-200">
          Entrée retirée.{' '}
          <button
            type="button"
            className="underline text-ebc-straw min-h-10"
            onClick={() => {
              undo();
              setUndo(null);
            }}
          >
            Annuler la suppression
          </button>
        </p>
      )}
      {error && (
        <p role="alert" className="text-2xs text-ebc-straw">
          {error}
        </p>
      )}
      {!entries.length && (
        <p className="text-sm text-cave-400">
          Les relevés, corrections de pH et notes seront réunis ici.
        </p>
      )}
      {entries.map((e) => (
        <article key={e.key} className="border-b border-cave-800 py-2 text-sm text-cave-200">
          <p className="text-2xs text-cave-400">
            {new Date(e.at).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })} ·{' '}
            {state.steps.find((s) => s.id === e.step)?.label ?? 'Étape non renseignée'}
          </p>
          <p className="break-words">
            <strong>{e.label}</strong> · {e.value} {e.unit}
          </p>
          {editing === e.key ? (
            <form
              className="flex flex-wrap gap-2 mt-1"
              onSubmit={(event) => {
                event.preventDefault();
                save(e);
              }}
            >
              {e.kind === 'note' ? (
                <textarea
                  aria-label={`Corriger ${e.label}`}
                  value={text}
                  maxLength={2000}
                  onChange={(v) => setText(v.target.value)}
                  className={`${brewInput} !h-20`}
                />
              ) : (
                <input
                  aria-label={`Corriger ${e.label}`}
                  value={text}
                  onChange={(v) => setText(v.target.value)}
                  inputMode={e.kind === 'note' ? 'text' : 'decimal'}
                  className={`${brewInput} flex-1 !w-24`}
                />
              )}
              <button className={brewControl} type="submit">
                Enregistrer
              </button>
              <button
                aria-label="Annuler la modification"
                className={brewControl}
                type="button"
                onClick={() => {
                  setEditing(null);
                  setError('');
                }}
              >
                ×
              </button>
            </form>
          ) : (
            <div className="flex gap-4">
              <button
                type="button"
                className="min-h-10 underline text-2xs"
                onClick={() => {
                  setEditing(e.key);
                  setError('');
                  setText(e.value);
                }}
              >
                Modifier
              </button>
              <button
                type="button"
                className="min-h-10 underline text-2xs text-cave-400"
                onClick={() => remove(e)}
              >
                Supprimer
              </button>
            </div>
          )}
        </article>
      ))}
      <p className="text-2xs text-cave-400">
        Pour corriger un ingrédient versé, modifie sa quantité dans la liste des ingrédients.
        Effacer un relevé ne retire rien de la cuve.
      </p>
    </section>
  );
}
