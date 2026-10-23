// Navigation branchée sur l'historique, comme useFullScreenRoute (src/pages/useFullScreenRoute.ts) : chaque
// ouverture pousse une entrée ; le retour du téléphone et « ‹ » reviennent à l'écran d'avant. La maquette
// porte la route dans le hash (pages ouvrables en file://) et compte ses entrées pour ne dépiler que les siennes.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ecrireRoute, lireRoute, parent, type Route } from './routes';

interface Navigation {
  route: Route;
  /** Ouvre un écran (pousse une entrée d'historique). */
  aller: (r: Route) => void;
  /** Revient à l'écran d'avant (« ‹ », retour du téléphone). */
  retour: () => void;
  /** Revient à Ma bière en dépilant les entrées poussées (après « Ajouter à ma bière » ou « Remplacer »). */
  revenirMaBiere: () => void;
}
const Ctx = createContext<Navigation | null>(null);
const CLE = 'affinee-parcours';
const profondeur = () => (history.state && typeof history.state[CLE] === 'number' ? (history.state[CLE] as number) : 0);

export function NavigationParcours({ depart, comparerDefaut, children }: { depart: Route; comparerDefaut: string[]; children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() => lireRoute(location.hash) ?? depart);
  const routeRef = useRef(route); routeRef.current = route;

  useEffect(() => {
    // Première entrée : la route de départ, sans pousser.
    history.replaceState({ [CLE]: 0 }, '', ecrireRoute(routeRef.current));
    const lire = () => setRoute(lireRoute(location.hash) ?? { ecran: 'ma-biere' });
    window.addEventListener('popstate', lire);
    window.addEventListener('hashchange', lire);
    return () => { window.removeEventListener('popstate', lire); window.removeEventListener('hashchange', lire); };
  }, []);

  const aller = useCallback((r: Route) => {
    history.pushState({ [CLE]: profondeur() + 1 }, '', ecrireRoute(r));
    setRoute(r);
  }, []);
  const retour = useCallback(() => {
    if (profondeur() > 0) { history.back(); return; }
    const p = parent(routeRef.current, comparerDefaut);
    history.replaceState({ [CLE]: 0 }, '', ecrireRoute(p));
    setRoute(p);
  }, [comparerDefaut]);
  const revenirMaBiere = useCallback(() => {
    const n = profondeur();
    // Ma bière est au fond de la pile quand la page a démarré sur elle ; sinon on la pose à la place.
    if (n > 0 && history.length > n) {
      history.go(-n);
      // Si l'entrée du fond n'est pas Ma bière, popstate lira sa route : on corrige après coup.
      const corriger = () => {
        window.removeEventListener('popstate', corriger);
        if (lireRoute(location.hash)?.ecran !== 'ma-biere') { history.replaceState({ [CLE]: 0 }, '', '#/ma-biere'); setRoute({ ecran: 'ma-biere' }); }
      };
      window.addEventListener('popstate', corriger);
      return;
    }
    history.replaceState({ [CLE]: 0 }, '', '#/ma-biere');
    setRoute({ ecran: 'ma-biere' });
  }, []);

  const valeur = useMemo(() => ({ route, aller, retour, revenirMaBiere }), [route, aller, retour, revenirMaBiere]);
  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function useNavigation(): Navigation {
  const n = useContext(Ctx);
  if (!n) throw new Error('useNavigation hors de NavigationParcours');
  return n;
}
