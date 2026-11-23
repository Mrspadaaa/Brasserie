// D82 (19.10, soir) : pas de gros bloc de fond qui ne dit rien derrière les voies. Les mots du brasseur,
// sur q2 du lot 15 (qu'il retient : « cella là ») : « pas mal mais c'est quoi ces gors bloque ? la partie
// du bas fait cens » (les grands fonds teintés « moins » et « plus » derrière toute la liste des voies).
// Règle : aucun élément visible à fond teinté (couleur ni transparente ni blanche, ou image de fond),
// d'au moins 300 px de haut et 100 px de large, qui recouvre trois voies ([data-voie]) ou plus.
// Les cartes d'une voie (qui en recouvrent une seule) et les zones du style dans une piste restent.
// Usage : node controle-gros-blocs.mjs <dossier> [ids…] [--page=etat-b.html] ; imprime BLOCS OK, ou
// BLOCS ECHEC et la liste.
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
    const fondPage = getComputedStyle(document.body).backgroundColor;
    const voies = [...document.querySelectorAll('[data-voie]')].filter(vis).map((e) => e.getBoundingClientRect());
    const recouvre = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    return [...document.querySelectorAll('body *')].filter(vis).map((e) => ({ e, cs: getComputedStyle(e), b: e.getBoundingClientRect() }))
      .filter(({ cs, b }) => b.height >= 300 && b.width >= 100 && ((!/rgba\(.*,\s*0\)$/.test(cs.backgroundColor) && cs.backgroundColor !== 'rgb(255, 255, 255)' && cs.backgroundColor !== fondPage) || cs.backgroundImage !== 'none'))
      .map(({ e, cs, b }) => ({ tag: e.tagName.toLowerCase(), cls: (e.getAttribute('class') || '').slice(0, 30), fond: cs.backgroundImage !== 'none' ? 'image' : cs.backgroundColor, h: Math.round(b.height), w: Math.round(b.width), n: voies.filter((v) => recouvre(b, v)).length }))
      .filter((x) => x.n >= 3);
  });
  await page.close();
  for (const x of r) problems.push(id + ' ' + pg + ' : ' + x.tag + (x.cls ? '.' + x.cls : '') + ' (' + x.fond + ', ' + x.w + ' × ' + x.h + ' px) derrière ' + x.n + ' voies');
  console.log(id + ' · ' + r.length + ' bloc(s)');
}
await browser.close();
if (problems.length) { console.log('BLOCS ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('BLOCS OK');
