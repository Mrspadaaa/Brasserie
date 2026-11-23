// sbu7 — chaude : le nuancier. Chaque houblon est un échantillon de peinture : la bande de ses familles, en
// largeur selon ses fiches (marqué : double, cité : simple). Sur chaque échantillon, un liseré rappelle la bande de
// Nugget : on cherche la teinte qui lui ressemble, comme au magasin de couleurs. Toucher un échantillon le sort du
// nuancier ; ma bière après, au style, dessous.
import { CLES, COUL, FAM, IBU0, JET, LISTE, NOM, NUG, alphaTxt, barre, barreData, croix, delta, g, legende, lentille, nomH, pi, plageTxt, point, stock, stockNugget, usage } from '../sbu1/serie/socle.mjs';

const premier = LISTE.find((r) => r.stock.etat === 'en stock' && r.stock.suffisant) || LISTE[0];
const poids = (h, f) => { const n = h.familles[f].niveau; return n === 'marqué' ? 2 : n === 'cité' ? 1 : 0; };
function bande(h, haut, pictos) {
  const fs = FAM.filter((f) => poids(h, f) > 0), tot = fs.reduce((t, f) => t + poids(h, f), 0);
  if (!tot) return '<span class="sbu7-bd su-hachure" style="height:' + haut + 'px"></span>';
  return '<span class="sbu7-bd" style="height:' + haut + 'px">' + fs.map((f) => '<i data-famille="' + f + '" style="flex:' + poids(h, f) + ';background:' + JET[f].base + '">'
    + (pictos && poids(h, f) / tot >= 0.09 ? '<span class="sbu7-pa">' + pi(f, 14) + '</span>' : '') + '</i>').join('') + autres(h, tot, pictos) + '</span>';
}
function autres(h, tot, txt) { const p = h.partSansFamille; if (!p || p >= 1) return ''; const fl = (tot * p / (1 - p)).toFixed(2); return '<i class="sbu7-au" style="flex:' + fl + '">' + (txt && p >= 0.2 ? '<span>autres ' + Math.round(p * 100) + ' %</span>' : '') + '</i>'; }
const ech = (r, i) => '<button type="button" class="sbu7-ech' + (r === premier ? ' sbu7-on' : '') + '" data-i="' + i + '" style="--r:' + ((i - 4.5) * 0.5).toFixed(2) + 'deg;--c:' + COUL[r.cle] + '">'
  + '<span class="sbu7-g">' + bande(NUG, 5, false) + bande(r.houblon, 40, true) + '</span>'
  + '<span class="sbu7-t"><span class="sbu7-n">' + point(r.cle, r.nom, 8) + nomH(r.houblon, '', true) + stock(r) + '</span><span class="sbu7-m"><span class="num">' + alphaTxt(r.houblon) + '</span>' + usage(r.houblon.role.mot) + '</span>'
  + '<span class="sbu7-m"><b class="num">' + g(r.doseExacte) + '</b><span class="sbu7-sc num">' + r.score + '</span></span></span></button>';

const corps = '<main class="sbu7-e">'
  + '<header class="sbu7-h">' + croix() + '<div class="sbu7-ti"><h1>Quelle teinte à la place de Nugget&nbsp;?</h1><p>ses fiches, famille par famille · même IBU à 60′</p></div>' + legende('sbu7', ['bande : les familles des fiches, marqué = double largeur, cité = simple', 'liseré du haut : la bande de Nugget, pour comparer', 'gris « autres » : mots des fiches hors des 12 familles (vin blanc, groseille…)', 'chiffre : proximité du moteur · g : dose pour ' + IBU0 + ' IBU'], 'su-droite') + '</header>'
  + '<section class="sbu7-ref"><span class="sbu7-rn">' + point(NUG.cle, NUG.nom, 10) + nomH(NUG) + '<span class="num">' + alphaTxt(NUG) + '</span><span class="num sbu7-gr">' + plageTxt(NUG) + '</span>' + usage(NUG.role.mot) + stockNugget() + '<b class="num">46 g</b></span>' + bande(NUG, 46, true) + '</section>'
  + '<div class="sbu7-deck">' + LISTE.map(ech).join('') + '</div>'
  + '<section class="sbu7-biere"><div class="sbu7-bt"><b>Ma bière après</b><span class="sbu7-gr" data-x="qui">' + premier.nom + '</span>' + lentille() + '</div>'
  + CLES.map((f) => '<div class="sbu7-bl">' + pi(f, 15) + '<span style="color:' + JET[f].texte + '">' + NOM[f] + '</span>' + barre(f, premier.biere) + '<b class="num" data-d="' + f + '">' + delta(premier.biere, f) + '</b></div>').join('') + '</section>'
  + '</main><footer class="sbu7-pied"><div class="su-pied"><button class="su-annuler" type="button">Annuler</button><button class="su-remplacer" type="button" data-x="go">Remplacer par ' + premier.nom + ' ›</button></div></footer>';

const css = `
.sbu7-e { max-width:390px; margin:0 auto; padding:6px 12px 80px; display:flex; flex-direction:column; gap:8px; }
.sbu7-h { display:flex; align-items:center; gap:10px; }
.sbu7-ti { flex:1; }
.sbu7-ti h1 { font-size:17px; font-weight:700; line-height:1.15; }
.sbu7-ti p { font-size:12px; color:var(--gris); }
.sbu7-gr { color:var(--gris); font-size:12px; }
.sbu7-ref { display:flex; flex-direction:column; gap:5px; padding:8px; border-radius:8px; border:2px solid var(--encre); }
.sbu7-rn { display:flex; align-items:center; gap:6px; font-size:14px; }
.sbu7-rn b { margin-left:auto; font-size:15px; }
.sbu7-bd { display:flex; width:100%; border-radius:2px; overflow:hidden; gap:1px; background:#fff; }
.sbu7-bd i { display:flex; align-items:center; justify-content:center; min-width:4px; }
.sbu7-au { background:#dcdce2; }
.sbu7-au span { font-style:normal; font-size:11px; color:var(--encre); white-space:nowrap; padding:0 4px; }
.sbu7-pa { width:22px; height:22px; border-radius:50%; background:#fff; display:inline-flex; align-items:center; justify-content:center; }
.sbu7-deck { display:flex; flex-direction:column; gap:0; padding:4px 0; }
.sbu7-ech { display:grid; grid-template-columns:1fr 140px; gap:8px; align-items:center; text-align:left; padding:6px 8px; background:#fff; border:1px solid #e3e3e8; border-left:5px solid var(--c); border-radius:4px; margin-top:-3px; transform:rotate(var(--r)); transform-origin:12% 50%; box-shadow:0 2px 6px -4px rgba(22,22,26,.45); position:relative; transition:transform .2s; }
.sbu7-ech.sbu7-on { transform:translateX(-6px) rotate(0deg) scale(1.02); z-index:3; border-color:var(--encre); border-left-color:var(--c); box-shadow:0 10px 24px -12px rgba(22,22,26,.6); }
.sbu7-g { display:flex; flex-direction:column; gap:2px; }
.sbu7-t { display:flex; flex-direction:column; gap:2px; min-width:0; }
.sbu7-n { display:flex; align-items:center; gap:4px; font-size:14px; white-space:nowrap; }
.sbu7-n .su-nom { overflow:hidden; text-overflow:ellipsis; }
.sbu7-m { display:flex; align-items:center; gap:5px; font-size:12px; }
.sbu7-m b { font-size:14px; }
.sbu7-sc { margin-left:auto; font-weight:700; font-size:14px; }
.sbu7-biere { display:flex; flex-direction:column; gap:5px; border-top:1px solid var(--trait); padding-top:6px; }
.sbu7-bt { display:flex; align-items:center; gap:8px; font-size:14px; }
.sbu7-bt .su-seg { margin-left:auto; }
.sbu7-bl { display:grid; grid-template-columns:16px 70px 1fr 36px; gap:6px; align-items:center; font-size:13px; font-weight:600; }
.sbu7-bl b { font-size:12px; text-align:right; }
.sbu7-pied { position:fixed; left:0; right:0; bottom:0; background:#fff; border-top:1px solid var(--trait); padding:8px 12px 12px; max-width:390px; margin:0 auto; z-index:20; }
`;

function script() {
  var L = window.SU_DATA.liste;
  function montrer(i) {
    var r = L[i];
    document.querySelectorAll('.sbu7-ech').forEach(function (b) { b.classList.toggle('sbu7-on', +b.dataset.i === i); });
    document.querySelector('[data-x="qui"]').textContent = r.nom; document.querySelector('[data-x="go"]').textContent = 'Remplacer par ' + r.nom + ' ›';
    document.querySelectorAll('.sbu7-biere .su-piste').forEach(function (p) { var f = p.dataset.f, v = r.b[f], rem = p.querySelector('.su-rem'); if (!v || !rem) return;
      rem.style.setProperty('--ws', v.ws); rem.style.setProperty('--wa', v.wa); rem.style.background = v.c; document.querySelector('[data-d="' + f + '"]').textContent = v.d; });
  }
  document.querySelectorAll('.sbu7-ech').forEach(function (b) { b.addEventListener('click', function () { montrer(+b.dataset.i); }); });
  if (window.SU.choix) montrer(+window.SU.choix);
}

export default { nom: 'le nuancier', chaleur: 'chaude', css, corps, script, donnees: { liste: LISTE.map((r) => ({ nom: r.nom, b: barreData(r.biere) })) } };
