// Lance le lint de DESIGN.md : l'outil Google (@google/design.md 0.4.0, installé ici)
// puis nos contrôles complémentaires (chemins cités, contrastes des composants).
// Usage : npm run lint:design   (depuis la racine)
// Code de sortie : 1 si l'outil signale une erreur ou si un contrôle complémentaire échoue.
// Les avertissements de l'outil (jetons non référencés, pas de « primary ») sont affichés,
// jamais bloquants : ce sont des désaccords de format connus (voir RESULTAT de la voie e5).
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const outil = resolve(ici, 'node_modules', '@google', 'design.md', 'dist', 'index.js');
const cible = process.argv[2] ?? 'DESIGN.md';

const lint = spawnSync(process.execPath, [outil, 'lint', '--format', 'json', cible], { encoding: 'utf8' });
if (lint.error || !lint.stdout) {
  console.error('LINT DESIGN : outil introuvable ou muet. Lancer : npm install --prefix tools/design-lint');
  console.error(lint.error?.message ?? lint.stderr);
  process.exit(2);
}
const rapport = JSON.parse(lint.stdout);
for (const f of rapport.findings) {
  console.log(`[${f.severity}] ${f.rule ?? '-'} ${f.path ?? ''} : ${f.message}`);
}
const { errors, warnings, infos } = rapport.summary;
console.log(`OUTIL GOOGLE : ${errors} erreur(s), ${warnings} avertissement(s), ${infos} info(s)`);

const extra = spawnSync(process.execPath, [resolve(ici, 'verifier-extra.mjs'), cible], { encoding: 'utf8' });
process.stdout.write(extra.stdout);
process.stderr.write(extra.stderr);

const echec = errors > 0 || extra.status !== 0;
console.log(echec ? 'LINT DESIGN ECHEC' : 'LINT DESIGN OK (avertissements de format mis à part)');
process.exit(echec ? 1 : 0);
