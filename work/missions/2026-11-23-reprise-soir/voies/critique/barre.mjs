import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
const b = await page.evaluate(() => { const e = [...document.querySelectorAll('button,[role=button]')].filter((x) => x.getBoundingClientRect().width > 0).find((x) => /^(Lu ·|Lecture du lien)/.test(x.textContent.trim())); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: e.textContent.trim().slice(0, 60), aria: e.getAttribute('aria-label') }; });
log('barre', b);
await toucher(cdp, b.x, b.y); await sleep(1800);
await photo(page, process.argv[2]);
log((await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ').slice(150, 700));
lacher();
