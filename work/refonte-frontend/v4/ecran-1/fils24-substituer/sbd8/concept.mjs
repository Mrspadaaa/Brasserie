// sbd8 — chaude : la carte qui penche. Chaque remplaçant est un point : à droite, il amérise comme Nugget ; en haut,
// son arôme lui ressemble (à 60′ : n'ajoute rien d'étranger). La ligne des 80 (note « très proche », huiles à part)
// penche selon le moment : presque verticale à 60′ (seule l'amertume compte), presque couchée en whirlpool.
import { cas, page, pic, usage, badgeStock, nomHop, croix, lentille, aide, barre, fr, fr1, g0, COURT, LEG_FAM, NUGGET, troisCas, gagnePerd } from '../sbd1/serie/socle.mjs';

const ID = 'sbd8';
const W = 350, H = 290, X0 = 20, PADL = 26, PADB = 22;
const px = (x) => PADL + (W - PADL - 6) * (x - X0) / (100 - X0), py = (y) => (H - PADB) - (H - PADB - 8) * y / 100;
function carte(c, rows, sel) {
  const p = c.poids, wA = p.arome, wB = p.amertume, S = 80 * (wA + wB);
  const yAt = (x) => (S - wB * x) / wA, xAt = (y) => (S - wA * y) / wB;
  // la ligne des 80, coupée au cadre
  const pts = []; for (const x of [X0, 100]) { const y = yAt(x); if (y >= 0 && y <= 100) pts.push([x, y]); }
  for (const y of [0, 100]) { const x = xAt(y); if (x >= X0 && x <= 100) pts.push([x, y]); }
  const seg = pts.slice(0, 2);
  const dedans = ([x, y]) => wA * y + wB * x >= S - 1e-9;
  const coins = [[X0, 0], [100, 0], [100, 100], [X0, 100]].filter(dedans), poly = [...coins, ...seg];
  const cx = poly.reduce((t, q) => t + q[0], 0) / poly.length, cy = poly.reduce((t, q) => t + q[1], 0) / poly.length;
  poly.sort((u, v) => Math.atan2(u[1] - cy, u[0] - cx) - Math.atan2(v[1] - cy, v[0] - cx));
  const zone = poly.length > 2 ? `<polygon points="${poly.map(([x, y]) => px(x).toFixed(1) + ',' + py(y).toFixed(1)).join(' ')}" fill="#cfe8ea"/>` : '';
  const grille = [40, 60, 80, 100].map((x) => `<line x1="${px(x)}" y1="${py(0)}" x2="${px(x)}" y2="${py(100)}" stroke="#ececf1"/><text x="${px(x)}" y="${H - 6}" class="sbd8-ax" text-anchor="middle">${x}</text>`).join('')
    + [0, 50, 100].map((y) => `<line x1="${px(X0)}" y1="${py(y)}" x2="${px(100)}" y2="${py(y)}" stroke="#ececf1"/><text x="${PADL - 4}" y="${py(y) + 4}" class="sbd8-ax" text-anchor="end">${y}</text>`).join('');
  const ligne = seg.length === 2 ? `<line x1="${px(seg[0][0])}" y1="${py(seg[0][1])}" x2="${px(seg[1][0])}" y2="${py(seg[1][1])}" stroke="#0e7c86" stroke-width="2" stroke-dasharray="5 3"/>` : '';
  const svg = `<svg class="sbd8-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Carte des remplaçants ${c.titre}">${zone}${grille}${ligne}</svg>`;
  // les points (HTML, pour l'appui long et la fiche) : rond plein si les huiles sont connues, cerclé pointillé sinon
  const vus = [];
  const dots = rows.map((r) => {
    const x = px(Math.max(X0, r.comp.amertume)), y = py(r.comp.arome ?? 0);
    let k = 0; while (vus.some(([a, b]) => Math.abs(a - x) < 9 && Math.abs(b - (y + k * 11)) < 9)) k++;
    vus.push([x, y + k * 11]);
    const nomV = r === sel || (r.stock.etat === 'en stock' && r.stock.suffisant);
    return `<span class="sbd8-pt${r.comp.huiles == null ? ' sbd8-inc' : ''}" data-pour-pt="${r.nom}" style="left:${(x - 6).toFixed(1)}px;top:${(y + k * 11 - 6).toFixed(1)}px;--c:${r.couleur || '#8c8c96'}"></span>${nomV ? `<span class="sbd8-et" style="left:${(x - 8).toFixed(1)}px;top:${(y + k * 11 - 7).toFixed(1)}px">${nomHop(r)}</span>` : ''}`;
  }).join('');
  return `<div class="sbd8-plot">${svg}${dots}<span class="sbd8-lx">amérise comme Nugget →</span><span class="sbd8-ly">${c.contexte === 'amertume' ? 'arôme sans étranger ↑' : 'arôme comme Nugget ↑'}</span><span class="sbd8-l80" style="left:${(px(seg[0] ? seg[0][0] : 80) + 6).toFixed(0)}px">80</span></div>`;
}
function vue(c) {
  const rows = [...c.top.slice(0, 8), ...c.stock.filter((s) => s.stock.etat !== 'épuisé')].filter((r, i, a) => a.indexOf(r) === i);
  const choix = [...c.top.filter((s) => s.fiab === 'bonne' && !s.cher).slice(0, 3), ...c.stock.filter((s) => s.stock.etat === 'en stock' && s.stock.suffisant).slice(0, 2)].filter((r, i, a) => a.indexOf(r) === i);
  const n = c.nugget, fams = ['floral', 'herbal', 'earthy', 'resin'];
  const det = (r, i) => `<div class="sbd8-det" data-pour="${r.nom}"${i === 0 ? '' : ' hidden'}><p class="sbd8-l1">${nomHop(r)}${usage(r)}<span class="sbd-num">α ${r.alpha.lot ? fr1(r.alpha.v) : fr1(r.alpha.min) + '–' + fr1(r.alpha.max)}</span><span class="sbd-num">${g0(r.dose.g)} g</span>${badgeStock(r, true)}<b class="sbd8-sc sbd-num">${r.score}</b></p>
<p class="sbd8-cp sbd-num">amertume ${r.comp.amertume ?? '?'} · huiles ${r.comp.huiles ?? '?'} · arôme ${r.comp.arome ?? '?'}${r.cher ? ` · <b class="sbd8-acc">${r.cher}</b>` : ''}</p>
${gagnePerd(r, c)}<div class="sbd8-bars"><span class="sbd8-st">ta stout ~</span>${fams.map((f) => `<span class="sbd8-bf">${pic(f, 13)}${barre(f, r.prof && r.prof[f])}</span>`).join('')}</div></div>`;
  return `<header class="sbd8-t">${croix()}<h1>Lequel à la place de Nugget ?</h1>${aide(ID + '-leg', [
    'Chaque point est un remplaçant : à droite, son amertume ressemble à celle de Nugget (α, β, rôle) ; en haut, son arôme. Rond cerclé de pointillés : huiles inconnues.',
    'La ligne des 80 sépare les très proches (zone bleutée), huiles mises à part ; elle penche selon les poids du moment.', 'Icônes : ' + LEG_FAM])}</header>
<div class="sbd8-ctx"><p class="sbd-ctxp" data-role="contexte"><span data-contexte="moment">${c.court}</span><span data-contexte="dose">IBU égal</span><span data-contexte="base">Stout 16D</span></p>${lentille()}</div>
${troisCas(c)}
<p class="sbd8-rep">${c.contexte === 'amertume' ? '<b>À 60′, la ligne se dresse :</b> tout ce qui amérise comme Nugget passe.' : `<b>${c.court[0].toUpperCase() + c.court.slice(1)}, la ligne se couche :</b> il faut l'arôme.`}</p>
${carte(c, rows, choix[0])}
<div class="sbd8-ch" data-libre="houblon" role="radiogroup" aria-label="Remplaçant">${choix.map((r, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-choix="${r.nom}">${nomHop(r)}<span class="sbd-num">${r.score}</span></button>`).join('')}</div>
${choix.map(det).join('')}
<ul class="sbd8-ls" aria-label="les points de la carte">${rows.map((r) => `<li><span class="sbd-num sbd8-lsc">${r.score}</span>${nomHop(r)}${badgeStock(r)}<small class="sbd-num">${r.comp.amertume ?? '?'} · ${r.comp.arome ?? '?'}</small></li>`).join('')}</ul>
<p class="sbd8-pd">${[['amertume', '#2c2c34'], ['huiles', '#9a9aa6'], ['arome', '#0e7c86']].map(([k, col]) => `<span style="flex:${c.poids[k]}"><i style="background:${col}"></i>${k === 'arome' ? 'arôme' : k} ${Math.round(c.poids[k] * 100)} %</span>`).join('')}</p>`;
}
export function construire() {
  const b = cas('b60'), w = cas('wp');
  const noms = [...new Set([NUGGET.nom, ...[b, w].flatMap((c) => [...c.top.slice(0, 8), ...c.stock].map((r) => r.nom))])];
  return page({ id: ID, titre: 'sbd8 · la carte qui penche', vue: vue(b), autres: { wp: vue(w) }, fiches: noms, css: CSS,
    js: `SBD.surChoix(function (n) { SBD.$$('[data-pour-pt]').forEach(function (p) { p.classList.toggle('sbd8-on', p.getAttribute('data-pour-pt') === n); }); });
var b = SBD.$('[data-libre="houblon"] [aria-checked="true"]'); if (b) SBD.choisir(b.getAttribute('data-choix'));` });
}
const CSS = `
.sbd8 { max-width:390px; margin:0 auto; padding:6px 10px 18px; display:flex; flex-direction:column; gap:5px; }
.sbd8-t { display:flex; align-items:center; gap:8px; }
.sbd8-t h1 { font:600 17px/1.2 var(--sans); flex:1; }
.sbd8-ctx { display:flex; gap:4px; align-items:center; }
.sbd8-ctx span[data-contexte] { height:22px; padding:0 9px; border-radius:11px; background:var(--surf2); font-size:13px; display:inline-flex; align-items:center; }
.sbd8-ctx .sbd-seg { margin-left:auto; }
.sbd8-rep { font-size:14px; color:var(--gris); }
.sbd8-rep b { color:var(--encre); font-size:16px; }
.sbd8-plot { position:relative; width:${W}px; height:${H + 16}px; margin:0 auto; }
.sbd8-svg { position:absolute; left:0; top:0; }
.sbd8-ax { font:12px var(--sans); fill:#5b5b66; }
.sbd8-pt { position:absolute; width:12px; height:12px; border-radius:50%; background:var(--c); border:2px solid #fff; }
.sbd8-inc { background:#fff; border:2px dashed var(--c); }
.sbd8-on { outline:2.5px solid var(--encre); outline-offset:2px; }
.sbd8-et { position:absolute; transform:translateX(-100%); font-size:12px; white-space:nowrap; background:rgba(255,255,255,.85); padding:0 3px; border-radius:2px; }
.sbd8-et .sbd-pt { display:none; }
.sbd8-lx { position:absolute; right:4px; bottom:0; font-size:12px; color:var(--gris); }
.sbd8-ly { position:absolute; left:30px; top:-2px; font-size:12px; color:var(--gris); background:#fff; padding:0 2px; }
.sbd8-l80 { position:absolute; top:12px; font-size:12px; font-weight:700; color:#0b6870; }
.sbd8-ch { display:flex; flex-wrap:wrap; gap:5px; }
.sbd8-ch button { display:inline-flex; align-items:center; gap:5px; height:30px; padding:0 10px; border-radius:15px; background:var(--surf); font-size:13px; }
.sbd8-ch button[aria-checked="true"] { background:var(--encre); color:#fff; }
.sbd8-det { display:flex; flex-direction:column; gap:4px; padding:7px 8px; border-radius:8px; background:var(--surf); }
.sbd8-l1 { display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:14px; }
.sbd8-sc { margin-left:auto; font-size:16px; }
.sbd8-cp { font-size:12px; color:var(--gris); }
.sbd8-acc { color:var(--acc); }
.sbd8-bars { display:flex; align-items:center; gap:6px; }
.sbd8-st { font-size:12px; color:var(--gris); white-space:nowrap; }
.sbd8-bf { flex:1; display:flex; align-items:center; gap:3px; }
.sbd8-bf .sbd-bar { flex:1; }
.sbd8-ls { list-style:none; display:grid; grid-template-columns:1fr 1fr; gap:2px 10px; font-size:13px; }
.sbd8-ls li { display:flex; align-items:center; gap:4px; border-bottom:1px solid var(--trait); padding:2px 0; min-width:0; white-space:nowrap; }
.sbd8-ls small { margin-left:auto; font-size:12px; color:var(--gris); }
.sbd8-lsc { width:22px; font-weight:700; }
.sbd8-pd { display:flex; gap:3px; font-size:12px; color:var(--gris); }
.sbd8-pd span { display:flex; flex-direction:column; gap:2px; min-width:78px; white-space:nowrap; }
.sbd8-pd i { display:block; height:8px; border-radius:2px; }
`;
