// Vérifie que chaque étape du tournoi a été menée jusqu'au bout.
// Usage : node work/refonte-frontend/v4/tournoi/outils/check-tournoi.mjs [M1 M2 …]
// Par défaut : M1 à M5. Témoin négatif : passer une étape inexistante (ex. M9) échoue.
//
// Par étape <Mx>/ :
//   pNN/index.html (au moins 6), captures/pNN-390.png et pNN-1280.png pour chacun,
//   jury/verdict.json : { blind: true, scores: {pNN: {creativite, clarte, verite,
//     densite, faisabilite, total, mensonge}}, ranking: [pNN…],
//     eliminated: [{id, reason}], finalists: [{id, grafts: [..]}] },
//   consolide/index.html et consolide/NOTE.md (chaque greffe cite son pNN).
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('work/refonte-frontend/v4/tournoi');
const steps = process.argv.slice(2).length ? process.argv.slice(2) : ['M1', 'M2', 'M3', 'M4', 'M5'];
const problems = [];
const summary = [];

for (const step of steps) {
  const dir = path.join(ROOT, step);
  if (!fs.existsSync(dir)) { problems.push(step + ' : dossier absent'); continue; }
  const protos = fs.readdirSync(dir).filter((d) => /^p\d+$/.test(d) && fs.existsSync(path.join(dir, d, 'index.html')));
  if (protos.length < 6) problems.push(step + ' : ' + protos.length + ' mini-prototypes (6 au moins)');
  for (const id of protos) {
    for (const w of ['390', '1280']) {
      if (!fs.existsSync(path.join(dir, 'captures', id + '-' + w + '.png'))) problems.push(step + '/' + id + ' : capture ' + w + ' absente');
    }
  }
  const vPath = path.join(dir, 'jury', 'verdict.json');
  if (!fs.existsSync(vPath)) { problems.push(step + ' : verdict du jury absent'); continue; }
  let v;
  try { v = JSON.parse(fs.readFileSync(vPath, 'utf8')); } catch (e) { problems.push(step + ' : verdict illisible'); continue; }
  if (v.blind !== true) problems.push(step + ' : jury non déclaré à l\'aveugle');
  const scored = Object.keys(v.scores || {});
  const unscored = protos.filter((id) => !scored.includes(id));
  if (unscored.length) problems.push(step + ' : non notés ' + unscored.join(', '));
  for (const [id, s] of Object.entries(v.scores || {})) {
    for (const k of ['creativite', 'clarte', 'verite', 'densite', 'faisabilite', 'total']) {
      if (typeof s[k] !== 'number') problems.push(step + '/' + id + ' : note ' + k + ' manquante');
    }
  }
  const elim = v.eliminated || [];
  if (elim.length < Math.floor(protos.length / 2)) problems.push(step + ' : ' + elim.length + ' éliminés (moitié attendue : ' + Math.floor(protos.length / 2) + ')');
  for (const e of elim) if (!e.reason || e.reason.length < 15) problems.push(step + '/' + e.id + ' : raison d\'élimination absente ou vide');
  const liars = Object.entries(v.scores || {}).filter(([, s]) => s.mensonge).map(([id]) => id);
  const fin = (v.finalists || []).map((f) => f.id);
  for (const id of liars) if (fin.includes(id)) problems.push(step + '/' + id + ' : finaliste alors qu\'il ment sur les données');
  if (fin.length === 0) problems.push(step + ' : aucun finaliste');
  const note = path.join(dir, 'consolide', 'NOTE.md');
  if (!fs.existsSync(path.join(dir, 'consolide', 'index.html')) || !fs.existsSync(note)) problems.push(step + ' : consolidation absente');
  else {
    const t = fs.readFileSync(note, 'utf8');
    const cites = fin.filter((id) => t.includes(id));
    if (cites.length < Math.min(2, fin.length)) problems.push(step + ' : la consolidation ne cite pas ses sources (' + cites.length + ' finaliste cité)');
  }
  summary.push(step + ' ' + protos.length + ' protos, ' + elim.length + ' éliminés, ' + fin.length + ' finalistes');
}

for (const s of summary) console.log(s);
if (problems.length === 0) console.log('TOURNOI OK');
else {
  console.log('TOURNOI ECHEC : ' + problems.length + ' problème(s)');
  for (const p of problems.slice(0, 30)) console.log('  ' + p);
  process.exitCode = 1;
}
