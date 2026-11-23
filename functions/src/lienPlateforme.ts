import { load } from 'cheerio/slim';

/**
 * Marches « plateforme » de la lecture d'un lien (D446, 23.11), AVANT l'IA : tout ce que la page ou sa boutique publient déjà sous une
 * forme structurée, que le HTML visible ne montre pas ou mal.
 *
 * État de l'art : une boutique en ligne expose presque toujours ses fiches deux fois, une pour l'œil (HTML), une pour sa propre
 * application (JSON). Shopify : `/products/<handle>.js` (Ajax API publique du thème) ; WooCommerce : Store API publique
 * `/wp-json/wc/store/v1/products?slug=` (sans clé) ; les frameworks (Next.js, Nuxt) sérialisent leur état dans la page
 * (`__NEXT_DATA__`, `__NUXT__`, `__INITIAL_STATE__`). Aucun de ces points d'accès ne demande de compte ni ne contourne de protection :
 * même agent, mêmes règles robots.txt que la page. Shopware 6 (clé d'accès de la vitrine) et Magento (GraphQL) ne sont pas lus ici :
 * aucun lien du banc qui les utilise n'en a besoin (mesuré), et chacun demanderait son propre client.
 * Aucune bibliothèque ne règle « quel JSON est la fiche technique » : on cherche des motifs (liste d'objets titre/valeur, liste de textes
 * « Nom : valeur »), jamais une clé propre à un site. Rien n'est inventé : chaque valeur vient de ce JSON ou de ce texte, recopiée.
 */

export interface ValeurLue { nom: string; valeur: string; unite?: string }
const NOM_MAX = 60, VAL_MAX = 100;
const compact = (t: string) => t.replace(/[\s  ]+/g, ' ').trim();
const norm = (t: string) => compact(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const coupe = (t: string, max: number) => (t.length <= max ? t : t.slice(0, max - 1).trimEnd() + '…');

const PAS_UNE_CARACT = /^(?:preis|price|prix|versand|lieferung|lieferzeit|hinweis|achtung|note|tipp|bewertung|rating|menge|anzahl|quantit|stock|lager|verf[uü]gbar|disponib|sku|ean|gtin|mpn|artikel|bestell|http)/i;

/** Une paire « Nom : valeur » plausible (le nom est court, la valeur porte un chiffre ou reste brève). */
export function paire(nom: string | undefined, valeur: string | undefined): ValeurLue | undefined {
  if (!nom || !valeur) return undefined;
  const n = compact(nom).replace(/\s*[:：]\s*$/, ''), v = compact(valeur).replace(/[.;]\s*$/, '');
  if (n.length < 2 || n.length > NOM_MAX || !v || v.length > VAL_MAX + 40) return undefined;
  if (PAS_UNE_CARACT.test(n) || /^https?:/i.test(v) || norm(n) === norm(v) || /^(?:wert|werte|value|valeur|n\/?a|-|–|null|undefined|true|false)$/i.test(v)) return undefined;
  if (!/\d/.test(v) && v.length > 30) return undefined;
  return { nom: coupe(n, NOM_MAX), valeur: coupe(v, VAL_MAX) };
}

/** Les « Nom : valeur » écrits en phrases (description, méta description) : « Max. Tragkraft pro Regalboden: 250 kg. Material: Stahl, MDF. » */
export function pairesDeTexte(texte: string | undefined): ValeurLue[] {
  if (!texte) return [];
  const out: ValeurLue[] = [];
  for (const morceau of texte.split(/(?<=[.!?])\s+(?=[A-ZÄÖÜÀ-ß])|\r?\n|<br\s*\/?>|\s\|\s|;\s/)) {
    const m = compact(morceau).match(/^(?:[-•*]\s*)?([A-Za-zÀ-ÿ][^:：]{1,45}?)\s*[:：]\s*(.{1,140})$/);
    if (!m) continue;
    const p = paire(m[1], m[2]);
    if (p && /\d/.test(p.valeur) || (p && p.valeur.length <= 30)) out.push(p!);
  }
  return out;
}

const MESURES_NOM: Array<{ nom: string; re: RegExp }> = [
  { nom: 'Volume', re: /(\d+(?:[.,]\d+)?)\s?(?:l|lt|liter|litres?|litre)(?![a-zà-ÿ])/i },
  { nom: 'Puissance', re: /(\d+(?:[.,]\d+)?)\s?(?:kw|w)(?![a-zà-ÿ])/i },
  { nom: 'Couleur (EBC)', re: /(\d+(?:[.,]\d+)?(?:\s?[-–]\s?\d+(?:[.,]\d+)?)?)\s?ebc/i },
  { nom: 'Tension', re: /(\d{3})\s?v(?![a-zà-ÿ])/i },
  { nom: 'Contenu ou poids', re: /(\d+(?:[.,]\d+)?)\s?(?:kg|g)(?![a-zà-ÿ])/i }
];
/** Les mesures écrites dans le nom du produit (« Braukessel 60 L Edelstahl 3000 W », « Pilsner Malz, 3-5 EBC, 25 kg ») : le titre est une source. */
export function mesuresDuNom(nom: string | undefined): ValeurLue[] {
  if (!nom) return [];
  const out: ValeurLue[] = [];
  for (const { nom: n, re } of MESURES_NOM) {
    const m = compact(nom).match(re);
    if (m) out.push({ nom: n, valeur: coupe(m[0].trim(), VAL_MAX) });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------------
// Données embarquées
// ---------------------------------------------------------------------------------------------------------------------------

/** Le JSON de `{ ... }` qui commence à `debut`, par comptage des accolades (chaînes comprises) ; `undefined` si non refermé. */
function objetDepuis(s: string, debut: number): string | undefined {
  let prof = 0, dansChaine = false, echappe = false;
  for (let i = debut; i < s.length && i < debut + 3_000_000; i++) {
    const c = s[i];
    if (dansChaine) { if (echappe) echappe = false; else if (c === '\\') echappe = true; else if (c === '"') dansChaine = false; continue; }
    if (c === '"') dansChaine = true; else if (c === '{') prof++; else if (c === '}' && --prof === 0) return s.slice(debut, i + 1);
  }
  return undefined;
}

/** Les états JSON sérialisés dans la page : `__NEXT_DATA__`, autres `<script type="application/json">`, `__NUXT__`, `__INITIAL_STATE__`. */
export function etatsEmbarques(html: string): unknown[] {
  const out: unknown[] = [];
  const essai = (t: string) => { try { out.push(JSON.parse(t)); } catch { /* pas du JSON : ignoré */ } };
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1], corps = m[2];
    if (corps.length < 50 || corps.length > 3_000_000) continue;
    if (/ld\+json|importmap|speculationrules/i.test(attrs)) continue;
    if (/__NEXT_DATA__|type=["']application\/json["']/i.test(attrs)) { essai(corps.trim()); continue; }
    const e = corps.match(/(?:window\.)?(?:__NUXT__|__INITIAL_STATE__|__PRELOADED_STATE__|__APOLLO_STATE__)\s*=\s*(?=\{)/);
    if (e && e.index !== undefined) { const j = objetDepuis(corps, e.index + e[0].length); if (j) essai(j); }
  }
  return out;
}

const CLE_NOM = ['title', 'name', 'label', 'key', 'attributeName', 'attribute_name', 'displayName'];
const CLE_VALEUR = ['value', 'text', 'displayValue', 'stringValue', 'values', 'content'];
const CLE_ATOUTS = /sellingpoint|highlight|feature|bullet|shorttext|keyfact|usp|keyspec/i;

function texteDe(v: unknown, prof = 0): string | undefined {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (prof > 2) return undefined;
  if (Array.isArray(v)) { const t = v.map((x) => texteDe(x, prof + 1)).filter((x): x is string => !!x); return t.length ? t.join(', ') : undefined; }
  if (v && typeof v === 'object') { for (const k of CLE_VALEUR) { const t = texteDe((v as Record<string, unknown>)[k], prof + 1); if (t) return t; } }
  return undefined;
}
function pairObjet(o: unknown): ValeurLue | undefined {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return undefined;
  const r = o as Record<string, unknown>;
  const k = CLE_NOM.find((c) => typeof r[c] === 'string');
  if (!k) return undefined;
  const kv = CLE_VALEUR.find((c) => r[c] !== undefined && r[c] !== null);
  if (!kv) return undefined;
  const v = texteDe(r[kv]);
  return paire(r[k] as string, v?.replace(/<[^>]+>/g, ' '));
}

/**
 * Les caractéristiques d'un état JSON : une liste d'au moins 3 objets titre/valeur (« specifications »), ou une liste de textes
 * d'atouts (« Nutzinhalt Kühlen: 188 l », « Temperatur im Innern von 0 bis 10 °C »). Parcours borné.
 */
export function valeursEmbarquees(etat: unknown): ValeurLue[] {
  const out: ValeurLue[] = [];
  let noeuds = 0;
  const parcourir = (o: unknown, cle: string, prof: number) => {
    if (!o || typeof o !== 'object' || prof > 16 || ++noeuds > 250_000) return;
    if (Array.isArray(o)) {
      const pairs = o.map(pairObjet).filter((x): x is ValeurLue => !!x);
      if (pairs.length >= 3) { out.push(...pairs); return; }
      if (CLE_ATOUTS.test(cle) && o.length >= 2 && o.length <= 14 && o.every((x) => typeof x === 'string' && x.length <= 110)) {
        for (const s of o as string[]) {
          const m = compact(s).match(/^([^:：]{2,45})\s*[:：]\s*(.{1,100})$/);
          const p = m ? paire(m[1], m[2]) : /\d/.test(s) ? { nom: 'Point fort', valeur: coupe(compact(s), VAL_MAX) } : undefined;
          if (p) out.push(p);
        }
        return;
      }
      for (const x of o) parcourir(x, cle, prof + 1);
      return;
    }
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) parcourir(v, k, prof + 1);
  };
  parcourir(etat, '', 0);
  return out;
}

export function valeursDonneesEmbarquees(html: string): ValeurLue[] {
  return etatsEmbarques(html).flatMap(valeursEmbarquees);
}

/** Ajoute à `base` ce qui manque (nom pas déjà pris), au plus 24 en tout. Les valeurs déjà trouvées ne sont jamais remplacées. */
export function completerValeurs<T extends ValeurLue>(base: T[], ajouts: ValeurLue[], max = 24): { valeurs: Array<T | ValeurLue>; ajoutees: number } {
  const vus = new Set(base.map((v) => norm(v.nom)));
  const valeurs: Array<T | ValeurLue> = [...base];
  let ajoutees = 0;
  for (const a of ajouts) {
    if (valeurs.length >= max) break;
    const cle = norm(a.nom);
    if (vus.has(cle)) continue;
    vus.add(cle); valeurs.push(a); ajoutees++;
  }
  return { valeurs, ajoutees };
}

// ---------------------------------------------------------------------------------------------------------------------------
// Données de boutique de la plateforme (Shopify, WooCommerce)
// ---------------------------------------------------------------------------------------------------------------------------

export type Plateforme = 'shopify' | 'woocommerce';
export interface DonneesPlateforme { plateforme: Plateforme; valeurs: ValeurLue[]; photos: string[]; adresse: string }

/** La plateforme de la boutique et l'adresse publique de sa fiche JSON, ou `null`. */
export function plateformeDe(html: string, url: URL): { plateforme: Plateforme; adresse: URL } | null {
  const segments = url.pathname.split('/').filter(Boolean);
  if (/cdn\.shopify\.com|Shopify\.theme|myshopify\.com/i.test(html)) {
    const i = segments.indexOf('products');
    const handle = i >= 0 ? segments[i + 1] : undefined;
    if (handle) return { plateforme: 'shopify', adresse: new URL(`/products/${encodeURIComponent(decodeURIComponent(handle))}.js`, url.origin) };
  }
  if (/wp-content\/plugins\/woocommerce|\bwoocommerce\b/i.test(html) && segments.length) {
    const slug = decodeURIComponent(segments[segments.length - 1]);
    if (/^[\w%.-]{2,200}$/.test(slug)) return { plateforme: 'woocommerce', adresse: new URL(`/wp-json/wc/store/v1/products?slug=${encodeURIComponent(slug)}`, url.origin) };
  }
  return null;
}

/** Les caractéristiques d'une description HTML de boutique : tableaux, listes « Nom : valeur », phrases « Nom : valeur ». */
export function valeursDeDescription(htmlDescription: string | undefined): ValeurLue[] {
  if (!htmlDescription) return [];
  const $ = load(`<div id="d">${htmlDescription}</div>`);
  const out: ValeurLue[] = [];
  $('tr').each((_, tr) => { const c = $(tr).children('th, td'); if (c.length === 2) { const p = paire($(c[0]).text(), $(c[1]).text()); if (p) out.push(p); } });
  out.push(...pairesDeTexte($('#d').find('br').replaceWith('\n').end().text()));
  $('#d li, #d p').each((_, e) => { out.push(...pairesDeTexte($(e).text())); });
  return out;
}

/** Lit le JSON de la fiche de la boutique (Shopify `.js`, WooCommerce Store API) rendu par `corps` ; `null` si ce n'est pas une fiche. */
export function lireJsonPlateforme(plateforme: Plateforme, corps: string, adresse: string): DonneesPlateforme | null {
  let j: any;
  try { j = JSON.parse(corps); } catch { return null; }
  const valeurs: ValeurLue[] = [], photos: string[] = [];
  if (plateforme === 'shopify') {
    if (!j || typeof j !== 'object' || typeof j.title !== 'string') return null;
    valeurs.push(...valeursDeDescription(j.description ?? j.body_html));
    for (const o of Array.isArray(j.options) ? j.options : []) {
      const vals: unknown[] = Array.isArray(o?.values) ? o.values : [];
      if (typeof o?.name === 'string' && vals.length === 1 && o.name !== 'Title') { const p = paire(o.name, String(vals[0])); if (p) valeurs.push(p); }
    }
    for (const i of Array.isArray(j.images) ? j.images : []) if (typeof i === 'string') photos.push(i.startsWith('//') ? `https:${i}` : i);
  } else {
    const p = Array.isArray(j) ? j[0] : null;
    if (!p || typeof p !== 'object' || typeof p.name !== 'string') return null;
    for (const a of Array.isArray(p.attributes) ? p.attributes : []) {
      const termes = (Array.isArray(a?.terms) ? a.terms : []).map((t: any) => t?.name).filter((x: unknown): x is string => typeof x === 'string');
      const v = paire(a?.name, termes.join(', '));
      if (v) valeurs.push(v);
    }
    valeurs.push(...valeursDeDescription(p.short_description), ...valeursDeDescription(p.description));
    for (const i of Array.isArray(p.images) ? p.images : []) if (typeof i?.src === 'string') photos.push(i.src);
  }
  return { plateforme, valeurs, photos: photos.filter((u) => /^https:\/\//.test(u)).slice(0, 12), adresse };
}
