import { ouvrir, sleep, photo, log, boutons, toucher, ou } from './outil.mjs';
import { outils, court } from './commun.mjs';
import { etat } from './lire.mjs';
const { page, cdp, lacher } = await ouvrir();
const { tap, duree } = outils(page, cdp);
const txt = () => page.evaluate(() => document.body.innerText);
const fb = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => x.getBoundingClientRect().width > 0 && x.getBoundingClientRect().top > 700).find((x) => x.textContent.trim() === 'Fermer'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
log('fermer carte', fb); if (fb) { await toucher(cdp, fb.x, fb.y); await sleep(1500); }
log('reste', (await txt()).slice(0, 120).replace(/\n/g, ' ¦ '));
const sh = await page.evaluate(() => { const b = [...document.querySelectorAll('[role=dialog] button[aria-label="Fermer"]')].find((x) => x.getBoundingClientRect().width > 0); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
if (sh) { await toucher(cdp, sh.x, sh.y); await sleep(1200); }
await photo(page, 'C15-00-ferme', true);
const nav = async (n) => { const r = await ou(page, n, 'nav button, nav a'); await toucher(cdp, r.x, r.y); await sleep(3000); };
await nav('Calendrier'); await page.evaluate(() => scrollTo(0, 0)); await sleep(500);
await duree('6 sem.'); await sleep(1000);
const a = await ou(page, 'Revenir à aujourd’hui', 'button'); if (a) { await toucher(cdp, a.x, a.y); await sleep(1200); }
log('etat', court(await etat(page)));
await ou(page, 'Masquer Ventes', 'button', true); await sleep(600);
await photo(page, 'C15-01-cal-ventes', false);
log('ventes', await boutons(page, 'Ventes|apport|ZZ|poche'));
log('texte ventes', ((await txt()).match(/Ventes\n[\s\S]{0,160}/) || [''])[0].replace(/\n/g, ' ¦ '));
// toucher l'apport ZZ : la fiche s'ouvre-t-elle ?
const z = await ou(page, 'ZZ TEST — apport', 'button'); log('zz', z);
if (z) { await toucher(cdp, z.x, z.y); await sleep(1500); await photo(page, 'C15-02-fiche-apport', false); log('fiche', (await txt()).slice(-700).replace(/\n/g, ' ¦ ')); await page.keyboard.press('Escape'); await sleep(800); }
// Finances › Synthèse : ventes / à encaisser
await nav('Finances'); await tap('Synthèse', '[role=tab],button'); await sleep(1500);
log('synthèse', (await txt()).slice(0, 1100).replace(/\n/g, ' ¦ '));
await photo(page, 'C15-03-synthese', false);
lacher();
