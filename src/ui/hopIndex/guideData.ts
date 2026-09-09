import { assertHopDocument, type HopVariety } from '../../../functions/src/hopIndexSchema';
import { assertHopKnowledge, type HopAxis, type HopKnowledge, type HopRiskPolicy, type HopYeast } from '../../../functions/src/hopPredictionSchema';
import initialKnowledge from '../../data/hopKnowledgeBootstrap.json';
import initialYeasts from '../../data/hopYeastBootstrap.json';
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
const noloPack=[...legacyNoloPack,...noloScenarioPack];
import stylePack from '../../data/brewingStylesBootstrap.json';
import { noloScience } from '../../domain/nolo';
import { brewingStyles } from '../../domain/brewingStyles';
import { activeFermentationScience } from '../../../functions/src/fermentationScienceCore';
import type { FermentationGuide } from '../../../functions/src/fermentationGuideSchema';
import type { HopSolverPolicy } from '../../../functions/src/hopSolverSchema';
import type { HopTrial } from '../../../functions/src/hopTrialSchema';
import { StorageService } from '../../services/storage';
import { catalogueSolverFacts } from '../../domain/yeastCatalogue';

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
  const rows = [...checkedKnowledge(initialYeasts), ...checkedKnowledge(studyPack.hopKnowledge), ...checkedKnowledge(trialPack.hopKnowledge), ...checkedKnowledge(solverPack), ...checkedKnowledge(fermentationPack), ...checkedKnowledge(fermentationSciencePack), ...checkedKnowledge(noloPack), ...validKnowledge(knowledge)];
  const yeasts = rows.filter((row): row is HopYeast => row.kind === 'yeast');
  const fermentations = guideFermentations(knowledge), trials = guideTrials(knowledge), nolo = noloScience(knowledge);
  return [...new Map(yeasts.map(yeast => [yeast.id, yeast])).values()].map(yeast => {
    const names = [...(yeastNameVariants[yeast.id] ?? []), ...(nolo?.strains.find(s=>s.yeastId===yeast.id)?.aliases??[]), ...(fermentations.find(g => g.yeastId === yeast.id)?.aliases ?? []), ...(yeast.catalogue?.aliases ?? [])];
    const aliases = names.length ? [...new Set(names)] : undefined;
    const trial = trials.find(t => t.yeastId === yeast.id);
    const builtin = initialYeasts.find(y => y.id === yeast.id);
    const scienceIdentity = fermentationSciencePack.find(y => y.kind === 'yeast' && y.id === yeast.id);
    const form = yeast.form ?? trial?.yeastForm ?? builtin?.form ?? (scienceIdentity as HopYeast | undefined)?.form;
    return { ...yeast, ...(form ? { form: form as HopYeast['form'] } : {}), ...(aliases ? { aliases: [...aliases] } : {}) };
  });
}

/** A saved disabled or invalid guide is never silently replaced by its bootstrap. */
export function guideFermentations(knowledge: HopKnowledge[]): FermentationGuide[] {
  return [...new Map([...checkedKnowledge(fermentationPack), ...checkedKnowledge(fermentationSciencePack), ...knowledge].map((k, i) => [k?.id ?? `invalid-${i}`, k])).values()].filter((k): k is FermentationGuide => {
    try { assertHopKnowledge(k); return k.kind === 'fermentation' && k.enabled; } catch { return false; }
  });
}

export function guideFermentationScience(knowledge: HopKnowledge[]) {
  return activeFermentationScience([...new Map([...fermentationSciencePack, ...knowledge].map((k, i) => [k?.id ?? `invalid-${i}`, k])).values()]);
}

/** Reported programmes; never injected into the prediction model collection. */
export function guideTrials(knowledge: HopKnowledge[]): HopTrial[] {
  const rows = [...checkedKnowledge(trialPack.hopKnowledge), ...validKnowledge(knowledge).map(currentGuideRevision)];
  return [...new Map(rows.map(row => [row.id, row])).values()].filter((row): row is HopTrial => row.kind === 'trial');
}

/** Proposed data are immediately usable; a saved revision (including disabled)
 * wins by ID. Invalid saved revisions are left visible to the engine validator,
 * never replaced silently by the initial model. No writes happen at read time. */
const canonical = (value: any): string => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(k => [k, item[k]])) : item);
/** Upgrade only the untouched built-in. A disabled, invalid or edited revision wins. */
export function currentGuideRevision(row: HopKnowledge): HopKnowledge {
  if (row?.kind !== 'extrapolation' && row?.kind !== 'trial') return row;
  const old = (row.kind === 'trial' ? legacyTrialPack : [...legacyExtrapolationPack, ...previousExtrapolationPack]).find(k => k.id === row.id && canonical(row) === canonical(k));
  const next = (row.kind === 'trial' ? trialPack.hopKnowledge : extrapolationPack).find(k => k.id === row.id);
  return old && next && canonical(row) === canonical(old) ? next as HopKnowledge : row;
}
export function guidePredictionKnowledge(knowledge: HopKnowledge[]): HopKnowledge[] {
  const proposed = [...checkedKnowledge(initialKnowledge), ...checkedKnowledge(studyPack.hopKnowledge), ...checkedKnowledge(doseStudyPack), ...checkedKnowledge(trialPack.hopKnowledge), ...guideYeasts([]).map(storedKnowledge), ...checkedKnowledge(extrapolationPack), ...checkedKnowledge(solverPack), ...guideFermentations([]), ...checkedKnowledge(noloPack)];
  return [...new Map([...proposed, ...knowledge.filter(k=>k.kind!=='styleGuide').map(storedKnowledge).map(currentGuideRevision)].map((row, i) => [row?.id ?? `invalid-${i}`, row])).values()];
}
export function guideSolverPolicy(knowledge: HopKnowledge[]): HopSolverPolicy | undefined {
  const policy = guidePredictionKnowledge(knowledge).find((k): k is HopSolverPolicy => {
    try { assertHopKnowledge(k); return k.kind === 'solver' && k.enabled; } catch { return false; }
  });
  if (!policy) return undefined;
  const fermentation = guideFermentations(knowledge);
  const catalogue = catalogueSolverFacts(knowledge);
  // A current active guide is the explicit operating reference, then concordant
  // catalogue facts. Legacy solver defaults must not override either, or hide a
  // disabled guide / contradictory catalogue behind an older default.
  const referenceIds = new Set(knowledge.filter(k => k.kind === 'yeast' && k.catalogue?.facts.some(f => f.key === 'temperature')).map(k => k.id));
  for (const k of [...fermentationPack, ...fermentationSciencePack, ...knowledge]) if (k.kind === 'fermentation') referenceIds.add(k.yeastId);
  return { ...policy,
    styles: [policy.styles[0], ...brewingStyles(knowledge).map(s => {
      const start=policy.styles.find(p=>p.id===s.suggestions?.hop)??policy.styles[0];
      return {...start,id:s.ref.guideId+':'+s.id,name:s.name+' · '+s.edition,aliases:[s.name,...s.aliases],
        source:s.suggestions?.source??policy.source};
    })],
    // Keep opposing POF evidence: chemistryChecks reports it as unknown.
    yeastPhenols: [...catalogue.yeastPhenols, ...fermentation.filter(g => g.aroma.pof !== 'unknown').map(g => ({ yeastId: g.yeastId, status: g.aroma.pof as 'positive' | 'negative', source: g.aroma.source })), ...policy.yeastPhenols],
    yeastConditions: [...(policy.yeastConditions ?? []).filter(p => !referenceIds.has(p.yeastId)),
      ...catalogue.yeastConditions.filter(p => !fermentation.some(g => g.yeastId === p.yeastId)).map(p => ({ ...p,
        warning: policy.yeastConditions?.find(old => old.yeastId === p.yeastId)?.warning })),
      ...fermentation.map(g => ({ yeastId: g.yeastId, temperatureC: g.temperatureC.range, source: g.temperatureC.source,
        warning: policy.yeastConditions?.find(p => p.yeastId === g.yeastId)?.warning }))]
  };
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
    const existing = new Map(StorageService.getHopKnowledge().map(row => [row.id, row]));
    const missingVarieties = varieties.filter(row => !varietyIds.has(row.id));
    const missingKnowledge = savedKnowledge.filter(row => {
      const previous = existing.get(row.id);
      return !previous || (currentGuideRevision(previous) !== previous && canonical(currentGuideRevision(previous)) === canonical(row));
    });
    if (!missingVarieties.length && !missingKnowledge.length) return;

    await StorageService.importHopIndex(JSON.stringify({
      ...(missingVarieties.length ? { hopVarieties: missingVarieties } : {}),
      ...(missingKnowledge.length ? { hopKnowledge: missingKnowledge } : {})
    }));
  });
  pendingImport = operation.catch(() => undefined);
  return operation;
}
