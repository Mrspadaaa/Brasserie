/* Un seul radar pour toute la base (lot 4 intégré, D39) : Ma bière, Suggestions, Comparer et la
   fiche du houblon partagent la roue, les échelles, les traits, les opacités et les libellés.
   SVG maison : d3-shape (lineRadial, curveLinearClosed) et d3-scale (scaleLinear) pour la
   géométrie, motion pour le balayage d'une voie à l'autre (window.D3, window.MO : lib-radar.js).
   Grammaire (p11 et les silhouettes des fiches) : le repère en fond gris (la zone du style) ou en
   contour (l'avant), le sujet plein translucide, des points aux sommets ; un sommet « non établi »
   est creux. Jamais de tirets ni de pointillés.
   La couleur d'alerte ne vit que sur « ma bière face à la cible » (D40) : la part de ma bière qui
   dépasse la zone (Ma bière), le sommet de l'avant au-dessus de la zone (Suggestions). Jamais sur
   une voie, un houblon ou une fiche.
   Contrat D24 : data-radar, data-objet, data-axes (ordre de la roue des arômes du pack, sens
   horaire depuis le haut), data-serie et data-valeurs alignées sur data-axes, au plus 2 séries
   hors zone par radar.
   D48 (« Il y a pas 12 radar ? » ; « Ni là ») : les 12 familles partout, chacune toujours à la
   même place de la roue (agrumes en haut, fiche comprise). Une famille sans valeur (non située
   dans ma bière) garde son axe : son secteur est hachuré (data-inconnu), son libellé gris, sa
   valeur vide dans data-valeurs, et la silhouette ne relie que les familles connues (elle se
   referme par le centre au bord d'un secteur inconnu). Pour les fiches, « non décrit » est une
   valeur (0), pas une inconnue : le houblon y est au centre, libellé gris.
   Échelles : ma bière, la zone et les voies en intensité continue 0–3 du pack ; les fiches en
   citations 0–2. Aucun chiffre calculé : les valeurs du pack sont placées, rien d'autre. */
const RADAR = (() => {
  const ENC = '#111', GRIS = '#6e6e6e', ZONE_F = '#ececec', ZONE_T = '#c4c4c4', GRILLE = '#e2e2e2', MUET = '#9a9a9a';
  // Mêmes épaisseurs et opacités partout (D39) : sujet 2 et 0,18 ; repère en contour 1,5 ; accent 0,55.
  const OP = 0.18, OP_ACC = 0.55, T_SUJET = 2, T_REPERE = 1.5, GAP = 8;
  const ROUE = D.roue.map((r) => r.f);
  const POLICE = '-apple-system, system-ui, "Segoe UI", Roboto, sans-serif';
  const CTX = document.createElement('canvas').getContext('2d');
  const largeur = (t, px, gras) => { CTX.font = (gras ? 650 : 400) + ' ' + px + 'px ' + POLICE; return CTX.measureText(t).width; };
  const mots = (fs) => fs.map((f) => D.court[f].toLowerCase()).join(', ');
  let RID = 0;

  /* Cadre : libellés mesurés (le rayon s'adapte pour que tous tiennent), anneaux, rayons, couches.
     Les couches du dessin sont dans un groupe centré : P(k, v) y place une valeur sur l'axe k. */
  function cadre(cont, o) {
    const axes = o.axes, n = axes.length, W = o.W || 358, H = o.H, px = o.taille || 14;
    const svg = sv('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, class: 'rdr', 'data-radar': '', 'data-objet': o.objet, 'data-axes': axes.join(','), role: 'img', 'aria-label': o.label });
    cont.append(svg);
    const defs = sv('defs', {}, svg);
    const ang = (k) => (2 * Math.PI * k) / n;
    const lib = axes.map((f, k) => ({ nom: D.court[f], compte: o.compte ? o.compte(f, k) : null, gras: D.attendues.includes(f), fill: o.couleur ? o.couleur(f, k) : ENC }));
    const deux = (k) => !!lib[k].compte && Math.abs(Math.sin(ang(k))) > 0.45;
    const larg = lib.map((l, k) => (deux(k) ? Math.max(largeur(l.nom, px, l.gras), largeur(l.compte, 12)) : largeur(l.nom, px, l.gras) + (l.compte ? largeur(' ' + l.compte, 12) : 0)));
    const cx = W / 2, cy = o.cy || H / 2;
    let R = o.Rmax || 140;
    axes.forEach((f, k) => {
      const s = Math.sin(ang(k)), c = Math.cos(ang(k)), hl = deux(k) ? px + 16 : px + 3;
      if (Math.abs(s) > 0.2) R = Math.min(R, (W / 2 - 3 - larg[k]) / Math.abs(s) - GAP);
      if (c > 0.3) R = Math.min(R, (cy - 4 - hl * (deux(k) ? 0.5 : 1)) / c - GAP);
      if (c < -0.3) R = Math.min(R, (H - cy - 4 - hl * (deux(k) ? 0.5 : 1)) / -c - GAP);
    });
    const r = D3.scaleLinear().domain([0, o.max]).range([R * 0.12, R]).clamp(true);
    const ligne = D3.lineRadial().angle((d, k) => ang(k)).radius((d) => r(d)).curve(D3.curveLinearClosed);
    const P = (k, v) => [Math.sin(ang(k)) * r(v), -Math.cos(ang(k)) * r(v)];
    const grille = sv('g', { class: 'c-grille', transform: 'translate(' + cx + ',' + cy + ')' }, svg);
    const centre = sv('g', { class: 'c-dessin', transform: 'translate(' + cx + ',' + cy + ')' }, svg);
    const C = {};
    for (const k of ['zone', 'inconnu', 'series', 'marques', 'visees']) C[k] = sv('g', { class: 'c-' + k }, centre);
    const labG = sv('g', { class: 'c-lab' }, svg);
    for (const v of o.anneaux || []) sv('path', { d: ligne(axes.map(() => v)), fill: 'none', stroke: v === o.max ? '#d6d6d6' : GRILLE, 'stroke-width': 1 }, grille);
    axes.forEach((f, k) => { const a = P(k, 0), b = P(k, o.max); sv('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: GRILLE, 'stroke-width': 1 }, grille); });
    // Libellés, sens horaire depuis le haut ; le compte des fiches sous le nom sur les côtés.
    const textes = lib.map((l, k) => {
      const s = Math.sin(ang(k)), c = Math.cos(ang(k)), q = [cx + s * (R + GAP), cy - c * (R + GAP)];
      const y = deux(k) ? q[1] - 3 : c > 0.3 ? q[1] - 4 : c < -0.3 ? q[1] + px - 1 : q[1] + px / 3;
      const t = sv('text', { x: q[0].toFixed(1), y: y.toFixed(1), 'font-size': px, 'font-weight': l.gras ? 650 : 400, fill: l.fill, 'text-anchor': s > 0.2 ? 'start' : s < -0.2 ? 'end' : 'middle', 'data-fam': axes[k] }, labG);
      t.textContent = l.nom;
      if (l.compte) sv('tspan', deux(k) ? { x: q[0].toFixed(1), dy: 15, 'font-size': 12, 'font-weight': 400, fill: GRIS } : { 'font-size': 12, 'font-weight': 400, fill: GRIS }, t).textContent = (deux(k) ? '' : ' ') + l.compte;
      return t;
    });
    // Échelle le long de l'axe du haut (faible, moyen, marqué ; cité, marqué).
    for (const [v, t] of o.echelle || []) { const p = P(0, v); sv('text', { x: cx + p[0] + 9, y: cy + p[1] + 4, 'font-size': 12, fill: '#8a8a8a', stroke: '#fff', 'stroke-width': 3, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }, labG).textContent = t; }
    return { svg, defs, C, axes, n, cx, cy, R, r, P, ligne, textes, max: o.max, id: 'rd' + (++RID) };
  }

  /* La zone du style : un fond gris du bas au haut (un anneau si le bas dépasse 0). */
  function zone(g, bas, haut, op) {
    const z = sv('g', { 'data-serie': 'zone', 'data-valeurs': haut.join(','), opacity: op ?? 1 }, g.C.zone);
    sv('path', { d: g.ligne(haut) + (bas.some((v) => v > 0) ? g.ligne(bas) : ''), 'fill-rule': 'evenodd', fill: ZONE_F, stroke: ZONE_T, 'stroke-width': 1 }, z);
    return z;
  }
  /* D48 : la silhouette ne relie que les familles connues. Toutes connues : un contour fermé. Sinon,
     chaque suite de familles connues voisines est un trait ouvert, et son remplissage se referme par
     le centre au bord du secteur inconnu (pas de zigzag à travers ce qu'on ignore). */
  function traces(g, vals) {
    if (vals.every((v) => v != null)) { const d = g.ligne(vals); return { plein: d, trait: d }; }
    const n = vals.length, suites = [];
    const k0 = vals.findIndex((v) => v == null);
    let cur = [];
    for (let j = 1; j <= n; j++) { const k = (k0 + j) % n; if (vals[k] == null) { if (cur.length) suites.push(cur); cur = []; } else cur.push(k); }
    const pts = (s) => s.map((k) => g.P(k, vals[k]).map((x) => x.toFixed(1)).join(','));
    return { plein: suites.map((s) => 'M0,0L' + pts(s).join('L') + 'Z').join(''), trait: suites.filter((s) => s.length > 1).map((s) => 'M' + pts(s).join('L')).join('') };
  }
  /* Une série : pleine translucide (sujet) ou en contour (repère). */
  function serie(g, s) {
    const e = sv('g', { 'data-serie': s.nom, 'data-valeurs': s.valeurs.map((v) => (v == null ? '' : v)).join(','), opacity: s.op ?? 1 }, g.C.series);
    const t = traces(g, s.valeurs);
    if (s.plein) s.fond = sv('path', { d: t.plein, fill: s.couleur, 'fill-opacity': OP, stroke: 'none' }, e);
    s.chemin = sv('path', { d: t.trait, fill: 'none', stroke: s.couleur, 'stroke-width': s.plein ? T_SUJET : T_REPERE, 'stroke-linejoin': 'round' }, e);
    s.maj = (vals) => { const x = traces(g, vals); if (s.fond) s.fond.setAttribute('d', x.plein); s.chemin.setAttribute('d', x.trait); };
    s.g = e;
    return e;
  }
  /* D48 : le secteur d'une famille sans valeur, hachuré, à sa place dans la roue. */
  function inconnus(g, fams) {
    if (!fams.length) return;
    const id = g.id + '-hachure';
    const pat = sv('pattern', { id, width: 5, height: 5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, g.defs);
    sv('line', { x1: 0, y1: 0, x2: 0, y2: 5, stroke: '#d2d2d2', 'stroke-width': 1.5 }, pat);
    const a = Math.PI / g.n, R = g.r(g.max);
    const p = (t) => (Math.sin(t) * R).toFixed(1) + ',' + (-Math.cos(t) * R).toFixed(1);
    for (const f of fams) {
      const t = (2 * Math.PI * g.axes.indexOf(f)) / g.n;
      sv('path', { d: 'M0,0L' + p(t - a) + 'A' + R.toFixed(1) + ',' + R.toFixed(1) + ' 0 0 1 ' + p(t + a) + 'Z', fill: 'url(#' + id + ')', 'data-inconnu': f }, g.C.inconnu);
    }
  }
  /* La part de ma bière au-dessus de la zone, en accent : la série masquée par l'intérieur de la zone. */
  function accentHors(g, s, haut) {
    const id = g.id + '-hors';
    const m = sv('mask', { id, maskUnits: 'userSpaceOnUse', x: -g.cx, y: -g.cy, width: g.cx * 2, height: g.svg.getAttribute('height') }, g.defs);
    sv('rect', { x: -g.cx, y: -g.cy, width: g.cx * 2, height: g.svg.getAttribute('height'), fill: '#fff' }, m);
    sv('path', { d: g.ligne(haut), fill: '#000' }, m);
    sv('path', { d: traces(g, s.valeurs).plein, fill: ACC, 'fill-opacity': OP_ACC, stroke: 'none', mask: 'url(#' + id + ')' }, s.g);
  }
  function point(parent, p, a) { return sv('circle', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), ...a }, parent); }
  /* Ma visée (posée par une direction ou un geste) : un losange creux sur l'axe, échelle absolue. */
  function visees(g) {
    for (const f of Object.keys(ETAT.viseeAbs || {})) {
      const k = g.axes.indexOf(f);
      if (k < 0) continue;
      sv('path', { d: losange(g.P(k, ETAT.viseeAbs[f]), 6), fill: '#fff', stroke: ENC, 'stroke-width': 1.5 }, g.C.visees);
    }
  }

  /* Pastille d'une rangée (légende sans tirets) : sujet plein, contour, zone, point plein ou creux. */
  function pastille(t) {
    const s = sv('svg', { width: 18, height: 14, 'aria-hidden': 'true', class: 'pst' });
    if (t === 'zone') sv('rect', { x: 1, y: 2, width: 16, height: 10, rx: 2, fill: ZONE_F, stroke: ZONE_T }, s);
    else if (t === 'sujet' || t === 'voie') sv('rect', { x: 1, y: 2, width: 16, height: 10, rx: 2, fill: t === 'voie' ? GRIS : ENC, 'fill-opacity': OP, stroke: t === 'voie' ? GRIS : ENC, 'stroke-width': T_SUJET }, s);
    else if (t === 'contour') sv('rect', { x: 1.5, y: 2.5, width: 15, height: 9, rx: 2, fill: 'none', stroke: ENC, 'stroke-width': T_REPERE }, s);
    else if (t === 'inconnu') { sv('rect', { x: 1, y: 2, width: 16, height: 10, rx: 2, fill: '#fff', stroke: '#d2d2d2' }, s); sv('path', { d: 'M2,11L8,3M6,11L12,3M10,11L16,3', stroke: '#c4c4c4', 'stroke-width': 1.3 }, s); }
    else sv('circle', { cx: 9, cy: 7, r: 4.5, fill: t === 'plein' ? ENC : t === 'acc' ? ACC : '#fff', stroke: t === 'acc' ? ACC : t === 'muet' ? MUET : t === 'creux-gris' ? GRIS : ENC, 'stroke-width': 1.6 }, s);
    return s;
  }
  /* Une rangée par série, sous le radar : ce qui la distingue ; un toucher l'isole. */
  function rangees(rs, redraw) {
    return h('ul', { class: 'series', 'aria-label': 'Séries du radar' }, rs.map((r, n) => {
      const corps = [pastille(r.pastille), h('b', {}, r.titre), r.cle ? h('span', { class: 'cle' }, r.cle) : null, r.texte ? h('span', { class: 'fams' }, r.texte) : null];
      if (!r.focus) return h('li', {}, h('div', { class: 'serie fixe' }, corps));
      const on = ETAT.focusSerie === r.focus;
      return h('li', {}, h('button', {
        class: 'serie', 'aria-pressed': String(on), 'data-booster': n === 0 ? 'série' : null, 'data-k': 's' + r.focus,
        'aria-label': on ? 'Revoir toutes les séries' : 'Isoler ' + r.quoi + ' sur le radar',
        onclick: () => { ETAT.focusSerie = on ? null : r.focus; redraw(); },
      }, corps));
    }));
  }
  const terne = (cle) => (ETAT.focusSerie && ETAT.focusSerie !== cle ? 0.15 : 1);

  /* Ma bière (objets 1 et 2) : les 12 familles (D48) ; ma bière d'abord dégustée, sinon prévue ;
     une famille non située reste à sa place, en secteur inconnu. */
  function donneesBiere() {
    const axes = ROUE;
    const val = axes.map((f) => (D.continu.biere[fi(f)] != null ? D.continu.biere[fi(f)] : null));
    const bas = axes.map((f) => D.continu.cible[fi(f)].bas), haut = axes.map((f) => D.continu.cible[fi(f)].haut);
    return { axes, hors: axes.filter((f, k) => val[k] == null), val, bas, haut,
      deg: axes.map((f) => D.profil[fi(f)].source === 'dégustation'), dessus: axes.map((f, k) => val[k] != null && val[k] > haut[k] + 0.05) };
  }
  function biere(cont, redraw) {
    const b = donneesBiere();
    const g = cadre(cont, {
      objet: 'biere-cible', axes: b.axes, max: 3, H: 330, taille: 14, anneaux: [1, 2, 3], echelle: [[0.5, 'faible'], [1.5, 'moyen'], [2.5, 'marqué']],
      couleur: (f, k) => (b.val[k] == null ? MUET : b.dessus[k] ? ACC : ENC),
      label: 'Radar de ma bière dans la zone du style, intensité de 0 à 3 ; en accent, la part au-dessus de la zone ; hachurées, les familles non situées',
    });
    zone(g, b.bas, b.haut, terne('zone'));
    inconnus(g, b.hors);
    const s = { nom: 'ma bière', valeurs: b.val, couleur: ENC, plein: true, op: terne('ma bière') };
    serie(g, s);
    if (b.dessus.some(Boolean)) accentHors(g, s, b.haut);
    const m = sv('g', { opacity: terne('ma bière') }, g.C.marques);
    b.val.forEach((v, k) => { if (v != null) point(m, g.P(k, v), b.deg[k]
      ? { r: 5, fill: b.dessus[k] ? ACC : ENC }
      : { r: 4, fill: '#fff', stroke: b.dessus[k] ? ACC : ENC, 'stroke-width': 1.6 }); });
    visees(g);
    const au = b.axes.filter((f, k) => b.dessus[k]), prevu = b.axes.filter((f, k) => b.val[k] != null && !b.deg[k] && !b.dessus[k]);
    const degTxt = 'dégusté' + (D.degustation ? ' ' + D.degustation.date : '');
    cont.append(rangees([
      au.length ? { focus: 'ma bière', quoi: 'ma bière', pastille: 'acc', titre: 'Au-dessus', cle: mots(au), texte: b.deg[b.axes.indexOf(au[0])] ? degTxt : 'prévu' }
        : { focus: 'ma bière', quoi: 'ma bière', pastille: 'sujet', titre: 'Ma bière', texte: 'dans la zone' },
      prevu.length ? { pastille: 'creux', titre: 'Prévu', texte: mots(prevu) } : null,
      { focus: 'zone', quoi: 'la zone du style', pastille: 'zone', titre: 'Zone du style', cle: 'attendues', texte: mots(b.axes.filter((f) => D.attendues.includes(f))) },
      b.hors.length ? { pastille: 'inconnu', titre: 'Non situées', texte: mots(b.hors) } : null,
    ].filter(Boolean), redraw));
  }

  /* Suggestions (objet 4) : l'avant en contour, UNE voie pleine en gris (jamais d'accent : D15,
     D40) ; puces ou balayage du radar pour passer d'une voie à l'autre (geste de p08 : la
     silhouette suit le doigt, un ressort finit le passage). Là où le moteur n'établit pas
     d'effet, l'après recopie l'avant et son sommet est creux. */
  function apresDe(v, b) {
    const etabli = b.axes.map((f) => v.apresC[fi(f)] != null);
    return { etabli, valeurs: b.axes.map((f, k) => (etabli[k] ? v.apresC[fi(f)] : b.val[k])) };
  }
  function voies(cont, ctx, redraw) {
    const vs = ctx.marq.length ? ctx.marq : ctx.liste.filter((v) => !v.nouvelle).slice(0, 1);
    if (!vs.length) return;
    if (!vs.some((v) => v.rang === ETAT.voieRadar)) ETAT.voieRadar = vs[0].rang;
    let i = vs.findIndex((v) => v.rang === ETAT.voieRadar);
    const b = donneesBiere();
    const A = vs.map((v) => apresDe(v, b));
    const titre = (v) => (v.cles.length ? nomsHoublons(v.houblons) : v.houblons.join(' + '));
    let puces = null;
    if (vs.length > 1) {
      puces = h('div', { class: 'chips puces-v', role: 'group', 'aria-label': 'Voie montrée sur le radar (ou balayer le radar)' }, vs.map((v, k) => h('button', {
        class: 'chip', 'aria-pressed': String(k === i), 'data-k': 'pv' + v.rang, 'data-booster': k === (i + 1) % vs.length ? 'voie suivante' : null,
        'aria-label': 'Montrer la voie ' + v.label, onclick: () => aller(k),
      }, titre(v))));
      cont.append(puces);
    }
    const g = cadre(cont, {
      objet: 'voies', axes: b.axes, max: 3, H: 286, taille: 14, anneaux: [1, 2, 3],
      couleur: (f, k) => (b.val[k] == null ? MUET : ENC),
      label: 'Radar des voies : l\'avant en contour, l\'après d\'une voie plein ; hachurées, les familles non situées ; balayer pour passer à la voie suivante',
    });
    zone(g, b.bas, b.haut, terne('zone'));
    inconnus(g, b.hors);
    const nomV = (v) => 'après ' + v.houblons.join(' + ');
    const sV = { nom: nomV(vs[i]), valeurs: A[i].valeurs, couleur: GRIS, plein: true, op: terne('voie') };
    serie(g, sV);
    const sA = { nom: 'avant', valeurs: b.val, couleur: ENC, plein: false, op: terne('avant') };
    serie(g, sA);
    const mV = sv('g', { opacity: terne('voie') }, g.C.marques), mA = sv('g', { opacity: terne('avant') }, g.C.marques);
    const marquerVoie = (vals, et) => { mV.innerHTML = ''; vals.forEach((v, k) => { if (v != null) point(mV, g.P(k, v), et[k] ? { r: 3.5, fill: GRIS } : { r: 3.5, fill: '#fff', stroke: GRIS, 'stroke-width': 1.5 }); }); };
    marquerVoie(A[i].valeurs, A[i].etabli);
    // Le sommet de l'avant au-dessus de la zone porte l'accent (ma bière face à la cible).
    b.val.forEach((v, k) => { if (v != null) point(mA, g.P(k, v), b.dessus[k] ? { r: 4.5, fill: ACC } : { r: 2.5, fill: ENC }); });
    visees(g);
    // Une image du passage de la voie i vers la voie j, avancée de t (0 à 1) ; une famille inconnue reste vide.
    const image = (j, t) => {
      const vals = A[i].valeurs.map((x, k) => { const y = A[j].valeurs[k]; return x == null || y == null ? (t < 0.5 ? x : y) : x + (y - x) * t; });
      sV.maj(vals);
      marquerVoie(vals, t < 0.5 ? A[i].etabli : A[j].etabli);
    };
    let anim = null;
    function poser(j) { ETAT.voieRadar = vs[j].rang; ETAT.focusSerie = null; redraw(); }
    function aller(j, t0 = 0, vitesse = 0) {
      if (j === i || j < 0 || j >= vs.length) return;
      if (anim) anim.stop();
      if (REDUIT || !window.MO) { poser(j); return; }
      anim = MO.animate(t0, 1, { type: 'spring', stiffness: 330, damping: 33, velocity: vitesse, onUpdate: (t) => image(j, Math.max(0, Math.min(1, t))), onComplete: () => { anim = null; poser(j); } });
    }
    if (vs.length > 1) {
      // Au clavier et au toucher sans geste, les puces font la même chose (WCAG 2.5.7).
      const svg = g.svg, LARG = 358 * 0.6;
      svg.style.touchAction = 'pan-y';
      svg.setAttribute('data-geste', 'balayer');
      let gs = null;
      svg.addEventListener('pointerdown', (e) => { gs = { x: e.clientX, y: e.clientY, on: false, hist: [[e.clientX, performance.now()]] }; });
      svg.addEventListener('pointermove', (e) => {
        if (!gs) return;
        const dx = e.clientX - gs.x, dy = e.clientY - gs.y;
        if (!gs.on) {
          if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) { gs.on = true; try { svg.setPointerCapture(e.pointerId); } catch (x) { /* rien */ } svg.classList.add('balaye'); }
          else if (Math.abs(dy) > 10) { gs = null; return; } else return;
        }
        gs.hist.push([e.clientX, performance.now()]);
        if (gs.hist.length > 5) gs.hist.shift();
        const j = (i + (dx < 0 ? 1 : -1) + vs.length) % vs.length;
        gs.j = j; gs.t = Math.min(1, Math.abs(dx) / LARG);
        image(j, gs.t);
      });
      const lacher = () => {
        const s = gs; gs = null;
        svg.classList.remove('balaye');
        if (!s || !s.on) return;
        const [x0, t0] = s.hist[0], [x1, t1] = s.hist[s.hist.length - 1];
        const v = t1 > t0 ? (x1 - x0) / (t1 - t0) : 0;
        if (s.t > 0.35 || Math.abs(v) > 0.45) aller(s.j, s.t, (Math.abs(v) * 1000) / LARG);
        else if (!REDUIT && window.MO) anim = MO.animate(s.t, 0, { type: 'spring', stiffness: 330, damping: 33, onUpdate: (t) => image(s.j, Math.max(0, t)), onComplete: () => { anim = null; image(s.j, 0); } });
        else image(s.j, 0);
      };
      svg.addEventListener('pointerup', lacher);
      svg.addEventListener('pointercancel', lacher);
    }
    const v = vs[i], a = A[i];
    const connu = (k) => a.etabli[k] && b.val[k] != null;
    const monte = b.axes.filter((f, k) => connu(k) && a.valeurs[k] > b.val[k]), baisse = b.axes.filter((f, k) => connu(k) && a.valeurs[k] < b.val[k]);
    const ne = b.axes.filter((f, k) => !a.etabli[k] && b.val[k] != null);
    const fl = (monte.length ? '↑ ' + mots(monte) : '') + (baisse.length ? ' ↓ ' + mots(baisse) : '') || '≈ inchangé';
    cont.append(rangees([
      // Les familles non situées se voient hachurées sur la roue (D48) : la rangée ne les recompte plus.
      { focus: 'avant', quoi: 'l\'avant', pastille: 'contour', titre: 'Avant' },
      { focus: 'voie', quoi: 'la voie', pastille: 'voie', titre: titre(v), texte: ne.length ? h('span', {}, fl, h('span', { class: 'ne' }, pastille('creux-gris'), 'non établi')) : fl },
    ], redraw));
  }

  /* Comparer (objet 3) : les fiches, en citations 0–2 ; un petit radar par houblon (la même roue de
     12 familles que la fiche, D48), et ce que sa fiche est seule à citer. Aucun repère tiré de ma
     bière. Toucher un petit l'agrandit. « Non décrit » est une valeur (0) : libellé gris. */
  function donneesHoublons(noms) {
    const axes = ROUE;
    const val = (n) => axes.map((f) => D.fiches[n].niv[fi(f)]);
    return { axes, val,
      seul: (n) => axes.filter((f) => noms.length > 1 && noms.every((m) => m === n || D.fiches[n].niv[fi(f)] > D.fiches[m].niv[fi(f)])) };
  }
  function houblon(g, nom, vals) {
    serie(g, { nom, valeurs: vals, couleur: ENC, plein: true });
    vals.forEach((v, k) => { if (v) point(g.C.marques, g.P(k, v), v === 2 ? { r: 3.2, fill: ENC } : { r: 3, fill: '#fff', stroke: ENC, 'stroke-width': 1.4 }); });
  }
  function houblons(cont, noms, redraw) {
    const d = donneesHoublons(noms);
    const grand = noms.includes(ETAT.compGrand) ? ETAT.compGrand : null;
    const couleur = (n) => (f, k) => (d.val(n)[k] ? ENC : MUET);
    const legende = (n) => {
      const s = d.seul(n);
      // Avec les 12 familles sur chaque petit radar (D48), seul ce qu'une fiche est seule à citer s'écrit.
      return [h('b', {}, h('span', { 'data-houblon': cleDe(n) }, n)), s.length ? h('span', { class: 'p gris' }, 'seul') : null, s.length ? h('span', { class: 'tags' }, s.map((x) => h('span', { class: 'tag-f' }, D.court[x].toLowerCase()))) : null];
    };
    const basculer = (n) => () => { ETAT.compGrand = ETAT.compGrand === n ? null : n; redraw(); };
    if (grand) {
      const pan = h('div', { class: 'pm-grand', role: 'button', tabindex: '0', 'data-k': 'pg', 'aria-label': 'Revenir aux petits radars', onclick: basculer(grand) });
      cont.append(pan);
      pan.append(h('div', { class: 'pm-t ligne' }, legende(grand)));
      houblon(cadre(pan, { objet: 'houblons', axes: d.axes, max: 2, H: 282, taille: 14, anneaux: [1, 2], echelle: [[1, 'cité'], [2, 'marqué']], couleur: couleur(grand),
        label: 'Radar de la fiche de ' + grand + ' : 0 non décrit, 1 cité, 2 marqué' }), grand, d.val(grand));
      for (const n of noms.filter((x) => x !== grand)) {
        cont.append(h('div', { class: 'pm compact', role: 'button', tabindex: '0', 'data-k': 'pc' + n, 'aria-label': 'Agrandir le radar de ' + n, onclick: basculer(n) },
          vignette(d.axes, d.val(n)), h('div', { class: 'pm-t ligne' }, legende(n))));
      }
    } else {
      // Petits multiples : même largeur pour tous (≥ 42 % de l'écran), hauteur selon le nombre.
      const H = noms.length > 3 ? 142 : noms.length > 2 ? 166 : 196;
      noms.forEach((n, k) => {
        const pan = h('div', { class: 'pm', role: 'button', tabindex: '0', 'data-k': 'pm' + n, 'data-booster': k === 0 ? 'agrandir un radar' : null, 'aria-label': 'Agrandir le radar de ' + n, onclick: basculer(n) });
        cont.append(pan);
        houblon(cadre(pan, { objet: 'houblons', axes: d.axes, max: 2, W: 236, H, taille: 12, anneaux: [1, 2], couleur: couleur(n),
          label: 'Radar de la fiche de ' + n + ' : 0 non décrit, 1 cité, 2 marqué' }), n, d.val(n));
        pan.append(h('div', { class: 'pm-t' }, legende(n)));
      });
    }
  }
  /* Vignette : la même silhouette en petit, sans libellés (ce n'est pas un radar de lecture). */
  function vignette(axes, vals) {
    const S = 44, R = 19, n = axes.length;
    const s = sv('svg', { width: S, height: S, viewBox: '0 0 ' + S + ' ' + S, 'aria-hidden': 'true', class: 'vig' });
    const r = D3.scaleLinear().domain([0, 2]).range([R * 0.12, R]);
    const l = D3.lineRadial().angle((d, k) => (2 * Math.PI * k) / n).radius((d) => r(d)).curve(D3.curveLinearClosed);
    const g = sv('g', { transform: 'translate(22,22)' }, s);
    sv('path', { d: l(axes.map(() => 2)), fill: '#fff', stroke: '#d6d6d6' }, g);
    sv('path', { d: l(vals), fill: ENC, 'fill-opacity': OP, stroke: ENC, 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, g);
    return s;
  }

  /* La roue de la fiche d'un houblon : 12 axes de la roue (ce que ses fiches ne décrivent pas se
     voit aussi), citations 0–2, « N/M » fiches sous chaque famille citée. Ni zone ni accent : la
     fiche décrit le houblon, pas le problème de ma bière. */
  function roue(cont, F, o) {
    const lv = Object.fromEntries(F.aromes.map((a) => [a.f, a]));
    const vals = ROUE.map((f) => (lv[f] ? lv[f].lv : 0));
    const g = cadre(cont, {
      objet: 'fiche', axes: ROUE, max: 2, W: o.W, H: o.H, taille: 12, anneaux: [1, 2],
      couleur: (f, k) => (vals[k] ? ENC : MUET), compte: (f, k) => (vals[k] ? lv[f].n + '/' + lv[f].of : null),
      label: 'Silhouette de ' + F.nom + ' selon ses fiches : ' + (ROUE.filter((f, k) => vals[k]).map((f) => D.court[f].toLowerCase() + ' ' + lv[f].n + ' sur ' + lv[f].of).join(', ') || 'aucun arôme décrit'),
    });
    houblon(g, F.nom, vals);
    return g.svg;
  }
  return { biere, voies, houblons, roue, pastille };
})();
