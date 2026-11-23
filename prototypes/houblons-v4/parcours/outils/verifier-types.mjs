// Typage du dossier parcours : tsc --noEmit avec parcours/tsconfig.json (même réglage que ../ecran/tsconfig.json).
// Usage (depuis la racine du dépôt) : node prototypes/houblons-v4/parcours/outils/verifier-types.mjs → TYPES OK
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const parcours = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prototype = path.resolve(parcours, '..');
const tsc = path.join(prototype, 'node_modules', 'typescript', 'bin', 'tsc');
const r = spawnSync(process.execPath, [tsc, '--noEmit', '-p', path.join(parcours, 'tsconfig.json')], { cwd: prototype, encoding: 'utf8' });
const sortie = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim();
if (r.status === 0) console.log('TYPES OK');
else {
  console.log(sortie.split('\n').slice(0, 40).join('\n'));
  const n = (sortie.match(/error TS/g) ?? []).length;
  console.log(`TYPES ECHEC (${n} erreur${n > 1 ? 's' : ''})`);
  process.exit(1);
}
