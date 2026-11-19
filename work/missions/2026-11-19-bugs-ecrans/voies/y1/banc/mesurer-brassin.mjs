// y1 / T3-12 : rejoue « Plus › Supprimer ce brassin » sur le banc (brassin planifié « ZZ TEST ») à 390×660, 844×340, 1280 ; mesure à 1,2 s si un retour
// est visible (feuille de confirmation OU bandeau « supprimé · Annuler » entier à l'écran). Code 1 si rien n'est visible.
// node scripts/with_server.mjs --server "npm run dev -- --port 3109 --strictPort" --port 3109 --env VITE_FIREBASE_API_KEY=fake -- node <ce fichier> [prefixe]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const port = (process.env.WITH_SERVER_PORTS ?? '3109').split(',')[0];
const SORTIE = path.join(import.meta.dirname, '..', 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const prefixe = process.argv[2] ?? 'brassin';
const banc = '/work/missions/2026-11-19-bugs-ecrans/voies/y1/banc/banc-brassin.html';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const MODES = [{ id: '390x660', l: 390, h: 660, t: true }, { id: '844x340', l: 844, h: 340, t: true }, { id: '1280', l: 1280, h: 800, t: false }];
let ko = 0;
for (const mode of MODES) {
  for (const theme of ['clair', 'cave']) {
    const nav = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
    const p = await nav.newPage();
    await p.setViewport({ width: mode.l, height: mode.h, isMobile: mode.t, hasTouch: mode.t, deviceScaleFactor: 1 });
    p.setDefaultNavigationTimeout(150000);
    await p.goto(`http://localhost:${port}${banc}?theme=${theme}`, { waitUntil: 'domcontentloaded' });
    p.on('pageerror', (e) => console.log('ERREUR PAGE', String(e).slice(0, 300)));
    await p.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /^Budget, compagnon/.test(b.getAttribute('aria-label') || b.textContent.trim())), { timeout: 40000 }).catch(async () => { console.log('boutons :', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('button')].map((b) => (b.textContent.trim() || b.getAttribute('aria-label') || '').slice(0, 25))))); await p.screenshot({ path: path.join(SORTIE, 'sonde-brassin.png') }); process.exit(2); });
    await dormir(800);
    const clic = (nom) => p.evaluate((n) => { const b = [...document.querySelectorAll('button')].find((x) => (x.getAttribute('aria-label') || x.textContent.trim()).startsWith(n)); if (!b) return false; b.scrollIntoView({ block: 'center' }); b.click(); return true; }, nom);
    const plus = await clic('Budget, compagnon');
    await dormir(400);
    await p.screenshot({ path: path.join(SORTIE, `${prefixe}-${mode.id}-${theme}-plus.png`) });
    const sup = await clic('Supprimer ce brassin');
    await dormir(1200);
    const m = await p.evaluate(() => {
      const b = document.querySelector('[data-testid="bandeau-suppression"]');
      const r = b?.getBoundingClientRect();
      const feuille = document.querySelector('[role="dialog"]');
      return {
        bandeau: b ? { texte: b.textContent.trim(), left: r.left, top: r.top, right: r.right, bottom: r.bottom, vis: r.width > 0 && r.bottom <= innerHeight && r.top >= 0 && getComputedStyle(b).visibility !== 'hidden' } : null,
        feuille: feuille ? feuille.textContent.trim().slice(0, 60) : null,
        etat: document.querySelector('[data-banc-etat]')?.getAttribute('data-banc-etat'),
        brassins: document.querySelector('[data-banc-etat]')?.textContent,
      };
    });
    await p.screenshot({ path: path.join(SORTIE, `${prefixe}-${mode.id}-${theme}-1s2.png`) });
    const visible = !!(m.feuille || m.bandeau?.vis);
    if (!plus || !sup || !visible) ko++;
    console.log(mode.id, theme, 'plus', plus, 'supprimer', sup, JSON.stringify(m));
    await nav.close();
  }
}
console.log(ko ? `RETOUR INVISIBLE ${ko}` : 'RETOUR VISIBLE PARTOUT');
process.exit(ko ? 1 : 0);
