// Lot 21 · y3 « La molette » : on tourne la dose au doigt, la saturation se sent.
// Questions du brasseur : « citra aura un effet extrêmement differents en dry hopping que cascade alors que
// pourtant d'après Nos outils ils sont assez similaire » ; et le pilote : « la saturation mesurée chez
// Cascade (E04) est exactement ce que ton geste de dose doit faire sentir ».
// Le geste EST la simulation : un doigt tourne la molette de 0 à 16 g/L ; à angle égal, la barre avance de
// moins en moins (la courbe du moteur, la même que la grille à moins d'un point près) ; à côté, le vrai
// panel OSU (E04) ralentit de la même façon. En pointillé : Citra 4 g/L ; en mots : la dose de Cascade (ou
// de Galaxy, d'Idaho 7) qu'il faudrait pour l'égaler, famille par famille, ou « jamais ».
// Usage : node generateur-y3.mjs  →  y3/etat.html
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Y from '../y1/socle/socle.mjs';
const { M, C, INC, ico, fr, esc, COUL, ETUDE, srcEtude } = Y;
const ici = path.dirname(fileURLToPath(import.meta.url));

const HS = ['Cascade', 'Citra', 'Galaxy', 'Idaho 7'];
const LEV = Y.LEVURES;
const e04 = ETUDE.E04.mesures;
const lin = e04.filter((m) => /linalol, part extraite/.test(m.compose || '')).map((m) => [m.dose_gL, m.valeur]);
const data = {
  g: Y.tranche(HS, ['dryPost', 'dryActive'], Y.DIMS.doses, [3], LEV.filter((l) => Y.DIMS.levures.includes(l))),
  doses: Y.DIMS.doses, levGrille: Y.DIMS.levures, couleurs: COUL,
  huile: Object.fromEntries(HS.map((h) => [h, Y.huilePlage(h)])),
  lin,
  bio: Y.BIO,
  alpha: Object.fromEntries(HS.map((h) => [h, Y.alpha(h)])),
};

const rC = Y.rapport('Citra', '4MMP', { baseCommune: true }), rK = Y.rapport('Cascade', '4MMP', { baseCommune: true }), rL = Y.rapport('Citra', 'linalol');
const voie = (h, n) => `<div class="vh" data-voie="${n}" data-role="ligne-houblon">${Y.nomH(h)}${Y.usage(h)}${Y.alpha(h)}<span class="q">${Y.huile(h)}</span></div>`;
// Le panel OSU, en vrai (E04, tableau 3, tranché par la recherche K) : Cascade à 0, 2, 3,86, 8 et 16 g/L,
// 24 h, sur 15 : les agrumes plafonnent dès 8 g/L (7,1 puis 7,0), l'herbacé/thé monte jusqu'au bout (10,4).
const serie = (re) => e04.filter((m) => re.test(m.descripteur || '')).map((m) => [m.dose_gL, m.valeur]);
const agr = serie(/^citrus/), herb = serie(/^herbal/);
const W = 168, H = 78, xO = (d) => 6 + (d / 16) * (W - 66), yO = (v) => H - 8 - (v / 15) * (H - 16);
const ligne = (s, coul, tiret) => `<polyline points="${s.map(([d, v]) => xO(d).toFixed(1) + ',' + yO(v).toFixed(1)).join(' ')}" fill="none" stroke="${coul}" stroke-width="1.6"${tiret ? ' stroke-dasharray="4 3"' : ''}/>${s.map(([d, v]) => `<circle cx="${xO(d).toFixed(1)}" cy="${yO(v).toFixed(1)}" r="3" fill="${tiret ? '#fff' : coul}" stroke="${coul}" stroke-width="1.5"/>`).join('')}`;
const fin = (s) => yO(s[s.length - 1][1]);
const osu = `<svg class="osu" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Panel OSU, Cascade, 24 h, sur 15 : agrumes ${agr.map(([d, v]) => fr(v) + ' à ' + fr(d, 2) + ' g/L').join(', ')} ; herbacé et thé ${herb.map(([d, v]) => fr(v)).join(', ')}">
  <line x1="6" y1="${H - 8}" x2="${xO(16)}" y2="${H - 8}" stroke="#c4c6ce" stroke-width="1"/>
  ${ligne(agr, Y.J.citrus.texte)}${ligne(herb, Y.J.herbal.texte, true)}
  <text x="${xO(16) + 6}" y="${fin(agr) + 8}" font-size="12" fill="${Y.J.citrus.texte}" style="color:${Y.J.citrus.texte}">agrumes</text>
  <text x="${xO(16) + 6}" y="${fin(herb) + 2}" font-size="12" fill="${Y.J.herbal.texte}" style="color:${Y.J.herbal.texte}">herbacé</text>
  <line id="osu-d" x1="6" y1="4" x2="6" y2="${H - 8}" stroke="#c2410c" stroke-width="2"/>
</svg>`;

const corps = `
  ${Y.tete('Quelle dose ?')}
  <section class="bloc sim" data-role="simulation" aria-label="Profil simulé selon la dose">
    <div class="bloc-h">${Y.tagSim()}<span class="t-dose" id="t-dose"></span></div>
    <div id="spec"></div>
    <div class="cle-l" aria-hidden="true"><span><i class="kl kl-b"></i>la molette, ~ simulé</span><span id="cle-g"><i class="kl kl-g"></i>Citra 4 g/L</span><span><i class="kl kl-f"></i>plage possible</span><span><i class="kl kl-a"></i>ma bière</span></div>
    <div class="eq" id="eq"></div>
  </section>
  <section class="bloc mol" aria-label="La molette de dose : tourne avec un doigt">
    <div class="mol-g">
      <div class="molette" id="molette" role="slider" tabindex="0" aria-label="Dose à cru, en g/L" aria-valuemin="0" aria-valuemax="16" aria-valuenow="4">
        <svg id="mol-svg" width="176" height="176" viewBox="0 0 176 176" aria-hidden="true"></svg>
        <div class="mol-c"><b id="mol-v">4</b><span>g/L</span><small id="mol-i"></small></div>
      </div>
      <div class="mol-d">
        <div class="gr"><span class="gr-t">le gramme de plus</span><b id="gain" data-nature="simule"></b><span class="src-l" id="gain-f"></span></div>
        <div class="gr"><span class="gr-t">charge d’huile</span><span id="charge"></span></div>
        <div class="gr osu-b"><span class="gr-t">panel OSU, Cascade</span>${osu}${M('agrumes 1,9 → 7,1 → 7,0 sur 15', srcEtude('E04') + ' · tableau 3 (lecture vérifiée par la recherche K)', { cls: 'osu-v' })}<span class="src-l">plafond dès 8 g/L ; l’herbacé monte jusqu’à 16 g/L</span></div>
      </div>
    </div>
    <div class="crans" role="group" aria-label="Doses de la grille">${[0, 1, 2, 4, 8, 16].map((d) => `<button class="chip" data-dose="${d}" data-role="reglage">${d} g/L</button>`).join('')}</div>
  </section>
  <section class="bloc" aria-label="Le houblon de la molette, l'ajout cumulé, la levure">
    <div class="hs-c" role="group" aria-label="Houblon de la molette">${HS.map((h, i) => `<button class="chip" data-h="${h}" data-role="reglage" aria-pressed="${i === 0}"><i class="hpt" style="--h:${COUL[h]}"></i>${h}</button>`).join('')}</div>
    <div class="rang"><button class="chip large" data-reglage="ajout-cumule" data-role="reglage" id="ens" aria-pressed="false">${ico('i-plus', 14)}Dans le même ajout que Citra 2 g/L</button></div>
    <div class="ajout" data-role="ajout" id="ajout" hidden></div>
    <div class="rang"><span class="seg mom" role="radiogroup" aria-label="Moment"><button role="radio" data-mom="dryPost" data-role="reglage" aria-checked="true">après</button><button role="radio" data-mom="dryActive" data-role="reglage" aria-checked="false">actif</button></span><span class="src-l">3 j de contact</span></div>
    <div class="lev" role="group" aria-label="Levure">${LEV.map((l, i) => `<button data-reglage="levure" data-role="reglage" data-lev="${l}" aria-pressed="${i === 0}">${l}</button>`).join('')}</div>
    <div class="bio" data-role="biotransformation" id="bio"></div>
  </section>
  <div class="voies" id="voies">${HS.map((h, i) => voie(h, i + 1)).join('')}</div>
  <section class="bloc" aria-label="Vraies valeurs : la force par gramme">
    <div class="bloc-h"><span>Même famille, pas la même force</span><span class="src-l">calculé · 4 g/L après 3 j · 4MMP sur la même base</span></div>
    <div class="plg-h">${Y.nomH('Citra', { couleur: false })}</div>${Y.plageLog({ ...rC, compose: '4MMP', fams: ['tropical', 'berries'], aria: 'Citra, 4MMP' })}
    <div class="plg-h">${Y.nomH('Cascade', { couleur: false })}</div>${Y.plageLog({ ...rK, compose: '4MMP', fams: ['tropical', 'berries'], aria: 'Cascade, 4MMP' })}
    <div class="plg-h">${Y.nomH('Citra', { couleur: false })}</div>${Y.plageLog({ ...rL, compose: 'linalol', fams: ['floral', 'citrus'], aria: 'Citra, linalol' })}
    <div class="fi-eb">${C('linalol', ['floral'])} part extraite, Cascade : ${M(lin.map(([d, v]) => v + ' % à ' + d + ' g/L').join(', '), srcEtude('E04') + ' · texte')} <span class="src-l">la saturation, mesurée</span></div>
    <div class="fi-eb">${INC('Citra contre Cascade à dose égale, en bière : aucune étude lue', 'comparatifs-dryhop.json')}</div>
  </section>
  ${Y.legende([Y.legendeSection('Molette', [['<i class="lx-mol"></i>', 'tourne : la dose, de 0 à 16 g/L'], ['<span class="ms">≈</span>', 'entre deux doses : courbe du moteur'], ['<i class="lx-osu"></i>', 'points : le vrai panel OSU (Cascade)'], ['<i class="lx lx-g"></i>', 'pointillé : Citra 4 g/L']])])}`;

const css = `
  .t-dose { font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 5px; flex-wrap: wrap; }
  .cle-l { display: flex; flex-wrap: wrap; gap: 2px 10px; font-size: 12px; color: var(--gris); }
  .cle-l span { display: inline-flex; align-items: center; gap: 4px; }
  .kl { display: inline-block; width: 14px; height: 9px; }
  .kl-b { background: linear-gradient(90deg, ${Y.J.floral.base} 0 33%, ${Y.J.citrus.base} 33% 66%, ${Y.J.tropical.base} 66%); border-radius: 0 2px 2px 0; } .kl-g { border: 1.5px dashed var(--encre); border-left: 0; height: 11px; }
  .kl-f { height: 1px; background: #6b6f7a; } .kl-a { width: 2px; height: 12px; background: var(--encre); }
  .eq { display: flex; flex-direction: column; gap: 2px; font-size: 13px; min-height: 86px; }
  .eq-l { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
  .eq-l b { font-family: var(--mono); font-weight: 600; } .eq-t { font-weight: 700; } .eq-l .jamais { color: var(--acc); font-weight: 700; }
  .mol { touch-action: none; }
  .mol-g { display: flex; gap: 10px; align-items: center; }
  .molette { position: relative; width: 176px; height: 176px; flex: none; touch-action: none; -webkit-user-select: none; user-select: none; border-radius: 50%; }
  .molette:focus-visible { outline: 2px solid var(--encre); outline-offset: 2px; }
  .mol-c { position: absolute; inset: 44px; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }
  .mol-c b { font: 700 28px/1 var(--mono); } .mol-c span { font-size: 13px; color: var(--gris); } .mol-c small { font-size: 12px; color: var(--gris); text-align: center; line-height: 1.15; min-height: 13px; display: flex; flex-direction: column; } .mol-h { font-weight: 700; color: var(--encre); }
  .mol-d { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
  .gr { display: flex; flex-direction: column; gap: 1px; font-size: 13px; }
  .gr-t { font-size: 12px; font-weight: 700; color: var(--gris); } .gr .src-l { display: inline-flex; align-items: center; gap: 4px; }
  .gr b { font: 700 16px var(--mono); } .gr b small { font: 400 12px var(--sans); color: var(--gris); }
  .osu { display: block; } .osu-v { white-space: normal; }
  .crans { display: flex; justify-content: space-between; gap: 4px; }
  .crans .chip { padding: 0 8px; } .crans .chip[aria-current="true"] { background: var(--encre); color: #fff; box-shadow: none; }
  .hs-c { display: flex; gap: 4px; flex-wrap: wrap; }
  .chip.large { width: 100%; justify-content: center; }
  .rang { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-height: 28px; }
  .seg.mom button { padding: 0 12px; }
  .ajout { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 13px; } .ajout[hidden] { display: none; }
  .plg-h { font-size: 13px; margin-top: 2px; } .plg-t small { font: 400 12px var(--sans); color: var(--gris); }
  .lx-mol { display: inline-block; width: 18px; height: 18px; border-radius: 50%; border: 3px solid var(--encre); }
  .lx-osu { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--encre); }`;

const script = `
const D = DONNEES;
const ETAT = { h: 'Cascade', d: 4, mom: 'dryPost', lev: 'US-05', ens: false };
const sp = new Spectre(document.getElementById('spec'), { crans: 7 });
const INCONNU = FAM.map(() => [0, 0, 0, 0]);
const levG = () => (D.levGrille.includes(ETAT.lev) ? ETAT.lev : ETAT.mom !== 'dryActive' ? 'US-05' : null);
const gr = (h, d, lv) => D.g[[h, ETAT.mom, d, 3, lv].join('|')];
// La dose en continu : la courbe du moteur depuis la dose 1 (centre) ; bas et haut entre deux doses de la grille.
function profD(h, d) {
  const lv = levG(); if (!lv) return null;
  if (d <= 0) return AVANT;
  if (D.doses.includes(d)) return gr(h, d, lv);
  const g1 = gr(h, 1, lv), ds = D.doses, hi = ds.find((x) => x >= d) || ds[ds.length - 1], lo = [...ds].reverse().find((x) => x <= d) || 0;
  const pl = lo === 0 ? AVANT : gr(h, lo, lv), ph = gr(h, hi, lv), t = hi === lo ? 0 : (d - lo) / (hi - lo);
  return FAM.map((f, i) => {
    if (inconnuP(g1[i])) return [0, 0, 0, 0];
    const av = AVANT[i][1], P = COURBE.P[f], K = COURBE.K[f], I1 = Math.max(0, g1[i][1] - av), x1 = K * I1 / (P - I1);
    const c = av + P * x1 * d / (x1 * d + K);
    return [Math.min(c, pl[i][0] + (ph[i][0] - pl[i][0]) * t), c, Math.max(c, pl[i][2] + (ph[i][2] - pl[i][2]) * t), Math.max(pl[i][3], ph[i][3])];
  });
}
// La dose qu'il faudrait au houblon de la molette pour égaler la cible, famille par famille (même courbe).
function egale(h, cible) {
  const g1 = profD(h, 1); if (!g1 || !cible) return [];
  return FAM.map((f, i) => ({ f, i, It: cible[i][1] - AVANT[i][1] })).filter((x) => x.It > 3).sort((a, b) => b.It - a.It).slice(0, 3).map(({ f, i, It }) => {
    const P = COURBE.P[f], K = COURBE.K[f], I1 = g1[i][1] - AVANT[i][1];
    if (inconnuP(g1[i]) || I1 <= 0.05) return { f, d: null, pourquoi: 'rien de simulé' };
    if (It >= P * 0.98) return { f, d: null, pourquoi: 'au-dessus de son plafond' };
    const x1 = K * I1 / (P - I1), d = (K * It / (P - It)) / x1;
    return d > 16 ? { f, d: null, pourquoi: 'même à 16 g/L' } : { f, d };
  });
}
// ---------- la molette : 300°, de 0 à 16 g/L ----------
const A0 = -150, A1 = 150, R = 72, CX = 88, CY = 88;
const ang = (d) => A0 + (d / 16) * (A1 - A0);
const pt = (a, r = R) => [CX + r * Math.sin(a * Math.PI / 180), CY - r * Math.cos(a * Math.PI / 180)];
const arc = (a, b, r = R) => { const [x0, y0] = pt(a, r), [x1, y1] = pt(b, r); return 'M' + x0.toFixed(1) + ',' + y0.toFixed(1) + 'A' + r + ',' + r + ' 0 ' + (b - a > 180 ? 1 : 0) + ' 1 ' + x1.toFixed(1) + ',' + y1.toFixed(1); };
function molette() {
  const d = ETAT.d, s = document.getElementById('mol-svg');
  const crans = [0, 1, 2, 4, 8, 16].map((v) => { const [x0, y0] = pt(ang(v), R + 10), [x1, y1] = pt(ang(v), R + 16), [xt, yt] = pt(ang(v), R - 18); return '<line x1="' + x0.toFixed(1) + '" y1="' + y0.toFixed(1) + '" x2="' + x1.toFixed(1) + '" y2="' + y1.toFixed(1) + '" stroke="#16161a" stroke-width="2"/><text x="' + xt.toFixed(1) + '" y="' + (yt + 4).toFixed(1) + '" text-anchor="middle" font-size="12" fill="#55555f" style="color:#55555f">' + v + '</text>'; }).join('');
  const [hx, hy] = pt(ang(d));
  s.innerHTML = '<path d="' + arc(A0, A1) + '" fill="none" stroke="#e3e5eb" stroke-width="14" stroke-linecap="round"/>' + (d > 0.05 ? '<path d="' + arc(A0, ang(d)) + '" fill="none" stroke="' + D.couleurs[ETAT.h] + '" stroke-width="14" stroke-linecap="round"/>' : '') + crans + '<circle cx="' + hx.toFixed(1) + '" cy="' + hy.toFixed(1) + '" r="14" fill="#fff" stroke="#16161a" stroke-width="3"/>';
  document.getElementById('molette').setAttribute('aria-valuenow', d.toFixed(1));
}
function rendre() {
  const h = ETAT.h, d = ETAT.d, cible = h === 'Citra' ? null : (D.levGrille.includes(ETAT.lev) || ETAT.mom !== 'dryActive' ? gr('Citra', 4, levG()) : null);
  let p = profD(h, d), parts = null;
  if (p && ETAT.ens && h !== 'Citra') { const c2 = profD('Citra', 2); parts = FAM.map((f, i) => [Math.max(0, c2[i][1] - AVANT[i][1]), Math.max(0, p[i][1] - AVANT[i][1])]); p = cumule([c2, p]); }
  sp.set({ p: p || INCONNU, ghost: cible, parts });
  const exact = D.doses.includes(d) || d === 0;
  document.getElementById('mol-v').textContent = (exact ? '' : '≈ ') + frn(d, d % 1 ? 1 : 0);
  document.getElementById('mol-i').innerHTML = '<span class="mol-h">' + h + '</span>' + (d > 8 ? 'au-delà de la grille' : exact ? '' : 'entre deux doses');
  document.getElementById('t-dose').innerHTML = (ETAT.ens && h !== 'Citra' ? '<span class="hn" data-houblon="Citra">Citra</span> 2 g/L + ' : '') + '<i class="hpt" style="--h:' + D.couleurs[h] + '"></i><span class="hn" data-houblon="' + h + '">' + h + '</span>' + D.alpha[h] + ' · ' + (ETAT.mom === 'dryPost' ? 'après' : 'actif') + ' · 3 j';
  document.getElementById('cle-g').hidden = !cible;
  molette();
  document.querySelectorAll('[data-dose]').forEach((b) => b.setAttribute('aria-current', String(+b.dataset.dose === d)));
  // le gramme de plus, pour la famille qui bouge le plus
  const p2 = profD(h, Math.min(16, d + 0.5));
  if (p && p2) {
    const best = FAM.map((f, i) => ({ f, i, g: (crans(i, p2[i][1]) - crans(i, p[i][1])) / 0.5 })).filter((x) => !inconnuP(p[x.i])).sort((a, b) => b.g - a.g)[0];
    document.getElementById('gain').innerHTML = '~+' + frn(best.g, 1) + ' <small>cran par g/L</small>';
    document.getElementById('gain-f').innerHTML = pictoH(best.f) + NOMF[best.f] + (d >= 8 ? ' · presque plus rien' : '');
  } else { document.getElementById('gain').textContent = 'inconnu'; document.getElementById('gain-f').textContent = ''; }
  const [hl, hh] = D.huile[h];
  document.getElementById('charge').innerHTML = '<span class="ms" data-nature="mesure" data-source="huile des fiches (composes-houblon.json) × dose : mL/100 g × g/L = mL/hL (H §7.4)">' + frn(hl * d, 1) + '–' + frn(hh * d, 1) + ' <small>mL/hL</small></span>';
  const xO = 6 + Math.min(16, d) / 16 * 102; const o = document.getElementById('osu-d'); o.setAttribute('x1', xO.toFixed(1)); o.setAttribute('x2', xO.toFixed(1));
  // ce qu'il faudrait pour égaler Citra 4 g/L
  const eq = document.getElementById('eq');
  if (!p) eq.innerHTML = '<span class="cq-0">' + ETAT.lev + ' en dry hop actif : pas dans la grille du moteur, inconnu.</span>';
  else if (ETAT.ens && h !== 'Citra') { const seul = profD(h, d); const e = FAM.map((f, i) => ({ f, i, s: seul[i][1] - AVANT[i][1], a: p[i][1] - profD('Citra', 2)[i][1] })).filter((x) => x.s > 3).sort((a, b) => b.s - a.s)[0]; eq.innerHTML = e ? '<span class="eq-l">' + pictoH(e.f) + h + ' ajoute <b data-nature="simule">~' + Math.round(100 * e.a / e.s) + ' %</b> de ce qu’il donne seul en ' + NOMF[e.f] + ' : la dose totale sature.</span>' : ''; }
  else if (!cible) eq.innerHTML = '<span class="cq-0">Citra sur la molette : comparez à Citra 4 g/L en revenant sur 4 g/L.</span>';
  else eq.innerHTML = '<span class="eq-l eq-t">Pour égaler Citra 4 g/L, il faudrait</span>' + egale(h, cible).map((x) => '<span class="eq-l">' + pictoH(x.f) + NOMF[x.f] + ' : ' + (x.d == null ? '<span class="jamais" data-nature="simule">~ jamais</span> <span class="src-l">' + x.pourquoi + '</span>' : '<b data-nature="simule">~' + frn(x.d, 1) + ' g/L</b> de ' + h) + '</span>').join('');
  const Bi = D.bio[ETAT.lev];
  document.getElementById('bio').innerHTML = '<span class="st">Biotransformation</span><span class="st' + (Bi.statut === 'documentée' ? ' doc' : '') + '">' + ETAT.lev + ' · ' + Bi.statut + '</span><span class="src-l">' + (ETAT.mom === 'dryActive' ? (D.levGrille.includes(ETAT.lev) ? 'en actif, comptée dans le profil' : 'en actif, pas dans la grille') : 'après : levure au repos, rien de compté') + '</span>';
  const aj = document.getElementById('ajout'); aj.hidden = !(ETAT.ens && h !== 'Citra');
  aj.innerHTML = '<span class="hn" data-houblon="Citra"><i class="hpt" style="--h:' + D.couleurs.Citra + '"></i>Citra</span> 2 g/L + <span class="hn" data-houblon="' + h + '"><i class="hpt" style="--h:' + D.couleurs[h] + '"></i>' + h + '</span> ' + frn(d, 1) + ' g/L <span class="src-l">même ajout, la dose totale compte</span>';
  document.querySelectorAll('[data-h]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.h === h)));
  document.querySelectorAll('[data-lev]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lev === ETAT.lev)));
  document.querySelectorAll('[data-mom]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mom === ETAT.mom)));
}
window.rendre = rendre;
// ---------- le geste : tourner ; crans sentis aux doses de la grille ----------
const mol = document.getElementById('molette');
let TOUR = null, A_PREC = null;
const angleDe = (e) => { const r = mol.getBoundingClientRect(); const x = e.clientX - r.left - CX, y = e.clientY - r.top - CY; return Math.atan2(x, -y) * 180 / Math.PI; };
function tourner(e) {
  let a = angleDe(e);
  if (A_PREC != null && Math.abs(a - A_PREC) > 180) a = A_PREC; // pas de saut par le bas de la molette
  A_PREC = a;
  let d = Math.max(0, Math.min(16, (a - A0) / (A1 - A0) * 16));
  const proche = [0, 1, 2, 4, 8, 16].find((v) => Math.abs(v - d) < 0.18);
  d = proche != null ? proche : Math.round(d * 10) / 10;
  if (d !== ETAT.d) { if (proche != null) { try { navigator.vibrate && navigator.vibrate(6); } catch (x) {} } ETAT.d = d; rendre(); }
}
mol.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; TOUR = e.pointerId; mol.setPointerCapture(e.pointerId); A_PREC = null; tourner(e); e.preventDefault(); });
mol.addEventListener('pointermove', (e) => { if (TOUR === e.pointerId) tourner(e); });
mol.addEventListener('pointerup', () => { TOUR = null; });
mol.addEventListener('keydown', (e) => { const k = { ArrowUp: 0.5, ArrowRight: 0.5, ArrowDown: -0.5, ArrowLeft: -0.5 }[e.key]; if (!k) return; e.preventDefault(); ETAT.d = Math.max(0, Math.min(16, ETAT.d + k)); rendre(); });
document.querySelectorAll('[data-dose]').forEach((b) => b.addEventListener('click', () => { ETAT.d = +b.dataset.dose; rendre(); }));
document.querySelectorAll('[data-h]').forEach((b) => b.addEventListener('click', () => { ETAT.h = b.dataset.h; rendre(); }));
document.querySelectorAll('[data-lev]').forEach((b) => b.addEventListener('click', () => { ETAT.lev = b.dataset.lev; rendre(); }));
document.querySelectorAll('[data-mom]').forEach((b) => b.addEventListener('click', () => { ETAT.mom = b.dataset.mom; rendre(); }));
document.getElementById('ens').addEventListener('click', (e) => { ETAT.ens = !ETAT.ens; e.currentTarget.setAttribute('aria-pressed', String(ETAT.ens)); rendre(); });
{ const q = new URLSearchParams(location.search); if (q.get('d')) ETAT.d = +q.get('d'); if (q.get('h')) ETAT.h = q.get('h'); }
rendre();
window.__releve = () => ({ houblon: ETAT.h, dose: document.getElementById('mol-v').textContent + ' g/L', gain: document.getElementById('gain').textContent + ' ' + document.getElementById('gain-f').innerText.trim(), egale: document.getElementById('eq').innerText.replace(/\\s+/g, ' ').trim(), crans: Object.fromEntries(sp.rows.map((c) => [c.dataset.famille, c.dataset.crans])), largeurs: Object.fromEntries(sp.rows.map((c) => [c.dataset.famille, Math.round(c.querySelector('.sp-b').getBoundingClientRect().width)])) });
`;

Y.ecrire(path.join(ici, 'etat.html'), Y.page({
  titre: 'La molette de dose',
  commentaire: 'Lot 21 · y3 : tourner la dose au doigt (0–16 g/L) ; la courbe du moteur (saturation) ; le vrai panel OSU (E04) ; ce qu’il faudrait de Cascade pour égaler Citra 4 g/L ; même ajout que Citra 2 g/L. Généré par generateur-y3.mjs (../y1/socle/socle.mjs).',
  css, corps, script, hs: HS, data,
}));
