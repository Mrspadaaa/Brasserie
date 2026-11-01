// Rejoue le lanceur commun (profil sans-houblons) sur chacun des 48 concepts de v0/, puis le contrôle de panel sur leurs
// 48 captures du haut. Un concept à la fois (le S4 de standard cumule les traits sur toutes les pages passées ensemble).
// Usage : node tableau-48.mjs --sortie=<fichier.json> [--outils=<dossier des outils>] [--profil=sans-houblons|houblons]
// Écrit un JSON { concepts: { id: { controle: { etat, detail[] } } }, panel: { sortie } } ; le tableau se lit avec
// `node tableau-48.mjs --lire=<fichier.json> [--avant=<autre.json>]`.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const val = (k) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const V0 = path.join(ici, '../../v0');
const IDS = [];
for (const s of ['e', 'g', 'i', 'r', 'u', 'v', 'w', 'z']) for (let n = 1; n <= 6; n++) IDS.push(`${s}${n}`);

const run = (script, a, outils) => new Promise((ok) => {
  const p = spawn(process.execPath, [path.join(outils, script), ...a], { cwd: ici });
  let out = '';
  p.stdout.on('data', (d) => { out += d; });
  p.stderr.on('data', (d) => { out += d; });
  p.on('close', (code) => ok({ out, code }));
});

function lire(fichier, avant) {
  const j = JSON.parse(fs.readFileSync(fichier, 'utf8'));
  const a = avant ? JSON.parse(fs.readFileSync(avant, 'utf8')) : null;
  const noms = [...new Set(IDS.flatMap((id) => Object.keys(j.concepts[id] || {})))];
  const cell = (c) => (!c ? '—' : c.etat === 'OK' ? 'ok' : c.etat === 'sauté' ? 'sauté' : 'ECHEC');
  console.log('| concept | ' + noms.join(' | ') + ' | verdict |');
  console.log('|---|' + noms.map(() => '---').join('|') + '|---|');
  for (const id of IDS) {
    const c = j.concepts[id] || {};
    const ko = noms.filter((n) => c[n] && c[n].etat === 'ECHEC');
    console.log(`| ${id} | ` + noms.map((n) => cell(c[n])).join(' | ') + ` | ${ko.length ? 'ÉCHEC ' + ko.join(', ') : 'PASSE'} |`);
  }
  console.log('\nÉchecs, avec leur cause :');
  for (const id of IDS) for (const n of noms) {
    const c = (j.concepts[id] || {})[n];
    if (c && c.etat === 'ECHEC') console.log(`- ${id} · ${n} : ${c.detail.join(' / ').slice(0, 300)}`);
  }
  if (a) {
    console.log('\nDifférences avec la version d’avant (HEAD) :');
    for (const id of IDS) for (const n of noms) {
      const x = (a.concepts[id] || {})[n], y = (j.concepts[id] || {})[n];
      if ((x && x.etat) !== (y && y.etat)) console.log(`- ${id} · ${n} : ${x && x.etat} -> ${y && y.etat}`);
    }
  }
  console.log('\nPanel : ' + (j.panel ? j.panel.sortie.trim() : '—'));
  if (a && a.panel) console.log('Panel (avant) : ' + a.panel.sortie.trim().split('\n').slice(0, 3).join(' | '));
}

if (val('lire')) { lire(val('lire'), val('avant')); process.exit(0); }

const outils = path.resolve(val('outils') || path.join(ici, '../../../../refonte-frontend/v4/tournoi/outils'));
const profil = val('profil') || 'sans-houblons';
const sortie = val('sortie');
if (!sortie) { console.log('Usage : --sortie=<fichier.json>'); process.exit(2); }
const res = { profil, outils, concepts: {}, panel: null };
const file = [...IDS];
const travailleur = async () => {
  while (file.length) {
    const id = file.shift();
    const r = await run('controle-commun.mjs', [V0, id, '--page=etat.html', `--profil=${profil}`], outils);
    const c = {};
    let courant = null;
    for (const l of r.out.split('\n')) {
      const m = l.match(/^(\S+)\s+(OK|ECHEC|sauté)\b(.*)$/);
      if (m && !/^COMMUN/.test(l)) { courant = m[1]; c[courant] = { etat: m[2], detail: m[2] === 'sauté' ? [m[3].trim()] : [] }; }
      else if (courant && /^\s{2,}\S/.test(l) && c[courant].etat === 'ECHEC') c[courant].detail.push(l.trim());
    }
    res.concepts[id] = c;
    console.log(id + ' ' + (r.code === 0 ? 'COMMUN OK' : 'COMMUN ECHEC'));
  }
};
await Promise.all([travailleur(), travailleur(), travailleur(), travailleur()]);
const caps = IDS.map((id) => path.join(V0, id, fs.existsSync(path.join(V0, id, `${id}-haut.png`)) ? `${id}-haut.png` : 'capture-haut.png'));
const p = await run('controle-panel.mjs', caps, outils);
res.panel = { sortie: p.out, code: p.code };
fs.writeFileSync(sortie, JSON.stringify(res, null, 1));
console.log('écrit ' + sortie);
