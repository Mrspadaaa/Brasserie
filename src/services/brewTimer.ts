import { Recipe, RecipeSnapshot, BrewDayStep, SaltId } from '../types';
import { SALTS, ACIDS } from '../domain/water';
import { HOP_STAGE, groupByStage, describeMoment } from '../domain/hopStage';
import { Units } from '../services/units';
import { BREW_ALARM_VIBRATION, scheduleBrewAlarm } from './brewSound';

/**
 * Le déroulé minuté du jour de brassage.
 *
 * Trois exigences dictent la conception, et chacune vient de la cuverie :
 *
 * 1. **L'heure murale fait foi.** On ancre chaque étape sur `Date.now()` plutôt
 *    que d'accumuler des `setInterval`. Un onglet en arrière-plan voit ses
 *    minuteries ralenties par le navigateur, et un écran verrouillé les
 *    suspend : un compteur incrémental dériverait de plusieurs minutes sur une
 *    ébullition de 75 minutes. Ancré à l'horloge, il reste juste même après un
 *    rechargement.
 *
 * 2. **Le son doit être armé par un geste.** iOS refuse de jouer un son que
 *    l'utilisateur n'a pas déclenché. On crée donc le contexte audio au premier
 *    appui — sinon l'alarme du houblon d'amérisation ne sonnerait jamais, et on
 *    ne s'en apercevrait qu'à la fin de l'ébullition.
 *
 * 3. **L'écran doit rester allumé.** Les mains sont dans la cuve ; on ne
 *    déverrouille pas un téléphone toutes les trente secondes.
 */

// --- Construction du déroulé -------------------------------------------------

/**
 * Traduit une recette en suite d'étapes minutées.
 *
 * Les ajouts de houblon sont posés à leur minute réelle : un houblon à 15 min
 * d'une ébullition de 75 min tombe 60 minutes après le début. Le houblonnage à
 * cru n'apparaît PAS ici — il a lieu en fermenteur, plusieurs jours plus tard.
 */
export function buildTimeline(recipe: Recipe | RecipeSnapshot): BrewDayStep[] {
  const steps: BrewDayStep[] = [];
  const boilMin = Math.max(0, recipe.boilMin ?? 60);
  const mash = recipe.mash;

  // Le concassage ne concerne que le GRAIN : le sucre et le lactose ne se
  // moulent pas, et les compter gonflerait la masse annoncée à la balance.
  const grains = (recipe.fermentables ?? []).filter((f) => f.kind === 'grain');
  const grist = grains.reduce((s, f) => s + f.weightKg, 0);
  /*
   * ⚠️ Le volume d'empâtage se LIT dans le plan d'eau, il ne se recalcule pas.
   * Le reconstruire depuis `ratioLPerKg`, arrondi au dixième, donnait jusqu'à
   * 0.3 L d'écart avec le volume sur lequel les sels et l'acide ont été dosés.
   * Deux chiffres différents pour la même eau, à deux étapes de la journée.
   */
  const mashWaterL =
    recipe.waterPlan?.mashWaterL ||
    (mash?.ratioLPerKg ? Math.round(grist * mash.ratioLPerKg * 10) / 10 : null);

  // L'eau est pesée AVANT le concassage : les sels de l'empâtage se dissolvent
  // pendant que l'eau chauffe, ceux du rinçage attendent leur tour.
  const plan = recipe.waterPlan;
  const doseLine = (doses: Partial<Record<SaltId, number>> | undefined) =>
    Object.entries(doses ?? {})
      .filter(([, g]) => (g ?? 0) > 0)
      .map(([id, g]) => `${SALTS[id as SaltId].name} ${g} g`)
      .join(' · ');

  steps.push({
    id: 'eau',
    label: 'Eau et sels',
    detail: plan
      ? (() => {
          const mashL = plan.mashWaterL ?? 0;
          const spargeL = plan.spargeWaterL ?? 0;
          const mashDi = plan.diRatioPct ?? 0;
          const spargeDi = plan.spargeDiRatioPct ?? mashDi;

          const mashOsmoseL = Math.round((mashL * mashDi) / 10) / 10;
          const mashReseauL = Math.round((mashL - mashOsmoseL) * 10) / 10;
          const spargeOsmoseL = Math.round((spargeL * spargeDi) / 10) / 10;
          const spargeReseauL = Math.round((spargeL - spargeOsmoseL) * 10) / 10;
          const totalOsmoseL = Math.round((mashOsmoseL + spargeOsmoseL) * 10) / 10;

          const mashWaterDesc =
            mashL > 0
              ? mashDi > 0
                ? `empâtage ${mashL} L (${mashReseauL} L réseau + ${mashOsmoseL} L osmosée)`
                : `empâtage ${mashL} L`
              : '';

          const spargeWaterDesc =
            spargeL > 0
              ? spargeDi > 0
                ? `rinçage ${spargeL} L (${spargeReseauL} L réseau + ${spargeOsmoseL} L osmosée)`
                : `rinçage ${spargeL} L`
              : '';

          const globalOsmose = totalOsmoseL > 0 ? `Total osmosée : ${totalOsmoseL} L` : '';

          return [
            globalOsmose || (mashDi > 0 ? `${mashDi} % d’osmosée` : ''),
            mashWaterDesc ? `${mashWaterDesc} : ${doseLine(plan.mash) || 'aucun sel'}` : '',
            plan.acid && plan.acid.mash > 0
              ? `acidifier l’empâtage : ${plan.acid.mash} ${ACIDS[plan.acid.id].unit} de ${ACIDS[plan.acid.id].name}`
              : '',
            spargeWaterDesc ? `${spargeWaterDesc} : ${doseLine(plan.sparge) || 'aucun sel'}` : '',
            plan.acid && plan.acid.sparge > 0
              ? `acidifier le rinçage : ${plan.acid.sparge} ${ACIDS[plan.acid.id].unit}`
              : ''
          ]
            .filter(Boolean)
            .join(' — ');
        })()
      : recipe.water
        ? `${recipe.water.diRatioPct} % d’osmosée · gypse ${recipe.water.salts.gypseG} g · CaCl₂ ${recipe.water.salts.cacl2G} g · acide ${recipe.water.salts.acidLacticMl} mL`
        : 'Préparer et traiter l’eau de brassage.',
    durationMin: 0
  });

  steps.push({
    id: 'concassage',
    label: 'Concassage',
    detail:
      grist > 0
        ? `${Units.format(grist, 'kg')} de grain — ${grains
            .map((m) => `${m.name} ${Units.format(m.weightKg, 'kg')}`)
            .join(' · ')}`
        : undefined,
    durationMin: 0
  });

  (mash?.steps ?? [{ name: 'Empâtage', tempC: 67, durationMin: 60 }]).forEach((s, i) => {
    steps.push({
      id: `mash-${i}`,
      label: s.name,
      detail: mashWaterL ? `${mashWaterL} L d’eau d’empâtage` : undefined,
      durationMin: s.durationMin,
      tempC: s.tempC
    });
  });

  if (
    mash?.mashoutTempC &&
    !mash.steps?.some(
      (s) => Math.abs(s.tempC - mash.mashoutTempC!) < 0.5 && /mash.?out/i.test(s.name)
    )
  ) {
    steps.push({
      id: 'mashout',
      label: 'Mashout',
      detail: 'Monter en température pour arrêter l’activité enzymatique.',
      durationMin: mash.mashoutDurationMin ?? 10,
      tempC: mash.mashoutTempC
    });
  }

  const byStage = groupByStage(recipe.hops ?? []);
  const firstWort = byStage.find((g) => g.stage === 'firstWort')?.hops ?? [];
  const boilHops = byStage.find((g) => g.stage === 'boil')?.hops ?? [];
  const whirlpool = byStage.find((g) => g.stage === 'whirlpool')?.hops ?? [];
  if (firstWort.length)
    steps.push({
      id: 'fwh',
      label: HOP_STAGE.firstWort.label,
      detail: `Dans la cuve, avant de recueillir le premier moût : ${firstWort.map((h) => `${h.name} ${Units.format(h.weightG, 'g')}`).join(' · ')}`,
      durationMin: 0,
      hopNames: firstWort.map((h) => h.name)
    });

  if (mash?.spargeType && mash.spargeType !== 'none') {
    steps.push({
      id: 'sparge',
      label: mash.spargeType === 'fly' ? 'Rinçage continu' : 'Rinçage par bacs',
      detail: plan?.spargeWaterL ? `${plan.spargeWaterL} L d’eau de rinçage` : undefined,
      durationMin: 0,
      tempC: mash.spargeTempC ?? 76
    });
  }

  /*
   * ⚠️ LE CONTRÔLE DE VOLUME AVANT ÉBULLITION — il manquait.
   *
   * C'est la mesure la plus utile de la journée : elle dit d'un coup si le
   * rinçage a été suffisant et si le rendement est au rendez-vous, à un moment
   * où l'on peut ENCORE corriger (rincer un peu plus, allonger l'ébullition).
   * Le déroulé passait de l'empâtage à l'ébullition sans jamais demander de
   * regarder la cuve, alors que tout le calcul d'eau vise ce volume-là.
   */
  const preBoilL =
    recipe.preBoilL ??
    (plan?.mashWaterL && grist > 0
      ? Math.round((plan.mashWaterL - grist * 0.96 + (plan.spargeWaterL ?? 0)) * 10) / 10
      : null);

  if (preBoilL && preBoilL > 0) {
    steps.push({
      id: 'preboil',
      label: 'Contrôle avant ébullition',
      detail: `Environ ${preBoilL} L ${recipe.preBoilHotL != null ? `à froid, soit ≈ ${recipe.preBoilHotL} L à ébullition` : 'collectés'}. Relève le volume et la densité : c’est ici qu’un rinçage court ou un rendement bas se rattrape encore.`,
      durationMin: 0
    });
  }

  // --- Ébullition, découpée aux ajouts de houblon ---------------------------

  /*
   * Les houblons d'ébullition se comptent EN MINUTES AVANT LA FIN. On les
   * convertit en minutes écoulées depuis le début, on les regroupe par instant
   * — deux houblons à 15 min sont un seul geste — et on découpe l'ébullition en
   * segments entre chaque ajout. C'est ce découpage qui permet une alarme par
   * ajout plutôt qu'un seul minuteur de 75 minutes.
   */
  const additions = new Map<number, string[]>();
  boilHops.forEach((h) => {
    const elapsed = Math.min(boilMin, Math.max(0, boilMin - (h.timeMin ?? 0)));
    const list = additions.get(elapsed) ?? [];
    list.push(`${h.name} ${Units.format(h.weightG, 'g')} (${describeMoment(h)})`);
    additions.set(elapsed, list);
  });

  const boilAdditions = (recipe.fermentables ?? []).filter(
    (f) => f.use === 'ebullition' && f.weightKg > 0
  );
  const sugarMark = Math.max(0, boilMin - 10);
  const marks = [
    ...new Set([...additions.keys(), ...(boilAdditions.length ? [sugarMark] : [])])
  ].sort((a, b) => a - b);
  let cursor = 0;

  marks.forEach((mark, i) => {
    if (mark > cursor) {
      const minutesLeft = boilMin - mark;
      steps.push({
        id: `boil-${i}`,
        label: cursor === 0 ? 'Ébullition' : 'Ébullition (suite)',
        detail:
          minutesLeft === 0
            ? 'Jusqu’à la fin de l’ébullition.'
            : `Jusqu’à l’ajout suivant, à ${minutesLeft} min de la fin.`,
        durationMin: mark - cursor,
        boilElapsedMin: cursor
      });
      cursor = mark;
    }
    if (additions.has(mark))
      steps.push({
        id: `hop-${mark}`,
        label: `Houblon à ${boilMin - mark} min`,
        detail: (additions.get(mark) ?? []).join(' · '),
        durationMin: 0,
        hopNames: additions.get(mark),
        boilElapsedMin: mark
      });
    if (boilAdditions.length && mark === sugarMark)
      steps.push({
        id: 'sucres',
        label: `Sucres — ${boilMin - mark} dernières minutes`,
        detail: `${boilAdditions.map((f) => `${f.name} ${Units.format(f.weightKg, 'kg')}`).join(' · ')} — baisser le feu et remuer pour dissoudre.`,
        durationMin: 0,
        boilElapsedMin: mark
      });
  });

  if (cursor < boilMin) {
    steps.push({
      id: 'boil-fin',
      label: cursor === 0 ? 'Ébullition' : 'Fin d’ébullition',
      durationMin: boilMin - cursor,
      boilElapsedMin: cursor
    });
  }

  if (whirlpool.length > 0) {
    const contact = Math.max(...whirlpool.map((h) => h.timeMin ?? 20));
    steps.push({
      id: 'whirlpool',
      label: HOP_STAGE.whirlpool.label,
      detail: whirlpool
        .map((h) => `${h.name} ${Units.format(h.weightG, 'g')} (${describeMoment(h)})`)
        .join(' · '),
      durationMin: contact,
      tempC: whirlpool.find((h) => h.tempC)?.tempC,
      hopNames: whirlpool.map((h) => h.name)
    });
  }

  steps.push({
    id: 'refroidissement',
    label: 'Refroidissement',
    detail: recipe.yeast?.pitchTempC
      ? `Descendre à ${recipe.yeast.pitchTempC} °C avant d’ensemencer.`
      : 'Descendre à la température d’ensemencement.',
    durationMin: 0,
    tempC: recipe.yeast?.pitchTempC
  });

  steps.push({
    id: 'ensemencement',
    label: 'Ensemencement',
    detail: recipe.yeast?.name
      ? `${recipe.yeast.name} — ${recipe.yeast.qty} ${recipe.yeast.unit}${recipe.yeast.qty > 1 ? 's' : ''}`
      : undefined,
    durationMin: 0,
    tempC: recipe.yeast?.pitchTempC
  });

  return steps;
}

// --- Décompte ----------------------------------------------------------------

/** Millisecondes restantes sur une étape démarrée. Négatif = dépassement. */
export function remainingMs(step: BrewDayStep, now: number): number | null {
  // `== null` et non `!startedAt` : une étape démarrée est reconnue à ce que
  // l'horodatage EXISTE, pas à ce qu'il soit non nul.
  if (step.startedAt == null || step.durationMin <= 0) return null;
  return step.startedAt + step.durationMin * 60_000 - (step.pausedAt ?? now);
}

/** « 12:04 », « −00:38 » quand l'étape est dépassée. */
export function formatCountdown(ms: number): string {
  if (!Number.isFinite(ms)) return '—';
  const negative = ms < 0;
  const total = Math.floor(Math.abs(ms) / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m >= 60)
    return `${negative ? '−' : ''}${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
  return `${negative ? '−' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// --- Son ---------------------------------------------------------------------

let audioContext: AudioContext | null = null;
let stopAlarmAudio: (() => void) | null = null;

/**
 * Arme le son. À appeler depuis un vrai geste de l'utilisateur — un appui sur
 * « Démarrer » —, sinon iOS et Safari refusent toute lecture ultérieure.
 */
export function armAudio(): boolean {
  if (audioContext?.state === 'closed') audioContext = null;
  if (audioContext) {
    void audioContext.resume().catch(() => {});
    return true;
  }
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return false;
    audioContext = new Ctor();
    // Un contexte créé hors geste naît « suspended » : on le réveille tout de suite.
    void audioContext.resume().catch(() => {});
    return true;
  } catch {
    return false;
  }
}

export function isAudioArmed(): boolean {
  return audioContext !== null;
}

/** Une seule sonnerie à la fois, même si plusieurs ajouts tombent ensemble. */
export function playBrewAlarm(): boolean {
  if (!audioContext || audioContext.state === 'closed') return false;
  stopBrewAlarm();
  try {
    void audioContext.resume().catch(() => {});
    stopAlarmAudio = scheduleBrewAlarm(audioContext);
    try {
      navigator.vibrate?.(BREW_ALARM_VIBRATION);
    } catch {
      /* Optionnel selon l'appareil. */
    }
    return true;
  } catch {
    stopBrewAlarm();
    return false;
  }
}

export function stopBrewAlarm(): void {
  stopAlarmAudio?.();
  stopAlarmAudio = null;
  try {
    navigator.vibrate?.(0);
  } catch {
    /* Aucun vibreur ou contexte déjà fermé. */
  }
}

/** Confirmation brève d’activation du son ; les échéances utilisent playBrewAlarm. */
export function beep(times = 3): void {
  if (!audioContext) return;
  const ctx = audioContext;
  void ctx.resume().catch(() => {});

  for (let i = 0; i < times; i += 1) {
    const at = ctx.currentTime + i * 0.28;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.22, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.22);
  }
}

// --- Écran allumé ------------------------------------------------------------

type WakeLockSentinelLike = { release: () => Promise<void> };
let wakeLock: WakeLockSentinelLike | null = null;

/** Empêche l'écran de s'éteindre. Renvoie `false` si le navigateur ne sait pas. */
export async function keepScreenAwake(): Promise<boolean> {
  const nav = navigator as Navigator & {
    wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
  };
  if (!nav.wakeLock) return false;
  try {
    wakeLock = await nav.wakeLock.request('screen');
    return true;
  } catch {
    return false;
  }
}

export async function releaseScreen(): Promise<void> {
  try {
    await wakeLock?.release();
  } catch {
    /* l'écran se rendormira de lui-même */
  }
  wakeLock = null;
}
