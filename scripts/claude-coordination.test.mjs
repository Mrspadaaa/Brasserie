import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, linkSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { hostname, tmpdir } from 'node:os';
import {
  activateParallelClaude, admitClaudeLease, coordinationStatus, deactivateParallelClaude, main as coordinationMain,
  previewClaudeAdmission, probeProcess, recoverClaudeLease, recoverCoordinationMutex, releaseClaudeLease,
  releaseRetainedClaudeLease, validLeaseRecord,
} from './claude-coordination.mjs';
import { assertFreshClaudeOutput } from './claude-artifacts.mjs';

const MODULE_URL = new URL('./claude-coordination.mjs', import.meta.url).href;
const SOL = '01a0de88-b523-7ff2-9b56-5db26cfd0f55';
// Real child processes use the real module; no Claude, API or model is involved.
const CHILD_SCRIPT = `
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
const config = JSON.parse(process.env.LAFFINEE_COORDINATION_CHILD);
const coordination = await import(config.module);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const waitFor = async path => { while (!existsSync(path)) await sleep(5); };
if (config.readyPath) writeFileSync(config.readyPath, String(process.pid));
if (config.startGate) await waitFor(config.startGate);
if (config.attemptPath) writeFileSync(config.attemptPath, String(Date.now()));
const coordinationOptions = config.nowMarker ? {
  ...config.options,
  now: () => {
    const now = Date.now();
    writeFileSync(config.nowMarker, String(now));
    return now;
  },
} : config.options;
let lease;
let result;
try {
  lease = coordination.admitClaudeLease(config.request, coordinationOptions);
  result = { admitted: true, leaseId: lease.leaseId, pid: process.pid };
} catch (error) {
  result = { admitted: false, reason: error.coordination?.reason ?? null, message: String(error.message), pid: process.pid };
}
for (const file of (lease && config.createFiles) || []) {
  mkdirSync(dirname(file.path), { recursive: true });
  writeFileSync(file.path, file.text);
}
if (config.resultPath) writeFileSync(config.resultPath, JSON.stringify(result));
else process.stdout.write(JSON.stringify(result));
if (lease && config.crash) process.exit(17);
if (lease && config.releaseGate) await waitFor(config.releaseGate);
if (lease) lease.release({ outcome: 'completed' });
`;

const sleep = ms => new Promise(resolveSleep => setTimeout(resolveSleep, ms));
const inMs = ms => new Date(Date.now() + ms).toISOString();
const reason = expected => error => error?.coordination?.reason === expected;

function fixture(t) {
  const base = mkdtempSync(join(tmpdir(), 'laffinee-claude-coordination-test-'));
  const fx = {
    base, repo: join(base, 'repo'), children: [],
    coordination: { root: join(base, 'coordination'), legacyLock: join(base, 'legacy.lock') },
  };
  mkdirSync(fx.repo, { recursive: true });
  t.after(() => {
    for (const child of fx.children) if (child.exitCode === null && child.signalCode === null) child.kill();
    assert.equal(dirname(resolve(base)), resolve(tmpdir()));
    rmSync(base, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  });
  return fx;
}

function sourceFile(fx, path, text = 'export {};\n', root = fx.repo) {
  const absolute = join(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, text);
  return absolute;
}

function batch(fx, { name = randomUUID(), ...overrides } = {}) {
  return {
    kind: 'batch', account: 'team', model: 'claude-opus-5-5', effort: 'xhigh',
    claudeSessionId: randomUUID(), sessionMode: 'new', solThread: SOL,
    output: join(fx.base, 'out', `${name}.json`),
    sources: [{ source: sourceFile(fx, `src/${name}.ts`), readOnly: false }],
    ...overrides,
  };
}

function activate(fx, extra = {}) {
  return activateParallelClaude({ ...fx.coordination, until: inMs(3600e3),
    authorizedBy: 'Contrôleur — fixture locale', evidence: 'scripts/claude-coordination.test.mjs', ...extra });
}

const active = fx => coordinationStatus(fx.coordination).active;

function childEnv(config) {
  return { ...process.env, LAFFINEE_COORDINATION_CHILD: JSON.stringify({ module: MODULE_URL, ...config }) };
}

// One-shot admission in another process; an admitted lease is released at once.
function tryInChild(fx, request) {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', CHILD_SCRIPT], {
    env: childEnv({ request, options: fx.coordination }), encoding: 'utf8', windowsHide: true, timeout: 60000,
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

// Admission held by another process until its gate, or until it crashes.
function holdInChild(fx, request, { name = randomUUID(), ...config } = {}) {
  const resultPath = join(fx.base, `child-${name}.json`);
  const readyPath = join(fx.base, `child-${name}.ready`);
  const child = spawn(process.execPath, ['--input-type=module', '-e', CHILD_SCRIPT], {
    env: childEnv({ request, options: fx.coordination, resultPath, readyPath, ...config }),
    stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  });
  fx.children.push(child);
  let stderr = '';
  child.stdout.resume();
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', chunk => { stderr += chunk; });
  let closed = false;
  const exited = new Promise(resolveExit => child.once('close', code => { closed = true; resolveExit({ code, stderr }); }));
  const result = (async () => {
    for (;;) {
      try { return JSON.parse(readFileSync(resultPath, 'utf8')); } catch { /* Not written yet. */ }
      if (closed) {
        try { return JSON.parse(readFileSync(resultPath, 'utf8')); }
        catch { assert.fail(`Processus enfant terminé sans résultat : ${stderr}`); }
      }
      await sleep(10);
    }
  })();
  return { child, readyPath, result, exited };
}

async function waitForFile(path) {
  while (!existsSync(path)) await sleep(5);
}

test('new lots are Team-only while explicit Pro login and historical Pro records remain valid', t => {
  const fx = fixture(t);
  const proBatch = batch(fx, { name: 'new-pro', account: 'pro' });
  assert.throws(() => admitClaudeLease(proBatch, fx.coordination), reason('team_only'));
  assert.equal(previewClaudeAdmission(proBatch, fx.coordination).reason, 'team_only');
  assert.throws(() => admitClaudeLease({
    kind: 'interactive', account: 'pro', model: 'claude-opus-5-5', effort: 'xhigh',
  }, fx.coordination), reason('team_only'));
  assert.equal(active(fx).length, 0);
  assert.equal(existsSync(fx.coordination.legacyLock), false);

  const login = admitClaudeLease({ kind: 'login', account: 'pro' }, fx.coordination);
  assert.equal(login.record.account, 'pro');
  login.release({ outcome: 'completed' });

  const historical = {
    schema: 'laffinee.claude-lease.v1', leaseId: randomUUID(), tokenDigest: 'f'.repeat(64),
    kind: 'batch', state: 'retained', scope: 'declared', countsTowardCapacity: false,
    account: 'pro', model: 'claude-opus-5-5', effort: 'xhigh', claudeSessionId: randomUUID(),
    sessionMode: 'resume', solThread: SOL, output: join(fx.base, 'historical-pro.json'), resources: [],
    owner: { pid: process.pid, startedAtMs: Math.round(Date.now() - process.uptime() * 1000), hostname: hostname() },
    child: null, coordinationRoot: fx.coordination.root, admittedAt: inMs(-10000), updatedAt: inMs(-5000),
    retainedAt: inMs(-4000), retainedReason: 'historical draft', recoveryManifestPath: null, archiveRoot: null,
  };
  assert.equal(validLeaseRecord(historical), true);
  const historicalPath = join(fx.coordination.root, 'active', historical.leaseId + '.json');
  mkdirSync(dirname(historicalPath), { recursive: true });
  const serialized = JSON.stringify(historical, null, 2) + '\n';
  writeFileSync(historicalPath, serialized);
  assert.throws(() => admitClaudeLease(batch(fx, { name: 'another-pro', account: 'pro' }), fx.coordination), reason('team_only'));
  assert.equal(readFileSync(historicalPath, 'utf8'), serialized);
  assert.equal(active(fx).find(lease => lease.leaseId === historical.leaseId)?.account, 'pro');
});

test('default capacity is one across real processes; activation admits exactly two Team Opus xhigh lots', { timeout: 120000 }, async t => {
  const fx = fixture(t);
  const releaseGate = join(fx.base, 'release-a');
  const holder = holdInChild(fx, batch(fx, { name: 'a' }), { releaseGate, name: 'a' });
  assert.equal((await holder.result).admitted, true);

  const refused = tryInChild(fx, batch(fx, { name: 'b' }));
  assert.deepEqual([refused.admitted, refused.reason], [false, 'capacity']);
  assert.match(refused.message, /Capacité Claude atteinte/);

  activate(fx);
  const second = admitClaudeLease(batch(fx, { name: 'b2' }), fx.coordination);
  const third = tryInChild(fx, batch(fx, { name: 'c' }));
  assert.deepEqual([third.admitted, third.reason], [false, 'capacity']);
  assert.equal(active(fx).length, 2);
  assert.equal(second.release({ outcome: 'completed' }).status, 'released');
  assert.equal(tryInChild(fx, batch(fx, { name: 'd' })).admitted, true);

  writeFileSync(releaseGate, 'go');
  assert.equal((await holder.exited).code, 0);
  assert.equal(active(fx).length, 0);
  assert.equal(existsSync(fx.coordination.legacyLock), false);
});

test('simultaneous real admissions never exceed the activated capacity of two', { timeout: 120000 }, async t => {
  const fx = fixture(t);
  activate(fx);
  const startGate = join(fx.base, 'start');
  const releaseGate = join(fx.base, 'release');
  const contenders = Array.from({ length: 6 }, (_, index) =>
    holdInChild(fx, batch(fx, { name: `race-${index}` }), { startGate, releaseGate, name: `race-${index}` }));
  await Promise.all(contenders.map(contender => waitForFile(contender.readyPath)));
  writeFileSync(startGate, 'go');
  const results = await Promise.all(contenders.map(contender => contender.result));
  assert.equal(results.filter(result => result.admitted).length, 2, JSON.stringify(results));
  assert.ok(results.filter(result => !result.admitted).every(result => result.reason === 'capacity'), JSON.stringify(results));
  assert.equal(active(fx).length, 2);
  writeFileSync(releaseGate, 'go');
  await Promise.all(contenders.map(contender => contender.exited));
  assert.equal(active(fx).length, 0);
  assert.equal(existsSync(fx.coordination.legacyLock), false);
});

test('activation is explicit, bounded, expiring and limited to Team, claude-opus-5-5 and xhigh', t => {
  const fx = fixture(t);
  assert.throws(() => activate(fx, { until: inMs(-1000) }), reason('invalid_request'));
  assert.throws(() => activate(fx, { until: inMs(73 * 3600e3) }), /72 h/);
  assert.throws(() => activate(fx, { until: 'demain' }), reason('invalid_request'));
  assert.throws(() => activate(fx, { authorizedBy: ' ' }), /authorized-by/);
  assert.throws(() => activate(fx, { evidence: undefined }), /evidence/);
  assert.equal(coordinationStatus(fx.coordination).activation.status, 'absent');

  activate(fx);
  const team = admitClaudeLease(batch(fx, { name: 'team' }), fx.coordination);
  assert.throws(() => admitClaudeLease(batch(fx, { name: 'pro', account: 'pro' }), fx.coordination), reason('team_only'));
  for (const [name, patch] of [['sonnet', { model: 'claude-sonnet-5-5' }], ['high', { effort: 'high' }]]) {
    assert.throws(() => admitClaudeLease(batch(fx, { name, ...patch }), fx.coordination), reason('capacity'), name);
  }
  team.release();

  const held = admitClaudeLease(batch(fx, { name: 'held' }), fx.coordination);
  assert.throws(() => admitClaudeLease(batch(fx, { name: 'after-expiry' }), { ...fx.coordination, now: () => Date.now() + 2 * 3600e3 }),
    reason('capacity'));
  const activationPath = join(fx.coordination.root, 'activation.json');
  const valid = JSON.parse(readFileSync(activationPath, 'utf8'));
  writeFileSync(activationPath, JSON.stringify({ ...valid, capacity: 3 }));
  assert.equal(coordinationStatus(fx.coordination).activation.status, 'invalid');
  assert.throws(() => admitClaudeLease(batch(fx, { name: 'widened' }), fx.coordination), reason('capacity'));
  writeFileSync(activationPath, JSON.stringify({ ...valid, scope: { ...valid.scope, account: 'pro' } }));
  assert.throws(() => admitClaudeLease(batch(fx, { name: 'rescoped' }), fx.coordination), reason('capacity'));
  writeFileSync(activationPath, JSON.stringify(valid));
  admitClaudeLease(batch(fx, { name: 'restored' }), fx.coordination).release();
  held.release();

  assert.equal(deactivateParallelClaude(fx.coordination).status, 'deactivated');
  assert.equal(coordinationStatus(fx.coordination).activation.status, 'absent');
  assert.ok(readdirSync(join(fx.coordination.root, 'history')).some(name => name.startsWith('activation-')));
});

test('conversation, output and reported originals collide before launch, including aliases; references and Sol do not', { timeout: 120000 }, async t => {
  const fx = fixture(t);
  activate(fx);
  const edited = sourceFile(fx, 'src/shared.ts');
  const reference = sourceFile(fx, 'docs/reference.md');
  const sessionId = randomUUID();
  const output = join(fx.base, 'out', 'held.json');
  const releaseGate = join(fx.base, 'release-held');
  const holder = holdInChild(fx, batch(fx, { claudeSessionId: sessionId, output,
    sources: [{ source: edited, readOnly: false }, { source: reference, readOnly: true }] }), { releaseGate, name: 'held' });
  assert.equal((await holder.result).admitted, true);

  const conflict = (label, request) => assert.throws(() => admitClaudeLease(request, fx.coordination), reason('conflict'), label);
  const accepted = (label, request) => assert.equal(admitClaudeLease(request, fx.coordination).release().status, 'released', label);

  conflict('same resume UUID', batch(fx, { name: 'resume', claudeSessionId: sessionId.toUpperCase(), sessionMode: 'resume' }));
  conflict('same output', batch(fx, { name: 'output', output }));
  conflict('output over a reported original', batch(fx, { name: 'output-original', output: edited }));
  conflict('same original', batch(fx, { name: 'original', sources: [{ source: edited, readOnly: false }] }));
  conflict('relative path', batch(fx, { name: 'relative', sources: [{ source: relative(process.cwd(), edited), readOnly: false }] }));
  const alias = join(fx.base, 'alias-src');
  symlinkSync(join(fx.repo, 'src'), alias, 'junction');
  conflict('directory junction', batch(fx, { name: 'junction', sources: [{ source: join(alias, 'shared.ts'), readOnly: false }] }));
  const hardLink = join(fx.repo, 'hard-shared.ts');
  linkSync(edited, hardLink);
  conflict('hard link', batch(fx, { name: 'hard-link', sources: [{ source: hardLink, readOnly: false }] }));
  if (process.platform === 'win32') {
    conflict('Windows case', batch(fx, { name: 'case', sources: [{ source: edited.toUpperCase(), readOnly: false }] }));
    conflict('Windows trailing dot', batch(fx, { name: 'dot', output: `${output}.` }));
  }
  conflict('report into a shared reference', batch(fx, { name: 'writer', sources: [{ source: reference, readOnly: false }] }));
  conflict('read an original being reported', batch(fx, { name: 'reader-of-edit',
    sources: [{ source: sourceFile(fx, 'src/other.ts'), readOnly: false }, { source: edited, readOnly: true }] }));

  accepted('shared readonly reference', batch(fx, { name: 'reader',
    sources: [{ source: sourceFile(fx, 'src/reader.ts'), readOnly: false }, { source: reference, readOnly: true }] }));
  accepted('same Sol, distinct UUID and resources', batch(fx, { name: 'same-sol', solThread: SOL }));
  const otherWorktree = join(fx.base, 'worktree-b');
  accepted('same logical file in another worktree', batch(fx, { name: 'other-worktree',
    sources: [{ source: sourceFile(fx, 'src/shared.ts', 'export {};\n', otherWorktree), readOnly: false }] }));

  assert.equal(active(fx).length, 1);
  writeFileSync(releaseGate, 'go');
  await holder.exited;
  assert.equal(active(fx).length, 0);
});

test('legacy locks, unreadable leases and a stale mutex are refused without being changed', t => {
  const fx = fixture(t);
  const { legacyLock } = fx.coordination;
  for (const content of ['4242', '', '  \n', 'not-a-lease', JSON.stringify({ schema: 'laffinee.claude-coordination-barrier.v1', root: 'elsewhere' })]) {
    writeFileSync(legacyLock, content);
    assert.throws(() => admitClaudeLease(batch(fx), fx.coordination), reason('legacy_lock'), JSON.stringify(content));
    assert.equal(readFileSync(legacyLock, 'utf8'), content);
    assert.equal(active(fx).length, 0);
    rmSync(legacyLock); // Fixture-owned file only.
  }

  const first = admitClaudeLease(batch(fx), fx.coordination);
  assert.ok(existsSync(legacyLock));
  // What a previous launcher does: it sees the lock and cannot create it.
  assert.throws(() => openSync(legacyLock, 'wx'), { code: 'EEXIST' });
  activate(fx);
  const second = admitClaudeLease(batch(fx), fx.coordination);
  first.release();
  assert.ok(existsSync(legacyLock));
  second.release();
  assert.equal(existsSync(legacyLock), false);

  const activeDirectory = join(fx.coordination.root, 'active');
  mkdirSync(activeDirectory, { recursive: true });
  const broken = join(activeDirectory, `${randomUUID()}.json`);
  for (const content of ['{', JSON.stringify({ schema: 'laffinee.claude-lease.v1', leaseId: 'nope' })]) {
    writeFileSync(broken, content);
    assert.throws(() => admitClaudeLease(batch(fx), fx.coordination), reason('invalid_lease'));
    assert.equal(readFileSync(broken, 'utf8'), content);
  }
  rmSync(broken);
  const stray = join(activeDirectory, 'notes.txt');
  writeFileSync(stray, 'unknown');
  assert.throws(() => admitClaudeLease(batch(fx), fx.coordination), reason('invalid_lease'));
  rmSync(stray);

  const mutex = join(fx.coordination.root, 'mutex.lock');
  const stale = JSON.stringify({ token: randomUUID(), owner: { pid: 999999, startedAtMs: Date.now(), hostname: hostname() } });
  writeFileSync(mutex, stale);
  assert.throws(() => admitClaudeLease(batch(fx), { ...fx.coordination, mutexTimeoutMs: 200 }), reason('busy'));
  assert.equal(readFileSync(mutex, 'utf8'), stale);
  for (const answer of ['alive', 'unknown']) {
    assert.throws(() => recoverCoordinationMutex({ ...fx.coordination, probe: () => answer }), reason('owner_alive'));
    assert.equal(readFileSync(mutex, 'utf8'), stale);
  }
  assert.equal(recoverCoordinationMutex({ ...fx.coordination, probe: () => 'absent' }).status, 'recovered');
  assert.equal(existsSync(mutex), false);
  assert.equal(readdirSync(join(fx.coordination.root, 'history')).filter(name => name.startsWith('mutex-')).length, 1);
  admitClaudeLease(batch(fx), fx.coordination).release();
});

test('release is owner-scoped; a crashed owner keeps its lease until proven gone, then only its originals stay reserved', { timeout: 120000 }, async t => {
  const fx = fixture(t);
  activate(fx);
  const crashedRequest = batch(fx, { name: 'crashed' });
  const crashed = holdInChild(fx, crashedRequest, { crash: true, name: 'crashed' });
  const crashedResult = await crashed.result;
  assert.equal(crashedResult.admitted, true);
  assert.equal((await crashed.exited).code, 17);
  assert.equal(active(fx).length, 1);

  const live = admitClaudeLease(batch(fx, { name: 'live' }), fx.coordination);
  assert.throws(() => admitClaudeLease(batch(fx, { name: 'third' }), fx.coordination), reason('capacity'));
  assert.throws(() => releaseClaudeLease(crashedResult.leaseId, randomUUID(), {}, fx.coordination), reason('not_owner'));
  for (const answer of ['alive', 'unknown']) {
    assert.throws(() => recoverClaudeLease(crashedResult.leaseId, { ...fx.coordination, probe: () => answer }), reason('owner_alive'));
  }
  assert.equal(active(fx).length, 2);

  const recovered = recoverClaudeLease(crashedResult.leaseId, fx.coordination); // Real PID probe: the child exited.
  assert.ok(['absent', 'reused'].includes(recovered.owner));
  assert.equal(recovered.status, 'retained');
  const retained = active(fx).find(lease => lease.leaseId === crashedResult.leaseId);
  assert.equal(retained.state, 'retained');
  assert.equal(retained.countsTowardCapacity, false);
  assert.ok(retained.resources.length > 0 && retained.resources.every(resource => resource.role === 'edit'));
  assert.throws(() => recoverClaudeLease(crashedResult.leaseId, { ...fx.coordination, probe: () => 'absent' }), reason('retained'));

  const afterRecovery = admitClaudeLease(batch(fx, { name: 'after-recovery' }), fx.coordination);
  assert.throws(() => admitClaudeLease(batch(fx, { name: 'same-file', sources: crashedRequest.sources }), fx.coordination), reason('conflict'));
  afterRecovery.release();
  admitClaudeLease(batch(fx, { name: 'resume', claudeSessionId: crashedRequest.claudeSessionId, sessionMode: 'resume' }), fx.coordination).release();
  assert.throws(() => releaseRetainedClaudeLease(crashedResult.leaseId, { ...fx.coordination, reason: '' }), reason('invalid_request'));
  assert.throws(() => releaseRetainedClaudeLease(live.leaseId, { ...fx.coordination, reason: 'Inspection faite.' }), reason('not_retained'));
  assert.equal(releaseRetainedClaudeLease(crashedResult.leaseId,
    { ...fx.coordination, reason: 'Copies et manifeste inspectés : rien à reporter.' }).status, 'released');
  admitClaudeLease(batch(fx, { name: 'same-file-later', sources: crashedRequest.sources }), fx.coordination).release();

  // A late or repeated release of a finished lease never removes its successor.
  const late = admitClaudeLease(batch(fx, { name: 'late' }), fx.coordination);
  recoverClaudeLease(late.leaseId, { ...fx.coordination, probe: () => 'absent' });
  releaseRetainedClaudeLease(late.leaseId, { ...fx.coordination, reason: 'Simulation de récupération prouvée.' });
  const successor = admitClaudeLease(batch(fx, { name: 'successor' }), fx.coordination);
  assert.equal(late.release().status, 'already_finished');
  assert.equal(late.release().status, 'already_finished');
  assert.ok(active(fx).some(lease => lease.leaseId === successor.leaseId));
  successor.release();

  // Interrupted launch without a recorded PID, and a live Claude child.
  const spawning = admitClaudeLease(batch(fx, { name: 'spawning' }), fx.coordination);
  spawning.markSpawning();
  assert.throws(() => recoverClaudeLease(spawning.leaseId, { ...fx.coordination, probe: () => 'absent' }), reason('child_unknown'));
  assert.equal(recoverClaudeLease(spawning.leaseId, { ...fx.coordination, probe: () => 'absent', confirmNoChild: true }).status, 'retained');
  live.release();
  const running = admitClaudeLease(batch(fx, { name: 'running' }), fx.coordination);
  running.markRunning(4242);
  const childAlive = identity => identity.pid === 4242 ? 'alive' : 'absent';
  assert.throws(() => recoverClaudeLease(running.leaseId, { ...fx.coordination, probe: childAlive }), reason('child_alive'));
  assert.equal(recoverClaudeLease(running.leaseId, { ...fx.coordination, probe: () => 'reused' }).status, 'retained');
  assert.ok(existsSync(fx.coordination.legacyLock));
});

test('an interrupted lot keeps its partial output and reservation until a proven-gone recovery', { timeout: 120000 }, async t => {
  const fx = fixture(t);
  const output = join(fx.base, 'out', 'partial.json');
  const partialInput = `${output}.artifacts/inputs/src/partial.ts`;
  const crashed = holdInChild(fx, batch(fx, { name: 'partial', output }),
    { crash: true, name: 'partial', createFiles: [{ path: partialInput, text: 'copie partielle' }] });
  const result = await crashed.result;
  await crashed.exited;
  assert.equal(readFileSync(partialInput, 'utf8'), 'copie partielle');
  assert.throws(() => admitClaudeLease(batch(fx, { name: 'reuse', output }), fx.coordination), reason('conflict'));
  assert.equal(recoverClaudeLease(result.leaseId, fx.coordination).status, 'retained');
  assert.equal(readFileSync(partialInput, 'utf8'), 'copie partielle');
  assert.throws(() => assertFreshClaudeOutput(output), /déjà utilisée/);
});

test('process probe separates a live owner, a reused PID and an unresolved start time', async () => {
  const self = { pid: process.pid, startedAtMs: Math.round(Date.now() - process.uptime() * 1000), hostname: hostname() };
  assert.equal(probeProcess(self, { query: () => self.startedAtMs + 100 }), 'alive');
  assert.equal(probeProcess(self, { query: () => self.startedAtMs + 60000 }), 'reused');
  assert.equal(probeProcess(self, { query: () => undefined }), 'unknown');
  assert.equal(probeProcess(self, { query: () => self.startedAtMs - 60000 }), 'unknown');
  assert.equal(probeProcess({ ...self, hostname: `${hostname()}-other` }), 'unknown');
  assert.equal(probeProcess({ ...self, pid: 0 }), 'unknown');
  const child = spawn(process.execPath, ['-e', ''], { stdio: 'ignore', windowsHide: true });
  const pid = child.pid;
  await new Promise(resolveExit => child.once('close', resolveExit));
  assert.equal(probeProcess({ pid, startedAtMs: Date.now(), hostname: hostname() }, { query: () => assert.fail('PID absent attendu') }), 'absent');
});

test('dry-run preview reserves nothing and controller CLI validates its options', t => {
  const fx = fixture(t);
  const held = admitClaudeLease(batch(fx, { name: 'held' }), fx.coordination);
  const preview = previewClaudeAdmission(batch(fx, { name: 'preview' }), fx.coordination);
  assert.equal(preview.snapshot, true);
  assert.equal(preview.admissible, false);
  assert.equal(preview.reason, 'capacity');
  assert.ok(preview.resources.some(resource => resource.role === 'session'));
  assert.equal(active(fx).length, 1);
  assert.equal(previewClaudeAdmission({ kind: 'batch', account: 'team' }, fx.coordination).reason, 'invalid_request');
  held.release();

  const status = coordinationMain(['status'], { ...fx.coordination, probe: () => 'unknown' });
  assert.equal(status.activation.status, 'absent');
  assert.equal(status.mutex.present, false);
  assert.throws(() => coordinationMain(['activate', '--until', inMs(3600e3)], fx.coordination), /requis/);
  assert.throws(() => coordinationMain(['activate', '--lease', randomUUID()], fx.coordination), /inconnue/);
  assert.throws(() => coordinationMain(['unknown'], fx.coordination), /Commande/);
  const activated = coordinationMain(['activate', '--until', inMs(3600e3), '--authorized-by', 'Décision humaine fixture',
    '--evidence', 'rapport-qualification.md'], fx.coordination);
  assert.equal(activated.capacity, 2);
  assert.deepEqual(activated.scope, { account: 'team', model: 'claude-opus-5-5', effort: 'xhigh' });
  assert.equal(coordinationMain(['deactivate'], fx.coordination).status, 'deactivated');
});

test('lease records with valid JSON but inconsistent capacity or resources fail closed', t => {
  const fx = fixture(t);
  activate(fx);
  const first = admitClaudeLease(batch(fx, { name: 'semantic-first' }), fx.coordination);
  admitClaudeLease(batch(fx, { name: 'semantic-second' }), fx.coordination).release();
  const activeDirectory = join(fx.coordination.root, 'active');
  const path = join(activeDirectory, `${first.leaseId}.json`);
  const original = readFileSync(path, 'utf8');
  const changes = [
    ['batch cannot opt out of capacity', record => { record.countsTowardCapacity = false; }],
    ['batch needs its session reservation', record => { record.resources = record.resources.filter(resource => resource.role !== 'session'); }],
    ['batch needs every output reservation', record => { record.resources = record.resources.filter(resource => resource.role !== 'output'); }],
    ['session reservation stays exclusive', record => { record.resources.find(resource => resource.role === 'session').mode = 'shared'; }],
    ['source path stays canonical', record => { record.resources.find(resource => resource.role === 'edit' && resource.key.startsWith('file:')).key = 'file:relative/source.ts'; }],
  ];
  for (const [name, change] of changes) {
    const record = JSON.parse(original);
    change(record);
    const corrupted = JSON.stringify(record, null, 2) + '\n';
    writeFileSync(path, corrupted);
    const before = readdirSync(activeDirectory).sort();
    assert.equal(validLeaseRecord(record), false, name);
    assert.throws(() => admitClaudeLease(batch(fx, { name: `after-${name}` }), fx.coordination), reason('invalid_lease'), name);
    assert.deepEqual(readdirSync(activeDirectory).sort(), before, name);
    assert.equal(readFileSync(path, 'utf8'), corrupted, name);
  }
  writeFileSync(path, original);
  first.release();
});

test('interactive TUI scope remains exclusive and cannot be weakened in persisted state', t => {
  const fx = fixture(t);
  activate(fx);
  const tui = admitClaudeLease({ kind: 'interactive', account: 'team', model: 'claude-opus-5-5', effort: 'xhigh' }, fx.coordination);
  assert.throws(() => admitClaudeLease(batch(fx, { name: 'beside-tui' }), fx.coordination), reason('conflict'));

  const path = join(fx.coordination.root, 'active', `${tui.leaseId}.json`);
  const original = readFileSync(path, 'utf8');
  const record = JSON.parse(original);
  record.scope = 'declared';
  const corrupted = JSON.stringify(record, null, 2) + '\n';
  writeFileSync(path, corrupted);
  assert.equal(validLeaseRecord(record), false);
  assert.throws(() => admitClaudeLease(batch(fx, { name: 'beside-invalid-tui' }), fx.coordination), reason('invalid_lease'));
  writeFileSync(path, original);
  tui.release();
});

test('activation expiry is checked after a waiting admission acquires the mutex', { timeout: 120000 }, async t => {
  const fx = fixture(t);
  const expiresAt = Date.now() + 4000;
  activate(fx, { until: new Date(expiresAt).toISOString() });
  const first = admitClaudeLease(batch(fx, { name: 'before-expiry' }), fx.coordination);

  const mutexPath = join(fx.coordination.root, 'mutex.lock');
  writeFileSync(mutexPath, 'fixture-held mutex');
  const startGate = join(fx.base, 'start-expiring-admission');
  const attemptPath = join(fx.base, 'expiring-attempt.json');
  const nowMarker = join(fx.base, 'expiring-clock.json');
  const waiting = holdInChild(fx, batch(fx, { name: 'after-expiry' }), {
    startGate, attemptPath, nowMarker, name: 'after-expiry',
  });
  await waitForFile(waiting.readyPath);
  writeFileSync(startGate, 'go');
  await waitForFile(attemptPath);
  const attemptAt = Number(readFileSync(attemptPath, 'utf8'));
  assert.ok(attemptAt < expiresAt, 'second admission reaches the mutex before activation expires');
  await sleep(Math.max(0, expiresAt - Date.now() + 100));
  rmSync(mutexPath);

  const result = await waiting.result;
  await waiting.exited;
  const decisionAt = Number(readFileSync(nowMarker, 'utf8'));
  assert.ok(decisionAt >= expiresAt, 'admission samples time after acquiring the released mutex');
  assert.deepEqual([result.admitted, result.reason], [false, 'capacity']);
  assert.equal(active(fx).length, 1);
  first.release();
});
