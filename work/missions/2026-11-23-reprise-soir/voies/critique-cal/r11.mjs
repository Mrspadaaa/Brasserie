import { ouvrir, sleep, photo, log, toucher, ou, boutons } from './outil.mjs';
import { etat } from './lire.mjs';
import { outils, court } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const { tap } = outils(page, cdp);
const lien = async () => page.evaluate(() => { const e = document.querySelector('[data-lien-calendrier]'); if (!e) return null; e.scrollIntoView({ block: 'center' }); return e.getAttribute('data-lien-calendrier') + ' : ' + e.textContent.trim(); });
const toucherLien = async () => { const r = await page.evaluate(() => { const b = document.querySelector('[data-lien-calendrier]').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }); await toucher(cdp, r.x, r.y); await sleep(2500); };
await tap('Brassins', 'nav button, nav a'); await sleep(2000);
log('onglets brassins', (await boutons(page, '')).map((x) => x.split(' @')[0]).slice(5, 20));
for (const s of ['Brassins', 'Lots', 'Production', 'En cours', 'Tous']) { if (await lien()) break; const r = await ou(page, s, 'main [role=tab], [role=tablist] button, main button'); if (r && r.y < 300) { await toucher(cdp, r.x, r.y); await sleep(1500); } }
let l = await lien(); log('Brassins lien', l);
if (l) { await sleep(400); await photo(page, 'R11-01-brassins-lien', true); await toucherLien(); await page.evaluate(() => scrollTo(0, 0)); await photo(page, 'R11-02-brassins-cal', false); log('Brassins cal', court(await etat(page)), (await boutons(page, '^Masquer|Retour')).map((x) => x.split(' @')[0])); }
await tap('Bord', 'nav button, nav a'); await sleep(2500);
log('bord', (await boutons(page, '')).map((x) => x.split(' @')[0]).filter((t) => /Agenda|Atelier|Labo|Plus|Menu|Outils|Tâche/i.test(t)));
lacher();
