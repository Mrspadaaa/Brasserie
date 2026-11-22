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

// ── l1 « Rives » : ce qui entre au-dessus de la courbe, ce qui sort dessous, chacun relié à sa marche ──
// 16.11 soir (critique) : mariage nommé (festival sur une 2e rangée) ; mois sur une bande teintée, filet et 8 px avant les dates ;
// S47… au-dessus de chaque date ; ⇅ et réglages dans un seul menu.
{
  const x0 = 140, W = 640, py = 36, PH = 54, sy = py + PH + 3, my = sy + 18, fy = my + 24, wy = fy + 2, dy = wy + 16;
  const P = plot(W, PH, { grey: true, yMax: 7500, top: 3, bot: 6, extra: ({ X, Y }) =>
    ENT.map((e) => `<path d="M${X(e.k)} ${Y(LIB[e.k]) - 2}l-4 -6h8z" fill="var(--ok)"/>`).join('')
    + SOR.map((e) => `<path d="M${X(e.k)} ${Y(CAI[e.k]) + 2}l-4 6h8z" fill="var(--bad)"/>`).join('') });
  const X = (k) => x0 + P.X(k);
  const tkU = (k, t) => `<i class="en-tk up" style="left:${X(k)}px;top:${t}px;height:${(py + P.Y(LIB[k]) - 8 - t).toFixed(1)}px"></i>`;
  const tkD = (k) => `<i class="en-tk dn" style="left:${X(k)}px;top:${(py + P.Y(CAI[k]) + 9).toFixed(1)}px;height:${(sy - py - P.Y(CAI[k]) - 9).toFixed(1)}px"></i>`;
  const up = [[3, 'l', -4, 0], [22, 'r', 4, 0], [32, 'r', 4, 0], [37, 'l', -40, 0], [39, 'l', -4, 18]].map(([k, al, dx, t]) => tkU(k, t + 16) + lab('up', X(k) + dx, t, mv(E(k)), al, aria(E(k)))).join('');
  const dn = [[19, 'r', 4], [24, 'c', 0], [28, 'l', -4], [41, 'l', -4]].map(([k, al, dx]) => tkD(k) + lab('dn', X(k) + dx, sy, mv(E(k)), al, aria(E(k)))).join('');
  const inner = `${K113('left:0;top:2px')}
<div class="en-t" style="left:0;top:36px">à dépenser · ${S24}</div>
${RET('left:0;top:60px')}
${row('left:0;top:88px', FIL + MENU)}
${row('right:0;top:0', QUIT)}
<div style="position:absolute;left:${x0}px;top:${py}px">${P.s}</div>${win(P, x0, py, PH)}${dip(P, x0, py)}
${up}${dn}<div class="en-moband" style="left:${x0}px;top:${my}px;width:${W}px"></div>${months(P, x0, my)}
<div class="en-band en-band2" style="top:${fy}px;height:${dy + 18 - fy}px"></div>${row(`left:0;top:${fy + 5}px`, PER)}${semaines(wy)}${dates(dy)}`;
  V.l1 = { titre: 'Rives', h: dy + 18, inner, css: CSS2, idee: 'Rives : au-dessus de la courbe, ce qui entre (vert, montant et nom) ; dessous, ce qui sort (rouge). Chaque étiquette tombe en pointillé sur sa marche ; la caisse grise et le hachuré du mis de côté restent. Mois sur une bande teintée sous la courbe, S47… et la date sous un filet.' };
}

// ── l2 « Flux » : sous la courbe, la barre du mouvement net de chaque semaine de l'année ──
{
  const x0 = 140, W = 640, PH = 50, fy = PH + 2, FH = 40, mid = fy + 28, my = fy + FH + 1, by = my + 18, sc = 10 / 2500;
  const P = plot(W, PH, { grey: false, yMax: 6000, grid: [2000, 4000], top: 3, bot: 7 });
  const bars = DLT.map((d, k) => (Math.abs(d) < 100 ? '' : `<rect x="${(P.X(k) - 4).toFixed(1)}" y="${d >= 0 ? (12 - Math.max(2, Math.abs(d) * sc)).toFixed(1) : 12 + 0.5}" width="8" height="${Math.max(2, Math.abs(d) * sc).toFixed(1)}" rx="1.5" fill="var(--${d >= 0 ? 'ok' : 'bad'})"/>`)).join('');
  const fsvg = `<svg class="en-svg" style="left:${x0}px;top:${fy + 16}px" width="${W}" height="24" viewBox="0 0 ${W} 24" aria-hidden="true"><line x1="0" x2="${W}" y1="${12}" y2="${12}" stroke="var(--line2)" stroke-width="1"/>${bars}</svg>`;
  const X = (k) => x0 + P.X(k);
  const ups = [[3, 'c', 0, ''], [32, 'r', 8, ''], [37, 'r', 6, ''], [39, 'l', -6, '']].map(([k, al, dx, n]) =>
    lab('up', X(k) + dx, fy - 1, `<b class="m">${fmt(DLT[k])}</b>`, al, `${S(k)} : ${fmt(DLT[k])} sur la semaine${E(k) ? ', ' + E(k).l + ' ' + fmt(E(k).v) : ''}`)).join('');
  const brk = `<i class="l2-br" style="left:${(X(12) - 5).toFixed(1)}px;width:${(19 * P.wk + 10).toFixed(1)}px;top:${fy + 16}px"></i>`
    + lab('dn', X(21), fy - 1, `<b class="m">${fmt(LIB[30] - LIB[11])}</b> <span class="n">4 achats</span>`, 'c', 'De S6 à S24 : −4 385 ; hotte −900, six fûts −1 080, embouteilleuse −2 800 payés ; frigo −1 800 mis de côté');
  const leg = '';
  const inner = `${K113('left:0;top:2px')}
<div class="en-t" style="left:0;top:36px">à dépenser · ${S24}</div>
${RET('left:0;top:60px')}
${row('left:0;top:86px', FIL)}
${row('right:0;top:0;flex-direction:column', QUIT + TRI + HYP)}
<div style="position:absolute;left:${x0}px;top:0">${P.s}</div>${win(P, x0, 0, PH)}${dip(P, x0, 0)}${fsvg}${ups}${brk}${leg}
${months(P, x0, my)}
<div class="en-band" style="top:${by}px;height:26px"></div>${row(`left:0;top:${by}px`, PER)}${dates(by + 4)}`;
  V.l2 = { titre: 'Flux', h: by + 26, inner, css: `.l2-br{position:absolute;height:5px;border:1.5px solid var(--bad);border-bottom:0;border-radius:3px 3px 0 0}`, idee: 'Flux : sous la courbe, une barre par semaine (vert monte, rouge descend), le mouvement net de la caisse libre ; les plus fortes chiffrées ; une accolade rouge explique la descente S6 → S24.' };
}

// ── l3 « Le creux raconté » : courbe sur toute la largeur ; une phrase au-dessus du creux dit ce qui le creuse ──
{
  const W = 820, py = 38, PH = 70, my = py + PH + 1, by = my + 17;
  const P = plot(W, PH, { grey: false, yMax: 6400, grid: [3000], top: 3, bot: 2, extra: ({ X, Y }) =>
    ENT.map((e) => `<circle cx="${X(e.k)}" cy="${Y(LIB[e.k])}" r="3.5" fill="var(--ok)" stroke="var(--halo)" stroke-width="1.5"/>`).join('')
    + `<path d="M${X(19) - 2} ${Y(LIB[18]) + 4}L${X(28) + 6} ${Y(LIB[28]) + 4}" stroke="var(--bad)" stroke-width="2" stroke-dasharray="4 3" marker-end="url(#l3a)"/><defs><marker id="l3a" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="var(--bad)"/></marker></defs>` });
  const X = (k) => P.X(k), cx = X(30);
  const lead = `<i class="l3-ld" style="left:${cx}px;top:34px;height:${(py + P.Y(113) - 42).toFixed(1)}px"></i>`;
  const inner = `${K113('left:0;top:3px')}<div class="en-t" style="left:100px;top:9px">à dépenser</div>
${RET('left:190px;top:9px')}
${lab('fn c', cx, 0, 'S24 · 113 au plus serré', 'c', 'Au plus serré : 113 en S24 (7 juin)')}
${lab('dn c', cx, 17, `<span class="n">payés : hotte, fûts, embouteilleuse</span> <b class="m">−4 780</b>`, 'c', 'Payés de S13 à S22 : hotte −900, six fûts −1 080, embouteilleuse −2 800')}
${lead}
${row('right:0;top:0', PER + TRI + QUIT)}
<div style="position:absolute;left:0;top:${py}px">${P.s}</div>${win(P, 0, py, PH)}${dip(P, 0, py)}
${lab('up', X(32) + 6, py + P.Y(LIB[37]) - 20, mv(E(32)), 'l', aria(E(32)))}
${lab('up', X(39) + 6, py + P.Y(LIB[39]) - 19, mv(E(39)), 'l', aria(E(39)))}
${months(P, 0, my)}
<div class="en-band" style="top:${by}px;height:26px"></div>${row(`left:0;top:${by}px`, FIL + HYP)}${dates(by + 4)}`;
  V.l3 = { titre: 'Le creux raconté', h: by + 26, inner, css: `.en-h .en-lb.c{text-align:center}.l3-ld{position:absolute;width:0;border-left:1.2px dashed var(--fin)}`, idee: 'Le creux raconté : courbe sur toute la largeur, plus haute ; au-dessus du creux, sa cause en une ligne (« payés : hotte, fûts, embouteilleuse −4 780 ») reliée au point S24 ; seules les remontées chiffrées.' };
}

// ── l4 « Genres » : chaque mouvement porte le picto et la couleur de sa rangée ; le chiffre à dépenser à droite ──
{
  const W = 676, PH = 96, by = PH + 18;
  const P = plot(W, PH, { grey: true, yMax: 9000, top: 10, bot: 7 });
  // placement glouton : picto 22 × 22 et montant à côté, sans toucher les deux lignes ni un autre picto
  const yAt = (A, x) => P.Y(A[Math.min(N - 1, Math.max(0, Math.floor(x / P.wk)))]);
  const hit = (b) => { for (let x = b.l; x <= b.r; x += 3) for (const A of [LIB, CAI]) { const y = yAt(A, x); if (y > b.t - 1 && y < b.b + 1) return true; } return false; };
  const ovr = (a, b) => a.l < b.r + 3 && b.l < a.r + 3 && a.t < b.b + 2 && b.t < a.b + 2;
  const placed = [], out = [];
  const est = (t) => t.length * 7.8 + 2;
  for (const e of [...ENT.slice().sort((p, q) => q.v - p.v), ...SOR.slice().sort((p, q) => p.v - q.v)]) {
    const xs = e.k * P.wk, t = fmt(e.v), lw = est(t);
    const top2 = Math.min(P.Y(CAI[e.k]), P.Y(CAI[Math.max(0, e.k - 1)]));
    const ys = e.v > 0 ? [top2 - 14, top2 - 22, top2 - 30, P.Y(LIB[e.k]) + 15, P.Y(LIB[e.k]) + 26, P.Y(LIB[e.k]) + 38] : [P.Y(CAI[e.k]) + 14, P.Y(CAI[e.k - 1]) - 14, P.Y(CAI[e.k - 1]) - 26, P.Y(CAI[e.k]) + 30, P.Y(LIB[e.k]) + 15, (P.Y(CAI[e.k]) + P.Y(LIB[e.k])) / 2];
    let ok = null;
    for (const cy of ys) for (const dx of [6, -6, 18, -18, 30, -30, 42, -42, 54, -54]) for (const side of e.v > 0 ? ['r', 'l'] : ['l', 'r']) {
      const cx = xs + dx, pb = { l: cx - 11, r: cx + 11, t: cy - 11, b: cy + 11 };
      const lb = side === 'r' ? { l: cx + 13, r: cx + 13 + lw, t: cy - 8, b: cy + 8 } : { l: cx - 13 - lw, r: cx - 13, t: cy - 8, b: cy + 8 };
      if (ok) continue; const why = pb.t < 1 || pb.b > PH ? 'haut' : pb.l < 16 || lb.l < 16 || lb.r > W ? 'bord' : hit(pb) ? 'ligne-picto' : hit(lb) ? 'ligne-montant' : placed.some((q) => ovr(q, pb) || ovr(q, lb)) ? 'autre' : '';
      if (process.env.DBG === e.n) console.log(e.n, cy.toFixed(0), dx, side, why || 'OK');
      if (why) continue;
      ok = { cx, cy, side, pb, lb };
    }
    if (!ok) { console.log('l4 : pas de place pour', e.n); continue; }
    placed.push(ok.pb, ok.lb);
    out.push(`<button type="button" class="l4-p" style="--c:var(--e-${e.g});left:${(ok.cx - 11).toFixed(1)}px;top:${(ok.cy - 11).toFixed(1)}px" aria-label="${aria(e)}">${ic(e.i)}</button>`
      + lab(`${e.v > 0 ? 'up' : 'dn'} m`, ok.side === 'r' ? ok.cx + 13 : ok.cx - 13, +(ok.cy - 8).toFixed(1), t, ok.side === 'r' ? 'l' : 'r', aria(e))
      + `<i class="l4-ln" style="left:${xs.toFixed(1)}px;top:${Math.min(ok.cy, e.v > 0 ? P.Y(LIB[e.k]) : P.Y(CAI[e.k])).toFixed(1)}px;height:${Math.abs(ok.cy - (e.v > 0 ? P.Y(LIB[e.k]) : P.Y(CAI[e.k]))).toFixed(1)}px;border-color:var(--e-${e.g})"></i>`);
  }
  const inner = `<div style="position:absolute;left:0;top:0">${P.s}</div>${win(P, 0, 0, PH)}${out.join('')}${dip(P, 0, 0)}
${months(P, 0, PH + 1)}
${K113('left:690px;top:3px')}${row('right:0;top:0', QUIT)}
<div class="en-t" style="left:690px;top:36px">à dépenser · ${S24}</div>
${RET('left:690px;top:60px')}
${row('left:690px;top:86px', FIL)}
<div class="en-band" style="top:${by}px;height:26px"></div>${row(`left:0;top:${by}px`, PER + TRI)}${dates(by + 4)}${row(`right:0;top:${by}px`, HYP)}`;
  V.l4 = { titre: 'Genres', h: by + 26, inner, css: `.l4-p{position:absolute;z-index:1;width:22px;height:22px;border-radius:50%;background:var(--c);color:var(--bg);display:grid;place-items:center;box-shadow:0 0 0 2px var(--bg)}.l4-p .ico{width:14px;height:14px}.l4-ln{position:absolute;width:0;border-left:1.5px solid}`, idee: 'Genres : chaque mouvement est un picto rond à la couleur de sa rangée (fête rose, vente verte, achat bleu, travaux) posé sur sa marche, montant à côté ; le chiffre à dépenser passe à droite.' };
}

// ── l5 « Loupe » : l'année en haut ; la fenêtre s'ouvre en loupe sur le mouvement de chaque semaine affichée ──
// 16.11 soir (critique) : rangée des sorties de l1 sous la courbe ; mois sur une bande teintée ; mini-barres retirées
// (signe et couleur suffisent) ; S47… au-dessus de chaque date.
{
  const x0 = 140, W = 640, py = 18, PH = 50, sy = py + PH + 3, my = sy + 18, ly = my + 16, ry = ly + 8, wy = ry + 18, dy = wy + 16;
  const P = plot(W, PH, { grey: true, yMax: 7500, top: 3, bot: 7, extra: ({ X, Y }) => SOR.map((e) => `<path d="M${X(e.k)} ${Y(CAI[e.k]) + 2}l-4 6h8z" fill="var(--bad)"/>`).join('') });
  const X = (k) => x0 + P.X(k);
  const tk = (k) => `<i class="en-tk up" style="left:${X(k)}px;top:16px;height:${(py + P.Y(LIB[k]) - 3 - 16).toFixed(1)}px"></i>`;
  const tkD = (k) => `<i class="en-tk dn" style="left:${X(k)}px;top:${(py + P.Y(CAI[k]) + 9).toFixed(1)}px;height:${(sy - py - P.Y(CAI[k]) - 9).toFixed(1)}px"></i>`;
  const dn = [[19, 'r', 4], [24, 'c', 0], [28, 'l', -4], [41, 'l', -4]].map(([k, al, dx]) => tkD(k) + lab('dn', X(k) + dx, sy, mv(E(k)), al, aria(E(k)))).join('');
  const lens = `<svg class="en-svg" style="left:0;top:${py + PH}px" width="820" height="${ry - py - PH}" aria-hidden="true"><path d="M${x0} 0L${(x0 + 12 * P.wk).toFixed(1)} 0L776 ${ry - py - PH}L${x0} ${ry - py - PH}Z" fill="color-mix(in srgb,var(--fin) 8%,transparent)"/></svg>`;
  const cells = DLT.slice(0, 12).map((d, k) => `<span class="l5-mv ${d >= 0 ? 'up' : 'dn'}" role="button" data-sem="${S(k)}" aria-label="${S(k)} : ${fmt(d)} sur la semaine, libre en fin ${fr(LIB[k])}" style="left:${140 + 53 * k}px;top:${ry}px">${fmt(d)}</span>`).join('');
  const inner = `${K113('left:0;top:2px')}
<div class="en-t" style="left:0;top:36px">à dépenser · ${S24}</div>
${RET('left:0;top:60px')}
${row('right:0;top:0;flex-direction:column', QUIT + TRI + HYP)}
<div style="position:absolute;left:${x0}px;top:${py}px">${P.s}</div>${lens}${win(P, x0, py, PH)}${dip(P, x0, py)}
${tk(32)}${lab('up', X(32) - 4, 0, mv(E(32)), 'l', aria(E(32)))}
${tk(39)}${lab('up', X(39) - 4, 0, mv(E(39)), 'l', aria(E(39)))}
${dn}<div class="en-moband" style="left:${x0}px;top:${my}px;width:${W}px"></div>${months(P, x0, my)}${cells}
${row('left:0;top:92px', PER)}
<div class="en-band" style="top:${wy}px;height:${dy + 18 - wy}px"></div>${row(`left:0;top:${wy + 4}px`, FIL)}${semaines(wy)}${dates(dy)}`;
  V.l5 = { titre: 'Loupe', h: dy + 18, inner, css: CSS2 + `.l5-mv{position:absolute;width:53px;display:flex;align-items:center;justify-content:center;height:18px;font-variant-numeric:tabular-nums;font-size:14px;line-height:18px;font-weight:700}
.l5-mv.up{color:var(--ok)}.l5-mv.dn{color:var(--bad)}`, idee: 'Loupe : l\'année en haut, entrées nommées dessus, sorties de l1 dessous ; la fenêtre s\'évase vers la frise, et sous chaque colonne de semaine, son mouvement (+988, −460…).' };
}

for (const [id, v] of Object.entries(V)) fs.writeFileSync(path.join(EN, id + '.html'), page(id, v.titre, v.h, v.inner, v.css));
// témoin : l1 avec une étiquette à 13 px posée sur une autre ; le contrôle doit échouer
fs.mkdirSync(path.join(EN, 'cap'), { recursive: true });
fs.writeFileSync(path.join(EN, 'cap', 'l-temoin.html'), page('l1', 'témoin', V.l1.h, V.l1.inner + `<span class="en-lb up" style="left:190px;top:2px;font-size:13px">+1 180 Noël</span>`, ''));
fs.writeFileSync(path.join(L, 'idees.json'), JSON.stringify(Object.fromEntries(Object.entries(V).map(([id, v]) => [id, { titre: v.titre, h: v.h, idee: v.idee }])), null, 1));
console.log(Object.entries(V).map(([id, v]) => `${id} ${v.titre} h=${v.h}`).join(' | '));
