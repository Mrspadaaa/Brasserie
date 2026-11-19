/**
 * APP-ENTETE-COLLE (vision du 19.11) : Stocks défilait dans son propre conteneur (`overflow-y-auto`), l'en-tête de l'app restait
 * collé en haut. Il défile désormais avec la fenêtre, comme les autres onglets. La liste virtualisée (react-virtuoso, via EntityList)
 * ne sait s'appuyer que sur un élément (`customScrollParent`) : on lui donne un élément fixe, invisible, de la taille de la fenêtre,
 * qui répond comme la fenêtre (`scrollTop` = `scrollY`, `scrollHeight` du document, `scroll` relayé, `scrollTo` de la fenêtre).
 * Sa boîte (`getBoundingClientRect` : haut 0, hauteur de la fenêtre) et sa `offsetHeight` sont déjà celles de la fenêtre.
 *
 * Mieux à terme : une option `useWindowScroll` dans EntityList (hors de ce lot). Rend la fonction qui débranche.
 */
export function brancherSurFenetre(el: HTMLElement): () => void {
  const fenetre = el.ownerDocument.defaultView;
  if (!fenetre) return () => {};
  const racine = el.ownerDocument.documentElement;
  Object.defineProperties(el, {
    scrollTop: { configurable: true, get: () => fenetre.scrollY, set: (v: number) => fenetre.scrollTo(fenetre.scrollX, v) },
    scrollHeight: { configurable: true, get: () => racine.scrollHeight },
    scrollTo: { configurable: true, value: (...a: [ScrollToOptions?]) => fenetre.scrollTo(...a) },
    scrollBy: { configurable: true, value: (...a: [ScrollToOptions?]) => fenetre.scrollBy(...a) }
  });
  const relais = () => el.dispatchEvent(new Event('scroll'));
  fenetre.addEventListener('scroll', relais, { passive: true });
  fenetre.addEventListener('resize', relais);
  return () => {
    fenetre.removeEventListener('scroll', relais);
    fenetre.removeEventListener('resize', relais);
    for (const p of ['scrollTop', 'scrollHeight', 'scrollTo', 'scrollBy']) delete (el as unknown as Record<string, unknown>)[p];
  };
}
