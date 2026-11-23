import { ouvrir, sleep, photo, log, taper } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
await taper(page, cdp, 'ZZ TEST — tour 28', 'div,span,p,h3,h2,button,a,li'); await sleep(2500);
await photo(page, '05-zz-ouvert');
log((await page.evaluate(() => document.body.innerText)).slice(0, 600).replace(/\n+/g, ' | '));
log('champs', await page.evaluate(() => [...document.querySelectorAll('textarea,input')].map((e) => e.placeholder)));
lacher();
