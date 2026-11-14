import { BrewDayReading, BrewDayState, BrewDayStep, RecipeSnapshot } from '../types';
import { GRAVITY_CEILING, GRAVITY_FLOOR } from './gravityBounds';
import { nombreFr } from '../domain/nombreAffiche';

export type ReadingKind = BrewDayReading['kind'];
export const brewAdviceKey = (s: BrewDayState) =>
  JSON.stringify([
    s.steps[s.currentIndex],
    s.readings,
    s.notes,
    s.acidCorrections,
    s.mashContext,
    s.boilDurationMin,
    s.boilStartedAt,
    s.boilFinishedAt,
    s.thermalChoices,
    s.thermalSegments,
    s.transferredAt,
    s.pitchedAt,
    s.pitchQuantityConfirmation
  ]);
/**
 * Bornes d'une mesure à la cuve : au-delà, ce n'est plus une mesure mais une faute de frappe (AM-41, AM-43, 08.11 : pH 0,1 à 14, 120 °C, 100 000 L).
 * pH : moût et maische 5 à 6, eau alcaline jusqu'à ~9, moût acidifié (kettle sour) ~3 ; hors de 3 à 9, aucune cuve de brasserie.
 * Température : de la cave froide (−5 °C, glycol) à l'ébullition (100 °C, 105 °C de marge pour l'altitude et la sonde).
 * Densité : celles de `gravityBounds` (0,990 à 1,200), une seule table.
 * Volume : 2 000 L, qu'aucune micro-brasserie ne dépasse ; la capacité réelle de la cuve ou du fermenteur se vérifie à part (`readingFeedback`).
 */
export const READING = {
  ph: { label: 'pH', unit: '', min: 3, max: 9, placeholder: '5,4' },
  temperature: {
    label: 'Température',
    unit: '°C',
    min: -5,
    max: 105,
    placeholder: '67'
  },
  densite: {
    label: 'Densité',
    unit: 'SG',
    min: GRAVITY_FLOOR,
    max: GRAVITY_CEILING,
    placeholder: '1,056'
  },
  volume: {
    label: 'Volume',
    unit: 'L',
    min: 0.1,
    max: 2000,
    placeholder: '25'
  }
} as const;
export const isMash = (id = '') => /^mash/.test(id);
/**
 * Lot F (14) : la clôture ne dit « Quantité mesurée » que pour une masse ou un volume pesé. « 1 sachet » est un toucher (une levure sèche sans
 * dose prévue) : rien n'a été pesé, la phrase le dit. `quantite` : la quantité déjà écrite (« 1 sachet », « 11,5 g »).
 */
const UNITES_DE_COMPTAGE = ['sachet', 'sachets', 'pastille', 'pastilles', 'tube', 'tubes', 'flacon', 'flacons', 'pack', 'packs', 'pièce', 'pièces'];
export function phraseQuantiteLevure(quantite: string, amount: number, unit: string, dosePrevue: string): string {
  const compte = UNITES_DE_COMPTAGE.includes(unit.trim().toLowerCase());
  return compte
    ? `${quantite} ${amount > 1 ? 'choisis, non pesés' : 'choisi, non pesé'} · ${dosePrevue}.`
    : `Quantité mesurée : ${quantite} · ${dosePrevue}.`;
}
export const isFinalWort =(id = '') => ['refroidissement', 'ensemencement'].includes(id);
export const readingKey = (r: BrewDayReading) => r.id ?? `${r.at}-${r.kind}-${r.stepId ?? ''}`;
export const defaultReading = (s?: BrewDayStep): ReadingKind =>
  isMash(s?.id)
    ? s?.tempC != null && s.tempC >= 75
      ? 'temperature'
      : 'ph'
    : s?.id === 'preboil' || s?.id === 'ensemencement'
      ? 'densite'
      : s?.tempC
        ? 'temperature'
        : 'volume';

/**
 * La case « refroidie ou corrigée » d'une mesure. Un relevé déjà au journal garde son choix (décochable, et son refus se respecte) ;
 * sans relevé, la densité à l'ensemencement est cochée d'office : à ce moment le moût est à la température d'ensemencement.
 */
export function refroidiParDefaut(kind: ReadingKind, stepId: string | undefined, deja?: boolean): boolean {
  if (deja !== undefined) return deja === true;
  return kind === 'densite' && stepId === 'ensemencement';
}

/** Une chaîne complète, jamais parseFloat('5.7abc'). Accepte SG et points (1056). */
export function parseReading(raw: string, kind: ReadingKind): number | null {
  const str = raw.trim().replace(',', '.');
  if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(str)) return null;
  let n = Number(str);
  if (kind === 'densite' && n >= GRAVITY_FLOOR * 1000 && n <= GRAVITY_CEILING * 1000) n /= 1000;
  return Number.isFinite(n) && n >= READING[kind].min && n <= READING[kind].max ? n : null;
}

/** Une densité s'écrit « 1,069 » à l'écran, trois décimales, virgule (BR-29, 08.11 : « Cible 1.069 »). */
export const sg = (n: number) => n.toFixed(3).replace('.', ',');

/** Au-delà, la levure ne survit pas à l'ensemencement (AM-43). */
export const PITCH_TEMPERATURE_MAX_C = 30;

/** Le récipient qui contient le moût à cette étape, avec sa capacité : cuve avant le transfert, fermenteur à l'ensemencement. `null` si l'installation ne la dit pas. */
export function vesselOfStep(stepId: string, recipe?: RecipeSnapshot): { label: string; capacityL: number } | null {
  const e = recipe?.brewhouse?.equipment;
  if (!e) return null;
  const ok = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
  if (stepId === 'ensemencement') return ok(e.fermenterCapacityL) ? { label: 'le fermenteur', capacityL: e.fermenterCapacityL } : null;
  return ok(e.kettleCapacityL) ? { label: 'la cuve', capacityL: e.kettleCapacityL } : null;
}

export interface ReadingFeedback {
  tone: 'ok' | 'watch' | 'neutral';
  title: string;
  detail: string;
  /** Vrai quand le verdict est celui de la bande de cible (`cibleMesure`) : la feuille Mesurer l'écrit alors elle-même, avec les mêmes nombres. */
  bande?: boolean;
}

/** La bande de cible d'une mesure : pH 5,2–5,5, consigne ± 1 °C, OG ± 2 points, volume ± 5 %. */
export interface CibleMesure {
  min: number;
  max: number;
}
const fini = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/**
 * Densité visée juste avant l'ébullition, par conservation des points de densité (méthode de BeerSmith et de Brewfather) :
 * `1 + (OG − 1) × V_après / V_avant`. V_avant est le volume de moût avant l'ébullition, V_après ce qu'il en reste quand l'évaporation
 * (L/h de l'installation × durée de l'ébullition) est partie ; les deux « à chaud », leur rapport est le même à froid.
 * Une donnée manque (OG, durée, évaporation, volume avant) : `undefined`, jamais une cible devinée.
 */
export function densiteAvantEbullition(recipe?: RecipeSnapshot): number | undefined {
  const og = recipe?.ogTarget;
  const e = recipe?.brewhouse?.equipment;
  if (!fini(og) || og <= 1 || !e || !fini(e.boilOffLPerHour) || e.boilOffLPerHour < 0 || !fini(recipe?.boilMin) || recipe!.boilMin! <= 0)
    return undefined;
  const shrink = e.coolingShrinkagePct;
  const avant = fini(recipe?.preBoilHotL) && recipe!.preBoilHotL! > 0
    ? recipe!.preBoilHotL!
    : fini(recipe?.preBoilL) && recipe!.preBoilL! > 0 && fini(shrink) && shrink >= 0 && shrink < 20
      ? recipe!.preBoilL! / (1 - shrink / 100)
      : undefined;
  if (avant == null) return undefined;
  const apres = avant - (e.boilOffLPerHour * recipe!.boilMin!) / 60;
  if (apres <= 0) return undefined;
  return Math.round((1 + (og - 1) * (apres / avant)) * 1000) / 1000;
}

/**
 * LA cible d'une mesure, une seule fois : la feuille Mesurer, les Relevés du jour et la clôture la lisent ici (n° 2 de a1 : trois
 * lectures donnaient « +0,5 », « +1,5 » et « +3 points » pour un même relevé). `null` : la recette ne donne pas de cible, aucune n'est inventée.
 */
export function cibleMesure(kind: ReadingKind, step: BrewDayStep, recipe?: RecipeSnapshot): CibleMesure | null {
  if (kind === 'ph') return isMash(step.id) ? { min: 5.2, max: 5.5 } : null;
  if (kind === 'temperature') return step.tempC != null ? { min: step.tempC - 1, max: step.tempC + 1 } : null;
  if (kind === 'densite') {
    const t = isFinalWort(step.id)
      ? recipe?.ogTarget && recipe.ogTarget > 1 ? recipe.ogTarget : undefined
      : step.id === 'preboil' ? densiteAvantEbullition(recipe) : undefined;
    return t ? { min: t - 0.002, max: t + 0.002 } : null;
  }
  const v = volumeTarget(step, recipe);
  return v && v > 0 ? { min: v * 0.95, max: v * 1.05 } : null;
}

/** L'écart à la borne la plus proche (« +0,5 », « −0,3 »), ou `null` dans la bande (une tolérance de 1e-9 : 1,064 − 1,063 n'est pas un flottant). */
export function ecartHorsCible(cible: CibleMesure | null, valeur: number): number | null {
  if (!cible) return null;
  if (valeur > cible.max + 1e-9) return valeur - cible.max;
  if (valeur < cible.min - 1e-9) return valeur - cible.min;
  return null;
}

/** Les nombres d'une cible à l'écran : virgule, la décimale que la grandeur porte. */
export function formatCible(kind: ReadingKind, n: number): string {
  return kind === 'densite' ? sg(n) : kind === 'ph' ? n.toFixed(1).replace('.', ',') : nombreFr(n, 1);
}
const uniteCible = (kind: ReadingKind) => (READING[kind].unit ? ` ${READING[kind].unit}` : '');
export const texteBande = (kind: ReadingKind, c: CibleMesure) => `${formatCible(kind, c.min)}–${formatCible(kind, c.max)}${uniteCible(kind)}`;
/** « +0,5 au-dessus de la cible 75–77 °C » : la phrase d'écart, la même sur la feuille, dans les Relevés et à la clôture. */
export function phraseEcart(kind: ReadingKind, ecart: number, cible: CibleMesure): string {
  return `${ecart > 0 ? '+' : '−'}${formatCible(kind, Math.abs(ecart))} ${ecart > 0 ? 'au-dessus de' : 'sous'} la cible ${texteBande(kind, cible)}`;
}
/** Même retour pour la saisie et le résumé : un pH ancien ou à chaud ne devient pas valide en fermant le formulaire. */
export function measuredReadingFeedback(
  reading: BrewDayReading,
  state: BrewDayState,
  step: BrewDayStep,
  recipe?: RecipeSnapshot
): ReadingFeedback {
  if (reading.kind === 'ph' && isMash(step.id)) {
    if (state.acidCorrections?.some((c) => c.at >= reading.at))
      return {
        tone: 'neutral',
        title: `pH précédent : ${String(reading.value).replace('.', ',')} · à remesurer`,
        detail: ''
      };
    if (!reading.roomTemp)
      return {
        tone: 'neutral',
        title: `pH ${String(reading.value).replace('.', ',')} · à confirmer à froid`,
        detail: 'La cible 5,2–5,5 concerne un échantillon à 20–25 °C.'
      };
  }
  return readingFeedback(reading.kind, reading.value, step, recipe);
}
/** Le volume attendu à cette étape (fermenteur : volume de la recette ; avant ébullition : eau moins absorption), ou `undefined` : l'inconnu n'est pas 25 (TE-44). */
export function volumeTarget(step: BrewDayStep, recipe?: RecipeSnapshot): number | undefined {
  const plan = recipe?.waterPlan;
  const grain =
    recipe?.totalGristKg ??
    recipe?.fermentables
      ?.filter((f) => f.kind === 'grain')
      .reduce((sum, f) => sum + f.weightKg, 0) ??
    0;
  // Lot F (13) : la cible est celle de l'ÉTAPE, jamais le volume du fermenteur partout. L'eau d'empâtage à Eau et sels et Concassage ; le
  // volume avant ébullition du Premier moût à l'ébullition ; le fermenteur au refroidissement et à l'ensemencement. Ailleurs : rien.
  if (step.id === 'ensemencement' || step.id === 'refroidissement') return recipe?.volumeL;
  if (step.id === 'eau' || step.id === 'concassage') return plan?.mashWaterL && plan.mashWaterL > 0 ? plan.mashWaterL : undefined;
  if (step.id === 'preboil' || step.id === 'fwh' || /^boil-|^hop-/.test(step.id) || step.id === 'sucres') {
    if (recipe?.preBoilL) return recipe.preBoilL;
    return plan
      ? plan.mashWaterL + plan.spargeWaterL - grain * (recipe?.brewhouse?.equipment?.grainAbsorptionLPerKg ?? 0.96)
      : undefined;
  }
  return undefined;
}
export function readingFeedback(
  kind: ReadingKind,
  value: number,
  step: BrewDayStep,
  recipe?: RecipeSnapshot
): ReadingFeedback {
  if (kind === 'ph' && isMash(step.id)) {
    if (value < 5.2)
      return {
        tone: 'watch',
        title: 'Maische déjà acide',
        detail:
          'Ne rajoute pas d’acide. Vérifie l’étalonnage et confirme avec un nouvel échantillon refroidi.'
      };
    if (value <= 5.5)
      return {
        tone: 'ok',
        title: 'pH dans la cible · rien à ajouter',
        detail: 'Fenêtre de travail : 5,2–5,5 sur échantillon refroidi.'
      };
    return {
      tone: 'watch',
      title: 'Au-dessus de la fenêtre de pH',
      detail:
        'Une correction peut être utile. Le calcul ci-dessous part du pH mesuré et de ta maische.'
    };
  }
  // AM-43 : à l'ensemencement la levure meurt bien avant l'ébullition ; ale 18–24 °C, lager 8–14 °C, jamais au-delà de 30 °C.
  if (kind === 'temperature' && step.id === 'ensemencement' && value > PITCH_TEMPERATURE_MAX_C)
    return {
      tone: 'watch',
      title: `${nombreFr(Math.round(value * 10) / 10, 1)} °C : trop chaud pour la levure`,
      detail: `Au-dessus de ${nombreFr(PITCH_TEMPERATURE_MAX_C, 1)} °C la levure souffre ou meurt (ale 18–24 °C, lager 8–14 °C). Refroidis le moût avant d’ensemencer, ou vérifie la sonde.`
    };
  if (kind === 'temperature' && step.tempC != null) {
    const cible = cibleMesure('temperature', step, recipe)!;
    const ecart = ecartHorsCible(cible, value);
    return {
      tone: ecart == null ? 'ok' : 'watch',
      title: ecart == null ? `Dans la cible ${texteBande(kind, cible)}` : phraseEcart(kind, ecart, cible),
      bande: true,
      detail:
        ecart == null
          ? 'Température proche de la consigne.'
          : ecart > 0
            ? 'Refroidis progressivement et homogénéise avant de remesurer.'
            : step.startedAt != null
              ? 'Température sous la consigne. Homogénéise, ajuste doucement puis remesure.'
              : 'Température sous la consigne. Vérifie la sonde et ajuste avant de lancer le palier.'
    };
  }
  if (kind === 'densite') {
    const cible = cibleMesure('densite', step, recipe);
    if (cible) {
      const ecart = ecartHorsCible(cible, value);
      return {
        tone: ecart == null ? 'ok' : 'watch',
        title: ecart == null ? `Dans la cible ${texteBande(kind, cible)}` : phraseEcart(kind, ecart, cible),
        bande: true,
        detail:
          ecart == null
            ? 'Densité proche de la recette.'
            : 'Compare aussi le volume recueilli avant de décider d’une dilution ou d’une correction.'
      };
    }
    return {
      tone: 'neutral',
      title: `Densité ${sg(value)}`,
      detail: 'Ce relevé suit cette étape. L’OG sera la densité du moût refroidi, avant levure.'
    };
  }
  if (kind === 'volume') {
    // AM-42 : un volume plus grand que le récipient où il se trouve est une erreur (cuve, ou fermenteur après transfert).
    const vessel = vesselOfStep(step.id, recipe);
    if (vessel && value > vessel.capacityL)
      return {
        tone: 'watch',
        title: `${nombreFr(Math.round(value * 10) / 10, 1)} L : plus que ${vessel.label} (${nombreFr(vessel.capacityL, 1)} L)`,
        detail: `Ce volume ne tient pas dans ${vessel.label} du profil d’installation. Vérifie la saisie (des litres, pas des décilitres), ou corrige la capacité dans l’installation.`
      };
    const cible = cibleMesure('volume', step, recipe);
    if (cible) {
      const ecart = ecartHorsCible(cible, value);
      return {
        tone: ecart == null ? 'ok' : 'watch',
        title: ecart == null ? `Dans la cible ${texteBande(kind, cible)}` : phraseEcart(kind, ecart, cible),
        bande: true,
        detail:
          step.id === 'eau' || step.id === 'concassage'
            ? 'Eau d’empâtage prévue par le plan d’eau.'
            : isFinalWort(step.id)
              ? 'Volume en fermenteur, à comparer avec la densité.'
              : 'Repère eau moins absorption du grain ; le fond de cuve et le volume à chaud peuvent créer un écart.'
      };
    }
  }
  return {
    tone: 'neutral',
    title: `${READING[kind].label} : ${String(value).replace('.', ',')} ${READING[kind].unit}`,
    detail:
      kind === 'ph'
        ? 'pH hors empâtage : aucune dose d’acide de maische calculée.'
        : 'Relevé rattaché à cette étape.'
  };
}

/** Ne réécrit pas les étapes d'un brassage entamé. Ajoute seulement l'horloge commune. */
/**
 * Ce que le serveur peut recevoir : chaque ajout porte une quantité finie (functions/src/brewSessionCore.ts, « Quantité invalide »).
 * Un ajout sans quantité (levure cochée sans mesure, brouillon déjà stocké sur l'appareil) ne part pas : l'inconnu n'est ni envoyé ni mis à 0.
 * L'état local n'est pas modifié ; le serveur répond avec son état, qui remplace le brouillon.
 */
export function ajoutsEnvoyables(state: BrewDayState): BrewDayState {
  if (!state.additions) return state;
  const garde = Object.entries(state.additions).filter(([, a]) => a != null && Number.isFinite(a.amount));
  if (garde.length === Object.keys(state.additions).length) return state;
  return { ...state, additions: Object.fromEntries(garde) };
}

export function restoreBrewDay(state: BrewDayState): BrewDayState {
  let elapsed = 0;
  const steps = state.steps.map((s) => {
    if (!/^boil-|^hop-/.test(s.id)) return s;
    const next = { ...s, boilElapsedMin: s.boilElapsedMin ?? elapsed };
    if (s.id.startsWith('boil-')) elapsed = next.boilElapsedMin + s.durationMin;
    return next;
  });
  const running = steps.find((s) => s.boilElapsedMin != null && s.startedAt != null);
  return {
    ...state,
    steps,
    currentIndex: Math.max(0, Math.min(state.currentIndex, Math.max(0, steps.length - 1))),
    ...(state.boilStartedAt == null && running
      ? { boilStartedAt: running.startedAt! - running.boilElapsedMin! * 60000 }
      : {})
  };
}

export function startBrewStep(state: BrewDayState, now: number): BrewDayState {
  const s = state.steps[state.currentIndex];
  if (!s || s.doneAt != null || (s.startedAt != null && s.pausedAt == null)) return state;
  const boilStartedAt =
    s.boilElapsedMin != null
      ? (state.boilStartedAt ?? now - s.boilElapsedMin * 60000)
      : state.boilStartedAt;
  const next: BrewDayStep = {
    ...s,
    holdStartedAt: s.holdStartedAt ?? s.startedAt ?? now,
    startedAt:
      s.pausedAt != null
        ? s.startedAt! + now - s.pausedAt
        : s.boilElapsedMin != null
          ? boilStartedAt! + s.boilElapsedMin * 60000
          : now
  };
  delete next.pausedAt;
  return {
    ...state,
    startedAt: state.startedAt ?? now,
    ...(boilStartedAt != null ? { boilStartedAt } : {}),
    thermalSegments: state.thermalSegments?.map(segment => segment.stepId === s.id && segment.method === 'heating' && segment.endedAt == null
      ? { ...segment, endedAt: now } : segment),
    steps: state.steps.map((x, i) => (i === state.currentIndex ? next : x))
  };
}

export function completeBrewStep(state: BrewDayState, now: number): BrewDayState {
  const current = state.steps[state.currentIndex];
  // The ensemencement is a physical event, not a timer/checkbox completion.
  // Only recordPitch may confirm it, after the brewer chooses a quantity state.
  if (!current || current.doneAt != null || current.id === 'ensemencement') return state;
  // Confirmer un ajout au début de l'ébullition est aussi le départ de l'horloge.
  const started =
    current.boilElapsedMin != null && state.boilStartedAt == null
      ? startBrewStep(state, now)
      : state;
  const last = state.currentIndex === state.steps.length - 1;
  const nextIndex = last ? state.currentIndex : state.currentIndex + 1;
  return {
    ...started,
    currentIndex: nextIndex,
    ...(last && current.id !== 'ensemencement' ? { finishedAt: now } : {}),
    ...(current.id === 'ensemencement' ? { pitchedAt: state.pitchedAt ?? now, finishedAt: state.finishedAt ?? now, phase: 'brewing' as const } : {}),
    thermalSegments: started.thermalSegments?.map(segment => segment.stepId === current.id && segment.endedAt == null ? { ...segment, endedAt: now } : segment),
    steps: started.steps.map((s, i) => {
      if (i === state.currentIndex) return { ...s, doneAt: now };
      // Les paliers démarrent à température atteinte. Seule l'ébullition continue.
      if (i === nextIndex && s.boilElapsedMin != null && started.boilStartedAt != null)
        return {
          ...s,
          startedAt: started.boilStartedAt + s.boilElapsedMin * 60000
        };
      return s;
    })
  };
}

/** Transfer is a physical event, not the start of fermentation. Safe to retry offline. */
export function markTransferred(state: BrewDayState, now: number): BrewDayState {
  if (state.finishedAt != null || state.pitchedAt != null || state.transferredAt != null) return state;
  const pitchIndex = state.steps.findIndex(s => s.id === 'ensemencement');
  return { ...state, phase: 'awaiting-pitch', transferredAt: now,
    currentIndex: pitchIndex >= 0 ? pitchIndex : state.currentIndex,
    thermalSegments: state.thermalSegments?.map(s => s.endedAt == null ? { ...s, endedAt: now } : s),
    notes: [...state.notes ?? [], { id: crypto.randomUUID(), at: now, stepId: 'ensemencement',
      text: 'Transfert en fermenteur consigné. En attente d’ensemencement ; la fermentation n’a pas encore commencé.' }] };
}

/** Confirm the actual yeast addition. No OG, volume or pitch temperature is invented. */
export type PitchQuantityChoice =
  | { mode: 'measured' | 'planned'; amount: number; unit: string }
  | { mode: 'unmeasured' }
  | { mode: 'starter-transferred'; cultureVolumeL?: number };

export function validPitchQuantityChoice(choice: PitchQuantityChoice | undefined): choice is PitchQuantityChoice {
  if (!choice) return false;
  if (choice.mode === 'unmeasured') return true;
  if (choice.mode === 'starter-transferred') return choice.cultureVolumeL === undefined || Number.isFinite(choice.cultureVolumeL) && choice.cultureVolumeL > 0;
  return Number.isFinite(choice.amount) && choice.amount > 0 && typeof choice.unit === 'string' && choice.unit.trim().length > 0;
}

/** The choice is required: a missing quantity never silently falls back to the recipe dose. */
export function recordPitch(state: BrewDayState, now: number, temperatureC: number | undefined, choice: PitchQuantityChoice): BrewDayState {
  if (state.pitchedAt != null || state.finishedAt != null) return state;
  if (!validPitchQuantityChoice(choice)) return state;
  const temperature = typeof temperatureC === 'number' && Number.isFinite(temperatureC) ? temperatureC : undefined;
  const quantity = choice.mode === 'measured' || choice.mode === 'planned'
    ? { amount: choice.amount, unit: choice.unit.trim() }
    : choice.mode === 'starter-transferred' && choice.cultureVolumeL !== undefined
      ? { amount: choice.cultureVolumeL, unit: 'L' }
      : undefined;
  const additions = { ...state.additions };
  if (quantity) additions.yeast = { ...additions.yeast, ...quantity, doneAt: now };
  else delete additions.yeast;
  const quantityNote = choice.mode === 'measured' ? `${quantity!.amount} ${quantity!.unit} mesurés`
    : choice.mode === 'planned' ? `${quantity!.amount} ${quantity!.unit} · quantité prévue effectivement ajoutée`
      : choice.mode === 'starter-transferred' ? `culture de starter transférée${quantity ? ` · ${nombreFr(quantity.amount, 1)} L relevés` : ' · volume non relevé'}`
        : 'quantité non mesurée · consommation de stock à régulariser';
  return { ...state, additions, pitchQuantityConfirmation: choice.mode, phase: 'brewing', pitchedAt: now, finishedAt: now,
    ...(temperature == null ? {} : { pitchTemperatureC: temperature }),
    steps: state.steps.map(s => s.id === 'ensemencement' ? { ...s, doneAt: now } : s),
    thermalSegments: state.thermalSegments?.map(s => s.endedAt == null ? { ...s, endedAt: now } : s),
    notes: [...state.notes ?? [], { id: crypto.randomUUID(), at: now, stepId: 'ensemencement',
      text: `Levure ajoutée · ${quantityNote}${temperature == null ? ' · température non relevée' : ` · moût à ${nombreFr(temperature, 1)} °C`}. Début de fermentation consigné.` }] };
}

export interface QualifiedFinalBrewReading {
  value: number;
  reading: BrewDayReading;
  approximate: boolean;
}

/** Qualify the latest observation before promoting it to the batch. Raw journal values stay intact. */
export function finalBrewReadings(state: BrewDayState, recipe?: Pick<RecipeSnapshot, 'brewhouse'>) {
  const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
  const isFinalGravity = (r: BrewDayReading) => r.kind === 'densite' && (r.measurementStage
    ? ['fermenter', 'kettle-cold'].includes(r.measurementStage) : isFinalWort(r.stepId));
  const isFermenterVolume = (r: BrewDayReading) => r.kind === 'volume' && (r.measurementStage
    ? r.measurementStage === 'fermenter' : r.stepId === 'ensemencement');
  const readings = (state.readings ?? []).filter(r => isFinalGravity(r) || isFermenterVolume(r))
    .map((reading, order) => ({ reading, order }))
    .sort((a, b) => (finite(b.reading.at) ? b.reading.at : Infinity) - (finite(a.reading.at) ? a.reading.at : Infinity) || b.order - a.order)
    .map(({ reading }) => reading);
  // An explicitly paired new capture cannot borrow the missing half from an older pair.
  const candidates = readings[0]?.pairId ? readings.filter(r => r.pairId === readings[0].pairId) : readings;
  const rawGravity = candidates.find(isFinalGravity), rawVolume = candidates.find(isFermenterVolume);
  let gravity: QualifiedFinalBrewReading | undefined, volume: QualifiedFinalBrewReading | undefined;
  const reasons = { gravity: 'Densité initiale inconnue : relève le moût refroidi à température de référence.',
    volume: 'Volume en fermenteur inconnu : relève le volume et sa référence de température.' };
  const beforePitch = (r: BrewDayReading) => finite(r.at) && r.at >= 0 && (state.pitchedAt == null || r.at <= state.pitchedAt);
  const wortChangedSince = (r: BrewDayReading) => Object.entries(state.additions ?? {}).some(([id, addition]) =>
    /^(water-|grain-)/.test(id) && addition.amount > 0 && finite(addition.doneAt) &&
    addition.doneAt > r.at && addition.doneAt <= (state.pitchedAt ?? state.finishedAt ?? Infinity),
  );
  if (rawGravity) {
    if (wortChangedSince(rawGravity)) {
      reasons.gravity = 'Le moût a changé depuis cette densité : reprends une mesure après le dernier ajout d’eau ou de fermentescible. Le relevé brut reste au journal.';
    } else if (beforePitch(rawGravity) && rawGravity.unit === 'SG' && finite(rawGravity.value) &&
      rawGravity.value >= READING.densite.min && rawGravity.value <= READING.densite.max && rawGravity.roomTemp === true) {
      gravity = { value: rawGravity.value, reading: rawGravity, approximate: false };
      reasons.gravity = '';
    } else reasons.gravity = 'Dernière densité non qualifiée comme OG : confirme sa référence de température et son prélèvement avant levure. Le relevé brut reste au journal.';
  }
  if (rawVolume) {
    const valid = beforePitch(rawVolume) && rawVolume.unit === 'L' && finite(rawVolume.value) && rawVolume.value > 0;
    const cold = rawVolume.volumeBasis === 'cold' || !rawVolume.volumeBasis && rawVolume.roomTemp === true;
    if (valid && cold && (!finite(rawVolume.temperatureC) || rawVolume.temperatureC <= 30)) {
      volume = { value: rawVolume.value, reading: rawVolume, approximate: false };
      reasons.volume = '';
    } else if (valid && rawVolume.volumeBasis === 'hot' && (!finite(rawVolume.temperatureC) || rawVolume.temperatureC >= 90)) {
      const shrink = recipe?.brewhouse?.equipment?.coolingShrinkagePct;
      if (finite(shrink) && shrink >= 0 && shrink < 20) {
        volume = { value: Number((rawVolume.value * (1 - shrink / 100)).toFixed(3)), reading: rawVolume, approximate: true };
        reasons.volume = '';
      }
    }
    if (!volume) reasons.volume = 'Dernier volume non qualifié à froid : précise sa référence. Un volume à ébullition demande le retrait du profil figé ; le relevé brut reste au journal.';
    if (wortChangedSince(rawVolume)) {
      volume = undefined;
      reasons.volume = 'Le moût a changé depuis ce volume : mesure à nouveau le volume final après les ajouts. Le relevé brut reste au journal.';
    }
  }
  return { gravity, volume, rawGravity, rawVolume, reasons };
}
