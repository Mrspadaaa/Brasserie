#!/usr/bin/env node
// Règle n° 1 (23.10) : « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » Puis : « Met ça
// dès les informations et fait en sorte que ça m'arrive plus jamais ». La maquette jouable avait repris la carte en
// fil de fer au lieu de q2b et de la base v4.10, et tous les contrôles étaient verts (D105) : aucun ne comparait un
// écran à la maquette qu'il avait choisie.
//
// LE REGISTRE (versionné) : work/refonte-frontend/v4/choix/ecrans.json, { maj, regle, usage, ecrans: [ … ] }.
// Un écran : ecran, route (la page <dossier>/<route>/etat.html), statut (« choisi » ou « ouvert »), puis :
//   - choisi : choix, mots (sa phrase mot pour mot, retrouvée dans SPEC-BRASSEUR.md), capture (qui existe), et
//     inventaire (joué par controle-reprise.mjs) et/ou controles (commandes, « {dossier} » remplacé) ;
//   - ouvert : options (deux au moins), provisoire, page (l'adresse où il choisit).
//
// Usage : node controle-choix.mjs <dossier construit> [--registre=chemin] [--ecran=<ecran>]
//   → « CHOIX OK (n écrans conformes à son choix ; o ouverts : … ) » (code 0), ou « CHOIX ECHEC » et, par écran,
//     ce qui diverge (code 1). Un écran choisi dont la page manque est un échec : ne pas le montrer sans lui.
//   node controle-choix.mjs --registre[=chemin]
//     → « REGISTRE OK (n écrans) » : le registre seul (mots retrouvés, captures, inventaires valides).
// Témoin : la maquette jouable du 23.10 (avant la reprise D105) → CHOIX ECHEC sur l'étape Houblons, Ma bière,
// Suggérer et Comparer.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ici, '..', '..', '..', '..', '..');
const SPEC = path.join(RACINE, 'work', 'refonte-frontend', 'v4', 'SPEC-BRASSEUR.md');
const REGISTRE_DEFAUT = path.join(RACINE, 'work', 'refonte-frontend', 'v4', 'choix', 'ecrans.json');
const args = process.argv.slice(2);
const opt = (nom) => { const a = args.find((x) => x.startsWith(`--${nom}=`)); return a ? a.slice(nom.length + 3) : null; };
const pos = args.filter((a) => !a.startsWith('--'));
const modeRegistre = args.some((a) => a === '--registre');
const cheminRegistre = path.resolve(RACINE, opt('registre') ?? REGISTRE_DEFAUT);
const seul = opt('ecran');

const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const spec = norm(fs.readFileSync(SPEC, 'utf8'));
const registre = JSON.parse(fs.readFileSync(cheminRegistre, 'utf8'));

// 1. Le registre lui-même.
const fautes = [];
for (const e of registre.ecrans ?? []) {
  const nom = e.ecran ?? '(sans nom)';
  if (!e.route) fautes.push(`${nom} : pas de route`);
  if (e.statut === 'choisi') {
    if (!e.choix) fautes.push(`${nom} : choix absent`);
    if (!e.mots || !spec.includes(norm(e.mots))) fautes.push(`${nom} : ses mots ne se retrouvent pas dans SPEC-BRASSEUR (« ${norm(e.mots ?? '').slice(0, 60)} »)`);
    if (!e.capture || !fs.existsSync(path.resolve(RACINE, e.capture))) fautes.push(`${nom} : capture absente (${e.capture})`);
    if (!e.inventaire && !(e.controles ?? []).length) fautes.push(`${nom} : ni inventaire ni contrôle : rien ne vérifie son choix`);
    if (e.inventaire) {
      const r = spawnSync(process.execPath, [path.join(ici, 'controle-reprise.mjs'), '--inventaire', path.resolve(RACINE, e.inventaire)], { cwd: RACINE, encoding: 'utf8' });
      if (r.status !== 0) fautes.push(`${nom} : inventaire invalide (${(r.stdout + r.stderr).trim().split('\n').slice(-2).join(' ; ')})`);
    }
  } else if (e.statut === 'ouvert') {
    if (!Array.isArray(e.options) || e.options.length < 2) fautes.push(`${nom} : choix ouvert sans deux options`);
    if (!e.page) fautes.push(`${nom} : choix ouvert sans la page où il choisit`);
  } else fautes.push(`${nom} : statut « ${e.statut} » (choisi ou ouvert)`);
}
if (modeRegistre) {
  if (fautes.length) { console.log('REGISTRE ECHEC'); for (const f of fautes) console.log('  - ' + f); process.exit(1); }
  console.log(`REGISTRE OK (${registre.ecrans.length} écrans)`);
  process.exit(0);
}
if (!pos[0]) { console.log('Usage : node controle-choix.mjs <dossier construit> [--registre=chemin] [--ecran=<ecran>]'); process.exit(2); }
const dossier = path.resolve(RACINE, pos[0]);

// 2. Chaque écran choisi, contre sa maquette.
const divergences = [];
const conformes = [];
const ouverts = [];
for (const e of registre.ecrans) {
  if (seul && e.ecran !== seul) continue;
  if (e.statut === 'ouvert') { ouverts.push(`${e.ecran} (${e.provisoire} en attendant)`); continue; }
  const page = path.join(dossier, e.route, 'etat.html');
  if (!fs.existsSync(page)) { divergences.push(`${e.ecran} : page absente (${path.relative(RACINE, page)})`); continue; }
  const sorties = [];
  if (e.inventaire) {
    const r = spawnSync(process.execPath, [path.join(ici, 'controle-reprise.mjs'), dossier, e.route, '--page=etat.html', `--inventaire=${path.resolve(RACINE, e.inventaire)}`], { cwd: RACINE, encoding: 'utf8' });
    if (r.status !== 0) sorties.push(`ne reprend pas ${e.choix} : ${(r.stdout + r.stderr).trim().split('\n').filter((l) => l.trim().startsWith('-') || /ECHEC/.test(l)).slice(0, 6).join(' ; ')}`);
  }
  for (const c of e.controles ?? []) {
    const [script, ...rest] = c.split(' ').map((x) => x.split('{dossier}').join(dossier));
    const r = spawnSync(process.execPath, [path.resolve(RACINE, script), ...rest], { cwd: RACINE, encoding: 'utf8' });
    if (r.status !== 0) sorties.push(`${path.basename(script)} : ${(r.stdout + r.stderr).trim().split('\n').slice(-2).join(' ; ')}`);
  }
  if (sorties.length) divergences.push(`${e.ecran} (choix : ${e.choix}) : ${sorties.join(' | ')}`);
  else conformes.push(e.ecran);
}
const resume = `${conformes.length} écran(s) conforme(s) à son choix ; ${ouverts.length} ouvert(s)${ouverts.length ? ' : ' + ouverts.join(', ') : ''}`;
if (fautes.length || divergences.length) {
  console.log(`CHOIX ECHEC (${resume})`);
  for (const f of [...fautes, ...divergences]) console.log('  - ' + f);
  process.exit(1);
}
console.log(`CHOIX OK (${resume})`);
