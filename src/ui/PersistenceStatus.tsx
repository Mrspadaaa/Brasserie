import { useEffect, useLayoutEffect, useReducer, useState } from 'react';
import { FirestoreRepo } from '../services/firestoreRepo';
import { MARGE_AVIS_PX, basDeLAvis, hautDesBarresBasses } from '../services/miseAJour';

const enLigne = () => typeof navigator === 'undefined' || navigator.onLine !== false;

/** Avant ce délai, une écriture ou une actualisation passe sans signe : un enregistrement instantané ne fait pas clignoter l'écran. */
export const DELAI_AVIS_MS = 500;
const BARRES = 'footer, nav, [data-barre-bas], [class*="sticky"][class*="bottom-0"], [class*="fixed"][class*="bottom-0"]';

function useApresDelai(actif: boolean, ms: number): boolean {
  const [vu, setVu] = useState(false);
  useEffect(() => {
    if (!actif) { setVu(false); return; }
    const minuterie = setTimeout(() => setVu(true), ms);
    return () => clearTimeout(minuterie);
  }, [actif, ms]);
  return actif && vu;
}

/** Le `bottom` de l'avis : au-dessus de la barre la plus haute du bas de l'écran (navigation, pied d'une feuille), au-dessus de l'avis
 *  « Nouvelle version » s'il est là (il publie sa hauteur dans `--avis-maj`). Jamais en haut. */
function mesurerBas(): number {
  const vv = window.visualViewport;
  const basVisible = vv ? vv.offsetTop + vv.height : window.innerHeight;
  const boites = [...document.querySelectorAll<HTMLElement>(BARRES)].filter(el => !el.closest('[data-bandeau-persistance]')).map(el => el.getBoundingClientRect());
  const hauts = hautDesBarresBasses(boites, basVisible);
  let bas = basDeLAvis(window.innerHeight, hauts);
  if (!hauts.length && window.innerWidth < 1024) {
    // Barre non reconnue : la navigation publie sa hauteur ; en dessous d'elle, l'avis la couvrirait.
    const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--main-navigation-height'));
    if (Number.isFinite(nav) && nav > 0) bas = nav + MARGE_AVIS_PX;
  }
  const maj = parseFloat(document.documentElement.style.getPropertyValue('--avis-maj'));
  // Le message passager (toast) occupe le même coin, au-dessus de la barre : l'avis se pose au-dessus de lui, jamais dessous.
  const toast = document.querySelector<HTMLElement>('[data-toast]')?.getBoundingClientRect();
  const surToast = toast && toast.height > 0 ? Math.max(0, window.innerHeight - toast.top + 4 - bas) : 0;
  return Math.ceil(bas + (Number.isFinite(maj) && maj > 0 ? maj : 0) + surToast);
}

/**
 * L'avis de synchronisation. Calme quand tout est confirmé.
 *  BD-1 (24.11) : « Enregistrement sur le serveur… » n'apparaît que pendant une écriture RÉELLE de cet appareil (`writing`), jamais pour l'écho
 *  d'un instantané, qui restait des minutes ; il part à sa fin, ou dit l'échec. Il ne recouvre plus rien : posé en haut (CFP-8, L-49), il
 *  cachait ‹ Nov. ›, les onglets et les sous-onglets, car la mesure de l'en-tête se faisait une fois et ne voyait pas les onglets. Il est
 *  maintenant une petite pastille en bas à gauche, au-dessus de la barre du bas (comme « Nouvelle version »), sans prise de toucher ;
 *  seul « Actualiser » prend le doigt. `data-attente` dit ce qui retient l'écriture (diagnostic).
 *  L-56 (T11-13) : hors ligne, un signe, même sans écriture en attente. */
export function PersistenceStatus() {
  const [, refresh] = useReducer(n => n + 1, 0);
  const [enReseau, setEnReseau] = useState(enLigne);
  useEffect(() => FirestoreRepo.subscribe(refresh), []);
  useEffect(() => {
    const suivre = () => setEnReseau(enLigne());
    window.addEventListener('online', suivre);
    window.addEventListener('offline', suivre);
    return () => { window.removeEventListener('online', suivre); window.removeEventListener('offline', suivre); };
  }, []);
  const state = FirestoreRepo.syncStatus();
  // Hors ligne, tout ce qui n'est pas parti se garde sur l'appareil : `pending` (y compris ce qu'une session précédente a laissé) le dit.
  const enAttente = enReseau ? state.writing : state.pending;
  const veut = !enReseau || Boolean(state.error || enAttente || state.fromCache || state.refreshing);
  // Seuls l'échec et le hors ligne se montrent aussitôt ; le reste (écriture, actualisation, lecture du cache) attend un court délai.
  const immediat = Boolean(state.error) || !enReseau;
  const apres = useApresDelai(veut && !immediat, DELAI_AVIS_MS);
  const visible = veut && (immediat || apres);
  const [bas, setBas] = useState(MARGE_AVIS_PX);
  useLayoutEffect(() => {
    if (!visible) return;
    const mesurer = () => setBas(prev => { const b = mesurerBas(); return Math.abs(prev - b) < 1 ? prev : b; });
    mesurer();
    // La navigation, le pied d'une feuille, le clavier bougent : on remesure sans bruit (comme « Nouvelle version »).
    const minuterie = setInterval(mesurer, 400);
    window.addEventListener('resize', mesurer);
    window.visualViewport?.addEventListener('resize', mesurer);
    return () => { clearInterval(minuterie); window.removeEventListener('resize', mesurer); window.visualViewport?.removeEventListener('resize', mesurer); };
  }, [visible]);
  if (!visible) return null;
  const enregistrement = !state.error && enReseau && !state.refreshing && !state.fromCache;
  const texte = state.error || (!enReseau
    ? (state.pending ? 'Hors ligne · gardé sur l’appareil' : 'Hors ligne')
    : state.refreshing ? 'Actualisation des données…' : state.fromCache ? 'Synchronisation en attente · données de cet appareil' : 'Enregistrement sur le serveur…');
  return <div role="status" data-bandeau-persistance data-hors-ligne={enReseau ? undefined : ''} data-attente={state.pendingSources?.join(' ') || undefined}
    aria-label={enregistrement ? texte : undefined} title={enregistrement ? texte : undefined}
    style={{ bottom: bas }}
    className={`pointer-events-none fixed left-2 z-40 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-full border border-cave-700 bg-cave-850 px-2 py-0.5 text-[11px] leading-4 shadow-lift min-[1024px]:left-[calc(var(--rail-width,88px)+0.5rem)] ${state.error ? 'text-alert' : 'text-ebc-straw'}`}>
    {enregistrement
      ? <><span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-ebc-straw" /><span aria-hidden="true">Enregistrement…</span></>
      : texte}
    {enReseau && (state.needsRefresh || state.fromCache) && <button type="button" onClick={() => FirestoreRepo.resumeSync(true)}
      disabled={state.refreshing} className="pointer-events-auto ml-1 min-h-touch px-2 underline underline-offset-2 disabled:opacity-50">
      Actualiser
    </button>}
  </div>;
}
