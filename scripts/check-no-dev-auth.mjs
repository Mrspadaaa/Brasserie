import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Le contournement d'authentification locale ne doit JAMAIS partir en production.
 *
 * `src/App.tsx` fabrique un compte factice quand l'URL porte `?dev-local`, pour
 * qu'on puisse vérifier les écrans sans ouvrir une session Google. Il est gardé
 * par `import.meta.env.DEV`, que Vite remplace par `false` au build : le
 * `if (false)` qui en résulte est éliminé par le bundler.
 *
 * ⚠️ « Il devrait être éliminé » n'est pas une garantie. Une refonte du garde,
 * un changement d'options de minification ou un simple `const DEV = ...` sorti
 * de la portée statique suffiraient à le laisser passer, et personne ne s'en
 * apercevrait : l'application déployée aurait une porte ouverte sur l'URL.
 * Ce contrôle cherche donc la marque dans le bundle RÉEL.
 *
 *   npm run build && node scripts/check-no-dev-auth.mjs
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');

if (!existsSync(DIST)) {
  console.log('⚠️  Aucun dossier `dist/`. Lance `npm run build` avant ce contrôle.');
  process.exit(1);
}

/** Ce qui trahirait la présence du contournement dans le bundle. */
const MARQUEURS = ['dev-local', 'devLocalUser'];

function fichiers(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return fichiers(p);
    return /\.(js|css|html)$/.test(e.name) ? [p] : [];
  });
}

const trouves = [];
for (const f of fichiers(DIST)) {
  const contenu = readFileSync(f, 'utf8');
  for (const m of MARQUEURS) {
    if (contenu.includes(m)) trouves.push(`${f.replace(DIST, 'dist')} → « ${m} »`);
  }
}

if (trouves.length > 0) {
  console.log('⛔ Le contournement d’authentification est PRÉSENT dans le bundle de production :');
  trouves.forEach((t) => console.log(`   ${t}`));
  console.log('\n   Ne déploie pas. Vérifie que le garde `import.meta.env.DEV` est bien statique.');
  process.exit(1);
}

console.log(
  '✅ Bundle de production propre : aucune trace du contournement d’authentification locale.'
);
