// Captures avant / après geste des variantes u1–u6, à 390 × 844, au doigt (toucher simulé).
// Usage (depuis fils21-choisir) : node u1/outils/captures.mjs u1 [u2 …]
// Écrit captures/<u>/<n>-<nom>.png et imprime les erreurs de console de la page.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');

const FILS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tap = (sel) => async (p) => { const e = await p.waitForSelector(sel, { timeout: 4000 }); const b = await e.boundingBox(); await p.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); };
const drag = (sel, dx, dy = 0, steps = 12) => async (p) => {
  const e = await p.waitForSelector(sel, { timeout: 4000 }); const b = await e.boundingBox();
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await p.mouse.move(x, y); await p.mouse.down();
  for (let i = 1; i <= steps; i++) await p.mouse.move(x + dx * i / steps, y + dy * i / steps);
  await p.mouse.up();
};
const scroll = (y) => async (p) => p.evaluate((v) => window.scrollTo(0, v), y);
const wait = (ms) => async () => new Promise((r) => setTimeout(r, ms));

// Scénarios : une suite d'étapes ; une étape « shot » prend une capture.
const SCEN = JSON.parse(fs.readFileSync(path.join(FILS, 'u1/outils/scenarios.json'), 'utf8'));
const ACTIONS = { tap, drag, scroll, wait };

const ids = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const id of ids) {
  const out = path.join(FILS, 'captures', id);
  fs.mkdirSync(out, { recursive: true });
  for (const sc of SCEN[id] || []) {
    const page = await browser.newPage();
    const erreurs = [];
    page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
    page.on('pageerror', (e) => erreurs.push(String(e)));
    await page.setViewport({ width: 390, height: sc.hauteur || 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(pathToFileURL(path.join(FILS, id, 'etat.html')).href + (sc.query || ''), { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 500));
    let n = 0;
    for (const st of sc.etapes) {
      if (st[0] === 'shot') {
        await new Promise((r) => setTimeout(r, st[2] ?? 700));
        const f = path.join(out, `${sc.nom}-${String(++n).padStart(2, '0')}-${st[1]}.png`);
        await page.screenshot({ path: f, fullPage: !!st[3] });
        console.log('SHOT', path.relative(FILS, f));
      } else await ACTIONS[st[0]](...st.slice(1))(page);
    }
    if (erreurs.length) console.log('ERREURS', id, sc.nom, erreurs.slice(0, 5));
    await page.close();
  }
}
await browser.close();
