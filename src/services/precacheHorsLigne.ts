/**
 * Hors ligne (CHN-7, 21.11) : un seul service worker, `/sw.js`, écrit par vite-plugin-pwa (Workbox `generateSW`) au build.
 * Il précache la coquille (`index.html`) et tous les morceaux hachés, répond aux navigations hors ligne par la coquille,
 * et importe `brew-alerts-sw.js` (alarmes de brassage : push, clic de notification). Une portée ne tient qu'un worker :
 * toute page qui s'abonne aux alertes enregistre donc `/sw.js` (voir `urlServiceWorker`), jamais `/brew-alerts-sw.js` seul.
 *
 * Mise à jour sans perte (D413, D429) : le worker n'active une nouvelle version que sur demande de la page (SKIP_WAITING), jamais
 * en pleine saisie ; la page ouverte garde ses morceaux d'origine, que l'ancien cache lui sert encore. La politique (vérifier au
 * retour sur l'app, activer et recharger si rien n'est ouvert, sinon bandeau) vit dans `miseAJour.ts`.
 */

/** `/sw.js` en production (le build l'écrit) ; en développement il n'existe pas : le worker des alarmes seul, comme avant. */
export const urlServiceWorker = (): string => (import.meta.env.MODE === 'production' ? '/sw.js' : '/brew-alerts-sw.js');

/** Vrai pour le worker de l'application, ancien (alarmes seules) ou nouveau (précache + alarmes). */
export const estServiceWorkerApp = (scriptURL: string): boolean => /\/(?:sw|brew-alerts-sw)\.js(?:[?#]|$)/.test(scriptURL);

interface EntreePrecache {
  /** Le navigateur sait faire un service worker et la page tourne dans un build de production. */
  disponible: () => boolean;
  /** Économie de données demandée ou connexion trop lente : ~24 Mo à la première visite, on ne les impose pas. */
  reseauAMenager: () => boolean;
  enLigne: () => boolean;
  /** Programme `f` une fois la page chargée et le navigateur au repos. */
  auRepos: (f: () => void) => void;
  enregistrer: () => Promise<unknown>;
}

/** Enregistre le worker au repos ; rend `true` si l'enregistrement a été programmé. Un échec n'est jamais bloquant. */
export function programmerPrecache(e: EntreePrecache): boolean {
  if (!e.disponible() || e.reseauAMenager()) return false;
  e.auRepos(() => { if (e.enLigne()) void e.enregistrer().catch(() => {}); });
  return true;
}

const DEPART_MS = 4000;

/** Appelé une fois par `main.tsx`. Le précache part après le premier affichage et après le premier geste de départ, pas avant. */
export function precacherHorsLigne(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };
  return programmerPrecache({
    disponible: () => 'serviceWorker' in navigator && import.meta.env.MODE === 'production',
    reseauAMenager: () => nav.connection?.saveData === true || nav.connection?.effectiveType === 'slow-2g' || nav.connection?.effectiveType === '2g',
    enLigne: () => navigator.onLine !== false,
    auRepos: (f) => {
      const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
      const lancer = () => window.setTimeout(() => { if (w.requestIdleCallback) w.requestIdleCallback(f, { timeout: 10000 }); else f(); }, DEPART_MS);
      if (document.readyState === 'complete') lancer(); else window.addEventListener('load', lancer, { once: true });
    },
    // registerSW (vite-plugin-pwa) enregistre `/sw.js` et écoute ses versions ; chargé à la demande, hors du chemin du premier affichage.
    enregistrer: () => import('./enregistrerPwa').then(m => m.enregistrerPwa()),
  });
}
