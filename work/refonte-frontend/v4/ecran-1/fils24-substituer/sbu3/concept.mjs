// sbu3 — tiède : le diff de la recette. Forme imposée : la relecture d'un changement, ligne retirée, ligne ajoutée,
// puis ce que la bière en dit, ligne à ligne. Chaque remplaçant est un autre diff, prêt à appliquer.
import { AVANT, CLES, COUL, FAM, IBU0, JET, LISTE, NOM, NUG, alphaTxt, barre, barreData, croix, delta, g, legende, lentille, lot, nomH, pi, plageTxt, point, stock, stockNugget, usage } from '../sbu1/serie/socle.mjs';

const premier = LISTE.find((r) => r.stock.etat === 'en stock' && r.stock.suffisant) || LISTE[0];
const pictos = (fs, max = 6) => (fs.length ? fs.slice(0, max).map((f) => pi(f, 15)).join('') : '<span class="sbu3-gr">rien</span>');
const v = (b, f) => (b.profil[f].valeur ? '~' + Math.round(b.profil[f].valeur.centre) : '?');
// Les familles du diff : celles du style et celles qui bougent d'un point au moins.
const bougent = (r) => [...CLES, ...FAM.filter((f) => !CLES.includes(f) && !['~=', '?'].includes(delta(r.biere, f)))].slice(0, 7);

const plus = (r) => '<span class="sbu3-c">' + nomH(r.houblon) + ' <b class="num">' + g(r.doseExacte) + '</b> <span class="num">60′ · ' + alphaTxt(r.houblon) + '</span> ' + usage(r.houblon.role.mot) + stock(r) + '</span>';
const hunk = (r) => {
  const lignes = bougent(r).map((f) => '<div class="sbu3-l sbu3-ctx" data-f="' + f + '"><i class="sbu3-n">·</i>' + pi(f, 15) + '<span class="sbu3-fn" style="color:' + JET[f].texte + '">' + NOM[f] + '</span>'
    + '<span class="num sbu3-av">' + v(AVANT, f) + '</span><span class="sbu3-fl">→</span><b class="num">' + v(r.biere, f) + '</b>' + barre(f, r.biere) + (r.biere.profil[f].horsStyle ? '<span class="sbu3-hs">hors style</span>' : '<span class="sbu3-hs"></span>') + '</div>').join('');
  return '<div class="sbu3-l sbu3-moins" style="--c:#0072b2"><i class="sbu3-n">−</i><span class="sbu3-c">' + nomH(NUG) + ' <b class="num">46 g</b> <span class="num">60′ · ' + alphaTxt(NUG) + '</span> ' + usage(NUG.role.mot) + stockNugget() + '</span></div>'
    + '<div class="sbu3-l sbu3-plus" style="--c:' + COUL[r.cle] + '"><i class="sbu3-n">+</i>' + plus(r) + '</div>'
    + '<div class="sbu3-at num">@@ ma bière · IBU ' + IBU0 + ' → ~' + Math.round(r.ibuApres.ibu.valeur) + ' @@</div>'
    + lignes
    + '<div class="sbu3-at num">@@ ses fiches face à Nugget @@</div>'
    + '<div class="sbu3-l sbu3-ctx"><i class="sbu3-n">−</i><span class="sbu3-k">perd</span><span class="sbu3-pp">' + pictos(r.familles.perd) + '</span></div>'
    + '<div class="sbu3-l sbu3-ctx"><i class="sbu3-n">+</i><span class="sbu3-k">gagne</span><span class="sbu3-pp">' + pictos(r.familles.gagne) + '</span></div>';
};
const autre = (r, i) => '<button type="button" class="sbu3-alt' + (r === premier ? ' sbu3-on' : '') + '" data-i="' + i + '" style="--c:' + COUL[r.cle] + '">'
  + '<span class="sbu3-a1"><i class="sbu3-n">+</i>' + point(r.cle, r.nom, 8) + nomH(r.houblon, '', true) + '<b class="num">' + g(r.doseExacte) + '</b><span class="num sbu3-gr">' + alphaTxt(r.houblon) + '</span>' + stock(r) + '<span class="sbu3-sc num">' + r.score + '</span></span>'
  + '<span class="sbu3-a2"><span class="sbu3-k">−</span>' + pictos(r.familles.perd, 5) + '<span class="sbu3-k">+</span>' + pictos(r.familles.gagne, 3) + '</span></button>';

const corps = '<main class="sbu3-e">'
  + '<header class="sbu3-h">' + croix() + '<div><p class="sbu3-fil num">recette · stout 16D · houblons</p><h1>Lequel à la place de Nugget&nbsp;?</h1></div></header>'
  + '<div class="sbu3-bar"><span class="sbu3-tag num">1 ligne changée</span>' + legende('sbu3', ['− la ligne retirée, + la ligne ajoutée', '~ simulé : ma bière avant → après', 'le rond de la barre : avec Nugget', 'chiffre à droite : proximité du moteur, 50 à 100']) + lentille() + '</div>'
  + '<section class="sbu3-diff" data-x="diff">' + hunk(premier) + '</section>'
  + '<h2 class="sbu3-t">Autres changements possibles <span class="sbu3-gr">· même IBU à 60′</span></h2>'
  + '<div class="sbu3-alts">' + LISTE.map(autre).join('') + '</div>'
  + '</main><footer class="sbu3-pied"><div class="su-pied"><button class="su-annuler" type="button">Annuler</button><button class="su-remplacer" type="button" data-x="go">Remplacer ›</button></div></footer>';

const css = `
.sbu3-e { max-width:390px; margin:0 auto; padding:6px 12px 80px; display:flex; flex-direction:column; gap:8px; }
.sbu3-h { display:flex; align-items:center; gap:10px; }
.sbu3-h h1 { font-size:18px; font-weight:700; }
.sbu3-fil { font-size:11px; color:var(--gris); }
.sbu3-bar { display:flex; align-items:center; gap:8px; }
.sbu3-bar .su-seg { margin-left:auto; }
.sbu3-tag { font-size:11px; height:22px; padding:0 8px; border-radius:11px; border:1px solid #c9cad2; display:inline-flex; align-items:center; }
.sbu3-diff { border:1px solid #d6d6dd; border-radius:8px; overflow:hidden; font-size:13px; }
.sbu3-l { display:flex; align-items:center; gap:6px; min-height:27px; padding:1px 8px 1px 0; border-bottom:1px solid #f0f0f3; }
.sbu3-n { width:24px; flex:none; text-align:center; font-style:normal; font-family:var(--mono); color:var(--gris); align-self:stretch; display:flex; align-items:center; justify-content:center; background:#f7f7f9; }
.sbu3-moins, .sbu3-plus { min-height:46px; position:relative; }
.sbu3-moins .sbu3-n, .sbu3-plus .sbu3-n { color:var(--encre); font-weight:700; font-size:18px; background:#fff; box-shadow:inset 5px 0 0 var(--c); }
.sbu3-moins { background:#f3f3f6; }
.sbu3-moins .su-nom { text-decoration:line-through 2px var(--gris); }
.sbu3-plus { background:#fff; box-shadow:inset 0 0 0 2px var(--c); }
.sbu3-c { display:flex; flex-wrap:wrap; align-items:center; gap:3px 6px; font-size:14px; }
.sbu3-c b { font-size:15px; }
.sbu3-at { font-size:11px; color:#3b3b8f; background:#eef0fb; padding:4px 8px; }
.sbu3-ctx { font-size:13px; }
.sbu3-fn { width:62px; font-weight:600; }
.sbu3-av { width:30px; text-align:right; color:var(--gris); font-size:12px; }
.sbu3-fl { color:var(--gris); font-size:12px; }
.sbu3-ctx b.num { width:30px; font-size:13px; }
.sbu3-ctx .su-piste { flex:1; }
.sbu3-hs { width:56px; font-size:11px; color:#c2410c; font-weight:600; text-align:right; }
.sbu3-k { font-size:12px; color:var(--gris); width:38px; }
.sbu3-pp { display:flex; gap:4px; }
.sbu3-gr { color:var(--gris); font-size:12px; font-weight:400; }
.sbu3-t { font-size:15px; margin-top:2px; }
.sbu3-alts { display:flex; flex-direction:column; gap:4px; }
.sbu3-alt { display:flex; flex-direction:column; gap:3px; text-align:left; border:1px solid #e3e3e8; border-left:4px solid var(--c); border-radius:4px; padding:5px 8px 5px 0; }
.sbu3-alt.sbu3-on { border-color:var(--encre); border-left-color:var(--c); background:var(--surf); }
.sbu3-a1 { display:flex; align-items:center; gap:5px; font-size:14px; }
.sbu3-a1 .sbu3-n { background:none; width:20px; }
.sbu3-sc { margin-left:auto; font-weight:700; font-size:14px; }
.sbu3-a2 { display:flex; align-items:center; gap:3px; padding-left:24px; }
.sbu3-a2 .sbu3-k { width:auto; margin:0 2px 0 4px; }
.sbu3-pied { position:fixed; left:0; right:0; bottom:0; background:#fff; border-top:1px solid var(--trait); padding:8px 12px 12px; max-width:390px; margin:0 auto; z-index:20; }
`;

function script() {
  var L = window.SU_DATA.hunks;
  function montrer(i) {
    document.querySelectorAll('.sbu3-alt').forEach(function (b) { b.classList.toggle('sbu3-on', +b.dataset.i === i); });
    document.querySelector('[data-x="diff"]').innerHTML = L[i];
  }
  document.querySelectorAll('.sbu3-alt').forEach(function (b) { b.addEventListener('click', function () { montrer(+b.dataset.i); }); });
  if (window.SU.choix) montrer(+window.SU.choix);
}

export default { nom: 'le diff de la recette', chaleur: 'tiède', css, corps, script, donnees: { hunks: LISTE.map(hunk) } };
