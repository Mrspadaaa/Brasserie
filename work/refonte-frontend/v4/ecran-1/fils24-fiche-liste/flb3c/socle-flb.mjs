// Série b (lot D125) : le vocabulaire commun aux huit concepts, pas un gabarit. Chaque concept compose sa
// propre feuille avec ces pièces : pictos au trait (épicé : cannelle et clou croisés, p-spice), couleurs des
// familles, α et usage en mot, stock en badge, lentille au style / absolu, légende derrière « ? », croix pour
// sortir, radar de la fiche g1, fiche courte à l'appui long (D25), sélecteur des cinq houblons.
// Classes du socle préfixées « flb- », celles d'un concept « flbN- » (L26). Assemblage par concaténation.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOUBLONS, NOM, RADAR, BANDE, JETONS, STYLE, DEMANDE, fichePack, CATALOGUE } from './donnees-flb.mjs';

export { HOUBLONS, NOM, RADAR, BANDE, JETONS, STYLE, DEMANDE, CATALOGUE };
const ici = path.dirname(fileURLToPath(import.meta.url));
const planche = fs.readFileSync(path.resolve(ici, '../../fils17-standard/v3/planche.html'), 'utf8');
const PICTOS = planche.split('\n').filter((l) => /<symbol id="p-/.test(l)).join('\n');
// Icônes d'action : une seule épaisseur rendue, 1,5 px (2,25 sur 24, à 16 px) ; le stock à 14 px (2,571).
const ICONES = [
  '<symbol id="flb-i-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></symbol>',
  '<symbol id="flb-i-coeur" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/></symbol>',
  '<symbol id="flb-i-ban" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/></symbol>',
  '<symbol id="flb-i-cible" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/></symbol>',
  '<symbol id="flb-i-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></symbol>',
  planche.split('\n').find((l) => l.includes('<symbol id="j-stock"')).trim().replace('id="j-stock"', 'id="flb-i-stock"'),
].join('\n');
export const SYMBOLES = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
  + '<pattern id="flb-hach" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V6" stroke="#c9ccd4" stroke-width="1.4"/></pattern>'
  + '</defs>\n' + PICTOS + '\n' + ICONES + '\n</svg>';

const esc = (s) => String(s).split('&').join('&amp;').split('<').join('&lt;');
export { esc };
export const virg = (n) => String(n).replace('.', ',');
export const T = (f) => JETONS[f].texte;
export const B = (f) => JETONS[f].base;
export const F = (f) => JETONS[f].fond;
export const H = (nom) => HOUBLONS.find((h) => h.nom === nom);

export function pi(f, s = 16, cls = 'flb-pi') { return '<svg class="' + cls + '" width="' + s + '" height="' + s + '" data-famille="' + f + '" aria-label="' + NOM[f] + '"><use href="#p-' + f + '"/></svg>'; }
export function ic(nom, s = 16) { return '<svg class="flb-ic" width="' + s + '" height="' + s + '" aria-hidden="true"><use href="#flb-i-' + nom + '"/></svg>'; }

// L'étape derrière la feuille, assombrie (g1-feuille).
export function fond(h = 92) {
  return '<div class="flb-fond" aria-hidden="true" style="height:' + h + 'px"><div class="flb-fond-l"><span class="flb-fond-r">‹</span><b>Houblons</b> <span>3/7</span><span class="flb-fond-p">16D <i>hypothèse</i></span></div>'
    + (h > 70 ? '<div class="flb-fond-b"><span>IBU <b>60</b></span><span>OG <b>1,066</b></span><span>EBC <b>70</b></span></div>' : '') + '</div>';
}
export function croix(h) { return '<a class="flb-x" href="#" role="button" aria-label="Fermer la fiche de ' + esc(h.nom) + '">' + ic('x', 16) + '</a>'; }
export function usage(h, cls = '') { return '<span class="flb-us ' + cls + '" data-role="usage" data-usage="' + h.usageCle + '">' + h.usage + '</span>'; }
export function stock(h) {
  const t = h.stock.etat === 'en stock' ? h.stock.g + ' g' : h.stock.etat;
  return '<span class="flb-stk' + (h.stock.etat === 'en stock' ? '' : ' flb-stk-0') + '" role="img" aria-label="stock : ' + t + '"><svg width="14" height="14" aria-hidden="true"><use href="#flb-i-stock"/></svg>' + t + '</span>';
}
export function titre(h, tag = 'h2', cls = 'flb-nom') { return '<' + tag + ' class="' + cls + '">' + esc(h.nom) + ' <span class="flb-cible" role="img" aria-label="repère">' + ic('cible', 16) + '</span></' + tag + '>'; }
// α : la plage des fiches en gros, le lot à côté, et sa jauge (le lot hors de la plage se voit).
export function alpha(h, opt = {}) {
  const lo = Math.min(h.alpha.min, h.alpha.lot) - 1, hi = Math.max(h.alpha.max, h.alpha.lot) + 1, pc = (x) => ((x - lo) / (hi - lo) * 100).toFixed(1) + '%';
  const hors = h.alpha.lot < h.alpha.min || h.alpha.lot > h.alpha.max;
  return '<div class="flb-al ' + (opt.cls || '') + '"><span class="flb-al-a">α <b>' + h.alpha.texte + '</b></span><span class="flb-al-l' + (hors ? ' flb-hors' : '') + '">lot ' + h.alpha.lotTexte + '</span>'
    + (opt.jauge === false ? '' : '<span class="flb-jg" aria-hidden="true"><i class="flb-jg-p" style="left:' + pc(h.alpha.min) + ';width:calc(' + pc(h.alpha.max) + ' - ' + pc(h.alpha.min) + ')"></i><i class="flb-jg-l' + (hors ? ' flb-hors-b' : '') + '" style="left:' + pc(h.alpha.lot) + '"></i></span>') + '</div>';
}
export function bande(h, cls = '') {
  return '<div class="flb-bande ' + cls + '" aria-label="12 familles">' + BANDE.map((f) => { const a = h.familles.find((x) => x.f === f); return '<i style="background:' + (a ? (a.n / a.N >= 0.5 ? B(f) : F(f)) : '#eceef2') + (a && a.n / a.N < 0.5 ? ';box-shadow:inset 0 0 0 2px ' + B(f) : '') + '"></i>'; }).join('') + '</div>';
}
export function lentille(cls = '') {
  return '<span class="flb-seg ' + cls + '" data-lecture role="radiogroup" aria-label="Lecture au style ou absolue"><button type="button" role="radio" aria-checked="true" data-e="style">Au style</button><button type="button" role="radio" aria-checked="false" data-e="absolu">Absolu</button></span>';
}
export function legende(id, lignes, cls = '') {
  return '<span class="flb-lg ' + cls + '"><button type="button" class="flb-aide" data-role="legende-bouton" aria-expanded="false" aria-controls="lg-' + id + '" aria-label="Lire la légende">?</button>'
    + '<span class="flb-leg" id="lg-' + id + '" data-role="legende" hidden>' + lignes.map((l) => '<span>' + l + '</span>').join('') + '</span></span>';
}
export function gout(h, cls = '') {
  return '<div class="flb-act ' + cls + '"><span class="flb-g" role="group" data-role="gout" aria-label="Mon goût pour ' + esc(h.nom) + '"><button type="button" data-k="aimer" aria-pressed="false" aria-label="Aimer ' + esc(h.nom) + '">' + ic('coeur') + '</button><button type="button" data-k="exclure" aria-pressed="false" aria-label="Exclure ' + esc(h.nom) + '">' + ic('ban') + '</button></span><a class="flb-cmp" href="#">Comparer</a></div>';
}
// Le sélecteur des cinq houblons de la maquette : un toucher change la fiche, un appui long ouvre la fiche courte.
export function selecteur(courant, forme = 'onglets') {
  return '<nav class="flb-sel flb-sel-' + forme + '" aria-label="Houblons de la maquette">' + HOUBLONS.map((h) => '<button type="button" data-aller="' + esc(h.nom) + '" data-houblon="' + esc(h.nom) + '" aria-pressed="' + (h.nom === courant) + '">' + esc(h.nom) + '</button>').join('') + '</nav>';
}

// Le radar de la fiche g1 : 12 axes, « n/N » par axe, inconnu « ? » hachuré, flèches de sa demande ; au style, les
// secteurs que la stout attend (zone du style, data-role="zone").
let nRadar = 0;
export function radar(h, o = {}) {
  const mk = 'flb-fl-' + (++nRadar);
  const W = o.taille || 300, lab = o.etiquettes === false ? 6 : (o.petit ? 64 : 80), R = o.rayon || Math.round(W / 2 - lab), Hh = 2 * R + (o.etiquettes === false ? 12 : o.demande === false ? 44 : 76), cx = W / 2, cy = Hh / 2, cls = o.cls || '';
  const ang = (i) => (-90 + i * 30) * Math.PI / 180, P = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
  const v = (f) => { const a = h.familles.find((x) => x.f === f); return a ? a.n / a.N : null; };
  const sect = (i, r, extra) => { const [x1, y1] = P(i - 0.5, r), [x2, y2] = P(i + 0.5, r); return '<path d="M' + cx + ' ' + cy + 'L' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'A' + r + ' ' + r + ' 0 0 1 ' + x2.toFixed(1) + ' ' + y2.toFixed(1) + 'Z" ' + extra + '/>'; };
  let s = '<svg class="flb-radar ' + cls + '" width="' + W + '" height="' + Hh + '" viewBox="0 0 ' + W + ' ' + Hh + '"' + (o.fiche ? ' data-radar data-objet="fiche"' : ' data-radar data-objet="houblon"') + ' role="img" aria-label="Radar des familles de ' + esc(h.nom) + '">';
  s += '<g class="flb-zone" data-role="zone">' + RADAR.map((f, i) => (STYLE.attend.includes(f) ? sect(i, R, 'fill="#f1f2f5" stroke="#8a8f9c" stroke-width="1.6" stroke-dasharray="4 3"') : '')).join('') + '</g>';
  s += RADAR.map((f, i) => (v(f) == null ? sect(i, R, 'fill="url(#flb-hach)" opacity=".9"') : '')).join('');
  for (const k of [0.5, 1]) s += '<polygon points="' + RADAR.map((f, i) => P(i, R * k).map((x) => x.toFixed(1)).join(',')).join(' ') + '" fill="none" stroke="#d5d8df" stroke-width="1"/>';
  s += RADAR.map((f, i) => { const [x, y] = P(i, R); return '<line x1="' + cx + '" y1="' + cy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="' + (v(f) == null ? '#d5d8df' : B(f)) + '" stroke-width="' + (v(f) == null ? 1 : 1.6) + '"/>'; }).join('');
  const pts = RADAR.map((f, i) => P(i, R * (v(f) == null ? 0.06 : 0.1 + 0.9 * v(f))));
  s += '<polygon points="' + pts.map((p) => p.map((x) => x.toFixed(1)).join(',')).join(' ') + '" fill="rgba(22,22,26,.12)" stroke="#16161a" stroke-width="2" stroke-linejoin="round"/>';
  s += pts.map((p, i) => { const f = RADAR[i], a = h.familles.find((x) => x.f === f); return v(f) == null ? '' : '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (a.premier ? 4.5 : 3.6) + '" fill="' + (a.premier ? '#16161a' : '#fff') + '" stroke="#16161a" stroke-width="1.6"/>'; }).join('');
  if (o.demande !== false) for (const [f, sg] of [[DEMANDE.plus, 1], [DEMANDE.moins, -1]]) {
    const i = RADAR.indexOf(f), [x1, y1] = P(i, R + (sg > 0 ? 4 : 18)), [x2, y2] = P(i, R + (sg > 0 ? 18 : 4));
    s += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="#16161a" stroke-width="2.2" marker-end="url(#' + mk + ')"/>';
  }
  s += '<defs><marker id="' + mk + '" viewBox="0 0 8 8" refX="5" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 8 4 0 8Z" fill="#16161a"/></marker></defs>';
  if (o.etiquettes !== false) s += RADAR.map((f, i) => {
    const dem = o.demande !== false && (f === DEMANDE.plus || f === DEMANDE.moins), [x, y] = P(i, R + (dem ? 32 : o.petit ? 16 : 20)), a = h.familles.find((z) => z.f === f);
    const anc = Math.abs(x - cx) < 8 ? 'middle' : x > cx ? 'start' : 'end';
    const t = a ? NOM[f] + ' ' + a.n + '/' + a.N : NOM[f] + ' ?';
    return '<text x="' + x.toFixed(1) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="' + anc + '" font-size="' + (o.petit ? 11 : 13) + '" font-weight="' + (dem || (a && a.premier) ? 700 : 400) + '" fill="' + (a ? '#16161a' : '#55555f') + '">' + t + '</text>';
  }).join('');
  return s + '</svg>';
}

// La fiche courte (appui long, D25 ; type Citra cryo) pour tout houblon du pack.
function ficheCourte(nom) {
  const p = fichePack(nom); if (!p) return null;
  const h = { nom, familles: p.familles.map((a) => ({ ...a, premier: false })) };
  return '<div class="flb-fv" data-k="voile" aria-hidden="true"></div><section class="flb-fc" data-role="fiche" role="dialog" tabindex="-1" aria-label="Fiche de ' + esc(nom) + '">'
    + '<header class="flb-fc-t"><h3>' + esc(nom) + '</h3><span class="flb-us" data-role="usage" data-usage="x">' + p.usage + '</span><span class="flb-stk">' + p.stock + '</span>'
    + '<button type="button" class="flb-x" data-role="fermer-fiche" data-k="fermer" aria-label="Fermer la fiche de ' + esc(nom) + '">' + ic('x') + '</button></header>'
    + '<p class="flb-fc-a" data-role="fiche-alpha"><b>α ' + p.alpha + '</b> · lot ' + p.lot + '</p>'
    + '<p class="flb-fc-f" data-role="fiche-arome">' + p.familles.map((a) => '<span>' + pi(a.f, 14) + '<b style="color:' + T(a.f) + '">' + NOM[a.f] + '</b> ' + a.n + '/' + a.N + '</span>').join('') + '</p>'
    + '<div class="flb-fc-r">' + radar(h, { taille: 220, fiche: true, petit: true, demande: false }) + '</div>'
    + '<div class="flb-fc-g"><span class="flb-g" role="group" data-role="gout" aria-label="Mon goût pour ' + esc(nom) + '"><button type="button" data-k="aimer" aria-pressed="false" aria-label="Aimer ' + esc(nom) + '">' + ic('coeur') + '</button><button type="button" data-k="exclure" aria-pressed="false" aria-label="Exclure ' + esc(nom) + '">' + ic('ban') + '</button></span></div></section>';
}

export const CSS = `
:root { --encre:#16161a; --gris:#55555f; --trait:#e3e5eb; --mur:#f4f4f6; --acc:#c2410c; --sans:"Source Sans 3","Segoe UI",system-ui,-apple-system,sans-serif; --mono:"IBM Plex Mono",ui-monospace,Consolas,monospace; }
[hidden] { display:none !important; }
* { box-sizing:border-box; margin:0; padding:0; }
html, body { background:#fff; }
body { color:var(--encre); font:400 14px/1.3 var(--sans); -webkit-tap-highlight-color:transparent; overflow-x:hidden; }
button { font:inherit; color:inherit; background:none; border:0; cursor:pointer; }
a { color:inherit; text-decoration:none; }
button:focus-visible, a:focus-visible { outline:2px solid var(--encre); outline-offset:2px; }
svg { display:block; flex:none; }
.num { font-family:var(--mono); font-variant-numeric:tabular-nums; }
.flb-cadre { max-width:390px; margin:0 auto; position:relative; }
.flb-fond { background:#d9dadd; padding:10px 14px 0; display:flex; flex-direction:column; gap:8px; position:relative; }
.flb-fond::after { content:""; position:absolute; inset:0; background:rgba(22,22,26,.18); }
.flb-fond-l { display:flex; align-items:center; gap:8px; font-size:20px; }
.flb-fond-l b { font-weight:700; }
.flb-fond-r { font-size:26px; line-height:1; }
.flb-fond-p { margin-left:auto; font-size:14px; border:1px solid #9a9ca3; border-radius:15px; padding:2px 10px; }
.flb-fond-p i { font-style:normal; background:#c4c6cb; border-radius:10px; padding:0 6px; }
.flb-fond-b { display:flex; justify-content:space-between; border:1px solid #9a9ca3; border-radius:20px; padding:4px 16px; font-size:13px; }
.flb-fond-b b { font-size:18px; }
.flb-feuille { background:#fff; border-radius:24px 24px 0 0; margin-top:-14px; position:relative; z-index:2; padding:8px 14px 14px; display:flex; flex-direction:column; gap:8px; min-height:calc(100vh - 80px); }
.flb-poignee { width:40px; height:4px; border-radius:2px; background:#c9cbd1; margin:0 auto 2px; }
.flb-x { width:32px; height:32px; border-radius:50%; background:var(--mur); display:inline-flex; align-items:center; justify-content:center; flex:none; color:var(--encre); }
.flb-nom { font-size:24px; font-weight:700; display:flex; align-items:center; gap:6px; line-height:1.1; }
.flb-cible { color:var(--gris); display:inline-flex; }
.flb-us { font-size:13px; font-weight:600; border:1px solid #c9cbd1; border-radius:12px; padding:1px 9px; white-space:nowrap; background:#fff; }
.flb-stk { display:inline-flex; align-items:center; gap:3px; font-size:12px; color:var(--gris); white-space:nowrap; }
.flb-stk-0 { color:var(--acc); }
.flb-al { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.flb-al-a { font-size:18px; }
.flb-al-a b { font-size:24px; font-weight:600; }
.flb-al-l { font-size:13px; color:var(--gris); }
.flb-hors { color:var(--acc); }
.flb-jg { position:relative; width:84px; height:8px; background:#eceef2; border-radius:4px; }
.flb-jg i { position:absolute; top:0; bottom:0; display:block; }
.flb-jg-p { background:#9ea2ac; border-radius:4px; }
.flb-jg-l { width:4px; margin-left:-2px; top:-3px !important; bottom:-3px !important; background:var(--encre); border-radius:2px; }
.flb-hors-b { background:var(--acc); }
.flb-bande { display:flex; gap:3px; }
.flb-bande i { flex:1; height:14px; border-radius:2px; display:block; }
.flb-seg { display:inline-flex; background:#eceef2; border-radius:15px; padding:2px; }
.flb-seg button { height:26px; padding:0 10px; border-radius:13px; font-size:13px; color:var(--gris); }
.flb-seg button[aria-checked="true"] { background:#fff; color:var(--encre); font-weight:600; }
body.flb-abs .flb-zone { display:none; }
.flb-lg { position:relative; display:inline-flex; }
.flb-aide { width:26px; height:26px; border-radius:50%; border:1px solid #c9cbd1; background:#fff; font-weight:700; color:var(--gris); }
.flb-leg { position:absolute; top:32px; left:0; z-index:30; background:#fff; border:1px solid #c9cbd1; border-radius:8px; padding:8px 10px; font-size:13px; display:flex; flex-direction:column; gap:4px; width:280px; box-shadow:0 8px 24px -12px rgba(22,22,26,.45); }
.flb-leg.flb-leg-d { left:auto; right:0; }
.flb-pi { width:16px; height:16px; }
.flb-ic { color:currentColor; }
.flb-act { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.flb-g { display:inline-flex; gap:4px; background:var(--mur); border-radius:20px; padding:4px; }
.flb-g button { width:32px; height:32px; border-radius:16px; display:inline-flex; align-items:center; justify-content:center; color:var(--encre); }
.flb-g button[aria-pressed="true"] { background:var(--encre); color:#fff; }
.flb-cmp { display:inline-flex; align-items:center; height:40px; padding:0 22px; border:1px solid #c9cbd1; border-radius:20px; font-size:16px; font-weight:600; background:#fff; }
.flb-sel { display:flex; gap:4px; overflow-x:auto; scrollbar-width:none; }
.flb-sel button { flex:none; height:28px; padding:0 10px; border-radius:14px; font-size:13px; color:var(--gris); background:var(--mur); white-space:nowrap; user-select:none; -webkit-user-select:none; }
.flb-sel button[aria-pressed="true"] { background:var(--encre); color:#fff; font-weight:600; }
.flb-radar text { font-family:var(--sans); }
/* La fiche courte, à l'appui long. */
#flb-fiche { position:relative; z-index:60; }
.flb-fv { position:fixed; inset:0; background:rgba(22,22,26,.36); }
.flb-fc { position:fixed; left:0; right:0; bottom:0; max-width:390px; margin:0 auto; background:#fff; border-radius:24px 24px 0 0; padding:12px 14px 14px; display:flex; flex-direction:column; gap:8px; box-shadow:0 -12px 40px -16px rgba(22,22,26,.6); }
.mode-bulle .flb-fc { left:calc(50% + 205px); right:auto; bottom:auto; top:16px; width:340px; border-radius:8px; margin:0; }
@media (max-width:1000px) { .mode-bulle .flb-fc { left:auto; right:16px; } }
.flb-fc-t { display:flex; align-items:center; gap:8px; }
.flb-fc-t h3 { font-size:18px; font-weight:700; }
.flb-fc-t .flb-x { margin-left:auto; }
.flb-fc-a { font-size:14px; } .flb-fc-a b { font-size:16px; }
.flb-fc-f { display:flex; flex-wrap:wrap; gap:4px 12px; font-size:13px; }
.flb-fc-f span { display:inline-flex; align-items:center; gap:4px; }
.flb-fc-r { display:flex; justify-content:center; }
`;

function client() {
  var FICHES = window.FLB_FICHES;
  document.querySelectorAll('[data-e]').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('[data-e]').forEach(function (x) { x.setAttribute('aria-checked', String(x.dataset.e === b.dataset.e)); });
      document.body.classList.toggle('flb-abs', b.dataset.e === 'absolu');
    });
  });
  function fermerLegendes() { document.querySelectorAll('[data-role=legende]').forEach(function (l) { l.hidden = true; }); document.querySelectorAll('[data-role=legende-bouton]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); }); }
  document.querySelectorAll('[data-role=legende-bouton]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.stopPropagation(); var l = document.getElementById(b.getAttribute('aria-controls')); var o = l.hidden; fermerLegendes(); l.hidden = !o; b.setAttribute('aria-expanded', String(o)); });
  });
  function aller(nom) {
    document.querySelectorAll('[data-h]').forEach(function (s) { s.hidden = s.dataset.h !== nom; });
    document.querySelectorAll('[data-aller]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.aller === nom)); });
  }
  // La fiche courte : appui long (500 ms) ou survol long (750 ms) sur un nom de houblon.
  var R = document.getElementById('flb-fiche'), ouverte = false, appui = null, avale = 0, survol = null, tFerme = null;
  function ouvrir(nom, mode) { var f = FICHES[nom]; if (!f) return; R.className = 'mode-' + mode; R.innerHTML = mode === 'bulle' ? f.split('<div class="flb-fv" data-k="voile" aria-hidden="true"></div>').join('') : f; ouverte = true; }
  function fermer() { R.innerHTML = ''; ouverte = false; }
  R.addEventListener('click', function (e) {
    var b = e.target.closest('[data-k]'); if (!b) return;
    if (b.dataset.k === 'fermer' || b.dataset.k === 'voile') { e.stopPropagation(); fermer(); return; }
    if (b.dataset.k === 'aimer' || b.dataset.k === 'exclure') b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
  });
  document.addEventListener('click', function (e) {
    if (performance.now() < avale) { e.stopPropagation(); e.preventDefault(); return; }
    var a = e.target.closest && e.target.closest('[data-aller]'); if (a) { aller(a.dataset.aller); return; }
    var g = e.target.closest && e.target.closest('.flb-g [data-k]'); if (g && !R.contains(g)) g.setAttribute('aria-pressed', String(g.getAttribute('aria-pressed') !== 'true'));
    if (!e.target.closest('.flb-lg')) fermerLegendes();
    if (e.target.closest('a[href="#"]')) e.preventDefault();
  }, true);
  document.addEventListener('pointerdown', function (e) {
    if (R.contains(e.target)) return;
    var h = e.target.closest && e.target.closest('[data-houblon]'); if (!h) return;
    var a = { x: e.clientX, y: e.clientY, id: e.pointerId, nom: h.dataset.houblon };
    appui = a; a.t = setTimeout(function () { if (appui !== a) return; appui = null; avale = performance.now() + 600; ouvrir(a.nom, e.pointerType === 'mouse' || innerWidth >= 700 ? 'bulle' : 'feuille'); }, 500);
  }, true);
  document.addEventListener('pointermove', function (e) { if (appui && e.pointerId === appui.id && Math.hypot(e.clientX - appui.x, e.clientY - appui.y) > 10) { clearTimeout(appui.t); appui = null; } }, true);
  document.addEventListener('pointerup', function () { if (appui) { clearTimeout(appui.t); appui = null; } }, true);
  document.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('[data-houblon]')) e.preventDefault(); });
  document.addEventListener('pointerover', function (e) {
    if (e.pointerType !== 'mouse') return;
    if (R.contains(e.target)) { clearTimeout(tFerme); return; }
    var h = e.target.closest && e.target.closest('[data-houblon]');
    if (!h || survol) return;
    survol = setTimeout(function () { survol = null; if (!ouverte) ouvrir(h.dataset.houblon, 'bulle'); }, 750);
  });
  document.addEventListener('pointerout', function (e) {
    if (e.pointerType !== 'mouse') return;
    var vers = e.relatedTarget, h = e.target.closest && e.target.closest('[data-houblon]');
    if (h && !(vers && h.contains(vers))) { clearTimeout(survol); survol = null; }
    if (ouverte && R.className === 'mode-bulle' && !(vers && (R.contains(vers) || (vers.closest && vers.closest('[data-houblon]'))))) { clearTimeout(tFerme); tFerme = setTimeout(fermer, 650); }
  });
  addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; fermerLegendes(); if (ouverte) fermer(); });
  var q = location.search;
  var m = q.match(/houblon=([^&]+)/); if (m) aller(decodeURIComponent(m[1]));
  var mf = q.match(/fiche=([^&]+)/); if (mf) ouvrir(decodeURIComponent(mf[1]), 'feuille');
  if (/legende=1/.test(q)) document.querySelector('[data-role=legende-bouton]').click();
  if (/absolu=1/.test(q)) document.querySelector('[data-e=absolu]').click();
}

// Une page de concept. c : { id, nom, css, debut, avant(h) (hors sections), feuille(h) (une par houblon), apres, script }
export function page(c) {
  const fiches = {};
  for (const n of c.fiches || []) { const f = ficheCourte(n); if (f) fiches[n] = f; }
  for (const h of HOUBLONS) fiches[h.nom] = ficheCourte(h.nom);
  const sections = [...HOUBLONS].sort((a, b) => (b.nom === c.debut) - (a.nom === c.debut)).map((h) => '<div class="flb-h" data-h="' + esc(h.nom) + '"' + (h.nom === c.debut ? '' : ' hidden') + '>' + c.feuille(h) + '</div>').join('\n');
  return '<!doctype html>\n<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n'
    + '<title>' + esc(c.id + ' · ' + c.nom) + '</title>\n<style>' + CSS + (c.css || '') + '</style></head>\n<body class="' + c.id + '">\n' + SYMBOLES + '\n'
    + '<div class="flb-cadre">' + (c.cadre ? c.cadre(sections) : sections) + '</div>\n<div id="flb-fiche"></div>\n'
    + '<script>window.FLB_FICHES = ' + JSON.stringify(fiches).split('</').join('<\\/') + ';\n(' + client.toString() + ')();\n' + (c.script ? '(' + c.script.toString() + ')();\n' : '') + '</script>\n</body></html>\n';
}

export function ecrire(dossier, html) { fs.writeFileSync(path.join(dossier, 'etat.html'), html); }
