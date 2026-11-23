// LO-2 : `vite build` de l'app SANS toucher au dépôt, quand zxing-wasm et pdfjs-dist ne sont pas installés dans ce poste (même cas que le banc e-bout).
// Les deux paquets viennent de la copie `qr-deps` (hors Git, lecture seule) ; la configuration du dépôt est reprise telle quelle. Sortie dans le dossier temporaire.
// Usage : node -e "import('vite').then(v => v.build({ configFile: '<ce fichier>' }))"  (voir construire-app.mjs)
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfigFromFile, mergeConfig } from 'vite';

const ici = dirname(fileURLToPath(import.meta.url));
const racine = resolve(ici, '../../../..');
const modules = (process.env.QR_DEPS ?? 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-10-31-ecran-depense/voies/e-bout/qr-deps/node_modules').replace(/\\/g, '/');
const base = await loadConfigFromFile({ command: 'build', mode: 'production' }, join(racine, 'vite.config.ts'), racine);

export default mergeConfig(base?.config ?? {}, {
  root: racine,
  resolve: { alias: [
    { find: /^zxing-wasm\/reader\/zxing_reader\.wasm(\?.*)?$/, replacement: `${modules}/zxing-wasm/dist/reader/zxing_reader.wasm$1` },
    { find: /^zxing-wasm\/reader$/, replacement: `${modules}/zxing-wasm/dist/es/reader/index.js` },
    { find: /^pdfjs-dist\/build\/pdf\.worker\.min\.mjs(\?.*)?$/, replacement: `${modules}/pdfjs-dist/build/pdf.worker.min.mjs$1` },
    { find: /^pdfjs-dist$/, replacement: `${modules}/pdfjs-dist/build/pdf.mjs` },
  ] },
  build: { outDir: process.env.SORTIE ?? join(process.env.TEMP ?? '.', 'lo2-app'), emptyOutDir: true },
  server: { fs: { strict: false } },
});
