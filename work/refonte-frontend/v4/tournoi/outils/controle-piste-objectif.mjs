// D92 (19.10, soir) : sous chaque objectif, la piste de l5b. Les mots du brasseur, sur l5b : « Meilleures
// bar » et « Les bar de ce type sont plus informative donc meilleur » ; puis, sur la petite jauge
// d'objectif de l8e, entourée : « La barre là, c'est mieux mais il y avait mieux.... C'est pas exactement
// ce que j'ai demandé ». La piste de l5b court sur toute la largeur de l'objectif : un rail, la zone du
// style en pâle, la barre de la meilleure voie et la marque de la visée, posée sur la piste.
// Règle : chaque objectif visible porte une piste visible [data-role="piste"] d'au moins 75 % de la
// largeur de la page (hors gouttières), avec sa zone du style [data-role="zone"] (vide si ma bière est
// déjà au-delà du style).
// Usage : node controle-piste-objectif.mjs <dossier> [ids…] [--page=etat-b.html] ; imprime PISTE OK,
// ou PISTE ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pg = (args.find((a) => a.startsWith('--page=')) || '--page=etat-b.html').slice(7);
const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, pg)))).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
for (const id of ids) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(dir, id, pg)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  const r = await page.evaluate(() => {
    const vis = (e) => { if (!e || e.closest('[hidden]')) return false; const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
    const utile = document.documentElement.clientWidth - 32;
    const obs = [...document.querySelectorAll('[data-role="objectif"]')].filter((o) => vis(o) || [...o.children].some(vis));
    return { n: obs.length, utile, res: obs.map((o) => {
      const p = [...o.querySelectorAll('[data-role="piste"]')].find(vis);
      // La zone peut être vide (ma bière déjà au-dessus du style, résineux de l5b) : présente suffit.
      const z = p && p.querySelector('[data-role="zone"]');
      return { f: o.dataset.famille || '?', w: p ? Math.round(p.getBoundingClientRect().width) : 0, zone: !!z };
    }) };
  });
  await page.close();
  if (!r.n) problems.push(id + ' ' + pg + ' : aucun objectif visible');
  for (const o of r.res) {
    if (!o.w) problems.push(id + ' ' + pg + ' : ' + o.f + ', pas de piste [data-role="piste"]');
    else if (o.w < 0.75 * r.utile) problems.push(id + ' ' + pg + ' : ' + o.f + ', piste de ' + o.w + ' px, moins de 75 % de ' + r.utile + ' px');
    else if (!o.zone) problems.push(id + ' ' + pg + ' : ' + o.f + ', piste sans zone du style');
  }
  console.log(id + ' · ' + r.n + ' objectifs · pistes ' + r.res.map((o) => o.f + ' ' + o.w + ' px').join(', '));
}
await browser.close();
if (problems.length) { console.log('PISTE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('PISTE OK');
