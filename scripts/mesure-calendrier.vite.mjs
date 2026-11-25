// Config Vite du build de MESURE du Calendrier (cal-74). Comme scripts/parcours/vite.parcours.config.mjs (DEV vrai, fixture du parcours),
// mais le PWA est écarté : `vite-plugin-pwa` n'est pas installé sur ce poste (le build du parcours échoue à charger vite.config.ts).
// Le vite.config.ts du projet visé (PARCOURS_RACINE) est recopié dans node_modules/.cache/mesure-calendrier/ (retiré à la fin du chargement),
// `import.meta.url` y étant remplacé par l'URL du vrai fichier pour que ses chemins relatifs restent justes. Aucun fichier du dépôt n'est touché.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadConfigFromFile, mergeConfig } from 'vite';

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(process.env.PARCOURS_RACINE ?? path.join(ici, '..'));
const ver = (p) => path.join(racine, p).replace(/\\/g, '/');

export default async (env) => {
  let texte = fs.readFileSync(path.join(racine, 'vite.config.ts'), 'utf8');
  const urlReelle = JSON.stringify(pathToFileURL(path.join(racine, 'vite.config.ts')).href);
  /* fonctions de remplacement : `$` n'a aucun sens spécial (L26) */
  texte = texte.replace(/import \{ VitePWA \} from 'vite-plugin-pwa';/, () => 'const VitePWA = (..._a: unknown[]) => [] as unknown[];');
  texte = texte.split('import.meta.url').join(urlReelle);
  const dossier = path.join(racine, 'node_modules', '.cache', 'mesure-calendrier');
  fs.mkdirSync(dossier, { recursive: true });
  const base = path.join(dossier, `base-${process.pid}.config.mts`);
  fs.writeFileSync(base, texte);
  let charge;
  try { charge = await loadConfigFromFile(env, base, racine); } finally { fs.rmSync(base, { force: true }); }
  return mergeConfig(charge?.config ?? {}, {
    root: racine,
    define: { 'import.meta.env.DEV': 'true', 'import.meta.env.PROD': 'false' },
    plugins: [{
      name: 'mesure-calendrier-fixture',
      enforce: 'pre',
      load(id) { return id === 'pwa-register-vide' ? 'export const registerSW = () => () => Promise.resolve();' : null; },
      resolveId(source, importer) {
        if (source === 'virtual:pwa-register') return 'pwa-register-vide';
        if (source === '@parcours/financeDemo-origine') return ver('src/dev/financeDemo.ts');
        if (source === '@parcours/firestoreRepo') return ver('src/services/firestoreRepo.ts');
        if (importer && /[\\/]src[\\/]services[\\/]migration\.ts(?:\?|$)/.test(importer) && /(^|\/)dev\/financeDemo$/.test(source)) {
          return path.join(ici, 'parcours', 'fixtures', 'entree-app.mjs').replace(/\\/g, '/');
        }
        return null;
      }
    }]
  });
};
