// Planche d'une version : ses 10 captures côte à côte (2 rangées de 5), pour les regarder d'un coup. Usage : node planche.mjs p4b-1 [p4b-2 …]
import puppeteer from '../../../../node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { writeFileSync, unlinkSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const ECRANS = ['liste', 'organise', 'organise-ligne', 'organise-aide', 'achat', 'decider', 'afaire', 'relecture', 'erreur', 'memo'];
const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
const page = await browser.newPage();
try {
  await page.setViewport({ width: 1960, height: 1800, deviceScaleFactor: 1 });
  for (const v of process.argv.slice(2)) {
    const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#333;font:14px system-ui;color:#fff;display:grid;grid-template-columns:repeat(5,390px);gap:8px;padding:8px">` +
      ECRANS.map(e => `<figure style="margin:0"><figcaption>${v} · ${e}</figcaption><img src="${pathToFileURL(path.join(ICI, 'cap', `${v}-${e}.png`)).href}" style="width:390px;height:844px;display:block"></figure>`).join('') + '</body>';
    const tmp = path.join(ICI, 'cap', `_planche-${v}.html`);
    writeFileSync(tmp, html);
    await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
    await page.screenshot({ path: path.join(ICI, 'cap', `planche-${v}.png`), fullPage: true });
    unlinkSync(tmp);
    console.log('planche', v);
  }
} finally {
  await page.close();
  browser.disconnect();
}
