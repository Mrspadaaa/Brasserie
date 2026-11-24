import { ouvrir, sleep, photo, log, toucher, ou, glisser } from './outil.mjs';
import { outils, court } from './commun.mjs';
import { etat } from './lire.mjs';
import fs from 'node:fs';
const { page, cdp, lacher } = await ouvrir();
const { instantane, duree } = outils(page, cdp);
await page.evaluate(() => scrollTo(0, 0)); await duree('An'); await sleep(1000);
for (let i = 0; i < 3; i++) { const p = await ou(page, 'Poignée de début'); await glisser(cdp, p.x, p.y, p.x - 15, p.y, { tenir: 80, n: 8 }); await sleep(1300); }
log('vue', court(await etat(page)));
const av = JSON.parse(fs.readFileSync('avant.json', 'utf8')); const ap = await instantane();
const cle = (s) => s.split(',').slice(0, 3).join(',');
const A = av.map(cle), B = ap.map(cle);
log('avant', av.length, 'après', ap.length, 'disparues', A.filter((x) => !B.includes(x)), 'nouvelles', B.filter((x) => !A.includes(x)));
await duree('6 sem.'); await sleep(1000); const a = await ou(page, 'Revenir à aujourd’hui', 'button'); if (a) { await toucher(cdp, a.x, a.y); await sleep(1000); }
log('fin', court(await etat(page)));
lacher();
