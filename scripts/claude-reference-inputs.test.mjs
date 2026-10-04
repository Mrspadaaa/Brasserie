import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import * as bridge from './claude-frontend.mjs';
import { createClaudeArchive } from './claude-artifacts.mjs';

const digest = value => createHash('sha256').update(value).digest('hex');
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'laffinee-claude-reference-'));
  t.after(() => {
    assert.equal(dirname(resolve(root)), resolve(tmpdir()));
    assert(root.includes('laffinee-claude-reference-'));
    rmSync(root, { recursive: true, force: true });
  });
  const put = (path, text) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  put('src/reader.ts', 'export const oldReader = true;\n');
  put('references/recovered.txt', 'Copie partielle entière — poire, douceur.\n');
  put('brief.txt', 'Terminer la copie fournie, sans refaire le travail.');
  return { root, put };
}
function options(root, extra = []) {
  return bridge.parseLauncherOptions(['--cwd', root, '--mode', 'edit', '--brief', join(root, 'brief.txt'),
    '--output', join(root, 'result.json'), '--allow-file', 'src/reader.ts',
    '--reference-file', 'references/recovered.txt', ...extra]);
}
const permissionArgs = (args, flag) => {
  const start = args.indexOf(flag) + 1;
  const end = args.findIndex((value, index) => index >= start && value.startsWith('--'));
  return args.slice(start, end < 0 ? undefined : end);
};

test('explicit readonly inputs reach the same preflight manifest, archive and restricted workspace', t => {
  const { root } = fixture(t);
  const parsed = options(root);
  const input = bridge.prepareClaudeInputs(parsed);
  assert.deepEqual(input.files, ['src/reader.ts']);
  assert.deepEqual(input.referenceFiles, ['references/recovered.txt']);
  const original = readFileSync(join(root, 'references/recovered.txt'));
  const reference = input.manifest.find(file => file.staged === 'references/recovered.txt');
  assert.equal(reference.readOnly, true);
  assert.equal(reference.sha256, digest(original));
  assert.equal(reference.size, original.length);
  const archive = createClaudeArchive({ output: parsed.output, brief: 'Continuer', sources: input.sources,
    sourceCwd: root, configured: { accountProfile: 'team' } });
  bridge.stageSources(archive.workspace, input.sources);
  assert.deepEqual(readFileSync(join(archive.workspace, reference.staged)), original);
  assert.deepEqual(JSON.parse(readFileSync(join(archive.root, 'request.json'))).sources, input.manifest);
  const args = bridge.claudeArguments({ mode: 'edit', files: input.files, referenceFiles: input.referenceFiles });
  assert.deepEqual(permissionArgs(args, '--allowedTools'), ['Read', 'Edit(./src/reader.ts)']);
  assert(permissionArgs(args, '--disallowedTools').includes('Edit(./references/recovered.txt)'));
  assert(args.includes('--restricted'));
  assert.equal(args[args.indexOf('--model') + 1], 'claude-opus-5-5');
  assert.equal(args[args.indexOf('--effort') + 1], 'xhigh');
  writeFileSync(join(archive.workspace, 'src/reader.ts'), 'export const completed = true;\n');
  assert.deepEqual(bridge.applyStagedEdits(archive.workspace, input.sources), [join(root, 'src/reader.ts')]);
  assert.deepEqual(readFileSync(join(root, reference.staged)), original);
  assert.deepEqual(readFileSync(join(archive.root, 'inputs', reference.staged)), original);
});

test('a modified readonly copy refuses publication before any editable file is reported', t => {
  const { root } = fixture(t);
  const input = bridge.prepareClaudeInputs(options(root));
  const workspace = join(root, 'workspace');
  bridge.stageSources(workspace, input.sources);
  const initial = readFileSync(join(root, 'src/reader.ts'));
  const originalReference = readFileSync(join(root, 'references/recovered.txt'));
  writeFileSync(join(workspace, 'src/reader.ts'), 'pending edit');
  writeFileSync(join(workspace, 'references/recovered.txt'), 'unauthorized reference change');
  assert.throws(() => bridge.applyStagedEdits(workspace, input.sources), /Conflit.*lecture seule/);
  assert.deepEqual(readFileSync(join(root, 'src/reader.ts')), initial);
  assert.deepEqual(readFileSync(join(root, 'references/recovered.txt')), originalReference);
  const recovered = bridge.inspectStagedChanges(workspace, input.sources);
  assert.equal(recovered.files.find(file => file.path === 'references/recovered.txt').readOnly, true);
  const progressFile = join(root, 'progress.json');
  const tracker = bridge.createClaudeProgressTracker(progressFile, { deliveryRequested: true });
  try {
    assert.throws(() => bridge.applyStagedEditsWithProgress(workspace, input.sources, tracker, join(root, 'recovery.json')),
      /Conflit.*lecture seule/);
    const progress = JSON.parse(readFileSync(progressFile, 'utf8'));
    assert.equal(progress.deliveryOutcome, 'conflict');
    assert.equal(progress.recovery.reportMayBePartial, false);
    assert.equal(progress.recovery.files.find(file => file.path === 'references/recovered.txt').readOnly, true);
    assert.deepEqual(readFileSync(join(root, 'src/reader.ts')), initial);
  } finally { tracker.stopHeartbeat(); }
});

test('readonly inputs cannot alias editable files, overwrite another staged path or bypass shared limits', t => {
  const { root, put } = fixture(t);
  assert.throws(() => bridge.prepareClaudeInputs(options(root, ['--reference-file', './src/reader.ts'])), /répété/);
  assert.throws(() => bridge.parseLauncherOptions(['--brief', 'b', '--output', 'o',
    ...Array.from({ length: bridge.MAX_FILES + 1 }, (_, i) => ['--reference-file', `ref${i}`]).flat()]), /Au plus 128/);
  put('references/too-big.txt', 'x'.repeat(128 * 1024 + 1));
  assert.throws(() => bridge.prepareClaudeInputs(options(root, ['--reference-file', 'references/too-big.txt'])), /Fichier trop gros/);
  assert.throws(() => bridge.prepareClaudeInputs(options(root, ['--reference-file', '../escape.txt'])), /hors du dossier/);
  // An absolute readonly attachment may be outside cwd, but cannot collide with a working file.
  put('nested/attachments/02-recovered.txt', 'working input');
  assert.throws(() => bridge.describeSources(join(root, 'nested'), ['attachments/02-recovered.txt'], 'edit',
    [join(root, 'references/recovered.txt')]), /Destination.*répétée/);
});

test('a references-only review has Read and no editing grant; references-only edit is refused', t => {
  const { root } = fixture(t);
  const parsed = bridge.parseLauncherOptions(['--cwd', root, '--brief', join(root, 'brief.txt'),
    '--output', join(root, 'result.json'), '--reference-file', 'references/recovered.txt']);
  const input = bridge.prepareClaudeInputs(parsed);
  const args = bridge.claudeArguments({ mode: 'review', files: input.files, referenceFiles: input.referenceFiles });
  assert.equal(args[args.indexOf('--tools') + 1], 'Read');
  assert.deepEqual(permissionArgs(args, '--allowedTools'), ['Read']);
  assert.throws(() => bridge.prepareClaudeInputs({ ...parsed, mode: 'edit' }), /liste explicite/);
});
