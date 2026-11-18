
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
