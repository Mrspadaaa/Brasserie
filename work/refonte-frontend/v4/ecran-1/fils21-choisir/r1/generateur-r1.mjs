// Lot 21 · r1 « Le verre » : ce que tu sentiras, et si ça reste dans ta 16D.
// Un verre dessiné : chaque famille y flotte à la hauteur de son niveau AU STYLE (le bord du verre = la
// limite de la 16D pour cette famille) et à une taille qui dit sa force ; ce qui passe le bord déborde,
// en orangé. Un trait vertical par famille montre sa plage (bas–haut). À côté, le petit verre de ma bière
// (Nugget 60′). On compose son ajout : un houblon ou deux ENSEMBLE, la dose (plans sage, franc, osé,
// saturé), le moment, la levure (biotransformation dessinée dans le verre). Les vraies valeurs suivent :
// α du lot, huile, 4MMP, linalol en bière (E06), la dose de Cascade mesurée (E04), les 29 lots de Cascade,
// et les trous (ce qu'aucune étude ne mesure).
// Usage : node generateur-r1.mjs  →  r1/etat.html
import { D21, donnees, page, CSS, tete, legende, pas, HOPS, ecrire, COURT } from './socle-r.mjs';
import { ic, picto } from '../../fils18-baseline/l8g/noyau.mjs';

const OUT = D21 + '/r1';
const DONNEES = JSON.stringify(donnees({ cas: (c) => ['K1', 'K2'].includes(c.groupe) }));

const CSS_R1 = `
  .q { font-size: 16px; font-weight: 700; line-height: 1.2; }
  .hops .hb { position: relative; }
  .hb .top { display: inline-flex; align-items: center; gap: 2px; font-size: 12px; font-weight: 600; color: var(--encre); }
  .hb .top.hors { color: #a8380a; }
  .pas button[aria-pressed="true"] .top { color: #fff; }
  .pas button[aria-pressed="true"] .top.hors { color: #fff; text-decoration: underline 2px #f08a5d; text-underline-offset: 3px; }
  .pas button[aria-pressed="true"] .pi { filter: none; }
  .scene { display: grid; grid-template-columns: 74px 1fr; align-items: end; gap: 4px; }
  .avant { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 12px; color: var(--gris); text-align: center; }
  .verre-z { position: relative; }
  .verre-z svg text { font-family: var(--sans); }
  .cap { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; font-size: 13px; }
  .cap .verdict { font-weight: 700; }
  .ecart { font-size: 13px; display: flex; flex-wrap: wrap; gap: 2px 8px; align-items: center; }
  .ecart .e { display: inline-flex; align-items: center; gap: 2px; }
  .bio { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 8px; background: #f6f6f9; font-size: 13px; line-height: 1.25; }
  .bio .fl { display: inline-flex; align-items: center; gap: 2px; font-weight: 700; }
  .plans { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
  .plan { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 4px 2px 5px; border-radius: 8px; background: #f6f6f9; min-height: 32px; }
  .plan[aria-pressed="true"] { background: #fff; box-shadow: inset 0 0 0 2px var(--encre); }
  .plan .d { font: 600 13px var(--mono); } .plan .d.sans { font: 700 13px var(--sans); } .plan .n { font-size: 12px; color: var(--gris); } .plan .v { font-size: 12px; font-weight: 700; }
  .plan .v.hors { color: var(--acc); }
  .bloc { display: flex; flex-direction: column; gap: 6px; padding-top: 4px; border-top: 1px solid var(--trait); }
  .bloc > h2 { font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
  .ligne { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 13px; min-height: 24px; }
  .ligne .pi { width: 16px; height: 16px; }
  .ligne .k { color: var(--gris); font-size: 12px; min-width: 64px; }
  .barreh { position: relative; height: 10px; background: #ececf1; border-radius: 2px; flex: 1; min-width: 120px; }
  .barreh i { position: absolute; top: 0; bottom: 0; border-radius: 2px; }
  .trou { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #4a4a55; }
  .pourquoi li { list-style: none; display: flex; gap: 6px; align-items: baseline; font-size: 13px; line-height: 1.3; padding: 3px 0; }
  .pourquoi li .ouvre { min-height: 24px; }
  .dot-lots { display: flex; flex-direction: column; gap: 2px; }
  .chips2 { font-size: 12px; color: var(--gris); }
  .deja { display: block; font-size: 12px; color: #c2410c; line-height: 1.15; text-align: center; } .deja .pi { display: inline-block; vertical-align: -2px; margin-right: 2px; }
  .ibu { font-size: 13px; font-weight: 600; }
  body.abs .seul-style { display: none; } body:not(.abs) .seul-abs { display: none; }`;

const corps = () => `
  ${tete(ic)}
  <p class="q" id="question">Qu’est-ce que je vais sentir ?</p>
  <div data-role="reglages-houblon">
    <div class="regl"><span class="lab">Houblon<br><span class="chips2">1 ou 2</span></span><div class="pas hops" role="group" aria-label="Houblon : un seul, ou deux ensemble" id="hops"></div></div>
    <button class="ouvre" id="cumul" data-role="reglage" data-reglage="ajout-cumule" aria-pressed="false"></button>
  </div>
  <section class="simu" data-role="simulation" id="simu" aria-label="Le verre simulé">
    <span class="sim-t">~ simulé par le moteur, à côté de ma bière</span>
    <div class="scene">
      <div class="avant" id="avant"></div>
      <div class="verre-z" id="verre"></div>
    </div>
    <div class="cap" id="cap"></div>
    <div class="ecart" id="ecart"></div>
    <div id="biot"></div>
  </section>
  <div class="regl" id="plans-z" data-role="simulation"><span class="lab">Dose</span><div class="plans" id="plans" role="group" aria-label="Dose : quatre plans, ~ simulé"></div></div>
  ${pas('moment', 'Moment', [['b60', '60′'], ['b10', '10′'], ['wp', 'whirl.'], ['dryActive', 'actif'], ['dryPost', 'après']], 'dryPost', { aria: 'Moment de l’ajout' })}
  ${pas('levure', 'Levure', [['US-05', 'US-05'], ['Verdant', 'Verdant'], ['Pomona', 'Pomona'], ['Diamond', 'Diamond']], 'US-05', { aria: 'Levure' })}
  <p class="src" id="lev-non"></p>
  <section class="bloc" id="vraies" aria-label="Ce qui est mesuré"></section>
  <section class="bloc" id="pourquoi" aria-label="Pourquoi"></section>
  ${legende(ic, picto, `
    <div class="leg-s"><h3>Le verre</h3><div class="leg-g l1">
      <span class="leg-i"><span>Chaque famille flotte à la hauteur de son niveau au style : le bord du verre est la limite de la 16D pour cette famille. Au-dessus, en orangé : hors du style.</span></span>
      <span class="leg-i"><span>Plus le picto et le nom sont grands, plus la famille est forte (~ simulé). Le trait vertical : sa plage, du bas au haut.</span></span>
      <span class="leg-i"><span>Absolu : la même chose sur 0–100, sans le bord du style ; faible, moyen, marqué.</span></span>
      <span class="leg-i"><span>Le petit verre : ma bière, Nugget à 60′, sans l’ajout.</span></span>
    </div></div>`)}`;

const JS = `
const ST = { hops: ['Citra'], dose: 4, moment: 'dryPost', lev: 'US-05' };
{ const q = new URLSearchParams(location.search); if (q.get('h')) ST.hops = q.get('h').split(',').slice(0, 2); if (q.get('d')) ST.dose = Number(q.get('d')); if (q.get('m')) ST.moment = q.get('m'); if (q.get('l')) ST.lev = q.get('l'); }
const DH = (m) => m === 'dryActive' || m === 'dryPost';
const ABS = () => document.body.classList.contains('abs');
const LIBM = { b60: 'à 60′', b10: 'à 10′', wp: 'au whirlpool', dryActive: 'en dry hop actif, 3 j', dryPost: 'en dry hop après fermentation, 3 j' };
/* Le profil de l'état : un houblon (grille du moteur) ou deux ensemble (grillePaires, 2 + 2 g/L, 3 j). Null : pas simulé. */
function profilDe(hops, dose, moment, lev) {
  if (hops.length === 2) return DH(moment) ? GP(hops[0], hops[1], moment, lev) : null;
  return G(hops[0], moment, dose, DH(moment) ? 3 : null, lev);
}
/* Les levures simulées par le moteur pour cet état. */
const levOk = (l) => (ST.hops.length === 2 ? DH(ST.moment) && !!GPe(ST.hops[0], ST.hops[1], ST.moment, l) : !!Ge(ST.hops[0], ST.moment, ST.dose, DH(ST.moment) ? 3 : null, l));
/* Le cas du moteur « pouvoir » qui porte les vrais rapports au seuil de cet état (4 g/L, US-05, un houblon). */
const casMoteur = () => { if (ST.hops.length !== 1 || ST.dose !== 4 || ST.lev !== 'US-05') return null; const hp = ST.hops[0], n = hp.toLowerCase().replace(' ', '-');
  return D.CAS['K1-' + n + '-' + ST.moment] || (ST.moment === 'dryPost' ? D.CAS['K2-' + n] : null) || null; };

/* ---------- le verre ---------- */
function verre(p, o) {
  const W = o.w, Hh = o.h, mini = !!o.mini;
  const Yb = Hh - 6, Yr = mini ? Hh * 0.42 : Hh * 0.38, top = 4;
  const lv = (f, v) => (ABS() ? v / 100 * 1.6 : niv(f, v));
  const Y = (l) => (ABS() ? Yb - Math.min(l, 1.6) / 1.6 * (Yb - top) : l <= 1 ? Yb - l * (Yb - Yr) : Yr - Math.min(l - 1, 1.6) / 1.6 * (Yr - top));
  const cx = mini ? W / 2 : W * 0.46, wr = W * (mini ? 0.86 : 0.74), wb = W * (mini ? 0.62 : 0.54);
  const larg = (y) => wb + (wr - wb) * Math.max(0, Math.min(1, (Yb - y) / (Yb - (ABS() ? top + 2 : Yr))));
  const v = s('svg', { width: W, height: Hh, viewBox: '0 0 ' + W + ' ' + Hh, role: 'img', 'data-nature': 'simule', 'aria-label': o.label });
  const defs = s('defs', {}, v);
  const pat = s('pattern', { id: 'deb' + (mini ? 'm' + o.k : ''), width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
  s('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: ACC, 'stroke-width': 1.2, 'stroke-opacity': 0.28 }, pat);
  const mk = s('marker', { id: 'fl' + (mini ? 'm' + o.k : ''), viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
  s('path', { d: 'M0,0 L10,5 L0,10 z', fill: '#16161a' }, mk);
  /* le débordement : au-dessus du bord, hachures orangées (seulement au style) */
  if (!ABS()) s('rect', { x: cx - wr / 2 - 8, y: top, width: wr + 16, height: Yr - top, fill: 'url(#deb' + (mini ? 'm' + o.k : '') + ')', rx: 4 }, v);
  /* le verre : son intérieur pâle est la zone du style */
  const r = 10, g = s('g', { 'data-role': 'zone', 'aria-label': 'Zone de la 16D' }, v), Yv = ABS() ? top + 2 : Yr;
  s('path', { d: 'M' + (cx - wr / 2) + ',' + Yv + ' L' + (cx - wb / 2) + ',' + (Yb - r) + ' Q' + (cx - wb / 2) + ',' + Yb + ' ' + (cx - wb / 2 + r) + ',' + Yb + ' L' + (cx + wb / 2 - r) + ',' + Yb + ' Q' + (cx + wb / 2) + ',' + Yb + ' ' + (cx + wb / 2) + ',' + (Yb - r) + ' L' + (cx + wr / 2) + ',' + Yv, fill: ABS() ? '#fafafc' : '#f3f3f7', stroke: '#16161a', 'stroke-width': mini ? 1.5 : 2, 'stroke-linejoin': 'round' }, g);
  if (!ABS()) { s('line', { x1: cx - wr / 2 - 6, y1: Yr, x2: cx + wr / 2 + 6, y2: Yr, stroke: '#16161a', 'stroke-width': 1.5, 'stroke-dasharray': '5 3' }, v);
    if (!mini) { const t = s('text', { x: cx + wr / 2 + 8, y: Yr + 4, 'font-size': 12, 'font-weight': 700, fill: '#16161a' }, v); t.textContent = '16D';
      const t2 = s('text', { x: cx - wr / 2 - 4, y: top + 13, 'font-size': 12, 'font-weight': 700, fill: '#c2410c' }, v); t2.textContent = 'hors 16D'; } }
  else if (!mini) for (const [l, m] of [[33, 'faible'], [66, 'moyen'], [100, 'marqué']]) { const y = Y(l / 100 * 1.6); s('line', { x1: cx - wr / 2 - 4, y1: y, x2: cx - wr / 2 + 6, y2: y, stroke: '#5b5b66', 'stroke-width': 1 }, v); const t = s('text', { x: cx - wr / 2 - 6, y: y + 4, 'text-anchor': 'end', 'font-size': 12, fill: '#5b5b66' }, v); t.textContent = m; }
  if (!p) { const t = s('text', { x: cx, y: (Yr + Yb) / 2, 'text-anchor': 'middle', 'font-size': 13, fill: '#4a4a55' }, v); t.textContent = 'pas simulé'; return v; }
  /* les familles : taille = force, hauteur = niveau au style ; placement sans chevauchement.
     Règle stricte : une famille dans le style reste sous le bord, une famille hors du style au-dessus. */
  const fams = tri(p).filter((f) => p[f].c >= (o.seuil ?? (mini ? 8 : 6))).slice(0, mini ? 4 : 9);
  const pos = !mini ? [...(!ABS() ? [{ x: cx - wr / 2 - 6, y: top, w: 64, h: 18, f: null }] : []), { x: cx - 40, y: Yb - 22, w: 80, h: 18, f: null }] : [], rates = [];
  for (const [rang, f] of fams.entries()) {
    const c = p[f].c, l = lv(f, c), dehors = !ABS() && l > 1;
    const yMin = ABS() ? top + 2 : dehors ? top + 2 : Yr + 3, yMax = ABS() ? Yb - 3 : dehors ? Yr - 3 : Yb - 3;
    let place = null, z = 0, fs = 0;
    for (const k of [1, 0.82, 0.66, 0.52]) {
      const cz = DEJA.includes(f) ? Math.min(c, 40) : c;
      z = Math.max(10, Math.round((mini ? 10 + cz / 100 * 10 : 14 + cz / 100 * 24) * k));
      fs = mini ? 0 : Math.max(12, Math.round((rang < 2 ? (c >= 45 ? 15 : 14) : c >= 30 ? 13 : 12) * (k < 1 ? 0.93 : 1)));
      const lab = mini ? '' : D.COURT[f] + (DEJA.includes(f) ? ' · ta bière' : ''), lw = mini ? 0 : Math.round(lab.length * fs * 0.55) + 4;
      const bw = z + (lw ? 3 + lw : 0), bh = Math.max(z, fs + 2);
      if (yMax - yMin < bh) continue;
      const y0 = Math.max(yMin + bh / 2, Math.min(yMax - bh / 2, Y(l)));
      for (let i = 0; i < 26 && !place; i++) {
        const dy = (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 5, y = y0 + dy;
        if (y - bh / 2 < yMin || y + bh / 2 > yMax) continue;
        const L = (dehors ? wr + 14 : ABS() ? larg(y + bh / 2) : larg(y + bh / 2)) - 10;
        const xs = []; for (let x = cx - L / 2; x + bw <= cx + L / 2 + 0.1; x += 4) xs.push(x);
        xs.sort((a, b) => Math.abs(a + bw / 2 - cx) - Math.abs(b + bw / 2 - cx));
        for (const x of xs) { const bx = { x, y: y - bh / 2, w: bw, h: bh }; if (!pos.some((q) => !(bx.x + bx.w + 2 < q.x || q.x + q.w + 2 < bx.x || bx.y + bx.h + 1 < q.y || q.y + q.h + 1 < bx.y))) { place = bx; break; } }
      }
      if (place) break;
    }
    if (!place) { rates.push(f); continue; }
    pos.push({ ...place, f });
    const xc = place.x + z / 2, yc = place.y + place.h / 2;
    /* la plage du simulé : du bas au haut, au ton de la famille */
    const yb = Y(lv(f, p[f].b)), yh = Y(lv(f, p[f].h));
    if (!mini && rang < 4) { const yt = Math.max(top, yh); s('line', { x1: xc, y1: yb, x2: xc, y2: yt, stroke: D.TON[f].base, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-opacity': 0.55, 'stroke-dasharray': p[f].hp ? '6 3' : null }, v);
      if (yh <= top + 0.5) s('path', { d: 'M' + (xc - 4) + ',' + (top + 5) + ' L' + xc + ',' + (top - 1) + ' L' + (xc + 4) + ',' + (top + 5), fill: 'none', stroke: D.TON[f].texte, 'stroke-width': 1.5 }, v); }
    s('use', { href: '#p-' + f, x: xc - z / 2, y: yc - z / 2, width: z, height: z }, v);
    const lab = mini ? '' : D.COURT[f] + (DEJA.includes(f) ? ' · ta bière' : '');
    if (lab) { const t = s('text', { x: place.x + z + 3, y: yc + fs * 0.35, 'font-size': fs, 'font-weight': rang < 3 ? 700 : 600, fill: c > lim(f) ? '#c2410c' : D.TON[f].texte }, v); t.textContent = lab; }
  }
  const peu = FAM.filter((f) => p[f].c > 0 && p[f].c < (o.seuil ?? (mini ? 8 : 6))).length + rates.length;
  if (!mini && peu) { const t = s('text', { x: cx, y: Yb - 8, 'text-anchor': 'middle', 'font-size': 12, fill: '#4a4a55' }, v); t.textContent = '+' + peu + ' à peine'; }
  v.__pos = pos; v.__Y = Y;
  return v;
}

/* ---------- la page ---------- */
function topFam(p) { return FAM.slice().sort((a, b) => (p[b].c - AVANT[b].c) - (p[a].c - AVANT[a].c))[0]; }
function rendreHops() {
  const z = document.getElementById('hops');
  if (!z.children.length) for (const hop of ['Citra', 'Galaxy', 'Idaho 7', 'Cascade']) {
    const b = h('button', { class: 'hb', 'data-role': 'reglage', 'data-reglage': 'houblon', 'data-valeur': hop }, nomH(hop), alphaEl(hop), h('span', { class: 'top' }));
    b.addEventListener('click', () => { const i = ST.hops.indexOf(hop); if (i >= 0) { if (ST.hops.length === 1) return; ST.hops.splice(i, 1); } else { ST.hops.push(hop); if (ST.hops.length > 2) ST.hops.shift(); } if (ST.hops.length === 2 && !DH(ST.moment)) ST.moment = 'dryPost'; rendre(); });
    z.append(b);
  }
  for (const b of z.children) { const hop = b.dataset.valeur, on = ST.hops.includes(hop);
    const p = profilDe([hop], ST.hops.length === 2 ? 4 : ST.dose, ST.moment, ST.lev), f = p && topFam(p);
    b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', hop + (on ? ', choisi' : ''));
    b.lastChild.replaceWith(p ? h('span', { class: 'top' + (p[f].c > lim(f) ? ' hors' : ''), 'data-nature': 'simule', 'aria-label': 'surtout ' + D.NOM[f] + ', simulé' }, pic(f, 12), '~' + D.COURT[f]) : h('span', { class: 'top' }, 'inconnu')); }
  const c = document.getElementById('cumul'), deux = ST.hops.length === 2;
  c.setAttribute('aria-pressed', String(deux)); c.textContent = deux ? '− retirer ' + ST.hops[1] : '+ un 2ᵉ houblon, ensemble (2 + 2 g/L)';
}
const PLANS = [];
function rendrePlans() {
  const z = document.getElementById('plans'); z.replaceChildren();
  const lab = document.querySelector('#plans-z .lab');
  if (ST.hops.length === 2) {
    lab.textContent = 'Ensemble';
    const [a, b] = ST.hops;
    const items = [[a + ' seul', [a], 4, '4 g/L'], ['2 + 2 g/L', ST.hops, 2, 'ensemble'], [b + ' seul', [b], 4, '4 g/L']];
    z.style.gridTemplateColumns = 'repeat(3, 1fr)';
    for (const [t, hs, d, n] of items) { const p = profilDe(hs, d, ST.moment, ST.lev); const ok = p && !horsStyle(p).length;
      z.append(h('div', { class: 'plan', 'aria-pressed': String(hs.length === 2) }, p ? verre(p, { w: 64, h: 52, mini: true, k: t.length + d, label: t }) : null, h('span', { class: 'd' + (hs.length === 1 ? ' sans' : '') }, t), h('span', { class: 'n' }, n),
        p ? h('span', { class: 'v' + (ok ? '' : ' hors'), 'data-nature': 'simule' }, ok ? '~ dans 16D' : '~ déborde') : h('span', { class: 'v' }, 'inconnu'))); }
    return;
  }
  lab.textContent = 'Dose'; z.style.gridTemplateColumns = 'repeat(4, 1fr)';
  if (!PLANS.length) for (const [d, n] of [[1, 'sage'], [2, 'franc'], [4, 'osé'], [8, 'saturé']]) { const b = h('button', { class: 'plan', 'data-role': 'reglage', 'data-reglage': 'dose', 'data-valeur': String(d), 'aria-label': d + ' g/L, plan ' + n }); b.addEventListener('click', () => { ST.dose = d; rendre(); }); PLANS.push([b, d, n]); }
  for (const [b, d, n] of PLANS) {
    const p = profilDe(ST.hops, d, ST.moment, ST.lev), ok = p && !horsStyle(p).length;
    b.setAttribute('aria-pressed', String(ST.dose === d));
    b.replaceChildren(...[p ? verre(p, { w: 64, h: 52, mini: true, k: d, label: d + ' g/L' }) : null, h('span', { class: 'd' }, d + ' g/L'), h('span', { class: 'n' }, n),
      p ? h('span', { class: 'v' + (ok ? '' : ' hors'), 'data-nature': 'simule' }, ok ? '~ dans 16D' : '~ déborde') : h('span', { class: 'v' }, 'inconnu')].filter(Boolean));
    z.append(b);
  }
}
const BIO = {
  'US-05': ['floral', 'floral', 'géraniol et nérol un peu plus hauts avec US-05', 'H44'],
  Verdant: ['tropical', 'tropical', 'β-lyase : des thiols libérés des précurseurs, 0,01–0,35 % (précurseur de synthèse)', 'H42'],
  Pomona: ['floral', 'citrus', 'géraniol → citronellol, « medium » : du floral vers les agrumes', 'H50-pomona'],
  Diamond: ['tropical', 'tropical', 'le plus de thiols mesurés, mais le fruité perçu le plus faible', 'samia2026'],
};
function rendreBio(p, svg) {
  const z = document.getElementById('biot'); z.replaceChildren();
  let txt, fl = null;
  if (!DH(ST.moment)) txt = h('span', {}, 'Pas de levure au contact du houblon chaud : ', h('b', {}, 'pas de biotransformation'), '.');
  else if (ST.moment === 'dryPost') txt = h('span', {}, 'Après fermentation, la levure est au repos : biotransformation ', h('b', {}, 'hors du cas'), ' (sens seulement en fermentation active).');
  else { const [a, b, t, src] = BIO[ST.lev]; fl = [a, b];
    txt = h('span', {}, h('span', { class: 'fl' }, pic(a, 16), a !== b ? '→' : '', a !== b ? pic(b, 16) : null), ' ', ST.lev + ' : ' + t + ' ', srcB(src, t, 'source de la biotransformation'), ' · ', conf('sens', 'panel')); }
  z.append(h('div', { class: 'bio', 'data-role': 'biotransformation' }, txt));
  /* la flèche dans le verre : de la famille qui perd vers celle qui gagne (Pomona) */
  if (fl && fl[0] !== fl[1] && svg && svg.__pos) { const A = svg.__pos.find((q) => q.f === fl[0]), B = svg.__pos.find((q) => q.f === fl[1]);
    if (A && B) { const x1 = A.x + 10, y1 = A.y + A.h / 2, x2 = B.x + 10, y2 = B.y + B.h / 2, mx = (x1 + x2) / 2 + 30;
      s('path', { d: 'M' + x1 + ',' + y1 + ' Q' + mx + ',' + ((y1 + y2) / 2) + ' ' + x2 + ',' + (y2 + 8), fill: 'none', stroke: '#16161a', 'stroke-width': 1.5, 'stroke-dasharray': '3 2', 'marker-end': 'url(#fl)', 'data-role': 'biotransformation' }, svg); } }
}
function phrase(p) {
  const hs = ST.hops, f3 = tri(p).filter((f) => p[f].c >= 15).slice(0, 3);
  const qui = hs.length === 2 ? hs.join(' + ') + ' (2 + 2 g/L)' : hs[0] + ' ' + ST.dose + ' g/L';
  return qui + ' ' + LIBM[ST.moment] + ' : ' + (f3.length ? f3.map((f) => D.COURT[f].toLowerCase()).join(', ') : 'presque rien au nez');
}
function rendreScene() {
  const p = profilDe(ST.hops, ST.dose, ST.moment, ST.lev);
  const A = document.getElementById('avant'); A.replaceChildren(verre(AVANT, { w: 70, h: 92, mini: true, k: 'av', seuil: 1, label: 'Ma bière, sans l’ajout' }), h('span', {}, 'ma bière'), h('span', {}, 'sans ajout'),
    ...DEJA.map((f) => h('span', { class: 'deja', 'data-nature': 'mesure', 'data-source': 'dégustation', 'data-src': 'degust', 'data-src-texte': D.degust ? '« ' + D.degust.c + ' », ' + D.degust.d : 'ta dégustation' }, pic(f, 12), D.COURT[f].toLowerCase() + ' : ta dégustation')));
  const V = document.getElementById('verre'); const svg = verre(p, { w: 290, h: 250, label: p ? 'Simulé : ' + phrase(p) : 'pas simulé' }); V.replaceChildren(svg);
  const C = document.getElementById('cap'); C.replaceChildren();
  C.append(conf('~ simulé', 'estime'));
  if (p) { const hs = horsStyle(p), pe = peutEtre(p), an = analogie(p);
    C.append(...[h('span', { class: 'verdict' + (hs.length ? ' hors' : ''), 'data-nature': 'simule' }, hs.length ? '~ déborde de la 16D' : pe.length ? '~ au bord de la 16D' : '~ reste dans la 16D'),
      an.code === '16D' ? null : h('span', { 'data-nature': 'simule', 'aria-label': 'analogie, bandes BJCP du prototype' }, an.texte), h('span', { class: 'sim-t' }, phrase(p))].filter(Boolean));
    const chaud = { b60: 'moment60', b10: 'tardif', wp: 'tardif' }[ST.moment];
    if (chaud) C.append(h('span', { class: 'sim-t' }, h('b', {}, 'Pourquoi ? '), D.DR[chaud].t + ' '), srcB(D.DR[chaud].s[0], D.DR[chaud].d || D.DR[chaud].t));
    const cm = casMoteur(), ibu = cm && cm.m.find((x) => x.ty === 'ibu');
    if (ibu && ibu.p) C.append(h('span', { class: 'ibu', 'data-nature': 'simule', 'aria-label': 'IBU estimé par le moteur' }, '≈ ' + fr(ibu.v, 0) + ' IBU (' + fr(ibu.p[0], 0) + '–' + fr(ibu.p[1], 0) + '), estimé de l’α'));
    const E = document.getElementById('ecart'); E.replaceChildren(h('span', { class: 'sim-t' }, 'Ce que ça change :'));
    const dif = FAM.map((f) => [f, p[f].c - AVANT[f].c]).filter((x) => Math.abs(x[1]) >= 8).sort((a, b) => b[1] - a[1]).slice(0, 4);
    for (const [f, d] of dif) E.append(h('span', { class: 'e', 'data-nature': 'simule' }, pic(f, 14), (d > 0 ? '+' : '−') + D.COURT[f].toLowerCase() + ' ~' + (cran(p[f].c) - cran(AVANT[f].c) > 0 ? '+' + (cran(p[f].c) - cran(AVANT[f].c)) : '0')));
    if (!dif.length) E.append(h('span', { 'data-nature': 'simule' }, '~ presque rien'));
    if (DEJA.length) C.append(h('span', { class: 'sim-t' }, DEJA.map((f) => D.COURT[f]).join(', ') + ' : déjà hors 16D dans ta bière (dégustation), pas à cause de l’ajout.'));
  } else { C.append(h('span', { class: 'verdict' }, 'inconnu : pas de profil simulé pour cet état (ni zéro, ni moyenne)')); document.getElementById('ecart').replaceChildren(); }
  rendreBio(p, svg);
}
function ligneV(f, k, val) { return h('div', { class: 'ligne' }, f ? pic(f, 16) : null, h('span', { class: 'k' }, k), ...[].concat(val)); }
function rendreVraies() {
  const Z = document.getElementById('vraies'); Z.replaceChildren(h('h2', {}, 'Ce qui est mesuré ', conf('mesuré', 'mesure')));
  for (const hop of ST.hops) { const V = D.V[hop];
    Z.append(h('div', { class: 'ligne' }, nomH(hop), alphaEl(hop), h('span', { class: 'al fi', 'data-role': 'alpha', 'data-source': 'fiches', 'data-nature': 'mesure', 'data-src': 'c2', 'data-src-texte': 'plage des fiches' + (hop === 'Citra' ? ' du Citra en pellets ; celle du cryo manque' : '') }, icone('livre', 12), fr(V.alpha.fiches[0], 1) + '–' + fr(V.alpha.fiches[1], 1) + '%', hop === 'Citra' ? h('span', { class: 'pel' }, 'pellets') : null), usageEl(hop)));
    Z.append(ligneV(null, 'huile', [mesure(frp(V.huile.min, V.huile.max, 1), V.huile.src[0], { unite: 'mL/100 g', dit: 'huile totale, enveloppe des fiches (' + V.huile.src.join(', ') + ')' }),
      hop === 'Citra' && V.huileCryo ? mesure(frp(V.huileCryo.min, V.huileCryo.max, 0), 'H1', { unite: 'en cryo, ton lot', dit: 'huile du Citra cryo (onglet Cryo)' }) : null]));
    Z.append(ligneV('tropical', '4MMP', V.m4.inconnu ? conf('inconnu', 'inconnu') : [mesure(frp(V.m4.min, V.m4.max, 1), 'H11', { unite: 'µg/kg', dit: 'thiol du houblon, base commune Hopsteiner 2024 (97 variétés)' }), h('span', { class: 'src' }, hop === 'Citra' ? 'le plus haut des 97' : '')]));
  }
  /* le linalol en bière, en dry hop : la seule étude qui met Citra dans la même bière que d'autres */
  if (ST.hops.includes('Citra') || ST.hops.includes('Cascade')) {
    const L = D.COMP.E06.linalol, mx = Math.max(...L.map((x) => x.val));
    const z = h('div', { class: 'dot-lots' }, h('div', { class: 'ligne' }, pic('floral', 16), h('span', { class: 'k' }, 'linalol en bière'), conf('mesuré', 'mesure'), h('span', { class: 'src' }, 'même dry hop, dose non dite')));
    for (const x of L) z.append(h('div', { class: 'ligne' }, h('span', { class: 'k' }, x.v.replace('témoin (sans houblon)', 'sans houblon')), h('div', { class: 'barreh' }, h('i', { style: 'left:0;width:' + (x.val / mx * 100).toFixed(1) + '%;background:' + (x.v === 'Citra' ? D.TON.floral.base : '#b8b8c2') })), mesure(fr(x.val, 1), 'E06', { unite: 'µg/L', dit: 'linalol en bière, ' + x.v + ', diapositive 17 (OSU 2015)' })));
    Z.append(z);
  }
  /* la dose de Cascade, mesurée au panel : les agrumes plafonnent vers 8 g/L */
  if (ST.hops.length === 1) {
    const doses = [0, 2, 3.86, 8, 16], ag = [2.5, 4.3, 5.7, 7.4, 10.4], cit = [1.9, 4.4, 5.8, 7.1, 7.0];
    const W = 200, H = 54, X = (d) => 8 + d / 16 * (W - 16), Yv = (v) => H - 6 - v / 15 * (H - 12);
    const sv = s('svg', { width: W, height: H, role: 'img', 'aria-label': 'Cascade, panel OSU : agrumes 1,9 ; 4,4 ; 5,8 ; 7,1 ; 7,0 sur 15 à 0, 2, 3,86, 8 et 16 g/L' });
    s('line', { x1: X(4), y1: 4, x2: X(4), y2: H - 6, stroke: '#9a9aa6', 'stroke-dasharray': '2 2' }, sv); s('line', { x1: X(8), y1: 4, x2: X(8), y2: H - 6, stroke: '#9a9aa6', 'stroke-dasharray': '2 2' }, sv);
    s('polyline', { points: doses.map((d, i) => X(d) + ',' + Yv(cit[i])).join(' '), fill: 'none', stroke: D.TON.citrus.base, 'stroke-width': 2.5 }, sv);
    for (const [i, d] of doses.entries()) s('circle', { cx: X(d), cy: Yv(cit[i]), r: 3, fill: '#fff', stroke: D.TON.citrus.texte, 'stroke-width': 1.5 }, sv);
    for (const d of [0, 4, 8, 16]) { const t = s('text', { x: X(d), y: H + 11, 'text-anchor': 'middle', 'font-size': 12, fill: '#4a4a55' }, sv); t.textContent = d === 16 ? '16 g/L' : String(d); }
    sv.setAttribute('height', H + 14);
    Z.append(h('div', { class: 'ligne' }, pic('citrus', 16), h('span', { class: 'k' }, 'dose, Cascade'), sv, conf('panel', 'panel')),
      h('div', { class: 'ligne' }, h('span', { class: 'k' }, ''), mesure('1,9 · 7,1 · 7,0', 'E04', { unite: 'sur 15 à 0 · 8 · 16 g/L', dit: 'agrumes au panel à 0 ; 8 ; 16 g/L, Cascade, 24 h ; part de linalol extraite 23 % à 2 g/L, 7 % à 16 g/L' }), h('span', { class: 'src' }, 'plafond vers 8 g/L')));
  }
  /* les 29 lots de Cascade : la même dose, des agrumes de 4,2 à 6,6 sur 15 */
  if (ST.hops.includes('Cascade')) {
    const vs = D.LOTS.valeurs, W = 240, H = 40, X = (v) => 6 + (v - 3) / 5 * (W - 12);
    const sv = s('svg', { width: W, height: H, 'data-role': 'incertitude', role: 'img', 'aria-label': '29 lots de Cascade, agrumes de 4,2 à 6,6 sur 15' });
    const cnt = {}; for (const v of vs) { const k = Math.round(v * 10); cnt[k] = (cnt[k] || 0) + 1; s('circle', { cx: X(v), cy: H - 12 - (cnt[k] - 1) * 7, r: 3, fill: D.TON.citrus.base, stroke: D.TON.citrus.texte, 'stroke-width': 1 }, sv); }
    for (const t of [3, 5, 7]) { const x = s('text', { x: X(t), y: H - 1, 'text-anchor': 'middle', 'font-size': 12, fill: '#5b5b66' }, sv); x.textContent = t; }
    Z.append(h('div', { class: 'ligne' }, pic('citrus', 16), h('span', { class: 'k' }, '29 lots'), conf('panel', 'panel'), mesure('4,2–6,6', 'lots', { unite: 'sur 15', dit: 'agrumes, 29 lots de Cascade 2015, 3,86 g/L, 24 h (Lafontaine 2018)' })), h('div', { class: 'ligne' }, sv));
  }
  /* les trous : ce qu'aucune étude ne mesure */
  const T = D.COMP.trous.filter((t) => (ST.hops.includes('Galaxy') || !/Galaxy/.test(t)) && (ST.hops.includes('Idaho 7') || !/Idaho/.test(t)) && (ST.lev !== 'US-05' || !/levure/.test(t)));
  for (const t of T) Z.append(h('div', { class: 'trou' }, conf('inconnu', 'inconnu'), t));
}
function rendrePourquoi() {
  const Z = document.getElementById('pourquoi'); Z.replaceChildren(h('h2', {}, 'Pourquoi ?'));
  const ids = []; const m = ST.moment;
  if (m === 'b60') ids.push('moment60'); if (m === 'b10' || m === 'wp') ids.push('tardif');
  if (DH(m)) ids.push('essentiel24h', 'plafond3j', 'hopCreep'); if (m === 'dryActive') ids.push('co2');
  if (ST.hops.length === 2 || (ST.dose >= 4 && DH(m))) ids.push('saturation');
  if (ST.hops.length === 2) ids.push('synergie');
  if (ST.hops.includes('Citra')) ids.push('cryo');
  ids.push('biereNoire');
  const ul = h('ul', { class: 'pourquoi' });
  for (const id of ids) { const d = D.DR[id]; if (!d) continue; const li = h('li', {}, h('span', {}, d.t), srcB(d.s[0], d.d || d.t, 'source : ' + d.t)); ul.append(li); }
  Z.append(ul, h('button', { class: 'ouvre', onclick: () => detail() }, 'Toutes les familles, plages et sources ›'));
}
/* la feuille de détail : les 12 familles en barres de l5b (crans du style, zone pâle, orangé au-delà) */
function barresL5b(p) {
  const W = 342, H = 118, n = 12, cw = W / n, base = H - 30, px = 8;
  const v = s('svg', { width: W, height: H, role: 'img', 'data-nature': 'simule', 'aria-label': 'Les 12 familles, simulées, en crans du style' });
  FAM.forEach((f, i) => { const x = i * cw + cw / 2, cr = lim(f) / 3, z = 3 * px, hgt = Math.min(5, p[f].c / cr) * px, g = s('g', { 'data-famille': f }, v);
    s('rect', { x: x - 7, y: base - z, width: 14, height: z, fill: D.TON[f].fond, 'data-role': 'zone' }, g);
    s('line', { x1: x - 8, y1: base - z, x2: x + 8, y2: base - z, stroke: D.TON[f].texte, 'stroke-width': 1.5 }, g);
    const dans = Math.min(hgt, z); s('rect', { x: x - 5, y: base - dans, width: 10, height: dans, fill: D.TON[f].base, rx: 2 }, g);
    if (hgt > z) s('rect', { x: x - 5, y: base - hgt, width: 10, height: hgt - z, fill: ACC, rx: 2 }, g);
    s('line', { x1: x, y1: base - Math.min(5, p[f].b / cr) * px, x2: x, y2: base - Math.min(5, p[f].h / cr) * px, stroke: '#16161a', 'stroke-width': 1.2 }, g);
    s('use', { href: '#p-' + f, x: x - 8, y: base + 4, width: 16, height: 16 }, g);
    const t = s('text', { x, y: H - 1, 'text-anchor': 'middle', 'font-size': 12, fill: '#16161a' }, g); t.textContent = D.COURT[f].slice(0, 4) + '.'; });
  return v;
}
function bandeLog(r) {
  const [f, comp, mn, mx, ce] = r, W = 330, H = 34, L = (x) => 4 + (Math.log10(Math.max(x, 0.001)) + 3) / 7 * (W - 8);
  const v = s('svg', { width: W, height: H, 'data-role': 'incertitude', role: 'img', 'aria-label': 'rapport au seuil de ' + comp + ' : ×' + fr(mn, 2) + ' à ×' + fr(mx, 0) });
  s('rect', { x: 4, y: 10, width: W - 8, height: 8, fill: '#ececf1', rx: 2 }, v);
  s('rect', { x: L(mn), y: 8, width: Math.max(3, L(mx) - L(mn)), height: 12, fill: D.TON[f].base, rx: 2 }, v);
  if (ce) s('line', { x1: L(ce), y1: 4, x2: L(ce), y2: 24, stroke: '#16161a', 'stroke-width': 2 }, v);
  for (const [x, t] of [[0.001, '×0,001'], [1, '×1 seuil'], [100, '×100'], [10000, '×10 000']]) { s('line', { x1: L(x), y1: 18, x2: L(x), y2: 24, stroke: '#5b5b66' }, v); const tt = s('text', { x: L(x), y: 33, 'text-anchor': x === 0.001 ? 'start' : x === 10000 ? 'end' : 'middle', 'font-size': 12, fill: '#4a4a55' }, v); tt.textContent = t; }
  return v;
}
function detail() {
  const p = profilDe(ST.hops, ST.dose, ST.moment, ST.lev); const corps = [];
  if (p) corps.push(h('div', { class: 'fe-s', 'data-role': 'simulation' }, h('h3', {}, '~ simulé, 12 familles en crans du style (barres de l5b)'), barresL5b(p)));
  const cm = casMoteur();
  const FAMC = { linalol: 'floral', 'géraniol': 'floral', '4MMP (4MSP)': 'tropical', 'myrcène': 'resin', 'humulène': 'spice', 'caryophyllène': 'spice', '3MH (3SH)': 'citrus', '3M4MP (3S4MP)': 'citrus' };
  const rs = cm ? cm.m.filter((x) => x.ty === 'compose' && x.rp && x.rp[0] != null && x.rp[1] != null) : [];
  if (rs.length) { const z = h('div', { class: 'fe-s' }, h('h3', {}, 'Rapport au seuil de chaque composé (moteur « pouvoir », échelle log) ', conf('calculé de valeurs publiées', 'mesure')));
    for (const x of rs) { const f = FAMC[x.co] || 'floral', r = [f, x.co, x.rp[0], x.rp[1], x.rp[2]];
      const pub = cm.m.find((y) => y.ty === 'publiee' && y.co === x.co.replace(' (4MSP)', '') && typeof y.v === 'number');
      z.append(h('div', { class: 'fe-l' }, pic(f, 16), h('b', {}, x.co), ' ', mesure('×' + fr(x.rp[0], x.rp[0] < 0.1 ? 3 : 2) + ' à ×' + fr(x.rp[1], 0), x.s[0] || 'spec', { dit: 'rapport au seuil, de la plus petite à la plus grande valeur publiée (' + x.s.join(', ') + ') ; repère noir : central ×' + fr(x.rp[2], 1) + ' ; ' + (x.rl || '') })), bandeLog(r));
      if (x.cc) z.append(h('div', { class: 'fe-l' }, h('span', { class: 'src' }, 'en bière, calculé : '), simule('~' + fr(x.cc[2], 0) + ' ' + x.cc[3] + ' (' + fr(x.cc[0], 0) + '–' + fr(x.cc[1], 0) + ')'),
        pub ? h('span', { class: 'src' }, ' · mesuré ailleurs : ') : null, pub ? mesure(fr(pub.v, 0) + ' ' + pub.u, pub.s[0], { dit: 'publié, ' + (pub.t || '') + ', dose non dite ; le centre calculé est plus haut' }) : null,
        pub ? h('span', { class: 'src' }, 'dose non dite') : null, pub && /vérifier/.test((pub.t || '') + (pub.b || '')) ? conf('à vérifier', 'verif') : null)); }
    z.append(h('p', { class: 'src' }, 'Une plage de ×0,06 à ×2 000 dit : selon la source du seuil et la base, on ne sait pas si c’est sous ou très au-dessus du seuil. Ce n’est pas une intensité.')); corps.push(z); }
  const ids = Object.keys(D.DR);
  corps.push(h('div', { class: 'fe-s' }, h('h3', {}, 'Faits sourcés'), ...ids.map((id) => h('div', { class: 'fe-l' }, h('span', {}, D.DR[id].t, ' '), srcB(D.DR[id].s[0], D.DR[id].d || D.DR[id].t)))));
  corps.push(h('p', { class: 'src' }, 'Profils : ' + D.sourceSim + '. ' + (D.modele || '')));
  ouvrirFeuille('Détail : ' + (ST.hops.join(' + ')), corps);
}
function rendreReglages() {
  document.querySelectorAll('[data-reglage="moment"]').forEach((b) => { b.setAttribute('aria-pressed', String(b.dataset.valeur === ST.moment)); b.disabled = ST.hops.length === 2 && !DH(b.dataset.valeur); });
  if (!levOk(ST.lev)) ST.lev = 'US-05';
  const non = [];
  document.querySelectorAll('[data-reglage="levure"]').forEach((b) => { const ok = levOk(b.dataset.valeur); b.disabled = !ok; if (!ok) non.push(b.dataset.valeur); b.setAttribute('aria-pressed', String(b.dataset.valeur === ST.lev)); b.setAttribute('aria-label', b.dataset.valeur + (ok ? '' : ' : non simulé pour cet ajout')); });
  const z = document.getElementById('lev-non'); z.textContent = non.length ? non.join(', ') + ' : non simulé' + (non.length > 1 ? 's' : '') + ' pour cet ajout (le moteur ne les a pas calculés ; ni zéro, ni moyenne).' : '';
}
function rendre() { rendreReglages(); rendreHops(); rendreScene(); rendrePlans(); rendreVraies(); rendrePourquoi(); }
document.getElementById('cumul').addEventListener('click', () => { if (ST.hops.length === 2) ST.hops = [ST.hops[0]]; else { ST.hops.push(ST.hops[0] === 'Cascade' ? 'Citra' : 'Cascade'); if (!DH(ST.moment)) ST.moment = 'dryPost'; } rendre(); });
document.querySelectorAll('[data-reglage="moment"]').forEach((b) => b.addEventListener('click', () => { ST.moment = b.dataset.valeur; rendre(); }));
document.querySelectorAll('[data-reglage="levure"]').forEach((b) => b.addEventListener('click', () => { ST.lev = b.dataset.valeur; rendre(); }));
document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => setTimeout(rendre, 0)));
rendre();
if (/[?&]detail\\b/.test(location.search)) detail();
`;

ecrire(OUT + '/etat.html', page({
  titre: 'Le verre · r1',
  description: 'Lot 21 · r1 « Le verre » : chaque famille flotte dans un verre à la hauteur de son niveau au style (le bord = la limite de la 16D) et à la taille de sa force ; ce qui déborde sort du style. On compose l’ajout (un houblon ou deux ensemble, dose en plans sage / franc / osé / saturé, moment, levure et biotransformation) ; les vraies valeurs suivent, avec leur source au toucher. Générée par generateur-r1.mjs (socle-r.mjs).',
  css: CSS + CSS_R1, corps: corps(), js: JS, donneesJS: DONNEES,
}));
