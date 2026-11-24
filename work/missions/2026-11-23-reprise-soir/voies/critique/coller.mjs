// node coller.mjs <prefixe> <url> [secondes]
import { ouvrir, sleep, photo, log, taper, toucher } from './outil.mjs';
const [pre, url, sec = '40'] = process.argv.slice(2);
const { page, cdp, lacher } = await ouvrir();
if (!(await page.evaluate(() => document.body.innerText.includes('Ajouter à ZZ') || [...document.querySelectorAll('textarea,input')].some((e) => (e.placeholder || '').includes('coller'))))) {
  await taper(page, cdp, 'ZZ TEST — tour 28', 'div,span,p,h3,h2,button,a,li'); await sleep(2000);
}
const champ = await page.evaluate(() => { const e = [...document.querySelectorAll('textarea,input')].find((x) => /coller|Ajouter/.test(x.placeholder || '')); if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, ph: e.placeholder }; });
log(pre, 'champ', champ);
await photo(page, pre + '-avant');
await toucher(cdp, champ.x, champ.y); await sleep(300);
await page.evaluate((u) => { const e = document.activeElement; const dt = new DataTransfer(); dt.setData('text/plain', u); e.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); }, url);
await sleep(300);
const v = await page.evaluate(() => document.activeElement?.value ?? '');
if (!v.includes('http')) { await page.keyboard.type(url); }
await sleep(200);
const t0 = Date.now();
await page.keyboard.press('Enter');
const instants = [0.4, 1.2, 2.5, 4, 6, 8, 11, 15, 20, 28, 40, 55].filter((s) => s <= Number(sec));
let dernier = '';
for (const s of instants) {
  const d = s * 1000 - (Date.now() - t0); if (d > 0) await sleep(d);
  const f = await photo(page, `${pre}-t${String(s).replace('.', '_')}`);
  const txt = await page.evaluate(() => document.body.innerText);
  const m = txt.match(/(Lecture[^\n]*\n[\s\S]{0,400})/);
  const resume = (m ? m[1] : txt.slice(0, 300)).replace(/\n+/g, ' | ').slice(0, 300);
  if (resume !== dernier) log(pre, s + 's', resume); dernier = resume;
}
lacher();
