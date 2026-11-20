// Captures APRÈS correctif : Ma levure après une recherche (LEV-11) et l'onglet Chercher (LEV-8), 390 tactile et 1280, clair et cave.
// Usage : … -- node capturer.mjs <dossier>
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const port = (process.env.WITH_SERVER_PORTS ?? '3123').split(',')[0];
const dossier = process.argv[2] ?? import.meta.dirname;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(dossier, { recursive: true });
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
let ko = 0;
for (const theme of ['clair', 'cave']) for (const largeur of [390, 1280]) {
  const p = await nav.newPage();
  await p.setViewport(largeur < 600 ? { width: largeur, height: 760, isMobile: true, hasTouch: true } : { width: largeur, height: 900 });
  await p.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* ignoré */ } }, theme);
  await p.goto(`http://localhost:${port}/?dev-local&etape=levure&recherche=simulee`, { waitUntil: 'domcontentloaded', timeout: 150000 });
  await p.waitForSelector('[data-lv="ma-levure"]', { timeout: 150000 });
  await pause(1500);
  await (await p.$('[aria-label="Floculation non documentée : chercher la donnée"]')).click();
  await p.waitForSelector('[data-recherche="a-confirmer"]', { timeout: 15000 });
  await pause(400);
  await (await p.$('[data-recherche="a-confirmer"]')).evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await pause(300);
  const lignes = await p.evaluate(() => [...document.querySelectorAll('[data-recherche="a-confirmer"]')].map((c) => new Set([...c.children].map((e) => Math.round((e.getBoundingClientRect().top + e.getBoundingClientRect().bottom) / 12))).size));
  await p.screenshot({ path: path.join(dossier, `lev11-apres-${largeur}-${theme}.png`) });
  console.log(`LEV-11 ${largeur} ${theme} : lignes = ${lignes.join(',')}`);
  if (lignes.some((n) => n > 1)) ko++;
  await p.evaluate(() => window.scrollTo(0, 0)); await pause(200);
  const t0 = Date.now();
  await p.click('#lv-tab-chercher');
  await p.waitForSelector('[data-lv="vue-chercher"], .lv-ch-vue, [role="tabpanel"] input', { timeout: 15000 }).catch(() => {});
  await pause(1500);
  const vue = await p.evaluate(() => ({ choisie: document.querySelector('#lv-tab-chercher')?.getAttribute('aria-selected'), maLevureCachee: document.querySelector('[data-lv="vue-ma-levure"]')?.hasAttribute('hidden'), texte: (document.querySelector('[role="tabpanel"]')?.textContent ?? '').slice(0, 80) }));
  await p.screenshot({ path: path.join(dossier, `chercher-apres-${largeur}-${theme}.png`) });
  console.log(`Chercher ${largeur} ${theme} : ${JSON.stringify(vue)} (${Date.now() - t0} ms)`);
  await p.close();
}
await nav.close();
console.log(ko ? 'CAPTURES KO' : 'CAPTURES OK');
