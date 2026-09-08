import { assertHopDocument, type HopVariety } from '../../../functions/src/hopIndexSchema';
import { assertHopKnowledge, type HopAxis, type HopKnowledge, type HopRiskPolicy, type HopYeast } from '../../../functions/src/hopPredictionSchema';
import initialKnowledge from '../../data/hopKnowledgeBootstrap.json';
import initialYeasts from '../../data/hopYeastBootstrap.json';
import trialPack from '../../data/hopTrialBootstrap.json';
import studyPack from '../../data/hopStudyBootstrap.json';
import type { HopTrial } from '../../../functions/src/hopTrialSchema';
import { StorageService } from '../../services/storage';

export type GuideYeast = HopYeast & { aliases?: string[] };

// Fermentis names this product SafAle US-05: https://fermentis.com/fr/produit/safale-us-05/.
// These presentations combine that designation, its manufacturer and the ingredient label.
// They identify the same product; they do not assert equivalence with another strain.
const yeastNameVariants: Record<string, string[]> = {
  'fermentis-us05': ['SafAle US-05', 'Fermentis SafAle US-05', 'Fermentis Levure SafAle US-05', 'US-05']
};

function storedKnowledge(row: HopKnowledge): HopKnowledge {
  if (!row || row.kind !== 'yeast') return row;
  const yeast: GuideYeast = row;
  const { aliases: _aliases, ...stored } = yeast;
  return stored;
}

function checkedKnowledge(rows: unknown[]): HopKnowledge[] {
  return rows.map(row => { assertHopKnowledge(row); return row; });
}

function validKnowledge(rows: HopKnowledge[]): HopKnowledge[] {
  return rows.map(storedKnowledge).filter(row => {
    try { assertHopKnowledge(row); return true; }
    catch { return false; }
  });
}

/** Choices for the guide only; prediction inputs still come from the saved index. */
export function guideAxes(knowledge: HopKnowledge[]): HopAxis[] {
  const rows = [...checkedKnowledge(initialKnowledge), ...validKnowledge(knowledge)];
  const axes = rows.filter((row): row is HopAxis => row.kind === 'axis');
  return [...new Map(axes.map(axis => [axis.id, axis])).values()];
}

export function guideYeasts(knowledge: HopKnowledge[]): GuideYeast[] {
  const rows = [...checkedKnowledge(initialYeasts), ...checkedKnowledge(studyPack.hopKnowledge), ...checkedKnowledge(trialPack.hopKnowledge), ...validKnowledge(knowledge)];
  const yeasts = rows.filter((row): row is HopYeast => row.kind === 'yeast');
  return [...new Map(yeasts.map(yeast => [yeast.id, yeast])).values()].map(yeast => {
    const aliases = yeastNameVariants[yeast.id];
    const trial = guideTrials(knowledge).find(t => t.yeastId === yeast.id);
    const builtin = initialYeasts.find(y => y.id === yeast.id);
    const form = yeast.form ?? trial?.yeastForm ?? builtin?.form;
    return { ...yeast, ...(form ? { form: form as HopYeast['form'] } : {}), ...(aliases ? { aliases: [...aliases] } : {}) };
  });
}

/** Reported programmes; never injected into the prediction model collection. */
export function guideTrials(knowledge: HopKnowledge[]): HopTrial[] {
  const rows = [...checkedKnowledge(trialPack.hopKnowledge), ...validKnowledge(knowledge)];
  return [...new Map(rows.map(row => [row.id, row])).values()].filter((row): row is HopTrial => row.kind === 'trial');
}

/** Proposed policies only; an explicit action must persist any missing references. */
export function guideRiskPolicies(knowledge: HopKnowledge[]): HopRiskPolicy[] {
  const rows = [...checkedKnowledge(initialKnowledge), ...validKnowledge(knowledge)];
  const policies = rows.filter((row): row is HopRiskPolicy => row.kind === 'risk');
  return [...new Map(policies.map(policy => [policy.id, policy])).values()];
}

export async function loadGuideVarieties(): Promise<HopVariety[]> {
  const [manufacturer, guide] = await Promise.all([
    import('../../data/hopManufacturerBootstrap.json'),
    import('../../data/hopGuideVarietyBootstrap.json')
  ]);
  return [...manufacturer.default.hopVarieties, ...guide.default.hopVarieties, ...studyPack.hopVarieties, ...trialPack.hopVarieties].map(row => {
    assertHopDocument('hopVarieties', row);
    return row as HopVariety;
  });
}

export interface GuideReferences {
  varieties?: HopVariety[];
  knowledge?: HopKnowledge[];
}

let pendingImport: Promise<void> = Promise.resolve();

/** Called by an explicit guide action, never as a background installation. */
export function ensureGuideReferences({ varieties = [], knowledge = [] }: GuideReferences): Promise<void> {
  const operation = pendingImport.then(async () => {
    if (!StorageService.isReady()) {
      throw new Error('La base de données n’est pas encore prête. Réessayez après la synchronisation.');
    }
    varieties.forEach(row => assertHopDocument('hopVarieties', row));
    const savedKnowledge = knowledge.map(storedKnowledge);
    savedKnowledge.forEach(row => assertHopKnowledge(row));

    // Re-read inside the queue so earlier imports and user edits remain authoritative.
    const varietyIds = new Set(StorageService.getHopVarieties().map(row => row.id));
    const knowledgeIds = new Set(StorageService.getHopKnowledge().map(row => row.id));
    const missingVarieties = varieties.filter(row => !varietyIds.has(row.id));
    const missingKnowledge = savedKnowledge.filter(row => !knowledgeIds.has(row.id));
    if (!missingVarieties.length && !missingKnowledge.length) return;

    await StorageService.importHopIndex(JSON.stringify({
      ...(missingVarieties.length ? { hopVarieties: missingVarieties } : {}),
      ...(missingKnowledge.length ? { hopKnowledge: missingKnowledge } : {})
    }));
  });
  pendingImport = operation.catch(() => undefined);
  return operation;
}
