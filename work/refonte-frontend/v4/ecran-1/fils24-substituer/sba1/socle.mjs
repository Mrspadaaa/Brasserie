// Socle de la série sba (lot D125, Substituer, « le geste d'abord ») : le VOCABULAIRE de la baseline, pas un gabarit.
// Chaque concept compose sa page lui-même ; le socle ne donne que les pièces : pictos de famille au trait (planche
// fils17-standard/v3, épicé = cannelle et clou croisés), couleurs des familles, croix, lentille au style / absolu,
// légende derrière un « ? », fiche de chaque houblon à l'appui long (ou au survol long), barres l5b au style (zone,
// rond « ma bière », inconnu hachuré), jauge d'IBU de la stout, badge de stock, pied Annuler / Remplacer ›.
// Données : donnees/donnees.json (moteur v4 : substitutes() de Nugget 46 g dans la stout S1 ; fiches ; grille simulée).
// Classes du socle préfixées « sb- » ; chaque concept préfixe les siennes (« sba3- »…). Assemblage par concaténation
// et split/join, jamais String.replace (L26).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const ECRAN = path.resolve(ici, '../..');
const planche = fs.readFileSync(path.join(ECRAN, 'fils17-standard/v3/planche.html'), 'utf8');
const s0 = planche.lastIndexOf('<svg', planche.indexOf('<symbol id="p-floral"'));
export const SYMBOLES = planche.slice(s0, planche.indexOf('</svg>', s0) + 6);
if (!SYMBOLES.includes('id="p-spice"') || !SYMBOLES.includes('rotate(40 12 14)')) throw new Error('épicé de la planche introuvable');
export const DONNEES = JSON.parse(fs.readFileSync(path.join(ici, 'donnees/donnees.json'), 'utf8'));

// Une couleur par houblon, la même sur les huit pages (D83). Jamais l'orangé d'alerte.
const PALETTE = ['#4b4b55', '#009E73', '#CC79A7', '#0072B2', '#e80030', '#56B4E9', '#7b3294', '#8a6bbf', '#1b9e9e', '#a6761d', '#66a61e', '#e7298a', '#3b5bdb', '#b8860b', '#c51b7d', '#5e3c99', '#8c510a', '#bcbd22', '#17becf', '#4daf4a'];
const ORDRE_H = ['beermaverick-nugget', 'beermaverick-nelson-sauvin', 'beermaverick-galaxy', 'beermaverick-magnat', 'beermaverick-idaho-7', 'beermaverick-sabro'];
const cles = Object.keys(DONNEES.houblons).sort((a, b) => (ORDRE_H.indexOf(a) + 1 || 99) - (ORDRE_H.indexOf(b) + 1 || 99) || a.localeCompare(b));
DONNEES.couleurs = Object.fromEntries(cles.map((k, i) => [k, PALETTE[i]]));

export const CSS_SOCLE = `
:root { --encre:#16161a; --gris:#55555f; --trait:#e3e5eb; --mur:#f4f5f7; --acc:#c2410c; --sans:"Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif; --mono:"IBM Plex Mono",ui-monospace,Consolas,monospace; }
[hidden] { display:none !important; }
* { box-sizing:border-box; margin:0; padding:0; }
html, body { background:#fff; }
body { color:var(--encre); font:400 14px/1.25 var(--sans); -webkit-tap-highlight-color:transparent; overflow-x:hidden; }
button { font:inherit; color:inherit; background:none; border:0; cursor:pointer; }
button:focus-visible, [tabindex]:focus-visible, a:focus-visible { outline:2px solid var(--encre); outline-offset:2px; }
svg { display:block; flex:none; }
.num { font-family:var(--mono); font-variant-numeric:tabular-nums; }
.sb-page { max-width:390px; margin:0 auto; position:relative; min-height:100vh; }
.sb-x { width:44px; height:44px; border-radius:50%; border:1px solid var(--trait); background:#fff; display:inline-flex; align-items:center; justify-content:center; flex:none; }
.sb-pt { width:10px; height:10px; border-radius:50%; display:inline-block; flex:none; }
.sb-pi { width:16px; height:16px; }
.sb-us { font-size:12px; font-weight:600; color:var(--gris); }
.sb-stk { display:inline-flex; align-items:center; gap:2px; font-size:12px; color:var(--gris); white-space:nowrap; }
.sb-stk.sb-manque { color:var(--acc); }
.sb-aide { width:26px; height:26px; border-radius:50%; border:1px solid #c9cad2; background:#fff; font-weight:700; color:var(--gris); flex:none; }
.sb-leg { position:absolute; z-index:30; background:#fff; border:1px solid #c9cad2; border-radius:8px; padding:8px 10px; font-size:13px; display:flex; flex-direction:column; gap:4px; width:290px; box-shadow:0 8px 24px -12px rgba(22,22,26,.4); }
.sb-seg { display:inline-flex; background:#eceef2; border-radius:15px; padding:2px; }
.sb-seg button { height:26px; padding:0 10px; border-radius:13px; font-size:13px; color:var(--gris); }
.sb-seg button[aria-checked="true"] { background:var(--encre); color:#fff; font-weight:600; }
.sb-ba { display:grid; grid-template-columns:92px 1fr 40px; align-items:center; gap:6px; font-size:13px; min-height:18px; }
.sb-ba-n { display:flex; align-items:center; gap:4px; white-space:nowrap; }
.sb-ba-n.sb-att { font-weight:700; }
.sb-ba-v { text-align:right; font-size:12px; }
.sb-piste { position:relative; height:12px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.sb-piste i { position:absolute; top:0; bottom:0; left:0; display:block; }
.sb-piste .sb-zone { width:var(--ws); background:#d9dce3; }
.sb-piste .sb-rem { width:var(--ws); height:6px; top:3px; border-radius:2px; transition:width .2s cubic-bezier(.2,.8,.2,1); }
.sb-piste .sb-av { left:clamp(5px, var(--ws), calc(100% - 5px)); width:10px; height:10px; top:1px; border-radius:50%; border:2px solid var(--encre); background:#fff; margin-left:-5px; }
.sb-piste .sb-hach { right:0; background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
body.abs .sb-piste .sb-zone, body.abs .sb-piste .sb-rem { width:var(--wa); }
body.abs .sb-piste .sb-av { left:clamp(5px, var(--wa), calc(100% - 5px)); }
.sb-j { position:relative; height:12px; background:#f1f2f5; border-radius:2px; }
.sb-j i { position:absolute; top:0; bottom:0; display:block; border-radius:2px; }
.sb-j .sb-jz { background:#d9dce3; }
.sb-j .sb-jv { background:var(--encre); transition:left .2s, width .2s; min-width:3px; }
.sb-j .sb-jv.sb-h { background:var(--acc); }
.sb-pied { display:flex; flex-direction:column; gap:6px; }
.sb-pied-l { font-size:14px; color:var(--gris); }
.sb-pied-l b { color:var(--encre); }
.sb-pied-b { display:flex; gap:8px; }
.sb-ann { height:44px; padding:0 18px; border-radius:22px; background:#dcdfe5; font-weight:600; }
.sb-rem-b { flex:1; height:44px; border-radius:22px; background:var(--encre); color:#fff; font-weight:700; }
.sb-rem-b[aria-disabled="true"] { background:#dcdfe5; color:#45454d; }
/* La fiche (appui long ou survol long sur un houblon). */
#sb-fiche { position:relative; z-index:40; }
.fi-voile { position:fixed; inset:0; background:rgba(22,22,26,.32); }
.fi { position:fixed; left:0; right:0; bottom:0; max-height:88vh; overflow-y:auto; background:#fff; border-radius:24px 24px 0 0; box-shadow:0 -12px 40px -16px rgba(22,22,26,.6); padding:10px 12px 14px; display:flex; flex-direction:column; gap:6px; max-width:390px; margin:0 auto; }
.mode-bulle .fi { left:calc(50% + 211px); right:auto; bottom:auto; top:16px; width:360px; border-radius:8px; margin:0; border:1px solid var(--trait); }
@media (max-width:1000px) { .mode-bulle .fi { left:auto; right:16px; } }
.fi-t { display:flex; align-items:center; gap:8px; min-height:44px; }
.fi-t h2 { font-size:17px; font-weight:700; }
.fi-t .sb-x { margin-left:auto; }
.fi-w { background:var(--mur); border-radius:8px; padding:8px 10px; font-size:13px; }
.fi-ar { display:flex; flex-wrap:wrap; gap:4px 12px; align-items:center; }
.fi-l { display:inline-flex; align-items:center; gap:4px; }
.fi-src { flex-basis:100%; font-size:12px; color:var(--gris); }
.fi-r { display:flex; justify-content:center; }
.fi-g { display:inline-flex; gap:2px; background:#fff; border-radius:15px; padding:2px; border:1px solid var(--trait); align-self:flex-start; }
.fi-g button { width:30px; height:30px; border-radius:15px; display:inline-flex; align-items:center; justify-content:center; color:var(--gris); }
.fi-g button[aria-pressed="true"] { background:var(--encre); color:#fff; }
`;

// Le code client commun : il expose window.S aux concepts.
function socleClient() {
  var D = window.SB_DATA, H = D.houblons, C = D.couleurs;
  var NOM = { floral: 'Floral', herbal: 'Herbacé', earthy: 'Terreux', citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', resin: 'Résineux', spice: 'Épicé', green: 'Végétal' };
  var ORDRE = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'];
  var ATT = { floral: 1, herbal: 1, earthy: 1 };
  var NUG = 'beermaverick-nugget';
  var q = location.search;
  var mq = q.match(/moment=(b60|wp|dryPost)/), m = mq ? mq[1] : 'b60';
  var M = D.moments[m];
  var MOM = { b60: 'à 60′', wp: 'au whirlpool', dryPost: 'à froid' };
  var vu = {}, cands = [];
  M.top.concat(M.stock).forEach(function (s) { if (!vu[s.key]) { vu[s.key] = 1; cands.push(s); } });
  function cand(k) { for (var i = 0; i < cands.length; i++) if (cands[i].key === k) return cands[i]; return null; }
  function fr(x, d) { return (d == null ? String(x) : (+x).toFixed(d)).split('.').join(','); }
  function g1(x) { return fr(Math.round(x * 10) / 10); }
  function pi(f, s) { s = s || 16; return '<svg class="sb-pi" width="' + s + '" height="' + s + '" style="width:' + s + 'px;height:' + s + 'px" data-famille="' + f + '" role="img" aria-label="' + NOM[f] + '"><use href="#p-' + f + '"/></svg>'; }
  function usage(k) { var r = H[k].role; return r === 'amérisant' ? 'amer' : r === 'aromatique' ? 'arôme' : 'mixte'; }
  function usageHtml(k) { return '<span class="sb-us" data-role="usage" data-usage="' + (H[k].role || '') + '">' + usage(k) + '</span>'; }
  function alpha(k) { var a = H[k].alpha; if (!a) return 'α ?'; return a.lot ? 'α ' + fr(a.v) + ' %' : 'α ' + fr(a.min) + '–' + fr(a.max) + ' %'; }
  function plage(k) { var p = H[k].plage; return p ? fr(p[0]) + '–' + fr(p[1]) : '?'; }
  function alphaHtml(k) { var a = H[k].alpha; return '<span class="num" data-role="alpha" data-source="' + (a && a.lot ? 'lot' : 'fiches') + '" data-houblon-alpha="' + H[k].name + '">' + alpha(k) + '</span>'; }
  function pt(k, s) { s = s || 10; return '<i class="sb-pt" style="background:' + C[k] + ';width:' + s + 'px;height:' + s + 'px" data-couleur="' + C[k] + '" data-serie="' + H[k].name + '"></i>'; }
  // Le stock en petit badge : une boîte cochée (assez), une boîte au trait orangé (pas assez), un chariot (à acheter).
  var IC = {
    ok: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="en stock"><path d="M12 22V12"/><path d="m16 17 2 2 4-4"/><path d="M21 11.1V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l1.3-.8"/><path d="M3.3 7 12 12l8.7-5"/></svg>',
    peu: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="stock insuffisant"><path d="M12 22V12"/><path d="M16 18h6"/><path d="M21 11.1V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l1.3-.8"/><path d="M3.3 7 12 12l8.7-5"/></svg>',
    achat: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="à acheter"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h3l2.7 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>',
    x: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>'
  };
  function etat(s) { return !s || s.stock.etat !== 'en stock' ? 'achat' : s.stock.suffisant ? 'ok' : 'peu'; }
  function stock(s, mot) {
    var e = etat(s), t = e === 'ok' ? 'reste ' + g1(s.stock.libre - s.dose.g) + ' g' : e === 'peu' ? 'manque ' + g1(s.dose.g - s.stock.libre) + ' g' : 'à acheter';
    return '<span class="sb-stk' + (e === 'peu' ? ' sb-manque' : '') + '">' + IC[e] + (mot ? '<span>' + t + '</span>' : '') + '</span>';
  }
  function stockMot(s) { var e = etat(s); return e === 'ok' ? 'reste ' + g1(s.stock.libre - s.dose.g) + ' g' : e === 'peu' ? 'manque ' + g1(s.dose.g - s.stock.libre) + ' g' : 'à acheter'; }
  // Score : un point si tout est connu ; une plage si une composante manque (elle peut valoir de 0 à 100), comme u4.
  function score(s) {
    var w = M.poids, c = s.comp, lo = 0, hi = 0, t = 0;
    [['arome', w.arome], ['huiles', w.huiles], ['amertume', w.amertume]].forEach(function (p) { t += p[1]; if (c[p[0]] == null) { hi += p[1] * 100; } else { lo += p[1] * c[p[0]]; hi += p[1] * c[p[0]]; } });
    return [Math.round(lo / t), Math.round(hi / t)];
  }
  function scoreTxt(s) { var r = score(s); return r[0] === r[1] ? String(r[0]) : r[0] + '–' + r[1]; }
  // IBU de la stout avec le remplaçant à la dose « même IBU » : exact si l'α est celui du lot, une plage sinon.
  function ibu(s) {
    var i0 = M.ref.ibu; if (!s || i0 == null) return i0 == null ? null : [i0, i0];
    var a = H[s.key].alpha; if (!a) return null;
    return a.lot ? [i0, i0] : [i0 * a.min / a.v, i0 * a.max / a.v];
  }
  function ibuTxt(s) { var r = ibu(s); if (!r) return 'aucun IBU'; var a = Math.round(r[0]), b = Math.round(r[1]); return a === b ? '~' + a + ' IBU' : '~' + a + '–' + b + ' IBU'; }
  function dose(s) { return s.dose.min === s.dose.max ? g1(s.dose.g) + ' g' : g1(s.dose.g) + ' g'; }
  function dosePlage(s) { return s.dose.min === s.dose.max ? '' : g1(s.dose.min) + '–' + g1(s.dose.max) + ' g'; }
  // Ma bière, au style : la grille simulée du lot 21 (2 g/L, US-05) pour les houblons qu'elle couvre ; sinon inconnu.
  function apres(s, f) { if (!s) return D.AV[f]; var x = D.sim[s.key] && D.sim[s.key][m]; return x ? D.AV[f] + x.d[f] : null; }
  function w(x, f, mode) { return (mode === 's' ? Math.min(100, x / D.B[f] / 2 * 100) : Math.min(100, x / 110 * 100)).toFixed(1) + '%'; }
  function ecart(s, f) { var a = apres(s, f); if (a == null) return '?'; var d = a - D.AV[f]; return Math.abs(d) < 0.5 ? '~0' : '~' + (d > 0 ? '+' : '−') + Math.abs(Math.round(d)); }
  function barres(el, fams, pref) {
    pref = pref || 'sb';
    el.innerHTML = fams.map(function (f) {
      return '<div class="sb-ba" data-f="' + f + '"><span class="sb-ba-n' + (ATT[f] ? ' sb-att' : '') + '">' + pi(f) + '<span>' + NOM[f] + '</span></span>'
        + '<span class="sb-piste"><i class="sb-zone" data-role="zone" style="--ws:50%;--wa:' + (D.B[f] / 110 * 100).toFixed(1) + '%"></i><i class="sb-rem" style="background:' + D.BA[f] + '"></i>'
        + '<i class="sb-av" style="--ws:' + w(D.AV[f], f, 's') + ';--wa:' + w(D.AV[f], f, 'a') + '"></i><i class="sb-hach"></i></span><span class="sb-ba-v num"></span></div>';
    }).join('');
    return function (s) {
      el.querySelectorAll('[data-f]').forEach(function (r) {
        var f = r.dataset.f, a = apres(s, f), rem = r.querySelector('.sb-rem'), h = r.querySelector('.sb-hach'), v = r.querySelector('.sb-ba-v'), u = a == null;
        rem.hidden = u; h.hidden = !u;
        if (!u) { rem.style.setProperty('--ws', w(a, f, 's')); rem.style.setProperty('--wa', w(a, f, 'a')); }
        v.textContent = s ? ecart(s, f) : ''; v.style.color = u ? '#55555f' : (a > D.B[f] ? '#c2410c' : D.T[f]);
      });
    };
  }
  // Jauge d'IBU de la stout : bande du style 50–70, la valeur (ou sa plage) en noir, orangé hors du style.
  function jauge(el) {
    var S = 100, pc = function (x) { return (Math.max(0, Math.min(S, x)) / S * 100).toFixed(1) + '%'; };
    el.classList.add('sb-j'); el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<i class="sb-jz" style="left:' + pc(50) + ';width:' + pc(20) + '"></i><i class="sb-jv"></i>';
    var v = el.querySelector('.sb-jv');
    return function (s) {
      var r = ibu(s) || [0, 0]; v.style.left = pc(r[0]); v.style.width = 'calc(' + pc(r[1] - r[0]) + ' + 3px)';
      v.classList.toggle('sb-h', r[0] < 50 || r[1] > 70);
    };
  }
  function gp(s, sorte, n) {
    var l = (sorte === 'perd' ? s.perd : s.gagne).filter(function (x) { return sorte === 'perd' ? x.a === 0 : x.de === 0; }).slice(0, n || 6);
    return l.map(function (x) { return pi(x.family, 14); }).join('');
  }
  // ----- la fiche du houblon, dans le langage de la page (α du lot puis ses fiches, familles N/M, mots hors familles, silhouette)
  function radar(k) {
    var h = H[k], R = 70, c = 90, pts = [], sect = '', ic = '';
    ORDRE.forEach(function (f, i) {
      var a = -Math.PI / 2 + i * Math.PI * 2 / 12, l = h.familles[f][0], r = l === 0 ? 4 : R * l / 2;
      pts.push((c + r * Math.cos(a)).toFixed(1) + ',' + (c + r * Math.sin(a)).toFixed(1));
      if (l === 0) { var a0 = a - Math.PI / 12, a1 = a + Math.PI / 12; sect += '<path d="M' + c + ' ' + c + 'L' + (c + R * Math.cos(a0)).toFixed(1) + ' ' + (c + R * Math.sin(a0)).toFixed(1) + 'A' + R + ' ' + R + ' 0 0 1 ' + (c + R * Math.cos(a1)).toFixed(1) + ' ' + (c + R * Math.sin(a1)).toFixed(1) + 'Z" fill="url(#sb-hachure)"/>'; }
      ic += '<svg x="' + (c + (R + 11) * Math.cos(a) - 7).toFixed(1) + '" y="' + (c + (R + 11) * Math.sin(a) - 7).toFixed(1) + '" width="14" height="14" data-famille="' + f + '" role="img" aria-label="' + NOM[f] + '"><use href="#p-' + f + '"/></svg>';
    });
    return '<svg width="180" height="180" viewBox="0 0 180 180" data-radar data-objet="fiche" role="img" aria-label="Silhouette de ' + h.name + ' selon ses fiches">'
      + '<defs><pattern id="sb-hachure" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V5" stroke="#c9cdd6" stroke-width="2"/></pattern></defs>'
      + '<circle cx="90" cy="90" r="70" fill="none" stroke="#e3e5eb"/><circle cx="90" cy="90" r="35" fill="none" stroke="#e3e5eb"/>' + sect
      + '<polygon points="' + pts.join(' ') + '" fill="' + C[k] + '" fill-opacity=".18" stroke="' + C[k] + '" stroke-width="2"/>' + ic + '</svg>';
  }
  function ficheHtml(k, bulle) {
    var h = H[k], a = h.alpha, s = cand(k) || (k === NUG ? null : null);
    var cites = ORDRE.filter(function (f) { return h.familles[f][0] > 0; });
    var of = h.familles.floral[2];
    var arom = cites.map(function (f) { return '<span class="fi-l">' + pi(f, 14) + '<b style="color:' + D.T[f] + '">' + NOM[f] + '</b> <span class="num">' + h.familles[f][1] + '/' + of + '</span></span>'; }).join('');
    var sans = h.sans.length ? '<span class="fi-src">hors familles : ' + h.sans.slice(0, 4).join(', ') + '</span>' : '';
    return (bulle ? '' : '<div class="fi-voile" data-k="voile" aria-hidden="true"></div>')
      + '<section class="fi" data-role="fiche" role="dialog" tabindex="-1" aria-label="Fiche de ' + h.name + '">'
      + '<header class="fi-t">' + pt(k, 12) + '<h2>' + h.name + '</h2>' + usageHtml(k) + (k === NUG ? '<span class="sb-stk sb-manque">' + IC.peu + '<span>épuisé</span></span>' : (s ? stock(s, false) : ''))
      + '<button class="sb-x" data-role="fermer-fiche" data-k="fermer" aria-label="Fermer la fiche de ' + h.name + '">' + IC.x + '</button></header>'
      + '<p class="fi-w" data-role="fiche-alpha"><b class="num">' + (a ? (a.lot ? 'α ' + fr(a.v) + ' %' : 'α ' + fr(a.min) + '–' + fr(a.max) + ' %') : 'α ?') + '</b> ' + (a && a.lot ? 'ton lot' : 'sans lot') + ' · <span class="num">' + plage(k) + ' %</span> ses fiches</p>'
      + '<div class="fi-w fi-ar" data-role="fiche-arome">' + (arom || '<span>aucune famille citée</span>') + '<span class="fi-src">' + of + ' fiches lues · hachuré : non décrit, pas zéro</span>' + sans + '</div>'
      + '<div class="fi-r">' + radar(k) + '</div>'
      + '<span class="fi-g" role="group" data-role="gout" aria-label="Mon goût pour ' + h.name + '"><button data-k="aimer" aria-pressed="false" aria-label="Aimer ' + h.name + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.57" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/></svg></button><button data-k="exclure" aria-pressed="false" aria-label="Exclure ' + h.name + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.57" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/></svg></button></span>'
      + '</section>';
  }
  // ----- lentille, légende, fiche, choix
  var lecteurs = [], choixFn = [], courant = null;
  document.querySelectorAll('[data-e]').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('[data-e]').forEach(function (x) { x.setAttribute('aria-checked', String(x.dataset.e === b.dataset.e)); });
      document.body.classList.toggle('abs', b.dataset.e === 'absolu'); lecteurs.forEach(function (f) { f(); });
    });
  });
  function fermerLegendes() { document.querySelectorAll('[data-role=legende]').forEach(function (l) { l.hidden = true; }); document.querySelectorAll('[data-role=legende-bouton]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); }); }
  document.querySelectorAll('[data-role=legende-bouton]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.stopPropagation(); var l = document.getElementById(b.getAttribute('aria-controls')); l.hidden = !l.hidden; b.setAttribute('aria-expanded', String(!l.hidden)); });
  });
  var R = document.getElementById('sb-fiche'), ouverte = false, appui = null, avale = 0, survol = null, tFerme = null;
  function ouvrir(k, mode) { R.className = 'mode-' + mode; R.innerHTML = ficheHtml(k, mode === 'bulle'); ouverte = true; }
  function fermer() { R.innerHTML = ''; ouverte = false; }
  R.addEventListener('click', function (e) {
    var b = e.target.closest('[data-k]'); if (!b) return;
    if (b.dataset.k === 'fermer' || b.dataset.k === 'voile') { e.stopPropagation(); fermer(); return; }
    if (b.dataset.k === 'aimer' || b.dataset.k === 'exclure') b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
  });
  document.addEventListener('click', function (e) { if (performance.now() < avale) { e.stopPropagation(); e.preventDefault(); } }, true);
  function cleDe(t) { var h = t.closest && t.closest('[data-houblon],[data-fiche-de]'); return h ? (h.dataset.houblon || h.dataset.ficheDe) : null; }
  document.addEventListener('pointerdown', function (e) {
    if (R.contains(e.target)) return;
    var k = cleDe(e.target); if (!k || !H[k]) return;
    var a = { x: e.clientX, y: e.clientY, id: e.pointerId };
    appui = a; a.t = setTimeout(function () { if (appui !== a) return; appui = null; avale = performance.now() + 600; document.dispatchEvent(new CustomEvent('sb-appui')); ouvrir(k, e.pointerType === 'mouse' || innerWidth >= 700 ? 'bulle' : 'feuille'); }, 500);
  }, true);
  document.addEventListener('pointermove', function (e) { if (appui && e.pointerId === appui.id && Math.hypot(e.clientX - appui.x, e.clientY - appui.y) > 10) { clearTimeout(appui.t); appui = null; } }, true);
  document.addEventListener('pointerup', function () { if (appui) { clearTimeout(appui.t); appui = null; } }, true);
  document.addEventListener('pointercancel', function () { if (appui) { clearTimeout(appui.t); appui = null; } }, true);
  document.addEventListener('contextmenu', function (e) { if (cleDe(e.target)) e.preventDefault(); });
  document.addEventListener('pointerover', function (e) {
    if (e.pointerType !== 'mouse') return;
    if (R.contains(e.target)) { clearTimeout(tFerme); return; }
    var k = cleDe(e.target); if (!k || !H[k] || survol) return;
    survol = setTimeout(function () { survol = null; if (!ouverte) ouvrir(k, 'bulle'); }, 750);
  });
  document.addEventListener('pointerout', function (e) {
    if (e.pointerType !== 'mouse') return;
    var vers = e.relatedTarget, h = e.target.closest && e.target.closest('[data-houblon],[data-fiche-de]');
    if (h && !(vers && h.contains(vers))) { clearTimeout(survol); survol = null; }
    if (ouverte && R.className === 'mode-bulle' && !(vers && (R.contains(vers) || cleDe(vers)))) { clearTimeout(tFerme); tFerme = setTimeout(fermer, 650); }
  });
  addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; fermerLegendes(); if (ouverte) fermer(); });
  document.addEventListener('click', function (e) { var l = document.querySelector('[data-role=legende]:not([hidden])'); if (l && !l.contains(e.target)) fermerLegendes(); });
  function choisir(k) { courant = k ? cand(k) : null; choixFn.forEach(function (f) { f(courant); }); }
  // Le pied : la ligne de recette, Annuler (la recette reste inchangée) et Remplacer ›.
  function pied(el) {
    el.classList.add('sb-pied');
    el.innerHTML = '<p class="sb-pied-l" data-role="ligne-recette"></p><div class="sb-pied-b"><button type="button" class="sb-ann" data-role="annuler">Annuler</button><button type="button" class="sb-rem-b" data-role="remplacer">Remplacer ›</button></div>';
    var l = el.querySelector('.sb-pied-l'), b = el.querySelector('.sb-rem-b');
    el.querySelector('.sb-ann').addEventListener('click', function () { choisir(null); });
    b.addEventListener('click', function () { if (courant) l.innerHTML = '<b>Recette : ' + dose(courant) + ' de ' + H[courant.key].name + ' ' + MOM[m] + '</b> ✓'; });
    return function (s) {
      b.setAttribute('aria-disabled', String(!s));
      l.innerHTML = s ? '46 g de Nugget → <b>' + dose(s) + ' de ' + H[s.key].name + '</b>' : 'Nugget 46 g ' + MOM[m] + ' · recette inchangée';
    };
  }
  if (/legende=1/.test(q)) setTimeout(function () { var b = document.querySelector('[data-role=legende-bouton]'); if (b) b.click(); }, 50);
  if (/abs=1/.test(q)) setTimeout(function () { var b = document.querySelector('[data-e=absolu]'); if (b) b.click(); }, 50);
  var fq = q.match(/fiche=([a-z0-9-]+)/); if (fq) setTimeout(function () { ouvrir(fq[1], 'feuille'); }, 60);
  var cq = q.match(/choix=([a-z0-9-]+)/);
  window.S = { D: D, H: H, C: C, M: M, m: m, MOM: MOM, NUG: NUG, cands: cands, cand: cand, NOM: NOM, ORDRE: ORDRE, ATT: ATT, fr: fr, g1: g1, pi: pi, pt: pt, usage: usage, usageHtml: usageHtml,
    alpha: alpha, alphaHtml: alphaHtml, plage: plage, stock: stock, stockMot: stockMot, etat: etat, IC: IC, score: score, scoreTxt: scoreTxt, ibu: ibu, ibuTxt: ibuTxt, dose: dose, dosePlage: dosePlage,
    apres: apres, ecart: ecart, barres: barres, jauge: jauge, gp: gp, pied: pied, choisir: choisir, surChoix: function (f) { choixFn.push(f); }, surLecture: function (f) { lecteurs.push(f); },
    courant: function () { return courant; }, depart: cq ? cq[1] : null, ouvrirFiche: ouvrir };
}

const esc = (s) => s.split('&').join('&amp;').split('<').join('&lt;');

// Pièces HTML que les concepts placent où ils veulent (aucune n'impose une place, sauf la croix, en haut à gauche, D109).
export const CROIX = '<a class="sb-x" href="../../base/consolide/index.html" aria-label="Fermer Substituer" data-role="fermer"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></a>';
export const lentille = (id) => '<span class="sb-seg" data-lecture role="radiogroup" aria-label="lecture au style ou absolu"><button type="button" role="radio" aria-checked="true" data-e="style">Au style</button><button type="button" role="radio" aria-checked="false" data-e="absolu">Absolu</button></span>';
export const aide = (id, lignes, pos) => '<button type="button" class="sb-aide" data-role="legende-bouton" aria-expanded="false" aria-controls="leg-' + id + '" aria-label="Lire la légende">?</button>'
  + '<div class="sb-leg" id="leg-' + id + '" data-role="legende" style="' + (pos || 'top:96px;left:12px') + '" hidden>' + lignes.map((l) => '<span>' + l + '</span>').join('') + '</div>';

// Une page de concept. c : { id, nom, chaleur, css, corps, script (fonction) }
export function page(c) {
  return '<!doctype html>\n<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n'
    + '<title>' + esc(c.id + ' · ' + c.nom) + '</title>\n<style>' + CSS_SOCLE + c.css + '</style></head>\n<body class="' + c.id + '">\n'
    + SYMBOLES + '\n<main class="sb-page ' + c.id + '-page">\n' + c.corps + '\n</main>\n<div id="sb-fiche"></div>\n'
    + '<script>window.SB_DATA = ' + JSON.stringify(DONNEES).split('</').join('<\\/') + ';\n(' + socleClient.toString() + ')();\n(' + c.script.toString() + ')();\n</script>\n</body></html>\n';
}
