import { ouvrir, sleep, photo, log, boutons, toucher, ou, glisser, CAP } from './outil.mjs';
import { etat } from './lire.mjs';
import { court, outils } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
await page.evaluate(() => scrollTo(0, 0));
for (let i = 0; i < 8; i++) {
  const e = await etat(page); const m = /(\d+) mois/.exec(e.duree || '');
  if (m && +m[1] >= 19 && +m[1] <= 21) break;
  const p = await ou(page, 'Poignée de début');
  if (!p) { log('pas de poignée'); break; }
  const dx = m && +m[1] > 21 ? 15 : -15;
  await glisser(cdp, p.x, p.y, Math.max(2, p.x + dx), p.y, { tenir: 80, n: 8 });
  await sleep(1300); log('pas', i, court(await etat(page)), (await boutons(page, 'Poign|Revenir')).join(' ; '));
}
lacher();
