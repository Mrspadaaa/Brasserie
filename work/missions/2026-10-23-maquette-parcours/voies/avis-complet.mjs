#!/usr/bin/env node
// Un verdict par état et par écran dans le RESULTAT.md d'une critique (contrat CRITIQUE-REPRISES.md, § « Ce que tu rends »).
// Un script plutôt qu'un `node -e` : sous cmd.exe, une commande en ligne casse sur les guillemets (24.10).
// Usage : node avis-complet.mjs <RESULTAT.md> <fichier d'états> [<fichier>…]  →  « AVIS-COMPLET-<n> » ou « AVIS ECHEC … ».
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const [resultat, ...fichiers] = process.argv.slice(2);
if (!resultat || !fichiers.length) { console.log('Usage : node avis-complet.mjs <RESULTAT.md> <fichier d\'états>…'); process.exit(2); }
const r = fs.existsSync(path.resolve(RACINE, resultat)) ? fs.readFileSync(path.resolve(RACINE, resultat), 'utf8').split(/\r?\n/) : [];
const manques = [];
let n = 0;
for (const f of fichiers) {
  const etats = JSON.parse(fs.readFileSync(path.join(RACINE, 'work/refonte-frontend/v4/choix/etats', `${f}.json`), 'utf8')).etats;
  if (!r.some((l) => l.startsWith(`## ${f}`))) manques.push(`section ## ${f}`);
  const i = r.findIndex((l) => l.startsWith(`## ${f}`));
  if (i >= 0 && !/^\S+ : (ACCEPTÉ|REJET)/.test(r.slice(i + 1).find((l) => l.trim()) ?? '')) manques.push(`verdict de ${f}`);
  for (const e of etats) {
    n++;
    if (!r.some((l) => l.startsWith(`- ${e.id} : RECONNU`) || l.startsWith(`- ${e.id} : ÉCART — `) || l.startsWith(`- ${e.id} : EN ATTENTE`))) manques.push(e.id);
  }
}
if (!/^OK — \d+ reconnus, \d+ écarts/.test(r[0] ?? '')) manques.push('ligne 1');
console.log(manques.length ? `AVIS ECHEC (${manques.length} : ${manques.slice(0, 12).join(', ')})` : ['AVIS', 'COMPLET', n].join('-'));
process.exit(manques.length ? 1 : 0);
