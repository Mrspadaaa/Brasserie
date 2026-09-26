import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { claudeArguments, parseLauncherOptions, captureClaudeProcess, createClaudeProgressTracker, describeSources, stageSources, applyStagedEdits, applyStagedEditsWithProgress } from './claude-frontend.mjs';
import { createClaudeArchive, assertFreshClaudeOutput } from './claude-artifacts.mjs';
import { validateExpertResponse, expertInstructions, resolveSolThread, transferExpertTasks } from './claude-expert-contract.mjs';

const sol = '01a0de88-b523-7ff2-9b56-5db26cfd0f55';
const advice = () => ({ status: 'advice_ready', decision: 'Conserver le même Sol.', reasons: 'Il possède la mission.',
  evidence: ['Contrat de mission vérifié'], openQuestions: [], tasksForSol: [], reconsultWhen: 'Nouvelle contradiction établie.' });

test('a caller cannot redirect the return to another Sol', () => {
  assert.equal(resolveSolThread(undefined, sol), sol);
  assert.equal(resolveSolThread(sol, sol), sol);
  assert.throws(() => resolveSolThread('01a0de88-b523-7ff2-9b56-000000000000', sol), /Sol appelant/);
  assert.throws(() => resolveSolThread(undefined, undefined), /Sol existant/);
});

test('an invalid task is retained and does not discard subsequent handoffs', async () => {
  const good = { objective: 'Vérifier', mode: 'review', ownedFiles: [], checks: ['Preuve attendue'] };
  const expertRecord = { solThread: sol, handoffs: [], tasksForSol: [
    { ...good, ownedFiles: ['C:/outside.ts'] },
    { ...good, checks: Array(17).fill('test') }, good,
  ] };
  const snapshots = [];
  let calls = 0;
  await transferExpertTasks({ expertRecord, cwd: process.cwd(), outputDir: 'unused', sourceArtifacts: [],
    save: record => snapshots.push(structuredClone(record)),
    create: async options => { calls++; assert.equal(options.delivery, 'returned_to_parent'); assert.equal(options.targetThreadId, sol);
      return { requestDir: 'durable', requestId: 'request', deliveryStatus: 'returned_to_parent', workStatus: 'pending' }; },
  });
  assert.equal(calls, 1);
  assert.equal(expertRecord.tasksForSol.length, 3);
  assert.equal(expertRecord.handoffErrors.length, 2);
  assert.equal(expertRecord.handoffs[0].taskIndex, 2);
  assert.equal(expertRecord.transferStatus, 'incomplete');
  assert.equal(snapshots.length, 3);
});

test('expert cannot turn transport success or blocked text into valid advice', () => {
  assert.throws(() => validateExpertResponse(undefined));
  assert.throws(() => validateExpertResponse({ result: 'Bloqué : preuves absentes', is_error: false }));
  assert.throws(() => validateExpertResponse({ ...advice(), evidence: [] }), /preuve/);
  assert.throws(() => validateExpertResponse({ ...advice(), status: 'needs_sol' }), /incohérents/);
  assert.throws(() => validateExpertResponse({ ...advice(), status: 'blocked' }), /question/);
  assert.equal(validateExpertResponse({ ...advice(), status: 'blocked', openQuestions: ['Fixture manquante'] }).status, 'blocked');
  const task = { objective: 'Vérifier un invariant', mode: 'review', ownedFiles: [], checks: ['Résultat du test ciblé'] };
  assert.equal(validateExpertResponse({ ...advice(), status: 'needs_sol', tasksForSol: [task] }).status, 'needs_sol');
  assert.throws(() => validateExpertResponse({ ...advice(), status: 'needs_sol', tasksForSol: [{ ...task, mode: 'implement' }] }), /périmètre/);
});

test('expert uses the same subscription model, a structured contract and native persistence', () => {
  const args = claudeArguments({ expert: true });
  assert.equal(args[args.indexOf('--model') + 1], 'claude-opus-5-5');
  assert.equal(args[args.indexOf('--effort') + 1], 'xhigh');
  assert.ok(args.includes('--safe-mode') && args.includes('--restricted'));
  assert.ok(args.includes('--json-schema'));
  assert.ok(!args.includes('--no-session-persistence'));
  assert.equal(args[args.indexOf('--tools') + 1], '');
  assert.ok(expertInstructions(sol).includes(sol));
  assert.throws(() => expertInstructions(''), /Sol existant/);
  assert.equal(parseLauncherOptions(['--expert', '--mode', 'edit', '--brief', 'b', '--output', 'o']).mode, 'edit');
  assert.ok(expertInstructions(sol, 'edit').includes('réalisation du lot complet'));
  const lot = claudeArguments({ expert: true, mode: 'edit', files: Array.from({ length: 20 }, (_, i) => `src/lot/file-${i}.tsx`) });
  assert.equal(lot[lot.indexOf('--tools') + 1], 'Read,Edit,Write');
  assert.ok(lot.includes('Edit(./src/lot/file-19.tsx)'));
  assert.ok(lot.includes('--json-schema'));
});

test('fresh archive keeps originals separately and refuses overwrite on success or retry', () => {
  const root = mkdtempSync(join(tmpdir(), 'affinee-expert-archive-'));
  try {
    const source = join(root, 'input.txt');
    const output = join(root, 'consultation.json');
    writeFileSync(source, 'original irremplaçable');
    const sources = describeSources(root, ['input.txt']);
    const archive = createClaudeArchive({ output, brief: 'Décision', sources, sourceCwd: root, configured: { solThread: sol } });
    writeFileSync(join(archive.workspace, 'input.txt'), 'production Claude');
    assert.equal(readFileSync(join(archive.root, 'inputs/input.txt'), 'utf8'), 'original irremplaçable');
    assert.throws(() => createClaudeArchive({ output, brief: 'suite', sources, sourceCwd: root, configured: {} }), /déjà utilisée/);
    assert.equal(readFileSync(join(archive.workspace, 'input.txt'), 'utf8'), 'production Claude');
    assert.ok(existsSync(join(archive.root, 'brief.txt')));
    writeFileSync(join(root, 'existing.json'), 'ancien résultat');
    assert.throws(() => assertFreshClaudeOutput(join(root, 'existing.json')), /déjà utilisée/);
  } finally { assert.ok(resolve(root).startsWith(resolve(tmpdir()))); rmSync(root, { recursive: true, force: true }); }
});

test('a complete twenty-file frontend lot is staged, reported and preserved', () => {
  const root = mkdtempSync(join(tmpdir(), 'affinee-frontend-lot-'));
  try {
    mkdirSync(join(root, 'src'));
    const files = Array.from({ length: 20 }, (_, i) => `src/View${i}.tsx`);
    for (const file of files) writeFileSync(join(root, file), ''); // Planned new files owned by this lot.
    const sources = describeSources(root, files, 'edit');
    const archive = createClaudeArchive({ output: join(root, 'lot.json'), brief: 'Lot frontend complet', sources, sourceCwd: root, configured: {} });
    stageSources(archive.workspace, sources);
    for (const [index, file] of files.entries()) writeFileSync(join(archive.workspace, file), `export const View${index} = () => <main>Vue ${index}</main>;`);
    const changed = applyStagedEdits(archive.workspace, sources);
    assert.equal(changed.length, 20);
    for (const [index, file] of files.entries()) {
      assert.ok(readFileSync(join(root, file), 'utf8').includes(`Vue ${index}`));
      assert.equal(readFileSync(join(archive.root, 'inputs', file), 'utf8'), '');
      assert.ok(existsSync(join(archive.workspace, file)));
    }
  } finally { assert.ok(resolve(root).startsWith(resolve(tmpdir()))); rmSync(root, { recursive: true, force: true }); }
});

test('a blocked frontend lot keeps its draft without reporting it to source files', () => {
  const root = mkdtempSync(join(tmpdir(), 'affinee-blocked-lot-'));
  const progress = join(root, 'progress.json');
  const recoveryPath = join(root, 'recovery.json');
  const tracker = createClaudeProgressTracker(progress, { deliveryRequested: true });
  try {
    writeFileSync(join(root, 'View.tsx'), 'original');
    const sources = describeSources(root, ['View.tsx'], 'edit');
    const archive = createClaudeArchive({ output: join(root, 'lot.json'), brief: 'Lot', sources, sourceCwd: root, configured: {} });
    stageSources(archive.workspace, sources);
    writeFileSync(join(archive.workspace, 'View.tsx'), 'brouillon à conserver');
    const result = applyStagedEditsWithProgress(archive.workspace, sources, tracker, recoveryPath, { expertStatus: 'blocked' });
    assert.deepEqual(result, []);
    assert.equal(readFileSync(join(root, 'View.tsx'), 'utf8'), 'original');
    assert.equal(readFileSync(join(archive.workspace, 'View.tsx'), 'utf8'), 'brouillon à conserver');
    assert.equal(JSON.parse(readFileSync(progress, 'utf8')).deliveryStatus, 'not_attempted');
    const recovery = JSON.parse(readFileSync(recoveryPath, 'utf8'));
    assert.equal(recovery.autoApplied, false);
    assert.equal(recovery.validated, false);
    assert.equal(recovery.files.length, 1);
  } finally { tracker.stopHeartbeat(); assert.ok(resolve(root).startsWith(resolve(tmpdir()))); rmSync(root, { recursive: true, force: true }); }
});

test('interrupted Claude stream preserves partial text and session identity without a final answer', async () => {
  const root = mkdtempSync(join(tmpdir(), 'affinee-expert-stream-'));
  const transcriptPath = join(root, 'transcript.jsonl');
  const tracker = createClaudeProgressTracker(join(root, 'progress.json'));
  try {
    const init = JSON.stringify({ type: 'system', subtype: 'init', session_id: 'claude-session' });
    const partial = JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'Diagnostic partiel à conserver' }] } });
    const chunk = `${init}\n${partial}\n`;
    const child = spawn(process.execPath, ['-e', `process.stdout.write(${JSON.stringify(chunk)});process.exitCode=1;`], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const result = await captureClaudeProcess(child, tracker, { transcriptPath });
    assert.equal(result.outcome, 'claude_error');
    assert.equal(result.receivedFinalResult, false);
    assert.equal(result.nativeSessionId, 'claude-session');
    assert.equal(readFileSync(transcriptPath, 'utf8'), chunk);
    assert.ok(existsSync(transcriptPath));
  } finally { tracker.stopHeartbeat(); assert.ok(resolve(root).startsWith(resolve(tmpdir()))); rmSync(root, { recursive: true, force: true }); }
});
