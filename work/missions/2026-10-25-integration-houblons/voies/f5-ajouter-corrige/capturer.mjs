// Voie f5-ajouter-corrige (D107) : la liste « Ajouter — houblon… » de l'étape Houblons, en 390 × 844, sur l'IPA 21A (la capture du brasseur, D179).
// Banc local `?dev-local&etape=houblons` (comme c7). La recette de la fixture (Stout 16D) est remplacée EN MÉMOIRE, à la volée, par la 21A de f3
// (24 L, OG 1,065, Nugget 20 g à 60′) : on intercepte le module `apercuDev` ; aucun fichier n'est écrit, aucune donnée réelle.
// Usage (racine) : node scripts/with_server.mjs --server "npm run dev -- --port 5281 --strictPort" --port 5281 --env VITE_HOP_V4=on -- node <ce fichier> --etiquette=apres [--sortie=<dossier>]
// `avant` : même commande lancée depuis une copie de l'arbre dont quickAdd.ts est celui de HEAD (voir RESULTAT.md), sur un autre port.
// Imprime CAPTURE OK, la liste lue dans le DOM (nom, g, minutes, IBU) et le chemin de l'image.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const etiquette = arg('etiquette') ?? 'essai';
const sortie = path.resolve(arg('sortie') ?? path.join(import.meta.dirname, 'img'));
fs.mkdirSync(sortie, { recursive: true });
const port = (process.env.WITH_SERVER_PORTS ?? '5281').split(',')[0];
const LOCAL = /^(https?|ws)s?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i;
const REMPLACEMENTS = [['style: "16D"', 'style: "21A"'], ['volumeL: 20', 'volumeL: 24'], ['ogTarget: 1.066', 'ogTarget: 1.065'], ['weightG: 46', 'weightG: 20'], ['name: "Stout export"', 'name: "IPA du jeudi"'], ['colorEbc: 70', 'colorEbc: 10']];

const { browser, page } = await ouvrir({ largeur: 390, hauteur: 844, externe: 'laisser' });
const echecs = [];
let patche = 0;
try {
  await page.setRequestInterception(true);
  page.on('request', async (r) => {
    const u = r.url();
    if (/^(data|blob|about|file):/i.test(u)) return r.continue();
    if (!LOCAL.test(u)) return r.abort('blockedbyclient');
    if (/\/apercuDev\.ts(\?|$)/.test(u)) {
      let texte = await (await fetch(u)).text();
      for (const [de, vers] of REMPLACEMENTS) if (texte.includes(de)) { texte = texte.split(de).join(vers); patche++; }
      return r.respond({ status: 200, contentType: 'text/javascript; charset=utf-8', body: texte });
    }
    return r.continue();
  });
  await page.goto(`http://localhost:${port}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-hop-v4-etape="houblons"]', { timeout: 120000 });
  await page.waitForSelector('[data-role="ajouts-proposes"]', { timeout: 60000 });
  await page.waitForFunction(() => performance.getEntriesByType('resource').some((r) => /catalogue-ajouts/.test(r.name)), { timeout: 30000 }).catch(() => {});
  // Le stock des fixtures (les articles de f3 : Citra cryo 65 g, Galaxy 60 g, Nelson Sauvin 100 g…), écrit dans le cache local du banc, comme c7 : aucune donnée réelle.
  const ARTICLES = [['Houblon Cryo Hops Citra 24.8%', 65], ['Houblon Galaxy 17.2%', 60], ['Houblon Nelson Sauvin 9.6%', 100], ['Cascade', 60], ['Houblon Motueka 8.1%', 20], ['Houblon Idaho 7 12.7%', 20],
    ['Houblon Sabro 13.4%', 30], ['Houblon Hallertauer Blanc 9.5% CH', 30], ['Houblon Target 11.3%', 5]];
  const ecrit = await page.evaluate(async (articles) => {
    const { StorageService } = await import('/src/services/storage.ts');
    const s = StorageService.getStocks();
    const neufs = articles.map(([name, g], i) => ({ id: `f5-${i}`, ref: `f5-${i}`, name, category: 'Houblon', currentStock: g, unit: 'g', minStock: 0, cost: 0, supplier: 'banc f5' }));
    StorageService.saveStocks({ ...s, rawMaterials: [...s.rawMaterials.filter((x) => !String(x.id).startsWith('f5-')), ...neufs] });
    return StorageService.getStocks().rawMaterials.filter((x) => String(x.id).startsWith('f5-')).length;
  }, ARTICLES).catch((e) => `erreur : ${e.message}`);
  if (ecrit !== ARTICLES.length) echecs.push(`le stock du banc n'a pas été posé (${ecrit})`);
  await page.waitForSelector('[data-houblon-ajout="beermaverick-citra:cryo"], [data-houblon-ajout="beermaverick-galaxy"]', { timeout: 20000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500)); // les propositions se recalculent à l'arrivée des 505 variétés
  if (patche < REMPLACEMENTS.length) echecs.push(`la recette n'est pas la 21A : ${patche}/${REMPLACEMENTS.length} remplacements faits`);
  await page.evaluate(() => document.querySelector('[data-role="ajouts-proposes"]')?.scrollIntoView({ block: 'center' }));
  await new Promise((r) => setTimeout(r, 400));
  const lignes = await page.evaluate(() => [...document.querySelectorAll('[data-role="ajout-rapide"]')].map((e) => ({ cle: e.getAttribute('data-houblon-ajout'), texte: e.textContent.replace(/\s+/g, ' ').trim(), plus: e.querySelector('[data-role="ajout-rapide-plus"]')?.getAttribute('aria-label') ?? null })));
  const style = await page.evaluate(() => document.body.innerText.match(/American IPA|Foreign Extra Stout|21A|16D/)?.[0] ?? null);
  console.log('style lu dans la page :', style);
  for (const l of lignes) console.log(' -', l.plus);
  if (lignes.length === 0) echecs.push('aucune ligne proposée');
  const fichier = path.join(sortie, `ajouter-21A-${etiquette}.png`);
  await page.screenshot({ path: fichier });
  fs.writeFileSync(path.join(sortie, `ajouter-21A-${etiquette}.json`), JSON.stringify({ etiquette, style, lignes }, null, 1));
  console.log('image :', fichier);
} catch (e) {
  echecs.push(`exception : ${e.message}`);
} finally {
  await browser.close();
}
if (echecs.length) { console.log('CAPTURE ECHEC'); for (const e of echecs) console.log(' -', e); process.exit(1); }
console.log('CAPTURE OK');
