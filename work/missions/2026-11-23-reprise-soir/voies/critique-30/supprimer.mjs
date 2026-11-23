import { ouvrir, sleep, photo, log, toucher, ou } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
const tx = async () => (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ');
log('toast enregistrement', (await tx()).includes('Enregistrement sur le serveur'));
await page.evaluate(() => window.scrollTo(0, 0));
const plus = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.getAttribute('aria-label') === 'Plus'); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await sleep(400); await toucher(cdp, plus.x, plus.y); await sleep(1000);
await photo(page, 'Z-menu'); log('menu', (await tx()).slice(140, 700));
const s = await page.evaluate(() => { const b = [...document.querySelectorAll('button,[role=menuitem]')].find((x) => /Supprimer|Retirer le carnet|Effacer/.test(x.textContent)); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: b.textContent.trim() }; });
log('supprimer', s); if (s) { await toucher(cdp, s.x, s.y); await sleep(1200); }
await photo(page, 'Z-confirm'); log('après', (await tx()).slice(140, 600));
const c = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /Supprimer|Confirmer|Oui/.test(x.textContent)).pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: b.textContent.trim() }; });
log('confirmer', c); if (c && s) { await toucher(cdp, c.x, c.y); await sleep(2500); }
await photo(page, 'Z-apres'); log('fin', (await tx()).slice(140, 500));
lacher();
