/**
 * Marche « navigateur » de la lecture des liens (23.11) : Chrome sans écran côté serveur, pour les pages que `fetch` ne passe pas
 * (403, défi JavaScript) et pour celles dont le JSON-LD n'existe qu'après l'exécution des scripts.
 *
 * ÉTAT DE L'ART (L29). Problème d'école : rendre une page dont le contenu dépend de JavaScript = « headless browser rendering ». Méthode
 * standard : Puppeteer (puppeteer-core, sans Chromium téléchargé) pilotant un Chromium. Sur Cloud Functions, la bibliothèque maintenue est
 * `@sparticuz/chromium` (Chromium compressé en brotli, ~67 Mo, décompressé dans /tmp au démarrage, arguments adaptés à Lambda et Cloud
 * Functions). Rien de réécrit à la main : ce module n'ajoute que les garde-fous de L'Affinée.
 *
 * Ce que ce module est, et n'est pas :
 *  - il ne contourne AUCUN défi : une page qui est un défi (Cloudflare « Just a moment », « Attention Required », « Client Challenge »,
 *    « Sicherheitsprüfung »…) rend `bloquee`, aucun CAPTCHA n'est résolu, aucune attente d'un défi, aucun plugin furtif, aucun proxy ;
 *  - son identité est celle d'un Chrome ordinaire : l'agent du navigateur lui-même, avec « HeadlessChrome » écrit « Chrome » ; rien d'autre
 *    n'est falsifié ;
 *  - il ne demande jamais robots.txt : l'appelant ne l'appelle qu'après `lireLien` (robots.txt permis, page refusée au robot → `bloquee`) ;
 *  - chaque requête du navigateur repasse par `urlLisible` : une redirection vers une adresse interne est coupée (SSRF) ;
 *  - un navigateur par lecture, toujours fermé (`finally`), sous un délai dur : jamais un Chrome qui reste ouvert.
 *
 * Dépendances (NON déclarées dans functions/package.json par ce module, le pilote les ajoute à l'intégration) : `puppeteer-core`,
 * `@sparticuz/chromium`. Elles s'importent à l'exécution, par nom variable : sans elles, `tsc` et les tests passent, et la lecture rend
 * `indisponible` (jamais d'exception).
 */
import { LIEN_TAILLE_MAX, urlLisible } from './lireLien.js';

export type EchecNavigateur = 'bloquee' | 'introuvable' | 'delai' | 'indisponible';
export type ResultatNavigateur =
  | { ok: true; html: string; urlFinale: string; statut: number; ms: number }
  | { ok: false; echec: EchecNavigateur; detail: string; ms: number };

/** Le strict nécessaire de puppeteer-core, pour injecter un faux navigateur dans les tests. */
export interface RequetePage { url(): string; resourceType(): string; isNavigationRequest(): boolean; abort(code?: string): Promise<void>; continue(): Promise<void> }
export interface ReponsePage { status(): number; headers(): Record<string, string> }
export interface PageNav {
  setRequestInterception(actif: boolean): Promise<void>;
  on(evenement: 'request', f: (r: RequetePage) => void): unknown;
  setUserAgent(agent: string): Promise<void>;
  setExtraHTTPHeaders(h: Record<string, string>): Promise<void>;
  goto(url: string, opts: { waitUntil: 'domcontentloaded' | 'networkidle2'; timeout: number }): Promise<ReponsePage | null>;
  waitForNetworkIdle?(opts: { idleTime: number; timeout: number }): Promise<void>;
  content(): Promise<string>;
  url(): string;
}
export interface NavigateurNav { newPage(): Promise<PageNav>; userAgent(): Promise<string>; close(): Promise<void> }
export type Lanceur = () => Promise<NavigateurNav>;

export interface OptionsNavigateur {
  /** Le lanceur : `@sparticuz/chromium` + `puppeteer-core` par défaut ; injecté dans les tests et au banc (Chrome du poste). */
  lanceur?: Lanceur;
  /** Calme du réseau attendu après le chargement, pour laisser les scripts poser JSON-LD et prix (défaut 1500 ms, plafonné par le délai). */
  calmeMs?: number;
}

/** Marques d'une page de défi, au titre ou au début du corps : ce sont des pages que le robot ne doit pas franchir. */
const DEFI = /just a moment|attention required|client challenge|sicherheitspr(?:ü|u)fung|checking your browser|verify(?:ing)? you are human|cf-chl|challenge-platform|access denied|request blocked/i;
const RESSOURCES_COUPEES = new Set(['image', 'media', 'font', 'stylesheet']);

/** Une page qui n'est qu'un défi ou un refus : petite, et marquée. Une vraie fiche pèse plus et porte du contenu. */
export function estDefi(html: string, statut: number): boolean {
  const titre = /<title[^>]*>([^<]*)/i.exec(html)?.[1] ?? '';
  const debut = html.slice(0, 6000);
  if (DEFI.test(titre)) return true;
  return (statut === 401 || statut === 403 || statut === 429 || statut === 503) && (DEFI.test(debut) || html.length < 20_000);
}

/** Les deux derniers noms du domaine (assez pour « même site » ; pas une liste de suffixes publics, le cas .co.uk ne sert pas ici). */
export function domaineRacine(adresse: string): string {
  try { return new URL(adresse).hostname.toLowerCase().split('.').slice(-2).join('.'); } catch { return ''; }
}

/**
 * Dernier recours quand la page reste fermée : un nom lisible tiré de l'adresse (« Gaer und Lagerfass Universal 15 Liter »), à marquer
 * « tiré de l'adresse » dans l'écran. Rend `undefined` plutôt qu'un nom inventé : un segment trop court, numérique ou de page de liste.
 */
export function nomDeAdresse(adresse: string): string | undefined {
  try {
    const u = new URL(adresse);
    const segments = decodeURIComponent(u.pathname).split('/').filter(Boolean);
    const dernier = (segments.at(-1) ?? '').replace(/\.(?:html?|php|aspx?)$/i, '').replace(/^\d+-/, '').replace(/-\d{5,}$/, '');
    const nom = dernier.replace(/[-_+]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (nom.length < 6 || !/[a-zà-ÿ]{3}/i.test(nom) || /^(?:p|product|products|produit|artikel|item)$/i.test(nom)) return undefined;
    return nom.slice(0, 120);
  } catch { return undefined; }
}

/** Le lanceur de production : Chromium de `@sparticuz/chromium`, piloté par `puppeteer-core`. */
export const lanceurSparticuz: Lanceur = async () => {
  const nomChromium = '@sparticuz/chromium', nomPuppeteer = 'puppeteer-core'; // noms en variables : paquets facultatifs, absents de tsc
  const { default: chromium } = await import(nomChromium);
  const { default: puppeteer } = await import(nomPuppeteer);
  chromium.setGraphicsMode = false;
  return puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: 'shell', defaultViewport: { width: 1280, height: 900 } });
};

/**
 * Lit une page avec Chrome sans écran et rend son HTML après exécution des scripts. Ne lève jamais.
 * `delaiMs` borne TOUT (lancement compris) ; le navigateur est fermé dans tous les cas.
 */
export async function lireAvecNavigateur(url: string, delaiMs: number, opts: OptionsNavigateur = {}): Promise<ResultatNavigateur> {
  const t0 = Date.now();
  const ms = () => Date.now() - t0;
  const depart = urlLisible(url);
  if (!depart) return { ok: false, echec: 'indisponible', detail: 'adresse refusée', ms: 0 };
  const delai = Math.max(2000, Math.min(delaiMs, 60_000));
  let navigateur: NavigateurNav | undefined;
  let minuteur: ReturnType<typeof setTimeout> | undefined;
  const travail = (async (): Promise<ResultatNavigateur> => {
    navigateur = await (opts.lanceur ?? lanceurSparticuz)();
    const page = await navigateur.newPage();
    const agent = (await navigateur.userAgent()).replace('HeadlessChrome', 'Chrome');
    await page.setUserAgent(agent);
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'fr-CH,fr;q=0.9,de;q=0.8,en;q=0.7' });
    await page.setRequestInterception(true);
    page.on('request', (r) => {
      // Les images, polices et feuilles de style ne servent pas à lire un prix : elles coûtent du temps et de la mémoire.
      // Chaque navigation (redirections comprises) repasse par `urlLisible` : jamais d'adresse interne ni de panier.
      const coupe = RESSOURCES_COUPEES.has(r.resourceType()) || (r.isNavigationRequest() && !urlLisible(r.url()));
      void (coupe ? r.abort('blockedbyclient') : r.continue()).catch(() => undefined);
    });
    const restant = () => Math.max(1000, delai - ms());
    const reponse = await page.goto(depart.href, { waitUntil: 'domcontentloaded', timeout: restant() });
    const statut = reponse?.status() ?? 0;
    if (page.waitForNetworkIdle) await page.waitForNetworkIdle({ idleTime: Math.min(opts.calmeMs ?? 1500, 3000), timeout: Math.min(restant(), 8000) }).catch(() => undefined);
    const html = await page.content();
    const urlFinale = page.url();
    if (html.length > LIEN_TAILLE_MAX) return { ok: false, echec: 'indisponible', detail: 'page trop grosse', ms: ms() };
    if (estDefi(html, statut) || (reponse?.headers()['cf-mitigated'] ?? '') !== '') return { ok: false, echec: 'bloquee', detail: `défi ou refus (http ${statut})`, ms: ms() };
    // Renvoyé vers un autre site en erreur (jumbo.ch → login.supercard.ch, 23.11) : c'est une porte fermée, non une fiche disparue.
    if (statut >= 400 && domaineRacine(urlFinale) !== domaineRacine(depart.href)) return { ok: false, echec: 'bloquee', detail: `renvoyé vers ${new URL(urlFinale).hostname} (http ${statut})`, ms: ms() };
    if (statut === 404 || statut === 410) return { ok: false, echec: 'introuvable', detail: `http ${statut}`, ms: ms() };
    if (statut >= 400 || statut === 0) return { ok: false, echec: 'indisponible', detail: `http ${statut}`, ms: ms() };
    return { ok: true, html, urlFinale, statut, ms: ms() };
  })();
  const limite = new Promise<ResultatNavigateur>((resolve) => { minuteur = setTimeout(() => resolve({ ok: false, echec: 'delai', detail: `plus de ${delai} ms`, ms: delai }), delai); });
  try {
    return await Promise.race([travail, limite]);
  } catch (e) {
    const message = String((e as { message?: unknown })?.message ?? e).slice(0, 160);
    return { ok: false, echec: /timeout/i.test(message) ? 'delai' : 'indisponible', detail: message, ms: ms() };
  } finally {
    if (minuteur) clearTimeout(minuteur);
    // Un Chrome qui reste ouvert coûte de la mémoire à toute l'instance : la fermeture se fait même après le délai.
    void travail.catch(() => undefined).then(() => navigateur?.close().catch(() => undefined));
  }
}

/**
 * Voie 3 (dernier recours), ce qu'il faudrait pour la brancher : la page capturée par le brasseur est une image ; la lecture de photo existe
 * déjà pour les factures (`callGemini` avec `file` inline). Seules deux choses manquent : une consigne et le schéma du lien.
 * Voir `CONSIGNE_CAPTURE` ; `LIEN_IA_SCHEMA` (lienIA.ts) sert tel quel, sans changement. La garde `garder()` ne s'applique pas
 * (pas de texte à confronter) : ce qui sort d'une capture est marqué « lu sur une capture » et le prix reste à confirmer par le brasseur.
 */
export const CONSIGNE_CAPTURE = [
  'Tu lis la CAPTURE D\'ÉCRAN d\'une page produit d\'une boutique en ligne (une image, pas le texte de la page).',
  'Rends UNIQUEMENT ce qui est lisible sur l\'image, copié tel quel : nom, prix du produit principal pour 1 pièce avec sa devise, « HT » ou « TTC » seulement si écrit,',
  'frais de livraison vers la Suisse seulement s\'ils sont écrits, au plus 12 caractéristiques techniques (nom court, valeur avec unité).',
  'Un champ qui n\'est pas lisible est null. Ne devine rien, ne convertis rien, ne complète jamais de mémoire.'
].join('\n');
