// Reviewed offline supplements → proposed local data changes. Dry-run by default.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { assertHopKnowledge } from '../functions/lib/hopPredictionSchema.js';
import { assertYeastCatalogue } from '../functions/lib/yeastCatalogueSchema.js';
import { validateSupplements, enrichYeastDataset } from './yeast-catalogue/enrichment.mjs';

const names = ['mangrove', 'nolo', 'escarpment'];
const files = names.map(name => `docs/research/yeast-enrichment/${name}.json`);
for (const argument of process.argv.filter(value => value.startsWith('--supplement='))) {
  const file = argument.slice(13);
  if (!file || files.includes(file)) throw Error('Supplement path must be non-empty and unique');
  files.push(file); names.push(file);
}
const datasets = ['yeastCatalogueBootstrap', 'yeastCoreReferences', 'yeastRecipeReferences'];
const supplements = await Promise.all(files.map(file => readFile(file, 'utf8').then(JSON.parse)));
const baseline = await Promise.all(datasets.map(name => readFile(`src/data/${name}.json`, 'utf8').then(JSON.parse)));
validateSupplements(supplements, baseline[0], assertYeastCatalogue);
const proposals = baseline.map(rows => enrichYeastDataset(rows, supplements));
for (const proposal of proposals) proposal.rows.forEach(row => assertHopKnowledge(row, row.id));
const report = { generatedAt: new Date().toISOString(), apply: process.argv.includes('--apply'),
  datasets: Object.fromEntries(datasets.map((name, index) => [name, {
    references: proposals[index].rows.length, factsBefore: baseline[index].reduce((sum, row) => sum + row.catalogue.facts.length, 0),
    factsAfter: proposals[index].rows.reduce((sum, row) => sum + row.catalogue.facts.length, 0), changed: proposals[index].changed
  }])),
  gaps: Object.fromEntries(names.map((name, index) => [name, supplements[index].gaps])) };
await mkdir('.codex-remote-attachments/yeast-enrichment', { recursive: true });
await writeFile('.codex-remote-attachments/yeast-enrichment/last-local-plan.json', JSON.stringify(report, null, 2) + '\n');
// Stable selection includes every reviewed reference even during an idempotent re-run.
await writeFile('docs/research/yeast-enrichment/import-ids.json', JSON.stringify([...new Set(supplements.flatMap(pack => pack.items.map(item => item.id)))].sort(), null, 2) + '\n');
if (report.apply) for (let index = 0; index < datasets.length; index++) {
  if (proposals[index].changed.length) await writeFile(`src/data/${datasets[index]}.json`, JSON.stringify(proposals[index].rows, null, 2) + '\n');
}
console.log(JSON.stringify({ apply: report.apply, datasets: Object.fromEntries(Object.entries(report.datasets).map(([name, data]) => [name,
  { references: data.references, updated: data.changed.length, factsAdded: data.factsAfter - data.factsBefore, formsAdded: data.changed.filter(row => row.formAdded).length }])) }, null, 2));
