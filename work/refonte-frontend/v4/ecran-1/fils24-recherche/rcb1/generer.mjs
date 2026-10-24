// rcb1 — tiède : « Tape comme tu parles ». Un seul champ, on écrit la demande comme on la dirait ; la machine
// souligne ce qu'elle a compris, à la couleur de ce que c'est (famille, α, moment, exclusion), et la liste suit
// à chaque lettre. Ce qui n'est pas compris reste en pointillé gris : rien n'est deviné.
// Cas : « passion, α < 12, dry hop, pas d'herbacé » → 18 houblons du catalogue, classés par huile totale (dry hop :
// l'huile fait l'arôme), chacun avec ce qu'il dit EN PLUS de la demande (ses mots hors des 12 d'abord).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOUBLONS, CATALOGUE, dit, esc, plage, pi, T, ecrire } from './donnees-rcb.mjs';
import { ETAPE, BARRE, lentille, zone, legende, plus, stockBadge, usage, alpha, ic, page } from './commun-rcb.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const mid = (p) => (p && p[0] != null ? (p[0] + p[1]) / 2 : null);

// La requête, telle que comprise.
const resultats = HOUBLONS.filter((h) => dit(h, 'fruit de la passion') && h.alpha && h.alpha[1] != null && h.alpha[1] <= 12 && !h.familles.includes('herbal'))
  .sort((a, b) => (mid(b.huile) ?? -1) - (mid(a.huile) ?? -1));
const enStock = resultats.filter((h) => h.stock && h.stock.g > 0).length;

// Ce que le houblon ajoute à la demande : ses mots hors des 12 (en italique), puis ses mots de famille autres
// que « fruit de la passion », à la couleur de la famille. Deux au plus (D1).
function enPlus(h) {
  const hors = h.sans.slice(0, 2).map((m) => '<i>' + esc(m) + '</i>');
  const fam = [];
  for (const f of h.familles) for (const m of h.mots[f]) if (!/passion|fruits tropicaux/i.test(m) && fam.length < 2 - hors.length) fam.push('<b style="color:' + T(f) + '">' + esc(m) + '</b>');
  return [...hors, ...fam].join('<span class="rcb1-sep">·</span>');
}
const huile = (h) => {
  if (!h.huile || h.huile[0] == null) return '<span class="rcb1-h"><span class="rcb1-hb"></span><span class="num">?</span></span>';
  const l = (100 * h.huile[0]) / 5, r = (100 * h.huile[1]) / 5;
  return '<span class="rcb1-h" role="img" aria-label="huile totale ' + plage(h.huile) + ' mL pour 100 g"><span class="rcb1-hb"><i style="left:' + l.toFixed(0) + '%;width:' + Math.max(3, r - l).toFixed(0) + '%"></i></span><span class="num">' + plage(h.huile) + '</span></span>';
};

const ligne = (h) => '<li class="rcb1-l" data-role="ligne-houblon" data-id="' + esc(h.id) + '">'
  + '<div class="rcb1-l1"><b class="rcb1-nom" data-houblon="' + esc(h.id) + '">' + esc(h.nom) + '</b>' + alpha(h) + usage(h) + stockBadge(h) + plus(h) + '</div>'
  + '<div class="rcb1-l2"><span class="rcb1-fam">' + h.familles.slice(0, 5).map((f) => pi(f, 14)).join('') + '</span><span class="rcb1-mots">' + enPlus(h) + '</span>' + huile(h) + '</div></li>';

const champ = '<div class="rcb1-champ" role="textbox" aria-label="Chercher un houblon : écris ce que tu veux, comme tu le dirais" aria-multiline="false">'
  + '<span class="rcb1-t" data-sens="famille" style="--c:' + T('tropical') + ';color:' + T('tropical') + '">' + pi('tropical', 14) + 'passion</span>, '
  + '<span class="rcb1-t num" data-sens="alpha">α &lt; 12</span>, '
  + '<span class="rcb1-t" data-sens="moment">' + ic('j-cuve-a', 14) + 'dry hop</span>, '
  + '<span class="rcb1-t rcb1-non" data-sens="exclusion" style="--c:' + T('herbal') + ';color:' + T('herbal') + '">pas d’' + pi('herbal', 14) + 'herbacé</span><span class="rcb1-caret"></span>'
  + '<button type="button" class="rcb1-eff" aria-label="Effacer">' + ic('i-x', 14) + '</button></div>';

const corps = ETAPE + '<div class="rcb1-haut">' + champ
  + '<div class="rcb1-cnt"><span class="rcb1-n"><b class="num">' + resultats.length + '</b> houblons <span class="num">· ' + enStock + '</span> ' + ic('j-stock', 12) + '</span>' + zone() + lentille() + legende('rcb1-lg', [
    'Souligné : compris. Couleur de la famille, α en chiffres, cuve pour le moment, barré pour « pas de ».',
    'Pointillé gris : pas compris, ignoré. La liste change à chaque lettre.',
    'Ordre : huile totale, la barre sur 5 mL/100 g (dry hop : l’huile fait l’arôme). Sous le nom, ce que le houblon dit en plus de ta demande.',
    '+ ajoute à la recette · appui long : sa fiche · glisser à gauche : dans Comparer.']) + '</div></div>'
  + '<ol class="rcb1-liste" aria-label="Résultats">' + resultats.map(ligne).join('') + '</ol>'
  + '<p class="rcb1-fin">sur ' + CATALOGUE + ' du catalogue</p>' + BARRE;

const CSS = `
.rcb1-haut { padding:6px 10px 5px; display:flex; flex-direction:column; gap:5px; border-bottom:1px solid var(--trait); position:sticky; top:0; background:#fff; z-index:5; }
.rcb1-champ { min-height:44px; border:1.5px solid var(--encre); border-radius:8px; padding:8px 40px 7px 12px; font-size:15px; line-height:1.45; position:relative; }
.rcb1-t { display:inline-flex; align-items:center; gap:3px; border-bottom:2.5px solid var(--c, var(--encre)); padding-bottom:0; }
.rcb1-t[data-sens="alpha"] { font-weight:600; }
.rcb1-non { text-decoration:line-through; text-decoration-color:var(--c); text-decoration-thickness:1.5px; }
.rcb1-caret { display:inline-block; width:1.5px; height:17px; background:var(--encre); vertical-align:-3px; margin-left:1px; }
.rcb1-eff { position:absolute; right:8px; top:8px; width:26px; height:26px; border-radius:50%; background:var(--mur); display:inline-flex; align-items:center; justify-content:center; color:var(--gris); }
.rcb1-cnt { display:flex; align-items:center; gap:8px; }
.rcb1-n { flex:1; font-size:15px; display:inline-flex; align-items:center; gap:3px; white-space:nowrap; }
.rcb1-n b { font-weight:700; }
.rcb1-n .num:not(b) { color:var(--gris); font-size:12px; }
.rcb1-l1 { min-height:24px; }
.rcb1-n svg { color:var(--gris); }
.rcb1-liste { list-style:none; padding:0 10px; }
.rcb1-l { padding:2px 0 1px; border-bottom:1px solid var(--trait); display:flex; flex-direction:column; gap:0; }
.rcb1-l1 { display:flex; align-items:center; gap:8px; }
.rcb1-nom { font-size:15px; font-weight:700; flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.rcb1-l2 { display:flex; align-items:center; gap:6px; min-height:15px; line-height:1.1; }
.rcb1-fam { display:inline-flex; gap:2px; flex:none; }
.rcb1-mots { flex:1; min-width:0; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.rcb1-mots i { font-style:italic; font-weight:600; }
.rcb1-mots b { font-weight:600; }
.rcb1-sep { color:var(--gris); margin:0 4px; }
.rcb1-h { display:inline-flex; align-items:center; gap:4px; flex:none; font-size:12px; color:var(--gris); }
.rcb1-hb { position:relative; width:44px; height:6px; border-radius:2px; background:var(--mur); overflow:hidden; }
.rcb1-hb i { position:absolute; top:0; bottom:0; border-radius:2px; background:var(--encre); }
.rcb1-fin { font-size:12px; color:var(--gris); padding:8px 10px 12px; }
`;

ecrire(ici, page({ id: 'rcb1', nom: 'tape comme tu parles', css: CSS, corps, houblons: resultats }));
console.log('rcb1 écrit : ' + resultats.length + ' résultats, ' + enStock + ' en stock ; ' + resultats.slice(0, 8).map((h) => h.nom).join(', '));
