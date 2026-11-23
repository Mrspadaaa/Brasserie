// Gestes qui ouvrent la fiche d'un houblon (D25, D49) : l'appui long (450 ms, DUREE_APPUI_LONG du socle) sur
// toute la carte du houblon, au doigt comme à la souris ; et, à l'ordinateur, un survol de 600 ms sur son nom.
// Un toucher court garde l'action de la carte (onCourt). Un seul doigt, une seule fiche : l'état est partagé
// par module. Après une fermeture, le survol se réarme dès que le pointeur a quitté un nom (sinon la fiche
// rouvrirait sous un pointeur immobile, quand le voile disparaît).
import { useCallback, useRef } from 'react';
import { DUREE_APPUI_LONG } from './commun';

export const DUREE_SURVOL = 600;

const partage = { fermeeA: 0, derniere: null as string | null, sortiDepuis: true };
/** À appeler quand une fiche se ferme. */
export function noterFermeture() {
  partage.fermeeA = performance.now();
  partage.sortiDepuis = false;
  for (const e of document.querySelectorAll('[data-fiche-survol]')) e.removeAttribute('data-fiche-survol');
}

type Props = Record<string, unknown>;

/** Au doigt, le « click » qui suit un appui long tombe sur le voile de la feuille qui vient de s'ouvrir et la
 * refermerait : on avale le premier click (phase de capture, avant React), pendant 350 ms au plus. */
function avalerClic() {
  const avaler = (e: Event) => { e.stopPropagation(); e.preventDefault(); fin(); };
  const fin = () => { window.removeEventListener('click', avaler, true); window.clearTimeout(t); };
  window.addEventListener('click', avaler, true);
  const t = window.setTimeout(fin, 350);
}

export function useGestesFiche(ouvrir: (cle: string) => void) {
  const long = useRef<number | null>(null);
  const survol = useRef<number | null>(null);
  const depart = useRef<{ x: number; y: number } | null>(null);
  const fait = useRef(false);
  const ouvrirRef = useRef(ouvrir); ouvrirRef.current = ouvrir;
  const stopLong = () => { if (long.current != null) window.clearTimeout(long.current); long.current = null; };
  const stopSurvol = () => { if (survol.current != null) window.clearTimeout(survol.current); survol.current = null; };
  const lancer = (cle: string) => { partage.derniere = cle; ouvrirRef.current(cle); };
  // D40 point 4 : la carte survolée à la souris est encadrée tant que sa fiche est ouverte (noterFermeture l'efface).
  const survolee = useRef<HTMLElement | null>(null);

  // D49 (« La zone de trigger est que le nom alors que ça devrait être la fiche entière ») : à l'ordinateur, le survol
  // long de toute la carte ouvre la fiche, comme sa base (fiche.js, zoneHoublon : la carte hors de ses commandes).
  const commande = (e: React.PointerEvent) => !!(e.target as Element).closest?.('button, input, a, select, textarea, [role="slider"]');
  const armerSurvol = (cle: string) => {
    if (survol.current != null) return;
    if (!partage.sortiDepuis && partage.derniere === cle) return;
    if (performance.now() - partage.fermeeA < 400) return;
    survol.current = window.setTimeout(() => { survol.current = null; survolee.current?.setAttribute('data-fiche-survol', ''); lancer(cle); }, DUREE_SURVOL);
  };

  /** Sur toute la carte du houblon : appui long → fiche ; toucher court → onCourt ; survol long à la souris → fiche. */
  const appui = useCallback((cle: string, onCourt?: () => void): Props => ({
    'data-appui-long': '',
    // r7 : le survol s'arme au mouvement de la souris (onPointerMove), jamais à l'entrée seule : un écran qui s'ouvre sous
    // une souris immobile (après un toucher sur un pont) ne doit pas ouvrir une fiche que personne n'a survolée.
    onPointerLeave: (e: React.PointerEvent) => { if (e.pointerType === 'mouse') { stopSurvol(); partage.sortiDepuis = true; } },
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button > 0) return;
      stopSurvol();
      fait.current = false;
      depart.current = { x: e.clientX, y: e.clientY };
      stopLong();
      long.current = window.setTimeout(() => { long.current = null; fait.current = true; avalerClic(); lancer(cle); }, DUREE_APPUI_LONG);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (depart.current && Math.hypot(e.clientX - depart.current.x, e.clientY - depart.current.y) > 10) stopLong();
      // À la souris : sur une commande de la carte (dose, ×, type…), le survol attend ; hors d'elle, il reprend.
      if (e.pointerType === 'mouse' && !e.buttons) { if (commande(e)) stopSurvol(); else { survolee.current = e.currentTarget as HTMLElement; armerSurvol(cle); } }
    },
    onPointerUp: () => { stopLong(); depart.current = null; },
    onPointerCancel: () => { stopLong(); depart.current = null; },
    onClick: (e: React.MouseEvent) => {
      if (fait.current) { e.preventDefault(); fait.current = false; return; }
      onCourt?.();
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  }), []);

  /** Sur le nom : survol long à la souris → fiche. */
  const nom = useCallback((cle: string): Props => ({
    onPointerMove: (e: React.PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.buttons) return;
      armerSurvol(cle);
    },
    onPointerLeave: () => { stopSurvol(); stopLong(); partage.sortiDepuis = true; },
  }), []);

  return { appui, nom };
}
