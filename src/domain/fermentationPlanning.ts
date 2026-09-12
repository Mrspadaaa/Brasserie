import { recipeIbu } from './hopBitterness';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import type { HopSource } from '../../functions/src/hopIndexSchema';
import type { NoloScience, NoloStrain } from '../../functions/src/noloSchema';
import { scenarioPlato } from '../../functions/src/noloScenario';
import { agreedFermentationFact } from '../../functions/src/fermentationContext';
import type { TrialRecipe } from './hopIndex/trials';
import type { Recipe } from '../types';
import { resolveFermentationYeast } from './fermentationScenario';
import { yeastReferences } from './yeastReferences';
import { evaluateNoloRecipe, applyNoloStrain, noloScience, noloPlanningSource } from './nolo';
import { BrewingMath } from '../services/brewingMath';
import { refreshCompanionRecipe } from './brewerRecipeRefresh';
import { replanRecipeWater } from './recipeWater';
import { resolveBrewingStyle } from './brewingStyles';
import { noloYeastCandidates, noloYeastProcessSources } from './noloYeastSelection';

export const FERMENTATION_PLANNER_VERSION = 'fermentation-planner-v1';
export interface FermentationDiagnostic {
  id: string; field: 'ingredients' | 'yeast' | 'mash' | 'fermentation' | 'fruit' | 'water' | 'packaging';
  severity: 'action' | 'notice'; message: string; source?: HopSource;
}
export const fermentationPlanningKey = (r: TrialRecipe) => JSON.stringify(r);
/** Actionable diagnoses are separate from the historical numerical evaluator. */
export function fermentationReadiness(recipe: TrialRecipe, saved: HopKnowledge[] = []): FermentationDiagnostic[] {
  const out: FermentationDiagnostic[] = [];
  const add = (id: string, field: FermentationDiagnostic['field'], message: string, source?: HopSource, severity: FermentationDiagnostic['severity'] = 'action') => out.push({ id, field, message, source, severity });
  const yeast = resolveFermentationYeast(recipe, yeastReferences(saved));
  const science = recipe.nolo?.scienceSnapshot ?? noloScience(saved);
  const strain = science?.strains.find(s => s.yeastId === yeast?.id || s.yeastId === recipe.yeast.hopIndexId);
  const incomplete = recipe.fermentables.filter(f => f.weightKg > 0 && f.use !== 'fermentation' && !(f.potentialPpg > 0));
  if (incomplete.length && recipe.nolo?.process !== 'secondRunnings' && !recipe.nolo?.wort.ogPlato)
    add('extract', 'ingredients', `Potentiel PPG à compléter : ${incomplete.map(f => f.name).join(', ')}. L’OG et l’adaptation du grain attendent ces données.`);
  const colour = recipe.fermentables.filter(f => f.kind === 'grain' && f.weightKg > 0 && f.colorEbc == null);
  if (colour.length) add('colour', 'ingredients', `Couleur EBC à compléter : ${colour.map(f => f.name).join(', ')} pour évaluer le pH.`, undefined, 'notice');
  const restricted = recipe.nolo?.enabled && ['restricted', 'restored'].includes(recipe.nolo.process);
  if (restricted && !strain) add('strain', 'yeast', `${recipe.yeast.name || 'La souche'} n’a pas de fermentation limitée documentée dans le référentiel. Comparer les candidates NOLO ou changer de procédé.`);
  if (restricted && strain?.yeastId === science?.la01.yeastId && !science.la01.mash.every(p => recipe.mash?.steps.some(s => s.tempC === p.tempC && s.durationMin === p.minutes)))
    add('mash-protocol', 'mash', 'La relation LA-01 exige le programme d’empâtage de sa référence. Une proposition complète permet de le reprendre.', science.la01.source);
  const temperature = agreedFermentationFact(yeast, 'temperature', '°C');
  if (temperature && (recipe.yeast.fermTempMinC != null && recipe.yeast.fermTempMinC !== temperature.range.min || recipe.yeast.fermTempMaxC != null && recipe.yeast.fermTempMaxC !== temperature.range.max))
    add('temperature-reference', 'yeast', `Fiche saisie : ${recipe.yeast.fermTempMinC ?? '?'}–${recipe.yeast.fermTempMaxC ?? '?'} °C ; référence actuelle : ${temperature.range.min}–${temperature.range.max} °C. Valeurs personnelles conservées.`, temperature.source, 'notice');
  const range = strain?.temperatureC ?? temperature?.range;
  if (range && recipe.nolo?.process !== 'coldContact' && recipe.fermentation?.some(p => p.kind === 'primaire' && (p.tempC == null || p.tempC < range.min || p.tempC > range.max)))
    add('primary-temperature', 'fermentation', `Prévoir la fermentation primaire dans la plage ${range.min}–${range.max} °C, ou documenter l’écart.`, strain?.source ?? temperature?.source);
  const fruitStyle = resolveBrewingStyle(recipe.style, recipe.styleRef)?.id === 'fruit-lambic';
  if (fruitStyle && !recipe.fermentables.some(f => f.kind === 'fruit') && !recipe.nolo?.operations.some(o => o.kind === 'sugar'))
    add('fruit', 'fruit', 'Préciser le fruit et sa quantité ; ses sucres rejoindront le bilan alcoolique. Un arôme fruité de levure ne remplace pas cet apport.', undefined, 'notice');
  if (fruitStyle && !recipe.fermentationIntent?.acidity)
    add('acidity', 'fruit', 'Choisir comment obtenir l’acidité recherchée. Une levure de bière neutre ne reproduit pas à elle seule une fermentation de lambic.', undefined, 'notice');
  if (recipe.hops.some(h => h.stage === 'dryHop' && h.weightG > 0 && (!h.aromaTiming || h.aromaContactHours == null)))
    add('hop-contact', 'fermentation', 'Préciser la phase et le contact du houblonnage à cru pour simuler ses arômes.', undefined, 'notice');
  if (recipe.nolo?.enabled) {
    const result = evaluateNoloRecipe(recipe, saved);
    if (result && result.projection.max === null && !out.some(d => d.id === 'extract' || d.id === 'strain' || d.id === 'mash-protocol'))
      add('projection', 'fermentation', result.nextAction);
    if (!recipe.nolo.stabilization.method) add('stabilization', 'packaging', 'Prévoir stabilisation et analyse après conditionnement ; la durée et le froid ne valident pas la conservation.', undefined, 'notice');
  }
  return out;
}

export interface FermentationProposal {
  version: typeof FERMENTATION_PLANNER_VERSION; id: string; basis: string; strain: NoloStrain;
  recipe: TrialRecipe; changes: { label: string; before: string; after: string }[];
  diagnostics: FermentationDiagnostic[]; result: ReturnType<typeof evaluateNoloRecipe>;
  processFit: 'documented' | 'explore'; aromaFit: 'documented' | 'explore';
  goalMatches: string[];
  targetPlato: number | null; sources: HopSource[]; assumptions: string[];
}
const label = (n: number | null | undefined, unit = '') => n == null ? 'À renseigner' : `${n.toLocaleString('fr-FR', { maximumFractionDigits: 3 })}${unit ? ' ' + unit : ''}`;

/** Documentary text search only: these matches rank references, not intensities. */
function aromaMatches(recipe: TrialRecipe, strain: NoloStrain): string[] {
  const words = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const query = words(recipe.fermentationIntent?.aroma ?? '');
  const matches = strain.aroma.filter(description => query.split(/[^a-z]+/).some(w => w.length >= 4 && words(description).includes(w)));
  const phenolic = ['clove', 'balanced'].includes(recipe.nolo?.orientation ?? '') || /girofle|phenol|clou de/.test(query);
  if (phenolic && strain.pof === 'positive') matches.push('Potentiel phénolique documenté, intensité à vérifier');
  return [...new Set(matches)];
}

/** Local planning only. A target never becomes a sugar assay. All finite mass
 * changes are previewed; source measurements retain their old identity/basis. */
export function proposeNoloFermentation(recipe: TrialRecipe, strain: NoloStrain, science: NoloScience, saved: HopKnowledge[] = []): FermentationProposal {
  // Catalogue candidates beyond the original NOLO pack need the same frozen
  // source values when this legacy proposal is applied or later replayed.
  const edition = { ...science, strains: [...science.strains.filter(s => s.yeastId !== strain.yeastId), strain] };
  let next = applyNoloStrain(recipe, strain, edition);
  const references = yeastReferences(saved);
  const form = references.find(y => y.id === strain.yeastId)?.form
    ?? (strain.yeastId.startsWith('white-labs-wlp') ? 'liquide' : undefined);
  if (form) next.yeast.form = form;
  if (!strain.pitchGL && form === 'liquide') {
    const same = recipe.yeast.hopIndexId === strain.yeastId || resolveFermentationYeast(recipe, references)?.id === strain.yeastId;
    next.yeast = { ...next.yeast, qty: same ? recipe.yeast.qty : 0, unit: same ? recipe.yeast.unit : 'flacon' };
  }
  if (!strain.durationDays && strain.temperatureC && recipe.nolo?.process !== 'coldContact') {
    const temperature = (strain.temperatureC.min + strain.temperatureC.max) / 2;
    next.fermentation = (next.fermentation ?? []).map(p => p.kind === 'primaire'
      ? { ...p, tempC: temperature, note: [p.note, 'Température centrale de la référence ; durée existante conservée comme hypothèse à vérifier.'].filter(Boolean).join(' ') }
      : p);
  }
  next.nolo = {...next.nolo!, planning:{...next.nolo?.planning, version:1, source:next.nolo?.planning?.source ?? noloPlanningSource, exactExtract:true}};
  const assumptions = ['Réglages centraux des plages fabricant : choix de préparation éditable, pas optimum sensoriel.',
    'Carbonatation forcée proposée ; vérifier le matériel, stabiliser et analyser le produit conditionné.'];
  const sources = [strain.source, noloPlanningSource];
  const restricted = ['restricted', 'restored'].includes(recipe.nolo?.process ?? '');
  const targetPlato = restricted ? science.la01.plato.min : null;
  const diagnostics: FermentationDiagnostic[] = [];
  if (recipe.nolo?.process === 'coldContact') {
    // This is a process hypothesis, not the yeast's published fermentation
    // window or an extrapolation of the A15/Tdel8 alcohol measurements.
    next.yeast = { ...next.yeast, pitchTempC: 1 };
    next.fermentation = [{ kind: 'primaire', name: 'Contact à froid · essai pilote', tempC: 1, days: 2,
      note: 'Consigne pilote à ajuster : suivre alcool et aldéhydes. Aucun résultat de la souche A15 transféré à cette levure.' },
      ...(next.fermentation ?? []).filter(p => p.kind !== 'primaire' && p.kind !== 'reposDiacetyle')];
    assumptions.push('Contact proposé à 1 °C pendant 48 h : hypothèse de conduite éditable, hors de la plage fabricant de fermentation complète. Ni durée ni froid ne garantissent l’ABV ou la stabilité.');
    sources.push(noloYeastProcessSources.coldContact);
  }
  // Restricted candidates share a low-extract starting point. Only LA-01 owns
  // the experimental mash/ABV relation; it is never transferred to another yeast.
  if (targetPlato !== null) {
    sources.push(science.la01.source);
    assumptions.push(`Moût neuf proposé à ${targetPlato} °P : borne basse du domaine LA-01, point de départ d’essai pour les autres souches.`);
    const scalable = recipe.fermentables.filter(f => f.kind === 'grain' && (f.use ?? 'empatage') === 'empatage' && f.weightKg > 0);
    const points = BrewingMath.extractPoints(recipe.fermentables.filter(f => f.use !== 'fermentation'), recipe.volumeL, recipe.efficiencyPct ?? recipe.brewhouse?.efficiencyPct ?? 75, 'full');
    if (points && scalable.length && recipe.volumeL > 0 && science.planningModels) {
      // Invert the SAME monotone SG->Plato relation; no second conversion formula.
      let lo = 1, hi = 1.3;
      for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (scenarioPlato(mid, science)! < targetPlato) lo = mid; else hi = mid; }
      const scalablePoints = BrewingMath.extractPoints(scalable, recipe.volumeL, recipe.efficiencyPct ?? recipe.brewhouse?.efficiencyPct ?? 75, 'full')!;
      const factor = ((hi - 1) * 1000 - (points.total - scalablePoints.total)) / scalablePoints.total;
      if (Number.isFinite(factor) && factor > 0) next.fermentables = recipe.fermentables.map(f => scalable.includes(f) ? { ...f, weightKg: f.weightKg * factor } : f);
      else diagnostics.push({ id: 'fixed-extract', field: 'ingredients', severity: 'action', message: 'Les extraits ou sucres conservés dépassent déjà le moût cible : revoir ces ajouts avant de réduire le grain.' });
    } else diagnostics.push({ id: 'scale', field: 'ingredients', severity: 'action', message: 'Compléter les potentiels PPG pour calculer les masses du moût proposé ; aucune masse inventée.' });
    if (strain.yeastId === science.la01.yeastId) next.mash = { ...recipe.mash,
      steps: science.la01.mash.map(p => ({ name: 'Palier du protocole LA-01', tempC: p.tempC, durationMin: p.minutes })) };
  }
  if (strain.pitchGL && recipe.volumeL > 0) next.yeast.qty = recipe.volumeL * (strain.pitchGL.min + strain.pitchGL.max) / 2;
  if (!strain.pitchGL) diagnostics.push({ id: 'pitch', field: 'yeast', severity: 'action', message: 'Quantité à établir pour ce conditionnement : aucune masse de levure liquide supposée.' });
  if (!strain.durationDays && recipe.nolo?.process !== 'coldContact') diagnostics.push({ id: 'duration', field: 'fermentation', severity: 'action', message: 'Durée non publiée pour cette souche : calendrier conservé à vérifier par les mesures.' });
  next.carboTarget = 'Carbonatation forcée · CO₂ à choisir';
  next.totalGristKg = next.fermentables.filter(f => f.kind === 'grain').reduce((s, f) => s + f.weightKg, 0);
  if (JSON.stringify(next.fermentables) !== JSON.stringify(recipe.fermentables) && next.waterPlan) {
    const volume = BrewingMath.waterVolumes(next.totalGristKg, next.volumeL, { ...next.brewhouse, mashRatioLPerKg: next.mash?.ratioLPerKg ?? next.brewhouse?.mashRatioLPerKg }, next.mash?.spargeType, next.boilMin, next.hops.filter(h => h.stage !== 'dryHop').reduce((s, h) => s + h.weightG, 0));
    next.waterPlan = { ...next.waterPlan, mashWaterL: volume.mashWaterL, spargeWaterL: volume.spargeWaterL };
    next = refreshCompanionRecipe(next as Recipe);
    try { const water = replanRecipeWater(next); next.waterPlan = water.plan; water.warnings.forEach((message, i) => diagnostics.push({ id: 'water-' + i, field: 'water', severity: 'notice', message })); }
    catch (e) { diagnostics.push({ id: 'water', field: 'water', severity: 'action', message: e instanceof Error ? e.message : 'Traitement de l’eau à revoir.' }); }
  }
  const exactPoints = BrewingMath.extractPoints(next.fermentables.filter(f=>f.use!=='fermentation'), next.volumeL, next.efficiencyPct ?? next.brewhouse?.efficiencyPct ?? 75, 'full');
  next.ogTarget = exactPoints ? 1 + exactPoints.total / 1000 : null;
  next.fgTarget = null;
  next.ibuTarget = recipeIbu(next.hops, next.volumeL, next.ogTarget, next.boilMin) ?? undefined;
  const changes: FermentationProposal['changes'] = [];
  const change = (name: string, a: unknown, b: unknown, format = (x: any) => typeof x === 'string' ? x : JSON.stringify(x)) => {
    if (JSON.stringify(a) !== JSON.stringify(b)) changes.push({ label: name, before: format(a), after: format(b) });
  };
  change('Souche', recipe.yeast.name, next.yeast.name);
  change('Ensemencement', recipe.yeast, next.yeast, y => `${label(y.qty, y.unit)} · ${label(y.pitchTempC, '°C')}`);
  next.fermentables.forEach((f, i) => change(f.name, recipe.fermentables[i].weightKg, f.weightKg, n => label(n, 'kg')));
  change('Empâtage', recipe.mash?.steps, next.mash?.steps, s => s?.map(p => `${p.tempC} °C · ${p.durationMin} min`).join(' → ') || 'À renseigner');
  change('Fermentation', recipe.fermentation, next.fermentation, s => s?.map(p => `${p.name} ${label(p.tempC, '°C')} · ${label(p.days, 'j')}`).join(' → ') || 'À renseigner');
  change('Conditionnement', recipe.carboTarget ?? '', next.carboTarget);
  change('Eau et traitement', recipe.waterPlan, next.waterPlan, p => p ? `${label(p.mashWaterL, 'L empâtage')} + ${label(p.spargeWaterL, 'L rinçage')} · sels ${Object.entries(p.mash ?? {}).map(([k, v]) => `${k} ${label(v as number, 'g')}`).join(', ')} · acides ${label(p.acid?.mash)} / ${label(p.acid?.sparge)}` : 'À préparer');
  const goalMatches = aromaMatches(recipe, strain);
  return { version: FERMENTATION_PLANNER_VERSION, id: strain.yeastId, basis: fermentationPlanningKey(recipe), strain, recipe: next, changes,
    result: evaluateNoloRecipe(next, saved), targetPlato, processFit: recipe.nolo?.process === 'coldContact' ? 'explore' : 'documented',
    aromaFit: goalMatches.length ? 'documented' : 'explore', goalMatches,
    sources, assumptions, diagnostics: [...diagnostics, ...fermentationReadiness(next, saved)] };
}
export function fermentationProposals(recipe: TrialRecipe, saved: HopKnowledge[] = []): FermentationProposal[] {
  const science = recipe.nolo?.scienceSnapshot ?? noloScience(saved);
  if (!science || !recipe.nolo?.enabled) return [];
  const candidates = noloYeastCandidates(recipe, science, saved);
  const order = new Map(candidates.map((c, index) => [c.strain.yeastId, index]));
  return candidates.map(candidate => {
    const p = proposeNoloFermentation(recipe, candidate.strain, science, saved);
    p.assumptions.push(candidate.reason);
    if (candidate.form) p.recipe.yeast.form = candidate.form;
    return p;
  }).sort((a, b) =>
    Number(b.processFit === 'documented') - Number(a.processFit === 'documented') ||
    Number(a.result?.projectionStatus === 'exceeds') - Number(b.result?.projectionStatus === 'exceeds') ||
    Number(b.aromaFit === 'documented') - Number(a.aromaFit === 'documented') ||
    Number(b.result?.projectionStatus === 'within') - Number(a.result?.projectionStatus === 'within') ||
    a.diagnostics.filter(d => d.severity === 'action').length - b.diagnostics.filter(d => d.severity === 'action').length || order.get(a.strain.yeastId)! - order.get(b.strain.yeastId)!);
}
export function applyFermentationProposal(recipe: TrialRecipe, p: FermentationProposal): TrialRecipe {
  if (fermentationPlanningKey(recipe) !== p.basis) throw Error('La recette a changé. Recalculer la proposition avant de l’appliquer.');
  return structuredClone(p.recipe);
}
