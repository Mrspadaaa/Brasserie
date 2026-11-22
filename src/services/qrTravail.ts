// LO-2 : le client du Worker de QR (`qr.worker.ts`). Même règle que `decoupeTravail.ts` : un Worker de module, un fichier de l'app, créé au premier besoin ; sans
// Worker, sans OffscreenCanvas, ou à la première erreur / au premier silence trop long, il est abandonné et la page décode elle-même (`qrLecture.ts`).
import type { CodeLu } from './qrLecture';
import type { DemandeQr, ReponseQr } from './qr.worker';

/** Au-delà, le Worker est jugé muet (la lecture du QR a de toute façon son propre délai de 20 s) : on le jette, la page décode elle-même. */
export const DELAI_WORKER_QR_MS = 30_000;

type Codes = CodeLu[] | null | undefined;
interface Attente { fin: (codes: Codes) => void; minuterie: ReturnType<typeof setTimeout> }

let travailleur: Worker | null = null;
let abandonne = false;
let compteur = 0;
const attentes = new Map<number, Attente>();

export const travailleurQrPossible = (): boolean =>
  !abandonne && typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap !== 'undefined';

function abandonner(): void {
  abandonne = true;
  travailleur?.terminate();
  travailleur = null;
  for (const [id, attente] of attentes) { clearTimeout(attente.minuterie); attente.fin(undefined); attentes.delete(id); }
}

function demarrer(): Worker | null {
  if (travailleur) return travailleur;
  try {
    const w = new Worker(new URL('./qr.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent<ReponseQr>) => {
      const attente = attentes.get(e.data.id);
      if (!attente) return;
      clearTimeout(attente.minuterie); attentes.delete(e.data.id);
      // Une erreur du Worker (wasm refusé, mémoire) : la page décode elle-même, et trouve la même erreur si elle est vraie.
      attente.fin('codes' in e.data ? e.data.codes : undefined);
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

function demander(demande: DistributiveOmit<DemandeQr, 'id'>): Promise<Codes> {
  if (!travailleurQrPossible()) return Promise.resolve(undefined);
  const w = demarrer();
  if (!w) return Promise.resolve(undefined);
  return new Promise(resolve => {
    const id = ++compteur;
    const minuterie = setTimeout(abandonner, DELAI_WORKER_QR_MS);
    attentes.set(id, { fin: resolve, minuterie });
    try { w.postMessage({ ...demande, id } as DemandeQr); } catch { abandonner(); }
  });
}
type DistributiveOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;

/** Les symboles QR d'une image, décodés dans le Worker ; `undefined` : le Worker ne peut pas, la page décode. Ne lève jamais. */
export async function lireCodesHorsFil(entree: Blob): Promise<CodeLu[] | undefined> {
  return (await demander({ op: 'lire', entree })) ?? undefined;
}

/** La seconde passe (image agrandie puis décodée) dans le Worker : les codes, `null` (pas d'agrandissement utile), ou `undefined` (le Worker ne peut pas). */
export function lireAgrandieHorsFil(image: Blob): Promise<CodeLu[] | null | undefined> {
  return demander({ op: 'lireAgrandie', image });
}
