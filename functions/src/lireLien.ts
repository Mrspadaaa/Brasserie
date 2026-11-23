import { extraireProduit } from './lienProduit.js';
import { coursVersChf, type Cours } from './coursChange.js';
import { completerParIA, iaUtile, type AppelIA } from './lienIA.js';
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
 * Bornes : 12 s pour tout (robots compris ; landi.ch passait 8 s au banc réel, BL-7), 4 Mo de page (Amazon, baldinger.biz : 2 à 2,4 Mo),
 * 128 ko de robots, 3 redirections, https seulement, aucun hôte local ni
 * adresse IP, aucun identifiant ni port, aucune page de panier ou de compte. Robots refusé ou illisible : la page n'est jamais demandée.
 */

export const LIEN_DELAI_MS = 12000;
export const LIEN_TAILLE_MAX = 4_000_000;
export const ROBOTS_TAILLE_MAX = 128_000;
const REDIRECTIONS_MAX = 3;
export const AGENT_CARNET = 'LaffineeCarnet/1.0';

const domaineDe = (u: URL) => u.hostname.replace(/^www\./, '');

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

export { prixLocalise } from './lienProduit.js';

/** Une page de recherche, d'accueil ou de catégorie atteinte par redirection depuis une fiche : le lien est mort (BL-15). */
export function lienMort(depart: URL, finale: URL): boolean {
  if (depart.href === finale.href) return false;
  if (/\/(?:search|suche|recherche|catalogsearch)\b|[?&](?:q|search|query|s)=/i.test(finale.pathname + finale.search)) return true;
  return finale.pathname.replace(/\/+$/, '') === '' && depart.pathname.replace(/\/+$/, '').split('/').length > 2;
}

/**
 * Lecture pure d'une page (testée sur des pages réelles capturées, `banc-liens/pages`). La cascade (D446) est dans `lienProduit.ts` :
 * schema.org (JSON-LD, microdata, RDFa), puis Open Graph, puis le HTML visible ; chaque étape rend son statut.
 */
export function lirePage(html: string, url: URL, luLe = Date.now()): PageLue {
  const base: PageLue = { url: url.href, domaine: domaineDe(url), statut: 'illisible', luLe };
  const x = extraireProduit(html, url);
  const etapes = [{ nom: 'page' as const, statut: 'trouve' as const, detail: domaineDe(url) }, ...x.etapes];
  if (!x.nom && !x.photos.length && x.prix === undefined) return { ...base, etapes: etapes.map((e) => e.nom === 'page' ? { ...e, statut: 'douteux' as const, detail: 'ni nom, ni prix, ni photo' } : e) };
  return {
    ...base, statut: 'lue',
    ...(x.nom ? { nom: x.nom } : {}),
    ...(x.prix !== undefined && x.devise ? { prix: x.prix, devise: x.devise, ...(x.prixDes ? { prixDes: true } : {}) } : {}),
    ...(x.taxe ? { taxe: x.taxe } : {}),
    ...(x.prixTTC !== undefined ? { prixTTC: x.prixTTC } : {}),
    ...(x.dispo ? { dispo: x.dispo } : {}),
    ...(x.vendeur ? { vendeur: x.vendeur } : {}),
    ...(x.photos.length ? { photo: x.photos[0], photos: x.photos } : {}),
    ...(x.valeurs.length ? { valeurs: x.valeurs } : {}),
    ...(x.livraison ? { livraison: x.livraison } : {}),
    etapes
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
export interface OptionsLecture {
  fetchPage?: typeof fetch; signal?: AbortSignal; maintenant?: number;
  /** Le cours vers le franc (BCE) ; injecté au banc et en test. `null` : aucune conversion. */
  cours?: Cours | null;
  /** Chaque étape dès qu'elle est connue (flux de `aiTask`), pour que l'app l'affiche au fil de l'eau. */
  onEtape?: (e: NonNullable<PageLue['etapes']>[number]) => void;
  /** La dernière marche (D446) : l'IA sur le texte nettoyé, seulement si un champ manque ou est douteux. Absente : aucune IA. */
  ia?: AppelIA;
  /** La sous-tâche qui démarre (seule l'IA est lente : l'écran la montre « en cours » avant sa réponse). */
  onDebut?: (nom: 'ia') => void;
}

export async function lireLien(raw: string, opts: OptionsLecture = {}): Promise<PageLue> {
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
  const dire = (e: NonNullable<PageLue['etapes']>[number]) => { try { opts.onEtape?.(e); } catch { /* l'écran ne fait jamais échouer la lecture */ } };
  const echec = (statut: PageLue['statut'], u: URL): PageLue => {
    const e = { nom: 'page' as const, statut: 'absent' as const, detail: statut };
    dire(e);
    return { url: u.href, domaine: domaineDe(u), statut, luLe, etapes: [e] };
  };
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
      // BL-15 : une fiche redirigée vers la recherche ou l'accueil est un lien mort, pas une page « sans nom ni prix ».
      if (lienMort(depart, url)) return echec('introuvable', url);
      // La page est lue : première étape dite tout de suite, avant l'analyse (IA-ETAPES-VISIBLES).
      dire({ nom: 'page', statut: 'trouve', detail: domaineDe(url) });
      let page = lirePage(html, url, luLe);
      for (const e of page.etapes ?? []) if (!(e.nom === 'page' && e.statut === 'trouve')) dire(e);
      if (opts.ia && iaUtile(page)) {
        const avant = page.etapes?.length ?? 0;
        try { opts.onDebut?.('ia'); } catch { /* l'écran ne fait jamais échouer la lecture */ }
        page = await completerParIA(page, html, opts.ia);
        for (const e of (page.etapes ?? []).slice(avant)) dire(e);
      }
      // D447 : un prix hors CHF reçoit le cours du jour (BCE) ; le prix d'origine reste, la conversion se dit à côté.
      if (page.prix !== undefined && page.devise && page.devise !== 'CHF') {
        const cours = opts.cours === undefined ? coursVersChf : opts.cours;
        const c = cours ? await cours(page.devise, signal).catch(() => null) : null;
        if (c) page.change = { taux: c.taux, date: c.date, source: 'BCE' };
      }
      return page;
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
