// node menu.mjs <pre> <mot article> <Déplacer|Retirer> : touche l'action de la ligne de l'article dans le menu Articles
import { ouvrir, sleep, photo, log, toucher } from './outil.mjs';
const [pre, art, act] = process.argv.slice(2);
const { page, cdp, lacher } = await ouvrir();
const f = () => page.evaluate((a, act) => { const bs = [...document.querySelectorAll('button')].filter((b) => b.textContent.trim() === act || (b.getAttribute('aria-label') || '').startsWith(act)); const b = bs.find((x) => { let p = x.parentElement; for (let i = 0; i < 4 && p; i++, p = p.parentElement) if ((p.textContent || '').includes(a) && (p.textContent || '').length < 200) return true; return false; }); if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, al: b.getAttribute('aria-label') }; }, art, act);
await f(); await sleep(500); const r = await f(); log(pre, 'cible', r);
await photo(page, pre + '-avant');
if (r) await toucher(cdp, r.x, r.y);
await sleep(1500); await photo(page, pre + '-apres');
log(pre, (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ').slice(140, 1200));
lacher();
