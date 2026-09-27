import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import {
  AGENT_INSTRUCTION_MAP,
  main,
  replaceDeveloperInstructions,
  syncAgentInstructions,
} from './sync-agent-instructions.mjs';

const EXPECTED_MAP = [
  { source: '.agents/roles/sol.md', targets: ['.codex/agents/sol.toml', '.codex/profiles/sol-full.config.toml'] },
  { source: '.agents/roles/luna.md', targets: ['.codex/agents/luna.toml', '.codex/profiles/luna-full.config.toml'] },
  { source: '.agents/roles/astra.md', targets: ['.codex/profiles/astra-review.config.toml'] },
];

const FIXTURE_TOML = [
  '# Preserve this comment: "quoted" and C:\\fixtures\r\n',
  'name = "fixture \\"name\\""\r\n',
  'model = "gpt-test"\r\n',
  'model_reasoning_effort = "max"\r\n',
  'model_context_window = 872000\r\n',
  'approval_policy = "never"\r\n',
  'sandbox_mode = "read-only"\r\n',
  'auth_profile = "fixture-auth"\r\n',
  'developer_instructions = """old content"""\r\n',
  '[agents]\r\n',
  'enabled = false\r\n',
  'note = "suffix stays byte-for-byte"\r\n',
].join('');

function makeWorkspace(t, { omitSource, sourceOverrides = {}, targetOverrides = {} } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'agent-instruction-sync-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  for (const { source, targets } of EXPECTED_MAP) {
    if (source !== omitSource) {
      const sourcePath = resolve(root, source);
      mkdirSync(dirname(sourcePath), { recursive: true });
      writeFileSync(sourcePath, sourceOverrides[source] ?? `# Instructions pour ${source}\n\nConserver le rôle ${source}.\n`, 'utf8');
    }

    for (const target of targets) {
      const targetPath = resolve(root, target);
      mkdirSync(dirname(targetPath), { recursive: true });
      writeFileSync(targetPath, targetOverrides[target] ?? FIXTURE_TOML, 'utf8');
    }
  }

  return root;
}

function allTargets() {
  return EXPECTED_MAP.flatMap(({ targets }) => targets);
}

function snapshotTargets(root) {
  return new Map(allTargets().map((path) => [path, readFileSync(resolve(root, path))]));
}

function makeInstalledProfiles(t, { omitProfile } = {}) {
  const installedRoot = mkdtempSync(join(tmpdir(), 'installed profiles-'));
  t.after(() => rmSync(installedRoot, { recursive: true, force: true }));

  for (const profile of ['sol-full.config.toml', 'luna-full.config.toml', 'astra-review.config.toml']) {
    if (profile !== omitProfile) writeFileSync(resolve(installedRoot, profile), FIXTURE_TOML, 'utf8');
  }

  return installedRoot;
}

function snapshotInstalledProfiles(installedRoot) {
  const profiles = ['sol-full.config.toml', 'luna-full.config.toml', 'astra-review.config.toml'];
  return new Map(profiles
    .filter((profile) => {
      try {
        readFileSync(resolve(installedRoot, profile));
        return true;
      } catch {
        return false;
      }
    })
    .map((profile) => [profile, readFileSync(resolve(installedRoot, profile))]));
}

test('uses only the fixed Sol, Luna, and Astra source-to-target mapping', () => {
  assert.deepEqual(AGENT_INSTRUCTION_MAP, EXPECTED_MAP);
});

test('default check reports drift and leaves every target byte unchanged', (t) => {
  const root = makeWorkspace(t);
  const before = snapshotTargets(root);
  const output = [];
  const errors = [];

  const exitCode = main([], {
    root,
    stdout: (message) => output.push(message),
    stderr: (message) => errors.push(message),
  });

  assert.equal(exitCode, 1);
  assert.deepEqual(errors, []);
  assert.match(output[0], /^Désynchronisées : /);
  assert.deepEqual(snapshotTargets(root), before);
});

test('--write synchronizes every mapped block and is idempotent', (t) => {
  const root = makeWorkspace(t);
  const output = [];

  assert.equal(main(['--write'], { root, stdout: (message) => output.push(message), stderr() {} }), 0);
  assert.match(output[0], /^Mises à jour : /);

  for (const { source, targets } of EXPECTED_MAP) {
    const markdown = readFileSync(resolve(root, source), 'utf8');
    for (const target of targets) {
      const toml = readFileSync(resolve(root, target), 'utf8');
      assert.ok(toml.includes(`# Generated from ${source} by scripts/sync-agent-instructions.mjs.\r\n`));
      assert.ok(toml.includes('developer_instructions = """# Instructions'));
      assert.ok(toml.includes(markdown.slice(0, -1)));
    }
  }

  const afterFirstWrite = snapshotTargets(root);
  const secondRun = syncAgentInstructions({ root, write: true });
  assert.deepEqual(secondRun, { changedFiles: [], writtenFiles: [] });
  assert.deepEqual(snapshotTargets(root), afterFirstWrite);
});

test('escapes Markdown quotes, backslashes, leading newline, and control characters', (t) => {
  const specialMarkdown = '\nDébit "nom" et triple """; chemin C:\\ferme\r\ndeveloper_instructions = """fixture"""\nTab\tcontrol\u0001\u0085fin\n';
  const root = makeWorkspace(t, {
    sourceOverrides: { '.agents/roles/sol.md': specialMarkdown },
  });

  syncAgentInstructions({ root, write: true });
  const toml = readFileSync(resolve(root, '.codex/agents/sol.toml'), 'utf8');

  assert.ok(toml.includes('developer_instructions = """\\nDébit \\"nom\\" et triple \\"\\"\\"; chemin C:\\\\ferme\\r\n'));
  const embeddedAssignment = String.raw`developer_instructions = \"\"\"fixture\"\"\"`;
  assert.ok(toml.includes(`${embeddedAssignment}\nTab\\tcontrol\\u0001\\u0085fin\n"""`));
  assert.doesNotMatch(toml, /[\u0001\u0085]/);
  assert.deepEqual(syncAgentInstructions({ root, write: true }).changedFiles, []);
});

test('preserves unrelated model, effort, window, permission, and auth fields byte-for-byte', (t) => {
  const root = makeWorkspace(t);
  const target = '.codex/agents/sol.toml';
  const before = readFileSync(resolve(root, target), 'utf8');
  const source = '.agents/roles/sol.md';

  syncAgentInstructions({ root, write: true });
  const after = readFileSync(resolve(root, target), 'utf8');
  const generatedComment = `# Generated from ${source} by scripts/sync-agent-instructions.mjs.\r\n`;
  const generatedValue = `"""# Instructions pour ${source}\n\nConserver le rôle ${source}.\n"""`;
  const restored = after
    .replace(generatedComment, '')
    .replace(generatedValue, '"""old content"""');

  assert.equal(restored, before);
});

test('rejects missing or empty sources before writing any target', (t) => {
  const missingRoot = makeWorkspace(t, { omitSource: '.agents/roles/astra.md' });
  const missingBefore = snapshotTargets(missingRoot);
  assert.throws(() => syncAgentInstructions({ root: missingRoot, write: true }), /Lecture impossible.*\.agents\/roles\/astra\.md/);
  assert.deepEqual(snapshotTargets(missingRoot), missingBefore);

  const emptyRoot = makeWorkspace(t, {
    sourceOverrides: { '.agents/roles/luna.md': ' \r\n\t' },
  });
  const emptyBefore = snapshotTargets(emptyRoot);
  assert.throws(() => syncAgentInstructions({ root: emptyRoot, write: true }), /source \.agents\/roles\/luna\.md est vide/);
  assert.deepEqual(snapshotTargets(emptyRoot), emptyBefore);
});

test('rejects absent and ambiguous developer_instructions blocks', () => {
  assert.throws(
    () => replaceDeveloperInstructions('name = "fixture"\n', '# Source\n', '.codex/agents/sol.toml', '.agents/roles/sol.md'),
    /exactement un bloc developer_instructions.*trouvé : 0/,
  );

  const duplicate = [
    'developer_instructions = """first"""\n',
    'developer_instructions = """second"""\n',
  ].join('');
  assert.throws(
    () => replaceDeveloperInstructions(duplicate, '# Source\n', '.codex/agents/sol.toml', '.agents/roles/sol.md'),
    /exactement un bloc developer_instructions.*trouvé : 2/,
  );
});

test('validates every target before writing, so an invalid block cannot leave a partial sync', (t) => {
  const brokenTarget = '.codex/profiles/astra-review.config.toml';
  const root = makeWorkspace(t, {
    targetOverrides: { [brokenTarget]: 'name = "fixture"\n' },
  });
  const before = snapshotTargets(root);

  assert.throws(() => syncAgentInstructions({ root, write: true }), /\.codex\/profiles\/astra-review\.config\.toml.*trouvé : 0/);
  assert.deepEqual(snapshotTargets(root), before);
});

test('--installed-root checks and updates only the three named installed profiles', (t) => {
  const root = makeWorkspace(t);
  const installedRoot = makeInstalledProfiles(t);
  const repoBefore = snapshotTargets(root);
  const installedBefore = snapshotInstalledProfiles(installedRoot);
  const output = [];

  assert.equal(main(['--installed-root', installedRoot], {
    root,
    stdout: (message) => output.push(message),
    stderr() {},
  }), 1);
  assert.deepEqual(snapshotInstalledProfiles(installedRoot), installedBefore);
  assert.deepEqual(snapshotTargets(root), repoBefore);
  assert.match(output[0], /^Désynchronisées : /);

  assert.equal(main(['--write', '--installed-root', installedRoot], {
    root,
    stdout: (message) => output.push(message),
    stderr() {},
  }), 0);

  for (const { source, targets } of EXPECTED_MAP) {
    const profile = targets.find((target) => target.startsWith('.codex/profiles/'));
    const installedName = profile.slice('.codex/profiles/'.length).replace('.config.toml', '.config.toml');
    const installedText = readFileSync(resolve(installedRoot, installedName), 'utf8');
    assert.ok(installedText.includes(`# Generated from ${source} by scripts/sync-agent-instructions.mjs.\r\n`));
  }

  assert.deepEqual(snapshotTargets(root), repoBefore);
  assert.deepEqual([...snapshotInstalledProfiles(installedRoot).keys()], [...installedBefore.keys()]);
  assert.deepEqual(syncAgentInstructions({ root, installedRoot, write: true }).changedFiles, []);
});

test('--installed-root rejects a missing profile without creating or changing profiles', (t) => {
  const root = makeWorkspace(t);
  const installedRoot = makeInstalledProfiles(t, { omitProfile: 'astra-review.config.toml' });
  const repoBefore = snapshotTargets(root);
  const installedBefore = snapshotInstalledProfiles(installedRoot);

  assert.throws(
    () => syncAgentInstructions({ root, installedRoot, write: true }),
    /Lecture impossible de la cible astra-review\.config\.toml/,
  );
  assert.deepEqual(snapshotTargets(root), repoBefore);
  assert.deepEqual(snapshotInstalledProfiles(installedRoot), installedBefore);
});

test('rejects malformed --installed-root arguments without touching files', (t) => {
  const root = makeWorkspace(t);
  const output = [];
  const errors = [];

  assert.equal(main(['--installed-root'], {
    root,
    stdout: (message) => output.push(message),
    stderr: (message) => errors.push(message),
  }), 2);
  assert.match(errors[0], /Usage:.*--installed-root/);
  assert.deepEqual(output, []);
});
