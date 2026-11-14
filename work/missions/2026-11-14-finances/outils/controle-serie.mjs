// Contrôle d'une série de mini maquettes (mission 2026-11-14-finances).
// Usage : node work/missions/2026-11-14-finances/outils/controle-serie.mjs <dossier de voie> <ids séparés par des virgules>
// Pour chaque id : etat.html, <id>-repos.png, <id>-apres.png, NOTE.md présents ; la base v6a gardée (« Loyer de l'atelier »,
// « ✓ Payé », « + pièce ») ; aucun type="number" ; classes préfixées par l'id. Imprime SERIE OK ou SERIE ECHEC et le détail.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const [dir, idsArg] = process.argv.slice(2);
if (!dir || !idsArg) { console.log('SERIE ECHEC usage'); process.exit(1); }
const ech = [];
for (const id of idsArg.split(',')) {
  const d = join(dir, id);
  for (const f of ['etat.html', `${id}-repos.png`, `${id}-apres.png`, 'NOTE.md']) {
    const p = join(d, f);
    if (!existsSync(p)) ech.push(`${id}: ${f} absent`);
    else if (f.endsWith('.png') && statSync(p).size < 20000) ech.push(`${id}: ${f} trop petite`);
  }
  const p = join(d, 'etat.html');
  if (!existsSync(p)) continue;
  const h = readFileSync(p, 'utf8');
  for (const m of ["Loyer de l", 'Payé', '+ pièce']) if (!h.includes(m)) ech.push(`${id}: base v6a perdue (${m})`);
  if (/type=["']number["']/.test(h)) ech.push(`${id}: type="number"`);
  if (!new RegExp(`class=["'][^"']*\\b${id}-`).test(h)) ech.push(`${id}: aucune classe préfixée ${id}-`);
  if (/https?:\/\/(?!localhost)/.test(h.replace(/xmlns(:\w+)?="[^"]*"/g, ''))) ech.push(`${id}: appel réseau`);
  const note = existsSync(join(d, 'NOTE.md')) ? readFileSync(join(d, 'NOTE.md'), 'utf8').split('\n').length : 0;
  if (note > 14) ech.push(`${id}: NOTE.md ${note} lignes`);
}
console.log(ech.length ? 'SERIE ECHEC\n' + ech.join('\n') : 'SERIE OK');
process.exit(ech.length ? 1 : 0);
