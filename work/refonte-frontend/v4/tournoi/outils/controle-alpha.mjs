// D87 (19.10, soir) : la vraie valeur des acides alpha sur chaque voie. Les mots du brasseur, sur l8b
// (la baseline qu'il retient) : « Pas d'info sur les AA, j'en vrai valeur » (seul un picto « α »).
// Règle : chaque voie visible ([data-voie]) qui ajoute ou change un houblon montre, pour chacun,
// un élément visible [data-role="alpha"] dont le texte contient une valeur en % (« 9,6 % » ou
// « 10–14 % ») ; data-source dit « lot » (l'α du lot en stock, qui fait la dose) ou « fiches ».
// Usage : node controle-alpha.mjs <dossier> [ids…] [--page=etat-b.html] ; imprime ALPHA OK, ou ALPHA
// ECHEC et la liste.
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
    const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
    const voies = [...document.querySelectorAll('[data-voie]')].filter((e) => vis(e) && !e.parentElement.closest('[data-voie="' + e.dataset.voie + '"]'));
    return voies.map((v) => {
      const houblons = [...v.querySelectorAll('[data-houblon]')].filter(vis).length;
      const alphas = [...v.querySelectorAll('[data-role="alpha"]')].filter(vis);
      return { n: v.dataset.voie, houblons, ok: alphas.filter((a) => /\d+([,.]\d+)?(\s*[–-]\s*\d+([,.]\d+)?)?\s*%/.test(a.textContent)).length, sources: alphas.map((a) => a.dataset.source || '') };
    });
  });
  await page.close();
  const sans = r.filter((v) => v.houblons > 0 && v.ok === 0);
  const sansSource = r.filter((v) => v.ok > 0 && v.sources.some((s) => !/^(lot|fiches)$/.test(s)));
  if (!r.length) problems.push(id + ' ' + pg + ' : aucune voie visible');
  if (sans.length) problems.push(id + ' ' + pg + ' : ' + sans.length + ' voie(s) sans valeur d\'α (' + sans.slice(0, 6).map((v) => v.n).join(', ') + (sans.length > 6 ? '…' : '') + ')');
  if (sansSource.length) problems.push(id + ' ' + pg + ' : ' + sansSource.length + ' α sans data-source « lot » ou « fiches »');
  console.log(id + ' · ' + r.length + ' voies · ' + r.filter((v) => v.ok).length + ' avec leur α');
}
await browser.close();
if (problems.length) { console.log('ALPHA ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('ALPHA OK');
