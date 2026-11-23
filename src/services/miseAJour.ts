/**
 * Mise à jour de l'application (T10-M2-1, D429). Méthode standard (L29) : `virtual:pwa-register` de vite-plugin-pwa
 * (« Prompt for new content refreshing »), `registration.update()` pour chercher une version, `updateSW(true)` pour la prendre
 * (le worker reçoit SKIP_WAITING, prend la main, la page se recharge). Ce fichier ne contient que la politique du moment :
 *
 *  - on cherche une nouvelle version au lancement, à chaque retour sur l'app (visibilitychange, pageshow, retour du réseau)
 *    et toutes les minutes tant que l'app est visible ;
 *  - version prête et l'app au repos (`estAuRepos` : ni feuille, ni saisie, ni lecture IA ou de lien en cours, depuis 1,5 s)
 *    → on l'active et la page se recharge ;
 *  - sinon un bandeau « Nouvelle version · Recharger » ; la version s'applique d'elle-même dès que la feuille se ferme.
 *
 * Le worker n'est jamais activé de force pendant une saisie : l'ancien cache continue de servir les morceaux de la page ouverte
 * (D413), car `cleanupOutdatedCaches` ne passe qu'à l'activation de la nouvelle version.
 * `virtual:pwa-register` est importé par `enregistrerPwa.ts` seul, pour que ce fichier reste testable sans le plugin.
 */

export const CALME_MS = 1500;         // libre depuis ce délai avant d'appliquer : une écriture qui part n'est pas coupée
export const SONDE_MS = 500;          // pendant qu'une version attend
// Un onglet resté ouvert (téléphone posé, écran allumé) ne reçoit aucun retour au premier plan : seule cette minuterie lui fait
// trouver la nouvelle version. Une requête conditionnelle de `/sw.js` (quelques octets si rien n'a changé) par minute, app visible.
export const VERIFICATION_MS = 60_000;
export const INTERVALLE_MIN_MS = 15_000; // deux vérifications ne se suivent pas de plus près
export const GARDE_BOUCLE_MS = 15_000;   // un rechargement automatique ne suit pas un autre de moins de 15 s

export interface EntreeMiseAJour {
  /** Une feuille ou une saisie est ouverte : on ne recharge pas. */
  occupe: () => boolean;
  /** Active la version prête puis recharge. `auto` : rend `false` si une garde anti-boucle refuse. */
  appliquer: (auto: boolean) => boolean;
  verifier: () => Promise<unknown>;
  visible: () => boolean;
  montrer: (visible: boolean) => void;
}

export interface MiseAJour {
  /** Le worker a une nouvelle version en attente. */
  versionPrete: () => void;
  /** Cherche une nouvelle version (limité à une fois par INTERVALLE_MIN_MS, jamais hors écran). */
  verifier: () => void;
  /** Le brasseur touche « Recharger ». */
  recharger: () => void;
  /** Branche les déclencheurs de vérification ; rend la fonction qui les retire. */
  demarrer: () => () => void;
}

export function creerMiseAJour(e: EntreeMiseAJour): MiseAJour {
  let prete = false;
  let appliquee = false;
  let libreDepuis: number | null = null;
  let sonde: ReturnType<typeof setInterval> | null = null;
  let derniere = -Infinity;

  const arreterSonde = () => { if (sonde !== null) { clearInterval(sonde); sonde = null; } };

  function pas() {
    if (!prete || appliquee) { arreterSonde(); return; }
    if (e.occupe()) { libreDepuis = null; e.montrer(true); return; }
    libreDepuis ??= Date.now();
    if (Date.now() - libreDepuis < CALME_MS) return;
    arreterSonde();
    if (e.appliquer(true)) appliquee = true;
    else e.montrer(true); // garde anti-boucle : le bandeau reste, le brasseur décide
  }

  const versionPrete = () => {
    if (prete) return;
    prete = true;
    pas();
    if (!appliquee && sonde === null) sonde = setInterval(pas, SONDE_MS);
  };

  const verifier = () => {
    if (appliquee || !e.visible()) return;
    const t = Date.now();
    if (t - derniere < INTERVALLE_MIN_MS) return;
    derniere = t;
    e.verifier().catch(() => { /* hors ligne ou worker introuvable : on réessaiera au prochain retour */ });
  };

  const recharger = () => {
    appliquee = true;
    arreterSonde();
    e.appliquer(false);
  };

  const demarrer = () => {
    const surVisibilite = () => verifier();
    const surPageShow = (ev: Event) => { if ((ev as PageTransitionEvent).persisted) verifier(); };
    document.addEventListener('visibilitychange', surVisibilite);
    window.addEventListener('pageshow', surPageShow);
    window.addEventListener('online', surVisibilite);
    const minuterie = setInterval(verifier, VERIFICATION_MS);
    return () => {
      document.removeEventListener('visibilitychange', surVisibilite);
      window.removeEventListener('pageshow', surPageShow);
      window.removeEventListener('online', surVisibilite);
      clearInterval(minuterie);
      arreterSonde();
    };
  };

  return { versionPrete, verifier, recharger, demarrer };
}

const CHAMPS_SANS_SAISIE = /^(?:button|checkbox|radio|submit|reset|range|image|file|color)$/i;
const FEUILLES = [
  'dialog[open]', '[role="dialog"]:not([data-state="closed"])', '[role="alertdialog"]', '[aria-modal="true"]',
  '[data-vaul-drawer][data-state="open"]', '[data-saisie-ouverte]',
].join(',');

const affiche = (el: Element): boolean => {
  const h = el as HTMLElement & { checkVisibility?: () => boolean };
  return !h.closest('[hidden]') && (typeof h.checkVisibility !== 'function' || h.checkVisibility());
};

/**
 * Vrai si une feuille (dialogue, tiroir, alerte) est affichée ou si un champ de saisie a le focus. Un élément porte
 * `data-saisie-ouverte` pour déclarer une saisie en cours que ces deux règles ne voient pas.
 */
export function interfaceOccupee(doc: Document = document): boolean {
  const a = doc.activeElement as HTMLElement | null;
  if (a && a !== doc.body) {
    const tag = a.tagName;
    if (a.isContentEditable || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (tag === 'INPUT' && !CHAMPS_SANS_SAISIE.test((a as HTMLInputElement).type)) return true;
  }
  return [...doc.querySelectorAll(FEUILLES)].some(affiche);
}

// --- Travaux en cours : une lecture IA ou de lien ne se coupe pas par un rechargement ---------------------------------------
let travaux = 0;
/** Nombre de travaux (appels de fonctions serveur, déclarations explicites) qui ne doivent pas être coupés. */
export const appelsEnCours = (): number => travaux;
/** Déclare un travail en cours ; rend la fonction qui le libère (une seule fois). */
export function marquerTravail(): () => void {
  travaux++;
  let libre = false;
  return () => { if (!libre) { libre = true; travaux = Math.max(0, travaux - 1); } };
}

/** Les lectures IA et de lien passent par des fonctions serveur (callables) ; Firestore, lui, se rejoue seul au retour du réseau. */
export const estAppelServeur = (url: string): boolean => /^https?:\/\/[^/]*(?:cloudfunctions\.net|\.run\.app)(?:[/:?#]|$)/i.test(url);

const urlDe = (entree: Parameters<typeof fetch>[0]): string =>
  typeof entree === 'string' ? entree : entree instanceof URL ? entree.href : entree.url;

/** Enveloppe `fetch` : chaque appel de fonction serveur compte comme travail jusqu'à sa réponse ou son échec. */
export function suivreAppelsServeur(reseau: typeof fetch): typeof fetch {
  return ((entree, init) => {
    let url = '';
    try { url = urlDe(entree); } catch { /* entrée inattendue : non suivie */ }
    if (!estAppelServeur(url)) return reseau(entree, init);
    const fin = marquerTravail();
    let promesse: Promise<Response>;
    try { promesse = reseau(entree, init); } catch (e) { fin(); throw e; }
    return promesse.finally(fin);
  }) as typeof fetch;
}

/**
 * Vrai si l'app est au repos : ni feuille ni champ de saisie (`interfaceOccupee`), ni lecture IA ou de lien en cours.
 * C'est la seule règle qui autorise un rechargement automatique pour une nouvelle version.
 */
export const estAuRepos = (doc: Document = document, enCours: number = travaux): boolean => !interfaceOccupee(doc) && enCours === 0;

// --- Bandeau : état partagé avec `ui/BandeauMiseAJour.tsx` ---------------------------------------------------------------
let bandeau = false;
const abonnes = new Set<() => void>();
export const bandeauVisible = (): boolean => bandeau;
export const surBandeau = (f: () => void): (() => void) => { abonnes.add(f); return () => { abonnes.delete(f); }; };
const poserBandeau = (v: boolean) => { if (v !== bandeau) { bandeau = v; abonnes.forEach(f => f()); } };

type RegisterSW = (options?: {
  immediate?: boolean;
  onNeedRefresh?: () => void;
  onNeedReload?: () => void;
  onRegisteredSW?: (url: string, registration: ServiceWorkerRegistration | undefined) => void;
}) => (reloadPage?: boolean) => Promise<void>;

let courante: MiseAJour | null = null;
/** « Recharger » du bandeau. */
export const rechargerMaintenant = (): void => courante?.recharger();

const CLE_GARDE = 'affinee-maj-auto';
// Deux voies mènent au rechargement (notre `controllerchange`, le `controlling` de workbox-window) : la première seule compte,
// la seconde interromprait la navigation déjà partie (constaté : net::ERR_ABORTED, puis page parfois sans le nouveau paquet).
let rechargementLance = false;
const recharger = () => { if (rechargementLance) return; rechargementLance = true; window.location.reload(); };

/**
 * E-2 (23.11) : au démarrage, avant le rendu de l'app, une version déjà en attente prend la main. Un rechargement ordinaire ne
 * l'active jamais de lui-même (l'ancienne page et la nouvelle se chevauchent : le navigateur garde l'ancien worker), et la règle
 * « rien d'ouvert depuis 1,5 s » ne laisse jamais passer qui touche un champ dès l'affichage : chaque rechargement resservait
 * l'ancien paquet. Ici rien n'est encore affiché, rien ne peut se perdre : SKIP_WAITING, puis rechargement quand elle a la main.
 * Rend `true` si l'activation est partie (la page va se recharger : ne pas monter l'app).
 */
export async function prendreVersionEnAttente(
  sw: ServiceWorkerContainer | undefined = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined,
  relancer: () => void = recharger,
): Promise<boolean> {
  if (!sw?.controller) return false; // première visite ou développement : rien à prendre
  const r = await sw.getRegistration().catch(() => undefined);
  const attente = r?.waiting;
  if (!attente) return false;
  try {
    const avant = Number(sessionStorage.getItem(CLE_GARDE) ?? 0);
    if (Date.now() - avant < GARDE_BOUCLE_MS) return false; // garde anti-boucle : l'app démarre, le bandeau prendra le relais
    sessionStorage.setItem(CLE_GARDE, String(Date.now()));
  } catch { /* stockage de session refusé : pas de garde */ }
  sw.addEventListener('controllerchange', relancer, { once: true });
  attente.postMessage({ type: 'SKIP_WAITING' });
  return true;
}

/** Enregistre le worker (une fois) et branche la politique ci-dessus. `registerSW` vient de `virtual:pwa-register`. */
export function demarrerMiseAJour(registerSW: RegisterSW): MiseAJour {
  if (courante) return courante;
  // Les lectures IA et de lien (callables) comptent comme « occupé » : l'app ne se recharge pas pendant leur vol.
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') window.fetch = suivreAppelsServeur(window.fetch.bind(window));
  let registration: ServiceWorkerRegistration | undefined;
  let activer: (reloadPage?: boolean) => Promise<void> = async () => {};
  let enCours = false;
  const gestion = creerMiseAJour({
    occupe: () => !estAuRepos(),
    visible: () => document.visibilityState !== 'hidden',
    montrer: poserBandeau,
    verifier: () => (registration ? registration.update() : Promise.resolve()),
    appliquer: (auto) => {
      if (enCours) return true;
      if (auto) {
        try {
          const avant = Number(sessionStorage.getItem(CLE_GARDE) ?? 0);
          if (Date.now() - avant < GARDE_BOUCLE_MS) return false;
          sessionStorage.setItem(CLE_GARDE, String(Date.now()));
        } catch { /* stockage de session refusé : pas de garde, on applique */ }
      }
      enCours = true;
      // La page se recharge quand la nouvelle version prend la main, jamais avant (sinon elle relirait l'ancien paquet).
      navigator.serviceWorker.addEventListener('controllerchange', recharger, { once: true });
      void activer(true).catch(() => { enCours = false; });
      return true;
    },
  });
  courante = gestion;
  activer = registerSW({
    immediate: true,
    onNeedRefresh: gestion.versionPrete,
    onNeedReload: recharger,
    onRegisteredSW: (_url, r) => { registration = r; gestion.verifier(); },
  });
  gestion.demarrer();
  return gestion;
}
