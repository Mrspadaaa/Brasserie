// sbu1 — froide : u4 au propre. Son mot du 19.10 : « Substitution, ça serait plus du u4 ». Le classement chiffré
// (l'inconnu en plage hachurée), puis le face-à-face à IBU égal, dans le blanc de ses maquettes, la croix, le pied.
import { AVANT, CLES, COUL, IBU0, JET, LISTE, NOM, NUG, alphaTxt, barre, barreData, croix, delta, doseTxt, fr, g, ic, legende, lentille, lot, nomH, pi, plage, plageTxt, point, stock, stockNugget, usage } from './serie/socle.mjs';

const X = (s) => Math.max(0, Math.min(100, ((s - 50) / 50) * 100)).toFixed(1) + '%';
const pictos = (fs) => (fs.length ? fs.slice(0, 6).map((f) => pi(f, 15)).join('') : '<span class="sbu1-rien">rien</span>');
const premier = LISTE.find((r) => r.stock.etat === 'en stock' && r.stock.suffisant) || LISTE[0];
const sur = LISTE.find((r) => r.stock.etat === 'à acheter' && !plage(r));

const ligne = (r, i) => {
  const p = plage(r);
  const piste = p
    ? '<i class="sbu1-pl su-hachure" style="left:' + X(p[0]) + ';width:calc(' + X(p[1]) + ' - ' + X(p[0]) + ')"></i><b class="sbu1-v num sbu1-vp">' + p[0] + '–' + p[1] + '</b>'
    : '<i class="sbu1-pt" style="left:' + X(r.score) + ';background:' + COUL[r.cle] + '"></i><b class="sbu1-v num">' + r.score + '</b>';
  return '<button type="button" class="sbu1-l' + (r === premier ? ' sbu1-on' : '') + '" data-i="' + i + '" aria-pressed="' + (r === premier) + '">'
    + '<span class="sbu1-n">' + point(r.cle, r.nom, 9) + nomH(r.houblon, '', true) + stock(r) + '</span>'
    + '<span class="sbu1-s num">' + alphaTxt(r.houblon) + ' · ' + g(r.doseExacte) + '</span>'
    + '<span class="sbu1-tr"><i class="sbu1-g1"></i><i class="sbu1-g2"></i>' + piste + '</span></button>';
};

const donnees = LISTE.map((r) => ({
  nom: r.nom, alpha: alphaTxt(r.houblon) + (lot(r.houblon) ? ' lot' : ''), pl: plageTxt(r.houblon), us: r.houblon.role.mot,
  dose: doseTxt(r), ibu: '~' + Math.round(r.ibuApres.ibu.valeur), perd: pictos(r.familles.perd), gagne: pictos(r.familles.gagne),
  b: barreData(r.biere), coul: COUL[r.cle], court: g(r.doseExacte),
}));

const corps = '<main class="sbu1-e">'
  + '<header class="sbu1-h">' + croix() + '<h1>Lequel à la place de Nugget&nbsp;?</h1>'
  + legende('sbu1', ['<b>●</b> score de proximité du moteur, 50 à 100', '<i class="sbu1-lh su-hachure"></i> plage : une composante (huiles) inconnue, laissée ouverte', ic('boite', 12) + ' au stock · ' + ic('panier', 12) + ' à acheter', 'barres : ma bière après, le rond = avec Nugget'], 'su-droite') + '</header>'
  + '<section class="sbu1-ref">' + point(NUG.cle, NUG.nom, 10) + nomH(NUG) + '<span class="num">' + alphaTxt(NUG) + '</span><span class="num sbu1-gr">' + plageTxt(NUG) + '</span>' + usage(NUG.role.mot) + stockNugget()
  + '<span class="sbu1-ctx num">46 g · 60′ · ' + IBU0 + ' IBU</span></section>'
  + '<p class="sbu1-verdict">Au stock&nbsp;: <b>' + premier.nom + ' ' + premier.score + '</b>. À acheter&nbsp;: <b>' + sur.nom + ' ' + sur.score + '</b>, rien d’inconnu.</p>'
  + '<div class="sbu1-ax"><span></span><span class="sbu1-axl"><i style="left:15%">partiel</i><i style="left:45%">proche</i><i style="left:80%">très proche</i></span></div>'
  + '<div class="sbu1-liste">' + LISTE.map(ligne).join('') + '</div>'
  + '<section class="sbu1-ff" aria-label="Face à face, même IBU"><div class="sbu1-fft"><h2>Face à face, même IBU</h2>' + lentille() + '</div>'
  + '<div class="sbu1-g"><span></span><b>' + NUG.nom + '</b><b data-x="nom" style="--c:' + COUL[premier.cle] + '">' + premier.nom + '</b>'
  + '<span class="sbu1-k">α</span><span class="num">' + alphaTxt(NUG) + ' lot</span><span class="num" data-x="alpha"></span>'
  + '<span class="sbu1-k">usage</span><span>' + usage(NUG.role.mot) + '</span><span data-x="us"></span>'
  + '<span class="sbu1-k">dose</span><span class="num">46 g</span><span class="num" data-x="dose"></span>'
  + '<span class="sbu1-k">IBU</span><span class="num">' + IBU0 + '</span><span class="num" data-x="ibu"></span>'
  + '<span class="sbu1-k">perd</span><span class="sbu1-gr">—</span><span class="sbu1-pp" data-x="perd"></span>'
  + '<span class="sbu1-k">gagne</span><span class="sbu1-gr">—</span><span class="sbu1-pp" data-x="gagne"></span></div>'
  + '<div class="sbu1-b"><span class="sbu1-bt">ma bière après</span>' + CLES.map((f) => '<span class="sbu1-bl">' + pi(f, 16) + '<span style="color:' + JET[f].texte + '">' + NOM[f] + '</span>' + barre(f, premier.biere) + '<b class="num" data-d="' + f + '">' + delta(premier.biere, f) + '</b></span>').join('') + '</div>'
  + '<p class="sbu1-note">À 60′, l’arôme part à l’ébullition&nbsp;: le remplaçant change surtout l’amertume. Résineux reste hors du style (dégusté).</p></section>'
  + '</main><footer class="sbu1-pied"><p class="num" data-x="phrase"></p><div class="su-pied"><button class="su-annuler" type="button">Annuler</button><button class="su-remplacer" type="button">Remplacer ›</button></div></footer>';

const css = `
.sbu1-e { max-width:390px; margin:0 auto; padding:6px 12px 130px; display:flex; flex-direction:column; gap:7px; }
.sbu1-h { display:flex; align-items:center; gap:10px; }
.sbu1-h h1 { font-size:18px; font-weight:700; flex:1; }
.sbu1-lh { display:inline-block; width:22px; height:10px; border-radius:2px; }
.sbu1-ref { display:flex; flex-wrap:wrap; align-items:center; gap:4px 7px; padding:7px 10px; border-radius:8px; background:var(--surf); border-left:4px solid #0072b2; font-size:14px; }
.sbu1-gr { color:var(--gris); font-size:12px; }
.sbu1-ctx { margin-left:auto; font-size:13px; }
.sbu1-verdict { font-size:16px; line-height:1.3; padding-left:10px; border-left:3px solid var(--encre); }
.sbu1-ax { display:grid; grid-template-columns:154px 1fr; padding-right:4px; font-size:11px; color:var(--gris); height:14px; }
.sbu1-axl { position:relative; margin-right:34px; }
.sbu1-axl i { position:absolute; font-style:normal; transform:translateX(-50%); white-space:nowrap; }

.sbu1-liste { display:flex; flex-direction:column; }
.sbu1-l { display:grid; grid-template-columns:150px 1fr; grid-template-rows:auto auto; column-gap:0; align-items:center; text-align:left; padding:3px 4px; border-radius:4px; min-height:36px; border-bottom:1px solid #f0f0f3; }
.sbu1-l.sbu1-on { background:var(--surf2); }
.sbu1-n { display:flex; align-items:center; gap:5px; font-size:14px; grid-row:1; min-width:0; }
.sbu1-n .su-nom { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.sbu1-s { grid-row:2; grid-column:1; font-size:11px; color:var(--gris); padding-left:14px; }
.sbu1-tr { grid-row:1 / 3; grid-column:2; position:relative; height:22px; margin-right:34px; }
.sbu1-tr::before { content:""; position:absolute; left:0; right:0; top:9px; height:4px; border-radius:2px; background:#d9d9df; }
.sbu1-tr .sbu1-g1, .sbu1-tr .sbu1-g2 { position:absolute; top:0; bottom:0; width:1px; background:#e3e3e8; }
.sbu1-g1 { left:30%; } .sbu1-g2 { left:60%; }
.sbu1-pt { position:absolute; top:5px; width:12px; height:12px; margin-left:-6px; border-radius:50%; }
.sbu1-pl { position:absolute; top:6px; height:10px; border-radius:2px; border:1px solid #9a9aa6; }
.sbu1-v { position:absolute; right:-34px; top:2px; font-size:13px; width:30px; text-align:right; }
.sbu1-vp { font-size:11px; right:-36px; top:3px; width:36px; letter-spacing:-.06em; }
.sbu1-ff { border-top:2px solid var(--encre); padding-top:8px; display:flex; flex-direction:column; gap:8px; margin-top:4px; }
.sbu1-fft { display:flex; align-items:center; justify-content:space-between; }
.sbu1-fft h2 { font-size:16px; }
.sbu1-g { display:grid; grid-template-columns:58px 1fr 1fr; gap:5px 8px; align-items:center; font-size:14px; }
.sbu1-g > b { font-size:15px; padding-bottom:2px; border-bottom:3px solid #0072b2; }
.sbu1-g > b[data-x] { border-color:var(--c); }
.sbu1-k { color:var(--gris); font-size:12px; }
.sbu1-pp { display:flex; gap:3px; flex-wrap:wrap; min-height:16px; }
.sbu1-rien { color:var(--gris); font-size:12px; }
.sbu1-b { display:flex; flex-direction:column; gap:6px; background:var(--surf); border-radius:8px; padding:8px 10px; }
.sbu1-bt { font-size:12px; color:var(--gris); }
.sbu1-bl { display:grid; grid-template-columns:18px 70px 1fr 40px; gap:6px; align-items:center; font-size:13px; font-weight:600; }
.sbu1-bl b { text-align:right; font-size:12px; }
.sbu1-note { font-size:12px; color:var(--gris); }
.sbu1-pied { position:fixed; left:0; right:0; bottom:0; background:#fff; border-top:1px solid var(--trait); padding:8px 12px 12px; max-width:390px; margin:0 auto; display:flex; flex-direction:column; gap:6px; z-index:20; }
.sbu1-pied p { font-size:13px; }
`;

function script() {
  var L = window.SU_DATA.liste, sel = 0;
  for (var k = 0; k < L.length; k++) if (L[k].nom === window.SU_DATA.premier) sel = k;
  function montrer(i) {
    var r = L[i]; sel = i;
    document.querySelectorAll('.sbu1-l').forEach(function (b) { var on = +b.dataset.i === i; b.classList.toggle('sbu1-on', on); b.setAttribute('aria-pressed', String(on)); });
    var x = function (n) { return document.querySelector('[data-x="' + n + '"]'); };
    x('nom').textContent = r.nom; x('nom').style.setProperty('--c', r.coul);
    x('alpha').innerHTML = r.alpha + (r.pl ? ' <span class="sbu1-gr">' + r.pl + '</span>' : '');
    x('us').innerHTML = '<span class="su-us" data-role="usage">' + r.us + '</span>';
    x('dose').textContent = r.dose; x('ibu').textContent = r.ibu; x('perd').innerHTML = r.perd; x('gagne').innerHTML = r.gagne;
    x('phrase').innerHTML = '46 g de Nugget → <b>' + r.court + ' de ' + r.nom + '</b>';
    document.querySelectorAll('.sbu1-b .su-piste').forEach(function (p) {
      var f = p.dataset.f, v = r.b[f], rem = p.querySelector('.su-rem'); if (!v || !rem) return;
      rem.style.setProperty('--ws', v.ws); rem.style.setProperty('--wa', v.wa); rem.style.background = v.c;
      document.querySelector('[data-d="' + f + '"]').textContent = v.d;
    });
  }
  document.querySelectorAll('.sbu1-l').forEach(function (b) { b.addEventListener('click', function () { montrer(+b.dataset.i); }); });
  if (window.SU.choix) montrer(+window.SU.choix); else montrer(sel);
}

export default { nom: 'u4 au propre', chaleur: 'froide', css, corps, script, donnees: { liste: donnees, premier: premier.nom } };
