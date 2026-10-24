// Lot 21 · r2 « La frise » : quand, et combien de temps. Le dry hop jour par jour.
// Une frise des jours depuis l'ajout : une courbe par famille (au style : la ligne 16D est la même pour
// toutes ; absolu : 0–100), sa plage en bande pâle, et les repères mesurés posés sur le temps (24 h :
// l'essentiel ; 2 j : les thiols ; 3 j : plus rien de mesuré ; 1 h ≈ 96 h au panel chez Cascade). Au-delà
// de 3 j de contact, la zone hachurée : hop creep, végétal inconnu. Sous la frise, les barres de contact
// de chaque houblon (un seul, deux enchaînés, deux ensemble). Un curseur de jour donne le nez à J+x.
// La levure active (dry hop en fermentation) se voit en bande, avec sa biotransformation.
// Usage : node generateur-r2.mjs  →  r2/etat.html
import { D21, donnees, page, CSS, tete, legende, pas, ecrire } from '../r1/socle-r.mjs';
import { ic, picto } from '../../fils18-baseline/l8g/noyau.mjs';

const OUT = D21 + '/r2';
const DONNEES = JSON.stringify(donnees({ cas: (c) => ['K1', 'K2', 'K3', 'K4', 'K5'].includes(c.groupe), parJour: true, mesures: false }));

const CSS_R2 = `
  .q { font-size: 16px; font-weight: 700; line-height: 1.2; }
  .nez { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 10px; min-height: 44px; }
  .nez .j { font: 600 14px var(--mono); }
  .nez .fa { display: inline-flex; align-items: center; gap: 3px; font-weight: 700; }
  .nez .verdict { font-size: 13px; font-weight: 700; }
  .frise-z { position: relative; }
  .frise-z svg text { font-family: var(--sans); }
  .contacts { position: relative; display: flex; flex-direction: column; gap: 3px; }
  .ct { position: relative; height: 34px; }
  .ct .eti { position: absolute; top: 0; display: flex; align-items: center; gap: 5px; white-space: nowrap; font-size: 12px; }
  .ct .eti .hn { font-size: 13px; }
  .ct .duree { position: absolute; top: 22px; height: 8px; border-radius: 2px; }
  .ct .duree.c0 { background: #16161a; } .ct .duree.c1 { background: #fff; box-shadow: inset 0 0 0 2px #16161a; }
  .ct .bar { position: absolute; top: 3px; height: 20px; border-radius: 4px; display: flex; align-items: center; gap: 4px; padding: 0 6px; white-space: nowrap; font-size: 12px; overflow: visible; }
  .ct .bar .hn { font-size: 13px; }
  .ct .bar.c0 { background: #16161a; color: #fff; } .ct .bar.c0 .al, .ct .bar.c0 .al.lot::before, .ct .bar.c0 .mv b, .ct .bar.c0 .mv { color: #fff; }
  .ct .bar.c1 { background: #fff; color: #16161a; box-shadow: inset 0 0 0 2px #16161a; }
  .ct .bar .mv { font-size: 12px; } .ct .bar .mv b { font-size: 12px; }
  .curseur { display: flex; align-items: center; gap: 8px; }
  .curseur input { flex: 1; height: 32px; accent-color: #16161a; }
  .curseur .lab { font-size: 12px; color: var(--gris); width: 52px; }
  .choix { display: flex; flex-wrap: wrap; gap: 4px; }
  .bio { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 8px; background: #f6f6f9; font-size: 13px; line-height: 1.25; }
  .bio .fl { display: inline-flex; align-items: center; gap: 2px; font-weight: 700; }
  .bloc { display: flex; flex-direction: column; gap: 6px; padding-top: 4px; border-top: 1px solid var(--trait); }
  .bloc > h2 { font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
  .rep { display: grid; grid-template-columns: 44px 1fr; gap: 6px; align-items: baseline; font-size: 13px; line-height: 1.3; }
  .rep .t { font: 600 13px var(--mono); }
  .trou { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #4a4a55; }
  .ligne { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 13px; }`;

const corps = () => `
  ${tete(ic)}
  <p class="q">Quand, et combien de temps ?</p>
  <div class="regl"><span class="lab">Houblon<br><span class="src">1 ou 2</span></span><div class="pas hops" role="group" aria-label="Houblon : un seul, ou deux" id="hops"></div></div>
  <div id="mode-z"></div>
  <section class="simu" data-role="simulation" id="simu" aria-label="La frise simulée">
    <div class="nez" id="nez"></div>
    <div class="frise-z" id="frise"></div>
    <div class="contacts" id="contacts"></div>
    <div class="curseur"><span class="lab">Jour</span><input type="range" id="jour" min="0" max="12" step="0.5" value="12" data-role="reglage" data-reglage="jour" aria-label="Jour depuis l’ajout"></div>
  </section>
  <div id="contact-z"></div>
  ${pas('dh', 'Dry hop', [['dryActive', 'en fermentation'], ['dryPost', 'après']], 'dryPost', { aria: 'Moment du dry hop' })}
  ${pas('levure', 'Levure', [['US-05', 'US-05'], ['Verdant', 'Verdant'], ['Pomona', 'Pomona'], ['Diamond', 'Diamond']], 'US-05', { aria: 'Levure' })}
  <div id="biot"></div>
  <section class="bloc" id="reperes" aria-label="Repères mesurés"></section>
  ${legende(ic, picto, `
    <div class="leg-s"><h3>La frise</h3><div class="leg-g l1">
      <span class="leg-i"><span>Les jours depuis l’ajout. Une courbe par famille (~ simulé) ; la plage des deux familles que l’ajout apporte le plus, en bande pâle bordée de tirets. Au style, la ligne 16D est la limite de chaque famille ; au-dessus, hors du style.</span></span>
      <span class="leg-i"><span>Les traits verticaux : des repères mesurés (24 h, 2 j, 3 j), leur source au toucher. Hachures : au-delà de 3 j de contact, hop creep, végétal inconnu.</span></span>
      <span class="leg-i"><span>Sous la frise : la durée de contact de chaque houblon, sa dose et son α. Le curseur Jour donne le nez à ce jour.</span></span>
    </div></div>`)}`;

const JS = `
const ST = { hops: ['Citra', 'Galaxy'], mode: 'enchaine', jours: 3, dh: 'dryPost', lev: 'US-05', t: 12 };
{ const q = new URLSearchParams(location.search); if (q.get('h')) ST.hops = q.get('h').split(',').slice(0, 2); if (q.get('mode')) ST.mode = q.get('mode'); if (q.get('j')) ST.jours = Number(q.get('j')); if (q.get('dh')) ST.dh = q.get('dh'); if (q.get('l')) ST.lev = q.get('l'); if (q.get('t')) ST.t = Number(q.get('t')); }
const ABS = () => document.body.classList.contains('abs');
const n = (x) => x.toLowerCase().replace(' ', '-');
const MOM = { dryActive: 'actif', dryPost: 'apres' };
const LVK = { 'US-05': 'us05', Pomona: 'pomona', Verdant: 'verdant', Diamond: 'diamond' };
const ORD = ['Citra', 'Galaxy', 'Idaho 7', 'Cascade'];
const JOURS = [1, 2, 3, 5, 7];
/* La série du scénario : [[t, profil]] et ses ajouts ; null si pas simulé. */
function scenario() {
  const lv = ST.lev, dh = ST.dh;
  if (ST.hops.length === 1) {
    const hp = ST.hops[0], c = ST.jours;
    /* 4 g/L, 3 j, US-05 : le cas du moteur porte son parJour (K1, K2) */
    const cid = c === 3 && lv === 'US-05' ? (D.CAS['K1-' + n(hp) + '-' + dh] || D.CAS['K2-' + n(hp)] && dh === 'dryPost' && D.CAS['K2-' + n(hp)]) : null;
    if (cid && cid.j && cid.j.length) return { pts: cid.j.map(([t, pk]) => [t, prof(pk)]), ajouts: cid.ajouts, fin: prof(cid.p), titre: cid.titre, cas: cid };
    const pts = [[0, AVANT]];
    for (const j of JOURS) if (j <= c) { const p = G(hp, dh, 4, j, lv); if (!p) return null; pts.push([j, p]); }
    const fin = G(hp, dh, 4, c, lv); if (!fin) return null; pts.push([Math.max(8, c + 3), fin]);
    return { pts, ajouts: [{ houblon: hp, dose_gL: 4, jourDebut: 0, jours: c }], fin, titre: hp + ' 4 g/L, ' + c + ' j' };
  }
  const [a, b] = ST.hops.slice().sort((u, v) => ORD.indexOf(u) - ORD.indexOf(v));
  let id;
  if (ST.mode === 'ensemble') id = 'K5-' + n(a) + '+' + n(b) + '-' + MOM[dh] + '-' + LVK[lv];
  else if (a === 'Citra' && b === 'Idaho 7') id = lv === 'US-05' && dh === 'dryPost' ? 'K3-citra3-idaho7-5' : 'K4-' + LVK[lv] + '-' + MOM[dh];
  else if (a === 'Citra' && b === 'Galaxy' && lv === 'US-05' && dh === 'dryPost') id = 'K3-citra3-galaxy7';
  const c = id && D.CAS[id]; if (!c || !c.j || !c.j.length) return null;
  return { pts: c.j.map(([t, pk]) => [t, prof(pk)]), ajouts: c.ajouts, fin: prof(c.p), titre: c.titre, cas: c };
}
const profilA = (sc, t) => { let best = sc.pts[0]; for (const q of sc.pts) if (q[0] <= t + 1e-6) best = q; return best[1]; };
/* ---------- la frise ---------- */
const GEO = { W: 366, H: 214, x0: 6, x1: 296, y0: 10, y1: 176 };
function X(t, T) { return GEO.x0 + t / T * (GEO.x1 - GEO.x0); }
let LMAX = 2.2;
function Yl(f, v) { const l = ABS() ? v / 100 : niv(f, v) / LMAX; return GEO.y1 - Math.max(0, Math.min(1, l)) * (GEO.y1 - GEO.y0); }
function frise(sc) {
  const T = Math.max(8, ...sc.ajouts.map((a) => a.jourDebut + a.jours + 2));
  LMAX = Math.max(2.2, Math.min(3.6, Math.max(...FAM.map((f) => niv(f, sc.fin[f].c))) + 0.25));
  const v = s('svg', { width: GEO.W, height: GEO.H, viewBox: '0 0 ' + GEO.W + ' ' + GEO.H, role: 'img', 'data-nature': 'simule', 'aria-label': '~ simulé : ' + sc.titre });
  const defs = s('defs', {}, v);
  const pat = s('pattern', { id: 'hc', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs); s('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: '#9a9aa6', 'stroke-width': 1.2 }, pat);
  const po = s('pattern', { id: 'ho', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs); s('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: ACC, 'stroke-width': 1.2, 'stroke-opacity': 0.25 }, po);
  /* au style : au-dessus de la ligne 16D, hors du style (hachures orangées pâles) ; la zone en dessous est celle du style */
  const y16 = GEO.y1 - (1 / LMAX) * (GEO.y1 - GEO.y0);
  if (!ABS()) { s('rect', { x: GEO.x0, y: GEO.y0, width: GEO.x1 - GEO.x0, height: y16 - GEO.y0, fill: 'url(#ho)' }, v);
    s('rect', { x: GEO.x0, y: y16, width: GEO.x1 - GEO.x0, height: GEO.y1 - y16, fill: '#f6f6f9', 'data-role': 'zone' }, v);
    s('line', { x1: GEO.x0, y1: y16, x2: GEO.x1 + 4, y2: y16, stroke: '#16161a', 'stroke-width': 1.5, 'stroke-dasharray': '5 3' }, v);
    const t = s('text', { x: GEO.x0 + 4, y: y16 - 5, 'font-size': 12, 'font-weight': 700, fill: '#16161a' }, v); t.textContent = '16D';
    const t2 = s('text', { x: GEO.x0 + 4, y: GEO.y0 + 12, 'font-size': 12, 'font-weight': 700, fill: '#c2410c' }, v); t2.textContent = 'hors 16D'; }
  else { s('rect', { x: GEO.x0, y: GEO.y0, width: GEO.x1 - GEO.x0, height: GEO.y1 - GEO.y0, fill: '#fafafc', 'data-role': 'zone' }, v);
    for (const [l, m] of [[33, 'faible'], [66, 'moyen']]) { const y = GEO.y1 - l / 100 * (GEO.y1 - GEO.y0); s('line', { x1: GEO.x0, y1: y, x2: GEO.x1, y2: y, stroke: '#dcdce3' }, v); const t = s('text', { x: GEO.x0 + 4, y: y - 3, 'font-size': 12, fill: '#4a4a55' }, v); t.textContent = m; } }
  /* au-delà de 3 j de contact : hop creep, végétal inconnu */
  for (const a of sc.ajouts) if (a.jours > 3) { const xa = X(a.jourDebut + 3, T), xb = X(a.jourDebut + a.jours, T); s('rect', { x: xa, y: GEO.y0, width: xb - xa, height: GEO.y1 - GEO.y0, fill: 'url(#hc)', 'fill-opacity': 0.5 }, v);
    const t = s('text', { x: (xa + xb) / 2, y: GEO.y1 - 6, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: '#4a4a55' }, v); t.textContent = 'hop creep ?'; }
  /* les repères mesurés, posés depuis le premier ajout */
  const t0 = sc.ajouts[0].jourDebut;
  for (const [j, lab] of [[1, '24 h'], [2, '2 j'], [3, '3 j']]) { const x = X(t0 + j, T); s('line', { x1: x, y1: GEO.y0, x2: x, y2: GEO.y1, stroke: '#9a9aa6', 'stroke-width': 1, 'stroke-dasharray': '2 3' }, v); }
  /* les courbes : les 4 familles les plus fortes à la fin ; bande pâle bas–haut, trait du ton de la famille */
  const fams = tri(sc.fin).slice(0, 4).filter((f) => sc.fin[f].c >= 5);
  const fin = [];
  const apport = fams.filter((f) => !DEJA.includes(f)).sort((a, b) => (sc.fin[b].c - AVANT[b].c) - (sc.fin[a].c - AVANT[a].c)).slice(0, 2);
  for (const f of apport) {
    const up = sc.pts.map(([t, p]) => X(t, T) + ',' + Yl(f, p[f].h)), dn = sc.pts.slice().reverse().map(([t, p]) => X(t, T) + ',' + Yl(f, p[f].b));
    s('polygon', { points: up.concat(dn).join(' '), fill: D.TON[f].base, 'fill-opacity': 0.13, stroke: D.TON[f].base, 'stroke-opacity': 0.5, 'stroke-dasharray': '3 3', 'data-famille': f }, v);
    const last = sc.pts[sc.pts.length - 1][1][f];
    if (Yl(f, last.h) <= GEO.y0 + 0.5) { const x = GEO.x1 - 6 - apport.indexOf(f) * 9; s('path', { d: 'M' + (x - 4) + ',' + (GEO.y0 + 6) + ' L' + x + ',' + GEO.y0 + ' L' + (x + 4) + ',' + (GEO.y0 + 6), fill: 'none', stroke: D.TON[f].texte, 'stroke-width': 1.6 }, v); }
  }
  if (apport.some((f) => Yl(f, sc.fin[f].h) <= GEO.y0 + 0.5)) { const t = s('text', { x: GEO.x1 - 4, y: GEO.y0 + 18, 'text-anchor': 'end', 'font-size': 12, fill: '#4a4a55' }, v); t.textContent = 'plage plus haute ↑'; }
  for (const f of fams) {
    s('polyline', { points: sc.pts.map(([t, p]) => X(t, T) + ',' + Yl(f, p[f].c)).join(' '), fill: 'none', stroke: D.TON[f].base, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, v);
    for (const [t, p] of sc.pts) if (t > 0 && sc.ajouts.some((a) => t - a.jourDebut > 0 && t - a.jourDebut <= 3 && Math.abs(t - Math.round(t)) < 1e-6 || Math.abs(t - a.jourDebut - 0.5) < 1e-6)) s('circle', { cx: X(t, T), cy: Yl(f, p[f].c), r: 2.5, fill: '#fff', stroke: D.TON[f].texte, 'stroke-width': 1.5 }, v);
    fin.push({ f, y: Yl(f, sc.fin[f].c) });
  }
  /* les noms au bout des courbes, écartés pour ne pas se chevaucher */
  fin.sort((a, b) => a.y - b.y); for (let i = 1; i < fin.length; i++) if (fin[i].y - fin[i - 1].y < 17) fin[i].y = fin[i - 1].y + 17;
  for (const q of fin) { s('use', { href: '#p-' + q.f, x: GEO.x1 + 4, y: q.y - 8, width: 16, height: 16 }, v); const t = s('text', { x: GEO.x1 + 22, y: q.y + 4, 'font-size': 12, 'font-weight': 700, fill: sc.fin[q.f].c > lim(q.f) && !ABS() ? '#c2410c' : D.TON[q.f].texte }, v); t.textContent = D.COURT[q.f]; }
  /* l'axe des jours */
  for (const j of [0, 1, 2, 3, 5, 7, 10, 12].filter((j) => j <= T)) { const x = X(j, T); const t = s('text', { x, y: GEO.y1 + 22, 'text-anchor': 'middle', 'font-size': 12, fill: '#4a4a55' }, v); t.textContent = j === 0 ? 'J0' : j === 1 ? '24 h' : j + ' j'; }
  /* le curseur du jour */
  const xc = X(Math.min(ST.t, T), T); s('line', { x1: xc, y1: GEO.y0 - 4, x2: xc, y2: GEO.y1 + 10, stroke: '#16161a', 'stroke-width': 2 }, v);
  v.__T = T;
  return v;
}
/* ---------- la page ---------- */
function rendreHops() {
  const z = document.getElementById('hops'); z.replaceChildren();
  for (const hop of ORD) { const on = ST.hops.includes(hop);
    const b = h('button', { 'data-role': 'reglage', 'data-reglage': 'houblon', 'data-valeur': hop, 'aria-pressed': String(on) }, nomH(hop), alphaEl(hop));
    b.addEventListener('click', () => { const i = ST.hops.indexOf(hop); if (i >= 0) { if (ST.hops.length > 1) ST.hops.splice(i, 1); } else { ST.hops.push(hop); if (ST.hops.length > 2) ST.hops.shift(); } rendre(); });
    z.append(b); }
  const M = document.getElementById('mode-z'); M.replaceChildren();
  if (ST.hops.length === 2) {
    const [a, b] = ST.hops.slice().sort((u, v) => ORD.indexOf(u) - ORD.indexOf(v));
    const enchOk = a === 'Citra' && (b === 'Galaxy' || b === 'Idaho 7');
    if (!enchOk && ST.mode === 'enchaine') ST.mode = 'ensemble';
    const r = h('div', { class: 'regl' }, h('span', { class: 'lab' }, 'Deux'), h('div', { class: 'pas', role: 'group', 'aria-label': 'Deux houblons : enchaînés ou ensemble' },
      h('button', { 'data-role': 'reglage', 'data-reglage': 'ajout-cumule', 'data-valeur': 'enchaine', 'aria-pressed': String(ST.mode === 'enchaine'), disabled: enchOk ? null : 'disabled', onclick: () => { ST.mode = 'enchaine'; rendre(); } }, a + ' 3 j → ' + b),
      h('button', { 'data-role': 'reglage', 'data-reglage': 'ajout-cumule', 'data-valeur': 'ensemble', 'aria-pressed': String(ST.mode === 'ensemble'), onclick: () => { ST.mode = 'ensemble'; rendre(); } }, 'ensemble 2 + 2')));
    M.append(r);
  }
  const C = document.getElementById('contact-z'); C.replaceChildren();
  if (ST.hops.length === 1) C.append(h('div', { class: 'regl' }, h('span', { class: 'lab' }, 'Contact'), h('div', { class: 'pas', role: 'group', 'aria-label': 'Jours de contact' },
    ...[1, 2, 3, 5, 7].map((j) => h('button', { 'data-role': 'reglage', 'data-reglage': 'contact', 'data-valeur': String(j), 'aria-pressed': String(ST.jours === j), onclick: () => { ST.jours = j; ST.t = 12; rendre(); } }, j + ' j')))));
}
function rendreNez(sc, T) {
  const Z = document.getElementById('nez'); Z.replaceChildren();
  if (!sc) { Z.append(conf('inconnu', 'inconnu'), h('span', {}, 'Pas simulé pour cette combinaison (ni zéro, ni moyenne) : ' + (ST.hops.length === 2 && ST.mode === 'enchaine' ? 'enchaîné seulement Citra → Galaxy ou Idaho 7' : 'levure ou moment hors des cas'))); return; }
  const t = Math.min(ST.t, T), p = profilA(sc, t), hs = horsStyle(p);
  Z.append(h('span', { class: 'j' }, t === 0 ? 'J0' : t < 1 ? fr(t * 24, 0) + ' h' : 'J+' + fr(t, 1)), conf('~ simulé', 'estime'));
  const f3 = tri(p).filter((f) => p[f].c >= 10).slice(0, 3);
  if (!f3.length) Z.append(h('span', { 'data-nature': 'simule' }, '~ presque rien au nez'));
  for (const [i, f] of f3.entries()) Z.append(h('span', { class: 'fa', 'data-nature': 'simule', style: 'font-size:' + (i === 0 ? 17 : i === 1 ? 15 : 13) + 'px;color:' + (p[f].c > lim(f) ? '#c2410c' : D.TON[f].texte) }, pic(f, i === 0 ? 20 : 16), D.COURT[f]));
  Z.append(h('span', { class: 'verdict' + (hs.length ? ' hors' : ''), 'data-nature': 'simule' }, hs.length ? '~ déborde de la 16D' : '~ dans la 16D'));
}
function rendreContacts(sc, T) {
  const Z = document.getElementById('contacts'); Z.replaceChildren(); if (!sc) return;
  sc.ajouts.forEach((a, i) => { const x = X(a.jourDebut, T), w = X(a.jourDebut + a.jours, T) - x;
    Z.append(h('div', { class: 'ct', 'data-voie': 'ajout-' + i }, h('div', { class: 'eti', style: 'left:' + Math.min(x, 366 - 210) + 'px' }, nomH(a.houblon), alphaEl(a.houblon),
      mesure(fr(a.dose_gL, 0), 'recette', { unite: 'g/L', dit: 'dose du scénario', source: 'recette' }), mesure(a.jours + ' j', 'recette', { dit: 'jours de contact', source: 'recette' })),
      h('i', { class: 'duree c' + (i % 2), style: 'left:' + x + 'px;width:' + w + 'px', 'aria-hidden': 'true' }))); });
  /* un ajout cumulé : un seul bloc qui porte les deux houblons */
  if (sc.ajouts.length === 2 && sc.ajouts[1].jourDebut === sc.ajouts[0].jourDebut) { const w = h('div', { 'data-role': 'ajout', class: 'contacts', 'aria-label': 'deux houblons ensemble' }); while (Z.firstChild) w.append(Z.firstChild); Z.append(w); }
}
const BIO = {
  'US-05': ['floral', 'floral', 'géraniol et nérol un peu plus hauts', 'H44'],
  Verdant: ['tropical', 'tropical', 'β-lyase : thiols libérés, 0,01–0,35 % des précurseurs (de synthèse)', 'H42'],
  Pomona: ['floral', 'citrus', 'géraniol → citronellol « medium »', 'H50-pomona'],
  Diamond: ['tropical', 'tropical', 'le plus de thiols mesurés, le fruité perçu le plus faible', 'samia2026'],
};
function rendreBio(svg) {
  const Z = document.getElementById('biot'); Z.replaceChildren();
  if (ST.dh === 'dryPost') { Z.append(h('div', { class: 'bio', 'data-role': 'biotransformation' }, h('span', {}, 'Après fermentation : levure au repos, biotransformation ', h('b', {}, 'hors du cas'), '. Le hop creep reste possible (levure vivante).'))); return; }
  const [a, b, t, src] = BIO[ST.lev];
  Z.append(h('div', { class: 'bio', 'data-role': 'biotransformation' }, h('span', { class: 'fl' }, pic(a, 16), a !== b ? '→' : '', a !== b ? pic(b, 16) : null), h('span', {}, ST.lev + ' en fermentation : ' + t + ' ', srcB(src, t), ' · ', conf('sens', 'panel'))));
  if (svg) { const T = svg.__T, x = X(0, T), w = X(3, T) - x; s('rect', { x, y: GEO.y1 + 28, width: w, height: 4, fill: '#16161a', 'data-role': 'biotransformation' }, svg);
    const tt = s('text', { x: x + 2, y: GEO.y1 + 46, 'font-size': 12, fill: '#16161a', 'font-weight': 700 }, svg); tt.textContent = 'levure active'; svg.setAttribute('height', GEO.H + 22); }
}
function rendreReperes() {
  const Z = document.getElementById('reperes'); Z.replaceChildren(h('h2', {}, 'Repères mesurés sur le temps ', conf('mesuré', 'mesure')));
  const L = [
    ['24 h', D.DR.essentiel24h.t, 'H73', D.DR.essentiel24h.d],
    ['2 j', 'Les thiols passent surtout les 2 premiers jours (Eureka!, 2,5 g/L).', 'E08', D.COMP.E08.texte],
    ['3 j', D.DR.plafond3j.t, 'H73', D.DR.plafond3j.d],
    ['1 h', 'Cascade, 1,43 g/L : aucune différence perçue entre 1 h et 96 h.', 'E10', D.COMP.E10.texte],
    ['6 h', 'Cascade, 3,86 g/L : linalol extrait 43 % au repos, 89 % agité.', 'E05', D.COMP.E05.texte + ' (thèse)'],
    ['> 3 j', 'Hop creep : 10 g/L, 7 j, levure ale : +0,92 % vol. (T-90), +1,05 (cryo).', 'H68', D.DR.hopCreep.d],
  ];
  for (const [t, txt, src, dit] of L) Z.append(h('div', { class: 'rep' }, h('span', { class: 't' }, t), h('span', {}, txt + ' ', srcB(src, dit, 'source : ' + txt))));
  if (ST.hops.length === 2) Z.append(h('div', { class: 'trou' }, conf('inconnu', 'inconnu'), D.DR.ordre.t + ' ' + D.DR.synergie.t));
  Z.append(h('div', { class: 'trou' }, conf('inconnu', 'inconnu'), D.DR.vegetal.t));
  if (ST.lev !== 'US-05') Z.append(h('div', { class: 'trou' }, conf('inconnu', 'inconnu'), D.COMP.trous[3]));
}
function rendre() {
  rendreHops();
  document.querySelectorAll('[data-reglage="dh"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.valeur === ST.dh)));
  document.querySelectorAll('[data-reglage="levure"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.valeur === ST.lev)));
  const sc = scenario(), F = document.getElementById('frise');
  let svg = null, T = 12;
  if (sc) { svg = frise(sc); T = svg.__T; F.replaceChildren(svg); } else F.replaceChildren();
  const J = document.getElementById('jour'); J.max = String(T); if (ST.t > T) ST.t = T; J.value = String(ST.t);
  rendreNez(sc, T); rendreContacts(sc, T); rendreBio(svg); rendreReperes();
}
document.querySelectorAll('[data-reglage="dh"]').forEach((b) => b.addEventListener('click', () => { ST.dh = b.dataset.valeur; rendre(); }));
document.querySelectorAll('[data-reglage="levure"]').forEach((b) => b.addEventListener('click', () => { ST.lev = b.dataset.valeur; rendre(); }));
document.getElementById('jour').addEventListener('input', (e) => { ST.t = Number(e.target.value); rendre(); });
document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => setTimeout(rendre, 0)));
rendre();
`;

ecrire(OUT + '/etat.html', page({
  titre: 'La frise · r2',
  description: 'Lot 21 · r2 « La frise » : le dry hop jour par jour. Une courbe par famille (~ simulé) avec sa plage, la ligne 16D, les repères mesurés (24 h, 2 j, 3 j, 1 h ≈ 96 h) et la zone du hop creep au-delà de 3 j ; sous la frise, les barres de contact de chaque houblon (seul, enchaînés, ensemble) avec dose et α ; un curseur de jour, la levure active et sa biotransformation. Générée par generateur-r2.mjs (../r1/socle-r.mjs).',
  css: CSS + CSS_R2, corps: corps(), js: JS, donneesJS: DONNEES,
}));
