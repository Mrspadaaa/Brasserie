// sbu6 — chaude : le plan de ligne. Nugget est le terminus ; deux lignes en descendent, la mixte et l'amérisante
// (à 60′, c'est l'usage qui compte). Chaque remplaçant est une station, d'autant plus loin de Nugget que sa
// proximité est basse ; une composante inconnue étire la station en tronçon hachuré (sa plage de score).
import { CLES, COUL, FAM, IBU0, JET, LISTE, NOM, NUG, alphaTxt, barre, barreData, croix, delta, g, legende, lentille, nomH, pi, plage, plageTxt, point, stock, stockNugget, usage } from '../sbu1/serie/socle.mjs';

const premier = LISTE.find((r) => r.stock.etat === 'en stock' && r.stock.suffisant) || LISTE[0];
const T0 = 74, PX = 21; // y du terminus, pixels par point d'écart
const lignes = { mixte: { x: 150, liste: [] }, 'amérisant': { x: 242, liste: [] } };
LISTE.forEach((r, i) => { const l = lignes[r.houblon.role.mot === 'amérisant' ? 'amérisant' : 'mixte']; l.liste.push({ r, i }); });
for (const l of Object.values(lignes)) {
  l.liste.sort((a, b) => b.r.score - a.r.score);
  let prev = T0 + 8;
  for (const s of l.liste) { s.y = Math.max(prev + 50, T0 + (100 - s.r.score) * PX); prev = s.y; }
}
const H = Math.max(...Object.values(lignes).flatMap((l) => l.liste.map((s) => s.y))) + 34;

const station = (l, s, gauche) => {
  const r = s.r, p = plage(r), yb = p ? T0 + (100 - p[0]) * PX : null;
  return '<button type="button" class="sbu6-st' + (r === premier ? ' sbu6-on' : '') + (gauche ? ' sbu6-g' : '') + '" data-i="' + s.i + '" style="top:' + (s.y - 13) + 'px;' + (gauche ? 'right:' + (390 - l.x - 13) : 'left:' + (l.x - 13)) + 'px;--c:' + COUL[r.cle] + '">'
    + '<i class="sbu6-rond' + (p ? ' sbu6-inc' : '') + '" data-couleur="' + COUL[r.cle] + '" data-serie="' + r.nom + '"></i>'
    + '<span class="sbu6-et"><span class="sbu6-n">' + nomH(r.houblon, '', true) + stock(r) + '</span><span class="num sbu6-d">' + alphaTxt(r.houblon) + ' · <b>' + (p ? p[0] + '–' + p[1] : r.score) + '</b>' + '</span></span></button>'
    ;
};
const plan = '<div class="sbu6-plan" style="height:' + H + 'px">'
  + '<svg class="sbu6-fond" width="390" height="' + H + '" viewBox="0 0 390 ' + H + '" aria-hidden="true">'
  + '<path d="M196 ' + (T0 - 30) + 'V' + (T0 - 12) + 'Q196 ' + (T0) + ' 150 ' + (T0 + 12) + 'V' + (H - 10) + '" fill="none" stroke="#16161a" stroke-width="7" stroke-linecap="round"/>'
  + '<path d="M196 ' + (T0 - 12) + 'Q196 ' + T0 + ' 242 ' + (T0 + 12) + 'V' + (lignes['amérisant'].liste.slice(-1)[0].y + 10) + '" fill="none" stroke="#5b5b66" stroke-width="7" stroke-linecap="round"/>'
  + '</svg>'
  + '<div class="sbu6-term" style="top:' + (T0 - 56) + 'px">' + point(NUG.cle, NUG.nom, 14) + '<span class="sbu6-tn">' + nomH(NUG) + '</span><span class="num">' + alphaTxt(NUG) + '</span>' + usage(NUG.role.mot) + '<span class="num sbu6-gr">46 g</span>' + stockNugget() + '</div>'
  + '<span class="sbu6-ln" style="top:' + (T0 + 16) + 'px;left:112px">' + usage('mixte') + '</span><span class="sbu6-ln" style="top:' + (T0 + 16) + 'px;left:252px">' + usage('amérisant') + '</span>'
  + lignes.mixte.liste.map((s) => station(lignes.mixte, s, true)).join('') + lignes['amérisant'].liste.map((s) => station(lignes['amérisant'], s, false)).join('')
  + '</div>';

const fiche = (r) => '<div class="sbu6-fc" style="--c:' + COUL[r.cle] + '"><div class="sbu6-f1">' + point(r.cle, r.nom, 10) + nomH(r.houblon) + '<span class="num">' + alphaTxt(r.houblon) + ' <span class="sbu6-gr">' + plageTxt(r.houblon) + '</span></span>' + usage(r.houblon.role.mot) + '<b class="num">' + g(r.doseExacte) + '</b></div>'
  + '<div class="sbu6-f2"><span class="sbu6-gr">perd</span>' + (r.familles.perd.slice(0, 6).map((f) => pi(f, 15)).join('') || '<span class="sbu6-gr">rien</span>') + '<span class="sbu6-gr">gagne</span>' + (r.familles.gagne.slice(0, 3).map((f) => pi(f, 15)).join('') || '<span class="sbu6-gr">rien</span>') + '</div></div>';

const corps = '<main class="sbu6-e">'
  + '<header class="sbu6-h">' + croix() + '<h1>Lequel à la place de Nugget&nbsp;?<span>à 60′, à IBU égal</span></h1>' + legende('sbu6', ['plus bas sur la ligne : moins proche de Nugget (score du moteur)', 'anneau en tirets : une composante inconnue, le score est une plage (79–99)', 'ligne noire : usage mixte · grise : amérisant', 'chiffre gras : proximité ; dose pour ' + IBU0 + ' IBU dans la carte du bas'], 'su-droite') + '</header>'
  + plan
  + '<section class="sbu6-sel"><div data-x="fc">' + fiche(premier) + '</div>'
  + '<div class="sbu6-bt"><b>Ma bière après</b>' + lentille() + '</div>'
  + '<div class="sbu6-bars">' + CLES.map((f) => '<div class="sbu6-bl">' + pi(f, 15) + '<span style="color:' + JET[f].texte + '">' + NOM[f] + '</span>' + barre(f, premier.biere) + '<b class="num" data-d="' + f + '">' + delta(premier.biere, f) + '</b></div>').join('') + '</div></section>'
  + '</main><footer class="sbu6-pied"><div class="su-pied"><button class="su-annuler" type="button">Annuler</button><button class="su-remplacer" type="button" data-x="go">Remplacer ›</button></div></footer>';

const css = `
.sbu6-e { max-width:390px; margin:0 auto; padding:6px 0 80px; display:flex; flex-direction:column; gap:4px; }
.sbu6-h { display:flex; align-items:center; gap:10px; padding:0 12px; }
.sbu6-h h1 { font-size:18px; font-weight:700; flex:1; display:flex; flex-direction:column; }
.sbu6-h h1 span { font-size:12px; font-weight:400; color:var(--gris); }
.sbu6-plan { position:relative; width:390px; }
.sbu6-fond { position:absolute; inset:0; }
.sbu6-term { position:absolute; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:6px; height:40px; padding:0 12px; border:2px solid var(--encre); border-radius:20px; background:#fff; font-size:13px; white-space:nowrap; z-index:2; }
.sbu6-tn { font-size:16px; }
.sbu6-ln { position:absolute; z-index:2; }
.sbu6-st { position:absolute; display:flex; align-items:center; gap:6px; z-index:3; text-align:left; }
.sbu6-st.sbu6-g { flex-direction:row-reverse; text-align:right; }
.sbu6-rond { width:26px; height:26px; border-radius:50%; background:#fff; border:6px solid var(--c); flex:none; display:block; }
.sbu6-on .sbu6-rond { width:30px; height:30px; margin:-2px; border-width:8px; box-shadow:0 0 0 3px #fff, 0 0 0 5px var(--encre); }
.sbu6-et { display:flex; flex-direction:column; gap:0; background:rgba(255,255,255,.94); padding:1px 4px; border-radius:4px; }
.sbu6-n { display:flex; align-items:center; gap:4px; font-size:14px; white-space:nowrap; }
.sbu6-g .sbu6-n { flex-direction:row-reverse; }
.sbu6-d { font-size:11px; color:var(--gris); white-space:nowrap; }
.sbu6-d b { color:var(--encre); font-size:12px; }
.sbu6-on .sbu6-d b { color:#fff; }
.sbu6-on .sbu6-et { background:var(--encre); color:#fff; }
.sbu6-on .sbu6-et .su-nom { text-decoration-color:#fff; }
.sbu6-on .sbu6-d, .sbu6-on .su-stk { color:#fff; }
.sbu6-rond.sbu6-inc { border-style:dashed; }
.sbu6-tr { position:absolute; width:8px; border-radius:2px; z-index:1; }
.sbu6-gr { color:var(--gris); font-size:12px; }
.sbu6-sel { margin:0 12px; padding:8px 10px; border-radius:8px; background:var(--surf); display:flex; flex-direction:column; gap:6px; }
.sbu6-fc { display:flex; flex-direction:column; gap:4px; border-left:4px solid var(--c); padding-left:8px; }
.sbu6-f1 { display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:14px; }
.sbu6-f1 b { margin-left:auto; font-size:17px; }
.sbu6-f2 { display:flex; align-items:center; gap:4px; }
.sbu6-f2 .sbu6-gr:nth-of-type(2) { margin-left:8px; }
.sbu6-bt { display:flex; align-items:center; justify-content:space-between; font-size:14px; }
.sbu6-bars { display:flex; flex-direction:column; gap:5px; }
.sbu6-bl { display:grid; grid-template-columns:16px 70px 1fr 36px; gap:6px; align-items:center; font-size:13px; font-weight:600; }
.sbu6-bl b { font-size:12px; text-align:right; }
.sbu6-pied { position:fixed; left:0; right:0; bottom:0; background:#fff; border-top:1px solid var(--trait); padding:8px 12px 12px; max-width:390px; margin:0 auto; z-index:20; }
`;

function script() {
  var L = window.SU_DATA.liste;
  function montrer(i) {
    var r = L[i];
    document.querySelectorAll('.sbu6-st').forEach(function (b) { b.classList.toggle('sbu6-on', +b.dataset.i === i); });
    document.querySelector('[data-x="fc"]').innerHTML = r.fc;
    document.querySelectorAll('.sbu6-bars .su-piste').forEach(function (p) { var f = p.dataset.f, v = r.b[f], rem = p.querySelector('.su-rem'); if (!v || !rem) return;
      rem.style.setProperty('--ws', v.ws); rem.style.setProperty('--wa', v.wa); rem.style.background = v.c; document.querySelector('[data-d="' + f + '"]').textContent = v.d; });
  }
  document.querySelectorAll('.sbu6-st').forEach(function (b) { b.addEventListener('click', function () { montrer(+b.dataset.i); }); });
  if (window.SU.choix) montrer(+window.SU.choix);
}

export default { nom: 'le plan de ligne', chaleur: 'chaude', css, corps, script, donnees: { liste: LISTE.map((r) => ({ fc: fiche(r), b: barreData(r.biere) })) } };
