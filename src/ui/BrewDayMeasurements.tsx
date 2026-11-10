import { Input } from './Input';
import { brewNow } from '../services/brewClock';
import React, { useEffect, useId, useState } from 'react';
import { Check, Minus, Plus, TriangleAlert } from 'lucide-react';
import { AcidId, BrewDayReading, BrewDayState, BrewDayStep, RecipeSnapshot } from '../types';
import {
  defaultReading,
  isMash,
  isFinalWort,
  parseReading,
  READING,
  measuredReadingFeedback,
  readingKey,
  volumeTarget,
  sg,
  ReadingKind
} from '../domain/brewDay';
import { acidCorrectionFromMeasuredPh, ACIDS } from '../domain/water';
import { NumberInput } from './NumberInput';
import { useHoldRepeat } from './numericInput';
import { BrewWortPair, type WortPairDraft } from './BrewWortPair';
import { nombreFr } from '../domain/nombreAffiche';

export const brewControl =
  'min-h-touch-lg whitespace-nowrap rounded-control border border-cave-700 bg-cave-850 px-2 text-sm text-cave-200 hover:bg-cave-800 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ebc-straw';
export const brewInput =
  'w-full min-w-0 min-h-touch-lg rounded-control border border-cave-600 bg-cave-950 px-2 text-base text-cave-50 reading outline-none focus:border-ebc-straw';
/** Texte d'aide du champ : jamais un exemple qui passe pour la valeur de CE brassin (TE-44 : « 25 » à côté d'une eau d'empâtage de 33,6 L). Volume : la cible de l'étape, sinon rien. */
function placeholderFor(kind: ReadingKind, step: BrewDayStep, recipe?: RecipeSnapshot): string {
  if (kind === 'volume') {
    const t = volumeTarget(step, recipe);
    return t && t > 0 ? String(Math.round(t * 10) / 10).replace('.', ',') : '';
  }
  if (kind === 'temperature') return step.tempC != null ? String(step.tempC).replace('.', ',') : '';
  return READING[kind].placeholder;
}
/**
 * RL-9 : les bornes d'un champ de mesure s'écrivent à la virgule, sans espace devant le point final : « Saisis 0,1 à 2000 L. », « Saisis 3 à 9. »
 * (elles se lisaient « 0.1 à 2000 L » et « 3 à 9 . » quand l'unité est vide, le pH).
 */
export function invitationMesure(kind: ReadingKind): string {
  const fr = (n: number) => String(n).replace('.', ',');
  const { min, max, unit } = READING[kind];
  const fin = kind === 'densite' ? ' SG (ou 1056 pour 1,056)' : unit ? ` ${unit}` : '';
  return `Saisis ${fr(min)} à ${fr(max)}${fin}.`;
}
export type BrewUpdate =(update: (state: BrewDayState) => BrewDayState) => void;
export interface BrewReadingDraft {
  kind: ReadingKind;
  raw: string;
  roomTemp: boolean;
  editing: string | null;
  pair?: WortPairDraft;
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
              Maische · {ctx.waterL ? nombreFr(ctx.waterL, 1) : '—'} L · {ctx.gristKg ? nombreFr(ctx.gristKg, 2) : '—'} kg ·{' '}
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
                <strong className="reading text-2xl text-ebc-straw">≈ {nombreFr(partial, 1)} mL</strong>
                <span className="text-sm text-cave-200">pour commencer</span>
              </div>
              <p className="text-2xs text-cave-200">
                Moitié de l’estimation totale ({nombreFr(fix.amount, 1)} mL d’
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
                    J’ai ajouté {nombreFr(dose, 1)} mL
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

/**
 * L'échelle de la feuille Mesurer (z1) : la cible en bande, le relevé en trait. Elle n'existe que pour une mesure qui a une cible
 * documentée par le code : pH de maische (5,2–5,5), température de consigne (± 1 °C), densité de l'OG (± 2 points), volume visé (± 5 %).
 * Ailleurs : `null`, et la feuille ne dessine rien (une cible inventée serait pire qu'une échelle absente).
 */
export interface MeasureScale {
  min: number;
  max: number;
  bandMin: number;
  bandMax: number;
  ticks: number[];
  fmt: (n: number) => string;
}
const decimales = (n: number, max: number) =>
  new Intl.NumberFormat('fr-CH', { minimumFractionDigits: 0, maximumFractionDigits: max, useGrouping: false }).format(n);
export function measureScale(
  kind: ReadingKind,
  step: BrewDayStep,
  recipe?: RecipeSnapshot,
  value?: number | null
): MeasureScale | null {
  let band: [number, number] | null = null;
  let axis: [number, number] | null = null;
  let fmt = (n: number) => decimales(n, 2);
  if (kind === 'ph' && isMash(step.id)) {
    band = [5.2, 5.5];
    fmt = (n) => n.toFixed(1).replace('.', ',');
    axis = [5, 5.8];
  } else if (kind === 'temperature' && step.tempC != null) {
    band = [step.tempC - 1, step.tempC + 1];
    axis = [step.tempC - 6, step.tempC + 6];
    fmt = (n) => decimales(n, 1);
  } else if (kind === 'densite' && isFinalWort(step.id) && recipe?.ogTarget && recipe.ogTarget > 1) {
    band = [recipe.ogTarget - 0.002, recipe.ogTarget + 0.002];
    axis = [recipe.ogTarget - 0.012, recipe.ogTarget + 0.012];
    fmt = sg;
  } else if (kind === 'volume') {
    const target = volumeTarget(step, recipe);
    if (target && target > 0) {
      band = [target * 0.95, target * 1.05];
      axis = [target * 0.85, target * 1.15];
      fmt = (n) => decimales(n, 1);
    }
  }
  if (!band || !axis) return null;
  let [min, max] = axis;
  // Un relevé hors de l'axe l'étire : le trait ne se colle jamais à un bord comme s'il y était.
  if (value != null && Number.isFinite(value)) {
    const marge = (max - min) * 0.1;
    if (value < min) min = value - marge;
    if (value > max) max = value + marge;
  }
  return { min, max, bandMin: band[0], bandMax: band[1], ticks: [min, band[0], band[1], max], fmt };
}

/** « +0,12 » au-dessus de la bande, « −0,3 » en dessous, `null` dans la cible : l'écart à la borne la plus proche. */
export function ecartCible(scale: MeasureScale, value: number): number | null {
  if (value > scale.bandMax) return value - scale.bandMax;
  if (value < scale.bandMin) return value - scale.bandMin;
  return null;
}

function MeasureScaleView({ scale, value }: { scale: MeasureScale; value: number | null }) {
  const span = scale.max - scale.min;
  const at = (n: number) => `${Math.max(0, Math.min(100, ((n - scale.min) / span) * 100))}%`;
  const hors = value != null && ecartCible(scale, value) != null;
  return (
    <div className="bz-echelle" aria-hidden="true" data-booster="echelle">
      <div className="bz-echelle-rail" />
      <div className="bz-echelle-cible" style={{ left: at(scale.bandMin), width: `${((scale.bandMax - scale.bandMin) / span) * 100}%` }} />
      {scale.ticks.map((t, i) => (
        <span
          key={i}
          className="bz-echelle-grad"
          style={i === 0 ? { left: 0, transform: 'none' } : i === scale.ticks.length - 1 ? { left: 'auto', right: 0, transform: 'none' } : { left: at(t) }}
          data-haut={i === 2 ? '' : undefined}
        >
          {scale.fmt(t)}
        </span>
      ))}
      {value != null && <span className={`bz-echelle-releve ${hors ? 'is-hors' : ''}`} style={{ left: at(value) }} />}
    </div>
  );
}

export function BrewDayMeasurements({
  step,
  state,
  recipe,
  update,
  drafts,
  requestedKind,
  requestedPair,
  onAdvice,
  adviceBusy = false,
  advice
}: {
  step: BrewDayStep;
  state: BrewDayState;
  recipe?: RecipeSnapshot;
  update: BrewUpdate;
  drafts?: Map<string, BrewReadingDraft>;
  requestedKind?: {kind: ReadingKind; token: number};
  requestedPair?: {stage: WortPairDraft['stage']; token: number};
  /** « Conseil » de la feuille : le même conseil que « Conseil IA » du carnet, lancé d'ici. */
  onAdvice?: () => void;
  adviceBusy?: boolean;
  advice?: React.ReactNode;
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
  const [pairMode, setPairMode] = useState(false);
  useEffect(() => {
    if (requestedKind) { setKind(requestedKind.kind); setRaw(''); setEditing(null); setNotice(''); setPairMode(false); }
  }, [requestedKind?.token]);
  useEffect(() => { if (requestedPair) setPairMode(true); }, [requestedPair?.token]);
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
      ...(kind !== 'temperature' ? { roomTemp } : !editing ? {
        medium: step.id === 'sparge' ? 'water' as const : 'wort' as const,
        thermalSegmentId: [...(state.thermalSegments ?? [])].reverse().find(s => s.stepId === step.id && s.endedAt == null)?.id
      } : {}),
      ...(kind === 'volume' ? { volumeBasis: roomTemp ? 'cold' as const : undefined } : {})
    };
    update((s) => {
      const old = editing ? s.readings?.find((x) => readingKey(x) === editing) : undefined;
      const corrected = old ? { ...old, ...r, id: old.id ?? r.id, at: old.at } : undefined;
      if (corrected?.kind === 'volume' && old?.volumeBasis !== corrected.volumeBasis)
        delete corrected.temperatureC;
      return {
        ...s,
        readings: old
          ? s.readings!.map((x) =>
              readingKey(x) === editing ? corrected! : x
            )
          : [...(s.readings ?? []), r]
      };
    });
    setRaw('');
    setEditing(null);
    setNotice(
      `${READING[kind].label} ${kind === 'densite' ? sg(value) : String(value).replace('.', ',')} ${READING[kind].unit} ajouté au journal`
    );
  };
  const scale = measureScale(kind, step, recipe, value ?? reading?.value);
  const marque = value ?? reading?.value ?? null;
  const ecart = scale && marque != null ? ecartCible(scale, marque) : null;
  const valeurAffichee = (n: number) => (kind === 'densite' ? sg(n) : String(n).replace('.', ','));
  const minutesDepuis = (at: number) => Math.max(0, Math.round((brewNow() - at) / 60000));
  return (
    <section aria-label="Mesures de cette étape" className="bz-mesure">
      {pairMode ? <BrewWortPair step={step} state={state} update={update} drafts={drafts} requestedStage={requestedPair} /> : <>
      <div className="bz-seg" role="group" aria-label="Type de mesure" data-booster="grandeur">
        {(Object.keys(READING) as ReadingKind[]).map((k) => (
          <button
            type="button"
            key={k}
            aria-label={READING[k].label}
            aria-pressed={kind === k}
            className={kind === k ? 'border-2 border-ebc-straw font-semibold underline decoration-2 underline-offset-4' : undefined}
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
          >
            {k === 'temperature' ? 'Temp.' : READING[k].label}
          </button>
        ))}
      </div>
      <form autoComplete="off" onSubmit={save} className="bz-mesure-form">
        <div className="bz-saisie">
          <Input
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
            placeholder={last ? 'Nouveau relevé' : placeholderFor(kind, step, recipe)}
          />
          <label htmlFor="brew-reading" className="bz-unite">
            {READING[kind].label}
            {READING[kind].unit
              ? ` (${READING[kind].unit})`
              : isMash(step.id)
                ? ' de maische · cible 5,2–5,5'
                : ''}
          </label>
        </div>
        {kind !== 'temperature' && (
          <label className="bz-refroidi">
            <input
              type="checkbox"
              checked={roomTemp}
              onChange={(e) => setRoomTemp(e.target.checked)}
            />
            {kind === 'ph'
              ? 'Échantillon refroidi à 20–25 °C'
              : kind === 'densite'
                ? 'Densité refroidie ou corrigée à l’étalonnage'
                : 'Volume ramené à 20 °C'}
          </label>
        )}
        {scale && <MeasureScaleView scale={scale} value={marque} />}
        <div id="brew-reading-feedback" aria-live="polite" className="bz-verdict-zone">
          {incomplete ? (
            <p className="bz-muet">Complète la valeur.</p>
          ) : raw.trim() && value == null ? (
            <p className="bz-verdict is-watch">
              {invitationMesure(kind)}
            </p>
          ) : feedback ? (
            <>
              <p className={`bz-verdict is-${feedback.tone}`}>
                {feedback.tone === 'watch' ? <TriangleAlert size={14} aria-hidden="true" /> : feedback.tone === 'ok' ? <Check size={14} aria-hidden="true" /> : null}
                <span>{feedback.title}</span>
              </p>
              {ecart != null && scale && (
                <p className="bz-ecart">
                  <span className="bz-m">{ecart > 0 ? '+' : '−'}{scale.fmt(Math.abs(ecart))}</span>{' '}
                  {ecart > 0 ? 'au-dessus' : 'sous'} de la cible <span className="bz-m">{scale.fmt(scale.bandMin)}–{scale.fmt(scale.bandMax)}</span>
                </p>
              )}
              {feedback.detail && <p className="bz-muet">{feedback.detail}</p>}
            </>
          ) : kind === 'ph' && isMash(step.id) ? (
            // z1 : aucune phrase d'aide sur la feuille Mesurer ; le conseil reste dit aux lecteurs d'écran (p3, n° 5).
            <p className="sr-only">Mesure dix à quinze minutes après l’empâtage, sur un échantillon refroidi.</p>
          ) : kind === 'densite' ? (
            <p className="bz-muet">Densité sur échantillon refroidi ; 1056 est accepté pour 1,056.</p>
          ) : null}
        </div>
        <div className="bz-actions">
          <button type="button" aria-pressed={pairMode} data-booster="paire" onClick={() => setPairMode(true)}>Volume + densité</button>
          {onAdvice && (
            <button type="button" data-booster="conseil" disabled={adviceBusy} onClick={onAdvice}>
              {adviceBusy ? 'Analyse…' : 'Conseil'}
            </button>
          )}
          <button type="submit" className="is-prim" disabled={value == null} data-booster="enregistrer">
            {editing ? 'Corriger' : 'Enregistrer'}
          </button>
        </div>
      </form>
      {advice}
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
        <div className="bz-precedent">
          <span role="status">
            {notice || <>Précédent : <span className="bz-m">{valeurAffichee(last.value)}</span>{last.unit ? ` ${last.unit}` : ''} · il y a <span className="bz-m">{minutesDepuis(last.at)}</span> min</>}
          </span>
          <button
            type="button"
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
      </>}
      {pairMode && <div className="bz-precedent"><button type="button" aria-pressed="true" onClick={() => setPairMode(false)}>Mesure seule</button></div>}
    </section>
  );
}
