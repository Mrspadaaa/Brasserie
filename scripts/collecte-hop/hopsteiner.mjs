// Lecteur des fiches Hopsteiner (www.hopsteiner.de) depuis le cache des pages publiques.
//   node scripts/collecte-hop/hopsteiner.mjs --offline   -> src/data/hopSources/hopsteiner.json (aucun réseau)
// Le téléchargement poli (robots.txt, 1 requête/s, arrêt sur 401/403/429) est dans hopsteiner-collecte.mjs.
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readHopSource } from '../hop-source-cache.mjs';

export const HOTE = 'www.hopsteiner.de';
export const LISTE = `https://${HOTE}/en/products/all-hop-varieties`;
export const urlListe = page => (page <= 1 ? LISTE : `${LISTE}?tx_solr%5Bpage%5D=${page}`);
export const urlFiche = slug => `${LISTE}/detail/${slug}`;
export const PAGES_ANNEXES = [
  `https://${HOTE}/en/imprint`,
  'https://hopsteiner.us/variety-data-sheets/',
  'https://hopsteiner.us/news/type/technical-publications/',
  'https://hopsteiner.us/news/type/guidelines/',
];
const EXTERNE = 'C:/Users/mrspa/Documents/Brasserie/.codex-remote-attachments/hop-index/public-sources';
export const cachePath = () =>
  resolve(process.env.HOP_SOURCE_CACHE || (existsSync(EXTERNE) ? EXTERNE : '.codex-remote-attachments/hop-index/public-sources'));

export const liensFiches = html =>
  [...new Set([...html.matchAll(/href="\/en\/products\/all-hop-varieties\/detail\/([a-z0-9_-]+)"/gi)].map(m => m[1]))];

const ENTITES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decoder = s =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
    return ENTITES[e.toLowerCase()] ?? m;
  });
const texte = s => decoder(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const normaliser = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

/** Étiquette du site -> champ normalisé, unité, base. L'étiquette écrite reste dans `champ`. */
function decrireEtiquette(label) {
  const l = label.toLowerCase();
  const huile = 'de l’huile totale';
  if (/^alpha acids/.test(l)) return { cle: 'alpha', unite: '%' };
  if (/^beta acids/.test(l)) return { cle: 'beta', unite: '%' };
  if (/^co-?humulone/.test(l)) return { cle: 'cohumulone', unite: '%', base: 'relatif aux α (% rel.)' };
  if (/^colupulone/.test(l)) return { cle: 'colupulone', unite: '%', base: 'relatif aux β (% rel.)' };
  if (/^total oil/.test(l)) return { cle: 'huile_totale', unite: 'mL/100 g' };
  const compose = /^([a-zé-]+)\s+%\s+rel\.\s+of\s+total\s+oil/.exec(l);
  if (compose) {
    const nom = { farnesene: 'farnesene', linalool: 'linalol', geraniol: 'geraniol', myrcene: 'myrcene', humulene: 'humulene',
      caryophyllene: 'caryophyllene', 'beta-pinene': 'beta_pinene', selinene: 'selinene' }[compose[1]] ?? compose[1].replace(/-/g, '_');
    return { cle: nom, unite: '%', base: `% rel. ${huile}` };
  }
  if (/^xanthohumol/.test(l)) return { cle: 'xanthohumol', unite: '%' };
  if (/^total polyphenols/.test(l)) return { cle: 'polyphenols_totaux', unite: '%' };
  if (/^thiol impact/.test(l)) return { cle: 'thiol_impact', unite: null };
  if (/^yield/.test(l)) return { cle: 'rendement', unite: 'kg/ha' };
  if (/^acreage/.test(l)) return { cle: 'surface', unite: 'ha' };
  if (/^maturity/.test(l)) return { cle: 'maturite', unite: null };
  if (/^main growing country/.test(l)) return { cle: 'pays_principal', unite: null };
  if (/^downy mildew/.test(l)) return { cle: 'mildiou', unite: null };
  if (/^powdery mildew/.test(l)) return { cle: 'oidium', unite: null };
  if (/^wilt disease/.test(l)) return { cle: 'verticilliose', unite: null };
  if (/^aphid/.test(l)) return { cle: 'pucerons', unite: null };
  return { cle: label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''), unite: null };
}

const nombre = s => (s !== '' && Number.isFinite(Number(s)) ? Number(s) : null);

/** Texte d'une cellule -> { brut, valeur, min, max }. « - », vide, « Unknown », « 0 - 0 » : tout à null. */
export function lireValeur(brut) {
  const b = brut.trim();
  const nul = { brut: b, valeur: null, min: null, max: null, qualificatif: null };
  if (!b || /^(-+|n\/?a|unknown|inconnu)$/i.test(b)) return nul;
  const plage = /^(\d+(?:[.,]\d+)?)\s*(?:-|–|to)\s*(\d+(?:[.,]\d+)?)$/.exec(b);
  if (plage) {
    const min = nombre(plage[1].replace(',', '.')), max = nombre(plage[2].replace(',', '.'));
    if (min === 0 && max === 0) return nul;
    return { brut: b, valeur: null, min, max, qualificatif: null };
  }
  const seul = /^(\d+(?:[.,]\d+)?)$/.exec(b);
  if (seul) return { brut: b, valeur: nombre(seul[1].replace(',', '.')), min: null, max: null, qualificatif: null };
  // « < 0.1 » : borne haute seule ; « ca. 5 » : valeur approchée. Le qualificatif est gardé.
  const borne = /^<\s*(\d+(?:[.,]\d+)?)$/.exec(b);
  if (borne) return { brut: b, valeur: null, min: null, max: nombre(borne[1].replace(',', '.')), qualificatif: '<' };
  const approx = /^(?:ca\.?|~)\s*(\d+(?:[.,]\d+)?)$/i.exec(b);
  if (approx) return { brut: b, valeur: nombre(approx[1].replace(',', '.')), min: null, max: null, qualificatif: 'ca.' };
  return { brut: b, valeur: b, min: null, max: null, qualificatif: null };
}

/** Lit une fiche de détail (HTML) : champs, listes, date publiée. Pur : pas de réseau, pas d'horloge. */
export function lireFiche(html) {
  const h = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  const main = h.slice(Math.max(h.indexOf('<main'), 0), h.indexOf('</main>') > 0 ? h.indexOf('</main>') : undefined);
  const nom = (/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(main) || [])[1];
  const champs = {};
  const listes = {};
  const ajouter = (cle, entree) => { if (!(cle in champs)) champs[cle] = entree; };

  // Étiquettes de goût de l'en-tête.
  listes.etiquettes = [...main.matchAll(/c-hop-variety-header__tag[^"]*">([\s\S]*?)<\/div>/g)].map(m => texte(m[1])).filter(Boolean);

  // Origine génétique : phrase courte de l'en-tête (lignée), plus l'année de première mise sur le marché.
  const origine = /Genetic origin<\/span>\s*:\s*([\s\S]*?)<\/p>/.exec(main);
  listes.lignee = origine ? [texte(origine[1])] : [];
  const annee = origine && /released in (\d{4})/i.exec(texte(origine[1]));
  if (annee) ajouter('premiere_mise_sur_le_marche', { champ: 'Genetic origin (…first released in)', section: 'En-tête', brut: annee[0], valeur: Number(annee[1]), min: null, max: null, qualificatif: null, unite: 'année', base: null });

  // Évaluation aromatique 0-5 (odeur du houblon brut). Une note 0 publiée est une note ; un graphique absent reste absent.
  const chart = /<pim-chart[^>]*\staste="([^"]*)"/.exec(main);
  if (chart) {
    let notes = null;
    try { notes = JSON.parse(decoder(chart[1])); } catch { /* graphique illisible : aucune note */ }
    // Huit notes à 0 alors que l'en-tête annonce un goût : variété non évaluée (Phoenix, Santiam), pas huit zéros. Brut gardé, valeur null.
    const nonEvalue = notes && Object.keys(notes).length > 0 && Object.values(notes).every(v => Number(v) === 0);
    if (notes) for (const [k, v] of Object.entries(notes)) {
      ajouter(`arome_${k === 'miscellaneous' ? 'divers' : k}`, {
        champ: `Aroma evaluation : ${k}`, section: 'Aroma evaluation', brut: String(v),
        valeur: nonEvalue || !Number.isFinite(Number(v)) ? null : Number(v), min: null, max: null, qualificatif: null,
        unite: 'note 0-5', base: 'odeur du houblon brut',
        ...(nonEvalue ? { remarque: 'graphique publié entièrement à 0 : lu comme non évalué' } : {}),
      });
    }
  }

  // Descripteurs : mots courts séparés par des virgules.
  const desc = /Aroma description\s*<\/h2>\s*<p>([\s\S]*?)<\/p>/.exec(main);
  listes.descripteurs = desc ? texte(desc[1]).split(/\s*[,;]\s*/).map(s => s.trim()).filter(Boolean) : [];

  // Tous les tableaux <dl> : section = dernier h3 vu.
  const tokens = [...main.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>|<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g)];
  let section = '';
  for (const m of tokens) {
    if (m[1] !== undefined) { section = texte(m[1]); continue; }
    const label = texte(m[2]);
    const desc = decrireEtiquette(label);
    const lu = lireValeur(texte(m[3]));
    ajouter(desc.cle, { champ: label, section, ...lu, unite: desc.unite, base: desc.base ?? null });
  }

  // Variétés alternatives par usage (liens vers d'autres fiches, ou texte sans lien comme « Bitter hops »).
  const alt = main.indexOf('Alternative varieties');
  const substituts = {};
  if (alt >= 0) {
    const bloc = main.slice(alt, main.indexOf('Last updated') > alt ? main.indexOf('Last updated') : undefined);
    const parts = [...bloc.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>\s*<div class="hstack[^>]*>([\s\S]*?)<\/div>/g)];
    for (const p of parts) {
      const usage = texte(p[1]);
      substituts[usage] = [...p[2].matchAll(/<a [^>]*href="[^"]*\/detail\/([a-z0-9_-]+)"[^>]*>([\s\S]*?)<\/a>|<span>([\s\S]*?)<\/span>/g)]
        .map(a => (a[1] ? { nom: texte(a[2]), code: a[1] } : { nom: texte(a[3]), code: null }));
    }
  }
  listes.substituts = substituts;

  const maj = /Last updated:\s*(\d{2})\/(\d{2})\/(\d{4})/.exec(texte(main).replace(/\s+/g, ' '));
  return {
    nom: nom ? texte(nom) : null,
    publie: maj ? { brut: maj[0].replace('Last updated:', '').trim(), date: `${maj[3]}-${maj[2]}-${maj[1]}` } : null,
    champs,
    listes,
  };
}

/** Rattachement au catalogue : lien Hopsteiner exact, sinon nom ou alias unique ; jamais forcé. */
export function rattacher(code, nom, catalogue) {
  const exact = catalogue.filter(v => (v.hs?.reference || '').endsWith(`/detail/${code}`) || v.hopsteinerId === `hopsteiner-${code}`);
  if (exact.length === 1) return { varietyId: exact[0].id, methode: 'reference-hopsteiner', candidats: [] };
  if (exact.length > 1) return { varietyId: null, methode: 'ambigu', candidats: exact.map(v => v.id) };
  const cle = normaliser(nom);
  const parNom = catalogue.filter(v => normaliser(v.name) === cle);
  if (parNom.length === 1) return { varietyId: parNom[0].id, methode: 'nom', candidats: [] };
  if (parNom.length > 1) return { varietyId: null, methode: 'ambigu', candidats: parNom.map(v => v.id) };
  const parAlias = catalogue.filter(v => (v.aliases || []).some(a => normaliser(a) === cle));
  if (parAlias.length === 1) return { varietyId: parAlias[0].id, methode: 'alias', candidats: [] };
  if (parAlias.length > 1) return { varietyId: null, methode: 'ambigu', candidats: parAlias.map(v => v.id) };
  // Code international (3 lettres) retrouvé dans les alias du catalogue.
  const parCode = catalogue.filter(v => (v.aliases || []).some(a => normaliser(a) === normaliser(code)));
  if (parCode.length === 1) return { varietyId: parCode[0].id, methode: 'code', candidats: [] };
  if (parCode.length > 1) return { varietyId: null, methode: 'ambigu', candidats: parCode.map(v => v.id) };
  return { varietyId: null, methode: null, candidats: [] };
}

/** Construit le JSON complet depuis le cache (hors ligne : jamais de réseau). */
export async function construire({ cache = cachePath(), catalogue } = {}) {
  const lire = url => readHopSource(url, { cache, offline: true });
  const codes = new Set();
  const pages = [];
  for (let p = 1; p <= 40; p++) {
    let r;
    try { r = await lire(urlListe(p)); } catch { break; }
    pages.push({ url: r.url, releve: r.retrievedAt.slice(0, 10), sha256: r.sha256 });
    const l = liensFiches(r.content);
    if (!l.length) break;
    l.forEach(c => codes.add(c));
  }
  const fiches = [];
  const releves = [];
  for (const code of [...codes].sort()) {
    const r = await lire(urlFiche(code));
    releves.push(r.retrievedAt);
    const f = lireFiche(r.content);
    const rat = rattacher(code, f.nom || code, catalogue);
    const alias = [...new Set([code.toUpperCase(), ...((catalogue.find(v => v.id === rat.varietyId)?.aliases) || []).filter(a => normaliser(a) === normaliser(code))])];
    fiches.push({
      nom: f.nom, code, alias, varietyId: rat.varietyId, rattachement: { methode: rat.methode, candidats: rat.candidats },
      url: r.url, releve: r.retrievedAt.slice(0, 10), publie: f.publie, sha256: r.sha256,
      champs: f.champs, listes: f.listes,
    });
  }
  const annexes = [];
  for (const url of PAGES_ANNEXES) {
    try { const r = await lire(url); annexes.push({ url, releve: r.retrievedAt.slice(0, 10), sha256: r.sha256 }); } catch { /* non relevée */ }
  }
  releves.sort();
  return {
    source: {
      nom: 'Hopsteiner — Simon H. Steiner, Hopfen, GmbH (fiches variétales)',
      hote: HOTE,
      type: 'producteur / négociant de houblon (Mainburg, Allemagne)',
      licence: 'Aucune licence ouverte. Mentions légales (/en/imprint, § 3) : contenus soumis au droit d’auteur allemand ; copies et téléchargements « only for personal, private and non-commercial use » ; stockage dans des bases de données sans accord écrit non permis. Collecte faite avec l’accord du brasseur (26.10) : à trancher avant toute publication.',
      robots: 'robots.txt lu : Disallow /typo3/ et /typo3_src/ seulement ; pages de liste et de fiches permises.',
      releve: releves.length ? { du: releves[0].slice(0, 10), au: releves.at(-1).slice(0, 10) } : null,
      pagesListe: pages,
      pagesAnnexes: annexes,
      nombreFiches: fiches.length,
    },
    fiches,
  };
}

async function principal() {
  const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const proto = JSON.parse(await readFile(resolve(racine, 'src/data/hopV4/proto-data.json'), 'utf8'));
  // Ce script ne télécharge jamais : le cache fait foi (voir hopsteiner-collecte.mjs).
  const json = await construire({ catalogue: proto.varieties });
  const sortie = resolve(racine, 'src/data/hopSources/hopsteiner.json');
  const contenu = JSON.stringify(json, null, 1) + '\n';
  await mkdir(dirname(sortie), { recursive: true });
  await writeFile(sortie, contenu);
  console.log(`${json.fiches.length} fiches -> ${sortie}`);
  console.log('sha256', createHash('sha256').update(contenu).digest('hex'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await principal();
