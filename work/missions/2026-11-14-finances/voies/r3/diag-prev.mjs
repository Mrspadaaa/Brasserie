// Diagnostic r3 : l'onglet Prévisions fige-t-il la page ? (jamais commité : outil de la voie)
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const L = await import(pathToFileURL(path.join(process.cwd(), '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const url = process.argv[2] || 'http://localhost:3000/?dev-local&finance-demo';
const { browser, page, journal } = await L.ouvrir({ largeur: 390, hauteur: 844, mobile: true, echelle: 1 });
const vivant = (ms) => Promise.race([page.evaluate(() => 1 + 1).then(() => 'vivant'), new Promise((r) => setTimeout(() => r('FIGE'), ms))]);
const clic = (t) => page.evaluate((t) => { const e = [...document.querySelectorAll('button,[role=tab]')].find((x) => (x.innerText || '').trim() === t && x.getClientRects().length); if (!e) return 'absent'; e.click(); return 'ok'; }, t);
setTimeout(() => { console.log('DELAI'); process.exit(3); }, 60000);
await page.goto(url, { waitUntil: 'domcontentloaded' }); await L.calme(page, 1500);
console.log('Finances', await clic('Finances'), await vivant(5000));
await L.calme(page, 800);
console.log('Prévisions', await clic('Prévisions'));
for (const t of [500, 2000, 5000]) console.log(`après ${t} ms`, await vivant(t));
console.log('erreurs', journal.erreurs.slice(0, 3).join(' | ') || 'aucune');
await browser.close(); process.exit(0);
