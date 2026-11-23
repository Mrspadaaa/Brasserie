// D95 (19.10, soir) : la simulation dans presque chaque variante. Les mots du brasseur, sur la série
// s1–s3 du lot 21 (« Simulation et simulateur ») : « mais c'est normalement dans quasiment chaque
// variante le simu ». Plus tôt : « Des vrai donné, mieux présenté, mais aussi des simulation,
// simulateur » ; « Les deux se complément ».
// Règle :
//   S1 la page porte une simulation visible ([data-role="simulation"]) contenant au moins une valeur
//      simulée visible ([data-nature="simule"]) ;
//   S2 au moins un réglage visible ([data-role="reglage"] : bouton, curseur, liste, carte à toucher)
//      change le simulé : après un toucher (ou un changement de valeur pour un curseur ou une liste),
//      le texte ou la taille d'au moins une valeur simulée a changé ;
//   S3 une vraie valeur visible ([data-nature="mesure"]) se tient à côté, dans la même simulation ou
//      sur la page.
// Une variante peut s'en passer seulement avec la raison écrite dans sa NOTE (--sans=simulation dans
// controle-commun).
// Usage : node controle-simulation.mjs <dossier> [ids…] [--page=etat.html] ; imprime SIMULATION OK, ou
// SIMULATION ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pg = (args.find((a) => a.startsWith('--page=')) || '--page=etat.html').slice(7);
const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, pg)))).sort();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
const releve = () => {
  const vis = (e) => { if (!e || e.closest('[hidden]')) return false; const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const sims = [...document.querySelectorAll('[data-role="simulation"]')].filter(vis);
  const vals = [...document.querySelectorAll('[data-nature="simule"]')].filter(vis);
  return {
    sims: sims.length,
    simDansSim: vals.filter((v) => v.closest('[data-role="simulation"]')).length,
    mesures: [...document.querySelectorAll('[data-nature="mesure"]')].filter(vis).length,
    reglages: [...document.querySelectorAll('[data-role="reglage"]')].filter(vis).length,
    empreinte: vals.map((v) => { const b = v.getBoundingClientRect(); return v.textContent.trim() + '@' + Math.round(b.width) + 'x' + Math.round(b.height); }).join('|'),
  };
};
for (const id of ids) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(dir, id, pg)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(300);
  const a = await page.evaluate(releve);
  const f = [];
  if (!a.sims || !a.simDansSim) f.push('S1 pas de simulation visible (data-role="simulation" avec une valeur data-nature="simule")');
  if (!a.mesures) f.push('S3 aucune vraie valeur visible (data-nature="mesure") à côté du simulé');
  let bouge = false;
  if (!a.reglages) f.push('S2 aucun réglage visible (data-role="reglage")');
  else {
    const hs = await page.$$('[data-role="reglage"]');
    for (const h of hs.slice(0, 6)) {
      const info = await h.evaluate((e) => { const r = e.getBoundingClientRect(); return { tag: e.tagName.toLowerCase(), type: e.type || '', vis: r.width > 0 && r.height > 0 }; });
      if (!info.vis) continue;
      await h.evaluate((e) => e.scrollIntoView({ block: 'center' }));
      if (info.tag === 'input' && info.type === 'range') {
        await h.evaluate((e) => { const v = Number(e.value), max = Number(e.max || 100), min = Number(e.min || 0); e.value = String(v < max ? max : min); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); });
      } else if (info.tag === 'select') {
        await h.evaluate((e) => { e.selectedIndex = (e.selectedIndex + 1) % e.options.length; e.dispatchEvent(new Event('change', { bubbles: true })); });
      } else {
        try { await h.tap(); } catch { await h.click(); }
      }
      await wait(500);
      const b = await page.evaluate(releve);
      if (b.empreinte && b.empreinte !== a.empreinte) { bouge = true; break; }
    }
    if (!bouge) f.push('S2 aucun des réglages essayés ne change une valeur simulée');
  }
  await page.close();
  for (const x of f) problems.push(id + ' ' + pg + ' : ' + x);
  console.log(id + ' · ' + a.sims + ' simulation(s) · ' + a.reglages + ' réglage(s) · ' + a.mesures + ' mesurée(s) · ' + (bouge ? 'le simulé bouge' : 'immobile'));
}
await browser.close();
if (problems.length) { console.log('SIMULATION ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('SIMULATION OK');
