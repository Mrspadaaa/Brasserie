import { brewNow } from '../services/brewClock';
import React, { useState } from 'react';
import {
  Check,
  Clock3,
  Download,
  FlaskConical,
  NotebookPen,
  Pencil,
  Thermometer,
  Trash2,
  X
} from 'lucide-react';
import { BrewDayState, RecipeSnapshot } from '../types';
import { READING, parseReading, readingKey } from '../domain/brewDay';
import { brewIngredients, isBoilStep } from '../domain/brewCompanion';
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
  const [filter, setFilter] = useState('all');
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
  type Event = {
    key: string;
    at: number;
    step?: string;
    label: string;
    value: string;
    unit: string;
    category: string;
    entry?: (typeof entries)[number];
    detail?: string;
  };
  const events: Event[] = entries.map((entry) => ({
    ...entry,
    value:
      entry.kind === 'densite'
        ? Number(entry.value).toFixed(3)
        : entry.type === 'notes'
          ? entry.value
          : entry.value.replace('.', ','),
    category:
      entry.type === 'readings' ? 'measurements' : entry.type === 'notes' ? 'notes' : 'additions',
    entry,
    detail:
      entry.type === 'readings' && entry.raw.roomTemp
        ? entry.kind === 'ph'
          ? 'Échantillon refroidi'
          : entry.kind === 'volume'
            ? 'Volume à 20 °C'
            : 'Densité refroidie ou corrigée'
        : undefined
  }));
  for (const ingredient of ingredients) {
    const actual = state.additions?.[ingredient.id];
    if (actual?.doneAt == null) continue;
    events.push({
      key: `addition-${ingredient.id}`,
      at: actual.doneAt,
      step: ingredient.stepId,
      label: actual.replacement?.name ?? ingredient.name,
      value: String(actual.amount).replace('.', ','),
      unit: ingredient.unit,
      category: 'additions',
      detail: `Ajout en cuve · prévu ${ingredient.planned} ${ingredient.unit}${ingredient.side ? (ingredient.side === 'mash' ? ' · eau d’empâtage' : ' · eau de rinçage') : ''}${actual.replacement ? ` · remplace ${ingredient.name}` : ''}`
    });
  }
  for (const step of state.steps.filter((s) => !isBoilStep(s))) {
    if (step.rampStartedAt != null) events.push({key:`ramp-${step.id}`,at:step.rampStartedAt,step:step.id,label:'Suivi thermique commencé',value:step.label,unit:'',category:'steps',detail:'Montée ou refroidissement suivi séparément du temps de maintien.'});
    // startedAt est déplacé à la reprise : ce n'est pas une heure historique.
    // Seule la validation explicite fournit ici un événement fiable.
    if (step.doneAt != null)
      events.push({
        key: `done-${step.id}`,
        at: step.doneAt,
        step: step.id,
        label: 'Étape terminée',
        value: step.label,
        unit: '',
        category: 'steps'
      });
  }
  const boilId = state.steps.find(isBoilStep)?.id;
  if (state.boilStartedAt != null)
    events.push({
      key: 'boil-start',
      at: state.boilStartedAt,
      step: boilId,
      label: 'Ébullition atteinte',
      value: 'Horloge démarrée',
      unit: '',
      category: 'steps'
    });
  if (state.boilFinishedAt != null)
    events.push({
      key: 'boil-finish',
      at: state.boilFinishedAt,
      step: boilId,
      label: 'Feu coupé',
      value: 'Fin d’ébullition',
      unit: '',
      category: 'steps'
    });
  if (state.finishedAt != null)
    events.push({
      key: 'finished',
      at: state.finishedAt,
      label: 'Brassage clôturé',
      value: 'Passage en fermentation',
      unit: '',
      category: 'steps'
    });
  events.sort((a, b) => b.at - a.at);
  const visible = events.filter((e) => filter === 'all' || e.category === filter);
  const filters = [
    ['all', 'Tout'],
    ['measurements', 'Mesures'],
    ['additions', 'Ajouts'],
    ['notes', 'Notes'],
    ['steps', 'Étapes']
  ];
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
      ...events.map(
        (e) =>
          `${new Date(e.at).toLocaleString('fr-CH')} · ${state.steps.find((s) => s.id === e.step)?.label ?? 'Sans étape'} · ${e.label} ${e.value} ${e.unit}${e.detail ? ' · ' + e.detail : ''}`
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
    <section aria-label="Journal modifiable" className="brew-journal">
      <div className="brew-section-heading">
        <div>
          <h2>Journal de cuve</h2>
        </div>
        <button type="button" className="brew-export" onClick={download}>
          <Download size={17} />
          <span>Exporter .txt</span>
        </button>
      </div>
      <div className="brew-journal-filters" role="group" aria-label="Filtrer le journal">
        {filters.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>
            {label}
            <span>
              {id === 'all' ? events.length : events.filter((e) => e.category === id).length}
            </span>
          </button>
        ))}
      </div>
      {undo && (
        <div role="status" className="brew-journal-undo">
          <span>Entrée retirée.</span>
          <button
            type="button"
            onClick={() => {
              undo();
              setUndo(null);
            }}
          >
            Annuler la suppression
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="brew-feedback">
          {error}
        </p>
      )}
      {!visible.length && (
        <div className="brew-journal-empty">
          <NotebookPen size={30} />
          <h3>{events.length ? 'Aucune entrée dans ce filtre' : 'Aucune entrée'}</h3>
          <p>
            {events.length
              ? 'Les autres événements restent accessibles avec « Tout ».'
              : 'Les ajouts confirmés, les mesures, les notes et les étapes terminées sont consignés ici.'}
          </p>
        </div>
      )}
      <div className="brew-journal-timeline">
        {visible.map((event, index) => {
          const e = event.entry;
          const Icon =
            event.category === 'measurements'
              ? Thermometer
              : event.category === 'notes'
                ? NotebookPen
                : event.category === 'additions'
                  ? FlaskConical
                  : Check;
          const date = new Date(event.at).toLocaleDateString('fr-CH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
          const previousDate = index ? new Date(visible[index - 1].at).toDateString() : null;
          return (
            <React.Fragment key={event.key}>
              {previousDate !== new Date(event.at).toDateString() && (
                <p className="brew-journal-date">{date}</p>
              )}
              <article className={`brew-journal-event is-${event.category}`}>
                <div className="brew-journal-time">
                  <time dateTime={new Date(event.at).toISOString()}>
                    {new Date(event.at).toLocaleTimeString('fr-CH', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </time>
                  <span>
                    <Icon size={16} />
                  </span>
                </div>
                <div className="brew-journal-body">
                  <div className="brew-journal-event-heading">
                    <span>{state.steps.find((s) => s.id === event.step)?.label ?? 'Brassin'}</span>
                    {e && editing !== e.key && (
                      <div className="brew-journal-actions">
                        <button
                          type="button"
                          aria-label="Modifier"
                          title="Modifier cette entrée"
                          onClick={() => {
                            setEditing(e.key);
                            setError('');
                            setText(e.value);
                          }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label="Supprimer"
                          title="Supprimer cette entrée"
                          onClick={() => remove(e)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <strong className="brew-journal-event-label">{event.label}</strong>
                  <p
                    className={
                      event.category === 'notes' || event.category === 'steps'
                        ? 'brew-journal-text'
                        : 'brew-journal-value'
                    }
                  >
                    {event.value}
                    {event.unit && <span> {event.unit}</span>}
                  </p>
                  {event.detail && <p className="brew-journal-detail">{event.detail}</p>}
                  {e && editing === e.key && (
                    <form
                      className="brew-journal-edit"
                      onSubmit={(formEvent) => {
                        formEvent.preventDefault();
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
                          inputMode="decimal"
                          className={brewInput}
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
                        <X size={17} />
                      </button>
                    </form>
                  )}
                </div>
              </article>
            </React.Fragment>
          );
        })}
      </div>
      {events.length > 0 && (
        <p className="brew-journal-footnote">
          <Clock3 size={16} />
          Pour corriger un ingrédient versé, modifie sa quantité dans la liste des ingrédients.
          Effacer un relevé ne retire rien de la cuve.
        </p>
      )}
    </section>
  );
}
