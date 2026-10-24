// fld8b — passe 2 de fld8 (l'iceberg), verdict du conseil (conseil-fl/verdict.md, point 3 et règles communes).
// Retouches : eau et coque dans les gris du thème (D106), coque claire, jamais un gros bloc sombre (D82) ; la part dite
// en mots comptés à l'écran (« 5 mots sur 7 » pour Nelson Sauvin), plus de « 83 % » ; les familles non décrites derrière
// le « ? » ; greffe de flu6 : les mots au bout des rayons du radar (la pointe hors de l'eau) ; tient sur Nugget et
// Cascade (presque rien sous l'eau : dit en clair) ; un seul α, celui de g1 (Hopsteiner 2025), avec le lot.
// Les houblons se choisissent dans l'étape derrière la feuille (un seul facteur libre, D98) ; la fiche g1 reste entière.
import fs from 'node:fs';
import path from 'node:path';
import { HOPS, NOMS, slug, ici as ICI1, SYMBOLES, CSS as CSS0, JS as JS0, titre, jauge, radar, demande, lentille, ficheCourte, actions, T, esc, COURT, ROUE, STYLE, fr1 } from '../fld1/socle.mjs';

const ID = 'fld8b', DEFAUT = 'Nelson Sauvin';
// Icônes dessinées à 1,5 px de trait rendu (décision du pilote, S4), au lieu de 1,8 dans le socle.
// Décision du pilote (passe 2, STANDARD S1 sur les cinq candidates) : Nelson Sauvin = #a0081f, comme flc8b.
const COUL = { 'Nelson Sauvin': '#a0081f' };
const H8 = Object.fromEntries(NOMS.map((n) => [n, { ...HOPS[n], couleur: COUL[n] || HOPS[n].couleur }]));
const dir = path.join(ICI1, '..', ID);
const PACK = JSON.parse(fs.readFileSync(path.join(ICI1, '../../../../../../prototypes/houblons-v4/data/pack-fiches.json'), 'utf8')).fichesHoublons;

// Règle commune : un seul α, celui de g1 (la plage Hopsteiner 2025 quand elle existe), avec le lot.
function alphaG1(h) {
  const src = PACK.find((x) => x.name === h.nom).alpha.sources;
  const s = src.find((x) => x.source === 'Hopsteiner') || src[0];
  return { ...h, alpha: { ...h.alpha, min: s.min, max: s.max, src: s.source + ' ' + s.annee, horsFiches: h.alpha.lot < s.min || h.alpha.lot > s.max } };
}
const alpha = (h) => `<div class="fd-alpha fld8b-al"><span class="fld8b-ag"><span class="fd-a-sym">α</span> <b>${fr1(h.alpha.min)}–${fr1(h.alpha.max)} %</b></span><span class="fd-a-lot">lot ${fr1(h.alpha.lot)} %${h.alpha.horsFiches ? ' <b class="fd-hf">hors de ses fiches</b>' : ''}</span>${jauge(h)}<span class="fd-usage" data-role="usage">${h.usage}</span><span class="fd-stock">${h.stock.grams ? h.stock.grams + ' g' : 'épuisé'}</span></div>`;

// L'étape derrière la feuille : le houblon se choisit ici (seul facteur libre), la bière est fixée.
const etape = (h) => `<div class="fld8b-et">
<p class="fld8b-ctx" data-role="contexte"><span class="fld8b-ret">‹ Houblons</span><span data-contexte="base">Stout export · 20 L</span><span data-contexte="style">16D Foreign Extra Stout</span></p>
<div class="fld8b-tabs" role="radiogroup" aria-label="Houblon de la fiche" data-libre="houblon">${NOMS.map((n) => `<button type="button" role="radio" aria-checked="${n === h.nom}" data-aller="${n === DEFAUT ? 'etat.html' : 'h-' + slug(n) + '.html'}"><i style="background:${H8[n].couleur}"></i>${esc(n)}</button>`).join('')}</div>
</div>`;

// La pointe : le radar de g1, ses mots au bout de chaque rayon (greffe flu6), un picto par famille citée.
const W = 390, H = 304, MARGE = 0.72;
const R = Math.min(W / 2 - 84, H / 2 - 22) * MARGE, C = [W / 2, H / 2];
const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / 12;
// Les mots d'une famille en lignes de jetons (chaque mot garde sa classe : mot, nom de la famille, catégorie).
function lignes(ws, max) {
  const out = []; let cur = [], lg = 0;
  for (const w of ws) { const n = w.t.length + 2; if (cur.length && lg + n > max) { out.push(cur); cur = []; lg = 0; } cur.push(w); lg += n; }
  if (cur.length) out.push(cur);
  return out;
}
function rayons(h) {
  let s = '';
  ROUE.forEach((f, i) => {
    const d = h.familles.find((x) => x.f === f), co = Math.cos(ang(i)), si = Math.sin(ang(i));
    const x = C[0] + (R + 14) * co, y = C[1] + (R + 14) * si, anc = co > 0.3 ? 'start' : co < -0.3 ? 'end' : 'middle';
    if (!d) { s += `<text x="${x.toFixed(1)}" y="${(y + 4 + (si > 0.9 ? 10 : 0)).toFixed(1)}" text-anchor="${anc}" class="fd-rl fd-rl-i">${COURT[f]}?</text>`; return; }
    // Tous ses mots, comptables à l'écran : le nom de la famille quand la fiche le dit (en italique gris), la catégorie Hopsteiner marquée.
    const ws = d.mots.map((w) => ({ t: w.fr + (w.cat ? ' (catég.)' : ''), c: w.cat || w.nomFam ? 'fld8b-wi' : '' }));
    const L = lignes(ws, anc === 'middle' ? 24 : 14);
    const lh = 15, total = (L.length + 1) * lh;
    const y0 = si < -0.9 ? y - total + 10 : si > 0.9 ? y + 16 : y - total / 2 + 10;
    const xt = anc === 'start' ? x + 17 : anc === 'end' ? x - 17 : x;
    const [px, py] = anc === 'start' ? [x, y0 - 11] : anc === 'end' ? [x - 14, y0 - 11] : si < 0 ? [x - 7, y0 - 27] : [x - 7, y0 + L.length * lh + 4];
    s += `<svg x="${px.toFixed(1)}" y="${py.toFixed(1)}" width="14" height="14" viewBox="0 0 24 24" data-famille="${f}" aria-label="${COURT[f]}"><use href="#p-${f}"/></svg>`;
    if (d.dans) s += `<circle cx="${(px + 15).toFixed(1)}" cy="${py.toFixed(1)}" r="3.5" style="fill:var(--zone)" data-style-seul/>`;
    s += `<text x="${xt.toFixed(1)}" y="${y0.toFixed(1)}" text-anchor="${anc}" class="fld8b-et-t"><tspan class="fld8b-fn" fill="${T(f)}">${d.nom} <tspan class="fld8b-nn">${d.n}/${d.N}</tspan></tspan>`;
    L.forEach((l) => { s += `<tspan x="${xt.toFixed(1)}" dy="${lh}">` + l.map((w, k) => `<tspan class="fld8b-w ${w.c}" fill="${w.c ? '#5b5b66' : T(f)}">${esc(w.t)}${k < l.length - 1 ? ', ' : ''}</tspan>`).join('') + '</tspan>'; });
    s += '</text>';
  });
  return s;
}

// La coque : hauteur selon la part comptée à l'écran (mots hors des 12 / mots de la fiche).
function coque(h, n, total) {
  const k = total ? n / total : 0, Hc = Math.round(54 + 230 * k), L = 44, Rr = 346;
  const p = [[L, 0], [Rr, 0], [Rr + 8, Hc * 0.18], [Rr - 18, Hc * 0.38], [Rr - 4, Hc * 0.55], [Rr - 52, Hc * 0.78], [W / 2 + 40, Hc * 0.9], [W / 2 + 6, Hc], [W / 2 - 34, Hc * 0.93], [L + 52, Hc * 0.74], [L + 14, Hc * 0.5], [L - 6, Hc * 0.3], [L + 6, Hc * 0.12]];
  return { Hc, svg: `<svg class="fld8b-svg" viewBox="0 0 ${W} ${Hc}" width="100%" height="${Hc}" preserveAspectRatio="none" aria-hidden="true"><polygon points="${p.map(([x, y]) => x.toFixed(1) + ',' + y.toFixed(1)).join(' ')}" fill="#d4d5db" stroke="#8d8d96" stroke-width="1.5" data-role="autres" data-part="${k.toFixed(2)}" aria-label="autres : hors des 12 familles"/></svg>` };
}

function rendu(h0) {
  const h = alphaG1(h0);
  const sous = h.horsFam, total = h.mots.length, n = sous.length, dedans = total - n;
  const { Hc, svg } = coque(h, n, total);
  const nd = h.nonDecrites.map((f) => COURT[f]).join(', ');
  const legende = [
    'Hors de l\'eau : le radar de ses fiches, ses mots au bout de chaque rayon.',
    'Sous l\'eau : ses mots hors des 12 familles, que le radar ne sait pas dessiner ; la coque grandit avec leur nombre.',
    'n/N : fiches qui citent le mot. Italique : catégorie déclarée par Hopsteiner, pas un mot de dégustation.',
    'Point bleu près d\'un picto : famille attendue au 16D.',
    `${h.nonDecrites.length} familles non décrites (inconnu, pas zéro) : ${nd}.`,
    'Traduit : ' + (h.mots.flatMap((w) => w.en.map((e) => '« ' + e + ' » → ' + w.fr)).join(', ') || 'aucun mot'),
    `α : ${h.alpha.src}, lot ${fr1(h.alpha.lot)} %.`,
  ];
  const resume = n === 0 ? `aucun de ses ${total} mots hors des 12 familles : tout se dessine` : `<b>${n} mot${n > 1 ? 's' : ''} sur ${total}</b> hors des 12 familles${n / total < 0.25 ? ' : presque tout se dessine' : ''}`;
  const corps = `${titre(h)}${alpha(h)}
<section class="fld8b-ice" aria-label="Ce que le radar dessine, et ce qu'il ne dessine pas" data-houblon="${esc(h.nom)}">
<div class="fld8b-q"><h2>Que sent-il, avec ses mots ?</h2>${lentille('leg-' + ID, legende, 'fld8b-lent')}</div>
${radar(h, { taille: H, haut: H, etiquettes: false, marge: MARGE, extra: rayons(h), cls: 'fld8b-rad' })}
${demande(h)}
<div class="fld8b-eau">
<svg class="fld8b-vague" viewBox="0 0 390 12" width="100%" height="12" preserveAspectRatio="none" aria-hidden="true"><path d="M0 6 Q 16 1 32 6 T 65 6 T 97 6 T 130 6 T 162 6 T 195 6 T 227 6 T 260 6 T 292 6 T 325 6 T 357 6 T 390 6 V12 H0Z" fill="#f3f3f6"/><path d="M0 6 Q 16 1 32 6 T 65 6 T 97 6 T 130 6 T 162 6 T 195 6 T 227 6 T 260 6 T 292 6 T 325 6 T 357 6 T 390 6" fill="none" stroke="#8d8d96" stroke-width="1.5"/></svg>
<p class="fld8b-ligne"><span class="fld8b-lab">sous l'eau, ce que le radar ne dessine pas</span><span class="fld8b-z" data-style-seul><span class="fd-zone" data-role="zone">16D</span>n'en dit rien</span></p>
<div class="fld8b-coque" style="min-height:${Hc}px">${svg}
<div class="fld8b-mots">${n ? sous.map((w) => `<span class="fld8b-m${w.gen ? ' fld8b-gen' : ''}${w.cat ? ' fld8b-cat' : ''}" style="font-size:${w.cat ? 15 : w.n > 1 ? 23 : 17}px">${esc(w.fr)}<small>${w.n}/${w.N}${w.cat ? ' · catégorie' : ''}</small></span>`).join('') : '<span class="fld8b-m fld8b-cat" style="font-size:15px">rien</span>'}</div></div>
<p class="fld8b-part">${resume}</p>
</div>
</section>`;
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>fld8b · iceberg, passe 2 · ${esc(h.nom)} · fiche, la liste (24.10)</title>
<style>${CSS0}
${CSS}</style></head>
<body>
${SYMBOLES}
<div class="fd-ecran ${ID}">
${etape(h)}
<main class="fd-feuille" role="dialog" aria-label="Fiche de ${esc(h.nom)}">
${corps}
${actions(h)}
</main>
</div>
${ficheCourte(h)}
<script>${JS0}</script>
<script>(function(){ [].slice.call(document.querySelectorAll('[data-aller]')).forEach(function (b) { b.addEventListener('click', function () { location.href = b.getAttribute('data-aller'); }); }); })();</script>
</body></html>`;
}
const CSS = `
.fld8b-et { padding:6px 12px 8px; display:flex; flex-direction:column; gap:6px; }
.fld8b-ctx { display:flex; align-items:center; gap:6px; font-size:12px; color:#3a3a42; flex-wrap:wrap; }
.fld8b-ret { font-weight:600; font-size:15px; color:var(--encre); margin-right:2px; }
.fld8b-ctx [data-contexte] { height:22px; padding:0 8px; border-radius:11px; border:1px solid #9c9ca6; display:inline-flex; align-items:center; }
.fld8b-tabs { display:flex; gap:4px; overflow-x:auto; scrollbar-width:none; }
.fld8b-tabs button { flex:none; height:28px; padding:0 9px; border-radius:14px; background:#ececf1; color:var(--encre); font-size:13px; display:inline-flex; align-items:center; gap:5px; }
.fld8b-tabs button i { width:8px; height:8px; border-radius:50%; display:inline-block; }
.fld8b-tabs button[aria-checked="true"] { background:#fff; font-weight:700; box-shadow:0 1px 2px rgba(22,22,26,.15); }
.fd-feuille { min-height:calc(100vh - 76px); }
.fld8b-al .fld8b-ag { font-size:18px; } .fld8b-ag b { font-size:20px; font-weight:700; }
.fld8b-ice { margin:0 -12px; }
.fld8b-q { display:flex; align-items:center; gap:6px; padding:4px 12px 0; }
.fld8b-q h2 { font-size:15px; font-weight:600; }
.fld8b-lent { margin-left:auto; } .fld8b-lent .fd-leg { left:auto; right:0; }
.fld8b-et-t { font:400 12px var(--sans); paint-order:stroke; stroke:#fff; stroke-width:3px; stroke-linejoin:round; }
.fld8b-fn { font-weight:700; font-size:13px; } .fld8b-nn { font-weight:600; fill:#16161a; font-size:12px; }
.fld8b-w { font-size:13px; font-weight:600; } .fld8b-wi { font-weight:400; font-style:italic; }
.fld8b-eau { background:#f3f3f6; padding-bottom:10px; }
.fld8b-vague { display:block; background:#fff; }
.fld8b-ligne { display:flex; align-items:center; gap:8px; padding:2px 12px 6px; font-size:12px; color:#5b5b66; }
.fld8b-lab { font-weight:600; color:#3a3a42; }
.fld8b-z { margin-left:auto; display:inline-flex; align-items:center; gap:4px; }
.fld8b-coque { position:relative; }
.fld8b-svg { position:absolute; inset:0; display:block; height:100%; }
.fld8b-mots { position:relative; display:flex; flex-wrap:wrap; justify-content:center; align-content:flex-start; gap:6px 14px; padding:14px 64px 16px; }
.fld8b-m { color:var(--encre); font-weight:800; line-height:1.05; background:#d4d5db; }
.fld8b-m small { font-size:12px; font-weight:600; color:#3a3a42; margin-left:3px; }
.fld8b-gen { font-weight:500; color:#3a3a42; }
.fld8b-cat { font-weight:400; font-style:italic; color:#3a3a42; }
.fld8b-part { font-size:13px; color:#3a3a42; padding:6px 12px 0; text-align:center; } .fld8b-part b { color:var(--encre); }
`;
fs.mkdirSync(dir, { recursive: true });
for (const n of NOMS) fs.writeFileSync(path.join(dir, n === DEFAUT ? 'etat.html' : 'h-' + slug(n) + '.html'), rendu(H8[n]).split('stroke-width="1.8"').join('stroke-width="1.5"'));
console.log('fld8b écrit');
