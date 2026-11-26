/* ====================================================================== liens lus par Claude (26.11, work/missions/2026-11-26-liens/LIENS.md)
   liens/<id> : écrit par la session pilote (faits d'une page lue) ; la page le lit et le donne à l'IA.
   demandes/<id> : écrit ici pour chaque lien https de ses notes sans liens/<id> ; la session le traite.
   id = "u" + djb2 de l'URL exacte (le href de la note) : h = 5381 ; h = h * 33 + code UTF-16, sur 32 bits non signés ; en hexa.
   Ses valeurs passent par textContent ou escL(). PAS-DE-HARCELEMENT : aucune question au pouce ; un manque est un « ? » à sa place. */
function idLien(url) { var x = 5381; for (var i = 0; i < url.length; i++) x = (Math.imul(x, 33) + url.charCodeAt(i)) >>> 0; return 'u' + x.toString(16); }
var RE_URL = /https:\/\/[^\s<>"«»]+/g;
function urlsDe(t) { return (String(t || '').match(RE_URL) || []).map(function (u) { return u.replace(/[).,;:!?’'»]+$/, ''); }); }
/* les liens d'une ligne : le href exact de ses <a> (la ligne n'en montre que l'hôte), puis les https écrits en clair */
function urlsBloc(el) {
  var U = []; if (!el || el.nodeType !== 1) return U;
  Array.prototype.forEach.call(el.querySelectorAll('a[href]'), function (a) { var u = a.getAttribute('href'); if (/^https:\/\//.test(u) && U.indexOf(u) < 0) U.push(u); });
  urlsDe(el.textContent).forEach(function (u) { if (U.indexOf(u) < 0) U.push(u); });
  return U;
}
function urlsParLigne(c) {
  var els; if (doc && etat && etat.courant === c.id) els = blocs(); else { var d = document.createElement('div'); d.innerHTML = c.html || ''; els = Array.prototype.slice.call(d.children); }
  return els.map(urlsBloc);
}
/* UL : les liens de chaque ligne (urlsParLigne) */
function liensDe(UL) { var L = []; (UL || []).forEach(function (l, i) { (l || []).forEach(function (u) { L.push({ ligne: i + 1, url: u, id: idLien(u) }); }); }); return L; }
var liensValider = [];
var liensLus = {}, liensEtat = 'attente'; /* attente, lent (rien après 1,5 s), lu (instantané reçu), sans (pas de base) */
var liensPrets = new Promise(function (ok) {
  function fini(e) { if (liensEtat === 'attente') liensEtat = e; ok(); }
  setTimeout(function () { fini('lent'); }, 1500);
  capDb.then(function (db) {
    if (!db) { fini('sans'); return; }
    try {
      db.collection('liens').onSnapshot(function (snap) {
        var n = {}; snap.docs.forEach(function (d) { if (!d.exists) return; var x = d.data(); if (x && typeof x === 'object') n[d.id] = x; });
        liensLus = n; liensEtat = 'lu'; ok(); surLiens();
      }, function () { fini('sans'); });
    } catch (e) { fini('sans'); }
  });
});
function lienLu(id) { var d = liensLus[id]; return d && typeof d === 'object' ? d : null; }
function luLe(d) { return String(d.lu || '1'); }
/* la marque d'un article dont le lien n'est pas encore lu : jamais un « ? » muet (LIENS-NON-LUS) */
function marqueLien(UL, ligne) {
  var n = Number(ligne); if (!UL || !(n >= 1 && n <= UL.length)) return '';
  var U = UL[n - 1] || []; if (!U.length) return '';
  if (U.some(function (u) { return lienLu(idLien(u)); })) return '';
  return liensEtat === 'sans' ? '🔗 non lu' : '🔗 en lecture';
}
function chaineLien(x) { return x == null ? '' : String(x); }
function prixLien(y) { y = y || {}; return [chaineLien(y.quantite), chaineLien(y.unite)].join(' ').trim() + ' = ' + [chaineLien(y.prix), chaineLien(y.devise)].join(' ').trim() + (y.note ? ' (' + chaineLien(y.note) + ')' : ''); }
function texteLiens(UL) {
  var L = liensDe(UL); if (!L.length) return '';
  var dern = L.map(function (x) { var d = lienLu(x.id); return d && d.lu ? String(d.lu) : ''; }).filter(Boolean).sort().pop();
  var out = ['', 'Ce que disent ses liens' + (dern ? ' (lus par Claude le ' + jour(dern) + ')' : '') + ' :'];
  L.forEach(function (x) {
    var d = lienLu(x.id);
    if (!d) { out.push('- ligne ' + x.ligne + ' (' + x.url + ') : pas encore lu. Ses valeurs valent "?" (l’app le marque « 🔗 en lecture »).'); return; }
    var p = [];
    if (d.titre) p.push('« ' + chaineLien(d.titre) + ' »');
    var pr = Array.isArray(d.prix) ? d.prix : []; if (pr.length) p.push('prix : ' + pr.map(prixLien).join(' ; '));
    if (d.dispo) p.push('dispo : ' + chaineLien(d.dispo));
    if (d.livraison) p.push('livraison : ' + chaineLien(d.livraison));
    var f = Array.isArray(d.faits) ? d.faits : []; if (f.length) p.push('faits : ' + f.map(function (y) { return chaineLien(y && y.label) + ' : ' + chaineLien(y && y.valeur); }).join(' ; '));
    out.push('- ligne ' + x.ligne + ' (' + x.url + ', lu le ' + (d.lu ? jour(d.lu) : '?') + ') : ' + p.join(' — '));
  });
  return out.join('\n');
}
/* validation côté page : une valeur "lien" doit exister dans liens/<id> du lien de sa ligne */
function nombresLien(t) { return (String(t).replace(/(\d)[ ’'](?=\d{3})/g, '$1').match(/\d+(?:[.,]\d+)?/g) || []).map(function (n) { return parseFloat(n.replace(',', '.')); }); }
function normLien(t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
function texteDuLien(d) {
  var t = [d.titre, d.dispo, d.livraison];
  (Array.isArray(d.prix) ? d.prix : []).forEach(function (y) { y = y || {}; t.push(y.quantite, y.unite, y.prix, y.devise, y.note); });
  (Array.isArray(d.faits) ? d.faits : []).forEach(function (y) { y = y || {}; t.push(y.label, y.valeur); });
  return t.filter(function (x) { return x != null; }).map(String).join(' | ');
}
function valeurDuLien(tx, UL, nl) {
  var U = UL && nl >= 1 && nl <= UL.length ? UL[nl - 1] || [] : [];
  return U.some(function (u) {
    var d = lienLu(idLien(u)); if (!d) return false;
    var src = texteDuLien(d), ns = nombresLien(src), nv = nombresLien(tx);
    return nv.length ? nv.every(function (n) { return ns.indexOf(n) >= 0; }) : !!normLien(tx) && normLien(src).indexOf(normLien(tx)) >= 0;
  });
}
function liensVus(UL) { var v = {}; liensDe(UL).forEach(function (x) { var d = lienLu(x.id); if (d) v[x.id] = luLe(d); }); return v; }
/* au rangement : une demande par lien https sans liens/<id>, une seule fois */
function demanderLiens(c, UL) {
  if (liensEtat !== 'lu') return;
  etat.demandes = etat.demandes || {};
  liensDe(UL).forEach(function (x) {
    if (lienLu(x.id) || etat.demandes[x.id]) return;
    var dm = { url: x.url, carnet: titreDe(c), quand: new Date().toISOString() };
    etat.demandes[x.id] = dm.quand; sauver();
    capDb.then(function (db) {
      if (!db) return;
      try { Promise.resolve(db.collection('demandes').doc(x.id).set(dm)).catch(function () { delete etat.demandes[x.id]; sauver(); }); } catch (e) {}
    });
  });
}
function escL(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (x) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[x]; }); }
function lkHtml(a, j) { return a.srcs && a.srcs[j] === 'lien' ? '<small class="lk" title="lu sur son lien">🔗</small>' : ''; }
function attenteHtml(a) { return a.attente ? '<span class="hc lk-at">' + escL(a.attente) + '</span>' : ''; }
/* un lien vient d'être lu : la lecture IA du carnet repart, une fois par lien et par lecture du lien */
function verifierLiens(c) {
  if (!c || !c.org || estEnLecture(c)) return;
  var vus = c.org.liens || {}, neufs = [];
  c.liensRelus = c.liensRelus || {};
  liensDe(urlsParLigne(c)).forEach(function (x) { var d = lienLu(x.id); if (!d) return; var cle = x.id + '@' + luLe(d); if (vus[x.id] !== luLe(d) && !c.liensRelus[cle] && neufs.indexOf(cle) < 0) neufs.push(cle); });
  if (!neufs.length) return;
  neufs.forEach(function (k) { c.liensRelus[k] = true; });
  journal({ quand: new Date().toISOString(), geste: 'lien lu : relecture', quoi: neufs.join(' '), carnetTitre: titreDe(c) });
  if (!navigator.onLine) { c.attente = true; sauver(); return; }
  sauver(); enFile(c);
}
function surLiens() {
  etat.carnets.forEach(verifierLiens);
  var c = courant(); if (c && vue === 'org') rendreOrg();
}
