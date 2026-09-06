import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NumberInput } from '../ui/NumberInput';
import { Batch, BrewDayState, BrewDayStep, AppConfig } from '../types';
import { ingredientsOf } from '../domain/recipeSnapshot';
import { BrewingMath } from '../services/brewingMath';
import { acidCorrectionFromMeasuredPh, MASH_PH_BAND } from '../domain/water';
import { Units } from '../services/units';
import {
  buildTimeline,
  remainingMs,
  formatCountdown,
  armAudio,
  beep,
  keepScreenAwake,
  releaseScreen
} from '../services/brewTimer';
import { PageShell, Section } from './PageShell';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Field, inputClass } from '../ui/FormNav';
import { ConfirmSheet } from '../ui/Sheet';
import { Play, Check, SkipForward, Volume2, VolumeX, Sun, Plus } from 'lucide-react';

/**
 * Le jour de brassage, minuté.
 *
 * ⚠️ Ce que ça remplace : `BatchAssistantModal`, cinq onglets de calculs (eau,
 * empâtage, ébullition, fermentation, conditionnement) qu'il fallait consulter
 * en gardant en tête où l'on en était. Aucun minuteur : le brasseur comptait
 * sur la minuterie du four, et ratait les ajouts de houblon.
 *
 * Ici le déroulé est **une seule liste**, dérivée de la recette figée dans le
 * brassin. Une étape est en cours, les autres attendent. Le décompte est ancré
 * à l'horloge murale : verrouiller l'écran, recharger la page ou perdre le
 * réseau ne fausse rien.
 *
 * Tous les calculs de l'ancien assistant sont conservés — sels, réfractomètre,
 * carbonatation — mais ils apparaissent AU MOMENT où ils servent, pas dans un
 * onglet qu'il faut penser à ouvrir.
 */

type ReadingKind = 'volume' | 'densite' | 'ph' | 'temperature';

const READING_UNITS: Record<ReadingKind, string> = {
  volume: 'L',
  densite: 'SG',
  ph: '',
  temperature: '°C'
};

interface BrewDayPageProps {
  batch: Batch;
  config: AppConfig;
  onClose: () => void;
  onSave: (batch: Batch) => void;
  /** Clôture : déstocke les ingrédients et passe le brassin en fermentation. */
  onFinish: (batch: Batch) => void;
}

export const BrewDayPage: React.FC<BrewDayPageProps> = ({
  batch,
  config,
  onClose,
  onSave,
  onFinish
}) => {
  const brewhouse =
    config.brewhouses.find((b) => b.id === config.activeBrewhouseId) ?? config.brewhouses[0];

  const recipe = batch.recipeSnapshot;
  const ingredients = useMemo(() => ingredientsOf(batch), [batch]);

  /** Le déroulé : celui déjà entamé, sinon construit depuis la recette figée. */
  const [state, setState] = useState<BrewDayState>(
    () =>
      batch.brewDay ?? {
        steps: recipe
          ? buildTimeline(recipe)
          : buildTimeline({
              ...batch,
              fermentables: ingredients.fermentables,
              hops: ingredients.hops,
              yeast: ingredients.yeast
            } as never),
        currentIndex: 0,
        readings: []
      }
  );

  const [now, setNow] = useState(() => Date.now());
  const [soundOn, setSoundOn] = useState(false);
  const [screenAwake, setScreenAwake] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const alerted = useRef<Set<string>>(new Set());

  // Relevés
  const [readingKind, setReadingKind] = useState<ReadingKind>('densite');
  const [readingValue, setReadingValue] = useState('');
  const [readingNote, setReadingNote] = useState('');

  const current = state.steps[state.currentIndex];
  const left = current ? remainingMs(current, now) : null;

  /** Une seconde suffit : c'est l'horloge qui compte, pas le nombre de ticks. */
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // L'alarme ne sonne qu'une fois par étape, même si l'onglet revient au premier
  // plan longtemps après l'échéance.
  useEffect(() => {
    if (!current || left === null || left > 0) return;
    if (alerted.current.has(current.id)) return;
    alerted.current.add(current.id);
    if (soundOn) beep(current.hopNames?.length ? 4 : 3);
  }, [current, left, soundOn]);

  useEffect(() => () => void releaseScreen(), []);

  const persist = useCallback(
    (next: BrewDayState) => {
      setState(next);
      onSave({ ...batch, brewDay: next });
    },
    [batch, onSave]
  );

  const startStep = () => {
    // Le son s'arme ICI : c'est le seul endroit garanti d'être un geste réel.
    if (!soundOn && armAudio()) setSoundOn(true);
    if (!screenAwake) void keepScreenAwake().then(setScreenAwake);

    persist({
      ...state,
      startedAt: state.startedAt ?? Date.now(),
      steps: state.steps.map((s, i) =>
        i === state.currentIndex ? { ...s, startedAt: Date.now() } : s
      )
    });
  };

  const completeStep = () => {
    const nextIndex = Math.min(state.currentIndex + 1, state.steps.length - 1);
    const finished = state.currentIndex >= state.steps.length - 1;
    persist({
      ...state,
      currentIndex: nextIndex,
      finishedAt: finished ? Date.now() : state.finishedAt,
      steps: state.steps.map((s, i) =>
        i === state.currentIndex
          ? { ...s, doneAt: Date.now() }
          : // L'étape suivante démarre d'elle-même : sur un brassage, on
            // enchaîne, on ne rappuie pas sur « démarrer » les mains mouillées.
            i === nextIndex && !finished
            ? { ...s, startedAt: Date.now() }
            : s
      )
    });
  };

  const addReading = () => {
    const v = parseFloat(readingValue.replace(',', '.'));
    if (!Number.isFinite(v)) return;
    persist({
      ...state,
      readings: [
        ...(state.readings ?? []),
        {
          at: Date.now(),
          kind: readingKind,
          value: v,
          unit: READING_UNITS[readingKind],
          note: readingNote.trim() || undefined
        }
      ]
    });
    setReadingValue('');
    setReadingNote('');
  };

  /** La densité relevée la plus récente : c'est elle qui devient l'OG. */
  const lastGravity = [...(state.readings ?? [])]
    .reverse()
    .find((r) => r.kind === 'densite');

  /**
   * La correction d'acide, calculée sur le pH RELEVÉ DANS LA MAISCHE.
   *
   * ⚠️ Elle vivait dans l'assistant de recette, et Gaëtan a mis le doigt
   * dessus : « lors de la création je connais pas le pH du mash ». C'est exact
   * — on ne mesure rien tant que l'eau n'a pas touché le grain. L'outil n'a
   * donc de sens qu'ICI, minuteur en main, pH-mètre dans la cuve.
   *
   * ⚠️ ET SEULEMENT PENDANT L'EMPÂTAGE. Un relevé de pH ne dit pas de quelle
   * eau il vient ; c'est l'ÉTAPE EN COURS qui le dit. Passé la filtration, le
   * grain n'est plus dans l'eau : corriger le pH de maische n'a plus d'objet,
   * et proposer une dose à ce moment-là serait proposer un geste impossible.
   *
   * Le plan d'eau est celui FIGÉ dans le brassin — volumes et acide choisis le
   * jour où la recette a été pensée. C'est bien lui qu'on est en train de
   * verser.
   */
  const enMaische = !!current && /^mash/.test(current.id);
  const lastPh = [...(state.readings ?? [])].reverse().find((r) => r.kind === 'ph');
  const mashPhFix = useMemo(() => {
    const plan = recipe?.waterPlan;
    if (!enMaische || !lastPh || !plan) return null;
    const grist = recipe?.totalGristKg ?? 0;
    return acidCorrectionFromMeasuredPh(
      lastPh.value,
      plan.mashWaterL,
      grist > 0 ? plan.mashWaterL / grist : 0,
      plan.acid?.id ?? 'lactique'
    );
  }, [enMaische, lastPh, recipe]);

  const ogTarget = recipe?.ogTarget ?? 0;
  const efficiency =
    lastGravity && ogTarget > 1
      ? BrewingMath.brewEfficiency(ogTarget, lastGravity.value, brewhouse?.efficiencyPct ?? 75)
      : null;

  const doneCount = state.steps.filter((s) => s.doneAt).length;
  const allDone = doneCount === state.steps.length;

  return (
    <PageShell
      title={`${batch.id} — ${batch.name}`}
      subtitle={`Jour de brassage · ${doneCount}/${state.steps.length} étapes`}
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            onClick={() => {
              if (soundOn) {
                setSoundOn(false);
              } else if (armAudio()) {
                setSoundOn(true);
                beep(1);
              }
            }}
            aria-label={soundOn ? 'Couper les alarmes' : 'Activer les alarmes'}
            aria-pressed={soundOn}
            className={`touch-target rounded-control ${soundOn ? 'text-ebc-straw' : 'text-cave-500'}`}
          >
            {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              if (screenAwake) {
                void releaseScreen();
                setScreenAwake(false);
              } else {
                void keepScreenAwake().then(setScreenAwake);
              }
            }}
            aria-label={screenAwake ? 'Laisser l’écran s’éteindre' : 'Garder l’écran allumé'}
            aria-pressed={screenAwake}
            className={`touch-target rounded-control ${screenAwake ? 'text-ebc-straw' : 'text-cave-500'}`}
          >
            <Sun className="w-5 h-5" />
          </button>
        </>
      }
      footer={
        allDone ? (
          <button
            type="button"
            onClick={() => setConfirmFinish(true)}
            className="w-full min-h-touch rounded-control bg-hop text-cave-950 font-semibold"
          >
            Clôturer le brassage
          </button>
        ) : !current?.startedAt ? (
          <button
            type="button"
            onClick={startStep}
            className="w-full min-h-touch rounded-control bg-ebc-straw text-cave-950
                       font-semibold flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Démarrer « {current?.label} »
          </button>
        ) : (
          <button
            type="button"
            onClick={completeStep}
            className={`w-full min-h-touch rounded-control font-semibold
                        flex items-center justify-center gap-2 ${
                          left !== null && left > 0
                            ? 'border border-cave-700 text-cave-100'
                            : 'bg-hop text-cave-950'
                        }`}
          >
            {left !== null && left > 0 ? (
              <>
                <SkipForward className="w-5 h-5" />
                Passer à l’étape suivante
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Étape terminée
              </>
            )}
          </button>
        )
      }
    >
      {/* --- L'étape en cours, en grand ---------------------------------- */}
      {current && (
        <section className="panel p-3 sm:p-4 space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base sm:text-lg font-semibold text-cave-50 min-w-0">{current.label}</h2>
            {current.tempC != null && (
              <span className="reading text-base sm:text-lg text-water shrink-0">{current.tempC} °C</span>
            )}
          </div>

          {current.detail && (
            <p className="text-sm sm:text-base text-cave-200 leading-snug sm:leading-relaxed">{current.detail}</p>
          )}

          {current.durationMin > 0 && (
            <div
              className={`reading text-3xl sm:text-4xl tabular-nums font-bold tracking-tight ${
                left === null
                  ? 'text-cave-600'
                  : left > 60_000
                    ? 'text-cave-50'
                    : left > 0
                      ? 'text-ebc-straw'
                      : 'text-alert'
              }`}
              aria-live="polite"
            >
              {left === null ? `${current.durationMin}:00` : formatCountdown(left)}
            </div>
          )}

          {current.durationMin === 0 && (
            <p className="text-sm sm:text-base text-ebc-straw">Geste immédiat — pas de minuteur.</p>
          )}

          {left !== null && left <= 0 && (
            <p className="text-xs sm:text-sm text-alert font-medium">
              Échéance dépassée{current.hopNames?.length ? ' — houblon à ajouter.' : '.'}
            </p>
          )}

          {!soundOn && (
            <p className="text-xs sm:text-sm text-cave-600 leading-snug">
              Les alarmes sont muettes. Démarrer une étape les active — le navigateur
              exige un appui pour autoriser le son.
            </p>
          )}

          {/*
            --- Le pH de maische, et quoi en faire --------------------------

            Placé DANS l'étape en cours, pas dans les relevés : c'est là que le
            brasseur regarde, minuteur sous les yeux. Tant qu'aucun pH n'est
            relevé, l'encadré rappelle simplement le geste ; dès qu'il l'est, il
            dit s'il faut verser, et combien.
          */}
          {enMaische && recipe?.waterPlan && (
            <div className="rounded-control bg-cave-950/70 border border-cave-800 p-2.5 space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs sm:text-sm text-cave-400">
                  pH de maische — cible {MASH_PH_BAND.min}–{MASH_PH_BAND.max}
                </span>
                {lastPh && (
                  <span
                    className={`reading text-base sm:text-lg font-bold shrink-0 ${
                      lastPh.value > MASH_PH_BAND.max || lastPh.value < MASH_PH_BAND.min
                        ? 'text-ebc-amber'
                        : 'text-hop'
                    }`}
                  >
                    {lastPh.value.toFixed(2)}
                  </span>
                )}
              </div>

              {!lastPh ? (
                <p className="text-xs sm:text-sm text-cave-500 leading-snug">
                  Mesure dix à quinze minutes après l’empâtage, puis enregistre-la en relevé
                  « pH » : la dose d’acide à rattraper se calcule ici.
                </p>
              ) : !mashPhFix?.known ? (
                /* Même règle que dans l'atelier : sans rapport eau/grain, on ne
                   chiffre pas une dose d'acide sur une épaisseur inventée. */
                <p className="text-xs sm:text-sm text-cave-500 leading-snug">
                  La correction demande le volume d’empâtage et la facture de grain du plan
                  d’eau — ils manquent sur ce brassin.
                </p>
              ) : mashPhFix.amount > 0 ? (
                <p className="text-xs sm:text-sm text-cave-200 leading-snug">
                  Au-dessus de la fenêtre — ajoute{' '}
                  <span className="reading text-ebc-straw font-semibold">
                    {mashPhFix.amount} {mashPhFix.unit}
                  </span>{' '}
                  d’{mashPhFix.name.charAt(0).toLowerCase()}
                  {mashPhFix.name.slice(1)}, brasse, puis remesure.{' '}
                  <span className="text-cave-500">
                    En plus de ce qui est déjà dans la cuve — la mesure en tient compte.
                  </span>
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-hop leading-snug">
                  {lastPh.value < MASH_PH_BAND.min
                    ? 'Sous la fenêtre : cette maische est déjà acide, n’ajoute rien.'
                    : 'Dans la fenêtre : rien à ajouter.'}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* --- Relevés ------------------------------------------------------ */}
      <Section
        title="Relevés"
        hint="Horodatés à la saisie. C’est l’écart entre le visé et le mesuré qui informe."
      >
        <div className="space-y-2 sm:space-y-3">
          <SegmentedControl
            label="Type de relevé"
            value={readingKind}
            onChange={setReadingKind}
            options={[
              { value: 'densite', label: 'Densité' },
              { value: 'volume', label: 'Volume' },
              { value: 'ph', label: 'pH' },
              { value: 'temperature', label: 'Temp.' }
            ]}
          />

          <div className="space-y-1.5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="decimal"
                  enterKeyHint="done"
                  name="brewday_reading_val"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  placeholder={
                    readingKind === 'densite'
                      ? '1.061'
                      : readingKind === 'ph'
                        ? '5.4'
                        : readingKind === 'volume'
                          ? '30'
                          : '67'
                  }
                  className={`${inputClass} reading text-base pr-12`}
                  value={readingValue}
                  onChange={(e) => setReadingValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addReading();
                  }}
                />
                {READING_UNITS[readingKind] && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-cave-400 font-mono pointer-events-none">
                    {READING_UNITS[readingKind]}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={addReading}
                aria-label="Enregistrer le relevé"
                className="touch-target px-3.5 min-h-[40px] rounded-control bg-ebc-straw text-cave-950 font-semibold flex items-center justify-center gap-1.5 shrink-0 active:opacity-80"
              >
                <Plus className="w-4 h-4" />
                <span className="text-xs font-semibold">Ajouter</span>
              </button>
            </div>
            <input
              type="text"
              name="brewday_reading_note"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              className={`${inputClass} text-xs sm:text-sm`}
              placeholder="Note facultative (odeur, aspect, incident…)"
              value={readingNote}
              onChange={(e) => setReadingNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addReading();
              }}
            />
          </div>

          {(state.readings?.length ?? 0) > 0 && (
            <ul className="divide-y divide-cave-850">
              {[...(state.readings ?? [])].reverse().map((r, i) => (
                <li key={i} className="py-1.5 flex items-baseline gap-2 text-sm">
                  <span className="reading text-xs text-cave-500 shrink-0 w-11">
                    {new Date(r.at).toLocaleTimeString('fr-CH', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    <span className="text-sm text-cave-100">
                      {r.kind === 'densite'
                        ? 'Densité'
                        : r.kind === 'ph'
                          ? 'pH'
                          : r.kind === 'volume'
                            ? 'Volume'
                            : 'Température'}
                    </span>
                    {r.note && <span className="text-xs text-cave-500 ml-1.5 truncate">({r.note})</span>}
                  </span>
                  <span className="reading text-sm sm:text-base shrink-0 font-medium">
                    {r.value} {r.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {efficiency && (
            <div className="panel p-2.5 space-y-0.5 text-xs sm:text-sm">
              <p className="text-cave-500">
                Densité visée {ogTarget.toFixed(3)} · mesurée {lastGravity?.value.toFixed(3)}
              </p>
              <p
                className={`reading text-base sm:text-lg ${
                  Math.abs(efficiency.deltaPoints) <= 2 ? 'text-hop' : 'text-ebc-amber'
                }`}
              >
                {efficiency.deltaPoints >= 0 ? '+' : ''}
                {efficiency.deltaPoints} points · {efficiency.realEfficiencyPct} % d’efficacité réelle
              </p>
              <p className="text-cave-400 leading-snug">{efficiency.verdict}</p>
            </div>
          )}
        </div>
      </Section>

      {/* --- Le déroulé complet ------------------------------------------- */}
      <Section title="Déroulé" hint="Toutes les étapes, pour savoir ce qui vient.">
        <ol className="divide-y divide-cave-850">
          {state.steps.map((s: BrewDayStep, i) => {
            const isCurrent = i === state.currentIndex;
            const isDone = Boolean(s.doneAt);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => persist({ ...state, currentIndex: i })}
                  className={`w-full py-1.5 sm:py-2 flex items-baseline gap-2.5 text-left ${
                    isCurrent ? 'text-cave-50' : isDone ? 'text-cave-600' : 'text-cave-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                      isDone ? 'bg-hop' : isCurrent ? 'bg-ebc-straw' : 'bg-cave-700'
                    }`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm sm:text-base truncate ${isDone ? 'line-through' : ''}`}>
                      {s.label}
                    </span>
                    {s.detail && (
                      <span className="block text-xs text-cave-600 truncate">{s.detail}</span>
                    )}
                  </span>
                  <span className="reading text-xs sm:text-sm text-cave-500 shrink-0">
                    {s.durationMin > 0 ? `${s.durationMin} min` : '—'}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </Section>

      {/* --- Houblonnage à cru : après le brassage, rappelé ici ----------- */}
      {ingredients.hops.some((h) => h.stage === 'dryHop') && (
        <Section
          title="Houblonnage à cru"
          hint="En fermenteur, les jours suivants — pas aujourd’hui."
        >
          <ul className="divide-y divide-cave-850">
            {ingredients.hops
              .filter((h) => h.stage === 'dryHop')
              .sort((a, b) => (a.dayOffset ?? 0) - (b.dayOffset ?? 0))
              .map((h, i) => (
                <li key={i} className="py-1.5 flex items-baseline gap-2">
                  <span className="reading text-xs text-hop shrink-0 w-10">
                    J+{h.dayOffset ?? 0}
                  </span>
                  <span className="min-w-0 flex-1 text-sm text-cave-100 truncate">{h.name}</span>
                  <span className="reading text-sm shrink-0">
                    {Units.format(h.weightG, 'g')}
                  </span>
                </li>
              ))}
          </ul>
        </Section>
      )}

      <ConfirmSheet
        open={confirmFinish}
        onClose={() => setConfirmFinish(false)}
        title="Clôturer le brassage ?"
        what={`${batch.id} — ${batch.name}`}
        consequence={`Les ingrédients de la recette sortent du stock, le brassin passe en fermentation${
          lastGravity ? `, et l’OG est enregistrée à ${lastGravity.value.toFixed(3)}` : ''
        }. Le déstockage est journalisé et reste annulable depuis le brassin.`}
        confirmLabel="Clôturer et déstocker"
        onConfirm={() => {
          setConfirmFinish(false);
          void releaseScreen();
          onFinish({
            ...batch,
            brewDay: { ...state, finishedAt: Date.now() },
            og: lastGravity ? lastGravity.value.toFixed(3) : batch.og,
            volumeBrewedL:
              [...(state.readings ?? [])].reverse().find((r) => r.kind === 'volume')?.value ??
              batch.volumeBrewedL,
            status: 'fermentation'
          });
        }}
      />
    </PageShell>
  );
};
