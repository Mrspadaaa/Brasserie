// Captures propres de l'existant (références des pages de choix) : Bord au repos, recherche vide, menu ⋮, menu du +.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/package.json');
const puppeteer = require('puppeteer-core');
const BASE = 'http://localhost:3020/?dev-local';
const OUT = new URL('./references/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
fs.mkdirSync(OUT, { recursive: true });
const dormir = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
for (const [mode, w, h, t] of [['390', 390, 844, true], ['1280', 1280, 800, false]]) for (const th of ['clair', 'cave']) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, isMobile: t, hasTouch: t, deviceScaleFactor: t ? 2 : 1 });
  const bord = async () => {
    await p.goto(BASE, { waitUntil: 'domcontentloaded' });
    await p.evaluate(x => localStorage.setItem('laffinee.theme', x), th);
    await p.goto(BASE, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => document.querySelector('nav[aria-label="Navigation principale"]'), { timeout: 90000 });
    await dormir(5000); // laisse passer le toast d'initialisation
    await p.evaluate(() => [...document.querySelectorAll('nav[aria-label="Navigation principale"] button')].find(x => x.innerText.trim() === 'Bord')?.click());
    await dormir(1200);
  };
  const clic = re => p.evaluate((s) => { const r = new RegExp(s); const e = [...document.querySelectorAll('button')].find(x => x.offsetParent && r.test(x.getAttribute('aria-label') || x.innerText)); e?.click(); return !!e; }, re);
  const k = `${mode}-${th}`;
  await bord(); await p.screenshot({ path: `${OUT}${k}-bord.png` });
  await clic('^Rechercher'); await dormir(800); await p.screenshot({ path: `${OUT}${k}-recherche.png` }); await p.keyboard.press('Escape'); await dormir(500);
  await clic('^Menu$'); await dormir(700); await p.screenshot({ path: `${OUT}${k}-menu.png` }); await p.keyboard.press('Escape'); await dormir(500);
  await bord(); await clic('^Actions rapides'); await dormir(700); await p.screenshot({ path: `${OUT}${k}-plus.png` });
  await bord(); await clic('^Menu$'); await dormir(600); await clic('^Réglages'); await dormir(1500); await p.screenshot({ path: `${OUT}${k}-reglages.png` });
  await bord(); await clic('^Menu$'); await dormir(600); await clic('^Journal des modifications'); await dormir(1500); await p.screenshot({ path: `${OUT}${k}-journal.png` });
  await p.close();
}
await b.close();
