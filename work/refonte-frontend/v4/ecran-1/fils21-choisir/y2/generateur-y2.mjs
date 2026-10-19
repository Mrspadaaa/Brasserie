// Lot 21 · y2 « La cuve, jour par jour » : on maintient le doigt, les jours de contact passent.
// Questions du brasseur : « voir ce que ça change si je fais du dryhop de citra, Galaxy, idao7. Et
// combinaison de 3j dryhopping Citra, 7j dry hopping Galaxy ; 3j citra - 5j idao7 […] C'est extrêmement
// complexe à voir ce qui est vraiment faisable » (K2, K3, K5).
// Le geste EST la simulation : tant que le doigt reste sur la cuve, un jour passe toutes les 0,35 s ; les
// 12 familles montent… puis s'arrêtent : le moteur ne compte plus rien après 3 j (H73), et la page le dit.
// Le calendrier de la cuve montre le plan (actif ou après, un houblon, deux à la suite, deux ensemble) ;
// on peut aussi y glisser le doigt pour remonter le temps.
// Usage : node generateur-y2.mjs  →  y2/etat.html
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Y from '../y1/socle/socle.mjs';
const { M, S, C, INC, ico, fr, esc, COUL, FAIT, ETUDE, srcEtude } = Y;
const ici = path.dirname(fileURLToPath(import.meta.url));

const LEV = Y.LEVURES;
const LVC = { 'US-05': 'us05', Pomona: 'pomona', Verdant: 'verdant', Diamond: 'diamond' };
const PLANS = [
  { id: 'citra', t: 'Citra', hs: ['Citra'], type: 'seul', doses: [4], jours: [3], cas: 'K2-citra' },
  { id: 'galaxy', t: 'Galaxy', hs: ['Galaxy'], type: 'seul', doses: [4], jours: [3], cas: 'K2-galaxy' },
  { id: 'idaho', t: 'Idaho 7', hs: ['Idaho 7'], type: 'seul', doses: [4], jours: [3], cas: 'K2-idaho-7' },
  { id: 'c3g7', t: 'Citra 3 j puis Galaxy 7 j', hs: ['Citra', 'Galaxy'], type: 'suite', doses: [2, 2], jours: [3, 7], cas: 'K3-citra3-galaxy7' },
  { id: 'c3i5', t: 'Citra 3 j puis Idaho 7 5 j', hs: ['Citra', 'Idaho 7'], type: 'suite', doses: [2, 2], jours: [3, 5], cas: 'K3-citra3-idaho7-5', k4: true },
  { id: 'cg', t: 'Citra + Galaxy ensemble', hs: ['Citra', 'Galaxy'], type: 'ensemble', doses: [2, 2], jours: [3, 3] },
];
const MOMS = { dryPost: { t: 'après', debut: 7 }, dryActive: { t: 'actif', debut: 2 } };
const NJ = 11; // J0 (le jour de l'ajout) à J+10
const clampJ = (d) => (d <= 0 ? 0 : d >= 3 ? 3 : d);
// Les jours d'un plan, pour un moment et une levure : le moteur (parJour des cas) d'abord ; sinon la grille
// (jours 1, 2, 3 ; la part extraite est plafonnée à 3 j) ; une suite hors des cas : la grille et la
// saturation partagée calculée ici avec la courbe du moteur ; ce qui manque : null (inconnu).
function joursDe(P, m, lv) {
  // K4 du moteur : Citra 2 g/L 3 j puis Idaho 7 2 g/L 5 j, pour les quatre levures, actif ou après.
  const casId = P.type === 'ensemble' ? 'K5-citra+galaxy-' + (m === 'dryActive' ? 'actif' : 'apres') + '-' + LVC[lv] : P.k4 ? 'K4-' + LVC[lv] + '-' + (m === 'dryActive' ? 'actif' : 'apres') : m === 'dryPost' && lv === 'US-05' ? P.cas : null;
  if (casId && Y.casDe(casId) && (Y.casDe(casId).parJour || []).length >= NJ) {
    const c = Y.casDe(casId);
    return { src: 'moteur, cas ' + casId, jours: Y.casParJour(casId).slice(0, NJ).map((j) => j.p), saturation: c.saturation && c.saturation.facteur ? c.saturation.facteur : null };
  }
  const g = (h, d, j) => (j === 0 ? Y.FAM.map((f) => Y.SIM.avant[f]) : Y.aGrille(h, m, d, j, lv) ? Y.grille(h, m, d, j, lv) : null);
  if (P.type === 'seul') {
    const js = Array.from({ length: NJ }, (_, d) => g(P.hs[0], 4, clampJ(d)));
    return js.every(Boolean) ? { src: 'moteur, grille', jours: js } : null;
  }
  if (P.type === 'suite') {
    const js = Array.from({ length: NJ }, (_, d) => { const a = g(P.hs[0], 2, clampJ(d)); if (d <= 3) return a; const b = g(P.hs[1], 2, clampJ(d - 3)); return a && b ? Y.cumuleN([a, b]) : null; });
    return js.every(Boolean) ? { src: 'grille du moteur, suite calculée ici (saturation partagée)', jours: js, calcule: true } : null;
  }
  return null;
}
const data = {
  plans: PLANS.map((P) => ({ id: P.id, t: P.t, hs: P.hs, type: P.type, doses: P.doses, jours: P.jours })),
  sim: Object.fromEntries(PLANS.flatMap((P) => Object.keys(MOMS).flatMap((m) => LEV.map((lv) => [P.id + '|' + m + '|' + lv, joursDe(P, m, lv)])))),
  moms: MOMS, couleurs: COUL, bio: Y.BIO,
  hop: Object.fromEntries(['Citra', 'Galaxy', 'Idaho 7'].map((h) => [h, '<span class="ph-h">' + Y.nomH(h, { couleur: false }) + Y.alpha(h) + '</span>'])),
  // le repère mesuré du jour lu, sous la cuve : il change avec le geste
  reperes: [
    [0, 1, `${M('24 h', 'H73, H20 · ' + FAIT.duree.essentiel24h.texte)} l’essentiel est extrait (OSU) ; ${M('1 h = 96 h', srcEtude('E10') + ' · texte')} au panel (Cascade 1,43 g/L)`],
    [2, 2, `${M('2 j', srcEtude('E08') + ' · texte')} ${C('4MMP', ['tropical'])} et ${C('linalol', ['floral'])} passent surtout les 2 premiers jours (Eureka!)`],
    [3, 99, `${M('> 3 j', 'H73 · ' + FAIT.duree.auDela.texte)} aucun gain d’arôme mesuré en statique`],
  ],
  bioCas: Object.fromEntries(LEV.map((lv) => { const b = Y.casBio('K4-' + LVC[lv] + '-actif'); const a = b && b.parAjout[0]; return [lv, a ? { cit: a.citronellol_ugL, thi: a.thiolsLiberes_ngL } : null]; })),
};

// ---------- les vraies valeurs sur le temps de contact ----------
const D = FAIT.duree;
const e10 = ETUDE.E10, e08 = ETUDE.E08, e05 = ETUDE.E05;
const e05p = e05.mesures.find((m) => /pastilles, passif/.test(m.variete) && /linalol/.test(m.compose));
const e05a = e05.mesures.find((m) => /pastilles, agité/.test(m.variete) && /linalol/.test(m.compose));
const temps = `
  <section class="bloc" aria-label="Le temps de contact, mesuré">
    <div class="bloc-h"><span>Le temps, mesuré en bière</span></div>
    <div class="fait">${M('24 h', 'H73, H20 · ' + D.essentiel24h.texte)}<span>l’essentiel est extrait (protocoles OSU)</span></div>
    <div class="fait">${M('2 j', srcEtude('E08') + ' · ' + e08.mesures[0].lecture)}<span>${C('4MMP', ['tropical'])} et ${C('linalol', ['floral'])} passent surtout les 2 premiers jours (Eureka!, −1 °C)</span></div>
    <div class="fait">${M('1 h = 96 h', srcEtude('E10') + ' · texte')}<span>au panel : Cascade 1,43 g/L, bière jeune, rien de distinguable</span></div>
    <div class="fait">${M('> 3 j', 'H73 · ' + D.auDela.texte)}<span>aucun gain d’arôme mesuré en statique</span></div>
    <div class="fait">${M(fr(parseFloat(e05p.valeur), 0) + ' % → ' + fr(parseFloat(e05a.valeur), 0) + ' %', srcEtude('E05') + ' · ' + e05a.lecture)}<span>${C('linalol', ['floral'])} extrait en 6 h, au repos puis agité : l’agitation compte plus que les jours</span></div>
  </section>`;

const rP = Y.rapport('Citra', 'linalol');
const enorme = `
  <section class="bloc" aria-label="Rapport au seuil">
    <div class="bloc-h"><span>Linalol de Citra, face à son seuil</span><span class="src-l">calculé · 4 g/L après 3 j</span></div>
    ${Y.plageLog({ ...rP, compose: 'linalol', fams: ['floral', 'citrus'], aria: 'Citra, linalol' })}
  </section>`;

const voie = (h, n) => `<div class="vh" data-voie="${n}" data-role="ligne-houblon">${Y.nomH(h)}${Y.usage(h)}${Y.alpha(h)}<span class="q">${Y.huile(h)}</span></div>`;

const corps = `
  ${Y.tete('Jour par jour')}
  <section class="bloc sim" data-role="simulation" aria-label="Profil simulé, jour par jour">
    <div class="bloc-h">${Y.tagSim()}<span class="plan-t" id="plan-t"></span></div>
    <div class="jour"><b class="j-n" id="j-n" data-nature="simule">J0</b><span class="j-l" id="j-l"></span></div>
    <div id="spec"></div>
    <div class="cle-l" aria-hidden="true"><span><i class="kl kl-b"></i>ce jour, ~ simulé</span><span><i class="kl kl-g"></i>fin du plan</span><span><i class="kl kl-f"></i>plage possible</span><span><i class="kl kl-a"></i>ma bière</span></div>
    <div class="cqs" id="cq1"></div>
    <p class="plat" id="plat"></p>
  </section>
  <section class="bloc cuve" aria-label="La cuve : maintiens pour faire passer les jours">
    <div class="cal" id="cal" aria-label="Calendrier de la cuve, glisse pour changer de jour">
      <div class="cal-ph"><span class="ph fa" id="ph-fa">fermentation active</span><span class="ph ap" id="ph-ap">après fermentation</span></div>
      <div class="cal-b" id="cal-b"></div>
      <div class="cal-r" id="cal-r"></div>
      <i class="cal-c" id="cal-c"></i>
    </div>
    <p class="rep-j" id="rep-j"></p>
    <div class="tenir">
      <button class="cuve-b" id="tenir" data-role="reglage" aria-label="Maintiens pour faire passer les jours ; un toucher : un jour de plus">${ico('j-cuve-a', 22)}<span>Maintiens</span></button>
      <span class="tenir-t" id="tenir-t">un jour toutes les 0,35 s · un toucher : +1 jour</span>
      <button class="chip" id="j0" data-role="reglage">J0</button>
    </div>
  </section>
  <section class="bloc" aria-label="Le plan, le moment, la levure">
    <div class="plans" role="group" aria-label="Plan de dry hop">${PLANS.map((P, i) => `<button class="plan${P.type === 'ensemble' ? ' large' : P.type === 'suite' ? ' suite' : ''}" data-plan="${P.id}" data-role="reglage"${P.type === 'ensemble' ? ' data-reglage="ajout-cumule"' : ''} aria-pressed="${i === 0}">${P.hs.map((h) => `<i class="hpt" style="--h:${COUL[h]}"></i>`).join('')}${esc(P.t)}<small>${P.doses.join(' + ')} g/L</small></button>`).join('')}</div>
    <div class="rang"><span class="seg mom" role="radiogroup" aria-label="Moment du dry hop">${Object.entries(MOMS).map(([m, x], i) => `<button role="radio" data-mom="${m}" data-role="reglage" aria-checked="${i === 0}">${x.t}</button>`).join('')}</span><span class="ajout" data-role="ajout" id="ajout" hidden></span></div>
    <div class="lev" role="group" aria-label="Levure">${LEV.map((l, i) => `<button data-reglage="levure" data-role="reglage" data-lev="${l}" aria-pressed="${i === 0}">${l}</button>`).join('')}</div>
    <div class="bio" data-role="biotransformation" id="bio"></div>
  </section>
  <div class="voies" id="voies">${['Citra', 'Galaxy', 'Idaho 7'].map((h, i) => voie(h, i + 1)).join('')}</div>
  ${temps}
  ${enorme}
  ${Y.legende([Y.legendeSection('La cuve', [['<i class="lx-cuve"></i>', 'maintiens : les jours passent'], ['<i class="lx-bloc"></i>', 'un ajout et ses jours de contact'], ['<i class="lx-cur"></i>', 'le jour lu'], ['<span class="ms">J+3</span>', 'jours depuis le premier ajout']])])}`;

const css = `
  .plan-t { font-size: 13px; font-weight: 600; display: inline-flex; flex-wrap: wrap; align-items: center; gap: 2px 6px; }
  .ph-h { display: inline-flex; align-items: center; gap: 5px; }
  .rep-j { font-size: 13px; line-height: 1.35; min-height: 36px; }
  .jour { display: flex; align-items: baseline; gap: 8px; }
  .j-n { font: 700 28px/1 var(--mono); }
  .j-l { font-size: 13px; color: var(--gris); }
  .plat { font-size: 13px; font-weight: 600; color: var(--encre); min-height: 36px; }
  .plat .src-l { font-weight: 400; }
  .cle-l { display: flex; flex-wrap: wrap; gap: 2px 10px; font-size: 12px; color: var(--gris); }
  .cle-l span { display: inline-flex; align-items: center; gap: 4px; }
  .kl { display: inline-block; width: 14px; height: 9px; }
  .kl-b { background: linear-gradient(90deg, ${Y.J.floral.base} 0 33%, ${Y.J.citrus.base} 33% 66%, ${Y.J.tropical.base} 66%); border-radius: 0 2px 2px 0; } .kl-g { border: 1.5px dashed var(--encre); border-left: 0; height: 11px; }
  .kl-f { height: 1px; background: #6b6f7a; } .kl-a { width: 2px; height: 12px; background: var(--encre); }
  .cq-l { font-size: 12px; font-weight: 700; min-width: 70px; }
  .cuve { touch-action: none; }
  .cal { position: relative; height: 92px; touch-action: none; -webkit-user-select: none; user-select: none; }
  .cal-ph { position: absolute; left: 0; right: 0; top: 0; height: 18px; }
  .ph { position: absolute; top: 0; height: 18px; font-size: 12px; display: flex; align-items: center; justify-content: center; border-radius: 4px; white-space: nowrap; overflow: hidden; }
  .ph.fa { background: #fbebe4; color: #8a3a12; } .ph.ap { background: #eaf6f0; color: #2a6249; }
  .cal-b { position: absolute; left: 0; right: 0; top: 24px; height: 40px; }
  .blk { position: absolute; height: 18px; border-radius: 4px; background: var(--h); color: #fff; font-size: 12px; font-weight: 600; display: flex; align-items: center; padding: 0 5px; white-space: nowrap; overflow: hidden; box-shadow: inset 0 0 0 1px rgba(255,255,255,.3); }
  .blk.b2 { top: 21px; }
  .blk.avenir { background: #fff; color: var(--encre); box-shadow: inset 0 0 0 1.5px var(--h); }
  .cal-r { position: absolute; left: 0; right: 0; top: 68px; height: 24px; border-top: 1px solid #c9cad2; }
  .cal-r i { position: absolute; top: 0; width: 1px; height: 5px; background: #8a909b; }
  .cal-r span { position: absolute; top: 7px; transform: translateX(-50%); font: 500 12px/1 var(--mono); color: var(--gris); white-space: nowrap; }
  .cal-r span.rep { font-family: var(--sans); font-weight: 600; color: var(--encre); top: 7px; }
  .cal-c { position: absolute; top: 20px; height: 52px; width: 3px; margin-left: -1.5px; background: var(--encre); border-radius: 2px; z-index: 3; transition: left .12s ease-out; }
  .cal-c::before { content: ''; position: absolute; top: -6px; left: -5px; border: 6.5px solid transparent; border-top: 7px solid var(--encre); }
  .tenir { display: flex; align-items: center; gap: 10px; }
  .cuve-b { width: 84px; height: 56px; border-radius: 28px; background: var(--encre); color: #fff; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; font-size: 13px; font-weight: 700; touch-action: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; box-shadow: 0 4px 14px -6px rgba(22,22,26,.7); transition: transform .12s; flex: none; }
  .cuve-b.tenu { transform: scale(.94); box-shadow: 0 0 0 8px rgba(22,22,26,.14); }
  .tenir-t { flex: 1; font-size: 12px; color: var(--gris); }
  .plans { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; }
  .plans .plan { grid-column: span 2; } .plans .plan.suite { grid-column: span 3; }
  .plan { min-height: 40px; padding: 3px 6px; border-radius: 8px; background: #fff; box-shadow: inset 0 0 0 1px #c9cad2; font-size: 13px; font-weight: 600; text-align: left; display: flex; flex-wrap: wrap; align-items: center; gap: 2px 4px; line-height: 1.15; }
  .plan small { flex-basis: 100%; font: 500 12px var(--mono); color: var(--gris); }
  .plan[aria-pressed="true"] { box-shadow: inset 0 0 0 2px var(--encre); background: #f6f6f9; }
  .plans .plan.large { grid-column: 1 / -1; min-height: 32px; }
  .rang { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-height: 28px; }
  .seg.mom button { padding: 0 12px; }
  .ajout { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; } .ajout[hidden] { display: none; }
  .fait { display: flex; align-items: baseline; gap: 8px; font-size: 13px; line-height: 1.3; }
  .fait > .ms { min-width: 84px; flex: none; }
  .plg-t small { font: 400 12px var(--sans); color: var(--gris); }
  .lx-cuve { display: inline-block; width: 26px; height: 16px; border-radius: 8px; background: var(--encre); }
  .lx-bloc { display: inline-block; width: 26px; height: 10px; border-radius: 4px; background: ${COUL.Citra}; }
  .lx-cur { display: inline-block; width: 3px; height: 16px; background: var(--encre); }`;

const script = `
const D = DONNEES, NJ = ${NJ}, JMAX = 17;
const ETAT = { plan: 'citra', mom: 'dryPost', lev: 'US-05', j: 0 };
const sp = new Spectre(document.getElementById('spec'), { crans: 7 });
const cal = document.getElementById('cal'), INCONNU = FAM.map(() => [0, 0, 0, 0]);
const P = () => D.plans.find((p) => p.id === ETAT.plan);
const S = () => D.sim[ETAT.plan + '|' + ETAT.mom + '|' + ETAT.lev];
const debut = () => D.moms[ETAT.mom].debut;
const xJ = (jr) => (jr / JMAX * 100) + '%';
function calendrier() {
  const p = P(), d0 = debut();
  document.getElementById('ph-fa').style.cssText = 'left:0;width:calc(' + xJ(7) + ' - 2px)';
  document.getElementById('ph-ap').style.cssText = 'left:' + xJ(7) + ';right:0';
  const blocs = p.type === 'suite' ? [[p.hs[0], d0, p.jours[0], 0], [p.hs[1], d0 + p.jours[0], p.jours[1], 0]] : p.type === 'ensemble' ? [[p.hs[0], d0, 3, 0], [p.hs[1], d0, 3, 1]] : [[p.hs[0], d0, p.jours[0], 0]];
  document.getElementById('cal-b').innerHTML = blocs.map(([h, a, n, r], k) => '<span class="blk' + (r ? ' b2' : '') + (ETAT.j < (a - d0) ? ' avenir' : '') + '" style="--h:' + D.couleurs[h] + ';left:' + xJ(a) + ';width:calc(' + xJ(n) + ' - 2px)">' + h + ' · ' + n + ' j</span>').join('');
  const reps = [[d0 + 1, '24 h'], [d0 + 3, '3 j']];
  document.getElementById('cal-r').innerHTML = Array.from({ length: JMAX + 1 }, (_, k) => '<i style="left:' + xJ(k) + '"></i>').join('') + [0, 14].map((k) => '<span style="left:' + xJ(k) + '">J' + k + '</span>').join('') + reps.map(([k, t]) => '<span class="rep" style="left:' + xJ(k) + '">' + t + '</span>').join('');
}
function rendre() {
  const p = P(), s = S(), j = ETAT.j, d0 = debut();
  document.getElementById('plan-t').innerHTML = p.hs.map((h) => D.hop[h]).join(p.type === 'suite' ? ' puis ' : ' + ') + ' <span class="src-l">' + p.doses.join(' + ') + ' g/L · ' + D.moms[ETAT.mom].t + (p.type === 'suite' ? ' · ' + p.jours.join(' j, ') + ' j' : '') + '</span>';
  document.getElementById('j-n').textContent = 'J+' + j;
  document.getElementById('j-l').textContent = j === 0 ? 'jour de l’ajout · J' + d0 + ' de la cuve' : 'de contact · J' + (d0 + j) + ' de la cuve';
  if (!s) {
    sp.set({ p: INCONNU });
    document.getElementById('cq1').innerHTML = '<span class="cq-0">' + ETAT.lev + ' : pas simulé pour ce plan (rien dans le moteur) : inconnu, pas zéro.</span>';
    document.getElementById('plat').textContent = '';
  } else {
    const hier = j > 0 ? s.jours[j - 1] : AVANT;
    sp.set({ p: s.jours[j], ghost: s.jours[NJ - 1], ref: hier });
    document.getElementById('cq1').innerHTML = '<span class="cq-l">' + (j === 0 ? 'avant' : 'depuis hier') + '</span>' + (j === 0 ? '<span class="cq-0">~ ma bière, le jour de l’ajout</span>' : phraseEcarts(sp, 3));
    const bouge = j > 0 && sp.ecarts(1).length > 0;
    const plat = j >= 2 && !bouge;
    let t = '';
    if (plat) t = '~ Plus rien ne bouge. <span class="src-l">Le moteur arrête l’extraction à 3 j (H73 : aucun gain mesuré au-delà).</span>';
    else if (p.type === 'suite' && j === p.jours[0] + 1) t = '~ ' + p.hs[1] + ' entre : la saturation est partagée' + (s.saturation ? ', ensemble ≈ ' + Math.round(100 * s.saturation.tropical) + ' % de la somme en tropical' : '') + '. <span class="src-l">Ordre, synergie, masquage : inconnus.</span>';
    document.getElementById('plat').innerHTML = t;
  }
  document.getElementById('cal-c').style.left = xJ(d0 + j);
  document.getElementById('rep-j').innerHTML = (D.reperes.find(([a, b]) => j >= a && j <= b) || [0, 0, ''])[2];
  calendrier();
  // la levure : ce qu'elle fait en dry hop actif (cas K4 : Citra 2 g/L puis Idaho 7) ; ici, selon le moment
  const Bi = D.bio[ETAT.lev], bc = D.bioCas[ETAT.lev], pl = (o, u) => (o ? '<b data-nature="simule">~' + frn(o.centre) + ' ' + u + '</b> <span class="src-l">[' + frn(o.bas) + '–' + frn(o.haut) + ']</span>' : '');
  document.getElementById('bio').innerHTML = '<span class="st">Biotransformation</span><span class="st' + (Bi.statut === 'documentée' ? ' doc' : '') + '">' + ETAT.lev + ' · ' + Bi.statut + '</span>' + (bc ? '<span>cas K4, Citra 2 g/L actif : ' + (ETAT.lev === 'Pomona' || ETAT.lev === 'US-05' ? pictoH('citrus') + 'citronellol ' + pl(bc.cit, 'µg/L') : pictoH('tropical') + 'thiols libérés ' + pl(bc.thi, 'ng/L')) + '</span>' : '') + '<span class="src-l">' + (ETAT.mom === 'dryActive' ? 'ici : elle agit, géraniol divisé surtout les 3 premiers jours' : 'ici : levure au repos, hop creep possible') + '</span>';
  const aj = document.getElementById('ajout');
  aj.hidden = p.type !== 'ensemble';
  aj.innerHTML = p.type === 'ensemble' ? p.hs.map((h) => '<span class="hn" data-houblon="' + h + '"><i class="hpt" style="--h:' + D.couleurs[h] + '"></i>' + h + '</span>').join(' + ') + ' <span class="src-l">même ajout, 2 + 2 g/L</span>' : '';
  document.querySelectorAll('[data-plan]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.plan === ETAT.plan)));
  document.querySelectorAll('[data-mom]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mom === ETAT.mom)));
  document.querySelectorAll('[data-lev]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lev === ETAT.lev)));
  document.querySelectorAll('#voies .vh').forEach((v) => { v.hidden = !p.hs.includes(v.querySelector('[data-houblon]').dataset.houblon); });
}
window.rendre = rendre;
// ---------- le geste : maintenir, les jours passent ; un toucher, un jour ----------
const B = document.getElementById('tenir');
let TENU = null, T0 = 0;
const pas = () => { if (ETAT.j >= NJ - 1) return false; ETAT.j++; try { navigator.vibrate && navigator.vibrate(5); } catch (x) {} rendre(); return true; };
B.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  e.preventDefault(); B.setPointerCapture(e.pointerId); B.classList.add('tenu'); T0 = performance.now();
  if (ETAT.j >= NJ - 1) { ETAT.j = 0; rendre(); }
  TENU = setInterval(() => { if (!pas()) { clearInterval(TENU); TENU = null; } }, 350);
});
const lacher = () => { if (TENU) clearInterval(TENU); const court = performance.now() - T0 < 300; TENU = null; B.classList.remove('tenu'); if (court) pas(); };
B.addEventListener('pointerup', lacher); B.addEventListener('pointercancel', () => { if (TENU) clearInterval(TENU); TENU = null; B.classList.remove('tenu'); });
B.addEventListener('click', (e) => { if (e.detail === 0) pas(); });
B.addEventListener('contextmenu', (e) => e.preventDefault());
document.getElementById('j0').addEventListener('click', () => { ETAT.j = 0; rendre(); });
// glisser le doigt sur le calendrier : remonter ou avancer le temps
let GL = null;
const jour = (e) => { const r = cal.getBoundingClientRect(); const jr = Math.round((e.clientX - r.left) / r.width * JMAX); return Math.max(0, Math.min(NJ - 1, jr - debut())); };
cal.addEventListener('pointerdown', (e) => { GL = e.pointerId; cal.setPointerCapture(e.pointerId); const j = jour(e); if (j !== ETAT.j) { ETAT.j = j; rendre(); } });
cal.addEventListener('pointermove', (e) => { if (GL !== e.pointerId) return; const j = jour(e); if (j !== ETAT.j) { ETAT.j = j; try { navigator.vibrate && navigator.vibrate(4); } catch (x) {} rendre(); } });
cal.addEventListener('pointerup', () => { GL = null; });
document.querySelectorAll('[data-plan]').forEach((b) => b.addEventListener('click', () => { ETAT.plan = b.dataset.plan; ETAT.j = 0; rendre(); }));
document.querySelectorAll('[data-mom]').forEach((b) => b.addEventListener('click', () => { ETAT.mom = b.dataset.mom; rendre(); }));
document.querySelectorAll('[data-lev]').forEach((b) => b.addEventListener('click', () => { ETAT.lev = b.dataset.lev; rendre(); }));
{ const q = new URLSearchParams(location.search); if (q.get('plan')) ETAT.plan = q.get('plan'); if (q.get('j')) ETAT.j = +q.get('j'); if (q.get('mom')) ETAT.mom = q.get('mom'); if (q.get('lev')) ETAT.lev = q.get('lev'); }
rendre();
window.__releve = () => ({ plan: P().t, moment: D.moms[ETAT.mom].t, levure: ETAT.lev, jour: 'J+' + ETAT.j, source: S() ? S().src : 'inconnu', change: document.getElementById('cq1').innerText.replace(/\\s+/g, ' ').trim(), plat: document.getElementById('plat').innerText.replace(/\\s+/g, ' ').trim(), crans: Object.fromEntries(sp.rows.map((c) => [c.dataset.famille, c.dataset.crans])), largeurs: Object.fromEntries(sp.rows.map((c) => [c.dataset.famille, Math.round(c.querySelector('.sp-b').getBoundingClientRect().width)])) });
`;

Y.ecrire(path.join(ici, 'etat.html'), Y.page({
  titre: 'La cuve, jour par jour',
  commentaire: 'Lot 21 · y2 : maintenir le doigt sur la cuve, les jours de contact passent ; le profil monte puis s’arrête (3 j) ; un houblon, deux à la suite (K3), deux ensemble (K5), actif ou après, quatre levures. Généré par generateur-y2.mjs (../y1/socle/socle.mjs).',
  css, corps, script, hs: ['Citra', 'Galaxy', 'Idaho 7'], data,
}));
