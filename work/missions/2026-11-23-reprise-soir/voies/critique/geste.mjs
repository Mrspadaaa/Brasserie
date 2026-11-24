// node geste.mjs <prefixe> <texte bouton> [secondes] : toucher un bouton, capturer à intervalles
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
const [pre, txt, sec = '20'] = process.argv.slice(2);
const { page, cdp, lacher } = await ouvrir();
const r = await ou(page, txt, 'button,[role=button]'); log(pre, 'bouton', r);
if (!r) { lacher(); process.exit(1); }
await sleep(400);
const r2 = await ou(page, txt, 'button,[role=button]');
await toucher(cdp, r2.x, r2.y); const t0 = Date.now();
let der = '';
for (const s of [0.5, 2, 4, 7, 11, 16, 22, 30].filter((s) => s <= Number(sec))) {
  const d = s * 1000 - (Date.now() - t0); if (d > 0) await sleep(d);
  await photo(page, `${pre}-t${String(s).replace('.', '_')}`);
  const tx = (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ');
  const i = tx.indexOf('ZZ TEST — tour 28'); const res = tx.slice(i, i + 380);
  if (res !== der) log(pre, s + 's', res); der = res;
}
lacher();
