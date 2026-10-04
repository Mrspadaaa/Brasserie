// Compile the real application entry with the isolated test adapters.
// This script is local-only and is not imported by the production Vite config.
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile, readdir } from 'node:fs/promises';
import { dirname, resolve, relative, sep, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mission = resolve(root, 'work/houblons-v55-integration-app-2026-10-02');
const normalize = path => path.replaceAll('\\', '/');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const rootLower = normalize(root).toLowerCase();

export async function buildHopV55AppQa() {
  await mkdir(mission, { recursive: true });
  const out = await mkdtemp(resolve(mission, 'qa-app-build-'));
  if (!out.startsWith(mission + sep) || !basename(out).startsWith('qa-app-build-')) {
    throw Error('Build QA hors du dossier isolé de la mission.');
  }

  const captured = new Map();
  async function capture(path, bytes) {
    const previous = captured.get(path);
    if (previous && !previous.equals(bytes)) {
      throw Error('Source modifiée pendant le gel : ' + relative(root, path));
    }
    captured.set(path, bytes);
  }

  const fixtureAliases = {
    firestoreRepo: 'repo.ts',
    firebaseAuth: 'auth.ts',
    migration: 'migration.ts',
  };
  const fixturePlugin = {
    name: 'freeze-hop-v55-app-qa-sources-and-fixtures',
    enforce: 'pre',
    resolveId(source) {
      if (source === 'firebase/functions') {
        return resolve(root, 'tests/qa/hop-recipe/functions.ts').replaceAll('\\', '/');
      }
      if (source === '../data/seedData') {
        return resolve(root, 'src/data/seedData.example.ts').replaceAll('\\', '/');
      }
      const leaf = normalize(source).match(/(?:^|\/)(firestoreRepo|firebaseAuth|migration)(?:\.ts)?$/)?.[1];
      return leaf ? resolve(root, 'tests/qa/hop-recipe', fixtureAliases[leaf]).replaceAll('\\', '/') : null;
    },
    async load(id) {
      const path = normalize(id.split('?')[0]);
      if (!path.toLowerCase().startsWith(rootLower + '/')
        || path.toLowerCase().includes('/node_modules/')
        || !/\.(?:ts|tsx|js|jsx|mjs|json|css)$/.test(path)) return null;
      if (/\/src\/data\/seedData\.ts$/i.test(path)) {
        throw Error('Jeu initial privé interdit dans la QA navigateur V5.5.');
      }
      const bytes = await readFile(path);
      await capture(path, bytes);
      return bytes.toString('utf8');
    },
    transformIndexHtml: { order: 'pre', async handler(html, context) {
      const path = normalize(context.filename);
      await capture(path, Buffer.from(html));
      return html;
    } },
  };

  await build({
    configFile: false,
    root,
    logLevel: 'warn',
    plugins: [fixturePlugin, react()],
    define: {
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify('local-hop-v55-app-qa'),
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify('local-qa-no-key'),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify('local-hop-v55-app-qa'),
      'import.meta.env.VITE_AUTHORIZED_ACCOUNTS': JSON.stringify('qa@localhost'),
    },
    build: {
      outDir: out,
      emptyOutDir: false,
      minify: true,
      rollupOptions: { input: resolve(root, 'tests/qa/hop-v55-app/index.html') },
    },
  });

  const sources = [];
  for (const [path, bytes] of [...captured.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const relativeSource = relative(root, path).replaceAll('\\', '/');
    const snapshotPath = resolve(out, 'source-snapshot', relativeSource);
    await mkdir(dirname(snapshotPath), { recursive: true });
    await writeFile(snapshotPath, bytes);
    sources.push({
      path: relativeSource,
      snapshotPath: normalize(relative(out, snapshotPath)),
      bytes: bytes.length,
      sha256: sha256(bytes),
      usedByCompiler: true,
    });
  }
  if (sources.length < 10) throw Error('Gel de sources incomplet pour la vraie application.');

  const dependencyPaths = [
    'package.json',
    'package-lock.json',
    ...['react', 'react-dom', 'vite', '@vitejs/plugin-react', 'dexie', 'firebase',
      'fflate', 'lucide-react', 'puppeteer-core'].map(name => 'node_modules/' + name + '/package.json'),
  ];
  const dependencies = [];
  for (const path of dependencyPaths) {
    const bytes = await readFile(resolve(root, path));
    dependencies.push({
      path,
      sha256: sha256(bytes),
      ...(path.startsWith('node_modules/') ? { version: JSON.parse(bytes).version } : {}),
    });
  }

  const assets = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else {
        const bytes = await readFile(path);
        assets.push({ path: normalize(relative(out, path)), bytes: bytes.length, sha256: sha256(bytes) });
      }
    }
  }
  await walk(out);

  const toolSources = [];
  for (const path of ['scripts/build-hop-v55-app-qa.mjs', 'scripts/check-hop-v55-app.mjs']) {
    const bytes = await readFile(resolve(root, path));
    toolSources.push({ path, bytes: bytes.length, sha256: sha256(bytes) });
  }
  const manifest = {
    format: 'hop-v55-real-app-local-qa-v1',
    builtAt: new Date().toISOString(),
    entry: '/tests/qa/hop-v55-app/index.html',
    scope: 'Real App, Host, Page, local Dexie services and domain; only identity, Firestore, Functions and migration adapters are fixtures.',
    network: 'The browser harness blocks every request outside its 127.0.0.1 fixture server.',
    sourceCount: sources.length,
    sources,
    toolSources,
    assets,
    dependencies,
  };
  const manifestBytes = Buffer.from(JSON.stringify(manifest, null, 2));
  await writeFile(resolve(out, 'manifest.json'), manifestBytes);
  await writeFile(resolve(mission, 'last-hop-v55-app-qa-build.json'), JSON.stringify({
    path: out,
    manifestSha256: sha256(manifestBytes),
    entry: manifest.entry,
  }, null, 2));
  return out;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(await buildHopV55AppQa());
}
