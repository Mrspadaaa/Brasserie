/* ====================================================================== Organisé : la v7 « La recette », retouchée (nuit du 25.11)
   Base : visuel/v7.html (juges tour 3 : 8 · 8,5 · 8,3). Retouches : un seul vert (👑) ; « Prendre » suit 👑, jamais « ✦ conseillé » ;
   après « Prendre », le héros devient « Commander chez <offre> · J-n », la colonne choisie ressort ; la jauge dit « total » ;
   le déjà fait sort des pistes et du compte n/m ; une seule icône par rangée ; IA absente : ses lignes en entier, sa date avec ses mots ;
   barres horizontales à 4 offres ou plus. Pas de frise : l'avancement dépend du genre (achat : comparé › choisi › commandé ; échéance : J-n). */
var org = $('p-org');
var MC = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
var JSEM = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
var GIC = { 'a-acheter': '🛒', 'a-faire': '☐', question: '❓', conseil: '💡', note: '📝' };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function emoDe(s) { var m = String(s || '').match(/^(\S+)\s+([\s\S]*)$/); return m && !/[A-Za-z0-9]/.test(m[1]) ? [m[1], m[2]] : ['', String(s || '')]; }
function NUM(s) { var m = String(s).replace(/(\d)[ ’'](?=\d{3})/g, '$1').match(/\d+(?:[.,]\d+)?/); return m ? parseFloat(m[0].replace(',', '.')) : NaN; }
function norm(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9à-ÿ]+/g, ' ').trim(); }
function sansAccent(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

/* --- dates : ses mots, et les jours qui restent (calcul de l'app, depuis le jour où il a écrit) --- */
function jourDit(t) { for (var i = 0; i < 7; i++) if (new RegExp('(^|[^a-zà-ÿ])' + JSEM[i] + '([^a-zà-ÿ]|$)').test(t)) return i; return -1; }
function lireDateV7(s, ref) {
  var t = String(s || '').toLowerCase(), R = new Date(ref || Date.now()), m; R.setHours(12, 0, 0, 0);
  var d = lireDate(t, ref); if (d) return d;
  if (/aujourd/.test(t)) return { d: R };
  if (/(^|\s)demain(\s|$)/.test(t)) return { d: new Date(+R + 864e5) };
  if ((m = t.match(/(?:^|\s)(?:avant le|le)\s+(\d{1,2})(?:\s+du mois)?(?:\s|$)/))) { var x = new Date(R.getFullYear(), R.getMonth(), +m[1], 12); if (x < R) x = new Date(R.getFullYear(), R.getMonth() + 1, +m[1], 12); return { d: x }; }
  var js = jourDit(t); if (js >= 0) return { d: new Date(+R + ((js - R.getDay() + 7) % 7 || 7) * 864e5) };
  return null;
}
function motsDate(s) {
  var w = String(s).replace(/^(prévu|prevu)\s+(le\s+)?/i, '').split(/\s+/).slice(0, 3).join(' ');
  return w.replace(/\s+(au|le|à|du|de)$/i, '');
}
function dateV7(txt, ref) {
  if (!txt) return null; var r = lireDateV7(txt, ref); if (!r) return null;
  var j = joursDe(r.d);
  var dit = /(^|[^a-zà-ÿ])(janv|févr|fevr|mars|avr|mai|juin|juil|août|aout|sept|oct|nov|déc|dec|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|demain|aujourd)|\d\.\d/i.test(txt);
  var mots = dit ? motsDate(txt) : (r.approx ? '≈ ' : '') + r.d.getDate() + ' ' + MC[r.d.getMonth()];
  var js = jourDit(String(txt).toLowerCase()), warn = js >= 0 && /\d{1,2}\s+[a-zéû]/i.test(txt) && r.d.getDay() !== js ? JSEM[r.d.getDay()] : null;
  return { d: r.d, j: j, txt: mots, plein: txt, compte: j < 0 ? 'J+' + (-j) : 'J-' + j, niv: j <= 2 ? 'urg' : j <= 7 ? 'proche' : 'loin', warn: warn };
}

/* --- le modèle d'un carnet rangé : tout vient de sa réponse validée, de ses lignes ou d'un calcul de l'app --- */
function modele(c) {
  var o = c.org, r = o.rep, ref = c.maj;
  o.retires = o.retires || []; o.gardes = o.gardes || [];
  var D = { c: c, o: o, r: r, ic: r.emoji || catEmoji(catDe(c).nom), genre: r.genre, lignes: o.lignes, it: {} };
  var add = function (k, x) { x.k = k; D.it[k] = x; return x; };
  var horsRetires = function (k) { return o.retires.indexOf(k) < 0; };
  /* réglé : posé (Résolu), ou proposé par l'IA avec la ligne qui le dit */
  if (c.etat === 'resolu' || (r.resolu && o.garde.resolu === undefined)) { var q = r.resolu || {}; D.regle = add('regle', { ic: '✅', mot: q.question || r.resume || 'Réglé', ligne: q.ligne || null, cit: q.citation || '', propose: c.etat !== 'resolu' }); }
  D.pistes = r.pistes.map(function (p, i) { return add('p' + i, { ic: p.emoji || '🔎', mot: p.texte, ok: p.statut === 'trouve' ? 'trouve' : p.statut === 'pas_trouve' ? 'non' : 'verif', ligne: p.ligne, cit: p.citation }); });
  D.faits = (r.faits || []).map(function (f, i) { return add('f' + i, { ic: f.emoji || '✓', mot: f.texte, ligne: f.ligne, cit: f.citation }); });
  D.comp = r.comparaison ? comparaisonDe(c, add) : null;
  var noms = D.comp ? D.comp.arts.map(function (a) { return norm(a.nom); }) : [];
  D.options = (o.garde.options === false ? [] : r.options).map(function (op, i) { return { op: op, i: i }; })
    .filter(function (x) { return noms.indexOf(norm(x.op.titre)) < 0 && horsRetires('o' + x.i); })
    .map(function (x) { var op = x.op; return add('o' + x.i, { ic: op.emoji || '🛠️', mot: op.titre, cout: op.cout, ia: op.source === 'ia' && o.gardes.indexOf('o' + x.i) < 0, conseil: op.conseille && !o.sansConseil, ligne: op.ligne, cit: op.citation, io: x.i, inconnu: !op.cout || /^\?/.test(op.cout) }); });
  D.taches = [];
  c.miens.forEach(function (m, i) {
    var it = add('m' + i, { ic: m.emoji || (m.type === 'piste' ? '🔎' : m.type === 'option' ? '🛠️' : '☐'), mot: m.texte, mien: true, ia: !!m.ia, ligneTxt: m.ligneTxt, ligne: 0, cit: m.ligneTxt, fait: !!m.fait, mi: i });
    if (m.type === 'piste') { it.ok = 'verif'; D.pistes.push(it); } else if (m.type === 'option') { it.inconnu = true; D.options.push(it); } else D.taches.push(it);
  });
  var connus = D.options.filter(function (x) { return !x.inconnu; }).length; D.options.forEach(function (x) { x.hach = x.inconnu && connus > 0; });
  var t = r.tache && o.garde.tache !== false && horsRetires('tache') ? r.tache : null;
  D.tache = t ? add('tache', { ic: t.emoji || '☐', mot: t.titre, ligne: t.ligne, cit: t.citation, ia: !t.citation && o.gardes.indexOf('tache') < 0, date: dateV7(t.quand, ref) }) : null;
  D.ech = r.echeance ? add('ech', { ic: '⏳', mot: r.echeance.quand, quoi: r.echeance.quoi, ligne: r.echeance.ligne, cit: r.echeance.quand, date: dateV7(r.echeance.quand, ref) }) : null;
  var propre = !!(D.tache && D.tache.date);
  D.date = propre ? D.tache.date : (D.ech && D.ech.date) || null;
  D.dateObjet = !propre && D.ech && D.date && (D.tache || D.regle) ? (D.ech.quoi || '') : '';
  D.echRow = !!(propre && D.ech && D.ech.date && D.ech.date.j !== D.tache.date.j);
  /* un chiffre déjà dit ailleurs n'est pas répété ; deux de même unité font une paire */
  var dit = [].concat(D.options.map(function (x) { return x.cout; }), (r.liste || []).map(function (l) { return l.texte; }), D.regle ? [D.regle.mot] : [],
    D.comp ? D.comp.arts.reduce(function (a, x) { return a.concat(x.vals); }, []) : []).filter(Boolean);
  D.chiffres = (r.chiffres || []).map(function (x, i) { return add('c' + i, { ic: x.emoji || '#', mot: x.valeur, label: x.label || '', ligne: x.ligne, cit: x.valeur }); })
    .filter(function (x) { return !dit.some(function (s) { return String(s).indexOf(x.mot) >= 0; }); });
  D.paire = null;
  if (D.chiffres.length === 2) { var a = D.chiffres[0], b = D.chiffres[1], u = function (s) { return s.replace(/[\d,.\s]/g, ''); };
    if (u(a.mot) && u(a.mot) === u(b.mot)) D.paire = { a: a, b: b, baisse: NUM(b.mot) < NUM(a.mot) }; }
  D.liste = (r.liste || []).map(function (l, i) { return add('l' + i, { mot: l.texte, ligne: l.ligne, cit: l.citation, i: i, fait: !!o.coches[i] }); });
  D.retenir = (r.retenir || []).map(function (x, i) { return add('r' + i, { ic: x.emoji || '📌', mot: x.texte, ligne: x.ligne, cit: x.citation }); });
  D.periode = r.periode;
  /* Aide : le conseil de la lecture, puis ce que l'IA propose sur demande ; une à la fois */
  D.aide = [];
  if (r.conseil && !o.conseilOff) { var e = emoDe(r.conseil); D.aide.push({ src: 'conseil', t: 'sugg', ic: e[0] || '💡', mot: e[1] }); }
  if (c.aide && c.aide.items) c.aide.items.forEach(function (it, i) { D.aide.push({ src: 'aide', i: i, t: it.type === 'suggestion' ? 'sugg' : it.type, ic: it.emoji || TYPE_AIDE[it.type].ic, mot: it.texte, pq: it.pourquoi }); });
  return D;
}

/* qui gagne quoi ; le coût total pour son besoin est un calcul de l'app sur les extraits cités (prix, min, max, livraison) */
function comparaisonDe(c, add) {
  var o = c.org, r = o.rep, cp = r.comparaison, L = 'ABCD';
  var arts = cp.articles.map(function (a, i) {
    var op = r.options.filter(function (x) { return norm(x.titre) === norm(a.nom); })[0] || r.options.filter(function (x) { return x.ligne && x.ligne === a.ligne; })[0];
    return add(L[i], { i: i, nom: a.nom, ic: op ? op.emoji : '', ligne: a.ligne, cit: a.citation, vals: a.valeurs.map(function (v) { return v.texte; }),
      conseil: !!(op && op.conseille) && !o.sansConseil, io: op ? r.options.indexOf(op) : -1, offre: a.offre || null, art: true });
  });
  var crit = cp.criteres.map(function (x, j) { var e = emoDe(x); return { ic: e[0] || '•', nom: e[1], g: cp.gagnant[j] }; });
  var C = { arts: arts, crit: crit, compromis: cp.compromis, vide: arts.every(function (a) { return a.vals.every(function (v) { return v === '?'; }); }), totalG: null, besoin: null };
  C.iq = crit.map(function (x) { return /quantit/i.test(x.nom); }).indexOf(true);
  var B = cp.besoin && cp.besoin.quantite;
  if (B) {
    arts.forEach(function (a) {
      var f = a.offre; if (!f || !f.prix || isNaN(NUM(f.prix))) return;
      var q = B, manque = false;
      if (f.min && NUM(f.min) > q) q = NUM(f.min);
      if (f.max && NUM(f.max) < q) { q = NUM(f.max); manque = true; }
      var liv = f.livraison ? (/offert|gratuit|inclus/i.test(f.livraison) ? 0 : NUM(f.livraison)) : null; if (liv != null && isNaN(liv)) liv = null;
      a.total = { chf: Math.round(NUM(f.prix) * q + (liv || 0)), q: q, manque: manque, livInconnue: liv == null }; a.manque = manque;
    });
    var avec = arts.filter(function (a) { return a.total; });
    if (avec.length >= 2) {
      C.besoin = B;
      var couvre = arts.filter(function (a) { return !a.manque; });
      var best = couvre.filter(function (a) { return a.total; }).reduce(function (m, a) { return !m || a.total.chf < m.total.chf ? a : m; }, null);
      if (best && !best.total.livInconnue && couvre.every(function (a) { return a === best || (a.total && a.total.chf > best.total.chf); })) C.totalG = best.i;
    }
  }
  return C;
}

/* --- rendu --- */
var detailOuvert = {}, aideOuverte = false, aideI = 0, metaOuvert = false;
function cdHtml(d, objet, ic) {
  if (!d || !d.compte) return '';
  return '<span class="v7-cd ' + (d.niv || 'loin') + '" title="' + esc(d.plein) + '">' + (objet ? '<span class="o">' + (ic || '⏳') + ' ' + esc(objet) + '</span>' : '') +
    '<span class="n mono">' + esc(d.compte) + '</span><span class="w">' + esc(d.txt) + '</span>' + (d.warn ? '<span class="x">⚠ ' + esc(d.warn) + '</span>' : '') + '</span>';
}
function anneau(a) {
  var t = a.ok + a.q + a.non, s = '', off = 0, C = 2 * Math.PI * 10;
  [[a.ok, 'var(--ok)'], [a.q, 'var(--att)'], [a.non, 'var(--line)']].forEach(function (x) { if (!x[0]) return; var l = x[0] / t * C;
    s += '<circle r="10" cx="13" cy="13" fill="none" stroke="' + x[1] + '" stroke-width="5" stroke-dasharray="' + (l - 1.5) + ' ' + (C - l + 1.5) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 13 13)"/>'; off += l; });
  return '<svg viewBox="0 0 26 26" aria-hidden="true">' + s + '</svg>';
}
var tagIA = '<span class="v7-tag">✦ IA</span>';
function tagConseil(k) { return '<span class="v7-cons"><span class="v7-tag">✦ conseillé</span><button class="v7-cx" data-act="sansconseil" aria-label="Retirer la marque conseillé de l’IA">✕</button></span>'; }
function srcBtn(it) { return it && (it.ligne || it.ligneTxt) ? '<button class="v7-src" data-k="' + it.k + '" aria-label="Sa ligne dans Mes notes">📝 ↩</button>' : ''; }

function heros(D) {
  var o = D.o, c = D.c;
  if (D.regle) { var g = D.regle;
    if (g.propose) return '<section class="v7-hero ok" data-utile data-booster="regle"><div class="v7-kick"><span class="v7-kind">✓ Réglé ?</span>' + tagIA + '</div>' +
      '<div class="v7-body"><span class="v7-big">' + D.ic + '</span><span class="v7-act s">' + esc(g.mot) + '</span></div>' +
      '<div class="v7-do"><button class="v7-oui" data-act="regle-oui">✓ Réglé</button><button class="v7-rouvrir" data-act="regle-non">Pas encore</button>' + srcBtn(g) + '</div></section>';
    return '<section class="v7-hero ok" data-utile data-booster="regle"><div class="v7-kick"><span class="v7-kind">✓ Réglé</span></div>' +
      '<div class="v7-body"><span class="v7-big">' + D.ic + '</span><span class="v7-act s">' + esc(g.mot) + '</span>' + cdHtml(D.date, D.dateObjet, /brass/i.test(D.dateObjet) ? '🍺' : '⏳') + '</div>' +
      '<div class="v7-do"><button class="v7-rouvrir" data-act="rouvrir">↺ Rouvrir</button>' + srcBtn(g) + '</div></section>'; }
  var C = D.comp;
  if (C && !C.vide && !D.tache) {
    if (o.choisi != null && C.arts[o.choisi]) { var a = C.arts[o.choisi];
      var steps = '<span class="v7-steps" aria-label="achat : comparé, choisi, ' + (o.commande ? 'commandé' : 'à commander') + '"><i>⚖️</i>›' + (o.commande ? '<i>✋</i>›<b>📦 commandé</b>' : '<b>✋ choisi</b>›<i>📦</i>') + '</span>';
      if (o.commande) return '<section class="v7-hero ok" data-utile data-booster="achat"><div class="v7-kick">' + steps + '</div><div class="v7-body"><span class="v7-big">📦</span><span class="v7-act s">' + esc(a.nom) + '</span>' + cdHtml(D.date) + '</div>' +
        '<div class="v7-do"><button class="v7-rouvrir" data-act="decommander">↺ Pas encore</button>' + srcBtn(a) + '</div></section>';
      return '<section class="v7-hero' + (D.date ? ' h-' + D.date.niv : ' h-loin') + '" data-utile data-booster="achat"><div class="v7-kick">' + steps + '</div><div class="v7-body"><span class="v7-big">📦</span><span class="v7-act">Commander chez ' + esc(a.nom) + '</span>' + cdHtml(D.date) + '</div>' +
        '<div class="v7-do"><button class="v7-fait" data-act="commander" aria-label="Commandé">✓</button><button class="v7-tard" data-act="tard" aria-label="Plus tard">⏭<small>plus tard</small></button><button class="v7-rouvrir" data-act="rouvrir-choix">↺ Rouvrir</button></div></section>'; }
    var gw = C.totalG != null ? C.arts[C.totalG] : null;
    return '<section class="v7-hero fin" data-utile data-booster="choisir"><div class="v7-body"><span class="v7-big">⚖️</span><span class="v7-act">Choisir l’offre</span>' + cdHtml(D.date) + '</div>' +
      (gw ? '<div class="v7-do"><button class="v7-prendre" data-act="prendre" data-i="' + gw.i + '">✓ Prendre <b>' + esc(gw.nom) + '</b></button></div>' : '') + '</section>'; }
  var t = D.tache || { k: null, ic: D.ic, mot: D.r.resume || 'Rien n’attend', ligne: null };
  var tint = ' h-' + ((D.date && D.date.niv) || 'loin');
  if (D.tache && o.tacheFaite) return '<section class="v7-hero ok" data-utile data-booster="heros"><div class="v7-kick"><span class="v7-kind">✓ Fait</span></div><div class="v7-body"><span class="v7-big">' + t.ic + '</span><span class="v7-act s barre">' + esc(t.mot) + '</span></div>' +
    '<div class="v7-do"><button class="v7-rouvrir" data-act="defait">↺ Pas fait</button>' + srcBtn(D.tache) + '</div></section>';
  if (o.tard) return '<section class="v7-hero mini' + tint + '" data-utile data-booster="heros"><span class="v7-big">⏭</span><span class="v7-act">' + esc(t.mot) + '</span>' + (D.date ? '<span class="v7-j mono">' + esc(D.date.compte) + '</span>' : '') + '<button class="v7-rouvrir" data-act="retour-tard">↺</button></section>';
  return '<section class="v7-hero' + tint + '" data-utile data-booster="heros">' + (t.ia ? '<div class="v7-kick">' + tagIA + '<button class="v7-cx" data-act="refus" data-k="tache" aria-label="Refuser la tâche proposée par l’IA">✕</button></div>' : '') +
    '<div class="v7-body"><span class="v7-big">' + t.ic + '</span><span class="v7-act">' + esc(t.mot) + '</span>' + cdHtml(D.date, D.dateObjet, /brass/i.test(D.dateObjet) ? '🍺' : '⏳') + '</div>' +
    '<div class="v7-do"><button class="v7-fait" data-act="fait" aria-label="Fait">✓</button><button class="v7-tard" data-act="tard" aria-label="Plus tard">⏭<small>plus tard</small></button>' + srcBtn(D.tache) + '</div></section>';
}

function figures(D) {
  if (D.paire) { var p = D.paire;
    return '<div class="v7-fig"><button class="v7-pair" data-k="' + p.a.k + '" data-booster="paire"><span class="e">' + (p.a.ic === '📈' && p.baisse ? '🫧' : p.a.ic) + '</span><span><span class="v mono">' + esc(p.a.mot) + '</span><span class="l">' + esc(p.a.label) + '</span></span><span class="fl ' + (p.baisse ? 'bas' : 'haut') + '">' + (p.baisse ? '↘' : '↗') + '</span><span><span class="v mono ' + (p.baisse ? 'bas' : 'haut') + '">' + esc(p.b.mot) + '</span><span class="l">' + esc(p.b.label) + '</span></span></button></div>'; }
  var F = D.chiffres.slice(0, 2); if (!F.length) return '';
  var lg = Math.max.apply(null, F.map(function (x) { return (x.mot + (/^\//.test(x.label) ? ' ' + x.label : '')).length; }));
  return '<div class="v7-fig">' + F.map(function (x) { var fs = lg > 9 ? 18 : 26, colle = /^\//.test(x.label);
    return '<button class="v7-f" data-k="' + x.k + '"><span class="e">' + x.ic + '</span><span style="min-width:0"><span class="v mono" style="font-size:' + fs + 'px">' + esc(x.mot) + (colle ? '<small> ' + esc(x.label) + '</small>' : '') + '</span>' + (!colle && x.label ? '<span class="l">' + esc(x.label) + '</span>' : '') + '</span></button>'; }).join('') + '</div>';
}

function comparaisonHtml(D) {
  var C = D.comp, A = C.arts, tot = C.besoin != null, o = D.o, ch = o.choisi != null ? o.choisi : -1;
  var liv = function (j) { return tot && /livraison/i.test(C.crit[j].nom); };
  var mots = function (j) { return A.every(function (a) { return a.vals[j] === '?' || !/\d/.test(a.vals[j]); }); };
  var J = C.crit.map(function (x, j) { return j; });
  var rangs = J.filter(function (j) { return !liv(j) && !mots(j) && !(tot && j === C.iq); }), sous = J.filter(function (j) { return !liv(j) && mots(j); });
  var hach = false, n = A.length, horiz = tot && n >= 4;
  var col = function (i) { return ch < 0 ? '' : i === ch ? ' sel' : ' eteint'; };
  var qch = function (a) { if (!tot || C.iq < 0) return ''; var v = a.vals[C.iq]; if (a.manque) return '<span class="hc m">' + C.crit[C.iq].ic + ' ⚠ <span class="mono">' + a.total.q + '</span></span>';
    var m = String(v).match(/^(\d+)\s*min/); return m ? '<span class="hc">' + C.crit[C.iq].ic + ' <span class="mono">≥' + m[1] + '</span></span>' : ''; };
  var h = '';
  if (horiz) { /* repli à 4 offres ou plus : barres horizontales, noms entiers à gauche (v2) */
    var mx = Math.max.apply(null, A.filter(function (a) { return a.total; }).map(function (a) { return a.total.chf; }));
    h += '<div class="v7-hb" data-booster="jauge"><div class="v7-hbk">🧾 <b>total</b> <small class="mono">CHF · ' + C.besoin + '</small></div>' + A.map(function (a) {
      var t = a.total, cl = !t ? 'u' : t.manque ? 'm' : C.totalG === a.i ? 'w' : ''; if (!t || t.livInconnue) hach = true;
      return '<button class="v7-hr' + col(a.i) + '" data-k="' + a.k + '"><span class="nm">' + (a.ic ? a.ic + ' ' : '') + esc(a.nom) + '</span><span class="br"><i class="' + cl + '" style="width:' + (t ? Math.max(6, Math.round(t.chf / mx * 100)) : 100) + '%">' + (t && t.livInconnue ? '<u></u>' : '') + '</i></span>' +
        '<span class="vl mono ' + cl + '">' + (t ? (t.livInconnue ? '≥' : '') + t.chf + (t.manque ? ' ⚠' : '') : '?') + (C.totalG === a.i ? ' 👑' : '') + '</span></button>'; }).join('') + '</div>';
  }
  h += '<div class="v7-cmp' + (ch >= 0 ? ' choix' : '') + '" style="grid-template-columns:44px repeat(' + n + ',minmax(0,1fr))" data-booster="comparer"><span></span>';
  h += A.map(function (a) { return '<div class="hd' + col(a.i) + '" role="button" tabindex="0" data-k="' + a.k + '">' + (a.ic ? '<span class="e">' + a.ic + '</span>' : '') + '<span>' + esc(a.nom) + '</span>' + (a.conseil ? tagConseil(a.k) : '') + qch(a) +
    sous.filter(function (j) { return a.vals[j] !== '?'; }).map(function (j) { return '<span class="hc">' + C.crit[j].ic + ' ' + esc(a.vals[j]) + '</span>'; }).join('') + '</div>'; }).join('');
  if (tot && !horiz) {
    var mx2 = Math.max.apply(null, A.filter(function (a) { return a.total; }).map(function (a) { return a.total.chf; }));
    h += '<span class="k" title="coût total pour ' + C.besoin + '">🧾<small>total</small><small>CHF</small></span>' + A.map(function (a) {
      var t = a.total; if (!t) { hach = true; return '<span class="jg' + col(a.i) + '"><span class="jv mono">?</span><span class="jb u" style="height:20px"></span></span>'; }
      var cl = t.manque ? 'm' : C.totalG === a.i ? 'w' : ''; if (t.livInconnue) hach = true;
      return '<span class="jg' + col(a.i) + '" data-booster="jauge">' + (C.totalG === a.i ? '<span class="cr">👑</span>' : '') + '<span class="jv mono ' + cl + '">' + (t.livInconnue ? '≥' : '') + t.chf + (t.manque ? ' ⚠' : '') + '</span><span class="jb ' + cl + '" style="height:' + (Math.max(8, Math.round(t.chf / mx2 * 52)) + (t.livInconnue ? 12 : 0)) + 'px">' + (t.livInconnue ? '<span class="jh"></span>' : '') + '</span></span>'; }).join('');
  }
  rangs.forEach(function (j) { var cr = C.crit[j], unit = (cr.nom.match(/\/\S+/) || [''])[0];
    if (!unit) { var con = A.map(function (a) { return a.vals[j]; }).filter(function (v) { return v !== '?'; }); if (con.length && con.every(function (v) { return / CHF$/.test(v); })) unit = ' CHF'; }
    h += '<span class="k" title="' + esc(cr.nom) + '">' + cr.ic + (unit ? '<small>' + esc(unit.trim()) + '</small>' : '') + '</span>';
    h += A.map(function (a) { var v = a.vals[j]; if (v === '?') { hach = true; return '<span class="v u' + col(a.i) + '" aria-label="inconnu"></span>'; }
      if (unit) v = v.replace(unit, '');
      if (j === C.iq) { if (a.manque) return '<span class="v m mono' + col(a.i) + '">⚠ ' + esc(String(a.total.q)) + '<small>/' + C.besoin + '</small></span>'; v = v.replace(/^(\d+)\s*min$/, '≥$1').replace(/^par\s+/, ''); }
      /* un seul vert : avec un coût total, seul 👑 est vert ; sans coût total, le gagnant de chaque critère */
      var w = !tot && cr.g === a.i;
      return '<span class="v' + (w ? ' w' : '') + ' mono' + col(a.i) + '">' + esc(v) + '</span>'; }).join(''); });
  if (hach) h += '<span class="leg"><span class="sw"></span>inconnu</span>';
  return h + '</div>';
}

function rangees(D) {
  var o = D.o, h = '';
  var row = function (gi, inner, nom) { return '<div class="v7-row" data-row="' + nom + '"><span class="v7-gi" aria-hidden="true">' + gi + '</span>' + inner + '</div>'; };
  if (D.comp) { if (D.comp.vide) h += row('🛒', '<div class="v7-wrap">' + D.comp.arts.map(function (a) { return '<button class="v7-p" data-k="' + a.k + '">' + (a.ic && a.ic !== '🛒' ? '<span class="e">' + a.ic + '</span>' : '') + '<b>' + esc(a.nom) + '</b><span class="e s">🔗</span></button>'; }).join('') + '</div>', 'offres');
    else h += '<div class="v7-row bloc" data-row="cmp">' + comparaisonHtml(D) + '</div>'; }
  if (D.pistes.length) { var nT = D.pistes.filter(function (p) { return p.ok === 'trouve'; }).length;
    var tr = nT ? '<span class="v7-tr" data-booster="trouve" aria-label="' + nT + ' trouvé sur ' + D.pistes.length + '">' + anneau({ ok: nT, q: D.pistes.filter(function (p) { return p.ok === 'verif'; }).length, non: D.pistes.filter(function (p) { return p.ok === 'non'; }).length }) + '<b class="mono">' + nT + '/' + D.pistes.length + '</b></span>' : '';
    h += row('🔎', '<div class="v7-wrap">' + tr + D.pistes.map(function (q) { var cl = q.ok === 'trouve' ? 'ok' : q.ok === 'non' ? 'non' : 'att', s = q.ok === 'trouve' ? '✓' : q.ok === 'non' ? '✗' : '?';
      return '<button class="v7-p ' + cl + (q.ia ? ' ia' : '') + '" data-k="' + q.k + '"><span class="e">' + q.ic + '</span><b>' + esc(q.mot) + '</b><span class="s">' + s + '</span>' + (q.ia ? tagIA : '') + '</button>'; }).join('') +
      '<button class="v7-plus" data-act="plus-piste" aria-label="Ajouter une piste">+</button></div>', 'pistes'); }
  if (D.faits.length) h += row('✅', '<div class="v7-wrap">' + D.faits.map(function (f) { return '<button class="v7-p fait" data-k="' + f.k + '"><span class="e">' + f.ic + '</span><b>' + esc(f.mot) + '</b><span class="s">✓</span></button>'; }).join('') + '</div>', 'faits');
  if (D.options.length) { var deux = D.options.length % 2 === 0 && D.options.every(function (x) { return x.inconnu && !x.hach && !x.ia && !x.conseil; }), hv = D.options.some(function (x) { return x.hach; });
    var R = retenus(o);
    h += row(D.genre === 'idee' ? '🧪' : '🛠️', '<div class="v7-opts' + (deux ? ' deux' : '') + '">' + D.options.map(function (x) {
      var ret = x.mien ? false : R.indexOf(x.io) >= 0;
      var at = (x.inconnu ? (x.hach ? '<span class="h" aria-label="prix inconnu"></span>' : '') : '<span class="c mono">' + esc(x.cout) + '</span>') + (x.conseil ? tagConseil(x.k) : '') + (x.ia ? tagIA : '') + (ret ? '<span class="v7-ret">☆ retenu</span>' : '');
      return '<div class="v7-o' + (x.ia ? ' ia' : '') + (ret ? ' ret' : '') + '" role="button" tabindex="0" data-k="' + x.k + '"><span class="e">' + x.ic + '</span><span class="tw"><span class="t">' + esc(x.mot) + '</span>' + (at ? '<span class="at">' + at + '</span>' : '') + '</span>' +
        (x.ia ? '<button class="v7-x" data-act="refus" data-k="' + x.k + '" aria-label="Refuser la proposition de l’IA">✕</button>' : '') + '</div>'; }).join('') + (hv ? '<span class="v7-legw"><span class="leg"><span class="sw"></span>prix inconnu</span></span>' : '') + '</div>', 'options'); }
  if (D.taches.length) h += row('☐', '<div class="v7-ls">' + D.taches.map(function (x) { return '<div class="v7-l' + (x.fait ? ' fait' : '') + (x.ia ? ' ia' : '') + '"><button class="q" data-act="cochem" data-m="' + x.mi + '" aria-label="' + (x.fait ? 'Décocher ' : 'Cocher ') + esc(x.mot) + '">' + (x.fait ? '✓' : '') + '</button><button class="tx" data-k="' + x.k + '">' + esc(x.mot) + '</button>' + (x.ia ? tagIA : '') + '</div>'; }).join('') + '</div>', 'afaire');
  if (D.liste.length) { var nf = D.liste.filter(function (l) { return l.fait; }).length;
    h += row('📋', '<div class="v7-ls">' + D.liste.map(function (l) { return '<div class="v7-l' + (l.fait ? ' fait' : '') + '"><button class="q" data-act="coche" data-i="' + l.i + '" aria-label="' + (l.fait ? 'Décocher ' : 'Cocher ') + esc(l.mot) + '">' + (l.fait ? '✓' : '') + '</button><button class="tx" data-k="' + l.k + '">' + esc(l.mot) + '</button></div>'; }).join('') +
      (nf ? '<span class="v7-n mono">' + nf + '/' + D.liste.length + '</span>' : '') + '</div>', 'liste'); }
  if (D.chiffres.length > 2 && !D.paire) h += row('＋', '<div class="v7-wrap">' + D.chiffres.slice(2).map(function (x) { return '<button class="v7-p" data-k="' + x.k + '"><span class="e">' + x.ic + '</span><span class="mono">' + esc(x.mot) + '</span></button>'; }).join('') + '</div>', 'chiffres');
  if (D.echRow) h += row('⏳', '<div class="v7-wrap"><button class="v7-p" data-k="ech"><b>' + esc(D.ech.quoi || D.ech.mot) + '</b>&nbsp;<span class="mono j-' + D.ech.date.niv + '">' + esc(D.ech.date.compte) + '</span></button></div>', 'ech');
  if (D.periode) { var a = lireDate(D.periode.du, D.c.maj), b = lireDate(D.periode.au, D.c.maj);
    if (a && b && b.d > a.d) { var t0 = Math.min(Date.now(), +a.d), t1 = Math.max(+b.d, Date.now()), sp = t1 - t0 || 1, ja = joursDe(a.d);
      h += row('📅', '<button class="v7-per" data-act="periode" data-booster="periode"><span class="bar"><b style="left:' + ((+a.d - t0) / sp * 100) + '%;right:' + ((t1 - +b.d) / sp * 100) + '%"></b><u style="left:' + ((Date.now() - t0) / sp * 100) + '%"></u></span><span class="bt"><span class="mono">' + esc(D.periode.du) + '</span><span class="mono">' + esc(D.periode.au) + '</span></span></button>', 'periode'); } }
  if (D.retenir.length) h += row('📌', '<div class="v7-wrap">' + D.retenir.map(function (x) { return '<button class="v7-p ret" data-k="' + x.k + '"><span class="e">' + x.ic + '</span><b>' + esc(x.mot) + '</b></button>'; }).join('') + '</div>', 'retenir');
  return h;
}

/* --- IA absente, ou pas encore lue : ses lignes en entier, et ce que l'app y lit seule --- */
var PASV = 'pour entre notre votre autre contre leur premier dernier hier fournisseur centre chiffre litre filtre soir noir miroir couloir entonnoir plaisir avenir cuir papier fer cahier levier panier acier palier quartier chantier atelier cellier grenier tablier foyer loyer sucre cidre ordre cadre titre vitre lettre metre verre terre pierre membre nombre ombre poudre'.split(' ');
var VRE = /^(prendre|mettre|faire|dire|lire|ecrire|boire|vendre|attendre|relire|peindre|construire|produire|conduire|cuire|reduire|suivre|vivre|battre|croire|plaire|rire|rendre|descendre|defaire|refaire|remettre|permettre|reprendre|apprendre|comprendre|repondre|fondre|moudre|resoudre|joindre|rejoindre|eteindre|traduire|detruire|inscrire|decrire|conclure|connaitre|paraitre|remplir)$/;
var RDATE = [/(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+\d{1,2}(?:er)?\s+(janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)[a-zéû]*\.?/i,
  /\d{1,2}\.\d{1,2}\.\d{4}/, /\d{1,2}(?:er)?\s+(janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)[a-zéû]*\.?(?:\s+\d{4})?/i,
  /demain(?:\s+\d{1,2}h\d{0,2})?/i, /aujourd[’']hui/i, /(?:avant le|le)\s+\d{1,2}\s+du mois/i, /dans (?:une|un|deux|trois|\d+) (?:semaines?|jours?)/i,
  /(?:avant|fin|début|mi-)\s?(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i, /fin du mois/i, /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/i];
function lectureApp(l) {
  var t = l.trim(), n = sansAccent(t), lab = (t.match(/^([^:]{2,30}?)\s*:\s*\S/) || [])[1], g = 'note';
  var prix = [], liv = [], qte = [], url = [], s = t;
  (t.match(/https?:\/\/[^\s]+|\b[a-z0-9-]+\.(?:fr|ch|com|de|be|com\.au|net|org)(?:\/\S*)?/gi) || []).forEach(function (u) { url.push(u.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]); s = s.replace(u, ' '); });
  s = s.replace(/(\d+(?:[ ’']\d{3})*(?:[.,]\d+)?)\s?(CHF|€|EUR|Fr\.)/g, function (m, a, b, i) { if (/(livraison|port|envoi|transport)\s*:?\s*$/i.test(s.slice(Math.max(0, i - 16), i))) liv.push(m); else prix.push(m); return ' '; });
  s = s.replace(/\d+(?:[.,]\d+)?\s?\/\s?(?:bt|kg|g|l|sac|pce|fût)\b/gi, function (m) { prix.push(m.replace(/\s/g, '')); return ' '; });
  (s.match(/\d+(?:[.,]\d+)?\s?(?:kg|g|L|cl|ml|hl|bar|%|°C|min|h|fûts?|sacs?|jours)(?![\p{L}])/gu) || []).forEach(function (m) { qte.push(m); });
  if (lab) { var nl = sansAccent(lab); if (/^(a faire|todo|faire)$/.test(nl)) g = 'a-faire'; else if (/^(ajoute|ajouter|acheter|achats?|courses|commander)$/.test(nl)) g = 'a-acheter'; else if (/^questions?$/.test(nl)) g = 'question'; }
  if (g === 'note') {
    var w0 = (t.split(/\s+/)[0] || '').toLowerCase().replace(/[^a-zà-ÿ]/g, ''), p = sansAccent(w0);
    var verbe = p.length > 3 && PASV.indexOf(p) < 0 && (/(er|ir)$/.test(w0) || (/re$/.test(w0) && VRE.test(p)));
    if (/\?/.test(t)) g = 'question';
    else if (prix.length || liv.length || url.length || /\b(acheter|achat|commander|commande|devis|prix|budget)\b/.test(n)) g = 'a-acheter';
    else if (/^(penser a|pense a|attention|eviter|ne pas)\b/.test(n)) g = 'conseil';
    else if (verbe) g = 'a-faire';
  }
  var dm = null; for (var i = 0; i < RDATE.length && !dm; i++) { var m = t.match(RDATE[i]); if (m) dm = m[0]; }
  var dt = dm ? dateV7(dm, null) : null; if (dt && dt.j < 0) dt = null;
  return { genre: g, prix: prix, liv: liv, qte: qte, url: url, date: dt, dm: dm };
}
function lignesUrl(c) { var d = document.createElement('div'); d.innerHTML = c.html || ''; return Array.prototype.map.call(d.children, function (p) { var a = p.querySelector('a[href]'); return a ? a.href : null; }); }
function sansIA(c, enCours) {
  var L = lignesDe(c).map(function (l, i) { return { n: i + 1, l: l, x: lectureApp(l) }; }).filter(function (x) { return x.l.trim(); });
  var af = L.filter(function (x) { return x.x.genre === 'a-faire'; });
  var hx = af.filter(function (x) { return x.x.date; }).sort(function (a, b) { return a.x.date.j - b.x.date.j; })[0] || af[0] || L.filter(function (x) { return x.x.date; }).sort(function (a, b) { return a.x.date.j - b.x.date.j; })[0] || null;
  var s = enCours ? '' : '<section class="v7-slim off"' + (hx ? '' : ' data-utile') + '><span class="e">✦</span><b>IA absente</b><button class="v7-btn" data-act="reessai">⟳ Réessayer</button></section>';
  var chips = function (x) { return x.x.prix.map(function (p) { return '<span class="v7-chip mono">' + esc(p) + '</span>'; }).join('') + x.x.liv.map(function (p) { return '<span class="v7-chip mono">🚚 ' + esc(p) + '</span>'; }).join('') +
    x.x.qte.map(function (p) { return '<span class="v7-chip mono">' + esc(p) + '</span>'; }).join('') + x.x.url.map(function (u) { return '<span class="v7-chip">🔗 ' + esc(u) + '</span>'; }).join('') +
    (x.x.date && x !== hx ? '<span class="v7-chip d-' + x.x.date.niv + '">📅 ' + esc(x.x.date.txt) + ' <b class="mono">' + esc(x.x.date.compte) + '</b></span>' : ''); };
  if (hx) { var d = hx.x.date, af1 = hx.x.genre === 'a-faire';
    s += '<section class="v7-hero loc' + (d ? ' h-' + d.niv : ' h-loin') + '" data-utile data-booster="heros-local"><div class="v7-kick"><span class="v7-kind">' + (af1 ? '☐ À faire' : '📅 Daté') + '</span><small>lu par l’app</small></div>' +
      '<div class="v7-body"><span class="v7-act loc">' + esc(hx.l) + '</span>' + (d ? cdHtml(d) : '') + '</div>' +
      '<div class="v7-do">' + (af1 ? '<button class="v7-fait" data-act="fait-local" aria-label="Fait">✓</button><button class="v7-tard" data-act="tard-local" aria-label="Plus tard">⏭<small>plus tard</small></button>' : '') + '<button class="v7-src" data-n="' + hx.n + '" aria-label="Sa ligne dans Mes notes">📝 <span class="mono">' + hx.n + '</span> ↩</button></div></section>'; }
  s += '<section class="v7-lc">' + L.filter(function (x) { return x !== hx; }).map(function (x) {
    var ch = chips(x), tx = x.x.url.length && /^\S+$/.test(x.l) ? '<b>' + esc(x.x.url[0]) + '</b><small>' + esc(x.l.replace(/^https?:\/\//, '').replace(/^www\./, '').slice(x.x.url[0].length)) + '</small>' : esc(x.l);
    return '<button class="v7-li" data-n="' + x.n + '"><span class="v7-ln mono">' + x.n + '</span><span class="g">' + GIC[x.x.genre] + '</span><span class="o">' + tx + (ch ? '<span class="cs">' + ch + '</span>' : '') + '</span></button>'; }).join('') + '</section>';
  return s;
}

function rendreOrg() {
  var c = courant(); if (!c) return;
  c.miens = c.miens || [];
  org.className = 'm4b-org v7o';
  var enCours = estEnLecture(c), h = '';
  h += '<div class="v7-tl"><span class="t">' + esc(titreDe(c)) + '</span><button class="v7-ib" data-act="meta" aria-label="Détails, rangement, changements" aria-expanded="' + metaOuvert + '">ⓘ</button></div>';
  if (metaOuvert) { var k = catDe(c), r0 = c.org && c.org.rep;
    h += '<div class="v7-meta"><span>' + esc(r0 && r0.genre ? NOM_GENRE[r0.genre] : 'gardé ici') + ' · ' + esc(catEmoji(k.nom) + ' ' + k.nom + (k.sous ? ' › ' + k.sous : '')) + ' · ' + esc(prioDe(c)) + ' · ' + esc(NOM_ETAT[c.etat] || 'Noté') + (c.org ? ' · lu ' + esc(aLHeure(c.org.quand)) : '') + '</span>' +
      '<button data-act="ranger-feuille">Ranger</button>' + (c.org ? '<button data-act="changements">↶ Changements</button>' : '') + '<button data-act="question">? Question</button></div>'; }
  if (enCours) h += '<div class="m4b-lit m4b-lit-org v7-lit" role="status"><span>✦ ' + (lecture && lecture.carnetId === c.id ? 'L’IA lit ta note…' : 'L’IA lira ta note juste après') + '</span><span class="bar"><i></i></span></div>';
  if (!c.org) { org.innerHTML = h + (c.orgErreur || enCours ? sansIA(c, enCours && !c.orgErreur) : '<div class="v7-slim"><b>Pas encore rangé</b><button class="v7-btn" data-act="reessai">✦ Ranger</button></div>' + sansIA(c, true)); rendrePile(null); majAideBtn(null); return; }
  if (c.orgErreur && !enCours) h += '<section class="v7-slim off"><span class="e">✦</span><b>IA absente · rangement d’avant</b><button class="v7-btn" data-act="reessai">⟳</button></section>';
  if (new Date(c.maj) > new Date(c.org.quand) && !enCours && c.html !== '' && lignesDoc().join('\n') !== c.org.lignes.join('\n')) h += '<div class="v7-slim"><b>Ta note a changé</b><button class="v7-btn" data-act="reessai">✦ Relire</button></div>';
  var D = modele(c); org.__D = D;
  h += heros(D) + figures(D) + '<section class="v7-rows">';
  if (D.regle && !D.regle.propose && !detailOuvert[c.id]) {
    var nd = D.options.length + D.faits.length + D.pistes.length + D.liste.length + D.chiffres.length + D.retenir.length + (D.comp ? 1 : 0);
    if (D.retenir.length) h += '<div class="v7-row" data-row="retenir"><span class="v7-gi" aria-hidden="true">📌</span><div class="v7-wrap">' + D.retenir.map(function (x) { return '<button class="v7-p ret" data-k="' + x.k + '"><span class="e">' + x.ic + '</span><b>' + esc(x.mot) + '</b></button>'; }).join('') + '</div></div>', nd -= D.retenir.length;
    h += (nd ? '<button class="v7-pli" data-act="detail">▸ Détail <span class="mono">' + nd + '</span></button>' : '') + '</section>';
  } else h += rangees(D) + '</section>';
  org.innerHTML = h;
  /* la colonne choisie ressort : un cadre autour d'elle */
  var sel = org.querySelectorAll('.v7-cmp .sel');
  if (sel.length) { var cm = org.querySelector('.v7-cmp'), a = sel[0].getBoundingClientRect(), z = sel[sel.length - 1].getBoundingClientRect(), b = cm.getBoundingClientRect();
    var f = document.createElement('span'); f.className = 'v7-cadre'; f.style.cssText = 'left:' + (a.left - b.left - 3) + 'px;top:' + (a.top - b.top - 3) + 'px;width:' + (a.width + 6) + 'px;height:' + (z.bottom - a.top + 6) + 'px'; cm.appendChild(f); }
  rendrePile(D); majAideBtn(D);
}

/* --- la ligne s'ouvre sous l'élément touché --- */
function marque(t, cit) { var i = cit ? t.indexOf(cit) : -1; return i < 0 ? esc(t) : esc(t.slice(0, i)) + '<mark>' + esc(cit) + '</mark>' + esc(t.slice(i + cit.length)); }
function bulleV7(el, it, n) {
  org.querySelectorAll('.v7-bub').forEach(function (x) { x.remove(); });
  var c = courant(), L = lignesDe(c), b = document.createElement('div'); b.className = 'v7-bub';
  var ligne = n || (it && it.ligne) || 0, txt = ligne ? L[ligne - 1] : it && it.ligneTxt, url = ligne ? lignesUrl(c)[ligne - 1] : null, acts = '';
  if (it && it.art) acts += '<button class="v7-btn plein" data-act="prendre" data-i="' + it.i + '">' + (c.org.choisi === it.i ? '✓ Pris' : '✓ Prendre') + '</button>';
  else if (it && it.io != null && !it.mien) { var ret = retenus(c.org).indexOf(it.io) >= 0; acts += '<button class="v7-btn' + (ret ? '' : ' plein') + '" data-act="retenir" data-io="' + it.io + '">' + (ret ? '✓ Retenu' : '☆ Retenir') + '</button>'; }
  if (it && it.ia) acts += '<button class="v7-btn ia" data-act="refus" data-k="' + it.k + '">✕ Retirer</button><button class="v7-btn plein" data-act="garde" data-k="' + it.k + '">＋ Garder</button>';
  if (txt) b.innerHTML = '<div class="q"><span class="v7-ln mono">' + (ligne || '＋') + '</span><p>' + marque(txt, it && it.cit) + '</p></div><div class="r">' + (url ? '<a class="v7-btn" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">🔗 Ouvrir</a>' : '') +
    '<button class="v7-btn" data-act="aller" data-k="' + (it ? it.k : '') + '" data-n="' + ligne + '">📝 Mes notes ↩</button>' + acts + '</div>';
  else b.innerHTML = '<div class="q"><span class="v7-ln" style="color:var(--ia)">✦</span><p><b style="color:var(--ia)">Proposé par l’IA</b>, pas dans tes notes : ' + esc(it ? it.mot : '') + '</p></div><div class="r">' + acts + '</div>';
  if (el.closest('.v7-cmp,.v7-hb')) el.closest('.v7-cmp,.v7-hb').after(b);
  else if (el.parentElement && el.parentElement.matches('.v7-wrap,.v7-opts,.v7-ls')) { el.after(b); b.classList.add('in'); }
  else if (el.closest('.v7-l')) { el.closest('.v7-l').after(b); b.classList.add('in'); }
  else (el.closest('.v7-hero,.v7-fig,.v7-li') || el).after(b);
  var r = el.getBoundingClientRect(), br = b.getBoundingClientRect();
  b.style.setProperty('--px', Math.round(Math.max(14, Math.min(br.width - 30, r.left + r.width / 2 - br.left - 8))) + 'px');
  geste('toucher', (it ? it.mot : 'ligne') + ' → bulle ligne ' + ligne);
}

/* --- Aide : une proposition à la fois, au-dessus de la barre ; le héros reste visible --- */
function majAideBtn(D) {
  var b = document.querySelector('.v7-aidebtn'); if (!b) return; var c = courant();
  var n = D ? D.aide.length : 0, off = !c || !c.org;
  b.disabled = off; b.innerHTML = '💡 Aide' + (n ? ' <span class="mono">' + n + '</span>' : '') + (c && c.aide && c.aide.enCours ? ' <span class="v7-pt"></span>' : '');
}
function ouvrirAide() {
  var c = courant(); if (!c || !c.org) return;
  if (aideOuverte) { aideOuverte = false; rendrePile(org.__D); return; }
  aideOuverte = true; aideI = 0;
  if (!c.aide || (!c.aide.enCours && !c.aide.items.length && !c.aide.erreur)) aide(); else rendreOrg();
}
function rendrePile(D) {
  document.querySelectorAll('.v7-pile').forEach(function (x) { x.remove(); });
  if (!aideOuverte || !D || vue !== 'org') return;
  var c = courant(), it = D.aide.length ? D.aide[aideI % D.aide.length] : null, p = document.createElement('div'); p.className = 'v7-pile';
  var pied = $('pied-org'); p.style.bottom = (pied.offsetHeight + 8) + 'px';
  if (!it) { p.innerHTML = '<div class="v7-card" style="--c:var(--ia)"><div class="t"><span>✦ IA</span><span class="mono" style="margin-left:auto;color:var(--mut)"></span></div><div class="m"><span class="e">💡</span><span>' + (c.aide && c.aide.enCours ? 'Elle cherche ce qui te manque…' : c.aide && c.aide.erreur ? 'Pas d’aide · ' + esc(c.aide.erreur) : 'Rien de plus à proposer') + '</span></div><div class="r"><button class="v7-ab" data-act="aide-ferme">✕<small>fermer</small></button></div></div>'; $('v-carnet').appendChild(p); return; }
  var col = { check: 'var(--ok)', tache: 'var(--att)', sugg: 'var(--ia)' }[it.t], typ = { check: '✓ à vérifier', tache: '☐ tâche', sugg: '💡 idée' }[it.t];
  p.innerHTML = '<div class="v7-card" style="--c:' + col + '"><div class="t"><span>✦ IA</span><span style="color:' + col + '">' + typ + '</span><span class="mono" style="margin-left:auto;color:var(--mut)">' + ((aideI % D.aide.length) + 1) + '/' + D.aide.length + (c.aide && c.aide.enCours ? ' …' : '') + '</span></div>' +
    '<div class="m"><span class="e">' + it.ic + '</span><span>' + esc(it.mot) + '</span></div><div class="r"><button class="v7-ab" data-act="aide-non" aria-label="Écarter">✕<small>non</small></button><button class="v7-ab" data-act="aide-suite" aria-label="Plus tard">⏭<small>plus tard</small></button><button class="v7-ag" data-act="aide-garde">＋ Garder</button></div></div>';
  p.__it = it; $('v-carnet').appendChild(p);
}
function agirPile(act, it) {
  var c = courant(), o = c.org;
  if (act === 'aide-ferme') { aideOuverte = false; rendrePile(null); return; }
  if (act === 'aide-suite') { aideI++; rendrePile(org.__D); return; }
  if (it.src === 'conseil') {
    if (act === 'aide-non') { o.conseilOff = true; var lab = 'conseil : ' + it.mot; if (c.refus.indexOf(lab) < 0) c.refus.push(lab); sauver(); geste('écarter le conseil', it.mot); rendreOrg(); toast('✕ Idée écartée', 'Annuler', function () { o.conseilOff = false; c.refus = c.refus.filter(function (x) { return x !== lab; }); sauver(); rendreOrg(); }); }
    else { o.conseilOff = true; c.miens.push({ type: 'tache', texte: it.mot, emoji: it.ic, ia: true, fait: false, le: new Date().toISOString() }); sauver(); geste('garder le conseil', it.mot); rendreOrg(); toast('Gardé dans À faire'); }
  } else if (act === 'aide-non') { ecarterAide(c, it.i); toast('✕ Écartée'); } else garderAide(c, it.i);
  if (!org.__D || !org.__D.aide.length) { aideOuverte = !!(c.aide && c.aide.enCours); rendrePile(org.__D); }
}

/* --- les gestes --- */
function refuserV7(k) {
  var c = courant(), o = c.org, D = org.__D, it = D && D.it[k]; if (!it) return;
  if (it.mien) { var m = c.miens[it.mi]; c.miens.splice(it.mi, 1); sauver(); geste('retirer', m.texte); rendreOrg(); toast('✕ Retiré', 'Annuler', function () { c.miens.splice(it.mi, 0, m); sauver(); rendreOrg(); }); return; }
  var lab = (k === 'tache' ? 'tâche : ' : 'option : ') + it.mot;
  o.retires.push(k); if (c.refus.indexOf(lab) < 0) c.refus.push(lab); sauver(); geste('refuser', lab); rendreOrg();
  toast('✕ Proposition retirée', 'Annuler', function () { o.retires = o.retires.filter(function (x) { return x !== k; }); c.refus = c.refus.filter(function (x) { return x !== lab; }); sauver(); rendreOrg(); });
}
function prendre(i) {
  var c = courant(), o = c.org, a = org.__D.comp.arts[i], av = { choisi: o.choisi, commande: o.commande, etat: c.etat, etatPar: c.etatPar, R: retenus(o).slice() };
  o.choisi = i; o.commande = false; o.tard = false;
  if (a.io >= 0 && retenus(o).indexOf(a.io) < 0) { o.retenus = [a.io]; }
  if (RANG[c.etat] < RANG.decide) { o.etatAvant = c.etat; c.etat = 'decide'; c.etatPar = { par: 'toi', le: new Date().toISOString() }; }
  sauver(); geste('prendre', a.nom); rendreOrg();
  toast('✓ Choisi : ' + a.nom, 'Annuler', function () { o.choisi = av.choisi; o.commande = av.commande; o.retenus = av.R; c.etat = av.etat; c.etatPar = av.etatPar; sauver(); rendreOrg(); });
}
function annulable(msg, faire, defaire) { faire(); sauver(); rendreOrg(); toast(msg, 'Annuler', function () { defaire(); sauver(); rendreOrg(); }); }
org.addEventListener('click', function (e) {
  var c = courant(); if (!c) return; var o = c.org;
  var b = e.target.closest('[data-act]');
  if (b) { var act = b.dataset.act; e.stopPropagation();
    if (act === 'meta') { metaOuvert = !metaOuvert; rendreOrg(); return; }
    if (act === 'ranger-feuille') { feuilleRanger(c); return; }
    if (act === 'changements') { feuilleChangements(); return; }
    if (act === 'question') { feuilleDemander(); return; }
    if (act === 'reessai') { ranger(); return; }
    if (act === 'fait-local' || act === 'tard-local') { toast(act === 'fait-local' ? '✓ Noté fait · l’IA le rangera' : '⏭ Plus tard'); geste(act, ''); return; }
    if (act === 'aller') { var it0 = b.dataset.k && org.__D ? org.__D.it[b.dataset.k] : null, n0 = +b.dataset.n; if (n0) allerLigne(n0, it0 ? it0.cit : '', it0 ? it0.mot : 'ligne ' + n0); else if (it0) allerLigne(0, it0.ligneTxt, it0.mot); return; }
    if (!o) return;
    if (act === 'detail') { detailOuvert[c.id] = true; rendreOrg(); return; }
    if (act === 'fait') { annulable('✓ Fait : ' + org.__D.tache.mot, function () { o.tacheFaite = true; geste('cocher la tâche', org.__D.tache.mot); }, function () { o.tacheFaite = false; }); return; }
    if (act === 'defait') { o.tacheFaite = false; sauver(); geste('décocher la tâche', ''); rendreOrg(); return; }
    if (act === 'tard') { annulable('⏭ Plus tard', function () { o.tard = true; geste('plus tard', ''); }, function () { o.tard = false; }); return; }
    if (act === 'retour-tard') { o.tard = false; sauver(); rendreOrg(); return; }
    if (act === 'rouvrir') { o.garde.resolu = false; poserEtat(c, o.etatAvant && o.etatAvant !== 'resolu' ? o.etatAvant : 'cherche'); return; }
    if (act === 'regle-oui') { garder('resolu'); return; }
    if (act === 'regle-non') { refuser('resolu'); return; }
    if (act === 'prendre') { prendre(+b.dataset.i); return; }
    if (act === 'commander') { annulable('📦 Commandé chez ' + org.__D.comp.arts[o.choisi].nom, function () { o.commande = true; geste('commandé', ''); }, function () { o.commande = false; }); return; }
    if (act === 'decommander') { o.commande = false; sauver(); rendreOrg(); return; }
    if (act === 'rouvrir-choix') { annulable('↺ Choix rouvert', function () { o.__av = o.choisi; o.choisi = null; o.commande = false; o.retenus = []; geste('rouvrir le choix', ''); }, function () { o.choisi = o.__av; }); return; }
    if (act === 'retenir') { retenir(+b.dataset.io); return; }
    if (act === 'refus') { refuserV7(b.dataset.k); return; }
    if (act === 'garde') { var it1 = org.__D.it[b.dataset.k]; if (it1 && it1.mien) { c.miens[it1.mi].ia = false; } else o.gardes.push(b.dataset.k); sauver(); geste('garder', b.dataset.k); rendreOrg(); return; }
    if (act === 'sansconseil') { annulable('✕ Marque ✦ retirée', function () { o.sansConseil = true; geste('retirer conseillé', ''); }, function () { o.sansConseil = false; }); return; }
    if (act === 'coche') { var i = +b.dataset.i; o.coches[i] = !o.coches[i]; sauver(); geste(o.coches[i] ? 'cocher' : 'décocher', o.rep.liste[i].texte); rendreOrg(); return; }
    if (act === 'cochem') { var m = c.miens[+b.dataset.m]; m.fait = !m.fait; sauver(); geste(m.fait ? 'cocher' : 'décocher', m.texte); rendreOrg(); return; }
    if (act === 'plus-piste') { viser('piste', 'Piste'); return; }
    if (act === 'periode') { allerLigne(o.rep.periode.ligne, o.rep.periode.du, 'Période'); return; }
    return; }
  var ln = e.target.closest('[data-n]'); if (ln) { bulleV7(ln, null, +ln.dataset.n); return; }
  var t = e.target.closest('[data-k]'); if (!t || !org.__D) return;
  var it = org.__D.it[t.dataset.k]; if (it) bulleV7(t, it);
});
document.addEventListener('click', function (e) {
  var b = e.target.closest('.v7-pile [data-act]'); if (!b) return; var p = b.closest('.v7-pile'); agirPile(b.dataset.act, p.__it);
});
