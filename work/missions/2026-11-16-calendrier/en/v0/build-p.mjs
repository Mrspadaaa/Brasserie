// node en/build-p.mjs : six en-têtes (p1 à p6) posés sur paliers/g-d1.html, le reste de la page inchangé.
// Données : en/p-serie.json (caisse de l'année relevée dans le proto sources2 vivant, même source que g-d1).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = fs.readFileSync(path.join(HERE, '..', 'paliers', 'g-d1.html'), 'utf8');
const S = JSON.parse(fs.readFileSync(path.join(HERE, 'p-serie.json'), 'utf8'));

// --- découpe de la base : on remplace seulement la tête (lhead + mini), rien d'autre
const A = '<div class="lhead" id="lhead">', B = '\n<div class="ctl">';
const ia = BASE.indexOf(A), ib = BASE.indexOf(B);
if (ia < 0 || ib < ia || BASE.split(A).length !== 2 || BASE.split(B).length !== 2) throw new Error('découpe de la base');
const AVANT = BASE.slice(0, ia), APRES = BASE.slice(ib);

// --- données
const N = 53, PB = S.pb; // PB : {r:31, s:'S24', v:113}
const C = [], L = [], D = [], V = [];
for (const w of S.w) { C[w.r] = w.C; L[w.r] = w.L; D[w.r] = w.D; V[w.r] = w.v; }
const EXTRA = [{ r: 3, c: 'Auberge du Lac', m: 260, t: 'vente' }, { r: 4, c: 'Houblons Suisse', m: -312, t: 'charge' }, { r: 6, c: 'Brouwland', m: -94, t: 'charge' }];
const EV = [];
for (const w of S.w) for (const e of w.ev) if (e.t !== 'hyp') EV.push({ r: w.r, c: e.c, m: e.m, t: e.t === 'taxe' ? 'charge' : e.t });
for (const e of EXTRA) EV.push(e);
const ev = (c) => { const e = EV.find(x => x.c === c); if (!e) throw new Error('chose ' + c); return e; };
const sem = (r) => S.w.find(w => w.r === r);
// contrôle d'honnêteté : chaque semaine, la somme des choses + 120 = le mouvement de la semaine
for (const w of S.w) { const t = EV.filter(e => e.r === w.r).reduce((a, e) => a + e.m, 0) + (w.r > 1 ? 120 : 0); if (Math.abs(t - w.v) > 1) throw new Error('mouvement ' + w.s + ' ' + t + ' ≠ ' + w.v); }

const fmt = (n) => String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const sg = (n) => (n >= 0 ? '+' : '−') + fmt(n);
const col = (t) => `var(--e-${t})`;
const ICO = { evenement: 'fete', vente: 'vente', achat: 'k17cart', renovation: 'outil', brassage: 'beer', charge: 'k18fac' };
const ico = (n, cl = '') => `<svg class="ico ${cl}"><use href="#i-${n}"></use></svg>`;
const sico = (n, x, y, s, c) => `<use href="#i-${n}" x="${x}" y="${y}" width="${s}" height="${s}" style="color:${c}" class="en-si"></use>`;
const W0 = Date.UTC(2026, 10, 9), MO = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MOIS = []; { let p = -1; for (let r = 0; r < N; r++) { const k = new Date(W0 + (r * 7 + 3) * 864e5).getUTCMonth(); if (k !== p) { MOIS.push({ r, k }); p = k; } } }

// --- géométrie d'un graphe : W de large, plot de yT à yB, valeur 0 en yB
function G(W, yT, yB, vmax) {
  const X = (r) => 4 + (W - 8) * r / N, Y = (v) => yB - (yB - yT) * Math.max(0, v) / vmax;
  const step = (A, r0 = 1) => { let d = `M${X(r0).toFixed(1)} ${Y(A[r0]).toFixed(1)}`; for (let r = r0; r < N; r++) { d += `H${X(r + 1).toFixed(1)}`; if (r + 1 < N) d += `V${Y(A[r + 1]).toFixed(1)}`; } return d; };
  const back = (A) => { let d = ''; for (let r = N - 1; r >= 1; r--) { d += `H${X(r).toFixed(1)}`; if (r > 1) d += `V${Y(A[r - 1]).toFixed(1)}`; } return d; };
  return { W, yT, yB, vmax, X, Y, pw: (W - 8) / N, step, back,
    aire: () => `<path d="${step(L)}V${yB}H${X(1).toFixed(1)}Z" fill="var(--area)"/>`,
    hach: (op = .55) => `<path d="${step(C)}V${Y(L[N - 1]).toFixed(1)}${back(L)}Z" fill="url(#en-mch)" opacity="${op}"/>`,
    ligneL: (w = 2.5) => `<path d="${step(L)}" fill="none" stroke="var(--fin)" stroke-width="${w}"/>`,
    ligneC: (w = 1.5, c = 'var(--mut)') => `<path d="${step(C)}" fill="none" stroke="${c}" stroke-width="${w}"/>`,
    passe: () => `<rect x="4" y="${yT}" width="${(X(1) - 4).toFixed(1)}" height="${yB - yT}" fill="var(--s2)"/>`,
    zero: () => `<line x1="4" x2="${W - 4}" y1="${yB}" y2="${yB}" stroke="var(--line2)" stroke-width="1"/>`,
    fen: (y0 = yT - 2, y1 = yB + 2) => `<rect class="en-fen" x="${X(1).toFixed(1)}" y="${y0}" width="${(X(7) - X(1)).toFixed(1)}" height="${y1 - y0}" rx="7"/><rect class="en-ph" x="${(X(1) - 3).toFixed(1)}" y="${((y0 + y1) / 2 - 11).toFixed(1)}" width="6" height="22" rx="3"/><rect class="en-ph" x="${(X(7) - 3).toFixed(1)}" y="${((y0 + y1) / 2 - 11).toFixed(1)}" width="6" height="22" rx="3"/>`,
    creux: (r = 5) => `<circle cx="${(X(PB.r) + 3.4).toFixed(1)}" cy="${Y(PB.v).toFixed(1)}" r="${r}" fill="var(--fin)" stroke="var(--halo)" stroke-width="2"/>`,
    mois: (y, liste = ['déc.', 'mars', 'juin', 'sept.']) => MOIS.filter(m => liste.includes(MO[m.k])).map(m => `<line x1="${X(m.r).toFixed(1)}" x2="${X(m.r).toFixed(1)}" y1="${y - 13}" y2="${y + 2}" stroke="var(--line2)" stroke-width="1.5"/><text class="en-mo" x="${(X(m.r) + 3).toFixed(1)}" y="${y}">${MO[m.k]}</text>`).join(''),
  };
}
const DEFS = `<defs><pattern id="en-mch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="2.4" height="6" fill="var(--fin)"/></pattern></defs>`;
const svg = (W, H, body, cl = '') => `<svg class="en-g ${cl}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${DEFS}${body}</svg>`;
const T = (x, y, s, cl = '', a = 'middle', st = '') => `<text class="en-t ${cl}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${a}"${st ? ` style="${st}"` : ''}>${s}</text>`;
// largeur estimée d'un texte de 14 px (contrôlée ensuite au rendu par cap.mjs)
const larg = (s, gras = true) => [...s].reduce((a, ch) => a + (/[0-9]/.test(ch) ? 7.1 : ch === ' ' ? 2.6 : ch === ' ' ? 3.2 : /[+−]/.test(ch) ? 7.6 : /[ilj.,’]/.test(ch) ? 3.4 : /[mwMW]/.test(ch) ? 11 : 6.7), 0) * (gras ? 1.04 : 1);

// pastilles réduites, communes
const P = {
  ret: (mots = true) => `<button type="button" class="en-ret" data-k15-maint="" aria-label="2 en retard : ouvrir la liste">${ico('k15ret')}${mots ? '2 en retard' : '2'}</button>`,
  per: (cl = '') => `<button type="button" class="en-per ${cl}" data-pg-periode="6" aria-label="Période : 6 semaines (3 mois, 6 mois, An à un toucher)">6 sem.${ico('bas')}</button>`,
  plein: () => `<button type="button" class="en-plein" data-plein="" aria-label="Plein écran">${ico('plein')}</button>`,
  cle: (cl = '') => `<button type="button" class="en-cle ${cl}" data-plus="" aria-label="113 CHF à dépenser sans passer sous 0 ; au plus serré S24, 14 juin : déplier"><b>${fmt(PB.v)}</b><small>CHF</small></button>`,
};
const CSS0 = `
.en-h{position:relative;padding:4px 12px 0}
.en-g{display:block;overflow:visible}
.en-g text{font-family:inherit}
.en-t{font-size:14px;font-weight:700;paint-order:stroke;stroke:var(--halo);stroke-width:4px;stroke-linejoin:round;font-variant-numeric:tabular-nums}
.en-t.up{fill:var(--ok)}.en-t.dn{fill:var(--bad)}.en-t.nm{font-weight:600;fill:var(--ink)}.en-t.mu{font-weight:400;fill:var(--mut)}.en-t.fi{fill:var(--fin)}
.en-mo{font-size:14px;fill:var(--mut);paint-order:stroke;stroke:var(--halo);stroke-width:3px}
.en-fen{fill:color-mix(in srgb,var(--fin) 7%,transparent);stroke:var(--fin);stroke-width:2}
.en-ph{fill:var(--fin)}
.en-si{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.en-ret{height:26px;display:inline-flex;align-items:center;gap:3px;padding:0 2px;color:var(--bad);font-size:14px;font-weight:700;white-space:nowrap}
.en-ret .ico{width:16px;height:16px}
.en-per{height:26px;display:inline-flex;align-items:center;gap:1px;padding:0 3px 0 9px;border:1.5px solid var(--line2);border-radius:13px;font-size:14px;font-weight:700;white-space:nowrap;background:var(--bg)}
.en-per .ico{width:16px;height:16px}
.en-plein{width:28px;height:28px;display:grid;place-items:center;color:var(--ink)}
.en-plein .ico{width:18px;height:18px}
.en-cle{display:inline-flex;align-items:baseline;gap:3px;padding:0;color:var(--fin);white-space:nowrap}
.en-cle b{font-size:26px;font-weight:800;letter-spacing:-.5px;line-height:28px;font-variant-numeric:tabular-nums}
.en-cle small{font-size:14px;font-weight:600;color:var(--mut)}
.en-s24{display:inline-flex;align-items:center;font-size:14px;font-weight:700;color:var(--fin);white-space:nowrap}
.en-s24 .ico{width:16px;height:16px}
.en-mut{font-size:14px;color:var(--mut);white-space:nowrap}
`;

// placement glouton d'étiquettes (une rangée par niveau) : rend celles qui tiennent
function place(liste, W, gap = 4, H = 999) {
  const pris = []; const out = [];
  for (const l of liste) {
    for (const v of l.choix) { // v : {s, w, x, y, a}
      const x0 = v.a === 'middle' ? v.x - v.w / 2 : v.a === 'end' ? v.x - v.w : v.x, x1 = x0 + v.w, y0 = v.y - 12, y1 = v.y + 3;
      if (x0 < 0 || x1 > W || y0 < 0 || y1 > H) continue;
      if (pris.some(p => x0 < p[2] + gap && x1 > p[0] - gap && y0 < p[3] + 1 && y1 > p[1] - 1)) continue;
      if (l.evite && l.evite.some(p => x0 < p[2] && x1 > p[0] && y0 < p[3] && y1 > p[1])) continue;
      pris.push([x0, y0, x1, y1]); out.push({ ...l, v }); break;
    }
  }
  return { out, pris };
}

// ===================================================================== aides de placement
const COURT = { 'Marché de Noël': 'Noël', 'Marché printemps': 'Printemps', 'Fête de village': 'Fête', '6 fûts inox': 'Fûts', 'Malt groupé': 'Malt', 'Café du Pont': 'Café' };
const court = (c) => COURT[c] || c;
const GRANDS = EV.filter(e => Math.abs(e.m) >= 900 && e.c !== 'Loyer').sort((a, z) => Math.abs(z.m) - Math.abs(a.m));
const haut = (g, r) => Math.min(g.Y(C[r]), g.Y(C[r - 1])), bas = (g, r) => Math.max(g.Y(C[r]), g.Y(C[r - 1]));
function lignes(g, ep = 2.5, A2 = [C, L]) { const o = []; for (const A of A2) for (let r = 1; r < N; r++) { const y = g.Y(A[r]); o.push([g.X(r), y - ep, g.X(r + 1), y + ep]); if (r > 1) { const y0 = g.Y(A[r - 1]); o.push([g.X(r) - ep, Math.min(y, y0), g.X(r) + ep, Math.max(y, y0)]); } } return o; }
const txt = (o) => o.v.nm ? `<text class="en-t ${o.cl}" x="${o.v.x.toFixed(1)}" y="${o.v.y.toFixed(1)}" text-anchor="${o.v.a}">${o.v.m}<tspan class="nm" dx="4">${o.v.nm}</tspan></text>` : T(o.v.x, o.v.y, o.v.s, o.cl, o.v.a);
const opt = (m, nm, x, y, a) => ({ s: nm ? m + ' ' + nm : m, m, nm, w: larg(m) + (nm ? 4 + larg(nm, false) : 0), x, y, a });
const pointille = (x, y1, y2, c) => `<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${y1.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--${c})" stroke-width="1.2" stroke-dasharray="1.5 2.5"/>`;

// ===================================================================== p1 « Marches »
// La courbe de caisse porte ses mouvements : chaque marche de 500 ou plus est un trait épais vert (entre) ou rouge (sort) ;
// montant et nom court rangés sur une ligne au-dessus (entrées) ou au-dessous (sorties), reliés par un pointillé.
function p1() {
  const W = 366, H = 108, g = G(W, 20, 76, 7600);
  let b = g.passe() + g.zero() + g.aire() + g.hach(.4) + g.ligneL(2) + g.ligneC(2, 'var(--ink)');
  for (let r = 2; r < N; r++) { const d = C[r] - C[r - 1]; if (Math.abs(d) < 500) continue;
    b += `<line x1="${g.X(r).toFixed(1)}" x2="${g.X(r).toFixed(1)}" y1="${haut(g, r).toFixed(1)}" y2="${bas(g, r).toFixed(1)}" stroke="var(--${d > 0 ? 'ok' : 'bad'})" stroke-width="4" stroke-linecap="round"/>`; }
  const lab = EV.filter(e => Math.abs(e.m) >= 500 && e.c !== 'Loyer').sort((a, z) => Math.abs(z.m) - Math.abs(a.m)).map(e => { const x = g.X(e.r), up = e.m > 0, y = up ? 13 : 91, m = sg(e.m), nm = court(e.c);
    return { e, up, cl: up ? 'up' : 'dn', choix: [opt(m, nm, x - 3, y, 'start'), opt(m, nm, x + 3, y, 'end'), opt(m, '', x, y, 'middle'), opt(m, '', x - 3, y, 'start'), opt(m, '', x + 3, y, 'end')] }; });
  const out = place(lab, W, 6, H).out;
  for (const o of out) { const x = g.X(o.e.r);
    b += o.up ? pointille(x, 17, haut(g, o.e.r) - 3, 'ok') : pointille(x, bas(g, o.e.r) + 3, 79, 'bad');
    b += txt(o); }
  b += g.creux() + g.fen(18, 78) + g.mois(H - 2);
  const html = `<header class="en-h e1"><div class="e1-l">${P.cle()}<span class="en-mut">à dépenser</span><span class="en-s24">S24${ico('bas')}</span><span class="e1-r">${P.ret(false)}${P.per()}${P.plein()}</span></div>${svg(W, H, b)}</header>`;
  const css = `.e1-l{display:flex;align-items:center;gap:6px;height:28px}.e1-r{margin-left:auto;display:flex;align-items:center;gap:6px}
.e1 .en-ret{border:1.5px solid var(--bad);background:var(--badbg);border-radius:13px;padding:0 8px 0 6px}`;
  return { html, css, idee: 'Marches : la courbe de caisse porte ses mouvements. Chaque marche de 500 ou plus est un trait épais, vert si l’argent entre, rouge s’il sort ; montant et nom court sont rangés sur une ligne au-dessus (entrées) ou au-dessous (sorties), reliés par un pointillé. Une ligne de tête mince : 113 à dépenser, S24, retards, période, plein écran.' };
}

// ===================================================================== p2 « Volume »
// Comme un cours de bourse : la courbe en haut, le mouvement net de chaque semaine en barres dessous ; chiffre clé en pied.
function p2() {
  const W = 366, H1 = 74, g = G(W, 18, 72, 7600);
  let b = g.passe() + g.aire() + g.hach(.4) + g.ligneL(2) + g.ligneC(1.5) + g.creux(4.5) + g.fen(17, 74);
  b += MOIS.filter(m => ['déc.', 'mars', 'juin', 'sept.'].includes(MO[m.k])).map(m => `<line x1="${g.X(m.r).toFixed(1)}" x2="${g.X(m.r).toFixed(1)}" y1="2" y2="16" stroke="var(--line2)" stroke-width="1.5"/><text class="en-mo" x="${(g.X(m.r) + 3).toFixed(1)}" y="13">${MO[m.k]}</text>`).join('');
  const H2 = 36, mid = 18, k = 9 / 3080;
  let s = `<rect x="4" y="0" width="${(g.X(1) - 4).toFixed(1)}" height="${H2}" fill="var(--s2)"/><line x1="4" x2="${W - 4}" y1="${mid}" y2="${mid}" stroke="var(--line2)" stroke-width="1"/>`;
  const bars = [];
  for (let r = 1; r < N; r++) { const v = V[r], h = Math.max(1.5, Math.abs(v) * k), x = g.X(r) + .8, w = g.pw - 1.6;
    if (Math.abs(v) >= 800) bars.push([x - 1, v > 0 ? mid - h - 1 : mid, x + w + 1, v > 0 ? mid : mid + h + 1]);
    s += `<rect x="${x.toFixed(1)}" y="${(v > 0 ? mid - h : mid).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="1" fill="var(--${v > 0 ? 'ok' : 'bad'})" opacity="${Math.abs(v) >= 500 ? 1 : .4}"/>`; }
  const lab = [];
  for (let r = 1; r < N; r++) { const v = V[r]; if (Math.abs(v) < 800) continue; const x = g.X(r) + g.pw / 2, h = Math.abs(v) * k, m = sg(v), up = v > 0;
    const yA = up ? mid - 4 : mid + 13, yB = up ? mid - h - 3 : mid + h + 13;
    lab.push({ prio: Math.abs(v), cl: up ? 'up' : 'dn', choix: [opt(m, '', x + 5, yA, 'start'), opt(m, '', x - 5, yA, 'end'), ...(yB - 12 >= 0 && yB + 2 <= H2 ? [opt(m, '', x, yB, 'middle')] : [])] }); }
  lab.sort((a, z) => z.prio - a.prio); for (const l of lab) l.evite = bars;
  for (const o of place(lab, W, 3, H2).out) s += txt(o);
  const html = `<header class="en-h e2">${svg(W, H1, b)}${svg(W, H2, s, 'e2-v')}<div class="e2-p">${P.cle()}<span class="en-mut">à dépenser</span><span class="en-s24">S24${ico('bas')}</span><span class="e2-r">${P.ret(false)}${P.per()}${P.plein()}</span></div></header>`;
  const css = `.e2{padding-top:2px}.e2-p{display:flex;align-items:center;gap:5px;height:28px;border-top:1px solid var(--line)}.e2-r{margin-left:auto;display:flex;align-items:center;gap:6px}
.e2 .en-cle b{font-size:24px}.e2 .en-ret{border:1.5px solid var(--bad);background:var(--badbg);border-radius:13px;padding:0 8px 0 6px}`;
  return { html, css, idee: 'Volume : comme un cours de bourse. La courbe en haut, et dessous le mouvement net de chaque semaine en barres (vert : il entre, rouge : il sort), sur les mêmes semaines ; les grands ont leur montant. Le chiffre clé descend en pied, contre la frise.' };
}

// ===================================================================== p3 « Rubans »
// Grandes entrées en étiquettes vertes sur un ruban au-dessus, grandes sorties en rouges dessous, épinglées à leur semaine.
function p3() {
  const W = 366, hR = 20, yR1 = 0, yR2 = 77, H = 111, g = G(W, 22, 75, 7600);
  let b = g.passe() + g.aire() + g.hach(.4) + g.ligneL(2) + g.ligneC(2, 'var(--ink)');
  // empaquetage : chaque étiquette contient sa semaine ; on garde les plus grands mouvements qui tiennent
  const pack = (L, gap = 4) => { const s = L.slice().sort((a, z) => a.x - z.x); let fin = -gap; for (const c of s) { const lo = c.x - c.w + 9, hi = c.x - 9; let x0 = Math.max(fin + gap, Math.min(hi, Math.round(c.x - c.w / 2))); x0 = Math.max(x0, lo); if (x0 > hi || x0 + c.w > W) return null; c.x0 = x0; fin = x0 + c.w; } return s; };
  const ruban = (liste) => { let pris = [];
    for (const e of liste) { const m = sg(e.m), c = { e, up: e.m > 0, x: g.X(e.r), m, nm: '', w: 20 + larg(m) + 7 }; const essai = pack([...pris, c]); if (essai) pris = essai; }
    for (const c of pris.slice().sort((a, z) => Math.abs(z.e.m) - Math.abs(a.e.m))) { const nm = court(c.e.c), w0 = c.w; c.w = w0 + 4 + larg(nm, false); c.nm = nm; const ok = pack(pris.map(x => x)); if (!ok) { c.w = w0; c.nm = ''; pack(pris); } }
    pack(pris); return pris; };
  const RE = ruban(GRANDS.filter(e => e.m > 0 && e.r > 6)), RS = ruban(GRANDS.filter(e => e.m < 0 && e.r > 6));
  let fils = '', ch = '';
  for (const c of [...RE, ...RS]) { const y = c.up ? yR1 : yR2, yc = c.up ? haut(g, c.e.r) : bas(g, c.e.r), k = c.up ? 'ok' : 'bad';
    fils += `<line x1="${c.x.toFixed(1)}" x2="${c.x.toFixed(1)}" y1="${c.up ? hR : yR2}" y2="${yc.toFixed(1)}" stroke="var(--${k})" stroke-width="1.5" stroke-dasharray="2 2"/><circle cx="${c.x.toFixed(1)}" cy="${yc.toFixed(1)}" r="3.2" fill="var(--${k})" stroke="var(--halo)" stroke-width="1.5"/>`;
    ch += `<g class="e3-c ${c.up ? 'up' : 'dn'}"><rect x="${c.x0}" y="${y + .75}" width="${c.w.toFixed(1)}" height="${hR - 1.5}" rx="${hR / 2 - 1}"/>${sico(ICO[c.e.t], c.x0 + 4, y + 3, 14, col(c.e.t))}<text class="en-t ${c.up ? 'up' : 'dn'}" x="${(c.x0 + 20).toFixed(1)}" y="${y + 15}">${c.m}${c.nm ? `<tspan class="nm" dx="4">${c.nm}</tspan>` : ''}</text></g>`; }
  b += fils + g.creux(4.5) + g.fen(20, 77) + g.mois(H - 2) + ch;
  const html = `<header class="en-h e3"><div class="e3-l">${P.cle()}<span class="en-mut">à dépenser</span><span class="en-s24">S24${ico('bas')}</span><span class="e3-r">${P.ret(false)}${P.per()}${P.plein()}</span></div>${svg(W, H, b)}</header>`;
  const css = `.e3{padding-top:3px}.e3-l{display:flex;align-items:center;gap:5px;height:24px;margin-bottom:0}.e3-r{margin-left:auto;display:flex;align-items:center;gap:6px}.e3 .en-cle b{font-size:22px;line-height:24px}.e3 .en-ret{border:1.5px solid var(--bad);background:var(--badbg);border-radius:13px;padding:0 8px 0 6px;height:24px}.e3 .en-per{height:24px}.e3 .en-plein{width:26px;height:26px}
.e3-c rect{stroke-width:1.5}.e3-c.up rect{fill:var(--okbg);stroke:color-mix(in srgb,var(--ok) 45%,var(--bg))}.e3-c.dn rect{fill:var(--badbg);stroke:color-mix(in srgb,var(--bad) 40%,var(--bg))}.e3-c .en-t{stroke:none}`;
  return { html, css, idee: 'Rubans : les grandes entrées en étiquettes vertes sur un ruban au-dessus de la courbe, les grandes sorties en rouges sur un ruban dessous, chacune épinglée à sa semaine par un fil, avec le picto de sa rangée de la frise et son nom court s’il tient. Les 6 semaines affichées sont déjà dans la frise : les rubans montrent ce qui vient après. Une ligne de tête mince au-dessus.' };
}

// ===================================================================== p4 « Mis de côté »
// Le creux expliqué : l'argent mis de côté s'empile par achat entre la caisse et ce qui reste à dépenser.
function p4() {
  const W = 366, H = 112, g = G(W, 6, 94, 7600);
  const AC = [
    { c: 'Embouteilleuse', a: 17, b: 29, m: 2800, f: 'color-mix(in srgb,var(--e-achat) 72%,var(--bg))' }, { c: 'Frigo', a: 13, b: 42, m: 1800, f: 'color-mix(in srgb,var(--e-vente) 45%,var(--bg))' },
    { c: '6 fûts inox', a: 19, b: 25, m: 1080, f: 'color-mix(in srgb,var(--e-achat) 30%,var(--bg))' }, { c: 'Hotte', a: 16, b: 20, m: 900, f: 'color-mix(in srgb,var(--e-renovation) 45%,var(--bg))' },
    { c: 'Sols', a: 27, b: 47, m: 600, f: 'color-mix(in srgb,var(--e-renovation) 25%,var(--bg))' }, { c: 'Pompe', a: 27, b: 31, m: 380, f: 'color-mix(in srgb,var(--e-achat) 20%,var(--bg))' },
    { c: 'Malt groupé', a: 6, b: 8, m: 540, f: 'color-mix(in srgb,var(--e-achat) 20%,var(--bg))' }, { c: 'Houblons', a: 44, b: 45, m: 480, f: 'color-mix(in srgb,var(--e-achat) 20%,var(--bg))' },
    { c: 'Éclairage', a: 50, b: 52, m: 320, f: 'color-mix(in srgb,var(--e-renovation) 25%,var(--bg))' }];
  const part = (k, r) => (k.a <= r && r < k.b) ? k.m * (r - k.a + 1) / (k.b - k.a + 1) : 0;
  for (let r = 1; r < N; r++) { const t = AC.reduce((s, k) => s + part(k, r), 0); if (Math.abs(t - D[r]) > 1) throw new Error('de côté ' + r + ' ' + t + ' ≠ ' + D[r]); }
  let b = g.passe() + g.zero() + g.aire();
  const base = L.slice();
  for (const k of AC) {
    let top = '', bot = '';
    for (let r = 1; r < N; r++) top += `${r === 1 ? 'M' : 'L'}${g.X(r).toFixed(1)} ${g.Y(base[r] + part(k, r)).toFixed(1)}H${g.X(r + 1).toFixed(1)}`;
    for (let r = N - 1; r >= 1; r--) bot += `L${g.X(r + 1).toFixed(1)} ${g.Y(base[r]).toFixed(1)}H${g.X(r).toFixed(1)}`;
    b += `<path d="${top}${bot}Z" fill="${k.f}" stroke="var(--bg)" stroke-width=".6"/>`;
    k.base = base.slice(); for (let r = 1; r < N; r++) base[r] += part(k, r);
  }
  b += g.ligneL(2.5) + g.ligneC(2, 'var(--ink)');
  const pris = [];
  const nomB = (c, r, t0) => { const k = AC.find(x => x.c === c); const ym = (g.Y(k.base[r]) + g.Y(k.base[r] + part(k, r))) / 2; const x = g.X(r + 1) - 2, w = larg(t0); pris.push([x - w, ym - 8, x, ym + 8]); return `<text class="en-t nm" x="${x.toFixed(1)}" y="${(ym + 5).toFixed(1)}" text-anchor="end">${t0}</text>`; };
  b += nomB('Embouteilleuse', 28, 'Embouteilleuse') + nomB('Frigo', 34, 'Frigo') + nomB('Hotte', 19, 'Hotte');
  const ob = [...lignes(g), ...pris, [g.X(PB.r) - 4, 0, g.X(PB.r) + 10, H], [g.X(1) - 6, 0, g.X(1) + 6, H], [g.X(7) - 6, 0, g.X(7) + 6, H]];
  const lab = GRANDS.filter(e => e.m > 0).map(e => { const x = g.X(e.r), yt = haut(g, e.r), m = sg(e.m), nm = court(e.c);
    return { e, cl: 'up', evite: ob, choix: [opt(m, nm, x - 2, yt - 8, 'start'), opt(m, nm, x + 2, yt - 8, 'end'), opt(m, '', x, yt - 8, 'middle'), opt(m, nm, x - 2, yt - 20, 'start'), opt(m, nm, x + 2, yt - 20, 'end'), opt(m, nm, x + 5, yt + 13, 'start'), opt(m, nm, x - 5, yt + 13, 'end'), opt(m, '', x + 5, yt + 13, 'start'), opt(m, '', x - 5, yt + 13, 'end')] }; });
  for (const o of place(lab, W, 4, H - 16).out) b += txt(o);
  const xc = g.X(PB.r) + 3.4;
  b += `<line x1="${xc.toFixed(1)}" x2="${xc.toFixed(1)}" y1="0" y2="${(g.Y(PB.v) - 6).toFixed(1)}" stroke="var(--fin)" stroke-width="1.5" stroke-dasharray="2 2"/>` + g.creux(5) + g.fen(4, 96) + g.mois(H - 2);
  const html = `<header class="en-h e4"><div class="e4-t">${P.ret(false)}${P.per()}<span class="e4-cle" style="left:${(xc + 12 - 76).toFixed(0)}px">${P.cle()}<span class="en-mut">à dépenser · S24</span></span>${P.plein()}</div>${svg(W, H, b)}</header>`;
  const css = `.e4{padding-top:0}.e4-t{position:relative;height:28px;display:flex;align-items:center;gap:8px}.e4-t .en-plein{margin-left:auto}
.e4 .en-ret{border:1.5px solid var(--bad);background:var(--badbg);border-radius:13px;padding:0 8px 0 6px}.e4-cle{position:absolute;top:0;height:28px;display:flex;align-items:center;gap:4px}.e4-cle .en-cle b{font-size:24px}`;
  return { html, css, idee: 'Mis de côté : le creux expliqué. Entre la caisse (trait noir) et ce qui reste à dépenser (trait bleu), l’argent mis de côté s’empile par achat, une teinte par achat, nommé dans sa bande (Embouteilleuse, Frigo) : le bleu descend pendant qu’on met de côté, la caisse tombe quand l’achat est payé. Le 113 se pose au-dessus du creux, relié à lui. Les entrées ont leur montant et leur nom court.' };
}

// ===================================================================== p5 « Pictos »
// Colonne du chiffre clé à gauche ; la courbe porte les pictos de la frise à la semaine où l'argent bouge.
function p5() {
  const W = 278, H = 132, g = G(W, 14, 100, 7600);
  let b = g.passe() + g.zero() + g.aire() + g.hach(.4) + g.ligneL(2) + g.ligneC(2, 'var(--ink)');
  const ob = [...lignes(g, 2), [W - 32, 0, W, 30]]; const pris = []; let ics = '';
  const sel = GRANDS;
  const labs = [];
  for (const e of sel) { const s = Math.abs(e.m) >= 1500 ? 20 : 16, x = g.X(e.r), up = e.m > 0, yh = haut(g, e.r), yb = bas(g, e.r);
    const ym = (yh + yb) / 2, pos = [[x, ym], [x, (up ? yh : yb) + (up ? -1 : 1) * (s / 2 + 3)], [x, (up ? yb : yh) + (up ? 1 : -1) * (s / 2 + 3)], [x, ym - s - 4], [x, ym + s + 4]];
    for (const [cx, cy] of pos) { const R = [cx - s / 2 - 2, cy - s / 2 - 2, cx + s / 2 + 2, cy + s / 2 + 2];
      if (R[0] < 0 || R[2] > W || R[1] < 0 || R[3] > g.yB + 14) continue; if (pris.some(p => R[0] < p[2] && R[2] > p[0] && R[1] < p[3] && R[3] > p[1])) continue;
      pris.push(R);
      ics += (Math.abs(cy - ym) > 1 ? `<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${(cy > ym ? Math.min(cy, yb) : Math.max(cy, yh)).toFixed(1)}" y2="${ym.toFixed(1)}" stroke="${col(e.t)}" stroke-width="1.5"/>` : '') + `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(s / 2 + 1).toFixed(1)}" fill="var(--bg)" stroke="${col(e.t)}" stroke-width="1.8"/>` + sico(ICO[e.t], cx - s * .32, cy - s * .32, s * .64, col(e.t));
      const m = sg(e.m); labs.push({ prio: Math.abs(e.m), cl: up ? 'up' : 'dn', choix: [opt(m, '', cx + s / 2 + 4, cy + 5, 'start'), opt(m, '', cx - s / 2 - 4, cy + 5, 'end'), opt(m, '', cx, cy - s / 2 - 5, 'middle'), opt(m, '', cx, cy + s / 2 + 14, 'middle'), opt(m, '', cx + s / 2 + 4, cy - 4, 'start'), opt(m, '', cx - s / 2 - 4, cy - 4, 'end'), opt(m, '', cx + s / 2 + 4, cy + 13, 'start'), opt(m, '', cx - s / 2 - 4, cy + 13, 'end'), opt(m, '', cx + s / 2 + 4, cy + 22, 'start'), opt(m, '', cx - s / 2 - 4, cy + 22, 'end'), opt(m, '', cx + s / 2 + 4, cy - 13, 'start'), opt(m, '', cx - s / 2 - 4, cy - 13, 'end')] });
      break; }
  }
  labs.sort((a, z) => z.prio - a.prio); for (const l of labs) l.evite = [...ob, ...pris];
  const t = place(labs, W, 3, H - 16).out.map(txt).join('');
  b += g.creux(4.5) + g.fen(12, 102) + ics + t + g.mois(H - 2, ['déc.', 'mars', 'juin', 'sept.']);
  const html = `<header class="en-h e5"><div class="e5-c">${P.cle()}<span class="en-mut">à dépenser</span><span class="en-s24">S24${ico('bas')}</span><button type="button" class="e5-ret" data-k15-maint="" aria-label="2 en retard : ouvrir la liste">${ico('k15ret')}<b>2</b><span>en retard</span></button>${P.per()}</div><div class="e5-g">${svg(W, H, b)}<span class="e5-p">${P.plein()}</span></div></header>`;
  const css = `.e5{display:flex;gap:2px;padding:4px 10px 0 12px}.e5-c{flex:none;width:78px;display:flex;flex-direction:column;align-items:flex-start;gap:2px}
.e5-c .en-cle b{font-size:26px;line-height:28px}.e5-g{position:relative}.e5-p{position:absolute;right:0;top:0}
.e5-ret{display:flex;flex-wrap:wrap;align-items:center;gap:0 3px;width:78px;color:var(--bad);font-size:14px;line-height:17px;padding:0;text-align:left}
.e5-ret .ico{width:16px;height:16px}.e5-ret b{font-size:15px}.e5-ret span{flex-basis:100%;font-weight:600}`;
  return { html, css, idee: 'Pictos : une colonne à gauche porte le chiffre clé (113, à dépenser, S24, retards, période) ; à droite, la courbe porte les pictos des rangées de la frise (fête, vente, chariot, outil, chope) à la semaine où l’argent bouge, au-dessus si l’argent entre, dessous s’il sort, plus gros quand le montant l’est ; montant écrit pour les grands.' };
}

// ===================================================================== p6 « Épingles »
// Chaque grand mouvement est une étiquette épinglée sur la courbe, à la couleur de sa rangée de la frise.
function p6() {
  const W = 366, H = 114, g = G(W, 26, 96, 7600);
  let b = g.passe() + g.zero() + g.aire() + g.hach(.4) + g.ligneL(2.5) + g.ligneC(1.5);
  const ob = [...lignes(g, 2), [g.X(PB.r) - 8, g.Y(1500), g.X(PB.r) + 14, H], [g.X(1) - 6, 20, g.X(1) + 6, 100], [g.X(7) - 6, 20, g.X(7) + 6, 100]]; const pris = []; let pins = '';
  const sel = EV.filter(e => Math.abs(e.m) >= 500 && e.c !== 'Loyer' && e.r > 6).sort((a, z) => Math.abs(z.m) - Math.abs(a.m));
  for (const e of sel) { const up = e.m > 0, x = g.X(e.r), m = sg(e.m), nm = court(e.c), y0 = up ? haut(g, e.r) : bas(g, e.r);
    let fait = false;
    for (const nmx of [nm, '']) { const w = larg(m) + (nmx ? 4 + larg(nmx, false) : 0) + 12, h = 20;
      const ym = (haut(g, e.r) + bas(g, e.r)) / 2; const pos = []; for (const dy of up ? [-h - 7, -h - 20] : [7, 20]) for (const dx of [-w / 2, -10, -w + 10]) pos.push([x + dx, y0 + dy]); for (const dy of [0, 6, -6, 12, -12]) pos.push([x + 8, ym - h / 2 + dy], [x - w - 8, ym - h / 2 + dy]); if (!up) for (const dx of [-w / 2, -10, -w + 10]) pos.push([x + dx, haut(g, e.r) - h - 7]);
      { for (const [rx, ry] of pos) { const R = [rx, ry, rx + w, ry + h];
        if (R[0] < 0 || R[2] > W || R[1] < 0 || R[3] > H - 16) continue; if ([...ob, ...pris].some(p => R[0] < p[2] + 2 && R[2] > p[0] - 2 && R[1] < p[3] && R[3] > p[1])) continue;
        pris.push(R); fait = true;
        const cote = R[0] > x ? 'd' : R[2] < x ? 'g' : ''; const dessus = !cote && R[3] <= haut(g, e.r); const pt = cote === 'd' ? `M${R[0].toFixed(1)} ${(R[1] + 6).toFixed(1)}L${(x + 2).toFixed(1)} ${ym.toFixed(1)}L${R[0].toFixed(1)} ${(R[1] + 14).toFixed(1)}` : cote === 'g' ? `M${R[2].toFixed(1)} ${(R[1] + 6).toFixed(1)}L${(x - 2).toFixed(1)} ${ym.toFixed(1)}L${R[2].toFixed(1)} ${(R[1] + 14).toFixed(1)}` : (up || dessus) ? `M${(x - 4).toFixed(1)} ${R[3].toFixed(1)}L${x.toFixed(1)} ${(haut(g, e.r) - 2).toFixed(1)}L${(x + 4).toFixed(1)} ${R[3].toFixed(1)}` : `M${(x - 4).toFixed(1)} ${R[1].toFixed(1)}L${x.toFixed(1)} ${(y0 + 2).toFixed(1)}L${(x + 4).toFixed(1)} ${R[1].toFixed(1)}`;
        pins += `<g class="e6-p" style="--c:${col(e.t)}"><path d="${pt}"/><rect x="${R[0].toFixed(1)}" y="${R[1].toFixed(1)}" width="${w.toFixed(1)}" height="${h}" rx="6"/><text class="en-t" x="${(R[0] + 6).toFixed(1)}" y="${(R[1] + 15).toFixed(1)}">${m}${nmx ? `<tspan class="nm" dx="4">${nmx}</tspan>` : ''}</text></g>`;
        break; } if (fait) break; }
      if (fait) break; }
  }
  const xc = g.X(PB.r) + 3.4;
  b += pins + g.creux(5) + g.fen(22, 98) + g.mois(H - 2);
  const html = `<header class="en-h e6"><div class="e6-t"><span class="e6-cle">${P.cle()}<span class="en-mut">à dépenser</span><span class="en-s24">S24${ico('bas')}</span></span><span class="e6-r">${P.ret(false)}${P.per()}${P.plein()}</span></div>${svg(W, H, b)}</header>`;
  const css = `.e6{padding-top:0}.e6-t{position:relative;height:26px;display:flex;align-items:center}.e6-r{margin-left:auto;display:flex;align-items:center;gap:6px}
.e6 .en-ret{border:1.5px solid var(--bad);background:var(--badbg);border-radius:13px;padding:0 8px 0 6px}.e6-cle{height:26px;display:flex;align-items:center;gap:4px}.e6-cle .en-cle b{font-size:22px}
.e6-p rect,.e6-p path{fill:color-mix(in srgb,var(--c) 14%,var(--bg));stroke:var(--c);stroke-width:1.5}
.e6-p .en-t{stroke:none;fill:var(--ink)}.e6-p .en-t .nm{fill:var(--c)}`;
  return { html, css, idee: 'Épingles : chaque grand mouvement est une étiquette épinglée sur la courbe, à sa semaine, à la couleur de sa rangée de la frise (fête, vente, achat, travaux) : au-dessus si l’argent entre, dessous s’il sort, montant et nom court. Le 113 à dépenser se pose au-dessus du creux.' };
}

const V6 = { p1, p2, p3, p4, p5, p6 };
const notes = {};
for (const [k, f] of Object.entries(V6)) {
  const { html, css, idee } = f();
  const page = AVANT.replace(/<title>[^<]*<\/title>/, `<title>${k} · en-tête sur g-d1</title>`).replace('</head>', `<style id="en-${k}">${CSS0}${css}</style></head>`) + html + APRES;
  // contrôle : hors de la tête et de son style, la page est la base, à l'octet près
  const sans = page.replace(/<title>[^<]*<\/title>/, '').replace(/<style id="en-p\d">[\s\S]*?<\/style>/, '').replace(html, '');
  const ref = BASE.replace(/<title>[^<]*<\/title>/, '').replace(BASE.slice(ia, ib), '');
  if (sans !== ref) throw new Error(k + ' : la page diffère de la base hors de la tête');
  fs.writeFileSync(path.join(HERE, k + '.html'), page); notes[k] = idee;
  console.log(k, 'IDENTIQUE hors tête', page.length);
}
fs.writeFileSync(path.join(HERE, 'p-idees.json'), JSON.stringify(notes, null, 1));
