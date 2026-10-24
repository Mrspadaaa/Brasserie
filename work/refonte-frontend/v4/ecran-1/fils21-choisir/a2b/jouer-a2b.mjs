// Lot 21 · a2b · la preuve du geste : on relève les trois colonnes (cuve, levure, CO₂) et la réponse au
// repos (US-05, dry hop actif), après un toucher sur Pomona, puis après un toucher sur « après » ; on
// capture chaque état (premier écran, 390 × 844). Écrit a2b/geste-a2b.json.
// Usage : node a2b/jouer-a2b.mjs ; imprime GESTE OK si la colonne levure bouge au premier toucher.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const ici = path.dirname(fileURLToPath(import.meta.url));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
const err = []; page.on('pageerror', (e) => err.push(e.message));
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(pathToFileURL(path.join(ici, 'etat.html')).href, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 300));
const releve = () => page.evaluate(() => {
  const cols = {};
  for (const n of document.querySelectorAll('.tc-n[data-famille]')) {
    const f = n.dataset.famille, vals = []; let e = n.nextElementSibling;
    for (const v of e.querySelectorAll('.tc-v')) vals.push(v.textContent.trim());
    cols[f] = { cuve: vals[0], levure: vals[1], co2: vals[2] };
  }
  const tot = [...document.querySelectorAll('.tc-t.tc-v')].map((x) => x.textContent.trim());
  const g = (s) => (document.querySelector(s) || {}).textContent;
  const reg = document.querySelector('[data-levure="pomona"]').getBoundingClientRect();
  return { levure: g('[data-levure][aria-checked="true"]'), moment: g('[data-moment][aria-checked="true"]').trim(), reponse: document.querySelector('[data-role="reponse"]').innerText.replace(/\s+/g, ' '), enTout: { cuve: tot[0], levure: tot[1], co2: tot[2] }, familles: cols, gestePremierEcran: reg.bottom < innerHeight, cible: [Math.round(reg.width), Math.round(reg.height)] };
});
const etats = {};
etats.repos = await releve();
await page.screenshot({ path: path.join(ici, '../captures/a2b-repos-390.png') });
await (await page.$('[data-levure="pomona"]')).tap(); await new Promise((r) => setTimeout(r, 400));
etats.pomona = await releve();
await page.screenshot({ path: path.join(ici, '../captures/a2b-pomona-390.png') });
await (await page.$('[data-moment="apres"]')).tap(); await new Promise((r) => setTimeout(r, 400));
etats.apres = await releve();
await page.screenshot({ path: path.join(ici, '../captures/a2b-apres-390.png') });
await browser.close();
const bouge = Object.keys(etats.repos.familles).filter((f) => etats.repos.familles[f].levure !== (etats.pomona.familles[f] || {}).levure);
const preuve = { page: 'a2b/etat.html', vue: '390 × 844, toucher', etats, levureBougeAuPremierToucher: bouge, erreurs: err, captures: ['captures/a2b-repos-390.png', 'captures/a2b-pomona-390.png', 'captures/a2b-apres-390.png'] };
fs.writeFileSync(path.join(ici, 'geste-a2b.json'), JSON.stringify(preuve, null, 1));
console.log('repos  : ' + etats.repos.reponse);
console.log('Pomona : ' + etats.pomona.reponse);
console.log('après  : ' + etats.apres.reponse);
console.log('colonne levure changée au premier toucher : ' + bouge.length + ' famille(s) (' + bouge.join(', ') + ') ; geste au premier écran : ' + etats.repos.gestePremierEcran + ' ; cible ' + etats.repos.cible.join(' × ') + ' px');
console.log(bouge.length && etats.repos.gestePremierEcran && !err.length ? 'GESTE OK' : 'GESTE ECHEC');
process.exit(bouge.length && etats.repos.gestePremierEcran && !err.length ? 0 : 1);
