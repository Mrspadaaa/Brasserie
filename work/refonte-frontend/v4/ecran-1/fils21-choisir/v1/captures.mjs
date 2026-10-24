// Lot 21 · v1, v2, v3 : les captures des états (390 px, ×2), comme capture-page.mjs, avec une requête
// (?b=Galaxy, ?abs, ?fiche=Citra, ?legende…) et, au besoin, la page entière ou un geste joué.
// Usage : node captures.mjs <page.html> <sortie.png> [hauteur|pleine] [requête] [clic:sélecteur;…]
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const [src, out, h = '844', q = '', gestes = ''] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: h === 'pleine' ? 844 : Number(h), deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(pathToFileURL(path.resolve(src)).href + q, { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 500));
for (const g of gestes.split(';').filter(Boolean)) {
  const [k, sel] = g.split(/:(.*)/s);
  if (k === 'clic') { await page.$eval(sel, (e) => { e.scrollIntoView({ block: 'center' }); e.click(); }); }
  if (k === 'defile') { await page.$eval(sel, (e) => e.scrollIntoView({ block: 'start' })); }
  if (k === 'valeur') { const [s, v] = sel.split('='); await page.$eval(s, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, v); }
  await new Promise((r) => setTimeout(r, 350));
}
await page.screenshot({ path: out, fullPage: h === 'pleine' });
await browser.close();
console.log('SHOT ' + out);
