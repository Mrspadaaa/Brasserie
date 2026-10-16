import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { claudeAccountProfile, subscriptionEnvironment, validateClaudeAccountProfile, parseLauncherOptions } from './claude-frontend.mjs';
import { accountCommand, INTERACTIVE_ARGUMENTS, main as accountMain } from './claude-account.mjs';
import { activateParallelClaude, coordinationStatus } from './claude-coordination.mjs';

test('Team retains its current native directory and Pro uses a separate directory', () => {
  const home = join(tmpdir(), 'account-routing-fixture');
  const team = claudeAccountProfile('team', home);
  const pro = claudeAccountProfile('pro', home);
  assert.equal(team.configDirectory, join(home, '.claude'));
  assert.equal(pro.configDirectory, join(home, '.claude-pro'));
  assert.notEqual(team.configDirectory, pro.configDirectory);
  assert.throws(() => claudeAccountProfile('unknown', home), /team ou pro/);
});

test('profile routing affects only the child and cannot inherit the other login or token', () => {
  const home = join(tmpdir(), 'account-env-fixture');
  const parent = { USERPROFILE: home, CLAUDE_CONFIG_DIR: 'old-profile',
    CLAUDE_CODE_OAUTH_TOKEN: 'PRIVATE_TEST_VALUE', ANTHROPIC_API_KEY: 'PRIVATE_TEST_API' };
  const team = subscriptionEnvironment(parent, { account: 'team' });
  const pro = subscriptionEnvironment(parent, { account: 'pro' });
  assert.equal(team.CLAUDE_CONFIG_DIR, undefined); // Preserve the original default account/settings layout.
  assert.equal(pro.CLAUDE_CONFIG_DIR, join(home, '.claude-pro'));
  for (const child of [team, pro]) {
    assert.equal(child.CLAUDE_CODE_OAUTH_TOKEN, undefined);
    assert.equal(child.ANTHROPIC_API_KEY, undefined);
    assert.equal(child.CLAUDE_CODE_EFFORT_LEVEL, 'xhigh');
  }
  assert.equal(parent.CLAUDE_CONFIG_DIR, 'old-profile');
  assert.equal(parent.CLAUDE_CODE_OAUTH_TOKEN, 'PRIVATE_TEST_VALUE');
});

test('matching email and organisation cannot conceal the wrong subscription or directory', () => {
  const home = join(tmpdir(), 'account-validation-fixture');
  const team = claudeAccountProfile('team', home);
  const pro = claudeAccountProfile('pro', home);
  const identity = { email: 'same@example.test', orgId: 'same-organisation' };
  validateClaudeAccountProfile({ ...identity, subscriptionType: 'team', configDirectory: team.configDirectory }, team);
  assert.throws(() => validateClaudeAccountProfile({ ...identity, subscriptionType: 'pro', configDirectory: team.configDirectory }, team), /abonnement team attendu/);
  assert.throws(() => validateClaudeAccountProfile({ ...identity, subscriptionType: 'team', configDirectory: pro.configDirectory }, team), /Répertoire/);
  assert.throws(() => validateClaudeAccountProfile({ ...identity, subscriptionType: 'team' }, team), /Répertoire/);
});

test('launcher parsing defaults to Team while account admission remains a separate policy', () => {
  assert.equal(parseLauncherOptions(['--brief', 'b', '--output', 'o']).account, 'team');
  // Parsing an explicit profile does not authorize a new Pro lot.
  assert.equal(parseLauncherOptions(['--account', 'pro', '--diagnose']).account, 'pro');
  assert.throws(() => parseLauncherOptions(['--account', 'auto', '--diagnose']), /team ou pro/);
  assert.deepEqual(accountCommand(['team']), { account: 'team', command: 'chat' });
  assert.deepEqual(accountCommand(['pro', 'login']), { account: 'pro', command: 'login' });
  assert.deepEqual(accountCommand(['pro', 'status']), { account: 'pro', command: 'status' });
  assert.throws(() => accountCommand(['pro', 'login', '--console']), /Usage/);
});

// Interactive path: same machine-wide admission, with a fake TUI and real competing processes.
const MODULE_URL = new URL('./claude-coordination.mjs', import.meta.url).href;
const CHILD_SCRIPT = `
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
const sleep = ms => new Promise(resolveSleep => setTimeout(resolveSleep, ms));

function interactiveFixture(t) {
  const base = mkdtempSync(join(tmpdir(), 'laffinee-claude-account-lease-'));
  const home = join(base, 'home');
  mkdirSync(home);
  const children = [];
  t.after(() => {
    for (const child of children) if (child.exitCode === null && child.signalCode === null) child.kill();
    assert.equal(dirname(resolve(base)), resolve(tmpdir()));
    rmSync(base, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  });
  const coordination = { root: join(base, 'coordination'), legacyLock: join(base, 'legacy.lock') };
  const launches = [];
  const statuses = [];
  let current;
  const deps = {
    // The profile root is a fixture: no real login directory is created or read.
    env: { PATH: process.env.PATH || '', USERPROFILE: home, HOME: home },
    findClaude: () => 'claude-native-fixture',
    cliStatus: (exe, env, account) => { statuses.push(account); return { fixture: true, accountProfile: account }; },
    spawn: (exe, args, options) => {
      const child = new EventEmitter();
      child.pid = 1_000_000_000 + launches.length;
      launches.push({ exe, args, options });
      current = child;
      setImmediate(() => child.emit('spawn'));
      return child;
    },
    coordination,
  };
  const batch = (name = randomUUID(), account = 'team') => {
    const source = join(base, 'repo', `${name}.ts`);
    mkdirSync(dirname(source), { recursive: true });
    writeFileSync(source, 'export {};\n');
    return { kind: 'batch', account, model: 'claude-opus-5-5', effort: 'xhigh', claudeSessionId: randomUUID(),
      sessionMode: 'new', output: join(base, 'out', `${name}.json`), sources: [{ source, readOnly: false }] };
  };
  const env = request => ({ ...process.env,
    LAFFINEE_COORDINATION_CHILD: JSON.stringify({ module: MODULE_URL, request, options: coordination }) });
  const tryInChild = request => {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', CHILD_SCRIPT],
      { env: env(request), encoding: 'utf8', windowsHide: true, timeout: 60000 });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  };
  const holdInChild = async request => {
    const resultPath = join(base, `held-${randomUUID()}.json`);
    const releaseGate = `${resultPath}.release`;
    const child = spawn(process.execPath, ['--input-type=module', '-e', CHILD_SCRIPT], {
      env: { ...env(request), LAFFINEE_COORDINATION_CHILD: JSON.stringify({ module: MODULE_URL, request, options: coordination, resultPath, releaseGate }) },
      stdio: 'ignore', windowsHide: true,
    });
    children.push(child);
    const exited = new Promise(resolveExit => child.once('close', resolveExit));
    for (;;) {
      try { return { result: JSON.parse(readFileSync(resultPath, 'utf8')), release: () => { writeFileSync(releaseGate, 'go'); return exited; } }; }
      catch { await sleep(10); }
    }
  };
  const active = () => coordinationStatus(coordination).active;
  const waitForLease = async predicate => {
    for (let attempt = 0; attempt < 3000; attempt++) {
      const lease = active().find(predicate);
      if (lease) return lease;
      await sleep(10);
    }
    assert.fail('Lease attendue non observée.');
  };
  return { base, home, coordination, deps, launches, statuses, batch, tryInChild, holdInChild, active, waitForLease,
    finish: (code = 0) => current.emit('close', code) };
}

test('status reads the selected profile without reserving a lot or opening a conversation', async t => {
  const fx = interactiveFixture(t);
  await accountMain(['team', 'status'], fx.deps);
  assert.deepEqual(fx.statuses, ['team']);
  assert.equal(fx.launches.length, 0);
  assert.equal(fx.active().length, 0);
  assert.equal(existsSync(fx.coordination.legacyLock), false);
});

test('Pro chat is refused before CLI lookup or status while explicit Pro status stays available', async t => {
  const fx = interactiveFixture(t);
  let lookups = 0;
  const dependencies = { ...fx.deps, findClaude: () => { lookups++; return fx.deps.findClaude(); } };
  await assert.rejects(accountMain(['pro'], dependencies), error => error.coordination?.reason === 'team_only');
  assert.equal(lookups, 0);
  assert.deepEqual(fx.statuses, []);
  assert.equal(fx.launches.length, 0);
  assert.equal(fx.active().length, 0);

  await accountMain(['pro', 'status'], fx.deps);
  assert.deepEqual(fx.statuses, ['pro']);
  assert.equal(fx.launches.length, 0);
});

test('interactive Team chat is admitted before its TUI, stays exclusive even with capacity two, and releases on close', { timeout: 120000 }, async t => {
  const fx = interactiveFixture(t);
  activateParallelClaude({ ...fx.coordination, until: new Date(Date.now() + 3600e3).toISOString(),
    authorizedBy: 'fixture', evidence: 'claude-account.test.mjs' });
  const chat = accountMain(['team'], fx.deps);
  const lease = await fx.waitForLease(candidate => candidate.state === 'running');
  assert.equal(lease.kind, 'interactive');
  assert.equal(lease.scope, 'all');
  assert.equal(lease.countsTowardCapacity, true);
  assert.deepEqual([lease.account, lease.model, lease.effort], ['team', 'claude-opus-5-5', 'xhigh']);
  assert.equal(fx.launches.length, 1);
  assert.deepEqual(fx.launches[0].args, [...INTERACTIVE_ARGUMENTS]);
  assert.deepEqual(INTERACTIVE_ARGUMENTS, ['--model', 'claude-opus-5-5', '--effort', 'xhigh']);
  assert.equal(fx.launches[0].options.stdio, 'inherit');

  await assert.rejects(accountMain(['team'], fx.deps), error => error.coordination?.reason === 'conflict');
  assert.equal(fx.launches.length, 1);
  const competing = fx.tryInChild(fx.batch('competing'));
  assert.deepEqual(competing, { admitted: false, reason: 'conflict' });

  fx.finish(0);
  await chat;
  assert.equal(fx.active().length, 0);
  assert.equal(fx.tryInChild(fx.batch('after-chat')).admitted, true);
});

test('interactive chat cannot bypass a lot held by another process', { timeout: 120000 }, async t => {
  const fx = interactiveFixture(t);
  const held = await fx.holdInChild(fx.batch('held'));
  assert.equal(held.result.admitted, true);
  await assert.rejects(accountMain(['team'], fx.deps), error => ['conflict', 'capacity'].includes(error.coordination?.reason));
  assert.equal(fx.launches.length, 0);
  await held.release();
  assert.equal(fx.active().length, 0);
});

test('a certain launch failure frees the reservation; a started TUI keeps it until close', { timeout: 60000 }, async t => {
  const fx = interactiveFixture(t);
  const failing = { ...fx.deps, spawn: () => {
    const child = new EventEmitter();
    setImmediate(() => { child.emit('error', Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' })); child.emit('close', -2); });
    return child;
  } };
  await assert.rejects(accountMain(['team'], failing), /ENOENT/);
  assert.equal(fx.active().length, 0);
  const throwing = { ...fx.deps, spawn: () => { throw new Error('spawn EACCES'); } };
  await assert.rejects(accountMain(['team'], throwing), /EACCES/);
  assert.equal(fx.active().length, 0);

  const chat = accountMain(['team'], fx.deps);
  await fx.waitForLease(candidate => candidate.state === 'running');
  await sleep(50);
  assert.equal(fx.active().length, 1);
  const previousExitCode = process.exitCode;
  fx.finish(3);
  await chat;
  const observedExitCode = process.exitCode;
  process.exitCode = previousExitCode; // The TUI exit code must not fail the test runner itself.
  assert.equal(observedExitCode, 3);
  assert.equal(fx.active().length, 0);
});

test('login never opens Opus and cannot rewrite a profile used by an active lot', { timeout: 120000 }, async t => {
  const fx = interactiveFixture(t);
  const held = await fx.holdInChild(fx.batch('team-lot'));
  assert.equal(held.result.admitted, true);
  await assert.rejects(accountMain(['team', 'login'], fx.deps), error => error.coordination?.reason === 'conflict');
  assert.equal(fx.launches.length, 0);

  const login = accountMain(['pro', 'login'], fx.deps);
  const lease = await fx.waitForLease(candidate => candidate.kind === 'login');
  assert.equal(lease.countsTowardCapacity, false);
  assert.deepEqual(lease.resources.map(resource => [resource.key, resource.mode]), [['profile:pro', 'exclusive']]);
  assert.deepEqual(fx.launches[0].args, ['auth', 'login', '--claudeai']);
  assert.ok(!fx.launches[0].args.includes('claude-opus-5-5'));
  assert.ok(existsSync(join(fx.home, '.claude-pro')));
  fx.finish(0);
  await login;
  assert.deepEqual(fx.statuses, ['pro']);
  await held.release();
  assert.equal(fx.active().length, 0);
});
