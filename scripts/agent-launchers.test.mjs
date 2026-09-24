import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { claudeArguments, subscriptionEnvironment, subscriptionStatus } from './claude-frontend.mjs';
import { acquireLunaBatch, lunaArguments, validateTasks } from './luna-review.mjs';

test('Claude uses native subscription credentials, with Max effort isolated to child', () => {
  const original = { PATH: 'native', ANTHROPIC_API_KEY: 'test-key', ANTHROPIC_AUTH_TOKEN: 'test-token', ANTHROPIC_BASE_URL: 'https://example.invalid', CLAUDE_CODE_USE_VERTEX: '1', CLAUDE_CODE_EFFORT_LEVEL: 'low' };
  const env = subscriptionEnvironment(original);
  assert.equal(env.PATH, 'native'); assert.equal(env.CLAUDE_CODE_EFFORT_LEVEL, 'max');
  assert.equal(env.ANTHROPIC_API_KEY, undefined); assert.equal(env.ANTHROPIC_AUTH_TOKEN, undefined);
  assert.equal(env.ANTHROPIC_BASE_URL, undefined); assert.equal(env.CLAUDE_CODE_USE_VERTEX, undefined);
  assert.equal(original.ANTHROPIC_API_KEY, 'test-key');
});

test('API authentication cannot silently stand in for a Pro subscription', () => {
  const pro = { loggedIn: true, authMethod: 'claude.ai', subscriptionType: 'pro', apiProvider: 'firstParty', apiKeySource: null };
  assert.equal(subscriptionStatus(pro).subscriptionType, 'pro');
  for (const patch of [{ loggedIn: false }, { authMethod: 'apiKey' }, { apiKeySource: 'environment' }, { apiProvider: 'bedrock' }, { subscriptionType: null }]) {
    assert.throws(() => subscriptionStatus({ ...pro, ...patch }));
  }
});

test('Claude review excludes modification tools, imported customizations and model fallback', () => {
  const args = claudeArguments({ cwd: process.cwd() });
  assert(args.includes('--safe-mode')); assert(args.includes('claude-opus-5-5'));
  assert.equal(args[args.indexOf('--effort') + 1], 'max');
  assert.equal(args[args.indexOf('--tools') + 1], 'Read,Glob,Grep');
  assert(!args.includes('--fallback-model')); assert(!args.includes('--bare')); assert(!args.includes('--max-turns'));
});

test('Claude changes require explicitly bounded files and Luna is opt-in', () => {
  assert.throws(() => claudeArguments({ cwd: process.cwd(), mode: 'edit' }));
  for (const file of ['../outside.ts', 'src/*.tsx', 'src/file)']) assert.throws(() => claudeArguments({ cwd: process.cwd(), mode: 'edit', files: [file] }));
  const args = claudeArguments({ cwd: process.cwd(), mode: 'edit', files: ['src/ui/test.tsx'], luna: true });
  assert(args.includes('Edit(./src/ui/test.tsx)')); assert(args.includes('Write(./src/ui/test.tsx)'));
  assert(args.includes('Bash(node scripts/luna-review.mjs *)'));
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
