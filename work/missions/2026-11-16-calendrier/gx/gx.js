// gx : gestes de la courbe sur g-d1 (16.11). Injecté par build.mjs dans une copie de paliers/g-d1.html.
// window.GXS = { fin, mut } (séries lues sur la courbe de g-d1) ; window.GXE = { v, e } (version, avant|apres).
(() => {
  if (location.hash === '#cave') document.documentElement.dataset.theme = 'cave';
  const { v, e } = window.GXE; const A = e === 'apres';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const MO = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const d0 = new Date(2026, 10, 16);
  const dt = (i) => { const d = new Date(d0); d.setDate(d.getDate() + 7 * i); return d; };
  const sem = (i) => { let w = 47 + i; if (w > 53) w -= 53; return w; };
  const dlab = (i) => { const d = dt(i); return d.getDate() + ' ' + MO[d.getMonth()]; };
  const mois0 = (i) => i === 0 || dt(i).getMonth() !== dt(i - 1).getMonth();
  const nb = (n) => Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sg = (n) => (n < 0 ? '−' : '+') + nb(n);
  const ns = (n) => (n < 0 ? '−' : '') + nb(n);

  // ---------- données : libre (fin) et caisse (mut), recalées sur les chiffres affichés de g-d1 ----------
  const orig = window.GXS, diff = orig.mut.map((m, i) => m - orig.fin[i]);
  const fin = orig.fin.slice();
  [4032, 4152, 4132, 5120, 5064, 5550].forEach((x, i) => (fin[i] = x));
  fin[29] = 313; fin[30] = 113; // S23, S24 (au plus serré : 113)
  [4505, 4885, 4885, 5113, 4713, 4631].forEach((x, k) => (fin[11 + k] = x)); // S5 à S10 (mouvements nommés)
  const mutOf = (f) => f.map((x, i) => x + diff[i]);
  const minIdx = (f) => f.reduce((b, x, i) => (x < f[b] ? i : b), 0);
  // mouvements nommés (somme = écart de la semaine)
  const MV = {
    3: [['evenement', 'Marché de Noël', 1180], ['charge', 'Houblons Suisse (facture)', -312], ['vente', 'Ventes de la semaine', 120]],
    19: [['achat', 'Malt de printemps', -540], ['charge', 'Loyer d’avril', -400], ['achat', 'Houblons (Brouwland)', -312], ['vente', 'Auberge du Lac, 2 fûts', 240], ['vente', 'Ventes de la semaine', 120]],
    28: [['charge', 'Loyer de juin', -400], ['brassage', 'Levures et houblons d’été', -381], ['vente', 'Ventes de la semaine', 120]],
    29: [['renovation', 'Sols : carrelage', -161], ['vente', 'Ventes de la semaine', 120]],
    30: [['renovation', 'Sols : colle et joints', -320], ['vente', 'Ventes de la semaine', 120]],
  };
  fin[28] = 354; fin[27] = 1015; fin[29] = fin[28] - 41; // cohérence S21 → S24
  const flux = (f, i) => f[i] - f[i - 1];

  // ---------- courbe ----------
  const W = 366;
  function courbe(o) {
    const f = o.fin || fin, m = o.mut === null ? null : (o.mut || mutOf(f));
    const h = o.h || 72, top = o.top ?? 18, bot = o.bot ?? h - 2, vMax = o.vMax ?? 8000, vMin = o.vMin ?? 0;
    const iv0 = o.iv0 ?? 0, iv1 = o.iv1 ?? 52, x0 = o.x0 ?? 10.7547, x1 = 362;
    const dx = (x1 - x0) / (iv1 - iv0), X = (i) => x0 + (i - iv0) * dx;
    const Y = (val) => top + (vMax - Math.max(vMin, Math.min(vMax, val))) * (bot - top) / (vMax - vMin);
    const step = (a) => { let d = ''; for (let i = iv0; i < iv1; i++) d += (i === iv0 ? 'M' : 'L') + X(i).toFixed(1) + ' ' + Y(a[i]).toFixed(1) + 'L' + X(i + 1).toFixed(1) + ' ' + Y(a[i]).toFixed(1); return d; };
    const back = (a) => { let d = ''; for (let i = iv1 - 1; i >= iv0; i--) d += 'L' + X(i + 1).toFixed(1) + ' ' + Y(a[i]).toFixed(1) + 'L' + X(i).toFixed(1) + ' ' + Y(a[i]).toFixed(1); return d; };
    let s = `<svg class="crb" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" aria-hidden="true"><defs><pattern id="mch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="2.4" height="6" fill="var(--fin)" opacity=".55"/></pattern><pattern id="gxup" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="3" height="6" fill="var(--ok)" opacity=".7"/></pattern></defs>`;
    for (let k = 0; k < 5; k++) { const y = (bot - k * (bot - top) / 4).toFixed(1); s += `<line x1="${o.x0 ? x0 - 4 : 4}" x2="362" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="1"/>`; }
    if (o.yAx) for (let k = 0; k < 5; k++) { const val = vMin + k * (vMax - vMin) / 4, y = bot - k * (bot - top) / 4; s += `<text x="${x0 - 8}" y="${(y + 5).toFixed(1)}" text-anchor="end" class="tk">${nb(val)}</text>`; }
    if (iv0 === 0 && !o.x0) s += `<rect x="4" y="${top}" width="${(x0 - 4).toFixed(2)}" height="${bot - top}" fill="var(--s2)"/>`;
    s += `<path d="${step(f)}L${X(iv1)} ${bot}L${X(iv0)} ${bot}Z" fill="var(--area)"/>`;
    if (m) s += `<path d="${step(m)}${back(f)}Z" fill="url(#mch)"/>`;
    if (o.ghost && o.up) s += `<path d="${step(f)}${back(o.ghost)}Z" fill="url(#gxup)"/>`;
    if (m) s += `<path d="${step(m)}" fill="none" stroke="var(--mut)" stroke-width="1.5"/>`;
    if (o.ghost) s += `<path d="${step(o.ghost)}" fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="4 4" opacity=".75"/>`;
    s += `<path d="${step(f)}" fill="none" stroke="var(--fin)" stroke-width="${o.sw || 2.5}"/>`;
    if (iv0 === 0) s += `<line x1="${X(0)}" x2="${X(0)}" y1="${top - 4}" y2="${bot}" stroke="var(--fin)" stroke-width="2"/>`;
    if (o.low !== false) {
      let li = iv0; for (let i = iv0; i < iv1; i++) if (f[i] < f[li]) li = i;
      const lx = X(li + 0.5), ly = Y(f[li]);
      s += `<line x1="${lx}" x2="${lx}" y1="${top - 2}" y2="${ly}" stroke="var(--fin)" stroke-width="1.2" stroke-dasharray="2 3"/><circle cx="${lx}" cy="${ly}" r="6" fill="var(--fin)" stroke="var(--halo)" stroke-width="2"/>`;
      s += `<text x="${lx - 4}" y="${top - 6}" text-anchor="start" class="pb">${o.lowTxt || 'S' + sem(li)}</text>`;
    }
    s += (o.extra ? o.extra({ X, Y, top, bot, h }) : '') + '</svg>';
    return { svg: s, X, Y, top, bot, h };
  }
  function moisAxe(X, iv0 = 0, iv1 = 52, every = 3) {
    let s = '', k = 0;
    for (let i = Math.max(1, iv0); i < iv1; i++) if (mois0(i)) {
      const x = X(i); s += `<b style="left:${x}px"></b>`;
      const mo = dt(i).getMonth(); if ((every === 1) || (every === 2 && mo % 2 === 1) || (every === 3 && [11, 2, 5].includes(mo))) s += `<i style="left:${x + 3}px">${MO[mo]}</i>`; k++;
    }
    return s;
  }
  let C; // dernière courbe rendue
  function poseCourbe(o = {}) {
    const mini = $('#mini'); const h = o.h || 72;
    C = courbe(o);
    const chip = o.chip ?? '6 sem.';
    mini.innerHTML = C.svg + (o.win ? `<div class="pin" data-pinceau="corps" style="left:${C.X(o.win[0])}px;width:${C.X(o.win[1] + 1) - C.X(o.win[0])}px${o.pinStyle || ''}"><span class="ph ph0"></span><span class="ph ph1"></span></div>` : '')
      + (o.ghostWin ? `<div class="gx-pg" style="left:${C.X(o.ghostWin[0])}px;width:${C.X(o.ghostWin[1] + 1) - C.X(o.ghostWin[0])}px;top:${o.pinTop ?? 8}px;height:${o.pinH ?? 58}px"></div>` : '')
      + `<div class="mo" style="${o.moStyle || ''}">${moisAxe(C.X, o.iv0, o.iv1, o.every)}</div>`
      + (chip ? `<button type="button" class="gd-ch" aria-label="Période">${chip}<svg class="ico"><use href="#i-bas"></use></svg></button>` : '')
      + (o.html || '');
    mini.style.height = (h + 22) + 'px';
    if (o.pinTop !== undefined) { const p = $('.pin', mini); if (p) { p.style.top = o.pinTop + 'px'; p.style.height = o.pinH + 'px'; } }
    return C;
  }
  const abs = (el) => el.getBoundingClientRect();
  const curvePt = (i, f = fin) => { const r = abs($('#mini svg')); return [r.left + C.X(i + 0.5), r.top + C.Y(f[i])]; };

  // ---------- bande des semaines ----------
  function bande(i0, n = 6, mark = {}) {
    const rows = $$('#fh .fg');
    const wk = rows[1], lib = rows[2];
    wk.style.gridTemplateColumns = lib.style.gridTemplateColumns = `repeat(${n},1fr)`;
    let a = '', b = '';
    for (let k = 0; k < n; k++) {
      const i = i0 + k, mo = (k === 0 || mois0(i)) ? `<span class="pg-mo">${MO[dt(i).getMonth()]}</span>` : '';
      a += `<div class="wk${i === 0 ? ' now' : ''}${mark[i] ? ' ' + (mark[i].wk || '') : ''}" data-sem="${sem(i)}"><b>${mo}S${sem(i)}</b><small>${dlab(i)}</small></div>`;
      const mk = mark[i] || {};
      b += `<button type="button" class="lib ${mk.cls || ''}" data-libre-sem="${sem(i)}">${mk.txt || nb((mk.f || fin)[i])}</button>`;
    }
    wk.innerHTML = a; lib.innerHTML = b;
  }

  // ---------- frise générée (même balisage que g-d1) ----------
  const EV = [
    { v: 'brassage', t: 'Blonde d’automne', m: -148, s: 0, e: 3.95, dj: 1 },
    { v: 'brassage', t: 'Porter d’hiver', m: -176, s: 4, e: 6, brew: 1 },
    { v: 'brassage', t: 'Saison de janvier', m: -382, s: 8, e: 10, brew: 1 },
    { v: 'brassage', t: 'IPA de printemps', m: -412, s: 14, e: 16, brew: 1 },
    { v: 'brassage', t: 'Bière d’été', m: -430, s: 26, e: 28, brew: 1 },
    { v: 'brassage', t: 'Bière d’automne', m: -380, s: 41, e: 43, brew: 1 },
    { v: 'evenement', t: 'Marché de Noël', m: 1180, s: 3, e: 3.95 },
    { v: 'evenement', t: 'Carnaval', m: 640, s: 14, e: 14.95 },
    { v: 'evenement', t: 'Fête au village', m: 1665, s: 32, e: 32.95 },
    { v: 'evenement', t: 'Festival d’été', m: 2400, s: 39, e: 39.95 },
    { v: 'vente', t: 'Noël privés', m: 640, s: 3, e: 5.95 },
    { v: 'vente', t: 'Coffrets Saint-Valentin', m: 380, s: 12, e: 12.95 },
    { v: 'achat', t: 'Commande groupée de malt', m: -540, s: 5, e: 7 },
    { v: 'achat', t: 'Frigo : mis de côté, non compté', val: '120 / sem.', s: 12, e: 41, cote: 1 },
    { v: 'achat', t: 'Malt de printemps', m: -540, s: 19, e: 19.95 },
    { v: 'renovation', t: 'Rénovation des sols', val: '5 j', s: 26, e: 46 },
    { v: 'activite', t: 'Ranger la réserve', val: '3 j', s: 1, e: 5.95 },
    { v: 'activite', t: 'Nettoyer les fenêtres', val: '1 j', s: 13, e: 13.95 },
    { v: 'charge', t: 'Loyer du local (400 par mois)', val: '−400 / mois', s: -9, e: 99, fixe: 1 },
  ];
  const PI = [
    { v: 'brassage', ic: 'k17cart', at: 3.5, manque: 1 },
    { v: 'vente', ic: 'k17bout', at: 2.5, n: '+260' }, { v: 'vente', ic: 'k17rec', at: 3.5, prev: 1 }, { v: 'vente', ic: 'k18fut', at: 4.5, n: '3' },
    { v: 'vente', ic: 'k17bout', at: 19.5, n: '+240' },
    { v: 'charge', ic: 'k18fac', at: 3.5, n: '−312' }, { v: 'charge', ic: 'k18fac', at: 5.5, n: '−94' }, { v: 'charge', ic: 'k18fac', at: 16.5, n: '−82' }, { v: 'charge', ic: 'k18fac', at: 19.5, n: '−312' },
  ];
  const LANES = [['brassage', 'Brassins'], ['evenement', 'Fêtes'], ['vente', 'Ventes'], ['achat', 'Achats'], ['renovation', 'Travaux'], ['activite', 'Activités'], ['charge', 'Papiers']];
  const cvs = document.createElement('canvas').getContext('2d');
  const tw = (t, w = 600) => { cvs.font = `${w} 14px "Source Sans 3","Segoe UI",system-ui,sans-serif`; return Math.ceil(cvs.measureText(t).width); };
  function frise(i0, n, opt = {}) {
    const fb = $('#fb'), cw = W / n, i1 = i0 + n;
    let h = '';
    for (let k = 0; k < n; k++) { const i = i0 + k; if (opt.colsMonth && !(k === 0 || mois0(i))) continue; h += `<div class="col${i === 0 ? ' now' : ''}${k && mois0(i) ? ' m0' : ''}" style="left:${k * cw}px;width:${cw}px"></div>`; }
    for (const [voie, nom] of LANES) {
      const evs = EV.filter((x) => x.v === voie && x.e > i0 && x.s < i1); if (opt.court) evs.sort((a, b) => Math.abs(b.m || 0) - Math.abs(a.m || 0));
      const rows = []; const items = [];
      for (const x of evs) {
        const s = Math.max(x.s, i0), en = Math.min(x.e, i1);
        const L = (s - i0) * cw, Wd = Math.max(opt.minW || 10, (en - s) * cw - 3);
        const label = x.t + ' ' + (x.val || sg(x.m)), lw = tw(label) + 6;
        const cand = [];
        if (Wd - 18 >= lw) cand.push(['in', L, L + Wd]);
        if (L - 14 >= lw) cand.push(['le', L - 14 - lw, L + Wd]);
        if (L + Wd + 14 + lw <= W) cand.push(['ri', L, L + Wd + 14 + lw]);
        if (!opt.court) cand.push(['ab', Math.min(L, W - lw), Math.max(L + Wd, Math.min(L, W - lw) + lw)]);
        let placed = null;
        for (const c of cand) {
          for (let r = 0; r < (opt.court ? 3 : 4) && !placed; r++) {
            rows[r] = rows[r] || [];
            if (rows[r].every(([a, b]) => c[2] + 6 <= a || c[1] >= b + 6)) { rows[r].push([c[1], c[2]]); placed = { x, r, c, L, Wd, lw, label, cutl: x.s < i0, cutr: x.e > i1 }; }
          }
          if (placed) break;
        }
        if (!placed && opt.court) { // vue année : le montant seul, s'il tient
          const sl = x.val || sg(x.m), sw = tw(sl) + 6, c2 = [];
          if (Wd - 18 >= sw) c2.push(['in', L, L + Wd]); if (L - 14 >= sw) c2.push(['le', L - 14 - sw, L + Wd]); if (L + Wd + 14 + sw <= W) c2.push(['ri', L, L + Wd + 14 + sw]);
          for (const c of c2) { for (let r = 0; r < 4 && !placed; r++) { rows[r] = rows[r] || []; if (rows[r].every(([a, b]) => c[2] + 6 <= a || c[1] >= b + 6)) { rows[r].push([c[1], c[2]]); placed = { x, r, c, L, Wd, lw: sw, label: sl, court: 1, cutl: x.s < i0, cutr: x.e > i1 }; } } if (placed) break; }
        }
        for (let r = 0; !placed; r++) { rows[r] = rows[r] || []; if (rows[r].every(([a, b]) => L + Wd + 4 <= a || L >= b + 4)) { rows[r].push([L, L + Wd]); placed = { x, r, c: ['no', L, L + Wd], L, Wd, lw, label, cutl: x.s < i0, cutr: x.e > i1 }; } }
        items.push(placed);
      }
      // hauteur des rangs
      const rh = []; for (const it of items) { const hh = (it.x.dj ? 52 : 36) + (it.c[0] === 'ab' ? 20 : 0); rh[it.r] = Math.max(rh[it.r] || 0, hh); }
      const tops = []; let acc = 2; for (let r = 0; r < rh.length; r++) { tops[r] = acc; acc += rh[r] || 0; }
      let bars = '';
      for (const it of items) {
        const { x, r, c, L, Wd } = it; const top = tops[r] + (c[0] === 'ab' ? 20 : 0);
        const cls = ['bar', 'k-' + voie, x.dj ? 'dj' : '', it.cutl ? 'cutl' : '', it.cutr ? 'cutr' : '', x.fixe ? 'fixe' : '', x.cote ? 'gx-cote' : '', Wd < 70 ? 'etroit' : '', (opt.dim && !opt.dim(x)) ? 'gx-dim' : '', (opt.hot && opt.hot(x)) ? 'gx-hot' : ''].filter(Boolean).join(' ');
        const val = `<span class="v">${x.val || sg(x.m)}</span>`;
        let lbl;
        if (c[0] === 'ab') { const lx = Math.min(0, W - it.lw - L); lbl = `<span class="lbl gx-ab" style="left:${lx}px">${x.t} ${val}</span>`; }
        else if (c[0] === 'no') lbl = ''; else lbl = `<span class="lbl ${c[0]}"${it.court ? ` aria-label="${x.t}"` : ''}>${it.court ? '' : x.t + ' '}${val}</span>`;
        const inner = x.dj && !opt.court ? `<span class="k12-jg"><span class="tr k18-tr"><i class="pr" style="width:25%"></i></span><em>J0 / 28</em></span>` : (x.brew && !it.cutl ? `<span class="brew" style="width:10.2px;left:-1.5px"></span>` : '');
        bars += `<div class="${cls}" style="left:${L}px;width:${Wd}px;top:${top}px;--c:${x.cote ? 'var(--mut)' : `var(--e-${voie})`}">${inner}${lbl}${x.fixe ? '' : `${it.cutl ? '' : '<span class="grip g0"></span>'}${it.cutr ? '' : '<span class="grip g1"></span>'}`}</div>`;
      }
      const lrH = acc + 2;
      // titre : sur la ligne de la 1re barre s'il y a la place (comme g-d1), sinon sa ligne
      const tW = tw(nom, 700) + 17 + 32 + 8;
      let lt = `<div class="lt" role="button"><i></i>${nom}<button type="button" class="k14-pl"><svg class="ico"><use href="#i-plus"></use></svg></button></div>`;
      if (items.length && rows[0]) {
        const occ = rows[0].slice().sort((a, b) => a[0] - b[0]); let free = null, prev = 0;
        for (const [a, b] of occ.concat([[W, W]])) { if (a - prev >= tW + 12) { free = free || [prev, a]; } prev = Math.max(prev, b); }
        if (free) { const left = free[0] === 0 ? 0 : free[1] - tW; lt = `<div class="lt pg-in" role="button" style="left:${left}px;width:${tW}px"><i></i>${nom}<button type="button" class="k14-pl"><svg class="ico"><use href="#i-plus"></use></svg></button></div>`; }
      }
      const pis = opt.noPi ? [] : PI.filter((p) => p.v === voie && p.at >= i0 && p.at < i1);
      const pd = pis.length ? `<div class="k18-pd${pis.some((p) => p.n) ? ' num' : ''}">${pis.map((p) => `<button type="button" class="k17-p${p.prev ? ' prev' : ''}${(opt.dimP && !opt.dimP(p)) ? ' gx-dim' : ''}${(opt.hotP && opt.hotP(p)) ? ' gx-hot' : ''}" ${p.manque ? 'data-etat="manque"' : ''} style="left:${(p.at - i0) * cw}px"><span class="k18-r"><svg class="ico"><use href="#i-${p.ic}"></use></svg></span>${p.n ? `<span class="k18-n">${p.n}</span>` : ''}</button>`).join('')}</div>` : '';
      h += `<div class="lane" data-voie="${voie}" style="--c:var(--e-${voie})">${lt}<div class="lr" style="height:${items.length ? lrH : 0}px">${bars}</div>${pd}</div>`;
    }
    fb.innerHTML = h;
  }

  // ---------- doigts, flèches, marques ----------
  const lay = document.createElement('div'); lay.className = 'gx-lay'; document.body.appendChild(lay);
  document.body.insertAdjacentHTML('beforeend', '<div class="gx-pied"></div>'); // la frise s'arrête 88 px au-dessus des onglets : le + ne cache rien
  const doigt = (x, y, cls = '') => { lay.insertAdjacentHTML('beforeend', `<i class="gx-f ${cls}" style="left:${x - 23}px;top:${y - 23}px"></i>`); };
  function fleche(x1, y1, x2, y2) {
    lay.insertAdjacentHTML('beforeend', `<svg class="gx-ar" width="390" height="844" viewBox="0 0 390 844"><defs><marker id="gxm${x1}${y1}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--gxa)"/></marker></defs><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--bg)" stroke-width="9" stroke-linecap="round"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--gxa)" stroke-width="4.5" stroke-linecap="round" marker-end="url(#gxm${x1}${y1})"/></svg>`);
  }
  const tete = (n, s) => { const hd = $('.gd-hd'); $('.n', hd).innerHTML = n; $('.s', hd).innerHTML = s; return hd; };
  const retour = () => `<button type="button" class="gx-ret" aria-label="Revenir à aujourd’hui"><svg class="ico"><use href="#i-k15ret"></use></svg>16 nov.</button>`;

  // ======================= les dix versions =======================
  const R = {};
  // c1-a : tirer la fenêtre sur la courbe, la frise suit
  R['c1-a'] = () => {
    if (!A) { poseCourbe({ win: [0, 5] }); const p = abs($('.pin')); doigt(p.left + p.width / 2 + 4, p.top + p.height - 12); fleche(p.left + p.width / 2 + 30, p.top + p.height - 12, p.left + p.width / 2 + 104, p.top + p.height - 12); return; }
    poseCourbe({ win: [11, 16], ghostWin: [0, 5], html: retour() });
    bande(11, 6); frise(11, 6);
    const p = abs($('.pin')); doigt(p.left + p.width / 2, p.top + p.height - 12, 'leve');
    document.body.classList.add('gx-neuf');
  };
  // c1-b : la frise se glisse, la fenêtre suit sur la courbe
  R['c1-b'] = () => {
    if (!A) { poseCourbe({ win: [0, 5] }); doigt(300, 535); fleche(272, 535, 124, 535); return; }
    poseCourbe({ win: [3, 8], ghostWin: [0, 5], html: retour() });
    bande(3, 6); frise(3, 6);
    doigt(124, 535, 'leve');
    document.body.classList.add('gx-neuf');
  };
  // c2-a : toucher un point de la courbe → la fiche de la semaine
  R['c2-a'] = () => {
    poseCourbe({ win: [0, 5], extra: A ? ({ X, Y, top, bot }) => `<rect x="${X(19)}" y="${top - 4}" width="${X(20) - X(19)}" height="${bot - top + 4}" fill="var(--ink)" opacity=".14"/><circle cx="${X(19.5)}" cy="${Y(fin[19])}" r="7" fill="none" stroke="var(--ink)" stroke-width="2.5"/>` : null });
    const [x, y] = curvePt(19);
    if (!A) { doigt(x, y); lay.insertAdjacentHTML('beforeend', `<i class="gx-tap" style="left:${x - 34}px;top:${y - 34}px"></i>`); return; }
    const mv = MV[19], tot = mv.reduce((a, m) => a + m[2], 0);
    const mini = abs($('#mini'));
    lay.insertAdjacentHTML('beforeend', `<section class="gx-card" style="top:${mini.bottom - 6}px"><i class="gx-pt" style="left:${x - 12 - 9}px"></i><header><b>S13</b><span>29 mars → 4 avr.</span><button type="button" class="gx-x" aria-label="Fermer"><svg class="ico"><use href="#i-x"></use></svg></button></header>
      <ul>${mv.map(([vo, t, m]) => `<li style="--c:var(--e-${vo})"><i></i><span>${t}</span><b class="${m < 0 ? 'neg' : 'pos'}">${sg(m)}</b></li>`).join('')}</ul>
      <footer><span>la semaine</span><b class="neg">${sg(tot)}</b><span class="gx-sep">libre en fin de semaine</span><b>${nb(fin[19])}</b></footer>
      <button type="button" class="gx-go">Voir S13 dans la frise →</button></section>`);
  };
  // c2-b : toucher une semaine de la bande → ses mouvements s'allument dans la frise et sur la courbe
  R['c2-b'] = () => {
    poseCourbe({ win: [0, 5], extra: A ? ({ X, Y }) => `<path d="M${X(3)} ${Y(fin[2])}L${X(3)} ${Y(fin[3])}" stroke="var(--ok)" stroke-width="5"/><circle cx="${X(3.5)}" cy="${Y(fin[3])}" r="6" fill="var(--ok)" stroke="var(--halo)" stroke-width="2"/>` : null });
    const wk = $$('#fh .wk')[3];
    if (!A) { const r0 = abs($$('#fh .wk')[2]), r = abs(wk); const y = r.top + r.height / 2 + 14; doigt(r0.left + r0.width / 2, y); fleche(r0.left + r0.width / 2 + 26, y, r.left + r.width / 2 + 8, y); return; }
    $$('#fb .bar').forEach((b) => b.classList.add(b.dataset.chose === 'e-01' ? 'gx-hot' : 'gx-dim'));
    $$('#fb .k17-p').forEach((q) => q.classList.add(['k-fac1@4', 'k-cdp@4'].includes(q.dataset.k17P) ? 'gx-hot' : 'gx-dim'));
    const cdp = $('[data-k17-p="k-cdp@4"]'); if (cdp && !$('.k18-n', cdp)) cdp.insertAdjacentHTML('beforeend', '<span class="k18-n">+120</span>');
    for (const vo of ['brassage', 'achat', 'renovation', 'activite']) { const ln = $(`.lane[data-voie="${vo}"]`); if (!ln) continue; const lt = $('.lt', ln); lt.classList.remove('pg-in'); lt.removeAttribute('style'); lt.insertAdjacentHTML('beforeend', '<span class="gx-rien">rien en S50</span>'); $$('.lr, .k18-pd, .k18-ln', ln).forEach((e) => (e.style.display = 'none')); }
    tete(`${nb(fin[3])}<small>CHF</small>`, `<span class="gx-lt"><b>S50</b> · 7 déc.</span><em class="pos">+988</em>`).classList.add('gx-lec');
    doigt(abs(wk).left + abs(wk).width / 2, abs(wk).top + abs(wk).height / 2 + 14, 'leve');
    $$('#fb .k18-ln').forEach((l) => l.classList.add('gx-dim'));
    $('#fb .col[data-col="50"]').classList.add('foc');
    $$('#fh .wk')[3].classList.add('gx-wsel'); $$('#fh .lib')[3].classList.add('gx-wsel');
    const mv = MV[3];
    $('#fh').insertAdjacentHTML('beforeend', `<div class="gx-recu"><b>S50 · 7 → 13 déc.</b>${mv.map(([vo, t, m]) => `<span style="--c:var(--e-${vo})"><i></i>${t.replace(' (facture)', '').replace(' de la semaine', '')} <em class="${m < 0 ? 'neg' : 'pos'}">${sg(m)}</em></span>`).join('')}<span class="gx-tot">= <em class="pos">+988</em></span></div>`);
  };
  // c3-a : glisser le long de la courbe → le chiffre de tête lit la semaine sous le doigt
  R['c3-a'] = () => {
    if (!A) { poseCourbe({ win: [0, 5] }); const [x, y] = curvePt(12); doigt(x, y); fleche(x + 26, y - 2, x + 62, y - 2); return; }
    poseCourbe({ win: [0, 5], low: false, extra: ({ X, Y, top, bot }) => `<line x1="${X(19.5)}" x2="${X(19.5)}" y1="${top - 6}" y2="${bot}" stroke="var(--ink)" stroke-width="2"/><circle cx="${X(19.5)}" cy="${Y(fin[19])}" r="6" fill="var(--ink)" stroke="var(--halo)" stroke-width="2"/>` });
    const hd = tete(`${nb(fin[19])}<small>CHF</small>`, `<span class="gx-lt"><b>S13</b> · 29 mars</span><em class="neg">−892</em>`); hd.classList.add('gx-lec');
    const mini = abs($('#mini'));
    const [x, y] = curvePt(19);
    lay.insertAdjacentHTML('beforeend', `<div class="gx-tag" style="left:${x + 16}px;top:${mini.top + 2}px">Malt de printemps <b class="neg">−540</b><br>Loyer d’avril <b class="neg">−400</b> · +3 autres</div>`);
    doigt(x, y + 6, 'leve');
  };
  // c3-b : appui sur la courbe → elle s'agrandit, chaque marche nommée sous le doigt
  R['c3-b'] = () => {
    if (!A) { poseCourbe({ win: [0, 5] }); const [x, y] = curvePt(30); doigt(x, y - 4); lay.insertAdjacentHTML('beforeend', `<i class="gx-hold" style="left:${x - 34}px;top:${y - 38}px"></i>`); return; }
    const cb = poseCourbe({ h: 300, top: 26, bot: 274, x0: 52, yAx: 1, vMax: 6000, win: null, chip: '', every: 2, extra: ({ X, Y, top, bot }) => {
      let s = `<rect x="${X(30)}" y="${top}" width="${X(31) - X(30)}" height="${bot - top}" fill="var(--ink)" opacity=".10"/><line x1="${X(30.5)}" x2="${X(30.5)}" y1="${top - 4}" y2="${bot}" stroke="var(--ink)" stroke-width="2"/>`;
      return s;
    } });
    document.body.classList.add('gx-grand');
    const [x, y] = curvePt(30);
    const svgR = abs($('#mini svg'));
    const L = (i, t, m, dy) => `<div class="gx-step" style="left:${svgR.left + cb.X(i + 0.5) - 6}px;top:${svgR.top + cb.Y(fin[i]) + dy}px"><b class="${m < 0 ? 'neg' : 'pos'}">${sg(m)}</b> ${t}</div>`;
    $('#mini').insertAdjacentHTML('afterend', `<div class="gx-loupe gx-blk"><header><b>S24</b> · 14 → 20 juin <span>libre ${nb(fin[30])}</span></header>${MV[30].map(([vo, t, m]) => `<p style="--c:var(--e-${vo})"><i></i>${t}<b class="${m < 0 ? 'neg' : 'pos'}">${sg(m)}</b></p>`).join('')}<footer>la semaine <b class="neg">${sg(flux(fin, 30))}</b></footer></div>`);
    
    doigt(x, y, 'leve');
  };
  // c4-a : « et si » depuis la frise : décaler le Porter d'une semaine, la courbe recalculée avant de valider
  R['c4-a'] = () => {
    const por = $('[data-chose="b-02"]');
    if (!A) { poseCourbe({ win: [0, 5] }); const r = abs(por); doigt(r.left + 34, r.top + 15); fleche(r.left + 58, r.top + 15, r.left + 104, r.top + 15); return; }
    const f2 = fin.slice(); f2[4] += 176; // Porter S51 → S52 : −176 passe en S52
    // la frise : le Porter une semaine plus tard, son fantôme, ses courses repoussées
    por.insertAdjacentHTML('beforebegin', `<div class="gx-gh" style="left:244px;width:119px;top:54px;height:30px"></div>`);
    por.style.left = '305px'; por.style.width = '61px'; por.classList.add('drag', 'etroit', 'cutr'); // même longueur (2 sem.) : la 2e semaine sort à droite
    const ph = $('.k17-ph', por); if (ph) ph.remove();
    const cart = $('[data-k17-p="c:b-02"]'); if (cart) cart.style.left = '274.5px';
    const ln = $('[data-k18-lien="b-02"]'); if (ln) { ln.style.left = '290.5px'; }
    bande(0, 6, { 4: { f: f2, cls: 'up gx-chg' } });
    // courbe : zoom sur S49 → S2, avant en pointillé, et si en plein, l'écart en vert
    poseCourbe({ fin: f2, mut: null, ghost: fin, up: 1, iv0: 2, iv1: 9, vMax: 6000, vMin: 3600, x0: 46, yAx: 1, h: 120, top: 22, bot: 116, win: null, chip: '', every: 1, low: false, extra: ({ X, Y }) => `<text x="${X(4.5)}" y="${Y(f2[4]) - 10}" text-anchor="middle" class="gx-dt">+176</text>` });
    const mini = $('#mini');
    mini.insertAdjacentHTML('afterend', `<div class="gx-etsi"><p><b>Et si</b> Porter en S52<span>au plus serré : inchangé</span></p><button type="button" class="gx-b0">Annuler</button><button type="button" class="gx-b1"><svg class="ico"><use href="#i-check"></use></svg>Valider</button></div>`);
    const r = abs(por); doigt(r.left + 24, r.top + 15, 'leve');
  };
  // c4-b : « et si » sur la courbe : soulever le malt de printemps et le poser plus tard
  R['c4-b'] = () => {
    const f2 = fin.slice(); for (let i = 19; i < 33; i++) f2[i] += 540; // payé S27 au lieu de S13
    const H = { h: 190, top: 28, bot: 182, vMax: 6000, x0: 50, yAx: 1, every: 2, chip: '' };
    if (!A) {
      poseCourbe({ win: [0, 5], extra: ({ X, Y }) => `<path d="M${X(19)} ${Y(fin[18])}L${X(19)} ${Y(fin[19])}" stroke="var(--bad)" stroke-width="4"/>` });
      const [x, y] = curvePt(19); const x2 = curvePt(33)[0];
      lay.insertAdjacentHTML('beforeend', `<i class="gx-hold" style="left:${x - 34}px;top:${y - 34}px"></i><span class="gx-chip" style="left:${x - 140}px;top:${y - 10}px"><svg class="ico"><use href="#i-k17cart"></use></svg>Malt <b>−540</b></span>`);
      doigt(x, y); fleche(x + 26, y, x2 + 4, y);
      return;
    }
    poseCourbe({ ...H, fin: f2, ghost: fin, up: 1, win: null, lowTxt: 'S24 · 653', extra: ({ X, Y }) => `<path d="M${X(33)} ${Y(f2[32])}L${X(33)} ${Y(f2[33])}" stroke="var(--bad)" stroke-width="5"/><text x="${X(26)}" y="${Y(f2[26]) - 30}" text-anchor="middle" class="gx-dt">+540</text>` });
    document.body.classList.add('gx-grand2');
    tete(`653<small>CHF</small>`, `<s>113</s>&nbsp;sans passer sous 0`).classList.add('gx-lec');
    const [x, y] = curvePt(33, f2);
    lay.insertAdjacentHTML('beforeend', `<span class="gx-chip on" style="left:${x - 30}px;top:${y - 66}px"><svg class="ico"><use href="#i-k17cart"></use></svg>Malt <b>−540</b></span>`);
    $('#mini').insertAdjacentHTML('afterend', `<div class="gx-etsi"><p><b>Et si</b> malt en S27<span>au plus serré 113 → 653</span></p><button type="button" class="gx-b0">Annuler</button><button type="button" class="gx-b1"><svg class="ico"><use href="#i-check"></use></svg>Valider</button></div>`);
    doigt(x, y - 50, 'leve');
  };
  // c5-a : pincer la frise → 3 mois
  R['c5-a'] = () => {
    if (!A) { poseCourbe({ win: [0, 5] }); doigt(150, 600); doigt(280, 600); fleche(128, 600, 186, 600); fleche(302, 600, 244, 600); return; }
    poseCourbe({ win: [0, 12], ghostWin: [0, 5], chip: '3 mois' });
    // bande : mois + solde au début de chaque mois ; un trait par semaine
    const rows = $$('#fh .fg'), n = 13, cw = W / n;
    rows[1].style.gridTemplateColumns = rows[2].style.gridTemplateColumns = 'none';
    rows[1].style.position = rows[2].style.position = 'relative'; rows[1].style.height = '22px'; rows[2].style.height = '52px';
    let a = '', b = '';
    const lo = minIdx(fin.slice(0, 13));
    for (let k = 0; k < n; k++) {
      const i = k; if (k === 0 || mois0(i)) a += `<span class="gx-m" style="left:${k * cw}px"><b>${MO[dt(i).getMonth()]}</b> S${sem(i)}</span>`;
      const hh = Math.round(fin[i] / 6000 * 30);
      b += `<i class="gx-hb${i === lo ? ' lo' : ''}" style="left:${k * cw + 3}px;width:${cw - 6}px;height:${hh}px"></i>`;
      if (k === 0 || mois0(i) || i === lo) b += `<em class="gx-hv${i === lo ? ' lo' : ''}" style="left:${k * cw + 1}px">${nb(fin[i])}</em>`;
    }
    rows[1].innerHTML = a; rows[2].innerHTML = b;
    frise(0, 13, { minW: 8 });
    document.body.classList.add('gx-neuf');
  };
  // c5-b : tirer la poignée droite de la fenêtre jusqu'au bout → l'année
  R['c5-b'] = () => {
    if (!A) { poseCourbe({ win: [0, 5] }); const p = abs($('.ph1')); doigt(p.left + 3, p.top + 24); fleche(p.left + 28, p.top + 24, 366, p.top + 24); return; }
    poseCourbe({ win: [0, 51], chip: 'An', pinTop: 18, pinH: 50 });
    const rows = $$('#fh .fg');
    rows[1].style.gridTemplateColumns = rows[2].style.gridTemplateColumns = 'repeat(12,1fr)';
    let a = '', b = ''; const ms = []; for (let i = 0; i < 52; i++) if (i === 0 || mois0(i)) ms.push(i);
    const lo = minIdx(fin);
    for (let k = 0; k < 12; k++) {
      const s0 = ms[k], s1 = (ms[k + 1] ?? 52); let mi = s0; for (let i = s0; i < s1; i++) if (fin[i] < fin[mi]) mi = i;
      const m = MO[dt(s0).getMonth()];
      a += `<div class="wk${k === 0 ? ' now' : ''}"><b>${m.slice(0, 1).toUpperCase()}</b></div>`;
      const isLo = lo >= s0 && lo < s1;
      b += `<div class="libm${isLo ? ' min' : ''}" style="position:relative"><i style="height:${Math.max(3, Math.round(fin[mi] / 6000 * 30))}px"></i>${isLo ? `<em class="gx-lov">${nb(fin[lo])}</em>` : ''}</div>`;
    }
    rows[1].innerHTML = a; rows[2].innerHTML = b;
    frise(0, 52, { colsMonth: 1, minW: 6, court: 1, noPi: 1 });
    const p = abs($('.ph1')); doigt(Math.min(p.left + 3, 362), p.top + 24, 'leve');
    document.body.classList.add('gx-neuf', 'gx-an');
  };
  try { R[v](); } catch (err) { document.body.insertAdjacentHTML('afterbegin', `<pre style="color:red;font-size:14px">${err.stack}</pre>`); }
  document.body.dataset.gx = 'pret';
})();
