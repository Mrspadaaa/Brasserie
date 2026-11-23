// Les fonctions serveur n'ont pas changé : git status --porcelain -- functions doit être vide.
// Depuis D64 (porte B ouverte le 24.10, nuit), l'intégration écrit dans src/ : seul functions/ reste gardé ici ; la maquette,
// elle, se vérifie par sa construction, ses types et ses contrôles.
// Usage (depuis la racine du dépôt) : node prototypes/houblons-v4/parcours/outils/app-intacte.mjs → FONCTIONS INTACTES OK
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const depot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const r = spawnSync('git', ['status', '--porcelain', '--', 'functions'], { cwd: depot, encoding: 'utf8' });
if (r.status !== 0) { console.log(`FONCTIONS INTACTES ECHEC : git a échoué (${(r.stderr || '').trim()})`); process.exit(1); }
const lignes = r.stdout.split('\n').filter(Boolean);
if (lignes.length) { console.log(lignes.join('\n')); console.log(`FONCTIONS INTACTES ECHEC (${lignes.length} fichier${lignes.length > 1 ? 's' : ''} de functions/ changé${lignes.length > 1 ? 's' : ''})`); process.exit(1); }
console.log('FONCTIONS INTACTES OK');
