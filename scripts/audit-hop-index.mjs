// Reproducible offline inventory and one diagnostic timing; no Firestore or paid AI.
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const output = resolve('.codex-remote-attachments/hop-index');
await mkdir(output, { recursive: true });
const modulePath = resolve(output, 'audit-module.mjs');
await build({ stdin: { resolveDir: resolve('.'), loader: 'ts', contents: `
import manufacturer from './src/data/hopManufacturerBootstrap.json';
import database from './src/data/hopDatabaseBootstrap.json';
import legacy from './src/data/hopLegacyBootstrap.json';
import maverick from './src/data/hopBeerMaverickBootstrap.json';
import study from './src/data/hopStudyBootstrap.json';
import publicLots from './src/data/hopPublicLotBootstrap.json';
import conventions from './src/data/hopKnowledgeBootstrap.json';
import notes from './src/data/hopResearchBootstrap.json';
import yeasts from './src/data/hopYeastBootstrap.json';
import { assertHopDocument } from './functions/src/hopIndexSchema.ts';
import { assertHopKnowledge, HOP_TIMINGS } from './functions/src/hopPredictionSchema.ts';
import { rankHopTriplets } from './functions/src/hopPredictionCore.ts';
import { brewerContextForPrompt, brewerContextForStorage } from './functions/src/hopCompanionContext.ts';
const varieties = [manufacturer, database, legacy, maverick, study, publicLots].flatMap(p => p.hopVarieties);
const lots = publicLots.hopLots;
const measurements = [...varieties.flatMap(v => v.analysis), ...lots.flatMap(l => l.analysis)];
const knowledge = [...conventions, ...study.hopKnowledge, ...notes, ...yeasts];
varieties.forEach(v => assertHopDocument('hopVarieties', v)); lots.forEach(l => assertHopDocument('hopLots', l)); knowledge.forEach(k => assertHopKnowledge(k));
const scope = study.hopKnowledge.find(k => k.kind === 'model').scope;
const candidates = varieties.flatMap(v => knowledge.filter(k => k.kind === 'yeast').flatMap(y => HOP_TIMINGS.map(timing => ({ varietyId: v.id, yeastId: y.id, timing, doseGL: scope.doseGL.min, temperatureC: scope.temperatureC.min, contactHours: scope.contactHours.min, matrixId: scope.matrixId }))));
const started = performance.now();
const ranked = rankHopTriplets(candidates, { 'citrus-lafontaine': { min: 5, max: 10 } }, { varieties, lots, knowledge });
const rankingMs = performance.now() - started;
const context = { now: 0, phase: 'Index houblon', provenance: [], inventory: [], material: [], waterSources: [], hopIndex: { varieties, lots, knowledge, predictions: [], tastings: [], truncated: [] } };
const bytes = v => Buffer.byteLength(JSON.stringify(v), 'utf8');
export default {
  references: varieties.length, uniqueIds: new Set(varieties.map(v => v.id)).size,
  referenceLots: lots.length, measurements: measurements.length,
  measurementsWithUnknownUnit: measurements.filter(m => m.unit === 'unknown').length,
  measurementsWithUnknownYear: measurements.filter(m => m.source.year === null).length,
  models: knowledge.filter(k => k.kind === 'model').length, yeasts: knowledge.filter(k => k.kind === 'yeast').length, notes: notes.length,
  rankedTriplets: ranked.length, quantifiable: ranked.filter(r => r.score.range).length, rankingMs,
  contextBytes: { fullToolMemory: bytes(context), promptOverview: bytes(brewerContextForPrompt(context)), persistedProposalContext: bytes(brewerContextForStorage(context)) },
  timingCaveat: 'Un passage local, sans promesse de performance sur un téléphone physique.'
};` }, platform: 'node', format: 'esm', bundle: true, outfile: modulePath, logLevel: 'silent' });
const result = (await import(pathToFileURL(modulePath).href)).default;
await writeFile(resolve(output, 'data-audit.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
