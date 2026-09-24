import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmdirSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { applyStagedEdits, checkedOutputPath, claudeArguments, classifyClaudeOutcome, describeSources,
  lunaRelayCommand, MAX_BRIEF_BYTES, parseLauncherOptions, readBrief, stageSources,
  subscriptionEnvironment, subscriptionStatus } from './claude-frontend.mjs';
import { acquireLunaBatch, lunaArguments, validateTasks } from './luna-review.mjs';

test('Claude uses native subscription credentials, with Max effort isolated to child', () => {
  const original = { PATH: 'native', ANTHROPIC_API_KEY: 'test-key', ANTHROPIC_AUTH_TOKEN: 'test-token',
    ANTHROPIC_BASE_URL: 'https://example.invalid', ANTHROPIC_AWS_API_KEY: 'test-aws-key',
    CLAUDE_CODE_USE_VERTEX: '1', CLAUDE_CODE_USE_ANTHROPIC_AWS: '1', CLAUDE_CODE_SIMPLE: '1',
    anthropic_api_key: 'lower-case-key',
    CLAUDE_CODE_EFFORT_LEVEL: 'low' };
  const env = subscriptionEnvironment(original);
  assert.equal(env.PATH, 'native'); assert.equal(env.CLAUDE_CODE_EFFORT_LEVEL, 'max');
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

test('review defaults to four turns and no tools when the brief is self-contained', () => {
  const args = claudeArguments();
  assert(args.includes('--safe-mode'));
  assert(args.includes('--restricted'));
  assert(args.includes('claude-opus-5-5'));
  assert.equal(args[args.indexOf('--effort') + 1], 'max');
  assert.equal(args[args.indexOf('--tools') + 1], '');
  assert.equal(args[args.indexOf('--max-turns') + 1], '4');
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
  assert.equal(args[args.indexOf('--max-turns') + 1], '12');
});

test('Luna remains opt-in inside one Claude consultation, with one exact relay command', () => {
  const command = lunaRelayCommand(process.cwd(), join(tmpdir(), 'claude-stage'));
  const args = claudeArguments({ files: ['screen.png'], luna: true, relayCommand: command });
  assert.equal(args[args.indexOf('--tools') + 1], 'Read,Write,Bash');
  assert(args.includes('Read'));
  assert(args.includes('Edit(./luna-tasks.json)'));
  assert(args.includes('Bash(' + command + ')'));
  assert(!args.some(arg => arg === 'Bash(node scripts/luna-review.mjs *)'));
  assert.throws(() => claudeArguments({ luna: true }), /Commande Luna/);
});

test('launcher parses real arguments and refuses malformed turn budgets', () => {
  const basic = parseLauncherOptions(['--brief', 'b.txt', '--output', 'r.json']);
  assert.equal(basic.mode, 'review');
  assert.equal(basic.maxTurns, 4);
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
    ...Array.from({ length: 13 }, (_, i) => ['--allow-file', String(i)]).flat()]), /Au plus 12/);
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
