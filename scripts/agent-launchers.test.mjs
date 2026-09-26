import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmdirSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { applyStagedEdits, applyStagedEditsWithProgress, captureClaudeProcess, checkedOutputPath, claudeArguments, claudeProgressPath,
  claudeRecoveryPath, classifyClaudeOutcome, createClaudeProgressTracker, describeSources, inspectStagedChanges,
  lunaRelayCommand, MAX_BRIEF_BYTES, MAX_FILES, parseLauncherOptions, readBrief, recordClaudeFailureRecovery,
  stageSources, writeClaudeRecoveryManifest,
  subscriptionEnvironment, subscriptionStatus } from './claude-frontend.mjs';
import { acquireLunaBatch, lunaArguments, validateTasks } from './luna-review.mjs';

function splitText(value, width = 11) {
  return Array.from({ length: Math.ceil(value.length / width) }, (_, index) => value.slice(index * width, (index + 1) * width));
}

function fakeClaudeProcess(phases, { stderr = '', exitCode = 0 } = {}) {
  const script = `
    const phases = ${JSON.stringify(phases)};
    let phaseIndex = 0, chunkIndex = 0;
    function next() {
      if (phaseIndex >= phases.length) {
        if (${JSON.stringify(stderr)}) process.stderr.write(${JSON.stringify(stderr)});
        process.exitCode = ${Number(exitCode)};
        return;
      }
      const phase = phases[phaseIndex];
      if (chunkIndex < phase.chunks.length) {
        process.stdout.write(phase.chunks[chunkIndex++], () => setImmediate(next));
      } else {
        phaseIndex++;
        chunkIndex = 0;
        setTimeout(next, phase.delay);
      }
    }
    next();
  `;
  return spawn(process.execPath, ['-e', script], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
}

async function waitForProgress(path, predicate) {
  for (let attempt = 0; attempt < 500; attempt++) {
    try {
      const state = JSON.parse(readFileSync(path, 'utf8'));
      if (predicate(state)) return state;
    } catch { /* Wait until the atomic snapshot is available. */ }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  assert.fail('État de progression attendu non observé.');
}

test('Claude uses native subscription credentials, with xhigh effort isolated to child', () => {
  const original = { PATH: 'native', ANTHROPIC_API_KEY: 'test-key', ANTHROPIC_AUTH_TOKEN: 'test-token',
    ANTHROPIC_BASE_URL: 'https://example.invalid', ANTHROPIC_AWS_API_KEY: 'test-aws-key',
    CLAUDE_CODE_USE_VERTEX: '1', CLAUDE_CODE_USE_ANTHROPIC_AWS: '1', CLAUDE_CODE_SIMPLE: '1',
    anthropic_api_key: 'lower-case-key',
    CLAUDE_CODE_EFFORT_LEVEL: 'max' };
  const env = subscriptionEnvironment(original);
  assert.equal(env.PATH, 'native'); assert.equal(env.CLAUDE_CODE_EFFORT_LEVEL, 'xhigh');
  assert.equal(original.CLAUDE_CODE_EFFORT_LEVEL, 'max');
  assert.equal(env.ANTHROPIC_API_KEY, undefined); assert.equal(env.ANTHROPIC_AUTH_TOKEN, undefined);
  assert.equal(env.ANTHROPIC_BASE_URL, undefined); assert.equal(env.CLAUDE_CODE_USE_VERTEX, undefined);
  assert.equal(env.ANTHROPIC_AWS_API_KEY, undefined);
  assert.equal(env.CLAUDE_CODE_USE_ANTHROPIC_AWS, undefined);
  assert.equal(env.CLAUDE_CODE_SIMPLE, undefined);
  assert.equal(env.anthropic_api_key, undefined);
  assert.equal(original.ANTHROPIC_API_KEY, 'test-key');
});

test('API authentication cannot silently stand in for a Pro subscription', () => {
  const pro = { loggedIn: true, authMethod: 'claude.ai', subscriptionType: 'pro', apiProvider: 'firstParty', apiKeySource: null };
  assert.equal(subscriptionStatus(pro).subscriptionType, 'pro');
  for (const patch of [{ loggedIn: false }, { authMethod: 'apiKey' }, { apiKeySource: 'environment' }, { apiProvider: 'bedrock' },
    { subscriptionType: null }, { subscriptionType: 'max' }, { subscriptionType: 'team' }, { subscriptionType: 'enterprise' }]) {
    assert.throws(() => subscriptionStatus({ ...pro, ...patch }));
  }
});

test('review defaults to thirty turns and no tools when the brief is self-contained', () => {
  const args = claudeArguments();
  assert(args.includes('--safe-mode'));
  assert(args.includes('--restricted'));
  assert.equal(args[args.indexOf('--output-format') + 1], 'stream-json');
  assert(args.includes('--verbose'));
  assert(args.includes('--include-partial-messages'));
  assert(args.includes('claude-opus-5-5'));
  assert.equal(args[args.indexOf('--effort') + 1], 'xhigh');
  assert.equal(args[args.indexOf('--tools') + 1], '');
  assert.equal(args[args.indexOf('--max-turns') + 1], '30');
  assert.equal(args[args.indexOf('--permission-mode') + 1], 'dontAsk');
  assert(!args.includes('--allowedTools'));
  assert(!args.includes('--fallback-model'));
  assert(!args.includes('--max-budget-usd'));
  assert(!args.join(' ').includes('test-key'));
});

test('targeted review exposes only Read in an isolated working directory', () => {
  const args = claudeArguments({ files: ['screens/320.png', 'src/yeast.ts'], maxTurns: 6 });
  assert.equal(args[args.indexOf('--tools') + 1], 'Read');
  assert.equal(args[args.indexOf('--max-turns') + 1], '6');
  assert(!args.includes('Glob'));
  assert(!args.includes('Grep'));
  assert(!args.includes('Bash'));
  assert(!args.includes('Write'));
  assert.deepEqual(args.slice(args.indexOf('--allowedTools') + 1), ['Read']);
  assert.deepEqual(args.slice(args.indexOf('--disallowedTools'), args.indexOf('--disallowedTools') + 2), ['--disallowedTools', 'mcp__*']);
});

test('edit rules cover only explicitly named copies and Write uses Edit(path) permission', () => {
  assert.throws(() => claudeArguments({ mode: 'edit' }), /liste explicite/);
  for (const file of ['../outside.ts', 'src/*.tsx', 'src/file)', '/tmp/other.ts', 'src/!secret.ts']) {
    assert.throws(() => claudeArguments({ mode: 'edit', files: [file] }), /non borné/);
  }
  const args = claudeArguments({ mode: 'edit', files: ['src/ui/test.tsx'] });
  assert.equal(args[args.indexOf('--tools') + 1], 'Read,Edit,Write');
  assert(args.includes('Read'));
  assert(args.includes('Edit(./src/ui/test.tsx)'));
  assert(!args.includes('Write(./src/ui/test.tsx)'));
  assert.equal(args[args.indexOf('--max-turns') + 1], '30');
});

test('Luna remains opt-in inside one Claude consultation, with one exact relay command', () => {
  const command = lunaRelayCommand(process.cwd(), join(tmpdir(), 'claude-stage'));
  const args = claudeArguments({ files: ['screen.png'], luna: true, relayCommand: command });
  assert.equal(args[args.indexOf('--tools') + 1], 'Read,Write,Bash,TaskOutput');
  assert(args.includes('TaskOutput'));
  assert(args.includes('Read'));
  assert(args.includes('Edit(./luna-tasks.json)'));
  assert(args.includes('Bash(' + command + ')'));
  assert(!args.some(arg => arg === 'Bash(node scripts/luna-review.mjs *)'));
  assert.throws(() => claudeArguments({ luna: true }), /Commande Luna/);
});

test('launcher parses real arguments and refuses malformed turn budgets', () => {
  const basic = parseLauncherOptions(['--brief', 'b.txt', '--output', 'r.json']);
  assert.equal(basic.mode, 'review');
  assert.equal(basic.maxTurns, 30);
  assert.equal(parseLauncherOptions(['--mode', 'edit', '--brief', 'b', '--output', 'o']).maxTurns, 30);
  assert.deepEqual(basic.files, []);
  const edit = parseLauncherOptions(['--mode', 'edit', '--max-turns', '18',
    '--allow-file', 'src/a.ts', '--allow-file', 'src/b.ts', '--brief', 'b.txt', '--output', 'r.json']);
  assert.equal(edit.maxTurns, 18);
  assert.deepEqual(edit.files, ['src/a.ts', 'src/b.ts']);
  assert.equal(parseLauncherOptions(['--brief', 'b', '--output', 'o', '--max-turns', '33']).maxTurns, 33);
  for (const value of ['0', '-1', '1.5', 'NaN', '9007199254740992']) {
    assert.throws(() => parseLauncherOptions(['--brief', 'b', '--output', 'o', '--max-turns', value]), /max-turns/);
  }
  assert.throws(() => parseLauncherOptions(['--brief', '--output', 'o']), /Valeur manquante/);
  assert.throws(() => parseLauncherOptions(['--brief', 'b', '--output', 'o', '--unknown']), /inconnue/);
  assert.throws(() => parseLauncherOptions(['--brief', 'b', '--brief', 'c', '--output', 'o']), /répétée/);
  assert.throws(() => parseLauncherOptions(['--brief', 'b', '--output', 'o',
    ...Array.from({ length: MAX_FILES + 1 }, (_, i) => ['--allow-file', String(i)]).flat()]), /Au plus 128/);
  assert.throws(() => claudeArguments({ maxTurns: Infinity }), /max-turns/);
});

test('brief validation counts UTF-8 bytes and never truncates invalid input', () => {
  const directory = mkdtempSync(join(tmpdir(), 'laffinee-brief-test-'));
  const path = join(directory, 'brief.txt');
  try {
    writeFileSync(path, 'é'.repeat(MAX_BRIEF_BYTES / 2), 'utf8');
    assert.equal(Buffer.byteLength(readBrief(path)), MAX_BRIEF_BYTES);
    writeFileSync(path, 'é'.repeat(MAX_BRIEF_BYTES / 2) + 'a', 'utf8');
    assert.throws(() => readBrief(path), /Brief trop long.*octets/);
    writeFileSync(path, Buffer.from([0xff]));
    assert.throws(() => readBrief(path), /UTF-8/);
    writeFileSync(path, ' \n  ', 'utf8');
    assert.throws(() => readBrief(path), /non vide/);
    writeFileSync(path, 'objectif\0suite', 'utf8');
    assert.throws(() => readBrief(path), /octet nul/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('provided files are concrete, sized, and staged edits preserve concurrent changes', () => {
  const root = mkdtempSync(join(tmpdir(), 'laffinee-sources-test-'));
  const outside = mkdtempSync(join(tmpdir(), 'laffinee-attachment-test-'));
  const staged = mkdtempSync(join(tmpdir(), 'laffinee-stage-test-'));
  try {
    mkdirSync(join(root, 'src'));
    writeFileSync(join(root, 'src', 'a.ts'), 'old');
    writeFileSync(join(outside, 'capture.png'), 'fake-image');
    const read = describeSources(root, ['src/a.ts', join(outside, 'capture.png')]);
    assert.equal(read[0].staged, 'src/a.ts');
    assert.match(read[1].staged, /^attachments\/02-capture\.png$/);
    assert.throws(() => describeSources(root, ['../outside.ts']), /hors du dossier/);
    assert.throws(() => describeSources(root, ['src/*.ts']), /invalide/);
    assert.throws(() => describeSources(root, ['src/a.ts', './src/a.ts']), /répété/);
    assert.throws(() => describeSources(root, [join(outside, 'capture.png')], 'edit'), /non borné/);
    const edits = describeSources(root, ['src/a.ts'], 'edit');
    stageSources(staged, edits);
    assert.equal(readFileSync(join(staged, 'src', 'a.ts'), 'utf8'), 'old');
    writeFileSync(join(staged, 'src', 'a.ts'), 'new');
    assert.deepEqual(applyStagedEdits(staged, edits), [join(root, 'src', 'a.ts')]);
    assert.equal(readFileSync(join(root, 'src', 'a.ts'), 'utf8'), 'new');
    const second = describeSources(root, ['src/a.ts'], 'edit');
    writeFileSync(join(staged, 'src', 'a.ts'), 'from-Claude');
    writeFileSync(join(root, 'src', 'a.ts'), 'from-other-agent');
    assert.throws(() => applyStagedEdits(staged, second), /Conflit/);
    assert.equal(readFileSync(join(root, 'src', 'a.ts'), 'utf8'), 'from-other-agent');
    assert.throws(() => checkedOutputPath(join(root, 'src', 'a.ts'), join(outside, 'capture.png'), second), /écraser/);
    assert.throws(() => checkedOutputPath(join(outside, 'capture.png'), join(outside, 'capture.png'), second), /écraser/);
    assert.equal(checkedOutputPath(join(outside, 'result.json'), join(outside, 'capture.png'), second), join(outside, 'result.json'));
    writeFileSync(join(outside, 'result.json.progress.json'), 'protected');
    const progressCollision = describeSources(root, [join(outside, 'result.json.progress.json')]);
    assert.throws(() => checkedOutputPath(join(outside, 'result.json'), join(outside, 'capture.png'), progressCollision), /progression/);
    writeFileSync(join(outside, 'result.json.recovery.json'), 'protected');
    const recoveryCollision = describeSources(root, [join(outside, 'result.json.recovery.json')]);
    assert.throws(() => checkedOutputPath(join(outside, 'result.json'), join(outside, 'capture.png'), recoveryCollision), /récupération/);
    writeFileSync(join(root, 'large.ts'), Buffer.alloc(128 * 1024 + 1));
    assert.throws(() => describeSources(root, ['large.ts']), /Fichier trop gros/);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
    rmSync(staged, { recursive: true, force: true });
  }
});

test('turn and quota stops are identifiable, including JSON errors with empty stderr', () => {
  assert.equal(classifyClaudeOutcome({ code: 0, response: { result: 'quota discussed', is_error: false } }), 'completed');
  assert.equal(classifyClaudeOutcome({ code: 0, response: { subtype: 'error_max_turns', is_error: false } }), 'turn_budget_reached');
  assert.equal(classifyClaudeOutcome({ code: 1, response: { is_error: true, subtype: 'error_max_turns' } }), 'turn_budget_reached');
  assert.equal(classifyClaudeOutcome({ code: 1, response: { is_error: true, result: 'You have reached your usage limit' } }), 'quota_reached');
  assert.equal(classifyClaudeOutcome({ code: 1, response: { is_error: true, result: "You've hit your weekly limit" } }), 'quota_reached');
  assert.equal(classifyClaudeOutcome({ code: 1, errorText: 'rate limit reached' }), 'quota_reached');
  assert.equal(classifyClaudeOutcome({ code: 1, response: { is_error: true, result: 'other failure' } }), 'claude_error');
});

test('stream-json chunks expose allowlisted progress and preserve the final result JSON', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'laffinee-claude-progress-test-'));
  const output = join(directory, 'result.json');
  const progressFile = claudeProgressPath(output);
  const events = [
    { type: 'system', subtype: 'init', session_id: 'PRIVATE_SESSION', model: 'claude-opus-5-5' },
    { type: 'stream_event', event: { type: 'content_block_delta', delta: { type: 'text_delta', text: 'PRIVATE_GENERATED_TEXT' } } },
    { type: 'assistant', message: { content: [{ type: 'text', text: 'PRIVATE_THINKING' },
      { type: 'tool_use', id: 'PRIVATE_TOOL_ID', name: 'Read', input: { file_path: 'PRIVATE_TOOL_ARGUMENT' } }] } },
    { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'PRIVATE_TOOL_ID', content: 'PRIVATE_FILE_CONTENT' }] } },
    { type: 'result', subtype: 'success', is_error: false, result: 'Final answer', num_turns: 1 },
  ];
  const phases = events.map((event, index) => ({
    chunks: splitText(JSON.stringify(event) + '\n'),
    delay: index === 1 || index === 2 ? 1200 : 0,
  }));
  try {
    const tracker = createClaudeProgressTracker(progressFile);
    const child = fakeClaudeProcess(phases);
    const capturedPromise = captureClaudeProcess(child, tracker);
    const generating = await waitForProgress(progressFile, state => state.status === 'en_cours');
    assert.equal(generating.lastEvent.type, 'fragment_de_réponse');
    assert(!readFileSync(progressFile, 'utf8').includes('PRIVATE_GENERATED_TEXT'));
    const active = await waitForProgress(progressFile, state => state.status === 'outil');
    assert.deepEqual(active.lastEvent, { type: 'outil_démarré', at: active.lastEvent.at,
      elapsedMs: active.lastEvent.elapsedMs, tool: 'Read' });
    assert(active.startedAt && active.updatedAt);
    assert(Number.isInteger(active.elapsedMs) && active.elapsedMs >= active.lastEvent.elapsedMs);
    const heartbeat = await waitForProgress(progressFile, state => state.status === 'outil' && state.elapsedMs > active.elapsedMs);
    assert.equal(heartbeat.lastEvent.at, active.lastEvent.at);
    assert(heartbeat.elapsedMs > heartbeat.lastEvent.elapsedMs);
    const publicState = readFileSync(progressFile, 'utf8');
    for (const secret of ['PRIVATE_SESSION', 'PRIVATE_GENERATED_TEXT', 'PRIVATE_THINKING', 'PRIVATE_TOOL_ARGUMENT', 'PRIVATE_FILE_CONTENT', 'PRIVATE_TOOL_ID']) {
      assert(!publicState.includes(secret), `L’état public contient ${secret}`);
    }

    const captured = await capturedPromise;
    assert.equal(captured.outcome, 'completed');
    assert.equal(captured.receivedFinalResult, true);
    assert.deepEqual(JSON.parse(captured.finalJson), {
      type: 'result', subtype: 'success', is_error: false, result: 'Final answer', num_turns: 1,
    });
    writeFileSync(output, captured.finalJson, 'utf8');
    assert.equal(JSON.parse(readFileSync(output, 'utf8')).result, 'Final answer');
    tracker.record('résultat', 'résultat_final', {
      outcome: captured.outcome, modelOutcome: captured.outcome, resultStatus: 'completed', deliveryStatus: 'not_requested',
    });
    const finalState = JSON.parse(readFileSync(progressFile, 'utf8'));
    assert.equal(finalState.status, 'résultat');
    assert.equal(finalState.lastEvent.type, 'résultat_final');
    assert.equal(finalState.outcome, 'completed');
    assert.equal(finalState.modelOutcome, 'completed');
    assert.equal(finalState.resultStatus, 'completed');
    assert.deepEqual(Object.keys(finalState).sort(), [
      'schema', 'status', 'startedAt', 'updatedAt', 'elapsedMs', 'lastEvent', 'outcome', 'modelOutcome',
      'resultStatus', 'deliveryStatus', 'deliveryOutcome', 'counters', 'recovery',
    ].sort());
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('max-turns recovery lists changed staged copies without applying or validating them', async () => {
  const workspace = mkdtempSync(join(tmpdir(), 'laffinee-claude-max-turn-recovery-'));
  const root = join(workspace, 'repo');
  const staged = mkdtempSync(join(workspace, 'laffinee-claude-input-'));
  const output = join(workspace, 'result.json');
  const progressFile = claudeProgressPath(output);
  const manifestPath = claudeRecoveryPath(output);
  let tracker;
  try {
    mkdirSync(join(root, 'src'), { recursive: true });
    writeFileSync(join(root, 'src', 'page.html'), '<main>initial skeleton</main>');
    const sources = describeSources(root, ['src/page.html'], 'edit');
    stageSources(staged, sources);
    const phases = [
      { chunks: splitText(JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use',
        id: 'write-page', name: 'Write', input: { file_path: 'src/page.html', content: 'PRIVATE_TOOL_ARGUMENT' } }] } }) + '\n'), delay: 500 },
      { chunks: splitText(JSON.stringify({ type: 'result', subtype: 'error_max_turns', is_error: true,
        result: 'Turn limit reached', num_turns: 4 }) + '\n'), delay: 0 },
    ];
    tracker = createClaudeProgressTracker(progressFile, { deliveryRequested: true });
    const capturedPromise = captureClaudeProcess(fakeClaudeProcess(phases, { exitCode: 1 }), tracker);
    await waitForProgress(progressFile, state => state.lastEvent.type === 'outil_démarré');
    writeFileSync(join(staged, 'src', 'page.html'), '<main>PRIVATE_HTML_CONTENT</main>');

    const captured = await capturedPromise;
    assert.equal(captured.outcome, 'turn_budget_reached');
    writeFileSync(output, captured.finalJson, 'utf8');
    const recovery = recordClaudeFailureRecovery({
      manifestPath, directory: staged, sources, tracker, outcome: captured.outcome,
      receivedFinalResult: captured.receivedFinalResult, deliveryRequested: true,
    });

    assert.equal(readFileSync(join(root, 'src', 'page.html'), 'utf8'), '<main>initial skeleton</main>');
    assert(existsSync(join(staged, 'src', 'page.html')));
    assert.equal(readFileSync(output, 'utf8'), captured.finalJson);
    const manifestText = readFileSync(manifestPath, 'utf8');
    const savedManifest = JSON.parse(manifestText);
    assert.equal(savedManifest.status, 'unreviewed');
    assert.equal(savedManifest.validated, false);
    assert.equal(savedManifest.autoApplied, false);
    assert.equal(savedManifest.directory, staged);
    assert.equal(savedManifest.files.length, 1);
    assert.deepEqual(savedManifest.files[0], {
      path: 'src/page.html', size: Buffer.byteLength('<main>PRIVATE_HTML_CONTENT</main>'),
      sha256: savedManifest.files[0].sha256, sourceDiffers: false, sourceStatus: 'unchanged',
    });
    assert.match(savedManifest.files[0].sha256, /^[a-f\d]{64}$/);
    const stateText = readFileSync(progressFile, 'utf8');
    const state = JSON.parse(stateText);
    assert.equal(state.modelOutcome, 'turn_budget_reached');
    assert.equal(state.deliveryStatus, 'not_attempted');
    assert.equal(state.recovery.manifestPath, manifestPath);
    assert.equal(state.recovery.directory, staged);
    for (const secret of ['PRIVATE_HTML_CONTENT', 'PRIVATE_TOOL_ARGUMENT']) {
      assert(!stateText.includes(secret));
      assert(!manifestText.includes(secret));
    }
  } finally {
    tracker?.stopHeartbeat();
    rmSync(workspace, { recursive: true, force: true });
    rmSync(staged, { recursive: true, force: true });
  }
});

test('retry and structured error events update progress without exposing their payload', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'laffinee-claude-retry-test-'));
  const progressFile = claudeProgressPath(join(directory, 'result.json'));
  const phases = [
    { chunks: splitText(JSON.stringify({ type: 'system', subtype: 'api_retry', attempt: 2,
      error: 'PRIVATE_RETRY_DETAIL', retry_delay_ms: 5000 }) + '\n'), delay: 100 },
    { chunks: splitText(JSON.stringify({ type: 'error', error: 'PRIVATE_ERROR_TEXT' }) + '\n'), delay: 100 },
    { chunks: splitText(JSON.stringify({ type: 'result', subtype: 'error', is_error: true,
      result: "You've reached your weekly limit" }) + '\n'), delay: 0 },
  ];
  try {
    const tracker = createClaudeProgressTracker(progressFile);
    const capturedPromise = captureClaudeProcess(fakeClaudeProcess(phases), tracker);
    const retrying = await waitForProgress(progressFile, state => state.lastEvent.type === 'réessai');
    assert.equal(retrying.status, 'attente');
    assert(!JSON.stringify(retrying).includes('PRIVATE_RETRY_DETAIL'));
    const failed = await waitForProgress(progressFile, state => state.lastEvent.type === 'erreur');
    assert.equal(failed.status, 'erreur');
    assert(!JSON.stringify(failed).includes('PRIVATE_ERROR_TEXT'));
    const captured = await capturedPromise;
    assert.equal(captured.outcome, 'quota_reached');
    for (const secret of ['PRIVATE_RETRY_DETAIL', 'PRIVATE_ERROR_TEXT']) {
      assert(!readFileSync(progressFile, 'utf8').includes(secret));
    }
    tracker.record('erreur', 'résultat_final', { outcome: captured.outcome });
    assert.equal(JSON.parse(readFileSync(progressFile, 'utf8')).outcome, 'quota_reached');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('tool errors, permission refusals, and retries are counted without their payloads', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'laffinee-claude-tool-counts-test-'));
  const progressFile = claudeProgressPath(join(directory, 'result.json'));
  const phases = [
    { chunks: splitText(JSON.stringify({ type: 'assistant', message: { content: [
      { type: 'tool_use', id: 'read-1', name: 'Read', input: { file_path: 'PRIVATE_READ_PATH' } },
      { type: 'tool_use', id: 'edit-1', name: 'Edit', input: { path: 'PRIVATE_EDIT_ARGUMENT' } },
      { type: 'tool_use', id: 'write-1', name: 'Write', input: { content: 'PRIVATE_WRITE_ARGUMENT' } },
    ] } }) + '\n'), delay: 80 },
    { chunks: splitText(JSON.stringify({ type: 'system', subtype: 'api_retry', attempt: 1,
      error: 'overloaded', private_detail: 'PRIVATE_RETRY_DETAIL' }) + '\n'), delay: 80 },
    { chunks: splitText(JSON.stringify({ type: 'system', subtype: 'permission_denied',
      tool_input: 'PRIVATE_PERMISSION_ARGUMENT' }) + '\n'), delay: 80 },
    { chunks: splitText(JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result',
      tool_use_id: 'edit-1', is_error: true, content: [{ type: 'text', text: 'Permission to use Edit has been denied: PRIVATE_PERMISSION_BODY' }] }] } }) + '\n'), delay: 80 },
    { chunks: splitText(JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result',
      tool_use_id: 'write-1', is_error: true, content: 'PRIVATE_WRITE_ERROR' }] } }) + '\n'), delay: 80 },
    { chunks: splitText(JSON.stringify({ type: 'result', subtype: 'success', is_error: false,
      result: 'Recovered after tool errors', num_turns: 2 }) + '\n'), delay: 0 },
  ];
  try {
    const tracker = createClaudeProgressTracker(progressFile);
    const capturedPromise = captureClaudeProcess(fakeClaudeProcess(phases), tracker);
    const refusal = await waitForProgress(progressFile, state => state.lastEvent.type === 'refus_permission');
    assert.equal(refusal.lastEvent.category, 'permission_refused');
    assert.equal(refusal.counters.permissionRefusals, 1);
    const permissionToolError = await waitForProgress(progressFile, state =>
      state.lastEvent.type === 'outil_en_erreur' && state.lastEvent.category === 'permission_refused');
    assert.equal(permissionToolError.counters.toolErrors, 1);
    assert.equal(permissionToolError.counters.permissionRefusals, 1);
    const genericToolError = await waitForProgress(progressFile, state => state.counters.toolErrors === 2);
    assert.deepEqual(genericToolError.counters, {
      reads: 1, editWriteAttempts: 2, toolErrors: 2, permissionRefusals: 1, retries: 1,
    });
    const publicState = readFileSync(progressFile, 'utf8');
    for (const secret of ['PRIVATE_READ_PATH', 'PRIVATE_EDIT_ARGUMENT', 'PRIVATE_WRITE_ARGUMENT', 'PRIVATE_RETRY_DETAIL',
      'PRIVATE_PERMISSION_ARGUMENT', 'PRIVATE_PERMISSION_BODY', 'PRIVATE_WRITE_ERROR']) assert(!publicState.includes(secret));
    const captured = await capturedPromise;
    assert.equal(captured.outcome, 'completed');
    tracker.record('résultat', 'résultat_final', {
      outcome: 'completed', modelOutcome: 'completed', resultStatus: 'completed', deliveryStatus: 'not_requested',
    });
    assert.equal(JSON.parse(readFileSync(progressFile, 'utf8')).counters.toolErrors, 2);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('quota events distinguish allowed, warning, rejected, and unknown statuses', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'laffinee-claude-rate-state-test-'));
  const progressFile = claudeProgressPath(join(directory, 'result.json'));
  const phases = [
    { chunks: splitText(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { status: 'allowed' },
      detail: 'PRIVATE_ALLOWED_DETAIL' }) + '\n'), delay: 100 },
    { chunks: splitText(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { status: 'allowed_warning' },
      detail: 'PRIVATE_WARNING_DETAIL' }) + '\n'), delay: 100 },
    { chunks: splitText(JSON.stringify({ type: 'rate_limit_event', status: 'future_status',
      detail: 'PRIVATE_UNKNOWN_DETAIL' }) + '\n'), delay: 100 },
    { chunks: splitText(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { status: 'rejected' },
      detail: 'PRIVATE_REJECTED_DETAIL' }) + '\n'), delay: 100 },
    { chunks: splitText(JSON.stringify({ type: 'result', subtype: 'success', is_error: false,
      result: 'Completed', num_turns: 1 }) + '\n'), delay: 0 },
  ];
  try {
    const tracker = createClaudeProgressTracker(progressFile);
    const capturedPromise = captureClaudeProcess(fakeClaudeProcess(phases), tracker);
    const allowed = await waitForProgress(progressFile, state => state.lastEvent.category === 'allowed');
    assert.equal(allowed.status, 'information');
    const warning = await waitForProgress(progressFile, state => state.lastEvent.category === 'allowed_warning');
    assert.equal(warning.status, 'information');
    const unknown = await waitForProgress(progressFile, state => state.lastEvent.category === 'unknown');
    assert.equal(unknown.status, 'inconnu');
    const rejected = await waitForProgress(progressFile, state => state.lastEvent.category === 'rejected');
    assert.equal(rejected.status, 'erreur');
    for (const secret of ['PRIVATE_ALLOWED_DETAIL', 'PRIVATE_WARNING_DETAIL', 'PRIVATE_UNKNOWN_DETAIL', 'PRIVATE_REJECTED_DETAIL']) {
      assert(!readFileSync(progressFile, 'utf8').includes(secret));
    }
    assert.equal((await capturedPromise).outcome, 'completed');
    tracker.stopHeartbeat();
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('partial fragments are written at heartbeat frequency; important events flush immediately', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'laffinee-claude-throttle-test-'));
  const progressFile = claudeProgressPath(join(directory, 'result.json'));
  let tracker;
  try {
    tracker = createClaudeProgressTracker(progressFile);
    const before = readFileSync(progressFile, 'utf8');
    for (let index = 0; index < 1000; index++) tracker.activity();
    assert.equal(readFileSync(progressFile, 'utf8'), before);
    const batched = await waitForProgress(progressFile, state => state.lastEvent.type === 'fragment_de_réponse');
    assert.equal(batched.status, 'en_cours');
    tracker.record('outil', 'outil_démarré', { tool: 'Read', counters: 'reads' });
    const important = JSON.parse(readFileSync(progressFile, 'utf8'));
    assert.equal(important.lastEvent.type, 'outil_démarré');
    assert.equal(important.counters.reads, 1);
  } finally {
    tracker?.stopHeartbeat();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('file-report conflict keeps model completion but marks delivery failed', () => {
  const root = mkdtempSync(join(tmpdir(), 'laffinee-claude-report-root-'));
  const staged = mkdtempSync(join(tmpdir(), 'laffinee-claude-report-stage-'));
  const progressFile = claudeProgressPath(join(staged, 'progress.json'));
  const manifestPath = claudeRecoveryPath(join(staged, 'result.json'));
  let tracker;
  try {
    mkdirSync(join(root, 'src'));
    writeFileSync(join(root, 'src', 'PRIVATE_ORIGINAL.ts'), 'base');
    let sources = describeSources(root, ['src/PRIVATE_ORIGINAL.ts'], 'edit');
    stageSources(staged, sources);
    writeFileSync(join(staged, 'src', 'PRIVATE_ORIGINAL.ts'), 'PRIVATE_CLAUDE_EDIT');
    tracker = createClaudeProgressTracker(progressFile, { deliveryRequested: true });
    tracker.record('résultat', 'résultat_final', {
      outcome: 'completed', modelOutcome: 'completed', resultStatus: 'completed', deliveryStatus: 'pending',
    });
    assert.deepEqual(applyStagedEditsWithProgress(staged, sources, tracker), [join(root, 'src', 'PRIVATE_ORIGINAL.ts')]);
    let state = JSON.parse(readFileSync(progressFile, 'utf8'));
    assert.equal(state.modelOutcome, 'completed');
    assert.equal(state.deliveryStatus, 'completed');

    sources = describeSources(root, ['src/PRIVATE_ORIGINAL.ts'], 'edit');
    stageSources(staged, sources);
    writeFileSync(join(staged, 'src', 'PRIVATE_ORIGINAL.ts'), 'PRIVATE_SECOND_EDIT');
    writeFileSync(join(root, 'src', 'PRIVATE_ORIGINAL.ts'), 'PRIVATE_OTHER_AGENT_CHANGE');
    tracker.record('résultat', 'résultat_final', {
      outcome: 'completed', modelOutcome: 'completed', resultStatus: 'completed', deliveryStatus: 'pending',
    });
    assert.throws(() => applyStagedEditsWithProgress(staged, sources, tracker, manifestPath), error => error.message.includes('Conflit')
      && error.recovery?.manifestPath === manifestPath);
    state = JSON.parse(readFileSync(progressFile, 'utf8'));
    assert.equal(state.status, 'erreur');
    assert.equal(state.outcome, 'delivery_error');
    assert.equal(state.modelOutcome, 'completed');
    assert.equal(state.resultStatus, 'completed');
    assert.equal(state.deliveryStatus, 'failed');
    assert.equal(state.deliveryOutcome, 'conflict');
    assert.equal(state.lastEvent.type, 'report_fichiers_en_erreur');
    assert.equal(state.lastEvent.category, 'conflict');
    assert.equal(state.recovery.files[0].path, 'src/PRIVATE_ORIGINAL.ts');
    assert.equal(state.recovery.files[0].sourceDiffers, true);
    assert.equal(state.recovery.files[0].sourceStatus, 'changed');
    assert.equal(readFileSync(join(root, 'src', 'PRIVATE_ORIGINAL.ts'), 'utf8'), 'PRIVATE_OTHER_AGENT_CHANGE');
    const stateText = readFileSync(progressFile, 'utf8');
    const manifestText = readFileSync(manifestPath, 'utf8');
    for (const secret of ['PRIVATE_CLAUDE_EDIT', 'PRIVATE_SECOND_EDIT', 'PRIVATE_OTHER_AGENT_CHANGE']) {
      assert(!stateText.includes(secret));
      assert(!manifestText.includes(secret));
    }
  } finally {
    tracker?.stopHeartbeat();
    rmSync(root, { recursive: true, force: true });
    rmSync(staged, { recursive: true, force: true });
  }
});

test('recovery lists no change and records a missing staged copy without masking the first error', () => {
  const workspace = mkdtempSync(join(tmpdir(), 'laffinee-claude-recovery-missing-'));
  const root = join(workspace, 'repo');
  const staged = mkdtempSync(join(workspace, 'laffinee-claude-stage-'));
  const progressFile = claudeProgressPath(join(workspace, 'result.json'));
  const manifestPath = claudeRecoveryPath(join(workspace, 'result.json'));
  let tracker;
  try {
    mkdirSync(join(root, 'src'), { recursive: true });
    writeFileSync(join(root, 'src', 'page.ts'), 'unchanged source');
    const sources = describeSources(root, ['src/page.ts'], 'edit');
    stageSources(staged, sources);
    tracker = createClaudeProgressTracker(progressFile, { deliveryRequested: true });

    const unchanged = writeClaudeRecoveryManifest(manifestPath, staged, sources);
    assert.deepEqual(unchanged.files, []);
    assert.deepEqual(unchanged.unavailable, []);
    assert.equal(unchanged.manifestStatus, 'written');
    tracker.record('erreur', 'résultat_absent', { outcome: 'claude_error', recovery: unchanged });

    rmSync(join(staged, 'src', 'page.ts'));
    let originalError;
    try { applyStagedEditsWithProgress(staged, sources, tracker, manifestPath); }
    catch (error) { originalError = error; }
    assert.equal(originalError?.code, 'ENOENT');
    assert(originalError.message.includes('page.ts'));
    assert.deepEqual(originalError.recovery.unavailable, [{ path: 'src/page.ts', status: 'missing' }]);
    assert.deepEqual(originalError.recovery.files, []);
    const state = JSON.parse(readFileSync(progressFile, 'utf8'));
    assert.equal(state.outcome, 'delivery_error');
    assert.equal(state.deliveryStatus, 'failed');
    assert.equal(state.recovery.unavailable[0].status, 'missing');
    assert.equal(state.recovery.autoApplied, null);
    assert.equal(state.recovery.reportMayBePartial, true);
    assert.equal(readFileSync(join(root, 'src', 'page.ts'), 'utf8'), 'unchanged source');

    mkdirSync(join(staged, 'src', 'page.ts'));
    assert.deepEqual(inspectStagedChanges(staged, sources).unavailable, [{ path: 'src/page.ts', status: 'unreadable' }]);
  } finally {
    tracker?.stopHeartbeat();
    rmSync(workspace, { recursive: true, force: true });
    rmSync(staged, { recursive: true, force: true });
  }
});

test('recovery manifest and progress inventory stay bounded and contain metadata only', () => {
  const workspace = mkdtempSync(join(tmpdir(), 'laffinee-claude-recovery-bounds-'));
  const root = join(workspace, 'repo');
  const staged = mkdtempSync(join(workspace, 'laffinee-claude-stage-'));
  const progressFile = claudeProgressPath(join(workspace, 'result.json'));
  const manifestPath = claudeRecoveryPath(join(workspace, 'result.json'));
  let tracker;
  try {
    mkdirSync(join(root, 'src'), { recursive: true });
    const paths = Array.from({ length: 12 }, (_, index) => `src/file-${String(index).padStart(2, '0')}.html`);
    const sources = paths.flatMap(path => {
      writeFileSync(join(root, path), 'initial');
      return describeSources(root, [path], 'edit');
    });
    stageSources(staged, sources);
    sources.forEach((file, index) => writeFileSync(join(staged, file.staged), `PRIVATE_CONTENT_${index}`));
    tracker = createClaudeProgressTracker(progressFile, { deliveryRequested: true });
    const recovery = writeClaudeRecoveryManifest(manifestPath, staged, sources);
    tracker.record('erreur', 'résultat_final', {
      outcome: 'turn_budget_reached', modelOutcome: 'turn_budget_reached', resultStatus: 'completed',
      deliveryStatus: 'not_attempted', recovery,
    });

    const manifestText = readFileSync(manifestPath, 'utf8');
    const stateText = readFileSync(progressFile, 'utf8');
    assert(manifestText.length < 16 * 1024);
    assert(stateText.length < 16 * 1024);
    assert.equal(JSON.parse(manifestText).files.length, 12);
    assert.equal(JSON.parse(stateText).recovery.files.length, 12);
    for (let index = 0; index < 12; index++) {
      const secret = `PRIVATE_CONTENT_${index}`;
      assert(!manifestText.includes(secret));
      assert(!stateText.includes(secret));
    }
  } finally {
    tracker?.stopHeartbeat();
    rmSync(workspace, { recursive: true, force: true });
    rmSync(staged, { recursive: true, force: true });
  }
});

test('missing final event yields a valid error JSON and bounded public state', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'laffinee-claude-empty-test-'));
  const output = join(directory, 'result.json');
  const progressFile = claudeProgressPath(output);
  try {
    const tracker = createClaudeProgressTracker(progressFile);
    const child = fakeClaudeProcess([
      { chunks: splitText(JSON.stringify({ type: 'system', subtype: 'init', text: 'PRIVATE_INIT_TEXT' }) + '\n'), delay: 100 },
    ], { stderr: 'PRIVATE_AUTH_TOKEN; PRIVATE diagnostic', exitCode: 1 });
    const capturedPromise = captureClaudeProcess(child, tracker);
    const initialized = await waitForProgress(progressFile, state => state.lastEvent.type === 'initialisation');
    assert.equal(initialized.status, 'attente');
    assert(!readFileSync(progressFile, 'utf8').includes('PRIVATE_INIT_TEXT'));
    const captured = await capturedPromise;
    assert.equal(captured.receivedFinalResult, false);
    assert.equal(captured.outcome, 'claude_error');
    writeFileSync(output, captured.finalJson, 'utf8');
    const response = JSON.parse(readFileSync(output, 'utf8'));
    assert.equal(response.type, 'result');
    assert.equal(response.subtype, 'error_cli_stream');
    assert.equal(response.is_error, true);
    assert.equal(response.result, 'Aucun résultat final reçu.');
    tracker.record('erreur', 'résultat_absent', {
      outcome: captured.outcome, modelOutcome: captured.outcome, resultStatus: 'completed', deliveryStatus: 'not_requested',
    });
    const stateText = readFileSync(progressFile, 'utf8');
    const state = JSON.parse(stateText);
    assert.equal(state.lastEvent.type, 'résultat_absent');
    assert.equal(state.outcome, 'claude_error');
    assert(!stateText.includes('PRIVATE_AUTH_TOKEN'));
    assert(!stateText.includes('PRIVATE_INIT_TEXT'));
    assert(stateText.length < 2048);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
test('Luna batches are bounded to nine unique, concrete missions', () => {
  const tasks = Array.from({ length: 9 }, (_, i) => ({ id: `task-${i}`, prompt: 'Verify a defined contract.' }));
  assert.equal(validateTasks(tasks).length, 9);
  assert.throws(() => validateTasks([...tasks, { id: 'tenth', prompt: 'Too many' }]));
  assert.throws(() => validateTasks([tasks[0], tasks[0]]));
  assert.throws(() => validateTasks([{ id: '../escape', prompt: 'No' }]));
  assert.throws(() => validateTasks([{ id: 'empty', prompt: ' ' }]));
});

test('overlapping Claude relay invocations cannot multiply the nine Luna slots', () => {
  const directory = mkdtempSync(join(tmpdir(), 'laffinee-luna-lock-test-'));
  const lock = join(directory, 'wave.lock');
  let release = acquireLunaBatch(lock);
  try {
    assert.throws(() => acquireLunaBatch(lock), /déjà active/);
    release();
    release = acquireLunaBatch(lock);
    assert.throws(() => acquireLunaBatch(lock), /déjà active/);
  } finally { release(); rmdirSync(directory); }
});

test('Luna uses its full host window and explicit Max, independently of Astra', () => {
  const args = lunaArguments(process.cwd(), 'result.md', 872000);
  assert(args.includes('gpt-6-luna')); assert(args.includes('model_context_window=872000'));
  assert(args.includes('model_reasoning_effort="max"')); assert(args.includes('agents.enabled=false'));
  assert(args.includes('read-only')); assert(!args.includes('272000'));
  assert.throws(() => lunaArguments(process.cwd(), 'result.md', undefined));
});
