// node en/l/build.mjs : en-têtes l1 à l5 posés sur cd/cd1-paysage.html (844 × 390). Seul le haut change :
// la frise, le + et tout le code après <div class="cd-frw"> restent ceux de la base, octet pour octet.
// Courbe : séries relevées sur la courbe de la base (libre = ligne bleue, caisse = ligne grise) ; 12 premières semaines = bande de la base.
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url';
const L = path.dirname(fileURLToPath(import.meta.url)), EN = path.join(L, '..');
const BASE = fs.readFileSync(path.join(EN, '..', 'cd', 'cd1-paysage.html'), 'utf8');
const i0 = BASE.indexOf('<header class="cd-hd">'), i1 = BASE.indexOf('<div class="cd-frw">');
const HEAD = BASE.slice(0, i0), TAIL = BASE.slice(i1);
const SVGC = BASE.match(/<svg class="cd-svg"[\s\S]*?<\/svg>/)[0];
const PTH = [...SVGC.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]);
const steps = (d) => { const n = [...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => [+m[1], +m[2]]); const o = []; for (let k = 0; k + 1 < n.length; k++) if (n[k][1] === n[k + 1][1] && n[k + 1][0] > n[k][0]) o.push(n[k][1]); return o; };
const chf = (y) => Math.round((4032 + (43.8 - y) * 153.5) / 10) * 10;
const LIB = steps(PTH[3]).map(chf), CAI = steps(PTH[2]).map(chf);
[4032, 4152, 4132, 5120, 5064, 5550, 5490, 5030, 4770, 4890, 4778, 4498].forEach((v, k) => { LIB[k] = v; });
LIB[30] = 113; for (let k = 0; k < 52; k++) CAI[k] = Math.max(CAI[k], LIB[k]);
const N = 52, DLT = LIB.map((v, k) => (k ? v - LIB[k - 1] : v - 4180));
const S = (k) => (k < 7 ? 'S' + (47 + k) : 'S' + (k - 6));
const MOIS = [[2.1, 'déc.'], [6.6, 'janv.'], [11.1, 'févr.'], [15.1, 'mars'], [19.6, 'avr.'], [23.9, 'mai'], [28.3, 'juin'], [32.6, 'juil.'], [37.0, 'août'], [41.4, 'sept.'], [45.7, 'oct.'], [50.1, 'nov.']];
const DATES = ['16.11', '23.11', '30.11', '7.12', '14.12', '21.12', '28.12', '4.1', '11.1', '18.1', '25.1', '1.2'];
const fmt = (v) => (v < 0 ? '−' : '+') + String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const fr = (v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const ic = (id) => `<svg class="ico" aria-hidden="true"><use href="#i-${id}"></use></svg>`;
const icq = `<svg class="ico" aria-hidden="true" viewBox="0 0 24 24"><path d="M9 4v5H4M15 4v5h5M4 15h5v5M20 15h-5v5"/></svg>`;
// mouvements nommés : montant de la chose, semaine où elle touche la caisse (proto sources2 : a, b, m)
const ENT = [{ k: 3, n: 'Noël', l: 'Marché de Noël', v: 1180, g: 'evenement', i: 'k11star' }, { k: 22, n: 'printemps', l: 'Marché de printemps', v: 910, g: 'evenement', i: 'k11star' },
  { k: 32, n: 'fête', l: 'Fête de village', v: 2140, g: 'evenement', i: 'k11star' }, { k: 37, n: 'mariage', l: 'Commande de mariage', v: 1100, g: 'vente', i: 'k17bout' }, { k: 39, n: 'festival', l: 'Festival de la bière', v: 2450, g: 'evenement', i: 'k11star' }];
const SOR = [{ k: 19, n: 'hotte', l: 'Hotte', v: -900, g: 'renovation', i: 'outil' }, { k: 24, n: 'fûts', l: 'Six fûts inox', v: -1080, g: 'achat', i: 'k18fut' },
  { k: 28, n: 'embouteilleuse', l: 'Embouteilleuse', v: -2800, g: 'achat', i: 'k17cart' }, { k: 41, n: 'frigo', l: 'Frigo (chambre froide)', v: -1800, g: 'achat', i: 'k17froid' }];
const E = (k) => ENT.find((q) => q.k === k) || SOR.find((q) => q.k === k);

// courbe de l'année, W × H ; x de la semaine k = (k + .5) × W / 52
function plot(W, H, o = {}) {
  const top = o.top ?? 4, bot = o.bot ?? 3, yMax = o.yMax ?? 7500, wk = W / N;
  const Y = (v) => +(top + (1 - Math.max(v, 0) / yMax) * (H - top - bot)).toFixed(1), X = (k) => +((k + 0.5) * wk).toFixed(1);
  const stp = (A) => A.map((v, k) => `${k ? 'L' : 'M'}${(k * wk).toFixed(1)} ${Y(v)}L${((k + 1) * wk).toFixed(1)} ${Y(v)}`).join('');
  const back = (A) => A.map((v, k) => [k, v]).reverse().map(([k, v]) => `L${((k + 1) * wk).toFixed(1)} ${Y(v)}L${(k * wk).toFixed(1)} ${Y(v)}`).join('');
  let s = `<svg class="en-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs><pattern id="enh" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="2.2" height="6" fill="var(--fin)" opacity=".45"></rect></pattern></defs>`;
  for (const g of o.grid ?? [2000, 4000, 6000]) s += `<line x1="0" x2="${W}" y1="${Y(g)}" y2="${Y(g)}" stroke="var(--line)" stroke-width="1"/>`;
  s += `<path d="${stp(LIB)}L${W} ${Y(0)}L0 ${Y(0)}Z" fill="var(--area)"/>`;
  if (o.grey) s += `<path d="${stp(CAI)}${back(LIB)}Z" fill="url(#enh)"/><path d="${stp(CAI)}" fill="none" stroke="var(--mut)" stroke-width="1.3" stroke-dasharray="3 2"/>`;
  s += `<line x1="0" x2="${W}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--line2)" stroke-width="1.5"/>`;
  s += `<path d="${stp(LIB)}" fill="none" stroke="var(--fin)" stroke-width="2.5" stroke-linejoin="round"/>`;
  s += (o.extra ? o.extra({ X, Y, wk }) : '') + '</svg>';
  return { s, X, Y, wk, W };
}
const win = (P, x0, y0, H) => `<div class="en-win" data-booster="fenetre" style="left:${x0 - 2}px;top:${y0 - 2}px;width:${(12 * P.wk + 4).toFixed(1)}px;height:${H + 4}px" aria-label="Fenêtre affichée : 12 semaines, S47 à S5, à glisser"><i></i><i></i></div>`;
const dip = (P, x0, y0) => `<button type="button" class="en-dip" data-booster="creux" style="left:${(x0 + P.X(30) - 7).toFixed(1)}px;top:${(y0 + P.Y(113) - 7).toFixed(1)}px" aria-label="Au plus serré : 113 en S24 (7 juin). Un toucher ouvre ce qui creuse"></button>`;
const months = (P, x0, y, skip = []) => MOIS.filter(([, t]) => !skip.includes(t)).map(([k, t]) => `<span class="en-mo" style="left:${(x0 + k * P.wk).toFixed(1)}px;top:${y}px">${t}</span>`).join('');
const dates = (y) => DATES.map((d, k) => `<span class="en-dt${k ? '' : ' now'}" role="button" data-sem="${S(k)}" aria-label="${S(k)}, semaine du ${d} : libre en fin ${fr(LIB[k])}, ${fmt(DLT[k])} sur la semaine" style="left:${140 + 53 * k}px;top:${y}px">${d}</span>`).join('');
const K113 = (st) => `<div class="en-k" style="${st}" aria-label="113 CHF à dépenser"><b>113</b><small>CHF</small></div>`;
const S24 = `<button type="button" class="en-s24" aria-label="Au plus serré en S24 (7 juin) : déplier">S24${ic('bas')}</button>`;
const RET = (st) => `<button type="button" class="en-ret" style="${st}" aria-label="2 en retard : fûts au Café du Pont, facture Malterie Suisse ; un toucher ouvre la liste">${ic('k15ret')}2 en retard${ic('k15chev')}</button>`;
const PER = `<button type="button" class="en-pill" data-booster="periode" aria-haspopup="menu" aria-label="Période : 3 mois ; un toucher ouvre 6 sem., 6 mois, An">3 mois${ic('bas')}</button>`;
const TRI = `<button type="button" class="en-ib" aria-label="Trier les rangées">${ic('k15tri')}</button>`;
const QUIT = `<button type="button" class="en-ib" aria-label="Quitter le plein écran">${icq}</button>`;
const HYP = `<button type="button" class="en-ib" data-booster="hypotheses" aria-label="Hypothèses : caisse 4 180, +120 par semaine, présence 2 j (exemple) ; un toucher les règle">${ic('reglage')}</button>`;
const GEN = ['brassage', 'evenement', 'vente', 'achat', 'renovation', 'activite', 'charge'];
const FIL = `<button type="button" class="en-fil" data-booster="filtres" aria-label="Filtrer par genre : 7 genres affichés sur 7 ; un toucher ouvre les filtres">${GEN.map((g) => `<i style="--c:var(--e-${g})"></i>`).join('')}</button>`;
const row = (st, html) => `<div class="en-row" style="${st}">${html}</div>`;
// étiquette : al = l (commence en x), r (finit en x), c (centrée sur x)
const lab = (cls, x, y, html, al, aria) => `<span class="en-lb ${cls}" role="button" aria-label="${aria}" style="${al === 'r' ? `right:${(820 - x).toFixed(1)}px` : `left:${x.toFixed(1)}px`};top:${y}px${al === 'c' ? ';transform:translateX(-50%)' : ''}">${html}</span>`;
const mv = (e, nom = true) => `<b class="m">${fmt(e.v)}</b>${nom ? ` <span class="n">${e.n}</span>` : ''}`;
const aria = (e) => `${e.l} ${fmt(e.v)}, ${S(e.k)}${e.v < 0 ? ' (payé)' : ''}`;

const CSS = `
.en-h{grid-column:1/3;position:relative;width:820px}
.en-h .ico{width:16px;height:16px}
.en-svg{position:absolute;display:block;overflow:visible}
.en-k{position:absolute;display:flex;align-items:baseline;gap:4px;white-space:nowrap}
.en-k b{font-variant-numeric:tabular-nums;font-size:32px;line-height:32px;font-weight:800;color:var(--fin);letter-spacing:-1px}
.en-k small{font-size:14px;font-weight:700;color:var(--mut)}
.en-t{position:absolute;display:flex;align-items:center;gap:4px;height:24px;font-size:14px;white-space:nowrap;color:var(--ink)}
.en-s24{display:inline-flex;align-items:center;gap:1px;height:24px;font-size:14px;color:var(--fin);font-weight:700;white-space:nowrap}.en-s24 .ico{width:14px;height:14px}
.en-ret{position:absolute;display:inline-flex;align-items:center;gap:3px;height:24px;font-size:14px;font-weight:700;color:var(--bad);white-space:nowrap}.en-ret .ico{width:15px;height:15px}
.en-pill{display:inline-flex;align-items:center;gap:2px;height:26px;padding:0 6px 0 9px;border:1.5px solid var(--line2);border-radius:13px;font-size:14px;font-weight:700;white-space:nowrap}.en-pill .ico{width:14px;height:14px}
.en-ib{width:26px;height:26px;display:grid;place-items:center;border:1.5px solid var(--line2);border-radius:8px;flex:none}
.en-fil{display:inline-flex;align-items:center;gap:2px;height:26px;padding:0 7px;border:1.5px solid var(--line2);border-radius:13px}.en-fil i{width:8px;height:8px;border-radius:2px;background:var(--c)}
.en-row{position:absolute;display:flex;align-items:center;gap:6px}
.en-mo{position:absolute;font-size:14px;line-height:16px;color:var(--mut);white-space:nowrap;padding-left:3px;border-left:1px solid var(--line2)}
.en-dt{position:absolute;width:53px;text-align:center;font-variant-numeric:tabular-nums;font-size:14px;line-height:18px;color:var(--mut);white-space:nowrap}
.en-dt.now{color:var(--fin);font-weight:700}
.en-win{position:absolute;border:2px solid var(--fin);border-radius:7px;background:color-mix(in srgb,var(--fin) 9%,transparent)}
.en-win i{position:absolute;top:50%;width:6px;height:22px;margin-top:-11px;background:var(--fin);border-radius:3px}.en-win i:first-child{left:-4px}.en-win i+i{right:-4px}
.en-dip{position:absolute;width:14px;height:14px;border-radius:50%;background:var(--fin);border:2.5px solid var(--halo);box-shadow:0 0 0 1.5px var(--fin)}
.en-lb{position:absolute;font-size:14px;line-height:16px;white-space:nowrap;color:var(--mut)}
.en-lb .m,.en-lb.m{font-variant-numeric:tabular-nums;font-weight:700}
.en-lb.up .m,.en-lb.up.m{color:var(--ok)}.en-lb.dn .m,.en-lb.dn.m{color:var(--bad)}
.en-lb.fn{color:var(--fin);font-weight:700}
.en-band{position:absolute;left:0;width:820px;border-bottom:1px solid var(--line2)}
.en-tk{position:absolute;width:0;border-left:1px dotted}.en-tk.up{border-color:var(--ok)}.en-tk.dn{border-color:var(--bad)}
`;
const page = (id, titre, h, inner, css) => HEAD.replace(/<title>[^<]*<\/title>/, `<title>${id} · ${titre} · paysage 844 × 390</title>`).replace('</style></head>', CSS + css + '\n</style></head>')
  + `<div class="en-h ${id}" style="height:${h}px" data-entete="${id}">\n${inner}\n</div>\n` + TAIL;
// 16.11 soir : aides des corrections (l1, l5 seulement ; l2 à l4 inchangées)
const MENU = `<button type="button" class="en-ib" data-booster="reglages" aria-haspopup="menu" aria-label="Réglages : trier les rangées ; hypothèses (caisse 4 180, +120 par semaine, présence 2 j, exemple)">${ic('reglage')}</button>`;
const semaines = (y) => DATES.map((d, k) => `<span class="en-wk${k ? '' : ' now'}" aria-hidden="true" style="left:${140 + 53 * k}px;top:${y}px">${S(k)}</span>`).join('');
const CSS2 = `.en-moband{position:absolute;height:16px;background:color-mix(in srgb,var(--s2) 80%,transparent);border-radius:0 0 6px 6px}
.en-band2{border-top:1px solid var(--line2)}
.en-wk{position:absolute;width:53px;text-align:center;font-variant-numeric:tabular-nums;font-size:14px;line-height:16px;color:var(--mut);white-space:nowrap}.en-wk.now{color:var(--fin);font-weight:700}`;
const V = {};
// ───────────── en2 · paysage s1…s4 sur l5 (16.11 soir) ─────────────
// « Plus de place au graph et plus d'info sur ces mouvements, moins d'info sur le reste » ; « Graph trop petit donné date trop présente. Mais l'idée est bonne ».
// Base : l5 (en/l5.html). Seul l'en-tête change ; tout le code après <div class="cd-frw"> est celui de cd1-paysage (= l5), octet pour octet.
import { createRequire } from 'node:module';
const reqP = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = reqP('puppeteer-core');
const QD = JSON.parse(fs.readFileSync(path.join(EN, '..', 'en', 'q-data.json'), 'utf8'));
const NOM = (k) => QD.MV.find((m) => m.r === k + 1).n; // noms entiers, données q
const EV = [...ENT, ...SOR].map((e) => ({ ...e, nom: NOM(e.k) })).sort((a, b) => a.k - b.k);
const lbl = (e) => `<span class="s-n">${e.nom}</span> <b class="m">${fmt(e.v)}</b>`;
const SCSS = `
.s-n{color:var(--ink)}
.s-fh{position:absolute}
.s-c{position:absolute;top:0;width:53px;height:100%;display:flex;align-items:center;justify-content:center;gap:3px;font-variant-numeric:tabular-nums;font-size:14px;line-height:17px;font-weight:700;white-space:nowrap}
.s-c.up{color:var(--ok)}.s-c.dn{color:var(--bad)}.s-c.now{background:color-mix(in srgb,var(--fin) 10%,transparent);border-radius:5px}
.s-c .ico{width:15px;height:15px;stroke-width:2.2}
.s-hd{position:absolute;font-size:14px;line-height:17px;color:var(--fin);font-weight:700;white-space:nowrap;text-align:right}
.s-hd small{font-size:14px;color:var(--mut);font-weight:400}
.s-mo{position:absolute;font-size:14px;line-height:16px;color:var(--mut);white-space:nowrap;padding-left:3px;border-left:1px solid var(--line2)}
.s-ov{position:absolute;left:0;top:0;overflow:visible;pointer-events:none}
.s-ov path{pointer-events:visibleStroke}
`;
// mesure des largeurs réelles (police de la page)
async function mesure(list) {
  const f = path.join(L, '_m.html');
  fs.writeFileSync(f, HEAD.replace('</style></head>', CSS + CSS2 + SCSS + '\n</style></head>') + `<div class="en-h" style="height:40px">${list.map((h, i) => `<span id="m${i}" style="position:absolute;left:0;top:0;white-space:nowrap" class="${h[0]}">${h[1]}</span>`).join('')}</div></body></html>`);
  const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await nav.newPage(); await p.goto('file:///' + f.split(path.sep).join('/')); await p.evaluate(() => document.fonts.ready);
  const w = await p.evaluate((n) => [...Array(n)].map((_, i) => Math.ceil(document.getElementById('m' + i).getBoundingClientRect().width)), list.length);
  await nav.close(); return w;
}

// courbe : Y relatif au svg ; traits marqués (tr, hz, mk) pour le contrôle texte × trait
function plotS(W, PH, o = {}) {
  const t = o.t ?? 3, b = o.b ?? 3, yMax = o.yMax ?? 7300, wk = W / N;
  const Y = (v) => +(t + (1 - Math.max(v, 0) / yMax) * (PH - t - b)).toFixed(1), X = (k) => +((k + 0.5) * wk).toFixed(1);
  const stp = (A) => A.map((v, k) => `${k ? 'L' : 'M'}${(k * wk).toFixed(1)} ${Y(v)}L${((k + 1) * wk).toFixed(1)} ${Y(v)}`).join('');
  const back = (A) => A.map((v, k) => [k, v]).reverse().map(([k, v]) => `L${((k + 1) * wk).toFixed(1)} ${Y(v)}L${(k * wk).toFixed(1)} ${Y(v)}`).join('');
  let s = `<svg class="en-svg" width="${W}" height="${PH}" viewBox="0 0 ${W} ${PH}" aria-hidden="true"><defs><pattern id="sh" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="2.2" height="6" fill="var(--fin)" opacity=".45"></rect></pattern></defs>`;
  if (o.under) s += o.under({ X, Y, wk });
  s += `<path pointer-events="none" d="${stp(LIB)}L${W} ${Y(0)}L0 ${Y(0)}Z" fill="var(--area)"/>`;
  if (o.grey !== false) s += `<path class="hz" d="${stp(CAI)}${back(LIB)}Z" fill="url(#sh)"/><path class="tr" d="${stp(CAI)}" fill="none" stroke="var(--mut)" stroke-width="1.3" stroke-dasharray="3 2"/>`;
  s += `<line class="tr" x1="0" x2="${W}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--line2)" stroke-width="1.5"/>`;
  s += `<path class="tr" d="${stp(LIB)}" fill="none" stroke="var(--fin)" stroke-width="2.5" stroke-linejoin="round"/>`;
  s += (o.extra ? o.extra({ X, Y, wk }) : '') + '</svg>';
  return { s, X, Y, wk, W, PH };
}
const mkE = (P, k) => `<path class="mk" d="M${P.X(k)} ${P.Y(LIB[k]) - 2}l-4 -6h8z" fill="var(--ok)"/>`;
const mkS = (P, k) => `<path class="mk" d="M${P.X(k)} ${P.Y(CAI[k]) + 2}l-4 6h8z" fill="var(--bad)"/>`;
const monthsS = (x0, wk, y, txt = (t) => t) => MOIS.map(([k, t]) => `<span class="s-mo" style="left:${(x0 + k * wk).toFixed(1)}px;top:${y}px">${txt(t)}</span>`).join('');
const lensS = (x0, wk, y0, y1) => `<svg class="en-svg" style="left:0;top:${y0}px" width="820" height="${y1 - y0}" aria-hidden="true" pointer-events="none"><path d="M${x0} 0L${(x0 + 12 * wk).toFixed(1)} 0L776 ${y1 - y0}L140 ${y1 - y0}Z" fill="color-mix(in srgb,var(--fin) 7%,transparent)"/></svg>`;
const bande = (y, h, cell) => `<div class="s-fh" data-bande-semaines style="left:140px;top:${y}px;width:636px;height:${h}px">${DLT.slice(0, 12).map((d, k) => `<span class="s-c ${d >= 0 ? 'up' : 'dn'}${k ? '' : ' now'}" role="button" data-sem="${S(k)}" aria-label="${S(k)}, semaine du ${DATES[k]} : ${fmt(d)} sur la semaine, libre en fin ${fr(LIB[k])}" style="left:${53 * k}px">${cell(d, k)}</span>`).join('')}</div>`;
const hdS = (y, txt) => `<div class="s-hd" style="right:${820 - 134}px;top:${y}px">${txt}</div>`;
const ov = (h, paths) => `<svg class="s-ov" width="820" height="${h}" aria-hidden="true">${paths}</svg>`;
const ld = (x1, y1, x2, y2, c) => `<path class="ld" d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="var(--${c})" stroke-width="1.2" stroke-dasharray="1.5 2" fill="none"/>`;

// placement dans le ciel de la courbe : boîte entière au-dessus des deux lignes, hors bords de fenêtre, hors autres étiquettes
function ciel(P, x0, py, items, o) {
  const placed = o.placed || [], out = [], wk = P.wk;
  const kk = (k) => Math.min(N - 1, Math.max(0, k));
  const topAt = (k) => py + Math.min(P.Y(CAI[kk(k)]), P.Y(LIB[kk(k)]));
  for (const it of items) {
    const xa = x0 + P.X(it.k), w = it.w; let best = null;
    for (let y = o.yMin; y <= o.yMax; y += 2) for (let l = Math.max(x0 + 2, xa - w - 200); l <= Math.min(o.xMax - w, xa + 200); l += 3) {
      const r = l + w, bb = { l, r, t: y - 1, b: y + 17 };
      let ok = true;
      for (let k = Math.floor((l - x0) / wk) - 1; k <= Math.floor((r - x0) / wk) + 1 && ok; k++) {
        const kx0 = x0 + k * wk, kx1 = kx0 + wk; if (kx1 < l - 3 || kx0 > r + 3) continue;
        const lim = EV.some((e) => e.k === k && e.v > 0) ? Math.min(topAt(k), py + P.Y(LIB[kk(k)]) - 10) : topAt(k); if (bb.b + 2 > lim) ok = false;
      }
      if (!ok) continue;
      if (o.win && ((l < o.win[1] + 5 && r > o.win[1] - 5) || (l < o.win[0] + 5 && r > o.win[0] - 5))) continue;
      if ((o.obst || []).some((q) => l < q.r + 6 && q.l < r + 6 && bb.t < q.b && q.t < bb.b)) continue;
      if (placed.some((q) => l < q.r + 10 && q.l < r + 10 && bb.t < q.b + 1 && q.t < bb.b + 1)) continue;
      const inside = xa >= l + 6 && xa <= r - 6;
      const cost = (inside ? 0 : 30) + Math.abs((l + r) / 2 - xa) * 0.25 + (topAt(it.k) - bb.b) * 0.4;
      if (!best || cost < best.cost) best = { l, r, y, bb, cost, inside, xa };
    }
    if (!best) { console.log('ciel : pas de place pour', it.nom); out.push(null); continue; }
    placed.push(best.bb); out.push(best);
  }
  return out;
}
// rangée sous la courbe : chaque étiquette au plus près de son repère, sans chevauchement
function rangee(items, xMin, xMax, gap = 14) {
  const pos = items.map((it) => ({ ...it, l: it.xa - it.w / 2 }));
  for (let i = 0; i < pos.length; i++) pos[i].l = Math.max(pos[i].l, i ? pos[i - 1].l + pos[i - 1].w + gap : xMin);
  for (let i = pos.length - 1; i >= 0; i--) { const lim = i < pos.length - 1 ? pos[i + 1].l - gap : xMax; if (pos[i].l + pos[i].w > lim) pos[i].l = lim - pos[i].w; }
  return pos.map((p) => ({ ...p, r: p.l + p.w }));
}

// meilleur ordre de placement : le plus d'étiquettes placées, puis le moindre coût
function cielBest(P, x0, py, items, o) {
  const perms = (a) => (a.length < 2 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((r) => [x, ...r])));
  let best = null; const log = console.log; console.log = () => {};
  for (const pm of perms(items)) { const res = ciel(P, x0, py, pm, { ...o, placed: [] }); const n = res.filter(Boolean).length, c = res.reduce((s, r) => s + (r ? r.cost : 0), 0);
    if (!best || n > best.n || (n === best.n && c < best.c)) best = { n, c, map: new Map(pm.map((it, i) => [it, res[i]])) }; }
  console.log = log;
  // repli : sans place pour le nom entier, le montant seul (le nom au toucher)
  const ok = [...best.map.values()].filter(Boolean).map((r) => r.bb);
  for (const it of items) if (!best.map.get(it)) { it.short = true; const r = ciel(P, x0, py, [{ ...it, w: it.wa }], { ...o, placed: ok })[0]; best.map.set(it, r); console.log('ciel :', it.nom, r ? 'montant seul' : 'AUCUNE PLACE'); }
  return items.map((it) => best.map.get(it));
}

// ───────────── les quatre versions ─────────────
const H = 165; // en-tête de l5 : plafond
const ICONS = { l: 790, r: 820, t: 0, b: 92 };
const S3TXT = `<span class="s3-q">Creux de S24 :</span> <span class="s-n">Hotte</span> <b class="m">−900</b> · <span class="s-n">Six fûts inox</span> <b class="m">−1 080</b> · <span class="s-n">Embouteilleuse</span> <b class="m">−2 800</b> · <i class="s3-h"></i><span class="s-n">Frigo</span> <b class="s3-f">1 140</b> mis de côté`;
const S4TXT = `<b class="s4-w">S24</b> <span class="s-n">au plus serré :</span> <b class="s4-k">113</b> · <span class="s-n">Hotte</span> <b class="m">−900</b> · <span class="s-n">Six fûts inox</span> <b class="m">−1 080</b> · <span class="s-n">Embouteilleuse</span> <b class="m">−2 800</b>`;
const WM = await mesure([
  ...EV.map((e) => [`en-lb ${e.v > 0 ? 'up' : 'dn'}`, lbl(e)]),
  ...EV.map((e) => [`en-lb ${e.v > 0 ? 'up' : 'dn'}`, `<b class="m">${fmt(e.v)}</b>`]),
  ['en-lb dn', S3TXT], ['en-lb dn', S4TXT], ...MOIS.map(([, t]) => ['s-mo', t]),
]);
EV.forEach((e, i) => { e.w = WM[i]; e.wa = WM[EV.length + i]; });
const W3 = WM[2 * EV.length], W4 = WM[2 * EV.length + 1], WMO = WM.slice(2 * EV.length + 2);
const ariaS = (e) => `${e.nom} ${fmt(e.v)}, ${S(e.k)}${e.v < 0 ? ' (payé)' : ''}`;
const LEFT = (py, fy) => `${K113('left:0;top:2px')}
<div class="en-t" style="left:0;top:36px">à dépenser · ${S24}</div>
${RET('left:0;top:60px')}
${row(`left:0;top:${py}px`, PER)}${row(`left:0;top:${fy}px`, FIL)}
${row('right:0;top:0;flex-direction:column', QUIT + TRI + HYP)}`;
const skyLabels = (P, x0, py, list, o) => {
  const pl = cielBest(P, x0, py, list, o); let html = '', lds = '';
  list.forEach((e, i) => { const b = pl[i]; if (!b) return; const short = e.short;
    html += lab('up', b.l, b.y, short ? `<b class="m">${fmt(e.v)}</b>` : lbl(e), 'l', ariaS(e));
    const xs = Math.min(Math.max(b.xa, b.l + 4), b.r - 4); lds += ld(xs, b.y + 17, b.xa, py + P.Y(LIB[e.k]) - 9, 'ok'); });
  return { html, lds, boxes: pl };
};
const exitRow = (P, x0, py, ry, list) => {
  const pos = rangee(list.map((e) => ({ ...e, xa: x0 + P.X(e.k) })), x0, 788); let html = '', lds = '';
  for (const p of pos) { html += lab('dn', p.l, ry, lbl(p), 'l', ariaS(p)); lds += ld(p.xa, py + P.Y(CAI[p.k]) + 9, Math.min(Math.max(p.xa, p.l + 4), p.r - 4), ry, 'bad'); }
  return { html, lds };
};

// ── s1 « Rives » : la courbe double ; entrées nommées dans le ciel de la courbe, sorties nommées en rangée dessous, chacune reliée à sa marche ──
{
  const x0 = 140, W = 640, py = 17, PH = 112, ry = 131, by = 148, bh = 17;
  const P = plotS(W, PH, { t: 3, b: 7, extra: (q) => EV.map((e) => (e.v > 0 ? mkE(q, e.k) : mkS(q, e.k))).join('') });
  const wr = x0 + 12 * P.wk + 2;
  const E1 = (k) => EV.find((e) => e.k === k), mT = (k) => py + P.Y(LIB[k]) - 9, xa = (k) => x0 + P.X(k);
  const man = [
    { k: 3, short: true, l: xa(3) - E1(3).wa / 2, y: 22, ld: null },
    { k: 22, l: 296, y: 18, ld: [xa(22), 36] },
    { k: 32, l: 616 - E1(32).w, y: 18, ld: [488, 36] },
    { k: 37, l: 616 - E1(37).w, y: 39, ld: [xa(37), 57] },
    { k: 39, l: 656, y: 18, ld: [653, 30] },
  ];
  const sk = { html: '', lds: '' };
  for (const m of man) { const e = E1(m.k); sk.html += lab('up', m.l, m.y, m.short ? `<b class="m">${fmt(e.v)}</b>` : lbl(e), 'l', ariaS(e)); if (m.ld) sk.lds += ld(m.ld[0], m.ld[1], xa(m.k) + (m.k === 39 ? 3 : 0), mT(m.k), 'ok'); }
  const ex = exitRow(P, x0, py, ry, EV.filter((e) => e.v < 0));
  const inner = `<div style="position:absolute;left:${x0}px;top:${py}px">${P.s}</div>${lensS(x0, P.wk, py + PH, by)}${win(P, x0, py, PH)}${dip(P, x0, py)}
${monthsS(x0, P.wk, 0)}${sk.html}${ex.html}${ov(H, sk.lds + ex.lds)}
${LEFT(92, 119)}
${hdS(by, '<small>dès</small> S47')}${bande(by, bh, (d) => fmt(d))}`;
  V.s1 = { titre: 'Rives', h: H, inner, css: '', idee: 'Rives : courbe deux fois plus haute ; chaque entrée nommée en entier dans le ciel de la courbe, au-dessus de sa marche ; chaque sortie nommée en entier sur une rangée dessous, reliée à sa marche ; mois en haut ; la bande des semaines tient en une ligne de mouvements.' };
}

// ── s2 « Relevé » : courbe haute à gauche, relevé des 8 gros mouvements après la fenêtre à droite, dans l'ordre du temps ──
{
  const x0 = 140, W = 416, py = 0, PH = 124, my = 128, by = 146, bh = 19, lx = 566;
  const items = EV.filter((e) => e.k >= 12);
  const P = plotS(W, PH, { t: 4, b: 7, extra: (q) => items.map((e) => (e.v > 0 ? mkE(q, e.k) : mkS(q, e.k))).join('') });
  const rows = items.map((e) => `<div class="s2-r ${e.v > 0 ? 'up' : 'dn'}" role="button" aria-label="${ariaS(e)}"><span class="w">${S(e.k)}</span><span class="s-n">${e.nom}</span><b class="m">${fmt(e.v)}</b></div>`).join('');
  // mois : sans le point si deux étiquettes se touchent à cette échelle
  let lastR = -1, mo = '';
  MOIS.forEach(([k, t], i) => { const l = x0 + k * P.wk; if (l < lastR + 2 || l + WMO[i] > lx - 4) return; mo += `<span class="s-mo" style="left:${l.toFixed(1)}px;top:${my}px">${t.replace('.', '')}</span>`; lastR = l + WMO[i] - 3; });
  const bar = (d) => { const h = Math.max(2, Math.min(7, (Math.abs(d) / 988) * 7)); return `<svg width="5" height="16" aria-hidden="true"><rect x="0" y="${d >= 0 ? 8 - h : 8}" width="5" height="${h}" rx="1" fill="currentColor"/><line x1="0" x2="5" y1="8" y2="8" stroke="var(--line2)"/></svg>`; };
  const inner = `<div style="position:absolute;left:${x0}px;top:${py}px">${P.s}</div>${lensS(x0, P.wk, py + PH, by)}${win(P, x0, py, PH)}${dip(P, x0, py)}
${mo}<div class="s2-lg" style="left:${lx}px;top:0" aria-label="Les 8 gros mouvements après la fenêtre, dans l'ordre">${rows}</div>
${LEFT(92, 119)}
${hdS(by + 1, '<small>dès</small> S47')}${bande(by, bh, (d) => fmt(d))}`;
  V.s2 = { titre: 'Relevé', h: H, inner, css: `.s2-lg{position:absolute;width:222px;padding-left:9px;border-left:1px solid var(--line2)}
.s2-r{display:grid;grid-template-columns:34px 1fr auto;align-items:center;height:17px;font-size:14px;line-height:17px;white-space:nowrap}
.s2-r .w{color:var(--mut);font-variant-numeric:tabular-nums}.s2-r .m{font-weight:700;font-variant-numeric:tabular-nums;padding-left:8px}
.s2-r.up .m{color:var(--ok)}.s2-r.dn .m{color:var(--bad)}`, idee: 'Relevé : courbe haute (124 px de svg) sans rien d\'écrit dessus, seulement les marches ▲▼ ; à droite, le relevé des 8 gros mouvements après la fenêtre, dans l\'ordre (semaine, nom entier, montant) ; la bande : mouvement de chaque semaine et sa barrette.' };
}

// ── s3 « Le creux raconté » : la zone qui creuse (S13 → S24) teintée sur la courbe, et sa phrase dessous ; entrées dans le ciel ──
{
  const x0 = 140, W = 640, py = 17, PH = 108, ry = 129, by = 147, bh = 18;
  const zone = (q) => { const a = 19 * q.wk, b = 31 * q.wk; return `<rect x="${a.toFixed(1)}" y="0" width="${(b - a).toFixed(1)}" height="${PH}" fill="color-mix(in srgb,var(--bad) 9%,transparent)"/><path class="tr" d="M${a.toFixed(1)} ${PH}V0.8H${b.toFixed(1)}V${PH}" fill="none" stroke="var(--bad)" stroke-width="1.5" opacity=".7"/><line class="tr" x1="${q.X(30)}" x2="${q.X(30)}" y1="1" y2="${q.Y(113) - 8}" stroke="var(--bad)" stroke-width="1.2" stroke-dasharray="2 2"/>`; };
  const P = plotS(W, PH, { t: 4, b: 7, under: zone, extra: (q) => EV.map((e) => (e.v > 0 ? mkE(q, e.k) : mkS(q, e.k))).join('') });
  const za = x0 + 19 * P.wk, zb = x0 + 31 * P.wk, wr = x0 + 12 * P.wk + 2;
  const ent = EV.filter((e) => e.v > 0).sort((a, b) => b.v - a.v);
  const sk = skyLabels(P, x0, py, ent.map((e) => ({ ...e, w: e.wa, short: true })), { yMin: 19, yMax: 110, xMax: 788, win: [138, wr], obst: [ICONS, { l: za - 4, r: zb + 4, t: py - 2, b: py + 4 }, { l: za - 3, r: za + 3, t: py, b: py + PH }, { l: zb - 3, r: zb + 3, t: py, b: py + PH }] });
  const cl = Math.min(Math.max((za + zb) / 2 - W3 / 2, x0), 788 - W3);
  const inner = `<div style="position:absolute;left:${x0}px;top:${py}px">${P.s}</div>${lensS(x0, P.wk, py + PH, by)}${win(P, x0, py, PH)}${dip(P, x0, py)}
${monthsS(x0, P.wk, 0)}${sk.html}${ov(H, sk.lds)}
<span class="en-lb dn s3-cs" role="button" style="left:${cl.toFixed(1)}px;top:${ry}px" aria-label="Pourquoi le creux de S24 : hotte −900 (S13), six fûts inox −1 080 (S18), embouteilleuse −2 800 (S22) payés ; frigo 1 140 mis de côté">${S3TXT}</span>
${LEFT(92, 119)}
${hdS(by, '<small>dès</small> S47')}${bande(by, bh, (d, k) => { const ic2 = { 3: 'k11star', 5: 'k17bout', 7: 'k17cart' }[k]; return (ic2 ? ic(ic2) : '') + fmt(d); })}`;
  V.s3 = { titre: 'Le creux raconté', h: H, inner, css: `.s3-cs .m{color:var(--bad)}.s3-q{color:var(--bad);font-weight:700}.s3-f{color:var(--fin);font-weight:700;font-variant-numeric:tabular-nums}
.s3 .s-c{gap:1px}.s3 .s-c .ico{width:14px;height:14px}
.s3-h{display:inline-block;width:12px;height:12px;margin-right:3px;vertical-align:-1px;border:1px solid var(--fin);background:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fin) 55%,transparent) 0 2px,transparent 2px 5px)}`, idee: 'Le creux raconté : la zone S13 → S24 teintée en rouge sur la courbe, et sous elle sa phrase, noms entiers (Hotte −900 · Six fûts inox −1 080 · Embouteilleuse −2 800 · Frigo 1 140 mis de côté) ; entrées nommées dans le ciel ; la bande dit aussi le genre du mouvement (étoile, bouteille, chariot).' };
}

// ── s4 « Curseur » : la courbe la plus haute, rien d'écrit dessus ; un curseur posé sur S24 lit en clair la semaine et ce qui la creuse ──
{
  const x0 = 140, W = 640, py = 21, PH = 104, my = 128, by = 146, bh = 19;
  const cur = (q) => `<rect x="${(30 * q.wk).toFixed(1)}" y="0" width="${q.wk.toFixed(1)}" height="${PH}" fill="color-mix(in srgb,var(--fin) 13%,transparent)"/><line class="tr" x1="${q.X(30)}" x2="${q.X(30)}" y1="0" y2="${q.Y(0)}" stroke="var(--fin)" stroke-width="1.5"/>`;
  const P = plotS(W, PH, { t: 3, b: 7, under: cur, extra: (q) => EV.map((e) => (e.v > 0 ? mkE(q, e.k) : mkS(q, e.k))).join('') });
  const cx = x0 + P.X(30), rl = Math.min(Math.max(cx - W4 / 2, x0), 788 - W4);
  const inner = `<div style="position:absolute;left:${x0}px;top:${py}px">${P.s}</div>${lensS(x0, P.wk, py + PH, by)}${win(P, x0, py, PH)}${dip(P, x0, py)}
<span class="en-lb dn s4-rd" role="button" style="left:${rl.toFixed(1)}px;top:0" aria-label="Curseur sur S24 (7 juin) : 113 au plus serré ; payés : hotte −900, six fûts inox −1 080, embouteilleuse −2 800. Glisser le doigt sur la courbe pour lire une autre semaine">${S4TXT}</span>
<i class="s4-kn" style="left:${(cx - 6).toFixed(1)}px;top:${py - 4}px"></i>
${monthsS(x0, P.wk, my)}
${LEFT(92, 119)}
${hdS(by + 1, '<small>dès</small> S47')}${bande(by, bh, (d) => fmt(d))}`;
  V.s4 = { titre: 'Curseur', h: H, inner, css: `.s4-rd .m{color:var(--bad)}.s4-w{color:var(--fin)}.s4-k{color:var(--fin);font-variant-numeric:tabular-nums}
.s4-rd{padding:0 6px;border-radius:9px;background:var(--finbg);line-height:18px}
.s4-kn{position:absolute;width:12px;height:8px;border-radius:0 0 6px 6px;background:var(--fin)}`, idee: 'Curseur : la courbe la plus haute, rien d\'écrit dessus, seulement les marches ▲▼ ; un curseur posé sur S24 (la semaine au plus serré) lit en clair, au-dessus, ce qui la creuse, noms entiers ; au doigt, il glisse et lit toute autre semaine.' };
}

for (const [id, v] of Object.entries(V)) fs.writeFileSync(path.join(EN, id + '.html'), page(id, v.titre, v.h, v.inner, SCSS + v.css));
fs.writeFileSync(path.join(L, 'idees.json'), JSON.stringify(Object.fromEntries(Object.entries(V).map(([id, v]) => [id, { titre: v.titre, h: v.h, idee: v.idee }])), null, 1));
console.log('largeurs', EV.map((e) => e.nom + ' ' + e.w).join(', '), '| W3', W3, '| W4', W4);
console.log('écrit', Object.keys(V).join(' '));
