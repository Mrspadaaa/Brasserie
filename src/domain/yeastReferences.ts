import { assertHopKnowledge, type HopKnowledge, type HopYeast } from '../../functions/src/hopPredictionSchema';
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
/** One local identity catalogue for the guide, direct calculation and companion.
 * Saved records win by id, including a disabled or invalid personal reference.
 * Aliases identify products; they never assert equivalence between strains. */
const empty: HopKnowledge[] = [];
const enrichment = [...core, ...recipeProfiles, ...belgian.references, ...lager.references];
const startup = [...initial, ...studies.hopKnowledge, ...trials.hopKnowledge, ...solver, ...guides, ...science, ...legacy, ...nolo];
const knownForms = new Map((startup as HopKnowledge[]).filter((r): r is HopYeast => r.kind === 'yeast' && !!r.form).map(r => [r.id, r.form]));
let documentedById: Map<string, HopYeast> | undefined;
const cache = new WeakMap<HopKnowledge[], YeastReference[]>();
const coreCache = new WeakMap<HopKnowledge[], YeastReference[]>();
export function yeastReferences(saved: HopKnowledge[] = empty, options: { includeCatalogue?: boolean } = {}): YeastReference[] {
  const activeCache = options.includeCatalogue === false ? coreCache : cache;
  // Many pure callers use a fresh default []; they still share the same empty library.
  const cacheKey = saved.length ? saved : empty;
  const cached = activeCache.get(cacheKey); if(cached) return cached;
  // The bundled library is available offline to the editor and server tools.
  // Reading it never installs a catalogue into the brewer's personal records.
  if (options.includeCatalogue !== false) documentedById ??= new Map([...yeastCatalogueLibrary(), ...enrichment as HopYeast[]].map(row => [row.id, row]));
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
    try { assertHopKnowledge(r); return true; } catch { return false; }
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
    const names = [...aliases.get(y.id) ?? []];
    if (y.id === 'fermentis-us05') names.push('SafAle US-05', 'Fermentis SafAle US-05', 'Fermentis Levure SafAle US-05', 'US-05');
    const form = y.form ?? knownForms.get(y.id);
    return { ...y, ...(form ? { form: form as HopYeast['form'] } : {}), aliases: [...new Set([...names, ...(y.catalogue?.aliases ?? [])])] };
  });
  activeCache.set(cacheKey, result); return result;
}
