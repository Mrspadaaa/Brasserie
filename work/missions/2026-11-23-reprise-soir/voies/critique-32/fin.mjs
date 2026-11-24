import { ouvrir, sleep, photo, log, boutons, toucher, ou } from './outil.mjs';
import { etat } from './lire.mjs';
import { outils, court, periode } from './commun.mjs';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { page, cdp, lacher, fermer } = await ouvrir();
const { tap, duree, instantane, barre } = outils(page, cdp);
await tap('Calendrier', 'nav button, nav a'); await sleep(2500);
await periode(page, cdp, tap, '24.08.2026', '13.09.2026');
let b = await barre(); log('ZZ', b?.a);
if (b) { await page.evaluate((y) => scrollBy(0, y - 450), b.y); await sleep(400); b = await barre(); await toucher(cdp, b.x, b.y); await sleep(1400);
  await tap('Plus d’actions'); await sleep(900); await photo(page, 'Z-00-menu', true);
  const s = (await boutons(page, 'Suppr')).map((x) => x.split(' @')[0]); log('suppr', s);
  if (s.length) { await tap(s[0]); await sleep(1200); const c = (await boutons(page, '^(Supprimer|Confirmer|Oui)')).map((x) => x.split(' @')[0]); log('confirm', c); if (c.length) { await tap(c[c.length - 1]); await sleep(2500); } } }
await photo(page, 'Z-01-apres-suppr', true); log('ZZ restant', (await barre())?.a ?? 'aucun', 'texte ZZ', await page.evaluate(() => (document.body.innerText.match(/ZZ TEST/g) || []).length));
await periode(page, cdp, tap, 'Tout');
const a = await ou(page, 'Revenir à aujourd’hui', 'button'); if (a) { await toucher(cdp, a.x, a.y); await sleep(1200); }
await duree('6 sem.'); await sleep(1500);
const av = JSON.parse(fs.readFileSync('avant.json', 'utf8')); const ap = await instantane();
log('vue finale', court(await etat(page)), (await etat(page)).periode); log('vraies : avant', av.length, 'après', ap.length, 'diff', av.filter((x) => !ap.includes(x)), ap.filter((x) => !av.includes(x)));
await page.evaluate(() => scrollTo(0, 0)); await photo(page, 'Z-02-etat-final', false);
await tap('Bord', 'nav button, nav a'); await sleep(2200);
log('agenda', (await page.evaluate(() => { const t = document.body.innerText; const i = t.indexOf('Agenda'); return t.slice(i, i + 260); })).replace(/\n+/g, ' | '));
await tap('Calendrier', 'nav button, nav a'); await sleep(1500);
// onglet déjà ouvert : a-t-il pris la nouvelle version ?
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const b0 = await require('puppeteer-core').connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
for (const t of b0.targets().filter((t) => t.type() === 'page' && /brasserie-l-affinee/.test(t.url()))) { const p = await t.page(); log('onglet', t._targetId, await p.evaluate(() => [...document.scripts].map((s) => s.src).filter((s) => /index-/.test(s)))); }
b0.disconnect();
await fermer();
