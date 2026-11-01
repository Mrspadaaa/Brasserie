#!/usr/bin/env node
// Témoin du bloc AJOUT de controle-gestes-ligne.mjs (D230) : le contrôle doit ÉCHOUER sur une version où l'ajout ne désigne aucune ligne
// (ni plateau qui la nomme, ni curseur dans sa masse). La version : la maquette s1 dont `ajouter()` ne choisit pas la ligne ajoutée et ne
// donne le focus à rien ; écrite dans le dossier temporaire (jamais dans le dépôt, L17). Sortie attendue : « TEMOIN OK » (le contrôle a échoué).
// Usage : node temoin-gestes.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const SRC = path.join(RACINE, 'work/missions/2026-10-31-ecran-fermentescibles/v7/s1/etat.html');
const CONTROLE = path.join(RACINE, 'work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs');
let t = fs.readFileSync(SRC, 'utf8');
const av = "st.sel=st.r.length-1;rendre(st.sel);\n  if(kg==null)versMasse(st.sel);else q('[data-role=\"ajout\"]').focus();";
if (t.split(av).length !== 2) { console.log('TEMOIN ECHEC : ancre de la maquette introuvable'); process.exit(1); }
t = t.split(av).join('rendre();');
const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'temoin-ajout-'));
const page = path.join(dossier, 'etat.html');
fs.writeFileSync(page, t);
const r = spawnSync(process.execPath, [CONTROLE, page], { cwd: RACINE, encoding: 'utf8' });
const sortie = (r.stdout + r.stderr).trim().split('\n').filter((l) => /AJOUT|GESTES/.test(l));
for (const l of sortie) console.log(l);
console.log(r.status === 1 && sortie.some((l) => /^ECHEC\s+AJOUT 390/.test(l)) && sortie.some((l) => /^ECHEC\s+AJOUT 1280/.test(l))
  ? 'TEMOIN OK (le contrôle échoue à 390 tactile et à 1280 souris quand l\'ajout ne désigne aucune ligne)'
  : 'TEMOIN ECHEC (le contrôle n\'a pas échoué sur la version sans ligne désignée)');
fs.rmSync(dossier, { recursive: true, force: true });
