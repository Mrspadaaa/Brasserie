// Lot 21 · z2 « Les deux verres » : deux verres côte à côte, à DOSE ÉGALE, au même moment. Au-dessus de
// chacun, le « faux profil aromatique » dessiné comme un nuage : un picto de famille par arôme, d'autant
// plus grand que la famille est forte (simulé, ~, profil réel du moteur) ; une famille sans rien de simulé
// porte un « ? ». Un curseur de moment (60′ → 10′ → whirlpool → dry hop actif → dry hop après) fait
// grandir ou fondre les deux nuages d'un coup, et l'amertume simulée (IBU) apparaît à chaud : « Pourquoi
// à 10′ pas à 60′ ? » se voit. « Ensemble » : les deux dans un seul verre (2 + 2 g/L, 3 j, la seule paire
// simulée), avec ce que chacun apporte et la saturation partagée. Sous les verres, les vraies valeurs qui
// font l'écart (α, huile, 4MMP et linalol au seuil, mesures en bière) et les trous.
// Usage : node generateur-z2.mjs  →  z2/etat.html
import * as Z from '../z1/socle-z.mjs';
const { esc, ico, alphaHTML, huileHTML, ligneRapport, faitsHTML, HOUBLONS, COUL, USAGE, MOTEUR } = Z;
const ICI = Z.D21 + '/z2';
const PAIRES = [['Citra', 'Cascade'], ['Citra', 'Galaxy'], ['Citra', 'Idaho 7'], ['Galaxy', 'Idaho 7']];
const VERRE = `<svg class="verre-svg" viewBox="0 0 80 96" width="60" height="72" aria-hidden="true"><path d="M14 4h52l-5 70a10 10 0 0 1-10 9H29a10 10 0 0 1-10-9z" fill="#fff" stroke="#8a909b" stroke-width="1.5"/><path d="M18 30h44l-3.6 44a7 7 0 0 1-7 6H28.6a7 7 0 0 1-7-6z" fill="#2a1a12"/><path d="M17.5 22h45l-.6 9h-43.8z" fill="#f0e6d2"/></svg>`;

const corps = `
<header class="barre">
  <h1 id="titre">Citra ou Cascade ?</h1>
  ${Z.LENTILLE}
  ${Z.legendeHTML([
    '<b>Le nuage</b> au-dessus d’un verre : un picto par famille d’arôme, d’autant plus grand que la famille est forte dans la bière simulée ; un point orangé à côté : la famille dépasse le style 16D. « ? » : rien de simulé pour cette famille (pas une preuve d’absence).',
    '<b>À dose égale</b> : les deux verres reçoivent la même dose, au même moment, les mêmes jours ; les curseurs s’aimantent sur la grille du moteur (1, 2, 4, 8 g/L ; 1, 2, 3, 5, 7 j). Ce qui diffère vient du houblon seul.',
    '<b>Le curseur du moment</b> : 60′, 10′, whirlpool, dry hop actif, dry hop après. Les nuages changent d’un coup, l’amertume simulée s’affiche à chaud, et la phrase dit pourquoi, avec sa source.',
    '<b>Ensemble</b> : les deux houblons dans un seul verre, 2 + 2 g/L, 3 j ; la dose totale compte (saturation partagée) ; synergie et masquage restent inconnus.',
  ])}
</header>
<div class="chips paires" role="radiogroup" aria-label="Quelle paire">${PAIRES.map((p, i) => `<button class="chip" role="radio" data-paire="${p.join('|')}" data-role="reglage" aria-checked="${i === 0}">${p[0]} <i>·</i> ${p[1]}</button>`).join('')}</div>

<section class="sim verres" data-role="simulation" data-voie="1" aria-label="Deux verres à dose égale, simulés">
  <div class="sim-t"><b><span class="tilde">~</span> à dose égale</b><span id="cond" class="nb"></span><span class="p">simulé</span></div>
  <div class="duo" id="duo"></div>
</section>

<section class="reglages" aria-label="Quand, combien, combien de jours">
  <div class="cur"><label for="moment">quand</label><input id="moment" type="range" min="0" max="4" step="1" value="4" data-role="reglage" data-reglage="moment" aria-label="Moment de l’ajout"><output for="moment" id="moment-o" class="nb"></output></div>
  <div class="echelle" aria-hidden="true"><span>60′</span><span>10′</span><span>WP</span><span>actif</span><span>après</span></div>
  <p class="pourquoi" id="pourquoi"></p>
  <div class="cur" id="cur-dose"><label for="dose">dose</label><input id="dose" type="range" min="0" max="3" step="1" value="2" data-role="reglage" data-reglage="dose" aria-label="Dose en g/L, la même pour les deux, aimantée sur 1, 2, 4, 8"><output for="dose" id="dose-o" class="nb"></output></div>
  <div class="cur" id="cur-jours"><label for="jours">jours</label><input id="jours" type="range" min="0" max="4" step="1" value="2" data-role="reglage" data-reglage="jours" aria-label="Jours de contact, aimantés sur 1, 2, 3, 5, 7"><output for="jours" id="jours-o" class="nb"></output></div>
  <p class="p gris" id="note-paire" hidden>ensemble : 2 + 2 g/L et 3 j, la seule paire simulée ; dose totale 4 g/L</p>
  <div class="ligne-lev">
    <div class="seg" role="radiogroup" aria-label="Levure">${MOTEUR.LEVURES.map((l, i) => `<button role="radio" data-reglage="levure" data-role="reglage" data-levure="${l}" aria-checked="${i === 0}">${l}</button>`).join('')}</div>
    <button class="chip" id="ensemble" data-reglage="ajout-cumule" data-role="reglage" aria-pressed="false">${ico('i-verre', 14)}ensemble</button>
  </div>
  <div id="bio"></div>
</section>

<section class="detail" aria-label="Ce qui fait l’écart">
  <h2>Ce qui fait l’écart <small class="gris">vraies valeurs</small></h2>
  <div id="ecart"></div>
  <h2>Famille par famille <small class="gris">simulé, ~</small></h2>
  <div id="cmp" data-role="simulation"></div>
  <ul class="dps" id="drapeaux" aria-label="Ce que disent les études"></ul>
</section>`;

const css = `
  .paires { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin: 0 -16px; padding: 0 16px; } .paires::-webkit-scrollbar { display: none; } .paires .chip { height: 30px; font-size: 12px; flex: none; } .paires .chip i { color: var(--gris); font-style: normal; }
  .duo { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: start; }
  .duo.un { grid-template-columns: 1fr; }
  .verre { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 4px 6px; border-radius: 8px; background: #fff; box-shadow: inset 0 0 0 1.5px var(--trait); position: relative; }
  .verre .nom { display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 15px; } .verre .nom .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--h); }
  .nuage { position: relative; width: 170px; height: 98px; }
  .nf { position: absolute; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%); transition: width .3s, height .3s, left .3s, top .3s; }
  .nf .pi { width: 100%; height: 100%; }
  .nf .hs { position: absolute; right: -4px; top: -2px; width: 7px; height: 7px; border-radius: 50%; background: var(--acc); }
  .nf.inc { font-size: 11px; font-weight: 600; color: var(--gris); width: 12px; height: 12px; }
  .verre-svg { margin-top: -6px; }
  .verre .mots { font-size: 12px; text-align: center; min-height: 15px; } .verre .mots b { font-weight: 600; }
  .verre .hors-t { font-size: 11px; text-align: center; } .verre .hors-t::before { content: ''; display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--acc); margin-right: 4px; }
  .verre .ibu { font-size: 12px; }
  .verre .alpha { margin-top: 2px; }
  .verre.cumul { grid-column: 1 / -1; } .verre.cumul .nuage { width: 220px; }
  .verre .non-sim { margin: 8px 0; }
  .apports { display: flex; flex-direction: column; gap: 2px; font-size: 12px; width: 100%; padding: 4px 6px 0; }
  .apports div { display: flex; align-items: center; gap: 6px; } .apports .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--h); flex: none; } .apports b { font-weight: 600; }
  .reglages { display: flex; flex-direction: column; gap: 4px; padding: 8px 10px; border-radius: 8px; background: var(--piste); }
  .echelle { display: flex; justify-content: space-between; padding: 0 56px 0 52px; font-size: 10px; color: var(--gris); margin-top: -6px; }
  .pourquoi { font-size: 12px; padding: 4px 0 2px; } .pourquoi small { color: var(--gris); } .pourquoi .pi { display: inline-block; vertical-align: -2px; }
  .ligne-lev { display: flex; gap: 6px; align-items: center; } .ligne-lev .seg { flex: 1; } .ligne-lev .seg button { flex: 1; padding: 0 4px; justify-content: center; font-size: 11px; }
  .ligne-lev .seg button.off { color: var(--gris); text-decoration: line-through; }
  #ensemble { height: 28px; font-size: 12px; }
  .detail { display: flex; flex-direction: column; gap: 8px; } .detail h2 small { font-weight: 400; font-size: 12px; }
  .ec { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .ec .reel { padding: 6px 8px; } .ec .reel-h b { font-size: 13px; } .ec .rap { gap: 3px; } .ec .rap-n { width: 42px; font-size: 11px; } .ec .blog-t { display: none; }
  .ec .bornes { font-size: 10px; color: var(--gris); margin: -4px 0 0 68px; }
  .cmp { display: flex; flex-direction: column; gap: 2px; }
  .cr { display: flex; align-items: center; gap: 6px; height: 22px; }
  .cr .pi { flex: none; } .cr-n { width: 64px; font-size: 12px; font-weight: 600; color: var(--t); }
  .cr-p { position: relative; height: 18px; flex: 1; }
  .cr-p .zone { position: absolute; left: 0; top: 0; bottom: 0; width: var(--zs); background: var(--f); box-shadow: inset -1.5px 0 0 var(--b); }
  body.abs .cr-p .zone { width: var(--za); }
  .cr-p .b1, .cr-p .b2 { position: absolute; left: 0; height: 6px; border-radius: 0 2px 2px 0; transition: width .25s; background: var(--hc); }
  .cr-p .b1 { top: 2px; width: var(--w1s); } .cr-p .b2 { top: 10px; width: var(--w2s); }
  body.abs .cr-p .b1 { width: var(--w1a); } body.abs .cr-p .b2 { width: var(--w2a); }
  .cr-p .b2 { background: #fff; box-shadow: inset 0 0 0 1.5px var(--hc); }
  .cr-p .inc { position: absolute; left: 2px; top: -1px; font-size: 10px; color: var(--gris); } .cr-p .inc.b { top: 7px; }
  .cr-v { width: 70px; font-size: 10px; text-align: right; color: var(--gris); white-space: nowrap; }
  .cmp-t { display: flex; gap: 12px; font-size: 12px; margin-left: 86px; } .cmp-t span { display: inline-flex; align-items: center; gap: 4px; } .cmp-t i { width: 14px; height: 6px; border-radius: 2px; background: var(--hc); } .cmp-t i.creux { background: #fff; box-shadow: inset 0 0 0 1.5px var(--hc); }
`;

const js = `
var COUL = ${JSON.stringify(COUL)};
var JET = ${JSON.stringify(Object.fromEntries(Z.ORDRE.map((f) => [f, { base: Z.JET[f].base, texte: Z.JET[f].texte, fond: Z.JET[f].fond }])))};
var MOMENTS = ['b60', 'b10', 'wp', 'dryActive', 'dryPost'];
var POURQUOI = {
  b60: ['À 60′, surtout de l’amertume : les huiles partent à l’ébullition ; le ' + UI.picto('tropical', 13) + '4MMP perd 91 % en 60 min à 100 °C.', 'H §8.2 ; Kishimoto 2008'],
  b10: ['À 10′, une part des huiles reste (ajout tardif : au plus 60–63 % du linalol) ; les thiols à 10′ ne sont pas mesurés.', 'Gahr 2019 ; H §8.2'],
  wp: ['Au whirlpool, extraction à chaud sans ébullition : le moteur garde la moitié de la borne haute, convention non validée.', 'PROFIL-SIMULE, convention 6'],
  dryActive: ['Dry hop actif : la levure vivante transforme (biotransformation) et le hop creep est possible.', 'Lallemand ; Kirkpatrick 2018'],
  dryPost: ['Dry hop après : l’essentiel est extrait en 24 h ; c’est là que les thiols (' + UI.picto('tropical', 13) + '4MMP) font l’écart entre variétés.', 'Wolfe 2012 ; Schmidt 2024']
};
var ALPHA = ${JSON.stringify(Object.fromEntries(HOUBLONS.map((h) => [h, alphaHTML(h, { court: true })])))};
var ALPHA_L = ${JSON.stringify(Object.fromEntries(HOUBLONS.map((h) => [h, alphaHTML(h)])))};
var HUILE = ${JSON.stringify(Object.fromEntries(HOUBLONS.map((h) => [h, huileHTML(h)])))};
var USAGE = ${JSON.stringify(USAGE)}, USAGE_SRC = ${JSON.stringify(Z.USAGE_SRC)};
var RAP = ${JSON.stringify(Object.fromEntries(HOUBLONS.map((h) => [h, ligneRapport(h, '4MMP', { W: 96 }) + '<p class="bornes nb">' + (() => { const r = Z.REEL[h].ratios['4MMP']; return r.inconnu ? r.inconnu : (r.min == null ? '?' : '×' + Z.fr(r.min)) + ' – ' + (r.max == null ? '?' : '×' + Z.fr(r.max)); })() + '</p>' + ligneRapport(h, 'linalol', { W: 96 }) + '<p class="bornes nb">' + (() => { const r = Z.REEL[h].ratios.linalol; return (r.min == null ? '?' : '×' + Z.fr(r.min)) + ' – ' + (r.max == null ? '?' : '×' + Z.fr(r.max)); })() + '</p>'])))};
var FAITS = ${JSON.stringify(Object.fromEntries(HOUBLONS.map((h) => [h, faitsHTML(h, 3)])))};
var VERRE = ${JSON.stringify(VERRE)};
var ETAT = { paire: ['Citra', 'Cascade'], moment: 4, di: 2, ji: 2, levure: 'US-05', ensemble: false };
function dose() { return MOTEUR.DOSES[ETAT.di]; } function jours() { return MOTEUR.JOURS[ETAT.ji]; }
function ajout(h, d, j) { var m = MOMENTS[ETAT.moment]; return { houblon: h, dose_gL: d, moment: m, jours: MOTEUR.estDry(m) ? j : null, levure: ETAT.levure }; }
var ANG = {}; MOTEUR.F.forEach(function (f, i) { ANG[f] = -90 + i * 30; });
function nuage(p, W) {
  var cx = W / 2, cy = 50, html = '', abs = document.body.classList.contains('abs');
  MOTEUR.F.forEach(function (f) {
    var x = p[f], a = ANG[f] * Math.PI / 180, inc = x.inc;
    var v = abs ? x.centre / 100 * 4.6 : x.c;
    var s = inc ? 12 : Math.max(9, Math.min(36, 8 + v * 7));
    var r = inc ? 48 : 28 + Math.min(22, v * 5);
    var X = cx + Math.cos(a) * r * (W / 170), Y = cy + Math.sin(a) * r * 0.78;
    html += '<i class="nf' + (inc ? ' inc' : '') + '" data-nature="simule" style="left:' + X.toFixed(1) + 'px;top:' + Y.toFixed(1) + 'px;width:' + s + 'px;height:' + s + 'px" aria-label="' + MOTEUR.NOM[f] + (inc ? ' : rien de simulé' : ' environ ' + Math.round(x.centre) + ' sur 100' + (x.hors ? ', hors du style' : '')) + '">' + (inc ? '?' : UI.picto(f, s) + (x.hors && f !== 'resin' ? '<b class="hs"></b>' : '')) + '</i>';
  });
  return html;
}
function verre(noms, res, cumul) {
  var p = res.profil;
  var tete = cumul ? '<span class="nom" data-role="ajout">' + noms.map(function (h) { return '<span data-houblon="' + h + '" data-couleur="' + COUL[h] + '" style="--h:' + COUL[h] + '"><i class="dot"></i>' + h + '</span>'; }).join(' + ') + '</span>'
    : '<span class="nom" data-houblon="' + noms[0] + '"><i class="dot"></i>' + noms[0] + '</span>';
  var attrs = cumul ? ' class="verre cumul"' : ' class="verre" data-houblon="' + noms[0] + '" data-couleur="' + COUL[noms[0]] + '" style="--h:' + COUL[noms[0]] + '"';
  var corps;
  if (!p) corps = '<div class="nuage" style="width:' + (cumul ? 220 : 170) + 'px"></div>' + VERRE + UI.nonSimule(res.raison);
  else {
    var hs = MOTEUR.horsStyle(p).filter(function (f) { return f !== 'resin'; }), top = UI.top(p, 3, true);
    corps = '<div class="nuage" style="width:' + (cumul ? 220 : 170) + 'px">' + nuage(p, cumul ? 220 : 170) + '</div>' + VERRE
      + '<p class="mots" data-nature="simule"><span class="tilde">~</span> ' + top.map(function (f, i) { return i === 0 ? '<b>' + MOTEUR.COURT[f].toLowerCase() + '</b>' : MOTEUR.COURT[f].toLowerCase(); }).join(' · ') + '</p>'
      + '<p class="' + (hs.length ? 'hors-t' : 'p gris') + '">' + (hs.length ? 'hors style : ' + UI.liste(hs) : 'au style 16D') + '</p>'
      + (res.ibu ? UI.ibuHTML(res.ibu) : '') + UI.confianceHTML(res);
    if (cumul && res.apports) corps += '<div class="apports">' + noms.map(function (h) { var ap = res.apports[h]; return '<div><i class="dot" style="--h:' + COUL[h] + '"></i><b>' + h + '</b> apporte <span data-nature="simule">~' + Math.round(ap.citrus) + ' agrumes, ~' + Math.round(ap.tropical) + ' tropicaux</span></div>'; }).join('') + (res.facteur && res.facteur.citrus ? '<div><span class="gris">ensemble = ' + Math.round(res.facteur.citrus * 100) + ' % (agrumes) et ' + Math.round(res.facteur.tropical * 100) + ' % (tropicaux) de la somme des deux seuls : saturation partagée</span></div>' : '') + '</div>';
  }
  return '<div' + attrs + ' aria-label="' + noms.join(' et ') + ', simulé ; appui long : la fiche">' + tete + corps
    + (cumul ? noms.map(function (h) { return '<span class="p">' + h + ' ' + ALPHA[h] + '</span>'; }).join('') : ALPHA[noms[0]] + '<span class="us' + (/déduit/.test(USAGE_SRC[noms[0]]) ? ' deduit' : '') + '" data-role="usage">' + USAGE[noms[0]] + '</span>')
    + '</div>';
}
function cmp(pA, pB) {
  var A = ETAT.paire[0], B = ETAT.paire[1], PX = 1 / 4.6, html = '<div class="cmp-t"><span><i style="--hc:' + COUL[A] + '"></i>' + A + '</span><span><i class="creux" style="--hc:' + COUL[B] + '"></i>' + B + '</span><span class="gris">centre simulé, sur 100</span></div>';
  if (!pA || !pB) return html + '<p class="non-sim">non simulé pour ce réglage</p>';
  MOTEUR.F.forEach(function (f) {
    var a = pA[f], b = pB[f], bd = MOTEUR.bande(f), incA = a.inc, incB = b.inc;
    var pc = function (c) { return (Math.min(4.6, Math.max(0, c)) * PX * 100).toFixed(1) + '%'; }, pa = function (v) { return Math.min(100, v).toFixed(1) + '%'; };
    html += '<div class="cr" style="--b:' + JET[f].base + ';--t:' + JET[f].texte + ';--f:' + JET[f].fond + '">' + UI.picto(f, 16) + '<span class="cr-n" data-famille="' + f + '">' + MOTEUR.COURT[f] + '</span><span class="cr-p" style="--zs:' + (3 * PX * 100).toFixed(1) + '%;--za:' + bd[1] + '%"><i class="zone" data-role="zone"></i>'
      + (incA && incB ? '<span class="inc">rien de simulé</span>' : (incA ? '<span class="inc">?</span>' : '<i class="b1" data-nature="simule" style="--hc:' + COUL[A] + ';--w1s:' + pc(a.c) + ';--w1a:' + pa(a.centre) + '" aria-label="' + A + ' ' + Math.round(a.centre) + ' sur 100"></i>') + (incB ? '<span class="inc b">?</span>' : '<i class="b2" data-nature="simule" style="--hc:' + COUL[B] + ';--w2s:' + pc(b.c) + ';--w2a:' + pa(b.centre) + '" aria-label="' + B + ' ' + Math.round(b.centre) + ' sur 100"></i>'))
      + '</span><span class="cr-v nb" data-nature="simule">' + (incA ? '?' : '~' + UI.pts(a)) + ' / ' + UI.pts(b) + '</span></div>';
  });
  return html;
}
function rendre() {
  var A = ETAT.paire[0], B = ETAT.paire[1], m = MOMENTS[ETAT.moment], dry = MOTEUR.estDry(m);
  document.getElementById('titre').textContent = ETAT.ensemble ? A + ' + ' + B + ' ensemble ?' : A + ' ou ' + B + ' ?';
  var rA = MOTEUR.resoudre([ajout(A, dose(), jours())]), rB = MOTEUR.resoudre([ajout(B, dose(), jours())]);
  var duo = document.getElementById('duo'), aj;
  if (ETAT.ensemble) { aj = [ajout(A, 2, 3), ajout(B, 2, 3)]; var rAB = MOTEUR.resoudre(aj); duo.className = 'duo un'; duo.innerHTML = verre([A, B], rAB, true); document.getElementById('cond').textContent = '2 + 2 g/L · ' + MOTEUR.MOMENT[m] + ' · 3 j'; var resBio = rAB; }
  else { aj = [ajout(A, dose(), jours())]; duo.className = 'duo'; duo.innerHTML = verre([A], rA) + verre([B], rB); document.getElementById('cond').textContent = String(dose()).replace('.', ',') + ' g/L · ' + MOTEUR.MOMENT[m] + (dry ? ' · ' + jours() + ' j' : ''); var resBio = rA; }
  document.getElementById('moment-o').textContent = MOTEUR.MOMENT_COURT[m];
  document.getElementById('dose-o').textContent = String(dose()).replace('.', ',') + ' g/L';
  document.getElementById('jours-o').textContent = jours() + ' j';
  document.getElementById('cur-dose').hidden = ETAT.ensemble;
  document.getElementById('cur-jours').hidden = ETAT.ensemble || !dry;
  document.getElementById('note-paire').hidden = !ETAT.ensemble;
  var pq = POURQUOI[m]; document.getElementById('pourquoi').innerHTML = pq[0] + ' <small data-nature="mesure" data-source="' + pq[1] + '">' + pq[1] + '</small>';
  document.getElementById('bio').innerHTML = UI.bioHTML(ETAT.levure, m, resBio);
  var dispo = MOTEUR.levuresDispo(aj);
  document.querySelectorAll('[data-levure]').forEach(function (b) { b.classList.toggle('off', dispo.indexOf(b.dataset.levure) < 0); });
  document.getElementById('ecart').innerHTML = '<div class="ec">' + [A, B].map(function (h) { return '<div class="reel"><div class="reel-h"><b data-houblon="' + h + '">' + h + '</b>' + ALPHA_L[h] + '</div>' + HUILE[h] + RAP[h] + FAITS[h] + '</div>'; }).join('') + '</div>';
  document.getElementById('cmp').innerHTML = '<p class="p gris"><span class="tilde">~</span> simulé, deux barres par famille, devant la zone du style ; chaque houblon seul à ' + String(dose()).replace('.', ',') + ' g/L</p><div class="cmp">' + cmp(rA.profil, rB.profil) + '</div>';
  var ids = (resBio.drapeaux || []).concat(rB.drapeaux || []);
  document.getElementById('drapeaux').innerHTML = UI.drapeauxHTML(ids, { hors: resBio.profil ? MOTEUR.horsStyle(resBio.profil).filter(function (f) { return f !== 'resin'; }) : [] });
}
document.addEventListener('click', function (e) {
  var x;
  if ((x = e.target.closest('[data-paire]'))) { ETAT.paire = x.dataset.paire.split('|'); document.querySelectorAll('[data-paire]').forEach(function (b) { b.setAttribute('aria-checked', String(b === x)); }); rendre(); return; }
  if ((x = e.target.closest('[data-levure]'))) { ETAT.levure = x.dataset.levure; document.querySelectorAll('[data-levure]').forEach(function (b) { b.setAttribute('aria-checked', String(b === x)); }); rendre(); return; }
  if ((x = e.target.closest('#ensemble'))) { ETAT.ensemble = !ETAT.ensemble; x.setAttribute('aria-pressed', String(ETAT.ensemble)); if (ETAT.ensemble && !MOTEUR.estDry(MOMENTS[ETAT.moment])) { ETAT.moment = 4; document.getElementById('moment').value = '4'; } rendre(); return; }
});
document.addEventListener('input', function (e) {
  var t = e.target; if (!t.dataset.reglage) return;
  if (t.dataset.reglage === 'moment') ETAT.moment = +t.value;
  if (t.dataset.reglage === 'dose') ETAT.di = +t.value;
  if (t.dataset.reglage === 'jours') ETAT.ji = +t.value;
  rendre();
});
document.querySelectorAll('.lentille [data-e]').forEach(function (b) { b.addEventListener('click', rendre); });
rendre();
`;

Z.ecrire(ICI + '/etat.html', Z.page({ titre: 'z2 · Les deux verres', commentaire: 'Lot 21 · z2 : deux verres à dose égale, un nuage de pictos simulé (~, profil réel du moteur) au-dessus de chacun, un curseur de moment qui fait fondre ou grandir les nuages et montre l’amertume à chaud, les vraies valeurs qui font l’écart. ' + Z.DONNEES_NOTE, css, corps, js }));
