#!/usr/bin/env node
// Registre unique des bugs : aucun constat ne se perd (08.11, brasseur : « Il faut pas perdre les bug finding. J'ai l'impression que c'est
// en partie ce qui c'est passé.... » ; « Il faut pas que ça se reproduise c'est critique met en place un mécanisme »).
// Le 08.11, des notes « non compté », « à suivre » (facture déjà saisie non signalée, couleur 2,5 affichée 6,3) n'avaient jamais eu de suite.
//
// Contrôle work/missions/BUGS.md contre tous les rapports de constats :
//   1. chaque RAPPORT*.md de work/missions/ (depuis le 07.11) et de %TEMP%/affinee-*/ est une source du registre (« ## Sources ») ;
//   2. chaque source a au registre au moins autant de lignes (préfixe d'id) que de constats + notes déclarés ;
//   3. chaque id « PRÉFIXE-n » cité dans un rapport existe au registre ;
//   4. chaque état est connu ; « corrigé », « déployé », « vérifié » portent un commit qui existe.
// Un rapport sans bug se déclare par la ligne `<!-- registre : hors bugs -->`.
//
// Usage : node scripts/agents/controle-bugs.mjs          → « BUGS OK … » ou « BUGS ECHEC » et la liste (code 1)
//         node scripts/agents/controle-bugs.mjs --hook   → hook Stop : code 2 et message à la session si un rapport est plus récent que
//                                                          le registre ou si le registre est faux ; laisse passer au second arrêt.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REGISTRE = path.join(RACINE, 'work', 'missions', 'BUGS.md');
const DEPUIS = new Date('2026-11-07T00:00:00+01:00').getTime();
const ETATS = ['ouvert', 'en cours', 'corrigé', 'déployé', 'vérifié', 'écarté', 'doublon'];
const AVEC_COMMIT = ['corrigé', 'déployé', 'vérifié'];
const HORS = /<!--\s*registre\s*:\s*hors bugs\s*-->/i;

const norm = (p) => path.resolve(p).toLowerCase().replace(/\\/g, '/');

function chercher(dir, profondeur, garder, acc = []) {
  let entrees = [];
  try { entrees = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entrees) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (profondeur > 0 && !/^(node_modules|captures|\.git)$/.test(e.name)) chercher(p, profondeur - 1, garder, acc); }
    else if (garder(e.name, p)) acc.push(p);
  }
  return acc;
}

export function rapports() {
  const estRapport = (n) => /^RAPPORT.*\.md$/i.test(n);
  const recent = (p) => { try { return fs.statSync(p).mtimeMs >= DEPUIS; } catch { return false; } };
  const depot = chercher(path.join(RACINE, 'work', 'missions'), 4, (n, p) => estRapport(n) && recent(p));
  const tmp = [];
  for (const e of fs.readdirSync(os.tmpdir(), { withFileTypes: true })) {
    if (e.isDirectory() && /^affinee-/.test(e.name)) chercher(path.join(os.tmpdir(), e.name), 2, (n, p) => estRapport(n) && recent(p), tmp);
  }
  return [...depot, ...tmp].filter((p) => !HORS.test(fs.readFileSync(p, 'utf8')));
}

const cellules = (ligne) => ligne.split('|').slice(1, -1).map((c) => c.trim());

export function lireRegistre(texte) {
  const sources = [];
  const bugs = [];
  let dansSources = false;
  for (const ligne of texte.split(/\r?\n/)) {
    if (/^##\s/.test(ligne)) dansSources = /^##\s+Sources/i.test(ligne);
    if (!ligne.startsWith('|') || /^\|\s*-/.test(ligne)) continue;
    const c = cellules(ligne);
    if (dansSources) {
      if (/^chemin$/i.test(c[0])) continue;
      sources.push({ chemin: c[0].replace(/`/g, ''), prefixe: c[1].replace(/`/g, ''), constats: Number(c[2]) || 0, notes: Number(c[3]) || 0,
        empreinte: (c[4] ?? '').replace(/`/g, '').trim() });
      continue;
    }
    const m = /^([A-Z][A-Z0-9]*)(-NOTE)?-(\d+)$/.exec(c[0] ?? '');
    if (m) bugs.push({ id: c[0], prefixe: m[1], etat: (c[5] ?? '').toLowerCase(), commit: (c[6] ?? '').replace(/`/g, '') });
  }
  return { sources, bugs };
}

export const empreinte = (p) => createHash('sha1').update(fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n')).digest('hex').slice(0, 12);

const commitExiste =(h) => { try { execFileSync('git', ['cat-file', '-e', `${h}^{commit}`], { cwd: RACINE, stdio: 'ignore' }); return true; } catch { return false; } };

export function controler() {
  const erreurs = [];
  if (!fs.existsSync(REGISTRE)) return { erreurs: [`registre absent : ${path.relative(RACINE, REGISTRE)}`], nouveaux: rapports() };
  const { sources, bugs } = lireRegistre(fs.readFileSync(REGISTRE, 'utf8'));
  const ids = new Set(bugs.map((b) => b.id));
  const resoudre = (c) => (path.isAbsolute(c) ? c : path.join(RACINE, c)).replace(/%TEMP%/i, os.tmpdir());
  const connues = new Map(sources.map((s) => [norm(resoudre(s.chemin)), s]));
  const nouveaux = [];
  for (const r of rapports()) {
    if (!connues.has(norm(r))) { erreurs.push(`rapport non versé au registre : ${r}`); nouveaux.push(r); continue; }
    const s = connues.get(norm(r));
    for (const m of fs.readFileSync(r, 'utf8').matchAll(new RegExp(`\\b${s.prefixe}(?:-NOTE)?-\\d+\\b`, 'g'))) {
      if (!ids.has(m[0])) erreurs.push(`${m[0]} cité dans ${path.basename(path.dirname(r))}/${path.basename(r)}, absent du registre`);
    }
  }
  for (const s of sources) {
    const p = resoudre(s.chemin);
    if (!fs.existsSync(p)) { if (!/brasseur|capture|\.jpe?g$|\.png$/i.test(s.chemin)) erreurs.push(`source introuvable : ${s.chemin}`); }
    // Empreinte obligatoire pour un rapport de constats ; un document vivant (SUIVI, DEFAUTS, PLAN) la porte s'il veut.
    else if (/\.md$/i.test(p) && (/^RAPPORT/i.test(path.basename(p)) || s.empreinte)) {
      // Empreinte du rapport au moment où il a été versé : un rapport qui grandit après son versement (constats ajoutés au fil) échoue
      // tant que ses ajouts ne sont pas versés (trou vu le 08.11 : le compte seul ne voyait pas un constat de plus).
      // « en cours » : rapport d'un agent qui écrit encore ; toléré tant qu'il a bougé depuis moins de 2 h.
      const actuelle = empreinte(p);
      if (/^en cours$/i.test(s.empreinte)) {
        if (Date.now() - fs.statSync(p).mtimeMs > 2 * 3600e3) erreurs.push(`${s.chemin} : « en cours » mais immobile depuis plus de 2 h : verse-le et pose son empreinte ${actuelle}`);
      } else if (!s.empreinte) erreurs.push(`${s.chemin} : empreinte absente (colonne 5 de Sources) ; une fois versé : ${actuelle}`);
      else if (s.empreinte !== actuelle) erreurs.push(`${s.chemin} : modifié depuis son versement (empreinte ${s.empreinte} → ${actuelle}) ; verse les ajouts puis pose ${actuelle}`);
    }
    const n = bugs.filter((b) => b.prefixe === s.prefixe).length;
    if (n < s.constats + s.notes) erreurs.push(`${s.prefixe} : ${n} lignes au registre pour ${s.constats} constats et ${s.notes} notes (${s.chemin})`);
  }
  for (const b of bugs) {
    const etat = ETATS.find((e) => b.etat.startsWith(e));
    if (!etat) { erreurs.push(`${b.id} : état inconnu « ${b.etat} »`); continue; }
    if (AVEC_COMMIT.includes(etat)) {
      const h = /\b[0-9a-f]{7,40}\b/.exec(b.commit)?.[0];
      if (!h) erreurs.push(`${b.id} : « ${etat} » sans commit`);
      else if (!commitExiste(h)) erreurs.push(`${b.id} : commit ${h} introuvable`);
    }
  }
  const ouverts = bugs.filter((b) => /^(ouvert|en cours)/.test(b.etat)).length;
  return { erreurs, nouveaux, bugs: bugs.length, sources: sources.length, ouverts };
}

const estPrincipal = process.argv[1] && norm(process.argv[1]) === norm(fileURLToPath(import.meta.url));
if (estPrincipal) {
  const hook = process.argv.includes('--hook');
  if (hook) {
    let brut = '';
    for await (const m of process.stdin) brut += m;
    let entree = {};
    try { entree = JSON.parse(brut || '{}'); } catch { /* rien */ }
    if (entree.stop_hook_active) process.exit(0);
  }
  const r = controler();
  if (!r.erreurs.length) {
    if (!hook) console.log(`BUGS OK : ${r.bugs} bugs, ${r.ouverts} ouverts, ${r.sources} sources`);
    process.exit(0);
  }
  const liste = r.erreurs.slice(0, 25).map((e) => `- ${e}`).join('\n') + (r.erreurs.length > 25 ? `\n- … ${r.erreurs.length - 25} de plus` : '');
  if (hook) {
    process.stderr.write(`REGISTRE DES BUGS (hook controle-bugs) : un constat risque de se perdre. Verse chaque constat dans work/missions/BUGS.md `
      + `(format en tête du fichier : section Sources, une ligne par constat et par note, état, commit), puis `
      + `node scripts/agents/controle-bugs.mjs. Si la session monitoring tient le registre, préviens-la au lieu d'écrire.\n${liste}\n`);
    process.exit(2);
  }
  console.log(`BUGS ECHEC (${r.erreurs.length})\n${liste}`);
  process.exit(1);
}
