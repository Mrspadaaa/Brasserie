// Lot 21 · e3 · « Les plans, du sage à l'osé ». Le ladder des scénarios de dry hop, à dose totale égale
// (4 g/L) : seul (K2, Cascade en témoin), puis (K3, K4), ensemble (K5). Rangés par l'estimé ~ de la bière
// après, en trois paliers face à la 16D (sage : dedans ; franc : en haut ; osé : au-dessus), avec, sur
// chaque plan, sa chronologie, la courbe simulée jour par jour, le calculé du moteur (bande en log) et ce
// qui reste inconnu. Le moment et la levure changent les plans et les reclassent ; la vue « moments »
// montre K1 (Citra et Cascade de 60′ au dry hop).
(function () {
  REG.moment.vals = () => ['dryPost', 'dryActive'];
  REG.levure.vals = () => ['fermentis-us05', 'lalbrew-pomona', 'lalbrew-verdant-ipa', 'lalbrew-diamond'];
  const E = { fam: D.defaut.fam, vue: 'dry', moment: 'dryPost', levure: 'fermentis-us05', dernier: null };
  const ATTENDUS = [['seul', 'Citra'], ['seul', 'Galaxy'], ['seul', 'Idaho 7'], ['seul', 'Cascade'], ['successifs', 'Citra puis Galaxy'], ['successifs', 'Citra puis Idaho 7'], ['ensemble', 'Citra + Galaxy'], ['ensemble', 'Citra + Idaho 7'], ['ensemble', 'Citra + Cascade']];
  const nomPlan = (p) => (p.type === 'seul' || p.type === 'moment' ? p.ajouts[0].nom : p.ajouts.map((a) => a.nom).join(p.type === 'ensemble' ? ' + ' : ' puis '));
  const TYPE = { seul: 'seul', successifs: 'puis', ensemble: 'ensemble', moment: 'moment' };
  const PALIER = (p) => (p.inconnu ? null : p.crans >= 4 ? 'ose' : p.crans >= 2 ? 'franc' : 'sage');
  const PAL_T = { ose: ['Osé', 'sort de la 16D'], franc: ['Franc', 'dans la 16D, en haut'], sage: ['Sage', 'reste dans la 16D'] };

  function plans() {
    const f = E.fam;
    let L = E.vue === 'K1' ? D.PLANS.filter((p) => p.groupe === 'K1') : D.PLANS.filter((p) => p.groupe !== 'K1' && p.m === E.moment && p.y === E.levure);
    // un même plan (K3 et K4 après, US-05) ne compte qu'une fois
    const vus = new Set();
    L = L.filter((p) => { const k = p.type + p.ajouts.map((a) => a.nom + a.j0 + a.jours + a.moment).join(); if (vus.has(k)) return false; vus.add(k); return true; });
    const rows = L.map((p) => ({ k: p.id, plan: p, p: simP(p.a[f], p.d[f], f) }));
    const a = rows.filter((r) => !r.p.inconnu).sort((x, y) => y.p.centre - x.p.centre), b = rows.filter((r) => r.p.inconnu);
    const absents = E.vue === 'K1' ? [] : ATTENDUS.filter(([t, n]) => !L.some((p) => p.type === t && nomPlan(p) === n)).map(([t, n]) => TYPE[t] + ' ' + n);
    return { a, b, absents };
  }

  // ---------- la chronologie : jours de contact, et la courbe simulée jour par jour ----------
  const JMAX = 17;
  function chrono(p, f) {
    const x = (j) => (Math.max(0, Math.min(JMAX, j)) / JMAX) * 100;
    if (p.type === 'moment') {
      // Le moment sur la journée de brassage puis la fermentation : cinq repères, le sien en plein.
      const m = p.ajouts[0].moment, M = [['b60', '60′'], ['b10', '10′'], ['wp', 'whirlpool'], ['dryActive', 'actif'], ['dryPost', 'après']];
      return '<div class="mm" role="img" aria-label="Moment : ' + esc(D.MOMENTS_LONG[m]) + '">' + M.map(([k, t]) => '<span class="mm-i' + (k === m ? ' on' : '') + '"><i></i><span>' + esc(t) + '</span></span>').join('') + '</div>';
    }
    let h = '<div class="tl" role="img" aria-label="Chronologie : ' + esc(p.ajouts.map((a) => a.nom + ' du J+' + a.j0 + ' au J+' + (a.j0 + a.jours)).join(', ')) + '">';
    const S = D.ECHELLE[f].domaine[1];
    const pts = (p.jour[f] || []).filter((q) => q[1] != null);
    if (pts.length > 1) {
      const xs = (j) => (j / JMAX) * 100, ys = (v) => 16 - Math.min(16, (v / S) * 16);
      const d = pts.map((q, i) => (i ? 'L' : 'M') + xs(q[0]).toFixed(2) + ',' + ys(q[1]).toFixed(2)).join('') + 'L100,' + ys(pts[pts.length - 1][1]).toFixed(2);
      h += '<svg viewBox="0 0 100 16" preserveAspectRatio="none" aria-hidden="true"><path d="M0,' + ys(pts[0][1]).toFixed(2) + 'L' + xs(pts[0][0]).toFixed(2) + ',' + ys(pts[0][1]).toFixed(2) + d.slice(d.indexOf('L')) + '" fill="none" stroke="' + D.J[f].base + '" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
    }
    p.ajouts.forEach((a, i) => { h += '<i class="tl-b' + (i ? ' b2' : '') + (p.type === 'ensemble' && i ? ' ens' : '') + '" style="left:' + x(a.j0) + '%;width:' + x(a.jours) + '%">' + esc(a.nom) + '</i>'; });
    h += [0, 7, 14].map((j) => '<span class="tl-ax" style="left:' + x(j) + '%">J' + j + '</span>').join('');
    return h + '</div>';
  }
  // ---------- le calculé de la bière (moteur), ou de l'ajout seul pour les moments ----------
  function calc(p, f) {
    let x = null, quoi = 'calculé, la bière';
    if (p.scen && D.SCEN[p.scen]) x = D.SCEN[p.scen][f];
    else if (p.type === 'moment') { const M = D.MOTEUR[p.ajouts[0].nom]; x = M && M.sig['4|' + p.ajouts[0].moment] && M.sig['4|' + p.ajouts[0].moment][f]; quoi = 'calculé, l’ajout seul'; }
    const lab = (m) => '<span class="k">' + motC('calcule') + (m ? '<span class="km">' + pic(f, 12) + esc(String(m).replace(/\s*\(.*\)$/, '')) + '</span>' : '') + '</span>';
    if (!x || !x[0]) return '<div class="pl-k" aria-label="' + esc(quoi) + '">' + lab(null) + laneLog(null, { inconnu: (x && x[3]) || 'pas de marqueur chiffré : inconnu, pas zéro' }) + '</div>';
    return '<div class="pl-k" aria-label="' + esc(quoi) + ', rapport au seuil">' + lab(x[1]) + laneLog(x[0], { c: D.J[f].base, source: 'moteur pouvoir aromatique' }) + '</div>';
  }
  function puces(p, f) {
    const l = [];
    if (p.sat && p.sat[f] != null && p.ajouts.length > 1) l.push('<span class="drp sat" data-nature="simule">saturation : ~' + Math.round(p.sat[f] * 100) + ' % de la somme</span>');
    const bb = bioBadge(p.dr); if (bb) l.push(bb);
    if (p.ajouts.length > 1) l.push('<span class="drp inc">ordre, synergie : inconnus</span>');
    if (p.dr.includes('duree-longue')) l.push('<span class="drp">au-delà de 3 j : rien de mesuré en plus</span>');
    if (p.dr.includes('amertume')) l.push('<span class="drp">surtout de l’amertume' + (p.ibu ? ' : IBU <b class="nb" data-nature="mesure" data-source="moteur, bm-citra">' + fr(p.ibu.min, 0) + '–' + fr(p.ibu.max, 0) + '</b> calculé' : '') + '</span>');
    if (p.c) l.push('<span class="drp">confiance ' + esc(p.c) + '</span>');
    return '<div class="pl-d">' + l.join('') + '</div>';
  }
  function carte(r, rg) {
    const p = r.plan, f = E.fam, pal = PALIER(r.p);
    const noms = p.ajouts.map((a, i) => (i ? '<span class="pl">' + (p.type === 'ensemble' ? '+' : '→') + '</span>' : '') + D.HOPS[a.nom].html.nom + '<span class="q">' + fr(a.dose) + ' g/L' + (a.jours ? ' · ' + a.jours + ' j' : '') + '</span>' + (p.type === 'moment' ? '<b class="mo-t">' + esc(D.MOMENTS[a.moment]) + '</b>' : '')).join('');
    const rang = rg && rg.rang ? '<b class="nb">' + rg.rang + '</b>' + (rg.egal ? '<i aria-label="ex æquo">=</i>' : '') : '<span class="src">–</span>';
    return '<article class="pl-c' + (pal === 'ose' ? ' ose' : '') + '" data-k="' + esc(p.id) + '" data-plan="' + esc(p.id) + '"' + (p.ajouts.length > 1 ? ' data-role="ajout"' : '') + ' aria-label="' + esc(p.titre) + '">'
      + '<span class="pl-r">' + rang + '</span>'
      + '<div class="pl-t"><span class="ty ' + p.type + '">' + TYPE[p.type] + '</span><span class="ajn">' + noms + '</span>' + valEstime(r.p) + '</div>'
      + chrono(p, f)
      + '<div class="pl-e"><span class="k">' + motC('estime') + '</span>' + pisteEstime(r.p, f) + '</div>'
      + calc(p, f) + puces(p, f)
      + '<button type="button" class="pl-p" data-action="preuves" aria-label="Le détail du plan">' + ICO('chev') + '</button></article>';
  }
  function rendPlans() {
    const { a, b, absents } = plans();
    const rg = rangs(a, (r) => [r.p.bas, r.p.haut]);
    let h = '', pal = null;
    a.forEach((r, i) => {
      const q = PALIER(r.p);
      if (q !== pal) { pal = q; h += '<div class="pal ' + q + '" data-k="pal-' + q + '"><b class="' + (q === 'ose' ? 'xs' : '') + '">' + PAL_T[q][0] + '</b><span>' + PAL_T[q][1] + '</span></div>'; }
      h += carte(r, rg[i]);
    });
    if (b.length) h += '<div class="pal" data-k="pal-inc"><b>Inconnu</b><span>pas de donnée pour ce goût : jamais zéro</span></div>' + b.map((r) => carte(r, null)).join('');
    $('#plans').innerHTML = h;
    $('#absents').innerHTML = absents.length ? '<p><i class="hach"></i><span>Non simulés pour ces réglages : ' + esc(absents.join(', ')) + '.</span></p>' : '';
  }
  function rendre(anim) {
    const k1 = E.vue === 'K1';
    $('#regs').innerHTML = chipReglage('moment', E, k1 ? 'les 5 moments' : null) + chipReglage('levure', E, k1 ? 'US-05' : null) + '<span class="rg off" aria-label="Dose totale fixe">' + ICO('goutte') + '<span>' + (k1 ? '4 g/L' : '4 g/L en tout') + '</span></span>';
    $('#pq').innerHTML = pourquoi(E) + (k1 ? '' : bioLigne(E));
    $('#lad-t').innerHTML = '<span class="mc mc-estime">estimé ~</span><span class="lad-tt">' + pic(E.fam, 14) + esc(D.COURT[E.fam]) + ' · la bière après</span><span class="trou"><i class="hach"></i>aucun plan mesuré en bière</span>';
    if (anim) flip($('#plans'), rendPlans); else rendPlans();
    $$('[data-role="famille"]').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.f === E.fam)));
    $$('[data-vue]').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.vue === E.vue)));
  }

  // ---------- le détail d'un plan : jour par jour, l'estimé, le calculé, ce qui reste inconnu ----------
  function preuves(id) {
    const p = D.PLANS.find((x) => x.id === id), f = E.fam;
    const sp = simP(p.a[f], p.d[f], f);
    const J = (p.jour[f] || []).filter((q) => q[1] != null);
    const S = D.ECHELLE[f].domaine[1];
    let jr = '';
    if (J.length > 1) jr = '<div class="pr-b" data-role="simulation"><h3>' + motC('estime') + ' jour par jour : ' + pic(f, 14) + esc(D.NOM[f]) + '</h3><div class="jr" style="--n:' + J.length + ';--b:' + D.J[f].base + '">' + J.map((q) => '<i style="height:' + Math.max(3, Math.min(100, (q[1] / S) * 100)) + '%" data-nature="simule"></i>').join('') + '</div><div class="jr-l" style="--n:' + J.length + '">' + J.map((q) => '<span>J' + q[0] + '</span>').join('') + '</div><p class="pr-src">~' + J.map((q) => fr(q[1], 0)).join(' · ') + ' pts. L’essentiel passe en 24 h ; au-delà de 3 j, rien de mesuré en plus (H73).</p></div>';
    let c = jr + blocEstime(sp, f, { c: p.c, dr: p.dr }, p.sat && p.ajouts.length > 1 && p.sat[f] != null ? '<p class="pr-src">Saturation partagée : ensemble, ~' + Math.round(p.sat[f] * 100) + ' % de la somme des deux ajouts seuls (simulé ; la dose totale compte).</p>' : '');
    for (const a of p.ajouts) c += blocCalcule(a.nom, f, a.moment, a.dose);
    c += '<div class="pr-b"><h3>' + motC('mesure') + ' en bière</h3><p class="pr-l"><i class="hach"></i><span>Aucune étude lue ne mesure ce plan en bière' + (p.ajouts.length > 1 ? ', ni deux houblons ensemble' : '') + '. Les mesures de chaque houblon sont dans son « Voir la fiche » et dans e1.</span></p></div>';
    c += p.ajouts.map((a) => blocFiches(a.nom)).join('');
    ouvrirPreuves('<span class="ty ' + p.type + '">' + TYPE[p.type] + '</span> ' + esc(p.titre), c);
  }

  document.addEventListener('click', (e) => {
    const r = e.target.closest('[data-reglage]');
    if (r && !e.defaultPrevented) { const k = r.dataset.reglage; if (r.getAttribute('aria-disabled') === 'true') { brillerReglage(k); return; } suivant(k, E); rendre(true); brillerReglage(k); return; }
    const fa = e.target.closest('[data-role="famille"]');
    if (fa) { E.fam = fa.dataset.f; E.dernier = null; rendre(true); return; }
    const v = e.target.closest('[data-vue]');
    if (v) { E.vue = v.dataset.vue; E.dernier = E.vue === 'K1' ? 'moment:b60' : null; rendre(true); return; }
    const c = e.target.closest('.pl-c');
    if (c) preuves(c.dataset.plan);
  });
  const q = new URLSearchParams(location.search);
  for (const k of ['fam', 'moment', 'levure', 'dernier']) if (q.get(k)) E[k] = q.get(k);
  if (q.get('groupe') === 'K1') { E.vue = 'K1'; E.dernier = E.dernier || 'moment:b60'; }
  rendre(false);
  if (q.get('preuves')) preuves(q.get('preuves'));
})();
