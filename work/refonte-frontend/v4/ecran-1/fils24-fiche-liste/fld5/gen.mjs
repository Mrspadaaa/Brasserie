// fld5 — tiède (forme de la série : la carte). Le radar devient la carte : chaque famille citée porte ses mots
// en légende, au bout de son axe ; les mots que le radar ne sait pas dessiner ont leur propre territoire, « hors
// carte », sous la roue, au même corps. Une seule figure : on lit la forme et ses mots ensemble.
import { ecrire, doc, titre, alpha, radar, demande, lentille, T, esc, COURT, ROUE, STYLE } from '../fld1/socle.mjs';

const ID = 'fld5';
const W = 390, H = 300, TAILLE = 300, MARGE = 0.7;
const r = Math.min(W / 2 - 84, H / 2 - 22) * MARGE, c = [W / 2, H / 2];
const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / 12;
function lignes(ws, max = 17) {
  const out = []; let cur = '';
  for (const w of ws) { const t = w.fr; if (cur && (cur + ', ' + t).length > max) { out.push(cur + ','); cur = t; } else cur = cur ? cur + ', ' + t : t; }
  if (cur) out.push(cur);
  return out;
}
function etiquettes(h) {
  let s = '';
  ROUE.forEach((f, i) => {
    const d = h.familles.find((x) => x.f === f);
    const co = Math.cos(ang(i)), si = Math.sin(ang(i));
    const x = c[0] + (r + 14) * co, y = c[1] + (r + 14) * si;
    const anc = co > 0.3 ? 'start' : co < -0.3 ? 'end' : 'middle';
    if (!d) { s += `<text x="${x.toFixed(1)}" y="${(y + 4 + (si > 0.9 ? 10 : 0)).toFixed(1)}" text-anchor="${anc}" class="fd-rl fd-rl-i">${COURT[f]}?</text>`; return; }
    const ws = d.mots.filter((w) => !w.nomFam && !w.cat);
    const L = ws.length ? lignes(ws) : [d.mots.every((w) => w.cat) ? 'catégorie' : 'nom seul'];
    const lh = 15, total = (L.length + 1) * lh;
    let y0 = si < -0.9 ? y - total + 10 : si > 0.9 ? y + 16 : y - total / 2 + 10;
    const zone = '';
    const pv = (px, py) => `<svg x="${px.toFixed(1)}" y="${py.toFixed(1)}" width="14" height="14" viewBox="0 0 24 24" data-famille="${f}" aria-label="${COURT[f]}"><use href="#p-${f}"/></svg>`;
    s += anc === 'start' ? pv(x, y0 - 11) : anc === 'end' ? pv(x - 14, y0 - 11) : si < 0 ? pv(x - 7, y0 - 27) : pv(x - 7, y0 + L.length * 15 + 4);
    if (d.dans) { const [zx, zy] = anc === 'start' ? [x + 15, y0 - 11] : anc === 'end' ? [x + 1, y0 - 11] : si < 0 ? [x + 8, y0 - 27] : [x + 8, y0 + L.length * 15 + 4]; s += `<circle cx="${zx.toFixed(1)}" cy="${zy.toFixed(1)}" r="3.5" style="fill:var(--zone)" data-style-seul/>`; }
    const xt = anc === 'start' ? x + 17 : anc === 'end' ? x - 17 : x;
    s += `<text x="${xt.toFixed(1)}" y="${y0.toFixed(1)}" text-anchor="${anc}" class="fld5-et"><tspan class="fld5-fn" fill="${T(f)}">${d.nom} <tspan class="fld5-nn">${d.n}/${d.N}</tspan></tspan>${zone}`;
    L.forEach((l, k) => { s += `<tspan x="${(anc === 'start' ? x + 17 : anc === 'end' ? x - 17 : x).toFixed(1)}" dy="${lh}" class="fld5-w${ws.length ? '' : ' fld5-wi'}" fill="${ws.length ? T(f) : '#5b5b66'}">${esc(l)}</tspan>`; });
    s += '</text>';
  });
  return s;
}
function rendu(h) {
  const hors = h.horsFam.filter((w) => !w.cat);
  const legende = ['Au bout de chaque axe : ses mots, dans la couleur de la famille.', '« Hors carte » : les mots que le radar ne sait pas dessiner (hors des 12 familles), avec leurs fiches.', 'Point bleu près du picto : famille attendue au 16D.', 'Traduit : ' + (h.mots.flatMap((w) => w.en.map((e) => '« ' + e + ' » → ' + w.fr)).join(', ') || 'aucun mot')];
  const corps = `${titre(h)}${alpha(h)}
<div class="fld5-carte"><div class="fld5-row"><h2 class="fld5-q">Où tombent ses mots ?</h2>${lentille('leg-' + ID, legende, 'fld5-lent')}</div>
${radar(h, { taille: TAILLE, haut: H, etiquettes: false, marge: MARGE, extra: etiquettes(h), cls: 'fld5-svg' })}</div>
${demande(h)}
<section class="fld5-hc" aria-label="Hors carte" data-houblon="${esc(h.nom)}">
<div class="fld5-hc-t"><span class="fld5-front" data-role="autres" data-part="${h.part.toFixed(2)}" aria-label="autres : hors des 12 familles"></span><h2>Hors carte</h2><span class="fld5-hc-n">${hors.length ? `${hors.length} mot${hors.length > 1 ? 's' : ''} que le radar ne dessine pas · ${Math.round(h.part * 100)} % de ses mots` : 'aucun : tout tient sur la carte'}</span></div>
${hors.length ? `<div class="fld5-hc-m">${hors.map((w) => `<span class="fld5-h${w.gen ? ' fld5-gen' : ''}" style="font-size:${w.n > 1 ? 24 : 17}px">${esc(w.fr)}<small class="num">${w.n}/${w.N}</small></span>`).join('')}</div>` : ''}
<p class="fld5-z" data-style-seul><span class="fd-zone" data-role="zone">16D</span>${STYLE.attendues.map((f) => COURT[f].toLowerCase()).join(', ')} attendus ; le style ne dit rien des mots hors carte (?)</p>
</section>`;
  return doc({ id: ID, h, titre: 'fld5 · carte', corps, css: CSS });
}
const CSS = `
.fld5-carte { position:relative; margin-top:2px; }
.fld5-row { display:flex; align-items:center; gap:6px; }
.fld5-q { font-size:15px; font-weight:600; }
.fld5-lent { margin-left:auto; } .fld5-lent .fd-leg { left:auto; right:0; }
.fld5-et { font:400 12px var(--sans); paint-order:stroke; stroke:#fff; stroke-width:3px; stroke-linejoin:round; }
.fld5-fn { font-weight:700; font-size:13px; } .fld5-nn { font-weight:600; fill:#16161a; font-size:12px; }
.fld5-w { font-size:13px; font-weight:600; } .fld5-wi { font-weight:400; font-style:italic; }
.fld5-z16 { fill:var(--zone); font-size:12px; font-weight:700; }
body.abs .fld5-z16 { display:none; }
.fld5-hc { background:#3a3d44; color:#fff; border-radius:8px; padding:8px 10px 10px; display:flex; flex-direction:column; gap:6px; }
.fld5-hc-t { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.fld5-hc-t h2 { font-size:15px; font-weight:700; }
.fld5-hc-n { font-size:12px; color:#d2d4da; }
.fld5-front { width:14px; height:14px; border-radius:2px; background:#8d8d96; outline:1px solid #d2d4da; display:inline-block; }
.fld5-hc-m { display:flex; flex-wrap:wrap; gap:4px 14px; align-items:baseline; }
.fld5-h { font-weight:800; line-height:1.1; }
.fld5-h small { font-size:11px; font-weight:600; color:#d2d4da; margin-left:2px; }
.fld5-gen { font-weight:400; color:#c9cbd1; }
.fld5-z { display:flex; align-items:center; gap:6px; font-size:12px; color:#d2d4da; } .fld5-z .fd-zone { background:#fff; color:var(--zone); }
`;
ecrire(ID, 'Citra cryo', rendu);
