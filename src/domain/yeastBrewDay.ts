import type { BrewDayReading, BrewDayState } from '../types';
import type { TrialRecipe } from './hopIndex/trials';
import type { YeastReference } from './yeastReferences';
import { READING } from './brewDay';
import { pitchingPlan } from './pitchingPlan';
import { yeastStrainInformation } from './yeastStrainInformation';
import { createYeastRecipeDraft, evaluateYeastRecipeDesign, readYeastRecipeDesign, yeastRecipeDesignChanged, yeastRecipeFormWarning, YEAST_RECIPE_GOAL_LABELS } from './yeastRecipeDesign';

export type YeastBrewPhase = 'preparation' | 'mash' | 'boil' | 'finish' | 'recipe';
export interface YeastBrewInstruction { id: string; title: string; detail: string; warning?: boolean }
const known = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const fmt = (n?: number, digits = 1) => known(n) ? n.toLocaleString('fr-FR', { maximumFractionDigits: digits }) : '—';

/** Recipe is the batch's frozen recipe. Measurements remain separate; this helper never writes a journal event. */
export function buildYeastBrewDay(recipe: TrialRecipe, state: BrewDayState, phase: YeastBrewPhase, refs: YeastReference[]) {
  if (recipe.nolo?.enabled || !recipe.yeast?.name) return null;
  const intent = readYeastRecipeDesign(recipe);
  const draft = createYeastRecipeDraft(recipe, refs);
  const analysis = evaluateYeastRecipeDesign(recipe, draft, refs);
  const stale = !!intent && yeastRecipeDesignChanged(recipe, intent);
  const instructions: YeastBrewInstruction[] = [];
  const readings = (state.readings ?? []).filter(r => known(r.value) && known(r.at)).sort((a, b) => b.at - a.at);
  const final = (kind: BrewDayReading['kind']) => readings.find(r => r.kind === kind &&
    r.value >= READING[kind].min && r.value <= READING[kind].max &&
    (kind === 'volume' ? r.stepId === 'ensemencement' : ['refroidissement', 'ensemencement'].includes(r.stepId ?? '')) &&
    r.unit === (kind === 'temperature' ? '°C' : kind === 'volume' ? 'L' : 'SG'));
  const measured = { temperature: final('temperature'), volume: final('volume'), gravity: final('densite') };
  const quantityKnown = known(recipe.yeast.qty) && recipe.yeast.qty > 0 && !!recipe.yeast.unit;
  const quantity = quantityKnown ? `${recipe.yeast.qty!.toLocaleString('fr-FR', { maximumFractionDigits: 20 })} ${recipe.yeast.unit}` : 'Quantité à préciser';
  const pitchRecorded = known(state.pitchedAt) || known(state.steps.find(s => s.id === 'ensemencement')?.doneAt);
  const actualYeast = state.additions?.yeast;
  const pitchQuantitySummary = !pitchRecorded ? `Prévu : ${quantity}`
    : state.pitchQuantityConfirmation === 'measured' && actualYeast ? `Réel mesuré : ${fmt(actualYeast.amount)} ${actualYeast.unit ?? recipe.yeast.unit ?? 'unité inconnue'} · prévu ${quantity}`
      : state.pitchQuantityConfirmation === 'planned' && actualYeast ? `Quantité prévue explicitement ajoutée : ${fmt(actualYeast.amount)} ${actualYeast.unit ?? recipe.yeast.unit ?? 'unité inconnue'}`
        : state.pitchQuantityConfirmation === 'starter-transferred' ? `Culture du starter transférée${actualYeast ? ` · ${fmt(actualYeast.amount)} ${actualYeast.unit ?? 'L'} relevés` : ' · volume non relevé'} · dose de recette ${quantity}`
          : state.pitchQuantityConfirmation === 'unmeasured' ? `Quantité réelle non mesurée · dose prévue ${quantity}`
            : actualYeast ? `Valeur du journal : ${fmt(actualYeast.amount)} ${actualYeast.unit ?? 'unité inconnue'} · mode ancien non renseigné · prévu ${quantity}`
              : `Quantité réelle non renseignée · prévu ${quantity}`;
  const pressure = draft.pressureBar;
  const formWarning = yeastRecipeFormWarning(recipe, analysis.candidate?.reference);
  const confirmedDry = recipe.yeast.form === 'sèche' && analysis.candidate?.reference.form === 'sèche';
  if (phase === 'preparation' || phase === 'recipe') instructions.push({ id: 'prepare', title: `Préparer ${quantityKnown ? quantity : 'la levure'}`,
    detail: `${recipe.yeast.form || 'Forme à préciser'}. ${quantityKnown ? 'Conserver les conditions de préparation de la notice du lot.' : 'Renseigner la quantité et son unité avant l’ensemencement ; aucun sachet ni nombre de cellules n’est supposé.'}`, warning: !quantityKnown });
  if (phase === 'mash' || phase === 'recipe') {
    const steps = recipe.mash?.steps ?? [], sacch = steps.findIndex(s => known(s.tempC) && s.tempC >= 60 && s.tempC <= 75 && s.durationMin > 0);
    const rest = steps.find((s, i) => i < sacch && s.tempC >= 43 && s.tempC <= 45 && s.durationMin > 0 && !steps.slice(0, i).some(p => p.tempC >= 60));
    if (rest) instructions.push({ id: 'ferulic', title: `Repos prévu · ${fmt(rest.tempC)} °C pendant ${fmt(rest.durationMin)} min`,
      detail: 'Avant la saccharification. Il prépare des précurseurs du girofle ; son expression dépend aussi de la souche. Aucun gain d’intensité n’est quantifié.' });
    else if (intent?.ferulicRest) instructions.push({ id: 'ferulic-missing', title: 'Repos férulique demandé, absent du programme actuel', detail: 'Vérifier les paliers du brassin avant de chauffer. Le réglage adopté ne remplace pas le programme réel.', warning: true });
  }
  if (phase === 'finish' || phase === 'recipe') {
    const pitchPlan = pitchingPlan(recipe as import('../types').RecipeSnapshot, state);
    const recordedQuantityDetail = state.pitchQuantityConfirmation == null
      ? 'Une valeur historique sans mode reste qualifiée comme telle ; une quantité réelle absente n’est pas remplacée par le prévu.'
      : state.pitchQuantityConfirmation === 'unmeasured'
        ? 'L’ajout est déclaré sans quantité. Le prévu ne devient pas une mesure et la consommation reste à régulariser.'
        : 'Le mode réel est consigné séparément du prévu ; la recette figée reste inchangée.';
    instructions.push({ id: 'pitch', title: pitchRecorded ? `Ensemencement consigné · ${pitchQuantitySummary}` : state.phase === 'awaiting-pitch' ? `En attente de levure · cible ${fmt(pitchPlan.targetC)} °C · ${quantity}` : known(pitchPlan.targetC) ? `Ensemencer à ${fmt(pitchPlan.targetC)} °C · ${quantity}` : `Température d’ensemencement à préciser · ${quantity}`,
      detail: pitchRecorded ? `Consigne principale prévue : ${fmt(pitchPlan.primaryC)} °C. ${recordedQuantityDetail}` : pitchPlan.warning ?? `Vérifier la température du moût et la méthode choisie pour ${recipe.yeast.name}. Consigne principale : ${fmt(pitchPlan.primaryC)} °C. Le transfert seul ne commence pas la fermentation.`, warning: !known(pitchPlan.targetC) || !quantityKnown || !!pitchPlan.warning });
    instructions.push({ id: 'pressure', title: pressure === undefined ? 'Pression précoce à préciser' : pressure === 0 ? 'Départ sans contre-pression · 0 bar rel.' : `Pression précoce prévue · ${fmt(pressure)} bar rel.`,
      detail: pressure === undefined ? 'Aucune valeur n’est déduite de la carbonatation finale.' : 'Réglage prévu pour le début de fermentation, distinct de la carbonatation finale. La pression peut modifier l’expression des esters.' });
    if (analysis.hops.additions.length) instructions.push({ id: 'dry-hop', title: `À cru prévu · ${fmt(analysis.hops.doseGL)} g/L`,
      detail: `${analysis.hops.unknownCount ? `${analysis.hops.unknownCount} phase${analysis.hops.unknownCount > 1 ? 's' : ''} à préciser. ` : ''}Contrôler la stabilité de la densité et la maturation après le dernier ajout ; un jour du calendrier ne confirme pas la fin de fermentation.`, warning: analysis.hops.unknownCount > 0 });
  }
  // A manufacturer's mass range can be recalculated from an observed fermenter volume,
  // but that observation never changes the planned dose or the frozen recipe.
  const observedDose = confirmedDry && measured.volume && measured.volume.value > 0
    ? evaluateYeastRecipeDesign({ ...recipe, volumeL: measured.volume.value }, draft, refs).doseG : undefined;
  return { name: recipe.yeast.name, goal: intent && intent.goalExplicit !== false ? YEAST_RECIPE_GOAL_LABELS[intent.goal] : undefined, stale, phase,
    strainInformation: yeastStrainInformation(analysis.candidate?.reference, recipe.yeast.form),
    quantity, pitchQuantitySummary, primaryTemperatureC: draft.temperatureC, primaryDays: draft.days, pressureBar: pressure, instructions, measured,
    formWarning, plannedDoseG: confirmedDry ? analysis.doseG : undefined, observedDoseG: observedDose, hops: analysis.hops, sources: analysis.sources };
}
