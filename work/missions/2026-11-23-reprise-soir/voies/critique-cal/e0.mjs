import { ouvrir, sleep, photo, log, taper, boutons, APP } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
await page.goto(APP, { waitUntil: 'networkidle2' }); await sleep(2500);
log('paquet', await page.evaluate(() => [...document.scripts].map((s) => s.src).filter((s) => /index-/.test(s))));
await taper(page, cdp, 'Calendrier', 'nav button, nav a, [role=tab], button'); await sleep(3000);
await photo(page, 'E0-cal');
log('boutons', await boutons(page));
lacher();
