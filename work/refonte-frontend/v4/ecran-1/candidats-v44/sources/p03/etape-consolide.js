/* Étape houblons, base v4 : le rail des étapes (BRIEF-RAIL.md ; D27, D28, D34 à D37, D41 à D47, D55, D56).
   Au repos, un rail compact et sans graduation : la durée d'ébullition lue dans la recette (avec un
   renvoi, D37 révisé), les lignes de la recette posées à leur moment, 0′, le whirlpool, la levure
   (D28), la fermentation et la post-fermentation. Le rail ne porte que la recette : les ajouts
   proposés vivent à part, sous le rail, chacun avec son moment suggéré (D41).
   La loupe (D47, D55, D61) : la poignée prise, le rail devient une échelle continue et fixe pendant
   tout le geste (ébullition par 5′ de la durée à 0′, whirlpool de 100 à 60 °C par 5, fermentation puis
   post-fermentation de J+0 à J+14), chaque segment régulier (D45) : la hauteur dit le temps ; le
   segment de la ligne tenue est agrandi, les autres resserrés, le tout dans la hauteur du repos ; la
   graduation de la ligne reste sous le doigt à la prise, et le moment ne dépend que de la position du
   doigt. Seules les graduations du segment sous le doigt se montrent. Le geste (D46) : la carte, réduite
   à une ligne, suit le doigt en translation seule, l'étiquette suit la tranche ; les rangées (étapes,
   0′, levure) et les autres lignes restent à leur hauteur, côte à côte au même moment, sans jamais se
   chevaucher (D56). Rien n'est recalculé avant le lâcher, où la ligne prend
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

/* ---------- La loupe et le geste (D47, D55, D56, D61) ---------- */
/* Pendant le geste, la hauteur dit le temps (D61) : le rail devient une échelle fixe, chaque segment
   régulier (ébullition par 5′, whirlpool par 5 °C, fermentation et post-fermentation par jour) ; le
   segment de la ligne tenue reçoit la plus grande part de la place (la loupe), les autres se
   resserrent, et le tout tient dans la hauteur du repos (+ 80 px au plus, D55). L'échelle est posée à
   la prise, la graduation de la ligne sous le doigt, et ne bouge plus : le moment ne dépend que de la
   position du doigt, jamais du chemin ni de la vitesse.
   Variante p03 du lot 8, la règle à côté (D63, D64) : le rail reste immobile et linéaire ; une règle
   verticale grossie (data-role="loupe") apparaît à côté de la pastille tenue, centrée sur le doigt,
   et écrit les graduations de son segment (35′, 40′…) ; elle défile sous le doigt, le rail non.
   Les autres lignes restent exactement à la hauteur de leur moment, sans aller de côté ; deux lignes
   qui se touchent se réunissent en une seule étiquette (« 35′ Motueka · Nugget »). */
const nIntervalles = (s) => valeursSeg(s).length - 1;
const LOUPE = { poids: 5, max: { focus: 16, autre: 3 }, min: { focus: 8, autre: 1.2 }, plancher: 4, marge: 80, ouverture: 170, regle: { pas: 26, demi: 92, largeur: 64 } };
/* Le moment d'une valeur, écrit comme sur la pastille (35′, 80 °C, J+3). */
const dire = (v) => { const x = { moment: 'b0', jour: 0, wpT: 80 }; appliquer(x, v); return quand(x); };
// Écarts fixes de la structure (px) : tête d'ébullition → début, 0′ → whirlpool, whirlpool → 100 °C,
// 60 °C → levure, levure → fermentation, fermentation → J+0, J+14 → post, post → J+0, fin du rail.
const STRUCT = [16, 20, 12, 16, 22, 12, 16, 12, 6];
function axeLoupe() {
  const T = {}, ticks = [];
  for (const s of SEGMENTS) valeursSeg(s).forEach((v, k) => { T[v] = { s, k }; ticks.push({ v, s, k }); });
  return { T, ticks };
}
/* Plan du rail pour des écarts e (par segment) et des ajouts aux écarts de structure x, la tête
   d'ébullition centrée en h : y de chaque graduation (P), centre des rangées nommées (R), haut, bas. */
function planFixe(e, x, h) {
  const g = (i) => STRUCT[i] + (x[i] || 0);
  const P = {}, R = { 'T-ebu': h };
  let y = h + g(0);
  const poser = (s) => { valeursSeg(s).forEach((v, k) => { P[v] = y + k * e[s]; }); y += nIntervalles(s) * e[s]; };
  poser('ebullition');
  R['T-fin'] = y; R['T-wp'] = y + g(1); y = R['T-wp'] + g(2);
  poser('whirlpool');
  R['T-levure'] = y + g(3); R['T-dryActive'] = R['T-levure'] + g(4); y = R['T-dryActive'] + g(5);
  poser('fermentation');
  R['T-dryPost'] = y + g(6); y = R['T-dryPost'] + g(7);
  poser('post');
  return { P, R, haut: h - 10, bas: y + g(8) };
}
/* Index des écarts de structure situés avant une valeur (au-dessus d'elle sur le rail). */
const structAvant = (v) => ({ ebullition: 1, whirlpool: 3, fermentation: 6, post: 8 })[segDe(v)];
/* L'échelle de la prise : la graduation vA sous le doigt (yA) ; les écarts e = λ × poids (le segment
   tenu pèse LOUPE.poids), bornés ; λ le plus grand qui tient sous le doigt (hauteur du repos + 80 px)
   et au-dessus (la tête dans le rail ; pour une longue ébullition, jusqu'en haut de l'écran). La place
   en trop sous le doigt s'ajoute aux écarts de structure (le rail ne remonte pas) ; au-dessus d'une
   ligne hors ébullition aussi (le haut du rail reste en place). */
function disposerFixe(vA, yA, H0, frTop) {
  const segA = segDe(vA);
  const ecarts = (lam) => Object.fromEntries(SEGMENTS.map((s) => [s, s === segA
    ? Math.max(LOUPE.min.focus, Math.min(LOUPE.max.focus, lam * LOUPE.poids))
    : Math.max(LOUPE.min.autre, Math.min(LOUPE.max.autre, lam))]));
  const mesure = (e, x) => { const p = planFixe(e, x, 0); const off = vA === 'fwh' ? p.P['b' + EBU] - e.ebullition : p.P[vA]; return { off, dessous: p.bas - off }; };
  const tient = (lam, haut) => { const m = mesure(ecarts(lam), []); return m.dessous <= H0 + LOUPE.marge - yA && yA - m.off - 10 >= haut; };
  let haut = 0, lam = 0.05;
  for (const essai of [0, 8 - frTop]) {
    haut = essai;
    let lo = 0.05, hi = 20;
    if (!tient(lo, haut)) { lam = lo; continue; }
    for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (tient(m, haut)) lo = m; else hi = m; }
    lam = lo;
    if (ecarts(lam)[segA] >= LOUPE.min.focus || segA !== 'ebullition') break;
  }
  let e = ecarts(lam);
  // Longue ébullition qui ne tient pas : l'ébullition descend jusqu'au plancher, et le rail monte.
  if (segA === 'ebullition' && yA - mesure(e, []).off - 10 < haut) {
    const iA = vA === 'fwh' ? 0 : valeursSeg('ebullition').indexOf(vA);
    if (iA > 0) e.ebullition = Math.max(LOUPE.plancher, Math.min(e.ebullition, (yA - 10 - haut - STRUCT[0]) / iA));
  }
  const x = [];
  const m = mesure(e, x);
  const k = structAvant(vA);
  const reste = H0 - (yA + m.dessous);
  if (reste > 0) { const n = STRUCT.length - 1 - k; for (let i = k; i < STRUCT.length - 1; i++) x[i] = reste / n; }
  if (segA !== 'ebullition') { const libre = yA - m.off - 10; if (libre > 0) for (let i = 0; i < k; i++) x[i] = (x[i] || 0) + libre / k; }
  const m2 = mesure(e, x);
  const G = planFixe(e, x, yA - m2.off);
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
  const lignes = [...fr.children].filter((r) => r.dataset.rang);
  const repos = new Map(lignes.map((r) => { const b = r.getBoundingClientRect(); return [r, b.top - R0.top]; }));
  const pq = carte.querySelector('.quand').getBoundingClientRect();
  const yA = pq.top + pq.height / 2 - R0.top;
  const topCarte = repos.get(carte), off = yA - topCarte;
  const vA = valeurDe(l);
  const A = axeLoupe();
  const q = carte.querySelector('[data-role="quand"]'), type = carte.querySelector('[data-role="type-ajout"]');
  const ticks = [...fr.querySelectorAll('.grad')].map((el) => ({ el, v: el.dataset.etape, s: el.dataset.graduation, etat: '' }));
  const tetes = Object.fromEntries(lignes.filter((r) => /^T-/.test(r.dataset.rang)).map((r) => [r.dataset.rang, r]));
  const axe = fr.querySelector('.axe');
  // Tout sort du flux sans bouger ; la carte tenue se réduit à une ligne, les autres lignes à leur nom
  // et leur moment, les rangées nommées se compactent ; les hauteurs sont mesurées ensuite.
  fr.style.height = R0.height + 'px';
  fr.setAttribute('data-geste', '');
  for (const [r, top] of repos) r.style.transform = 'translateY(' + top + 'px)';
  carte.setAttribute('data-glisse', '');
  carte.classList.add('leve');
  for (const r of lignes) if (r !== carte && /^L/.test(r.dataset.rang)) r.classList.add('jeton');
  const hauteur = new Map(lignes.map((r) => [r, r.getBoundingClientRect().height]));
  const hCarte = hauteur.get(carte);
  const G = disposerFixe(vA, yA, R0.height, R0.top);
  const ancre = (v) => G.P[v] ?? (v === 'fwh' ? G.P['b' + EBU] - G.e.ebullition : G.P[valeursSeg(segDe(v)).slice(-1)[0]]);
  // Les rangées nommées et les autres lignes, à leur hauteur (centre).
  const rangees = Object.entries(tetes).filter(([k]) => k in G.R).map(([k, el]) => ({ el, y: G.R[k], h: hauteur.get(el), tete: true, large: k === 'T-levure' }));
  // Les autres lignes : chacune exactement à la hauteur de son moment, jamais de côté (D61, D64).
  const jetons = lignes.filter((r) => r !== carte && /^L/.test(r.dataset.rang)).map((el) => {
    const lj = ETAT.lignes.find((x) => 'L' + x.id === el.dataset.rang), v = valeurDe(lj);
    return { el, l: lj, v, y: ancre(v), h: hauteur.get(el) };
  }).sort((a, b) => a.y - b.y);
  const y0 = ev.clientY;
  const g = { id: ev.pointerId, carte, v: vA, seg: segDe(vA), bouge: false, dy: 0 };
  const plusProche = (y) => { let b = A.ticks[0], d = Infinity; for (const k of A.ticks) { const x = Math.abs(G.P[k.v] - y); if (x < d) { d = x; b = k; } } return b; };
  // Deux lignes qui se touchent se réunissent en une étiquette, à la place de la première
  // (« 35′ Motueka · Nugget ») : aucune n'est poussée ailleurs (D56, D64).
  const avec = (el) => el.querySelector('.avec') || el.querySelector('.l1').appendChild(h('span', { class: 'avec' }));
  const nomDans = (j, v) => j.l.nom + (j.v === v ? '' : ' ' + dire(j.v));
  const grappes = [];
  for (const j of jetons) {
    const d = grappes[grappes.length - 1];
    if (d && Math.abs(d.tete.y - j.y) < (d.tete.h + j.h) / 2 - 1) d.membres.push(j); else grappes.push({ tete: j, membres: [] });
  }
  for (const gr of grappes) if (gr.membres.length) {
    avec(gr.tete.el).textContent = ' · ' + gr.membres.map((j) => nomDans(j, gr.tete.v)).join(' · ');
    for (const j of gr.membres) j.el.classList.add('fondu');
  }
  // La carte tenue réunit sous son nom les lignes qu'elle touche (même moment, ou trop proches).
  const avecCarte = avec(carte);
  const pq2 = carte.querySelector('.quand').getBoundingClientRect(), cb = carte.querySelector('.corps-b').getBoundingClientRect();
  const cMil = pq2.top + pq2.height / 2;
  const cHaut = Math.min(pq2.top, cb.top) - cMil, cBas = Math.max(pq2.bottom, cb.bottom) - cMil;
  let reunies = null;
  const reunir = () => {
    const prises = grappes.filter((gr) => yDoigt + cHaut < gr.tete.y + gr.tete.h / 2 - 1 && gr.tete.y - gr.tete.h / 2 + 1 < yDoigt + cBas);
    const cle = prises.map((gr) => gr.tete.l.id).join(',') + '|' + g.v;
    if (cle === reunies) return;
    reunies = cle;
    for (const gr of grappes) for (const j of [gr.tete, ...gr.membres]) j.el.classList.toggle('fondu', prises.includes(gr) || j !== gr.tete);
    avecCarte.textContent = prises.length ? ' · ' + prises.flatMap((gr) => [gr.tete, ...gr.membres]).map((j) => nomDans(j, g.v)).join(' · ') : '';
  };
  // La règle à côté (p03) : posée à droite des noms du rail (carte, lignes, rangées), jamais dessus.
  const RG = LOUPE.regle;
  // Bord droit du texte (et non de la boîte, qu'une grille étire sur toute la largeur).
  const droite = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().right - R0.left; };
  const noms = [carte, ...jetons.map((j) => j.el)].map((el) => el.querySelector('.l1')).concat([...fr.querySelectorAll('.r-ebu .cle, .r-ebu .ebu-v, .r-etape .r-nom, .r-fin .r-nom')]);
  // La place de l'étiquette réunie la plus longue que la carte tenue puisse porter : la règle ne bougera pas.
  const plusLongue = grappes.map((gr) => ' · ' + [gr.tete, ...gr.membres].map((j) => nomDans(j, '')).join(' · ')).sort((a, b) => b.length - a.length)[0] || '';
  avecCarte.textContent = plusLongue;
  const xNoms = Math.max(...noms.map(droite));
  avecCarte.textContent = '';
  const xRegle = Math.round(Math.min(R0.width - RG.largeur - 2, xNoms + 14));
  carte.style.maxWidth = (xRegle - 8) + 'px';
  for (const j of jetons) j.el.style.maxWidth = (xRegle - 8) + 'px';
  const piste = h('div', { class: 'regle-piste' });
  const regle = h('div', { class: 'regle', 'data-role': 'loupe', 'aria-hidden': 'true' }, h('i', { class: 'regle-repere' }), piste);
  regle.style.left = xRegle + 'px';
  fr.append(regle);
  let regleSeg = null, crans = [];
  const limH = G.haut < -8 ? G.haut : 0;
  // La levure est la seule rangée large : la règle s'arrête au-dessus (ébullition, whirlpool) ou dessous.
  const lev = rangees.find((r) => r.large);
  const poserRegle = () => {
    if (regleSeg !== g.seg) {
      regleSeg = g.seg;
      crans = valeursSeg(regleSeg).map((v) => ({ v, el: h('span', { class: 'rc' + (majeure(regleSeg, v) ? ' maj' : '') }, h('i'), h('b', {}, dire(v))), vu: null, ici: null }));
      piste.replaceChildren(...crans.map((c) => c.el));
    }
    const V = valeursSeg(regleSeg), n = V.length - 1;
    // Position continue du doigt dans le segment, bornée à ses extrémités (la règle bute, comme un sélecteur).
    const idx = Math.max(0, Math.min(n, (yDoigt - G.P[V[0]]) / G.e[regleSeg]));
    const avant = regleSeg === 'ebullition' || regleSeg === 'whirlpool';
    const haut = Math.max(limH, yDoigt - RG.demi, !avant && lev ? lev.y + lev.h / 2 + 4 : -Infinity);
    const bas = Math.min(Math.max(R0.height, G.bas), yDoigt + RG.demi, avant && lev ? lev.y - lev.h / 2 - 4 : Infinity);
    const H = Math.max(28, bas - haut);
    regle.style.transform = 'translateY(' + haut.toFixed(1) + 'px)';
    regle.style.height = H.toFixed(1) + 'px';
    regle.style.setProperty('--repere', (yDoigt - haut).toFixed(1) + 'px');
    crans.forEach((c, k) => {
      const y = yDoigt - haut + (k - idx) * RG.pas;
      const vu = y > 9 && y < H - 9;
      if (vu !== c.vu) { c.vu = vu; c.el.style.visibility = vu ? '' : 'hidden'; }
      if (vu) c.el.style.transform = 'translateY(' + (y - 8).toFixed(1) + 'px)';
      const ici = c.v === g.v;
      if (ici !== c.ici) { c.ici = ici; c.el.classList.toggle('ici', ici); }
    });
  };
  // L'ouverture : de la place au repos à la place sur l'échelle, en 170 ms (aussitôt en mouvement réduit).
  let p = REDUIT ? 1 : 0;
  const t0 = performance.now();
  const lisse = (k) => 1 - Math.pow(1 - k, 3);
  const placer = (el, x, y) => { const s = 'translate(' + x + 'px,' + y.toFixed(1) + 'px)'; if (el._t !== s) { el._t = s; el.style.transform = s; } };
  let yDoigt = yA;
  const poserTout = () => {
    const k = p >= 1 ? 1 : lisse(p);
    const vers = (el, cible) => repos.get(el) + (cible - repos.get(el)) * k;
    for (const r of rangees) placer(r.el, 0, vers(r.el, r.y - r.h / 2));
    for (const j of jetons) placer(j.el, 0, vers(j.el, j.y - j.h / 2));
    reunir();
    for (const tk of ticks) {
      const y = G.P[tk.v];
      if (tk.y !== y) { tk.y = y; tk.el.style.transform = 'translateY(' + (y - 1) + 'px)'; }
      // La loupe : près du doigt, les graduations sont longues et foncées ; plus loin, courtes et claires.
      const etat = tk.s !== g.seg ? '' : Math.abs(y - yDoigt) <= 2.5 * G.e[tk.s] + 1 ? 'vue' : 'vue loin';
      if (etat !== tk.etat) { tk.etat = etat; tk.el.classList.toggle('vue', etat !== ''); tk.el.classList.toggle('loin', etat === 'vue loin'); }
    }
    axe.style.top = G.R['T-ebu'] + 'px';
    axe.style.height = Math.max(0, G.bas - 6 - G.R['T-ebu']) + 'px';
    fr.style.height = Math.max(R0.height, G.bas) + 'px';
    app.classList.toggle('rail-haut', G.haut < -8);
    poserRegle();
  };
  tetes[TETE_SEG[g.seg]].classList.add('focus');
  poserTout();
  if (p < 1) requestAnimationFrame(function ouvre(now) { if (g.ferme) return; p = Math.min(1, (now - t0) / LOUPE.ouverture); poserTout(); if (p < 1) requestAnimationFrame(ouvre); });

  g.suivre = (cy) => {
    const dy = cy - y0;
    g.dy = dy; yDoigt = yA + dy;
    carte.style.transform = 'translateY(' + (topCarte + dy) + 'px)';
    if (!g.bouge && Math.abs(dy) >= 3) g.bouge = true;
    const pr = plusProche(yDoigt);
    if (pr.s !== g.seg) { tetes[TETE_SEG[g.seg]].classList.remove('focus'); g.seg = pr.s; tetes[TETE_SEG[g.seg]].classList.add('focus'); }
    if (g.bouge && pr.v !== g.v) {
      g.v = pr.v;
      const x = { ...l }; appliquer(x, pr.v);
      q.textContent = quand(x);
      if (type) type.textContent = mom(x.moment).type;
    }
    poserTout();
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
