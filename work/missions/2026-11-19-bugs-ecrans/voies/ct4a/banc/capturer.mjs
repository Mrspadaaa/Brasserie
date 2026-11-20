// Captures de la voie ct4a (banc local, port 3110 ; fixtures SIMULÉES). Usage : node scripts/with_server.mjs --server "npm run dev" --port 3110 --env PORT=3110 -- node <ce fichier>
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const PORT = process.env.WITH_SERVER_PORTS ?? 3110;
const BASE = `http://localhost:${PORT}/work/missions/2026-11-19-bugs-ecrans/voies/ct4a/banc/banc.html`;
const APP = `http://localhost:${PORT}/?preview=brew&view=brassage&levure=seche-sans-quantite&stage=boil-0`;
const SORTIE = path.join(import.meta.dirname, '..', 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const filtre = process.argv[2] ?? '';

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const journal = [];
async function vue(nom, url, largeur, hauteur, action) {
  if (filtre && !nom.includes(filtre)) return;
  const page = await browser.newPage();
  const mobile = largeur < 600;
  await page.setViewport({ width: largeur, height: hauteur ?? (mobile ? 800 : 900), deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  page.on('pageerror', (e) => journal.push(`${nom} pageerror ${String(e?.message ?? e).slice(0, 160)}`));
  await page.setRequestInterception(true);
  page.on('request', (r) => (/^(https?|ws)s?:\/\/(localhost|127\.0\.0\.1)/i.test(r.url()) || /^(data|blob|about):/i.test(r.url()) ? r.continue() : r.abort('blockedbyclient')));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.waitForFunction(() => (document.body.innerText || '').trim().length > 60, { timeout: 240000 }).catch((e) => journal.push(`${nom} : racine vide`));
  await dormir(3000);
  if (action) await action(page);
  await dormir(700);
  await page.screenshot({ path: path.join(SORTIE, `${nom}.png`), fullPage: false });
  journal.push(`${nom} : ok`);
  await page.close();
}
const cliquer = (t) => async (page) => {
  await page.evaluate((x) => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(x) || (e.getAttribute('aria-label') || '').includes(x)); b?.scrollIntoView({ block: 'center' }); b?.click(); }, t);
  await dormir(600);
};
const defiler = async (page) => { await page.evaluate(() => { const s = [...document.querySelectorAll('*')].filter((e) => e.scrollHeight > e.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(e).overflowY)); s.forEach((e) => { e.scrollTop = e.scrollHeight; }); }); await dormir(300); };

for (const theme of ['clair', 'cave']) {
  for (const l of [1280, 390]) {
    await vue(`mesures-${theme}-${l}`, `${BASE}?theme=${theme}`, l);
    await vue(`mesures-auj-${theme}-${l}`, `${BASE}?theme=${theme}&auj=1`, l);
    await vue(`saisie-${theme}-${l}`, `${BASE}?theme=${theme}`, l, null, async (page) => { await cliquer('Mesurer')(page); await defiler(page); });
  }
}
await vue('jourj-rappel-clair-1280', APP, 1280);
await vue('jourj-rappel-clair-390', APP, 390);
console.log(journal.join('\n'));
await browser.close();
