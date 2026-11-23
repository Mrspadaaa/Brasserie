import { ouvrir, sleep, photo, log, toucher, ou, boutons } from './outil.mjs';
import { etat } from './lire.mjs';
import { outils, court } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const { tap } = outils(page, cdp);
const lien = async () => page.evaluate(() => { const e = document.querySelector('[data-lien-calendrier]'); if (!e) return null; e.scrollIntoView({ block: 'center' }); return e.getAttribute('data-lien-calendrier') + ' : ' + e.textContent.trim(); });
const toucherLien = async () => { const r = await page.evaluate(() => { const b = document.querySelector('[data-lien-calendrier]').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }); await toucher(cdp, r.x, r.y); await sleep(2500); };
await tap('Finances', 'nav button, nav a'); await sleep(2000);
for (const sous of ['Synthèse', 'Prévisions', 'Annuel']) { if (await lien()) break; await tap(sous, '[role=tab],button'); await sleep(1500); }
let l = await lien(); log('Finances lien', l);
if (l) { await sleep(400); await photo(page, 'R10-01-finances-lien', false); await toucherLien(); await page.evaluate(() => scrollTo(0, 0)); await photo(page, 'R10-02-finances-cal', false); log('Finances cal', court(await etat(page)), (await boutons(page, '^Masquer|Retour')).map((x) => x.split(' @')[0])); }
await tap('Brassins', 'nav button, nav a'); await sleep(2500);
l = await lien(); log('Brassins lien', l);
if (l) { await sleep(400); await photo(page, 'R10-03-brassins-lien', true); await toucherLien(); await page.evaluate(() => scrollTo(0, 0)); await photo(page, 'R10-04-brassins-cal', false); log('Brassins cal', court(await etat(page)), (await boutons(page, '^Masquer|Retour')).map((x) => x.split(' @')[0])); }
await tap('Bord', 'nav button, nav a'); await sleep(2500);
log('bord boutons', (await boutons(page, 'Agenda|agenda|Calendrier')).slice(0, 6));
const ag = await ou(page, 'Agenda', 'button,a,[role=button],[role=tab],summary,div', true); log('agenda', ag);
if (ag) { await sleep(500); const a2 = await ou(page, 'Agenda', 'button,a,[role=button],[role=tab],summary,div'); await toucher(cdp, a2.x, a2.y); await sleep(2000); await photo(page, 'R10-05-agenda', false); log('agenda liens', await page.evaluate(() => [...document.querySelectorAll('[data-lien-calendrier]')].map((e) => e.getAttribute('data-lien-calendrier') + ':' + e.textContent.trim()))); }
lacher();
