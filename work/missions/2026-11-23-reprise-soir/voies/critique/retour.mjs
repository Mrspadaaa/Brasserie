import { ouvrir, sleep, taper } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
const r = await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent.trim().startsWith('Articles · ZZ')));
if (r) { await taper(page, cdp, 'Articles · ZZ TEST — tour 28', 'button'); await sleep(1500); }
lacher();
