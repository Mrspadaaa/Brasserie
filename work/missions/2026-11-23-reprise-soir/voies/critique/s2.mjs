import { ouvrir, sleep, photo, log, ou } from './outil.mjs';
const { page, lacher } = await ouvrir();
const r = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return 'pas de SW';
  await reg.update().catch((e) => 'err ' + e.message);
  await new Promise((r) => setTimeout(r, 6000));
  const etat = { active: reg.active?.state, waiting: !!reg.waiting, installing: !!reg.installing };
  if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
  return etat;
});
log('sw', r);
await sleep(4000);
const maj = await ou(page, 'Mettre à jour');
log('bouton', maj);
await page.reload({ waitUntil: 'networkidle2' }); await sleep(4000);
log('paquet', await page.evaluate(() => [...document.scripts].map((s) => s.src).find((s) => s.includes('/assets/index-'))));
lacher();
