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
