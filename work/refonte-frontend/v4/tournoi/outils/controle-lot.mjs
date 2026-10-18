// Contrôle d'un lot de maquettes en une commande (méthode v2, contrôles automatiques).
// Usage : node work/refonte-frontend/v4/tournoi/outils/controle-lot.mjs <dossier> [ids…]
//         [--mots=80] [--fill=0.8] [--boosters=4] [--tailles=3] [--paragraphe=2] [--radar] [--recette]
// Lance capture.mjs, mots-premier-ecran.mjs (index et etat-b) et jouer-boosters.mjs, puis
// vérifie pour chaque maquette : 0 erreur, pas de débordement, un écran à 390 en A et B,
// mots ≤ seuil en A et B, remplissage ≥ seuil en A et B, au moins N boosters distincts
// qui changent l'écran, et avec --radar un booster dont le nom contient « radar ».
// Imprime LOT OK si tout passe, sinon LOT ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find((x) => x.startsWith('--' + k + '=')); return a ? Number(a.split('=')[1]) : d; };
const maxMots = opt('mots', 80), minFill = opt('fill', 0.8), minBoost = opt('boosters', 4), maxTailles = opt('tailles', 3), maxPara = opt('paragraphe', 2);
const needRadar = args.includes('--radar');
const needRecette = args.includes('--recette');
const rest = args.filter((a) => !a.startsWith('--'));
const dir = path.resolve(rest[0]);
const only = rest.slice(1);
const tools = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
// Largeur du téléphone du brasseur (412 px) capturée en plus de 390 et 1280.
const run = (script, extra) => spawnSync(process.execPath, [path.join(tools, script), dir, ...only, ...extra], { encoding: 'utf8', env: { ...process.env, CAPTURE_EXTRA: '412' } });

const cap = run('capture.mjs', []);
const motsA = run('mots-premier-ecran.mjs', ['--max=' + maxMots]).stdout;
const motsB = run('mots-premier-ecran.mjs', ['--max=' + maxMots, '--page=etat-b.html']).stdout;
run('jouer-boosters.mjs', []);
const recette = needRecette ? run('controle-recette.mjs', []).stdout : '';
// D18 : avec --radar, le radar compare 2 à 4 houblons qui ont une silhouette.
const radar = needRadar ? run('controle-radar.mjs', []).stdout : '';
// D14 (suite) : tous les éléments interactifs touchés un à un, pas seulement les data-booster.
const fuite = run('fuite-touchers.mjs', []).stdout;
// D33 : avec --palette, une seule couleur d'alerte et aucun contour de focus après un toucher
// (en option : le lot 4 garde la baseline p03, qui ne le passe pas, hors de ses composants).
const palette = args.includes('--palette') ? run('controle-palette.mjs', []).stdout : 'PALETTE OK';
// D31, D32 : avec --detail, Ma bière au style + vue absolue, écarts chiffrés, gestes par famille.
const detail = args.includes('--detail') ? run('controle-detail.mjs', []).stdout : '';
// D27, D28 : avec --rail, la levure est une étape du rail et le moment se glisse le long du rail.
const rail = args.includes('--rail') ? run('controle-rail.mjs', []).stdout : '';
// D25 : avec --fiche, l'appui long (et le survol long à l'ordinateur) ouvre la fiche du houblon.
const fiche = args.includes('--fiche') ? run('controle-fiche.mjs', []).stdout : '';
// D26 : avec --baseline=<dossier>, tout ce qui est hors du composant reste celui de la baseline.
const baseArg = (args.find((a) => a.startsWith('--baseline=')) || '').slice(11);
const baseline = baseArg ? spawnSync(process.execPath, [path.join(tools, 'controle-baseline.mjs'), dir, path.resolve(baseArg), ...only], { encoding: 'utf8' }).stdout : '';
const parseMots = (s) => Object.fromEntries([...s.matchAll(/^(\S+) (\d+) mots/gm)].map((m) => [m[1], Number(m[2])]));
const mA = parseMots(motsA), mB = parseMots(motsB);
// D19 : chaque partie, chaque vue radar et chaque cas a le même budget de mots que l'étape
// (lot 3 : les radars et les cas K2, K3 échappaient au contrôle).
const autresPages = [...new Set(fs.readdirSync(dir).filter((d) => /^p\d+$|^consolide$|^version-/.test(d) && fs.existsSync(path.join(dir, d, 'index.html')))
  .flatMap((d) => fs.readdirSync(path.join(dir, d)).filter((f) => f.endsWith('.html') && f !== 'index.html' && f !== 'etat-b.html')))].sort();
const mParties = Object.fromEntries(autresPages.map((f) => [f.slice(0, -5), parseMots(run('mots-premier-ecran.mjs', ['--max=' + maxMots, '--page=' + f]).stdout)]));
// Écrans mesurés : toutes les pages à 390 (capture.mjs nomme les états supplémentaires
// <page>390) ; avant le lot 3, seules l'étape, l'état B, biere et comparer l'étaient.
const ecrans = { has: (k) => /390$/.test(k) };

const ids = fs.readdirSync(dir).filter((d) => /^p\d+$|^consolide$|^version-/.test(d) && fs.existsSync(path.join(dir, d, 'index.html')))
  .filter((d) => !only.length || only.includes(d)).sort();
const problems = [];
for (const id of ids) {
  const p = (m) => problems.push(id + ' : ' + m);
  const c = JSON.parse(fs.readFileSync(path.join(dir, 'captures', id + '.json'), 'utf8'));
  if (c.errors.length) p('erreurs de page ' + c.errors.length);
  for (const [k, v] of Object.entries(c)) {
    if (!v || typeof v !== 'object' || !('horizontalOverflow' in v)) continue;
    if (v.horizontalOverflow) p('débordement horizontal (' + k + ')');
    if (ecrans.has(k) && v.screens > 1.05) p('plus d\'un écran à 390 (' + k + ' : ' + v.screens + ')');
    if (ecrans.has(k) && v.fill < minFill) p('remplissage ' + v.fill + ' < ' + minFill + ' (' + k + ')');
    if (ecrans.has(k) && v.tailles > maxTailles) p(v.tailles + ' tailles de texte > ' + maxTailles + ' (' + k + ', effet cockpit)');
    if (k === 'w412' && v.screens > 1.05) p('plus d\'un écran à 412 (téléphone du brasseur : ' + v.screens + ')');
    if (ecrans.has(k) && v.paragraphe > maxPara) p('bloc de texte de ' + v.paragraphe + ' lignes > ' + maxPara + ' (' + k + ')');
  }
  for (const [partie, m] of Object.entries(mParties)) if (id in m && !(m[id] <= maxMots)) p('mots dans ' + partie + '.html : ' + m[id] + ' > ' + maxMots);
  if (!c.b390) p('état B absent (etat-b.html)');
  if (!(mA[id] <= maxMots)) p('mots en A : ' + mA[id] + ' > ' + maxMots);
  if (c.b390 && !(mB[id] <= maxMots)) p('mots en B : ' + mB[id] + ' > ' + maxMots);
  const bPath = path.join(dir, 'captures', 'boosters', id + '.json');
  const b = fs.existsSync(bPath) ? JSON.parse(fs.readFileSync(bPath, 'utf8')) : [];
  const ok = [...new Set(b.filter((r) => r.change && r.tapped && !r.errors.length).map((r) => r.nom))];
  if (ok.length < minBoost) p('boosters qui marchent : ' + ok.length + ' < ' + minBoost);
  // D14 : une fuite de texte technique après un toucher fait échouer, même si d'autres boosters marchent.
  for (const r of b) for (const e of r.errors) if (/texte technique/.test(e)) p('D14 ' + r.page + ' « ' + r.nom + ' » : ' + e);
  if (needRadar && !ok.some((n) => /radar/i.test(n))) p('pas de bascule radar qui marche');
  console.log(id + ' · mots A ' + mA[id] + ' B ' + (mB[id] ?? '–') + ' · remplissage A ' + c.w390?.fill + ' B ' + (c.b390?.fill ?? '–') + ' · boosters ' + ok.length);
}
if (!/FUITE OK/.test(fuite)) for (const l of fuite.split('\n').filter((x) => /^  /.test(x))) problems.push(l.trim() + ' (D14 fuite)');
if (!/PALETTE OK/.test(palette)) for (const l of palette.split('\n').filter((x) => /^  /.test(x))) problems.push(l.trim() + ' (D33 palette)');
if (args.includes('--detail') && !/DETAIL OK/.test(detail)) for (const l of detail.split('\n').filter((x) => /^  /.test(x))) problems.push(l.trim() + ' (D31-D32 détail)');
if (args.includes('--rail') && !/RAIL OK/.test(rail)) for (const l of rail.split('\n').filter((x) => /^  /.test(x))) problems.push(l.trim() + ' (D27-D28 rail)');
if (args.includes('--fiche') && !/FICHE OK/.test(fiche)) for (const l of fiche.split('\n').filter((x) => /^  /.test(x))) problems.push(l.trim() + ' (D25 fiche)');
if (baseArg && !/BASELINE OK/.test(baseline)) for (const l of baseline.split('\n').filter((x) => /^  /.test(x))) problems.push(l.trim() + ' (D26 baseline)');
if (needRadar && !/RADAR OK/.test(radar)) for (const l of radar.split('\n').filter((x) => /^  /.test(x))) problems.push(l.trim() + ' (D18 radar)');
if (needRecette && !/RECETTE OK/.test(recette)) for (const l of recette.split('\n').filter((x) => /^  /.test(x))) problems.push(l.trim() + ' (D13 recette)');
if (problems.length === 0) console.log('LOT OK ' + ids.length + '/' + ids.length);
else { console.log('LOT ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exitCode = 1; }
if (cap.status !== 0) console.log('(capture : ' + cap.stdout.trim().split('\n').pop() + ')');
