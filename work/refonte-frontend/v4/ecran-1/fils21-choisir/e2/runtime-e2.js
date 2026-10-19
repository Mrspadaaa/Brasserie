// Lot 21 · e2 · « Le duel, par gramme puis par famille ». Deux houblons à dose égale (Citra contre
// Cascade d'abord : « d'après nos outils ils sont assez similaires »). En haut, PAR GRAMME, les vraies
// valeurs du houblon (huile, 4MMP, linalol, myrcène) : le facteur A ÷ B en bande sur une échelle
// logarithmique centrée sur « = » ; une bande qui passe « = » ne départage pas. Puis, si une étude les a
// mesurés ensemble en bière, la mesure ; sinon le trou. Enfin, FAMILLE PAR FAMILLE, l'estimé ~ des deux
// (plein pour A, contour pour B) devant la zone de la 16D, les familles où ils diffèrent le plus en tête.
// B peut être une paire : A + un autre, ensemble, 2 + 2 g/L, contre A seul à 4 g/L.
(function () {
  // Un duel compare à réglages égaux : la levure se limite à celles que grille[] simule pour un houblon seul.
  REG.levure.vals = () => ['fermentis-us05', 'lalbrew-pomona'];
  const E = { a: D.defaut.a, b: D.defaut.b, dose: 4, moment: 'dryPost', jours: 3, levure: 'fermentis-us05', part: null, dernier: null };
  const paireB = () => /\+/.test(E.b);
  const pairNoms = () => E.b.split('+');
  // part : l'état « paire » pour norme() (dry hop seulement ; levures de grillePaires)
  function sync() { E.part = paireB() ? 'x' : null; norme(E); if (paireB()) { E.dose = 4; E.jours = 3; } }

  function entree(nom) { return D.GRILLE[[nom, E.moment, E.dose, /^dry/.test(E.moment) ? E.jours : '', E.levure].join('|')] || null; }
  function entreeB() { return paireB() ? D.PAIRES[pairNoms().slice().sort().join('+') + '|' + E.moment + '|' + E.levure] || null : entree(E.b); }
  const nomB = () => (paireB() ? pairNoms().join(' + ') : E.b);

  // ---------- le duel : A, B, et les adversaires possibles ----------
  function rendDuel() {
    const A = D.HOPS[E.a];
    const bH = paireB() ? pairNoms().map((n) => D.HOPS[n].html.nom).join('<span class="pl">+</span>') : D.HOPS[E.b].html.nom;
    $('#duel').innerHTML = '<div class="du-a" data-voie="' + esc(E.a) + '" data-role="ligne-houblon">' + '<span class="du-m plein" aria-hidden="true"></span>' + A.html.nom + A.html.stock + '<span class="du-al">' + A.html.alpha + '</span><button type="button" class="du-c" data-action="a" aria-label="Changer le houblon A">' + ICO('duel') + '</button></div>'
      + '<span class="du-vs">contre</span>'
      + '<div class="du-b" data-voie="' + esc(paireB() ? pairNoms()[1] : E.b) + '" data-role="' + (paireB() ? 'ajout' : 'ligne-houblon') + '"><span class="du-m creux" aria-hidden="true"></span>' + bH + (paireB() ? '<span class="src">2 + 2 g/L</span>' : D.HOPS[E.b].html.stock + '<span class="du-al">' + D.HOPS[E.b].html.alpha + '</span>') + '</div>';
    const adv = D.SIMULES.filter((n) => n !== E.a).concat(D.SIMULES.filter((n) => n !== E.a).map((n) => E.a + '+' + n));
    $('#adv').innerHTML = '<span class="cu-t">' + ICO('duel') + '<span>contre</span></span><span class="cu-l">' + adv.map((x) => '<button type="button" class="cu' + (/\+/.test(x) ? ' cu-p' : '') + '" data-role="reglage" data-reglage="' + (/\+/.test(x) ? 'ajout-cumule' : 'adversaire') + '" data-b="' + esc(x) + '" aria-pressed="' + (x === E.b) + '" aria-label="' + (/\+/.test(x) ? esc(x.replace('+', ' et ')) + ' ensemble, 2 + 2 g/L, contre ' + esc(E.a) + ' seul' : 'Contre ' + esc(x)) + '">' + (/\+/.test(x) ? ICO('paire') + esc(x.split('+')[0]) + ' + ' + esc(x.split('+')[1]) : esc(x)) + '</button>').join('') + '</span>';
  }
  function rendRegs() {
    const p = paireB();
    $('#regs').innerHTML = chipReglage('dose', E, p ? '4 g/L contre 2 + 2' : null) + chipReglage('moment', E) + chipReglage('jours', E, p ? '3 j' : null) + chipReglage('levure', E);
    $('#pq').innerHTML = pourquoi(E) + bioLigne(E);
  }

  // ---------- par gramme : le facteur A ÷ B des vraies valeurs, en log centré sur « = » ----------
  // a, b : [min, max, central] ; renvoie [min, max, central] de A ÷ B (null si une borne manque).
  function facteur(a, b) {
    if (!a || !b) return null;
    const mn = a[0] != null && b[1] ? a[0] / b[1] : null, mx = a[1] != null && b[0] ? a[1] / b[0] : null;
    const c = a[2] != null && b[2] ? a[2] / b[2] : null;
    return [mn, mx, c];
  }
  // Une piste divergente : ×0,01 à ×100, « = » au milieu ; à gauche B devant, à droite A devant.
  function laneDuel(p, o = {}) {
    const lo = -2, hi = 2, pos = (x) => ((Math.log10(x) - lo) / (hi - lo)) * 100, cl = (v) => Math.max(0, Math.min(100, v));
    let h = '<div class="ld" style="--c:' + (o.c || '#16161a') + '">' + [-2, -1, 0, 1, 2].map((d) => '<i class="ld-t' + (d === 0 ? ' eq' : '') + '" style="left:' + pos(10 ** d) + '%"></i>').join('');
    if (!p || (p[0] == null && p[1] == null)) return h + '<span class="ll-inc"><i class="hach"></i>' + esc(o.inconnu || 'inconnu : une des deux valeurs manque') + '</span></div>';
    const a = p[0] == null ? 0 : cl(pos(p[0])), b = p[1] == null ? 100 : cl(pos(p[1]));
    const passe = (p[0] == null || p[0] <= 1) && (p[1] == null || p[1] >= 1);
    h += '<i class="ld-b' + (passe ? ' eq' : '') + (p[0] == null ? ' ouvert-g' : '') + (p[1] == null ? ' ouvert-d' : '') + '" data-role="incertitude" data-nature="mesure" data-source="' + esc(o.source || '') + '" style="left:' + a + '%;width:' + Math.max(1.5, b - a) + '%" role="img" aria-label="' + esc(E.a) + ' divisé par ' + esc(nomB()) + ' : ' + (p[0] == null ? 'borne basse inconnue' : fx(p[0])) + ' à ' + (p[1] == null ? 'borne haute inconnue' : fx(p[1])) + '"></i>';
    if (p[2] != null) h += '<i class="ll-c" style="left:' + cl(pos(p[2])) + '%"></i>';
    const g = p[0] == null ? '?' : fx(p[0]), d = p[1] == null ? '?' : fx(p[1]);
    h += b - a < 30 ? '<span class="ll-g nb" style="left:' + Math.min(a, 60) + '%">' + g + ' à ' + d + '</span>' : '<span class="ll-g nb" style="left:' + a + '%">' + g + '</span><span class="ll-d nb" style="left:' + b + '%">' + d + '</span>';
    return h + '</div>';
  }
  const verdictF = (p, bn = nomB()) => (!p || (p[0] == null && p[1] == null) ? '<span class="vd inc">inconnu</span>' : (p[0] != null && p[0] > 1) ? '<span class="vd a">' + esc(E.a) + ' devant</span>' : (p[1] != null && p[1] < 1) ? '<span class="vd b">' + esc(bn) + ' devant</span>' : '<span class="vd eq">≈ non départagés</span>');
  function rendGramme() {
    const A = D.MOTEUR[E.a];
    const Bn = paireB() ? pairNoms()[1] : E.b, B = Bn && D.MOTEUR[Bn];
    let h = '<div class="sec-h"><span class="mc mc-mesure">mesuré</span><span>par gramme de houblon</span><span class="src">' + esc(E.a) + ' ÷ ' + esc(Bn) + (paireB() ? ', le partenaire' : '') + '</span></div>';
    if (!B) { $('#gramme').innerHTML = h + '<p class="mes-trou"><i class="hach"></i><span>Composés de ' + esc(Bn) + ' non publiés : rien à comparer par gramme.</span></p>'; return; }
    const L = [
      ['huile', null, 'huile', A.huile.plage, B.huile.plage, 'mL/100 g', A.huile.sources.concat(B.huile.sources)],
      ['4MMP', 'tropical', '4MMP', (A.teneurs['4MMP'] || {}).plage, (B.teneurs['4MMP'] || {}).plage, 'µg/kg', ['H11']],
      ['4MMP-bc', 'tropical', '4MMP, même méthode', (A.teneurs['4MMP'] || {}).bc, (B.teneurs['4MMP'] || {}).bc, 'µg/kg', ['H11, Hopsteiner 2024']],
      ['linalol', 'floral', 'linalol', (A.teneurs.linalol || {}).plage, (B.teneurs.linalol || {}).plage, '% huile', (A.teneurs.linalol || { sources: [] }).sources],
      ['myrcene', 'resin', 'myrcène', (A.teneurs.myrcene || {}).plage, (B.teneurs.myrcene || {}).plage, '% huile', (A.teneurs.myrcene || { sources: [] }).sources],
    ];
    let premier = true;
    for (const [k, f, nom, a, b, u, src] of L) {
      if (k === '4MMP-bc' && !(a && b)) continue;
      const p = facteur(a, b);
      h += '<div class="gr" data-k="' + k + '"><div class="gr-h">' + (f ? pic(f, 14) : ICO('goutte')) + '<span class="gr-n">' + esc(nom) + '</span><span class="gr-v"><b class="nb" data-nature="mesure" data-source="' + esc(src.join(', ')) + '">' + plage(a) + '</b><span class="src">contre</span><b class="nb" data-nature="mesure" data-source="' + esc(src.join(', ')) + '">' + plage(b) + '</b><span class="src">' + esc(u) + '</span></span>' + verdictF(p, Bn) + '</div>' + laneDuel(p, { source: src.join(', '), c: f ? D.J[f].base : '#5b5b66' }) + (premier ? '<p class="ld-ax"><span>← ' + esc(Bn) + ' devant</span><span>=</span><span>' + esc(E.a) + ' devant →</span></p>' : '') + '</div>';
      premier = false;
    }
    // Les lots du houblon B (certificats), en points sur l'huile, quand ils existent.
    const lotsB = (B.lots || []).filter((l) => l.huile != null);
    if (lotsB.length) h += '<p class="gr-lots">' + ICO('stock') + '<span>' + esc(Bn) + ' : ' + lotsB.length + (lotsB.length > 1 ? ' lots certifiés' : ' lot certifié') + ', huile ' + lotsB.map((l) => fr(l.huile)).join(' · ') + ' mL/100 g</span></p>';
    // En bière : une même étude qui mesure A et B ?
    const ea = D.MESURES_HOP[E.a] || [], eb = D.MESURES_HOP[Bn] || [];
    const communes = ea.filter((x) => eb.some((y) => y.etude === x.etude));
    if (!communes.length) h += '<p class="mes-trou"><i class="hach"></i><span>En bière, à dose égale : <b>aucune étude</b> ne mesure ' + esc(E.a) + ' contre ' + esc(Bn) + '.</span></p>';
    else for (const x of communes) {
      const y = eb.find((z) => z.etude === x.etude);
      const m = x.mesures.filter((q) => typeof q.valeur === 'number' && y.mesures.some((r) => r.quoi === q.quoi)).slice(0, 3);
      // Ce que le houblon ajoute se lit au-dessus de la bière sans houblon de la même étude.
      h += '<div class="gr-b"><span class="mc mc-mesure">mesuré</span><span class="src">en bière · ' + esc(x.etude) + ' · ' + esc(x.ref) + ' · ' + esc(x.conditions.split(' · ')[0]) + '</span></div>' + m.map((q) => {
        const r = y.mesures.find((z) => z.quoi === q.quoi); const fam = q.famille || FAM_DE[q.quoi];
        const t = D.TEMOINS[x.etude + '|' + q.quoi];
        const ajA = t != null ? q.valeur - t : null, ajB = t != null ? r.valeur - t : null;
        const chip = t == null ? '<span class="vd a">×' + fr(q.valeur / r.valeur, 1) + '</span>' : ajA > 0 && ajB > 0 ? '<span class="vd a">×' + fr(ajA / ajB, 1) + ' au-dessus</span>' : '<span class="vd eq">≈ sans houblon</span>';
        return '<p class="gr-bl">' + (fam ? pic(fam, 14) : '') + '<span>' + esc(q.quoi) + '</span><b class="nb" data-nature="mesure" data-source="' + esc(x.etude) + '">' + fr(q.valeur) + '</b><span class="src">contre</span><b class="nb" data-nature="mesure" data-source="' + esc(x.etude) + '">' + fr(r.valeur) + '</b><span class="src">' + esc(q.unite) + (t != null ? ' · sans houblon ' + fr(t) : '') + '</span>' + (q.av || r.av ? '<span class="av">à vérifier</span>' : '') + chip + '</p>';
      }).join('');
    }
    $('#gramme').innerHTML = h;
  }

  // ---------- famille par famille : l'estimé des deux, les plus grands écarts en tête ----------
  function familles() {
    const ga = paireB() ? D.GRILLE[[E.a, E.moment, 4, 3, E.levure].join('|')] : entree(E.a), gb = entreeB();
    const rows = D.ORDRE.map((f) => {
      const pa = ga ? simP(ga.a[f], ga.d[f], f) : { inconnu: 'non simulé' }, pb = gb ? simP(gb.a[f], gb.d[f], f) : { inconnu: 'non simulé' };
      const ok = !pa.inconnu && !pb.inconnu;
      return { f, pa, pb, ok, ecart: ok ? pa.centre - pb.centre : null, eq: ok && indiscernables([pa.bas, pa.haut], [pb.bas, pb.haut]) };
    });
    const a = rows.filter((r) => r.ok).sort((x, y) => Math.abs(y.ecart) - Math.abs(x.ecart)), b = rows.filter((r) => !r.ok);
    return { a, b, ga, gb };
  }
  function ligneF(r) {
    const f = r.f, J = D.J[f], cran = D.ECHELLE[f].cran;
    const qui = r.ok ? (r.ecart >= 0 ? E.a : nomB()) : '', n = r.ok ? Math.abs(Math.round(r.ecart / cran)) : 0;
    const v = !r.ok ? '<span class="vd inc">inconnu</span>' : r.eq ? '<span class="vd eq" data-nature="simule">≈ ' + esc(qui) + ' <span class="nb">~+' + fr(Math.abs(r.ecart), 0) + '</span> pts</span>' : '<span class="vd ' + (r.ecart > 0 ? 'a' : 'b') + '" data-nature="simule">' + esc(qui) + ' devant <span class="nb">~+' + n + '</span> cran' + (n > 1 ? 's' : '') + '</span>';
    return '<article class="fl" data-k="' + f + '" data-f="' + f + '" style="--f:' + J.fond + ';--t:' + J.texte + '"><span class="fl-n">' + pic(f, 18) + '<span>' + esc(D.COURT[f]) + '</span></span>'
      + '<span class="fl-p"><span class="fl-l">' + pisteEstime(r.pa, f) + '</span><span class="fl-l creux">' + pisteEstime(r.pb, f) + '</span></span>'
      + '<span class="fl-v">' + v + '</span><button type="button" class="lr-p" data-action="preuves" aria-label="Les preuves : ' + esc(D.NOM[f]) + '">' + ICO('chev') + '</button></article>';
  }
  function rendFamilles() {
    const { a, b, ga, gb } = familles();
    const eq = a.filter((r) => r.eq).length;
    $('#fam-t').innerHTML = '<span class="mc mc-estime">estimé ~</span><span class="lad-tt"><span class="du-m plein" aria-hidden="true"></span>' + esc(E.a) + (paireB() ? ' seul, 4 g/L' : '') + ' <span class="du-m creux" aria-hidden="true"></span>' + esc(nomB()) + '</span><span class="src">' + eq + ' sur ' + a.length + ' non départagés</span>';
    $('#fam').innerHTML = a.map(ligneF).join('') + (b.length ? '<div class="coupe" data-k="coupe"><i class="hach"></i><span>' + b.map((r) => esc(D.COURT[r.f])).join(', ') + ' : non simulés (ni fiche ni composé)</span></div>' : '');
    // les drapeaux du duel : bio-transfo, saturation partagée, hors du style
    const dr = [...new Set([...(ga ? ga.dr : []), ...(gb ? gb.dr : [])])];
    $('#drap').innerHTML = bioBadge(gb && gb.dr) || bioBadge(ga && ga.dr) ? '<div class="pr-dr">' + (bioBadge(ga && ga.dr) || bioBadge(gb && gb.dr)) + dr.filter((d) => DRAP[d] && !/^biotransformation/.test(d)).map((d) => '<span class="drp' + (/inconnu/.test(DRAP[d]) ? ' inc' : '') + (d === 'hors-du-style' ? ' xs' : '') + '">' + esc(DRAP[d]) + '</span>').join('') + '</div>' : '<div class="pr-dr">' + dr.filter((d) => DRAP[d]).map((d) => '<span class="drp' + (/inconnu/.test(DRAP[d]) ? ' inc' : '') + (d === 'hors-du-style' ? ' xs' : '') + '">' + esc(DRAP[d]) + '</span>').join('') + '</div>';
  }
  function rendre(anim) {
    sync();
    rendDuel(); rendRegs(); rendGramme();
    if (anim) flip($('#fam'), rendFamilles); else rendFamilles();
  }

  // ---------- les preuves d'une famille : les deux, calculé, estimé, mesuré ----------
  function preuves(f) {
    const { a, b, ga, gb } = familles();
    const r = a.concat(b).find((x) => x.f === f);
    const B1 = paireB() ? pairNoms()[1] : E.b;
    let c = blocEstime(r.pa, f, ga, '', E.a + (paireB() ? ' seul, 4 g/L' : '')) + blocEstime(r.pb, f, gb, '', nomB() + (paireB() ? ', 2 + 2 g/L ensemble' : ''));
    c += blocCalcule(E.a, f, E.moment, paireB() ? 4 : E.dose) + blocCalcule(B1, f, E.moment, paireB() ? 2 : E.dose);
    c += blocMesure(E.a) + (paireB() ? '' : blocMesure(E.b));
    ouvrirPreuves(pic(f, 18) + ' ' + esc(D.NOM[f]) + ' : ' + esc(E.a) + ' contre ' + esc(nomB()), c);
  }

  document.addEventListener('click', (e) => {
    const r = e.target.closest('[data-reglage]');
    if (r && !e.defaultPrevented) {
      const k = r.dataset.reglage;
      if (r.getAttribute('aria-disabled') === 'true') { brillerReglage(k); return; }
      if (k === 'adversaire' || k === 'ajout-cumule') { E.b = r.dataset.b; E.dernier = k === 'ajout-cumule' ? 'part:on' : null; }
      else suivant(k, E);
      rendre(true); brillerReglage(k); return;
    }
    if (e.target.closest('[data-action="a"]')) { const i = D.SIMULES.indexOf(E.a); E.a = D.SIMULES[(i + 1) % D.SIMULES.length]; if (E.b === E.a || (paireB() && !pairNoms().includes(E.a))) E.b = D.SIMULES.find((n) => n !== E.a); rendre(true); return; }
    const l = e.target.closest('.fl');
    if (l) preuves(l.dataset.f);
  });
  const q = new URLSearchParams(location.search);
  for (const k of ['a', 'b', 'moment', 'levure', 'dernier']) if (q.get(k)) E[k] = q.get(k);
  for (const k of ['dose', 'jours']) if (q.get(k)) E[k] = +q.get(k);
  rendre(false);
  if (q.get('preuves')) preuves(q.get('preuves'));
})();
