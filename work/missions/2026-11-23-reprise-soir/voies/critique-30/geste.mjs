// node geste.mjs <pre> <texte> [selecteur] [attente ms] : touche l'élément au texte, capture avant/après
import { ouvrir, sleep, photo, log, toucher, ou } from './outil.mjs';
const [pre, texte, sel, ms] = process.argv.slice(2);
const { page, cdp, lacher } = await ouvrir();
const r = await ou(page, texte, sel || 'button, a, [role=button], [role=tab], li, summary, span, div');
log(pre, 'cible', r);
if (r) { await sleep(400); const q = await ou(page, texte, sel || 'button, a, [role=button], [role=tab], li, summary, span, div'); await toucher(cdp, q.x, q.y); }
await sleep(Number(ms || 2000));
await photo(page, pre);
log(pre, (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ').slice(140, 1100));
lacher();
