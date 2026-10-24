// flb4 — tiède (signature, puis le reste) : chaque mot de ses fiches posé sur une seule échelle, du plus commun
// (dit de 139 houblons sur 318) au plus rare (lui seul). La signature, c'est ce qui tombe à droite ; et on voit
// qui d'autre le dit (« aussi chez »), un appui long sur ce nom ouvre sa fiche.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { page, ecrire, fond, croix, usage, stock, titre, alpha, lentille, legende, gout, selecteur, radar, pi, NOM, T, esc, CATALOGUE } from '../flb1/socle-flb.mjs';
import { HOUBLONS } from '../flb1/donnees-flb.mjs';
import fs from 'node:fs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const PACK = new Set(JSON.parse(fs.readFileSync(path.resolve(ici, '../../../../../../prototypes/houblons-v4/data/pack-fiches.json'), 'utf8')).fichesHoublons.map((h) => h.name));
const W = 362, X = (n) => Math.round(12 + (Math.log(n) / Math.log(CATALOGUE)) * (W - 24)); // 1 à droite… non : rare à droite
const XR = (n) => W - X(n);

function echelle(h) {
  const mots = h.concepts.filter((c) => !c.seulCategorie).map((c) => ({ c, x: XR(c.chez), w: Math.round(c.mot.length * (c.signe ? 9.4 : 7.2)) + 26 }));
  const lanes = { haut: [], bas: [] }, out = [];
  for (const m of mots.sort((a, b) => b.x - a.x)) {
    const cote = m.c.signe ? 'haut' : 'bas';
    let left = Math.min(W - m.w, Math.max(0, m.x - m.w / 2));
    let L = lanes[cote].findIndex((r) => r.every(([a, b]) => left + m.w < a - 4 || left > b + 4));
    if (L < 0) { lanes[cote].push([]); L = lanes[cote].length - 1; }
    lanes[cote][L].push([left, left + m.w]);
    out.push({ ...m, left, cote, L });
  }
  const nh = lanes.haut.length, nb = lanes.bas.length, LH = 30, LB = 22, axe = nh * LH + 14;
  const H = axe + 14 + nb * LB + 4;
  return '<div class="flb4-e" style="height:' + H + 'px" data-role="echelle">'
    + '<span class="flb4-axe" style="top:' + axe + 'px"></span><span class="flb4-g" style="top:' + (axe + 4) + 'px">commun · ' + CATALOGUE + '</span><span class="flb4-d" style="top:' + (axe + 4) + 'px">rare · lui seul</span>'
    + out.map((m) => {
      const top = m.cote === 'haut' ? axe - (m.L + 1) * LH : axe + 16 + m.L * LB;
      const coul = m.c.famille ? T(m.c.famille) : '#16161a';
      return '<span class="flb4-pin" style="left:' + m.x + 'px;top:' + (m.cote === 'haut' ? top + 24 : axe) + 'px;height:' + (m.cote === 'haut' ? axe - top - 24 : top - axe + 2) + 'px"></span>'
        + '<span class="flb4-m flb4-' + m.cote + '"' + (m.c.famille ? ' data-famille="' + m.c.famille + '"' : '') + ' style="left:' + m.left + 'px;top:' + top + 'px;width:' + m.w + 'px">'
        + (m.c.famille ? pi(m.c.famille, m.cote === 'haut' ? 16 : 12) : '') + '<b style="color:' + coul + '">' + esc(m.c.mot) + '</b><span class="num">' + m.c.chez + '</span></span>';
    }).join('') + '</div>';
}

function feuille(h) {
  const signe = h.concepts.filter((c) => c.signe).slice(0, 3);
  const aussi = signe.map((c) => {
    const noms = c.autres.slice().sort((a, b) => PACK.has(b) - PACK.has(a));
    return '<li><b style="color:' + (c.famille ? T(c.famille) : '#16161a') + '">' + esc(c.mot) + '</b><span class="flb4-ch">' + (noms.length ? 'aussi chez ' + noms.slice(0, 3).map((n) => (PACK.has(n) ? '<span class="flb4-h" data-houblon="' + esc(n) + '">' + esc(n) + '</span>' : esc(n))).join(', ') + (noms.length > 3 ? ' +' + (noms.length - 3) : '') : 'lui seul au catalogue') + '</span></li>';
  }).join('');
  return '<section class="flb-feuille flb4-f0" role="dialog" aria-label="Fiche de ' + esc(h.nom) + '"><span class="flb-poignee"></span>'
    + '<header class="flb4-t"><div>' + titre(h) + '<div class="flb4-a">' + alpha(h) + '</div></div>' + croix(h) + '</header>'
    + '<div class="flb4-u">' + usage(h) + stock(h) + selecteur(h.nom, 'pastilles') + '</div>'
    + '<div class="flb4-r">' + radar(h, { taille: 362, rayon: 74, petit: true }) + '</div>'
    + '<div class="flb4-o"><span class="flb4-k">rare ou commun ?</span>' + legende('flb4-' + h.cle, ['Chaque mot de ses fiches, traduit, sur une échelle : à gauche, dit de beaucoup de houblons ; à droite, de très peu.', 'Le nombre : chez combien des 318 houblons du catalogue.', 'En haut, en gras : sa signature, que ses fiches disent le plus.']) + lentille() + '</div>'
    + echelle(h)
    + '<p class="flb4-fam"><span class="flb4-k">le radar dit aussi</span>' + h.familles.map((a) => '<span data-famille="' + a.f + '">' + pi(a.f, 14) + '<b style="color:' + T(a.f) + '">' + NOM[a.f] + '</b> ' + a.n + '/' + a.N + (h.concepts.filter((c) => c.famille === a.f).every((c) => c.seulCategorie) ? ' cat.' : '') + '</span>').join('') + '</p>'
    + '<ul class="flb4-l">' + aussi + '</ul>'
    + gout(h) + '</section>';
}

const CSS = `
.flb4 .flb-cadre { background:#d9dadd; }
.flb4-t { display:flex; align-items:flex-start; justify-content:space-between; }
.flb4-a { margin-top:2px; }
.flb4-u { display:flex; align-items:center; gap:6px; }
.flb4-u .flb-sel { flex:1; margin-left:4px; }
.flb4-u .flb-sel button { height:26px; font-size:12px; padding:0 8px; }
.flb4-r { display:flex; justify-content:center; margin:-4px 0 -8px; }
.flb4-o { display:flex; align-items:center; gap:8px; }
.flb4-o .flb-seg { margin-left:auto; }
.flb4-k { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--gris); }
.flb4-e { position:relative; width:362px; margin:0 auto; }
.flb4-axe { position:absolute; left:0; right:0; height:4px; border-radius:2px; background:linear-gradient(90deg,#d5d8df,#16161a); }
.flb4-g, .flb4-d { position:absolute; font-size:11px; color:var(--gris); }
.flb4-g { left:0; } .flb4-d { right:0; }
.flb4-pin { position:absolute; width:2px; margin-left:-1px; background:#9ea2ac; }
.flb4-m { position:absolute; background:#fff; z-index:1; padding:0 2px; display:flex; align-items:center; justify-content:center; gap:3px; white-space:nowrap; }
.flb4-haut b { font-size:17px; font-weight:700; }
.flb4-bas b { font-size:13px; font-weight:400; }
.flb4-m .num { font-size:11px; color:var(--gris); }
.flb4-fam { display:flex; flex-wrap:wrap; align-items:center; gap:2px 10px; font-size:13px; }
.flb4-fam span[data-famille] { display:inline-flex; align-items:center; gap:3px; }
.flb4-l { list-style:none; display:flex; flex-direction:column; gap:4px; background:var(--mur); border-radius:8px; padding:8px 10px; }
.flb4-l li { display:flex; flex-direction:column; }
.flb4-l b { font-size:15px; font-weight:700; }
.flb4-ch { font-size:13px; color:var(--gris); }
.flb4-h { color:var(--encre); text-decoration:underline dotted; text-underline-offset:3px; user-select:none; -webkit-user-select:none; }
`;

ecrire(ici, page({ id: 'flb4', nom: 'ses mots sur l\'échelle du commun au rare', css: CSS, debut: 'Nelson Sauvin', feuille, cadre: (s) => fond(48) + s,
  fiches: [...new Set(HOUBLONS.flatMap((h) => h.concepts.flatMap((c) => c.autres)))].filter((n) => PACK.has(n)) }));
console.log('flb4 écrit');
