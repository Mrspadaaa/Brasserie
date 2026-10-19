// s3b · La carte des possibles, seconde passe : l'état, la carte (glisser le doigt dessus), la pente, le détail,
// la dose limite, et les trois blocs à un toucher (défi, tire une bière, preuves).
(() => {
  const D = SIM.D, AX = SIM.AX, F = SIM.F;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const iR = F.indexOf('resin'), iF = F.indexOf('floral');
  // Départ : dry hop actif avec US-05 (K4), 4 g/L, 3 j : chaque réglage visible bouge au premier toucher.
  const E = { houblon: 'Citra', second: '', jours: 3, levure: 'US-05', m: 'dryActive', d: 4, vue: 'carte', bloc: null, tirage: 0 };
  let prec = null, courant = null;
  const NOMM = { b60: '60′', b10: '10′', wp: 'whirlpool', dryActive: 'dry hop actif', dryPost: 'dry hop après' };
  const nb = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
  const pic = (f, z = 10) => `<svg class="pi" width="${z}" height="${z}" data-famille="${f}" role="img" aria-label="${D.nom[f]}"><use href="#p-${f}"/></svg>`;
  const LANES = $('.prof .lns');
  const ajouts = (m, d, h = E.houblon) => {
    const a = [{ houblon: h, moment: m, dose_gL: d, jours: E.jours }];
    if (E.second && E.second !== h) a.push({ houblon: E.second, moment: SIM.sec(m) ? m : 'dryPost', dose_gL: 2, jours: E.jours });
    return a;
  };
  const prof = (m, d, h) => SIM.profil(ajouts(m, d, h), E.levure);
  // Hors du style par l'ajout : au-delà de la bande et pas déjà au-delà avant ; le résineux (ta dégustation) à part.
  const hors = (p) => F.filter((f, i) => i !== iR && !p[i][4] && p[i][1] > D.ech[f].hi && D.avant[i][1] <= D.ech[f].hi);
  const dc = (p, i) => SIM.cr(i, p[i][1]) - SIM.cr(i, D.avant[i][1]);
  // Les quatre familles qui bougent le plus pour ce houblon, sur toute la carte (les mêmes dans chaque case).
  function quatre() {
    const mx = F.map(() => 0);
    for (const m of AX.moment) for (const d of AX.dose_gL) { const p = prof(m, d); F.forEach((f, i) => { if (i !== iR && !p[i][4]) mx[i] = Math.max(mx[i], dc(p, i)); }); }
    return F.map((f, i) => ({ f, i, v: mx[i] })).filter((x) => x.i !== iR).sort((a, b) => b.v - a.v).slice(0, 4).sort((a, b) => a.i - b.i);
  }
  let Q = [];
  const PXC = 3.6, HC = 40;
  function empreinte(c, p) {
    let e = c.querySelector('.cs-e');
    if (!e) { c.innerHTML = '<span class="cs-e"><span class="cs-pl"></span></span><span class="cs-h"></span>'; e = c.querySelector('.cs-e'); }
    $$('i', e).forEach((x) => x.remove());
    for (const { f, i } of Q) {
      const t = p[i], b = document.createElement('i');
      b.dataset.famille = f; b.dataset.nature = 'simule';
      if (t[4]) { b.className = 'inc'; e.append(b); continue; }
      const v = SIM.abs ? t[1] / SIM.MAXP * HC * 1.4 : SIM.cr(i, t[1]) * PXC, z = SIM.abs ? D.ech[f].hi / SIM.MAXP * HC * 1.4 : 3 * PXC;
      const h = Math.max(2, Math.min(HC, v)), zz = Math.min(100, z / h * 100);
      b.style.height = h.toFixed(1) + 'px';
      b.style.background = v > z ? `linear-gradient(to top, ${D.base[f]} 0 ${zz.toFixed(0)}%, #c2410c ${zz.toFixed(0)}% 100%)` : D.base[f];
      if (v > HC) b.className = 'cap';
      e.append(b);
    }
    const pl = e.querySelector('.cs-pl'); pl.style.display = SIM.abs ? 'none' : 'block'; pl.style.bottom = 3 * PXC + 'px';
    const hs = hors(p);
    c.querySelector('.cs-h').innerHTML = hs.length ? `<span class="mh">hors</span><span class="ph">${hs.map((f) => pic(f)).join('')}</span>` : '';
    c.setAttribute('aria-label', `${NOMM[c.dataset.m]}, ${nb(+c.dataset.d)} g/L : ~ ${hs.length ? 'hors du style 16D : ' + hs.map((f) => D.court[f]).join(', ') : 'au style 16D'}`);
    return hs;
  }
  // La dose limite au style d'un houblon, au moment donné.
  function limite(m, h) {
    const ok = AX.dose_gL.map((d) => !hors(prof(m, d, h)).length);
    let lim = null; for (let k = 0; k < ok.length; k++) { if (!ok[k]) break; lim = AX.dose_gL[k]; }
    return { ok, lim };
  }
  const titre = (m, d) => ajouts(m, d).map((a, k) => `${a.houblon} ${nb(a.dose_gL)} g/L${k && a.moment !== m ? ' ' + NOMM[a.moment] : ''}`).join(' + ') + ` · ${NOMM[m]}${SIM.sec(m) ? ' · ' + E.jours + ' j' : ''} · ${E.levure}`;
  function reponse() {
    const r = $('[data-role="reponse"]');
    if (E.vue === 'pente') {
      const ds = AX.dose_gL, ps = ds.map((d) => prof(E.m, d)), f0 = Q.slice().sort((a, b) => dc(ps[ps.length - 1], b.i) - dc(ps[ps.length - 1], a.i))[0];
      const p0 = base0(), i = f0.i, c = [SIM.cr(i, p0[i][1]), ...ps.map((p) => SIM.cr(i, p[i][1]))], x = [0, ...ds];
      const k = Math.max(1, ds.indexOf(E.d) + 1), pente = (c[k] - c[k - 1]) / (x[k] - x[k - 1]), prem = (c[1] - c[0]) / x[1];
      r.innerHTML = k <= 1 ? `~ ${D.court[f0.f]} : le premier gramme rapporte <b>${nb(prem)} ${SIM.unite('crans', prem)}</b> par g/L, à ${NOMM[E.m]}.` : `~ ${D.court[f0.f]}, de ${nb(x[k - 1])} à ${nb(x[k])} g/L : <b>${nb(pente)} ${SIM.unite('crans', pente)}</b> par g/L, contre ${nb(prem)} pour le premier.`;
      return;
    }
    const { lim } = limite(E.m, E.houblon), hs1 = hors(prof(E.m, AX.dose_gL.find((d) => d > (lim || 0)) || AX.dose_gL[0]));
    const plat = AX.dose_gL.every((d) => !hors(prof('b60', d)).length);
    const qui = E.houblon + (E.second ? ' + ' + E.second : '');
    r.innerHTML = `~ ${qui}, ${NOMM[E.m]} : ${lim == null ? '<span class="hst">hors dès 1 g/L</span>' : lim === AX.dose_gL[AX.dose_gL.length - 1] ? 'au style même à 8 g/L' : `au style jusqu’à ${nb(lim)} g/L`}${plat && E.m !== 'b60' ? ' ; à 60′, presque tout part.' : '.'}`;
  }
  // À 0 g/L du houblon touché : ma bière, ou ma bière avec le second houblon seul.
  const base0 = () => (E.second ? SIM.profil([{ houblon: E.second, moment: SIM.sec(E.m) ? E.m : 'dryPost', dose_gL: 2, jours: E.jours }], E.levure) : D.avant);
  function pente() {
    const svg = $('[data-pe-svg]'), W = 350, H = 150, x0 = 52, x1 = 300, y0 = 128, y1 = 10;
    const ds = AX.dose_gL, ps = ds.map((d) => prof(E.m, d)), p0 = base0();
    let mx = 4; for (const { i } of Q) for (const p of ps) mx = Math.max(mx, SIM.cr(i, p[i][2] > 0 ? p[i][1] : 0));
    mx = Math.ceil(mx);
    const X = (d) => x0 + d / 8 * (x1 - x0), Y = (c) => y0 - Math.min(mx, c) / mx * (y0 - y1);
    let s = `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" stroke="#c9cad2"/><line x1="${x0}" y1="${Y(3)}" x2="${x1}" y2="${Y(3)}" stroke="#16161a" stroke-width="1.5" stroke-dasharray="4 3"/><text x="${x1 + 4}" y="${Y(3) + 4}" font-size="12" fill="#55555f">16D</text>`;
    for (const d of [0, 1, 2, 4, 8]) s += `<text x="${X(d)}" y="${H - 6}" font-size="12" text-anchor="middle" fill="#55555f">${d}</text>`;
    s += `<text x="${x1 + 4}" y="${H - 6}" font-size="12" fill="#55555f">g/L</text><text x="2" y="${y1 + 4}" font-size="12" fill="#55555f">${mx} crans</text><text x="2" y="${y0}" font-size="12" fill="#55555f">0</text><text x="2" y="${Y(3) + 4}" font-size="12" fill="#55555f">3</text>`;
    const k = Math.max(1, ds.indexOf(E.d) + 1);
    const lig = [];
    for (const { f, i } of Q) {
      const c = [SIM.cr(i, p0[i][1]), ...ps.map((p) => SIM.cr(i, p[i][1]))], x = [0, ...ds];
      s += `<polyline fill="none" stroke="${D.base[f]}" stroke-width="2" points="${x.map((d, j) => X(d).toFixed(1) + ',' + Y(c[j]).toFixed(1)).join(' ')}"/>`;
      s += x.map((d, j) => `<circle cx="${X(d).toFixed(1)}" cy="${Y(c[j]).toFixed(1)}" r="${j === k ? 4 : 2.5}" fill="${c[j] > 3 ? '#c2410c' : '#fff'}" stroke="${D.texte[f]}" stroke-width="1.5"/>`).join('');
      lig.push({ f, v: (c[k] - c[k - 1]) / (x[k] - x[k - 1]) });
    }
    s += `<line x1="${X(E.d)}" y1="${y1 - 6}" x2="${X(E.d)}" y2="${y0}" stroke="#16161a" stroke-width="1.5"/>`;
    svg.innerHTML = s;
    svg.setAttribute('aria-label', '~ ce que rapporte chaque gramme à ' + NOMM[E.m] + ' : ' + lig.map((l) => D.court[l.f] + ' ' + nb(l.v) + ' cran par g/L').join(', '));
  }
  function detail(p, flash) {
    SIM.poser(LANES, p, { ref: D.avant, flash: !!flash });
    $('[data-case-titre]').textContent = titre(E.m, E.d);
    const r = p[iR], dR = SIM.cr(iR, r[1]) - SIM.cr(iR, D.avant[iR][1]);
    $('[data-res1]').innerHTML = `${pic('resin', 14)}<b>${D.court.resin}</b> déjà hors, ta dégustation ; <span data-nature="simule">~ ${dR >= 0.25 ? '+' + nb(dR) + ' ' + SIM.unite('crans', dR) : 'pareil'}</span>`;
    const ms = ajouts(E.m, E.d).map((a) => a.moment);
    const ph = ms.includes('dryActive') ? 'actif' : ms.includes('dryPost') ? 'apres' : ms.some((m) => m === 'b10' || m === 'wp') ? 'chaud' : 'aucun';
    $$('[data-bio-k]').forEach((x) => { x.hidden = x.dataset.bioK !== E.levure + '|' + ph; });
  }
  function dessiner(o = {}) {
    Q = quatre();
    $('[data-f4]').innerHTML = Q.map(({ f }) => `<span style="--t:${D.texte[f]}">${pic(f, 12)}${D.court[f]}</span>`).join('');
    for (const c of $$('[data-reglage="case"]')) {
      const m = c.dataset.m, d = +c.dataset.d;
      empreinte(c, prof(m, d));
      c.setAttribute('aria-pressed', String(m === E.m && d === E.d));
      c.classList.toggle('prec', !!prec && prec.m === m && prec.d === d && !(m === E.m && d === E.d));
      let b = c.querySelector('.cs-mes');
      const mes = E.houblon === 'Cascade' && !E.second && m === 'dryPost' && E.jours === 1 && D.e04.some((x) => Math.abs(x.d - d) < 0.3);
      if (mes && !b) { b = document.createElement('span'); b.className = 'cs-mes'; b.textContent = 'mesuré'; c.append(b); }
      if (!mes && b) b.remove();
    }
    const p = prof(E.m, E.d);
    detail(p, !!o.geste || !!o.flash);
    // l'écart à la case d'avant, écrit
    const ec = $('[data-role="ecart"]');
    if (prec && o.geste && prec.p) {
      const ch = SIM.change(p, prec.p, 3).filter((x) => x.i !== iR);
      ec.innerHTML = `~ ${o.geste} : ${ch.length ? ch.map((x) => `<b style="color:${D.texte[x.f]}">${D.court[x.f]}</b> ${SIM.delta(SIM.cr(x.i, p[x.i][1]), SIM.cr(x.i, prec.p[x.i][1]), 'crans')}`).join(', ') : 'presque rien ne change'}.`;
    } else ec.innerHTML = '';
    // la carte ou la pente
    $('[data-carte]').hidden = E.vue !== 'carte'; $('[data-pente]').hidden = E.vue !== 'pente';
    $$('[data-reglage="vue"]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === E.vue)));
    if (E.vue === 'pente') { pente(); const r = $('.pe-r'); if (document.activeElement !== r) r.value = E.d; }
    reponse();
    // les pastilles de réglage
    $('[data-pil-v="houblon"]').innerHTML = `<i class="pt" style="background:${D.couleurs[E.houblon]}"></i>${E.houblon}`;
    $('[data-pil-v="second"]').textContent = E.second ? '+ ' + E.second : 'seul';
    $('[data-pil-v="jours"]').innerHTML = `<span class="nb">${E.jours}</span> j`;
    $$('.op[data-reglage="houblon"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === E.houblon)));
    $$('.op[data-reglage="second"]').forEach((b) => { b.setAttribute('aria-pressed', String(b.dataset.v === E.second)); b.disabled = b.dataset.v === E.houblon; });
    $$('.op[data-reglage="jours"]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.v === E.jours)));
    $$('[data-reglage="levure"]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === E.levure)));
    $$('[data-hv]').forEach((x) => { x.hidden = x.dataset.hv !== E.houblon; });
    $$('[data-vr]').forEach((x) => { x.hidden = ![E.houblon, E.second].includes(x.dataset.vr); });
    // la dose limite par houblon, classés par dose limite (le brasseur choisit)
    $('[data-lim-m]').textContent = '~ ' + NOMM[E.m] + (SIM.sec(E.m) ? ', ' + E.jours + ' j' : '') + (E.second ? ', avec ' + E.second : '');
    const L = SIM.AX.houblon.map((h) => ({ h, ...limite(E.m, h) })).sort((a, b) => (b.lim || 0) - (a.lim || 0));
    $('[data-lim]').innerHTML = L.map((x) => `<div class="li${x.h === E.houblon ? ' moi' : ''}"><span class="li-n" data-houblon="${x.h}"><i class="pt" style="background:${D.couleurs[x.h]}"></i>${x.h}</span><span class="li-p" data-nature="simule">${AX.dose_gL.map((d, k) => `<i class="${x.ok[k] ? '' : 'x'}" aria-label="${nb(d)} g/L : ${x.ok[k] ? 'au style' : 'hors'}">${nb(d)}</i>`).join('')}</span><span class="li-v">${x.lim == null ? 'hors dès 1 g/L' : x.lim === 8 ? 'au style à 8 g/L' : 'jusqu’à ' + nb(x.lim) + ' g/L'}</span></div>`).join('');
    blocs(p);
    return p;
  }
  // ---------- les trois blocs à un toucher ----------
  function blocs(p) {
    $$('[data-bloc]').forEach((b) => b.setAttribute('aria-expanded', String(b.dataset.bloc === E.bloc)));
    $$('[data-bk]').forEach((x) => { x.hidden = x.dataset.bk !== E.bloc; });
    // ton défi (x5) : ta dégustation du 18.10, carte par carte
    const dF = dc(p, iF), dR = SIM.cr(iR, p[iR][1]) - SIM.cr(iR, D.avant[iR][1]), hs = hors(p);
    const chaud = !SIM.sec(E.m), ib = chaud ? D.ibu.ajouts[E.houblon + '|' + E.m] : null;
    const ibuT = D.ibu.biere + (ib ? ib.v * E.d / ib.dose : 0);
    const carte = (ok, t, v, s, src) => `<div class="df ${ok ? 'ok' : 'x'}"><b>${t}</b><span class="v">${v}</span><span${src ? ` data-nature="mesure" data-source="${src}"` : ''}>${s}</span></div>`;
    $('[data-defi]').innerHTML = carte(dF >= 1, `${pic('floral', 12)} plus floral`, dF >= 1 ? 'atteint' : dF >= 0.5 ? 'presque' : 'pas encore', `<span data-nature="simule">~ ${dF >= 0 ? '+' : '−'}${nb(Math.abs(dF))} ${SIM.unite('crans', dF)}</span>`)
      + carte(false, `${pic('resin', 12)} moins résineux`, 'hors houblon', `<span data-nature="simule">~ ${dR >= 0.25 ? '+' + nb(dR) + ' ' + SIM.unite('crans', dR) + ' : le houblon en ajoute' : 'pareil'}</span>`)
      + carte(ibuT <= D.ibu.bande[1], 'amertume 50–70 IBU', ibuT <= D.ibu.bande[1] ? 'tenue' : 'trop amer', chaud && !ib ? 'IBU de cet ajout : pas simulé' : `<b class="nb">${Math.round(ibuT)}</b> IBU${ib ? ` (≈ à ${nb(E.d)} g/L)` : ''}`, ib ? 'c1 ' + ib.src.join(' ') : 'c1')
      + carte(!hs.length, 'dans le style 16D', hs.length ? hs.length + ' famille' + (hs.length > 1 ? 's' : '') + ' hors' : 'tenu', hs.length ? hs.map((f) => D.court[f]).join(', ') : 'aucune famille ne sort');
    // tire une bière (y5) : un tirage graine sur les réglages, qui ne change pas tant qu'ils ne changent pas
    if (E.bloc === 'tire') tirage(p);
  }
  const graine = () => { let h = 2166136261; for (const ch of JSON.stringify([E.houblon, E.second, E.jours, E.levure, E.m, E.d])) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (s) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // triangulaire autour du centre du moteur, entre son bas et son haut (convention de la page, écrite)
  const tri = (u, a, c, b) => (b <= a ? c : u < (c - a) / (b - a) ? a + Math.sqrt(u * (b - a) * (c - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - c)));
  function tirage(p) {
    const n = E.tirage || 0, R = rng(graine()), box = $('[data-tire]');
    const fs = F.map((f, i) => ({ f, i })).filter((x) => x.i !== iR && !p[x.i][4]);
    const out = fs.map(() => []);
    for (let k = 0; k < n; k++) fs.forEach((x, j) => { const t = p[x.i]; out[j].push(tri(R(), t[0], t[1], t[2])); });
    box.innerHTML = n ? fs.map((x, j) => { const W = Math.max(200, box.getBoundingClientRect().width - 92); return `<div class="ti-l" data-famille="${x.f}" style="--c:${D.base[x.f]};--t:${D.texte[x.f]};--z:${D.base[x.f]}29"><span>${pic(x.f, 12)} ${D.court[x.f]}</span><span class="ti-p"><i class="z" style="width:${SIM.zoneX(x.i, W).toFixed(1)}px"></i>${out[j].map((v) => `<i class="d${v > D.ech[x.f].hi ? ' x' : ''}" data-nature="simule" style="left:${SIM.X(x.i, v, W).toFixed(1)}px"></i>`).join('')}</span></div>`; }).join('') : '';
    const cpt = fs.map((x, j) => ({ f: x.f, n: out[j].filter((v) => v > D.ech[x.f].hi).length })).filter((x) => x.n).sort((a, b) => b.n - a.n).slice(0, 3);
    $('[data-tire-c]').innerHTML = n ? `~ ${n === 1 ? 'une bière tirée' : n + ' bières tirées'} : ${cpt.length ? 'hors du style, ' + cpt.map((x) => `${D.court[x.f]} ${x.n} sur ${n}`).join(', ') : 'toutes au style'}.` : '';
  }

  // ---------- les gestes ----------
  const choisir = (m, d, geste) => { if (m === E.m && d === E.d) return; prec = { m: E.m, d: E.d, p: courant }; const g = geste || `${NOMM[E.m]} ${nb(E.d)} g/L → ${NOMM[m]} ${nb(d)} g/L`; E.m = m; E.d = d; courant = dessiner({ geste: g }); };
  document.addEventListener('click', (e) => {
    const pil = e.target.closest('[data-pil]');
    if (pil) { const k = pil.dataset.pil, open = pil.getAttribute('aria-expanded') !== 'true'; $$('[data-pil]').forEach((x) => x.setAttribute('aria-expanded', String(open && x === pil))); $$('[data-ops]').forEach((x) => { x.hidden = !(open && x.dataset.ops === k); }); return; }
    const bl = e.target.closest('[data-bloc]');
    if (bl) { E.bloc = E.bloc === bl.dataset.bloc ? null : bl.dataset.bloc; if (E.bloc === 'tire' && !E.tirage) E.tirage = 20; courant = dessiner(); return; }
    const b = e.target.closest('[data-reglage]'); if (!b || b.disabled || b.dataset.reglage === 'ajout-cumule') return;
    const r = b.dataset.reglage, av = { m: E.m, d: E.d, p: courant };
    let geste = '';
    if (r === 'case') { choisir(b.dataset.m, +b.dataset.d); return; }
    if (r === 'houblon') { if (E.houblon === b.dataset.v) return; geste = E.houblon + ' → ' + b.dataset.v; E.houblon = b.dataset.v; if (E.second === E.houblon) E.second = ''; }
    else if (r === 'second') { if (E.second === b.dataset.v) return; geste = b.dataset.v ? '+ ' + b.dataset.v : 'seul'; E.second = b.dataset.v; }
    else if (r === 'jours') { const j = +b.dataset.v; if (E.jours === j) return; geste = 'contact ' + E.jours + ' → ' + j + ' j'; E.jours = j; }
    else if (r === 'levure') { if (E.levure === b.dataset.v) return; geste = E.levure + ' → ' + b.dataset.v; E.levure = b.dataset.v; }
    else if (r === 'vue') { if (E.vue === b.dataset.v) return; E.vue = b.dataset.v; courant = dessiner(); return; }
    else if (r === 'tirer') { E.tirage = +b.dataset.v; tirage(courant); return; }
    else return;
    prec = av; courant = dessiner({ geste });
    // une option choisie referme sa rangée : la carte remonte
    if (['houblon', 'second', 'jours'].includes(r)) { $$('[data-pil]').forEach((x) => x.setAttribute('aria-expanded', 'false')); $$('[data-ops]').forEach((x) => { x.hidden = true; }); }
  });
  // Glisser le doigt sur la carte : la case sous le doigt se choisit, se lit en grand (loupe) et le détail suit.
  const CARTE = $('[data-carte]'), LOUPE = $('[data-loupe]');
  let G = null;
  const loupe = (c, x, y) => {
    LOUPE.hidden = false; LOUPE.style.left = Math.max(70, Math.min(innerWidth - 70, x)) + 'px'; LOUPE.style.top = (y - 34) + 'px';
    $('[data-loupe-t]').textContent = `${NOMM[c.dataset.m].replace('dry hop ', '')} · ${nb(+c.dataset.d)} g/L`;
    const hs = hors(prof(c.dataset.m, +c.dataset.d));
    $('[data-loupe-h]').innerHTML = hs.length ? 'hors ' + hs.map((f) => pic(f, 13)).join('') : '<span style="color:#2f5f2a">au style</span>';
  };
  CARTE.addEventListener('pointerdown', (e) => {
    const c = e.target.closest('.cs'); if (!c) return;
    G = { id: e.pointerId, m0: E.m, d0: E.d, p0: courant };
    try { CARTE.setPointerCapture(e.pointerId); } catch (x) {}
    c.classList.add('sous'); loupe(c, e.clientX, e.clientY - 30);
    if (c.dataset.m !== E.m || +c.dataset.d !== E.d) { E.m = c.dataset.m; E.d = +c.dataset.d; courant = dessiner(); }
  });
  CARTE.addEventListener('pointermove', (e) => {
    if (!G || e.pointerId !== G.id) return;
    const el = document.elementFromPoint(e.clientX, e.clientY), c = el && el.closest('.cs');
    if (!c) { loupe($('.cs[aria-pressed="true"]'), e.clientX, e.clientY - 30); return; }
    $$('.cs.sous').forEach((x) => x.classList.remove('sous')); c.classList.add('sous');
    loupe(c, e.clientX, e.clientY - 30);
    if (c.dataset.m !== E.m || +c.dataset.d !== E.d) { E.m = c.dataset.m; E.d = +c.dataset.d; courant = dessiner({ flash: true }); $$('.cs.sous').forEach((x) => x.classList.remove('sous')); const cc = $(`.cs[data-m="${E.m}"][data-d="${E.d}"]`); if (cc) cc.classList.add('sous'); }
  });
  const fin = (e) => {
    if (!G || e.pointerId !== G.id) return;
    const g = G; G = null; LOUPE.hidden = true; $$('.cs.sous').forEach((x) => x.classList.remove('sous'));
    if (g.m0 !== E.m || g.d0 !== E.d) { prec = { m: g.m0, d: g.d0, p: g.p0 }; courant = dessiner({ geste: `${NOMM[g.m0]} ${nb(g.d0)} g/L → ${NOMM[E.m]} ${nb(E.d)} g/L` }); }
  };
  CARTE.addEventListener('pointerup', fin); CARTE.addEventListener('pointercancel', fin);
  // La pente : un curseur continu, aimanté sur la grille ; la bulle écrit la dose du doigt et la dose simulée.
  const RG = $('.pe-r'), BUL = $('[data-pe-bulle]');
  RG.addEventListener('input', () => {
    const v = +RG.value, d = SIM.pres(AX.dose_gL, v);
    BUL.hidden = false; BUL.style.left = ((v - +RG.min) / (+RG.max - +RG.min) * RG.getBoundingClientRect().width) + 'px';
    BUL.textContent = Math.abs(v - d) < 0.05 ? nb(d) + ' g/L' : '≈ ' + nb(v) + ' → ' + nb(d) + ' g/L';
    const AI = $('[data-pe-aimant]'); AI.hidden = Math.abs(v - d) < 0.05; AI.textContent = 'entre deux doses de la grille : simulé à ' + nb(d) + ' g/L';
    if (d !== E.d) choisir(E.m, d);
  });
  RG.addEventListener('change', () => { RG.value = E.d; BUL.hidden = true; $('[data-pe-aimant]').hidden = true; });
  SIM.quandLentille(() => { courant = dessiner(); });
  addEventListener('resize', () => { courant = dessiner(); });
  const q = new URLSearchParams(location.search);
  for (const k of ['houblon', 'second', 'levure', 'vue', 'bloc']) if (q.get(k) != null) E[k] = q.get(k);
  if (q.get('jours')) E.jours = +q.get('jours');
  if (q.get('case')) { const [m, d] = q.get('case').split(','); E.m = m; E.d = +d; }
  if (E.bloc === 'tire') E.tirage = 20;
  courant = dessiner();
  requestAnimationFrame(() => document.body.classList.add('pret'));
})();
