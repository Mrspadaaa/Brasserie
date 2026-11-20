// Captures B-3 (Récap : « N % du besoin ») et B-7 (étape Levure : conduite sans texte technique au premier plan). Banc local port 3110, fixtures SIMULÉES.
// Usage : node scripts/with_server.mjs --server "npm run dev" --port 3110 --env PORT=3110 --timeout 120 -- node <ce fichier>
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const PORT = process.env.WITH_SERVER_PORTS ?? 3110;
const BASE = `http://localhost:${PORT}/work/missions/2026-11-19-bugs-ecrans/voies/ct4a/banc/recap.html`;
const SORTIE = path.join(import.meta.dirname, '..', 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const journal = [];
async function vue(nom, url, largeur, action) {
  const page = await browser.newPage();
  const mobile = largeur < 600;
  await page.setViewport({ width: largeur, height: mobile ? 800 : 900, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  page.on('pageerror', (e) => journal.push(`${nom} pageerror ${String(e?.message ?? e).slice(0, 160)}`));
  await page.setRequestInterception(true);
  page.on('request', (r) => (/^(https?|ws)s?:\/\/(localhost|127\.0\.0\.1)/i.test(r.url()) || /^(data|blob|about):/i.test(r.url()) ? r.continue() : r.abort('blockedbyclient')));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.waitForFunction(() => (document.body.innerText || '').trim().length > 60, { timeout: 240000 }).catch(() => journal.push(`${nom} : racine vide`));
  await dormir(3000);
  await page.evaluate(() => localStorage.clear()).catch(() => {});
  if (action) await action(page);
  await dormir(700);
  await page.screenshot({ path: path.join(SORTIE, `${nom}.png`), fullPage: false });
  journal.push(`${nom} : ok`);
  await page.close();
}
const etape = (re) => async (page) => {
  await page.evaluate((src) => { const r = new RegExp(src); const b = [...document.querySelectorAll('button')].find((e) => r.test(e.getAttribute('aria-label') || e.textContent || '')); b?.click(); }, re);
  await dormir(1200);
};
const ouvrirLevure = async (page) => {
  await page.evaluate(() => { const d = document.querySelector('[data-rangee="levure"] details, details[data-recipe-section="Levure"]'); const r = document.querySelector('[data-rangee="levure"]'); (r?.matches('details') ? r : d)?.setAttribute('open', ''); r?.scrollIntoView({ block: 'center' }); });
  await dormir(500);
};
const ouvrirPlis = async (page) => {
  await page.evaluate(() => { document.querySelectorAll('details').forEach((d) => { if (/Atelier|Conduite|Nom, type/i.test(d.querySelector('summary')?.textContent || '')) d.open = true; }); document.querySelector('[data-following-shift]')?.scrollIntoView({ block: 'center' }); });
  await dormir(500);
};

for (const theme of ['clair', 'cave']) {
  for (const l of [1280, 390]) {
    await vue(`recap-levure-${theme}-${l}`, `${BASE}?theme=${theme}&qty=1`, l, async (p) => { await etape('^Récap')(p); await ouvrirLevure(p); });
    await vue(`conduite-levure-${theme}-${l}`, `${BASE}?theme=${theme}&qty=none`, l, async (p) => { await etape('^Levure')(p); await ouvrirPlis(p); });
  }
}
console.log(journal.join('\n'));
await browser.close();
