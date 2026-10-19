// Lot 21 · z5 « Le pari » : devine, puis vois. Cinq cartes, une par question du brasseur (K1 à K5) ;
// on parie d'un toucher, et la carte se retourne : le profil simulé des deux ou trois options côte à côte
// (~, moteur réel), la vraie valeur qui tranche (avec sa source et sa bande d'incertitude), le pourquoi
// en une phrase, et un réglage pour jouer encore (moment, dose, jour par jour, levure, ensemble ou seul).
// À la fin, ce qu'on a appris et les trous des études. Le score est le sien : l'outil ne tranche pas.
// Usage : node generateur-z5.mjs  →  z5/etat.html
import * as Z from '../z1/socle-z.mjs';
const { esc, ico, alphaHTML, huileHTML, ligneRapport, faitsHTML, bandeLog, picto, HOUBLONS, COUL, MOTEUR, UI, REEL, TROUS } = Z;
const ICI = Z.D21 + '/z5';
const FAM6 = ['floral', 'citrus', 'tropical', 'stoneFruit', 'berries', 'green'];
const aj = (h, m, d, j, l = 'US-05', j0) => ({ houblon: h, moment: m, dose_gL: d, jours: j, levure: l, jourDebut: j0 });
const rA = (x) => MOTEUR.resoudre(x);
const pts = (r, f) => (r.profil ? Math.round(r.profil[f].centre) : '?');
// Les réponses, lues dans le moteur (jamais à la main).
const k1b60 = rA([aj('Citra', 'b60', 4, null)]), k1b10 = rA([aj('Citra', 'b10', 4, null)]);
const k2 = Object.fromEntries(['Citra', 'Galaxy', 'Idaho 7'].map((h) => [h, rA([aj(h, 'dryPost', 4, 3)])]));
const k3g = rA([aj('Citra', 'dryPost', 2, 3, 'US-05', 7), aj('Galaxy', 'dryPost', 2, 7, 'US-05', 10)]), k3i = rA([aj('Citra', 'dryPost', 2, 3, 'US-05', 7), aj('Idaho 7', 'dryPost', 2, 5, 'US-05', 10)]);
const k4 = Object.fromEntries(MOTEUR.LEVURES.map((l) => [l, rA([aj('Citra', 'dryActive', 2, 3, l, 2), aj('Idaho 7', 'dryActive', 2, 5, l, 5)])]));
const k5seul = rA([aj('Citra', 'dryPost', 4, 3)]), k5ens = rA([aj('Citra', 'dryPost', 2, 3), aj('Galaxy', 'dryPost', 2, 3)]);
const maxTrop = Object.entries(k2).sort((a, b) => b[1].profil.tropical.centre - a[1].profil.tropical.centre);
const bonK2 = maxTrop.filter(([, r]) => Math.abs(r.profil.tropical.centre - maxTrop[0][1].profil.tropical.centre) < 2).map(([h]) => h);
const bonK3 = k3g.profil.tropical.centre > k3i.profil.tropical.centre ? 'galaxy7' : 'idaho5';
const bonK4 = k4.Pomona.profil.citrus.centre > k4['US-05'].profil.citrus.centre + 2 ? 'oui' : 'non';
const dC = k5ens.profil.citrus.centre - k5seul.profil.citrus.centre, dT = k5ens.profil.tropical.centre - k5seul.profil.tropical.centre;
const bonK5 = Math.abs(dC) < 5 && Math.abs(dT) < 5 ? 'autant' : (dC + dT > 0 ? 'plus' : 'moins');
const mini = (r, titre) => `<div class="mini"><b>${esc(titre)}</b>${r.profil ? UI.barres(r.profil, { familles: FAM6, z: 14, noms: 'court', label: titre }) : UI.nonSimule(r.raison)}${r.ibu ? UI.ibuHTML(r.ibu) : ''}${UI.confianceHTML(r)}</div>`;
const CARTES = [
  { id: 'k1', q: 'Citra 4 g/L : à 60′ ou à 10′, lequel donne plus d’agrumes ?', choix: [['b60', 'à 60′'], ['b10', 'à 10′'], ['pareil', 'pareil']], bon: ['b10'],
    revele: `<div class="duo">${mini(k1b60, 'à 60′')}${mini(k1b10, 'à 10′')}</div>
      <p class="pq"><span class="tilde">~</span> agrumes ~${pts(k1b60, 'citrus')} à 60′ contre ~${pts(k1b10, 'citrus')} à 10′ ; à 60′, surtout de l’amertume : ~${Math.round(k1b60.ibu.central)} IBU contre ~${Math.round(k1b10.ibu.central)}. <b>Les huiles partent à l’ébullition ; le 4MMP perd 91 % en 60 min à 100 °C.</b> <small data-nature="mesure" data-source="Kishimoto 2008 ; H §8.2">Kishimoto 2008 ; H §8.2</small></p>
      <div class="jeu"><label for="k1m">rejoue le moment</label><input id="k1m" type="range" min="0" max="4" step="1" value="1" data-role="reglage" data-jeu="k1" aria-label="Moment de l’ajout de Citra"><output class="nb" id="k1m-o">10′</output></div><div id="k1-jeu" data-role="simulation"></div>` },
  { id: 'k2', q: 'Citra, Galaxy ou Idaho 7, 4 g/L en dry hop après, 3 j : lequel est le plus tropical ?', choix: [['Citra', 'Citra'], ['Galaxy', 'Galaxy'], ['Idaho 7', 'Idaho 7']], bon: bonK2,
    revele: `<div class="trio">${['Citra', 'Galaxy', 'Idaho 7'].map((h) => mini(k2[h], h)).join('')}</div>
      <p class="pq"><span class="tilde">~</span> tropical : Citra ~${pts(k2.Citra, 'tropical')}, Galaxy ~${pts(k2.Galaxy, 'tropical')}, Idaho 7 ~${pts(k2['Idaho 7'], 'tropical')}. <b>Ce qui tranche, c’est le 4MMP au seuil</b> : ${['Citra', 'Galaxy', 'Idaho 7'].map((h) => { const r = REEL[h].ratios['4MMP']; return h + ' ' + (r.min == null ? '?' : '×' + Z.fr(r.min)) + '–' + (r.max == null ? '?' : '×' + Z.fr(r.max)); }).join(' ; ')}. Galaxy n’a pas de borne haute publiée ; Idaho 7 sort sans doute trop bas (ses thiols ne sont connus qu’en somme, et YCH le dit le plus fruité des trois).</p>
      <div class="bandes">${['Citra', 'Galaxy', 'Idaho 7'].map((h) => `<div class="bande-h"><b style="color:${COUL[h]}">${esc(h)}</b>${ligneRapport(h, '4MMP', { W: 140 })}</div>`).join('')}</div>
      <div class="jeu"><label for="k2d">rejoue la dose</label><input id="k2d" type="range" min="0" max="3" step="1" value="2" data-role="reglage" data-jeu="k2" aria-label="Dose, aimantée sur 1, 2, 4, 8 g/L"><output class="nb" id="k2d-o">4 g/L</output></div><div id="k2-jeu" data-role="simulation"></div>` },
  { id: 'k3', q: 'Citra 3 j puis Galaxy 7 j, ou Citra 3 j puis Idaho 7 5 j (2 g/L chacun) : lequel finit le plus tropical ?', choix: [['galaxy7', 'puis Galaxy 7 j'], ['idaho5', 'puis Idaho 7 5 j'], ['pareil', 'pareil']], bon: [bonK3],
    revele: `<div class="duo">${mini(k3g, 'puis Galaxy 7 j')}${mini(k3i, 'puis Idaho 7 5 j')}</div>
      <p class="pq"><span class="tilde">~</span> tropical ~${pts(k3g, 'tropical')} contre ~${pts(k3i, 'tropical')}. <b>Au-delà de 3 j, rien de plus à l’arôme</b> : l’essentiel est extrait en 24 h, et 7 j n’ajoutent que du végétal possible, non chiffré. L’ordre, la synergie et le masquage restent inconnus. <small data-nature="mesure" data-source="Wolfe 2012 ; Schmidt 2019 ; H §7.3">Wolfe 2012 ; Schmidt 2019 ; H §7.3</small></p>
      <div class="jeu"><label for="k3j">rejoue jour par jour</label><input id="k3j" type="range" min="0" max="10" step="1" value="10" data-role="reglage" data-jeu="k3" aria-label="Jour de dry hop, de J0 à J10"><output class="nb" id="k3j-o">J10</output></div><div id="k3-jeu" data-role="simulation"></div>` },
  { id: 'k4', q: 'Citra 3 j puis Idaho 7 5 j en dry hop actif : avec Pomona, plus d’agrumes qu’avec US-05 ?', choix: [['oui', 'oui'], ['non', 'non']], bon: [bonK4],
    revele: `<div class="duo">${mini(k4['US-05'], 'US-05')}${mini(k4.Pomona, 'Pomona')}</div>
      <p class="pq"><span class="tilde">~</span> agrumes ~${pts(k4['US-05'], 'citrus')} avec US-05, ~${pts(k4.Pomona, 'citrus')} avec Pomona : <b>Pomona convertit la moitié du géraniol en citronellol</b> (floral → agrumes), 0 au centre pour les autres ; Verdant et Diamond libèrent ~0,1 % des précurseurs de thiols. Conventions à valider : aucun rendement publié sur houblon réel, et Diamond fait plus de thiols mais moins de fruité perçu (Samia). <small data-nature="mesure" data-source="Lallemand ; Svedlund 2022 ; Samia">Lallemand ; Svedlund 2022 ; Samia</small></p>
      <div class="jeu"><span>rejoue la levure</span><div class="seg" role="radiogroup" aria-label="Levure">${MOTEUR.LEVURES.map((l) => `<button role="radio" data-reglage="levure" data-role="reglage" data-jeu="k4" data-levure="${l}" aria-checked="${l === 'Pomona'}">${l}</button>`).join('')}</div></div><div id="k4-jeu" data-role="simulation"></div>` },
  { id: 'k5', q: 'Citra + Galaxy ensemble, 2 + 2 g/L, 3 j : plus, autant ou moins d’arôme que Citra seul à 4 g/L ?', choix: [['plus', 'plus'], ['autant', 'autant'], ['moins', 'moins']], bon: [bonK5],
    revele: `<div class="duo">${mini(k5seul, 'Citra seul 4 g/L')}${mini(k5ens, 'Citra + Galaxy 2 + 2')}</div>
      <p class="pq"><span class="tilde">~</span> agrumes ~${pts(k5seul, 'citrus')} contre ~${pts(k5ens, 'citrus')}, tropical ~${pts(k5seul, 'tropical')} contre ~${pts(k5ens, 'tropical')}. <b>À dose totale égale, le second houblon n’ajoute presque pas d’intensité : la saturation est partagée</b> (ensemble = ${Math.round(k5ens.facteur.citrus * 100)} % de la somme des deux seuls). Il change la forme : Citra apporte ~${Math.round(k5ens.apports.Citra.berries)} points de baies sur 100, Galaxy ~${Math.round(k5ens.apports.Galaxy.berries)}. Synergie et masquage : inconnus. <small data-nature="mesure" data-source="Lafontaine 2018 ; H §7.3">Lafontaine 2018 ; H §7.3</small></p>
      <div class="jeu"><span>rejoue</span><div class="seg" role="radiogroup" aria-label="Seul ou ensemble"><button role="radio" data-role="reglage" data-jeu="k5" data-k5="seul" aria-checked="false">Citra seul 4 g/L</button><button role="radio" data-role="reglage" data-reglage="ajout-cumule" data-jeu="k5" data-k5="ens" aria-checked="true">Citra + Galaxy 2 + 2</button></div></div><div id="k5-jeu" data-role="simulation"></div>` },
];

const corps = `
<header class="barre">
  <h1>Le pari</h1><span class="p gris" id="score">0 / 5</span>
  ${Z.LENTILLE}
  ${Z.legendeHTML([
    '<b>Une carte par question</b> : parie d’un toucher, la carte se retourne. Les mini-barres sont le profil simulé des options (six familles), devant la zone pâle du style ; l’orangé dépasse le style.',
    '<b>La vraie valeur qui tranche</b> est à côté, avec sa source et sa bande ; une bande qui finit en « ? » n’a pas de borne publiée.',
    '<b>Rejoue</b> : chaque carte retournée a un réglage (moment, dose, jour par jour, levure, seul ou ensemble) qui redessine le simulé.',
  ])}
</header>
<section class="sim avant" data-role="simulation" aria-label="Ma stout avant, simulée">
  <div class="sim-t"><b><span class="tilde">~</span> ma stout avant tout pari</b><span class="p">Nugget 60′ · résineux : dégustation</span></div>
  ${UI.barres(MOTEUR.profil(MOTEUR.AVANT), { familles: ['floral', 'citrus', 'tropical', 'berries', 'resin', 'green'], z: 14, noms: 'court', label: 'Ma stout avant' })}
</section>
<section class="cartes" id="cartes">${CARTES.map((c, i) => `<article class="carte" data-pari="${c.id}" ${i ? 'hidden' : ''} aria-label="Pari ${i + 1}">
  <p class="num">${i + 1} / 5</p>
  <h2 class="q">${c.q}</h2>
  <div class="choix" role="group" aria-label="Ton pari">${c.choix.map(([v, t]) => `<button data-choix="${v}" data-role="reglage">${t}</button>`).join('')}</div>
  <div class="revele" data-role="simulation" hidden><p class="verdict" id="${c.id}-v"></p>${c.revele}<button class="suivant" data-suivant>${i < 4 ? 'Suivant' : 'Ce que j’ai appris'}${ico('i-fleche-d', 16)}</button></div>
</article>`).join('')}
<article class="carte fin" data-pari="fin" hidden aria-label="Fin">
  <h2 class="q">Ce que j’ai appris <span class="p gris" id="score-fin"></span></h2>
  <ul class="lecons">
    <li>Pourquoi 10′ et pas 60′ : à 60′ presque tout l’arôme part, l’amertume reste (~${Math.round(k1b60.ibu.central)} IBU).</li>
    <li>Citra et Galaxy sont les plus tropicaux par simulation ; ce qui tranche en vrai, ce sont les thiols (4MMP), et Galaxy n’a pas de borne haute.</li>
    <li>Au-delà de 3 j, rien de plus à l’arôme ; l’ordre de deux dry hops n’est pas calculé.</li>
    <li>La levure ne change le simulé qu’en dry hop actif, par convention (Pomona : géraniol → citronellol).</li>
    <li>Deux houblons ensemble, à dose totale égale : la même intensité, une autre forme.</li>
  </ul>
  <h2 class="q">Les trous, à montrer</h2>
  <ul class="trous">${TROUS.map((t) => `<li class="trou">${esc(t)}</li>`).join('')}</ul>
  <div class="houblons" data-voie="1">${HOUBLONS.map((h) => `<span class="hb" data-houblon="${esc(h)}" data-couleur="${COUL[h]}" style="--h:${COUL[h]}"><i class="dot"></i><b>${esc(h)}</b>${alphaHTML(h, { court: true })}</span>`).join('')}</div>
  <button class="suivant" data-rejouer>${ico('i-rejouer', 16)}Rejouer</button>
</article>
</section>
<section class="houblons bas" data-voie="2" aria-label="Les houblons du pari">${HOUBLONS.map((h) => `<span class="hb" data-houblon="${esc(h)}" data-couleur="${COUL[h]}" style="--h:${COUL[h]}" aria-label="${esc(h)} : appui long pour sa fiche"><i class="dot"></i><b>${esc(h)}</b>${alphaHTML(h, { court: true })}</span>`).join('')}</section>`;

const css = `
  .cartes { display: flex; flex-direction: column; gap: 10px; }
  .avant .bars { gap: 1px; } .avant .pile { height: 34px; } .avant .col-n { font-size: 8px; letter-spacing: -.2px; white-space: nowrap; }
  .carte { display: flex; flex-direction: column; gap: 10px; padding: 12px 12px 14px; border-radius: 8px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.12), inset 0 0 0 1px var(--trait); }
  .num { font-size: 12px; color: var(--gris); }
  .q { font-size: 17px; line-height: 1.3; font-weight: 700; }
  .choix { display: flex; flex-wrap: wrap; gap: 8px; }
  .choix button { min-height: 40px; padding: 0 16px; border-radius: 20px; background: var(--piste); font-size: 15px; font-weight: 600; flex: 1; }
  .choix button[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .choix button.bon { box-shadow: inset 0 0 0 2px var(--encre); }
  .revele { display: flex; flex-direction: column; gap: 10px; padding-top: 4px; border-top: 1px solid var(--trait); }
  .verdict { font-size: 15px; font-weight: 700; }
  .duo { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; } .trio { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
  .mini { display: flex; flex-direction: column; gap: 3px; align-items: stretch; } .mini > b { font-size: 12px; } .mini .bars { gap: 1px; } .mini .pile { height: 40px; } .mini .col-n { font-size: 8px; letter-spacing: -.2px; white-space: nowrap; }
  .mini .conf, .mini .ibu { align-self: flex-start; }
  .pq { font-size: 13px; line-height: 1.35; } .pq b { font-weight: 600; } .pq small { color: var(--gris); }
  .bandes { display: flex; flex-direction: column; gap: 4px; } .bande-h { display: flex; align-items: center; gap: 6px; } .bande-h > b { width: 52px; font-size: 12px; } .bande-h .rap-n { display: none; }
  .jeu { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--gris); flex-wrap: wrap; } .jeu label, .jeu > span { width: 110px; } .jeu input { flex: 1; } .jeu output { width: 54px; text-align: right; font-weight: 600; }
  .jeu .seg { flex: 1; } .jeu .seg button { flex: 1; padding: 0 4px; justify-content: center; font-size: 11px; }
  .suivant { align-self: flex-end; height: 36px; padding: 0 14px; border-radius: 18px; background: var(--encre); color: #fff; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
  .lecons { padding-left: 18px; font-size: 13px; display: flex; flex-direction: column; gap: 4px; }
  .trous { list-style: none; display: flex; flex-direction: column; gap: 4px; }
  .houblons { display: flex; flex-wrap: wrap; gap: 6px; }
  .hb { display: inline-flex; align-items: center; gap: 5px; height: 30px; padding: 0 10px; border-radius: 15px; background: #fff; box-shadow: inset 0 0 0 1.5px var(--trait2); font-size: 12px; } .hb .dot { width: 9px; height: 9px; border-radius: 50%; background: var(--h); } .hb .al.lot { font-size: 11px; }
  .bas { padding-top: 4px; }
`;

const js = `
var BON = ${JSON.stringify(Object.fromEntries(CARTES.map((c) => [c.id, c.bon])))};
var FAM6 = ${JSON.stringify(FAM6)};
var SCORE = {}; var ETAT = { k4: 'Pomona', k5: 'ens' };
function aj(h, m, d, j, l, j0) { return { houblon: h, moment: m, dose_gL: d, jours: j, levure: l || 'US-05', jourDebut: j0 }; }
function mini(r, titre) { return '<div class="mini"><b>' + titre + '</b>' + (r.profil ? UI.barres(r.profil, { familles: FAM6, z: 14, noms: 'court', label: titre }) : UI.nonSimule(r.raison)) + (r.ibu ? UI.ibuHTML(r.ibu) : '') + UI.confianceHTML(r) + '</div>'; }
function jeu(id) {
  var z = document.getElementById(id + '-jeu'); if (!z) return;
  if (id === 'k1') { var m = ['b60', 'b10', 'wp', 'dryActive', 'dryPost'][+document.getElementById('k1m').value]; document.getElementById('k1m-o').textContent = MOTEUR.MOMENT_COURT[m]; var r = MOTEUR.resoudre([aj('Citra', m, 4, MOTEUR.estDry(m) ? 3 : null)]); z.innerHTML = mini(r, 'Citra 4 g/L, ' + MOTEUR.MOMENT[m]) + '<p class="p gris" data-nature="simule"><span class="tilde">~</span> agrumes ~' + (r.profil ? Math.round(r.profil.citrus.centre) : '?') + ', tropical ~' + (r.profil ? Math.round(r.profil.tropical.centre) : '?') + '</p>'; }
  if (id === 'k2') { var d = MOTEUR.DOSES[+document.getElementById('k2d').value]; document.getElementById('k2d-o').textContent = d + ' g/L'; z.innerHTML = '<div class="trio">' + ['Citra', 'Galaxy', 'Idaho 7'].map(function (h) { return mini(MOTEUR.resoudre([aj(h, 'dryPost', d, 3)]), h + ' ' + d + ' g/L'); }).join('') + '</div>'; }
  if (id === 'k3') { var j = +document.getElementById('k3j').value; document.getElementById('k3j-o').textContent = 'J' + j; var rg = MOTEUR.resoudre([aj('Citra', 'dryPost', 2, 3, 'US-05', 7), aj('Galaxy', 'dryPost', 2, 7, 'US-05', 10)]), ri = MOTEUR.resoudre([aj('Citra', 'dryPost', 2, 3, 'US-05', 7), aj('Idaho 7', 'dryPost', 2, 5, 'US-05', 10)]); var pg = rg.parJour && rg.parJour[j], pi = ri.parJour && ri.parJour[j]; z.innerHTML = '<div class="duo">' + mini({ profil: pg ? MOTEUR.profil(pg.p) : null, raison: 'jour hors du cas', confiance: rg.confiance }, 'puis Galaxy, J' + j + (pg ? ' (J+' + pg.jr + ')' : '')) + mini({ profil: pi ? MOTEUR.profil(pi.p) : null, raison: 'jour hors du cas', confiance: ri.confiance }, 'puis Idaho 7, J' + j + (pi ? ' (J+' + pi.jr + ')' : '')) + '</div><p class="p gris">J0 = premier jour de dry hop (J+7 de fermentation) ; Citra 3 j, puis le second du J3 ; le profil ne bouge plus après 24 h de chaque ajout.</p>'; }
  if (id === 'k4') { var r4 = MOTEUR.resoudre([aj('Citra', 'dryActive', 2, 3, ETAT.k4, 2), aj('Idaho 7', 'dryActive', 2, 5, ETAT.k4, 5)]); z.innerHTML = mini(r4, 'Citra 3 j puis Idaho 7 5 j, dry hop actif, ' + ETAT.k4) + UI.bioHTML(ETAT.k4, 'dryActive', r4); }
  if (id === 'k5') { var r5 = ETAT.k5 === 'ens' ? MOTEUR.resoudre([aj('Citra', 'dryPost', 2, 3), aj('Galaxy', 'dryPost', 2, 3)]) : MOTEUR.resoudre([aj('Citra', 'dryPost', 4, 3)]); z.innerHTML = (ETAT.k5 === 'ens' ? '<div data-role="ajout"><span data-houblon="Citra">Citra</span> + <span data-houblon="Galaxy">Galaxy</span>, 2 + 2 g/L, 3 j, dose totale 4 g/L</div>' : '') + mini(r5, ETAT.k5 === 'ens' ? 'ensemble' : 'Citra seul') + (r5.apports ? '<p class="p" data-nature="simule"><span class="tilde">~</span> Citra apporte ' + Math.round(r5.apports.Citra.tropical) + ' points de tropical sur 100, Galaxy ' + Math.round(r5.apports.Galaxy.tropical) + ' ; ensemble = ' + Math.round(r5.facteur.tropical * 100) + ' % de la somme</p>' : ''); }
}
function score() { var n = Object.keys(SCORE).filter(function (k) { return SCORE[k]; }).length, t = Object.keys(SCORE).length; document.getElementById('score').textContent = n + ' / ' + t + ' paris'; var f = document.getElementById('score-fin'); if (f) f.textContent = n + ' bon' + (n > 1 ? 's' : '') + ' pari' + (n > 1 ? 's' : '') + ' sur ' + t; }
document.addEventListener('click', function (e) {
  var x;
  if ((x = e.target.closest('[data-choix]'))) {
    var c = x.closest('[data-pari]'), id = c.dataset.pari, v = x.dataset.choix, bon = BON[id].indexOf(v) >= 0;
    c.querySelectorAll('[data-choix]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === x)); b.classList.toggle('bon', BON[id].indexOf(b.dataset.choix) >= 0); });
    SCORE[id] = bon; score();
    document.getElementById(id + '-v').textContent = bon ? 'Bien vu : ' + x.textContent + '.' : 'Ton pari : ' + x.textContent + '. Le moteur dit : ' + c.querySelector('[data-choix="' + BON[id][0] + '"]').textContent + (BON[id].length > 1 ? ' (ou ' + c.querySelector('[data-choix="' + BON[id][1] + '"]').textContent + ')' : '') + '.';
    c.querySelector('.revele').hidden = false; jeu(id); return;
  }
  if ((x = e.target.closest('[data-suivant]'))) { var c = x.closest('[data-pari]'), n = c.nextElementSibling; c.hidden = true; if (n) { n.hidden = false; n.scrollIntoView({ block: 'start' }); } score(); return; }
  if ((x = e.target.closest('[data-rejouer]'))) { SCORE = {}; document.querySelectorAll('[data-pari]').forEach(function (c, i) { c.hidden = i !== 0; var r = c.querySelector('.revele'); if (r) r.hidden = true; c.querySelectorAll('[data-choix]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); b.classList.remove('bon'); }); }); score(); window.scrollTo(0, 0); return; }
  if ((x = e.target.closest('[data-jeu="k4"][data-levure]'))) { ETAT.k4 = x.dataset.levure; x.parentElement.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-checked', String(b === x)); }); jeu('k4'); return; }
  if ((x = e.target.closest('[data-k5]'))) { ETAT.k5 = x.dataset.k5; x.parentElement.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-checked', String(b === x)); }); jeu('k5'); return; }
});
document.addEventListener('input', function (e) { var t = e.target; if (t.dataset.jeu) jeu(t.dataset.jeu); });
score();
`;

Z.ecrire(ICI + '/etat.html', Z.page({ titre: 'z5 · Le pari', commentaire: 'Lot 21 · z5 : cinq paris, un par question du brasseur ; la carte se retourne sur le simulé des options (~, moteur réel), la vraie valeur qui tranche, le pourquoi, et un réglage pour rejouer. ' + Z.DONNEES_NOTE, css, corps, js }));
