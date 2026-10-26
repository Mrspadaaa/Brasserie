// Collecte c3d — Hopslist (www.hopslist.com), une fiche par variété. Des valeurs et des listes seulement : aucune prose du site.
// Sans option : lit le cache et télécharge poliment ce qui manque. `--offline` : cache seul, même JSON à chaque lancement.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { lecteurPoli, lireValeur, champVide, liste, norm, json, rattacher, catalogue } from './communautaire-commun.mjs';
const require = createRequire(new URL('../../functions/package.json', import.meta.url));
const { load } = require('cheerio');

export const HOTE = 'www.hopslist.com';
export const SITEMAP = `https://${HOTE}/post-sitemap.xml`;

/** Étiquette de la page → clé du champ, et la base que l'étiquette elle-même écrit (« Oil Composition » : % de l'huile). */
const HUILE = '% de l’huile';
const CHAMPS = [
  [/^alpha acid( composition)?$/i, 'alpha', {}],
  [/^beta acid( composition)?$/i, 'beta', {}],
  [/^co-?humulone( composition)?$/i, 'cohumulone', { base: '% des α' }],
  [/^colupulone$/i, 'colupulone', {}],
  [/^total oils?( composition)?$/i, 'huileTotale', {}],
  [/^myrcene oil( composition)?$/i, 'myrcene', { base: HUILE }],
  [/^humulene oil( composition)?$/i, 'humulene', { base: HUILE }],
  [/^caryophyllene oil( composition)?$/i, 'caryophyllene', { base: HUILE }],
  [/^farnesene oil( composition)?$/i, 'farnesene', { base: HUILE }],
  [/^myrcene$/i, 'myrcene', {}], [/^humulene$/i, 'humulene', {}], [/^caryophyllene$/i, 'caryophyllene', {}], [/^farnesene$/i, 'farnesene', {}],
  [/^linalool( oil( composition)?)?$/i, 'linalol', {}], [/^geraniol( oil( composition)?)?$/i, 'geraniol', {}],
  [/^(β|beta)?-?\s*pinene( oil( composition)?)?$/i, 'betaPinene', {}], [/^selinene( oil( composition)?)?$/i, 'selinene', {}],
  [/^2-undecanone$/i, 'undecanone2', {}],
  [/^xanthohumol( \(x\))?$/i, 'xanthohumol', {}], [/^total polyphenols$/i, 'polyphenols', {}],
  [/^hop storage index( \(hsi\))?$/i, 'hsi', {}],
  [/^yield amount$/i, 'rendement', {}],
  [/^storability$/i, 'conservation', {}],
  [/^seasonal maturity$/i, 'maturite', {}],
  [/^growth rate$/i, 'vigueur', {}],
  [/^cone size$/i, 'tailleCone', {}],
  [/^cone density$/i, 'densiteCone', {}],
  [/^(ease|east) of harvest$/i, 'faciliteRecolte', {}], [/^harvest difficulty$/i, 'faciliteRecolte', {}],
  [/^resistant to$/i, 'resistances', {}],
  [/^susceptible to$/i, 'sensibilites', {}],
  [/^proprietary$/i, 'proprietaire', {}],
];
const LISTES = { 'also known as': 'alias', substitutes: 'substituts', 'style guide': 'styles', country: 'origine', purpose: 'usage' };
const slug = s => norm(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const nombre = s => Number(String(s).replace(/,/g, ''));
/** « 1775-1950 kg/hectare (1585-1740 lbs/acre) » : la valeur en kg/ha est lue, l'équivalent en lbs/acre reste dans le brut. */
export function lireRendement(texte) {
  const brut = norm(texte), m = brut.match(/^(\d[\d,]*(?:\.\d+)?)\s*(?:-\s*(\d[\d,]*(?:\.\d+)?))?\s*kg\/\s*[hg]ectare/i);
  if (!m) return champVide(brut || null);
  const min = nombre(m[1]), max = m[2] === undefined ? min : nombre(m[2]);
  return { brut, valeur: m[2] === undefined ? min : null, min, max, unite: 'kg/ha', base: null };
}
/** « Retains 50%-55% alpha acid after 6 months storage at 20ºC (68ºF) » : α restants (%), durée et température écrites. */
export function lireConservation(texte) {
  const brut = norm(texte), m = brut.match(/^Retains\s*(\d+(?:\.\d+)?)\s*%?\s*(?:-\s*(\d+(?:\.\d+)?)\s*%)?\s*alpha acid.*?after\s*(\d+)\s*months?.*?at\s*(\d+)\s*(?:º|°|degrees?)?\s*C/i);
  if (!m) return champVide(brut || null);
  const min = Number(m[1]), max = m[2] === undefined ? min : Number(m[2]);
  return { brut, valeur: m[2] === undefined ? min : null, min, max, unite: '% des α restants', base: null, moisStockage: Number(m[3]), temperatureC: Number(m[4]) };
}

/** Lit une page de fiche Hopslist. Rend { nom, marque, categorie, champs, listes } ou null si ce n'est pas une fiche. */
export function lireFicheHopslist(html, url) {
  const $ = load(html);
  const titre = norm($('h1.entry-title').first().text() || $('h1').first().text());
  if (!titre) return null;
  const table = $('table').toArray().find(t => $(t).find('td').first().text().trim() === 'Also Known As') ?? $('table').toArray().find(t => /Alpha Acid Composition/i.test($(t).text()));
  if (!table) return null;
  const champs = {}, listes = {}, inconnus = [];
  $(table).find('tr').each((_, tr) => {
    const tds = $(tr).find('td').toArray();
    if (tds.length < 2) return;
    const etiquette = norm($(tds[0]).text()), cellule = $(tds[1]);
    const texte = norm(cellule.text());
    if (!etiquette) return;
    const cleListe = LISTES[etiquette.toLowerCase()];
    if (cleListe) {
      if (!texte) { listes[cleListe] = null; return; }
      listes[cleListe] = cleListe === 'substituts'
        ? cellule.find('a').length ? cellule.find('a').toArray().map(a => ({ nom: norm($(a).text()), url: $(a).attr('href') ?? null })).filter(x => x.nom) : liste(texte).map(nom => ({ nom, url: null }))
        : liste(texte);
      return;
    }
    if (/^characteristics$/i.test(etiquette)) return;
    if (/^lineage$/i.test(etiquette)) { listes.lignee = texte ? [texte] : null; return; }
    const reg = CHAMPS.find(([re]) => re.test(etiquette));
    if (reg) {
      const cle = reg[1];
      // Une même clé écrite deux fois (« Myrcene Oil Composition » vide puis « Myrcene ») : la valeur non vide l'emporte.
      if (champs[cle]?.brut && !texte) return;
      champs[cle] = { etiquette, ...(cle === 'rendement' ? lireRendement(texte) : cle === 'conservation' ? lireConservation(texte) : ['maturite', 'vigueur', 'tailleCone', 'densiteCone', 'faciliteRecolte', 'resistances', 'sensibilites', 'proprietaire'].includes(cle) ? champVide(texte || null) : lireValeur(texte, reg[2])) };
      return;
    }
    inconnus.push(etiquette);
    champs[`autre_${slug(etiquette)}`] = { etiquette, ...(texte ? lireValeur(texte) : champVide()) };
  });
  const categorie = (new URL(url).pathname.match(/\/hops\/([^/]+)-hops\//) ?? [])[1] ?? null;
  return { nom: titre.replace(/[®™©]/g, '').trim(), marque: /[®™]/.test(titre), categorie, champs, listes, inconnus };
}

export function urlsDuSitemap(xml) {
  return [...new Set([...String(xml).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m => m[1].replace(/^http:\/\//, 'https://')).filter(u => /\/hops\/[^/]+-hops\/[^/]+\/?$/.test(u)))].sort();
}

export async function main() {
  const journal = [], lecteur = lecteurPoli(HOTE, { journal });
  const plan = await lecteur.page(SITEMAP);
  if (plan.arrete || plan.absent) throw Error(`Plan du site Hopslist inaccessible : ${plan.arrete ?? plan.statut}`);
  const urls = urlsDuSitemap(plan.content), index = catalogue().index;
  const fiches = [], absentes = [], illisibles = [];
  let dernier = plan.retrievedAt;
  for (const url of urls) {
    const r = await lecteur.page(url);
    if (r.arrete) break;
    if (r.absent) { absentes.push({ url, statut: r.statut }); continue; }
    const f = lireFicheHopslist(r.content, url);
    if (!f) { illisibles.push(url); continue; }
    if (r.retrievedAt > dernier) dernier = r.retrievedAt;
    const rat = rattacher(f.nom, f.listes.alias ?? [], index);
    fiches.push({ nom: f.nom, alias: f.listes.alias ?? [], varietyId: rat.varietyId, ...(rat.rattachement ? { rattachement: rat.rattachement } : {}), ...(rat.ambigu ? { rattachementAmbigu: rat.ambigu } : {}), ...(rat.douteux ? { rattachementDouteux: rat.douteux } : {}), url, releve: r.retrievedAt, publie: null, sha256: r.sha256,
      marque: f.marque, categorie: f.categorie, champs: f.champs, listes: { substituts: f.listes.substituts ?? null, styles: f.listes.styles ?? null, origine: f.listes.origine ?? null, usage: f.listes.usage ?? null, lignee: f.listes.lignee ?? null }, ...(f.inconnus.length ? { champsNonReconnus: f.inconnus } : {}) });
  }
  if (lecteur.etat.arrete) console.error(`ARRET hôte ${HOTE} : ${lecteur.etat.arrete}`);
  const sortie = { source: { nom: 'Hopslist', hote: HOTE, type: 'agrégateur de fiches variété', conditions: '© Julian Healey, All Rights Reserved : valeurs, noms et listes seulement, aucune prose recopiée', robots: 'User-agent * : Disallow /wp-admin/ seulement', releve: dernier, pagesLues: fiches.length, pagesAbsentes: absentes.length, pagesIllisibles: illisibles.length, arret: lecteur.etat.arrete },
    fiches: fiches.sort((a, b) => a.url.localeCompare(b.url)) };
  return { sortie, absentes, illisibles, journal, etat: lecteur.etat };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { sortie, absentes, illisibles, etat } = await main();
  const texte = json(sortie);
  const cible = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/data/hopSources/hopslist.json');
  await mkdir(dirname(cible), { recursive: true }); await writeFile(cible, texte);
  console.log(`hopslist : ${sortie.fiches.length} fiches, ${absentes.length} absentes, ${illisibles.length} illisibles ; requêtes ${etat.requetes}, cache ${etat.depuisCache} ; sha256 ${createHash('sha256').update(texte).digest('hex')}`);
}
