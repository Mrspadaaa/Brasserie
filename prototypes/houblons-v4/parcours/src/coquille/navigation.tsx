// Navigation de la maquette : la pile de routes de `useFullScreenRoute.ts` (l'extension en pile du crochet de l'app,
// B1), plus une couche propre à la maquette, à part : le hash des pages construites (#/comparer?h=…), pour qu'une
// page s'ouvre en file:// sur sa route et que les contrôles lisent la route dans l'adresse.
// Au portage : `NavigationParcours` disparaît ; `aller` = `open`, `retour` = `close`, `revenirMaBiere` =
// `closeTo(r => r.view === 'recipe', …)` du crochet de l'app ; le hash et `hashchange` restent dans la maquette.
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { ecrireRoute, lireRoute, parent, type Route } from './routes';
import { useFullScreenRoute } from './useFullScreenRoute';

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
const MA_BIERE: Route = { ecran: 'ma-biere' };
const estMaBiere = (r: Route) => r.ecran === 'ma-biere';

export function NavigationParcours({ depart, comparerDefaut, children }: { depart: Route; comparerDefaut: string[]; children: ReactNode }) {
  const parentDe = useCallback((r: Route) => parent(r, comparerDefaut), [comparerDefaut]);
  const pile = useFullScreenRoute<Route>({ depart: lireRoute(location.hash) ?? depart, parent: parentDe, adresse: ecrireRoute });
  const { route, open, close, closeTo, replaceTop } = pile;

  // Maquette seulement : un hash changé à la main (contrôles, adresse tapée) remplace l'écran du sommet.
  useEffect(() => {
    const lire = () => replaceTop(lireRoute(location.hash) ?? MA_BIERE);
    window.addEventListener('hashchange', lire);
    return () => window.removeEventListener('hashchange', lire);
  }, [replaceTop]);

  const revenirMaBiere = useCallback(() => closeTo(estMaBiere, MA_BIERE), [closeTo]);
  const valeur = useMemo(() => ({ route, aller: open, retour: close, revenirMaBiere }), [route, open, close, revenirMaBiere]);
  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function useNavigation(): Navigation {
  const n = useContext(Ctx);
  if (!n) throw new Error('useNavigation hors de NavigationParcours');
  return n;
}
