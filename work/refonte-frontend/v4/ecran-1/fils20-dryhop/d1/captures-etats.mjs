// Aide d'auteur : les états d'une page à 390 px (repos, paramètres d'URL, appui long sur un houblon), en PNG.
// Usage : node captures-etats.mjs <page.html> <préfixe de sortie> [états…] ; un état = « nom:?params » ou
// « fiche:<clé du houblon> ». Exemple : node captures-etats.mjs d1/etat.html captures/d1 ouvert:?ouvert legende:?legende
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const [src, pre, ...etats] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (const e of etats) {
  const [nom, arg] = [e.slice(0, e.indexOf(':')), e.slice(e.indexOf(':') + 1)];
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const url = pathToFileURL(path.resolve(src)).href;
  if (nom.startsWith('fiche')) {
    await page.goto(url, { waitUntil: 'networkidle0' }); await wait(300);
    const el = await page.$('[data-houblon="' + arg + '"].hn');
    const b = await el.boundingBox();
    await page.touchscreen.touchStart(b.x + 10, b.y + b.height / 2); await wait(650); await page.touchscreen.touchEnd(); await wait(500);
  } else { await page.goto(url + arg, { waitUntil: 'networkidle0' }); await wait(400); }
  const h = await page.evaluate(() => Math.max(844, document.documentElement.scrollHeight));
  await page.setViewport({ width: 390, height: Math.min(h, 2400), deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await wait(200);
  await page.screenshot({ path: pre + '-' + nom + '-390.png' });
  console.log('SHOT ' + pre + '-' + nom + '-390.png (' + h + ' px)');
  await page.close();
}
await browser.close();
