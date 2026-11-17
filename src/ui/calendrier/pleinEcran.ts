/**
 * Le plein écran (E09, D-2, D-205) : Fullscreen API, puis `screen.orientation.lock('landscape')` dans un `try`. Le verrou échoue sur iPhone
 * (et partout hors plein écran) : l'invitation « Tourne le téléphone » est alors le repli, jamais une erreur.
 *
 * Le verrou « pris » ne suffit pas (CRITIQUE-4 n° 19) : certains navigateurs (l'émulateur de Chrome, des Android) résolvent `lock` sans que
 * l'écran tourne. On attend donc que la page soit réellement en paysage (`(orientation: landscape)`), 600 ms au plus ; sinon : l'invitation.
 */
export type ResultatPleinEcran = 'verrouille' | 'invite';

interface Cible { requestFullscreen?: () => Promise<void>; webkitRequestFullscreen?: () => Promise<void> | void }
interface Verrou { lock?: (orientation: string) => Promise<void>; unlock?: () => void }

/** La page est-elle couchée ? (largeur > hauteur, au sens de la media query.) */
export const REQUETE_COUCHE = '(orientation: landscape)';
/** Temps laissé à l'écran pour tourner après le verrou. */
export const DELAI_ROTATION_MS = 600;

export const estPleinEcran = (): boolean => typeof document !== 'undefined' && !!document.fullscreenElement;

/** Vrai dès que la page est en paysage ; faux si elle ne l'est pas au bout de `ms`. */
export function attendrePaysage(ms = DELAI_ROTATION_MS): Promise<boolean> {
  const mq = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(REQUETE_COUCHE) : null;
  if (!mq) return Promise.resolve(false);
  if (mq.matches) return Promise.resolve(true);
  return new Promise(resoudre => {
    let fini = false;
    const finir = (v: boolean) => {
      if (fini) return;
      fini = true;
      clearTimeout(minuterie);
      mq.removeEventListener?.('change', change);
      resoudre(v);
    };
    const change = () => { if (mq.matches) finir(true); };
    mq.addEventListener?.('change', change);
    const minuterie = setTimeout(() => finir(mq.matches), ms);
  });
}

/**
 * Passe `cible` (par défaut la page) en plein écran, puis tente de verrouiller le paysage. `invite` : le verrou est refusé, absent, ou pris
 * sans que l'écran ait tourné dans les 600 ms.
 */
export async function entrerPleinEcran(cible?: HTMLElement | null): Promise<ResultatPleinEcran> {
  const el = (cible ?? document.documentElement) as unknown as Cible;
  try {
    if (typeof el.requestFullscreen === 'function') await el.requestFullscreen();
    else if (typeof el.webkitRequestFullscreen === 'function') await el.webkitRequestFullscreen();
  } catch { /* refusé (iPhone, iframe) : on tente quand même le verrou, puis on invite */ }
  try {
    const orientation = (typeof screen !== 'undefined' ? screen.orientation : undefined) as unknown as Verrou | undefined;
    if (!orientation || typeof orientation.lock !== 'function') return 'invite';
    await orientation.lock('landscape');
  } catch {
    return 'invite';
  }
  return (await attendrePaysage()) ? 'verrouille' : 'invite';
}

/** Quitte le plein écran et rend l'orientation. */
export async function sortirPleinEcran(): Promise<void> {
  try { (screen.orientation as unknown as Verrou | undefined)?.unlock?.(); } catch { /* rien à rendre */ }
  try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { /* déjà sorti */ }
}
