// Série rpb (r6a++) : le vocabulaire commun des quatre pages (pictos, couleurs, données du moteur, barres l5b,
// radar r2). Un vocabulaire, pas un gabarit : chaque page compose le sien. Classes et globales préfixées par page (L26).
import fs from 'node:fs';
import path from 'node:path';

const RACINE = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
const R6A = path.join(RACINE, 'work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/etat.html');
const PLANCHE = path.join(RACINE, 'work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html');
export const LOT = path.join(RACINE, 'work/refonte-frontend/v4/ecran-1/fils24-r6a-plus');

const brut = JSON.parse(fs.readFileSync('C:/Users/mrspa/AppData/Local/Temp/rpb/donnees.json', 'utf8'));

// ---------- Pictos (au trait, sans halo ; « épicé » : cannelle et clou croisés, D101 quater) ----------
const r6a = fs.readFileSync(R6A, 'utf8');
const planche = fs.readFileSync(PLANCHE, 'utf8');
const symbole = (src, id) => { const s = src.indexOf(`<symbol id="${id}"`); if (s < 0) throw new Error('symbole ' + id); return src.slice(s, src.indexOf('</symbol>', s) + 9); };
const FAMS = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'];
const ICONES = ['i-stock-12', 'i-livre-12', 'i-risque-12', 'i-check-12', 'i-x-12', 'i-aide-14', 'i-chev-r-12', 'i-chev-r-14', 'i-retourner-12', 'i-plus-14', 'i-chev-l-20', 'i-chevb-12', 'i-radar-14', 'i-barres-14', 'i-x-14', 'i-environ-12'];
export function sprite() {
  const syms = FAMS.map((f) => (f === 'spice' ? symbole(planche, 'p-spice') : symbole(r6a, 'p-' + f)));
  const ic = ICONES.map((id) => symbole(r6a, id));
  const d = r6a.indexOf('<defs><filter id="crayon"');
  const defs = r6a.slice(d, r6a.indexOf('</defs>', d) + 7);
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">${syms.join('')}${ic.join('')}${defs}</svg>`;
}

// ---------- Familles ----------
export const NOMS = { floral: 'Floral', herbal: 'Herbacé', earthy: 'Terreux', citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', resin: 'Résineux', spice: 'Épicé', green: 'Végétal' };
export const COUL = {
  floral: ['#bf86d6', '#9840bc', '#f3e8f7'], herbal: ['#3f8a5f', '#377853', '#eaf5ef'], earthy: ['#9a8a66', '#75694d', '#f3f1ed'],
  citrus: ['#d9b414', '#856e0c', '#fcf8e3'], tropical: ['#ee9b2f', '#9b5d0d', '#fdf1e3'], stoneFruit: ['#e88d68', '#b5481c', '#fbebe4'],
  pomeFruit: ['#a3bd38', '#667623', '#f5f8e7'], berries: ['#9b3f74', '#9b3f74', '#f6e9f1'], melon: ['#6fc09b', '#357a5b', '#eaf6f0'],
  resin: ['#2f6b5f', '#2f6b5f', '#eaf6f3'], spice: ['#7a4e3a', '#7a4e3a', '#f5eeea'], green: ['#6aa33a', '#4f7a2b', '#eff7e8'],
};
export const famCss = () => FAMS.map((f) => `[data-famille="${f}"]{--b:${COUL[f][0]};--t:${COUL[f][1]};--f:${COUL[f][2]}}`).join('\n');

// ---------- Données du moteur (moteur de la maquette, 24.10 ; 4 g/L, US-05, dry hop 3 j) ----------
export const MOMENTS = [
  { id: 'b60', nom: '60′', long: 'à 60′' }, { id: 'b10', nom: '10′', long: 'à 10′' }, { id: 'wp', nom: 'WP', long: 'au whirlpool' },
  { id: 'actif', nom: 'actif', long: 'dry hop actif, 3 j' }, { id: 'apres', nom: 'après', long: 'dry hop après, 3 j' },
];
const K = { cascade: 'beermaverick-cascade', idaho7: 'beermaverick-idaho-7', galaxy: 'beermaverick-galaxy', nugget: 'beermaverick-nugget' };
const COUL_H = { cascade: '#781838', idaho7: '#e80030', galaxy: '#681878', nugget: '#6b6b75' };
const r2 = (x) => Math.round(x * 100) / 100;
export function donnees() {
  const H = {};
  for (const [k, cle] of Object.entries(K)) {
    const h = brut.houblons[cle];
    H[k] = {
      k, nom: h.nom, couleur: COUL_H[k],
      alpha: h.alpha ? { v: h.alpha.valeur, plage: h.alpha.plage, hors: h.alpha.horsFiches, src: h.alpha.source } : null,
      role: h.role.mot, stock: h.stock,
      familles: Object.fromEntries(Object.entries(h.familles).filter(([, v]) => v.niveau !== 'non décrit').map(([f, v]) => [f, v.niveau])),
      sources: Object.fromEntries(Object.entries(h.familles).filter(([, v]) => v.niveau !== 'non décrit').map(([f, v]) => [f, v.fiches + '/' + v.sur])),
      huile: brut.huiles[cle],
      mots: (brut.mots[cle] || []).filter((m) => m.seul).map((m) => ({ mot: m.mot, hors: m.famille == null, f: m.famille })),
    };
  }
  const C = {};
  for (const m of MOMENTS) {
    C[m.id] = {};
    for (const [k, cle] of Object.entries(K)) {
      const x = brut.moments[m.id][cle];
      const cel = {};
      for (const f of FAMS) {
        const c = x.cellules[f];
        cel[f] = { c: r2(c.centre), b: r2(c.bas), h: r2(c.haut), a: c.avant == null ? null : r2(c.avant), bh: c.bandeHaut, d: c.domaine, dc: c.dCran, inc: c.inconnu, hors: c.hors };
      }
      C[m.id][k] = { cel, sorties: x.sorties, ibu: x.ibu ? Math.round(x.ibu.valeur) : null };
    }
  }
  const style = Object.fromEntries(FAMS.map((f) => [f, { bh: brut.style.families[f].band ? brut.style.families[f].band[1] : null, d: brut.style.families[f].domain[1] }]));
  return { H, C, style, MOMENTS, NOMS, ordre: ['cascade', 'idaho7', 'galaxy'], ref: 'nugget' };
}
// Rangées : les familles connues d'au moins un houblon, puis « inconnus » (pépins, melon, végétal : aucune fiche, rien de simulé).
export const RANGEES = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'berries', 'resin', 'spice'];
export const INCONNUES = ['pomeFruit', 'melon', 'green'];

// ---------- Code client commun : barres l5b, radar r2, pictos (PX = préfixe de la page) ----------
export const LIB = String.raw`
var NOMS = ${JSON.stringify(NOMS)};
function pic(f, s, cl) { return '<svg class="' + PX + '-pic ' + (cl || '') + '" data-famille="' + f + '" width="' + s + '" height="' + s + '" aria-label="' + NOMS[f] + '" role="img"><use href="#p-' + f + '"/></svg>'; }
function ico(id, s, cl) { return '<svg class="' + PX + '-ico ' + (cl || '') + '" width="' + s + '" height="' + s + '" aria-hidden="true"><use href="#' + id + '-' + s + '"/></svg>'; }
function fr(x, n) { return x.toLocaleString('fr-CH', { minimumFractionDigits: n, maximumFractionDigits: n }); }
function cran(x) { return x == null ? '?' : '~' + (x >= 0 ? '+' : '−') + fr(Math.abs(x), 1); }
// Barre l5b : zone de ta 16D pâle, la barre simulée, l'orangé au-dessus du style, l'intervalle, le trait de ta stout,
// le pointillé gris de ton Nugget au même moment (référence). Échelle au style (domaine) ou absolue (125).
function barre(c, ref, absolu, cl) {
  if (c.inc) return '<span class="' + PX + '-bar ' + PX + '-inc ' + (cl || '') + '" aria-label="inconnu, pas zéro"></span>';
  var S = absolu ? 125 : c.d, p = function (v) { return Math.max(0, Math.min(100, 100 * v / S)); };
  var bh = c.bh == null ? S : c.bh, h = '';
  h += '<i class="' + PX + '-zone" data-role="zone" style="width:' + p(bh) + '%"></i>';
  h += '<i class="' + PX + '-plein" style="width:' + p(Math.min(c.c, bh)) + '%"></i>';
  if (c.c > bh) h += '<i class="' + PX + '-orange" style="left:' + p(bh) + '%;width:' + (p(c.c) - p(bh)) + '%"></i>';
  if (c.c > S) h += '<i class="' + PX + '-sort"></i>';
  h += '<i class="' + PX + '-ic" style="left:' + p(c.b) + '%;width:' + Math.max(1, p(c.h) - p(c.b)) + '%"></i>';
  if (ref && !ref.inc) h += '<i class="' + PX + '-ref" style="left:' + p(ref.c) + '%"></i>';
  if (c.a != null) h += '<i class="' + PX + '-stout" style="left:' + p(c.a) + '%"></i>';
  return '<span class="' + PX + '-bar ' + (cl || '') + '" role="img" aria-label="' + Math.round(c.c) + ' sur ' + Math.round(S) + (c.a != null ? ', ta stout ' + Math.round(c.a) : '') + '">' + h + '</span>';
}
// Radar r2 : 12 axes, zone de ta 16D, ta stout en noir, un trait par houblon, le retenu rempli, l'inconnu hachuré.
function radar(o) {
  var F = o.familles, n = F.length, R = o.r, cx = o.w / 2, cy = o.h / 2, s = '';
  var ang = function (i) { return -Math.PI / 2 + 2 * Math.PI * i / n; };
  var pt = function (i, v) { var a = ang(i); return [cx + R * v * Math.cos(a), cy + R * v * Math.sin(a)]; };
  var S = function (f) { return o.absolu ? 125 : o.style[f].d; };
  var poly = function (vals) { return vals.map(function (v, i) { var q = pt(i, Math.min(1, Math.max(0.04, v))); return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' '); };
  s += '<defs><pattern id="' + PX + '-hach" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#b9b9c2" stroke-width="1"/></pattern></defs>';
  [0.25, 0.5, 0.75, 1].forEach(function (k) { s += '<polygon points="' + poly(F.map(function () { return k; })) + '" fill="none" stroke="#e2e2e8" stroke-width="1"/>'; });
  F.forEach(function (f, i) { var q = pt(i, 1); s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + q[0] + '" y2="' + q[1] + '" stroke="#e2e2e8"/>'; });
  s += '<polygon points="' + poly(F.map(function (f) { return o.style[f].bh == null ? 1 : o.style[f].bh / S(f); })) + '" fill="#e5efe9" stroke="#3d6b55" stroke-width="1.2"/>';
  var sel = o.series.filter(function (x) { return x.sel; })[0];
  if (sel) F.forEach(function (f, i) { if (sel.cel[f].inc) { var a = pt(i - 0.5, 1), b = pt(i + 0.5, 1); s += '<path d="M' + cx + ',' + cy + 'L' + a[0] + ',' + a[1] + 'L' + b[0] + ',' + b[1] + 'Z" fill="url(#' + PX + '-hach)" opacity=".9"/>'; } });
  o.series.forEach(function (x) {
    var v = F.map(function (f) { return x.cel[f].inc ? 0 : x.cel[f].c / S(f); });
    s += '<polygon points="' + poly(v) + '" fill="' + (x.sel ? x.couleur : 'none') + '" fill-opacity="' + (x.sel ? 0.16 : 0) + '" stroke="' + x.couleur + '" stroke-width="' + (x.sel ? 2.4 : 1.6) + '" stroke-dasharray="' + (x.ref ? '3 3' : '') + '"/>';
  });
  var stout = F.map(function (f) { var a = o.series[0].cel[f].a; return a == null ? 0 : a / S(f); });
  s += '<polygon points="' + poly(stout) + '" fill="none" stroke="#16161a" stroke-width="1.4"/>';
  F.forEach(function (f, i) {
    var q = pt(i, 1.17), z = o.pic;
    s += '<svg x="' + (q[0] - z / 2) + '" y="' + (q[1] - z / 2) + '" width="' + z + '" height="' + z + '" data-famille="' + f + '" class="' + PX + '-pic" role="img" aria-label="' + NOMS[f] + '"><use href="#p-' + f + '"/></svg>';
    var over = o.series.some(function (x) { return !x.ref && !x.cel[f].inc && x.cel[f].c > S(f); });
    if (over) { var e = pt(i, 1.0), e2 = pt(i, 1.08); s += '<line x1="' + e[0] + '" y1="' + e[1] + '" x2="' + e2[0] + '" y2="' + e2[1] + '" stroke="#c2410c" stroke-width="2.4" stroke-linecap="round"/>'; }
  });
  return '<svg class="' + PX + '-radar" ' + (o.attr || '') + ' width="' + o.w + '" height="' + o.h + '" viewBox="0 0 ' + o.w + ' ' + o.h + '" role="img" aria-label="Radar à 12 axes, au moment choisi">' + s + '</svg>';
}
// La fiche courte (g1, dans le langage de la page) : appui long ou survol long sur la tête d'un houblon.
function fiche(D) {
  var f = document.createElement('aside');
  f.className = PX + '-fiche'; f.setAttribute('data-role', 'fiche'); f.setAttribute('role', 'dialog'); f.hidden = true;
  document.body.appendChild(f);
  var ouvrir = function (k) {
    var H = D.H[k], a = H.alpha, c = D.C.apres[k].cel;
    var fam = Object.keys(H.familles).map(function (x) { return '<span class="' + PX + '-fi-f" data-famille="' + x + '">' + pic(x, 14) + NOMS[x] + ' <span class="' + PX + '-mono">' + H.sources[x] + '</span></span>'; }).join('');
    f.innerHTML = '<div class="' + PX + '-fi-h" style="--hc:' + H.couleur + '"><b>' + H.nom + '</b><span data-role="fiche-alpha" class="' + PX + '-mono">α ' + fr(a.v, 1) + ' % · ' + fr(a.plage[0], 1) + '–' + fr(a.plage[1], 1) + ' %</span><button type="button" data-role="fermer-fiche" aria-label="Fermer la fiche"><svg width="14" height="14" aria-hidden="true"><use href="#i-x-14"/></svg></button></div>'
      + '<div class="' + PX + '-fi-c">' + radar({ familles: ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'], w: 128, h: 128, r: 44, pic: 12, style: D.style, attr: 'data-radar data-objet="fiche"', series: [{ cel: c, couleur: H.couleur, sel: true }] })
      + '<div><div>' + H.role + ' · huile <span class="' + PX + '-mono">' + (H.huile ? fr(H.huile[0], 1) + '–' + fr(H.huile[1], 1) : '?') + '</span> mL/100 g</div><div class="' + PX + '-fi-fams" data-role="fiche-arome">' + fam + '</div>'
      + (H.mots.length ? '<div class="' + PX + '-fi-m">Lui seul : <b>' + H.mots.map(function (m) { return (m.hors ? '◇ ' : '') + m.mot; }).join(', ') + '</b></div>' : '') + '</div></div>'
      + '<div class="' + PX + '-fi-g" data-role="gout"><button type="button" aria-label="J\u2019aime">♡</button><button type="button" aria-label="Je n\u2019en veux pas">⊘</button><span>fiches N/M : sources qui citent la famille</span></div>';
    f.hidden = false;
  };
  var fermer = function () { f.hidden = true; };
  var minuteur = null, long = false;
  document.addEventListener('pointerdown', function (e) { var h = e.target.closest('[data-houblon]'); if (!h || e.pointerType === 'mouse') return; long = false; clearTimeout(minuteur); minuteur = setTimeout(function () { long = true; ouvrir(h.dataset.houblon); }, 500); });
  document.addEventListener('pointerup', function () { clearTimeout(minuteur); });
  document.addEventListener('pointercancel', function () { clearTimeout(minuteur); });
  document.addEventListener('click', function (e) { if (long) { long = false; e.stopPropagation(); e.preventDefault(); } if (e.target.closest('[data-role="fermer-fiche"]')) fermer(); }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fermer(); });
  var survol = null;
  document.addEventListener('pointerover', function (e) { if (e.pointerType !== 'mouse') return; var h = e.target.closest('[data-houblon]'); clearTimeout(survol); if (h) survol = setTimeout(function () { ouvrir(h.dataset.houblon); }, 800); });
  document.addEventListener('contextmenu', function (e) { if (e.target.closest('[data-houblon]')) e.preventDefault(); });
}
`;

// Le CSS commun des barres et pictos, préfixé.
export function cssBase(PX) {
  return `
${famCss()}
:root{--encre:#16161a;--gris:#5b5b66;--gris2:#8a8a94;--trait:#e2e2e8;--fond:#f4f4f7;--acc:#c2410c;--vert:#2f6b4f;
 --sans:'Source Sans 3',-apple-system,system-ui,'Segoe UI',Roboto,sans-serif;--mono:'IBM Plex Mono',ui-monospace,Consolas,monospace}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#fff;color:var(--encre);font-family:var(--sans);font-size:14px;line-height:1.25;-webkit-text-size-adjust:100%}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
button:focus-visible{outline:2px solid var(--encre);outline-offset:2px}
.${PX}-pic{display:inline-block;vertical-align:middle;flex:none}
.${PX}-ico{display:inline-block;vertical-align:middle;flex:none}
.${PX}-mono{font-family:var(--mono);font-variant-numeric:tabular-nums}
.${PX}-bar{position:relative;display:block;height:10px;background:#f1f1f4;border-radius:2px;overflow:visible}
.${PX}-bar>i{position:absolute;top:0;height:100%;display:block}
.${PX}-zone{left:0;background:var(--f);border-radius:2px 0 0 2px}
.${PX}-plein{left:0;top:1px!important;height:8px!important;background:var(--b);border-radius:2px 0 0 2px}
.${PX}-orange{top:1px!important;height:8px!important;background:var(--acc)}
.${PX}-sort{right:-6px;width:0!important;height:0!important;top:0;border-left:6px solid var(--acc);border-top:5px solid transparent;border-bottom:5px solid transparent}
.${PX}-ic{top:4.5px!important;height:1px!important;background:#3a3a44}
.${PX}-stout{top:-2px!important;height:14px!important;width:2px;margin-left:-1px;background:var(--encre)}
.${PX}-ref{top:-2px!important;height:14px!important;width:0;margin-left:-1px;border-left:2px dotted #6b6b75}
.${PX}-inc{width:44px;height:10px;background:repeating-linear-gradient(-45deg,#fff 0 2px,#aeaeb8 2px 3px);border:1px solid #aeaeb8}
.${PX}-radar{display:block}
[data-houblon]{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.${PX}-fiche{position:fixed;left:8px;right:8px;bottom:8px;max-width:414px;margin:0 auto;background:#fff;border:1px solid var(--trait);border-radius:8px;box-shadow:0 10px 34px rgba(0,0,0,.22);padding:8px 10px;z-index:9;font-size:13px}
.${PX}-fiche[hidden]{display:none}
.${PX}-fi-h{display:flex;align-items:center;gap:8px;border-left:4px solid var(--hc);padding-left:6px}
.${PX}-fi-h b{font-size:18px}
.${PX}-fi-h button{margin-left:auto;width:28px;height:28px;border-radius:14px;background:var(--fond);display:grid;place-items:center}
.${PX}-fi-c{display:grid;grid-template-columns:128px 1fr;gap:8px;align-items:center;margin-top:4px}
.${PX}-fi-fams{display:flex;flex-wrap:wrap;gap:2px 8px;margin-top:4px}
.${PX}-fi-f{display:inline-flex;align-items:center;gap:2px;color:var(--t)}
.${PX}-fi-m{margin-top:4px}
.${PX}-fi-g{display:flex;gap:8px;align-items:center;margin-top:6px;font-size:12px;color:var(--gris)}
.${PX}-fi-g button{width:28px;height:28px;border-radius:14px;border:1px solid var(--trait);font-size:14px;color:var(--encre)}
`;
}

export const TETE = (titre) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
`;

export function ecrire(id, html) {
  const dir = path.join(LOT, id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'etat.html'), html);
  console.log('écrit', path.join(dir, 'etat.html'), html.length);
}
