import { ouvrir, sleep, photo, log, toucher, ou } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
const t = await page.evaluate(() => document.body.innerText);
const i = t.search(/agenda/i); log('agenda dans Bord ?', i, t.slice(Math.max(0, i - 80), i + 200).replace(/\n+/g, ' | '));
const r = await page.evaluate(() => { const e = [...document.querySelectorAll('*')].filter((x) => x.childElementCount === 0 && /^Agenda/i.test(x.textContent.trim())).pop(); if (!e) return null; const c = e.closest('button,a,[role=button],summary') || e; c.scrollIntoView({ block: 'center' }); const b = c.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, t: c.textContent.trim().slice(0, 60), tag: c.tagName }; });
log('cible', r);
if (r) { await sleep(500); await photo(page, 'R12-00-bord-agenda', true); await toucher(cdp, r.x, r.y); await sleep(2000); await photo(page, 'R12-01-agenda', false); log('liens', await page.evaluate(() => [...document.querySelectorAll('[data-lien-calendrier]')].map((e) => e.getAttribute('data-lien-calendrier') + ':' + e.textContent.trim()))); log('texte', (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ').slice(0, 250)); }
lacher();
