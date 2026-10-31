// Voie b1-etiquettes : la feuille « Sources » de la fiche, dans un vrai Chrome (390 × 844, fixtures ?dev-local, aucune donnée réelle).
// Quatre houblons : Lotus (variété de base, Beer Maverick), Fusion (ajout, une seule source : Brewer’s Friend, sans compléments),
// Krpan (ajout, une seule source : Charles Faram, avec compléments), Krush (ajout, plusieurs sources).
// Ce que le script vérifie : (1) la ligne « sources-confiance » existe ; (2) pour un ajout, aucun « Beer Maverick » dans la feuille ; (3) Lotus garde son lien
// Beer Maverick ; (4) « 1 source » apparaît pour Fusion et Krpan. Il imprime le texte de la ligne de chaque houblon, et prend une capture de la feuille.
// Usage (racine d'un arbre qui porte le commit de la voie) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5252 --strictPort" --port 5252 --env VITE_HOP_V4=on -- node work/missions/2026-10-25-integration-houblons/voies/b1-etiquettes/capture-fiches.mjs
// Captures : <dossier de la voie>/img/<houblon>-sources.png (à ouvrir : L12).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = process.cwd();
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const IMG = path.join(RACINE, 'work/missions/2026-10-25-integration-houblons/voies/b1-etiquettes/img');
fs.mkdirSync(IMG, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const base = `http://localhost:${process.env.WITH_SERVER_PORTS}`;
let echecs = 0;
const ok = (c, m) => { if (!c) echecs += 1; console.log(`${c ? 'OK    ' : 'ECHEC '} ${m}`); };

const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 844 });
await page.goto(`${base}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-ecran="ma-biere"]', { timeout: 120000 });
await dormir(800);

async function ajouter(nom) {
  const champ = '[aria-label="Ajouter un houblon : stock ou catalogue"]';
  await page.waitForSelector(champ, { timeout: 30000 });
  await page.click(champ, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type(champ, nom, { delay: 15 });
  const plus = '[data-role="ajout-rapide"] [data-role="ajout-rapide-plus"]';
  await page.waitForSelector(plus, { timeout: 30000 });
  const cle = await page.$eval('[data-role="ajout-rapide"]', (e) => e.getAttribute('data-houblon-ajout'));
  await page.click(plus);
  await dormir(900);
  return cle;
}
const carte = (cle) => `[data-element="etape-carte-ajout"][data-houblon-ligne="${cle}"]`;

async function feuilleSources(nom) {
  const cle = await ajouter(nom);
  await page.$eval(carte(cle), (e) => e.scrollIntoView({ block: 'center' }));
  await dormir(300);
  const bande = `${carte(cle)} [data-role="bande"]`;
  if (await page.$(bande)) { await page.click(bande); await dormir(500); }
  const lien = `${carte(cle)} [data-role="ouvrir-fiche"]`;
  const b = await (await page.$(lien)).boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down(); await dormir(750); await page.mouse.up();
  await page.waitForSelector('[data-ecran="fiche"]', { timeout: 15000 });
  await dormir(1200);
  await page.click('[data-etat="etat-fiche-sources"]');
  await page.waitForSelector('[data-role="sources-feuille"]', { timeout: 15000 });
  await dormir(1500);                                   // les compléments (18 sources) arrivent à la demande
  const lu = await page.evaluate(() => {
    const f = document.querySelector('[data-role="sources-feuille"]');
    const c = f.querySelector('[data-role="sources-confiance"]');
    return { confiance: c ? c.textContent.replace(/\s+/g, ' ').trim() : null, bm: /Beer ?Maverick/i.test(f.textContent ?? ''),
      liens: [...f.querySelectorAll('[data-role="sources-liens"] li')].map((l) => l.getAttribute('data-source-nom')) };
  });
  await page.$eval('[data-role="sources-feuille"]', (e) => e.scrollIntoView({ block: 'start' }));
  await dormir(300);
  await page.screenshot({ path: path.join(IMG, `${nom.toLowerCase()}-sources.png`) });
  await page.keyboard.press('Escape');
  await dormir(900);
  if (await page.$('[data-ecran="fiche"]')) { await page.click('[aria-label="Fermer"]').catch(() => {}); await dormir(800); }
  return { cle, ...lu };
}

const lotus = await feuilleSources('Lotus');
console.log('Lotus      ', JSON.stringify(lotus));
ok(!!lotus.confiance, 'Lotus : la ligne « sources-confiance » existe');
ok(lotus.liens.some((n) => /Beer Maverick/.test(n)), 'Lotus : garde sa page Beer Maverick');
for (const [nom, un] of [['Fusion', true], ['Krpan', true], ['Krush', false]]) {
  const r = await feuilleSources(nom);
  console.log(nom.padEnd(11), JSON.stringify(r));
  ok(!!r.confiance, `${nom} : la ligne « sources-confiance » existe`);
  ok(!r.bm, `${nom} : aucun « Beer Maverick » dans la feuille`);
  if (un) ok(/1 source/.test(r.confiance ?? ''), `${nom} : « 1 source » apparaît`);
}
const erreurs = journal.erreurs.filter((e) => !/Firestore|firebase|net::ERR/i.test(e));
ok(erreurs.length === 0, `aucune erreur de page${erreurs.length ? ` : ${erreurs.slice(0, 2).join(' | ')}` : ''}`);
await browser.close();
console.log(echecs ? `\nCAPTURE ECHEC (${echecs})` : '\nCAPTURE OK');
process.exit(echecs ? 1 : 0);
