// Same QA adapters for both builds; production source overrides stay in memory.
import { buildHopRecipeQa } from './build-hop-recipe-qa.mjs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baseline = process.env.RECIPE_OPEN_BASELINE === '1';
const minimalCatalogue = process.env.RECIPE_OPEN_MINIMAL_CATALOGUE === '1';
const coldReferences = process.env.RECIPE_OPEN_COLD_REFERENCES === '1';
const ref = '5a49cc51ba4d37ef4300e6404c0c989d22d10425';
const files = ['src/pages/PageShell.tsx', 'src/services/storage.ts', 'src/domain/hopIndex/recipeGuide.ts', 'src/domain/yeastReferences.ts',
  'src/App.tsx', 'src/components/tabs/ProductionTab.tsx', 'src/pages/RecipePage.tsx', 'src/ui/RecipeDisclosure.tsx',
  'src/ui/YeastRecipeWorkbench.tsx', 'src/ui/hopIndex/HopRecipePanel.tsx',
  'src/ui/hopIndex/guideVarieties.ts', 'src/ui/hopIndex/useHopCatalogue.ts', 'src/ui/production/CatalogCards.tsx'];
const sources = baseline ? new Map(files.map(file => [resolve(root, file).replaceAll('\\', '/'), execFileSync('git', ['show', `${ref}:${file}`], { encoding: 'utf8', cwd: root })])) : new Map();
// Offline controls must not be accidentally warmed by the standard fixture's
// catalogue installation. This changes only the local QA entry point.
if (minimalCatalogue || coldReferences) {
  const entry = resolve(root, 'tests/qa/hop-recipe/main.tsx');
  let source = readFileSync(entry, 'utf8');
  if (minimalCatalogue || coldReferences) source = source.replace('const varieties = await loadGuideVarieties();', 'const varieties = [];');
  if (coldReferences) source = source.replace("const knowledge = guidePredictionKnowledge(yeastCatalogue.filter(y => ['lalbrew-diamond', 'fermentis-us05', 'lalbrew-verdant-ipa'].includes(y.id)) as HopKnowledge[]);", 'const knowledge: HopKnowledge[] = [];');
  sources.set(entry.replaceAll('\\', '/'), source);
}
console.log(JSON.stringify({ root, source: baseline ? ref : 'working-tree', minimalCatalogue, coldReferences, overriddenModules: baseline ? files : [] }));
await buildHopRecipeQa(process.env.HOP_QA_BUILD_DIR, { reactProfile: process.env.RECIPE_OPEN_REACT_PROFILE === '1', keepNames: process.env.RECIPE_OPEN_REACT_PROFILE === '1', plugins: [{
  name: 'recipe-performance-baseline', enforce: 'pre', load(id) { return sources.get(id.replaceAll('\\', '/')); }
}] });
