// k1 corrections B, points 6 à 8 : NOLO dans Chrome (fixture dev-local, aucune donnée réelle).
// Usage : WITH_SERVER_PORTS=3104 node k1b-nolo-mesure.mjs <largeur> <prefixe> <clair|cave>
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const url = `http://localhost:${(process.env.WITH_SERVER_PORTS ?? '3104').split(',')[0]}`;
const SORTIE = path.join(import.meta.dirname, '..', 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const largeur = Number(process.argv[2] ?? 390);
const pre = process.argv[3] ?? 'k1b';
const mode = process.argv[4] ?? 'clair';

const { browser, page } = await ouvrir({ largeur, hauteur: largeur < 600 ? 844 : 900, mobile: largeur < 600, echelle: 1 });
let charge = false;
for (let essai = 0; essai < 3 && !charge; essai++) {
  await page.goto(`${url}/?dev-local&etape=houblons&recette=identite`, { waitUntil: 'domcontentloaded' });
  charge = await page.waitForFunction(() => document.body.innerText.includes('Suivant'), { timeout: 70000 }).then(() => true).catch(() => false);
}
if (!charge) { console.log('ECHEC chargement'); await browser.close(); process.exit(1); }
await dormir(1500);
const clic = async (texte) => {
  const h = await page.evaluateHandle((t) => [...document.querySelectorAll('button,[role=tab],a')].find((b) => b.textContent.trim().startsWith(t) && b.getClientRects().length), texte);
  if (h.asElement()) { await h.asElement().click(); await dormir(700); return true; } return false;
};
await page.evaluate((v) => { if (v === 'cave') document.documentElement.setAttribute('data-theme', 'cave'); else document.documentElement.removeAttribute('data-theme'); }, mode);
await clic('Identité');
await page.waitForSelector('[data-element="r4a-nolo"]', { timeout: 20000 }).catch(() => console.log('INFO r4a-nolo absent', 'ELS'));
await page.click('[data-element="r4a-nolo"]'); await dormir(2000);
await clic('Adapter à mon matériel'); await dormir(2500);

const mesure = await page.evaluate(() => {
  const s = [...document.querySelectorAll('.nolo-solver-details > summary')].find((n) => /^Hypothèses du calcul/.test(n.textContent));
  if (!s) return { erreur: 'résumé introuvable' };
  const cs = getComputedStyle(s);
  const r = s.getBoundingClientRect();
  const rg = document.createRange(); rg.selectNodeContents(s);
  const textRight = Math.max(...[...rg.getClientRects()].map((q) => q.right));
  // le chevron (fond, 20 px, à 4 px du bord droit) dessine son trait de 5 à 15 px dans sa boîte
  const chevronEncre = r.right - 4 - 20 + 5;
  const plage = [...document.querySelectorAll('p')].find((p) => /Plage de simulation/.test(p.textContent));
  const eau = document.querySelector('[aria-label="Eau proposée pour le scénario NOLO"]');
  const ligne = [...document.querySelectorAll('p')].find((p) => /^Recette actuelle/.test(p.textContent));
  const visible = (n) => !!n && n.getClientRects().length > 0 && !!(n.offsetParent || getComputedStyle(n).position === 'fixed');
  return { paddingRight: cs.paddingRight, ecartTexteChevron: Math.round((chevronEncre - textRight) * 10) / 10,
    plageVisible: visible(plage), eauVisible: visible(eau), ligne: ligne?.textContent };
});
console.log(`MESURE ${largeur} ${mode}`, JSON.stringify(mesure));
await page.evaluate(() => (document.querySelector('.nolo-simulator') ?? document.querySelector('.nolo-panel'))?.scrollIntoView({ block: 'start' })); await dormir(500);
await page.screenshot({ path: path.join(SORTIE, `${pre}-${largeur}-${mode}-nolo-repli.png`) });
await page.evaluate(() => { const d = [...document.querySelectorAll('.nolo-solver-hypotheses')][0]; if (d) d.open = true; }); await dormir(400);
await page.screenshot({ path: path.join(SORTIE, `${pre}-${largeur}-${mode}-nolo-deplie.png`) });
await browser.close();
