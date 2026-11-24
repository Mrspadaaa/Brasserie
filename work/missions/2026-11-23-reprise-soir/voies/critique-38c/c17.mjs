import { ouvrir, sleep, photo, log, toucher, ou, glisser, CAP } from './outil.mjs';
import { outils, court } from './commun.mjs';
import { etat } from './lire.mjs';
import fs from 'node:fs'; import path from 'node:path';
const { page, cdp, lacher } = await ouvrir();
const { duree } = outils(page, cdp);
await page.evaluate(() => scrollTo(0, 0)); await duree('An'); await sleep(1000);
for (let i = 0; i < 3; i++) { const p = await ou(page, 'Poignée de début'); await glisser(cdp, p.x, p.y, p.x - 15, p.y, { tenir: 80, n: 8 }); await sleep(1300); }
log('vue', court(await etat(page)));
await photo(page, 'C17-01-19mois', false);
const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 160, width: 390, height: 40, scale: 3 } }); fs.writeFileSync(path.join(CAP, 'C17-02-axe.png'), Buffer.from(data, 'base64'));
log('axe détail', await page.evaluate(() => [...document.querySelectorAll('[data-bande-semaines] *, [data-bande-colonnes] *')].filter((x) => x.childElementCount === 0 && x.textContent.trim() && x.getBoundingClientRect().width > 0).map((x) => x.textContent.trim() + '@' + Math.round(x.getBoundingClientRect().left) + (x.getAttribute('title') ? '(' + x.getAttribute('title') + ')' : '') + (x.parentElement.getAttribute('aria-label') ? '[' + x.parentElement.getAttribute('aria-label') + ']' : ''))));
lacher();
