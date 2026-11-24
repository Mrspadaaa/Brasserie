import { ouvrir, sleep, photo, log, toucher, ou, boutons, APP } from './outil.mjs';
import { etat } from './lire.mjs';
import { outils, court } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const { tap, duree } = outils(page, cdp);
// 1. paquet du tour 30
await page.evaluate(async () => { for (const x of await navigator.serviceWorker.getRegistrations()) await x.unregister(); for (const k of await caches.keys()) await caches.delete(k); });
await cdp.send('Network.clearBrowserCache');
await page.goto(APP, { waitUntil: 'networkidle2' }); await sleep(2500); await page.reload({ waitUntil: 'networkidle2' }); await sleep(3000);
log('paquet', await page.evaluate(() => [...document.scripts].map((s) => s.src).filter((s) => /index-/.test(s))));
// 2. Agenda : décocher ZZ
const ligne = (t) => page.evaluate((t) => { const cbs = [...document.querySelectorAll('input[type=checkbox],[role=checkbox]')]; for (const cb of cbs) { let row = cb; for (let k = 0; k < 5 && row && !row.innerText?.includes(t); k++) row = row.parentElement; if (row && row.innerText.includes(t) && row.innerText.length < 120) { cb.scrollIntoView({ block: 'center' }); const b = cb.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, coche: cb.checked ?? cb.getAttribute('aria-checked'), texte: row.innerText.replace(/\n+/g, ' | ') }; } } return null; }, t);
let r = await ligne('ZZ TEST — barre'); log('ZZ agenda', r);
if (r && (r.coche === true || r.coche === 'true')) { await sleep(400); r = await ligne('ZZ TEST — barre'); await toucher(cdp, r.x, r.y); await sleep(2500); log('ZZ agenda après', await ligne('ZZ TEST — barre')); }
log('vi', await ligne('vi'));
// 3. Calendrier, période mai 2027, ZZ supprimé
await tap('Calendrier', 'nav button, nav a'); await sleep(2500);
await tap('Période : ');
for (const [a, v] of [['Du', '03.05.2027'], ['Au', '30.05.2027']]) { const c = await page.evaluate((a) => { const e = [...document.querySelectorAll('input')].find((x) => x.getAttribute('aria-label')?.startsWith(a) && x.getBoundingClientRect().width > 0); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, a); await toucher(cdp, c.x, c.y); await sleep(300); await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control'); await page.keyboard.type(v, { delay: 30 }); await page.keyboard.press('Enter'); await sleep(700); }
await tap('Fermer', '[role=dialog] button'); await sleep(1500); await page.evaluate(() => scrollTo(0, 0));
await photo(page, 'T30-00-mai2027', false); log('période mai 2027', court(await etat(page)), (await etat(page)).periode);
const zz = async () => page.evaluate(() => { const e = [...document.querySelectorAll('button,[role=button]')].find((x) => (x.getAttribute('aria-label') || '').startsWith('ZZ TEST — barre') && x.getBoundingClientRect().width > 0); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, a: e.getAttribute('aria-label') }; });
let z = await zz(); log('ZZ frise', z);
if (z) { await sleep(500); z = await zz(); await toucher(cdp, z.x, z.y); await sleep(1500); await photo(page, 'T30-01-zz-ouvert', true);
  const opts = (await boutons(page, 'Plus|…|⋯|Suppr')).map((x) => x.split(' @')[0]); log('boutons carte', opts);
  const p = opts.find((t) => /^(Plus d’actions|…|⋯)/.test(t)) || opts.find((t) => /^Plus d/.test(t) && !/saisie/.test(t)); if (p) { await tap(p); await sleep(900); }
  await photo(page, 'T30-02-menu', true);
  const s = (await boutons(page, 'Suppr')).map((x) => x.split(' @')[0]); log('suppr', s);
  if (s.length) { await tap(s[0]); await sleep(1200); const c = (await boutons(page, '^(Supprimer|Confirmer|Oui)')).map((x) => x.split(' @')[0]); log('confirm', c); if (c.length) { await tap(c[c.length - 1]); await sleep(2500); } }
}
await photo(page, 'T30-03-apres-suppr', true);
log('ZZ restants frise', await page.evaluate(() => (document.body.innerText.match(/ZZ TEST/g) || []).length));
// 4. vraies données à la vue du départ (9 nov. – 20 déc. 2026)
await tap('Période : ');
for (const [a, v] of [['Du', '09.11.2026'], ['Au', '20.12.2026']]) { const c = await page.evaluate((a) => { const e = [...document.querySelectorAll('input')].find((x) => x.getAttribute('aria-label')?.startsWith(a) && x.getBoundingClientRect().width > 0); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, a); await toucher(cdp, c.x, c.y); await sleep(300); await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control'); await page.keyboard.type(v, { delay: 30 }); await page.keyboard.press('Enter'); await sleep(700); }
await tap('Fermer', '[role=dialog] button'); await sleep(1500);
log('vue départ', court(await etat(page)));
log('choses', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((a) => /, S\d+/.test(a) && !/^S\d+,/.test(a)).map((a) => a.slice(0, 70)))));
await tap('Période : '); await tap('Tout', '[role=dialog] button'); await tap('Fermer', '[role=dialog] button'); await sleep(1500);
await page.evaluate(() => scrollTo(0, 0)); await photo(page, 'T30-04-etat-final', false); log('état final', court(await etat(page)), (await etat(page)).periode);
// 5. contre-vérif problème 4 au tour 30
await tap('Bord', 'nav button, nav a'); await sleep(2500);
log('agenda', (await page.evaluate(() => { const t = document.body.innerText; const i = t.indexOf('Agenda'); return t.slice(i, i + 200); })).replace(/\n+/g, ' | '));
const sem = await ou(page, 'Cette semaine au calendrier', 'button', true); await sleep(500);
const sem2 = await ou(page, 'Cette semaine au calendrier', 'button'); await toucher(cdp, sem2.x, sem2.y); await sleep(2500); await page.evaluate(() => scrollTo(0, 0));
await photo(page, 'T30-05-cette-semaine', false); log('cette semaine (tour 30)', court(await etat(page)));
log('ZZ restants (Calendrier)', await page.evaluate(() => (document.body.innerText.match(/ZZ TEST/g) || []).length));
lacher();
