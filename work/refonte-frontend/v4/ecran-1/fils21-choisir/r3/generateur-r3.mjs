// Lot 21 · r3 « La carte » : jusqu'où je peux aller sans sortir de ma 16D ?
// Une carte du goût AU STYLE : à droite le fruité (le plus haut des agrumes, tropicaux, noyau, pépins,
// baies, melon, en multiple de sa limite 16D), en haut le floral, l'herbacé, le terreux, l'épicé et le
// vert (idem). Le carré pâle en bas à gauche est la 16D. Chaque houblon y trace son CHEMIN DE DOSE
// (1, 2, 4, 8 g/L, ~ simulé) ; l'endroit où il sort du carré est marqué. Le houblon choisi montre 20
// brassins simulés (des points : l'incertitude se compte) ; sous la carte, les chances de rester dans la
// 16D, en classement par critère, et l'incertitude réelle (rapports au seuil sur échelle log, 29 lots de
// Cascade, linalol en bière), avec les trous.
// Usage : node generateur-r3.mjs  →  r3/etat.html
import { D21, donnees, page, CSS, tete, legende, pas, ecrire } from '../r1/socle-r.mjs';
import { ic, picto } from '../../fils18-baseline/l8g/noyau.mjs';

const OUT = D21 + '/r3';
const DONNEES = JSON.stringify(donnees({ cas: (c) => ['K1', 'K2'].includes(c.groupe) }));

const CSS_R3 = `
  .q { font-size: 16px; font-weight: 700; line-height: 1.2; }
  .carte-z svg text { font-family: var(--sans); }
  .rep1 { font-size: 13px; line-height: 1.3; }
  .ladder { display: flex; flex-direction: column; gap: 4px; }
  .lad { display: grid; grid-template-columns: 92px 1fr 54px; align-items: center; gap: 6px; min-height: 32px; border-radius: 8px; padding: 0 4px; }
  .lad[aria-pressed="true"] { box-shadow: inset 0 0 0 2px var(--encre); }
  .lad .nm { display: flex; flex-direction: column; gap: 1px; }
  .lad .nm .hn { font-size: 13px; }
  .icones { display: grid; grid-template-columns: repeat(10, 1fr); gap: 2px; max-width: 180px; }
  .icones i { display: block; height: 9px; border-radius: 2px; background: #fff; box-shadow: inset 0 0 0 1.2px #9a9aa6; }
  .icones i.in { background: #16161a; box-shadow: none; }
  .lad .ch { font: 600 13px var(--mono); text-align: right; }
  .lad .so { grid-column: 2 / -1; font-size: 12px; color: var(--gris); margin-top: -2px; }
  .bloc { display: flex; flex-direction: column; gap: 6px; padding-top: 4px; border-top: 1px solid var(--trait); }
  .bloc > h2 { font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .ligne { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 13px; min-height: 24px; }
  .ligne .pi { width: 16px; height: 16px; }
  .ligne .k { color: var(--gris); font-size: 12px; min-width: 64px; }
  .barreh { position: relative; height: 10px; background: #ececf1; border-radius: 2px; flex: 1; min-width: 120px; }
  .barreh i { position: absolute; top: 0; bottom: 0; border-radius: 2px; }
  .trou { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #4a4a55; }
  .bio { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 8px; background: #f6f6f9; font-size: 13px; line-height: 1.25; }
  .large { font: 700 13px var(--mono); color: var(--encre); background: #f1f1f4; padding: 1px 5px; border-radius: 4px; }`;

const corps = () => `
  ${tete(ic)}
  <p class="q">Jusqu’où je peux aller sans sortir de ma 16D ?</p>
  <section class="simu" data-role="simulation" id="simu" aria-label="La carte simulée">
    <div class="carte-z" id="carte"></div>
    <p class="rep1" id="rep1"></p>
  </section>
  ${pas('dose', 'Dose', [['1', '1 g/L'], ['2', '2'], ['4', '4'], ['8', '8']], '2', { aria: 'Dose de chaque houblon' })}
  ${pas('moment', 'Moment', [['b60', '60′'], ['b10', '10′'], ['wp', 'whirl.'], ['dryActive', 'actif'], ['dryPost', 'après']], 'dryPost', { aria: 'Moment de l’ajout' })}
  ${pas('levure', 'Levure', [['US-05', 'US-05'], ['Pomona', 'Pomona']], 'US-05', { aria: 'Levure (le moteur ne simule ici que ces deux)' })}
  <div id="biot"></div>
  <section class="bloc" data-role="simulation" aria-label="Chances de rester dans la 16D, simulées">
    <h2>Dans la 16D, sur 20 brassins simulés <span class="conf estime">~ estimé</span></h2>
    <div class="ladder" id="ladder"></div>
    <div class="regl"><span class="lab">Ensemble</span><div class="pas" role="group" aria-label="Deux houblons ensemble, 2 + 2 g/L" id="paires"></div></div>
  </section>
  <section class="bloc" id="incert" aria-label="L’incertitude réelle"></section>
  ${legende(ic, picto, `
    <div class="leg-s"><h3>La carte</h3><div class="leg-g l1">
      <span class="leg-i"><span>Vers la droite : le fruité (la plus forte des familles fruitées). Vers le haut : floral, herbacé, terreux, épicé, vert. En multiple de la limite 16D de chaque famille : le carré pâle est la 16D.</span></span>
      <span class="leg-i"><span>Une ligne par houblon : son chemin de dose, 1, 2, 4 puis 8 g/L (~ simulé). Le trait orangé : là où il sort du style.</span></span>
      <span class="leg-i"><span>Les 20 points : 20 brassins simulés du houblon choisi, tirés dans sa plage, à la couleur de leur famille la plus forte ; cerclés d’orangé quand ils sortent du style. Combien tombent dans le carré : ses chances.</span></span>
      <span class="leg-i"><span>Le résineux de ta bière (dégustation) est déjà hors du style : il n’entre pas dans la carte.</span></span>
    </div></div>`)}`;

const JS = `
const HOPS = ['Citra', 'Galaxy', 'Idaho 7', 'Cascade', 'Motueka', 'Nelson Sauvin'];
const ST = { dose: 2, moment: 'dryPost', lev: 'US-05', choisi: 'Citra', paire: null };
{ const q = new URLSearchParams(location.search); if (q.get('d')) ST.dose = Number(q.get('d')); if (q.get('m')) ST.moment = q.get('m'); if (q.get('l')) ST.lev = q.get('l'); if (q.get('h')) ST.choisi = q.get('h'); if (q.get('p')) ST.paire = q.get('p').split(','); }
const DH = (m) => m === 'dryActive' || m === 'dryPost';
const ABS = () => document.body.classList.contains('abs');
const NONF = FAM.filter((f) => !FRUITS.includes(f) && !DEJA.includes(f));
const XM = 2.4, YM = 1.8;
/* les deux coordonnées : au style, le plus haut multiple de la limite 16D ; en absolu, la plus haute valeur sur 100 */
const cx = (p) => Math.max(...FRUITS.map((f) => (ABS() ? p[f].c / 100 * 2.4 : niv(f, p[f].c))));
const cy = (p) => Math.max(...NONF.map((f) => (ABS() ? p[f].c / 100 * 1.8 : niv(f, p[f].c))));
const cxT = (t) => Math.max(...FRUITS.map((f) => (ABS() ? t[f] / 100 * 2.4 : niv(f, t[f]))));
const cyT = (t) => Math.max(...NONF.map((f) => (ABS() ? t[f] / 100 * 1.8 : niv(f, t[f]))));
const W = 366, H = 304, L = 26, R = 304, T0 = 30, B = 258;
const X = (x) => L + Math.min(x, XM) / XM * (R - L), Y = (y) => B - Math.min(y, YM) / YM * (B - T0);
const profilH = (hop, d) => G(hop, ST.moment, d, DH(ST.moment) ? 3 : null, ST.lev);
const n = (x) => x.toLowerCase().replace(' ', '-');
/* la dose où le chemin sort de la 16D, interpolée entre deux doses simulées (~) */
function sortie(hop) {
  const ds = [1, 2, 4, 8]; let prev = null;
  for (const d of ds) { const p = profilH(hop, d); if (!p) return null; const out = horsStyle(p).length > 0;
    if (out) { if (!prev) return { d: '≤ 1', x: d }; const [d0, p0] = prev; const e = (q) => Math.max(...FAM.filter((f) => !DEJA.includes(f)).map((f) => q[f].c / lim(f)));
      const a = e(p0), b = e(p); const k = b > a ? (1 - a) / (b - a) : 0.5; return { d: '~' + fr(d0 + k * (d - d0), 1), x: d0 + k * (d - d0) }; }
    prev = [d, p]; }
  return { d: '> 8', x: null };
}
function carte() {
  const v = s('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'data-nature': 'simule', 'aria-label': '~ simulé : la carte du goût, chemins de dose' });
  const defs = s('defs', {}, v), po = s('pattern', { id: 'ho', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
  s('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: ACC, 'stroke-width': 1.2, 'stroke-opacity': 0.22 }, po);
  s('rect', { x: L, y: T0, width: R - L, height: B - T0, fill: 'url(#ho)' }, v);
  /* la 16D : le carré pâle */
  const z16 = ABS() ? [30 / 100 * 2.4, 55 / 100 * 1.8] : [1, 1];
  s('rect', { x: L, y: Y(z16[1]), width: X(z16[0]) - L, height: B - Y(z16[1]), fill: '#f3f3f7', stroke: '#16161a', 'stroke-width': 1.5, 'stroke-dasharray': '5 3', 'data-role': 'zone' }, v);
  const t16 = s('text', { x: L + 6, y: Y(z16[1]) + 16, 'font-size': 13, 'font-weight': 700, fill: '#16161a' }, v); t16.textContent = '16D';
  const th = s('text', { x: R - 4, y: T0 + 16, 'text-anchor': 'end', 'font-size': 12, 'font-weight': 700, fill: '#c2410c' }, v); th.textContent = 'hors 16D';
  /* les axes : des familles, nommées */
  s('line', { x1: L, y1: B, x2: R + 4, y2: B, stroke: '#16161a', 'stroke-width': 1.5 }, v); s('line', { x1: L, y1: B, x2: L, y2: T0 - 4, stroke: '#16161a', 'stroke-width': 1.5 }, v);
  const pv = (f, x, y) => { const q = s('svg', { x, y, width: 16, height: 16, viewBox: '0 0 24 24', 'data-famille': f, class: 'pi', role: 'img', 'aria-label': D.NOM[f] }, v); s('use', { href: '#p-' + f, width: 24, height: 24 }, q); };
  ['citrus', 'tropical', 'stoneFruit', 'berries'].forEach((f, i) => pv(f, L + 4 + i * 18, B + 6));
  const ax = s('text', { x: L + 80, y: B + 19, 'font-size': 12, fill: '#16161a', 'font-weight': 600 }, v); ax.textContent = 'fruité →';
  ['floral', 'herbal', 'earthy'].forEach((f, i) => pv(f, L - 4 + i * 18, 4));
  const ay = s('text', { x: L + 52, y: 17, 'font-size': 12, fill: '#16161a', 'font-weight': 600 }, v); ay.textContent = '↑ floral, herbacé, terreux';
  const gx = ABS() ? [[1, '33'], [2, '66']] : [[1, '×1 limite'], [2, '×2']];
  for (const [x, t] of gx) { const tt = s('text', { x: X(x), y: B + 34, 'text-anchor': 'middle', 'font-size': 12, fill: '#4a4a55' }, v); tt.textContent = t; }
  /* ma bière */
  s('circle', { cx: X(cx(AVANT)), cy: Y(cy(AVANT)), r: 5, fill: '#16161a' }, v);
  const mb = s('text', { x: X(cx(AVANT)) + 2, y: B - 4, 'font-size': 12, fill: '#16161a' }, v); mb.textContent = 'ma bière';
  /* les chemins de dose */
  const ends = [];
  for (const hop of HOPS.filter((x) => ['Citra', 'Galaxy', 'Idaho 7', 'Cascade'].includes(x) || x === ST.choisi)) {
    const pts = [1, 2, 4, 8].map((d) => [d, profilH(hop, d)]).filter((x) => x[1]);
    if (!pts.length) continue;
    const on = hop === ST.choisi, col = on ? '#16161a' : '#8a8a96';
    const g = s('g', { class: 'chemin', 'data-houblon-carte': hop, style: 'cursor:pointer' }, v);
    s('polyline', { points: [[0, AVANT], ...pts].map(([d, p]) => X(cx(p)) + ',' + Y(cy(p))).join(' '), fill: 'none', stroke: col, 'stroke-width': on ? 2.5 : 1.5, 'stroke-linejoin': 'round' }, g);
    for (const [d, p] of pts) { const x = X(cx(p)), y = Y(cy(p)), cur = d === ST.dose;
      s('circle', { cx: x, cy: y, r: cur ? 6 : 3.5, fill: cur ? (horsStyle(p).length ? ACC : '#fff') : '#fff', stroke: col, 'stroke-width': on || cur ? 2 : 1.5 }, g);
      if (on) { const t = s('text', { x: x + 6, y: y + 14, 'font-size': 12, fill: '#16161a', 'font-weight': 600 }, g); t.textContent = d + (d === 8 ? ' g/L' : ''); } }
    const [dl, pl] = pts[pts.length - 1]; ends.push({ hop, x: X(cx(pl)), y: Y(cy(pl)), on });
    g.addEventListener('click', () => { ST.choisi = hop; rendre(); });
    /* l'endroit où il sort : un trait orangé sur le chemin */
    const so = sortie(hop);
    if (so && so.x) { let a = [0, AVANT]; for (const q of [[0, AVANT], ...pts]) { if (q[0] <= so.x) a = q; } const b = pts.find((q) => q[0] > so.x) || pts[pts.length - 1];
      const k = b[0] > a[0] ? (so.x - a[0]) / (b[0] - a[0]) : 0; const x = X(cx(a[1])) + k * (X(cx(b[1])) - X(cx(a[1]))), y = Y(cy(a[1])) + k * (Y(cy(b[1])) - Y(cy(a[1])));
      s('line', { x1: x - 6, y1: y + 6, x2: x + 6, y2: y - 6, stroke: ACC, 'stroke-width': 3, 'stroke-linecap': 'round' }, g); }
  }
  /* les noms au bout des chemins, écartés */
  /* du bas vers le haut : un nom qui en gênerait un autre remonte, jamais sous l'axe */
  ends.sort((a, b) => b.y - a.y); for (const e of ends) e.y = Math.min(e.y, B - 8);
  for (let i = 1; i < ends.length; i++) for (let j = 0; j < i; j++) if (Math.abs(ends[i].y - ends[j].y) < 15 && Math.abs(ends[i].x - ends[j].x) < 84) ends[i].y = ends[j].y - 15;
  for (const e of ends) { const x = Math.min(e.x + 6, W - 2), t = s('text', { x, y: e.y + 4, 'text-anchor': e.x > R - 30 ? 'end' : 'start', 'font-size': e.on ? 13 : 12, 'font-weight': e.on ? 700 : 600, fill: e.on ? '#16161a' : '#4a4a55' }, v); if (e.x > R - 30) t.setAttribute('x', e.x - 8); t.textContent = e.hop; }
  /* les 20 brassins simulés du houblon choisi, à la dose réglée */
  const pc = profilH(ST.choisi, ST.dose);
  let dehors = 0;
  if (pc) for (const t of tirages(pc)) { const inn = dansStyle(t), x = cxT(t), y = cyT(t), xx = X(x), yy = Y(y);
    if (x > XM || y > YM) { dehors++; s('path', { d: y > YM ? 'M' + (xx - 4) + ',' + (yy + 5) + ' L' + xx + ',' + (yy - 2) + ' L' + (xx + 4) + ',' + (yy + 5) : 'M' + (xx - 5) + ',' + (yy - 4) + ' L' + (xx + 2) + ',' + yy + ' L' + (xx - 5) + ',' + (yy + 4), fill: 'none', stroke: ACC, 'stroke-width': 1.6 }, v); continue; }
    const fd = FAM.filter((f) => !DEJA.includes(f)).sort((a, b) => t[b] / lim(b) - t[a] / lim(a))[0];
    s('circle', { cx: xx, cy: yy, r: 3.6, fill: D.TON[fd].base, stroke: inn ? '#16161a' : ACC, 'stroke-width': inn ? 1.2 : 2 }, v); }
  if (dehors) { const t = s('text', { x: R - 4, y: T0 + 32, 'text-anchor': 'end', 'font-size': 12, fill: '#4a4a55' }, v); t.textContent = dehors + ' brassins plus haut que la carte ↑'; }
  /* l'ajout cumulé : le point des deux ensemble, relié à chacun seul à 4 g/L (même dose totale) */
  if (ST.paire && DH(ST.moment)) { const [a, b] = ST.paire, pp = GP(a, b, ST.moment, ST.lev);
    if (pp) { const xp = X(cx(pp)), yp = Y(cy(pp));
      for (const hop of [a, b]) { const q = profilH(hop, 4); if (q) s('line', { x1: xp, y1: yp, x2: X(cx(q)), y2: Y(cy(q)), stroke: '#16161a', 'stroke-width': 1.5, 'stroke-dasharray': '2 3' }, v); }
      s('rect', { x: xp - 7, y: yp - 7, width: 14, height: 14, transform: 'rotate(45 ' + xp + ' ' + yp + ')', fill: horsStyle(pp).length ? ACC : '#fff', stroke: '#16161a', 'stroke-width': 2, 'data-role': 'ajout' }, v);
      const t = s('text', { x: xp + 2, y: yp + 24, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: '#16161a' }, v); t.textContent = a + ' + ' + b + ' 2 + 2'; } }
  return v;
}
function rendreLadder() {
  const Z = document.getElementById('ladder'); Z.replaceChildren();
  const rows = HOPS.map((hop) => { const p = profilH(hop, ST.dose), e = Ge(hop, ST.moment, ST.dose, DH(ST.moment) ? 3 : null, ST.lev); return { hop, p, cf: e && e.cf, ch: p ? chances(p) : null, so: sortie(hop) }; }).sort((a, b) => (b.ch ?? -1) - (a.ch ?? -1));
  for (const r of rows) {
    const ic20 = h('span', { class: 'icones', 'data-nature': 'simule', 'aria-label': r.ch == null ? 'non simulé' : '~ ' + r.ch + ' brassins sur 20 dans la 16D' }, ...Array.from({ length: 20 }, (_, i) => h('i', { class: r.ch != null && i < r.ch ? 'in' : '' })));
    const b = h('button', { class: 'lad', 'aria-pressed': String(r.hop === ST.choisi), 'aria-label': r.hop + ', ses brassins simulés sur la carte' },
      h('span', { class: 'nm' }, nomH(r.hop), D.V[r.hop] ? alphaEl(r.hop) : null), ic20, h('span', { class: 'ch', 'data-nature': 'simule' }, r.ch == null ? 'inconnu' : '~' + r.ch + '/20'),
      h('span', { class: 'so', 'data-nature': 'simule' }, (r.so ? (r.so.x ? 'sort de la 16D vers ' + r.so.d + ' g/L (~)' : r.so.d === '> 8' ? 'reste dans la 16D jusqu’à 8 g/L (~)' : 'sort dès 1 g/L (~)') : 'non simulé') + (r.cf ? ' · confiance ' + r.cf : '') + (['Motueka', 'Nelson Sauvin'].includes(r.hop) ? ' · composés inconnus : force de Cascade' : '')));
    b.addEventListener('click', () => { ST.choisi = r.hop; rendre(); });
    Z.append(b);
  }
  const P = document.getElementById('paires'); P.replaceChildren();
  for (const pr of [['Citra', 'Cascade'], ['Citra', 'Galaxy'], ['Citra', 'Idaho 7']]) { const on = ST.paire && ST.paire.join() === pr.join(), ok = DH(ST.moment) && !!GPe(pr[0], pr[1], ST.moment, ST.lev);
    P.append(h('button', { 'data-role': 'reglage', 'data-reglage': 'ajout-cumule', 'aria-pressed': String(!!on), disabled: ok ? null : 'disabled', 'aria-label': pr.join(' + ') + ' ensemble, 2 + 2 g/L' + (ok ? '' : ', non simulé à ce moment'), onclick: () => { ST.paire = on ? null : pr; rendre(); } }, pr[0] + ' + ' + pr[1].replace('Idaho 7', 'Id. 7'))); }
}
function rendreRep() {
  const Z = document.getElementById('rep1'); Z.replaceChildren();
  const so = sortie(ST.choisi), p = profilH(ST.choisi, ST.dose);
  if (!p) { Z.append(conf('inconnu', 'inconnu'), ' pas simulé pour cet état (ni zéro, ni moyenne).'); return; }
  const hs = horsStyle(p);
  Z.append(...[h('b', {}, ST.choisi + ' ' + ST.dose + ' g/L : '), simule((hs.length ? '~ sort de la 16D par ' + hs.map((f) => D.COURT[f].toLowerCase()).join(', ') : '~ reste dans la 16D') + ' ; ' + chances(p) + ' brassins sur 20 dans le carré.'),
    ' ', so && so.x ? simule('Limite vers ' + so.d + ' g/L.') : null].filter(Boolean));
  if (ST.moment === 'b60') Z.append(' ', h('b', {}, 'Pourquoi ? '), D.DR.moment60.t, ' ', srcB(D.DR.moment60.s[0], D.DR.moment60.d));
  if (DEJA.length) Z.append(h('br'), h('span', { class: 'src' }, DEJA.map((f) => D.COURT[f]).join(', ') + ' : déjà hors 16D dans ta bière (dégustation), hors de la carte.'));
}
function rendreBio() {
  const Z = document.getElementById('biot'); Z.replaceChildren();
  if (ST.moment === 'dryActive' && ST.lev === 'Pomona') Z.append(h('div', { class: 'bio', 'data-role': 'biotransformation' }, pic('floral', 16), '→', pic('citrus', 16), h('span', {}, ' Pomona en fermentation : géraniol → citronellol, du floral vers les agrumes : les chemins glissent vers la droite. ', srcB('H50-pomona', 'géraniol → citronellol « medium » (fiche Lallemand) ; conversion 50 % au centre (convention du moteur)'))));
  else if (DH(ST.moment)) Z.append(h('div', { class: 'bio', 'data-role': 'biotransformation' }, h('span', {}, ST.moment === 'dryPost' ? 'Après fermentation : levure au repos, biotransformation hors du cas.' : 'US-05 en fermentation : biotransformation non chiffrée (géraniol, nérol un peu plus hauts). Verdant, Diamond : non simulés pour un houblon seul.')));
}
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
  const Z = document.getElementById('incert'); Z.replaceChildren(h('h2', {}, 'Pourquoi si large ? L’incertitude réelle ', conf('mesuré', 'mesure')));
  const hop = ST.choisi, cm = D.CAS['K1-' + n(hop) + '-dryPost'] || D.CAS['K2-' + n(hop)];
  const FAMC = { linalol: 'floral', 'géraniol': 'floral', '4MMP (4MSP)': 'tropical', 'myrcène': 'resin' };
  if (cm) {
    Z.append(h('p', { class: 'rep1' }, hop + ' 4 g/L, après fermentation : rapport au seuil de chaque composé, de la plus petite à la plus grande valeur publiée (seuils et teneurs des sources). Le repère noir : le central.'));
    for (const x of cm.m.filter((y) => y.ty === 'compose' && y.rp && y.rp[0] != null && y.rp[1] != null && FAMC[y.co])) { const f = FAMC[x.co];
      Z.append(h('div', { class: 'ligne' }, pic(f, 16), h('b', {}, x.co), mesure('×' + fr(x.rp[0], x.rp[0] < 0.1 ? 3 : 2) + ' à ×' + fr(x.rp[1], 0), x.s[0] || 'spec', { dit: (x.rl || '') + ' ; sources ' + x.s.join(', ') }), h('span', { class: 'large' }, 'largeur ×' + fr(x.rp[1] / x.rp[0], 0))), bandeLog(f, x.co, x.rp[0], x.rp[1], x.rp[2]));
      const base = x.co.replace(' (4MSP)', '').replace('géraniol', 'geraniol');
      const meb = cm.m.find((y) => y.ty === 'mesureEnBiere' && (y.co === base || y.co === x.co.replace(' (4MSP)', '')) && y.p);
      const pub = meb ? { v: meb.p[2], u: meb.u, s: meb.s, t: meb.t, b: meb.b } : cm.m.find((y) => y.ty === 'publiee' && y.co === x.co.replace(' (4MSP)', '') && typeof y.v === 'number');
      const dz = pub && (new RegExp('([0-9]+(?:,[0-9]+)?) g/L').exec(pub.t || '') || [])[1];
      if (x.cc) Z.append(h('div', { class: 'ligne' }, h('span', { class: 'k' }, 'en bière'), simule('~' + fr(x.cc[2], 0) + ' ' + x.cc[3] + ' calculé (' + fr(x.cc[0], 0) + '–' + fr(x.cc[1], 0) + ')'), pub ? mesure(fr(pub.v, 1) + ' ' + pub.u, pub.s[0], { dit: 'publié (' + (pub.t || '') + ')' + (dz ? '' : ', dose non dite') + ' ; le centre calculé est plus haut', avant: ['mesuré ailleurs : '] }) : null,
        pub ? h('span', { class: 'src' }, dz ? 'à ' + dz + ' g/L' : 'dose non dite') : null, pub && /vérifier/.test((pub.t || '') + (pub.b || '')) ? conf('à vérifier', 'verif') : null));
    }
  } else Z.append(h('div', { class: 'trou' }, conf('inconnu', 'inconnu'), 'Pas de rapports au seuil calculés pour ' + hop + ' dans les cas du moteur.'));
  /* les 29 lots de Cascade : une même dose, des agrumes de 4,2 à 6,6 sur 15 (panel) */
  const vs = D.LOTS.valeurs, Wd = 300, Hd = 46, Xd = (x) => 8 + (x - 3) / 5 * (Wd - 16);
  const sv = s('svg', { width: Wd, height: Hd, 'data-role': 'incertitude', role: 'img', 'aria-label': '29 lots de Cascade, agrumes au panel de 4,2 à 6,6 sur 15' });
  const cnt = {}; for (const x of vs.slice().sort((a, b) => a - b)) { const k = Math.round(x * 5); cnt[k] = (cnt[k] || 0) + 1; s('circle', { cx: Xd(k / 5), cy: Hd - 16 - (cnt[k] - 1) * 7, r: 3, fill: D.TON.citrus.base, stroke: D.TON.citrus.texte, 'stroke-width': 1 }, sv); }
  for (const t of [3, 4, 5, 6, 7, 8]) { const x = s('text', { x: Xd(t), y: Hd - 1, 'text-anchor': 'middle', 'font-size': 12, fill: '#4a4a55' }, sv); x.textContent = t; }
  Z.append(h('div', { class: 'ligne' }, pic('citrus', 16), h('b', {}, 'Un lot n’est pas l’autre'), conf('panel', 'panel'), mesure('4,2–6,6 sur 15', 'lots', { dit: 'agrumes au panel, 29 lots de Cascade 2015 (19 fermes), 3,86 g/L, 24 h' })), h('div', { class: 'ligne' }, h('span', { class: 'k' }, 'Cascade, 29 lots, même dose'), sv));
  /* le linalol mesuré en bière, en dry hop (E06) */
  const Lm = D.COMP.E06.linalol, mx = Math.max(...Lm.map((x) => x.val));
  Z.append(h('div', { class: 'ligne' }, pic('floral', 16), h('b', {}, 'Linalol en bière, même dry hop'), conf('mesuré', 'mesure'), h('span', { class: 'src' }, 'diapositives OSU, dose non dite')));
  for (const x of Lm) Z.append(h('div', { class: 'ligne' }, h('span', { class: 'k' }, x.v.replace('témoin (sans houblon)', 'sans houblon')), h('div', { class: 'barreh' }, h('i', { style: 'left:0;width:' + (x.val / mx * 100).toFixed(1) + '%;background:' + (x.v === 'Citra' ? D.TON.floral.base : '#b8b8c2') })), mesure(fr(x.val, 1), 'E06', { unite: 'µg/L', dit: 'linalol en bière, ' + x.v + ', diapositive 17' })));
  for (const t of D.COMP.trous) Z.append(h('div', { class: 'trou' }, conf('inconnu', 'inconnu'), t));
}
function rendre() {
  document.querySelectorAll('[data-reglage="dose"]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.valeur) === ST.dose)));
  document.querySelectorAll('[data-reglage="moment"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.valeur === ST.moment)));
  document.querySelectorAll('[data-reglage="levure"]').forEach((b) => { const ok = b.dataset.valeur === 'US-05' || DH(ST.moment); b.disabled = !ok; b.setAttribute('aria-pressed', String(b.dataset.valeur === ST.lev)); });
  if (!DH(ST.moment)) ST.lev = 'US-05';
  document.getElementById('carte').replaceChildren(carte());
  rendreRep(); rendreBio(); rendreLadder(); rendreIncert();
}
document.querySelectorAll('[data-reglage="dose"]').forEach((b) => b.addEventListener('click', () => { ST.dose = Number(b.dataset.valeur); rendre(); }));
document.querySelectorAll('[data-reglage="moment"]').forEach((b) => b.addEventListener('click', () => { ST.moment = b.dataset.valeur; rendre(); }));
document.querySelectorAll('[data-reglage="levure"]').forEach((b) => b.addEventListener('click', () => { ST.lev = b.dataset.valeur; rendre(); }));
document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => setTimeout(rendre, 0)));
rendre();
`;

ecrire(OUT + '/etat.html', page({
  titre: 'La carte · r3',
  description: 'Lot 21 · r3 « La carte » : la carte du goût au style (fruité à droite, floral-herbe-terre en haut, le carré pâle = la 16D) ; chaque houblon y trace son chemin de dose 1–2–4–8 g/L (~ simulé) et l’endroit où il sort du style ; 20 brassins simulés du houblon choisi ; les chances de rester dans la 16D en classement par critère ; l’ajout cumulé (2 + 2 g/L) relié à chacun seul ; l’incertitude réelle (rapports au seuil en log, 29 lots de Cascade, linalol en bière) et les trous. Générée par generateur-r3.mjs (../r1/socle-r.mjs).',
  css: CSS + CSS_R3, corps: corps(), js: JS, donneesJS: DONNEES,
}));
