// Config Vite du BUILD DE TEST du parcours Calendrier (jamais de la livraison). Elle reprend `vite.config.ts` du projet visé
// (PARCOURS_RACINE : le dossier courant ou la copie d'un tag), puis ajoute deux choses :
//   1. `import.meta.env.DEV` vrai et `PROD` faux (sinon `?dev-local` n'existe pas dans un build) ;
//   2. un plugin qui, pour `migration.ts` seulement, remplace `../dev/financeDemo` par `fixtures/entree-app.mjs`
//      (la fixture du parcours ; la démo d'origine reste atteignable par `@parcours/financeDemo-origine`).
// Aucun fichier de `src/` n'est touché : le même branchement marche sur un tag.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfigFromFile, mergeConfig } from 'vite';

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(process.env.PARCOURS_RACINE ?? path.join(ici, '..', '..'));
const ver = (p) => path.join(racine, p).replace(/\\/g, '/');

export default async (env) => {
  const base = await loadConfigFromFile(env, path.join(racine, 'vite.config.ts'), racine);
  return mergeConfig(base?.config ?? {}, {
    root: racine,
    define: { 'import.meta.env.DEV': 'true', 'import.meta.env.PROD': 'false' },
    plugins: [{
      name: 'parcours-calendrier-fixture',
      enforce: 'pre',
      resolveId(source, importer) {
        if (source === '@parcours/financeDemo-origine') return ver('src/dev/financeDemo.ts');
        if (source === '@parcours/firestoreRepo') return ver('src/services/firestoreRepo.ts');
        if (importer && /[\\/]src[\\/]services[\\/]migration\.ts(?:\?|$)/.test(importer) && /(^|\/)dev\/financeDemo$/.test(source)) {
          return path.join(ici, 'fixtures', 'entree-app.mjs').replace(/\\/g, '/');
        }
        return null;
      }
    }]
  });
};
