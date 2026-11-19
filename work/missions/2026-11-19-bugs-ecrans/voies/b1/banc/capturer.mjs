// Captures de la voie b1 (banc local, port 3105 ; fixtures SIMULÉES). Usage : node banc/capturer.mjs (serveur déjà lancé par with_server).
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = `http://localhost:${process.env.WITH_SERVER_PORTS ?? 3105}/work/missions/2026-11-19-bugs-ecrans/voies/b1/banc/banc.html`;
const SORTIE = path.join(import.meta.dirname, '..', 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const journal = [];
async function vue(nom, query, largeur, action) {
  const page = await browser.newPage();
  const mobile = largeur < 600;
  await page.setViewport({ width: largeur, height: mobile ? 800 : 900, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  page.on('pageerror', (e) => journal.push(`${nom} pageerror ${String(e?.message ?? e).slice(0, 120)}`));
  await page.setRequestInterception(true);
  page.on('request', (r) => (/^(https?|ws)s?:\/\/(localhost|127\.0\.0\.1)/i.test(r.url()) || /^(data|blob|about):/i.test(r.url()) ? r.continue() : r.abort('blockedbyclient')));
  await page.goto(`${BASE}?${query}`, { waitUntil: 'domcontentloaded', timeout: 240000 });
  // La feuille (Sheet) se monte en portail hors de #root : #root reste vide alors que la page est rendue. On attend du texte dans le body.
  await page.waitForFunction(() => (document.body.innerText || '').trim().length > 40, { timeout: 240000 })
    .catch((e) => journal.push(`${nom} : racine vide (${String(e?.message ?? e).slice(0, 100)})`));
  await dormir(2500);
  if (action) await action(page);
  await dormir(600);
  await page.screenshot({ path: path.join(SORTIE, `${nom}.png`), fullPage: false });
  const texte = await page.evaluate(() => document.body.innerText);
  // Le texte réel de l'alerte est « 57,9 L pour 19,8 L brassés : vérifie… » (ligne sous « Contenants ») : l'ancien test « conditionnés pour » ne la trouvait pas.
  journal.push(`${nom} : ${/pour\s*[\d\s,.  ]+L\s*brassés/.test(texte) ? 'ALERTE conditionné présente' : 'pas d’alerte conditionné'}`);
  await page.close();
}
const cliquer = (t) => async (page) => {
  await page.evaluate((x) => { const b = [...document.querySelectorAll('button')].find((e) => (e.textContent || '').includes(x) || (e.getAttribute('aria-label') || '').includes(x)); b?.scrollIntoView({ block: 'center' }); b?.click(); }, t);
};
const defiler = async (page) => { await page.evaluate(() => { const s = [...document.querySelectorAll('*')].filter((e) => e.scrollHeight > e.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(e).overflowY)); s.forEach((e) => { e.scrollTop = e.scrollHeight; }); window.scrollTo(0, document.body.scrollHeight); }); };

for (const theme of ['clair', 'cave']) {
  for (const l of [1280, 390]) {
    await vue(`mesures-${theme}-${l}`, `vue=feuille&theme=${theme}`, l, l < 600 ? defiler : null);
    await vue(`courbe-${theme}-${l}`, `vue=courbe&theme=${theme}`, l, l < 600 ? defiler : null);
  }
}
await vue('mesures-ok-clair-1280', 'vue=feuille&theme=clair&cond=18.5', 1280);
await vue('og-2-5-clair-1280', 'vue=feuille&theme=clair', 1280, async (page) => {
  // La saisie OG est repliée sous « Corriger les mesures » (summary) : l'ouvrir avant de cliquer, sinon « not clickable ».
  await page.evaluate(() => [...document.querySelectorAll('summary')].find((s) => /Corriger les mesures/.test(s.textContent || ''))?.click());
  await dormir(400);
  await page.focus('input[name="batch_sheet_og"]');
  // Sélection explicite du contenu (le triple-clic ne suffisait pas : la saisie s'ajoutait à « 1.060 » → « 1.0602,5 »).
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.keyboard.type('2,5');
  await page.keyboard.press('Tab');
});
await vue('supprimer-clair-1280', 'vue=feuille&theme=clair&section=overview', 1280, async (page) => { await cliquer('Plus')(page); await dormir(500); await cliquer('Supprimer ce brassin')(page); });
console.log(journal.join('\n'));
await browser.close();
