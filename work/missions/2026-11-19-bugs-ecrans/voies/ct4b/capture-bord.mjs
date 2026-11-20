// Tour 2, point 8 : le Bord (carte Agenda) en dev-local ; l'événement « Marché d'Automne… 10.10.2026 » de la fixture dit « en retard ».
// Usage : WITH_SERVER_PORTS=3141 node .../capture-bord.mjs   → captures/k4-bord-<taille>-<theme>.png
import puppeteer from 'puppeteer-core';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sortie = resolve(dirname(fileURLToPath(import.meta.url)), 'captures');
const port = (process.env.WITH_SERVER_PORTS || '3141').split(',')[0];
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const navigateur = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const [nom, w, h, mobile] of [['390', 390, 844, true], ['1280', 1280, 900, false]]) for (const theme of ['clair', 'cave']) {
  const page = await (await navigateur.createBrowserContext()).newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  await page.evaluateOnNewDocument((th) => { localStorage.setItem('laffinee.theme', th); }, theme);
  await page.goto(`http://localhost:${port}/?dev-local`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => !!document.querySelector('section[aria-labelledby="dashboard-agenda"]'), { timeout: 170000 });
  await attendre(2000);
  const texte = await page.evaluate(() => { const s = document.querySelector('section[aria-labelledby="dashboard-agenda"]'); s.scrollIntoView({ block: 'center' }); return s.innerText.replace(/\s+/g, ' ').slice(0, 260); });
  await attendre(700);
  await page.screenshot({ path: `${sortie}/k4-bord-${nom}-${theme}.png` });
  console.log(nom, theme, texte);
  await page.close();
}
await navigateur.close();
