import { ouvrir, sleep, photo, log } from './outil.mjs';
const { page, lacher } = await ouvrir();
await sleep(3000);
log('SRC', page.url(), await page.evaluate(() => [...document.scripts].map((s) => s.src).filter((s) => /index-/.test(s))));
log('AVIS', await page.evaluate(() => /Nouvelle version/.test(document.body.innerText)));
await photo(page, 'M1-etat', true);
lacher(); process.exit(0);
