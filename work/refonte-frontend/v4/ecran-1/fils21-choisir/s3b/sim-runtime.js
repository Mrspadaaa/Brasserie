// Lot 21 · s3b · copie du moteur du navigateur de s1 (laissé intact) ; « ~ » n'a plus qu'un sens.
// Lot 21 · le moteur du navigateur, commun à s1, s2 et s3 (injecté tel quel dans chaque page).
// Il ne calcule rien de neuf : il relit la grille du moteur profil-simule (houblon × moment × dose × jours
// × levure → profil par famille, [bas, centre, haut] sur l'échelle 0–100 du style, jamais rognée) et
// aimante chaque réglage sur les valeurs de la grille : aucun entre-deux n'est affiché.
// Deux houblons : la grille des paires du moteur quand elle a le cas (2 + 2 g/L, 3 j) ; sinon la règle du
// moteur, « activités additionnées avant la courbe » : chaque profil est ramené à son activité par l'inverse
// de la courbe de saturation (correspondance-familles.json, ancre Cascade H22), les activités s'ajoutent,
// puis la courbe redonne les points. Ordre, synergie et masquage : inconnus (le moteur le dit aussi).
const SIM = (() => {
  const D = SIMDATA, F = D.F, AX = D.axes, N = F.length;
  const MAXCR = D.maxCr, MAXP = D.maxP;
  const sec = (m) => /^dry/.test(m);
  const pres = (arr, v) => arr.reduce((b, x) => (Math.abs(x - v) < Math.abs(b - v) ? x : b));
  // La levure ne compte, dans le moteur, qu'en dry hop actif ; ailleurs, la grille d'US-05 vaut pour toutes.
  const levG = (a, lev) => (a.moment === 'dryActive' ? lev : 'US-05');
  const cle = (a, lev) => [a.houblon, a.moment, pres(AX.dose_gL, a.dose_gL), sec(a.moment) ? pres(AX.jours, a.jours || 3) : '', lev].join('|');
  // Une entrée de la grille ; sans elle (Verdant ou Diamond, un houblon seul en dry hop actif), celle
  // d'US-05, avec le drapeau « effet de la levure non simulé ».
  function entree(a, lev) {
    const l = levG(a, lev), k = cle(a, l);
    if (D.grille[k]) return { t: D.grille[k], k, levureNonSimulee: false };
    const k0 = cle(a, 'US-05');
    return { t: D.grille[k0], k: k0, levureNonSimulee: l !== 'US-05' };
  }
  const av = D.avant;
  const inv = (i, p) => { const { K, c } = D.courbe[F[i]]; const q = Math.min(Math.max(0, p), c * 0.9995); return K * q / (c - q); };
  const fwd = (i, x) => { const { K, c } = D.courbe[F[i]]; return x <= 0 ? 0 : c * x / (x + K); };
  // Le profil après une liste d'ajouts : [bas, centre, haut, partiel, inconnu] par famille, et ce qu'on sait.
  function profil(ajouts, levure) {
    const as = ajouts.filter((a) => a && a.houblon);
    const info = { levureNonSimulee: false, paire: false, regle: as.length > 1, conf: [], drap: as.length > 1 ? ['saturation-partagee', 'ordre'] : [] };
    if (!as.length) return Object.assign(av.map((t) => t.slice()), { info });
    // la paire exacte du moteur
    if (as.length === 2 && as.every((a) => sec(a.moment) && a.moment === as[0].moment && a.dose_gL === 2 && (a.jours || 3) === 3)) {
      const k = [as.map((a) => a.houblon).sort().join('+'), as[0].moment, '2+2', 3, levG(as[0], levure)].join('|');
      if (D.paires[k]) { info.paire = true; info.regle = false; return Object.assign(D.paires[k].map((t) => t.slice()), { info }); }
    }
    info.cas = memeCas(as, levure || 'US-05') || null;
    const es = as.map((a) => entree(a, levure));
    info.levureNonSimulee = es.some((e) => e.levureNonSimulee);
    info.conf = es.map((e) => D.gconf[e.k]);
    for (const e of es) for (const d of D.gdrap[e.k] || []) if (!info.drap.includes(d)) info.drap.push(d);
    if (es.some((e, j) => sec(as[j].moment) && (as[j].jours || 3) > 3) && !info.drap.includes('duree-longue')) info.drap.push('duree-longue');
    if (es.length === 1) return Object.assign(es[0].t.map((t) => t.slice()), { info });
    const out = av.map((t, i) => {
      const r = [0, 1, 2].map((k) => {
        if (D.degust[i]) { // la dégustation prime : l'ajout la décale de son effet (activité de départ prise nulle)
          const x = es.reduce((s, e) => s + inv(i, Math.max(0, e.t[i][k] - t[k])), 0);
          return t[k] + fwd(i, x);
        }
        const x0 = inv(i, t[k]);
        const x = x0 + es.reduce((s, e) => s + Math.max(0, inv(i, e.t[i][k]) - x0), 0);
        return fwd(i, x);
      });
      return [r[0], r[1], r[2], es.some((e) => e.t[i][3]) ? 1 : 0, es.every((e) => e.t[i][4]) ? 1 : 0];
    });
    return Object.assign(out, { info });
  }
  const cr = (i, v) => (v - D.ech[F[i]].lo) / D.ech[F[i]].cran;
  const hors = (p) => F.filter((f, i) => !p[i][4] && p[i][1] > D.ech[f].hi);
  // La confiance : celle du moteur (mot), la plus faible ; deux ajouts hors paire : faible au plus.
  const RANG = { faible: 0, moyenne: 1, bonne: 2 };
  const memeCas = (as, lev) => (D.cas || []).find((c) => c.ajouts.length === as.length && (c.levure || 'US-05') === lev && c.ajouts.every((x, j) => x.houblon === as[j].houblon && x.moment === as[j].moment && x.dose_gL === as[j].dose_gL && (!sec(x.moment) || x.jours === as[j].jours)));
  function confiance(p) {
    if (p.info.cas) return p.info.cas.confiance;
    const cs = (p.info.conf || []).filter(Boolean);
    let c = cs.length ? cs.reduce((a, b) => (RANG[b] < RANG[a] ? b : a)) : 'moyenne';
    if (p.info.regle && RANG[c] > 0) c = 'faible';
    if (p.info.paire) c = 'moyenne';
    return c;
  }
  const fr = (x, d = 1) => String(Math.round(x * 10 ** d) / 10 ** d).replace('.', ',').replace('-', '−');
  const delta = (a, b, u = '') => { const x = a - b; if (Math.abs(x) < 0.25) return u ? 'pareil' : '='; const s = x > 0 ? '+' : '−'; const n = Math.abs(x) < 0.95 ? Math.round(Math.abs(x) * 10) / 10 : Math.round(Math.abs(x)); const v = fr(n); return s + v + (u ? ' ' + unite(u, n) : ''); };
  const unite = (u, n) => (u === 'crans' && Math.abs(n) < 2 ? 'cran' : u);
  // Géométrie d'une piste de W px : au style en crans (0 à MAXCR), en absolu en points (0 à MAXP).
  let ABS = false;
  const X = (i, v, W) => Math.max(0, Math.min(W, ABS ? v / MAXP * W : cr(i, v) / MAXCR * W));
  const zoneX = (i, W) => (ABS ? D.ech[F[i]].hi / MAXP * W : 3 / MAXCR * W);
  const px = (x) => x.toFixed(1) + 'px';
  // Pose un profil sur les rangées d'un conteneur. o.ref : profil de référence (contour) ; o.serie : la marque
  // à poser (b par défaut, b1/b2/b3 en comparaison) ; o.delta : écrire l'écart à la référence.
  function poser(root, p, o = {}) {
    const s = o.serie || 'b';
    for (const ln of root.querySelectorAll('[data-lane]')) {
      const i = F.indexOf(ln.dataset.lane), W = o.W || ln.querySelector('.lf-p').getBoundingClientRect().width;
      const z = zoneX(i, W), t = p[i];
      ln.style.setProperty('--zs', px(3 / MAXCR * W)); ln.style.setProperty('--za', px(D.ech[F[i]].hi / MAXP * W));
      const inc = !!t[4];
      const b = ln.querySelector('[data-s="' + s + '"]');
      if (b) {
        const xc = X(i, t[1], W);
        b.style.left = '0px'; b.style.width = px(inc ? 0 : Math.max(2, xc));
        b.classList.toggle('inc', inc);
        const x = b.querySelector('.lf-x'); if (x) { x.style.left = px(z); x.style.width = px(Math.max(0, xc - z)); }
        b.setAttribute('aria-label', inc ? '~ ' + D.nom[F[i]] + ' : rien de simulé, pas une preuve d’absence' : '~ ' + D.nom[F[i]] + ' ' + fr(cr(i, t[1])) + ' crans estimés, de ' + fr(cr(i, t[0])) + ' à ' + fr(cr(i, t[2])) + (t[3] ? ' au moins' : ''));
      }
      const w = ln.querySelector('[data-s="w' + (s === 'b' ? '' : s.slice(1)) + '"]');
      if (w) {
        const x0 = X(i, t[0], W), x1 = X(i, t[2], W);
        w.style.left = px(x0); w.style.width = px(inc ? 0 : Math.max(3, x1 - x0));
        w.classList.toggle('ouvert', !!t[3]); w.classList.toggle('inc', inc);
      }
      if (o.ref) {
        const g = ln.querySelector('[data-s="g"]');
        if (g) { const ri = o.ref[i]; g.style.left = '0px'; g.style.width = px(ri[4] ? 0 : Math.max(2, X(i, ri[1], W))); }
      }
      const iz = ln.querySelector('.lf-inc'); if (iz) iz.hidden = !inc;
      const d = ln.querySelector('.lf-d');
      if (d && o.delta !== false && s === 'b') {
        // un seul sens pour « ~ » (simulé, dit en tête de bloc) ; un avant inconnu s'écrit à côté du nom
        const pos = (v) => fr(v) + ' ' + unite('crans', Math.round(v * 10) / 10);
        const txt = inc ? 'inconnu' : o.ref ? delta(cr(i, t[1]), cr(i, o.ref[i][1]), 'crans') : pos(cr(i, t[1]));
        ln.classList.toggle('avinc', !inc && !!o.ref && !!o.ref[i][4]);
        if (o.flash && d.textContent !== txt && txt !== 'pareil') { d.classList.remove('flash'); void d.offsetWidth; d.classList.add('flash'); }
        d.textContent = txt; d.classList.toggle('hst', !inc && t[1] > D.ech[F[i]].hi);
      }
      ln.classList.toggle('hors', !inc && t[1] > D.ech[F[i]].hi);
      ln.classList.toggle('vide', inc);
    }
  }
  // « Ce que ça change » : les familles qui bougent le plus, avec leur écart en crans.
  function change(p, ref, n = 3) {
    return F.map((f, i) => ({ f, i, d: p[i][4] ? 0 : cr(i, p[i][1]) - cr(i, ref[i][1]) })).filter((x) => Math.abs(x.d) >= 0.5).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, n);
  }
  // La lentille : au style par défaut (D75), l'absolu à un toucher ; la page redessine.
  const rappels = [];
  const lentille = (abs) => { ABS = abs; document.body.classList.toggle('abs', abs); for (const b of document.querySelectorAll('.lentille [data-e]')) b.setAttribute('aria-checked', String((b.dataset.e === 'absolu') === abs)); rappels.forEach((r) => r()); };
  document.addEventListener('click', (e) => { const b = e.target.closest('.lentille [data-e]'); if (b) lentille(b.dataset.e === 'absolu'); });
  const quandLentille = (r) => rappels.push(r);
  if (/[?&]abs\b/.test(location.search)) setTimeout(() => lentille(true), 0);
  const ORDRE_DR = ['amertume', 'duree-longue', 'saturation-partagee', 'saturation', 'geraniol-citronellol', 'biotransformation-thiols', 'hop-creep', 'ordre'];
  const pourquoi = (p, n = 2, actif = false) => ORDRE_DR.filter((id) => (p.info.drap || []).includes(id) && (actif || !/geraniol|thiols/.test(id))).slice(0, n).map((id) => ({ id, ...(D.drapeaux[id] || { titre: id }) }));
  return { unite, pourquoi, D, F, AX, sec, pres, cle, profil, cr, hors, confiance, fr, delta, poser, change, quandLentille, X, zoneX, MAXCR, MAXP, get abs() { return ABS; } };
})();
