// Lot 21 · x1–x5 · captures des états : une page, une requête, des gestes, une capture à 390 px.
// Usage : node captures-x.mjs <page.html> <sortie.png> [hauteur] [--q=h=cascade&m=b60] [--tap=sélecteur]… [--appui=sélecteur] [--plein]
//   --tap : un toucher court sur l'élément ; --appui : un appui long de 650 ms (la fiche) ; --plein : toute la page.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const args = process.argv.slice(2);
const [src, out, h] = args.filter((a) => !a.startsWith('--'));
const q = (args.find((a) => a.startsWith('--q=')) || '').slice(4);
const gestes = args.filter((a) => /^--(tap|appui|glisse)=/.test(a));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: Number(h || 844), deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(pathToFileURL(path.resolve(src)).href + (q ? '?' + q : ''), { waitUntil: 'networkidle0' });
await wait(400);
for (const g of gestes) {
  const [k, sel] = [g.slice(2, g.indexOf('=')), g.slice(g.indexOf('=') + 1)];
  if (k === 'glisse') { // --glisse=sélecteur:dx:dy
    const [s, dx, dy] = sel.split(':'); const el = await page.$(s); const b = await el.boundingBox();
    const x = b.x + b.width / 2, y = b.y + b.height / 2; await page.touchscreen.touchStart(x, y);
    for (let i = 1; i <= 8; i++) { await page.touchscreen.touchMove(x + (Number(dx) * i) / 8, y + (Number(dy) * i) / 8); await wait(30); }
    await page.touchscreen.touchEnd(); await wait(400); continue;
  }
  const el = await page.$(sel);
  if (!el) { console.log('absent : ' + sel); continue; }
  await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  if (k === 'tap') { try { await el.tap(); } catch { await el.click(); } await wait(450); }
  else { const t = await el.touchStart(); await wait(650); await t.end(); await wait(600); }
}
if (gestes.length && !args.includes('--garder')) await page.evaluate(() => window.scrollTo(0, 0));
await wait(150);
await page.screenshot({ path: out, fullPage: args.includes('--plein') });
await browser.close();
console.log('SHOT ' + out);
