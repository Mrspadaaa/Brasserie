import { ouvrir, sleep, photo, log, toucher, ou, boutons } from './outil.mjs';
import { etat } from './lire.mjs';
import { outils, court } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const { tap } = outils(page, cdp);
await tap('Bord', 'nav button, nav a'); await sleep(2500);
const pos = (t) => page.evaluate((t) => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (n.textContent.trim() === t) { const el = n.parentElement; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); const row = el.closest('li,label,div'); return { x: r.left, y: r.top + r.height / 2, html: (el.closest('li,label') || el.parentElement.parentElement).outerHTML.slice(0, 500) }; } } return null; }, t);
let p = await pos('ZZ TEST — barre'); log('ZZ', p);
if (p) { await sleep(500); p = await pos('ZZ TEST — barre'); await photo(page, 'T30-06-agenda-avant', true); await toucher(cdp, 29, p.y + 8); await sleep(2500); await photo(page, 'T30-07-agenda-apres', true); }
log('agenda', (await page.evaluate(() => { const t = document.body.innerText; const i = t.indexOf('Agenda'); return t.slice(i, i + 220); })).replace(/\n+/g, ' | '));
lacher();
