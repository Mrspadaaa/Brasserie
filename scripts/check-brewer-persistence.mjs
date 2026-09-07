// Run ONLY against a Firestore emulator. Uses the real harness; GEMINI_API_KEY stays in env.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp } from '../functions/node_modules/firebase-admin/lib/esm/app/index.js';
import { getFirestore } from '../functions/node_modules/firebase-admin/lib/esm/firestore/index.js';
import { testRecipe, equipment } from './fixtures/brewerCases.mjs';
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080')
  throw Error('Requires isolated Firestore emulator on127.0.0.1:8080');
if (!process.env.GEMINI_API_KEY) throw Error('GEMINI_API_KEY required');
initializeApp({ projectId: 'demo-brewer-chat' });
const db = getFirestore();
process.env.AUTHORIZED_ACCOUNTS = 'brewer@example.invalid';
const { askBrewer, getBrewerConversation, loadBrewerContext } = await import(
  '../functions/lib/brewerChat.js'
);
const { exportBreweryData } = await import('../functions/lib/dataBackup.js');
const { parseBackup } = await import('../functions/lib/backupCore.js');
const runId = randomUUID(),
  recipeId = `REC-${runId}`,
  batchId = `LOT-${runId}`;
await db
  .doc('config/app')
  .set({
    activeBrewhouseId: equipment.id,
    brewhouses: [equipment],
    bankAccount: 'PRIVATE-DONT-SEND',
    waterSources: []
  });
await db.doc(`recipes/${recipeId}`).set({ ...testRecipe, id: recipeId, name: 'Catalogue modifié' });
await db
  .doc(`batches/${batchId}`)
  .set({
    id: batchId,
    name: 'Lot test',
    status: 'planifie',
    volumeL: 24,
    recipeRef: recipeId,
    recipeSnapshot: { ...testRecipe, name: 'Recette figée' },
    brewDay: { steps: [], currentIndex: 0, revision: 3 }
  });
const data = {
  scope: { kind: 'batch', id: batchId },
  operationId: randomUUID(),
  question: '28L mesurés à67°C, chauffe1000W : quel temps pour atteindre80°C ?'
};
const request = {
  auth: { uid: runId, token: { email: 'brewer@example.invalid', email_verified: true } },
  data
};
await assert.rejects(
  () => askBrewer.run({ data }),
  (e) => e.code === 'unauthenticated'
);
const ctx = await loadBrewerContext(data);
assert.equal(ctx.recipe.name, 'Recette figée');
assert.ok(!JSON.stringify(ctx).includes('PRIVATE-DONT-SEND'));
const initial = askBrewer.run(request);
await new Promise((r) => setTimeout(r, 1200));
await assert.rejects(
  () => askBrewer.run(request),
  (e) => e.code === 'aborted'
);
const first = await initial;
assert.equal(first.turn.reviewed, true);
const retry = await askBrewer.run(request);
assert.deepEqual(retry, first);
await assert.rejects(
  () => askBrewer.run({ ...request, data: { ...data, question: 'Un autre contenu' } }),
  (e) => e.code === 'already-exists'
);
const second = await askBrewer.run({
  ...request,
  data: {
    ...data,
    operationId: randomUUID(),
    question: 'Et avec1500W pour le même volume mesuré et la même montée de température ?'
  }
});
assert.notEqual(second.turn.id, first.turn.id);
const history = await getBrewerConversation.run({ ...request, data: { scope: data.scope } });
assert.equal(history.turns.length, 2);
const [a, b] = await Promise.all([
  db.doc(`brewerChats/${first.turn.id}`).get(),
  db.doc(`brewerChats/${second.turn.id}`).get()
]);
assert.equal(a.data().contextId, b.data().contextId);
const snapshot = await exportBreweryData.run({ ...request, data: {} });
const backup = parseBackup(snapshot.json);
assert.ok(backup.collections.brewerChats.some((r) => r.id === first.turn.id));
assert.ok(backup.collections.brewerContexts.some((r) => r.id === a.data().contextId));
const unchanged = await db.doc(`batches/${batchId}`).get();
assert.equal(unchanged.data().brewDay.revision, 3);
assert.equal(unchanged.data().recipeSnapshot.name, 'Recette figée');
console.log(
  JSON.stringify({
    passed: [
      'auth',
      'context-snapshot',
      'private-fields-excluded',
      'concurrent-lease',
      'idempotent-retry',
      'mismatched-retry-rejected',
      'history-followup',
      'deduplicated-context',
      'backup-complete',
      'journal-unmodified'
    ],
    turns: 2,
    reviewed: first.turn.reviewed && second.turn.reviewed
  })
);
