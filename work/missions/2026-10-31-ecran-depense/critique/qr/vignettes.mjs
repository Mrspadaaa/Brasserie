// Vignettes recadrées de la zone QR des 12 mini maquettes v0 (D244 : la diversité se juge sur la zone, pas sur l'écran entier).
// Usage : node work/missions/2026-10-31-ecran-depense/critique/qr/vignettes.mjs
// jimp vient de %TEMP%/banc-outils/node_modules (aucune installation).
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const require = createRequire(path.join(os.tmpdir(), 'banc-outils', 'node_modules', 'x.js'));
const { Jimp } = require('jimp');

const ici = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const v0 = path.resolve(ici, '..', '..', 'qr', 'v0');

// Par variante : le fichier de l'état et la bande verticale (y0, y1) où vit le contrôle du QR à 390 px.
const ZONES = {
  contredit: {
    r1: ['r1/r1-contredit-390.png', 188, 520],
    r2: ['r2/r2-contredit-390.png', 88, 240],
    r3: ['r3/r3-contredit-390.png', 88, 392],
    r4: ['r4/r4-contredit-390.png', 88, 338],
    z1: ['z1/z1-contredit-390.png', 84, 258],
    z2: ['z2/z2-contredit-390.png', 84, 262],
    z3: ['z3/z3-contredit-390.png', 84, 262],
    z4: ['z4/z4-contredit-390.png', 222, 482],
    u1: ['u1/u1-contredit.png', 190, 530],
    u2: ['u2/u2-contredit.png', 88, 222],
    u3: ['u3/u3-contredit.png', 188, 372],
    u4: ['u4/u4-contredit.png', 88, 300],
  },
  confirme: {
    r1: ['r1/r1-confirme-390.png', 188, 330],
    r2: ['r2/r2-confirme-390.png', 88, 220],
    r3: ['r3/r3-confirme-390.png', 88, 312],
    r4: ['r4/r4-confirme-390.png', 88, 318],
    z1: ['z1/z1-confirme-390.png', 84, 180],
    z2: ['z2/z2-confirme-390.png', 84, 186],
    z3: ['z3/z3-confirme-390.png', 84, 218],
    z4: ['z4/z4-confirme-390.png', 222, 472],
    u1: ['u1/u1-confirme.png', 190, 372],
    u2: ['u2/u2-confirme.png', 88, 205],
    u3: ['u3/u3-confirme.png', 188, 312],
    u4: ['u4/u4-confirme.png', 88, 226],
  },
};

const ORDRE = ['r1', 'r2', 'r3', 'r4', 'z1', 'z2', 'z3', 'z4', 'u1', 'u2', 'u3', 'u4'];
const COLONNES = 4;
const ECART = 12;
const LARGEUR = 390;

async function planche(etat) {
  const zones = ZONES[etat];
  const vignettes = [];
  let hauteurMax = 0;
  for (const id of ORDRE) {
    const [fichier, y0, y1] = zones[id];
    const image = await Jimp.read(path.join(v0, fichier));
    const echelle = image.bitmap.width / LARGEUR; // les captures peuvent être à DPR 2
    const y = Math.round(y0 * echelle);
    const h = Math.round((y1 - y0) * echelle);
    const v = image.clone().crop({ x: 0, y, w: image.bitmap.width, h });
    if (echelle !== 1) v.resize({ w: LARGEUR });
    const sortie = path.join(ici, `vignette-${etat}-${id}.png`);
    await v.write(sortie);
    vignettes.push({ id, v });
    hauteurMax = Math.max(hauteurMax, v.bitmap.height);
  }
  const lignes = Math.ceil(ORDRE.length / COLONNES);
  const largeur = COLONNES * LARGEUR + (COLONNES + 1) * ECART;
  const hauteur = lignes * hauteurMax + (lignes + 1) * ECART;
  const fond = new Jimp({ width: largeur, height: hauteur, color: 0x2a2a2aff });
  vignettes.forEach(({ v }, i) => {
    const col = i % COLONNES;
    const lig = Math.floor(i / COLONNES);
    fond.composite(v, ECART + col * (LARGEUR + ECART), ECART + lig * (hauteurMax + ECART));
  });
  const sortie = path.join(ici, `vignettes-${etat}.png`);
  await fond.write(sortie);
  return { sortie, hauteurMax, n: vignettes.length };
}

for (const etat of Object.keys(ZONES)) {
  const r = await planche(etat);
  console.log(`VIGNETTES ${etat} OK ${r.n} (${path.basename(r.sortie)}, bande max ${r.hauteurMax} px ; ordre ${ORDRE.join(' ')})`);
}
if (!fs.existsSync(path.join(ici, 'vignettes-contredit.png'))) {
  console.log('VIGNETTES ECHEC');
  process.exit(1);
}
