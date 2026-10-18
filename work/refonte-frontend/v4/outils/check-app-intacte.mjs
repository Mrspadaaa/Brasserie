// Vérifie qu'aucun fichier de l'app n'a changé depuis la base de la mission
// (origin/main c8f4c3ae), ni dans les commits ni dans l'arbre de travail.
// Usage : node work/refonte-frontend/v4/outils/check-app-intacte.mjs
//         node work/refonte-frontend/v4/outils/check-app-intacte.mjs --control
// Le mode --control surveille docs/, qui a changé exprès : il doit échouer.
import { spawnSync } from 'node:child_process';

const BASE = 'c8f4c3ae';
const APP = [
  'src', 'functions', 'public', 'package.json', 'package-lock.json', 'index.html',
  'vite.config.ts', 'tailwind.config.js', 'tailwind.config.ts', 'postcss.config.js',
  'tsconfig.json', 'firebase.json', '.firebaserc', 'firestore.rules', 'firestore.indexes.json',
];
const paths = process.argv.includes('--control') ? ['docs'] : APP;

function git(args) {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  if (r.status !== 0) {
    console.log('APP-INTACTE ERREUR git ' + args.join(' ') + '\n' + r.stderr);
    process.exit(2);
  }
  return r.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
}

const committed = git(['diff', '--name-only', BASE, 'HEAD', '--', ...paths]);
const working = git(['status', '--porcelain', '--', ...paths]);
const changed = [...new Set([...committed, ...working])];

if (changed.length === 0) {
  console.log('APP-INTACTE OK (' + paths.length + ' chemins surveillés depuis ' + BASE + ')');
} else {
  console.log('APP-INTACTE ECHEC : ' + changed.length + ' changement(s)');
  for (const c of changed.slice(0, 20)) console.log('  ' + c);
  process.exitCode = 1;
}
