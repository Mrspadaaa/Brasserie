#!/usr/bin/env node
// Voie a1 (19.11) : captures de l'étape Malts/sucres, 390 tactile et 1280, clair et cave. Fixtures simulées (apercuDev.ts), rien d'externe.
// Usage : node scripts/with_server.mjs --server "npm run dev -- --port 3103 --strictPort" --port 3103 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake \
//   -- node work/missions/2026-11-19-bugs-ecrans/voies/a1/capturer.mjs
// Sortie : « CAPTURES OK n » et les fichiers dans voies/a1/captures/.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const port = (process.env.WITH_SERVER_PORTS ?? '3103').split(',')[0];
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

async function ouvrir(nav, mode, theme, etat) {
  const p = await nav.newPage();
  await p.setViewport({ width: mode.l, height: mode.h, isMobile: mode.tactile, hasTouch: mode.tactile, deviceScaleFactor: mode.echelle });
  await p.setRequestInterception(true);
  p.on('request', (r) => (local(r.url()) ? r.continue() : r.abort('blockedbyclient')));
  p.setDefaultNavigationTimeout(120000);
  await p.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* */ } }, theme);
  await p.goto(`http://localhost:${port}/?dev-local&etape=houblons&recette=vide&malts=${etat}`, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction((e) => document.body.dataset.apercu === e && document.querySelector('[data-sel]') !== null, { timeout: 120000 }, etat);
  await p.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
  await p.evaluate(() => document.fonts.ready);
  await dormir(600);
  return p;
}
const photo = async (p, nom) => { const f = path.join(SORTIE, `${nom}.png`); await p.screenshot({ path: f, fullPage: true }); n++; return f; };
const taper = async (p, texte) => {
  const c = await p.$('[data-role="ajout"]');
  await c.click(); await p.keyboard.down('Control'); await p.keyboard.press('KeyA'); await p.keyboard.up('Control'); await p.keyboard.press('Backspace'); await c.type(texte); await dormir(400);
};

for (const mode of MODES) {
  for (const theme of ['clair', 'cave']) {
    const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
    try {
      const tag = `${mode.id}-${theme}`;
      // 1. grain mal placé (donnée ancienne) : la pastille « empâtage ↩ » (PI-1), la bascule à points (BR-19).
      let p = await ouvrir(nav, mode, theme, 'absurde');
      await photo(p, `pi1-br19-${tag}`);
      infos.push(`${tag} pi1 : ${await p.evaluate(() => [...document.querySelectorAll('[data-hors="moment"][data-role="moment-ligne"]')].map((b) => `${b.getAttribute('aria-label')} | cycle=${!!b.querySelector('.fer-tour')} retour=${!!b.querySelector('.fer-remet')}`).join(' ; '))}`);
      infos.push(`${tag} br19 : ${await p.evaluate(() => document.querySelectorAll('[data-role="fam-pos"] i').length)} points`);
      // 2. « Miel » dans Grain : le bouton Créer dit « sucre : à l'ébullition » (MV-7) ; « dext » : Dextrose devant Carapils (BR-11).
      p = await ouvrir(nav, mode, theme, 'couleurs');
      await taper(p, 'Miel');
      await photo(p, `mv7-miel-${tag}`);
      infos.push(`${tag} mv7 : ${await p.evaluate(() => document.querySelector('[data-role="creer"]')?.textContent)}`);
      await taper(p, 'dext');
      await photo(p, `br11-dext-${tag}`);
      infos.push(`${tag} br11 : ${await p.evaluate(() => [...document.querySelectorAll('[role="option"]')].map((o) => o.getAttribute('data-nom')).join(' > '))}`);
      // 3a. « Coriandre 0,05 » sur sa propre page : l'alerte d'épice (MV-8), couleur inconnue, teinte masquée.
      await taper(p, 'Coriandre 0,05');
      await p.keyboard.press('Enter'); await dormir(500);
      await p.keyboard.press('Enter'); await dormir(300);
      await photo(p, `m4-mv8-${tag}`);
      infos.push(`${tag} mv8 alertes : ${await p.evaluate(() => document.querySelector('[data-role="alertes"]')?.textContent)}`);
      // 3b. « Malt noir 2,5 » sur une page neuve, 1400 EBC : l'alerte de teinte (M-4), pastille « ? » de la ligne.
      p = await ouvrir(nav, mode, theme, 'couleurs');
      await taper(p, 'Malt noir 2,5');
      await p.keyboard.press('Enter'); await dormir(500);
      await p.keyboard.press('Enter'); await dormir(300);
      const ligneNoir = await p.evaluate(() => [...document.querySelectorAll('[data-sel]')].findIndex((li) => /Malt noir/.test(li.textContent)));
      const pas = await p.$(`[data-cl="${ligneNoir}"]`);
      infos.push(`${tag} m4 pastille trouvée : ${!!pas} (ligne ${ligneNoir})`);
      if (pas) { await pas.click(); await dormir(300); await p.keyboard.type('1400'); await p.keyboard.press('Enter'); await dormir(600); }
      await photo(p, `m4-teinte-${tag}`);
      const alertesM4 = await p.evaluate(() => document.querySelector('[data-role="alertes"]')?.textContent ?? '');
      infos.push(`${tag} m4 alertes : ${alertesM4}`);
      infos.push(`${tag} m4 contient Teinte et 79 EBC : ${/Teinte/.test(alertesM4) && /79 EBC/.test(alertesM4)}`);
      p = await ouvrir(nav, mode, theme, 'fruit');
      await p.click('[data-sel="3"] [data-role="nom"]'); await dormir(400);
      await photo(p, `te17-fruit-${tag}`);
      infos.push(`${tag} te17 ligne : ${await p.evaluate(() => document.querySelector('[data-sel="3"] .fer-l2')?.textContent)} | plateau : ${await p.evaluate(() => document.querySelector('[data-role="bal"]')?.textContent)}`);
      await p.close();
    } finally { await nav.close(); }
  }
}
fs.writeFileSync(path.join(import.meta.dirname, 'captures', 'releves.txt'), infos.join('\n') + '\n');
console.log(infos.join('\n'));
console.log(`CAPTURES OK ${n}`);
