// Captures page entière (deviceScaleFactor 2) d'une variante : <id>-clair.png puis <id>-cave.png (data-theme="cave").
// Usage : node capture.mjs s3a [s3b …] ; aucun appel réseau (requêtes http bloquées et comptées).
import { createRequire } from 'node:module';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ICI = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(resolve(ICI, '../../../../..'), 'package.json'));
const puppeteer = require('puppeteer-core');
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
for (const id of process.argv.slice(2)) {
  for (const theme of ['clair', 'cave']) {
    const p = await b.newPage();
    let reseau = 0;
    await p.setRequestInterception(true);
    p.on('request', (r) => (/^https?:/.test(r.url()) ? (reseau++, r.abort()) : r.continue()));
    await p.setViewport({ width: 1660, height: 900, deviceScaleFactor: 2 });
    await p.goto(pathToFileURL(join(ICI, id, 'etat.html')).href);
    await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    await p.evaluate(() => document.fonts.ready);
    const petits = await p.evaluate(() => {
      const out = new Set();
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        const el = n.parentElement;
        if (!n.textContent.trim() || el.closest('.' + document.title.split(' ')[0] + '-fond')) continue;
        const s = parseFloat(getComputedStyle(el).fontSize);
        if (s < 12) out.add(n.textContent.trim().slice(0, 30) + ' ' + s);
      }
      return [...out];
    });
    await p.screenshot({ path: join(ICI, id, `${id}-${theme}.png`), fullPage: true });
    console.log(`${id}-${theme}.png réseau=${reseau} texte<12px=${petits.length ? petits.join(' | ') : 0}`);
    await p.close();
  }
}
await b.close();
