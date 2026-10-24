import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Ouverture et fermeture des pages plein écran, branchées sur l'historique, EN PILE.
 *
 * ⚠️ Ce que ça règle : une modale ne se ferme pas au geste retour. Sur un
 * téléphone, le réflexe est de balayer depuis le bord — et l'application
 * entière se fermait, en pleine ébullition.
 *
 * Chaque ouverture pousse une entrée d'historique ; le retour du navigateur
 * referme donc la page. Sans dépendance de routage : `react-router` imposerait
 * de refondre les cinq onglets pour un seul comportement.
 *
 * Deux sortes de routes (#162, D65) :
 * - une PAGE (`recipe`, `brewday`, `wizard`) se pose sur les onglets : la pile
 *   devient `[tabs, page]`, et son retour ramène aux onglets, comme avant ;
 * - une COUCHE (`hopV55` et les outils houblons v4) s'empile sur ce qui est
 *   ouvert : son retour dépile UN niveau, et la page dessous reste montée
 *   (`App.tsx`), avec son étape et son brouillon. L'ancien retour `hopV55`
 *   (un niveau) en est le cas particulier.
 *
 * Même API qu'avant (`route`, `open`, `close`), plus `pile`, `closeTo` et
 * `replaceTop`, comme la maquette (`prototypes/houblons-v4/parcours/src/coquille/useFullScreenRoute.ts`).
 */

export type Route =
  | { view: 'tabs' }
  | { view: 'recipe'; recipeId: string }
  | { view: 'brewday'; batchId: string }
  | { view: 'hopV55'; recipeId?: string; batchId?: string }
  | {
      view: 'wizard';
      recipeId?: string;
      title?: string;
      description?: string;
      duplicate?: boolean;
    }
  // Outils houblons v4 (ARCHITECTURE.md § Navigation). `recipeId` absent : l'outil
  // travaille sur le brouillon du wizard ouvert dessous.
  | { view: 'hopBeer'; recipeId?: string }
  | { view: 'hopSuggest'; recipeId?: string }
  | { view: 'hopCompare'; recipeId?: string; hops: string[]; pinned?: string }
  | { view: 'hopTiming'; recipeId?: string; additionId: string; step?: 'yeast' }
  | { view: 'hopSubstitute'; recipeId?: string; hopKey: string };

export type RouteView = Route['view'];
export type LayerRoute = Extract<Route, { view: 'hopV55' | 'hopBeer' | 'hopSuggest' | 'hopCompare' | 'hopTiming' | 'hopSubstitute' }>;

const LAYER_VIEWS: ReadonlySet<RouteView> = new Set<RouteView>(['hopV55', 'hopBeer', 'hopSuggest', 'hopCompare', 'hopTiming', 'hopSubstitute']);

/** Une couche s'empile sur la page ouverte ; une page remplace tout au-dessus des onglets. */
export const isLayerRoute = (route: Route): route is LayerRoute => LAYER_VIEWS.has(route.view);

/** Marqueur des entrées poussées par l'app. */
const MARKER = 'laffinee-page';
/** Profondeur de l'entrée d'historique : +1 par ouverture (même clé que la maquette). */
const DEPTH = 'affinee-parcours';
/** La route de l'entrée, pour le diagnostic et une future reprise en avant. */
const ROUTE = 'laffinee-route';

interface Floor { route: Route; depth: number }

export interface FullScreenRoute {
  /** La route du sommet : l'écran au premier plan. */
  route: Route;
  /** La pile, du fond (`tabs`) au sommet. */
  pile: Route[];
  /** La page restée montée sous les couches (onglets, recette, brassin, wizard). */
  base: Route;
  /** Les couches posées sur `base`, du bas vers le haut ; vide si la page est au premier plan. */
  layers: LayerRoute[];
  /** Ouvre une page ou une couche par-dessus (pousse une entrée d'historique). */
  open: (next: Exclude<Route, { view: 'tabs' }>) => void;
  /** Ferme le sommet : un seul niveau, comme le retour du téléphone. */
  close: () => void;
  /** Revient à la plus haute route de la pile qui répond à `is`, en un seul saut d'historique.
   * Absente de la pile : revient au fond et y ouvre `fallback`. */
  closeTo: (is: (route: Route) => boolean, fallback: Exclude<Route, { view: 'tabs' }>) => void;
  /** Remplace la route du sommet sans changer de profondeur. */
  replaceTop: (route: Exclude<Route, { view: 'tabs' }>) => void;
}

const depthOf = (state: unknown, fallback: number) => {
  const value = state && typeof state === 'object' ? (state as Record<string, unknown>)[DEPTH] : undefined;
  return typeof value === 'number' ? value : fallback;
};

export function useFullScreenRoute(): FullScreenRoute {
  // Profondeur de l'entrée au montage (0, ou celle d'avant un rechargement) : rien n'a été poussé en dessous.
  const base = useRef<number>(depthOf(window.history.state, 0));
  const [floors, setFloors] = useState<Floor[]>(() => {
    const tabs: Floor = { route: { view: 'tabs' }, depth: base.current };
    const batchId = new URLSearchParams(window.location.search).get('brewday');
    return batchId && /^[\w-]{1,100}$/.test(batchId)
      ? [tabs, { route: { view: 'brewday', batchId }, depth: base.current }]
      : [tabs];
  });
  // Lue et écrite de façon synchrone par les écouteurs : deux gestes peuvent se suivre avant le rendu.
  const current = useRef(floors);
  const set = useCallback((next: Floor[]) => { current.current = next; setFloors(next); }, []);
  /** Nombre d'entrées que l'app a poussées sous l'entrée courante : seules celles-là se dépilent par `back`,
   * sinon fermer une page ferait reculer dans l'historique du site. */
  const pushedBelow = () => depthOf(window.history.state, base.current) - base.current;
  const write = (mode: 'push' | 'replace', route: Route, depth: number) => {
    const state = { [MARKER]: true, [DEPTH]: depth, [ROUTE]: route };
    if (mode === 'push') window.history.pushState(state, '');
    else window.history.replaceState(state, '');
  };

  const open = useCallback((next: Exclude<Route, { view: 'tabs' }>) => {
    const pile = current.current;
    const depth = Math.max(depthOf(window.history.state, base.current), pile[pile.length - 1].depth) + 1;
    write('push', next, depth);
    set(isLayerRoute(next) ? [...pile, { route: next, depth }] : [pile[0], { route: next, depth }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set]);

  const closeLocally = () => {
    // Page ouverte sans entrée poussée (lien `?brewday=` ou rechargement) : on la retire sur place.
    const url = new URL(window.location.href);
    url.searchParams.delete('brewday');
    window.history.replaceState({}, '', url);
    const pile = current.current;
    set(pile.length > 1 ? pile.slice(0, -1) : pile);
  };

  const close = useCallback(() => {
    // `popstate` dépilera : un seul chemin de fermeture.
    if (pushedBelow() > 0) window.history.back();
    else closeLocally();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set]);

  // Correction à faire après un saut de plusieurs entrées (closeTo sans cible).
  const afterJump = useRef<null | (() => void)>(null);

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const depth = depthOf(event.state, base.current);
      const pile = current.current;
      // Le fond reste ; chaque étage plus profond que l'entrée retrouvée se ferme. Une entrée plus
      // profonde que la pile (avance) ne rouvre rien, comme avant.
      const kept = pile.filter((floor, i) => i === 0 || floor.depth <= depth);
      if (kept.length !== pile.length) set(kept);
      if (afterJump.current) { const fix = afterJump.current; afterJump.current = null; fix(); }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeTo = useCallback((is: (route: Route) => boolean, fallback: Exclude<Route, { view: 'tabs' }>) => {
    const pile = current.current;
    let target = -1;
    for (let i = pile.length - 1; i >= 0; i -= 1) if (is(pile[i].route)) { target = i; break; }
    if (target === pile.length - 1) return;
    const to = target >= 0 ? pile[target].depth : base.current;
    const steps = depthOf(window.history.state, base.current) - Math.max(to, base.current);
    const finish = () => {
      if (target >= 0) { set(current.current.slice(0, target + 1)); return; }
      const depth = depthOf(window.history.state, base.current);
      write('replace', fallback, depth);
      set([current.current[0], { route: fallback, depth }]);
    };
    if (steps > 0) { afterJump.current = finish; window.history.go(-steps); return; }
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set]);

  const replaceTop = useCallback((route: Exclude<Route, { view: 'tabs' }>) => {
    const pile = current.current;
    const top = pile[pile.length - 1];
    if (JSON.stringify(top.route) === JSON.stringify(route)) return;
    if (pile.length === 1) { set([...pile, { route, depth: top.depth }]); return; }
    if (depthOf(window.history.state, base.current) === top.depth) write('replace', route, top.depth);
    set([...pile.slice(0, -1), { route, depth: top.depth }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set]);

  const pile = useMemo(() => floors.map(floor => floor.route), [floors]);
  const { base: page, layers } = useMemo(() => {
    let i = pile.length - 1;
    while (i > 0 && isLayerRoute(pile[i])) i -= 1;
    return { base: pile[i], layers: pile.slice(i + 1) as LayerRoute[] };
  }, [pile]);
  return { route: floors[floors.length - 1].route, pile, base: page, layers, open, close, closeTo, replaceTop };
}
