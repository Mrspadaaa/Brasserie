// node quitter.mjs <pre> <url> <autre carnet> : coller, quitter vers Carnets, ouvrir un autre carnet, toucher la barre
import { ouvrir, sleep, photo, log, toucher, ou } from './outil.mjs';
const [pre, url, autre] = process.argv.slice(2);
const { page, cdp, lacher } = await ouvrir();
const tx = async () => (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ');
const champ = await page.evaluate(() => { const e = [...document.querySelectorAll('textarea')].find((x) => /Ajouter|coller un lien/.test(x.placeholder)); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
await toucher(cdp, champ.x, champ.y); await sleep(300);
await page.keyboard.type(url); const t0 = Date.now(); await page.keyboard.press('Enter');
const t = () => ((Date.now() - t0) / 1000).toFixed(1);
await sleep(400); await photo(page, pre + '-a-colle'); log(pre, t(), 'colle', (await tx()).slice(180, 600));
// quitter : lien « Carnets » en haut du carnet
const back = await page.evaluate(() => { const e = [...document.querySelectorAll('button,a')].find((x) => x.textContent.trim() === 'Carnets' && x.getBoundingClientRect().top > 110); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
log(pre, 'retour', back); if (back) await toucher(cdp, back.x, back.y);
await sleep(500); await photo(page, pre + '-b-liste-repliee'); log(pre, t(), 'liste', (await tx()).slice(-500));
const p = await page.evaluate((n) => { const e = [...document.querySelectorAll('div,span,p,b,strong')].find((x) => x.childElementCount === 0 && x.textContent.trim().startsWith(n)); if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, autre);
await sleep(300); if (p && autre !== "-") await toucher(cdp, p.x, p.y);
await sleep(1200); await photo(page, pre + '-c-autre'); log(pre, t(), 'autre', (await tx()).slice(150, 500), '...', (await tx()).slice(-400));
for (let k = 0; k < 12; k++) { await sleep(2000); const s = await tx(); if (/Lu ·|introuvable|Lu \|/.test(s.slice(-700))) break; }
await photo(page, pre + '-d-fin-ailleurs'); log(pre, t(), 'fin', (await tx()).slice(-600));
const bar = await page.evaluate(() => { const e = [...document.querySelectorAll('button,[role=button],a,div')].filter((x) => /^(Lu|Lecture)/.test(x.textContent.trim()) && x.getBoundingClientRect().top > 600 && x.getBoundingClientRect().height < 120).sort((a, b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height)[0]; if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left + 60, y: b.top + b.height / 2, t: e.textContent.trim().slice(0, 80) }; });
log(pre, 'barre', bar);
if (bar) { await toucher(cdp, bar.x, bar.y); await sleep(2000); }
await photo(page, pre + '-e-barre-touchee'); log(pre, 'apres barre', (await tx()).slice(140, 900));
lacher();
