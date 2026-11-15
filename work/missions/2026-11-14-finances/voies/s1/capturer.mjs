// Captures 390 px, échelle 2, de chaque état (section[data-etat]) des maquettes s1 ; mesure le débord de la rangée du haut.
// Usage : node work/missions/2026-11-14-finances/voies/s1/capturer.mjs s1a,s1b,s1c,s1d
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(ICI, '../../../../../package.json'));
const puppeteer = require('puppeteer-core');
const ids = (process.argv[2] || 's1a,s1b,s1c,s1d').split(',');
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--lang=fr-CH'] });
for (const id of ids) {
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const err = [];
  p.on('pageerror', (e) => err.push(e.message));
  await p.goto(pathToFileURL(join(ICI, id, 'etat.html')).href, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  const m = await p.evaluate((id) => [...document.querySelectorAll('section[data-etat]')].map((s) => {
    const top = s.querySelector(`.${id}-top`);
    const band = s.querySelector(`.${id}-band`);
    const kids = [...top.children].map((k) => k.getBoundingClientRect());
    const tops = new Set(kids.map((r) => Math.round(r.top)));
    const droite = Math.max(...kids.map((r) => r.right));
    const bb = band.getBoundingClientRect();
    const petits = [...s.querySelectorAll('button,label')].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && (r.width < 24 || r.height < 24);
    }).map((e) => e.className + ':' + e.textContent.trim().slice(0, 12));
    const polices = [...new Set([...s.querySelectorAll('b,span')].map((e) => getComputedStyle(e).fontFamily.split(',')[0]))].join('|');
    return `${s.dataset.etat}: rangée haut ${tops.size === 1 ? 'une ligne' : 'REPLIÉE'}, droite ${Math.round(droite)} / bande ${Math.round(bb.right - 8)}, hauteur ${Math.round(s.getBoundingClientRect().height)}, cibles<24 ${petits.length ? petits.join(' ; ') : 0}, polices ${polices}`;
  }), id);
  const fontsOk = await p.evaluate(() => document.fonts.check('600 14px "IBM Plex Mono"') && document.fonts.check('400 14px "Source Sans 3"'));
  console.log(id, err.length ? 'ERREURS ' + err.join(' | ') : 'sans erreur', 'polices chargées', fontsOk);
  m.forEach((l) => console.log('  ' + l));
  for (const s of await p.$$('section[data-etat]')) {
    const e = await s.evaluate((x) => x.dataset.etat);
    await s.screenshot({ path: join(ICI, id, `${id}-${e}.png`) });
  }
  await p.close();
}
await b.close();
