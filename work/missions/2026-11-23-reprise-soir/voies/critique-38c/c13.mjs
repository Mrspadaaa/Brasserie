import { ouvrir, sleep, photo, log, boutons, toucher, ou } from './outil.mjs';
import { outils } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const { tap } = outils(page, cdp);
const nav = async (n) => { const r = await ou(page, n, 'nav button, nav a'); await toucher(cdp, r.x, r.y); await sleep(3000); };
const txt = () => page.evaluate(() => document.body.innerText);
const caisse = async () => (/En caisse\n([^\n]+)/.exec(await txt()) || [])[1];
// fermer la feuille ouverte
for (let i = 0; i < 2; i++) { const f = await page.evaluate(() => { const b = [...document.querySelectorAll('button[aria-label="Fermer"]')].find((x) => x.getBoundingClientRect().width > 0); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); if (f) { await toucher(cdp, f.x, f.y); await sleep(900); } }
async function creer(nom) {
  await nav('Finances'); log(nom, 'caisse avant', await caisse());
  await tap('Actions rapides'); await sleep(1000); await tap('Écriture, à la main'); await sleep(1500);
  const t0 = await page.evaluate(() => { const b = [...document.querySelectorAll('[role=dialog] button')].find((x) => x.textContent.trim() === 'Apport'); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await toucher(cdp, t0.x, t0.y); await sleep(1500);
  const cr = await ou(page, 'Nom, facultatif', 'button'); await toucher(cdp, cr.x, cr.y); await sleep(600);
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
  await page.keyboard.type(nom, { delay: 30 }); await page.keyboard.press('Enter'); await sleep(600);
  const m = await page.$('input[aria-label="Montant en CHF"]'); const bb = await m.boundingBox(); await toucher(cdp, bb.x + bb.width / 2, bb.y + bb.height / 2); await sleep(300); await m.focus(); await page.keyboard.type('1', { delay: 60 }); await sleep(800);
  const ok = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => x.getBoundingClientRect().width > 0 && x.getBoundingClientRect().top > 700).find((x) => /^Reçu/.test(x.textContent.trim())); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await toucher(cdp, ok.x, ok.y); await sleep(2500);
}
// A : toucher le voile au-dessus de la carte de fin
await creer('ZZ TEST — apport voile');
await photo(page, 'C13-A0-fin', true);
await toucher(cdp, 195, 420); await sleep(1500);
await photo(page, 'C13-A1-apres-voile', false);
log('A après voile', (await txt()).slice(0, 300).replace(/\n/g, ' ¦ '));
for (let i = 0; i < 2; i++) { const f = await page.evaluate(() => { const b = [...document.querySelectorAll('button[aria-label="Fermer"]')].find((x) => x.getBoundingClientRect().width > 0); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); if (f) { await toucher(cdp, f.x, f.y); await sleep(900); } }
await nav('Finances'); log('A caisse après', await caisse());
// B : bouton Fermer de la carte
await creer('ZZ TEST — apport');
const fb = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => x.getBoundingClientRect().width > 0 && x.getBoundingClientRect().top > 700).find((x) => x.textContent.trim() === 'Fermer'); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await toucher(cdp, fb.x, fb.y); await sleep(1500);
await photo(page, 'C13-B1-apres-fermer', true);
log('B après Fermer', (await txt()).slice(0, 200).replace(/\n/g, ' ¦ '));
await nav('Finances'); log('B caisse après', await caisse());
lacher();
