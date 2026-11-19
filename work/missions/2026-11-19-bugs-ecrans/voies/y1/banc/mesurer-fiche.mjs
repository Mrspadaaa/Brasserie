// y1 / BR-103, TL-31, BE-56 : la fiche recette défile par pas de 24 px ; à chaque pas, ce que le + recouvre (texte, commandes). 390×660 et 1280×800, clair et cave.
// node scripts/with_server.mjs --server "npm run dev -- --port 3109 --strictPort" --port 3109 --env VITE_FIREBASE_API_KEY=fake -- node <ce fichier> [prefixe]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { sousLePlus } from './sous-le-plus.mjs';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const port = (process.env.WITH_SERVER_PORTS ?? '3109').split(',')[0];
const SORTIE = path.join(import.meta.dirname, '..', 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const prefixe = process.argv[2] ?? 'fiche';
const banc = '/work/missions/2026-11-19-bugs-ecrans/voies/y1/banc/banc-fiche.html';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const rapport = new Set();
for (const [id, l, h, t] of [['390x660', 390, 660, true], ['844x340', 844, 340, true], ['1280', 1280, 800, false]]) {
  for (const theme of ['clair', 'cave']) {
    const nav = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
    const p = await nav.newPage();
    await p.setViewport({ width: l, height: h, isMobile: t, hasTouch: t, deviceScaleFactor: 1 });
    p.setDefaultNavigationTimeout(150000);
    await p.goto(`http://localhost:${port}${banc}?theme=${theme}`, { waitUntil: 'domcontentloaded' });
    await p.waitForSelector('[data-page-shell] main', { timeout: 150000 });
    await dormir(1500);
    const max = await p.evaluate(() => { const m = document.querySelector('[data-page-shell] main'); return m.scrollHeight - m.clientHeight; });
    // Défilement continu vers le bas, un pas de 48 px toutes les 220 ms : plus court que le repos (700 ms) du + qui se masque, plus long que sa transition (160 ms).
    for (let y = 0; y <= max + 48; y += 48) {
      await p.evaluate((yy) => { document.querySelector('[data-page-shell] main').scrollTop = yy; }, y);
      await dormir(220);
      const r = await p.evaluate(sousLePlus);
      for (const c of r?.trouves ?? []) rapport.add(`${id} ${theme} : le + recouvre ${c.genre} « ${c.nom} »`);
      if (process.env.SONDE && theme === 'clair' && (y === 0 || y % 96 === 0)) console.log(id, 'y', y, 'fab', JSON.stringify(r?.fab && { l: Math.round(r.fab.left), t: Math.round(r.fab.top), b: Math.round(r.fab.bottom) }), 'sous le + :', (r?.trouves ?? []).map((c) => c.nom).join(' | '));
    }
    await p.evaluate(() => { const m = document.querySelector('[data-page-shell] main'); m.scrollTop = m.scrollHeight; });
    await dormir(1200); // l'arrêt : le + se réaffiche après 700 ms
    await p.screenshot({ path: path.join(SORTIE, `${prefixe}-${id}-${theme}-bas.png`) });
    console.log(id, theme, 'hauteur défilable', max);
    await nav.close();
  }
}
console.log([...rapport].slice(0, 60).join('\n'));
console.log(rapport.size ? `RECOUVREMENTS ${rapport.size}` : 'AUCUN RECOUVREMENT');
process.exit(rapport.size ? 1 : 0);
