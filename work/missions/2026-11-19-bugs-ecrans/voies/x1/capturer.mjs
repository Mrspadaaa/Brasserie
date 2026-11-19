#!/usr/bin/env node
// Voie x1 (19.11) : BR-5 (Paliers), BR-6 (dose de houblon en g), BR-98 (Houblon pour ce style), 390 tactile et 1280, clair et cave. Fixtures de dev-local.
// Usage : node scripts/with_server.mjs --server "npm run dev -- --port 3108 --strictPort" --port 3108 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake \
//   -- node work/missions/2026-11-19-bugs-ecrans/voies/x1/capturer.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const port = (process.env.WITH_SERVER_PORTS ?? '3108').split(',')[0];
const SORTIE = path.join(import.meta.dirname, 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const MODES = [
  { id: '390', l: 390, h: 844, tactile: true, echelle: 2 },
  { id: '1280', l: 1280, h: 800, tactile: false, echelle: 1 },
];
const local = (u) => ['http://localhost', 'http://127.0.0.1', 'ws://localhost', 'data:', 'blob:', 'about:', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'].some((d) => u.startsWith(d));
let n = 0;
const infos = [];

async function ouvrir(nav, mode, theme) {
  const p = await nav.newPage();
  await p.setViewport({ width: mode.l, height: mode.h, isMobile: mode.tactile, hasTouch: mode.tactile, deviceScaleFactor: mode.echelle });
  await p.setRequestInterception(true);
  p.on('request', (r) => (local(r.url()) ? r.continue() : r.abort('blockedbyclient')));
  p.setDefaultNavigationTimeout(120000);
  await p.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* */ } }, theme);
  await p.goto(`http://localhost:${port}/?dev-local&etape=houblons`, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => document.querySelector('[id^="wz-hop-"]') !== null, { timeout: 120000 });
  await p.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
  await p.evaluate(() => document.fonts.ready);
  await dormir(600);
  return p;
}
const photo = async (p, nom) => { const f = path.join(SORTIE, `${nom}.png`); await p.screenshot({ path: f, fullPage: true }); n++; return f; };
const cliquerParTexte = (p, motif) => p.evaluate((m) => {
  const re = new RegExp(m);
  const b = [...document.querySelectorAll('button,[role="tab"]')].find((x) => re.test(x.getAttribute('aria-label') ?? x.textContent ?? ''));
  if (!b) return false; b.click(); return true;
}, motif);
const remplacer = async (champ, texte) => {
  await champ.click({ clickCount: 3 });
  await champ.type(texte);
};

for (const mode of MODES) {
  for (const theme of ['clair', 'cave']) {
    const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
    try {
      const tag = `${mode.id}-${theme}`;
      // BR-6 : « 0,1 kg » tapé dans la dose de houblon en g.
      let p = await ouvrir(nav, mode, theme);
      const champ = await p.$('[id^="wz-hop-"]');
      const avant = await p.evaluate((c) => c.value, champ);
      await remplacer(champ, '0,1 kg');
      await p.evaluate(() => document.activeElement && document.activeElement.blur());
      await dormir(500);
      await photo(p, `br6-kg-${tag}`);
      infos.push(`${tag} br6 : avant « ${avant} » ; après « 0,1 kg » : champ = ${await p.evaluate((c) => c.value, champ)} ; avis = ${await p.evaluate(() => document.querySelector('[data-role="unite-lue"]')?.textContent ?? '(aucun)')}`);
      await remplacer(champ, '0,1 L');
      await p.evaluate(() => document.activeElement && document.activeElement.blur());
      await dormir(500);
      await photo(p, `br6-litre-${tag}`);
      infos.push(`${tag} br6 refus : champ = ${await p.evaluate((c) => c.value, champ)} ; avis = ${await p.evaluate(() => document.querySelector('[data-role="unite-lue"]')?.textContent ?? '(aucun)')}`);

      // BR-5 : l'étape Paliers (même page), à 66,5 °C puis à 63 °C.
      infos.push(`${tag} paliers (clic) : ${await cliquerParTexte(p, '^Paliers')}`);
      await dormir(900);
      await photo(p, `br5-defaut-${tag}`);
      infos.push(`${tag} br5 par défaut : ${await p.evaluate(() => document.querySelector('[role="note"][aria-label="Effet de l’empâtage sur la FG"]')?.textContent ?? '(aucun avis)')}`);
      const clicSacch = await p.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find((x) => /^Palier d/.test(x.getAttribute('aria-label') ?? '') && (x.getAttribute('aria-label') ?? '').includes('68,5'));
        if (!b) return false; b.click(); return b.getAttribute('aria-label');
      });
      await dormir(400);
      infos.push(`${tag} br5 palier touché : ${clicSacch}`);
      const temp = await p.$('input[aria-label^="Température du palier"]');
      if (temp) { await remplacer(temp, '63'); await p.evaluate(() => document.activeElement && document.activeElement.blur()); await dormir(600); }
      await photo(p, `br5-63-${tag}`);
      infos.push(`${tag} br5 à 63 °C : ${await p.evaluate(() => document.querySelector('[role="note"][aria-label="Effet de l’empâtage sur la FG"]')?.textContent ?? '(aucun avis)')}`);

      // BR-98 : « Houblon pour ce style » (Simuler) sur le banc de la fiche recette (fixture simulée).
      const q = await nav.newPage();
      await q.setViewport({ width: mode.l, height: mode.h, isMobile: mode.tactile, hasTouch: mode.tactile, deviceScaleFactor: mode.echelle });
      await q.goto(`http://localhost:${port}/work/missions/2026-11-19-bugs-ecrans/voies/x1/banc/banc.html?theme=${theme}`, { waitUntil: 'domcontentloaded' });
      await q.waitForFunction(() => document.querySelector('button.rc-lien') !== null, { timeout: 120000 });
      await cliquerParTexte(q, 'Potentiel');
      await dormir(1500);
      infos.push(`${tag} br98 onglet Simuler : ${await cliquerParTexte(q, '^Simuler$')}`);
      await dormir(800);
      await q.select('select[aria-label="Ajout à simuler"]', '-1');
      await dormir(500);
      const combo = await q.$('[aria-label="Houblon du scénario"]');
      if (combo) { await combo.evaluate((c) => c.scrollIntoView({ block: 'start' })); await combo.click(); await dormir(800); }
      await photo(q, `br98-liste-${tag}`);
      infos.push(`${tag} br98 options : ${await q.evaluate(() => [...document.querySelectorAll('[role="option"]')].slice(0, 4).map((o) => o.textContent).join(' || '))}`);
    } finally { await nav.close(); }
  }
}
fs.writeFileSync(path.join(import.meta.dirname, 'captures-journal.txt'), infos.join('\n') + '\n');
console.log(infos.join('\n'));
console.log(`CAPTURES OK ${n}`);
