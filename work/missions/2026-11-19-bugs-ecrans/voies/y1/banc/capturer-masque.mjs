// y1 / masque du + au défilement : sur l'étape Levure de l'éditeur, trois instants par taille et thème, avec l'opacité mesurée du + :
// (1) en descendant (masqué, opacité 0), (2) à l'arrêt, 1 s plus tard (visible), (3) en remontant (visible). Captures dans voies/y1/captures/masque-*.png.
// Le serveur Vite doit déjà tourner (port 3109 par défaut) : node <ce fichier>   — ou via scripts/with_server.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const port = (process.env.WITH_SERVER_PORTS ?? '3109').split(',')[0];
const SORTIE = path.join(import.meta.dirname, '..', 'captures');
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const local = (u) => ['http://localhost', 'http://127.0.0.1', 'ws://localhost', 'data:', 'blob:', 'about:'].some((d) => u.startsWith(d));
const MODES = [
  { id: '390x660-cave', l: 390, h: 660, tactile: true, theme: 'cave' },
  { id: '390x660-clair', l: 390, h: 660, tactile: true, theme: 'clair' },
  { id: '844x340-cave', l: 844, h: 340, tactile: true, theme: 'cave' },
];
let ko = 0;
for (const mode of MODES) {
  const nav = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const p = await nav.newPage();
  await p.setViewport({ width: mode.l, height: mode.h, isMobile: mode.tactile, hasTouch: mode.tactile, deviceScaleFactor: 1 });
  await p.setRequestInterception(true);
  p.on('request', (r) => (local(r.url()) ? r.continue() : r.abort('blockedbyclient')));
  p.setDefaultNavigationTimeout(150000);
  await p.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* */ } }, mode.theme);
  await p.goto(`http://localhost:${port}/?dev-local&etape=houblons&recette=vide`, { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.recipe-step-actions', { timeout: 150000 });
  await p.evaluate((t) => { document.documentElement.dataset.theme = t; }, mode.theme);
  await dormir(1000);
  await (await p.$('.recipe-step-actions .recipe-primary-action')).click(); // Houblons → Levure
  await dormir(900);
  const opacite = () => p.evaluate(() => Number(getComputedStyle(document.querySelector('.floating-actions > button')).opacity));
  const defiler = (y) => p.evaluate((yy) => { document.querySelector('[data-page-shell] main').scrollTop = yy; }, y);
  await defiler(0); await dormir(900);
  for (const y of [48, 96, 144, 192, 240]) { await defiler(y); await dormir(220); }
  const enDescendant = await opacite();
  await p.screenshot({ path: path.join(SORTIE, `masque-${mode.id}-1-descend.png`) });
  await dormir(1100);
  const alArret = await opacite();
  await p.screenshot({ path: path.join(SORTIE, `masque-${mode.id}-2-arret.png`) });
  await defiler(96); await dormir(260);
  // remontée : visible ; puis une descente masque de nouveau (le motif se rejoue)
  const enRemontant = await opacite();
  await p.screenshot({ path: path.join(SORTIE, `masque-${mode.id}-3-remonte.png`) });
  const ok = enDescendant < 0.05 && alArret > 0.95 && enRemontant > 0.95;
  if (!ok) ko++;
  console.log(mode.id, `opacité du + : en descendant ${enDescendant}, à l'arrêt ${alArret}, en remontant ${enRemontant}`, ok ? 'OK' : 'KO');
  await nav.close();
}
console.log(ko ? 'MASQUE KO' : 'MASQUE OK');
process.exit(ko ? 1 : 0);
