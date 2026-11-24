import { ouvrir, sleep, photo, log, boutons } from './outil.mjs';
const { page, lacher } = await ouvrir();
await page.evaluate(() => scrollTo(0, 0)); await sleep(500);
await photo(page, process.argv[2] || 'V', true);
log((await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ').slice(0, 600));
log((await boutons(page, '')).map((x) => x.split(' @')[0]).slice(0, 25).join(' ; '));
lacher();
