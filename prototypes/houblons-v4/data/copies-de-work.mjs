#!/usr/bin/env node
// Données versionnées du prototype copiées de work/ (B8, voie p8, 23.10). Un dossier work/ n'est pas livré avec
// l'app : la maquette lit ces copies, jamais work/. Elles sont copiées par ce script, octet pour octet (ou, pour les
// pictos, le jeu de symboles extrait tel quel de la planche), jamais retapées à la main. La source reste la maison
// du fait : tests/copies-de-work.test.ts échoue si une copie s'écarte de sa source (relancer --ecrire).
// Usage (depuis la racine du dépôt) :
//   node prototypes/houblons-v4/data/copies-de-work.mjs            → COPIES OK (n) ou COPIES ECHEC
//   node prototypes/houblons-v4/data/copies-de-work.mjs --ecrire   → recopie depuis work/
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const data = path.dirname(fileURLToPath(import.meta.url));
const depot = path.resolve(data, '..', '..', '..');

/** Le jeu de symboles de la planche : le premier <svg width="0" height="0" …> … </svg> (mêmes bornes que l'ancien
 * découpage de Pictos.tsx, qui lisait la planche à l'exécution). */
function symbolesDePlanche(html) {
  const debut = html.indexOf('<svg width="0" height="0"');
  const fin = html.indexOf('</svg>', debut);
  if (debut < 0 || fin < 0) throw new Error('Planche des pictos : jeu de symboles introuvable.');
  return html.slice(debut, fin + '</svg>'.length);
}

export const COPIES = [
  {
    copie: 'jetons-familles.json',
    source: 'work/refonte-frontend/v4/ecran-1/fils17-standard/jetons-familles.json',
    quoi: 'couleurs des 12 familles (#142) : base, texte (≥ 4,5:1 sur blanc), fond',
    extraire: (s) => s,
  },
  {
    copie: 'pictos-familles.svg',
    source: 'work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html',
    quoi: 'symboles <symbol id="p-<famille>"> des 12 pictos au trait ; « épicé » = f1, cannelle et clou croisés (23.10)',
    extraire: symbolesDePlanche,
  },
  {
    copie: 'comparatifs-dryhop.json',
    source: 'work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/comparatifs-dryhop.json',
    quoi: 'comparatifs de dry hop sourcés du lot 21 (études E01 à E10), lus par Comparer et Dryhopper',
    extraire: (s) => s,
  },
];

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

/** Chaque copie comparée à sa source extraite : { copie, source, ok, raison }. */
export function verifier() {
  return COPIES.map((c) => {
    const src = path.join(depot, c.source), dst = path.join(data, c.copie);
    if (!fs.existsSync(dst)) return { ...c, ok: false, raison: 'copie absente' };
    if (!fs.existsSync(src)) return { ...c, ok: true, raison: 'source absente (dépôt sans work/) : la copie fait foi' };
    const attendu = c.extraire(fs.readFileSync(src, 'utf8'));
    const lu = fs.readFileSync(dst, 'utf8');
    return { ...c, ok: attendu === lu, raison: attendu === lu ? `identique (${sha(lu)})` : `écart : source ${sha(attendu)}, copie ${sha(lu)}` };
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--ecrire')) {
    for (const c of COPIES) fs.writeFileSync(path.join(data, c.copie), c.extraire(fs.readFileSync(path.join(depot, c.source), 'utf8')));
  }
  const r = verifier();
  for (const x of r) console.log(`${x.ok ? '  ok ' : '  ✗  '}${x.copie} ← ${x.source} : ${x.raison}`);
  const ko = r.filter((x) => !x.ok).length;
  console.log(ko ? `COPIES ECHEC (${ko})` : `COPIES OK (${r.length})`);
  process.exit(ko ? 1 : 0);
}
