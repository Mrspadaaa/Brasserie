// fld8 — chaude (forme libre : l'iceberg). Le radar est la pointe qui dépasse de l'eau : ce que les 12 familles
// savent dessiner, avec ses mots à la surface. Sous la ligne d'eau, la masse que le radar ne voit pas : les mots hors
// des 12 familles, dans une coque dont la hauteur suit leur part. Nelson Sauvin est presque tout sous l'eau ;
// Motueka, presque tout dehors.
import { ecrire, doc, titre, alpha, radar, demande, lentille, pic, T, esc } from '../fld1/socle.mjs';

const ID = 'fld8';
function coque(h, ws) {
  const part = ws.length ? h.part : 0;
  const H = Math.round(44 + 256 * part), W = 390, L = 44, R = 346;
  // une coque irrégulière, plus large en haut, qui s'effile vers le fond
  const p = [[L, 0], [R, 0], [R + 8, H * 0.18], [R - 18, H * 0.38], [R - 4, H * 0.55], [R - 52, H * 0.78], [W / 2 + 40, H * 0.9], [W / 2 + 6, H], [W / 2 - 34, H * 0.93], [L + 52, H * 0.74], [L + 14, H * 0.5], [L - 6, H * 0.3], [L + 6, H * 0.12]];
  return { H, svg: `<svg class="fld8-svg" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="none" aria-hidden="true"><polygon points="${p.map(([x, y]) => x.toFixed(1) + ',' + y.toFixed(1)).join(' ')}" fill="#3a3d44" data-role="autres" data-part="${h.part.toFixed(2)}" aria-label="autres : hors des 12 familles"/></svg>` };
}
function rendu(h) {
  const sous = h.horsFam.filter((w) => !w.cat);
  const surface = h.mots.filter((w) => w.fam && !w.nomFam && !w.cat);
  const nomsSeuls = h.familles.filter((f) => !f.mots.some((w) => !w.nomFam && !w.cat));
  const { H, svg } = coque(h, sous);
  const nDans = surface.filter((w) => w.style === 'dans').length + nomsSeuls.filter((f) => f.dans).length;
  const legende = ['Au-dessus de l\'eau : ce que le radar dessine, et ses mots dans les 12 familles.', 'Sous l\'eau : les mots hors des 12 familles ; la coque grandit avec leur part.', 'Grand mot : cité par plusieurs fiches. Souligné bleu : famille attendue au 16D.', 'Traduit : ' + (h.mots.flatMap((w) => w.en.map((e) => '« ' + e + ' » → ' + w.fr)).join(', ') || 'aucun mot')];
  const corps = `${titre(h)}${alpha(h)}
<section class="fld8-ice" aria-label="Ce que le radar voit, et ce qu'il ne voit pas" data-houblon="${esc(h.nom)}">
<div class="fld8-air">
${radar(h, { taille: 264 })}
${demande(h)}
<div class="fld8-surf">${surface.map((w) => `<span class="fld8-sw${w.style === 'dans' ? ' fld8-dans' : ''}" data-famille="${w.fam}" style="color:${T(w.fam)}">${pic(w.fam, 14)}${esc(w.fr)}<small class="num">${w.n}/${w.N}</small></span>`).join('')}${nomsSeuls.map((f) => `<span class="fld8-sw fld8-ns${f.dans ? ' fld8-dans' : ''}" data-famille="${f.f}" style="color:${T(f.f)}">${pic(f.f, 14)}${f.nom.toLowerCase()}</span>`).join('')}${!surface.length && !nomsSeuls.length ? '<span class="fld8-vide">rien à la surface</span>' : ''}</div>
</div>
<div class="fld8-eau">
<svg class="fld8-vague" viewBox="0 0 390 14" width="100%" height="14" preserveAspectRatio="none" aria-hidden="true"><path d="M0 7 Q 16 1 32 7 T 65 7 T 97 7 T 130 7 T 162 7 T 195 7 T 227 7 T 260 7 T 292 7 T 325 7 T 357 7 T 390 7 V14 H0Z" fill="#e6eef6"/><path d="M0 7 Q 16 1 32 7 T 65 7 T 97 7 T 130 7 T 162 7 T 195 7 T 227 7 T 260 7 T 292 7 T 325 7 T 357 7 T 390 7" fill="none" stroke="#5f7a96" stroke-width="1.5"/></svg>
<div class="fld8-barre"><h2 class="fld8-q">Que rate le radar ?</h2><span class="fld8-z" data-style-seul><span class="fd-zone" data-role="zone">16D</span>${nDans ? nDans + ' attendu' + (nDans > 1 ? 's' : '') : 'rien d\'attendu'}</span>${lentille('leg-' + ID, legende, 'fld8-lent')}</div>
<div class="fld8-fond">
<div class="fld8-coque" style="height:${H}px">${svg}
<div class="fld8-mots">${sous.length ? sous.map((w) => `<span class="fld8-w${w.gen ? ' fld8-gen' : ''}" style="font-size:${w.n > 1 ? 23 : 16}px">${esc(w.fr)}<small class="num">${w.n}/${w.N}</small></span>`).join('') : '<span class="fld8-w fld8-gen" style="font-size:14px">rien sous l\'eau</span>'}</div></div>
<p class="fld8-part"><b class="num">${sous.length}</b> mot${sous.length > 1 ? 's' : ''} sous l'eau · ${Math.round(h.part * 100)} % de ses mots hors des 12 familles${h.nonDecrites.length ? ` · ${h.nonDecrites.length} familles non décrites (?)` : ''}</p>
</div></div>
</section>`;
  return doc({ id: ID, h, titre: 'fld8 · iceberg', corps, css: CSS });
}
const CSS = `
.fld8-ice { margin:2px -12px 0; }
.fld8-air { padding:0 12px; }
.fld8-surf { display:flex; flex-wrap:wrap; justify-content:center; gap:4px 12px; padding:2px 4px 6px; }
.fld8-sw { display:inline-flex; align-items:center; gap:3px; font-size:15px; font-weight:700; }
.fld8-sw small { font-size:11px; color:var(--gris); font-weight:600; margin-left:1px; }
.fld8-ns { font-weight:400; font-style:italic; }
body:not(.abs) .fld8-dans { text-decoration:underline; text-decoration-color:var(--zone); text-decoration-thickness:3px; text-underline-offset:4px; }
.fld8-vide { font-size:13px; color:var(--gris); }
.fld8-eau { background:#e6eef6; }
.fld8-vague { display:block; background:#fff; }
.fld8-barre { display:flex; align-items:center; gap:8px; padding:2px 12px 6px; position:relative; }
.fld8-q { font-size:15px; font-weight:700; color:#1f3550; }
.fld8-lab { font-size:12px; font-weight:600; color:#2f4a66; }
.fld8-z { display:inline-flex; align-items:center; gap:4px; font-size:12px; color:#3d4b5c; }
.fld8-lent { margin-left:auto; } .fld8-lent .fd-leg { left:auto; right:0; }
.fld8-lent .fd-seg { background:#d3deea; }
.fld8-fond { padding:0 0 10px; }
.fld8-coque { position:relative; }
.fld8-svg { position:absolute; inset:0; display:block; }
.fld8-mots { position:relative; display:flex; flex-wrap:wrap; justify-content:center; align-content:flex-start; gap:6px 14px; padding:16px 70px 0; }
.fld8-w { color:#fff; font-weight:800; line-height:1.05; background:#3a3d44; }
.fld8-w small { font-size:11px; font-weight:600; color:#d9dbe0; margin-left:2px; }
.fld8-gen { font-weight:400; color:#d2d4da; }
.fld8-part { font-size:12px; color:#3d4b5c; padding:6px 12px 0; } .fld8-part b { color:var(--encre); font-size:14px; }
`;
ecrire(ID, 'Nelson Sauvin', rendu);
