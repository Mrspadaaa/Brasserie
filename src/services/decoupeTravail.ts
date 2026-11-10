// LO-2 : le client du Worker de découpe (`decoupe.worker.ts`). Un Worker de module, un fichier de l'app (jamais un blob : la CSP n'en veut pas), créé au premier
// besoin. Sans Worker, sans OffscreenCanvas, sans createImageBitmap (vieux Safari), hors ligne si le fichier du Worker n'est pas en cache, ou à la première
// erreur du Worker : `planifierHorsFil` rend `undefined` et l'appelant fait le même calcul sur le fil de la page (en rendant la main entre les étapes).
import type { DemandePlan, ReponsePlan } from './decoupe.worker';
import type { PlanImage } from './decoupe';

/** Au-delà, le Worker est jugé muet (bloqué, tué par le navigateur) : on le jette et la page calcule elle-même. */
export const DELAI_WORKER_MS = 30_000;

interface Attente { fin: (plan: PlanImage | null | undefined) => void; minuterie: ReturnType<typeof setTimeout> }

let travailleur: Worker | null = null;
/** Vrai après un échec : le Worker n'est plus essayé avant le prochain rechargement. */
let abandonne = false;
let compteur = 0;
const attentes = new Map<number, Attente>();

export const travailleurPossible = (): boolean =>
  !abandonne && typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap !== 'undefined';

/** Abandonne le Worker et rend `undefined` à tous les appels en attente : leur calcul se refait sur le fil de la page. */
function abandonner(): void {
  abandonne = true;
  travailleur?.terminate();
  travailleur = null;
  for (const [id, attente] of attentes) { clearTimeout(attente.minuterie); attente.fin(undefined); attentes.delete(id); }
}

function demarrer(): Worker | null {
  if (travailleur) return travailleur;
  try {
    const w = new Worker(new URL('./decoupe.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent<ReponsePlan>) => {
      const attente = attentes.get(e.data.id);
      if (!attente) return;
      clearTimeout(attente.minuterie); attentes.delete(e.data.id);
      // Une erreur du Worker (canevas indisponible, image refusée) : la page refait le calcul, et trouve elle-même la même erreur si elle est vraie.
      attente.fin('plan' in e.data ? e.data.plan : undefined);
    };
    w.onerror = () => abandonner();
    w.onmessageerror = () => abandonner();
    travailleur = w;
    return w;
  } catch {
    abandonne = true;
    return null;
  }
}

/**
 * Le plan d'une photo, calculé dans le Worker : `PlanImage`, `null` (rien à découper), ou `undefined` (le Worker ne peut pas : à calculer sur la page).
 * Ne lève jamais.
 */
export function planifierHorsFil(fichier: Blob, force: boolean): Promise<PlanImage | null | undefined> {
  if (!travailleurPossible()) return Promise.resolve(undefined);
  const w = demarrer();
  if (!w) return Promise.resolve(undefined);
  return new Promise(resolve => {
    const id = ++compteur;
    const minuterie = setTimeout(abandonner, DELAI_WORKER_MS);
    attentes.set(id, { fin: resolve, minuterie });
    try { w.postMessage({ id, fichier, force } satisfies DemandePlan); } catch { abandonner(); }
  });
}
