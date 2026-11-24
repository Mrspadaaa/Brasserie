import { load, type CheerioAPI } from 'cheerio/slim';
import { Handler } from 'htmlmetaparser';
import { Parser } from 'htmlparser2';
import { stockStatus } from './brewerSuppliers.js';
import { bruitDeBoutique, completerValeurs, memeMesure, mesuresDuNom, pairesDeTexte, valeursDonneesEmbarquees } from './lienPlateforme.js';
import { montantDit } from './lienValeurs.js';
import { libelleFrancais, retenir } from './lienLibelles.js';

/** Ce qu'on LIT d'une page (avant le tri) ; ce qu'on GARDE après le tri de l'essentiel est plafonné à `GARDEES` (C48-5 : le plafond ne se prend jamais dans l'ordre de la page). */
const LUES = 60, GARDEES = 24;

/**
 * Lecture d'une page produit, sans modèle (D446, 23.11 : « vraiment très mauvais » au banc réel). Remplace la lecture JSON-LD seule.
 *
 * ## État de l'art (L29)
 * Problème d'école : l'extraction de données produit d'une page web (« product data extraction », wrappers et données structurées).
 * Méthode standard, dans l'ordre où elle fait foi : (1) les données structurées schema.org `Product`/`Offer` publiées pour les moteurs
 * (JSON-LD, microdata, RDFa) ; (2) les métadonnées Open Graph `og:`/`product:` ; (3) le HTML visible (titre `h1`, bloc de prix sous le
 * titre, tableaux de caractéristiques `table`/`dl`) ; (4) un modèle de langue sur le texte nettoyé, en dernier, sous garde (rien qui ne
 * soit écrit dans la page). Bibliothèque : `htmlmetaparser` (B. Embrey, Apache-2.0, sur `htmlparser2` déjà présent par cheerio) lit
 * JSON-LD, microdata et RDFa selon les spécifications W3C au lieu de motifs maison ; cheerio garde le HTML visible. Écartés : metascraper
 * (re2 natif et jsdom, trop lourds pour une fonction), web-auto-extractor (abandonné en 2017), `@marbec/web-auto-extractor` (son propre
 * analyseur HTML écrit à la main). Mesure : `scripts/banc-liens.ts` (63 liens réels, vérité écrite).
 *
 * Chaque étape rend un statut contrôlé (`trouve`, `absent`, `douteux`) : le brasseur voit ce qui a été lu et ce qui reste à vérifier
 * (« découper les tâches en sous tâches. Et voir si tu es correcte », 23.11). Rien n'est inventé : une valeur absente reste absente ; deux
 * sources qui se contredisent sont dites (`douteux`), jamais tranchées en silence.
 */

export const ETAPES_LECTURE = ['page', 'donnees', 'prix', 'devise-frais', 'photos', 'caract', 'controle'] as const;
export type NomEtape = typeof ETAPES_LECTURE[number];
export interface EtapeLecture { nom: NomEtape; statut: 'trouve' | 'absent' | 'douteux'; detail?: string }

export interface Livraison { prix?: number; devise?: string; gratuite?: true; refusee?: true }
export interface Extraction {
  nom?: string;
  prix?: number;
  devise?: string;
  prixDes?: true;
  /** `ht` : le prix publié est hors taxe (net) ; `ttc` : taxe comprise, dite par la page. Absent : la page ne le dit pas. */
  taxe?: 'ht' | 'ttc';
  /** Le prix taxe comprise quand la page publie les deux (le HT reste dans `prix`). */
  prixTTC?: number;
  dispo?: 'en-stock' | 'rupture' | 'retire' | 'sur-commande';
  /** Le délai d'un article sur commande, tel que la page le dit (« expédié sous 28 jours ») ; absent : la page n'en dit pas. */
  dispoDelai?: string;
  vendeur?: string;
  photos: string[];
  valeurs: Array<{ nom: string; valeur: string; unite?: string }>;
  livraison?: Livraison;
  etapes: EtapeLecture[];
}

type Json = Record<string, any>;
const compact = (t: string) => t.replace(/[\s  ]+/g, ' ').trim();
const norm = (t: string) => compact(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const liste = <T = any>(v: unknown): T[] => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]) as T[];
const types = (o: Json) => liste(o?.['@type']).map((t) => String(t).replace(/^https?:\/\/schema\.org\//, ''));
const estProduit = (o: Json) => types(o).some((t) => /^(Product|ProductGroup|IndividualProduct|ProductModel|SomeProducts)$/.test(t));

/** Coupe à un mot entier (BL-13) : jamais « Thermomet » fabriqué par nous. */
export function couper(t: string, max: number): string {
  const c = compact(t);
  if (c.length <= max) return c;
  const bout = c.slice(0, max + 1), i = bout.lastIndexOf(' ');
  return (i > max * 0.6 ? bout.slice(0, i) : c.slice(0, max)).replace(/[\s,;:–-]+$/, '');
}

/** Une chaîne lisible d'une valeur schema.org (texte, nombre, `{ name }`, `{ @value }`), sinon `undefined`. */
function texte(v: unknown, max = 200): string | undefined {
  const x = liste(v)[0];
  if (typeof x === 'number' && Number.isFinite(x)) return String(x);
  if (typeof x === 'string') { const c = compact(x); return c ? couper(c, max) : undefined; }
  if (x && typeof x === 'object') return texte((x as Json)['@value'] ?? (x as Json).name, max);
  return undefined;
}

// ---------------------------------------------------------------------------------------------------------------------------
// Montants
// ---------------------------------------------------------------------------------------------------------------------------

/**
 * Lire un montant écrit sans locale (« 4'890.00 », « 4 890,00 », « 4,890.00 », « CHF 1'250.– »). Heuristique standard du dernier
 * séparateur des extracteurs de prix (reprise telle quelle de la Chasse Carnet V1) ; tout le reste rend `undefined`, jamais deviné.
 */
const DEVISES_ECRITES: Array<[RegExp, string]> = [[/CHF|SFr\.?|Fr\./gi, 'CHF'], [/EUR|€|EURO/gi, 'EUR'], [/USD|US\$/gi, 'USD'], [/GBP|£/gi, 'GBP'], [/AUD|A\$/gi, 'AUD']];
export function prixLocalise(v: unknown): { montant: number; devise?: string } | undefined {
  if (typeof v === 'number') return Number.isFinite(v) && v > 0 ? { montant: v } : undefined;
  if (typeof v !== 'string' || v.length > 60) return undefined;
  let s = v.replace(/[  \s]+/g, ' ').replace(/[’`´]/g, "'").trim();
  const devs = new Set<string>();
  for (const [re, code] of DEVISES_ECRITES) { if (re.test(s)) devs.add(code); re.lastIndex = 0; s = s.replace(re, ' '); }
  if (devs.size > 1) return undefined;
  s = s.replace(/\s+/g, ' ').replace(/[.,]?\s*[–—-]+\s*$/, '').replace(/\s*\*+\s*$/, '').trim();
  if (!/^\d[\d.,' ]*$/.test(s)) return undefined;
  const groupesOk = (t: string, sep: string | null) => {
    if (sep === null) return /^\d+$/.test(t);
    const g = t.split(sep);
    return /^\d{1,3}$/.test(g[0]) && g.slice(1).every((x) => /^\d{3}$/.test(x));
  };
  const dernier = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','));
  let entier: string, frac = '';
  if (dernier < 0) {
    const seps = new Set(s.replace(/\d/g, ''));
    if (seps.size > 1 || !groupesOk(s, seps.size ? [...seps][0] : null)) return undefined;
    entier = s.replace(/\D/g, '');
  } else {
    const c = s[dernier], reste = s.slice(dernier + 1);
    if (reste.length === 3 && new RegExp(`^[1-9]\\d{0,2}(?:\\${c}\\d{3})+$`).test(s)) entier = s.replace(/\D/g, '');
    else {
      if (!/^\d{1,2}$/.test(reste)) return undefined;
      const partie = s.slice(0, dernier), seps = new Set(partie.replace(/\d/g, ''));
      if (seps.size > 1 || seps.has(c) || !groupesOk(partie, seps.size ? [...seps][0] : null)) return undefined;
      entier = partie.replace(/\D/g, ''); frac = reste;
    }
  }
  const montant = Number(frac ? `${entier}.${frac}` : entier);
  if (!Number.isFinite(montant) || montant <= 0) return undefined;
  return devs.size ? { montant, devise: [...devs][0] } : { montant };
}

/** Les montants écrits d'un texte, avec leur position (devise devant ou derrière). */
const MOTIF_MONTANT = /(?:(CHF|SFr\.?|Fr\.|EUR|€|£|GBP|USD|US\$|AUD|A\$)\s{0,3})?(\d{1,3}(?:['’ .,  ]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)(?:\s?[.,]?[–—-](?!\d))?(?:\s?(CHF|EUR|€|EURO|£|GBP|USD|AUD|\$))?/g;
export function montantsDe(t: string): Array<{ montant: number; devise: string; i: number; brut: string }> {
  const out: Array<{ montant: number; devise: string; i: number; brut: string }> = [];
  for (const m of t.matchAll(MOTIF_MONTANT)) {
    const dev = m[1] ?? m[3];
    if (!dev) continue;
    const lu = prixLocalise(`${m[2]} ${dev === '$' ? 'USD' : dev}`);
    if (lu?.devise) out.push({ montant: lu.montant, devise: lu.devise, i: m.index ?? 0, brut: m[0] });
  }
  return out;
}
const egal = (a: number, b: number) => Math.abs(a - b) <= Math.max(0.011, b * 0.0005);

// ---------------------------------------------------------------------------------------------------------------------------
// Données structurées
// ---------------------------------------------------------------------------------------------------------------------------

/** Décode les entités d'une chaîne du JSON-LD (« l&apos;isolation ») ; l'inconnu reste tel quel. */
const decoder = (t: string) => t.includes('&') ? load('<i>' + t.replace(/</g, '&lt;') + '</i>').text() : t;
function decoderJson(v: unknown, prof = 0): unknown {
  if (typeof v === 'string') return decoder(v);
  if (prof > 8 || !v || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map((x) => decoderJson(x, prof + 1));
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, decoderJson(x, prof + 1)]));
}
/** Le microdata de htmlmetaparser est « développé » (`[{ "@value": … }]`) : on le ramène à la forme du JSON-LD. */
function aplatir(v: unknown, prof = 0): unknown {
  if (prof > 10) return undefined;
  if (Array.isArray(v)) { const a = v.map((x) => aplatir(x, prof + 1)).filter((x) => x !== undefined); return a.length === 1 ? a[0] : a; }
  if (!v || typeof v !== 'object') return v;
  const o = v as Json;
  if ('@value' in o) return o['@value'];
  return Object.fromEntries(Object.entries(o).filter(([k]) => k !== '@context').map(([k, x]) => [k === '@type' ? k : k.replace(/^https?:\/\/schema\.org\//, ''), aplatir(x, prof + 1)]));
}

interface Structure { produits: Array<{ o: Json; source: 'JSON-LD' | 'microdata' | 'RDFa' }>; meta: Map<string, string> }

function structure(html: string, $: CheerioAPI, url: URL): Structure {
  const produits: Structure['produits'] = [];
  const parcourir = (v: unknown, source: 'JSON-LD' | 'microdata' | 'RDFa', prof = 0) => {
    if (!v || prof > 6 || typeof v !== 'object') return;
    if (Array.isArray(v)) { v.slice(0, 60).forEach((x) => parcourir(x, source, prof + 1)); return; }
    const o = v as Json;
    if (types(o).some((t) => /ItemList|BreadcrumbList|SearchResultsPage|CollectionPage/.test(t))) return;
    if (estProduit(o)) { produits.push({ o, source }); return; }
    for (const k of ['@graph', 'mainEntity', 'mainEntityOfPage', 'itemReviewed', 'about']) if (o[k]) parcourir(o[k], source, prof + 1);
  };
  $('script[type="application/ld+json"]').slice(0, 30).each((_, el) => {
    const brut = $(el).text();
    try { parcourir(decoderJson(JSON.parse(brut)), 'JSON-LD'); }
    catch {
      // Un JSON-LD avec des retours à la ligne bruts dans ses chaînes (fréquent) : réparé une fois, sinon ignoré (pas une preuve).
      try { parcourir(decoderJson(JSON.parse(brut.replace(/[\r\n\t]+/g, ' '))), 'JSON-LD'); } catch { /* schéma invalide */ }
    }
  });
  let res: any = null;
  try {
    const h = new Handler((err: unknown, r: unknown) => { if (!err) res = r; }, { url: url.href });
    const p = new Parser(h, { decodeEntities: true });
    p.write(html); p.end();
  } catch { /* microdata illisible : le JSON-LD et le HTML restent */ }
  for (const m of liste(res?.microdata)) parcourir(aplatir(m), 'microdata');
  const meta = new Map<string, string>();
  for (const n of liste<Json>(res?.rdfa)) {
    const o = aplatir(n) as Json;
    if (types(o).length && estProduit(o)) produits.push({ o, source: 'RDFa' });
  }
  $('meta[property], meta[name], meta[itemprop]').each((_, el) => {
    const k = ($(el).attr('property') ?? $(el).attr('name') ?? '').toLowerCase(), c = $(el).attr('content');
    if (k && c && !meta.has(k)) meta.set(k, compact(c));
  });
  return { produits, meta };
}

/** Le produit principal : celui que nomment le titre ou l'adresse, avec une offre ; jamais un produit d'une liste. */
function principal(s: Structure, h1: string, ogTitre: string, url: URL): Json | null {
  if (!s.produits.length) return null;
  const nh1 = norm(h1), nog = norm(ogTitre);
  const score = ({ o }: { o: Json }) => {
    const n = norm(texte(o.name, 300) ?? '');
    let x = 0;
    if (n && (nh1.includes(n) || nog.includes(n) || (n.includes(nh1) && nh1.length > 8))) x += 4;
    if (o.offers || o.hasVariant) x += 2;
    const u = texte(o.url, 2000);
    try { if (u && new URL(u, url).pathname === url.pathname) x += 2; } catch { /* adresse illisible */ }
    if (o.image) x += 1;
    return x;
  };
  const tries = [...s.produits].sort((a, b) => score(b) - score(a));
  const meilleur = { ...tries[0].o };
  // JSON-LD et microdata du même produit : le second complète le premier, champ par champ (jamais ne le remplace).
  const nm = norm(texte(meilleur.name, 300) ?? '');
  for (const { o } of tries.slice(1)) {
    if (norm(texte(o.name, 300) ?? '') !== nm) continue;
    for (const [k, v] of Object.entries(o)) if (meilleur[k] === undefined) meilleur[k] = v;
  }
  return meilleur;
}

// ---------------------------------------------------------------------------------------------------------------------------
// Page visible
// ---------------------------------------------------------------------------------------------------------------------------

/** Le texte visible, dans l'ordre de lecture, sans scripts, styles ni navigation. */
export function texteVisible($: CheerioAPI): string {
  const c = $.root().clone();
  c.find('script, style, noscript, template, svg, iframe, nav, header, footer').remove();
  return compact(c.find('body').text() || c.text());
}

const DIT_TTC = /inkl\.?\s*(?:\d+(?:[.,]\d+)?\s*%\s*)?(?:der\s+)?(?:gesetzl(?:\.|ichen)?\s*)?(?:MwSt|USt|Mehrwertsteuer|Umsatzsteuer)|TVA\s+(?:incluse|comprise)|(?:incl\.?|including)\s*(?:\d+\s*%\s*)?VAT|\bTTC\b|inc\.?\s*VAT/i;
const DIT_HT = /(?:exkl\.?|zzgl\.?|zuzüglich|ohne|excl\.?|excluding|plus)\s*(?:\d+(?:[.,]\d+)?\s*%\s*)?(?:der\s+)?(?:gesetzl(?:\.|ichen)?\s*)?(?:MwSt|USt|Mehrwertsteuer|VAT)|hors\s+TVA|\bHT\b|\bnetto\b|ex\.?\s*VAT/i;
const TAUX_TVA = [0.081, 0.077, 0.026, 0.038, 0.19, 0.2, 0.21, 0.1, 0.07, 0.055];

/** Le premier montant écrit sous le titre (le bloc d'achat) : repli du prix quand la page ne publie aucune donnée structurée. */
function prixSousTitre(visible: string, titre: string): { montant: number; devise: string; des: boolean } | undefined {
  const t = norm(titre).slice(0, 40);
  const nv = norm(visible);
  let i = t.length > 5 ? nv.indexOf(t) : -1;
  if (i < 0) return undefined;
  // Le titre revient souvent (fil d'Ariane, h1, libellés plus bas) : la première occurrence suivie d'un montant dans les 700 caractères.
  for (let essai = 0; essai < 4 && i >= 0; essai++) {
    const fenetre = visible.slice(i, i + 700);
    const m = montantsDe(fenetre).find((x) => !/(?:statt|UVP|instead of|au lieu de|RRP|PVC|ab|dès|from)\s*$/i.test(fenetre.slice(Math.max(0, x.i - 14), x.i)));
    if (m) return { montant: m.montant, devise: m.devise, des: /(?:\bab|dès|from)\s*$/i.test(fenetre.slice(Math.max(0, m.i - 8), m.i)) };
    i = nv.indexOf(t, i + t.length);
  }
  return undefined;
}

/**
 * C48-1 : le prix d'une page dont le bloc d'achat n'est ni sous le titre ni à moins de 700 caractères (bandeau d'achat avant la galerie,
 * livraison et variantes entre le titre et le prix). Repli de `prixSousTitre`, jamais avant lui : le PREMIER bloc « prix » du document
 * (classe ou id price / prix / preis, ou itemprop="price") qui écrit un montant avec sa devise. Ni le prix barré, ni les produits liés,
 * ni le panier, ni la navigation : le prix d'un autre article ne devient jamais celui-ci.
 */
const BLOC_PRIX = '[itemprop="price"], [class*="price" i], [class*="prix" i], [class*="preis" i], [id*="price" i], [id*="prix" i], [id*="preis" i]';
const PAS_CE_PRIX = /(?:^|[\s_-])(?:old|was|regular|strike|strikethrough|crossed|related|upsell|cross|similar|recommend\w*|carousel|slider|suggest\w*|cart|basket|panier|warenkorb|minicart|list-price|listprice|uvp|rrp|msrp|saving|savings|discount|filter|facet|range)(?:$|[\s_-])/i;
function prixDuBloc($: CheerioAPI): { montant: number; devise: string; des: boolean } | undefined {
  let trouve: { montant: number; devise: string; des: boolean } | undefined;
  $(BLOC_PRIX).each((_, e) => {
    if (trouve) return;
    const el = $(e);
    if (el.closest('nav, header, footer, aside, del, s, script, style, noscript, template, .products, [data-is-descendent-of-query-loop], [data-block-name="woocommerce/product-collection"]').length) return;
    const lignee = [e, ...el.parents().toArray()].map((x) => `${$(x).attr('class') ?? ''} ${$(x).attr('id') ?? ''}`);
    if (lignee.some((c) => PAS_CE_PRIX.test(c.replace(/\b(?:price|prix|preis)[-_]?/gi, ' ')))) return;
    /* le bloc ENTIER du prix : un élément interne (« CHF4.00 ») d'une fourchette (« CHF4.00 – CHF285.00 ») n'est pas le prix, c'en est un bout */
    let bloc = el;
    while (bloc.parent().is(BLOC_PRIX) && compact(bloc.parent().text()).length <= 160) bloc = bloc.parent();
    const t = compact(bloc.text());
    if (t.length > 160 || /(?:statt|UVP|instead of|au lieu de|RRP|PVC|pro\s+(?:kg|100\s?g|l\b)|\/\s?(?:kg|l)\b)/i.test(t)) return;
    const ms = montantsDe(t), m = ms[0];
    /* une fourchette (« CHF 4.00 – CHF 15.00 » : le prix dépend de la variante choisie) n'est le prix de personne : rien n'est lu */
    if (m && /^\D{0,5}\d[\d.,'’]*\s[–—-]\s*\D{0,5}\d/.test(t.slice(m.i))) return;
    if (m) trouve = { montant: m.montant, devise: m.devise, des: /(?:^|\s)(?:ab|dès|from)\s*$/i.test(t.slice(Math.max(0, m.i - 8), m.i)) };
  });
  return trouve;
}

/** Les écritures possibles d'un montant (1820.9 → « 1.820,90 », « 1'820.90 », « 1820,90 »…), pour le retrouver dans le texte. */
function ecritures(m: number): string[] {
  const [e, f] = m.toFixed(2).split('.');
  const groupes = (sep: string) => e.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  const out = new Set<string>();
  for (const sep of ['', '.', ',', "'", '’', ' ', ' ', ' ']) for (const dec of ['.', ',']) {
    if (sep === dec) continue;
    out.add(`${groupes(sep)}${dec}${f}`);
    if (f === '00') { out.add(`${groupes(sep)}${dec}–`); out.add(`${groupes(sep)}.-`); out.add(`${groupes(sep)}${dec}-`); }
  }
  if (f === '00') { out.add(groupes("'")); out.add(groupes('.')); out.add(e); }
  return [...out];
}
export function positionsMontant(visible: string, m: number): number[] {
  const out: number[] = [];
  for (const e of ecritures(m)) {
    let i = visible.indexOf(e);
    while (i >= 0 && out.length < 20) {
      const avant = visible[i - 1] ?? ' ', apres = visible[i + e.length] ?? ' ';
      if (!/\d/.test(avant) && !/\d/.test(apres) && !(apres === ',' || apres === '.') || /[–-]/.test(apres)) out.push(i);
      i = visible.indexOf(e, i + 1);
    }
  }
  return out;
}

/** TTC ou HT : schema.org d'abord, puis la mention écrite à côté du prix, puis le couple HT/TTC publié (prix × (1 + TVA)). */
function taxeDe(prix: number, visible: string, schema: boolean | undefined, notes = ''): { taxe?: 'ht' | 'ttc'; prixTTC?: number; detail?: string } {
  if (schema === true) return { taxe: 'ttc', detail: 'valueAddedTaxIncluded' };
  const ici = positionsMontant(visible, prix);
  for (const i of ici) {
    // Un autre montant tout près (avant ou après), égal au premier × (1 + un taux de TVA), avec une mention « taxe comprise » : le premier
    // est HT (gastro-held.ch : « CHF 1.968,39 CHF 1.820,90 CHF 1.968,39 inkl. MwSt. »).
    const fenetre = visible.slice(Math.max(0, i - 100), i + 140);
    for (const a of montantsDe(fenetre)) {
      const r = TAUX_TVA.find((t) => egal(a.montant, Math.round(prix * (1 + t) * 100) / 100));
      if (r !== undefined && DIT_TTC.test(fenetre)) return { taxe: 'ht', prixTTC: a.montant, detail: `TTC ${a.montant} publié (TVA ${Math.round(r * 1000) / 10} %)` };
    }
    const proche = visible.slice(i, i + 60);
    if (DIT_TTC.test(proche) && !DIT_HT.test(proche.split(DIT_TTC)[0])) return { taxe: 'ttc', detail: 'mention « taxe comprise »' };
    if (DIT_HT.test(proche)) return { taxe: 'ht', detail: 'mention « hors taxe »' };
    // Le libellé du prix précède parfois le montant : « Produktpreis (ohne MwSt.) CHF 1'620.00 » (baldinger.biz, banc 36).
    const avant = visible.slice(Math.max(0, i - 70), i);
    if (DIT_HT.test(avant) && !DIT_TTC.test(avant)) return { taxe: 'ht', detail: 'libellé « hors taxe » avant le prix' };
  }
  if (schema === false) return { taxe: 'ht', detail: 'valueAddedTaxIncluded: false' };
  /* T25-9 : une note de bas de page dit la taxe pour toute la boutique (« * Alle Preise inkl. gesetzlicher MwSt. », sios.ch). Dernier
     recours, après tout ce que la page dit près du prix : une mention « hors taxe » ailleurs la contredirait, alors rien n'est dit. */
  const page = `${visible} ${notes}`;
  if (NOTE_TTC.test(page) && !NOTE_HT.test(page)) return { taxe: 'ttc', detail: 'note de la page : tous les prix taxe comprise' };
  return {};
}
const NOTE_TTC = /(?:alle\s+preise|preise|tous\s+(?:nos\s+|les\s+)?prix|prix|all\s+prices|prices)\s+(?:sind\s+)?(?:inkl\.?|inklusive|incl\.?|including|include|TVA\s+(?:incluse|comprise)|TTC)[^.]{0,40}?(?:MwSt|USt|Mehrwertsteuer|VAT|TVA)/i;
const NOTE_HT = /(?:alle\s+preise|preise|tous\s+(?:nos\s+|les\s+)?prix|all\s+prices|prices)\s+(?:sind\s+)?(?:exkl\.?|zzgl\.?|zuzüglich|excl\.?|excluding|hors\s+TVA|HT|netto)/i;

// ---------------------------------------------------------------------------------------------------------------------------
// Photos et caractéristiques
// ---------------------------------------------------------------------------------------------------------------------------

const PAS_UNE_PHOTO = /no[-_]?image|placeholder|platzhalter|default[-_]?(?:image|product)|\bblank\b|spacer|\blogo\b|sprite|favicon|\bicon\b|1x1|pixel\.gif|loading\.gif/i;
const domaineRacine = (h: string) => h.split('.').slice(-2).join('.');

/** Une photo utilisable : https, jamais un logo ni une image « sans photo » (BL-12) ; http vers https sur l'hôte de la page (BL-5). */
function photo(brut: unknown, base: URL): string | undefined {
  const v = liste(brut)[0];
  const s = typeof v === 'string' ? v : v && typeof v === 'object' ? texte((v as Json).contentUrl ?? (v as Json).url, 2000) : undefined;
  if (!s || s.startsWith('data:') || PAS_UNE_PHOTO.test(s)) return undefined;
  try {
    const u = new URL(s.trim(), base);
    if (/\.svg(?:$|\?)/i.test(u.pathname)) return undefined;
    if (u.protocol === 'http:' && domaineRacine(u.hostname) === domaineRacine(base.hostname)) u.protocol = 'https:';
    return u.protocol === 'https:' ? u.href.slice(0, 2000) : undefined;
  } catch { return undefined; }
}
function photosDe(sources: unknown[], base: URL): string[] {
  const vues = new Set<string>(), out: string[] = [];
  for (const s of sources) for (const x of liste(s)) {
    const p = photo(x, base);
    if (!p) continue;
    const cle = p.replace(/[?#].*$/, '').replace(/[-_](?:\d{2,4}x\d{2,4}|small|medium|large|md|lg|sm|xl\d?)(?=\.\w+$)/i, '');
    if (vues.has(cle)) continue;
    vues.add(cle); out.push(p);
    if (out.length >= 12) return out;
  }
  return out;
}

/** Repli quand la page ne publie aucune photo en données : la galerie du produit dans le HTML (WooCommerce, thèmes classiques). Jamais les produits liés. */
function photosGalerie($: CheerioAPI, base: URL): string[] {
  const src: string[] = [];
  $('[class*="gallery" i] img, [class*="gallery" i] a[href], [id*="gallery" i] img, [class*="product-image" i] img, [class*="product__media" i] img, [class*="zoom" i] img').each((_, e) => {
    const el = $(e);
    if (el.closest('[class*="related" i], [class*="upsell" i], [class*="cross" i], [class*="similar" i], [class*="recommend" i]').length) return;
    for (const a of ['data-large_image', 'data-zoom-image', 'data-src', 'data-original', 'data-lazy-src', 'src', 'href']) {
      const v = el.attr(a);
      if (v && /\.(?:jpe?g|png|webp)(?:\?|$)/i.test(v)) {
        const w = v.match(/[-_](\d{2,4})x\d{2,4}\.\w+(?:\?|$)/);
        if (!w || Number(w[1]) >= 300) src.push(v);
        break;
      }
    }
  });
  return photosDe(src, base).slice(0, 6);
}

const NOM_CARACT = 60, VAL_CARACT = 100;
type Valeur = { nom: string; valeur: string; unite?: string };
const SECTION_SPECS = /spec|techn|merkmal|eigenschaft|attribut|caract|detail|datenblatt|feature|propert|daten|kenn|fiche|product-info|produktinfo/i;
/** L'en-tête d'un tableau (« Spezifikation | Wert ») n'est pas une caractéristique. */
const EN_TETE = /^(?:wert|werte|value|valeur|beschreibung|description|details?)$/i;
const LIGNE_NON = /^(?:preis|price|prix|menge|quantity|quantité|anzahl|bewertung|rating|warenkorb|panier|cart)$/i;

/** Les caractéristiques : `additionalProperty`, propriétés du produit (poids, dimensions…), tableaux et listes de la page. */
function caracteristiques(p: Json | null, $: CheerioAPI, amazon: boolean): Valeur[] {
  const out: Valeur[] = [];
  const vus = new Set<string>();
  const ajouter = (nom: string | undefined, valeur: string | undefined, unite?: string) => {
    const n = nom ? couper(nom.replace(/\s*[:：]\s*$/, ''), NOM_CARACT) : undefined;
    const v = valeur ? couper(valeur, VAL_CARACT) : undefined;
    if (!n || !v || n.length < 2 || LIGNE_NON.test(n) || EN_TETE.test(v) || norm(n) === norm(v) || vus.has(`${norm(n)}|${norm(v)}`)) return;
    /* T25-4 : ni argument de vente, ni phrase d'en-tête, ni « non publié » ; ni la même mesure sous un second nom (le premier reste) */
    if (bruitDeBoutique(n, v) || out.some((x) => memeMesure(x, { nom: n, valeur: v, ...(unite ? { unite } : {}) }))) return;
    // Un même nom avec une autre valeur reste : une page dit parfois « Gewicht 15 kg » (expédition) puis « Gewicht: 13.5kg » (appareil).
    vus.add(`${norm(n)}|${norm(v)}`);
    out.push({ nom: n, valeur: v, ...(unite ? { unite: couper(unite, 12) } : {}) });
  };
  if (p) {
    for (const x of liste<Json>(p.additionalProperty).slice(0, 30)) {
      const v = x?.value;
      ajouter(texte(x?.name, 80), typeof v === 'boolean' ? (v ? 'oui' : 'non') : texte(v, VAL_CARACT), texte(x?.unitText, 12));
    }
    const qv = (v: unknown) => { const o = liste<Json>(v)[0]; return o && typeof o === 'object' ? [texte(o.value), texte(o.unitText ?? o.unitCode, 12)] as const : [texte(v), undefined] as const; };
    for (const [k, nom] of [['weight', 'Poids'], ['width', 'Largeur'], ['height', 'Hauteur'], ['depth', 'Profondeur'], ['material', 'Matière'], ['color', 'Couleur'], ['size', 'Taille']] as const) {
      if (p[k] === undefined) continue;
      const [v, u] = qv(p[k]);
      ajouter(nom, v, u);
    }
  }
  const lignes = (sel: string) => {
    $(sel).each((_, t) => {
      const zone = [t, ...$(t).parents().slice(0, 4).toArray()].map((e) => `${$(e).attr('id') ?? ''} ${$(e).attr('class') ?? ''}`).join(' ');
      const titre = $(t).prevAll('h2, h3, h4, strong').first().text();
      if (!amazon && !SECTION_SPECS.test(zone) && !SECTION_SPECS.test(titre) && !/caract|technische|spezifikation|specification|produktdetails|details/i.test(titre)) return;
      $(t).find('tr').each((__, tr) => {
        const c = $(tr).children('th, td');
        if (c.length === 2) ajouter(compact(c.eq(0).text()), compact(c.eq(1).text()));
      });
      $(t).children('dt').each((__, dt) => ajouter(compact($(dt).text()), compact($(dt).nextAll('dd').first().text())));
    });
  };
  lignes('table, dl');
  // Listes « Nom : valeur » dans une zone de caractéristiques (ggmgastro, gastro-held, description de baldinger.biz).
  $('li').each((_, li) => {
    if (out.length >= LUES) return;
    const zone = $(li).parents().slice(0, 5).toArray().map((e) => `${$(e).attr('id') ?? ''} ${$(e).attr('class') ?? ''}`).join(' ');
    if (!SECTION_SPECS.test(zone)) return;
    const m = compact($(li).text()).match(/^([^:：]{2,40})\s*[:：]\s*(.{1,100})$/);
    if (m) ajouter(m[1], m[2]);
  });
  // Puces de description sans deux-points (« Max. Malzmenge 6 kg », « Braumenge 20 l fertiges Bier ») : le nom précède le premier nombre.
  $('li').each((_, li) => {
    if (out.length >= LUES || $(li).closest('nav, header, footer, aside').length) return;
    const zone = $(li).parents().slice(0, 6).toArray().map((e) => `${$(e).attr('id') ?? ''} ${$(e).attr('class') ?? ''}`).join(' ');
    if (!/descr|beschreib|tab-pane|tab-content|product-?(?:info|detail|text)|highlight/i.test(zone)) return;
    const m = compact($(li).text()).match(/^([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ.\- ]{2,35}?)\s+(\d[\d.,]*\s?(?:kg|g|l|ml|cl|liter|litres?|w|kw|v|mm|cm|m|bar|%|°c|stück|pcs).{0,70})$/i);
    /* C48-5 : « Température de 0 °C à 8 °C » est la température, pas une ligne nommée « Température de » : la préposition qui lie le nom à sa valeur n'est pas le nom */
    if (m) ajouter(m[1].replace(/\s+(?:de|du|des|d['’]|von|bis|à)$/i, ''), m[2]);
  });
  const desc =p ? liste(p.description).filter((x) => typeof x === 'string').join('\n') : '';
  for (const l of desc.split(/\r?\n|<br\s*\/?>/i).slice(0, 40)) {
    const m = compact(l).match(/^([A-Za-zÀ-ÿ][^:：]{1,30})\s*[:：]\s*(.{1,80})$/);
    if (m && /\d/.test(m[2])) ajouter(m[1], m[2]);
  }
  return out.slice(0, LUES);
}

// ---------------------------------------------------------------------------------------------------------------------------
// Livraison vers la Suisse
// ---------------------------------------------------------------------------------------------------------------------------

const LIVRAISON_GRATUITE = /(?:versandkostenfrei|kostenlose[rn]?\s+(?:versand|lieferung)|gratis(?:versand|lieferung)|livraison\s+(?:gratuite|offerte)|free\s+(?:shipping|delivery))/i;
const LIVRAISON_REFUSEE = /(?:keine|nicht)\s+(?:lieferung|versand|liefern)\s+(?:in\s+die|nach\s+der?)\s+schweiz|(?:ne\s+livr\w*\s+pas|aucune\s+livraison)\s+(?:en|vers\s+la)\s+suisse|(?:no|not)\s+(?:shipping|deliver\w*)\s+to\s+switzerland|nur\s+innerhalb\s+(?:deutschlands|österreichs)/i;

function livraisonCH(offres: Json[], visible: string, prix: number | undefined, devise: string | undefined, suisse: boolean): { l?: Livraison; doute?: string } {
  /* Le port est celui de l'OFFRE retenue (celle dont le prix est affiché), jamais le dernier ni le plus haut : hopfenmarkt.ch publie 4,90 pour
     50 et 100 g, 11,90 pour 250 g et plus (BL banc 33, 34). Sans offre au prix retenu, la première offre qui publie un port. */
  let schema: Livraison | undefined, schemaOffreChoisie = false;
  for (const o of offres) for (const d of liste<Json>(o.shippingDetails)) {
    const specs = liste<Json>(o.priceSpecification);
    const prixO = [o.price, o.lowPrice, ...specs.map((x) => x?.price)].map((b) => prixLocalise(typeof b === 'object' ? texte(b) : b)?.montant);
    const choisie = prix !== undefined && prixO.some((x) => x !== undefined && egal(x, prix));
    if (schema && (schemaOffreChoisie || !choisie)) continue;
    const pays = liste<Json>(d.shippingDestination).flatMap((x) => liste(x?.addressCountry).map((c) => String(typeof c === 'object' ? (c as Json).name ?? '' : c).toUpperCase()));
    if (pays.length && !pays.includes('CH')) continue;
    if (!pays.length && !suisse) continue;
    if (d.doesNotShip === true || d.doesNotShip === 'true') { schema = { refusee: true }; continue; }
    const r = liste<Json>(d.shippingRate)[0];
    const m = prixLocalise(texte(r?.value)) ?? (r?.value === 0 || r?.value === '0' ? { montant: 0 } : undefined);
    const dev = texte(r?.currency, 3) ?? devise;
    const lu: Livraison | undefined = m && m.montant === 0 ? { gratuite: true } : m && dev ? { prix: m.montant, devise: dev } : undefined;
    if (lu) { schema = lu; schemaOffreChoisie = choisie; }
  }
  if (LIVRAISON_REFUSEE.test(visible)) return { l: { refusee: true }, ...(schema && !schema.refusee ? { doute: 'la fiche du site dit une livraison en Suisse, la page la refuse' } : {}) };
  // Une gratuité écrite ne vaut pour la Suisse que sur une boutique suisse (ou si la page nomme la Suisse) et sous son seuil éventuel.
  let texteGratuit = false;
  const m = visible.match(LIVRAISON_GRATUITE);
  if (m && m.index !== undefined) {
    const suite = visible.slice(m.index, m.index + 70);
    const ailleurs = /innerhalb\s+(?:DE|AT|Deutschland|Österreich)|nach\s+(?:DE|AT)\b|en\s+France|within\s+(?:the\s+)?(?:UK|US|Australia)/i.test(suite);
    const seuil = suite.match(/\b(?:ab|dès|from|über|over)\s+(?:CHF\s*|Fr\.\s*|€\s*)?(\d+(?:[.,']\d+)*)/i);
    const seuilOk = !seuil || (prix !== undefined && prix >= (prixLocalise(seuil[1])?.montant ?? Infinity));
    texteGratuit = (suisse || /schweiz|suisse|switzerland/i.test(suite)) && !ailleurs && seuilOk;
  }
  if (texteGratuit) return { l: { gratuite: true }, ...(schema && !schema.gratuite ? { doute: `la fiche du site dit un port de ${schema.prix !== undefined ? montantDit(schema.prix) : ''} ${schema.devise ?? ''}, la page « livraison gratuite »` } : {}) };
  return { l: schema };
}

// ---------------------------------------------------------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------------------------------------------------------

const MATIERE_LIGNE = /^(?:Edelstahl|Inox|Acier inox(?:ydable)?|Stainless steel|Chromstahl|Kupfer|Cuivre|Aluminium)(?:[- ]?(?:AISI|V2A|V4A)?\s*\d{3}|\s+1\.4\d{3})?$/i;
const INDUCTION_NON = /^(?:nicht\s+f[üu]r\s+induktion\s+geeignet|ne\s+convient\s+pas\s+(?:à|pour)\s+l['’]?induction|pas\s+compatible\s+(?:avec\s+)?(?:l['’])?induction|not\s+(?:suitable|compatible)\s+for\s+induction)\.?$/i;
const INDUCTION_OUI = /^(?:induktion(?:s)?(?:geeignet|tauglich)|f[üu]r\s+induktion\s+geeignet|geeignet\s+f[üu]r\s+induktion|compatible\s+(?:avec\s+l['’])?induction|induction\s+compatible|suitable\s+for\s+induction)\.?$/i;
/**
 * E47-5 : la matière et la compatibilité induction, que les boutiques écrivent en puce ou en ligne seule (« Edelstahl AISI 304 », « Nicht für
 * Induktion geeignet ») sans « Nom : valeur ». Une ligne ENTIÈRE doit dire cela, hors navigation et pied de page : rien n'est déduit d'un mot
 * dans une phrase.
 */
/**
 * C48-5 : les puces d'une chambre froide (« Température de 0 °C à 8 °C », « Air pulsé », « 230V », « R290 ») n'ont ni deux-points ni libellé :
 * ce sont pourtant la température, le refroidissement, la tension et le fluide. Même règle que la matière : une ligne ENTIÈRE qui dit cela ;
 * un fluide frigorigène se reconnaît à sa désignation normalisée (R290, R600a, R404A…), jamais à « R » suivi d'un nombre quelconque.
 */
const TEMPERATURE_LIGNE = /^temp[ée]rature(?:\s+de\s+service)?(?:\s+(?:de|du|d['’])|\s*:)?\s*(-?\d[\d.,]*\s?°\s?C(?:\s*(?:à|a|bis|-|–)\s*[+-]?\d[\d.,]*\s?°\s?C)?)$/i;
const TENSION_LIGNE = /^(\d{3})\s?V(?:olts?)?(?:\s*[/~-]\s*\d{2}\s?Hz)?$/i;
const FLUIDE_LIGNE = /^R-?(?:22|32|134a|290|404a|407c|410a|448a|449a|452a|507a?|513a|600a?|717|744|1234yf|1234ze)$/i;
const REFROIDISSEMENT_LIGNE = /^(?:air pulsé|froid ventilé|refroidissement ventilé|ventilé|froid statique|refroidissement statique|umluftkühlung)$/i;
function essentielsDeLaPage($: CheerioAPI): Array<{ nom: string; valeur: string }> {
  const out: Array<{ nom: string; valeur: string }> = [];
  const poser = (nom: string, valeur: string) => { if (!out.some((x) => x.nom === nom)) out.push({ nom, valeur }); };
  $('body *').slice(0, 6000).each((_, e) => {
    const el = $(e);
    if (el.children().length || el.closest('nav, header, footer, script, style, noscript').length) return;
    const t = compact(el.text());
    if (t.length < 4 || t.length > 70) return;
    let m: RegExpMatchArray | null;
    if (t.length >= 5 && !out.some((x) => x.nom === 'Matière') && MATIERE_LIGNE.test(t)) out.push({ nom: 'Matière', valeur: t.replace(/^Edelstahl/i, 'Acier inox').replace(/^Chromstahl/i, 'Acier chromé').replace(/^Kupfer/i, 'Cuivre') });
    else if (t.length >= 5 && !out.some((x) => x.nom === 'Induction') && (INDUCTION_NON.test(t) || INDUCTION_OUI.test(t))) out.push({ nom: 'Induction', valeur: INDUCTION_NON.test(t) ? 'non' : 'oui' });
    else if ((m = t.match(TEMPERATURE_LIGNE))) poser('Température', compact(m[1]));
    else if ((m = t.match(TENSION_LIGNE))) poser('Tension', `${m[1]} V${/hz/i.test(t) ? ` ${t.replace(/^\d{3}\s?V(?:olts?)?\s*/i, '')}` : ''}`);
    else if (FLUIDE_LIGNE.test(t)) poser('Fluide frigorigène', t.toUpperCase().replace(/^R-/, 'R'));
    else if (REFROIDISSEMENT_LIGNE.test(t)) poser('Refroidissement', t);
  });
  return out;
}
const SUR_COMMANDE  = /auf\s+bestellung|sur\s+commande|on\s+(?:back)?order|backorder/i;
const DELAI_EXPEDITION = /(?:wird\s+in|versendet\s+(?:in|innerhalb\s+von)|lieferzeit\s*:?|expédi\w*\s+(?:sous|dans|en)|livr\w*\s+(?:sous|dans|en)|ships?\s+(?:in|within)|delivery\s+(?:in|within))\s*(?:ca\.?\s*)?(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?\s*(Tag\w*|Werktag\w*|Woche\w*|jours?|semaines?|days?|weeks?)/i;
/** « Dieses Produkt wird in 28 Tagen versendet » → « expédié sous 28 jours » : le délai écrit par la page, dans ses mots français ; rien si la page n'en écrit pas. */
function delaiExpedition(visible: string): string | undefined {
  const m = visible.match(DELAI_EXPEDITION);
  if (!m) return undefined;
  const n = m[2] ? `${m[1]} à ${m[2]}` : m[1];
  const semaines = /^(?:woche|semaine|week)/i.test(m[3]);
  const plusieurs = m[2] ? true : Number(m[1]) > 1;
  return `expédié sous ${n} ${semaines ? 'semaine' : 'jour'}${plusieurs ? 's' : ''}`;
}
const RETIRE = /nicht\s+mehr\s+(?:verfügbar|lieferbar|erhältlich)|plus\s+disponible|n['’]est\s+plus\s+disponible|no\s+longer\s+available|discontinued|ausgelistet/i;
const LISTE_PRIX = /ListPrice|StrikethroughPrice|SRP|MSRP|InvoicePrice|SalePrice_none/i;

/** T28-9 : d'où viennent les prix, dit en mots du brasseur (la fiche produit du site est la source normale, donc muette). */
const SOURCE_PRIX_DITE: Record<string, string> = { 'Open Graph': ' (annonce du site)', 'bloc d\'achat': ' (bloc d\'achat de la page)', 'page (sous le titre)': ' (lu sous le titre de la page)', 'page (bloc de prix)': ' (lu dans le bloc de prix de la page)' };

/**
 * « 20 caractéristiques » ; « 8 caractéristiques : 5 du tableau de la page, 1 du nom » (T28-9 : ni « HTML » ni « données embarquées » ; T30-9 : en mots
 * du brasseur, jamais « 8 mesures : 8 ailleurs dans la page »). La provenance ne se détaille que si elle varie : tout au même endroit ne se redit pas.
 */
function detailCaract(total: number, tableau: number, duNom: number): string {
  const ailleurs = Math.max(0, total - tableau - duNom);
  const sources = [tableau, ailleurs, duNom].filter((n) => n > 0).length;
  const d = sources < 2 ? [] : [tableau ? `${tableau} du tableau de la page` : '', ailleurs ? `${ailleurs} ailleurs dans la page` : '', duNom ? `${duNom} du nom` : ''].filter(Boolean);
  return `${total} caractéristique${total > 1 ? 's' : ''}${d.length ? ` : ${d.join(', ')}` : ''}`;
}

export function extraireProduit(html: string, url: URL): Extraction {
  const $ = load(html);
  const s = structure(html, $, url);
  const meta = (k: string) => s.meta.get(k);
  const amazon = /(^|\.)amazon\.[a-z.]+$/i.test(url.hostname);
  const h1 = compact(amazon ? $('#productTitle').first().text() || $('h1').first().text() : $('h1').first().text());
  const ogTitre = meta('og:title') ?? '';
  const visible = texteVisible($);
  const suisse = /\.ch$/i.test(url.hostname) || /[/-]ch(?:[-_/]|$)/i.test(url.pathname.split('/')[1] ?? '');
  const p = principal(s, h1, ogTitre, url);
  const etapes: EtapeLecture[] = [];
  const doutes: string[] = [];
  /* T28-9 : l'écran parle brasseur. Jamais « schema.org », « microdata » ni « JSON-LD » : la page publie, ou non, la fiche de son produit. */
  etapes.push(p ? { nom: 'donnees', statut: 'trouve', detail: 'fiche produit publiée par le site' } : { nom: 'donnees', statut: 'absent', detail: 'le site ne publie pas de fiche produit' });

  // Nom, marque comprise (BL-9) ; repli : og:title, h1, puis <title> sans le nom de la boutique.
  const site = norm(meta('og:site_name') ?? url.hostname.replace(/^www\./, '').split('.')[0]);
  const marque = texte(liste<Json>(p?.brand)[0]?.name ?? p?.brand, 60) ?? meta('og:brand') ?? meta('product:brand');
  let nom = amazon && h1 ? h1 : texte(p?.name, 300) ?? (h1 || undefined) ?? (ogTitre || undefined);
  if (nom && /^(?:brauen\.de|home|startseite|accueil)$/i.test(nom) && h1) nom = h1;
  /* T25-3 : le titre de la page prolonge le nom des données de quelques mots (« Mosaic » → « Mosaic Hopfenpellets ») : c'est le nom que le
     brasseur lit sur la page. Un titre bien plus long (slogan, description) ne remplace rien. */
  if (nom && h1 && !amazon && norm(h1).startsWith(`${norm(nom)} `) && h1.length <= 100 && h1.split(' ').length - nom.split(' ').length <= 3) nom = h1;
  if (nom && marque && !norm(nom).includes(norm(marque).split(' ')[0]) && !site.includes(norm(marque).split(' ')[0]) && !norm(marque).includes(site)) {
    nom = `${marque.length > 20 ? marque.split(' ')[0] : marque} ${nom}`;
  }

  // Prix : les offres du produit (variante désignée par l'adresse d'abord), sinon og/product:, sinon le bloc d'achat sous le titre.
  const offresBrutes: Json[] = [];
  const variante = url.searchParams.get('variant');
  const variantes = liste<Json>(p?.hasVariant);
  let choisie = variante ? variantes.find((v) => [texte(v.url, 2000), texte(v.sku), texte(v['@id'], 2000)].some((x) => x?.includes(variante))) : undefined;
  /* T25-1 : sans variante désignée par l'adresse, la page montre celle qu'elle a choisie par défaut (hopfenmarkt.ch : 100 g à 7,25 CHF, le
     JSON-LD commençant à 50 g, 3,90). Le prix écrit sous le titre la désigne ; la moins chère n'est jamais prise à sa place. */
  const prixOffre = (o: Json) => { const specs = liste<Json>(o?.priceSpecification); const b = o?.price ?? o?.lowPrice ?? specs[0]?.price; return prixLocalise(typeof b === 'object' ? texte(b) : b)?.montant; };
  let variantesDites = false;
  if (!choisie && variantes.length > 1 && (h1 || nom)) {
    const vu = prixSousTitre(visible, h1 || nom!);
    const prixVariantes = new Set(variantes.flatMap((v) => liste<Json>(v.offers).map(prixOffre)).filter((x): x is number => x !== undefined).map((x) => Math.round(x * 100)));
    if (vu && prixVariantes.size > 1) {
      const candidates = variantes.filter((v) => liste<Json>(v.offers).some((o) => { const x = prixOffre(o); return x !== undefined && egal(x, vu.montant); }));
      if (candidates.length) { choisie = candidates[0]; variantesDites = true; }
    }
  }
  for (const o of liste<Json>(choisie?.offers ?? p?.offers)) offresBrutes.push(o);
  if (!choisie) for (const v of variantes) offresBrutes.push(...liste<Json>(v.offers));
  const offres: Json[] = [];
  const deplier = (o: Json, prof = 0) => { if (!o || typeof o !== 'object') return; offres.push(o); if (prof < 2) liste<Json>(o.offers).forEach((x) => deplier(x, prof + 1)); };
  offresBrutes.forEach((o) => deplier(o));
  const montants: Array<{ montant: number; devise?: string; tva?: boolean; agrege?: boolean }> = [];
  for (const o of offres) {
    const specs = liste<Json>(o.priceSpecification).filter((x) => !LISTE_PRIX.test(String(x?.priceType ?? '')) && !x?.referenceQuantity);
    const devO = texte(o.priceCurrency, 3) ?? specs.map((x) => texte(x.priceCurrency, 3)).find(Boolean);
    const tva = specs.map((x) => x.valueAddedTaxIncluded).map((v) => v === true || v === 'true' ? true : v === false || v === 'false' ? false : undefined).find((v) => v !== undefined);
    const bruts = [o.price, o.lowPrice, ...(o.price === undefined && o.lowPrice === undefined ? specs.map((x) => x.price) : [])];
    for (const b of bruts) {
      const m = prixLocalise(typeof b === 'object' ? texte(b) : b);
      if (m) montants.push({ montant: m.montant, devise: devO ?? m.devise ?? meta('product:price:currency') ?? meta('og:price:currency'), tva, agrege: types(o).includes('AggregateOffer') });
    }
  }
  let prix: number | undefined, devise: string | undefined, prixDes = false, tvaSchema: boolean | undefined, sourcePrix = '';
  const devises = new Set(montants.map((m) => m.devise));
  if (montants.length && devises.size === 1 && [...devises][0]) {
    const min = montants.reduce((a, b) => (b.montant < a.montant ? b : a));
    prix = min.montant; devise = min.devise; tvaSchema = min.tva; sourcePrix = 'schema.org';
    /* « Dès » : des prix différents ; ou une AggregateOffer dont on ne lit que le bas de la fourchette (son plafond `highPrice` est plus haut que
       lui, ou n'est pas écrit). Un plafond égal au plancher est un prix unique, sans « dès ». */
    const plafondPlusHaut = (o: Json) => { const h = prixLocalise(typeof o.highPrice === 'object' ? texte(o.highPrice) : o.highPrice); return h !== undefined && h.montant > min.montant + 0.005; };
    prixDes = new Set(montants.map((m) => m.montant)).size > 1 || (min.agrege === true && offres.some((o) => types(o).includes('AggregateOffer') && o.offers === undefined && (o.highPrice === undefined || plafondPlusHaut(o))));
  } else if (devises.size > 1) doutes.push('plusieurs devises dans les offres');
  if (prix === undefined) {
    const m = prixLocalise(meta('product:price:amount') ?? meta('og:price:amount')), d = m?.devise ?? meta('product:price:currency') ?? meta('og:price:currency');
    if (m && d) { prix = m.montant; devise = d; sourcePrix = 'Open Graph'; }
  }
  if (prix === undefined && amazon) {
    const j = html.match(/"desktop_buybox_group_1"\s*:\s*\[\s*\{[^}]*?"priceAmount"\s*:\s*([\d.]+)\s*,\s*"currencySymbol"\s*:\s*"([^"]+)"/);
    const m = j ? prixLocalise(`${j[1]} ${j[2]}`) : undefined;
    if (m?.devise) { prix = m.montant; devise = m.devise; sourcePrix = 'bloc d\'achat'; }
  }
  if (prix === undefined && (h1 || nom)) {
    const m = prixSousTitre(visible, h1 || nom!);
    if (m) { prix = m.montant; devise = m.devise; prixDes = m.des; sourcePrix = 'page (sous le titre)'; }
  }
  if (prix === undefined) {
    const m = prixDuBloc($);
    if (m) { prix = m.montant; devise = m.devise; prixDes = m.des; sourcePrix = 'page (bloc de prix)'; }
  }

  // Contrôle du prix : un prix des données structurées doit se lire sur la page ; sinon il est douteux (jamais retiré en silence).
  let prixDouteux: string | undefined;
  if (prix !== undefined && sourcePrix === 'schema.org' && visible.length > 500 && !positionsMontant(visible, prix).length) {
    const vu = h1 ? prixSousTitre(visible, h1) : undefined;
    if (vu && vu.devise === devise && !egal(vu.montant, prix)) prixDouteux = `la fiche du site dit ${montantDit(prix)} ${devise}, la page ${montantDit(vu.montant)} ${vu.devise}`;
  }
  /* la note de taxe d'une boutique vit souvent dans son pied de page (retiré du texte visible) : lue à part, jamais pour un autre usage */
  const notesTaxe = prix !== undefined ? compact($('[class*="footnote" i], [class*="vat" i], [class*="mwst" i], footer').map((_, e) => $(e).text()).get().filter((t) => /MwSt|USt|VAT|TVA|Mehrwertsteuer/i.test(t)).slice(0, 6).join(' ')) : '';
  const taxe = prix !== undefined ? taxeDe(prix, visible, tvaSchema, notesTaxe) : {};
  etapes.push(prix !== undefined
    ? { nom: 'prix', statut: prixDouteux ? 'douteux' : 'trouve', detail: prixDouteux ?? `prix ${montantDit(prix)} ${devise}${prixDes ? ' (dès)' : ''}${SOURCE_PRIX_DITE[sourcePrix] ?? ''}` }
    : { nom: 'prix', statut: 'absent' });
  if (prixDouteux) doutes.push(`prix : ${prixDouteux}`);

  // Disponibilité : schema.org, puis la page (« plus disponible », BL-15).
  const dispos = new Set(offres.filter((o) => !types(o).includes('AggregateOffer')).map((o) => String(texte(o.availability, 80) ?? '')));
  const dispoSchema = dispos.size === 1 ? [...dispos][0] : (meta('product:availability') ?? meta('og:availability') ?? '');
  const stock = stockStatus('', dispoSchema.replace(/\s+/g, ''));
  const retire = /Discontinued/i.test(dispoSchema) || (RETIRE.test(visible.slice(0, 6000)) && !offres.length);
  /* E47-1 : « sur commande » (schema.org PreOrder / BackOrder, ou « Auf Bestellung » sur une page muette) n'est pas une rupture : l'article se commande ; le délai est celui que la page écrit. */
  const surCommande = !retire && (/PreOrder|BackOrder|PreSale/i.test(dispoSchema) || (!/InStock|OutOfStock|SoldOut/i.test(dispoSchema) && SUR_COMMANDE.test(visible.slice(0, 8000)) && delaiExpedition(visible.slice(0, 8000)) !== undefined));
  const dispoDelai = surCommande ? delaiExpedition(visible.slice(0, 8000)) : undefined;
  const dispo = retire ? 'retire' as const : surCommande ? 'sur-commande' as const : stock === 'in_stock' ? 'en-stock' as const : stock === 'out_of_stock' ? 'rupture' as const : undefined;

  const { l: livraison, doute: douteLivraison } = livraisonCH(offres, visible, prix, devise, suisse);
  if (douteLivraison) doutes.push(`port : ${douteLivraison}`);
  etapes.push(devise
    ? { nom: 'devise-frais', statut: douteLivraison ? 'douteux' : 'trouve', detail: [taxe.taxe === 'ttc' ? 'taxe comprise' : taxe.taxe === 'ht' ? 'hors taxe' : '', livraison?.refusee ? 'pas de livraison en Suisse' : livraison?.gratuite ? 'port gratuit' : livraison?.prix !== undefined ? `frais de port ${montantDit(livraison.prix)} ${livraison.devise ?? devise}` : 'frais de port non publiés'].filter(Boolean).join(' · ') }
    : { nom: 'devise-frais', statut: 'absent' });

  const sourcesPhotos: unknown[] = [p?.image, choisie?.image, ...variantes.slice(0, 3).map((v) => v.image)];
  if (amazon) {
    const img = $('#landingImage');
    sourcesPhotos.push(img.attr('data-old-hires'));
    try { sourcesPhotos.push(Object.keys(JSON.parse(img.attr('data-a-dynamic-image') ?? '{}'))); } catch { /* attribut illisible */ }
  }
  sourcesPhotos.push(meta('og:image:secure_url'), meta('og:image'), meta('twitter:image'));
  let photos = photosDe(sourcesPhotos, url);
  const depuisGalerie = !photos.length ? photosGalerie($, url) : [];
  if (depuisGalerie.length) photos = depuisGalerie;
  etapes.push(photos.length ? { nom: 'photos', statut: 'trouve', detail: `${photos.length}${depuisGalerie.length ? ' (galerie de la page)' : ''}` } : { nom: 'photos', statut: 'absent' });

  const valeurs = caracteristiques(p, $, amazon);
  if (variantesDites) {
    /* Les variantes proposées, telles que la page les publie ; celle dont le prix est affiché est dite, comme celles qui sont épuisées. */
    const dites = variantes.map((v) => {
      const lib = texte(v.size, 30) ?? texte(v.name, 80)?.split(/\s[–—-]\s/).pop();
      const epuisee = liste<Json>(v.offers).some((o) => /OutOfStock|SoldOut|Discontinued/i.test(String(o?.availability ?? '')));
      return lib ? `${lib}${v === choisie ? ' (affichée)' : ''}${epuisee ? ' (épuisé)' : ''}` : undefined;
    }).filter((x): x is string => !!x);
    if (dites.length > 1 && valeurs.length < LUES) valeurs.push({ nom: 'Variantes', valeur: couper(dites.join(' · '), VAL_CARACT) });
  }
  if (amazon) $('#productDetails_techSpec_section_1 tr, #productOverview_feature_div tr, #technicalSpecifications_section_1 tr').each((_, tr) => {
    const c = $(tr).children('th, td');
    if (c.length === 2 && valeurs.length < LUES) {
      const n = compact(c.eq(0).text()), v = compact(c.eq(1).text());
      if (n && v && !valeurs.some((x) => norm(x.nom) === norm(n))) valeurs.push({ nom: couper(n, NOM_CARACT), valeur: couper(v, VAL_CARACT) });
    }
  });
  /* Marches « plateforme » synchrones (avant l'IA) : ce que la page publie ailleurs que dans ses tableaux. Les valeurs trouvées dans
     le HTML restent ; on n'ajoute que les noms manquants. 1. données embarquées (__NEXT_DATA__ …) ; 2. « Nom : valeur » des
     descriptions ; 3. mesures écrites dans le nom du produit. */
  const descriptions = [meta('description'), meta('og:description'), ...liste(p?.description).filter((x): x is string => typeof x === 'string')];
  const dHtml = valeurs.length;
  const embarquees = valeursDonneesEmbarquees(html);
  const depuisDescriptions = descriptions.flatMap((d) => pairesDeTexte(d));
  let fusion = completerValeurs(valeurs, [...embarquees, ...depuisDescriptions], LUES);
  let dNom = 0;
  { const n = completerValeurs(fusion.valeurs, mesuresDuNom(nom), LUES); fusion = n; dNom = n.ajoutees; }
  fusion = completerValeurs(fusion.valeurs, essentielsDeLaPage($), LUES);
  /* C48-5 : le plafond se prend APRÈS le tri de l'essentiel (température, volume, matière, énergie, fluide…), jamais dans l'ordre de la page */
  const lues = fusion.valeurs as Valeur[];
  const gardees = retenir(lues, GARDEES, (v) => libelleFrancais(v.nom));
  valeurs.splice(0, valeurs.length, ...gardees);
  etapes.push(valeurs.length
    ? { nom: 'caract', statut: 'trouve', detail: detailCaract(valeurs.length, dHtml, dNom) }
    : { nom: 'caract', statut: 'absent' });

  const vendeur = texte(liste<Json>(offres[0]?.seller)[0]?.name, 80) ?? meta('og:site_name');
  etapes.push(doutes.length ? { nom: 'controle', statut: 'douteux', detail: doutes.join(' ; ') } : { nom: 'controle', statut: 'trouve' });

  return {
    ...(nom ? { nom: couper(nom, 180) } : {}),
    ...(prix !== undefined && devise ? { prix, devise, ...(prixDes ? { prixDes: true as const } : {}) } : {}),
    ...(prix !== undefined && taxe.taxe ? { taxe: taxe.taxe } : {}),
    ...(taxe.prixTTC !== undefined ? { prixTTC: taxe.prixTTC } : {}),
    ...(dispo ? { dispo } : {}),
    ...(dispoDelai ? { dispoDelai } : {}),
    ...(vendeur ? { vendeur: couper(vendeur, 80) } : {}),
    photos, valeurs,
    ...(livraison ? { livraison } : {}),
    etapes
  };
}
