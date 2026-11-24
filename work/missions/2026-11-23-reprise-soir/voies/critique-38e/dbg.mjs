import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
setTimeout(() => { console.log('délai'); lacher(); process.exit(2); }, 60000);
console.log('a', page.url());
const r = await ou(page, 'Calendrier', 'nav button, nav a, button'); console.log('b', r);
await toucher(cdp, r.x, r.y); console.log('c');
await sleep(1500); console.log('d', await page.evaluate(() => document.visibilityState));
lacher(); process.exit(0);
