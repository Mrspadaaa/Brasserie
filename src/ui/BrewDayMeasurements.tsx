import { brewNow } from '../services/brewClock';
import React, { useEffect, useId, useState } from 'react';
import { Check, Minus, Plus } from 'lucide-react';
import { AcidId, BrewDayReading, BrewDayState, BrewDayStep, RecipeSnapshot } from '../types';
import {
  defaultReading,
  isMash,
  parseReading,
  READING,
  measuredReadingFeedback,
  readingKey,
  ReadingKind
} from '../domain/brewDay';
import { acidCorrectionFromMeasuredPh, ACIDS } from '../domain/water';
import { NumberInput } from './NumberInput';
import { useHoldRepeat } from './numericInput';

export const brewControl =
  'min-h-10 whitespace-nowrap rounded-control border border-cave-700 bg-cave-850 px-3 text-sm text-cave-200 hover:bg-cave-800 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ebc-straw';
export const brewInput =
  'w-full min-w-0 h-11 rounded-control border border-cave-600 bg-cave-950 px-3 text-base text-cave-50 reading outline-none focus:border-ebc-straw';
export type BrewUpdate = (update: (state: BrewDayState) => BrewDayState) => void;
export interface BrewReadingDraft {
  kind: ReadingKind;
  raw: string;
  roomTemp: boolean;
  editing: string | null;
}

/** Départ volontairement fractionné : cette estimation de tampon n'est pas une titration. */
function MashCorrection({
  reading,
  saved,
  state,
  recipe,
  update
}: {
  reading: BrewDayReading;
  saved: boolean;
  state: BrewDayState;
  recipe?: RecipeSnapshot;
  update: BrewUpdate;
}) {
  const acidChoiceId = useId();
  const plan = recipe?.waterPlan;
  const ctx = state.mashContext ?? {
    waterL: plan?.mashWaterL ?? 0,
    gristKg:
      recipe?.totalGristKg ||
      recipe?.fermentables
        ?.filter((f) => f.kind === 'grain' && f.use !== 'ebullition')
        .reduce((sum, f) => sum + f.weightKg, 0) ||
      0,
    acid: plan?.acid?.id ?? 'lactique'
  };
  const fix = acidCorrectionFromMeasuredPh(
    reading.value,
    ctx.waterL,
    ctx.gristKg > 0 ? ctx.waterL / ctx.gristKg : 0,
    ctx.acid
  );
  const partial = Math.floor(fix.amount * 5) / 10;
  const [override, setOverride] = useState<number | null>(null);
  const dose = override ?? partial;
  const press = useHoldRepeat(dose, setOverride, (from, delta) =>
    Math.max(0, Math.round((from + delta) * 10) / 10)
  );
  const after = state.acidCorrections?.some((c) => c.at >= reading.at);
  const contextValid = ctx.waterL > 0 && ctx.gristKg > 0 && ctx.waterL / ctx.gristKg <= 8;
  const unusual = reading.value > 6.2;
  const canDose =
    contextValid && fix.known && reading.roomTemp && !unusual && ctx.acid !== 'maltAcidule';
  const patchContext = (patch: Partial<typeof ctx>) => {
    setOverride(null);
    update((s) => ({ ...s, mashContext: { ...ctx, ...patch } }));
  };
  return (
    <div className="space-y-2 mt-2">
      {after ? (
        <p role="status" className="text-sm text-ebc-straw">
          Ajout consigné. Mélange, attends 10 minutes et relève de nouveau le pH avant toute autre
          correction.
        </p>
      ) : (
        <>
          {!reading.roomTemp && (
            <p className="text-sm text-cave-200">
              Refroidis l’échantillon à 20–25 °C pour chiffrer la correction.
            </p>
          )}
          {unusual && (
            <p className="text-sm text-ebc-straw">
              pH inhabituel pour une maische : confirme l’étalonnage et la mesure avant de doser.
            </p>
          )}
          {ctx.acid === 'maltAcidule' && (
            <p className="text-sm text-ebc-straw">
              Le plan utilise du malt acidulé. Choisis l’acide liquide réellement disponible pour
              une correction pendant l’empâtage.
            </p>
          )}
          <details open={!contextValid || ctx.acid === 'maltAcidule'} className="text-sm">
            <summary className="cursor-pointer min-h-9 flex items-center gap-1 text-cave-200">
              Maische · {ctx.waterL || '—'} L · {ctx.gristKg || '—'} kg ·{' '}
              {ctx.acid === 'phosphorique'
                ? 'phosphorique 75 %'
                : ctx.acid === 'lactique'
                  ? 'lactique 80 %'
                  : 'malt acidulé'}{' '}
              <span aria-hidden>⌄</span>
            </summary>
            <div className="grid grid-cols-2 gap-2 py-1">
              <label className="text-cave-200">
                Eau réelle (L)
                <NumberInput
                  aria-label="Eau réelle de la maische en litres"
                  min={0}
                  value={ctx.waterL}
                  onValue={(waterL) => patchContext({ waterL })}
                  className={brewInput}
                />
              </label>
              <label className="text-cave-200">
                Grain (kg)
                <NumberInput
                  aria-label="Grain réel en kilogrammes"
                  min={0}
                  value={ctx.gristKg}
                  onValue={(gristKg) => patchContext({ gristKg })}
                  className={brewInput}
                />
              </label>
              <fieldset
                className="brew-acid-choice col-span-2"
                aria-label="Acide pour la correction"
              >
                <legend>Acide disponible</legend>
                {[
                  ...(ctx.acid === 'maltAcidule'
                    ? [{ id: 'maltAcidule', label: 'Malt acidulé du plan' }]
                    : []),
                  { id: 'lactique', label: 'Acide lactique 80 %' },
                  { id: 'phosphorique', label: 'Acide phosphorique 75 %' }
                ].map((acid) => (
                  <label key={acid.id}>
                    <input
                      type="radio"
                      name={acidChoiceId}
                      value={acid.id}
                      checked={ctx.acid === acid.id}
                      onChange={() => patchContext({ acid: acid.id as AcidId })}
                    />
                    <span>{acid.label}</span>
                  </label>
                ))}
              </fieldset>
            </div>
            {!contextValid && (
              <p className="text-ebc-straw">
                Renseigne la maische réelle (au plus 8 L/kg pour cette estimation).
              </p>
            )}
          </details>
          {canDose && (
            <>
              <div className="flex items-baseline gap-2">
                <strong className="reading text-2xl text-ebc-straw">≈ {partial} mL</strong>
                <span className="text-sm text-cave-200">pour commencer</span>
              </div>
              <p className="text-2xs text-cave-200">
                Moitié de l’estimation totale ({fix.amount} mL d’
                {ACIDS[ctx.acid].name.toLowerCase()}). Mélange puis remesure après 10 minutes. C’est
                une correction supplémentaire, après les ajouts déjà faits.
              </p>
              {saved ? (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center">
                    <button
                      type="button"
                      {...press(-0.1)}
                      disabled={dose <= 0}
                      aria-label="Retirer 0,1 mL d’acide"
                      className={`${brewControl} px-2`}
                    >
                      <Minus size={16} />
                    </button>
                    <NumberInput
                      min={0}
                      max={1000}
                      value={dose}
                      onValue={setOverride}
                      aria-label="Acide réellement ajouté en mL"
                      className={`${brewInput} !w-20 text-center`}
                    />
                    <button
                      type="button"
                      {...press(0.1)}
                      aria-label="Ajouter 0,1 mL d’acide"
                      className={`${brewControl} px-2`}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={dose <= 0 || dose > 1000}
                    className={`${brewControl} flex-1`}
                    onClick={() =>
                      update((s) => ({
                        ...s,
                        acidCorrections: [
                          ...(s.acidCorrections ?? []),
                          {
                            id: crypto.randomUUID(),
                            at: brewNow(),
                            readingAt: reading.at,
                            stepId: reading.stepId!,
                            acid: ctx.acid,
                            amount: dose
                          }
                        ]
                      }))
                    }
                  >
                    J’ai ajouté {dose} mL
                  </button>
                  {dose > partial && (
                    <p className="text-2xs text-ebc-straw">
                      Au-dessus de la première fraction proposée. Ne consigne ici que ce que tu as
                      réellement versé.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-2xs text-cave-200">
                  Enregistre le pH pour consigner ensuite la dose réellement versée.
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export function BrewDayMeasurements({
  step,
  state,
  recipe,
  update,
  drafts,
  requestedKind
}: {
  step: BrewDayStep;
  state: BrewDayState;
  recipe?: RecipeSnapshot;
  update: BrewUpdate;
  drafts?: Map<string, BrewReadingDraft>;
  requestedKind?: {kind: ReadingKind; token: number};
}) {
  const [kind, setKind] = useState<ReadingKind>(
    () => drafts?.get(step.id)?.kind ?? defaultReading(step)
  );
  const [raw, setRaw] = useState(() => drafts?.get(step.id)?.raw ?? '');
  const [roomTemp, setRoomTemp] = useState(
    () =>
      drafts?.get(step.id)?.roomTemp ??
      !![...(state.readings ?? [])]
        .reverse()
        .find((r) => r.kind === defaultReading(step) && r.stepId === step.id)?.roomTemp
  );
  const [editing, setEditing] = useState<string | null>(
    () => drafts?.get(step.id)?.editing ?? null
  );
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (requestedKind) { setKind(requestedKind.kind); setRaw(''); setEditing(null); setNotice(''); }
  }, [requestedKind?.token]);
  useEffect(() => {
    drafts?.set(step.id, { kind, raw, roomTemp, editing });
  }, [drafts, step.id, kind, raw, roomTemp, editing]);
  const incomplete = /[.,]$/.test(raw.trim());
  const value = incomplete ? null : parseReading(raw, kind);
  const last = [...(state.readings ?? [])]
    .reverse()
    .find((r) => r.kind === kind && r.stepId === step.id);
  const reading: BrewDayReading | undefined = raw.trim()
    ? value == null
      ? undefined
      : {
          at: brewNow(),
          stepId: step.id,
          kind,
          value,
          unit: READING[kind].unit,
          roomTemp
        }
    : last;
  const feedback = reading ? measuredReadingFeedback(reading, state, step, recipe) : null;
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (value == null) return;
    const r: BrewDayReading = {
      id: crypto.randomUUID(),
      at: brewNow(),
      stepId: step.id,
      kind,
      value,
      unit: READING[kind].unit,
      ...(kind !== 'temperature' ? { roomTemp } : {})
    };
    update((s) => {
      const old = editing ? s.readings?.find((x) => readingKey(x) === editing) : undefined;
      return {
        ...s,
        readings: old
          ? s.readings!.map((x) =>
              readingKey(x) === editing ? { ...r, id: old.id ?? r.id, at: old.at } : x
            )
          : [...(s.readings ?? []), r]
      };
    });
    setRaw('');
    setEditing(null);
    setNotice(
      `${READING[kind].label} ${kind === 'densite' ? value.toFixed(3) : String(value).replace('.', ',')} ${READING[kind].unit} ajouté au journal`
    );
  };
  return (
    <section aria-label="Mesures de cette étape" className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-cave-50">Mesurer à la cuve</h3>
      </div>
      <div className="flex gap-1" role="group" aria-label="Type de mesure">
        {(Object.keys(READING) as ReadingKind[]).map((k) => (
          <button
            type="button"
            key={k}
            aria-label={READING[k].label}
            aria-pressed={kind === k}
            onClick={() => {
              setKind(k);
              setRoomTemp(
                !![...(state.readings ?? [])]
                  .reverse()
                  .find((r) => r.kind === k && r.stepId === step.id)?.roomTemp
              );
              setRaw('');
              setEditing(null);
              setNotice('');
            }}
            className={`flex-1 min-h-10 px-1 rounded-control text-sm border ${kind === k ? 'border-ebc-straw/60 bg-ebc-straw/10 text-ebc-straw' : 'border-cave-700 text-cave-200 hover:bg-cave-850'}`}
          >
            {k === 'temperature' ? 'Temp.' : READING[k].label}
            {(() => {
              const recent = [...(state.readings ?? [])]
                .reverse()
                .find((r) => r.kind === k && r.stepId === step.id);
              return (
                recent && (
                  <span className="block reading text-2xs font-semibold">
                    {k === 'densite'
                      ? recent.value.toFixed(3)
                      : String(recent.value).replace('.', ',')}
                    {recent.unit && ` ${recent.unit}`}
                  </span>
                )
              );
            })()}
          </button>
        ))}
      </div>
      <form onSubmit={save} className="space-y-1">
        <label htmlFor="brew-reading" className="text-2xs text-cave-200">
          {READING[kind].label}
          {READING[kind].unit
            ? ` (${READING[kind].unit})`
            : isMash(step.id)
              ? ' de maische · cible 5,2–5,5'
              : ''}
        </label>
        <div className="flex gap-2">
          <input
            id="brew-reading"
            aria-describedby="brew-reading-feedback"
            aria-invalid={!!raw.trim() && !incomplete && value == null}
            autoComplete="off"
            inputMode="decimal"
            enterKeyHint="done"
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              setNotice('');
            }}
            placeholder={last ? 'Nouveau relevé' : READING[kind].placeholder}
            className={`${brewInput} flex-1`}
          />
          <button
            type="submit"
            disabled={value == null}
            className={`${brewControl} !bg-ebc-straw !text-cave-950 !border-ebc-straw font-semibold flex gap-1 items-center`}
          >
            <Check size={16} />
            {editing ? 'Corriger' : 'Noter'}
          </button>
        </div>
        {kind !== 'temperature' && (
          <label className="flex items-center gap-2 min-h-10 text-2xs text-cave-200">
            <input
              type="checkbox"
              checked={roomTemp}
              onChange={(e) => setRoomTemp(e.target.checked)}
              className="accent-ebc-straw w-4 h-4"
            />
            {kind === 'ph'
              ? 'Échantillon refroidi à 20–25 °C'
              : kind === 'densite'
                ? 'Densité refroidie ou corrigée à l’étalonnage'
                : 'Volume ramené à 20 °C'}
          </label>
        )}
      </form>
      <div id="brew-reading-feedback" aria-live="polite" className="text-sm">
        {incomplete ? (
          <p className="text-cave-400">Complète la valeur.</p>
        ) : raw.trim() && value == null ? (
          <p className="text-ebc-straw">
            Saisis {READING[kind].min} à {READING[kind].max}
            {kind === 'densite' ? ' SG (ou 1056 pour 1,056)' : ` ${READING[kind].unit}`}.
          </p>
        ) : feedback ? (
          <div
            className={`border-l-2 pl-3 py-1 ${feedback.tone === 'watch' ? 'border-ebc-straw' : feedback.tone === 'ok' ? 'border-hop' : 'border-cave-600'}`}
          >
            <p
              className={`font-semibold ${feedback.tone === 'watch' ? 'text-ebc-straw' : 'text-cave-50'}`}
            >
              {feedback.title}
            </p>
            <p className="text-cave-200 text-2xs mt-0.5">{feedback.detail}</p>
          </div>
        ) : (
          <p className="text-cave-400 text-2xs">
            {kind === 'ph' && isMash(step.id)
              ? 'Mesure dix à quinze minutes après l’empâtage, sur un échantillon refroidi.'
              : kind === 'densite'
                ? 'Densité sur échantillon refroidi ; 1056 est accepté pour 1,056.'
                : 'Saisis une mesure : l’écart à la consigne apparaît immédiatement.'}
          </p>
        )}
      </div>
      {reading && kind === 'ph' && isMash(step.id) && reading.value > 5.5 && (
        <MashCorrection
          key={raw ? `draft-${raw}` : readingKey(reading)}
          reading={reading}
          saved={!raw.trim()}
          state={state}
          recipe={recipe}
          update={update}
        />
      )}
      {last && !raw && (
        <div className="flex items-center justify-between gap-2 text-2xs text-cave-200">
          <span role="status">
            {notice ||
              `Dernier relevé · ${new Date(last.at).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })} · ${last.value} ${last.unit}`}
          </span>
          <button
            type="button"
            className="min-h-10 px-2 underline text-cave-200"
            onClick={() => {
              setRaw(String(last.value));
              setRoomTemp(!!last.roomTemp);
              setEditing(readingKey(last));
            }}
          >
            Corriger le relevé
          </button>
        </div>
      )}
    </section>
  );
}
