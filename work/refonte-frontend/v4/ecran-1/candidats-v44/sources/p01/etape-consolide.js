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
   position du doigt, jamais du chemin ni de la vitesse. p01 : les autres lignes ne bougent jamais
   (D64) ; au même moment que la carte tenue, une seule étiquette réunie ; la loupe est une bulle
   façon iOS à côté du doigt (±15′ grossis environ trois fois, graduations écrites, houblons). */
const nIntervalles = (s) => valeursSeg(s).length - 1;
const LOUPE = { poids: 5, max: { focus: 16, autre: 3 }, min: { focus: 8, autre: 1.2 }, plancher: 4, marge: 80, ouverture: 170, couloir: 200 };
// Écarts fixes de la structure (px) : tête d'ébullition → début, 0′ → whirlpool, whirlpool → 100 °C,
// 60 °C → levure, levure → fermentation, fermentation → J+0, J+14 → post, post → J+0, fin du rail.
const STRUCT = [16, 20, 12, 16, 22, 12, 16, 12, 6];
/* p01 : les autres houblons ne bougent jamais (D64). Un houblon posé sur la première ou la dernière
   graduation d'un segment ne doit pas toucher la rangée voisine : l'écart de structure s'ouvre juste
   assez, pour ce geste seulement. */
let STRUCT_G = STRUCT;
function structPour(l) {
  const s = [...STRUCT];
  const vals = new Set(ETAT.lignes.filter((x) => x !== l).map(valeurDe));
  const wp = valeursSeg('whirlpool');
  const besoin = (i, n) => { s[i] = Math.max(s[i], n); };
  if (vals.has('b' + EBU)) besoin(0, 23);
  if (vals.has('fwh')) besoin(0, 40);
  if (vals.has(wp[0])) besoin(2, 23);
  if (vals.has(wp[wp.length - 1])) besoin(3, 29);
  if (vals.has('f0')) besoin(5, 23);
  if (vals.has('f' + J_MAX)) besoin(6, 23);
  if (vals.has('p0')) besoin(7, 23);
  return s;
}
function axeLoupe() {
  const T = {}, ticks = [];
  for (const s of SEGMENTS) valeursSeg(s).forEach((v, k) => { T[v] = { s, k }; ticks.push({ v, s, k }); });
  return { T, ticks };
}
/* Plan du rail pour des écarts e (par segment) et des ajouts aux écarts de structure x, la tête
   d'ébullition centrée en h : y de chaque graduation (P), centre des rangées nommées (R), haut, bas. */
function planFixe(e, x, h) {
  const g = (i) => STRUCT_G[i] + (x[i] || 0);
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
    if (iA > 0) e.ebullition = Math.max(LOUPE.plancher, Math.min(e.ebullition, (yA - 10 - haut - STRUCT_G[0]) / iA));
  }
  const x = [];
  const m = mesure(e, x);
  const k = structAvant(vA);
  const reste = H0 - (yA + m.dessous);
  if (reste > 0) { const n = STRUCT_G.length - 1 - k; for (let i = k; i < STRUCT_G.length - 1; i++) x[i] = reste / n; }
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
  STRUCT_G = structPour(l);
  const G = disposerFixe(vA, yA, R0.height, R0.top);
  const ancre = (v) => G.P[v] ?? (v === 'fwh' ? G.P['b' + EBU] - G.e.ebullition : G.P[valeursSeg(segDe(v)).slice(-1)[0]]);
  // Les rangées nommées et les autres lignes, à leur hauteur (centre). p01 : rien ne bouge pendant le
  // geste (D64) : chaque autre houblon reste dans la colonne du rail, à la hauteur de son moment.
  const rangees = Object.entries(tetes).filter(([k]) => k in G.R).map(([k, el]) => ({ el, k, y: G.R[k], h: hauteur.get(el) }));
  const jetons = lignes.filter((r) => r !== carte && /^L/.test(r.dataset.rang)).map((el) => {
    const lj = ETAT.lignes.find((x) => 'L' + x.id === el.dataset.rang), v = valeurDe(lj);
    return { el, l: lj, v, y: ancre(v), h: hauteur.get(el), nom: el.querySelector('.nom') };
  }).sort((a, b) => a.y - b.y);
  // Deux houblons posés au même moment : une seule étiquette réunie (« 35′ Motueka · Nugget »).
  const parValeur = new Map();
  for (const j of jetons) { if (!parValeur.has(j.v)) parValeur.set(j.v, []); parValeur.get(j.v).push(j); }
  for (const grp of parValeur.values()) {
    grp[0].reunis = grp.map((j) => j.l.nom);
    if (grp.length > 1) { grp[0].nom.textContent = grp[0].reunis.join(' · '); for (const j of grp.slice(1)) j.el.classList.add('reuni'); }
  }
  // Un houblon posé à 0′ dit « 0′ » lui-même : la rangée 0′ s'efface devant lui.
  if (parValeur.has('b0') && tetes['T-fin']) tetes['T-fin'].classList.add('cede');
  const nomCarte = carte.querySelector('.nom'), nomTenu = l.nom;
  const y0 = ev.clientY;
  const g = { id: ev.pointerId, carte, v: vA, seg: segDe(vA), bouge: false, dy: 0 };
  const plusProche = (y) => { let b = A.ticks[0], d = Infinity; for (const k of A.ticks) { const x = Math.abs(G.P[k.v] - y); if (x < d) { d = x; b = k; } } return b; };

  /* ---------- p01 · La bulle façon iOS (D47, D55, D63) ----------
     Le rail reste immobile et linéaire ; une bulle près du doigt montre ±15′ autour du doigt (trois
     graduations de part et d'autre, ou ±15 °C, ou ±3 jours), grossies environ trois fois, chaque
     graduation écrite, et les houblons posés dans cette plage. Le contenu défile sous un repère fixe :
     le point du rail sous le doigt est toujours au repère. */
  const W = R0.width;
  const BULLE = { largeur: Math.min(146, Math.round(W * 0.4)), pas: Math.max(26, Math.min(36, 3 * G.e[segDe(vA)])) };
  BULLE.h = Math.round(6 * BULLE.pas + 30);
  const bulle = h('div', { class: 'bulle', 'data-role': 'loupe', 'aria-hidden': 'true' },
    h('i', { class: 'bulle-axe' }), h('div', { class: 'bulle-bande' }), h('i', { class: 'bulle-pointe' }));
  bulle.style.width = BULLE.largeur + 'px';
  bulle.style.height = BULLE.h + 'px';
  bulle.style.left = (W - BULLE.largeur) + 'px';
  fr.append(bulle);
  const bande = bulle.querySelector('.bulle-bande'), pointe = bulle.querySelector('.bulle-pointe');
  // Les textes du rail qui entrent dans la colonne de la bulle (la levure, longue) : la bulle les évite.
  const xBulle = R0.left + W - BULLE.largeur - 4;
  const obstacles = rangees.filter((r) => {
    const w = document.createTreeWalker(r.el, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (!n.textContent.trim()) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const b of rg.getClientRects()) if (b.right > xBulle) return true;
    }
    return false;
  }).map((r) => [r.y - r.h / 2 - 4, r.y + r.h / 2 + 4]);
  const libelleV = (v) => (/^b\d/.test(v) ? v.slice(1) + '′' : /^wp/.test(v) ? v.slice(2) + ' °C' : 'J+' + v.slice(1));
  const NOM_SEG = { ebullition: 'ébullition', whirlpool: 'whirlpool', fermentation: 'fermentation', post: 'post-fermentation' };
  let rangsBulle = new Map(), segBulle = null, topBulle = null;
  const rangBulle = (k, V) => {
    let r = rangsBulle.get(k);
    if (!r) {
      const v = V[k];
      r = h('div', { class: 'bt' + (majeure(segBulle, v) ? ' maj' : '') }, h('i', { class: 'bt-trait' }), h('span', { class: 'bt-v' }, libelleV(v)), h('span', { class: 'bt-h' }));
      r._v = v;
      bande.append(r);
      rangsBulle.set(k, r);
    }
    return r;
  };
  const majBulle = () => {
    const s = g.seg, V = valeursSeg(s), e = G.e[s], n = V.length - 1;
    if (s !== segBulle) { segBulle = s; bande.textContent = ''; rangsBulle = new Map(); }
    // Index continu du point sous le doigt dans le segment : la bande défile, sans à-coup.
    const fi = (yDoigt - G.P[V[0]]) / e;
    const yc = BULLE.h / 2;
    const vus = new Set();
    for (let k = Math.max(0, Math.ceil(fi - 3.7)); k <= Math.min(n, Math.floor(fi + 3.7)); k++) {
      const r = rangBulle(k, V);
      vus.add(k);
      const y = yc + (k - fi) * BULLE.pas;
      r.style.transform = 'translateY(' + (y - 14).toFixed(1) + 'px)';
      // Les houblons de cette graduation : celui qu'on tient en premier, en encre ; les autres en gris.
      const autres = (parValeur.get(r._v) || []).map((j) => j.l.nom);
      const tenu = r._v === g.v;
      const noms = tenu ? [nomTenu, ...autres] : autres;
      const txt = noms.length > 2 ? noms[0] + ' +' + (noms.length - 1) : noms.join(' · ');
      const hh = r.querySelector('.bt-h');
      if (hh.textContent !== txt) hh.textContent = txt;
      r.classList.toggle('tenu', tenu);
      r.classList.toggle('pose', !tenu && autres.length > 0);
      const d = Math.abs(y - yc) / (3.7 * BULLE.pas);
      r.style.opacity = String(Math.max(0, Math.min(1, 1.25 - d * d)).toFixed(2));
    }
    for (const [k, r] of rangsBulle) if (!vus.has(k)) { r.remove(); rangsBulle.delete(k); }
    // Au-dessus de la première graduation : le nom du segment, comme au bord d'une règle.
    let tete = bande.querySelector('.bt-seg');
    if (fi < 3.7) {
      if (!tete) { tete = h('div', { class: 'bt-seg' }); bande.append(tete); }
      tete.textContent = NOM_SEG[s];
      tete.style.transform = 'translateY(' + (yc - fi * BULLE.pas - BULLE.pas * 0.8 - 9).toFixed(1) + 'px)';
    } else if (tete) tete.remove();
    // La bulle se tient à hauteur du doigt, dans le rail, sans couvrir un texte du rail.
    const frH = Math.max(R0.height, G.bas);
    const min = G.haut < -8 ? Math.max(G.haut, 8 - R0.top) : 0, max = Math.max(min, frH - BULLE.h);
    const borne = (t) => Math.max(min, Math.min(max, t));
    const voulu = borne(yDoigt - BULLE.h / 2);
    const gene = (t) => obstacles.find(([a, b]) => t < b && a < t + BULLE.h);
    let top = voulu;
    const o = gene(top);
    if (o) {
      const cand = [borne(o[0] - BULLE.h), borne(o[1])].filter((t) => !gene(t));
      if (cand.length) top = cand.sort((u, v) => Math.abs(u - voulu) - Math.abs(v - voulu))[0];
    }
    if (top !== topBulle) { topBulle = top; bulle.style.transform = 'translateY(' + top.toFixed(1) + 'px)'; }
    const yp = yDoigt - top;
    pointe.style.opacity = yp > 14 && yp < BULLE.h - 14 ? '1' : '0';
    pointe.style.transform = 'translateY(' + (yp - 7).toFixed(1) + 'px) rotate(45deg)';
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
    // Les autres houblons ne bougent pas. Au même moment que celui qu'on tient : une seule étiquette
    // (celle de la carte tenue) ; la carte passe par-dessus un voisin : il s'estompe sous elle.
    let reunis = [];
    for (const j of jetons) {
      placer(j.el, 0, vers(j.el, j.y - j.h / 2));
      const meme = j.v === g.v;
      if (meme && j.reunis) reunis = j.reunis;
      j.el.classList.toggle('sous-tenu', meme);
      j.el.classList.toggle('sous', !meme && Math.abs(yDoigt - j.y) < (hCarte + j.h) / 2 - 2);
    }
    const nom = [nomTenu, ...reunis].join(' · ');
    if (nomCarte && nomCarte.textContent !== nom) nomCarte.textContent = nom;
    for (const tk of ticks) {
      const y = G.P[tk.v];
      if (tk.y !== y) { tk.y = y; tk.el.style.transform = 'translateY(' + (y - 1) + 'px)'; }
      const etat = tk.s !== g.seg ? '' : Math.abs(y - yDoigt) <= 3 * G.e[tk.s] + 1 ? 'vue' : 'vue loin';
      if (etat !== tk.etat) { tk.etat = etat; tk.el.classList.toggle('vue', etat !== ''); tk.el.classList.toggle('loin', etat === 'vue loin'); }
    }
    axe.style.top = G.R['T-ebu'] + 'px';
    axe.style.height = Math.max(0, G.bas - 6 - G.R['T-ebu']) + 'px';
    fr.style.height = Math.max(R0.height, G.bas) + 'px';
    app.classList.toggle('rail-haut', G.haut < -8);
    majBulle();
    bulle.style.opacity = String(k);
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
