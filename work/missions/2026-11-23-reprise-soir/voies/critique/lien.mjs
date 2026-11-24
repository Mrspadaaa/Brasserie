// node lien.mjs <pre> <url> [reload] : un lien de bout en bout
import { ouvrir, sleep, photo, log, taper, toucher, ou } from './outil.mjs';
const [pre, url, mode] = process.argv.slice(2);
const { page, cdp, lacher } = await ouvrir();
const texte = async () => (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ');
const dansZZ = () => page.evaluate(() => [...document.querySelectorAll('textarea')].some((e) => /Ajouter à ZZ/.test(e.placeholder)));
async function allerZZ() {
  for (let k = 0; k < 4 && !(await dansZZ()); k++) {
    if (await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent.trim().startsWith('Articles · ZZ')))) { await taper(page, cdp, 'Articles · ZZ TEST — tour 28', 'button'); await sleep(1500); continue; }
    if (!(await ou(page, 'Carnets', '[role=tab],button'))) { await taper(page, cdp, 'Stocks', 'nav button, nav a, [role=tab]'); await sleep(1200); await taper(page, cdp, 'Matériel'); await sleep(1200); }
    await taper(page, cdp, 'Carnets', '[role=tab],button'); await sleep(1500);
    await page.evaluate(() => [...document.querySelectorAll('div,span,p,b,strong')].find((x) => x.childElementCount === 0 && x.textContent.trim() === 'ZZ TEST — tour 28')?.scrollIntoView({ block: 'center' }));
    await sleep(900);
    const r = await page.evaluate(() => { const e = [...document.querySelectorAll('div,span,p,b,strong')].find((x) => x.childElementCount === 0 && x.textContent.trim() === 'ZZ TEST — tour 28'); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
    if (r) { await toucher(cdp, r.x, r.y); await sleep(2000); }
  }
  return dansZZ();
}
const lignes = () => page.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.textContent.trim()).filter((t) => /^\d[^\d]/.test(t)));
await allerZZ();
const avant = await lignes();
const champ = await page.evaluate(() => { const e = [...document.querySelectorAll('textarea')].find((x) => /Ajouter/.test(x.placeholder)); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
await toucher(cdp, champ.x, champ.y); await sleep(300);
await page.keyboard.type(url); const t0 = Date.now(); await page.keyboard.press('Enter');
const t = () => ((Date.now() - t0) / 1000).toFixed(1);
let der = '';
const instants = mode === 'reload' ? [0.5, 1.5] : [0.5, 1.5, 3, 5, 8, 12, 18, 25];
for (const s of instants) {
  const d = s * 1000 - (Date.now() - t0); if (d > 0) await sleep(d);
  await photo(page, `${pre}-t${String(s).replace('.', '_')}`);
  const tx = await texte(); const i = tx.indexOf('ZZ TEST — tour 28 |'); const res = tx.slice(i + 20, i + 420);
  if (res !== der) log(pre, t() + 's', res); der = res;
  if (/\| Lu \||Lien introuvable|Déjà dans ce carnet/.test(res) && s > 3) break;
}
if (mode === 'reload') {
  log(pre, 'RECHARGE à', t());
  await page.reload({ waitUntil: 'domcontentloaded' }); await sleep(5000);
  await photo(page, pre + '-r0-apres-recharge'); log(pre, 'après recharge', (await texte()).slice(-400));
  await allerZZ(); await sleep(1500);
  await photo(page, pre + '-r1-zz'); log(pre, t(), 'ZZ rouvert', (await texte()).slice(150, 700));
  await sleep(8000); await photo(page, pre + '-r2-zz'); log(pre, t(), 'ZZ +8 s', (await texte()).slice(150, 700));
}
await sleep(1500);
const apres = await lignes();
const neuf = apres.filter((l) => !avant.some((a) => a.slice(1) === l.slice(1)));
log(pre, 'lignes', apres.length, 'neuves', neuf);
await photo(page, pre + '-liste');
if (neuf.length) {
  const nom = neuf[0];
  const r = await page.evaluate((n) => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === n); b.scrollIntoView({ block: 'center' }); return true; }, nom); await sleep(700);
  const p = await page.evaluate((n) => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === n).getBoundingClientRect(); return { x: b.left + b.width / 3, y: b.top + b.height / 2 }; }, nom);
  await toucher(cdp, p.x, p.y); await sleep(2500);
  await photo(page, pre + '-fiche');
  for (let i = 1; i <= 2; i++) { await page.mouse.move(195, 450); await page.mouse.wheel({ deltaY: 560 }); await sleep(700); await photo(page, `${pre}-fiche${i + 1}`); }
  const tx = await texte(); const i = tx.indexOf('Articles · ZZ'); log(pre, 'FICHE', tx.slice(i, i + 1600));
  await allerZZ();
}
lacher();
