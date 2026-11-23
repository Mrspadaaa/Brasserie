// node feuille.mjs <pre> <texte> [attente] : touche le plus petit élément visible contenant le texte
import { ouvrir, sleep, photo, log, toucher } from './outil.mjs';
const [pre, texte, ms] = process.argv.slice(2);
const { page, cdp, lacher } = await ouvrir();
const trouve = () => page.evaluate((t) => { const els = [...document.querySelectorAll('*')].filter((e) => (e.textContent || '').includes(t) || (e.getAttribute('aria-label') || '').includes(t)).filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; }); els.sort((a, b) => { const A = a.getBoundingClientRect(), B = b.getBoundingClientRect(); return A.width * A.height - B.width * B.height; }); const e = els[0]; if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, tag: e.tagName, txt: (e.textContent || '').trim().slice(0, 50) }; }, texte);
let r = await trouve(); await sleep(400); r = await trouve();
log(pre, 'cible', r);
if (r) await toucher(cdp, r.x, r.y);
await sleep(Number(ms || 2000));
await photo(page, pre);
log(pre, (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ').slice(140, 1000));
lacher();
