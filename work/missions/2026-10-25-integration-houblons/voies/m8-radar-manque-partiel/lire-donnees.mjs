// Voie m8-radar-manque-partiel : lit, dans l'app, le radar de Substituer pour Lotus et ses remplaçants (fixtures ?dev-local),
// et les niveaux des fiches de chaque houblon (niveau, fiches qui citent, fiches lues). Rien n'est écrit dans l'app.
// Usage (racine) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5268 --strictPort" --port 5268 --timeout 120 --env VITE_HOP_V4=on -- node work/missions/2026-10-25-integration-houblons/voies/m8-radar-manque-partiel/lire-donnees.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const ICI = import.meta.dirname;
const RACINE = path.resolve(ICI, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const base = `http://localhost:${process.env.WITH_SERVER_PORTS}`;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const { browser, page } = await ouvrir({ largeur: 390, hauteur: 844 });
await page.goto(`${base}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-ecran="ma-biere"]', { timeout: 120000 });
await dormir(800);
const champ = '[aria-label="Ajouter un houblon : stock ou catalogue"]';
await page.click(champ, { clickCount: 3 });
await page.type(champ, 'Lotus', { delay: 15 });
await page.waitForSelector('[data-role="ajout-rapide"] [data-role="ajout-rapide-plus"]', { timeout: 30000 });
const lotus = await page.$eval('[data-role="ajout-rapide"]', (e) => e.getAttribute('data-houblon-ajout'));
await page.click('[data-role="ajout-rapide"] [data-role="ajout-rapide-plus"]');
await dormir(900);
await page.evaluate((k) => window.__hopPile.open({ view: 'hopSubstitute', hopKey: k }), lotus);
await page.waitForSelector('[data-ecran="substituer"] [data-remplacant]', { timeout: 90000 });
await dormir(800);
const liste = await page.evaluate(() => [...document.querySelectorAll('[data-ecran="substituer"] [data-remplacant]')].map((x) => ({ cle: x.getAttribute('data-remplacant'), nom: x.getAttribute('data-houblon-rang') })));
const FAM = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
const fiches = await page.evaluate(async (cles, FAM) => {
  const A = await import('/src/ui/hopIndex/parcours/adaptateur.ts');
  const out = {};
  for (const c of cles) { const h = A.houblon(c); out[c] = { nom: h.nom, familles: Object.fromEntries(FAM.map((f) => [f, `${h.familles[f].niveau} ${h.familles[f].fiches}/${h.familles[f].sur}`])) }; }
  return out;
}, [lotus, ...liste.map((x) => x.cle)], FAM);
// Le radar affiché par défaut (les deux premiers remplaçants touchés, comme r2).
for (const x of liste.slice(0, 2)) { await page.evaluate((c) => document.querySelector(`[data-ecran="substituer"] [data-remplacant="${c}"]`)?.click(), x.cle); await dormir(600); }
const radar = await page.evaluate(() => {
  const s = document.querySelector('[data-ecran="substituer"] svg[data-radar="base"]');
  return { axes: s.getAttribute('data-axes'), series: [...s.querySelectorAll('g[data-serie]')].map((g) => ({ nom: g.getAttribute('data-serie'), couleur: g.getAttribute('data-couleur'), role: g.getAttribute('class'), valeurs: g.getAttribute('data-valeurs') })) };
});
const sortie = { lotus, liste, fiches, radar };
fs.writeFileSync(path.join(ICI, 'donnees-lues.json'), JSON.stringify(sortie, null, 1) + '\n');
console.log(JSON.stringify(radar));
console.log(liste.map((x) => x.nom).join(', '));
await browser.close();
