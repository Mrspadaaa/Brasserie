// Découpe chaque cadre [data-cadre] d'une page etat.html en une image (mission 2026-11-14-compagnon).
// Usage : node work/missions/2026-11-14-compagnon/outils/decouper-cadres.mjs <dossier img> <id>=<etat.html> … [--cave]
// Écrit <dossier img>/<id>-<cadre>.png (et <id>-<cadre>-cave.png avec --cave). Imprime DECOUPE OK n images.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const args = process.argv.slice(2);
const out = args.shift();
const cave = args.includes('--cave');
const pages = args.filter((a) => a.includes('='));
mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
let n = 0;
const ech = [];
try {
  for (const spec of pages) {
    const [id, file] = spec.split('=');
    for (const theme of cave ? ['clair', 'cave'] : ['clair']) {
      const page = await browser.newPage();
      await page.setViewport({ width: 6000, height: 1200, deviceScaleFactor: 2 });
      await page.goto(pathToFileURL(resolve(file)).href, { waitUntil: 'load' });
      if (theme === 'cave') await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'cave'));
      await new Promise((r) => setTimeout(r, 200));
      const cadres = await page.$$('[data-cadre]');
      if (!cadres.length) ech.push(`${id}: aucun cadre`);
      for (const el of cadres) {
        const nom = await el.evaluate((e) => e.getAttribute('data-cadre'));
        await el.screenshot({ path: `${out}/${id}-${nom}${theme === 'cave' ? '-cave' : ''}.png` });
        n++;
      }
      await page.close();
    }
  }
} finally { await browser.close(); }
console.log(ech.length ? 'DECOUPE ECHEC\n' + ech.join('\n') : `DECOUPE OK ${n} images`);
process.exit(ech.length ? 1 : 0);
