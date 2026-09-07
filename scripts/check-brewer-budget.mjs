// Isolated budget/kill-switch checks. No paid API calls, production data or credentials.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initializeApp } from '../functions/node_modules/firebase-admin/lib/esm/app/index.js';
import { getFirestore } from '../functions/node_modules/firebase-admin/lib/esm/firestore/index.js';
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') throw Error('Emulator required.');
initializeApp({ projectId: 'demo-brewer-chat' });
process.env.AUTHORIZED_ACCOUNTS = 'brewer@example.invalid';
const { budgetedBrewerTransport, brewerBudgetDay, getBrewerAiBudget, setBrewerAiBudget } =
  await import('../functions/lib/brewerBudget.js');
const { DEFAULT_BREWER_LIMITS, BrewerBudgetError } =
  await import('../functions/lib/brewerLimits.js');
const { publicJob } = await import('../functions/lib/brewerJobs.js');
const db = getFirestore(),
  controls = db.doc('brewerAiControls/current'),
  daily = db.doc(`brewerAiUsage/${brewerBudgetDay()}`);
const originalControl = (await controls.get()).data(),
  originalDaily = (await daily.get()).data();
const jobs = [],
  guards = [];
const body = {
  contents: [{ role: 'user', parts: [{ text: 'Test' }] }],
  generationConfig: { maxOutputTokens: 100 }
};
const signal = AbortSignal.timeout(30000);
let checks = 0,
  calls = 0;
const check = (v) => {
  assert.ok(v);
  checks++;
};
const expectBudget = async (task, code) => {
  await assert.rejects(task, (e) => e instanceof BrewerBudgetError && e.code === code);
  checks++;
};
async function reset(limits = {}) {
  await controls.set({ paused: false, limits: { ...DEFAULT_BREWER_LIMITS, ...limits } });
  await daily.set({ usage: { calls: 0, proCalls: 0, tokens: 0 } });
  calls = 0;
}
async function job() {
  const id = randomUUID(),
    fence = randomUUID();
  await db.doc(`brewerJobs/${id}`).set({ status: 'running', fence });
  jobs.push(id);
  return { id, fence };
}
function guard(j, provider = async () => ({ usageMetadata: { totalTokenCount: 42 } })) {
  const g = budgetedBrewerTransport(
    async (...args) => {
      calls++;
      return provider(...args);
    },
    j.id,
    j.fence
  );
  guards.push(g);
  return g;
}
try {
  await assert.rejects(
    () => getBrewerAiBudget.run({ data: {} }),
    (e) => e.code === 'unauthenticated'
  );
  checks++;
  await assert.rejects(
    () => setBrewerAiBudget.run({ data: { paused: true } }),
    (e) => e.code === 'unauthenticated'
  );
  checks++;
  const auth = {
    uid: 'test-budget',
    token: { email: 'brewer@example.invalid', email_verified: true }
  };
  await assert.rejects(
    () => setBrewerAiBudget.run({ auth, data: { paused: false, limits: { dailyCalls: -1 } } }),
    (e) => e.code === 'invalid-argument'
  );
  checks++;
  check(brewerBudgetDay(Date.parse('2026-09-07T22:30:00Z')) === '2026-09-08');
  await reset();
  const first = await job(),
    g = guard(first);
  await g.generate('gemini-3.8-flash', body, signal);
  await g.generate('gemini-3.1-pro-preview', body, signal);
  const accounting = (await daily.get()).data().usage;
  check(accounting.calls === 2 && accounting.proCalls === 1 && accounting.tokens === 84);
  const privateJob = (await db.doc(`brewerJobs/${first.id}`).get()).data();
  check(Object.keys(privateJob.budget.calls).length === 2);
  check(!('budget' in publicJob(privateJob)));
  g.close();

  await reset({ dailyCalls: 1 });
  const a = guard(await job()),
    b = guard(await job());
  const results = await Promise.allSettled([
    a.generate('gemini-3.8-flash', body, signal),
    b.generate('gemini-3.8-flash', body, signal)
  ]);
  check(results.filter((r) => r.status === 'fulfilled').length === 1);
  check(results.some((r) => r.status === 'rejected' && r.reason.code === 'ai-daily-limit'));
  check(calls === 1);
  a.close();
  b.close();

  await reset({ dailyProCalls: 0 });
  const noPro = guard(await job());
  await expectBudget(
    () => noPro.generate('gemini-3.1-pro-preview', body, signal),
    'ai-daily-limit'
  );
  check(calls === 0);
  noPro.close();

  await reset({ questionCalls: 1 });
  const limited = await job(),
    attempt = guard(limited);
  await attempt.generate('gemini-3.8-flash', body, signal);
  attempt.close();
  const retry = guard(limited);
  await expectBudget(() => retry.generate('gemini-3.8-flash', body, signal), 'ai-question-limit');
  check(calls === 1);
  retry.close();

  await reset({ questionTokens: 50 });
  const tooLarge = guard(await job());
  await expectBudget(
    () => tooLarge.generate('gemini-3.8-flash', body, signal),
    'ai-question-limit'
  );
  check(calls === 0);
  tooLarge.close();

  await reset();
  const failed = guard(await job(), async () => {
    throw Error('Timeout');
  });
  await assert.rejects(() => failed.generate('gemini-3.8-flash', body, signal), /Timeout/);
  checks++;
  check((await daily.get()).data().usage.tokens >= 100);
  failed.close();

  await reset();
  let started;
  const entered = new Promise((resolve) => {
    started = resolve;
  });
  const interrupt = guard(await job(), async (_model, _body, stop) => {
    started();
    return new Promise((_resolve, reject) => {
      if (stop.aborted) reject(stop.reason);
      else stop.addEventListener('abort', () => reject(stop.reason), { once: true });
    });
  });
  const running = interrupt.generate('gemini-3.8-flash', body, signal);
  // Attach rejection handling before switching off the provider request.
  const stopped = expectBudget(() => running, 'ai-paused');
  await entered;
  const pause = await setBrewerAiBudget.run({ auth, data: { paused: true } });
  check(pause.paused === true);
  const changedLimits = await setBrewerAiBudget.run({
    auth,
    data: { limits: { dailyCalls: 100 } }
  });
  check(changedLimits.paused === true && changedLimits.limits.dailyCalls === 100);
  await stopped;
  await expectBudget(() => interrupt.generate('gemini-3.8-flash', body, signal), 'ai-paused');
  check(calls === 1);
  interrupt.close();
  await setBrewerAiBudget.run({ auth, data: { paused: false } });
  const resumed = guard(await job());
  await resumed.generate('gemini-3.8-flash', body, signal);
  check(calls === 2);
  resumed.close();

  await reset();
  const stale = guard({ ...(await job()), fence: 'wrong-fence' });
  await assert.rejects(
    () => stale.generate('gemini-3.8-flash', body, signal),
    (e) => e.code === 'aborted'
  );
  checks++;
  check(calls === 0);
  stale.close();
  await reset();
  let allowedOutput;
  const capped = guard(await job(), async (_model, requestBody) => {
    allowedOutput = requestBody.generationConfig.maxOutputTokens;
    return { usageMetadata: { totalTokenCount: 42 } };
  });
  await capped.generate(
    'gemini-3.8-flash',
    { ...body, generationConfig: { maxOutputTokens: 999999 } },
    signal
  );
  check(allowedOutput === 12000);
  await expectBudget(
    () =>
      capped.generate(
        'gemini-3.8-flash',
        { ...body, generationConfig: { maxOutputTokens: NaN } },
        signal
      ),
    'ai-budget-unavailable'
  );
  check(calls === 1);
  capped.close();
  console.log({
    ok: true,
    checks,
    atomicQuota: true,
    retryBudget: true,
    killSwitch: true,
    noPaidCalls: true
  });
} finally {
  for (const g of guards) g.close();
  for (const id of jobs) await db.doc(`brewerJobs/${id}`).delete();
  if (originalControl) await controls.set(originalControl);
  else await controls.delete();
  if (originalDaily) await daily.set(originalDaily);
  else await daily.delete();
  await db.terminate();
}
