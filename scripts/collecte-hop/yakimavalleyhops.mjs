// Voie c3c (#180) : fiches Yakima Valley Hops (yakimavalleyhops.com, boutique Shopify), relues depuis le cache avec --offline.
// Chaque page de houblon porte un « Hop Profile » en texte : les plages (α, huile, myrcène…) y sont citées entre parenthèses.
// Seules les valeurs sont gardées ; le texte reste dans le cache.
import { fileURLToPath } from 'node:url';
import { champ, decoder, ecrire, ecrireJournal, fiche, lignes, lire, listeDe, releveDe, robots } from './c3c-commun.mjs';

const ORIGINE = 'https://yakimavalleyhops.com';
export const SOURCE = { id: 'yakimavalleyhops', nom: 'Yakima Valley Hops', hote: 'yakimavalleyhops.com', type: 'boutique en ligne (États-Unis)', conditions: 'robots.txt Shopify : /products/ permis ; /cart, /checkout, /account, /admin interdits ; aucune licence lue' };

const COMPOSES = [['Alpha', /alpha(?:[- ]acids?)?/], ['Beta', /beta(?:[- ]acids?)?/], ['Cohumulone', /co-?humulone/], ['Total Oil', /total oil(?: content)?/], ['Myrcene', /myrcene/], ['Humulene', /humulene/],
  ['Caryophyllene', /caryophyllene/], ['Farnesene', /farnesene/], ['Linalool', /linalool/], ['Geraniol', /geraniol/], ['Selinene', /selinene/], ['Beta-pinene', /(?:beta|β)-pinene/]];
const PLAGE = String.raw`(\d+(?:\.\d+)?(?:\s*[-–]\s*\d+(?:\.\d+)?)?\s*(?:%|mL\/100\s?g|ml\/100\s?g)?)`;

/** Valeurs citées dans le texte d'un profil : « alpha (8-11%) », « myrcene oil content (68-70%) ». Rend { cle: valeur }. */
export function valeursDuProfil(texte) {
  const champs = {};
  for (const [libelle, re] of COMPOSES) {
    const m = new RegExp(`\\b${re.source}[^.();]{0,40}\\(\\s*${PLAGE}\\s*\\)`, 'i').exec(texte) ?? new RegExp(`\\b${re.source}\\s*[:of]{0,3}\\s*${PLAGE}`, 'i').exec(texte);
    if (!m) continue;
    const brut = m[1].trim();
    const unite = /%|mL|ml/i.test(brut) ? brut : /oil/i.test(libelle) ? brut + ' mL/100g' : brut + '%';
    const c = champ(/pinene|myrcene|humulene|caryophyllene|farnesene|linalool|geraniol|selinene/i.test(libelle) ? `${libelle} (% of total oil)` : libelle, unite);
    c.valeur.brut = m[0].slice(0, 120);
    if (!(c.cle in champs)) champs[c.cle] = c.valeur;
  }
  return champs;
}

/** Page produit de houblon : null si elle n'a pas de « Hop Profile ». */
export function lireProduitYvh(html) {
  const l = lignes(html);
  const i = l.findIndex(x => /hop profile$/i.test(x));
  if (i < 0) return null;
  const fin = l.findIndex((x, k) => k > i && (/^(updated|available|payment|your cart)/i.test(x) || /is available in multiple formats/i.test(x)));
  const profil = l.slice(i + 1, fin < 0 ? i + 12 : fin);
  const texte = profil.join(' ');
  const aromes = profil.map(x => /^aroma:\s*(.+)$/i.exec(x)?.[1]).find(Boolean);
  const finMaj = l.findIndex((x, k) => k > i && /^updated/i.test(x));
  const zone = l.slice(i + 1, finMaj < 0 ? i + 40 : finMaj);
  const j = zone.findIndex(x => x.length > 40 && /similar (?:characteristics|flavor)/i.test(x));
  const subst = j < 0 ? null : zone.slice(j, j + 6).join(' ').replace(/ ,/g, ',');
  const apresAs = subst ? /(?:as|like)[ ]+(.+?)(?:,?[ ]+making|,?[ ]+which|[.]|$)/i.exec(subst)?.[1] : null;
  const maj = l.slice(i + 1).find(x => /^updated\s/i.test(x));
  return {
    entete: l[i].replace(/\s*hop profile$/i, '').replace(/[®™]/g, '').trim(), champs: valeursDuProfil(texte),
    aromes: aromes ? listeDe(aromes) : [], substituts: apresAs ? listeDe(apresAs.replace(/[®™]/g, '')) : [], maj: maj ? maj.replace(/^updated\s*/i, '') : null,
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
    fiches.push(fiche({ nom, alias: p.entete ? [p.entete] : [], url, releve: releveDe(r), publie: null, champs: p.champs, listes: { aromes: p.aromes, substituts: p.substituts, miseAJour: p.maj ? [p.maj] : [] }, extra: { page: 'produit' } }));
  }
  ecrire(SOURCE, fiches);
  ecrireJournal('yakimavalleyhops', [ORIGINE]);
  console.log(`Candidats ${urls.length} ; sans « Hop Profile » : ${hors.length}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await principal();
