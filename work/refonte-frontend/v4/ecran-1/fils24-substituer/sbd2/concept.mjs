// sbd2 — froide : le face-à-face de u4 (« Face à face, même IBU »), affiné en écart de recette. Ta ligne de Nugget
// en tête, un remplaçant à la fois ; les trois composantes de u4 viennent dans l'ordre de leur poids au moment :
// à 60′, l'amertume d'abord (60 %), l'arôme en dernier ; en whirlpool, l'arôme d'abord.
import { cas, page, pic, usage, badgeStock, alphaTxt, doseTxt, nomHop, croix, lentille, aide, barre, fr, fr1, g0, ico, COURT, LEG_FAM, NUGGET, troisCas, gagnePerd } from '../sbd1/serie/socle.mjs';

const ID = 'sbd2';
const HUILES = [['myrcene', 'myrcène'], ['humulene', 'humulène'], ['caryophyllene', 'caryophyllène'], ['linalool', 'linalol']];
function plage(min, max, echelle, coul, orig) {
  if (min == null || !isFinite(min)) return `<span class="sbd2-tr sbd2-inc" aria-label="inconnu">?</span>`;
  const l = (x) => (100 * x / echelle).toFixed(1);
  return `<span class="sbd2-tr">${orig ? `<i class="sbd2-o" style="left:${l(orig[0])}%;width:${(l(orig[1]) - l(orig[0])).toFixed(1)}%"></i>` : ''}<i class="sbd2-p" style="left:${l(min)}%;width:${Math.max(1.5, l(max) - l(min)).toFixed(1)}%;background:${coul}"></i></span>`;
}
const ent = (k, p, comp, titre) => `<header class="sbd2-sh"><span class="sbd2-w"><i style="width:${p * 100}%"></i></span><b>${titre}</b><span class="sbd2-pc">${Math.round(p * 100)} % de la note</span><span class="sbd2-cs sbd-num">${comp == null ? '?' : comp}</span></header>`;
function amer(r, c) {
  const n = c.nugget, p = c.poids.amertume;
  return `<section class="sbd2-sec" style="order:${-Math.round(p * 100)}">${ent('amertume', p, r.comp.amertume, 'Amertume')}
<div class="sbd2-g"><span>α</span>${plage(r.alpha.min, r.alpha.max, 20, r.couleur || '#4a4a55', [n.alpha.min, n.alpha.max])}<span class="sbd-num sbd2-v">${r.alpha.lot ? fr1(r.alpha.v) + ' %' : fr1(r.alpha.min) + '–' + fr1(r.alpha.max)}</span></div>
<div class="sbd2-g"><span>β</span>${plage(r.beta && r.beta.min, r.beta && r.beta.max, 20, r.couleur || '#4a4a55', n.beta && [n.beta.min, n.beta.max])}<span class="sbd-num sbd2-v">${r.beta ? fr1(r.beta.min) + '–' + fr1(r.beta.max) : '?'}</span></div>
<p class="sbd2-ech"><span>0</span><span>10 %</span><span>20 %</span></p>
<div class="sbd2-dz"><span>${usage(n)} → ${usage(r)}</span><span class="sbd-num">46 g → <b>${doseTxt(r)}</b></span><span class="sbd-num sbd2-ibu">${c.ref.ibu ? Math.round(c.ref.ibu) + ' IBU =' : 'à froid, masse égale'}</span></div>
${r.cher ? `<p class="sbd2-al">${r.cher}</p>` : ''}</section>`;
}
function huiles(r, c) {
  const n = c.nugget, p = c.poids.huiles;
  return `<section class="sbd2-sec" style="order:${-Math.round(p * 100)}">${ent('huiles', p, r.comp.huiles, 'Huiles')}
${HUILES.map(([k, nom]) => { const a = r.huiles[k], o = n.huiles[k], e = k === 'linalool' ? 2 : 70;
    return `<div class="sbd2-g"><span>${nom}</span>${plage(a && a.min, a && a.max, e, r.couleur || '#4a4a55', o && [o.min, o.max])}<span class="sbd-num sbd2-v">${a ? fr1(a.min) + '–' + fr1(a.max) : '?'}</span></div>`; }).join('')}
<p class="sbd2-src">% de l'huile · Beer Maverick 2023, linalol Hopsteiner 2025</p></section>`;
}
function arome(r, c) {
  const n = c.nugget, p = c.poids.arome, fams = ['floral', 'herbal', 'earthy', 'resin', 'citrus', 'tropical'];
  const tot = (h) => (h.prof ? fams.reduce((t, f) => t + (h.prof[f].inc ? 0 : h.prof[f].c), 0) : 0);
  return `<section class="sbd2-sec" style="order:${-Math.round(p * 100)}">${ent('arome', p, r.comp.arome, c.contexte === 'amertume' ? 'Arôme étranger' : 'Arôme')}
<div class="sbd2-ah"><span>dans ta stout ${c.titre} <small>~ simulé</small></span>${lentille()}</div>
<div class="sbd2-am">${fams.map((f) => `<div class="sbd2-af"><span class="sbd2-an">${pic(f, 14)}${COURT[f]}</span>${barre(f, n.prof && n.prof[f], 'sbd2-bn')}${barre(f, r.prof && r.prof[f])}</div>`).join('')}</div>
<p class="sbd2-tot">${nomHop(n)} ~${fr(tot(n))} · ${nomHop(r)} ~${fr(tot(r))} <small>sur 6 familles, en points</small></p></section>`;
}
function detail(r, c, on) {
  return `<div class="sbd2-det" data-pour="${r.nom}"${on ? '' : ' hidden'}>${gagnePerd(r, c)}${amer(r, c)}${huiles(r, c)}${arome(r, c)}
<div class="sbd2-cta" style="order:10"><a href="#" class="sbd2-go">Remplacer · ${g0(r.dose.g)} g de ${r.nom}</a></div></div>`;
}
const bas = (r, p) => { const ks = ['arome', 'huiles', 'amertume']; return Math.round(ks.reduce((t, k) => t + p[k] * (r.comp[k] ?? 0), 0)); };
function vue(c) {
  const top = c.top.slice(0, 5).sort((x, y) => bas(y, c.poids) - bas(x, c.poids)).slice(0, 4);
  const st = c.stock.filter((s) => s.stock.etat === 'en stock' && s.stock.suffisant && !top.includes(s)).slice(0, 2);
  const tous = [...top, ...st], n = c.nugget;
  return `<header class="sbd2-t">${croix()}<h1>Lequel à la place de Nugget ?</h1>${aide(ID + '-leg', [
    'Barres : trait gris, la plage de Nugget ; plein coloré, celle du remplaçant (fiches). Hachuré ou « ? » : inconnu, jamais zéro.',
    'Les trois parts de la note viennent dans l’ordre de leur poids au moment de l’ajout.', 'Icônes : ' + LEG_FAM])}</header>
<p class="sbd2-ctx" data-role="contexte"><span data-contexte="moment">${c.court}</span><span data-contexte="dose">IBU égal</span><span data-contexte="base">Stout 16D</span></p>
<div class="sbd2-ligne"><span class="sbd2-pin">${ico('epingle', 'ta ligne')}</span>${nomHop(n)}${usage(n)}${alphaTxt(n)}<span class="sbd-num">46 g · ${c.court}${c.ref.ibu ? ' · ' + Math.round(c.ref.ibu) + ' IBU' : ''}</span>${badgeStock({ stock: { etat: 'épuisé' } })}</div>
${troisCas(c)}
<div class="sbd2-ch" data-libre="houblon" role="radiogroup" aria-label="Remplaçant">${tous.map((r, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-choix="${r.nom}">${nomHop(r)}<span class="sbd-num">${r.score}${r.fiab === 'partielle' ? '?' : ''}</span>${badgeStock(r)}</button>`).join('')}</div>
${tous.map((r, i) => detail(r, c, i === 0)).join('')}`;
}
export function construire() {
  const b = cas('b60'), w = cas('wp');
  const noms = [...new Set([NUGGET.nom, ...[b, w].flatMap((c) => [...c.top.slice(0, 5), ...c.stock].map((r) => r.nom))])];
  return page({ id: ID, titre: 'sbd2 · face-à-face au poids du moment', vue: vue(b), autres: { wp: vue(w) }, fiches: noms, css: CSS });
}
const CSS = `
.sbd2 { max-width:390px; margin:0 auto; padding:6px 10px 18px; display:flex; flex-direction:column; gap:5px; }
.sbd2-t { display:flex; align-items:center; gap:8px; }
.sbd2-t h1 { font:600 17px/1.2 var(--sans); flex:1; }
.sbd2-ctx { display:flex; gap:4px; }
.sbd2-ctx span { height:22px; padding:0 9px; border-radius:11px; background:var(--surf2); font-size:13px; display:inline-flex; align-items:center; }
.sbd2-ligne { display:flex; align-items:center; gap:6px; flex-wrap:wrap; padding:7px 8px; border:1px solid #c9c9d2; border-radius:8px; font-size:14px; }
.sbd2-pin { color:var(--gris); }
.sbd2-ch { display:flex; flex-wrap:wrap; gap:5px; }
.sbd2-ch button { display:flex; align-items:center; gap:4px; padding:6px 6px; border-radius:8px; background:var(--surf); font-size:13px; min-width:0; }
.sbd2-ch button .sbd-hop { white-space:nowrap; }
.sbd2-ch button[aria-checked="true"] { background:var(--encre); color:#fff; }
.sbd2-ch button[aria-checked="true"] .sbd-st { color:#d6d6de; }
.sbd2-det { display:flex; flex-direction:column; gap:8px; }
.sbd2-sec { display:flex; flex-direction:column; gap:4px; padding:6px 0 2px; border-top:1px solid var(--trait); }
.sbd2-sh { display:flex; align-items:center; gap:6px; font-size:14px; }
.sbd2-w { width:44px; height:8px; border-radius:2px; background:#e6e6ec; overflow:hidden; display:inline-block; }
.sbd2-w i { display:block; height:100%; background:#0e7c86; }
.sbd2-pc { font-size:12px; color:var(--gris); }
.sbd2-cs { margin-left:auto; font-size:15px; font-weight:600; }
.sbd2-g { display:grid; grid-template-columns:86px 1fr 62px; align-items:center; gap:6px; font-size:13px; }
.sbd2-tr { position:relative; height:12px; background:#f1f1f4; border-radius:2px; display:block; }
.sbd2-tr i { position:absolute; top:2px; bottom:2px; border-radius:2px; }
.sbd2-o { top:0 !important; bottom:0 !important; border:1.5px solid #4a4a55; background:none; }
.sbd2-inc { background:repeating-linear-gradient(45deg,#f1f1f4 0 3px,#c6c6cf 3px 4.5px); font-size:11px; color:var(--gris); text-align:right; padding-right:3px; line-height:12px; }
.sbd2-v { text-align:right; font-size:13px; }
.sbd2-ech { display:flex; justify-content:space-between; margin:0 68px 0 92px; font-size:12px; color:var(--gris); }
.sbd2-dz { display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:14px; }
.sbd2-ibu { margin-left:auto; color:var(--gris); font-size:13px; }
.sbd2-al { color:var(--acc); font-size:13px; font-weight:600; }
.sbd2-src { font-size:12px; color:var(--gris); }
.sbd2-ah { display:flex; align-items:center; justify-content:space-between; font-size:13px; }
.sbd2-ah small { color:var(--gris); }
.sbd2-am { display:grid; grid-template-columns:1fr 1fr; gap:5px 12px; }
.sbd2-af { display:flex; flex-direction:column; gap:2px; font-size:12px; }
.sbd2-an { display:inline-flex; align-items:center; gap:3px; color:var(--gris); }
.sbd2-bn { opacity:.75; }
.sbd2-tot { font-size:13px; display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.sbd2-tot small { color:var(--gris); }
.sbd2-cta { display:flex; justify-content:flex-end; padding-top:4px; }
.sbd2-go { height:36px; padding:0 16px; border-radius:18px; background:var(--encre); color:#fff; font-weight:600; display:inline-flex; align-items:center; }
`;
