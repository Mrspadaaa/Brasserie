import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  acceptHandoff, completeHandoff, codexEnvironment, createHandoff, main,
  parseQueueReceipt, queueArguments, statusHandoff, validateHandoffResult, validateRequest,
} from './sol-handoff.mjs';

const TARGET = '01a0de88-b523-7ff2-9b56-5db26cfd0f55';
const OTHER = '22a0de88-b523-7ff2-9b56-5db26cfd0f66';
const MESSAGE = '31a0de88-b523-7ff2-9b56-5db26cfd0f77';

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'laffinee-sol-handoff-test-'));
  const cwd = join(root, 'project');
  const outputDir = join(root, 'mission');
  mkdirSync(cwd);
  mkdirSync(join(cwd, 'src'));
  writeFileSync(join(cwd, 'src', 'screen.tsx'), 'fixture');
  return { root, cwd, outputDir };
}

function request(mode = 'review') {
  return {
    objective: 'Vérifier un contrat précis.',
    mode,
    ownedFiles: mode === 'implement' ? ['src/screen.tsx'] : [],
    checks: ['Rapporter le résultat et une preuve vérifiable.'],
    sourceArtifacts: ['C:/mission/claude-result.json'],
  };
}

function validResult(patch = {}) {
  return {
    status: 'completed',
    summary: 'Le contrat est vérifié.',
    evidence: [{ ref: 'scripts/example.mjs:12', detail: 'La branche retourne le statut attendu.' }],
    openQuestions: [],
    ...patch,
  };
}

function queueRunner({ code = 0, stdout = `Queued message ${MESSAGE} for thread ${TARGET}.`, authCode = 0, authText = 'Logged in using ChatGPT' } = {}) {
  const calls = [];
  const runCommand = async (exe, args, env) => {
    calls.push({ exe, args, env });
    return args[0] === 'login' ? { code: authCode, stdout: authText, stderr: '' } : { code, stdout, stderr: '' };
  };
  return { calls, runCommand };
}

test('native login and queue receipts may be written to stderr', async () => {
  const { root, cwd, outputDir } = fixture();
  try {
    const made = await createHandoff({ request: request(), targetThreadId: TARGET, outputDir, cwd, delivery: 'queue', cliPath: process.execPath,
      runCommand: async (_exe, args) => ({ code: 0, stdout: '', stderr: args[0] === 'login'
        ? 'Logged in using ChatGPT\n' : `Queued message ${MESSAGE} for thread ${TARGET}.\n` }),
    });
    assert.equal(made.deliveryStatus, 'queued');
    assert.equal(made.workStatus, 'pending');
    assert.equal(made.messageId, MESSAGE);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('early v1 bundles derive their own manifest path without weakening identity or digest checks', async () => {
  const { root, cwd, outputDir } = fixture();
  try {
    const made = await createHandoff({ request: request(), targetThreadId: TARGET, outputDir, cwd, delivery: 'returned_to_parent' });
    const path = join(made.requestDir, 'manifest.json');
    const old = JSON.parse(readFileSync(path, 'utf8'));
    delete old.manifestPath;
    writeFileSync(path, JSON.stringify(old));
    assert.throws(() => acceptHandoff({ requestDir: made.requestDir, actorThreadId: OTHER }));
    assert.equal(acceptHandoff({ requestDir: made.requestDir, actorThreadId: TARGET }).workStatus, 'accepted');
    assert.equal(readFileSync(made.requestPath, 'utf8'), JSON.stringify(request(), null, 2) + '\n');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('request validation requires a concrete task and bounded relative ownership', () => {
  const { root, cwd } = fixture();
  try {
    assert.deepEqual(validateRequest(request('implement'), cwd).request.ownedFiles, ['src/screen.tsx']);
    assert.throws(() => validateRequest({ ...request('implement'), ownedFiles: [] }, cwd), /ownedFile/);
    assert.throws(() => validateRequest({ ...request('implement'), ownedFiles: ['../outside.ts'] }, cwd), /relatif/);
    assert.throws(() => validateRequest({ ...request('implement'), ownedFiles: ['C:/outside.ts'] }, cwd), /relatif/);
    assert.throws(() => validateRequest({ ...request(), checks: [] }, cwd), /checks/);
    assert.throws(() => validateRequest({ ...request(), unexpected: true }, cwd), /Champ inconnu/);
    assert.throws(() => validateRequest(request(), join(root, 'missing-cwd')));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('returned_to_parent writes a unique immutable request without queueing', async () => {
  const { root, cwd, outputDir } = fixture();
  const raw = '{"objective":"Conserver ce texte exact.","mode":"review","ownedFiles":[],"checks":["Vérifier la preuve."],"sourceArtifacts":["source.json"]}\n';
  try {
    const runCommand = async () => assert.fail('returned_to_parent must never queue');
    const first = await createHandoff({ request: raw, targetThreadId: TARGET, outputDir, cwd, delivery: 'returned_to_parent', runCommand });
    const second = await createHandoff({ request: raw, targetThreadId: TARGET, outputDir, cwd, delivery: 'returned_to_parent', runCommand });
    assert.equal(first.deliveryStatus, 'returned_to_parent');
    assert.equal(first.workStatus, 'pending');
    assert.notEqual(first.requestId, second.requestId);
    assert.equal(readFileSync(first.requestPath, 'utf8'), raw);
    assert.deepEqual(first.sourceArtifacts, ['source.json']);
    assert.equal(statusHandoff(first.requestDir).requestDigest, first.requestDigest);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('queue uses the existing Sol thread and records only queued, never accepted', async () => {
  const { root, cwd, outputDir } = fixture();
  const { calls, runCommand } = queueRunner();
  const env = { PATH: 'native', CODEX_HOME: 'C:/Users/test/.codex', OPENAI_API_KEY: 'secret', CODEX_API_KEY: 'secret', OPENAI_BASE_URL: 'https://api.invalid' };
  try {
    const result = await createHandoff({ request: request(), targetThreadId: TARGET, outputDir, cwd, delivery: 'queue', env, runCommand, cliPath: 'fake-codex' });
    assert.equal(result.deliveryStatus, 'queued');
    assert.equal(result.workStatus, 'pending');
    assert.equal(result.messageId, MESSAGE);
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0].args, ['login', 'status']);
    assert.equal(calls[1].args[0], 'queue');
    assert.deepEqual(calls[1].args.slice(1, 6), ['--profile', 'sol-full', '--thread', TARGET, '--cd']);
    assert(calls[1].args.includes('--message'));
    assert(!calls[1].args.includes('--sandbox'));
    assert(!calls[1].args.includes('--model'));
    assert(!calls[1].args.includes('exec'));
    const message = calls[1].args[calls[1].args.indexOf('--message') + 1];
    assert(message.includes(result.requestPath));
    assert(message.includes(result.requestDigest));
    assert.equal(calls[1].env.OPENAI_API_KEY, undefined);
    assert.equal(calls[1].env.CODEX_API_KEY, undefined);
    assert.equal(calls[1].env.OPENAI_BASE_URL, undefined);
    assert.equal(calls[1].env.CODEX_HOME, env.CODEX_HOME);
    assert.equal(calls[1].env.PATH, env.PATH);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('queue receipt must match the exact expected CLI text and target thread', () => {
  assert.deepEqual(parseQueueReceipt(`Queued message ${MESSAGE} for thread ${TARGET}.\n`, TARGET), {
    deliveryStatus: 'queued', messageId: MESSAGE, observedThreadId: TARGET,
  });
  assert.equal(parseQueueReceipt('Queued.', TARGET).deliveryStatus, 'unknown');
  const wrong = parseQueueReceipt(`Queued message ${MESSAGE} for thread ${OTHER}.`, TARGET);
  assert.equal(wrong.deliveryStatus, 'unknown');
  assert.equal(wrong.reason, 'receipt_thread_mismatch');
});

test('an unclear or mismatched queue receipt remains unknown and is never retried', async () => {
  const { root, cwd, outputDir } = fixture();
  const { calls, runCommand } = queueRunner({ stdout: `Queued message ${MESSAGE} for thread ${OTHER}.` });
  try {
    const result = await createHandoff({ request: request(), targetThreadId: TARGET, outputDir, cwd, delivery: 'queue', env: {}, runCommand, cliPath: 'fake-codex' });
    assert.equal(result.deliveryStatus, 'unknown');
    assert.equal(result.deliveryReason, 'receipt_thread_mismatch');
    assert.equal(result.observedThreadId, OTHER);
    assert.equal(calls.length, 2);
    assert(existsSync(result.requestPath));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('native auth failure is recorded without attempting queue or deleting the request', async () => {
  const { root, cwd, outputDir } = fixture();
  const { calls, runCommand } = queueRunner({ authCode: 1 });
  try {
    const result = await createHandoff({ request: request(), targetThreadId: TARGET, outputDir, cwd, delivery: 'queue', env: {}, runCommand, cliPath: 'fake-codex' });
    assert.equal(result.deliveryStatus, 'failed');
    assert.equal(result.failureKind, 'native_auth');
    assert.equal(calls.length, 1);
    assert(existsSync(result.requestPath));
    assert(existsSync(result.manifestPath));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('a successful CLI status using API-key auth is rejected before queue', async () => {
  const { root, cwd, outputDir } = fixture();
  const { calls, runCommand } = queueRunner({ authText: 'Logged in using API key' });
  try {
    const result = await createHandoff({ request: request(), targetThreadId: TARGET, outputDir, cwd, delivery: 'queue', env: {}, runCommand, cliPath: 'fake-codex' });
    assert.equal(result.deliveryStatus, 'failed');
    assert.equal(result.failureKind, 'non_chatgpt_auth');
    assert.equal(calls.length, 1);
    assert(existsSync(result.requestPath));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('queue error does not trigger automatic retry and preserves the durable request', async () => {
  const { root, cwd, outputDir } = fixture();
  const { calls, runCommand } = queueRunner({ code: 1, stdout: '' });
  try {
    const result = await createHandoff({ request: request(), targetThreadId: TARGET, outputDir, cwd, delivery: 'queue', env: {}, runCommand, cliPath: 'fake-codex' });
    assert.equal(result.deliveryStatus, 'unknown');
    assert.equal(result.deliveryReason, 'queue_nonzero_exit');
    assert.equal(result.queueExitCode, 1);
    assert.equal(calls.length, 2);
    assert(existsSync(result.requestPath));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('Claude called by Sol cannot queue another Sol handoff', async () => {
  const { root, cwd, outputDir } = fixture();
  const { calls, runCommand } = queueRunner();
  try {
    await assert.rejects(createHandoff({ request: request(), targetThreadId: TARGET, outputDir, cwd, delivery: 'queue', env: { LAFFINEE_CLAUDE_CALLED_BY_SOL: '1' }, runCommand, cliPath: 'fake-codex' }), /rendre needs_sol/);
    assert.equal(calls.length, 0);
    const returned = await createHandoff({ request: request(), targetThreadId: TARGET, outputDir, cwd, delivery: 'returned_to_parent', env: { LAFFINEE_CLAUDE_CALLED_BY_SOL: '1' }, runCommand });
    assert.equal(returned.deliveryStatus, 'returned_to_parent');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('only the target thread may accept, and complete needs acceptance plus evidence', async () => {
  const { root, cwd, outputDir } = fixture();
  const { runCommand } = queueRunner();
  try {
    const sent = await createHandoff({ request: request(), targetThreadId: TARGET, outputDir, cwd, delivery: 'queue', env: {}, runCommand, cliPath: 'fake-codex' });
    assert.throws(() => acceptHandoff({ requestDir: sent.requestDir, actorThreadId: OTHER }), /CODEX_THREAD_ID/);
    assert.equal(statusHandoff(sent.requestDir).workStatus, 'pending');
    assert.throws(() => completeHandoff({ requestDir: sent.requestDir, actorThreadId: TARGET, result: validResult() }), /acceptée/);
    const accepted = acceptHandoff({ requestDir: sent.requestDir, actorThreadId: TARGET });
    assert.equal(accepted.workStatus, 'accepted');
    assert.equal(accepted.requestDigest, sent.requestDigest);
    assert.throws(() => completeHandoff({ requestDir: sent.requestDir, actorThreadId: OTHER, result: validResult() }), /CODEX_THREAD_ID/);
    assert.equal(statusHandoff(sent.requestDir).workStatus, 'accepted');
    assert.throws(() => completeHandoff({ requestDir: sent.requestDir, actorThreadId: TARGET, result: validResult({ evidence: [] }) }), /preuve/);
    assert.equal(statusHandoff(sent.requestDir).workStatus, 'accepted');
    const original = '{"status":"completed","summary":"Vérification finie.","evidence":[{"ref":"scripts/example.mjs:2","detail":"Test exact."}],"openQuestions":[]}\n';
    const completed = completeHandoff({ requestDir: sent.requestDir, actorThreadId: TARGET, result: original });
    assert.equal(completed.workStatus, 'completed');
    assert.equal(readFileSync(completed.resultPath, 'utf8'), original);
    assert.equal(statusHandoff(sent.requestDir).resultDigest, completed.resultDigest);
    assert.throws(() => completeHandoff({ requestDir: sent.requestDir, actorThreadId: TARGET, result: validResult() }), /acceptée/);
    assert.equal(readFileSync(completed.resultPath, 'utf8'), original);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('needs_expert is an explicit terminal outcome with an open question', () => {
  assert.equal(validateHandoffResult({ status: 'needs_expert', summary: 'Question au spécialiste.', evidence: [], openQuestions: ['Le comportement externe reste incertain.'] }).status, 'needs_expert');
  assert.throws(() => validateHandoffResult({ status: 'needs_expert', summary: 'Question.', evidence: [], openQuestions: [] }), /question/);
});

test('status detects corrupted durable input instead of returning an empty record', async () => {
  const { root, cwd, outputDir } = fixture();
  try {
    const created = await createHandoff({ request: request(), targetThreadId: TARGET, outputDir, cwd, delivery: 'returned_to_parent' });
    writeFileSync(created.requestPath, '{"tampered":true}');
    assert.throws(() => statusHandoff(created.requestDir), /altérée/);
    assert(existsSync(created.manifestPath));
    assert(existsSync(created.requestPath));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('accept and complete both refuse a changed request without removing it', async () => {
  const { root, cwd, outputDir } = fixture();
  try {
    const forAccept = await createHandoff({ request: request(), targetThreadId: TARGET, outputDir, cwd, delivery: 'returned_to_parent' });
    writeFileSync(forAccept.requestPath, '{"changed":"accept"}');
    assert.throws(() => acceptHandoff({ requestDir: forAccept.requestDir, actorThreadId: TARGET }), /altérée/);
    assert(existsSync(forAccept.requestPath));

    const forComplete = await createHandoff({ request: request(), targetThreadId: TARGET, outputDir, cwd, delivery: 'returned_to_parent' });
    acceptHandoff({ requestDir: forComplete.requestDir, actorThreadId: TARGET });
    writeFileSync(forComplete.requestPath, '{"changed":"complete"}');
    assert.throws(() => completeHandoff({ requestDir: forComplete.requestDir, actorThreadId: TARGET, result: validResult() }), /altérée/);
    assert(existsSync(forComplete.requestPath));
    assert(!existsSync(join(forComplete.requestDir, 'result.json')));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('active transition lock is never removed automatically', async () => {
  const { root, cwd, outputDir } = fixture();
  try {
    const created = await createHandoff({ request: request(), targetThreadId: TARGET, outputDir, cwd, delivery: 'returned_to_parent' });
    const lock = join(created.requestDir, 'transition.lock');
    writeFileSync(lock, 'active-or-stale');
    assert.throws(() => acceptHandoff({ requestDir: created.requestDir, actorThreadId: TARGET }), /vérifié manuellement/);
    assert.equal(readFileSync(lock, 'utf8'), 'active-or-stale');
    assert.equal(statusHandoff(created.requestDir).workStatus, 'pending');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('dry-run validates routing and request without writing or calling Codex', async () => {
  const { root, cwd, outputDir } = fixture();
  const requestPath = join(root, 'request.json');
  writeFileSync(requestPath, JSON.stringify(request('implement')));
  try {
    const result = await main(['send', '--request', requestPath, '--output-dir', outputDir, '--cwd', cwd, '--thread', TARGET, '--dry-run'], {
      env: {}, runCommand: async () => assert.fail('dry-run must not invoke the CLI'),
    });
    assert.equal(result.dryRun, true);
    assert.equal(result.configuredProfile, 'sol-full');
    assert.equal(result.permissionsChanged, false);
    assert(result.command.includes('queue'));
    assert(!result.command.includes('--sandbox'));
    assert(!existsSync(outputDir));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('CLI accept and complete use CODEX_THREAD_ID from the live target session', async () => {
  const { root, cwd, outputDir } = fixture();
  const resultFile = join(root, 'sol-result.json');
  writeFileSync(resultFile, JSON.stringify(validResult()));
  try {
    const created = await createHandoff({ request: request(), targetThreadId: TARGET, outputDir, cwd, delivery: 'returned_to_parent' });
    await assert.rejects(main(['accept', '--request-dir', created.requestDir], { env: { CODEX_THREAD_ID: OTHER } }), /CODEX_THREAD_ID/);
    const accepted = await main(['accept', '--request-dir', created.requestDir], { env: { CODEX_THREAD_ID: TARGET } });
    assert.equal(accepted.workStatus, 'accepted');
    const completed = await main(['complete', '--request-dir', created.requestDir, '--result', resultFile], { env: { CODEX_THREAD_ID: TARGET } });
    assert.equal(completed.workStatus, 'completed');
    assert.equal(statusHandoff(created.requestDir).workStatus, 'completed');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('Codex child environment drops API credentials and endpoint overrides only', () => {
  const env = codexEnvironment({ CODEX_HOME: 'home', CODEX_THREAD_ID: TARGET, OPENAI_API_KEY: 'secret', CODEX_API_KEY: 'secret', ANTHROPIC_API_KEY: 'secret', OPENAI_API_BASE_URL: 'https://example.invalid', PATH: 'native' });
  assert.equal(env.CODEX_HOME, 'home');
  assert.equal(env.CODEX_THREAD_ID, TARGET);
  assert.equal(env.OPENAI_API_KEY, undefined);
  assert.equal(env.CODEX_API_KEY, undefined);
  assert.equal(env.ANTHROPIC_API_KEY, undefined);
  assert.equal(env.OPENAI_API_BASE_URL, undefined);
  assert.equal(env.PATH, 'native');
});

test('result schema is valid JSON and matches the enforced terminal statuses', () => {
  const schema = JSON.parse(readFileSync(new URL('./sol-handoff-result.schema.json', import.meta.url), 'utf8'));
  assert.deepEqual(schema.properties.status.enum, ['completed', 'needs_expert', 'blocked']);
  assert.deepEqual(schema.required, ['status', 'summary', 'evidence', 'openQuestions']);
  assert.equal(validateHandoffResult(validResult()).status, 'completed');
});
