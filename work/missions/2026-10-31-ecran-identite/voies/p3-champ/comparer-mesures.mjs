#!/usr/bin/env node
// Compare captures/avant/mesures.json et captures/apres/mesures.json : boîte (x, y, l, h) à 1 px près, et style identique.
// Sortie : « MESURES OK » (code 0) ou « MESURES ECHEC n » avec la liste.
import fs from 'node:fs';
import path from 'node:path';

const dossier = path.join(import.meta.dirname, 'captures');
const avant = JSON.parse(fs.readFileSync(path.join(dossier, 'avant', 'mesures.json'), 'utf8'));
const apres = JSON.parse(fs.readFileSync(path.join(dossier, 'apres', 'mesures.json'), 'utf8'));
const fautes = [];
let n = 0;
for (const cle of Object.keys(avant)) {
  const a = avant[cle]; const b = apres[cle];
  if (!b || a.length !== b.length) { fautes.push(`${cle} : ${a.length} champs avant, ${b?.length ?? 0} après`); continue; }
  a.forEach((ca, i) => {
    const cb = b[i];
    const ligne = [];
    for (const k of ['x', 'y', 'w', 'h']) {
      const d = Math.abs(ca[k] - cb[k]);
      if (d > 1) ligne.push(`${k} ${ca[k]} → ${cb[k]}`);
    }
    for (const k of ['police', 'taille', 'graisse', 'ligne', 'align', 'bordBas', 'bordHaut', 'bordGauche', 'padding', 'valeur', 'aria', 'mode']) {
      // Le textarea du Fermenteur (hauteur fixe de 32 px) centre son texte par 3 px de padding en haut, là où l'input le centre seul.
      if (k === 'padding' && ca.tag === 'INPUT' && cb.tag === 'TEXTAREA' && ca.id === 'wz-fermenteur' && cb.padding === '3px 6px 0px') continue;
      if (ca[k] !== cb[k]) ligne.push(`${k} « ${ca[k]} » → « ${cb[k]} »`);
    }
    if (cb.barreV !== 0) ligne.push(`barre de défilement ${cb.barreV} px`);
    if (cb.debordeV > ca.debordeV) ligne.push(`débordement vertical ${ca.debordeV} → ${cb.debordeV}`);
    if (cb.tag === 'TEXTAREA' && cb.resize !== 'none') ligne.push(`poignée : resize ${cb.resize}`);
    n++;
    const ecart = ['x', 'y', 'w', 'h'].map((k) => (cb[k] - ca[k]).toFixed(1)).join('/');
    console.log(`${ligne.length ? 'ECHEC' : 'OK   '} ${cle} #${ca.id} ${ca.tag}→${cb.tag} écart x/y/l/h ${ecart}${ligne.length ? ' : ' + ligne.join(' ; ') : ''}`);
    if (ligne.length) fautes.push(`${cle} #${ca.id} : ${ligne.join(' ; ')}`);
  });
}
console.log(fautes.length ? `MESURES ECHEC ${fautes.length}\n${fautes.map((f) => '  - ' + f).join('\n')}` : `MESURES OK (${n} champs comparés)`);
process.exit(fautes.length ? 1 : 0);
