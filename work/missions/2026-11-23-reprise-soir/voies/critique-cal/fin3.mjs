import { ouvrir, sleep, photo, log, toucher, ou, boutons } from './outil.mjs';
import { outils } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const { tap } = outils(page, cdp);
await tap('Bord', 'nav button, nav a'); await sleep(2500);
const ligne = (t) => page.evaluate((t) => { const e = [...document.querySelectorAll('*')].filter((x) => x.childElementCount === 0 && x.textContent.trim() === t && x.getBoundingClientRect().width > 0)[0]; if (!e) return null; let row = e; for (let k = 0; k < 6 && row && !row.querySelector('input[type=checkbox],[role=checkbox]'); k++) row = row.parentElement; const cb = row?.querySelector('input[type=checkbox],[role=checkbox]'); (cb || e).scrollIntoView({ block: 'center' }); const b = (cb || e).getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, coche: cb ? (cb.checked ?? cb.getAttribute('aria-checked')) : null, texte: row?.innerText.replace(/\n+/g, ' | ').slice(0, 80) }; }, t);
let r = await ligne('ZZ TEST — barre'); log('ZZ agenda', r);
if (r && r.coche === true) { await sleep(400); r = await ligne('ZZ TEST — barre'); await toucher(cdp, r.x, r.y); await sleep(2500); log('ZZ après', await ligne('ZZ TEST — barre')); }
log('vi', await ligne('vi'));
await tap('Calendrier', 'nav button, nav a'); await sleep(2500);
await tap('· période, liste, tri et filtre'); await sleep(600);
await photo(page, 'F-04-menu', true);
log('menu', (await boutons(page, '')).map((x) => x.split(' @')[0]).slice(-16).join(' ; '));
await page.keyboard.press('Escape');
lacher();
