// node defiler.mjs <prefixe> <n>
import { ouvrir, sleep, photo } from './outil.mjs';
const [pre, n = '2'] = process.argv.slice(2);
const { page, lacher } = await ouvrir();
for (let i = 1; i <= Number(n); i++) { await page.mouse.move(195, 450); await page.mouse.wheel({ deltaY: 560 }); await sleep(700); await photo(page, `${pre}${i + 1}`); }
lacher();
