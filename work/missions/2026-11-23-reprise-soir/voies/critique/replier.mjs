// node replier.mjs <prefixe> <url> : coller, capturer, Replier, quitter le carnet, capturer la barre jusqu'à la fin, revenir
import { ouvrir, sleep, photo, log, taper, toucher, ou } from './outil.mjs';
const [pre, url] = process.argv.slice(2);
const { page, cdp, lacher } = await ouvrir();
const champ = await page.evaluate(() => { const e = [...document.querySelectorAll('textarea,input')].find((x) => /coller|Ajouter/.test(x.placeholder || '')); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
await toucher(cdp, champ.x, champ.y); await sleep(300);
await page.keyboard.type(url); const t0 = Date.now(); await page.keyboard.press('Enter');
const t = () => ((Date.now() - t0) / 1000).toFixed(1);
const resume = async () => (await page.evaluate(() => document.body.innerText)).match(/(Lecture[^\n]*\n[\s\S]{0,500})/)?.[1]?.replace(/\n+/g, ' | ').slice(0, 500) ?? '(pas de lecture)';
await sleep(1500); await photo(page, pre + '-a'); log(pre, t(), 'a', await resume());
await sleep(1500); await photo(page, pre + '-b'); log(pre, t(), 'b', await resume());
const rep = await ou(page, 'Replier', 'button');
log(pre, 'Replier', rep);
if (rep) { await toucher(cdp, rep.x, rep.y); await sleep(600); await photo(page, pre + '-c-replie'); log(pre, t(), 'c', await resume()); }
await taper(page, cdp, 'Carnets', 'button,a'); await sleep(800);
await photo(page, pre + '-d-quitte'); log(pre, t(), 'd', (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ').slice(-500));
for (let i = 0; i < 8; i++) { await sleep(2500); await photo(page, `${pre}-e${i}`); const tx = (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | '); log(pre, t(), 'e' + i, tx.slice(-420)); if (/Lu ·|introuvable|bloqu|Échec|échou/.test(tx.slice(-500)) && i > 0) break; }
lacher();
