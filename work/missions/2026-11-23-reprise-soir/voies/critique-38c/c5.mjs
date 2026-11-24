import { ouvrir, sleep, photo, log, boutons, toucher, ou, CAP } from './outil.mjs';
import { etat } from './lire.mjs';
import { court, outils } from './commun.mjs';
import fs from 'node:fs'; import path from 'node:path';
const { page, cdp, lacher } = await ouvrir();
const clip = async (nom, x, y, w, h, s = 3) => { const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x, y, width: w, height: h, scale: s } }); fs.writeFileSync(path.join(CAP, nom + '.png'), Buffer.from(data, 'base64')); };
await page.evaluate(() => scrollTo(0, 0)); await sleep(500);
log('20', court(await etat(page)));
await photo(page, 'C5-01-20mois-haut', false);
await clip('C5-01g-bord-gauche', 0, 150, 40, 694, 2); await clip('C5-01d-bord-droit', 350, 150, 40, 694, 2);
// pixels des bords : couleur à x=0..3 et 386..389 sur plusieurs y
const pix = async (tag) => { const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 390, height: 844, scale: 1 } }); fs.writeFileSync(path.join(CAP, tag + '-raw.png'), Buffer.from(data, 'base64')); };
const H = await page.evaluate(() => document.scrollingElement.scrollHeight);
for (let y = 600; y < H; y += 600) { await page.evaluate((y) => scrollTo(0, y), y); await sleep(700); await photo(page, 'C5-02-20mois-y' + y, false); }
await page.evaluate(() => scrollTo(0, 99999)); await sleep(800); await photo(page, 'C5-03-20mois-bas', false);
await clip('C5-03g-bord-gauche-bas', 0, 150, 40, 694, 2); await clip('C5-03d-bord-droit-bas', 350, 150, 40, 694, 2);
log('bas', await page.evaluate(() => { const n = document.querySelector('nav').getBoundingClientRect(); const els = [...document.querySelectorAll('main *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight; }); const maxB = Math.max(...els.map((e) => e.getBoundingClientRect().bottom)); return { navTop: n.top, contenuBas: maxB, scrollY, H: document.scrollingElement.scrollHeight }; }));
lacher();
