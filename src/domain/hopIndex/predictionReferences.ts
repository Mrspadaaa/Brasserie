import { yeastReferences } from '../yeastReferences';
import { assertHopKnowledge, type HopKnowledge, type HopYeast } from '../../../functions/src/hopPredictionSchema';
import type { FermentationGuide } from '../../../functions/src/fermentationGuideSchema';
import { qualifyHopPredictionKnowledge, type HopPredictionKnowledgeView, type HopSavedModelSelection } from './knowledgeQualification';
import initialKnowledge from '../../data/hopKnowledgeBootstrap.json';
import trialPack from '../../data/hopTrialBootstrap.json';
import legacyTrialPack from '../../data/hopTrialLegacyBootstrap.json';
import studyPack from '../../data/hopStudyBootstrap.json';
import extrapolationPack from '../../data/hopExtrapolationBootstrap.json';
import legacyExtrapolationPack from '../../data/hopExtrapolationLegacyBootstrap.json';
import previousExtrapolationPack from '../../data/hopExtrapolationV4Bootstrap.json';
import solverPack from '../../data/hopSolverBootstrap.json';
import doseStudyPack from '../../data/hopDoseStudyBootstrap.json';
import fermentationPack from '../../data/fermentationGuideBootstrap.json';
import fermentationSciencePack from '../../data/fermentationScienceBootstrap.json';
import legacyNoloPack from '../../data/noloBootstrap.json';
import noloScenarioPack from '../../data/noloScenarioBootstrap.json';

/** Pure reference preparation formerly private to the UI guide. No storage,
 * installation or network call occurs while calculating a current scenario. */
export function storedPredictionKnowledge(row: HopKnowledge): HopKnowledge {
  if (!row || row.kind !== 'yeast') return row;
  const { aliases: _aliases, ...stored } = row as HopYeast & { aliases?: string[] };
  return stored;
}
function checkedKnowledge(rows: unknown[]): HopKnowledge[] {
  return rows.map(row => { assertHopKnowledge(row); return row; });
}
const canonical = (value: any): string => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(k => [k, item[k]])) : item);
export { canonical as canonicalPredictionReference };

/** Only an untouched built-in can follow the current proposed revision. */
export function currentGuideRevision(row: HopKnowledge): HopKnowledge {
  if (row?.kind !== 'extrapolation' && row?.kind !== 'trial') return row;
  const old = (row.kind === 'trial' ? legacyTrialPack : [...legacyExtrapolationPack, ...previousExtrapolationPack]).find(k => k.id === row.id && canonical(row) === canonical(k));
  const next = (row.kind === 'trial' ? trialPack.hopKnowledge : extrapolationPack).find(k => k.id === row.id);
  return old && next && canonical(row) === canonical(old) ? next as HopKnowledge : row;
}

export function proposedBrewingPredictionKnowledge(): HopKnowledge[] {
  const fermentations = [...new Map([...checkedKnowledge(fermentationPack), ...checkedKnowledge(fermentationSciencePack)].map(k => [k.id, k])).values()]
    .filter((row): row is FermentationGuide => row.kind === 'fermentation' && row.enabled);
  return [...checkedKnowledge(initialKnowledge), ...checkedKnowledge(studyPack.hopKnowledge), ...checkedKnowledge(doseStudyPack),
    ...checkedKnowledge(trialPack.hopKnowledge), ...yeastReferences([], { includeCatalogue: false }).map(storedPredictionKnowledge),
    ...checkedKnowledge(extrapolationPack), ...checkedKnowledge(solverPack), ...fermentations,
    ...checkedKnowledge([...legacyNoloPack, ...noloScenarioPack])];
}

/** Saved disabled/invalid versions and competing source variants retain the
 * received qualification rules; they are never overwritten by a default. */
export function guidePredictionKnowledgeQualification(
  knowledge: HopKnowledge[], selectedSavedById: HopSavedModelSelection = {}
): HopPredictionKnowledgeView {
  const yeastById = new Map(yeastReferences(knowledge).map(row => [row.id, storedPredictionKnowledge(row)]));
  const proposed = proposedBrewingPredictionKnowledge();
  const saved = knowledge.filter(k => k.kind !== 'styleGuide').map(storedPredictionKnowledge).map(currentGuideRevision);
  const qualified = qualifyHopPredictionKnowledge(proposed, saved, selectedSavedById);
  return { ...qualified, knowledge: qualified.knowledge.map(row => row?.kind === 'yeast' ? yeastById.get(row.id) ?? row : row) };
}
export function guidePredictionKnowledge(knowledge: HopKnowledge[], selectedSavedById: HopSavedModelSelection = {}): HopKnowledge[] {
  return guidePredictionKnowledgeQualification(knowledge, selectedSavedById).knowledge;
}
