import { ouvrir, sleep, photo, log, toucher } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
const r = await page.evaluate(() => { const e = [...document.querySelectorAll('button')].find((b) => /^(Fermer|Masquer)/.test(b.getAttribute('aria-label') || '') && b.getBoundingClientRect().top < 400 && b.getBoundingClientRect().width > 0); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, a: e.getAttribute('aria-label') }; });
log('fermer', r); if (r) { await toucher(cdp, r.x, r.y); await sleep(900); }
await photo(page, process.argv[2]);
lacher();
