/* ====================================================================== Correction J1 (nuit du 25.11), CORRECTION-J1.md
   B1 un toast appartient à son carnet et à sa vue ; B2 le pouce suit la décision ; B3 ce qu'il vient d'écrire est repris (lecture locale) ;
   B4 hors ligne, l'Organisé lu reste ; B5 couronne honnête, variété commune, prix ambigu « ? » ; B6 ligne cassée jamais en tête ;
   B7 vides : visuels agrandis quand la place le permet ; B8 période : « auj. » à sa vraie place. */

/* B1 : le toast meurt quand on quitte son carnet ou sa vue ; son Annuler n'agit que sur le carnet où il est né */
function toast(t, action, f) {
  tuerToast();
  var ne = etat.courant || null;
  var el = h('div', { class: 'm4b-toast', role: 'status' }, h('span', null, t),
    action ? h('button', { type: 'button', class: 'm4b-toast-a', onclick: function () { el.remove(); if ((etat.courant || null) === ne) f(); } }, action) : null);
  $('app').appendChild(el);
  minuteurToast = setTimeout(function () { el.remove(); }, action ? 5000 : 2600);
}
function tuerToast() { clearTimeout(minuteurToast); document.querySelectorAll('.m4b-toast').forEach(function (x) { x.remove(); }); }
/* légende d'une icône muette : au toucher, son nom (aucun mot ajouté au repos) */
document.addEventListener('click', function (e) {
  var x = e.target && e.target.closest ? e.target.closest('[data-leg]') : null;
  if (x && !(x.tagName !== 'BUTTON' && x.closest('button'))) toast(x.getAttribute('data-leg'));
});

function quandCourt(q) { var d = new Date(q); return dateCourte(d) + ' ' + hm(d); }
function j1Acc(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
var J1STOP = ['prix', 'pour', 'avec', 'dans', 'assez', 'quel', 'quelle', 'notre', 'votre', 'chez'];
function j1Sig(t) { return j1Acc(t).split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 4 && J1STOP.indexOf(w) < 0; }); }
/* affichage : virgule décimale, « 10 % - 15 % » en « 10–15 % » ; une date 01.05.2027 reste telle quelle */
function j1Virg(s) {
  s = String(s == null ? '' : s);
  if (/\d\.\d+\.\d/.test(s)) return s;
  return s.replace(/(\d+(?:[.,]\d+)?)\s*%\s*-\s*(\d+(?:[.,]\d+)?)\s*%/, '$1–$2 %').replace(/(\d)\.(\d)/g, '$1,$2');
}
/* B6 : une ligne où deux phrases se collent (« fût.EST — ranger la cave ») n'est pas une attention : elle reste dans Mes notes */
function ligneCassee(s) { return /[a-zà-ÿ]\.[A-ZÀ-Ý]{2,}/.test(String(s || '')); }

/* B3 : lecture locale des lignes écrites depuis la dernière lecture de l'IA (en ligne comme hors ligne)
   « prix du joint : 6 CHF » remplit le manque et sa case ; « Starter lancé » propose la tâche faite. L'IA confirme à sa relecture. */
var LOC = { manques: {}, tache: null };
var J1MONTANT = /\d{1,3}(?:['’  ]\d{3})+(?:[.,]\d{1,2})?\s?(?:CHF|Fr\.|€|EUR)|\d+(?:[.,]\d{1,2})?\s?(?:CHF|Fr\.|€|EUR)/;
function regle(l, titre) {
  var mots = j1Sig(String(titre).split(/\s+/).slice(1).join(' ')), lw = j1Sig(l);
  if (!mots.some(function (w) { return lw.indexOf(w) >= 0; })) return false;
  return /[a-zà-ÿ]+(?:é|ée|és|ées)(?=$|[\s.,;:!?])/i.test(l) || /(?:^|\s)(?:fait|fini|ok)(?=$|[\s.,;:!?])/i.test(l) || /✓/.test(l);
}
function lectureLocale(c) {
  var o = c.org, out = { manques: {}, tache: null }; if (!o) return out;
  var avant = o.lignes.map(function (l) { return l.trim(); });
  var neuves = lignesDoc().map(function (l) { return l.trim(); }).filter(function (l) { return l && avant.indexOf(l) < 0; });
  var r = o.rep, tv = tacheVive(c);
  neuves.forEach(function (l) {
    (r.manque || []).forEach(function (m) {
      var lab = m.texte.replace(/\s*\?\s*$/, '');
      if (j1Acc(l).indexOf(j1Acc(lab)) !== 0) return;
      var reste = l.slice(lab.length).replace(/^\s*:\s*/, ''), mt = reste.match(J1MONTANT);
      out.manques[m.texte] = mt ? mt[0] : reste.split(/\s+/).slice(0, 3).join(' ');
    });
    if (tv && !o.tacheFaite && regle(l, tv.titre)) out.tache = l;
  });
  return out;
}
function valeurNotee(op) {
  if (op.cout && !/^\s*\?\s*$/.test(op.cout)) return null;
  var mots = j1Sig((op.titre || '') + ' ' + (op.qui || ''));
  for (var k in LOC.manques) if (j1Sig(k).some(function (w) { return mots.indexOf(w) >= 0; })) return LOC.manques[k];
  return null;
}
function manques(c, r) {
  (r.manque || []).forEach(function (m) {
    var v = LOC.manques[m.texte], lab = m.texte.replace(/\s*\?\s*$/, '');
    if (v) { org.appendChild(h('div', { class: 'p4-manque fait', role: 'status' }, h('span', { class: 'em' }, '✓'), h('b', null, lab + ' : ' + v), h('small', null, 'noté · l’IA relit'))); return; }
    org.appendChild(h('div', { class: 'p4-manque' }, h('span', { class: 'em' }, m.emoji || '✏️'), h('b', null, m.texte),
      h('button', { type: 'button', class: 'p4-noter', 'data-booster': 'noter-manque', onclick: function () { viser('note', lab); } }, 'Noter')));
  });
}

/* B2 : la prochaine action suit la décision. Une tâche liée à une option écartée, ou la tâche « choisir » elle-même, cède la place
   à l'option retenue ; une fois faite : sa tâche à lui, puis le manque, puis « ✓ Réglé » ; résolu : « Rouvrir ». Jamais vide après un geste. */
function choixDe(c) {
  var o = c.org, r = o && o.rep; if (!r) return null;
  var R = retenus(o);
  if (R.length && r.options[R[0]] && o.garde.options !== false) { var op = r.options[R[0]]; return { sorte: 'option', i: R[0], nom: op.titre, titre: op.titre, emoji: op.emoji || '☐' }; }
  var A = o.artRet || [];
  if (A.length && r.comparaison && r.comparaison.articles[A[0]]) { var a = r.comparaison.articles[A[0]]; return { sorte: 'article', i: A[0], nom: a.nom, titre: 'Commander · ' + a.nom, emoji: '🛒' }; }
  return null;
}
function lieA(r, t) {
  if (Number.isInteger(t.option)) return t.option;
  var L = r.comparaison ? r.comparaison.articles : r.options; if (!t.ligne) return null;
  for (var i = 0; i < L.length; i++) if (L[i].ligne === t.ligne) return i;
  return null;
}
function tacheChoix(r, o, t) { return tacheDuo(r, o) || !!(r.comparaison && /^(choisir|trancher|comparer|d[ée]cider)/i.test(t.titre)); }
function tacheVive(c) {
  var o = c.org, r = o && o.rep; if (!r || !r.tache || o.garde.tache === false) return null;
  var ch = choixDe(c), t = r.tache;
  if (ch) { var li = lieA(r, t); if (tacheChoix(r, o, t) || (li != null && li !== ch.i)) return null; }
  return t;
}
function pouce(c, r, libre) {
  var o = c.org, tv = tacheVive(c), ch = choixDe(c);
  if (ch && r.tache && o.garde.tache !== false && tacheChoix(r, o, r.tache)) ch.quand = r.tache.quand;
  if (!libre) return tv;
  if (r.relecture && c.etat === 'resolu') { bonChoix(c); return tv; }
  if (c.etat === 'resolu') { actionSimple('↺', 'Rouvrir', function () { poserEtat(c, ch ? 'decide' : 'cherche'); }, 'doux'); return tv; }
  if (tv && !o.tacheFaite) { actionTache(c, tv); return null; }
  if (ch && !o.choixFait) { actionChoix(c, ch); return tv; }
  if (!ch && !o.tacheFaite) return tv;
  var mt = (c.miens || []).filter(function (m) { return m.type === 'tache' && !m.fait; })[0];
  var mq = (r.manque || []).filter(function (m) { return !LOC.manques[m.texte]; })[0];
  if (mt) actionSimple(mt.emoji || '☐', mt.texte, function () {
    mt.fait = true; sauver(); geste('cocher', mt.texte); rendreOrg(); rendreListe();
    toast('Fait : ' + mt.texte, 'Annuler', function () { mt.fait = false; sauver(); rendreOrg(); rendreListe(); });
  }, '', true);
  else if (mq) actionSimple(mq.emoji || '✏️', mq.texte, function () { viser('note', mq.texte.replace(/\s*\?\s*$/, '')); }, '', false, 'Noter');
  else actionSimple('✓', 'Réglé', function () { poserEtat(c, 'resolu'); });
  return tv;
}
function actionSimple(em, titre, f, cls, avecCase, mot) {
  enAction(h('button', { type: 'button', class: 'p4-go' + (cls ? ' ' + cls : ''), 'data-booster': 'action', onclick: f },
    h('span', { class: 'em' }, em), h('b', null, titre), mot ? h('span', { class: 'p4-mot' }, mot) : null, avecCase ? h('i', { class: 'case' }) : null));
}
function actionChoix(c, ch) {
  var o = c.org, dq = ch.quand && lireDate(ch.quand, c.maj);
  enAction(h('button', { type: 'button', class: 'p4-go', 'data-booster': 'action', 'aria-label': ch.titre + ' : toucher quand c’est fait', onclick: function () {
    var av = { f: o.choixFait, etat: c.etat, par: c.etatPar };
    o.choixFait = true;
    if (ch.sorte === 'article') { c.etat = 'resolu'; c.etatPar = { par: 'toi', le: new Date().toISOString() }; }
    sauver(); geste(ch.sorte === 'article' ? 'commander' : 'fait', ch.nom); rendreOrg(); rendreListe();
    toast((ch.sorte === 'article' ? 'Commandé : ' : 'Fait : ') + ch.nom, 'Annuler', function () { o.choixFait = av.f; c.etat = av.etat; c.etatPar = av.par; sauver(); rendreOrg(); rendreListe(); });
  } }, h('span', { class: 'em' }, ch.emoji), h('b', null, ch.titre),
    ch.quand ? h('small', null, (dq && dq.approx ? '≈ ' : '') + (dq ? dateCourte(dq.d) : ch.quand)) : null, h('i', { class: 'case' })));
}

/* B7 : quand la vue laisse un grand vide, les visuels grandissent (aucun mot ajouté) ; s'ils débordent, on revient à la taille courante */
var AMPLE = false;
function rendreOrg() {
  var d = $('defil'), poser = function (k) { AMPLE = k; org.classList.toggle('ample', !!k); if (k) org.style.setProperty('--k', k); else org.style.removeProperty('--k'); rendreOrg0(); };
  poser(false);
  if (vue !== 'org' || !courant() || org.hidden) return;
  var libre = d.clientHeight - org.offsetHeight; if (libre <= 110) return;
  /* le plus grand facteur qui tient sans défiler */
  var ks = [2, 1.75, 1.5, 1.3, 1.15].filter(function (k) { return k <= 1 + libre / 260 || k === 1.15; });
  for (var i = 0; i < ks.length; i++) { poser(ks[i]); if (d.scrollHeight <= d.clientHeight + 2) return; }
  poser(false);
}
/* chiffres : deux mesures de même unité (1,2 bar puis 0,4 bar) font une courbe ; sinon des tuiles */
function chiffresP4(c, r) {
  var L = r.chiffres || []; if (!L.length) return;
  var u = function (x) { return String(x.valeur).replace(/^[\s≈~]*\d[\d'’  ]*(?:[.,]\d+)?\s*/, ''); };
  var serie = L.length >= 2 && u(L[0]) && L.every(function (x) { return !x.estime && nb(x.valeur) != null && u(x) === u(L[0]); });
  if (serie) {
    var vs = L.map(function (x) { return nb(x.valeur); }), mx = Math.max.apply(null, vs) || 1, H = Math.round(88 * (AMPLE || 1)), W = 300, n = vs.length;
    var X = function (i) { return W * (2 * i + 1) / (2 * n); }, Y = function (v) { return 12 + (1 - v / mx) * (H - 24); };
    var fig = h('div', { class: 'p4-courbe' + (vs[n - 1] < vs[0] ? ' baisse' : ''), 'data-booster': 'courbe' }), tr = h('div', { class: 'trace', 'aria-hidden': 'true' });
    tr.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="height:' + H + 'px"><line x1="0" x2="' + W + '" y1="' + (H - 12) + '" y2="' + (H - 12) + '"/><polyline points="' +
      vs.map(function (v, i) { return X(i) + ',' + Y(v); }).join(' ') + '"/>' + vs.map(function (v, i) { return '<circle cx="' + X(i) + '" cy="' + Y(v) + '" r="8"/>'; }).join('') + '</svg>';
    fig.appendChild(tr);
    fig.appendChild(h('div', { class: 'pts', style: 'grid-template-columns:repeat(' + n + ',1fr)' }, L.map(function (x) {
      return h('button', { type: 'button', onclick: vers(x.ligne, x.valeur, x.label || x.valeur) }, h('b', null, (x.emoji ? x.emoji + ' ' : '') + j1Virg(x.valeur)), x.label ? h('span', null, x.label) : null);
    })));
    org.appendChild(fig); return;
  }
  org.appendChild(h('div', { class: 'p4-chf' }, L.map(function (x) {
    return h('button', { type: 'button', class: x.estime ? 'est' : '', onclick: vers(x.ligne, x.valeur, x.label || x.valeur) }, h('span', { class: 'em' }, x.emoji || '#'), h('b', null, (x.estime ? '≈ ' : '') + j1Virg(x.valeur)), x.label ? h('span', null, x.label) : null);
  })));
}

/* B5 : achat. Une offre qui ne couvre pas le besoin (≤ 400 pour 600) ou dont le total est inconnu ne gagne rien ; le total marque
   « + 🚚 ? » si la livraison manque ; la couronne du total va au seul total complet plus bas que tous les autres (calcul de l'app).
   Ce qui tient à la variété (arômes, origine) se dit une fois au-dessus ; un prix ambigu reste « 3,72 € ? ». */
function comparer(c, r) {
  var o = c.org, cmp = r.comparaison; o.artRet = o.artRet || []; o.artEcart = o.artEcart || [];
  var arts = cmp.articles.map(function (a, i) { return { a: a, i: i }; }).filter(function (x) { return o.artEcart.indexOf(x.i) < 0; });
  var douteux = function (t) { return t === '?' || /à relire/.test(t) || /\?\s*$/.test(t); };
  var lu = 0, manque = 0; arts.forEach(function (x) { x.a.valeurs.forEach(function (v) { if (douteux(v.texte)) manque++; else lu++; }); });
  var seg = h('span', { class: 'seg' }); for (var k0 = 0; k0 < lu + manque; k0++) seg.appendChild(h('i', { class: k0 < lu ? 'l' : '' }));
  org.appendChild(h('div', { class: 'p4-jauge', 'data-booster': 'jauge-lu', 'data-leg': '✓ lu dans tes notes ou sur la page · ? manque', 'aria-label': 'lu ' + lu + ', manque ' + manque }, h('b', { title: 'lu' }, '✓ ' + lu), seg, h('b', { class: 'm', title: 'manque' }, '? ' + manque)));
  var kT = -1, kL = -1;
  cmp.criteres.forEach(function (cr, k) { if (/🧮|\bpour\s+\d|\btotal/i.test(cr)) kT = k; else if (/livraison|envoi|\bport\b/i.test(cr)) kL = k; });
  var besoin = kT >= 0 ? nb(cmp.criteres[kT].replace(/^\S+\s*/, '')) : null;
  var court = function (a) { return besoin != null && a.valeurs.some(function (v) { var m = /^\s*≤\s*([\d'’  ]+)/.exec(v.texte); return m && nb(m[1]) < besoin; }); };
  var totalSur = function (a) { return kT < 0 || (nb(a.valeurs[kT].texte) != null && !douteux(a.valeurs[kT].texte)); };
  var gT = null;
  if (kT >= 0) {
    var cov = arts.filter(function (x) { return !court(x.a); });
    if (cov.length > 1 && cov.every(function (x) { return totalSur(x.a); })) {
      var complet = function (x) { return kL < 0 || !douteux(x.a.valeurs[kL].texte); }, best = null;
      cov.forEach(function (x) { if (complet(x) && (!best || nb(x.a.valeurs[kT].texte) < nb(best.a.valeurs[kT].texte))) best = x; });
      if (best && cov.every(function (x) { return x === best || nb(x.a.valeurs[kT].texte) > nb(best.a.valeurs[kT].texte); })) gT = best.i;
    }
  }
  if (cmp.variete && cmp.variete.length) org.appendChild(h('div', { class: 'p4-var', 'data-leg': 'commun à toutes les offres : c’est la variété', 'aria-label': 'Commun à toutes les offres : ' + cmp.variete.map(function (v) { return v.texte; }).join(', ') },
    h('span', { class: 'em' }, '🧬'), cmp.variete.map(function (v) { return h('b', { title: v.texte }, v.emoji || v.texte); })));
  var g = h('div', { class: 'p4-cmp', style: 'grid-template-columns:32px repeat(' + arts.length + ',minmax(0,1fr))' });
  g.appendChild(h('span'));
  arts.forEach(function (x) {
    var ret = o.artRet.indexOf(x.i) >= 0;
    g.appendChild(h('div', { class: 'p4-art' + (ret ? ' ret' : '') },
      h('button', { type: 'button', class: 'nom', onclick: vers(x.a.ligne, x.a.citation, x.a.nom) }, h('span', { class: 'em' }, (ret ? '✓' : '') || r.emoji || '🛒'), h('b', null, x.a.nom),
        (r.attention || []).filter(function (a) { return a.ligne === x.a.ligne && !ligneCassee(a.citation); }).map(function (a) { return h('span', { class: 'p4-att-art', 'aria-label': 'Attention : ' + a.citation }, (a.emoji || '⚠️') + ' ' + a.citation); })),
      h('span', { class: 'gestes' }, h('button', { type: 'button', class: 'p4-ret' + (ret ? ' on' : ''), 'data-booster': 'choisir', 'aria-label': (ret ? 'Choisi : ' : 'Choisir ') + x.a.nom, onclick: function () { choisirArt(c, x.i); } }, ret ? '✓ choisi' : '✓'),
        h('button', { type: 'button', class: 'p4-x', 'aria-label': 'Écarter ' + x.a.nom, onclick: function () { ecarterArt(c, x.i); } }, '✕'))));
  });
  cmp.criteres.forEach(function (cr, k) {
    var em = (cr.match(/^\S+/) || [''])[0], connue = arts.every(function (x) { return !douteux(x.a.valeurs[k].texte); });
    g.appendChild(h('span', { class: 'p4-ri', title: cr, 'aria-label': cr, 'data-leg': cr.replace(/^\S+\s*/, '') || cr }, /[A-Za-z0-9]/.test(em) ? cr : em));
    arts.forEach(function (x) {
      var v = x.a.valeurs[k], ct = court(x.a);
      var win = k === kT ? x.i === gT : (connue && arts.length > 1 && cmp.gagnant[k] === x.i && !ct && totalSur(x.a));
      if (v.texte === '?') { g.appendChild(h('span', { class: 'p4-c inc', 'data-leg': 'pas dans tes notes ni sur la page', 'aria-label': cr + ' : inconnu' }, '?')); return; }
      if (/à relire/.test(v.texte)) { g.appendChild(h('span', { class: 'p4-c relire', title: 'à relire', 'data-leg': 'prix à relire sur la page', 'aria-label': cr + ' : à relire sur la page' }, h('b', null, '👀'))); return; }
      var amb = /\?\s*$/.test(v.texte), txt = j1Virg(v.texte.replace(/\s*\?\s*$/, '')) + (amb ? ' ?' : '');
      var sansLiv = k === kT && kL >= 0 && douteux(x.a.valeurs[kL].texte) && !ct;
      var calcul = v.source === 'ia' && v.detail ? j1Virg(v.detail) : null, borne = ct && /^\s*≤/.test(v.texte);
      g.appendChild(h(calcul ? 'button' : 'span', { class: 'p4-c' + (win ? ' win' : '') + (v.source === 'ia' ? ' calc' : '') + (amb ? ' est' : '') + (borne ? ' court' : ''),
        title: calcul ? calcul + ' · calcul' : v.texte, type: calcul ? 'button' : null, 'data-leg': borne ? 'ne couvre pas ' + besoin : amb ? 'prix pas sûr : quel poids ?' : null,
        onclick: calcul ? function () { toast('🧮 ' + calcul + (sansLiv ? ' + livraison ?' : '') + ' = ' + txt + ' · calcul de l’app'); } : null },
        win ? h('i', { class: 'couronne', 'aria-label': 'gagne' }, '👑') : null, v.source === 'page' ? ico('b-globe', 'pg') : null,
        v.emoji ? h('b', { class: 'emo', 'aria-label': v.texte }, v.emoji) : h('b', null, txt), sansLiv ? h('small', { 'aria-label': 'plus la livraison, inconnue' }, '+ 🚚 ?') : null));
    });
  });
  org.appendChild(g);
  if (o.artEcart.length) org.appendChild(h('div', { class: 'p4-ecartes' }, o.artEcart.map(function (i) {
    return h('button', { type: 'button', class: 'm4b-puce-c', onclick: function () { ecarterArt(c, i); } }, '↺ ' + cmp.articles[i].nom);
  })));
}

/* B8 : la période à sa vraie distance ; « auj. » sous le repère, la date de début sous le début de la barre */
function periode(c, r) {
  var a = lireDate(r.periode.du, c.maj), b = lireDate(r.periode.au, c.maj), na = a ? joursDe(a.d) : null;
  var bar = h('div', { class: 'bar' }), lbs = h('div', { class: 'p4-per-lb' });
  if (a && b && b.d > a.d) {
    var now = Date.now(), t0 = Math.min(now, +a.d), t1 = Math.max(+b.d, now), sp = t1 - t0 || 1, pa = (+a.d - t0) / sp * 100, pn = (now - t0) / sp * 100;
    bar.appendChild(h('b', { style: 'left:' + pa + '%;right:' + ((t1 - +b.d) / sp * 100) + '%' }));
    bar.appendChild(h('u', { style: 'left:' + pn + '%' }));
    if (pa - pn > 36) lbs.appendChild(h('span', { class: 'auj', style: 'left:' + pn + '%' }, 'auj.'));
    lbs.appendChild(h('span', { class: 'du', style: pa > 30 ? 'right:' + (100 - pa) + '%' : 'left:' + pa + '%' }, r.periode.du));
    lbs.appendChild(h('span', { class: 'au', style: 'right:0' }, r.periode.au));
    /* grand : les mois sous la barre (début de mois, un sur deux si la frise est longue) */
    if (AMPLE) { var mm = new Date(new Date(t0).getFullYear(), new Date(t0).getMonth() + 1, 1), pas = (t1 - t0) / 864e5 > 200 ? 2 : 1, k = 0;
      while (+mm < t1) { var pm = (+mm - t0) / sp * 100; if (k % pas === 0 && pm > 4 && pm < 96) { bar.appendChild(h('i', { class: 'mois', style: 'left:' + pm + '%' }, h('span', null, MOIS[mm.getMonth()]))); } k++; mm = new Date(mm.getFullYear(), mm.getMonth() + 1, 1); } }
  } else { lbs.appendChild(h('span', { style: 'left:0' }, r.periode.du)); lbs.appendChild(h('span', { style: 'right:0' }, r.periode.au)); }
  org.appendChild(h('button', { type: 'button', class: 'm4b-per', 'data-booster': 'periode', onclick: vers(r.periode.ligne, r.periode.du, 'Période') },
    h('h3', null, '📅 ' + (na == null ? 'Période' : na > 0 ? 'Début dans ' + na + ' j' : (b && joursDe(b.d) >= 0 ? 'En cours' : 'Passée'))), bar, lbs));
}
