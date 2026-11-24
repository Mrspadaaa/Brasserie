// Remboursement 0,50 lié à ZZ TEST — Achat lié (pour rejouer E41-1, bouton visible)
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir(); const o = outils(page, cdp);
setTimeout(() => { log('V DÉLAI'); lacher(); process.exit(2); }, 150000);
await o.fermerHaut(); await o.nav('Finances'); await o.tap('Actions rapides'); await sleep(800); await o.tap('Écriture, à la main'); await sleep(1300);
const t = async (re, sel = 'button,[role=option],li') => { const r = await page.evaluate((re, s) => { const e = [...document.querySelectorAll(s)].filter((x) => x.getBoundingClientRect().width > 0).find((x) => new RegExp(re).test(x.textContent.trim())); if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, re, sel); if (r) { await sleep(300); await toucher(cdp, r.x, r.y); await sleep(1000); } return r; };
await t('^Remboursement'); log('V liste', !!(await t('^ZZ TEST — Achat lié')));
const m = await page.$('input[aria-label="Montant en CHF"]'); const b = await m.boundingBox(); await toucher(cdp, b.x + b.width / 2, b.y + b.height / 2); await m.focus(); await page.keyboard.type('0,50', { delay: 60 });
await page.evaluate(() => document.activeElement && document.activeElement.blur()); await sleep(500); await photo(page, 'V1-remb', true);
const f = await page.evaluate(() => { const bs = [...document.querySelectorAll('button')].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.top > 760 && r.top < 800; }); const b = bs.pop(); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: b.textContent.trim() }; });
log('V bouton', f); await toucher(cdp, f.x, f.y); await sleep(2000); await photo(page, 'V2-fin', true); log('V2', (await texte(page)).slice(-250).replace(/\n/g, ' ¦ '));
await o.fermerHaut(); lacher(); process.exit(0);
