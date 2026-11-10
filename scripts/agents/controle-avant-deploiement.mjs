#!/usr/bin/env node
// Garde avant déploiement (D342) : rien ne part en ligne sans que chaque état de l'écran, sur la version à déployer, ait été regardé comme
// une image et passé à la question ouverte du brasseur : « combien et quels problèmes il y a ? ». Le critique répond, puis le pilote.
// Usage : node scripts/agents/controle-avant-deploiement.mjs <sha> [--dossier <dossier des verdicts>]
// Attendu : <dossier>/<sha>/VERDICT.md, avec
//   « Version : <sha> », un tableau « | capture | thème | largeur | état | problèmes | bloquants | », une rangée par capture (fichier présent
//   dans <dossier>/<sha>/, ouvert), les deux thèmes (clair, sombre), les deux largeurs (390, 1280), au moins 8 états distincts,
//   puis « Pilote : vu » et « Bloquants : 0 ».
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const sha = args.find(a => !a.startsWith('--'));
const i = args.indexOf('--dossier');
const dossier = resolve(i >= 0 ? args[i + 1] : 'work/missions/2026-10-31-ecran-depense/avant-deploiement');
const echecs = [];
if (!sha) { console.log('usage : controle-avant-deploiement.mjs <sha> [--dossier <d>]'); process.exit(2); }

const ici = join(dossier, sha), fichier = join(ici, 'VERDICT.md');
if (!existsSync(fichier)) echecs.push(`aucun verdict pour ${sha} (${fichier}) : l'écran n'a pas été regardé sur cette version`);
else {
  const texte = readFileSync(fichier, 'utf8');
  if (!new RegExp(`^Version : ${sha}\\b`, 'm').test(texte)) echecs.push(`« Version : ${sha} » absent : le verdict porte sur une autre version`);
  const rangees = texte.split('\n').filter(l => /^\|/.test(l) && !/^\|\s*-/.test(l))
    .map(l => l.split('|').slice(1, -1).map(c => c.trim())).filter(c => c.length >= 6 && !/^capture$/i.test(c[0]));
  if (!rangees.length) echecs.push('tableau des captures vide');
  for (const [capture, , , etat, problemes, bloquants] of rangees) {
    if (!existsSync(join(ici, capture))) echecs.push(`${capture} : fichier absent de ${ici}`);
    if (!/^\d+$/.test(problemes)) echecs.push(`${capture} (${etat}) : nombre de problèmes absent : la question ouverte n'a pas été posée`);
    if (bloquants !== '0') echecs.push(`${capture} (${etat}) : ${bloquants || '?'} bloquant(s)`);
  }
  const de = k => new Set(rangees.map(c => c[k].toLowerCase()));
  for (const t of ['clair', 'sombre']) if (!de(1).has(t)) echecs.push(`thème ${t} jamais regardé`);
  for (const w of ['390', '1280']) if (!de(2).has(w)) echecs.push(`largeur ${w} jamais regardée`);
  if (de(3).size < 8) echecs.push(`${de(3).size} états regardés, 8 au moins (repos, filtre, plié, plateau, bandeau, lenteur, pied, entrée…)`);
  if (!/^Pilote : vu\b/m.test(texte)) echecs.push('« Pilote : vu » absent : le pilote n\'a pas regardé les captures lui-même');
  if (!/^Bloquants : 0\s*$/m.test(texte)) echecs.push('« Bloquants : 0 » absent');
}
for (const e of echecs) console.log(`  - ${e}`);
console.log(echecs.length ? 'AVANT-DEPLOIEMENT ECHEC' : 'AVANT-DEPLOIEMENT OK');
process.exit(echecs.length ? 1 : 0);
