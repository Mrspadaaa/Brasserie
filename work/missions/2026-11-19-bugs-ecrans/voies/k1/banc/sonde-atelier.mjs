// k1 : où vivent les onglets « Ma bière · Décider · Explorer · Historique » dans l'éditeur (classe, parent, boîte) ?
import path from 'node:path';
import { createRequire } from 'node:module';
const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const port = (process.env.WITH_SERVER_PORTS ?? '3109').split(',')[0];
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
const p = await nav.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
await p.setRequestInterception(true);
p.on('request', (r) => (['http://localhost', 'data:', 'blob:', 'about:', 'ws://localhost'].some((d) => r.url().startsWith(d)) ? r.continue() : r.abort()));
await p.goto(`http://localhost:${port}/?dev-local&etape=houblons`, { waitUntil: 'domcontentloaded' });
await p.waitForSelector('.recipe-step-actions', { timeout: 120000 });
await new Promise((r) => setTimeout(r, 4000));
console.log(JSON.stringify(await p.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Historique');
  const ant = []; for (let e = b; e && ant.length < 7; e = e.parentElement) ant.push(`${e.tagName}.${String(e.className).slice(0, 50)}`);
  return { trouve: !!b, ant, nav: document.querySelectorAll('.hv-nav').length, boite: b && JSON.stringify(b.getBoundingClientRect()), h1: document.querySelector('[data-page-shell] h1')?.textContent };
}), null, 1));
await p.screenshot({ path: path.join(import.meta.dirname, '..', 'captures', 'sonde-atelier.png'), fullPage: true });
console.log(await p.evaluate(() => [...document.querySelectorAll('button,summary,h1,h2,h3')].map((e) => e.textContent.trim().slice(0, 30)).filter(Boolean).join(' | ')));
await nav.close();
