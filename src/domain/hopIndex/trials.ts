import type { HopTrial } from '../../../functions/src/hopTrialSchema';
import type { HopRange } from '../../../functions/src/hopIndexSchema';
import type { Recipe, RecipeSnapshot, HopIngredient } from '../../types';

export type TrialRecipe = Recipe | RecipeSnapshot;
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const point = (range: HopRange | undefined) => range && range.min === range.max ? range.min : undefined;
export const recipeHopTiming = (h: HopIngredient) => h.stage === 'dryHop' ? h.aromaTiming : h.stage;
export const withinTrialRange = (value: unknown, range: HopRange | undefined) => {
  if (!finite(value) || !range) return false;
  // Floating point roundoff from dose × volume ÷ volume; not a biological tolerance.
  const roundoff = Number.EPSILON * Math.max(1, Math.abs(value), Math.abs(range.min), Math.abs(range.max)) * 4;
  return value >= range.min - roundoff && value <= range.max + roundoff;
};

/** Convert an explicitly adopted experimental programme to recipe amounts, not aroma. */
export function adoptHopTrial<T extends TrialRecipe>(recipe: T, trial: HopTrial): T {
  if (!finite(recipe.volumeL) || recipe.volumeL <= 0) throw Error('Renseigne le volume de la recette avant de reprendre ce programme.');
  if (trial.hops.some(h => point(h.doseGL.range) === undefined)) throw Error('Cet essai publie une plage de doses. Choisis tes doses dans la recette, sans moyenne automatique.');
  const hops = trial.hops.map(h => {
    const contact = h.boilStart && finite(recipe.boilMin) && recipe.boilMin > 0 ? recipe.boilMin / 60 : point(h.contactHours?.range), temp = point(h.temperatureC?.range);
    const dry = h.timing === 'fermentation' || h.timing === 'postFermentation';
    return { name: h.name, hopVarietyId: h.varietyId, weightG: point(h.doseGL.range)! * recipe.volumeL,
      alpha: 0, stage: dry ? 'dryHop' : h.timing,
      ...(dry ? { aromaTiming: h.timing } : {}),
      ...(contact !== undefined ? { aromaContactHours: contact, ...(!dry ? { timeMin: contact * 60 } : {}) } : {}),
      ...(temp !== undefined ? { aromaTemperatureC: temp, ...(h.timing === 'whirlpool' ? { tempC: temp } : {}) } : {})
    } as HopIngredient;
  });
  return { ...recipe, hops, hopTrialId: trial.id, hopMatrixId: undefined, hopPredictionIds: undefined,
    yeast: { name: trial.yeastName, hopIndexId: trial.yeastId, form: trial.yeastForm, qty: 0,
      unit: trial.yeastForm === 'sèche' ? 'sachet' : 'flacon' }
  };
}

export interface TrialDifference { label: string; status: 'same' | 'changed' | 'unknown'; detail: string }
/** Comparison of conditions only. No count, percentage or distance is an aroma score. */
export function compareHopTrial(recipe: TrialRecipe, trial: HopTrial): TrialDifference[] {
  const diffs: TrialDifference[] = [{ label: 'Souche', status: !recipe.yeast?.hopIndexId ? 'unknown' : recipe.yeast.hopIndexId === trial.yeastId ? 'same' : 'changed',
    detail: `${recipe.yeast?.name || 'À choisir'} · essai : ${trial.yeastName}` }];
  diffs.push({ label: 'Nombre d’ajouts', status: recipe.hops.length === trial.hops.length ? 'same' : 'changed', detail: `${recipe.hops.length} ajout(s) dans la recette ; ${trial.hops.length} dans l’essai.` });
  const used = new Set<number>();
  trial.hops.forEach(h => {
    // Multiset matching: reordering lines does not change a programme, but extra/split additions do.
    const index = recipe.hops.findIndex((r, i) => !used.has(i) && r.hopVarietyId === h.varietyId && recipeHopTiming(r) === h.timing);
    const r = recipe.hops[index]; if (r) used.add(index);
    diffs.push({ label: h.name, status: r ? 'same' : 'changed', detail: r ? 'Référence et phase identiques.' : 'Référence ou phase différente / non associée.' });
    if (!r) return;
    const dose = recipe.volumeL > 0 ? r.weightG / recipe.volumeL : undefined;
    const label = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
    diffs.push({ label: `Dose · ${h.name}`, status: !finite(dose) || !dose ? 'unknown' : withinTrialRange(dose, h.doseGL.range) ? 'same' : 'changed', detail: `Recette : ${finite(dose) ? label(dose) : '?'} g/L · essai : ${label(h.doseGL.range.min)}${h.doseGL.range.max !== h.doseGL.range.min ? `–${label(h.doseGL.range.max)}` : ''} g/L.` });
    const temp = r.aromaTemperatureC ?? r.tempC;
    const contact = r.aromaContactHours ?? (r.stage !== 'dryHop' && finite(r.timeMin) ? r.timeMin / 60 : undefined);
    if (h.boilStart) diffs.push({ label: `Début d’ébullition · ${h.name}`,
      status: !finite(contact) || !finite(recipe.boilMin) || recipe.boilMin <= 0 ? 'unknown' : withinTrialRange(contact * 60, { min: recipe.boilMin, max: recipe.boilMin }) ? 'same' : 'changed',
      detail: `Essai : au début de l’ébullition. Recette : ${finite(contact) ? label(contact * 60) : '?'} min avant la fin, pour ${finite(recipe.boilMin) ? label(recipe.boilMin) : '?'} min d’ébullition totale.` });
    for (const [label, actual, expected] of [['Contact (°C)', temp, h.temperatureC?.range], ['Contact (h)', contact, h.contactHours?.range]] as const)
      diffs.push({ label: `${label} · ${h.name}`, status: !expected || !finite(actual) ? 'unknown' : withinTrialRange(actual, expected) ? 'same' : 'changed', detail: !expected ? 'Non publié dans cet essai.' : !finite(actual) ? 'À préciser dans la recette.' : 'Comparaison au protocole publié.' });
  });
  // A strain's nominal temperature window is not the actual fermentation programme.
  const primary = recipe.fermentation?.find(s => s.kind === 'primaire')?.tempC;
  const expected = trial.fermentationC?.range;
  diffs.push({ label: 'Fermentation', status: !expected || !finite(primary) ? 'unknown' : withinTrialRange(primary, expected) ? 'same' : 'changed', detail: `${finite(primary) ? `Fermentation primaire de la recette : ${primary.toLocaleString('fr')} °C.` : 'Fermentation primaire à renseigner.'} ${expected ? `Condition retenue dans ce repère : ${expected.min.toLocaleString('fr')}${expected.max !== expected.min ? `–${expected.max.toLocaleString('fr')}` : ''} °C ; les autres conditions étudiées restent décrites dans ses limites.` : 'Température de l’essai non publiée.'}` });
  diffs.push({ label: 'Matrice, lots et forme', status: 'unknown', detail: 'Grist, lot, forme du houblon, clarification et conduite complète à comparer. Aucune équivalence automatique.' });
  return diffs;
}
