#!/usr/bin/env node
// Lot 26 (le radar seul) : le seul contrôle. Pour chaque id, la page se rend aux trois états (?etat=apres, 60, nelson),
// sans erreur de console ni texte NaN, undefined ou null, avec un <svg> présent. Une ligne par id, puis le verdict.
// Usage : node verifier.mjs <id…>   (rd00 = socle/rd00/etat.html ; les autres : fils26-radar/<id>/etat.html)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const LOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RACINE = path.resolve(LOT, '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ids = process.argv.slice(2);
if (!ids.length) { console.log('Usage : node verifier.mjs <id…>'); process.exit(2); }
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

// Dans la page : le texte et les attributs du rendu (scripts et styles exclus) ne contiennent ni NaN, ni undefined, ni null.
function lire() {
  const c = document.body.cloneNode(true);
  c.querySelectorAll('script,style').forEach((e) => e.remove());
  const rendu = c.innerHTML + ' ' + c.innerText;
  const mauvais = [...new Set(rendu.match(/\bNaN\b|undefined|\bnull\b|Infinity/g) ?? [])];
  return { svg: document.querySelectorAll('svg').length, formes: document.querySelectorAll('svg path, svg polygon, svg circle').length, mauvais };
}

const navigateur = await puppeteer.launch({ executablePath: CHROME, headless: true });
let echecs = 0;
for (const id of ids) {
  const page = path.join(LOT, id === 'rd00' ? 'socle/rd00' : id, 'etat.html');
  const fautes = [];
  if (!fs.existsSync(page)) fautes.push(`page absente (${path.relative(RACINE, page)})`);
  else {
    for (const etat of ['apres', '60', 'nelson']) {
      const p = await navigateur.newPage();
      const erreurs = [];
      p.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text().slice(0, 100)); });
      p.on('pageerror', (e) => erreurs.push(String(e.message ?? e).slice(0, 100)));
      try {
        await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
        await p.goto(pathToFileURL(page).href + '?etat=' + etat, { waitUntil: 'networkidle0', timeout: 30000 });
        await attendre(300);
        const r = await p.evaluate(lire);
        if (erreurs.length) fautes.push(`${etat} : console « ${erreurs[0]} »`);
        if (!r.svg) fautes.push(`${etat} : aucun <svg>`);
        else if (!r.formes) fautes.push(`${etat} : <svg> vide`);
        if (r.mauvais.length) fautes.push(`${etat} : texte ${r.mauvais.join(', ')}`);
      } catch (e) { fautes.push(`${etat} : plantage ${String(e.message ?? e).slice(0, 80)}`); } finally { await p.close(); }
    }
  }
  if (fautes.length) echecs += 1;
  console.log(`${id} : ${fautes.length ? 'ECHEC — ' + fautes.join(' ; ') : 'OK (3 états)'}`);
}
await navigateur.close();
const jeton = ['RAD', 'AR'].join('');
console.log(echecs ? `${jeton} ECHEC (${echecs})` : `${jeton} OK`);
process.exit(echecs ? 1 : 0);
