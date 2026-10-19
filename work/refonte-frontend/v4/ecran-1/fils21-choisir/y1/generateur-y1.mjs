// Lot 21 · y1 « Le brassin au doigt » : on glisse l'ajout le long de la frise du brassin.
// Question du brasseur : « Pourquoi à 10′ pas à 60′ ? Aussi ? » (K1 : Citra contre Cascade, 4 g/L).
// Le geste EST la simulation : le doigt fait glisser l'ajout de 60′ (par pas de 5′) au whirlpool, au dry hop
// actif, au dry hop après ; une loupe ×3 au-dessus du doigt dit où l'on est ; les 12 familles suivent tout
// de suite (Citra plein, Cascade en pointillé, même dose), l'amertume aussi (Tinseth, α réel), et le
// « pourquoi » du moment, sourcé. Ensemble (2 + 2 g/L), levure et biotransformation sous la frise.
// Usage : node generateur-y1.mjs  →  y1/etat.html
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Y from './socle/socle.mjs';
const { M, S, C, INC, picto, ico, fr, esc, HOP, COUL, FAIT, ETUDE, srcEtude } = Y;
const ici = path.dirname(fileURLToPath(import.meta.url));

const LEV = Y.LEVURES;
const MOMS = ['b60', 'b10', 'wp', 'dryActive', 'dryPost'];
const data = {
  g: Y.tranche(['Citra', 'Cascade'], MOMS, [4, 2], [3], LEV),
  paires: Object.fromEntries(['dryActive', 'dryPost'].flatMap((m) => LEV.map((lv) => [m + '|' + lv, Y.paire('Citra', 'Cascade', m, lv)]))),
  // Verdant et Diamond ne sont pas dans la grille (US-05, Pomona) : en dry hop actif, la page dit « inconnu ».
  // La biotransformation chiffrée vient des cas K4 du moteur : Citra 2 g/L 3 j puis Idaho 7, actif.
  bio: Y.BIO,
  bioCas: Y.SIM.source === 'moteur' ? Object.fromEntries(LEV.map((lv) => { const b = Y.casBio('K4-' + lv.toLowerCase().replace('-', '') + '-actif'); const a = b && b.parAjout[0]; return [lv, a ? { cit: a.citronellol_ugL, thi: a.thiolsLiberes_ngL } : null]; })) : {},
  // IBU par g/L (Tinseth comme l'app ; whirlpool 85 °C, 20 min : × 2^((T − 100)/10)) ; α : Citra des fiches
  // (10–15 %, sans lot de pellets), Cascade du lot (6,5 %) ; Nugget du lot (13 %) pour la bière.
  ibu: {
    Citra: { lo: HOP.Citra.alpha.fiches[0], hi: HOP.Citra.alpha.fiches[1] },
    Cascade: { lo: HOP.Cascade.alpha.lot, hi: HOP.Cascade.alpha.lot },
  },
  ibuMin: Object.fromEntries([60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0].map((m) => [m, Y.ibuParGL(1, m)])),
  ibuWp: Y.ibuParGL(1, 0, { whirlpool: true, minutes: 20, T: 85 }),
  ibuBiere: Y.ibuParGL(HOP.Nugget.alpha.lot, 60) * 2.3,
  ibuStyle: FAIT.styles["16D"].ibu,
};

// ---------- les « pourquoi », vrais, sourcés ----------
const T = FAIT.transferts;
const pq = {
  b60: `À 60′, presque tout s’évapore : ${C('4MMP', ['tropical'])} ${M('−91 %', 'H13 · Kishimoto 2008 (revue) : 60 min à 100 °C')} ; ${C('linalol', ['floral'])} ${M('≈ 5 %', 'Brewing.it, relayé [S10], non validé', { cls: 'faible' })}. L’amertume, elle, reste.`,
  bmid: `Entre 60′ et 10′ : ${S('≈ interpolé')}, la grille du moteur n’a que 60′ et 10′.`,
  b10: `À 10′, une part reste : ${C('linalol', ['floral'])} ${M('60–63 %', 'H30 · Gahr 2019 (revue) : ajout tardif, fin d’ébullition ou whirlpool')} retrouvé en bière. Moins d’amertume qu’à 60′.`,
  bfin: `Fin d’ébullition : ${S('≈ interpolé')} entre 10′ et whirlpool.`,
  wp: `Whirlpool : ${C('linalol', ['floral'])} ${M('60–63 %', 'H30 · Gahr 2019 (revue)')} ; ${C('4MMP', ['tropical'])} ${M('−23 %', 'H13 · Kishimoto 2008 : à 90 °C, durée à confirmer')}${'<i class="av">à vérifier</i>'}. Peu d’amertume.`,
  dryActive: `Dry hop actif : le CO₂ emporte du ${C('myrcène', ['resin'])} (H33) ; la levure peut changer le ${C('géraniol', ['floral'])}. Pas d’IBU.`,
  dryPost: `Dry hop après : ${C('linalol', ['floral'])} ${M('80–82 %', 'H30 · Gahr 2019 (revue) : teneur analysée du houblon')} retrouvé ; l’essentiel en ${M('24 h', 'H73, H20 : protocoles OSU')}. Pas d’IBU.`,
};

// ---------- la plage énorme (rapport au seuil, moteur « pouvoir ») ----------
const rC = Y.rapport('Citra', 'linalol'), rK = Y.rapport('Cascade', 'linalol');
const enorme = `
  <section class="bloc" aria-label="Rapport au seuil, dry hop après 3 j, 4 g/L">
    <div class="bloc-h"><span>Linalol en bière, face à son seuil</span><span class="src-l">calculé · 4 g/L après 3 j</span></div>
    <div class="plg-h">${Y.nomH('Citra')}</div>${Y.plageLog({ ...rC, compose: 'linalol', fams: ['floral', 'citrus'], aria: 'Citra, linalol' })}
    <div class="plg-h">${Y.nomH('Cascade')}</div>${Y.plageLog({ ...rK, compose: 'linalol', fams: ['floral', 'citrus'], aria: 'Cascade, linalol' })}
    <p class="src-l">Plus de ×10 000 d’écart entre les bornes : seuils et transferts publiés très divergents (H §0.6).</p>
  </section>`;

// ---------- en bière : les comparatifs, et le trou ----------
const e06 = ETUDE.E06.mesures.find((m) => m.variete === 'Citra' && m.compose === 'linalol');
const e06t = ETUDE.E06.mesures.find((m) => /témoin/.test(m.variete) && m.compose === 'linalol');
const e07 = ETUDE.E07;
const linC = Y.mesureCas('K2-citra', (m) => m.type === 'compose' && m.compose === 'linalol');
const enBiere = `
  <section class="bloc" aria-label="Mesuré en bière">
    <div class="bloc-h"><span>Mesuré en bière</span></div>
    <div class="fi-eb">${C('linalol', ['floral', 'citrus'])} Citra ${M(fr(e06.valeur) + ' µg/L', srcEtude('E06') + ' · ' + e06.lecture)} <span class="src-l">témoin ${fr(e06t.valeur)} · dose non indiquée · E06</span></div>
    <div class="fi-eb">${C('linalol', ['floral', 'citrus'])} moteur, Citra 4 g/L : ${M(fr(linC.concentration.plage.min, 0) + '–' + fr(linC.concentration.plage.max, 0) + ' µg/L', 'moteur du pilote, cas K2-citra (mesures[]) : ' + Y.srcCles(linC.source))} <span class="src-l">centre ~${fr(linC.concentration.plage.central, 0)} : 2 à 5 fois la mesure</span></div>
    <div class="fi-eb">${INC('Citra contre Cascade à dose égale : aucune étude lue', 'comparatifs-dryhop.json')}</div>
    <div class="fi-eb"><span class="src-l">1,5 g/L à 60′, au whirlpool, en dry hop : l’herbacé suit l’ébullition (E07, ${esc(e07.niveau === 'P' ? 'revue' : 'poster')}, qualitatif).</span></div>
  </section>`;

const voie = (h, n) => `<div class="vh" data-voie="${n}" data-role="ligne-houblon">${Y.nomH(h)}${Y.usage(h)}${Y.alpha(h)}<span class="q">${Y.huile(h)}</span></div>`;

const corps = `
  ${Y.tete('À quel moment ?')}
  <section class="bloc sim" data-role="simulation" aria-label="Profil simulé selon le moment">
    <div class="bloc-h">${Y.tagSim()}<span class="cle">${Y.nomH('Citra', { couleur: false })} contre ${Y.nomH('Cascade', { couleur: false })}</span></div>
    <div id="spec"></div>
    <div class="cle-l" aria-hidden="true"><span><i class="kl kl-b"></i>Citra</span><span><i class="kl kl-g"></i>Cascade</span><span><i class="kl kl-f"></i>plage possible</span><span><i class="kl kl-a"></i>ma bière</span><span><i class="kl kl-z"></i>style 16D</span></div>
    <div class="cqs" id="cq1"></div>
    <div class="cqs" id="cq2"></div>
    <p class="note" id="note"></p>
  </section>
  <section class="bloc frise" aria-label="La frise du brassin : glisse l'ajout">
    <div class="fr-piste" id="piste">
      <p class="fr-cons" id="jeton-t"></p>
      <div class="loupe" id="loupe" hidden><b id="loupe-t"></b><span class="loupe-r" id="loupe-r"></span></div>
      <div class="fr-zones"><span class="fz eb">ébullition</span><span class="fz wp">whirlpool</span><span class="fz dh">dry hop</span></div>
      <i class="fr-rail"></i><span id="ticks"></span>
      <button class="jeton" id="jeton" role="slider" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="15" aria-valuenow="0" aria-valuetext="60 minutes"><i></i><i></i><i></i></button>
    </div>
    <div class="fr-arrets" id="arrets"></div>
    <div class="ibu" aria-label="Amertume calculée">
      <span class="ibu-t">IBU</span>
      <span class="ibu-e"><i class="ibu-z"></i><i class="ibu-b" id="ibu-b"></i><i class="ibu-c" id="ibu-c"></i><i class="ibu-k" id="ibu-k"></i></span>
      <span class="ibu-v" id="ibu-v"></span>
    </div>
    <p class="pq" id="pq"></p>
  </section>
  <div class="voies">${voie('Citra', 1)}${voie('Cascade', 2)}</div>
  <section class="bloc" aria-label="Ensemble, levure, biotransformation">
    <div class="rang"><button class="chip" data-reglage="ajout-cumule" data-role="reglage" id="ens" aria-pressed="false">${ico('i-plus', 14)}Ensemble, 2 + 2 g/L</button><span class="ajout" data-role="ajout" id="ajout" hidden>${Y.nomH('Citra', { couleur: false })}<b>+</b>${Y.nomH('Cascade', { couleur: false })}<span class="src-l">même ajout</span></span></div>
    <div class="lev" role="group" aria-label="Levure">${LEV.map((l, i) => `<button data-reglage="levure" data-role="reglage" data-lev="${l}" aria-pressed="${i === 0}">${l}</button>`).join('')}</div>
    <div class="bio" data-role="biotransformation" id="bio"></div>
  </section>
  ${enorme}
  ${enBiere}
  ${Y.legende([Y.legendeSection('Frise', [['<i class="lx-j"></i>', 'glisse : le moment de l’ajout'], ['<span class="ms">≈</span>', 'entre deux points : interpolé'], ['<i class="lx-ibu"></i>', 'IBU : zone du style 50–70'], ['<i class="lx lx-g"></i>', 'pointillé : Cascade']])])}`;

const css = `
  .sim .bloc-h { justify-content: flex-start; }
  .cle { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; }
  .k-p { width: 10px; height: 12px; background: var(--encre); border-radius: 2px 2px 0 0; }
  .k-g { width: 10px; height: 12px; border: 1.5px dashed var(--encre); border-bottom: 0; margin-left: 6px; }
  .frise { padding-top: 6px; touch-action: none; }
  .fr-piste { position: relative; height: 96px; margin: 0 6px; touch-action: none; -webkit-user-select: none; user-select: none; }
  .fr-zones { position: absolute; left: 0; right: 0; top: 52px; height: 18px; }
  .fz { position: absolute; top: 0; height: 18px; font-size: 12px; color: var(--gris); display: flex; align-items: center; justify-content: center; border-radius: 4px; }
  .fz.eb { left: 0; width: 51%; background: #fbebe4; color: #8a3a12; }
  .fz.wp { left: 53%; width: 17%; background: #eaf2fb; color: #2b4f7a; }
  .fz.dh { left: 72%; right: 0; background: #eaf6f0; color: #2a6249; }
  .fr-rail { position: absolute; left: 0; right: 0; top: 76px; height: 4px; border-radius: 2px; background: #c9cad2; }
  #ticks i { position: absolute; top: 72px; width: 2px; height: 12px; margin-left: -1px; background: #8a909b; border-radius: 1px; }
  #ticks i.cle { height: 16px; top: 70px; background: var(--encre); }
  .jeton { position: absolute; top: 62px; left: 0; transform: translateX(-50%); width: 32px; height: 32px; border-radius: 50%; background: var(--encre); display: inline-flex; align-items: center; justify-content: center; gap: 3px; box-shadow: 0 0 0 3px #fff, 0 4px 12px -4px rgba(22,22,26,.6); z-index: 3; touch-action: none; cursor: grab; }
  .jeton i { width: 2px; height: 12px; border-radius: 1px; background: #fff; }
  .fr-cons { position: absolute; left: 0; right: 0; top: 14px; font-size: 13px; text-align: center; } .fr-piste.tire .fr-cons { visibility: hidden; } .fr-cons b { font-family: var(--mono); font-weight: 600; }
  .jeton.tire { cursor: grabbing; box-shadow: 0 0 0 6px rgba(22,22,26,.14), 0 6px 16px -4px rgba(22,22,26,.7); }
  .loupe { position: absolute; top: -18px; width: 150px; margin-left: -75px; height: 70px; border-radius: 8px; background: #fff; box-shadow: 0 2px 4px rgba(22,22,26,.1), 0 10px 26px -10px rgba(22,22,26,.6); z-index: 4; display: flex; flex-direction: column; align-items: center; overflow: hidden; pointer-events: none; }
  .loupe[hidden] { display: none; }
  .loupe b { font: 700 22px/1.1 var(--mono); padding-top: 3px; }
  .loupe-r { position: relative; width: 150px; height: 34px; }
  .loupe-r i { position: absolute; top: 2px; width: 2px; height: 12px; margin-left: -1px; background: #8a909b; }
  .loupe-r i.ici { top: 0; height: 16px; width: 3px; background: var(--acc); }
  .loupe-r span { position: absolute; top: 18px; transform: translateX(-50%); font: 500 12px/1 var(--mono); color: var(--gris); white-space: nowrap; }
  .fr-arrets { display: flex; justify-content: space-between; gap: 2px; margin: 0 -2px; }
  .fr-arrets button { height: 28px; padding: 0 7px; border-radius: 14px; font-size: 12px; font-weight: 600; color: var(--gris); box-shadow: inset 0 0 0 1px #d4d6dd; background: #fff; white-space: nowrap; }
  .fr-arrets button[aria-current="true"] { background: var(--encre); color: #fff; box-shadow: none; }
  .ibu { display: flex; align-items: center; gap: 8px; min-height: 24px; }
  .ibu-t { font-size: 12px; font-weight: 700; color: var(--gris); width: 26px; }
  .ibu-e { position: relative; flex: 1; height: 14px; border-radius: 2px; background: #f1f2f5; }
  .ibu-z { position: absolute; top: 0; bottom: 0; left: calc(50 / 220 * 100%); width: calc(20 / 220 * 100%); background: rgba(22,22,26,.12); border-left: 1.5px solid var(--encre); border-right: 1.5px solid var(--encre); }
  .ibu-b { position: absolute; top: 3px; height: 8px; left: 0; background: #55555f; border-radius: 0 2px 2px 0; transition: width .09s linear; }
  .ibu-c { position: absolute; top: 3px; height: 8px; background: var(--encre); transition: left .09s linear, width .09s linear; }
  .ibu-c.ho { background: var(--acc); }
  .ibu-k { position: absolute; top: 1px; height: 12px; background: repeating-linear-gradient(90deg, rgba(22,22,26,.5) 0 2px, transparent 2px 4px); transition: left .09s linear, width .09s linear; }
  .ibu-v { font-size: 13px; text-align: right; white-space: nowrap; display: flex; flex-direction: column; align-items: flex-end; line-height: 1.15; } .ibu-v b { font: 600 13px var(--mono); } .ibu-h { font-size: 12px; font-weight: 600; } .ibu-h.n { font-weight: 400; color: var(--gris); }
  .ibu-v.ho { color: var(--acc); }
  .rang { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-height: 28px; }
  .ajout { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; }
  .ajout[hidden] { display: none; }
  .plg-h { font-size: 13px; margin-top: 2px; }
  .faible { color: var(--gris); font-weight: 400; }
  .lx-j { display: inline-block; width: 26px; height: 14px; border-radius: 7px; background: var(--encre); }
  .lx-ibu { display: inline-block; width: 26px; height: 10px; background: rgba(22,22,26,.12); border-left: 1.5px solid var(--encre); border-right: 1.5px solid var(--encre); }`;

const script = `
const D = DONNEES;
// Les arrêts : 60′ à 0′ par 5′, puis whirlpool, dry hop actif, dry hop après ; leur place sur la piste (0–1).
const ARRETS = [];
for (let m = 60; m >= 0; m -= 5) ARRETS.push({ id: 'b' + m, min: m, x: (60 - m) / 60 * 0.48, t: m + '′', court: m === 60 || m === 10 ? m + '′' : '' });
ARRETS.push({ id: 'wp', x: 0.615, t: 'whirlpool', court: 'whirlpool' }, { id: 'dryActive', x: 0.8, t: 'dry hop actif', court: 'actif' }, { id: 'dryPost', x: 0.93, t: 'dry hop après', court: 'après' });
const ETAT = { k: 0, lev: 'US-05', ens: false };
const DANS_GRILLE = ['US-05', 'Pomona'];
// La levure n'agit, dans le moteur, qu'en dry hop actif (regle[]) : ailleurs, le profil d'une levure hors de
// la grille est celui d'US-05, et la page le dit ; en actif, elle reste inconnue.
function g(h, m, d, lv) {
  const k = (l) => [h, m, d, m.startsWith('dry') ? 3 : '', l].join('|');
  if (D.g[k(lv)]) return { p: D.g[k(lv)] };
  if (m !== 'dryActive' && D.g[k('US-05')]) return { p: D.g[k('US-05')], regle: true };
  return null;
}
function profil(h, a, d, lv) {
  if (a.min === undefined) return g(h, a.id, d, lv);
  const [m0, m1, t] = a.min >= 10 ? ['b60', 'b10', (60 - a.min) / 50] : ['b10', 'wp', (10 - a.min) / 10];
  const x = g(h, m0, d, lv), y = g(h, m1, d, lv);
  return x && y ? { p: lerpP(x.p, y.p, t), regle: x.regle || y.regle } : null;
}
const interpole = (a) => a.min !== undefined && a.min !== 60 && a.min !== 10;
const sp = new Spectre(document.getElementById('spec'), { crans: 7 });
const piste = document.getElementById('piste'), jeton = document.getElementById('jeton');
document.getElementById('ticks').innerHTML = ARRETS.map((a) => '<i class="' + (a.court ? 'cle' : '') + '" style="left:' + (a.x * 100) + '%"></i>').join('');
const ARR_B = ARRETS.map((a, k) => [a, k]).filter(([a]) => a.court);
document.getElementById('arrets').innerHTML = ARR_B.map(([a, k]) => '<button data-role="reglage" data-k="' + k + '">' + a.court + '</button>').join('');
const ibuDe = (h, a, dose) => { const r = D.ibu[h]; const u = a.min !== undefined ? D.ibuMin[a.min] : a.id === 'wp' ? D.ibuWp : 0; return [r.lo * u * dose, r.hi * u * dose]; };
const INCONNU = FAM.map(() => [0, 0, 0, 0]);
const plage = (o, u) => (o ? '<b data-nature="simule">~' + frn(o.centre) + ' ' + u + '</b> <span class="src-l">[' + frn(o.bas) + '–' + frn(o.haut) + ']</span>' : '');
function rendre() {
  const a = ARRETS[ETAT.k], lv = ETAT.lev;
  let A, B, parts = null, note = '';
  if (ETAT.ens) {
    const pr = a.id.startsWith('dry') ? (D.paires[a.id + '|' + lv] || (a.id === 'dryPost' ? D.paires[a.id + '|US-05'] : null)) : null;
    const c2 = profil('Citra', a, 2, lv), k2 = profil('Cascade', a, 2, lv);
    if (pr) { A = { p: pr.profil }; parts = pr.parts; }
    else if (c2 && k2) { A = { p: cumule([c2.p, k2.p]), regle: c2.regle }; parts = FAM.map((f, i) => [Math.max(0, c2.p[i][1] - AVANT[i][1]), Math.max(0, k2.p[i][1] - AVANT[i][1])]); note = '≈ cumul calculé ici avec la courbe du moteur (pas de paire à ce moment). '; }
    B = profil('Citra', a, 4, lv);
  } else { A = profil('Citra', a, 4, lv); B = profil('Cascade', a, 4, lv); }
  if (a.id === 'b60') note += '~ À 60′ : « surtout de l’amertume à ce moment » (drapeau du moteur, cas K1). ';
  if ((A && A.regle) || (B && B.regle)) note += lv + ' : même profil qu’US-05 ici, le moteur ne fait agir la levure qu’en dry hop actif. ';
  if (!A) note += lv + ' en dry hop actif : pas dans la grille du moteur pour ce choix. ';
  else if (!B) note += (ETAT.ens ? 'Citra seul' : 'Cascade') + ' avec ' + lv + ' en actif : pas dans la grille. ';
  sp.set({ p: A ? A.p : INCONNU, ghost: B ? B.p : null, parts });
  const lab = (interpole(a) ? '≈ ' : '') + a.t;
  document.getElementById('cq1').innerHTML = '<span class="cq-l">' + (ETAT.ens ? 'Ensemble' : 'Citra') + '</span>' + (A ? phraseEcarts(sp, 2) : '<span class="cq-0">inconnu</span>');
  const sp2 = { s: { p: B ? B.p : INCONNU }, ecarts: Spectre.prototype.ecarts };
  document.getElementById('cq2').innerHTML = '<span class="cq-l g">' + (ETAT.ens ? 'Citra seul' : 'Cascade') + '</span>' + (B ? phraseEcarts(sp2, 2) : '<span class="cq-0">inconnu</span>');
  document.getElementById('note').textContent = note + (interpole(a) ? 'Entre deux points de la grille : interpolé (≈).' : '');
  // la frise
  if (!TIRE) jeton.style.left = (a.x * 100) + '%';
  jeton.setAttribute('aria-valuenow', ETAT.k); jeton.setAttribute('aria-valuetext', lab);
  document.getElementById('jeton-t').innerHTML = ETAT.ens ? 'Glisse l’ajout · ensemble <b>2 + 2</b> g/L' : 'Glisse l’ajout · <b>4</b> g/L chacun';
  document.querySelectorAll('#arrets button').forEach((b) => b.setAttribute('aria-current', String(+b.dataset.k === ETAT.k)));
  // l'amertume : la bière (Nugget), puis l'ajout (la plage de l'α des fiches pour Citra)
  const W = 220, base = D.ibuBiere, [lo, hi] = ETAT.ens ? [ibuDe('Citra', a, 2)[0] + ibuDe('Cascade', a, 2)[0], ibuDe('Citra', a, 2)[1] + ibuDe('Cascade', a, 2)[1]] : ibuDe('Citra', a, 4);
  const pc = (v) => Math.min(100, v / W * 100) + '%', hs = base + lo > D.ibuStyle[1];
  document.getElementById('ibu-b').style.width = pc(base);
  const c = document.getElementById('ibu-c'); c.style.left = pc(base); c.style.width = pc(lo); c.classList.toggle('ho', hs);
  const k = document.getElementById('ibu-k'); k.style.left = pc(base + lo); k.style.width = pc(hi - lo);
  const t = lo + hi > 0.5 ? '≈ <b>' + Math.round(base + lo) + (hi - lo >= 1 ? '–' + Math.round(base + hi) : '') + '</b> IBU' : '≈ <b>' + Math.round(base) + '</b> IBU';
  const v = document.getElementById('ibu-v'); v.innerHTML = '<span data-nature="simule">' + t + '</span>' + (hs ? '<span class="ibu-h">hors du style</span>' : lo + hi > 0.5 ? '' : '<span class="ibu-h n">rien de plus</span>'); v.classList.toggle('ho', hs);
  document.getElementById('pq').innerHTML = PQ[a.id] || (a.min > 10 ? PQ.bmid : PQ.bfin);
  // la biotransformation : selon la levure et le moment (règle du moteur : dry hop actif seulement)
  const Bi = D.bio[lv], bc = D.bioCas[lv];
  // Ce que la levure choisie fait en dry hop actif (cas K4 : Citra 2 g/L puis Idaho 7) se voit toujours ; ici, à ce moment, ce qui compte.
  let bio = '<span class="st">Biotransformation</span><span class="st' + (Bi.statut === 'documentée' ? ' doc' : '') + '">' + lv + ' · ' + Bi.statut + '</span>' + (bc ? (lv === 'Pomona' || lv === 'US-05' ? '<span>cas K4, Citra 2 g/L actif : ' + pictoH('citrus') + 'citronellol ' + plage(bc.cit, 'µg/L') + '</span>' : '<span>cas K4, Citra 2 g/L actif : ' + pictoH('tropical') + 'thiols libérés ' + plage(bc.thi, 'ng/L') + '</span>') : '') + '';
  document.getElementById('bio').setAttribute('aria-label', 'Biotransformation, ' + lv + ' : ' + Bi.texte);
  bio += '<span class="src-l ici">' + (a.id === 'dryActive' ? 'ici : elle agit' : a.id === 'dryPost' ? 'ici : levure au repos, hop creep possible' : 'ici : rien à chaud') + '</span>';
  document.getElementById('bio').innerHTML = bio;
  document.getElementById('ajout').hidden = !ETAT.ens;
}
window.rendre = rendre;
const PQ = ${JSON.stringify(pq)};
// ---------- le geste : glisser l'ajout ; la loupe ×3 au-dessus du doigt ----------
let TIRE = null;
const plus_proche = (u) => ARRETS.reduce((b, a, k) => (Math.abs(a.x - u) < Math.abs(ARRETS[b].x - u) ? k : b), 0);
function loupe(u) {
  const L = document.getElementById('loupe'), a = ARRETS[ETAT.k], Wp = piste.clientWidth;
  L.hidden = false; L.style.left = Math.max(75, Math.min(Wp - 75, u * Wp)) + 'px';
  document.getElementById('loupe-t').textContent = (interpole(a) ? '≈ ' : '') + a.t;
  // la règle de la frise, grossie trois fois autour du doigt
  const Z = 3, r = document.getElementById('loupe-r');
  r.innerHTML = ARRETS.map((b) => { const x = 75 + (b.x - u) * Wp * Z; if (x < -10 || x > 160) return ''; const lab = b.min !== undefined ? (b.min % 10 === 0 ? b.min + '′' : '') : b.court; return '<i class="' + (b === a ? 'ici' : '') + '" style="left:' + x.toFixed(1) + 'px"></i>' + (lab ? '<span style="left:' + x.toFixed(1) + 'px">' + lab + '</span>' : ''); }).join('');
}
function suivre(e) {
  const r = piste.getBoundingClientRect(), u = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  jeton.style.left = (u * 100) + '%';
  const k = plus_proche(u);
  if (k !== ETAT.k) { ETAT.k = k; try { navigator.vibrate && navigator.vibrate(4); } catch (x) {} rendre(); }
  loupe(u);
}
piste.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  TIRE = e.pointerId; piste.setPointerCapture(e.pointerId); jeton.classList.add('tire'); piste.classList.add('tire'); suivre(e); e.preventDefault();
});
piste.addEventListener('pointermove', (e) => { if (TIRE === e.pointerId) suivre(e); });
const lacher = (e) => { if (TIRE !== e.pointerId) return; TIRE = null; jeton.classList.remove('tire'); piste.classList.remove('tire'); document.getElementById('loupe').hidden = true; rendre(); };
piste.addEventListener('pointerup', lacher); piste.addEventListener('pointercancel', lacher);
jeton.addEventListener('keydown', (e) => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return; e.preventDefault(); ETAT.k = Math.max(0, Math.min(ARRETS.length - 1, ETAT.k + d)); rendre(); });
document.getElementById('arrets').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; ETAT.k = +b.dataset.k; rendre(); });
document.querySelectorAll('[data-lev]').forEach((b) => b.addEventListener('click', () => { ETAT.lev = b.dataset.lev; document.querySelectorAll('[data-lev]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); rendre(); }));
document.getElementById('ens').addEventListener('click', (e) => { ETAT.ens = !ETAT.ens; e.currentTarget.setAttribute('aria-pressed', String(ETAT.ens)); rendre(); });
{ const q = new URLSearchParams(location.search); if (q.get('k')) ETAT.k = +q.get('k'); if (q.get('lev')) { const b = document.querySelector('[data-lev="' + q.get('lev') + '"]'); if (b) b.click(); } if (q.has('ens')) document.getElementById('ens').click(); }
rendre();
// Pour la preuve du geste (jouer-y1.mjs) : les valeurs lues à l'écran.
window.__releve = () => ({ moment: ARRETS[ETAT.k].t, levure: ETAT.lev, ensemble: ETAT.ens, ibu: document.getElementById('ibu-v').textContent.trim(), citra: document.getElementById('cq1').innerText.replace(/\\s+/g, ' ').trim(), cascade: document.getElementById('cq2').innerText.replace(/\\s+/g, ' ').trim(), crans: Object.fromEntries(sp.rows.map((c) => [c.dataset.famille, c.dataset.crans])), largeurs: Object.fromEntries(sp.rows.map((c) => [c.dataset.famille, Math.round(c.querySelector('.sp-b').getBoundingClientRect().width)])) });
`;

Y.ecrire(path.join(ici, 'etat.html'), Y.page({
  titre: 'Le brassin au doigt',
  commentaire: 'Lot 21 · y1 : glisser l’ajout le long de la frise du brassin (60′ par 5′, whirlpool, dry hop actif, après) ; loupe ×3 ; Citra plein, Cascade en pointillé, même dose ; IBU Tinseth ; pourquoi sourcé ; ensemble, levure, biotransformation. Généré par generateur-y1.mjs (socle/socle.mjs).',
  css: css + `.cq-l { font-size: 12px; font-weight: 700; color: var(--encre); min-width: 60px; } .cq-l.g { color: var(--gris); }
  .note { font-size: 12px; color: var(--gris); min-height: 32px; }
  .cle-l { display: flex; flex-wrap: wrap; gap: 2px 10px; font-size: 12px; color: var(--gris); }
  .cle-l span { display: inline-flex; align-items: center; gap: 4px; }
  .kl { display: inline-block; width: 14px; height: 9px; }
  .kl-b { background: linear-gradient(90deg, ${Y.J.floral.base} 0 33%, ${Y.J.citrus.base} 33% 66%, ${Y.J.tropical.base} 66%); border-radius: 0 2px 2px 0; } .kl-g { border: 1.5px dashed var(--encre); border-left: 0; height: 11px; }
  .kl-f { height: 1.5px; background: #3d3d44; } .kl-a { width: 2px; height: 12px; background: var(--encre); }
  .kl-z { background: ${Y.T.rgba(Y.J.citrus.base, 0.24)}; border-right: 1.5px solid ${Y.J.citrus.texte}; }
  
  .plg-t small { font: 400 12px var(--sans); color: var(--gris); }`,
  corps, script, hs: ['Citra', 'Cascade'], data,
}));
