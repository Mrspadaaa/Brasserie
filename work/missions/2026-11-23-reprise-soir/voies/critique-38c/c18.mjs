import { ouvrir, sleep, photo, log, toucher, ou, glisser, CAP } from './outil.mjs';
import { outils, court } from './commun.mjs';
import { etat } from './lire.mjs';
import fs from 'node:fs'; import path from 'node:path';
const { page, cdp, lacher } = await ouvrir();
const { duree } = outils(page, cdp);
const det = () => page.evaluate(() => [...document.querySelectorAll('[data-bande-semaines] *, [data-bande-colonnes] *')].filter((x) => x.childElementCount === 0 && /\d{4}|’/.test(x.textContent) && x.getBoundingClientRect().width > 0).map((x) => x.textContent.trim() + '@' + Math.round(x.getBoundingClientRect().left) + '[' + (x.parentElement.getAttribute('aria-label') || '') + ']').join(' '));
for (const dx of [6, 6, 6, -24, -4, -4]) {
  const p = await ou(page, 'Poignée de début'); await glisser(cdp, p.x, p.y, p.x + dx, p.y, { tenir: 80, n: 6 }); await sleep(1300);
  const e = await etat(page); log(dx, court(e), await det());
  if (/2025/.test(e.axe) && /avr\. 2026|mai 2026|mars 2026/.test(e.cadre)) { await page.evaluate(() => scrollTo(0, 0)); await photo(page, 'C18-01-2025', false); const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 160, width: 390, height: 40, scale: 3 } }); fs.writeFileSync(path.join(CAP, 'C18-02-axe.png'), Buffer.from(data, 'base64')); break; }
}
lacher();
