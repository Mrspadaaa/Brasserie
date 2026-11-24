// Calendrier : pastille Ventes, bande Apport, bande Pour moi ; Finances › Prévisions (dates des ZZ)
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
setTimeout(() => { log('K DÉLAI'); lacher(); process.exit(2); }, 300000);
const fermer = async () => { for (let i = 0; i < 3; i++) { const f = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /^Fermer$/.test(x.getAttribute('aria-label') || x.textContent.trim()) && x.getBoundingClientRect().width > 0).pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); if (!f) break; await toucher(cdp, f.x, f.y); await sleep(700); } };
const viser = async (re) => { const v = await page.evaluate((re) => { const e = [...document.querySelectorAll('[aria-label],button')].find((x) => new RegExp(re).test(x.getAttribute('aria-label') || x.textContent.trim()) && x.getBoundingClientRect().width > 0); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + Math.min(r.width / 2, 60), y: r.top + r.height / 2, a: (e.getAttribute('aria-label') || e.textContent.trim()).slice(0, 100) }; }, re); if (!v) { log('K introuvable', re); return null; } await sleep(400); await toucher(cdp, v.x, v.y); await sleep(1300); return v; };
await fermer(); await o.nav('Calendrier'); await sleep(1500);
for (const [n, re] of [['K1-pastille-ventes', '^[+][0-9]+ prévu|prévu S4'], ['K1b-pastille-papiers', '^−[0-9 ]+ prévu'], ['K2-bande-apport', '^ZZ TEST — Apport'], ['K3-bande-pourmoi', '^ZZ TEST — Pour moi'], ['K4-bande-abo', '^ZZ TEST — Abonnement']]) {
  const v = await viser(re); log(n, v); await photo(page, n); log(n, 'texte', (await texte(page)).slice(-700).replace(/\n/g, ' ¦ ')); await fermer(); await page.keyboard.press('Escape'); await sleep(500);
}
await o.nav('Finances'); await o.tap('Prévisions', 'button,[role=tab]'); await sleep(1500); await photo(page, 'K5-previsions');
log('K5', await page.evaluate(() => [...document.querySelectorAll('*')].filter((e) => e.childElementCount === 0 && /ZZ TEST/.test(e.textContent)).map((e) => (e.parentElement.innerText || '').replace(/\n/g, ' ¦ ').slice(0, 120))));
await o.tap('Synthèse', 'button,[role=tab]'); await sleep(1200); await photo(page, 'K6-synthese');
const t = await texte(page); log('K6', (/Entré[\s\S]{0,400}/.exec(t) || [''])[0].replace(/\n/g, ' ¦ '), (/En caisse\n([^\n]+)/.exec(t) || [])[1]);
lacher(); process.exit(0);
