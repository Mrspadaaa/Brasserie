import { Textarea } from '../ui/Input';
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
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
  BellRing,
  RefreshCw,
  Pencil,
  CircleHelp,
  MessageCircle
} from 'lucide-react';
import './brew-day.css';
import { AppConfig, Batch, BrewDayReading, BrewDayState, RecipeSnapshot, StockItem } from '../types';
import { ingredientsOf } from '../domain/recipeSnapshot';
import { breweryDay, brewSessionDatePatch, hasBrewStarted, plannedBrewDate } from '../domain/batchSchedule';
import { BatchSchedule } from '../ui/production/BatchSchedule';
import { saveBatchSchedule } from '../services/batchSchedule';
import { brewAdviceKey, finalBrewReadings, isMash, measuredReadingFeedback, READING, restoreBrewDay, startBrewStep, recordPitch, validPitchQuantityChoice } from '../domain/brewDay';
import type { PitchQuantityChoice } from '../domain/brewDay';
import { effectiveThermalTarget, startThermalSegment } from '../domain/brewThermal';
import { pitchTemperatureFeedback } from '../domain/pitchingPlan';
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
  mineralFeedback,
  PREPARATIONS
} from '../domain/brewCompanion';
import {
  buildTimeline,
  remainingMs,
  formatCountdown,
  armAudio,
  isAudioArmed,
  beep,
  keepScreenAwake,
  releaseScreen
} from '../services/brewTimer';
import { AiClient } from '../services/aiClient';
import { Units } from '../services/units';
import { formatDecimal } from '../ui/numericInput';
import { toIsoDate } from '../ui/DateField';
import { PageShell } from './PageShell';
import { ConfirmSheet } from '../ui/Sheet';
import {
  BrewDayMeasurements,
  BrewReadingDraft,
  BrewUpdate,
  brewControl
} from '../ui/BrewDayMeasurements';
import { BrewIngredients, boilAdditionPoints, doseFr, heureCuve, ingredientAppliesToStep } from '../ui/BrewIngredients';
import type { PitchEditor } from '../ui/BrewIngredients';
import { sachetDeLaLevure } from '../domain/levure/sachet';
import { BrewClotureReleves, CLOTURE_VIDE, cloturePartirDe, type ClotureReleves } from '../ui/BrewClotureReleves';
import yeastSupplyBootstrap from '../data/yeastSupplyBootstrap.json';
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
import { BrewThermalControl } from '../ui/BrewThermalControl';
import { BrewSystemFeedback } from '../ui/BrewSystemFeedback';
import { YeastBrewDayGuide } from '../ui/YeastBrewDayGuide';
import { BrewAide } from '../ui/BrewAide';
import { BrewACru } from '../ui/BrewACru';
import { buildYeastCompanion } from '../domain/yeastCompanion';
import { StorageService } from '../services/storage';
import { BrewerChat } from '../ui/BrewerChat';
import { HopRecipePanel } from '../ui/hopIndex/HopRecipePanel';
import { recipeForHopAnalysis } from '../domain/hopIndex/engine';
import { readingPrompt } from '../domain/brewAssist';
import { mesuresAttendues } from '../domain/brewMeasures';
import { ReadingKind } from '../domain/brewDay';
import { NoloBrewDayGuide } from '../ui/NoloBrewDayGuide';
import { noloExecutionRecipe } from '../domain/noloBrewDay';
import { nombreFr } from '../domain/nombreAffiche';

interface Props {
  batch: Batch;
  config: AppConfig;
  stockItems?: StockItem[];
  onClose: () => void;
  onSave: (batch: Batch) => void;
  onFinish: (batch: Batch) => void;
  onOpenHopV55?: (journal: BrewDayState) => void;
}
/** Un nombre décimal s'écrit avec la virgule partout sur l'écran (BR-56, BE-… 08.11 : « 19.75 L » à côté de « 3,216 L », « Consigne 78.5 °C »). */
const fr = (n: number | string) => String(n).replace('.', ',');

// Le choix du son du brasseur, d'une session à l'autre (préférence locale à l'appareil ; jamais une promesse d'alarme écran éteint).
const SOUND_KEY = 'laffinee.brew.son';
const readSoundPreference = () => {
  try {
    return window.localStorage.getItem(SOUND_KEY) === 'on';
  } catch {
    return false;
  }
};
const writeSoundPreference = (on: boolean) => {
  try {
    window.localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
  } catch {
    /* stockage indisponible : le choix vaut pour cette session seulement */
  }
};
const AREA: Record<BrewArea, string> = {
  preparation: 'Préparer',
  mash: 'Empâter',
  boil: 'Ébullition',
  finish: 'Refroidir'
};

export function BrewDayPage({ batch, config, stockItems = [], onClose, onSave, onFinish, onOpenHopV55 }: Props) {
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
  const datedBatch = { ...batch, ...brewSessionDatePatch(batch, state), brewDay: state };
  const brewingStarted = hasBrewStarted(datedBatch);
  const batchRef = useRef(batch);
  batchRef.current = batch;
  const [view, setView] = useState<BrewArea | 'recipe' | 'journal'>(() =>
    areaOf(state.steps[state.currentIndex]?.id ?? 'eau')
  );
  const [now, setNow] = useState(brewNow);
  // p3 : le choix du son se garde d'une session à l'autre (préférence locale du brasseur) ; couper le son reste un geste explicite.
  const [sound, setSoundState] = useState(readSoundPreference);
  const setSound = (on: boolean) => {
    setSoundState(on);
    writeSoundPreference(on);
  };
  const [pitchEditToken, setPitchEditToken] = useState(0);
  const [audioArmed, setAudioArmed] = useState(isAudioArmed);
  // Le son gardé d'une session précédente ne s'arme qu'à un vrai geste (iOS, Safari) : le premier toucher de la page l'arme.
  useEffect(() => {
    if (!sound || audioArmed) return;
    const arm = () => {
      if (armAudio()) setAudioArmed(true);
    };
    window.addEventListener('pointerdown', arm, { once: true });
    window.addEventListener('keydown', arm, { once: true });
    return () => {
      window.removeEventListener('pointerdown', arm);
      window.removeEventListener('keydown', arm);
    };
  }, [sound, audioArmed]);
  const [awake, setAwake] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (notice !== 'Note ajoutée au journal.') return;
    const timer = window.setTimeout(() => setNotice(''), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const [confirmFinish, setConfirmFinish] = useState(false);
  // 3C : les relevés de la fenêtre de clôture. Brouillon repris du journal à l'ouverture ; rien d'écrit avant « Confirmer la levure ajoutée ».
  const [clotureReleves, setClotureReleves] = useState<ClotureReleves>(CLOTURE_VIDE);
  const clotureDepart = useRef<ClotureReleves>(CLOTURE_VIDE);
  const [pitchTemperature, setPitchTemperature] = useState<number>();
  const [pitchQuantityMode, setPitchQuantityMode] = useState<PitchQuantityChoice['mode']>();
  const [pitchQuantityAmount, setPitchQuantityAmount] = useState<number | undefined>(state.additions?.yeast?.amount);
  const [pitchQuantityUnit, setPitchQuantityUnit] = useState<string>(state.additions?.yeast?.unit ?? recipe.yeast?.unit ?? '');
  const finalizing = useRef(false);
  const [confirmAdvance, setConfirmAdvance] = useState(false);
  const [note, setNote] = useState('');
  const [noteStepId, setNoteStepId] = useState<string>();
  const [capture, setCapture] = useState<'measure' | 'note' | null>(null);
  const readingDrafts = useRef(new Map<string, BrewReadingDraft>());
  const [requestedReading, setRequestedReading] = useState<{
    kind: ReadingKind;
    token: number;
  }>();
  const [requestedPair, setRequestedPair] = useState<{stage: 'preboil' | 'postboil' | 'fermenter' | 'kettle-cold'; token: number}>();
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
  const thermalTarget = effectiveThermalTarget(recipe, state, current);
  const measuredStep = thermalTarget == null ? current : { ...current, tempC: thermalTarget };
  const rampBeforeHold = (isMash(current.id) || current.id === 'whirlpool') && current.tempC != null && current.durationMin > 0;
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
  const stepStarted = boiled ? state.boilStartedAt != null : current.startedAt != null;
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
    const feedback = measuredReadingFeedback(reading, state, measuredStep, actualRecipe);
    return feedback.tone === 'watch' || (kind === 'ph' && isMash(current.id) && feedback.tone === 'neutral');
  });
  const ingredients = brewIngredients(executionRecipe);
  const ingredientDisplayRecipe = (() => {
    const yeast = executionRecipe.yeast;
    if (!yeast) return executionRecipe;
    const actualYeast = state.additions?.yeast;
    const actualUnit = actualYeast?.unit ?? yeast.unit;
    if (actualYeast?.amount != null && actualUnit) return { ...executionRecipe, yeast: { ...yeast, qty: actualYeast.amount, unit: actualUnit } };
    return executionRecipe;
  })();
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
  // Le + flottant de l'app (compagnon, facture, vente…) recouvrait des cases de cette vue : il s'efface ici (brew-day.css), le compagnon vit dans « Aides et repères ».
  useEffect(() => {
    document.body.setAttribute('data-brew-fab-off', '');
    return () => document.body.removeAttribute('data-brew-fab-off');
  }, []);
  const choose = (index: number) => {
    if (index < 0 || !state.steps[index]) return;
    setNotice('');
    setView(areaOf(state.steps[index].id));
    update((s) => ({ ...s, currentIndex: index }));
    setDurationOpen(false);
    setRequestedReading(undefined);
    setRequestedPair(undefined);
    contentRef.current?.closest('main')?.scrollTo?.({ top: 0 });
  };
  /**
   * Amener le groupe d'ajouts dû sous les yeux, sinon la liste elle-même.
   * Le mouvement suit la préférence système de réduction des animations.
   */
  const aidesLabelId = useId();
  const revealAdditions = () => {
    const target =
      document.querySelector('.brew-ingredient-group.is-due') ??
      document.querySelector('.bz-row[data-prochain]') ??
      document.querySelector('.brew-ingredients');
    if (!target) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
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
    if (armAudio()) {
      setSoundState(true);
      setAudioArmed(true);
    }
    if (boiled)
      update((s) => {
        const n = { ...s, boilStartedAt: s.boilStartedAt ?? brewNow() };
        delete n.boilFinishedAt;
        return n;
      });
    else if (rampBeforeHold && current.rampStartedAt == null && current.startedAt == null) {
      // Test d'écran n° 6 : la feuille Mesurer ne s'ouvre plus d'office, elle recouvrait l'horloge ; l'invitation reste en ligne (« relevé » de l'horloge).
      update(s => startThermalSegment(s, current, current.id === 'whirlpool' ? 'immersion' : 'heating', thermalTarget!, brewNow()));
    } else update((s) => startBrewStep(s, brewNow()));
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
        thermalSegments: s.thermalSegments?.map(segment => segment.stepId === s.steps[s.currentIndex]?.id && segment.endedAt == null && s.steps[s.currentIndex]?.doneAt == null ? { ...segment, endedAt: brewNow() } : segment),
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
            actual: i.id === 'yeast' && s.pitchedAt != null && s.additions?.yeast?.amount == null ? undefined : actualAmount(i, s),
            actualStatus: i.id === 'yeast' && s.pitchedAt != null
              ? s.pitchQuantityConfirmation ?? (s.additions?.yeast?.amount != null ? 'legacy-mode-unknown' : 'unreported')
              : undefined,
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
  const rig = recipe.brewhouse ?? config.brewhouses?.find((b) => b.id === config.activeBrewhouseId);
  const stepsHere = state.steps
    .map((s, i) => ({ s, i }))
    .filter(
      ({ s }) =>
        areaOf(s.id) === area && (!isBoilStep(s) || s.id === state.steps.find(isBoilStep)?.id)
    );
  const displayRecipe = view === 'recipe';
  const enseme = !displayRecipe && current.id === 'ensemencement';
  const activeTimers = state.steps.filter(
    (s) => isUsefulTimer(s) && s.startedAt != null && s.doneAt == null
  );
  const finishedReadings = finalBrewReadings(state, recipe);
  const etapeCloture = state.steps.find((s) => s.id === 'ensemencement') ?? current;
  const clotureLevure = state.pitchedAt == null;
  useEffect(() => {
    if (!confirmFinish || !clotureLevure) return;
    const depart = cloturePartirDe({
      densite: finishedReadings.rawGravity,
      volume: finishedReadings.rawVolume
    });
    clotureDepart.current = depart;
    setClotureReleves(depart);
  }, [confirmFinish]);
  const countableIngredients = ingredients.filter(i => i.planned > 0 || i.id === 'yeast');
  const confirmedOther = countableIngredients.filter(
    (i) => i.id !== 'yeast' && i.planned > 0 && state.additions?.[i.id]?.doneAt != null
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
  /** Nom de l'étape suivante, « Ébullition » plutôt que son libellé technique. */
  const nextStepName = nextStep ? (isBoilStep(nextStep) ? 'Ébullition' : nextStep.label) : null;
  const doneCount = route.filter((s) =>
    isBoilStep(s) ? state.boilFinishedAt != null : s.doneAt != null
  ).length;
  // p3 / 4C : « Sortir la levure … » à l'ébullition (z1, l'écran choisi), tant que la levure n'est pas ajoutée. Le poids du sachet n'est dit que
  // s'il vient du catalogue (sachet.ts) : sans produit sûr, la ligne seule.
  const sachetRappel = sachetDeLaLevure(recipe.yeast, yeastSupplyBootstrap.products);
  const rappelLevure: { id: string; label: string; area: string; sous?: string }[] = recipe.yeast?.name && state.pitchedAt == null ? [{
    id: 'levure-sortir',
    label: `Sortir la levure ${recipe.yeast.name}`,
    area: 'boil',
    ...(sachetRappel ? { sous: `quantité choisie à l’ensemencement · 1 sachet = ${String(sachetRappel.grammes).replace('.', ',')} g` } : {})
  }] : [];
  const phasePreps: { id: string; label: string; area: string; sous?: string }[] = [...PREPARATIONS, ...rappelLevure].filter((p) => p.area === area &&
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
  /**
   * « Terminer et continuer » : idempotent (BR-49, BE-30). Un double toucher rejoue la même fermeture avec le même état affiché ; l'ancienne
   * version rebasculait l'état (étape suivante cochée à son tour, deux étapes passées d'un coup). Ici l'étape quittée se marque faite
   * seulement si l'état courant ne l'est pas encore, et l'on va à l'étape suivante par son identifiant.
   */
  const finishAndContinue = () => {
    const fromId = current.id;
    const wasBoil = boiled;
    update((s) => {
      const i = s.steps.findIndex((x) => x.id === fromId);
      if (i < 0) return s;
      if (wasBoil) return s.boilFinishedAt != null ? s : { ...s, boilFinishedAt: brewNow() };
      if (s.steps[i].doneAt != null) return s;
      const at = brewNow();
      return {
        ...s,
        thermalSegments: s.thermalSegments?.map((segment) =>
          segment.stepId === fromId && segment.endedAt == null ? { ...segment, endedAt: at } : segment
        ),
        steps: s.steps.map((x, k) => (k === i ? { ...x, doneAt: at } : x))
      };
    });
    if (nextStep) choose(state.steps.indexOf(nextStep));
  };
  const isConsulting = view === 'recipe' || view === 'journal';
  // m2 (VB-1) : ce que l'étape attend en mesure, en cases « ? » dans Relevés du jour ; rien en consultation.
  const attendues = isConsulting ? [] : mesuresAttendues(measuredStep, state, actualRecipe, now);
  const otherTimers = activeTimers.filter((s) => isConsulting || s.id !== current.id);
  const otherBoil =
    state.boilStartedAt != null && state.boilFinishedAt == null && (isConsulting || !boiled);
  // Une horloge tourne : un minuteur de palier en marche (pas en pause) ou l'ébullition commencée et non finie.
  const clockRunning =
    (state.boilStartedAt != null && state.boilFinishedAt == null) ||
    state.steps.some((s) => isUsefulTimer(s) && s.startedAt != null && s.pausedAt == null && s.doneAt == null);
  const headerAlarm =
    upcoming &&
    now - upcoming.at <= 30 * 60000 &&
    // 10.11, le brasseur : « Bien mettre les alere et tout ! Je veux pas louper un timing !! » : chaque ajout garde son bandeau.
    (upcoming.at <= now || upcoming.title === 'Ajout en cuve' || isConsulting || upcoming.stepId !== current.id)
      ? upcoming
      : undefined;
  const lastStep = !nextStep;
  const currentPitchMode = state.pitchedAt != null ? pitchQuantityMode ?? state.pitchQuantityConfirmation : pitchQuantityMode;
  const currentPitchAmount = currentPitchMode === 'starter-transferred'
    ? (state.additions?.yeast?.unit === 'L' ? state.additions.yeast.amount : pitchQuantityAmount)
    : state.additions?.yeast?.amount ?? pitchQuantityAmount;
  const currentPitchUnit = currentPitchMode === 'starter-transferred' ? 'L'
    : currentPitchMode === 'planned' ? recipe.yeast?.unit ?? ''
      : state.additions?.yeast?.unit ?? pitchQuantityUnit;
  const makePitchChoice = (): PitchQuantityChoice | undefined => {
    if (currentPitchMode === 'measured' && Number.isFinite(currentPitchAmount) && currentPitchUnit.trim())
      return { mode: 'measured', amount: currentPitchAmount!, unit: currentPitchUnit.trim() };
    if (currentPitchMode === 'planned' && typeof recipe.yeast?.qty === 'number' && recipe.yeast.qty > 0 && recipe.yeast.unit)
      return { mode: 'planned', amount: recipe.yeast.qty, unit: recipe.yeast.unit };
    if (currentPitchMode === 'unmeasured') return { mode: 'unmeasured' };
    if (currentPitchMode === 'starter-transferred') {
      if (currentPitchAmount === undefined) return { mode: 'starter-transferred' };
      if (Number.isFinite(currentPitchAmount) && currentPitchAmount > 0) return { mode: 'starter-transferred', cultureVolumeL: currentPitchAmount };
      return undefined;
    }
    return undefined;
  };
  const currentPitchChoice = makePitchChoice();
  const pitchChoiceValid = validPitchQuantityChoice(currentPitchChoice);
  const plannedPitchSummary = typeof recipe.yeast?.qty === 'number' && recipe.yeast.qty > 0 && recipe.yeast.unit
    ? `Dose prévue : ${Units.format(recipe.yeast.qty, recipe.yeast.unit)}`
    : 'sans dose prévue';
  const confirmed = confirmedOther + (ingredients.some(i => i.id === 'yeast') &&
    (state.pitchedAt != null || state.additions?.yeast?.doneAt != null || pitchChoiceValid) ? 1 : 0);
  const pitchQuantityConsequence = currentPitchChoice?.mode === 'measured'
    ? `Quantité mesurée : ${Units.format(currentPitchChoice.amount, currentPitchChoice.unit)} · ${plannedPitchSummary}.`
    : currentPitchChoice?.mode === 'planned'
      ? `Quantité prévue explicitement confirmée : ${Units.format(currentPitchChoice.amount, currentPitchChoice.unit)}.`
      : currentPitchChoice?.mode === 'starter-transferred'
        ? `Culture du starter transférée${currentPitchChoice.cultureVolumeL != null ? ` : ${Units.format(currentPitchChoice.cultureVolumeL, 'L')} relevés` : ' ; volume non relevé'} · dose du brassin ${recipe.yeast?.qty != null && recipe.yeast.unit ? `${Units.format(recipe.yeast.qty, recipe.yeast.unit)} prévue` : 'sans quantité prévue'}. L’inoculum et le milieu se régularisent séparément.`
        : currentPitchChoice?.mode === 'unmeasured'
          ? `Ajout confirmé sans mesure de quantité ; aucun stock ne sera déduit à partir de la dose prévue (${plannedPitchSummary}).`
          : state.pitchedAt != null ? 'Quantité réelle historique non renseignée.' : 'Quantité réelle à confirmer dans le guide Levure.';
  const selectPitchQuantityMode = (mode: PitchQuantityChoice['mode'], preset?: { amount: number; unit: string }) => {
    setPitchQuantityMode(mode);
    if (mode === 'measured' && preset) {
      // « 1 sachet » : une quantité choisie d'un toucher (une levure sèche sans dose prévue) ; la clôture la prend pour une quantité mesurée.
      setPitchQuantityAmount(preset.amount);
      setPitchQuantityUnit(preset.unit);
      update(s => ({ ...s, additions: { ...s.additions, yeast: { ...s.additions?.yeast, amount: preset.amount, unit: preset.unit } } }));
      return;
    }
    if (mode === 'starter-transferred') {
      setPitchQuantityAmount(undefined);
      setPitchQuantityUnit('L');
      update(s => {
        const additions = { ...s.additions };
        delete additions.yeast;
        if (s.pitchedAt == null) return { ...s, additions };
        return { ...s, additions, pitchQuantityConfirmation: 'starter-transferred' };
      });
      return;
    }
    if (mode === 'planned') {
      setPitchQuantityUnit(recipe.yeast?.unit ?? '');
      if (state.pitchedAt != null && typeof recipe.yeast?.qty === 'number' && recipe.yeast.qty > 0 && recipe.yeast.unit)
        update(s => ({ ...s, pitchQuantityConfirmation: 'planned', additions: { ...s.additions,
          yeast: { ...s.additions?.yeast, amount: recipe.yeast!.qty!, unit: recipe.yeast!.unit!, doneAt: s.pitchedAt } } }));
      return;
    }
    if (mode === 'measured') {
      setPitchQuantityUnit(state.additions?.yeast?.unit ?? recipe.yeast?.unit ?? '');
      if (state.pitchedAt != null && Number.isFinite(currentPitchAmount) && currentPitchAmount! > 0 && currentPitchUnit.trim())
        update(s => ({ ...s, pitchQuantityConfirmation: 'measured', additions: { ...s.additions,
          yeast: { ...s.additions?.yeast, amount: currentPitchAmount!, unit: currentPitchUnit, doneAt: s.pitchedAt } } }));
      return;
    }
    if (state.pitchedAt != null) update(s => {
      const additions = { ...s.additions };
      delete additions.yeast;
      return { ...s, additions, pitchQuantityConfirmation: 'unmeasured' };
    });
  };
  const updatePitchQuantityAmount = (amount: number | undefined) => {
    setPitchQuantityAmount(amount);
    if (pitchQuantityMode !== 'measured' && pitchQuantityMode !== 'starter-transferred') return;
    update(s => {
      const additions = { ...s.additions };
      if (pitchQuantityMode === 'starter-transferred') {
        if (s.pitchedAt != null && Number.isFinite(amount) && amount! > 0)
          additions.yeast = { ...additions.yeast, amount: amount!, unit: 'L', doneAt: s.pitchedAt };
        else delete additions.yeast;
        return { ...s, additions, ...(s.pitchedAt != null ? { pitchQuantityConfirmation: 'starter-transferred' as const } : {}) };
      }
      if (s.pitchedAt != null) {
        if (Number.isFinite(amount) && amount! > 0 && currentPitchUnit.trim()) {
          additions.yeast = { ...additions.yeast, amount: amount!, unit: currentPitchUnit, doneAt: s.pitchedAt };
          return { ...s, additions, pitchQuantityConfirmation: 'measured' as const };
        }
        delete additions.yeast;
        if (s.pitchQuantityConfirmation === 'unmeasured') return { ...s, additions, pitchQuantityConfirmation: 'unmeasured' as const };
        const next = { ...s, additions };
        delete next.pitchQuantityConfirmation;
        return next;
      }
      if (amount === undefined) delete additions.yeast;
      else additions.yeast = { ...additions.yeast, amount, unit: currentPitchUnit };
      return { ...s, additions };
    });
  };
  const updatePitchQuantityUnit = (unit: string) => {
    setPitchQuantityUnit(unit);
    if (pitchQuantityMode !== 'measured') return;
    update(s => {
      const amount = s.additions?.yeast?.amount ?? pitchQuantityAmount;
      if (amount === undefined) return s;
      if (s.pitchedAt != null)
        return { ...s, pitchQuantityConfirmation: 'measured', additions: { ...s.additions,
          yeast: { ...s.additions?.yeast, amount, unit, doneAt: s.pitchedAt } } };
      return { ...s, additions: { ...s.additions, yeast: { ...s.additions?.yeast, amount, unit } } };
    });
  };
  // p3 (n° 4) : le choix de la quantité de levure vit dans l'éditeur de la ligne Levure ; le pied « J'ai ajouté la levure » l'ouvre.
  const plannedPitchUsable = typeof recipe.yeast?.qty === 'number' && recipe.yeast.qty > 0 && !!recipe.yeast.unit;
  const canTransferStarter = batch.yeastPreparation?.status === 'started' || batch.yeastPreparation?.status === 'ready';
  const pitchEditor: PitchEditor | undefined = state.pitchedAt == null ? {
    mode: currentPitchMode,
    token: pitchEditToken,
    onMode: selectPitchQuantityMode,
    // p3 / 1C : le poids du sachet vient du catalogue (avec sa source), le volume du fermenteur relevé, sinon de la recette.
    jauge: {
      sachet: sachetDeLaLevure(recipe.yeast, yeastSupplyBootstrap.products),
      volumeL: finishedReadings.volume?.value ?? recipe.volumeL,
      volumeBase: finishedReadings.volume ? 'relevés' : 'prévus'
    },
    options: [
      ...(plannedPitchUsable ? [{ mode: 'planned' as const, label: 'Prévue ajoutée' }] : []),
      // Une levure sèche se dose au sachet : sans dose prévue, « 1 sachet » est un toucher, pas quatre gestes (VB-4).
      ...(!plannedPitchUsable && recipe.yeast?.form === 'sèche' ? [{ mode: 'measured' as const, label: '1 sachet', preset: { amount: 1, unit: 'sachet' } }] : []),
      { mode: 'measured' as const, label: 'Mesurée' },
      { mode: 'unmeasured' as const, label: 'Sans mesure' },
      ...(canTransferStarter ? [{ mode: 'starter-transferred' as const, label: 'Starter transféré' }] : [])
    ]
  } : undefined;
  const bilanCloture = area === 'finish' && !displayRecipe ? (
          <div role="region" aria-label="Bilan du brassage" className="bz-cloture">
            <span>
              Densité initiale{' '}
              <b className="bz-m">{finishedReadings.gravity?.value.toFixed(3).replace('.', ',') ?? '—'}</b>{finishedReadings.gravity && <small className="bz-m"> SG</small>}{' '}
              <small className="bz-m">cible {recipe.ogTarget?.toFixed(3).replace('.', ',') ?? '—'}</small>
            </span>
            <span>
              Volume en fermenteur{' '}
              <b className="bz-m">{finishedReadings.volume?.approximate ? '≈ ' : ''}{finishedReadings.volume?.value ?? '—'}</b>{finishedReadings.volume && <small className="bz-m"> L à froid</small>}{' '}
              <small className="bz-m">cible {recipe.volumeL == null ? '—' : nombreFr(recipe.volumeL, 1)} L</small>
            </span>
            {/* Pourquoi une valeur manque : dit aux lecteurs d'écran, pas affiché (z1 : sans un mot d'aide). */}
            {(!finishedReadings.gravity || !finishedReadings.volume) && (
              <span className="sr-only">
                {[finishedReadings.reasons.gravity, finishedReadings.reasons.volume].filter(Boolean).join(' ')}
              </span>
            )}
          </div>
  ) : undefined;
  const primaryLabel = !brewingStarted && !isConsulting ? 'Commencer aujourd’hui' : isConsulting
    ? 'Revenir au brassage'
    : lastStep
      ? state.pitchedAt != null ? 'Synchroniser et clôturer' : 'J’ai ajouté la levure'
      : showTimer && !running && !completed
        ? current.pausedAt != null
          ? 'Reprendre'
          : boiled
            ? 'Ébullition atteinte'
            : rampBeforeHold
              ? current.rampStartedAt == null ? current.id === 'whirlpool' ? 'Commencer le refroidissement' : 'Commencer la montée' : 'Démarrer le maintien'
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
    else if (!brewingStarted) update(s => ({ ...s, startedAt: brewNow() }));
    else if (lastStep) {
      if (!pitchChoiceValid) {
        // La quantité réellement ajoutée reste un choix explicite : on ouvre l'éditeur de la ligne Levure, à l'écran, avec ses choix.
        // Aucun bandeau en haut de page (il était vert, la couleur de la réussite, et loin de la ligne) : l'éditeur parle sur sa ligne.
        setPitchEditToken((t) => t + 1);
        return;
      }
      setConfirmFinish(true);
    }
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
    setRequestedPair(undefined);
    setRequestedReading({ kind, token: performance.now() });
    openCapture('measure');
  };
  const requestWortPair = (stepId: string) => {
    const stage = stepId === 'ensemencement' ? 'fermenter' : stepId === 'kettle-cold' ? 'kettle-cold' : stepId === 'postboil' ? 'postboil' : 'preboil';
    setRequestedReading(undefined);
    setRequestedPair({stage, token: performance.now()});
    openCapture('measure');
  };
  const noteNolo = (subject: string) => {
    setNote(previous => previous.trim() ? previous : `NOLO · ${subject} : `);
    setNoteStepId(current.id);
    openCapture('note');
  };

  // — La grammaire de z1 (« La conduite affûtée ») : ce qui se lit à la cuve, calculé une fois ici. —
  const syncAttention =
    !!session.error || ['À synchroniser', 'Connexion interrompue', 'Ouvert dans un autre onglet'].includes(session.status);
  const syncText = session.error || session.status === 'À synchroniser' || session.status === 'Connexion interrompue'
    ? 'à synchroniser'
    : session.status === 'Ouvert dans un autre onglet'
      ? 'autre onglet'
      : session.status === 'Enregistrement…' || session.status.startsWith('Connexion au')
        ? session.status.toLowerCase()
        : 'à jour';
  const etapeNumero = Math.max(1, routeIndex + 1);
  const lastTemperature = [...(state.readings ?? [])]
    .reverse()
    .find((r) => r.kind === 'temperature' && r.stepId === current.id);
  const phaseFill = (v: BrewArea) => {
    const steps = route.filter((s) => areaOf(s.id) === v);
    if (!steps.length) return 0;
    let sum = 0;
    for (const s of steps) {
      if (isBoilStep(s) ? state.boilFinishedAt != null : s.doneAt != null) sum += 1;
      else if ((s.id === current.id || (boiled && isBoilStep(s))) && running && left != null && duration > 0)
        sum += Math.max(0, Math.min(1, 1 - left / (duration * 60000)));
    }
    return sum / steps.length;
  };
  const boilPoints = boiled ? boilAdditionPoints(executionRecipe, state) : [];
  const nextBoilPoint = boilPoints.find((p) => !p.done);
  const elapsedShare = boiled && running && left != null && duration > 0 ? Math.max(0, Math.min(1, 1 - left / (duration * 60000))) : null;
  const thermalVisible =
    (/^mash/.test(measuredStep.id) || measuredStep.id === 'sparge' || ['refroidissement', 'ensemencement', 'whirlpool'].includes(measuredStep.id)) &&
    state.finishedAt == null && measuredStep.doneAt == null;
  const wideScreen = typeof window !== 'undefined' && !!window.matchMedia?.('(min-width: 901px)').matches;
  const stepHasIngredients = brewIngredients(ingredientDisplayRecipe).some(
    (i) => ingredientAppliesToStep(i, { area, stepId: current.id }) && (i.planned > 0 || !!state.additions?.[i.id])
  );
  const nextStepIngredients = nextStep && !isConsulting
    ? brewIngredients(executionRecipe).filter(
        // La levure sans dose prévue figure quand même dans « Ensuite » (m2 : le brasseur voit ce qui vient), avec « à choisir ».
        (i) => (i.planned > 0 || i.id === 'yeast') && ingredientAppliesToStep(i, { area: areaOf(nextStep.id), stepId: nextStep.id }) &&
          // « Ensuite » ne répète pas ce que l'étape en cours montre déjà (grains d'un palier au suivant).
          !ingredientAppliesToStep(i, { area: areaOf(current.id), stepId: current.id })
      )
    : [];
  const nextGrains = nextStepIngredients.length > 0 && nextStepIngredients.every((i) => i.kind === 'grain');
  const nextStepMeta = nextStep
    ? nextGrains
      ? `${doseFr(nextStepIngredients.reduce((sum, i) => sum + (actualAmount(i, state) ?? i.planned), 0), 'kg')} kg`
      : [
          nextStep.tempC != null ? `${fr(nextStep.tempC)} °C` : nextStep.id === 'ensemencement' && recipe.yeast?.pitchTempC != null ? `${fr(recipe.yeast.pitchTempC)} °C` : '',
          isBoilStep(nextStep) ? `${boilMinutes(state, recipe)} min` : nextStep.durationMin > 0 ? `${nextStep.durationMin} min` : ''
        ].filter(Boolean).join(' · ')
    : '';
  // Au palier d'empâtage : « maintien 67 °C · relevé — », la température avant le temps (L04), au repos, en marche, en pause.
  const holdLine = showTimer && !boiled && !completed && !staleTimer && isMash(current.id) && thermalTarget != null;
  const waitingLabel = running && !completed && left != null && left > 0
    ? boiled
      ? 'Coupure du feu'
      : 'Fin du palier'
    : null;

  const viewNavigation = (
    <nav aria-label="Vues du brassin" className="brew-view-tabs bz-onglets">
      <button
        type="button"
        aria-pressed={!isConsulting}
        onClick={() => navigate(areaOf(current.id))}
      >
        <SlidersHorizontal size={14} />
        Conduite
      </button>
      <button
        type="button"
        aria-label="Recette"
        aria-pressed={view === 'recipe'}
        onClick={() => navigate('recipe')}
      >
        <BookOpen size={14} />
        Recette
      </button>
      <button
        type="button"
        aria-label="Journal"
        aria-pressed={view === 'journal'}
        onClick={() => navigate('journal')}
      >
        <NotebookPen size={14} />
        Journal
      </button>
      <span className="brew-progress-label">
        {doneCount}/{route.length} étapes faites
      </span>
      <span className={`bz-sync ${syncAttention ? 'is-attention' : ''}`} data-booster="sync">
        <RefreshCw size={12} aria-hidden="true" />
        {syncText}
      </span>
    </nav>
  );
  const alerteBande = (
    <>
      {alarmSound.ringing && (
        <div className="brew-ringing bz-alerte" role="status">
          {due[0] ? (
            <button
              type="button"
              className="brew-ringing-reason"
              onClick={() => choose(state.steps.findIndex((s) => s.id === due[0].stepId))}
            >
              <BellRing size={16} />
              <span>
                À faire maintenant
                <strong>{due[0].title === 'Ajout en cuve' ? due[0].body : due[0].title}</strong>
              </span>
              <ChevronRight size={14} />
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
            <VolumeX size={16} />
            {due.length ? 'Arrêter' : 'Arrêter la sonnerie'}
          </button>
        </div>
      )}
      {headerAlarm && !alarmSound.ringing && (
        <button
          type="button"
          className={`brew-next-alarm bz-alerte ${headerAlarm.at <= now ? 'is-due' : ''}`}
          onClick={() => {
            choose(state.steps.findIndex((s) => s.id === headerAlarm.stepId));
            // Le bandeau annonce une dose : amener la ligne correspondante
            // sous les yeux plutôt que de laisser chercher dans la liste.
            if (headerAlarm.title === 'Ajout en cuve')
              requestAnimationFrame(revealAdditions);
          }}
        >
          <BellRing size={14} />
          <span>
            {headerAlarm.at <= now ? 'À faire maintenant' : `À ${heureCuve(headerAlarm.at)}`}
            <strong>
              {headerAlarm.title === 'Ajout en cuve' ? headerAlarm.body : headerAlarm.title}
            </strong>
          </span>
          <span className="brew-digits">{formatCountdown(headerAlarm.at - now)}</span>
          <ChevronRight size={14} />
        </button>
      )}
    </>
  );
  return (
    <PageShell
      wide
      className="brew-page bz"
      title={batch.name}
      subtitle={
        session.error
          ? 'Journal à synchroniser · brouillon conservé'
          : `${batch.id} · ${String(recipe.volumeL ?? batch.volumeL ?? '—').replace('.', ',')} L`
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
            className="brew-icon-button bz-pictos"
            aria-label={sound ? 'Couper les alertes sonores' : 'Activer les alertes sonores'}
            aria-pressed={sound}
            data-booster="son"
            // Une horloge tourne sans son armé : le picto se voit en couleur d'alerte (« Je veux pas louper un timing !! », 10.11).
            data-alerte={clockRunning && (!sound || !audioArmed) ? '' : undefined}
            onClick={() => {
              if (sound && !audioArmed) {
                // Son gardé d'une session précédente, pas encore armé : ce toucher l'arme (il ne le coupe pas).
                if (armAudio()) {
                  setAudioArmed(true);
                  beep(1);
                }
              } else if (sound) {
                alarmSound.stop();
                setSound(false);
              } else if (armAudio()) {
                setSound(true);
                setAudioArmed(true);
                beep(1);
              }
            }}
          >
            {sound ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span aria-hidden="true">son</span>
          </button>
          <button
            type="button"
            className="brew-icon-button bz-pictos"
            aria-label="Garder l’écran allumé"
            aria-pressed={awake}
            data-booster="ecran"
            onClick={async () => {
              if (awake) {
                await releaseScreen();
                setAwake(false);
              } else setAwake(await keepScreenAwake());
            }}
          >
            <Sun size={14} />
            <span aria-hidden="true">écran</span>
          </button>
        </>
      }
      progress={viewNavigation}
      footer={
        <div className="brew-footer bz-pied">
          <button
            type="button"
            className="brew-quick-entry"
            aria-label="Relever une mesure"
            disabled={!session.canStart}
            data-booster="mesurer"
            onClick={() => openCapture('measure')}
          >
            <Thermometer size={14} />
            <span>Mesurer</span>
          </button>
          <button
            type="button"
            className="brew-quick-entry"
            aria-label="Ajouter une note"
            disabled={!session.canStart}
            data-booster="note"
            onClick={() => openCapture('note')}
          >
            <Pencil size={14} />
            <span>{note.trim() ? 'Brouillon' : 'Note'}</span>
          </button>
          <button
            type="button"
            className="brew-primary"
            aria-label={primaryLabel}
            data-attente={waitingLabel ? '' : undefined}
            disabled={!session.canStart}
            data-booster="action"
            onClick={primaryAction}
          >
            {waitingLabel && left != null ? (
              <>
                {waitingLabel} · <span className="bz-m">{heureCuve(now + left)}</span>
              </>
            ) : (
              primaryLabel
            )}
          </button>
        </div>
      }
    >
      {/* Le + flottant (le menu d'actions de toute l'app : compagnon, facture, vente, recette, brassin) recouvrait des cases de cette vue ;
          il s'efface ici et ses actions de brassage vivent dans « Aides et repères » (compagnon) et dans les en-têtes de groupe (+). */}
      <BrewerChat hideLauncher scope={{kind:'batch',id:batch.id}} label={recipe.name} phase={state.finishedAt?'fermentation':current?.label} localJournal={state}
        editableTargets={session.canStart ? ['journal','batch'] : []} beforeApply={session.flush}
        onApplied={()=>session.live ? session.reload() : undefined}
        onKeep={session.canStart ? text=>update(s=>({...s,notes:[...(s.notes??[]),{id:crypto.randomUUID(),at:brewNow(),stepId:current?.id??'notes',text}]})) : undefined} />
      <div ref={contentRef} className="brew-workspace">
        {notice && !capture && (
          <div className="brew-toast" role="status">
            {notice}
          </div>
        )}
        <nav aria-label="Phases du brassage" className="brew-navigation bz-phases" hidden={isConsulting}>
          <div className="brew-phases">
            {(Object.keys(AREA) as BrewArea[]).map((v) => {
              const phaseSteps = route.filter((s) => areaOf(s.id) === v);
              const phaseDone =
                phaseSteps.length > 0 &&
                phaseSteps.every((s) =>
                  isBoilStep(s) ? state.boilFinishedAt != null : s.doneAt != null
                );
              const fill = phaseFill(v);
              const here = !isConsulting && view === v;
              return (
                <button
                  type="button"
                  key={v}
                  disabled={!phaseSteps.length || !session.canStart}
                  aria-label={areaLabels[v]}
                  aria-pressed={here}
                  aria-current={here ? 'step' : undefined}
                  className={`brew-phase bz-phase ${phaseDone ? 'is-complete' : ''}`}
                  data-phase={v}
                  data-fait={phaseDone ? 'true' : undefined}
                  data-encours={here && fill > 0 && !phaseDone ? 'true' : undefined}
                  style={{ '--bz-fill': `${Math.round(fill * 100)}%` } as React.CSSProperties}
                  onClick={() => navigate(v)}
                >
                  <i aria-hidden="true" />
                  {areaLabels[v]}
                </button>
              );
            })}
          </div>
        </nav>
        {alerteBande}
        <div className="bz-planning" data-phase={isConsulting ? 'consultation' : area}>
          <BatchSchedule batch={datedBatch} onSave={async updated => {
            await saveBatchSchedule(batchRef.current, updated.plannedBrewDate ?? '', onSave);
          }} />
        </div>

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
                <Clock3 size={14} />
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
                <Clock3 size={14} />
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
                          {formatDecimal(recipe.totalGristKg) || '—'} <small>kg</small>
                        </strong>
                      </div>
                      <div>
                        <span>Ébullition</span>
                        <strong>
                          {recipe.boilMin ?? 60} <small>min</small>
                        </strong>
                      </div>
                    </div>
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
                              {s.tempC != null ? `${fr(s.tempC)} °C` : ''}
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
                                {fr(f.tempC)} °C · {f.days} jours
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
                      className={`brew-station bz-station ${showTimer ? 'has-timer' : ''} ${completed ? 'is-complete' : ''}`}
                    >
                      <div className="bz-etape">
                        <b className="bz-m">{etapeNumero}</b>
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
                                  s.tempC != null ? `${fr(s.tempC)} °C` : '',
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
                        <span className="bz-suite">
                          ensuite {nextStepName ?? 'passage en fermentation'}
                          {nextStep && isMash(nextStep.id) && nextStep.tempC != null && <> <span className="bz-m">{fr(nextStep.tempC)} °C</span></>}
                        </span>
                      </div>
                      {completed && (
                        <button
                          type="button"
                          className="brew-complete-toggle"
                          aria-label="Annuler la validation de cette étape"
                          onClick={toggleComplete}
                        >
                          <Check size={14} />
                          <span>Terminé · Annuler</span>
                        </button>
                      )}
                      {showTimer && (
                        <div
                          className="bz-horloge"
                          data-booster="horloge"
                          data-etat={completed ? 'fait' : current.pausedAt != null ? 'pause' : running ? (left != null && left < 0 ? 'depasse' : 'cours') : 'repos'}
                        >
                          <div className="bz-haut">
                            <output
                              aria-label="Temps restant"
                              aria-live="off"
                              className={`bz-temps bz-m brew-digits ${left != null && left < 0 ? 'is-due' : ''}`}
                            >
                              {staleTimer
                                ? '00:00'
                                : formatCountdown(completed ? 0 : (left ?? duration * 60000))}
                            </output>
                            <span className="bz-fin">
                              {completed ? (
                                'terminé'
                              ) : holdLine ? (
                                <>
                                  {current.pausedAt != null ? 'en pause · ' : running && left != null && left < 0 ? 'dépassé · ' : ''}
                                  maintien <span className="bz-m">{fr(thermalTarget!)} °C</span> · relevé{' '}
                                  <button
                                    type="button"
                                    className="bz-releve-lien bz-m"
                                    aria-label="Relevé de température"
                                    onClick={() => requestMeasure('temperature')}
                                  >
                                    {lastTemperature ? fr(lastTemperature.value) : '?'}
                                  </button>
                                </>
                              ) : current.pausedAt != null ? (
                                'en pause'
                              ) : running && left != null ? (
                                <>
                                  {left < 0 ? (staleTimer ? 'palier à vérifier' : 'dépassé') : 'fin'}{' '}
                                  {staleTimer && <>{new Date(now + left).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' })} à </>}
                                  {(staleTimer || left >= 0) && <span className="bz-m">{heureCuve(now + left)}</span>}
                                </>
                              ) : thermalTarget != null ? (
                                <>
                                  maintien <span className="bz-m">{fr(thermalTarget)} °C</span>
                                  {lastTemperature && <> · relevé <span className="bz-m">{fr(lastTemperature.value)}</span></>}
                                </>
                              ) : (
                                'durée'
                              )}
                            </span>
                            <div className="bz-ctl" role="group" aria-label="Ajuster la durée">
                              {[-5, -1].map((d) => (
                                <button
                                  type="button"
                                  key={d}
                                  className="bz-m"
                                  aria-label={`Retirer ${-d} minutes`}
                                  disabled={completed}
                                  data-booster={`moins${-d}`}
                                  onClick={() => setDuration(duration + d)}
                                >
                                  −{-d}
                                </button>
                              ))}
                              {!boiled && running && (
                                <button
                                  type="button"
                                  aria-label="Mettre le minuteur en pause"
                                  data-pause=""
                                  data-booster="pause"
                                  onClick={() =>
                                    update((s) => ({
                                      ...s,
                                      steps: s.steps.map((x, i) =>
                                        i === s.currentIndex ? { ...x, pausedAt: brewNow() } : x
                                      )
                                    }))
                                  }
                                >
                                  <Pause size={14} fill="currentColor" />
                                </button>
                              )}
                              {[1, 5].map((d) => (
                                <button
                                  type="button"
                                  key={d}
                                  className="bz-m"
                                  aria-label={`Ajouter ${d} minutes`}
                                  disabled={completed}
                                  data-booster={`plus${d}`}
                                  onClick={() => setDuration(duration + d)}
                                >
                                  +{d}
                                </button>
                              ))}
                            </div>
                          </div>
                          {boiled && boilPoints.length > 0 && (
                            <div className="bz-piste" aria-hidden="true" data-booster="piste">
                              <div className="bz-piste-rail" />
                              <div className="bz-piste-fait" style={{ width: `${(elapsedShare ?? 0) * 100}%` }} />
                              {boilPoints.map((p) => (
                                <span
                                  key={p.id}
                                  className="bz-pt"
                                  data-fait={p.done ? '' : undefined}
                                  data-prochain={nextBoilPoint?.id === p.id && running ? '' : undefined}
                                  style={{ left: `${duration > 0 ? Math.max(0, Math.min(100, ((duration - p.minute) / duration) * 100)) : 0}%` }}
                                />
                              ))}
                              {elapsedShare != null && <span className="bz-now" style={{ left: `${elapsedShare * 100}%` }} />}
                            </div>
                          )}
                        </div>
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
                                ≈ {nombreFr(bitterness.projected, 1)} IBU{' '}
                                <small>· recette {bitterness.planned}</small>
                              </span>
                              <ChevronDown size={14} />
                            </summary>
                            <p>
                              Projection avec les ajouts et durées réels, au volume et à l’OG
                              prévus. Une ébullition prolongée concentre aussi le moût.
                            </p>
                          </details>
                        )}
                    </section>
                    {due.length > 0 && !staleTimer && !headerAlarm && !alarmSound.ringing && (
                      <aside role="status" className="brew-due-alert">
                        <BellRing size={16} />
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
                    {prompt && current.doneAt == null && !((holdLine || thermalVisible) && prompt.kind === 'temperature') && !attendues.some((a) => a.kind === prompt.kind) && (
                      <button
                        type="button"
                        className="brew-reading-prompt bz-repli"
                        title={prompt.detail}
                        onClick={() => prompt.title === 'Volume + densité' ? requestWortPair(current.id) : requestMeasure(prompt.kind as ReadingKind)}
                      >
                        <Thermometer size={14} />
                        <span>{prompt.title}</span>
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </>
                )}
                {attendues.length > 0 && !displayRecipe && (
                  <BrewReadingsSummary state={state} step={measuredStep} recipe={actualRecipe} attendues={attendues} onMeasure={requestMeasure} now={now} cloture={bilanCloture} />
                )}
                <BrewIngredients
                  recipe={displayRecipe ? recipe : ingredientDisplayRecipe}
                  state={state}
                  stock={stockItems}
                  area={area}
                  overview={displayRecipe}
                  update={update}
                  now={now}
                  stepId={current.id}
                  pitch={pitchEditor}
                />
                {!displayRecipe && current.id === 'ensemencement' && state.pitchedAt == null && (
                  <label className="bz-moutajout">
                    <span>Moût à l’ajout</span>
                    <span className="bz-moutajout-val"><NumberInput aria-label="Température du moût à l’ajout de levure" value={pitchTemperature} min={-5} max={45} placeholder="—" onValue={setPitchTemperature} /> <span className="bz-unite">°C</span></span>
                  </label>
                )}
              </>
            )}
          </div>

          <div className="brew-side-column">
            {!isConsulting && nextStep && nextStepIngredients.length > 0 && (
              <section className="bz-groupe bz-ensuite" data-matiere={nextGrains ? 'grain' : nextStepIngredients[0].kind === 'hop' ? 'houblon' : 'autre'} aria-label={`Ensuite · ${nextStepName}`}>
                <header className="bz-groupe-tete">
                  <h3>Ensuite · {nextStepName}</h3>
                  {nextStepMeta && <span className="bz-compte bz-m">{nextStepMeta}</span>}
                </header>
                {nextGrains ? (
                  <div className="bz-releve">
                    {nextStepIngredients.map((i) => (
                      <span key={i.id}>
                        <b className="bz-m">{doseFr(actualAmount(i, state) ?? i.planned, i.unit)}</b>{' '}
                        {state.additions?.[i.id]?.replacement?.name ?? i.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  nextStepIngredients.map((i) => (
                    <div className="bz-row is-apercu" key={i.id}>
                      <div className="bz-nom"><strong>{state.additions?.[i.id]?.replacement?.name ?? i.name}</strong></div>
                      <span className="bz-dose is-lecture">
                        <strong>{i.planned > 0 || state.additions?.[i.id]?.amount != null ? doseFr(actualAmount(i, state) ?? i.planned, i.unit) : 'à choisir'}</strong>
                        <small>{i.planned > 0 || state.additions?.[i.id]?.amount != null ? i.unit : ''}</small>
                      </span>
                      <span className="bz-case is-apercu" aria-hidden="true" />
                    </div>
                  ))
                )}
              </section>
            )}
            {!isConsulting && showReadingSummary && attendues.length === 0 && (
              <BrewReadingsSummary
                state={state}
                step={measuredStep}
                recipe={actualRecipe}
                onMeasure={requestMeasure}
                cloture={bilanCloture}
              />
            )}
            {!isConsulting && (
              <section aria-label="Préparations" className="brew-preparations bz-groupe bz-anticiper">
                <header className="bz-groupe-tete">
                  <ListChecks size={14} aria-hidden="true" />
                  <h3>À anticiper</h3>
                  <span className="bz-compte">
                    {preparationCount}/{phasePreps.length}
                  </span>
                </header>
                {phasePreps.map((p) => (
                  <label key={p.id} className={`bz-anticiper-ligne ${state.preparations?.[p.id] ? 'is-complete' : ''}`}>
                    <span>{p.label}{p.sous && <small className="bz-anticiper-sous">{p.sous}</small>}</span>
                    <input
                      type="checkbox"
                      data-booster="prepare"
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
                    <span className="bz-case-boite is-ronde" aria-hidden="true">
                      {state.preparations?.[p.id] && <Check size={16} strokeWidth={3} />}
                    </span>
                  </label>
                ))}
              </section>
            )}
            {!isConsulting && !displayRecipe && thermalVisible && (
              <details
                className="bz-repli bz-suivi"
                // m2 : replié en bas, après « À anticiper », juste avant « Aides et repères » (retouche pilote 10.11) ; ouvert d'emblée pendant la montée.
                open={(measuredStep.rampStartedAt != null && measuredStep.holdStartedAt == null)}
              >
                <summary>
                  <Thermometer size={14} aria-hidden="true" />
                  <span>Suivi thermique</span>
                  <ChevronDown size={14} aria-hidden="true" />
                </summary>
                <BrewThermalControl recipe={recipe} state={state} step={measuredStep} now={now} update={update} onMeasure={requestMeasure} />
              </details>
            )}
            <BrewAide
              key={enseme ? 'aides-ensemencement' : 'aides'}
              defaultOpen={enseme}
              className="bz-repli bz-aides"
              quiet
              icon={<CircleHelp size={14} aria-hidden="true" />}
              title="Aides et repères"
            >
              <button
                type="button"
                className="bz-compagnon"
                onClick={() => window.dispatchEvent(new Event('brewer-companion-open'))}
              >
                <MessageCircle size={14} aria-hidden="true" />
                Compagnon brasseur
              </button>
              {/* p3 (n° 3) : le bilan « Ce brassin · mon installation » (six repères) ne passe plus devant la ligne Levure : il vit ici, replié. */}
              {!displayRecipe && ['preboil', 'ensemencement'].includes(current.id) && <BrewSystemFeedback recipe={recipe} state={state} onMeasure={requestWortPair} onIngredients={()=>{const index=state.steps.findIndex(s=>isMash(s.id));if(index>=0){choose(index);requestAnimationFrame(revealAdditions);}}} compact />}
              {!displayRecipe &&
                (!specialExtraction || area === 'boil' || area === 'finish') && (
                  <BrewAssist
                    key={current.id}
                    recipe={executionRecipe}
                    state={state}
                    step={current}
                    now={now}
                    update={update}
                    onMeasure={requestMeasure}
                    thermalHandled
                    stock={stockItems}
                    brewhouse={rig}
                  />
                )}
              <NoloBrewDayGuide
                collapsible
                overview={displayRecipe}
                recipe={recipe}
                state={state}
                step={current}
                onMeasure={requestMeasure}
                onNote={noteNolo}
              />
              {(
                <YeastBrewDayGuide
                  collapsible
                  recipe={recipe}
                  state={state}
                  phase={displayRecipe ? 'recipe' : area}
                  onMeasure={displayRecipe ? undefined : requestMeasure}
                  pitchQuantityMode={currentPitchMode}
                  pitchQuantityAmount={currentPitchAmount}
                  pitchQuantityUnit={currentPitchUnit}
                  preparationExecution={batch.yeastPreparation}
                  plannedBrewDate={toIsoDate(plannedBrewDate(batch) ?? '') || undefined}
                  onPitchQuantityModeChange={selectPitchQuantityMode}
                  onPitchQuantityAmountChange={updatePitchQuantityAmount}
                  onPitchQuantityUnitChange={updatePitchQuantityUnit}
                  onChooseQuantity={displayRecipe ? () => setPitchEditToken((t) => t + 1) : undefined}
                  quantityChosen={pitchChoiceValid}
                />
              )}
              {/* p3 / 2C : à l'ensemencement, les houblons à cru tiennent en une ligne ; 2B : à l'ébullition, plus de panneau Houblons dans les Aides. */}
              {enseme && <BrewACru recipe={recipe} />}
              {(displayRecipe || (area !== 'boil' && !enseme)) && <BrewAide title="Houblons" summary="vigilances et potentiel">
                <p className="brew-aide-note">
                  Quantités du journal si renseignées, au volume prévu de la recette. Les
                  temps de contact à l’ébullition suivent les ajouts terminés.
                </p>
                <HopRecipePanel
                  recipe={recipeForHopAnalysis(actualRecipe, state)}
                  batchId={batch.id}
                />
                {onOpenHopV55 && <button type="button" className="min-h-touch rounded-control border border-hop/40 px-2 text-xs text-cave-200" onClick={() => onOpenHopV55(structuredClone(state))}>Explorer les ajouts futurs dans V5.5</button>}
              </BrewAide>}
              <details className="brew-options">
                <summary>
                  <span>
                    <SlidersHorizontal size={14} /> Options et alertes
                  </span>
                  <ChevronDown size={14} />
                </summary>
                {showTimer && !isConsulting && (
                  <div className="bz-duree">
                    <label>
                      Durée de l’étape
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
                    {boiled && (
                      <p>
                        Les ajouts à venir suivent la nouvelle durée. Les ajouts déjà
                        faits conservent leur heure réelle.
                      </p>
                    )}
                  </div>
                )}
                <details className="brew-sound-settings">
                  <summary>
                    Sonnerie · option de test <ChevronDown size={14} />
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
                        setSoundState(true);
                        setAudioArmed(true);
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
            </BrewAide>
          </div>
        </fieldset>
        {session.error && (
          <div className="brew-sync" role="status">
            <BrewTag tone="due">{session.status}</BrewTag>
            <p>{session.error}</p>
            <button type="button" className={brewControl} onClick={() => void session.retry()}>
              Réessayer
            </button>
            <button type="button" className={brewControl} onClick={() => void session.reload()}>
              Recharger le serveur
            </button>
            <small>La version non envoyée reste en sauvegarde locale.</small>
          </div>
        )}
        <BrewCapturePanel
          title="Mesurer"
          icon={<Thermometer size={14} aria-hidden="true" />}
          context={current.label}
          open={capture === 'measure'}
          onClose={() => setCapture(null)}
          className="brew-measure-capture"
        >
          <div className="brew-measure-panel">
            <BrewDayMeasurements
              key={current.id}
              step={measuredStep}
              recipe={actualRecipe}
              requestedKind={requestedReading}
              requestedPair={requestedPair}
              state={state}
              update={update}
              drafts={readingDrafts.current}
              onAdvice={analyse}
              adviceBusy={busy}
              advice={
                advice?.key === signature ? (
                  <aside role="status" className="brew-advice">
                    <p>{advice.verdict}</p>
                    {advice.action && <p>{advice.action}</p>}
                  </aside>
                ) : undefined
              }
            />
          </div>
        </BrewCapturePanel>
        <BrewCapturePanel
          title="Note"
          icon={<Pencil size={14} aria-hidden="true" />}
          context={state.steps.find((step) => step.id === noteStepId)?.label ?? current.label}
          open={capture === 'note'}
          onClose={() => setCapture(null)}
          className="brew-note-capture"
        >
          <section aria-label="Notes et conseil" className="brew-notes">
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
                <Check size={14} />
                Noter
              </button>
              <button
                type="button"
                className="brew-text-button"
                disabled={busy}
                onClick={analyse}
              >
                <Sparkles size={14} />
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
        title={state.pitchedAt != null ? 'Finaliser la synchronisation ?' : 'Confirmer l’ajout de levure ?'}
        what={`${finishedReadings.gravity ? `OG ${finishedReadings.gravity.value.toFixed(3).replace('.', ',')}` : 'Densité initiale pas relevée'} · ${finishedReadings.volume ? `${finishedReadings.volume.approximate ? '≈ ' : ''}${nombreFr(finishedReadings.volume.value, 1)} L à froid en fermenteur` : 'volume au fermenteur pas relevé'}.`}
        consequence={`${confirmed}/${countableIngredients.length} ajouts cochés. ${pitchQuantityConsequence} ${pitchTemperature == null ? 'Température à l’ajout non relevée.' : `Moût à l’ajout : ${nombreFr(pitchTemperature, 1)} °C. ${pitchTemperatureFeedback(recipe, pitchTemperature, state)}`} Confirme uniquement si la levure a réellement été ajoutée : cet événement démarre la fermentation et clôture le brassage.`}
        confirmLabel={state.pitchedAt != null ? 'Synchroniser et clôturer' : 'Confirmer la levure ajoutée'}
        children={clotureLevure ? (
          <BrewClotureReleves step={etapeCloture} recipe={recipe} draft={clotureReleves} onChange={setClotureReleves} />
        ) : undefined}
        onConfirm={async () => {
          if (finalizing.current) return;
          if (!pitchChoiceValid) {
            setNotice('Choisis une quantité mesurée, la dose prévue réellement ajoutée ou une confirmation sans mesure.');
            return;
          }
          finalizing.current = true;
          const pitchChoice = currentPitchChoice ?? { mode: 'unmeasured' as const };
          // 3C : les relevés saisis dans la fenêtre entrent au journal AVANT la levure (la densité et le volume qualifiés doivent précéder l'ajout) ; une valeur inchangée n'écrit rien.
          const avecReleves = (s: BrewDayState): BrewDayState => {
            if (!clotureLevure) return s;
            const d = clotureReleves, o = clotureDepart.current, at = brewNow();
            const nouveaux: BrewDayReading[] = [];
            if (d.densite != null && (d.densite !== o.densite || d.densiteRefroidie !== o.densiteRefroidie))
              nouveaux.push({ id: crypto.randomUUID(), at, stepId: 'ensemencement', kind: 'densite', value: d.densite, unit: READING.densite.unit, roomTemp: d.densiteRefroidie });
            if (d.volume != null && (d.volume !== o.volume || d.volumeRefroidi !== o.volumeRefroidi))
              nouveaux.push({ id: crypto.randomUUID(), at, stepId: 'ensemencement', kind: 'volume', value: d.volume, unit: READING.volume.unit, roomTemp: d.volumeRefroidi, ...(d.volumeRefroidi ? { volumeBasis: 'cold' as const } : {}) });
            return nouveaux.length ? { ...s, readings: [...(s.readings ?? []), ...nouveaux] } : s;
          };
          update((s) => recordPitch(avecReleves(s), brewNow(), pitchTemperature, pitchChoice));
          if (!(await session.flush())) {
            finalizing.current = false;
            setNotice(
              'Ajout de levure conservé sur cet appareil. Réessaie la clôture après synchronisation du journal.'
            );
            return;
          }
          const f = finalBrewReadings(latest.current, recipe);
          const currentBatch = batchRef.current;
          const yeastPreparation = pitchChoice.mode === 'starter-transferred' && currentBatch.yeastPreparation
            ? { ...currentBatch.yeastPreparation, status: 'transferred' as const,
                ...(pitchChoice.cultureVolumeL != null ? { cultureVolumeL: pitchChoice.cultureVolumeL } : {}) }
            : currentBatch.yeastPreparation;
          onFinish({
            ...currentBatch,
            ...(yeastPreparation ? { yeastPreparation } : {}),
            ...brewSessionDatePatch(currentBatch, latest.current),
            brewDay: latest.current,
            og: f.gravity?.value.toFixed(3),
            volumeBrewedL: f.volume?.value,
            status: 'fermentation'
          });
        }}
      />
    </PageShell>
  );
}
