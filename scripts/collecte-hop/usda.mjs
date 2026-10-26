// Collecte c3d — USDA ARS (Corvallis, collection mondiale de cultivars de houblon) : fiches d'accession www.ars.usda.gov/ARSUserFiles/2450/hopcultivars/<n>.html.
// Il n'existe pas de page d'index publique lisible (le plan du site relève de /umbraco/, interdit par robots.txt) : on part de Cascade (21092)
// et on suit les liens d'accession que les fiches se citent entre elles (lignée, origine), 300 pages au plus.
// Des valeurs, noms et listes seulement : les paragraphes (« OTHER INFORMATION », « MAJOR TRAITS ») restent dans le cache.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { lecteurPoli, lireValeur, champVide, norm, json, rattacher } from './communautaire-commun.mjs';
const require = createRequire(new URL('../../functions/package.json', import.meta.url));
const { load } = require('cheerio');

export const HOTE = 'www.ars.usda.gov';
export const BASE = `https://${HOTE}/ARSUserFiles/2450/hopcultivars/`;
export const GRAINES = [21092];
export const PLAFOND = 300;

const nombre = s => Number(String(s).replace(/,/g, ''));
/** Les paragraphes « ÉTIQUETTE: valeur » d'une fiche ; une ligne sans étiquette prolonge la précédente. */
export function paragraphesUsda(html) {
  const $ = load(html);
  const lignes = [];
  $('p').each((_, p) => {
    const t = norm($(p).text());
    if (!t) return;
    const m = t.match(/^([A-Z][A-Z0-9 /.&'-]*?):\s*(.*)$/);
    if (m && m[1].length <= 40) lignes.push({ etiquette: norm(m[1]), texte: m[2], liens: [] });
    else if (lignes.length) lignes[lignes.length - 1].texte += ` ${t}`;
    const dernier = lignes[lignes.length - 1];
    if (dernier) $(p).find('a[href]').each((_, a) => dernier.liens.push($(a).attr('href')));
  });
  return { titre: norm($('title').first().text()), lignes };
}

const CLES = { 'ALPHA ACIDS': 'alpha', 'BETA ACIDS': 'beta', COHUMULONE: 'cohumulone', OIL: 'huileTotale', 'STORAGE STABILITY': 'conservation', YIELD: 'rendement', MATURITY: 'maturite', VIGOR: 'vigueur', 'SIDEARM LENGTH': 'longueurBranches', 'LEAF COLOR': 'couleurFeuille', SEX: 'sexe', DISEASES: 'maladies' };

/** Une valeur « 6.3% (7-year range 5.1-8.9%) » : la moyenne publiée et la plage sur n ans. */
export function lireMoyennePlage(texte) {
  const m = norm(texte).match(/^(\d+(?:\.\d+)?)\s*%\s*\((\d+)-year range\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*%\)$/i);
  if (!m) return null;
  return { brut: norm(texte), valeur: Number(m[1]), min: Number(m[3]), max: Number(m[4]), unite: '%', base: null, moyenne: Number(m[1]), anneesPlage: Number(m[2]) };
}

/** Les valeurs citées dans « MAJOR TRAITS » : farnésène et humulène en %, rapport H/C. Le texte lui-même n'est pas gardé. */
export function valeursTraits(texte) {
  const t = norm(texte), out = {};
  let m = t.match(/farnesene\s*\((?:about\s*)?(\d+(?:\.\d+)?)\s*%\)/i); if (m) out.farnesene = { etiquette: 'MAJOR TRAITS', brut: m[0], valeur: Number(m[1]), min: Number(m[1]), max: Number(m[1]), unite: '%', base: null, approx: /about/i.test(m[0]) };
  m = t.match(/(\d+(?:\.\d+)?)\s*%\s*humulene/i); if (m) out.humulene = { etiquette: 'MAJOR TRAITS', brut: m[0], valeur: Number(m[1]), min: Number(m[1]), max: Number(m[1]), unite: '%', base: null };
  m = t.match(/H\/C ratio\s*[-–:]?\s*(\d+(?:\.\d+)?)/i); if (m) out.rapportHC = { etiquette: 'MAJOR TRAITS', brut: m[0], valeur: Number(m[1]), min: null, max: null, unite: null, base: null };
  return out;
}

/** Lit une fiche d'accession. Rend { fiche, voisins } ou null. */
export function lireFicheUsda(html, url, { index } = {}) {
  const { titre, lignes } = paragraphesUsda(html);
  const get = e => lignes.find(l => l.etiquette === e);
  const cultivar = get('CULTIVAR'), acc = get('USDA ACCESSION NO.');
  if (!cultivar && !acc) return null;
  const champs = {}, listes = {};
  for (const l of lignes) {
    const cle = CLES[l.etiquette];
    if (!cle) continue;
    let v;
    if (cle === 'alpha' || cle === 'beta') v = lireMoyennePlage(l.texte) ?? lireValeur(l.texte);
    else if (cle === 'cohumulone') v = { ...lireValeur(l.texte), base: '% des α' };
    else if (cle === 'huileTotale') v = lireValeur(l.texte);
    else if (cle === 'rendement') { const r = l.texte.match(/(\d[\d,]*)\s*-\s*(\d[\d,]*)\s*(lbs?\/acre|kg\/ha(?:ctare)?)/i); v = r ? { brut: norm(l.texte), valeur: null, min: nombre(r[1]), max: nombre(r[2]), unite: r[3].toLowerCase(), base: null } : champVide(norm(l.texte)); }
    else if (cle === 'conservation') { const r = l.texte.match(/retained\s*(\d+(?:\.\d+)?)\s*%.*?after\s*(\d+)\s*months?/i); v = r ? { brut: norm(l.texte), valeur: Number(r[1]), min: Number(r[1]), max: Number(r[1]), unite: '% des α restants', base: null, moisStockage: Number(r[2]) } : champVide(norm(l.texte)); }
    else v = champVide(norm(l.texte));
    champs[cle] = { etiquette: l.etiquette, ...v };
  }
  const traits = get('MAJOR TRAITS');
  if (traits) Object.assign(champs, valeursTraits(traits.texte));
  const autres = ['SELECTION', 'GENUS', 'SPECIES', 'PRIMARY SITE', 'METHOD RECEIVED', 'AVAILABILITY', 'DATE RECEIVED'];
  for (const e of autres) { const l = get(e); if (l) champs[`autre_${e.toLowerCase().replace(/[^a-z]+/g, '_')}`] = { etiquette: e, ...champVide(norm(l.texte)) }; }
  const ped = get('PEDIGREE'), ori = get('ORIGIN'), ref = lignes.find(l => l.etiquette === 'REFERENCES');
  listes.lignee = ped ? [norm(ped.texte)] : null;
  listes.origine = ori ? [norm(ori.texte)] : null;
  listes.references = ref ? norm(ref.texte).split(/(?<=\d{4}\.)\s+(?=[A-Z])/).map(norm).filter(Boolean) : null;
  const nom = cultivar ? norm(cultivar.texte) : null;
  const rat = nom ? rattacher(nom, [], index) : { varietyId: null };
  const voisins = [...new Set(lignes.flatMap(l => l.liens).map(h => (h.match(/^(\d+)\.html$/) ?? [])[1]).filter(Boolean))].map(Number);
  const autre = lignes.find(l => l.etiquette === 'OTHER INFORMATION');
  return {
    fiche: {
      nom, alias: [], varietyId: rat.varietyId, ...(rat.ambigu ? { rattachementAmbigu: rat.ambigu } : {}), ...(rat.douteux ? { rattachementDouteux: rat.douteux } : {}), accession: acc ? norm(acc.texte) : null, titre,
      url, publie: null, champs, listes, proseNonCopiee: { autresInformations: autre ? norm(autre.texte).split(' ').length : 0, traitsPrincipaux: traits ? norm(traits.texte).split(' ').length : 0 },
    },
    voisins,
  };
}

export async function main() {
  const { catalogue } = await import('./communautaire-commun.mjs');
  const index = catalogue().index;
  const journal = [], lecteur = lecteurPoli(HOTE, { journal });
  const vues = new Set(), file = [...GRAINES], fiches = [], absentes = [], sansFiche = [];
  let dernier = '';
  while (file.length && vues.size < PLAFOND) {
    const n = file.shift();
    if (vues.has(n)) continue;
    vues.add(n);
    const url = `${BASE}${n}.html`;
    const r = await lecteur.page(url);
    if (r.arrete) break;
    if (r.absent) { absentes.push({ url, statut: r.statut }); continue; }
    const lu = lireFicheUsda(r.content, url, { index });
    if (!lu) { sansFiche.push(url); continue; }
    if (r.retrievedAt > dernier) dernier = r.retrievedAt;
    fiches.push({ ...lu.fiche, releve: r.retrievedAt, sha256: r.sha256 });
    for (const v of lu.voisins) if (!vues.has(v)) file.push(v);
  }
  const sortie = {
    source: { nom: 'USDA ARS, collection mondiale de cultivars de houblon (Corvallis)', hote: HOTE, type: 'institut public (États-Unis)',
      conditions: 'Disponibilité écrite sur les fiches : « commercial cultivar, no restrictions » pour Cascade ; aucune licence de réutilisation affirmée sur le site', robots: 'Disallow /bin/ /config/ /css/ /Jquery/ /views/ /scripts/ /umbraco/ … ; pas de Crawl-delay',
      parcours: 'fiches suivies de lien en lien depuis Cascade (21092) ; pas d’index public', releve: dernier, pagesLues: fiches.length, pagesAbsentes: absentes.length, arret: lecteur.etat.arrete },
    fiches: fiches.sort((a, b) => String(a.accession).localeCompare(String(b.accession), 'en', { numeric: true })),
  };
  return { sortie, absentes, sansFiche, journal, etat: lecteur.etat };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { sortie, absentes, sansFiche, etat } = await main(), texte = json(sortie);
  const cible = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/data/hopSources/usda.json');
  await mkdir(dirname(cible), { recursive: true }); await writeFile(cible, texte);
  console.log(`usda : ${sortie.fiches.length} fiches, ${absentes.length} absentes, ${sansFiche.length} sans fiche ; requêtes ${etat.requetes}, cache ${etat.depuisCache} ; sha256 ${createHash('sha256').update(texte).digest('hex')}`);
  if (etat.arrete) console.error(`ARRET hôte ${HOTE} : ${etat.arrete}`);
}
