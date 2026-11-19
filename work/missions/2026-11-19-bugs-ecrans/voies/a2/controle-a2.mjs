// Voie a2 : contrôle Chrome des défauts Identité / NOLO / Paliers. Fixture dev-local `recette=identite` (aucune donnée réelle, requêtes hors localhost coupées).
// Usage : WITH_SERVER_PORTS=3104 node controle-a2.mjs <largeur> [prefixe]   → lignes « OK … » / « ECHEC … », captures dans ./captures
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const url = `http://localhost:${(process.env.WITH_SERVER_PORTS ?? '3104').split(',')[0]}`;
const SORTIE = path.join(import.meta.dirname, 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const largeur = Number(process.argv[2] ?? 390);
const pre = process.argv[3] ?? 'ctl';
const fautes = [];
const verifier = (ok, texte) => { console.log(`${ok ? 'OK   ' : 'ECHEC'} ${texte}`); if (!ok) fautes.push(texte); };

const { browser, page, journal } = await ouvrir({ largeur, hauteur: largeur < 600 ? 844 : 900, mobile: largeur < 600, echelle: 1 });
let charge = false;
for (let essai = 0; essai < 3 && !charge; essai++) {
  await page.goto(`${url}/?dev-local&etape=houblons&recette=identite`, { waitUntil: 'domcontentloaded' });
  charge = await page.waitForFunction(() => document.body.innerText.includes('Suivant'), { timeout: 70000 }).then(() => true).catch(() => false);
}
if (!charge) { console.log('ECHEC chargement'); await page.screenshot({ path: path.join(SORTIE, `${pre}-echec-chargement.png`) }); await browser.close(); process.exit(1); }
await dormir(1500);
const clic = async (texte) => {
  const h = await page.evaluateHandle((t) => [...document.querySelectorAll('button,[role=tab],a')].find((b) => b.textContent.trim().startsWith(t) && b.getClientRects().length), texte);
  if (h.asElement()) { await h.asElement().click(); await dormir(700); return true; } return false;
};
const photo = (nom, plein = false) => page.screenshot({ path: path.join(SORTIE, `${pre}-${largeur}-${nom}.png`), fullPage: plein });
const theme = async (t) => { await page.evaluate((v) => { if (v === 'cave') document.documentElement.setAttribute('data-theme', 'cave'); else document.documentElement.removeAttribute('data-theme'); }, t); await dormir(500); };

// --- Identité
await clic('Identité');
await photo('identite-clair');
// TL-30 : un nom long reste lisible en entier
const mesure = () => page.$eval('[data-element="r4a-nom"]', (n) => { const r = n.getBoundingClientRect(); const p = document.querySelector('.idn-pas').getBoundingClientRect(); return { w: Math.round(r.width), sw: n.scrollWidth, cw: n.clientWidth, pastilleSous: p.top > r.bottom - 2 }; });
const saisir = async (texte) => { await page.focus('[data-element="r4a-nom"]'); await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control'); await page.keyboard.type(texte); await dormir(400); };
await saisir('Nuage Banane — Hefeweisse');
const longNom = await mesure();
verifier(longNom.sw <= longNom.cw + 1, `TL-30 ${largeur} px : « Nuage Banane — Hefeweisse » entier dans le champ ${JSON.stringify(longNom)}`);
await photo('identite-nom-long');
await saisir('Stout export');
const court = await mesure();
verifier(!court.pastilleSous && court.sw <= court.cw + 1, `TL-30 ${largeur} px : un nom court garde la ligne unique ${JSON.stringify(court)}`);

// BR-67 : retour après « Proposer l'empâtage »
await page.click('[data-role="repbtn"]'); await dormir(400);
const lien = await page.evaluateHandle(() => [...document.querySelectorAll('.idn-lien-ligne')].find((b) => /Empâtage/.test(b.textContent)));
if (lien.asElement()) {
  await lien.asElement().click(); await dormir(500);
  const retour = await page.$$eval('.idn-pose', (l) => l.map((n) => n.textContent));
  verifier(retour.length === 1 && /posé/.test(retour[0]), `BR-67 : retour visible ${JSON.stringify(retour)}`);
  await photo('identite-pose');
} else verifier(false, 'BR-67 : lien « Empâtage » introuvable');
await page.click('[data-role="repbtn"]'); await dormir(300);

// TE-14 / TE-15 : NOLO
await page.click('[data-element="r4a-nolo"]'); await dormir(2000);
await clic('Adapter à mon matériel'); await dormir(2500);
const nolo = await page.evaluate(() => {
  const w = document.querySelector('.recipe-wizard') ?? document.body;
  const vis = (n) => n.getClientRects().length > 0;
  return { champs: [...w.querySelectorAll('input,select,textarea')].filter(vis).length, deplis: [...w.querySelectorAll('details')].filter(vis).length,
    texte: w.innerText.replace(/\n+/g, ' ¶ ') };
});
console.log('INFO NOLO', nolo.champs, 'champs', nolo.deplis, 'dépliants');
console.log('INFO NOLO texte', nolo.texte.slice(nolo.texte.indexOf('NOLO'), nolo.texte.indexOf('NOLO') + 3000));
await page.evaluate(() => document.querySelector('.nolo-panel')?.scrollIntoView({ block: 'start' })); await dormir(500);
await photo('nolo-clair', true);
const pointsL = nolo.texte.match(/\d+\.\d+\s*L\b/g);
verifier(!pointsL, `TE-14 : aucun « 10.4 L » à point décimal ${JSON.stringify(pointsL)}`);
await page.click('[data-element="r4a-nolo"]').catch(() => {}); await dormir(800);

// --- Paliers (TE-29)
await clic('Paliers'); await dormir(1200);
await photo('paliers-clair');
const avant = await page.$$eval('[data-booster="palier"]', (l) => l.map((n) => n.getAttribute('aria-label')));
await page.click('[data-booster="ajout-frontiere"]'); await dormir(800);
const apres = await page.$$eval('[data-booster="palier"]', (l) => l.map((n) => n.getAttribute('aria-label')));
console.log('INFO paliers avant', JSON.stringify(avant)); console.log('INFO paliers après', JSON.stringify(apres));
const nouveau = apres.find((a) => !avant.includes(a)) ?? apres[apres.length - 1];
verifier(apres.length === avant.length + 1 && /· Palier \d+,/.test(nouveau ?? ''), `TE-29 : palier ajouté nommé « Palier N » : ${nouveau}`);
await photo('paliers-ajout');
const mo = await page.$$eval('[data-booster="palier"]', (l) => l.filter((n) => /mash-out/.test(n.getAttribute('aria-label'))).length);
verifier(mo >= 1 || (await page.$('[data-booster="mash-out"]')) !== null, 'TE-29 : le mash-out est sur la courbe (colonne ou interrupteur)');

// --- cave
await theme('cave');
await photo('paliers-cave');
await clic('Identité'); await photo('identite-cave');
await page.click('[data-element="r4a-nolo"]'); await dormir(1500); await page.evaluate(() => document.querySelector('.nolo-panel')?.scrollIntoView({ block: 'start' })); await dormir(500);
await photo('nolo-cave', true);
console.log('INFO erreurs page', JSON.stringify(journal.erreurs.slice(0, 3)), 'bloquées', journal.bloquees.length);
await browser.close();
console.log(fautes.length ? `A2 ECHEC ${fautes.length}` : 'A2 OK');
process.exit(fautes.length ? 1 : 0);
