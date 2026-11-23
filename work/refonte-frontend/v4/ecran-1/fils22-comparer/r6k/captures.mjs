// r6k : les captures à 390 px (puppeteer). Usage : node captures.mjs [nom…]
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const ici = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(ici, '../../../../../../package.json'));
const puppeteer = require('puppeteer-core');
const page0 = pathToFileURL(path.join(ici, 'etat.html')).href;
const out = (n) => path.join(ici, '../captures/r6k-' + n + '.png');
const ETATS = {
  '390': { q: '', plein: true },
  'premier-ecran': { q: '' },
  'fiche-390': { q: '?fiche=Galaxy' },
  'toucher-390': { q: '?ouvert&avant=Galaxy', vers: '.ouvre' },
  'absolu-390': { q: '?abs', plein: true },
  'legende-390': { q: '?legende' },
};
const choix = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const [n, e] of Object.entries(ETATS)) {
  if (choix.length && !choix.includes(n)) continue;
  const p = await browser.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(page0 + e.q, { waitUntil: 'networkidle0' });
  if (e.vers) await p.evaluate((s) => { const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 60); }, e.vers);
  await new Promise((r) => setTimeout(r, 400));
  await p.screenshot({ path: out(n), fullPage: !!e.plein });
  await p.close();
  console.log('SHOT r6k-' + n + '.png');
}
await browser.close();
