// Voie c3c (#180), reprise c3g : fiches Yakima Valley Hops (yakimavalleyhops.com, boutique Shopify), relues depuis le cache avec --offline.
// Les pages publient leurs analyses sous cinq formes (relevées sur 133 pages, voir voies/c3g-capture/rapport.md) :
//   1. tableau « Analytical Data » : une ligne de libellé, puis une ligne de valeur (« Cohumulone (% of AA) » / « 22.0 - 24.0 ») ;
//   2. « BREWING VALUES » ou « Typical Analytical Range » : « Alpha: 3.5-5.0% », « Alpha Acid: » puis la valeur à la ligne ;
//   3. libellé et valeur sur une ligne (« Alpha Acids* 14.5 - 15.5 % », « Myrcene Oil 39%-42% », « Farnesene < 1 % of total oil ») ;
//   4. libellé seul puis « 39% of total oil » (Dolcita) ;
//   5. le texte du « Hop Profile » : « alpha (8-11%) », « myrcene oil content (68-70%) », « 45–55% of total oils ».
// Seules les valeurs sont gardées ; le texte reste dans le cache. Les lots (« Lot Information and Analysis ») sont gardés à part.
import { fileURLToPath } from 'node:url';
import { champ, decoder, ecrire, ecrireJournal, fiche, lignes, lire, listeDe, releveDe, robots } from './c3c-commun.mjs';

const ORIGINE = 'https://yakimavalleyhops.com';
export const SOURCE = { id: 'yakimavalleyhops', nom: 'Yakima Valley Hops', hote: 'yakimavalleyhops.com', type: 'boutique en ligne (États-Unis)', conditions: 'robots.txt Shopify : /products/ permis ; /cart, /checkout, /account, /admin interdits ; aucune licence lue' };

const COMPOSES = [['Alpha', /alpha(?:[- ]acids?)?/], ['Beta', /beta(?:[- ]acids?)?/], ['Cohumulone', /co-?humulone/], ['Total Oil', /total oil(?: content)?/], ['Myrcene', /myrcene/], ['Humulene', /humulene/],
  ['Caryophyllene', /caryophyllene/], ['Farnesene', /farnesene/], ['Linalool', /linalool/], ['Geraniol', /geraniol/], ['Selinene', /selinene/], ['Beta-pinene', /(?:beta|β)-pinene/]];
const PLAGE = String.raw`(\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?\s*(?:%|mL\/100\s?g|ml\/100\s?g)?)`;
const EST_HUILE = /pinene|myrcene|humulene|caryophyllene|farnesene|linalool|geraniol|selinene/i;

/** Valeurs citées dans le texte d'un profil : « alpha (8-11%) », « myrcene oil content (68-70%) », « humulene … roughly 45–55% of total oils ». Rend { cle: valeur }. */
export function valeursDuProfil(texte) {
  const champs = {};
  for (const [libelle, re] of COMPOSES) {
    const m = new RegExp(`\\b${re.source}[^.();]{0,40}\\(\\s*${PLAGE}\\s*\\)`, 'i').exec(texte) ?? new RegExp(`\\b${re.source}\\s*[:of]{0,3}\\s*${PLAGE}`, 'i').exec(texte)
      ?? (libelle === 'Alpha' ? new RegExp(`${PLAGE}\\s*alpha(?:[- ]acids?)?\\b`, 'i').exec(texte) : null)   // « (12-16% alpha acids) » : la plage précède le mot
      ?? (EST_HUILE.test(libelle) ? new RegExp(`\\b${re.source}\\b[^.%\\d]{0,60}?${PLAGE}\\s*of (?:the |total )*oils?\\b`, 'i').exec(texte) : null);
    if (!m) continue;
    const brut = m[1].trim();
    const unite = /%|mL|ml/i.test(brut) ? brut : /oil/i.test(libelle) ? brut + ' mL/100g' : brut + '%';
    const c = champ(EST_HUILE.test(libelle) ? `${libelle} (% of total oil)` : libelle, unite);
    c.valeur.brut = m[0].slice(0, 120);
    if (!(c.cle in champs)) champs[c.cle] = c.valeur;
  }
  return champs;
}

/* ---------- Formes 1 à 4 : libellés et valeurs en lignes ---------- */
const LIBELLES = String.raw`alpha\s*\/\s*beta ratio|aa%|alpha(?:[- ]acids?)?%?|beta(?:[- ]acids?)?%?|c[uo]-?h[uo]mulone|colupulone|total oils?|oil content|myrcene(?: oil)?|humulene(?: oil)?|caryophyllene(?: oil)?|farnesene(?: oil)?|linalool(?: oil)?|geraniol(?: oil)?|selinene(?: oil)?|(?:beta|β|b)-pinene|total polyphenols|polyphenols?|xanthohumol|hsi|hop storage index`;
const UNITE_NUE = String.raw`ml\s*\/\s*100\s?g`;   // « Total Oils mL/100g: 1-3 » : l'unité suit le libellé
const LIGNE_LIBELLE = new RegExp(String.raw`^(${LIBELLES})\s*\*?\s*(\([^)]*\)|${UNITE_NUE})?\s*\*?\s*[:=]?\s*(.*)$`, 'i');
const NB = String.raw`\d+(?:[.,]\d+)?`;
const VALEUR = new RegExp(String.raw`^((?:[<>≤≥~]\s*|up to\s+|max\.?\s*|approx\.?\s*)?${NB}\s*%?(?:\s*(?:-|–|to)\s*${NB}\s*%?)?\s*(?:ml\s*\/\s*100\s?g)?\s*%?)\s*\*?(\s+of\s+[a-z ]{1,25})?$`, 'i');

/** Une ligne de libellé (+ ligne suivante) → { libelle, valeur, suite } ou null. `suite` : nombre de lignes lues. */
export function paireDeLignes(l, i) {
  const m = LIGNE_LIBELLE.exec(l[i]);
  if (!m || l[i].length > 90) return null;
  const mot = m[1].trim().toLowerCase();
  let reste = (m[3] ?? '').trim(), suite = 1;
  if (!reste) { if (i + 1 >= l.length) return null; reste = l[i + 1].trim(); suite = 2; }
  const v = VALEUR.exec(reste);
  if (!v) return null;
  // Le « of total oil » reste hors du libellé de clé : « Myrcene of total oil » serait lu comme l'huile totale (cleChamp).
  const libelle = `${m[1].trim()}${m[2] ? ' ' + m[2] : ''}`, suffixe = v[2] ? v[2].trim() : null;
  return { mot, libelle, suffixe, valeur: v[1].trim(), brutLigne: reste, suite };
}

const BASE_ALPHA = /\b(?:of\s+(?:the\s+)?(?:alpha(?:\s+acids?)?|aa)|%\s*of\s*aa)\b/i;
/** Valeurs d'une suite de lignes de la zone produit. La première valeur d'un champ garde la place. */
export function valeursDesLignes(brutes) {
  const champs = {};
  // « Alpha » / « Acids* 3 - 5 % » : un libellé coupé sur deux lignes est recollé.
  const l = [];
  for (let k = 0; k < brutes.length; k++) {
    if (/^(alpha|beta)$/i.test(brutes[k]) && /^acids?\b/i.test(brutes[k + 1] ?? '')) l.push(`${brutes[k]} ${brutes[++k]}`); else l.push(brutes[k]);
  }
  for (let i = 0; i < l.length; i++) {
    const p = paireDeLignes(l, i);
    if (!p) continue;
    if (/ratio/.test(p.mot)) {   // un rapport sans unité : ne pas le confondre avec l'α (cleChamp lirait « alpha »)
      const { baseImplicite, ...v } = champ(p.libelle, p.valeur).valeur;
      champs.rapportAlphaBeta ??= { ...v, champ: p.libelle, unite: null, brut: p.valeur };
      i += p.suite - 1; continue;
    }
    const brut = /^up to/i.test(p.valeur) ? p.valeur.replace(/^up to\s+/i, '≤ ') : p.valeur;
    // « 3% to 5.5% » et « 7.0%-10.0% » : le % du milieu empêche lireValeur de voir la plage ; le texte brut reste intact.
    const c = champ(p.libelle.replace(/^cuhomulone/i, 'Cohumulone'), brut.replace(/%\s*(?=(?:-|–|to)\s*\d)/gi, ''));   // « Cuhomulone » : faute de la page Enigma
    c.valeur.champ = p.libelle;
    if (c.valeur.valeur === 0) { c.valeur.valeur = null; c.valeur.zeroPublie = true; }   // « 0 % » publié seul : ni un zéro de calcul ni une absence démontrée
    if (c.valeur.unite == null && /%/.test(p.libelle + p.valeur)) c.valeur.unite = '%';
    if (c.cle === 'cohumulone' && BASE_ALPHA.test(`${p.libelle} ${p.suffixe ?? ''}`)) { c.valeur.base = '% des α'; delete c.valeur.baseImplicite; }
    else if (p.suffixe && /oil/i.test(p.suffixe) && c.cle !== 'huileTotale') { c.valeur.base = "% de l'huile"; delete c.valeur.baseImplicite; }
    if (p.suffixe) c.valeur.champ = `${c.valeur.champ} ${p.suffixe}`;
    if (c.valeur.unite == null && c.valeur.base && /^%/.test(c.valeur.base)) c.valeur.unite = '%';
    c.valeur.brut = p.valeur;
    if (!(c.cle in champs)) champs[c.cle] = c.valeur;
    i += p.suite - 1;
  }
  return champs;
}

/** Zone de la fiche produit : de « Add to cart » aux avis et au pied de page. */
export function zoneProduit(l) {
  const d = l.findIndex(x => /^add to cart$/i.test(x));
  const debut = d < 0 ? 0 : d + 1;
  const f = l.findIndex((x, k) => k > debut && /^(payment & security|your cart)/i.test(x));
  return l.slice(debut, f < 0 ? l.length : f);
}

/** Tableau « Lot Information and Analysis » : { lot, alpha, huileTotale } par lot, valeurs seulement (le PDF de lot n'est pas lu). */
export function lotsDeLignes(l) {
  const i = l.findIndex(x => /lot information and analysis$/i.test(x));
  if (i < 0 || !/^lot$/i.test(l[i + 1] ?? '')) return [];
  let j = i + 1; const entetes = [];
  while (j < l.length && entetes.length < 8) { entetes.push(l[j]); j++; if (/pdf$/i.test(entetes.at(-1)) && entetes.length > 1) break; }
  const n = entetes.length, annee = /^(\d{4})\b/.exec(l[i])?.[1] ?? null;
  const lots = [];
  for (; j + n <= l.length; j += n) {
    const ligne = l.slice(j, j + n);
    if (!/^[A-Z0-9][A-Za-z0-9-]{2,}$/.test(ligne[0])) break;
    const lot = { lot: ligne[0], annee };
    entetes.forEach((e, k) => {
      if (/^alpha|^aa/i.test(e)) lot.alpha = { ...champ('Alpha Acid (lot)', ligne[k]).valeur };
      else if (/total oil/i.test(e)) lot.huileTotale = { ...champ('Total Oils (lot)', ligne[k]).valeur };
    });
    lots.push(lot);
  }
  return lots;
}

/** Page produit de houblon : null si elle ne porte ni « Hop Profile » ni valeur d'analyse. */
export function lireProduitYvh(html) {
  const l = lignes(html);
  const i = l.findIndex(x => /hop (?:pellet )?profile$/i.test(x));
  const zoneP = zoneProduit(l);
  const parLignes = valeursDesLignes(zoneP);
  if (i < 0 && !Object.keys(parLignes).length) return null;
  const debut = i < 0 ? 0 : i;
  const fin = l.findIndex((x, k) => k > debut && (/^(updated|available|payment|your cart)/i.test(x) || /is available in multiple formats/i.test(x)));
  const profil = i < 0 ? [] : l.slice(i + 1, fin < 0 ? i + 12 : fin);
  // Sans titre « Hop Profile », le texte courant de la fiche (avant les avis) porte les valeurs citées : « (12-16% alpha acids) ».
  const avis = zoneP.findIndex(x => /^(see what brewers|what brewers|beers brewed with|examples of beers)/i.test(x));
  const texte = (i < 0 ? zoneP.slice(0, avis < 0 ? zoneP.length : avis) : profil).join(' ');
  const aromes = zoneP.map(x => /^aroma(?:\/flavor)?:\s*(.+)$/i.exec(x)?.[1] ?? /^top descriptors for [^:]*:\s*(.+)$/i.exec(x)?.[1]).find(Boolean);
  const finMaj = l.findIndex((x, k) => k > debut && /^updated/i.test(x));
  const zone = i < 0 ? [] : l.slice(i + 1, finMaj < 0 ? i + 40 : finMaj);
  const j = zone.findIndex(x => x.length > 40 && /similar (?:characteristics|flavor)/i.test(x));
  const subst = j < 0 ? null : zone.slice(j, j + 6).join(' ').replace(/ ,/g, ',');
  const apresAs = subst ? /(?:as|like)[ ]+(.+?)(?:,?[ ]+making|,?[ ]+which|[.]|$)/i.exec(subst)?.[1] : null;
  const maj = l.slice(debut).find(x => /^updated\s/i.test(x));
  const etiquette = nom => zoneP.map((x, k) => (new RegExp(`^${nom}\\s*:\\s*(.+)$`, 'i').exec(x)?.[1])).find(Boolean);
  const ancetres = zoneP.findIndex(x => /^ancestry$/i.test(x));
  const origine = etiquette('origin');
  return {
    entete: i < 0 ? null : l[i].replace(/\s*hop (?:pellet )?profile$/i, '').replace(/[®™]/g, '').trim(),
    champs: { ...valeursDuProfil(texte), ...parLignes },
    aromes: aromes ? listeDe(aromes) : [], substituts: apresAs ? listeDe(apresAs.replace(/[®™]/g, '')) : [], maj: maj ? maj.replace(/^updated\s*/i, '') : null,
    lignee: ancetres >= 0 ? listeDe(zoneP[ancetres + 1] ?? '') : [], usage: etiquette('typical usage') ? listeDe(etiquette('typical usage')) : [],
    styles: etiquette('beer styles') ? listeDe(etiquette('beer styles')) : [], origine: origine ? [origine.trim()] : [], lots: lotsDeLignes(l),
  };
}

const EXCLUS = /(t-shirt|hat|hoodie|sweatshirt|extract|yeast|bags?|cups?|rhizomes|companion|closeout|kit|blend|sale|steeping|hash|antifoam|lupo|isohop|redihop|tetrahop|hexahop|spectrum|flex|incognito|hophaze|kettle-redi|sticker|tote|banadana|backpack|puree|prysma|pha-|aromahop|conditioning|gift|copy-of|malt|dme|clamp|airlock|caps|cleaner)/i;

async function principal() {
  const rb = await robots(ORIGINE);
  const index = await lire(`${ORIGINE}/sitemap.xml`);
  const sousPlan = decoder([...index.content.matchAll(/<loc>([^<]*sitemap_products[^<]*)<\/loc>/g)][0]?.[1] ?? '');
  const plan = sousPlan ? await lire(sousPlan) : null;
  const urls = plan ? [...plan.content.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x => decoder(x[1])).filter(u => /\/products\//.test(u) && /(hops?|pellets?)(-|$)|pellet-hops|^.*\/(hbc|hpa|experimental)/i.test(u) && !EXCLUS.test(u.split('/').pop())) : [];
  const fiches = [], hors = [];
  for (const url of urls) {
    if (!rb(new URL(url).pathname)) continue;
    const r = await lire(url); if (!r) continue;
    const p = lireProduitYvh(r.content);
    if (!p) { hors.push(url); continue; }
    const slug = url.split('/').pop().replace(/-?(hop|pellet|pellets|hops)(-|$)/g, ' ').replace(/-/g, ' ').trim();
    const nom = slug.replace(/\b[a-z]/g, c => c.toUpperCase());
    fiches.push(fiche({ nom, alias: p.entete ? [p.entete] : [], url, releve: releveDe(r), publie: null, champs: p.champs,
      listes: { aromes: p.aromes, substituts: p.substituts, miseAJour: p.maj ? [p.maj] : [], lignee: p.lignee, usage: p.usage, styles: p.styles, origine: p.origine },
      extra: { page: 'produit', ...(p.lots.length ? { lots: p.lots } : {}) } }));
  }
  ecrire(SOURCE, fiches);
  ecrireJournal('yakimavalleyhops', [ORIGINE]);
  console.log(`Candidats ${urls.length} ; sans « Hop Profile » ni valeur d'analyse : ${hors.length}`);
  if (hors.length) console.log(hors.map(u => '  ' + u.split('/').pop()).join('\n'));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await principal();
