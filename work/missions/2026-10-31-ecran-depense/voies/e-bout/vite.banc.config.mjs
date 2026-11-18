// Configuration Vite du banc, SEULEMENT quand `zxing-wasm` et `pdfjs-dist` (package.json, lecture du QR-facture, D240 et D243) ne sont pas
// installés dans le node_modules partagé de ce poste : sans eux, `src/services/qrLecture.ts` fait échouer la transformation de
// QuickActionModal.tsx (500) et la feuille de dépense ne s'ouvre pas. Elle reprend la configuration du dépôt telle quelle et ajoute
// quatre alias vers les deux paquets, aux mêmes versions exactes, installés dans `./qr-deps` (hors Git). Rien dans le dépôt n'est touché.
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfigFromFile, mergeConfig } from 'vite';

const ici = dirname(fileURLToPath(import.meta.url));
const racine = resolve(ici, '../../../../..');
const modules = join(ici, 'qr-deps/node_modules').replace(/\\/g, '/');
const base = await loadConfigFromFile({ command: 'serve', mode: 'development' }, join(racine, 'vite.config.ts'), racine);

export default mergeConfig(base?.config ?? {}, {
  resolve: { alias: [
    { find: /^zxing-wasm\/reader\/zxing_reader\.wasm(\?.*)?$/, replacement: `${modules}/zxing-wasm/dist/reader/zxing_reader.wasm$1` },
    { find: /^zxing-wasm\/reader$/, replacement: `${modules}/zxing-wasm/dist/es/reader/index.js` },
    { find: /^pdfjs-dist\/build\/pdf\.worker\.min\.mjs(\?.*)?$/, replacement: `${modules}/pdfjs-dist/build/pdf.worker.min.mjs$1` },
    { find: /^pdfjs-dist$/, replacement: `${modules}/pdfjs-dist/build/pdf.mjs` }
  ] },
  // Les fichiers sont dans un dossier node_modules : sans cette exclusion, l'optimiseur de dépendances de Vite cherche un paquet préempaqueté
  // pour `pdf.worker.min.mjs?url` et répond « optimized info should be defined ».
  optimizeDeps: { exclude: ['zxing-wasm', 'pdfjs-dist'] },
  server: { fs: { strict: false } }
});
