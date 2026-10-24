// Lot 21 · z1 « La table de brassage » : une frise à six cases (60′, 10′, whirlpool, dry hop actif, dry hop
// après, puis) sur laquelle on POSE des sachets de houblon au doigt. Chaque pose redessine ma bière (barres
// de la baseline, au style 16D, profil simulé réel), les jours de contact sur une règle, les vraies valeurs
// des sachets posés et les drapeaux. Deux sachets dans la même case = ajout cumulé (2 + 2 g/L, 3 j, la seule
// paire simulée : la dose totale compte) ; la case « puis » = l'un après l'autre (cas K3 et K4 du moteur,
// ordre inconnu, dit). La levure se choisit sous la bière ; une levure non simulée pour l'agencement le dit.
// Les curseurs s'aimantent sur la grille (doses 1, 2, 4, 8 g/L ; 1, 2, 3, 5, 7 j) : rien n'est interpolé.
// Usage : node generateur-z1.mjs  →  z1/etat.html
import * as Z from './socle-z.mjs';
const { esc, ico, alphaHTML, huileHTML, ligneRapport, faitsHTML, HOUBLONS, COUL, USAGE, MOTEUR } = Z;
const ICI = Z.D21 + '/z1';

const SLOTS = [
  ['b60', '60′', 'ébullition', 'j-ebu'], ['b10', '10′', 'ébullition', 'j-ebu'], ['wp', 'WP', 'whirlpool', 'j-whirl'],
  ['dryActive', 'actif', 'cuve J+2', 'j-cuve-a'], ['dryPost', 'après', 'cuve J+7', 'j-cuve-p'], ['puis', 'puis', 'ensuite', 'j-cuve-p'],
];
const sachet = (h) => `<button class="sachet" data-houblon="${esc(h)}" data-couleur="${COUL[h]}" style="--h:${COUL[h]}" aria-pressed="false" aria-label="Sachet de ${esc(h)} : toucher pour le prendre, appui long pour sa fiche">${ico('i-sachet', 18)}<b>${esc(h)}</b>${alphaHTML(h, { court: true })}<span class="us${/déduit/.test(Z.USAGE_SRC[h]) ? ' deduit' : ''}" data-role="usage">${USAGE[h]}</span></button>`;

const corps = `
<header class="barre">
  <h1>Ma stout 16D</h1><span class="p gris">Nugget 60′</span>
  ${Z.LENTILLE}
  ${Z.legendeHTML([
    '<b>La table</b> : six cases, de l’ébullition à la cuve. Touche un sachet, puis une case : il s’y pose. Touche un sachet posé pour régler sa dose et ses jours, sa croix pour le retirer.',
    '<b>Deux sachets dans une case</b> de cuve : ajout cumulé, à 2 + 2 g/L et 3 j (la seule paire simulée), la dose totale compte. <b>« puis »</b> : l’un après l’autre, dans la cuve du sachet précédent ; l’ordre n’est pas calculé.',
    '<b>Les barres</b> : une par famille, devant la zone pâle du style ; l’orangé dépasse le style ; le trait fin monte jusqu’au haut de la plage simulée.',
    '<b>α</b> : le lot en stock d’abord, les fiches avec le livre ; « pellets » quand les fiches ne décrivent pas le cryo. <b>Résineux</b> : ta dégustation (« trop résineuse ») prime, elle est déjà hors du style avant tout ajout.',
  ])}
</header>

<section class="table" aria-label="Quand : la table de brassage">
  <div class="frise" id="frise">${SLOTS.map(([id, t, s, ic]) => `<div class="slot" data-slot="${id}" role="button" tabindex="0" aria-label="Poser ici : ${t} ${s}"><span class="slot-t">${ico(ic, 14)}<b>${t}</b><small>${s}</small></span><div class="pose" data-pose="${id}"></div></div>`).join('')}</div>
  <svg class="regle" id="regle" width="358" height="46" viewBox="0 0 358 46" role="img" aria-label="Jours de contact dans la cuve"></svg>
</section>

<section class="sim" data-role="simulation" aria-label="Ma bière après, simulée">
  <div class="sim-t"><b><span class="tilde">~</span> ma bière après</b><span id="hors" class="hors-t"></span><span id="conf"></span></div>
  <div id="bars"></div>
  <p class="reponse" id="reponse" data-nature="simule"></p>
</section>

<section class="sachets" data-voie="1" aria-label="Quel houblon : les sachets">${HOUBLONS.map(sachet).join('')}</section>

<section class="reglages" id="reglages" aria-label="Combien, combien de jours"></section>

<section class="levure" aria-label="Avec quelle levure">
  <div class="seg" role="radiogroup" aria-label="Levure" id="levures">${MOTEUR.LEVURES.map((l, i) => `<button role="radio" data-reglage="levure" data-role="reglage" data-levure="${l}" aria-checked="${i === 0}">${l}</button>`).join('')}</div>
  <div id="bio"></div>
</section>

<section class="reel" id="reel" aria-label="Vraies valeurs des sachets posés"></section>
<ul class="dps" id="drapeaux" aria-label="Ce que disent les études"></ul>

<section class="essais" aria-label="Essais tout prêts">
  <h2>Essais</h2>
  <div class="chips" id="essais">
    <button class="chip" data-essai="k1a" data-role="reglage">Citra à 60′</button><button class="chip" data-essai="k1b">Citra à 10′</button><button class="chip" data-essai="k2a">Citra après 3 j</button><button class="chip" data-essai="k2b">Cascade après 3 j</button>
    <button class="chip" data-essai="k3a">Citra 3 j puis Galaxy 7 j</button><button class="chip" data-essai="k3b">Citra 3 j puis Idaho 7 5 j</button><button class="chip" data-essai="k4">Citra actif puis Idaho 7, Pomona</button>
    <button class="chip" data-essai="k5" data-reglage="ajout-cumule">Citra + Galaxy ensemble</button><button class="chip" data-essai="vide">Table vide</button>
  </div>
</section>`;

const css = `
  .table { display: flex; flex-direction: column; gap: 2px; }
  .frise { display: grid; grid-template-columns: 1fr 1fr 1fr 1.3fr 1.3fr 1.3fr; gap: 3px; }
  .slot { min-height: 84px; border-radius: 8px; background: var(--piste); display: flex; flex-direction: column; align-items: stretch; gap: 4px; padding: 5px 3px; position: relative; box-shadow: inset 0 0 0 1.5px transparent; transition: box-shadow .15s; }
  .slot[data-slot^="dry"], .slot[data-slot="puis"] { background: #e6ecf3; }
  .slot.cible { box-shadow: inset 0 0 0 2px var(--encre); background: #fff; }
  .slot-t { display: flex; flex-direction: column; align-items: center; gap: 1px; color: var(--gris); } .slot-t b { font-size: 12px; color: var(--encre); } .slot-t small { font-size: 10px; }
  .pose { display: flex; flex-direction: column; gap: 3px; }
  .posee { display: flex; flex-direction: column; align-items: stretch; gap: 0; padding: 2px 4px; border-radius: 4px; background: #fff; box-shadow: inset 2px 0 0 var(--h), 0 1px 2px rgba(0,0,0,.12); font-size: 10px; line-height: 1.15; position: relative; }
  .posee b { font-size: 11px; } .posee .nb { color: var(--gris); font-size: 10px; }
  .posee[aria-pressed="true"] { box-shadow: inset 2px 0 0 var(--h), 0 0 0 2px var(--encre); }
  .posee .x { position: absolute; top: -5px; right: -5px; width: 20px; height: 20px; border-radius: 50%; background: var(--encre); color: #fff; display: inline-flex; align-items: center; justify-content: center; }
  .regle { width: 100%; height: auto; }
  .sachets { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .sachet { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 2px; border-radius: 8px; background: #fff; box-shadow: inset 0 0 0 1.5px var(--trait2); color: var(--h); transition: transform .15s; }
  .sachet b { font-size: 13px; color: var(--encre); } .sachet .alpha { gap: 3px; } .sachet .al.lot { font-size: 12px; }
  .sachet[aria-pressed="true"] { transform: translateY(-4px); box-shadow: inset 0 0 0 2px var(--h), 0 6px 14px -6px rgba(0,0,0,.4); background: #fff; }
  .sachet .us { font-size: 10px; }
  .reglages { display: flex; flex-direction: column; gap: 4px; padding: 8px 10px; border-radius: 8px; background: var(--piste); }
  .reglages:empty { display: none; }
  .reglages .titre { font-size: 12px; color: var(--gris); display: flex; justify-content: space-between; gap: 8px; } .reglages .titre b { color: var(--encre); }
  .reglages .cumul { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 13px; } .reglages .cumul b { display: inline-flex; align-items: center; gap: 5px; } .reglages .cumul .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--h); }
  .reponse { font-size: 13px; } .reponse b { font-weight: 600; }
  .sim-t { flex-wrap: wrap; }
  .levure { display: flex; flex-direction: column; gap: 6px; }
  .levure .seg { width: 100%; } .levure .seg button { flex: 1; padding: 0 4px; justify-content: center; font-size: 12px; }
  .levure .seg button.off { color: var(--gris); text-decoration: line-through; }
  .reel:empty { display: none; }
  .essais h2 { margin-bottom: 6px; }
  .chip[data-essai] { height: 30px; font-weight: 500; font-size: 12px; }
  .bars.muet { opacity: .35; }
`;

const js = `
var JOUR0 = { dryActive: 2, dryPost: 7 };
var ETAT = { main: null, ajouts: [], levure: 'US-05', sel: null, n: 0 };
var COUL = ${JSON.stringify(COUL)};
var REEL_HTML = ${JSON.stringify(Object.fromEntries(HOUBLONS.map((h) => [h, `<div class="reel-h"><b data-houblon="${esc(h)}">${esc(h)}</b>${alphaHTML(h)}${huileHTML(h)}</div>${ligneRapport(h, '4MMP')}${ligneRapport(h, 'linalol')}${faitsHTML(h, 2)}`])))};
function estDry(slot) { return slot === 'dryActive' || slot === 'dryPost' || slot === 'puis'; }
// « puis » : dans la cuve du sachet précédent (après fermentation, sinon active), au jour où il sort.
function momentPuis() { if (ETAT.ajouts.some(function (a) { return a.slot === 'dryPost'; })) return 'dryPost'; if (ETAT.ajouts.some(function (a) { return a.slot === 'dryActive'; })) return 'dryActive'; return 'dryPost'; }
function momentDe(a) { return a.slot === 'puis' ? momentPuis() : a.slot; }
function debut(a) { if (a.slot !== 'puis') return JOUR0[a.slot]; var m = momentPuis(), fin = JOUR0[m]; ETAT.ajouts.forEach(function (x) { if (x.slot === m) fin = Math.max(fin, JOUR0[m] + x.jours); }); return fin; }
function versMoteur() { return ETAT.ajouts.map(function (a) { var m = momentDe(a); return { houblon: a.houblon, dose_gL: a.dose_gL, moment: m, jours: estDry(a.slot) ? a.jours : null, jourDebut: estDry(a.slot) ? debut(a) : null, levure: ETAT.levure }; }); }
function paireDans(slot) { var l = ETAT.ajouts.filter(function (a) { return a.slot === slot; }); return l.length > 1 && estDry(slot) ? l : null; }
function poser(h, slot) {
  var a = { id: ++ETAT.n, houblon: h, slot: slot, dose_gL: 4, jours: 3 };
  var memeCase = ETAT.ajouts.filter(function (x) { return x.slot === slot; });
  if (memeCase.length && estDry(slot)) { a.dose_gL = 2; a.jours = 3; memeCase.forEach(function (x) { x.dose_gL = 2; x.jours = 3; }); }
  if (slot === 'puis') { a.dose_gL = 2; a.jours = h === 'Galaxy' ? 7 : 5; ETAT.ajouts.forEach(function (x) { if (x.slot !== 'puis') x.dose_gL = 2; }); }
  ETAT.ajouts.push(a); ETAT.sel = a.id; ETAT.main = null; rendre();
}
function rendFrise() {
  document.querySelectorAll('.pose').forEach(function (p) {
    var slot = p.dataset.pose, l = ETAT.ajouts.filter(function (a) { return a.slot === slot; });
    p.innerHTML = l.map(function (a) {
      return '<div class="posee" data-houblon="' + a.houblon + '" data-couleur="' + COUL[a.houblon] + '" data-id="' + a.id + '" style="--h:' + COUL[a.houblon] + '" role="button" aria-pressed="' + (ETAT.sel === a.id) + '" aria-label="' + a.houblon + ', ' + a.dose_gL + ' g/L' + (estDry(slot) ? ', ' + a.jours + ' jours' : '') + ' : toucher pour régler">'
        + '<b>' + a.houblon + '</b><span class="nb">' + String(a.dose_gL).replace('.', ',') + ' g/L</span>' + (estDry(slot) ? '<span class="nb">' + a.jours + ' j</span>' : '') + '<button class="x" data-retire="' + a.id + '" aria-label="Retirer ' + a.houblon + '">' + ${JSON.stringify(ico('i-x', 12))} + '</button></div>';
    }).join('');
    if (paireDans(slot)) { p.setAttribute('data-role', 'ajout'); p.setAttribute('aria-label', 'Ajout cumulé : ' + l.map(function (a) { return a.houblon; }).join(' + ') + ', dose totale ' + String(MOTEUR.doseCru(versMoteur())).replace('.', ',') + ' g/L'); } else p.removeAttribute('data-role');
  });
  document.querySelectorAll('.slot').forEach(function (s) { s.classList.toggle('cible', !!ETAT.main); });
  document.querySelectorAll('.sachet').forEach(function (s) { s.setAttribute('aria-pressed', String(ETAT.main === s.dataset.houblon)); });
  // La règle des jours : J+0 à J+18 sous les trois cases de cuve ; chaque barre de contact porte son nom.
  var svg = document.getElementById('regle'), W = 358, x0 = W / 2, pas = (W - x0) / 18, s = '';
  s += '<line x1="' + x0 + '" y1="8" x2="' + W + '" y2="8" stroke="#c4c4cc" stroke-width="1"/>';
  [0, 2, 7, 10, 14, 18].forEach(function (j) { s += '<line x1="' + (x0 + j * pas) + '" y1="5" x2="' + (x0 + j * pas) + '" y2="11" stroke="#5b5b66" stroke-width="1"/><text x="' + (x0 + j * pas) + '" y="22" font-size="9" text-anchor="middle" fill="#5b5b66">J+' + j + '</text>'; });
  var k = 0;
  ETAT.ajouts.filter(function (a) { return estDry(a.slot); }).forEach(function (a) { var d = debut(a), y = 27 + (k++ % 2) * 9, xa = x0 + d * pas, w = Math.max(3, a.jours * pas); s += '<rect x="' + xa + '" y="' + y + '" width="' + w + '" height="4" rx="2" fill="' + COUL[a.houblon] + '"/><text x="' + (xa + w + 3) + '" y="' + (y + 4) + '" font-size="9" fill="' + COUL[a.houblon] + '">' + a.houblon + ' ' + a.jours + ' j</text>'; });
  s += '<text x="' + (x0 - 6) + '" y="12" font-size="9" text-anchor="end" fill="#5b5b66">jours en cuve</text>';
  svg.innerHTML = s;
}
function rendReglages() {
  var r = document.getElementById('reglages'), a = ETAT.ajouts.find(function (x) { return x.id === ETAT.sel; });
  if (!a) { r.innerHTML = ''; return; }
  var dry = estDry(a.slot), pr = paireDans(a.slot);
  if (pr) {
    r.innerHTML = '<div class="titre"><b>Ajout cumulé · ' + MOTEUR.MOMENT[momentDe(a)] + '</b><span>la seule paire simulée</span></div><div class="cumul" data-role="ajout">' + pr.map(function (x) { return '<b data-houblon="' + x.houblon + '" data-couleur="' + COUL[x.houblon] + '" style="--h:' + COUL[x.houblon] + '"><i class="dot"></i>' + x.houblon + ' <span class="nb">2 g/L</span></b>'; }).join('<span class="gris">+</span>') + '<span class="nb">3 j</span><span class="gris">· dose totale <b class="nb">4 g/L</b></span></div>';
    return;
  }
  var di = MOTEUR.DOSES.indexOf(a.dose_gL), ji = MOTEUR.JOURS.indexOf(a.jours);
  r.innerHTML = '<div class="titre"><b>' + a.houblon + ' · ' + MOTEUR.MOMENT[momentDe(a)] + (a.slot === 'puis' ? ', puis' : '') + '</b><span>combien, combien de jours</span></div>'
    + '<div class="cur"><label for="dose">dose</label><input id="dose" type="range" min="0" max="3" step="1" value="' + (di < 0 ? 2 : di) + '" data-role="reglage" data-reglage="dose" aria-label="Dose en g/L, aimantée sur 1, 2, 4, 8"><output for="dose" class="nb">' + String(a.dose_gL).replace('.', ',') + ' g/L</output></div>'
    + (dry ? '<div class="cur"><label for="jours">jours</label><input id="jours" type="range" min="0" max="4" step="1" value="' + (ji < 0 ? 2 : ji) + '" data-role="reglage" data-reglage="jours" aria-label="Jours de contact, aimantés sur 1, 2, 3, 5, 7"><output for="jours" class="nb">' + a.jours + ' j</output></div>' : '<p class="p gris">à l’ébullition et au whirlpool, pas de jours : la dose seule</p>');
}
function rendSim() {
  var aj = versMoteur(), res = MOTEUR.resoudre(aj), p = res.profil;
  var bars = document.getElementById('bars'), rep = document.getElementById('reponse'), hors = document.getElementById('hors'), conf = document.getElementById('conf');
  if (!p) {
    bars.innerHTML = UI.barres(MOTEUR.profil(MOTEUR.AVANT), { cls: 'muet', label: 'Ma bière avant, en attendant un agencement simulé' }) + UI.nonSimule(res.raison);
    hors.textContent = ''; conf.innerHTML = ''; rep.innerHTML = '<span class="tilde">~</span> rien de simulé pour cet agencement : les barres pâles sont ma bière avant.';
  } else {
    bars.innerHTML = UI.barres(p, { label: 'Ma bière après, simulée, par famille, au style 16D' });
    var hs = MOTEUR.horsStyle(p);
    var hsT = hs.filter(function (f) { return f !== 'resin'; }); hors.textContent = (hsT.length ? 'hors style : ' + UI.liste(hsT) : 'au style') + (hs.indexOf('resin') >= 0 ? ' · résineux : ta dégustation' : '');
    conf.innerHTML = UI.confianceHTML(res) + (res.ibu ? ' ' + UI.ibuHTML(res.ibu) : '');
    if (!aj.length) rep.innerHTML = 'Table vide : ma stout telle quelle, Nugget à 60′ ; ta dégustation la dit trop résineuse. <b>Pose un sachet.</b>';
    else {
      var noms = aj.map(function (a) { return a.houblon + ' ' + String(a.dose_gL).replace('.', ',') + ' g/L ' + MOTEUR.MOMENT_COURT[a.moment] + (a.jours ? ' ' + a.jours + ' j' : ''); }).join(' · ');
      var hsSans = hs.filter(function (f) { return f !== 'resin'; }), top = UI.top(p, 2, true).map(function (f) { return MOTEUR.COURT[f].toLowerCase(); });
      rep.innerHTML = '<span class="tilde">~</span> ' + noms + ' : ' + (hsSans.length ? '<b>' + UI.liste(hsSans) + (hsSans.length > 1 ? ' sortent' : ' sort') + ' du style 16D</b>' : '<b>reste au style</b>, surtout ' + top.join(' et ')) + (res.ibu ? ' ; ' + (res.ibu.central >= 50 ? 'surtout de l’amertume' : 'de l’amertume en plus') + ', ~' + Math.round(res.ibu.central) + ' IBU' : '') + (res.facteur && res.facteur.citrus ? ' ; ensemble = ' + Math.round(res.facteur.citrus * 100) + ' % de la somme des deux seuls (agrumes)' : '') + '.';
    }
  }
  var m = aj.some(function (a) { return a.moment === 'dryActive'; }) ? 'dryActive' : '';
  document.getElementById('bio').innerHTML = UI.bioHTML(ETAT.levure, m, res);
  var dispo = MOTEUR.levuresDispo(aj);
  document.querySelectorAll('[data-levure]').forEach(function (b) { b.classList.toggle('off', aj.length > 0 && dispo.indexOf(b.dataset.levure) < 0); });
  var vus = {}, html = '';
  aj.forEach(function (a) { if (!vus[a.houblon]) { vus[a.houblon] = 1; html += REEL_HTML[a.houblon]; } });
  document.getElementById('reel').innerHTML = html;
  document.getElementById('drapeaux').innerHTML = p ? UI.drapeauxHTML(res.drapeaux, { hors: MOTEUR.horsStyle(p).filter(function (f) { return f !== 'resin'; }) }) : '';
}
function rendre() { rendFrise(); rendReglages(); rendSim(); }
var ESSAIS = {
  k1a: [['Citra', 'b60', 4]], k1b: [['Citra', 'b10', 4]], k2a: [['Citra', 'dryPost', 4, 3]], k2b: [['Cascade', 'dryPost', 4, 3]],
  k3a: [['Citra', 'dryPost', 2, 3], ['Galaxy', 'puis', 2, 7]], k3b: [['Citra', 'dryPost', 2, 3], ['Idaho 7', 'puis', 2, 5]],
  k4: [['Citra', 'dryActive', 2, 3], ['Idaho 7', 'puis', 2, 5], 'Pomona'],
  k5: [['Citra', 'dryPost', 2, 3], ['Galaxy', 'dryPost', 2, 3]], vide: []
};
function essai(k) { var E = ESSAIS[k]; ETAT.levure = typeof E[E.length - 1] === 'string' ? E[E.length - 1] : 'US-05'; ETAT.ajouts = E.filter(Array.isArray).map(function (e) { return { id: ++ETAT.n, houblon: e[0], slot: e[1], dose_gL: e[2], jours: e[3] || 3 }; }); ETAT.sel = ETAT.ajouts.length ? ETAT.ajouts[0].id : null; ETAT.main = null; document.querySelectorAll('[data-levure]').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.levure === ETAT.levure)); }); rendre(); }
document.addEventListener('click', function (e) {
  var x;
  if ((x = e.target.closest('[data-retire]'))) { e.stopPropagation(); ETAT.ajouts = ETAT.ajouts.filter(function (a) { return a.id !== +x.dataset.retire; }); if (ETAT.sel === +x.dataset.retire) ETAT.sel = null; rendre(); return; }
  if ((x = e.target.closest('.posee'))) { ETAT.sel = ETAT.sel === +x.dataset.id ? null : +x.dataset.id; ETAT.main = null; rendre(); return; }
  if ((x = e.target.closest('.sachet'))) { ETAT.main = ETAT.main === x.dataset.houblon ? null : x.dataset.houblon; rendFrise(); return; }
  if ((x = e.target.closest('.slot'))) { if (ETAT.main) poser(ETAT.main, x.dataset.slot); else { var l = ETAT.ajouts.filter(function (a) { return a.slot === x.dataset.slot; }); if (l.length) { ETAT.sel = l[0].id; rendre(); } } return; }
  if ((x = e.target.closest('[data-levure]'))) { ETAT.levure = x.dataset.levure; document.querySelectorAll('[data-levure]').forEach(function (b) { b.setAttribute('aria-checked', String(b === x)); }); rendSim(); return; }
  if ((x = e.target.closest('[data-essai]'))) { essai(x.dataset.essai); return; }
});
document.addEventListener('input', function (e) {
  var t = e.target, a = ETAT.ajouts.find(function (x) { return x.id === ETAT.sel; }); if (!a || !t.dataset.reglage) return;
  if (t.dataset.reglage === 'dose') { a.dose_gL = MOTEUR.DOSES[+t.value]; t.nextElementSibling.textContent = String(a.dose_gL).replace('.', ',') + ' g/L'; }
  if (t.dataset.reglage === 'jours') { a.jours = MOTEUR.JOURS[+t.value]; t.nextElementSibling.textContent = a.jours + ' j'; }
  rendFrise(); rendSim();
});
document.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('slot')) { e.preventDefault(); e.target.click(); } });
var q = new URLSearchParams(location.search).get('essai');
essai(q && ESSAIS[q] ? q : 'k2a');
`;

Z.ecrire(ICI + '/etat.html', Z.page({ titre: 'z1 · La table de brassage', commentaire: 'Lot 21 · z1 : une frise à six cases où l’on pose des sachets de houblon au doigt ; chaque pose redessine la bière simulée (~, profil réel du moteur), les jours de contact, les vraies valeurs et les drapeaux. ' + Z.DONNEES_NOTE, css, corps, js }));
