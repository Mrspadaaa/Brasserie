import { ouvrir, sleep, photo, log, taper, boutons, APP } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
log('sw', await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistrations(); for (const x of r) await x.update().catch(() => 0); const k = await caches.keys(); return { n: r.length, caches: k }; }));
// update SW puis skipWaiting : désinscrire et vider les caches HTTP de l'app (pas IndexedDB)
await page.evaluate(async () => { for (const x of await navigator.serviceWorker.getRegistrations()) await x.unregister(); for (const k of await caches.keys()) await caches.delete(k); });
await cdp.send('Network.clearBrowserCache');
await page.goto(APP, { waitUntil: 'networkidle2' }); await sleep(3000);
await page.reload({ waitUntil: 'networkidle2' }); await sleep(3000);
log('paquet', await page.evaluate(() => [...document.scripts].map((s) => s.src).filter((s) => /index-/.test(s))));
await taper(page, cdp, 'Calendrier', 'nav button, nav a, [role=tab], button'); await sleep(3000);
await photo(page, 'E1-cal');
log('boutons', await boutons(page, 'Période|sem\.|Poignée|^S\d|retard|Tout|auj'));
lacher();
