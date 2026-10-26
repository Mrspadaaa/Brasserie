// Collecte John I. Haas (johnihaas.com) : fiches PDF « Download Specs » et pages « Learn More » — voie c3b-europe, #180.
// Relance tout depuis le cache avec --offline ; sans l'option, télécharge poliment (robots.txt : Crawl-delay 10 s).
// Les PDF sont lus avec pdftotext (outil système, déjà présent) : aucun paquet installé.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { lire, lirePdf, texteDuPdfBrut } from './europe-commun.mjs';
import { ecrireSortie, nettoyer, poserChamp, rattacher } from './europe-champs.mjs';

const HOTE = 'https://www.johnihaas.com';
const LISTE = `${HOTE}/products/hops/`;
const SITEMAP = `${HOTE}/page-sitemap.xml`;
const SOURCE = {
  nom: 'John I. Haas',
  hote: 'www.johnihaas.com',
  type: 'négociant (US, groupe BarthHaas) — fiches PDF et pages variété publiques',
  conditions: 'robots.txt : Crawl-delay 10 s respecté, Disallow /wp-admin/ seul. Conditions d’utilisation du site (page « terms-and-conditions-of-website-usage ») lues : « You may not reproduce, modify, distribute, create derivative works of, or publicly display any part of the Site without Haas’s prior written consent » ; licence d’usage personnel ou interne. Collecte privée, hors de l’app, sur accord du brasseur (26.10) ; toute publication ou reprise dans l’app demande d’abord l’accord écrit de Haas.',
  methodes: 'Fiches « MiniSpecSheets » : α, β, cohumulone, huile totale (mL/100 g), composés en % de l’huile ; HPA : fourchettes α/β/cohumulone/huile et composition de l’huile en % de l’huile (7 composés). Valeurs en fourchette sauf mention.',
};

const txt = e => nettoyer(e?.textContent ?? '');

// ───────────────────────── PDF ─────────────────────────

const NOMS = '(?:humul[eè]ne\\s*/\\s*caryophyll[eè]ne|alpha[- ]?acids?|alpha|beta[- ]?acids?|beta|cohum(?:ulone)?|hsi|colupulone|total oil|myrcene|humul[eè]ne|caryophyll[eè]ne|farn[eé]s[eè]ne|farnesen|linalool|geraniol|selinene|(?:beta-|β-)?pinene|citronellol|nerol|total polyphenols|polyphenols|xanthohumol|monoterp[eè]nes?|sesquiterp[eè]nes?|(?:humul[eè]ne|humulene)\\s*/\\s*caryophyll[eè]ne)';
const NB = '\\d+(?:[.,]\\d+)?';
const VAL = `(?:(?:≤|<|up to|max\\.?)\\s*)?${NB}(?:\\s*(?:-|–|to)\\s*${NB})?`;
const UNITE = '(?:\\s*(?:%|ml\\s*/\\s*100\\s?g|µg/kg|mg/kg))?';
const LIGNE = new RegExp(`\\b(${NOMS}(?:\\s*\\([^)]*\\))?\\*?)\\s*[:=]?\\s*(${VAL})(${UNITE})`, 'gi');
const SEUL = new RegExp(`^(${NOMS}(?:\\s*\\([^)]*\\))?\\*?)$`, 'i');
const JETON = new RegExp(`(?:(?:≤|<|up to)\\s*)?${NB}(?:\\s*[-–]\\s*${NB})?`, 'gi');

/** Analyse le texte (pdftotext -raw) d’une fiche PDF. Fonction pure (testée sur un texte synthétique). */
export function analyserPdfTexte(texte) {
  const lignes = texte.split(/\r?\n/).map(l => nettoyer(l)).filter(Boolean);
  const champs = {};
  // A. « Libellé (unité) valeur » sur une ligne, plusieurs paires possibles (« Alpha 17.4 – 19.1% Beta 7.2 – 7.9% »).
  for (const l of lignes) {
    if (l.split(' ').length > 14) continue; // prose
    for (const m of l.matchAll(LIGNE)) poserChamp(champs, m[1], (m[2] + (m[3] || '')).trim());
  }
  // B. Bloc de libellés seuls suivi d’une ligne de valeurs, dans le même ordre (fiches HPA).
  for (let i = 0; i < lignes.length; i++) {
    if (!SEUL.test(lignes[i])) continue;
    let j = i; const lib = [];
    while (j < lignes.length && SEUL.test(lignes[j])) lib.push(lignes[j++]);
    const jetons = [];
    while (j < lignes.length && jetons.length < lib.length) {
      const ln = lignes[j].replace(/ml\/100\s?g|µg\/kg|mg\/kg/gi, '');
      const reste = ln.replace(JETON, '').replace(/[%\s]/g, '');
      const trouves = [...ln.matchAll(JETON)].map(m => m[0]);
      if (!trouves.length || reste) break;
      jetons.push(...trouves); j++;
    }
    // Fiches HPA (Ella, Enigma…) : la ligne de valeurs précède le bloc de libellés.
    if (jetons.length !== lib.length && i > 0) {
      const av = lignes[i - 1], t = [...av.matchAll(JETON)].map(m => m[0]);
      if (t.length === lib.length && !av.replace(JETON, '').replace(/ml\/100\s?g|[%\s]/gi, '')) jetons.splice(0, jetons.length, ...t);
    }
    // Fiches HPA : « Myrcene » peut venir après les valeurs (6 valeurs pour 5 libellés) ; il est alors le premier.
    if (jetons.length === lib.length + 1 && lignes.slice(j, j + 4).some(x => /^myrcene$/i.test(x)) && !lib.some(x => /^myrcene/i.test(x))) lib.unshift('Myrcene');
    if (jetons.length === lib.length) lib.forEach((l, k) => { if (![...Object.values(champs)].some(c => c.nom === l && c.brut === jetons[k])) poserChamp(champs, l, jetons[k], { appariement: 'ordre du flux PDF (libellés et valeurs en blocs séparés)' }); });
    i = Math.max(i, j - 1);
  }
  // Listes : descripteurs, styles, pays, année de sortie.
  const listes = { descripteurs: [], styles: [], pays: [], sortie: [] };
  const iPays = lignes.slice(0, 8).findIndex(l => /^(?:UNITED STATES|USA|GERMANY|FRANCE|AUSTRALIA|NEW ZEALAND|CZECH REPUBLIC|ENGLAND|UNITED KINGDOM|SLOVENIA|POLAND|JAPAN|BELGIUM|SPAIN)$/.test(l));
  if (iPays >= 0) {
    listes.pays.push(lignes[iPays]);
    const suivante = lignes[iPays + 1] || '';
    if (/,/.test(suivante) && suivante.length <= 120 && suivante.split(',').length <= 8 && suivante.split(',').every(x => x.trim().split(/s+/).length <= 4)) listes.descripteurs = suivante.replace(/\.$/, '').split(/,|\band\b/).map(nettoyer).filter(Boolean);
  }
  const aq = lignes.find(l => /^AROMA QUALITIES\b/i.test(l));
  if (aq) listes.descripteurs = aq.replace(/^AROMA QUALITIES\s*/i, '').split(',').map(nettoyer).filter(Boolean);
  const iSt = lignes.findIndex(l => /^recommended (beer )?styles$/i.test(l));
  if (iSt >= 0 && /,/.test(lignes[iSt + 1] || '')) listes.styles = lignes[iSt + 1].split(',').map(nettoyer).filter(Boolean);
  const iBq = lignes.findIndex(l => /^BREWING QUALITIES$/i.test(l));
  if (iBq >= 0) for (let k = iBq + 1; k < lignes.length && lignes[k].startsWith('•'); k++) listes.styles.push(nettoyer(lignes[k].replace(/^•/, '')));
  for (const m of texte.matchAll(/released in\s+((?:19|20)\d{2})/gi)) if (!listes.sortie.includes(m[1])) listes.sortie.push(m[1]);
  return { champs, listes };
}

// ───────────────────────── Pages ─────────────────────────

/** Page « spotlight » (Cascade, Citra, Amarillo…) : lignes de données, caractères dominants, styles, variétés proches. */
export function analyserPage(html, JSDOM) {
  const d = new JSDOM(html).window.document;
  const titre = txt(d.querySelector('.spotlight-hero__title, main h1, h1'));
  const champs = {};
  for (const r of d.querySelectorAll('.spotlight-profile__row')) {
    const l = txt(r.querySelector('.spotlight-profile__label')), v = txt(r.querySelector('.spotlight-profile__value'));
    if (l) poserChamp(champs, l, v);
  }
  const hero = {};
  for (const s of d.querySelectorAll('.spotlight-hero__stat')) hero[txt(s.querySelector('.spotlight-hero__stat-label'))] = txt(s.querySelector('.spotlight-hero__stat-value'));
  const proches = [...d.querySelectorAll('.spotlight-pairings__card')].map(card => ({
    titre: txt(card.querySelector('.spotlight-pairings__heading')),
    noms: [...card.querySelectorAll('.spotlight-pairings__name')].map(txt),
    meta: [...card.querySelectorAll('.spotlight-pairings__meta')].map(txt),
  }));
  const parTitre = re => proches.find(p => re.test(p.titre));
  const similaires = parTitre(/similar/i);
  const accords = parTitre(/sensory pairings/i);
  const formes = [...d.querySelectorAll('.spotlight-formats__title')].map(txt);
  return {
    nomEcrit: titre,
    nom: titre.replace(/[®™]/g, '').replace(/\s+hops?$/i, '').trim(),
    estSpotlight: !!d.querySelector('.spotlight-hero'),
    nbCartes: d.querySelectorAll('.hop').length,
    origine: hero.Origin || null,
    champs,
    listes: {
      usage: txt(d.querySelector('.spotlight-hero__subtitle')) ? [txt(d.querySelector('.spotlight-hero__subtitle'))] : [],
      descripteurs: [...d.querySelectorAll('.spotlight-profile__trait-label')].map(txt),
      styles: [...d.querySelectorAll('.spotlight-pairings__styles li')].map(txt),
      accords: accords ? accords.noms : [],
      substituts: similaires ? similaires.noms.map((n, i) => ({ nom: n, aromes: similaires.meta[i] || null })) : [],
      formes,
    },
  };
}

/** Page d’atterrissage sans chiffres (Sabro, El Dorado…) : seulement une liste de styles, si elle en est une. */
export function stylesDepuisAtterrissage(texte) {
  const m = texte.match(/recommended styles\s+([^.]{5,260}?)\s+(?:Hear the latest|GET TO KNOW|READ MORE|$)/i);
  if (!m || !/,/.test(m[1])) return [];
  return m[1].split(',').map(nettoyer).filter(s => s && s.split(' ').length <= 6);
}

// ───────────────────────── Collecte ─────────────────────────

const abs = (h, base) => { try { return new URL(h, base).href.split('#')[0]; } catch { return null; } };

export async function collecter() {
  const require = createRequire(import.meta.url);
  const { JSDOM } = require('jsdom');
  const liste = await lire(LISTE, {});
  if (!liste) throw Error('Liste des houblons illisible');
  const d = new JSDOM(liste.content).window.document;
  const cartes = [];
  for (const c of d.querySelectorAll('.hop')) {
    const titreHtml = c.querySelector('.product-card__title')?.innerHTML || '';
    const [n, ...reste] = titreHtml.split(/<\/?br\s*\/?>/i).map(s => nettoyer(s.replace(/<[^>]+>/g, '')));
    const liens = [...c.querySelectorAll('a[href]')].map(a => abs(a.getAttribute('href'), LISTE)).filter(Boolean);
    cartes.push({
      nomEcrit: nettoyer(titreHtml.replace(/<[^>]+>/g, ' ')), nom: n.replace(/[®™]/g, '').trim(), code: reste.join(' ').trim() || null,
      region: c.getAttribute('data-region') || null, familles: (c.getAttribute('data-flavor') || '').split(',').map(nettoyer).filter(Boolean),
      pdf: liens.find(h => /\.pdf(\?|$)/i.test(h)) || null, page: liens.find(h => !/\.pdf(\?|$)/i.test(h) && h.startsWith(HOTE)) || null,
    });
  }
  // Mises en avant (hors grille) : PDF de fiches « SPEC-SHEET » / « Data-Sheet » avec le titre qui les précède.
  for (const a of d.querySelectorAll('a[href]')) {
    const h = abs(a.getAttribute('href'), LISTE);
    if (!h || !/\.pdf$/i.test(h) || cartes.some(c => c.pdf === h)) continue;
    if (a.closest('.hop')) continue;
    const bloc = a.closest('li, article, div');
    const t = nettoyer((bloc?.parentElement?.querySelector('h2, h3, h4, .product-card__title')?.textContent) || '');
    cartes.push({ nomEcrit: t || null, nom: (t || h.split('/').pop().replace(/\.pdf$/i, '')).replace(/[®™]/g, '').trim(), code: null, region: null, familles: [], pdf: h, page: null });
  }
  const fiches = [], nonLues = [];
  // 1. Fiches PDF
  const vus = new Set();
  for (const c of cartes) {
    if (!c.pdf || vus.has(c.pdf)) continue;
    vus.add(c.pdf);
    const e = {};
    const pdf = await lirePdf(c.pdf, e);
    if (!pdf) { nonLues.push({ url: c.pdf, raison: e.raison }); continue; }
    const t = texteDuPdfBrut(pdf.chemin);
    const a = analyserPdfTexte(t);
    const r = await rattacher(c.nom, c.code ? [c.code.replace(/\s*c\.v\.?$/i, '')] : []);
    fiches.push({
      nom: c.nom, nomEcrit: c.nomEcrit, alias: c.code ? [c.code] : [], varietyId: r.varietyId, rattachement: { via: r.via, candidats: r.candidats },
      type: 'pdf', url: c.pdf, releve: pdf.retrievedAt, publie: c.pdf.match(/\/uploads\/((?:19|20)\d{2})\//)?.[1] || null,
      region: c.region, champs: a.champs, listes: { ...a.listes, famillesSite: c.familles },
    });
  }
  // 2. Pages « Learn More » et fiches /products/hops/<x>/
  const sm = await lire(SITEMAP, {});
  const pages = new Set(cartes.map(c => c.page).filter(p => p && !/\/(australian-hops|terra-alpha-hops)\/$/.test(p)));
  if (sm) for (const m of sm.content.matchAll(/<loc>(?:<!\[CDATA\[)?(https:\/\/www\.johnihaas\.com\/products\/hops\/[^/\]<]+\/)/g)) pages.add(m[1]);
  for (const url of [...pages].sort()) {
    const e = {};
    const page = await lire(url, e);
    if (!page) { nonLues.push({ url, raison: e.raison }); continue; }
    const a = analyserPage(page.content, JSDOM);
    if (!a.estSpotlight) {
      if (a.nbCartes > 10) { nonLues.push({ url, raison: 'redirige vers la liste des houblons (pas de fiche)' }); continue; }
      const dom = new JSDOM(page.content).window.document;
      dom.querySelectorAll('script,style,noscript,svg').forEach(x => x.remove());
      const styles = stylesDepuisAtterrissage(txt(dom.querySelector('main') || dom.body));
      const carte = cartes.find(c => c.page === url);
      const nom = (carte?.nom || a.nom || '').trim();
      const r = await rattacher(nom, carte?.code ? [carte.code.replace(/\s*c\.v\.?$/i, '')] : []);
      fiches.push({ nom, nomEcrit: a.nomEcrit, alias: carte?.code ? [carte.code] : [], varietyId: r.varietyId, rattachement: { via: r.via, candidats: r.candidats }, type: 'page-atterrissage', url, releve: page.retrievedAt, publie: null, region: carte?.region || null, champs: {}, listes: { styles } });
      continue;
    }
    const r = await rattacher(a.nom);
    fiches.push({ nom: a.nom, nomEcrit: a.nomEcrit, alias: [], varietyId: r.varietyId, rattachement: { via: r.via, candidats: r.candidats }, type: 'page', url, releve: page.retrievedAt, publie: null, origine: a.origine, champs: a.champs, listes: a.listes });
  }
  nonLues.sort((x, y) => x.url.localeCompare(y.url));
  return { fiches, nonLues, nbCartes: cartes.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { fiches, nonLues, nbCartes } = await collecter();
  const sortie = await ecrireSortie('johnihaas', { ...SOURCE, nonLues }, fiches);
  console.log(JSON.stringify({ source: 'johnihaas', cartes: nbCartes, fiches: sortie.nbFiches, fichiers: sortie.fichiers, nonLues: nonLues.length, rattachees: fiches.filter(f => f.varietyId).length, sha256: sortie.sha256 }));
}
