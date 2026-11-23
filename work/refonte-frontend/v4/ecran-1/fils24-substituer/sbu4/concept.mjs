// sbu4 — tiède : le miroir. Forme imposée : le graphique en papillon. Nugget à gauche, le remplaçant à droite, les
// 12 familles de leurs fiches au milieu ; ce qui se répond des deux côtés se lit d'un coup d'œil. On change de
// remplaçant par les pastilles du haut ; la bière après, au style, en pied.
import { D, CLES, COUL, FAM, IBU0, JET, LISTE, NOM, NUG, alphaTxt, barre, barreData, croix, delta, g, legende, lentille, lot, nomH, pi, plageTxt, point, stock, stockNugget, usage } from '../sbu1/serie/socle.mjs';

const premier = LISTE.find((r) => r.stock.etat === 'en stock' && r.stock.suffisant) || LISTE[0];
const w = (h, f) => { const x = h.familles[f]; return x.niveau === 'non décrit' ? null : (x.niveau === 'marqué' ? 100 : 50); };
const aile = (h, f, cote) => { const v = w(h, f); return v == null ? '<span class="sbu4-a sbu4-' + cote + '"><i class="sbu4-vide"></i></span>'
  : '<span class="sbu4-a sbu4-' + cote + '"><i class="sbu4-plein" style="width:' + Math.max(8, v) + '%;background:' + JET[f].base + '"></i><b class="num">' + h.familles[f].fiches + '/' + h.familles[f].sur + '</b></span>'; };
const papillon = (h) => FAM.map((f) => { const deux = w(NUG, f) != null && w(h, f) != null;
  return '<div class="sbu4-r' + (deux ? ' sbu4-deux' : '') + '" data-famille-ligne="' + f + '">' + aile(NUG, f, 'g') + '<span class="sbu4-m">' + pi(f, 16) + '<span style="color:' + JET[f].texte + '">' + NOM[f] + '</span></span>' + aile(h, f, 'd') + '</div>'; }).join('');
const tete = (r) => '<div class="sbu4-td" style="--c:' + COUL[r.cle] + '">' + '<span class="sbu4-tn">' + point(r.cle, r.nom, 10) + nomH(r.houblon) + stock(r) + '</span><span class="num">' + alphaTxt(r.houblon) + ' <span class="sbu4-gr">' + plageTxt(r.houblon) + '</span></span><span class="sbu4-tu">' + usage(r.houblon.role.mot) + '<b class="num">' + g(r.doseExacte) + '</b></span></div>';
const puce = (r, i) => '<button type="button" class="sbu4-p' + (r === premier ? ' sbu4-on' : '') + '" data-i="' + i + '">' + point(r.cle, r.nom, 9) + nomH(r.houblon, '', true) + '<span class="sbu4-pa num">' + alphaTxt(r.houblon) + '</span><b class="num">' + r.score + '</b></button>';
const motsHors = (h) => { const m = [...new Set((D.mots[h.cle] || { sansFamille: [] }).sansFamille.map((x) => x.toLowerCase()))].filter((x) => /[éèàçûô]|^[a-z ]+$/.test(x) && !/^(fruity|white wine|resiny|dank)$/.test(x)).slice(0, 4); return m.length ? m.map((x) => '<span class="sbu4-mot">' + x + '</span>').join('') : '<span class="sbu4-gr">aucun</span>'; };
const hors = (h) => '<span class="sbu4-hg">' + motsHors(NUG) + '</span><span class="sbu4-hm">hors des<br>familles</span><span class="sbu4-hd">' + motsHors(h) + '</span>';
const communes = (r) => FAM.filter((f) => w(NUG, f) != null && w(r.houblon, f) != null).length;

const corps = '<main class="sbu4-e">'
  + '<header class="sbu4-h">' + croix() + '<h1>À la place de <span class="sbu4-nug">Nugget</span>, lequel lui répond&nbsp;?</h1></header>'
  + '<nav class="sbu4-puces" aria-label="Remplaçants, ton stock d’abord">' + LISTE.map(puce).join('') + '</nav>'
  + '<section class="sbu4-tete"><div class="sbu4-tg"><span class="sbu4-tn">' + point(NUG.cle, NUG.nom, 10) + nomH(NUG) + stockNugget() + '</span><span class="num">' + alphaTxt(NUG) + ' lot</span><span class="sbu4-tu">' + usage(NUG.role.mot) + '<b class="num">46 g</b></span></div>'
  + '<div class="sbu4-eq"><b class="num">' + IBU0 + '</b><span>IBU</span><span>à 60′</span></div><div data-x="tete">' + tete(premier) + '</div></section>'
  + '<div class="sbu4-leg"><span class="sbu4-gr" data-x="com">' + communes(premier) + ' familles en commun dans leurs fiches</span>' + legende('sbu4', ['barre : marqué (longue) ou cité (courte) dans ses fiches ; N/M : fiches qui la citent', 'cadre pointillé : non décrit, ce n’est pas zéro', 'nom en gras : la famille des deux côtés', 'ma bière : le rond = avec Nugget'], 'su-droite') + '</div>'
  + '<section class="sbu4-pap" data-x="pap">' + papillon(premier.houblon) + '</section>'
  + '<section class="sbu4-hors" data-x="hors">' + hors(premier.houblon) + '</section>'
  + '<section class="sbu4-biere"><div class="sbu4-bt"><b>Ma bière après</b>' + lentille() + '</div>'
  + CLES.map((f) => '<div class="sbu4-bl">' + pi(f, 15) + '<span style="color:' + JET[f].texte + '">' + NOM[f] + '</span>' + barre(f, premier.biere) + '<b class="num" data-d="' + f + '">' + delta(premier.biere, f) + '</b></div>').join('') + '</section>'
  + '</main><footer class="sbu4-pied"><div class="su-pied"><button class="su-annuler" type="button">Annuler</button><button class="su-remplacer" type="button" data-x="go">Remplacer ›</button></div></footer>';

const css = `
.sbu4-e { max-width:390px; margin:0 auto; padding:6px 12px 80px; display:flex; flex-direction:column; gap:8px; }
.sbu4-h { display:flex; align-items:center; gap:10px; }
.sbu4-h h1 { font-size:17px; font-weight:700; line-height:1.2; }
.sbu4-nug { color:#0072b2; }
.sbu4-puces { display:flex; gap:6px; overflow-x:auto; padding:2px 0 4px; scrollbar-width:none; margin:0 -12px; padding-left:12px; }
.sbu4-p { display:inline-flex; align-items:center; gap:5px; height:36px; padding:0 12px; border-radius:18px; border:1px solid #c9cad2; background:#fff; white-space:nowrap; font-size:14px; flex:none; }
.sbu4-p b { font-size:12px; color:var(--gris); }
.sbu4-pa { font-size:11px; color:var(--gris); }
.sbu4-p.sbu4-on { border:2px solid var(--encre); background:var(--surf); }
.sbu4-tete { display:grid; grid-template-columns:1fr 54px 1fr; gap:6px; align-items:stretch; }
.sbu4-tg, .sbu4-td { display:flex; flex-direction:column; gap:3px; font-size:13px; padding:6px 8px; border-radius:8px; background:var(--surf); }
.sbu4-tg { border-right:4px solid #0072b2; text-align:right; align-items:flex-end; }
.sbu4-td { border-left:4px solid var(--c); }
.sbu4-tn { display:flex; align-items:center; gap:5px; font-size:15px; }
.sbu4-tu { display:flex; align-items:center; gap:6px; }
.sbu4-tu b { font-size:15px; }
.sbu4-gr { color:var(--gris); font-size:12px; }
.sbu4-eq { display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:11px; color:var(--gris); }
.sbu4-eq b { font-size:22px; color:var(--encre); }
.sbu4-leg { display:flex; align-items:center; justify-content:space-between; }
.sbu4-pap { display:flex; flex-direction:column; gap:1px; }
.sbu4-r { display:grid; grid-template-columns:1fr 104px 1fr; align-items:center; height:23px; }
.sbu4-m { display:flex; align-items:center; justify-content:center; gap:4px; font-size:13px; }
.sbu4-deux .sbu4-m span { font-weight:700; }
.sbu4-deux { background:linear-gradient(90deg, transparent, #f3f3f6 30%, #f3f3f6 70%, transparent); border-radius:4px; }
.sbu4-a { display:flex; align-items:center; gap:4px; height:14px; }
.sbu4-g { flex-direction:row-reverse; }
.sbu4-a b { font-size:10px; color:var(--gris); }
.sbu4-plein { display:block; height:18px; border-radius:2px; max-width:80%; }
.sbu4-vide { display:block; width:22px; height:16px; border:1.5px dashed #b7b7c2; border-radius:2px; }
.sbu4-hors { display:grid; grid-template-columns:1fr 70px 1fr; gap:6px; align-items:center; padding:6px 0; border-top:1px solid var(--trait); }
.sbu4-hg, .sbu4-hd { display:flex; flex-wrap:wrap; gap:3px; }
.sbu4-hg { justify-content:flex-end; }
.sbu4-hm { font-size:11px; color:var(--gris); text-align:center; line-height:1.1; }
.sbu4-mot { font-size:12px; padding:2px 7px; border-radius:10px; background:var(--surf2); }
.sbu4-biere { display:flex; flex-direction:column; gap:5px; border-top:1px solid var(--trait); padding-top:6px; }
.sbu4-bt { display:flex; align-items:center; justify-content:space-between; font-size:14px; }
.sbu4-bl { display:grid; grid-template-columns:16px 70px 1fr 36px; gap:6px; align-items:center; font-size:13px; font-weight:600; }
.sbu4-bl b { font-size:12px; text-align:right; }
.sbu4-pied { position:fixed; left:0; right:0; bottom:0; background:#fff; border-top:1px solid var(--trait); padding:8px 12px 12px; max-width:390px; margin:0 auto; z-index:20; }
`;

function script() {
  var L = window.SU_DATA.liste;
  function montrer(i) {
    var r = L[i];
    document.querySelectorAll('.sbu4-p').forEach(function (b) { b.classList.toggle('sbu4-on', +b.dataset.i === i); });
    document.querySelector('[data-x="tete"]').innerHTML = r.tete; document.querySelector('[data-x="pap"]').innerHTML = r.pap;
    document.querySelector('[data-x="hors"]').innerHTML = r.hors; document.querySelector('[data-x="com"]').textContent = r.com + ' familles en commun dans leurs fiches';
    document.querySelectorAll('.sbu4-biere .su-piste').forEach(function (p) { var f = p.dataset.f, v = r.b[f], rem = p.querySelector('.su-rem'); if (!v || !rem) return;
      rem.style.setProperty('--ws', v.ws); rem.style.setProperty('--wa', v.wa); rem.style.background = v.c; document.querySelector('[data-d="' + f + '"]').textContent = v.d; });
  }
  document.querySelectorAll('.sbu4-p').forEach(function (b) { b.addEventListener('click', function () { montrer(+b.dataset.i); }); });
  if (window.SU.choix) montrer(+window.SU.choix);
}

export default { nom: 'le miroir', chaleur: 'tiède', css, corps, script,
  donnees: { liste: LISTE.map((r) => ({ tete: tete(r), pap: papillon(r.houblon), com: communes(r), hors: hors(r.houblon), b: barreData(r.biere) })) } };
