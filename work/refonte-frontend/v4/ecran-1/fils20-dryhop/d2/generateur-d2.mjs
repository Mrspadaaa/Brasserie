// Lot 20 · d2 · Citra contre Cascade, moment par moment. La carte matrice de l8b : un bloc par marqueur (ses
// familles en tête), une ligne par moment (60′, 10′, whirlpool, dry hop actif, dry hop après) ; sur chaque
// ligne, une piste longue (barres de l5b) où Citra et Cascade posent leur rapport au seuil en plage, avec le
// repère central. L'écart se lit en descendant : presque rien à 60′ (« surtout de l'amertume », bornes hautes
// seules), puis il s'ouvre. Toucher la tête d'un bloc trie ses moments par l'écart des repères centraux.
// 4MMP : l'enveloppe des sources se recouvre ; sur la base commune Hopsteiner 2024, Citra est au-dessus.
// Témoin : le modèle actuel les donne identiques. Chiffres : citra-contre-cascade.json (moteur) ; témoin :
// donnees-h.json (DIAGNOSTIC) ; α : le stock. Usage : node generateur-d2.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../d1/socle-h.mjs';
import * as M from '../d1/moteur-h.mjs';
const { D, HB, num, inc, ent, nom, picto, hn, lentille, legende, page, ecrire, CSS_PISTE, srcTxt, fr, ic, alpha, JET, repli, xLog } = S;
const ICI = path.dirname(fileURLToPath(import.meta.url));

const C = M.cas('citra-contre-cascade');
const T = C.F.table;
const ZX = M.cas('cas-citra').P.pouvoir.facteurEleve;
const HOPS = ['citra', 'cascade'];
const COLS = [['4MMP', ['tropical', 'berries'], '4MMP'], ['linalol', ['floral', 'citrus'], 'linalol'], ['myrcene', ['green', 'resin'], 'myrcène']];
const MO = { b60: ['ebu', '60′'], b10: ['ebu', '10′'], wp: ['whirl', 'WP'], dryActive: ['cuveA', 'actif'], dryPost: ['cuveP', 'après'] };
const MOLONG = { b60: 'ébullition 60′', b10: 'ébullition 10′', wp: 'whirlpool', dryActive: 'dry hop en fermentation active', dryPost: 'dry hop après fermentation' };
const lien = (s) => `<span class="src" data-ref>${srcTxt(s)}</span>`;
const TW = 240;
const rap = (y) => (y && y.rapport && y.rapport.plage && !(y.rapport.plage.min == null && y.rapport.plage.max == null) ? y.rapport.plage : null);
const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

// Une piste : la zone de la 16D (jusqu'à ×10, convention [H]), le seuil, puis une barre par houblon.
function pisteDuo(row, c, f) {
  const x = (v) => xLog(v, TW), J = JET[f];
  let s = `<span class="trk duo" style="width:${TW}px" aria-hidden="true"><i class="rail"></i><i class="rail b"></i><i class="zn" data-role="zone" data-famille="${f}" style="width:${x(ZX.valeur).toFixed(1)}px;--z:${rgba(J.base, 0.3)};--t:${J.texte}"></i><i class="sl" style="left:${(x(1) - 0.75).toFixed(1)}px"></i>`;
  HOPS.forEach((k, i) => {
    const p = rap(row[k].composes[c]), y = 1 + i * 8, H = HB[k], at = `data-houblon="${H.cle}" data-couleur="${H.couleur}"`;
    const fas = row[k].pouvoir && row[k].pouvoir.faceAuStyle, orange = fas && /hors du style/.test(fas.statut) && (fas.composes || []).includes(c);
    if (!p) { s += `<i class="bh hz" ${at} style="--c:${H.couleur};left:0;width:${TW}px;top:${y}px"></i>`; return; }
    const a = p.min == null ? null : x(p.min), b = p.max == null ? TW : x(p.max);
    if (a == null) s += `<i class="bh hz" ${at} style="--c:${H.couleur};left:0;width:${Math.max(0, b - 8).toFixed(1)}px;top:${y}px"></i><i class="bh" ${at} style="--c:${H.couleur};left:${Math.max(0, b - 8).toFixed(1)}px;width:8px;top:${y}px"></i>`;
    else if (p.max == null) s += `<i class="bh" ${at} style="--c:${H.couleur};left:${a.toFixed(1)}px;width:10px;top:${y}px"></i><i class="bh hz" ${at} style="--c:${H.couleur};left:${(a + 10).toFixed(1)}px;width:${(TW - a - 10).toFixed(1)}px;top:${y}px"></i>`;
    else s += `<i class="bh" ${at} style="--c:${H.couleur};left:${a.toFixed(1)}px;width:${Math.max(3, b - a).toFixed(1)}px;top:${y}px"></i>`;
    if (orange && p.max != null) { const a2 = Math.max(x(ZX.valeur), a || 0); if (b > a2) s += `<i class="hs" style="left:${a2.toFixed(1)}px;width:${(b - a2).toFixed(1)}px;top:${y}px"></i>`; }
    if (p.central != null && p.min != null && p.max != null) s += `<i class="ct" style="left:${(x(p.central) - 1).toFixed(1)}px;top:${y - 2}px"></i>`;
  });
  return s + '</span>';
}
const cel = (o, u) => (o && o.plage && !(o.plage.min == null && o.plage.max == null) ? M.txt(o.plage, { unite: u, pre: u ? '' : '×', src: M.srcM(o.sources), niv: M.nivM(o), central: true }) : inc(C.r((o && o.inconnu) || 'non chiffré'), []));
function ligneMoment(row, c, fams) {
  const id = row.moment, [ico, lab] = MO[id], cmp = row.composes[c] || {};
  const bc = c === '4MMP' && cmp.baseCommune === 'a au-dessus';
  const ecart = cmp.facteurCentral != null ? cmp.facteurCentral : -1;
  const aria = HOPS.map((k) => { const y = row[k].composes[c]; return HB[k].nom + ' ' + C.r((y.lecture && y.lecture.texte) || (y.rapport && y.rapport.inconnu) || 'inconnu'); }).join(' ; ');
  const detail = `<table><tr><th></th>${HOPS.map((k) => `<th>${hn(k)}</th>`).join('')}</tr>
    <tr><td>part retrouvée</td>${HOPS.map((k) => `<td>${cel(row[k].composes[c].transfert, '%')}</td>`).join('')}</tr>
    <tr><td>en bière</td>${HOPS.map((k) => { const o = row[k].composes[c].concentration; return `<td>${cel(o, o && o.unite)}</td>`; }).join('')}</tr>
    <tr><td>× seuil</td>${HOPS.map((k) => `<td>${cel(row[k].composes[c].rapport, '')}</td>`).join('')}</tr></table>
    <p data-source="moteur" data-niveau="H"><b>${MOLONG[id]}</b> : ${fams.map((f) => S.NOM[f].toLowerCase()).join(', ')}, ${C.r(row.familles[fams[0]].texte)}${cmp.facteurCentral != null ? ' ; repère central de Citra ×' + M.n(cmp.facteurCentral) + ' celui de Cascade' : ''}.</p>
    ${bc ? `<p data-source="[11]" data-niveau="P">${C.r(row.citra.composes['4MMP'].baseCommune.base)} : sur cette base commune, Citra est au-dessus de Cascade sans recouvrement ; sur l'enveloppe de toutes les sources, les plages se recouvrent.</p>` : ''}`;
  return repli(`<span class="ml" data-ecart="${ecart}" data-ordre="${Object.keys(MO).indexOf(id)}" role="img" aria-label="${(MOLONG[id] + ' : ' + aria).replace(/"/g, '')}"><span class="mt">${ic(ico, 14)}${ent(lab, 'e')}</span>${pisteDuo(row, c, fams[0])}</span>`, detail, 'mlr');
}
function bloc([c, fams, lib]) {
  return `<section class="bk" data-compose="${c}">
    <div class="bh-t"><button class="th" data-tri="${c}" aria-pressed="false" aria-label="Trier les moments du ${lib} par l'écart Citra – Cascade"><span class="pis">${fams.map((f) => picto(f, 14)).join('')}</span><b>${nom(lib)}</b>${ic('selon', 12)}</button>${c === '4MMP' ? `<span class="bc" data-source="[11]" data-niveau="P" aria-label="dry hop : Citra au-dessus de Cascade sur la base commune Hopsteiner 2024">${ic('haut', 12)}base commune${ic('cuveA', 12)}${ic('cuveP', 12)}</span>` : ''}</div>
    <div class="mls">${T.map((row) => ligneMoment(row, c, fams)).join('')}</div>
  </section>`;
}
// L'amertume, à chaud : l'IBU du moteur (α du lot pour Cascade, plage des fiches pour Citra).
function amertume() {
  const chauds = T.filter((r) => r.citra.amertume && r.citra.amertume.ibu);
  const max = Math.max(...chauds.flatMap((r) => HOPS.map((k) => r[k].amertume.ibu.max)));
  const W = 200, x = (v) => (v / max) * W;
  const lec = C.r(T[0].citra.amertume.lecture);
  return `<section class="bk am">
    <div class="bh-t"><span class="th fixe">${ic('goutte', 14)}<b>amertume</b><span class="gris">${ent('IBU', 'e')}</span></span></div>
    ${chauds.map((r) => { const [ico, lab] = MO[r.moment]; return `<div class="ml"><span class="mt">${ic(ico, 14)}${ent(lab, 'e')}</span><span class="ibs">${HOPS.map((k) => { const a = r[k].amertume, H = HB[k]; return `<span class="ib1"><i class="ibb" style="--c:${H.couleur};width:${x(a.ibu.valeur).toFixed(1)}px" data-houblon="${H.cle}" data-couleur="${H.couleur}"></i>${a.ibu.max > a.ibu.min ? `<i class="ibp" style="--c:${H.couleur};left:${x(a.ibu.min).toFixed(1)}px;width:${(x(a.ibu.max) - x(a.ibu.min)).toFixed(1)}px"></i>` : ''}<span class="ibn" style="left:${(x(a.ibu.max) + 4).toFixed(1)}px">${num(fr(Math.round(a.ibu.valeur * 10) / 10), ['moteur'], 'H', 'v ibv')}</span></span>`; }).join('')}</span></div>`; }).join('')}
    <p class="amr" data-source="moteur" data-niveau="H">${ent('60′', 'e')} ${lec.replace(/ :.*/, '')}</p>
  </section>`;
}

const TV = D.temoinV55;
const temoin = repli(`${ic('egal', 14)}<span>modèle actuel : identiques</span>`, `<table><tr><th data-source="DIAGNOSTIC" data-niveau="H">agrumes (0–100, V5.5)</th><th>${hn('citra')}</th><th>${hn('cascade')}</th></tr>
  ${[['10′, 2 g/L', TV.b10_2gL], ['10′, 8 g/L', TV.b10_8gL], ['dry hop après, 2 g/L', TV.dhPost_2gL], ['dry hop après, 8 g/L', TV.dhPost_8gL]].map(([l, v]) => `<tr><td>${ent(l)}</td><td>${num(v[0], TV.src, TV.niv)}</td><td>${num(v[1], TV.src, TV.niv)}</td></tr>`).join('')}</table>
  <p data-source="DIAGNOSTIC" data-niveau="H">${TV._}. Dans ce modèle, la variété n'entre que par « cité ou non cité » ; le moteur du pouvoir aromatique les sépare par la quantité par gramme et les molécules.</p>`, 'tem');

const LEG = [
  [`${ic('ebu', 14)}${ic('whirl', 14)}${ic('cuveA', 14)}${ic('cuveP', 14)}`, 'ébullition · whirlpool (WP) · dry hop actif · dry hop après'],
  ['<i class="lg-sl"></i>', 'seuil de perception (plage des sources)'],
  [`<i class="lg-zn" style="--z:rgba(238,155,47,.3);--t:${JET.tropical.texte}"></i>`, '16D : jusqu\'à ×10 le seuil, convention [H] à fixer par toi', 'moteur', 'H'],
  [`<i class="lg-bh" style="--c:${HB.citra.couleur}"></i><i class="lg-ct"></i>`, 'rapport au seuil d\'un houblon : plage et repère central'],
  ['<i class="lg-hz"></i>', 'borne inconnue (hachures), jamais 0'],
  [`${ic('haut', 12)}commune`, '4MMP : Citra au-dessus sur la base commune (Hopsteiner 2024)', '[11]', 'P'],
  [`${ic('selon', 12)}`, 'toucher le nom : trier les moments par l\'écart'],
  [`${ic('egal', 14)}`, 'le modèle actuel (V5.5) les donne identiques', 'DIAGNOSTIC', 'H'],
  ['<i class="lg-hs"></i>', 'hors du style (orangé)'],
];
const x1 = xLog(1, TW);
const corps = `
  <header class="tete"><h1>Citra contre Cascade</h1><span class="chip">${ent(fr(T[0].citra.doseGL) + ' g/L')}</span>${lentille()}${legende(LEG)}</header>
  <div class="hops">${HOPS.map((k) => `<span class="hp"><i class="pt" style="background:${HB[k].couleur}" data-houblon="${HB[k].cle}" data-couleur="${HB[k].couleur}"></i>${hn(k)}${alpha(k)}</span>`).join('')}</div>
  ${temoin}
  <div class="mx">
    <div class="axe-t" aria-hidden="true"><span style="left:${(54 + x1).toFixed(1)}px">seuil</span></div>
    ${COLS.map(bloc).join('')}
    ${amertume()}
  </div>`;

const css = `${CSS_PISTE}
  .hops { display: flex; flex-wrap: wrap; gap: 4px 12px; }
  .hp { display: inline-flex; align-items: center; gap: 5px; font-size: 14px; }
  .rp.tem .rp-s { color: var(--encre); }
  .mx { display: flex; flex-direction: column; background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,.12); padding: 2px 6px 6px; }
  .axe-t { position: relative; height: 14px; font-size: 12px; color: var(--gris); }
  .axe-t span { position: absolute; top: 0; transform: translateX(-50%); }
  .bk { border-top: 1px solid var(--trait); padding: 2px 0 2px; }
  .bk:first-of-type { border-top: 0; }
  .bh-t { display: flex; align-items: center; min-height: 26px; }
  .th { display: inline-flex; align-items: center; gap: 5px; height: 26px; padding: 0 6px 0 2px; border-radius: 4px; font-size: 14px; }
  .th .ic { color: var(--gris); }
  .th[aria-pressed="true"] { background: var(--doux); box-shadow: inset 0 -2px 0 var(--encre); }
  .th.fixe { cursor: default; }
  .rp.mlr { background: none; border-radius: 0; }
  .rp.mlr > .rp-s { padding: 0; min-height: 22px; }
  .rp.mlr.ouvert { background: var(--doux); border-radius: 4px; }
  .rp.mlr > .preuve { padding: 0 4px 6px; }
  .ml { display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0; min-height: 22px; }
  .mt { width: 50px; flex: none; display: inline-flex; align-items: center; gap: 2px; font-size: 12px; color: var(--gris); }
  .mt .e { color: var(--encre); }
  .trk.duo { height: 16px; }
  .trk.duo .rail { top: 1px; height: 5px; } .trk.duo .rail.b { top: 9px; }
  .trk.duo .zn { top: 1px; height: 13px; }
  .trk.duo .zn::after { top: 0; height: 13px; }
  .trk.duo .bh { height: 5px; }
  .trk.duo .hs { height: 5px; }
  .trk.duo .ct { width: 2px; height: 9px; }
  .bc { margin-left: auto; display: inline-flex; align-items: center; gap: 1px; font-size: 12px; font-weight: 600; white-space: nowrap; }
  .ibs { display: flex; flex-direction: column; gap: 2px; flex: 1; }
  .ib1 { position: relative; display: flex; align-items: center; height: 11px; }
  .ibn { position: absolute; top: -2px; }
  .ibb { display: block; height: 5px; border-radius: 0 2px 2px 0; background: var(--c); flex: none; }
  .ibp { position: absolute; top: 3px; height: 3px; background: color-mix(in srgb, var(--c) 35%, #fff); border-radius: 2px; }
  .ibv { line-height: 9px; }
  .am .ml { min-height: 26px; }
  .amr { font-size: 12px; color: var(--gris); padding-top: 2px; }
  .amr .e { color: var(--encre); }
  .lg-sl { width: 2px; height: 14px; background: #9a9aa6; }
  .lg-zn { width: 30px; height: 5px; background: var(--z); border-radius: 2px 0 0 2px; box-shadow: 2px 0 0 var(--t); }
  .lg-bh { width: 30px; height: 5px; border-radius: 2px; background: var(--c); } .lg-ct { width: 2px; height: 9px; background: var(--encre); margin-left: -16px; }
  .lg-hz { width: 30px; height: 5px; background: repeating-linear-gradient(135deg, #8a909b 0 1.5px, #fff 1.5px 4px); }
  .lg-hs { width: 24px; height: 5px; border-radius: 2px; background: var(--acc); }
  .lg-v i { display: inline-block; }`;

// Le tri au toucher : les moments du bloc, du plus grand écart des repères centraux (Citra ÷ Cascade) au plus petit ;
// un écart inconnu va en bas ; retoucher rend l'ordre des moments.
const js = `
document.querySelectorAll('.th[data-tri]').forEach((b) => b.addEventListener('click', () => {
  const on = b.getAttribute('aria-pressed') !== 'true';
  b.setAttribute('aria-pressed', String(on));
  const g = b.closest('.bk').querySelector('.mls');
  const rs = [...g.children], v = (r) => parseFloat(r.querySelector('.ml').dataset.ecart), o = (r) => parseFloat(r.querySelector('.ml').dataset.ordre);
  rs.sort((a, z) => (on ? v(z) - v(a) : 0) || o(a) - o(z)).forEach((r) => g.append(r));
}));`;

ecrire(path.join(ICI, 'etat.html'), page({ titre: 'Citra contre Cascade', commentaire: 'Lot 20 · d2 · généré par generateur-d2.mjs depuis citra-contre-cascade.json (moteur), donnees-h.json (témoin) et le stock ; ne pas éditer à la main.', css, corps, js }));
