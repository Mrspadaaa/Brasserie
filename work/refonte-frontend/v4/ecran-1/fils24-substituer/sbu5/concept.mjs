// sbu5 — tiède : la vitrine. Forme imposée : la grille de fiches produit, deux par rangée. Chaque remplaçant montre
// sa silhouette posée sur le fantôme de Nugget : on choisit la forme qui recouvre le mieux, puis on lit α, usage,
// dose à même IBU et la proximité, détaillée en ses trois parts.
import { CLES, COUL, FAM, IBU0, JET, LISTE, NOM, NUG, alphaTxt, barre, barreData, croix, delta, g, legende, lentille, nomH, pi, plageTxt, point, stock, stockNugget, usage } from '../sbu1/serie/socle.mjs';

const premier = LISTE.find((r) => r.stock.etat === 'en stock' && r.stock.suffisant) || LISTE[0];
const val = (h, f) => { const x = h.familles[f]; return x.niveau === 'non décrit' ? 0 : x.niveau === 'marqué' ? 1 : 0.55; };
function silhouette(h, t, pictos) {
  const c = t / 2, R = t / 2 - (pictos ? 18 : 6), n = FAM.length, ang = (i) => (-90 + (360 / n) * i) * Math.PI / 180;
  const pts = (hh) => FAM.map((f, i) => { const r = R * (0.08 + 0.92 * val(hh, f)); return (c + Math.cos(ang(i)) * r).toFixed(1) + ',' + (c + Math.sin(ang(i)) * r).toFixed(1); }).join(' ');
  let s = '<svg class="sbu5-sil" width="' + t + '" height="' + t + '" viewBox="0 0 ' + t + ' ' + t + '" aria-hidden="true">'
    + '<circle cx="' + c + '" cy="' + c + '" r="' + R + '" fill="none" stroke="#ececf1"/><circle cx="' + c + '" cy="' + c + '" r="' + (R / 2) + '" fill="none" stroke="#ececf1"/>'
    + '<polygon points="' + pts(NUG) + '" fill="none" stroke="#5b5b66" stroke-width="1.5" stroke-dasharray="3 3"/>';
  if (h !== NUG) s += '<polygon points="' + pts(h) + '" fill="' + COUL[h.cle] + '33" stroke="' + COUL[h.cle] + '" stroke-width="2.2" stroke-linejoin="round"/>';
  if (pictos) FAM.forEach((f, i) => { const x = c + Math.cos(ang(i)) * (R + 10), y = c + Math.sin(ang(i)) * (R + 10); s += '<svg x="' + (x - 7).toFixed(1) + '" y="' + (y - 7).toFixed(1) + '" width="14" height="14" data-famille="' + f + '" aria-label="' + NOM[f] + '"><use href="#p-' + f + '"/></svg>'; });
  return s + '</svg>';
}
const part = (n, v) => '<span class="sbu5-pa"><span>' + n + '</span>' + (v == null ? '<i class="sbu5-pv su-hachure"></i><b class="num">?</b>' : '<i class="sbu5-pv"><i style="width:' + v + '%"></i></i><b class="num">' + v + '</b>') + '</span>';
const cites = (h) => FAM.filter((f) => h.familles[f].niveau !== 'non décrit').sort((a, b) => val(h, b) - val(h, a)).slice(0, 4);
const carte = (r, i) => '<button type="button" class="sbu5-c' + (r === premier ? ' sbu5-on' : '') + '" data-i="' + i + '" style="--c:' + COUL[r.cle] + '">'
  + '<span class="sbu5-cs">' + silhouette(r.houblon, 96, false) + '<span class="sbu5-sc num">' + r.score + '</span></span>'
  + '<span class="sbu5-cn">' + point(r.cle, r.nom, 8) + nomH(r.houblon) + stock(r) + '</span>'
  + '<span class="sbu5-cf">' + cites(r.houblon).map((f) => pi(f, 14)).join('') + '</span>'
  + '<span class="sbu5-ca"><span class="num">' + alphaTxt(r.houblon) + '</span>' + usage(r.houblon.role.mot) + '</span>'
  + '<b class="sbu5-cd num">' + g(r.doseExacte) + '</b>'
  + '<span class="sbu5-parts">' + part('arôme', r.composantes.arome) + part('huiles', r.composantes.huiles) + part('amer', r.composantes.amertume) + '</span></button>';

const corps = '<main class="sbu5-e">'
  + '<header class="sbu5-h">' + croix() + '<h1>À la place de Nugget</h1>' + legende('sbu5', ['pointillé gris : Nugget ; du centre au bord : non décrit (pas zéro), cité, marqué dans ses fiches', 'en couleur : celle du remplaçant, posée dessus', 'chiffre : proximité du moteur, détaillée en arôme, huiles, amertume ; ? = inconnu', 'g : dose pour le même IBU à 60′'], 'su-droite') + '</header>'
  + '<section class="sbu5-ref">' + silhouette(NUG, 132, true) + '<div class="sbu5-rd"><span class="sbu5-cn">' + point(NUG.cle, NUG.nom, 10) + nomH(NUG) + stockNugget() + '</span>'
  + '<span class="num">' + alphaTxt(NUG) + ' <span class="sbu5-gr">' + plageTxt(NUG) + '</span></span>' + usage(NUG.role.mot)
  + '<span class="sbu5-ctx num">46 g · 60′ · ' + IBU0 + ' IBU</span><span class="sbu5-gr">À 60′, l’amertume pèse 60 % ; « arôme » : rien d’étranger à Nugget.</span></div></section>'
  + '<div class="sbu5-grille">' + LISTE.map(carte).join('') + '</div>'
  + '<section class="sbu5-biere"><div class="sbu5-bt"><b>Ma bière après</b><span class="sbu5-gr" data-x="qui">' + premier.nom + '</span>' + lentille() + '</div>'
  + CLES.map((f) => '<div class="sbu5-bl">' + pi(f, 15) + '<span style="color:' + JET[f].texte + '">' + NOM[f] + '</span>' + barre(f, premier.biere) + '<b class="num" data-d="' + f + '">' + delta(premier.biere, f) + '</b></div>').join('') + '</section>'
  + '</main><footer class="sbu5-pied"><p data-x="phrase">46 g de Nugget → <b class="num">' + g(premier.doseExacte) + '</b> de <b>' + premier.nom + '</b></p><button class="su-remplacer" type="button">Remplacer ›</button></footer>';

const css = `
.sbu5-e { max-width:390px; margin:0 auto; padding:6px 12px 84px; display:flex; flex-direction:column; gap:8px; }
.sbu5-h { display:flex; align-items:center; gap:10px; }
.sbu5-h h1 { font-size:19px; font-weight:700; flex:1; }
.sbu5-ref { display:flex; gap:8px; align-items:center; padding:4px 8px 4px 0; border-bottom:1px solid var(--trait); }
.sbu5-rd { display:flex; flex-direction:column; gap:4px; font-size:14px; align-items:flex-start; }
.sbu5-ctx { font-size:13px; }
.sbu5-gr { color:var(--gris); font-size:12px; }
.sbu5-grille { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.sbu5-c { display:flex; flex-direction:column; gap:3px; align-items:flex-start; text-align:left; padding:6px 8px 8px; border-radius:8px; background:var(--surf); border:2px solid transparent; position:relative; }
.sbu5-c.sbu5-on { background:#fff; border-color:var(--c); box-shadow:0 8px 20px -14px rgba(22,22,26,.6); }
.sbu5-cs { position:relative; align-self:center; }
.sbu5-sc { position:absolute; right:-34px; top:0; font-size:18px; font-weight:700; }
.sbu5-cn { display:flex; align-items:center; gap:4px; font-size:14px; }
.sbu5-cf { display:flex; gap:3px; min-height:14px; }
.sbu5-ca { display:flex; align-items:center; gap:5px; font-size:12px; }
.sbu5-cd { font-size:17px; }
.sbu5-parts { display:flex; flex-direction:column; gap:2px; width:100%; }
.sbu5-pa { display:grid; grid-template-columns:40px 1fr 22px; align-items:center; gap:4px; font-size:11px; color:var(--gris); }
.sbu5-pa b { font-size:11px; color:var(--encre); text-align:right; }
.sbu5-pv { display:block; height:5px; border-radius:2px; background:#e3e3e8; position:relative; overflow:hidden; }
.sbu5-pv i { position:absolute; left:0; top:0; bottom:0; background:var(--encre); }
.sbu5-biere { display:flex; flex-direction:column; gap:5px; border-top:1px solid var(--trait); padding-top:6px; }
.sbu5-bt { display:flex; align-items:center; gap:8px; font-size:14px; }
.sbu5-bt .su-seg { margin-left:auto; }
.sbu5-bl { display:grid; grid-template-columns:16px 70px 1fr 36px; gap:6px; align-items:center; font-size:13px; font-weight:600; }
.sbu5-bl b { font-size:12px; text-align:right; }
.sbu5-pied { position:fixed; left:0; right:0; bottom:0; background:#fff; border-top:1px solid var(--trait); padding:8px 12px 12px; max-width:390px; margin:0 auto; z-index:20; display:flex; align-items:center; gap:10px; }
.sbu5-pied p { font-size:13px; flex:1; line-height:1.25; }
.sbu5-pied .su-remplacer { flex:none; padding:0 18px; }
`;

function script() {
  var L = window.SU_DATA.liste;
  function montrer(i) {
    var r = L[i];
    document.querySelectorAll('.sbu5-c').forEach(function (b) { b.classList.toggle('sbu5-on', +b.dataset.i === i); });
    document.querySelector('[data-x="phrase"]').innerHTML = '46 g de Nugget → <b class="num">' + r.dose + '</b> de <b>' + r.nom + '</b>';
    document.querySelector('[data-x="qui"]').textContent = r.nom;
    document.querySelectorAll('.sbu5-biere .su-piste').forEach(function (p) { var f = p.dataset.f, v = r.b[f], rem = p.querySelector('.su-rem'); if (!v || !rem) return;
      rem.style.setProperty('--ws', v.ws); rem.style.setProperty('--wa', v.wa); rem.style.background = v.c; document.querySelector('[data-d="' + f + '"]').textContent = v.d; });
  }
  document.querySelectorAll('.sbu5-c').forEach(function (b) { b.addEventListener('click', function () { montrer(+b.dataset.i); }); });
  if (window.SU.choix) { montrer(+window.SU.choix); document.querySelectorAll('.sbu5-c')[+window.SU.choix].scrollIntoView({ block: 'center' }); }
}

export default { nom: 'la vitrine', chaleur: 'tiède', css, corps, script, donnees: { liste: LISTE.map((r) => ({ nom: r.nom, dose: g(r.doseExacte), b: barreData(r.biere) })) } };
