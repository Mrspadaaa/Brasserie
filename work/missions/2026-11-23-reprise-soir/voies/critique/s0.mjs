import { ouvrir, APP, sleep, photo, log } from './outil.mjs';
const { page, lacher } = await ouvrir();
await page.goto(APP, { waitUntil: 'networkidle2', timeout: 60000 });
await sleep(3000);
const js = await page.evaluate(() => [...document.scripts].map((s) => s.src).filter(Boolean));
log('scripts', js);
await photo(page, '00-accueil');
log((await page.evaluate(() => document.body.innerText)).slice(0, 600));
lacher();
