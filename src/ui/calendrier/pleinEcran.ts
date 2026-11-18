import { REQUETE_PAYSAGE } from './useOrientation';

/**
 * Le plein écran (E09, D-2, D-205) : Fullscreen API, puis `screen.orientation.lock('landscape')` dans un `try`. Le verrou échoue sur iPhone
 * (et partout hors plein écran) : l'invitation « Tourne le téléphone » est alors le repli, jamais une erreur.
 *
 * Le verrou « pris » ne suffit pas (CRITIQUE-4 n° 19) : certains navigateurs (l'émulateur de Chrome, des Android) résolvent `lock` sans que
 * l'écran tourne. Et il peut ne jamais répondre (CRITIQUE-7, doute E09 : ni paysage ni invitation à 390). On n'attend donc jamais la promesse
 * du verrou : on attend que le calendrier soit réellement passé en paysage (la même requête que `useOrientation`), 1 s au plus ; sinon,
 * l'invitation. Un verrou refusé l'appelle tout de suite.
 */
export type ResultatPleinEcran = 'verrouille' | 'invite';

interface Cible { requestFullscreen?: () => Promise<void>; webkitRequestFullscreen?: () => Promise<void> | void }
interface Verrou { lock?: (orientation: string) => Promise<void>; unlock?: () => void }

/**
 * La page est-elle couchée comme un téléphone tourné ? La requête de `useOrientation` (paysage ET fenêtre basse) : une fenêtre plein écran
 * devenue large sans que le téléphone ait tourné (émulateur) n'est pas un paysage, le calendrier n'y change pas de mise en page.
 */
export const REQUETE_COUCHE = REQUETE_PAYSAGE;
/** Temps laissé à l'écran pour tourner après le plein écran : au-delà, l'invitation. */
export const DELAI_ROTATION_MS = 1000;

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

/** Une promesse bornée : sa valeur, ou `delai` si elle ne s'est pas réglée dans `ms` (une promesse qui ne répond jamais n'arrête rien). */
function borner<T>(p: Promise<T>, ms: number): Promise<T | 'delai'> {
  let minuterie: ReturnType<typeof setTimeout> | undefined;
  const delai = new Promise<'delai'>(r => { minuterie = setTimeout(() => r('delai'), ms); });
  return Promise.race([p, delai]).finally(() => clearTimeout(minuterie));
}

/**
 * Passe `cible` (par défaut la page) en plein écran, puis tente de verrouiller le paysage. `invite` : le verrou est absent ou refusé, ou
 * l'écran n'a pas tourné dans la seconde (verrou pris sans effet, ou qui ne répond jamais).
 */
export async function entrerPleinEcran(cible?: HTMLElement | null): Promise<ResultatPleinEcran> {
  const el = (cible ?? document.documentElement) as unknown as Cible;
  try {
    const demande = typeof el.requestFullscreen === 'function' ? el.requestFullscreen() : typeof el.webkitRequestFullscreen === 'function' ? el.webkitRequestFullscreen() : undefined;
    if (demande) await borner(Promise.resolve(demande), DELAI_ROTATION_MS);
  } catch { /* refusé (iPhone, iframe) : on tente quand même le verrou, puis on invite */ }
  let verrou: Promise<void>;
  try {
    const orientation = (typeof screen !== 'undefined' ? screen.orientation : undefined) as unknown as Verrou | undefined;
    if (!orientation || typeof orientation.lock !== 'function') return 'invite';
    verrou = Promise.resolve(orientation.lock('landscape'));
  } catch {
    return 'invite';
  }
  // Refusé : l'invitation sans attendre. Pris ou muet : seul compte l'écran tourné dans la seconde.
  const refus = verrou.then(() => new Promise<never>(() => undefined), () => false as const);
  return (await Promise.race([attendrePaysage(), refus])) ? 'verrouille' : 'invite';
}

/** Quitte le plein écran et rend l'orientation. */
export async function sortirPleinEcran(): Promise<void> {
  try { (screen.orientation as unknown as Verrou | undefined)?.unlock?.(); } catch { /* rien à rendre */ }
  try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { /* déjà sorti */ }
}
