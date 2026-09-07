// Isolated Firestore emulator only; deterministic provider stub, never a production document.
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { initializeApp } from '../functions/node_modules/firebase-admin/lib/esm/app/index.js';
import { getFirestore } from '../functions/node_modules/firebase-admin/lib/esm/firestore/index.js';
import { testRecipe, equipment } from './fixtures/brewerCases.mjs';
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080')
  throw Error('Requires isolated Firestore emulator.');
initializeApp({ projectId: 'demo-brewer-chat' });
process.env.AUTHORIZED_ACCOUNTS = 'brewer@example.invalid';
process.env.GEMINI_API_KEY = 'emulator-stub';
const {
  askBrewer,
  getBrewerConversation,
  resetBrewerConversation,
  applyBrewerProposal,
  loadBrewerContext
} = await import('../functions/lib/brewerChat.js');
const { processBrewerQuestion } = await import('../functions/lib/brewerJobs.js');
const { prepareProposal } = await import('../functions/lib/brewerProposals.js');
const db = getFirestore(),
  uid = randomUUID(),
  recipeId = `REC-${uid}`,
  batchId = `LOT-${uid}`;
const hash = (s) => createHash('sha256').update(s).digest('hex');
const auth = { uid, token: { email: 'brewer@example.invalid', email_verified: true } },
  scope = { kind: 'recipe', id: recipeId },
  threadId = hash(`${uid}:recipe:${recipeId}`);
const request = (data) => ({ auth, data });
await db
  .doc('config/app')
  .set({ activeBrewhouseId: equipment.id, brewhouses: [equipment], waterSources: [] });
await db.doc(`recipes/${recipeId}`).set({ ...testRecipe, id: recipeId });
await db.doc(`batches/${batchId}`).set({
  id: batchId,
  name: 'Test',
  status: 'planifie',
  volumeL: 24,
  recipeSnapshot: testRecipe,
  brewDay: {
    steps: [{ id: 'mash-0', label: 'Empâtage', durationMin: 60, tempC: 67 }],
    currentIndex: 0,
    revision: 1
  }
});
let checks = 0;
async function rejected(fn, code) {
  await assert.rejects(fn, (e) => e.code === code);
  checks++;
}
async function seed(target, changes, s = scope) {
  const id = hash(randomUUID()),
    tid = hash(`${uid}:${s.kind === 'draft' ? 'recipe' : s.kind}:${s.id}`),
    contextId = hash(randomUUID());
  const context = await loadBrewerContext({
    scope: s,
    editableTargets: [target],
    ...(s.kind === 'draft' ? { draft: { ...testRecipe, id: s.id } } : {})
  });
  const proposal = prepareProposal(context, {
    target,
    title: 'Ajuster',
    changes: changes.map(([path, value]) => ({
      path,
      valueJson: JSON.stringify(value),
      reason: 'Demande explicite'
    }))
  });
  const turn = {
    id,
    uid,
    threadId: tid,
    scope: s,
    contextId,
    operationId: randomUUID(),
    question: 'Modifier les champs',
    reviewed: true,
    proposal,
    createdAt: Date.now(),
    generation: 0,
    advice: {},
    evidence: []
  };
  await db.doc(`brewerContexts/${contextId}`).set({ id: contextId, context });
  await db.doc(`brewerChats/${id}`).set(turn);
  return { turn, context };
}
const first = await seed('recipe', [
  ['boilMin', 70],
  ['name', 'Pale v2']
]);
const apply = {
  scope,
  turnId: first.turn.id,
  selectedIds: ['C1'],
  decision: 'apply',
  confirmed: true
};
await rejected(() => applyBrewerProposal.run({ data: apply }), 'unauthenticated');
await rejected(
  () => applyBrewerProposal.run(request({ ...apply, confirmed: false })),
  'invalid-argument'
);
assert.equal((await db.doc(`recipes/${recipeId}`).get()).data().boilMin, 60);
checks++;
await applyBrewerProposal.run(request(apply));
let stored = (await db.doc(`recipes/${recipeId}`).get()).data();
assert.equal(stored.boilMin, 70);
assert.equal(stored.name, testRecipe.name);
checks += 2;
await applyBrewerProposal.run(request(apply));
assert.equal(
  (await db.doc(`brewerChats/${first.turn.id}`).get()).data().proposal.status,
  'applied'
);
checks++;
assert.equal(
  (await db.collection('auditLogs').where('proposalTurnId', '==', first.turn.id).get()).size,
  1
);
checks++;
await rejected(
  () => applyBrewerProposal.run(request({ ...apply, selectedIds: ['C2'] })),
  'already-exists'
);
const stale = await seed('recipe', [['boilMin', 75]]);
await db.doc(`recipes/${recipeId}`).update({ style: 'Style corrigé à la main' });
await rejected(
  () => applyBrewerProposal.run(request({ ...apply, turnId: stale.turn.id })),
  'failed-precondition'
);
assert.equal((await db.doc(`recipes/${recipeId}`).get()).data().boilMin, 70);
checks++;
const dismiss = await seed('recipe', [['boilMin', 80]]);
await applyBrewerProposal.run(
  request({ ...apply, turnId: dismiss.turn.id, decision: 'dismiss', selectedIds: [] })
);
assert.equal((await db.doc(`recipes/${recipeId}`).get()).data().boilMin, 70);
checks++;
const draftScope = { kind: 'draft', id: `DRAFT-${uid}` },
  draft = await seed('recipe', [['boilMin', 90]], draftScope);
const draftResult = await applyBrewerProposal.run(
  request({
    ...apply,
    scope: draftScope,
    turnId: draft.turn.id,
    draft: { ...testRecipe, id: draftScope.id }
  })
);
assert.equal(draftResult.value.boilMin, 90);
assert.equal((await db.doc(`recipes/${draftScope.id}`).get()).exists, false);
checks += 2;
assert.equal(
  (await db.doc(`brewerChats/${draft.turn.id}`).get()).data().proposal.status,
  undefined
);
checks++;
const batchScope = { kind: 'batch', id: batchId },
  reading = await seed(
    'journal',
    [['newReading', { kind: 'temperature', value: 62, unit: '°C' }]],
    batchScope
  );
const readingInput = { ...apply, scope: batchScope, turnId: reading.turn.id };
await applyBrewerProposal.run(request(readingInput));
await applyBrewerProposal.run(request(readingInput));
stored = (await db.doc(`batches/${batchId}`).get()).data();
assert.equal(stored.brewDay.readings.length, 1);
assert.equal(stored.brewDay.readings[0].value, 62);
assert.equal(stored.brewDay.revision, 2);
assert.equal(stored.recipeSnapshot.boilMin, 60);
checks += 4;
// Hold a real askBrewer handler inside its provider request, then reset its generation.
let release, entered;
const started = new Promise((r) => {
    entered = r;
  }),
  gate = new Promise((r) => {
    release = r;
  });
let calls = 0;
globalThis.fetch = async (url) => {
  if (!String(url).includes('generativelanguage.googleapis.com'))
    throw Error('Unexpected network request in emulator test');
  if (++calls === 1) {
    entered();
    await gate;
    return new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              role: 'model',
              parts: [
                {
                  functionCall: {
                    name: 'finish_advice',
                    args: {
                      level: 'info',
                      summary: 'Réponse ancienne',
                      action: 'Contrôle la mesure.',
                      why: '',
                      watch: '',
                      question: '',
                      evidenceIds: []
                    }
                  }
                }
              ]
            }
          }
        ]
      })
    );
  }
  return new Response(
    JSON.stringify({
      candidates: [
        {
          content: {
            role: 'model',
            parts: [
              { text: JSON.stringify({ approved: true, proposalApproved: true, issues: [] }) }
            ]
          }
        }
      ]
    })
  );
};
const oldOperation = randomUUID(),
  receipt = await askBrewer.run(
    request({ scope, operationId: oldOperation, question: 'Question avant reset', generation: 0 })
  );
const late = processBrewerQuestion.run({ data: { jobId: receipt.job.id } });
const lateResult = late.then(
  () => null,
  (e) => e
);
await started;
const resetInput = { scope, generation: 0, operationId: randomUUID() };
const reset = await resetBrewerConversation.run(request(resetInput));
assert.equal(reset.generation, 1);
checks++;
assert.deepEqual(await resetBrewerConversation.run(request(resetInput)), reset);
checks++;
assert.equal((await getBrewerConversation.run(request({ scope }))).turns.length, 0);
checks++;
release();
assert.equal(await lateResult, null);
checks++;
assert.equal(
  (await db.collection('auditLogs').where('proposalTurnId', '==', first.turn.id).get()).size,
  1
);
checks++;
assert.equal((await db.collection('brewerChats').where('threadId', '==', threadId).get()).size, 0);
checks++;
await rejected(
  () => getBrewerConversation.run(request({ scope, operationId: oldOperation, generation: 0 })),
  'failed-precondition'
);
await rejected(
  () =>
    askBrewer.run(
      request({ scope, operationId: randomUUID(), question: 'Ancien onglet', generation: 0 })
    ),
  'failed-precondition'
);
assert.equal((await db.doc(`recipes/${recipeId}`).get()).data().boilMin, 70);
checks++;
console.log({
  ok: true,
  checks,
  resetGeneration: 1,
  lateAnswerDiscarded: true,
  recipePreserved: true
});
await db.terminate();
