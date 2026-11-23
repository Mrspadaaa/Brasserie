import { ouvrir, sleep, photo, log, toucher } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
const ligne = () => page.evaluate(() => { const e = [...document.querySelectorAll('*')].filter((x) => x.childElementCount === 0 && x.textContent.trim() === 'vi' && x.getBoundingClientRect().width > 0)[0]; if (!e) return null; let row = e; for (let k = 0; k < 6 && row && !row.querySelector('input[type=checkbox],[role=checkbox]'); k++) row = row.parentElement; const cb = row?.querySelector('input[type=checkbox],[role=checkbox]'); (cb || e).scrollIntoView({ block: 'center' }); const b = (cb || e).getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, coche: cb ? (cb.checked ?? cb.getAttribute('aria-checked')) : null, texte: row?.innerText.replace(/\n+/g, ' | ').slice(0, 80) }; });
let r = await ligne(); log('vi avant réparation', r);
if (r && (r.coche === true || r.coche === 'true')) { await sleep(400); r = await ligne(); await toucher(cdp, r.x, r.y); await sleep(2500); log('vi après réparation', await ligne()); }
await photo(page, 'R13-vi-repare', true);
log('agenda', (await page.evaluate(() => { const t = document.body.innerText; const i = t.indexOf('Agenda'); return t.slice(i, i + 300); })).replace(/\n+/g, ' | '));
lacher();
