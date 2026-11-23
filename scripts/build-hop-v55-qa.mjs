// A frozen LOCAL test artifact of the actual React components and domain engines.
// It is absent from the application/deploy Vite entry; no user Firebase/Auth is loaded.
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile, readdir } from 'node:fs/promises';
import { dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mission = resolve(root, 'work/houblons-v55-integration-app-2026-10-02');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const normalizedRoot = root.replaceAll('\\', '/').toLowerCase();
// The same shared-domain entries used by the production Vite build. Keep QA
// resolution explicit: importing the application config would also load its
// environment and bootstrap settings into this isolated fixture artifact.
const browserSharedAliases = [
  { find: './hopAdviceContentReference.js', replacement: resolve(root, 'src/domain/hopDecision/adviceContentReference.ts') },
  { find: './brewerTools.js', replacement: resolve(root, 'src/domain/brewerTools.ts') },
  { find: './yeastCompanion.js', replacement: resolve(root, 'src/domain/yeastCompanion.ts') },
  { find: './financeContext.js', replacement: resolve(root, 'src/domain/finance/assistantContext.ts') },
  { find: /^.*\/data\/seedData(?:\.ts)?$/, replacement: resolve(root, 'src/data/seedData.example.ts') },
];
export async function buildHopV55Qa() {
  await mkdir(mission, { recursive: true });
  const out = await mkdtemp(resolve(mission, 'qa-build-'));
  if (!out.startsWith(mission + sep)) throw Error('Dossier QA hors mission.');
  const captured = new Map();
  // Serve these captured bytes to the compiler itself. A concurrent write cannot
  // cause a manifest to record later bytes than the ones that produced the asset.
  async function capture(path, bytes) {
    const prior = captured.get(path);
    if (prior && !prior.equals(bytes)) throw Error(`Source modifiée pendant le gel : ${relative(root, path)}`);
    captured.set(path, bytes);
  }
  await build({ configFile: false, root, logLevel: 'warn', resolve: { alias: browserSharedAliases }, plugins: [{
    name: 'freeze-exact-hop-v55-input-bytes', enforce: 'pre',
    async load(id) {
      const clean = id.split('?')[0].replaceAll('\\', '/');
      if (!clean.toLowerCase().startsWith(normalizedRoot + '/') || clean.includes('/node_modules/') || !/\.(?:ts|tsx|js|jsx|mjs|json|css)$/.test(clean)) return null;
      if (/\/src\/data\/seedData\.ts$/.test(clean)) throw Error('Jeu initial privé interdit dans la QA V5.5.');
      const bytes = await readFile(clean); await capture(clean, bytes);
      return bytes.toString('utf8');
    },
    transformIndexHtml: { order: 'pre', async handler(html, ctx) {
      const path = ctx.filename.replaceAll('\\', '/');
      await capture(path, Buffer.from(html)); return html;
    } },
  }, react()], build: { outDir: out, emptyOutDir: false, minify: true, rollupOptions: { input: resolve(root, 'tests/qa/hop-v55/index.html') } } });
  const sources = [];
  for (const [id, bytes] of [...captured.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const path = relative(root, id).replaceAll('\\', '/');
    const snapshotPath = resolve(out, 'source-snapshot', path);
    await mkdir(dirname(snapshotPath), { recursive: true }); await writeFile(snapshotPath, bytes);
    sources.push({ path, snapshotPath: relative(out, snapshotPath).replaceAll('\\', '/'), bytes: bytes.length, sha256: sha(bytes), usedByCompiler: true });
  }
  if (sources.length < 5) throw Error('Gel incomplet : aucune provenance de sources exploitable.');
  const dependencies = [];
  for (const path of ['package.json', 'package-lock.json', 'scripts/build-hop-v55-qa.mjs', 'vite.config.ts', ...['react', 'react-dom', 'vite', 'dexie', 'fflate', 'lucide-react'].map(name => `node_modules/${name}/package.json`)]) {
    const bytes = await readFile(resolve(root, path));
    dependencies.push({ path, sha256: sha(bytes), ...(path.startsWith('node_modules/') ? { version: JSON.parse(bytes).version } : {}) });
  }
  const assets = [];
  async function walk(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const target = resolve(path, entry.name);
      if (entry.isDirectory()) await walk(target);
      else { const bytes = await readFile(target); assets.push({ path: relative(out, target).replaceAll('\\', '/'), bytes: bytes.length, sha256: sha(bytes) }); }
    }
  }
  await walk(out);
  const manifest = { format: 'hop-v55-local-qa-build-v2', builtAt: new Date().toISOString(),
    entry: '/tests/qa/hop-v55/index.html', sourceCount: sources.length, scope: 'isolatedFixtures', sources, assets, dependencies };
  await writeFile(resolve(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
  await writeFile(resolve(mission, 'last-qa-build.json'), JSON.stringify({ path: out, manifestSha256: sha(Buffer.from(JSON.stringify(manifest, null, 2))), entry: manifest.entry }, null, 2));
  return out;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(await buildHopV55Qa());
