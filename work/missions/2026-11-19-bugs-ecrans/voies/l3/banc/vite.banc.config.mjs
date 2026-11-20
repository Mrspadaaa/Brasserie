// Build de PRODUCTION local (minifié, sans HMR) qui garde le banc `?dev-local&etape=levure` : `import.meta.env.DEV` forcé à true.
// Jamais déployé : la sortie va dans un dossier temporaire. Usage : npx vite build --config <ce fichier> ; npx vite preview --config <ce fichier> --port 3123.
import { defineConfig, mergeConfig } from 'vite';
import path from 'node:path';
import os from 'node:os';
import base from '../../../../../../vite.config.ts';

const sortie = path.join(process.env.L3_DIST ?? os.tmpdir(), 'l3-dist');
export default defineConfig(async (env) => mergeConfig(typeof base === 'function' ? await base(env) : base, {
  root: path.resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..'),
  cacheDir: path.join(os.tmpdir(), 'l3-vite-cache'),
  define: { 'import.meta.env.DEV': 'true' },
  // L3_LISIBLE=1 : noms de fonctions gardés (profil) ; sinon la production telle quelle, minifiée.
  build: { outDir: sortie, emptyOutDir: true, sourcemap: false, ...(process.env.L3_LISIBLE ? { minify: false } : {}) },
  preview: { port: 3123, strictPort: true }
}));
