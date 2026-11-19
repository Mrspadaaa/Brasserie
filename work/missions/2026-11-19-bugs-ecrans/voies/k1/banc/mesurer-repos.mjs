// k1 / points 9 et 10 : le + AU REPOS (page arrêtée depuis plus de 700 ms, donc non masqué) ne doit couvrir ni « Suivant — … », ni un onglet de l'atelier
// houblons, ni « Recherche avancée ». Pour chaque commande de rangée du bord droit, on fait défiler la page jusqu'à ce que la rangée tombe à la hauteur du +
// (le pire cas), on attend l'arrêt, on mesure la surface commune des boîtes (rouge si > 4 px²).
// node scripts/with_server.mjs --server "npm run dev -- --port 3109 --strictPort" --port 3109 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake \
//   -- node work/missions/2026-11-19-bugs-ecrans/voies/k1/banc/mesurer-repos.mjs [prefixe]    (CAPTURES=1 : une capture par mode et thème)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const port = (process.env.WITH_SERVER_PORTS ?? '3109').split(',')[0];
const SORTIE = path.join(import.meta.dirname, '..', 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const prefixe = process.argv[2] ?? 'repos';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const local = (u) => ['http://localhost', 'http://127.0.0.1', 'ws://localhost', 'data:', 'blob:', 'about:'].some((d) => u.startsWith(d));
const MODES = [
  { id: '390x660', l: 390, h: 660, tactile: true },
  { id: '844x340', l: 844, h: 340, tactile: true },
  { id: '1280', l: 1280, h: 800, tactile: false },
];
const THEMES = (process.env.THEMES ?? 'clair,cave').split(',');
// Rangées de commandes du bord droit qui peuvent tomber sous le + : la rangée de fin de chaque étape, les onglets de l'atelier, le champ d'ajout.
const RANGEES = [
  { nom: 'fin', sel: '.recipe-step-actions button' },
  { nom: 'onglet atelier', sel: '.hv-nav button' },
  { nom: 'recherche avancée', sel: '[data-role="recherche-avancee"]' },
  { nom: 'carte détail', sel: '[data-role="ajouts-proposes"] button' },
];
const rapport = [];
let echecs = 0;

for (const mode of MODES) {
  for (const theme of THEMES) {
    const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
    const p = await nav.newPage();
    await p.setViewport({ width: mode.l, height: mode.h, isMobile: mode.tactile, hasTouch: mode.tactile, deviceScaleFactor: 1 });
    await p.setRequestInterception(true);
    p.on('request', (r) => (local(r.url()) ? r.continue() : r.abort('blockedbyclient')));
    p.setDefaultNavigationTimeout(150000);
    await p.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* */ } }, theme);
    await p.goto(`http://localhost:${port}/?dev-local&etape=houblons`, { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('.recipe-step-actions', { timeout: 150000 });
    await p.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
    await p.evaluate(() => document.fonts.ready);
    await dormir(800);
    if (!process.env.SANS_ATELIER) await p.waitForSelector('.hv-nav', { timeout: 20000 }).catch(() => rapport.push(mode.id + ' ' + theme + ' : atelier houblons (.hv-nav) non rendu en 20 s'));
    for (let etape = 0; etape < Number(process.env.ETAPES ?? 8); etape++) {
      const titre = await p.evaluate(() => document.querySelector('[data-page-shell] h1, [data-page-shell] h2')?.textContent?.trim().slice(0, 24) ?? '');
      for (const rangee of RANGEES) {
        const n = await p.evaluate((s) => document.querySelectorAll(s).length, rangee.sel);
        for (let i = 0; i < n; i++) {
          // On amène la commande à la hauteur du + (cas le pire), puis on attend l'arrêt : le + est alors visible.
          const prepare = await p.evaluate((s, k) => {
            const e = document.querySelectorAll(s)[k];
            const fab = document.querySelector('.floating-actions > button');
            if (!e || !fab || getComputedStyle(fab.parentElement).display === 'none') return null;
            const main = e.closest('main') ?? document.scrollingElement;
            const re = e.getBoundingClientRect(); const rf = fab.getBoundingClientRect();
            main.scrollTop += (re.top + re.height / 2) - (rf.top + rf.height / 2);
            return true;
          }, rangee.sel, i);
          if (!prepare) continue;
          await dormir(1000);
          const m = await p.evaluate((s, k) => {
            const e = document.querySelectorAll(s)[k]; const fab = document.querySelector('.floating-actions > button');
            if (!e || !fab) return null;
            const a = e.getBoundingClientRect(); const f = fab.getBoundingClientRect();
            const x = Math.max(0, Math.min(a.right, f.right) - Math.max(a.left, f.left)); const y = Math.max(0, Math.min(a.bottom, f.bottom) - Math.max(a.top, f.top));
            const sF = getComputedStyle(fab);
            return { surface: Math.round(x * y), masque: Number(sF.opacity) < 0.05, nom: (e.getAttribute('aria-label') || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 34),
              haut: a.top < innerHeight && a.bottom > 0, visibleDe: Math.round(a.width), tronque: e.scrollWidth > e.clientWidth + 1 };
          }, rangee.sel, i);
          if (!m || m.masque || !m.haut) continue;
          if (m.surface > 4) { echecs++; rapport.push(`${mode.id} ${theme} étape ${etape} « ${titre} » ${rangee.nom} : le + au repos recouvre « ${m.nom} » (${m.surface} px²)`); }
          if (rangee.nom === 'onglet atelier' && m.tronque) { echecs++; rapport.push(`${mode.id} ${theme} étape ${etape} onglet « ${m.nom} » tronqué (${m.visibleDe} px)`); }
        }
      }
      if (process.env.CAPTURES && etape === 2) {
        // Capture « repos » : l'atelier houblons, onglets à la hauteur du +.
        await p.evaluate(() => {
          const e = document.querySelector('.hv-nav button'); const fab = document.querySelector('.floating-actions > button');
          if (e && fab) { const main = e.closest('main'); const re = e.getBoundingClientRect(); const rf = fab.getBoundingClientRect(); main.scrollTop += (re.top + re.height / 2) - (rf.top + rf.height / 2); }
        });
        await dormir(1100);
        await p.screenshot({ path: path.join(SORTIE, `${prefixe}-${mode.id}-${theme}-onglets.png`) });
        await p.evaluate(() => { const e = document.querySelector('[data-role="recherche-avancee"]'); const fab = document.querySelector('.floating-actions > button');
          if (e && fab) { const main = e.closest('main'); const re = e.getBoundingClientRect(); const rf = fab.getBoundingClientRect(); main.scrollTop += (re.top + re.height / 2) - (rf.top + rf.height / 2); } });
        await dormir(1100);
        await p.screenshot({ path: path.join(SORTIE, `${prefixe}-${mode.id}-${theme}-avancee.png`) });
      }
      await p.evaluate(() => { const m = document.querySelector('[data-page-shell] main'); if (m) m.scrollTop = m.scrollHeight; });
      await dormir(1100);
      if (process.env.CAPTURES && etape >= 3 && etape <= 5) await p.screenshot({ path: path.join(SORTIE, `${prefixe}-${mode.id}-${theme}-fin-etape${etape}.png`) });
      const suivant = await p.$('.recipe-step-actions .recipe-primary-action');
      if (!suivant) break;
      await suivant.evaluate((b) => b.scrollIntoView({ block: 'center' }));
      await suivant.click();
      await dormir(700);
    }
    await nav.close();
  }
}
const uniques = [...new Set(rapport)];
console.log(uniques.slice(0, 80).join('\n'));
console.log(echecs ? `RECOUVREMENTS ${uniques.length}` : 'AUCUN RECOUVREMENT AU REPOS');
process.exit(echecs ? 1 : 0);
