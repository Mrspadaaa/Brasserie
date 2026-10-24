// Lot 21 · e4 · « Ce qui départage ». Le ladder classe seulement sur ce qui sépare :
//   - l'échelon de dose où le houblon sort de la 16D (au repère simulé, grille 1, 2, 4, 8 g/L) ; un même
//     échelon = non départagés, groupés, par ordre alphabétique ;
//   - ce que la mesure prouve (même méthode, même étude), écrit avec sa source et son facteur ;
//   - ensemble (2 + 2 g/L) : sort ou reste.
// Le geste : « ta dose » glisse ; la ligne descend ou monte, et ce qui passe au-dessus sort du style.
(function () {
  REG.moment.vals = () => ['dryActive', 'dryPost'];
  REG.levure.vals = () => ['fermentis-us05', 'lalbrew-pomona'];
  const DOSES = [1, 2, 4, 8];
  const ECH = ['dès 1 g/L', '1 à 2 g/L', '2 à 4 g/L', '4 à 8 g/L', 'reste à 8 g/L'];
  const ECH_D = [['≤ 1', 'g/L'], ['1–2', 'g/L'], ['2–4', 'g/L'], ['4–8', 'g/L'], ['> 8', 'g/L']];
  const E = { fam: D.defaut.fam, moment: 'dryActive', levure: 'fermentis-us05', di: 2, dernier: null };
  const dose = () => DOSES[E.di];
  const g = (nom, d) => D.GRILLE[[nom, E.moment, d, 3, E.levure].join('|')];
  // L'échelon : le premier de la grille où le repère dépasse le plafond de la bande du style.
  function echelon(nom) {
    const f = E.fam, z = D.ECHELLE[f].bande[1];
    const A = DOSES.map((d) => (g(nom, d) || { a: {} }).a[f]);
    if (A.some((a) => !a) || A.every((a) => a[1] === 0 && a[2] === 0)) return { inc: true };
    const i = A.findIndex((a) => a[1] > z), lo = A.findIndex((a) => a[0] > z), hi = A.findIndex((a) => a[2] > z);
    return { r: i < 0 ? 4 : i, lo: lo < 0 ? 4 : lo, hi: hi < 0 ? 4 : hi };
  }
  const preuves = () => (D.PREUVES[E.fam] || []);
  const nomsAlpha = (l) => l.slice().sort((x, y) => x.localeCompare(y, 'fr'));
  function chip(nom) {
    const H = D.HOPS[nom], x = g(nom, dose());
    const p = x ? simP(x.a[E.fam], x.d[E.fam], E.fam) : { inconnu: 'non simulé' };
    // la mini piste : le houblon à ta dose, face à la zone de la 16D (l'orangé au-delà)
    return '<span class="ch" data-k="h-' + esc(nom) + '" data-voie="' + esc(nom) + '" data-role="ligne-houblon" data-nom="' + esc(nom) + '">' + H.html.nom + H.html.stock + H.html.alpha + pisteEstime(p, E.fam, { cls: 'mini' }) + valEstime(p) + bioBadge(x && x.dr) + '</span>';
  }
  // Dans un échelon : ce que la mesure ordonne, puis le groupe que rien ne départage.
  function interieur(noms) {
    // une paire prouvée par plusieurs mesures ne s'écrit qu'une fois, avec toutes ses preuves
    const par = new Map();
    for (const p of preuves().filter((x) => noms.includes(x.a) && noms.includes(x.b))) { const k = p.a + '|' + p.b; if (!par.has(k)) par.set(k, { a: p.a, b: p.b, q: [] }); par.get(k).q.push(p.quoi.replace(/ en bière$/, '') + ' (' + p.source + ')'); }
    const P = [...par.values()].filter((p, i, l) => !l.slice(0, i).some((x) => [x.a, x.b].includes(p.a) || [x.a, x.b].includes(p.b)));
    const lies = new Set(P.flatMap((p) => [p.a, p.b]));
    let h = '';
    for (const p of P) h += chip(p.a) + '<span class="pf-in"><span class="pf-ex">devant</span><span>prouvé en bière : ' + esc(p.q.join(', ')) + '</span></span>' + chip(p.b);
    const reste = nomsAlpha(noms.filter((n) => !lies.has(n)));
    if (reste.length > 1) h += '<span class="grp-e" data-k="g-' + reste.join('|') + '"><span class="eq">≈ non départagés</span>' + reste.map(chip).join('') + '</span>';
    else h += reste.map(chip).join('');
    return h;
  }
  function rendEch() {
    const f = E.fam;
    if (f === 'resin') {
      $('#ech').innerHTML = '<p class="resine">' + pic('resin', 16) + '<span><b>Ta dégustation</b> : déjà au-dessus de la 16D (résineux marqué) ; aucun échelon à lire.</span></p>';
      $('#lad-t').innerHTML = '<span class="mc mc-estime">estimé ~</span>';
      return;
    }
    const L = D.SIMULES.map((n) => ({ n, e: echelon(n) }));
    const inc = L.filter((x) => x.e.inc).map((x) => x.n), con = L.filter((x) => !x.e.inc);
    const lo = Math.min(...con.map((x) => x.e.hi)), hi = Math.max(...con.map((x) => x.e.lo));
    $('#lad-t').innerHTML = '<span class="mc mc-estime">estimé ~</span><span class="lad-tt">' + pic(f, 14) + esc(D.COURT[f]) + '</span><span class="src">au repère · bornes ' + esc(ECH_D[lo][0]) + ' à ' + esc(ECH_D[hi][0]) + ' g/L</span>';
    let h = '';
    for (let r = 0; r <= 4; r++) {
      const noms = con.filter((x) => x.e.r === r).map((x) => x.n);
      const hors = r <= E.di;
      h += '<div class="er' + (noms.length ? '' : ' vide') + (hors && noms.length ? ' hors' : '') + '" data-k="e-' + r + '"><span class="er-d"><b>' + (r === 4 ? 'reste' : ECH_D[r][0] + ' g/L') + '</b>' + (r === 4 ? '<span>à 8 g/L</span>' : hors && noms.length ? '<span class="hs-t">hors</span>' : '') + '</span><span class="er-c">' + interieur(noms) + '</span></div>';
      if (r === E.di) h += '<div class="ligne" data-k="ligne"><span>ta dose, ' + fr(dose()) + ' g/L</span></div>';
    }
    if (inc.length) h += '<p class="inc-l"><i class="hach"></i><span>' + esc(nomsAlpha(inc).join(', ')) + ' : pas simulé pour ce goût ; inconnu, pas zéro</span></p>';
    $('#ech').innerHTML = h;
    // La réponse en une ligne : qui sort à ta dose, qui reste.
    const sort = nomsAlpha(con.filter((x) => x.e.r <= E.di).map((x) => x.n)), reste = nomsAlpha(con.filter((x) => x.e.r > E.di).map((x) => x.n));
    $('#rep').innerHTML = 'À ' + fr(dose()) + ' g/L, ' + esc(D.MOMENTS[E.moment]) + ' : ' + (sort.length ? '<span class="xs">' + esc(sort.join(', ')) + ' ' + (sort.length > 1 ? 'sortent' : 'sort') + ' de la 16D</span>' + (reste.length ? ' ; ' + esc(reste.join(', ')) + ' ' + (reste.length > 1 ? 'restent' : 'reste') : '') : 'tous restent dans la 16D') + '.';
  }
  // Une piste divergente, ×0,1 à ×100, « = » au milieu : le facteur A ÷ B de la preuve.
  function laneP(p, c) {
    const lo = -1, hi = 2, pos = (x) => Math.max(0, Math.min(100, ((Math.log10(x) - lo) / (hi - lo)) * 100));
    const a = pos(p[0]), b = p[1] == null ? 100 : pos(p[1]);
    return '<div class="ld" style="--c:' + c + '">' + [-1, 0, 1, 2].map((d) => '<i class="ld-t' + (d === 0 ? ' eq' : '') + '" style="left:' + pos(10 ** d) + '%"></i>').join('') + '<i class="ld-b' + (p[1] == null ? ' ouvert-d' : '') + '" data-role="incertitude" data-nature="mesure" data-source="mesure" style="left:' + a + '%;width:' + Math.max(1.5, b - a) + '%"></i><span class="ll-g nb" style="left:' + Math.min(a, 58) + '%">' + fx(p[0]) + ' à ' + (p[1] == null ? '?' : fx(p[1])) + '</span></div>';
  }
  function accord(p) {
    if (E.fam === 'resin') return '';
    const ea = echelon(p.a), eb = echelon(p.b);
    if (ea.inc || eb.inc) return 'repère : inconnu';
    return ea.r < eb.r ? 'repère : d’accord' : ea.r === eb.r ? 'repère : même échelon' : 'repère : l’inverse';
  }
  function rendPreuves() {
    const f = E.fam, P = preuves();
    let h = '<div class="sec-h"><span class="mc mc-mesure">mesuré</span><span>prouvé</span></div>';
    for (const p of P) {
      const c = D.J[f].base;
      h += '<div class="pf"><div class="pf-h">' + D.HOPS[p.a].html.nom + '<span class="sup">devant</span>' + D.HOPS[p.b].html.nom + '<span class="src pf-q">' + pic(f, 12) + esc(p.quoi) + '</span></div>'
        + '<div class="pf-v">' + pic(f, 12) + '<b data-nature="mesure" data-source="' + esc(p.source) + '">' + plage(p.va) + '</b><span>contre</span><b data-nature="mesure" data-source="' + esc(p.source) + '">' + plage(p.vb) + '</b><span>' + esc(p.unite) + (p.temoin != null ? ' · sans houblon ' + fr(p.temoin) : '') + ' · ' + esc(p.ref) + (p.dose ? ' · ' + esc(p.dose) : '') + '</span></div>'
        + (p.au ? '<div class="pf-v"><b>×' + fr(p.au, 1) + '</b><span>au-dessus de la bière sans houblon ; ' + esc(accord(p)) + '</span></div>'
          : p.f ? laneP(p.f, c) + '<div class="pf-v"><span>' + esc(accord(p)) + '</span></div>'
          : '<div class="pf-v"><span>' + (p.temoin != null ? 'l’un est sous la bière sans houblon : pas de facteur ; ' : '') + esc(accord(p)) + '</span></div>') + '</div>';
    }
    const lies = new Set(P.flatMap((p) => [p.a, p.b]));
    const sans = nomsAlpha(D.SIMULES.filter((n) => !lies.has(n)));
    if (!P.length) h += '<p class="np"><i class="hach"></i><span>Rien de mesuré ne départage ces houblons pour ce goût.</span></p>';
    else if (sans.length) h += '<p class="np"><i class="hach"></i><span>Sans preuve pour ce goût : ' + esc(sans.join(', ')) + '.</span></p>';
    for (const p of D.TOUTES) h += '<div class="pf"><div class="pf-h">' + D.HOPS[p.a].html.nom + '<span class="sup">devant</span>' + D.HOPS[p.b].html.nom + '<span class="src">huile par gramme, une force, pas un goût</span></div><div class="pf-v"><b data-nature="mesure" data-source="' + esc(p.source) + '">' + plage(p.va) + '</b><span>contre</span><b data-nature="mesure" data-source="' + esc(p.source) + '">' + plage(p.vb) + '</b><span>mL/100 g</span></div>' + laneP(p.f, '#5b5b66') + '</div>';
    $('#prv').innerHTML = h;
  }
  // Ensemble, 2 + 2 g/L, 3 j : sort ou reste (grillePaires[]).
  function rendEnsemble() {
    const f = E.fam, z = D.ECHELLE[f].bande[1];
    const P = Object.values(D.PAIRES).filter((x, i, l) => x && D.PAIRES[[...x.noms].sort().join('+') + '|' + E.moment + '|' + E.levure] === x);
    const pa = (x) => '<span class="pa" data-role="ajout" data-voie="' + esc(x.noms[0]) + '">' + D.HOPS[x.noms[0]].html.nom + '<span class="pl">+</span>' + D.HOPS[x.noms[1]].html.nom + D.HOPS[x.noms[0]].html.alpha + '</span>';
    const sort = P.filter((x) => x.a[f][1] > z), reste = P.filter((x) => x.a[f][1] <= z && !(x.a[f][1] === 0 && x.a[f][2] === 0));
    $('#ens').innerHTML = '<div class="sec-h">' + ICO('paire') + '<span>Ensemble, 2 + 2 g/L, 3 j</span><span class="mc mc-estime">estimé ~</span></div>'
      + (f === 'resin' ? '<p class="np">Ta dégustation : déjà au-dessus.</p>' : '<div class="en-l"><div class="en-r"><span class="k xs">sortent</span>' + (sort.map(pa).join('') || '<span class="src">aucune paire</span>') + '</div><div class="en-r"><span class="k">restent</span>' + (reste.map(pa).join('') || '<span class="src">aucune paire</span>') + '</div></div>')
      + '<p class="np"><i class="hach"></i><span>Aucune étude ne mesure deux houblons ensemble ; synergie et masquage : inconnus.</span></p>';
  }
  function rendre(anim) {
    $('#regs').innerHTML = chipReglage('moment', E) + chipReglage('levure', E) + '<span class="lev-n">Verdant, Diamond : pas encore simulées</span>';
    $('#dose').value = String(E.di); $('#dose-v').textContent = fr(dose()) + ' g/L';
    if (anim) flip($('#ech'), rendEch); else rendEch();
    rendPreuves(); rendEnsemble();
    $$('[data-role="famille"]').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.f === E.fam)));
  }
  // Les preuves d'un houblon : estimé à ta dose, calculé, mesuré, fiches.
  function detail(nom) {
    const x = g(nom, dose()), f = E.fam;
    const p = x ? simP(x.a[f], x.d[f], f) : { inconnu: 'non simulé' };
    const H = D.HOPS[nom];
    ouvrirPreuves(esc(nom) + ' ' + H.html.alpha + H.html.stock + H.html.usage, blocEstime(p, f, x, '', nom + ', ' + fr(dose()) + ' g/L') + blocCalcule(nom, f, E.moment, dose()) + blocMesure(nom) + blocFiches(nom));
  }
  $('#dose').addEventListener('input', (e) => { const v = +e.target.value; if (v === E.di) return; E.di = v; E.dernier = 'dose:' + dose(); rendre(true); });
  document.addEventListener('click', (e) => {
    const r = e.target.closest('button[data-reglage]');
    if (r && !e.defaultPrevented) { const k = r.dataset.reglage; suivant(k, E); rendre(true); brillerReglage(k); return; }
    const fa = e.target.closest('[data-role="famille"]');
    if (fa) { E.fam = fa.dataset.f; rendre(true); return; }
    const c = e.target.closest('.ch');
    if (c) detail(c.dataset.nom);
  });
  const q = new URLSearchParams(location.search);
  for (const k of ['fam', 'moment', 'levure']) if (q.get(k)) E[k] = q.get(k);
  if (q.get('dose')) E.di = Math.max(0, DOSES.indexOf(+q.get('dose')));
  rendre(false);
  if (q.get('detail')) detail(q.get('detail'));
})();
