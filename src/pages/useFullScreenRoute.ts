import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Ouverture et fermeture des pages plein écran, branchées sur l'historique.
 *
 * ⚠️ Ce que ça règle : une modale ne se ferme pas au geste retour. Sur un
 * téléphone, le réflexe est de balayer depuis le bord — et l'application
 * entière se fermait, en pleine ébullition.
 *
 * Chaque ouverture pousse une entrée d'historique ; le retour du navigateur
 * referme donc la page. Sans dépendance de routage : `react-router` imposerait
 * de refondre les cinq onglets pour un seul comportement.
 */

export type Route =
  | { view: 'tabs' }
  | { view: 'recipe'; recipeId: string }
  | { view: 'brewday'; batchId: string }
  | {
      view: 'wizard';
      recipeId?: string;
      title?: string;
      description?: string;
      duplicate?: boolean;
    };

const MARKER = 'laffinee-page';

export function useFullScreenRoute() {
  const [route, setRoute] = useState<Route>(() => {
    const batchId = new URLSearchParams(window.location.search).get('brewday');
    return batchId && /^[\w-]{1,100}$/.test(batchId)
      ? { view: 'brewday', batchId }
      : { view: 'tabs' };
  });
  // Compte les entrées poussées par l'application, pour ne dépiler que les
  // nôtres — sinon fermer une page ferait reculer dans l'historique du site.
  const pushed = useRef(0);

  const open = useCallback((next: Exclude<Route, { view: 'tabs' }>) => {
    setRoute(next);
    pushed.current += 1;
    window.history.pushState({ [MARKER]: true }, '');
  }, []);

  const close = useCallback(() => {
    if (pushed.current > 0) {
      // `popstate` remettra la route à `tabs` : on ne le fait pas ici, pour
      // qu'il n'y ait qu'un seul chemin de fermeture.
      window.history.back();
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete('brewday');
      window.history.replaceState({}, '', url);
      setRoute({ view: 'tabs' });
    }
  }, []);

  useEffect(() => {
    const onPop = () => {
      if (pushed.current > 0) pushed.current -= 1;
      setRoute({ view: 'tabs' });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return { route, open, close };
}
