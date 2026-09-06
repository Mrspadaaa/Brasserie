import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Volume2, VolumeX, Sun, Sparkles } from 'lucide-react';
import { AppConfig, Batch, BrewDayState, RecipeSnapshot, StockItem } from '../types';
import { ingredientsOf } from '../domain/recipeSnapshot';
import { brewAdviceKey, finalBrewReadings, restoreBrewDay, startBrewStep } from '../domain/brewDay';
import {
  actualAmount,
  areaOf,
  BrewArea,
  brewAlarms,
  brewBitterness,
  brewIngredients,
  boilMinutes,
  changeBoilMinutes,
  effectiveFermentables,
  isBoilStep,
  isUsefulTimer,
  measuredEfficiency,
  mineralFeedback,
  PREPARATIONS
} from '../domain/brewCompanion';
import {
  buildTimeline,
  remainingMs,
  formatCountdown,
  armAudio,
  beep,
  keepScreenAwake,
  releaseScreen
} from '../services/brewTimer';
import { AiClient } from '../services/aiClient';
import { Units } from '../services/units';
import { PageShell } from './PageShell';
import { ConfirmSheet } from '../ui/Sheet';
import { BrewDayMeasurements, BrewUpdate, brewControl } from '../ui/BrewDayMeasurements';
import { BrewIngredients } from '../ui/BrewIngredients';
import { BrewJournal } from '../ui/BrewJournal';
import { BrewAlarmSettings } from '../ui/BrewAlarmSettings';
import { NumberInput } from '../ui/NumberInput';

interface Props {
  batch: Batch;
  config: AppConfig;
  stockItems?: StockItem[];
  onClose: () => void;
  onSave: (batch: Batch) => void;
  onFinish: (batch: Batch) => void;
}
const AREA: Record<BrewArea, string> = {
  preparation: 'Préparer',
  mash: 'Empâter',
  boil: 'Ébullition',
  finish: 'Refroidir'
};
const time = (at: number) =>
  new Date(at).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' });

export function BrewDayPage({ batch, config, stockItems = [], onClose, onSave, onFinish }: Props) {
  const recipe = useMemo(
    () =>
      batch.recipeSnapshot ?? ({ ...batch, ...ingredientsOf(batch) } as unknown as RecipeSnapshot),
    [batch.recipeSnapshot, batch.id]
  );
  const [state, setState] = useState<BrewDayState>(() =>
    restoreBrewDay(batch.brewDay ?? { steps: buildTimeline(recipe), currentIndex: 0, readings: [] })
  );
  const latest = useRef(state);
  const batchRef = useRef(batch);
  batchRef.current = batch;
  const update: BrewUpdate = useCallback(
    (fn) => {
      const next = fn(latest.current);
      if (next === latest.current) return;
      latest.current = next;
      setState(next);
      onSave({ ...batchRef.current, brewDay: next });
    },
    [onSave]
  );
  const [view, setView] = useState<BrewArea | 'recipe' | 'journal'>(() =>
    areaOf(state.steps[state.currentIndex]?.id ?? 'eau')
  );
  const [now, setNow] = useState(Date.now);
  const [sound, setSound] = useState(false);
  const [awake, setAwake] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [note, setNote] = useState('');
  const [advice, setAdvice] = useState<{ key: string; verdict: string; action?: string } | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const aiLock = useRef(false);
  const mounted = useRef(true);
  const current = state.steps[state.currentIndex] ?? {
    id: 'eau',
    label: 'Préparation',
    durationMin: 0
  };
  const alarms = useMemo(() => brewAlarms(state, recipe), [state, recipe]);
  const alarmed = useRef(new Set<string>());
  const area = view === 'recipe' || view === 'journal' ? areaOf(current.id) : view;
  const boiled = isBoilStep(current);
  const duration = boiled ? boilMinutes(state, recipe) : current.durationMin;
  const left =
    boiled && state.boilStartedAt != null && state.boilFinishedAt == null
      ? state.boilStartedAt + duration * 60000 - now
      : !boiled && isUsefulTimer(current) && current.doneAt == null
        ? remainingMs(current, now)
        : null;
  const running = boiled
    ? state.boilStartedAt != null && state.boilFinishedAt == null
    : current.startedAt != null && current.pausedAt == null && current.doneAt == null;
  const showTimer = boiled || isUsefulTimer(current);
  const due = alarms.filter((a) => a.at <= now);
  const upcoming = due[0] ?? alarms.find((a) => a.at > now);
  const actualRecipe = useMemo(() => {
    const fermentables = effectiveFermentables(recipe, state);
    return {
      ...recipe,
      fermentables,
      totalGristKg: fermentables.length
        ? fermentables
            .filter((f) => f.kind === 'grain' && f.use === 'empatage')
            .reduce((sum, f) => sum + f.weightKg, 0)
        : recipe.totalGristKg,
      waterPlan: recipe.waterPlan
        ? {
            ...recipe.waterPlan,
            mashWaterL: state.additions?.['water-mash']?.amount ?? recipe.waterPlan.mashWaterL
          }
        : undefined
    };
  }, [recipe, state.additions]);
  const ingredients = brewIngredients(recipe);
  const bitterness = brewBitterness(recipe, state);
  const signature =
    brewAdviceKey(state) +
    JSON.stringify(state.additions) +
    JSON.stringify(state.preparations) +
    view;
  const signatureRef = useRef(signature);
  signatureRef.current = signature;
  useEffect(() => {
    mounted.current = true;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      mounted.current = false;
      clearInterval(tick);
      void releaseScreen();
    };
  }, []);
  useEffect(() => {
    for (const a of due) {
      const key = `${a.id}:${a.at}`;
      if (!alarmed.current.has(key)) {
        alarmed.current.add(key);
        if (sound) beep(4);
      }
    }
  }, [due, sound]);
  useEffect(() => {
    const visible = () => {
      if (awake && document.visibilityState === 'visible') void keepScreenAwake().then(setAwake);
    };
    document.addEventListener('visibilitychange', visible);
    return () => document.removeEventListener('visibilitychange', visible);
  }, [awake]);
  const choose = (index: number) => {
    setView(areaOf(state.steps[index].id));
    update((s) => ({ ...s, currentIndex: index }));
  };
  const navigate = (next: typeof view) => {
    setView(next);
    if (next === 'recipe' || next === 'journal') return;
    const first = state.steps.findIndex((s) => areaOf(s.id) === next);
    if (first >= 0) update((s) => ({ ...s, currentIndex: first }));
  };
  const start = () => {
    if (armAudio()) setSound(true);
    if (boiled)
      update((s) => {
        const n = { ...s, boilStartedAt: s.boilStartedAt ?? Date.now() };
        delete n.boilFinishedAt;
        return n;
      });
    else update((s) => startBrewStep(s, Date.now()));
  };
  const setDuration = (minutes: number) => {
    if (!Number.isFinite(minutes)) return;
    if (boiled) update((s) => changeBoilMinutes(s, recipe, minutes - boilMinutes(s, recipe)));
    else
      update((s) => ({
        ...s,
        steps: s.steps.map((x, i) =>
          i === s.currentIndex ? { ...x, durationMin: Math.max(1, Math.min(480, minutes)) } : x
        )
      }));
  };
  const completed = boiled ? state.boilFinishedAt != null : current.doneAt != null;
  const toggleComplete = () => {
    update((s) => {
      if (boiled) {
        const n = { ...s };
        if (n.boilFinishedAt != null) delete n.boilFinishedAt;
        else n.boilFinishedAt = Date.now();
        return n;
      }
      return {
        ...s,
        steps: s.steps.map((x, i) => {
          if (i !== s.currentIndex) return x;
          const n = { ...x };
          if (n.doneAt != null) delete n.doneAt;
          else n.doneAt = Date.now();
          return n;
        })
      };
    });
  };
  const addNote = () => {
    if (!note.trim()) return;
    update((s) => ({
      ...s,
      notes: [
        ...(s.notes ?? []),
        { id: crypto.randomUUID(), at: Date.now(), stepId: current.id, text: note.trim() }
      ]
    }));
    setNote('');
    setNotice('Note ajoutée au journal.');
  };
  const analyse = async () => {
    if (aiLock.current) return;
    aiLock.current = true;
    setBusy(true);
    setNotice('');
    if (note.trim()) addNote();
    const s = latest.current;
    const key =
      brewAdviceKey(s) + JSON.stringify(s.additions) + JSON.stringify(s.preparations) + view;
    const response = await AiClient.run<{ verdict: string; immediateAction?: string }>({
      task: 'diagnoseBatch',
      tier: 'fast',
      context: {
        recipe: actualRecipe,
        currentStep: current,
        phase: 'jour de brassage',
        readings: s.readings,
        notes: s.notes,
        acidCorrections: s.acidCorrections,
        ingredients: ingredients
          .filter((i) => i.planned || s.additions?.[i.id])
          .map((i) => ({ ...i, actual: actualAmount(i, s), ...s.additions?.[i.id] })),
        mineralFeedback: mineralFeedback(recipe, s),
        stock: stockItems.map((x) => ({
          name: x.name,
          category: x.category,
          unit: x.unit,
          currentStock: x.currentStock,
          colorEbc: x.colorEbc,
          potentialPpg: x.potentialPpg
        })),
        boilMin: boilMinutes(s, recipe)
      },
      instruction:
        'Aide concrète à la cuve : un constat chiffré, une action possible et sa limite. Analyse les écarts réels, ingrédients déjà versés, disponibilités et remplacement demandés. Une bière hors profil n’est pas nécessairement perdue. Distingue risque sensoriel et risque sanitaire ; ne déclare pas un produit sûr ou perdu sans preuve. Ne prescris pas de dose acide/base : le calculateur de pH mesuré gère cette correction. Ne conseille pas d’ajouter un ingrédient déjà versé. 3 phrases maximum.'
    });
    if (mounted.current) {
      if (signatureRef.current !== key)
        setNotice('Les mesures ont changé pendant l’analyse. Relance pour un conseil à jour.');
      else if (response.ok && typeof response.data?.verdict === 'string')
        setAdvice({
          key,
          verdict: response.data.verdict,
          ...(typeof response.data.immediateAction === 'string'
            ? { action: response.data.immediateAction }
            : {})
        });
      else setNotice(response.error ?? 'Conseil indisponible. Les calculs locaux restent actifs.');
      setBusy(false);
    }
    aiLock.current = false;
  };
  const rig = config.brewhouses?.find((b) => b.id === config.activeBrewhouseId);
  const efficiency = ['preboil', 'ensemencement'].includes(current.id)
    ? measuredEfficiency(actualRecipe, state, current.id)
    : null;
  const stepsHere = state.steps
    .map((s, i) => ({ s, i }))
    .filter(
      ({ s }) =>
        areaOf(s.id) === area && (!isBoilStep(s) || s.id === state.steps.find(isBoilStep)?.id)
    );
  const displayRecipe = view === 'recipe';
  const activeTimers = state.steps.filter(
    (s) => isUsefulTimer(s) && s.startedAt != null && s.doneAt == null
  );
  const finishedReadings = finalBrewReadings(state);
  const confirmed = ingredients.filter(
    (i) => i.planned > 0 && state.additions?.[i.id]?.doneAt != null
  ).length;

  return (
    <PageShell
      title={batch.name}
      subtitle={`${batch.id} · ${recipe.volumeL ?? batch.volumeL} L${recipe.ogTarget ? ` · OG ${recipe.ogTarget.toFixed(3)}` : ''}`}
      onClose={() => (confirmFinish ? setConfirmFinish(false) : onClose())}
      actions={
        <>
          <button
            type="button"
            className={`${brewControl} !border-0 !bg-transparent !px-2`}
            aria-label={sound ? 'Couper les alertes sonores' : 'Activer les alertes sonores'}
            aria-pressed={sound}
            onClick={() => {
              if (sound) setSound(false);
              else if (armAudio()) {
                setSound(true);
                beep(1);
              }
            }}
          >
            {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          <button
            type="button"
            className={`${brewControl} !border-0 !bg-transparent !px-2`}
            aria-label="Garder l’écran allumé"
            aria-pressed={awake}
            onClick={async () => {
              if (awake) {
                await releaseScreen();
                setAwake(false);
              } else setAwake(await keepScreenAwake());
            }}
          >
            <Sun size={19} />
          </button>
        </>
      }
      progress={
        upcoming ? (
          <div className="flex justify-between gap-2 text-2xs text-ebc-straw" aria-live="off">
            <span className="truncate">
              {upcoming.title === 'Ajout en cuve' ? upcoming.body : upcoming.title} ·{' '}
              {time(upcoming.at)}
            </span>
            <span className="reading shrink-0">{formatCountdown(upcoming.at - now)}</span>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-3 pb-3">
        <nav
          aria-label="Phases du brassage"
          className="sticky top-0 z-10 flex flex-wrap gap-1 bg-cave-950 py-1"
        >
          {([...Object.keys(AREA), 'recipe', 'journal'] as (typeof view)[]).map((v) => (
            <button
              type="button"
              key={v}
              aria-pressed={view === v}
              className={`min-h-10 px-2 text-sm rounded-control border ${view === v ? 'border-ebc-straw/60 text-ebc-straw bg-ebc-straw/10' : 'border-cave-700 text-cave-200'}`}
              onClick={() => navigate(v)}
            >
              {v === 'recipe' ? 'Recette' : v === 'journal' ? 'Journal' : AREA[v]}
            </button>
          ))}
        </nav>
        {activeTimers.length > 0 && (
          <div aria-label="Minuteurs actifs" className="flex flex-wrap gap-2">
            {activeTimers.map((s) => (
              <button
                type="button"
                key={s.id}
                className="text-2xs px-2 min-h-9 border border-cave-700 rounded-control text-cave-200"
                onClick={() => choose(state.steps.indexOf(s))}
              >
                {s.label} · {s.pausedAt != null ? 'pause · ' : ''}
                <span className="reading">{formatCountdown(remainingMs(s, now) ?? 0)}</span>
              </button>
            ))}
          </div>
        )}
        {view === 'journal' ? (
          <BrewJournal state={state} recipe={recipe} update={update} />
        ) : (
          <>
            {displayRecipe ? (
              <section className="space-y-2">
                <div className="flex gap-4 flex-wrap text-sm text-cave-200">
                  <span>{recipe.style}</span>
                  <span>{actualRecipe.totalGristKg ?? '—'} kg de grain</span>
                  <span>{boilMinutes(state, recipe)} min d’ébullition</span>
                </div>
                <details>
                  <summary className="min-h-10 text-sm text-cave-200 cursor-pointer">
                    Programme et notes de recette
                  </summary>
                  <ul className="text-sm text-cave-200 space-y-1">
                    {state.steps
                      .filter((s) => !isBoilStep(s))
                      .map((s) => (
                        <li key={s.id}>
                          {s.label}
                          {s.tempC ? ` · ${s.tempC} °C` : ''}
                          {isUsefulTimer(s) ? ` · ${s.durationMin} min` : ''}
                        </li>
                      ))}
                  </ul>
                  <p className="text-sm text-cave-400 whitespace-pre-wrap mt-2">
                    {recipe.instructions}
                  </p>
                  {(recipe.notes ?? []).map((n, i) => (
                    <p key={i} className="text-sm text-cave-400">
                      {n}
                    </p>
                  ))}
                </details>
                {((recipe.hops ?? []).some((h) => h.stage === 'dryHop') ||
                  recipe.fermentation?.length ||
                  recipe.fermentables?.some((f) => f.use === 'fermentation')) && (
                  <details>
                    <summary className="min-h-10 text-sm text-cave-200 cursor-pointer">
                      Après le brassage · fermentation et houblonnage à cru
                    </summary>
                    <ul className="text-sm text-cave-200 space-y-1">
                      {(recipe.hops ?? [])
                        .filter((h) => h.stage === 'dryHop')
                        .map((h, i) => (
                          <li key={'h' + i}>
                            {h.name} · {Units.format(h.weightG, 'g')} · houblonnage à cru
                            {h.dayOffset != null ? ' · J' + h.dayOffset : ''}
                          </li>
                        ))}
                      {recipe.fermentables
                        ?.filter((f) => f.use === 'fermentation')
                        .map((f, i) => (
                          <li key={'f' + i}>
                            {f.name} · {Units.format(f.weightKg, 'kg')} · fermentation
                          </li>
                        ))}
                      {recipe.fermentation?.map((f, i) => (
                        <li key={'p' + i}>
                          {f.name} · {f.tempC} °C · {f.days} jours{f.note ? ' · ' + f.note : ''}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </section>
            ) : (
              <>
                {stepsHere.length > 1 && (
                  <div aria-label="Étapes disponibles" className="flex flex-wrap gap-1">
                    {stepsHere.map(({ s, i }) => (
                      <button
                        type="button"
                        key={s.id}
                        className={`min-h-9 px-2 text-2xs rounded-control ${current.id === s.id ? 'bg-cave-800 text-ebc-straw' : 'text-cave-200'}`}
                        aria-pressed={current.id === s.id}
                        onClick={() => choose(i)}
                      >
                        {s.doneAt != null ? '✓ ' : ''}
                        {isBoilStep(s) ? 'Cuve en ébullition' : s.label}
                      </button>
                    ))}
                  </div>
                )}
                <section aria-label="Étape consultée" className="space-y-2">
                  <div className="flex gap-2 justify-between items-center">
                    <h2 className="text-lg font-semibold text-cave-50">
                      {boiled ? 'Ébullition' : current.label}
                      {current.tempC != null && (
                        <span className="reading text-ebc-straw ml-2">{current.tempC} °C</span>
                      )}
                    </h2>
                    <label className="text-2xs text-cave-200 flex items-center gap-2 min-h-10">
                      <input
                        type="checkbox"
                        checked={completed}
                        onChange={toggleComplete}
                        className="w-4 h-4 accent-ebc-straw"
                      />
                      {boiled ? 'Feu coupé' : 'Terminé'}
                    </label>
                  </div>
                  {!showTimer &&
                    current.id !== 'eau' &&
                    current.id !== 'concassage' &&
                    current.detail && <p className="text-sm text-cave-200">{current.detail}</p>}
                  {showTimer && (
                    <div className="rounded-panel border border-cave-700 bg-cave-900 px-3 py-2 space-y-2">
                      <div className="flex items-center gap-3">
                        <output
                          aria-label="Temps restant"
                          aria-live="off"
                          className={`reading text-3xl flex-1 ${left != null && left < 0 ? 'text-ebc-straw' : 'text-cave-50'}`}
                        >
                          {formatCountdown(left ?? duration * 60000)}
                        </output>
                        {!running && !completed ? (
                          <button
                            type="button"
                            onClick={start}
                            className={`${brewControl} !bg-ebc-straw !text-cave-950 flex items-center gap-1`}
                          >
                            <Play size={16} />
                            {current.pausedAt != null
                              ? 'Reprendre'
                              : boiled
                                ? 'Ébullition atteinte'
                                : 'Démarrer'}
                          </button>
                        ) : !boiled && running ? (
                          <button
                            type="button"
                            aria-label="Mettre le minuteur en pause"
                            className={brewControl}
                            onClick={() =>
                              update((s) => ({
                                ...s,
                                steps: s.steps.map((x, i) =>
                                  i === s.currentIndex ? { ...x, pausedAt: Date.now() } : x
                                )
                              }))
                            }
                          >
                            <Pause size={18} />
                          </button>
                        ) : null}
                      </div>
                      <div
                        className="flex items-center gap-1"
                        role="group"
                        aria-label="Ajuster la durée"
                      >
                        {[-5, -1].map((d) => (
                          <button
                            type="button"
                            key={d}
                            className={`${brewControl} !px-2`}
                            aria-label={`Retirer ${-d} minutes`}
                            onClick={() => setDuration(duration + d)}
                          >
                            {d}
                          </button>
                        ))}
                        <label className="flex items-center gap-1 text-2xs text-cave-200 flex-1">
                          <NumberInput
                            value={duration}
                            min={1}
                            max={480}
                            integer
                            onValue={setDuration}
                            aria-label="Durée totale en minutes"
                            className="w-full min-w-0 h-10 reading text-center bg-cave-950 border border-cave-600 rounded-control text-base text-cave-50"
                          />
                          min
                        </label>
                        {[1, 5].map((d) => (
                          <button
                            type="button"
                            key={d}
                            className={`${brewControl} !px-2`}
                            aria-label={`Ajouter ${d} minutes`}
                            onClick={() => setDuration(duration + d)}
                          >
                            +{d}
                          </button>
                        ))}
                      </div>
                      <p className="text-2xs text-cave-400">
                        {boiled
                          ? 'Les prochains ajouts suivent le temps avant la fin. Ceux déjà versés restent consignés à leur heure réelle.'
                          : 'Démarre à température atteinte. Tu peux consulter les autres tâches pendant ce palier.'}
                      </p>
                    </div>
                  )}
                  {boiled &&
                    bitterness &&
                    Math.abs(bitterness.projected - bitterness.planned) >= 1 && (
                      <p className="text-2xs text-ebc-straw">
                        ≈ {bitterness.projected} IBU avec ces ajouts et durées · recette{' '}
                        {bitterness.planned}. Projection au volume et à l’OG prévus ; une ébullition
                        prolongée concentre aussi le moût.
                      </p>
                    )}
                </section>
                {due.length > 0 && (
                  <aside
                    role="status"
                    className="text-sm text-ebc-straw border-l-2 border-ebc-straw pl-2"
                  >
                    {due.map((a) => (
                      <p key={a.id}>
                        <strong>{a.title}</strong> · {a.body}
                      </p>
                    ))}
                  </aside>
                )}
              </>
            )}
            <BrewIngredients
              recipe={recipe}
              state={state}
              stock={stockItems}
              area={area}
              overview={displayRecipe}
              update={update}
            />
            {!displayRecipe && (
              <section aria-label="Préparations" className="border-t border-cave-800 pt-1">
                <h3 className="text-sm text-cave-50 font-semibold py-1">À préparer</h3>
                {PREPARATIONS.filter((p) => p.area === area).map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 min-h-10 text-sm text-cave-200"
                  >
                    <input
                      className="w-4 h-4 accent-ebc-straw"
                      type="checkbox"
                      checked={!!state.preparations?.[p.id]}
                      onChange={(e) =>
                        update((s) => ({
                          ...s,
                          preparations: { ...s.preparations, [p.id]: e.target.checked }
                        }))
                      }
                    />
                    {p.label}
                  </label>
                ))}
              </section>
            )}
            {!displayRecipe && area !== 'preparation' && (
              <div className="border-t border-cave-800 pt-3">
                <BrewDayMeasurements
                  key={current.id}
                  step={current}
                  recipe={actualRecipe}
                  state={state}
                  update={update}
                />
              </div>
            )}
            {!displayRecipe && area === 'preparation' && (
              <details>
                <summary className="min-h-10 text-sm text-cave-200 cursor-pointer">
                  Relever un volume, une température ou une mesure d’eau
                </summary>
                <BrewDayMeasurements
                  key={current.id}
                  step={current}
                  recipe={actualRecipe}
                  state={state}
                  update={update}
                />
              </details>
            )}
            {efficiency && !displayRecipe && (
              <section
                aria-label="Rendement mesuré"
                className="rounded-control border border-cave-700 p-3"
              >
                <h3 className="text-sm font-semibold text-cave-50">
                  {current.id === 'preboil'
                    ? 'Rendement d’empâtage + filtration'
                    : 'Rendement global en fermenteur'}
                </h3>
                {efficiency.known ? (
                  <>
                    <p
                      className={`reading text-2xl ${efficiency.questionable ? 'text-ebc-straw' : 'text-cave-50'}`}
                    >
                      {efficiency.pct} %{' '}
                      {efficiency.approximate && <span className="text-sm">≈</span>}
                    </p>
                    <p className="text-2xs text-cave-200">
                      {efficiency.volumeL} L × densité {efficiency.sg.toFixed(3)} / potentiel des
                      ingrédients.{efficiency.direct && ' Sucres et extraits pris en compte.'}
                    </p>
                    <p className="text-2xs text-cave-400 mt-1">
                      {efficiency.questionable
                        ? 'Résultat impossible : vérifie unités, volume, densité et potentiels.'
                        : efficiency.approximate
                          ? 'Estimation : confirme densité corrigée et volume ramené à 20 °C.'
                          : rig && current.id === 'ensemencement'
                            ? `Repère matériel : ${rig.efficiencyPct} %. Compare aussi les pertes de transfert.`
                            : 'Volume et densité doivent correspondre au même moût.'}
                    </p>
                    {efficiency.spreadMin > 30 && (
                      <p className="text-2xs text-ebc-straw">
                        Les deux relevés sont espacés de plus de 30 minutes : confirme qu’ils
                        décrivent le même volume.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-cave-400">{efficiency.reason}</p>
                )}
              </section>
            )}
            {area === 'finish' && !displayRecipe && (
              <button
                type="button"
                className={`${brewControl} w-full !bg-ebc-straw !text-cave-950 font-semibold`}
                onClick={() => setConfirmFinish(true)}
              >
                Clôturer le brassage
              </button>
            )}
          </>
        )}
        <section aria-label="Notes et conseil" className="space-y-2">
          <label htmlFor="brew-note" className="text-sm font-semibold text-cave-50">
            Un imprévu à la cuve ?
          </label>
          <textarea
            id="brew-note"
            aria-label="Carnet de cuve"
            value={note}
            rows={2}
            maxLength={2000}
            placeholder="Trop d’Epsom, malt manquant, débit faible…"
            onChange={(e) => {
              setNote(e.target.value);
              setNotice('');
            }}
            className="w-full text-base text-cave-50 bg-cave-900 border border-cave-700 rounded-control px-3 py-2 focus:border-ebc-straw outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              className={`${brewControl} flex-1`}
              disabled={!note.trim()}
              onClick={addNote}
            >
              Noter
            </button>
            <button
              type="button"
              className={`${brewControl} flex-1 flex justify-center items-center gap-1`}
              disabled={busy}
              onClick={analyse}
            >
              <Sparkles size={16} />
              {busy ? 'Analyse…' : 'Conseil IA'}
            </button>
          </div>
          {notice && (
            <p role="status" className="text-2xs text-cave-200">
              {notice}
            </p>
          )}
          {advice?.key === signature && (
            <aside role="status" className="border-l-2 border-water pl-2 text-sm text-cave-200">
              <p>{advice.verdict}</p>
              {advice.action && <p className="text-cave-50 mt-1">{advice.action}</p>}
            </aside>
          )}
          {advice && advice.key !== signature && (
            <p className="text-2xs text-cave-400">Le contexte a changé : actualise le conseil.</p>
          )}
        </section>
        <BrewAlarmSettings batchId={batch.id} alarms={alarms} />
      </div>
      <ConfirmSheet
        open={confirmFinish}
        onClose={() => setConfirmFinish(false)}
        title="Clôturer le brassage ?"
        what={`OG ${finishedReadings.gravity?.value.toFixed(3) ?? 'non relevée'} · ${finishedReadings.volume?.value ?? '—'} L en fermenteur.`}
        consequence={`${confirmed}/${ingredients.filter((i) => i.planned > 0).length} ajouts cochés. Le journal et les écarts resteront consultables. Le brassin passera en fermentation.`}
        confirmLabel="Clôturer"
        onConfirm={() => {
          const f = finalBrewReadings(latest.current);
          onFinish({
            ...batchRef.current,
            brewDay: { ...latest.current, finishedAt: Date.now() },
            ...(f.gravity ? { og: f.gravity.value.toFixed(3) } : {}),
            ...(f.volume ? { volumeBrewedL: f.volume.value } : {}),
            status: 'fermentation'
          });
        }}
      />
    </PageShell>
  );
}
