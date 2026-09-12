import type { HopRange } from '../../functions/src/hopIndexSchema';
import type { NoloOperation, NoloProcess } from '../../functions/src/noloSchema';
import { changeNoloProcess } from '../../functions/src/noloScenario';
import type { BrewDayState, BrewDayStep, Recipe, RecipeSnapshot } from '../types';
import type { ReadingKind } from './brewDay';
import { noloScenarioInput, noloScience } from './nolo';
import { wortTool } from './noloBrewTools';
import { matchingNoloSimulation } from '../../functions/src/noloSimulation';

const number = (value: number, decimals = 2) =>
  value.toLocaleString('fr-CH', { maximumFractionDigits: decimals });
const quantity = (value: number | null | undefined, unit: string, decimals = 2) =>
  value != null && Number.isFinite(value) ? `${number(value, decimals)} ${unit}`.trim() : 'Non renseigné';
const range = (value: HopRange | null | undefined, unit: string, decimals = 2) =>
  value && Number.isFinite(value.min) && Number.isFinite(value.max)
    ? `${number(value.min, decimals)}${value.min === value.max ? '' : `–${number(value.max, decimals)}`} ${unit}`.trim()
    : 'Non renseigné';

export const NOLO_BREW_PROCESSES: Record<NoloProcess, { name: string; focus: string }> = {
  restricted: {
    name: 'Fermentation limitée',
    focus: 'Relève densité et pH du moût. Les sucres simples et les ajouts comptent aussi dans le bilan d’alcool.'
  },
  restored: {
    name: 'Restitution aromatique',
    focus: 'Garde un témoin pour les essais. Note chaque dose et la composition du support avant de traiter tout le brassin.'
  },
  lowExtract: {
    name: 'Faible extrait',
    focus: 'Compare la densité au volume réellement recueilli avant de corriger la charge ou de diluer.'
  },
  coldExtraction: {
    name: 'Extraction à froid',
    focus: 'Consigne durée et température d’extraction, puis volume et densité récupérés. Mesure à nouveau après la chauffe prévue.'
  },
  coldContact: {
    name: 'Contact à froid',
    focus: 'Le moût suit son programme de brassage. Le contact à froid vient ensuite, avec la souche, la température et la durée du protocole choisi.'
  },
  arrested: {
    name: 'Fermentation interrompue',
    focus: 'Prépare le suivi du point d’arrêt mesuré et le traitement prévu. Le temps écoulé seul ne confirme pas l’arrêt de fermentation.'
  },
  dealcoholized: {
    name: 'Désalcoolisation',
    focus: 'Prépare la bière de base. Le retrait d’alcool, les pertes et le volume final se vérifient après le traitement.'
  },
  secondRunnings: {
    name: 'Seconde extraction',
    focus: 'Identifie le brassin d’origine et mesure le moût récupéré. Aucun rendement de grain neuf n’est repris.'
  }
};

/** The frozen recipe remains intact. Cold extraction never inherits the hot-water model. */
export function noloExecutionRecipe<T extends Recipe | RecipeSnapshot>(recipe: T): T {
  if (!recipe.nolo?.enabled || !['secondRunnings', 'coldExtraction'].includes(recipe.nolo.process)) return recipe;
  const spentGrain = recipe.nolo.process === 'secondRunnings';
  return {
    ...recipe,
    // Keep indices: journal additions and linked NOLO fruit use grain-N identities.
    fermentables: spentGrain ? (recipe.fermentables ?? []).map(f =>
      (f.kind ?? 'grain') === 'grain' && (f.use ?? 'empatage') === 'empatage'
        ? { ...f, weightKg: 0 } : f) : recipe.fermentables,
    totalGristKg: spentGrain ? 0 : recipe.totalGristKg,
    mash: undefined,
    waterPlan: undefined,
    water: undefined,
    preBoilL: undefined,
    preBoilHotL: undefined
  };
}

export function noloReadingKinds(step: BrewDayStep): ReadingKind[] {
  if (step.id === 'eau') return ['volume', 'ph'];
  if (step.id === 'concassage') return [];
  if (step.id === 'nolo-extraction' || step.id === 'nolo-second-runnings') return ['temperature', 'densite', 'volume', 'ph'];
  if (/^mash/.test(step.id)) return ['temperature', 'ph'];
  if (step.id === 'refroidissement') return ['temperature', 'densite', 'ph'];
  if (step.id.startsWith('boil-') || step.id.startsWith('hop-') || step.id === 'whirlpool')
    return ['volume', 'temperature'];
  return ['densite', 'volume', 'ph'];
}

/** Only the journal at this exact step can populate the measurement shortcuts. */
export function noloStepReadings(state: BrewDayState, step: BrewDayStep) {
  return noloReadingKinds(step).map(kind => ({
    kind,
    reading: (state.readings ?? []).filter(r => r.stepId === step.id && r.kind === kind)
      .reduce<(NonNullable<BrewDayState['readings']>[number]) | undefined>(
        (latest, reading) => !latest || reading.at >= latest.at ? reading : latest, undefined)
  }));
}

export interface NoloOperationRow { id: string; name: string; kind: string; amount: string; detail: string }

function operationRow(operation: NoloOperation): NoloOperationRow {
  const base = { id: operation.id, name: operation.name };
  switch (operation.kind) {
    case 'sugar': {
      const sugars = Object.values(operation.sugarsG);
      const complete = operation.complete && sugars.every(Boolean) && operation.unclassifiedSugarG !== null;
      const parts = [...sugars, ...(operation.unclassifiedSugarG ? [operation.unclassifiedSugarG] : [])];
      const total = complete ? parts.reduce((sum, part) => ({
        min: sum.min + (part?.min ?? 0), max: sum.max + (part?.max ?? 0)
      }), { min: 0, max: 0 }) : null;
      return { ...base, kind: 'Sucres / fruit', amount: total ? range(total, 'g de sucres') : 'Sucres à préciser',
        detail: `Volume ajouté : ${quantity(operation.volumeL, 'L')}. ${complete ? 'Composition déclarée complète.' : 'Composition incomplète.'}` };
    }
    case 'aroma':
      return { ...base, kind: 'Arôme', amount: quantity(operation.volumeML, 'mL'),
        detail: `Support : ${range(operation.carrierAbvPct, '% vol.')}. Sucres : ${range(operation.sugarG, 'g')}. ${operation.moment || 'Moment à préciser.'}` };
    case 'blend':
      return { ...base, kind: 'Assemblage', amount: quantity(operation.volumeL, 'L'),
        detail: `Alcool : ${range(operation.abvPct, '% vol.')}. Sucres restants : ${range(operation.remainingSugarG, 'g')}.` };
    case 'dilution':
      return { ...base, kind: 'Dilution', amount: quantity(operation.volumeL, 'L d’eau'),
        detail: 'Relever le volume et la densité du mélange ; l’ajout prévu n’est pas une mesure.' };
    case 'removal':
      return { ...base, kind: 'Traitement', amount: quantity(operation.finalVolumeL, 'L finaux'),
        detail: `Retrait envisagé : ${range(operation.ethanolRemovedPct, '% de l’éthanol')}. ${operation.source || 'Procédé à documenter.'}` };
  }
}

export function noloBrewDayPlan(recipe: Recipe | RecipeSnapshot) {
  if (!recipe.nolo?.enabled) return null;
  const config = changeNoloProcess(recipe.nolo, recipe.nolo.process);
  const process = NOLO_BREW_PROCESSES[config.process];
  const science = config.scienceSnapshot ?? noloScience();
  const input = noloScenarioInput(recipe);
  const simulation = matchingNoloSimulation(input);
  const currentOg = input.og;
  const settings = config.brewTools;
  const wort = settings && science ? wortTool(recipe, {
    targetAbvPct: config.targetAbvPct, reserveAbvPct: settings.reserveAbvPct,
    attenuationPct: settings.attenuationPct
  }, science) : null;
  const facts: { label: string; value: string }[] = [];
  if (simulation) {
    const s = simulation.settings;
    facts.push(
      { label: 'OG visée · simulation', value: range(simulation.wortSg, 'SG', 4) },
      { label: 'Atténuation envisagée', value: range(s.attenuationPct, '%') },
      { label: 'Variation de l’extrait', value: `±${quantity(s.extractTolerancePct, '%')}` },
      { label: 'Ensemencement prévu', value: `${quantity(s.yeastQty, s.yeastUnit)} · ${quantity(s.fermentationTempC, '°C')}` },
      { label: 'Fermentation prévue', value: quantity(s.fermentationDays, 'j') }
    );
    if (['coldExtraction','secondRunnings'].includes(config.process)) facts.push(
      { label: 'Consigne d’extraction', value: `${quantity(s.extractionTempC, '°C')} · ${quantity(s.extractionHours, 'h')}` },
      { label: 'Récupération visée', value: quantity(simulation.volumeL, 'L') }
    );
    if (config.process === 'coldContact') facts.push({ label: 'Consigne de contact froid', value: `${quantity(s.fermentationTempC, '°C')} · ${quantity(s.contactHours, 'h')}` });
    if (simulation.stopDropSg) facts.push({ label: 'Chute à suivre depuis l’OG mesurée', value: range(simulation.stopDropSg, 'SG', 4) });
  }
  if (config.process === 'secondRunnings') {
    const extraction = config.secondRunnings;
    facts.push(
      { label: 'Brassin d’origine', value: extraction?.sourceBatchId || 'Non renseigné' },
      { label: 'Eau de seconde extraction', value: quantity(extraction?.waterAddedL, 'L') },
      { label: 'Extraction prévue', value: `${quantity(extraction?.temperatureC, '°C')} · ${quantity(extraction?.minutes, 'min')}` },
      { label: 'Volume récupéré inscrit', value: quantity(extraction?.recoveredL, 'L') }
    );
  } else {
    const charge = (recipe.fermentables ?? []).filter(f => f.use !== 'fermentation');
    facts.push(
      { label: 'Charge avant fermentation', value: charge.length ? quantity(charge.reduce((sum, f) => sum + f.weightKg, 0), 'kg', 3) : 'Non renseignée' },
      { label: 'Volume prévu', value: quantity(recipe.volumeL, 'L') }
    );
  }
  facts.push({ label: currentOg ? currentOg.origin === 'measurement' ? 'OG mesurée inscrite' : 'OG calculée' : 'OG du moût', value: range(currentOg?.range, 'SG', 3) });
  if (recipe.ogTarget != null && Number.isFinite(recipe.ogTarget) &&
    (!currentOg || Math.abs(recipe.ogTarget - currentOg.range.min) >= .0005 || Math.abs(recipe.ogTarget - currentOg.range.max) >= .0005))
    facts.push({ label: 'OG annoncée à la recette', value: quantity(recipe.ogTarget, 'SG', 3) });
  if (settings?.attenuationPct) facts.push({ label: 'Atténuation envisagée', value: range(settings.attenuationPct, '%') });
  if (settings?.reserveAbvPct != null) facts.push({ label: 'Réserve pour les ajouts', value: quantity(settings.reserveAbvPct, 'point de % vol.') });
  if (wort?.value) facts.push({ label: 'OG limite sous hypothèses', value: quantity(Math.floor(wort.value.maxSg * 10000) / 10000, 'SG', 4) });
  if (config.planning?.stopSg) facts.push({ label: 'Repère d’arrêt', value: range(config.planning.stopSg, 'SG', 3) });
  if (config.planning?.stopAttenuationPct) facts.push({ label: 'Atténuation à l’arrêt', value: range(config.planning.stopAttenuationPct, '%') });
  return {
    ...process, process: config.process, target: quantity(config.targetAbvPct, '% vol.'), facts,
    simulation,
    simulationStale: !!config.planning?.simulation && !simulation,
    executionHint: simulation ? ['coldExtraction','secondRunnings'].includes(config.process)
      ? `Extraction prévue : ${quantity(simulation.settings.extractionTempC, '°C')} pendant ${quantity(simulation.settings.extractionHours, 'h')} · viser ${quantity(simulation.volumeL, 'L')}.`
      : config.process === 'arrested' && simulation.stopDropSg
      ? `Depuis l’OG mesurée, suivre une chute de ${range(simulation.stopDropSg, 'SG', 4)} avant le traitement d’arrêt prévu.`
      : config.process === 'coldContact'
      ? `Contact prévu : ${quantity(simulation.settings.fermentationTempC, '°C')} pendant ${quantity(simulation.settings.contactHours, 'h')}.`
      : `${recipe.yeast.name} : ${quantity(simulation.settings.yeastQty, simulation.settings.yeastUnit)} à ${quantity(simulation.settings.fermentationTempC, '°C')}.` : null,
    wortIssue: wort?.issue ?? null,
    operations: config.operations.map(operationRow),
    inactiveCount: config.inactiveOperations?.length ?? 0,
    trials: (config.trials ?? []).map(trial => ({
      id: trial.id, name: trial.name,
      detail: `${quantity(trial.volumeL, 'L')} · ${quantity(trial.dosageML, 'mL')} de ${trial.product || 'produit à préciser'}`,
      comparator: trial.comparator || 'Témoin à préciser', tasting: trial.tasting,
      moment: trial.moment, composition: trial.composition,
      carrier: range(trial.carrierAbvPct, '% vol.')
    })),
    stabilization: config.stabilization,
    missingProgramme: recipe.boilMin == null ? 'Durée d’ébullition non renseignée : aucun minuteur d’ébullition par défaut.' : null
  };
}
