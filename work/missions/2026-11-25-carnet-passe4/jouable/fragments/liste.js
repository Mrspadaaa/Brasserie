/* Liste (passe 4) : base p4b-1 (arbre, sous-domaines sur la ligne du domaine, champ et + collés) ; chiffre clé à droite (p4b-3), ≈ sur une
   estimation ; résolus repliés dans l'en-tête du domaine (p4b-2) ; compteurs qui filtrent ; « Ranger dans… » d'un toucher sur l'icône. */
var filtreEtat = null, filtreSous = {};
function cleDe(c) {
  var r = c.org && c.org.rep; if (!r) return null;
  var d = decidable(r);
  if (d && !retenus(c.org).length) return { t: d.map(function (x) { return x.cout.replace(/\s*CHF$/, ''); }).join(' | ') + ' CHF' };
  var p = prochaine(c);
  if (c.etat !== 'resolu' && p && p.n >= 0 && p.n <= 45) return { t: (p.approx ? '≈ ' : '') + p.txt, date: true };
  if (r.chiffres && r.chiffres[0]) { var x = r.chiffres[0]; return { t: (x.estime ? '≈ ' : '') + j1Virg(x.valeur), est: !!x.estime }; }
  var es = r.options.filter(function (o) { return o.estime && nb(o.cout) != null; })[0];
  if (es) return { t: '≈ ' + es.cout.replace(/\s*\?$/, ''), est: true };
  if (p) return { t: (p.approx ? '≈ ' : '') + p.txt, date: true };
  return r.resume ? { t: r.resume } : null;
}
function rendreListe() {
  var l = $('liste'), y = l.scrollTop; l.textContent = '';
  var n = { note: 0, cherche: 0, decide: 0, resolu: 0 }; etat.carnets.forEach(function (c) { n[c.etat] = (n[c.etat] || 0) + 1; });
  var items = aFaire(), af = etat.vueListe === 'afaire';
  $('liste-n').textContent = String(etat.carnets.length); $('n-afaire').textContent = String(items.length);
  $('tab-carnets').classList.toggle('on', !af); $('tab-afaire').classList.toggle('on', af);
  $('tab-carnets').setAttribute('aria-selected', String(!af)); $('tab-afaire').setAttribute('aria-selected', String(af));
  $('v-liste').classList.toggle('afaire', af);
  var oe = $('oeil'); oe.textContent = '';
  [['cherche', 'cherche', 'cherche'], ['decide', 'décidé', 'décidés'], ['note', 'noté', 'notés'], ['resolu', 'résolu', 'résolus']].forEach(function (e) {
    oe.appendChild(h('button', { type: 'button', class: e[0] + (filtreEtat === e[0] ? ' on' : ''), 'aria-pressed': String(filtreEtat === e[0]), 'data-booster': 'filtre-etat',
      onclick: function () { filtreEtat = filtreEtat === e[0] ? null : e[0]; geste('filtrer', filtreEtat || 'tout'); rendreListe(); } }, h('b', null, String(n[e[0]])), n[e[0]] > 1 ? e[2] : e[1]));
  });
  if (af) rendreAFaire(l, items);
  else { rendreArbre(l); l.appendChild(h('button', { type: 'button', class: 'm4j-recharger', onclick: rechargerExemples }, 'Recharger les exemples')); }
  l.scrollTop = y;
}
function rendreArbre(l) {
  var cats = {}, vis = etat.carnets.filter(function (c) { return !filtreEtat || c.etat === filtreEtat; });
  vis.forEach(function (c) { var k = catDe(c), g = cats[k.nom] = cats[k.nom] || { tous: [], sous: [] }; g.tous.push(c); if (k.sous && g.sous.indexOf(k.sous) < 0) g.sous.push(k.sous); });
  if (!vis.length) { l.appendChild(h('p', { class: 'm4b-vide' }, 'Aucun carnet dans cet état.')); return; }
  Object.keys(cats).sort(function (a, b) { return ordreCat(a) - ordreCat(b) || a.localeCompare(b, 'fr'); }).forEach(function (nom) {
    var g = cats[nom], kc = 'c:' + nom, rc = replie(kc, false), fs = filtreSous[nom] || null, kr = 'r:' + nom;
    var res = g.tous.filter(function (c) { return c.etat === 'resolu'; }), rr = filtreEtat === 'resolu' ? false : replie(kr, true);
    g.sous.sort(function (a, b) { return ordreSous(nom, a) - ordreSous(nom, b) || a.localeCompare(b, 'fr'); });
    l.appendChild(h('div', { class: 'p4-dn', 'data-cat': nom },
      h('button', { type: 'button', class: 'pli', 'aria-expanded': String(!rc), onclick: function () { replier(kc, false); } },
        h('span', { class: 'ch' }, rc ? '▸' : '▾'), h('span', null, nom === SANS ? '📥' : catEmoji(nom)), h('b', null, nom === SANS ? 'À ranger' : nom), h('span', { class: 'n' }, String(g.tous.length))),
      h('span', { class: 'ss' }, g.sous.map(function (s, i) {
        return h('button', { type: 'button', class: 'p4-ss' + (fs === s ? ' on' : ''), 'data-cat': nom, 'data-sous': s, 'aria-pressed': String(fs === s), 'data-booster': 'sous-domaine',
          onclick: function () { filtreSous[nom] = fs === s ? null : s; if (rc) replier(kc, false); else rendreListe(); } }, (i ? '· ' : '') + s);
      })),
      res.length && filtreEtat !== 'resolu' ? h('button', { type: 'button', class: 'p4-res', 'aria-expanded': String(!rr), 'aria-label': res.length + ' résolus', onclick: function () { replier(kr, true); } }, (rr ? '▸ ' : '▾ ') + '✓ ' + res.length) : null));
    if (rc) return;
    g.tous.filter(function (c) { return (!fs || catDe(c).sous === fs) && (c.etat !== 'resolu' || !rr); })
      .sort(function (a, b) { return (a.etat === 'resolu') - (b.etat === 'resolu') || RANGP[prioDe(a)] - RANGP[prioDe(b)] || ordreSous(nom, catDe(a).sous) - ordreSous(nom, catDe(b).sous) || rangDe(a) - rangDe(b); })
      .forEach(function (c) { l.appendChild(ligneCarnet(c)); });
  });
}
function ligneCarnet(c) {
  var lit = estEnLecture(c), k = !lit && cleDe(c);
  var row = h('div', { class: 'p4-r' + (prioDe(c) === 'haute' ? ' haute' : '') + (c.etat === 'resolu' ? ' res' : ''), 'data-id': c.id, role: 'button', tabindex: '0' },
    h('button', { type: 'button', class: 'p4-r-em', 'aria-label': 'Ranger « ' + titreCourt(c) + ' » dans…', 'data-booster': 'ranger-dans', onclick: function (e) { e.stopPropagation(); feuilleRanger(c); } }, emojiDe(c)),
    h('span', { class: 'p4-r-t' }, h('span', { class: 'ti' }, titreCourt(c)),
      lit ? h('span', { class: 'p4-cle lit' }, '✦ lit…')
        : h('span', { class: 'p4-cle' + (k && k.date ? ' date' : '') + (k && k.est ? ' est' : ''), style: '--c:' + COUL_ETAT[c.etat], title: NOM_ETAT[c.etat] }, h('i'), k ? k.t : NOM_ETAT[c.etat]),
      c.orgNeuf ? h('i', { class: 'neuf', title: 'Organisé a du neuf' }) : null));
  brancherGlisse(row, c);
  return row;
}
/* À faire : ligne de temps à icônes (p4b-3), décision tranchée d'un toucher (p4b-2) avec Annuler, puis par délai (semaine finie le dimanche) */
function aFaire() {
  var it = [];
  etat.carnets.forEach(function (c) {
    if (c.etat === 'resolu') return;
    var o = c.org, r = o && o.rep;
    if (r && r.echeance && !o.echeanceFaite && !(r.tache && r.tache.quand === r.echeance.quand && o.garde.tache !== false && !o.tacheFaite)) it.push({ c: c, ic: '⏳', t: r.echeance.quoi || 'Échéance', q: r.echeance.quand, sorte: 'echeance' });
    var tv = r ? tacheVive(c) : null, ch = r ? choixDe(c) : null;
    if (tv && !o.tacheFaite && !tacheDuo(r, o)) it.push({ c: c, ic: tv.emoji || '☐', t: tv.titre, q: tv.quand, sorte: 'tache' });
    if (ch && !o.choixFait) it.push({ c: c, ic: ch.emoji, t: ch.titre, q: r.tache && tacheChoix(r, o, r.tache) ? r.tache.quand : null, sorte: 'choix' });
    (c.miens || []).forEach(function (m) { if (m.type === 'tache' && !m.fait) it.push({ c: c, ic: m.check ? '✓' : '☐', t: m.texte, q: null, sorte: 'mien', m: m }); });
  });
  it.forEach(function (x) { var d = x.q && lireDate(x.q, x.c.maj); x.d = d ? d.d : null; x.approx = d ? !!d.approx : false; });
  return it.sort(function (a, b) { return (a.d ? +a.d : 9e15) - (b.d ? +b.d : 9e15); });
}
function decisions() {
  return etat.carnets.filter(function (c) { var r = c.org && c.org.rep; return c.etat !== 'resolu' && r && decidable(r) && !retenus(c.org).length && c.org.garde.options !== false; });
}
function cocherIci(x) {
  var o = x.c.org, av = x.sorte === 'tache' ? { f: o.tacheFaite, g: o.garde.tache } : null;
  if (x.sorte === 'tache') { o.tacheFaite = true; if (o.garde.tache === undefined) o.garde.tache = true; }
  else if (x.sorte === 'mien') x.m.fait = true; else if (x.sorte === 'choix') o.choixFait = true; else o.echeanceFaite = true;
  sauver(); journal({ quand: new Date().toISOString(), geste: 'cocher (À faire)', quoi: x.t, carnetTitre: titreDe(x.c) }); rendreListe();
  toast('Fait : ' + x.t, 'Annuler', function () {
    if (x.sorte === 'tache') { o.tacheFaite = av.f; o.garde.tache = av.g; } else if (x.sorte === 'mien') x.m.fait = false; else if (x.sorte === 'choix') o.choixFait = false; else o.echeanceFaite = false;
    sauver(); rendreListe();
  });
}
function retenirIci(c, i) {
  var o = c.org, op = o.rep.options[i], av = { etat: c.etat, par: c.etatPar, R: retenus(o).slice(), g: o.garde.options };
  retenus(o).push(i); o.retenuLe = new Date().toISOString(); if (o.garde.options === undefined) o.garde.options = true;
  if (RANG[c.etat] < RANG.decide) { o.etatAvant = c.etat; c.etat = 'decide'; c.etatPar = { par: 'toi', le: o.retenuLe }; }
  sauver(); journal({ quand: new Date().toISOString(), geste: 'retenir une option (À faire)', quoi: op.titre, carnetTitre: titreDe(c) }); rendreListe();
  toast('Retenu : ' + op.titre, 'Annuler', function () { c.etat = av.etat; c.etatPar = av.par; o.retenus = av.R; o.garde.options = av.g; sauver(); rendreListe(); });
}
function rendreAFaire(l, items) {
  var dates = items.filter(function (x) { return x.d; });
  if (dates.length) {
    var js = dates.map(function (x) { return Math.max(0, joursDe(x.d)); }), max = Math.max.apply(null, js.concat([7])), niv = {}, haut = 1;
    var frise = h('div', { class: 'p4-temps', 'data-booster': 'ligne-de-temps' }, h('span', { class: 'axe' }), h('span', { class: 'auj' }));
    var fins = [];
    dates.forEach(function (x, i) {
      /* une bulle ne chevauche jamais sa voisine : elle monte d'un étage si la place est prise */
      var pc = 6 + js[i] / max * 86, lv = 0; while (fins[lv] != null && pc - fins[lv] < 11) lv++; fins[lv] = pc; lv++; haut = Math.max(haut, lv);
      frise.appendChild(h('button', { type: 'button', class: 'pt' + (joursDe(x.d) < 0 ? ' passe' : ''), style: 'left:' + pc + '%;bottom:' + (40 + (lv - 1) * 40) + 'px',
        'aria-label': x.t + ', ' + dateCourte(x.d), title: x.t, onclick: function () { ouvrir(x.c.id); } }, emojiDe(x.c)));
    });
    frise.style.height = (84 + (haut - 1) * 40) + 'px';
    var m0 = new Date(); m0 = new Date(m0.getFullYear(), m0.getMonth() + 1, 1, 12);
    while (joursDe(m0) < max) { var pm = 6 + joursDe(m0) / max * 86; if (pm > 15 && pm < 80) { frise.appendChild(h('span', { class: 'tic', style: 'left:' + pm + '%' })); frise.appendChild(h('span', { class: 'lb m', style: 'left:' + pm + '%' }, MOIS[m0.getMonth()])); } m0 = new Date(m0.getFullYear(), m0.getMonth() + 1, 1, 12); }
    frise.appendChild(h('span', { class: 'lb', style: 'left:3%' }, 'auj.'));
    frise.appendChild(h('span', { class: 'lb', style: 'right:3%' }, dateCourte(dates[dates.length - 1].d)));
    l.appendChild(frise);
  }
  var dec = decisions();
  if (dec.length) {
    l.appendChild(h('div', { class: 'p4-grp' }, '⚖️ Une décision t’attend'));
    dec.forEach(function (c) {
      var r = c.org.rep, ops = decidable(r), tq = r.tache && r.tache.quand;
      l.appendChild(h('div', { class: 'p4-deci' },
        h('button', { type: 'button', class: 'q', onclick: function () { ouvrir(c.id); } }, emojiDe(c), ' ', titreCourt(c), tq ? h('small', null, '⏳ ' + tq) : null),
        h('div', { class: 'duo' }, ops.map(function (op, i) {
          return h('button', { type: 'button', 'data-booster': 'decider-ici', onclick: function () { retenirIci(c, i); } }, (op.emoji ? op.emoji + ' ' : '') + op.cout);
        }))));
    });
  }
  if (!items.length && !dec.length) { l.appendChild(h('p', { class: 'm4b-vide' }, 'Rien à faire pour l’instant.')); return; }
  var a = new Date(); a.setHours(0, 0, 0, 0); var dim = new Date(+a + ((7 - a.getDay()) % 7) * 864e5 + 864e5 - 1);
  var grp = { semaine: [], bientot: [], sans: [] };
  items.forEach(function (x) { (x.d ? (x.d <= dim ? grp.semaine : grp.bientot) : grp.sans).push(x); });
  [['semaine', 'Cette semaine'], ['bientot', 'Bientôt'], ['sans', 'Sans date']].forEach(function (gg) {
    if (!grp[gg[0]].length) return;
    l.appendChild(h('div', { class: 'p4-grp' }, gg[1]));
    grp[gg[0]].forEach(function (x) {
      var n = x.d ? joursDe(x.d) : null;
      l.appendChild(h('div', { class: 'p4-afr' },
        h('button', { type: 'button', class: 'case', 'aria-label': 'Cocher ' + x.t, onclick: function () { cocherIci(x); } }, h('i')),
        h('button', { type: 'button', class: 't', onclick: function () { ouvrir(x.c.id); } }, h('b', null, (x.ic && x.ic.length <= 4 ? x.ic + ' ' : '') + x.t), h('small', null, emojiDe(x.c) + ' ' + titreCourt(x.c))),
        x.d ? h('span', { class: 'd' + (n < 0 ? ' passe' : '') }, (x.approx ? '≈ ' : '') + dateCourte(x.d)) : (x.q ? h('span', { class: 'd' }, x.q) : null)));
    });
  });
}
