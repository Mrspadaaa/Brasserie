// Voie w1 : explorer l'étape Eau d'une recette enregistrée (TL-16). Usage :
// node scripts/with_server.mjs --server "npm run dev" --port 3103 --env PORT=3103 -- node work/missions/2026-11-19-bugs-ecrans/voies/w1/explorer.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const url = `http://localhost:${(process.env.WITH_SERVER_PORTS ?? '3103').split(',')[0]}`;
const SORTIE = path.join(import.meta.dirname, 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 844, mobile: true, echelle: 1 });
await page.goto(`${url}/?dev-local&etape=houblons&recette=identite`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !!document.querySelector('[aria-current="step"]'), { timeout: 170000 });
await dormir(2500);
const cliquer = (re) => page.evaluate((src) => {
  const r = new RegExp(src, 'i');
  const b = [...document.querySelectorAll('button,[role=button],summary')].find((x) => r.test((x.getAttribute('aria-label') || x.textContent || '').trim()) && x.getClientRects().length);
  if (b) { b.click(); return true; } return false;
}, re.source);
console.log('Eau', await cliquer(/^Eau/));
await dormir(2500);
const rouges = await page.evaluate(() => [...document.querySelectorAll('.ew *')].filter((n) => {
  const c = getComputedStyle(n);
  const m = /rgb\((\d+), (\d+), (\d+)/.exec(c.color + ' ' + c.backgroundColor + ' ' + c.borderColor);
  return n.children.length === 0 && (n.textContent || '').trim() && m && Number(m[1]) > 170 && Number(m[2]) < 110 && Number(m[3]) < 110;
}).map((n) => `${n.tagName}.${n.className}:${(n.textContent || '').trim().slice(0, 100)}`));
console.log('rouges', JSON.stringify(rouges, null, 1));
await page.screenshot({ path: path.join(SORTIE, 'explore-eau-390.png'), fullPage: true });
console.log('erreurs', JSON.stringify(journal.erreurs.slice(0, 3)));
await browser.close();
