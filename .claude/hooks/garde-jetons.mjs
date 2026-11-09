#!/usr/bin/env node
// Garde des jetons (09.11, ses mots : « Token pour la qualité » ; « pas pour du va et vient inutile !!! » ;
// « Met en place un mécanisme pour ces Token pour plus que ça arrive »). Leçon L18. Deux verrous, en PreToolUse :
//  1. SendMessage : au plus 2 relances d'un même agent par session. La 3e est refusée : regrouper les retouches en un
//     message, ou réécrire le contrat (VOIE.md) et le dire en commençant le message par « [CONTRAT RÉÉCRIT] ».
//  2. Agent : une voie ne part pas sans brief complet. Le VOIE.md qu'elle cite doit dire RESULTAT.md tenu au fil,
//     la ligne « Tests » écrite dans un fichier, et, pour une voie qui touche un écran, les captures ouvertes.
// Sortie 2 = l'appel est refusé, le message (stderr) revient au pilote. Toute erreur de lecture laisse passer (sortie 0).
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

let brut = '';
for await (const morceau of process.stdin) brut += morceau;
let e;
try { e = JSON.parse(brut || '{}'); } catch { process.exit(0); }
const outil = e.tool_name, entree = e.tool_input ?? {};
const racine = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const refuser = (texte) => { process.stderr.write(`GARDE-JETONS : ${texte}\n`); process.exit(2); };

if (outil === 'SendMessage') {
  const vers = String(entree.to ?? '').trim();
  const message = String(entree.message ?? '');
  if (!vers || vers === 'main' || !message) process.exit(0);
  const dossier = path.join(os.tmpdir(), 'affinee-garde-jetons'); // hors du dépôt
  const fichier = path.join(dossier, `relances-${String(e.session_id ?? 'session').replace(/[^\w-]/g, '')}.json`);
  let compte = {};
  try { compte = JSON.parse(fs.readFileSync(fichier, 'utf8')); } catch { /* premier passage */ }
  const contratReecrit = /^\s*\[CONTRAT RÉÉCRIT\]/.test(message);
  const n = (compte[vers] ?? 0) + 1;
  if (n > 2 && !contratReecrit) {
    refuser(`3e relance de ${vers} refusée (L18 : 2 relances au plus). Regroupe toutes les retouches de cette voie en un seul message, `
      + `ou réécris son VOIE.md et commence le message par « [CONTRAT RÉÉCRIT] ». Une relance pour un détail coûte une reprise complète du contexte de l'agent.`);
  }
  compte[vers] = contratReecrit ? 0 : n;
  try { fs.mkdirSync(dossier, { recursive: true }); fs.writeFileSync(fichier, JSON.stringify(compte)); } catch { /* sans état, on laisse passer */ }
  process.exit(0);
}

if (outil === 'Agent') {
  const prompt = String(entree.prompt ?? '');
  const m = prompt.match(/(?:[A-Za-z]:)?[\w\\/.\-]*voies[\\/][\w.-]+[\\/]VOIE\.md/i);
  if (!m) process.exit(0); // agent hors voie (recherche, critique, conseil) : pas de contrat à lire
  let chemin = m[0].trim();
  if (!path.isAbsolute(chemin)) chemin = path.join(racine, chemin);
  let voie;
  try { voie = fs.readFileSync(chemin, 'utf8'); } catch { refuser(`le VOIE.md cité est introuvable : ${chemin}`); }
  const manque = [];
  if (!/RESULTAT\.md/.test(voie) || !/(au fil|tous les \d+|à chaque étape|mis à jour)/i.test(voie)) manque.push('RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre)');
  if (!/(reporter=dot|ligne « Tests »|ligne \"Tests\")/i.test(voie)) manque.push('la ligne « Tests » écrite dans un fichier (--reporter=dot > …)');
  // Voie d'écran : ce qu'elle possède touche une interface (lu après « Possède »).
  const i = voie.search(/Possède/);
  const ecran = i >= 0 && /(src[\\/]ui|src[\\/]pages|src[\\/]components|\.css)/i.test(voie.slice(i, i + 900));
  if (ecran && !/captures?/i.test(voie)) manque.push('les captures 390 et 1280, ouvertes (voie qui touche un écran)');
  if (manque.length) refuser(`brief incomplet (${path.relative(racine, chemin)}), il manque : ${manque.join(' ; ')}. Complète le VOIE.md avant de lancer : chaque oubli coûte une relance.`);
  process.exit(0);
}
process.exit(0);
