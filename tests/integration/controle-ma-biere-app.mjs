// Contrôle de p6-ma-biere-app (#174) : l'onglet « Ma bière » de sa base v4.10 (« Ça aussi », registre ecrans.json, ma-biere) est
// dans l'app, atteint par son bouton « Ouvrir l'analyse de ma bière », à la place de « Écran provisoire… données du prototype,
// non réelles ». Il vérifie les blocs de l'inventaire (work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-ma-biere.json),
// les gestes (famille ouverte, visée +, ×, bannir, Radar, Absolu, onglet Suggestions) et prend les captures 390 × 844.
// Banc : la fixture `?dev-local&etape=houblons` (Stout export 16D, Nugget 46 g à 60′) ; aucune donnée réelle, aucun Gemini.
// Usage (racine) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5271 --strictPort" --port 5271 --env VITE_HOP_V4=on -- node tests/integration/controle-ma-biere-app.mjs [--sortie=<dossier des captures>]
// Imprime MA-BIERE-APP OK, ou MA-BIERE-APP ECHEC et la liste (code 1). Rouge sur HEAD (couche provisoire), vert avec l'écran.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const sortie = path.resolve(arg('sortie') ?? path.join(os.tmpdir(), 'ma-biere-app'));
fs.mkdirSync(sortie, { recursive: true });
const port = (process.env.WITH_SERVER_PORTS ?? '5271').split(',')[0];
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const echecs = [];
const verifier = (ok, texte) => { if (!ok) echecs.push(texte); };

// Les blocs de l'inventaire (data-element) que l'app doit porter, et leur forme.
const BLOCS = ['biere-onglets', 'biere-bandeau', 'biere-alerte', 'biere-reglages', 'biere-decompte', 'biere-legende', 'biere-barres', 'biere-objectifs', 'biere-levure'];

const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 844 });
try {
  await page.goto(`http://localhost:${port}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-hop-v4-etape="houblons"]', { timeout: 120000 });
  await dormir(800);
  // 1. Le geste du brasseur : le bouton « Ouvrir l'analyse de ma bière ».
  const bouton = await page.$('[data-role="pont-biere"]');
  verifier(!!bouton, 'le bouton « Ouvrir l’analyse de ma bière » (data-role="pont-biere") est absent de l’étape Houblons');
  if (bouton) await page.evaluate(() => document.querySelector('[data-role="pont-biere"]').click());
  const vu = await page.waitForSelector('[data-ecran="biere"]', { timeout: 20000 }).then(() => true, () => false);
  const texte = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  verifier(!/Écran provisoire/.test(texte), 'la couche montre encore « Écran provisoire… »');
  verifier(vu, 'l’écran Ma bière ([data-ecran="biere"]) n’apparaît pas après le toucher du bouton');
  if (vu) {
    await dormir(600);
    const cap = (nom) => page.screenshot({ path: path.join(sortie, `${nom}.png`) });
    const presence = (sel) => page.evaluate((s) => !!document.querySelector(s), sel);
    const compte = (sel) => page.evaluate((s) => document.querySelectorAll(s).length, sel);
    const txt = (sel) => page.evaluate((s) => document.querySelector(s)?.textContent?.replace(/\s+/g, ' ').trim() ?? null, sel);
    // 2. Les blocs de l'inventaire, au repos.
    for (const b of BLOCS) verifier(await presence(`[data-element~="${b}"]`), `bloc ${b} absent`);
    verifier(await compte('[data-famille-ligne]') === 12, `12 barres de famille attendues, ${await compte('[data-famille-ligne]')} trouvées`);
    const onglets = await page.evaluate(() => [...document.querySelectorAll('[role="tab"]')].map((t) => t.textContent));
    verifier(onglets.join('|') === 'Ma bière|Suggestions|Comparer', `onglets : ${onglets.join('|')}`);
    verifier(await presence('[data-role="onglets"] [data-role="retour"]'), 'la croix (retour à l’étape Houblons) est absente');
    verifier(await presence('[data-role="lectures"]'), 'le bandeau IBU · OG · EBC est absent');
    verifier(await presence('[data-ecran="biere"] [data-vue="barres"]') && await presence('[data-ecran="biere"] [data-vue="radar"]'), '« Barres / Radar » absent');
    verifier(await presence('[data-ecran="biere"] [data-e="style"]') && await presence('[data-ecran="biere"] [data-e="absolu"]'), '« Au style / Absolu » absent');
    verifier(/zone du style/.test(texte) || /zone du style/.test(await page.evaluate(() => document.body.innerText)), 'l’en-tête « zone du style · au-dessus » est absent');
    verifier(/Prévu avec SafAle US-05, caractérisée/.test(await page.evaluate(() => document.body.innerText)), 'le pied « Prévu avec SafAle US-05, caractérisée » est absent');
    verifier(await presence('[data-role="pont-objectif-autre"]'), 'la puce « + … » est absente');
    await cap('app-repos');
    // 3. Une famille touchée : « bannir · − · sans visée · + », puis « + » pose la visée (losange et trait sur la piste), « × » la retire.
    await page.evaluate(() => document.querySelector('[data-famille-ligne="tropical"] > button').click());
    await dormir(200);
    verifier(await presence('[data-famille-ligne="tropical"] [data-visee="plus"]') && await presence('[data-famille-ligne="tropical"] [data-visee="bannir"]'), 'la famille touchée ne s’ouvre pas sur « bannir · − · + »');
    await page.evaluate(() => document.querySelector('[data-famille-ligne="tropical"] [data-visee="plus"]').click());
    await dormir(400);
    verifier(await presence('[data-famille-ligne="tropical"] [data-visee-marque]'), 'le losange de la visée n’est pas posé sur la piste');
    verifier(await presence('[data-role="pont-objectif-tropical"][data-visee-posee]'), 'la puce de la visée posée est absente');
    verifier(await presence('[data-famille-ligne="tropical"] [data-visee="retirer"]'), 'le « × » n’apparaît pas');
    await cap('app-visee');
    await page.evaluate(() => document.querySelector('[data-famille-ligne="tropical"] [data-visee="retirer"]').click());
    await dormir(300);
    verifier(!(await presence('[data-famille-ligne="tropical"] [data-visee-marque]')), 'le « × » ne retire pas la visée');
    await page.evaluate(() => document.querySelector('[data-famille-ligne="tropical"] [data-visee="bannir"]').click());
    await dormir(300);
    verifier(await presence('[data-famille-ligne="tropical"][data-bannie]'), '« bannir » ne barre pas la famille');
    await cap('app-bannir');
    await page.evaluate(() => document.querySelector('[data-famille-ligne="tropical"] [data-visee="retirer"]').click());
    // 4. Absolu : les classes en tête.
    await page.evaluate(() => document.querySelector('[data-ecran="biere"] [data-e="absolu"]').click());
    await dormir(300);
    verifier(await presence('[data-role="tete-absolu"]'), 'l’absolu n’écrit pas « faible · moyen · marqué » en tête');
    await cap('app-absolu');
    await page.evaluate(() => document.querySelector('[data-ecran="biere"] [data-e="style"]').click());
    // 5. Radar : le grand radar et la grille de dégustation ; le décompte et la légende se replient.
    await page.evaluate(() => document.querySelector('[data-ecran="biere"] [data-vue="radar"]').click());
    await dormir(500);
    verifier(await presence('[data-role="degustation"]'), 'la grille de dégustation est absente au radar');
    verifier(!(await presence('[data-element~="biere-decompte"]')), 'le décompte ne se replie pas au radar');
    verifier(await presence('svg[data-radar="base"]'), 'le radar n’est pas dessiné');
    await cap('app-radar');
    await page.evaluate(() => document.querySelector('[data-ecran="biere"] [data-vue="barres"]').click());
    await dormir(300);
    // 6. L'onglet Suggestions ouvre sa couche par-dessus ; « Ma bière » y ramène.
    await page.evaluate(() => document.querySelector('[data-onglet="suggerer"]').click());
    await page.waitForSelector('[data-ecran="suggerer"]', { timeout: 30000 }).catch(() => {});
    verifier(await presence('[data-ecran="suggerer"]'), 'l’onglet Suggestions n’ouvre pas Suggérer');
    const pile = await page.evaluate(() => window.__hopPile?.pile().map((r) => r.view).join(' > '));
    verifier(/hopBeer > hopSuggest$/.test(pile ?? ''), `pile attendue hopBeer > hopSuggest, lue : ${pile}`);
    await page.evaluate(() => [...document.querySelectorAll('[data-onglet="biere"]')].at(-1).click());
    await dormir(600);
    verifier(await presence('[data-ecran="biere"]') && !(await presence('[data-ecran="suggerer"]')), '« Ma bière » (onglet de Suggérer) ne ramène pas à Ma bière');
    // 7. La croix ferme la couche : retour à l'étape Houblons.
    await page.evaluate(() => [...document.querySelectorAll('[data-role="retour"]')].find((e) => e.getClientRects().length)?.click());
    await dormir(600);
    verifier(!(await presence('[data-ecran="biere"]')) && await presence('[data-hop-v4-etape="houblons"]'), 'la croix ne ramène pas à l’étape Houblons');
  } else {
    await page.screenshot({ path: path.join(sortie, 'app-echec.png') });
  }
  const graves = journal.erreurs.filter((e) => !/Firestore|permission/i.test(e));
  verifier(graves.length === 0, `erreurs de page : ${graves.join(' ; ')}`);
} finally {
  await browser.close();
}
if (echecs.length) { console.log('MA-BIERE-APP ECHEC'); for (const e of echecs) console.log(`  - ${e}`); process.exit(1); }
console.log(`MA-BIERE-APP OK (blocs, gestes et captures dans ${sortie})`);
