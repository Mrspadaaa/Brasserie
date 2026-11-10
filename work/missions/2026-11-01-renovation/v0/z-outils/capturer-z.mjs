// Captures de la série z (rénovation, v0, 01.11) : les huit états à 390 × 844, « jour1 » à 1280 × 800, et, pour les états
// qui portent un geste (caisse : renseigner ; ajout : rien), la capture après le toucher du booster marqué data-capture-apres.
// Usage : node work/missions/2026-11-01-renovation/v0/z-outils/capturer-z.mjs [z1 z2 …]
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const v0 = path.resolve(ici, '..');
const RACINE = path.resolve(v0, '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['z1', 'z2', 'z3', 'z4'];
const ETATS = ['jour1', 'encours', 'ajout', 'ouvert', 'depasse', 'caisse', 'fini', 'horsligne'];

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
try {
  for (const id of ids) {
    const page = path.join(v0, id, 'etat.html');
    const url = `file:///${page.split(path.sep).join('/')}`;
    const p = await nav.newPage();
    const erreurs = [];
    p.on('pageerror', (e) => erreurs.push(e.message));
    await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    await p.goto(url + '?etat=jour1', { waitUntil: 'networkidle0' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(v0, id, `${id}-1280.png`) });
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    let n = 0;
    for (const e of ETATS) {
      await p.goto(url + '?etat=' + e, { waitUntil: 'networkidle0' });
      await p.evaluate(() => document.fonts.ready);
      await new Promise((r) => setTimeout(r, 150));
      await p.screenshot({ path: path.join(v0, id, `${id}-${e}.png`) });
      n++;
      const apres = await p.$('[data-capture-apres]');
      if (apres) {
        await apres.tap();
        await new Promise((r) => setTimeout(r, 250));
        await p.screenshot({ path: path.join(v0, id, `${id}-${e}-apres.png`) });
        n++;
      }
    }
    console.log(`${id} : 1280 et ${n} captures à 390${erreurs.length ? ' ; erreurs : ' + erreurs.join(' | ') : ''}`);
    await p.close();
  }
} finally { await nav.close(); }
