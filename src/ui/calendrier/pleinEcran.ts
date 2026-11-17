/**
 * Le plein écran (E09, D-2, D-205) : Fullscreen API, puis `screen.orientation.lock('landscape')` dans un `try`. Le verrou échoue sur iPhone
 * (et partout hors plein écran) : l'invitation « Tourne le téléphone » est alors le repli, jamais une erreur.
 */
export type ResultatPleinEcran = 'verrouille' | 'invite';

interface Cible { requestFullscreen?: () => Promise<void>; webkitRequestFullscreen?: () => Promise<void> | void }
interface Verrou { lock?: (orientation: string) => Promise<void>; unlock?: () => void }

export const estPleinEcran = (): boolean => typeof document !== 'undefined' && !!document.fullscreenElement;

/** Passe `cible` (par défaut la page) en plein écran, puis tente de verrouiller le paysage. `invite` : le verrou n'a pas pris. */
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
    return 'verrouille';
  } catch {
    return 'invite';
  }
}

/** Quitte le plein écran et rend l'orientation. */
export async function sortirPleinEcran(): Promise<void> {
  try { (screen.orientation as unknown as Verrou | undefined)?.unlock?.(); } catch { /* rien à rendre */ }
  try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { /* déjà sorti */ }
}
