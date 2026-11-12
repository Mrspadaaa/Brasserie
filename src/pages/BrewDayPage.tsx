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
  MessageCircle,
  TriangleAlert
} from 'lucide-react';
import './brew-day.css';
import { AppConfig, Batch, BrewDayReading, BrewDayState, RecipeSnapshot, StockItem } from '../types';
import { ingredientsOf } from '../domain/recipeSnapshot';
import { breweryDay, brewSessionDatePatch, hasBrewStarted, plannedBrewDate } from '../domain/batchSchedule';
import { BatchSchedule } from '../ui/production/BatchSchedule';
import { saveBatchSchedule } from '../services/batchSchedule';
import { brewAdviceKey, finalBrewReadings, isMash, measuredReadingFeedback, phraseQuantiteLevure, READING, restoreBrewDay, startBrewStep, recordPitch, validPitchQuantityChoice } from '../domain/brewDay';
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
  measuredEfficiency,
  mineralFeedback,
  PREPARATIONS
} from '../domain/brewCompanion';
import {
  buildTimeline,
  remainingMs,
  formatCountdown,
  phraseRetard,
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
import { BrewPiste } from '../ui/BrewPiste';
import { BrewPitchJauge } from '../ui/BrewPitchJauge';
import { dansDit, pointsPiste, type RendezVous } from '../domain/brewDayPiste';
import { echelleMaxG, fourchetteG, grammesDuChoix, gParHl, sachetDeLaLevure, statutDose } from '../domain/levure/sachet';
import type { Sachet } from '../domain/levure/sachet';
import { BrewClotureReleves, CLOTURE_VIDE, cloturePartirDe, type ClotureReleves } from '../ui/BrewClotureReleves';
import yeastSupplyBootstrap from '../data/yeastSupplyBootstrap.json';
import { BrewJournal, phraseCorrection } from '../ui/BrewJournal';
import { BrewCapturePanel } from '../ui/BrewCapturePanel';
import { BrewChoice } from '../ui/BrewChoice';
import { BrewTag, BrewTagTone } from '../ui/BrewTag';
import { useBrewSound } from '../ui/useBrewSound';
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
import { estEtapeCoupure, heureFr, mesureDue, mesuresAttendues } from '../domain/brewMeasures';
import type { MesureAttendue } from '../domain/brewMeasures';
import { cibleMesure, ecartHorsCible, refroidiParDefaut, volumeTarget } from '../domain/brewDay';
import { lastWortPair } from '../domain/brewAssist';
import { correctionsAvantEbullition, infusionPourMaische, paireSansCible, zonesDeCible } from '../domain/brewDayCalculs';
import type { OptionCorrection } from '../domain/brewDayCalculs';
import { BrewMaintenant } from '../ui/BrewMaintenant';
import type { MaintenantProps } from '../ui/BrewMaintenant';
import { BrewAppel, BrewAppelPlein } from '../ui/BrewAppel';
import type { BrewAppelAjout, BrewAppelProps, BrewAppelSuivant } from '../ui/BrewAppel';
import { acquitterFileActions, adresseSansAction, creerRappelNavigateur, ecouterActionsNotification, idsAcocher, idsAjoutDepuis, lireActionUrl, lireFileActions } from '../services/brewNotifications';
import { measureScale } from '../ui/BrewDayMeasurements';
import { departCurseur } from '../domain/measureSlider';
import { sauterAjout } from '../ui/BrewIngredients';
import type { BrewAlarm } from '../domain/brewCompanion';
import { compteReleves, heuresTenues, losangesFrise, relevesDuJour, trierTuiles, tuilesDuJour } from '../domain/brewDayBilan';
import type { HeuresPrevues, ReleveDuJour } from '../domain/brewDayBilan';
import { planJournee } from '../domain/brewDayPlan';
import type { PlanJournee } from '../domain/brewDayPlan';
import { grainPourProchain, rendementVise } from '../domain/brewDayCalculs';
import { BrewFrise } from '../ui/BrewFrise';
import { BrewBilan, BrewJournalExtrait } from '../ui/BrewBilan';
import type { EntreeJournalBilan, HeureTenue as HeureTenueBilan, TuileBilan } from '../ui/BrewBilan';
import { ReadingKind, sg as sgFr } from '../domain/brewDay';
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

/**
 * p2c : les heures prévues par A3 (`planJournee`) posées sur les relevés d'A1, par id d'atome. Rien n'est inventé ici : une heure que le
 * plan ne donne pas reste absente (« ? »). L'eau d'empâtage est due au début de l'étape « eau », la maische au début du premier palier
 * tenu, la densité avant ébullition à l'étape `preboil`, la coupure à la fin de l'étape de coupure, l'OG et le volume à la fin du refroidissement,
 * la température d'ensemencement au début de l'ensemencement.
 */
export function heuresPrevuesDuPlan(plan: PlanJournee | null, state: BrewDayState): HeuresPrevues {
  if (!plan) return {};
  const e = plan.etapes;
  const palier = state.steps.find((s) => isMash(s.id) && (s.tempC ?? 0) < 75) ?? state.steps.find((s) => isMash(s.id));
  const coupure = [...state.steps].reverse().find(estEtapeCoupure);
  const prevue: HeuresPrevues = {};
  const pose = (id: keyof HeuresPrevues, t: number | null | undefined) => {
    if (t != null) prevue[id] = t;
  };
  pose('eau-temp', e.eau?.debut);
  pose('maische', palier ? e[palier.id]?.tenue : null);
  pose('avant-volume', e.preboil?.debut);
  pose('avant-densite', e.preboil?.debut);
  pose('coupure', coupure ? e[coupure.id]?.fin : null);
  pose('og', e.refroidissement?.fin ?? e.ensemencement?.debut);
  pose('fermenteur', e.refroidissement?.fin ?? e.ensemencement?.debut);
  pose('ensemencement-temp', e.ensemencement?.debut);
  return prevue;
}

/** « Rendement d'empâtage » (huitième tuile de p2c) : le visé et le lu passent par la même fonction (A2 / `measuredEfficiency`). « ≈ » : un calcul. */
export function tuileRendement(recipe: RecipeSnapshot, state: BrewDayState, mode: 'vise' | 'reel' = 'vise'): TuileBilan {
  const vise = rendementVise(recipe, state);
  const lu = measuredEfficiency(recipe, state, 'preboil');
  // Un visé inconnu s'écrit « visé ? » (K2 n° 9), jamais une cible absente qui laisse croire qu'il n'y en a pas.
  const cible = vise != null ? `visé ≈ ${Math.round(vise)} %` : 'visé ?';
  const base = { id: 'rendement', nom: 'Rendement d’empâtage', cible, calcul: true } as const;
  if (lu.known && !lu.questionable) {
    // Écart au-delà de 2 points de rendement ; sans cible, le lu n'est ni dans la cible ni hors d'elle : à relever (pas de verdict inventé).
    const etat = vise == null ? 'afaire' : Math.abs(lu.pct - vise) >= 2 ? 'ecart' : 'ok';
    // p2c e4 : à la clôture, la ligne du bas dit le grain à changer « pour le prochain » (A2 `grainPourProchain`) ; sans lui, le calcul d'origine.
    const prochain = mode === 'reel' ? grainPourProchain(recipe, state) : null;
    const quand = prochain
      ? prochain.kg === 0
        ? 'pour le prochain : rien à changer'
        : `pour le prochain : ≈ ${prochain.kg > 0 ? '+' : '−'}${nombreFr(Math.abs(prochain.kg), 1)} kg de grain`
      : `calculé sur ${nombreFr(lu.volumeL, 1)} L à ${sgFr(lu.sg)}`;
    return { ...base, valeur: `≈ ${Math.round(lu.pct)} %`, quand, etat };
  }
  return { ...base, valeur: '?', quand: 'calculé au relevé avant ébullition', etat: 'afaire' };
}

/** Les tuiles du bilan : celles d'A1, le rendement d'A2 avant l'ensemencement, triées (dû, écart, puis l'ordre de la journée). */
export function tuilesDuBilan(releves: ReleveDuJour[], recipe: RecipeSnapshot, state: BrewDayState, mode: 'vise' | 'reel' = 'vise'): TuileBilan[] {
  const base = tuilesDuJour(releves, recipe);
  const i = base.findIndex((t) => t.id === 'ensemencement');
  const avecRendement: TuileBilan[] = [...base];
  avecRendement.splice(i < 0 ? base.length : i, 0, tuileRendement(recipe, state, mode));
  const c = state.boilCorrection;
  return trierTuiles(avecRendement)
    .map((t) => (t.id === 'avant' && t.etat === 'ecart' ? { ...t, grand: mode === 'vise' } : t))
    // B11 : « 15 h 05 · accepté : OG ≈ 1,057 ». À la clôture, la tuile garde « relevé à 15 h 05 » : le choix est au journal.
    .map((t) => (t.id === 'avant' && c && mode === 'vise' ? { ...t, quand: `${heureFr(c.readingAt)} · ${phraseCorrection(c)}` } : t));
}

/** « Heures tenues » d'A1 vers les lignes du bilan. */
export function heuresDuBilan(state: BrewDayState, recipe: RecipeSnapshot): HeureTenueBilan[] {
  return heuresTenues(state, recipe).map((h) => ({ id: h.id, nom: h.nom, de: h.debut, a: h.fin, detail: h.plage, verdict: h.verdict, ton: h.ton === 'ocre' ? 'ecart' : 'ok' }));
}

/**
 * « Au journal · tout est daté » (Z03) : les faits saillants de la journée, du plus ancien au plus récent : le choix d'avant ébullition,
 * un ajout en retard, sauté ou remplacé, la levure. `prevuDe` : l'heure prévue d'un ajout (les alarmes) ; absente, aucun retard n'est dit.
 */
export function entreesJournalBilan(state: BrewDayState, recipe: RecipeSnapshot, prevuDe: (id: string) => number | null): EntreeJournalBilan[] {
  const sortie: EntreeJournalBilan[] = [];
  if (state.boilCorrection) sortie.push({ at: state.boilCorrection.at, texte: `avant ébullition hors cible · ${phraseCorrection(state.boilCorrection)}` });
  for (const i of brewIngredients(recipe)) {
    const a = state.additions?.[i.id];
    if (!a || a.doneAt == null || i.beforeEndMin == null) continue;
    const nom = a.replacement?.name ?? i.name;
    if (a.amount === 0 && i.planned > 0) { sortie.push({ at: a.doneAt, texte: `${i.name} non versé` }); continue; }
    const prevu = prevuDe(i.id);
    const retard = prevu != null ? Math.round((a.doneAt - prevu) / 60000) : 0;
    const dose = `${doseFr(a.amount, i.unit)} ${i.unit}`;
    if (a.replacement) sortie.push({ at: a.doneAt, texte: `${nom} ${dose} à la place de ${i.name}` });
    else if (retard >= 1) sortie.push({ at: a.doneAt, texte: `${nom} ${dose} ajouté, ${retard} min en retard` });
  }
  if (state.pitchedAt != null) {
    const y = state.additions?.yeast;
    const quantite = state.pitchQuantityConfirmation === 'unmeasured' || y?.amount == null ? 'quantité non mesurée' : `${doseFr(y.amount, y.unit ?? '')} ${y.unit ?? ''}`.trim();
    sortie.push({ at: state.pitchedAt, texte: `levure, ${quantite}` });
  }
  return sortie.sort((p, q) => p.at - q.at);
}

const frNb = (n: number, d = 1) => n.toFixed(d).replace('.', ',');
/** K2 n° 8 : un volume au fermenteur noté mais non qualifié à froid reste un volume noté ; « non relevé » ne se dit que sans relevé. */
const volumeRelevePourLevure = (r?: BrewDayReading | null): number | null => (r && r.unit === 'L' && Number.isFinite(r.value) && r.value > 0 ? r.value : null);
/** p2c E4 + 1C : la dose de levure posée sur la plage du fabricant, dite deux fois : pour le volume RÉEL au fermenteur, puis pour le volume PRÉVU. */
function LevureCloture({ nom, detail, sachet, grammes, volumeReelL, reelNonQualifie = false, volumePrevuL, ajouteeA }: {
  nom: string; detail: string; sachet: Sachet | null; grammes: number | null; volumeReelL: number | null;
  /** Le volume est relevé mais sa référence de température n'est pas confirmée : on le dit « relevé », pas « réel ». */
  reelNonQualifie?: boolean; volumePrevuL: number | null; ajouteeA: number;
}) {
  const base = volumeReelL ?? volumePrevuL;
  const plage = sachet?.plageGHl;
  const fourchette = base != null ? fourchetteG(plage, base) : null;
  const max = grammes != null ? echelleMaxG(fourchette, grammes) : null;
  const pc = (x: number) => `${Math.min(100, Math.max(0, (x / (max as number)) * 100))}%`;
  const dit = (v: number | null) => {
    if (v == null || grammes == null) return null;
    const st = statutDose(gParHl(grammes, v), plage);
    return st == null ? null : st === 'dans' ? 'dans la plage' : st === 'sous' ? 'sous la plage' : 'au-dessus de la plage';
  };
  const reel = dit(volumeReelL);
  const prevu = dit(volumePrevuL);
  const phrase = [
    volumeReelL == null ? 'volume au fermenteur non relevé' : reel ? `pour ${reelNonQualifie ? '≈ ' : ''}${frNb(volumeReelL)} L ${reelNonQualifie ? 'relevés' : 'réels'} : ${reel}` : null,
    volumePrevuL != null && prevu && volumeReelL !== volumePrevuL ? `pour ${frNb(volumePrevuL)} L prévus : ${prevu}` : null
  ].filter(Boolean).join(' · ');
  return (
    <section className="bz-groupe bz-levure-cloture" aria-label="Levure">
      <header className="bz-groupe-tete"><h3>Levure</h3><span className="bz-compte">1/1</span></header>
      <div className="bz-levure-cloture-ligne">
        <div className="bz-levure-cloture-txt">
          <strong>{nom}</strong> <span className="bz-levure-cloture-sub">· {detail} · ajoutée <span className="bz-m">{heureFr(ajouteeA)}</span></span>
          {max != null && grammes != null && (
            <div className="bz-jauge" role="group" aria-label="Dose de la levure pour le volume">
              <div className="bz-jauge-barre" aria-hidden="true">
                <span className="bz-jauge-rail" />
                {fourchette && <span className="bz-jauge-bande" style={{ left: pc(fourchette.min), width: `calc(${pc(fourchette.max)} - ${pc(fourchette.min)})` }} />}
                <span className="bz-jauge-trait" style={{ left: pc(grammes) }} />
              </div>
              <div className="bz-jauge-grad" aria-hidden="true">
                <span className="bz-m">0</span>
                {fourchette && <span className="bz-m bz-jauge-bord" style={{ left: pc((fourchette.min + fourchette.max) / 2) }}>{frNb(fourchette.min)}–{frNb(fourchette.max)}</span>}
                <span className="bz-m" style={{ left: '100%' }}>{max} g</span>
              </div>
            </div>
          )}
          {phrase && <p className="bz-levure-cloture-phrase">{phrase}</p>}
        </div>
        <span className="bz-case-boite is-ronde is-fait" aria-hidden="true"><Check size={16} strokeWidth={3} /></span>
      </div>
    </section>
  );
}

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
  // 12 : l'écran reste allumé tant qu'une horloge tourne ; le brasseur peut l'arrêter (l'icône « écran »), et cela tient jusqu'à la fin de l'horloge.
  const [ecranArrete, setEcranArrete] = useState(false);
  const ecranAuto = useRef(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!/ au journal.?$/.test(notice)) return;
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
  // p2c / 1C (test c6 n° 6) : la ligne figure dans chaque phase avant l'ensemencement (où le groupe Levure prend le relais) : « Sortir la levure · SafAle US-05 ·
  // 1 sachet · 11,5 g » et la jauge de la dose sur la plage du fabricant, pour le volume prévu. La dose est celle de la recette, sinon « 1 sachet » d'une
  // levure sèche au poids connu ; sans dose sûre, le nom seul et pas de jauge (l'inconnu n'est jamais 0).
  const doseRappel: { amount: number; unit: string } | undefined = typeof recipe.yeast?.qty === 'number' && recipe.yeast.qty > 0 && recipe.yeast.unit
    ? { amount: recipe.yeast.qty, unit: recipe.yeast.unit }
    : recipe.yeast?.form === 'sèche' && sachetRappel ? { amount: 1, unit: 'sachet' } : undefined;
  const gRappel = grammesDuChoix(doseRappel, sachetRappel);
  const sousRappel = doseRappel
    ? [recipe.yeast?.name, doseRappel.unit === 'sachet' ? `${String(doseRappel.amount).replace('.', ',')} sachet${doseRappel.amount >= 2 ? 's' : ''}` : doseRappel.unit === 'g' ? null : `${doseFr(doseRappel.amount, doseRappel.unit)} ${doseRappel.unit}`, gRappel != null ? `${frNb(gRappel)} g` : null].filter(Boolean).join(' · ')
    : recipe.yeast?.name;
  const rappelLevure: { id: string; label: string; area: string; sous?: string; jauge?: React.ReactNode }[] = recipe.yeast?.name && state.pitchedAt == null && !enseme ? [{
    id: 'levure-sortir',
    label: 'Sortir la levure',
    area: '*',
    sous: sousRappel,
    jauge: <BrewPitchJauge info={{ sachet: sachetRappel, volumeL: recipe.volumeL, volumeBase: 'prévus' }} choix={doseRappel} />
  }] : [];
  const phasePreps: { id: string; label: string; area: string; sous?: string; jauge?: React.ReactNode }[] = [...PREPARATIONS, ...rappelLevure].filter((p) => (p.area === area || (p.area === '*' && area !== 'finish')) &&
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
  // p2c : la journée en frise et le bilan visé. Les heures viennent d'A3, les 9 relevés d'A1, le rendement d'A2 ; rien n'est calculé dans la page.
  const planJ = planJournee(state, actualRecipe, now);
  const relevesJ = relevesDuJour(state, actualRecipe, now, heuresPrevuesDuPlan(planJ, state));
  const compteJ = compteReleves(relevesJ);

  // ── p2c / I1b : la carte « Maintenant » (E1 mesure due, E3 paire avant ébullition hors cible) et l'appel d'un ajout échu (E2).
  // Les chiffres viennent d'A1 (relevés), d'A2 (zones, infusion, trois choix) et d'A3 (heures) ; la page pose, relie et écrit, elle ne calcule rien.
  const [maintBrouillon, setMaintBrouillon] = useState<{ cle: string; valeur: number | null } | null>(null);
  const [maintFait, setMaintFait] = useState<{ stepId: string; at: number; kind: ReadingKind; value: number; titre: string; sousTitre?: string; unite: string; entete: string; verdict: string } | null>(null);
  // À l'avant-ébullition, la paire volume + densité se relève par la feuille Mesurer (paire à froid, case « refroidi ») : pas de carte à une grandeur.
  const aFaireCarte = isConsulting || current.id === 'preboil' ? [] : attendues.filter((m) => m.due && !m.reading);
  const mesureCarte: MesureAttendue | undefined =
    aFaireCarte.find((m) => m.kind === mesureDue(measuredStep, state, actualRecipe, now)) ?? aFaireCarte[0];
  const unitePourCarte = (kind: ReadingKind) => (kind === 'densite' ? '' : READING[kind].unit);
  const sousTitreCarte = (m: MesureAttendue) => {
    const lance = isMash(measuredStep.id) && measuredStep.startedAt != null ? `palier lancé à ${heureFr(measuredStep.startedAt)}` : null;
    return [m.cible ? `cible ${m.cible}` : null, lance ?? (m.quand !== 'maintenant' ? m.quand : null)].filter(Boolean).join(' · ') || undefined;
  };
  const titreCarte = (m: MesureAttendue) => (m.kind === 'volume' && m.nom.startsWith('Au ') ? `Volume ${m.nom.toLowerCase()}` : m.nom);
  const enregistrerMaintenant = (m: MesureAttendue, valeur: number) => {
    const at = brewNow();
    const kind = m.kind;
    const roomTemp = refroidiParDefaut(kind, measuredStep.id);
    const reading: BrewDayReading = {
      id: crypto.randomUUID(),
      at,
      stepId: measuredStep.id,
      kind,
      value: valeur,
      unit: READING[kind].unit,
      ...(kind !== 'temperature'
        ? { roomTemp }
        : {
            medium: measuredStep.id === 'sparge' ? ('water' as const) : ('wort' as const),
            thermalSegmentId: [...(state.thermalSegments ?? [])].reverse().find((sg) => sg.stepId === measuredStep.id && sg.endedAt == null)?.id
          }),
      ...(kind === 'volume' && roomTemp ? { volumeBasis: 'cold' as const } : {}),
      ...(kind === 'volume' && measuredStep.id === 'refroidissement' ? { measurementStage: 'fermenter' as const } : {})
    };
    update((s) => ({ ...s, readings: [...(s.readings ?? []), reading] }));
    const suite = attendues.find((a) => a !== m && !a.reading);
    const nom = titreCarte(m);
    const feminin = kind === 'temperature' || kind === 'densite';
    setMaintFait({
      stepId: measuredStep.id,
      at,
      kind,
      value: valeur,
      titre: nom,
      sousTitre: sousTitreCarte(m),
      unite: unitePourCarte(kind),
      entete: `✓ ${nom} ${feminin ? 'relevée' : 'relevé'} à ${heureFr(at)}`,
      verdict: suite ? `Enregistré · prochain relevé : ${suite.nom} ${suite.quand}` : 'Enregistré · rien d’autre à relever sur cette étape'
    });
    setMaintBrouillon(null);
  };
  // Un relevé qui demande une action (pH hors fenêtre, à confirmer à froid) garde sa ligne « Relevés du jour » : le bilan visé ne dit pas le geste.
  // K2 « écarts dits deux fois » : l'écart à la bande est déjà dans la tuile du bilan (« +1,4 °C », « −2 points ») ; la ligne d'avis ne garde que ce qui demande un geste.
  const avisAgirDe = (kind: ReadingKind, retour: ReturnType<typeof measuredReadingFeedback>) =>
    (retour.tone === 'watch' && !retour.bande) || (kind === 'ph' && isMash(measuredStep.id) && retour.tone === 'neutral');
  const avisAgir = attendues.some((a) => {
    if (!a.reading) return false;
    const retour = measuredReadingFeedback(a.reading, state, measuredStep, actualRecipe);
    return avisAgirDe(a.kind, retour);
  });
  const paireLue = !isConsulting && current.id === 'preboil' ? lastWortPair(state, 'preboil') : null;
  const boilIdPlan = state.steps.find(isBoilStep)?.id;
  const corrections = paireLue
    ? correctionsAvantEbullition(actualRecipe, state, { finEbullitionMs: boilIdPlan ? planJ?.etapes[boilIdPlan]?.fin ?? null : null })
    : null;
  // Le choix écrit pour CETTE paire (même heure de relevé) : il survit au rechargement et au hors ligne, et garde ses trois options telles qu'elles étaient proposées.
  // K2 n° 7 : aux réglages par défaut (pas de référence de température, pas d'évaporation) la carte parle quand même, et dit pourquoi.
  const sansCible = !isConsulting && current.id === 'preboil' && !corrections ? paireSansCible(actualRecipe, state) : null;
  const paireCarte = paireLue ?? sansCible?.paire ?? null;
  const pairAt = paireCarte ? Math.max(paireCarte.volume.at, paireCarte.gravity.at) : null;
  const correctionEcrite = state.boilCorrection && pairAt != null && state.boilCorrection.readingAt === pairAt ? state.boilCorrection : null;
  const choisirCorrection = (id: OptionCorrection['id']) => {
    const proposees = correctionEcrite?.options ?? corrections?.options ?? sansCible?.options;
    const option = proposees?.find((o) => o.id === id);
    // « bouillir plus » règle l'horloge (durée totale d'A2) ; accepter ou extrait sec la remettent à la durée de la recette. Rien n'est inventé : sans durée de recette, on ne touche pas.
    const voulue = id === 'bouillir' ? option?.minutesEbullition : recipe.boilMin;
    if (!proposees || pairAt == null) return;
    const noteChoix = correctionEcrite?.note ?? corrections?.note ?? sansCible?.note;
    const at = brewNow();
    update((s) => {
      const dureeOk = voulue != null && voulue > 0 && voulue !== boilMinutes(s, actualRecipe) ? changeBoilMinutes(s, actualRecipe, voulue - boilMinutes(s, actualRecipe)) : s;
      return { ...dureeOk, boilCorrection: { choix: id, at, readingAt: pairAt, options: proposees.map(({ id: oid, titre, detail, minutesEbullition }) => ({ id: oid, titre, detail, ...(minutesEbullition != null ? { minutesEbullition } : {}) })), ...(noteChoix ? { note: noteChoix } : {}) } };
    });
  };
  // Les bandes « sous · dans · sur » et leur « Et donc » d'un relevé : les mêmes avant et après Enregistrer (p2c e1-apres : la bande lue s'allume).
  const bandesDe = (kind: ReadingKind) => {
    const cible = cibleMesure(kind, measuredStep, actualRecipe);
    const maische = isMash(measuredStep.id);
    const infusion = cible && kind === 'temperature' && maische ? infusionPourMaische(actualRecipe, state, cible) : null;
    const phDes = maische && measuredStep.startedAt != null ? heureFr(measuredStep.startedAt + 10 * 60000) : undefined;
    return {
      infusion,
      zones: cible ? zonesDeCible(kind, cible, { contexte: maische ? 'maische' : undefined, infusion, phA: phDes }) : undefined,
      note: infusion ? '≈ calculé par l’app · pas de relevé ce palier : l’horloge tourne quand même' : undefined
    };
  };
  let maintenant: MaintenantProps | null = null;
  if (mesureCarte) {
    const m = mesureCarte;
    const cle = `${measuredStep.id}|${m.kind}`;
    const valeur = maintBrouillon?.cle === cle ? maintBrouillon.valeur : null;
    const scale = measureScale(m.kind, measuredStep, actualRecipe, valeur);
    const { zones, note: noteBandes } = bandesDe(m.kind);
    maintenant = {
      variante: 'mesure',
      kind: m.kind,
      scale,
      titre: titreCarte(m),
      sousTitre: sousTitreCarte(m),
      unite: unitePourCarte(m.kind),
      valeur,
      depart: departCurseur(m.kind, scale, null),
      onPose: (v) => setMaintBrouillon({ cle, valeur: v }),
      onEnregistrer: (v) => enregistrerMaintenant(m, v),
      zones,
      note: noteBandes,
      enregistre: null
    };
  } else if (paireCarte && (corrections || correctionEcrite || sansCible)) {
    const cibleVol = cibleMesure('volume', measuredStep, actualRecipe);
    const cibleDens = cibleMesure('densite', measuredStep, actualRecipe);
    const volumeHors = ecartHorsCible(cibleVol, paireCarte.volume.value) != null;
    const densiteHors = ecartHorsCible(cibleDens, paireCarte.gravity.value) != null;
    // Sans cible calculable on ne peut pas dire « dans la cible » : la carte reste, avec sa raison.
    if (volumeHors || densiteHors || (sansCible && (!cibleVol || !cibleDens))) {
      const choisiParHorloge: OptionCorrection['id'] | null =
        boilMinutes(state, actualRecipe) > (recipe.boilMin ?? Infinity) && corrections?.options.some((o) => o.id === 'bouillir') ? 'bouillir' : null;
      maintenant = {
        variante: 'paire',
        heure: heureFr(Math.max(paireCarte.volume.at, paireCarte.gravity.at)),
        volumeL: paireCarte.volume.value,
        volumeCibleL: volumeTarget(measuredStep, actualRecipe) ?? null,
        densite: paireCarte.gravity.value,
        densiteCible: cibleDens ? (cibleDens.min + cibleDens.max) / 2 : null,
        volumeHors,
        densiteHors,
        options: correctionEcrite?.options ?? corrections?.options ?? sansCible?.options ?? [],
        choisi: correctionEcrite?.choix ?? choisiParHorloge,
        onChoix: choisirCorrection,
        note: correctionEcrite?.note ?? corrections?.note ?? sansCible?.note,
        sansCible: !corrections && !correctionEcrite?.options.some((o) => o.id !== 'accepter')
      };
    }
  }
  // Après un relevé : la carte reste, verte, avec son verdict, jusqu'à ce qu'un autre relevé soit dû ou 3 min passées.
  if (!maintenant && !isConsulting && maintFait && maintFait.stepId === current.id && now - maintFait.at < 3 * 60000) {
    const f = maintFait;
    const echelle = measureScale(f.kind, measuredStep, actualRecipe, f.value);
    const bandes = bandesDe(f.kind);
    maintenant = {
      variante: 'mesure',
      kind: f.kind,
      scale: echelle,
      titre: f.titre,
      sousTitre: f.sousTitre,
      unite: f.unite,
      valeur: f.value,
      depart: f.value,
      onPose: () => undefined,
      onEnregistrer: () => undefined,
      zones: bandes.zones,
      note: bandes.note,
      enregistre: { entete: f.entete, verdict: f.verdict }
    };
  }

  // E2 : l'ajout échu. `appelBrut` = la première alarme d'ajout échue ; `appelAlarme` = elle, sauf pendant un report (« Dans 1 min »).
  const [reportes, setReportes] = useState<Record<string, number>>({});
  const [sonne, setSonne] = useState<{ cle: string; at: number } | null>(null);
  const [appelFait, setAppelFait] = useState<{ cle: string; ids: string[]; at: number; ajout: BrewAppelAjout; suivant: BrewAppelSuivant | null } | null>(null);
  const rappelRef = useRef<ReturnType<typeof creerRappelNavigateur> | null>(null);
  const rappel = () => (rappelRef.current ??= creerRappelNavigateur());
  const ajoutsDe = (alarm: BrewAlarm) => {
    const ids = idsAjoutDepuis(undefined, alarm.id);
    return { ids, items: ingredients.filter((i) => ids.includes(i.id)) };
  };
  const libelleAjout = (items: typeof ingredients) => ({
    nom: items.map((i) => state.additions?.[i.id]?.replacement?.name ?? i.name).join(' + '),
    dose: items.map((i) => `${doseFr(actualAmount(i, state) ?? i.planned, i.unit)} ${i.unit}`).join(' + ')
  });
  const appelBrut = isConsulting
    ? undefined
    : due.find((a) => a.id.startsWith('add-') && areaOf(a.stepId) === area && ajoutsDe(a).items.length > 0);
  const appelAlarme = appelBrut && !((reportes[appelBrut.id] ?? 0) > now) ? appelBrut : undefined;
  const appelCle = appelBrut ? `${appelBrut.id}@${appelBrut.at}` : null;
  const appelAjoutDe = (alarm: BrewAlarm): BrewAppelAjout => {
    const { items } = ajoutsDe(alarm);
    const { nom, dose } = libelleAjout(items);
    return { id: alarm.id, nom, dose, avantFinMin: items[0]?.beforeEndMin ?? null, prevu: alarm.at };
  };
  const appelSuivantDe = (alarm: BrewAlarm): BrewAppelSuivant | null => {
    const suite = alarms.find((a) => a.id.startsWith('add-') && a.id !== alarm.id && a.at >= alarm.at && ajoutsDe(a).items.length > 0);
    if (!suite) return null;
    const { items } = ajoutsDe(suite);
    const { nom, dose } = libelleAjout(items);
    return { texte: `${nom} ${dose}`, heure: suite.at, moment: items[0]?.beforeEndMin === 0 ? 'coupure du feu' : undefined };
  };
  const coupeSon = () => {
    alarmSound.stop();
    setSonne(null);
  };
  useEffect(() => {
    if (alarmSound.ringing && appelCle) setSonne((p) => (p?.cle === appelCle ? p : { cle: appelCle, at: brewNow() }));
    else if (!alarmSound.ringing) setSonne(null);
  }, [alarmSound.ringing, appelCle]);
  // F1 : la notification d'ajout (titre et texte de p2c, actions « Ajouté » et « +1 min », Android) se pose dès que l'ajout est échu et suit l'appel.
  useEffect(() => {
    if (!appelBrut) return;
    const { ids, items } = ajoutsDe(appelBrut);
    const { nom, dose } = libelleAjout(items);
    const suivant = appelSuivantDe(appelBrut);
    const tag = rappel().start({
      batchId: batch.id,
      additionIds: ids,
      libelle: items.length > 1 ? `${nom} · ${dose}` : `${nom} ${dose}`,
      detail: `${routeIndex + 1} ${isBoilStep(current) ? 'Ébullition' : current.label} · ajout ${items[0]?.beforeEndMin ?? 0}′`,
      dueAt: appelBrut.at,
      ensuite: suivant ? `${suivant.texte}${suivant.moment ? ` · ${suivant.moment}` : ''}${suivant.heure != null ? ` ${heureFr(suivant.heure)}` : ''}` : undefined
    });
    return () => { if (tag) rappelRef.current?.done(tag); };
  }, [appelCle]);
  useEffect(() => () => rappelRef.current?.stop(), []);
  // « Ajouté » ou « +1 min » touchés dans la notification, page ouverte : même geste que dans l'app. Le premier `doneAt` gagne (idsAcocher).
  useEffect(
    () =>
      ecouterActionsNotification((action) => {
        if (action.batchId !== batch.id) return;
        if (action.kind === 'ajoute') {
          update((s) => {
            const ids = idsAcocher(action.additionIds, s.additions);
            if (!ids.length) return s;
            const additions = { ...s.additions };
            for (const id of ids) additions[id] = { ...(additions[id] ?? { amount: 0 }), doneAt: action.at } as NonNullable<typeof additions[string]>;
            return { ...s, additions };
          });
        } else if (action.kind === 'report') {
          setReportes((r) => ({ ...r, [action.tag]: Date.now() + action.minutes * 60000 }));
          rappelRef.current?.snooze(action.tag, action.minutes);
        }
      }),
    [batch.id]
  );
  // G2 : « Ajouté » touché dans la notification, appli fermée : l'adresse `?brewday=<lot>&ajoute=<ids>&a=<heure du toucher>` ou la file IndexedDB du service worker.
  // La page coche à l'heure du TOUCHER (sinon, à l'ouverture, dite). Un ajout déjà coché garde son heure ; l'adresse est nettoyée pour qu'un rechargement ne recoche rien.
  const cocheDepuisNotification = (ids: string[], at: number) =>
    update((s) => {
      const aCocher = idsAcocher(ids, s.additions);
      if (!aCocher.length) return s;
      const additions = { ...s.additions };
      for (const id of aCocher) additions[id] = { ...(additions[id] ?? { amount: 0 }), doneAt: at } as NonNullable<typeof additions[string]>;
      return { ...s, additions };
    });
  useEffect(() => {
    if (isConsulting) return;
    let vivant = true;
    const url = lireActionUrl(window.location.search);
    if (url && url.batchId === batch.id) {
      cocheDepuisNotification(url.additionIds, url.at ?? brewNow());
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${adresseSansAction(window.location.search)}${window.location.hash}`);
    }
    void lireFileActions().then((file) => {
      if (!vivant) return;
      const miens = file.filter((a) => a.batchId === batch.id);
      for (const a of miens) cocheDepuisNotification(a.additionIds, a.at);
      if (miens.length) void acquitterFileActions(miens.map((a) => a.key));
    });
    return () => { vivant = false; };
  }, [batch.id]);
  const appelProps = (): BrewAppelProps | null => {
    const alarm = appelAlarme;
    const fait = appelFait;
    if (!alarm && !fait) return null;
    const ids = fait?.ids ?? ajoutsDe(alarm!).ids;
    const items = ingredients.filter((i) => ids.includes(i.id));
    const tag = (alarm ?? appelBrut)?.id;
    return {
      ajout: fait?.ajout ?? appelAjoutDe(alarm!),
      maintenant: now,
      sonneDepuis: sonne && sonne.cle === (appelCle ?? fait?.cle) ? sonne.at : null,
      suivant: fait ? fait.suivant : appelSuivantDe(alarm!),
      ajoute: fait?.at ?? null,
      onAjoute: (heure) => {
        const base = alarm ?? appelBrut;
        setAppelFait({ cle: appelCle ?? `${base!.id}@${base!.at}`, ids, at: heure, ajout: appelAjoutDe(base!), suivant: appelSuivantDe(base!) });
        update((s) => {
          const aCocher = idsAcocher(ids, s.additions);
          if (!aCocher.length) return s;
          const additions = { ...s.additions };
          for (const i of items)
            if (aCocher.includes(i.id)) additions[i.id] = { ...(additions[i.id] ?? { amount: actualAmount(i, s) ?? i.planned, unit: i.unit }), doneAt: heure };
          return { ...s, additions };
        });
        coupeSon();
      },
      onAnnule: () => {
        setAppelFait(null);
        update((s) => {
          const additions = { ...s.additions };
          for (const id of ids) if (additions[id]?.doneAt != null) { const { doneAt: _d, ...reste } = additions[id]!; additions[id] = reste; }
          return { ...s, additions };
        });
      },
      onFini: () => setAppelFait(null),
      onReporte: (minutes) => {
        if (tag) {
          setReportes((r) => ({ ...r, [tag]: now + minutes * 60000 }));
          rappelRef.current?.snooze(tag, minutes);
        }
        coupeSon();
      },
      onRemplace: () => ouvrirDoseAjout(items[0], true),
      onAutreDose: () => ouvrirDoseAjout(items[0], false),
      onSaute: () => {
        update((s) => items.reduce((acc, i) => sauterAjout(acc, i, brewNow()), s));
        setAppelFait(null);
        coupeSon();
      },
      onCoupeSon: coupeSon
    };
  };
  /** « Remplacer » et « Autre dose » ouvrent le panneau de la ligne d'ajout (voie H) : le geste reste celui de la liste, sans second formulaire. */
  const ouvrirDoseAjout = (item: (typeof ingredients)[number] | undefined, remplacer: boolean) => {
    if (!item) return;
    const noms = [state.additions?.[item.id]?.replacement?.name ?? item.name, item.name];
    const bouton = [...(contentRef.current?.querySelectorAll<HTMLButtonElement>('button[aria-label^="Modifier la quantité de"]') ?? [])].find((b) =>
      noms.some((n) => (b.getAttribute('aria-label') ?? '').startsWith(`Modifier la quantité de ${n}`))
    );
    if (!bouton) return;
    bouton.scrollIntoView?.({ block: 'center' });
    if (bouton.getAttribute('aria-expanded') !== 'true') bouton.click();
    if (!remplacer) return;
    const cherche = (essais: number) => {
      const rangee = bouton.closest('.brew-ingredient')?.parentElement ?? contentRef.current;
      const cible = rangee?.querySelector<HTMLButtonElement>('button[aria-label="Remplacer ce houblon"]');
      if (cible) cible.click();
      else if (essais > 0) requestAnimationFrame(() => cherche(essais - 1));
    };
    requestAnimationFrame(() => cherche(3));
  };
  const appelCourant = appelProps();
  const appelPlein = !!appelCourant && !appelFait && alarmSound.ringing;
  useEffect(() => {
    if (!appelPlein) return;
    const coque = contentRef.current?.closest('.page-shell');
    const autour = [...(coque?.children ?? [])].filter((el) => el.tagName === 'HEADER' || el.tagName === 'FOOTER') as HTMLElement[];
    for (const el of autour) el.setAttribute('inert', '');
    return () => { for (const el of autour) el.removeAttribute('inert'); };
  }, [appelPlein]);
  // La frise ne se dessine que si toutes les phases ont leurs heures et si la journée tient dans 36 h ; sinon la barre des phases garde la navigation.
  const friseDessinable = !!planJ && planJ.phasesInconnues.length === 0 && planJ.phases.length > 0 && Math.max(planJ.finEstimee ?? 0, now, ...planJ.phases.map((p) => p.fin)) - Math.min(planJ.debut, ...planJ.phases.map((p) => p.debut)) <= 36 * 3600000;
  const otherTimers = activeTimers.filter((s) => isConsulting || s.id !== current.id);
  const otherBoil =
    state.boilStartedAt != null && state.boilFinishedAt == null && (isConsulting || !boiled);
  // Une horloge tourne : un minuteur de palier en marche (pas en pause) ou l'ébullition commencée et non finie.
  const clockRunning =
    (state.boilStartedAt != null && state.boilFinishedAt == null) ||
    state.steps.some((s) => isUsefulTimer(s) && s.startedAt != null && s.pausedAt == null && s.doneAt == null);
  useEffect(() => {
    if (!clockRunning) {
      setEcranArrete(false);
      if (ecranAuto.current) {
        ecranAuto.current = false;
        void releaseScreen();
        setAwake(false);
      }
      return;
    }
    if (ecranArrete || awake) return;
    let annule = false;
    void keepScreenAwake().then((ok) => {
      if (annule) return;
      ecranAuto.current = ok;
      setAwake(ok);
    });
    return () => { annule = true; };
  }, [clockRunning, ecranArrete, awake]);
  const headerAlarm =
    upcoming &&
    // p2c / E2 : la carte d'appel prend la place du bandeau d'un ajout échu.
    !(appelCourant && upcoming.id === appelBrut?.id) &&
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
    ? phraseQuantiteLevure(Units.format(currentPitchChoice.amount, currentPitchChoice.unit), currentPitchChoice.amount, currentPitchChoice.unit, plannedPitchSummary)
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
              ? current.rampStartedAt == null ? current.id === 'whirlpool' ? (thermalTarget != null ? `Descendre à ${fr(thermalTarget)} °C` : 'Descendre en température') : 'Commencer la montée' : 'Démarrer le maintien'
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
  // p2c e2 (test c6 n° 18) : les houblons de l'étape suivante tiennent en une ligne avec leur moment : « Citra 50 g · Mosaic 50 g / à 80 °C, après la coupure du feu ».
  // Le moment ne se dit que pour le whirlpool (coupure du feu) ; ailleurs, les lignes d'avant.
  const ensuiteHoublons = nextStep?.id === 'whirlpool' && nextStepIngredients.length > 0 && nextStepIngredients.every((i) => i.kind === 'hop' && i.planned > 0);
  const momentHoublons = ensuiteHoublons ? `${nextStep!.tempC != null ? `à ${fr(nextStep!.tempC)} °C, ` : ''}après la coupure du feu` : null;
  // p2c N09 / A09 : « à 14 h 05 · puis rinçage 76 °C, fin 14 h 50 ». Heures d'A3 ; « ~ » devant une heure estimée (jamais devant celle que l'horloge en marche donne).
  const heureDit = (h: number | null | undefined, estime: boolean) => (h == null ? null : `${estime ? '~' : ''}${heureCuve(h)}`);
  const etapeApres = nextStep ? route[routeIndex + 2] : undefined;
  const etapesPlan = planJ?.etapes ?? {};
  const debutSuivant = nextStep ? etapesPlan[nextStep.id] : undefined;
  const debutSuivantDit = heureDit(debutSuivant?.debut, debutSuivant?.origine === 'estime' && !(running && left != null && left > 0));
  const apresDit = etapeApres
    ? [
        `puis ${(isBoilStep(etapeApres) ? 'ébullition' : etapeApres.label).toLowerCase()}${etapeApres.tempC != null ? ` ${fr(etapeApres.tempC)} °C` : ''}`,
        heureDit(etapesPlan[etapeApres.id]?.fin, true)
      ]
        .filter(Boolean)
        .join(', fin ')
    : null;
  // test c6 n° 17 : le texte en police du texte ; les heures et les degrés seuls en chiffres tabulaires, sans coupure.
  const enHeures = (texte: string) => texte.split(/(~?\d{1,2} h \d{2}|\d+(?:,\d+)? °C)/).map((part, i) => (i % 2 === 1 ? <span key={i} className="bz-m">{part}</span> : part));
  const ensuiteSous = [debutSuivantDit ? `à ${debutSuivantDit}` : null, apresDit].filter(Boolean).join(' · ');
  // p2c N10 / A10 : « Chauffer l'eau de rinçage 76 °C · dès 13 h 50 · prête pour 14 h 15 » ; « Désinfecter le refroidisseur · pendant l'ébullition · ~16 h 00 ».
  const cote = (id: string) => planJ?.aCote.find((c) => c.id === id);
  const sparge = state.steps.find((st) => st.id === 'sparge');
  const phasePrepsDites = phasePreps.map((p) => {
    if (p.id === 'rinçage') {
      const dès = heureDit(cote('rinçage')?.heure, true);
      const pour = heureDit(sparge ? etapesPlan.sparge?.debut : null, true);
      return {
        ...p,
        label: `Chauffer l’eau de rinçage${sparge?.tempC != null ? ` ${fr(sparge.tempC)} °C` : ''}`,
        sous: [dès ? `dès ${dès}` : null, pour ? `prête pour ${pour}` : null].filter(Boolean).join(' · ') || undefined
      };
    }
    if (p.id === 'froid') {
      const h = heureDit(cote('froid')?.heure, true);
      return { ...p, label: 'Désinfecter le refroidisseur', sous: ['pendant l’ébullition', h].filter(Boolean).join(' · ') };
    }
    return p;
  });
  // La piste de l'horloge (p2c, test c6 n° 3 et 4) : les rendez-vous du palier (pH, eau de rinçage, fin), les ajouts de l'ébullition (✓, en retard),
  // et, au contrôle avant ébullition, l'horloge de l'ébullition à venir (60:00, « au premier bouillon ») avec ses ajouts. Aucune heure inventée : sans heure, pas de point.
  const finPalier: { t: number | null; estime: boolean } =
    current.startedAt != null && current.pausedAt == null && left != null ? { t: now + left, estime: false } : { t: etapesPlan[current.id]?.fin ?? null, estime: true };
  const pisteMaintien = (() => {
    if (isConsulting || boiled || completed || !showTimer || !isMash(current.id)) return null;
    const pl = etapesPlan[current.id];
    const debutP = current.startedAt ?? pl?.tenue ?? null;
    const phLu = (state.readings ?? []).some((r) => r.kind === 'ph' && r.stepId === current.id);
    const heurePh = debutP != null && duration > 10 ? debutP + 10 * 60000 : null;
    const rinc = cote('rinçage')?.heure ?? null;
    const rdv: RendezVous[] = [
      {
        id: 'ph', heure: heurePh, etat: phLu ? 'ok' : 'vide',
        texte: heurePh == null ? '' : phLu ? 'pH ✓' : `pH · ${heureCuve(heurePh)} · ${heurePh <= now ? 'à relever' : dansDit(heurePh, now)}`
      },
      { id: 'rinçage', heure: rinc, etat: 'vide', texte: rinc == null ? '' : `eau de rinçage · ~${heureCuve(rinc)}` }
    ];
    return pointsPiste({ debut: debutP, fin: finPalier.t, now, depart: current.startedAt != null ? 'du' : 'vide', finTexte: 'fin', rendezVous: rdv });
  })();
  const ecouleEbullitionMs = left != null ? duration * 60000 - left : 0;
  const pisteEbullition = (() => {
    if (!boiled || boilPoints.length === 0 || duration <= 0) return null;
    const rdv: RendezVous[] = boilPoints.map((p) => {
      const t = (duration - p.minute) * 60000;
      const retard = !p.done && running && t + 60000 <= ecouleEbullitionMs;
      return { id: p.id, heure: t, etat: p.done ? 'ok' : retard ? 'red' : 'vide', texte: p.done ? `${p.nom} ✓` : retard ? `${p.nom} en retard` : p.nom };
    });
    const r = pointsPiste({ debut: 0, fin: duration * 60000, now: ecouleEbullitionMs, rendezVous: rdv });
    const ton: Record<string, 'red'> = {};
    for (const p of rdv) if (p.etat === 'red') ton[p.id] = 'red';
    return { ...r, ton };
  })();
  const avantEbullition = !isConsulting && current.id === 'preboil' && state.boilStartedAt == null && state.steps.some(isBoilStep);
  const dureeAvant = avantEbullition ? boilMinutes(state, actualRecipe) : 0;
  const planBouillon = boilIdPlan ? etapesPlan[boilIdPlan] : undefined;
  const pisteAvant = (() => {
    if (!avantEbullition || dureeAvant <= 0) return null;
    const pts = boilAdditionPoints(executionRecipe, state);
    const rdv: RendezVous[] = pts.map((p, i) => {
      const premier = i === 0, dernier = i === pts.length - 1 && pts.length > 1;
      const texte = premier
        ? `${p.nom} ${doseFr(p.dose, p.unit)} ${p.unit} · ${p.minute >= dureeAvant ? 'au bouillon' : p.minute === 0 ? 'coupure' : `${p.minute}′`}`
        : dernier ? `${p.nom} · ${p.minute === 0 ? 'coupure' : `${p.minute}′`}` : '';
      return { id: p.id, heure: (dureeAvant - p.minute) * 60000, etat: 'vide', texte };
    });
    return pointsPiste({ debut: 0, fin: dureeAvant * 60000, now: 0, rendezVous: rdv });
  })();
  const stepHasHop = brewIngredients(ingredientDisplayRecipe).some(
    (i) => i.kind === 'hop' && ingredientAppliesToStep(i, { area, stepId: current.id }) && i.planned > 0
  );
  // « durée ± » : amène les boutons −5 −1 +1 +5 de l'horloge sous le doigt.
  const ajusterDuree = () => {
    const bouton = contentRef.current?.querySelector<HTMLElement>('.bz-ctl button:not(:disabled)');
    bouton?.scrollIntoView({ block: 'center' });
    bouton?.focus({ preventScroll: true });
  };
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
  // Pied au format z1 « Action · heure » : tant que l'horloge tourne, le bouton nomme la fin attendue et son heure, échue ou non
  // (« Coupure du feu · 14 h 38 »), plutôt que « Couper le feu et continuer », trop long pour 390 px.
  const finLabel = boiled
    ? 'Coupure du feu'
    : isMash(current.id)
      ? 'Fin du palier'
      : current.id === 'whirlpool'
        ? 'Fin du whirlpool'
        : 'Fin de l’étape';
  const finEnCours = running && !completed && left != null;
  const waitingLabel = finEnCours && left > 0 ? finLabel : null;

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
                {phraseRetard(due[0].at - now)?.retard ? `À faire, ${phraseRetard(due[0].at - now)!.court}` : 'À faire maintenant'}
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
            {headerAlarm.at <= now
              ? phraseRetard(headerAlarm.at - now)!.retard ? `À faire, ${phraseRetard(headerAlarm.at - now)!.court}` : 'À faire maintenant'
              : `À ${heureCuve(headerAlarm.at)}`}
            <strong>
              {headerAlarm.title === 'Ajout en cuve' ? headerAlarm.body : headerAlarm.title}
            </strong>
          </span>
          {!phraseRetard(headerAlarm.at - now)?.retard && <span className="brew-digits">{formatCountdown(headerAlarm.at - now)}</span>}
          <ChevronRight size={14} />
        </button>
      )}
    </>
  );
  // p2c / G3 : « Aide » est une porte à un toucher dans le bilan (Compagnon, aides du jour J, options et alertes). La conception (panneau Houblons)
  // reste une ligne repliée à part. À l'ensemencement et en consultation (Recette), l'ancien bloc « Aides et repères » garde sa place.
  const aidesDebut = (
    <>
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
              {(state.pitchedAt == null || isConsulting || displayRecipe) && (
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
    </>
  );
  const aideHoublons = (
    <>
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
    </>
  );
  const aideOptions = (
    <>
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
    </>
  );
  const porteAide = !isConsulting && !enseme && showReadingSummary;
  // p2c E4 : à la clôture (levure ajoutée, dernière étape), la page devient le bilan contre la cible. Avant la levure, c'est la conduite du jour.
  const clotureFaite = !isConsulting && !displayRecipe && lastStep && state.pitchedAt != null;
  const finJour = state.finishedAt ?? (clotureFaite ? now : null);
  const heureDeFinJour = finJour != null ? heureCuve(finJour) : '?';
  const dureeJourMin = state.startedAt != null && finJour != null ? Math.max(0, Math.round((finJour - state.startedAt) / 60000)) : null;
  const dureeJour = dureeJourMin == null ? '?' : `${Math.floor(dureeJourMin / 60)} h ${String(dureeJourMin % 60).padStart(2, '0')}`;
  const avanceJour = planJ?.avanceMin ?? null;
  const prevuDeAjout = (id: string) => alarms.find((a) => a.id.startsWith('add-') && ajoutsDe(a).ids.includes(id))?.at ?? null;
  const gLevure = grammesDuChoix(state.additions?.yeast, sachetDeLaLevure(recipe.yeast, yeastSupplyBootstrap.products));
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
            <span aria-hidden="true">réveil</span>
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
                ecranAuto.current = false;
                setAwake(false);
                setEcranArrete(true);
              } else {
                setEcranArrete(false);
                ecranAuto.current = false;
                setAwake(await keepScreenAwake());
              }
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
            onClick={() => {
              // m2 : la feuille s'ouvre sur la mesure due de l'étape ; un brouillon en cours garde sa grandeur.
              if (isConsulting || readingDrafts.current.get(current.id)?.raw) openCapture('measure');
              else requestMeasure(mesureDue(measuredStep, state, actualRecipe, now));
            }}
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
            {finEnCours ? (
              <>
                {finLabel} · <span className="bz-m">{heureCuve(now + left!)}</span>
              </>
            ) : clotureFaite ? (
              <>
                Terminer · <span className="bz-m">{heureCuve(now)}</span>
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
      {appelCourant && appelPlein && <BrewAppelPlein {...appelCourant} />}
      <div ref={contentRef} className="brew-workspace" inert={appelPlein}>
        {notice && !capture && (
          <div className="brew-toast" role="status">
            {notice}
          </div>
        )}
        {!isConsulting && friseDessinable && (
          <nav aria-label="Phases du brassage" className="bz-frise-nav"><BrewFrise
            plan={planJ}
            releves={losangesFrise(relevesJ).filter((r): r is ReleveDuJour & { heure: number } => r.heure != null)}
            maintenant={now}
            enCours={area}
            vue={view as BrewArea}
            libelles={areaLabels}
            phasesIndisponibles={(Object.keys(AREA) as BrewArea[]).filter(
              (v) => !session.canStart || !route.some((st) => areaOf(st.id) === v)
            )}
            onPhase={(v) => navigate(v)}
          /></nav>
        )}
        {/* Repli honnête : une phase sans heure (vitesse de chauffe inconnue) ne se dessine pas sur la frise ; la barre des phases garde la navigation. */}
        {!isConsulting && !friseDessinable && (
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
        )}
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
                      {avantEbullition && dureeAvant > 0 && (
                        <div className="bz-horloge" data-booster="horloge" data-etat="repos" data-avant-ebullition="">
                          <div className="bz-haut">
                            <output aria-label="Durée de l’ébullition" aria-live="off" className="bz-temps bz-m brew-digits">{String(dureeAvant).padStart(2, '0')}:00</output>
                            <span className="bz-fin">
                              fin <span className="bz-m">{planBouillon?.fin == null ? '?' : `~${heureCuve(planBouillon.fin)}`}</span>
                              <br />
                              au premier bouillon <span className="bz-m">{planBouillon?.debut == null ? '?' : `~${heureCuve(planBouillon.debut)}`}</span>
                            </span>
                            <div className="bz-ctl" role="group" aria-label="Ajuster la durée de l’ébullition">
                              {[-5, -1].map((d) => (
                                <button type="button" key={d} className="bz-m" aria-label={`Retirer ${-d} minutes d’ébullition`} data-booster={`moins${-d}`} onClick={() => update((s) => changeBoilMinutes(s, recipe, d))}>
                                  −{-d}
                                </button>
                              ))}
                              <button type="button" aria-label="Passer à l’ébullition" data-booster="play" onClick={finishAndContinue}>
                                <Play size={14} fill="currentColor" />
                              </button>
                              {[1, 5].map((d) => (
                                <button type="button" key={d} className="bz-m" aria-label={`Ajouter ${d} minutes d’ébullition`} data-booster={`plus${d}`} onClick={() => update((s) => changeBoilMinutes(s, recipe, d))}>
                                  +{d}
                                </button>
                              ))}
                            </div>
                          </div>
                          {pisteAvant && pisteAvant.points.length > 0 && <BrewPiste nom="Ajouts de l’ébullition à venir" booster="piste" points={pisteAvant.points} avance={0} />}
                        </div>
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
                                  fin <span className="bz-m">{finPalier.t == null ? '?' : `${finPalier.estime ? '~' : ''}${heureCuve(finPalier.t)}`}</span>
                                  <br />
                                  tenir <span className="bz-m">{fr(thermalTarget!)} °C</span> · couvercle
                                </>
                              ) : current.pausedAt != null ? (
                                'en pause'
                              ) : running && left != null ? (
                                <>
                                  {/* « palier à vérifier » ne vaut que pour un palier ; l'ébullition et le whirlpool disent « fin 14 h 38 » (z1). */}
                                  {staleTimer && isMash(current.id) ? 'palier à vérifier' : 'fin'}{' '}
                                  {staleTimer && <>{new Date(now + left).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' })} à </>}
                                  <span className="bz-m">{heureCuve(now + left)}</span>
                                  {left < 0 && (staleTimer && !isMash(current.id)
                                    ? ' · à vérifier'
                                    : !staleTimer && phraseRetard(left)?.retard ? ` · ${phraseRetard(left)!.court}` : '')}
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
                          {pisteEbullition && <BrewPiste nom="Ajouts de l’ébullition" booster="piste" points={pisteEbullition.points} avance={pisteEbullition.avance} ton={pisteEbullition.ton} />}
                          {pisteMaintien && pisteMaintien.points.length > 0 && <BrewPiste nom="Rendez-vous du palier" booster="piste-palier" points={pisteMaintien.points} avance={pisteMaintien.avance} ton={{ ph: 'ocre' }} />}
                        </div>
                      )}
                      {staleTimer && (
                        <aside className="brew-recovery" role="status">
                          <BrewTag tone="due">{(phraseRetard(left!)?.retard ? phraseRetard(left!)!.court : 'Échéance passée').replace(/^en retard/, 'En retard')}</BrewTag>
                          <p>
                            {isMash(current.id) ? 'Ce palier' : boiled ? 'Cette ébullition' : 'Cette étape'} devait finir à {heureCuve(now + left!)} et la fin n’a pas été validée.
                            Regarde ce qui s’est passé à la cuve.
                          </p>
                          {/* Lot F (16) : à l'ébullition, le pied « Coupure du feu · heure » est LE bouton qui coupe le feu ; le bandeau n'en double pas le geste. */}
                          {!boiled && (
                            <button type="button" className={brewControl} onClick={toggleComplete}>
                              C’est fini : valider
                            </button>
                          )}
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
                            Pas fini : relancer {duration} min
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
                    {due.some((a) => a.id !== appelBrut?.id || !appelCourant) && !staleTimer && !headerAlarm && !alarmSound.ringing && (
                      <aside role="status" className="brew-due-alert">
                        <BellRing size={16} />
                        <div>
                          {due.filter((a) => a.id !== appelBrut?.id || !appelCourant).map((a) => (
                            <p key={a.id}>
                              <strong>{a.title}</strong>
                              <span>{a.body}</span>
                            </p>
                          ))}
                        </div>
                      </aside>
                    )}
                    {prompt && current.doneAt == null && !((holdLine || thermalVisible) && prompt.kind === 'temperature') && (current.id === 'preboil' || !attendues.some((a) => a.kind === prompt.kind)) && (
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
                {maintenant && <BrewMaintenant {...maintenant} />}
                {appelCourant && !appelPlein && <BrewAppel {...appelCourant} />}
                {clotureFaite && (
                  <>
                    <section className="bz-fin-jour" aria-label="Heure de fin" data-booster="horloge-fin">
                      <b className="bz-m bz-fin-duree" aria-label="Durée du brassage">{dureeJour}</b>
                      <span className="bz-fin-texte">
                        de <span className="bz-m">{state.startedAt != null ? heureCuve(state.startedAt) : '?'}</span> à <span className="bz-m">{heureDeFinJour}</span>
                        {planJ?.finPrevue != null && (
                          <>
                            <br />~<span className="bz-m">{heureCuve(planJ.finPrevue)}</span> estimé
                            {avanceJour != null && avanceJour !== 0 && <> · {Math.abs(avanceJour)} min {avanceJour > 0 ? 'd’avance' : 'de retard'}</>}
                          </>
                        )}
                      </span>
                    </section>
                    <BrewBilan mode="reel" tuiles={tuilesDuBilan(relevesJ, actualRecipe, state, 'reel')} faits={compteJ.faits} total={compteJ.total} heures={heuresDuBilan(state, actualRecipe)} />
                    <LevureCloture
                      nom={recipe.yeast?.name ?? 'Levure'}
                      detail={state.pitchQuantityConfirmation === 'unmeasured' || state.additions?.yeast?.amount == null ? 'quantité non mesurée' : `${doseFr(state.additions.yeast.amount, state.additions.yeast.unit ?? '')} ${state.additions.yeast.unit ?? ''}${gLevure != null && state.additions.yeast.unit !== 'g' ? ` · ${frNb(gLevure)} g` : ''}`}
                      sachet={sachetDeLaLevure(recipe.yeast, yeastSupplyBootstrap.products)}
                      grammes={gLevure}
                      volumeReelL={finishedReadings.volume?.value ?? volumeRelevePourLevure(finishedReadings.rawVolume)}
                      reelNonQualifie={finishedReadings.volume == null && volumeRelevePourLevure(finishedReadings.rawVolume) != null}
                      volumePrevuL={recipe.volumeL ?? null}
                      ajouteeA={state.pitchedAt!}
                    />
                  </>
                )}
                {avisAgir && !displayRecipe && (
                  <section className="bz-avis-releve" aria-label="Avis du relevé">
                    {attendues.filter((a) => a.reading).map((a) => {
                      const retour = measuredReadingFeedback(a.reading!, state, measuredStep, actualRecipe);
                      if (!avisAgirDe(a.kind, retour)) return null;
                      return (
                        <p key={a.kind} className={`bz-releve-avis is-${retour.tone}`}>
                          {retour.tone === 'watch' && <TriangleAlert size={14} aria-hidden="true" />}
                          <span>{retour.title}</span>
                        </p>
                      );
                    })}
                  </section>
                )}
                {!clotureFaite && <BrewIngredients
                  recipe={displayRecipe ? recipe : ingredientDisplayRecipe}
                  state={state}
                  stock={stockItems}
                  area={area}
                  overview={displayRecipe}
                  update={update}
                  now={now}
                  stepId={current.id}
                  pitch={pitchEditor}
                />}
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
            {!isConsulting && nextStep && (
              <section className="bz-groupe bz-ensuite" data-matiere={nextGrains ? 'grain' : nextStepIngredients[0]?.kind === 'hop' ? 'houblon' : 'autre'} aria-label={`Ensuite · ${nextStepName}`}>
                <header className="bz-groupe-tete">
                  <h3>Ensuite</h3>
                </header>
                <div className="bz-row is-apercu bz-ensuite-etape">
                  <div className="bz-nom">
                    <strong>{nextStepName}{nextStepMeta && <> <span className="bz-m">{nextStepMeta}</span></>}</strong>
                    {ensuiteSous && <small className="bz-m">{enHeures(ensuiteSous)}</small>}
                  </div>
                  <span className="bz-case is-apercu" aria-hidden="true" />
                </div>
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
                  ensuiteHoublons ? (
                    <div className="bz-row is-apercu">
                      <div className="bz-nom">
                        <strong>{nextStepIngredients.map((i) => `${state.additions?.[i.id]?.replacement?.name ?? i.name} ${doseFr(actualAmount(i, state) ?? i.planned, i.unit)} ${i.unit}`).join(' · ')}</strong>
                        <small className="bz-m">{enHeures(momentHoublons!)}</small>
                      </div>
                      <span className="bz-case is-apercu" aria-hidden="true" />
                    </div>
                  ) : nextStepIngredients.map((i) => (
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
            {clotureFaite && <BrewJournalExtrait entrees={entreesJournalBilan(state, actualRecipe, prevuDeAjout)} />}
            {!isConsulting && !clotureFaite && showReadingSummary && (
              <BrewBilan
                tuiles={tuilesDuBilan(relevesJ, actualRecipe, state)}
                faits={compteJ.faits}
                total={compteJ.total}
                fin={planJ?.finEstimee ?? null}
                onDuree={showTimer && !completed ? ajusterDuree : undefined}
                onDose={stepHasIngredients ? revealAdditions : undefined}
                onHoublonManquant={stepHasHop ? revealAdditions : undefined}
                aide={porteAide ? <>{aidesDebut}{aideOptions}</> : undefined}
              />
            )}
            {!isConsulting && !clotureFaite && (
              <section aria-label="Préparations" className="brew-preparations bz-groupe bz-anticiper">
                <header className="bz-groupe-tete">
                  <ListChecks size={14} aria-hidden="true" />
                  <h3>À anticiper</h3>
                  <span className="bz-compte">
                    {preparationCount}/{phasePreps.length}
                  </span>
                </header>
                {phasePrepsDites.map((p) => (
                  <label key={p.id} className={`bz-anticiper-ligne ${state.preparations?.[p.id] ? 'is-complete' : ''}`}>
                    <span>{p.label}{p.sous && <small className="bz-anticiper-sous">{p.sous}</small>}{p.jauge}</span>
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
            {!porteAide && (
              <BrewAide
                key={enseme ? 'aides-ensemencement' : 'aides'}
                className="bz-repli bz-aides"
                quiet
                icon={<CircleHelp size={14} aria-hidden="true" />}
                title="Aides et repères"
              >
                {aidesDebut}
                {aideHoublons}
                {aideOptions}
              </BrewAide>
            )}
            {porteAide && aideHoublons}
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
              onSaved={(message) => {
                setCapture(null);
                setNotice(`${message}.`);
              }}
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
          context={(note.trim() ? state.steps.find((step) => step.id === noteStepId)?.label : undefined) ?? current.label}
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
        consequence={`${confirmed}/${countableIngredients.length} ajouts cochés. ${pitchQuantityConsequence} ${pitchTemperature == null ? 'Température à l’ajout non relevée.' : `Moût à l’ajout : ${nombreFr(pitchTemperature, 1)} °C. ${pitchTemperatureFeedback(recipe, pitchTemperature, state)}`} Confirme uniquement si la levure a réellement été ajoutée : cet événement démarre la fermentation.${state.pitchedAt == null ? ' Le bilan de la journée reste à l’écran ; « Terminer » ferme la page.' : ' Cela ferme la page.'}`}
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
          const premiereConfirmation = state.pitchedAt == null;
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
          // p2c E4 : la levure confirmée, la page reste sur la clôture et le bilan ; « Terminer » (second passage, levure déjà écrite) ferme comme avant.
          if (premiereConfirmation) {
            finalizing.current = false;
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
