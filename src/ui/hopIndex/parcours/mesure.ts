// Mémoïsation et chronométrage des appels au moteur. Un appel servi par le cache n'est pas un recalcul : les
// deux sont comptés à part (leçon L20 : une entrée répétée mesure le cache, pas le moteur).

export interface Mesure { nom: string; ms: number; cache: boolean; t: number }
const JOURNAL: Mesure[] = [];
const MAX_JOURNAL = 2000;

/** Journal des appels (le script de parcours lit window.__parcours.mesures). */
export const mesures = () => JOURNAL;
export function viderMesures() { JOURNAL.length = 0; }

/** Médiane des durées des vrais recalculs (cache manqué) d'un nom, ou de tous ; null sans recalcul. */
export function medianeRecalcul(nom?: string): number | null {
  const xs = JOURNAL.filter((m) => !m.cache && (!nom || m.nom === nom)).map((m) => m.ms).sort((a, b) => a - b);
  if (!xs.length) return null;
  const k = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[k] : (xs[k - 1] + xs[k]) / 2;
}

function noter(m: Mesure) {
  JOURNAL.push(m);
  if (JOURNAL.length > MAX_JOURNAL) JOURNAL.splice(0, JOURNAL.length - MAX_JOURNAL);
}

// Préchauffage au repos (prechauffage.ts) : ses calculs sont journalisés sous « prechauffage:<nom> », pour que les
// contrôles qui comptent les recalculs d'un geste (lireBiere, cache manqué) ne les prennent pas pour les leurs.
let prefixe = '';
/** Exécute `fn` en marquant ses appels au moteur comme préchauffage. */
export function enPrechauffage<T>(fn: () => T): T {
  const avant = prefixe;
  prefixe = 'prechauffage:';
  try { return fn(); } finally { prefixe = avant; }
}

const CACHES: Map<string, unknown>[] = [];
/** Vide tous les caches de l'adaptateur (les données injectées ont changé : moteur/donnees.ts). */
export function viderCaches(): void { for (const c of CACHES) c.clear(); }

/** Enveloppe une fonction pure : résultat mis en cache par clé (au plus `taille` entrées, la plus ancienne
 * sort d'abord), chaque appel chronométré par performance.now. */
export function memo<A extends unknown[], R>(nom: string, cle: (...a: A) => string, fn: (...a: A) => R, taille = 400): (...a: A) => R {
  const cache = new Map<string, R>();
  CACHES.push(cache);
  return (...a: A) => {
    const k = cle(...a);
    const t0 = performance.now();
    if (cache.has(k)) {
      const r = cache.get(k)!;
      cache.delete(k); cache.set(k, r);
      noter({ nom: prefixe + nom, ms: performance.now() - t0, cache: true, t: t0 });
      return r;
    }
    const r = fn(...a);
    noter({ nom: prefixe + nom, ms: performance.now() - t0, cache: false, t: t0 });
    cache.set(k, r);
    if (cache.size > taille) cache.delete(cache.keys().next().value as string);
    return r;
  };
}
