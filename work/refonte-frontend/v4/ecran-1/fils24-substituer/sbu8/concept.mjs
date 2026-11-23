// sbu8 — chaude : l'équation. L'affiche d'une seule égalité, en très grand : 46 g de Nugget = x g de son
// remplaçant, à 60 IBU des deux côtés. Sous l'égalité, ce que l'arôme y perd et y gagne ; dessous, les autres
// égalités possibles, une par ligne, qu'un toucher monte sur l'affiche.
import { CLES, COUL, IBU0, JET, LISTE, NOM, NUG, alphaTxt, barre, barreData, croix, delta, fr, legende, lentille, lot, nomH, pi, plage, plageTxt, point, stock, stockNugget, usage } from '../sbu1/serie/socle.mjs';

const premier = LISTE.find((r) => r.stock.etat === 'en stock' && r.stock.suffisant) || LISTE[0];
const gros = (x) => fr(x, 1);
const pp = (fs, n) => (fs.length ? fs.slice(0, n).map((f) => pi(f, 22)).join('') : '<span class="sbu8-rien">rien</span>');
const affiche = (r) => '<div class="sbu8-cote sbu8-dr" style="--c:' + COUL[r.cle] + '"><span class="sbu8-g num">' + gros(r.doseExacte) + '<small>g</small></span><span class="sbu8-n">' + point(r.cle, r.nom, 14) + nomH(r.houblon) + '</span>'
  + '<span class="sbu8-meta"><span class="num">' + alphaTxt(r.houblon) + (lot(r.houblon) ? ' lot' : '') + '</span><span class="num sbu8-gr">' + plageTxt(r.houblon) + '</span>' + usage(r.houblon.role.mot) + stock(r) + '</span></div>'
  + '<div class="sbu8-pg"><span class="sbu8-sg">−</span><span class="sbu8-mot">perd</span>' + pp(r.familles.perd, 6) + '</div><div class="sbu8-pg"><span class="sbu8-sg">+</span><span class="sbu8-mot">gagne</span>' + pp(r.familles.gagne, 4) + '<span class="sbu8-prox"><b class="num">' + (plage(r) ? plage(r).join('–') : r.score) + '</b> proche</span></div>';
const autre = (r, i) => '<button type="button" class="sbu8-l' + (r === premier ? ' sbu8-on' : '') + '" data-i="' + i + '" style="--c:' + COUL[r.cle] + '"><span class="sbu8-eq">=</span><b class="num">' + gros(r.doseExacte) + ' g</b>'
  + '<span class="sbu8-ln">' + point(r.cle, r.nom, 9) + nomH(r.houblon, '', true) + stock(r) + '<span class="sbu8-la num">' + alphaTxt(r.houblon) + '</span></span><span class="sbu8-ls num">' + (plage(r) ? plage(r).join('–') : r.score) + '</span></button>';

const corps = '<main class="sbu8-e">'
  + '<header class="sbu8-h">' + croix() + '<p class="sbu8-cap"><b class="num">' + IBU0 + ' IBU</b> à 60′ des deux côtés<br><span>Lequel à la place de Nugget ?</span></p>'
  + legende('sbu8', ['une égalité : la dose qui donne le même IBU à 60′', '− ce que l’arôme des fiches perd, + ce qu’il gagne', 'proche : score du moteur, 50 à 100 ; une plage si une part est inconnue', 'à 60′ l’arôme part surtout à l’ébullition'], 'su-droite') + '</header>'
  + '<section class="sbu8-aff"><div class="sbu8-cote"><span class="sbu8-g num">46<small>g</small></span><span class="sbu8-n">' + point(NUG.cle, NUG.nom, 14) + nomH(NUG) + '</span>'
  + '<span class="sbu8-meta"><span class="num">' + alphaTxt(NUG) + ' lot</span><span class="num sbu8-gr">' + plageTxt(NUG) + '</span>' + usage(NUG.role.mot) + stockNugget() + '</span></div>'
  + '<div class="sbu8-egal">=</div><div data-x="aff">' + affiche(premier) + '</div></section>'
  + '<section class="sbu8-biere"><div class="sbu8-bt"><b>Ma bière après</b>' + lentille() + '</div><div class="sbu8-bg">'
  + CLES.map((f) => '<div class="sbu8-bl"><span class="sbu8-bn">' + pi(f, 14) + '<span style="color:' + JET[f].texte + '">' + NOM[f] + '</span><b class="num" data-d="' + f + '">' + delta(premier.biere, f) + '</b></span>' + barre(f, premier.biere) + '</div>').join('') + '</div></section>'
  + '<section class="sbu8-autres"><h2>Les autres égalités</h2>' + LISTE.map(autre).join('') + '</section>'
  + '</main><footer class="sbu8-pied"><div class="su-pied"><button class="su-annuler" type="button">Annuler</button><button class="su-remplacer" type="button">Remplacer ›</button></div></footer>';

const css = `
.sbu8-e { max-width:390px; margin:0 auto; padding:6px 12px 80px; display:flex; flex-direction:column; gap:10px; }
.sbu8-h { display:flex; align-items:center; gap:10px; }
.sbu8-cap { flex:1; font-size:14px; line-height:1.25; }
.sbu8-cap span { color:var(--gris); font-size:13px; }
.sbu8-gr { color:var(--gris); font-size:12px; }
.sbu8-aff { display:flex; flex-direction:column; gap:2px; padding:10px 12px 12px; border-radius:8px; background:var(--surf); }
.sbu8-cote { display:grid; grid-template-columns:auto 1fr; grid-template-rows:auto auto; column-gap:12px; align-items:end; }
.sbu8-g { grid-row:1 / 3; font-size:64px; font-weight:700; line-height:.9; letter-spacing:-.05em; }
.sbu8-g small { font-size:26px; margin-left:2px; letter-spacing:0; }
.sbu8-n { display:flex; align-items:center; gap:6px; font-size:22px; font-weight:700; }
.sbu8-n .su-nom { text-decoration-thickness:2px; }
.sbu8-meta { display:flex; align-items:center; flex-wrap:wrap; gap:5px; font-size:13px; padding-bottom:6px; }
.sbu8-dr .sbu8-g { color:var(--encre); text-decoration:underline 8px var(--c); text-underline-offset:6px; text-decoration-skip-ink:none; }
.sbu8-egal { font-size:44px; font-weight:300; line-height:.8; padding-left:8px; color:var(--gris); }
.sbu8-pg { display:flex; align-items:center; gap:6px; min-height:30px; margin-top:4px; }
.sbu8-sg { width:22px; font-size:22px; font-weight:700; text-align:center; color:var(--gris); }
.sbu8-mot { font-size:12px; color:var(--gris); width:38px; }
.sbu8-rien { font-size:13px; color:var(--gris); }
.sbu8-prox { margin-left:auto; font-size:13px; color:var(--gris); }
.sbu8-prox b { font-size:22px; color:var(--encre); }
.sbu8-biere { display:flex; flex-direction:column; gap:6px; }
.sbu8-bt { display:flex; align-items:center; justify-content:space-between; font-size:14px; }
.sbu8-bg { display:grid; grid-template-columns:1fr 1fr; gap:8px 14px; }
.sbu8-bl { display:flex; flex-direction:column; gap:3px; }
.sbu8-bn { display:flex; align-items:center; gap:4px; font-size:13px; font-weight:600; }
.sbu8-bn b { margin-left:auto; font-size:12px; }
.sbu8-autres { display:flex; flex-direction:column; }
.sbu8-autres h2 { font-size:14px; color:var(--gris); font-weight:600; margin-bottom:2px; }
.sbu8-l { display:grid; grid-template-columns:22px 82px 1fr 48px; align-items:center; gap:4px; height:38px; text-align:left; border-bottom:1px solid #ececf1; }
.sbu8-l > b { font-size:20px; }
.sbu8-l.sbu8-on { background:var(--surf); box-shadow:inset 4px 0 0 var(--c); }
.sbu8-eq { font-size:20px; color:var(--gris); text-align:center; }
.sbu8-ln { display:flex; align-items:center; gap:5px; font-size:15px; }
.sbu8-la { font-size:11px; color:var(--gris); margin-left:auto; }
.sbu8-ln { min-width:0; }
.sbu8-ls { text-align:right; font-size:13px; font-weight:700; padding-right:4px; }
.sbu8-pied { position:fixed; left:0; right:0; bottom:0; background:#fff; border-top:1px solid var(--trait); padding:8px 12px 12px; max-width:390px; margin:0 auto; z-index:20; }
`;

function script() {
  var L = window.SU_DATA.liste;
  function montrer(i) {
    var r = L[i];
    document.querySelectorAll('.sbu8-l').forEach(function (b) { b.classList.toggle('sbu8-on', +b.dataset.i === i); });
    document.querySelector('[data-x="aff"]').innerHTML = r.aff;
    document.querySelectorAll('.sbu8-biere .su-piste').forEach(function (p) { var f = p.dataset.f, v = r.b[f], rem = p.querySelector('.su-rem'); if (!v || !rem) return;
      rem.style.setProperty('--ws', v.ws); rem.style.setProperty('--wa', v.wa); rem.style.background = v.c; document.querySelector('[data-d="' + f + '"]').textContent = v.d; });
  }
  document.querySelectorAll('.sbu8-l').forEach(function (b) { b.addEventListener('click', function () { montrer(+b.dataset.i); window.scrollTo({ top: 0, behavior: 'smooth' }); }); });
  if (window.SU.choix) montrer(+window.SU.choix);
}

export default { nom: 'l’équation', chaleur: 'chaude', css, corps, script, donnees: { liste: LISTE.map((r) => ({ aff: affiche(r), b: barreData(r.biere) })) } };
