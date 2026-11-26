/* ====================================================================== amélioration du 26.11 (AMELIORER-JOUABLES.md, points 1 à 14)
   Les fonctions redéclarées ici remplacent celles du dessus (même portée : la dernière déclaration gagne). Moteur inchangé :
   Claude via sample, journal, liens/ et demandes/, lecture auto, Organisé par défaut, rien collé au pouce, noms réels. */
/* ---------- icônes au trait (1,75 px), jamais un emoji pour un objet */
var TRAITS = {
  goutte: 'M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z', eclair: 'M13 2 4 14h7l-1 8 9-12h-7l1-8z', flocon: 'M12 2v20M3.5 7l17 10M20.5 7l-17 10',
  bouteille: 'M10 2h4v4l2 3v12H8V9l2-3zM8 13h8', sac: 'M6 8h12l-1 13H7zM9 8V6a3 3 0 0 1 6 0v2', bouclier: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  cle: 'M14.7 6.3a4 4 0 0 0-5.4 5.1L3 17.7 6.3 21l6.3-6.3a4 4 0 0 0 5.1-5.4l-2.5 2.5-2.4-.6-.6-2.4z', tel: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  panier: 'M3 4h2l2.5 11h10L20 8H6.5M9 20h.01M17 20h.01', calendrier: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5', cloche: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4',
  lien: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1', photo: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7',
  micro: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4', flamme: 'M12 22a6 6 0 0 0 6-6c0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-3-2 2-3 4-3 7a6 6 0 0 0 6 6z',
  levure: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 10h.01M14 9h.01M12 14h.01M15.5 14.5h.01', houblon: 'M12 3c3 2 5 5 5 9s-2 7-5 9c-3-2-5-5-5-9s2-7 5-9zM7 10h10M7.5 15h9',
  boite: 'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10', doc: 'M6 3h9l4 4v14H6zM14 3v5h5', maison: 'M3 11l9-7 9 7M5 10v10h14V10', verre: 'M7 4h10l-1 16H8zM7 9h10',
  grille: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', finances: 'M3 7h18v12H3zM3 7l12-3v3M16 13h3', brassins: 'M6 4h9v16H6zM15 8h3v8h-3M9 8v8M12 8v8',
  stocks: 'M12 3.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM7 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM17 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  clients: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M18 14a6 6 0 0 1 4 7', relire: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  horloge: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2', crayon: 'M4 20h4L19 9l-4-4L4 16z', coche: 'M5 12l5 5 9-10', cible: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  chf: 'M3 7h18v10H3zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z', jauge: 'M4 18a8 8 0 1 1 16 0M12 18l4-6', sablier: 'M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9'
};
function tr(nom, taille) {
  var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
  var p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', TRAITS[nom] || TRAITS.doc); s.appendChild(p);
  var w = h('span', { class: 'a-i', style: taille ? '--is:' + taille + 'px' : null }); w.appendChild(s); return w;
}
var ICO_CAT = { Brassage: 'flamme', Fermentation: 'levure', Conditionnement: 'bouteille', 'Matières premières': 'houblon', Froid: 'flocon', Eau: 'goutte', 'Électricité': 'eclair', Rangement: 'boite',
  Brasserie: 'verre', Local: 'maison', Administratif: 'bouclier', 'Événements': 'calendrier' };
function icoCat(c) { var k = catDe(c); return ICO_CAT[k.sous] || ICO_CAT[k.nom] || 'doc'; }
/* l'image de l'objet (liens/<id>.image, https seulement) ; sinon l'icône au trait de sa catégorie */
function imageDe(lu, repli) {
  var b = h('span', { class: 'a-img' }), u = lu && typeof lu.image === 'string' && /^https:\/\//.test(lu.image) ? lu.image : null;
  if (u) { var im = h('img', { src: u, alt: '', loading: 'lazy', referrerpolicy: 'no-referrer', onerror: function () { b.textContent = ''; b.appendChild(tr(repli, 22)); } }); b.appendChild(im); }
  else b.appendChild(tr(repli, 22));
  return b;
}
/* ---------- dates : comptées depuis aujourd'hui, jour de la semaine juste, heure suisse */
var FMT_Z = new Intl.DateTimeFormat('fr-CH', { timeZone: 'Europe/Zurich', weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
function zP(d) { var o = {}; FMT_Z.formatToParts(new Date(d)).forEach(function (p) { o[p.type] = p.value; }); return o; }
function hm(d) { var p = zP(d); return p.hour + ':' + p.minute; }
function dateCourte(d) { var p = zP(d); return p.weekday.replace('.', '').slice(0, 2).toLowerCase() + ' ' + parseInt(p.day, 10) + '.' + parseInt(p.month, 10); }
function dateJ(d, approx) { return (approx ? '≈ ' : '') + texteJours(joursDe(d)) + ' · ' + dateCourte(d); }
function jour(iso) { return dateCourte(new Date(iso)); }
function quandCourt(q) { var d = new Date(q); return dateCourte(d) + ' ' + hm(d); }
function aLHeure(iso) { return memeJour(iso, Date.now()) ? 'à ' + hm(new Date(iso)) : 'le ' + quandCourt(iso); }
function texteJours(n) { return n === 0 ? 'aujourd’hui' : n === 1 ? 'demain' : n > 0 ? 'dans ' + n + ' j' : 'il y a ' + (-n) + ' j'; }

/* ---------- onglets de l'app et barres du pouce */
var ONGLETS = [['grille', 'Bord'], ['finances', 'Finances'], ['calendrier', 'Calendrier'], ['brassins', 'Brassins'], ['stocks', 'Stocks'], ['clients', 'Clients']];
Array.prototype.forEach.call(document.querySelectorAll('.a-onglets'), function (n) {
  ONGLETS.forEach(function (o) { var on = o[1] === 'Stocks'; n.appendChild(h('button', { type: 'button', class: on ? 'on' : '', 'aria-current': on ? 'page' : null, 'aria-disabled': on ? null : 'true', tabindex: on ? null : '-1' }, tr(o[0], 22), o[1])); });
});
$('a-logo').appendChild(tr('verre', 20));
$('t-notes').insertBefore(tr('crayon', 16), $('t-notes').firstChild);
$('l-photo').appendChild(tr('photo', 20));
/* la barre d'Organisé : [champ · photo · micro] ✦ + */
(function () {
  var rang = ajout.querySelector('.rang'), boite = h('div', { class: 'a-champ' });
  rang.insertBefore(boite, champ); boite.appendChild(champ); boite.appendChild(ics);
  rang.appendChild(h('button', { type: 'button', class: 'a-sg', id: 'a-sg', 'aria-label': 'Suggestions de l’IA pour ce carnet', 'data-booster': 'aide', onclick: function () { aide(); } }, '✦'));
  rang.appendChild(h('button', { type: 'button', class: 'a-plus', id: 'a-plus', 'aria-label': 'Ajouter', onclick: plus }, '+'));
})();
function rendreIcs() {
  ics.textContent = '';
  ics.appendChild(h('button', { type: 'button', class: 'm4b-o', 'aria-label': 'Photo', onclick: choisirPhoto }, tr('photo', 20)));
  ics.appendChild(h('button', { type: 'button', class: 'm4b-o' + (ecoute ? ' on' : ''), 'aria-label': ecoute ? 'Arrêter la dictée' : 'Dicter', onclick: function () { if (dictee) basculerDictee(); else toast('Dictée pas disponible sur cet appareil'); } }, tr('micro', 20)));
  var c = courant(); if (c && !pour) champ.placeholder = 'Écrire…';
  var sg = $('a-sg'); if (sg) { var en = c && c.aide && c.aide.enCours; sg.setAttribute('aria-busy', en ? 'true' : 'false'); }
}
function majAjout() { /* le champ garde photo et micro ; + envoie s'il y a du texte */ }
/* + : texte → ajouté à Mes notes ; vide → ce qu'on ajoute (piste, option, à faire, caractéristique, lien) */
function plus() {
  if (champ.value.trim()) { envoyerAjout(); return; }
  var c = courant(); if (!c) return;
  var r = c.org && c.org.rep, L = [['piste', 'Piste', 'cible'], ['option', 'Option', 'cle'], ['tache', 'À faire', 'coche']];
  if (r && r.comparaison) L.push(['note', 'Caractéristique', 'jauge'], ['note', 'Offre', 'panier']);
  ouvrirFeuille([h('h2', null, 'Ajouter à ' + titreCourt(c)),
    L.map(function (x) { return h('button', { type: 'button', class: 'a-fs', onclick: function () { fermerFeuille(); viser(x[0], x[1]); } }, h('span', null, h('b', null, x[1])), tr(x[2], 20)); }),
    h('button', { type: 'button', class: 'a-fs', onclick: function () { fermerFeuille(); collerLien(); } }, h('span', null, h('b', null, 'Coller un lien'), h('small', null, 'l’objet, son prix et son image')), tr('lien', 20))]);
}
/* liste : champ (un nouveau carnet), ✦, + */
$('l-sugg').addEventListener('click', feuilleSuggListe);
$('l-photo').addEventListener('click', function () { var c = nouveauCarnet('', [''], null); etat.carnets.push(c); sauver(); geste('nouveau carnet photo', c.id); ouvrir(c.id); choisirPhoto(); });
/* ✦ de la liste : ce que l'IA a déjà proposé, carnet par carnet (aucun appel neuf) */
function feuilleSuggListe() {
  var L = [];
  etat.carnets.forEach(function (c) {
    if (c.orgErreur && !c.org) L.push({ c: c, t: 'Pas lu par l’IA', x: 'Relire' });
    else if (c.org) {
      var tv = c.etat !== 'resolu' ? tacheVive(c) : null, p = prochaine(c);
      if (tv && !c.org.tacheFaite) L.push({ c: c, t: [tv.titre !== titreCourt(c) ? tv.titre : null, p ? dateJ(p.d, p.approx) : null].filter(Boolean).join(' · '), x: p ? (p.n < 0 ? 'retard' : p.n + ' j') : '›', n: p ? p.n : 999 });
    }
  });
  L.sort(function (a, b) { return (a.n == null ? -1 : a.n) - (b.n == null ? -1 : b.n); });
  geste('suggestions de la liste', String(L.length));
  ouvrirFeuille([h('h2', null, '✦ Prochaines actions'), h('div', { class: 'sous' }, L.length + ' carnets · la plus proche d’abord · d’après tes notes'),
    L.slice(0, 12).map(function (x) {
      return h('button', { type: 'button', class: 'a-fs', onclick: function () { fermerFeuille(); ouvrir(x.c.id); if (x.x === 'Relire') ranger(); } },
        h('span', null, h('b', null, titreCourt(x.c)), x.t ? h('small', null, x.t) : null), h('span', { class: 'x' }, x.x));
    })]);
}

/* ---------- liste : arbre compact catégorie › sous-catégorie, une ligne par carnet (plus de 12 visibles à 390 × 844) */
function cleDe(c) {
  var r = c.org && c.org.rep; if (!r) return null;
  var d = decidable(r);
  if (d && !retenus(c.org).length) { var vs = d.map(function (x) { return nb(x.cout); }); return { l: d.length + ' options', t: milliers(Math.min.apply(null, vs)) + '–' + milliers(Math.max.apply(null, vs)) + ' CHF' }; }
  var p = prochaine(c);
  if (c.etat !== 'resolu' && p && p.n >= -30 && p.n <= 45) return { j: p.n < 0 ? 'retard ' + (-p.n) + ' j' : p.n === 0 ? 'aujourd’hui' : 'dans ' + p.n + ' j', t: (p.approx ? '≈ ' : '') + dateCourte(p.d), date: true, retard: p.n < 0 };
  if (r.comparaison) { var M = modele(c, r), k = M.kT >= 0 ? M.kT : M.crit, w = M.gagne(k); if (w) return { l: 'moins cher', t: w.a.nom }; return { l: 'à comparer', t: M.actifs.length + ' offres' }; }
  if (r.chiffres && r.chiffres[0]) { var x = r.chiffres[0]; return { l: labChiffre(x).l, t: (x.estime ? '≈ ' : '') + j1Virg(x.valeur), est: !!x.estime }; }
  var es = r.options.filter(function (o) { return o.estime && nb(o.cout) != null; })[0];
  if (es) return { l: 'estimé', t: '≈ ' + es.cout.replace(/\s*\?$/, ''), est: true };
  if (p) return { l: p.n < 0 ? 'passé' : 'prévu', t: (p.approx ? '≈ ' : '') + dateCourte(p.d), date: true };
  return null;
}
function prochaine(c) {
  var o = c.org, r = o && o.rep; if (!r) return null; var best = null, q = [];
  if (r.echeance) q.push(r.echeance.quand);
  if (r.tache && r.tache.quand && !o.tacheFaite && o.garde.tache !== false) q.push(r.tache.quand);
  q.forEach(function (x) { var d = lireDate(x, c.maj); if (d && (!best || d.d < best.d)) best = d; });
  return best ? { n: joursDe(best.d), d: best.d, txt: dateCourte(best.d), approx: !!best.approx } : null;
}
function rendreArbre(l) {
  var cats = {}, vis = etat.carnets.filter(function (c) { return !filtreEtat || c.etat === filtreEtat; });
  if (!vis.length) { l.appendChild(h('p', { class: 'm4b-vide' }, 'Aucun carnet dans cet état.')); return; }
  vis.forEach(function (c) { var k = catDe(c); (cats[k.nom] = cats[k.nom] || []).push(c); });
  Object.keys(cats).sort(function (a, b) { return ordreCat(a) - ordreCat(b) || a.localeCompare(b, 'fr'); }).forEach(function (nom) {
    var tous = cats[nom], kc = 'c:' + nom, rc = replie(kc, false), kr = 'r:' + nom;
    var res = tous.filter(function (c) { return c.etat === 'resolu'; }), rr = filtreEtat === 'resolu' ? false : replie(kr, true);
    l.appendChild(h('div', { class: 'a-cat p4-dn', 'data-cat': nom },
      h('button', { type: 'button', class: 'pli', 'aria-expanded': String(!rc), onclick: function () { replier(kc, false); } },
        h('span', { class: 'ch' }, rc ? '▸' : '▾'), tr(ICO_CAT[nom] || 'doc', 18), h('span', null, nom === SANS ? 'À ranger' : nom), h('span', { class: 'n' }, String(tous.length))),
      res.length && filtreEtat !== 'resolu' ? h('button', { type: 'button', class: 'res', 'aria-expanded': String(!rr), 'aria-label': res.length + ' résolus', onclick: function () { replier(kr, true); } }, '✓ ' + res.length + ' résolu' + (res.length > 1 ? 's' : '') + (rr ? ' ▸' : ' ▾')) : null));
    if (rc) return;
    var L = tous.filter(function (c) { return c.etat !== 'resolu' || !rr; }).sort(function (a, b) {
      return (a.etat === 'resolu') - (b.etat === 'resolu') || (catDe(a).sous ? ordreSous(nom, catDe(a).sous) : -1) - (catDe(b).sous ? ordreSous(nom, catDe(b).sous) : -1) || String(catDe(a).sous || '').localeCompare(String(catDe(b).sous || ''), 'fr') || RANGP[prioDe(a)] - RANGP[prioDe(b)] || rangDe(a) - rangDe(b);
    });
    var prec = null;
    L.forEach(function (c) {
      var s = c.etat === 'resolu' ? '✓ résolu' : (catDe(c).sous || ''), ks = 's:' + nom + ':' + s, premier = s !== prec; prec = s;
      if (s && s !== '✓ résolu' && replie(ks, false)) { if (premier) l.appendChild(ligneSousRepliee(nom, s, L.filter(function (x) { return x.etat !== 'resolu' && (catDe(x).sous || '') === s; }).length, ks)); return; }
      l.appendChild(ligneCarnet(c, premier ? s : '', ks));
    });
  });
}
function ligneSousRepliee(nom, s, n, ks) {
  return h('div', { class: 'a-r pli-ss' }, h('span', { class: 'ss' }, h('button', { type: 'button', 'aria-expanded': 'false', 'data-sous': s, onclick: function (e) { e.stopPropagation(); replier(ks, false); } }, s + ' ▸')),
    h('span', { class: 'ti' }, h('span', null, n + ' carnet' + (n > 1 ? 's' : '') + ' replié' + (n > 1 ? 's' : ''))), h('span'));
}
function ligneCarnet(c, sous, ks) {
  var lit = estEnLecture(c), k = !lit && cleDe(c), res = c.etat === 'resolu';
  var row = h('div', { class: 'a-r p4-r' + (res ? ' res' : ''), 'data-id': c.id, role: 'button', tabindex: '0', 'aria-label': titreCourt(c) + ' · ' + (NOM_ETAT[c.etat] || 'Noté') + (prioDe(c) === 'haute' ? ' · prioritaire' : '') },
    h('span', { class: 'ss' + (sous ? '' : ' vide') }, sous && sous !== '✓ résolu' ? h('button', { type: 'button', 'aria-expanded': 'true', 'data-sous': sous, 'aria-label': 'Replier ' + sous, onclick: function (e) { e.stopPropagation(); replier(ks, false); } }, sous) : sous),
    h('span', { class: 'ti', style: '--c:' + COUL_ETAT[c.etat] }, h('span', { class: 'ic', title: NOM_ETAT[c.etat] }, tr(icoCat(c), 16)), h('span', { class: 'tt' }, titreCourt(c)), c.orgNeuf ? h('i', { class: 'neuf', title: 'Organisé a du neuf' }) : null),
    lit ? h('span', { class: 'k lit' }, h('small', null, 'l’IA'), h('span', null, 'lit…'))
      : k ? h('span', { class: 'k' + (k.date ? ' date' : '') + (k.retard ? ' retard' : '') + (k.est ? ' est' : '') }, k.j ? h('b', null, k.j) : k.l ? h('small', null, k.l) : null, h('span', null, k.t))
      : h('span', { class: 'k' }, h('span', null, NOM_ETAT[c.etat])));
  brancherGlisse(row, c);
  return row;
}

/* ---------- carnet : en-tête utile ; Mes notes | Organisé ; l'heure de lecture et les changements derrière ✦ */
$('a-chg').addEventListener('click', function () { if (courant() && courant().org) feuilleChangements(); else ranger(); });
function majTete(c) {
  var k = catDe(c), cc = $('a-catc'); cc.textContent = '';
  cc.appendChild(tr(icoCat(c), 14)); cc.appendChild(h('span', null, k.nom === SANS ? 'À ranger' : (k.sous ? k.nom + ' › ' + k.sous : k.nom)));
  var n = lignesDe(c).filter(function (x) { return x.trim(); }).length; $('a-nl').textContent = n ? String(n) : '';
  var P = c.org ? aGarder(c).length : 0, t = $('a-chg-t'); t.textContent = '';
  if (c.org) t.appendChild(document.createTextNode(P ? '✦ ' + P + ' à garder' : '✦ lu ' + (memeJour(c.org.quand, Date.now()) ? hm(new Date(c.org.quand)) : dateCourte(new Date(c.org.quand)).slice(3))));
  else t.appendChild(document.createTextNode(estEnLecture(c) ? '✦ lit…' : '✦ Ranger'));
  $('a-chg').setAttribute('aria-label', c.org ? 'Lu par l’IA ' + quandCourt(c.org.quand) + (P ? ' · ' + P + ' changements à garder ou refuser' : '') + ' · Changé par l’IA' : 'Ranger avec l’IA');
}
function basculer(v, sansFocus) {
  if (v !== vue) tuerToast();
  var c = courant(); fermerFlottants();
  if (vue === 'org') defilOrg = $('defil').scrollTop;
  vue = v;
  $('v-carnet').setAttribute('data-vue', v);
  $('t-notes').classList.toggle('on', v === 'notes'); $('t-org').classList.toggle('on', v === 'org');
  $('t-notes').setAttribute('aria-selected', String(v === 'notes')); $('t-org').setAttribute('aria-selected', String(v === 'org'));
  $('p-notes').hidden = v !== 'notes'; $('p-org').hidden = v !== 'org';
  $('outils').hidden = v !== 'notes'; $('pied-org').hidden = v !== 'org';
  $('tete-titre').textContent = titreCourt(c);
  majTete(c);
  if (v === 'org') {
    $('doc').blur(); $('titre').blur();
    if (c.orgNeuf) { c.orgNeuf = false; sauver(); }
    rendreOrg(); rendreIcs(); $('defil').scrollTop = 0;
  } else { $('action').hidden = true; rendreMeta(); calcLectures(); $('defil').scrollTop = 0; }
  $('app').style.setProperty('--tb', v === 'org' ? '190px' : '130px'); $('app').style.setProperty('--rb', v === 'org' ? '180px' : '124px');
  rendrePoint(); rendreOutils();
}
/* ⋯ : Ranger dans…, Changé par l'IA, Relire, Escalader à l'IA, Poser une question */
function menuCarnet() {
  var c = courant(); if (!c) return;
  var k = catDe(c), ligneM = function (ic, titre, sous, f) {
    return h('button', { type: 'button', class: 'm4b-mi', onclick: function () { fermerFeuille(); f(); } }, h('span', { class: 'p4-mi-e' }, ic), h('span', null, h('b', null, titre), sous ? h('small', null, sous) : null));
  };
  ouvrirFeuille([h('h2', null, titreCourt(c)),
    ligneM(tr('boite', 20), 'Ranger dans…', (k.nom === SANS ? 'pas encore rangé' : k.nom + (k.sous ? ' › ' + k.sous : '')), function () { feuilleRanger(c); }),
    c.org ? ligneM('✦', 'Changé par l’IA', 'une case par changement', feuilleChangements) : null,
    ligneM(tr('relire', 20), 'Relire avec l’IA', 'lit ta note, ne la change pas · ✦ 1 appel', function () { ranger(); if (vue === 'org') rendreOrg(); }),
    ligneM('✦', 'Escalader à l’IA', 'relecture par l’IA forte · ✦ 1 appel', function () { escalader(c); }),
    ligneM('💬', 'Poser une question', 'sur ce carnet · ✦ 1 appel', feuilleDemander)]);
}

/* ---------- Escalader : la lecture du carnet repasse par l'IA forte (sample, modelTier "complex"), marquée « IA forte » */
var FORTE = {};
capSample = capSample.then(function (s) {
  if (!s || typeof s.json !== 'function') return s;
  return { json: function (prompt, opts) {
    var o = opts ? Object.assign({}, opts) : {};
    var cF = null, cl = lecture && !/^Tu (aides|proposes)/.test(prompt) ? parId(lecture.carnetId) : null;
    if (cl && FORTE[lecture.carnetId]) { o.modelTier = 'complex'; cl.forteLe = new Date().toISOString(); cF = cl; delete FORTE[lecture.carnetId]; } else if (cl) cl.forteOk = false;
    return Promise.resolve(s.json(prompt, o)).then(function (res) { if (cF) { cF.forteOk = true; sauver(); } return res; });
  } };
});
function escalader(c) {
  FORTE[c.id] = 1; geste('escalader à l’IA', titreDe(c));
  if (courant() === c) ranger(); else enFile(c);
  toast('✦ Relu par l’IA forte · 1 appel');
}
function forte(c) { return !!(c.org && c.forteOk); }
/* ---------- liens : Relire (demandes/<id>, type "relire") et Escalader (type "escalader", IA forte) ; l'image de l'objet */
function demandeLien(c, l, type) {
  c.liensDem = c.liensDem || {}; c.liensDem[l.id] = { type: type, le: new Date().toISOString() }; sauver();
  geste(type === 'escalader' ? 'escalader un lien' : 'relire un lien', l.url);
  capDb.then(function (db) {
    if (!db) return;
    try { Promise.resolve(db.collection('demandes').doc(l.id).set({ url: l.url, carnet: titreDe(c), quand: c.liensDem[l.id].le, type: type })).catch(function () {}); } catch (e) {}
  });
  if (type === 'escalader') FORTE[c.id] = 1;
  if (courant() === c) { if (vueCmp) rendreCmp(); else rendreOrg(); }
  toast(type === 'escalader' ? '🔗 Relu par l’IA forte · la case se remplira seule' : '🔗 En lecture · la case se remplira seule');
}
function lienEnLecture(c, l) {
  var d = c.liensDem && c.liensDem[l.id];
  if (!l.lu) return d || { type: 'relire' };
  return d && !(l.lu.lu && Date.parse(l.lu.lu) >= Date.parse(d.le)) ? d : null;
}
function liensBloc(c) {
  var L = liensDe(c); if (!L.length) return;
  org.appendChild(h('div', { class: 'a-sec' }, h('h3', null, 'Liens · ' + L.length)));
  L.forEach(function (l) { org.appendChild(ligneLien(c, l)); });
}
function ligneLien(c, l) {
  var att = lienEnLecture(c, l), x = l.lu, px = prixTxt(x);
  return h('div', { class: 'a-lien' }, imageDe(x, icoCat(c)),
    h('button', { type: 'button', class: 'tx', onclick: vers(l.ligne, null, 'lien') }, h('b', null, txtL(x && x.titre, 90) || hoteDe(l.url)),
      att ? h('small', { class: 'att' }, tr('lien', 13), ' en lecture' + (att.type === 'escalader' ? ' · IA forte' : '') + ' · l. ' + l.ligne)
        : h('small', { class: 'lu' }, px ? h('b', null, px + ' · ') : null, 'lu ' + jourLu(x.lu) + ' · ' + hoteDe(l.url) + ' · l. ' + l.ligne)),
    h('button', { type: 'button', class: 'a-plusl', 'aria-label': 'Lien ' + hoteDe(l.url) + ' : relire, escalader à l’IA', onclick: function () { menuLien(c, l); } }, '⋯'));
}
function lectureLigne(c) {
  var o = c.org; if (!o) return;
  org.appendChild(h('div', { class: 'a-lect' }, h('span', null, '✦ lu ' + quandCourt(o.quand), forte(c) ? h('b', { class: 'forte' }, ' · IA forte') : null),
    h('button', { type: 'button', class: 'a-act', onclick: function () { ranger(); rendreOrg(); } }, tr('relire', 16), 'Relire'),
    h('button', { type: 'button', class: 'a-act ia', onclick: function () { escalader(c); } }, '✦ Escalader')));
}

/* ---------- Organisé : cases utiles d'abord (état · depuis, dernier pas, coût, chiffres), puis pistes, options, comparaison */
function lignesNonVides() { var L = lignesDoc(), out = []; L.forEach(function (t, i) { if (t.trim()) out.push({ t: t.trim(), n: i + 1 }); }); return out; }
function exempleLigne(n, cit) { var L = lignesDoc(); if (n && /\(exemple\)/i.test(L[n - 1] || '')) return true; return !!cit && L.some(function (l) { return l.indexOf(cit) >= 0 && /\(exemple\)/i.test(l); }); }
function tuile(o) {
  return h('button', { type: 'button', class: 'a-tu' + (o.cls ? ' ' + o.cls : ''), onclick: o.f || null, 'aria-label': o.aria || null },
    h('span', { class: 'lab' }, o.ic ? tr(o.ic, 16) : null, o.lab), h('b', { class: 'v' + (o.long ? ' t' : '') }, o.v), o.s ? h('span', { class: 's' }, o.s) : null);
}
function tuiles(c, r) {
  var T = [], ord = ['note', 'cherche', 'decide', 'resolu'];
  var d0 = new Date(c.cree || c.maj), nj = -joursDe(d0);
  T.push(tuile({ cls: 'e-' + c.etat, ic: 'horloge', lab: NOM_ETAT[c.etat] || 'Noté', v: nj <= 0 ? 'auj.' : 'depuis ' + nj + ' j', s: dateCourte(d0) + ' · ' + hm(d0),
    aria: 'État ' + (NOM_ETAT[c.etat] || 'Noté') + ', toucher pour passer à ' + NOM_ETAT[ord[(ord.indexOf(c.etat) + 1) % 4]], f: function () { poserEtat(c, ord[(ord.indexOf(c.etat) + 1) % 4]); } }));
  var cit = []; (r.options || []).concat(r.chiffres || [], r.comparaison ? r.comparaison.articles : []).forEach(function (x) { if (x.ligne) cit.push(x.ligne); });
  var L = lignesNonVides(), L2 = L.filter(function (x) { return cit.indexOf(x.n) < 0; }), der = L2[L2.length - 1] || L[L.length - 1];
  if (der) { var tx = der.t.replace(/https:\/\/\S+/g, 'lien'); if (tx.length > 70) tx = tx.slice(0, 70).replace(/\s+\S*$/, '') + '…';
    T.push(tuile({ ic: 'crayon', lab: 'dernier pas', v: tx, long: true, s: 'l. ' + der.n + ' ›', f: vers(der.n, der.t.slice(0, 40), 'dernier pas') })); }
  var cs = (r.options || []).filter(function (o) { return nb(o.cout) != null; });
  if (cs.length && !r.comparaison && !decidable(r)) {
    var vs = cs.map(function (o) { return nb(o.cout); }), mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs), est = cs.some(function (o) { return o.estime || /\?\s*$/.test(o.cout); });
    var ln = cs[0].ligne, ex = cs.some(function (o) { return exempleLigne(o.ligne, o.citation); });
    var inc = (r.options || []).length - cs.length;
    T.push(tuile({ cls: est ? 'est' : '', ic: 'chf', lab: 'coût' + (est ? ' · estimé' : ''), v: (est ? '≈ ' : '') + (mn === mx ? milliers(mn) : milliers(mn) + '–' + milliers(mx)) + ' CHF',
      s: [ln ? 'l. ' + ln + ' ›' : null, ex ? h('span', { class: 'a-ex' }, 'exemple') : null, inc ? inc + ' sans prix' : null], f: vers(ln, cs[0].citation, 'coût') }));
  }
  if (!estSerie(r)) (r.chiffres || []).slice(0, 4).forEach(function (x) {
    var lc = labChiffre(x);
    T.push(tuile({ cls: x.estime ? 'est' : '', ic: x.estime ? 'jauge' : 'cible', lab: lc.l + (x.estime ? ' · estimé' : ''), v: (x.estime ? '≈ ' : '') + j1Virg(x.valeur), s: [lc.s || null, x.ligne ? 'l. ' + x.ligne + ' ›' : '✦ IA'].filter(Boolean).join(' · '), f: vers(x.ligne, x.valeur, lc.l) }));
  });
  org.appendChild(h('div', { class: 'a-tus' }, T.slice(0, 6)));
}
function estSerie(r) {
  var L = r.chiffres || []; var u = function (x) { return String(x.valeur).replace(/^[\s≈~]*\d[\d'’  ]*(?:[.,]\d+)?\s*/, ''); };
  return L.length >= 2 && u(L[0]) && L.every(function (x) { return !x.estime && nb(x.valeur) != null && u(x) === u(L[0]); });
}
function chiffresP4(c, r) {
  if (!estSerie(r)) return;
  var L = r.chiffres, vs = L.map(function (x) { return nb(x.valeur); }), mx = Math.max.apply(null, vs) || 1, H = Math.round(88 * (AMPLE || 1)), W = 300, n = vs.length;
  var X = function (i) { return W * (2 * i + 1) / (2 * n); }, Y = function (v) { return 12 + (1 - v / mx) * (H - 24); };
  /* « le 22 » après « le 15 nov. » : le mois se reporte, jamais une date sans mois */
  var mois = null, labs = L.map(function (x) { var t = String(x.label || ''), m = t.match(/\b\d{1,2}\s+([a-zéû]+\.?)\s*$/i); if (m && moisDe(m[1]) >= 0) mois = m[1]; else if (mois && /^le\s+\d{1,2}$/i.test(t)) t += ' ' + mois; return t; });
  var fig = h('div', { class: 'p4-courbe' + (vs[n - 1] < vs[0] ? ' baisse' : ''), 'data-booster': 'courbe' }), t = h('div', { class: 'trace', 'aria-hidden': 'true' });
  t.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="height:' + H + 'px"><line x1="0" x2="' + W + '" y1="' + (H - 12) + '" y2="' + (H - 12) + '"/><polyline points="' +
    vs.map(function (v, i) { return X(i) + ',' + Y(v); }).join(' ') + '"/>' + vs.map(function (v, i) { return '<circle cx="' + X(i) + '" cy="' + Y(v) + '" r="6"/>'; }).join('') + '</svg>';
  fig.appendChild(t);
  fig.appendChild(h('div', { class: 'pts', style: 'grid-template-columns:repeat(' + n + ',1fr)' }, L.map(function (x, i) {
    return h('button', { type: 'button', onclick: vers(x.ligne, x.valeur, labs[i] || x.valeur) }, h('b', null, j1Virg(x.valeur)), h('span', null, (labs[i] ? labs[i] + ' · ' : '') + 'l. ' + x.ligne));
  })));
  org.appendChild(fig);
}
function secTete(titre) { return h('div', { class: 'a-sec' }, h('h3', null, titre)); }
/* pistes : le chemin — trouvé (coche pleine), pas trouvé (« ? »), à vérifier (« ? » tireté), sa ligne au bout */
function jetons(c, r) {
  var miens = c.miens.filter(function (m) { return m.type === 'piste'; }), ps = r.pistes;
  if (!ps.length && !miens.length && (r.genre !== 'probleme' || r.relecture)) return;
  org.appendChild(secTete('Pistes · ' + (ps.length + miens.length), c, 'piste', 'Piste'));
  ps.forEach(function (p) {
    var st = p.statut === 'trouve' ? 'oui' : p.statut === 'pas_trouve' ? 'non' : 'q', mot = st === 'oui' ? 'trouvé' : st === 'non' ? 'pas trouvé' : 'à vérifier';
    org.appendChild(h('button', { type: 'button', class: 'a-ch ' + st, 'data-booster': 'jeton-piste', 'aria-label': p.texte + ' : ' + mot + ', ligne ' + p.ligne, onclick: vers(p.ligne, p.citation, p.texte) },
      h('span', { class: 'st' }, st === 'oui' ? '✓' : '?'), h('span', { class: 'n' }, p.texte), h('span', { class: 'p' }, mot), h('span', { class: 'a-l' }, 'l. ' + p.ligne + ' ›')));
  });
  miens.forEach(function (m) {
    org.appendChild(h('button', { type: 'button', class: 'a-ch q mien', onclick: m.ia ? null : function () { allerLigne(0, m.ligneTxt, m.texte); } },
      h('span', { class: 'st' }, m.ia ? '✦' : '?'), h('span', { class: 'n' }, m.texte), h('span', { class: 'p' }, m.ia ? '✦ IA' : 'ta piste'), h('span', { class: 'a-l' }, m.ia ? '' : 'ta ligne')));
  });
  suggestions(c, 'piste');
}
function icoOption(op) { var t = String((op.qui || '') + ' ' + (op.titre || '')).toLowerCase(); return /toi|moi-m|changer|réparer|reparer|joint/.test(t) ? 'cle' : op.attente || /appel|contact|sanitaire|entreprise|frigoriste|technicien/.test(t) ? 'tel' : /neuf|achet|command/.test(t) ? 'panier' : 'cible'; }
/* options : une ligne par option (nom réel, qui, sa ligne), la valeur à droite (≈ estimé, « prix ? »), retenir d'un toucher */
function faceAFace(c, r) {
  var o = c.org, ops = o.garde.options === false ? [] : r.options;
  var miens = c.miens.filter(function (m) { return m.type === 'option'; });
  if (!ops.length && !miens.length) return;
  var R = retenus(o);
  org.appendChild(secTete((r.genre === 'probleme' ? 'Pour régler · ' : 'Options · ') + (ops.length + miens.length), c, 'option', 'Option'));
  ops.forEach(function (op, i) {
    var ret = R.indexOf(i) >= 0, lv = valeurNotee(op), inc = !lv && (!op.cout || nb(op.cout) == null), est = !inc && !lv && (op.estime || /\?\s*$/.test(op.cout));
    var ex = exempleLigne(op.ligne, op.citation), q = quiDe(op);
    org.appendChild(h('div', { class: 'a-op' + (ret ? ' ret-on' : '') },
      h('span', { class: 'ic' }, tr(icoOption(op), 20)),
      h('button', { type: 'button', class: 'tx', onclick: vers(op.ligne, op.citation, op.titre) }, h('b', null, op.titre), h('small', null, [q, op.ligne ? 'l. ' + op.ligne + ' ›' : null, op.conseille ? '✦ conseillé' : !op.ligne ? '✦ IA' : null].filter(Boolean).join(' · '))),
      h('span', { class: 'val' }, lv ? h('b', null, lv) : inc ? h('button', { type: 'button', 'aria-label': 'prix inconnu, toucher pour le noter', onclick: function () { viser('note', 'prix ' + op.titre); } }, h('b', { class: 'inc' }, 'prix ?')) : h('b', { class: est ? 'est' : '' }, (est ? '≈ ' : '') + j1Virg(op.cout.replace(/\s*\?\s*$/, ''))),
        op.attente ? h('small', null, String(op.attente.citation).replace(/[.\s]+$/, '').toLowerCase()) : lv ? h('small', null, 'noté · l’IA relit') : est ? h('small', null, ex ? 'estimé · exemple' : 'estimé') : null),
      h('button', { type: 'button', class: 'ret' + (ret ? ' on' : ''), 'data-booster': 'retenir', 'aria-pressed': String(ret), 'aria-label': (ret ? 'Retenu : ' : 'Retenir ') + op.titre, onclick: function () { retenirAnnulable(i); } }, tr('coche', 18))));
  });
  miens.forEach(function (m) {
    org.appendChild(h('div', { class: 'a-op' + (m.retenu ? ' ret-on' : '') }, h('span', { class: 'ic' }, tr('crayon', 20)),
      h('span', { class: 'tx' }, h('b', null, m.texte), h('small', null, m.ia ? '✦ IA' : 'ta ligne')), h('span', { class: 'val' }, h('b', { class: 'inc' }, 'prix ?')),
      h('button', { type: 'button', class: 'ret' + (m.retenu ? ' on' : ''), 'aria-pressed': String(!!m.retenu), 'aria-label': (m.retenu ? 'Retenu : ' : 'Retenir ') + m.texte, onclick: function () { m.retenu = !m.retenu; sauver(); geste(m.retenu ? 'retenir une option' : 'ne plus retenir', m.texte); rendreOrg(); } }, tr('coche', 18))));
  });
  suggestions(c, 'option');
}
function compteARebours(c, r) {
  var e = r.echeance, dd = lireDate(e.quand, c.maj), n = dd ? joursDe(dd.d) : null;
  var bl = h('div', { class: 'p4-ech' + (n != null && n < 0 ? ' passe' : ''), 'data-booster': 'compte-a-rebours' },
    h('div', { class: 'haut' }, h('b', { class: 'j' }, n == null ? '?' : (dd.approx ? '≈ ' : '') + (n < 0 ? 'il y a ' + (-n) : n === 0 ? 'auj.' : 'dans ' + n) + (n ? ' j' : '')),
      h('span', { class: 't' }, (e.quoi ? e.quoi + ' · ' : '') + (dd ? dateCourte(dd.d) + '.' + zP(dd.d).year : e.quand))));
  if (n != null && n > 0) { var jr = h('div', { class: 'jours', 'aria-hidden': 'true' }), m = Math.min(n + 1, 46); for (var i = 0; i < m; i++) jr.appendChild(h('i')); bl.appendChild(jr); }
  bl.appendChild(h('div', { class: 'bouts' }, h('span', { 'aria-hidden': 'true' }), h('button', { type: 'button', class: 'p4-ligne', 'aria-label': 'ta ligne ' + e.ligne, onclick: vers(e.ligne, e.quand, e.quoi || 'Échéance') }, 'l. ' + e.ligne + ' ›')));
  org.appendChild(bl);
}

/* ---------- achat : modèle de la comparaison (calculs de l'app), résumé « qui gagne quoi » dans Organisé, vue Comparer dédiée */
function modele(c, r) {
  var o = c.org, cmp = r.comparaison; o.artRet = o.artRet || []; o.artEcart = o.artEcart || [];
  var douteux = function (t) { return t === '?' || /à relire/.test(t) || /\?\s*$/.test(t); };
  var kT = -1, kL = -1, kP = -1, kM = -1, liens = liensDe(c), LD = lignesDoc();
  cmp.criteres.forEach(function (cr, k) { if (/🧮|\bpour\s+\d|\btotal/i.test(cr)) kT = k; else if (/livraison|envoi|\bport\b/i.test(cr)) kL = k; else if (/minimum|\bmin\b/i.test(cr)) kM = k; else if (kP < 0 && /prix|💰|💶|co[uû]t|tarif/i.test(cr)) kP = k; });
  var besoin = kT >= 0 ? nb(cmp.criteres[kT].replace(/^\S+\s*/, '')) : null;
  var lab = function (k) { return cmp.criteres[k].replace(/^[^\p{L}\p{N}]+\s*/u, '') || cmp.criteres[k]; };
  /* un minimum de commande n'a pas de sens « meilleur » : il ne gagne jamais */
  var sens = function (k) { var t = cmp.criteres[k]; if (k === kM) return 0; return /α|alpha|arôme|origine|dispo/i.test(t) ? 0 : /cadence|bt\/h|capacit|volume|litres?\b/i.test(t) ? 1 : /prix|💰|💶|co[uû]t|🧮|total|pour \d|livraison|🚚|délai|ppb|o2|poids/i.test(t) ? -1 : 0; };
  var arts = cmp.articles.map(function (a, i) {
    var l = liens.filter(function (x) { return x.ligne === a.ligne; })[0] || null, ligne = (a.ligne && LD[a.ligne - 1]) || '';
    return { a: a, i: i, ecart: o.artEcart.indexOf(i) >= 0, ret: o.artRet.indexOf(i) >= 0, ex: /exemple/i.test(a.nom) || exempleLigne(a.ligne, a.citation), lien: l, eur: /€|\bEUR\b/.test(ligne) };
  });
  var court = function (x) { return besoin != null && x.a.valeurs.some(function (v) { var m = /^\s*≤\s*([\d'’  ]+)/.exec(v.texte); return m && nb(m[1]) < besoin; }); };
  arts.forEach(function (x) { x.pl = prixLien(x); x.court = court(x); x.sansLiv = kT >= 0 && kL >= 0 && douteux(x.a.valeurs[kL].texte); });
  var P = arts.map(function (x) { return x.pl; }).filter(Boolean);
  var uPl = !P.length ? null : P.every(function (p) { return p.cent != null; }) ? 'CHF / 100 g' : P[0].q ? 'CHF / ' + P[0].q + ' ' + P[0].u : 'CHF';
  var actifs = arts.filter(function (x) { return !x.ecart; });
  /* une plage (10–15 %) ne se classe pas ; « incluse » vaut 0 ; un prix lu sur le lien est ramené à la même quantité, en CHF */
  var val = function (x, k) {
    var t = x.a.valeurs[k].texte;
    if (k === kP && x.pl && (douteux(t) || !/\d/.test(t))) return x.pl.cent != null ? x.pl.cent : x.pl.chf;
    if (/inclus|gratuit|offert/i.test(t)) return 0;
    if (douteux(t) || /\d\s*[–-]\s*\d/.test(t)) return null; return nb(t);
  };
  /* le gagnant d'une ligne : le meilleur selon son sens, parmi les offres qui couvrent le besoin et ne sont pas des exemples ;
     un « ? » qui pourrait battre bloque ; un total sans livraison est une borne basse, jamais un gagnant ; seule à couvrir le besoin : elle gagne */
  var gagne = function (k) {
    var cand = actifs.filter(function (x) { return !x.court && !x.ex; }), s = sens(k);
    if (cand.length < 2) { var u = cand[0]; return u && k === kT && actifs.some(function (x) { return x.court; }) && val(u, k) != null && !(k === kT && u.sansLiv) ? u : null; }
    if (s && cand.every(function (x) { return val(x, k) != null; })) {
      var best = null; cand.forEach(function (x) { if (!best || s * (val(x, k) - val(best, k)) > 0) best = x; });
      if (k === kT && best.sansLiv) return null;
      return cand.every(function (x) { return x === best || val(x, k) !== val(best, k); }) ? best : null;
    }
    var g = cmp.gagnant && cmp.gagnant[k];
    return s !== 0 && g != null && cand.every(function (x) { return !douteux(x.a.valeurs[k].texte); }) ? cand.filter(function (x) { return x.i === g; })[0] || null : null;
  };
  var crit = o.critere != null && o.critere < cmp.criteres.length ? o.critere : kT >= 0 ? kT : (function () { for (var k = 0; k < cmp.criteres.length; k++) if (sens(k) && /prix|💰|💶|co[uû]t/i.test(cmp.criteres[k])) return k; for (k = 0; k < cmp.criteres.length; k++) if (sens(k)) return k; return 0; })();
  var parUnite = function (x) { var v = kT >= 0 ? val(x, kT) : null; return v != null && besoin ? v / besoin : null; };
  return { c: c, cmp: cmp, arts: arts, actifs: actifs, kT: kT, kL: kL, kP: kP, kM: kM, uPl: uPl, besoin: besoin, lab: lab, sens: sens, val: val, gagne: gagne, crit: crit, parUnite: parUnite, douteux: douteux };
}
function chf2(v) { return v.toFixed(2).replace('.', ','); }
function resumeCmp(c, r) {
  var M = modele(c, r), vu = 0, manque = 0, k0 = M.kT >= 0 ? M.kT : M.crit, rows = [], corps;
  M.actifs.forEach(function (x) { x.a.valeurs.forEach(function (v, k) { if (M.douteux(v.texte) && !(k === M.kP && x.pl)) manque++; else vu++; }); });
  M.arts.filter(function (x) { return x.ret; }).forEach(function (x) { rows.push(h('button', { type: 'button', class: 'a-gq', onclick: function () { ouvrirCmp(); } }, h('span', { class: 'c' }, 'choisi'), h('span', { class: 'w' }, '✓ ' + x.a.nom), h('span', { class: 'v' }))); });
  M.cmp.criteres.forEach(function (cr, k) {
    if (k === k0 || exclu(M, k)) return; var w = M.gagne(k); if (!w) return;
    var un = uniteCourte(M, k);
    rows.push(h('button', { type: 'button', class: 'a-gq', onclick: function () { ouvrirCmp(k); } }, h('span', { class: 'c' }, labC(M, k)), h('span', { class: 'w' }, w.a.nom), h('span', { class: 'v' }, aff(M, w, k).t, un ? h('small', null, ' ' + un) : null)));
  });
  if (!M.actifs.some(function (x) { return !x.court && M.val(x, k0) != null; })) {
    var dec = c.etat === 'decide' || c.etat === 'resolu', man = M.cmp.criteres.filter(function (cr, k) { return M.actifs.some(function (x) { return M.val(x, k) == null && M.sens(k); }); }).map(function (cr, k) { return cr.replace(/^[^\p{L}\p{N}]+\s*/u, '').toLowerCase(); });
    corps = [h('div', { class: 'a-gq' }, h('span', { class: 'c' }, dec ? 'décidé' : 'qui gagne'), h('span', { class: 'w' + (dec ? ' dec' : ' pas') }, dec ? (r.tache ? r.tache.titre : NOM_ETAT[c.etat]) : 'pas encore comparable'), h('span', { class: 'v' })),
      man.length ? h('p', { class: 'a-gqn' }, 'Pour comparer les offres, il manque : ' + man.join(', ') + '.') : null];
  } else corps = barresCrit(c, M, k0, true);
  org.appendChild(h('div', { class: 'a-qgq', 'data-booster': 'qui-gagne' }, h('div', { class: 'hd' }, h('span', null, 'Qui gagne quoi'), h('small', null, vu + (vu > 1 ? ' valeurs lues' : ' valeur lue') + (manque ? ' · ' + manque + (manque > 1 ? ' manquent' : ' manque') : ''))), corps, rows,
    h('button', { type: 'button', class: 'a-gocmp', 'data-booster': 'comparer', onclick: function () { ouvrirCmp(); } }, tr('jauge', 18), 'Comparer · ' + M.actifs.length + ' offres ›')));
}
/* la vue Comparer : barres du critère classées, Côte à côte (le meilleur en vert), Compromis, Écartés, toutes les caractéristiques */
var vueCmp = false;
function ouvrirCmp(k) {
  var c = courant(); if (!c || !c.org || !c.org.rep.comparaison) return;
  if (k != null) c.org.critere = k;
  vueCmp = true; tuerToast(); fermerFlottants();
  $('v-carnet').classList.remove('on'); $('v-cmp').classList.add('on'); $('cmp-pied').appendChild($('pied-org'));
  geste('comparer', titreDe(c)); rendreCmp(); $('cmp-defil').scrollTop = 0;
}
function fermerCmp() {
  vueCmp = false; tuerToast(); fermerFeuille();
  $('v-cmp').classList.remove('on'); $('v-carnet').classList.add('on'); $('v-carnet').insertBefore($('pied-org'), $('v-carnet').querySelector('.a-onglets'));
  rendreOrg();
}
$('cmp-retour').addEventListener('click', fermerCmp);
function rendreCmp() {
  var c = courant(), box = $('cmp-defil'); if (!c || !c.org || !vueCmp) return;
  var r = c.org.rep, M = modele(c, r), k0 = M.crit, y = box.scrollTop; box.textContent = '';
  $('cmp-titre').textContent = titreCourt(c);
  box.appendChild(h('h1', null, 'Comparer'));
  box.appendChild(h('div', { class: 'sous' }, M.actifs.length + ' offres · Classé par ', h('b', null, nomCrit(M, k0))));
  if (M.cmp.variete && M.cmp.variete.length) box.appendChild(h('div', { class: 'a-note', style: 'margin:-4px 0 10px' }, 'Commun à toutes : ' + M.cmp.variete.map(function (v) { return v.texte; }).join(' · ')));
  /* barres du critère (h04-7) : le 1er a la barre pleine, les suivants raccourcissent selon leur écart au meilleur */
  box.appendChild(barresCrit(c, M, k0, false));
  /* Côte à côte (v03-4) : la ligne du critère en tête et teintée, l'unité sous chaque libellé, le meilleur en vert ; lignes au-delà de 4 offres */
  var A = M.actifs.slice().sort(triCrit(M, k0)), W = M.cmp.criteres.map(function (cr, k) { return M.gagne(k); });
  var ordre = [k0].concat(M.cmp.criteres.map(function (cr, k) { return k; }).filter(function (k) { return k !== k0; }));
  var avecImg = A.some(function (x) { return x.lien && x.lien.lu && /^https:\/\//.test(x.lien.lu.image || ''); });
  box.appendChild(h('div', { class: 'a-h2' }, h('b', null, 'Côte à côte'), h('span', null, 'le meilleur en vert')));
  var classer = function (k) { return function () { c.org.critere = k; sauver(); geste('critère', labC(M, k)); rendreCmp(); }; };
  var cell = function (x, k) { var f = aff(M, x, k); return h('td', { class: (W[k] === x ? 'win' : f.cls || '') + (k === k0 ? ' crit' : '') }, h('span', { class: 'cv' }, f.t), f.s ? h('small', null, f.s) : null); };
  var offre = function (x) {
    return h('button', { type: 'button', class: 'a-off', 'aria-label': x.a.nom + ' : choisir, écarter, sa ligne', onclick: function () { feuilleOffre(c, M, x); } }, avecImg ? imageDe(x.lien && x.lien.lu, icoCat(c)) : null,
      h('span', { class: 'nm' }, x.a.nom.replace(/\./g, '.​')), x.ret ? h('span', { class: 'ok' }, '✓ choisi') : x.ex ? h('span', { class: 'ex' }, 'exemple') : null, h('span', { class: 'go' }, '›'));
  };
  var tab;
  if (A.length <= 4) {
    var colw = Math.floor(100 / (A.length + 1.2));
    tab = h('table', { class: 'a-tab' }, h('colgroup', null, h('col', { style: 'width:' + (100 - colw * A.length) + '%' }), A.map(function () { return h('col', { style: 'width:' + colw + '%' }); })),
      h('thead', null, h('tr', null, h('th'), A.map(function (x) { return h('th', null, offre(x)); }))),
      h('tbody', null, ordre.map(function (k) {
        var un = uniteDe(M, k);
        return h('tr', { class: k === k0 ? 'crit' : '' }, h('td', null, h('button', { type: 'button', 'aria-label': 'Classer par ' + nomCrit(M, k), onclick: classer(k) }, h('span', { class: 'lb' }, labC(M, k)), h('small', null, [un, k === k0 ? 'critère' : ''].filter(Boolean).join(' · ')))),
          A.map(function (x) { return cell(x, k); }));
      })));
  } else {
    tab = h('table', { class: 'a-tab rangs' }, h('colgroup', null, h('col', { style: 'width:31%' }), ordre.map(function () { return h('col', { style: 'width:' + (69 / ordre.length).toFixed(2) + '%' }); })),
      h('thead', null, h('tr', null, h('th', null, 'offre'), ordre.map(function (k) {
        return h('th', { class: k === k0 ? 'crit' : '' }, h('button', { type: 'button', 'aria-label': 'Classer par ' + nomCrit(M, k), onclick: classer(k) }, h('span', { class: 'lb' }, labC(M, k)), h('small', null, uniteCourte(M, k) + (k === k0 ? ' · critère' : ''))));
      }))),
      h('tbody', null, A.map(function (x) { return h('tr', null, h('td', null, offre(x)), ordre.map(function (k) { return cell(x, k); })); })));
  }
  box.appendChild(tab);
  /* + caractéristique, ✦ Proposer (v03-4) ; une proposition qui double une caractéristique déjà là (« Frais de port » ≈ « Livraison ») n'est pas montrée */
  var S = c.sugg && c.sugg.caracteristique, en = S && S.enCours;
  box.appendChild(h('div', { class: 'a-car' }, h('button', { type: 'button', onclick: function () { viser('note', 'Caractéristique'); } }, '+ Ajouter une caractéristique'),
    h('button', { type: 'button', class: 'ia', 'aria-busy': en ? 'true' : null, disabled: en ? true : null, onclick: function () { suggerer(c, 'caracteristique'); } }, en ? '✦ Cherche…' : '✦ Proposer')));
  var deja = M.cmp.criteres.map(groupeCar);
  (S && S.items || []).forEach(function (it, i) {
    if (deja.indexOf(groupeCar(it.texte)) >= 0) return;
    box.appendChild(h('div', { class: 'a-sgl' }, h('span', null, h('i', null, '✦ IA'), it.texte),
      h('button', { type: 'button', 'aria-label': 'Garder ' + it.texte, onclick: function () { S.items.splice(i, 1); ajouterLigne('À comparer : ' + it.texte); sauver(); geste('garder une caractéristique', it.texte); autoRanger(c); rendreCmp(); toast('Ajouté à Mes notes · l’IA relit'); } }, '✓'),
      h('button', { type: 'button', 'aria-label': 'Écarter ' + it.texte, onclick: function () { ecarterSugg(c, 'caracteristique', i); rendreCmp(); } }, '✕')));
  });
  box.appendChild(h('div', { class: 'a-comp' }, compromis(M)));
  var E = M.arts.filter(function (x) { return x.ecart; });
  box.appendChild(h('div', { class: 'a-h2' }, h('b', null, 'Écartés · ' + E.length), h('span', null, E.length ? 'et pourquoi' : 'toucher une offre pour l’écarter')));
  E.forEach(function (x) {
    var pq = (r.attention || []).filter(function (a) { return a.ligne === x.a.ligne; })[0];
    box.appendChild(h('div', { class: 'a-ec' }, h('span', null, h('b', null, x.a.nom), h('small', null, x.court ? 'ne couvre pas ' + M.besoin : pq ? '« ' + pq.citation + ' »' : 'écarté par toi')),
      h('button', { type: 'button', class: 'a-act', onclick: function () { ecarterArt(c, x.i); } }, 'Reprendre')));
  });
  var nl = M.arts.filter(function (x) { return x.a.valeurs.some(function (v) { return v.source === 'lien' || v.source === 'page'; }); }).length, conv = M.arts.some(function (x) { return x.pl && x.pl.conv; });
  box.appendChild(h('div', { class: 'a-note' }, [nl ? nl + ' lues sur leurs liens' : null, 'valeurs de tes notes', 'calculs de l’app', conv ? '€ → CHF au taux ≈ ' + chf2(TAUX_EUR) + ' (estimé)' : null, M.arts.some(function (x) { return x.ex; }) ? '« exemple » ne gagne jamais' : null].filter(Boolean).join(' · ')));
  box.scrollTop = y;
}
function vers2(c, n, cit, etiq) { return n ? function () { fermerCmp(); allerLigne(n, cit, etiq); } : null; }
function compromis(M) {
  var k0 = M.crit, w = M.gagne(k0), kp = M.kT >= 0 ? M.kT : M.kP, B = h('b', null, 'Compromis : '), un0 = uniteCourte(M, k0);
  var A = M.actifs.filter(function (x) { return !x.court && M.val(x, k0) != null; }).sort(triCrit(M, k0));
  if (!w) {
    var m = M.actifs.filter(function (x) { return !x.court && M.val(x, k0) == null; }).length;
    return [B, m ? 'pas encore · ' + m + ' valeur' + (m > 1 ? 's' : '') + ' de « ' + labC(M, k0) + ' » manque' + (m > 1 ? 'nt' : '') : 'aucune offre ne se détache'];
  }
  if (A.filter(function (x) { return !x.ex; }).length === 1 && M.actifs.some(function (x) { return x.court; })) return [B, 'aucun · ', h('b', null, w.a.nom), ' est la seule offre qui couvre ' + M.besoin + '.'];
  /* h04-7 : une offre moins bonne sur le critère, mais moins chère ; jamais une offre plus chère et pire */
  if (kp >= 0 && kp !== k0) {
    var pw = M.val(w, kp), auMoins = kp === M.kT && w.sansLiv;
    var C = pw == null ? [] : A.filter(function (x) { return x !== w && !x.ex && M.val(x, kp) != null && !(kp === M.kT && x.sansLiv) && M.val(x, kp) < pw; });
    if (C.length) {
      var x = C[0], dP = pw - M.val(x, kp), dC = Math.abs(M.val(x, k0) - M.val(w, k0));
      return [B, h('b', null, x.a.nom), ' (' + (A.indexOf(x) + 1) + 'e), ' + aff(M, x, k0).t + (un0 ? ' ' + un0 : '') + ' pour ' + aff(M, x, kp).t + ' CHF, soit ' + (auMoins ? 'au moins ' : '') + chiffre(dP) + ' CHF de moins que la 1re pour ' + chiffre(dC) + (un0 ? ' ' + un0 : '') + ' de ' + (M.sens(k0) < 0 ? 'plus' : 'moins') + '.'];
    }
    var prixManque = A.some(function (x) { return x !== w && !x.ex && M.val(x, kp) == null; });
    return [B, prixManque ? 'pas encore · un prix manque pour mettre « ' + labC(M, k0) + ' » en balance' : 'aucun · ', prixManque ? null : h('b', null, w.a.nom), prixManque ? '' : ' gagne « ' + nomCrit(M, k0) + ' » et ne coûte pas plus.'];
  }
  /* le critère est le prix : une offre meilleure ailleurs, pour un prix plus haut */
  var autres = [];
  M.cmp.criteres.forEach(function (cr, k) { if (k === k0 || exclu(M, k) || !M.sens(k)) return; var g = M.gagne(k); if (g && g !== w && M.val(g, k0) != null) autres.push({ k: k, g: g }); });
  if (autres.length) { var a = autres[0], uk = uniteCourte(M, a.k); return [B, h('b', null, a.g.a.nom), ', meilleur en « ' + labC(M, a.k) + ' » (' + aff(M, a.g, a.k).t + (uk ? ' ' + uk : '') + '), pour ' + chiffre(M.val(a.g, k0) - M.val(w, k0)) + (un0 ? ' ' + un0 : '') + ' de plus que ', h('b', null, w.a.nom), '.']; }
  var out = [B, 'aucun · ', h('b', null, w.a.nom), ' est le moins cher' + (M.kT >= 0 ? ' pour ' + M.besoin + ' livrées' : '') + '.'];
  var pu = M.kT >= 0 && M.kP >= 0 ? M.gagne(M.kP) : null;
  if (pu && pu !== w) { var mn = M.kM >= 0 ? pu.a.valeurs[M.kM].texte : '', ub = /bt/.test(uniteDe(M, M.kP)) ? 'à la bouteille' : 'à l’unité';
    out.push(' ', h('b', null, pu.a.nom), ' est moins cher ' + ub + ' (' + aff(M, pu, M.kP).t + ' CHF)' + (/^\s*≥/.test(mn) ? ', mais il faut en prendre ' + sansUnite(mn) + '.' : '.')); }
  return out;
}
function feuilleCritere(c, M) {
  ouvrirFeuille([h('h2', null, 'Classer par'), M.cmp.criteres.map(function (cr, k) {
    return h('button', { type: 'button', class: 'a-fs', onclick: function () { fermerFeuille(); c.org.critere = k; sauver(); geste('critère', labC(M, k)); rendreCmp(); } },
      h('span', null, h('b', null, nomCrit(M, k)), h('small', null, [uniteDe(M, k), M.sens(k) < 0 ? 'moins = mieux' : M.sens(k) > 0 ? 'plus = mieux' : 'sans meilleur'].filter(Boolean).join(' · '))), k === M.crit ? h('span', { class: 'x' }, 'critère') : h('span'));
  })]);
}
function feuilleOffre(c, M, x) {
  var resume = M.cmp.criteres.map(function (cr, k) { var f = aff(M, x, k), u = uniteCourte(M, k); return labC(M, k) + ' : ' + f.t + (u && f.t !== '?' ? ' ' + u : '') + (f.s ? ' (' + f.s + ')' : ''); }).join(' · ');
  ouvrirFeuille([h('h2', null, x.a.nom), h('div', { class: 'sous' }, [x.ex ? 'exemple · ne gagne jamais' : null, x.ret ? 'choisie' : null, resume].filter(Boolean).join(' · ')),
    h('div', { class: 'm4b-actions a-offa' }, bouton(x.ret ? 'Ne plus choisir' : 'Choisir', 'plein', function () { fermerFeuille(); choisirArt(c, x.i); }), bouton(x.ecart ? 'Reprendre' : 'Écarter', '', function () { fermerFeuille(); ecarterArt(c, x.i); }),
      x.a.ligne ? bouton('Sa ligne', '', function () { fermerFeuille(); fermerCmp(); allerLigne(x.a.ligne, x.a.citation, x.a.nom); }) : null)]);
}
/* ✦ Proposer : les suggestions de l'IA s'étendent aux caractéristiques à comparer */
NOM_BLOC.caracteristique = 'caractéristiques';
function dejaLa(c, bloc) {
  var r = c.org && c.org.rep, L = [];
  if (r) { if (bloc === 'piste') r.pistes.forEach(function (p) { L.push(motDe(p)); }); if (bloc === 'option') r.options.forEach(function (o) { L.push(o.titre); }); if (bloc === 'tache' && r.tache) L.push(r.tache.titre);
    if (bloc === 'caracteristique' && r.comparaison) r.comparaison.criteres.forEach(function (x) { L.push(x.replace(/^[^\p{L}\p{N}]+\s*/u, '')); }); }
  (c.miens || []).forEach(function (m) { if (m.type === bloc) L.push(m.texte); });
  ((c.sugg || {})[bloc] || { items: [] }).items.forEach(function (x) { L.push(x.texte); });
  return L.filter(Boolean);
}
function consigneSugg(c, lignes, bloc) {
  var QUOI = { piste: 'des pistes (causes possibles à vérifier)', option: 'des options (façons de régler ou de choisir, chacune nommée)', tache: 'des choses à faire (verbe d’abord)', caracteristique: 'des caractéristiques à comparer entre ces offres (ce qui compte pour un brasseur : délai, garantie, conditionnement, frais…)' }[bloc];
  return ['Tu proposes au brasseur (micro-brasserie en Suisse) ' + QUOI + ' pour ce carnet, pour ce bloc seulement.',
    'Réponds UNIQUEMENT par un objet JSON : {"suggestions":[{"emoji":string,"texte":string}]}',
    'Règles : 1 à 3 suggestions concrètes, utiles à un brasseur pro, tirées de ses notes et du métier. "texte" : le nom réel de la chose en 2 à 5 mots ; jamais « toi », jamais une question, aucune phrase.',
    '', 'Carnet : ' + titreDe(c), 'Ses notes, lignes numérotées :', lignes.map(function (l, i) { return (i + 1) + ': ' + l; }).join('\n'),
    'Déjà là (' + NOM_BLOC[bloc] + ') : ' + (dejaLa(c, bloc).join(' ; ') || 'rien'), 'Écarté par lui : ' + (c.refus.join(' ; ') || 'rien')].join('\n');
}

/* « le 15 » (du mois) : le prochain 15 après sa note */
function lireDate(s, ref) {
  s = String(s || '').toLowerCase(); var R = ref ? new Date(ref) : new Date(); R.setHours(12, 0, 0, 0); var m, re;
  function an(mo, j) { var d = new Date(R.getFullYear(), mo, j, 12); if (d - R < -120 * 864e5) d.setFullYear(d.getFullYear() + 1); return d; }
  if ((m = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/))) return { d: new Date(+m[3], +m[2] - 1, +m[1], 12) };
  re = /(\d{1,2})(?:er)?\s+([a-zéû]+)\.?(?:\s+(\d{4}))?/g;
  while ((m = re.exec(s))) if (moisDe(m[2]) >= 0) return { d: m[3] ? new Date(+m[3], moisDe(m[2]), +m[1], 12) : an(moisDe(m[2]), +m[1]) };
  if ((m = s.match(/mi-\s?([a-zéû]+)/)) && moisDe(m[1]) >= 0) return { d: an(moisDe(m[1]), 15), approx: true };
  if (/fin du mois/.test(s)) return { d: new Date(R.getFullYear(), R.getMonth() + 1, 0, 12), approx: true };
  if ((m = s.match(/dans (une|un|deux|trois|\d+) (semaine|jour)/))) { var k = { une: 1, un: 1, deux: 2, trois: 3 }[m[1]] || +m[1]; return { d: new Date(+R + k * (m[2] === 'semaine' ? 7 : 1) * 864e5), approx: true }; }
  /* « avant mars » : le dernier jour de février ; « fin mars » : le dernier jour de mars ; « en / début mars » : le 1er */
  re = /(avant|en|début|fin)\s+([a-zéû]+)/g;
  while ((m = re.exec(s))) if (moisDe(m[2]) >= 0) { var d1 = an(moisDe(m[2]), 1);
    return { d: m[1] === 'avant' ? new Date(d1.getFullYear(), d1.getMonth(), 0, 12) : m[1] === 'fin' ? new Date(d1.getFullYear(), d1.getMonth() + 1, 0, 12) : d1, approx: true }; }
  if ((m = s.match(/\ble\s+(\d{1,2})\b(?!\s*[.\/]\d)/)) && +m[1] >= 1 && +m[1] <= 31) { var d15 = new Date(R.getFullYear(), R.getMonth(), +m[1], 12); if (d15 < R) d15 = new Date(R.getFullYear(), R.getMonth() + 1, +m[1], 12); return { d: d15 }; }
  return null;
}
/* la prochaine action, sous le pouce : sa date comptée depuis aujourd'hui */
function actionTache(c, t) {
  var ech = c.org && c.org.rep.echeance, dq = t.quand && !(ech && ech.quand === t.quand) && lireDate(t.quand, c.maj);
  var sous = LOC.tache ? h('small', { class: 'prop' }, 'noté') : t.quand && !(ech && ech.quand === t.quand) ? h('small', null, dq ? dateJ(dq.d, dq.approx) : t.quand) : null;
  enAction(h('button', { type: 'button', class: 'p4-go' + (LOC.tache ? ' prop' : ''), 'data-booster': 'action', 'aria-label': t.titre + (LOC.tache ? ' : noté « ' + LOC.tache + ' », toucher pour confirmer' : ' : toucher quand c’est fait') },
    t.emoji ? h('span', { class: 'em' }, t.emoji) : null, h('span', { class: 'a-gt' }, h('b', null, t.titre, exempleTache(t) ? h('span', { class: 'a-ex' }, 'exemple') : null), sous), h('i', { class: 'case' })));
  zone.lastChild.addEventListener('click', function () { faireTache(c); });
}
function actionChoix(c, ch) {
  var o = c.org, dq = ch.quand && lireDate(ch.quand, c.maj);
  enAction(h('button', { type: 'button', class: 'p4-go', 'data-booster': 'action', 'aria-label': ch.titre + ' : toucher quand c’est fait', onclick: function () {
    var av = { f: o.choixFait, etat: c.etat, par: c.etatPar };
    o.choixFait = true;
    if (ch.sorte === 'article') { c.etat = 'resolu'; c.etatPar = { par: 'toi', le: new Date().toISOString() }; }
    sauver(); geste(ch.sorte === 'article' ? 'commander' : 'fait', ch.nom); rendreOrg(); rendreListe();
    toast((ch.sorte === 'article' ? 'Commandé : ' : 'Fait : ') + ch.nom, 'Annuler', function () { o.choixFait = av.f; c.etat = av.etat; c.etatPar = av.par; sauver(); rendreOrg(); rendreListe(); });
  } }, ch.emoji ? h('span', { class: 'em' }, ch.emoji) : null, h('span', { class: 'a-gt' }, h('b', null, ch.titre), ch.quand ? h('small', null, dq ? dateJ(dq.d, dq.approx) : ch.quand) : null), h('i', { class: 'case' })));
}

/* ---------- Organisé, assemblé */
function rendreOrg() {
  var d = $('defil'), poser = function (k) { AMPLE = k; org.classList.toggle('ample', !!k); if (k) org.style.setProperty('--k', k); else org.style.removeProperty('--k'); rendreOrg0(); };
  poser(false);
  if (vueCmp) { rendreCmp(); return; }
  if (vue !== 'org' || !courant() || org.hidden) return;
  var libre = d.clientHeight - org.offsetHeight; if (libre <= 110) return;
  var ks = [1.5, 1.3, 1.15].filter(function (k) { return k <= 1 + libre / 260 || k === 1.15; });
  for (var i = 0; i < ks.length; i++) { poser(ks[i]); if (d.scrollHeight <= d.clientHeight + 2) return; }
  poser(false);
}
function rendreOrg0() {
  var c = courant(); if (!c) return;
  c.miens = c.miens || []; org.textContent = ''; zone.textContent = ''; zone.hidden = true; LOC = lectureLocale(c);
  majTete(c);
  var enCours = estEnLecture(c), o = c.org, r = o && o.rep, nbl = lignesDoc().filter(function (l) { return l.trim(); }).length;
  if (enCours) org.appendChild(h('div', { class: 'm4b-lit m4b-lit-org', role: 'status', style: 'margin:0 0 10px' }, h('span', null, ico('b-ia'), (lecture && lecture.carnetId === c.id ? 'L’IA lit ta note' : 'L’IA lira ta note juste après') + (FORTE[c.id] || (c.forteLe && (!o || Date.parse(c.forteLe) > Date.parse(o.quand))) ? ' · IA forte' : '') + '…'), h('span', { class: 'bar' }, h('i'))));
  var horsLigne = !navigator.onLine || c.attente;
  if (horsLigne && !enCours) org.appendChild(bandeau('hors', '📴', 'Hors ligne', (c.attente ? '1 note en file · ' : '') + (o ? 'lu ' + quandCourt(o.quand) + ' · ' : '') + 'l’IA relira au retour du réseau'));
  else if (c.orgErreur && !enCours) {
    org.appendChild(bandeau('bad', '⚠️', 'L’IA n’a pas pu lire', nbl + ' lignes gardées')); org.lastChild.title = c.orgErreur.message;
    org.appendChild(h('div', { class: 'a-acts', style: 'margin:-4px 0 10px' }, h('button', { type: 'button', class: 'a-act ia', onclick: function () { escalader(c); } }, '✦ Escalader à l’IA forte')));
  }
  if (!o) {
    if (!enCours && (c.orgErreur || horsLigne)) {
      ecranSansIA(c);
      if (horsLigne) enAction(h('button', { type: 'button', class: 'p4-go', onclick: function () { basculer('notes'); placerFin(); } }, h('span', { class: 'em' }, tr('crayon', 18)), h('b', null, 'Noter')));
      else enAction(h('button', { type: 'button', class: 'p4-go', 'data-booster': 'reessayer', onclick: function () { ranger(); } }, h('span', { class: 'em' }, tr('relire', 18)), h('b', null, 'Réessayer')));
    } else if (!enCours) {
      org.appendChild(h('p', { class: 'm4b-vide' }, 'Pas encore rangé. L’IA lit ta note et la range ici ; elle ne change pas une lettre de ton texte.'));
      enAction(h('button', { type: 'button', class: 'p4-go', onclick: function () { ranger(); } }, h('span', { class: 'em' }, '✦'), h('b', null, 'Ranger avec l’IA')));
    }
    liensBloc(c); feuilleAide(c); return;
  }
  if (!horsLigne && new Date(c.maj) > new Date(o.quand) && !enCours && c.html !== '' && lignesDoc().join('\n') !== o.lignes.join('\n'))
    org.appendChild(h('div', { class: 'p4-k' }, 'Ta note a changé depuis.', h('button', { type: 'button', class: 'm4b-btn doux', onclick: ranger }, '↻ Relire')));
  if ((r.resolu || r.etatPropose === 'resolu') && o.garde.resolu === undefined && c.etat !== 'resolu') {
    org.appendChild(h('div', { class: 'm4b-carte prop' }, h('h3', null, '✦ ' + (r.resolu ? r.resolu.question : 'Résolu ?')),
      h('div', { class: 'm4b-actions' }, bouton('Pas encore', '', function () { refuser('resolu'); }), bouton('Résolu', '', function () { garder('resolu'); }, 'b-coche'))));
  }
  tuiles(c, r);
  if (r.echeance) compteARebours(c, r);
  if (r.periode) periode(c, r);
  var lignesArt = r.comparaison ? r.comparaison.articles.map(function (a) { return a.ligne; }) : [];
  (r.attention || []).filter(function (a) { return lignesArt.indexOf(a.ligne) < 0 && !ligneCassee(a.citation); }).forEach(function (a) {
    org.appendChild(h('button', { type: 'button', class: 'p4-att', onclick: vers(a.ligne, a.citation, a.texte) }, h('span', { class: 'em' }, a.emoji || '⚠️'), h('span', null, a.texte && a.texte.split(/\s+/).length <= 5 ? a.texte : '« ' + a.citation + ' »'), h('small', null, 'l. ' + a.ligne + ' ›')));
  });
  chiffresP4(c, r);
  if (r.comparaison) resumeCmp(c, r);
  jetons(c, r);
  if (r.relecture) relecture(c, r);
  var ops = decidable(r), zoneLibre = true, parDuo = false;
  if (ops && o.garde.options !== false) { zoneLibre = !decider(c, r, ops); parDuo = !zoneLibre; }
  else if (!r.comparaison) faceAFace(c, r);
  manques(c, r);
  if (r.conseil && !r.options.length && !r.comparaison && !r.relecture) org.appendChild(h('div', { class: 'p4-conseil' }, h('i', null, '✦'), h('span', null, r.conseil)));
  listeACocher(c, r);
  if (r.retenir && r.retenir.length) org.appendChild(h('div', { class: 'm4b-ret' }, h('h3', null, 'À retenir'), r.retenir.map(function (x) {
    return h('button', { type: 'button', onclick: vers(x.ligne, x.citation, x.texte) }, (x.emoji ? x.emoji + ' ' : '') + x.texte, h('span', { class: 'a-l' }, ' l. ' + x.ligne + ' ›'));
  })));
  var t = pouce(c, r, zoneLibre);
  sectionAFaire(c, parDuo ? null : t);
  liensBloc(c);
  if (!r.pistes.length && !r.options.length && !r.tache && !r.conseil && !r.comparaison && !r.echeance && !r.periode && !(r.liste || []).length && !(r.chiffres || []).length && !r.relecture && !c.miens.length)
    org.appendChild(h('p', { class: 'm4b-vide' }, 'L’IA n’a rien trouvé à ranger dans cette note.'));
  lectureLigne(c);
  feuilleAide(c);
}
/* ====================================================================== correction du 26.11 (CRITIQUE-AMELIO, « À corriger » 1 à 14) */
TRAITS.alerte = 'M12 3 2 20h20zM12 10v4M12 17h.01'; TRAITS.thermo = 'M10 4a2 2 0 0 1 4 0v10a4 4 0 1 1-4 0zM12 9v7'; TRAITS.bulle = 'M4 5h16v11H9l-5 4z';
TRAITS.camion = 'M2 6h11v10H2zM13 9h5l3 4v3h-8M6 17a2 2 0 1 0 0 .01M17 17a2 2 0 1 0 0 .01'; TRAITS.horsligne = 'M2 8a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01M3 3l18 18';
TRAITS.point = 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'; TRAITS.nez = 'M12 4c-1 5-4 8-4 11a3 3 0 0 0 4 2.5A3 3 0 0 0 16 15c0-3-3-6-4-11z';
/* un emoji d'objet devient l'icône au trait de COMMUN.md (16 px), jamais dans Mes notes ni dans un champ */
var EMO = { '📞': 'tel', '☎': 'tel', '📱': 'tel', '🛒': 'panier', '🤝': 'clients', '👥': 'clients', '🗓': 'calendrier', '📅': 'calendrier', '📆': 'calendrier', '🔄': 'relire', '🔁': 'relire',
  '📜': 'doc', '📄': 'doc', '📋': 'doc', '📝': 'crayon', '✏': 'crayon', '🧰': 'cle', '🔧': 'cle', '🛠': 'cle', '🔩': 'cle', '📈': 'jauge', '📉': 'jauge', '📊': 'jauge', '🚰': 'goutte', '💧': 'goutte', '🧽': 'goutte',
  '⛺': 'maison', '🏠': 'maison', '🏭': 'maison', '🥤': 'verre', '🍺': 'verre', '🍻': 'verre', '🛢': 'boite', '📦': 'boite', '🗄': 'boite', '❄': 'flocon', '🧊': 'flocon', '⚠': 'alerte', '❗': 'alerte', '🚨': 'alerte',
  '🌡': 'thermo', '🔥': 'flamme', '♨': 'flamme', '⏳': 'sablier', '⌛': 'sablier', '🔗': 'lien', '💬': 'bulle', '📴': 'horsligne', '💰': 'chf', '💶': 'chf', '💵': 'chf', '🧮': 'chf', '🏷': 'chf', '🚚': 'camion',
  '🧪': 'levure', '🦠': 'levure', '🌾': 'houblon', '🌿': 'houblon', '🍃': 'houblon', '⚡': 'eclair', '🔌': 'eclair', '📷': 'photo', '📸': 'photo', '✅': 'coche', '☑': 'coche', '🕐': 'horloge', '⏰': 'horloge',
  '👃': 'nez', '🔍': 'cible', '🎯': 'cible', '🛡': 'bouclier', '🍾': 'bouteille', '🫙': 'bouteille', '💨': 'flamme' };
var RE_EMO = /\p{Extended_Pictographic}️?/gu;
function traits(root) {
  if (!root || (root.closest && root.closest('#p-notes,[contenteditable],input,textarea,svg'))) return;
  var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), L = [], n;
  while ((n = w.nextNode())) { RE_EMO.lastIndex = 0; if (RE_EMO.test(n.nodeValue) && !n.parentNode.closest('#p-notes,[contenteditable],textarea,svg')) L.push(n); }
  L.forEach(function (t) {
    var s = t.nodeValue, f = document.createDocumentFragment(), i = 0, m; RE_EMO.lastIndex = 0;
    while ((m = RE_EMO.exec(s))) { f.appendChild(document.createTextNode(s.slice(i, m.index))); var nm = (EMO[m[0].replace('️', '')]); if (nm) f.appendChild(tr(nm, 16)); i = m.index + m[0].length; }
    f.appendChild(document.createTextNode(s.slice(i))); if (t.parentNode) t.parentNode.replaceChild(f, t);
  });
}
new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) traits(n); else if (n.nodeType === 3 && n.parentNode) traits(n.parentNode); }); }); })
  .observe(document.body, { childList: true, subtree: true });
traits(document.body);
/* en-tête du carnet : le titre sur deux lignes au plus, la catégorie en dessous (texte, « Ranger dans… » est au ⋯) */
(function () {
  var tt = $('tete-titre'), cc = $('a-catc'), w = h('div', { class: 'a-tt' }), s = h('span', { class: 'a-catl', id: 'a-catc' });
  tt.parentNode.insertBefore(w, tt); w.appendChild(tt); cc.parentNode.removeChild(cc); w.appendChild(s);
  if (!document.documentElement.lang) document.documentElement.lang = 'fr';
  $('noter').placeholder = 'Nouveau carnet…';
  var ch = $('l-photo').parentNode;
  ch.appendChild(h('button', { type: 'button', class: 'a-ic', id: 'l-micro', 'aria-label': 'Dicter dans un nouveau carnet', onclick: function () {
    var c = nouveauCarnet('', [''], null); etat.carnets.push(c); sauver(); geste('nouveau carnet dicté', c.id); ouvrir(c.id); basculer('notes');
    if (dictee) basculerDictee(); else toast('Dictée pas disponible sur cet appareil'); } }, tr('micro', 20)));
  $('a-logo2').appendChild(tr('verre', 20));
})();
/* une feuille s'ouvre dans la vue affichée (Comparer compris : avant, elle s'ouvrait dans la liste cachée) */
function ouvrirFeuille(contenu) {
  fermerFeuille();
  var voile = h('div', { class: 'm4b-voile', onclick: fermerFeuille });
  var f = h('div', { class: 'm4b-feuille', role: 'dialog', 'aria-modal': 'true' }, h('div', { class: 'm4b-poig' }), contenu);
  var hote = document.querySelector('.vue.on') || $('v-liste');
  feuille = [voile, f]; hote.appendChild(voile); hote.appendChild(f);
  return f;
}
/* ⋯ d'un lien : Relire, Escalader, sa ligne (une seule paire visible par écran : celle de la lecture du carnet) */
function menuLien(c, l) {
  var att = lienEnLecture(c, l), mi = function (ic, titre, sous, f, dis) {
    return h('button', { type: 'button', class: 'm4b-mi', disabled: dis ? true : null, onclick: function () { fermerFeuille(); f(); } }, h('span', { class: 'p4-mi-e' }, ic), h('span', null, h('b', null, titre), sous ? h('small', null, sous) : null));
  };
  ouvrirFeuille([h('h2', null, txtL(l.lu && l.lu.titre, 60) || hoteDe(l.url)), h('div', { class: 'sous' }, hoteDe(l.url) + ' · l. ' + l.ligne),
    mi(tr('relire', 20), 'Relire le lien', att ? 'déjà en lecture' : 'relit la page · ✦ 1 appel', function () { demandeLien(c, l, 'relire'); }, !!att),
    mi('✦', 'Escalader à l’IA forte', 'relecture plus fine · ✦ 1 appel', function () { demandeLien(c, l, 'escalader'); }, att && att.type === 'escalader'),
    mi(tr('crayon', 20), 'Aller à sa ligne', 'dans Mes notes', function () { allerLigne(l.ligne, null, 'lien'); })]);
}
/* prix d'un lien : toujours avec sa quantité ; l'équivalent CHF marqué ≈ quand il est converti (taux estimé) */
var TAUX_EUR = 0.94;
function prixDe(P) {
  if (!P || typeof P.prix !== 'number') return null;
  var eur = /€|eur/i.test(P.devise || ''), chf = eur ? P.prix * TAUX_EUR : P.prix, q = +P.quantite || null, u = String(P.unite || '').toLowerCase();
  var g = q && u === 'g' ? q : q && u === 'kg' ? q * 1000 : null;
  return { p: P.prix, eur: eur, conv: eur, chf: chf, q: q, u: u, cent: g ? chf / g * 100 : null,
    txt: chf2(P.prix) + (eur ? ' €' : ' CHF') + (q ? ' / ' + q + ' ' + u : '') + (eur ? ' ≈ ' + chf2(chf) + ' CHF' : '') };
}
function prixLien(x) { var lu = x.lien && x.lien.lu; return lu && lu.prix && lu.prix[0] ? prixDe(lu.prix[0]) : null; }
function prixTxt(lu) { var p = lu && lu.prix && lu.prix[0] && prixDe(lu.prix[0]); return p ? p.txt : null; }
/* libellés et unités de la comparaison (v03-4 : l'unité sous le libellé) */
function labC(M, k) { return k === M.kT ? 'Pour ' + M.besoin : M.lab(k).replace(/\s*\/\s*\S+$/, ''); }
function nomCrit(M, k) { return k === M.kT ? 'Pour ' + M.besoin + ' livrées' : labC(M, k); }
function uniteDe(M, k) {
  if (k === M.kT) return 'CHF, livrées';
  if (k === M.kP && M.uPl) return M.uPl;
  var T = M.arts.map(function (x) { return x.a.valeurs[k].texte; }), a = function (re) { return T.some(function (t) { return re.test(t); }); };
  if (a(/\/\s*bt/i)) return 'CHF / bt'; if (a(/CHF|Fr\./)) return 'CHF'; if (a(/€/)) return '€'; if (a(/%/)) return '%';
  if (k === M.kM && M.kP >= 0 && M.arts.some(function (x) { return /\/\s*bt/i.test(x.a.valeurs[M.kP].texte); })) return 'bouteilles';
  return '';
}
function uniteCourte(M, k) { var u = uniteDe(M, k); return u === 'CHF, livrées' ? 'CHF' : u === 'bouteilles' ? 'bt' : u; }
function sansUnite(t) {
  t = j1Virg(String(t).trim()).replace(/^×\s*/, 'par ').replace(/\s*\/\s*(bt|kg|g|l)\b\.?/i, '').replace(/\s*(CHF|Fr\.)\s*$/i, '').replace(/\s*%\s*$/, '');
  return t.replace(/\d{4,}/g, function (n) { return milliers(+n).replace(/ /g, '\u202f'); }).replace(/([≥≤]) /g, '$1\u00a0');
}
function chiffre(n) { return Math.abs(n) < 10 && Math.round(n) !== n ? chf2(n) : milliers(n); }
/* une valeur affichée : nombre sans unité, et ce qui la rend incertaine dessous (« + livraison ? », « en €, à vérifier », « à relire ») */
function aff(M, x, k) {
  var t = x.a.valeurs[k].texte, d = M.douteux(t);
  if (k === M.kP && x.pl && (d || !/\d/.test(t))) return { t: (x.pl.conv ? '≈ ' : '') + chf2(M.val(x, k)), s: x.pl.txt.replace(/\s*≈.*$/, ''), cls: x.pl.conv ? 'est' : '' };
  if (d) {
    if (x.lien && lienEnLecture(M.c, x.lien)) return { t: '…', s: 'en lecture', cls: 'inc' };
    if (/à relire/.test(t)) return { t: '?', s: 'à relire', cls: 'inc' };
    if (t.trim() === '?') return { t: '?', s: raison(M, x, k), cls: 'inc' };
    var eu = x.eur && k === M.kP;
    return { t: sansUnite(t.replace(/\s*\?\s*$/, '')) + (eu ? ' €' : '') + ' ?', s: eu ? 'en €, à vérifier' : 'à vérifier', cls: 'est' };
  }
  if (k === M.kT && x.sansLiv) return { t: '≥\u00a0' + sansUnite(t), s: '+ livraison ?', cls: 'est' };
  if (x.court && /^\s*≤/.test(t)) return { t: sansUnite(t), s: 'pas assez', cls: 'court' };
  return { t: sansUnite(t), cls: '' };
}
function raison(M, x, k) {
  if (k !== M.kT) return x.lien && x.lien.lu ? 'pas trouvé' : 'pas noté';
  if (x.court) return 'ne couvre pas ' + M.besoin;
  var R = [];
  if (M.kP >= 0 && M.douteux(x.a.valeurs[M.kP].texte)) R.push(x.eur ? 'prix en € ?' : 'prix ?');
  if (M.kL >= 0 && M.douteux(x.a.valeurs[M.kL].texte)) R.push('livraison ?');
  return R.join(' · ') || 'pas noté';
}
/* à quantité égale : avec un total pour N, ni le prix à l'unité, ni la livraison seule, ni le minimum ne « gagnent » */
function exclu(M, k) { return k === M.kM || (M.kT >= 0 && (k === M.kL || k === M.kP)); }
function triCrit(M, k0) {
  var s0 = M.sens(k0);
  return function (a, b) { var va = a.court ? null : M.val(a, k0), vb = b.court ? null : M.val(b, k0); if (va == null && vb == null) return a.court - b.court; if (va == null) return 1; if (vb == null) return -1; return s0 > 0 ? vb - va : va - vb; };
}
/* barres du critère (h04-7) : le 1er a la barre pleine ; les suivants raccourcissent selon leur écart au meilleur (meilleur / valeur) */
function barresCrit(c, M, k0, orga) {
  var s0 = M.sens(k0), w0 = M.gagne(k0), T = M.actifs.slice().sort(triCrit(M, k0));
  var A = T.filter(function (x) { return !x.court && M.val(x, k0) != null; }), S = T.filter(function (x) { return x.court || M.val(x, k0) == null; });
  var v0 = A.length ? M.val(A[0], k0) : 0, mx = Math.max.apply(null, A.map(function (x) { return M.val(x, k0); }).concat([0]));
  var hdT = [uniteCourte(M, k0), s0 < 0 ? 'moins = mieux' : s0 > 0 ? 'plus = mieux' : ''].filter(Boolean).join(' · ');
  var box = h('div', { class: 'a-barres' + (orga ? ' org' : ''), 'data-booster': 'barres-critere' },
    orga ? h('div', { class: 'hd' }, h('b', null, nomCrit(M, k0)), h('span', null, hdT))
      : h('button', { type: 'button', class: 'hd', 'aria-label': 'Critère : ' + nomCrit(M, k0) + ', toucher pour changer', onclick: function () { feuilleCritere(c, M); } }, h('b', null, nomCrit(M, k0)), h('span', null, hdT), h('em', null, 'critère ›')));
  A.forEach(function (x, i) {
    var f = aff(M, x, k0), v = M.val(x, k0), pu = k0 === M.kT && !x.sansLiv ? M.parUnite(x) : null;
    var pc = s0 < 0 ? (v ? v0 / v * 100 : 100) : s0 > 0 ? (v0 ? v / v0 * 100 : 100) : (mx ? v / mx * 100 : 100);
    box.appendChild(h('button', { type: 'button', class: 'a-br' + (w0 === x ? ' win' : '') + (f.cls ? ' ' + f.cls : ''), onclick: orga ? function () { ouvrirCmp(k0); } : vers2(c, x.a.ligne, x.a.citation, x.a.nom) },
      h('span', { class: 'r' }, String(i + 1)), h('span', { class: 'n' }, h('span', { class: 'nm' }, x.a.nom), x.ex ? h('span', { class: 'a-ex' }, 'exemple') : null, x.ret ? h('span', { class: 'a-ok' }, '✓ choisi') : null),
      h('span', { class: 'v' }, f.t, f.s ? h('small', null, f.s) : pu ? h('small', null, chf2(pu) + ' / bt') : null),
      h('span', { class: 'b' }, h('i', { style: 'width:' + Math.max(6, Math.min(100, Math.round(pc))) + '%' }))));
  });
  S.forEach(function (x) {
    var f = aff(M, x, k0), enL = x.lien && lienEnLecture(c, x.lien), txt = x.court ? 'ne couvre pas ' + M.besoin : f.s || 'pas noté';
    box.appendChild(h('div', { class: 'a-br inc' + (x.court ? ' court' : '') }, h('span', { class: 'r' }, '–'), h('span', { class: 'n' }, h('span', { class: 'nm' }, x.a.nom), x.ex ? h('span', { class: 'a-ex' }, 'exemple') : null),
      h('span', { class: 'v' }, f.t !== '?' && !x.court ? f.t : null, h('small', null, txt)),
      !orga && !enL && !x.court ? h('button', { type: 'button', class: 'a-act ia esc', 'aria-label': 'Escalader la lecture de ' + x.a.nom, onclick: function () { if (x.lien) demandeLien(c, x.lien, 'escalader'); else escalader(c); } }, '✦ Escalader') : null));
  });
  return box;
}
/* « Frais de port » double « Livraison » : même groupe */
function groupeCar(t) { t = String(t).toLowerCase(); return /délai|jours|semaines/.test(t) ? 'délai' : /port\b|livraison|envoi|exp[ée]dition|transport/.test(t) ? 'livraison' : /prix|co[uû]t|tarif/.test(t) ? 'prix' : /minimum|\bmin\b/.test(t) ? 'minimum' : t.replace(/^[^\p{L}\p{N}]+\s*/u, ''); }
/* le sens d'un chiffre : « au lieu de 2 » dit l'écart, pas la grandeur ; sans libellé, la grandeur vient de l'unité */
function labChiffre(x) {
  var u = String(x.valeur || ''), L = x.label && x.label !== 'undefined' ? String(x.label) : '';
  var gen = /°/.test(u) ? 'température' : /CHF|€|Fr\./.test(u) ? 'montant' : /\bmin\b|\bh\b|heures?|jours?/.test(u) ? 'durée' : /%/.test(u) ? 'taux' : /\bbar\b/.test(u) ? 'pression' : /fûts?|\bbt\b|bouteilles|kg|\bg\b|litres?|\bl\b|bières?/.test(u) ? 'quantité' : 'valeur';
  if (!L || L === 'chiffre') return { l: gen };
  var m = L.match(/^au lieu de\s+([\d.,]+)$/i);
  if (m) { var un = (u.match(/[^\d\s.,'’  ].*$/) || [''])[0].trim(); return { l: gen, s: L + (un ? ' ' + un : '') }; }
  return { l: L };
}
function exempleTache(t) {
  if (exempleLigne(t.ligne, t.citation)) return true;
  var m = String(t.titre || '').split(/\s+/).slice(-2).join(' ');
  return m.length > 3 && lignesDoc().some(function (l) { return l.indexOf(m) >= 0 && /\(exemple\)/i.test(l); });
}
/* deux options : l'écart en tête (calcul de l'app), l'échéance comptée sous le pouce (« avant décembre » → ≈ dans N j · jour) */
function decider(c, r, ops) {
  var o = c.org, R = retenus(o), vals = ops.map(function (x) { return nb(x.cout); }), mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals);
  var unite = (ops[0].cout.match(/(CHF|€|EUR|Fr\.)\s*$/) || ['', 'CHF'])[1];
  if (ops.length === 2 && mx > mn) {
    var calc = milliers(mx) + ' − ' + milliers(mn);
    org.appendChild(h('button', { type: 'button', class: 'p4-ecart a-ecart', 'aria-label': milliers(mx - mn) + ' ' + unite + ' d’écart, calcul ' + calc, onclick: function () { toast(calc + ' = ' + milliers(mx - mn) + ' ' + unite + ' · calcul de l’app'); } },
      h('b', null, milliers(mx - mn) + ' ' + unite), ' d’écart entre les deux · calcul de l’app'));
  }
  org.appendChild(h('div', { class: 'p4-dec', 'data-booster': 'colonnes' }, ops.map(function (op, i) {
    var ret = R.indexOf(i) >= 0;
    return h('button', { type: 'button', class: 'p4-col' + (ret ? ' ret' : '') + (vals[i] === mn && mx > mn ? ' moins' : ''), onclick: vers(op.ligne, op.citation, op.titre) },
      h('b', { class: 'v' }, op.cout), h('span', { class: 'barre', style: 'height:' + Math.max(24, Math.round(vals[i] / mx * 150 * (AMPLE || 1))) + 'px' }, op.emoji || ''), h('span', { class: 'n' }, (ret ? '✓ ' : '') + op.titre));
  })));
  if (R.length) return false;
  var tq = r.tache && r.tache.quand && o.garde.tache !== false ? r.tache.quand : null, dq = tq && lireDate(tq, c.maj);
  enAction(h('div', { class: 'p4-duo' }, h('div', { class: 'p4-duo-t' }, 'Retenir' + (tq ? ' · ' + (dq ? dateJ(dq.d, dq.approx) : tq) : '')), ops.map(function (op, i) {
    return h('button', { type: 'button', class: 'p4-b', 'data-booster': 'retenir-pouce', 'aria-label': 'Retenir ' + op.titre, onclick: function () { retenirAnnulable(i); } }, op.emoji ? h('span', { class: 'p4-pouce' }, op.emoji) : null, h('span', { class: 'p4-bn' }, op.titre));
  })));
  return true;
}

window.__p4amelio = { ouvrirCmp: function (k) { ouvrirCmp(k); }, fermerCmp: function () { fermerCmp(); }, vueCmp: function () { return vueCmp; }, modele: function () { var c = courant(); return c && c.org && c.org.rep.comparaison ? (function (M) { return { crit: M.crit, kT: M.kT, besoin: M.besoin, gagnants: M.cmp.criteres.map(function (x, k) { var g = M.gagne(k); return g ? g.a.nom : null; }) }; })(modele(c, c.org.rep)) : null; } };
