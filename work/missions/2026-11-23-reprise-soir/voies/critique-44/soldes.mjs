// Soldes après : Synthèse (Entré, Dépensé, En caisse), Solde de départ, Mon mois de la saisie ; après rechargement (état serveur)
import { ouvrir, sleep, photo, log, ou, toucher, APP } from './outil.mjs';
import { outils, texte } from './commun.mjs';
import fs from 'node:fs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
setTimeout(() => { log('S DÉLAI'); lacher(); process.exit(2); }, 200000);
await page.goto(APP, { waitUntil: 'networkidle2' }); await sleep(4500);
await o.nav('Finances'); await o.tap('Synthèse', 'button,[role=tab]'); await sleep(1500);
const t = await texte(page);
const r = { alerte: await page.evaluate(() => [...document.querySelectorAll('[role=alert]')].map((e) => e.innerText.trim()).filter(Boolean)), synthese: (/Entré\n([^\n]+)\nDépensé\n([^\n]+)/.exec(t) || []).slice(1).join(' / '), caisse: (/En caisse\n([^\n]+)\n([^\n]+)/.exec(t) || []).slice(1).join(' | ') };
await photo(page, 'S1-synthese');
await o.tap('Solde et paramètres financiers'); await sleep(1500); r.depart = (/Solde de départ[\s\S]{0,60}/.exec(await texte(page)) || [''])[0].replace(/\n/g, ' '); await page.keyboard.press('Escape'); await sleep(600);
await o.tap('Actions rapides'); await sleep(800); await o.tap('Écriture, à la main'); await sleep(1300);
r.monMois = (/Mon mois\n([^\n]+)/.exec(await texte(page)) || [])[1]; r.habituels = (/HABITUELS\n([\s\S]{0,120})/.exec(await texte(page)) || [])[1];
await photo(page, 'S2-saisie', true);
const f = await ou(page, 'Fermer', 'button'); if (f) { await toucher(cdp, f.x, f.y); await sleep(700); }
await o.nav('Calendrier'); await sleep(1500);
r.depenser = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /CHF à dépenser/.test(x.getAttribute('aria-label') || '')); return b && b.getAttribute('aria-label'); });
r.cadre = await page.evaluate(() => (document.querySelector('.ent-cadre') || {}).innerText);
r.ls = await page.evaluate(() => localStorage.getItem('laffinee.calendrier.fenetre-locale'));
r.zz = await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST/.test(x)));
log('S', r); fs.writeFileSync(new URL(process.argv[2] || 'apres.json', import.meta.url), JSON.stringify(r, null, 1));
lacher(); process.exit(0);
