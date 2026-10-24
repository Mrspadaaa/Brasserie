// Génère <id>/etat.html pour chaque concept de la série a (fla1 à fla8) depuis <id>/concept.mjs et le socle.
// Usage : node generer.mjs [fla3 …]   (sans argument : tous). Refuse de générer si un mot ne vient pas d'une fiche.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { verifier } from './donnees.mjs';
import { page } from './socle.mjs';

const lot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fautes = verifier();
if (fautes.length) { console.log('DONNEES ECHEC\n  ' + fautes.join('\n  ')); process.exit(1); }
const voulus = process.argv.slice(2);
const ids = (voulus.length ? voulus : fs.readdirSync(lot).filter((d) => /^fla\d$/.test(d))).filter((d) => fs.existsSync(path.join(lot, d, 'concept.mjs')));
for (const id of ids) {
  const C = (await import(pathToFileURL(path.join(lot, id, 'concept.mjs')).href + '?t=' + Date.now())).default;
  const html = page(C);
  if (/\b(undefined|NaN|null)\b|\[object /.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) { console.log(id + ' : fuite de valeur technique'); process.exit(1); }
  fs.writeFileSync(path.join(lot, id, 'etat.html'), html);
  console.log(id + ' · etat.html ' + Math.round(html.length / 1024) + ' ko');
}
