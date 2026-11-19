// Sonde : structure du wizard (qui défile, où est le +). node scripts/with_server.mjs ... -- node sonde.mjs
import { createRequire } from 'node:module';
import path from 'node:path';
const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const port = (process.env.WITH_SERVER_PORTS ?? '3109').split(',')[0];
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
const p = await nav.newPage();
await p.setViewport({ width: 390, height: 660, isMobile: true, hasTouch: true });
await p.goto(`http://localhost:${port}/?dev-local&etape=houblons&recette=vide`, { waitUntil: 'domcontentloaded', timeout: 150000 });
await p.waitForSelector('.recipe-step-actions', { timeout: 150000 });
await new Promise((r) => setTimeout(r, 1500));
console.log(JSON.stringify(await p.evaluate(() => {
  const nav = document.querySelector('.recipe-step-actions');
  const chaine = []; for (let n = nav; n && n !== document.body; n = n.parentElement) chaine.push(`${n.tagName.toLowerCase()}${n.id ? '#' + n.id : ''}.${[...n.classList].slice(0, 3).join('.')} ov=${getComputedStyle(n).overflowY} sh=${n.scrollHeight} ch=${n.clientHeight}`);
  const fab = document.querySelector('.floating-actions');
  return { chaine, fab: fab ? fab.outerHTML.slice(0, 300) : null, rect: document.querySelector('.floating-actions > button')?.getBoundingClientRect(), shell: !!document.querySelector('[data-page-shell]') };
}), null, 1));
await nav.close();
