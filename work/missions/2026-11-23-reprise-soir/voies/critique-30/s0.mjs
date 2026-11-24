import { ouvrir, APP, sleep, photo, log, ou, taper } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
const paquet = () => page.evaluate(() => [...document.scripts].map((s) => s.src).find((s) => s.includes('/assets/index-')) || '');
await page.goto(APP, { waitUntil: 'networkidle2', timeout: 60000 }); await sleep(3000);
for (let i = 0; i < 3; i++) { try { await sleep(3000); if ((await paquet()).includes("KxF0Bcaa")) break;
  await page.evaluate(async () => { const reg = await navigator.serviceWorker.getRegistration(); if (reg) { await reg.update().catch(() => 0); await new Promise((r) => setTimeout(r, 4000)); reg.waiting?.postMessage({ type: 'SKIP_WAITING' }); } });
  const maj = await ou(page, 'Mettre à jour'); if (maj) { await taper(page, cdp, maj.txt); await sleep(5000); }
  await page.reload({ waitUntil: "networkidle2" }); await sleep(4000); } catch (e) { log("nav", e.message.slice(0,60)); await sleep(4000); }
}
log('paquet', await paquet());
await taper(page, cdp, 'Stocks', 'nav button, nav a, [role=tab], button'); await sleep(1500);
await taper(page, cdp, 'Matériel'); await sleep(1500);
await taper(page, cdp, 'Carnets', '[role=tab],button'); await sleep(2000);
await photo(page, '00-carnets-avant');
const tx = (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ');
log('CARNETS AVANT', tx.slice(0, 900));
log('champs', await page.evaluate(() => [...document.querySelectorAll('textarea,input')].map((e) => e.placeholder)));
lacher();
