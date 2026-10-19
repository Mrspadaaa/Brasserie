// s3 · La carte des possibles : le houblon, le second (dry hop, 2 g/L, mêmes jours), les jours, la levure ;
// la carte de 20 cases (moment × dose), la case touchée en détail, l'écart à la case d'avant.
(() => {
  const D = SIM.D, AX = SIM.AX, F = SIM.F;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const E = { houblon: 'Citra', second: '', jours: 3, levure: 'US-05', m: 'dryPost', d: 4 };
  let prec = null; // la case d'avant le dernier toucher : { m, d, p }
  const NOMM = { b60: '60′', b10: '10′', wp: 'whirlpool', dryActive: 'dry hop actif', dryPost: 'dry hop après' };
  const nb = (x) => String(x).replace('.', ',');
  const LANES = $('.prof .lns');
  const ajouts = (m, d) => {
    const a = [{ houblon: E.houblon, moment: m, dose_gL: d, jours: E.jours }];
    if (E.second) a.push({ houblon: E.second, moment: SIM.sec(m) ? m : 'dryPost', dose_gL: 2, jours: E.jours });
    return a;
  };
  // Hors du style par l'ajout : au-delà de la bande, et pas déjà au-delà avant (ou plus haut d'un demi-cran).
  const horsNouv = (p) => F.filter((f, i) => !p[i][4] && p[i][1] > D.ech[f].hi && (D.avant[i][1] <= D.ech[f].hi || SIM.cr(i, p[i][1]) - SIM.cr(i, D.avant[i][1]) >= 0.5));
  const HC = 42, PXC = 4; // une case : 42 px de haut, 4 px par cran (10 crans), le plafond du style à 12 px
  function empreinte(c, p) {
    let e = c.querySelector('.cs-e');
    if (!e) { e = document.createElement('span'); e.className = 'cs-e'; e.innerHTML = F.map((f) => `<i data-famille="${f}" data-nature="simule" style="--c:${D.base[f]}"></i>`).join('') + '<span class="cs-pl"></span>'; c.prepend(e); const m = document.createElement('span'); m.className = 'cs-m'; c.append(m); }
    const plaf = SIM.abs ? null : 3 * PXC;
    $$('i', e).forEach((b, i) => {
      const t = p[i];
      if (t[4]) { b.className = 'inc'; b.style.height = '3px'; return; }
      const v = SIM.abs ? t[1] / SIM.MAXP * HC * 1.6 : SIM.cr(i, t[1]) * PXC;
      const z = SIM.abs ? D.ech[F[i]].hi / SIM.MAXP * HC * 1.6 : 3 * PXC;
      const h = Math.max(2, Math.min(HC, v));
      // la part de ma bière en gris, l'apport du houblon en couleur, l'orangé au-delà du plafond du style
      const va = D.avant[i][4] ? 0 : SIM.abs ? D.avant[i][1] / SIM.MAXP * HC * 1.6 : Math.max(0, SIM.cr(i, D.avant[i][1]) * PXC);
      const g = Math.min(100, va / h * 100), zz = Math.min(100, z / h * 100), c = D.base[F[i]];
      const st = [`#b4b6be 0 ${g.toFixed(0)}%`];
      if (g < zz) st.push(`${c} ${g.toFixed(0)}% ${zz.toFixed(0)}%`, `#c2410c ${zz.toFixed(0)}% 100%`); else st.push(`#c2410c ${g.toFixed(0)}% 100%`);
      b.style.background = v <= va + 0.5 ? '#b4b6be' : `linear-gradient(to top, ${st.join(', ')})`;
      b.style.height = h.toFixed(1) + 'px';
      b.className = v > HC ? 'cap' : '';
    });
    const pl = e.querySelector('.cs-pl'); pl.style.display = plaf ? 'block' : 'none'; if (plaf) pl.style.bottom = plaf + 'px';
    const hs = horsNouv(p);
    const mot = c.querySelector('.cs-m');
    mot.textContent = hs.length ? hs.length + ' hors' : '';
    mot.classList.toggle('hst', hs.length > 0);
    c.setAttribute('aria-label', `${NOMM[c.dataset.m]}, ${nb(c.dataset.d)} g/L : ~ ${hs.length ? hs.length + ' familles hors du style 16D' : 'au style 16D'}`);
  }
  function dessiner(o = {}) {
    const cases = $$('[data-reglage="case"]');
    for (const c of cases) {
      const m = c.dataset.m, d = +c.dataset.d;
      const p = SIM.profil(ajouts(m, d), E.levure);
      empreinte(c, p);
      c.setAttribute('aria-pressed', String(m === E.m && d === E.d));
      c.classList.toggle('prec', !!prec && prec.m === m && prec.d === d && !(m === E.m && d === E.d));
      // une mesure publiée existe pour cette case : Cascade, 24 h, après (E04)
      let b = c.querySelector('.cs-mes');
      const mes = E.houblon === 'Cascade' && !E.second && m === 'dryPost' && E.jours === 1 && D.e04.some((x) => Math.abs(x.d - d) < 0.3);
      if (mes && !b) { b = document.createElement('span'); b.className = 'cs-mes'; b.textContent = 'mesuré'; c.append(b); }
      if (!mes && b) b.remove();
    }
    // la case touchée en détail
    const p = SIM.profil(ajouts(E.m, E.d), E.levure);
    SIM.poser(LANES, p, { ref: D.avant, flash: o.flash });
    $('[data-case-titre]').textContent = `${E.houblon}${E.second ? ' + ' + E.second : ''}, ${nb(E.d)} g/L, ${NOMM[E.m]}${SIM.sec(E.m) ? ', ' + E.jours + ' j' : ''}`;
    // l'écart à la case d'avant, écrit
    const ec = $('[data-role="ecart"]');
    if (prec && o.geste) {
      const ch = SIM.change(p, prec.p, 3);
      ec.innerHTML = `~ ${o.geste} : ${ch.length ? ch.map((x) => `<b style="color:${D.texte[x.f]}">${D.court[x.f]}</b> ${SIM.delta(SIM.cr(x.i, p[x.i][1]), SIM.cr(x.i, prec.p[x.i][1]), 'crans')}`).join(', ') : 'presque rien ne change'}.`;
    } else ec.innerHTML = `~ ${E.houblon} : <b>${$$('.cs-m').filter((x) => !x.classList.contains('hst')).length}</b> cases sur 20 restent au style 16D.`;
    $('[data-role="pourquoi"]').innerHTML = SIM.pourquoi(p, 2, E.m === 'dryActive').map((d) => `<span data-nature="mesure" data-source="${(d.sources || []).join(' ')}"><b>pourquoi</b> ${d.titre}</span>`).join('');
    // la mesure publiée de la case
    const mc = $('[data-mesure-case]');
    const ms = E.houblon === 'Cascade' && !E.second && E.m === 'dryPost' && E.jours === 1 ? D.e04.filter((x) => Math.abs(x.d - E.d) < 0.3) : [];
    mc.hidden = !ms.length;
    if (ms.length) mc.innerHTML = `<span class="mot m-mes">mesuré</span><span data-nature="mesure" data-source="E04">Cascade <span class="nb">${nb(ms[0].d)}</span> g/L, 24 h, panel sur 15 : ${ms.map((x) => x.k + ' <b class="nb">' + nb(x.v) + '</b>').join(', ')}</span><span class="src">Lafontaine 2018 [E04]</span><span class="mot m-av">à vérifier</span>`;
    // les réglages
    $$('[data-reglage="houblon"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === E.houblon)));
    $$('[data-reglage="second"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === E.second)));
    $$('[data-reglage="second"]').forEach((b) => { b.disabled = b.dataset.v === E.houblon; });
    $('[data-second-note]').innerHTML = E.second ? `<span class="nb">2</span> g/L en dry hop, mêmes jours` : '';
    $$('[data-reglage="jours"]').forEach((b) => b.setAttribute('aria-checked', String(+b.dataset.v === E.jours)));
    $('.jr').classList.toggle('off', !SIM.sec(E.m) && !E.second);
    $$('[data-reglage="levure"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === E.levure)));
    const ph = ajouts(E.m, E.d).some((a) => ['b10', 'wp', 'dryActive'].includes(a.moment)) ? 'actif' : ajouts(E.m, E.d).some((a) => a.moment === 'dryPost') ? 'apres' : 'aucun';
    $$('[data-bio-k]').forEach((x) => { x.hidden = x.dataset.bioK !== E.levure + '|' + ph; });
    $('[data-bio-ns]').hidden = !p.info.levureNonSimulee;
    $$('[data-vr]').forEach((x) => { x.hidden = ![E.houblon, E.second].includes(x.dataset.vr); });
    $$('[data-hv]').forEach((x) => { x.hidden = x.dataset.hv !== E.houblon; });
    return p;
  }
  let courant = null;
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-reglage]'); if (!b || b.disabled) return;
    const r = b.dataset.reglage, avant = { m: E.m, d: E.d, p: courant };
    let geste = '';
    if (r === 'case') { const m = b.dataset.m, d = +b.dataset.d; if (m === E.m && d === E.d) return; geste = `${NOMM[E.m]} ${nb(E.d)} g/L → ${NOMM[m]} ${nb(d)} g/L`; E.m = m; E.d = d; }
    else if (r === 'houblon') { if (E.houblon === b.dataset.v) return; geste = E.houblon + ' → ' + b.dataset.v; E.houblon = b.dataset.v; if (E.second === E.houblon) E.second = ''; }
    else if (r === 'second') { if (E.second === b.dataset.v) return; geste = b.dataset.v ? '+ ' + b.dataset.v : 'seul'; E.second = b.dataset.v; }
    else if (r === 'jours') { const j = +b.dataset.v; if (E.jours === j) return; geste = 'contact ' + E.jours + ' → ' + j + ' j'; E.jours = j; }
    else if (r === 'moment') { if (E.m === b.dataset.v) return; geste = NOMM[E.m] + ' → ' + NOMM[b.dataset.v]; E.m = b.dataset.v; }
    else if (r === 'levure') { if (E.levure === b.dataset.v) return; geste = E.levure + ' → ' + b.dataset.v; E.levure = b.dataset.v; }
    else return;
    prec = avant;
    courant = dessiner({ flash: true, geste });
  });
  SIM.quandLentille(() => { courant = dessiner(); });
  addEventListener('resize', () => { courant = dessiner(); });
  const q = new URLSearchParams(location.search);
  if (q.get('houblon')) E.houblon = q.get('houblon');
  if (q.get('second')) E.second = q.get('second');
  if (q.get('jours')) E.jours = +q.get('jours');
  if (q.get('case')) { const [m, d] = q.get('case').split(','); E.m = m; E.d = +d; }
  courant = dessiner();
  requestAnimationFrame(() => document.body.classList.add('pret'));
})();
