// node suivre.mjs <pre> <texte bouton> <instants s, virgules> : touche le bouton puis capture aux instants
import { ouvrir, sleep, photo, log, toucher, ou } from './outil.mjs';
const [pre, texte, inst] = process.argv.slice(2);
const { page, cdp, lacher } = await ouvrir();
const tx = async () => (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ');
await photo(page, pre + '-avant');
const r = await ou(page, texte, 'button'); log(pre, 'bouton', r);
await sleep(400); const q = await ou(page, texte, 'button'); if (q) await toucher(cdp, q.x, q.y);
const t0 = Date.now(); let der = '';
for (const s of inst.split(',').map(Number)) {
  const d = s * 1000 - (Date.now() - t0); if (d > 0) await sleep(d);
  await photo(page, `${pre}-t${s}`); const x = await tx(); const i = x.indexOf('ZZ TEST — tour 30 |'); const res = x.slice(i + 20, i + 600);
  if (res !== der) log(pre, s + 's', res); der = res;
}
lacher();
