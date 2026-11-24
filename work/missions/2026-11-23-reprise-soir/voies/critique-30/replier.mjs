// node replier.mjs <pre> <url> : coller, Replier, rouvrir, fin, déplier les étapes, fermer
import { ouvrir, sleep, photo, log, toucher, ou } from './outil.mjs';
const [pre, url] = process.argv.slice(2);
const { page, cdp, lacher } = await ouvrir();
const tx = async () => { const x = (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | '); const i = x.indexOf('ZZ TEST — tour 30 |'); return x.slice(i + 20, i + 420); };
const tape = async (t, sel = 'button') => { const r = await ou(page, t, sel); if (r) { await toucher(cdp, r.x, r.y); } log(pre, 'touche', t, !!r); return r; };
const champ = await page.evaluate(() => { const e = [...document.querySelectorAll('textarea')].find((x) => /Ajouter|coller un lien/.test(x.placeholder)); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
await toucher(cdp, champ.x, champ.y); await sleep(300);
await page.keyboard.type(url); await page.keyboard.press('Enter'); await sleep(600);
await page.evaluate(() => document.activeElement?.blur());
await tape('Replier'); await sleep(500); await photo(page, pre + '-a-replie'); log(pre, 'replié', await tx());
const r = await page.evaluate(() => { const e = [...document.querySelectorAll('button,[role=button]')].find((x) => /^(Lecture|Lu)/.test(x.textContent.trim()) || /Déplier|Rouvrir/.test(x.getAttribute('aria-label') || '')); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, t: e.textContent.trim().slice(0, 60), al: e.getAttribute('aria-label') }; });
log(pre, 'barre', r); if (r) await toucher(cdp, r.x, r.y);
await sleep(700); await photo(page, pre + '-b-rouvert'); log(pre, 'rouvert', await tx());
for (let k = 0; k < 10; k++) { await sleep(1500); if (/Lu [|·]|lu en/.test(await tx())) break; }
await sleep(800); await photo(page, pre + '-c-fin'); log(pre, 'fin', await tx());
const c = await page.evaluate(() => { const e = [...document.querySelectorAll('button,[role=button]')].find((x) => /étapes sur/.test(x.textContent)); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
if (c) { await toucher(cdp, c.x, c.y); await sleep(800); } await photo(page, pre + '-d-etapes'); log(pre, 'étapes', await tx());
await tape('Fermer'); await sleep(800); await photo(page, pre + '-e-ferme'); log(pre, 'fermé', await tx());
lacher();
