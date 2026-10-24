// D26 (18.10, soir) : « Je comprends pas ces nouveaux screen, on avait établi une Baseline, ça
// différent complètement ? ». Dans un lot de composant (radars, fiche…), tout ce qui est hors
// du composant reste celui de la baseline.
// Usage : node work/refonte-frontend/v4/tournoi/outils/controle-baseline.mjs <dossier> <dossier-baseline> [ids…]
// Convention : le composant travaillé est entouré de data-composant="…" (dans la baseline comme
// dans la variante) ; la fiche (data-role="fiche") est un ajout permis. Pour chaque page de la
// baseline, le texte visible hors de ces éléments, à 390 px, doit être identique dans la variante.
// Imprime BASELINE OK si tout passe, sinon BASELINE ECHEC et la première différence par page.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const dir = path.resolve(args[0]);
const base = path.resolve(args[1]);
const only = args.slice(2);
const ids = fs.readdirSync(dir).filter((d) => /^p\d+$|^consolide$|^version-/.test(d) && fs.existsSync(path.join(dir, d, 'index.html')))
  .filter((d) => !only.length || only.includes(d)).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const horsComposant = async (file) => {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(file).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  const t = await page.evaluate(() => {
    for (const e of document.querySelectorAll('[data-composant], [data-role="fiche"]')) e.style.setProperty('display', 'none', 'important');
    return document.body.innerText.split('\n').map((l) => l.trim()).filter(Boolean);
  });
  await page.close();
  return t;
};
const problems = [];
const pagesBase = fs.readdirSync(base).filter((f) => f.endsWith('.html')).sort();
const ref = {};
for (const f of pagesBase) ref[f] = await horsComposant(path.join(base, f));
for (const id of ids) {
  for (const f of pagesBase) {
    const v = path.join(dir, id, f);
    if (!fs.existsSync(v)) { problems.push(id + ' : ' + f + ' absente (la baseline l\'a)'); continue; }
    const t = await horsComposant(v);
    const n = Math.max(t.length, ref[f].length);
    for (let i = 0; i < n; i++) if (t[i] !== ref[f][i]) { problems.push(id + ' : ' + f + ' diffère de la baseline hors composant, ligne ' + (i + 1) + ' : « ' + (t[i] ?? '∅').slice(0, 40) + ' » au lieu de « ' + (ref[f][i] ?? '∅').slice(0, 40) + ' »'); break; }
  }
  console.log(id + ' · comparé à la baseline (' + pagesBase.length + ' pages)');
}
await browser.close();
// Audit du 23.10 : un contrôle qui ne lit aucune page n'est pas un OK (« OK 0/0 »).
if (ids.length === 0) problems.push('aucune maquette lue : 0 page au format attendu ; ce contrôle ne garde rien ici (voir portee-defauts.json)');
if (problems.length === 0) console.log('BASELINE OK ' + ids.length + '/' + ids.length);
else { console.log('BASELINE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exitCode = 1; }
