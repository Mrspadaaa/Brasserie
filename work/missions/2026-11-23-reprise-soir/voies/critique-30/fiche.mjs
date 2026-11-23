// node fiche.mjs <pre> <texte du nom> : ouvre la fiche de l'article, 3 captures en défilant, revient au carnet
import { ouvrir, sleep, photo, log, toucher, taper, ou } from './outil.mjs';
const [pre, nom] = process.argv.slice(2);
const { page, cdp, lacher } = await ouvrir();
const p = await page.evaluate((n) => { const els = [...document.querySelectorAll('button,[role=button],a,li,div')].filter((e) => e.childElementCount < 8 && (e.textContent || '').includes(n) && e.getBoundingClientRect().height > 30); const e = els.sort((a, b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height)[0]; if (!e) return null; e.scrollIntoView({ block: 'center' }); return true; }, nom);
await sleep(700);
const q = await page.evaluate((n) => { const t = [...document.querySelectorAll('div,span,b,strong,p')].find((e) => e.childElementCount === 0 && (e.textContent || '').trim().startsWith(n)); if (!t) return null; const b = t.getBoundingClientRect(); return { x: b.left + Math.min(b.width / 2, 80), y: b.top + b.height / 2 }; }, nom);
log(pre, 'cible', q);
await photo(page, pre + '-carte');
if (q) { await toucher(cdp, q.x, q.y); await sleep(2500); }
await photo(page, pre + '-fiche');
for (let i = 1; i <= 2; i++) { await page.mouse.move(195, 450); await page.mouse.wheel({ deltaY: 600 }); await sleep(800); await photo(page, `${pre}-fiche${i + 1}`); }
const tx = (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | '); const i = tx.indexOf('Articles · ZZ'); log(pre, 'FICHE', tx.slice(i, i + 1800));
const r = await ou(page, 'Articles · ZZ TEST — tour 30', 'button'); if (r) { await toucher(cdp, r.x, r.y); await sleep(1500); }
log(pre, 'retour', (await page.evaluate(() => document.body.innerText)).includes('Ajouter à ZZ TEST — tour 30'));
lacher();
