// Mesure partagée (y1) : ce que le + flottant recouvre VRAIMENT à l'écran à l'instant : les lignes de texte (rectangles des Range, pas la boîte
// du bloc) et les commandes (bouton, champ, lien) dont la boîte coupe celle du +. S'exécute dans la page : `page.evaluate(sousLePlus)`.
export function sousLePlus() {
  const fab = document.querySelector('.floating-actions > button');
  if (!fab || getComputedStyle(fab.parentElement).display === 'none') return null;
  const f = fab.getBoundingClientRect();
  // Un + masqué en défilant (opacité 0, aucun toucher) ne recouvre rien : on mesure l'état visible, pas la boîte.
  const sFab = getComputedStyle(fab);
  if (Number(sFab.opacity) < 0.05 || sFab.pointerEvents === 'none') return { fab: { left: f.left, top: f.top, right: f.right, bottom: f.bottom }, trouves: [], masque: true };
  const coupe = (r) => r.width > 0.5 && r.height > 0.5 && r.right > f.left + 1 && r.left < f.right - 1 && r.bottom > f.top + 1 && r.top < f.bottom - 1 && r.bottom > 0 && r.top < innerHeight;
  const trouves = new Map();
  // Une boîte coupée par le défilement d'un conteneur (overflow) garde sa place dans le calcul mais n'est pas à l'écran : on exige que l'élément soit
  // dans la pile des éléments touchés au centre de l'intersection avec le +.
  const visibleSous = (el, r) => {
    const cx = (Math.max(r.left, f.left) + Math.min(r.right, f.right)) / 2, cy = (Math.max(r.top, f.top) + Math.min(r.bottom, f.bottom)) / 2;
    return document.elementsFromPoint(cx, cy).some((x) => x !== fab && (x === el || el.contains(x)) && !x.matches('html, body, #root'));
  };
  const dedans = (n) => n.closest?.('.floating-actions, [role="menu"], .plus-pile, .plus-voile');
  const arbre = document.createTreeWalker(document.querySelector('[data-page-shell]') ?? document.body, NodeFilter.SHOW_TEXT);
  for (let n = arbre.nextNode(); n; n = arbre.nextNode()) {
    const t = n.textContent.replace(/\s+/g, ' ').trim();
    if (!t || dedans(n.parentElement)) continue;
    const s = getComputedStyle(n.parentElement);
    if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) continue;
    const range = document.createRange(); range.selectNodeContents(n);
    for (const r of range.getClientRects()) if (coupe(r) && visibleSous(n.parentElement, r)) { trouves.set(`texte|${t.slice(0, 40)}`, { genre: 'texte', nom: t.slice(0, 40) }); break; }
  }
  for (const e of (document.querySelector('[data-page-shell]') ?? document.body).querySelectorAll('button, input, select, textarea, a[href], [role="button"]')) {
    if (dedans(e)) continue;
    const s = getComputedStyle(e);
    if (s.visibility === 'hidden' || s.display === 'none') continue;
    if (coupe(e.getBoundingClientRect()) && visibleSous(e, e.getBoundingClientRect())) {
      const nom = (e.getAttribute('aria-label') || e.textContent || e.name || e.tagName).replace(/\s+/g, ' ').trim().slice(0, 40);
      trouves.set(`commande|${nom}`, { genre: 'commande', nom });
    }
  }
  return { fab: { left: f.left, top: f.top, right: f.right, bottom: f.bottom }, trouves: [...trouves.values()] };
}
