import { recipeIbu } from './hopBitterness';
import {
  AcidId,
  BrewDayState,
  BrewDayStep,
  Fermentable,
  RecipeSnapshot,
  SaltId,
  StockItem,
  WaterIons
} from '../types';
import {
  ACIDS,
  SALTS,
  SALT_IDS,
  addIons,
  ionsFromSalts,
  ionsAfterAcid,
  averageWater,
  waterSourceFromPlan,
  lactateInBeer,
  LACTATE_TASTE_THRESHOLD
} from './water';
import { styleByCode, styleFromTargetIons } from './waterStyles';
import { Units } from '../services/units';
import { isMash } from './brewDay';
import { BrewingMath } from '../services/brewingMath';

/** Projection Tinseth, au volume et à l'OG de la recette. Les heures cochées
 * prolongent le contact des houblons déjà versés quand la fin est repoussée. */
export function brewBitterness(recipe: RecipeSnapshot, state: BrewDayState) {
  if (!recipe.volumeL || !recipe.ogTarget) return null;
  const duration = boilMinutes(state, recipe);
  const end =
    state.boilFinishedAt ??
    (state.boilStartedAt != null ? state.boilStartedAt + duration * 60000 : undefined);
  const hops = (recipe.hops ?? []).map((h, i) => {
    const actual = state.additions?.['hop-' + i];
    const timeMin =
      h.stage === 'boil'
        ? actual?.doneAt != null && end != null && state.boilStartedAt != null
          ? Math.max(0, (end - Math.max(state.boilStartedAt, actual.doneAt)) / 60000)
          : state.hopElapsedMin?.['hop-' + i] != null
            ? Math.max(0, duration - state.hopElapsedMin['hop-' + i])
            : Math.min(h.timeMin ?? 0, duration)
        : h.timeMin;
    return { ...h, weightG: actual?.amount ?? h.weightG, timeMin };
  });
  if (hops.some((h) => h.stage !== 'dryHop' && h.weightG > 0 && !h.alpha)) return null;
  const actualMinutes =
    state.boilFinishedAt != null && state.boilStartedAt != null
      ? (state.boilFinishedAt - state.boilStartedAt) / 60000
      : duration;
  const planned = recipeIbu(recipe.hops ?? [], recipe.volumeL, recipe.ogTarget, recipe.boilMin);
  const projected = recipeIbu(hops, recipe.volumeL, recipe.ogTarget, actualMinutes);
  return planned == null || projected == null ? null : { planned, projected };
}

export type BrewArea = 'preparation' | 'mash' | 'boil' | 'finish';
export const areaOf = (id: string): BrewArea =>
  isMash(id) || ['sparge', 'fwh', 'preboil', 'nolo-extraction', 'nolo-second-runnings'].includes(id)
    ? 'mash'
    : /^(boil|hop|sucres|whirlpool)/.test(id)
      ? 'boil'
      : ['refroidissement', 'ensemencement'].includes(id)
        ? 'finish'
        : 'preparation';
export const isBoilStep = (s: BrewDayStep) =>
  s.boilElapsedMin != null || /^boil-|^hop-/.test(s.id) || s.id === 'sucres';
export function boilMinutes(state: BrewDayState, recipe?: RecipeSnapshot) {
  return (
    state.boilDurationMin ??
    recipe?.boilMin ??
    Math.max(
      0,
      ...state.steps.filter(isBoilStep).map((s) => (s.boilElapsedMin ?? 0) + s.durationMin)
    )
  );
}
export const isUsefulTimer = (s: BrewDayStep) =>
  (isMash(s.id) || ['whirlpool', 'nolo-extraction', 'nolo-second-runnings'].includes(s.id)) && s.durationMin > 0;
export interface BrewAlarm {
  id: string;
  at: number;
  title: string;
  body: string;
  stepId: string;
}
export interface BrewIngredient {
  id: string;
  name: string;
  planned: number;
  unit: string;
  area: BrewArea;
  stepId: string;
  kind: 'salt' | 'acid' | 'grain' | 'hop' | 'other' | 'water';
  salt?: SaltId;
  acid?: AcidId;
  side?: 'mash' | 'sparge';
  fermentableIndex?: number;
  hopIndex?: number;
  beforeEndMin?: number;
}

/** Identifiants liés à la recette figée, pas aux noms (deux Citra restent deux ajouts). */
export function brewIngredients(recipe: RecipeSnapshot): BrewIngredient[] {
  const items: BrewIngredient[] = [];
  const plan = recipe.waterPlan;
  if (plan)
    for (const side of ['mash', 'sparge'] as const) {
      const litres = side === 'mash' ? plan.mashWaterL : plan.spargeWaterL;
      if (litres > 0)
        items.push({
          id: `water-${side}`,
          name: side === 'mash' ? 'Eau d’empâtage' : 'Eau de rinçage',
          planned: litres,
          unit: 'L',
          area: 'preparation',
          stepId: 'eau',
          kind: 'water',
          side
        });
      // Les zéros restent accessibles sous « Autre sel » pour consigner une erreur.
      for (const salt of SALT_IDS)
        items.push({
          id: `salt-${side}-${salt}`,
          name: SALTS[salt].name,
          planned: plan[side]?.[salt] ?? 0,
          unit: 'g',
          area: 'preparation',
          stepId: 'eau',
          kind: 'salt',
          salt,
          side
        });
      if (plan.acid)
        items.push({
          id: `acid-${side}`,
          name: ACIDS[plan.acid.id].name,
          planned: plan.acid[side],
          unit: ACIDS[plan.acid.id].unit,
          area: 'preparation',
          stepId: 'eau',
          kind: 'acid',
          acid: plan.acid.id,
          side
        });
    }
  (recipe.fermentables ?? []).forEach((f, i) => {
    if (f.use === 'fermentation') return;
    if (recipe.nolo?.enabled && recipe.nolo.process === 'secondRunnings' && f.kind === 'grain' && (f.use ?? 'empatage') === 'empatage') return;
    items.push({
      id: `grain-${i}`,
      name: f.name,
      planned: f.weightKg,
      unit: 'kg',
      area: f.use === 'ebullition' ? 'boil' : 'preparation',
      stepId: f.use === 'ebullition' ? 'sucres' : 'concassage',
      kind: f.kind === 'grain' ? 'grain' : 'other',
      fermentableIndex: i,
      ...(f.use === 'ebullition' ? { beforeEndMin: Math.min(10, recipe.boilMin ?? 60) } : {})
    });
  });
  (recipe.hops ?? []).forEach((h, i) => {
    if (h.stage === 'dryHop') return;
    items.push({
      id: `hop-${i}`,
      name: h.name,
      planned: h.weightG,
      unit: 'g',
      area: h.stage === 'firstWort' ? 'mash' : 'boil',
      stepId:
        h.stage === 'firstWort'
          ? 'fwh'
          : h.stage === 'whirlpool'
            ? 'whirlpool'
            : `hop-${Math.max(0, (recipe.boilMin ?? 60) - (h.timeMin ?? 0))}`,
      kind: 'hop',
      hopIndex: i,
      ...(h.stage === 'boil' ? { beforeEndMin: Math.max(0, h.timeMin ?? 0) } : {})
    });
  });
  if (recipe.yeast)
    items.push({
      id: 'yeast',
      name: recipe.yeast.name,
      planned: recipe.yeast.qty,
      unit: recipe.yeast.unit,
      area: 'finish',
      stepId: 'ensemencement',
      kind: 'other'
    });
  (recipe.adjuncts ?? []).forEach((a, i) =>
    items.push({
      id: `adjunct-${i}`,
      name: a.name,
      planned: a.amount,
      unit: a.unit,
      area: /ferment/i.test(a.step) ? 'finish' : /empat|empât/i.test(a.step) ? 'mash' : 'boil',
      stepId: 'sucres',
      kind: 'other'
    })
  );
  return items;
}
export const actualAmount = (i: BrewIngredient, s: BrewDayState) =>
  s.additions?.[i.id]?.amount ?? i.planned;
export function effectiveFermentables(recipe: Pick<RecipeSnapshot,'fermentables'>, state: BrewDayState): Fermentable[] {
  return (recipe.fermentables ?? []).map((f, i) => {
    const actual = state.additions?.[`grain-${i}`];
    return {
      ...f,
      ...(actual?.replacement
        ? {
            ...actual.replacement,
            potentialPpg: actual.replacement.potentialPpg,
            colorEbc: actual.replacement.colorEbc
          }
        : {}),
      weightKg: actual?.amount ?? f.weightKg
    };
  });
}
export function brewAlarms(state: BrewDayState, recipe: RecipeSnapshot): BrewAlarm[] {
  if (state.finishedAt != null) return [];
  const alarms: BrewAlarm[] = [];
  state.steps.forEach((s, i) => {
    if (!isUsefulTimer(s) || s.startedAt == null || s.doneAt != null || s.pausedAt != null) return;
    const next = state.steps.slice(i + 1).find((n) => isMash(n.id));
    alarms.push({
      id: `timer-${s.id}`,
      stepId: s.id,
      at: s.startedAt + s.durationMin * 60000,
      title: `Fin · ${s.label}`,
      body:
        isMash(s.id) && next
          ? `Monter à ${next.tempC} °C pour ${next.label}.`
          : 'Temps de contact terminé. Vérifie la cuve.'
    });
  });
  if (state.boilStartedAt != null && state.boilFinishedAt == null) {
    const end = state.boilStartedAt + boilMinutes(state, recipe) * 60000;
    const grouped = new Map<number, BrewIngredient[]>();
    for (const i of brewIngredients(recipe))
      if (
        i.beforeEndMin != null &&
        state.additions?.[i.id]?.doneAt == null &&
        actualAmount(i, state) > 0
      ) {
        const at =
          state.hopElapsedMin?.[i.id] != null
            ? Math.min(
                end,
                Math.max(
                  state.boilStartedAt,
                  state.boilStartedAt + state.hopElapsedMin[i.id] * 60000
                )
              )
            : Math.max(state.boilStartedAt, end - i.beforeEndMin * 60000);
        grouped.set(at, [...(grouped.get(at) ?? []), i]);
      }
    for (const [at, items] of grouped)
      alarms.push({
        id: `add-${items.map((i) => i.id).join('-')}`,
        at,
        stepId: items[0].stepId,
        title: 'Ajout en cuve',
        body: items.map((i) => `${actualAmount(i, state)} ${i.unit} ${i.name}`).join(' · ')
      });
    alarms.push({
      id: 'boil-end',
      at: end,
      stepId: state.steps.find(isBoilStep)?.id ?? 'boil-fin',
      title: 'Fin d’ébullition',
      body: 'Couper le feu. Passer au whirlpool ou au refroidissement.'
    });
  }
  return alarms.sort((a, b) => a.at - b.at);
}
export function changeBoilMinutes(
  s: BrewDayState,
  recipe: RecipeSnapshot,
  delta: number
): BrewDayState {
  const duration = Math.max(1, Math.min(480, Math.round(boilMinutes(s, recipe) + delta)));
  return {
    ...s,
    boilDurationMin: duration,
    ...(s.hopElapsedMin
      ? {
          hopElapsedMin: Object.fromEntries(
            Object.entries(s.hopElapsedMin).map(([id, minute]) => [
              id,
              s.additions?.[id]?.doneAt != null ? minute : Math.min(minute, duration)
            ])
          )
        }
      : {})
  };
}
export const PREPARATIONS = [
  { id: 'balance', label: 'Vérifier la balance et peser les ajouts', area: 'preparation' },
  { id: 'moulin', label: 'Régler le moulin et concasser le grain', area: 'preparation' },
  { id: 'phmetre', label: 'Étalonner le pH-mètre et vérifier la sonde', area: 'mash' },
  { id: 'rinçage', label: 'Préparer l’eau de rinçage à la température prévue', area: 'mash' },
  { id: 'ajouts', label: 'Aligner les doses de houblon dans l’ordre des ajouts', area: 'boil' },
  {
    id: 'froid',
    label: 'Préparer le refroidisseur selon son protocole de désinfection',
    area: 'boil'
  },
  {
    id: 'fermenteur',
    label: 'Nettoyer et désinfecter fermenteur, robinet et transfert',
    area: 'finish'
  },
  { id: 'levure', label: 'Préparer la levure selon sa notice', area: 'finish' },
  {
    id: 'oxygenation',
    label: 'Aérer le moût refroidi selon les besoins de la levure',
    area: 'finish'
  }
] as const;

export function mineralFeedback(recipe: RecipeSnapshot, s: BrewDayState) {
  const p = recipe.waterPlan;
  if (!p) return null;
  const knownBase = !!(p.sourceSnapshot || p.startIons);
  const ingredients = brewIngredients(recipe);
  const sides = ['mash', 'sparge'] as const;
  const water = sides.map(
    (side) =>
      s.additions?.[`water-${side}`]?.amount ?? (side === 'mash' ? p.mashWaterL : p.spargeWaterL)
  );
  const total = water[0] + water[1];
  if (
    sides.some(
      (side, i) =>
        s.waterMix?.[side] != null &&
        (s.waterMix[side]!.roL < 0 || s.waterMix[side]!.roL > water[i])
    )
  )
    return null;
  if (!Number.isFinite(total) || total <= 0) return null;
  // Reconstituer la source figée, puis traiter chaque eau dans son propre volume.
  // Les anciens startIons décrivent l'empâtage ; en v2, ils décrivent la moyenne.
  const mashFraction = 1 - (p.diRatioPct ?? 0) / 100;
  const spargeFraction = 1 - (p.spargeDiRatioPct ?? p.diRatioPct ?? 0) / 100;
  const actualFractions = sides.map((side, i) =>
    s.waterMix?.[side] != null && water[i] > 0
      ? 1 - Math.max(0, Math.min(water[i], s.waterMix[side]!.roL)) / water[i]
      : side === 'mash'
        ? mashFraction
        : spargeFraction
  );
  const currentFraction = (actualFractions[0] * water[0] + actualFractions[1] * water[1]) / total;
  const frozenSource = waterSourceFromPlan(p);
  if (!frozenSource && currentFraction > 0 && knownBase) return null;
  const source = frozenSource ?? { ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0 };
  const treated = sides.map((side, index) => {
    const litres = water[index];
    const start = Object.fromEntries(
      Object.entries(source).map(([k, v]) => [k, v * actualFractions[index]])
    ) as unknown as WaterIons;
    const doses = Object.fromEntries(
      ingredients
        .filter((i) => i.kind === 'salt' && i.side === side)
        .map((i) => [i.salt, actualAmount(i, s)])
    );
    let ions = addIons(start, ionsFromSalts(doses, litres));
    const acid = ingredients.find((i) => i.kind === 'acid' && i.side === side);
    if (acid) ions = ionsAfterAcid(ions, actualAmount(acid, s), acid.acid!, litres);
    for (const c of s.acidCorrections ?? [])
      if (side === 'mash' ? isMash(c.stepId) : c.stepId === 'sparge')
        ions = ionsAfterAcid(ions, c.amount, c.acid, litres);
    return ions;
  });
  const ions = averageWater(treated[0], treated[1], water[0], water[1]);
  const style = p.targetIons
    ? styleFromTargetIons(p.targetIons, p.targetName)
    : p.targetProfileId
      ? styleByCode(p.targetProfileId)
      : undefined;
  const warnings: string[] = [];
  const limits = { mg: 40, na: 150, so4: 400, cl: 250 };
  for (const ion of Object.keys(limits) as Array<keyof typeof limits>)
    if (ions[ion] > limits[ion])
      warnings.push(
        `${{ mg: 'Magnésium', na: 'Sodium', so4: 'Sulfates', cl: 'Chlorures' }[ion]} : ${Math.round(ions[ion])} ppm, au-dessus du repère sensoriel ${limits[ion]}.`
      );
  const changed = ingredients.filter(
    (i) =>
      (i.kind === 'salt' || i.kind === 'acid' || i.kind === 'water') &&
      Math.abs(actualAmount(i, s) - i.planned) > 0.01
  );
  const added = changed.some((i) => s.additions?.[i.id]?.doneAt != null);
  const extraRO = Math.max(
    0,
    ...(Object.keys(limits) as Array<keyof typeof limits>).map(
      (k) => total * (ions[k] / limits[k] - 1)
    )
  );
  const lactic =
    ingredients
      .filter((i) => i.acid === 'lactique')
      .reduce((sum, i) => sum + actualAmount(i, s), 0) +
    (s.acidCorrections ?? [])
      .filter((c) => c.acid === 'lactique')
      .reduce((sum, c) => sum + c.amount, 0);
  const lactate = lactateInBeer(lactic, recipe.volumeL);
  if (lactate > LACTATE_TASTE_THRESHOLD)
    warnings.push(
      `Lactique : ${lactate.toFixed(2)} g/L de bière, au-dessus du repère de goût ${LACTATE_TASTE_THRESHOLD}.`
    );
  const outside = style
    ? (['ca', 'mg', 'na', 'so4', 'cl'] as const).filter(
        (k) => (knownBase && ions[k] < style.ions[k].min) || ions[k] > style.ions[k].max
      )
    : [];
  return {
    knownBase,
    ions,
    changed,
    added,
    total,
    warnings,
    extraRO: Math.ceil(extraRO * 10) / 10,
    style,
    outside
  };
}

const family = (name: string) =>
  /acid|fum|smok|tourb|peat/i.test(name)
    ? 'special'
    : /wheat|blé|ble\b/i.test(name)
      ? 'wheat'
      : /oat|avoine/i.test(name)
        ? 'oat'
        : /rye|seigle/i.test(name)
          ? 'rye'
          : /flak|flocon/i.test(name)
            ? 'flakes'
            : 'barley';
const process = (name: string) =>
  /flak|flocon|raw|cru\b/i.test(name)
    ? 'raw'
    : /carapils|dextrin/i.test(name)
      ? 'dextrin'
      : /caramel|crystal|cara/i.test(name)
        ? 'crystal'
        : /munich|vienn|vienne|melano/i.test(name)
          ? 'kilned'
          : 'malt';
export function maltAlternatives(f: Fermentable, amount: number, stock: StockItem[]) {
  if (f.kind !== 'grain' || f.colorEbc == null || family(f.name) === 'special') return [];
  const grade = (ebc: number) => (ebc <= 20 ? 0 : ebc <= 120 ? 1 : ebc <= 500 ? 2 : 3);
  return stock
    .filter(
      (x) =>
        x.category === 'Malt' &&
        x.name.toLowerCase() !== f.name.toLowerCase() &&
        x.colorEbc != null &&
        grade(x.colorEbc) === grade(f.colorEbc!) &&
        family(x.name) === family(f.name) &&
        process(x.name) === process(f.name) &&
        x.currentStock > 0
    )
    .map((x) => {
      const mass =
        f.potentialPpg && x.potentialPpg ? (amount * f.potentialPpg) / x.potentialPpg : amount;
      return {
        item: x,
        kg: Math.round(mass * 100) / 100,
        availableKg: Units.convert(x.currentStock, x.unit, 'kg') ?? 0,
        exact: !!f.potentialPpg && !!x.potentialPpg
      };
    })
    .filter((x) => x.availableKg >= x.kg)
    .sort(
      (a, b) => Math.abs(a.item.colorEbc! - f.colorEbc!) - Math.abs(b.item.colorEbc! - f.colorEbc!)
    )
    .slice(0, 3);
}

/** PPG × livres = points-gallons. Avant ébullition : rendement d'extraction du
 * grain. En fermenteur : rendement global de la recette, ajouts compris. */
export function measuredEfficiency(recipe: RecipeSnapshot, s: BrewDayState, stepId: string) {
  const entries = [...(s.readings ?? [])].reverse().filter((r) => r.stepId === stepId);
  const sg = entries.find((r) => r.kind === 'densite');
  const vol = entries.find((r) => r.kind === 'volume');
  if (!sg || !vol || sg.value <= 1 || vol.value <= 0)
    return {
      known: false as const,
      reason: 'Relève le volume et la densité du même moût pour calculer le rendement.'
    };
  const f = effectiveFermentables(recipe, s).filter(
    (f) =>
      f.use !== 'fermentation' &&
      f.weightKg > 0 &&
      (stepId === 'preboil' ? f.use === 'empatage' : true)
  );
  const missing = f.filter((f) => !f.potentialPpg);
  if (missing.length)
    return {
      known: false as const,
      reason: `Potentiel d’extrait manquant : ${missing.map((f) => f.name).join(', ')}. Aucun rendement inventé.`
    };
  const grain = f
    .filter((f) => f.kind === 'grain')
    .reduce((sum, f) => sum + f.weightKg * 2.2046226 * f.potentialPpg!, 0);
  const direct = f
    .filter((f) => f.kind !== 'grain')
    .reduce((sum, f) => sum + f.weightKg * 2.2046226 * f.potentialPpg!, 0);
  if (grain <= 0)
    return {
      known: false as const,
      reason: 'Pas de grain : le rendement d’empâtage ne s’applique pas.'
    };
  const collected = (sg.value - 1) * 1000 * vol.value * 0.26417205;
  const pct =
    100 * (stepId === 'preboil' ? (collected - direct) / grain : collected / (grain + direct));
  return {
    known: true as const,
    pct: Math.round(pct * 10) / 10,
    approximate: !sg.roomTemp || !vol.roomTemp,
    direct: direct > 0,
    sg: sg.value,
    volumeL: vol.value,
    questionable: pct < 0 || pct > 100,
    spreadMin: Math.abs(sg.at - vol.at) / 60000
  };
}
