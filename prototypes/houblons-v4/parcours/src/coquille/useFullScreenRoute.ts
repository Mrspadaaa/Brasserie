// Pages plein écran branchées sur l'historique, EN PILE (B1, voie p8, 23.10). C'est l'extension de
// `useFullScreenRoute` de l'app (src/pages/useFullScreenRoute.ts) : même API (`route`, `open`, `close`), mais une pile
// de routes au lieu du seul retour à `tabs`. Au portage, ce fichier REMPLACE celui de l'app (le type `Route` de l'app
// en paramètre, `{ view: 'tabs' }` au fond), et les écrans ne changent pas.
//
// Pourquoi : dans l'app, tout `popstate` repose `tabs` (useFullScreenRoute.ts:63-70). Un outil à quatre niveaux
// (Ma bière → Suggérer → Comparer → Dryhopper → Levure) y fermerait la recette et le brouillon au premier retour du
// téléphone. Ici, chaque ouverture pousse une entrée ; le retour (téléphone ou « ‹ ») dépile UN niveau.
//
// Ce crochet ne connaît pas d'adresse : l'app n'en a pas pour ses pages plein écran. La maquette passe `adresse`
// (le hash de ses pages construites, navigation.tsx) ; l'app ne la passe pas.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** Marqueur des entrées poussées par l'app (le même que src/pages/useFullScreenRoute.ts). */
export const MARQUEUR = 'laffinee-page';
/** Profondeur de l'entrée : 0 pour la première entrée de la page, +1 par entrée poussée. Clé historique de la
 * maquette, relue par la fiche posée sur un outil (ecrans/dryhopper/fiche-sur-outil.tsx), qui pousse aussi la sienne. */
export const PROFONDEUR = 'affinee-parcours';
/** La route de l'entrée, sérialisée (objet simple) : sert à reconstruire la pile si l'historique avance. */
export const ROUTE = 'laffinee-route';

/** Une route de la pile et la profondeur de l'entrée d'historique qui la porte. */
export interface EtagePile<R> { route: R; profondeur: number }

export interface OptionsPile<R> {
  /** La route du fond (app : `{ view: 'tabs' }` ; maquette : la route de la page ouverte). */
  depart: R;
  /** Route posée quand on ferme le fond de la pile (page ouverte directement sur un outil). Absente : on reste. */
  parent?: (r: R) => R;
  /** Adresse d'une entrée (maquette : le hash). Absente : l'adresse ne change pas (app). */
  adresse?: (r: R) => string;
}

export interface PileDeRoutes<R> {
  /** La route du sommet : l'écran affiché. */
  route: R;
  /** La pile, du fond au sommet. */
  pile: R[];
  /** Ouvre une page plein écran par-dessus (pousse une entrée d'historique). */
  open: (next: R) => void;
  /** Ferme la page du sommet : un seul niveau (« ‹ », comme le retour du téléphone). */
  close: () => void;
  /** Revient à la plus haute route de la pile qui répond à `est` (app : la page recette ; maquette : Ma bière), en
   * dépilant les entrées poussées. Si la pile n'en a pas, revient au fond puis y pose `repli`. */
  closeTo: (est: (r: R) => boolean, repli: R) => void;
  /** Remplace la route du sommet sans toucher à l'historique (maquette : le hash changé à la main). */
  replaceTop: (r: R) => void;
}

const profondeurDe = (s: unknown) => (s && typeof (s as Record<string, unknown>)[PROFONDEUR] === 'number' ? ((s as Record<string, number>)[PROFONDEUR]) : 0);
const memeRoute = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

export function useFullScreenRoute<R>({ depart, parent, adresse }: OptionsPile<R>): PileDeRoutes<R> {
  const [etages, setEtages] = useState<EtagePile<R>[]>(() => [{ route: depart, profondeur: 0 }]);
  // La pile lue et écrite de façon synchrone par les écouteurs (popstate puis hashchange se suivent).
  const ref = useRef(etages);
  const poser = useCallback((e: EtagePile<R>[]) => { ref.current = e; setEtages(e); }, []);
  const opts = useRef({ parent, adresse }); opts.current = { parent, adresse };
  // Correction attendue après un saut de plusieurs entrées (closeTo).
  const apresSaut = useRef<null | (() => void)>(null);

  const etat = (route: R, profondeur: number) => ({ [MARQUEUR]: true, [PROFONDEUR]: profondeur, [ROUTE]: route });
  const ecrire = (mode: 'push' | 'replace', route: R, profondeur: number) => {
    const url = opts.current.adresse?.(route);
    if (mode === 'push') window.history.pushState(etat(route, profondeur), '', url);
    else window.history.replaceState(etat(route, profondeur), '', url);
  };

  useEffect(() => {
    // Première entrée : la route du fond, sans pousser, à la profondeur 0.
    ecrire('replace', ref.current[0].route, 0);
    const onPop = () => {
      const s = window.history.state as Record<string, unknown> | null;
      lirePop(s);
      if (apresSaut.current) { const f = apresSaut.current; apresSaut.current = null; f(); }
    };
    const lirePop = (s: Record<string, unknown> | null) => {
      // Entrée sans profondeur (un hash changé à la main, maquette) : la pile ne bouge pas.
      if (!s || typeof s[PROFONDEUR] !== 'number') return;
      const d = profondeurDe(s);
      const pile = ref.current;
      // Entrée sans route (la fiche posée sur un outil) : on garde les étages jusqu'à elle.
      if (!(ROUTE in s)) { const garde = pile.filter((e) => e.profondeur <= d); if (garde.length && garde.length !== pile.length) poser(garde); return; }
      const route = s[ROUTE] as R;
      const i = pile.findIndex((e) => e.profondeur === d);
      if (i >= 0 && memeRoute(pile[i].route, route)) { if (i !== pile.length - 1) poser(pile.slice(0, i + 1)); return; }
      poser([...pile.filter((e) => e.profondeur < d), { route, profondeur: d }]);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = useCallback((next: R) => {
    const d = profondeurDe(window.history.state) + 1;
    ecrire('push', next, d);
    poser([...ref.current, { route: next, profondeur: d }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poser]);

  const close = useCallback(() => {
    // Une entrée poussée par la page : le retour la dépile (popstate relit la pile), un seul chemin de fermeture.
    if (profondeurDe(window.history.state) > 0) { window.history.back(); return; }
    const pile = ref.current;
    const sommet = pile[pile.length - 1].route;
    const p = pile.length > 1 ? pile[pile.length - 2].route : opts.current.parent?.(sommet) ?? sommet;
    ecrire('replace', p, 0);
    poser([{ route: p, profondeur: 0 }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poser]);

  const closeTo = useCallback((est: (r: R) => boolean, repli: R) => {
    const n = profondeurDe(window.history.state);
    const pile = ref.current;
    let cible = -1;
    for (let i = pile.length - 1; i >= 0; i -= 1) if (est(pile[i].route)) { cible = i; break; }
    const vers = cible >= 0 ? pile[cible].profondeur : 0;
    const pas = n - vers;
    const corriger = () => {
      const s = ref.current[ref.current.length - 1];
      if (!est(s.route)) { ecrire('replace', repli, profondeurDe(window.history.state)); poser([...ref.current.slice(0, -1), { route: repli, profondeur: s.profondeur }]); }
    };
    if (pas > 0 && window.history.length > pas) { apresSaut.current = corriger; window.history.go(-pas); return; }
    if (pas === 0 && cible >= 0) { poser(pile.slice(0, cible + 1)); return; }
    ecrire('replace', repli, 0);
    poser([{ route: repli, profondeur: 0 }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poser]);

  const replaceTop = useCallback((r: R) => {
    const pile = ref.current;
    const s = pile[pile.length - 1];
    if (memeRoute(s.route, r)) return;
    poser([...pile.slice(0, -1), { route: r, profondeur: s.profondeur }]);
  }, [poser]);

  const pile = useMemo(() => etages.map((e) => e.route), [etages]);
  return { route: etages[etages.length - 1].route, pile, open, close, closeTo, replaceTop };
}
