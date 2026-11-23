// État lisible de la frise : durée, étiquette du cadre, axe, « ‹ auj. », rangées, rognages.
export async function etat(page) {
  return page.evaluate(() => {
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const W = innerWidth;
    const lab = (e) => e.getAttribute('aria-label') || '';
    const btn = [...document.querySelectorAll('button,[role=button]')].filter(vis);
    const duree = (btn.find((b) => /période, liste, tri et filtre/.test(lab(b))) || {}).textContent?.trim();
    const periode = (btn.find((b) => /^Période : /.test(lab(b))) || {}).textContent?.trim();
    const cadreEl = document.querySelector('.ent-cadre');
    const cadre = cadreEl ? lab(cadreEl).replace('Fenêtre : ', '') + ' | vu « ' + cadreEl.innerText.replace(/\n/g, ' ').trim() + ' »' : null;
    const bandes = [...document.querySelectorAll('[data-bande-semaines],[data-bande-colonnes]')].filter(vis);
    const axe = bandes.map((b) => (b.getAttribute('data-bande-colonnes') || 'sem') + ': ' + b.innerText.replace(/\n+/g, ' ').trim()).join(' || ');
    // rognage : feuilles de texte des bandes hors écran, rognées ou chevauchées
    const feuilles = bandes.flatMap((b) => [...b.querySelectorAll('*')].filter((x) => x.childElementCount === 0 && x.textContent.trim() && vis(x)));
    const rognes = [];
    const rs = feuilles.map((x) => ({ t: x.textContent.trim(), r: x.getBoundingClientRect(), x }));
    for (const f of rs) {
      if (f.r.left < -0.5 || f.r.right > W + 0.5) rognes.push('hors écran ' + f.t + ' [' + Math.round(f.r.left) + '–' + Math.round(f.r.right) + ']');
      else if (f.x.scrollWidth > f.x.clientWidth + 1 && getComputedStyle(f.x).overflow !== 'visible') rognes.push('rogné ' + f.t);
      // parent qui coupe
      let p = f.x.parentElement; for (let k = 0; k < 4 && p; k++, p = p.parentElement) { const s = getComputedStyle(p); if (s.overflow !== 'visible') { const pr = p.getBoundingClientRect(); if (f.r.left < pr.left - 0.5 || f.r.right > pr.right + 0.5) { rognes.push('coupé par parent ' + f.t + ' [' + Math.round(f.r.left) + '–' + Math.round(f.r.right) + ' / ' + Math.round(pr.left) + '–' + Math.round(pr.right) + ']'); break; } } }
    }
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) { const a = rs[i].r, b = rs[j].r; if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) rognes.push('chevauche ' + rs[i].t + ' / ' + rs[j].t); }
    const auj = [...document.querySelectorAll('*')].filter((x) => x.childElementCount === 0 && /auj\./.test(x.textContent) && vis(x)).map((x) => x.textContent.trim());
    const rangees = {};
    for (const b of btn) { const m = /^Masquer (\S+)/.exec(lab(b)); if (m) rangees[m[1]] = 0; }
    const brassins = btn.filter((b) => /, S\d+, .*(J\d+|pas brassée|proposé)/.test(lab(b)) || /, S\d+, coût à venir/.test(lab(b))).map((b) => lab(b).split(',').slice(0, 3).join(','));
    const vide = [...document.querySelectorAll('*')].filter((x) => x.childElementCount === 0 && x.textContent.trim() === 'vide' && vis(x)).length;
    return { periode, duree, cadre, axe, auj, brassins: brassins.length, brassinsListe: brassins.slice(0, 12), sectionsVides: vide, rognes };
  });
}
