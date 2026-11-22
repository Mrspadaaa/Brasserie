/* L4, version a : le jalon naît sur la frise. Base : g-d1 tel quel (après = g-d1), injecté sans toucher au fichier choisi.
   Avant : g-d1 sans Porter d’hiver ni son panier ; 113 → 289 CHF (le −176 du Porter tombe avant S24), libre S51 5 240, S52 5 726. */
(() => {
  const P = new URLSearchParams(location.search);
  if (P.get('theme') === 'cave') document.documentElement.dataset.theme = 'cave';
  const s = P.get('s') || 'avant';
  const q = x => document.querySelector(x);
  // les cases de pose refusées (R2, L1-i) restent invisibles ; on retire leur libellé pour ne rien en garder
  document.querySelectorAll('[aria-label="Toucher pour poser"]').forEach(e => e.removeAttribute('aria-label'));
  const badge = q('.bot .badge');
  const bar = q('[data-chose="b-02"]');
  const cart = q('[data-k17-p="c:b-02"]');
  const doigt = (x, y, long) => {
    const d = document.createElement('i');
    d.className = 'ix-doigt' + (long ? ' long' : '');
    d.style.left = (x + scrollX) + 'px'; d.style.top = (y + scrollY) + 'px';
    document.body.appendChild(d);
  };
  const texte = (el, de, vers) => { if (!el) return; for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.includes(de)) n.nodeValue = n.nodeValue.replace(de, vers); };
  const fini = () => requestAnimationFrame(() => { document.body.dataset.ix = '1'; });
  if (s === 'avant') {
    const r = bar.getBoundingClientRect();
    bar.remove(); cart.remove();
    texte(q('.gd-hd .n'), '113', '289'); texte(q('.big b'), '113', '289');
    q('.big').dataset.valeur = '289';
    q('[data-libre-sem="51"]').textContent = '5 240';
    q('[data-libre-sem="52"]').textContent = '5 726';
    const sm = q('.lane[data-voie="brassage"] .lt small'); if (sm) sm.textContent = '1 · −148';
    badge.textContent = '1';
    doigt(r.left + 34, r.top + r.height / 2, true);
  } else {
    badge.textContent = '3';
    if (s === 'apres') {
      bar.classList.add('ix-neuf'); cart.classList.add('ix-neuf');
      const t = q('#toast');
      t.innerHTML = '<span>Porter d’hiver · 14.12<br>2 à commander avant 7.12</span><button type="button">Annuler</button>';
      t.hidden = false;
    }
    if (s === 'jalon') {
      const r = cart.getBoundingClientRect();
      doigt(r.left + r.width / 2, r.top + 14, false);
      const b = document.createElement('div');
      b.className = 'ix-bulle';
      b.innerHTML = `<p class="t"><svg class="ico"><use href="#i-k17cart"></use></svg>Commander avant <b>7.12</b></p>
<p class="s">pour Porter d’hiver · brassé le 14.12</p>
<div class="l"><span>Munich</span><b>4 kg</b></div><div class="l"><span>Fuggles</span><b>200 g</b></div>
<p class="s">Brouwland · souvent 6 j de délai</p>
<div class="f"><button type="button" class="c">Courses<svg class="ico"><use href="#ix-d"></use></svg></button></div>`;
      document.body.appendChild(b);
      const w = 300, left = Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2));
      b.style.left = left + 'px'; b.style.top = (r.bottom + scrollY + 12) + 'px'; b.style.width = w + 'px';
      b.style.setProperty('--ax', (r.left + r.width / 2 - left - 7) + 'px');
    }
  }
  fini();
})();
