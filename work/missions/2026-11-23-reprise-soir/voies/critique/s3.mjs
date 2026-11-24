import { ouvrir, sleep, log } from './outil.mjs';
const { page, lacher } = await ouvrir();
await sleep(3000);
log('paquet', await page.evaluate(() => [...document.scripts].map((s) => s.src).find((s) => s.includes('/assets/index-'))));
lacher();
