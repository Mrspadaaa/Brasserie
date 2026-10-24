// Les huit concepts de la série b. Chacun a sa composition ; le socle ne donne que le vocabulaire.
// Jeton « §- » : préfixe du concept (résolu par page()).

import { parCand, doseTxt, stockMot, pied, ligneBiere, CSS_LB, compos, CSS_CP } from './briques-sbb.mjs';

// ---------------------------------------------------------------------------------------------------------------
// sbb1 · froide · u4 affiné : la liste classée de u4, la réponse posée au-dessus.
function sbb1(S) {
  const P = 'sbb1', L = S.CANDS;
  // u4 : une composante inconnue laisse le score ouvert (poids du moteur à 60′ : arôme 0,2, huiles 0,2, amertume 0,6).
  const plage = (c) => c.comp.huiles == null ? [Math.round(0.2 * c.comp.arome + 0.6 * c.comp.amertume), Math.round(0.2 * c.comp.arome + 0.6 * c.comp.amertume + 20)] : null;
  const x = (s) => ((s - 50) / 50) * 100;
  const ligne = (c) => {
    const p = plage(c);
    const marque = p ? `<i class="§-pl" style="left:${x(p[0]).toFixed(1)}%;width:${(x(p[1]) - x(p[0])).toFixed(1)}%"></i><b class="§-sc §-num" style="left:${x(p[0]).toFixed(1)}%">${p[0]}</b>`
      : `<i class="§-dot" style="left:${x(c.score).toFixed(1)}%;background:${c.coul}"></i>`;
    return `<button type="button" role="radio" aria-checked="${c.k === S.REP.k}" class="§-row${c.k === S.REP.k ? ' on' : ''}" data-cand="${c.k}" data-eh="${c.k}" data-houblon="${S.esc(c.nom)}">
<span class="§-id"><span class="§-nm"><b style="color:${c.coul}">${S.esc(c.nom)}</b>${S.stock(c)}</span><span class="§-sub">${S.alphaTxt(c)}${S.usage(c)}<span class="§-num">${S.fr(c.dose.grams)} g</span></span></span>
<span class="§-tr">${marque}</span><span class="§-num §-sv">${p ? p[1] : c.score}</span></button>`;
  };
  const reponse = (c) => `<p class="§-r1"><span style="color:${c.coul}">${S.esc(c.nom)}</span>, ${S.fr(c.dose.grams)} g <span class="§-r1s">${S.pictos(c.cites.slice(0, 5), 16)}${S.autres(c, 26)}</span></p>
<p class="§-r2">${stockMot(S, c)} · <span class="§-num">${S.fr(c.ibu, 1)}</span> IBU, Nugget <span class="§-num">${S.fr(S.NUG.ibu, 1)}</span> · ${c.palier}${c.fiab === 'partielle' ? ', huiles inconnues' : ''}</p>
<div class="§-r4">${compos(S, c)}</div>`;
  const corps = `<main class="§-e">
<header class="§-h">${S.croix(P)}<h1>Lequel à la place de Nugget ?</h1></header>
<p class="§-ctx" data-role="contexte"><span data-contexte="base">Stout 16D</span><span data-contexte="moment">à 60′</span><span data-contexte="dose">46 g · 59,7 IBU</span>${S.stock(S.NUG)}</p>
<section class="§-rep" aria-live="polite">${parCand(S, L, reponse)}<p class="§-r3">Si tu achètes : <b style="color:${S.C.magnat.coul}">Magnat</b>, ${S.fr(S.C.magnat.dose.grams)} g, ${S.C.magnat.score}.</p></section>
<section class="§-liste">
<div class="§-ax"><span>remplaçants à 60′</span><span class="§-axs"><i style="left:${x(50)}%">partiel</i><i style="left:${x(65)}%">proche</i><i style="left:${x(80)}%">très proche</i></span></div>
<div data-libre="houblon" role="radiogroup" aria-label="Le remplaçant">${L.map(ligne).join('')}</div>
<p class="§-leg2"><span><i class="§-dot0"></i>tout connu</span><span><i class="§-pl0"></i>plage : huiles inconnues</span><span class="§-num">50 · 65 · 80 · 100</span></p>
</section>
<section class="§-bi"><div class="§-bih"><h2>Ma bière ${parCand(S, L, (c) => 'avec ' + S.esc(c.nom), 'span')}</h2>${S.legendeBouton(P)}${S.lentille(P)}</div>
${parCand(S, L, (c) => S.BIERE_FAM.map((f) => ligneBiere(S, f, c)).join(''))}
</section>
</main>${pied(S, P, L)}`;
  const css = `${CSS_LB}${CSS_CP}
body { display:flex; flex-direction:column; min-height:100vh; }
.§-e { flex:1; width:100%; max-width:390px; margin:0 auto; padding:6px 12px 8px; display:flex; flex-direction:column; gap:7px; }
.§-h { display:flex; align-items:center; gap:10px; }
.§-h h1 { font-size:17px; font-weight:600; }
.§-ctx { display:flex; flex-wrap:wrap; gap:4px; align-items:center; font-size:13px; }
.§-r1s { display:inline-flex; gap:3px; align-items:center; vertical-align:middle; margin-left:4px; }
.§-r4 { margin-top:3px; }
.§-ctx [data-contexte] { background:#f5f5f5; border-radius:999px; padding:2px 9px; }
.§-rep { border-left:4px solid #111; padding:2px 0 2px 10px; display:flex; flex-direction:column; gap:2px; }
.§-r1 { font-size:22px; font-weight:700; line-height:1.15; }
.§-r2 { font-size:13px; color:#333; }
.§-r3 { font-size:13px; color:#555; }
.§-ax { display:grid; grid-template-columns:1fr 150px 30px; gap:4px; font-size:12px; color:#666; padding:0 6px; }
.§-axs { position:relative; height:16px; }
.§-axs i { position:absolute; font-style:normal; white-space:nowrap; }
.§-row { display:grid; grid-template-columns:1fr 150px 30px; align-items:center; gap:4px; width:100%; min-height:38px; padding:2px 6px; border-radius:8px; }
.§-row.on { background:#f5f5f5; }
.§-id { display:flex; flex-direction:column; min-width:0; gap:1px; }
.§-nm { display:flex; align-items:center; gap:6px; font-size:14px; white-space:nowrap; }
.§-sub { display:flex; align-items:center; gap:5px; font-size:12px; color:#555; white-space:nowrap; }
.§-sub .§-num { font-size:12px; }
.§-sub .§-gr { display:none; }
.§-tr { position:relative; height:20px; background:linear-gradient(90deg,transparent 0 29.5%,#e6e6e6 29.5% 30.5%,transparent 30.5% 59.5%,#e6e6e6 59.5% 60.5%,transparent 60.5%); }
.§-tr::before { content:""; position:absolute; left:0; right:0; top:50%; height:1px; background:#e6e6e6; }
.§-dot { position:absolute; top:50%; width:12px; height:12px; margin:-6px 0 0 -6px; border-radius:50%; }
.§-pl { position:absolute; top:5px; height:10px; border-radius:2px; background:repeating-linear-gradient(45deg,#9e9e9e 0 2px,#fff 2px 5px); border:1px solid #9e9e9e; }
.§-sc { position:absolute; top:-1px; transform:translateX(-110%); font-size:12px; color:#555; }
.§-sv { font-size:14px; font-weight:700; text-align:right; }
.§-leg2 { display:flex; gap:12px; font-size:12px; color:#555; padding:0 6px; align-items:center; }
.§-leg2 span { display:inline-flex; align-items:center; gap:4px; }
.§-leg2 .§-num { margin-left:auto; }
.§-dot0 { display:inline-block; width:10px; height:10px; border-radius:50%; background:#555; }
.§-pl0 { display:inline-block; width:18px; height:8px; border-radius:2px; border:1px solid #9e9e9e; background:repeating-linear-gradient(45deg,#9e9e9e 0 2px,#fff 2px 5px); }
.§-bi { border-top:1px solid #e0e0e0; padding-top:6px; display:flex; flex-direction:column; gap:5px; }
.§-bih { display:flex; align-items:center; gap:8px; }
.§-bih h2 { font-size:14px; font-weight:700; margin-right:auto; }
`;
  return S.page(P, { titre: 'sbb1 · Lequel à la place de Nugget ? · la liste de u4, la réponse en tête', corps, css, fiches: [S.NUG, ...L],
    legendeLignes: [...S.LEG_COMMUNE, 'Plage (Altus, Trident) : huiles inconnues laissées ouvertes de 0 à 100 ; calcul de cette page, pas du moteur.', 'Ordre du moteur : en stock d’abord, puis le score.'] });
}

// ---------------------------------------------------------------------------------------------------------------
// sbb2 · froide · u4 affiné : son face-à-face, réduit à la paire Nugget → la réponse, sur les plages de u4.
function sbb2(S) {
  const P = 'sbb2', L = S.CANDS.filter((c) => ['nelson-sauvin', 'galaxy', 'idaho-7', 'sabro', 'magnat'].includes(c.k));
  const ax = (v, max) => ((v / max) * 100).toFixed(1) + '%';
  // Une plage de u4 : la plage des fiches (Beer Maverick, Hopsteiner en trait fin), le lot en trait noir.
  const plageL = (h, coul, vals, lot, max, fmt) => {
    const [bm, hs] = vals;
    return `<span class="§-pg">${bm ? `<i class="§-pgb" style="left:${ax(bm[0], max)};width:calc(${ax(bm[1], max)} - ${ax(bm[0], max)});background:${coul}"></i>` : '<i class="§-pgi"></i>'}${hs ? `<i class="§-pgs" style="left:${ax(hs[0], max)};width:calc(${ax(hs[1], max)} - ${ax(hs[0], max)});background:${coul}"></i>` : ''}${lot != null ? `<i class="§-pgl" style="left:${ax(lot, max)}"></i>` : ''}</span>`;
  };
  const rangee = (lab, h, coul, vals, lot, max, txt) => `<div class="§-pr"><span class="§-prl">${lab}</span><span class="§-num §-prv">${txt}</span>${plageL(h, coul, vals, lot, max)}</div>`;
  const fr1 = (p) => p ? `${S.fr(p[0], 1)}–${S.fr(p[1], 1)}` : '?';
  const carte = (h, dose, sous, orig) => `<div class="§-cd${orig ? ' §-or' : ''}" data-houblon="${S.esc(h.nom)}" style="--c:${h.coul}"><span class="§-cdn">${S.esc(h.nom)}</span><span class="§-cds">${S.usage(h)}${S.stock(h)}${S.autres(h, 28)}</span><span class="§-num §-cdd">${dose}</span><span class="§-cdp">${S.pictos(h.cites.slice(0, 6), 15)}</span>${sous ? `<span class="§-cdx">${sous}</span>` : ''}</div>`;
  const lv = (h, f) => ({ 'non décrit': 0, cité: 1, marqué: 2 })[h.familles[f].niveau];
  const cases = (n, coul) => `<span class="§-cs">${[1, 2].map((k) => `<i class="${n >= k ? '' : n === 0 ? '§-cs0' : '§-cs1'}"${n >= k ? ` style="background:${coul}"` : ''}></i>`).join('')}</span>`;
  const aromes = (c) => { const fs_ = S.FAM.filter((f) => lv(S.NUG, f) || lv(c, f)); return `<div class="§-sec"><h2>Arômes cités <span class="§-gr">· à 60′, l’ébullition en emporte l’essentiel</span></h2><div class="§-ar"><span></span><span class="§-arh">Nugget</span><span class="§-arh" style="color:${c.coul}">${S.esc(c.nom.split(' ')[0])}</span>${fs_.map((f) => `<span class="§-arf">${S.pic(f, 15)}<span style="color:${S.T(f)}">${S.NOMF[f]}</span></span>${cases(lv(S.NUG, f), '#444')}${cases(lv(c, f), c.coul)}`).join('')}</div></div>`; };
  const bloc = (c) => `${carte(c, `${S.fr(c.dose.grams)} g`, `${stockMot(S, c)} · ${c.score} ${c.palier}`)}
<div class="§-sec"><h2>α et β, même IBU</h2>
${rangee('α', S.NUG, '#9e9e9e', [S.NUG.cat.alpha, S.NUG.cat.hs && S.NUG.cat.hs.alpha], S.NUG.alpha.valeur, 20, `${S.fr(S.NUG.alpha.valeur, 1)} <small>Nugget</small>`)}
${rangee('', c, c.coul, [c.cat.alpha, c.cat.hs && c.cat.hs.alpha], /fiche|article/.test(c.alpha.source) ? c.alpha.valeur : null, 20, `${S.fr(c.alpha.valeur, 1)}${c.alpha.horsFiches ? ' ≠' : ''}`)}
${rangee('β', S.NUG, '#9e9e9e', [S.NUG.cat.beta, S.NUG.cat.hs && S.NUG.cat.hs.beta], null, 20, fr1(S.NUG.cat.beta))}
${rangee('', c, c.coul, [c.cat.beta, c.cat.hs && c.cat.hs.beta], null, 20, fr1(c.cat.beta))}
<p class="§-axe §-num"><span>0</span><span>5</span><span>10</span><span>15</span><span>20 %</span></p></div>
${aromes(c)}
<div class="§-sec"><div class="§-bih"><h2>Ma bière, au style</h2><span class="§-num §-ibu">${S.fr(c.ibu, 1)} IBU</span></div>${S.BIERE_FAM.map((f) => ligneBiere(S, f, c)).join('')}</div>`;
  const corps = `<main class="§-e">
<header class="§-h">${S.croix(P)}<div><p class="§-k" data-role="contexte"><span data-contexte="base">Stout 16D</span> · <span data-contexte="moment">60′</span> · <span data-contexte="dose">même IBU (59,7)</span></p><h1>Lequel à la place de Nugget ?</h1></div></header>
<div class="§-fl">${carte(S.NUG, '46 g', 'épuisé : 0 g au stock', true)}<span class="§-fle" aria-hidden="true">↓</span></div>
${parCand(S, L, bloc)}
<div class="§-ch"><div data-libre="houblon" role="radiogroup" aria-label="Le remplaçant" class="§-chs">${L.map((c) => `<button type="button" role="radio" aria-checked="${c.k === S.REP.k}" data-cand="${c.k}" data-eh="${c.k}" class="${c.k === S.REP.k ? 'on' : ''}" style="--c:${c.coul}">${S.pastille(c, 8)}${S.esc(c.nom)}</button>`).join('')}</div><span class="§-tools">${S.legendeBouton(P)}${S.lentille(P)}</span></div>
</main>${pied(S, P, L)}`;
  const css = `${CSS_LB}
body { display:flex; flex-direction:column; min-height:100vh; }
.§-e { flex:1; width:100%; max-width:390px; margin:0 auto; padding:6px 12px 8px; display:flex; flex-direction:column; gap:7px; }
.§-h { display:flex; align-items:center; gap:10px; }
.§-h h1 { font-size:17px; font-weight:600; }
.§-k { font-size:12px; color:#555; }
.§-fl { display:flex; flex-direction:column; align-items:stretch; }
.§-fle { align-self:center; font-size:16px; line-height:14px; color:#555; }
.§-cd { display:grid; grid-template-columns:1fr auto; grid-template-areas:"n d" "s p" "x x"; gap:2px 8px; padding:7px 10px; border-radius:8px; background:#f5f5f5; border-left:4px solid var(--c); }
.§-cd.§-or { background:#fff; border:2px solid #444; border-left-width:4px; }
.§-cdn { grid-area:n; font-size:17px; font-weight:700; color:var(--c); }
.§-or .§-cdn { color:#111; }
.§-cds { grid-area:s; display:flex; gap:6px; align-items:center; }
.§-cdd { grid-area:d; font-size:20px; font-weight:700; text-align:right; }
.§-cdp { grid-area:p; display:flex; gap:2px; justify-content:flex-end; align-items:center; }
.§-cdx { grid-area:x; font-size:12px; color:#555; }
.§-sec { display:flex; flex-direction:column; gap:4px; }
.§-sec h2 { font-size:13px; font-weight:700; }
.§-pr { display:grid; grid-template-columns:16px 76px 1fr; align-items:center; gap:6px; min-height:17px; }
.§-prl { font-weight:700; font-size:14px; }
.§-prv { font-size:13px; }
.§-prv small { font-family:"Source Sans 3","Segoe UI",sans-serif; font-size:12px; color:#666; }
.§-pg { position:relative; height:14px; background:linear-gradient(#f0f0f0,#f0f0f0) 0 4px/100% 6px no-repeat; }
.§-pg i { position:absolute; display:block; }
.§-pgb { top:4px; height:6px; border-radius:999px; }
.§-pgs { top:12px; height:2px; opacity:.55; }
.§-pgl { top:1px; width:2px; height:12px; margin-left:-1px; background:#111; }
.§-pgi { left:0; right:0; top:4px; height:6px; border-radius:999px; background:repeating-linear-gradient(45deg,#d6d6d6 0 2px,#fff 2px 5px); }
.§-axe { display:flex; justify-content:space-between; margin-left:98px; font-size:12px; color:#666; }
.§-bih { display:flex; align-items:center; gap:8px; }
.§-bih h2 { margin-right:auto; }
.§-ibu { font-size:13px; }
.§-ch { display:flex; flex-direction:column; gap:6px; border-top:1px solid #e0e0e0; padding-top:7px; }
.§-ar { display:grid; grid-template-columns:1fr 70px 70px; gap:2px 6px; align-items:center; font-size:13px; }
.§-arh { font-size:12px; font-weight:700; color:#444; }
.§-arf { display:flex; align-items:center; gap:5px; }
.§-cs { display:inline-flex; gap:3px; }
.§-cs i { display:block; width:18px; height:8px; border-radius:2px; }
.§-cs .§-cs1 { background:#ebebeb; }
.§-cs .§-cs0 { border:1px dashed #9e9e9e; }
.§-chs { display:flex; flex-wrap:wrap; gap:5px; }
.§-chs button { display:inline-flex; align-items:center; gap:5px; height:32px; padding:0 11px; border-radius:999px; border:1px solid #d9d9d9; font-size:13px; font-weight:600; }
.§-chs button.on { border:2px solid var(--c); }
.§-tools { display:flex; justify-content:space-between; align-items:center; }
`;
  return S.page(P, { titre: 'sbb2 · Lequel à la place de Nugget ? · le face-à-face de u4, à deux', corps, css, fiches: [S.NUG, ...L],
    legendeLignes: [...S.LEG_COMMUNE, 'α et β : barre, plage Beer Maverick ; trait fin, Hopsteiner ; trait noir, le lot ; « ≠ » : le lot sort des fiches.'] });
}

import { sbb3, sbb4, sbb5 } from './concepts-sbb-tiedes.mjs';
import { sbb6, sbb7, sbb8 } from './concepts-sbb-chaudes.mjs';
export const CONCEPTS = { sbb1, sbb2, sbb3, sbb4, sbb5, sbb6, sbb7, sbb8 };

