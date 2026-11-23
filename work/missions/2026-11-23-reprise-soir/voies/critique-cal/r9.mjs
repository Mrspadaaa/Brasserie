import { ouvrir, sleep, photo, log, toucher, ou, boutons } from './outil.mjs';
import { etat } from './lire.mjs';
import { outils, court } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const { pas, tap, duree } = outils(page, cdp);
const dlg = async () => (await page.evaluate(() => [...document.querySelectorAll('[role=dialog]')].map((d) => d.innerText).join(' ## ') || 'PAS DE FEUILLE')).replace(/\n+/g, ' | ').slice(0, 400);
const fermer = async () => { const r = await ou(page, 'Fermer', '[role=dialog] button'); if (r) await toucher(cdp, r.x, r.y); else await page.keyboard.press('Escape'); await sleep(900); };
const leaf = async (re) => page.evaluate((s) => { const e = [...document.querySelectorAll('button,[role=button]')].filter((x) => x.getBoundingClientRect().width > 0).find((x) => new RegExp(s).test(x.getAttribute('aria-label') || x.textContent)); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, a: (e.getAttribute('aria-label') || e.textContent).slice(0, 80) }; }, re);
// 1. vue Liste, ZZ touché
await pas('R9-00-liste', async () => { await tap('· période, liste, tri et filtre'); await tap('Liste'); await page.keyboard.press('Escape'); }, false);
let z = await leaf('^ZZ TEST — barre'); log('ZZ en liste', z);
if (z) { await sleep(500); z = await leaf('^ZZ TEST — barre'); await toucher(cdp, z.x, z.y); await sleep(1500); await photo(page, 'R9-01-zz-feuille', false); log('feuille ZZ', await dlg()); await fermer(); }
await pas('R9-02-frise', async () => { await tap('· période, liste, tri et filtre'); await tap('Liste'); await page.keyboard.press('Escape'); await duree('6 sem.'); await page.evaluate(() => scrollTo(0, 0)); });
// 2. fête : vraie donnée, lecture seule
const f = await leaf('^vi, '); log('fête', f);
if (f) { await sleep(400); const f2 = await leaf('^vi, '); await toucher(cdp, f2.x, f2.y); await sleep(1500); await photo(page, 'R9-03-fete-feuille', false); log('feuille fête', await dlg()); await fermer(); }
// 3. sections
for (const [onglet, nom] of [['Finances', 'finances'], ['Brassins', 'brassins']]) {
  await tap(onglet, 'nav button, nav a'); await sleep(2500);
  const l = await page.evaluate(() => { const e = document.querySelector('[data-lien-calendrier]'); if (!e) return null; e.scrollIntoView({ block: 'center' }); return e.textContent.trim(); });
  await sleep(500); await photo(page, 'R9-04-' + nom + '-lien', true); log(onglet, 'lien', l);
  if (l) { const r = await page.evaluate(() => { const b = document.querySelector('[data-lien-calendrier]').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }); await toucher(cdp, r.x, r.y); await sleep(2500); await page.evaluate(() => scrollTo(0, 0)); await photo(page, 'R9-05-' + nom + '-cal', false); log(onglet, court(await etat(page)), 'rangées', (await boutons(page, '^Masquer')).map((x) => x.split(' @')[0])); log(onglet, 'retour', (await boutons(page, 'Retour|Revenir|Fermer')).slice(0, 4)); }
}
await tap('Bord', 'nav button, nav a'); await sleep(2500);
const ag = await leaf('Agenda'); log('agenda', ag);
if (ag) { await toucher(cdp, ag.x, ag.y); await sleep(2000); await photo(page, 'R9-06-agenda', false); log('agenda texte', (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ').slice(0, 300)); const l = await page.evaluate(() => [...document.querySelectorAll('[data-lien-calendrier]')].map((e) => e.getAttribute('data-lien-calendrier') + ':' + e.textContent.trim())); log('agenda liens calendrier', l); }
lacher();
