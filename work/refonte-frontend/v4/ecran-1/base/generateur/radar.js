/* Un seul composant radar pour toute la base (base v4.3, 18.10, soir et nuit ; D62, D65, D66) :
   Ma bière, Suggestions, Comparer et la fiche du houblon passent tous par radar(). Modèle : la
   variante D3 retenue par le brasseur sur la planche des fils 7 (fils7-radar/p04 ; « P3,4,6,7
   semble pas mal »), après « Les spidergraph/radar graph resemble a rien, c'est une vrai
   régression... ».
   Géométrie : d3-scale (scaleLinear) et d3-shape (lineRadial + curveLinearClosed, sur d3-path),
   empaquetés en ligne dans lib-radar.js (window.D3) ; le reste est du SVG ordinaire ; motion
   (window.MO) pour le balayage d'une voie à l'autre.
   Plancher : chaque série est un polygone fermé sur les 12 axes, sans valeur vide (D62).
   D65 (« souvent les spidergraph ne montre pas que certaines données sont inconnus et du coup ont
   les traitements comme connue mais valeur à 0 ») : une famille sans donnée (non située dans ma
   bière ; décrite par aucune fiche dans Comparer et la fiche) se pose au centre, jamais sur
   l'anneau du zéro ; son libellé est gris et suivi de « ? », une marque creuse sur son axe, un
   secteur hachuré (data-inconnu), et la bulle au toucher dit « inconnu, ce n'est pas zéro ». Aucun
   radar n'a plus de légende écrite (19.10 : « Pas besoin d'écrire la légende sur la version
   finale » ; Ma bière et la fiche en v4.5, Comparer et Suggestions à leur intégration en v4.6).
   D66 (« Pourquoi il y a cité ? ») : aucun nom d'échelle dans le dessin, où il se lisait comme la
   valeur du libellé voisin ; les niveaux se nomment dans la bulle au toucher.
   Silhouettes pleines translucides et points aux sommets ; aucune série en tirets ni en
   pointillés (D39). Libellés entiers de 12 px, sur deux lignes si besoin, ancrés selon l'angle ;
   au toucher (ou au survol) d'un sommet, la famille et la valeur en mots.
   Couleurs, dans le radar seulement (légende comprise, dessinée dans le SVG) : ma bière et l'après
   en bleu, l'avant en contour sombre, la zone du style en fond gris, chaque houblon de Comparer
   dans sa couleur ; l'orangé d'alerte sur le seul sommet de ma bière au-dessus du style (D40).
   Contrat (controle-radar) : svg[data-radar][data-objet][data-axes] (les 12 familles de la roue,
   agrumes en haut, sens horaire), [data-serie][data-valeurs] alignées sur data-axes et
   [data-couleur]. Aucun chiffre calculé : les valeurs du pack sont placées, rien d'autre. */
const RADAR = (() => {
  const TXT = '#333', ENC = '#111', GRIS = '#6e6e6e', LEG = '#555', GRILLE = '#e2e2e2', ANNEAU = '#c4c4c4', ANNEAU0 = '#e4e4e4';
  const ZONE_F = 'rgba(0,0,0,0.10)', ZONE_T = '#bdbdbd';
  const MOI = '#0072B2', AVANT = '#333';
  // Comparer : les couleurs de la page de référence (p04), loin de l'alerte et lisibles en daltonisme.
  const HOUBLONS = ['#0072B2', '#009E73', '#CC79A7', '#56B4E9'];
  // Mêmes traits et opacités partout (D39) : sujet 2 et 0,18 ; repère en contour 1,5.
  const OP = 0.18, T_SUJET = 2, T_REPERE = 1.5, PX = 12, LH = 14, GAP = 8, PAD = 3;
  // D66 : la clé d'échelle de la légende à 24 px au moins du libellé du bas.
  const ECART_LEG = 24;
  const ROUE = D.roue.map((r) => r.f);
  const POLICE = '-apple-system, system-ui, "Segoe UI", Roboto, sans-serif';
  const CTX = document.createElement('canvas').getContext('2d');
  const largeur = (t, gras) => { CTX.font = (gras ? 650 : 400) + ' ' + PX + 'px ' + POLICE; return CTX.measureText(t).width; };
  const nomF = (f) => D.court[f];
  const CLASSES_C = ['non décrit', 'cité', 'marqué'];
  const motsNiveau = (v) => (v < 0.5 ? 'à peine' : v < 1.5 ? 'faible' : v < 2.5 ? 'moyen' : 'marqué');
  const plein = (c, r) => ({ r, fill: c, stroke: '#fff', 'stroke-width': 1.5 });
  const creux = (c, r) => ({ r, fill: '#fff', stroke: c, 'stroke-width': 1.6 });
  const f1 = (x) => x.toFixed(1);
  let RID = 0;

  // Un toucher hors d'un radar referme sa bulle.
  document.addEventListener('pointerdown', (e) => {
    for (const b of document.querySelectorAll('.rdr-bulle.on')) if (!b.parentNode.contains(e.target)) b.classList.remove('on');
  }, true);

  /* Le cadre : libellés (une ou deux lignes, ancrés selon l'angle), rayon ajusté pour que tous
     tiennent dans la largeur (et la hauteur maximale), anneaux, rayons, légende, couches. */
  function radar(cont, o) {
    const axes = ROUE, n = axes.length, W = o.W || 358, pas = (2 * Math.PI) / n;
    const ang = (k) => k * pas, xy = (a, rr) => [Math.sin(a) * rr, -Math.cos(a) * rr];
    const lib = axes.map((f, k) => {
      const l = o.libelle ? o.libelle(f, k) : {};
      // D65 : une famille sans donnée, en gris et suivie de « ? » (collé : un seul mot).
      const nom = { t: nomF(f) + (l.inconnu ? '?' : ''), gras: !!l.gras, fill: l.inconnu ? GRIS : l.gras ? ENC : TXT };
      const compte = l.compte ? { t: l.compte, gras: false, fill: GRIS } : null;
      // Sur les côtés, le compte des fiches passe sous le nom ; en haut et en bas, à sa suite.
      const lignes = !compte ? [[nom]] : Math.abs(Math.sin(ang(k))) > 0.45 ? [[nom], [compte]] : [[nom, { ...compte, t: ' ' + compte.t }]];
      return { lignes, larg: Math.max(...lignes.map((li) => li.reduce((s, x) => s + largeur(x.t, x.gras), 0))), ecart: l.ecart || 0 };
    });
    // Légende, dans le SVG (ses couleurs restent celles du radar). Un élément : une pastille et
    // ses mots, ou une clé (plusieurs pastilles, chacune suivie de son mot). En colonne : une
    // rangée par élément, ses précisions en gris à la suite, à la ligne quand la largeur manque ;
    // sinon à la file.
    const leg = (o.legende || []).filter(Boolean).map((it) => ({ ...it, sw: it.t === 'centre' ? 28 : it.t === 'cle' ? 0 : 16 }));
    for (const it of leg) {
      if (it.t !== 'cle') continue;
      let x = 0;
      it.parts = it.parts.map((p) => { const q = { ...p, x, xt: x + 14 }; x += 14 + largeur(p.mot, false) + 12; return q; });
      it.largeur = x - 12;
    }
    let legH = 0;
    if (o.colonne) {
      let y = 0;
      for (const it of leg) {
        const dispo = W - it.sw - 6, lignes = it.t === 'cle' ? [] : [[{ t: it.texte, fill: TXT }]];
        let w = it.t === 'cle' ? it.largeur : largeur(it.texte, false);
        (it.details ? it.details.split(' ') : []).forEach((m, j) => {
          const t = (j ? ' ' : ' · ') + m, lt = largeur(t, false);
          if (w + lt > dispo) { lignes.push([{ t: m, fill: GRIS }]); w = largeur(m, false); } else { lignes[lignes.length - 1].push({ t, fill: GRIS }); w += lt; }
        });
        it.x = 0; it.y = y; it.lignes = lignes;
        y += Math.max(1, lignes.length) * 15 + 8;
      }
      legH = leg.length ? y + 2 + ECART_LEG : 0;
    } else {
      let lx = 0, ly = 0, rangs = leg.length ? 1 : 0;
      for (const it of leg) {
        it.w = it.t === 'cle' ? it.largeur : it.sw + 5 + largeur(it.texte, false);
        if (lx > 0 && lx + it.w > W) { lx = 0; ly += 18; rangs++; }
        it.x = lx; it.y = ly; it.lignes = it.t === 'cle' ? [] : [[{ t: it.texte, fill: LEG }]]; lx += it.w + 14;
      }
      legH = rangs ? rangs * 18 + 4 + ECART_LEG : 0;
    }
    // Le rayon : la largeur d'abord (les libellés peuvent déborder dans la gouttière de la page),
    // puis la hauteur maximale s'il y en a une.
    const demi = W / 2 + (o.deborde ?? 0);
    let R = o.Rmax || 150;
    lib.forEach((l, k) => { const s = Math.abs(Math.sin(ang(k))); if (s > 0.1) R = Math.min(R, (demi - 2 - l.larg) / s - GAP - l.ecart); });
    const poser = (RR) => lib.map((l, k) => {
      const a = ang(k), s = Math.sin(a), c = Math.cos(a), [x, y] = xy(a, RR + GAP + l.ecart), nl = l.lignes.length;
      const y0 = c > 0.9 ? y - (nl - 1) * LH - 3 : c < -0.9 ? y + 12 : y - ((nl - 1) * LH) / 2 + 4;
      const ancre = Math.abs(s) < 0.1 ? 'middle' : s > 0 ? 'start' : 'end';
      return { x, y0, ancre, y1: y0 - 10, y2: y0 + (nl - 1) * LH + 3 };
    });
    let pos, haut, bas;
    for (let i = 0; i < 4; i++) {
      pos = poser(R);
      haut = Math.min(-R, ...pos.map((p) => p.y1)); bas = Math.max(R, ...pos.map((p) => p.y2));
      const trop = o.Hmax ? bas - haut + 2 * PAD + legH - o.Hmax : 0;
      if (trop <= 0.5) break;
      R -= trop / 2;
    }
    const H = Math.round(Math.max(o.Hmin || 0, bas - haut + 2 * PAD + legH));
    const reste = H - (bas - haut + 2 * PAD + legH);
    const cx = W / 2, cy = PAD - haut + reste / 2;
    const r = D3.scaleLinear().domain([o.min, o.max]).range([0, R]).clamp(true);
    // Polygone fermé sur les 12 axes : une valeur vide se pose dans le disque du centre (RC, à mi-chemin
    // entre le centre et l'anneau du zéro), trait et marque ensemble ; jamais un axe sauté, jamais sur
    // l'anneau du zéro, où elle se lirait « pas senti » (19.10 : le défaut relevé par le jury sur m4
    // était aussi celui de la base).
    const RC = o.min < 0 ? r(o.min / 2) : 0;
    const ligne = D3.lineRadial().angle((d, k) => ang(k)).radius((v) => (v == null ? RC : r(v))).curve(D3.curveLinearClosed);
    const P = (k, v) => xy(ang(k), v == null ? RC : r(v));

    const boite = h('div', { class: 'rdr-boite' });
    cont.append(boite);
    const svg = sv('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, class: 'rdr', 'data-radar': '', 'data-objet': o.objet, 'data-axes': axes.join(','), role: 'img', 'aria-label': o.label });
    boite.append(svg);
    const bulle = h('div', { class: 'rdr-bulle', 'aria-hidden': 'true' });
    boite.append(bulle);
    const defs = sv('defs', {}, svg);
    const centre = sv('g', { transform: 'translate(' + f1(cx) + ',' + f1(cy) + ')' }, svg);
    const C = {};
    for (const k of ['grille', 'zone', 'inconnu', 'series', 'libelles', 'visees', 'marques']) C[k] = sv('g', { class: 'c-' + k }, centre);
    // Anneaux, sans nom (D66) : 0 en trait clair quand il n'est pas au centre, les autres en gris ; rayons.
    const valsAnneaux = (o.min < 0 ? [0] : []).concat(o.anneaux || []);
    for (const v of valsAnneaux) sv('path', { d: ligne(axes.map(() => v)), fill: 'none', stroke: v === 0 ? ANNEAU0 : ANNEAU, 'stroke-width': 1 }, C.grille);
    // o.axeF(f) : l'axe prend la couleur de sa famille (fiche, g1 du lot 13 ; classes de fiche.css).
    axes.forEach((f, k) => { const [x, y] = xy(ang(k), R); sv('line', { x1: 0, y1: 0, x2: f1(x), y2: f1(y), stroke: GRILLE, 'stroke-width': 1, class: o.axeF && o.axeF(f) ? 'ax-f f-' + f : null, 'data-famille': o.axeF && o.axeF(f) ? f : null }, C.grille); });
    // Les 12 libellés, entiers.
    lib.forEach((l, k) => {
      const p = pos[k];
      const t = sv('text', { 'text-anchor': p.ancre, 'font-size': PX, 'data-fam': axes[k] }, C.libelles);
      l.lignes.forEach((li, j) => li.forEach((x, m) => {
        sv('tspan', { x: m ? null : f1(p.x), y: m ? null : f1(p.y0 + j * LH), fill: x.fill, 'font-weight': x.gras ? 650 : 400 }, t).textContent = x.t;
      }));
    });
    // Légende.
    if (leg.length) {
      const gl = sv('g', { class: 'c-legende', transform: 'translate(0,' + f1(H - legH + ECART_LEG + 4) + ')' }, svg);
      for (const it of leg) {
        const y = it.y + 7;
        if (it.t === 'cle') {
          // Une clé : un seul texte, chaque mot après sa pastille.
          const t = sv('text', { y: f1(y + 4), 'font-size': PX }, gl);
          for (const p of it.parts) {
            pastilleSvg(gl, p, it.x + p.x, y);
            sv('tspan', { x: f1(it.x + p.xt), fill: LEG }, t).textContent = p.mot;
          }
          continue;
        }
        pastilleSvg(gl, it, it.x, y);
        it.lignes.forEach((li, j) => {
          const t = sv('text', { x: f1(it.x + it.sw + 6), y: f1(y + 4 + j * 15), 'font-size': PX }, gl);
          for (const x of li) sv('tspan', { fill: x.fill }, t).textContent = x.t;
        });
      }
    }

    const g = { svg, boite, defs, C, axes, n, pas, cx, cy, R, r, P, ligne, id: 'rd' + ++RID, W, H, cibles: [] };
    // Un sommet posé : un cercle, et une cible pour le toucher (les mots de sa bulle).
    g.marque = (p, attrs, mots, parent) => {
      const e = sv('circle', { cx: f1(p[0]), cy: f1(p[1]), ...attrs }, parent || C.marques);
      if (mots) g.cibles.push({ x: p[0], y: p[1], mots, groupe: parent || null });
      return e;
    };
    // La bulle : la famille et la valeur en mots, au-dessus du sommet (dessous près du haut).
    const local = (e) => { const b = svg.getBoundingClientRect(), k = W / b.width; return [(e.clientX - b.left) * k - cx, (e.clientY - b.top) * k - cy]; };
    const proche = (e, rayon) => {
      const [x, y] = local(e);
      let best = null, d0 = rayon;
      for (const c of g.cibles) { const d = Math.hypot(c.x - x, c.y - y); if (d < d0) { d0 = d; best = c; } }
      return best;
    };
    g.cacher = () => bulle.classList.remove('on');
    g.montrer = (c) => {
      const ici = g.cibles.filter((x) => Math.hypot(x.x - c.x, x.y - c.y) < 3);
      bulle.replaceChildren(...ici.map((x) => h('div', {}, x.mots)));
      bulle.classList.add('on');
      const k = svg.getBoundingClientRect().width / W;
      const bw = bulle.offsetWidth, bh = bulle.offsetHeight, X = (cx + c.x) * k, Y = (cy + c.y) * k;
      bulle.style.left = Math.max(0, Math.min(W * k - bw, X - bw / 2)) + 'px';
      bulle.style.top = (Y - bh - 12 < 0 ? Y + 14 : Y - bh - 12) + 'px';
    };
    svg.addEventListener('pointerdown', (e) => { const c = proche(e, 22); if (c) g.montrer(c); else g.cacher(); });
    svg.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse' || e.buttons) return; const c = proche(e, 14); if (c) g.montrer(c); else g.cacher(); });
    svg.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') g.cacher(); });
    return g;
  }

  /* Pastille de légende, dans le SVG (les couleurs restent dans le radar). */
  function pastilleSvg(parent, it, x, y) {
    const c = it.c || ENC, m = it.sw ? it.sw / 2 : 5;
    if (it.t === 'zone') sv('rect', { x, y: y - 5, width: 16, height: 10, rx: 2, fill: ZONE_F, stroke: ZONE_T }, parent);
    else if (it.t === 'plein') sv('rect', { x: x + 1, y: y - 4, width: 14, height: 8, rx: 2, fill: c, 'fill-opacity': 0.3, stroke: c, 'stroke-width': T_SUJET }, parent);
    else if (it.t === 'contour') sv('rect', { x: x + 1, y: y - 4, width: 14, height: 8, rx: 2, fill: 'none', stroke: c, 'stroke-width': T_REPERE }, parent);
    else if (it.t === 'point' || it.t === 'rond') sv('circle', { cx: x + m, cy: y, r: it.r || 4.5, fill: c }, parent);
    else if (it.t === 'creux') sv('circle', { cx: x + m, cy: y, r: it.r || 4, fill: '#fff', stroke: c, 'stroke-width': 1.6 }, parent);
    else if (it.t === 'anneau') sv('path', { d: `M${x + 1},${y + 5}A${it.r},${it.r} 0 0 1 ${x + 1 + it.r},${y + 5 - it.r}`, fill: 'none', stroke: GRIS, 'stroke-width': 1.5 }, parent);
    else if (it.t === 'centre') {
      sv('circle', { cx: x + 5, cy: y, r: 3.5, fill: '#fff', stroke: LEG, 'stroke-width': 1.5 }, parent);
      sv('rect', { x: x + 12, y: y - 5, width: 16, height: 10, rx: 2, fill: '#fff', stroke: '#d2d2d2' }, parent);
      sv('path', { d: `M${x + 13},${y + 4}L${x + 19},${y - 4}M${x + 17},${y + 4}L${x + 23},${y - 4}M${x + 21},${y + 4}L${x + 27},${y - 4}`, stroke: '#c4c4c4', 'stroke-width': 1.2 }, parent);
    }
  }

  /* La zone du style : un fond gris jusqu'au haut (un anneau si le bas dépasse 0). */
  function zone(g, bas, haut) {
    const z = sv('g', { 'data-serie': 'zone', 'data-valeurs': haut.join(','), fill: 'none' }, g.C.zone);
    sv('path', { d: g.ligne(haut) + (bas.some((v) => v > 0) ? g.ligne(bas) : ''), 'fill-rule': 'evenodd', fill: ZONE_F, stroke: ZONE_T, 'stroke-width': 1 }, z);
  }
  /* Les familles sans donnée (D62, D65) : secteur hachuré léger et marque creuse sur l'axe. */
  function inconnus(g, fams, mots) {
    if (!fams.length) return;
    const pid = g.id + '-hachure';
    const pat = sv('pattern', { id: pid, width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, g.defs);
    sv('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: 'rgba(0,0,0,0.16)', 'stroke-width': 1.2 }, pat);
    const rb = g.R * Math.cos(g.pas / 2), pt = (a, rr) => f1(Math.sin(a) * rr) + ',' + f1(-Math.cos(a) * rr);
    for (const f of fams) {
      const k = g.axes.indexOf(f), a = k * g.pas;
      sv('path', { d: 'M0,0L' + pt(a - g.pas / 2, rb) + 'L' + pt(a, g.R) + 'L' + pt(a + g.pas / 2, rb) + 'Z', fill: 'url(#' + pid + ')', 'data-inconnu': f }, g.C.inconnu);
      g.marque(g.P(k, null), { ...creux(LEG, 3.5), 'stroke-width': 1.5, 'data-inconnu': f }, [h('b', {}, nomF(f)), ' : ' + mots + ', inconnu (ce n\'est pas zéro), posé au centre']);
    }
  }
  /* Une série : polygone fermé, plein translucide (sujet) ou en contour (repère). */
  function serie(g, s) {
    const e = sv('g', { 'data-serie': s.nom, 'data-valeurs': s.valeurs.map((v) => (v == null ? 0 : v)).join(','), 'data-couleur': s.couleur, fill: 'none' }, g.C.series);
    const p = sv('path', { d: g.ligne(s.valeurs), fill: s.plein ? s.couleur : 'none', 'fill-opacity': s.plein ? OP : null, stroke: s.couleur, 'stroke-width': s.plein ? T_SUJET : T_REPERE, 'stroke-linejoin': 'round' }, e);
    s.maj = (vals) => p.setAttribute('d', g.ligne(vals));
    s.g = e;
    return s;
  }
  /* Ma visée (posée par une direction ou un geste) : un losange creux sur l'axe, sous les sommets. */
  function visees(g) {
    for (const f of Object.keys(ETAT.viseeAbs || {})) {
      const k = g.axes.indexOf(f);
      if (k < 0) continue;
      const v = ETAT.viseeAbs[f], p = g.P(k, v);
      sv('path', { d: losange(p.map((x) => +f1(x)), 6), fill: '#fff', stroke: ENC, 'stroke-width': 1.5 }, g.C.visees);
      g.cibles.push({ x: p[0], y: p[1], mots: [h('b', {}, nomF(f)), ' : visée ' + motsNiveau(v)] });
    }
  }
  const ANNEAUX_I = [1, 2, 3], ANNEAUX_C = [1, 2];

  /* Ma bière (objets 1 et 2) : la zone du style en fond gris, ma bière pleine, l'orangé sur le seul
     sommet au-dessus du style, les familles attendues du style en gras. */
  function donneesBiere() {
    const axes = ROUE;
    const val = axes.map((f) => (D.continu.biere[fi(f)] != null ? D.continu.biere[fi(f)] : null));
    const bas = axes.map((f) => D.continu.cible[fi(f)].bas), haut = axes.map((f) => D.continu.cible[fi(f)].haut);
    return { axes, hors: axes.filter((f, k) => val[k] == null), val, bas, haut,
      deg: axes.map((f) => D.profil[fi(f)].source === 'dégustation'), dessus: axes.map((f, k) => val[k] != null && val[k] > haut[k] + 0.05) };
  }
  const position = (b, k, v) => {
    if (v > b.haut[k] + 0.05) { const e = D.continu.ecart[fi(b.axes[k])]; return 'au-dessus du style' + (e ? ' (' + e + ')' : ''); }
    return v < b.bas[k] - 0.05 ? 'sous le style' : 'dans le style';
  };
  /* Ma bière, base v4.4 (choix du brasseur, 19.10 : « Radar: m4 h4 très bien, attention à pas surchargé
     en texte ni en légende. Pas besoin d'écrire la légende sur la version finale ») : ce que j'ai goûté
     (ETAT.notes, grille dessous) face à la zone du style. Pas senti = 0, sur l'anneau clair du zéro ;
     pas goûté = inconnu (D65) : libellé gris « ? », secteur hachuré, trait et marque creuse dans le
     disque du centre. L'orangé sur une note au-dessus du style. Sans légende : les niveaux se nomment
     dans la grille, la bulle au toucher dit le reste. */
  const NIVEAUX = ['pas senti', 'faible', 'moyen', 'marqué'];
  function biere(cont) {
    const axes = ROUE;
    const val = axes.map((f) => ETAT.notes[fi(f)]);
    const bas = axes.map((f) => D.continu.cible[fi(f)].bas), haut = axes.map((f) => D.continu.cible[fi(f)].haut);
    const dessus = axes.map((f, k) => val[k] != null && val[k] > haut[k] + 0.05);
    const pasGoute = axes.filter((f, k) => val[k] == null);
    const g = radar(cont, {
      objet: 'biere-cible', min: -1, max: 3, anneaux: ANNEAUX_I, deborde: 12,
      libelle: (f, k) => ({ gras: D.attendues.includes(f), inconnu: val[k] == null }),
      label: 'Ma dégustation face à la zone du style, de pas senti à marqué' + (dessus.some(Boolean) ? ' ; au-dessus du style : ' + axes.filter((f, k) => dessus[k]).map((f) => nomF(f).toLowerCase()).join(', ') : '') + (pasGoute.length ? ' ; pas goûté, inconnu : ' + pasGoute.map((f) => nomF(f).toLowerCase()).join(', ') : ''),
    });
    zone(g, bas, haut);
    inconnus(g, pasGoute, 'pas goûté');
    serie(g, { nom: 'ma dégustation', valeurs: val, couleur: MOI, plein: true });
    val.forEach((v, k) => {
      if (v == null) return;
      const ou = dessus[k] ? 'au-dessus du style' : v < bas[k] - 0.05 ? 'sous le style' : 'dans le style';
      g.marque(g.P(k, v), dessus[k] ? plein(ACC, 5) : plein(MOI, v === 0 ? 3 : 4), [h('b', {}, nomF(axes[k])), ' : ' + NIVEAUX[v] + ', ' + ou]);
    });
  }

  /* Suggestions (objet 4) : l'avant en contour plein, l'après d'une voie plein ; puces ou balayage
     du radar pour passer d'une voie à l'autre (la silhouette suit le doigt, un ressort finit le
     passage). Là où le moteur n'établit pas d'effet, l'après recopie l'avant, petit sommet.
     Ni zone ni orangé dans la légende (budget de mots de la page) ; jamais d'orangé sur une voie
     (D40). */
  function apresDe(v, b) {
    const etabli = b.axes.map((f) => v.apresC[fi(f)] != null);
    return { etabli, valeurs: b.axes.map((f, k) => (etabli[k] ? v.apresC[fi(f)] : b.val[k])) };
  }
  /* Base v4.6 (Suggestions p10, « mais radar beaucoup plus grand ») : o.grand, le radar pleine largeur
     (libellés jusqu'au bord de l'écran) ; o.sansPuces, la voie se choisit sur sa ligne (son œil) ;
     sans légende écrite, comme Ma bière et la fiche. */
  function voies(cont, ctx, redraw, o = {}) {
    const vs = ctx.marq.length ? ctx.marq : ctx.liste.filter((v) => !v.nouvelle).slice(0, 1);
    if (!vs.length) return;
    if (!vs.some((v) => v.rang === ETAT.voieRadar)) ETAT.voieRadar = vs[0].rang;
    const i = vs.findIndex((v) => v.rang === ETAT.voieRadar);
    const b = donneesBiere();
    const A = vs.map((v) => apresDe(v, b));
    const titre = (v) => (v.cles.length ? nomsHoublons(v.houblons) : v.houblons.join(' + '));
    const nomV = (v) => 'après ' + v.houblons.join(' + ');
    if (vs.length > 1 && !o.sansPuces) {
      cont.append(h('div', { class: 'chips puces-v', role: 'group', 'aria-label': 'Voie montrée sur le radar (ou balayer le radar)' }, vs.map((v, k) => h('button', {
        class: 'chip', 'aria-pressed': String(k === i), 'data-k': 'pv' + v.rang, 'data-booster': k === (i + 1) % vs.length ? 'voie suivante' : null,
        'aria-label': 'Montrer la voie ' + v.label, onclick: () => aller(k),
      }, titre(v)))));
    }
    const a = A[i];
    const inconnue = (k) => b.val[k] == null && a.valeurs[k] == null;
    const hors = b.axes.filter((f, k) => inconnue(k));
    // Sans légende : la ligne allumée dit quelle voie est l'après ; la bulle au toucher dit le reste.
    const g = radar(cont, {
      objet: 'voies', min: -1, max: 3, anneaux: ANNEAUX_I, deborde: o.grand ? 16 : 12, Hmin: 0, Hmax: o.grand ? 380 : 430,
      libelle: (f, k) => ({ gras: D.attendues.includes(f), inconnu: inconnue(k) }),
      label: 'Radar des voies : l\'avant en contour, ' + nomV(vs[i]) + ' plein, dans la zone du style en gris ; au centre, les familles non situées, inconnues et pas à zéro' + (vs.length > 1 ? ' ; balayer pour passer à la voie suivante' : ''),
    });
    zone(g, b.bas, b.haut);
    inconnus(g, hors, 'non situé');
    const sV = serie(g, { nom: nomV(vs[i]), valeurs: a.valeurs, couleur: MOI, plein: true });
    serie(g, { nom: 'avant', valeurs: b.val, couleur: AVANT, plein: false });
    visees(g);
    const mV = sv('g', {}, g.C.marques);
    const motsApres = (k, v) => {
      const av = b.val[k], f = b.axes[k];
      if (!a.etabli[k]) return [h('b', {}, nomF(f)), ' : ' + motsNiveau(v) + ', effet non établi par le moteur'];
      const sens = av == null ? 'avant non situé' : v > av + 0.05 ? 'monte (avant : ' + motsNiveau(av) + ')' : v < av - 0.05 ? 'baisse (avant : ' + motsNiveau(av) + ')' : 'inchangé';
      return [h('b', {}, nomF(f)), ' : ' + motsNiveau(v) + ' ' + nomV(vs[i]) + ', ' + sens + (v > b.haut[k] + 0.05 ? ', au-dessus du style' : '')];
    };
    // Sommet de l'après : plein là où le moteur établit l'effet, petit là où il recopie l'avant.
    const marquerVoie = (vals, et, mots) => {
      mV.innerHTML = '';
      g.cibles = g.cibles.filter((c) => c.groupe !== mV);
      vals.forEach((v, k) => { if (v != null) g.marque(g.P(k, v), plein(MOI, et[k] ? 4 : 2.5), mots ? motsApres(k, v) : null, mV); });
    };
    marquerVoie(a.valeurs, a.etabli, true);
    // Une image du passage de la voie i vers la voie j, avancée de t (0 à 1).
    const image = (j, t) => {
      const vals = A[i].valeurs.map((x, k) => { const y = A[j].valeurs[k]; return x == null && y == null ? null : (x ?? 0) + ((y ?? 0) - (x ?? 0)) * t; });
      sV.maj(vals);
      marquerVoie(vals, t < 0.5 ? A[i].etabli : A[j].etabli, false);
    };
    let anim = null;
    function poser(j) { ETAT.voieRadar = vs[j].rang; redraw(); }
    function aller(j, t0 = 0, vitesse = 0) {
      if (j === i || j < 0 || j >= vs.length) return;
      if (anim) anim.stop();
      g.cacher();
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
          if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) { gs.on = true; g.cacher(); try { svg.setPointerCapture(e.pointerId); } catch (x) { /* rien */ } svg.classList.add('balaye'); }
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
        else if (!REDUIT && window.MO) anim = MO.animate(s.t, 0, { type: 'spring', stiffness: 330, damping: 33, onUpdate: (t) => image(s.j, Math.max(0, t)), onComplete: () => { anim = null; image(s.j, 0); marquerVoie(A[i].valeurs, A[i].etabli, true); } });
        else { image(s.j, 0); marquerVoie(A[i].valeurs, A[i].etabli, true); }
      };
      svg.addEventListener('pointerup', lacher);
      svg.addEventListener('pointercancel', lacher);
    }
  }

  /* Comparer (objet 3) : les fiches en citations 0–2, tous les houblons superposés sur un seul
     radar, la couleur de sa bande pour chacun. Une famille qu'aucune fiche ne décrit est inconnue
     (D65) : au centre, marquée ; celle qu'une autre fiche décrit reste « non décrit » (0) pour ce
     houblon. Aucun repère tiré de ma bière. Sans légende (base v4.6) : les couleurs sont celles des
     bandes au-dessus, la bulle au toucher dit le reste.
     L'intervalle de chaque famille (19.10 : « radar p2 mais avec ajoute d'intervalle de confiance ») :
     la plage entre les fiches du houblon. Le bord extérieur (le trait, les sommets) dit ce que les
     fiches disent réunies (le niveau du pack : cité par une, marqué par deux ou plus) ; le noyau plein
     dit ce que toutes ses fiches disent, quand il en a deux au moins ; la bande pâle entre les deux,
     ce que seules certaines disent. Aucun chiffre nouveau : le niveau et le compte N sur M du pack. */
  const marqueCitation = (c, v) => (v === 2 ? plein(c, 4) : v === 1 ? creux(c, 3.5) : plein(c, 2));
  const OP_NOYAU = 0.4, OP_PALE = 0.3;
  function houblons(cont, noms, o = {}) {
    const dn = Object.fromEntries(noms.map((x) => [x, o.donnees ? o.donnees(x)
      : { niv: (f) => D.fiches[x].niv[fi(f)], n: (f) => D.fiches[x].n[fi(f)], of: D.fiches[x].of, noyau: () => 0 }]));
    const niv = (nom, f) => dn[nom].niv(f);
    const coul = (nom, j) => (o.couleur ? o.couleur(nom) : HOUBLONS[j]);
    const inconnue = (f) => noms.every((x) => !niv(x, f));
    const hors = ROUE.filter(inconnue);
    const g = radar(cont, {
      objet: 'houblons', min: -0.5, max: 2, anneaux: ANNEAUX_C, deborde: 12, Hmax: o.Hmax || 430,
      libelle: (f) => ({ gras: D.attendues.includes(f), inconnu: inconnue(f) }),
      label: 'Radar des fiches de ' + noms.join(', ') + ', superposées : 1 cité, 2 marqué ; le noyau plein, ce que toutes les fiches d\'un houblon disent ; la bande pâle, ce que certaines seulement disent ; au centre, les familles qu\'aucune fiche ne décrit, inconnues et pas à zéro',
    });
    inconnus(g, hors, 'aucune fiche ne le décrit');
    // Le noyau : 0 (aucun accord) au centre, jamais sur l'anneau du zéro.
    const ligneNoyau = D3.lineRadial().angle((v, k) => k * g.pas).radius((v) => (v > 0 ? g.r(v) : 0)).curve(D3.curveLinearClosed);
    // Le plus grand houblon dessous, le plus petit dessus : aucune silhouette cachée par une autre.
    const somme = (nom) => ROUE.reduce((s, f) => s + niv(nom, f), 0);
    const ordre = noms.map((nom, j) => [nom, j]).sort((x, y) => somme(y[0]) - somme(x[0]));
    for (const [nom, j] of ordre) {
      const c = coul(nom, j), s = serie(g, { nom, valeurs: ROUE.map((f) => (inconnue(f) ? null : niv(nom, f))), couleur: c, plein: true });
      const noyau = ROUE.map((f) => (inconnue(f) ? 0 : dn[nom].noyau(f)));
      if (noyau.some((v) => v > 0)) sv('path', { d: ligneNoyau(noyau), fill: c, 'fill-opacity': OP_NOYAU, stroke: 'none', 'data-noyau': nom, 'data-valeurs': noyau.join(',') }, s.g);
      // Un houblon isolé (toucher sa bande) : les autres pâlissent.
      if (o.focus && o.focus !== nom) s.g.setAttribute('opacity', OP_PALE);
    }
    for (const [nom, j] of ordre) {
      const mg = o.focus && o.focus !== nom ? sv('g', { opacity: OP_PALE }, g.C.marques) : null;
      ROUE.forEach((f, k) => {
        if (inconnue(f)) return;
        const v = niv(nom, f), d = dn[nom], n = d.n(f), tous = d.noyau(f) > 0;
        const plage = !v ? '' : tous ? ', toutes ses fiches' : d.of >= 2 ? ', ' + n + ' fiche' + (n > 1 ? 's' : '') + ' sur ' + d.of + ' (plage : non décrit à ' + CLASSES_C[v] + ')' : ', une seule fiche';
        g.marque(g.P(k, v), marqueCitation(coul(nom, j), v), [h('b', {}, nom), ' · ' + nomF(f) + ' : ' + CLASSES_C[v] + plage], mg);
      });
    }
  }

  /* La roue de la fiche d'un houblon : le nombre de fiches qui citent chaque famille, « N/M » sous la
     famille (D72, 19.10, sur g1 : « 1/4, 2/4 mais même valeur ??? » : la place suit le nombre écrit,
     1 fiche au milieu, 2 au bord, comme les cases de la carte) ; une fiche unique n'écrit pas « 1/1 »
     (la bande de la fiche dit « 1 seule fiche »). Une famille que ses fiches ne décrivent pas est
     inconnue (D65). Axes aux couleurs des familles décrites (g1). Ni zone ni accent : la fiche décrit
     le houblon, pas le problème de ma bière. */
  function roue(cont, F, o) {
    const lv = Object.fromEntries(F.aromes.map((a) => [a.f, a]));
    const vals = ROUE.map((f) => (lv[f] && lv[f].n ? lv[f].n : null));
    const max = Math.max(2, ...vals.filter((v) => v != null));
    const cpt = (f) => (lv[f].of === 1 ? 'une seule fiche' : lv[f].n + '/' + lv[f].of + ' fiches');
    // h4 (choix du brasseur, 19.10) : ma demande (D.direction : plus de floral, moins de résineux) fléchée
    // au bord du radar, vers l'extérieur = plus, vers le centre = moins ; ces familles en gras, écartées.
    const dem = Object.fromEntries((D.direction || []).map((d) => [d.f, d.sens]));
    const g = radar(cont, {
      objet: 'fiche', W: o.W, Hmin: o.H, Hmax: o.H, min: -0.5, max, anneaux: ANNEAUX_C,
      axeF: (f) => vals[ROUE.indexOf(f)] != null,
      libelle: (f, k) => ({ gras: !!dem[f], ecart: dem[f] ? 20 : 0, inconnu: vals[k] == null, compte: vals[k] && lv[f].of > 1 ? lv[f].n + '/' + lv[f].of : null }),
      label: 'Silhouette de ' + F.nom + ' selon ses fiches : ' + (ROUE.filter((f, k) => vals[k]).map((f) => nomF(f).toLowerCase() + ' ' + (lv[f].of === 1 ? 'une seule fiche' : lv[f].n + ' sur ' + lv[f].of)).join(', ') || 'aucun arôme décrit') + ' ; les autres familles sont inconnues, pas à zéro',
    });
    inconnus(g, ROUE.filter((f, k) => vals[k] == null), 'ses fiches ne le décrivent pas');
    serie(g, { nom: F.nom, valeurs: vals, couleur: ENC, plein: true });
    ROUE.forEach((f, k) => {
      const v = vals[k];
      if (v != null) g.marque(g.P(k, v), marqueCitation(ENC, Math.min(2, v)), [h('b', {}, nomF(f)), ' : ' + cpt(f)]);
    });
    // Les flèches de ma demande, hors du radar (aucune valeur), en encre (jamais l'orangé d'alerte).
    ROUE.forEach((f, k) => {
      const s = dem[f];
      if (!s) return;
      const R = g.R, fl = sv('g', { transform: 'rotate(' + f1((k * 360) / g.n) + ')', 'data-demande': f, 'data-sens': s > 0 ? 'plus' : 'moins' }, g.C.visees);
      if (s > 0) {
        sv('line', { x1: 0, y1: -(R + 5), x2: 0, y2: -(R + 13), stroke: ENC, 'stroke-width': 2.5 }, fl);
        sv('path', { d: 'M0,' + -(R + 21) + 'L-5,' + -(R + 12) + 'L5,' + -(R + 12) + 'Z', fill: ENC }, fl);
      } else {
        sv('line', { x1: 0, y1: -(R + 21), x2: 0, y2: -(R + 13), stroke: ENC, 'stroke-width': 2.5 }, fl);
        sv('path', { d: 'M0,' + -(R + 5) + 'L-5,' + -(R + 14) + 'L5,' + -(R + 14) + 'Z', fill: ENC }, fl);
      }
      const p = [Math.sin(k * g.pas) * (R + 13), -Math.cos(k * g.pas) * (R + 13)];
      g.cibles.push({ x: p[0], y: p[1], mots: [h('b', {}, nomF(f)), ' : tu en veux ' + (s > 0 ? 'plus' : 'moins') + ' ; ' + F.nom + ' : ' + (vals[k] ? cpt(f) : 'inconnu, ses fiches n\'en parlent pas')] });
    });
    return g.svg;
  }
  return { biere, voies, houblons, roue };
})();
