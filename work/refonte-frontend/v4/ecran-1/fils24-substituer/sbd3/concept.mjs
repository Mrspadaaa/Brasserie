// sbd3 — tiède : la largeur de chaque colonne est le poids du moment. Un tableau des remplaçants dont les trois
// colonnes (amertume, huiles, arôme) prennent la place que le moteur leur donne : à 60′, l'amertume occupe 60 % de
// la largeur et se lit en détail ; l'arôme, étroit et éteint. En whirlpool, les colonnes s'inversent.
import { cas, page, pic, usage, badgeStock, nomHop, croix, lentille, aide, barre, fr, fr1, g0, COURT, LEG_FAM, NUGGET } from '../sbd1/serie/socle.mjs';

const ID = 'sbd3';
const FAM = ['floral', 'herbal', 'earthy'];
const larg = (p) => Math.round(42 + 220 * p); // px : 10 % → 64, 20 % → 86, 30 % → 108, 60 % → 174
function amer(r, c, w) {
  const l = (x) => (100 * x / 20).toFixed(1), n = c.nugget;
  const tr = `<span class="sbd3-al"><i class="sbd3-o" style="left:${l(n.alpha.min)}%;width:${(l(n.alpha.max) - l(n.alpha.min)).toFixed(1)}%"></i><i class="sbd3-p" style="left:${l(r.alpha.min)}%;width:${Math.max(2, l(r.alpha.max) - l(r.alpha.min)).toFixed(1)}%;background:${r.couleur || '#4a4a55'}"></i></span>`;
  if (w < 110) return `<span class="sbd3-cn sbd-num">${r.comp.amertume ?? '?'}</span>`;
  return `<span class="sbd3-ca">${tr}<span class="sbd3-av sbd-num">α ${r.alpha.lot ? fr1(r.alpha.v) : fr1(r.alpha.min) + '–' + fr1(r.alpha.max)}</span><span class="sbd3-dv sbd-num">${g0(r.dose.g)} g</span></span>`;
}
function huiles(r, w) {
  const v = r.comp.huiles;
  return `<span class="sbd3-ch">${v == null ? '<i class="sbd3-hinc">?</i>' : `<i class="sbd3-hb"><b style="width:${v}%"></b></i>`}${w >= 100 ? `<span class="sbd-num">${v ?? '?'}</span>` : ''}</span>`;
}
function arome(r, c, w) {
  const v = r.comp.arome;
  if (w < 110) return `<span class="sbd3-cr">${FAM.map((f) => barre(f, r.prof && r.prof[f], 'sbd3-mb')).join('')}</span>`;
  return `<span class="sbd3-cr sbd3-cr-l">${FAM.map((f) => `<span class="sbd3-rf">${pic(f, 12)}${barre(f, r.prof && r.prof[f], 'sbd3-mb')}</span>`).join('')}<span class="sbd3-pc sbd-num">${v ?? '?'}</span></span>`;
}
function vue(c) {
  const p = c.poids, W = { amertume: larg(p.amertume), huiles: larg(p.huiles), arome: larg(p.arome) };
  const tot = W.amertume + W.huiles + W.arome, k = 250 / tot; for (const x in W) W[x] = Math.round(W[x] * k);
  const vif = Object.entries(p).sort((a, b) => b[1] - a[1])[0][0];
  const rows = [...c.top.slice(0, 5), ...c.stock.filter((s) => s.stock.etat === 'en stock').slice(0, 3)].filter((r, i, a) => a.indexOf(r) === i);
  const grid = `grid-template-columns:112px ${W.amertume}px ${W.huiles}px ${W.arome}px`;
  const col = (key, lab0) => { const lab = W[key] < 96 ? ({ amertume: 'Amer', huiles: 'Huiles' }[key] || lab0) : lab0; return `<span class="sbd3-hc${key === vif ? ' sbd3-vif' : ''}" style="--w:${W[key]}px"><b>${lab}</b><small class="sbd-num">${Math.round(p[key] * 100)} %</small>${key === 'arome' ? `<span class="sbd3-hp">${FAM.map((f) => pic(f, 12)).join('')}</span>` : ''}</span>`; };
  const n = c.nugget;
  const ligne = (r, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-choix="${r.nom}" class="sbd3-r" style="${grid}"><span class="sbd3-nm">${nomHop(r)}<small class="sbd-num">${r.score}${r.fiab === 'partielle' ? '?' : ''} ${badgeStock(r)} ${usage(r)}</small></span>
<span class="sbd3-c${vif === 'amertume' ? ' sbd3-vif' : ''}">${amer(r, c, W.amertume)}</span><span class="sbd3-c${vif === 'huiles' ? ' sbd3-vif' : ''}">${huiles(r, W.huiles)}</span><span class="sbd3-c${vif === 'arome' ? ' sbd3-vif' : ''}">${arome(r, c, W.arome)}</span></button>`;
  const choix = (r, i) => `<div class="sbd3-sel" data-pour="${r.nom}"${i === 0 ? '' : ' hidden'}><span>${nomHop(n)} 46 g → ${nomHop(r)} <b class="sbd-num">${g0(r.dose.g)} g</b>${r.dose.min !== r.dose.max ? ` <span class="sbd-pl sbd-num">${g0(r.dose.min)}–${g0(r.dose.max)}</span>` : ''}</span><span class="sbd3-why">${r.cher ? `<b class="sbd3-acc">${r.cher}</b>` : r.fiab === 'partielle' ? 'huiles inconnues : note ouverte' : r.stock.etat === 'en stock' && r.stock.suffisant === false ? `stock ${g0(r.stock.libre)} g, il en manque ${g0(r.dose.g - r.stock.libre)} g` : 'α, β, huiles et arômes connus'}</span><a href="#" class="sbd3-go">Remplacer</a></div>`;
  return `<header class="sbd3-t">${croix()}<h1>Lequel à la place de Nugget ?</h1>${aide(ID + '-leg', [
    'Chaque colonne est aussi large que son poids dans la note au moment de l’ajout. La plus large se lit en détail, les autres en résumé.',
    'α : trait gris, la plage de Nugget ; plein, celle du remplaçant. Barres d’arôme : ce qui reste dans ta stout (~ simulé), face à la zone du style. Hachuré : inconnu.', 'Icônes : ' + LEG_FAM])}</header>
<div class="sbd3-ctx"><p class="sbd-ctxp" data-role="contexte"><span data-contexte="moment">${c.court}</span><span data-contexte="dose">IBU égal</span><span data-contexte="base">Stout 16D</span></p>${lentille()}</div>
<p class="sbd3-rep">${c.contexte === 'amertume' ? `<b>À 60′, on remplace une amertume.</b> L'arôme part avec la vapeur : sa colonne se réduit.` : `<b>${c.court[0].toUpperCase() + c.court.slice(1)}, on remplace un arôme.</b> L'amertume ne pèse plus que ${Math.round(p.amertume * 100)} %.`}</p>
<div class="sbd3-tab"><div class="sbd3-h" style="${grid}"><span class="sbd3-orig">${nomHop(n)}<small class="sbd-num">α 13</small></span>${col('amertume', 'Amertume')}${col('huiles', 'Huiles')}${col('arome', c.contexte === 'amertume' ? 'Arôme étr.' : 'Arôme')}</div>
<div data-libre="houblon" role="radiogroup" aria-label="Remplaçant" class="sbd3-rs">${rows.map(ligne).join('')}</div></div>
<div class="sbd3-nug" style="${grid}"><span>${nomHop({ ...n, couleur: null, nom: 'Nugget' }, 'sbd3-ng')} <small>dans ta stout</small></span><span></span><span></span><span class="sbd3-cr">${FAM.map((f) => barre(f, n.prof && n.prof[f], 'sbd3-mb')).join('')}</span></div>
${rows.map(choix).join('')}`;
}
export function construire() {
  const b = cas('b60'), w = cas('wp');
  const noms = [...new Set([NUGGET.nom, ...[b, w].flatMap((c) => [...c.top.slice(0, 5), ...c.stock].map((r) => r.nom))])];
  return page({ id: ID, titre: 'sbd3 · colonnes au poids du moment', vue: vue(b), autres: { wp: vue(w) }, fiches: noms, css: CSS });
}
const CSS = `
.sbd3 { max-width:390px; margin:0 auto; padding:6px 8px 18px; display:flex; flex-direction:column; gap:8px; }
.sbd3-t { display:flex; align-items:center; gap:8px; }
.sbd3-t h1 { font:600 17px/1.2 var(--sans); flex:1; }
.sbd3-ctx { display:flex; gap:4px; align-items:center; }
.sbd3-ctx span[data-contexte] { height:22px; padding:0 9px; border-radius:11px; background:var(--surf2); font-size:13px; display:inline-flex; align-items:center; }
.sbd3-ctx .sbd-seg { margin-left:auto; }
.sbd3-rep { font-size:14px; line-height:1.3; color:var(--gris); }
.sbd3-rep b { color:var(--encre); font-size:16px; display:block; }
.sbd3-tab { display:flex; flex-direction:column; }
.sbd3-h, .sbd3-r, .sbd3-nug { display:grid; column-gap:4px; align-items:center; }
.sbd3-h { padding:0 4px 4px; border-bottom:2px solid var(--encre); }
.sbd3-orig { display:flex; flex-direction:column; font-size:13px; }
.sbd3-orig small { color:var(--gris); font-size:12px; }
.sbd3-hc { display:flex; flex-direction:column; font-size:13px; color:var(--gris); padding:4px 6px; border-radius:4px 4px 0 0; }
.sbd3-hc b { font-weight:600; }
.sbd3-hp { display:inline-flex; gap:2px; margin-top:2px; }
.sbd3-hc.sbd3-vif { background:var(--encre); color:#fff; }
.sbd3-hc.sbd3-vif small { color:#d6d6de; }
.sbd3-r { padding:6px 4px; border-bottom:1px solid var(--trait); text-align:left; min-height:46px; }
.sbd3-r[aria-checked="true"] { background:var(--surf); }
.sbd3-nm { display:flex; flex-direction:column; gap:1px; font-size:14px; min-width:0; }
.sbd3-nm .sbd-hop { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.sbd3-nm small { font-size:12px; color:var(--gris); display:inline-flex; gap:4px; align-items:center; white-space:nowrap; }
.sbd3-nm .sbd-us { font-size:11px; line-height:14px; padding:0 4px; }
.sbd3-c { padding:0 6px; opacity:.55; min-width:0; }
.sbd3-c.sbd3-vif { opacity:1; }
.sbd3-cn { font-size:14px; }
.sbd3-ca { display:flex; flex-wrap:wrap; gap:3px 8px; align-items:center; white-space:nowrap; }
.sbd3-al { flex-basis:100%; position:relative; display:block; height:10px; background:#f1f1f4; border-radius:2px; }
.sbd3-al i { position:absolute; top:2px; bottom:2px; border-radius:2px; }
.sbd3-o { top:0 !important; bottom:0 !important; border:1.5px solid #4a4a55; }
.sbd3-av, .sbd3-dv { font-size:13px; }
.sbd3-ca .sbd-us { justify-self:end; }
.sbd3-ch { display:flex; align-items:center; gap:4px; font-size:13px; }
.sbd3-hb { flex:1; height:8px; border-radius:2px; background:#e6e6ec; overflow:hidden; display:block; }
.sbd3-hb b { display:block; height:100%; background:#7d7d89; }
.sbd3-hinc { flex:1; height:8px; border-radius:2px; display:block; background:repeating-linear-gradient(45deg,#f1f1f4 0 3px,#c6c6cf 3px 4.5px); font-size:0; }
.sbd3-cr { display:flex; flex-direction:column; gap:3px; }
.sbd3-cr-l { display:grid; grid-template-columns:1fr auto; gap:2px 6px; }
.sbd3-cr-l .sbd3-pc { grid-column:2; grid-row:1 / 4; align-self:center; font-size:13px; }
.sbd3-rf { display:flex; align-items:center; gap:3px; grid-column:1; }
.sbd3-rf .sbd-bar { flex:1; }
.sbd3-mb { height:5px; }
.sbd3-nug { padding:6px 4px; font-size:13px; color:var(--gris); }
.sbd3-nug small { font-size:12px; }
.sbd3-sel { display:flex; flex-wrap:wrap; align-items:center; gap:6px; padding:8px; border-radius:8px; background:var(--surf); font-size:14px; }
.sbd3-why { font-size:13px; color:var(--gris); flex-basis:100%; }
.sbd3-acc { color:var(--acc); }
.sbd3-go { margin-left:auto; height:34px; padding:0 16px; border-radius:17px; background:var(--encre); color:#fff; font-weight:600; display:inline-flex; align-items:center; }
`;
