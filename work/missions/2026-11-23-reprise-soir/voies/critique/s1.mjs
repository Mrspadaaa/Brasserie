import { ouvrir, APP, sleep, photo, log, ou, taper } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
const paquet = () => page.evaluate(() => [...document.scripts].map((s) => s.src).find((s) => s.includes('/assets/index-')));
for (let i = 0; i < 3; i++) {
  const maj = await ou(page, 'Mettre à jour') || await ou(page, 'Recharger');
  if (maj) { log('bouton maj', maj); await taper(page, cdp, maj.txt); await sleep(6000); }
  else { await page.reload({ waitUntil: 'networkidle2' }); await sleep(4000); }
  log('paquet', await paquet());
  if ((await paquet()).includes('CoXAhg_q')) break;
}
await photo(page, '01-maj');
lacher();
