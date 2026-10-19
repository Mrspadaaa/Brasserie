// D80 (19.10, soir) : l'intensité de chaque saveur et l'usage de chaque houblon, sur chaque voie. Les
// mots du brasseur, sur p4 du lot 15 : « mieux afficher l'intensité des saveur comme sur p5 s4, aussi le
// type de houbon pour son usage, mixte, amérisant, aromatique ect. des petit mini info dessus ( type pico
// ou autre, pas surchargé) ».
// Règle, pour chaque voie visible ([data-voie], numéro = place dans voies du cas) :
//   I1 chaque famille que la voie fait bouger (tout, 0,5 point au moins), objectif ou extra, montre
//      son intensité : un élément visible dans la voie avec data-famille et data-crans, à 0,6 cran
//      au plus des crans du moteur ;
//   U1 chaque houblon ajouté ou changé (fiches) montre son usage : [data-role="usage"] visible, avec
//      data-usage (amérisant, aromatique, double, ou inconnu si le moteur ne le sait pas) et
//      data-source (fournisseur, ou règle quand c'est la règle rôle-α encore à valider), comme le
//      moteur (hopRole).
// Le cas : <html data-cas="c1">. Usage : node controle-usage-intensite.mjs <dossier> [ids…]
// [--page=etat-b.html] [--donnees=<dossier>] ; imprime USAGE-INTENSITE OK, ou … ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ici = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k) => { const a = args.find((x) => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pg = opt('page') || 'etat-b.html';
const donnees = path.resolve(opt('donnees') || path.join(ici, '../../ecran-1/fils15-s5-complexe/donnees'));
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
    return { cas: document.documentElement.dataset.cas || document.body.dataset.cas || null,
      voies: [...document.querySelectorAll('[data-voie]')].filter(vis).map((e) => ({ n: +e.dataset.voie,
        crans: [...e.querySelectorAll('[data-famille][data-crans]')].filter(vis).map((x) => ({ f: x.dataset.famille, c: parseFloat(String(x.dataset.crans).replace(',', '.')) })),
        usages: [...e.querySelectorAll('[data-role="usage"]')].filter(vis).map((x) => ({ u: x.dataset.usage || '', s: x.dataset.source || '', h: x.dataset.houblon || '' })) })) };
  });
  await page.close();
  const p = (m) => problems.push(id + ' ' + pg + ' : ' + m);
  if (!r.cas) { p('pas de data-cas'); continue; }
  const d = JSON.parse(fs.readFileSync(path.join(donnees, r.cas + '.json'), 'utf8'));
  const par = new Map();
  for (const v of r.voies) { const o = par.get(v.n) || { crans: [], usages: [] }; o.crans.push(...v.crans); o.usages.push(...v.usages); par.set(v.n, o); }
  let manqueI = 0, manqueU = 0;
  for (const [n, o] of par) {
    const voie = d.voies[n - 1];
    if (!voie) { p('voie ' + n + ' absente du cas'); continue; }
    for (const t of voie.tout.filter((x) => Math.abs(x.effet) >= 0.5 && x.crans != null)) {
      const vu = o.crans.filter((x) => x.f === t.famille);
      if (!vu.length) { manqueI++; if (manqueI <= 8) p('I1, voie ' + n + ' : intensité de ' + t.nom + ' absente (' + t.crans + ' cran)'); }
      else if (!vu.some((x) => Math.abs(x.c - t.crans) <= 0.6)) p('I1, voie ' + n + ' : ' + t.nom + ' à ' + vu.map((x) => x.c).join('/') + ' cran, le moteur dit ' + t.crans);
    }
    for (const h of voie.fiches) {
      const attendu = h.role || 'inconnu', src = /^fournisseur/.test(h.roleSource) ? 'fournisseur' : 'règle';
      const vu = o.usages.filter((x) => !x.h || x.h === h.houblon);
      if (!vu.length) { manqueU++; if (manqueU <= 8) p('U1, voie ' + n + ' : usage de ' + h.houblon + ' absent (' + attendu + ', ' + src + ')'); }
      else if (!vu.some((x) => x.u === attendu && x.s === src)) p('U1, voie ' + n + ' : ' + h.houblon + ' montré ' + vu.map((x) => x.u + '/' + x.s).join(', ') + ', le moteur dit ' + attendu + '/' + src);
    }
  }
  if (manqueI > 8) p('I1 : ' + (manqueI - 8) + ' intensité(s) absente(s) de plus');
  if (manqueU > 8) p('U1 : ' + (manqueU - 8) + ' usage(s) absent(s) de plus');
  console.log(id + ' · ' + par.size + ' voie(s) visibles');
}
await browser.close();
if (problems.length) { console.log('USAGE-INTENSITE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('USAGE-INTENSITE OK');
