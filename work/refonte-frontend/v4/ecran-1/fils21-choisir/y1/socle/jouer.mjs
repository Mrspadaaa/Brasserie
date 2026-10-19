// Série « au doigt » : jouer un geste au doigt (puppeteer-core, écran tactile émulé), capturer avant et
// après, et relever les valeurs que la page affiche (window.__releve). Commun à y1–y5.
//   const J = await ouvrir('y1/etat.html') ; await J.capture('y1-avant') ; await J.glisser([[x, y], …]) ;
//   const v = await J.releve() ; await J.fermer()
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const ici = path.dirname(fileURLToPath(import.meta.url));
export const D21 = path.resolve(ici, '../..');
export const CAPT = path.join(D21, 'captures');
export const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

export async function ouvrir(page, o = {}) {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const p = await browser.newPage();
  const erreurs = [];
  p.on('pageerror', (e) => erreurs.push(String(e.message || e)));
  p.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
  await p.setViewport({ width: 390, height: o.hauteur || 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(pathToFileURL(path.join(D21, page)).href + (o.query || ''), { waitUntil: 'networkidle0', timeout: 30000 });
  await attendre(400);
  const J = {
    p, erreurs,
    async capture(nom, o2 = {}) { fs.mkdirSync(CAPT, { recursive: true }); const f = path.join(CAPT, nom + '.png'); await p.screenshot({ path: f, fullPage: !!o2.pleine }); return f; },
    releve: () => p.evaluate(() => (window.__releve ? window.__releve() : null)),
    boite: (sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: 'nearest' }); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; }, sel),
    // Un doigt : posé, glissé par étapes (chaque étape en plusieurs pas), levé ou non.
    async glisser(pts, o3 = {}) {
      const [x0, y0] = pts[0];
      await p.touchscreen.touchStart(x0, y0); await attendre(o3.pause || 60);
      for (let k = 1; k < pts.length; k++) {
        const [xa, ya] = pts[k - 1], [xb, yb] = pts[k], n = o3.pas || 8;
        for (let s = 1; s <= n; s++) { await p.touchscreen.touchMove(xa + ((xb - xa) * s) / n, ya + ((yb - ya) * s) / n); await attendre(o3.delai || 16); }
      }
      if (!o3.garder) await p.touchscreen.touchEnd();
      await attendre(250);
    },
    lever: async () => { await p.touchscreen.touchEnd(); await attendre(250); },
    async toucher(x, y, ms = 60) { await p.touchscreen.touchStart(x, y); await attendre(ms); await p.touchscreen.touchEnd(); await attendre(250); },
    // Deux doigts (pincer, poser à deux) : Input.dispatchTouchEvent avec deux points.
    async deuxDoigts(a0, b0, a1, b1, n = 10) {
      const c = await p.target().createCDPSession();
      const tp = (a, b) => [{ x: a[0], y: a[1], id: 1 }, { x: b[0], y: b[1], id: 2 }];
      await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(a0, b0) });
      for (let s = 1; s <= n; s++) { const l = (u, v) => [u[0] + (v[0] - u[0]) * s / n, u[1] + (v[1] - u[1]) * s / n]; await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(l(a0, a1), l(b0, b1)) }); await attendre(20); }
      await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await attendre(250);
    },
    fermer: () => browser.close(),
  };
  return J;
}
/** Écrit la preuve du geste : valeurs avant, pendant, après ; captures ; erreurs. */
export function preuve(v, nom, o) { const f = path.join(D21, v, nom + '.json'); fs.writeFileSync(f, JSON.stringify(o, null, 1)); console.log('preuve ' + path.relative(D21, f)); }
