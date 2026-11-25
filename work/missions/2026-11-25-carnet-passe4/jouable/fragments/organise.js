/* ====================================================================== Organisé — passe 4 (recette des trois juges, 25.11 nuit)
   problème : jetons ronds (p4b-3), face à face « toi / sanitaire X » (p4b-2/3), « estimé » en pointillé (p4b-1), « prix du joint ? Noter » (p4b-3),
   UNE action pleine sous le pouce ; décider : colonnes proportionnelles, Retenir au pouce, Annuler (p4b-2) ; achat : jauge lu / manque, jamais de
   couronne face à un inconnu (p4b-1/3) ; relecture « pourquoi » (p4b-3) ; échéance : compte à rebours (p4b-2) ; sans IA : ce que lit l'app (p4b-1). */
var org = $('p-org'), zone = $('action');
function nb(t) { var m = String(t == null ? '' : t).replace(/['’\s  ]/g, '').match(/\d+(?:[.,]\d+)?/); return m ? parseFloat(m[0].replace(',', '.')) : null; }
function milliers(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
function vers(n, cit, etiq) { return n ? function (e) { if (e) e.stopPropagation(); allerLigne(n, cit, etiq); } : null; }
function motDe(p) { return String(p.mot || String(p.texte).split(/\s+/)[0]).toLowerCase(); }
function decidable(r) {
  var ops = r.options;
  if (ops.length < 2 || ops.length > 3 || r.comparaison) return null;
  return ops.every(function (x) { return x.source === 'notes' && !x.estime && nb(x.cout) != null; }) ? ops : null;
}
function enAction(el) { zone.appendChild(el); zone.hidden = false; }
var NOM_GENRE_P4 = { memo: '📌 Mémo', idee: '💡 Idée', planning: '📅 Planning', echeance: '⏳ Échéance' };
function genreDe(c) { var r = c.org && c.org.rep; if (!r) return c.genre; return r.echeance && (r.genre === 'memo' || !r.genre) ? 'echeance' : (r.genre || c.genre); }
function ligneEtat(c) {
  var o = c.org, g = genreDe(c), P = o ? aGarder(c) : [];
  var el = h('div', { class: 'p4-etat' });
  if (!o || g === 'probleme' || g === 'achat' || !g)
    el.appendChild(h('button', { type: 'button', class: 'p4-puce', style: '--c:' + COUL_ETAT[c.etat], 'data-booster': 'etat', 'aria-label': 'État ' + (NOM_ETAT[c.etat] || 'Noté') + ', toucher pour changer',
      onclick: function () { var ord = ['note', 'cherche', 'decide', 'resolu']; poserEtat(c, ord[(ord.indexOf(c.etat) + 1) % 4]); } }, h('i'), NOM_ETAT[c.etat] || 'Noté'));
  else el.appendChild(h('span', { class: 'p4-puce genre' }, NOM_GENRE_P4[g] || g));
  if (g === 'achat' && o) {
    var pas = c.etat === 'resolu' ? 2 : ((o.artRet || []).length || retenus(o).length) ? 1 : 0;
    el.appendChild(h('span', { class: 'p4-av', 'aria-label': 'avancement de l’achat' }, ['comparé', 'choisi', 'commandé'].map(function (s, i) { return h('b', { class: i === pas ? 'ici' : (i < pas ? 'fait' : '') }, s); })));
  }
  if (o) el.appendChild(h('button', { type: 'button', class: 'p4-chg', 'aria-label': 'Changé par l’IA', onclick: feuilleChangements }, '✦ ' + (P.length ? P.length + ' à garder' : hm(new Date(o.quand))) + ' ›'));
  return el;
}
function bandeau(cls, icone, titre, sous) {
  return h('div', { class: 'p4-band ' + cls, role: cls === 'bad' ? 'alert' : 'status' }, h('span', { class: 'ic' }, icone), h('span', null, h('b', null, titre), sous ? h('small', null, sous) : null));
}
function rendreOrg() {
  var c = courant(); if (!c) return;
  c.miens = c.miens || []; org.textContent = ''; zone.textContent = ''; zone.hidden = true;
  var enCours = estEnLecture(c), o = c.org, r = o && o.rep, nbl = lignesDoc().filter(function (l) { return l.trim(); }).length;
  org.appendChild(ligneEtat(c));
  if (enCours) org.appendChild(h('div', { class: 'm4b-lit m4b-lit-org', role: 'status', style: 'margin:0 0 10px' }, h('span', null, ico('b-ia'), lecture && lecture.carnetId === c.id ? 'L’IA lit ta note…' : 'L’IA lira ta note juste après'), h('span', { class: 'bar' }, h('i'))));
  var horsLigne = !navigator.onLine || c.attente;
  if (horsLigne && !enCours) org.appendChild(bandeau('hors', '📴', 'Hors ligne', (c.attente ? '1 note en file · ' : '') + 'l’IA lira au retour'));
  else if (c.orgErreur && !enCours) org.appendChild(bandeau('bad', '⚠️', 'L’IA n’a pas pu lire', c.orgErreur.message + ' · tes ' + nbl + ' notes sont gardées'));
  if (!o) {
    if (!enCours && (c.orgErreur || horsLigne)) {
      ecranSansIA(c);
      if (horsLigne) enAction(h('button', { type: 'button', class: 'p4-go', onclick: function () { basculer('notes'); placerFin(); } }, h('span', { class: 'em' }, '✏️'), h('b', null, 'Noter')));
      else enAction(h('button', { type: 'button', class: 'p4-go', 'data-booster': 'reessayer', onclick: function () { ranger(); } }, h('span', { class: 'em' }, '↻'), h('b', null, 'Réessayer')));
    } else if (!enCours) {
      org.appendChild(h('p', { class: 'm4b-vide' }, 'Pas encore rangé. L’IA lit ta note et la range ici ; elle ne change pas une lettre de ton texte.'));
      enAction(h('button', { type: 'button', class: 'p4-go', onclick: function () { ranger(); } }, h('span', { class: 'em' }, '✦'), h('b', null, 'Ranger avec l’IA')));
    }
    feuilleAide(c); return;
  }
  if (new Date(c.maj) > new Date(o.quand) && !enCours && c.html !== '' && lignesDoc().join('\n') !== o.lignes.join('\n'))
    org.appendChild(h('div', { class: 'p4-k' }, 'Ta note a changé depuis.', h('button', { type: 'button', class: 'm4b-btn doux', onclick: ranger }, '↻ Relire')));
  if ((r.resolu || r.etatPropose === 'resolu') && o.garde.resolu === undefined && c.etat !== 'resolu') {
    org.appendChild(h('div', { class: 'm4b-carte prop' }, h('h3', null, '✦ ' + (r.resolu ? r.resolu.question : 'Résolu ?')),
      h('div', { class: 'm4b-actions' }, bouton('Pas encore', '', function () { refuser('resolu'); }), bouton('Résolu', '', function () { garder('resolu'); }, 'b-coche'))));
  }
  if (r.echeance) compteARebours(c, r);
  if (r.periode) periode(c, r);
  (r.attention || []).forEach(function (a) {
    org.appendChild(h('button', { type: 'button', class: 'p4-att', onclick: vers(a.ligne, a.citation, a.texte) }, h('span', { class: 'em' }, a.emoji || '⚠️'), h('span', null, '« ' + a.citation + ' »'), h('small', null, 'ligne ' + a.ligne + ' ↩')));
  });
  if (r.chiffres && r.chiffres.length) org.appendChild(h('div', { class: 'p4-chf' }, r.chiffres.map(function (x) {
    return h('button', { type: 'button', class: x.estime ? 'est' : '', onclick: vers(x.ligne, x.valeur, x.label || x.valeur) }, h('span', { class: 'em' }, x.emoji || '#'), h('b', null, (x.estime ? '≈ ' : '') + x.valeur), x.label ? h('span', null, x.label) : null);
  })));
  jetons(c, r);
  if (r.relecture) relecture(c, r);
  if (r.comparaison) comparer(c, r);
  var ops = decidable(r), zoneLibre = true;
  if (ops && o.garde.options !== false) zoneLibre = !decider(c, r, ops);
  else faceAFace(c, r);
  (r.manque || []).forEach(function (m) {
    org.appendChild(h('div', { class: 'p4-manque' }, h('span', { class: 'em' }, m.emoji || '✏️'), h('b', null, m.texte),
      h('button', { type: 'button', class: 'p4-noter', 'data-booster': 'noter-manque', onclick: function () { viser('note', m.texte.replace(/\s*\?\s*$/, '')); } }, 'Noter')));
  });
  if (r.conseil && !r.options.length && !r.comparaison && !r.relecture) org.appendChild(h('div', { class: 'p4-conseil' }, h('i', null, '✦'), h('span', null, r.conseil)));
  listeACocher(c, r);
  if (r.retenir && r.retenir.length) org.appendChild(h('div', { class: 'm4b-ret' }, h('h3', null, '📌 À retenir'), r.retenir.map(function (x) {
    return h('button', { type: 'button', onclick: vers(x.ligne, x.citation, x.texte) }, (x.emoji ? x.emoji + ' ' : '') + x.texte, ico('b-r', 'm4b-r'));
  })));
  if (r.relecture && zoneLibre && c.etat === 'resolu') { bonChoix(c); zoneLibre = false; }
  var t = r.tache && o.garde.tache !== false ? r.tache : null;
  if (t && !o.tacheFaite && zoneLibre) { actionTache(c, t); t = null; }
  sectionAFaire(c, t);
  if (!r.pistes.length && !r.options.length && !r.tache && !r.conseil && !r.comparaison && !r.echeance && !r.periode && !(r.liste || []).length && !(r.chiffres || []).length && !r.relecture && !c.miens.length)
    org.appendChild(h('p', { class: 'm4b-vide' }, 'L’IA n’a rien trouvé à ranger dans cette note.'));
  feuilleAide(c);
}
/* pistes : jetons ronds, un mot, pastille ✓ trouvé / ? à vérifier ; « + » ajoute la sienne */
function jetons(c, r) {
  var miens = c.miens.filter(function (m) { return m.type === 'piste'; }), ps = r.pistes;
  if (!ps.length && !miens.length && r.genre !== 'probleme') return;
  var g = h('div', { class: 'p4-jetons' });
  ps.forEach(function (p) {
    var oui = p.statut === 'trouve';
    g.appendChild(h('button', { type: 'button', class: 'p4-jeton ' + (oui ? 'oui' : 'q'), 'data-booster': 'jeton-piste', 'aria-label': p.texte + ' : ' + (oui ? 'trouvé' : p.statut === 'pas_trouve' ? 'pas trouvé' : 'à vérifier'), onclick: vers(p.ligne, p.citation, motDe(p)) },
      h('span', { class: 'rond' }, p.emoji || '🔎', h('i', null, oui ? '✓' : '?')), h('span', { class: 'mot' }, motDe(p))));
  });
  miens.forEach(function (m) {
    g.appendChild(h('button', { type: 'button', class: 'p4-jeton q mien', 'aria-label': m.texte + (m.ia ? ' (aide de l’IA)' : ' (à toi)'), onclick: m.ia ? null : function () { allerLigne(0, m.ligneTxt, m.texte); } },
      h('span', { class: 'rond' }, m.emoji || '✍️', h('i', null, m.ia ? '✦' : '✍')), h('span', { class: 'mot' }, m.texte.split(/\s+/).slice(0, 2).join(' ').toLowerCase())));
  });
  if (g.children.length < 8) g.appendChild(h('button', { type: 'button', class: 'p4-jeton plus', 'aria-label': 'Ajouter une piste', onclick: function () { viser('piste', 'Piste'); } }, h('span', { class: 'rond' }, '+')));
  org.appendChild(g);
}
function cellule(v, estime, f) {
  if (!v || /^\s*\?\s*$/.test(v) || nb(v) == null && /\?\s*$/.test(v)) return h('span', { class: 'p4-c inc', 'aria-label': 'inconnu, pas dans tes notes' }, '?');
  var est = estime || /\?\s*$/.test(v); v = v.replace(/\s*\?\s*$/, '');
  return h('button', { type: 'button', class: 'p4-c' + (est ? ' est' : ''), onclick: f }, h('b', null, v), est ? h('small', null, 'estimé') : null);
}
/* options sans prix sûrs : le face à face, qui le fait ; « estimé » en pointillé, l'inconnu hachuré */
function faceAFace(c, r) {
  var o = c.org, ops = o.garde.options === false ? [] : r.options;
  var miens = c.miens.filter(function (m) { return m.type === 'option'; });
  if (!ops.length && !miens.length) return;
  var R = retenus(o), all = ops.map(function (op, i) { return { op: op, i: i }; }).concat(miens.map(function (m) { return { op: { titre: m.texte, emoji: m.emoji || '✍️', qui: m.texte }, m: m }; })).slice(0, 3);
  var couts = all.some(function (x) { return x.op.cout && !/^\s*\?\s*$/.test(x.op.cout); }), att = all.some(function (x) { return x.op.attente; });
  var g = h('div', { class: 'p4-face', 'data-booster': 'face-a-face', style: 'grid-template-columns:' + (couts || att ? '30px ' : '') + 'repeat(' + all.length + ',1fr)' });
  if (couts || att) g.appendChild(h('span'));
  all.forEach(function (x) {
    var ret = x.m ? x.m.retenu : R.indexOf(x.i) >= 0;
    g.appendChild(h('button', { type: 'button', class: 'p4-qui' + (ret ? ' ret' : ''), onclick: vers(x.op.ligne, x.op.citation, x.op.qui || x.op.titre), 'aria-label': x.op.titre + (x.op.conseille ? ', conseillé par l’IA' : '') },
      h('span', { class: 'em' }, x.op.emoji || '•'), h('b', null, x.op.qui || x.op.titre), x.op.conseille ? h('i', { class: 'p4-cons', title: 'conseillé par l’IA' }, '✦') : null));
  });
  if (couts) { g.appendChild(h('span', { class: 'p4-ri', title: 'coût' }, '💰')); all.forEach(function (x) { g.appendChild(cellule(x.op.cout, x.op.estime, vers(x.op.ligne, x.op.citation, x.op.titre))); }); }
  if (att) {
    g.appendChild(h('span', { class: 'p4-ri', title: 'en attente' }, '⏳'));
    all.forEach(function (x) { var a = x.op.attente; g.appendChild(a ? h('button', { type: 'button', class: 'p4-c att', onclick: vers(a.ligne, a.citation, a.citation) }, String(a.citation).replace(/[.\s]+$/, '').replace(/\s+attendue?s?$/i, '').toLowerCase()) : cellule(null)); });
  }
  if (couts || att) g.appendChild(h('span'));
  all.forEach(function (x) {
    var ret = x.m ? x.m.retenu : R.indexOf(x.i) >= 0;
    g.appendChild(h('button', { type: 'button', class: 'p4-ret' + (ret ? ' on' : ''), 'data-booster': 'retenir', onclick: function () {
      if (x.m) { x.m.retenu = !x.m.retenu; sauver(); geste(x.m.retenu ? 'retenir une option' : 'ne plus retenir', x.m.texte); rendreOrg(); } else retenirAnnulable(x.i);
    } }, ret ? '✓ retenu' : 'retenir'));
  });
  org.appendChild(g);
}
/* deux prix sûrs : colonnes proportionnelles, l'écart calculé et nommé, Retenir au pouce, aucun côté mis en avant */
function decider(c, r, ops) {
  var o = c.org, R = retenus(o), vals = ops.map(function (x) { return nb(x.cout); }), mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals);
  var unite = (ops[0].cout.match(/(CHF|€|EUR|Fr\.)\s*$/) || ['', 'CHF'])[1];
  org.appendChild(h('div', { class: 'p4-dec', 'data-booster': 'colonnes' }, ops.map(function (op, i) {
    var ret = R.indexOf(i) >= 0;
    return h('button', { type: 'button', class: 'p4-col' + (ret ? ' ret' : '') + (vals[i] === mn && mx > mn ? ' moins' : ''), onclick: vers(op.ligne, op.citation, op.titre) },
      h('b', { class: 'v' }, op.cout), h('span', { class: 'barre', style: 'height:' + Math.max(24, Math.round(vals[i] / mx * 150)) + 'px' }, op.emoji || ''), h('span', { class: 'n' }, (ret ? '✓ ' : '') + op.titre));
  })));
  if (ops.length === 2 && mx > mn) org.appendChild(h('div', { class: 'p4-ecart' }, h('b', null, milliers(mx - mn) + ' ' + unite), ' d’écart ', h('small', null, '(' + milliers(mx) + ' − ' + milliers(mn) + ')')));
  if (R.length) return false;
  enAction(h('div', { class: 'p4-duo' }, ops.map(function (op, i) { return h('button', { type: 'button', class: 'p4-b', 'data-booster': 'retenir-pouce', onclick: function () { retenirAnnulable(i); } }, 'Retenir ', op.emoji || op.titre); })));
  return true;
}
function retenirAnnulable(i) {
  var c = courant(), o = c.org, op = o.rep.options[i], av = { etat: c.etat, par: c.etatPar, R: retenus(o).slice(), g: o.garde.options }, deja = av.R.indexOf(i) >= 0;
  retenir(i); rendreListe();
  toast((deja ? 'Plus retenu : ' : 'Retenu : ') + op.titre, 'Annuler', function () {
    c.etat = av.etat; c.etatPar = av.par; o.retenus = av.R; o.garde.options = av.g; sauver(); geste('annuler', 'retenir ' + op.titre); if (courant() === c && vue === 'org') rendreOrg(); rendreListe();
  });
}
/* achat : jauge lu / manque, boutiques en colonnes, critère en icône ; couronne seulement si toute la rangée est connue */
function comparer(c, r) {
  var o = c.org, cmp = r.comparaison; o.artRet = o.artRet || []; o.artEcart = o.artEcart || [];
  var arts = cmp.articles.map(function (a, i) { return { a: a, i: i }; }).filter(function (x) { return o.artEcart.indexOf(x.i) < 0; });
  var lu = 0, manque = 0; arts.forEach(function (x) { x.a.valeurs.forEach(function (v) { if (v.texte === '?' || /à relire/.test(v.texte)) manque++; else lu++; }); });
  var seg = h('span', { class: 'seg' }); for (var k = 0; k < lu + manque; k++) seg.appendChild(h('i', { class: k < lu ? 'l' : '' }));
  org.appendChild(h('div', { class: 'p4-jauge', 'data-booster': 'jauge-lu', 'aria-label': 'lu ' + lu + ', manque ' + manque }, h('b', null, 'lu ' + lu), seg, h('b', { class: 'm' }, 'manque ' + manque)));
  var g = h('div', { class: 'p4-cmp', style: 'grid-template-columns:32px repeat(' + arts.length + ',minmax(0,1fr))' });
  g.appendChild(h('span'));
  arts.forEach(function (x) {
    var ret = o.artRet.indexOf(x.i) >= 0;
    g.appendChild(h('div', { class: 'p4-art' + (ret ? ' ret' : '') },
      h('button', { type: 'button', class: 'nom', onclick: vers(x.a.ligne, x.a.citation, x.a.nom) }, h('span', { class: 'em' }, (ret ? '✓' : '') || r.emoji || '🛒'), h('b', null, x.a.nom)),
      h('span', { class: 'gestes' }, h('button', { type: 'button', class: 'p4-ret' + (ret ? ' on' : ''), 'data-booster': 'choisir', onclick: function () { choisirArt(c, x.i); } }, ret ? '✓ choisi' : 'choisir'),
        h('button', { type: 'button', class: 'p4-x', 'aria-label': 'Écarter ' + x.a.nom, onclick: function () { ecarterArt(c, x.i); } }, '✕'))));
  });
  cmp.criteres.forEach(function (cr, k) {
    var em = (cr.match(/^\S+/) || [''])[0], connue = arts.every(function (x) { return x.a.valeurs[k].texte !== '?' && !/à relire/.test(x.a.valeurs[k].texte); });
    g.appendChild(h('span', { class: 'p4-ri', title: cr, 'aria-label': cr }, /[A-Za-z0-9]/.test(em) ? cr : em));
    arts.forEach(function (x) {
      var v = x.a.valeurs[k], win = connue && arts.length > 1 && cmp.gagnant[k] === x.i;
      if (v.texte === '?') { g.appendChild(h('span', { class: 'p4-c inc', 'aria-label': cr + ' : inconnu' }, '?')); return; }
      if (/à relire/.test(v.texte)) { g.appendChild(h('span', { class: 'p4-c relire' }, h('b', null, 'à relire'))); return; }
      g.appendChild(h('span', { class: 'p4-c' + (win ? ' win' : '') + (v.source === 'ia' ? ' calc' : ''), title: v.texte },
        win ? h('i', { class: 'couronne', 'aria-label': 'gagne' }, '👑') : null, v.source === 'page' ? ico('b-globe', 'pg') : null,
        v.emoji ? h('b', { class: 'emo', 'aria-label': v.texte }, v.emoji) : h('b', null, v.texte), v.source === 'ia' ? h('small', null, (v.detail ? v.detail + ' · ' : '') + 'calcul') : null));
    });
  });
  org.appendChild(g);
  if (o.artEcart.length) org.appendChild(h('div', { class: 'p4-ecartes' }, o.artEcart.map(function (i) {
    return h('button', { type: 'button', class: 'm4b-puce-c', onclick: function () { ecarterArt(c, i); } }, '↺ ' + cmp.articles[i].nom);
  })));
}
function choisirArt(c, i) {
  var o = c.org, av = o.artRet.slice(), k = o.artRet.indexOf(i), nom = o.rep.comparaison.articles[i].nom;
  if (k >= 0) o.artRet.splice(k, 1); else o.artRet.push(i);
  sauver(); geste(k >= 0 ? 'ne plus choisir' : 'choisir', nom); rendreOrg();
  toast((k >= 0 ? 'Plus choisi : ' : 'Choisi : ') + nom, 'Annuler', function () { o.artRet = av; sauver(); rendreOrg(); });
}
function ecarterArt(c, i) {
  var o = c.org, av = o.artEcart.slice(), k = o.artEcart.indexOf(i), nom = o.rep.comparaison.articles[i].nom;
  if (k >= 0) o.artEcart.splice(k, 1); else o.artEcart.push(i);
  sauver(); geste(k >= 0 ? 'remettre' : 'écarter', nom); rendreOrg();
  toast((k >= 0 ? 'Remis : ' : 'Écarté : ') + nom, 'Annuler', function () { o.artEcart = av; sauver(); rendreOrg(); });
}
/* échéance : le compte à rebours, une case par jour, sa ligne à un toucher */
function compteARebours(c, r) {
  var e = r.echeance, dd = lireDate(e.quand, c.maj), n = dd ? joursDe(dd.d) : null;
  var bl = h('div', { class: 'p4-ech' + (n != null && n < 0 ? ' passe' : ''), 'data-booster': 'compte-a-rebours' },
    h('div', { class: 'haut' }, h('b', { class: 'j' }, n == null ? '⏳' : (dd.approx ? '≈' : '') + Math.abs(n) + ' j'), h('span', { class: 't' }, (n != null && n < 0 ? 'passé : ' : '') + (/^\d/.test(e.quand) ? 'avant le ' : '') + e.quand)));
  if (n != null && n > 0) {
    var jr = h('div', { class: 'jours', 'aria-hidden': 'true' }), m = Math.min(n + 1, 46);
    for (var i = 0; i < m; i++) jr.appendChild(h('i'));
    bl.appendChild(jr);
  }
  bl.appendChild(h('div', { class: 'bouts' }, h('span', null, 'auj.'), h('button', { type: 'button', class: 'p4-ligne', onclick: vers(e.ligne, e.quand, e.quoi || 'Échéance') }, 'ta ligne ' + e.ligne, ico('b-r'))));
  org.appendChild(bl);
}
function periode(c, r) {
  var a = lireDate(r.periode.du, c.maj), b = lireDate(r.periode.au, c.maj), bar = h('div', { class: 'bar' }), na = a ? joursDe(a.d) : null;
  if (a && b && b.d > a.d) {
    var t0 = Math.min(Date.now(), +a.d), t1 = Math.max(+b.d, Date.now()), sp = t1 - t0 || 1;
    bar.appendChild(h('b', { style: 'left:' + ((+a.d - t0) / sp * 100) + '%;right:' + ((t1 - +b.d) / sp * 100) + '%' }));
    bar.appendChild(h('u', { style: 'left:' + ((Date.now() - t0) / sp * 100) + '%' }));
  }
  org.appendChild(h('button', { type: 'button', class: 'm4b-per', 'data-booster': 'periode', onclick: vers(r.periode.ligne, r.periode.du, 'Période') },
    h('h3', null, '📅 ' + (na == null ? 'Période' : na > 0 ? 'Début dans ' + na + ' j' : (b && joursDe(b.d) >= 0 ? 'En cours' : 'Passée'))),
    bar, h('span', { class: 'bout' }, h('span', null, r.periode.du), h('span', { style: 'text-align:right' }, r.periode.au))));
}
function listeACocher(c, r) {
  var o = c.org; if (!r.liste || !r.liste.length) return;
  var nf = r.liste.filter(function (x, i) { return o.coches[i]; }).length;
  org.appendChild(h('div', { class: 'p4-k' }, '☑️ ' + nf + '/' + r.liste.length));
  org.appendChild(h('div', { class: 'm4b-liste' }, r.liste.map(function (x, i) {
    var fait = !!o.coches[i];
    return h('div', { class: 'm4b-li' + (fait ? ' fait' : '') },
      h('button', { type: 'button', class: 'c', 'data-booster': 'cocher', 'aria-label': (fait ? 'Décocher ' : 'Cocher ') + x.texte, onclick: function () { o.coches[i] = !fait; sauver(); geste(fait ? 'décocher' : 'cocher', x.texte); rendreOrg(); } }, h('i', null, fait ? ico('b-coche') : null)),
      h('button', { type: 'button', class: 'tx', onclick: vers(x.ligne, x.citation, x.texte) }, (x.emoji ? x.emoji + ' ' : '') + x.texte));
  })));
}
/* relecture des mois plus tard : pourquoi ce choix, ce que tu savais, ce que tu as fait, le calcul nommé */
function relecture(c, r) {
  var x = r.relecture;
  org.appendChild(h('button', { type: 'button', class: 'p4-pq', onclick: vers(x.choix.ligne, x.choix.citation, x.choix.texte) }, h('span', { class: 'q' }, '❓'),
    h('span', null, h('small', null, 'pourquoi'), h('b', null, (x.choix.emoji ? x.choix.emoji + ' ' : '') + x.choix.texte))));
  var col = function (titre, cls, items) {
    return h('div', { class: 'p4-sv ' + cls }, h('div', { class: 'hd' }, titre), items.map(function (it) { return h('button', { type: 'button', onclick: vers(it.ligne, it.citation, it.texte) }, h('span', { class: 'em' }, it.emoji || '•'), h('span', null, it.texte)); }));
  };
  if (x.savais.length || x.fait.length) org.appendChild(h('div', { class: 'p4-svf' }, col('🧠 tu savais', 'sv', x.savais), col('✓ tu as fait', 'af', x.fait)));
  if (x.calcul) org.appendChild(h('div', { class: 'p4-calc' }, h('b', null, x.calcul.valeur), h('small', null, x.calcul.detail + ' · calcul de l’app')));
}
function bonChoix(c) {
  var o = c.org;
  enAction(h('div', { class: 'p4-duo' }, h('div', { class: 'p4-duo-t' }, o.bonChoix ? (o.bonChoix === 'oui' ? '✓ Toujours le bon choix' : '🤔 Pas sûr : noté') : 'Toujours le bon choix ?'),
    h('button', { type: 'button', class: 'p4-b', 'data-booster': 'bon-choix', onclick: function () { o.bonChoix = 'oui'; sauver(); geste('bon choix', 'oui'); rendreOrg(); toast('Noté : toujours le bon choix', 'Annuler', function () { o.bonChoix = null; sauver(); rendreOrg(); }); } }, '👍 Oui'),
    h('button', { type: 'button', class: 'p4-b', onclick: function () { o.bonChoix = 'pas sûr'; sauver(); geste('bon choix', 'pas sûr'); rendreOrg(); viser('note', 'Pas sûr'); } }, '🤔 Pas sûr')));
}
/* la prochaine action : le seul bouton plein, sous le pouce ; toucher = fait, avec Annuler */
function actionTache(c, t) {
  var dq = t.quand && lireDate(t.quand, c.maj);
  enAction(h('button', { type: 'button', class: 'p4-go', 'data-booster': 'action', 'aria-label': t.titre + ' : toucher quand c’est fait' }, h('span', { class: 'em' }, t.emoji || '☐'), h('b', null, t.titre),
    t.quand ? h('small', null, (dq && dq.approx ? '≈ ' : '') + (dq ? dateCourte(dq.d) : t.quand)) : null, h('i', { class: 'case' })));
  zone.lastChild.addEventListener('click', function () { faireTache(c); });
}
function faireTache(c) {
  var o = c.org, t = o.rep.tache, g = o.garde.tache; if (g === undefined) o.garde.tache = true; o.tacheFaite = true;
  sauver(); geste('cocher la tâche', t.titre); rendreOrg(); rendreListe();
  toast('Fait : ' + t.titre, 'Annuler', function () { o.tacheFaite = false; o.garde.tache = g; sauver(); if (courant() === c) rendreOrg(); rendreListe(); });
}
/* À faire du carnet : la tâche si elle n'est pas au pouce, les siennes, les checks gardés depuis Aide */
function sectionAFaire(c, t) {
  var o = c.org, miens = c.miens.filter(function (m) { return m.type === 'tache'; }), fait = o && o.tacheFaite && o.rep.tache && o.garde.tache !== false ? o.rep.tache : null;
  if (!t && !miens.length && !fait) return;
  org.appendChild(h('div', { class: 'p4-k sec' }, h('span', null, '☐ À faire'),
    h('button', { type: 'button', class: 'm4b-plus', 'aria-label': 'Ajouter : À faire', onclick: function () { viser('tache', 'À faire'); } }, h('span', null, '+'))));
  var ligneT = function (tt, faite, f, sous, aller) {
    return h('div', { class: 'm4b-tache' + (faite ? ' faite' : ''), onclick: aller },
      h('button', { type: 'button', class: 'c', 'aria-label': (faite ? 'Décocher ' : 'Cocher ') + tt.titre, onclick: function (e) { e.stopPropagation(); f(); } }, faite ? ico('b-coche') : null),
      h('span', { class: 't' }, tt.emoji ? tt.emoji + ' ' : '', tt.titre), h('span'), h('span', { class: 'm' }, sous));
  };
  var tt = t || fait;
  if (tt) ligneT && org.appendChild(ligneT(tt, !!o.tacheFaite, function () { o.tacheFaite = !o.tacheFaite; if (o.garde.tache === undefined) o.garde.tache = true; sauver(); geste(o.tacheFaite ? 'cocher la tâche' : 'décocher la tâche', tt.titre); rendreOrg(); rendreListe(); },
    tt.quand ? '⏳ ' + tt.quand : (tt.ligne ? 'ta ligne ' + tt.ligne : '✦ IA'), vers(tt.ligne, tt.citation, tt.titre)));
  miens.forEach(function (m) {
    org.appendChild(ligneT({ titre: m.texte, emoji: m.emoji }, m.fait, function () { m.fait = !m.fait; sauver(); geste(m.fait ? 'cocher' : 'décocher', m.texte); rendreOrg(); rendreListe(); },
      (m.check ? '✓ check · ' : '') + (m.ia ? '✦ IA' : 'à toi'), m.ia ? null : function () { allerLigne(0, m.ligneTxt, m.texte); }));
  });
}
/* sans IA (erreur ou hors ligne) : seul ce que lit l'app (portage de etiquettesLocales, src/domain/carnets/analyseLocale.ts), places « · IA » en creux */
function etiquettesLigne(l) {
  var n = l.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''), out = [], m;
  if (!/https?:\/\/|www\.|\.(ch|com|fr|de|au)\//i.test(l)) {
    var devis = /\b(devis|offre)\b/.test(n), re = /\d{1,3}(?:['’   ]\d{3})+(?:[.,]\d{1,2})?\s?(?:CHF|Fr\.|€|EUR)|\d+(?:[.,]\d{1,2})?\s?(?:CHF|Fr\.|€|EUR)/g;
    while ((m = re.exec(l))) out.push({ sorte: devis ? 'devis' : 'montant', texte: m[0] });
  }
  if (/\bpas\s+(?:encore\s+)?trouve(?:e|s|es)?\b/.test(n)) out.push({ sorte: 'pas_trouve', texte: 'pas trouvé' });
  if (/\bcontacte(?:e|s|es)?\b/.test(n)) out.push({ sorte: 'contacte', texte: 'contacté' });
  return out;
}
function ecranSansIA(c) {
  var lignes = lignesDoc(), lus = [];
  lignes.forEach(function (l, i) { etiquettesLigne(l).forEach(function (e) { lus.push({ e: e, i: i + 1 }); }); });
  org.appendChild(h('div', { class: 'p4-k' }, '🧮 Lu par l’app, sans IA'));
  if (lus.length) org.appendChild(h('div', { class: 'p4-lus' }, lus.map(function (x) {
    return h('button', { type: 'button', class: 'p4-lu ' + x.e.sorte, onclick: vers(x.i, null, x.e.texte) },
      h('span', { class: 'ic' }, x.e.sorte === 'pas_trouve' ? '❓' : x.e.sorte === 'contacte' ? '📞' : '💰'), h('b', null, x.e.texte), h('small', null, 'ligne ' + x.i + ' ↩'));
  })));
  else org.appendChild(h('p', { class: 'm4b-vide' }, 'Rien que l’app sache lire seule.'));
  org.appendChild(h('div', { class: 'p4-creux' }, h('span', null, '🧩 pistes · IA'), h('span', null, '☐ tâche · IA')));
  org.appendChild(h('div', { class: 'p4-k' }, '✏️ Tes notes, telles quelles'));
  org.appendChild(h('div', { class: 'p4-notes' }, lignes.filter(function (l) { return l.trim(); }).map(function (l) { return h('p', null, l); })));
}
/* Aide : une feuille, ✓ vérifier / ☐ tâche / 💡 suggestion, Garder ou Non merci sur chacune */
function feuilleAide(c) {
  var a = c.aide; if (!a) return;
  if (!a.enCours && !a.erreur && !a.items.length) { c.aide = null; sauver(); fermerFeuille(); return; }
  var NOMS = { check: 'vérifier', tache: 'tâche', suggestion: 'suggestion' };
  var corps = [h('h2', null, '💡 Aide')];
  if (a.enCours) corps.push(h('div', { class: 'm4b-lit', role: 'status', style: 'margin:8px 0' }, h('span', null, ico('b-ia'), 'L’IA cherche ce qui te manque…'), h('span', { class: 'bar' }, h('i'))));
  else if (a.erreur) corps.push(h('p', { class: 'm4b-vide' }, 'L’IA n’a pas pu aider · ' + a.erreur));
  a.items.forEach(function (it, i) {
    corps.push(h('div', { class: 'p4-ai ' + it.type }, h('span', { class: 'ty', title: NOMS[it.type], 'aria-label': NOMS[it.type] }, TYPE_AIDE[it.type].ic),
      h('span', { class: 't' }, h('b', null, (it.emoji ? it.emoji + ' ' : '') + it.texte), it.pourquoi ? h('small', null, it.pourquoi) : null),
      h('span', { class: 'p4-gn' }, h('button', { type: 'button', class: 'm4b-btn', 'data-booster': 'garder-aide', onclick: function () { garderAide(c, i); } }, 'Garder'),
        h('button', { type: 'button', class: 'm4b-btn doux', onclick: function () { ecarterAide(c, i); } }, 'Non merci'))));
  });
  corps.push(h('div', { class: 'rassure' }, '✓ vérifier · ☐ tâche · 💡 suggestion : rien n’est posé sans ton toucher.'));
  ouvrirFeuille(corps);
  feuille[0].addEventListener('click', function () { if (c.aide && !c.aide.enCours) { c.aide = null; sauver(); } });
}
function norm(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9à-ÿ]+/g, ' ').trim(); }
function poserEtat(c, e) {
  if (c.etat === e) return;
  var av = { etat: c.etat, par: c.etatPar }; c.etat = e; c.etatPar = { par: 'toi', le: new Date().toISOString() };
  if (c.org && c.org.garde.etat === undefined) c.org.garde.etat = false;
  sauver(); geste('changer l’état', e); rendreOrg(); rendreListe();
  toast('État : ' + NOM_ETAT[e], 'Annuler', function () { c.etat = av.etat; c.etatPar = av.par; sauver(); rendreOrg(); rendreListe(); });
}
/* la barre d'Organisé : écrire dans Mes notes sans quitter la vue, photo, lien, voix, Aide */
var ajout = $('pied-org'); ajout.className = 'm4b-ajout';
var champ = h('input', { type: 'text', class: 'm4b-ch1', placeholder: 'Ajouter…', enterkeyhint: 'send', autocomplete: 'off', 'aria-label': 'Ajouter à tes notes' });
var pourEl = h('div', { class: 'm4b-pour', hidden: true }), ics = h('span', { class: 'ics' });
var envoi = h('button', { type: 'button', class: 'm4b-envoi', 'aria-label': 'Ajouter', hidden: true, onclick: function () { envoyerAjout(); } }, ico('b-envoi'));
ajout.appendChild(pourEl); ajout.appendChild(h('div', { class: 'rang' }, champ, ics, envoi));
var pour = null, PREFIXE = { piste: 'Piste : ', option: 'Option : ', tache: 'À faire : ' };
champ.addEventListener('input', majAjout);
champ.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); envoyerAjout(); } });
envoi.addEventListener('pointerdown', function (e) { e.preventDefault(); });
function majAjout() { var plein = !!champ.value.trim(); ics.hidden = plein; envoi.hidden = !plein; }
function rendreIcs() {
  ics.textContent = '';
  ics.appendChild(btnOutil('b-image', 'Photo', choisirPhoto));
  ics.appendChild(btnOutil('b-lien', 'Coller le lien', collerLien));
  if (dictee) ics.appendChild(btnVoix());
  ics.appendChild(h('button', { type: 'button', class: 'm4b-aidebtn', 'data-booster': 'aide', onclick: aide }, ico('b-ampoule'), 'Aide'));
}
function viser(mode, label) {
  pour = { mode: mode, label: label }; pourEl.textContent = '';
  pourEl.appendChild(h('span', null, mode === 'note' ? '→ ' + label : '+ ' + label));
  pourEl.appendChild(h('button', { type: 'button', 'aria-label': 'Ne plus viser', onclick: function () { pour = null; pourEl.hidden = true; champ.placeholder = 'Ajouter…'; } }, '✕'));
  pourEl.hidden = false;
  champ.placeholder = mode === 'note' ? label + ' : …' : mode === 'piste' ? 'Ta piste…' : mode === 'option' ? 'Ton option…' : 'Ta tâche…';
  champ.focus();
}
function ajouterLigne(contenu) {
  var b = blocs(), last = b[b.length - 1], d = h('div', null, contenu);
  if (last && estVide(last) && !last.querySelector('.cb')) doc.replaceChild(d, last); else doc.appendChild(d);
  normaliser(); garderTexte(); return d;
}
function apresAjout(quoi) {
  var c = courant(); autoRanger(c); rendreOrg(); rendreOutils(); rendrePoint();
  toast('Ajouté à Mes notes · l’IA relit');
}
function envoyerAjout() {
  var c = courant(), t = champ.value.trim(); if (!c || !t) return;
  var p = pour, ligne = p ? (p.mode === 'note' ? p.label + ' : ' : PREFIXE[p.mode]) + t : t;
  ajouterLigne(ligne);
  if (p && p.mode !== 'note') c.miens.push({ type: p.mode, texte: t, ligneTxt: ligne, le: new Date().toISOString(), fait: false });
  champ.value = ''; pour = null; pourEl.hidden = true; champ.placeholder = 'Ajouter…'; majAjout(); sauver();
  geste('ajouter depuis Organisé', (p ? p.mode + ' : ' : '') + t);
  apresAjout(p ? p.mode : 'texte');
}
