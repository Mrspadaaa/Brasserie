// Lot 21 · y5 « Une bière possible » : on pose deux houblons dans la cuve, puis chaque toucher tire une bière.
// Demande du brasseur : « Aussi explore la voie de l'ajout cumulé. 2 houblons en dry hopping. Et la bio
// Transfo et la levure » (K5) ; et, sur l'incertitude : « Si il y a des écart x100 justement il faut que ça se
// voit pas que ce soit effacé ».
// Le geste EST la simulation : glisser un houblon dans la cuve (un toucher le pose aussi) ; à deux, le moteur
// donne l'ajout cumulé (2 + 2 g/L, 3 j : paires du moteur), la part de chacun et la saturation partagée.
// Puis « Tire une bière » : chaque toucher tire une bière possible dans la plage du moteur (bas, centre, haut),
// un point par famille ; les points s'accumulent, et la page compte combien de bières sortent du style.
// Usage : node generateur-y5.mjs  →  y5/etat.html
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Y from '../y1/socle/socle.mjs';
const { M, C, INC, ico, fr, esc, COUL, FAIT, ETUDE, srcEtude } = Y;
const ici = path.dirname(fileURLToPath(import.meta.url));

const HS = ['Citra', 'Galaxy', 'Idaho 7', 'Cascade', 'Motueka', 'Nelson Sauvin'];
const LEV = Y.LEVURES, MOMS = ['dryPost', 'dryActive'];
const paires = {};
for (let i = 0; i < HS.length; i++) for (let k = i + 1; k < HS.length; k++) for (const m of MOMS) for (const lv of LEV) {
  const p = Y.paire(HS[i], HS[k], m, lv);
  if (p) paires[[HS[i], HS[k]].sort().join('+') + '|' + m + '|' + lv] = { p: p.profil, parts: p.parts, ordre: [HS[i], HS[k]], sat: p.saturation };
}
const data = {
  paires,
  seuls: Y.tranche(HS, MOMS, [2, 4], [3], Y.DIMS.levures),
  couleurs: COUL, bio: Y.BIO,
  huile: Object.fromEntries(HS.map((h) => [h, Y.huilePlage(h)])),
};
const voie = (h, n) => `<div class="vh" data-voie="${n}" data-role="ligne-houblon" data-h="${esc(h)}">${Y.nomH(h)}${Y.usage(h)}${Y.alpha(h)}<span class="q">${Y.huile(h)}</span></div>`;
const rC = Y.rapport('Citra', 'linalol'), rG = Y.rapport('Galaxy', 'linalol');

const corps = `
  ${Y.tete('Deux houblons ?')}
  <section class="bloc sim" data-role="simulation" aria-label="Profil simulé de l'ajout cumulé">
    <div class="bloc-h">${Y.tagSim()}<span class="t-aj" id="t-aj"></span></div>
    <div id="spec"></div>
    <div class="cle-l" aria-hidden="true"><span><i class="kl kl-b"></i>premier houblon, ~ simulé</span><span><i class="kl kl-m"></i>second</span><span><i class="kl kl-g"></i>premier seul, 4 g/L</span><span><i class="kl kl-d"></i>une bière tirée</span><span><i class="kl kl-f"></i>plage possible</span></div>
    <div class="cqs" id="cq1"></div>
    <p class="tir-c" id="tir-c"></p>
  </section>
  <section class="bloc geste" aria-label="La cuve : pose deux houblons, puis tire des bières">
    <div class="cuve" id="cuve" data-role="ajout" aria-label="La cuve du dry hop"><span class="cuve-v" id="cuve-v">glisse ou touche deux houblons</span></div>
    <div class="fi-eb"><span class="ch-t">charge d’huile de l’ajout</span><span id="charge"></span></div>
    <div class="plateau" id="plateau" role="group" aria-label="Houblons à poser">${HS.map((h) => `<button class="jt" data-jt="${esc(h)}" data-role="reglage" data-reglage="ajout-cumule" style="--h:${COUL[h]}"><i class="hpt"></i>${esc(h)}</button>`).join('')}</div>
    <div class="tirer"><button class="tir-b" id="tirer" data-role="reglage">${ico('i-plus', 16)}Tire une bière</button><button class="chip" id="tirer20" data-role="reglage">Tire-en 20</button><button class="chip" id="vider" data-role="reglage">Efface</button></div>
  </section>
  <section class="bloc" aria-label="Le moment et la levure">
    <div class="rang"><span class="seg mom" role="radiogroup" aria-label="Moment"><button role="radio" data-mom="dryPost" data-role="reglage" aria-checked="true">dry hop après</button><button role="radio" data-mom="dryActive" data-role="reglage" aria-checked="false">actif</button></span><span class="src-l">2 + 2 g/L, 3 j</span></div>
    <div class="lev" role="group" aria-label="Levure">${LEV.map((l, i) => `<button data-reglage="levure" data-role="reglage" data-lev="${l}" aria-pressed="${i === 0}">${l}</button>`).join('')}</div>
    <div class="bio" data-role="biotransformation" id="bio"></div>
  </section>
  <div class="voies" id="voies">${HS.map((h, i) => voie(h, i + 1)).join('')}</div>
  <section class="bloc" aria-label="Vraies valeurs et inconnus">
    <div class="bloc-h"><span>Ce qu’on sait, ce qu’on ne sait pas</span></div>
    <div class="plg-h">${Y.nomH('Citra', { couleur: false })} <span class="src-l">seul, 4 g/L après 3 j</span></div>${Y.plageLog({ ...rC, compose: 'linalol', fams: ['floral', 'citrus'], aria: 'Citra, linalol' })}
    <div class="plg-h">${Y.nomH('Galaxy', { couleur: false })} <span class="src-l">seul, 4 g/L après 3 j</span></div>${Y.plageLog({ ...rG, compose: 'linalol', fams: ['floral', 'citrus'], aria: 'Galaxy, linalol' })}
    <div class="fi-eb">${INC('synergie : inconnue', 'composes-houblon.json, ajoutsSuccessifs')} ${INC('masquage : inconnu', 'composes-houblon.json, ajoutsSuccessifs')}</div>
    <div class="fi-eb">${INC('deux houblons ensemble, en bière : aucune mesure lue', 'comparatifs-dryhop.json')}</div>
    <div class="fi-eb">${INC('Galaxy : aucune comparaison chiffrée', 'comparatifs-dryhop.json')}</div>
    <p class="src-l">Un tirage : une bière au hasard entre le bas et le haut du moteur, plus souvent près du centre (loi triangulaire, convention de la page). Le moteur additionne : synergie et masquage restent dans sa plage.</p>
  </section>
  ${Y.legende([Y.legendeSection('Cuve et tirages', [['<i class="lx-jt"></i>', 'glisse un houblon dans la cuve'], ['<i class="lx-pt"></i>', 'un point : une bière possible'], ['<i class="lx-pto"></i>', 'point orangé : hors du style'], ['<i class="kl kl-m"></i>', 'hachuré : la part du second']])])}`;

const css = `
  .t-aj { font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 5px; flex-wrap: wrap; }
  .cle-l { display: flex; flex-wrap: wrap; gap: 2px 10px; font-size: 12px; color: var(--gris); }
  .cle-l span { display: inline-flex; align-items: center; gap: 4px; }
  .kl { display: inline-block; width: 14px; height: 9px; }
  .kl-b { background: linear-gradient(90deg, ${Y.J.floral.base} 0 33%, ${Y.J.citrus.base} 33% 66%, ${Y.J.tropical.base} 66%); border-radius: 0 2px 2px 0; }
  .kl-m { background: repeating-linear-gradient(135deg, ${Y.J.tropical.base} 0 2px, #fff 2px 4px); box-shadow: inset 0 0 0 1px ${Y.J.tropical.base}; }
  .kl-g { border: 1.5px dashed var(--encre); border-left: 0; height: 11px; } .kl-f { height: 1px; background: #6b6f7a; }
  .kl-d { width: 6px; height: 6px; border-radius: 50%; background: var(--encre); }
  .cq-l { font-size: 12px; font-weight: 700; min-width: 70px; }
  .tir-c { font-size: 13px; line-height: 1.5; min-height: 78px; } .tir-c b { font-family: var(--mono); }
  .it { display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; margin-right: 6px; }
  .sat { font-size: 13px; line-height: 1.5; flex-basis: 100%; } .sat b { font-family: var(--mono); }
  .tir-c .src-l { display: block; }
  .geste { touch-action: none; }
  .cuve { min-height: 64px; border-radius: 8px; border: 2px dashed #9aa0ab; display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; padding: 6px; transition: background .15s, border-color .15s; }
  .cuve.vise { background: #eef0f4; border-color: var(--encre); }
  .cuve.pleine { border-style: solid; border-color: var(--encre); }
  .cuve-v { font-size: 13px; color: var(--gris); }
  .dans { height: 36px; padding: 0 10px 0 8px; border-radius: 18px; background: var(--h); color: #fff; display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; }
  .dans small { font: 500 12px var(--mono); opacity: 1; }
  .dans .x { width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,.25); display: inline-flex; align-items: center; justify-content: center; }
  .plateau { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
  .jt { height: 36px; border-radius: 18px; background: #fff; box-shadow: inset 0 0 0 1.5px var(--h); font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 5px; touch-action: none; -webkit-user-select: none; user-select: none; white-space: nowrap; }
  .jt .hpt { --h: inherit; background: var(--h); }
  .jt[aria-disabled="true"] { color: var(--gris); box-shadow: inset 0 0 0 1px #d4d6dd; font-weight: 400; }
  .vol { position: fixed; z-index: 40; pointer-events: none; height: 40px; padding: 0 14px; border-radius: 20px; background: var(--h); color: #fff; font-size: 14px; font-weight: 700; display: inline-flex; align-items: center; transform: translate(-50%, -70%) scale(1.08); box-shadow: 0 10px 24px -8px rgba(22,22,26,.6); }
  .tirer { display: flex; gap: 6px; align-items: center; }
  .tir-b { height: 40px; padding: 0 16px; border-radius: 20px; background: var(--encre); color: #fff; font-size: 14px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; flex: 1; justify-content: center; }
  .tir-b:active { transform: scale(.97); }
  .rang { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; } .seg.mom button { padding: 0 12px; }
  .ch-t { font-size: 12px; font-weight: 700; color: var(--gris); }
  .plg-h { font-size: 13px; margin-top: 2px; display: flex; gap: 6px; align-items: center; } .plg-t small { font: 400 12px var(--sans); color: var(--gris); }
  .lx-jt { display: inline-block; width: 26px; height: 14px; border-radius: 7px; box-shadow: inset 0 0 0 1.5px ${COUL.Citra}; }
  .lx-pt, .lx-pto { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--encre); } .lx-pto { background: var(--acc); }`;

const script = `
const D = DONNEES;
const ETAT = { hs: ['Citra'], mom: 'dryPost', lev: 'US-05', tirs: [] };
const sp = new Spectre(document.getElementById('spec'), { crans: 7 });
const INCONNU = FAM.map(() => [0, 0, 0, 0]);
const levG = (lv) => (lv === 'US-05' || lv === 'Pomona' ? lv : ETAT.mom === 'dryPost' ? 'US-05' : null);
const seul = (h, d) => { const l = levG(ETAT.lev); return l ? D.seuls[[h, ETAT.mom, d, 3, l].join('|')] : null; };
function courant() {
  const hs = ETAT.hs;
  if (hs.length < 2) return { p: hs.length ? seul(hs[0], 2) : AVANT, ghost: hs.length ? seul(hs[0], 4) : null, parts: null };
  const k = [...hs].sort().join('+'), pr = D.paires[k + '|' + ETAT.mom + '|' + ETAT.lev] || (ETAT.mom === 'dryPost' ? D.paires[k + '|' + ETAT.mom + '|US-05'] : null);
  if (!pr) return { p: null };
  const parts = pr.ordre[0] === hs[0] ? pr.parts : pr.parts.map(([a, b]) => [b, a]);
  return { p: pr.p, ghost: seul(hs[0], 4), parts, sat: pr.sat };
}
// Un tirage : une bière possible, par famille, entre le bas et le haut, plus souvent près du centre.
const tri = (a, c, b) => { const u = Math.random(); if (b <= a) return c; const f = (c - a) / (b - a); return u < f ? a + Math.sqrt(u * (b - a) * (c - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - c)); };
function tirer(n = 1) { const c = courant(); if (!c.p) return; for (let k = 0; k < n; k++) ETAT.tirs.push(c.p.map((x) => (inconnuP(x) ? null : tri(x[0], x[1], x[2])))); if (ETAT.tirs.length > 60) ETAT.tirs = ETAT.tirs.slice(-60); rendre(); }
function rendre() {
  const c = courant(), hs = ETAT.hs;
  const dots = ETAT.tirs.length ? FAM.map((f, i) => ETAT.tirs.map((t) => t[i]).filter((v) => v != null)) : null;
  sp.set({ p: c.p || INCONNU, ghost: c.ghost, parts: c.parts, dots });
  document.getElementById('t-aj').innerHTML = hs.length ? hs.map((h) => '<i class="hpt" style="--h:' + D.couleurs[h] + '"></i>' + h).join(' + ') + ' · ' + (hs.length > 1 ? '2 + 2 g/L' : '2 g/L') + ' · ' + (ETAT.mom === 'dryPost' ? 'après' : 'actif') + ' · ' + ETAT.lev : 'la cuve est vide';
  const cq = document.getElementById('cq1');
  if (!c.p) cq.innerHTML = '<span class="cq-0">' + ETAT.lev + ' en actif : pas dans le moteur pour ce couple, inconnu.</span>';
  else if (hs.length < 2) cq.innerHTML = '<span class="cq-l">' + (hs[0] || '') + ' seul</span>' + phraseEcarts(sp, 3) + '<span class="cq-0">· pose un second houblon</span>';
  else { const e = FAM.map((f, i) => ({ f, i, s: c.sat && c.sat[f] })).filter((x) => x.s != null && x.s < 0.95).sort((a, b) => a.s - b.s).slice(0, 2); cq.innerHTML = '<span class="cq-l">ensemble</span>' + phraseEcarts(sp, 2) + (e.length ? '<span class="sat">saturation partagée : ' + e.map((x) => '<span class="it">' + pictoH(x.f) + NOMF[x.f] + ' <b data-nature="simule">~' + Math.round(100 * x.s) + ' %</b></span>').join(' ') + ' de la somme des deux seuls</span>' : ''); }
  // les tirages : combien de bières possibles sortent du style, famille par famille
  const tc = document.getElementById('tir-c');
  if (!ETAT.tirs.length) tc.innerHTML = '<span class="src-l">Touche « Tire une bière » : chaque bière possible, tirée dans la plage du moteur, fait un point par famille.</span>';
  else { const n = ETAT.tirs.length, h = FAM.map((f, i) => ({ f, k: ETAT.tirs.filter((t) => t[i] != null && t[i] > ZONE[f][1]).length })).filter((x) => x.k > 0 && FAM.indexOf(x.f) !== FAM.indexOf('resin')).sort((a, b) => b.k - a.k).slice(0, 3); tc.innerHTML = '<b data-nature="simule">' + n + '</b> bière' + (n > 1 ? 's' : '') + ' tirée' + (n > 1 ? 's' : '') + (h.length ? ', hors du style : ' + h.map((x) => '<span class="it">' + pictoH(x.f) + NOMF[x.f] + ' <b data-nature="simule">' + x.k + ' sur ' + n + '</b></span>').join(' ') : ', aucune hors du style (sauf résineux)') + ' <span class="src-l">L’étendue du possible, pas une probabilité mesurée ; résineux déjà hors du style dans ma bière.</span>'; }
  // la cuve
  const cuve = document.getElementById('cuve');
  cuve.classList.toggle('pleine', hs.length === 2);
  cuve.innerHTML = hs.length ? hs.map((h) => '<span class="dans" style="--h:' + D.couleurs[h] + '"><span data-houblon="' + h + '">' + h + '</span><small>2 g/L</small><button class="x" data-retire="' + h + '" data-role="reglage" aria-label="Retirer ' + h + '">' + '×' + '</button></span>').join('') + (hs.length < 2 ? '<span class="cuve-v">+ un second houblon</span>' : '') : '<span class="cuve-v">glisse ou touche deux houblons</span>';
  document.querySelectorAll('[data-jt]').forEach((b) => b.setAttribute('aria-disabled', String(hs.includes(b.dataset.jt) || hs.length >= 2)));
  // la charge d'huile de l'ajout, en vrai (huile des fiches × dose)
  const lo = hs.reduce((s, h) => s + D.huile[h][0] * 2, 0), hi = hs.reduce((s, h) => s + D.huile[h][1] * 2, 0);
  document.getElementById('charge').innerHTML = hs.length ? '<span class="ms" data-nature="mesure" data-source="huile des fiches (composes-houblon.json) × dose (H §7.4)">' + frn(lo, 1) + '–' + frn(hi, 1) + ' <small>mL/hL</small></span> <span class="src-l">pour ' + (hs.length * 2) + ' g/L</span>' : '';
  const Bi = D.bio[ETAT.lev];
  document.getElementById('bio').innerHTML = '<span class="st">Biotransformation</span><span class="st' + (Bi.statut === 'documentée' ? ' doc' : '') + '">' + ETAT.lev + ' · ' + Bi.statut + '</span><span class="src-l">' + (ETAT.mom === 'dryActive' ? 'en actif : comptée dans le profil du moteur' : 'après : levure au repos, rien de compté ; hop creep possible') + '</span>';
  document.querySelectorAll('#voies .vh').forEach((v) => { v.hidden = !hs.includes(v.dataset.h); });
  document.querySelectorAll('[data-lev]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lev === ETAT.lev)));
  document.querySelectorAll('[data-mom]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mom === ETAT.mom)));
}
window.rendre = rendre;
const poser = (h) => { if (ETAT.hs.includes(h) || ETAT.hs.length >= 2) return; ETAT.hs.push(h); ETAT.tirs = []; try { navigator.vibrate && navigator.vibrate(8); } catch (x) {} rendre(); };
// ---------- le geste : glisser un houblon dans la cuve (un toucher le pose aussi) ----------
const cuve = document.getElementById('cuve');
let VOL = null;
document.querySelectorAll('[data-jt]').forEach((b) => {
  b.addEventListener('pointerdown', (e) => { if (b.getAttribute('aria-disabled') === 'true') return; e.preventDefault(); b.setPointerCapture(e.pointerId); VOL = { b, h: b.dataset.jt, x0: e.clientX, y0: e.clientY, el: null }; });
  b.addEventListener('pointermove', (e) => {
    if (!VOL || VOL.b !== b) return;
    if (!VOL.el && Math.hypot(e.clientX - VOL.x0, e.clientY - VOL.y0) > 8) { VOL.el = document.createElement('span'); VOL.el.className = 'vol'; VOL.el.style.setProperty('--h', D.couleurs[VOL.h]); VOL.el.textContent = VOL.h; document.body.append(VOL.el); }
    if (VOL.el) { VOL.el.style.left = e.clientX + 'px'; VOL.el.style.top = e.clientY + 'px'; const r = cuve.getBoundingClientRect(); cuve.classList.toggle('vise', e.clientX > r.left && e.clientX < r.right && e.clientY > r.top - 20 && e.clientY < r.bottom + 20); }
  });
  b.addEventListener('pointerup', (e) => {
    if (!VOL || VOL.b !== b) return;
    const v = VOL; VOL = null; cuve.classList.remove('vise');
    if (!v.el) { poser(v.h); return; }
    v.el.remove(); const r = cuve.getBoundingClientRect();
    if (e.clientX > r.left && e.clientX < r.right && e.clientY > r.top - 20 && e.clientY < r.bottom + 20) poser(v.h);
  });
  b.addEventListener('click', (e) => { if (e.detail === 0) poser(b.dataset.jt); });
});
cuve.addEventListener('click', (e) => { const x = e.target.closest('[data-retire]'); if (!x) return; ETAT.hs = ETAT.hs.filter((h) => h !== x.dataset.retire); ETAT.tirs = []; rendre(); });
document.getElementById('tirer').addEventListener('click', () => tirer(1));
document.getElementById('tirer20').addEventListener('click', () => tirer(20));
document.getElementById('vider').addEventListener('click', () => { ETAT.tirs = []; rendre(); });
// secouer le téléphone tire une bière aussi (sans demande d'autorisation : Android ; iOS l'ignore)
let SEC = 0; addEventListener('devicemotion', (e) => { const a = e.accelerationIncludingGravity; if (!a) return; const g = Math.hypot(a.x || 0, a.y || 0, a.z || 0); if (g > 22 && performance.now() - SEC > 700) { SEC = performance.now(); tirer(1); } });
document.querySelectorAll('[data-lev]').forEach((b) => b.addEventListener('click', () => { ETAT.lev = b.dataset.lev; ETAT.tirs = []; rendre(); }));
document.querySelectorAll('[data-mom]').forEach((b) => b.addEventListener('click', () => { ETAT.mom = b.dataset.mom; ETAT.tirs = []; rendre(); }));
{ const q = new URLSearchParams(location.search); if (q.get('hs')) ETAT.hs = q.get('hs').split(','); if (q.get('tirs')) { rendre(); tirer(+q.get('tirs')); } }
rendre();
window.__releve = () => ({ cuve: ETAT.hs.join(' + ') || 'vide', moment: ETAT.mom === 'dryPost' ? 'après' : 'actif', levure: ETAT.lev, tirages: ETAT.tirs.length, change: document.getElementById('cq1').innerText.replace(/\\s+/g, ' ').trim(), compte: document.getElementById('tir-c').innerText.replace(/\\s+/g, ' ').trim(), crans: Object.fromEntries(sp.rows.map((c) => [c.dataset.famille, c.dataset.crans])), largeurs: Object.fromEntries(sp.rows.map((c) => [c.dataset.famille, Math.round(c.querySelector('.sp-b').getBoundingClientRect().width)])), points: sp.rows.reduce((s, c) => s + c.querySelectorAll('.sp-dots i').length, 0) });
`;

Y.ecrire(path.join(ici, 'etat.html'), Y.page({
  titre: 'Une bière possible',
  commentaire: 'Lot 21 · y5 : glisser deux houblons dans la cuve (ajout cumulé 2 + 2 g/L, paires du moteur, part de chacun, saturation partagée) ; chaque toucher tire une bière possible dans la plage du moteur ; les points s’accumulent ; levure, moment. Généré par generateur-y5.mjs (../y1/socle/socle.mjs).',
  css, corps, script, hs: HS, data,
}));
