// Mode de build « banc » (voie p1-banc-prod, D70) : un build de PRODUCTION (React sans les avertissements, code minifié,
// découpage en chunks de `vite build`) mais où `import.meta.env.DEV` vaut `true`, pour que les fixtures `?dev-local&etape=houblons`
// et le crochet `window.__hopPile` existent. Sans cela, le banc de fluidité ne pourrait mesurer que le serveur de développement
// (React en mode dev, modules non groupés), donc pessimiste.
//
// GARDE-FOUS
//   - La sortie va TOUJOURS hors de `dist/` (dossier temporaire de l'OS, ou HOP_BANC_OUT) : ce build ne peut pas être déployé
//     par `firebase deploy` ni vérifié par erreur à la place du vrai. Le fichier refuse un dossier de sortie nommé `dist`.
//   - `npm run build` ne lit pas ce fichier ; `scripts/check-no-dev-auth.mjs` regarde `dist/` et continue de refuser la moindre
//     trace de `dev-local` dans le build normal.
//   - Le banc ne sert jamais ce build ailleurs qu'en local, et bloque toute requête hors localhost (voir bench-hop-prod.mjs).
//
// Usage (par scripts/bench-hop-prod.mjs, à la main : VITE_HOP_V4=on HOP_BANC_OUT=<dossier> vite build --mode banc -c scripts/vite-banc.config.mjs)
//   HOP_BANC_PROFIL=1 : noms de fonctions conservés et cartes de source, pour nommer les composants coûteux (build à part).
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vite';
import base from '../vite.config.ts';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sortie = path.resolve(process.env.HOP_BANC_OUT || path.join(os.tmpdir(), 'affinee-banc-hop-prod', 'dist'));
const profil = process.env.HOP_BANC_PROFIL === '1';

if (path.basename(sortie).toLowerCase() === 'dist' && path.dirname(sortie) === racine) {
  throw new Error('vite-banc : le build du banc ne s\'écrit jamais dans dist/ (celui du déploiement).');
}
if (sortie.startsWith(racine + path.sep) && !/[\/]\.?banc/i.test(sortie.slice(racine.length))) {
  throw new Error(`vite-banc : sortie ${sortie} dans le dépôt ; utilise le dossier temporaire ou un dossier nommé « banc ».`);
}

export default defineConfig((env) => {
  if (env.mode !== 'banc') throw new Error(`vite-banc : ce fichier ne sert qu'au mode « banc » (reçu « ${env.mode} »).`);
  const socle = typeof base === 'function' ? base(env) : base;
  return mergeConfig(socle, {
    define: { 'import.meta.env.DEV': 'true' },
    ...(profil ? { esbuild: { keepNames: true } } : {}),
    build: { outDir: sortie, emptyOutDir: true, sourcemap: profil, reportCompressedSize: false }
  });
});
