// Captures de la liste G4 sur le banc ?preview=stock&vue=futs : node capturer.mjs [clair|cave] [390|1280]  (serveur sur :3022)
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const themes = process.argv[2] ? [process.argv[2]] : ['clair', 'cave'];
const largeurs = process.argv[3] ? [Number(process.argv[3])] : [390, 1280];
const base = 'http://localhost:3022/?preview=stock&vue=futs';

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function cliquer(page, regex) {
  const ok = await page.evaluate((src) => {
    const re = new RegExp(src);
    const el = [...document.querySelectorAll('button')].find((e) => re.test(e.getAttribute('aria-label') || e.textContent || ''));
    if (!el) return false;
    el.click();
    return true;
  }, regex.source);
  if (!ok) throw new Error(`introuvable : ${regex}`);
  await pause(250);
}

for (const largeur of largeurs) for (const theme of themes) {
  const page = await browser.newPage(); page.setDefaultNavigationTimeout(240000); page.setDefaultTimeout(240000);
  // Le viewport est réglé avant le chargement, 390 en tactile.
  await page.setViewport({ width: largeur, height: largeur === 390 ? 844 : 800, hasTouch: largeur === 390, isMobile: largeur === 390, deviceScaleFactor: 1 });
  const nom = (n) => path.join(dir, `${n}-${largeur}-${theme}.png`);
  const shot = async (n) => { await pause(300); await page.screenshot({ path: nom(n) }); console.log('OK', nom(n)); };
  const charger = async () => {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('button[aria-label^="Ouvrir le fût"]', { timeout: 90000 });
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
    await pause(300);
  };

  await charger();
  await shot('liste-repos');
  await cliquer(page, /^À laver 3$/);
  await cliquer(page, /^Propre 1$/);
  await shot('liste-filtre');

  await charger();
  await cliquer(page, /^À laver 3$/);
  await cliquer(page, /^Tout marquer propre$/);
  await shot('liste-confirmation');
  await cliquer(page, /^Marquer propres$/);
  await shot('liste-apres');
  await page.close();
}
await browser.close();
