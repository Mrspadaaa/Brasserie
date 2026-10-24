// s1 · La ligne du brassage : l'état, les gestes (toucher, glisser), le dessin.
(() => {
  const D = SIM.D, AX = SIM.AX;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const cas = (id) => D.cas.find((c) => c.id === id);
  const copie = (as) => as.map((a) => ({ houblon: a.houblon, moment: a.moment, dose_gL: a.dose_gL, jourDebut: a.jourDebut, jours: a.jours }));
  const E = { ajouts: copie(cas('K2-citra').ajouts), levure: 'US-05', sel: 0 };
  let avant = null; // le profil d'avant le dernier geste (pour l'écart du geste)
  const LANES = $('.prof .lns');
  const PISTE = $('[data-piste]');
  const NOMM = { b60: '60′', b10: '10′', wp: 'whirlpool', dryActive: 'dry hop actif', dryPost: 'dry hop après' };

  // ---------- la géométrie du brassage ----------
  const G = () => { const W = PISTE.getBoundingClientRect().width; return { W, j0: 132, dpx: (W - 136) / 18 }; };
  const xJour = (j) => { const g = G(); return g.j0 + j * g.dpx; };
  const xDe = (a) => (a.moment === 'b60' ? 6 : a.moment === 'b10' ? 40 : a.moment === 'wp' ? 84 : xJour(a.jourDebut || 0));
  function placer(x, a) {
    if (x < 24) return { moment: 'b60' };
    if (x < 62) return { moment: 'b10' };
    if (x < 126) return { moment: 'wp' };
    const g = G(), j = Math.max(0, Math.min(16, Math.round((x - g.j0) / g.dpx)));
    return j < 7 ? { moment: 'dryActive', jourDebut: j } : { moment: 'dryPost', jourDebut: j };
  }
  const defaut = (a) => { if (SIM.sec(a.moment)) { if (a.jours == null) a.jours = 3; if (a.jourDebut == null) a.jourDebut = a.moment === 'dryActive' ? 2 : 7; } };

  // ---------- le dessin ----------
  function dessiner(o = {}) {
    const p = SIM.profil(E.ajouts, E.levure);
    SIM.poser(LANES, p, { ref: D.avant, flash: o.flash });
    // la marque d'avant le geste : un trait qui s'efface
    if (avant && o.flash) for (const ln of $$('[data-lane]', LANES)) {
      const i = SIM.F.indexOf(ln.dataset.lane), W = ln.querySelector('.lf-p').getBoundingClientRect().width;
      let t = ln.querySelector('.lf-pv'); if (!t) { t = document.createElement('i'); t.className = 'lf-pv'; ln.querySelector('.lf-p').append(t); }
      t.style.left = (SIM.X(i, avant[i][1], W) - 1).toFixed(1) + 'px'; t.classList.remove('va'); void t.offsetWidth; t.classList.add('va');
    }
    // l'écart écrit : celui du geste, puis celui de la bière
    const ec = $('[data-role="ecart"]');
    const fam = (x) => `<b style="color:${D.texte[x.f]}">${D.court[x.f]}</b> ${SIM.delta(SIM.cr(x.i, p[x.i][1]), SIM.cr(x.i, (x.ref || D.avant)[x.i][1]), 'crans')}`;
    const tout = SIM.change(p, D.avant, 3), hs = SIM.hors(p);
    let geste = '';
    if (avant && o.geste) { const g = SIM.change(p, avant, 3).map((x) => ({ ...x, ref: avant })); geste = `<span class="g">${o.geste} : ${g.length ? g.map(fam).join(', ') : 'presque rien ne change'}.</span> `; }
    ec.innerHTML = `${geste}~ ${tout.length ? tout.map(fam).join(', ') : 'presque rien ne bouge'}${hs.length ? ` : <span class="hst">${hs.length} hors du style 16D</span>` : ' : dans le style 16D'}.`;
    $('[data-role="pourquoi"]').innerHTML = SIM.pourquoi(p, 2, E.ajouts.some((a) => a.moment === 'dryActive')).map((d) => `<span data-nature="mesure" data-source="${(d.sources || []).join(' ')}"><b>pourquoi</b> ${d.titre}</span>`).join('');
    // la confiance
    const c = SIM.confiance(p);
    $$('[data-conf] i').forEach((x, k) => x.classList.toggle('on', k < ({ faible: 1, moyenne: 2, bonne: 3 })[c]));
    $('[data-conf-mot]').textContent = 'confiance ' + c;
    $('[data-conf]').setAttribute('aria-label', 'confiance ' + c + (E.ajouts.length > 1 ? ' : ordre et synergie non calculés' : ''));
    tokens(); editeur(); bio(p); vraies();
    avant = p;
  }
  function tokens() {
    for (const k of [0, 1]) {
      const r = $(`[data-rang="${k}"]`), a = E.ajouts[k];
      r.innerHTML = '';
      if (!a) { r.hidden = k === 1; continue; }
      r.hidden = false;
      const t = document.createElement('span');
      t.className = 'tk' + (E.sel === k ? ' sel' : '');
      t.dataset.k = k; t.dataset.houblon = a.houblon;
      t.setAttribute('role', 'button'); t.setAttribute('tabindex', '0');
      t.setAttribute('aria-label', `${a.houblon}, ${a.dose_gL} g/L, ${NOMM[a.moment]}${SIM.sec(a.moment) ? ', ' + a.jours + ' j' : ''} : glisser pour changer de moment`);
      t.style.left = (xDe(a) - (SIM.sec(a.moment) ? 0 : 3)).toFixed(1) + 'px';
      t.style.setProperty('--h', D.couleurs[a.houblon]);
      const bioOn = ['b10', 'wp', 'dryActive'].includes(a.moment) && E.levure !== 'US-05';
      const sec = SIM.sec(a.moment);
      t.innerHTML = (sec ? `<i class="tk-m dur" style="width:${(a.jours * G().dpx).toFixed(1)}px"></i>` : '<i class="tk-m pin"></i>') + `<span class="tk-l">${a.houblon}<span class="tk-d nb">${String(a.dose_gL).replace('.', ',')} g/L</span>${bioOn ? '<span class="bio-m">bio</span>' : ''}</span>`;
      r.classList.toggle('haut', E.sel === k && sec);
      r.append(t);
      if (E.sel === k && SIM.sec(a.moment)) {
        const x0 = xDe(a);
        r.insertAdjacentHTML('beforeend', `<span class="rep" style="left:${(x0 + G().dpx).toFixed(1)}px" data-nature="mesure" data-source="H73 H20 E08"><i></i>24 h</span><span class="rep r3" style="left:${(x0 + 3 * G().dpx).toFixed(1)}px" data-nature="mesure" data-source="H73"><i></i>3 j : plafond</span>`);
      }
    }
    PISTE.toggleAttribute('data-role', E.ajouts.length > 1);
    if (E.ajouts.length > 1) PISTE.setAttribute('data-role', 'ajout');
    const g = G();
    $('.ph-f').style.left = g.j0 + 'px'; $('.ph-a').style.left = xJour(7).toFixed(1) + 'px';
    $('.jours').innerHTML = [0, 7, 14].map((j) => `<span style="left:${xJour(j).toFixed(1)}px">J${j}</span>`).join('');
    let f = $('.fer', PISTE); if (!f) { f = document.createElement('i'); f.className = 'fer'; PISTE.prepend(f); }
    f.style.left = g.j0 + 'px'; f.style.width = (7 * g.dpx).toFixed(1) + 'px';
    const b2 = $('[data-reglage="ajout-cumule"]');
    b2.setAttribute('aria-pressed', String(E.ajouts.length > 1));
    b2.innerHTML = (E.ajouts.length > 1 ? '' : SIM_ICO_PLUS) + (E.ajouts.length > 1 ? 'deux houblons' : 'second houblon');
  }
  const SIM_ICO_PLUS = document.querySelector('[data-reglage="ajout-cumule"] svg').outerHTML;
  function editeur() {
    const a = E.ajouts[E.sel];
    $('[data-ed-num]').textContent = String(E.sel + 1);
    $$('[data-reglage="houblon"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === a.houblon)));
    $$('[data-reglage="moment"]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === a.moment)));
    $('[data-v="dose"] b').textContent = String(a.dose_gL).replace('.', ',');
    const sec = SIM.sec(a.moment);
    $('[data-v="jours"]').innerHTML = sec ? `<b class="nb">${a.jours}</b> j` : 'sans objet';
    $('[data-pas="jours"]').classList.toggle('off', !sec);
    $$('[data-reglage="jours"]').forEach((b) => { b.disabled = !sec; });
    const iD = AX.dose_gL.indexOf(a.dose_gL), iJ = AX.jours.indexOf(a.jours);
    $('[data-reglage="dose"][data-sens="-1"]').disabled = iD <= 0; $('[data-reglage="dose"][data-sens="1"]').disabled = iD >= AX.dose_gL.length - 1;
    if (sec) { $('[data-reglage="jours"][data-sens="-1"]').disabled = iJ <= 0; $('[data-reglage="jours"][data-sens="1"]').disabled = iJ >= AX.jours.length - 1; }
    $('[data-reglage="retirer"]').hidden = E.ajouts.length < 2;
    $$('[data-reglage="levure"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === E.levure)));
  }
  function bio(p) {
    const ms = E.ajouts.map((a) => a.moment);
    const ph = ms.some((m) => ['b10', 'wp', 'dryActive'].includes(m)) ? 'actif' : ms.some((m) => m === 'dryPost') ? 'apres' : 'aucun';
    $$('[data-bio-k]').forEach((x) => { x.hidden = x.dataset.bioK !== E.levure + '|' + ph; });
    const ns = $('[data-bio-ns]'); if (ns) ns.hidden = !(p && p.info.levureNonSimulee);
  }
  function vraies() {
    const h = E.ajouts[E.sel].houblon;
    $$('[data-vr]').forEach((x) => { x.hidden = x.dataset.vr !== h; });
  }

  // ---------- les gestes ----------
  const pasDe = (arr, v, s) => arr[Math.max(0, Math.min(arr.length - 1, arr.indexOf(v) + s))];
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-reglage]'); if (!b || b.disabled) return;
    const a = E.ajouts[E.sel], r = b.dataset.reglage;
    let geste = '';
    if (r === 'houblon') { if (a.houblon === b.dataset.v) return; geste = a.houblon + ' → ' + b.dataset.v; a.houblon = b.dataset.v; }
    else if (r === 'moment') { if (a.moment === b.dataset.v) return; geste = NOMM[a.moment] + ' → ' + NOMM[b.dataset.v]; a.moment = b.dataset.v; a.jourDebut = null; defaut(a); }
    else if (r === 'dose') { const v = pasDe(AX.dose_gL, a.dose_gL, +b.dataset.sens); if (v === a.dose_gL) return; geste = 'dose ' + a.dose_gL + ' → ' + v + ' g/L'; a.dose_gL = v; }
    else if (r === 'jours') { const v = pasDe(AX.jours, a.jours, +b.dataset.sens); if (v === a.jours) return; geste = 'contact ' + a.jours + ' → ' + v + ' j'; a.jours = v; }
    else if (r === 'levure') { if (E.levure === b.dataset.v) return; geste = E.levure + ' → ' + b.dataset.v; E.levure = b.dataset.v; }
    else if (r === 'ajout-cumule') {
      if (E.ajouts.length > 1) { E.ajouts.splice(1, 1); E.sel = 0; geste = 'un seul houblon'; }
      else { const p = E.ajouts[0]; const n = { houblon: p.houblon === 'Galaxy' ? 'Idaho 7' : 'Galaxy', moment: 'dryPost', dose_gL: 2, jourDebut: SIM.sec(p.moment) ? (p.jourDebut || 7) + (p.jours || 3) : 7, jours: 3 }; E.ajouts.push(n); E.sel = 1; geste = '+ ' + n.houblon; }
    }
    else if (r === 'retirer') { E.ajouts.splice(E.sel, 1); E.sel = 0; geste = 'retiré'; }
    else if (r === 'exemple') { const c = cas(b.dataset.v); E.ajouts = copie(c.ajouts); E.sel = 0; E.levure = c.levure || 'US-05'; geste = b.textContent.trim(); }
    else return;
    dessiner({ flash: true, geste });
  });
  // toucher un jeton : le choisir ; le glisser : changer de moment (aimanté sur les moments et les jours)
  let G0 = null;
  PISTE.addEventListener('pointerdown', (e) => {
    const t = e.target.closest('.tk:not(.fixe)'); if (!t) return;
    const k = +t.dataset.k, r = PISTE.getBoundingClientRect();
    G0 = { k, t, dx: e.clientX - t.getBoundingClientRect().left, x0: e.clientX, r, bouge: false, id: e.pointerId, cle: null, m0: E.ajouts[k].moment };
  });
  PISTE.addEventListener('pointermove', (e) => {
    if (!G0 || e.pointerId !== G0.id) return;
    if (!G0.bouge && Math.abs(e.clientX - G0.x0) < 8) return;
    if (!G0.bouge) { G0.bouge = true; G0.t.setPointerCapture(e.pointerId); G0.t.classList.add('glisse'); E.sel = G0.k; }
    const x = Math.max(0, Math.min(G0.r.width - 40, e.clientX - G0.r.left - G0.dx));
    G0.t.style.left = x + 'px';
    const a = E.ajouts[G0.k], n = placer(x + 6, a), cle = n.moment + '|' + (n.jourDebut ?? '');
    if (cle !== G0.cle) {
      const geste = NOMM[a.moment] + ' → ' + NOMM[n.moment];
      const chg = a.moment !== n.moment;
      a.moment = n.moment; if (n.jourDebut != null) a.jourDebut = n.jourDebut; defaut(a);
      G0.cle = cle;
      if (chg) { const p = SIM.profil(E.ajouts, E.levure); SIM.poser(LANES, p, { ref: D.avant, flash: true }); G0.geste = NOMM[G0.m0] + ' → ' + NOMM[a.moment]; G0.t.querySelector('.tk-l').firstChild.textContent = a.houblon + ' · ' + NOMM[a.moment] + ' '; }
    }
  });
  const fin = (e) => {
    if (!G0 || e.pointerId !== G0.id) return;
    const g = G0; G0 = null;
    if (!g.bouge) { if (E.sel !== g.k) { E.sel = g.k; dessiner(); } return; }
    dessiner({ flash: true, geste: g.geste || 'glissé' });
  };
  PISTE.addEventListener('pointerup', fin); PISTE.addEventListener('pointercancel', fin);
  PISTE.addEventListener('keydown', (e) => {
    const t = e.target.closest('.tk:not(.fixe)'); if (!t || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const k = +t.dataset.k, a = E.ajouts[k], ordre = ['b60', 'b10', 'wp', 'dryActive', 'dryPost'];
    const i = ordre.indexOf(a.moment) + (e.key === 'ArrowRight' ? 1 : -1); if (i < 0 || i >= ordre.length) return;
    const geste = NOMM[a.moment] + ' → ' + NOMM[ordre[i]]; a.moment = ordre[i]; a.jourDebut = null; defaut(a); E.sel = k;
    dessiner({ flash: true, geste }); $(`.tk[data-k="${k}"]`).focus();
  });
  SIM.quandLentille(() => dessiner());
  addEventListener('resize', () => dessiner());
  // état d'une capture : ?etat=deux (Citra 3 j + Galaxy 7 j), ?etat=actif (Citra en fermentation, Pomona)
  const q = new URLSearchParams(location.search).get('etat');
  if (q === 'deux') { E.ajouts = copie(cas('K3-citra3-galaxy7').ajouts); E.sel = 1; }
  if (q === 'actif') { E.ajouts[0].moment = 'dryActive'; E.ajouts[0].jourDebut = 2; E.levure = 'Pomona'; }
  if (q === '60') { E.ajouts[0].moment = 'b60'; }
  dessiner();
  requestAnimationFrame(() => document.body.classList.add('pret'));
})();
