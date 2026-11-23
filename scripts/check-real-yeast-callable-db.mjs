// Replay one captured REAL provider response through the real aiTask handler,
// monthly budget and Firestore recipe document on a demo emulator. No paid call.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const projectId = 'demo-yeast-ai', email = 'qa-yeast@example.invalid';
const hub = await fetch('http://127.0.0.1:4400/emulators').then(response => response.json()).catch(() => null);
if (hub?.firestore?.host !== '127.0.0.1' || hub.firestore.port !== 8080) throw Error('Émulateur isolé absent ; aucune écriture.');
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.GCLOUD_PROJECT = projectId;
process.env.AUTHORIZED_ACCOUNTS = email;
process.env.GEMINI_API_KEY = 'qa-stub-key-no-provider-call';
const source = JSON.parse(await readFile(resolve(root, 'work/ux-mobile-poc-2026-09-25/review/real-yeast-lookups-expanded.json'), 'utf8'));
const captured = source.results.find(row => row.requestedName === 'SafAle S-04' && !row.error && !row.validationError && row.data?.found);
assert(captured, 'Réponse réelle S‑04 validée requise.');
const { initializeApp, deleteApp } = await import('../functions/node_modules/firebase-admin/lib/esm/app/index.js');
const { getFirestore } = await import('../functions/node_modules/firebase-admin/lib/esm/firestore/index.js');
const app = initializeApp({ projectId });
const db = getFirestore(app);
let providerAttempts = 0, sentMaxOutputTokens;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, options) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  if (url.hostname !== 'generativelanguage.googleapis.com') throw Error('Requête réseau inattendue dans le test isolé.');
  providerAttempts++;
  if (providerAttempts > 1) throw Error('Une seule réponse capturée autorisée.');
  const request = JSON.parse(options.body);
  sentMaxOutputTokens = request.generationConfig?.maxOutputTokens;
  assert.equal(sentMaxOutputTokens, 12000, 'Le handler Levure doit réserver assez de sortie pour la fiche complète.');
  assert.deepEqual(request.tools, [{ googleSearch: {} }]);
  return new Response(JSON.stringify({ modelVersion: captured.modelVersion,
    candidates: [{ content: { parts: [{ text: JSON.stringify(captured.data) }] } }],
    usageMetadata: { ...captured.usage, cachedContentTokenCount: 0 } }),
  { status: 200, headers: { 'Content-Type': 'application/json' } });
};
const reportPath = resolve(process.env.YEAST_REPLAY_REPORT ?? resolve(root, 'work/ux-mobile-poc-2026-09-25/review/real-yeast-callable-db-check.json'));
try {
  await db.doc('brewerAiControls/current').set({ paused: false, monthlyLimitMicroChf: 10_000_000,
    limits: { dailyCalls: 20, dailyProCalls: 20, dailyTokens: 1_000_000 } });
  const { aiTask } = await import('../functions/lib/ai.js');
  const result = await aiTask.run({ auth: { uid: 'qa-real-yeast', token: { email, email_verified: true } },
    data: { task: 'lookupIngredient', tier: 'fast', instruction: 'levure : SafAle S-04',
      context: { kind: 'levure', name: 'SafAle S-04', reviewTechnicalSheet: true,
        known: { name: 'SafAle S-04', lab: 'Fermentis', form: 'sèche' } } } });
  assert.equal(result.ok, true, result.error || 'aiTask a refusé la réponse capturée.');
  assert.equal(providerAttempts, 1);
  const { outputFiles } = await build({ entryPoints: [resolve(root, 'src/domain/ingredientFacts.ts')], bundle: true,
    write: false, platform: 'node', format: 'esm', target: 'node22' });
  const { adaptYeastLookupResult, applyReviewedYeastFacts } = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].contents).toString('base64')}`);
  const yeast = applyReviewedYeastFacts({ name: 'SafAle S-04', notes: 'Note opérationnelle de la fixture.' }, adaptYeastLookupResult(result.data), [], {});
  const recipe = JSON.parse(JSON.stringify({ id: 'qa-real-callable-s04', name: 'QA S‑04 · fiche IA réelle', style: 'Fixture isolée',
    volumeL: 20, boilMin: 60, fermentables: [], hops: [], yeast,
    fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 20, days: 10 }] }));
  const ref = db.doc(`recipes/${recipe.id}`);
  await ref.set(recipe);
  const reopened = (await ref.get()).data();
  assert.deepEqual(reopened, recipe);
  assert.equal(reopened.yeast.flocculation, 'High / Fast sedimentation');
  assert.deepEqual(reopened.yeast.technicalSelections?.attenuation?.range, { min: 74, max: 82 });
  assert.equal(reopened.yeast.attenuationPct, undefined);
  assert.equal(reopened.yeast.notes, 'Note opérationnelle de la fixture.');
  if (typeof result.data.note === 'string' && result.data.note.trim()) {
    assert.equal(reopened.yeast.documentaryNotes?.[0]?.text, result.data.note);
    assert.equal(reopened.yeast.documentaryNotes?.[0]?.origin, 'ai');
    assert.equal(reopened.yeast.documentaryNotes?.[0]?.source, result.data.source);
  } else assert.equal(reopened.yeast.documentaryNotes, undefined, 'Une réponse sans note ne doit pas en inventer une.');
  // Separate, explicitly synthetic narrative fixture: it is not attributed to the captured manufacturer response.
  const narrative = { found: true, name: 'SafAle S-04', source: 'Fixture narrative isolée', note: 'Texte de contrôle documentaire, sans conseil fabricant.' };
  const narrativeYeast = applyReviewedYeastFacts(reopened.yeast, adaptYeastLookupResult(narrative), [], {});
  const narrativeRecipe = JSON.parse(JSON.stringify({ ...reopened, id: 'qa-narrative-s04', yeast: narrativeYeast }));
  const narrativeRef = db.doc(`recipes/${narrativeRecipe.id}`);
  await narrativeRef.set(narrativeRecipe);
  const narrativeReopened = (await narrativeRef.get()).data();
  assert.deepEqual(narrativeReopened, narrativeRecipe);
  assert.equal(narrativeReopened.yeast.notes, reopened.yeast.notes);
  assert.deepEqual(narrativeReopened.yeast.documentaryNotes, [{ text: narrative.note, origin: 'ai', source: narrative.source }]);
  const month = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit' }).format(new Date());
  const ledger = (await db.doc(`brewerAiCosts/${month}`).get()).data();
  const report = { schema: 'laffinee.real-yeast-callable-db.v1', projectId, replayedPublicResponse: 'SafAle S-04',
    paidProviderCalls: 0, handlerProviderAttempts: providerAttempts, sentMaxOutputTokens,
    model: result.model, budgetRecorded: !!ledger, recipePersisted: true, syntheticNarrativePersistedSeparately: true,
    yeastFields: Object.keys(reopened.yeast), technicalFacts: reopened.yeast.technicalFacts?.length,
    documentSha256: createHash('sha256').update(JSON.stringify(reopened)).digest('hex') };
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ reportPath, ...report, yeastFields: undefined }));
} finally {
  globalThis.fetch = originalFetch;
  await deleteApp(app);
}
