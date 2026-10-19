// D94 (19.10, soir) : les familles d'abord, les vraies valeurs avec, la simulation marquée. Les mots du
// brasseur, sur le lot 20 (outil de dry hop : linalol, 4MMP, µg/L, « ×0,27–2303 » au premier plan) :
// « C'est très difficile à comprendre. […] On peut aussi simuler un 'faux' profil aromatique […]
// Mieux comprendre, mieux choisir » ; puis « Des vrai donné, mieux présenté, mais aussi des simulation,
// simulateur » ; « Les deux se complément » (la chimie et le langage du brasseur) ; « Je veux aussi des
// vrais valeur ».
// Règle, sur le premier écran (390 × 844, au chargement) :
//   L1 au moins trois pictos de famille visibles (svg[data-famille]) : on lit d'abord en familles ;
//   L2 chaque nom de composé visible (linalol, géraniol, myrcène, 4MMP, 3MH…) a le picto de sa famille
//      dans sa ligne (le plus petit ancêtre de 60 px de haut au plus) : pas de chimie orpheline ;
//   L3 aucun facteur en plage plus large que ×100 (« ×0,27–2303 ») : il dit « on ne sait pas », écrit
//      comme tel (« très incertain »), pas en chiffres ;
//   L4 au moins une vraie valeur visible, marquée [data-nature="mesure"] (α, huile, dose, mesure en
//      bière…) avec data-source ;
//   L5 chaque valeur simulée visible, marquée [data-nature="simule"], porte un signe visible de
//      simulation (« ~ », « simulé », « estimé » ou « ≈ ») ; et une page qui simule montre aussi du
//      mesuré (L4).
// Usage : node controle-lisible.mjs <dossier> [ids…] [--page=etat.html] ; imprime LISIBLE OK, ou
// LISIBLE ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pg = (args.find((a) => a.startsWith('--page=')) || '--page=etat.html').slice(7);
const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, pg)))).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
for (const id of ids) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(dir, id, pg)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  const r = await page.evaluate(() => {
    const H = innerHeight;
    const vis = (e) => { if (!e || e.closest('[hidden]')) return false; const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && b.bottom > 0 && b.top < H && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05; };
    const COMPOSE = /\b(linalol|linalool|g[ée]raniol|citronellol|myrc[èe]ne|humul[èe]ne|caryophyll[èe]ne|farn[ée]s[èe]ne|4MMP|3MHA?|3M4MP)\b/i;
    const orphelins = new Set();
    let facteursLarges = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const el = n.parentElement;
      const t = n.textContent.replace(/\s+/g, ' ').trim();
      if (!t || !el || el.closest('script, style, title') || !vis(el)) continue;
      const m = t.match(COMPOSE);
      if (m) {
        let ligne = el;
        while (ligne.parentElement && ligne.parentElement !== document.body && ligne.parentElement.getBoundingClientRect().height <= 60) ligne = ligne.parentElement;
        if (![...ligne.querySelectorAll('svg[data-famille]')].some(vis)) orphelins.add(m[1].toLowerCase());
      }
      for (const f of t.matchAll(/×\s*(\d+(?:[,.]\d+)?)\s*[–-]\s*(\d+(?:[,.]\d+)?)/g)) {
        const a = parseFloat(f[1].replace(',', '.')), b = parseFloat(f[2].replace(',', '.'));
        if (a > 0 && b / a > 100) facteursLarges.push(f[0]);
      }
    }
    const pictos = [...document.querySelectorAll('svg[data-famille]')].filter(vis).length;
    const mesures = [...document.querySelectorAll('[data-nature="mesure"]')].filter(vis);
    const simules = [...document.querySelectorAll('[data-nature="simule"]')].filter(vis);
    const muets = simules.filter((s) => !/~|≈|simul|estim/i.test(s.innerText + ' ' + (s.closest('[data-role="simulation"]') ? s.closest('[data-role="simulation"]').innerText.slice(0, 200) : '')));
    return { pictos, orphelins: [...orphelins], facteursLarges: facteursLarges.slice(0, 3), mesures: mesures.length, sansSource: mesures.filter((m) => !m.dataset.source).length, simules: simules.length, muets: muets.length };
  });
  await page.close();
  const f = [];
  if (r.pictos < 3) f.push('L1 ' + r.pictos + ' picto(s) de famille au premier écran (3 au moins)');
  if (r.orphelins.length) f.push('L2 composés sans le picto de leur famille dans leur ligne : ' + r.orphelins.join(', '));
  if (r.facteursLarges.length) f.push('L3 facteurs en plage de plus de ×100 : ' + r.facteursLarges.join(' ; '));
  if (!r.mesures) f.push('L4 aucune vraie valeur marquée data-nature="mesure" au premier écran');
  else if (r.sansSource) f.push('L4 ' + r.sansSource + ' vraie(s) valeur(s) sans data-source');
  if (r.muets) f.push('L5 ' + r.muets + ' valeur(s) simulée(s) sans signe « ~ », « ≈ », « simulé » ou « estimé »');
  for (const x of f) problems.push(id + ' ' + pg + ' : ' + x);
  console.log(id + ' · ' + r.pictos + ' pictos · ' + r.mesures + ' mesurées · ' + r.simules + ' simulées · ' + f.length + ' faute(s)');
}
await browser.close();
if (problems.length) { console.log('LISIBLE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('LISIBLE OK');
