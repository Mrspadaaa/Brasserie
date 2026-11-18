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
