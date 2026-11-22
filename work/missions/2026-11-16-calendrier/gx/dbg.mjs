// node gx/dbg.mjs <page…> : éléments qui dépassent à droite (débord horizontal)
import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core'); const H = path.dirname(fileURLToPath(import.meta.url));
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
for (const n of process.argv.slice(2)) {
  await p.goto('file:///' + path.join(H, n + '.html').split(path.sep).join('/')); await p.waitForSelector('body[data-gx=pret]');
  console.log(n, await p.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > 391 && e.getBoundingClientRect().width).slice(0, 8).map((e) => (e.className.baseVal ?? e.className) + ' ' + Math.round(e.getBoundingClientRect().right)).join(' | ')));
}
await nav.close();
