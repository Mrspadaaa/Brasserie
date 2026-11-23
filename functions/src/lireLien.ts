import { load } from 'cheerio/slim';
import { stockStatus } from './brewerSuppliers.js';
import type { PageLue } from './carnetIA.js';

/**
 * Carnet d'idées (lot B) : `lireLien`, la lecture d'un lien collé, **sans modèle** (comme `assemblerLecture`, D380). Un lien collé
 * montre l'objet (D-27) : nom, prix, devise, disponibilité (D-22), vendeur, photo et valeurs publiées. Ce qui n'est pas lu reste vide
 * (G16) ; une page sans métadonnées rend `illisible` et rien d'autre (« lien · page non lue »).
 *
 * État de l'art (MISSION.md, « Aperçu de lien ») : schema.org `Product`/`Offer` en ld+json et Open Graph, côté serveur (CORS), robots.txt
 * respecté (RFC 9309), cheerio déjà présent. On reprend de `brewerSuppliers.ts` la lecture de la disponibilité (`stockStatus`), le
 * patron de corps borné et la lecture prudente de robots. `supplierUrl` et `supplierRobotsAllowed` n'y sont pas réutilisés tels quels :
 * ils n'acceptent que huit boutiques de brassage, alors qu'un carnet vise tout commerce (un évier, une hotte, une pompe…).
 *
 * Bornes : 8 s pour tout (robots compris), 1,5 Mo de page, 128 ko de robots, 3 redirections, https seulement, aucun hôte local ni
 * adresse IP, aucun identifiant ni port, aucune page de panier ou de compte. Robots refusé ou illisible : la page n'est jamais demandée.
 */

export const LIEN_DELAI_MS = 8000;
export const LIEN_TAILLE_MAX = 1_500_000;
export const ROBOTS_TAILLE_MAX = 128_000;
const REDIRECTIONS_MAX = 3;
export const AGENT_CARNET = 'LaffineeCarnet/1.0';

const compact = (t: string) => t.replace(/\s+/g, ' ').trim();
const domaineDe = (u: URL) => u.hostname.replace(/^www\./, '');
const chaine = (v: unknown, max = 200): string | undefined => typeof v === 'string' && compact(v) ? compact(v).slice(0, max) : undefined;

/** Une adresse qu'on accepte de lire : https public, sans identifiant, port, IP ni page d'action. `null` sinon. */
export function urlLisible(raw: unknown): URL | null {
  if (typeof raw !== 'string' || raw.length > 2000) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const h = url.hostname.toLowerCase();
    // Aucune adresse IP (v4 ou v6), aucun hôte local ou interne : la fonction ne doit jamais servir à sonder le réseau du serveur.
    if (/^[\d.]+$/.test(h) || h.includes(':') || h.startsWith('[') || !h.includes('.')) return null;
    if (/(^|\.)(localhost|local|internal|localdomain|home|lan|corp|intranet)$/.test(h) || h === 'metadata.google.internal') return null;
    if (/(?:^|\/)(?:cart|checkout|basket|panier|warenkorb|kasse|account|login|logout|wishlist|order|admin)(?:\/|$)/i.test(url.pathname)) return null;
    url.hash = '';
    return url;
  } catch { return null; }
}

/**
 * robots.txt selon la RFC 9309 : groupe du robot le plus précis (sinon `*`), règle la plus longue, `Allow` gagne à longueur égale,
 * `*` et `$` compris. `Content-Signal: ai-input=no` refuse aussi (même prudence que `brewerSuppliers.ts`).
 */
export function robotsPermet(texte: string, url: URL, agent = AGENT_CARNET): boolean {
  type Groupe = { agents: string[]; regles: Array<{ permis: boolean; chemin: string }>; iaRefusee: boolean };
  const groupes: Groupe[] = [];
  let g: Groupe | undefined;
  let directives = false;
  for (const brut of texte.split(/\r?\n/)) {
    const ligne = brut.replace(/#.*$/, '').trim();
    const i = ligne.indexOf(':');
    if (i < 0) continue;
    const cle = ligne.slice(0, i).trim().toLowerCase(), valeur = ligne.slice(i + 1).trim();
    if (cle === 'user-agent') {
      if (!g || directives) { g = { agents: [], regles: [], iaRefusee: false }; groupes.push(g); directives = false; }
      g.agents.push(valeur.toLowerCase());
    } else if (g && (cle === 'allow' || cle === 'disallow')) {
      directives = true;
      if (valeur) g.regles.push({ permis: cle === 'allow', chemin: valeur });
    } else if (g && cle === 'content-signal') {
      directives = true;
      if (/\bai-input\s*=\s*no\b/i.test(valeur)) g.iaRefusee = true;
    }
  }
  const nom = agent.toLowerCase().split('/')[0];
  const score = (x: Groupe) => Math.max(-1, ...x.agents.map((a) => a === '*' ? 0 : nom.includes(a) ? a.length : -1));
  const meilleur = Math.max(-1, ...groupes.map(score));
  const choisis = groupes.filter((x) => score(x) === meilleur && meilleur >= 0);
  if (choisis.some((x) => x.iaRefusee)) return false;
  const chemin = url.pathname + url.search;
  const ok = choisis.flatMap((x) => x.regles).filter((r) => {
    const motif = r.chemin.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$');
    try { return new RegExp('^' + motif).test(chemin); } catch { return !r.permis; }
  }).sort((a, b) => b.chemin.replace(/\*/g, '').length - a.chemin.replace(/\*/g, '').length || Number(b.permis) - Number(a.permis));
  return ok[0]?.permis ?? true;
}

type Json = Record<string, unknown>;

/**
 * État de l'art (Chasse Carnet, V1, L29) : lire un montant écrit sans locale (« 4'890.00 », « 4 890,00 », « 4,890.00 », « CHF 1'250.– »).
 * Problème d'école : l'extraction de prix. `Intl.NumberFormat` ne lit pas ; `@internationalized/number` exige une locale que la page ne
 * donne pas (et un paquet de plus à déployer) ; schema.org dit « point décimal, sans séparateur de milliers » mais les boutiques
 * l'enfreignent. Méthode standard des extracteurs de prix : l'heuristique du dernier séparateur, écrite ici une fois :
 *  - groupes d'apostrophes, d'espaces, NBSP ou U+202F : milliers, de 3 chiffres (le premier de 1 à 3) ;
 *  - le dernier « . » ou « , » est décimal s'il est suivi de 1 ou 2 chiffres, ou si l'autre séparateur le précède ;
 *  - un seul séparateur suivi de 3 chiffres, après un entier de 1 à 3 chiffres non nul : milliers (« 4,890 », « 4.890 ») ;
 *  - tout le reste (zéro, négatif, deux nombres, groupes faux, texte) : `undefined`, jamais un nombre deviné.
 * La devise écrite avec le prix (CHF, EUR, USD, GBP, Fr., SFr, €, £) est rendue ; deux devises différentes : `undefined`.
 */
const DEVISES_ECRITES: Array<[RegExp, string]> = [[/CHF|SFr\.?|Fr\./gi, 'CHF'], [/EUR|€/gi, 'EUR'], [/USD/gi, 'USD'], [/GBP|£/gi, 'GBP']];
export function prixLocalise(v: unknown): { montant: number; devise?: string } | undefined {
  if (typeof v === 'number') return Number.isFinite(v) && v > 0 ? { montant: v } : undefined;
  if (typeof v !== 'string' || v.length > 60) return undefined;
  let s = v.replace(/[  \s]+/g, ' ').replace(/’/g, "'").trim();
  const devs = new Set<string>();
  for (const [re, code] of DEVISES_ECRITES) { if (re.test(s)) devs.add(code); re.lastIndex = 0; s = s.replace(re, ' '); }
  if (devs.size > 1) return undefined;
  s = s.replace(/\s+/g, ' ').replace(/[.,]?\s*[–—-]+\s*$/, '').trim();
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

/** Décode les entités HTML d'une chaîne du JSON-LD (« l&apos;isolation »), une fois, après `JSON.parse` ; l'inconnu reste tel quel. */
const decoder = (t: string) => t.includes('&') ? load('<i>' + t.replace(/</g, '&lt;') + '</i>').text() : t;
function decoderJson(v: unknown, prof = 0): unknown {
  if (typeof v === 'string') return decoder(v);
  if (prof > 6 || !v || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map((x) => decoderJson(x, prof + 1));
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, decoderJson(x, prof + 1)]));
}

const types = (v: Json) => [v['@type']].flat().map(String);

/** Les `Product` de la page (ld+json, `@graph` et `mainEntity` compris), jamais ceux d'une liste de catégorie. */
function produits($: ReturnType<typeof load>): Json[] {
  const out: Json[] = [];
  const parcourir = (v: unknown, prof = 0) => {
    if (!v || prof > 4) return;
    if (Array.isArray(v)) { v.slice(0, 50).forEach((x) => parcourir(x, prof + 1)); return; }
    if (typeof v !== 'object') return;
    const o = v as Json;
    if (types(o).includes('ItemList')) return;
    if (types(o).some((t) => t === 'Product' || t === 'ProductGroup')) out.push(o);
    if (o['@graph']) parcourir(o['@graph'], prof + 1);
    if (o.mainEntity) parcourir(o.mainEntity, prof + 1);
  };
  $('script[type="application/ld+json"]').slice(0, 20).each((_, el) => {
    try { parcourir(decoderJson(JSON.parse($(el).text()))); } catch { /* Un schéma invalide n'est pas une preuve. */ }
  });
  return out;
}

const normal = (t: string) => compact(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const nombre = (v: unknown): number | undefined => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && /^\s*\d+(?:[.,]\d+)?\s*$/.test(v) ? Number(v.replace(',', '.')) : NaN;
  return Number.isFinite(n) && n > 0 ? n : undefined;
};
const devise = (v: unknown) => typeof v === 'string' && /^[A-Z]{3}$/.test(v.trim()) ? v.trim() : undefined;

/** La photo : une URL, un `ImageObject` (`url` ou `contentUrl`) ou une liste de l'un ou l'autre (Shopify, 23.11 : gastro-held.ch). */
function image(v: unknown, base: URL, prof = 0): string | undefined {
  if (Array.isArray(v)) return prof ? undefined : v.slice(0, 5).map((x) => image(x, base, 1)).find(Boolean);
  const brut = typeof v === 'string' ? v : v && typeof v === 'object' ? (v as Json).url ?? (v as Json).contentUrl : undefined;
  if (typeof brut !== 'string' || !brut.trim()) return undefined;
  try { const u = new URL(brut.trim(), base); return u.protocol === 'https:' ? u.href.slice(0, 2000) : undefined; } catch { return undefined; }
}

/**
 * Lecture pure d'une page (testée sur des fichiers HTML locaux). Ordre : schema.org d'abord, Open Graph ensuite, `<title>` seulement en
 * repli du nom quand la page porte d'autres métadonnées produit. Plusieurs prix (`AggregateOffer`, offres ou variantes de prix différents) : le plus bas
 * avec `prixDes` (« dès »), jamais une variante choisie à sa place ; deux devises ou aucune devise : aucun prix.
 */
export function lirePage(html: string, url: URL, luLe = Date.now()): PageLue {
  const $ = load(html);
  const meta = (p: string) => chaine($(`meta[property="${p}"], meta[name="${p}"]`).first().attr('content'));
  const base: PageLue = { url: url.href, domaine: domaineDe(url), statut: 'illisible', luLe };
  const tous = produits($);
  const titreH1 = normal($('h1').first().text());
  const ogTitre = meta('og:title');
  const p = tous.length === 1 ? tous[0]
    : tous.find((x) => typeof x.name === 'string' && [titreH1, normal(ogTitre ?? '')].includes(normal(x.name))) ?? null;

  const metaDev = devise(meta('product:price:currency') ?? meta('og:price:currency'));
  let prix: number | undefined, dev: string | undefined, dispoSchema = '', vendeur: string | undefined, prixDes = false;
  if (p) {
    const liste = (v: unknown) => [v].flat().filter((o): o is Json => !!o && typeof o === 'object');
    const offres = [...liste(p.offers), ...liste(p.hasVariant).flatMap((x) => liste(x.offers))];
    const montants: Array<{ montant: number; devise?: string }> = [];
    let sansPlafond = false;
    const lireOffre = (o: Json, profondeur = 0) => {
      const spec = liste(o.priceSpecification);
      const devOffre = devise(o.priceCurrency) ?? spec.map((x) => devise(x.priceCurrency)).find(Boolean);
      for (const b of [o.price, o.lowPrice, o.highPrice, ...spec.map((x) => x.price)]) {
        const m = prixLocalise(b);
        if (m) montants.push({ montant: m.montant, devise: devOffre ?? m.devise ?? metaDev });
      }
      if (types(o).includes('AggregateOffer') && o.highPrice === undefined && o.offers === undefined) sansPlafond = true;
      if (profondeur < 2) liste(o.offers).forEach((x) => lireOffre(x, profondeur + 1));
    };
    offres.forEach((o) => lireOffre(o));
    const devises = new Set(montants.map((m) => m.devise)), unique = [...devises][0];
    if (montants.length && devises.size === 1 && unique !== undefined) {
      prix = Math.min(...montants.map((m) => m.montant)); dev = unique;
      prixDes = sansPlafond || new Set(montants.map((m) => m.montant)).size > 1;
    }
    const simples = offres.filter((o) => !types(o).includes('AggregateOffer'));
    const dispos = new Set(simples.map((o) => String(o.availability ?? '')));
    if (dispos.size === 1) dispoSchema = [...dispos][0];
    const s = simples[0]?.seller as Json | undefined;
    vendeur = chaine(s?.name, 80);
  }
  if (prix === undefined) {
    const m = prixLocalise(meta('product:price:amount') ?? meta('og:price:amount')), d = m?.devise ?? metaDev;
    if (m && d !== undefined) { prix = m.montant; dev = d; }
  }
  if (!dispoSchema) dispoSchema = meta('product:availability') ?? meta('og:availability') ?? '';
  const statutStock = dispoSchema ? stockStatus('', dispoSchema.replace(/\s+/g, '')) : 'unknown';
  // og:image peut être en http (gastro-held.ch) : sa variante og:image:secure_url d'abord.
  const photo = image(p?.image, url) ?? image(meta('og:image:secure_url'), url) ?? image(meta('og:image'), url);
  const metaProduit = !!p || !!ogTitre || !!photo || prix !== undefined;
  const nom = chaine(p?.name, 180) ?? ogTitre ?? (metaProduit ? chaine($('title').first().text(), 180) : undefined);
  if (!nom && !photo && prix === undefined) return base;

  const valeurs = p && Array.isArray(p.additionalProperty) ? (p.additionalProperty as unknown[]).slice(0, 12).flatMap((v) => {
    const o = v as Json | null;
    const n = chaine(chaine(o?.name, 80)?.replace(/s*[:：]s*$/, ''), 60);
    const val = typeof o?.value === 'number' || typeof o?.value === 'boolean' ? String(o.value) : chaine(o?.value, 60);
    const unite = chaine(o?.unitText, 12);
    return n && val ? [{ nom: n, valeur: val, ...(unite ? { unite } : {}) }] : [];
  }) : [];
  vendeur ??= meta('og:site_name');
  return {
    ...base, statut: 'lue',
    ...(nom ? { nom } : {}),
    ...(prix !== undefined && dev ? { prix, devise: dev, ...(prixDes ? { prixDes: true } : {}) } : {}),
    ...(statutStock === 'in_stock' ? { dispo: 'en-stock' as const } : statutStock === 'out_of_stock' ? { dispo: 'rupture' as const } : {}),
    ...(vendeur ? { vendeur } : {}),
    ...(photo ? { photo } : {}),
    ...(valeurs.length ? { valeurs } : {})
  };
}

async function corpsBorne(r: Response, limite: number): Promise<string | null> {
  if (Number(r.headers.get('content-length')) > limite) { await r.body?.cancel(); return null; }
  const lecteur = r.body?.getReader();
  if (!lecteur) return null;
  const morceaux: Uint8Array[] = [];
  let taille = 0;
  try {
    for (;;) {
      const part = await lecteur.read();
      if (part.done) break;
      taille += part.value.byteLength;
      if (taille > limite) { await lecteur.cancel(); return null; }
      morceaux.push(part.value);
    }
  } finally { lecteur.releaseLock(); }
  return Buffer.concat(morceaux).toString('utf8');
}

/** Le contexte reçu par la tâche : `{ url }`. Une adresse refusée rend `refusee`, sans aucun appel réseau. */
export function lienDe(context: unknown): string {
  const u = (context as { url?: unknown } | null)?.url;
  return typeof u === 'string' ? u : '';
}

/**
 * Lit un lien. Ne lève jamais : chaque cas rend un statut. `fetchPage` est injecté pour les tests (aucun réseau dans `npm test`).
 *  - adresse refusée → `refusee`, aucun fetch ;
 *  - robots.txt refuse, ou en 5xx → `robots`, la page n'est jamais demandée (RFC 9309 : injoignable = refus) ; robots.txt absent (4xx)
 *    → permis ; domaine introuvable → `introuvable`, autre panne du réseau → `indisponible` (L-4) ;
 *  - page refusée au robot (401, 403, 429, défi Cloudflare) → `bloquee` (L-4) ;
 *  - page non HTML, trop grosse, en erreur, trop de redirections → `indisponible` ;
 *  - page lue sans métadonnées produit → `illisible`.
 */
export async function lireLien(raw: string, opts: { fetchPage?: typeof fetch; signal?: AbortSignal; maintenant?: number } = {}): Promise<PageLue> {
  const luLe = opts.maintenant ?? Date.now();
  const depart = urlLisible(raw);
  if (!depart) {
    let domaine = '';
    try { domaine = domaineDe(new URL(raw)); } catch { /* adresse illisible */ }
    return { url: String(raw).slice(0, 2000), domaine, statut: 'refusee', luLe };
  }
  const fetchPage = opts.fetchPage ?? fetch;
  const signal = opts.signal ? AbortSignal.any([opts.signal, AbortSignal.timeout(LIEN_DELAI_MS)]) : AbortSignal.timeout(LIEN_DELAI_MS);
  const entetes = { Accept: 'text/html, text/plain;q=0.8', 'User-Agent': AGENT_CARNET };
  const echec = (statut: PageLue['statut'], u: URL): PageLue => ({ url: u.href, domaine: domaineDe(u), statut, luLe });
  /* L-4 (23.11) : robots.txt qui refuse, ou en 5xx (RFC 9309 : injoignable = refus) → `robots`. Une panne du réseau n'est pas un refus :
     domaine introuvable (DNS) → `introuvable`, autre panne ou délai → `indisponible` ; la page n'est pas demandée non plus. */
  const robots = new Map<string, true | PageLue['statut']>();
  const permis = async (u: URL): Promise<true | PageLue['statut']> => {
    if (!robots.has(u.origin)) {
      let ok: true | PageLue['statut'] = 'robots';
      try {
        const r = await fetchPage(new URL('/robots.txt', u), { signal, redirect: 'follow', headers: entetes });
        if (r.status >= 400 && r.status < 500) { await r.body?.cancel(); ok = true; }
        else if (r.ok) {
          const t = await corpsBorne(r, ROBOTS_TAILLE_MAX);
          ok = t !== null && !/^\s*(?:<!doctype|<html)/i.test(t) && robotsPermet(t, u) ? true : 'robots';
        } else await r.body?.cancel();
      } catch (e) { ok = statutDePanne(e); }
      robots.set(u.origin, ok);
    }
    return robots.get(u.origin)!;
  };
  let url = depart;
  try {
    for (let saut = 0; saut <= REDIRECTIONS_MAX; saut++) {
      const p = await permis(url);
      if (p !== true) return echec(p, url);
      const r = await fetchPage(url, { signal, redirect: 'manual', headers: entetes });
      /* L-4 : brouwland.com (23.11) répond 403 avec `cf-mitigated: challenge` à tout robot : le site bloque la lecture, il ne la rate pas.
         Le défi n'est jamais contourné ; l'écran dit pourquoi. */
      if (r.status === 401 || r.status === 403 || r.status === 429 || r.headers.get('cf-mitigated')) { await r.body?.cancel(); return echec('bloquee', url); }
      if (r.status >= 300 && r.status < 400) {
        await r.body?.cancel();
        const loc = r.headers.get('location');
        const suivante = loc ? urlLisible(new URL(loc, url).href) : null;
        if (!suivante) return echec('refusee', url);
        url = suivante; continue;
      }
      if (!r.ok || !(r.headers.get('content-type') ?? '').includes('text/html')) { await r.body?.cancel(); return echec('indisponible', url); }
      const html = await corpsBorne(r, LIEN_TAILLE_MAX);
      if (html === null) return echec('indisponible', url);
      return lirePage(html, url, luLe);
    }
    return echec('indisponible', url);
  } catch (e) {
    return echec(statutDePanne(e), url);
  }
}

/** Une panne de `fetch` : domaine inexistant (`ENOTFOUND`, Node et undici) → `introuvable` ; le reste (délai, connexion) → `indisponible`. */
function statutDePanne(e: unknown): PageLue['statut'] {
  const code = (e as { cause?: { code?: unknown } } | null)?.cause?.code;
  return code === 'ENOTFOUND' ? 'introuvable' : 'indisponible';
}
