// Lot 20 · captures des états d'une page (requêtes ?lev=…, ?detail=…, ?fiche=…, ?legende, ?abs), à 390 px.
// Usage : node captures-etats.mjs <page.html> <préfixe de sortie> <requête>… → <préfixe>-<n>.png
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const [f, prefixe, ...qs] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
let i = 0;
for (const q of qs) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.resolve(f)).href + '?' + q, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 400));
  const out = prefixe + '-' + (++i) + '.png';
  await page.screenshot({ path: out });
  console.log(out + ' ← ' + q);
  await page.close();
}
await browser.close();
