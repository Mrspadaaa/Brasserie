/* ====================================================================== amélioration 26.11 (cap-amelio/src/amelio.js)
   Couche posée dans la même portée que le jouable : les fonctions déclarées ici remplacent celles du même nom (hissées).
   Thème de l'app (COMMUN p5), arbre compact, pouce champ + ✦ + +, Comparer dédié, dates précises, images des liens, Relire et IA forte. */
var AM_P = {
  goutte: '<path d="M12 3c3.5 4.4 6 7.6 6 10.5a6 6 0 0 1-12 0C6 10.6 8.5 7.4 12 3z"/>',
  eclair: '<path d="M13 2 5 14h6l-1 8 8-12h-6z"/>',
  flocon: '<path d="M12 2v20M4 7l16 10M20 7 4 17"/>',
  bouteille: '<path d="M10 2h4v4l2 3v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3z M8 13h8"/>',
  sac: '<path d="M7 7h10l2 14H5z M9 7V5a3 3 0 0 1 6 0v2"/>',
  bouclier: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/>',
  cle: '<path d="M14.5 4a5 5 0 0 0-4.6 6.9L4 16.8V20h3.2l5.9-5.9A5 5 0 1 0 14.5 4z"/>',
  tel: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
  panier: '<path d="M3 5h2l2.5 11h11L21 8H6.2"/><circle cx="9" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  lien: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  photo: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  micro: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  ia: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  droite: '<path d="M9 6l6 6-6 6"/>', gauche: '<path d="M15 6l-6 6 6 6"/>', bas: '<path d="M6 9l6 6 6-6"/>',
  plush: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  loupe: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  coche: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  case: '<rect x="4" y="4" width="16" height="16" rx="3"/>',
  liste: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  epingle: '<path d="M9 4h6l-1 6 3 3H7l3-3z M12 13v7"/>',
  balance: '<path d="M12 4v16M7 20h10M5 8h14M5 8l-3 6a3 3 0 0 0 6 0zM19 8l-3 6a3 3 0 0 0 6 0z"/>',
  paquet: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4M12 11v10"/>',
  cuve: '<path d="M6 6h12v10a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4z M9 3v3M15 3v3M6 11h12"/>',
  bulles: '<circle cx="9" cy="15" r="3.2"/><circle cx="15.5" cy="8.5" r="2.5"/><circle cx="16.5" cy="17" r="1.6"/>',
  houblon: '<path d="M12 3c-3 2-5 5-5 9s2.5 8 5 9c2.5-1 5-5 5-9s-2-7-5-9z M7.5 10h9M7.5 15h9M12 3v18"/>',
  maison: '<path d="M4 11l8-7 8 7v9H4z M10 20v-5h4v5"/>',
  doc: '<path d="M6 3h9l4 4v14H6z M15 3v4h4M9 12h7M9 16h5"/>',
  flamme: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1.5 1 2.5 2 3 3 .5-2 0-4 0-6z"/>',
  drapeau: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  relire: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  alerte: '<path d="M12 4l9 16H3z M12 10v4M12 17h.01"/>',
  retour: '<path d="M9 14l-5-5 5-5M4 9h10a6 6 0 0 1 0 12h-3"/>',
  bord: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  fin: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M15 12.5h3M3 9h18"/>',
  brassin: '<path d="M7 4h10l-1 16H8z"/><path d="M17 8h2v6h-2"/>',
  stocks: '<circle cx="8" cy="15" r="4"/><circle cx="16" cy="15" r="4"/><circle cx="12" cy="8" r="4"/>',
  clients: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 7M21 20a6 6 0 0 0-4-5.6"/>'
};
function IC(n, s) { s = s || 16; return '<svg class="am-ic" viewBox="0 0 24 24" width="' + s + '" height="' + s + '" aria-hidden="true">' + (AM_P[n] || AM_P['case']) + '</svg>'; }
function icEl(n, s) { var d = document.createElement('span'); d.innerHTML = IC(n, s); return d.firstChild; }
var AM_SOUS = { 'Brassage': 'cuve', 'Fermentation': 'bulles', 'Conditionnement': 'bouteille', 'Matières premières': 'sac', 'Froid': 'flocon', 'Eau': 'goutte', 'Électricité': 'eclair', 'Rangement': 'paquet' };
var AM_CAT = { 'Brasserie': 'cuve', 'Local': 'maison', 'Administratif': 'doc', 'Événements': 'drapeau' };
function icCat(c) {
  var k = catDe(c), t = sansAccent(titreDe(c));
  if (/houblon|citra|nelson|mosaic/.test(t)) return 'houblon';
  if (/assurance/.test(t)) return 'bouclier';
  if (/chaudiere|vapeur|feu/.test(t) && !AM_SOUS[k.sous]) return 'flamme';
  return AM_SOUS[k.sous] || AM_CAT[k.nom] || 'case';
}
function icVerbe(t) {
  var s = sansAccent(t || '');
  if (/appel|contact|rappel|telephon/.test(s)) return 'tel';
  if (/achet|command|commander|panier/.test(s)) return 'panier';
  if (/compar|choisir/.test(s)) return 'balance';
  if (/verif|senti|gout|test|mesur|control/.test(s)) return 'loupe';
  if (/reserv|planif|date/.test(s)) return 'cal';
  if (/range|trier/.test(s)) return 'paquet';
  if (/repar|chang|regl|install|monter/.test(s)) return 'cle';
  if (/starter|levure|ferment/.test(s)) return 'bulles';
  if (/demand|offre|devis|ecrire/.test(s)) return 'doc';
  return 'case';
}
/* ---------- dates précises : comptées depuis aujourd'hui, jour juste, heure suisse ---------- */
var AM_J = ['di', 'lu', 'ma', 'me', 'je', 've', 'sa'];
function jcDe(d) { d = new Date(d); return AM_J[d.getDay()] + ' ' + d.getDate() + '.' + (d.getMonth() + 1); }
function relJ(n) { return n === 0 ? 'aujourd’hui' : n === 1 ? 'demain' : n > 0 ? 'dans ' + n + ' j' : 'en retard de ' + (-n) + ' j'; }
function partsCH(t) { var o = {}; try { new Intl.DateTimeFormat('fr-CH', { timeZone: 'Europe/Zurich', weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(t)).forEach(function (p) { o[p.type] = p.value; }); } catch (e) { var d = new Date(t); o = { weekday: AM_J[d.getDay()], day: String(d.getDate()), month: String(d.getMonth() + 1), hour: String(d.getHours()).padStart(2, '0'), minute: String(d.getMinutes()).padStart(2, '0') }; } return o; }
function quandCH(t, avecJour) { var p = partsCH(t), a = partsCH(Date.now()), hm0 = p.hour + ':' + p.minute; return (!avecJour && p.day === a.day && p.month === a.month) ? hm0 : p.weekday.slice(0, 2) + ' ' + p.day + '.' + p.month + ' ' + hm0; }
function dateHtml(dt) {
  if (!dt) return '';
  var cl = dt.j <= 2 ? 'urg' : dt.j <= 7 ? 'proche' : 'loin';
  return '<span class="am-d ' + cl + '">' + IC('cal', 14) + '<b>' + relJ(dt.j) + '</b> · ' + jcDe(dt.d) + '</span>' +
    (dt.warn ? '<span class="am-warn">' + IC('alerte', 14) + '« ' + esc(dt.plein) + ' » : le ' + jcDe(dt.d).slice(3) + ' est un ' + dt.warn + '</span>' : '');
}
function fmtN(n) { return Math.round(n).toLocaleString('fr-CH'); }
function fmt2(n) { return (Math.round(n * 100) / 100).toFixed(2); }
/* ---------- précision d'une valeur : trouvé (ses notes), estimé, pas noté, exemple ---------- */
function ligneDe(c, n) { var L = lignesDe(c); return n >= 1 && n <= L.length ? L[n - 1] : ''; }
function estExemple(c, n) { return /\(exemple\)/i.test(ligneDe(c, n)); }
function estEstime(c, n, v) { return /^[≈~]/.test(String(v || '')) || /estim|environ|\benv\.|à peu près|\bca\.?\s/i.test(ligneDe(c, n)); }
function exHtml(c, n) { return n && estExemple(c, n) ? '<span class="am-ex">exemple</span>' : ''; }
function valHtml(c, n, v, src) {
  if (v == null || v === '' || /^\?/.test(v)) return '<span class="am-pn"><i class="am-mv">?</i> pas noté</span>';
  if (estEstime(c, n, v)) return '<span class="am-est">≈ ' + esc(String(v).replace(/^[≈~]\s*/, '')) + '</span> <small>estimé</small>';
  return '<span class="c">' + esc(v) + '</span>' + (src === 'lien' ? ' <span class="am-lk">' + IC('lien', 13) + ' lu</span>' : '');
}
/* ---------- images des liens : liens/<id>.image, sinon une icône au trait ---------- */
function urlDeLigne(c, n) { var UL = c.org && c.org.urls || urlsParLigne(c); var U = n >= 1 && UL[n - 1]; return U && U.length ? U[0] : null; }
function imgDe(c, n) { var u = n && urlDeLigne(c, n), d = u && lienLu(idLien(u)); return d && typeof d.image === 'string' && /^https:\/\//.test(d.image) ? d.image : null; }
function tuile(c, n, ic, cls) { var im = imgDe(c, n); return '<span class="am-tuile' + (cls ? ' ' + cls : '') + '">' + (im ? '<img src="' + esc(im) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : IC(ic || icCat(c), 20)) + '</span>'; }

/* ====================================================================== liste */
function rendreListe() {
  var l = $('liste'), y = l.scrollTop; l.textContent = '';
  var n = { note: 0, cherche: 0, decide: 0, resolu: 0 }; etat.carnets.forEach(function (c) { n[c.etat] = (n[c.etat] || 0) + 1; });
  var items = aFaire(), arbre = etat.vueListe !== 'afaire';
  var ap = document.querySelector('.am-app');
  if (ap) {
    ap.innerHTML = '<span class="am-logo">A</span><h1>Carnets</h1><span class="n">' + etat.carnets.length + '</span>' +
      '<button type="button" class="am-tog" data-x="tog" aria-pressed="' + !arbre + '"><span class="pil">' + (arbre ? IC('case', 16) + 'À faire <b>' + items.length + '</b>' : IC('liste', 16) + 'Arbre') + '</span></button>';
    var oe = document.querySelector('.am-oeil'), pl = function (k, un, plus) { return n[k] > 1 ? plus : un; };
    oe.innerHTML = '<span class="cherche"><i></i><b>' + n.cherche + '</b> je cherche</span><span class="decide"><i></i><b>' + n.decide + '</b> ' + pl('decide', 'décidé', 'décidés') + '</span>' +
      '<span class="note"><i></i><b>' + n.note + '</b> ' + pl('note', 'noté', 'notés') + '</span><span class="resolu"><i></i><b>' + n.resolu + '</b> ' + pl('resolu', 'résolu', 'résolus') + '</span>';
  }
  if (arbre) rendreArbre(l); else rendreAFaire(l, items);
  l.appendChild(h('button', { type: 'button', class: 'am-rech', onclick: rechargerExemples }, 'Recharger les exemples'));
  l.scrollTop = y;
}
function rendreArbre(l) {
  var cats = {};
  etat.carnets.filter(function (c) { return c.etat !== 'resolu'; }).forEach(function (c) {
    var k = catDe(c), g = cats[k.nom] = cats[k.nom] || { sous: {}, direct: [] };
    if (k.sous) (g.sous[k.sous] = g.sous[k.sous] || []).push(c); else g.direct.push(c);
  });
  Object.keys(cats).sort(function (a, b) { return ordreCat(a) - ordreCat(b) || a.localeCompare(b, 'fr'); }).forEach(function (nom) {
    var g = cats[nom], ss = Object.keys(g.sous).sort(function (a, b) { return ordreSous(nom, a) - ordreSous(nom, b) || a.localeCompare(b, 'fr'); });
    var total = g.direct.length + ss.reduce(function (t, s) { return t + g.sous[s].length; }, 0), kc = 'c:' + nom, rc = replie(kc, false);
    var hd = h('button', { type: 'button', class: 'am-cat m4j-dn', 'data-cat': nom, 'aria-expanded': String(!rc), onclick: function () { replier(kc, false); } });
    hd.innerHTML = IC(AM_CAT[nom] || 'case', 16) + '<span>' + esc(nom) + '</span><span class="n">' + total + '</span><span class="chev">' + IC(rc ? 'droite' : 'bas', 16) + '</span>';
    l.appendChild(hd);
    if (rc) return;
    trierSeau(g.direct).forEach(function (c, i) { l.appendChild(ligneCarnet(c, i === 0 ? '' : null)); });
    ss.forEach(function (s) { trierSeau(g.sous[s]).forEach(function (c, i) { l.appendChild(ligneCarnet(c, i === 0 ? s : null)); }); });
  });
  var res = trierSeau(etat.carnets.filter(function (c) { return c.etat === 'resolu'; }));
  if (!res.length) return;
  var rr = replie('res', true);
  var b = h('button', { type: 'button', class: 'am-res', 'aria-expanded': String(!rr), onclick: function () { replier('res', true); } });
  b.innerHTML = IC('coche', 16) + '<b>' + res.length + ' résolus</b><span>· ' + esc(res.map(function (c) { return titreCourt(c).split(' ').slice(0, 2).join(' '); }).join(' · ')) + '</span>';
  l.appendChild(b);
  if (!rr) res.forEach(function (c) { l.appendChild(ligneCarnet(c, null)); });
}
/* une ligne par carnet ; la sous-catégorie se lit au-dessus du titre du premier carnet de son groupe (catégorie › sous-catégorie) */
function ligneCarnet(c, sous) {
  var p = prioDe(c), lit = estEnLecture(c), pro = !lit && prochaine(c), res = !lit && !pro && resumeDe(c), et = NOM_ETAT[c.etat] || 'Noté';
  var row = h('button', { type: 'button', class: 'am-r m4j-r ' + p + (sous != null ? ' prem' : ''), 'data-id': c.id, 'aria-label': titreCourt(c) + ' · ' + et + (pro ? ' · ' + relJ(pro.n) : res ? ' · ' + res : '') });
  var q = lit ? '<span class="q lit"><b>✦ lit…</b></span>' : pro ? '<span class="q ' + (pro.n < 0 ? 'passe' : pro.n <= 7 ? 'proche' : '') + '"><b>' + esc(pro.n < 0 ? 'retard ' + (-pro.n) + ' j' : pro.n === 0 ? 'auj.' : pro.n + ' j') + '</b>' + esc(jcDe(pro.d || Date.now())) + '</span>' : res ? '<span class="q res">' + esc(String(res).replace(/^« |»$/g, '')) + '</span>' : '';
  row.innerHTML = '<span class="ic">' + IC(icCat(c), 16) + '</span><span class="t">' + (sous ? '<span class="sc">' + esc(sous) + '</span>' : '') + '<span class="ti">' + esc(titreCourt(c)) + '</span></span>' +
    '<span class="am-barre ' + c.etat + '" title="' + esc(et) + '"><i></i><i></i><i></i><i></i></span>' + q + (c.orgNeuf ? '<i class="neuf" title="Organisé a du neuf"></i>' : '');
  brancherGlisse(row, c);
  return row;
}
function prochaine(c) {
  var o = c.org, r = o && o.rep; if (!r) return null; var best = null, q = [];
  if (r.echeance) q.push(r.echeance.quand);
  if (r.tache && r.tache.quand && !o.tacheFaite && o.garde.tache !== false) q.push(r.tache.quand);
  q.forEach(function (x) { var d = lireDateV7(x, c.maj); if (d && (!best || d.d < best.d)) best = d; });
  return best ? { n: joursDe(best.d), d: best.d, txt: dateCourte(best.d) } : null;
}
function rendreAFaire(l, items) {
  if (!items.length) { l.appendChild(h('p', { class: 'm4b-vide' }, 'Rien à faire pour l’instant.')); return; }
  items.forEach(function (x) {
    var n = x.d ? joursDe(x.d) : null, b = h('button', { type: 'button', class: 'am-af', onclick: function () { ouvrir(x.c.id); } });
    b.innerHTML = '<span class="am-tuile s">' + IC(icVerbe(x.t), 16) + '</span><span class="t"><b>' + esc(x.t) + '</b><small>' + esc(titreCourt(x.c)) + '</small></span>' +
      (x.d ? '<span class="q ' + (n < 0 ? 'passe' : n <= 7 ? 'proche' : '') + '"><b>' + esc(relJ(n)) + '</b>' + esc(jcDe(x.d)) + '</span>' : '');
    l.appendChild(b);
  });
}
function marquerCible(g) {
  nettoyerCibles(); g.cible = null;
  var el = document.elementFromPoint(g.x, g.y), t = el && el.closest && el.closest('.m4j-r,.m4j-dn');
  if (!t || t === g.row) return;
  if (t.classList.contains('m4j-r')) {
    var b = t.getBoundingClientRect(), av = g.y < b.top + b.height / 2;
    t.classList.add(av ? 'cible-av' : 'cible-ap'); g.cible = { type: 'r', id: t.getAttribute('data-id'), avant: av };
  } else if (t.getAttribute('data-cat')) { t.classList.add('cible'); g.cible = { type: 's', cat: t.getAttribute('data-cat'), sous: null }; }
}

/* ====================================================================== carnet : en-tête utile */
function majTete() {
  var c = courant(); if (!c || !amTitre) return;
  amTitre.textContent = titreCourt(c);
  var k = catDe(c); amLieu.innerHTML = IC(icCat(c), 13) + '<span>' + esc(k.sous || k.nom) + '</span>'; amLieu.setAttribute('aria-label', 'Ranger · ' + k.nom + (k.sous ? ' › ' + k.sous : ''));
  var o = c.org; amH.className = 'am-h' + (c.forte ? ' forte' : '');
  amH.innerHTML = o && o.quand ? IC('ia', 14) + (c.forte && new Date(o.quand) >= new Date(c.forte) ? '<b>IA forte</b> ' : '') + esc(quandCH(o.quand)) : '';
  amH.title = o && o.quand ? 'rangé par l’IA ' + quandCH(o.quand, true) : '';
}
function ouvrir(cid) {
  etat.courant = cid; sauver();
  var c = courant();
  $('v-liste').classList.remove('on'); $('v-carnet').classList.add('on');
  $('titre').textContent = c.titre || '';
  $('doc').innerHTML = c.html || '<div><br></div>';
  nettoyerDoc(); normaliser();
  c.miens = c.miens || []; cmpOuvert[c.id] = false; ajoutCrit = false;
  pour = null; pourEl.hidden = true; champ.value = ''; majAjout();
  if (c.org || c.orgErreur) basculer('org');
  else { basculer('notes', true); placerFin(); }
  majTete();
}
function basculer(v, sansFocus) {
  var c = courant(); fermerFlottants(); fermerAm();
  if (vue === 'org') defilOrg = $('defil').scrollTop;
  vue = v;
  $('t-notes').classList.toggle('on', v === 'notes'); $('t-org').classList.toggle('on', v === 'org'); $('t-org').classList.toggle('ia', v === 'org');
  $('p-notes').hidden = v !== 'notes'; $('p-org').hidden = v !== 'org';
  $('outils').hidden = v !== 'notes'; $('pied-org').hidden = v !== 'org';
  if (amAct) amAct.hidden = v !== 'org' || !amAct.innerHTML;
  if (v === 'org') {
    $('doc').blur(); $('titre').blur();
    if (c.orgNeuf) { c.orgNeuf = false; sauver(); }
    rendreOrg(); rendreIcs(); $('defil').scrollTop = 0;
  } else { rendreMeta(); calcLectures(); $('defil').scrollTop = 0; }
  rendrePoint(); rendreOutils(); majTete();
}

/* ====================================================================== pouce : champ toujours actif, ✦ suggestions, + */
function rendreIcs() {
  if (!amPouceOrg) {
    amPouceOrg = h('div', { class: 'am-pouce' });
    var ch = h('div', { class: 'am-champ' }); champ.parentNode.removeChild(champ); ch.appendChild(champ);
    var ph = h('button', { type: 'button', class: 'am-z', 'aria-label': 'Photo', onclick: choisirPhoto }); ph.innerHTML = IC('photo', 18);
    var mi = h('button', { type: 'button', class: 'am-z', 'aria-label': 'Dicter', onclick: function () { if (dictee) basculerDictee(); else toast('Dictée indisponible ici : le micro du clavier marche.'); } }); mi.innerHTML = IC('micro', 18);
    ch.appendChild(ph); ch.appendChild(mi);
    var ia = h('button', { type: 'button', class: 'am-carre ia v7-aidebtn', 'aria-label': 'Suggestions de l’IA', onclick: ouvrirAide });
    var pl = h('button', { type: 'button', class: 'am-carre act', 'aria-label': 'Ajouter', onclick: function () { if (champ.value.trim()) envoyerAjout(); else champ.focus(); } }); pl.innerHTML = IC('plus', 22);
    pl.addEventListener('pointerdown', function (e) { if (champ.value.trim()) e.preventDefault(); });
    amPouceOrg.appendChild(ch); amPouceOrg.appendChild(ia); amPouceOrg.appendChild(pl);
    $('pied-org').appendChild(amPouceOrg);
  }
  var c = courant(); champ.placeholder = c ? 'Ajouter à ' + titreCourt(c).split(' ').slice(0, 2).join(' ') + '…' : 'Ajouter…';
  majAideBtn(org.__D || null);
}
function majAjout() { /* le champ reste toujours actif ; + envoie */ }
function majAideBtn(D) {
  var b = document.querySelector('#pied-org .v7-aidebtn'); if (!b) return; var c = courant();
  var n = D ? D.aide.length : 0; b.disabled = !c || !c.org;
  b.innerHTML = IC('ia', 22) + (n ? '<span class="bd">' + n + '</span>' : '') + (c && c.aide && c.aide.enCours ? '<span class="pt"></span>' : '');
}
function feuilleAm(html, f) {
  fermerAm(); var app = $('app');
  var v = h('div', { class: 'am-voile', onclick: fermerAm }), s = h('div', { class: 'am-feuille', role: 'dialog' });
  s.innerHTML = '<div class="am-poignee"></div>' + html;
  s.addEventListener('click', function (e) { var b = e.target.closest('[data-x]'); if (b) f(b.dataset.x, b); });
  app.appendChild(v); app.appendChild(s); amF = [v, s];
}
function fermerAm() { if (amF) { amF.forEach(function (n) { n.remove(); }); amF = null; } }
/* ✦ de la liste : ce que l'IA suggère dans tous les carnets */
function suggestionsListe() {
  var t = $('noter').value.trim(), L = [];
  etat.carnets.forEach(function (c) {
    var r = c.org && c.org.rep; if (!r || c.etat === 'resolu') return;
    if (r.conseil && !c.org.conseilOff) L.push({ c: c, t: emoDe(r.conseil)[1] });
    if (r.tache && !r.tache.citation && c.org.garde.tache !== false) L.push({ c: c, t: r.tache.titre + ' (proposé)' });
  });
  feuilleAm('<h2>' + IC('ia', 18) + ' Suggestions de l’IA</h2><p class="info">Ce qu’elle propose dans tes carnets, d’après tes notes.</p>' +
    (t ? '<button class="am-fl ia" data-x="noter">' + IC('ia', 18) + '<span class="t">Ranger « ' + esc(t.slice(0, 40)) + ' » dans un carnet<small>l’IA titre et classe</small></span></button>' : '') +
    (L.length ? L.slice(0, 8).map(function (x) { return '<button class="am-fl" data-x="' + x.c.id + '"><span class="am-tuile s">' + IC(icCat(x.c), 16) + '</span><span class="t">' + esc(x.t) + '<small>' + esc(titreCourt(x.c)) + '</small></span>' + IC('droite', 16) + '</button>'; }).join('') : '<p class="info">Rien de plus pour l’instant.</p>'),
    function (x) { fermerAm(); if (x === 'noter') $('nouveau').click(); else ouvrir(x); });
}

/* ====================================================================== Organisé */
var cmpOuvert = {}, ajoutCrit = false, critSel = {};
function rendreOrg() {
  var c = courant(); if (!c) return;
  c.miens = c.miens || [];
  org.className = 'm4b-org v7o am-org';
  var enCours = estEnLecture(c), x = '';
  if (c.forteEnCours && c.org && new Date(c.org.quand) >= new Date(c.forte)) c.forteEnCours = false;
  majTete();
  if (enCours) x += '<div class="am-lit" role="status">' + IC('ia', 16) + '<span>' + (lecture && lecture.carnetId === c.id ? (c.forteEnCours ? 'L’IA forte relit ta note…' : 'L’IA lit ta note…') : 'L’IA lira ta note juste après') + '</span><span class="bar"><i></i></span></div>';
  if (!c.org) {
    org.innerHTML = x + (c.orgErreur || enCours ? sansIA(c, enCours && !c.orgErreur) : '<section class="am-ban"><b>Pas encore rangé</b><button class="am-b2" data-act="reessai">Ranger</button></section>' + sansIA(c, true));
    rendrePile(null); majAideBtn(null); act(''); return;
  }
  if (c.orgErreur && !enCours) x += '<section class="am-ban off">' + IC('alerte', 16) + '<b>IA absente · rangement d’avant</b><button class="am-b2" data-act="reessai">Réessayer</button></section>';
  if (new Date(c.maj) > new Date(c.org.quand) && !enCours && c.html !== '' && lignesDoc().join('\n') !== c.org.lignes.join('\n')) x += '<section class="am-ban">' + IC('relire', 16) + '<b>Ta note a changé</b><button class="am-b2" data-act="reessai">Relire</button></section>';
  var D = modele(c); org.__D = D;
  if (cmpOuvert[c.id] && D.comp && !D.comp.vide) { org.innerHTML = x + vueComparer(D); act(actCmp(D)); rendrePile(D); majAideBtn(D); return; }
  cmpOuvert[c.id] = false;
  x += heros(D);
  if (D.regle && !D.regle.propose && !detailOuvert[c.id]) {
    var nd = D.options.length + D.faits.length + D.pistes.length + D.liste.length + D.chiffres.length + (D.comp ? 1 : 0);
    if (D.retenir.length) x += secRetenir(D);
    if (nd) x += '<button class="am-cbtn" data-act="detail">' + IC('liste', 16) + 'Détail · ' + nd + '</button>';
  } else x += rangees(D);
  x += liensHtml(c, D);
  org.innerHTML = x;
  act(actHeros(D));
  rendrePile(D); majAideBtn(D);
}
function act(html) { if (!amAct) return; amAct.innerHTML = html; amAct.hidden = !html || vue !== 'org'; }
function B(a, label, p, attrs) { return '<button type="button" class="' + (p ? 'p' : 's') + '" data-act="' + a + '"' + (attrs || '') + '>' + label + '</button>'; }
function gagnant(C, o) {
  /* à quantité égale : le moins cher des offres qui couvrent le besoin, frais connus ; une offre sans prix ne bloque pas (dite « sans prix ») ; un exemple ne gagne jamais */
  if (!C.besoin) return null; var A = actifs(C, o), c = courant();
  var b = A.filter(function (a) { return a.total && !a.manque && !a.total.livInconnue && !estExemple(c, a.ligne); }).sort(function (x, y) { return x.total.chf - y.total.chf; })[0];
  return b && A.every(function (a) { return a === b || !a.total || a.manque || a.total.chf > b.total.chf; }) ? b : null;
}
function sansPrix(C, o) { return actifs(C, o).filter(function (a) { return !a.total; }).length; }
function actifs(C, o) { var E = o.ecartes || []; return C.arts.filter(function (a) { return E.indexOf(a.i) < 0; }); }
function actHeros(D) {
  var o = D.o, c = D.c, C = D.comp;
  if (D.regle) return D.regle.propose ? B('regle-oui', IC('coche', 18) + 'Réglé', 1) + B('regle-non', 'Pas encore') : B('rouvrir', IC('relire', 16) + 'Rouvrir');
  if (C && !C.vide && !D.tache) {
    if (o.choisi != null && C.arts[o.choisi]) { var a = C.arts[o.choisi];
      return o.commande ? B('decommander', 'Pas encore commandé') : B('commander', IC('coche', 18) + 'Commandé chez ' + esc(a.nom), 1) + B('tard', 'Plus tard') + B('rouvrir-choix', IC('relire', 16), 0, ' aria-label="Rouvrir le choix"'); }
    var gw = gagnant(C, o);
    return gw ? B('prendre', IC('coche', 18) + 'Prendre ' + esc(gw.nom), 1, ' data-i="' + gw.i + '"') + B('comparer', 'Comparer') : B('comparer', IC('balance', 18) + 'Comparer ' + actifs(C, o).length + ' offres', 1);
  }
  if (!D.tache && D.r.resolu && c.etat !== 'resolu' && o.garde.resolu === false) return B('reregle', IC('coche', 18) + 'Réglé', 1);
  if (!D.tache) return C && !C.vide ? B('comparer', IC('balance', 18) + 'Comparer ' + actifs(C, o).length + ' offres', 1) : '';
  if (o.tacheFaite) return B('defait', 'Pas fait');
  if (o.tard) return B('retour-tard', 'Reprendre');
  return B('fait', IC('coche', 18) + 'Fait', 1) + B('tard', 'Plus tard');
}
function heros(D) {
  var o = D.o, c = D.c, C = D.comp, ic = 'case', mot = '', sub = '', k = 'Prochaine étape', src = null, tag = '', cls = '', x = '';
  if (D.regle) { var g = D.regle; src = g; ic = 'coche'; cls = ' ok'; mot = g.mot; k = g.propose ? 'Réglé ?' : 'Réglé'; tag = g.propose ? '<span class="am-tag">' + IC('ia', 13) + 'proposé</span>' : ''; sub = D.date ? dateHtml(D.date) : ''; }
  else if (C && !C.vide && !D.tache) {
    if (o.choisi != null && C.arts[o.choisi]) { var a = C.arts[o.choisi]; src = a; ic = 'paquet'; k = o.commande ? 'Commandé' : 'Choisi';
      mot = (o.commande ? 'Commandé chez ' : 'Commander chez ') + a.nom; cls = o.commande ? ' ok' : '';
      sub = '<span class="am-pas">' + IC('coche', 13) + 'comparé › ' + IC('coche', 13) + 'choisi › ' + (o.commande ? IC('coche', 13) + '<b>commandé</b>' : '<b>à commander</b>') + '</span>' + (a.total ? '<span>' + fmtN(a.total.chf) + ' CHF pour ' + a.total.q + '</span>' : '') + dateHtml(D.date); }
    else { var gw = gagnant(C, o), A = actifs(C, o); ic = 'balance'; k = 'À choisir';
      mot = gw ? gw.nom + ' gagne' : 'Choisir parmi ' + A.length + ' offres';
      sub = (gw ? '<span>moins cher pour ' + C.besoin + ' livrées · <b>' + fmtN(gw.total.chf) + ' CHF</b>' + (sansPrix(C, o) ? ' · ' + sansPrix(C, o) + ' sans prix' : '') + '</span>' : '<span>' + A.length + ' offres, rien ne départage encore</span>') + dateHtml(D.date); src = gw; }
  } else if (!D.tache && D.r.resolu && c.etat !== 'resolu' && o.garde.resolu === false) { k = 'Rouvert'; ic = 'relire'; mot = D.r.resolu.question; src = { k: 'rv', ligne: D.r.resolu.ligne }; }
  else { var t = D.tache;
    if (!t) { ic = icCat(c); k = 'En bref'; mot = D.r.resume || 'Rien n’attend'; }
    else { ic = icVerbe(t.mot); mot = t.mot; src = t; k = o.tacheFaite ? 'Fait' : o.tard ? 'Plus tard' : 'Prochaine étape'; cls = o.tacheFaite ? ' ok' : '';
      tag = t.ia ? '<span class="am-tag">' + IC('ia', 13) + 'proposé</span><button class="am-x" data-act="refus" data-k="tache" aria-label="Refuser la tâche proposée par l’IA">' + IC('x', 16) + '</button>' : '';
      sub = dateHtml(D.date) + (D.dateObjet ? '<span>' + esc(D.dateObjet) + '</span>' : '') + exHtml(c, t.ligne); }
  }
  x = '<section class="am-hero' + cls + '" data-utile data-booster="heros"><div class="am-k"><span class="am-et ' + c.etat + '">' + esc(NOM_ETAT[c.etat] || 'Noté') + '</span><span>· ' + esc(k) + '</span>' + tag + '</div>' +
    '<div class="am-hb"><span class="am-tuile">' + IC(ic, 20) + '</span><div class="am-hm"><b class="am-hv' + (o.tacheFaite && D.tache ? ' barre' : '') + '">' + esc(mot) + '</b>' + (sub ? '<span class="am-hs">' + sub + '</span>' : '') + '</div>' +
    (src && src.k && (src.ligne || src.ligneTxt) ? '<button class="am-src" data-k="' + src.k + '" aria-label="Sa ligne dans Mes notes">l. ' + (src.ligne || '＋') + IC('retour', 14) + '</button>' : '') + '</div></section>';
  return x;
}
function sec(ic, titre, inner, droite) { return '<section class="am-sec"><h3>' + IC(ic, 14) + esc(titre) + (droite ? '<span class="r">' + droite + '</span>' : '') + '</h3>' + inner + '</section>'; }
function secRetenir(D) { return sec('epingle', 'À retenir', '<div class="am-wrap v7-wrap">' + D.retenir.map(function (x) { return '<button class="am-chip" data-k="' + x.k + '">' + (x.ic ? '<span class="e">' + esc(x.ic) + '</span>' : '') + esc(x.mot) + '</button>'; }).join('') + '</div>'); }
function rangees(D) {
  var o = D.o, c = D.c, x = '';
  if (D.comp) x += resumeCmp(D);
  if (D.pistes.length) {
    var nT = D.pistes.filter(function (p) { return p.ok === 'trouve'; }).length, nN = D.pistes.filter(function (p) { return p.ok === 'non'; }).length;
    x += sec('loupe', 'Pistes', '<div class="am-wrap v7-wrap">' + D.pistes.map(function (q) {
      var m = q.ok === 'trouve' ? '<i class="am-mt">✓</i>' : q.ok === 'non' ? '<i class="am-mp">?</i>' : '<i class="am-mv">?</i>', w = q.ok === 'trouve' ? 'trouvé' : q.ok === 'non' ? 'pas trouvé' : 'à vérifier';
      return '<button class="am-chip ' + (q.ok === 'trouve' ? 'ok' : q.ok === 'non' ? 'non' : 'verif') + (q.ia ? ' ia' : '') + '" data-k="' + q.k + '">' + m + esc(String(q.mot).replace(/\s*\?\s*$/, '')) + ' <small>' + w + '</small>' + (q.ia ? '<span class="am-tag">' + IC('ia', 13) + '</span>' : '') + '</button>'; }).join('') +
      '<button class="am-plus" data-act="plus-piste" aria-label="Ajouter une piste">' + IC('plus', 18) + '</button></div>',
      '<span class="am-jg">' + anneau({ ok: nT, q: D.pistes.length - nT - nN, non: nN }) + '<b>' + nT + '/' + D.pistes.length + '</b> trouvé' + (nT > 1 ? 's' : '') + '</span>');
  }
  if (D.faits.length) x += sec('coche', 'Fait', '<div class="am-wrap v7-wrap">' + D.faits.map(function (f) { return '<button class="am-chip fait" data-k="' + f.k + '"><i class="am-mt">✓</i>' + esc(f.mot) + '</button>'; }).join('') + '</div>');
  if (D.options.length) { var R = retenus(o);
    x += sec(D.genre === 'idee' ? 'ia' : 'cle', D.genre === 'idee' ? 'Idées' : 'Options', '<div class="am-opts v7-opts">' + D.options.map(function (op) {
      var ret = op.mien ? false : R.indexOf(op.io) >= 0;
      var at = valHtml(c, op.ligne, op.inconnu ? null : op.cout) + exHtml(c, op.ligne) + (op.conseil ? '<span class="am-tag">' + IC('ia', 13) + 'conseillé</span>' : '') + (op.ia ? '<span class="am-tag">' + IC('ia', 13) + 'proposé</span>' : '') + (op.mien ? '<span class="am-ex">ajouté par toi</span>' : '') + (ret ? '<span class="am-et decide">retenu</span>' : '');
      return '<div class="am-opt' + (op.ia ? ' ia' : '') + (ret ? ' ret' : '') + '" role="button" tabindex="0" data-k="' + op.k + '">' + tuile(c, op.ligne, icVerbe(op.mot) === 'case' ? 'cle' : icVerbe(op.mot)) + '<span class="tw"><span class="t">' + esc(op.mot) + '</span><span class="at">' + at + '</span></span>' +
        (op.ia ? '<button class="am-x" style="margin:0" data-act="refus" data-k="' + op.k + '" aria-label="Refuser la proposition de l’IA">' + IC('x', 18) + '</button>' : '') + '</div>'; }).join('') + '</div>');
  }
  if (D.taches.length) x += sec('case', 'À faire', '<div class="am-ls v7-ls">' + D.taches.map(function (t) { return '<div class="am-l v7-l' + (t.fait ? ' fait' : '') + '"><button class="q" data-act="cochem" data-m="' + t.mi + '" aria-label="' + (t.fait ? 'Décocher ' : 'Cocher ') + esc(t.mot) + '"><i>' + (t.fait ? '✓' : '') + '</i></button><button class="tx" data-k="' + t.k + '">' + esc(t.mot) + (t.ia ? ' <span class="am-tag">' + IC('ia', 13) + 'proposé</span>' : '') + '</button></div>'; }).join('') + '</div>');
  if (D.liste.length) { var nf = D.liste.filter(function (l) { return l.fait; }).length;
    x += sec('liste', 'Liste', '<div class="am-ls v7-ls">' + D.liste.map(function (l) { return '<div class="am-l v7-l' + (l.fait ? ' fait' : '') + '"><button class="q" data-act="coche" data-i="' + l.i + '" aria-label="' + (l.fait ? 'Décocher ' : 'Cocher ') + esc(l.mot) + '"><i>' + (l.fait ? '✓' : '') + '</i></button><button class="tx" data-k="' + l.k + '">' + esc(l.mot) + '</button></div>'; }).join('') + '</div>',
      '<span class="am-jauge"><i style="width:' + Math.round(nf / D.liste.length * 100) + '%"></i></span><b>' + nf + '/' + D.liste.length + '</b>'); }
  if (D.paire || D.chiffres.length) { var F = D.paire ? null : D.chiffres.slice(0, 4);
    x += sec('liste', 'Chiffres', '<div class="am-figs">' + (D.paire ? '<button class="am-fig pair" data-k="' + D.paire.a.k + '"><span><b>' + esc(D.paire.a.mot) + '</b><small>' + esc(D.paire.a.label) + '</small></span><span class="fl">' + (D.paire.baisse ? '↘' : '↗') + '</span><span><b class="' + (D.paire.baisse ? 'bas' : '') + '">' + esc(D.paire.b.mot) + '</b><small>' + esc(D.paire.b.label) + '</small></span></button>' :
      F.map(function (f) { var e = estEstime(c, f.ligne, f.mot); return '<button class="am-fig" data-k="' + f.k + '"><b>' + (e ? '<span class="am-est">≈ ' + esc(f.mot) + '</span>' : esc(f.mot)) + '</b><small>' + esc(f.label || '') + (e ? ' · estimé' : '') + '</small>' + exHtml(c, f.ligne) + '</button>'; }).join('')) + '</div>'); }
  if (D.echRow || (D.ech && !D.tache)) x += sec('cal', 'Échéance', '<div class="am-wrap v7-wrap"><button class="am-chip" data-k="ech">' + esc(D.ech.quoi || 'Échéance') + ' · ' + (D.ech.date ? dateHtml(D.ech.date) : esc(D.ech.mot)) + '</button></div>');
  if (D.periode) { var a0 = lireDate(D.periode.du, c.maj), b0 = lireDate(D.periode.au, c.maj);
    if (a0 && b0 && b0.d > a0.d) { var t0 = Math.min(Date.now(), +a0.d), t1 = Math.max(+b0.d, Date.now()), sp = t1 - t0 || 1;
      x += sec('cal', 'Période', '<button class="am-per" data-act="periode"><span class="bar"><b style="left:' + ((+a0.d - t0) / sp * 100) + '%;right:' + ((t1 - +b0.d) / sp * 100) + '%"></b><u style="left:' + ((Date.now() - t0) / sp * 100) + '%"></u></span><span class="bt"><span>' + jcDe(a0.d) + '.' + a0.d.getFullYear() + '</span><span>' + relJ(joursDe(a0.d)) + '</span><span>' + jcDe(b0.d) + '.' + b0.d.getFullYear() + '</span></span></button>'); } }
  if (D.retenir.length) x += secRetenir(D);
  return x;
}
/* qui gagne quoi, à quantité égale (prix par unité livrée) ; le détail est dans Comparer */
function resumeCmp(D) {
  var C = D.comp, o = D.o, c = D.c, A = actifs(C, o), T = [], bars = '';
  if (C.vide) return sec('balance', 'Offres', '<div class="am-opts v7-opts">' + A.map(function (a) { return '<div class="am-opt" role="button" tabindex="0" data-k="' + a.k + '">' + tuile(c, a.ligne) + '<span class="tw"><span class="t">' + esc(a.nom) + '</span><span class="at"><span class="am-pn"><i class="am-mv">?</i> prix pas noté</span>' + (a.attente ? '<span class="am-lk">' + esc(a.attente) + '</span>' : '') + '</span></span></div>'; }).join('') + '</div>');
  if (C.besoin) {
    var cov = A.filter(function (a) { return a.total && !a.manque; }).sort(function (a, b) { return a.total.chf - b.total.chf; });
    if (cov[0]) T.push('<div class="am-tile"><small>Moins cher · ' + C.besoin + ' livrées</small><b>' + esc(cov[0].nom) + '</b><span class="v w">' + (cov[0].total.livInconnue ? '≥ ' : '') + fmtN(cov[0].total.chf) + ' CHF</span><small>' + fmt2(cov[0].total.chf / C.besoin) + ' par unité utile</small></div>');
    var u = A.filter(function (a) { return a.offre && a.offre.prix && !isNaN(NUM(a.offre.prix)); }).sort(function (a, b) { return NUM(a.offre.prix) - NUM(b.offre.prix); })[0];
    if (u && u !== cov[0]) T.push('<div class="am-tile"><small>Prix affiché le plus bas</small><b>' + esc(u.nom) + '</b><span class="v' + (u.manque ? ' m' : '') + '">' + esc(u.offre.prix) + '</span><small>' + (u.manque ? 'ne couvre pas ' + C.besoin + ' (' + u.total.q + ')' : u.total && u.total.q > C.besoin ? 'minimum ' + u.total.q : '') + '</small></div>');
    var sorted = A.slice().sort(function (a, b) { return (a.total && !a.manque ? a.total.chf : 9e9) - (b.total && !b.manque ? b.total.chf : 9e9); }).slice(0, 3);
    var mx = Math.max.apply(null, A.filter(function (a) { return a.total; }).map(function (a) { return a.total.chf; }).concat([1]));
    bars = '<div class="am-bars">' + sorted.map(function (a) { var t = a.total, cl = !t ? 'u' : a.manque ? 'm' : a === cov[0] ? 'w' : '';
      return '<button class="am-bar ' + cl + '" data-k="' + a.k + '"><span class="nm">' + esc(a.nom) + exHtml(c, a.ligne) + '</span><span class="tr"><i style="width:' + (t ? Math.max(6, Math.round(t.chf / mx * 100)) : 0) + '%"></i></span><span class="vl">' + (t ? (t.livInconnue ? '≥ ' : '') + fmtN(t.chf) + (a.manque ? ' · ' + t.q + ' seul.' : '') : '? pas noté') + '</span></button>'; }).join('') + '</div>';
  } else {
    C.crit.forEach(function (cr, j) { var w = cr.g != null ? C.arts[cr.g] : null; if (!w || A.indexOf(w) < 0) return;
      T.push('<div class="am-tile"><small>' + esc(critNom(cr.nom)) + '</small><b>' + esc(w.nom) + '</b><span class="v w">' + esc(w.vals[j]) + '</span></div>'); });
    if (!T.length) A.forEach(function (a) { var j = a.vals.findIndex(function (v) { return v !== '?'; });
      T.push('<div class="am-tile"><small>' + (j >= 0 ? esc(critNom(C.crit[j].nom)) : 'prix') + '</small><b>' + esc(a.nom) + '</b>' + (j >= 0 ? '<span class="v">' + esc(a.vals[j]) + '</span>' : '<span class="am-pn"><i class="am-mv">?</i> pas noté</span>') + (a.srcs && a.srcs.indexOf('lien') >= 0 ? '<span class="am-lk">' + IC('lien', 13) + ' lu sur son lien</span>' : a.attente ? '<span class="am-lk">' + esc(a.attente) + '</span>' : '') + '</div>'); });
  }
  return sec('balance', 'Qui gagne quoi', '<div class="am-qg" data-booster="comparer"><div class="am-tiles">' + T.slice(0, 3).join('') + '</div>' + bars +
    '<button class="am-cbtn" data-act="comparer">' + IC('balance', 16) + 'Comparer ' + A.length + ' offres · ' + (C.crit.length + (C.besoin ? 1 : 0)) + ' caractéristiques' + IC('droite', 16) + '</button></div>');
}
function critNom(n) { return String(n).replace(/^\S+\s+(?=\S)/, function (m) { return /[A-Za-zÀ-ÿ0-9]/.test(m) ? m : ''; }); }

/* ====================================================================== Comparer : la vue dédiée (son choix du 17.11 : h04-7, v03-4, g05-8, g01-8, h06-7) */
function lignesCmp(D) {
  var C = D.comp, o = D.o, R = [];
  if (C.besoin) {
    R.push({ id: 'tot', nom: 'Total ' + C.besoin + ' livrées', unit: 'CHF', dir: 'moins', vals: C.arts.map(function (a) { return a.total ? (a.total.livInconnue ? '≥ ' : '') + fmtN(a.total.chf) : '?'; }), num: C.arts.map(function (a) { return a.total && !a.manque ? a.total.chf : null; }), m: C.arts.map(function (a) { return !!a.manque; }), g: 'calc' });
    R.push({ id: 'pu', nom: 'Par unité, pour ' + C.besoin, unit: 'CHF', dir: 'moins', vals: C.arts.map(function (a) { return a.total ? (a.total.livInconnue ? '≥ ' : '') + fmt2(a.total.chf / (a.manque ? a.total.q : C.besoin)) : '?'; }), num: C.arts.map(function (a) { return a.total && !a.manque ? a.total.chf / C.besoin : null; }), m: C.arts.map(function (a) { return !!a.manque; }), g: 'calc' });
  }
  C.crit.forEach(function (cr, j) {
    var nom = critNom(cr.nom), vals = C.arts.map(function (a) { return a.vals[j]; }), num = vals.map(function (v) { return /^[≥~≈+]?\s?\d/.test(String(v)) ? NUM(v) : null; });
    var dir = 'moins';
    if (cr.g != null && num[cr.g] != null) { var autres = num.filter(function (v, i) { return v != null && i !== cr.g; }); dir = autres.every(function (v) { return num[cr.g] <= v; }) ? 'moins' : 'plus'; }
    else if (!/prix|chf|co[uû]t|d[ée]lai|livraison|ppb|\/(bt|kg|g|l)\b/i.test(nom)) dir = 'plus';
    R.push({ id: 'c' + j, j: j, nom: nom, dir: dir, vals: vals, num: num, g: cr.g, txt: num.every(function (v, i) { return v == null || vals[i] === '?'; }) });
  });
  (o.critsPlus || []).forEach(function (n, i) { R.push({ id: 'p' + i, nom: n.nom, ia: n.ia, vals: C.arts.map(function () { return '?'; }), num: C.arts.map(function () { return null; }), txt: true, plus: true }); });
  return R;
}
function meilleurDe(r, A) {
  if (r.g === 'calc') { var gw = gagnant(org.__D.comp, org.__D.o); return gw ? gw.i : null; }
  return r.g != null && A.some(function (a) { return a.i === r.g; }) ? r.g : null;
}
function vueComparer(D) {
  var C = D.comp, o = D.o, c = D.c, A = actifs(C, o), R = lignesCmp(D);
  var classables = R.filter(function (r) { return !r.txt && !(C.besoin && r.j != null && r.j === C.iq) && r.num.filter(function (v) { return v != null; }).length >= 2; });
  var sel = classables.filter(function (r) { return r.id === critSel[c.id]; })[0] || classables[0];
  var x = '<div class="am-cmpv"><div class="am-ch"><button class="am-b44" data-act="cmp-retour" aria-label="Retour à Organisé">' + IC('gauche', 22) + '</button><div><h2>Comparer</h2><small>' + A.length + ' offres' + (C.besoin ? ' · ramenées à ' + C.besoin + ' livrées' : '') + ' · ' + R.length + ' caractéristiques</small></div></div>';
  if (sel) {
    x += '<div class="am-crits" role="tablist">' + classables.map(function (r) { return '<button role="tab" data-act="cmp-crit" data-id="' + r.id + '" class="' + (r === sel ? 'on' : '') + '">' + esc(r.nom) + '</button>'; }).join('') + '</div>';
    var w = meilleurDe(sel, A), known = A.filter(function (a) { return sel.num[a.i] != null || (sel.m && sel.m[a.i]); }), unk = A.filter(function (a) { return known.indexOf(a) < 0; });
    var val = function (a) { return sel.num[a.i] != null ? sel.num[a.i] : (C.arts[a.i].total ? C.arts[a.i].total.chf : 0); };
    known.sort(function (a, b) { if (sel.m && sel.m[a.i] !== sel.m[b.i]) return sel.m[a.i] ? 1 : -1; return sel.dir === 'moins' ? val(a) - val(b) : val(b) - val(a); });
    var mx = Math.max.apply(null, known.map(val).concat([1]));
    x += '<div class="am-rk" data-booster="jauge"><div class="hd">' + esc(sel.nom) + (sel.unit ? ' <small>' + sel.unit + '</small>' : '') + ' <small>· ' + (sel.dir === 'moins' ? 'moins = mieux' : 'plus = mieux') + '</small>' + (w != null ? '<span class="r">' + IC('coche', 13) + ' ' + esc(C.arts[w].nom) + '</span>' : '') + '</div>' +
      known.concat(unk).map(function (a, i) { var u = unk.indexOf(a) >= 0, m = sel.m && sel.m[a.i], e = !u && sel.j != null && estEstime(c, a.ligne, a.vals[sel.j]);
        var cl = u ? 'u' : m ? 'm' : a.i === w ? 'w' : e ? 'e' : '';
        return '<button class="am-rr ' + cl + '" data-ci="' + a.i + '" data-r="' + sel.id + '"><span class="i">' + (u ? '' : i + 1) + '</span><span class="nm">' + esc(a.nom) + exHtml(c, a.ligne) + '</span><span class="vl">' + (u ? '<i class="am-mv">?</i> pas noté' : (e ? '≈ ' : '') + esc(sel.vals[a.i]) + (m ? ' · ne couvre pas' : '')) + '</span>' +
          '<span class="tr"><i style="width:' + (u ? 0 : Math.max(5, Math.round(val(a) / mx * 100))) + '%"></i></span></button>'; }).join('') + '</div>';
  }
  /* côte à côte : toutes les caractéristiques, le meilleur en vert */
  x += '<div class="am-h3">Côte à côte <small>le meilleur en vert</small></div><div class="am-tabw"><table class="am-cmp" data-booster="comparer"><thead><tr><th class="k"></th>' + A.map(function (a) {
    return '<th><button class="hd' + (o.choisi === a.i ? ' sel' : '') + '" data-ci="' + a.i + '" data-r="hd">' + tuile(c, a.ligne) + '<span>' + esc(a.nom) + '</span>' + exHtml(c, a.ligne) + (o.choisi === a.i ? '<span class="am-et decide">choisi</span>' : '') + '</button></th>'; }).join('') + '</tr></thead><tbody>';
  R.forEach(function (r) {
    var w = meilleurDe(r, A);
    x += '<tr><td class="k"><b>' + esc(r.nom) + '</b>' + (r.unit ? r.unit : '') + (r.ia ? ' <span class="am-tag">' + IC('ia', 12) + 'à remplir</span>' : r.plus ? ' <small>à remplir</small>' : '') + '</td>' + A.map(function (a) {
      var v = r.vals[a.i], u = v === '?' || v == null, srcL = r.j != null && a.srcs && a.srcs[r.j] === 'lien', e = !u && r.j != null && estEstime(c, a.ligne, v), m = r.m && r.m[a.i];
      var cl = u ? 'u' : a.i === w ? 'w' : m ? 'm' : r.txt ? 't' : '';
      return '<td><button class="cv ' + cl + '" data-ci="' + a.i + '" data-r="' + r.id + '">' + (u ? '<i class="am-mv">?</i>' : (e ? '≈ ' : '') + esc(v)) + (srcL ? ' ' + IC('lien', 12) : '') + (m ? '<small>' + a.total.q + ' seul.</small>' : '') + '</button></td>'; }).join('') + '</tr>';
  });
  x += '</tbody></table></div>';
  if (C.compromis) x += '<div class="am-comp"><b>Compromis</b> <span class="am-tag">' + IC('ia', 12) + 'IA</span><br>' + esc(C.compromis) + '</div>';
  var E = (o.ecartes || []).map(function (i) { return C.arts[i]; }).filter(Boolean);
  if (E.length) x += '<div class="am-h3">Écartés · ' + E.length + '</div>' + E.map(function (a) { return '<div class="am-ec">' + tuile(c, a.ligne, null, 's') + '<span class="t"><b>' + esc(a.nom) + '</b>écarté par toi' + (o.ecartesLe && o.ecartesLe[a.i] ? ' · ' + esc(quandCH(o.ecartesLe[a.i], true)) : '') + '</span><button class="am-b2" data-act="reprendre" data-i="' + a.i + '">Reprendre</button></div>'; }).join('');
  x += '<div class="am-cact"><button data-act="crit-ajout">' + IC('plus', 16) + 'Ajouter une caractéristique</button><button class="ia" data-act="crit-proposer"' + (o.critsEnCours ? ' disabled' : '') + '>' + IC('ia', 16) + (o.critsEnCours ? 'L’IA cherche…' : 'Proposer') + '</button></div>';
  if (ajoutCrit) x += '<form class="am-addc"><input id="am-crit" type="text" placeholder="Ex. délai, garantie, poids" enterkeyhint="done" autocomplete="off"><button type="submit">Ajouter</button></form>';
  x += '<div class="am-leg"><span><span class="am-est">≈</span> estimé</span><span><i class="am-mv">?</i> pas noté</span><span class="am-lk">' + IC('lien', 12) + ' lu sur son lien</span><span>touche une valeur : sa ligne</span></div></div>';
  return x;
}
function actCmp(D) {
  var C = D.comp, o = D.o, gw = gagnant(C, o);
  if (o.choisi != null && C.arts[o.choisi]) return B('cmp-retour', IC('coche', 18) + 'Choisi : ' + esc(C.arts[o.choisi].nom) + ' · Organisé', 1);
  return (gw ? B('prendre', IC('coche', 18) + 'Prendre ' + esc(gw.nom), 1, ' data-i="' + gw.i + '"') : '') + B('cmp-retour', 'Organisé');
}
function bulleCmp(el) {
  org.querySelectorAll('.am-bub,.v7-bub').forEach(function (n) { n.remove(); });
  var c = courant(), D = org.__D, a = D.comp.arts[+el.dataset.ci], n = a.ligne, L = n ? ligneDe(c, n) : '', b = document.createElement('div'); b.className = 'am-bub';
  var u = n && urlDeLigne(c, n);
  b.innerHTML = '<p><span class="n">l. ' + (n || '—') + '</span>' + (L ? marque(L, a.cit) : '<i>pas dans tes notes</i>') + '</p><div class="r">' +
    (n ? '<button data-act="aller" data-k="' + a.k + '" data-n="' + n + '">Mes notes ↩</button>' : '') + (u ? '<a class="v7-btn" style="display:inline-flex;align-items:center;height:44px;padding:0 12px;border:1px solid var(--bd2);border-radius:10px;color:var(--ink)" href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + IC('lien', 14) + ' Ouvrir</a>' : '') +
    '<button class="p" data-act="prendre" data-i="' + a.i + '">' + (D.o.choisi === a.i ? '✓ Pris' : '✓ Prendre') + '</button><button data-act="ecarter" data-i="' + a.i + '">Écarter</button></div>';
  (el.closest('.am-tabw,.am-rk') || el).after(b);
  geste('toucher', a.nom + ' → ligne ' + n);
}
function proposerCrit(c) {
  var o = c.org, D = org.__D; o.critsEnCours = true; rendreOrg();
  var p = 'Propose des caractéristiques à comparer.\nCarnet : ' + titreDe(c) + '\nOffres : ' + D.comp.arts.map(function (a) { return a.nom; }).join(', ') + '\nDéjà comparé : ' + lignesCmp(D).map(function (r) { return r.nom; }).join(', ') +
    '\nSes notes :\n' + lignesDe(c).map(function (l, i) { return (i + 1) + '. ' + l; }).join('\n') + '\nRéponds en JSON {"caracteristiques":[string]} : 4 au plus, noms courts (2 à 4 mots) qui aident à choisir pour un brasseur, sans valeurs inventées.';
  capSample.then(function (s) { if (!s) throw { code: 'indisponible' }; return s.json(p); }).then(function (r) {
    var deja = lignesCmp(D).map(function (x) { return sansAccent(x.nom); }), L = (r && Array.isArray(r.caracteristiques) ? r.caracteristiques : []).map(function (x) { return String(x).trim(); }).filter(function (x) { return x && deja.indexOf(sansAccent(x)) < 0; }).slice(0, 4);
    o.critsPlus = (o.critsPlus || []).concat(L.map(function (n) { return { nom: n, ia: true }; })); geste('proposer des caractéristiques', L.join(', '));
    toast(L.length ? '✦ ' + L.length + ' caractéristiques proposées · à remplir' : '✦ Rien de plus à proposer');
  }).catch(function () { toast('✦ Proposer : IA absente, réessaie plus tard'); }).then(function () { o.critsEnCours = false; sauver(); if (courant() === c) rendreOrg(); });
}

/* ====================================================================== liens : image, état, Relire, IA forte */
function enRelecture(id) { var r = etat.relire && etat.relire[id]; if (!r) return null; var d = lienLu(id); return d && d.lu && new Date(d.lu) > new Date(r.quand) ? null : r; }
function liensHtml(c, D) {
  var L = liensDe(urlsParLigne(c)); if (!L.length) return '';
  return sec('lien', 'Liens · ' + L.length, '<div class="am-liens">' + L.map(function (x) {
    var d = lienLu(x.id), r = enRelecture(x.id), dom = x.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0], im = d && typeof d.image === 'string' && /^https:\/\//.test(d.image) ? d.image : null;
    var px = d && d.prix && d.prix[0] ? esc((typeof d.prix[0].prix === 'number' ? d.prix[0].prix.toFixed(2) : chaineLien(d.prix[0].prix)) + ' ' + chaineLien(d.prix[0].devise) + ' / ' + chaineLien(d.prix[0].quantite) + ' ' + chaineLien(d.prix[0].unite)) : '';
    var st = r ? '<span class="st att">' + IC('relire', 13) + 'en lecture' + (r.forte ? ' · IA forte' : '') + '</span>' : d ? '<span class="st">' + IC('lien', 13) + 'lu ' + esc(quandCH(luLe(d) === '1' ? Date.now() : luLe(d), true)) + '</span>' : '<span class="st att">' + IC('lien', 13) + (liensEtat === 'sans' ? 'non lu' : 'en lecture') + '</span>';
    return '<div class="am-lien"><button class="tl" data-n="' + x.ligne + '" aria-label="Sa ligne ' + x.ligne + '"><span class="am-tuile">' + (im ? '<img src="' + esc(im) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : IC(icCat(c), 22)) + '</span></button>' +
      '<span class="m"><b>' + esc(d && d.titre ? d.titre : dom) + '</b>' + esc(dom) + (px ? ' · ' + px : '') + (d && d.dispo ? ' · ' + esc(d.dispo) : '') + st + '</span>' +
      '<button class="bt" data-act="relire-lien" data-id="' + x.id + '" data-u="' + esc(x.url) + '">' + IC('relire', 14) + 'Relire</button><button class="bt ia" data-act="forte-lien" data-id="' + x.id + '" data-u="' + esc(x.url) + '" aria-label="Escalader à l’IA forte">' + IC('ia', 14) + 'IA forte</button></div>'; }).join('') + '</div>');
}
function relireLien(c, id, url, forte) {
  etat.relire = etat.relire || {}; var dm = { url: url, carnet: titreDe(c), quand: new Date().toISOString(), type: 'relire' }; if (forte) dm.ia = 'forte';
  etat.relire[id] = { quand: dm.quand, forte: !!forte }; sauver();
  capDb.then(function (db) { if (!db) return; try { Promise.resolve(db.collection('demandes').doc(id).set(dm)).catch(function () {}); } catch (e) {} });
  geste(forte ? 'escalader le lien' : 'relire le lien', url); rendreOrg();
  toast(forte ? '✦ IA forte : relecture du lien demandée' : 'Relecture du lien demandée');
}
function escalader(c) { c.forte = new Date().toISOString(); c.forteFaite = false; sauver(); geste('escalader à l’IA forte', ''); ranger(); toast('✦ L’IA forte relit ta note'); }
function forteOpts(c, signal) { var o = { signal: signal }; if (c.forte && !c.forteFaite) { o.modelTier = 'complex'; c.forteFaite = true; c.forteEnCours = true; } return o; }
function feuilleMeta(c) {
  var k = catDe(c), r0 = c.org && c.org.rep;
  feuilleAm('<h2>' + esc(titreCourt(c)) + '</h2><p class="info">' + esc((r0 && r0.genre ? NOM_GENRE[r0.genre] : 'carnet') + ' · ' + k.nom + (k.sous ? ' › ' + k.sous : '') + ' · priorité ' + prioDe(c) + ' · ' + (NOM_ETAT[c.etat] || 'Noté')) + (c.org ? '<br>rangé par l’IA ' + esc(quandCH(c.org.quand, true)) + (c.forte ? ' · IA forte demandée' : '') : '') + '</p>' +
    '<button class="am-fl" data-x="relire">' + IC('relire', 18) + '<span class="t">Relire la note<small>l’IA relit tes lignes telles qu’elles sont</small></span></button>' +
    '<button class="am-fl ia" data-x="forte">' + IC('ia', 18) + '<span class="t">Escalader à l’IA forte<small>lecture plus poussée, plus lente</small></span></button>' +
    '<button class="am-fl" data-x="ranger">' + IC('paquet', 18) + '<span class="t">Ranger<small>catégorie, sous-catégorie, priorité</small></span></button>' +
    (c.org ? '<button class="am-fl" data-x="chg">' + IC('retour', 18) + '<span class="t">Changé par l’IA<small>voir et annuler</small></span></button>' : '') +
    '<button class="am-fl" data-x="q">' + IC('doc', 18) + '<span class="t">Poser une question à l’IA</span></button>',
    function (x) { fermerAm(); if (x === 'relire') ranger(); else if (x === 'forte') escalader(c); else if (x === 'ranger') feuilleRanger(c); else if (x === 'chg') feuilleChangements(); else if (x === 'q') feuilleDemander(); });
}

/* ====================================================================== gestes de la couche */
function agirAm(a, b) {
  var c = courant(); if (!c) return false; var o = c.org;
  if (a === 'meta') { feuilleMeta(c); return true; }
  if (a === 'relire-lien' || a === 'forte-lien') { relireLien(c, b.dataset.id, b.dataset.u, a === 'forte-lien'); return true; }
  if (!o) return false;
  if (a === 'comparer') { cmpOuvert[c.id] = true; ajoutCrit = false; geste('ouvrir Comparer', ''); rendreOrg(); $('defil').scrollTop = 0; return true; }
  if (a === 'cmp-retour') { cmpOuvert[c.id] = false; rendreOrg(); $('defil').scrollTop = 0; return true; }
  if (a === 'cmp-crit') { critSel[c.id] = b.dataset.id; rendreOrg(); return true; }
  if (a === 'prendre' && cmpOuvert[c.id]) { cmpOuvert[c.id] = false; return false; }
  if (a === 'ecarter') { var i = +b.dataset.i, nm = org.__D.comp.arts[i].nom; o.ecartes = o.ecartes || []; o.ecartesLe = o.ecartesLe || {};
    annulable('Écarté : ' + nm, function () { o.ecartes.push(i); o.ecartesLe[i] = new Date().toISOString(); geste('écarter', nm); }, function () { o.ecartes = o.ecartes.filter(function (x) { return x !== i; }); }); return true; }
  if (a === 'reprendre') { var j = +b.dataset.i; o.ecartes = (o.ecartes || []).filter(function (x) { return x !== j; }); sauver(); geste('reprendre', org.__D.comp.arts[j].nom); rendreOrg(); return true; }
  if (a === 'crit-ajout') { ajoutCrit = !ajoutCrit; rendreOrg(); var inp = $('am-crit'); if (inp) { inp.focus(); inp.scrollIntoView({ block: 'center' }); } return true; }
  if (a === 'crit-proposer') { proposerCrit(c); return true; }
  return false;
}

/* ====================================================================== mise en place (avant le démarrage) */
var amAct = null, amTitre = null, amLieu = null, amH = null, amPouceOrg = null, amF = null;
(function () {
  var app = $('app'), vl = $('v-liste'), vc = $('v-carnet');
  /* en-tête de la liste : L'Affinée, Carnets, À faire ; coup d'œil des états */
  var ap = h('div', { class: 'am-app' }), oe = h('div', { class: 'am-oeil' });
  vl.insertBefore(oe, vl.firstChild); vl.insertBefore(ap, oe);
  ap.addEventListener('click', function (e) { if (e.target.closest('[data-x="tog"]')) { etat.vueListe = etat.vueListe === 'afaire' ? 'arbre' : 'afaire'; sauver(); rendreListe(); } });
  /* pouce de la liste : champ (photo, micro), ✦, + */
  var pied = vl.querySelector('.m4b-pied'), noter = $('noter'), pouce = h('div', { class: 'am-pouce' }), ch = h('div', { class: 'am-champ' });
  noter.parentNode.removeChild(noter); ch.appendChild(noter);
  var ph = h('button', { type: 'button', class: 'am-z', 'aria-label': 'Photo dans un nouveau carnet', onclick: function () { $('noter').value = ''; $('nouveau').click(); setTimeout(choisirPhoto, 60); } }); ph.innerHTML = IC('photo', 18);
  var mi = h('button', { type: 'button', class: 'am-z', 'aria-label': 'Dicter', onclick: function () { if (dictee) { $('noter').value = ''; $('nouveau').click(); setTimeout(basculerDictee, 60); } else { noter.focus(); toast('Dictée : le micro du clavier marche.'); } } }); mi.innerHTML = IC('micro', 18);
  ch.appendChild(ph); ch.appendChild(mi);
  var ia = h('button', { type: 'button', class: 'am-carre ia', 'aria-label': 'Suggestions de l’IA', onclick: suggestionsListe }); ia.innerHTML = IC('ia', 22);
  var pl = h('button', { type: 'button', class: 'am-carre act', 'aria-label': 'Noter dans un nouveau carnet', onclick: function () { $('nouveau').click(); } }); pl.innerHTML = IC('plus', 22);
  pouce.appendChild(ch); pouce.appendChild(ia); pouce.appendChild(pl); pied.appendChild(pouce);
  /* carnet : en-tête (‹, titre, catégorie › sous-catégorie, ⋯), puis Mes notes | Organisé et l'heure de rangement */
  var top = vc.querySelector('.m4b-top'), tete = h('div', { class: 'am-tete' });
  amTitre = h('h1'); amLieu = h('button', { type: 'button', class: 'am-lieu', 'aria-label': 'Ranger', onclick: function () { var c = courant(); if (c) feuilleRanger(c); } });
  var mb = h('button', { type: 'button', class: 'am-b44', 'aria-label': 'Relire, IA forte, ranger', onclick: function () { var c = courant(); if (c) feuilleMeta(c); } }); mb.innerHTML = IC('plush', 22);
  var ret = $('b-retour'); top.removeChild(ret); tete.appendChild(ret); tete.appendChild(amTitre); tete.appendChild(amLieu); tete.appendChild(mb);
  vc.insertBefore(tete, top);
  amH = h('span', { class: 'am-h' }); top.insertBefore(amH, top.querySelector('.edition-seule'));
  amAct = h('div', { class: 'am-act', hidden: true }); vc.insertBefore(amAct, $('outils'));
  amAct.addEventListener('click', function (e) { var b = e.target.closest('[data-act]'); if (!b) return; if (agirAm(b.dataset.act, b)) return; var t = b.cloneNode(true); t.hidden = true; org.appendChild(t); t.click(); if (t.parentNode) t.remove(); });
  /* barre d'onglets de l'app (Stocks actif) */
  var nav = h('nav', { class: 'am-nav', 'aria-label': 'Sections de l’app' });
  nav.innerHTML = [['bord', 'Bord'], ['fin', 'Finances'], ['cal', 'Calendrier'], ['brassin', 'Brassins'], ['stocks', 'Stocks'], ['clients', 'Clients']].map(function (x) { return '<span class="' + (x[0] === 'stocks' ? 'on' : '') + '"' + (x[0] === 'stocks' ? ' aria-current="page"' : '') + '>' + IC(x[0], 18) + x[1] + '</span>'; }).join('');
  app.appendChild(nav);
  /* clavier ouvert : la barre d'onglets s'efface (CARNET-CLAV) */
  document.addEventListener('focusin', function (e) { if (e.target.matches('input,[contenteditable="true"]')) document.body.classList.add('am-clav'); });
  document.addEventListener('focusout', function () { setTimeout(function () { if (!document.activeElement || !document.activeElement.matches('input,[contenteditable="true"]')) document.body.classList.remove('am-clav'); }, 50); });
  /* gestes propres à la couche, avant ceux d'Organisé */
  org.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (b && agirAm(b.dataset.act, b)) { e.stopPropagation(); return; }
    var cell = !b && e.target.closest('.am-cmpv [data-ci]'); if (cell) { e.stopPropagation(); bulleCmp(cell); }
  }, true);
  org.addEventListener('submit', function (e) {
    e.preventDefault(); var c = courant(), inp = $('am-crit'), n = inp && inp.value.trim(); if (!c || !n) return;
    c.org.critsPlus = (c.org.critsPlus || []).concat([{ nom: n }]); ajoutCrit = false; sauver(); geste('ajouter une caractéristique', n); rendreOrg();
  });
})();
