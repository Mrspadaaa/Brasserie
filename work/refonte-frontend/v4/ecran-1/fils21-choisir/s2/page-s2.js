// s2 · Trois plans côte à côte : l'état des trois plans, le plan touché, le plan de référence, le choix.
(() => {
  const D = SIM.D, AX = SIM.AX;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const cas = (id) => D.cas.find((c) => c.id === id);
  const copie = (c) => ({ ajouts: c.ajouts.map((a) => ({ houblon: a.houblon, moment: a.moment, dose_gL: a.dose_gL, jourDebut: a.jourDebut, jours: a.jours })), levure: c.levure || 'US-05' });
  const PL = { A: copie(cas('K3-citra3-galaxy7')), B: copie(cas('K3-citra3-idaho7-5')), C: copie(cas('K2-citra')) };
  const IDS = ['A', 'B', 'C'];
  let foc = 'A', ref = 'C', choisi = null, classe = null, vue = 'val';
  const LANES = $('.prof .lns');
  const NOMM = { b60: '60′', b10: '10′', wp: 'whirlpool', dryActive: 'actif', dryPost: 'après' };
  const nb = (x) => String(x).replace('.', ',');
  const ALPHA = {};
  for (const el of $$('[data-vr]')) { const a = el.querySelector('[data-role="alpha"]'); ALPHA[el.dataset.vr] = a ? a.outerHTML.replace('data-role="alpha"', 'data-role="alpha" data-houblon="' + el.dataset.vr + '"') : ''; }

  const prof = {};
  function dessiner(o = {}) {
    for (const id of IDS) prof[id] = SIM.profil(PL[id].ajouts, PL[id].levure);
    IDS.forEach((id, k) => SIM.poser(LANES, prof[id], { serie: 'b' + (k + 1), delta: false, flash: o.flash }));
    // la bande du plan touché, et l'écart écrit à la référence
    const kf = IDS.indexOf(foc) + 1;
    LANES.className = 'lns f' + kf;
    for (const ln of $$('[data-lane]', LANES)) {
      const i = SIM.F.indexOf(ln.dataset.lane), W = ln.querySelector('.lf-p').getBoundingClientRect().width, t = prof[foc][i], r = prof[ref][i];
      const w = ln.querySelector('[data-s="w' + kf + '"]');
      if (w) { const x0 = SIM.X(i, t[0], W), x1 = SIM.X(i, t[2], W); w.style.left = x0.toFixed(1) + 'px'; w.style.width = (t[4] ? 0 : Math.max(3, x1 - x0)).toFixed(1) + 'px'; w.classList.toggle('ouvert', !!t[3]); }
      const d = ln.querySelector('.lf-d');
      const txt = t[4] ? 'inconnu' : foc === ref || r[4] ? '~' + SIM.fr(SIM.cr(i, t[1])) + ' ' + SIM.unite('crans', SIM.cr(i, t[1])) : SIM.delta(SIM.cr(i, t[1]), SIM.cr(i, r[1]), 'crans');
      if (o.flash && d.textContent !== txt) { d.classList.remove('flash'); void d.offsetWidth; d.classList.add('flash'); }
      d.textContent = txt; d.dataset.nature = 'simule';
      d.classList.toggle('hst', !t[4] && t[1] > D.ech[SIM.F[i]].hi);
      const vide = IDS.every((id) => prof[id][i][4]); ln.classList.toggle('vide', vide);
      const iz = ln.querySelector('.lf-inc'); if (iz) iz.hidden = !vide;
      ln.classList.toggle('cl', classe === ln.dataset.lane);
    }
    // ce que ça change, écrit
    const fam = (x, rp) => `<b style="color:${D.texte[x.f]}">${D.court[x.f]}</b> ${SIM.delta(SIM.cr(x.i, prof[foc][x.i][1]), SIM.cr(x.i, rp[x.i][1]), 'crans')}`;
    const ch = foc === ref ? [] : SIM.change(prof[foc], prof[ref], 3);
    const hs = SIM.hors(prof[foc]);
    $('[data-role="ecart"]').innerHTML = foc === ref ? `~ <b>${foc}</b> est la référence : touche un autre plan pour lire l’écart.` : `~ <b>${foc}</b> contre <b>${ref}</b> : ${ch.length ? ch.map((x) => fam(x, prof[ref])).join(', ') : 'presque pareil'}${hs.length ? ` ; <span class="hst">${hs.length} hors du style 16D</span>` : ''}.`;
    // le classement par une famille, à la demande (le brasseur choisit)
    if (classe) {
      const i = SIM.F.indexOf(classe);
      const ord = [...IDS].sort((a, b) => prof[b][i][1] - prof[a][i][1]);
      $('[data-role="classement"]').innerHTML = `<b style="color:${D.texte[classe]}">${D.court[classe]}</b>, du plus au moins : ${ord.map((id) => `<b>${id}</b> ${prof[id][i][4] ? 'inconnu' : '~' + SIM.fr(SIM.cr(i, prof[id][i][1])) + ' ' + SIM.unite('crans', SIM.cr(i, prof[id][i][1]))}`).join(' · ')}`;
    } else $('[data-role="classement"]').innerHTML = '';
    // la vue des écarts : chaque plan contre la référence, de part et d'autre d'un trait (±3 crans)
    document.body.classList.toggle('ecart', vue === 'ecart');
    $$('[data-reglage="vue"]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === vue)));
    if (vue === 'ecart') for (const ln of $$('[data-lane]', LANES)) {
      const i = SIM.F.indexOf(ln.dataset.lane), W = ln.querySelector('.lf-p').getBoundingClientRect().width, r = prof[ref][i];
      IDS.forEach((id, k) => {
        const b = ln.querySelector('[data-s="b' + (k + 1) + '"]'), t = prof[id][i];
        const dc = t[4] || r[4] ? 0 : SIM.cr(i, t[1]) - SIM.cr(i, r[1]);
        const x = Math.max(0, Math.min(W, W / 2 + dc * (W / 2) / 3));
        b.style.left = Math.min(W / 2, x).toFixed(1) + 'px'; b.style.width = Math.max(id === ref ? 0 : 2, Math.abs(x - W / 2)).toFixed(1) + 'px';
      });
    }
    cartes(); doseEgale(); editeur(); bio(); vraies(); dock();
  }
  function cartes() {
    for (const id of IDS) {
      const c = $(`[data-plan="${id}"]`), pl = PL[id];
      c.classList.toggle('foc', id === foc);
      c.querySelector('[data-ajouts]').innerHTML = pl.ajouts.map((a, n) => `<div class="pa"><span class="pa-h"><i class="pt" style="background:${D.couleurs[a.houblon]}"></i><span data-houblon="${a.houblon}">${n ? '+ ' : ''}${a.houblon}</span></span><span class="pa-d"><span><span class="nb">${nb(a.dose_gL)}</span> g/L${SIM.sec(a.moment) ? ` · <span class="nb">${a.jours}</span> j` : ' · ' + NOMM[a.moment]}</span>${ALPHA[a.houblon] || ''}</span></div>`).join('');
      const conf = SIM.confiance(prof[id]);
      c.querySelector('[data-conf-plan]').innerHTML = `<span class="conf" role="img" aria-label="confiance ${conf}">${[0, 1, 2].map((k) => `<i class="${k < ({ faible: 1, moyenne: 2, bonne: 3 })[conf] ? 'on' : ''}"></i>`).join('')}</span>${conf}`;
      c.querySelector('[data-role="ref"]').setAttribute('aria-pressed', String(id === ref));
      c.querySelector('[data-dose-plan]').innerHTML = pl.levure !== 'US-05' || pl.ajouts.some((a) => a.moment !== 'dryPost') ? `${NOMM[pl.ajouts[0].moment]}, ${pl.levure}` : '';
      const b = c.querySelector('[data-role="choix"]'); b.setAttribute('aria-pressed', String(choisi === id)); b.textContent = choisi === id ? 'choisi' : 'choisir';
    }
  }
  function doseEgale() {
    const ds = IDS.map((id) => PL[id].ajouts.filter((a) => SIM.sec(a.moment)).reduce((s, a) => s + a.dose_gL, 0));
    const ms = IDS.map((id) => [...new Set(PL[id].ajouts.map((a) => a.moment))].join('+'));
    const eg = ds.every((d) => d === ds[0]) && ms.every((m) => m === ms[0]);
    $('[data-role="dose-egale"]').innerHTML = eg ? `à dose égale : <b><span class="nb">${nb(ds[0])}</span> g/L à cru</b> chacun, même moment` : `<span class="av">doses ou moments différents</span> : ${IDS.map((id, k) => `${id} <span class="nb">${nb(ds[k])}</span> g/L`).join(', ')} ; l’écart mêle houblon et dose`;
  }
  function editeur() {
    const pl = PL[foc];
    $('[data-ed-plan]').textContent = foc;
    const m = pl.ajouts[0].moment;
    $$('[data-reglage="moment"]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === m)));
    for (const n of [0, 1]) {
      const a = pl.ajouts[n];
      $$(`[data-reglage="houblon"][data-n="${n}"]`).forEach((b) => b.setAttribute('aria-pressed', String(a ? b.dataset.v === a.houblon : b.dataset.v === '')));
      const blk = n ? $('[data-aj2]') : null; if (blk) blk.classList.toggle('off', !a);
      if (!a) continue;
      $(`[data-v="dose${n}"] b`).textContent = nb(a.dose_gL);
      const sec = SIM.sec(a.moment);
      $(`[data-v="jours${n}"]`).innerHTML = sec ? `<b class="nb">${a.jours}</b> j` : 'sans objet';
      $$(`[data-reglage="jours"][data-n="${n}"]`).forEach((b) => { b.disabled = !sec; });
      const iD = AX.dose_gL.indexOf(a.dose_gL);
      $(`[data-reglage="dose"][data-n="${n}"][data-sens="-1"]`).disabled = iD <= 0; $(`[data-reglage="dose"][data-n="${n}"][data-sens="1"]`).disabled = iD >= AX.dose_gL.length - 1;
    }
    $$('[data-reglage="levure"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === pl.levure)));
  }
  function bio() {
    const pl = PL[foc], ms = pl.ajouts.map((a) => a.moment);
    const ph = ms.some((m) => ['b10', 'wp', 'dryActive'].includes(m)) ? 'actif' : ms.some((m) => m === 'dryPost') ? 'apres' : 'aucun';
    $$('[data-bio-k]').forEach((x) => { x.hidden = x.dataset.bioK !== pl.levure + '|' + ph; });
    $('[data-bio-ns]').hidden = !prof[foc].info.levureNonSimulee;
  }
  function vraies() { const hs = PL[foc].ajouts.map((a) => a.houblon); $$('[data-vr]').forEach((x) => { x.hidden = !hs.includes(x.dataset.vr); }); }
  function dock() {
    const d = $('[data-dock]'), g = $('[data-role="garder"]');
    if (!choisi) { d.textContent = 'aucun plan choisi'; g.disabled = true; return; }
    d.textContent = 'choisi : ' + choisi + ', ' + PL[choisi].ajouts.map((a) => a.houblon + ' ' + nb(a.dose_gL) + ' g/L').join(' + ');
    g.disabled = false;
  }

  // ---------- les gestes ----------
  const pasDe = (arr, v, s) => arr[Math.max(0, Math.min(arr.length - 1, arr.indexOf(v) + s))];
  document.addEventListener('click', (e) => {
    const ch = e.target.closest('[data-role="choix"]');
    if (ch) { const id = ch.closest('[data-plan]').dataset.plan; choisi = choisi === id ? null : id; dessiner(); return; }
    const rf = e.target.closest('[data-role="ref"]');
    if (rf) { ref = rf.closest('[data-plan]').dataset.plan; dessiner({ flash: true }); return; }
    const carte = e.target.closest('[data-plan]');
    if (carte && !e.target.closest('button')) { foc = carte.dataset.plan; dessiner({ flash: true }); return; }
    const fam = e.target.closest('.lf-n');
    if (fam) { const f = fam.closest('[data-lane]').dataset.lane; classe = classe === f ? null : f; dessiner(); return; }
    const b = e.target.closest('[data-reglage]'); if (!b || b.disabled) return;
    const pl = PL[foc], r = b.dataset.reglage, n = +(b.dataset.n || 0), a = pl.ajouts[n];
    if (r === 'moment') { for (const x of pl.ajouts) { x.moment = b.dataset.v; if (SIM.sec(x.moment) && !x.jours) x.jours = 3; } }
    else if (r === 'houblon') {
      if (!b.dataset.v) { if (n === 1) pl.ajouts.splice(1, 1); }
      else if (a) a.houblon = b.dataset.v;
      else pl.ajouts.push({ houblon: b.dataset.v, moment: pl.ajouts[0].moment, dose_gL: 2, jours: 3, jourDebut: null });
    }
    else if (r === 'dose' && a) a.dose_gL = pasDe(AX.dose_gL, a.dose_gL, +b.dataset.sens);
    else if (r === 'jours' && a) a.jours = pasDe(AX.jours, a.jours, +b.dataset.sens);
    else if (r === 'levure') pl.levure = b.dataset.v;
    else if (r === 'vue') { vue = b.dataset.v; dessiner(); return; }
    else return;
    dessiner({ flash: true });
  });
  document.addEventListener('keydown', (e) => { const c = e.target.closest && e.target.closest('[data-plan]'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); foc = c.dataset.plan; dessiner({ flash: true }); } });
  SIM.quandLentille(() => dessiner());
  addEventListener('resize', () => dessiner());
  const q = new URLSearchParams(location.search);
  if (q.get('foc')) foc = q.get('foc');
  if (q.get('classe')) classe = q.get('classe');
  if (q.get('choix')) choisi = q.get('choix');
  if (q.get('vue')) vue = q.get('vue');
  dessiner();
  requestAnimationFrame(() => document.body.classList.add('pret'));
})();
