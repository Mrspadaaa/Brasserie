// rcb2 — tiède : « Le champ α × huile ». Tout le catalogue sur un seul plan : l'α en travers, l'huile totale en
// hauteur (ce qui sépare un Galaxy d'un Saaz). On pose un cadre au doigt, les houblons dedans prennent leur couleur
// et se listent dessous, du plus huileux au moins. Pas de champ, pas de pastille : un rectangle.
// Cas : cadre α 8–14, huile ≥ 2 mL/100 g → 40 houblons (point = milieu de la plage publiée ; sans huile publiée :
// absent du plan, dit en bas). Galaxy et Saaz nommés sur le plan, comme repères.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOUBLONS, CATALOGUE, PAR_NOM, esc, plage, pi, T, B, ecrire } from '../rcb1/donnees-rcb.mjs';
import { ETAPE, BARRE, lentille, zone, legende, plus, stockBadge, usage, alpha, page } from '../rcb1/commun-rcb.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const mid = (p) => (p && p[0] != null ? (p[0] + p[1]) / 2 : null);
const CADRE = { a: [8, 14], h: [2, 5] };
const AX = 24, HX = 5;
const places = HOUBLONS.filter((h) => mid(h.alpha) != null && mid(h.huile) != null);
const sansHuile = HOUBLONS.length - places.length;
const dedans = (h) => mid(h.alpha) >= CADRE.a[0] && mid(h.alpha) <= CADRE.a[1] && mid(h.huile) >= CADRE.h[0] && mid(h.huile) <= CADRE.h[1];
const resultats = places.filter(dedans).sort((a, b) => mid(b.huile) - mid(a.huile));

// Le plan : 370 × 232, marges gauche 30 et bas 20.
const W = 370, H = 206, L = 30, BAS = 20;
const x = (a) => L + ((W - L - 6) * Math.min(a, AX)) / AX;
const y = (o) => H - BAS - ((H - BAS - 8) * Math.min(o, HX)) / HX;
function plan() {
  let s = '<svg class="rcb2-plan" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Plan des houblons : alpha en travers, huile totale en hauteur ; cadre de recherche α 8–14, huile 2 à 5">';
  for (const a of [5, 10, 15, 20]) s += '<line x1="' + x(a) + '" y1="' + y(0) + '" x2="' + x(a) + '" y2="' + y(HX) + '" stroke="#eceef2"/><text x="' + x(a) + '" y="' + (H - 5) + '" text-anchor="middle" class="rcb2-ax">' + a + '</text>';
  for (const o of [1, 2, 3, 4, 5]) s += '<line x1="' + L + '" y1="' + y(o) + '" x2="' + (W - 6) + '" y2="' + y(o) + '" stroke="#eceef2"/><text x="' + (L - 5) + '" y="' + (y(o) + 4) + '" text-anchor="end" class="rcb2-ax">' + o + '</text>';
  s += '<text x="' + (W - 6) + '" y="' + (H - 5) + '" text-anchor="end" class="rcb2-ax rcb2-axn">α %</text><text x="' + (L + 4) + '" y="12" class="rcb2-ax rcb2-axn">huile mL/100 g</text>';
  // Le cadre, puis les points hors cadre (gris), puis les points dedans (couleur de la première famille), puis le stock.
  const cx0 = x(CADRE.a[0]), cx1 = x(CADRE.a[1]), cy0 = y(CADRE.h[1]), cy1 = y(CADRE.h[0]);
  s += '<rect x="' + cx0 + '" y="' + cy0 + '" width="' + (cx1 - cx0) + '" height="' + (cy1 - cy0) + '" fill="#f4f4f6" stroke="#16161a" stroke-width="1.5" stroke-dasharray="5 3" data-role="cadre"/>';
  for (const h of places) if (!dedans(h)) s += '<circle cx="' + x(mid(h.alpha)).toFixed(1) + '" cy="' + y(mid(h.huile)).toFixed(1) + '" r="2" fill="#c4c6cc"/>';
  for (const h of places) if (dedans(h)) s += '<circle cx="' + x(mid(h.alpha)).toFixed(1) + '" cy="' + y(mid(h.huile)).toFixed(1) + '" r="3.4" fill="' + (h.familles[0] ? B(h.familles[0]) : '#55555f') + '" stroke="#fff" stroke-width="1"/>';
  for (const h of places) if (h.stock && h.stock.g > 0) s += '<circle cx="' + x(mid(h.alpha)).toFixed(1) + '" cy="' + y(mid(h.huile)).toFixed(1) + '" r="6" fill="none" stroke="#16161a" stroke-width="1.5"/>';
  for (const [nom, dx, dy, anc] of [['Galaxy', 9, 4, 'start'], ['Saaz (CZ)', 9, 4, 'start']]) {
    const h = PAR_NOM.get(nom); s += '<text x="' + (x(mid(h.alpha)) + dx).toFixed(1) + '" y="' + (y(mid(h.huile)) + dy).toFixed(1) + '" text-anchor="' + anc + '" class="rcb2-rep">' + esc(nom.replace(' (CZ)', '')) + '</text>';
  }
  // Poignées du cadre et ses valeurs.
  for (const [px, py] of [[cx0, cy0], [cx1, cy0], [cx0, cy1], [cx1, cy1]]) s += '<rect x="' + (px - 5) + '" y="' + (py - 5) + '" width="10" height="10" rx="2" fill="#fff" stroke="#16161a" stroke-width="1.5"/>';
  s += '<text x="' + (cx0 + 7).toFixed(1) + '" y="' + (cy0 + 17) + '" text-anchor="start" class="rcb2-val">α 8–14</text>';
  s += '<text x="' + (cx0 - 9) + '" y="' + (cy1 - 4).toFixed(1) + '" text-anchor="end" class="rcb2-val">huile ≥ 2</text>';
  return s + '</svg>';
}

const ligne = (h) => '<li class="rcb2-l" data-role="ligne-houblon" data-id="' + esc(h.id) + '">'
  + '<div class="rcb2-l1"><i class="rcb2-pt" style="background:' + (h.familles[0] ? B(h.familles[0]) : '#55555f') + '"></i><b class="rcb2-nom" data-houblon="' + esc(h.id) + '">' + esc(h.nom) + '</b><span class="rcb2-fam">' + h.familles.slice(0, 5).map((f) => pi(f, 14)).join('') + '</span>' + stockBadge(h) + plus(h) + '</div>'
  + '<div class="rcb2-l2">' + alpha(h) + '<span class="rcb2-sep">·</span>' + usage(h) + '<span class="rcb2-sep">·</span><span class="num rcb2-hu">huile ' + plage(h.huile) + '</span>' + (h.sans.length ? '<span class="rcb2-sep">·</span><i class="rcb2-mots">' + esc(h.sans.slice(0, 2).join(', ')) + '</i>' : '') + '</div></li>';

const corps = ETAPE + '<div class="rcb2-haut">' + plan()
  + '<div class="rcb2-cnt"><span class="rcb2-n"><b class="num">' + resultats.length + '</b> dans le cadre</span>' + zone() + lentille() + legende('rcb2-lg', [
    'Chaque point : un houblon du catalogue, au milieu de ses plages publiées (α en travers, huile totale en hauteur).',
    'Le cadre se déplace et s’étire au doigt ; dedans, la couleur est celle de sa première famille ; un cercle noir : dans mon stock.',
    'Liste du plus huileux au moins. ' + sansHuile + ' houblons sans huile publiée restent hors du plan.',
    '+ ajoute à la recette · appui long : sa fiche · glisser à gauche : dans Comparer.']) + '</div></div>'
  + '<ol class="rcb2-liste" aria-label="Houblons dans le cadre">' + resultats.map(ligne).join('') + '</ol>'
  + '<p class="rcb2-fin">' + places.length + ' houblons sur le plan · ' + sansHuile + ' sans huile publiée · catalogue ' + CATALOGUE + '</p>' + BARRE;

const CSS = `
.rcb2-haut { padding:2px 10px 5px; display:flex; flex-direction:column; gap:3px; border-bottom:1px solid var(--trait); }
.rcb2-plan { width:100%; height:auto; }
.rcb2-ax { font:400 12px var(--mono); fill:var(--gris); }
.rcb2-axn { font-family:var(--sans); fill:var(--gris); }
.rcb2-rep { font:600 12px var(--sans); fill:var(--encre); }
.rcb2-val { font:600 12px var(--mono); fill:var(--encre); }
.rcb2-cnt { display:flex; align-items:center; gap:8px; }
.rcb2-n { flex:1; font-size:15px; white-space:nowrap; }
.rcb2-n b { font-weight:700; }
.rcb2-liste { list-style:none; padding:0 10px; }
.rcb2-l { padding:2px 0 1px; border-bottom:1px solid var(--trait); display:flex; flex-direction:column; gap:0; }
.rcb2-l1 { display:flex; align-items:center; gap:6px; min-height:24px; }
.rcb2-pt { width:10px; height:10px; border-radius:50%; flex:none; }
.rcb2-nom { font-size:15px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; }
.rcb2-fam { display:inline-flex; gap:2px; flex:1; min-width:0; }
.rcb2-l2 { display:flex; align-items:center; gap:4px; padding-left:16px; font-size:12px; line-height:1.1; min-height:15px; color:var(--gris); white-space:nowrap; overflow:hidden; }
.rcb2-sep { color:var(--gris); }
.rcb2-hu { color:var(--gris); }
.rcb2-mots { color:var(--encre); font-weight:600; overflow:hidden; text-overflow:ellipsis; }
.rcb2-fin { font-size:12px; color:var(--gris); padding:8px 10px 12px; }
`;

ecrire(ici, page({ id: 'rcb2', nom: 'le champ α × huile', css: CSS, corps, houblons: resultats }));
console.log('rcb2 écrit : ' + resultats.length + ' dans le cadre, ' + places.length + ' sur le plan, ' + sansHuile + ' sans huile ; ' + resultats.slice(0, 8).map((h) => h.nom).join(', '));
