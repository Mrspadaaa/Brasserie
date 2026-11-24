// Fiche Modifier de « ZZ TEST — Achat » : toucher le montant, taper 4,50, enregistrer ; vérifier liste, Synthèse, solde
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1200); { const x = await ou(page, 'Effacer la recherche', 'button'); if (x) { await toucher(cdp, x.x, x.y); await sleep(900); } }
const a = await ou(page, 'ZZ TEST — Achat · Nettoyage', 'button,[role=button]', true); await toucher(cdp, a.x, a.y); await sleep(1300);
await o.tap('Modifier', 'button'); await sleep(1500);
log('M4 champs', await page.evaluate(() => [...document.querySelectorAll('input,textarea,select')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => { const r = e.getBoundingClientRect(); return `${e.tagName}/${e.type} «${e.getAttribute('aria-label') || e.placeholder || e.name || ''}» v=${e.value} im=${e.inputMode} @${Math.round(r.left)},${Math.round(r.top)}`; })));
// toucher au centre du « 3,50 »
const m = await page.evaluate(() => { const e = [...document.querySelectorAll('*')].find((x) => x.childElementCount === 0 && x.textContent.trim() === '3,50' && x.getBoundingClientRect().top > 500) || [...document.querySelectorAll('input')].find((i) => i.value === '3,50'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, tag: e.tagName }; });
log('M4 montant', m);
await toucher(cdp, m.x, m.y); await sleep(800); await photo(page, 'M4-montant-touche');
log('M4 focus', await page.evaluate(() => { const e = document.activeElement; return e.tagName + ' ' + (e.getAttribute('aria-label') || e.placeholder || '') + ' v=' + e.value; }));
await page.keyboard.down('Control'); await page.keyboard.press('a'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace'); await page.keyboard.type('4,50', { delay: 80 }); await sleep(600);
await photo(page, 'M4-montant-tape', false);
log('M4 après frappe', await page.evaluate(() => { const e = document.activeElement; return e.tagName + ' v=' + e.value; }));
await o.tap('Enregistrer', 'button'); await sleep(1800); await photo(page, 'M4-enregistre', false);
log('M4 liste', await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST — Achat ·|Nettoyage [0-9]/.test(x))));
lacher();
