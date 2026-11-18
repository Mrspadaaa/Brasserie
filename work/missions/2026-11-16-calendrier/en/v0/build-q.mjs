// node en/build-q.mjs : six en-têtes q1…q6 posés sur paliers/g-d1.html, le reste inchangé.
// Données : série de c85/sources2/proto.html (serie(), flux() rejoués le 16.11) : caisse C, libre L, mouvements par semaine.
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = fs.readFileSync(path.join(HERE, '..', 'paliers', 'g-d1.html'), 'utf8');

// r = 1 … 52 (S47 … S45) ; index 0 = S46 passée
const C = [null, 4032, 4152, 4132, 5120, 5064, 5730, 5850, 5030, 4770, 4890, 4778, 4498, 5038, 5158, 5278, 5380, 5500, 5620, 5740, 4560, 4304, 4424, 5454, 5574, 4214, 4144, 4644, 4764, 1684, 1804, 1396, 1516, 3376, 3496, 3616, 3508, 3628, 4448, 4568, 7138, 7258, 5022, 5142, 5262, 4902, 5632, 4581, 4701, 4821, 4941, 4661, 4461];
const L = [null, 4032, 4152, 4132, 5120, 5064, 5550, 5490, 5030, 4770, 4890, 4778, 4498, 4978, 5038, 5098, 4960, 4625, 4289, 3800, 2910, 2224, 1915, 2515, 2205, 1496, 1150, 1270, 1010, 350, 306, 113, 145, 1916, 1947, 1979, 1782, 1814, 2545, 2577, 5058, 5089, 4565, 4656, 4508, 4359, 5061, 4581, 4701, 4821, 4834, 4448, 4461];
const N = 53, T0 = 1, PB = 31; // creux : S24, libre 113
const sn = (r) => (r < 8 ? 46 + r : r - 7);
// mouvements de l'année (montant de l'événement, semaine où il touche la caisse)
const MV = [
  [4, 1180, 'Marché de Noël', 'Noël', 'evenement'], [6, 640, 'Noël privés', 'Noël pr.', 'vente'], [8, -540, 'Commande groupée de malt', 'Malt', 'achat'],
  [9, -380, 'Assurance', 'Assur.', 'charge'], [13, 420, 'Dégustation', 'Dégust.', 'evenement'], [16, 520, 'Café du Pont', 'Café', 'vente'],
  [20, -900, 'Hotte', 'Hotte', 'renovation'], [23, 910, 'Marché de printemps', 'Marché', 'evenement'], [25, -1080, 'Six fûts inox', 'Fûts', 'achat'],
  [27, 380, 'La Cigogne', 'Cigogne', 'vente'], [29, -2800, 'Embouteilleuse', 'Embout.', 'achat'], [31, -380, 'Pompe', 'Pompe', 'achat'],
  [33, 2140, 'Fête de village', 'Fête', 'evenement'], [38, 1100, 'Mariage', 'Mariage', 'vente'], [40, 2450, 'Festival', 'Festival', 'evenement'],
  [42, -1800, 'Frigo', 'Frigo', 'achat'], [45, -480, 'Houblons', 'Houbl.', 'achat'], [46, 610, 'Portes ouvertes', 'Portes', 'evenement'], [47, -600, 'Sols', 'Sols', 'renovation'],
].map(([r, m, n, sh, t]) => ({ r, m, n, sh, t }));
const fmt = (n) => String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const sg = (n) => (n >= 0 ? '+' : '−') + fmt(n);
const MO = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const W0 = Date.UTC(2026, 10, 9);
const mois = []; { let prev = -1; for (let r = 0; r < N; r++) { const d = new Date(W0 + (r * 7 + 3) * 864e5), k = d.getUTCMonth(); if (k !== prev) { mois.push({ r, k }); prev = k; } } }

// courbe : W large, plot de yT à yB ; X(r) bord gauche de la semaine r
function courbe({ W = 366, H, yT, yB, x0 = 4, pw = W - 8, ymax = 8000, id }) {
  const X = (r) => x0 + pw * r / N, Y = (v) => yT + (yB - yT) * (1 - v / ymax);
  let lib = '', cai = '', dn = '';
  for (let r = T0; r < N; r++) { const a = X(r).toFixed(1), b = X(r + 1).toFixed(1); lib += (r === T0 ? 'M' : 'L') + a + ' ' + Y(L[r]).toFixed(1) + 'L' + b + ' ' + Y(L[r]).toFixed(1); cai += (r === T0 ? 'M' : 'L') + a + ' ' + Y(C[r]).toFixed(1) + 'L' + b + ' ' + Y(C[r]).toFixed(1); }
  for (let r = N - 1; r >= T0; r--) dn += 'L' + X(r + 1).toFixed(1) + ' ' + Y(L[r]).toFixed(1) + 'L' + X(r).toFixed(1) + ' ' + Y(L[r]).toFixed(1);
  const fond = `<defs><pattern id="${id}h" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="2.4" height="6" fill="var(--fin)" opacity=".5"/></pattern></defs>`
    + [0, 2000, 4000, 6000, 8000].map((t) => `<line x1="${x0}" x2="${x0 + pw}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--line)" stroke-width="1"/>`).join('')
    + `<rect x="${x0}" y="${yT}" width="${X(T0) - x0}" height="${yB - yT}" fill="var(--s2)"/>`
    + `<path d="${lib}L${X(N)} ${yB}L${X(T0)} ${yB}Z" fill="var(--area)"/><path d="${cai}${dn}Z" fill="url(#${id}h)"/>`;
  const traits = `<path d="${cai}" fill="none" stroke="var(--mut)" stroke-width="1.5"/><path d="${lib}" fill="none" stroke="var(--fin)" stroke-width="2.5"/>`;
  return { X, Y, fond, traits, cx: (r) => X(r) + pw / N / 2, pw, x0 };
}
// étiquettes : placement glouton sans chevauchement (largeur estimée, vérifiée ensuite au rendu)
const largeur = (s, px = 14, gras = true) => [...s].reduce((a, ch) => a + (/[  ]/.test(ch) ? px * .28 : /[0-9+−]/.test(ch) ? px * .56 : /[A-Z]/.test(ch) ? px * .62 : px * (gras ? .54 : .5)), 0);
function placer(items, obst, cadre) {
  const pris = obst.map((o) => ({ ...o }));
  const hit = (b) => b.x < cadre.x0 || b.x + b.w > cadre.x1 || b.y < cadre.y0 || b.y + b.h > cadre.y1 || pris.some((o) => b.x < o.x + o.w + 2 && o.x < b.x + b.w + 2 && b.y < o.y + o.h + 1 && o.y < b.y + b.h + 1);
  const out = [];
  for (const it of items) { let ok = null; for (const c of it.cands) { const b = { x: c.x, y: c.y, w: it.w, h: it.h }; if (!hit(b)) { ok = { ...it, ...c }; pris.push(b); break; } } out.push(ok || { ...it, cache: true }); }
  return out;
}
const svgT = (x, y, s, cls, anchor = 'start') => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" class="${cls}">${s}</text>`;
const ICO = (n, extra = '') => `<svg class="ico"${extra}><use href="#i-${n}"></use></svg>`;

const CSS_COMMUN = `#lhead .gd-hd,#side #mini{display:none!important}
.qh{position:relative;margin:0 12px;color:var(--ink)}.qh svg text{font-family:inherit;font-variant-numeric:tabular-nums}
.qh .t14{font-size:14px;fill:var(--mut);paint-order:stroke;stroke:var(--halo);stroke-width:3px}
.qh .tp{font-size:14px;font-weight:700;fill:var(--ok);paint-order:stroke;stroke:var(--halo);stroke-width:4px;stroke-linejoin:round}
.qh .tm{font-size:14px;font-weight:700;fill:var(--bad);paint-order:stroke;stroke:var(--halo);stroke-width:4px;stroke-linejoin:round}
.qh .tn{font-size:14px;font-weight:400;fill:var(--ink);paint-order:stroke;stroke:var(--halo);stroke-width:4px;stroke-linejoin:round}
.qh .tf{font-size:14px;font-weight:700;fill:var(--fin);paint-order:stroke;stroke:var(--halo);stroke-width:4px;stroke-linejoin:round}
.qh button{font:inherit;color:inherit}
.q-pil{height:26px;min-width:26px;border-radius:13px;display:inline-flex;align-items:center;justify-content:center;gap:2px;border:1.5px solid var(--line2);padding:0 6px;font-size:14px;font-weight:700;white-space:nowrap;background:var(--bg)}
.q-pil .ico{width:16px;height:16px}.q-pil.bad{border-color:var(--bad);color:var(--bad);background:var(--badbg)}.q-pil.nu{border-color:transparent;background:none;padding:0}
.q-per{height:26px;border-radius:13px;background:var(--ink);color:var(--bg)!important;font-size:14px;font-weight:700;padding:0 3px 0 9px;display:inline-flex;align-items:center;white-space:nowrap}.q-per .ico{width:16px;height:16px}
.q-brosse{position:absolute;border:2px solid var(--fin);border-radius:8px;background:color-mix(in srgb,var(--fin) 8%,transparent);touch-action:none}
.q-brosse i{position:absolute;top:50%;width:6px;height:22px;margin-top:-11px;background:var(--fin);border-radius:3px}.q-brosse i:first-child{left:-4px}.q-brosse i:last-child{right:-4px}
.q-mk{cursor:pointer}`;

function page(n, titre, css, html) {
  let h = BASE.replace(/<title>[^<]*<\/title>/, `<title>${n} · en-tête ${titre} (base g-d1)</title>`);
  const i = h.indexOf('</style>'); h = h.slice(0, i) + '\n/* en-tête ' + n + ' */\n' + CSS_COMMUN + '\n' + css + '\n' + h.slice(i);
  const k = '<div class="lhead" id="lhead">'; const j = h.indexOf(k); if (j < 0) throw new Error('lhead absent');
  h = h.slice(0, j + k.length) + html + h.slice(j + k.length);
  fs.writeFileSync(path.join(HERE, n + '.html'), h);
}
const brosse = (c, top, h) => `<div class="q-brosse" data-booster="fenetre-semaines" data-pinceau="corps" aria-label="Fenêtre : S47 à S52" style="left:${c.X(1)}px;width:${c.X(7) - c.X(1)}px;top:${top}px;height:${h}px"><i></i><i></i></div>`;
const moisTxt = (c, y, saute = []) => mois.filter((m) => m.r > 0 && !saute.includes(MO[m.k])).map((m) => `<line x1="${c.X(m.r)}" x2="${c.X(m.r)}" y1="${y - 13}" y2="${y - 9}" stroke="var(--line2)" stroke-width="1.5"/>`).join('');

const per = (cls = '') => `<button type="button" class="q-per ${cls}" data-booster="periode" data-pg-periode="6" aria-label="Période : 6 semaines (3 mois, 6 mois, An)">6 sem.${ICO('bas')}</button>`;
const ret = (mots) => `<button type="button" class="q-pil bad" data-booster="retards" aria-label="2 en retard">${ICO('k15ret')}${mots ? '2 en retard' : '2'}</button>`;
const plein = `<button type="button" class="q-pil nu" data-plein aria-label="Plein écran">${ICO('plein')}</button>`;
const jump = (c, m, w = 3.5) => `<line class="q-mk" x1="${c.X(m.r)}" x2="${c.X(m.r)}" y1="${c.Y(C[m.r - 1])}" y2="${c.Y(C[m.r])}" stroke="var(${m.m > 0 ? '--ok' : '--bad'})" stroke-width="${w}" stroke-linecap="round"><title>${m.n} ${sg(m.m)}</title></line>`;
// ---------- q1 : le repère du creux porte le chiffre ----------
{
  const H = 122, c = courbe({ H, yT: 34, yB: 104, id: 'q1' });
  const big = MV.filter((m) => Math.abs(m.m) >= 900);
  const mk = big.map((m) => { const x = c.X(m.r), y0 = c.Y(C[m.r - 1]), y1 = c.Y(C[m.r]); return `<line class="q-mk" x1="${x}" x2="${x}" y1="${y0}" y2="${y1}" stroke="var(${m.m > 0 ? '--ok' : '--bad'})" stroke-width="3.5" stroke-linecap="round"><title>${m.n} ${sg(m.m)}</title></line>`; }).join('');
  const items = big.sort((a, b) => Math.abs(b.m) - Math.abs(a.m)).map((m) => { const s = sg(m.m), w = largeur(s), x = c.X(m.r), yh = Math.min(c.Y(C[m.r - 1]), c.Y(C[m.r])), yb = Math.max(c.Y(C[m.r - 1]), c.Y(C[m.r]));
    const cands = m.m > 0 ? [{ x: x - w - 3, y: yh - 2 }, { x: x - w / 2, y: yh - 17 }, { x: x + 3, y: yh - 16 }] : [{ x: x + 3, y: yb - 14 }, { x: x - w / 2, y: yb + 2 }, { x: x - w - 3, y: yb - 6 }];
    return { m, s, w, h: 14, cands }; });
  const obst = [{ x: 0, y: 0, w: 366, h: 30 }, { x: c.X(1), y: 30, w: c.X(7) - c.X(1), h: 76 }];
  const lab = placer(items, obst, { x0: 0, x1: 366, y0: 30, y1: 104 }).filter((l) => !l.cache).map((l) => svgT(l.x, l.y + 12, l.s, l.m.m > 0 ? 'tp' : 'tm')).join('');
  const xs = c.cx(PB), ys = c.Y(L[PB]);
  const svg = `<svg class="q1c" width="366" height="${H}" viewBox="0 0 366 ${H}" aria-hidden="true" data-booster="mouvements">${c.fond}${moisTxt(c, 122)}${c.traits}${mk}`
    + `<line x1="${xs}" x2="${xs}" y1="27" y2="${ys}" stroke="var(--fin)" stroke-width="1.5" stroke-dasharray="2 3"/><circle cx="${xs}" cy="${ys}" r="5.5" fill="var(--fin)" stroke="var(--halo)" stroke-width="2"/>`
    + lab + mois.filter((m) => m.r > 1 && m.k % 3 === 2).map((m) => svgT(c.X(m.r) + 3, 120, MO[m.k], 't14')).join('') + '</svg>';
  page('q1', 'le repère du creux porte le chiffre', `.q1{height:124px}.q1>svg{position:absolute;left:0;top:0}
.q1-n{position:absolute;top:0;left:0;right:0;height:28px;display:flex;align-items:center;gap:6px}
.q1-big{position:absolute;left:${xs - 112}px;top:0;height:28px;display:flex;align-items:baseline;gap:4px;white-space:nowrap;border-radius:8px;padding:0 4px;background:var(--bg)}
.q1-big b{font-size:24px;font-weight:800;color:var(--fin);letter-spacing:-.5px;font-variant-numeric:tabular-nums}.q1-big span{font-size:14px;color:var(--mut)}.q1-big em{font-style:normal;font-size:14px;font-weight:700;color:var(--fin)}
.q1-d{margin-left:auto;display:flex;gap:4px}`,
    `<header class="qh q1">${svg}${brosse(c, 32, 74)}<div class="q1-n"><button type="button" class="q-per" data-booster="periode" data-pg-periode="6" aria-label="Période : 6 semaines (3 mois, 6 mois, An)">6 sem.${ICO('bas')}</button>`
    + `<button type="button" class="q1-big" data-booster="a-depenser" data-plus aria-label="113 CHF à dépenser sans passer sous 0, au plus serré en S24 : détail"><b>113</b><span>CHF à dépenser ·</span><em>S24</em></button>`
    + `<span class="q1-d"><button type="button" class="q-pil bad" data-booster="retards" aria-label="2 en retard">${ICO('k15ret')}2</button><button type="button" class="q-pil nu" data-plein aria-label="Plein écran">${ICO('plein')}</button></span></div></header>`);
}

// ---------- q2 : une ligne, puis le flux en miroir sous la courbe ----------
{
  const H = 104, c = courbe({ H, yT: 4, yB: 52, id: 'q2' }), ax = 80, k = 22 / 2800;
  const net = []; for (let r = 1; r < N; r++) net[r] = C[r] - (r === 1 ? 4180 : C[r - 1]);
  const bars = net.map((v, r) => { if (!v) return ''; const h = Math.max(2, Math.abs(v) * k), x = c.X(r) + 1, w = c.pw / N - 2; return `<rect x="${x.toFixed(1)}" y="${(v > 0 ? ax - h : ax).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="1" fill="var(${v > 0 ? '--ok' : '--bad'})" opacity="${Math.abs(v) >= 900 ? 1 : .55}"/>`; }).join('');
  const sel = MV.filter((m) => Math.abs(m.m) >= 900);
  const items = sel.sort((a, b) => Math.abs(b.m) - Math.abs(a.m)).map((m) => { const s = sg(m.m), w = largeur(s), x = c.cx(m.r);
    const cands = m.m > 0 ? [{ x: x + 7, y: ax - 16 }, { x: x - w - 7, y: ax - 16 }] : [{ x: x + 7, y: ax + 3 }, { x: x - w - 7, y: ax + 3 }];
    return { m, s, w, h: 14, cands }; });
  const barObst = []; net.forEach((v, r) => { if (Math.abs(v) >= 900) { const h = Math.abs(v) * k; barObst.push({ x: c.X(r), y: v > 0 ? ax - h : ax, w: c.pw / N, h }); } });
  const lab = placer(items, [{ x: c.X(1) - 4, y: 0, w: c.X(7) - c.X(1) + 8, h: 106 }, ...barObst], { x0: 0, x1: 366, y0: 52, y1: 104 }).filter((l) => !l.cache)
    .map((l) => svgT(l.x, l.y + 12, l.s, l.m.m > 0 ? 'tp' : 'tm')).join('');
  const xs = c.cx(PB), ys = c.Y(L[PB]);
  const svg = `<svg width="366" height="${H}" viewBox="0 0 366 ${H}" aria-hidden="true" data-booster="mouvements">${c.fond}${c.traits}<line x1="4" x2="362" y1="${ax}" y2="${ax}" stroke="var(--line2)" stroke-width="1"/>${bars}${lab}`
    + `<circle cx="${xs}" cy="${ys}" r="5" fill="var(--fin)" stroke="var(--halo)" stroke-width="2"/></svg>`;
  page('q2', 'une ligne, puis le flux en miroir', `.q2{padding-top:2px}.q2-l{height:28px;display:flex;align-items:center;gap:6px;white-space:nowrap}
.q2-l .n{display:flex;align-items:baseline;gap:4px}.q2-l .n b{font-size:22px;font-weight:800;color:var(--fin);letter-spacing:-.5px;font-variant-numeric:tabular-nums}.q2-l .n span{font-size:14px;color:var(--mut)}.q2-l .n em{font-style:normal;font-weight:700;color:var(--fin);font-size:14px}
.q2-l .r{margin-left:auto;display:flex;gap:4px}.q2-g{position:relative;height:${H}px;margin-top:2px}.q2-g>svg{position:absolute;left:0;top:0}
`,
    `<header class="qh q2"><div class="q2-l"><button type="button" class="n" data-booster="a-depenser" data-plus aria-label="113 CHF à dépenser sans passer sous 0, au plus serré en S24"><b>113</b><span>CHF à dépenser ·</span><em>S24</em></button>`
    + `<span class="r">${per()}<button type="button" class="q-pil bad" data-booster="retards" aria-label="2 en retard">${ICO('k15ret')}2</button><button type="button" class="q-pil nu" data-plein aria-label="Plein écran">${ICO('plein')}</button></span></div>`
    + `<div class="q2-g">${svg}${brosse(c, 0, 102)}</div></header>`);
}

// ---------- q3 : fanions — chaque grand mouvement a son fanion nommé, le chiffre est le fanion du creux ----------
{
  const H = 128, yT = 55, yB = 110, c = courbe({ H, yT, yB, id: 'q3' });
  const xs = c.cx(PB), ys = c.Y(L[PB]);
  const sel = MV.filter((m) => Math.abs(m.m) >= 900).sort((a, b) => Math.abs(b.m) - Math.abs(a.m));
  const rows = [0, 28];
  const nW = (m) => largeur(m.sh, 14, false) + 5 + largeur(sg(m.m)) + 12;
  // fanion du chiffre (prioritaire) : rangée 0, centré sur le creux
  const numW = 198, num = { x: xs - 150, y: 28, w: numW, h: 24 };
  const obst = [num, { x: 0, y: 0, w: 74, h: 26 }, { x: 292, y: 0, w: 74, h: 26 }];
  const items = []; for (const m of sel) { const x = c.X(m.r); for (const court of [false, true]) { const w = court ? largeur(sg(m.m)) + 12 : nW(m), cands = []; for (const y of rows) for (let d = -6; d >= -w + 6; d -= 6) cands.push({ x: x + d, y }); items.push({ m, w, h: 22, court, cands }); } }
  const fl = []; { const pris = [...obst]; const dej = new Set(); for (const it of items) { if (dej.has(it.m)) continue; const r = placer([it], pris, { x0: 0, x1: 366, y0: 0, y1: 52 })[0]; if (!r.cache) { fl.push(r); pris.push({ x: r.x, y: r.y, w: r.w, h: r.h }); dej.add(it.m); } } }
  const flags = fl.filter((l) => !l.cache).map((l) => { const x = c.X(l.m.r), top = Math.min(c.Y(C[l.m.r - 1]), c.Y(C[l.m.r])); const col = l.m.m > 0 ? '--ok' : '--bad';
    return `<line x1="${x}" x2="${x}" y1="${l.y + 22}" y2="${top}" stroke="var(${col})" stroke-width="1.2" stroke-dasharray="2 2"/><rect x="${l.x}" y="${l.y}" width="${l.w}" height="22" rx="6" fill="var(--bg)" stroke="var(${col})" stroke-width="1.5"/>`
      + `<text x="${l.x + 6}" y="${l.y + 16}" class="tn">${l.court ? '' : l.m.sh + ' '}<tspan class="${l.m.m > 0 ? 'tp' : 'tm'}">${sg(l.m.m)}</tspan></text>`; }).join('');
  const marks = sel.map((m) => jump(c, m, 3)).join('');
  const moisL = mois.filter((m) => m.r > 1 && m.k % 3 === 2).map((m) => svgT(c.X(m.r) + 3, 126, MO[m.k], 't14')).join('');
  const svg = `<svg width="366" height="${H}" viewBox="0 0 366 ${H}" aria-hidden="true" data-booster="mouvements">${c.fond}${moisTxt(c, 128)}${c.traits}${marks}${flags}`
    + `<line x1="${xs}" x2="${xs}" y1="55" y2="${ys}" stroke="var(--fin)" stroke-width="1.5"/><circle cx="${xs}" cy="${ys}" r="5.5" fill="var(--fin)" stroke="var(--halo)" stroke-width="2"/>${moisL}</svg>`;
  page('q3', 'fanions', `.q3{height:130px}.q3>svg{position:absolute;left:0;top:0}.q3 .q-per{position:absolute;left:0;top:0}.q3-d{position:absolute;right:0;top:0;display:flex;gap:4px}
.q3-n{position:absolute;left:${num.x}px;top:28px;height:24px;display:flex;align-items:center;gap:4px;padding:0 7px;border-radius:6px;background:var(--fin);color:var(--bg);white-space:nowrap;font-size:14px}
.q3-n b{font-size:17px;font-weight:800;font-variant-numeric:tabular-nums}.q3-n::after{content:'';position:absolute;left:${xs - num.x - 5}px;bottom:-5px;border:5px solid transparent;border-bottom:0;border-top-color:var(--fin)}`,
    `<header class="qh q3">${svg}${brosse(c, yT - 4, yB - yT + 8)}${per()}<button type="button" class="q3-n" data-booster="a-depenser" data-plus aria-label="113 CHF à dépenser sans passer sous 0, au plus serré en S24"><b>113</b>CHF à dépenser · S24</button><span class="q3-d">${ret(false)}${plein}</span></header>`);
}

// ---------- q4 : deux rives — entrées nommées au-dessus, sorties au-dessous, la courbe entre ----------
{
  const H = 98, yT = 20, yB = 78, c = courbe({ H, yT, yB, id: 'q4' });
  const xs = c.cx(PB), ys = c.Y(L[PB]);
  const ent = MV.filter((m) => m.m >= 600).sort((a, b) => b.m - a.m), sor = MV.filter((m) => m.m <= -540).sort((a, b) => a.m - b.m);
  const it = (m, y) => { const w = largeur(m.sh, 14, false) + 4 + largeur(sg(m.m)); const x = c.cx(m.r); const cands = [{ x: x - w / 2, y }]; for (let d = -4; d >= -w + 4; d -= 6) cands.push({ x: x + d, y }); return { m, w, h: 16, cands }; };
  const ob = [{ x: c.X(1) - 2, y: 0, w: c.X(7) - c.X(1) + 4, h: H }];
  const hi = placer(ent.map((m) => it(m, 1)), ob, { x0: 0, x1: 366, y0: 0, y1: 18 }), lo = placer(sor.map((m) => it(m, 81)), ob, { x0: 0, x1: 366, y0: 80, y1: 98 });
  const txt = (l) => `<text x="${l.x.toFixed(1)}" y="${l.y + 13}" class="tn">${l.m.sh} <tspan class="${l.m.m > 0 ? 'tp' : 'tm'}">${sg(l.m.m)}</tspan></text>`;
  const tick = (l, haut) => { const x = c.cx(l.m.r), y = c.Y(C[l.m.r]); return `<line x1="${x}" x2="${x}" y1="${haut ? 17 : y}" y2="${haut ? y : 81}" stroke="var(${l.m.m > 0 ? '--ok' : '--bad'})" stroke-width="1" stroke-dasharray="1.5 2.5"/>`; };
  const tous = [...hi, ...lo].filter((l) => !l.cache);
  const svg = `<svg width="366" height="${H}" viewBox="0 0 366 ${H}" aria-hidden="true" data-booster="mouvements">${c.fond}${hi.filter((l) => !l.cache).map((l) => tick(l, true)).join('')}${lo.filter((l) => !l.cache).map((l) => tick(l, false)).join('')}${c.traits}`
    + tous.map((l) => jump(c, l.m, 3)).join('') + tous.map(txt).join('') + `<circle cx="${xs}" cy="${ys}" r="5" fill="var(--fin)" stroke="var(--halo)" stroke-width="2"/></svg>`;
  page('q4', 'deux rives', `.q4-l{height:30px;display:flex;align-items:center;gap:6px;white-space:nowrap}
.q4-l .n{display:flex;align-items:baseline;gap:5px;height:30px;line-height:30px;padding:0 8px 0 0}.q4-l .n b{font-size:22px;font-weight:800;color:var(--fin);font-variant-numeric:tabular-nums;letter-spacing:-.5px}.q4-l .n span{font-size:14px;color:var(--mut)}.q4-l .n em{font-style:normal;font-size:14px;font-weight:700;color:var(--fin)}
.q4-l .d{margin-left:auto;display:flex;gap:4px}.q4-g{position:relative;height:${H}px}.q4-g>svg{position:absolute;left:0;top:0}`,
    `<header class="qh q4"><div class="q4-l"><button type="button" class="n" data-booster="a-depenser" data-plus aria-label="113 CHF à dépenser sans passer sous 0, au plus serré en S24"><b>113</b><span>à dépenser · plus serré</span><em>S24</em></button><span class="d">${per()}${ret(false)}${plein}</span></div>`
    + `<div class="q4-g">${svg}${brosse(c, 0, H)}</div></header>`);
}

// ---------- q5 : le creux expliqué — accolade sur la descente S13→S24, ses causes dites dessus, le reste en marques ----------
{
  const H = 104, yT = 32, yB = 88, c = courbe({ H, yT, yB, id: 'q5' });
  const xs = c.cx(PB), ys = c.Y(L[PB]), xa = c.X(20), xb = c.X(PB + 1);
  const cause = [29, 25, 20].map((r) => MV.find((m) => m.r === r));
  const autres = MV.filter((m) => Math.abs(m.m) >= 900 && !cause.includes(m)).map((m) => jump(c, m, 3)).join('');
  const acc = `<path d="M${xa} 31 L${xa} 26 L${xb} 26 L${xb} 31" fill="none" stroke="var(--bad)" stroke-width="1.5"/><line x1="${xs}" x2="${xs}" y1="26" y2="${ys}" stroke="var(--fin)" stroke-width="1.5" stroke-dasharray="2 3"/>`;
  const svg = `<svg width="366" height="${H}" viewBox="0 0 366 ${H}" aria-hidden="true" data-booster="mouvements"><rect x="${xa}" y="${yT}" width="${xb - xa}" height="${yB - yT}" fill="var(--bad)" opacity=".08"/>${c.fond}${c.traits}${autres}${cause.map((m) => jump(c, m, 4)).join('')}${acc}`
    + `<circle cx="${xs}" cy="${ys}" r="5.5" fill="var(--fin)" stroke="var(--halo)" stroke-width="2"/>`
    + mois.filter((m) => m.r > 1 && m.k % 3 === 2).map((m) => svgT(c.X(m.r) + 3, 102, MO[m.k], 't14')).join('') + moisTxt(c, 104) + '</svg>';
  const pourquoi = cause.map((m) => `<span>${m.sh} <b class="m">${sg(m.m)}</b></span>`).join('') + `<span class="dc"><i></i>frigo <b>1 140</b></span>`;
  page('q5', 'le creux expliqué', `.q5-t{height:28px;display:flex;align-items:center;gap:6px;white-space:nowrap}
.q5-n{display:flex;align-items:baseline;gap:4px;white-space:nowrap;height:28px;line-height:28px}.q5-n b{font-size:24px;font-weight:800;color:var(--fin);font-variant-numeric:tabular-nums;letter-spacing:-.5px}.q5-n span{font-size:14px;color:var(--mut)}.q5-n em{font-style:normal;font-size:14px;font-weight:700;color:var(--fin)}
.q5-t .d{margin-left:auto;display:flex;gap:4px}
.q5-w{position:absolute;left:0;right:0;top:0;z-index:2;height:24px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:14px;white-space:nowrap;color:var(--ink);font-variant-numeric:tabular-nums}.q5-w .m{color:var(--bad)}.q5-w .dc{color:var(--fin)}.q5-w .dc i{display:inline-block;width:12px;height:12px;margin-right:3px;vertical-align:-1px;border:1.5px solid var(--fin);background:repeating-linear-gradient(45deg,var(--fin) 0 2px,transparent 2px 5px)}
.q5-g{position:relative;height:${H}px}.q5-g>svg{position:absolute;left:0;top:0}`,
    `<header class="qh q5"><div class="q5-t"><button type="button" class="q5-n" data-booster="a-depenser" data-plus aria-label="113 CHF à dépenser sans passer sous 0, au plus serré en S24 : détail"><b>113</b><span>CHF à dépenser ·</span><em>S24</em></button><span class="d">${per()}${ret(false)}${plein}</span></div>`
    + `<div class="q5-g"><div class="q5-w" data-booster="creux" aria-label="Pourquoi le creux de S24 : embouteilleuse, fûts, hotte ; frigo mis de côté">${pourquoi}</div>${svg}${brosse(c, yT - 2, yB - yT + 4)}</div></header>`);
}

// ---------- q6 : courbe-bandeau bord à bord, mouvements en bulles à la taille du montant ----------
{
  const H = 124, yT = 42, yB = 112, c = courbe({ W: 390, H, yT, yB, x0: 4, pw: 382, id: 'q6' });
  const xs = c.cx(PB), ys = c.Y(L[PB]);
  const sel = MV.filter((m) => Math.abs(m.m) >= 900);
  const bulles = sel.map((m) => { const r = 3 + 7.5 * Math.sqrt(Math.abs(m.m) / 2800), x = c.cx(m.r), y = m.m > 0 ? c.Y(C[m.r]) - r - 2 : c.Y(C[m.r]) + r + 2;
    return { m, r, x, y, svg: `<circle class="q-mk" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="var(${m.m > 0 ? '--ok' : '--bad'})" fill-opacity=".85" stroke="var(--halo)" stroke-width="1.5"><title>${m.n} ${sg(m.m)}</title></circle>` }; });
  const big = bulles.filter((b) => Math.abs(b.m.m) >= 900).sort((a, b) => Math.abs(b.m.m) - Math.abs(a.m.m));
  const obst = [{ x: 0, y: 0, w: 390, h: 32 }, { x: c.X(1), y: 32, w: c.X(7) - c.X(1), h: 84 }, ...bulles.map((b) => ({ x: b.x - b.r, y: b.y - b.r, w: 2 * b.r, h: 2 * b.r })), { x: xs - 8, y: ys - 8, w: 16, h: 16 }];
  const items = big.map((b) => { const s = sg(b.m.m), w = largeur(s); return { m: b.m, s, w, h: 14, cands: [{ x: b.x + b.r + 3, y: b.y - 7 }, { x: b.x - b.r - 3 - w, y: b.y - 7 }, { x: b.x - w / 2, y: b.m.m > 0 ? b.y - b.r - 16 : b.y + b.r + 2 }] }; });
  const lab = placer(items, obst, { x0: 2, x1: 388, y0: 30, y1: 124 }).filter((l) => !l.cache).map((l) => svgT(l.x, l.y + 12, l.s, l.m.m > 0 ? 'tp' : 'tm')).join('');
  const svg = `<svg width="390" height="${H}" viewBox="0 0 390 ${H}" aria-hidden="true" data-booster="mouvements">${c.fond}${c.traits}${bulles.map((b) => b.svg).join('')}${lab}`
    + `<line x1="${xs}" x2="${xs}" y1="34" y2="${ys}" stroke="var(--fin)" stroke-width="1.5" stroke-dasharray="2 3"/><circle cx="${xs}" cy="${ys}" r="5" fill="var(--fin)" stroke="var(--halo)" stroke-width="2"/></svg>`;
  page('q6', 'courbe-bandeau, bulles', `.q6{margin:0;height:126px}.q6>svg{position:absolute;left:0;top:0}.q6-t{position:absolute;left:12px;right:12px;top:2px;height:28px;display:flex;align-items:center;gap:6px;white-space:nowrap}
.q6-t .n{display:flex;align-items:baseline;gap:4px}.q6-t .n b{font-size:24px;font-weight:800;color:var(--fin);font-variant-numeric:tabular-nums;letter-spacing:-.5px}.q6-t .n span{font-size:14px;color:var(--mut)}.q6-t .n em{font-style:normal;font-size:14px;font-weight:700;color:var(--fin)}.q6-t .d{margin-left:auto;display:flex;gap:4px}
`,
    `<header class="qh q6">${svg}${brosse(c, yT - 2, yB - yT + 4)}<div class="q6-t"><button type="button" class="n" data-booster="a-depenser" data-plus aria-label="113 CHF à dépenser sans passer sous 0, au plus serré en S24"><b>113</b><span>CHF à dépenser ·</span><em>S24</em></button><span class="d">${per()}${ret(false)}${plein}</span></div></header>`);
}
fs.writeFileSync(path.join(HERE, 'q-data.json'), JSON.stringify({ C, L, MV, mois }, null, 0));
console.log('q1…q6 écrits');
