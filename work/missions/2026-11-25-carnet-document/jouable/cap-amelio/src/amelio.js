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
  recycle: '<path d="M7 19H4l3.5-6M17 19h3l-3.5-6M9.5 5.5 12 2l2.5 3.5M8 19h8M9 8.5 6.5 13M15 8.5l2.5 4.5"/>',
  palette: '<path d="M3 18h18M5 18v3M12 18v3M19 18v3"/><rect x="4" y="11" width="7" height="7"/><rect x="13" y="11" width="7" height="7"/><rect x="8.5" y="4" width="7" height="7"/>',
  camion: '<path d="M2 6h12v10H2z M14 10h4l3 3v3h-7z"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  magasin: '<path d="M4 9l1.5-5h13L20 9M5 9v11h14V9M4 9h16M10 20v-5h4v5"/>',
  frigo: '<rect x="6" y="2.5" width="12" height="19" rx="2"/><path d="M6 10h12M9 5.5v2M9 13v3"/>',
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
/* passe de correction 26.11 (B9) : une date déduite (« fin du mois », « dans une semaine », « avant décembre », mois sous-entendu)
   porte « ≈ » partout ; « avant <mois> » = au plus tard le dernier jour du mois d'avant, jamais dans le mois nommé. */
function lireDate(s, ref) {
  s = String(s || '').toLowerCase(); var R = ref ? new Date(ref) : new Date(); R.setHours(12, 0, 0, 0); var m, re;
  function an(mo, j) { var d = new Date(R.getFullYear(), mo, j, 12); if (d - R < -120 * 864e5) d.setFullYear(d.getFullYear() + 1); return d; }
  if ((m = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/))) return { d: new Date(+m[3], +m[2] - 1, +m[1], 12) };
  re = /(\d{1,2})(?:er)?\s+([a-zéû]+)\.?(?:\s+(\d{4}))?/g;
  while ((m = re.exec(s))) if (moisDe(m[2]) >= 0) { var d0 = m[3] ? new Date(+m[3], moisDe(m[2]), +m[1], 12) : an(moisDe(m[2]), +m[1]); return /avant\s+le\s+\d/.test(s) ? { d: new Date(+d0 - 864e5), avant: true } : { d: d0 }; }
  if ((m = s.match(/mi-\s?([a-zéû]+)/)) && moisDe(m[1]) >= 0) return { d: an(moisDe(m[1]), 15), approx: true };
  if (/fin du mois/.test(s)) return { d: new Date(R.getFullYear(), R.getMonth() + 1, 0, 12), approx: true };
  if ((m = s.match(/dans (une|un|deux|trois|\d+) (semaine|jour)/))) { var nb = { une: 1, un: 1, deux: 2, trois: 3 }[m[1]] || +m[1]; return { d: new Date(+R + nb * (m[2] === 'semaine' ? 7 : 1) * 864e5), approx: true }; }
  re = /(avant|en|début|fin)\s+([a-zéû]+)/g;
  while ((m = re.exec(s))) if (moisDe(m[2]) >= 0) {
    var d1 = an(moisDe(m[2]), 1);
    if (m[1] === 'avant') return { d: new Date(d1.getFullYear(), d1.getMonth(), 0, 12), approx: true, avant: true };
    return { d: an(moisDe(m[2]), m[1] === 'fin' ? 28 : 1), approx: true };
  }
  return null;
}
function lireDateV7(s, ref) {
  var t = String(s || '').toLowerCase(), R = new Date(ref || Date.now()), m; R.setHours(12, 0, 0, 0);
  var d = lireDate(t, ref); if (d) return d;
  if (/aujourd/.test(t)) return { d: R };
  if (/(^|\s)demain(\s|$)/.test(t)) return { d: new Date(+R + 864e5) };
  /* « avant le 15 du mois » : le mois est déduit (≈) ; au plus tard la veille */
  if ((m = t.match(/(?:^|\s)(avant le|le)\s+(\d{1,2})(?:\s+du mois)?(?:\s|$)/))) { var x = new Date(R.getFullYear(), R.getMonth(), +m[2], 12); if (x < R) x = new Date(R.getFullYear(), R.getMonth() + 1, +m[2], 12);
    var av = m[1] === 'avant le'; return { d: av ? new Date(+x - 864e5) : x, approx: true, avant: av }; }
  var js = jourDit(t); if (js >= 0) return { d: new Date(+R + ((js - R.getDay() + 7) % 7 || 7) * 864e5) };
  return null;
}
function dateV7(txt, ref) {
  if (!txt) return null; var r = lireDateV7(txt, ref); if (!r) return null;
  var j = joursDe(r.d), js = jourDit(String(txt).toLowerCase()), warn = js >= 0 && /\d{1,2}\s+[a-zéû]/i.test(txt) && r.d.getDay() !== js ? JSEM[r.d.getDay()] : null;
  return { d: r.d, j: j, txt: (r.approx ? '≈ ' : '') + r.d.getDate() + ' ' + MC[r.d.getMonth()], plein: txt, compte: j < 0 ? 'J+' + (-j) : 'J-' + j, niv: j <= 2 ? 'urg' : j <= 7 ? 'proche' : 'loin', warn: warn, approx: !!r.approx, avant: !!r.avant };
}
function dateHtml(dt) {
  if (!dt) return '';
  var cl = dt.j <= 2 ? 'urg' : dt.j <= 7 ? 'proche' : 'loin';
  return '<span class="am-d ' + cl + (dt.approx ? ' approx' : '') + '" title="« ' + esc(dt.plein) + ' »' + (dt.approx ? ' : date déduite' : '') + '">' + IC('cal', 14) + '<b>' + (dt.approx ? '≈ ' : '') + relJ(dt.j) + '</b> · ' + (dt.avant ? 'au plus tard ' : '') + jcDe(dt.d) + '</span>' +
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
    var jg = function (k) { return '<span class="am-barre ' + k + '"><i></i><i></i><i></i><i></i></span>'; };
    oe.innerHTML = '<span class="note">' + jg('note') + '<b>' + n.note + '</b> ' + pl('note', 'noté', 'notés') + '</span><span class="cherche">' + jg('cherche') + '<b>' + n.cherche + '</b> je cherche</span><span class="decide">' + jg('decide') + '<b>' + n.decide + '</b> ' + pl('decide', 'décidé', 'décidés') + '</span>' +
      '<span class="prio"><i></i>urgent</span>';
    oe.setAttribute('aria-label', 'Étapes : noté, je cherche, décidé, résolu (tirets remplis) ; barre rouge à gauche : urgent');
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
  b.innerHTML = IC('coche', 16) + '<b>' + res.length + ' résolus</b><span>· ' + esc(res.map(function (c) { var w = titreCourt(c).split(' '); return w.slice(0, 2).join(' ') + (w.length > 2 ? '…' : ''); }).join(' · ')) + '</span>';
  l.appendChild(b);
  if (!rr) res.forEach(function (c) { l.appendChild(ligneCarnet(c, null)); });
}
/* une ligne par carnet ; la sous-catégorie se lit au-dessus du titre du premier carnet de son groupe (catégorie › sous-catégorie) */
function ligneCarnet(c, sous) {
  var p = prioDe(c), lit = estEnLecture(c), pro = !lit && prochaine(c), res = !lit && !pro && resumeDe(c), et = NOM_ETAT[c.etat] || 'Noté';
  var row = h('button', { type: 'button', class: 'am-r m4j-r ' + p + (sous != null ? ' prem' : ''), 'data-id': c.id, 'aria-label': titreCourt(c) + ' · ' + et + (pro ? ' · ' + (pro.approx ? 'environ ' : '') + relJ(pro.n) : res ? ' · ' + res : '') });
  var q = lit ? '<span class="q lit"><b>✦ lit…</b></span>' : pro ? '<span class="q ' + (pro.n < 0 ? 'passe' : pro.n <= 7 ? 'proche' : '') + '"><b>' + esc((pro.approx ? '≈ ' : '') + (pro.n < 0 ? 'retard ' + (-pro.n) + ' j' : pro.n === 0 ? 'auj.' : pro.n + ' j')) + '</b>' + esc(jcDe(pro.d || Date.now())) + '</span>' : res ? '<span class="q res">' + esc(String(res).replace(/^« |»$/g, '')) + '</span>' : '';
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
  return best ? { n: joursDe(best.d), d: best.d, txt: dateCourte(best.d), approx: !!best.approx } : null;
}
function aFaire() {
  var it = [], cle = {};
  etat.carnets.forEach(function (c) {
    if (c.etat === 'resolu') return;
    var o = c.org, r = o && o.rep;
    if (r && r.tache && o.garde.tache !== false && !o.tacheFaite) it.push({ c: c, t: r.tache.titre, q: r.tache.quand });
    if (r && r.echeance) it.push({ c: c, t: r.echeance.quoi || 'Échéance', q: r.echeance.quand });
    (c.miens || []).forEach(function (m) { if (m.type === 'tache' && !m.fait) it.push({ c: c, t: m.texte, q: null }); });
  });
  it.forEach(function (x) { var d = x.q && lireDateV7(x.q, x.c.maj); x.d = d ? d.d : null; x.approx = !!(d && d.approx); x.avant = !!(d && d.avant); });
  it = it.filter(function (x) { var k1 = x.c.id + '|' + norm(x.t), k2 = x.d ? x.c.id + '|' + x.d.toDateString() : null;
    if (cle[k1] || (k2 && cle[k2])) return false; cle[k1] = 1; if (k2) cle[k2] = 1; return true; });
  return it.sort(function (a, b) { return (a.d ? +a.d : 9e15) - (b.d ? +b.d : 9e15); });
}
function rendreAFaire(l, items) {
  if (!items.length) { l.appendChild(h('p', { class: 'm4b-vide' }, 'Rien à faire pour l’instant.')); return; }
  items.forEach(function (x) {
    var n = x.d ? joursDe(x.d) : null, b = h('button', { type: 'button', class: 'am-af', onclick: function () { ouvrir(x.c.id); } });
    var memeT = sansAccent(x.t).replace(/[^a-z0-9]+/g, ' ').trim() === sansAccent(titreCourt(x.c)).replace(/[^a-z0-9]+/g, ' ').trim();
    b.innerHTML = '<span class="am-tuile s">' + IC(icVerbe(x.t), 16) + '</span><span class="t"><b>' + esc(x.t) + '</b>' + (memeT ? '' : '<small>' + esc(titreCourt(x.c)) + '</small>') + '</span>' +
      (x.d ? '<span class="q ' + (n < 0 ? 'passe' : n <= 7 ? 'proche' : '') + '"><b>' + esc((x.approx ? '≈ ' : '') + relJ(n)) + '</b>' + esc((x.avant ? '≤ ' : '') + jcDe(x.d)) + '</span>' : '');
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
  amLieu.classList.remove('ico'); if (amTitre.scrollWidth > amTitre.clientWidth + 1) amLieu.classList.add('ico');
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
  $('p-notes').hidden = v !== 'notes'; $('p-org').hidden = v !== 'org'; document.body.classList.toggle('am-vnotes', v === 'notes');
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
  var o = D.o, c = D.c, C = D.comp, nO = C && !C.vide ? actifs(C, o).length : 0;
  if (D.regle) return D.regle.propose ? B('regle-oui', IC('coche', 18) + 'Réglé', 1) + B('regle-non', 'Pas encore') : B('rouvrir', IC('relire', 16) + 'Rouvrir');
  if (C && !C.vide && !D.tache) {
    if (o.choisi != null && C.arts[o.choisi]) return o.commande ? B('decommander', 'Pas encore commandé') : B('commander', IC('coche', 18) + 'Commandé', 1) + B('tard', 'Plus tard') + B('rouvrir-choix', IC('relire', 16) + 'Rouvrir');
    var gw = gagnant(C, o);
    return gw ? B('prendre', IC('coche', 18) + 'Prendre ' + esc(gw.nom), 1, ' data-i="' + gw.i + '"') + B('comparer', 'Comparer') : B('comparer', IC('balance', 18) + 'Comparer ' + nO + ' offres', 1);
  }
  if (!D.tache && D.r.resolu && c.etat !== 'resolu' && o.garde.resolu === false) return B('reregle', IC('coche', 18) + 'Réglé', 1);
  if (!D.tache) return nO ? B('comparer', IC('balance', 18) + 'Comparer ' + nO + ' offres', 1) : '';
  /* après Fait : la suite d'abord (m12) */
  if (o.tacheFaite) return B('suite', IC('ia', 18) + 'Étape suivante', 1) + B('defait', 'Pas fait');
  if (o.tard) return B('retour-tard', 'Reprendre');
  /* une étape « comparer » met Comparer sous le pouce (m31) */
  if (nO && icVerbe(D.tache.mot) === 'balance') return B('comparer', IC('balance', 18) + 'Comparer ' + nO + ' offres', 1) + B('fait', IC('coche', 18) + 'Fait');
  return B('fait', IC('coche', 18) + 'Fait', 1) + B('tard', 'Plus tard');
}
/* « dernier pas » : le résumé de l'IA seulement s'il est écrit dans une de ses lignes ; sinon le dernier fait */
function dernierPas(D) {
  var L = lignesDe(D.c), r = D.r, n0 = norm(r.resume || '');
  if (n0 && n0.split(' ').length <= 5 && !lireDateV7(r.resume, D.c.maj)) for (var i = L.length - 1; i >= 0; i--) if (norm(L[i]).indexOf(n0) >= 0) return { mot: r.resume, ligne: i + 1 };
  var f = D.faits[D.faits.length - 1]; return f ? { mot: f.mot, ligne: f.ligne, k: f.k } : null;
}
function heros(D) {
  var o = D.o, c = D.c, C = D.comp, ic = 'case', mot = '', sub = '', k = 'Prochaine étape', src = null, tag = '', cls = '', x = '';
  if (D.tache && !D.regle) return tuilesTache(D);
  if (D.regle) { var g = D.regle; src = g; ic = 'coche'; cls = ' ok'; mot = g.mot; k = g.propose ? 'Réglé ?' : 'Réglé'; tag = g.propose ? '<span class="am-tag">' + IC('ia', 13) + 'proposé</span>' : ''; sub = D.date ? dateHtml(D.date) : ''; }
  else if (C && !C.vide) {
    if (o.choisi != null && C.arts[o.choisi]) { var a = C.arts[o.choisi]; src = a; ic = 'paquet'; k = o.commande ? 'Commandé' : 'Choisi';
      mot = (o.commande ? 'Commandé chez ' : 'Commander chez ') + a.nom; cls = o.commande ? ' ok' : '';
      sub = (a.total ? '<span>' + fmtN(a.total.chf) + ' CHF pour ' + a.total.q + '</span>' : '') + dateHtml(D.date); }
    else { var gw = gagnant(C, o), A = actifs(C, o); ic = 'balance'; k = 'À choisir';
      mot = gw ? gw.nom + ' gagne' : 'Choisir parmi ' + A.length + ' offres';
      sub = (gw ? '<span>moins cher pour ' + C.besoin + ' livrées · <b>' + fmtN(gw.total.chf) + ' CHF</b>' + (sansPrix(C, o) ? ' · ' + sansPrix(C, o) + ' sans prix' : '') + '</span>' : '') + dateHtml(D.date); src = gw; }
  } else if (D.r.resolu && c.etat !== 'resolu' && o.garde.resolu === false) { k = 'Rouvert'; ic = 'relire'; mot = D.r.resolu.question; src = { k: 'rv', ligne: D.r.resolu.ligne }; }
  else { ic = icCat(c); k = 'En bref'; mot = D.r.resume || 'Rien n’attend'; }
  x = '<section class="am-hero' + cls + '" data-utile data-booster="heros"><div class="am-k"><span class="am-et ' + c.etat + '">' + esc(NOM_ETAT[c.etat] || 'Noté') + '</span><span>· ' + esc(k) + '</span>' + tag + '</div>' +
    '<div class="am-hb"><span class="am-tuile">' + IC(ic, 20) + '</span><div class="am-hm"><b class="am-hv" data-nom>' + esc(mot) + '</b>' + (sub ? '<span class="am-hs">' + sub + '</span>' : '') + '</div>' +
    (src && src.k && (src.ligne || src.ligneTxt) ? '<button class="am-src" data-k="' + src.k + '" aria-label="Sa ligne dans Mes notes">l. ' + (src.ligne || '＋') + IC('retour', 14) + '</button>' : '') + '</div></section>';
  return x;
}
/* en tête d'un carnet à étape : des tuiles (O-organise-b) — depuis, dernier pas, une mesure, puis la prochaine étape en large */
function tuilesTache(D) {
  var o = D.o, c = D.c, t = D.tache, T = [], j = joursDe(c.cree), dp = dernierPas(D);
  T.push('<div class="am-t4" data-booster="coupdoeil"><small>' + IC('cal', 13) + '<span class="am-et ' + c.etat + '">' + esc((NOM_ETAT[c.etat] || 'Noté').toLowerCase()) + '</span> depuis</small><b>' + (j < 0 ? -j : 0) + ' j</b> <span class="d">' + jcDe(c.cree) + '</span></div>');
  if (dp) T.push('<button class="am-t4" ' + (dp.k ? 'data-k="' + dp.k + '"' : 'data-n="' + dp.ligne + '"') + '><small>' + IC('retour', 13) + 'dernier pas</small><b data-nom>' + esc(dp.mot) + '</b> <span class="d">l. ' + dp.ligne + '</span></button>');
  var f = D.paire ? null : D.chiffres[0];
  if (f) { var al = alerteDe(f); T.push('<button class="am-t4' + (al ? ' bad' : '') + '" data-k="' + f.k + '"><small>' + IC(al ? 'alerte' : 'liste', 13) + esc(f.label || 'mesure') + '</small><b>' + (estEstime(c, f.ligne, f.mot) ? '≈ ' : '') + esc(f.mot) + '</b> <span class="d">l. ' + f.ligne + '</span></button>'); }
  var meme = norm(t.mot) === norm(titreCourt(c)), fait = o.tacheFaite;
  var pro = '<div class="am-t4 pro' + (fait ? ' ok' : '') + (t.ia ? ' ia' : '') + '" data-utile data-booster="heros"><small>' + IC(fait ? 'coche' : icVerbe(t.mot), 13) + (fait ? 'fait' : o.tard ? 'plus tard' : 'prochaine') + (t.ia ? '<span class="am-tag">' + IC('ia', 12) + 'proposé</span>' : '') + '</small>' +
    '<span class="row"><b class="' + (fait ? 'barre' : '') + '" data-nom>' + esc(meme && D.date ? 'Prévu' : t.mot) + '</b>' + (t.ligne ? '<button class="am-src" data-k="tache" aria-label="Sa ligne dans Mes notes">l. ' + t.ligne + IC('retour', 14) + '</button>' : '') +
    (t.ia ? '<button class="am-x" data-act="refus" data-k="tache" aria-label="Refuser la tâche proposée par l’IA">' + IC('x', 16) + '</button>' : '') + '</span>' +
    (D.date || D.dateObjet || exHtml(c, t.ligne) ? '<span class="am-hs">' + dateHtml(D.date) + (D.dateObjet ? '<span>' + esc(D.dateObjet) + '</span>' : '') + exHtml(c, t.ligne) + '</span>' : '') + '</div>';
  return '<section class="am-g4">' + T.join('') + pro + '</section>';
}
/* une mesure loin de sa visée (« 14 °C · visé 2 °C ») se lit en alerte (m33) */
function alerteDe(f) { var m = String(f.label || '').match(/vis[ée]e?\s*([-\d,.]+)/i); return m && Math.abs(NUM(f.mot) - NUM(m[1])) > 1; }
function sec(ic, titre, inner, droite) { return '<section class="am-sec"><h3>' + IC(ic, 14) + esc(titre) + (droite ? '<span class="r">' + droite + '</span>' : '') + '</h3>' + inner + '</section>'; }
function secRetenir(D) { return sec('epingle', 'À retenir', '<div class="am-wrap v7-wrap">' + D.retenir.map(function (x) { return '<button class="am-chip" data-k="' + x.k + '">' + (x.ic ? '<span class="e">' + esc(x.ic) + '</span>' : '') + esc(x.mot) + '</button>'; }).join('') + '</div>'); }
function carteOption(c, op, R) {
  var ret = op.mien ? false : R.indexOf(op.io) >= 0;
  var at = valHtml(c, op.ligne, op.inconnu ? null : op.cout) + exHtml(c, op.ligne) + (op.conseil ? '<span class="am-tag">' + IC('ia', 13) + 'conseillé</span>' : '') + (op.ia ? '<span class="am-tag">' + IC('ia', 13) + 'proposé</span>' : '') + (op.mien ? '<span class="am-ex">ajouté par toi</span>' : '') + (ret ? '<span class="am-et decide">retenu</span>' : '');
  return '<div class="am-opt' + (op.ia ? ' ia' : '') + (ret ? ' ret' : '') + '" role="button" tabindex="0" data-k="' + op.k + '">' + tuile(c, op.ligne, icVerbe(op.mot) === 'case' ? 'cle' : icVerbe(op.mot)) + '<span class="tw"><span class="t" data-nom>' + esc(op.mot) + '</span><span class="at">' + at + '</span></span>' +
    (op.ia ? '<button class="am-x" style="margin:0" data-act="refus" data-k="' + op.k + '" aria-label="Refuser la proposition de l’IA">' + IC('x', 18) + '</button>' : '') + '</div>';
}
/* pistes → options (O-organise-b) : une option se range sous la piste dont elle partage un mot ; sinon elle reste dans Options */
var AM_STOP = ['avec', 'pour', 'dans', 'sans', 'plus', 'mais', 'trouve', 'trouvee', 'apres', 'chaque', 'entre', 'sous', 'cette', 'faire', 'avant', 'exemple', 'piste', 'pistes'];
function motsCles(s) { return sansAccent(s || '').split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 4 && AM_STOP.indexOf(w) < 0; }); }
function arbrePistes(D, libres) {
  var c = D.c, R = retenus(D.o), pris = {};
  var nT = D.pistes.filter(function (p) { return p.ok === 'trouve'; }).length, nN = D.pistes.filter(function (p) { return p.ok === 'non'; }).length;
  var br = D.pistes.map(function (p) {
    var mp = motsCles(p.mot + ' ' + (p.cit || '')), ops = D.options.filter(function (op) { if (pris[op.k]) return false; var ok = motsCles(op.mot).some(function (w) { return mp.indexOf(w) >= 0; }); if (ok) pris[op.k] = 1; return ok; });
    var st = p.ok === 'trouve' ? ['ok', 'coche', 'Trouvé'] : p.ok === 'non' ? ['non', 'alerte', 'Pas trouvé'] : ['verif', 'loupe', 'À vérifier'];
    return '<div class="am-br"><button class="am-pi ' + st[0] + (p.ia ? ' ia' : '') + '" data-k="' + p.k + '"><small>' + IC(st[1], 13) + st[2] + (p.ia ? ' <span class="am-tag">' + IC('ia', 12) + '</span>' : '') + '</small><b data-nom>' + esc(String(p.mot).replace(/\s*\?\s*$/, '')) + '</b>' + (p.ligne ? '<span class="d">l. ' + p.ligne + '</span>' : '') + '</button>' +
      (ops.length ? '<span class="am-fl2">' + IC('bas', 16) + '</span>' + ops.map(function (op) { return carteOption(c, op, R); }).join('') : '') + '</div>';
  });
  D.options.forEach(function (op) { if (!pris[op.k]) libres.push(op); });
  return sec('loupe', 'Pistes', '<div class="am-arbre' + (D.pistes.length > 1 ? ' deux' : '') + '">' + br.join('') + '</div><button class="am-plus2" data-act="plus-piste">' + IC('plus', 16) + 'Piste</button>',
    '<span class="am-jg">' + anneau({ ok: nT, q: D.pistes.length - nT - nN, non: nN }) + '<b>' + nT + '/' + D.pistes.length + '</b></span>');
}
function rangees(D) {
  var o = D.o, c = D.c, x = '', libres = [];
  if (D.comp) x += resumeCmp(D);
  /* une option qui est déjà une offre comparée (même ligne) n'est pas répétée (m24) */
  var lA = D.comp ? D.comp.arts.map(function (a) { return a.ligne; }).filter(Boolean) : [];
  D.options = D.options.filter(function (op) { return !op.ligne || lA.indexOf(op.ligne) < 0; });
  if (D.pistes.length) x += arbrePistes(D, libres); else libres = D.options.slice();
  var dp0 = D.tache ? dernierPas(D) : null, FF = D.faits.filter(function (f) { return !dp0 || norm(f.mot) !== norm(dp0.mot); });
  if (FF.length) x += sec('coche', 'Fait', '<div class="am-wrap v7-wrap">' + FF.map(function (f) { return '<button class="am-chip fait" data-k="' + f.k + '"><i class="am-mt">✓</i>' + esc(f.mot) + '</button>'; }).join('') + '</div>');
  if (libres.length) { var R = retenus(o); x += sec(D.genre === 'idee' ? 'ia' : 'cle', D.genre === 'idee' ? 'Idées' : 'Options', '<div class="am-opts v7-opts">' + libres.map(function (op) { return carteOption(c, op, R); }).join('') + '</div>'); }
  if (D.taches.length) x += sec('case', 'À faire', '<div class="am-ls v7-ls">' + D.taches.map(function (t) { return '<div class="am-l v7-l' + (t.fait ? ' fait' : '') + '"><button class="q" data-act="cochem" data-m="' + t.mi + '" aria-label="' + (t.fait ? 'Décocher ' : 'Cocher ') + esc(t.mot) + '"><i>' + (t.fait ? '✓' : '') + '</i></button><button class="tx" data-k="' + t.k + '">' + esc(t.mot) + (t.ia ? ' <span class="am-tag">' + IC('ia', 13) + 'proposé</span>' : '') + '</button></div>'; }).join('') + '</div>');
  if (D.liste.length) { var nf = D.liste.filter(function (l) { return l.fait; }).length;
    x += sec('liste', 'Liste', '<div class="am-ls v7-ls">' + D.liste.map(function (l) { return '<div class="am-l v7-l' + (l.fait ? ' fait' : '') + '"><button class="q" data-act="coche" data-i="' + l.i + '" aria-label="' + (l.fait ? 'Décocher ' : 'Cocher ') + esc(l.mot) + '"><i>' + (l.fait ? '✓' : '') + '</i></button><button class="tx" data-k="' + l.k + '" data-nom>' + esc(l.mot) + '</button></div>'; }).join('') + '</div>',
      '<span class="am-jauge"><i style="width:' + Math.round(nf / D.liste.length * 100) + '%"></i></span><b>' + nf + '/' + D.liste.length + '</b>'); }
  /* chiffres : la première mesure est déjà en tuile quand il y a une étape */
  var F = D.paire ? null : D.chiffres.slice(D.tache ? 1 : 0, 4);
  if (D.paire || F.length) x += sec('liste', 'Chiffres', '<div class="am-figs">' + (D.paire ? '<button class="am-fig pair" data-k="' + D.paire.a.k + '"><span><b>' + esc(D.paire.a.mot) + '</b><small>' + esc(D.paire.a.label) + '</small></span><span class="fl">' + (D.paire.baisse ? '↘' : '↗') + '</span><span><b class="' + (D.paire.baisse ? 'bas' : '') + '">' + esc(D.paire.b.mot) + '</b><small>' + esc(D.paire.b.label) + '</small></span></button>' :
      F.map(function (f) { var e = estEstime(c, f.ligne, f.mot), al = alerteDe(f); return '<button class="am-fig' + (al ? ' bad' : '') + '" data-k="' + f.k + '"><b>' + (e ? '<span class="am-est">≈ ' + esc(f.mot) + '</span>' : esc(f.mot)) + '</b><small>' + esc(f.label || '') + (e ? ' · estimé' : '') + '</small>' + exHtml(c, f.ligne) + '</button>'; }).join('')) + '</div>');
  /* l'échéance seulement si elle n'est pas déjà la date du haut (m11) */
  if (D.ech && D.ech.date && D.date && D.ech.date.d - D.date.d !== 0) x += sec('cal', 'Échéance', '<div class="am-wrap v7-wrap"><button class="am-chip" data-k="ech">' + esc(D.ech.quoi || 'Échéance') + ' · ' + dateHtml(D.ech.date) + '</button></div>');
  else if (D.ech && !D.ech.date) x += sec('cal', 'Échéance', '<div class="am-wrap v7-wrap"><button class="am-chip" data-k="ech">' + esc(D.ech.quoi || 'Échéance') + ' · ' + esc(D.ech.mot) + '</button></div>');
  if (D.periode) { var a0 = lireDate(D.periode.du, c.maj), b0 = lireDate(D.periode.au, c.maj);
    if (a0 && b0 && b0.d > a0.d) { var t0 = Math.min(Date.now(), +a0.d), t1 = Math.max(+b0.d, Date.now()), sp = t1 - t0 || 1;
      x += sec('cal', 'Période', '<button class="am-per" data-act="periode"><span class="bar"><b style="left:' + ((+a0.d - t0) / sp * 100) + '%;right:' + ((t1 - +b0.d) / sp * 100) + '%"></b><u style="left:' + ((Date.now() - t0) / sp * 100) + '%"></u></span><span class="bt"><span>' + jcDe(a0.d) + '.' + a0.d.getFullYear() + '</span><span>' + relJ(joursDe(a0.d)) + '</span><span>' + jcDe(b0.d) + '.' + b0.d.getFullYear() + '</span></span></button>'); } }
  if (D.retenir.length) x += secRetenir(D);
  return x;
}
/* qui gagne quoi, à quantité égale (prix par unité livrée) ; le détail est dans Comparer.
   Passe de correction : une tuile ne montre qu'un avantage vérifié sur les valeurs (B29) ; barres classées comme h04-7 : le n° 1 a la barre pleine (B15). */
function numDe(v) { return /^[≥≤~≈+]?\s?\d/.test(String(v)) ? NUM(v) : null; }
function prixLike(nom) { return /prix|chf|co[uû]t|d[ée]lai|livraison|ppb|\/(bt|kg|g|l)\b|\d+\s?kg\b/i.test(nom); }
/* un critère départage-t-il vraiment ? ≥ 2 valeurs chiffrées ; le gagnant de l'IA doit être l'extrême ; sinon seul un prix se lit « moins = mieux » */
function critVerifie(C, A, j) {
  var K = A.filter(function (a) { return numDe(a.vals[j]) != null; }); if (K.length < 2) return null;
  var vs = K.map(function (a) { return numDe(a.vals[j]); }), mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs); if (mn === mx) return null;
  var g = C.crit[j].g, ga = g != null ? K.filter(function (a) { return a.i === g; })[0] : null, dir = null;
  if (ga) dir = numDe(ga.vals[j]) === mn ? 'moins' : numDe(ga.vals[j]) === mx ? 'plus' : null;
  else if (prixLike(C.crit[j].nom)) dir = 'moins';
  if (!dir) return null;
  var best = K.filter(function (a) { return numDe(a.vals[j]) === (dir === 'moins' ? mn : mx); });
  return best.length === 1 ? { j: j, dir: dir, w: best[0], K: K } : null;
}
/* barres classées : items {a, v, m (ne couvre pas), lab, e} ; n° 1 plein, puis best/v (moins) ou v/best (plus) ; hors besoin à part, sans barre */
function barresRang(items, dir, wi, cls) {
  var K = items.filter(function (x) { return x.v != null && !x.m; }).sort(function (x, y) { return dir === 'moins' ? x.v - y.v : y.v - x.v; });
  var M = items.filter(function (x) { return x.m; }), U = items.filter(function (x) { return x.v == null && !x.m; }), best = K.length ? K[0].v : null;
  var row = function (x, rang) {
    var w = rang === 1 && wi != null && x.a.i === wi, pct = x.v != null && !x.m && best != null ? Math.max(8, Math.round((dir === 'moins' ? (x.v ? best / x.v : 1) : best ? x.v / best : 0) * 100)) : 0;
    var cl = x.m ? 'm' : x.v == null ? 'u' : w ? 'w' : x.e ? 'e' : '';
    return '<button class="' + cls + ' ' + cl + '" data-ci="' + x.a.i + '"' + (x.r ? ' data-r="' + x.r + '"' : '') + ' data-k="' + x.a.k + '"><span class="i">' + (rang || (x.m ? '–' : '')) + '</span><span class="nm" data-nom>' + esc(x.a.nom) + '</span><span class="vl">' + x.lab + '</span>' +
      '<span class="tr">' + (pct ? '<i style="width:' + pct + '%"></i>' : '') + '</span></button>';
  };
  return K.map(function (x, i) { return row(x, i + 1); }).join('') + M.map(function (x) { return row(x, 0); }).join('') + U.map(function (x) { return row(x, 0); }).join('');
}
function resumeCmp(D) {
  var C = D.comp, o = D.o, c = D.c, A = actifs(C, o), T = [], bars = '', vide = false;
  if (C.vide) return sec('balance', 'Offres', '<div class="am-opts v7-opts">' + A.map(function (a) { return '<div class="am-opt" role="button" tabindex="0" data-k="' + a.k + '">' + tuileOffre(c, a, C) + '<span class="tw"><span class="t" data-nom>' + esc(a.nom) + '</span><span class="at"><span class="am-pn"><i class="am-mv">?</i> prix pas noté</span>' + (a.attente ? '<span class="am-lk">' + esc(a.attente) + '</span>' : '') + '</span></span></div>'; }).join('') + '</div>');
  if (C.besoin) {
    var gw = gagnant(C, o), u = A.filter(function (a) { return a.offre && a.offre.prix && !isNaN(NUM(a.offre.prix)); }).sort(function (a, b) { return NUM(a.offre.prix) - NUM(b.offre.prix); })[0];
    if (u && u !== gw && u.manque) T.push('<div class="am-tile"><small>Moins cher à l’unité</small><b data-nom>' + esc(u.nom) + '</b><span class="v m">' + esc(u.offre.prix) + '</span><small>ne couvre pas ' + C.besoin + ' (' + u.total.q + ')</small></div>');
    bars = '<div class="am-bh">Total pour ' + C.besoin + ' livrées <small>CHF · moins = mieux</small></div><div class="am-bars">' +
      barresRang(A.map(function (a) { var t = a.total; return { a: a, v: t ? t.chf : null, m: !!a.manque, lab: t ? (t.livInconnue ? '≥ ' : '') + fmtN(t.chf) + (a.manque ? ' · ' + t.q + ' seul.' : '') : '<i class="am-mv">?</i>' }; }), 'moins', gw ? gw.i : null, 'am-bar') + '</div>';
  } else {
    var V = C.crit.map(function (cr, j) { return critVerifie(C, A, j); }).filter(Boolean);
    if (V.length) { var v0 = V[0];
      bars = '<div class="am-bh">' + esc(critNom(C.crit[v0.j].nom)) + ' <small>' + (v0.dir === 'moins' ? 'moins = mieux' : 'plus = mieux') + '</small></div><div class="am-bars">' +
        barresRang(A.map(function (a) { var v = numDe(a.vals[v0.j]), e = v != null && estEstime(c, a.ligne, a.vals[v0.j]); return { a: a, v: v, e: e, lab: v == null ? '<i class="am-mv">?</i>' : (e ? '≈ ' : '') + esc(a.vals[v0.j]) }; }), v0.dir, v0.w.i, 'am-bar') + '</div>';
      V.slice(1, 3).forEach(function (v) { T.push('<div class="am-tile"><small>' + esc(critNom(C.crit[v.j].nom)) + '</small><b data-nom>' + esc(v.w.nom) + '</b><span class="v w">' + esc(v.w.vals[v.j]) + '</span></div>'); });
    } else { vide = true;
      T.push('<div class="am-rien">' + IC('balance', 16) + '<span>Rien ne départage encore</span></div>');
      bars = '<div class="am-offs">' + A.map(function (a) { var n = a.vals.filter(function (x) { return x !== '?'; }).length;
        return '<button class="am-off" data-k="' + a.k + '">' + tuileOffre(c, a, C) + '<span class="t"><b data-nom>' + esc(a.nom) + '</b><span class="am-mini"><i style="width:' + Math.round(n / (a.vals.length || 1) * 100) + '%"></i></span><small>' + n + '/' + a.vals.length + ' noté' + (n > 1 ? 's' : '') + '</small></span></button>'; }).join('') + '</div>';
    }
  }
  return sec('balance', vide ? 'Offres' : 'Qui gagne quoi', '<div class="am-qg" data-booster="comparer">' + (T.length ? '<div class="am-tiles">' + T.slice(0, 3).join('') + '</div>' : '') + bars +
    '<button class="am-cbtn" data-act="comparer">' + IC('balance', 16) + 'Comparer ' + A.length + ' · ' + nCarac(D) + ' caractéristiques' + IC('droite', 16) + '</button></div>');
}
function critNom(n) { return String(n).replace(/^\S+\s+(?=\S)/, function (m) { return /[A-Za-zÀ-ÿ0-9]/.test(m) ? m : ''; }); }
function nCarac(D) { return lignesCmp(D).filter(function (r) { return !(D.comp.besoin && r.j != null && r.j === D.comp.iq); }).length; }
/* l'objet de chaque offre : l'image de son lien, sinon un dessin propre à l'offre et son initiale (m17) */
function icOffre(a, c) {
  var t = sansAccent(a.nom + ' ' + (a.cit || '') + ' ' + a.vals.join(' ') + ' ' + (a.offre ? JSON.stringify(a.offre) : ''));
  if (/occasion|annonce|laver|usag/.test(t)) return 'recycle';
  if (/repar/.test(t)) return 'cle';
  if (/frigo|neuf/.test(t)) return 'frigo';
  if (/palette|\bmin\b|1200/.test(t)) return 'palette';
  if (/offert|gratuit/.test(t)) return 'camion';
  if (/kegland|brewtools|shop|hops|brau|land\b|pack|33/.test(t)) return 'magasin';
  return icCat(c);
}
function tuileOffre(c, a, C) { var im = imgDe(c, a.ligne); return '<span class="am-tuile of">' + (im ? '<img src="' + esc(im) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : IC(icOffre(a, c), 20)) + '<i class="mono">' + esc(a.nom.replace(/^[^A-Za-zÀ-ÿ0-9]+/, '').charAt(0).toUpperCase()) + '</i></span>'; }
/* valeur courte pour une colonne étroite (le texte entier reste au toucher) */
function abrV(v) { var s = String(v), m;
  if ((m = s.match(/^(\d[\d’' ]*)\s*min\b/i))) return '≥ ' + m[1].trim();
  if ((m = s.match(/^(\d[\d’' ]*)\s*seul/i))) return '≤ ' + m[1].trim();
  if ((m = s.match(/^par\s+(\d[\d’' ]*)$/i))) return m[1].trim();
  return s; }
function uniteDe(vals) { var U = null, ok = true;
  vals.forEach(function (v) { if (numDe(v) == null) return; var s = String(v).replace(/^[≥≤~≈+]?\s?[\d’' .,]+\s*/, '').trim(); if (!s || s.length > 5) { ok = false; return; } if (U == null) U = s; else if (U !== s) ok = false; });
  return ok && U ? U : null; }

/* ====================================================================== Comparer : la vue dédiée (son choix du 17.11 : h04-7, v03-4, g05-8, g01-8, h06-7) */
function lignesCmp(D) {
  var C = D.comp, o = D.o, R = [];
  if (C.besoin) {
    R.push({ id: 'tot', nom: 'Total ' + C.besoin, court: 'Total', unit: 'CHF', dir: 'moins', vals: C.arts.map(function (a) { return a.total ? (a.total.livInconnue ? '≥ ' : '') + fmtN(a.total.chf) : '?'; }), num: C.arts.map(function (a) { return a.total ? a.total.chf : null; }), m: C.arts.map(function (a) { return !!a.manque; }), g: 'calc' });
    R.push({ id: 'pu', nom: 'Par unité', court: '/unité', unit: 'CHF', dir: 'moins', vals: C.arts.map(function (a) { return a.total ? (a.total.livInconnue ? '≥ ' : '') + fmt2(a.total.chf / (a.manque ? a.total.q : C.besoin)) : '?'; }), num: C.arts.map(function (a) { return a.total ? a.total.chf / (a.manque ? a.total.q : C.besoin) : null; }), m: C.arts.map(function (a) { return !!a.manque; }), g: 'calc' });
  }
  C.crit.forEach(function (cr, j) {
    var nom = critNom(cr.nom), vals = C.arts.map(function (a) { return a.vals[j]; }), num = vals.map(numDe), un = uniteDe(vals);
    var dir = 'moins';
    if (cr.g != null && num[cr.g] != null) { var autres = num.filter(function (v, i) { return v != null && i !== cr.g; }); dir = autres.every(function (v) { return num[cr.g] <= v; }) ? 'moins' : 'plus'; }
    else if (!prixLike(nom)) dir = 'plus';
    R.push({ id: 'c' + j, j: j, nom: nom, court: nom, unit: un, dir: dir, vals: vals, num: num, g: cr.g, m: C.besoin ? C.arts.map(function (a) { return !!a.manque; }) : null, txt: num.every(function (v, i) { return v == null || vals[i] === '?'; }) });
  });
  (o.critsPlus || []).forEach(function (n, i) { R.push({ id: 'p' + i, nom: n.nom, court: n.nom, ia: n.ia, vals: C.arts.map(function () { return '?'; }), num: C.arts.map(function () { return null; }), txt: true, plus: true }); });
  return R;
}
function meilleurDe(r, A) {
  if (r.g === 'calc') { var gw = gagnant(org.__D.comp, org.__D.o); return gw ? gw.i : null; }
  if (r.j == null) return null;
  var v = critVerifie(org.__D.comp, A.filter(function (a) { return !(r.m && r.m[a.i]); }), r.j); return v ? v.w.i : null;
}
/* compromis : calculé par l'app quand il y a un besoin (B14), recalculé après Écarter ; sinon la phrase de l'IA seulement si chaque nombre se retrouve dans les valeurs */
function compromisDe(D) {
  var C = D.comp, o = D.o, A = actifs(C, o);
  if (C.besoin) {
    var gw = gagnant(C, o); if (!gw) return null;
    var cov = A.filter(function (a) { return a.total && !a.manque && a !== gw; }).sort(function (a, b) { return a.total.chf - b.total.chf; }), s2 = cov[0];
    var u = A.filter(function (a) { return a.manque && a.total && a.offre && NUM(a.offre.prix) < NUM(gw.offre.prix); }).sort(function (a, b) { return NUM(a.offre.prix) - NUM(b.offre.prix); })[0];
    var t = gw.nom + ' : ' + fmtN(gw.total.chf) + ' CHF pour ' + C.besoin;
    if (s2) t += ', ' + (s2.total.livInconnue ? 'au moins ' : '') + fmtN(s2.total.chf - gw.total.chf) + ' de moins que ' + s2.nom;
    t += '.';
    if (u) t += ' ' + u.nom + ' est moins cher à l’unité, mais ' + u.total.q + ' seulement.';
    return { t: t, calc: true };
  }
  if (!C.compromis) return null;
  var N = [];
  A.forEach(function (a) { a.vals.forEach(function (v) { var n = numDe(v); if (n != null) N.push(n); }); });
  var ok = (String(C.compromis).match(/\d[\d’' ]*(?:[.,]\d+)?/g) || []).every(function (s) { var n = NUM(s); return N.some(function (x) { return x === n; }) || N.some(function (x) { return N.some(function (y) { return Math.abs(Math.abs(x - y) - n) < 0.01; }); }); });
  return ok ? { t: C.compromis, calc: false } : null;
}
function vueComparer(D) {
  var C = D.comp, o = D.o, c = D.c, A = actifs(C, o), R = lignesCmp(D);
  var classables = R.filter(function (r) { return !r.txt && !(C.besoin && r.j != null && r.j === C.iq) && r.num.filter(function (v) { return v != null; }).length >= 2; });
  var sel = classables.filter(function (r) { return r.id === critSel[c.id]; })[0] || classables[0], ordre = A.slice();
  var x = '<div class="am-cmpv"><div class="am-ch"><button class="am-b44" data-act="cmp-retour" aria-label="Retour à Organisé">' + IC('gauche', 22) + '</button><div><h2>Comparer</h2><small>' + A.length + ' offres' + (C.besoin ? ' · pour ' + C.besoin + ' livrées' : '') + ' · ' + nCarac(D) + ' caractéristiques</small></div></div>';
  if (sel) {
    x += '<div class="am-crits" role="tablist">' + classables.map(function (r) { return '<button role="tab" data-act="cmp-crit" data-id="' + r.id + '" class="' + (r === sel ? 'on' : '') + '">' + esc(r.nom) + '</button>'; }).join('') + '</div>';
    var w = meilleurDe(sel, A);
    var items = A.map(function (a) { var v = sel.num[a.i], m = !!(sel.m && sel.m[a.i]), e = v != null && sel.j != null && estEstime(c, a.ligne, a.vals[sel.j]);
      return { a: a, v: v, m: m, e: e, r: sel.id, lab: v == null ? '<i class="am-mv">?</i> pas noté' : (e ? '≈ ' : '') + esc(sel.vals[a.i]) + (m ? ' · ne couvre pas ' + C.besoin : '') }; });
    var K = items.filter(function (x) { return x.v != null && !x.m; }).sort(function (x, y) { return sel.dir === 'moins' ? x.v - y.v : y.v - x.v; });
    ordre = K.concat(items.filter(function (x) { return x.m; }), items.filter(function (x) { return x.v == null && !x.m; })).map(function (x) { return x.a; });
    x += '<div class="am-rk" data-booster="jauge"><div class="hd">' + esc(sel.nom) + (sel.unit ? ' <small>' + esc(sel.unit) + '</small>' : '') + ' <small>· ' + (sel.dir === 'moins' ? 'moins = mieux' : 'plus = mieux') + '</small>' + (w != null ? '<span class="r">' + IC('coche', 13) + ' n° 1</span>' : '') + '</div>' +
      barresRang(items, sel.dir, w, 'am-rr') + '</div>';
  } else { var g0 = gagnant(C, o); if (g0) ordre = [g0].concat(A.filter(function (a) { return a !== g0; })); }
  /* côte à côte : colonnes dans l'ordre du classement, n° 1 à gauche ; en-têtes et libellés collés au défilement */
  x += '<div class="am-h3">Côte à côte <small>le meilleur en vert</small></div><div class="am-tabw"><table class="am-cmp" data-booster="comparer"><thead><tr><th class="k"></th>' + ordre.map(function (a) {
    return '<th><button class="hd' + (o.choisi === a.i ? ' sel' : '') + '" data-ci="' + a.i + '" data-r="hd">' + tuileOffre(c, a, C) + '<span class="nm" data-nom>' + esc(a.nom) + '</span>' + (a.manque && a.total ? '<small class="m">' + a.total.q + ' seul.</small>' : '') + exHtml(c, a.ligne) + (o.choisi === a.i ? '<span class="am-et decide">choisi</span>' : '') + '</button></th>'; }).join('') + '</tr></thead><tbody>';
  R.forEach(function (r) {
    var w = meilleurDe(r, A);
    x += '<tr><td class="k"><b>' + esc(r.court) + '</b>' + (r.unit && r.court.slice(-r.unit.length) !== r.unit ? '<small>' + esc(r.unit) + '</small>' : '') + (r.ia ? ' <span class="am-tag">' + IC('ia', 12) + '</span>' : r.plus ? ' <small>à remplir</small>' : '') + '</td>' + ordre.map(function (a) {
      var v = r.vals[a.i], u = v === '?' || v == null, srcL = r.j != null && a.srcs && a.srcs[r.j] === 'lien', e = !u && r.j != null && estEstime(c, a.ligne, v), m = r.m && r.m[a.i];
      var cl = u ? 'u' : a.i === w ? 'w' : m ? 'm' : r.txt ? 't' : '', aff = u ? '' : r.unit ? String(v).split(r.unit).join('').trim() : abrV(v);
      return '<td><button class="cv ' + cl + '" data-ci="' + a.i + '" data-r="' + r.id + '" title="' + esc(u ? 'pas noté' : v) + '">' + (u ? '<i class="am-mv">?</i>' : (e ? '≈ ' : '') + esc(aff)) + (srcL ? ' ' + IC('lien', 12) : '') + '</button></td>'; }).join('') + '</tr>';
  });
  x += '</tbody></table></div>';
  var cp = compromisDe(D);
  if (cp) x += '<div class="am-comp"><b>Compromis</b> <span class="am-tag' + (cp.calc ? ' calc' : '') + '">' + (cp.calc ? 'calculé' : IC('ia', 12) + 'IA, vérifié') + '</span><br>' + esc(cp.t) + '</div>';
  var E = (o.ecartes || []).map(function (i) { return C.arts[i]; }).filter(Boolean);
  if (E.length) x += '<div class="am-h3">Écartés · ' + E.length + '</div>' + E.map(function (a) { return '<div class="am-ec">' + tuileOffre(c, a, C) + '<span class="t"><b>' + esc(a.nom) + '</b>écarté par toi' + (o.ecartesLe && o.ecartesLe[a.i] ? ' · ' + esc(quandCH(o.ecartesLe[a.i], true)) : '') + '</span><button class="am-b2" data-act="reprendre" data-i="' + a.i + '">Reprendre</button></div>'; }).join('');
  x += '<div class="am-cact"><button data-act="crit-ajout">' + IC('plus', 16) + 'Ajouter une caractéristique</button><button class="ia" data-act="crit-proposer"' + (o.critsEnCours ? ' disabled' : '') + '>' + IC('ia', 16) + (o.critsEnCours ? 'L’IA cherche…' : 'Proposer') + '</button></div>';
  if (ajoutCrit) x += '<form class="am-addc"><input id="am-crit" type="text" placeholder="Ex. délai, garantie, poids" enterkeyhint="done" autocomplete="off"><button type="submit">Ajouter</button></form>';
  x += '<div class="am-leg"><span><span class="am-est">≈</span> estimé</span><span><i class="am-mv">?</i> pas noté</span><span class="am-lk">' + IC('lien', 12) + ' lu sur son lien</span><span>touche une valeur : sa ligne</span></div></div>';
  return x;
}
function actCmp(D) {
  var C = D.comp, o = D.o, gw = gagnant(C, o);
  if (o.choisi != null && C.arts[o.choisi]) return B('cmp-retour', IC('coche', 18) + 'Choisi : ' + esc(C.arts[o.choisi].nom), 1);
  return (gw ? B('prendre', IC('coche', 18) + 'Prendre ' + esc(gw.nom), 1, ' data-i="' + gw.i + '"') : '') + B('cmp-retour', 'Organisé');
}
/* deux caractéristiques qui partagent un mot de 4 lettres ou plus sont une même caractéristique (m19) */
function memeCrit(a, b) { var m = function (s) { return sansAccent(s).split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 4; }); }, A = m(a), Bm = m(b); return A.some(function (w) { return Bm.indexOf(w) >= 0; }); }
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
    var deja = lignesCmp(D).map(function (x) { return sansAccent(x.nom); }), L = (r && Array.isArray(r.caracteristiques) ? r.caracteristiques : []).map(function (x) { return String(x).trim(); }).filter(function (x) { return x && !lignesCmp(D).some(function (r) { return memeCrit(r.nom, x); }); }).slice(0, 4);
    o.critsPlus = (o.critsPlus || []).concat(L.map(function (n) { return { nom: n, ia: true }; })); geste('proposer des caractéristiques', L.join(', '));
    toast(L.length ? '✦ ' + L.length + ' caractéristiques proposées · à remplir' : '✦ Rien de plus à proposer');
  }).catch(function () { toast('✦ Proposer : IA absente, réessaie plus tard'); }).then(function () { o.critsEnCours = false; sauver(); if (courant() === c) rendreOrg(); });
}

/* ====================================================================== liens : image, état, Relire, IA forte */
function enRelecture(id) { var r = etat.relire && etat.relire[id]; if (!r) return null; var d = lienLu(id); return d && d.lu && new Date(d.lu) > new Date(r.quand) ? null : r; }
function liensHtml(c, D) {
  var L = liensDe(urlsParLigne(c)); if (!L.length) return '';
  var arts = D.comp ? D.comp.arts : [];
  return sec('lien', 'Liens · ' + L.length, '<div class="am-liens">' + L.map(function (x) {
    var d = lienLu(x.id), r = enRelecture(x.id), dom = x.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0], im = d && typeof d.image === 'string' && /^https:\/\//.test(d.image) ? d.image : null;
    var px = d && d.prix && d.prix[0] ? esc((typeof d.prix[0].prix === 'number' ? d.prix[0].prix.toFixed(2) : chaineLien(d.prix[0].prix)) + ' ' + chaineLien(d.prix[0].devise) + ' / ' + chaineLien(d.prix[0].quantite) + ' ' + chaineLien(d.prix[0].unite)) : '';
    var st = r ? '<span class="st att">' + IC('relire', 13) + (r.forte ? 'IA forte · ' : '') + 'relecture demandée ' + esc(quandCH(r.quand)) + '</span>' : d ? '<span class="st">' + IC('coche', 13) + 'lu ' + esc(quandCH(luLe(d) === '1' ? Date.now() : luLe(d), true)) + '</span>' : '<span class="st att">' + IC('lien', 13) + (liensEtat === 'sans' ? 'non lu' : 'en lecture') + '</span>';
    var a = arts.filter(function (y) { return y.ligne === x.ligne; })[0];
    return '<div class="am-lien' + (r ? ' att' : '') + '"><button class="tl" data-n="' + x.ligne + '" aria-label="Sa ligne ' + x.ligne + '"><span class="am-tuile">' + (im ? '<img src="' + esc(im) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : IC(a ? icOffre(a, c) : 'lien', 22)) + '</span></button>' +
      '<span class="m"><b data-nom>' + esc(d && d.titre ? d.titre : dom) + '</b>' + (d && d.titre ? '<span class="dm">' + esc(dom) + '</span>' : '') + (px ? '<span class="px">' + px + (d && d.dispo ? ' · ' + esc(d.dispo) : '') + '</span>' : '') + st + '</span>' +
      '<button class="am-b44" data-act="lien-menu" data-id="' + x.id + '" data-u="' + esc(x.url) + '" aria-label="Relire ce lien">' + IC('plush', 20) + '</button></div>'; }).join('') + '</div>');
}
function menuLien(c, id, url) {
  var dom = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
  feuilleAm('<h2>' + IC('lien', 18) + ' ' + esc(dom) + '</h2>' +
    '<button class="am-fl" data-x="relire">' + IC('relire', 18) + '<span class="t">Relire<small>le prix et la dispo ont pu changer</small></span></button>' +
    '<button class="am-fl ia" data-x="forte">' + IC('ia', 18) + '<span class="t">Relire avec l’IA forte<small>lecture plus poussée, plus lente</small></span></button>' +
    '<a class="am-fl" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + IC('droite', 18) + '<span class="t">Ouvrir le site</span></a>',
    function (x) { fermerAm(); if (x === 'relire' || x === 'forte') relireLien(c, id, url, x === 'forte'); });
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
  if (a === 'lien-menu') { menuLien(c, b.dataset.id, b.dataset.u); return true; }
  if (a === 'suite') { geste('étape suivante', ''); ouvrirAide(); return true; }
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

/* ====================================================================== passe de correction 26.11 : toast, outils */
/* le toast se pose au-dessus de la barre d'action et du pouce, jamais dessus (m8) */
function toast(t, action, f) {
  var old = document.querySelector('.m4b-toast'); if (old) old.remove();
  var el = h('div', { class: 'm4b-toast', role: 'status' }, h('span', null, t), action ? h('button', { type: 'button', class: 'm4b-toast-a', onclick: function () { el.remove(); f(); } }, action) : null); $('app').appendChild(el);
  var app = $('app').getBoundingClientRect(), haut = app.bottom;
  ['.vue.on .am-act:not([hidden])', '.vue.on #pied-org:not([hidden])', '.vue.on #outils:not([hidden])', '.vue.on .m4b-pied', '.am-nav'].forEach(function (q) { var n = document.querySelector(q); if (n && n.offsetParent !== null) { var b = n.getBoundingClientRect(); if (b.height && b.top < haut) haut = b.top; } });
  el.style.bottom = Math.max(8, Math.round(app.bottom - haut + 8)) + 'px';
  clearTimeout(minuteurToast); minuteurToast = setTimeout(function () { el.remove(); }, action ? 5000 : 2600);
}
/* outils de Mes notes : chaque icône porte son mot (m13) */
function btnOutil(icone, nom, f, cls) { var mot = { 'b-iapen': 'Ranger', 'b-image': 'Photo', 'b-lien': 'Lien', 'b-case': 'Case', 'b-micro': 'Dicter' }[icone] || nom.split(' ')[0];
  return h('button', { type: 'button', class: 'm4b-o am-o' + (cls ? ' ' + cls : ''), 'aria-label': nom, title: nom, onclick: f }, ico(icone), h('span', { class: 'am-om' }, mot)); }

/* une bulle de ligne ouverte dans une tuile ou une branche se pose sous le bloc, en pleine largeur */
new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType !== 1 || !/bub/.test(n.className)) return; var box = n.parentElement && n.parentElement.closest('.am-g4,.am-arbre'); if (box && box !== n.parentElement) { n.classList.remove('in'); box.after(n); } else if (box) box.after(n); }); }); }).observe(org, { childList: true, subtree: true });
