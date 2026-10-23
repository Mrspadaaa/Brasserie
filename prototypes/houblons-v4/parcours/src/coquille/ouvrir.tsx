// Gestes de la coquille, partagés par les écrans : ouvrir une route (avec son brouillon), thème, Recommencer.
import { useCallback } from 'react';
import { RotateCcw, SunMoon } from 'lucide-react';
import { useParcours, useGestes } from '../etat/EtatParcours';
import { brouillonPour } from '../etat/etapes';
import { useNavigation } from './navigation';
import type { Route } from './routes';

/** Ouvre un écran en préparant d'abord le brouillon que sa route suppose (pas d'écran d'outil sans brouillon). */
export function useOuvrir() {
  const { etat, dispatch } = useParcours();
  const { aller } = useNavigation();
  return useCallback((r: Route) => {
    const b = brouillonPour(r, etat);
    if (b && b !== 'garder') dispatch({ type: 'brouillon/ouvrir', brouillon: b });
    aller(r);
  }, [etat, dispatch, aller]);
}

/** Actions de la coquille, dans l'en-tête de Ma bière : thème (clair par défaut, cave) et Recommencer. */
export function ActionsCoquille() {
  const { recommencer } = useGestes();
  const { revenirMaBiere } = useNavigation();
  const basculer = () => {
    const h = document.documentElement;
    h.dataset.theme = h.dataset.theme === 'cave' ? 'clair' : 'cave';
  };
  return (
    <>
      <button type="button" data-role="theme" onClick={basculer} aria-label="Thème clair ou cave"
        className="touch-target rounded-control text-cave-200"><SunMoon className="w-4 h-4" aria-hidden="true" /></button>
      <button type="button" data-role="recommencer" onClick={() => { recommencer(); revenirMaBiere(); }} aria-label="Recommencer"
        className="touch-target rounded-control text-cave-200"><RotateCcw className="w-4 h-4" aria-hidden="true" /></button>
    </>
  );
}
