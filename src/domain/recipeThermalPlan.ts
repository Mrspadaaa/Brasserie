import type { Recipe, RecipeSnapshot, TempStep } from '../types';

const nonNegative = (value: number | undefined) =>
  value != null && Number.isFinite(value) && value >= 0 ? value : undefined;
const temperature = (value: number | undefined) =>
  value != null && Number.isFinite(value) && value >= 0 && value <= 100 ? value : undefined;

export function recipeThermalPlan(recipe: Recipe | RecipeSnapshot) {
  const mash = recipe.mash;
  const steps: TempStep[] = [...(mash?.steps ?? [])];
  if (mash?.mashoutEnabled !== false && mash?.mashoutTempC != null && !steps.some(s => /mash.?out/i.test(s.name)))
    steps.push({ name: 'Mash-out', tempC: mash.mashoutTempC, durationMin: mash.mashoutDurationMin ?? 10 });
  const rate = mash?.heatingRateCPerMin ?? recipe.brewhouse?.equipment?.heatingRateCPerMin;
  const knownRate = rate != null && Number.isFinite(rate) && rate > 0;
  // A cleared draft field is unknown, never a zero-minute hold or a valid ramp.
  // Keep the entered recipe intact; only the derived plan uses optional values.
  const rows = steps.map((step,index) => {
    const tempC = temperature(step.tempC);
    const fromC = index ? temperature(steps[index-1].tempC) : undefined;
    return { ...step, tempC, fromC, durationMin: nonNegative(step.durationMin),
      rampMin: knownRate && tempC != null && fromC != null && tempC >= fromC
        ? nonNegative((tempC-fromC)/rate) : undefined };
  });
  const holdMin = rows.every(row => row.durationMin != null)
    ? nonNegative(rows.reduce((sum,row) => sum + row.durationMin!, 0)) : undefined;
  const rampMin = rows.slice(1).every(row => row.rampMin != null)
    ? nonNegative(rows.reduce((sum,row) => sum + (row.rampMin ?? 0), 0)) : undefined;
  const incomplete = holdMin == null || rows.some(row => row.tempC == null || row.durationMin == null);
  const grains = (recipe.fermentables ?? []).filter(f => f.kind === 'grain' && f.use === 'empatage');
  const grainKg = grains.reduce((s,f)=>s+f.weightKg,0);
  const wheatOatKg = grains.filter(f=>/wheat|weizen|bl[ée]|oat|avoine|hafer/i.test(f.name)).reduce((s,f)=>s+f.weightKg,0);
  const ratio = grainKg > 0 && recipe.waterPlan ? recipe.waterPlan.mashWaterL/grainKg : mash?.ratioLPerKg;
  const mashoutIndex = rows.findIndex(s => /mash.?out/i.test(s.name));
  const canConsiderSkipping = !incomplete && !recipe.nolo?.enabled && mashoutIndex === rows.length-1 && mashoutIndex > 0 &&
    grains.every(grain => nonNegative(grain.weightKg) != null) && Number.isFinite(grainKg) && grainKg > 0 &&
    ratio != null && Number.isFinite(ratio) && ratio >= 3 && wheatOatKg/grainKg < 0.25;
  const mashout = rows[mashoutIndex];
  return {
    rows, rate: knownRate ? rate : undefined,
    holdMin, rampMin, incomplete, canConsiderSkipping,
    beforeFiltrationSavedMin: canConsiderSkipping && mashout.rampMin != null && mashout.durationMin != null
      ? nonNegative(mashout.rampMin+mashout.durationMin) : undefined
  };
}

/** Deliberate program choice; leaves the original recipe untouched. */
export function withoutMashout<T extends Recipe | RecipeSnapshot>(recipe: T): T {
  if (!recipeThermalPlan(recipe).canConsiderSkipping || !recipe.mash) return recipe;
  const removed = recipe.mash.steps.find(s => /mash.?out/i.test(s.name));
  return { ...recipe, mash: { ...recipe.mash,
    ...(removed ? {mashoutTempC:removed.tempC,mashoutDurationMin:removed.durationMin} : {}),
    steps: recipe.mash.steps.filter(s => !/mash.?out/i.test(s.name)), mashoutEnabled: false } };
}
