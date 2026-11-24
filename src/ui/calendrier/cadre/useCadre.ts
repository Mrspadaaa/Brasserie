import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type { Periode } from '../../../components/periode/periode';
import { StorageService } from '../../../services/storage';
import type { Echelle } from '../echelle';
import { etatInitial, instantaneDe, lire, reduire, type ActionCadre, type EtatCadre, type Horizon, type Instantane, type LectureCadre } from './etat';

/**
 * Le cœur de la frise branché dans l'onglet (D444) : un `useReducer` sur `etat.ts`, la fenêtre gardée par appareil, la période de l'app suivie.
 *
 * CAL-PERIODE-APP-FIXE (22.11, « Cette période là reste fixe, le reste peut être mobile ») : la fenêtre du Calendrier est locale ; elle se garde
 * avec la période de l'app qu'elle accompagnait. Au rechargement elle revient telle quelle, sauf si la période de l'app a changé entre-temps
 * (alors celle-ci l'emporte). Même clé et même forme qu'avant (`laffinee.calendrier.fenetre-locale`) : les fenêtres déjà gardées reviennent.
 */
const CLE_FENETRE_LOCALE = 'laffinee.calendrier.fenetre-locale';
const CLE_ECHELLE = 'calendrier_echelle';

function lireGardee(): { app: string; locale: Periode | null } | null {
  try { const brut = localStorage.getItem(CLE_FENETRE_LOCALE); return brut ? JSON.parse(brut) : null; } catch { return null; }
}
function ecrireGardee(app: string, locale: Periode): void {
  try { localStorage.setItem(CLE_FENETRE_LOCALE, JSON.stringify({ app, locale })); } catch { /* stockage plein ou refusé : la fenêtre ne se garde pas */ }
}

export interface Cadre extends LectureCadre {
  etat: EtatCadre;
  agir: (a: ActionCadre) => void;
  /** L'état d'avant, pour un Annuler. */
  instantane: () => Instantane;
}

export function useCadre(o: { app: Periode | undefined; centrerSur?: string; paysage: boolean; horizon: Horizon }): Cadre {
  const cleApp = JSON.stringify(o.app ?? null);
  const hRef = useRef(o.horizon);
  hRef.current = o.horizon;
  const [etat, envoyer] = useReducer(
    (e: EtatCadre, a: ActionCadre) => reduire(e, a, hRef.current),
    undefined,
    () => {
      const g = lireGardee();
      return etatInitial({ app: o.app, gardee: g && g.app === cleApp ? g.locale : null, centrerSur: o.centrerSur, echelle: StorageService.getUiState<Echelle>(CLE_ECHELLE, 'semaine'), paysage: o.paysage }, o.horizon);
    }
  );
  /* l'état courant, lu par les gestes sans attendre le rendu (une barre tenue au bord pose plusieurs fenêtres de suite) */
  const etatRef = useRef(etat);
  etatRef.current = etat;
  const agir = useCallback((a: ActionCadre) => {
    etatRef.current = reduire(etatRef.current, a, hRef.current);
    envoyer(a);
  }, []);

  /* la période de l'app a changé (barre de l'app, Finances) : la fenêtre gardée pour elle, sinon elle */
  /* T32-1 : « régler à nouveau cette même période ne recadre pas la frise » : la période de l'app est un état de l'App (une nouvelle valeur à chaque
     choix, même identique) ; le cadre se pose sur elle à chaque choix. Changée, la fenêtre gardée pour elle revient ; re-choisie telle quelle, la
     période l'emporte sur la fenêtre déplacée depuis. */
  const cleVue = useRef(cleApp);
  const appVue = useRef(o.app);
  useEffect(() => {
    if (o.app === appVue.current) return;
    appVue.current = o.app;
    const change = cleApp !== cleVue.current;
    cleVue.current = cleApp;
    const g = lireGardee();
    agir({ type: 'app', periode: o.app, gardee: change && g && g.app === cleApp ? g.locale : null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.app]);

  /* E10 : en paysage, 13 semaines au moins ; la fenêtre d'avant au retour */
  useEffect(() => { agir({ type: 'orientation', paysage: o.paysage }); }, [o.paysage, agir]);

  /* la fenêtre se garde à chaque changement, sauf posée par un saut vers une chose (CHN-6) */
  const clePeriode = JSON.stringify(etat.periode);
  useEffect(() => { if (!etat.ephemere && !etat.paysage) ecrireGardee(cleVue.current, etat.periode); }, [clePeriode, etat.ephemere, etat.paysage]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { StorageService.setUiState(CLE_ECHELLE, etat.echelle); }, [etat.echelle]);

  const lecture = useMemo(() => lire(etat, o.horizon), [etat, o.horizon]);
  const instantane = useCallback(() => instantaneDe(etatRef.current), []);
  return { ...lecture, etat, agir, instantane };
}
