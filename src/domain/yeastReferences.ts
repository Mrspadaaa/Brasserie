import { assertHopKnowledge, type HopKnowledge, type HopYeast } from '../../functions/src/hopPredictionSchema';
import { harvestedYeastTechnicalFact, readYeastDocumentarySheet, yeastTechnicalFactIdentity } from '../../functions/src/yeastDocumentarySheet';
import type { YeastCatalogueFact, YeastCatalogue } from '../../functions/src/yeastCatalogueSchema';
import type { HopSource } from '../../functions/src/hopIndexSchema';
import { readYeastTechnicalFacts, type YeastTechnicalFact } from '../../functions/src/yeastTechnicalFacts';
import { catalogueIdentityAliases } from './yeastCatalogue';
import core from '../data/yeastCoreReferences.json';
import recipeProfiles from '../data/yeastRecipeReferences.json';
import belgian from '../data/yeastEnrichmentBelgian.json';
import lager from '../data/yeastEnrichmentLager.json';
import initial from '../data/hopYeastBootstrap.json';
import studies from '../data/hopStudyBootstrap.json';
import trials from '../data/hopTrialBootstrap.json';
import solver from '../data/hopSolverBootstrap.json';
import guides from '../data/fermentationGuideBootstrap.json';
import science from '../data/fermentationScienceBootstrap.json';
import nolo from '../data/noloScenarioBootstrap.json';
import legacy from '../data/noloBootstrap.json';
import { yeastCatalogueLibrary } from './yeastCatalogueLibrary';

export type YeastReference = HopYeast & { aliases?: string[] };
const rawFact = (fact: YeastCatalogueFact, catalogue: YeastCatalogue): YeastTechnicalFact => harvestedYeastTechnicalFact(fact, catalogue);
function catalogueFactFromTechnical(fact: YeastTechnicalFact): YeastCatalogueFact {
  const sourceUrl = fact.sourceUrl;
  let kind: YeastCatalogueFact['source']['kind'] = fact.origin === 'personal' ? 'observation' : 'review';
  if (fact.origin === 'manufacturer') kind = 'manufacturer';
  const year = fact.retrievedAt ? new Date(fact.retrievedAt).getUTCFullYear() : null;
  return {
    key: fact.key, label: fact.key, reported: fact.reported,
    source: { title: fact.source ?? 'Source consultée', author: fact.source ?? 'Source consultée', year: Number.isFinite(year) ? year : null,
      kind, reference: sourceUrl ?? fact.source ?? 'Source à préciser' },
    ...(fact.range ? { range: { ...fact.range }, unit: fact.unit as YeastCatalogueFact['unit'], qualifier: fact.qualifier } : {}),
    ...(fact.context ? { context: fact.context } : {})
  };
}
/** Keep the collected catalogue intact and overlay only the facts explicitly
 * superseded by a reviewed correction. Unrelated and conflicting observations remain visible. */
export function effectiveYeastTechnicalFacts(reference: HopYeast): YeastTechnicalFact[] {
  const catalogue = reference.catalogue;
  const harvested = catalogue?.facts.map(fact => rawFact(fact, catalogue)) ?? [];
  const sheet = readYeastDocumentarySheet(reference.reviewedDocumentary, reference.id);
  const replacements = reference.reviewedDocumentaryRevision?.replacements ?? [];
  const superseded = new Set(replacements.map(pair => pair.before));
  const overlay = sheet?.technicalFacts ?? [];
  const effective = [
    ...harvested.filter(fact => !superseded.has(yeastTechnicalFactIdentity(fact))),
    ...overlay
  ];
  return readYeastTechnicalFacts(effective) ?? [];
}
/** Keep the complete citation object for harvested facts while synthesizing a
 * conservative source label for a reviewed AI/personal replacement. */
export function effectiveYeastTechnicalFactSources(reference: HopYeast): Map<string, HopSource[]> {
  const catalogue = reference.catalogue;
  const replacements = new Set((reference.reviewedDocumentaryRevision?.replacements ?? []).map(pair => pair.before));
  const sources = new Map<string, HopSource[]>();
  const normalized = (fact: YeastTechnicalFact) => readYeastTechnicalFacts([fact])?.[0];
  for (const fact of catalogue?.facts ?? []) {
    const technical = normalized(rawFact(fact, catalogue!));
    if (!technical) continue;
    const identity = yeastTechnicalFactIdentity(technical);
    if (!replacements.has(identity)) sources.set(identity, [fact.source]);
  }
  const sheet = readYeastDocumentarySheet(reference.reviewedDocumentary, reference.id);
  for (const fact of sheet?.technicalFacts ?? []) {
    const technical = normalized(fact);
    if (!technical || !technical.source && !technical.sourceUrl) continue;
    const identity = yeastTechnicalFactIdentity(technical);
    const year = technical.retrievedAt ? new Date(technical.retrievedAt).getUTCFullYear() : null;
    sources.set(identity, [{
      author: technical.origin === 'manufacturer' ? 'Fiche fabricant' : technical.origin === 'ai' ? 'Source proposée' : 'Fiche personnelle',
      title: technical.source ?? technical.reported,
      reference: technical.sourceUrl ?? technical.source!,
      kind: technical.origin === 'manufacturer' ? 'manufacturer' : 'observation',
      year: Number.isFinite(year) ? year : null
    }]);
  }
  return sources;
}
export function effectiveYeastCatalogueFacts(reference: HopYeast): YeastCatalogueFact[] {
  const catalogue = reference.catalogue;
  const sheet = readYeastDocumentarySheet(reference.reviewedDocumentary, reference.id);
  const superseded = new Set((reference.reviewedDocumentaryRevision?.replacements ?? []).map(pair => pair.before));
  return [
    ...(catalogue?.facts.filter(fact => !superseded.has(yeastTechnicalFactIdentity(rawFact(fact, catalogue)))) ?? []),
    ...(sheet?.technicalFacts ?? []).map(catalogueFactFromTechnical)
  ];
}
/** Original harvested fact and its effective reviewed replacement, for provenance display. */
export function reviewedYeastReplacements(reference: HopYeast): Array<{ before: YeastCatalogueFact; after: YeastCatalogueFact }> {
  const catalogue = reference.catalogue;
  const sheet = readYeastDocumentarySheet(reference.reviewedDocumentary, reference.id);
  if (!catalogue || !sheet) return [];
  const before = new Map(catalogue.facts.map(fact => {
    const technical = rawFact(fact, catalogue);
    return [yeastTechnicalFactIdentity(technical), fact] as const;
  }));
  const after = new Map((sheet.technicalFacts ?? []).map(fact => [yeastTechnicalFactIdentity(fact), catalogueFactFromTechnical(fact)] as const));
  return (reference.reviewedDocumentaryRevision?.replacements ?? []).flatMap(pair => {
    const oldFact = before.get(pair.before), newFact = after.get(pair.after);
    return oldFact && newFact ? [{ before: oldFact, after: newFact }] : [];
  });
}
/** One local identity catalogue for the guide, direct calculation and companion.
 * Saved records win by id, including a disabled or invalid personal reference.
 * Aliases identify products; they never assert equivalence between strains. */
const empty: HopKnowledge[] = [];
const enrichment = [...core, ...recipeProfiles, ...belgian.references, ...lager.references];
const startup = [...initial, ...studies.hopKnowledge, ...trials.hopKnowledge, ...solver, ...guides, ...science, ...legacy, ...nolo];
const knownForms = new Map((startup as HopKnowledge[]).filter((r): r is HopYeast => r.kind === 'yeast' && !!r.form).map(r => [r.id, r.form]));
let documentedById: Map<string, HopYeast> | undefined;
const validatedLibraryReferences = new WeakSet<HopYeast>();
const cache = new WeakMap<HopKnowledge[], YeastReference[]>();
const coreCache = new WeakMap<HopKnowledge[], YeastReference[]>();
export function yeastReferences(saved: HopKnowledge[] = empty, options: { includeCatalogue?: boolean } = {}): YeastReference[] {
  const activeCache = options.includeCatalogue === false ? coreCache : cache;
  // Many pure callers use a fresh default []; they still share the same empty library.
  const cacheKey = saved.length ? saved : empty;
  const cached = activeCache.get(cacheKey); if(cached) return cached;
  // The bundled library is available offline to the editor and server tools.
  // Reading it never installs a catalogue into the brewer's personal records.
  if (options.includeCatalogue !== false && !documentedById) {
    // The decoder already validates every library row and freezes its entire
    // graph. Preserve that validation rather than repeating its dates/URLs/facts
    // for each saved collection. Personal/enriched objects still validate below.
    const library = yeastCatalogueLibrary();
    library.forEach(row => validatedLibraryReferences.add(row));
    documentedById = new Map([...library, ...enrichment as HopYeast[]].map(row => [row.id, row]));
  }
  const defaults = options.includeCatalogue === false ? new Map((enrichment as HopYeast[]).map(row => [row.id, row])) : documentedById!;
  const rows = [...new Map([...startup, ...defaults.values(), ...saved.map(r=>{
      if(r.kind!=='yeast') return r;
      const {aliases: _aliases, ...stored}=r as YeastReference;
      // Earlier bootstraps were saved without catalogue facts. Enrich that exact
      // product identity, while an existing personal catalogue (even conflicting)
      // remains authoritative. Invalid saved records must still mask the default.
      try { assertHopKnowledge(stored); } catch { return stored; }
      const documented = defaults.get(stored.id);
      return documented && stored.catalogue === undefined && (!stored.form || stored.form === documented.form) ? { ...stored, catalogue: documented.catalogue,
        form: stored.form ?? documented.form } : stored;
    })].map(r => [r.id, r])).values()];
  const valid = rows.filter((r): r is HopKnowledge => {
    if (r.kind !== 'yeast' && r.kind !== 'fermentation' && r.kind !== 'noloScience') return false;
    try {
      if (!validatedLibraryReferences.has(r as HopYeast)) assertHopKnowledge(r);
      return true;
    } catch { return false; }
  });
  // Index aliases once. Scanning the entire catalogue for each strain made
  // opening the recipe quadratic after the full catalogue was merged.
  const aliases = new Map<string, string[]>();
  const addAliases = (id: string, names: string[]) => aliases.set(id, [...aliases.get(id) ?? [], ...names]);
  for (const row of valid) {
    if (row.kind === 'fermentation' && row.enabled) addAliases(row.yeastId, row.aliases);
    if (row.kind === 'noloScience' && row.enabled) for (const strain of row.strains) addAliases(strain.yeastId, strain.aliases);
  }
  const result = valid.filter((r): r is HopYeast => r.kind === 'yeast').map(y => {
    const names = [...aliases.get(y.id) ?? [], ...catalogueIdentityAliases(y)];
    if (y.id === 'fermentis-us05') names.push('SafAle US-05', 'Fermentis SafAle US-05', 'Fermentis Levure SafAle US-05', 'US-05');
    // Manufacturer + printed product code is an exact product presentation,
    // not an equivalence inferred between strains (e.g. "Wyeast 1056").
    if (y.catalogue?.manufacturer && y.catalogue.productCode) names.push(`${y.catalogue.manufacturer} ${y.catalogue.productCode}`);
    const form = y.form ?? knownForms.get(y.id);
    return { ...y, ...(form ? { form: form as HopYeast['form'] } : {}), aliases: [...new Set([...names, ...(y.catalogue?.aliases ?? [])])] };
  });
  activeCache.set(cacheKey, result); return result;
}
