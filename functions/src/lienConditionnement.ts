/**
 * Les conditionnements d'un article et son prix à l'unité (PX, 24.11 ; R39 à R41 du DOSSIER prix-houblon).
 *
 * Problème d'école : une page produit publie PLUSIEURS prix pour un même produit, chacun pour une quantité (sachet de 50 g, sac de 5 kg) ou donné à
 * l'unité (0,1044 CHF le gramme, paliers dégressifs). Lire « le prix » sans dire à quelle quantité il se rapporte est faux (0,10 CHF le Citra). Méthodes
 * standard, dans l'ordre où la page les publie :
 *  - schema.org : `Offer` + `priceSpecification` de type `UnitPriceSpecification` et `referenceQuantity` (QuantitativeValue, `unitCode` UN/CEFACT :
 *    GRM, KGM, LTR, MLT) — traité dans `lienProduit.ts` par `depuisReference` ;
 *  - variantes Shopify : le JSON de la page (`variants` : titre « 50 g / 2025 / 13.2% », prix) que la boutique charge pour son sélecteur ; le HTML visible
 *    n'en porte rien (un widget JavaScript), donc ni le lecteur ni l'IA ne les voyaient ;
 *  - lignes de variantes nopCommerce (`product-variant-line`) : nom (« Citra 13.6% 5kg »), étiquette (« Preis/Pack », « Preis/Gramm »), prix affiché
 *    (l'attribut `content` arrondit 0,1044 à 0,10 : le texte affiché fait foi), tableau des paliers (« Staffelpreise »).
 * Aucune bibliothèque : cheerio (déjà là) et deux expressions régulières ; rien n'est deviné : une variante sans quantité écrite n'est pas une offre
 * conditionnée, un prix sans unité ni quantité reste sans conditionnement.
 */
import type { CheerioAPI } from 'cheerio/slim';

export type UniteQuantite = 'g' | 'kg' | 'ml' | 'cl' | 'dl' | 'l';
/** Un conditionnement publié : `prix` est le prix de `valeur` `unite` (dans la devise de la page). */
export interface OffreConditionnee { valeur: number; unite: UniteQuantite; prix: number }
/** Un prix donné à l'unité (`prix` pour 1 `unite`), tel que la page l'écrit, et ses paliers dégressifs (`des` : à partir de combien d'`unite`). */
export interface PrixUnite { prix: number; unite: UniteQuantite; paliers?: Array<{ des: number; prix: number }> }
export interface Conditionnements { offres: OffreConditionnee[]; parUnite?: PrixUnite; devise?: string }

/** Facteur d'une unité vers l'unité de base (kg pour la masse, L pour le volume). */
const FACTEUR: Record<UniteQuantite, { base: 'kg' | 'l'; f: number }> = {
  g: { base: 'kg', f: 0.001 }, kg: { base: 'kg', f: 1 }, ml: { base: 'l', f: 0.001 }, cl: { base: 'l', f: 0.01 }, dl: { base: 'l', f: 0.1 }, l: { base: 'l', f: 1 }
};
export const uniteDeBase = (u: UniteQuantite): 'kg' | 'l' => FACTEUR[u].base;
/** Le prix de 1 `unite` ramené à 1 kg (ou 1 L), arrondi au centime. */
export const prixParBase = (prix: number, unite: UniteQuantite): number => Math.round((prix / FACTEUR[unite].f) * 100) / 100;

/**
 * R49 : le prix pour 1 `unite` de base (1 kg, 1 L) d'un prix à l'unité à paliers, EXPRIMÉ pour l'unité de la page (par g : le prix d'un gramme à ce palier). Le palier qui compte est
 * le plus haut dont le seuil (`des`, en `unite`) ne dépasse pas 1 unité de base (1 000 g pour 1 kg) ; sans palier atteint, le tarif de base.
 */
export function prixAuPalier(u: PrixUnite): number {
  const unBase = 1 / FACTEUR[u.unite].f;
  const atteints = (u.paliers ?? []).filter((p) => p.des <= unBase + 1e-9).sort((a, b) => b.des - a.des);
  return atteints[0]?.prix ?? u.prix;
}

const QUANTITE = /(?<![\d.,'’a-zA-Zà-ÿ/])(\d+(?:[.,]\d+)?)\s?(kg|g|ml|cl|dl|l)(?![a-zA-Zà-ÿ0-9²³/])/i;
/** La quantité écrite dans un titre de variante (« 50 g / 2025 / 13.2% », « Citra 13.6% 5kg »). `null` : aucune. */
export function quantiteDuTitre(titre: string): { valeur: number; unite: UniteQuantite } | null {
  const m = QUANTITE.exec(titre);
  if (!m) return null;
  const valeur = Number(m[1].replace(',', '.'));
  return Number.isFinite(valeur) && valeur > 0 ? { valeur, unite: m[2].toLowerCase() as UniteQuantite } : null;
}

/** Un montant écrit (« CHF 0.1044 », « 1'234,50 € ») ; `null` s'il n'y en a pas. */
function montant(t: string): number | null {
  const m = /(\d[\d'’  ]*(?:[.,]\d+)?)/.exec(t);
  if (!m) return null;
  let s = m[1].replace(/['’  ]/g, '');
  if (/,\d{1,4}$/.test(s) && !s.includes('.')) s = s.replace(',', '.'); else s = s.replace(/,/g, '');
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}
const devineDevise = (t: string): string | undefined => /CHF|Fr\./.test(t) ? 'CHF' : /€|EUR/.test(t) ? 'EUR' : /£|GBP/.test(t) ? 'GBP' : /USD|\$/.test(t) ? 'USD' : undefined;

/** « Preis/Gramm », « prix au kilo », « price per gram » : l'étiquette d'un prix à l'unité. */
const ETIQUETTE_UNITE = /(?:preis|prix|price)\s*(?:\/|pro|par|au|per)\s*(gramm?e?s?|kilo(?:gramm|gramme)?|kg|g|liter|litre|l)\b/i;
const unitePourEtiquette = (m: string): UniteQuantite => {
  const x = m.toLowerCase();
  return x.startsWith('kilo') || x === 'kg' ? 'kg' : x.startsWith('lit') || x === 'l' ? 'l' : 'g';
};

const dedoubler = (offres: OffreConditionnee[]): OffreConditionnee[] => {
  const vues = new Set<string>();
  return offres.filter((o) => { const k = `${o.valeur}${o.unite}${o.prix}`; if (vues.has(k)) return false; vues.add(k); return true; });
};
/** Du plus petit conditionnement au plus grand (dans l'unité de base). */
export const parTaille = (a: OffreConditionnee, b: OffreConditionnee) => a.valeur * FACTEUR[a.unite].f - b.valeur * FACTEUR[b.unite].f;

/** Variantes Shopify : le JSON de la page. Deux formes courantes (analytique : `price:{amount}` + `sku` + `title` ; thème : `title`, `price` en centimes). */
function variantesShopify(html: string): { offres: OffreConditionnee[]; devise?: string } {
  const offres: OffreConditionnee[] = [];
  let devise: string | undefined;
  const titre = (s: string) => { try { return JSON.parse(`"${s}"`) as string; } catch { return s; } };
  for (const m of html.matchAll(/"price"\s*:\s*\{\s*"amount"\s*:\s*([\d.]+)\s*,\s*"currencyCode"\s*:\s*"([A-Z]{3})"\s*\}\s*,\s*"sku"\s*:\s*"[^"]*"\s*,\s*"title"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) {
    const q = quantiteDuTitre(titre(m[3])), prix = Number(m[1]);
    if (q && prix > 0) { offres.push({ ...q, prix }); devise = m[2]; }
  }
  if (!offres.length) {
    for (const m of html.matchAll(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"name"\s*:\s*[^,]*,\s*"price"\s*:\s*(\d+)\s*,\s*"price_with_format"\s*:\s*"([^"]*)"/g)) {
      const q = quantiteDuTitre(titre(m[1])), prix = Number(m[2]) / 100;
      if (q && prix > 0) { offres.push({ ...q, prix }); devise ??= devineDevise(m[3]); }
    }
  }
  return { offres: dedoubler(offres).sort(parTaille), ...(devise ? { devise } : {}) };
}

/** Lignes de variantes nopCommerce : « Preis/Pack » (une quantité dans le nom) et « Preis/Gramm » (prix à l'unité, paliers). */
function lignesNop($: CheerioAPI): { offres: OffreConditionnee[]; parUnite?: PrixUnite; devise?: string } {
  const offres: OffreConditionnee[] = [];
  let parUnite: PrixUnite | undefined, devise: string | undefined;
  $('.product-variant-line').each((_, e) => {
    const ligne = $(e);
    const nom = ligne.find('.variant-name').first().text().replace(/\s+/g, ' ').trim();
    const etiquette = ligne.find('.variant-description').first().text().replace(/\s+/g, ' ').trim();
    const texte = ligne.find('.product-price').first().text().replace(/\s+/g, ' ').trim();
    const prix = montant(texte);
    if (prix === null) return;
    devise ??= devineDevise(texte) ?? ligne.find('[itemprop="priceCurrency"]').first().attr('content') ?? undefined;
    const u = ETIQUETTE_UNITE.exec(etiquette);
    if (u) {
      const unite = unitePourEtiquette(u[1]);
      const paliers: Array<{ des: number; prix: number }> = [];
      const entetes = ligne.find('.prices-row.thead .item-quantity').map((_, x) => $(x).text()).get();
      const prixTab = ligne.find('.prices-row.tbody .item-price').map((_, x) => $(x).text()).get();
      entetes.forEach((h, i) => { const des = montant(h), p = montant(prixTab[i] ?? ''); if (des !== null && des > 1 && p !== null) paliers.push({ des, prix: p }); });
      parUnite ??= { prix, unite, ...(paliers.length ? { paliers } : {}) };
    } else {
      const q = quantiteDuTitre(nom);
      if (q) offres.push({ ...q, prix });
    }
  });
  return { offres: dedoubler(offres).sort(parTaille), ...(parUnite ? { parUnite } : {}), ...(devise ? { devise } : {}) };
}

/**
 * R48 (C64-1, 24.11) : variantes publiées dans un bloc JSON de la page (`<script type="application/json">`, cas d'hopfenmarkt.ch : `variants: [{ label: « 100 g »,
 * price_amount: « 6.70 », currency: « CHF » }]`). Le HTML visible n'en dit que le prix de la variante affichée ; sans cette lecture, le prix 6,70 (celui de 100 g) se
 * retrouvait sans sa quantité, et l'IA l'accolait au sachet de 50 g (134 CHF/kg au lieu de 67). Le JSON est parsé (JSON.parse), jamais fouillé par expression régulière.
 */
function variantesJson($: CheerioAPI): { offres: OffreConditionnee[]; devise?: string } {
  const offres: OffreConditionnee[] = [];
  let devise: string | undefined;
  const parcourir = (n: unknown, prof: number) => {
    if (prof > 6 || !n || typeof n !== 'object') return;
    if (Array.isArray(n)) { n.forEach((x) => parcourir(x, prof + 1)); return; }
    const o = n as Record<string, unknown>;
    if (Array.isArray(o.variants)) {
      for (const v of o.variants) {
        if (!v || typeof v !== 'object') continue;
        const x = v as Record<string, unknown>;
        const q = quantiteDuTitre(String(x.label ?? x.title ?? x.name ?? ''));
        const brut = x.price_amount ?? x.priceAmount ?? x.price;
        const prix = typeof brut === 'number' ? brut : montant(String(brut ?? ''));
        if (!q || prix === null || prix === undefined || !(prix > 0)) continue;
        offres.push({ ...q, prix });
        devise ??= typeof x.currency === 'string' && /^[A-Z]{3}$/.test(x.currency) ? x.currency : devineDevise(String(x.price ?? ''));
      }
    }
    for (const k of Object.keys(o)) if (k !== 'variants') parcourir(o[k], prof + 1);
  };
  $('script[type="application/json"]').each((_, e) => {
    const t = $(e).contents().text();
    if (!t || t.length > 400_000 || !/"variants"/.test(t)) return;
    try { parcourir(JSON.parse(t), 0); } catch { /* bloc illisible : ignoré */ }
  });
  return { offres: dedoubler(offres).sort(parTaille), ...(devise ? { devise } : {}) };
}

export function lireConditionnements(html: string, $: CheerioAPI): Conditionnements {
  const nop = lignesNop($);
  if (nop.offres.length || nop.parUnite) return nop;
  const shopify = variantesShopify(html);
  if (shopify.offres.length) return shopify;
  const json = variantesJson($);
  return json.offres.length ? json : { offres: [] };
}

const CODES_UNITE: Record<string, UniteQuantite> = { GRM: 'g', KGM: 'kg', LTR: 'l', MLT: 'ml', CLT: 'cl', DLT: 'dl', g: 'g', kg: 'kg', l: 'l', ml: 'ml' };
/**
 * schema.org `UnitPriceSpecification` + `referenceQuantity` : le prix est donné pour `value` `unitCode`. Pour 1 unité : un prix à l'unité ; pour
 * plus (100 g) : un conditionnement. `null` : pas une spécification par référence, ou une unité inconnue (jamais devinée).
 */
export function depuisReference(spec: Record<string, any>): { sorte: 'unite'; unite: UniteQuantite; prix: number } | { sorte: 'offre'; offre: OffreConditionnee } | null {
  const ref = Array.isArray(spec?.referenceQuantity) ? spec.referenceQuantity[0] : spec?.referenceQuantity;
  if (!ref || typeof ref !== 'object') return null;
  const unite = CODES_UNITE[String(ref.unitCode ?? '').trim()] ?? CODES_UNITE[String(ref.unitText ?? '').trim().toLowerCase()];
  const valeur = Number(String(ref.value ?? '').replace(',', '.'));
  const prix = Number(String(spec.price ?? '').replace(',', '.'));
  if (!unite || !(valeur > 0) || !(prix > 0)) return null;
  return valeur === 1 ? { sorte: 'unite', unite, prix } : { sorte: 'offre', offre: { valeur, unite, prix } };
}
