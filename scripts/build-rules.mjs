#!/usr/bin/env node
/**
 * Génère `firestore.rules` depuis `firestore.rules.template` et `.env`.
 *
 * ⚠️ CE QUE ÇA RÈGLE, et c'est une panne qui a réellement eu lieu. Le dépôt est
 * devenu public, l'adresse autorisée a donc été retirée des règles et remplacée
 * par `proprietaire@exemple.ch`, avec un commentaire disant de remettre la
 * vraie avant de déployer. `DEPLOY.md`, lui, continuait d'annoncer
 * `firebase deploy --only firestore`. Un déploiement plus tard, les règles en
 * production n'autorisaient plus personne : plus aucune donnée ne remontait, et
 * l'application annonçait « ce compte n'est pas autorisé ».
 *
 * Un commentaire n'est pas un mécanisme. Les règles sont désormais GÉNÉRÉES :
 * le fichier déployé porte toujours les vraies adresses, et le fichier versionné
 * n'en porte aucune.
 *
 * Le script refuse de produire des règles qui verrouilleraient la base : sans
 * adresse lisible dans `.env`, il s'arrête au lieu d'écrire une liste vide.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GABARIT = path.join(racine, 'firestore.rules.template');
const SORTIE = path.join(racine, 'firestore.rules');
const ENV = path.join(racine, '.env');
const JETON = '__AUTHORIZED_ACCOUNTS__';

/** Lit une variable de `.env`, sans dépendance. */
function lireEnv(cle) {
  if (!fs.existsSync(ENV)) return '';
  for (const ligne of fs.readFileSync(ENV, 'utf8').split(/\r?\n/)) {
    const t = ligne.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    if (t.slice(0, i).trim() !== cle) continue;
    return t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return '';
}

function echouer(message, remede) {
  console.error(`\n❌ ${message}\n`);
  console.error(`   ${remede}\n`);
  process.exit(1);
}

if (!fs.existsSync(GABARIT)) {
  echouer(
    'firestore.rules.template est introuvable.',
    'Il fait partie du dépôt : vérifie que le clone est complet.'
  );
}

const comptes = lireEnv('VITE_AUTHORIZED_ACCOUNTS')
  .split(',')
  .map((a) => a.trim().toLowerCase())
  .filter(Boolean);

/*
 * ⚠️ Le garde-fou principal. Déployer des règles sans adresse autorisée ferme
 * la base à tout le monde, y compris à celui qui déploie — et il faut alors
 * passer par la console Google pour se rouvrir l'accès.
 */
if (comptes.length === 0) {
  echouer(
    'Aucun compte autorisé : VITE_AUTHORIZED_ACCOUNTS est vide ou absent de .env.',
    'Déployer ainsi FERMERAIT la base à tout le monde. Renseigne la variable ' +
      'dans .env (adresses séparées par des virgules), puis relance.'
  );
}

const suspect = comptes.filter((a) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a) || a.endsWith('@exemple.ch'));
if (suspect.length > 0) {
  echouer(
    `Adresse invalide ou d'exemple dans VITE_AUTHORIZED_ACCOUNTS : ${suspect.join(', ')}.`,
    'Mets les adresses Google réelles des comptes qui doivent ouvrir la brasserie.'
  );
}

const gabarit = fs.readFileSync(GABARIT, 'utf8');
if (!gabarit.includes(JETON)) {
  echouer(
    `Le gabarit ne contient plus le jeton ${JETON}.`,
    'Il marque l’endroit où la liste est injectée : remets-le dans firestore.rules.template.'
  );
}

const liste = comptes.map((a) => `        '${a}'`).join(',\n');
fs.writeFileSync(SORTIE, gabarit.replace(JETON, liste));

console.log(
  `✅ firestore.rules généré — ${comptes.length} compte${comptes.length > 1 ? 's' : ''} autorisé${
    comptes.length > 1 ? 's' : ''
  }.`
);
