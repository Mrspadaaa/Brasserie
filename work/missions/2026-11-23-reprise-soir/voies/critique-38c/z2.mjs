import { ouvrir, sleep, photo, log, boutons, toucher, ou } from './outil.mjs';
import { outils, court } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const { tap, duree, barre } = outils(page, cdp);
const filt = (l) => l.filter((b) => !/^(Bord|Finances|Calendrier|Brassins|Stocks|Clients|S\d|Masquer|Ajouter dans|Poignée|Fixes|Brassage|Nettoyage|Autres|Matériel|Apports)/.test(b));
const vis = async (re) => page.evaluate((s) => { const r = new RegExp(s); const b = [...document.querySelectorAll('button,[role=button],summary,a')].filter((x) => x.getBoundingClientRect().width > 0 && r.test((x.getAttribute('aria-label') || '') + ' ' + x.textContent.trim())).pop(); if (!b) return null; b.scrollIntoView({ block: 'center' }); const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2, t: (b.getAttribute('aria-label') || b.textContent.trim()).slice(0, 60) }; }, re.source);
let c = await vis(/Corriger une erreur de saisie/); log('corriger', c); await sleep(400); c = await vis(/Corriger une erreur de saisie/); await toucher(cdp, c.x, c.y); await sleep(1300);
await photo(page, 'Z2-00-corriger', true); log('options', filt(await boutons(page)).slice(-12));
let s = await vis(/Supprimer|Retirer|Effacer l’écriture|Annuler l’écriture/); log('suppr', s);
if (s && !/recherche/i.test(s.t)) { await toucher(cdp, s.x, s.y); await sleep(1300); await photo(page, 'Z2-01-confirm', true); log('confirm', filt(await boutons(page)).slice(-8)); const k = await vis(/^(Supprimer|Retirer|Confirmer|Oui)/); log('k', k); if (k) { await toucher(cdp, k.x, k.y); await sleep(2500); } }
await photo(page, 'Z2-02-apres', true);
log('reste ZZ apport', await page.evaluate(() => (document.body.innerText.match(/ZZ TEST — apport/g) || []).length));
lacher();
