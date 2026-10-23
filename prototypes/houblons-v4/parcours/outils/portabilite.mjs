#!/usr/bin/env node
// Portabilité de la maquette vers l'app (relecture p7, 23.10 : bloquants B3, B4, B8). Trois vérifications :
//   --process : aucun fichier du moteur (prototypes/houblons-v4/src) ne lit process.env → SANS PROCESS OK
//   --alias   : aucun fichier du moteur n'importe par @app/… ou @functions/… → IMPORTS RELATIFS OK
//   --work    : aucun fichier de la maquette (parcours/src) n'importe un fichier de work/ → SANS WORK OK
// Sinon : ECHEC et la liste des fichiers. Usage (depuis la racine du dépôt) :
//   node prototypes/houblons-v4/parcours/outils/portabilite.mjs --process|--alias|--work
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const prototype = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const fichiers = (d, ext) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? fichiers(path.join(d, e.name), ext) : ext.test(e.name) ? [path.join(d, e.name)] : []));
const modes = {
  process: { dossier: path.join(prototype, 'src'), ext: /\.ts$/, motif: /process\.env/, ok: 'SANS PROCESS OK', echec: 'SANS PROCESS ECHEC' },
  alias: { dossier: path.join(prototype, 'src'), ext: /\.ts$/, motif: /from\s+['"]@(app|functions)\//, ok: 'IMPORTS RELATIFS OK', echec: 'IMPORTS RELATIFS ECHEC' },
  work: { dossier: path.join(prototype, 'parcours', 'src'), ext: /\.(ts|tsx)$/, motif: /from\s+['"][^'"]*\/work\//, ok: 'SANS WORK OK', echec: 'SANS WORK ECHEC' },
};
const mode = Object.keys(modes).find((m) => process.argv.includes(`--${m}`));
if (!mode) { console.log('Usage : portabilite.mjs --process | --alias | --work'); process.exit(2); }
const m = modes[mode];
const fautifs = fichiers(m.dossier, m.ext).filter((f) => m.motif.test(fs.readFileSync(f, 'utf8')));
if (fautifs.length) {
  console.log(`${m.echec} (${fautifs.length} fichier(s))`);
  for (const f of fautifs) console.log('  - ' + path.relative(prototype, f).split(path.sep).join('/'));
  process.exit(1);
}
console.log(m.ok);
