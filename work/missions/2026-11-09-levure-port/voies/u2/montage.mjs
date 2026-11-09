// Montages de la voie u2 : pour chaque cadre, la maquette choisie (c6b, s5a, s7a : un tiers de sa planche) à gauche, l'app à droite
// (390 clair, 390 cave, 1280 clair, 1280 cave). Sortie : voies/u2/montages/<id>.png
//   node work/missions/2026-11-09-levure-port/voies/u2/montage.mjs
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const voie = resolve('work/missions/2026-11-09-levure-port/voies/u2');
const p2 = resolve('work/missions/2026-11-09-ecran-levure/p2');
const url = (p) => pathToFileURL(p).href;
await mkdir(resolve(voie, 'montages'), { recursive: true });
const CADRES = [
  ['c1', 'Chercher · 1056 tapé (c6b 1)', 'c6b/c6b-cadres.png', 0, 'h'], ['c2', 'Chercher · feuille (c6b 2)', 'c6b/c6b-cadres.png', 1, 'h'], ['c3', 'Chercher · trois filtres (c6b 3)', 'c6b/c6b-cadres.png', 2, 'h'],
  ['m1', 'Comparer · repos (s5a 1)', 's5a/s5a-cadres.png', 0, 'v'], ['m2', 'Comparer · toucher (s5a 2)', 's5a/s5a-cadres.png', 1, 'v'], ['m3', 'Comparer · cas limite (s5a 3)', 's5a/s5a-cadres.png', 2, 'v'],
  ['s1', 'Suggérer · repos (s7a 1)', 's7a/s7a-cadres.png', 0, 'h'], ['s2', 'Suggérer · − atténuation (s7a 2)', 's7a/s7a-cadres.png', 1, 'h'], ['s3', 'Suggérer · deux axes (s7a 3)', 's7a/s7a-cadres.png', 2, 'h'],
];
const navigateur = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const [id, titre, f, k, sens] of CADRES) {
  const page = await navigateur.newPage();
  await page.setViewport({ width: 2600, height: 1000 });
  const mq = url(resolve(p2, f));
  const decoupe = sens === 'h'
    ? `<div class="mq" style="width:${100 / 3}%"><img src="${mq}" style="width:300%;margin-left:-${k * 100}%"></div>`
    : `<div class="mq" style="width:260px"><img src="${mq}" style="width:100%;margin-top:-${k * 100 * 0.3333}%"></div>`;
  const caps = ['390-clair', '390-cave', '1280-clair', '1280-cave'].map((n) => `<figure><img src="${url(resolve(voie, 'captures-app', `${id}-${n}.png`))}"><figcaption>${n}</figcaption></figure>`).join('');
  const html = (`<style>body{margin:0;background:#ddd;font:13px sans-serif}h1{font-size:14px;margin:6px}.row{display:flex;gap:8px;align-items:flex-start;padding:6px}.m{width:420px;flex:none;border:3px solid #e07b2e;overflow:hidden}.mq{overflow:hidden}.mq img{display:block}figure{margin:0;flex:none}figure img{height:640px;display:block}</style><h1>${titre} — maquette (cadre orange) · app servie</h1><div class="row"><div class="m">${sens === 'h' ? `<div style="width:420px;overflow:hidden"><img src="${mq}" style="width:${420 * 3 / 1}px;margin-left:-${k * 420}px;display:block"></div>` : `<div style="width:420px;height:640px;overflow:hidden"><img src="${mq}" style="width:420px;margin-top:-${k * 420 * 0.3333 * 2725 / 390 * 0.99}px;display:block"></div>`}</div>${caps}</div>`);
  const fichier = resolve(voie, 'montages', `${id}.html`);
  await writeFile(fichier, html);
  await page.goto(url(fichier), { waitUntil: 'load' });
  await attendre(400);
  await page.screenshot({ path: resolve(voie, 'montages', `${id}.png`) });
  console.log('MONTAGE ' + id);
  await page.close();
}
await navigateur.close();
function attendre(ms) { return new Promise((r) => setTimeout(r, ms)); }
