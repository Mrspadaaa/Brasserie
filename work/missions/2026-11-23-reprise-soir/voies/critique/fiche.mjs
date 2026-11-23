// node fiche.mjs <prefixe> <texte du nom>
import { ouvrir, sleep, photo, log, taper } from './outil.mjs';
const [pre, nom] = process.argv.slice(2);
const { page, cdp, lacher } = await ouvrir();
await taper(page, cdp, nom, 'div,span,p,h3,h4,strong,button,a'); await sleep(2500);
await photo(page, pre + '-fiche');
// défiler la fiche (dialogue ou page) pour tout voir
const n = await page.evaluate(() => { const d = [...document.querySelectorAll('[role=dialog], .sheet, [data-sheet]')].pop(); const s = d ? [d, ...d.querySelectorAll('*')].find((e) => e.scrollHeight > e.clientHeight + 20 && getComputedStyle(e).overflowY !== 'visible') : null; window.__sc = s || document.scrollingElement; return { dialog: !!d, h: window.__sc.scrollHeight, c: window.__sc.clientHeight }; });
log(pre, 'fiche', n);
for (let i = 1; i <= 3 && i * 700 < n.h; i++) { await page.evaluate((y) => window.__sc.scrollTo(0, y), i * 700); await sleep(500); await photo(page, `${pre}-fiche${i + 1}`); }
const txt = await page.evaluate(() => { const d = [...document.querySelectorAll('[role=dialog]')].pop(); return (d || document.body).innerText; });
log(pre, 'TEXTE', txt.replace(/\n+/g, ' | ').slice(0, 2500));
log(pre, 'boutons', await page.evaluate(() => { const d = [...document.querySelectorAll('[role=dialog]')].pop() || document.body; return [...d.querySelectorAll('button')].map((b) => (b.getAttribute('aria-label') || b.textContent.trim()).slice(0, 30)); }));
lacher();
