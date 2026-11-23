/**
 * Voie p5 (jeu en ligne 9, bloquant 1, DP-5) : « Ça devrait scroll pour pouvoir voir l'item en entier, et permettre de cliquer sur l'unité ». Une ligne ajoutée à la main se voit ENTIÈRE, à toute largeur :
 * son haut sous l'en-tête et les bandes collantes, le bas de ses cases d'unité au-dessus du pied (et du clavier). Le conteneur qui défile est l'ANCÊTRE de la ligne qui défile réellement (celui dont
 * le contenu dépasse), jamais un conteneur supposé ; le décalage se mesure sur les rectangles du moment, en défilement instantané, et se rejoue quand la mise en page bouge (plateau qui s'ouvre, vue qui s'ajoute).
 */

export interface MesuresVue {
  /** Haut et bas de la ligne ajoutée, en pixels de la fenêtre. */
  ligneHaut: number;
  /** Bas des cases d'unité (ou du dernier champ de la ligne que le brasseur doit pouvoir toucher) ; absent : le bas de la ligne. */
  uniteBas?: number;
  ligneBas: number;
  /** Bas des éléments collants posés en haut du conteneur (au moins le haut du conteneur). */
  collantBas: number;
  /** Bas de la zone visible : le plus petit du pied, du bas du conteneur et du clavier. */
  basVisible: number;
  marge?: number;
}

/**
 * Le décalage de défilement à demander (positif : vers le bas). `haut` : la ligne monte juste sous les éléments collants (la ligne qu'on vient d'ajouter) ; `minimal` : on ne bouge que si la
 * ligne sort de la zone (le nom vient d'être tapé). Dans les deux cas, si la ligne ne tient pas entière, le bas de l'unité passe avant le haut : c'est elle qu'on touche pour fermer le clavier.
 */
export function decalageVoulu(m: MesuresVue, mode: 'haut' | 'minimal'): number {
  const marge = m.marge ?? 4, cible = m.collantBas + marge, uniteBas = m.uniteBas ?? m.ligneBas;
  const versLeHaut = m.ligneHaut - cible;
  const pourLUnite = uniteBas - m.basVisible;
  if (mode === 'haut') return Math.round(Math.max(versLeHaut, pourLUnite));
  if (versLeHaut < 0) return Math.round(versLeHaut);
  return pourLUnite > 0 ? Math.round(Math.min(pourLUnite, Math.max(versLeHaut, pourLUnite))) : 0;
}

const DEFILE = /(auto|scroll|overlay)/;
/** L'ancêtre le plus proche de `el` qui défile réellement : un `overflow-y` auto ou scroll ET un contenu plus haut que lui. Rien : `null` (la page). */
export function ancetreDefilant(el: HTMLElement): HTMLElement | null {
  for (let a = el.parentElement; a; a = a.parentElement) {
    const s = getComputedStyle(a);
    if (DEFILE.test(s.overflowY) && a.scrollHeight > a.clientHeight + 1) return a;
  }
  return null;
}

const COLLANTS = '.dp-p3c-bande-entete,.dp-p3c-filtre,[data-dp-bande-entete],[class*="sticky"]';
/** Le bas des éléments collants posés en haut de `conteneur`, au-dessus de la ligne (même colonne : ceux qui ne la recouvrent pas en largeur, comme la colonne de gauche, ne comptent pas). */
export function basDesCollants(conteneur: HTMLElement, el: HTMLElement): number {
  const c = conteneur.getBoundingClientRect(), e = el.getBoundingClientRect();
  let bas = c.top;
  conteneur.querySelectorAll<HTMLElement>(COLLANTS).forEach(n => {
    if (n.contains(el) || el.contains(n)) return;
    if (getComputedStyle(n).position !== 'sticky') return;
    const r = n.getBoundingClientRect();
    if (r.height <= 0 || r.width <= 0 || r.right <= e.left + 1 || r.left >= e.right - 1) return;
    if (r.top <= c.top + 2 && r.bottom > bas && r.bottom < c.top + (c.bottom - c.top) / 2) bas = r.bottom;
  });
  return bas;
}

/** Le bas de la zone où le brasseur voit : le conteneur, le pied (`footer`) et, quand le clavier a réduit la vue, le bas de la vue visuelle. */
export function basVisibleDe(conteneur: HTMLElement | null): number {
  let bas = typeof window !== 'undefined' ? window.innerHeight : 0;
  if (conteneur) bas = Math.min(bas, conteneur.getBoundingClientRect().bottom);
  const racine = conteneur?.closest('[role="dialog"],[aria-modal]') ?? document;
  const pied = racine.querySelector('footer');
  if (pied) { const p = pied.getBoundingClientRect(); if (p.height > 0) bas = Math.min(bas, p.top); }
  const vv = typeof window !== 'undefined' ? window.visualViewport : null;
  if (vv && vv.height > 0) bas = Math.min(bas, vv.offsetTop + vv.height);
  return bas;
}

/** Ce que la ligne a de touchable en bas : ses cases d'unité, sinon le champ d'unité, sinon sa fin. */
const uniteDe = (el: HTMLElement): HTMLElement | null => el.querySelector<HTMLElement>('[data-dp-cases-unite]') ?? el.querySelector<HTMLElement>('[aria-label^="Unité"]');

/** Défile le bon conteneur pour montrer la ligne. Rend le décalage demandé (0 : rien à faire, ou rien à défiler). */
export function amenerEnVue(el: HTMLElement, mode: 'haut' | 'minimal', repli?: HTMLElement | null): number {
  const sc = ancetreDefilant(el) ?? (repli && repli.contains(el) ? repli : null);
  if (!sc) return 0;
  const l = el.getBoundingClientRect(), u = uniteDe(el)?.getBoundingClientRect();
  const delta = decalageVoulu({ ligneHaut: l.top, ligneBas: l.bottom, ...(u && u.height > 0 ? { uniteBas: u.bottom } : {}), collantBas: basDesCollants(sc, el), basVisible: basVisibleDe(sc) }, mode);
  if (delta) sc.scrollBy?.({ top: delta, behavior: 'instant' as ScrollBehavior });
  return delta;
}

/** Rejoue `amenerEnVue` tant que la mise en page bouge (plateau qui s'ouvre, vue ajoutée, clavier) : au tour même, puis après chaque image et à 150, 400 ms. */
export function garderEnVue(el: HTMLElement, mode: 'haut' | 'minimal', repli?: HTMLElement | null, vivant: () => boolean = () => true): () => void {
  const minuteurs: ReturnType<typeof setTimeout>[] = [];
  let quitte = false;
  const une = (m: 'haut' | 'minimal') => { if (!quitte && vivant() && el.isConnected) amenerEnVue(el, m, repli); };
  une(mode);
  const trame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(() => requestAnimationFrame(() => une('minimal'))) : 0;
  for (const ms of [150, 400]) minuteurs.push(setTimeout(() => une('minimal'), ms));
  return () => { quitte = true; minuteurs.forEach(clearTimeout); if (trame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(trame); };
}
