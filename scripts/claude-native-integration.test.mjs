import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, rmdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import * as bridge from './claude-frontend.mjs';

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
    const args = bridge.claudeArguments({ mode, files: ['src/ui.tsx'], sonnet: true });
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
      : ['Read', 'Edit(./src/ui.tsx)', 'Agent(general-purpose)']);
    assert.equal(args[args.indexOf('--permission-mode') + 1], 'dontAsk');
    assert.equal(args[args.indexOf('--mcp-config') + 1], '{"mcpServers":{}}');
    assert.equal(args[args.indexOf('--disallowedTools') + 1], 'mcp__*');
  }
  const normal = bridge.claudeArguments({ mode: 'edit', files: ['src/ui.tsx'] });
  assert(!normal[normal.indexOf('--tools') + 1].includes('Agent'));
  const withLuna = bridge.claudeArguments({
    mode: 'edit', files: ['src/ui.tsx'], sonnet: true, luna: true, relayCommand: 'one-exact-relay',
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
  const editArgs = bridge.claudeArguments({ mode: 'edit', files: ['src/ui.tsx'] });
  assert.equal(editArgs[editArgs.indexOf('--max-turns') + 1], '60');
  const resumed = bridge.claudeArguments({
    mode: 'edit', files: ['src/ui.tsx'], maxTurns: 12,
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
