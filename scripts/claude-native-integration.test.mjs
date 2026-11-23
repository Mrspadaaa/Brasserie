import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, rmdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import * as bridge from './claude-frontend.mjs';
import { activateParallelClaude, admitClaudeLease, coordinationStatus, releaseRetainedClaudeLease } from './claude-coordination.mjs';

const permissionWorkspace = process.platform === 'win32' ? 'C:\\claude\\permissions\\workspace' : '/claude/permissions/workspace';
const editRule = file => {
  const absolute = resolve(permissionWorkspace, file).replaceAll('\\', '/');
  return `Edit(${process.platform === 'win32' ? `//${absolute[0].toLowerCase()}${absolute.slice(2)}` : `//${absolute.replace(/^\/+/, '')}`})`;
};

test('Sonnet helper is opt-in, model-pinned in child only and cannot nest', () => {
  const original = {
    PATH: 'fixture',
    CLAUDE_CODE_SUBAGENT_MODEL: 'haiku',
    CLAUDE_CODE_SUBAGENT_MODEL_FORCE: '0',
    CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH: '3',
    CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS: '1',
  };
  const options = bridge.parseLauncherOptions(['--brief', 'b', '--output', 'o', '--with-sonnet']);
  assert.equal(options.sonnet, true);
  assert.equal(bridge.parseLauncherOptions(['--brief', 'b', '--output', 'o']).sonnet, false);
  const child = bridge.subscriptionEnvironment(original, options);
  assert.equal(child.CLAUDE_CODE_SUBAGENT_MODEL, 'claude-sonnet-5-5');
  assert.equal(child.CLAUDE_CODE_SUBAGENT_MODEL_FORCE, '1');
  assert.equal(child.CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH, '1');
  assert.equal(child.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS, '1');
  assert.equal(child.CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS, undefined);
  assert.equal(child.CLAUDE_CODE_EFFORT_LEVEL, 'xhigh');
  assert.equal(original.CLAUDE_CODE_SUBAGENT_MODEL, 'haiku');
  assert.equal(original.CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH, '3');
  assert.equal(bridge.subscriptionEnvironment(original).CLAUDE_CODE_SUBAGENT_MODEL, 'haiku');
});

test('native Sonnet keeps Opus as pilot without widening file or shell permissions', () => {
  for (const mode of ['review', 'edit']) {
    const args = bridge.claudeArguments({ workspace: permissionWorkspace, mode, files: ['src/ui.tsx'], sonnet: true });
    assert.equal(args[args.indexOf('--model') + 1], 'claude-opus-5-5');
    assert.equal(args[args.indexOf('--effort') + 1], 'xhigh');
    assert(args.includes('--safe-mode'));
    assert(args.includes('--restricted'));
    assert(!args.includes('--bare'));
    // Safe mode disables custom definitions, so use the built-in helper.
    assert(!args.includes('--agents'));
    const tools = args[args.indexOf('--tools') + 1].split(',');
    assert.deepEqual(tools, mode === 'review' ? ['Read', 'Agent'] : ['Read', 'Edit', 'Write', 'Agent']);
    const permissions = args.slice(args.indexOf('--allowedTools') + 1);
    assert.deepEqual(permissions, mode === 'review'
      ? ['Read', 'Agent(general-purpose)']
      : ['Read', editRule('src/ui.tsx'), 'Agent(general-purpose)']);
    assert.equal(args[args.indexOf('--permission-mode') + 1], 'dontAsk');
    assert.equal(args[args.indexOf('--mcp-config') + 1], '{"mcpServers":{}}');
    assert.equal(args[args.indexOf('--disallowedTools') + 1], 'mcp__*');
  }
  const normal = bridge.claudeArguments({ workspace: permissionWorkspace, mode: 'edit', files: ['src/ui.tsx'] });
  assert(!normal[normal.indexOf('--tools') + 1].includes('Agent'));
  const withLuna = bridge.claudeArguments({
    workspace: permissionWorkspace, mode: 'edit', files: ['src/ui.tsx'], sonnet: true, luna: true, relayCommand: 'one-exact-relay',
  });
  const permissions = withLuna.slice(withLuna.indexOf('--allowedTools') + 1);
  assert(permissions.includes('Bash(one-exact-relay)'));
  assert(!permissions.includes('Bash'));
  assert(!permissions.includes('Edit'));
  assert(!permissions.includes('Write'));
});

test('native subscription status exposes only public account identity and accepts Team', () => {
  const result = bridge.subscriptionStatus({
    loggedIn: true, authMethod: 'claude.ai', apiProvider: 'firstParty',
    subscriptionType: 'team', email: 'member@example.test',
    orgId: 'org-test', orgName: 'Example Team',
    accessToken: 'PRIVATE_NOT_TO_EXPORT', unrelated: { secret: 'PRIVATE_NOT_TO_EXPORT' },
  });
  assert.deepEqual(result, {
    loggedIn: true, authMethod: 'claude.ai', subscriptionType: 'team',
    account: { email: 'member@example.test', organizationId: 'org-test', organizationName: 'Example Team' },
  });
  assert(!JSON.stringify(result).includes('PRIVATE_NOT_TO_EXPORT'));
  for (const subscriptionType of ['pro', 'max', 'enterprise']) {
    assert.equal(bridge.subscriptionStatus({
      loggedIn: true, authMethod: 'claude.ai', apiProvider: 'firstParty', subscriptionType,
    }).subscriptionType, subscriptionType);
  }
  assert.throws(() => bridge.subscriptionStatus({
    loggedIn: true, authMethod: 'api_key', apiProvider: 'firstParty', subscriptionType: 'team',
  }), /native/);
  assert.throws(() => bridge.subscriptionStatus({
    loggedIn: true, authMethod: 'claude.ai', apiProvider: 'firstParty',
    apiKeySource: 'test-env', subscriptionType: 'team',
  }), /API refusée/);
  assert.throws(() => bridge.subscriptionStatus({
    loggedIn: true, authMethod: 'claude.ai', apiProvider: 'firstParty', subscriptionType: 'unknown',
  }), /abonnement/);
});

test('large edit batches get a finite default while explicit turn limits remain exact', () => {
  assert.equal(bridge.parseLauncherOptions(['--brief', 'b', '--output', 'o']).maxTurns, 30);
  assert.equal(bridge.parseLauncherOptions(['--mode', 'edit', '--brief', 'b', '--output', 'o']).maxTurns, 60);
  assert.equal(bridge.parseLauncherOptions(['--mode', 'edit', '--brief', 'b', '--output', 'o', '--max-turns', '24']).maxTurns, 24);
  const editArgs = bridge.claudeArguments({ workspace: permissionWorkspace, mode: 'edit', files: ['src/ui.tsx'] });
  assert.equal(editArgs[editArgs.indexOf('--max-turns') + 1], '60');
  const resumed = bridge.claudeArguments({
    workspace: permissionWorkspace, mode: 'edit', files: ['src/ui.tsx'], maxTurns: 12,
    resume: 'fc195af8-a52f-4852-a9b9-5ffe427c8c96',
  });
  assert.equal(resumed[resumed.indexOf('--max-turns') + 1], '12');
  assert.equal(resumed[resumed.indexOf('--resume') + 1], 'fc195af8-a52f-4852-a9b9-5ffe427c8c96');
});

test('official desktop cache locator finds hashed native executables before older flat versions', () => {
  const local = mkdtempSync(join(tmpdir(), 'laffinee-claude-cache-probe-'));
  const root = join(local, 'Packages', 'Claude_test', 'LocalCache', 'Roaming', 'Claude', 'claude-code');
  const older = join(root, '2.1.99', 'claude.exe');
  const newer = join(root, '2.1.286', '635c1867224a', 'claude.exe');
  try {
    mkdirSync(dirname(older), { recursive: true });
    mkdirSync(dirname(newer), { recursive: true });
    writeFileSync(older, 'inert older fixture, never executed');
    writeFileSync(newer, 'inert current fixture, never executed');
    assert.equal(bridge.findCachedClaude(local), newer);
    unlinkSync(newer);
    assert.equal(bridge.findCachedClaude(local), older);
    unlinkSync(older);
    assert.equal(bridge.findCachedClaude(local), undefined);
  } finally {
    for (const file of [newer, older]) if (existsSync(file)) unlinkSync(file);
    for (const folder of [
      dirname(newer), dirname(dirname(newer)), dirname(older), root,
      dirname(root), dirname(dirname(root)), dirname(dirname(dirname(root))),
      join(local, 'Packages', 'Claude_test'), join(local, 'Packages'), local,
    ]) if (existsSync(folder)) rmdirSync(folder);
  }
});

test('a transient progress write failure does not suppress the terminal max-turn result', () => {
  const directory = mkdtempSync(join(tmpdir(), 'laffinee-claude-progress-recovery-'));
  const path = join(directory, 'progress.json');
  let tracker;
  try {
    tracker = bridge.createClaudeProgressTracker(path, { deliveryRequested: true });
    tracker.stopHeartbeat();
    unlinkSync(path);
    mkdirSync(path); // A real filesystem write refusal, without changing permissions.
    tracker.record('outil', 'outil_démarré', { tool: 'Edit' });
    rmdirSync(path); // The transient obstacle is gone before the terminal event.
    tracker.record('erreur', 'erreur', {
      outcome: 'turn_budget_reached', modelOutcome: 'turn_budget_reached',
      resultStatus: 'completed', deliveryStatus: 'not_attempted',
    });
    const terminal = JSON.parse(readFileSync(path, 'utf8'));
    assert.equal(terminal.status, 'erreur');
    assert.equal(terminal.modelOutcome, 'turn_budget_reached');
    assert.equal(terminal.resultStatus, 'completed');
    assert.equal(terminal.deliveryStatus, 'not_attempted');
  } finally {
    tracker?.stopHeartbeat();
    if (existsSync(path)) {
      try { unlinkSync(path); } catch { rmdirSync(path); }
    }
    rmdirSync(directory);
  }
});

// End-to-end launcher with a fake native process: no Claude, API or model call.
const COORDINATION_URL = new URL('./claude-coordination.mjs', import.meta.url).href;
const COMPETITOR = `
import { existsSync, writeFileSync } from 'node:fs';
const config = JSON.parse(process.env.LAFFINEE_COORDINATION_CHILD);
const coordination = await import(config.module);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let lease;
let result;
try {
  lease = coordination.admitClaudeLease(config.request, config.options);
  result = { admitted: true, leaseId: lease.leaseId };
} catch (error) {
  result = { admitted: false, reason: error.coordination?.reason ?? null };
}
if (config.resultPath) writeFileSync(config.resultPath, JSON.stringify(result));
else process.stdout.write(JSON.stringify(result));
if (lease && config.releaseGate) while (!existsSync(config.releaseGate)) await sleep(5);
if (lease) lease.release({ outcome: 'completed' });
`;
const pause = ms => new Promise(resolvePause => setTimeout(resolvePause, ms));

function fakeClaudeScript(args, gate, { edit, subtype = 'success', observedSessionId } = {}) {
  return `
const fs = require('node:fs');
const args = ${JSON.stringify(args)};
const at = flag => args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined;
const sid = at('--session-id') || at('--resume');
const observedSid = ${JSON.stringify(observedSessionId || null)} || sid;
process.stdin.on('data', () => {});
process.stdout.write(JSON.stringify({ type: 'system', subtype: 'init', session_id: observedSid }) + '\\n');
const finish = () => {
  ${edit ? `fs.writeFileSync(${JSON.stringify(edit)}, 'export const edited = true;\\n');` : ''}
  process.stdout.write(JSON.stringify({ type: 'result', subtype: ${JSON.stringify(subtype)}, is_error: ${subtype !== 'success'},
    result: 'fixture', num_turns: 1, session_id: observedSid }) + '\\n');
  process.exitCode = ${subtype === 'success' ? 0 : 1};
};
const wait = () => (fs.existsSync(${JSON.stringify(gate)}) ? finish() : setTimeout(wait, 10));
wait();
`;
}

function launcherFixture(t, fakeOptions = {}) {
  const base = mkdtempSync(join(tmpdir(), 'laffinee-claude-launcher-lease-'));
  const children = [];
  const delegate = process.env.LAFFINEE_CLAUDE_DELEGATE;
  delete process.env.LAFFINEE_CLAUDE_DELEGATE; // Tests may run under a delegated shell.
  t.after(() => {
    if (delegate !== undefined) process.env.LAFFINEE_CLAUDE_DELEGATE = delegate;
    for (const child of children) if (child.exitCode === null && child.signalCode === null) child.kill();
    assert.equal(dirname(resolve(base)), resolve(tmpdir()));
    rmSync(base, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  });
  const repo = join(base, 'repo');
  mkdirSync(join(repo, 'src'), { recursive: true });
  writeFileSync(join(repo, 'src', 'a.ts'), 'export const original = true;\n');
  writeFileSync(join(base, 'brief.md'), 'Modifier src/a.ts.');
  const coordination = { root: join(base, 'coordination'), legacyLock: join(base, 'legacy.lock') };
  const gate = join(base, 'gate');
  const launches = [];
  const deps = {
    findClaude: () => 'claude-native-fixture',
    cliStatus: () => ({ version: '2.1.300', subscriptionType: 'team', accountProfile: 'team', model: 'claude-opus-5-5', effort: 'xhigh' }),
    spawn: (exe, args, options) => {
      launches.push(args);
      const child = spawn(process.execPath, ['-e', fakeClaudeScript(args, gate, fakeOptions)], options);
      children.push(child);
      return child;
    },
    coordination,
  };
  const competitorEnv = config => ({ ...process.env,
    LAFFINEE_COORDINATION_CHILD: JSON.stringify({ module: COORDINATION_URL, options: coordination, ...config }) });
  const tryInChild = request => {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', COMPETITOR],
      { env: competitorEnv({ request }), encoding: 'utf8', windowsHide: true, timeout: 60000 });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  };
  const holdInChild = async request => {
    const resultPath = join(base, `held-${randomUUID()}.json`);
    const releaseGate = `${resultPath}.release`;
    const child = spawn(process.execPath, ['--input-type=module', '-e', COMPETITOR],
      { env: competitorEnv({ request, resultPath, releaseGate }), stdio: 'ignore', windowsHide: true });
    children.push(child);
    const exited = new Promise(resolveExit => child.once('close', resolveExit));
    for (;;) {
      try { return { result: JSON.parse(readFileSync(resultPath, 'utf8')), release: () => { writeFileSync(releaseGate, 'go'); return exited; } }; }
      catch { await pause(10); }
    }
  };
  const batch = (name, overrides = {}) => {
    const source = join(repo, 'src', `${name}.ts`);
    if (!existsSync(source)) writeFileSync(source, 'export {};\n');
    return { kind: 'batch', account: 'team', model: 'claude-opus-5-5', effort: 'xhigh', claudeSessionId: randomUUID(),
      sessionMode: 'new', output: join(base, 'other', `${name}.json`), sources: [{ source, readOnly: false }], ...overrides };
  };
  const active = () => coordinationStatus(coordination).active;
  const waitForLease = async predicate => {
    for (let attempt = 0; attempt < 3000; attempt++) {
      const lease = active().find(predicate);
      if (lease) return lease;
      await pause(10);
    }
    assert.fail('Lease attendue non observée.');
  };
  const argv = output => ['--cwd', repo, '--mode', 'edit', '--allow-file', 'src/a.ts',
    '--brief', join(base, 'brief.md'), '--output', output];
  return { base, repo, coordination, gate, launches, deps, tryInChild, holdInChild, batch, active, waitForLease, argv };
}

test('Pro diagnose, dry-run and batch are refused before CLI inspection or spawn', { timeout: 120000 }, async t => {
  const fx = launcherFixture(t);
  const calls = [];
  const deps = {
    ...fx.deps,
    findClaude: () => { calls.push('findClaude'); return fx.deps.findClaude(); },
    cliStatus: (...args) => { calls.push('cliStatus'); return fx.deps.cliStatus(...args); },
    spawn: (...args) => { calls.push('spawn'); return fx.deps.spawn(...args); },
  };
  const dryOutput = join(fx.base, 'out', 'pro-dry.json');
  const liveOutput = join(fx.base, 'out', 'pro-live.json');
  const requests = [
    ['--account', 'pro', '--diagnose'],
    ['--account', 'pro', '--dry-run', ...fx.argv(dryOutput)],
    ['--account', 'pro', ...fx.argv(liveOutput)],
  ];
  for (const request of requests) {
    await assert.rejects(bridge.main(request, deps), error => error.coordination?.reason === 'team_only');
  }
  assert.deepEqual(calls, []);
  assert.equal(fx.launches.length, 0);
  assert.equal(fx.active().length, 0);
  assert.equal(existsSync(dryOutput + '.artifacts'), false);
  assert.equal(existsSync(liveOutput + '.artifacts'), false);
});

test('a reported session UUID mismatch blocks publication and retains unreported originals', { timeout: 120000 }, async t => {
  const observedSessionId = '00000000-0000-4000-8000-000000000001';
  const fx = launcherFixture(t, { edit: 'src/a.ts', observedSessionId });
  const output = join(fx.base, 'out', 'mismatched-session.json');
  const running = bridge.main(fx.argv(output), fx.deps);
  const lease = await fx.waitForLease(candidate => candidate.state === 'running');
  writeFileSync(fx.gate, 'go');
  await assert.rejects(running, /conversation natif différent/i);

  assert.equal(readFileSync(join(fx.repo, 'src', 'a.ts'), 'utf8'), 'export const original = true;\n');
  assert.equal(existsSync(output), false);
  const archive = output + '.artifacts';
  const session = JSON.parse(readFileSync(join(archive, 'session.json'), 'utf8'));
  assert.equal(session.reservedSessionId, lease.claudeSessionId);
  assert.equal(session.claudeSessionId, observedSessionId);
  assert.equal(session.sessionMatchesReservation, false);
  assert.equal(session.transportOutcome, 'completed');
  assert.ok(existsSync(join(archive, 'result.json')));
  assert.ok(existsSync(join(archive, 'transcript.jsonl')));

  const recovery = JSON.parse(readFileSync(output + '.recovery.json', 'utf8'));
  assert.equal(recovery.status, 'unreviewed');
  assert.equal(recovery.reportMayBePartial, false);
  assert.ok(recovery.files.some(file => file.path === 'src/a.ts' && file.sourceStatus === 'unchanged'));
  const progress = JSON.parse(readFileSync(output + '.progress.json', 'utf8'));
  assert.equal(progress.outcome, 'claude_error');
  assert.equal(progress.resultStatus, 'completed');
  assert.equal(progress.deliveryStatus, 'not_attempted');

  const [retained] = fx.active();
  assert.equal(retained.leaseId, lease.leaseId);
  assert.equal(retained.state, 'retained');
  assert.equal(retained.retainedReason, 'unreported_drafts');
  assert.equal(retained.countsTowardCapacity, false);
  assert.ok(retained.resources.length >= 1);
  assert.ok(retained.resources.every(resource => resource.role === 'edit' && resource.mode === 'exclusive'));
  assert.ok(existsSync(fx.coordination.legacyLock));
});

test('the launcher reserves UUID, output and originals before spawn and releases after report', { timeout: 120000 }, async t => {
  const fx = launcherFixture(t, { edit: 'src/a.ts' });
  activateParallelClaude({ ...fx.coordination, until: new Date(Date.now() + 3600e3).toISOString(),
    authorizedBy: 'fixture', evidence: 'claude-native-integration.test.mjs' });
  const output = join(fx.base, 'out', 'lot.json');
  const running = bridge.main(fx.argv(output), fx.deps);
  const lease = await fx.waitForLease(candidate => candidate.state === 'running');
  const args = fx.launches[0];
  assert.equal(args[args.indexOf('--session-id') + 1], lease.claudeSessionId);
  assert.ok(!args.includes('--resume'));
  assert.equal(lease.sessionMode, 'new');
  assert.ok(lease.resources.some(resource => resource.key === `session:${lease.claudeSessionId.toLowerCase()}`));
  assert.ok(lease.resources.some(resource => resource.role === 'edit'));
  assert.ok(Number.isSafeInteger(lease.child?.pid));

  const competing = fx.tryInChild(fx.batch('a', { sources: [{ source: join(fx.repo, 'src', 'a.ts'), readOnly: false }] }));
  assert.deepEqual(competing, { admitted: false, reason: 'conflict' });
  const sameConversation = fx.tryInChild(fx.batch('b', { claudeSessionId: lease.claudeSessionId, sessionMode: 'resume' }));
  assert.deepEqual(sameConversation, { admitted: false, reason: 'conflict' });
  assert.equal(fx.tryInChild(fx.batch('disjoint')).admitted, true);
  assert.equal(readFileSync(join(fx.repo, 'src', 'a.ts'), 'utf8'), 'export const original = true;\n');

  writeFileSync(fx.gate, 'go');
  await running;
  assert.equal(readFileSync(join(fx.repo, 'src', 'a.ts'), 'utf8'), 'export const edited = true;\n');
  assert.equal(fx.active().length, 0);
  assert.equal(existsSync(fx.coordination.legacyLock), false);
  const released = JSON.parse(readFileSync(join(fx.coordination.root, 'released', `${lease.leaseId}.json`), 'utf8'));
  assert.equal(released.state, 'released');
  const session = JSON.parse(readFileSync(join(`${output}.artifacts`, 'session.json'), 'utf8'));
  assert.equal(session.reservedSessionId, lease.claudeSessionId);
  assert.equal(session.sessionMatchesReservation, true);
  assert.equal(session.leaseId, lease.leaseId);
});

test('a colliding output is refused before any archive or process exists', { timeout: 120000 }, async t => {
  const fx = launcherFixture(t, { edit: 'src/a.ts' });
  const output = join(fx.base, 'out', 'taken.json');
  const held = await fx.holdInChild(fx.batch('holder', { output }));
  assert.equal(held.result.admitted, true);
  await assert.rejects(bridge.main(fx.argv(output), fx.deps), error => error.coordination?.reason === 'conflict');
  assert.equal(existsSync(`${output}.artifacts`), false);
  assert.equal(fx.launches.length, 0);
  await held.release();
  assert.equal(fx.active().length, 0);
});

test('unreported drafts keep their originals reserved, free capacity and conversation, until an explicit release', { timeout: 120000 }, async t => {
  const fx = launcherFixture(t, { edit: 'src/a.ts', subtype: 'error_max_turns' });
  writeFileSync(fx.gate, 'go');
  const output = join(fx.base, 'out', 'budget.json');
  await assert.rejects(bridge.main(fx.argv(output), fx.deps), /turn_budget_reached/);
  assert.equal(readFileSync(join(fx.repo, 'src', 'a.ts'), 'utf8'), 'export const original = true;\n');
  assert.equal(readFileSync(join(`${output}.artifacts`, 'workspace', 'src', 'a.ts'), 'utf8'), 'export const edited = true;\n');
  const [retained] = fx.active();
  assert.equal(retained.state, 'retained');
  assert.equal(retained.retainedReason, 'unreported_drafts');
  assert.equal(retained.countsTowardCapacity, false);
  assert.ok(retained.resources.every(resource => resource.role === 'edit'));
  assert.ok(existsSync(fx.coordination.legacyLock));

  admitClaudeLease(fx.batch('resume', { claudeSessionId: retained.claudeSessionId, sessionMode: 'resume' }), fx.coordination).release();
  const sameOriginal = fx.batch('a', { sources: [{ source: join(fx.repo, 'src', 'a.ts'), readOnly: false }] });
  assert.throws(() => admitClaudeLease(sameOriginal, fx.coordination), error => error.coordination?.reason === 'conflict');
  releaseRetainedClaudeLease(retained.leaseId, { ...fx.coordination, reason: 'Brouillon examiné dans la copie archivée.' });
  admitClaudeLease(sameOriginal, fx.coordination).release();
  assert.equal(fx.active().length, 0);
  assert.equal(existsSync(fx.coordination.legacyLock), false);
});
