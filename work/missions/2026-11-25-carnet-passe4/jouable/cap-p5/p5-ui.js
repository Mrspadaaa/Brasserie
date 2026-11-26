/* ====================================================================== PASSE 5 (26.11) : interface des mini maquettes p5
   (mini/S-*.html, mini/O-*.html, jetons mini/COMMUN.md, données mini/DONNEES.md) et, pour les écrans hors classement, ses choix figés
   du 17.11 (articles h03-5/h06-5, article h01-6, Comparer g01-8/v03-4/g05-8/h04-7/h06-7, choisi g05-11/v03-7/v09-3/g05-9, À venir h05-9).
   Le moteur de p4 est gardé ; seules les fonctions d'affichage sont redéclarées ici (la dernière déclaration l'emporte). Classes p5-. */
var P5_SVG = {
  ret: '<path d="M15 5l-7 7 7 7"/>', menu: '<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>',
  loupe: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>', horloge: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  caseok: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 5-6"/>', chev: '<path d="M6 9l6 6 6-6"/>', droite: '<path d="M9 6l6 6-6 6"/>',
  cuve: '<path d="M5 13h14v4a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z"/><path d="M9 4c-1 1.5 1 2.5 0 4.5M12 4c-1 1.5 1 2.5 0 4.5M15 4c-1 1.5 1 2.5 0 4.5"/>',
  ferm: '<path d="M7 20c-2-3 2-5 0-8s2-5 0-8M12 20c-2-3 2-5 0-8s2-5 0-8M17 20c-2-3 2-5 0-8s2-5 0-8"/>',
  frigo: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M6 10h12M9 6v2M9 13v3"/>', flocon: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5"/>',
  fut: '<rect x="6" y="4" width="12" height="16" rx="3"/><path d="M6 9h12M6 15h12"/>', bouteille: '<path d="M10 3h4v4l2 3v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10l2-3z"/><path d="M8 13h8"/>',
  houblon: '<path d="M12 3c-4 3-6 7-6 10a6 6 0 0 0 12 0c0-3-2-7-6-10z"/><path d="M8 10h8M7 14h10M9 18h6"/>', coche: '<path d="M5 12l5 5 9-10"/>',
  maison: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/>', goutte: '<path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z"/>',
  eclair: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>', boite: '<path d="M3 8l9-4 9 4v11l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v11"/>',
  mallette: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 12h18"/>', bouclier: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>',
  chope: '<path d="M6 6h9v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M15 9h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M6 10h9"/>',
  photo: '<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-2.5h5L16 7"/>',
  micro: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  ia: '<path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8z"/><path d="M18.5 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', bord: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  finances: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M15 12.5h3M3 9h18"/>', cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  brassins: '<path d="M7 4h10l-1 16H8z"/><path d="M17 8h2v6h-2"/>', stocks: '<circle cx="8" cy="15" r="4"/><circle cx="16" cy="15" r="4"/><circle cx="12" cy="8" r="4"/>',
  clients: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.5 3-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14c2.8 0 4.5 2 4.5 5"/>',
  crayon: '<path d="M4 20l1-4.5L16 4.5l3.5 3.5L8.5 19z"/><path d="M14 7l3.5 3.5"/>', annule: '<path d="M4 9h11a5 5 0 0 1 0 10H9"/><path d="M8 5L4 9l4 4"/>',
  tel: '<path d="M5 4h3.5l2 5-2.4 1.5a11 11 0 0 0 5.4 5.4L15 13.5l5 2V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  panier: '<path d="M3 4h2.2l2.3 11h10.2L20 7.5H6.4"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>',
  q: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.5a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2-2.4 3.4"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
  cle: '<path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L3.5 17.5l3 3 5.7-5.7a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.3-.7-.7-2.3z"/>',
  lien: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  dossier: '<path d="M3.5 6.5h6l2 2h9v10.5h-17z"/>', cible: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>',
  cadenas: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', oeil: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  envoi: '<path d="M12 19V5M6 11l6-6 6 6"/>', flasque: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/>', sol: '<rect x="4" y="5" width="16" height="14" rx="1"/><path d="M4 12h16M12 5v14"/>'
};
function sv(n, cls) { var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'p5-svg' + (cls ? ' ' + cls : '')); s.setAttribute('aria-hidden', 'true'); s.innerHTML = P5_SVG[n] || ''; return s; }
var J2 = ['di', 'lu', 'ma', 'me', 'je', 've', 'sa'];
function p5j(d) { d = new Date(d); return J2[d.getDay()] + ' ' + d.getDate() + '.' + (d.getMonth() + 1); }
function p5d(d) { d = new Date(d); return d.getDate() + '.' + (d.getMonth() + 1); }
function p5quand(iso) { var d = new Date(iso); return memeJour(d, Date.now()) ? 'auj. ' + hm(d) : p5j(d) + ' · ' + hm(d); }
function p5tampon(iso) { var d = new Date(iso); return memeJour(d, Date.now()) ? hm(d) : p5d(d); }
function maj1(t) { t = String(t || ''); return t.charAt(0).toUpperCase() + t.slice(1); }
function exPuce() { return h('span', { class: 'o-ex' }, 'exemple'); }
function fictif(c) { return !!(c.exemple && /^fictif\//.test(c.exemple)); }
var EPREUVE = 'Cas d’épreuve';

/* catégories de DONNEES.md : Bureau › Assurance, Bureau › Événements (l'ancien « Administratif » et « Événements » y vont) */
CATS = [
  { nom: 'Brasserie', emoji: '🍺', ic: 'fut', sous: ['Brassage', 'Fermentation', 'Froid', 'Conditionnement', 'Matières premières'] },
  { nom: 'Local', emoji: '🏠', ic: 'maison', sous: ['Eau', 'Électricité', 'Rangement', 'Sol'] },
  { nom: 'Bureau', emoji: '💼', ic: 'mallette', sous: ['Assurance', 'Événements', 'Administratif'] }
];
function catDe(c) {
  if (fictif(c) && !c.cat) return { nom: EPREUVE, sous: null };
  var k = c.cat || (c.org && c.org.rep && c.org.rep.categorie) || { nom: SANS, sous: null };
  if (k.nom === 'Administratif') return { nom: 'Bureau', sous: k.sous || 'Assurance' };
  if (k.nom === 'Événements') return { nom: 'Bureau', sous: 'Événements' };
  return k;
}
function ordreCat(n) { for (var i = 0; i < CATS.length; i++) if (CATS[i].nom === n) return i; return n === EPREUVE ? 100 : n === SANS ? 99 : 50; }
/* l'icône au trait d'un carnet : par son sujet, sinon par sa sous-catégorie */
function icDe(c) {
  var t = j1Acc(titreDe(c)), k = catDe(c);
  var M = [[/vapeur|chaudi/, 'cuve'], [/soufre|levure/, 'ferm'], [/frigo/, 'frigo'], [/chambre/, 'flocon'], [/co2|fut/, 'fut'], [/bouteill|embouteill/, 'bouteille'],
    [/houblon|citra|malt|sureau/, 'houblon'], [/ecoulement|eau/, 'goutte'], [/electri|fusible/, 'eclair'], [/cave|rang/, 'boite'], [/assurance/, 'bouclier'], [/fete|bar /, 'chope'], [/pompe/, 'cuve'], [/sol/, 'sol']];
  for (var i = 0; i < M.length; i++) if (M[i][0].test(t)) return M[i][1];
  var S = { Brassage: 'cuve', Fermentation: 'ferm', Froid: 'flocon', Conditionnement: 'bouteille', 'Matières premières': 'houblon', Eau: 'goutte', 'Électricité': 'eclair', Rangement: 'boite', Assurance: 'bouclier', 'Événements': 'chope' };
  return S[k.sous] || 'dossier';
}
/* n° = priorité : l'ordre de DONNEES.md, puis ce qu'il range en glissant */
var P5_ORDRE = ['trop de vapeur', 'odeur de soufre', 'frigo de garde', 'chambre froide', 'co2 qui baisse', 'embouteillage', 'houblons citra', 'pompe qui chauffe', 'levure lente', 'malt pilsner',
  'ecoulement qui fuit', 'inspection electrique', 'ranger la cave', 'assurance a renouveler', 'fete de la biere'];
function p5rang(c) { if (c.p5rang != null) return c.p5rang; var t = j1Acc(titreDe(c)); for (var i = 0; i < P5_ORDRE.length; i++) if (t.indexOf(P5_ORDRE[i]) >= 0) return i; return 100 + (Date.parse(c.cree) / 1e13); }
function jauge(e) { var n = RANG[e] + 1; return h('span', { class: 'p5-jg ' + e, 'aria-hidden': 'true' }, [0, 1, 2, 3].map(function (i) { return h('i', { class: i < n ? 'on' : '' }); })); }

/* ---------------------------------------------------------------- liste au repos (S-liste) */
var p5filtre = null, p5ouv = {}, p5vise = null, p5att = null, p5vueC = null;
function reels() { return etat.carnets.filter(function (c) { return !fictif(c); }); }
function aDecider() {
  return reels().filter(function (c) {
    var o = c.org, r = o && o.rep; if (!r || c.etat === 'resolu' || c.etat === 'decide') return false;
    if (r.comparaison) return !(o.artRet || []).length && r.comparaison.articles.filter(function (a) { return a.valeurs.some(function (v) { return nb(v.texte) != null && /chf|€|eur|fr/i.test(v.texte + ' ' + r.comparaison.criteres.join(' ')); }); }).length >= 2;
    return r.options.length >= 2 && !retenus(o).length && r.options.filter(function (x) { return nb(x.cout) != null; }).length >= 1 && r.options.every(function (x) { return x.source === 'notes' || /neuf/i.test(x.titre); });
  });
}
function cleP5(c) {
  var r = c.org && c.org.rep; if (!r) return null;
  var p = prochaine(c);
  if (c.etat !== 'resolu' && p) {
    var qs = [r.tache && r.tache.quand && !c.org.tacheFaite && c.org.garde.tache !== false ? r.tache.quand : null, r.echeance && r.echeance.quand].filter(Boolean).map(function (q) { var d = lireDate(q, c.maj); return d ? { q: q, d: d.d } : null; }).filter(Boolean).sort(function (a, b) { return a.d - b.d; });
    var b0 = qs[0];
    return p.n < 0 ? { t: 'retard ' + (-p.n) + ' j', cls: 'retard' } : { j: p.n + ' j', t: p5d(b0 ? b0.d : new Date()), ia: b0 && /dans /.test(b0.q) };
  }
  var es = r.options.filter(function (o) { return o.estime && nb(o.cout) != null; })[0];
  if (es) return { t: '≈ ' + es.cout.replace(/\s*\?$/, ''), cls: 'est' };
  var L = liensDe(c); if (L.length) return { t: L.length + (L.length > 1 ? ' sites' : ' site'), lien: true };
  return null;
}
function metaP5(c) {
  if (estEnLecture(c)) return '✦ l’IA lit…';
  if (c.orgErreur && !c.org) return 'pas lu par l’IA';
  var r = c.org && c.org.rep; var s = r ? (r.resume || (r.tache && r.tache.titre) || '') : '';
  if (!r) { var l = lignesDe(c).filter(function (x) { return x.trim(); }); s = l.length ? '« ' + l[l.length - 1].slice(0, 30) + ' »' : 'vide'; }
  return s.charAt(0).toLowerCase() + s.slice(1);
}
function ligneP5(c, rang, sousInline, att) {
  var k = cleP5(c), L = liensDe(c), lus = L.filter(function (l) { return l.lu; }).length;
  var row = h('div', { class: 'p5-r' + (c === p5vise ? ' vise' : '') + (fictif(c) ? ' fic' : ''), 'data-id': c.id, role: 'button', tabindex: '0', 'aria-label': titreCourt(c) + ', ' + NOM_ETAT[c.etat] },
    h('span', { class: 'n' }, rang ? String(rang) : ''),
    h('span', { class: 'icb' }, sv(icDe(c))),
    h('span', { class: 'cor' },
      h('span', { class: 'l1' }, sousInline ? h('small', null, sousInline + ' · ') : null, h('b', null, titreCourt(c)), fictif(c) ? exPuce() : null),
      h('span', { class: 'l2' }, jauge(c.etat), h('b', { class: 'et ' + c.etat }, NOM_ETAT[c.etat]), h('span', { class: 'm' }, ' · ' + metaP5(c)),
        L.length && !(k && k.lien) ? h('span', { class: 'lk' }, ' · ', sv('lien'), lus ? ' ' + lus + ' lu' + (lus > 1 ? 's' : '') : ' en lecture') : null)),
    k ? h('span', { class: 'k ' + (k.cls || '') }, k.ia ? h('i', { class: 'ia' }, '✦ ') : null, k.j ? h('b', null, k.j + ' ') : null, k.lien ? sv('lien') : null, k.lien ? ' ' : null, k.t) : null,
    h('span', { class: 'pill', 'aria-hidden': 'true' }));
  brancherGlisse(row, c);
  return row;
}
function rendreListe() {
  var l = $('liste'), y = l.scrollTop; l.textContent = '';
  var R = reels(), n = { note: 0, cherche: 0, decide: 0, resolu: 0 }; R.forEach(function (c) { n[c.etat]++; });
  var items = aFaire().filter(function (x) { return !fictif(x.c); }), dates = items.filter(function (x) { return x.d; }), dec = aDecider(), af = etat.vueListe === 'afaire';
  $('liste-n').textContent = String(R.length); $('n-afaire').textContent = String(dates.length);
  $('p5-n-avenir').textContent = String(aVenir().length);
  $('tab-carnets').classList.toggle('on', !af); $('tab-afaire').classList.toggle('on', af);
  $('p5-adecider').textContent = ''; $('p5-adecider').appendChild(sv('horloge')); $('p5-adecider').appendChild(document.createTextNode(' À décider ')); $('p5-adecider').appendChild(h('b', null, String(dec.length)));
  $('tab-afaire').classList.toggle('sel', af);
  var oe = $('oeil'); oe.textContent = ''; oe.hidden = af;
  [['cherche', 'je cherche', 'je cherche'], ['decide', 'décidé', 'décidés'], ['note', 'noté', 'notés'], ['resolu', 'résolu', 'résolus']].forEach(function (e) {
    oe.appendChild(h('button', { type: 'button', class: 'p5-et ' + e[0] + (p5filtre === e[0] ? ' on' : ''), 'aria-pressed': String(p5filtre === e[0]),
      onclick: function () { p5filtre = p5filtre === e[0] ? null : e[0]; geste('filtrer', p5filtre || 'tout'); rendreListe(); } }, h('b', null, String(n[e[0]])), ' ' + (n[e[0]] > 1 ? e[2] : e[1])));
  });
  $('p5-prio').textContent = af ? 'au ' + p5j(new Date()) : 'n° = priorité';
  var fl = $('p5-filtre'); fl.textContent = ''; fl.hidden = af || !p5filtre;
  if (p5filtre && !af) ajoute(fl, [h('span', null, 'Filtre'), h('button', { type: 'button', class: 'p5-fx', onclick: function () { p5filtre = null; rendreListe(); } }, n[p5filtre] + ' ' + NOM_ETAT[p5filtre].toLowerCase() + (n[p5filtre] > 1 && !/cherche/.test(p5filtre) ? 's' : '') + ' ✕'),
    h('button', { type: 'button', class: 'p5-tm', id: 'p5-tm', onclick: function () { p5filtre = null; rendreListe(); } }, glisse && glisse.leve ? 'Glisse sur une sous-catégorie' : 'Tout montrer')]);
  if (af) rendreAFaireP5(l, items, dec); else arbreP5(l);
  l.scrollTop = y;
  rangeeP5();
}
function arbreP5(l) {
  var groupes = {};
  etat.carnets.forEach(function (c) { var k = catDe(c); (groupes[k.nom] = groupes[k.nom] || []).push(c); });
  Object.keys(groupes).sort(function (a, b) { return ordreCat(a) - ordreCat(b); }).forEach(function (nom) {
    var tous = groupes[nom].sort(function (a, b) { return p5rang(a) - p5rang(b); });
    var vis = tous.filter(function (c) { return p5filtre ? c.etat === p5filtre : c.etat !== 'resolu'; }), res = tous.filter(function (c) { return c.etat === 'resolu'; });
    var kc = 'p5c:' + nom, rc = replie(kc, nom === EPREUVE), def = CATS.filter(function (x) { return x.nom === nom; })[0];
    l.appendChild(h('button', { type: 'button', class: 'p5-cat-l', 'data-cat': nom, 'aria-expanded': String(!rc), onclick: function () { replier(kc, nom === EPREUVE); } },
      sv(def ? def.ic : nom === EPREUVE ? 'flasque' : 'dossier'), h('b', null, nom === SANS ? 'À ranger' : nom), nom === EPREUVE ? exPuce() : null, h('span', { class: 'c' }, String(p5filtre ? vis.length : tous.length)), sv(rc ? 'droite' : 'chev', 'ch')));
    if (rc) return;
    /* rang dans la catégorie : les carnets ouverts, dans l'ordre */
    var ouverts = tous.filter(function (c) { return c.etat !== 'resolu'; }), rangDeC = function (c) { return c.etat === 'resolu' ? null : ouverts.indexOf(c) + 1; };
    if (p5filtre) {
      /* filtre : chaque sous-catégorie reste une cible, même vide (S-ranger-repos) */
      var sous = (def ? def.sous : []).slice(); vis.forEach(function (c) { var s = catDe(c).sous; if (s && sous.indexOf(s) < 0) sous.push(s); });
      sous.forEach(function (s) {
        var ici = vis.filter(function (c) { return catDe(c).sous === s; }), cach = tous.filter(function (c) { return catDe(c).sous === s; }).length - ici.length;
        if (!ici.length) { if (!def || def.sous.indexOf(s) < 0 || (!cach && nom !== 'Brasserie')) return; l.appendChild(h('div', { class: 'p5-ss vide', 'data-cat': nom, 'data-sous': s }, sv('droite', 'ch'), h('b', null, s), ' 0', h('span', null, ' · aucun ' + NOM_ETAT[p5filtre].toLowerCase() + (cach ? ' · ' + cach + ' masqué' + (cach > 1 ? 's' : '') : '')))); return; }
        if (ici.length >= 2 || cach) { l.appendChild(h('div', { class: 'p5-ss', 'data-cat': nom, 'data-sous': s }, sv('chev', 'ch'), h('b', null, s), ' ' + ici.length, cach ? h('span', null, ' · ' + cach + ' masqué' + (cach > 1 ? 's' : '')) : null)); var bloc = h('div', { class: 'p5-sb' }); ici.forEach(function (c) { bloc.appendChild(ligneP5(c, rangDeC(c))); }); l.appendChild(bloc); }
        else ici.forEach(function (c) { l.appendChild(ligneP5(c, rangDeC(c), s)); });
      });
      vis.filter(function (c) { return !catDe(c).sous; }).forEach(function (c) { l.appendChild(ligneP5(c, rangDeC(c))); });
      return;
    }
    /* au repos : une sous-catégorie à deux carnets et plus devient un pli ; seule, elle passe en ligne avec lui */
    for (var i = 0; i < vis.length;) {
      var s = catDe(vis[i]).sous, j = i; while (j < vis.length && s && catDe(vis[j]).sous === s) j++;
      if (j - i >= 2) {
        var kss = 'p5s:' + nom + '›' + s, rs = replie(kss, false);
        l.appendChild(h('button', { type: 'button', class: 'p5-ss', 'data-cat': nom, 'data-sous': s, 'aria-expanded': String(!rs), onclick: (function (k) { return function () { replier(k, false); }; })(kss) }, sv(rs ? 'droite' : 'chev', 'ch'), h('b', null, s), ' ' + (j - i)));
        if (!rs) { var b = h('div', { class: 'p5-sb' }); for (var k = i; k < j; k++) b.appendChild(ligneP5(vis[k], rangDeC(vis[k]))); l.appendChild(b); }
        i = j;
      } else { l.appendChild(ligneP5(vis[i], rangDeC(vis[i]), s)); i++; }
    }
    if (res.length) {
      var kr = 'p5r:' + nom, rr = replie(kr, true);
      l.appendChild(h('button', { type: 'button', class: 'p5-res', 'aria-expanded': String(!rr), onclick: function () { replier(kr, true); } }, sv('coche'), h('b', null, res.length + ' résolu' + (res.length > 1 ? 's' : '')), h('span', null, ' · ' + res.map(function (c) { return titreCourt(c).split(/\s+/).slice(0, 3).join(' ').replace(/ à$/, ''); }).join(' · '))));
      if (!rr) res.forEach(function (c) { l.appendChild(ligneP5(c, null, catDe(c).sous)); });
    }
  });
  l.appendChild(h('button', { type: 'button', class: 'p5-recharger', onclick: rechargerExemples }, 'Recharger les exemples'));
}
/* ---------------------------------------------------------------- glisser (S-ranger-glisse, v01) */
function nettoyerCibles() { Array.prototype.forEach.call(document.querySelectorAll('.p5-cible'), function (n) { n.classList.remove('p5-cible'); }); }
function placeP5(c, nom, s) { var seau = etat.carnets.filter(function (x) { var k = catDe(x); return x !== c && x.etat !== 'resolu' && k.nom === nom && (!s || k.sous === s); }).sort(function (a, b) { return p5rang(a) - p5rang(b); }); return seau; }
function marquerCible(g) {
  nettoyerCibles(); g.cible = null;
  if (!g.p5vient) {
    var k0 = catDe(g.c), r0 = g.row.querySelector('.n').textContent;
    g.p5vient = h('div', { class: 'p5-vient' }, 'vient d’ici · ' + k0.nom + (k0.sous ? ' › ' + k0.sous : '') + (r0 ? ' · ' + r0 + 'e' : ''));
    g.row.parentNode.insertBefore(g.p5vient, g.row); g.row.classList.add('p5-tenu'); var tm = $('p5-tm'); if (tm) tm.textContent = 'Glisse sur une sous-catégorie';
  }
  g.row.style.pointerEvents = 'none';
  var el = document.elementFromPoint(g.x, g.y), t = el && el.closest && el.closest('.p5-r,.p5-ss,.p5-cat-l');
  g.row.style.pointerEvents = '';
  var pill = g.row.querySelector('.pill');
  if (!t || t === g.row) { pill.textContent = ''; return; }
  var nom, s;
  if (t.classList.contains('p5-r')) { var x = parId(t.getAttribute('data-id')); if (!x) return; var kx = catDe(x); nom = kx.nom; s = kx.sous; }
  else { nom = t.getAttribute('data-cat'); s = t.getAttribute('data-sous'); }
  if (nom === EPREUVE) return;
  var zone = t.classList.contains('p5-r') && t.parentNode.classList.contains('p5-sb') ? t.parentNode : t; zone.classList.add('p5-cible');
  var seau = placeP5(g.c, nom, s), apres = seau.length ? seau[seau.length - 1] : null, tousCat = placeP5(g.c, nom, null);
  var rang = apres ? tousCat.indexOf(apres) + 2 : 1;
  g.cible = { type: 's', cat: nom, sous: s || null, rang: rang, apres: apres };
  pill.textContent = '→ ' + nom + (s ? ' › ' + s : '') + ' · ' + rang + 'e';
}
function deposer(c, ci) {
  var photo = etat.carnets.map(function (x) { return { x: x, cat: x.cat, r: x.p5rang }; });
  etat.carnets.forEach(function (x) { if (x.p5rang == null) x.p5rang = p5rang(x); });
  c.cat = { nom: ci.cat, sous: ci.sous };
  c.p5rang = ci.apres ? ci.apres.p5rang + 0.5 : -1;
  var tri = etat.carnets.slice().sort(function (a, b) { return a.p5rang - b.p5rang; }); tri.forEach(function (x, i) { x.p5rang = i; });
  sauver(); geste('glisser', titreCourt(c) + ' → ' + ci.cat + (ci.sous ? ' › ' + ci.sous : '') + ' · ' + ci.rang + 'e'); rendreListe();
  toast('Rangé : ' + ci.cat + (ci.sous ? ' › ' + ci.sous : '') + ' · ' + ci.rang + 'e', 'Annuler', function () { photo.forEach(function (p) { p.x.cat = p.cat; p.x.p5rang = p.r; }); sauver(); rendreListe(); });
}
document.addEventListener('pointerup', function () { setTimeout(function () { Array.prototype.forEach.call(document.querySelectorAll('.p5-vient'), function (n) { n.remove(); }); Array.prototype.forEach.call(document.querySelectorAll('.p5-tenu'), function (n) { n.classList.remove('p5-tenu'); }); }, 0); });

/* ---------------------------------------------------------------- À faire, tous les carnets (O-afaire, v01) */
function rendreAFaireP5(l, items, dec) {
  var g = { retard: [], semaine: [], tard: [], sans: [] };
  items.forEach(function (x) { var n = x.d ? joursDe(x.d) : null; (n == null ? g.sans : n < 0 ? g.retard : n <= 7 ? g.semaine : g.tard).push(x); });
  var titre = function (t, cls, nb, sous) { l.appendChild(h('div', { class: 'p5-gr ' + cls }, h('b', null, t), ' ' + nb, sous ? h('span', null, ' · ' + sous) : null)); };
  var ligne = function (x, cls) {
    var n = x.d ? joursDe(x.d) : null, rel = /dans /.test(x.q || '');
    l.appendChild(h('div', { class: 'p5-af' },
      h('button', { type: 'button', class: 'rond ' + cls, 'aria-label': 'Cocher ' + x.t, onclick: function () { cocherIci(x); } }),
      h('span', { class: 'icb' }, sv(icDe(x.c))),
      h('button', { type: 'button', class: 't', onclick: function () { ouvrir(x.c.id); } }, h('b', null, maj1(x.t)), h('small', null, titreCourt(x.c) + (x.q && !x.d ? ' · « ' + x.q + ' »' : ''))),
      h('span', { class: 'd' }, x.d ? h('b', null, (rel ? '✦ ' : '') + p5j(x.d)) : null, x.d ? h('small', { class: n < 0 ? 'retard' : '' }, n < 0 ? (-n) + ' j de retard' : texteJours(n)) : null)));
  };
  if (g.retard.length) { titre('En retard', 'retard', g.retard.length); g.retard.forEach(function (x) { ligne(x, 'retard'); }); }
  if (g.semaine.length) { titre('Dans les 7 jours', 'sem', g.semaine.length, 'aussi dans À venir'); g.semaine.forEach(function (x) { ligne(x, 'sem'); }); }
  if (dec.length) {
    titre('À décider', 'dec', dec.length, 'montants notés');
    dec.forEach(function (c) {
      var r = c.org.rep, m = [];
      if (r.comparaison) r.comparaison.articles.forEach(function (a) { var v = a.valeurs.filter(function (v) { return /chf|€/i.test(v.texte) || nb(v.texte) > 100; })[0]; if (v) m.push(v.texte.replace(/\s*CHF.*$/, '')); });
      else r.options.forEach(function (o) { if (nb(o.cout) != null) m.push(o.cout.replace(/\s*CHF.*$/, '')); });
      m.sort(function (a, b) { return nb(a) - nb(b); });
      l.appendChild(h('div', { class: 'p5-af' }, h('span', { class: 'rond dec' }), h('span', { class: 'icb' }, sv(icDe(c))),
        h('button', { type: 'button', class: 't', onclick: function () { ouvrir(c.id); } }, h('b', null, titreCourt(c).split(/\s+/).slice(0, 3).join(' ')), h('small', null, (r.comparaison ? r.comparaison.articles.length + ' articles' : r.options.map(function (o) { return o.titre.toLowerCase(); }).join(' ou ')))),
        h('span', { class: 'd' }, h('b', null, m[0] || '?'), m[1] ? h('small', null, 'ou ' + m.slice(1).join(' ou ') + ' CHF') : h('small', null, 'ou ?'))));
    });
  }
  var att = [];
  reels().forEach(function (c) { var r = c.org && c.org.rep; if (!r || c.etat === 'resolu') return; r.options.forEach(function (o) { if (o.attente) att.push({ c: c, o: o }); }); });
  if (att.length) {
    titre('Attendu', 'att', att.length, 'de quelqu’un');
    att.forEach(function (a) {
      var j = -joursDe(new Date(a.c.maj));
      l.appendChild(h('div', { class: 'p5-af' }, h('span', { class: 'rond att' }), h('span', { class: 'icb' }, sv('tel')),
        h('button', { type: 'button', class: 't', onclick: function () { ouvrir(a.c.id); } }, h('b', null, maj1(a.o.attente.citation.replace(/\.$/, '')) + (quiDe(a.o) ? ' · ' + quiDe(a.o) : '')), h('small', null, titreCourt(a.c) + ' · l. ' + a.o.attente.ligne)),
        h('span', { class: 'd' }, a.o.estime ? h('b', { class: 'est' }, '≈ ' + a.o.cout) : h('b', null, a.o.cout), h('small', null, (a.o.estime ? 'estimé · ' : '') + j + ' j'))));
    });
  }
  if (g.tard.length) { titre('Plus tard', 'tard', g.tard.length); g.tard.forEach(function (x) { ligne(x, 'tard'); }); }
  if (g.sans.length) { titre('Sans date', 'sans', g.sans.length); g.sans.forEach(function (x) { ligne(x, 'sans'); }); }
  if (!items.length && !dec.length) l.appendChild(h('p', { class: 'p5-vide' }, 'Rien à faire pour l’instant.'));
}
$('p5-adecider').addEventListener('click', function () { etat.vueListe = 'afaire'; sauver(); rendreListe(); var t = document.querySelector('.p5-gr.dec'); if (t) t.scrollIntoView(); });
$('tab-afaire').addEventListener('click', function (e) { if (etat.vueListe === 'afaire') { e.stopImmediatePropagation(); etat.vueListe = 'arbre'; sauver(); rendreListe(); } }, true);

/* ---------------------------------------------------------------- Noter vite (S-noter : écrit dans le carnet visé), note rangée (S-rangee) */
function racines(t) { return j1Acc(t).split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 4 && ['dans', 'pour', 'avec', 'mais', 'nouveau', 'prends', 'plus', 'tres'].indexOf(w) < 0; }).map(function (w) { return w.slice(0, 5); }); }
function viseDe(t) {
  var mots = racines(t); if (mots.length < 2) return null;
  var best = null, bs = 1;
  reels().forEach(function (c) { if (c.etat === 'resolu') return; var tx = racines(titreDe(c) + ' ' + lignesDe(c).join(' ')), s = 0; mots.forEach(function (m) { if (tx.indexOf(m) >= 0) s++; }); if (s > bs) { bs = s; best = c; } });
  return best;
}
var noterEl = $('noter'), ecrit = $('p5-ecrit'), p5force = undefined;
function majNoter() {
  var t = noterEl.value.trim(); noterEl.style.height = 'auto'; noterEl.style.height = Math.min(110, noterEl.scrollHeight) + 'px';
  var av = p5vise; p5vise = t ? (p5force !== undefined ? p5force : viseDe(t)) : null;
  $('v-liste').classList.toggle('p5-tape', !!t); document.body.classList.toggle('p5-tape', !!t); if (t) tuerToast();
  ecrit.hidden = !t; ecrit.textContent = '';
  if (t) ajoute(ecrit, [h('span', null, 'Écrit dans'), h('span', { class: 'p5-dans' + (p5vise ? '' : ' neuf') }, p5vise ? sv('ia') : null, p5vise ? titreCourt(p5vise) : 'un nouveau carnet'),
    h('button', { type: 'button', class: 'p5-chg', onclick: feuilleViser }, 'changer ▾')]);
  if (av !== p5vise) { rendreListe(); if (p5vise) { var r = document.querySelector('.p5-r.vise'); if (r) { r.scrollIntoView({ block: 'center' }); apercuVise(r); } } }
}
function apercuVise(r) {
  var c = p5vise, L = lignesDe(c).map(function (x, i) { return { t: x, i: i + 1 }; }).filter(function (x) { return x.t.trim(); }), d = L.slice(-2), lk = liensDe(c);
  var b = h('div', { class: 'p5-apercu' }, h('div', { class: 'hd' }, h('b', null, 'DERNIÈRES LIGNES · ' + p5j(c.maj).toUpperCase()), h('span', null, L.length + ' lignes')),
    d.map(function (x) { return h('div', { class: 'li' }, h('span', { class: 'i' }, String(x.i)), h('span', null, x.t.length > 60 ? x.t.slice(0, 58) + '…' : x.t)); }),
    lk.length ? h('div', { class: 'lk' }, lk.slice(0, 3).map(function (x) { return h('span', null, sv('lien'), ' ' + hoteDe(x.url)); })) : null);
  r.parentNode.insertBefore(b, r.nextSibling);
}
function feuilleViser() {
  ouvrirFeuille([h('h2', null, 'Écrire dans…'), h('div', { class: 'sous' }, 'Ta note va dans le carnet choisi.'),
    h('button', { type: 'button', class: 'm4b-mi', onclick: function () { p5force = null; fermerFeuille(); majNoter(); } }, h('span', { class: 'p4-mi-e' }, '+'), h('span', null, h('b', null, 'Un nouveau carnet'))),
    reels().filter(function (c) { return c.etat !== 'resolu'; }).sort(function (a, b) { return p5rang(a) - p5rang(b); }).map(function (c) {
      return h('button', { type: 'button', class: 'm4b-mi', onclick: function () { p5force = c; fermerFeuille(); majNoter(); } }, h('span', { class: 'p4-mi-e' }, sv(icDe(c))), h('span', null, h('b', null, titreCourt(c)), h('small', null, catDe(c).nom + (catDe(c).sous ? ' › ' + catDe(c).sous : ''))));
    })]);
}
noterEl.addEventListener('input', majNoter);
$('nouveau').addEventListener('click', function (e) {
  var t = noterEl.value.trim(); if (!t) return;
  if (!p5vise) { p5force = undefined; setTimeout(function () { majNoter(); }, 0); return; } /* nouveau carnet : le moteur */
  e.stopImmediatePropagation();
  var c = p5vise, d = document.createElement('div'); d.innerHTML = c.html || ''; var p = document.createElement('div'); p.textContent = t; d.appendChild(p);
  p5att = { id: c.id, texte: t, quand: new Date().toISOString(), orgAvant: c.org, etatAvant: c.etat, ligne: d.children.length };
  c.html = d.innerHTML; c.maj = p5att.quand; noterEl.value = ''; p5force = undefined; sauver();
  geste('noter vite, écrit dans le carnet', titreCourt(c) + ' : ' + t);
  enFile(c); majNoter(); rendreListe();
  toast('Écrit dans ' + titreCourt(c) + ' · l’IA lit', 'Ouvrir', function () { ouvrir(c.id); });
}, true);
function rangeeP5() {
  if (!p5att || feuille) return; var c = parId(p5att.id); if (!c || estEnLecture(c)) return;
  if (c.org === p5att.orgAvant && !c.orgErreur) return;
  var a = p5att; p5att = null;
  if (!c.org || c.org === a.orgAvant) { toast('Ta note est dans ' + titreCourt(c) + ' · l’IA n’a pas pu lire'); return; }
  var o = c.org, P = aGarder(c), L = o.rep.lectures.map(function (x, i) { return { x: x, i: i }; }).filter(function (x) { return x.x.ligne === a.ligne; });
  var on = {}; var lignes = [];
  if (c.etat !== a.etatAvant) lignes.push({ k: 'etat', t: 'État', s: 'l’IA, d’après ta note', av: NOM_ETAT[a.etatAvant], ap: NOM_ETAT[c.etat], cls: c.etat });
  P.filter(function (p) { return p.cle !== 'etat'; }).forEach(function (p) { lignes.push({ k: 'p:' + p.cle, t: p.label.split(' : ')[0], s: p.label.split(' : ').slice(1).join(' : '), ap: 'proposé', cls: 'ia' }); });
  L.forEach(function (x) { lignes.push({ k: 'l:' + x.i, t: maj1(x.x.mot), s: 'l. ' + x.x.ligne + ' · ' + (NOM_LECTURE[x.x.type] || x.x.type), ap: NOM_LECTURE[x.x.type] || x.x.type, cls: x.x.type }); });
  lignes.forEach(function (x) { on[x.k] = true; });
  var bOk = h('button', { type: 'button', class: 'p5-b plein' }), maj = function () { var n = lignes.filter(function (x) { return on[x.k]; }).length; bOk.textContent = 'Tout accepter (' + n + ')'; };
  var cr = r0(c);
  ouvrirFeuille([h('div', { class: 'p5-note' }, h('div', null, a.texte), h('small', null, 'ta note · ' + p5quand(a.quand))),
    h('div', { class: 'p5-rg' }, h('span', { class: 'icb' }, sv(icDe(c))), h('span', null, h('b', null, titreCourt(c)), h('small', { class: 'ia' }, '✦ ' + (cr || 'rangée ici'))), h('button', { type: 'button', class: 'p5-b', onclick: function () { fermerFeuille(); changerDeCarnet(c, a); } }, 'Changer')),
    lignes.length ? h('div', { class: 'p5-k ia' }, sv('ia'), ' ' + lignes.length + ' CHANGEMENT' + (lignes.length > 1 ? 'S PROPOSÉS' : ' PROPOSÉ')) : h('div', { class: 'p5-k' }, 'Rien d’autre à changer'),
    lignes.map(function (x) {
      var cb = h('button', { type: 'button', class: 'p5-cb on', role: 'checkbox', 'aria-checked': 'true', 'aria-label': x.t, onclick: function () { on[x.k] = !on[x.k]; cb.classList.toggle('on', on[x.k]); cb.setAttribute('aria-checked', String(on[x.k])); maj(); } }, sv('coche'));
      return h('div', { class: 'p5-chl r3' }, cb, h('span', { class: 't' }, h('b', null, x.t), h('small', null, x.s)), h('span', { class: 'av' }, x.av ? h('s', null, x.av) : null, x.av ? ' → ' : null, h('i', { class: 'ap ' + x.cls }, x.ap)));
    }),
    h('div', { class: 'p5-acts' }, bOk, h('button', { type: 'button', class: 'p5-b', onclick: function () {
      c.org = a.orgAvant; c.etat = a.etatAvant; sauver(); geste('juste la note', a.texte); fermerFeuille(); rendreListe(); toast('Gardé : juste la note');
    } }, 'Juste la note')),
    h('div', { class: 'p5-rass' }, 'Rien n’est changé sans ton OK.')]);
  bOk.addEventListener('click', function () {
    etat.courant = c.id;
    lignes.forEach(function (x) {
      if (x.k === 'etat') { if (!on[x.k]) { c.etat = a.etatAvant; o.garde.etat = false; } }
      else if (x.k.slice(0, 2) === 'p:') { if (on[x.k]) garder(x.k.slice(2), true); else refuser(x.k.slice(2), true); }
      else if (!on[x.k]) o.lecturesOff.push(+x.k.slice(2));
    });
    etat.courant = null; sauver(); geste('tout accepter', a.texte); fermerFeuille(); rendreListe(); toast('Rangé dans ' + titreCourt(c));
  });
  maj();
}
function r0(c) { var r = c.org && c.org.rep; return r ? (r.resume || '').toLowerCase() : ''; }
function changerDeCarnet(c, a) {
  ouvrirFeuille([h('h2', null, 'Déplacer ta note'), reels().filter(function (x) { return x !== c && x.etat !== 'resolu'; }).map(function (x) {
    return h('button', { type: 'button', class: 'm4b-mi', onclick: function () {
      var d = document.createElement('div'); d.innerHTML = c.html; var last = d.lastElementChild; if (last && last.textContent === a.texte) last.remove(); c.html = d.innerHTML;
      var e = document.createElement('div'); e.innerHTML = x.html || ''; var p = document.createElement('div'); p.textContent = a.texte; e.appendChild(p); x.html = e.innerHTML; x.maj = new Date().toISOString();
      if (a.orgAvant) c.org = a.orgAvant; c.etat = a.etatAvant; p5att = { id: x.id, texte: a.texte, quand: a.quand, orgAvant: x.org, etatAvant: x.etat, ligne: e.children.length };
      sauver(); fermerFeuille(); enFile(x); rendreListe(); toast('Déplacée dans ' + titreCourt(x));
    } }, h('span', { class: 'p4-mi-e' }, sv(icDe(x))), h('span', null, h('b', null, titreCourt(x))));
  })]);
}

/* ---------------------------------------------------------------- le carnet : en-tête, bascule, tampon ✦ */
function enteteP5() {
  var c = courant(); if (!c) return;
  var k = catDe(c), ct = $('p5-cat'); ct.textContent = ''; ct.appendChild(sv(icDe(c))); ct.appendChild(h('span', null, k.nom === SANS ? 'À ranger' : k.nom + (k.sous ? ' › ' + k.sous : '')));
  var nl = lignesDe(c).filter(function (x) { return x.trim(); }).length, tn = $('t-notes'), to = $('t-org');
  tn.textContent = ''; tn.appendChild(sv('crayon')); tn.appendChild(document.createTextNode(' Mes notes ')); tn.appendChild(h('span', { class: 'n' }, String(nl)));
  to.textContent = ''; to.appendChild(sv('ia')); to.appendChild(document.createTextNode(' Organisé'));
  var badge = estEnLecture(c) ? ['en cours', 'ia'] : (c.orgErreur && (!c.org || new Date(c.orgErreur.quand) > new Date(c.org.quand))) ? ['non lu', 'bad'] : c.attente ? ['hors ligne', 'bad'] :
    (c.org && lignesDe(c).join('\n') !== c.org.lignes.join('\n')) ? ['à ranger', 'ia'] : null;
  if (badge) to.appendChild(h('span', { class: 'bd ' + badge[1] }, badge[0]));
  var tp = $('p5-tampon'); tp.textContent = ''; tp.hidden = !c.org;
  if (c.org) { tp.classList.toggle('fort', fortP5(c)); tp.appendChild(h('i', null, fortP5(c) ? '✦ IA forte ' : '✦ ')); tp.appendChild(document.createTextNode(p5tampon(c.org.quand) + ' ')); tp.appendChild(sv('annule')); var n = aGarder(c).length; if (n) tp.appendChild(h('b', { class: 'n' }, String(n))); }
  var st = $('p5-sous-t'); st.hidden = !(c.etat === 'resolu' && c.org && c.org.rep.relecture); st.textContent = st.hidden ? '' : 'résolu le ' + p5j(c.etatPar ? c.etatPar.le : c.maj) + ' · ' + texteJours(joursDe(new Date(c.etatPar ? c.etatPar.le : c.maj)));
}
function rendrePoint() { var c = courant(); if (!c) return; enteteP5(); litP5(); }
$('p5-tampon').addEventListener('click', function () { feuilleChangements(); });
$('p5-cat').addEventListener('click', function () { var c = courant(); if (c) feuilleRanger(c); });
function rendreMeta() {
  var c = courant(), m = $('meta'); m.textContent = '';
  var cree = new Date(c.cree);
  m.appendChild(h('i', { class: 'pt ' + c.etat })); m.appendChild(h('b', { class: 'et ' + c.etat }, NOM_ETAT[c.etat]));
  m.appendChild(h('span', null, ' · ' + p5j(cree) + ' · ' + texteJours(joursDe(cree))));
  if (!navigator.onLine) m.appendChild(h('span', { class: 'att' }, ' · hors ligne, gardé ici'));
  enteteP5(); litP5();
}
/* L'IA lit (S-ia-lit, v03) : une carte, Arrêter ; pas de fausse progression ligne à ligne */
function litP5() {
  var c = courant(), b = $('p5-lit-n'); if (!c) return; b.textContent = '';
  var lit = estEnLecture(c); b.hidden = !lit; if (!lit) return;
  var n = lignesDe(c).filter(function (x) { return x.trim(); }).length, moi = lecture && lecture.carnetId === c.id;
  b.appendChild(h('div', { class: 'p5-litc', role: 'status' }, h('div', { class: 'g' }, h('b', null, sv('ia'), moi ? ' L’IA lit tes ' + n + ' lignes' : ' L’IA lira tes ' + n + ' lignes juste après'), h('span', { class: 'barre' }, h('i')), h('small', null, n + ' lignes · depuis ' + hm(new Date(c.maj)))),
    h('button', { type: 'button', class: 'p5-b ia', onclick: arreter }, 'Arrêter')));
}

/* ---------------------------------------------------------------- barre du pouce (champ, ✦, +) et onglets */
function rendreIcs() {
  var c = courant(); ics.textContent = '';
  champ.placeholder = c ? 'Ajouter à ' + titreCourt(c).split(/\s+/)[0] + '…' : 'Ajouter…';
  ics.appendChild(h('button', { type: 'button', class: 'p5-oi', 'aria-label': 'Photo', onclick: choisirPhoto }, sv('photo')));
  ics.appendChild(h('button', { type: 'button', class: 'p5-oi', 'aria-label': 'Dicter', onclick: function () { if (dictee) basculerDictee(); else toast('La dictée n’est pas branchée ici'); } }, sv('micro')));
  var lit = c && estEnLecture(c);
  var bia = $('p5-ia-o'); bia.textContent = ''; bia.className = 'p5-ia' + (lit ? ' cours' : ''); bia.appendChild(sv('ia')); if (lit) bia.appendChild(document.createTextNode(' en cours'));
}
(function () {
  var p = $('pied-org'); p.className = 'p5-pouce'; p.textContent = '';
  var lab = h('label', { class: 'p5-champ' }, pourEl, champ, ics, envoi);
  p.appendChild(lab); p.appendChild(h('button', { type: 'button', class: 'p5-ia', id: 'p5-ia-o', 'aria-label': 'Suggestions de l’IA', onclick: function () { if (!estEnLecture(courant())) aide(); } }));
  p.appendChild(h('button', { type: 'button', class: 'p5-plus', 'aria-label': 'Ajouter', onclick: function () { if (champ.value.trim()) envoyerAjout(); else champ.focus(); } }, sv('plus')));
  $('p5-ics-l').appendChild(h('button', { type: 'button', class: 'p5-oi', 'aria-label': 'Photo', 'data-leg': 'photo : dans un carnet' }, sv('photo')));
  $('p5-ics-l').appendChild(h('button', { type: 'button', class: 'p5-oi', 'aria-label': 'Dicter', 'data-leg': 'dictée : dans un carnet' }, sv('micro')));
  $('p5-ia-l').appendChild(sv('ia')); $('p5-ia-l').addEventListener('click', function () { toast('✦ Suggestions : ouvre un carnet'); });
  $('nouveau').appendChild(sv('plus')); $('b-retour').appendChild(sv('ret')); $('k-menu').appendChild(sv('menu')); $('p5-loupe').appendChild(sv('loupe'));
  var on = $('p5-onglets');
  [['bord', 'Bord'], ['finances', 'Finances'], ['cal', 'Calendrier'], ['brassins', 'Brassins'], ['stocks', 'Stocks'], ['clients', 'Clients']].forEach(function (x) {
    on.appendChild(h('button', { type: 'button', class: x[0] === 'stocks' ? 'on' : '', 'data-leg': x[0] === 'stocks' ? null : x[1] + ' : hors du jouable', onclick: x[0] === 'stocks' ? function () { if (courant()) fermer(); } : null }, sv(x[0]), h('span', null, x[1])));
  });
  $('p5-avenir-t').addEventListener('click', feuilleAVenir);
})();

/* ---------------------------------------------------------------- Organisé */
function lgn(n, cit, etiq) { return n ? h('button', { type: 'button', class: 'p5-l', onclick: vers(n, cit, etiq || cit) }, 'l. ' + n + ' ›') : null; }
function k(t, sous) { return h('div', { class: 'p5-k' }, h('b', null, t), sous ? h('span', null, sous) : null); }
function tuile(cls, icn, lab, val, sous, f) { return h(f ? 'button' : 'div', { type: f ? 'button' : null, class: 'p5-tu ' + (cls || ''), onclick: f || null }, h('span', { class: 'lab' }, icn ? sv(icn) : null, lab), h('b', { class: 'v' }, val), sous ? h('span', { class: 'so' }, sous) : null); }
function rendreOrg() {
  var c = courant(); if (!c) return;
  c.miens = c.miens || []; if (c.org) { c.org.artRet = c.org.artRet || []; c.org.artEcart = c.org.artEcart || []; } org.textContent = ''; zone.textContent = ''; zone.hidden = true; LOC = c.org ? lectureLocale(c) : { manques: {} };
  enteteP5(); litP5(); rendreIcs();
  if (estEnLecture(c)) org.appendChild($('p5-lit-n').cloneNode(true)).hidden = false;
  if (org.firstChild) { var ba = org.firstChild.querySelector('button'); if (ba) ba.onclick = arreter; }
  var cleV = p5vueC ? p5vueC.id + ':' + p5vueC.art : ''; if (cleV !== rendreOrg.v) { rendreOrg.v = cleV; $('defil').scrollTop = 0; }
  if (p5vueC && p5vueC.id === c.id && c.org && c.org.rep.comparaison) { if (p5vueC.art != null) articleP5(c); else comparerP5(c); return; }
  p5vueC = null; document.body.classList.remove('p5-plein');
  var o = c.org, r = o && o.rep;
  if (!navigator.onLine || c.attente) org.appendChild(h('div', { class: 'p5-err hors' }, h('div', null, h('b', null, 'Hors ligne'), h('small', null, (c.attente ? '1 note en file · ' : '') + (o ? 'lu ' + p5quand(o.quand) + ' · ' : '') + 'l’IA relira au retour du réseau'))));
  if (c.orgErreur && (!o || new Date(c.orgErreur.quand) > new Date(o.quand)) && !estEnLecture(c)) { echecP5(c); if (!o) return; }
  if (!o) {
    if (!estEnLecture(c)) { org.appendChild(h('p', { class: 'p5-vide' }, 'Pas encore rangé. L’IA lit tes lignes et les range ici ; elle ne change pas une lettre de ton texte.')); org.appendChild(h('button', { type: 'button', class: 'p5-b plein large', onclick: ranger }, sv('ia'), ' Ranger avec l’IA')); }
    return;
  }
  if (c.etat === 'resolu') { resoluP5(c, r); feuilleAide(c); return; }
  var g = genreDe(c);
  if (r.comparaison) achatP5(c, r);
  else if (g === 'probleme' || r.options.length || r.pistes.length) problemeP5(c, r);
  else memoP5(c, r, g);
  feuilleAide(c);
}
function depuisTuile(c) { var d = new Date(c.cree); return tuile('', 'horloge', 'depuis', (-joursDe(d)) + ' j', p5j(d) + ' · ' + hm(d)); }
function problemeP5(c, r) {
  var o = c.org, lignes = o.lignes, ops = r.options, R = retenus(o);
  var priced = ops.filter(function (x) { return nb(x.cout) != null; });
  /* les tuiles : depuis, dernier pas, coût, prochaine */
  var Ls = r.lectures.filter(function (l, i) { return o.lecturesOff.indexOf(i) < 0 && l.type !== 'montant' && l.ligne > 1; }).sort(function (a, b) { return b.ligne - a.ligne; }), dp = Ls[0];
  var opAtt = ops.filter(function (x) { return x.attente; })[0];
  var t = h('div', { class: 'p5-tuiles' });
  t.appendChild(depuisTuile(c));
  if (dp) t.appendChild(tuile('pas ' + dp.type, dp.type === 'devis' || dp.type === 'contacte' ? 'tel' : dp.type === 'pas_trouve' ? 'q' : 'coche', 'dernier pas', maj1(dp.mot), h('span', null, (opAtt && quiDe(opAtt) ? maj1(quiDe(opAtt)) + ' · ' : ''), lgn(dp.ligne, dp.mot))));
  var est = ops.filter(function (x) { return nb(x.cout) != null; }), cout = R.length ? ops[R[0]] : est[0];
  var man = (r.manque || []).map(function (m) { return m.texte; });
  if (cout) t.appendChild(tuile(cout.estime && !R.length ? 'est' : '', 'panier', 'coût' + (cout.estime && !R.length ? ' · estimé' : ''), (cout.estime && !R.length ? '≈ ' : '') + cout.cout.replace(/\s*\?$/, ''), h('span', null, R.length ? ops.filter(function (x, i) { return i !== R[0] && nb(x.cout) != null; }).map(function (x) { return (quiDe(x) ? 'devis ' : '') + x.cout.replace(/s*CHF/, ''); }).join(' · ') + ' · ' : '', lgn(cout.ligne, cout.citation), man.length && !R.length ? ' · ' + man.join(' · ') : '')));
  else t.appendChild(tuile('inc', 'panier', 'coût', '?', man.join(' · ') || 'pas noté'));
  var tv = tacheVive(c), co = ops.filter(function (x) { return x.conseille; })[0], ptr = r.pistes.filter(function (p) { return p.statut === 'trouve'; })[0];
  var tt = tv || (o.garde.tache !== false ? r.tache : null); tv = tt;
  var pro = R.length ? (tt && !o.tacheFaite ? tt.titre : null) : co ? co.titre : tt && !o.tacheFaite ? tt.titre : null;
  if (!pro) t.appendChild(tuile('', 'coche', 'état', NOM_ETAT[c.etat], o.tacheFaite && tt ? '✓ ' + tt.titre.toLowerCase() : null));
  if (pro) t.appendChild(tuile('ia', 'ia', 'prochaine', pro, R.length || !co ? (tv && tv.quand ? (lireDate(tv.quand, c.maj) ? p5j(lireDate(tv.quand, c.maj).d) + ' · ' + texteJours(joursDe(lireDate(tv.quand, c.maj).d)) : tv.quand) : null) : h('span', null, '✦ ', ptr ? ptr.citation.split(/\s+/).slice(-2).join(' ') + ' · ' : '', ptr ? lgn(ptr.ligne, ptr.citation) : null), tv && !o.tacheFaite && (R.length || !co) ? function () { faireTache(c); } : null));
  org.appendChild(t);
  /* trouvé / pas trouvé */
  if (r.pistes.length) org.appendChild(h('div', { class: 'p5-tuiles' }, r.pistes.map(function (p) {
    var oui = p.statut === 'trouve';
    return h('button', { type: 'button', class: 'p5-tu ' + (oui ? 'ok' : 'pt'), onclick: vers(p.ligne, p.citation, p.texte) }, h('span', { class: 'lab' }, sv(oui ? 'coche' : 'q'), oui ? 'Trouvé' : 'Pas trouvé'), h('b', { class: 'v s' }, p.texte), h('span', { class: 'so' }, (oui ? p5d(c.maj) + ' ' + hm(new Date(c.maj)) : 'à vérifier') + ' · l. ' + p.ligne + ' ›'));
  })));
  /* le chemin : une couleur par piste */
  if (r.pistes.length || opAtt) {
    var racine = (lignes[0] || '').split(/[,;:]/).slice(-1)[0].trim() || lignes[0];
    org.appendChild(k('LE CHEMIN', 'une couleur par piste'));
    var ch = h('div', { class: 'p5-chemin' }, h('div', { class: 'rac' }, sv('goutte'), h('b', null, maj1(racine.length > 34 ? racine.slice(0, 33) + '…' : racine)), lgn(1, lignes[0] ? lignes[0].slice(0, 12) : '')));
    r.pistes.forEach(function (p) { var oui = p.statut === 'trouve'; ch.appendChild(h('button', { type: 'button', class: 'br ' + (oui ? 'ok' : 'pt'), onclick: vers(p.ligne, p.citation, p.texte) }, h('b', null, p.texte), h('i', { class: 'tr' }), h('span', { class: 'pil' }, oui ? 'trouvé' : 'à vérifier'))); });
    if (opAtt) ch.appendChild(h('button', { type: 'button', class: 'br at', onclick: vers(opAtt.attente.ligne, opAtt.attente.citation) }, h('b', null, maj1(quiDe(opAtt) || opAtt.titre)), h('i', { class: 'tr' }), h('span', { class: 'pil' }, opAtt.attente.citation.toLowerCase().replace(/\.$/, ''))));
    org.appendChild(ch);
  }
  /* décider (O-decider, v01) dès que deux options ont leur prix ; sinon « Pour régler » */
  if (priced.length >= 2 && priced.length === ops.length) deciderP5(c, r, ops);
  else if (ops.length) {
    org.appendChild(k('POUR RÉGLER', 'coût'));
    ops.forEach(function (op, i) {
      var qui = quiDe(op), moi = !qui && /^toi$/i.test(op.qui || 'toi'), n = nb(op.cout);
      org.appendChild(h('div', { class: 'p5-opt' + (R.indexOf(i) >= 0 ? ' ret' : '') },
        h('span', { class: 'icb ' + (moi ? 'cle' : 'tel') }, sv(moi ? 'cle' : 'tel')),
        h('button', { type: 'button', class: 't', onclick: vers(op.ligne, op.citation, op.titre) }, h('b', null, maj1(qui || op.titre)), h('small', null, op.citation ? '« ' + op.citation + ' » · l. ' + op.ligne + ' ›' : moi ? 'si je fais moi-même' : '')),
        h('span', { class: 'c' }, n != null ? h('b', { class: op.estime ? 'est' : '' }, (op.estime ? '≈ ' : '') + op.cout.replace(/\s*\?$/, '')) : h('b', null, op.attente ? 'devis ?' : 'prix ?'),
          h('small', null, n != null && op.estime ? (op.attente ? 'devis attendu' : 'estimé') : op.attente ? 'attendu ' + (-joursDe(new Date(c.maj))) + ' j' : 'pas noté'))));
    });
  }
  tachesP5(c, r);
  resoudreP5(c, r);
  if (r.conseil && !ops.length) org.appendChild(h('div', { class: 'p5-cons' }, sv('ia'), h('span', null, r.conseil)));
}
function deciderP5(c, r, ops) {
  var o = c.org, R = retenus(o), v = ops.map(function (x) { return nb(x.cout); }), mx = Math.max.apply(null, v), mn = Math.min.apply(null, v);
  org.appendChild(k(ops.map(function (x) { return (quiDe(x) || x.titre).toUpperCase(); }).join(' OU ')));
  org.appendChild(h('div', { class: 'p5-duo' }, ops.map(function (op, i) {
    var ret = R.indexOf(i) >= 0, moi = !quiDe(op);
    return h('button', { type: 'button', class: 'p5-dc' + (ret ? ' ret' : ''), 'aria-pressed': String(ret), 'aria-label': 'Retenir ' + op.titre + ', ' + op.cout, onclick: function () { retenirAnnulable(i); } },
      h('span', { class: 'lab' }, sv(moi ? 'cle' : 'tel'), ' ' + maj1(quiDe(op) || op.titre), ret ? h('i', { class: 'tag' }, 'retenu') : null),
      h('b', { class: 'v' }, op.cout.replace(/\s*\?$/, '')), h('span', { class: 'so' }, op.citation ? '« ' + op.citation + ' » · l. ' + op.ligne : ''),
      h('span', { class: 'bar' }, h('i', { style: 'width:' + Math.max(4, Math.round(v[i] / mx * 100)) + '%' })));
  })));
  if (mx > mn) org.appendChild(h('div', { class: 'p5-ecart' }, sv('coche'), ' ' + milliers(mx - mn) + ' CHF de moins · ' + (quiDe(ops[v.indexOf(mn)]) || ops[v.indexOf(mn)].titre).toLowerCase()));
  if (R.length) { var op = ops[R[0]]; org.appendChild(h('div', { class: 'p5-retenu' }, h('b', null, sv('coche'), ' Retenu : ' + (quiDe(op) || op.titre).toLowerCase() + ', ' + op.cout), op.citation ? h('q', null, '« ' + op.citation + ' »') : null, h('small', null, 'Retenir touché ' + p5quand(o.retenuLe)))); }
}
function tachesP5(c, r) {
  var o = c.org, t = r.tache;
  if (t && o.garde.tache === undefined && !o.tacheFaite) {
    var dq = t.quand && lireDate(t.quand, c.maj);
    org.appendChild(h('div', { class: 'p5-prop' }, h('span', { class: 'icb' }, sv('cal')), h('span', { class: 't' }, h('small', { class: 'ia' }, '✦ tâche · d’après « ' + (t.citation || t.titre) + ' »'), h('b', null, t.titre), dq ? h('small', null, p5j(dq.d) + ' · ' + texteJours(joursDe(dq.d))) : null),
      h('button', { type: 'button', class: 'p5-b plein', onclick: function () { etat.courant = c.id; garder('tache'); toast('Tâche gardée : ' + t.titre, 'Annuler', function () { delete o.garde.tache; sauver(); rendreOrg(); }); } }, 'Garder')));
  } else if (t && o.garde.tache !== false) {
    var dq2 = t.quand && lireDate(t.quand, c.maj);
    org.appendChild(h('div', { class: 'p5-tache' + (o.tacheFaite ? ' fait' : '') }, h('button', { type: 'button', class: 'p5-cb' + (o.tacheFaite ? ' on ok' : ''), role: 'checkbox', 'aria-checked': String(!!o.tacheFaite), 'aria-label': t.titre, onclick: function () { if (!o.tacheFaite) faireTache(c); else { o.tacheFaite = false; sauver(); rendreOrg(); rendreListe(); } } }, sv('coche')),
      h('span', { class: 't' }, h('b', null, t.titre), h('small', null, o.tacheFaite ? 'cochée' : dq2 ? p5j(dq2.d) + ' · ' + texteJours(joursDe(dq2.d)) : 'tâche · l. ' + t.ligne))));
  }
  (c.miens || []).filter(function (m) { return m.type === 'tache'; }).forEach(function (m) {
    org.appendChild(h('div', { class: 'p5-tache' + (m.fait ? ' fait' : '') }, h('button', { type: 'button', class: 'p5-cb' + (m.fait ? ' on ok' : ''), role: 'checkbox', 'aria-checked': String(!!m.fait), 'aria-label': m.texte, onclick: function () { m.fait = !m.fait; sauver(); rendreOrg(); rendreListe(); } }, sv('coche')), h('span', { class: 't' }, h('b', null, m.texte), h('small', null, m.ia ? '✦ aide de l’IA' : 'à toi'))));
  });
}
function resoudreP5(c, r) {
  var o = c.org; if (!((r.resolu || r.etatPropose === 'resolu') && o.garde.resolu === undefined && c.etat !== 'resolu')) return;
  var q = r.resolu || {};
  org.appendChild(h('div', { class: 'p5-resoudre' }, h('b', null, sv('ia'), ' ' + (q.question || 'Résolu ?')),
    q.citation ? h('q', null, '« ' + q.citation + ' »') : null, q.ligne ? h('small', null, 'l. ' + q.ligne) : null,
    h('div', { class: 'p5-acts' }, h('button', { type: 'button', class: 'p5-b', onclick: function () { refuser('resolu'); } }, 'Pas encore'), h('button', { type: 'button', class: 'p5-b plein', onclick: function () { garder('resolu'); rendreListe(); } }, sv('coche'), ' Résolu'))));
}
/* Mémo, idée, planning (S-memo, v02) */
function memoP5(c, r, g) {
  var o = c.org, lignes = o.lignes, NOMS = { memo: 'Mémo · rien à faire', idee: 'Idée', planning: 'Planning', echeance: 'Mémo · échéance' };
  org.appendChild(h('div', { class: 'p5-memo-t' }, h('b', { class: 'ia' }, sv('ia'), ' ' + (NOMS[g] || 'Mémo')), h('button', { type: 'button', class: 'p5-b nu', onclick: feuilleChangements }, sv('horloge'), ' Changements')));
  var ch = r.chiffres || [];
  if (ch[0]) org.appendChild(h('button', { type: 'button', class: 'p5-fait', onclick: vers(ch[0].ligne, ch[0].valeur, ch[0].label) }, h('b', { class: 'v' + (ch[0].estime ? ' est' : '') }, (ch[0].estime ? '≈ ' : '') + ch[0].valeur), h('span', null, ch[0].label), h('i', { class: 'p5-l' }, 'l. ' + ch[0].ligne)));
  if (r.echeance) { var dd = lireDate(r.echeance.quand, c.maj); org.appendChild(h('div', { class: 'p5-ech' }, sv('cal'), h('span', null, h('b', null, (r.echeance.quoi || 'Échéance') + (dd ? ' ' + p5j(dd.d) : ' ' + r.echeance.quand)), h('small', null, dd ? texteJours(joursDe(dd.d)) : '')), lgn(r.echeance.ligne, r.echeance.quand))); }
  (r.attention || []).forEach(function (a) { org.appendChild(h('div', { class: 'p5-faible' }, h('b', null, sv('q'), ' point faible'), h('span', null, a.texte), lgn(a.ligne, a.citation, a.texte))); });
  ch.slice(1).forEach(function (x) { org.appendChild(h('div', { class: 'p5-faible info' }, h('b', null, x.label || 'chiffre'), h('span', null, (x.estime ? '≈ ' : '') + x.valeur), lgn(x.ligne, x.valeur))); });
  tachesP5(c, r);
  org.appendChild(k('TES LIGNES, TELLES QUELLES'));
  org.appendChild(h('div', { class: 'p5-lignes' }, lignes.map(function (l, i) { return l.trim() ? h('button', { type: 'button', onclick: vers(i + 1, l.slice(0, 20), l) }, h('span', { class: 'i' }, String(i + 1)), h('span', null, l)) : null; })));
  var autres = reels().filter(function (x) { return x !== c && x.org && (x.org.rep.genre === 'memo' || x.org.rep.genre === 'idee') && x.etat !== 'resolu'; });
  if (autres.length) { org.appendChild(k('AUTRES MÉMOS')); autres.forEach(function (x) { org.appendChild(h('button', { type: 'button', class: 'p5-autre', onclick: function () { ouvrir(x.id); } }, h('span', { class: 'icb' }, sv(icDe(x))), h('span', null, h('b', null, titreCourt(x)), h('small', null, catDe(x).nom + (catDe(x).sous ? ' › ' + catDe(x).sous : '') + (x.org.rep.tache ? ' · ' + x.org.rep.tache.titre.toLowerCase() : ''))))); }); }
}
/* L'IA n'a pas pu lire (S-ia-echec, v01) : ses lignes gardées, ce que l'app lit seule */
function echecP5(c) {
  var e = c.orgErreur, lignes = lignesDe(c), nl = lignes.filter(function (x) { return x.trim(); }).length;
  org.appendChild(h('div', { class: 'p5-err', role: 'alert' }, h('div', null, h('b', null, 'L’IA n’a pas pu lire'), h('small', null, e.message + ' · ' + p5quand(e.quand) + ' · tes ' + nl + ' lignes sont gardées')),
    h('span', { class: 'p5-bts' }, h('button', { type: 'button', class: 'p5-b plein', onclick: function () { ranger(); } }, '↻ Réessayer'), h('button', { type: 'button', class: 'p5-b nu ia', onclick: function () { escalader(c); } }, sv('ia'), ' IA forte'))));
  if (c.org) return;
  var lus = []; lignes.forEach(function (l, i) { etiquettesLigne(l).forEach(function (x) { lus.push({ e: x, i: i + 1 }); }); });
  var m = lus.filter(function (x) { return x.e.sorte === 'montant'; })[0], est = m && /estimation|≈|environ/i.test(lignes[m.i - 1]);
  org.appendChild(h('div', { class: 'p5-tuiles t3' }, tuile('', null, '● état', NOM_ETAT[c.etat]), tuile('', 'horloge', 'ouvert', (-joursDe(new Date(c.cree))) + ' j', p5d(c.cree)),
    m ? tuile(est ? 'est' : '', null, 'coût · l. ' + m.i, (est ? '≈ ' : '') + m.e.texte) : tuile('inc', null, 'coût', '?')));
  org.appendChild(h('div', { class: 'p5-k' }, h('b', null, 'LU PAR L’APP SEULE'), h('span', { class: 'p5-sans' }, 'sans l’IA')));
  var NOMS = { pas_trouve: ['pas trouvé', 'q', 'pt'], contacte: ['prochaine', 'horloge', 'at'], montant: ['montant', 'panier', 'est'], trouve: ['trouvé', 'coche', 'ok'] };
  lus.filter(function (x) { return x.e.sorte !== 'montant'; }).forEach(function (x) { var N = NOMS[x.e.sorte] || [x.e.sorte, 'coche', '']; org.appendChild(h('button', { type: 'button', class: 'p5-lu ' + N[2], onclick: vers(x.i, null, x.e.texte) }, h('b', null, sv(N[1]), ' ' + N[0]), h('span', null, (function (l) { var k = j1Acc(l).indexOf(j1Acc(x.e.texte)), d = l.slice(0, k > 0 ? k : l.length).replace(/^pistess*:s*/i, '').split(/[;,]/).slice(-1)[0].trim(); return maj1(d.length > 3 ? d.slice(0, 32) : x.e.texte); })(lignes[x.i - 1] || '')), h('i', { class: 'p5-l' }, 'l. ' + x.i))); });
  org.appendChild(h('div', { class: 'p5-quand' }, sv('ia'), ' Options, cause et tâches : quand l’IA aura lu.'));
  org.appendChild(k('TES LIGNES · ' + p5j(c.maj).toUpperCase() + ' · ' + hm(new Date(c.maj))));
  org.appendChild(h('div', { class: 'p5-lignes' }, lignes.map(function (l, i) { return l.trim() ? h('div', null, h('span', { class: 'i' }, String(i + 1)), h('span', null, l)) : null; })));
}
/* Résolu (O-resolu, v01) et relecture « pourquoi » (O-relecture, v03, simple) */
function resoluP5(c, r) {
  var o = c.org, le = c.etatPar ? c.etatPar.le : c.maj, ret = retenus(o).map(function (i) { return r.options[i]; }).filter(Boolean), art = (o.artRet || []).map(function (i) { return r.comparaison && r.comparaison.articles[i]; }).filter(Boolean);
  var grace = art[0] ? art[0].nom : ret[0] ? ret[0].titre : r.pistes.filter(function (p) { return p.statut === 'trouve'; }).map(function (p) { return p.texte; })[0];
  org.appendChild(h('div', { class: 'p5-resolu' }, h('span', { class: 'rond' }, sv('coche')), h('div', null, h('b', null, 'Résolu · ' + p5j(le)), grace ? h('small', null, 'grâce à ' + grace) : null),
    h('button', { type: 'button', class: 'p5-b', onclick: function () { poserEtat(c, ret.length || art.length ? 'decide' : 'cherche'); } }, sv('annule'), ' Rouvrir'),
    h('div', { class: 'p5-tuiles t3' }, tuile('', null, 'depuis le ' + p5d(c.cree), Math.max(0, Math.round((new Date(le) - new Date(c.cree)) / 864e5)) + ' j'), tuile('', null, 'pistes', String(r.pistes.length)), tuile('', null, 'lignes', String(o.lignes.filter(function (x) { return x.trim(); }).length)))));
  if (r.relecture) relectureP5(c, r);
  var fermees = r.pistes.map(function (p) { return { t: p.texte, s: '« ' + p.citation + ' » · l. ' + p.ligne, tag: p.statut === 'trouve' ? 'la cause' : 'écarté', ok: p.statut === 'trouve', f: vers(p.ligne, p.citation, p.texte) }; });
  if (fermees.length) { org.appendChild(k('PISTES FERMÉES', 'avec leur raison')); fermees.forEach(function (x) { org.appendChild(h('button', { type: 'button', class: 'p5-ferme' + (x.ok ? ' ok' : ''), onclick: x.f }, h('span', null, h('b', null, x.t), h('small', null, x.s)), h('i', { class: 'tag' }, x.tag))); }); }
  var k2 = catDe(c), memes = reels().filter(function (x) { return x !== c && x.etat === 'resolu' && catDe(x).nom === k2.nom; });
  if (memes.length) { org.appendChild(k('RÉSOLUS', k2.nom)); memes.forEach(function (x) { org.appendChild(h('button', { type: 'button', class: 'p5-autre res', onclick: function () { ouvrir(x.id); } }, sv('coche'), h('b', null, titreCourt(x)), h('small', null, catDe(x).sous || ''))); }); }
}
function relectureP5(c, r) {
  var x = r.relecture;
  org.appendChild(h('div', { class: 'p5-pq' }, h('b', { class: 'ti' }, sv('ia'), ' Pourquoi tu as fait ça'), h('button', { type: 'button', class: 'ch', onclick: vers(x.choix.ligne, x.choix.citation, x.choix.texte) }, x.choix.texte, h('small', null, ' l. ' + x.choix.ligne + ' ›')),
    x.savais.length ? h('div', { class: 'p5-k' }, h('b', null, 'CE QUE TU SAVAIS ALORS')) : null,
    x.savais.map(function (s) { return h('button', { type: 'button', class: 'sv', onclick: vers(s.ligne, s.citation, s.texte) }, sv('coche'), h('span', null, s.texte), h('small', null, 'l. ' + s.ligne)); }),
    x.fait.length ? h('div', { class: 'p5-k' }, h('b', null, 'CE QUE TU AS FAIT')) : null,
    x.fait.map(function (s) { return h('button', { type: 'button', class: 'sv', onclick: vers(s.ligne, s.citation, s.texte) }, sv('cle'), h('span', null, s.texte), h('small', null, 'l. ' + s.ligne)); }),
    x.calcul ? h('div', { class: 'calc' }, h('b', null, x.calcul.valeur), h('small', null, ' calcul de l’app : ' + x.calcul.detail)) : null));
  org.appendChild(h('button', { type: 'button', class: 'p5-b large', onclick: function () { basculer('notes'); } }, sv('crayon'), ' Voir dans Mes notes'));
}

/* ---------------------------------------------------------------- achat : Organisé d'un achat (O-options-a), articles (h03-5/h06-5), Comparer (figé 17.11), article (h01-6), choisi (v09-3/g05-11) */
function prixDe(cp, a) { var k = principal(cp); var v = a.valeurs[k]; return v && nb(v.texte) != null ? nb(v.texte) : null; }
function principal(cp) { var k = -1; cp.criteres.forEach(function (x, i) { if (k < 0 && /prix|chf/i.test(x)) k = i; }); if (k < 0) k = 0; var p = -1; cp.criteres.forEach(function (x, i) { if (/pour \d|total/i.test(x)) p = i; }); return p >= 0 ? p : k; }
function nomCrit(t) { return String(t).replace(/^[^\wÀ-ÿ]+\s*/, ''); }
function classement(cp, k) { var vals = cp.articles.map(function (a, i) { return { i: i, v: nb(a.valeurs[k] && a.valeurs[k].texte) }; }); var ok = vals.filter(function (x) { return x.v != null; }).sort(function (a, b) { return a.v - b.v; }); return ok.concat(vals.filter(function (x) { return x.v == null; })); }
function achatP5(c, r) {
  var o = c.org, cp = r.comparaison, kp = principal(cp), cl = classement(cp, kp), A = cp.articles;
  o.artRet = o.artRet || []; o.artEcart = o.artEcart || [];
  var t = r.tache, dq = t && t.quand && (lireDate(t.quand, c.maj) || jourDuMois(t.quand));
  if (o.artRet.length) { choisiP5(c, r); return; }
  org.appendChild(h('div', { class: 'p5-besoin' }, sv('cal'), dq ? h('b', null, (t.titre === 'Choisir' ? 'Besoin avant ' : t.titre + ' · ') + p5j(dq.d)) : h('b', null, t ? t.titre : 'Achat'), dq ? h('span', null, ' · ' + texteJours(joursDe(dq.d))) : null, t ? lgn(t.ligne, t.citation) : null,
    h('button', { type: 'button', class: 'p5-n', onclick: function () { feuilleArticles(c); } }, A.length + ' offres')));
  org.appendChild(h('div', { class: 'p5-crit' }, sv('cible'), h('span', null, 'critère'), h('b', null, nomCrit(cp.criteres[kp]).toLowerCase()), h('i', { class: 'ia' }, '✦ proposé')));
  /* qui gagne quoi : une carte par critère qui a un gagnant */
  var cartes = cp.criteres.map(function (cr, i) { var g = cp.gagnant[i]; return g == null ? null : { cr: cr, a: A[g], v: A[g].valeurs[i].texte, i: i }; }).filter(Boolean).slice(0, 3);
  if (cartes.length) org.appendChild(h('div', { class: 'p5-gagne' }, cartes.map(function (x) { return h('button', { type: 'button', class: 'p5-gc', onclick: function () { p5vueC = { id: c.id, art: A.indexOf(x.a) }; rendreOrg(); } }, h('small', null, 'Gagne · ' + nomCrit(x.cr).toLowerCase()), h('b', null, x.a.nom), h('span', { class: 'ok' }, x.v)); }),
    cartes.length < 3 ? h('div', { class: 'p5-gc vide' }, h('small', null, 'Délai'), h('span', null, 'pas noté')) : null));
  org.appendChild(h('div', { class: 'p5-k' }, h('b', null, A.length + ' OFFRES · ' + nomCrit(cp.criteres[kp]).toUpperCase()), h('span', null, 'quantité · CHF')));
  var mx = Math.max.apply(null, cl.map(function (x) { return x.v || 0; }).concat([1]));
  cl.forEach(function (x, rang) {
    var a = A[x.i], ec = o.artEcart.indexOf(x.i) >= 0, gag = cp.gagnant[kp] === x.i, src = a.valeurs.some(function (v) { return v.source === 'lien'; });
    var connus = a.valeurs.filter(function (v) { return v.texte !== '?'; }).length;
    org.appendChild(h('button', { type: 'button', class: 'p5-off' + (ec ? ' ec' : ''), onclick: function () { p5vueC = { id: c.id, art: x.i }; rendreOrg(); } }, imageDe(c, a.ligne, 'pt'),
      h('span', { class: 't' }, h('b', null, a.nom, exDe(c, a)), h('small', null, src ? sv('lien') : sv('crayon'), src ? ' lu' : ' ta note', a.valeurs[0] && a.valeurs[0].texte !== '?' ? ' · ' + a.valeurs[0].texte : '')),
      h('span', { class: 'blocs', 'aria-label': connus + ' valeurs sur ' + a.valeurs.length }, a.valeurs.map(function (v) { return h('i', { class: v.texte === '?' ? '' : 'on' }); })),
      h('span', { class: 'c' }, x.v != null ? h('b', { class: gag ? 'ok' : '' }, a.valeurs[kp].texte.replace(/\s*CHF/, '')) : h('b', null, '—'), h('small', null, ec ? 'écarté' : a.valeurs[kp].detail ? a.valeurs[kp].detail : x.v == null ? 'manque' : ''))));
  });
  org.appendChild(h('div', { class: 'p5-acts' }, h('button', { type: 'button', class: 'p5-b ia', onclick: feuilleDemander }, sv('ia'), ' Demander les délais'), h('button', { type: 'button', class: 'p5-b plein', onclick: function () { p5vueC = { id: c.id }; geste('comparer', A.length + ' offres'); rendreOrg(); } }, 'Comparer les ' + A.length + ' ›')));
  tachesP5(c, r);
}
function feuilleArticles(c) {
  var r = c.org.rep, cp = r.comparaison, kp = principal(cp), cl = classement(cp, kp), o = c.org; o.p5veille = o.p5veille || {};
  ouvrirFeuille([h('div', { class: 'p5-fh' }, h('h2', null, 'Articles · ' + cp.articles.length), h('button', { type: 'button', class: 'p5-b nu', onclick: fermerFeuille }, '✕ Fermer')),
    h('div', { class: 'sous' }, sv('cible'), ' classés par ', h('b', null, nomCrit(cp.criteres[kp]).toLowerCase()), ', du moins au plus'),
    cl.map(function (x, rg) {
      var a = cp.articles[x.i], on = !!o.p5veille[x.i], sw = h('button', { type: 'button', class: 'p5-sw' + (on ? ' on' : ''), role: 'switch', 'aria-checked': String(on), 'aria-label': 'Veiller ' + a.nom, onclick: function () { o.p5veille[x.i] = !o.p5veille[x.i]; sauver(); sw.classList.toggle('on'); sw.setAttribute('aria-checked', String(!!o.p5veille[x.i])); geste('veille', a.nom); } });
      return h('div', { class: 'p5-art' }, h('span', { class: 'rg' }, String(rg + 1)), imageDe(c, a.ligne, 'pt'), h('button', { type: 'button', class: 't', onclick: function () { fermerFeuille(); p5vueC = { id: c.id, art: x.i }; rendreOrg(); } }, h('b', null, a.nom), h('small', null, a.valeurs.map(function (v, i) { return v.texte === '?' ? null : nomCrit(cp.criteres[i]) + ' ' + v.texte; }).filter(Boolean).slice(0, 2).join(' · '))),
        h('span', { class: 'c' }, h('b', null, x.v != null ? a.valeurs[kp].texte : '?'), h('span', { class: 'vl' }, sv('oeil'), ' veille ', sw)));
    })]);
}
function enteteVue(c, titre, sous) {
  document.body.classList.add('p5-plein');
  org.appendChild(h('button', { type: 'button', class: 'p5-retour', onclick: function () { var a = p5vueC; p5vueC = a && a.art != null && a.depuis === 'cmp' ? { id: c.id } : null; rendreOrg(); } }, sv('ret'), ' ' + titreCourt(c)));
  org.appendChild(h('h1', { class: 'p5-h1' }, titre)); if (sous) org.appendChild(h('div', { class: 'p5-h1s' }, sous));
}
function comparerP5(c) {
  var r = c.org.rep, cp = r.comparaison, o = c.org, A = cp.articles, kp = o.p5crit != null ? o.p5crit : principal(cp), cl = classement(cp, kp);
  var vis = cl.filter(function (x) { return o.artEcart.indexOf(x.i) < 0; }), ecs = cl.filter(function (x) { return o.artEcart.indexOf(x.i) >= 0; });
  enteteVue(c, 'Comparer', A.length + ' offres · classé par ' + nomCrit(cp.criteres[kp]).toLowerCase());
  /* classé par (h06-7) : on change de critère d'un toucher */
  org.appendChild(h('div', { class: 'p5-classe' }, cp.criteres.map(function (cr, i) { return h('button', { type: 'button', class: i === kp ? 'on' : '', onclick: function () { o.p5crit = i; sauver(); geste('classer par', cr); rendreOrg(); } }, i === kp ? sv('cible') : null, nomCrit(cr)); })));
  /* le classement en barres (h04-7) */
  var mx = Math.max.apply(null, vis.map(function (x) { return x.v || 0; }).concat([1]));
  org.appendChild(h('div', { class: 'p5-rk' }, h('div', { class: 'hd' }, h('b', null, nomCrit(cp.criteres[kp])), h('span', null, ' · moins = mieux'), h('i', { class: 'cr' }, 'critère')),
    vis.map(function (x, n) { var a = A[x.i], v = a.valeurs[kp]; return h('button', { type: 'button', class: 'l' + (n === 0 && x.v != null ? ' g' : ''), onclick: function () { p5vueC = { id: c.id, art: x.i, depuis: 'cmp' }; rendreOrg(); } }, h('span', null, (n + 1) + ' ' + a.nom), h('b', null, v.texte), h('i', { class: 'b' + (v.source === 'ia' && /≈|estim/.test(v.texte) ? ' est' : '') + (x.v == null ? ' inc' : ''), style: 'width:' + (x.v != null ? Math.max(6, Math.round(x.v / mx * 100)) : 100) + '%' })); })));
  /* côte à côte : les offres en colonnes, le meilleur en vert (g05-8, h04-7) */
  org.appendChild(h('div', { class: 'p5-k' }, h('b', null, 'Côte à côte'), h('span', null, 'le meilleur en vert')));
  var tab = h('table', { class: 'p5-cac' }), th = h('tr', null, h('th'));
  vis.forEach(function (x, n) { th.appendChild(h('th', null, h('small', null, (n + 1) + (n ? 'e' : 're')), h('button', { type: 'button', onclick: function () { p5vueC = { id: c.id, art: x.i, depuis: 'cmp' }; rendreOrg(); } }, A[x.i].nom))); });
  tab.appendChild(th);
  cp.criteres.forEach(function (cr, i) {
    var vals = vis.map(function (x) { return A[x.i].valeurs[i].texte; }), pareil = vals.every(function (v) { return v === vals[0]; }) && vals[0] !== '?';
    var tr = h('tr', { class: i === kp ? 'crit' : '' }, h('th', null, nomCrit(cr)));
    if (pareil && vis.length > 1) tr.appendChild(h('td', { colspan: String(vis.length), class: 'pareil' }, vals[0] + ' · pareil'));
    else vis.forEach(function (x) { var v = A[x.i].valeurs[i]; tr.appendChild(h('td', { class: (cp.gagnant[i] === x.i ? 'g' : '') + (v.texte === '?' ? ' inc' : '') }, v.texte === '?' ? '—' : v.texte, v.detail ? h('small', null, v.detail) : null)); });
    tab.appendChild(tr);
  });
  org.appendChild(h('div', { class: 'p5-cacw' }, tab));
  if (cp.compromis) org.appendChild(h('div', { class: 'p5-comp' }, h('b', null, 'Compromis : '), cp.compromis));
  (r.attention || []).forEach(function (a) { org.appendChild(h('div', { class: 'p5-faible' }, h('b', null, sv('q'), ' attention'), h('span', null, a.texte), lgn(a.ligne, a.citation, a.texte))); });
  if (ecs.length) { org.appendChild(k('Écartés · ' + ecs.length)); ecs.forEach(function (x) { org.appendChild(h('div', { class: 'p5-ecarte' }, h('b', null, A[x.i].nom), h('button', { type: 'button', class: 'p5-b nu', onclick: function () { ecarterArt(c, x.i); } }, 'Reprendre'))); }); }
}
function articleP5(c) {
  var r = c.org.rep, cp = r.comparaison, o = c.org, i = p5vueC.art, a = cp.articles[i], kp = principal(cp), cl = classement(cp, kp), rang = cl.map(function (x) { return x.i; }).indexOf(i);
  enteteVue(c, a.nom, (rang + 1) + (rang ? 'e' : 're') + ' sur ' + cp.articles.length + ' · ' + nomCrit(cp.criteres[kp]).toLowerCase());
  var L = liensDe(c).filter(function (l) { return l.ligne === a.ligne; })[0];
  org.appendChild(h('div', { class: 'p5-photo' }, imageDe(c, a.ligne, 'grand')));
  org.appendChild(h('div', { class: 'p5-src' }, L ? sv('lien') : sv('crayon'), L ? ' ' + hoteDe(L.url) + (lienEnLecture(c, L) ? ' · 🔗 en lecture' : ' · lu ' + jourLu(L.lu.lu)) : ' ta note', a.ligne ? lgn(a.ligne, a.citation, a.nom) : null, L ? actionsLien(c, L) : null));
  var v = a.valeurs[kp], vals = cl.filter(function (x) { return x.v != null; });
  org.appendChild(h('div', { class: 'p5-jauge' }, h('small', null, nomCrit(cp.criteres[kp])), h('b', null, v.texte), h('span', { class: 'pts' }, vals.map(function (x) { return h('i', { class: x.i === i ? 'ici' : '', style: 'left:' + (vals.length > 1 ? Math.round((x.v - vals[0].v) / ((vals[vals.length - 1].v - vals[0].v) || 1) * 92) : 0) + '%' }); })), h('small', null, rang === 0 && v.texte !== '?' ? 'le plus bas des ' + cp.articles.length : (rang + 1) + 'e sur ' + cp.articles.length)));
  org.appendChild(h('div', { class: 'p5-k' }, h('b', null, 'Caractéristiques'), h('span', null, L && L.lu ? 'lues sur la page' : 'de tes notes')));
  org.appendChild(h('div', { class: 'p5-carac' }, cp.criteres.map(function (cr, k2) { var x = a.valeurs[k2], rg = classement(cp, k2).map(function (y) { return y.i; }).indexOf(i); return h('div', { class: cp.gagnant[k2] === i ? 'g' : '' }, h('small', null, nomCrit(cr)), h('b', null, x.texte === '?' ? '—' : x.texte), x.texte !== '?' && nb(x.texte) != null ? h('i', null, ' ' + (rg + 1) + 'e') : null); })));
  var ch = o.artRet.indexOf(i) >= 0, ec = o.artEcart.indexOf(i) >= 0;
  org.appendChild(h('div', { class: 'p5-acts' }, h('button', { type: 'button', class: 'p5-b plein vert', onclick: function () { if (!ch) { o.p5choisiLe = new Date().toISOString(); } choisirArt(c, i); p5vueC = null; rendreOrg(); rendreListe(); } }, sv('coche'), ch ? ' Choisi' : ' Choisir · ' + a.nom),
    h('button', { type: 'button', class: 'p5-b', onclick: function () { ecarterArt(c, i); p5vueC = null; rendreOrg(); } }, ec ? 'Reprendre' : 'Écarter')));
  org.appendChild(h('div', { class: 'p5-part' }, 'Part dans À venir : ' + a.nom + (v.texte !== '?' ? ', ' + v.texte : '') + ', avec le pourquoi.'));
}
function choisiP5(c, r) {
  var o = c.org, cp = r.comparaison, kp = principal(cp), i = o.artRet[0], a = cp.articles[i], le = o.p5choisiLe || c.maj, cl = classement(cp, kp);
  var gagne = cp.criteres.map(function (cr, k2) { return cp.gagnant[k2] === i ? nomCrit(cr).toLowerCase() + ' ' + a.valeurs[k2].texte : null; }).filter(Boolean);
  org.appendChild(h('div', { class: 'p5-choisi' }, h('div', { class: 'hd' }, sv('coche'), h('b', null, 'Choisi le ' + p5d(le))),
    h('b', { class: 'nom' }, a.nom), h('small', null, a.valeurs.map(function (v, k2) { return v.texte === '?' ? null : v.texte; }).filter(Boolean).slice(0, 3).join(' · ')),
    h('div', { class: 'pq' }, h('b', null, 'Pourquoi : '), gagne.length ? 'le meilleur ' + gagne.join(' · ') + '.' : 'tes notes ne le disent pas.'),
    h('div', { class: 'cc' }, h('small', null, 'Ce qui comptait'), h('b', null, nomCrit(cp.criteres[kp]).toLowerCase())),
    o.p5avenir ? h('div', { class: 'p5-part' }, sv('cal'), ' Dans À venir depuis le ' + p5d(o.p5avenir), h('button', { type: 'button', class: 'p5-b nu', onclick: feuilleAVenir }, 'Voir ›')) :
      h('button', { type: 'button', class: 'p5-b plein vert large', onclick: function () { o.p5avenir = new Date().toISOString(); sauver(); geste('envoyer dans À venir', a.nom); rendreOrg(); rendreListe(); toast('Dans À venir : ' + a.nom, 'Annuler', function () { delete o.p5avenir; sauver(); rendreOrg(); rendreListe(); }); } }, sv('cal'), ' Envoyer dans À venir')));
  var autres = cl.filter(function (x) { return x.i !== i; });
  if (autres.length) { org.appendChild(h('div', { class: 'p5-k' }, h('b', null, 'Écartés ' + autres.length), h('span', null, 'et pourquoi'))); autres.forEach(function (x) { var b = cp.articles[x.i], d = x.v != null && prixDe(cp, a) != null ? x.v - prixDe(cp, a) : null; org.appendChild(h('div', { class: 'p5-ecarte' }, h('span', null, h('b', null, b.nom), h('small', null, d != null ? (d > 0 ? milliers(d) + ' de plus' : milliers(-d) + ' de moins') + ' · ' + nomCrit(cp.criteres[kp]).toLowerCase() : 'valeur manquante')), h('b', null, b.valeurs[kp].texte))); }); }
  org.appendChild(h('div', { class: 'p5-acts' }, h('button', { type: 'button', class: 'p5-b', onclick: function () { choisirArt(c, i); rendreListe(); } }, 'Changer d’avis')));
}
function aVenir() {
  var L = [];
  etat.carnets.forEach(function (c) { var o = c.org; if (o && o.p5avenir) { var a = o.rep.comparaison.articles[o.artRet[0]]; if (a) L.push({ c: c, t: 'Commander ' + a.nom, s: a.valeurs[principal(o.rep.comparaison)].texte, d: null }); } });
  aFaire().filter(function (x) { return !fictif(x.c) && x.d && joursDe(x.d) >= 0; }).forEach(function (x) { L.push({ c: x.c, t: maj1(x.t), s: titreCourt(x.c), d: x.d }); });
  return L;
}
function feuilleAVenir() {
  var L = aVenir(), sans = L.filter(function (x) { return !x.d; }), av = L.filter(function (x) { return x.d; });
  ouvrirFeuille([h('div', { class: 'p5-fh' }, h('h2', null, 'À venir · ' + L.length), h('button', { type: 'button', class: 'p5-b nu', onclick: fermerFeuille }, '✕ Fermer')),
    sans.length ? h('div', { class: 'p5-k' }, h('b', null, 'Sans date'), h('span', null, String(sans.length))) : null,
    sans.map(function (x) { return h('div', { class: 'p5-av1' }, h('small', null, 'Achats et charges · ajouté du carnet ' + titreCourt(x.c)), h('b', null, x.t), h('span', null, x.s), h('div', { class: 'p5-acts' }, h('button', { type: 'button', class: 'p5-b plein', 'data-leg': 'Fixer la date : dans le Calendrier' }, 'Fixer la date'), h('button', { type: 'button', class: 'p5-b', onclick: function () { fermerFeuille(); ouvrir(x.c.id); } }, 'Ouvrir le carnet'))); }),
    av.length ? h('div', { class: 'p5-k' }, h('b', null, 'Cette semaine et après')) : null,
    av.map(function (x) { return h('button', { type: 'button', class: 'p5-av2', onclick: function () { fermerFeuille(); ouvrir(x.c.id); } }, h('span', { class: 'd' }, p5j(x.d)), h('span', null, h('b', null, x.t), h('small', null, x.s)), sv('droite')); })]);
}

/* ---------------------------------------------------------------- Changé par l'IA (O-change, v05) */
function feuilleChangements() {
  var c = courant(), o = c && c.org; if (!o) return;
  var P = propositions(c), L = o.rep.lectures, k2 = o.rep.categorie, on = {}, lignes = [];
  if (k2) lignes.push({ cle: 'cat', ic: 'dossier', t: 'Rangé : ' + catDe({ org: o, cat: null, exemple: null }).nom + (catDe({ org: o, cat: null, exemple: null }).sous ? ' › ' + catDe({ org: o, cat: null, exemple: null }).sous : '') + ' · ' + (NOM_GENRE[o.rep.genre] || ''), s: 'genre et catégorie', l: 'l. 1 ›' });
  P.forEach(function (p) { lignes.push({ cle: 'p:' + p.cle, ic: p.cle === 'etat' ? 'coche' : p.cle === 'tache' || p.cle === 'quand' ? 'cal' : 'ia', t: p.label, s: o.garde[p.cle] === true ? (p.cle === 'etat' && c.etatPar && c.etatPar.par !== 'toi' ? 'mis par l’IA' : 'gardé par toi') : o.garde[p.cle] === false ? 'décoché' : 'proposé' }); });
  L.forEach(function (l, i) { lignes.push({ cle: 'l:' + i, ic: l.type === 'pas_trouve' ? 'q' : l.type === 'contacte' ? 'tel' : l.type === 'montant' ? 'panier' : l.type === 'date' ? 'cal' : 'coche', t: maj1(NOM_LECTURE[l.type] || l.type) + ' : ' + l.mot, s: '« ' + l.mot + ' »', l: 'l. ' + l.ligne + ' ›', ligne: l.ligne, mot: l.mot }); });
  lignes.forEach(function (x) { on[x.cle] = x.cle === 'cat' ? !c.p5catOff : x.cle.slice(0, 2) === 'p:' ? o.garde[x.cle.slice(2)] !== false : o.lecturesOff.indexOf(+x.cle.slice(2)) < 0; });
  var bG = h('button', { type: 'button', class: 'p5-b plein' }), maj = function () { var n = 0; lignes.forEach(function (x) { if (on[x.cle]) n++; }); bG.textContent = 'Garder ' + n + ' sur ' + lignes.length; };
  var corps = [h('div', { class: 'p5-fh' }, h('h2', null, h('i', { class: 'ia' }, '✦ '), 'Changé par l’IA · ' + lignes.length), h('span', { class: 'q' }, p5d(o.quand) + ' ' + hm(new Date(o.quand)))),
    h('div', { class: 'sous' }, 'Décoche ce que tu ne veux pas. ', sv('cadenas'), ' = lecture corrigée. Tes notes ne bougent pas.')];
  lignes.forEach(function (x) {
    var row = h('div', { class: 'p5-chl' + (on[x.cle] ? '' : ' off') });
    var cb = h('button', { type: 'button', class: 'p5-cb' + (on[x.cle] ? ' on' : ''), role: 'checkbox', 'aria-checked': String(on[x.cle]), 'aria-label': x.t, onclick: function () { on[x.cle] = !on[x.cle]; cb.classList.toggle('on', on[x.cle]); row.classList.toggle('off', !on[x.cle]); cb.setAttribute('aria-checked', String(on[x.cle])); sm.textContent = on[x.cle] ? x.s : 'décoché'; maj(); } }, sv('coche'));
    var sm = h('small', null, on[x.cle] ? x.s : 'décoché');
    row.appendChild(cb); row.appendChild(h('span', { class: 'ic' }, sv(x.ic))); row.appendChild(h('span', { class: 't' }, h('b', null, x.t), sm));
    if (x.l) row.appendChild(h('button', { type: 'button', class: 'p5-l', onclick: x.ligne ? function () { fermerFeuille(); allerLigne(x.ligne, x.mot, x.mot); } : null }, x.l));
    corps.push(row);
  });
  if (o.fausses) corps.push(h('div', { class: 'p5-chl lock' }, h('span', { class: 'p5-cb lk' }, sv('cadenas')), h('span', { class: 'ic' }, sv('q')), h('span', { class: 't' }, h('b', null, o.fausses + (o.fausses > 1 ? ' citations retirées' : ' citation retirée')), h('small', null, 'pas dans tes notes : erreur corrigée'))));
  corps.push(h('div', { class: 'p5-relire' }, h('span', null, 'Lu ' + (fortP5(c) ? 'par l’IA forte' : 'par l’IA') + ' · ' + p5quand(o.quand)), h('button', { type: 'button', class: 'p5-b nu', onclick: function () { fermerFeuille(); ranger(); } }, '↻ Relire'), h('button', { type: 'button', class: 'p5-b nu ia', onclick: function () { fermerFeuille(); escalader(c); } }, sv('ia'), ' Escalader à l’IA')));
  corps.push(h('div', { class: 'p5-acts' }, h('button', { type: 'button', class: 'p5-b', onclick: avantIA }, sv('annule'), ' Annuler le reste'), bG));
  maj(); ouvrirFeuille(corps);
  bG.addEventListener('click', function () {
    P.forEach(function (p) { if (on['p:' + p.cle]) garder(p.cle, true); else refuser(p.cle, true); });
    var off = []; L.forEach(function (l, i) { if (!on['l:' + i]) { off.push(i); var lab = 'lecture : ' + l.mot; if (c.refus.indexOf(lab) < 0) c.refus.push(lab); } });
    o.lecturesOff = off; if (k2) { c.p5catOff = !on.cat; c.cat = on.cat ? null : { nom: SANS, sous: null }; }
    sauver(); geste('garder les changements', String(lignes.filter(function (x) { return on[x.cle]; }).length)); fermerFeuille(); rendreOrg(); rendreListe();
  });
  function avantIA() {
    if (o.etatAvant && (o.garde.etat === true || o.garde.resolu === true)) c.etat = o.etatAvant;
    c.org = c.orgPrec || null; c.orgPrec = null; c.orgErreur = null;
    sauver(); geste('avant l’IA', ''); fermerFeuille(); rendreOrg(); rendreListe();
  }
}

/* ---------------------------------------------------------------- 26.11 ~09:40, points 12 et 13 : vraies images, Relire et Escalader à l'IA */
function imageDe(c, ligne, cls) {
  var L = liensDe(c).filter(function (l) { return l.ligne === ligne; })[0], u = L && L.lu && typeof L.lu.image === 'string' && /^https:\/\//.test(L.lu.image) ? L.lu.image : null;
  if (u) return h('img', { class: 'p5-img ' + (cls || ''), src: u, alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' });
  return h('span', { class: 'p5-img ic ' + (cls || '') }, sv(icDe(c)));
}
function relireLien(c, l) {
  c.p5relire = c.p5relire || {}; c.p5relire[l.id] = new Date().toISOString(); sauver();
  capDb.then(function (db) { if (!db) return; try { Promise.resolve(db.collection('demandes').doc(l.id).set({ url: l.url, carnet: titreDe(c), type: 'relire', quand: new Date().toISOString() })).catch(function () {}); } catch (e) {} });
  geste('relire un lien', l.url); toast('Lien demandé à relire · 🔗 en lecture'); rendreOrg();
}
function escalader(c) { c.p5fort = true; c.p5fortLe = new Date().toISOString(); sauver(); geste('escalader à l’IA forte', ''); etat.courant === c.id ? ranger() : enFile(c); toast('Relu par l’IA forte · un appel'); }
function lienEnLecture(c, l) { return !l.lu || (c.p5relire && c.p5relire[l.id] && (!l.lu.lu || new Date(l.lu.lu) < new Date(c.p5relire[l.id]))); }
function actionsLien(c, l) {
  return h('span', { class: 'p5-la' }, h('button', { type: 'button', class: 'p5-b nu', onclick: function () { relireLien(c, l); } }, '↻ Relire'), h('button', { type: 'button', class: 'p5-b nu ia', onclick: function () { escalader(c); } }, sv('ia'), ' Escalader'));
}
function fortP5(c) { return !!(c.org && c.p5fortLe && new Date(c.org.quand) >= new Date(c.p5fortLe)); }

/* « le 15 » : le prochain 15 du mois, compté depuis sa note */
function jourDuMois(q) { var m = String(q).match(/le (d{1,2})/); if (!m) return null; var a = new Date(); var d = new Date(a.getFullYear(), a.getMonth(), +m[1], 12); if (joursDe(d) < 0) d = new Date(a.getFullYear(), a.getMonth() + 1, +m[1], 12); return { d: d }; }
/* une offre notée « (exemple) » dans ses lignes porte la puce exemple */
function exDe(c, a) { var l = a.ligne && lignesDe(c)[a.ligne - 1]; return l && /(exemple)/i.test(l) ? exPuce() : null; }
