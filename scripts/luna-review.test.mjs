import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter, once } from 'node:events';
import { spawnSync } from 'node:child_process';
import { PassThrough } from 'node:stream';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { acquireLunaBatch, lunaArguments, runLunaBatch, validateTasks } from './luna-review.mjs';

const contextWindow = 872000;
const started = sessionId => ({ type: 'thread.started', thread_id: sessionId });
const completed = { type: 'turn.completed', turn_id: 'turn-1' };
const failed = { type: 'turn.failed', turn_id: 'turn-1', error: { message: 'private detail' } };
const jsonl = (...events) => `${events.map(event => JSON.stringify(event)).join('\n')}\n`;

function createFakeSpawner(scenarios, observations = {}, beforeStart = () => {}) {
  return (exe, args, options) => {
    const resultPath = args[args.indexOf('--output-last-message') + 1];
    const taskId = basename(resultPath, '.md');
    const scenario = scenarios[taskId];
    assert(scenario, `Missing fake process scenario for ${taskId}`);
    beforeStart({ taskId, resultPath, args, options });

    const child = new EventEmitter();
    child.stdin = new PassThrough();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    let prompt = '';
    let ended = false;
    child.stdin.on('data', chunk => { prompt += chunk.toString('utf8'); });
    observations[taskId] = { args, options, get prompt() { return prompt; } };

    const finish = async (signal = scenario.closeSignal ?? null) => {
      if (ended) return;
      ended = true;
      if (scenario.result !== undefined) writeFileSync(resultPath, scenario.result, 'utf8');
      const stdoutEnded = once(child.stdout, 'end');
      const stderrEnded = once(child.stderr, 'end');
      for (const chunk of scenario.chunks ?? [scenario.trace ?? '']) child.stdout.write(chunk);
      child.stdout.end();
      child.stderr.end(scenario.stderr ?? '');
      await Promise.all([stdoutEnded, stderrEnded]);
      child.emit('close', scenario.exitCode ?? 0, signal);
    };
    child.kill = signal => {
      observations[taskId].killedWith = signal;
      void finish(scenario.killSignal ?? 'SIGTERM');
      return true;
    };

    if (!scenario.waitForKill) queueMicrotask(() => { void finish(); });
    return child;
  };
}

function createWorkspace() {
  const root = mkdtempSync(join(tmpdir(), 'laffinee-luna-test-'));
  return { root, outputDir: join(root, 'out'), lockPath: join(root, 'wave.lock') };
}

function batchDirectoryFor(outputDir, outcome) {
  return dirname(outcome.resultPath);
}

test('tasks reject malformed JSON entries before output or child start', async () => {
  const { root, outputDir, lockPath } = createWorkspace();
  let spawnCount = 0;
  try {
    for (const input of [null, {}, [null], ['text'], [{ id: {}, prompt: 'objective' }], [{ id: 'ok', prompt: 8 }]]) {
      assert.throws(() => validateTasks(input));
      await assert.rejects(runLunaBatch({ tasks: input, outputDir, contextWindow, cliPath: 'fake-codex', lockPath,
        spawnProcess: () => { spawnCount++; } }));
    }
    assert.equal(spawnCount, 0);
    assert.equal(existsSync(outputDir), false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('existing and stale locks are never removed automatically', () => {
  const { root, lockPath } = createWorkspace();
  mkdirSync(root, { recursive: true });
  writeFileSync(lockPath, '999999999\nstale-token\n', 'utf8');
  try {
    assert.throws(() => acquireLunaBatch(lockPath), /déjà active|verrou résiduel/);
    assert.equal(readFileSync(lockPath, 'utf8'), '999999999\nstale-token\n');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('batches preserve all outcomes and require native turn, session and fresh markdown', async () => {
  const { root, outputDir, lockPath } = createWorkspace();
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, 'missing-markdown.md'), 'STALE ROOT RESULT', 'utf8');
  const scenarios = {
    valid: { trace: jsonl(started('native-session-1'), completed), result: 'Réponse Luna vérifiée', stderr: 'diagnostic conservé' },
    no_turn: { trace: jsonl(started('native-session-2')), result: 'Pas de fin de tour' },
    turn_failed: { trace: jsonl(started('native-session-3'), failed), result: 'Échec malgré le code zéro' },
    no_session: { trace: jsonl(completed), result: 'Aucun identifiant de fil' },
    missing_markdown: { trace: jsonl(started('native-session-5'), completed) },
    cli_error: { trace: jsonl(started('native-session-6'), completed), result: 'Trace partielle', exitCode: 9 },
    bounded_parser: { chunks: [`${'x'.repeat(300 * 1024)}\n`, jsonl(started('native-session-7'), completed)], result: 'Après ligne trop longue' },
  };
  const observations = {};
  const manifestWasReady = [];
  try {
    const outcomes = await runLunaBatch({
      tasks: Object.keys(scenarios).map(id => ({ id, prompt: `Vérifier ${id}.` })),
      cwd: root,
      outputDir,
      contextWindow,
      cliPath: 'fake-codex',
      lockPath,
      env: { PATH: 'fake-path', LAFFINEE_CLAUDE_DELEGATE: '0' },
      spawnProcess: createFakeSpawner(scenarios, observations, ({ resultPath }) => {
        const batchPath = dirname(resultPath);
        const initial = JSON.parse(readFileSync(join(batchPath, 'results.json'), 'utf8'));
        assert.equal(initial.status, 'running');
        assert.equal(initial.outcomes.every(outcome => outcome.status === 'pending'), true);
        const pointer = JSON.parse(readFileSync(join(outputDir, 'results.json'), 'utf8'));
        assert.equal(pointer.resultsPath, join(batchPath, 'results.json'));
        manifestWasReady.push(true);
      }),
    });

    assert.equal(Array.isArray(outcomes), true);
    assert.equal(outcomes.length, 7);
    assert.equal(manifestWasReady.length, 7);
    assert.equal(outcomes.every(outcome => outcome.batchId === outcomes[0].batchId), true);
    assert.equal(outcomes.every(outcome => outcome.status === (outcome.responseReceived ? 'response_received' : 'failed')), true);

    const byId = Object.fromEntries(outcomes.map(outcome => [outcome.taskId, outcome]));
    assert.equal(byId.valid.status, 'response_received');
    assert.equal(byId.valid.sessionId, 'native-session-1');
    assert.equal(byId.valid.actualTurnCompleted, true);
    assert.equal(byId.valid.responseReceived, true);
    assert.equal(byId.valid.resultFreshNonempty, true);
    assert.equal(byId.valid.id, 'valid');
    assert.equal(byId.valid.result, byId.valid.resultPath);
    assert.equal(byId.valid.configured.model, 'gpt-6-luna');
    assert.equal(byId.valid.configured.reasoningEffort, 'max');
    assert.deepEqual(byId.valid.effective, { model: null, reasoningEffort: null, contextWindow: null });
    assert.equal(readFileSync(byId.valid.stderrPath, 'utf8'), 'diagnostic conservé');
    assert.match(readFileSync(byId.valid.tracePath, 'utf8'), /thread\.started/);
    assert.equal(observations.valid.options.env.LAFFINEE_CLAUDE_DELEGATE, '1');
    assert(observations.valid.prompt.includes("N'invoque ni Claude ni aucun autre expert"));
    assert(observations.valid.prompt.includes('ne délègue aucune sous-tâche'));

    for (const id of ['no_turn', 'turn_failed', 'no_session', 'missing_markdown', 'cli_error']) {
      assert.equal(byId[id].status, 'failed', id);
      assert.equal(byId[id].responseReceived, false, id);
    }
    assert.equal(byId.no_turn.actualTurnCompleted, false);
    assert.equal(byId.turn_failed.actualTurnCompleted, false);
    assert.equal(byId.cli_error.actualTurnCompleted, true);
    assert.notEqual(byId.missing_markdown.resultPath, join(outputDir, 'missing_markdown.md'));
    assert.equal(byId.missing_markdown.resultFreshNonempty, false);
    assert.equal(readFileSync(join(outputDir, 'missing-markdown.md'), 'utf8'), 'STALE ROOT RESULT');
    assert.match(byId.turn_failed.failureReasons.join(' '), /turn\.failed/);
    assert.equal(byId.bounded_parser.status, 'response_received');
    assert(statSync(byId.bounded_parser.tracePath).size > 300 * 1024);

    const batchPath = batchDirectoryFor(outputDir, byId.valid);
    const manifest = JSON.parse(readFileSync(join(batchPath, 'results.json'), 'utf8'));
    assert.equal(manifest.status, 'failed');
    assert.equal(manifest.outcomes.length, 7);
    assert.equal(manifest.outcomes.find(outcome => outcome.taskId === 'valid').responseReceived, true);
    const latest = JSON.parse(readFileSync(join(outputDir, 'results.json'), 'utf8'));
    assert.equal(latest.batchId, byId.valid.batchId);
    assert.equal(latest.resultsPath, join(batchPath, 'results.json'));
    assert.equal(existsSync(lockPath), false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('later batches use new UUID folders and keep prior traces and result manifests', async () => {
  const { root, outputDir, lockPath } = createWorkspace();
  const successful = { one: { trace: jsonl(started('session-one'), completed), result: 'one' } };
  try {
    const run = () => runLunaBatch({ tasks: [{ id: 'one', prompt: 'Review one.' }], cwd: root, outputDir,
      contextWindow, cliPath: 'fake-codex', lockPath, spawnProcess: createFakeSpawner(successful) });
    const first = (await run())[0];
    const firstTrace = readFileSync(first.tracePath, 'utf8');
    const second = (await run())[0];
    assert.notEqual(first.batchId, second.batchId);
    assert.notEqual(first.resultPath, second.resultPath);
    assert.equal(readFileSync(first.tracePath, 'utf8'), firstTrace);
    assert.equal(JSON.parse(readFileSync(join(dirname(first.resultPath), 'results.json'), 'utf8')).batchId, first.batchId);
    assert.equal(JSON.parse(readFileSync(join(dirname(second.resultPath), 'results.json'), 'utf8')).batchId, second.batchId);
    assert.equal(readdirSync(outputDir).filter(name => statSync(join(outputDir, name)).isDirectory()).length, 2);
    assert.equal(JSON.parse(readFileSync(join(outputDir, 'results.json'), 'utf8')).batchId, second.batchId);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('SIGINT terminates children and leaves a finalized durable batch', async () => {
  const { root, outputDir, lockPath } = createWorkspace();
  const signalTarget = new EventEmitter();
  const observations = {};
  try {
    const run = runLunaBatch({
      tasks: [{ id: 'interrupted', prompt: 'Read the assigned evidence.' }],
      cwd: root,
      outputDir,
      contextWindow,
      cliPath: 'fake-codex',
      lockPath,
      signalTarget,
      spawnProcess: createFakeSpawner({ interrupted: { waitForKill: true, trace: jsonl(started('native-before-stop')) } }, observations),
    });
    setTimeout(() => signalTarget.emit('SIGINT'), 20);
    const outcomes = await run;
    assert.equal(observations.interrupted.killedWith, 'SIGTERM');
    assert.equal(outcomes[0].status, 'failed');
    assert.equal(outcomes[0].sessionId, 'native-before-stop');
    const batchPath = dirname(outcomes[0].resultPath);
    const manifest = JSON.parse(readFileSync(join(batchPath, 'results.json'), 'utf8'));
    assert.equal(manifest.status, 'interrupted');
    assert.equal(manifest.outcomes[0].status, 'failed');
    assert(existsSync(outcomes[0].tracePath));
    assert(existsSync(outcomes[0].stderrPath));
    assert.equal(JSON.parse(readFileSync(join(outputDir, 'results.json'), 'utf8')).status, 'interrupted');
    assert.equal(signalTarget.listenerCount('SIGINT'), 0);
    assert.equal(signalTarget.listenerCount('SIGTERM'), 0);
    assert.equal(existsSync(lockPath), false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('the existing Luna command contract stays read-only with Max and no child agents', () => {
  const args = lunaArguments(process.cwd(), 'fresh.md', contextWindow);
  assert(args.includes('--ephemeral'));
  assert(args.includes('--sandbox'));
  assert(args.includes('read-only'));
  assert(args.includes('model_reasoning_effort="max"'));
  assert(args.includes('model_context_window=872000'));
  assert(args.includes('agents.enabled=false'));
  assert.throws(() => lunaArguments(process.cwd(), 'fresh.md', undefined));
});

test('--dry-run reports configured values without creating output or invoking Codex', () => {
  const { root, outputDir } = createWorkspace();
  const codexHome = join(root, 'codex-home');
  const tasksPath = join(root, 'tasks.json');
  const scriptPath = fileURLToPath(new URL('./luna-review.mjs', import.meta.url));
  mkdirSync(codexHome, { recursive: true });
  writeFileSync(join(codexHome, 'models_cache.json'), JSON.stringify({ models: [
    { slug: 'gpt-6-luna', max_context_window: contextWindow },
  ] }), 'utf8');
  writeFileSync(tasksPath, JSON.stringify([{ id: 'check', prompt: 'Verify the contract.' }]), 'utf8');
  try {
    const result = spawnSync(process.execPath, [scriptPath, '--tasks', tasksPath, '--output-dir', outputDir,
      '--cwd', root, '--dry-run'], {
      cwd: root,
      encoding: 'utf8',
      windowsHide: true,
      env: { ...process.env, CODEX_HOME: codexHome, CODEX_CLI_PATH: join(root, 'must-not-run-codex') },
    });
    assert.equal(result.status, 0, result.stderr);
    const plan = JSON.parse(result.stdout);
    assert.equal(plan.readOnly, true);
    assert.equal(plan.model, 'gpt-6-luna');
    assert.equal(plan.effort, 'max');
    assert.equal(plan.effectiveModelObserved, false);
    assert.equal(plan.effectiveEffortObserved, false);
    assert.equal(plan.tasks.length, 1);
    assert.equal(plan.tasks[0].args.includes('read-only'), true);
    assert.equal(existsSync(outputDir), false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
