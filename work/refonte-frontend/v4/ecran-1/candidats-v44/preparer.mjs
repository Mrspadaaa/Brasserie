// Candidats de la base v4.4 (#134) : la base v4.3 (radar D3 unique) + une loupe du rail.
// Chaque loupe ne change que etape-consolide.js et .css (sources/<id>/) ; la base n'est pas touchée.
// Usage : node preparer.mjs [id…]   (défaut : toutes les loupes de sources/)
// Sortie : candidats-v44/<id>/ (14 pages), puis
//   node ../../tournoi/outils/controle-rail.mjs . <id>   (dossier pNN ou version-…)
// Intégrer la loupe choisie = copier sources/<id>/* dans ../base/generateur/, puis node build.mjs.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ici = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const base = path.join(ici, '..', 'base', 'generateur');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(path.join(ici, 'sources'));
for (const id of ids) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'v44-' + id + '-'));
  const gen = path.join(tmp, 'generateur');
  fs.cpSync(base, gen, { recursive: true });
  for (const f of fs.readdirSync(path.join(ici, 'sources', id))) fs.copyFileSync(path.join(ici, 'sources', id, f), path.join(gen, f));
  execFileSync(process.execPath, ['build.mjs', '--out=' + path.join(tmp, 'out')], { cwd: gen, stdio: 'ignore' });
  const out = path.join(ici, id);
  fs.mkdirSync(out, { recursive: true });
  for (const p of fs.readdirSync(path.join(tmp, 'out', 'consolide'))) fs.copyFileSync(path.join(tmp, 'out', 'consolide', p), path.join(out, p));
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(id + ' : ' + fs.readdirSync(out).filter((p) => p.endsWith('.html')).length + ' pages');
}
