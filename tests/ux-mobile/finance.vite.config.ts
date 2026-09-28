import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';

const fixtureRoot = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(fixtureRoot, '../..');
const buildRoot = resolve(tmpdir(), 'laffinee-finance-ux-build');

// Petit serveur réservé aux fixtures financières synthétiques. L'alias garde
// les données privées d'installation hors du graphe servi par Vite.
export default defineConfig({
  root: fixtureRoot,
  plugins: [react()],
  resolve: { alias: [
    { find: '../data/seedData', replacement: resolve(projectRoot, 'src/data/seedData.example.ts') },
    { find: './firebase', replacement: resolve(fixtureRoot, 'finance.firebase.ts') },
    { find: '../services/firebase', replacement: resolve(fixtureRoot, 'finance.firebase.ts') },
    { find: '../../services/firebase', replacement: resolve(fixtureRoot, 'finance.firebase.ts') }
  ] },
  optimizeDeps: { noDiscovery: true, entries: [] },
  build: {
    outDir: buildRoot, emptyOutDir: false,
    rollupOptions: { input: resolve(fixtureRoot, 'finance.fixture.html') }
  },
  server: { host: '127.0.0.1', port: 4179, strictPort: true, fs: { allow: [projectRoot] } }
});
