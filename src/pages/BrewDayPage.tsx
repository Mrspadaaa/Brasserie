import { Textarea } from '../ui/Input';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pause,
  Play,
  Volume2,
  VolumeX,
  Sun,
  Sparkles,
  Check,
  ChevronRight,
  ChevronDown,
  Clock3,
  NotebookPen,
  BookOpen,
  SlidersHorizontal,
  Thermometer,
  ListChecks,
  ArrowLeft,
  BellRing
} from 'lucide-react';
import './brew-day.css';
import { AppConfig, Batch, BrewDayState, RecipeSnapshot, StockItem } from '../types';
import { ingredientsOf } from '../domain/recipeSnapshot';
import { brewAdviceKey, finalBrewReadings, isMash, measuredReadingFeedback, READING, restoreBrewDay, startBrewStep } from '../domain/brewDay';
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
import {
  BrewDayMeasurements,
  BrewReadingDraft,
  BrewUpdate,
  brewControl
} from '../ui/BrewDayMeasurements';
import { BrewIngredients } from '../ui/BrewIngredients';
import { BrewJournal } from '../ui/BrewJournal';
import { BrewCapturePanel } from '../ui/BrewCapturePanel';
import { BrewChoice } from '../ui/BrewChoice';
import { BrewTag, BrewTagTone } from '../ui/BrewTag';
import { useBrewSound } from '../ui/useBrewSound';
import { BrewReadingsSummary } from '../ui/BrewReadingsSummary';
import { BrewAlarmSettings } from '../ui/BrewAlarmSettings';
import { NumberInput } from '../ui/NumberInput';
import { useBrewSession } from '../ui/useBrewSession';
import { brewNow } from '../services/brewClock';
import { BrewAssist } from '../ui/BrewAssist';
import { YeastBrewDayGuide } from '../ui/YeastBrewDayGuide';
import { buildYeastCompanion } from '../domain/yeastCompanion';
import { StorageService } from '../services/storage';
import { BrewerChat } from '../ui/BrewerChat';
import { HopRecipePanel } from '../ui/hopIndex/HopRecipePanel';
import { recipeForHopAnalysis } from '../domain/hopIndex/engine';
import { readingPrompt } from '../domain/brewAssist';
import { ReadingKind } from '../domain/brewDay';
import { NoloBrewDayGuide } from '../ui/NoloBrewDayGuide';
import { noloExecutionRecipe } from '../domain/noloBrewDay';

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
  new Date(at).toLocaleTimeString('fr-CH', {
    hour: '2-digit',
    minute: '2-digit'
  });

export function BrewDayPage({ batch, config, stockItems = [], onClose, onSave, onFinish }: Props) {
  const recipe = useMemo(
    () =>
      batch.recipeSnapshot ?? ({ ...batch, ...ingredientsOf(batch) } as unknown as RecipeSnapshot),
    [batch.recipeSnapshot, batch.id]
  );
  const session = useBrewSession(
    batch,
    () =>
      restoreBrewDay(
        batch.brewDay ?? {
          steps: buildTimeline(recipe),
          currentIndex: 0,
          readings: []
        }
      ),
    onSave
  );
  const executionRecipe = useMemo(() => noloExecutionRecipe(recipe), [recipe]);
  const noloProcess = recipe.nolo?.enabled ? recipe.nolo.process : undefined;
  const specialExtraction = noloProcess === 'secondRunnings' || noloProcess === 'coldExtraction';
  const areaLabels = specialExtraction ? { ...AREA, mash: 'Extraire' } : AREA;
  const { state, latest, update } = session;
  const batchRef = useRef(batch);
  batchRef.current = batch;
  const [view, setView] = useState<BrewArea | 'recipe' | 'journal'>(() =>
    areaOf(state.steps[state.currentIndex]?.id ?? 'eau')
  );
  const [now, setNow] = useState(brewNow);
  const [sound, setSound] = useState(false);
  const [awake, setAwake] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (notice !== 'Note ajoutée au journal.') return;
    const timer = window.setTimeout(() => setNotice(''), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmAdvance, setConfirmAdvance] = useState(false);
  const [note, setNote] = useState('');
  const [noteStepId, setNoteStepId] = useState<string>();
  const [capture, setCapture] = useState<'measure' | 'note' | null>(null);
  const readingDrafts = useRef(new Map<string, BrewReadingDraft>());
  const [requestedReading, setRequestedReading] = useState<{
    kind: ReadingKind;
    token: number;
  }>();
  const [durationOpen, setDurationOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [advice, setAdvice] = useState<{
    key: string;
    verdict: string;
    action?: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const aiLock = useRef(false);
  const mounted = useRef(true);
  const current = state.steps[state.currentIndex] ?? {
    id: 'eau',
    label: 'Préparation',
    durationMin: 0
  };
  const alarms = useMemo(() => brewAlarms(state, recipe), [state, recipe]);
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
  const alarmSound = useBrewSound(
    due.filter((a) => now - a.at <= 5 * 60000),
    sound
  );
  const upcoming = due[0] ?? alarms.find((a) => a.at > now);
  const actualRecipe = useMemo(() => {
    const fermentables = effectiveFermentables(executionRecipe, state);
    return {
      ...executionRecipe,
      fermentables,
      totalGristKg: fermentables.length
        ? fermentables
            .filter((f) => f.kind === 'grain' && f.use === 'empatage')
            .reduce((sum, f) => sum + f.weightKg, 0)
        : executionRecipe.totalGristKg,
      waterPlan: executionRecipe.waterPlan
        ? {
            ...executionRecipe.waterPlan,
            mashWaterL: state.additions?.['water-mash']?.amount ?? executionRecipe.waterPlan.mashWaterL
          }
        : undefined
    };
  }, [executionRecipe, state.additions]);
  // NOLO shortcuts already show normal readings. Keep actionable feedback visible.
  const showReadingSummary = !recipe.nolo?.enabled || Object.keys(READING).some(kind => {
    const reading = [...(state.readings ?? [])].reverse().find(r => r.kind === kind && r.stepId === current.id);
    if (!reading) return false;
    const feedback = measuredReadingFeedback(reading, state, current, actualRecipe);
    return feedback.tone === 'watch' || (kind === 'ph' && isMash(current.id) && feedback.tone === 'neutral');
  });
  const ingredients = brewIngredients(executionRecipe);
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
    const tick = setInterval(() => setNow(brewNow()), 1000);
    return () => {
      mounted.current = false;
      clearInterval(tick);
      void releaseScreen();
    };
  }, []);
  useEffect(() => {
    const visible = () => {
      if (awake && document.visibilityState === 'visible') void keepScreenAwake().then(setAwake);
    };
    document.addEventListener('visibilitychange', visible);
    return () => document.removeEventListener('visibilitychange', visible);
  }, [awake]);
  const choose = (index: number) => {
    if (index < 0 || !state.steps[index]) return;
    setNotice('');
    setView(areaOf(state.steps[index].id));
    update((s) => ({ ...s, currentIndex: index }));
    setDurationOpen(false);
    setRequestedReading(undefined);
    contentRef.current?.closest('main')?.scrollTo?.({ top: 0 });
  };
  const navigate = (next: typeof view) => {
    setNotice('');
    contentRef.current?.closest('main')?.scrollTo?.({ top: 0 });
    setView(next);
    if (next === 'recipe' || next === 'journal') return;
    if (areaOf(current.id) === next) return;
    const first = state.steps.findIndex(
      (s) =>
        areaOf(s.id) === next && (isBoilStep(s) ? state.boilFinishedAt == null : s.doneAt == null)
    );
    const fallback = state.steps.findIndex((s) => areaOf(s.id) === next);
    if (first >= 0 || fallback >= 0) choose(first >= 0 ? first : fallback);
  };
  const start = () => {
    if (!session.canStart) return;
    setNotice('');
    if (armAudio()) setSound(true);
    if (boiled)
      update((s) => {
        const n = { ...s, boilStartedAt: s.boilStartedAt ?? brewNow() };
        delete n.boilFinishedAt;
        return n;
      });
    else update((s) => startBrewStep(s, brewNow()));
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
        else n.boilFinishedAt = brewNow();
        return n;
      }
      return {
        ...s,
        steps: s.steps.map((x, i) => {
          if (i !== s.currentIndex) return x;
          const n = { ...x };
          if (n.doneAt != null) delete n.doneAt;
          else n.doneAt = brewNow();
          return n;
        })
      };
    });
  };
  const addNote = (close = true) => {
    if (!note.trim()) return;
    update((s) => ({
      ...s,
      notes: [
        ...(s.notes ?? []),
        {
          id: crypto.randomUUID(),
          at: brewNow(),
          stepId: noteStepId ?? current.id,
          text: note.trim()
        }
      ]
    }));
    setNote('');
    setNoteStepId(undefined);
    if (close) setCapture(null);
    setNotice('Note ajoutée au journal.');
  };
  const analyse = async () => {
    if (aiLock.current) return;
    aiLock.current = true;
    setBusy(true);
    setNotice('');
    if (note.trim()) addNote(false);
    const s = latest.current;
    const key =
      brewAdviceKey(s) + JSON.stringify(s.additions) + JSON.stringify(s.preparations) + view;
    const response = await AiClient.run<{
      verdict: string;
      immediateAction?: string;
    }>({
      task: 'diagnoseBatch',
      tier: 'fast',
      context: {
        recipe: recipe.nolo?.enabled ? recipe : actualRecipe,
        yeastPlan: recipe.yeast ? buildYeastCompanion(recipe, StorageService.getHopKnowledge(), { maxAlternatives: 0 }) : undefined,
        currentStep: current,
        phase: 'jour de brassage',
        readings: s.readings,
        notes: s.notes,
        acidCorrections: s.acidCorrections,
        ingredients: ingredients
          .filter((i) => i.planned || s.additions?.[i.id])
          .map((i) => ({
            ...i,
            actual: actualAmount(i, s),
            ...s.additions?.[i.id]
          })),
        mineralFeedback: mineralFeedback(executionRecipe, s),
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
  const efficiency = !specialExtraction && ['preboil', 'ensemencement'].includes(current.id)
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

  const route = state.steps.filter(
    (s) => !isBoilStep(s) || s.id === state.steps.find(isBoilStep)?.id
  );
  const recipeSteps = buildTimeline(recipe);
  const plannedRoute = recipeSteps.filter(
    (s) => !isBoilStep(s) || s.id === recipeSteps.find(isBoilStep)?.id
  );
  const prompt = readingPrompt(current, state, now);
  const staleTimer = running && left != null && left < -30 * 60000;
  const routeIndex = route.findIndex((s) => s.id === current.id || (boiled && isBoilStep(s)));
  const stepTag = (step: typeof current): { label: string; tone: BrewTagTone } => {
    const boil = isBoilStep(step);
    if (boil ? state.boilFinishedAt != null : step.doneAt != null)
      return { label: 'Terminé', tone: 'done' };
    if (!boil && step.pausedAt != null) return { label: 'En pause', tone: 'pause' };
    const started = boil ? state.boilStartedAt : step.startedAt;
    if (started == null) return { label: 'À faire', tone: 'neutral' };
    const remaining = boil
      ? started + boilMinutes(state, recipe) * 60000 - now
      : remainingMs(step, now);
    return remaining != null && remaining <= 0
      ? { label: 'Temps écoulé', tone: 'due' }
      : { label: 'En cours', tone: 'active' };
  };
  const currentTag = stepTag(current);
  const nextStep = route[routeIndex + 1];
  const doneCount = route.filter((s) =>
    isBoilStep(s) ? state.boilFinishedAt != null : s.doneAt != null
  ).length;
  const phasePreps = PREPARATIONS.filter((p) => p.area === area &&
    !(noloProcess === 'secondRunnings' && p.id === 'moulin') &&
    !(specialExtraction && p.id === 'rinçage'));
  const preparationCount = phasePreps.filter((p) => state.preparations?.[p.id]).length;
  const instructions =
    current.id === 'eau' && noloProcess === 'secondRunnings'
      ? current.detail
      : current.id === 'eau' && noloProcess === 'coldExtraction'
        ? current.detail
      : current.id === 'eau'
      ? 'Prépare et traite les eaux d’empâtage et de rinçage séparément.'
      : current.id === 'concassage'
        ? 'Pèse chaque grain et règle le moulin. Les quantités peuvent être ajustées à la pesée.'
        : boiled
          ? 'Lance l’horloge à franche ébullition. Les ajouts sont indiqués en minutes avant la fin.'
          : current.id === 'whirlpool'
            ? 'Atteins la température de consigne, ajoute les houblons puis lance le temps de contact.'
            : /^mash/.test(current.id)
              ? 'Homogénéise la maische et vérifie la température avant de lancer le palier.'
              : current.id === 'ensemencement'
                ? 'Relève la densité et le volume du moût refroidi, puis ajoute la levure selon sa notice.'
                : current.detail;
  const finishAndContinue = () => {
    if (!completed) toggleComplete();
    if (nextStep) choose(state.steps.indexOf(nextStep));
  };
  const isConsulting = view === 'recipe' || view === 'journal';
  const otherTimers = activeTimers.filter((s) => isConsulting || s.id !== current.id);
  const otherBoil =
    state.boilStartedAt != null && state.boilFinishedAt == null && (isConsulting || !boiled);
  const headerAlarm =
    upcoming &&
    now - upcoming.at <= 30 * 60000 &&
    (upcoming.at <= now ||
      upcoming.title === 'Ajout en cuve' ||
      isConsulting ||
      upcoming.stepId !== current.id)
      ? upcoming
      : undefined;
  const lastStep = !nextStep;
  const primaryLabel = isConsulting
    ? 'Revenir au brassage'
    : lastStep
      ? 'Clôturer le brassage'
      : showTimer && !running && !completed
        ? current.pausedAt != null
          ? 'Reprendre'
          : boiled
            ? 'Ébullition atteinte'
            : 'Démarrer'
        : completed
          ? 'Étape suivante'
          : boiled
            ? 'Couper le feu et continuer'
            : showTimer
              ? 'Terminer le palier'
              : 'Terminer et continuer';
  const primaryAction = () => {
    if (isConsulting) navigate(areaOf(current.id));
    else if (lastStep) setConfirmFinish(true);
    else if (showTimer && !running && !completed) start();
    else if (!completed && showTimer && left != null && left > 0) setConfirmAdvance(true);
    else finishAndContinue();
  };
  const openCapture = (kind: 'measure' | 'note') => {
    if (kind === 'measure' && isConsulting) navigate(areaOf(current.id));
    setCapture(kind);
    if (window.matchMedia('(min-width: 901px)').matches)
      requestAnimationFrame(() => {
        const panel = contentRef.current?.querySelector(
          kind === 'measure' ? '.brew-measure-capture' : '.brew-note-capture'
        );
        panel?.scrollIntoView({ block: 'nearest' });
        panel
          ?.querySelector<HTMLElement>(kind === 'measure' ? '#brew-reading' : '#brew-note')
          ?.focus({ preventScroll: true });
      });
  };
  const requestMeasure = (kind: ReadingKind) => {
    setRequestedReading({ kind, token: performance.now() });
    openCapture('measure');
  };
  const noteNolo = (subject: string) => {
    setNote(previous => previous.trim() ? previous : `NOLO · ${subject} : `);
    setNoteStepId(current.id);
    openCapture('note');
  };

  const viewNavigation = (
    <nav aria-label="Vues du brassin" className="brew-view-tabs">
      <button
        type="button"
        aria-pressed={!isConsulting}
        onClick={() => navigate(areaOf(current.id))}
      >
        <SlidersHorizontal size={16} />
        Conduite
      </button>
      <button
        type="button"
        aria-label="Recette"
        aria-pressed={view === 'recipe'}
        onClick={() => navigate('recipe')}
      >
        <BookOpen size={16} />
        Recette
      </button>
      <button
        type="button"
        aria-label="Journal"
        aria-pressed={view === 'journal'}
        onClick={() => navigate('journal')}
      >
        <NotebookPen size={16} />
        Journal
      </button>
      <span className="brew-progress-label">
        {doneCount}/{route.length} étapes
      </span>
    </nav>
  );
  return (
    <PageShell
      wide
      className="brew-page"
      title={batch.name}
      subtitle={
        session.error
          ? 'Journal à synchroniser · brouillon conservé'
          : `Jour de brassage · ${batch.id} · ${recipe.volumeL ?? batch.volumeL ?? '—'} L`
      }
      onClose={() =>
        capture
          ? setCapture(null)
          : confirmFinish
            ? setConfirmFinish(false)
            : confirmAdvance
              ? setConfirmAdvance(false)
              : onClose()
      }
      actions={
        <>
          <button
            type="button"
            className="brew-icon-button"
            aria-label={sound ? 'Couper les alertes sonores' : 'Activer les alertes sonores'}
            aria-pressed={sound}
            onClick={() => {
              if (sound) {
                alarmSound.stop();
                setSound(false);
              } else if (armAudio()) {
                setSound(true);
                beep(1);
              }
            }}
          >
            {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          <button
            type="button"
            className="brew-icon-button"
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
        <>
          {viewNavigation}
          {alarmSound.ringing && (
            <div className="brew-ringing" role="status">
              {due[0] ? (
                <button
                  type="button"
                  className="brew-ringing-reason"
                  onClick={() => choose(state.steps.findIndex((s) => s.id === due[0].stepId))}
                >
                  <BellRing size={18} />
                  <span>
                    À faire maintenant
                    <strong>{due[0].title === 'Ajout en cuve' ? due[0].body : due[0].title}</strong>
                  </span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <BrewTag tone="due">Sonnerie</BrewTag>
              )}
              <button
                type="button"
                className="brew-ringing-stop"
                aria-label="Arrêter la sonnerie"
                onClick={alarmSound.stop}
              >
                <VolumeX size={18} />
                {due.length ? 'Arrêter' : 'Arrêter la sonnerie'}
              </button>
            </div>
          )}
          {headerAlarm && !alarmSound.ringing && (
            <button
              type="button"
              className={`brew-next-alarm ${headerAlarm.at <= now ? 'is-due' : ''}`}
              onClick={() => choose(state.steps.findIndex((s) => s.id === headerAlarm.stepId))}
            >
              <BellRing size={16} />
              <span>
                {headerAlarm.at <= now ? 'À faire maintenant' : `À ${time(headerAlarm.at)}`}
                <strong>
                  {headerAlarm.title === 'Ajout en cuve' ? headerAlarm.body : headerAlarm.title}
                </strong>
              </span>
              <span className="brew-digits">{formatCountdown(headerAlarm.at - now)}</span>
              <ChevronRight size={16} />
            </button>
          )}
        </>
      }
      footer={
        <div className="brew-footer">
          <div className="brew-footer-context">
            <span>
              {isConsulting ? 'Étape en cours' : completed ? 'Étape terminée' : 'À la cuve'}
            </span>
            <strong>
              {isConsulting
                ? current.label
                : nextStep
                  ? `Ensuite : ${isBoilStep(nextStep) ? 'Ébullition' : nextStep.label}`
                  : 'Passage en fermentation'}
            </strong>
          </div>
          <div className="brew-footer-actions">
            <button
              type="button"
              className="brew-quick-entry"
              aria-label="Relever une mesure"
              disabled={!session.canStart}
              onClick={() => openCapture('measure')}
            >
              <Thermometer size={20} />
              <span>Mesurer</span>
            </button>
            <button
              type="button"
              className="brew-quick-entry"
              aria-label="Ajouter une note"
              disabled={!session.canStart}
              onClick={() => openCapture('note')}
            >
              <NotebookPen size={20} />
              <span>{note.trim() ? 'Brouillon' : 'Note'}</span>
            </button>
            <button
              type="button"
              className="brew-primary"
              disabled={!session.canStart}
              onClick={primaryAction}
            >
              {isConsulting ? (
                <ArrowLeft size={18} />
              ) : showTimer && !running && !completed && !lastStep ? (
                <Play size={18} />
              ) : (
                <Check size={18} />
              )}
              <span>{primaryLabel}</span>
              {!isConsulting && <ChevronRight size={18} />}
            </button>
          </div>
        </div>
      }
    >
      <BrewerChat scope={{kind:'batch',id:batch.id}} label={recipe.name} phase={state.finishedAt?'fermentation':current?.label} localJournal={state}
        editableTargets={session.canStart ? ['journal','batch'] : []} beforeApply={session.flush}
        onApplied={()=>session.live ? session.reload() : undefined}
        onKeep={session.canStart ? text=>update(s=>({...s,notes:[...(s.notes??[]),{id:crypto.randomUUID(),at:brewNow(),stepId:current?.id??'notes',text}]})) : undefined} />
      <div ref={contentRef} className="brew-workspace">
        <details className="brew-context-details rounded-control border border-cave-700"><summary className="cursor-pointer min-h-touch text-cave-200">Vigilances et potentiel des houblons</summary><p className="text-sm text-cave-400">Quantités du journal si renseignées, au volume prévu de la recette. Les temps de contact à l’ébullition suivent les ajouts terminés.</p><HopRecipePanel recipe={recipeForHopAnalysis(actualRecipe, state)} batchId={batch.id} /></details>
        {notice && !capture && (
          <div className="brew-toast" role="status">
            {notice}
          </div>
        )}
        <nav aria-label="Phases du brassage" className="brew-navigation" hidden={isConsulting}>
          <div className="brew-phases">
            {(Object.keys(AREA) as BrewArea[]).map((v, index) => {
              const phaseSteps = route.filter((s) => areaOf(s.id) === v);
              const phaseDone =
                phaseSteps.length > 0 &&
                phaseSteps.every((s) =>
                  isBoilStep(s) ? state.boilFinishedAt != null : s.doneAt != null
                );
              return (
                <button
                  type="button"
                  key={v}
                  disabled={!phaseSteps.length || !session.canStart}
                  aria-label={areaLabels[v]}
                  aria-pressed={!isConsulting && view === v}
                  className={`brew-phase ${phaseDone ? 'is-complete' : ''}`}
                  onClick={() => navigate(v)}
                >
                  <span className="brew-phase-number" aria-hidden="true">
                    {phaseDone ? <Check size={16} /> : index + 1}
                  </span>
                  <span>{areaLabels[v]}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {!isConsulting && (otherTimers.length > 0 || otherBoil) && (
          <div aria-label="Minuteurs actifs" className="brew-timer-tray">
            {otherTimers.map((s) => (
              <button
                type="button"
                key={s.id}
                className="brew-timer-chip"
                disabled={!session.canStart}
                onClick={() => choose(state.steps.indexOf(s))}
              >
                <Clock3 size={15} />
                <span>{s.label}</span>
                <strong className="brew-digits">
                  {s.pausedAt != null ? 'Pause · ' : ''}
                  {formatCountdown(remainingMs(s, now) ?? 0)}
                </strong>
              </button>
            ))}
            {otherBoil && (
              <button
                type="button"
                className="brew-timer-chip"
                disabled={!session.canStart}
                onClick={() => choose(state.steps.findIndex(isBoilStep))}
              >
                <Clock3 size={15} />
                <span>Ébullition</span>
                <strong className="brew-digits">
                  {formatCountdown(state.boilStartedAt + boilMinutes(state, recipe) * 60000 - now)}
                </strong>
              </button>
            )}
          </div>
        )}

        <fieldset
          className={`brew-layout ${isConsulting ? 'is-consulting' : ''}`}
          disabled={!session.canStart}
          aria-label="Conduite du brassage"
          data-area={isConsulting ? undefined : area}
        >
          <div className="brew-main-column">
            {view === 'journal' ? (
              <BrewJournal state={state} recipe={recipe} update={update} />
            ) : (
              <>
                {displayRecipe ? (
                  <section className="brew-recipe-summary">
                    <div className="brew-section-heading">
                      <div>
                        <h2>
                          Recette{' '}
                          {recipe.version != null && (
                            <BrewTag tone="info">v{recipe.version}</BrewTag>
                          )}
                        </h2>
                      </div>
                      <BookOpen size={24} />
                    </div>
                    <div className="brew-recipe-targets">
                      <div>
                        <span>Volume visé</span>
                        <strong>
                          {recipe.volumeL ?? '—'} <small>L</small>
                        </strong>
                      </div>
                      <div>
                        <span>Densité initiale</span>
                        <strong>
                          {recipe.ogTarget?.toFixed(3).replace('.', ',') ?? '—'} <small>SG</small>
                        </strong>
                      </div>
                      <div>
                        <span>Grain</span>
                        <strong>
                          {recipe.totalGristKg ?? '—'} <small>kg</small>
                        </strong>
                      </div>
                      <div>
                        <span>Ébullition</span>
                        <strong>
                          {recipe.boilMin ?? 60} <small>min</small>
                        </strong>
                      </div>
                    </div>
                    <NoloBrewDayGuide recipe={recipe} state={state} step={current} overview onMeasure={requestMeasure} onNote={noteNolo} />
                    <YeastBrewDayGuide recipe={recipe} state={state} phase="recipe" />
                    <details className="brew-disclosure">
                      <summary>Programme et notes de recette</summary>
                      <p className="brew-muted">
                        Maintien à la consigne, hors montée en température. Les ajustements du jour
                        restent dans le journal.
                      </p>
                      <ul className="brew-program">
                        {plannedRoute.map((s) => (
                          <li key={s.id}>
                            <span>{isBoilStep(s) ? 'Ébullition' : s.label}</span>
                            <strong>
                              {s.tempC != null ? `${s.tempC} °C` : ''}
                              {isUsefulTimer(s)
                                ? ` · ${s.durationMin} min`
                                : isBoilStep(s)
                                  ? `${recipe.boilMin ?? 60} min`
                                  : ''}
                            </strong>
                          </li>
                        ))}
                      </ul>
                      <p className="brew-recipe-notes">{recipe.instructions}</p>
                      {(recipe.notes ?? []).map((n, i) => (
                        <p key={i}>{n}</p>
                      ))}
                    </details>
                    {(recipe.hops ?? []).some((h) => h.stage === 'dryHop') ||
                    recipe.fermentation?.length ||
                    recipe.fermentables?.some((f) => f.use === 'fermentation') ? (
                      <details className="brew-disclosure">
                        <summary>Après le brassage : fermentation et houblonnage à cru</summary>
                        <ul className="brew-program">
                          {(recipe.hops ?? [])
                            .filter((h) => h.stage === 'dryHop')
                            .map((h, i) => (
                              <li key={`h${i}`}>
                                <span>
                                  {h.name} · houblonnage à cru
                                  {h.dayOffset != null ? ` · J${h.dayOffset}` : ''}
                                </span>
                                <strong>{Units.format(h.weightG, 'g')}</strong>
                              </li>
                            ))}
                          {recipe.fermentables
                            ?.filter((f) => f.use === 'fermentation')
                            .map((f, i) => (
                              <li key={`f${i}`}>
                                <span>{f.name}</span>
                                <strong>{Units.format(f.weightKg, 'kg')}</strong>
                              </li>
                            ))}
                          {recipe.fermentation?.map((f, i) => (
                            <li key={`p${i}`}>
                              <span>
                                {f.name}
                                {f.note ? ` · ${f.note}` : ''}
                              </span>
                              <strong>
                                {f.tempC} °C · {f.days} jours
                              </strong>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </section>
                ) : (
                  <>
                    <section
                      aria-label="Étape consultée"
                      className={`brew-station ${showTimer ? 'has-timer' : ''} ${completed ? 'is-complete' : ''}`}
                    >
                      <div className="brew-station-heading">
                        <div>
                          {showTimer && (
                            <div className="brew-step-meta">
                              <span className="brew-muted">
                                Étape {Math.max(1, routeIndex + 1)} sur {route.length}
                              </span>
                              <BrewTag tone={currentTag.tone}>{currentTag.label}</BrewTag>
                            </div>
                          )}
                          <div className="brew-step-select">
                            {stepsHere.length > 1 ? (
                              <BrewChoice
                                heading
                                label="Choisir une étape"
                                value={String(
                                  stepsHere.find(
                                    ({ s }) => s.id === current.id || (boiled && isBoilStep(s))
                                  )?.i ?? state.currentIndex
                                )}
                                onChange={(value) => choose(Number(value))}
                                options={stepsHere.map(({ s, i }) => ({
                                  value: String(i),
                                  label: isBoilStep(s) ? 'Ébullition' : s.label,
                                  detail: [
                                    s.tempC != null ? `${s.tempC} °C` : '',
                                    isBoilStep(s)
                                      ? `${boilMinutes(state, recipe)} min`
                                      : s.durationMin > 0
                                        ? `${s.durationMin} min`
                                        : ''
                                  ]
                                    .filter(Boolean)
                                    .join(' · '),
                                  tag: stepTag(s)
                                }))}
                              />
                            ) : (
                              <h2>{boiled ? 'Ébullition' : current.label}</h2>
                            )}
                          </div>
                        </div>
                        {completed && (
                          <button
                            type="button"
                            className="brew-complete-toggle"
                            aria-label="Annuler la validation de cette étape"
                            onClick={toggleComplete}
                          >
                            <Check size={18} />
                            <span>Terminé · Annuler</span>
                          </button>
                        )}
                      </div>
                      {!(boiled ? state.boilStartedAt != null : current.startedAt != null) && (
                        <p className="brew-instruction">{instructions}</p>
                      )}
                      {(showTimer || current.tempC != null) && (
                        <div className="brew-instruments">
                          {current.tempC != null && (
                            <div className="brew-temperature">
                              <span>
                                <Thermometer size={16} />
                                Consigne
                              </span>
                              <strong className="brew-digits">
                                {current.tempC}
                                <small>°C</small>
                              </strong>
                            </div>
                          )}
                          {showTimer && (
                            <div className="brew-clock">
                              <span>
                                <Clock3 size={16} />
                                {completed
                                  ? 'Terminé'
                                  : current.pausedAt != null
                                    ? 'En pause'
                                    : running
                                      ? left != null && left < 0
                                        ? staleTimer
                                          ? 'Palier à vérifier'
                                          : 'Temps dépassé'
                                        : 'Temps restant'
                                      : 'Durée du palier'}
                              </span>
                              <div>
                                <output
                                  aria-label="Temps restant"
                                  aria-live="off"
                                  className={`brew-digits ${left != null && left < 0 ? 'is-due' : ''}`}
                                >
                                  {staleTimer
                                    ? '00:00'
                                    : formatCountdown(completed ? 0 : (left ?? duration * 60000))}
                                </output>
                                {!boiled && running && (
                                  <button
                                    type="button"
                                    aria-label="Mettre le minuteur en pause"
                                    className="brew-icon-button"
                                    onClick={() =>
                                      update((s) => ({
                                        ...s,
                                        steps: s.steps.map((x, i) =>
                                          i === s.currentIndex ? { ...x, pausedAt: brewNow() } : x
                                        )
                                      }))
                                    }
                                  >
                                    <Pause size={20} />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {showTimer && (
                        <>
                          <div className="brew-clock-meta">
                            <span>
                              {running && left != null
                                ? `Fin prévue ${staleTimer ? new Date(now + left).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' }) + ' à ' : 'à '}${time(now + left)}`
                                : completed
                                  ? 'Étape consignée dans le journal'
                                  : current.pausedAt != null
                                    ? 'Le temps restant est conservé'
                                    : boiled
                                      ? 'Départ à ébullition atteinte'
                                      : 'Départ à température atteinte'}
                            </span>
                            <button
                              type="button"
                              aria-expanded={durationOpen}
                              className="brew-text-button"
                              onClick={() => setDurationOpen((v) => !v)}
                            >
                              <SlidersHorizontal size={15} />
                              Ajuster la durée
                            </button>
                          </div>
                          {durationOpen && (
                            <div
                              className="brew-duration"
                              role="group"
                              aria-label="Ajuster la durée"
                            >
                              {[-5, -1].map((d) => (
                                <button
                                  type="button"
                                  key={d}
                                  className={brewControl}
                                  aria-label={`Retirer ${-d} minutes`}
                                  onClick={() => setDuration(duration + d)}
                                >
                                  {d}
                                </button>
                              ))}
                              <label>
                                <NumberInput
                                  value={duration}
                                  min={1}
                                  max={480}
                                  integer
                                  onValue={setDuration}
                                  aria-label="Durée totale en minutes"
                                  className="brew-duration-input"
                                />
                                <span>min</span>
                              </label>
                              {[1, 5].map((d) => (
                                <button
                                  type="button"
                                  key={d}
                                  className={brewControl}
                                  aria-label={`Ajouter ${d} minutes`}
                                  onClick={() => setDuration(duration + d)}
                                >
                                  +{d}
                                </button>
                              ))}
                              {boiled && (
                                <p>
                                  Les ajouts à venir suivent la nouvelle durée. Les ajouts déjà
                                  faits conservent leur heure réelle.
                                </p>
                              )}
                            </div>
                          )}
                        </>
                      )}
                      {staleTimer && (
                        <aside className="brew-recovery" role="status">
                          <BrewTag tone="due">Reprise du journal</BrewTag>
                          <p>
                            Échéance dépassée de {formatCountdown(Math.abs(left!))}. Aucune fin n’a
                            été consignée. Vérifie ce qui s’est réellement passé à la cuve.
                          </p>
                          <button type="button" className={brewControl} onClick={toggleComplete}>
                            Consigner la fin maintenant
                          </button>
                          <button
                            type="button"
                            className={brewControl}
                            onClick={() =>
                              update((s) => ({
                                ...s,
                                ...(boiled
                                  ? { boilStartedAt: brewNow() }
                                  : {
                                      steps: s.steps.map((x) =>
                                        x.id === current.id
                                          ? {
                                              ...x,
                                              startedAt: brewNow(),
                                              pausedAt: undefined
                                            }
                                          : x
                                      )
                                    }),
                                notes: [
                                  ...(s.notes ?? []),
                                  {
                                    id: crypto.randomUUID(),
                                    at: brewNow(),
                                    stepId: current.id,
                                    text: `Minuteur relancé explicitement après ${formatCountdown(Math.abs(left!))} de dépassement ; ancienne échéance ${new Date(now + left!).toLocaleString('fr-CH')}.`
                                  }
                                ]
                              }))
                            }
                          >
                            Relancer {duration} min maintenant
                          </button>
                        </aside>
                      )}
                      {boiled &&
                        bitterness &&
                        Math.abs(bitterness.projected - bitterness.planned) >= 1 && (
                          <details className="brew-bitterness">
                            <summary>
                              <span>
                                ≈ {bitterness.projected} IBU{' '}
                                <small>· recette {bitterness.planned}</small>
                              </span>
                              <ChevronDown size={16} />
                            </summary>
                            <p>
                              Projection avec les ajouts et durées réels, au volume et à l’OG
                              prévus. Une ébullition prolongée concentre aussi le moût.
                            </p>
                          </details>
                        )}
                    </section>
                    <NoloBrewDayGuide recipe={recipe} state={state} step={current} onMeasure={requestMeasure} onNote={noteNolo} />
                    {prompt && current.doneAt == null && (
                      <button
                        type="button"
                        className="brew-reading-prompt"
                        onClick={() => requestMeasure(prompt.kind as ReadingKind)}
                      >
                        <Thermometer size={18} />
                        <span>
                          <strong>{prompt.title}</strong>
                          <small>{prompt.detail}</small>
                        </span>
                        <ChevronRight size={18} />
                      </button>
                    )}
                    <YeastBrewDayGuide recipe={recipe} state={state} phase={area} onMeasure={requestMeasure} />
                    {(!specialExtraction || area === 'boil' || area === 'finish') && <BrewAssist
                      key={current.id}
                      recipe={executionRecipe}
                      state={state}
                      step={current}
                      now={now}
                      update={update}
                      onMeasure={requestMeasure}
                      stock={stockItems}
                      brewhouse={config.brewhouses.find(b=>b.id===config.activeBrewhouseId)??recipe.brewhouse}
                    />}
                    {due.length > 0 && !staleTimer && (
                      <aside role="status" className="brew-due-alert">
                        <BellRing size={20} />
                        <div>
                          {due.map((a) => (
                            <p key={a.id}>
                              <strong>{a.title}</strong>
                              <span>{a.body}</span>
                            </p>
                          ))}
                        </div>
                      </aside>
                    )}
                  </>
                )}
                <BrewIngredients
                  recipe={displayRecipe ? recipe : executionRecipe}
                  state={state}
                  stock={stockItems}
                  area={area}
                  overview={displayRecipe}
                  update={update}
                  now={now}
                  stepId={current.id}
                />
                {area === 'finish' && !displayRecipe && (
                  <section className="brew-finish-summary" aria-label="Bilan du brassage">
                    <h3>Avant de passer en fermentation</h3>
                    <div className="brew-recipe-targets">
                      <div>
                        <span>Densité initiale relevée</span>
                        <strong>
                          {finishedReadings.gravity?.value.toFixed(3).replace('.', ',') ?? '—'} <small>SG</small>
                        </strong>
                        <span>Cible {recipe.ogTarget?.toFixed(3).replace('.', ',') ?? 'non renseignée'}</span>
                      </div>
                      <div>
                        <span>Volume en fermenteur</span>
                        <strong>
                          {finishedReadings.volume?.value ?? '—'} <small>L</small>
                        </strong>
                        <span>Cible {recipe.volumeL ?? '—'} L</span>
                      </div>
                    </div>
                    {(!finishedReadings.gravity || !finishedReadings.volume) && (
                      <p className="brew-muted">
                        Relève les valeurs manquantes avec « Mesurer » pour compléter le bilan.
                      </p>
                    )}
                  </section>
                )}
              </>
            )}
          </div>

          <div className="brew-side-column">
            {!isConsulting && showReadingSummary && (
              <BrewReadingsSummary
                state={state}
                step={current}
                recipe={actualRecipe}
                onMeasure={() => openCapture('measure')}
              />
            )}
            <BrewCapturePanel
              title="Mesurer"
              context={current.label}
              open={capture === 'measure'}
              onClose={() => setCapture(null)}
              className="brew-measure-capture"
            >
              <div className="brew-measure-panel">
                <BrewDayMeasurements
                  key={current.id}
                  step={current}
                  recipe={actualRecipe}
                  requestedKind={requestedReading}
                  state={state}
                  update={update}
                  drafts={readingDrafts.current}
                />
              </div>
              {efficiency && (
                <section aria-label="Rendement mesuré" className="brew-efficiency">
                  <h3>
                    {current.id === 'preboil'
                      ? 'Rendement d’empâtage + filtration'
                      : 'Rendement global en fermenteur'}
                  </h3>
                  {efficiency.known ? (
                    <>
                      <p className="brew-efficiency-value">
                        {efficiency.approximate ? '≈ ' : ''}
                        {efficiency.pct} %
                      </p>
                      <p>
                        {efficiency.volumeL} L × densité {efficiency.sg.toFixed(3).replace('.', ',')} / potentiel des
                        ingrédients.
                        {efficiency.direct && ' Sucres et extraits pris en compte.'}
                      </p>
                      <p className="brew-muted">
                        {efficiency.questionable
                          ? 'Résultat impossible : vérifie unités, volume, densité et potentiels.'
                          : efficiency.approximate
                            ? 'Estimation : confirme densité corrigée et volume ramené à 20 °C.'
                            : rig && current.id === 'ensemencement'
                              ? `Repère matériel : ${rig.efficiencyPct} %. Compare aussi les pertes de transfert.`
                              : 'Volume et densité doivent correspondre au même moût.'}
                      </p>
                      {efficiency.spreadMin > 30 && (
                        <p className="brew-feedback">
                          Les deux relevés sont espacés de plus de 30 minutes : confirme qu’ils
                          décrivent le même volume.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="brew-muted">{efficiency.reason}</p>
                  )}
                </section>
              )}
            </BrewCapturePanel>
            {!isConsulting && (
              <section aria-label="Préparations" className="brew-preparations">
                <div className="brew-section-heading">
                  <h3>
                    <ListChecks size={18} />
                    {area === 'preparation' ? 'Avant de commencer' : 'À anticiper'}
                  </h3>
                  <span className="brew-count">
                    {preparationCount}/{phasePreps.length}
                  </span>
                </div>
                {phasePreps.map((p) => (
                  <label key={p.id} className={state.preparations?.[p.id] ? 'is-complete' : ''}>
                    <input
                      type="checkbox"
                      checked={!!state.preparations?.[p.id]}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        update((s) => ({
                          ...s,
                          preparations: {
                            ...s.preparations,
                            [p.id]: checked
                          }
                        }));
                      }}
                    />
                    <span>{p.label}</span>
                  </label>
                ))}
              </section>
            )}
            <BrewCapturePanel
              title="Note"
              context={state.steps.find((step) => step.id === noteStepId)?.label ?? current.label}
              open={capture === 'note'}
              onClose={() => setCapture(null)}
              className="brew-note-capture"
            >
              <section aria-label="Notes et conseil" className="brew-notes">
                <div className="brew-section-heading">
                  <h3>
                    <NotebookPen size={18} />
                    Carnet de cuve
                  </h3>
                </div>
                <label htmlFor="brew-note" className="sr-only">
                  Observation
                </label>
                <Textarea
                  id="brew-note"
                  aria-label="Carnet de cuve"
                  value={note}
                  rows={3}
                  maxLength={2000}
                  placeholder="Débit de rinçage, changement de malt, ajustement…"
                  onChange={(e) => {
                    if (!note.trim()) setNoteStepId(current.id);
                    setNote(e.target.value);
                    setNotice('');
                  }}
                />
                <div className="brew-note-actions">
                  <button
                    type="button"
                    className={brewControl}
                    disabled={!note.trim()}
                    onClick={() => addNote()}
                  >
                    <Check size={16} />
                    Noter
                  </button>
                  <button
                    type="button"
                    className="brew-text-button"
                    disabled={busy}
                    onClick={analyse}
                  >
                    <Sparkles size={16} />
                    {busy ? 'Analyse…' : 'Conseil IA'}
                  </button>
                </div>
                {notice && capture === 'note' && (
                  <p role="status" className="brew-muted">
                    {notice}
                  </p>
                )}
                {advice?.key === signature && (
                  <aside role="status" className="brew-advice">
                    <p>{advice.verdict}</p>
                    {advice.action && <p>{advice.action}</p>}
                  </aside>
                )}
                {advice && advice.key !== signature && (
                  <p className="brew-muted">Le contexte a changé : actualise le conseil.</p>
                )}
              </section>
            </BrewCapturePanel>
            <details className="brew-options">
              <summary>
                <span>
                  <SlidersHorizontal size={17} /> Options et alertes
                </span>
                <ChevronDown size={16} />
              </summary>
              <details className="brew-sound-settings">
                <summary>
                  Sonnerie · option de test <ChevronDown size={16} />
                </summary>
                <div>
                  <h3>Sonnerie</h3>
                  <BrewTag tone={sound ? 'info' : 'neutral'}>
                    {sound ? 'Activée' : 'Muette'}
                  </BrewTag>
                </div>
                <p>30 secondes · deux notes alternées. Le volume suit celui du téléphone.</p>
                <button
                  type="button"
                  className={brewControl}
                  onClick={() => {
                    if (alarmSound.ringing) alarmSound.stop();
                    else if (armAudio()) {
                      setSound(true);
                      if (!alarmSound.test()) setNotice('Le navigateur n’a pas pu activer le son.');
                    } else setNotice('Le navigateur n’a pas pu activer le son.');
                  }}
                >
                  {alarmSound.ringing ? 'Arrêter la sonnerie' : 'Tester la sonnerie'}
                </button>
              </details>
              <BrewAlarmSettings
                batchId={batch.id}
                alarms={alarms}
                ready={!session.pending && session.canStart}
              />
            </details>
          </div>
        </fieldset>
        {session.status && (
          <div className="brew-sync" role="status">
            <BrewTag tone={session.error ? 'due' : session.pending ? 'pause' : 'done'}>
              {session.status}
            </BrewTag>
            {session.error && (
              <>
                <p>{session.error}</p>
                <button type="button" className={brewControl} onClick={() => void session.retry()}>
                  Réessayer
                </button>
                <button type="button" className={brewControl} onClick={() => void session.reload()}>
                  Recharger le serveur
                </button>
                <small>La version non envoyée reste en sauvegarde locale.</small>
              </>
            )}
          </div>
        )}
      </div>
      <ConfirmSheet
        open={confirmAdvance}
        className="brew-confirm"
        onClose={() => setConfirmAdvance(false)}
        title={boiled ? 'Arrêter l’ébullition maintenant ?' : 'Terminer le palier maintenant ?'}
        what={`Il reste ${formatCountdown(left ?? 0)} sur le minuteur.`}
        consequence="L’heure de fin sera consignée et l’étape suivante restera à démarrer."
        confirmLabel={boiled ? 'Confirmer le feu coupé' : 'Terminer maintenant'}
        onConfirm={finishAndContinue}
      />
      <ConfirmSheet
        open={confirmFinish}
        className="brew-confirm"
        onClose={() => setConfirmFinish(false)}
        title="Clôturer le brassage ?"
        what={`OG ${finishedReadings.gravity?.value.toFixed(3).replace('.', ',') ?? 'non relevée'} · ${finishedReadings.volume?.value ?? '—'} L en fermenteur.`}
        consequence={`${confirmed}/${ingredients.filter((i) => i.planned > 0).length} ajouts cochés. Le journal et les écarts resteront consultables. Le brassin passera en fermentation.`}
        confirmLabel="Clôturer"
        onConfirm={async () => {
          const f = finalBrewReadings(latest.current);
          update((s) => ({ ...s, finishedAt: brewNow() }));
          if (!(await session.flush())) {
            setNotice(
              'Clôture conservée sur cet appareil. Réessaie après synchronisation du journal.'
            );
            return;
          }
          onFinish({
            ...batchRef.current,
            brewDay: latest.current,
            ...(f.gravity ? { og: f.gravity.value.toFixed(3) } : {}),
            ...(f.volume ? { volumeBrewedL: f.volume.value } : {}),
            status: 'fermentation'
          });
        }}
      />
    </PageShell>
  );
}
