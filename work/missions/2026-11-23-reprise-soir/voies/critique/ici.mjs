import { ouvrir, photo } from './outil.mjs';
const { page, lacher } = await ouvrir();
await photo(page, process.argv[2]);
console.log((await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ').slice(0, Number(process.argv[3] || 500)));
console.log(await page.evaluate(() => [...document.querySelectorAll('*')].filter((x) => x.childElementCount === 0 && x.textContent.includes('ZZ TEST')).map((x) => x.tagName + ':' + x.textContent.trim().slice(0, 40))));
lacher();
