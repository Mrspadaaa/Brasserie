// Lot 21 · r3b « Jusqu'où » : r3 (la carte) avec son premier plan inversé, d'après le critique
// (critique/r.md, SYNTHESE.md §2 et §3). r3 reste intacte.
// Premier plan : la LISTE « dose limite par houblon ». Une ligne par houblon, rangée par sa dose limite
// (classement par critère, pas un « meilleur ») : jusqu'où il reste dans ma 16D (~ simulé, ≈ interpolé
// entre deux doses de la grille), la famille qui le fait sortir, et sa barre de dose de 0 à 8 g/L où les
// 20 brassins simulés sont posés à LEUR dose limite (un quantile dotplot) : le curseur de dose compte ceux
// qui restent dans la 16D. Le houblon touché déplie sa dose limite à chaque moment.
// Ensuite, à un toucher : la carte des chemins (une couleur par houblon), « Pourquoi si large ? ».
// Les 12 retouches communes : départ en dry hop EN FERMENTATION avec US-05 ; les données restent,
// l'explication part ; le geste au premier écran ; le résineux de ma dégustation une fois, hors de la
// figure ; aucun code sans mot ; une marque de borne haute partielle par barre ; Lafontaine 2018 selon la
// lecture H, « vérifié (K) » ; profils-simules.json à 4,75 % vol. ; le stock ne bloque rien ; les acquis
// de la baseline ; hors grille : aimant au cas simulé le plus proche, dit ; tirages fixes à réglages fixes.
// Usage : node generateur-r3b.mjs  →  r3b/etat.html
import fs from 'node:fs';
import { D21, donnees, page, CSS, tete, legende, ecrire } from '../r1/socle-r.mjs';
import { ic, picto } from '../../fils18-baseline/l8g/noyau.mjs';

const OUT = D21 + '/r3b';
const E04 = JSON.parse(fs.readFileSync(D21 + '/donnees/comparatifs-dryhop.json', 'utf8')).etudes.find((e) => e.id === 'E04');
const ser = (k) => E04.mesures.filter((m) => (m.descripteur || m.compose || '').startsWith(k)).map((m) => m.valeur);
const DOSE_E04 = { doses: [0, 2, 3.86, 8, 16], agrumes: ser('citrus'), herbace: ser('herbal'), intensite: ser('OHAI').concat(ser('intensité')).slice(0, 5) };
const BASE = donnees({ cas: (c) => ['K1', 'K2'].includes(c.groupe) });
BASE.E04 = DOSE_E04;
const DONNEES = JSON.stringify(BASE);

const CSS_R3B = `
  .deg { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--gris); }
  .deg .pi { width: 14px; height: 14px; }
  .q { font-size: 16px; font-weight: 700; line-height: 1.2; }
  .rep { font-size: 13px; line-height: 1.3; min-height: 34px; }
  .regs { display: flex; flex-direction: column; gap: 6px; }
  .pas.m button { font-size: 12px; }
  .dose-z { display: flex; align-items: center; gap: 8px; }
  .dose-z .lab { font-size: 12px; color: var(--gris); width: 52px; flex: none; }
  .dose-z input { flex: 1; height: 32px; accent-color: #16161a; }
  .dose-z .val { font: 600 13px var(--mono); flex: none; width: 132px; text-align: right; white-space: nowrap; }
  .nonsim { font-size: 12px; color: var(--gris); margin: -2px 0 0 58px; }
  .liste { display: flex; flex-direction: column; gap: 6px; }
  .lg { display: flex; flex-direction: column; gap: 2px; padding: 6px 6px 6px 8px; border-radius: 8px; background: #fff; box-shadow: inset 0 0 0 1px var(--trait); text-align: left; width: 100%; }
  .lg[aria-pressed="true"] { box-shadow: inset 0 0 0 2px var(--encre); }
  .lg .l1 { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .lg .sw { display: inline-block; width: 12px; height: 12px; border-radius: 2px; flex: none; }
  .lg .hn { font-size: 14px; }
  .lg .stk { display: inline-flex; color: #8a8a96; }
  .lg .lim { margin-left: auto; font-size: 14px; font-weight: 700; }
  .lg .lim .mono { font-size: 14px; }
  .lg .lim.hors { color: var(--acc); }
  .lg .l3 { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; font-size: 12px; color: #4a4a55; }
  .lg .l3 .pi { width: 14px; height: 14px; }
  .lg .l4 { display: flex; gap: 2px 10px; flex-wrap: wrap; font-size: 12px; color: #4a4a55; padding-top: 2px; border-top: 1px dashed var(--trait); }
  .lg .l4 b { font: 600 12px var(--mono); color: var(--encre); }
  .lg .l4 .on { text-decoration: underline 2px; text-underline-offset: 3px; }
  .emp { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; padding: 6px 8px; border-radius: 8px; font-size: 12px; color: #4a4a55; background: repeating-linear-gradient(135deg, #fff 0 4px, #f1f1f4 4px 7px); box-shadow: inset 0 0 0 1px var(--trait); }
  .emp .hn { font-size: 13px; }
  .ouvre[aria-expanded="true"] { text-decoration-thickness: 2px; }
  .bloc { display: flex; flex-direction: column; gap: 6px; padding-top: 4px; border-top: 1px solid var(--trait); }
  .bloc[hidden] { display: none; }
  .bloc > h2 { font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .ligne { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 13px; min-height: 24px; }
  .ligne .pi { width: 16px; height: 16px; }
  .ligne .k { color: var(--gris); font-size: 12px; min-width: 64px; }
  .barreh { position: relative; height: 10px; background: #ececf1; border-radius: 2px; flex: 1; min-width: 120px; }
  .barreh i { position: absolute; top: 0; bottom: 0; border-radius: 2px; }
  .trou { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #4a4a55; }
  .large { font: 700 13px var(--mono); color: var(--encre); background: #f1f1f4; padding: 1px 5px; border-radius: 4px; }
  .carte-z svg text, .lg svg text { font-family: var(--sans); }`;

const corps = () => `
  ${tete(ic)}
  <p class="deg" data-nature="mesure" data-source="dégustation" data-src="degust" data-src-texte="« ma stout est trop résineuses, je la veux plus floral », 18.10">${picto('resin', 14)}Ma bière : résineux marqué, ta dégustation, déjà hors 16D</p>
  <p class="q">Jusqu’où chaque houblon reste dans ma 16D ?</p>
  <p class="rep" id="rep" data-role="simulation"></p>
  <div class="regs">
    <div class="regl"><span class="lab">Moment</span><div class="pas m" role="group" aria-label="Moment de l’ajout" id="moments"></div></div>
    <div class="regl"><span class="lab">Levure</span><div class="pas" role="group" aria-label="Levure" id="levures"></div></div>
    <p class="nonsim" id="nonsim">Verdant, Diamond : pas encore simulées.</p>
    <div class="regl"><span class="lab">Ensemble</span><div class="pas" role="group" aria-label="Deux houblons ensemble, 2 + 2 g/L" id="paires"></div></div>
    <div class="dose-z"><span class="lab">Dose</span><input type="range" id="dose" min="0.5" max="8" step="0.5" value="2" data-role="reglage" data-reglage="dose" aria-label="Dose de chaque houblon, g/L"><span class="val" id="dose-v"></span></div>
  </div>
  <section class="liste" id="liste" data-role="simulation" aria-label="Dose limite par houblon, ~ simulé"></section>
  <div id="empruntes"></div>
  <button class="ouvre" id="voir-carte" aria-expanded="false" aria-controls="carte-b">La carte des chemins de dose ›</button>
  <section class="bloc" id="carte-b" hidden data-role="simulation" aria-label="La carte, ~ simulé"><div class="carte-z" id="carte"></div></section>
  <button class="ouvre" id="voir-pq" aria-expanded="false" aria-controls="incert">Pourquoi si large ? ›</button>
  <section class="bloc" id="incert" hidden aria-label="L’incertitude réelle"></section>
  ${legende(ic, picto, `
    <div class="leg-s"><h3>La liste</h3><div class="leg-g l1">
      <span class="leg-i"><span>Une ligne par houblon, rangée par sa dose limite : la dose où il sort de la 16D (~ simulé, ≈ interpolé entre deux doses de la grille du moteur : 1, 2, 4, 8 g/L).</span></span>
      <span class="leg-i"><span>Sur sa barre de 0 à 8 g/L : en pâle, dans la 16D ; hachuré, hors 16D. Les 20 points : 20 brassins simulés, chacun posé à sa propre dose limite. Le trait noir : la dose réglée ; les points à sa droite sont encore dans la 16D.</span></span>
      <span class="leg-i"><span>« haut partiel » : une borne haute non publiée ; le vrai haut peut être plus haut.</span></span>
      <span class="leg-i"><span>« ma bière incertaine » : dans ces brassins simulés, ma bière dépasse déjà la 16D sur une famille (sa propre plage, haute faute de valeurs publiées pour Nugget) ; l’ajout y est jugé sur les autres familles.</span></span>
      <span class="leg-i"><span>Le curseur glisse au demi-gramme ; le moteur simule 1, 2, 4 et 8 g/L : la page s’aimante à la dose simulée la plus proche et le dit.</span></span>
    </div></div>`)}`;

const JS = `
const HOPS = ['Citra', 'Galaxy', 'Idaho 7', 'Cascade'], EMPR = ['Motueka', 'Nelson Sauvin'];
const COUL = { Citra: '#0b5fa5', Galaxy: '#5a3c9e', 'Idaho 7': '#a8326e', Cascade: '#0f7a6c' };
const MOMS = [['b60', '60′'], ['b10', '10′'], ['wp', 'whirl.'], ['dryActive', 'en ferm.'], ['dryPost', 'après']];
const MLONG = { b60: 'à 60′', b10: 'à 10′', wp: 'au whirlpool', dryActive: 'en fermentation', dryPost: 'après fermentation' };
const ST = { moment: 'dryActive', lev: 'US-05', dose: 2, choisi: 'Citra', touche: false, carte: false, pq: false, paire: null };
{ const q = new URLSearchParams(location.search); if (q.get('m')) ST.moment = q.get('m'); if (q.get('l')) ST.lev = q.get('l'); if (q.get('d')) ST.dose = Number(q.get('d')); if (q.get('h')) { ST.choisi = q.get('h'); ST.touche = true; } if (q.has('carte')) ST.carte = true; if (q.has('pq')) ST.pq = true; if (q.get('p')) ST.paire = q.get('p').split(','); }
const DH = (m) => m === 'dryActive' || m === 'dryPost';
const ABS = () => document.body.classList.contains('abs');
const DOSES = [1, 2, 4, 8];
const aimant = (d) => DOSES.reduce((a, b) => (Math.abs(b - d) < Math.abs(a - d) ? b : a), DOSES[0]);
const levM = (m) => (DH(m) ? ST.lev : 'US-05');
const profilH = (hop, d, m = ST.moment) => G(hop, m, d, DH(m) ? 3 : null, levM(m));
const nonDeja = FAM.filter((f) => !DEJA.includes(f));
const ex = (vals, excl = []) => Math.max(0, ...nonDeja.filter((f) => !excl.includes(f)).map((f) => vals[f] / lim(f)));
const cen = (p) => Object.fromEntries(FAM.map((f) => [f, p[f].c]));
/* la dose limite : là où le plus fort multiple de limite 16D passe 1 ; ≈ interpolé entre deux doses de la grille */
/* excl : les familles que ma bière dépasse déjà dans ce tirage ; l'ajout est jugé sur les autres. */
function limiteDe(serie, excl = []) {
  let d0 = 0, e0 = ex(serie[0][1], excl);
  if (e0 > 1) return { d: 0, deja: true };
  for (const [d, v] of serie.slice(1)) { const e1 = ex(v, excl); if (e1 > 1) { const k = (1 - e0) / (e1 - e0); const f = nonDeja.filter((x) => !excl.includes(x)).sort((a, b) => v[b] / lim(b) - v[a] / lim(a))[0]; return { d: d0 + k * (d - d0), f }; } d0 = d; e0 = e1; }
  return { d: null, plus: true };
}
const CACHE = {};
function lecture(hop, m = ST.moment) {
  const k = hop + '|' + m + '|' + levM(m); if (CACHE[k]) return CACHE[k];
  const ps = DOSES.map((d) => [d, profilH(hop, d, m)]); if (ps.some((x) => !x[1])) return (CACHE[k] = null);
  const centre = limiteDe([[0, cen(AVANT)], ...ps.map(([d, p]) => [d, cen(p)])]);
  /* les 20 brassins : le même tirage (même quantile) suivi d'une dose à l'autre ; fixe tant que les réglages ne changent pas */
  const TA = tirages(AVANT), TD = ps.map(([d, p]) => [d, tirages(p)]);
  const brassins = QZ.map((z, i) => { const excl = nonDeja.filter((f) => TA[i][f] > lim(f)); const b = limiteDe([[0, TA[i]], ...TD.map(([d, t]) => [d, t[i]])], excl); b.incertaine = excl.length > 0; return b; });
  const hp = ps.some(([d, p]) => nonDeja.some((f) => p[f].hp));
  const e = Ge(hop, m, 4, DH(m) ? 3 : null, levM(m));
  return (CACHE[k] = { centre, brassins, hp, cf: e && e.cf, ps });
}
const dTxt = (L) => (L.deja ? 'déjà hors' : L.plus ? '> 8 g/L' : '≈' + fr(L.d, 1) + ' g/L');
const dansA = (L, d) => L.plus || (!L.deja && L.d > d);
const brAccord = (n) => n + (n > 1 ? ' brassins' : ' brassin');
/* ---------- la barre de dose : 0 à 8 g/L, la 16D en pâle, hors en hachures, 20 brassins à leur dose limite ---------- */
function barre(hop, R, dose) {
  const W = 336, H = 50, x0 = 6, x1 = W - 22, X = (d) => x0 + Math.min(d, 8) / 8 * (x1 - x0), yb = 24;
  const v = s('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'data-nature': 'simule', 'data-role': 'incertitude', 'aria-label': '~ ' + hop + ' : dose limite ' + dTxt(R.centre) + ', 20 brassins simulés' });
  const defs = s('defs', {}, v), po = s('pattern', { id: 'h-' + hop.replace(' ', ''), width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
  s('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: ACC, 'stroke-width': 1.3, 'stroke-opacity': 0.45 }, po);
  const L = R.centre, xl = L.deja ? X(0) : L.plus ? X(8) : X(L.d);
  s('rect', { x: x0, y: yb - 9, width: xl - x0, height: 18, fill: '#f1f1f4', 'data-role': 'zone' }, v);
  if (!L.plus) s('rect', { x: xl, y: yb - 9, width: x1 - xl, height: 18, fill: 'url(#h-' + hop.replace(' ', '') + ')' }, v);
  if (xl - x0 > 34) { const t = s('text', { x: x0 + 4, y: yb - 12, 'font-size': 12, fill: '#4a4a55' }, v); t.textContent = '16D'; }
  if (!L.plus && x1 - xl > 34) { const t = s('text', { x: x1 - 2, y: yb - 12, 'text-anchor': 'end', 'font-size': 12, fill: '#c2410c', 'font-weight': 600 }, v); t.textContent = 'hors'; }
  /* les 20 brassins, empilés par pas de 0,25 g/L */
  const pile = {};
  for (const b of R.brassins.slice().sort((a, c) => (a.plus ? 9 : a.d) - (c.plus ? 9 : c.d))) { const d = b.deja ? 0 : b.plus ? 8.6 : b.d, k = Math.round(d * 4); pile[k] = (pile[k] || 0) + 1;
    const x = b.plus ? x1 + 10 : X(d), y = yb + 4 - (pile[k] - 1) * 5 - 4; s('circle', { cx: x, cy: Math.max(yb - 8, y), r: 2.6, fill: COUL[hop], 'fill-opacity': 0.85 }, v); }
  if (R.brassins.some((b) => b.plus)) { const t = s('text', { x: x1 + 10, y: yb - 12, 'text-anchor': 'middle', 'font-size': 12, fill: '#4a4a55' }, v); t.textContent = '> 8'; }
  /* le centre et la dose réglée */
  if (!L.plus && !L.deja) s('line', { x1: xl, y1: yb - 11, x2: xl, y2: yb + 11, stroke: '#c2410c', 'stroke-width': 3, 'stroke-linecap': 'round' }, v);
  const xd = X(dose); s('line', { x1: xd, y1: yb - 13, x2: xd, y2: yb + 13, stroke: '#16161a', 'stroke-width': 2 }, v);
  for (const d of [0, 1, 2, 4, 8]) { const t = s('text', { x: X(d), y: H - 2, 'text-anchor': 'middle', 'font-size': 12, fill: '#4a4a55' }, v); t.textContent = d === 8 ? '8 g/L' : String(d); }
  if (R.brassins.some((b) => b.deja)) { const t = s('text', { x: x0 + 2, y: yb + 22, 'font-size': 12, fill: '#4a4a55' }, v); t.textContent = ''; }
  return v;
}
/* ---------- la liste ---------- */
const STK = { suffisant: ['stock', 'en stock'], 'à acheter': ['achat', 'à acheter'], manque: ['manque', 'stock insuffisant'] };
function ligne(hop, R) {
  const V = D.V[hop], on = ST.choisi === hop, dose = aimant(ST.dose);
  const nIn = R ? R.brassins.filter((b) => dansA(b, dose)).length : 0;
  const st = STK[V.stock] || STK['à acheter'];
  const art = h('button', { class: 'lg', 'data-voie': hop, 'aria-pressed': String(on), 'aria-label': hop + ' : dose limite ' + (R ? dTxt(R.centre) : 'inconnue') },
    h('div', { class: 'l1' }, h('i', { class: 'sw', style: 'background:' + COUL[hop], 'aria-hidden': 'true' }), nomH(hop), alphaEl(hop), usageEl(hop),
      h('span', { class: 'stk', role: 'img', 'aria-label': st[1] }, icone(st[0], 14)),
      R ? h('span', { class: 'lim' + (R.centre.deja ? ' hors' : ''), 'data-nature': 'simule' }, ABS() ? '' : '~ jusqu’à ', h('span', { class: 'mono' }, ABS() ? absTxt(hop) : dTxt(R.centre))) : h('span', { class: 'lim' }, 'inconnu')));
  if (!R) return art;
  art.append(barre(hop, R, dose));
  art.append(h('div', { class: 'l3' }, R.centre.f ? h('span', {}, 'sort par ') : null, R.centre.f ? pic(R.centre.f, 14) : null, R.centre.f ? h('span', {}, D.COURT[R.centre.f].toLowerCase() + ' ·') : null,
    h('span', { 'data-nature': 'simule' }, '~' + nIn + ' sur 20 ' + (nIn > 1 ? 'restent' : 'reste') + ' à ' + fr(dose, 0) + ' g/L'), R.cf ? h('span', {}, '· confiance ' + R.cf) : null));
  if (on) { const l4 = h('div', { class: 'l4', 'data-nature': 'simule', 'aria-label': 'dose limite à chaque moment, ~ simulé' });
    for (const [m, t] of MOMS) { const r = lecture(hop, m); l4.append(h('span', { class: m === ST.moment ? 'on' : '' }, t + ' ', h('b', {}, r ? dTxt(r.centre) : 'inconnu'))); }
    art.append(l4); }
  art.addEventListener('click', () => { ST.choisi = hop; ST.touche = true; rendre(); });
  return art;
}
function absTxt(hop) { const p = profilH(hop, aimant(ST.dose)); if (!p) return 'inconnu'; const f = nonDeja.slice().sort((a, b) => p[b].c - p[a].c)[0]; return D.COURT[f].toLowerCase() + ' ' + fr(p[f].c, 0) + '/100'; }
function rendreListe() {
  const Z = document.getElementById('liste'); Z.replaceChildren();
  const rows = HOPS.map((hp) => [hp, lecture(hp)]).sort((a, b) => { const v = (r) => (!r ? -1 : r.centre.plus ? 99 : r.centre.deja ? 0 : r.centre.d); return v(b[1]) - v(a[1]); });
  const r0 = rows.find((r) => r[1]); const ni = r0 ? r0[1].brassins.filter((b) => b.incertaine).length : 0;
  const hpTous = rows.some((r) => r[1] && r[1].hp);
  Z.append(h('p', { class: 'src', 'data-nature': 'simule' }, '~ 20 brassins simulés par houblon, comptés dans la 16D' + (hpTous ? ' · haut partiel' : '') + (ni ? ' · ma bière incertaine sur ' + ni : '')));
  if (ST.paire) { const [a, b] = ST.paire, pp = DH(ST.moment) ? GP(a, b, ST.moment, ST.lev) : null;
    const nIn = pp ? tirages(pp).filter(dansStyle).length : 0, hs = pp ? horsStyle(pp) : [];
    Z.append(h('div', { class: 'lg', 'data-role': 'ajout', 'data-voie': a + '+' + b }, h('div', { class: 'l1' }, h('i', { class: 'sw', style: 'background:' + COUL[a] }), nomH(a), alphaEl(a), h('span', {}, '+'), h('i', { class: 'sw', style: 'background:' + COUL[b] }), nomH(b), alphaEl(b),
      h('span', { class: 'lim' + (hs.length ? ' hors' : ''), 'data-nature': 'simule' }, pp ? (hs.length ? '~ déborde' : '~ dans la 16D') + ' à 2 + 2 g/L' : 'inconnu : pas simulé à chaud')),
      pp ? h('div', { class: 'l3' }, h('span', { 'data-nature': 'simule' }, '~' + nIn + ' sur 20 dans la 16D' + (hs.length ? ' · sort par ' + hs.map((f) => D.COURT[f].toLowerCase()).join(', ') : '')), h('span', {}, '· dose limite non simulée (une seule dose)')) : null)); }
  for (const [hp, R] of rows) Z.append(ligne(hp, R));
  const E = document.getElementById('empruntes'); E.replaceChildren(h('div', { class: 'emp' }, ...EMPR.flatMap((hp) => [nomH(hp), alphaEl(hp)]), conf('inconnu', 'inconnu'), h('span', {}, 'composés non publiés : hors classement')));
  /* la réponse en une ligne : l'étendue des doses limites, au moment réglé */
  const ok = rows.filter((r) => r[1]), R = document.getElementById('rep'); R.replaceChildren();
  if (ok.length) { const hi = ok[0], lo = ok[ok.length - 1];
    R.append(h('span', { 'data-nature': 'simule' }, '~ ' + MLONG[ST.moment].charAt(0).toUpperCase() + MLONG[ST.moment].slice(1) + (DH(ST.moment) ? ', ' + ST.lev : '') + ' : ' + lo[0] + ' ' + dTxt(lo[1].centre) + ', ' + hi[0] + ' ' + dTxt(hi[1].centre) + '.')); }
}
/* ---------- les réglages (créés une fois, mis à jour ensuite) ---------- */
function reglages() {
  const M = document.getElementById('moments'), L = document.getElementById('levures');
  if (!M.children.length) { for (const [m, t] of MOMS) M.append(h('button', { 'data-role': 'reglage', 'data-reglage': 'moment', 'data-valeur': m, onclick: () => { ST.moment = m; rendre(); } }, t));
    for (const l of ['US-05', 'Pomona']) L.append(h('button', { 'data-role': 'reglage', 'data-reglage': 'levure', 'data-valeur': l, onclick: () => { ST.lev = l; rendre(); } }, l)); }
  for (const b of M.children) b.setAttribute('aria-pressed', String(b.dataset.valeur === ST.moment));
  for (const b of L.children) { b.setAttribute('aria-pressed', String(b.dataset.valeur === ST.lev)); b.setAttribute('aria-label', b.dataset.valeur + (DH(ST.moment) ? '' : ' : sans effet sur un ajout à chaud')); }
  const P = document.getElementById('paires');
  if (!P.children.length) for (const pr of [['Citra', 'Cascade'], ['Citra', 'Galaxy'], ['Citra', 'Idaho 7']]) P.append(h('button', { 'data-role': 'reglage', 'data-reglage': 'ajout-cumule', 'data-valeur': pr.join('+'), onclick: () => { ST.paire = ST.paire && ST.paire.join('+') === pr.join('+') ? null : pr; rendre(); } }, pr[0] + ' + ' + pr[1].replace('Idaho 7', 'Id. 7')));
  for (const b of P.children) b.setAttribute('aria-pressed', String(!!ST.paire && ST.paire.join('+') === b.dataset.valeur));
  const N = document.getElementById('nonsim'); N.replaceChildren(...['Verdant, Diamond : pas encore simulées.', ST.moment === 'dryActive' && ST.lev === 'Pomona' ? h('span', { 'data-role': 'biotransformation' }, ' Pomona : géraniol → citronellol, du floral vers les agrumes ', srcB('H50-pomona', 'géraniol → citronellol « medium » (fiche Lallemand) ; conversion 50 % au centre (convention du moteur)')) : null].filter(Boolean));
  L.parentElement.style.opacity = DH(ST.moment) ? '1' : '0.6';
  const dv = document.getElementById('dose-v'), a = aimant(ST.dose);
  dv.replaceChildren(...[h('span', {}, fr(ST.dose, 1) + ' g/L'), a !== ST.dose ? h('span', { class: 'src' }, ' · simulé à ' + a) : null].filter(Boolean));
  document.getElementById('dose').value = String(ST.dose);
}
document.getElementById('dose').addEventListener('input', (e) => { ST.dose = Number(e.target.value); rendre(); });
/* ---------- la carte, à un toucher ---------- */
const FRUITS2 = FRUITS, NONF = FAM.filter((f) => !FRUITS.includes(f) && !DEJA.includes(f));
const XM = 2.4, YM = 1.8, CW = 366, CH2 = 300, CL = 26, CR = 304, CT = 30, CB = 254;
const cxv = (vals) => Math.max(...FRUITS2.map((f) => (ABS() ? vals[f] / 100 * 2.4 : vals[f] / lim(f)))), cyv = (vals) => Math.max(...NONF.map((f) => (ABS() ? vals[f] / 100 * 1.8 : vals[f] / lim(f))));
const CX = (x) => CL + Math.min(x, XM) / XM * (CR - CL), CY = (y) => CB - Math.min(y, YM) / YM * (CB - CT);
function carte() {
  const v = s('svg', { width: CW, height: CH2, viewBox: '0 0 ' + CW + ' ' + CH2, role: 'img', 'data-nature': 'simule', 'aria-label': '~ simulé : chemins de dose de chaque houblon' });
  const z = ABS() ? [30 / 100 * 2.4, 55 / 100 * 1.8] : [1, 1];
  s('rect', { x: CL, y: CY(z[1]), width: CX(z[0]) - CL, height: CB - CY(z[1]), fill: '#f3f3f7', stroke: '#16161a', 'stroke-width': 1.5, 'stroke-dasharray': '5 3', 'data-role': 'zone' }, v);
  const t16 = s('text', { x: CL + 6, y: CY(z[1]) + 16, 'font-size': 13, 'font-weight': 700, fill: '#16161a' }, v); t16.textContent = '16D';
  const th = s('text', { x: CR - 4, y: CT + 14, 'text-anchor': 'end', 'font-size': 12, 'font-weight': 700, fill: '#c2410c' }, v); th.textContent = 'hors 16D';
  s('line', { x1: CL, y1: CB, x2: CR + 4, y2: CB, stroke: '#16161a', 'stroke-width': 1.5 }, v); s('line', { x1: CL, y1: CB, x2: CL, y2: CT - 4, stroke: '#16161a', 'stroke-width': 1.5 }, v);
  const pv = (f, x, y) => { const q = s('svg', { x, y, width: 16, height: 16, viewBox: '0 0 24 24', 'data-famille': f, class: 'pi', role: 'img', 'aria-label': D.NOM[f] }, v); s('use', { href: '#p-' + f, width: 24, height: 24 }, q); };
  ['citrus', 'tropical', 'stoneFruit', 'berries'].forEach((f, i) => pv(f, CL + 4 + i * 18, CB + 6));
  const ax = s('text', { x: CL + 80, y: CB + 19, 'font-size': 12, fill: '#16161a', 'font-weight': 600 }, v); ax.textContent = 'fruité →';
  ['floral', 'herbal', 'earthy'].forEach((f, i) => pv(f, CL - 4 + i * 18, 4));
  const ay = s('text', { x: CL + 52, y: 17, 'font-size': 12, fill: '#16161a', 'font-weight': 600 }, v); ay.textContent = '↑ floral, herbacé, terreux';
  for (const [x, t] of (ABS() ? [[1, '33'], [2, '66']] : [[1, '×1 limite'], [2, '×2']])) { const tt = s('text', { x: CX(x), y: CB + 34, 'text-anchor': 'middle', 'font-size': 12, fill: '#4a4a55' }, v); tt.textContent = t; }
  s('circle', { cx: CX(cxv(cen(AVANT))), cy: CY(cyv(cen(AVANT))), r: 5, fill: '#16161a' }, v);
  const mb = s('text', { x: CL + 4, y: CB - 6, 'font-size': 12, fill: '#16161a' }, v); mb.textContent = 'ma bière';
  const FINS = [];
  for (const hop of HOPS) { const R = lecture(hop); if (!R) continue; const on = hop === ST.choisi;
    const pts = [[0, cen(AVANT)], ...R.ps.map(([d, p]) => [d, cen(p)])];
    s('polyline', { points: pts.map(([d, q]) => CX(cxv(q)) + ',' + CY(cyv(q))).join(' '), fill: 'none', stroke: COUL[hop], 'stroke-width': on ? 3 : 2, 'stroke-opacity': on ? 1 : 0.7, 'stroke-linejoin': 'round' }, v);
    for (const [d, q] of pts.slice(1)) s('circle', { cx: CX(cxv(q)), cy: CY(cyv(q)), r: d === aimant(ST.dose) ? 5 : 3, fill: '#fff', stroke: COUL[hop], 'stroke-width': 2 }, v);
    const [dl, ql] = pts[pts.length - 1]; FINS.push({ hop, on, x: Math.min(CX(cxv(ql)) + 6, CW - 64), y: CY(cyv(ql)) - 6 }); }
  FINS.sort((a, b) => b.y - a.y); for (let i = 1; i < FINS.length; i++) for (let j = 0; j < i; j++) if (Math.abs(FINS[i].y - FINS[j].y) < 15 && Math.abs(FINS[i].x - FINS[j].x) < 90) FINS[i].y = FINS[j].y - 15;
  for (const e of FINS) { const t = s('text', { x: e.x, y: e.y, 'font-size': e.on ? 13 : 12, 'font-weight': 700, fill: COUL[e.hop] }, v); t.textContent = e.hop + ' 8 g/L'; }
  /* les 20 brassins : seulement pour le houblon touché */
  if (ST.touche) { const p = profilH(ST.choisi, aimant(ST.dose)); if (p) { let dehors = 0; for (const tt of tirages(p)) { const x = cxv(tt), y = cyv(tt); if (x > XM || y > YM) { dehors++; continue; } s('circle', { cx: CX(x), cy: CY(y), r: 3.4, fill: COUL[ST.choisi], 'fill-opacity': 0.75, stroke: dansStyle(tt) ? '#16161a' : ACC, 'stroke-width': 1.3 }, v); }
    if (dehors) { const t = s('text', { x: CR - 4, y: CT + 30, 'text-anchor': 'end', 'font-size': 12, fill: '#4a4a55' }, v); t.textContent = brAccord(dehors) + ' de ' + ST.choisi + ' au-delà de la carte ↑'; } } }
  return v;
}
/* ---------- pourquoi si large, à un toucher (le bloc de r3, gardé tel quel) ---------- */
function bandeLog(f, comp, mn, mx, ce) {
  const Wb = 330, Hb = 34, Lg = (x) => 4 + (Math.log10(Math.max(x, 0.001)) + 3) / 7 * (Wb - 8);
  const v = s('svg', { width: Wb, height: Hb, 'data-role': 'incertitude', role: 'img', 'aria-label': 'rapport au seuil de ' + comp + ' : ×' + fr(mn, 3) + ' à ×' + fr(mx, 0) });
  s('rect', { x: 4, y: 10, width: Wb - 8, height: 8, fill: '#ececf1', rx: 2 }, v);
  s('rect', { x: Lg(mn), y: 8, width: Math.max(3, Lg(mx) - Lg(mn)), height: 12, fill: D.TON[f].base, rx: 2 }, v);
  if (ce) s('line', { x1: Lg(ce), y1: 4, x2: Lg(ce), y2: 24, stroke: '#16161a', 'stroke-width': 2 }, v);
  for (const [x, t] of [[0.001, '×0,001'], [1, '×1 seuil'], [100, '×100'], [10000, '×10 000']]) { s('line', { x1: Lg(x), y1: 18, x2: Lg(x), y2: 24, stroke: '#5b5b66' }, v); const tt = s('text', { x: Lg(x), y: 33, 'text-anchor': x === 0.001 ? 'start' : x === 10000 ? 'end' : 'middle', 'font-size': 12, fill: '#4a4a55' }, v); tt.textContent = t; }
  return v;
}
function rendreIncert() {
  const Z = document.getElementById('incert'); Z.replaceChildren(h('h2', {}, 'L’incertitude réelle ', conf('mesuré', 'mesure')));
  const hop = ST.choisi, n = (x) => x.toLowerCase().replace(' ', '-'), cm = D.CAS['K1-' + n(hop) + '-dryPost'] || D.CAS['K2-' + n(hop)];
  const FAMC = { linalol: 'floral', 'géraniol': 'floral', '4MMP (4MSP)': 'tropical', 'myrcène': 'resin' };
  if (cm) {
    Z.append(h('p', { class: 'src' }, hop + ' 4 g/L, après fermentation : rapport au seuil de chaque composé, de la plus petite à la plus grande valeur publiée ; le trait noir : le central.'));
    for (const x of cm.m.filter((y) => y.ty === 'compose' && y.rp && y.rp[0] != null && y.rp[1] != null && FAMC[y.co])) { const f = FAMC[x.co];
      Z.append(h('div', { class: 'ligne' }, pic(f, 16), h('b', {}, x.co), mesure('×' + fr(x.rp[0], x.rp[0] < 0.1 ? 3 : 2) + ' à ×' + fr(x.rp[1], 0), x.s[0] || 'spec', { dit: (x.rl || '') + ' ; sources ' + x.s.join(', ') }), h('span', { class: 'large' }, 'largeur ×' + fr(x.rp[1] / x.rp[0], 0))), bandeLog(f, x.co, x.rp[0], x.rp[1], x.rp[2]));
      const base = x.co.replace(' (4MSP)', '').replace('géraniol', 'geraniol');
      const meb = cm.m.find((y) => y.ty === 'mesureEnBiere' && (y.co === base || y.co === x.co.replace(' (4MSP)', '')) && y.p);
      const pub = meb ? { v: meb.p[2], u: meb.u, s: meb.s, t: meb.t, b: meb.b } : cm.m.find((y) => y.ty === 'publiee' && y.co === x.co.replace(' (4MSP)', '') && typeof y.v === 'number');
      const dz = pub && (new RegExp('([0-9]+(?:,[0-9]+)?) g/L').exec(pub.t || '') || [])[1];
      if (x.cc) Z.append(h('div', { class: 'ligne' }, h('span', { class: 'k' }, 'en bière'), simule('~' + fr(x.cc[2], 0) + ' ' + x.cc[3] + ' calculé (' + fr(x.cc[0], 0) + '–' + fr(x.cc[1], 0) + ')'),
        pub ? mesure(fr(pub.v, 1) + ' ' + pub.u, pub.s[0], { dit: 'publié (' + (pub.t || '') + ')', avant: ['mesuré ailleurs : '] }) : null, pub ? h('span', { class: 'src' }, dz ? 'à ' + dz + ' g/L' : 'dose non dite') : null, pub && /vérifier/.test((pub.t || '') + (pub.b || '')) ? conf('à vérifier', 'verif') : null));
    }
  } else Z.append(h('div', { class: 'trou' }, conf('inconnu', 'inconnu'), 'Pas de rapports au seuil calculés pour ' + hop + '.'));
  /* la dose de Cascade au panel (Lafontaine et Shellhammer 2018, lecture H) : doubler la dose ne double pas l'arôme */
  const E = D.E04, Wd = 300, Hd = 120, Xd = (d) => 10 + d / 16 * (Wd - 70), Yd = (v) => Hd - 16 - v / 12 * (Hd - 28);
  const sv = s('svg', { width: Wd, height: Hd, role: 'img', 'aria-label': 'Cascade au panel : agrumes ' + E.agrumes.join(' ; ') + ', herbacé ' + E.herbace.join(' ; ') + ' sur 15, à 0, 2, 3,86, 8 et 16 g/L' });
  for (const [k, f] of [['agrumes', 'citrus'], ['herbace', 'herbal']]) { s('polyline', { points: E.doses.map((d, i) => Xd(d) + ',' + Yd(E[k][i])).join(' '), fill: 'none', stroke: D.TON[f].base, 'stroke-width': 2.5 }, sv);
    E.doses.forEach((d, i) => s('circle', { cx: Xd(d), cy: Yd(E[k][i]), r: 3, fill: '#fff', stroke: D.TON[f].texte, 'stroke-width': 1.5 }, sv));
    const t = s('text', { x: Xd(16) + 6, y: Yd(E[k][4]) + 4, 'font-size': 12, 'font-weight': 700, fill: D.TON[f].texte }, sv); t.textContent = (f === 'citrus' ? 'agrumes ' : 'herbacé ') + String(E[k][4]).replace('.', ','); }
  for (const v of [0, 5, 10]) { const t = s('text', { x: 0, y: Yd(v) + 4, 'font-size': 12, fill: '#4a4a55' }, sv); t.textContent = v; }
  for (const d of [0, 2, 4, 8, 16]) { const t = s('text', { x: Xd(d), y: Hd - 2, 'text-anchor': 'middle', 'font-size': 12, fill: '#4a4a55' }, sv); t.textContent = d === 16 ? '16 g/L' : String(d); }
  Z.append(h('div', { class: 'ligne' }, pic('citrus', 16), h('b', {}, 'Doubler la dose ne double pas l’arôme'), conf('panel', 'panel'), mesure('vérifié (K)', 'E04', { dit: 'Lafontaine et Shellhammer 2018, tableau 3, lecture H vérifiée dans recherche/K-lafontaine-2018-verif.md : les agrumes plafonnent dès 8 g/L, l’herbacé monte jusqu’à 16 g/L ; Cascade, 24 h, 4,75 % vol.' })),
    h('div', { class: 'ligne' }, h('span', { class: 'k' }, 'Cascade, 24 h'), sv));
  /* les 29 lots de Cascade */
  const vs = D.LOTS.valeurs, W2 = 300, H2 = 46, X2 = (x) => 8 + (x - 3) / 5 * (W2 - 16);
  const s2 = s('svg', { width: W2, height: H2, 'data-role': 'incertitude', role: 'img', 'aria-label': '29 lots de Cascade, agrumes au panel de 4,2 à 6,6 sur 15' });
  const cnt = {}; for (const x of vs.slice().sort((a, b) => a - b)) { const k = Math.round(x * 5); cnt[k] = (cnt[k] || 0) + 1; s('circle', { cx: X2(k / 5), cy: H2 - 16 - (cnt[k] - 1) * 7, r: 3, fill: D.TON.citrus.base, stroke: D.TON.citrus.texte, 'stroke-width': 1 }, s2); }
  for (const t of [3, 4, 5, 6, 7, 8]) { const x = s('text', { x: X2(t), y: H2 - 1, 'text-anchor': 'middle', 'font-size': 12, fill: '#4a4a55' }, s2); x.textContent = t; }
  Z.append(h('div', { class: 'ligne' }, pic('citrus', 16), h('b', {}, 'Un lot n’est pas l’autre'), conf('panel', 'panel'), mesure('4,2–6,6 sur 15', 'lots', { dit: 'agrumes au panel, 29 lots de Cascade 2015, 3,86 g/L, 24 h' })), h('div', { class: 'ligne' }, h('span', { class: 'k' }, 'Cascade, 29 lots'), s2));
  const Lm = D.COMP.E06.linalol, mx = Math.max(...Lm.map((x) => x.val));
  Z.append(h('div', { class: 'ligne' }, pic('floral', 16), h('b', {}, 'Linalol en bière, même dry hop'), conf('mesuré', 'mesure'), h('span', { class: 'src' }, 'dose non dite')));
  for (const x of Lm) Z.append(h('div', { class: 'ligne' }, h('span', { class: 'k' }, x.v.replace('témoin (sans houblon)', 'sans houblon')), h('div', { class: 'barreh' }, h('i', { style: 'left:0;width:' + (x.val / mx * 100).toFixed(1) + '%;background:' + (x.v === 'Citra' ? D.TON.floral.base : '#b8b8c2') })), mesure(fr(x.val, 1), 'E06', { unite: 'µg/L', dit: 'linalol en bière, ' + x.v })));
  for (const t of D.COMP.trous) Z.append(h('div', { class: 'trou' }, conf('inconnu', 'inconnu'), t));
}
function plis() {
  const bc = document.getElementById('voir-carte'), cb = document.getElementById('carte-b'), bp = document.getElementById('voir-pq'), pq = document.getElementById('incert');
  bc.setAttribute('aria-expanded', String(ST.carte)); cb.hidden = !ST.carte; if (ST.carte) document.getElementById('carte').replaceChildren(carte());
  bp.setAttribute('aria-expanded', String(ST.pq)); pq.hidden = !ST.pq; if (ST.pq) rendreIncert();
}
document.getElementById('voir-carte').addEventListener('click', () => { ST.carte = !ST.carte; plis(); });
document.getElementById('voir-pq').addEventListener('click', () => { ST.pq = !ST.pq; plis(); });
function rendre() { reglages(); rendreListe(); plis(); }
document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => setTimeout(rendre, 0)));
rendre();
`;

ecrire(OUT + '/etat.html', page({
  titre: 'Jusqu’où · r3b',
  description: 'Lot 21 · r3b « Jusqu’où » : la dose limite par houblon d’abord (une ligne par houblon, rangée par sa dose limite, ~ simulé, ≈ interpolé ; 20 brassins simulés posés à leur dose limite sur une barre de 0 à 8 g/L, le curseur de dose compte ceux qui restent dans la 16D ; la dose limite à chaque moment pour le houblon touché) ; la carte des chemins et « Pourquoi si large ? » à un toucher. Départ en dry hop en fermentation, US-05. Générée par generateur-r3b.mjs (../r1/socle-r.mjs), sur profils-simules.json à 4,75 % vol.',
  css: CSS + CSS_R3B, corps: corps(), js: JS, donneesJS: DONNEES,
}));
