// Lot 21 · y4 « Les levures en cartes » : on balaie les levures du pouce, le profil glisse avec le doigt.
// Demande du brasseur : « Aussi ils nous faut un outil de dry hopping, bio Transfo, levure » (K4, et K5 :
// deux houblons ensemble, avec US-05, Pomona ou Verdant).
// Le geste EST la simulation : la carte suit le pouce ; pendant le balayage, les 12 familles passent d'une
// levure à l'autre (fondu entre les deux profils du moteur, les chiffres sont ceux de la carte la plus
// proche) ; au lâcher, la carte se cale. Chaque carte dit ce que la fiche de la levure dit vraiment
// (atténuation, esters, biotransformation) et ce que le moteur en simule ; « après fermentation », l'effet
// de la levure disparaît, et la page le montre.
// Usage : node generateur-y4.mjs  →  y4/etat.html
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Y from '../y1/socle/socle.mjs';
const { M, C, INC, ico, fr, esc, COUL, FAIT, ETUDE, srcEtude } = Y;
const ici = path.dirname(fileURLToPath(import.meta.url));

const LEV = Y.LEVURES;
const LVC = { 'US-05': 'us05', Pomona: 'pomona', Verdant: 'verdant', Diamond: 'diamond' };
// K4 du moteur : Citra 2 g/L 3 j puis Idaho 7 2 g/L 5 j (le cas d4 du lot 20), pour les quatre levures ;
// K5 : deux houblons ensemble, 2 + 2 g/L, 3 j, avec US-05, Pomona ou Verdant ; Citra seul : la grille.
const PLANS = [
  { id: 'k4', t: 'Citra 3 j puis Idaho 7 5 j', hs: ['Citra', 'Idaho 7'], sorte: 'k4', sous: '2 + 2 g/L, à la suite' },
  { id: 'galaxy', t: 'Citra + Galaxy', hs: ['Citra', 'Galaxy'], sorte: 'k5', id5: 'citra+galaxy', sous: '2 + 2 g/L ensemble, 3 j' },
  { id: 'idaho', t: 'Citra + Idaho 7', hs: ['Citra', 'Idaho 7'], sorte: 'k5', id5: 'citra+idaho-7', sous: '2 + 2 g/L ensemble, 3 j' },
  { id: 'cascade', t: 'Citra + Cascade', hs: ['Citra', 'Cascade'], sorte: 'k5', id5: 'citra+cascade', sous: '2 + 2 g/L ensemble, 3 j' },
  { id: 'citra', t: 'Citra seul', hs: ['Citra'], sorte: 'grille', sous: '4 g/L, 3 j' },
];
const mt = (m) => (m === 'dryActive' ? 'actif' : 'apres');
const casId = (P, m, lv) => (P.sorte === 'k5' ? 'K5-' + P.id5 + '-' + mt(m) + '-' + LVC[lv] : P.sorte === 'k4' ? 'K4-' + LVC[lv] + '-' + mt(m) : null);
const sim = {}, bio = {};
for (const P of PLANS) for (const m of ['dryActive', 'dryPost']) for (const lv of LEV) {
  const id = casId(P, m, lv), c = id && Y.casDe(id);
  sim[P.id + '|' + m + '|' + lv] = c ? Y.casApres(id) : P.sorte === 'grille' && Y.aGrille('Citra', m, 4, 3, lv) ? Y.grille('Citra', m, 4, 3, lv) : null;
  const b = c && c.biotransformation;
  bio[P.id + '|' + m + '|' + lv] = b ? { actif: b.actif, par: b.parAjout.map((a, k) => ({ h: P.hs[k], cit: a.citronellol_ugL, thi: a.thiolsLiberes_ngL, raison: a.raison ? Y.texte(a.raison) : null })) } : null;
}
const LV_CLE = { 'US-05': 'fermentis-us05', Verdant: 'lalbrew-verdant-ipa', Pomona: 'lalbrew-pomona', Diamond: 'lalbrew-diamond' };
const ESTERS_FAM = { abricot: 'stoneFruit', pêche: 'stoneFruit', tropical: 'tropical', agrumes: 'citrus' };
// La carte d'une levure : sa fiche, en vrai (atténuation, température, esters), et le statut de sa
// biotransformation ; le chiffre simulé s'y écrit en direct (selon le plan et le moment).
const carte = (lv, i) => {
  const x = FAIT.levures[LV_CLE[lv]], B = Y.BIO[lv];
  const [att, temp] = x.attenuation.split(';').map((s) => s.trim());
  const est = /\blow\b/i.test(x.esters) ? 'faibles (fiche : « low »)' : x.esters.replace(/[«»]/g, '').replace(/\(fiche\)/, '').trim();
  const estF = est.split(/,\s*/).map((w) => ESTERS_FAM[w.trim()]).filter(Boolean);
  const note = lv === 'Diamond' ? 'Samia : le plus de thiols mesurés, le fruité perçu le plus faible.' : lv === 'US-05' ? `Sur 12 souches : ${C('géraniol', ['floral'])} et nérol plus hauts avec US-05 (H44).` : lv === 'Pomona' ? `Terpènes « medium » : ${C('citronellol', ['citrus'])} produit depuis le ${C('géraniol', ['floral'])}.` : 'β-lyase qualitative, sans chiffre publié.';
  return `<button class="carte" data-lev="${lv}" data-i="${i}" aria-label="Levure ${lv}">
    <span class="c-t"><b>${esc(x.nom)}</b><span class="c-st st-${B.statut.replace(/\s/g, '-')}">${B.statut}</span></span>
    <span class="c-l"><span class="c-k">atténuation</span>${M(esc(att.replace(/\s*\(.*?\)/g, '')), 'fiche de la levure : ' + x.sources.join(', ') + ' (composes-houblon.json)')}<span class="src-l">${esc((temp || '').replace(/\s*ou.*$/, ''))}</span></span>
    <span class="c-l"><span class="c-k">esters</span>${estF.map((f) => Y.picto(f, 14)).join('')}<span>${esc(est)}</span></span>
    <span class="c-bio" data-role="biotransformation"><span class="c-k">biotransformation</span><span class="c-sim" data-sim="${lv}"></span></span>
    <span class="c-n">${note}</span>
  </button>`;
};
const voie = (h, n) => `<div class="vh" data-voie="${n}" data-role="ligne-houblon">${Y.nomH(h)}${Y.usage(h)}${Y.alpha(h)}<span class="q">${Y.huile(h)}</span></div>`;
const e01 = ETUDE.E01.mesures.find((m) => /citronellol/.test(m.compose));
const rL = Y.rapport('Citra', 'linalol');

const corps = `
  ${Y.tete('Quelle levure ?')}
  <section class="bloc sim" data-role="simulation" aria-label="Profil simulé selon la levure">
    <div class="bloc-h">${Y.tagSim()}<span class="t-plan" id="t-plan"></span></div>
    <div id="spec"></div>
    <div class="cle-l" aria-hidden="true"><span><i class="kl kl-b"></i>la levure choisie, ~ simulé</span><span><i class="kl kl-g"></i>avec US-05</span><span><i class="kl kl-f"></i>plage possible</span></div>
    <div class="cqs" id="cq1"></div>
    <p class="note" id="note"></p>
  </section>
  <section class="bloc lev-b" aria-label="Les levures : balaie du pouce">
    <div class="cartes" id="cartes"><div class="rail" id="rail">${LEV.map(carte).join('')}</div></div>
    <div class="points" role="group" aria-label="Levure">${LEV.map((l, i) => `<button class="pt" data-p="${l}" data-reglage="levure" data-role="reglage" data-i="${i}">${l}</button>`).join('')}</div>
    <p class="src-l pts-l">balaie les cartes du pouce, ou touche un nom</p>
  </section>
  <section class="bloc" aria-label="Le plan et le moment">
    <div class="plans" role="group" aria-label="Le dry hop">${PLANS.map((P, i) => `<button class="plan" data-plan="${P.id}" data-role="reglage"${P.sorte === 'k5' ? ' data-reglage="ajout-cumule"' : ''} aria-pressed="${i === 0}">${P.hs.map((h) => `<i class="hpt" style="--h:${COUL[h]}"></i>`).join('')}${esc(P.t)}<small>${P.sous}</small></button>`).join('')}</div>
    <div class="ajout" data-role="ajout" id="ajout" hidden></div>
    <div class="rang"><span class="seg mom" role="radiogroup" aria-label="Moment du dry hop"><button role="radio" data-mom="dryActive" data-role="reglage" aria-checked="true">dry hop actif</button><button role="radio" data-mom="dryPost" data-role="reglage" aria-checked="false">après</button></span></div>
  </section>
  <div class="voies" id="voies">${['Citra', 'Galaxy', 'Idaho 7', 'Cascade'].map((h, i) => voie(h, i + 1)).join('')}</div>
  <section class="bloc" aria-label="Mesuré en bière, et ce qui manque">
    <div class="bloc-h"><span>Mesuré, et ce qui manque</span></div>
    <div class="fi-eb">${C('β-citronellol', ['floral', 'citrus'])} avec Citra : ${M(esc(e01.valeur), srcEtude('E01') + ' · ' + e01.lecture)} <span class="src-l">en bière, dose non indiquée</span></div>
    <div class="fi-eb">${C('linalol', ['floral'])} ${M('stable entre souches', 'H44 · ' + FAIT.biotransformation.linalol.texte)} <span class="src-l">12 souches, p = 0,82 : le floral ne suit pas la levure</span></div>
    <div class="fi-eb">${C('thiols', ['tropical'])} libérés : ${M('0,01–0,35 %', 'H42 · ' + FAIT.biotransformation.thiolsPrecurseurs.texte)} des précurseurs <span class="src-l">sur précurseur synthétique seulement</span></div>
    <div class="fi-eb">${INC('variété × levure × dry hop : aucune mesure croisée', 'comparatifs-dryhop.json')}</div>
    ${Y.plageLog({ ...rL, compose: 'linalol', fams: ['floral', 'citrus'], aria: 'Citra, linalol' })}
  </section>
  ${Y.legende([Y.legendeSection('Cartes', [['<i class="lx-carte"></i>', 'balaie : une levure par carte'], ['<span class="c-st st-documentée">documentée</span>', 'statut de sa biotransformation'], ['<i class="lx lx-g"></i>', 'pointillé : la même bière avec US-05'], ['<span class="ms">78–82 %</span>', 'fiche de la levure']])])}`;

const css = `
  .t-plan { font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 5px; flex-wrap: wrap; }
  .cle-l { display: flex; flex-wrap: wrap; gap: 2px 10px; font-size: 12px; color: var(--gris); }
  .cle-l span { display: inline-flex; align-items: center; gap: 4px; }
  .kl { display: inline-block; width: 14px; height: 9px; }
  .kl-b { background: linear-gradient(90deg, ${Y.J.floral.base} 0 33%, ${Y.J.citrus.base} 33% 66%, ${Y.J.tropical.base} 66%); border-radius: 0 2px 2px 0; } .kl-g { border: 1.5px dashed var(--encre); border-left: 0; height: 11px; } .kl-f { height: 1px; background: #6b6f7a; }
  .cq-l { font-size: 12px; font-weight: 700; min-width: 76px; }
  .note { font-size: 12px; color: var(--gris); min-height: 32px; }
  .lev-b { padding-left: 0; padding-right: 0; overflow: hidden; }
  .cartes { overflow: hidden; touch-action: pan-y; -webkit-user-select: none; user-select: none; }
  .rail { display: flex; gap: 10px; padding: 2px 0 4px; transform: translateX(var(--tx, 0px)); will-change: transform; }
  .rail.cale { transition: transform .22s cubic-bezier(.2,.8,.2,1); }
  .carte { flex: none; width: 300px; min-height: 176px; border-radius: 8px; background: #fff; box-shadow: inset 0 0 0 1.5px #c9cad2; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; text-align: left; font-size: 13px; color: var(--encre); transition: box-shadow .15s, transform .15s; }
  .carte[aria-pressed="true"] { box-shadow: inset 0 0 0 2.5px var(--encre), 0 6px 16px -10px rgba(22,22,26,.6); }
  .c-t { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
  .c-t b { font-size: 16px; }
  .c-st { font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 10px; background: #ececf1; white-space: nowrap; }
  .st-documentée { background: #e3f1ec; color: #24584d; } .st-paradoxe { background: #f6e9f1; color: #7a2f5b; } .st-qualitative { background: #fdf1e3; color: #7a4a0b; }
  .c-l { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .c-k { font-size: 12px; font-weight: 700; color: var(--gris); min-width: 74px; }
  .c-bio { display: flex; align-items: flex-start; gap: 6px; flex-wrap: wrap; padding: 6px 8px; border-radius: 8px; background: #f6f6f9; }
  .c-sim { display: flex; flex-direction: column; gap: 2px; }
  .c-sim b { font-family: var(--mono); font-weight: 600; }
  .c-sim > span { display: inline-flex; align-items: center; gap: 3px; flex-wrap: wrap; }
  .c-n { font-size: 12px; color: var(--gris); }
  .points { display: flex; align-items: center; gap: 4px; padding: 4px 10px 0; }
  .points .pt { flex: 1; height: 28px; border-radius: 14px; font-size: 13px; font-weight: 600; color: var(--gris); box-shadow: inset 0 0 0 1px #d4d6dd; background: #fff; }
  .points .pt.on { background: var(--encre); color: #fff; box-shadow: none; }
  .pts-l { padding: 2px 12px 0; }
  .plans { display: flex; flex-direction: column; gap: 4px; }
  .plan { min-height: 32px; padding: 3px 8px; border-radius: 8px; background: #fff; box-shadow: inset 0 0 0 1px #c9cad2; font-size: 13px; font-weight: 600; text-align: left; display: flex; flex-wrap: wrap; align-items: center; gap: 2px 4px; line-height: 1.15; }
  .plan small { margin-left: auto; font-size: 12px; font-weight: 400; color: var(--gris); }
  .plan[aria-pressed="true"] { box-shadow: inset 0 0 0 2px var(--encre); background: #f6f6f9; }
  .ajout { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 13px; } .ajout[hidden] { display: none; }
  .rang { display: flex; align-items: center; gap: 8px; } .seg.mom button { padding: 0 12px; }
  .plg-t small { font: 400 12px var(--sans); color: var(--gris); }
  .lx-carte { display: inline-block; width: 26px; height: 18px; border-radius: 4px; box-shadow: inset 0 0 0 1.5px var(--encre); }`;

const script = `
const D = DONNEES;
const LEVS = ${JSON.stringify(LEV)};
const ETAT = { plan: 'k4', mom: 'dryActive', k: 0 };
const sp = new Spectre(document.getElementById('spec'), { crans: 7 });
const INCONNU = FAM.map(() => [0, 0, 0, 0]);
const S = (lv) => D.sim[ETAT.plan + '|' + ETAT.mom + '|' + lv];
const P = () => D.plans.find((p) => p.id === ETAT.plan);
const pl = (o, u) => (o ? '<b data-nature="simule">~' + frn(o.centre) + ' ' + u + '</b> <span class="src-l">[' + frn(o.bas) + '–' + frn(o.haut) + ']</span>' : '');
// L'effet d'une levure est petit dans le moteur : écrit au dixième de cran, jamais arrondi à zéro.
function petits(p, ref) {
  if (!ref) return '<span class="cq-0">US-05 : inconnu</span>';
  const e = FAM.map((f, i) => ({ f, d: inconnuP(p[i]) || inconnuP(ref[i]) ? 0 : crans(i, p[i][1]) - crans(i, ref[i][1]) })).filter((x) => Math.abs(x.d) >= 0.05).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 3);
  return e.length ? e.map((x) => '<span class="cq">' + pictoH(x.f) + NOMF[x.f] + ' <b data-nature="simule">~' + (x.d > 0 ? '+' : '−') + frn(Math.abs(x.d), 1) + ' cran</b></span>').join('') : '<span class="cq-0" data-nature="simule">~ aucun écart, même profil</span>';
}
function cartes() {
  LEVS.forEach((lv) => {
    const b = D.bio[ETAT.plan + '|' + ETAT.mom + '|' + lv], el = document.querySelector('[data-sim="' + lv + '"]');
    if (!b) { el.innerHTML = D.sim[ETAT.plan + '|' + ETAT.mom + '|' + lv] ? '<span>comptée dans le profil (grille), sans chiffre par composé</span>' : '<span class="cq-0">pas simulé pour ce plan : inconnu</span>'; return; }
    if (!b.actif) { el.innerHTML = '<span>après : la levure est au repos, ~ rien de compté</span><span class="src-l">hop creep possible si elle vit encore</span>'; return; }
    el.innerHTML = b.par.map((a) => '<span>' + a.h + ' : ' + (a.cit ? pictoH('citrus') + 'citronellol ' + pl(a.cit, 'µg/L') : '') + (a.thi ? ' ' + pictoH('tropical') + 'thiols ' + pl(a.thi, 'ng/L') : '') + (!a.cit && !a.thi ? '<span class="src-l">' + (a.raison ? 'non chiffré' : 'rien') + '</span>' : '') + '</span>').join('');
  });
}
// Le profil suit le pouce : entre deux cartes, fondu des deux profils du moteur (la carte la plus proche donne les chiffres).
function profil(pos) {
  const a = Math.max(0, Math.min(LEVS.length - 1, Math.floor(pos))), b = Math.min(LEVS.length - 1, a + 1), t = pos - a;
  const pa = S(LEVS[a]), pb = S(LEVS[b]);
  if (!pa && !pb) return null;
  if (!pa || !pb || t < 0.02) return t < 0.5 ? pa : pb;
  return lerpP(pa, pb, t);
}
function rendreP(pos) {
  if (pos === undefined) pos = ETAT.k;
  const k = Math.round(pos), lv = LEVS[k], p = profil(pos), ref = S('US-05');
  sp.set({ p: p || INCONNU, ghost: lv !== 'US-05' ? ref : null, ref: ref || AVANT });
  document.getElementById('t-plan').innerHTML = P().hs.map((h) => '<i class="hpt" style="--h:' + D.couleurs[h] + '"></i><span class="hn" data-houblon="' + h + '">' + h + '</span>' + D.alpha[h]).join(P().sorte === 'k4' ? ' puis ' : ' + ') + ' · ' + (ETAT.mom === 'dryActive' ? 'dry hop actif' : 'après') + ' · ' + lv;
  document.getElementById('cq1').innerHTML = '<span class="cq-l">face à US-05</span>' + (!p ? '<span class="cq-0">inconnu : pas dans le moteur</span>' : lv === 'US-05' ? '<span class="cq-0">la référence</span>' : petits(p, ref));
  document.getElementById('note').textContent = ETAT.mom === 'dryPost' ? 'Après fermentation, le moteur ne fait plus agir la levure : les quatre cartes donnent la même bière.' : lv === 'Diamond' || lv === 'Verdant' ? 'Verdant et Diamond : même convention de thiols dans le moteur, donc même profil ; Samia mesure pourtant moins de fruité avec Diamond.' : '';
  document.querySelectorAll('.carte').forEach((c, i) => c.setAttribute('aria-pressed', String(i === k)));
  document.querySelectorAll('[data-p]').forEach((c, i) => c.classList.toggle('on', i === k));
}
function tout() {
  cartes(); rendreP();
  const aj = document.getElementById('ajout'), p = P();
  aj.hidden = p.hs.length < 2;
  aj.innerHTML = p.hs.map((h) => '<span class="hn" data-houblon="' + h + '"><i class="hpt" style="--h:' + D.couleurs[h] + '"></i>' + h + '</span>').join(' + ') + ' <span class="src-l">2 + 2 g/L dans le même dry hop : la dose totale compte</span>';
  document.querySelectorAll('[data-plan]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.plan === ETAT.plan)));
  document.querySelectorAll('[data-mom]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mom === ETAT.mom)));
  document.querySelectorAll('#voies .vh').forEach((v) => { v.hidden = !p.hs.includes(v.querySelector('[data-houblon]').dataset.houblon); });
}
window.rendre = () => tout();
// ---------- le geste : balayer les cartes ----------
const rail = document.getElementById('rail'), zone = document.getElementById('cartes');
const PAS = 310, centre = () => (zone.clientWidth - 300) / 2;
const txDe = (pos) => centre() - pos * PAS;
let TX = txDe(0), GL = null;
const poser = (tx, cale) => { rail.classList.toggle('cale', !!cale); TX = tx; rail.style.setProperty('--tx', tx + 'px'); };
function caler(k) { ETAT.k = Math.max(0, Math.min(LEVS.length - 1, k)); poser(txDe(ETAT.k), true); try { navigator.vibrate && navigator.vibrate(6); } catch (x) {} rendreP(); }
zone.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; GL = { id: e.pointerId, x0: e.clientX, tx0: TX, t0: performance.now(), x: e.clientX, bouge: false }; zone.setPointerCapture(e.pointerId); });
zone.addEventListener('pointermove', (e) => {
  if (!GL || GL.id !== e.pointerId) return;
  const dx = e.clientX - GL.x0; if (Math.abs(dx) > 6) GL.bouge = true;
  if (!GL.bouge) return;
  let tx = GL.tx0 + dx; const min = txDe(LEVS.length - 1), max = txDe(0);
  if (tx > max) tx = max + (tx - max) / 3; if (tx < min) tx = min + (tx - min) / 3;
  poser(tx); GL.v = (e.clientX - GL.x) / Math.max(1, e.timeStamp - (GL.ts || GL.t0)); GL.x = e.clientX; GL.ts = e.timeStamp;
  rendreP(Math.max(0, Math.min(LEVS.length - 1, (centre() - tx) / PAS)));
});
zone.addEventListener('pointerup', (e) => {
  if (!GL || GL.id !== e.pointerId) return;
  const g = GL; GL = null;
  if (!g.bouge) { const c = e.target.closest('.carte'); if (c) caler(+c.dataset.i); return; }
  const pos = (centre() - TX) / PAS, v = g.v || 0;
  caler(Math.round(pos - Math.max(-0.6, Math.min(0.6, v * 0.8))));
});
document.querySelectorAll('.carte').forEach((c) => c.addEventListener('click', (e) => { if (e.detail === 0 || e.pointerType === undefined) caler(+c.dataset.i); }));
document.querySelectorAll('.points .pt').forEach((b) => b.addEventListener('click', () => caler(+b.dataset.i)));
document.querySelectorAll('[data-plan]').forEach((b) => b.addEventListener('click', () => { ETAT.plan = b.dataset.plan; tout(); }));
document.querySelectorAll('[data-mom]').forEach((b) => b.addEventListener('click', () => { ETAT.mom = b.dataset.mom; tout(); }));
addEventListener('resize', () => poser(txDe(ETAT.k)));
{ const q = new URLSearchParams(location.search); if (q.get('plan')) ETAT.plan = q.get('plan'); if (q.get('k')) ETAT.k = +q.get('k'); if (q.get('mom')) ETAT.mom = q.get('mom'); }
poser(txDe(ETAT.k)); tout();
window.__releve = () => ({ plan: P().t, moment: ETAT.mom === 'dryActive' ? 'actif' : 'après', levure: LEVS[ETAT.k], change: document.getElementById('cq1').innerText.replace(/\\s+/g, ' ').trim(), crans: Object.fromEntries(sp.rows.map((c) => [c.dataset.famille, c.dataset.crans])), largeurs: Object.fromEntries(sp.rows.map((c) => [c.dataset.famille, Math.round(c.querySelector('.sp-b').getBoundingClientRect().width)])), bio: document.querySelector('[data-sim="' + LEVS[ETAT.k] + '"]').innerText.replace(/\\s+/g, ' ').trim(), tx: Math.round(TX) });
`;

Y.ecrire(path.join(ici, 'etat.html'), Y.page({
  titre: 'Les levures en cartes',
  commentaire: 'Lot 21 · y4 : balayer les levures (US-05, Pomona, Verdant, Diamond) du pouce, le profil suit le doigt ; fiche de chaque levure en vrai, biotransformation simulée par le moteur (K4, K5) ; un ou deux houblons ensemble ; actif ou après. Généré par generateur-y4.mjs (../y1/socle/socle.mjs).',
  css, corps, script, hs: ['Citra', 'Galaxy', 'Idaho 7', 'Cascade'],
  data: { sim, bio, plans: PLANS, couleurs: COUL, alpha: Object.fromEntries(['Citra', 'Galaxy', 'Idaho 7', 'Cascade'].map((h) => [h, Y.alpha(h)])) },
}));
