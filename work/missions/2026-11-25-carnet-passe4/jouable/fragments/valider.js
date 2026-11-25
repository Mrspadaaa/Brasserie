function valider(brut, lignes, pages) {
  var erreurs = [], fausses = 0;
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return { rep: null, erreurs: ['pas un objet JSON'], fausses: 0 };
  var str = function (x) { return typeof x === 'string' && x.trim() ? x.trim() : null; };
  var emo = function (x) { x = str(x); return x && x.length <= 12 && !/[A-Za-z0-9]/.test(x) ? x : ''; };
  var normA = function (s) { return s.replace(/[’‘`´]/g, '\'').replace(/[“”«»]/g, '"').replace(/ /g, ' '); };
  var texteLignes = normA(lignes.join('\n')), textePages = normA((pages || []).join('\n'));
  var ESTIM = /estimation|estimé|≈|~|environ|à peu près/i;
  /* rend la citation telle qu'écrite dans SA ligne, ou null (comptée fausse) */
  function verifier(quoi, ligne, citation) {
    citation = str(citation); if (!citation) return null;
    var n = Number(ligne);
    if (Number.isInteger(n) && n >= 1 && n <= lignes.length) {
      var L = lignes[n - 1];
      if (L.indexOf(citation) >= 0) return { ligne: n, citation: citation };
      var i = normA(L).indexOf(normA(citation));
      if (i >= 0) { erreurs.push(quoi + ' : apostrophes rétablies (ligne ' + n + ')'); return { ligne: n, citation: L.substr(i, citation.length) }; }
    }
    fausses++; erreurs.push(quoi + ' : citation absente de la ligne ' + ligne + ' : « ' + citation + ' »');
    return null;
  }
  /* un calcul ne prend que des nombres écrits (ses notes ou les pages lues) */
  function nombresConnus(t) { return (String(t).match(/\d+(?:[.,]\d+)?/g) || []).every(function (x) { return texteLignes.indexOf(x) >= 0 || textePages.indexOf(x) >= 0; }); }
  function cite(x, quoi) { if (!x || !str(x.texte)) return null; var v = verifier(quoi + ' « ' + x.texte + ' »', x.ligne, x.citation); return v ? { emoji: emo(x.emoji), texte: str(x.texte), ligne: v.ligne, citation: v.citation } : null; }
  var arr = function (x) { return Array.isArray(x) ? x : []; };
  var rep = {};
  rep.etatPropose = RANG.hasOwnProperty(brut.etatPropose) ? brut.etatPropose : null;
  rep.genre = NOM_GENRE.hasOwnProperty(brut.genre) ? brut.genre : null;
  rep.pistes = arr(brut.pistes).slice(0, 7).map(function (p) {
    if (!p || !str(p.texte)) return null;
    var statut = ['trouve', 'pas_trouve', 'a_verifier'].indexOf(p.statut) >= 0 ? p.statut : 'a_verifier';
    var v = verifier('piste « ' + p.texte + ' »', p.ligne, p.citation);
    if (!v && statut !== 'a_verifier') { statut = 'a_verifier'; }
    var mot = str(p.mot); if (mot && mot.split(/\s+/).length > 2) mot = mot.split(/\s+/).slice(0, 2).join(' ');
    return { emoji: emo(p.emoji), mot: mot, texte: str(p.texte), statut: statut, ligne: v ? v.ligne : null, citation: v ? v.citation : null };
  }).filter(Boolean);
  var unConseil = false;
  rep.options = arr(brut.options).slice(0, 4).map(function (o) {
    if (!o || !str(o.titre)) return null;
    var v = o.source === 'notes' || o.citation ? verifier('option « ' + o.titre + ' »', o.ligne, o.citation) : null;
    var cons = o.conseille === true && !unConseil; if (cons) unConseil = true;
    var att = o.attente && typeof o.attente === 'object' ? verifier('attente « ' + o.titre + ' »', o.attente.ligne, o.attente.citation) : null;
    var qui = str(o.qui); if (qui && qui.split(/\s+/).length > 3) qui = null;
    /* « estimé » posé par la page quand SA ligne le dit, même si l'IA l'oublie */
    var est = o.estime === true || !!(v && ESTIM.test(lignes[v.ligne - 1]));
    return { emoji: emo(o.emoji), titre: str(o.titre), qui: qui, cout: str(o.cout), estime: est, attente: att, source: v ? 'notes' : 'ia', ligne: v ? v.ligne : null, citation: v ? v.citation : null, conseille: cons };
  }).filter(Boolean);
  if (brut.tache && typeof brut.tache === 'object' && str(brut.tache.titre)) {
    var vt = brut.tache.citation ? verifier('tâche', brut.tache.ligne, brut.tache.citation) : null;
    var quand = str(brut.tache.quand);
    if (quand && !lignes.some(function (l) { return normA(l).toLowerCase().indexOf(normA(quand).toLowerCase()) >= 0; })) {
      erreurs.push('date de tâche absente des notes : « ' + quand + ' » (retirée)'); quand = null;
    }
    rep.tache = { emoji: emo(brut.tache.emoji), titre: str(brut.tache.titre), quand: quand, ligne: vt ? vt.ligne : null, citation: vt ? vt.citation : null,
      option: Number.isInteger(brut.tache.option) && brut.tache.option >= 0 && brut.tache.option < (rep.options || []).length ? brut.tache.option : null };
  } else rep.tache = null;
  rep.conseil = str(brut.conseil);
  rep.resolu = brut.resolu && str(brut.resolu.question) ? { question: str(brut.resolu.question) } : null;
  rep.lectures = arr(brut.lectures).slice(0, 20).map(function (l) {
    if (!l) return null; var v = verifier('lecture', l.ligne, l.mot);
    return v ? { ligne: v.ligne, mot: v.citation, type: NOM_LECTURE.hasOwnProperty(l.type) ? l.type : 'piste' } : null;
  }).filter(Boolean);
  rep.comparaison = null;
  var cp = brut.comparaison;
  if (cp && typeof cp === 'object' && Array.isArray(cp.criteres) && Array.isArray(cp.articles)) {
    var crit = cp.criteres.map(str).filter(Boolean).slice(0, 6);
    var arts = cp.articles.slice(0, 4).map(function (a) {
      if (!a || !str(a.nom)) return null;
      var va = a.citation ? verifier('article « ' + a.nom + ' »', a.ligne, a.citation) : null;
      var vals = crit.map(function (_, k) {
        var x = Array.isArray(a.valeurs) ? a.valeurs[k] : null;
        var tx = x && typeof x === 'object' ? str(x.texte) : str(x), src = x && ['notes', 'page'].indexOf(x.source) >= 0 ? x.source : 'ia';
        var det = x && typeof x === 'object' ? str(x.detail) : null;
        if (tx && tx !== '?' && src === 'page' && textePages.indexOf(normA(tx.replace(/\s*\?$/, ''))) < 0) { fausses++; erreurs.push('valeur « ' + tx + ' » absente des pages lues (retirée)'); tx = '?'; }
        if (tx && tx !== '?' && src === 'ia' && det && !nombresConnus(det)) { erreurs.push('calcul « ' + det + ' » sur des nombres non écrits (retiré)'); tx = '?'; det = null; }
        return { texte: tx || '?', source: src, emoji: x && typeof x === 'object' ? emo(x.emoji) : '', detail: det };
      });
      return { nom: str(a.nom), ligne: va ? va.ligne : null, citation: va ? va.citation : null, valeurs: vals };
    }).filter(Boolean);
    if (crit.length && arts.length >= 2) {
      var gag = crit.map(function (_, k) { var g = Array.isArray(cp.gagnant) ? cp.gagnant[k] : null; return Number.isInteger(g) && g >= 0 && g < arts.length && arts[g].valeurs[k].texte !== '?' ? g : null; });
      rep.comparaison = { criteres: crit, articles: arts, gagnant: gag, compromis: str(cp.compromis),
        variete: arr(cp.variete).slice(0, 3).map(function (x) {
          var tx = x && str(x.texte), src = x && ['notes', 'page'].indexOf(x.source) >= 0 ? x.source : 'ia';
          if (!tx || (src === 'page' && textePages.indexOf(normA(tx)) < 0) || (src === 'notes' && texteLignes.indexOf(normA(tx)) < 0)) { if (tx) { fausses++; erreurs.push('variété « ' + tx + ' » absente (retirée)'); } return null; }
          return { texte: tx, emoji: emo(x.emoji), source: src };
        }).filter(Boolean) };
    } else if (cp.articles.length) erreurs.push('comparaison incomplète (retirée)');
  }
  rep.emoji = emo(brut.emoji);
  var ct = brut.categorie, cn = ct && typeof ct === 'object' ? str(ct.nom) : str(ct);
  rep.categorie = cn && cn.length <= 24 ? { nom: cn, sous: cn !== SANS && ct && typeof ct === 'object' && str(ct.sous) && str(ct.sous).length <= 24 ? str(ct.sous) : null } : null;
  rep.priorite = RANGP.hasOwnProperty(brut.priorite) ? brut.priorite : 'normale';
  rep.resume = str(brut.resume);
  if (rep.resume && rep.resume.split(/\s+/).length > 4) { erreurs.push('résumé trop long (coupé)'); rep.resume = rep.resume.split(/\s+/).slice(0, 4).join(' '); }
  rep.chiffres = arr(brut.chiffres).slice(0, 3).map(function (x) {
    if (!x) return null; var v = verifier('chiffre « ' + x.label + ' »', x.ligne, x.valeur);
    return v ? { emoji: emo(x.emoji), valeur: v.citation, label: str(x.label) || '', ligne: v.ligne, estime: ESTIM.test(lignes[v.ligne - 1]) } : null;
  }).filter(Boolean);
  var ec = brut.echeance, ve = ec && typeof ec === 'object' ? verifier('échéance', ec.ligne, ec.quand) : null;
  rep.echeance = ve ? { quand: ve.citation, quoi: str(ec.quoi), ligne: ve.ligne } : null;
  var pe = brut.periode, v1 = pe && typeof pe === 'object' ? verifier('période (du)', pe.ligne, pe.du) : null, v2 = v1 ? verifier('période (au)', pe.ligne, pe.au) : null;
  rep.periode = v1 && v2 ? { du: v1.citation, au: v2.citation, ligne: v1.ligne } : null;
  rep.liste = arr(brut.liste).slice(0, 10).map(function (x) {
    if (!x || !str(x.texte)) return null; var v = x.citation ? verifier('liste « ' + x.texte + ' »', x.ligne, x.citation) : null;
    return { emoji: emo(x.emoji), texte: str(x.texte), ligne: v ? v.ligne : null, citation: v ? v.citation : null };
  }).filter(Boolean);
  rep.retenir = arr(brut.retenir).slice(0, 3).map(function (x) { return cite(x, 'à retenir'); }).filter(Boolean);
  rep.manque = arr(brut.manque).slice(0, 2).map(function (x) {
    if (!x || !str(x.texte)) return null;
    if (/\d/.test(x.texte)) { erreurs.push('manque avec une valeur : « ' + x.texte + ' » (retiré)'); return null; }
    return { emoji: emo(x.emoji), texte: str(x.texte) };
  }).filter(Boolean);
  rep.attention = arr(brut.attention).slice(0, 1).map(function (x) { return cite(x, 'attention'); }).filter(Boolean);
  var rl = brut.relecture;
  rep.relecture = null;
  if (rl && typeof rl === 'object') {
    var ch = cite(rl.choix, 'relecture : choix');
    var cal = rl.calcul && str(rl.calcul.valeur) && str(rl.calcul.detail) ? { valeur: str(rl.calcul.valeur), detail: str(rl.calcul.detail) } : null;
    if (cal && !nombresConnus(cal.detail)) { erreurs.push('calcul « ' + cal.detail + ' » sur des nombres non écrits (retiré)'); cal = null; }
    if (ch) rep.relecture = { choix: ch, savais: arr(rl.savais).slice(0, 3).map(function (x) { return cite(x, 'tu savais'); }).filter(Boolean),
      fait: arr(rl.fait).slice(0, 3).map(function (x) { return cite(x, 'tu as fait'); }).filter(Boolean), calcul: cal };
  }
  return { rep: rep, erreurs: erreurs, fausses: fausses };
}
