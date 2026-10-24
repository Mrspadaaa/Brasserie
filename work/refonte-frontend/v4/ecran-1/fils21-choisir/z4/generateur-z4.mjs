// Lot 21 · z4 « La phrase » : la recette est une phrase, et chaque mot se touche. « Je mets [Citra] à
// [4 g/L] en [dry hop après] pendant [3 j], levure [US-05], [seul]. » Toucher un mot ouvre ses choix ;
// choisir réécrit la phrase et la réponse, en une ligne, puis famille par famille (lignes nommées, devant
// la zone du style), avec les vraies valeurs à côté. Le dernier mot dit « seul », « + Galaxy ensemble »
// (2 + 2 g/L, 3 j) ou « puis Galaxy 7 j » (l'un après l'autre) : l'ajout cumulé et l'enchaînement sont
// des mots comme les autres. Tout est le profil simulé réel du moteur (~) ; une phrase hors de la grille
// le dit au lieu d'inventer.
// Usage : node generateur-z4.mjs  →  z4/etat.html
import * as Z from '../z1/socle-z.mjs';
const { esc, ico, alphaHTML, huileHTML, ligneRapport, faitsHTML, HOUBLONS, COUL, USAGE, MOTEUR } = Z;
const ICI = Z.D21 + '/z4';
const ALPHA_COURT = Object.fromEntries(HOUBLONS.map((h) => [h, alphaHTML(h, { court: true, sansPct: false })]));

const corps = `
<header class="barre">
  <h1>Ma recette, en une phrase</h1>
  ${Z.LENTILLE}
  ${Z.legendeHTML([
    '<b>La phrase</b> : chaque mot souligné se touche : il passe au choix suivant et ouvre la liste de ses choix ; la phrase se réécrit, la réponse aussi. Appui long sur le houblon : sa fiche.',
    '<b>Le dernier mot</b> : « seul », « + … ensemble » (deux houblons dans le même dry hop, 2 + 2 g/L, 3 j, la dose totale compte) ou « puis … » (l’un après l’autre, ordre non calculé).',
    '<b>Les lignes</b> : une par famille, devant la zone pâle du style ; l’orangé dépasse le style ; le trait fin va jusqu’au haut de la plage simulée ; « ? » : rien de simulé.',
  ])}
</header>

<section class="phrase-bloc" data-voie="1" aria-label="La phrase">
  <p class="phrase" id="phrase"></p>
  <div class="choix" id="choix" hidden></div>
</section>

<section class="sim" data-role="simulation" aria-label="La réponse, simulée">
  <p class="reponse" id="reponse" data-nature="simule"></p>
  <div class="sim-t"><span id="conf"></span><span id="bio"></span></div>
  <div id="lignes"></div>
</section>

<section class="reel" id="reel" aria-label="Vraies valeurs"></section>
<ul class="dps" id="drapeaux" aria-label="Ce que disent les études"></ul>`;

const css = `
  .phrase-bloc { display: flex; flex-direction: column; gap: 8px; }
  .phrase { font-size: 20px; line-height: 1.6; font-weight: 400; }
  .mot { display: inline-block; padding: 0 4px; margin: 0 1px; border-radius: 4px; border-bottom: 2.5px solid var(--encre); font-weight: 600; background: #fff; }
  .mot[aria-expanded="true"] { background: var(--encre); color: #fff; }
  .mot .alpha { margin-left: 4px; font-weight: 400; } .mot[aria-expanded="true"] .al, .mot[aria-expanded="true"] .grec { color: #fff; }
  .mot .al.lot { font-size: 13px; }
  .mot.fixe { border-bottom-style: dotted; color: var(--gris); font-weight: 500; }
  .choix { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 10px; border-radius: 8px; background: var(--piste); }
  .choix button { height: 34px; padding: 0 12px; border-radius: 17px; background: #fff; font-size: 14px; font-weight: 600; box-shadow: inset 0 0 0 1.5px var(--trait2); }
  .choix button[aria-checked="true"] { background: var(--encre); color: #fff; box-shadow: none; }
  .choix button.off { color: var(--gris); text-decoration: line-through; }
  .choix .note { flex-basis: 100%; font-size: 12px; color: var(--gris); }
  .reponse { font-size: 15px; line-height: 1.35; } .reponse b { font-weight: 700; }
  .sim-t { flex-wrap: wrap; justify-content: flex-start; }
  .lgs { padding: 4px 0; }
  .lg { height: 20px; } .lg-n { width: 72px; } .lg-p { height: 14px; }
  .reel:empty { display: none; }
`;

const js = `
var COUL = ${JSON.stringify(COUL)};
var HOUBLONS = ${JSON.stringify(HOUBLONS)};
var ALPHA = ${JSON.stringify(ALPHA_COURT)};
var REEL_HTML = ${JSON.stringify(Object.fromEntries(HOUBLONS.map((h) => [h, `<div class="reel-h"><b data-houblon="${esc(h)}">${esc(h)}</b>${alphaHTML(h)}${huileHTML(h)}</div>${ligneRapport(h, '4MMP')}${ligneRapport(h, 'linalol')}${faitsHTML(h, 2)}`])))};
var ETAT = { houblon: 'Citra', di: 2, moment: 'dryPost', ji: 2, levure: 'US-05', deux: 'seul', ouvert: null };
var DEUX = [['seul', 'seul'], ['ens:Galaxy', '+ Galaxy ensemble'], ['ens:Idaho 7', '+ Idaho 7 ensemble'], ['ens:Cascade', '+ Cascade ensemble'], ['ens:Citra', '+ Citra ensemble'], ['puis:Galaxy:7', 'puis Galaxy 7 j'], ['puis:Idaho 7:5', 'puis Idaho 7 5 j']];
function dose() { return MOTEUR.DOSES[ETAT.di]; } function jours() { return MOTEUR.JOURS[ETAT.ji]; }
function dry() { return MOTEUR.estDry(ETAT.moment); }
function second() { return ETAT.deux === 'seul' ? null : ETAT.deux.split(':'); }
function ajouts() {
  var s = second();
  if (!s) return [{ houblon: ETAT.houblon, dose_gL: dose(), moment: ETAT.moment, jours: dry() ? jours() : null, levure: ETAT.levure }];
  if (s[0] === 'ens') return [{ houblon: ETAT.houblon, dose_gL: 2, moment: ETAT.moment, jours: 3, levure: ETAT.levure }, { houblon: s[1], dose_gL: 2, moment: ETAT.moment, jours: 3, levure: ETAT.levure }];
  var j0 = ETAT.moment === 'dryActive' ? 2 : 7;
  return [{ houblon: ETAT.houblon, dose_gL: 2, moment: ETAT.moment, jours: 3, jourDebut: j0, levure: ETAT.levure }, { houblon: s[1], dose_gL: 2, moment: ETAT.moment, jours: +s[2], jourDebut: j0 + 3, levure: ETAT.levure }];
}
function mot(id, texte, fixe) { return '<button class="mot' + (fixe ? ' fixe' : '') + '" data-mot="' + id + '"' + (fixe ? '' : ' data-role="reglage"') + (id === 'levure' ? ' data-reglage="levure"' : '') + (id === 'deux' ? ' data-reglage="ajout-cumule"' : '') + ' aria-expanded="' + (ETAT.ouvert === id) + '" aria-haspopup="true" aria-label="' + id + ' : toucher pour passer au suivant et voir les choix"' + (id === 'houblon' ? ' data-houblon="' + ETAT.houblon + '" data-couleur="' + COUL[ETAT.houblon] + '"' : '') + '>' + texte + '</button>'; }
function suivant(id) {
  var cyc = function (arr, cur) { return arr[(arr.indexOf(cur) + 1) % arr.length]; };
  if (id === 'houblon') { ETAT.houblon = cyc(HOUBLONS, ETAT.houblon); if (ETAT.deux.indexOf(ETAT.houblon) >= 0) ETAT.deux = 'seul'; }
  if (id === 'dose') ETAT.di = (ETAT.di + 1) % MOTEUR.DOSES.length;
  if (id === 'moment') { ETAT.moment = cyc(Object.keys(MOTEUR.MOMENT), ETAT.moment); if (second() && !MOTEUR.estDry(ETAT.moment)) ETAT.deux = 'seul'; }
  if (id === 'jours') ETAT.ji = (ETAT.ji + 1) % MOTEUR.JOURS.length;
  if (id === 'levure') ETAT.levure = cyc(MOTEUR.LEVURES, ETAT.levure);
  if (id === 'deux') { var l = DEUX.filter(function (x) { return x[0] === 'seul' || x[0].indexOf(ETAT.houblon) < 0; }).map(function (x) { return x[0]; }); ETAT.deux = cyc(l, ETAT.deux); if (ETAT.deux !== 'seul' && !dry()) ETAT.moment = 'dryPost'; }
}
function rendPhrase() {
  var s = second(), d = dry();
  var h = 'Je mets ' + mot('houblon', ETAT.houblon + ALPHA[ETAT.houblon]);
  h += ' à ' + (s ? mot('dose', '2 g/L', true) : mot('dose', String(dose()).replace('.', ',') + ' g/L'));
  h += ' en ' + mot('moment', MOTEUR.MOMENT[ETAT.moment]);
  if (d) h += ' pendant ' + (s ? mot('jours', '3 j', true) : mot('jours', jours() + ' j'));
  h += ', levure ' + mot('levure', ETAT.levure) + ', ' + mot('deux', DEUX.filter(function (x) { return x[0] === ETAT.deux; })[0][1] + (s && s[0] === 'ens' ? ' 2 g/L, 3 j' : '')) + '.';
  document.getElementById('phrase').innerHTML = h;
}
function rendChoix() {
  var c = document.getElementById('choix'), o = ETAT.ouvert;
  if (!o) { c.hidden = true; c.innerHTML = ''; return; }
  var opts = [], note = '';
  if (o === 'houblon') opts = HOUBLONS.map(function (x) { return [x, x, ETAT.houblon === x]; });
  if (o === 'dose') { opts = MOTEUR.DOSES.map(function (x, i) { return [String(i), String(x).replace('.', ',') + ' g/L', ETAT.di === i]; }); note = second() ? 'avec un second houblon, la grille simule 2 + 2 g/L seulement' : 'la grille simule 1, 2, 4 et 8 g/L'; }
  if (o === 'moment') opts = Object.keys(MOTEUR.MOMENT).map(function (m) { return [m, MOTEUR.MOMENT[m], ETAT.moment === m]; });
  if (o === 'jours') { opts = MOTEUR.JOURS.map(function (x, i) { return [String(i), x + ' j', ETAT.ji === i]; }); note = second() ? 'avec un second houblon, 3 j seulement' : 'au-delà de 3 j, rien de plus à l’arôme (Wolfe 2012)'; }
  if (o === 'levure') { var dispo = MOTEUR.levuresDispo(ajouts()); opts = MOTEUR.LEVURES.map(function (l) { return [l, l, ETAT.levure === l, dispo.indexOf(l) < 0]; }); note = 'barrée : non simulée pour cette phrase (un houblon seul : US-05 et Pomona)'; }
  if (o === 'deux') { opts = DEUX.filter(function (x) { return x[0] === 'seul' || x[0].indexOf(ETAT.houblon) < 0; }).map(function (x) { return [x[0], x[1], ETAT.deux === x[0]]; }); note = 'ensemble : 2 + 2 g/L, 3 j, la dose totale compte ; puis : l’un après l’autre, ordre non calculé (cas simulés : Citra d’abord)'; }
  c.innerHTML = opts.map(function (x) { return '<button role="radio" data-val="' + x[0] + '" data-role="reglage"' + (o === 'levure' ? ' data-reglage="levure"' : '') + (o === 'deux' && x[0].indexOf('ens:') === 0 ? ' data-reglage="ajout-cumule"' : '') + ' aria-checked="' + !!x[2] + '" class="' + (x[3] ? 'off' : '') + '">' + x[1] + '</button>'; }).join('') + (note ? '<p class="note">' + note + '</p>' : '');
  c.hidden = false;
}
function rendSim() {
  var aj = ajouts(), res = MOTEUR.resoudre(aj), p = res.profil, rep = document.getElementById('reponse');
  if (!p) { rep.innerHTML = UI.nonSimule(res.raison); document.getElementById('lignes').innerHTML = '<p class="p gris">les lignes montrent ma bière avant (Nugget 60′, dégustation)</p>' + UI.lignes(MOTEUR.profil(MOTEUR.AVANT), { W: 150, label: 'Ma bière avant' }); document.getElementById('conf').innerHTML = ''; }
  else {
    var hs = MOTEUR.horsStyle(p).filter(function (f) { return f !== 'resin'; }), top = UI.top(p, 2, true).map(function (f) { return MOTEUR.COURT[f].toLowerCase(); });
    rep.innerHTML = '<span class="tilde">~</span> ' + (hs.length ? '<b>' + UI.liste(hs).replace(/^./, function (c) { return c.toUpperCase(); }) + (hs.length > 1 ? ' sortent' : ' sort') + ' du style 16D.</b>' : '<b>Reste au style 16D</b>, surtout ' + top.join(' et ') + '.') + (res.ibu ? ' Surtout de l’amertume : ~' + Math.round(res.ibu.central) + ' IBU.' : '') + (res.facteur && res.facteur.citrus ? ' Ensemble = ' + Math.round(res.facteur.citrus * 100) + ' % de la somme des deux seuls (saturation partagée).' : '') + ' Résineux : ta dégustation, déjà hors du style.';
    document.getElementById('lignes').innerHTML = UI.lignes(p, { W: 150, label: 'Famille par famille, au style 16D' });
    document.getElementById('conf').innerHTML = UI.confianceHTML(res);
  }
  document.getElementById('bio').innerHTML = UI.bioHTML(ETAT.levure, ETAT.moment, res);
  var hs2 = [ETAT.houblon].concat(second() ? [second()[1]] : []);
  document.getElementById('reel').innerHTML = hs2.map(function (h) { return REEL_HTML[h]; }).join('');
  document.getElementById('drapeaux').innerHTML = p ? UI.drapeauxHTML(res.drapeaux, { hors: MOTEUR.horsStyle(p).filter(function (f) { return f !== 'resin'; }) }) : '';
}
function rendre() { rendPhrase(); rendChoix(); rendSim(); }
document.addEventListener('click', function (e) {
  var x;
  if ((x = e.target.closest('[data-mot]'))) { var id = x.dataset.mot; if (!x.classList.contains('fixe')) suivant(id); ETAT.ouvert = id; rendre(); return; }
  if ((x = e.target.closest('[data-val]'))) {
    var o = ETAT.ouvert, v = x.dataset.val;
    if (o === 'houblon') { ETAT.houblon = v; if (ETAT.deux.indexOf(v) >= 0) ETAT.deux = 'seul'; }
    if (o === 'dose') ETAT.di = +v;
    if (o === 'moment') { ETAT.moment = v; if (second() && !MOTEUR.estDry(v)) ETAT.deux = 'seul'; }
    if (o === 'jours') ETAT.ji = +v;
    if (o === 'levure') ETAT.levure = v;
    if (o === 'deux') { ETAT.deux = v; if (v !== 'seul' && !dry()) ETAT.moment = 'dryPost'; }
    rendre(); return;
  }
});
rendre();
`;

Z.ecrire(ICI + '/etat.html', Z.page({ titre: 'z4 · La phrase', commentaire: 'Lot 21 · z4 : la recette est une phrase dont chaque mot se touche ; la réponse et les lignes par famille se réécrivent ; ensemble et puis sont des mots ; profil simulé réel (~). ' + Z.DONNEES_NOTE, css, corps, js }));
