// p6b-croix-pile : D118 sur un vrai rendu. Étape Houblons → Ma bière → Suggestions (ou Comparer) → croix : l'étape Houblons.
// Banc : la fixture `?dev-local&etape=houblons` ; aucune donnée réelle, aucun Gemini. Captures 390 × 844 dans ./captures/.
// Usage (racine) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5272 --strictPort" --port 5272 --env VITE_HOP_V4=on -- node work/missions/2026-10-25-integration-houblons/voies/p6b-croix-pile/capture-croix.mjs [--prefixe=apres]
// Imprime CROIX OK, ou CROIX ECHEC et la liste (code 1).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const prefixe = arg('prefixe') ?? 'apres';
const sortie = path.join(import.meta.dirname, 'captures');
fs.mkdirSync(sortie, { recursive: true });
const port = (process.env.WITH_SERVER_PORTS ?? '5272').split(',')[0];
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const echecs = [];
const verifier = (ok, texte) => { if (!ok) echecs.push(texte); };

const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 844 });
const pileTexte = () => page.evaluate(() => window.__hopPile?.pile().map((r) => r.view).join(' > '));
const presence = (sel) => page.evaluate((s) => !!document.querySelector(s), sel);
const croix = () => page.evaluate(() => [...document.querySelectorAll('[data-role="retour"]')].filter((e) => e.getClientRects().length).at(-1)?.click());

async function parcours(onglet, ecran) {
  await page.goto(`http://localhost:${port}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-hop-v4-etape="houblons"]', { timeout: 120000 });
  await dormir(800);
  await page.evaluate(() => window.__hopPile.open({ view: 'hopBeer' }));
  await page.waitForSelector('[data-ecran="biere"]', { timeout: 30000 });
  await dormir(500);
  await page.evaluate((o) => document.querySelector(`[data-onglet="${o}"]`).click(), onglet);
  await page.waitForSelector(`[data-ecran="${ecran}"]`, { timeout: 30000 });
  await dormir(1200);
  const avant = await pileTexte();
  verifier(/hopBeer > hop(Suggest|Compare)$/.test(avant ?? ''), `${ecran} : pile attendue …hopBeer > couche, lue : ${avant}`);
  await page.screenshot({ path: path.join(sortie, `${prefixe}-${ecran}-avant-croix-390.png`) });
  await croix();
  await dormir(1000);
  const apres = await pileTexte();
  verifier(!/hop(Beer|Suggest|Compare)/.test(apres ?? ''), `${ecran} : après la croix, la pile garde une couche : ${apres}`);
  verifier(!(await presence('[data-ecran="biere"]')) && !(await presence(`[data-ecran="${ecran}"]`)), `${ecran} : un écran d'outil reste à l'écran après la croix`);
  verifier(await presence('[data-hop-v4-etape="houblons"]'), `${ecran} : l'étape Houblons n'est pas à l'écran après la croix`);
  await page.screenshot({ path: path.join(sortie, `${prefixe}-${ecran}-apres-croix-390.png`) });
  console.log(`${ecran} : pile avant « ${avant} », après « ${apres} »`);
}

try {
  await parcours('suggerer', 'suggerer');
  await parcours('comparer', 'comparer');
  const graves = journal.erreurs.filter((e) => !/Firestore|permission/i.test(e));
  verifier(graves.length === 0, `erreurs de page : ${graves.join(' ; ')}`);
} finally {
  await browser.close();
}
if (echecs.length) { console.log('CROIX ECHEC'); for (const e of echecs) console.log(`  - ${e}`); process.exit(1); }
console.log(`CROIX OK (captures dans ${sortie})`);
