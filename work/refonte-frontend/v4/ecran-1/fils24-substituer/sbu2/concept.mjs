// sbu2 — froide : la carte de l'étape. L'étape Houblons de la base v4.10 est son choix : on remplace Nugget dans
// SA carte, telle qu'il la voit (nom, moment, dose, α, usage, bande des 12 familles, IBU), et les remplaçants sont
// des cartes d'ajout rapide de la même étape. Dessous, le panneau des familles de l'étape, au style.
import { AVANT, COUL, D, FAM, IBU0, JET, LISTE, NOM, NUG, alphaTxt, barre, barreData, croix, delta, g, legende, lentille, nomH, pi, plageTxt, point, stock, stockNugget, usage } from '../sbu1/serie/socle.mjs';

const bande = (h) => '<span class="sbu2-bd" aria-label="ses familles">' + FAM.map((f) => { const n = h.familles[f].niveau;
  return '<i data-famille="' + f + '" class="sbu2-c' + (n === 'marqué' ? ' sbu2-m' : n === 'cité' ? ' sbu2-ci' : '') + '" style="--b:' + JET[f].base + ';--f:' + JET[f].fond + '"></i>'; }).join('') + '</span>';
const premier = LISTE.find((r) => r.stock.etat === 'en stock' && r.stock.suffisant) || LISTE[0];

const carte = (h, dose, ibu, extra, cls, attr) => '<div class="sbu2-carte ' + cls + '" data-fiche="' + h.nom + '" ' + attr + '>'
  + '<div class="sbu2-r1">' + point(h.cle, h.nom, 10) + nomH(h) + '<span class="sbu2-moment">ébullition</span><b class="sbu2-dose num" data-x="dose">' + dose + '</b></div>'
  + '<div class="sbu2-r2"><span class="num" data-x="alpha">' + alphaTxt(h) + '</span><span class="num sbu2-gr" data-x="pl">' + plageTxt(h) + '</span><span data-x="us">' + usage(h.role.mot) + '</span>' + extra + '<b class="sbu2-ibu num" data-x="ibu">' + ibu + '</b></div>'
  + '<div class="sbu2-r3" data-x="bande">' + bande(h) + '</div></div>';

const rapide = (r, i) => '<div class="sbu2-rap' + (r === premier ? ' sbu2-on' : '') + '" data-role="ajout-rapide" data-fiche="' + r.nom + '" data-i="' + i + '" tabindex="0">'
  + '<span class="sbu2-radio"><i></i></span>'
  + '<span class="sbu2-rc"><span class="sbu2-rl">' + point(r.cle, r.nom, 9) + nomH(r.houblon, '', true) + '<span class="num">' + alphaTxt(r.houblon) + '</span>' + usage(r.houblon.role.mot) + stock(r) + '</span>'
  + '<span class="sbu2-rl2"><span class="num">' + g(r.doseExacte) + ' · =' + IBU0 + ' IBU</span>' + bande(r.houblon) + '</span></span>'
  + '<span class="sbu2-prox num" aria-label="proximité ' + r.score + '">' + r.score + '</span></div>';

const famille = (f) => '<div class="sbu2-f"><span class="sbu2-fn">' + pi(f, 16) + '<span style="color:' + JET[f].texte + '"' + (AVANT.profil[f].statut === 'attendue' ? ' class="sbu2-att"' : '') + '>' + NOM[f] + '</span></span>' + barre(f, premier.biere) + '<b class="num" data-d="' + f + '">' + delta(premier.biere, f) + '</b></div>';

const corps = '<main class="sbu2-e">'
  + '<header class="sbu2-h">' + croix() + '<div class="sbu2-tot"><span>IBU <b class="num">' + IBU0 + '</b></span><span class="sbu2-eq">→ ' + IBU0 + '</span><span>OG <b class="num">' + fr3(D.recette.og) + '</b></span><span class="sbu2-st">Stout 16D</span></div></header>'
  + '<p class="sbu2-q">Ébullition <b class="num">60′</b> · remplacer Nugget par…</p>'
  + '<div class="sbu2-pile">'
  + carte(NUG, '46 g', IBU0 + ' IBU', stockNugget() + '<span class="sbu2-res">résine 2/4</span>', 'sbu2-orig', '')
  + '<div class="sbu2-par"><span>par</span></div>'
  + carte(premier.houblon, g(premier.doseExacte), '=' + IBU0 + ' IBU', '', 'sbu2-nouv', 'style="--c:' + COUL[premier.cle] + '" data-x="carte"')
  + '</div>'
  + '<div class="sbu2-lt"><span>Dans l’ordre du moteur, ton stock d’abord</span>' + legende('sbu2', ['bande : les 12 familles de ses fiches', 'plein : marqué · liseré : cité · gris : non décrit', 'rond pointillé : proximité avec Nugget, 50 à 100', 'g : dose pour le même IBU à 60′'], 'su-droite') + '</div>'
  + '<div class="sbu2-liste">' + LISTE.slice(0, 7).map(rapide).join('') + '</div>'
  + '<section class="sbu2-pan"><div class="sbu2-pt"><b>Ma bière, après</b><span class="sbu2-gr">rond = avec Nugget</span>' + lentille() + '</div>'
  + '<div class="sbu2-grille">' + FAM.map(famille).join('') + '</div></section>'
  + '</main><footer class="sbu2-pied"><div class="su-pied"><button class="su-annuler" type="button">Annuler</button><button class="su-remplacer" type="button" data-x="go">Remplacer par ' + premier.nom + ' ›</button></div></footer>';
function fr3(x) { return String(x.toFixed(3)).replace('.', ','); }

const css = `
.sbu2-e { max-width:390px; margin:0 auto; padding:6px 12px 80px; display:flex; flex-direction:column; gap:8px; }
.sbu2-h { display:flex; align-items:center; gap:10px; }
.sbu2-tot { flex:1; display:flex; align-items:baseline; gap:10px; height:44px; padding:0 14px; border:1px solid var(--trait); border-radius:22px; font-size:13px; color:var(--gris); align-items:center; }
.sbu2-tot b { font-size:22px; color:var(--encre); }
.sbu2-eq { font-size:11px; color:#2f6b5f; font-weight:600; }
.sbu2-st { margin-left:auto; color:var(--encre); font-weight:600; }
.sbu2-q { font-size:16px; }
.sbu2-pile { display:flex; flex-direction:column; gap:0; }
.sbu2-carte { background:var(--surf); border-radius:8px; padding:8px 10px; display:flex; flex-direction:column; gap:5px; border:2px solid transparent; }
.sbu2-orig { opacity:.92; }
.sbu2-orig .su-nom { text-decoration:line-through 2px var(--gris); }
.sbu2-nouv { background:#fff; border-color:var(--c); box-shadow:0 6px 18px -12px rgba(22,22,26,.5); }
.sbu2-r1, .sbu2-r2 { display:flex; align-items:center; gap:6px; font-size:14px; }
.sbu2-r1 .su-nom { font-size:17px; }
.sbu2-moment { height:26px; padding:0 10px; border:1px solid #c9cad2; border-radius:13px; display:inline-flex; align-items:center; font-size:13px; background:#fff; }
.sbu2-dose { margin-left:auto; font-size:18px; }
.sbu2-ibu { margin-left:auto; font-size:14px; }
.sbu2-gr { color:var(--gris); font-size:12px; }
.sbu2-res { height:24px; padding:0 8px; border:1.5px solid #c2410c; color:#c2410c; border-radius:12px; display:inline-flex; align-items:center; font-size:12px; font-weight:600; }
.sbu2-bd { display:inline-flex; gap:2px; }
.sbu2-c { display:block; width:13px; height:16px; border-radius:2px; background:#e6e6ea; }
.sbu2-c.sbu2-m { background:var(--b); }
.sbu2-c.sbu2-ci { background:var(--f); box-shadow:inset 0 -5px 0 var(--b); }
.sbu2-par { display:flex; align-items:center; gap:8px; height:22px; padding-left:18px; font-size:12px; color:var(--gris); }
.sbu2-par::before { content:""; width:2px; height:22px; background:var(--encre); }
.sbu2-lt { display:flex; align-items:center; justify-content:space-between; font-size:12px; color:var(--gris); margin-top:2px; }
.sbu2-liste { display:flex; flex-direction:column; gap:4px; }
.sbu2-rap { display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:8px; background:var(--surf); min-height:52px; cursor:pointer; border:2px solid transparent; }
.sbu2-rap.sbu2-on { background:#fff; border-color:var(--encre); }
.sbu2-radio { width:22px; height:22px; border-radius:50%; border:2px solid #9a9aa6; display:inline-flex; align-items:center; justify-content:center; flex:none; }
.sbu2-on .sbu2-radio { border-color:var(--encre); }
.sbu2-on .sbu2-radio i { width:10px; height:10px; border-radius:50%; background:var(--encre); display:block; }
.sbu2-rc { flex:1; display:flex; flex-direction:column; gap:3px; min-width:0; }
.sbu2-rl { display:flex; align-items:center; gap:5px; font-size:14px; flex-wrap:nowrap; }
.sbu2-rl2 { display:flex; align-items:center; justify-content:space-between; gap:6px; font-size:12px; color:var(--gris); }
.sbu2-rl2 .sbu2-c { width:10px; height:14px; }
.sbu2-prox { width:42px; height:36px; border:2px dashed #9a9aa6; border-radius:18px; display:inline-flex; align-items:center; justify-content:center; font-size:15px; font-weight:700; flex:none; }
.sbu2-pan { display:flex; flex-direction:column; gap:6px; margin-top:4px; }
.sbu2-pt { display:flex; align-items:center; gap:8px; font-size:14px; }
.sbu2-pt .su-seg { margin-left:auto; }
.sbu2-grille { display:grid; grid-template-columns:1fr 1fr; gap:6px 14px; }
.sbu2-f { display:grid; grid-template-columns:84px 1fr 30px; align-items:center; gap:4px; font-size:13px; }
.sbu2-fn { display:flex; align-items:center; gap:4px; }
.sbu2-att { font-weight:700; }
.sbu2-f b { font-size:11px; text-align:right; }
.sbu2-pied { position:fixed; left:0; right:0; bottom:0; background:#fff; border-top:1px solid var(--trait); padding:8px 12px 12px; max-width:390px; margin:0 auto; z-index:20; }
`;

function script() {
  var L = window.SU_DATA.liste;
  function montrer(i) {
    var r = L[i], c = document.querySelector('[data-x="carte"]');
    document.querySelectorAll('.sbu2-rap').forEach(function (b) { b.classList.toggle('sbu2-on', +b.dataset.i === i); });
    c.style.setProperty('--c', r.coul); c.setAttribute('data-fiche', r.nom); c.innerHTML = r.carte;
    document.querySelector('[data-x="go"]').textContent = 'Remplacer par ' + r.nom + ' ›';
    document.querySelectorAll('.sbu2-grille .su-piste').forEach(function (p) {
      var f = p.dataset.f, v = r.b[f], rem = p.querySelector('.su-rem'); if (!v || !rem) return;
      rem.style.setProperty('--ws', v.ws); rem.style.setProperty('--wa', v.wa); rem.style.background = v.c;
      document.querySelector('[data-d="' + f + '"]').textContent = v.d;
    });
  }
  document.querySelectorAll('.sbu2-rap').forEach(function (b) {
    b.addEventListener('click', function () { montrer(+b.dataset.i); });
    b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); montrer(+b.dataset.i); } });
  });
  if (window.SU.choix) montrer(+window.SU.choix);
}

// Le contenu de la carte « par » pour chaque remplaçant, rendu ici (mêmes briques que la page).
const interieur = (r) => { const html = carte(r.houblon, g(r.doseExacte), '=' + IBU0 + ' IBU', '', '', ''); return html.slice(html.indexOf('>') + 1, html.lastIndexOf('</div>')); };
export default {
  nom: 'la carte de l’étape', chaleur: 'froide', css, corps, script, houblons: LISTE,
  donnees: { liste: LISTE.slice(0, 7).map((r) => ({ nom: r.nom, coul: COUL[r.cle], carte: interieur(r), b: barreData(r.biere) })) },
};
