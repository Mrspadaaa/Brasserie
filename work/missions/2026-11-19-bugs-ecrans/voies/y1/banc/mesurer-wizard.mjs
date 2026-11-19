// y1 / T3-10 (éditeur de recette) : mesure les boîtes du + flottant et de « Suivant » / « Retour », à chaque étape, à 390×660 tactile,
// 844×340 tactile et 1280×800, thèmes clair et cave, en bas de page et en défilant. Échoue (code 1) si le + recouvre une commande de la rangée de fin.
// node scripts/with_server.mjs --server "npm run dev -- --port 3109 --strictPort" --port 3109 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake \
//   -- node work/missions/2026-11-19-bugs-ecrans/voies/y1/banc/mesurer-wizard.mjs [prefixe-capture]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { sousLePlus } from './sous-le-plus.mjs';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const port = (process.env.WITH_SERVER_PORTS ?? '3109').split(',')[0];
const SORTIE = path.join(import.meta.dirname, '..', 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const prefixe = process.argv[2] ?? 'wizard';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const local = (u) => ['http://localhost', 'http://127.0.0.1', 'ws://localhost', 'data:', 'blob:', 'about:'].some((d) => u.startsWith(d));
const MODES = [
  { id: '390x660', l: 390, h: 660, tactile: true },
  { id: '844x340', l: 844, h: 340, tactile: true },
  { id: '1280', l: 1280, h: 800, tactile: false },
];
const surfaces = (a, b) => {
  const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return x * y;
};
const rapport = [];
let echecs = 0;

for (const mode of MODES) {
  for (const theme of ['clair', 'cave']) {
    const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
    const p = await nav.newPage();
    await p.setViewport({ width: mode.l, height: mode.h, isMobile: mode.tactile, hasTouch: mode.tactile, deviceScaleFactor: 1 });
    await p.setRequestInterception(true);
    p.on('request', (r) => (local(r.url()) ? r.continue() : r.abort('blockedbyclient')));
    p.setDefaultNavigationTimeout(150000);
    await p.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* */ } }, theme);
    await p.goto(`http://localhost:${port}/?dev-local&etape=houblons&recette=vide`, { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('.recipe-step-actions', { timeout: 150000 });
    // SANS_MASQUE=1 : le + reste toujours visible (comportement d'avant le masque) = la mesure ROUGE de référence.
    if (process.env.SANS_MASQUE) await p.addStyleTag({ content: '.floating-actions[data-floating-actions-masque] > button{opacity:1!important;pointer-events:auto!important;scale:1!important}' });
    await p.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
    await p.evaluate(() => document.fonts.ready);
    await dormir(800);
    for (let etape = 0; etape < 8; etape++) {
      const mesure = await p.evaluate(() => {
        const main = document.querySelector('[data-page-shell] main');
        const fab = document.querySelector('.floating-actions > button');
        const r = (el) => { const b = el.getBoundingClientRect(); return { left: b.left, top: b.top, right: b.right, bottom: b.bottom }; };
        const commandes = [...document.querySelectorAll('.recipe-step-actions button')].map((b) => ({ nom: b.textContent.trim().slice(0, 28), ...r(b) }));
        return { fab: fab ? r(fab) : null, commandes, titre: document.querySelector('[data-page-shell] h1, [data-page-shell] h2')?.textContent?.trim().slice(0, 30), haut: main ? main.scrollHeight : 0, vue: main ? main.clientHeight : 0 };
      }).catch(() => null);
      if (!mesure) break;
      // positions : bas de page, puis en remontant par pas d'un demi-écran
      const positions = await p.evaluate((pas) => { const m = document.querySelector('[data-page-shell] main'); if (!m) return []; const max = m.scrollHeight - m.clientHeight; const out = []; for (let y = max; y >= 0; y -= pas || Math.max(120, m.clientHeight / 2)) out.push(Math.round(y)); return out; }, process.env.TOUT ? 48 : 0);
      // TOUT : on DESCEND la page, du haut vers le bas, comme on lit (le + se masque en descendant, se réaffiche en remontant ou à l'arrêt).
      if (process.env.TOUT) positions.reverse();
      for (const y of positions) {
        await p.evaluate((yy) => { const m = document.querySelector('[data-page-shell] main'); if (m) m.scrollTop = yy; }, y);
        await dormir(process.env.TOUT ? 220 : 120); // TOUT : défilement continu (< 700 ms de repos), après la transition du + (160 ms)
        const m = await p.evaluate(() => {
          const fab = document.querySelector('.floating-actions > button');
          if (!fab || getComputedStyle(fab.parentElement).display === 'none') return null;
          const r = (el) => { const b = el.getBoundingClientRect(); return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, w: b.width, h: b.height }; };
          return { fab: r(fab), cmd: [...document.querySelectorAll('.recipe-step-actions button')].map((b) => ({ nom: b.textContent.trim().slice(0, 28), ...r(b) })),
        };
        });
        if (!m) continue;
        // TOUT=1 : toute valeur ou commande de la page sous le +, en défilant (BR-28, BR-89, BR-103, TL-31 : « en cours de défilement »)
        if (process.env.TOUT) { const t = await p.evaluate(sousLePlus); for (const c of t?.trouves ?? []) { echecs++; rapport.push(`${mode.id} ${theme} étape ${etape} « ${mesure.titre ?? ''} » : le + recouvre ${c.genre} « ${c.nom} » en défilant`); } }
        for (const c of m.cmd) {
          const dedans = c.bottom > 0 && c.top < mode.h;
          const s = dedans ? surfaces(m.fab, c) : 0;
          if (s > 4) { echecs++; rapport.push(`${mode.id} ${theme} étape ${etape} scroll ${y} : le + (${Math.round(m.fab.left)},${Math.round(m.fab.top)} ${Math.round(m.fab.w)}×${Math.round(m.fab.h)}) recouvre « ${c.nom} » de ${Math.round(s)} px²`); }
        }
      }
      // capture au bas de la page (preuve)
      await p.evaluate(() => { const m = document.querySelector('[data-page-shell] main'); if (m) m.scrollTop = m.scrollHeight; });
      await dormir(process.env.TOUT ? 1200 : 200); // à l'arrêt le + se réaffiche après 700 ms
      if (etape <= 1) await p.screenshot({ path: path.join(SORTIE, `${prefixe}-${mode.id}-${theme}-etape${etape}.png`) });
      // étape suivante
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
console.log(uniques.slice(0, 90).join('\n'));
console.log(echecs ? `RECOUVREMENTS ${uniques.length}` : 'AUCUN RECOUVREMENT');
process.exit(echecs ? 1 : 0);
