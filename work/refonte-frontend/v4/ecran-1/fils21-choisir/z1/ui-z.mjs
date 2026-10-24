// Lot 21 · série z · les aides d'affichage du profil simulé réel (navigateur et Node) : les barres de la
// baseline (l5b) par famille, les lignes à plat, les drapeaux, la biotransformation. Elles lisent le
// format de MOTEUR.profil : { centre, haut, c (crans continus), cHaut, crans (entier du moteur), hors,
// inc (rien de simulé), hp (borne haute partielle) }.
export const UI_JS = String.raw`
var UI = (function () {
  var M = MOTEUR;
  var MINI = { citrus: 'Agrum.', tropical: 'Tropic.', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', green: 'Végét.', floral: 'Floral', herbal: 'Herb.', earthy: 'Terr.', resin: 'Résin.', spice: 'Épicé', melon: 'Melon' };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function fr(x) { return String(Math.round(x * 10) / 10).replace('.', ',').replace('-', '−'); }
  function picto(f, z, cls) { return '<svg class="pi' + (cls ? ' ' + cls : '') + '" width="' + z + '" height="' + z + '" data-famille="' + f + '" role="img" aria-label="' + M.NOM[f] + '"><use href="#p-' + f + '"/></svg>'; }
  function libelle(f, x) { return M.NOM[f] + ' : ' + (x.inc ? 'rien de simulé, non décrite par les fiches (pas une preuve d’absence)' : 'environ ' + fr(x.centre) + ' sur 100, cran ' + x.crans + (x.hors ? ', hors du style' : ', au style') + ', jusqu’à ' + fr(x.haut) + (x.hp ? ' au moins (borne haute non publiée)' : '')); }
  // Les barres, debout : 1 cran = 10 px au style (zone = 3 crans), 100 points = 46 px en absolu ; la moustache monte au haut de la plage ; ▲ au-delà de l'échelle ; + : borne haute partielle.
  function barres(p, o) {
    o = o || {};
    var H = o.H || 46, PX = 10, famil = o.familles || M.F, html = '';
    famil.forEach(function (f) {
      var x = p[f], b = M.bande(f);
      var zs = 3 * PX, za = b[1] / 100 * H;
      var hs = Math.max(0, x.c) * PX, ha = Math.max(0, x.centre) / 100 * H;
      var ws = Math.max(0, x.cHaut) * PX, wa = Math.max(0, x.haut) / 100 * H;
      var cls = 'col' + (x.hors ? ' hors' : '') + (x.inc ? ' inc' : '') + (hs > H ? ' deb' : '') + (ws > H ? ' debh' : '') + (x.hp ? ' hp' : '');
      html += '<div class="' + cls + '" data-famille="' + f + '">'
        + '<div class="pile"><i class="zone" data-role="zone" style="--zs:' + zs + 'px;--za:' + za.toFixed(1) + 'px"></i>'
        + (x.inc ? '<i class="bar inconnu" data-nature="simule" aria-label="' + libelle(f, x) + '"></i>'
          : '<i class="wh" style="--ws:' + Math.min(H, ws).toFixed(1) + 'px;--wa:' + Math.min(H, wa).toFixed(1) + 'px"></i><i class="bar" data-nature="simule" aria-label="' + libelle(f, x) + '" style="--hs:' + Math.min(hs, zs).toFixed(1) + 'px;--ha:' + Math.min(ha, za).toFixed(1) + 'px"></i>'
          + (x.hors ? '<i class="sur" data-nature="simule" style="--hs:' + Math.min(H, hs).toFixed(1) + 'px;--ha:' + Math.min(H, ha).toFixed(1) + 'px;--zs:' + zs + 'px;--za:' + za.toFixed(1) + 'px"></i>' : ''))
        + '</div>' + picto(f, o.z || 16) + (o.noms ? '<span class="col-n">' + (o.noms === 'court' ? (MINI[f] || M.COURT[f]) : M.COURT[f]) + '</span>' : '') + '</div>';
    });
    return '<div class="bars' + (o.cls ? ' ' + o.cls : '') + '" role="group" aria-label="' + (o.label || 'Profil simulé par famille, au style 16D') + '">' + html + '</div>';
  }
  // Les mêmes, à plat (picto, nom, barre, valeur) : pour les pages qui ont la place des noms.
  function lignes(p, o) {
    o = o || {};
    var W = o.W || 150, PX = W / 4.6, famil = o.familles || M.F, html = '';
    famil.forEach(function (f) {
      var x = p[f], b = M.bande(f);
      var zs = 3 * PX, za = b[1] / 100 * W, hs = Math.min(W, Math.max(0, x.c) * PX), ha = Math.min(W, x.centre / 100 * W), ws = Math.min(W, Math.max(0, x.cHaut) * PX), wa = Math.min(W, x.haut / 100 * W);
      html += '<div class="lg' + (x.hors ? ' hors' : '') + (x.inc ? ' inc' : '') + (x.hp ? ' hp' : '') + '" data-famille="' + f + '">' + picto(f, 16) + '<span class="lg-n">' + M.COURT[f] + '</span><span class="lg-p" style="width:' + W + 'px"><i class="zone" data-role="zone" style="--zs:' + zs.toFixed(1) + 'px;--za:' + za.toFixed(1) + 'px"></i>'
        + (x.inc ? '<i class="bar inconnu" data-nature="simule" aria-label="' + libelle(f, x) + '"></i>' : '<i class="wh" style="--ws:' + ws.toFixed(1) + 'px;--wa:' + wa.toFixed(1) + 'px"></i><i class="bar" data-nature="simule" aria-label="' + libelle(f, x) + '" style="--hs:' + Math.min(hs, zs).toFixed(1) + 'px;--ha:' + Math.min(ha, za).toFixed(1) + 'px"></i>' + (x.hors ? '<i class="sur" data-nature="simule" style="--hs:' + hs.toFixed(1) + 'px;--ha:' + ha.toFixed(1) + 'px;--zs:' + zs.toFixed(1) + 'px;--za:' + za.toFixed(1) + 'px"></i>' : ''))
        + '</span><span class="lg-v nb" data-nature="simule">' + (x.inc ? '?' : (pts(x).charAt(0) === '<' ? '~' : '~') + pts(x)) + '</span></div>';
    });
    return '<div class="lgs" role="group" aria-label="' + (o.label || 'Profil simulé par famille') + '">' + html + '</div>';
  }
  function liste(fs) { var l = fs.map(function (f) { return M.COURT[f].toLowerCase(); }); return l.length > 1 ? l.slice(0, -1).join(', ') + ' et ' + l[l.length - 1] : l.join(''); }
  function horsTexte(p) { var h = M.horsStyle(p); return h.length ? liste(h) : ''; }
  function top(p, n, sansResin) { return M.F.filter(function (f) { return !p[f].inc && !(sansResin && f === 'resin'); }).sort(function (a, b) { return p[b].centre - p[a].centre; }).slice(0, n || 3); }
  function drapeauxHTML(ids, o) {
    o = o || {};
    var ds = M.drapeauxLisibles(ids).filter(function (d) { return !o.sans || o.sans.indexOf(d.id) < 0; });
    return ds.map(function (d) { return '<li class="dp" data-drapeau="' + d.id + '"><b>' + (d.id === 'geraniol-citronellol' ? picto('floral', 13) + ' ' : '') + esc(d.titre) + (d.id === 'hors-du-style' && o.hors && o.hors.length ? ' : ' + esc(liste(o.hors)) : '') + '</b><span>' + esc(d.sens) + '</span><small data-nature="mesure" data-source="' + esc(d.src) + '">' + esc(d.src) + '</small></li>'; }).join('');
  }
  function bioHTML(lev, moment, res) {
    var b = M.BIO[lev] || M.BIO['US-05'], actif = moment === 'dryActive', dispo = res && res.profil;
    var extra = '';
    if (res && res.bio && res.bio.par) res.bio.par.forEach(function (x) { if (x.cit != null) extra += ' · citronellol ' + esc(x.ajout) + ' ~' + fr(x.cit) + ' µg/L (jusqu’à ' + fr(x.citH) + ')'; if (x.th != null) extra += ' · thiols libérés ' + esc(x.ajout) + ' ~' + fr(x.th) + ' ng/L (jusqu’à ' + fr(x.thH) + ')'; });
    var mot = esc(b.mot).replace('géraniol → citronellol', picto('floral', 13) + 'géraniol → ' + picto('citrus', 13) + 'citronellol').replace('thiols libérés', picto('tropical', 13) + 'thiols libérés');
    return '<span class="bio" data-role="biotransformation" data-nature="simule"><span class="tilde">~</span> biotransformation ' + esc(lev) + ' : ' + (actif ? mot + extra : '<i>dry hop actif seulement</i> ; ' + mot) + (dispo ? '' : ' <i>(non simulé pour cet agencement)</i>') + '</span>';
  }
  function confianceHTML(res) { if (!res || !res.profil) return ''; var c = res.confiance || ''; return '<span class="conf conf-' + esc(c) + '">confiance ' + esc(c) + '</span>'; }
  function ibuHTML(ibu) { if (!ibu) return ''; var pl = Math.round(ibu.min) !== Math.round(ibu.max) ? ' <small>' + Math.round(ibu.min) + '–' + Math.round(ibu.max) + '</small>' : ''; return '<span class="ibu" data-nature="simule" aria-label="amertume simulée ' + fr(ibu.central) + ' IBU' + (pl ? ', de ' + fr(ibu.min) + ' à ' + fr(ibu.max) : '') + '"><span class="tilde">~</span> ' + Math.round(ibu.central) + ' IBU' + pl + '</span>'; }
  function pts(x) { return x.inc ? '?' : (x.centre < 1 && x.haut > 1 ? '<1' : String(Math.round(x.centre))); }
  function nonSimule(raison) { return '<p class="non-sim" data-nature="simule"><span class="tilde">~</span> non simulé : ' + esc(raison) + '</p>'; }
  return { esc: esc, fr: fr, pts: pts, picto: picto, barres: barres, lignes: lignes, liste: liste, horsTexte: horsTexte, top: top, drapeauxHTML: drapeauxHTML, bioHTML: bioHTML, confianceHTML: confianceHTML, ibuHTML: ibuHTML, nonSimule: nonSimule };
})();
`;
