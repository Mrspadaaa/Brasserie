import { ouvrir, sleep, photo, log, taper } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
await taper(page, cdp, 'Calendrier', 'nav button, nav a, [role=tab]'); await sleep(2500);
await photo(page, 'C0-cal');
log('champs', await page.evaluate(() => [...document.querySelectorAll('textarea,input')].map((e) => e.placeholder)));
log('boutons', await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().width > 0).map((b) => (b.getAttribute('aria-label') || b.textContent.trim()).slice(0, 30)).slice(6, 45)));
lacher();
