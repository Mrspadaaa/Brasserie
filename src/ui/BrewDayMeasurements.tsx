import { Input } from './Input';
import { brewNow } from '../services/brewClock';
import React, { useEffect, useId, useState } from 'react';
import { Check, ChevronDown, ChevronUp, CircleHelp, Minus, Pencil, Plus, TriangleAlert } from 'lucide-react';
import { AcidId, BrewDayReading, BrewDayState, BrewDayStep, RecipeSnapshot } from '../types';
import {
  defaultReading,
  isMash,
  cibleMesure,
  ecartHorsCible,
  formatCible,
  parseReading,
  READING,
  measuredReadingFeedback,
  readingKey,
  refroidiParDefaut,
  volumeTarget,
  sg,
  ReadingKind
} from '../domain/brewDay';
import { acidCorrectionFromMeasuredPh, ACIDS } from '../domain/water';
import { NumberInput } from './NumberInput';
import { useHoldRepeat } from './numericInput';
import { BrewWortPair, type WortPairDraft } from './BrewWortPair';
import { nombreFr } from '../domain/nombreAffiche';
import { bornesPlausibles, bornesCurseur, formatCurseur, pasCurseur, poserSurPas, departCurseur, traitsCurseur, quoiMesure } from '../domain/measureSlider';
import { grandeursOuvertes, mesureDue, raisonMesure } from '../domain/brewMeasures';

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
  // n° 6 : « 5,4 » ou « 1,056 » en gris passe pour une valeur ; le champ vide dit « ? » par le curseur, l'unité est dans son libellé.
  return '';
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
 * L'échelle de la feuille Mesurer (z1) : la cible en bande, le relevé en trait. La bande n'existe que pour une mesure qui a une cible
 * documentée par le code : pH de maische (5,2–5,5), température de consigne (± 1 °C), densité de l'OG (± 2 points), volume visé (± 5 %).
 * Sans cible (VB-3, 10.11 : « utilise des slider »), l'échelle vient des bornes plausibles de la grandeur au moment (`bornesPlausibles`) :
 * `cible: false`, pas de bande (une cible inventée serait pire), `milieu` pour le pouce. `bandMin` / `bandMax` ne se lisent que si `cible`.
 */
export interface MeasureScale {
  min: number;
  max: number;
  cible: boolean;
  bandMin: number;
  bandMax: number;
  milieu: number;
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
): MeasureScale {
  // La bande vient de `cibleMesure` : la même que pour les Relevés du jour et la clôture (une seule source de cible et d'écart).
  const cible = cibleMesure(kind, step, recipe);
  let band: [number, number] | null = cible ? [cible.min, cible.max] : null;
  let axis: [number, number] | null = null;
  let fmt = (n: number) => decimales(n, 2);
  if (cible) {
    const centre = (cible.min + cible.max) / 2;
    const demi = kind === 'ph' ? 0.4 : kind === 'temperature' ? 6 : kind === 'densite' ? 0.012 : centre * 0.15;
    axis = [centre - demi, centre + demi];
    if (kind === 'ph') axis = [5, 5.8];
    fmt = (n) => formatCible(kind, n);
  }
  let milieu: number;
  if (band && axis) {
    milieu = (band[0] + band[1]) / 2;
  } else {
    const p = bornesPlausibles(kind, step, recipe);
    axis = [p.min, p.max];
    milieu = p.milieu;
    fmt = kind === 'ph' ? (n) => n.toFixed(1).replace('.', ',') : kind === 'densite' ? sg : (n) => decimales(n, 1);
  }
  let [min, max] = axis;
  // Un relevé hors de l'axe l'étire : le trait ne se colle jamais à un bord comme s'il y était.
  if (value != null && Number.isFinite(value)) {
    const marge = (max - min) * 0.1;
    if (value < min) min = value - marge;
    if (value > max) max = value + marge;
  }
  return band
    ? { min, max, cible: true, bandMin: band[0], bandMax: band[1], milieu, ticks: [min, band[0], band[1], max], fmt }
    : { min, max, cible: false, bandMin: milieu, bandMax: milieu, milieu, ticks: [min, milieu, max], fmt };
}

/** « +0,12 » au-dessus de la bande, « −0,3 » en dessous, `null` dans la cible : l'écart à la borne la plus proche. */
export function ecartCible(scale: MeasureScale, value: number): number | null {
  return scale.cible ? ecartHorsCible({ min: scale.bandMin, max: scale.bandMax }, value) : null;
}

/**
 * Le geste (m2, 10.11) : le pouce sur l'échelle cible. Un <input type="range"> natif, transparent, couvre l'échelle (44 px de haut) : il porte
 * le glisser, le toucher de piste, les flèches et le lecteur d'écran. Le pouce dessiné suit ; en pointillé tant qu'aucune valeur n'est posée.
 */
export function MeasureSlider({ scale, kind, value, depart, label, onPose }: {
  scale: MeasureScale; kind: ReadingKind; value: number | null; depart: number; label: string; onPose: (v: number) => void;
}) {
  const span = scale.max - scale.min;
  const at = (n: number) => `${Math.max(0, Math.min(100, ((n - scale.min) / span) * 100))}%`;
  const { pas } = pasCurseur(kind);
  const bornes = bornesCurseur(kind, scale.min, scale.max);
  const pose = value != null;
  const pos = pose ? value : depart;
  const hors = pose && ecartCible(scale, value) != null;
  const poser = (v: number) => onPose(poserSurPas(kind, v, bornes.min, bornes.max));
  return (
    <div className="bz-curseur" data-booster="curseur">
      <div className="bz-echelle-grads bz-m" aria-hidden="true">
        {scale.ticks.map((t, i) => (
          <span key={i} data-bout={i === 0 ? 'g' : i === scale.ticks.length - 1 ? 'd' : undefined} data-cible={scale.cible && (i === 1 || i === 2) ? '' : undefined} style={{ left: at(t) }}>{scale.fmt(t)}</span>
        ))}
      </div>
      <div className="bz-zone">
        <div className="bz-echelle-rail" />
        {traitsCurseur(kind, scale.min, scale.max).map((t, i) => <span key={i} className="bz-tic" aria-hidden="true" style={{ left: at(t) }} />)}
        {scale.cible && <div className="bz-echelle-cible" style={{ left: at(scale.bandMin), width: `${((scale.bandMax - scale.bandMin) / span) * 100}%` }} />}
        <span className="bz-pouce" data-vide={pose ? undefined : ''} data-hors={hors ? '' : undefined} style={{ left: at(pos) }} aria-hidden="true"><i /><b /></span>
        <input
          type="range"
          className="bz-range"
          min={bornes.min}
          max={bornes.max}
          step={pas}
          value={pos}
          aria-label={`${label}, curseur`}
          aria-valuetext={pose ? `${formatCurseur(kind, value)}` : `aucune valeur ; un toucher pose ${formatCurseur(kind, depart)}`}
          onChange={(e) => poser(Number(e.target.value))}
          onPointerUp={(e) => { if (!pose) poser(Number(e.currentTarget.value)); }}
          onKeyDown={(e) => { if (!pose && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); poser(depart); } }}
        />
      </div>
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
  advice,
  onSaved
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
  /** m2 : l'enregistrement ferme la feuille ; la page dit au journal ce qui vient d'y entrer. */
  onSaved?: (message: string) => void;
}) {
  const [kind, setKind] = useState<ReadingKind>(
    () => drafts?.get(step.id)?.kind ?? mesureDue(step, state, recipe, brewNow())
  );
  const [raw, setRaw] = useState(() => drafts?.get(step.id)?.raw ?? '');
  const [roomTemp, setRoomTemp] = useState(
    () =>
      drafts?.get(step.id)?.roomTemp ??
      refroidiParDefaut(
        kind,
        step.id,
        [...(state.readings ?? [])].reverse().find((r) => r.kind === kind && r.stepId === step.id)?.roomTemp
      )
  );
  const [editing, setEditing] = useState<string | null>(
    () => drafts?.get(step.id)?.editing ?? null
  );
  const [notice, setNotice] = useState('');
  const [pairMode, setPairMode] = useState(false);
  const [champ, setChamp] = useState(false);
  const [raison, setRaison] = useState(false);
  useEffect(() => {
    if (requestedKind) {
      setKind(requestedKind.kind);
      setRoomTemp(refroidiParDefaut(requestedKind.kind, step.id, [...(state.readings ?? [])].reverse().find((r) => r.kind === requestedKind.kind && r.stepId === step.id)?.roomTemp));
      setRaw(''); setEditing(null); setNotice(''); setPairMode(false);
    }
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
      ...(kind === 'volume' ? { volumeBasis: roomTemp ? 'cold' as const : undefined } : {}),
      // m2 : la case « Au fermenteur · au transfert » de Refroidissement enregistre le volume au fermenteur (décision du pilote, 10.11).
      ...(kind === 'volume' && step.id === 'refroidissement' && !editing ? { measurementStage: 'fermenter' as const } : {})
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
    const message = `${READING[kind].label} ${kind === 'densite' ? sg(value) : String(value).replace('.', ',')} ${READING[kind].unit} ${kind === 'temperature' || kind === 'densite' ? 'ajoutée' : 'ajouté'} au journal`;
    setNotice(message);
    onSaved?.(message);
  };
  const scale = measureScale(kind, step, recipe, value ?? reading?.value);
  // m2 : sur la feuille, le verdict seul ; la phrase d'aide sur l'écart à la consigne (« Homogénéise, ajuste… ») vit sous « Pourquoi maintenant ».
  const conseilEnRaison = !!scale && !!feedback && !!feedback.bande && kind === 'temperature';
  // m2 : la valeur se dit une fois (le curseur). Un verdict neutre qui la recopie (« Température : 96 °C », « Relevé rattaché à cette étape. ») n'apprend rien.
  const echoValeur = !!scale && !!feedback && feedback.tone === 'neutral' && feedback.title.startsWith(`${READING[kind].label} :`);
  const marque = value ?? reading?.value ?? null;
  const ecart = scale && marque != null ? ecartCible(scale, marque) : null;
  const depart = departCurseur(kind, scale, last?.value);
  const pasTexte = String(pasCurseur(kind).pas).replace('.', ',');
  const poserCurseur = (v: number) => {
    setRaw(formatCurseur(kind, v));
    setNotice('');
  };
  const valeurAffichee = (n: number) => (kind === 'densite' ? sg(n) : String(n).replace('.', ','));
  const minutesDepuis = (at: number) => Math.max(0, Math.round((brewNow() - at) / 60000));
  return (
    <section aria-label="Mesures de cette étape" className="bz-mesure">
      {pairMode ? <BrewWortPair step={step} state={state} update={update} drafts={drafts} requestedStage={requestedPair} /> : <>
      <div className="bz-seg" role="group" aria-label="Type de mesure" data-booster="grandeur">
        {grandeursOuvertes(step, state).map((k) => (
          <button
            type="button"
            key={k}
            aria-label={READING[k].label}
            aria-pressed={kind === k}
            onClick={() => {
              setKind(k);
              setRoomTemp(
                refroidiParDefaut(
                  k,
                  step.id,
                  [...(state.readings ?? [])].reverse().find((r) => r.kind === k && r.stepId === step.id)?.roomTemp
                )
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
        <div className="bz-lecture" data-sans-echelle={scale ? undefined : ''} data-champ={champ ? '' : undefined}>
        {scale && (
          <button
            type="button"
            className="bz-val bz-m"
            data-booster="valeur"
            data-vide={value == null ? '' : undefined}
            aria-label="Taper la valeur"
            onClick={() => {
              setChamp(true);
              requestAnimationFrame(() => document.getElementById('brew-reading')?.focus());
            }}
          >
            <b>{value != null ? formatCurseur(kind, value) : '?'}</b>
            <span className="bz-u">{READING[kind].unit}</span>
            <Pencil size={14} aria-hidden="true" />
          </button>
        )}
        {scale && quoiMesure(kind, step.id) && <span className="bz-quoi">{quoiMesure(kind, step.id)}</span>}
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
        {scale && (
          <span className="bz-pas" data-booster="pas">
            {[-1, 1].map((sens) => (
              <button
                type="button"
                key={sens}
                className="bz-m"
                aria-label={`${sens < 0 ? 'moins' : 'plus'} ${pasTexte}`}
                onClick={() => poserCurseur((value ?? depart) + sens * pasCurseur(kind).pas)}
              >
                {sens < 0 ? '−' : '+'}{pasTexte}
              </button>
            ))}
          </span>
        )}
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
        {scale && <MeasureSlider scale={scale} kind={kind} value={value} depart={depart} label={READING[kind].label} onPose={poserCurseur} />}
        {scale.cible && value == null && !raw.trim() && !last && (
          <p className="bz-ecart" data-k="vide">
            cible <b className="bz-m">{scale.fmt(scale.bandMin)}–{scale.fmt(scale.bandMax)}</b>{READING[kind].unit ? ` ${READING[kind].unit}` : ''}
          </p>
        )}
        <div id="brew-reading-feedback" aria-live="polite" className="bz-verdict-zone">
          {incomplete ? (
            <p className="bz-muet">Complète la valeur.</p>
          ) : raw.trim() && value == null ? (
            <p className="bz-verdict is-watch">
              {invitationMesure(kind)}
            </p>
          ) : feedback ? (
            <>
              {/* z1 / m2 : une seule phrase de verdict, la maquette dit « −0,8 sous la cible 66–68 °C » ou « dans la cible » ; le texte d'écart
                  à la consigne (« Écart −3,1 °C · cible 67 °C ») mesurait un autre repère et contredisait la bande. */}
              {ecart != null && scale && !feedback.bande && (
                // une alerte de borne (AM-41 à 43, pH, densité…) garde sa phrase, au-dessus de l'écart
                <p className={`bz-verdict is-${feedback.tone}`}>
                  <TriangleAlert size={14} aria-hidden="true" />
                  <span>{feedback.title}</span>
                </p>
              )}
              {ecart != null && scale ? (
                <p className="bz-verdict is-watch bz-ecart" data-k="hors">
                  <TriangleAlert size={14} aria-hidden="true" />
                  <span>
                    <b className="bz-m">{ecart > 0 ? '+' : '−'}{scale.fmt(Math.abs(ecart))}</b> {ecart > 0 ? 'au-dessus de' : 'sous'} la cible{' '}
                    <b className="bz-m">{scale.fmt(scale.bandMin)}–{scale.fmt(scale.bandMax)}{READING[kind].unit ? ` ${READING[kind].unit}` : ''}</b>
                  </span>
                </p>
              ) : scale.cible && feedback.tone === 'ok' && feedback.bande ? (
                <p className="bz-verdict is-ok" data-k="ok"><Check size={14} aria-hidden="true" /><span>dans la cible</span></p>
              ) : echoValeur ? null : (
                <p className={`bz-verdict is-${feedback.tone}`}>
                  {feedback.tone === 'watch' ? <TriangleAlert size={14} aria-hidden="true" /> : feedback.tone === 'ok' ? <Check size={14} aria-hidden="true" /> : null}
                  <span>{feedback.title}</span>
                </p>
              )}
              {feedback.detail && !conseilEnRaison && !echoValeur && <p className="bz-muet">{feedback.detail}</p>}
            </>
          ) : kind === 'ph' && isMash(step.id) ? (
            // z1 : aucune phrase d'aide sur la feuille Mesurer ; le conseil reste dit aux lecteurs d'écran (p3, n° 5).
            <p className="sr-only">Mesure dix à quinze minutes après l’empâtage, sur un échantillon refroidi.</p>
          ) : kind === 'densite' ? (
            <p className="bz-muet">Densité sur échantillon refroidi ; 1056 est accepté pour 1,056.</p>
          ) : null}
        </div>
        {raisonMesure(kind, step) && (
          <>
            <button type="button" className="bz-pourquoi" data-booster="pourquoi" aria-expanded={raison} onClick={() => setRaison((r) => !r)}>
              <CircleHelp size={14} aria-hidden="true" />
              Pourquoi maintenant
              {raison ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
            </button>
            {raison && <p className="bz-raison">{raisonMesure(kind, step)}{conseilEnRaison && feedback?.detail ? ` ${feedback.detail}` : ''}</p>}
          </>
        )}
        <div className="bz-actions">
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
      {!pairMode && scale && !last && value == null && !raw.trim() && (
        <p className="bz-precedent"><span>Aucun relevé {isMash(step.id) ? 'ce palier' : 'cette étape'} · un toucher sur le pouce pose <span className="bz-m">{formatCurseur(kind, depart)}</span></span></p>
      )}
      {pairMode && <div className="bz-precedent"><button type="button" aria-pressed="true" onClick={() => setPairMode(false)}>Mesure seule</button></div>}
    </section>
  );
}
