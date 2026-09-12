// The REAL production components with data adapters, into a separate local-only artifact.
// This config is never imported by vite.config.ts or any deployment command.
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { lstat } from 'node:fs/promises';
import { basename } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export async function buildHopRecipeQa(out = resolve(tmpdir(), 'laffinee-hop-qa-build')) {
  out = resolve(out);
  // Vite empties this directory. Restrict the resolved target to a dedicated direct
  // child of TEMP and reject junctions/symlinks before allowing recursive cleanup.
  if (dirname(out) !== resolve(tmpdir()) || !/^laffinee-hop-qa-[\w-]+$/.test(basename(out))) throw Error('QA output must be a dedicated laffinee-hop-qa-* directory directly in TEMP.');
  if ((await lstat(out).catch(error => { if (error.code !== 'ENOENT') throw error; return null; }))?.isSymbolicLink()) throw Error('QA output cannot be a junction or symlink.');
  const adapters = { firestoreRepo: 'repo.ts', firebaseAuth: 'auth.ts', migration: 'migration.ts' };
  await build({ configFile: false, root, plugins: [
    { name: 'isolated-hop-qa-adapters', enforce: 'pre', resolveId(source) {
      if (source === 'firebase/functions') return resolve(root, 'tests/qa/hop-recipe/functions.ts').replaceAll('\\', '/');
      const name = source.replaceAll('\\', '/').match(/(?:^|\/)(firestoreRepo|firebaseAuth|migration)(?:\.ts)?$/)?.[1];
      return name ? resolve(root, 'tests/qa/hop-recipe', adapters[name]).replaceAll('\\', '/') : null;
    } }, react()
  ], define: { 'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify('local-hop-qa'), 'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify('local-qa-no-key'),
    'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify('local-qa'), 'import.meta.env.VITE_AUTHORIZED_ACCOUNTS': JSON.stringify('qa@localhost') },
  build: { outDir: out, emptyOutDir: true, minify: true, rollupOptions: { input: resolve(root, 'tests/qa/hop-recipe/index.html') } } });
  return out;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildHopRecipeQa(process.env.HOP_QA_BUILD_DIR);
