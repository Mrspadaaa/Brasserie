import { BrewDayState, BrewDayStep, RecipeSnapshot, WaterIons } from '../types';
import { BrewingMath } from '../services/brewingMath';
import { boilMinutes, brewBitterness, effectiveFermentables } from './brewCompanion';
import { ionsFromSalts, addIons, ionsAfterAcid } from './water';
import { equipmentErrors } from './brewEquipment';

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const median = (values: number[]) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
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
  const initialTapFraction = 1 - (p.diRatioPct ?? 0) / 100;
  const source =
    p.sourceSnapshot ??
    (p.startIons && initialTapFraction > 0
      ? (Object.fromEntries(
          Object.entries(p.startIons).map(([k, v]) => [k, v / initialTapFraction])
        ) as unknown as WaterIons)
      : undefined);
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

/** Latest observations of the same vessel/step; never mix mash and cooling probes. */
export function thermalEstimate(
  state: BrewDayState,
  step: BrewDayStep,
  target: number,
  now: number,
  coolantC?: number,
  fallbackRate?: number
) {
  const samples = (state.readings ?? [])
    .filter(
      (r) =>
        r.kind === 'temperature' &&
        r.stepId === step.id &&
        finite(r.value) &&
        finite(r.at) &&
        r.at <= now + 1000 &&
        (step.rampStartedAt == null || r.at >= step.rampStartedAt)
    )
    .sort((a, b) => a.at - b.at);
  const points = samples.filter((r, i) => i === 0 || r.at > samples[i - 1].at).slice(-6);
  const last = points.at(-1);
  const cooling = ['refroidissement', 'ensemencement', 'whirlpool'].includes(step.id);
  const basis = { points, last, cooling, target };
  if (!last)
    return {
      ...basis,
      status: 'measure' as const,
      message: 'Relève la température du moût pour établir le point de départ.'
    };
  if (now - last.at > 15 * 60000)
    return {
      ...basis,
      status: 'stale' as const,
      message: 'Le dernier relevé a plus de 15 min : remesure avant de projeter l’arrivée.'
    };
  if (cooling && last.value < target - 0.5)
    return {
      ...basis,
      status: 'below' as const,
      message:
        step.id === 'whirlpool'
          ? 'Le moût est sous la consigne de whirlpool : consigne la température réelle de contact. L’extraction des houblons change ; prolonger automatiquement ne reproduit pas le programme prévu.'
          : 'Le moût est sous la consigne. Vérifie la plage de la levure et homogénéise avant de décider d’ensemencer ; la température cible n’est pas confirmée.'
    };
  if (Math.abs(last.value - target) <= 0.5)
    return {
      ...basis,
      status: 'reached' as const,
      minutes: 0,
      message:
        'Consigne atteinte sur le dernier relevé. Homogénéise et confirme avant de poursuivre.'
    };
  if (!cooling && last.value > target + 0.5)
    return {
      ...basis,
      status: 'overshoot' as const,
      message: `Le dernier relevé dépasse la consigne de ${round(last.value - target)} °C. Réduis ou coupe la chauffe, homogénéise et remesure. Si le maintien a déjà commencé, consigne l’écart ; ne rallonge pas automatiquement le palier.`
    };
  if (cooling && finite(coolantC) && target <= coolantC + 0.5)
    return {
      ...basis,
      status: 'unreachable' as const,
      message: `L’eau de refroidissement à ${coolantC} °C ne permet pas d’atteindre ${target} °C avec une marge utile. Passe à un circuit plus froid ou termine dans une enceinte adaptée.`
    };
  const slopes: number[] = [];
  const rates: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      dt = (b.at - a.at) / 60000;
    if (dt < 0.5 || dt > 30) continue;
    slopes.push((b.value - a.value) / dt);
    if (
      cooling &&
      finite(coolantC) &&
      a.value > coolantC &&
      b.value > coolantC &&
      b.value < a.value
    )
      rates.push(Math.log((a.value - coolantC) / (b.value - coolantC)) / dt);
  }
  const slope = slopes.length ? median(slopes) : undefined;
  const previous = points.at(-2);
  const recentDt = previous ? (last.at - previous.at) / 60000 : 0;
  const recentSlope =
    recentDt >= 2 && recentDt <= 30 ? (last.value - previous!.value) / recentDt : undefined;
  const stalled = (v: number | undefined) => v != null && (cooling ? v >= -0.05 : v <= 0.05);
  if (stalled(slope) || stalled(recentSlope))
    return {
      ...basis,
      status: 'stalled' as const,
      message: cooling
        ? 'La baisse ralentit fortement ou s’arrête. Vérifie débit, température du fluide et circulation du moût ; remesure dans 5 min.'
        : 'La chauffe progresse peu. Vérifie la puissance, la circulation et la position de la sonde. Le palier ne démarre pas tant que la maische n’est pas à la consigne.'
    };
  let minutes: number | undefined;
  let model: string;
  if (cooling) {
    model = 'Refroidissement exponentiel';
    if (!finite(coolantC))
      return {
        ...basis,
        status: 'measure' as const,
        message:
          'Renseigne la température de l’eau de refroidissement. Une extrapolation linéaire devient trop optimiste près de la consigne.'
      };
    if (rates.length)
      minutes = Math.log((last.value - coolantC) / (target - coolantC)) / median(rates);
  } else {
    model = slopes.length ? 'Vitesse observée' : 'Repère du matériel';
    const rate = slope ?? fallbackRate;
    if (rate && rate > 0) minutes = (target - last.value) / rate;
  }
  if (!finite(minutes) || minutes < 0 || minutes > 240)
    return {
      ...basis,
      status: 'measure' as const,
      message:
        'Deux relevés espacés sont nécessaires ; au-delà de 4 h la projection est trop incertaine. Reprends une mesure dans 5 min.'
    };
  const elapsed = (now - last.at) / 60000;
  if (elapsed > minutes)
    return {
      ...basis,
      status: 'measure' as const,
      message:
        'La fenêtre estimée est passée : relève la température, la consigne n’est pas confirmée automatiquement.'
    };
  const remaining = Math.max(0, minutes - elapsed);
  return {
    ...basis,
    status: 'estimate' as const,
    minutes: remaining,
    low: Math.max(1, Math.floor(remaining * 0.75)),
    high: Math.ceil(remaining * 1.35 + 1),
    model,
    message:
      'Fenêtre indicative si débit, puissance et brassage restent identiques. Confirme toujours par un relevé.'
  };
}

export function rampExposure(state: BrewDayState, step: BrewDayStep) {
  if (step.rampStartedAt == null) return 0;
  const points = (state.readings ?? [])
    .filter(
      (r) =>
        r.stepId === step.id &&
        r.kind === 'temperature' &&
        r.at >= step.rampStartedAt! &&
        ((step.holdStartedAt ?? step.startedAt) == null ||
          r.at <= (step.holdStartedAt ?? step.startedAt)!)
    )
    .sort((a, b) => a.at - b.at);
  let enzymeMinutes = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      dt = (b.at - a.at) / 60000;
    if (dt <= 0 || dt > 30) continue;
    const low = Math.min(a.value, b.value),
      high = Math.max(a.value, b.value);
    const fraction =
      high === low
        ? low >= 58 && low <= 72
          ? 1
          : 0
        : Math.max(0, Math.min(72, high) - Math.max(58, low)) / (high - low);
    enzymeMinutes += dt * fraction;
  }
  return round(enzymeMinutes);
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
    const last = rs.filter((r) => r.kind === 'temperature').sort((a, b) => b.at - a.at)[0];
    if (!last || now - last.at >= 5 * 60000)
      return {
        kind: 'temperature',
        title: 'Relevé de température',
        detail:
          step.id === 'sparge'
            ? 'Contrôle l’eau de rinçage à sa consigne avant de la verser.'
            : 'Une mesure toutes les 5 min rend la progression et l’arrivée estimée plus utiles.'
      };
  }
  return null;
}

export function pitchFeedback(recipe: RecipeSnapshot, temp: number) {
  const y = recipe.yeast,
    target = y?.pitchTempC ?? recipe.fermentation?.[0]?.tempC;
  if (!finite(target)) return 'Consigne de levure absente : consulte sa fiche avant d’ensemencer.';
  if (y?.fermTempMaxC != null && temp > y.fermTempMaxC)
    return 'Au-dessus de la plage renseignée de la levure : continue le refroidissement avant d’ensemencer. Un départ trop chaud peut favoriser des arômes indésirables.';
  if (temp > target + 1)
    return 'Encore au-dessus de la consigne. Ce n’est pas une preuve de brassin perdu : termine le refroidissement, garde le matériel désinfecté et confirme la température avant la levure.';
  if (y?.fermTempMinC != null && temp < y.fermTempMinC)
    return 'En dessous de la plage renseignée : le démarrage peut être ralenti. Ramène progressivement le moût à la consigne.';
  if (y?.fermTempMinC == null && temp < target - 2)
    return 'Sous la consigne du brassin : vérifie la fiche levure avant d’ensemencer. Sa plage de travail n’est pas renseignée ici.';
  return 'Température proche de la consigne ou dans la plage renseignée. Vérifie homogénéité et conditions de la fiche levure.';
}
