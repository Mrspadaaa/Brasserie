// fld6 — chaude (forme libre : l'éventail). Sous le radar, un éventail de ses mots : l'arc intérieur, ses familles
// (et « hors des 12 », en gris neutre) ; l'arc extérieur, un secteur par mot, écrit dedans, qui s'étire d'autant
// plus loin que de fiches le citent. Au centre, la part de ses mots que le radar ne dessine pas.
import { ecrire, doc, titre, alpha, radar, demande, lentille, pic, T, B, F, esc, COURT, ROUE } from '../fld1/socle.mjs';

const ID = 'fld6';
const W = 390, CX = 195, CY = 214, R0 = 50, R1 = 78, R2 = 84, RMAX = 190;
const rad = (d) => (d * Math.PI) / 180;
const pt = (r, a) => [CX + r * Math.cos(rad(a)), CY + r * Math.sin(rad(a))].map((v) => v.toFixed(1)).join(',');
const arc = (ri, ro, a0, a1) => `M${pt(ri, a0)}L${pt(ro, a0)}A${ro},${ro} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${pt(ro, a1)}L${pt(ri, a1)}A${ri},${ri} 0 ${a1 - a0 > 180 ? 1 : 0} 0 ${pt(ri, a0)}Z`;
function decoupe(t) { if (t.length <= 11 || !t.includes(' ')) return [t]; const i = t.lastIndexOf(' ', Math.ceil(t.length / 2) + 2); return [t.slice(0, i), t.slice(i + 1)]; }
function eventail(h) {
  const groupes = h.familles.map((f) => ({ f: f.f, nom: f.nom, dans: f.dans, ws: f.mots.filter((w) => !w.nomFam && !w.cat), fam: f }));
  if (h.horsFam.some((w) => !w.cat)) groupes.push({ f: null, nom: 'hors des 12', ws: h.horsFam.filter((w) => !w.cat) });
  const cellules = groupes.flatMap((g) => (g.ws.length ? g.ws.map((w) => ({ g, w })) : [{ g, w: null }]));
  const pas = 180 / cellules.length;
  const roDe = ({ g: gg, w }) => { const lg = Math.max(...(w ? decoupe(w.fr) : ["catégorie"]).map((l) => l.length)) * 6.9 + 10; return Math.max(w ? R2 + 34 + (RMAX - R2 - 34) * (w.n / w.N) : R2 + 40, R2 + lg); };
  const haut = Math.max(...cellules.map((x, k) => roDe(x) * Math.max(Math.abs(Math.sin(rad(180 + k * pas))), Math.abs(Math.sin(rad(180 + (k + 1) * pas)))))) + 16, y0 = CY - haut;
  let s = `<svg class="fld6-svg" viewBox="0 ${y0.toFixed(0)} ${W} ${(haut + 8).toFixed(0)}" width="100%" role="img" aria-label="Éventail des mots de ${esc(h.nom)}">`;
  let a = 180;
  // arcs des familles
  for (const g of groupes) {
    const n = Math.max(1, g.ws.length), a1 = a + n * pas;
    s += g.f ? `<path d="${arc(R0, R1, a + 0.6, a1 - 0.6)}" fill="${B(g.f)}" data-famille="${g.f}"/>` : `<path d="${arc(R0, R1, a + 0.6, a1 - 0.6)}" fill="#8d8d96" data-role="autres" data-part="${h.part.toFixed(2)}" aria-label="autres : hors des 12 familles"/>`;
    if (g.dans) s += `<path d="${arc(R0 - 7, R0 - 3, a + 0.6, a1 - 0.6)}" style="fill:var(--zone)" data-role="zone" data-style-seul/>`;
    const am = (a + a1) / 2, [x, y] = pt((R0 + R1) / 2, am).split(',').map(Number);
    if (g.f) s += `<svg x="${(x - 8).toFixed(1)}" y="${(y - 8).toFixed(1)}" width="16" height="16" viewBox="0 0 24 24" data-famille="${g.f}" aria-label="${COURT[g.f]}"><use href="#p-${g.f}"/></svg>`;
    a = a1;
  }
  // un secteur par mot, plus long s'il est cité par plus de fiches
  a = 180;
  for (const { g, w } of cellules) {
    const a1 = a + pas, lg = Math.max(...(w ? decoupe(w.fr) : ["catégorie"]).map((l) => l.length)) * 6.9 + 10, ro = Math.max(w ? R2 + 34 + (RMAX - R2 - 34) * (w.n / w.N) : R2 + 40, R2 + lg);
    const fondC = g.f ? F(g.f) : '#ececf1', bord = g.f ? B(g.f) : '#8d8d96';
    s += `<path d="${arc(R2, ro, a + 0.5, a1 - 0.5)}" fill="${fondC}" stroke="${bord}" stroke-width="1"/>`;
    const am = (a + a1) / 2, gauche = am < 270, rot = gauche ? am + 180 : am, rm = (R2 + ro) / 2 + 2;
    const lignes = w ? decoupe(w.fr) : [g.fam && g.fam.mots.every((m) => m.cat) ? 'catégorie' : 'nom seul'];
    const x = gauche ? CX - rm : CX + rm, fill = g.f ? T(g.f) : '#16161a';
    s += `<text transform="rotate(${rot.toFixed(1)} ${CX} ${CY})" x="${x.toFixed(1)}" y="${CY}" text-anchor="middle" class="fld6-t${w ? (g.f ? '' : ' fld6-th') : ' fld6-ti'}${w && w.gen ? ' fld6-tg' : ''}" fill="${w && w.gen ? '#5b5b66' : fill}">${lignes.map((l, k) => `<tspan x="${x.toFixed(1)}" dy="${k === 0 ? (lignes.length > 1 ? -2 : 4) : 13}">${esc(l)}</tspan>`).join('')}</text>`;
    if (w && w.N > 1) { const [nx, ny] = pt(ro + 7, am).split(',').map(Number); s += `<text x="${nx}" y="${ny + 4}" text-anchor="middle" class="fld6-n">${w.n}</text>`; }
    a = a1;
  }
  const nw = cellules.filter((x) => x.w).length, nh = cellules.filter((x) => x.w && !x.g.f).length, part = nw ? Math.round((100 * nh) / nw) : 0;
  s += `<text x="${CX}" y="${CY - 14}" text-anchor="middle" class="fld6-pc">${part} %</text><text x="${CX}" y="${CY + 2}" text-anchor="middle" class="fld6-pl">hors des 12</text>`;
  return s + '</svg>';
}
function rendu(h) {
  const legende = ['Arc intérieur : ses familles ; gris : hors des 12 familles du radar.', 'Arc extérieur : un secteur par mot, d\'autant plus long que de fiches le citent (chiffre au bout : ses fiches).', 'Trait bleu sous une famille : attendue au 16D.', 'Traduit : ' + (h.mots.flatMap((w) => w.en.map((e) => '« ' + e + ' » → ' + w.fr)).join(', ') || 'aucun mot')];
  const cats = h.mots.filter((w) => w.cat), seules = h.familles.filter((f) => !f.mots.some((w) => !w.nomFam && !w.cat));
  const corps = `${titre(h)}${alpha(h)}
${radar(h, { taille: 236 })}
${demande(h)}
<section class="fld6-ev" aria-label="L'éventail de ses mots" data-houblon="${esc(h.nom)}">
<div class="fld6-h"><h2>Que sent-il, mot par mot ?</h2>${lentille('leg-' + ID, legende, 'fld6-lent')}</div>
${eventail(h)}
<p class="fld6-pied"><span class="fd-zone" data-role="zone" data-style-seul>16D</span><span data-style-seul>${h.familles.some((f) => f.dans) ? h.familles.filter((f) => f.dans).map((f) => f.nom).join(', ') + ' attendu' + (h.familles.filter((f) => f.dans).length > 1 ? 's' : '') : 'aucune famille attendue'}</span>${cats.length ? `<span>catégories Hopsteiner : ${cats.map((w) => esc(w.fr)).join(', ')}</span>` : ''}${h.nonDecrites.length ? `<span>${h.nonDecrites.length} familles non décrites (?)</span>` : ''}</p>
</section>`;
  return doc({ id: ID, h, titre: 'fld6 · éventail', corps, css: CSS });
}
const CSS = `
.fld6-ev { display:flex; flex-direction:column; gap:2px; }
.fld6-h { display:flex; align-items:center; gap:6px; }
.fld6-h h2 { font-size:15px; font-weight:600; }
.fld6-lent { margin-left:auto; } .fld6-lent .fd-leg { left:auto; right:0; }
.fld6-svg { display:block; margin:0 -6px; width:calc(100% + 12px); }
.fld6-t { font:700 13px var(--sans); } .fld6-th { font-weight:800; font-size:14px; } .fld6-ti { font-weight:400; font-style:italic; fill:#5b5b66; } .fld6-tg { font-weight:400; }
.fld6-n { font:600 11px var(--mono); fill:#16161a; }
.fld6-pc { font:800 26px var(--sans); fill:#16161a; } .fld6-pl { font:400 12px var(--sans); fill:#5b5b66; }
.fld6-pied { display:flex; flex-wrap:wrap; gap:4px 10px; align-items:center; font-size:12px; color:var(--gris); }
body.abs .fld6-svg [data-role="zone"] { display:none; }
`;
ecrire(ID, 'Cascade', rendu);
