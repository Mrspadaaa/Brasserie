// Voie e1, tour 2, point 22 : « coriandre » + Entrée dans Malts/sucres, puis Stocks › Articles : la catégorie de l'article créé. Banc local SIMULÉ.
// Usage : node scripts/with_server.mjs --server "npm run dev" --port 3110 --env PORT=3110 -- node work/missions/2026-11-19-bugs-ecrans/voies/e1/capturer-stock.mjs
import puppeteer from 'puppeteer-core';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sortie = resolve(dirname(fileURLToPath(import.meta.url)), 'captures');
const port = (process.env.WITH_SERVER_PORTS || '3110').split(',')[0];
const navigateur = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const cliquerTexte = (page, re, dansDialogue = false) => page.evaluate((src, d) => {
  const rx = new RegExp(src, 'i');
  const b = [...document.querySelectorAll('button, a, [role="tab"]')].filter((x) => rx.test(x.textContent.trim()) && (!d || x.closest('[role="dialog"]')));
  b[b.length - 1]?.click(); return b.length;
}, re.source, dansDialogue);
try {
  const page = await navigateur.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(() => { localStorage.setItem('laffinee.theme', 'clair'); });
  await page.goto(`http://localhost:${port}/?dev-local&etape=houblons&recette=vide&malts=maquette`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('body[data-apercu]', { timeout: 90000 });
  await attendre(900);
  await page.click('[data-role="ajout"]');
  await page.type('[data-role="ajout"]', 'coriandre');
  await page.keyboard.press('Enter');
  await attendre(900);
  await page.evaluate(() => document.activeElement?.blur?.());
  console.log('Abandonner (1) :', await cliquerTexte(page, /^Abandonner$/));
  await attendre(700);
  console.log('Abandonner (2) :', await cliquerTexte(page, /^Abandonner$/));
  await attendre(1500);
  console.log('Stocks :', await cliquerTexte(page, /^Stocks?$/));
  await attendre(1500);
  console.log('Articles :', await cliquerTexte(page, /^Articles$/));
  await attendre(1000);
  const champ = await page.$('input[type="search"], input[placeholder*="echerch"], input[aria-label*="echerch"]');
  if (champ) { await champ.type('coriandre'); await attendre(800); }
  await page.screenshot({ path: `${sortie}/stock-coriandre-390-clair.png` });
  console.log('page :', (await page.evaluate(() => document.body.innerText)).split('\n').filter((l) => /coriandre|Additif|Malt/i.test(l)).slice(0, 8).join(' | '));
} finally {
  await navigateur.close();
}
