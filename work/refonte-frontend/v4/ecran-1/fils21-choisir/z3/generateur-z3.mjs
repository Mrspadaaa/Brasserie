// Lot 21 · z3 « La carte » : où atterrit ma bière. Une carte à deux axes en mots : à gauche « agrumes ·
// floral », à droite « tropical · baies » (le caractère), en bas « faible : au style 16D », en haut « fort »
// (l'intensité). La bande du style est un sol pâle ; au-dessus, on est hors du style. Chaque houblon est
// un pion placé là où il emmènerait ma bière au réglage courant (moment, dose, jours, levure) ; on touche
// un pion pour choisir (deux pions = ensemble, 2 + 2 g/L, 3 j). Le point « ma bière » se déplace, avec sa
// traînée de doses (1, 2, 4, 8 g/L) : on voit combien avant de sortir du style, et vers où. Tout est le
// profil simulé réel du moteur (~) ; un pion non simulé reste creux et le dit.
// Usage : node generateur-z3.mjs  →  z3/etat.html
import * as Z from '../z1/socle-z.mjs';
const { esc, ico, alphaHTML, huileHTML, ligneRapport, faitsHTML, HOUBLONS, COUL, USAGE, MOTEUR } = Z;
const ICI = Z.D21 + '/z3';

const corps = `
<header class="barre">
  <h1>Où atterrit ma bière ?</h1>
  ${Z.LENTILLE}
  ${Z.legendeHTML([
    '<b>La carte</b> : à gauche plus d’agrumes, à droite plus de tropical (largeur = tropical moins agrumes) ; en bas « faible », la bande pâle du style 16D ; plus haut, hors du style. La hauteur est la famille la plus forte, hors résineux (ta dégustation).',
    '<b>Un pion</b> par houblon, posé là où il emmènerait ma bière au réglage courant ; touche-le pour le choisir (deux pions : ensemble, 2 + 2 g/L, 3 j). Un pion creux : non simulé pour ce réglage, et il le dit.',
    '<b>Le point « ma bière »</b> et sa traînée : les doses 1, 2, 4, 8 g/L du houblon choisi ; le trait vertical monte jusqu’au haut de la plage simulée. Au style ou absolu change l’échelle de la hauteur.',
  ])}
</header>

<section class="sim carte-bloc" data-role="simulation" aria-label="La carte, simulée">
  <div class="sim-t"><b><span class="tilde">~</span> ma bière, simulée</b><span id="cond" class="nb"></span></div>
  <svg id="carte" class="carte" width="358" height="270" viewBox="0 0 358 270" role="img" aria-label="Carte : caractère en largeur, intensité en hauteur, bande du style en bas"></svg>
  <p class="reponse" id="reponse" data-nature="simule"></p>
</section>

<section class="pions-liste" data-voie="1" aria-label="Les houblons">${HOUBLONS.map((h) => `<button class="hchip" data-choisir="${esc(h)}" data-houblon="${esc(h)}" data-couleur="${COUL[h]}" style="--h:${COUL[h]}" aria-pressed="false" aria-label="${esc(h)} : toucher pour le choisir, appui long pour sa fiche"><i class="dot"></i><b>${esc(h)}</b>${alphaHTML(h, { court: true })}<span class="us${/déduit/.test(Z.USAGE_SRC[h]) ? ' deduit' : ''}" data-role="usage">${USAGE[h]}</span></button>`).join('')}</section>

<section class="reglages" aria-label="Quand, combien, combien de jours, quelle levure">
  <div class="seg moments" role="radiogroup" aria-label="Quand">${Object.entries(MOTEUR.MOMENT_COURT).map(([m, t], i) => `<button role="radio" data-moment="${m}" data-role="reglage" aria-checked="${m === 'dryPost'}">${t}</button>`).join('')}</div>
  <div class="cur" id="cur-dose"><label for="dose">dose</label><input id="dose" type="range" min="0" max="3" step="1" value="2" data-role="reglage" data-reglage="dose" aria-label="Dose en g/L, aimantée sur 1, 2, 4, 8"><output for="dose" id="dose-o" class="nb"></output></div>
  <div class="cur" id="cur-jours"><label for="jours">jours</label><input id="jours" type="range" min="0" max="4" step="1" value="2" data-role="reglage" data-reglage="jours" aria-label="Jours de contact, aimantés sur 1, 2, 3, 5, 7"><output for="jours" id="jours-o" class="nb"></output></div>
  <p class="p" id="note-paire" hidden></p>
  <button class="chip" id="ensemble" data-reglage="ajout-cumule" data-role="reglage" aria-pressed="false">${ico('i-pion', 14)}deux pions ensemble : Citra + Galaxy</button>
  <div class="seg levures" role="radiogroup" aria-label="Levure">${MOTEUR.LEVURES.map((l, i) => `<button role="radio" data-reglage="levure" data-role="reglage" data-levure="${l}" aria-checked="${i === 0}">${l}</button>`).join('')}</div>
  <div id="bio"></div>
</section>

<section class="sim" data-role="simulation" aria-label="Famille par famille">
  <div class="sim-t"><b><span class="tilde">~</span> famille par famille</b><span id="hors" class="hors-t"></span><span id="conf"></span></div>
  <div id="bars"></div>
</section>
<section class="reel" id="reel" aria-label="Vraies valeurs des houblons choisis"></section>
<ul class="dps" id="drapeaux" aria-label="Ce que disent les études"></ul>`;

const css = `
  .carte { width: 100%; height: auto; }
  .pion { pointer-events: bounding-box; cursor: pointer; }
  .carte text { font-family: var(--sans); }
  .pions-liste { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .hchip { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 2px; border-radius: 8px; background: #fff; box-shadow: inset 0 0 0 1.5px var(--trait2); }
  .hchip .dot { width: 12px; height: 12px; border-radius: 50%; background: var(--h); } .hchip b { font-size: 13px; } .hchip .al.lot { font-size: 12px; } .hchip .us { font-size: 10px; }
  .hchip[aria-pressed="true"] { box-shadow: inset 0 0 0 2px var(--h); background: var(--piste); }
  .reglages { display: flex; flex-direction: column; gap: 6px; padding: 8px 10px; border-radius: 8px; background: var(--piste); }
  .reglages .seg { width: 100%; background: #fff; } .reglages .seg button { flex: 1; padding: 0 4px; justify-content: center; font-size: 12px; }
  .reglages .seg button[aria-checked="true"] { background: var(--encre); color: #fff; }
  .levures button.off { color: var(--gris); text-decoration: line-through; }
  .reponse { font-size: 13px; } .reponse b { font-weight: 600; }
  #ensemble { align-self: flex-start; height: 30px; font-size: 12px; background: #fff; } #ensemble[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .reel:empty { display: none; }
`;

const js = `
var COUL = ${JSON.stringify(COUL)};
var HOUBLONS = ${JSON.stringify(HOUBLONS)};
var REEL_HTML = ${JSON.stringify(Object.fromEntries(HOUBLONS.map((h) => [h, `<div class="reel-h"><b data-houblon="${esc(h)}">${esc(h)}</b>${alphaHTML(h)}${huileHTML(h)}</div>${ligneRapport(h, '4MMP')}${ligneRapport(h, 'linalol')}${faitsHTML(h, 2)}`])))};
var ETAT = { choisis: ['Citra'], moment: 'dryPost', di: 2, ji: 2, levure: 'US-05' };
function dose() { return MOTEUR.DOSES[ETAT.di]; } function jours() { return MOTEUR.JOURS[ETAT.ji]; }
function ajout(h, d, j) { return { houblon: h, dose_gL: d, moment: ETAT.moment, jours: MOTEUR.estDry(ETAT.moment) ? j : null, levure: ETAT.levure }; }
function ajoutsChoisis() { if (ETAT.choisis.length === 2) return [ajout(ETAT.choisis[0], 2, 3), ajout(ETAT.choisis[1], 2, 3)]; return ETAT.choisis.map(function (h) { return ajout(h, dose(), jours()); }); }
// La position : hauteur = famille la plus forte (hors résineux, ta dégustation), ramenée à la bande 0–30 ; largeur = tropical et baies moins agrumes et floral.
var K55 = 30 / 55;
function norm(p, f) { return p[f].centre * (MOTEUR.bande(f)[1] === 55 ? K55 : 1); }
function pos(p) {
  var abs = document.body.classList.contains('abs');
  var fs = MOTEUR.F.filter(function (f) { return f !== 'resin'; });
  var best = fs[0]; fs.forEach(function (f) { if (norm(p, f) > norm(p, best)) best = f; });
  var y = abs ? p[best].centre : norm(p, best), yh = abs ? p[best].haut : p[best].haut * (MOTEUR.bande(best)[1] === 55 ? K55 : 1), yb = abs ? p[best].bas : p[best].bas * (MOTEUR.bande(best)[1] === 55 ? K55 : 1);
  var x = norm(p, 'tropical') - norm(p, 'citrus');
  return { x: x, y: y, yb: yb, yh: yh, best: best, abs: abs };
}
var W = 358, H = 270, L = 30, R = 328, T = 22, B = 228, YMAX = 60, XMAX = 15;
function px(x) { return L + (Math.max(-XMAX, Math.min(XMAX, x)) + XMAX) / (2 * XMAX) * (R - L); }
function py(y) { var ym = document.body.classList.contains('abs') ? 100 : YMAX; return B - Math.max(0, Math.min(ym, y)) / ym * (B - T); }
function rendCarte() {
  var abs = document.body.classList.contains('abs'), ym = abs ? 100 : YMAX, bande = abs ? 30 : 30, s = '';
  s += '<rect x="' + L + '" y="' + py(bande) + '" width="' + (R - L) + '" height="' + (B - py(bande)) + '" fill="#f1f3f7"/>';
  s += '<line x1="' + L + '" y1="' + py(bande) + '" x2="' + R + '" y2="' + py(bande) + '" stroke="#8a909b" stroke-width="1" stroke-dasharray="3 3"/>';
  s += '<text x="' + (L + 4) + '" y="' + (B - 6) + '" font-size="11" fill="#5b5b66">faible : au style 16D</text>';
  s += '<text x="' + (L + 4) + '" y="' + (py(bande) - 5) + '" font-size="11" fill="#c2410c" font-weight="600">hors style : plus que « faible »</text>';
  s += '<text x="' + (L + 4) + '" y="' + (T + 10) + '" font-size="11" fill="#5b5b66">fort</text>';
  s += '<line x1="' + L + '" y1="' + T + '" x2="' + L + '" y2="' + B + '" stroke="#c4c4cc"/><line x1="' + L + '" y1="' + B + '" x2="' + R + '" y2="' + B + '" stroke="#c4c4cc"/>';
  s += '<text x="' + L + '" y="' + (B + 16) + '" font-size="11" fill="#856e0c" font-weight="600">← plus agrumes</text><text x="' + R + '" y="' + (B + 16) + '" font-size="11" fill="#9b5d0d" font-weight="600" text-anchor="end">plus tropical →</text>';
  s += '<text x="' + ((L + R) / 2) + '" y="' + (B + 16) + '" font-size="10" fill="#5b5b66" text-anchor="middle">caractère</text>';
  s += '<text x="' + (L - 4) + '" y="' + (py(bande) + 4) + '" font-size="9" fill="#5b5b66" text-anchor="end">30</text><text x="' + (L - 4) + '" y="' + (T + 4) + '" font-size="9" fill="#5b5b66" text-anchor="end">' + ym + '</text><text x="' + (L - 4) + '" y="' + (B + 3) + '" font-size="9" fill="#5b5b66" text-anchor="end">0</text>';
  // ma bière avant
  var av = pos(MOTEUR.profil(MOTEUR.AVANT));
  s += '<g data-serie="avant"><circle cx="' + px(av.x) + '" cy="' + py(av.y) + '" r="4" fill="#fff" stroke="#16161a" stroke-width="1.5"/><text x="' + (px(av.x) + 7) + '" y="' + (py(av.y) - 8) + '" font-size="10" fill="#5b5b66">avant (Nugget 60′)</text></g>';
  // les pions
  HOUBLONS.forEach(function (h) {
    var r = MOTEUR.resoudre([ajout(h, ETAT.choisis.length === 2 && ETAT.choisis.indexOf(h) >= 0 ? 2 : dose(), ETAT.choisis.length === 2 && ETAT.choisis.indexOf(h) >= 0 ? 3 : jours())]), on = ETAT.choisis.indexOf(h) >= 0;
    if (!r.profil) { var k = HOUBLONS.indexOf(h); s += '<g class="pion" data-pion="' + h + '" data-serie="' + h + '" data-couleur="' + COUL[h] + '" data-choisir="' + h + '" role="button" aria-label="' + h + ' : non simulé pour ce réglage"><circle cx="' + (R - 14) + '" cy="' + (T + 14 + k * 20) + '" r="7" fill="#fff" stroke="' + COUL[h] + '" stroke-width="1.5" stroke-dasharray="2 2"/><text x="' + (R - 26) + '" y="' + (T + 18 + k * 20) + '" font-size="10" fill="' + COUL[h] + '" text-anchor="end">' + h + ' : non simulé</text></g>'; return; }
    var q = pos(r.profil), X = px(q.x), Y = py(q.y);
    s += '<g class="pion' + (on ? ' on' : '') + '" data-pion="' + h + '" data-serie="' + h + '" data-couleur="' + COUL[h] + '" data-choisir="' + h + '" role="button" aria-pressed="' + on + '" aria-label="' + h + ', pion : ' + Math.round(q.y) + ' en hauteur' + (on ? ', choisi' : '') + '">'
      + '<circle cx="' + X + '" cy="' + Y + '" r="' + (on ? 9 : 7) + '" fill="' + (on ? COUL[h] : '#fff') + '" stroke="' + COUL[h] + '" stroke-width="2"/>'
      + (on ? '' : '<text x="' + X + '" y="' + (Y < py(30) ? Y - 12 : Y + 20) + '" font-size="11" font-weight="600" fill="' + COUL[h] + '" text-anchor="middle">' + h + '</text>') + '</g>';
  });
  // ma bière après : point, plage, traînée de doses
  var aj = ajoutsChoisis(), res = MOTEUR.resoudre(aj);
  if (res.profil && aj.length) {
    var q = pos(res.profil), X = px(q.x), Y = py(q.y);
    if (aj.length === 1) {
      var tr = MOTEUR.DOSES.map(function (d) { var rr = MOTEUR.resoudre([ajout(aj[0].houblon, d, jours())]); return rr.profil ? { d: d, p: pos(rr.profil) } : null; }).filter(Boolean);
      s += '<polyline points="' + [[px(av.x), py(av.y)]].concat(tr.map(function (t) { return [px(t.p.x), py(t.p.y)]; })).map(function (c) { return c.join(','); }).join(' ') + '" fill="none" stroke="#16161a" stroke-width="1" stroke-dasharray="2 3"/>';
      tr.forEach(function (t) { s += '<circle cx="' + px(t.p.x) + '" cy="' + py(t.p.y) + '" r="2.5" fill="#16161a"/><text x="' + (px(t.p.x) - 6) + '" y="' + (py(t.p.y) + 3) + '" font-size="9" fill="#16161a" text-anchor="end">' + t.d + ' g/L</text>'; });
    }
    var yh = py(q.yh), fleche = q.yh > (q.abs ? 100 : YMAX);
    s += '<line x1="' + X + '" y1="' + py(q.yb) + '" x2="' + X + '" y2="' + yh + '" stroke="#16161a" stroke-width="1.5"/>' + (fleche ? '<path d="M' + (X - 4) + ',' + (yh + 6) + ' L' + X + ',' + yh + ' L' + (X + 4) + ',' + (yh + 6) + '" fill="none" stroke="#16161a" stroke-width="1.5"/>' : '');
    s += '<g data-serie="apres" data-nature="simule" aria-label="ma bière après, ' + Math.round(q.y) + ' en hauteur, jusqu’à ' + Math.round(q.yh) + '"><circle cx="' + X + '" cy="' + Y + '" r="7" fill="#16161a"/><circle cx="' + X + '" cy="' + Y + '" r="11" fill="none" stroke="#16161a" stroke-width="1.5"/><text x="' + (X > (L + R) / 2 ? X - 15 : X + 15) + '" y="' + (Y + 4) + '" font-size="11" font-weight="700" fill="#16161a" text-anchor="' + (X > (L + R) / 2 ? 'end' : 'start') + '">ma bière ~' + Math.round(q.y) + ' : ' + ETAT.choisis.join(' + ') + '</text></g>';
  }
  document.getElementById('carte').innerHTML = s;
  return res;
}
function rendre() {
  var aj = ajoutsChoisis(), res = rendCarte(), p = res.profil, dry = MOTEUR.estDry(ETAT.moment), paire = ETAT.choisis.length === 2;
  document.getElementById('cond').textContent = (paire ? '2 + 2 g/L · 3 j' : String(dose()).replace('.', ',') + ' g/L' + (dry ? ' · ' + jours() + ' j' : '')) + ' · ' + MOTEUR.MOMENT[ETAT.moment] + ' · ' + ETAT.levure;
  document.getElementById('dose-o').textContent = String(dose()).replace('.', ',') + ' g/L';
  document.getElementById('jours-o').textContent = jours() + ' j';
  document.getElementById('cur-dose').hidden = paire; document.getElementById('cur-jours').hidden = paire || !dry; var np = document.getElementById('note-paire'); np.hidden = !paire; if (paire) np.innerHTML = '<span data-role="ajout">ensemble : ' + ETAT.choisis.map(function (h) { return '<b data-houblon="' + h + '" style="color:' + COUL[h] + '">' + h + '</b>'; }).join(' + ') + ', 2 + 2 g/L, 3 j, dose totale 4 g/L (la seule paire simulée)</span>'; document.getElementById('ensemble').setAttribute('aria-pressed', String(paire));
  document.querySelectorAll('[data-choisir]').forEach(function (b) { b.setAttribute('aria-pressed', String(ETAT.choisis.indexOf(b.dataset.choisir) >= 0)); });
  var rep = document.getElementById('reponse'), hors = document.getElementById('hors'), conf = document.getElementById('conf'), bars = document.getElementById('bars');
  if (!aj.length) { rep.innerHTML = 'Ma stout avant : tout en bas, à gauche. <b>Touche un pion.</b>'; }
  else if (!p) { rep.innerHTML = UI.nonSimule(res.raison); }
  else {
    var hs = MOTEUR.horsStyle(p).filter(function (f) { return f !== 'resin'; }), q = pos(p);
    rep.innerHTML = '<span class="tilde">~</span> ' + ETAT.choisis.join(' + ') + ' : ' + (hs.length ? '<b>' + UI.liste(hs) + (hs.length > 1 ? ' sortent' : ' sort') + ' du style</b>, ' : '<b>reste au style</b>, ') + 'famille la plus forte : ' + MOTEUR.COURT[q.best].toLowerCase() + ' ~' + Math.round(p[q.best].centre) + ' (jusqu’à ' + Math.round(p[q.best].haut) + ')' + (res.ibu ? ' ; ~' + Math.round(res.ibu.central) + ' IBU' : '') + (res.facteur && res.facteur.citrus ? ' ; ensemble = ' + Math.round(res.facteur.citrus * 100) + ' % de la somme des deux seuls' : '') + '.';
  }
  var pb = p || MOTEUR.profil(MOTEUR.AVANT);
  bars.innerHTML = UI.barres(pb, { cls: p ? '' : 'muet', label: 'Famille par famille, au style 16D' });
  var hsT = p ? MOTEUR.horsStyle(p).filter(function (f) { return f !== 'resin'; }) : [];
  hors.textContent = p ? (hsT.length ? 'hors style : ' + UI.liste(hsT) : 'au style') + ' · résineux : ta dégustation' : '';
  conf.innerHTML = p ? UI.confianceHTML(res) : '';
  document.getElementById('bio').innerHTML = UI.bioHTML(ETAT.levure, ETAT.moment, res);
  var dispo = MOTEUR.levuresDispo(aj.length ? aj : [ajout('Citra', dose(), jours())]);
  document.querySelectorAll('[data-levure]').forEach(function (b) { b.classList.toggle('off', dispo.indexOf(b.dataset.levure) < 0); });
  document.getElementById('reel').innerHTML = ETAT.choisis.map(function (h) { return REEL_HTML[h]; }).join('');
  document.getElementById('drapeaux').innerHTML = p ? UI.drapeauxHTML(res.drapeaux, { hors: hsT }) : '';
}
document.addEventListener('click', function (e) {
  var x;
  if ((x = e.target.closest('[data-choisir]'))) { var h = x.dataset.choisir, i = ETAT.choisis.indexOf(h); if (i >= 0) ETAT.choisis.splice(i, 1); else { ETAT.choisis.push(h); if (ETAT.choisis.length > 2) ETAT.choisis.shift(); if (ETAT.choisis.length === 2 && !MOTEUR.estDry(ETAT.moment)) { ETAT.moment = 'dryPost'; document.querySelectorAll('[data-moment]').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.moment === 'dryPost')); }); } } rendre(); return; }
  if ((x = e.target.closest('#ensemble'))) { ETAT.choisis = ETAT.choisis.length === 2 ? ETAT.choisis.slice(0, 1) : ['Citra', 'Galaxy']; if (!MOTEUR.estDry(ETAT.moment)) { ETAT.moment = 'dryPost'; document.querySelectorAll('[data-moment]').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.moment === 'dryPost')); }); } rendre(); return; }
  if ((x = e.target.closest('[data-moment]'))) { ETAT.moment = x.dataset.moment; document.querySelectorAll('[data-moment]').forEach(function (b) { b.setAttribute('aria-checked', String(b === x)); }); if (ETAT.choisis.length === 2 && !MOTEUR.estDry(ETAT.moment)) ETAT.choisis = ETAT.choisis.slice(0, 1); rendre(); return; }
  if ((x = e.target.closest('[data-levure]'))) { ETAT.levure = x.dataset.levure; document.querySelectorAll('[data-levure]').forEach(function (b) { b.setAttribute('aria-checked', String(b === x)); }); rendre(); return; }
});
// Appui long sur un pion : sa fiche (la carte est en SVG, le geste commun ne lit que les puces HTML).
var APPUI_PION = null;
document.addEventListener('pointerdown', function (e) { var g = e.target.closest && e.target.closest('[data-pion]'); if (!g) return; var nom = g.dataset.pion; APPUI_PION = { nom: nom, t: setTimeout(function () { APPUI_PION = null; ouvrirFiche(nom, { source: document.querySelector('.hchip[data-houblon="' + nom + '"]'), mode: innerWidth >= 700 ? 'bulle' : 'feuille' }); }, 500) }; });
['pointerup', 'pointercancel', 'pointermove'].forEach(function (ev) { document.addEventListener(ev, function (e) { if (APPUI_PION && (ev !== 'pointermove' || true)) { if (ev === 'pointermove') return; clearTimeout(APPUI_PION.t); APPUI_PION = null; } }); });
document.addEventListener('input', function (e) { var t = e.target; if (!t.dataset.reglage) return; if (t.dataset.reglage === 'dose') ETAT.di = +t.value; if (t.dataset.reglage === 'jours') ETAT.ji = +t.value; rendre(); });
document.querySelectorAll('.lentille [data-e]').forEach(function (b) { b.addEventListener('click', rendre); });
rendre();
`;

Z.ecrire(ICI + '/etat.html', Z.page({ titre: 'z3 · La carte', commentaire: 'Lot 21 · z3 : une carte à deux axes en mots (caractère, intensité) avec la bande du style en sol ; un pion par houblon, le point « ma bière » et sa traînée de doses ; profil simulé réel (~). ' + Z.DONNEES_NOTE, css, corps, js }));
