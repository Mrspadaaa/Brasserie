// Aucun fichier de l'app n'a changé : git status --porcelain -- src functions doit être vide.
// Usage (depuis la racine du dépôt) : node prototypes/houblons-v4/parcours/outils/app-intacte.mjs → APP INTACTE OK
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const depot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const r = spawnSync('git', ['status', '--porcelain', '--', 'src', 'functions'], { cwd: depot, encoding: 'utf8' });
if (r.status !== 0) { console.log(`APP INTACTE ECHEC : git a échoué (${(r.stderr || '').trim()})`); process.exit(1); }
const lignes = r.stdout.split('\n').filter(Boolean);
if (lignes.length) { console.log(lignes.join('\n')); console.log(`APP INTACTE ECHEC (${lignes.length} fichier${lignes.length > 1 ? 's' : ''} de l'app changé${lignes.length > 1 ? 's' : ''})`); process.exit(1); }
console.log('APP INTACTE OK');
