// Durable queue integration. Explicitly restricted to a local Firestore emulator.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp } from '../functions/node_modules/firebase-admin/lib/esm/app/index.js';
import { getFirestore } from '../functions/node_modules/firebase-admin/lib/esm/firestore/index.js';
import { testRecipe, equipment } from './fixtures/brewerCases.mjs';
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') throw Error('Emulator required.');
initializeApp({ projectId: 'demo-brewer-chat' });
process.env.AUTHORIZED_ACCOUNTS = 'brewer@example.invalid';
process.env.GEMINI_API_KEY = 'emulator-stub';
const { askBrewer, getBrewerActivity, processBrewerQuestion, markBrewerRead } =
  await import('../functions/lib/brewerJobs.js');
const { getBrewerConversation, resetBrewerConversation } =
  await import('../functions/lib/brewerChat.js');
const db = getFirestore(),
  uid = randomUUID(),
  scope = { kind: 'draft', id: `DRAFT-${uid}` };
const auth = { uid, token: { email: 'brewer@example.invalid', email_verified: true } };
const request = (data) => ({ auth, data });
const input = (question) => ({
  scope,
  operationId: randomUUID(),
  question,
  draft: testRecipe,
  generation: 0
});
await db
  .doc('config/app')
  .set({ activeBrewhouseId: equipment.id, brewhouses: [equipment], waterSources: [] });
let mode = 'ok',
  release,
  entered,
  hold = false,
  seenHistory = false,
  count = 0;
const advice = {
  level: 'info',
  summary: 'Conseil vérifié.',
  action: 'Relève la température.',
  why: '',
  watch: '',
  question: '',
  evidenceIds: []
};
globalThis.fetch = async (url, options) => {
  assert.match(String(url), /generativelanguage.googleapis.com/);
  count++;
  if (mode === 'network') throw Error('Provider unavailable');
  const body = JSON.parse(options.body);
  if (JSON.stringify(body.contents).includes('Conseil vérifié.')) seenHistory = true;
  if (hold) {
    hold = false;
    entered();
    await new Promise((r) => {
      release = r;
    });
  }
  const schema = body.generationConfig?.responseSchema?.properties;
  const part = schema?.approved
    ? {
        text: JSON.stringify({
          approved: mode !== 'review-rejected',
          proposalApproved: true,
          issues: mode === 'review-rejected' ? ['Conseil à corriger.'] : []
        })
      }
    : schema?.summary
      ? { text: JSON.stringify(advice) }
      : { functionCall: { name: 'finish_advice', args: advice } };
  return new Response(
    JSON.stringify({ candidates: [{ content: { role: 'model', parts: [part] } }] })
  );
};
let checks = 0;
const check = (value) => {
  assert.ok(value);
  checks++;
};
await assert.rejects(
  () => askBrewer.run({ data: input('Sans connexion') }),
  (e) => e.code === 'unauthenticated'
);
checks++;
const firstInput = input('Une première question'),
  secondInput = input('Et la suivante ?');
const [first, duplicate] = await Promise.all([
  askBrewer.run(request(firstInput)),
  askBrewer.run(request(firstInput))
]);
check(first.job.id === duplicate.job.id && count === 0);
check(first.job.status === 'queued' && !('input' in first.job) && !('uid' in first.job));
const second = await askBrewer.run(request(secondInput));
check((await getBrewerActivity.run(request({}))).jobs.length === 2);
check(
  (await getBrewerActivity.run({ auth: { ...auth, uid: 'someone-else' }, data: {} })).jobs
    .length === 0
);
await assert.rejects(
  () => processBrewerQuestion.run({ data: { jobId: second.job.id } }),
  /précédente/
);
checks++;
const started = new Promise((r) => {
  entered = r;
});
hold = true;
const running = processBrewerQuestion.run({ data: { jobId: first.job.id } });
await started;
const state = await getBrewerConversation.run(
  request({ scope, operationId: firstInput.operationId, generation: 0 })
);
check(state.job.stage === 'analysis' && state.job.status === 'running' && !!state.job.model);
await assert.rejects(() => processBrewerQuestion.run({ data: { jobId: first.job.id } }), /déjà/);
checks++;
release();
await running;
const finished = await getBrewerConversation.run(
  request({ scope, operationId: firstInput.operationId, generation: 0 })
);
check(finished.turn.question === firstInput.question);
const previousCount = count;
await processBrewerQuestion.run({ data: { jobId: first.job.id } });
check(previousCount === count);
await processBrewerQuestion.run({ data: { jobId: second.job.id } });
check(seenHistory);
check((await db.doc(`brewerJobs/${first.job.id}`).get()).data().input === undefined);
await markBrewerRead.run(request({ jobId: first.job.id }));
check((await db.doc(`brewerJobs/${first.job.id}`).get()).data().readAt > 0);
await assert.rejects(
  () =>
    markBrewerRead.run({ auth: { ...auth, uid: 'someone-else' }, data: { jobId: first.job.id } }),
  (e) => e.code === 'not-found'
);
checks++;
mode = 'review-rejected';
const rejectedInput = input('Un avis qui échoue à la relecture'),
  failed = await askBrewer.run(request(rejectedInput));
await processBrewerQuestion.run({ data: { jobId: failed.job.id } });
const failure = (
  await getBrewerConversation.run(
    request({ scope, operationId: rejectedInput.operationId, generation: 0 })
  )
).job;
check(
  failure.status === 'error' &&
    failure.error.code === 'review-rejected' &&
    failure.question === rejectedInput.question
);
check(!(await db.doc(`brewerChats/${failed.job.id}`).get()).exists);
const failureRecord = (await db.doc(`brewerJobs/${failed.job.id}`).get()).data();
check(failureRecord.diagnostics.reviews.length === 2);
check(failureRecord.diagnostics.reviews[1].issues[0] === 'Conseil à corriger.');
check(!('diagnostics' in failure));
mode = 'network';
const retry = await askBrewer.run(request(input('Panne temporaire')));
await assert.rejects(() => processBrewerQuestion.run({ data: { jobId: retry.job.id } }), /Reprise/);
checks++;
check((await db.doc(`brewerJobs/${retry.job.id}`).get()).data().stage === 'retry');
mode = 'ok';
await processBrewerQuestion.run({ data: { jobId: retry.job.id } });
const retried = (await db.doc(`brewerJobs/${retry.job.id}`).get()).data();
check(retried.status === 'done' && retried.attempt === 2);
const stalled = await askBrewer.run(request(input('Travail interrompu')));
await db.doc(`brewerJobs/${stalled.job.id}`).update({ createdAt: Date.now() - 1801000 });
const expired = (await getBrewerActivity.run(request({}))).jobs.find(
  (j) => j.id === stalled.job.id
);
check(expired.status === 'error' && expired.error.code === 'deadline');
await resetBrewerConversation.run(request({ scope, generation: 0, operationId: randomUUID() }));
check((await getBrewerActivity.run(request({}))).jobs.length === 0);
await processBrewerQuestion.run({ data: { jobId: stalled.job.id } });
check(!(await db.doc(`brewerJobs/${stalled.job.id}`).get()).exists);
console.log({
  ok: true,
  checks,
  durableReceipt: true,
  orderedFollowUps: true,
  explicitFailures: true,
  transientRetry: true
});
await db.terminate();
