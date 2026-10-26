/**
 * Préchargement au repos des outils houblons v4 (#167).
 *
 * Règles : drapeau `hopV4` allumé, en ligne, sans économie de données, une fois la page chargée et le navigateur au
 * repos ; jamais sur le chemin du démarrage. Drapeau éteint : rien n'est demandé, rien ne change. Le but est qu'un outil
 * s'ouvre ensuite sans réseau. LIMITE ÉCRITE (décision de l'utilisateur) : un tout premier lancement hors ligne n'est
 * pas couvert, il faudrait un service worker.
 */
import { hopV4Enabled } from './flags';
import { chargerOutils } from './chargement';

export interface EntreePrechargement {
  actif: boolean;
  enLigne: () => boolean;
  economieDonnees: () => boolean;
  /** Page chargée ? Sinon `quandCharge` rappelle une fois la page chargée. */
  pageChargee: () => boolean;
  quandCharge: (f: () => void) => () => void;
  /** Programme `f` au repos ; rend l'annulation. */
  auRepos: (f: () => void) => () => void;
  /** Rappelle `f` quand le réseau revient (une fois) ; rend l'annulation. */
  quandEnLigne: (f: () => void) => () => void;
  /** Ce qu'il faut charger : la couche et le chunk des outils. */
  charger: () => Promise<unknown>;
}

/** Programme le préchargement ; rend l'annulation (démontage). Sans effet si une condition manque. */
export function programmerPrechargement(e: EntreePrechargement): () => void {
  if (!e.actif || e.economieDonnees()) return () => {};
  const annulations: Array<() => void> = [];
  let fini = false;
  const tenter = () => {
    if (fini) return;
    if (!e.enLigne()) { annulations.push(e.quandEnLigne(tenter)); return; }
    if (!e.pageChargee()) { annulations.push(e.quandCharge(tenter)); return; }
    annulations.push(e.auRepos(() => {
      if (fini) return;
      if (!e.enLigne()) { annulations.push(e.quandEnLigne(tenter)); return; }
      fini = true;
      // Un échec (réseau perdu en route) n'est pas grave : l'ouverture d'un outil réessaiera.
      e.charger().catch(() => {});
    }));
  };
  tenter();
  return () => { fini = true; annulations.forEach((a) => a()); };
}

/** Le préchargement du navigateur : à appeler une fois, depuis l'effet de montage de l'application. */
export function prechargerOutilsAuRepos(auChargementCouche?: (couche: typeof import('./HopToolLayer')) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  return programmerPrechargement({
    actif: hopV4Enabled(),
    enLigne: () => navigator.onLine !== false,
    economieDonnees: () => nav.connection?.saveData === true,
    pageChargee: () => document.readyState === 'complete',
    quandCharge: (f) => { window.addEventListener('load', f, { once: true }); return () => window.removeEventListener('load', f); },
    auRepos: (f) => {
      const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (n: number) => void };
      if (w.requestIdleCallback) { const n = w.requestIdleCallback(f, { timeout: 10000 }); return () => w.cancelIdleCallback?.(n); }
      const t = window.setTimeout(f, 2000);
      return () => window.clearTimeout(t);
    },
    quandEnLigne: (f) => { window.addEventListener('online', f, { once: true }); return () => window.removeEventListener('online', f); },
    // d3b (#180) : les compléments des 18 sources (morceau à part, 57 ko gzip) arrivent au même repos : Comparer et la fiche les trouvent
    // déjà là. `lancerComplements()` ne rejette jamais (échec : catalogue seul, l'ouverture réessaie).
    charger: () => Promise.all([import('./HopToolLayer').then(m => { auChargementCouche?.(m); return m; }), chargerOutils(), import('./fiche/complements-ui').then(m => m.lancerComplements())])
  });
}
