// Soldes avec ZZ ; Remboursement › « De quelle pièce ? » (E41-2 : masque, 23, Brau) ; remboursement +1 de ZZ TEST — Achat enregistré
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
import fs from 'node:fs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
page.on('console', (m) => { if (/error|warn/.test(m.type())) log('CONSOLE', m.type(), m.text().slice(0, 240)); });
page.on('pageerror', (e) => log('PAGEERROR', String(e).slice(0, 240)));
setTimeout(() => { log('R DÉLAI'); lacher(); process.exit(2); }, 400000);
const fermer = async () => { for (let i = 0; i < 4; i++) { const f = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /^Fermer$/.test(x.getAttribute('aria-label') || x.textContent.trim()) && x.getBoundingClientRect().width > 0).pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); if (!f) break; await toucher(cdp, f.x, f.y); await sleep(700); } };
const tapRe = async (re, sel = 'button') => { const r = await page.evaluate((re, s) => { const e = [...document.querySelectorAll(s)].filter((x) => x.getBoundingClientRect().width > 0 && x.getBoundingClientRect().top > 40).find((x) => new RegExp(re).test((x.getAttribute('aria-label') || '') + '¦' + x.textContent.trim())); if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, t: ((e.getAttribute('aria-label') || '') + '¦' + e.textContent.trim()).slice(0, 80) }; }, re, sel); if (!r) { log('R introuvable', re); return null; } await sleep(300); await toucher(cdp, r.x, r.y); await sleep(900); return r; };
const ecrire = async (re, v) => { const hs = await page.$$('input,textarea'); for (const h of hs) { const ok = await h.evaluate((e, re) => e.getBoundingClientRect().width > 0 && new RegExp(re).test((e.getAttribute('aria-label') || '') + '¦' + (e.placeholder || '')), re); if (ok) { await h.evaluate((e) => e.scrollIntoView({ block: 'center' })); const b = await h.boundingBox(); await toucher(cdp, b.x + b.width / 2, b.y + b.height / 2); await sleep(300); await h.focus(); await page.keyboard.down('Control'); await page.keyboard.press('a'); await page.keyboard.up('Control'); await page.keyboard.press('Delete'); await page.keyboard.type(v, { delay: 50 }); await sleep(900); return true; } } log('R champ absent', re); return false; };
const s = await o.soldes('R0');
fs.writeFileSync('milieu.json', JSON.stringify(s, null, 1));
await fermer(); await o.nav('Finances'); await o.tap('Actions rapides'); await sleep(800); await o.tap('Écriture, à la main'); await sleep(1300);
await tapRe('^¦Remboursement'); await sleep(1000); await photo(page, 'R1-liste');
log('R1', (await texte(page)).split('De quelle pièce ?').pop().slice(0, 700).replace(/\n/g, ' ¦ '));
for (const [k, q] of [['R2', 'masque'], ['R3', '23'], ['R4', 'Brau']]) { await ecrire('Cherch', q); await photo(page, k + '-' + q, true); log(k, q, (await texte(page)).split('De quelle pièce ?').pop().slice(0, 400).replace(/\n/g, ' ¦ ')); }
await photo(page, 'R4-Brau-plein');
await ecrire('Cherch', 'ZZ TEST — Achat'); await sleep(600);
await tapRe('^¦?ZZ TEST — Achat'); await sleep(1200); await photo(page, 'R5-choisi'); log('R5', (await texte(page)).split('Saisir à la main').pop().slice(0, 600).replace(/\n/g, ' ¦ '));
await ecrire('Montant', '1'); await page.evaluate(() => document.activeElement && document.activeElement.blur()); await sleep(500); await photo(page, 'R6-montant');
const f = await page.evaluate(() => { const bs = [...document.querySelectorAll('button')].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.top > 760 && r.top < 800; }); const b = bs[bs.length - 1]; if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: b.textContent.trim(), d: b.disabled }; });
log('R6 bouton', f); if (f && !f.d && !/Mon mois/.test(f.t)) { await toucher(cdp, f.x, f.y); await sleep(2000); await photo(page, 'R7-fin'); log('R7', (await texte(page)).slice(-500).replace(/\n/g, ' ¦ ')); }
await fermer();
lacher(); process.exit(0);
