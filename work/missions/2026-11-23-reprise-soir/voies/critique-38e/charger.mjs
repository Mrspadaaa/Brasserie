// Recharge l'onglet jusqu'au paquet attendu (cache contourné)
import { ouvrir, sleep, photo, log, APP } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
setTimeout(() => { log('CHARGER délai dépassé'); lacher(); process.exit(2); }, 150000);
await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
for (let i = 0; i < 3; i++) {
  if (i === 0 && !/brasserie-l-affinee/.test(page.url())) await page.goto(APP, { waitUntil: 'domcontentloaded', timeout: 60000 }); else await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(6000);
  const js = await page.evaluate(() => [...document.scripts].map((s) => s.src).concat(performance.getEntriesByType('resource').map((r) => r.name)).filter((n) => /index-.*\.js/.test(n)));
  log('charger', i, js.slice(-2));
  if (js.some((x) => /DU-8kJuj/.test(x)) && !js.some((x) => /r1awkHAF/.test(x))) break;
}
await cdp.send('Network.setCacheDisabled', { cacheDisabled: false });
await photo(page, 'E0-charge', true);
log('charger texte', (await page.evaluate(() => document.body.innerText)).slice(0, 300).replace(/\n/g, ' ¦ '));
lacher(); process.exit(0);
