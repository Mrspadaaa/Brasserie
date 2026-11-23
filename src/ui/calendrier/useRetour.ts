import { useCallback, useEffect, useRef } from 'react';
import { sansMarque } from '../carnets/histoireCarnet';

/**
 * CT4A-12 (suite) : un renvoi parti d'un écran (le Calendrier : « Plus de détails › » d'une fête, un événement, une idée ; une section : son calendrier)
 * se referme en ramenant à cet écran, par le geste retour du téléphone ou du navigateur. Le renvoi pose une entrée d'historique (comme la page « Plus » :
 * même profondeur, la pile des pages n'est pas touchée) ; le retour la retire et rouvre l'écran d'origine. Si l'on quitte la destination autrement
 * (barre du bas), l'entrée est retirée : un retour plus tard ne saute pas à un écran que l'on a quitté.
 */
const CLE = 'laffinee-retour';

export function useRetourEcran<T extends string>(activeTab: T, setActiveTab: (t: T) => void): (origine: T) => void {
  const attente = useRef<{ origine: T; destination: T | null } | null>(null);

  const pousser = useCallback((origine: T) => {
    if (attente.current) { attente.current = { origine, destination: null }; return; }
    /* CA13-2 : la marque d'un carnet n'est pas recopiée ici ; sinon le Carnet prenait cette entrée pour la sienne et le retour restait sans effet */
    window.history.pushState({ ...sansMarque(window.history.state), [CLE]: origine }, '');
    attente.current = { origine, destination: null };
  }, []);

  useEffect(() => {
    const retour = () => {
      const a = attente.current;
      if (!a) return;
      attente.current = null;
      setActiveTab(a.origine);
    };
    window.addEventListener('popstate', retour);
    return () => window.removeEventListener('popstate', retour);
  }, [setActiveTab]);

  useEffect(() => {
    const a = attente.current;
    if (!a) return;
    if (a.destination === null) { if (activeTab !== a.origine) a.destination = activeTab; return; }
    if (activeTab === a.destination) return;
    /* quitté autrement que par le retour : l'entrée d'historique part avec le renvoi */
    attente.current = null;
    if ((window.history.state as Record<string, unknown> | null)?.[CLE]) window.history.back();
  }, [activeTab]);

  return pousser;
}
