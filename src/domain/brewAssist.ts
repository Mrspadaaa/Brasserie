import { BrewDayState, BrewDayStep, RecipeSnapshot, WaterIons } from '../types';
import { BrewingMath } from '../services/brewingMath';
import { boilMinutes, brewBitterness, effectiveFermentables } from './brewCompanion';
import { ionsFromSalts, addIons, ionsAfterAcid, waterSourceFromPlan } from './water';
import { equipmentErrors } from './brewEquipment';
import { pitchTemperatureFeedback } from './pitchingPlan';
import { activeThermalSegment, thermalSamples, thermalWindow } from './brewThermal';
export { thermalEstimate, rampExposure } from './brewThermal';

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export const round = (n: number, digits = 1) => Number(n.toFixed(digits));

export function actualWater(recipe: Pick<RecipeSnapshot,'waterPlan'>, state: BrewDayState, side: 'mash' | 'sparge') {
  const p = recipe.waterPlan;
  const litres =
    state.additions?.[`water-${side}`]?.amount ??
    (side === 'mash' ? p?.mashWaterL : p?.spargeWaterL) ??
    0;
  const plannedPct = (side === 'sparge' ? p?.spargeDiRatioPct : undefined) ?? p?.diRatioPct ?? 0;
  const roL = state.waterMix?.[side]?.roL ?? (litres * plannedPct) / 100;
  return {
    litres,
    roL,
    tapL: Math.max(0, litres - roL),
    plannedPct,
    invalidMix: roL < 0 || roL > litres
  };
}

/** Mass balance only. Replacement applies to untreated water before contact with grain. */
export function waterScenario(
  recipe: RecipeSnapshot,
  state: BrewDayState,
  side: 'mash' | 'sparge',
  roL: number
) {
  const p = recipe.waterPlan;
  const w = actualWater(recipe, state, side);
  if (!p || !finite(roL) || roL < 0 || roL > w.litres || w.litres <= 0) return null;
  const desired = w.plannedPct / 100;
  const actual = roL / w.litres;
  const source = waterSourceFromPlan(p);
  let ions = source
    ? (Object.fromEntries(
        ['ca', 'mg', 'na', 'so4', 'cl', 'hco3'].map((k) => [
          k,
          source[k as keyof WaterIons] * (1 - actual)
        ])
      ) as unknown as WaterIons)
    : null;
  if (ions) {
    const salts = Object.fromEntries(
      Object.keys(p[side] ?? {}).map((k) => [
        k,
        state.additions?.[`salt-${side}-${k}`]?.amount ?? p[side][k as keyof typeof p.mash] ?? 0
      ])
    );
    // Include salts originally absent from the recipe but actually recorded.
    for (const [id, value] of Object.entries(state.additions ?? {}))
      if (id.startsWith(`salt-${side}-`)) salts[id.slice(`salt-${side}-`.length)] = value.amount;
    ions = addIons(ions, ionsFromSalts(salts, w.litres));
    if (p.acid)
      ions = ionsAfterAcid(
        ions,
        state.additions?.[`acid-${side}`]?.amount ?? p.acid[side],
        p.acid.id,
        w.litres
      );
    for (const correction of state.acidCorrections ?? []) {
      if (side === 'mash' ? /^mash/.test(correction.stepId) : correction.stepId === 'sparge') {
        ions = ionsAfterAcid(ions, correction.amount, correction.acid, w.litres);
      }
    }
  }
  const tooMuch = actual > desired;
  const replaceL =
    Math.abs(actual - desired) < 0.0001
      ? 0
      : tooMuch
        ? desired === 0
          ? w.litres
          : (w.litres * (actual - desired)) / actual
        : desired === 1
          ? w.litres
          : (w.litres * (desired - actual)) / (1 - actual);
  const addL = tooMuch
    ? desired > 0
      ? roL / desired - w.litres
      : null
    : desired < 1
      ? (desired * w.litres - roL) / (1 - desired)
      : null;
  const treated =
    state.acidCorrections?.some((c) =>
      side === 'mash' ? /^mash/.test(c.stepId) : c.stepId === 'sparge'
    ) ||
    Object.entries(state.additions ?? {}).some(
      ([id, a]) =>
        a.doneAt != null &&
        (id === `water-${side}` || id.startsWith(`salt-${side}-`) || id === `acid-${side}`)
    );
  const grainIn =
    state.steps.some(
      (s) => /^mash/.test(s.id) && (s.startedAt != null || s.rampStartedAt != null)
    ) ||
    Object.entries(state.additions ?? {}).some(
      ([id, a]) => id.startsWith('grain-') && a.doneAt != null
    );
  return {
    ...w,
    roL,
    tapL: w.litres - roL,
    actualPct: actual * 100,
    ions,
    sourceInferred: !!source && !p.sourceSnapshot,
    replaceL,
    addL,
    replacement: tooMuch ? 'réseau' : 'osmosée',
    treated,
    grainIn,
    message: tooMuch
      ? 'Moins d’alcalinité et de minéraux de la source. La dose acide prévue peut devenir excessive : mesure le pH avant de la compléter.'
      : actual < desired
        ? 'Plus d’alcalinité et de minéraux de la source. Sans osmosée, reste sur ce volume, contrôle le pH refroidi et adapte le traitement à la mesure ; l’acide ne retire ni sulfates ni chlorures.'
        : 'La coupe correspond au plan. Vérifie les doses et garde empâtage et rinçage séparés.'
  };
}

/** Extract added after the sampled wort. No mash efficiency applies to dissolved sugars. */
export function laterExtract(recipe: RecipeSnapshot, state: BrewDayState, after: number) {
  const pending = effectiveFermentables(recipe, state).filter((f, i) => {
    const a = state.additions?.[`grain-${i}`];
    return f.use === 'ebullition' && f.weightKg > 0 && (a?.doneAt == null || a.doneAt > after);
  });
  if (pending.some((f) => f.kind === 'grain'))
    return { pointsLitres: null, names: pending.map((f) => f.name) };
  const points = pending.length ? (BrewingMath.extractPoints(pending, 1, 100)?.total ?? null) : 0;
  return { pointsLitres: points, names: pending.map((f) => f.name) };
}

export function boilScenario(
  recipe: RecipeSnapshot,
  state: BrewDayState,
  minutes: number,
  hopId?: string,
  elapsedMin?: number,
  evaporationLh?: number
) {
  if (
    !finite(minutes) ||
    minutes < 1 ||
    minutes > 480 ||
    (elapsedMin != null && (!finite(elapsedMin) || elapsedMin < 0 || elapsedMin > minutes))
  )
    return null;
  const snapshot: BrewDayState = {
    ...state,
    boilDurationMin: minutes,
    hopElapsedMin: {
      ...state.hopElapsedMin,
      ...(hopId != null && elapsedMin != null ? { [hopId]: elapsedMin } : {})
    }
  };
  // A simulator may change an already recorded hop time without rewriting the journal.
  if (hopId && elapsedMin != null && snapshot.additions?.[hopId]) {
    snapshot.additions = {
      ...snapshot.additions,
      [hopId]: { ...snapshot.additions[hopId] }
    };
    delete snapshot.additions[hopId].doneAt;
  }
  delete snapshot.boilFinishedAt;
  let bitterness = brewBitterness(recipe, snapshot);
  const volume = lastWortPair(state, 'preboil');
  const extract = volume
    ? laterExtract(recipe, state, Math.min(volume.volume.at, volume.gravity.at))
    : { pointsLitres: null, names: [] };
  const equipment=recipe.brewhouse?.equipment && !equipmentErrors(recipe.brewhouse.equipment).length ? recipe.brewhouse.equipment : undefined;
  const rate = evaporationLh ?? state.boilOffLPerHour ?? equipment?.boilOffLPerHour;
  const coldFactor=equipment ? 1-equipment.coolingShrinkagePct/100 : 1;
  const extraEvapL =
    finite(rate) && rate >= 0 ? (rate * coldFactor * (minutes - (recipe.boilMin ?? 60))) / 60 : null;
  const finalL =
    volume && finite(rate) && rate >= 0 ? volume.volume.value - (rate * coldFactor * minutes) / 60 : null;
  const finalOg =
    volume && finalL && finalL > 0 && extract.pointsLitres != null
      ? 1 +
        ((volume.gravity.value - 1) * volume.volume.value + extract.pointsLitres / 1000) / finalL
      : null;
  if (bitterness && finalL && finalL > 0 && finalOg) {
    const adjusted = brewBitterness({ ...recipe, volumeL: finalL, ogTarget: finalOg }, snapshot);
    if (adjusted) bitterness = { ...bitterness, projected: adjusted.projected };
  }
  const hops = (recipe.hops ?? []).filter((h) => h.stage === 'boil');
  return {
    minutes,
    bitterness,
    extraEvapL,
    finalL,
    finalOg,
    extract,
    needsVolume: !volume,
    hasBoilHops: hops.length > 0,
    message:
      'Une durée plus longue concentre le moût et prolonge le contact des houblons déjà versés. Les arômes et la couleur peuvent évoluer ; leur intensité exacte n’est pas chiffrable ici.'
  };
}

export function lastWortPair(state: BrewDayState, stepId: string) {
  const rs = (state.readings ?? []).filter((r) => r.stepId === stepId).sort((a, b) => b.at - a.at);
  const volume = rs.find((r) => r.kind === 'volume'),
    gravity = rs.find((r) => r.kind === 'densite');
  if (volume && gravity) {
    const first = Math.min(volume.at, gravity.at),
      last = Math.max(volume.at, gravity.at);
    if (
      Object.entries(state.additions ?? {}).some(
        ([id, a]) =>
          /^(water-|grain-)/.test(id) &&
          a.amount > 0 &&
          a.doneAt != null &&
          a.doneAt > first &&
          a.doneAt <= last
      )
    )
      return null;
    if (
      stepId === 'preboil' &&
      state.boilStartedAt != null &&
      state.boilStartedAt > first &&
      state.boilStartedAt <= last
    )
      return null;
  }
  return volume &&
    gravity &&
    volume.roomTemp &&
    gravity.roomTemp &&
    volume.value > 0 &&
    gravity.value > 1 &&
    Math.abs(volume.at - gravity.at) <= 30 * 60000
    ? { volume, gravity }
    : null;
}

export function wortRescue(
  state: BrewDayState,
  stepId: string,
  targetOg?: number,
  recipe?: RecipeSnapshot
) {
  const pair = lastWortPair(state, stepId);
  if (!pair || !targetOg || targetOg <= 1) return null;
  const preboil = stepId === 'preboil';
  const extract =
    preboil && recipe
      ? laterExtract(recipe, state, Math.min(pair.volume.at, pair.gravity.at))
      : { pointsLitres: 0, names: [] };
  if (extract.pointsLitres == null) return null;
  const pointsLitres = pair.volume.value * (pair.gravity.value - 1) * 1000 + extract.pointsLitres;
  const targetL = pointsLitres / ((targetOg - 1) * 1000);
  const rate=state.boilOffLPerHour??recipe?.brewhouse?.equipment?.boilOffLPerHour;
  const evaporationL =
    preboil && rate != null && recipe
      ? (rate * (1-(recipe.brewhouse?.equipment?.coolingShrinkagePct??0)/100) * boilMinutes(state, recipe)) / 60
      : null;
  const actionDeltaL = preboil
    ? evaporationL == null
      ? null
      : targetL + evaporationL - pair.volume.value
    : targetL - pair.volume.value;
  return {
    targetL,
    deltaL: targetL - pair.volume.value,
    actionDeltaL,
    evaporationL,
    extract,
    pointsLitres,
    message:
      preboil && actionDeltaL == null
        ? 'C’est le volume final théorique. Renseigne l’évaporation pour calculer un appoint avant ébullition : diluer directement à l’OG finale maintenant ignorerait la concentration à venir.'
        : actionDeltaL! < 0
          ? 'Concentrer par évaporation peut atteindre la densité, au prix d’un volume plus faible. Vérifie le programme houblon avant de prolonger.'
          : 'Un appoint dilue à la cible mais dilue aussi l’amertume et les minéraux. Après refroidissement, utilise une eau adaptée et du matériel désinfecté.'
  };
}

export function readingPrompt(step: BrewDayStep, state: BrewDayState, now: number) {
  const rs = (state.readings ?? []).filter((r) => r.stepId === step.id);
  const missing = (kind: string) => !rs.some((r) => r.kind === kind);
  const latestPh = rs.filter((r) => r.kind === 'ph').sort((a, b) => b.at - a.at)[0];
  const latestAcid = (state.acidCorrections ?? [])
    .filter((c) => c.stepId === step.id)
    .sort((a, b) => b.at - a.at)[0];
  if (['preboil', 'ensemencement'].includes(step.id) && (missing('volume') || missing('densite')))
    return {
      kind: missing('volume') ? 'volume' : 'densite',
      title: 'Volume + densité',
      detail:
        step.id === 'preboil'
          ? 'Le même moût, avant les houblons : c’est encore le moment de corriger volume et concentration.'
          : 'Mesure le volume en fermenteur et l’OG sur le moût refroidi.'
    };
  if (
    /^mash/.test(step.id) &&
    step.tempC &&
    step.tempC < 75 &&
    step.startedAt != null &&
    now - step.startedAt >= 10 * 60000 &&
    (!latestPh ||
      !latestPh.roomTemp ||
      (latestAcid && latestAcid.at >= latestPh.at && now - latestAcid.at >= 5 * 60000))
  )
    return {
      kind: 'ph',
      title: 'Contrôle de pH',
      detail: 'Prélève un échantillon refroidi à 20–25 °C avant toute correction.'
    };
  if (step.rampStartedAt != null || ['refroidissement', 'whirlpool', 'sparge'].includes(step.id)) {
    const last = thermalSamples(state, step, now).at(-1);
    const interval = thermalWindow(activeThermalSegment(state, step.id)?.method ?? 'heating').nextReadingMin;
    if (!last || now - last.at >= interval * 60000)
      return {
        kind: 'temperature',
        title: 'Relevé de température',
        detail:
          step.id === 'sparge'
            ? 'Contrôle l’eau de rinçage à sa consigne avant de la verser.'
            : `Une mesure du moût toutes les ${interval} min rend la progression et l’arrivée estimée plus utiles.`
      };
  }
  return null;
}

export const pitchFeedback = pitchTemperatureFeedback;
