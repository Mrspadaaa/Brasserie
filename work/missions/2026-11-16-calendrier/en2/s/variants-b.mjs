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
