// Lot 21 · e1 · « Deux classements » : pour une famille, le classement MESURÉ en bière (une étude à la
// fois, ses vraies valeurs, la bière sans houblon pour repère) au-dessus du classement ESTIMÉ ~ (le profil
// simulé de profils-simules.json), reclassé au doigt par la dose, le moment, les jours, la levure et un
// second houblon ajouté ENSEMBLE. Chaque ligne estimée porte sa vraie valeur mesurée, ou le trou
// hachuré : pas d'étude. Deux bandes que la donnée ne départage pas partagent leur rang (« = »).
// Toucher une ligne : ses preuves (mesuré, calculé par le moteur avec sa bande en log, estimé, fiches).
// Appui long sur un nom : sa vraie fiche.
(function () {
  const E = { fam: D.defaut.fam, dose: 4, moment: 'dryPost', jours: 3, levure: 'fermentis-us05', part: null, tri: 'estime', opt: {}, dernier: null };
  const PARTS = [null, ...D.SIMULES];

  // ---------- le profil estimé d'un houblon, ou d'une paire (grillePaires : 2 + 2 g/L, 3 j) ----------
  function entree(nom, seul) {
    if (E.part && !seul && nom !== E.part) return D.PAIRES[[nom, E.part].sort().join('+') + '|' + E.moment + '|' + E.levure] || null;
    return D.GRILLE[[nom, E.moment, E.dose, /^dry/.test(E.moment) ? E.jours : '', E.levure].join('|')] || null;
  }
  const profil = (nom, seul) => { const g = entree(nom, seul); return g ? { p: simP(g.a[E.fam], g.d[E.fam], E.fam), g } : { p: { inconnu: 'non simulé' }, g: null }; };
  const opts = () => D.MESURES[E.fam] || [];
  const optCourante = () => { const o = opts(); return o.length ? o[(E.opt[E.fam] || 0) % o.length] : null; };

  // ---------- les réglages ----------
  function rendRegs() {
    const p = E.part;
    $('#regs').innerHTML = chipReglage('dose', E, p ? '2 + 2 g/L' : null) + chipReglage('moment', E) + chipReglage('jours', E, p ? '3 j' : null) + chipReglage('levure', E);
    // L'ajout cumulé prend toute la largeur : chaque houblon du classement, ensemble avec celui-ci.
    $('#cumul').innerHTML = '<span class="cu-t">' + ICO('paire') + '<span>Ensemble avec</span></span><span class="cu-l">' + PARTS.map((x) => '<button type="button" class="cu" data-role="reglage" data-reglage="ajout-cumule" data-part="' + esc(x || '') + '" aria-pressed="' + (x === p) + '" aria-label="' + (x ? 'Chaque houblon ensemble avec ' + esc(x) + ', 2 + 2 g/L, 3 j' : 'Un seul houblon à la fois') + '">' + (x ? esc(x) : 'seul') + '</button>').join('') + '</span>';
    $('#pq').innerHTML = pourquoi(E) + bioLigne(E);
  }

  // ---------- le classement mesuré (une étude à la fois) ----------
  function rendMesure() {
    const f = E.fam, o = optCourante(), n = opts().length, J = D.J[f];
    let h = '<div class="mes-h"><span class="mc mc-mesure">mesuré</span><span class="mes-t">en bière' + (o ? ' · ' + pic(f, 14) + '<b>' + esc(o.quoi) + '</b>' + (o.unite ? ' <span class="src">' + esc(o.unite) + '</span>' : '') : '') + '</span>'
      + (n > 1 ? '<button type="button" class="mes-b" data-action="etude" aria-label="Étude suivante : ' + n + ' études ou composés pour cette famille">' + esc(o.etude) + ' · ' + ((E.opt[f] || 0) % n + 1) + ' sur ' + n + ICO('chev') + '</button>' : o ? '<span class="mes-e">' + esc(o.etude) + '</span>' : '') + '</div>';
    if (E.part) h += '<p class="mes-trou"><i class="hach"></i><span>Aucune étude ne mesure deux houblons <b>ensemble</b> en bière.</span></p>';
    if (!o) h += '<p class="mes-trou"><i class="hach"></i><span>Aucune étude chiffrée du ' + esc(D.NOM[f].toLowerCase()) + ' en bière dans les ' + D.ETUDES.length + ' lues.</span></p>';
    else if (o.qualitatif) {
      h += '<ol class="mes-q">' + o.valeurs.map((v) => '<li>' + (v.nom ? D.HOPS[v.nom].html.nom : '<span class="hn hors">' + esc(v.variete) + '</span>') + ' <span class="src">' + esc(v.texte) + '</span></li>').join('') + '</ol><p class="mes-c">' + esc(o.ref) + ' · panel, sans chiffre · niveau ' + esc(o.niveau) + '</p>';
    } else {
      const max = Math.max(...o.valeurs.map((v) => v.valeur + (v.ecart || 0)), o.temoin ? o.temoin.valeur : 0);
      const w = (x) => Math.max(1, (x / max) * 100);
      const ligne = (lab, v, cls = '', extra = '') => '<div class="mb-r ' + cls + '"><span class="mb-n">' + lab + '</span><span class="mb-t" style="--b:' + J.base + '"><i class="mb-v" style="width:' + w(v.valeur) + '%"></i>' + (o.temoin && !cls ? '<i class="mb-tm" style="left:' + w(o.temoin.valeur) + '%"></i>' : '') + (v.ecart ? '<i class="mb-e" style="left:' + w(v.valeur - v.ecart) + '%;width:' + (w(v.valeur + v.ecart) - w(v.valeur - v.ecart)) + '%"></i>' : '') + '</span><b class="nb mv" data-nature="mesure" data-source="' + esc(o.etude) + '">' + fr(v.valeur) + (v.ecart ? '<span class="pm"> ±' + fr(v.ecart) + '</span>' : '') + '</b>' + extra + '</div>';
      h += '<div class="mb-l">' + o.valeurs.slice(0, 6).map((v) => ligne(v.nom ? D.HOPS[v.nom].html.nom : '<span class="hn hors">' + esc(v.variete) + '</span>', v, '', (v.av ? '<span class="av">à vérifier</span>' : '') + (v.fig ? '<span class="fig">figure</span>' : ''))).join('')
        + (o.temoin ? ligne('<span class="hn tm">sans houblon</span>', o.temoin, 'tm') : '') + '</div>';
      h += '<p class="mes-c">' + esc(o.ref) + ' · ' + esc(o.conditions.split(' · ')[0]) + '</p>';
    }
    $('#mes').innerHTML = h;
  }

  // ---------- le classement estimé, avec la colonne « mesuré » ----------
  function lignes() {
    const f = E.fam, o = optCourante();
    const mes = {};
    if (o && !o.qualitatif && !E.part) o.valeurs.forEach((v) => { if (v.nom) mes[v.nom] = v; });
    const rows = [];
    for (const n of D.SIMULES) {
      if (n === E.part) continue;
      const { p, g } = profil(n);
      rows.push({ k: n, nom: n, p, g, m: mes[n] || null });
    }
    if (E.part) { const { p, g } = profil(E.part, true); rows.push({ k: 'ref', nom: E.part, ref: true, p, g, m: null }); }
    // les houblons mesurés mais non simulés restent visibles, estimé inconnu
    for (const n of Object.keys(mes)) if (!rows.some((r) => r.nom === n)) rows.push({ k: n, nom: n, p: { inconnu: 'non simulé : composés non publiés' }, g: null, m: mes[n] });
    const connu = (r) => r.p && !r.p.inconnu;
    if (E.tri === 'mesure') {
      const a = rows.filter((r) => r.m).sort((x, y) => y.m.valeur - x.m.valeur), b = rows.filter((r) => !r.m).sort((x, y) => (connu(y) ? y.p.centre : -1) - (connu(x) ? x.p.centre : -1));
      return { a, b, coupe: 'pas d’étude dans ' + (o && !o.qualitatif ? o.etude : 'les études lues') };
    }
    const a = rows.filter(connu).sort((x, y) => y.p.centre - x.p.centre), b = rows.filter((r) => !connu(r));
    return { a, b, coupe: 'estimé inconnu' };
  }
  // La vraie valeur de la ligne : la mesure en bière de l'étude choisie ; sinon le composé marqueur de
  // la famille dans le houblon (analyse publiée, avec son picto) ; sinon le trou.
  const COURT_C = (n) => String(n).replace(/\s*\(.*\)$/, '');
  function cellMesure(r, o) {
    const f = E.fam;
    if (r.m) return '<span class="lr-m"><span class="cn">' + pic(f, 12) + esc(COURT_C(o.quoi)) + '</span><b class="nb" data-nature="mesure" data-source="' + esc(o.etude) + '">' + fr(r.m.valeur) + '</b><span class="src">' + esc(o.unite || '') + '</span>' + (r.m.av ? '<span class="av">à vérifier</span>' : '') + '</span>';
    const M = D.MOTEUR[r.nom];
    const dK = [2, 4, 8].includes(E.dose) ? E.dose : 2;
    const x = M && M.sig[dK + '|' + E.moment] && M.sig[dK + '|' + E.moment][f];
    const t = x && x[1] && M.teneurs[x[1]];
    if (t && t.plage) return '<span class="lr-m"><span class="cn">' + pic(f, 12) + esc(COURT_C(t.nom)) + '</span><b class="nb" data-nature="mesure" data-source="' + esc(t.sources.join(', ')) + '">' + plage(t.plage) + '</b><span class="src">' + (t.unite === 'µg/kg' ? 'µg/kg' : '% huile') + '</span></span>';
    return '<span class="lr-m vide" role="img" aria-label="inconnu : ni étude en bière, ni composé publié"><i class="hach"></i><span class="src">inconnu</span></span>';
  }
  function ligne(r, rg, o) {
    const H = D.HOPS[r.nom], f = E.fam;
    const pairee = E.part && !r.ref && D.SIMULES.includes(r.nom);
    const nomC = pairee ? '<span class="paire" data-role="ajout">' + H.html.nom + '<span class="pl">+</span>' + D.HOPS[E.part].html.nom + '<span class="src">2 + 2 g/L</span></span>' : H.html.nom + (r.ref ? '<span class="src">seul, ' + fr(E.dose) + ' g/L : repère</span>' : '');
    const rang = rg && rg.rang ? '<b class="nb">' + rg.rang + '</b>' + (rg.egal ? '<i aria-label="ex æquo">=</i>' : '') : '<span class="src">–</span>';
    return '<article class="lr' + (r.ref ? ' ref' : '') + (r.p && r.p.hors ? ' hors-s' : '') + (pairee ? ' pr' : '') + '" data-k="' + esc(r.k) + '" data-voie="' + esc(r.nom) + '" data-role="ligne-houblon" data-nom="' + esc(r.nom) + '" aria-label="' + esc(r.nom) + (r.ref ? ', seul, repère' : '') + '">'
      + '<span class="lr-r">' + rang + '</span>'
      + '<span class="lr-h">' + nomC + H.html.stock + '<span class="lr-a">' + H.html.alpha + '</span>' + bioBadge(r.g && r.g.dr) + '</span>'
      + cellMesure(r, o)
      + '<span class="lr-e">' + pisteEstime(r.p, f) + valEstime(r.p) + '</span>'
      + '<button type="button" class="lr-p" data-action="preuves" aria-label="Les preuves pour ' + esc(r.nom) + '">' + ICO('chev') + '</button></article>';
  }
  function rendLadder() {
    const f = E.fam, o = optCourante();
    const { a, b, coupe } = lignes();
    const rgA = E.tri === 'mesure' ? rangs(a, (r) => [r.m.valeur - (r.m.ecart || 0), r.m.valeur + (r.m.ecart || 0)]) : rangs(a, (r) => [r.p.bas, r.p.haut]);
    const z = D.ECHELLE[f].bande[1];
    let h = '', plafond = false, grp = null;
    // Un groupe ex æquo se voit : une accolade à gauche, et la raison en dessous.
    const fermerGrp = () => { if (grp) { h += '<p class="grp-c">≈ non départagés</p></div>'; grp = null; } };
    a.forEach((r, i) => {
      if (E.tri === 'estime' && !plafond && r.p.centre <= z) { plafond = true; if (i > 0) { fermerGrp(); h += '<div class="plaf" data-k="plafond"><span class="seul-style">plafond 16D · au-dessus, hors du style</span><span class="seul-absolu">zone de la 16D : 0–' + z + ' pts</span></div>'; } }
      const rg = rgA[i];
      if (grp && !(rg.egal && rgA[i - 1] && rg.rang === rgA[i - 1].rang)) fermerGrp();
      if (!grp && rg.egal) {
        const cote = (x) => E.tri !== 'estime' || (x.p.centre > z) === (r.p.centre > z);
        let n = 0; while (i + n < a.length && rgA[i + n].rang === rg.rang && cote(a[i + n])) n++;
        if (n > 1) { grp = n; h += '<div class="grp">'; }
      }
      h += ligne(r, rg, o);
    });
    fermerGrp();
    if (E.tri === 'estime' && !plafond && a.length) h += '<div class="plaf" data-k="plafond"><span class="seul-style">plafond 16D · tous au-dessus</span><span class="seul-absolu">zone de la 16D : 0–' + z + ' pts</span></div>';
    if (b.length) h += '<div class="coupe" data-k="coupe"><i class="hach"></i><span>' + esc(coupe) + '</span></div>' + b.map((r) => ligne(r, null, o)).join('');
    $('#lad').innerHTML = h;
    // Les autres houblons du pack : pas simulés (composés non publiés) ; leurs fiches seules.
    const autres = Object.keys(D.HOPS).filter((n) => !D.SIMULES.includes(n) && !a.concat(b).some((r) => r.nom === n));
    const citent = autres.filter((n) => D.HOPS[n].w[f] != null).sort((x, y) => D.HOPS[y].w[f] - D.HOPS[x].w[f]);
    $('#ladf').innerHTML = '<div class="ns-h"><span class="mc mc-inconnu"><i class="hach"></i>non simulés</span><span>' + citent.length + ' houblons du pack dont les fiches citent ce goût ; composés non publiés</span></div>'
      + '<div class="ns-l">' + citent.map((n) => { const w = D.HOPS[n].w[f]; return '<span class="ns" data-voie="' + esc(n) + '">' + D.HOPS[n].html.nom + '<span class="ns-w" style="--b:' + D.J[f].base + '" role="img" aria-label="fiches : ' + (w >= 1 ? 'marqué' : 'cité') + '"><i style="width:' + Math.round(w * 100) + '%"></i></span>' + D.HOPS[n].html.alpha + '</span>'; }).join('') + '</div>'
      + '<p class="ns-n">' + (autres.length - citent.length) + ' autres : leurs fiches ne citent pas ce goût. Inconnu, pas zéro.</p>';
    $('#lad-t').innerHTML = '<span class="mc mc-estime">estimé ~</span><span class="lad-tt">' + pic(f, 14) + '<span class="seul-style">crans de la 16D</span><span class="seul-absolu">points sur 100</span></span><span class="lad-m">vraie valeur</span>';
  }
  function rendre(anim) {
    norme(E);
    rendRegs(); rendMesure();
    if (anim) flip($('#lad'), rendLadder); else rendLadder();
    $$('[data-role="famille"]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.f === E.fam)));
    $$('[data-tri]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.tri === E.tri)));
  }

  // ---------- les preuves d'une ligne ----------
  function preuves(nom) {
    const f = E.fam, H = D.HOPS[nom];
    const paire = E.part && nom !== E.part && D.SIMULES.includes(nom);
    const d = paire ? 2 : E.dose;
    const { p, g } = profil(nom);
    const titre = (paire ? esc(nom) + ' + ' + esc(E.part) : esc(nom)) + ' ' + H.html.alpha + H.html.stock + H.html.usage;
    let c = blocMesure(nom) + blocCalcule(nom, f, E.moment, d);
    let extra = '';
    if (paire && g) {
      const ap = g.ap || {}, s = g.s || {};
      extra = '<p class="pr-src">Ce que chacun apporte dans la paire (simulé, pts) : ' + Object.keys(ap).map((k) => esc(k) + ' ~' + fr(ap[k][f], 0) + ' (seul ~' + fr((s[k] || {})[f], 0) + ')').join(' · ') + '. Ensemble, la saturation est partagée.</p>';
      c += blocCalcule(E.part, f, E.moment, d) + '<div class="pr-b"><h3><span class="mc mc-inconnu"><i class="hach"></i>inconnu</span> ensemble</h3><p class="pr-l"><span>Synergie et masquage : aucune étude. Le moteur additionne les activités avant la courbe : la dose totale (4 g/L) fixe la saturation.</span></p></div>';
    }
    c += blocEstime(p, f, g, extra) + blocFiches(nom);
    ouvrirPreuves(titre, c);
  }

  // ---------- les gestes ----------
  document.addEventListener('click', (e) => {
    const r = e.target.closest('[data-reglage]');
    if (r && !e.defaultPrevented) {
      const k = r.dataset.reglage;
      if (r.getAttribute('aria-disabled') === 'true') { brillerReglage(k); return; }
      if (k === 'ajout-cumule') { const v = r.dataset.part; E.part = v === undefined ? PARTS[(PARTS.indexOf(E.part) + 1) % PARTS.length] : v || null; E.dernier = 'part:' + (E.part ? 'on' : 'off'); }
      else suivant(k, E);
      rendre(true); brillerReglage(k); return;
    }
    const fa = e.target.closest('[data-role="famille"]');
    if (fa) { E.fam = fa.dataset.f; E.dernier = null; rendre(true); fa.scrollIntoView({ inline: 'nearest', block: 'nearest' }); return; }
    const t = e.target.closest('[data-tri]');
    if (t) { E.tri = t.dataset.tri; rendre(true); return; }
    if (e.target.closest('[data-action="etude"]')) { E.opt[E.fam] = (E.opt[E.fam] || 0) + 1; rendre(true); return; }
    const l = e.target.closest('.lr');
    if (l) preuves(l.dataset.nom);
  });
  const q = new URLSearchParams(location.search);
  for (const k of ['fam', 'moment', 'levure', 'part', 'tri', 'dernier']) if (q.get(k)) E[k] = q.get(k);
  for (const k of ['dose', 'jours']) if (q.get(k)) E[k] = +q.get(k);
  rendre(false);
  if (q.get('preuves')) preuves(q.get('preuves'));
})();
