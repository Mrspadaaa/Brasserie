import { assertHopKnowledge, type HopKnowledge, type HopYeast } from '../../functions/src/hopPredictionSchema';
import core from '../data/yeastCoreReferences.json';
import initial from '../data/hopYeastBootstrap.json';
import studies from '../data/hopStudyBootstrap.json';
import trials from '../data/hopTrialBootstrap.json';
import solver from '../data/hopSolverBootstrap.json';
import guides from '../data/fermentationGuideBootstrap.json';
import science from '../data/fermentationScienceBootstrap.json';
import nolo from '../data/noloScenarioBootstrap.json';
import legacy from '../data/noloBootstrap.json';

export type YeastReference = HopYeast & { aliases?: string[] };
/** One local identity catalogue for the guide, direct calculation and companion.
 * Saved records win by id, including a disabled or invalid personal reference.
 * Aliases identify products; they never assert equivalence between strains. */
const empty: HopKnowledge[] = [];
const cache = new WeakMap<HopKnowledge[], YeastReference[]>();
export function yeastReferences(saved: HopKnowledge[] = empty): YeastReference[] {
  const cached = cache.get(saved); if(cached) return cached;
  const rows = [...new Map([...initial, ...studies.hopKnowledge, ...trials.hopKnowledge,
    ...solver, ...guides, ...science, ...legacy, ...nolo, ...core, ...saved.map(r=>{
      if(r.kind!=='yeast') return r;
      const {aliases: _aliases, ...stored}=r as YeastReference; return stored;
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
    const form = y.form ?? trials.hopKnowledge.find(r => r.kind === 'hopTrial' && r.yeastId === y.id)?.yeastForm
      ?? initial.find(r => r.id === y.id)?.form;
    return { ...y, ...(form ? { form: form as HopYeast['form'] } : {}), aliases: [...new Set([...names, ...(y.catalogue?.aliases ?? [])])] };
  });
  cache.set(saved, result); return result;
}
