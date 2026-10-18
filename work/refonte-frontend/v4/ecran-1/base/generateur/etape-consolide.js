/* Étape houblons, base v4 : le rail des étapes (BRIEF-RAIL.md ; D27, D28, D34 à D37, D41 à D47, D55, D56).
   Au repos, un rail compact et sans graduation : la durée d'ébullition lue dans la recette (avec un
   renvoi, D37 révisé), les lignes de la recette posées à leur moment, 0′, le whirlpool, la levure
   (D28), la fermentation et la post-fermentation. Le rail ne porte que la recette : les ajouts
   proposés vivent à part, sous le rail, chacun avec son moment suggéré (D41).
   La loupe, façon Dock (D47, D55) : la poignée prise, le rail devient une échelle continue (ébullition
   par 5′ de la durée à 0′, whirlpool de 100 à 60 °C par 5, fermentation puis post-fermentation de J+0
   à J+14) ; seul le voisinage du doigt grossit (une fenêtre régulière de ±3 tranches, D45), le
   grossissement décroît avec la distance, le reste du rail reste compact entre les bornes du repos ;
   la graduation sous le doigt reste sous le doigt. Seules les graduations du segment sous le doigt se
   montrent. Le geste (D46) : la carte suit le doigt en translation seule, l'étiquette suit la tranche ;
   les rangées (étapes, 0′, levure) et les autres lignes, réduites, restent à leur place et s'écartent
   de la carte sans jamais se chevaucher (D56). Rien n'est recalculé avant le lâcher, où la ligne prend
   la tranche, puis l'IBU et le total (tables du pack), et tout se referme. Ombre pendant le geste
   seulement ; un geste interrompu rend tout (D42). */

/* Après un glisser, le clic qui suit le lâcher est ignoré (il tomberait sous le doigt). */
let IGNORE_CLIC = 0;
document.addEventListener('click', (e) => { if (performance.now() < IGNORE_CLIC) { e.stopPropagation(); e.preventDefault(); } }, true);

/* ---------- Les valeurs du rail ---------- */
const J_MAX = 14;
const SEGMENTS = ['ebullition', 'whirlpool', 'fermentation', 'post'];
const TETE_SEG = { ebullition: 'T-ebu', whirlpool: 'T-wp', fermentation: 'T-dryActive', post: 'T-dryPost' };
function valeursSeg(s) {
  if (s === 'ebullition') return Array.from({ length: EBU / 5 + 1 }, (x, k) => 'b' + (EBU - 5 * k));
  if (s === 'whirlpool') return [...((D.tables.wp && D.tables.wp.temperatures) || [60, 65, 70, 75, 80, 85, 90, 95, 100])].sort((a, b) => b - a).map((t) => 'wp' + t);
  return Array.from({ length: J_MAX + 1 }, (x, j) => (s === 'fermentation' ? 'f' : 'p') + j);
}
const segDe = (v) => (v === 'fwh' || /^b\d/.test(v) ? 'ebullition' : /^wp/.test(v) ? 'whirlpool' : /^f\d/.test(v) ? 'fermentation' : 'post');
function valeurDe(l) {
  if (l.moment === 'wp') return 'wp' + (l.wpT || 80);
  if (l.moment === 'dryActive') return 'f' + l.jour;
  if (l.moment === 'dryPost') return 'p' + l.jour;
  return l.moment;
}
function appliquer(l, v) {
  if (/^wp\d/.test(v)) { l.moment = 'wp'; l.wpT = Number(v.slice(2)); }
  else if (/^f\d/.test(v)) { l.moment = 'dryActive'; l.jour = Number(v.slice(1)); }
  else if (/^p\d/.test(v)) { l.moment = 'dryPost'; l.jour = Number(v.slice(1)); }
  else l.moment = v;
  l.ramene = false;
}
const toutesValeurs = () => ['fwh', ...SEGMENTS.flatMap(valeursSeg)];
/* Ordre d'une ligne dans son segment : premier moût, puis minutes restantes, °C, jours. */
const rangValeur = (v) => (v === 'fwh' ? -1 : /^b/.test(v) ? EBU - Number(v.slice(1)) : /^wp/.test(v) ? 100 - Number(v.slice(2)) : Number(v.slice(1)));
const majeure = (s, v) => {
  const n = Number(v.replace(/^\D+/, ''));
  return s === 'ebullition' ? n % (EBU > 90 ? 30 : 15) === 0 : s === 'whirlpool' ? n % 10 === 0 : n % 7 === 0;
};

/* ---------- Le rail au repos ---------- */
function pt(c) { return h('span', { class: 'pt ' + c, 'aria-hidden': 'true' }); }
/* D37 révisé : la durée se lit ici et se règle dans la fiche de brassage (renvoi). */
function teteEbullition() {
  // Une rangée de renvoi (comme un réglage d'iPhone) : le chevron mène à la fiche de brassage.
  return h('div', { class: 'r-ebu', 'data-role': 'ebullition', 'data-minutes': String(EBU), 'data-rang': 'T-ebu' },
    pt('pt-ebu'),
    h('a', { class: 'renvoi', href: '#fiche-brassage', 'data-action': 'renvoi-ebullition', title: 'Réglée dans la fiche de brassage', 'aria-label': 'Ébullition ' + EBU + ' minutes, réglée dans la fiche de brassage', onclick: (e) => e.preventDefault() },
      h('span', { class: 'cle' }, 'Ébullition'), h('b', { class: 'ebu-v' }, EBU + '′')));
}
function rangEtape(code, nom) { return h('div', { class: 'r-etape', 'data-etape': code, 'data-rang': 'T-' + code }, pt('pt-etape'), h('span', { class: 'r-nom' }, nom)); }
function rangFin() { return h('div', { class: 'r-fin', 'data-rang': 'T-fin', 'aria-label': 'Fin de l\'ébullition' }, pt('pt-fin'), h('span', { class: 'r-nom' }, '0′')); }
function rangLevure() { return h('div', { class: 'etape-levure', 'data-etape': 'levure', 'data-rang': 'T-levure' }, pt('pt-levure'), levure()); }

/* Réglages qui restent sur la carte : la durée du whirlpool ; le jour d'un ajout à froid (D43). */
function reglage(libelle, valeur, moins, plus, action) {
  return h('span', { class: 'regl', role: 'group', 'aria-label': libelle },
    h('button', { class: 'moins', 'data-action': action + '-moins', 'aria-label': libelle + ' : moins', disabled: moins ? null : true, onclick: (e) => { e.stopPropagation(); if (moins) moins(); } }),
    h('span', { class: 'regl-v' }, valeur),
    h('button', { class: 'plus', 'data-action': action + '-plus', 'aria-label': libelle + ' : plus', disabled: plus ? null : true, onclick: (e) => { e.stopPropagation(); if (plus) plus(); } }));
}
function reglagesMoment(l) {
  if (l.moment === 'wp' && D.tables.wp) {
    const M = D.tables.wp.minutes, n = M.indexOf(l.wpMin);
    return h('div', { class: 'reglages' }, reglage('Durée du whirlpool', l.wpMin + ' min',
      n > 0 ? () => { l.wpMin = M[n - 1]; rendre(true); } : null, n >= 0 && n < M.length - 1 ? () => { l.wpMin = M[n + 1]; rendre(true); } : null, 'wp-min'));
  }
  if (mom(l.moment).type === 'à froid') {
    return h('div', { class: 'reglages' }, reglage('Jour du houblonnage à froid', 'J+' + l.jour,
      l.jour > 0 ? () => { l.jour -= 1; rendre(false); } : null, l.jour < J_MAX ? () => { l.jour += 1; rendre(false); } : null, 'jour'));
  }
  return null;
}

function blocRail(l, i, st) {
  const premier = i === 0;
  const m = mom(l.moment);
  const pastille = h('button', {
    class: 'quand', 'data-role': 'quand', 'data-k': 'q' + l.id,
    'aria-label': 'Moment : ' + quandLong(l) + ' ; glisser le long du rail pour le changer, ou flèches haut et bas',
    onkeydown: (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const V = toutesValeurs(), k = V.indexOf(valeurDe(l)) + (e.key === 'ArrowDown' ? 1 : -1);
      if (k >= 0 && k < V.length) { ETAT.focusK = 'q' + l.id; appliquer(l, V[k]); rendre(true); }
    },
  }, quand(l));
  const poignee = h('span', { class: 'poignee', 'data-role': 'glisser-moment' }, pastille);
  const carte = h('div', { class: 'blk', 'data-role': 'ligne-houblon', 'data-rang': 'L' + l.id },
    poignee,
    h('div', { class: 'corps-b' },
      h('div', { class: 'l1' },
        h('b', { class: 'nom', 'data-houblon': l.cle }, l.nom),
        h('button', {
          class: 'tag tourne type', 'data-role': 'type-ajout', 'data-k': 't' + l.id, 'data-booster': premier ? 'type d\'ajout' : null,
          'aria-label': 'Type d\'ajout : ' + m.type + ', toucher pour passer au suivant', onclick: () => { ETAT.focusK = 't' + l.id; typeSuivant(l); },
        }, m.type),
        h('span', { class: 'pas' },
          h('button', { class: 'moins', 'aria-label': 'Retirer 2 g de ' + l.nom, onclick: () => doser(l, -2) }),
          h('output', { class: 'dose' }, grammes(l.g)),
          h('button', { class: 'plus', 'data-k': 'd' + l.id, 'data-booster': premier ? 'dose au pas' : null, 'aria-label': 'Ajouter 2 g de ' + l.nom, onclick: () => { ETAT.focusK = 'd' + l.id; doser(l, 2); } })),
        h('button', { class: 'corbeille', 'aria-label': 'Retirer ' + l.nom + ' de la recette', onclick: () => retirer(l) })),
      h('div', { class: 'l2' }, alphaEl(l.alpha), roleEl(l.role), stockIcone(st.code, st.txt), citationTag(l), effetTag(l), ibuEl(l)),
      h('div', { class: 'l3' }, miniProfil(l.fiche, l.nom), reglagesMoment(l)),
      l.moment === 'dryActive' ? bioEl(l) : null));
  brancherGlisser(poignee, carte, l);
  return carte;
}
/* Les graduations : toutes présentes (data-etape), cachées au repos, montrées par la loupe. */
function graduations() {
  const g = h('div', { class: 'grads', 'aria-hidden': 'true' });
  for (const s of SEGMENTS) for (const v of valeursSeg(s)) g.append(h('i', { class: 'grad' + (majeure(s, v) ? ' maj' : ''), 'data-etape': v, 'data-graduation': s }));
  return g;
}
function frise() {
  const fr = h('section', { class: 'frise', 'data-role': 'houblons-recette', 'aria-label': 'Houblons de la recette, posés sur le rail du brassage' }, h('i', { class: 'axe', 'aria-hidden': 'true' }));
  const st = etatsStock();
  const lignes = (seg) => ETAT.lignes.map((l, i) => [l, i]).filter(([l]) => segDe(valeurDe(l)) === seg)
    .sort((a, b) => rangValeur(valeurDe(a[0])) - rangValeur(valeurDe(b[0])) || a[1] - b[1]).map(([l, i]) => blocRail(l, i, st[i]));
  // Recette vide : la place des houblons sur l'ébullition, en pointillé ; un toucher mène à la recherche.
  const vide = ETAT.lignes.length ? null : h('button', { class: 'r-vide', 'data-rang': 'T-vide', 'aria-label': 'Aucun houblon dans la recette : chercher un houblon à ajouter',
    onclick: () => { const i = document.querySelector('.ajouts .champ input'); if (i) i.focus({ preventScroll: true }); } }, h('span'), h('span', { class: 'vide-c', 'aria-hidden': 'true' }));
  fr.append(...[teteEbullition(), ...lignes('ebullition'), vide, rangFin(),
    rangEtape('wp', 'whirlpool'), ...lignes('whirlpool'),
    rangLevure(),
    rangEtape('dryActive', 'fermentation'), ...lignes('fermentation'),
    rangEtape('dryPost', 'post-fermentation'), ...lignes('post'),
    graduations()].filter(Boolean));
  return fr;
}

/* ---------- Les ajouts proposés, hors du rail (D41) ---------- */
function zoneAjouts() {
  const n = ETAT.lignes.length;
  // Propositions selon la place : 5 pour une recette vide, puis 3, 2, 1 ; au-delà, le champ reste.
  const proposes = rapidesVisibles(n === 0 ? 5 : Math.max(0, 4 - n));
  return h('section', { class: 'ajouts', 'data-role': 'ajouts-proposes', 'aria-label': 'Ajouter un houblon' },
    noteIbu(), champ(),
    proposes.length ? h('ul', { class: 'rapides', 'aria-label': 'Ajouts proposés par le moteur, chacun à son moment suggéré' },
      proposes.flatMap((r, k) => [rapideLigne(r, k === 0), r.alternative && proposes[k + 1] && proposes[k + 1].alternative ? h('li', { class: 'ou' }, 'ou') : null]).filter(Boolean)) : null);
}
/* Un ajout touché : sa ligne se pose sur le rail en venant de la carte touchée. */
function atterrir(de) {
  const l = ETAT.lignes[ETAT.lignes.length - 1];
  const c = l && document.querySelector('[data-rang="L' + l.id + '"]');
  if (!c || REDUIT) return;
  const b = c.getBoundingClientRect();
  c.animate([{ transform: 'translate(' + (de.left - b.left) + 'px,' + (de.top - b.top) + 'px)', opacity: 0.4 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

/* ---------- La loupe et le geste, façon Dock (D47, D55, D56) ---------- */
/* L'axe des tranches : t compte les graduations dans l'ordre du rail, avec des unités de passage
   entre segments (0′ → whirlpool : 3 ; whirlpool → fermentation : 4, la levure au milieu ;
   fermentation → post : 3). Les rangées nommées et les autres lignes ont leur ancre sur cet axe. */
const nIntervalles = (s) => valeursSeg(s).length - 1;
const LOUPE = { W: 3, R: 2, lmin: 1.4, lmax: 6, ouverture: 170, ecart: { ebullition: 16, whirlpool: 14, fermentation: 12, post: 12 } };
function axeLoupe() {
  const T = {}, ticks = [], bornes = {};
  let t = 0;
  for (const [s, passage] of [['ebullition', 0], ['whirlpool', 3], ['fermentation', 4], ['post', 3]]) {
    t += passage;
    valeursSeg(s).forEach((v, k) => { T[v] = t + k; ticks.push({ v, s, t: t + k }); });
    bornes[s] = [t, t + nIntervalles(s)];
    t += nIntervalles(s);
  }
  const ancres = { 'T-ebu': -1.4, 'T-fin': T.b0, 'T-wp': T[valeursSeg('whirlpool')[0]] - 1.4, 'T-levure': T[valeursSeg('whirlpool').slice(-1)[0]] + 2, 'T-dryActive': T.f0 - 1.4, 'T-dryPost': T.p0 - 1.4 };
  return { T, ticks, ancres, bornes, t0: -2, t1: t + 0.5, tMin: 0, tMax: t };
}
const ancreValeur = (A, v) => A.T[v] ?? (v === 'fwh' ? -0.6 : A.T[valeursSeg(segDe(v)).slice(-1)[0]]);

/* Une moitié du rail hors de la fenêtre, du bord (distance 0) vers le bout (distance n), posée à partir
   de y0 dans le sens « sens » et tenant dans « dispo » px si possible : une rampe qui passe de l'écart
   de la loupe à l'écart resserré λ (le grossissement décroît avec la distance), puis λ. Les contraintes
   { d0, d1, besoin } gardent la place des rangées : il manque de la place entre deux ancres, elle est
   insérée juste avant la seconde. λ est résolu pour remplir la place ; si elle manque, la rampe se
   resserre aussi, et en dernier la moitié déborde. */
const RAMPE = [0.55, 0.22];
function demiRail(n, y0, sens, dispo, s, contraintes, poids) {
  const cel = [];
  for (let k = 0; k < Math.ceil(n - 1e-9); k++) cel.push([k, Math.min(n, k + 1)]);
  const base = (k, lam, rho) => { const l = lam * poids(k); return l + (s - l) * (RAMPE[k] || 0) * rho; };
  const brut = (d, lam, rho) => { let y = 0; for (let k = 0; k < cel.length && d > cel[k][0]; k++) y += base(k, lam, rho) * (Math.min(d, cel[k][1]) - cel[k][0]); return y; };
  const calc = (lam, rho) => {
    const ajouts = [];
    let cumul = 0;
    for (const q of contraintes) {
      const yi = brut(q.d0, lam, rho) + ajouts.filter((a) => a.d <= q.d0).reduce((t, a) => t + a.e, 0);
      const yj = brut(q.d1, lam, rho) + cumul;
      const e = Math.max(0, q.besoin - (yj - yi));
      if (e > 0) { ajouts.push({ d: q.d1, e }); cumul += e; }
    }
    return { lam, rho, ajouts, total: brut(n, lam, rho) + cumul };
  };
  let r;
  const lmax = Math.min(s, LOUPE.lmax);
  if (calc(lmax, 1).total <= dispo) {
    // De la place en trop : loin du doigt l'échelle reste resserrée (pas de grand vide) ; la place se
    // répartit à parts égales devant chaque rangée de cette moitié (elles restent près de leur place).
    r = calc(lmax, 1);
    const ancres = contraintes.map((q) => q.d1);
    if (contraintes.length) ancres.unshift(contraintes[0].d0);
    if (ancres.length) { const e = (dispo - r.total) / ancres.length; for (const d of ancres) r.ajouts.push({ d, e }); r.total = dispo; }
  } else if (calc(LOUPE.lmin, 1).total <= dispo) {
    let lo = LOUPE.lmin, hi = lmax;
    for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (calc(m, 1).total > dispo) hi = m; else lo = m; }
    r = calc(lo, 1);
  } else {
    let lo = 0, hi = 1;
    for (let i = 0; i < 16; i++) { const m = (lo + hi) / 2; if (calc(LOUPE.lmin, m).total > dispo) hi = m; else lo = m; }
    r = calc(LOUPE.lmin, lo);
  }
  const f = (d) => y0 + sens * (brut(d, r.lam, r.rho) + r.ajouts.filter((a) => a.d <= d + 1e-9).reduce((t, a) => t + a.e, 0));
  // Pas moyen de cette moitié (px par tranche) : celui du rail resserré, que le doigt suit au-delà de la fenêtre.
  f.moy = n > 0 ? r.total / n : s;
  return f;
}

/* Le rail pendant le geste. La fenêtre (centre c, affiché en Yc, écart s) est régulière ; hors d'elle,
   le rail se resserre pour tenir entre ses bornes (haut, bas). Les rangées sont à leur ancre, sauf
   près de la carte prise (elles s'écartent au-dessus ou en dessous) ; elles ne se chevauchent jamais. */
function calculerLoupe(A, st, rangs, carte) {
  const W = LOUPE.W, ta = Math.max(A.t0, st.c - W), tb = Math.min(A.t1, st.c + W);
  const ya = st.Yc - (st.c - ta) * st.s, yb = st.Yc + (tb - st.c) * st.s;
  // L'échelle garde la place des rangées entre elles ; la carte, elle, écarte les rangées, pas les
  // graduations (sinon elle pousserait l'échelle devant le doigt).
  const contraintes = (liste, bord) => {
    const out = [];
    let prec = null;
    for (const r of liste) {
      const d = Math.abs(r.t - bord);
      if (prec) out.push({ d0: prec.d, d1: d, besoin: prec.h / 2 + r.h / 2 + 2 });
      prec = { d, h: r.h };
    }
    return out;
  };
  const bas = rangs.filter((r) => r.t > tb).sort((a, b) => a.t - b.t);
  const haut = rangs.filter((r) => r.t < ta).sort((a, b) => b.t - a.t);
  // En haut, la place de la demi-tête d'ébullition au-dessus de son ancre.
  // Les graduations cachées (autres segments, passages) se serrent davantage que celles du segment sous le doigt.
  const [s0, s1] = A.bornes[st.seg];
  const poids = (t) => (t >= s0 && t <= s1 ? 1 : 0.4);
  const fBas = demiRail(A.t1 - tb, yb, 1, st.basB - yb - 4, st.s, contraintes(bas, tb), (k) => poids(tb + k + 0.5));
  const fHaut = demiRail(ta - A.t0, ya, -1, ya - st.hautB - 16, st.s, contraintes(haut, ta), (k) => poids(ta - k - 0.5));
  const Y = (t) => (t > tb ? fBas(t - tb) : t < ta ? fHaut(ta - t) : st.Yc + (t - st.c) * st.s);
  const P = {};
  for (const k of A.ticks) P[k.v] = Y(k.t);
  // Rangées : à leur ancre ; au-dessus de la carte, on remonte depuis elle ; en dessous, on descend.
  const pos = {};
  let lim = carte.haut - 4;
  for (const r of rangs.filter((x) => x.t < st.tf).sort((a, b) => b.t - a.t)) { const b = Math.min(Y(r.t) + r.h / 2, lim); pos[r.cle] = b - r.h; lim = b - r.h - 2; }
  const hautMin = lim + 2;
  lim = carte.bas + 4;
  let basMax = Y(A.t1);
  for (const r of rangs.filter((x) => x.t >= st.tf).sort((a, b) => a.t - b.t)) { const t = Math.max(Y(r.t) - r.h / 2, lim); pos[r.cle] = t; lim = t + r.h + 2; basMax = Math.max(basMax, lim - 2); }
  // La carte peut dépasser le bas du rail ; seules les rangées le font grandir.
  return { P, pos, Y, hautMin, basMax, carteBas: carte.bas, moyB: fBas.moy, moyH: fHaut.moy };
}

let GESTE = null;
/* La loupe s'ouvre au premier mouvement du doigt, ou après 120 ms de maintien : un toucher bref
   sur la poignée ne fait rien clignoter. */
function brancherGlisser(poignee, carte, l) {
  let attente = null;
  const demarrer = (cy) => {
    const a = attente;
    attente = null;
    clearTimeout(a.timer);
    GESTE = ouvrirLoupe(carte, l, a);
    if (cy != null) GESTE.suivre(cy);
  };
  poignee.addEventListener('pointerdown', (e) => {
    if (e.button > 0 || GESTE || attente) return;
    e.preventDefault();
    try { poignee.setPointerCapture(e.pointerId); } catch (x) { /* rien */ }
    attente = { clientY: e.clientY, pointerId: e.pointerId };
    attente.timer = setTimeout(() => { if (attente) demarrer(null); }, 120);
  });
  poignee.addEventListener('pointermove', (e) => {
    if (attente && attente.pointerId === e.pointerId) { if (Math.abs(e.clientY - attente.clientY) >= 2) demarrer(e.clientY); }
    else if (GESTE && GESTE.id === e.pointerId) GESTE.suivre(e.clientY);
  });
  poignee.addEventListener('pointerup', (e) => {
    if (attente && attente.pointerId === e.pointerId) { clearTimeout(attente.timer); attente = null; return; }
    if (GESTE && GESTE.id === e.pointerId) GESTE.lacher(e.clientY);
  });
  // D42 : un geste interrompu par le téléphone (pointercancel, touchcancel, capture perdue) rend tout.
  const interrompre = () => {
    if (attente) { clearTimeout(attente.timer); attente = null; }
    if (GESTE && GESTE.carte === carte) GESTE.annuler();
  };
  poignee.addEventListener('pointercancel', interrompre);
  poignee.addEventListener('touchcancel', interrompre);
  poignee.addEventListener('lostpointercapture', () => { setTimeout(interrompre, 0); });
}

function ouvrirLoupe(carte, l, ev) {
  const fr = carte.parentElement, app = fr.parentElement;
  const R0 = fr.getBoundingClientRect();
  const lignes = [...fr.children].filter((r) => r.dataset.rang);
  const repos = new Map(lignes.map((r) => { const b = r.getBoundingClientRect(); return [r, { top: b.top - R0.top, h: b.height }]; }));
  const pq = carte.querySelector('.quand').getBoundingClientRect();
  const yA = pq.top + pq.height / 2 - R0.top;
  const cr = repos.get(carte), off = yA - cr.top;
  const vA = valeurDe(l);
  const A = axeLoupe();
  const q = carte.querySelector('[data-role="quand"]'), type = carte.querySelector('[data-role="type-ajout"]');
  const ticks = [...fr.querySelectorAll('.grad')].map((el) => ({ el, v: el.dataset.etape, s: el.dataset.graduation, t: A.T[el.dataset.etape], etat: '', y: null }));
  const tetes = Object.fromEntries(lignes.filter((r) => /^T-/.test(r.dataset.rang)).map((r) => [r.dataset.rang, r]));
  const axe = fr.querySelector('.axe');
  // Tout sort du flux sans bouger (positions du repos) ; les rangées se compactent, les autres lignes se
  // réduisent à leur nom et leur moment ; leurs hauteurs sont mesurées ensuite.
  fr.style.height = R0.height + 'px';
  fr.setAttribute('data-geste', '');
  for (const [r, pp] of repos) r.style.transform = 'translateY(' + pp.top + 'px)';
  carte.setAttribute('data-glisse', '');
  carte.classList.add('leve');
  for (const r of lignes) if (r !== carte && /^L/.test(r.dataset.rang)) r.classList.add('jeton');
  const hauteur = new Map(lignes.map((r) => [r, r.getBoundingClientRect().height]));
  // Les rangées sur l'axe : rangées nommées et autres lignes.
  const rangs = [
    ...Object.entries(tetes).filter(([k]) => k in A.ancres).map(([k, el]) => ({ cle: k, el, t: A.ancres[k], h: hauteur.get(el) })),
    ...lignes.filter((r) => r !== carte && /^L/.test(r.dataset.rang)).map((el) => ({ cle: el.dataset.rang, el, t: ancreValeur(A, valeurDe(ETAT.lignes.find((y) => 'L' + y.id === el.dataset.rang))), h: hauteur.get(el) })),
  ];
  const y0 = ev.clientY;
  const g = { id: ev.pointerId, carte, v: vA, seg: segDe(vA), bouge: false, dy: 0 };
  // État de la loupe : centre c sur la tranche de la ligne, affiché sous le doigt ; bornes du repos.
  const st = { seg: segDe(vA), c: ancreValeur(A, vA), Yc: yA, s: LOUPE.ecart[segDe(vA)], tf: ancreValeur(A, vA), hautB: 0, basB: R0.height };
  const carteEn = (y) => ({ haut: y - off, bas: y - off + cr.h });
  let G = calculerLoupe(A, st, rangs, carteEn(yA));
  const plusProche = (y) => { let b = A.ticks[0], d = Infinity; for (const k of A.ticks) { const x = Math.abs(G.P[k.v] - y); if (x < d) { d = x; b = k; } } return b; };

  // L'ouverture : de la place au repos à la place sur l'échelle, en 170 ms (aussitôt en mouvement réduit).
  let p = REDUIT ? 1 : 0;
  const t0 = performance.now();
  const lisse = (k) => 1 - Math.pow(1 - k, 3);
  const deplacer = (el, y) => { if (el._y === undefined || Math.abs(el._y - y) > 0.3) { el._y = y; el.style.transform = 'translateY(' + y.toFixed(1) + 'px)'; } };
  const poserTout = () => {
    const k = p >= 1 ? 1 : lisse(p);
    for (const r of rangs) deplacer(r.el, repos.get(r.el).top + (G.pos[r.cle] - repos.get(r.el).top) * k);
    for (const tk of ticks) {
      deplacer(tk.el, G.P[tk.v] - 1);
      const etat = tk.s !== g.seg ? '' : Math.abs(tk.t - st.c) <= LOUPE.W + 0.01 ? 'vue' : 'vue loin';
      if (etat !== tk.etat) { tk.etat = etat; tk.el.classList.toggle('vue', etat !== ''); tk.el.classList.toggle('loin', etat === 'vue loin'); }
    }
    const haut = Math.min(G.pos['T-ebu'] + hauteur.get(tetes['T-ebu']) / 2, G.P[A.ticks[0].v]);
    axe.style.top = haut + 'px';
    axe.style.height = Math.max(0, Math.max(G.pos['T-dryPost'] + hauteur.get(tetes['T-dryPost']) / 2, G.P[A.ticks[A.ticks.length - 1].v]) - haut) + 'px';
    fr.style.height = Math.max(st.basB, G.basMax + 6, G.carteBas + 6) + 'px';
    app.classList.toggle('rail-haut', Math.min(G.hautMin, G.P[A.ticks[0].v]) < -8);
  };

  tetes[TETE_SEG[g.seg]].classList.add('focus');
  poserTout();
  if (p < 1) requestAnimationFrame(function ouvre(now) { if (g.ferme) return; p = Math.min(1, (now - t0) / LOUPE.ouverture); poserTout(); if (p < 1 && !g.ferme) requestAnimationFrame(ouvre); });

  g.suivre = (cy) => {
    const dy = cy - y0, y = yA + dy;
    g.dy = dy;
    carte.style.transform = 'translateY(' + (cr.top + dy) + 'px)';
    if (!g.bouge && Math.abs(dy) >= 3) g.bouge = true;
    // La tranche sous le doigt ; au bord de la fenêtre, le doigt l'entraîne (la tranche reste sous lui).
    // Dans la fenêtre, la tranche suit le doigt à l'écart de la loupe (on vise juste) ; au-delà de son
    // bord, le doigt l'entraîne au pas du rail resserré (comme le Dock : le bas du rail, c'est la fin
    // du rail), et la tranche atteinte se pose au bord de la fenêtre, sous le doigt.
    const W = LOUPE.W, yb = st.Yc + W * st.s, ya = st.Yc - W * st.s;
    let tf;
    if (y > yb && st.c + W < A.tMax) { tf = Math.min(A.tMax, st.c + W + (y - yb) / G.moyB); st.c = tf - W; st.Yc = y - W * st.s; }
    else if (y < ya && st.c - W > A.tMin) { tf = Math.max(A.tMin, st.c - W - (ya - y) / G.moyH); st.c = tf + W; st.Yc = y + W * st.s; }
    else tf = Math.max(A.tMin, Math.min(A.tMax, st.c + (y - st.Yc) / st.s));
    st.tf = tf;
    G = calculerLoupe(A, st, rangs, carteEn(y));
    const pr = plusProche(y);
    // Un autre segment sous le doigt : sa loupe prend son écart, la tranche sous le doigt ne bouge pas.
    if (pr.s !== g.seg) {
      tetes[TETE_SEG[g.seg]].classList.remove('focus');
      g.seg = pr.s;
      tetes[TETE_SEG[g.seg]].classList.add('focus');
      st.seg = g.seg; st.s = LOUPE.ecart[g.seg]; st.Yc = y - (tf - st.c) * st.s;
      G = calculerLoupe(A, st, rangs, carteEn(y));
    }
    poserTout();
    const v = plusProche(y).v;
    if (g.bouge && v !== g.v) {
      g.v = v;
      const x = { ...l }; appliquer(x, v);
      q.textContent = quand(x);
      if (type) type.textContent = mom(x.moment).type;
    }
  };
  const fermer = (change) => {
    g.ferme = true;
    GESTE = null;
    const avant = new Map(lignes.map((r) => [r.dataset.rang, r.getBoundingClientRect().top]));
    const estompe = app.classList.contains('rail-haut');
    app.classList.remove('rail-haut');
    if (g.bouge) IGNORE_CLIC = performance.now() + 400;
    ETAT.focusK = 'q' + l.id;
    rendre(change);
    if (REDUIT) return;
    // Tout se referme : chaque rangée revient de sa place sur l'échelle à sa place au repos.
    const fr2 = app.querySelector('.frise');
    if (fr2) for (const r of fr2.children) {
      const t0b = avant.get(r.dataset.rang);
      if (t0b == null) continue;
      const d = t0b - r.getBoundingClientRect().top;
      if (Math.abs(d) > 0.5) r.animate([{ transform: 'translateY(' + d + 'px)' }, { transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
    if (estompe) for (const x of app.querySelectorAll(':scope > .barre, :scope > .resume')) x.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
  };
  g.lacher = (cy) => {
    g.suivre(cy);
    const v = g.bouge ? plusProche(yA + g.dy).v : vA;
    const change = v !== vA;
    if (change) appliquer(l, v);
    fermer(change);
  };
  g.annuler = () => fermer(false);
  return g;
}

VARIANTE = {
  etape(app) {
    app.append(enTete(), resume(), frise(), zoneAjouts(), ...[goutsLigne(), panLigne()].filter(Boolean));
  },
};
