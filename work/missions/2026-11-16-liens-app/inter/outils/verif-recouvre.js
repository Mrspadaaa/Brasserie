/* Contrôle de recouvrement (passe 2, 16.11), évalué dans la page :
   - sousPlus : texte caché par le + volant (le + est l'élément au-dessus à cet endroit) ;
   - tranche  : ligne de texte coupée par le bord d'une surcouche (bandeau, bulle, toast, feuille), sauf sous un voile.
   Rend { sousPlus: [...], tranche: [...] }. */
(() => {
  const vis = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const out = { sousPlus: [], tranche: [] };
  const fab = [...document.querySelectorAll('#fab,.fab,.s-fab,.ix-fab')].find(vis);
  const OV = [...document.querySelectorAll('.ix-be,.ix-toast,.ix-bulle,.ix-sheet,.lk-pop,.lk-bul,.lk-tip,.lk-toast,.lk-sh,#toast,#s-toast')].filter(e => !e.hidden && vis(e));
  const voile = [...document.querySelectorAll('.ix-voile,.ix-dim,.lk-dim,.lk-voile,.scrim')].some(vis);
  const dans = (el, top) => !!top && (top === el || el.contains(top));
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let t;
  while ((t = tw.nextNode())) {
    const s = t.textContent.trim(); if (!s) continue;
    const e = t.parentElement; if (!e || !vis(e) || e.closest('svg,.ix-doigt,.lk-doigt')) continue;
    const rg = document.createRange(); rg.selectNodeContents(t);
    for (const r of rg.getClientRects()) {
      if (r.width < 2 || r.bottom < 0 || r.top > innerHeight) continue;
      if (fab && !fab.contains(e)) {
        const f = fab.getBoundingClientRect();
        const x0 = Math.max(r.left, f.left), x1 = Math.min(r.right, f.right), y0 = Math.max(r.top, f.top), y1 = Math.min(r.bottom, f.bottom);
        if (x1 - x0 > 2 && y1 - y0 > 2 && dans(fab, document.elementFromPoint((x0 + x1) / 2, (y0 + y1) / 2))) out.sousPlus.push(s.slice(0, 30));
      }
      if (voile) continue;
      for (const o of OV) {
        if (o.contains(e)) continue;
        const b = o.getBoundingClientRect();
        const x0 = Math.max(r.left, b.left + 12), x1 = Math.min(r.right, b.right - 12); if (x1 - x0 < 3) continue;
        const xm = (x0 + x1) / 2;
        if (r.top < b.top - 1 && r.bottom > b.top + 2 && dans(o, document.elementFromPoint(xm, b.top + 2))) out.tranche.push(s.slice(0, 30));
        else if (r.top < b.bottom - 2 && r.bottom > b.bottom + 1 && dans(o, document.elementFromPoint(xm, b.bottom - 2))) out.tranche.push(s.slice(0, 30));
      }
    }
  }
  out.sousPlus = [...new Set(out.sousPlus)]; out.tranche = [...new Set(out.tranche)];
  return out;
})()
