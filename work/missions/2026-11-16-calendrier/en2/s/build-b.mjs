// node en2/s/build-b.mjs : passe b, s1b et s3b (head.mjs + body.mjs + variants-b.mjs). Base l5 (en/l/build.mjs).
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
// ───────────── passe b (critique du 16.11 soir) : s1b « Rives » et s3b « Le creux raconté » corrigés ─────────────
// s1b : renvois tous verticaux (chaque étiquette posée sur sa colonne) ; « 1 140 mis de côté » avec sa hachure ; mois descendus du bord haut.
// s3b : entrées nommées en entier comme s1b ; chariot décollé du −460 ; zone du creux sans traits qui croisent les noms.
// Les deux : hachure éclaircie en cave.
const H = 165; // en-tête de l5 : plafond
const ICONS = { l: 790, r: 820, t: 0, b: 92 };
const LEGH = `<i class="s3-h"></i><b class="s3-f">1 140</b> <span class="s-n">mis de côté</span>`;
const S3TXT = `<span class="s3-q">Creux de S24 :</span> <span class="s-n">Hotte</span> <b class="m">−900</b> · <span class="s-n">Six fûts inox</span> <b class="m">−1 080</b> · <span class="s-n">Embouteilleuse</span> <b class="m">−2 800</b> · <i class="s3-h"></i><span class="s-n">Frigo</span> <b class="s3-f">1 140</b> mis de côté`;
const WM = await mesure([
  ...EV.map((e) => [`en-lb ${e.v > 0 ? 'up' : 'dn'}`, lbl(e)]),
  ...EV.map((e) => [`en-lb ${e.v > 0 ? 'up' : 'dn'}`, `<b class="m">${fmt(e.v)}</b>`]),
  ['en-lb dn', S3TXT], ['en-lb', LEGH],
]);
EV.forEach((e, i) => { e.w = WM[i]; e.wa = WM[EV.length + i]; });
const W3 = WM[2 * EV.length], WLEG = WM[2 * EV.length + 1];
const ariaS = (e) => `${e.nom} ${fmt(e.v)}, ${S(e.k)}${e.v < 0 ? ' (payé)' : ''}`;
const LEFT = (py, fy) => `${K113('left:0;top:2px')}
<div class="en-t" style="left:0;top:36px">à dépenser · ${S24}</div>
${RET('left:0;top:60px')}
${row(`left:0;top:${py}px`, PER)}${row(`left:0;top:${fy}px`, FIL)}
${row('right:0;top:0;flex-direction:column', QUIT + TRI + HYP)}`;
const E1 = (k) => EV.find((e) => e.k === k);
const CSSB = `[data-theme="cave"] .en-svg pattern rect{opacity:.95}
[data-theme="cave"] .s3-h{background:repeating-linear-gradient(45deg,var(--fin) 0 2px,transparent 2px 5px)}
.s3-f{color:var(--fin);font-weight:700;font-variant-numeric:tabular-nums}
.s3-h{display:inline-block;width:12px;height:12px;margin-right:4px;vertical-align:-1px;border:1px solid var(--fin);background:repeating-linear-gradient(45deg,color-mix(in srgb,var(--fin) 55%,transparent) 0 2px,transparent 2px 5px)}`;

// géométrie commune : mois à 4 px du bord, courbe de 22 à 126 (bas de la fenêtre au-dessus de la rangée)
const x0 = 140, W = 640, py = 22, PH = 104;
const yLib = (P, k) => py + P.Y(LIB[k]), yCai = (P, k) => py + P.Y(CAI[k]);
// entrées : rangée A (y 23) et B (y 43), chaque nom posé sur sa colonne ; fil vertical du bas de l'étiquette au repère ▼
function entrees(P) {
  const xa = (k) => x0 + P.X(k);
  const wr = x0 + 12 * P.wk + 2;
  const pl = [
    { k: 3, short: true, l: xa(3) - E1(3).wa / 2, y: 27 },                   // Noël : montant seul (nommé dans la frise dessous)
    { k: 22, l: Math.max(wr + 6, xa(22) - E1(22).w + 8), y: 23 },           // Marché de printemps
    { k: 37, l: Math.min(x0 + 39 * P.wk - 6 - E1(37).w, xa(37) - 6), y: 23 }, // Mariage, avant le pic du festival
    { k: 32, l: Math.max(xa(22) + 34, xa(32) - E1(32).w + 6), y: 43 },       // Fête de village, après le pic du marché
    { k: 39, l: x0 + 41 * P.wk + 6, y: 23, cote: true },                     // Festival : à droite de son pic, fil court
  ];
  let html = '', lds = ''; const box = [];
  for (const p of pl) { const e = E1(p.k), w = p.short ? e.wa : e.w, X = xa(p.k);
    html += lab('up', p.l, p.y, p.short ? `<b class="m">${fmt(e.v)}</b>` : lbl(e), 'l', ariaS(e));
    box.push({ l: p.l, r: p.l + w, t: p.y, b: p.y + 17, k: p.k });
    const yb = yLib(P, p.k) - 9;
    if (p.cote) lds += ld(p.l - 2, p.y + 9, X + 2, Math.min(yb, yCai(P, p.k + 1) - 2), 'ok');
    else if (!p.short && yb - (p.y + 18) > 3) lds += ld(X, p.y + 18, X, yb, 'ok'); }
  return { html, lds, box };
}
// sorties : chaque nom sur sa colonne, fil vertical ; dans la rangée du bas, ou sous le libre s'il n'y a pas la place
function sorties(P, ry, extra) {
  const xa = (k) => x0 + P.X(k), list = EV.filter((e) => e.v < 0);
  const fixes = extra ? [{ l: x0 + 6, r: x0 + 6 + WLEG }] : [];
  const opts = list.map((e) => { const X = xa(e.k), o = [];
    for (let l = Math.ceil(X - e.w + 6); l <= X - 6; l += 2) o.push({ e, l, r: l + e.w, y: ry, rang: true });
    // sous le libre : la boîte doit rester sous la ligne bleue de chaque semaine couverte et au-dessus du zéro
    for (let l = Math.ceil(X - e.w + 6); l <= X - 6; l += 2) { const k0 = Math.floor((l - x0) / P.wk), k1 = Math.floor((l + e.w - x0) / P.wk); let yl = -1e9;
      for (let k = k0; k <= k1; k++) yl = Math.max(yl, yLib(P, Math.max(0, Math.min(N - 1, k))));
      const y = Math.ceil(yl + 4); if (y + 17 <= py + P.Y(0) - 3) o.push({ e, l, r: l + e.w, y, rang: false }); }
    return o; });
  let best = null;
  (function rec(i, pris, cout) { if (i === opts.length) { if (!best || cout < best.cout) best = { cout, pris: pris.slice() }; return; }
    for (const o of opts[i]) { if ([...fixes.map((f) => ({ ...f, y: ry })), ...pris].some((p) => p.y === o.y && o.l < p.r + 12 && p.l < o.r + 12) || pris.some((p) => p.y !== o.y && o.l < p.r + 8 && p.l < o.r + 8 && Math.abs(p.y - o.y) < 19)) continue;
      // un fil vertical ne traverse pas une autre étiquette
      const X = xa(o.e.k), y0 = yCai(P, o.e.k) + 9; if (pris.some((p) => X > p.l - 2 && X < p.r + 2 && p.y > y0 && p.y < o.y) || pris.some((p) => { const Xp = xa(p.e.k), y0p = yCai(P, p.e.k) + 9; return Xp > o.l - 2 && Xp < o.r + 2 && o.y > y0p && o.y < p.y; })) continue;
      pris.push(o); rec(i + 1, pris, cout + (o.rang ? 0 : 3) + Math.abs((o.l + o.r) / 2 - X) * 0.05); pris.pop(); } })(0, [], 0);
  if (!best) throw new Error('sorties : pas de pose');
  let html = '', lds = '';
  for (const o of best.pris) { const X = xa(o.e.k), y0 = yCai(P, o.e.k) + 9; html += lab('dn', o.l, o.y, lbl(o.e), 'l', ariaS(o.e)); lds += ld(X, y0, X, o.y, 'bad'); }
  if (extra) html += `<span class="en-lb s1-leg" role="img" style="left:${x0 + 6}px;top:${ry}px" aria-label="Hachure : 1 140 mis de côté pour le frigo (Frigo −1 800, S35)">${LEGH}</span>`;
  return { html, lds, pose: best.pris.map((o) => `${o.e.nom} ${o.rang ? 'rangée' : 'sous le libre'}`) };
}

// ── s1b « Rives » ──
{
  const ry = 131, by = 148, bh = 17;
  const P = plotS(W, PH, { t: 3, b: 7, extra: (q) => EV.map((e) => (e.v > 0 ? mkE(q, e.k) : mkS(q, e.k))).join('') });
  const en = entrees(P), so = sorties(P, ry, true);
  const inner = `<div style="position:absolute;left:${x0}px;top:${py}px">${P.s}</div>${lensS(x0, P.wk, py + PH, by)}${win(P, x0, py, PH)}${dip(P, x0, py)}
${monthsS(x0, P.wk, 4)}${en.html}${so.html}${ov(H, en.lds + so.lds)}
${LEFT(92, 119)}
${hdS(by, '<small>dès</small> S47')}${bande(by, bh, (d) => fmt(d))}`;
  V.s1b = { titre: 'Rives, corrigé', h: H, inner, css: CSSB, idee: 'Rives corrigé : renvois verticaux courts, chaque nom sur sa colonne ; sorties dans la rangée du bas ou sous le libre ; « 1 140 mis de côté » avec sa hachure ; mois à 4 px du bord.', pose: so.pose };
}

// ── s3b « Le creux raconté » ──
{
  const ry = 130, by = 147, bh = 18;
  const zone = (q) => { const a = 19 * q.wk, b = 31 * q.wk; return `<rect x="${a.toFixed(1)}" y="0" width="${(b - a).toFixed(1)}" height="${PH}" fill="color-mix(in srgb,var(--bad) 10%,transparent)"/><rect x="${a.toFixed(1)}" y="${PH - 3}" width="${(b - a).toFixed(1)}" height="3" fill="var(--bad)" opacity=".7"/><line class="tr" x1="${q.X(30)}" x2="${q.X(30)}" y1="${62 - py}" y2="${q.Y(113) - 8}" stroke="var(--bad)" stroke-width="1.2" stroke-dasharray="2 2"/>`; };
  const P = plotS(W, PH, { t: 3, b: 7, under: zone, extra: (q) => EV.map((e) => (e.v > 0 ? mkE(q, e.k) : mkS(q, e.k))).join('') });
  const za = x0 + 19 * P.wk, zb = x0 + 31 * P.wk;
  const en = entrees(P);
  const cl = Math.min(Math.max((za + zb) / 2 - W3 / 2, x0), 788 - W3);
  const ICN = { 3: 'k11star', 5: 'k17bout', 7: 'k17cart' };
  const inner = `<div style="position:absolute;left:${x0}px;top:${py}px">${P.s}</div>${lensS(x0, P.wk, py + PH, by)}${win(P, x0, py, PH)}${dip(P, x0, py)}
${monthsS(x0, P.wk, 4)}${en.html}${ov(H, en.lds)}
<span class="en-lb dn s3-cs" role="button" style="left:${cl.toFixed(1)}px;top:${ry}px" aria-label="Pourquoi le creux de S24 : hotte −900 (S13), six fûts inox −1 080 (S18), embouteilleuse −2 800 (S22) payés ; frigo 1 140 mis de côté">${S3TXT}</span>
${LEFT(92, 119)}
${hdS(by, '<small>dès</small> S47')}${bande(by, bh, (d, k) => (ICN[k] ? ic(ICN[k]) : '') + fmt(d))}`;
  V.s3b = { titre: 'Le creux raconté, corrigé', h: H, inner, css: CSSB + `.s3-cs .m{color:var(--bad)}.s3-q{color:var(--bad);font-weight:700}
.s3b .s-c{gap:4px}.s3b .s-c .ico{width:14px;height:14px;flex:none}`, idee: 'Le creux raconté corrigé : entrées nommées en entier sur leur colonne (comme s1b) ; zone du creux teintée sans trait vertical ; chariot décollé du −460.' };
}

for (const [id, v] of Object.entries(V)) fs.writeFileSync(path.join(EN, id + '.html'), page(id, v.titre, v.h, v.inner, SCSS + v.css));
fs.writeFileSync(path.join(L, 'idees-b.json'), JSON.stringify(Object.fromEntries(Object.entries(V).map(([id, v]) => [id, { titre: v.titre, h: v.h, idee: v.idee, pose: v.pose }])), null, 1));
console.log('écrit', Object.keys(V).join(' '), '|', V.s1b.pose.join(', '));
