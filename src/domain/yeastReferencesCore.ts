import { assertHopKnowledge, type HopKnowledge, type HopYeast } from '../../functions/src/hopPredictionSchema';
import { catalogueIdentityAliases } from './yeastCatalogue';
import { bibliothequeLevuresEnregistree } from './yeastLibraryPorte';
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

/**
 * Construction des références de levures SANS importer la bibliothèque documentaire (yeastCatalogueLibrary.json, 1,4 Mo).
 * La bibliothèque est fournie par l'appelant (`yeastReferences.ts`) ; l'accueil, qui n'a besoin que du noyau
 * (`includeCatalogue: false`), importe ce module seul et ne télécharge plus la bibliothèque (voie l2, 10.11).
 */
export type YeastReference = HopYeast & { aliases?: string[] };
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
/** `bibliotheque` n'est appelée que pour `includeCatalogue !== false`, une seule fois (puis mémorisée). */
export function yeastReferencesAvec(saved: HopKnowledge[] = empty, options: { includeCatalogue?: boolean } = {},
  bibliotheque?: () => readonly HopYeast[]): YeastReference[] {
  const activeCache = options.includeCatalogue === false ? coreCache : cache;
  // Many pure callers use a fresh default []; they still share the same empty library.
  const cacheKey = saved.length ? saved : empty;
  const cached = activeCache.get(cacheKey); if(cached) return cached;
  // The bundled library is available offline to the editor and server tools.
  // Reading it never installs a catalogue into the brewer's personal records.
  if (options.includeCatalogue !== false && !documentedById) {
    if (!bibliotheque) throw new Error('Bibliothèque de levures non chargée : passer par yeastReferences() ou attendre chargerBibliothequeLevures().');
    // The decoder already validates every library row and freezes its entire
    // graph. Preserve that validation rather than repeating its dates/URLs/facts
    // for each saved collection. Personal/enriched objects still validate below.
    const library = bibliotheque();
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
/** Le calcul AVEC catalogue, sur la bibliothèque enregistrée dans la porte (yeastLibraryPorte) : lève tant qu'elle n'est pas chargée. */
export const yeastReferencesChargees = (saved?: HopKnowledge[], options: { includeCatalogue?: boolean } = {}): YeastReference[] =>
  yeastReferencesAvec(saved, options, bibliothequeLevuresEnregistree());
/** Le noyau seul (levures documentées à la main), sans la bibliothèque : ce que lit l'accueil. */
export const yeastReferencesNoyau = (saved?: HopKnowledge[]): YeastReference[] => yeastReferencesAvec(saved, { includeCatalogue: false });
