// y1 / T3-10 (Courses) : en défilant l'écran Courses du banc, mesure si le + flottant recouvre une quantité (« 2 L », « à définir », « 133,7 g »…)
// ou un contrôle (Copier), à 390×660 tactile, 844×340 tactile et 1280×800, clair et cave. Code 1 si recouvrement.
// node scripts/with_server.mjs --server "npm run dev -- --port 3109 --strictPort" --port 3109 -- node <ce fichier> [prefixe]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const port = (process.env.WITH_SERVER_PORTS ?? '3109').split(',')[0];
const SORTIE = path.join(import.meta.dirname, '..', 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const prefixe = process.argv[2] ?? 'courses';
const banc = '/work/missions/2026-11-19-bugs-ecrans/voies/y1/banc/banc.html';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const MODES = [
  { id: '390x660', l: 390, h: 660, tactile: true },
  { id: '844x340', l: 844, h: 340, tactile: true },
  { id: '1280', l: 1280, h: 800, tactile: false },
];
const rapport = [];
let lignes = 0;
for (const mode of MODES) {
  for (const theme of ['clair', 'cave']) {
    const nav = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
    const p = await nav.newPage();
    await p.setViewport({ width: mode.l, height: mode.h, isMobile: mode.tactile, hasTouch: mode.tactile, deviceScaleFactor: 1 });
    p.setDefaultNavigationTimeout(150000);
    // Serveur Vite à froid : la première visite déclenche une optimisation de dépendances et un rechargement de page ; on la laisse finir, puis on rouvre.
    await p.goto(`http://localhost:${port}${banc}?theme=${theme}`, { waitUntil: 'domcontentloaded' });
    await dormir(6000);
    await p.goto(`http://localhost:${port}${banc}?theme=${theme}`, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => document.querySelector('[data-stock-sources], .font-mono.text-ebc-straw') !== null || /Courses/.test(document.body.innerText), { timeout: 150000 });
    await dormir(1500);
    await p.evaluate(() => { [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Tout voir')?.click(); });
    await dormir(800);
    const total = await p.evaluate(() => document.documentElement.scrollHeight);
    let nb = 0;
    for (let y = 0; y <= Math.max(0, total - mode.h) + 1; y += 16) {
      await p.evaluate((yy) => window.scrollTo(0, yy), y);
      await dormir(30);
      const m = await p.evaluate(() => {
        const fab = document.querySelector('.floating-actions > button');
        if (!fab) return null;
        const b = fab.getBoundingClientRect();
        const cibles = [...document.querySelectorAll('li .font-mono.text-ebc-straw, section.panel button')].map((e) => {
          const r = e.getBoundingClientRect();
          return { nom: e.textContent.trim().slice(0, 30), left: r.left, top: r.top, right: r.right, bottom: r.bottom };
        });
        return { fab: { left: b.left, top: b.top, right: b.right, bottom: b.bottom, w: b.width, h: b.height }, cibles, n: document.querySelectorAll('li .font-mono.text-ebc-straw').length };
      });
      if (!m) { rapport.push(`${mode.id} ${theme} : pas de bouton +`); continue; }
      nb = m.n;
      for (const c of m.cibles) {
        const x = Math.max(0, Math.min(m.fab.right, c.right) - Math.max(m.fab.left, c.left));
        const yy = Math.max(0, Math.min(m.fab.bottom, c.bottom) - Math.max(m.fab.top, c.top));
        if (x * yy > 4 && c.bottom > 0 && c.top < mode.h) rapport.push(`${mode.id} ${theme} défilé ${y} : le + (${Math.round(m.fab.left)},${Math.round(m.fab.top)}) recouvre « ${c.nom} » de ${Math.round(x * yy)} px²`);
      }
    }
    lignes = Math.max(lignes, nb);
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await dormir(200);
    await p.screenshot({ path: path.join(SORTIE, `${prefixe}-${mode.id}-${theme}.png`) });
    await nav.close();
  }
}
const uniques = [...new Set(rapport)];
console.log(`quantités vues : ${lignes}`);
console.log(uniques.slice(0, 40).join('\n'));
console.log(uniques.length ? `RECOUVREMENTS ${uniques.length}` : 'AUCUN RECOUVREMENT');
process.exit(uniques.length ? 1 : 0);
