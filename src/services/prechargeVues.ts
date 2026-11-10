/**
 * Préchargement au repos des vues les plus ouvertes (voie l2, 10.11 : « Tout les nouvelles vue on mis du temps à chargé »).
 *
 * Une vue paresseuse (`lazy(() => import(...))`) attend le réseau à sa première ouverture : 1 à 4 s en Slow 4G. Une fois l'accueil
 * affiché et le navigateur au repos, on demande ses morceaux un par un ; l'ouverture suivante les trouve déjà là (le navigateur partage
 * la promesse d'un même `import()`). Règles : en ligne, pas d'économie de données, pas de connexion 2G, un seul morceau à la fois,
 * chacun à un nouveau repos, jamais sur le chemin du démarrage. Un échec n'est pas grave : l'ouverture de la vue réessaie.
 * Pas de service worker (décision à part). Les outils houblons ont leur propre préchargement (`ui/hopIndex/precharge.ts`).
 */
export interface EntreeVues {
  enLigne: () => boolean;
  /** Économie de données demandée, ou connexion trop lente pour charger sans que ce soit demandé. */
  reseauAMenager: () => boolean;
  /** Programme `f` au prochain repos ; rend l'annulation. */
  auRepos: (f: () => void) => () => void;
  /** Les morceaux à charger, dans l'ordre de probabilité d'ouverture. */
  morceaux: ReadonlyArray<() => Promise<unknown>>;
}

/** Programme le chargement des morceaux, un par repos ; rend l'annulation (démontage, déconnexion). */
export function programmerPrechargementVues(e: EntreeVues): () => void {
  if (e.reseauAMenager()) return () => {};
  let fini = false;
  let annulerRepos = () => {};
  const suivant = (i: number) => {
    if (fini || i >= e.morceaux.length) return;
    annulerRepos = e.auRepos(() => {
      if (fini || !e.enLigne() || e.reseauAMenager()) return;
      // Un échec ou une promesse refusée n'arrête pas la suite : chaque vue réessaiera à son ouverture.
      void e.morceaux[i]().catch(() => {}).then(() => suivant(i + 1));
    });
  };
  suivant(0);
  return () => { fini = true; annulerRepos(); };
}

type FenetreRepos = Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (n: number) => void };

const DEPART_MS = 3000;
const CALME_MS = 5000;
let derniereAction = 0;
let ecoute = false;

/** Le préchargement du navigateur : brassins, stocks, finances, clients. À appeler une fois l'accueil affiché et les données prêtes. */
export function prechargerVuesAuRepos(): () => void {
  if (typeof window === 'undefined') return () => {};
  if (!ecoute) {
    ecoute = true;
    for (const nom of ['pointerdown', 'keydown']) window.addEventListener(nom, () => { derniereAction = Date.now(); }, { passive: true, capture: true });
  }
  const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };
  return programmerPrechargementVues({
    enLigne: () => navigator.onLine !== false,
    reseauAMenager: () => nav.connection?.saveData === true || nav.connection?.effectiveType === 'slow-2g' || nav.connection?.effectiveType === '2g',
    // Le brasseur a la main : après un geste (toucher, clavier), on laisse la bande passante à ce qu'il ouvre et on attend `CALME_MS` de calme.
    auRepos: (f) => {
      const w = window as FenetreRepos;
      let minuterie = 0, repos = 0, annule = false;
      const attendre = () => {
        if (annule) return;
        const reste = CALME_MS - (Date.now() - derniereAction);
        if (reste > 0) { minuterie = window.setTimeout(attendre, reste); return; }
        if (w.requestIdleCallback) repos = w.requestIdleCallback(() => { if (!annule) f(); }, { timeout: 8000 });
        else f();
      };
      minuterie = window.setTimeout(attendre, DEPART_MS);
      return () => { annule = true; window.clearTimeout(minuterie); if (repos) w.cancelIdleCallback?.(repos); };
    },
    morceaux: [
      () => import('../components/tabs/ProductionTab'),
      // La bibliothèque de levures (347 Ko transférés) n'est plus dans le chunk de l'accueil : l'atelier Houblons, les outils, l'assistant de
      // recette et le jour de brassage la lisent de façon synchrone. Elle arrive ici, au repos, pour que leur première ouverture la trouve.
      () => import('../domain/yeastReferences'),
      () => import('../components/tabs/StocksTab'),
      () => import('../components/tabs/FinancesTab'),
      () => import('../components/tabs/ClientsTab'),
    ],
  });
}
