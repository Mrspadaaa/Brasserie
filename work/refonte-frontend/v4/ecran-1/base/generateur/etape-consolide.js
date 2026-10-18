/* Étape houblons, base v4 : le rail des étapes (BRIEF-RAIL.md ; D27, D28, D34 à D37, D41 à D47).
   Au repos, un rail compact et sans graduation : la durée d'ébullition lue dans la recette (avec un
   renvoi, D37 révisé), les lignes de la recette posées à leur moment, 0′, le whirlpool, la levure
   (D28), la fermentation et la post-fermentation. Le rail ne porte que la recette : les ajouts
   proposés vivent à part, sous le rail, chacun avec son moment suggéré (D41).
   La loupe (D47) : la poignée prise, le rail s'ouvre en échelles continues, une par segment, chacune
   régulière (D45) : ébullition par 5′ de la durée à 0′ (D34, D36), whirlpool de 100 à 60 °C par 5,
   fermentation puis post-fermentation de J+0 à J+14 (D44). Le segment de la ligne prise s'ouvre
   autour du doigt (sa graduation reste sous le doigt), les autres se resserrent, et seules les
   graduations du segment sous le doigt se montrent. Le geste (D46) : la carte suit le doigt en
   translation seule, l'étiquette suit la tranche, les autres lignes réduites s'écartent ; rien n'est
   recalculé avant le lâcher, où la ligne prend la tranche, puis l'IBU et le total (tables du pack),
   et tout se referme. Ombre pendant le geste seulement ; un geste interrompu rend tout (D42). */

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

/* ---------- La loupe et le geste ---------- */
// Écart entre deux graduations (px) : segment ouvert, segments d'avant (avant ajustement), segments
// d'après (resserrés jusqu'à ce que le doigt y entre), plafond, confort, plancher.
const ESP = { ouvert: { ebullition: 16, whirlpool: 13, fermentation: 10, post: 10 }, serre: { ebullition: 8, whirlpool: 9, fermentation: 7, post: 7 }, apres: 4, max: 14, confort: 8, min: 5 };
const nIntervalles = (s) => valeursSeg(s).length - 1;
/* Plan du rail ouvert pour des écarts donnés, le centre de la tête d'ébullition à hE (px, depuis le
   haut du rail) : y de chaque graduation (P), centre de chaque rangée nommée (T), bas du rail. */
function plan(e, hE) {
  const P = {}, T = { 'T-ebu': hE };
  let y = hE + 26;
  const poser = (s) => { valeursSeg(s).forEach((v, k) => { P[v] = y + k * e[s]; }); return y + nIntervalles(s) * e[s]; };
  const b0 = poser('ebullition');
  T['T-fin'] = b0; T['T-wp'] = b0 + 28; y = T['T-wp'] + 24;
  const wp = poser('whirlpool');
  T['T-levure'] = wp + 32; T['T-dryActive'] = T['T-levure'] + 34; y = T['T-dryActive'] + 24;
  const f = poser('fermentation');
  T['T-dryPost'] = f + 28; y = T['T-dryPost'] + 24;
  const p = poser('post');
  return { P, T, fin: p, bas: p + 16 };
}
/* Écarts et ancrage : la graduation de la ligne prise (vA) tombe sous le doigt (yA). La place au-dessus
   ouvre un peu les segments d'avant ; si elle manque, on les resserre, puis le segment de la ligne
   jusqu'au confort ; puis le rail peut monter sur l'en-tête (estompé), et en dernier se serrer encore. */
function disposer(vA, yA, frTop) {
  const segA = segDe(vA);
  const avant = SEGMENTS.slice(0, SEGMENTS.indexOf(segA));
  const e = {}; for (const s of SEGMENTS) e[s] = s === segA ? ESP.ouvert[s] : avant.includes(s) ? ESP.serre[s] : ESP.apres;
  const V = valeursSeg(segA);
  let iA = V.indexOf(vA);
  if (iA < 0) iA = vA === 'fwh' ? -1 : Math.min(V.length - 1, Math.max(0, Number(vA.replace(/^\D+/, '')))); // premier moût : juste au-dessus du début
  const pos = () => { const p = plan(e, 0); return p.P[V[0]] + iA * e[segA]; };
  // Poids de chaque écart dans la position de vA, pour viser une position (cible) en réglant des écarts.
  const viser = (cles, poids, cible, lo, hi) => {
    const n = cles.reduce((t, s) => t + poids(s), 0);
    if (!n) return;
    const fixe = pos() - cles.reduce((t, s) => t + poids(s) * e[s], 0);
    const v = Math.max(lo, Math.min(hi, (cible - fixe) / n));
    for (const s of cles) e[s] = v;
  };
  const HAUT = 14, HAUT_TETE = 8 - frTop + 14; // tête d'ébullition dans le rail, ou au plus haut de l'écran
  const wAvant = (s) => nIntervalles(s), wA = () => Math.max(0, iA);
  if (yA - pos() > HAUT) viser(avant, wAvant, yA - HAUT, Math.min(...avant.map((s) => e[s]), ESP.max), ESP.max);
  else if (yA - pos() < HAUT) {
    viser(avant, wAvant, yA - HAUT, ESP.min, Math.min(ESP.max, ...avant.map((s) => e[s])));
    if (yA - pos() < HAUT) viser([segA], wA, yA - HAUT, ESP.confort, e[segA]);
    if (yA - pos() < HAUT_TETE) viser([segA], wA, yA - HAUT_TETE, ESP.min, e[segA]);
  }
  const G = plan(e, yA - pos());
  G.e = e;
  return G;
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
  const rangs = [...fr.children].filter((r) => r.dataset.rang);
  const repos = new Map(rangs.map((r) => { const b = r.getBoundingClientRect(); return [r, { top: b.top - R0.top, h: b.height }]; }));
  const pq = carte.querySelector('.quand').getBoundingClientRect();
  const yA = pq.top + pq.height / 2 - R0.top;
  const cr = repos.get(carte);
  const vA = valeurDe(l);
  let G = disposer(vA, yA, R0.top);
  const limiteBas = innerHeight - R0.top - 10;
  const q = carte.querySelector('[data-role="quand"]'), type = carte.querySelector('[data-role="type-ajout"]');
  const ticks = [...fr.querySelectorAll('.grad')].map((el) => ({ el, v: el.dataset.etape, s: el.dataset.graduation }));
  const tetes = Object.fromEntries(rangs.filter((r) => /^T-/.test(r.dataset.rang)).map((r) => [r.dataset.rang, r]));
  const axe = fr.querySelector('.axe');
  const JETON = 26;
  const jetons = rangs.filter((r) => r !== carte && /^L/.test(r.dataset.rang)).map((r) => ({ el: r, l: ETAT.lignes.find((y) => 'L' + y.id === r.dataset.rang), h: JETON, top: null }));
  let obstacles = [];
  const y0 = ev.clientY;
  const g = { id: ev.pointerId, carte, v: vA, seg: null, bouge: false, dy: 0 };

  // Place chaque rangée, chaque graduation et le rail selon le plan G (transitions CSS).
  const poserPlan = () => {
    for (const [k, r] of Object.entries(tetes)) r.style.transform = 'translateY(' + (G.T[k] - repos.get(r).h / 2) + 'px)';
    for (const t of ticks) t.el.style.transform = 'translateY(' + (G.P[t.v] - 1) + 'px)';
    obstacles = Object.entries(tetes).map(([k, r]) => ({ top: G.T[k] - repos.get(r).h / 2, bas: G.T[k] + repos.get(r).h / 2 }));
    for (const j of jetons) {
      // Premier moût : juste au-dessus du début de l'ébullition ; un jour au-delà de l'échelle : sa fin.
      const v = valeurDe(j.l);
      const y = G.P[v] ?? (v === 'fwh' ? G.P['b' + EBU] - G.e.ebullition : G.P[valeursSeg(segDe(v)).slice(-1)[0]]);
      j.pref = y - JETON / 2;
    }
    fr.style.height = Math.max(G.bas, 0) + 'px';
    axe.style.top = G.T['T-ebu'] + 'px'; axe.style.height = (G.fin - G.T['T-ebu']) + 'px';
  };

  // 1. Tout reste en place, sorti du flux (positions mesurées au repos).
  fr.style.height = R0.height + 'px';
  fr.setAttribute('data-geste', '');
  for (const [r, p] of repos) { r.style.transition = 'none'; r.style.transform = 'translateY(' + p.top + 'px)'; }
  for (const t of ticks) { t.el.style.transition = 'none'; t.el.style.transform = 'translateY(' + (G.P[t.v] - 1) + 'px)'; }
  carte.setAttribute('data-glisse', '');
  carte.classList.add('leve');
  void fr.offsetHeight;
  // 2. Puis le rail s'ouvre : chaque rangée glisse à sa place sur l'échelle, les autres lignes se réduisent.
  for (const r of rangs) if (r !== carte) r.style.transition = '';
  for (const t of ticks) t.el.style.transition = '';
  for (const j of jetons) j.el.classList.add('jeton');
  poserPlan();
  if (G.T['T-ebu'] - 14 < -6) app.classList.add('rail-haut');

  // La tranche sous le doigt : la graduation affichée la plus proche (même pendant qu'un segment s'ouvre).
  const plusProche = (yRel) => {
    let b = ticks[0], d = Infinity;
    for (const t of ticks) { const r = t.el.getBoundingClientRect(); const x = Math.abs(r.top + r.height / 2 - R0.top - yRel); if (x < d) { d = x; b = t; } }
    return b;
  };
  const focus = (s) => {
    if (s === g.seg) return;
    if (g.seg) { for (const t of ticks) if (t.s === g.seg) t.el.classList.remove('vue'); tetes[TETE_SEG[g.seg]].classList.remove('focus'); }
    g.seg = s;
    for (const t of ticks) if (t.s === s) t.el.classList.add('vue');
    tetes[TETE_SEG[s]].classList.add('focus');
  };
  // La loupe suit le doigt sans rien déplacer au-dessus de lui (pas de saut sous le doigt) : un
  // segment atteint par le haut s'ouvre vers le bas ; quitté vers le haut, il se resserre. Le rail
  // reste dans l'écran : en bas, le segment ouvert se serre au besoin.
  const basculer = (s) => {
    const avant = g.seg, e = { ...G.e };
    if (SEGMENTS.indexOf(s) > SEGMENTS.indexOf(avant)) {
      e[s] = Math.max(e[s], ESP.ouvert[s]);
      const trop = plan(e, G.T['T-ebu']).bas - limiteBas;
      if (trop > 0) e[s] = Math.max(G.e[s], e[s] - trop / nIntervalles(s));
    } else e[avant] = Math.min(e[avant], ESP.apres);
    G = plan(e, G.T['T-ebu']); G.e = e;
    poserPlan();
  };
  // Les autres lignes s'écartent de la carte : au-dessus si elles sont avant, en dessous sinon.
  const ecarter = (cTop) => {
    if (!jetons.length) return;
    const cBas = cTop + cr.h, centre = (cTop + cBas) / 2;
    // 1. Chaque ligne à sa graduation, écartée d'une rangée nommée du plus petit déplacement (elle
    //    reste dans son segment), sans chevaucher la précédente.
    const tri = [...jetons].sort((a, b) => a.pref - b.pref);
    let plancher = -Infinity;
    for (const j of tri) {
      let t = j.pref;
      for (const o of obstacles) if (t < o.bas + 2 && t + j.h > o.top - 2) t = t + j.h / 2 < (o.top + o.bas) / 2 ? o.top - 2 - j.h : o.bas + 2;
      j.y = Math.max(t, plancher); plancher = j.y + j.h + 2;
    }
    // 2. La carte prise passe : les lignes d'avant montent au-dessus d'elle, les suivantes descendent.
    const haut = tri.filter((j) => j.y + j.h / 2 < centre), bas = tri.filter((j) => j.y + j.h / 2 >= centre);
    let plafond = cTop - 4;
    for (const j of [...haut].reverse()) { if (j.y + j.h > plafond) j.y = plafond - j.h; plafond = j.y - 2; }
    plancher = cBas + 4;
    for (const j of bas) { if (j.y < plancher) j.y = plancher; plancher = j.y + j.h + 2; }
    for (const j of jetons) if (j.top === null || Math.abs(j.top - j.y) > 0.5) { j.top = j.y; j.el.style.transform = 'translateY(' + j.y + 'px)'; }
  };
  g.suivre = (cy) => {
    const dy = cy - y0;
    g.dy = dy;
    carte.style.transform = 'translateY(' + (cr.top + dy) + 'px)';
    if (!g.bouge && Math.abs(dy) >= 3) g.bouge = true;
    const p = plusProche(yA + dy);
    if (p.s !== g.seg) { basculer(p.s); focus(p.s); }
    if (g.bouge && p.v !== g.v) {
      g.v = p.v;
      const x = { ...l }; appliquer(x, p.v);
      q.textContent = quand(x);
      if (type) type.textContent = mom(x.moment).type;
    }
    ecarter(cr.top + dy);
  };
  const fermer = (change) => {
    GESTE = null;
    const avant = new Map(rangs.map((r) => [r.dataset.rang, r.getBoundingClientRect().top]));
    const estompe = app.classList.contains('rail-haut');
    app.classList.remove('rail-haut');
    if (g.bouge) IGNORE_CLIC = performance.now() + 400;
    ETAT.focusK = 'q' + l.id;
    rendre(change);
    if (REDUIT) return;
    // Tout se referme : chaque rangée revient de sa place sur l'échelle à sa place au repos.
    const fr2 = app.querySelector('.frise');
    if (fr2) for (const r of fr2.children) {
      const t0 = avant.get(r.dataset.rang);
      if (t0 == null) continue;
      const d = t0 - r.getBoundingClientRect().top;
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
  focus(segDe(vA));
  ecarter(cr.top);
  return g;
}

VARIANTE = {
  etape(app) {
    app.append(enTete(), resume(), frise(), zoneAjouts(), ...[goutsLigne(), panLigne()].filter(Boolean));
  },
};
