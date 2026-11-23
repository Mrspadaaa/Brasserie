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
/* Les graduations : toutes présentes (data-etape), cachées au repos, montrées par la loupe ; chacune
   porte sa valeur écrite (35′, 80 °C, J+3), que le Dock n'écrit que là où il grossit. */
const texteGrad = (v) => (/^b\d/.test(v) ? v.slice(1) + '′' : /^wp/.test(v) ? v.slice(2) + ' °C' : 'J+' + v.slice(1));
function graduations() {
  const g = h('div', { class: 'grads', 'aria-hidden': 'true' });
  for (const s of SEGMENTS) for (const v of valeursSeg(s)) g.append(h('i', { class: 'grad' + (majeure(s, v) ? ' maj' : ''), 'data-etape': v, 'data-graduation': s }, h('b', { class: 'grad-v' }, texteGrad(v))));
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

/* ---------- La loupe et le geste : p02, Dock sans état (D47, D55, D56, D61, D63, D64) ---------- */
/* Le rail sous le doigt se grossit comme le Dock, à plateau (19.10 : « L'échelle ne s'adapte
   toujours pas à l'endroit où on est ??? ») : ×3 régulier sur ±5′ autour du doigt, une rampe
   linéaire sur 2 graduations de chaque côté, puis ×1 ; rien d'autre ne change d'échelle. Le
   grossissement est calculé à partir de la seule position du doigt : aucune fenêtre ne se fait
   entraîner, aucun état. Le haut du rail reste fixe ; l'excès du grossissement (2 × (2 plateaux +
   rampe)) pousse le bas, et le rail de base est choisi pour que le doigt en atteigne les deux bouts
   dans l'écran (D69).
   Le moment sous le doigt : le point c du rail de base tel que Y(c ; c) = doigt (fonction strictement
   croissante, pente ≥ 1), puis la graduation la plus proche de c. Les autres houblons restent à leur
   moment et ne vont jamais de côté (D64) ; deux houblons au même moment : une seule étiquette réunie. */
const nIntervalles = (s) => valeursSeg(s).length - 1;
// Un cran déplace le plateau de 2 écarts du rail de base : au plus 11,5 px par 5′, soit 23 px (D61 bis).
// La loupe : 11,5 px par graduation au plus, 6 au moins (D69 : moins sur un petit écran) ; au loin,
// un cinquième, entre 1,2 et 3 px. bord : le bas du rail à 16 px du bas de l'écran ; garde : la marge
// de la traversée (D69).
const LOUPE = { poids: 5, max: { focus: 11.5, autre: 3 }, min: { focus: 6, autre: 1.2 }, marge: 120, bord: 16, garde: 8, ouverture: 170, gros: 3, plateau: 1, rampe: 2 };
const KG = LOUPE.gros - 1;
/* Les crans : le centre du Dock est la graduation tenue (la plus proche du doigt). Le rail reste
   immobile tant que le doigt est dans sa tranche (le doigt à une demi-tranche au plus de la
   graduation tenue), puis passe d'un cran à la suivante. Un passage en douceur (pente 2, base v4.4)
   ferait couler le rail à 4 fois la vitesse du doigt sous un ×3 : la graduation visée fuirait. */
function cran(G, c) {
  let b = G.Z[0];
  for (const z of G.Z) if (Math.abs(z - c) < Math.abs(b - c)) b = z;
  return b;
}
// Écarts fixes de la structure (px) : tête d'ébullition → début, 0′ → whirlpool, whirlpool → 100 °C,
// 60 °C → levure, levure → fermentation, fermentation → J+0, J+14 → post, post → J+0, fin du rail.
const STRUCT = [16, 20, 12, 16, 22, 12, 16, 12, 6];
function axeLoupe() {
  const T = {}, ticks = [];
  for (const s of SEGMENTS) valeursSeg(s).forEach((v, k) => { T[v] = { s, k }; ticks.push({ v, s, k }); });
  return { T, ticks };
}
/* Plan de base du rail (sans grossissement) pour des écarts e (par segment) et des ajouts aux écarts
   de structure x, la tête d'ébullition centrée en h : y de chaque graduation (P), des rangées (R). */
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
const structAvant = (v) => ({ ebullition: 1, whirlpool: 3, fermentation: 6, post: 8 })[segDe(v)];
/* Le Dock : forme du plateau (1 sur ±Pl, rampe jusqu'à 0 sur Ra) et son intégrale M, impaire. */
const forme = (G, d) => { const a = Math.abs(d); return a <= G.Pl ? 1 : Math.max(0, 1 - (a - G.Pl) / G.Ra); };
const Mpl = (G, x) => {
  const a = Math.abs(x), r = a - G.Pl;
  const v = a <= G.Pl ? a : r <= G.Ra ? G.Pl + r - (r * r) / (2 * G.Ra) : G.Pl + G.Ra / 2;
  return Math.sign(x) * v;
};
const grossi = (G, z, c) => 1 + KG * forme(G, z - c);
/* Position affichée du point z du rail de base, le doigt sur c (haut du rail fixe). */
/* Hors du segment tenu, le Dock reste garé au bord du segment : le rail y est immobile. Aux deux bouts
   du rail (la durée d'ébullition, J+14 de la post-fermentation), le centre du plateau se tient à une
   graduation du bord, et le doigt y est encore sur le plateau (D45 : les graduations voisines restent
   régulières). Entre deux segments, il passe sans s'arrêter : le doigt y avance au pas du rail (D69). */
const borne = (G, c) => Math.max(G.F0, Math.min(G.F1, c));
const centre = (G, c) => Math.max(G.Zh + G.Pl, Math.min(G.Zb - G.Pl, c));
const Yd = (G, z, c) => { const k = centre(G, c); return G.O + z + KG * (Mpl(G, z - k) + Mpl(G, k - G.haut)); };
const phi = (G, c) => Yd(G, c, c) - G.O;
/* Le point c du rail de base sous le doigt : seule la position du doigt compte. */
function sousDoigt(G, yF) {
  const t = yF - G.O;
  let lo = G.haut - 400, hi = G.bas + 400;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (phi(G, m) < t) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
/* D69 (19.10, au téléphone, dans la page partagée : « On arrive pas à aller de l'extrême haut, à
   l'extrême bas ») : la traversée. Le doigt avance d'un écart de loupe F par graduation ; aux deux
   bouts du rail, le plateau tenu au bord en coûte 2 de plus ; d'un segment à l'autre, le rail se refait
   quand le doigt a passé la moitié des écarts de structure entre eux. Pour aller de la graduation v
   jusqu'en bas : sB pas dans le segment de v et aB dans les autres, plus fixeB px (en haut : sH, aH,
   fixeH). */
const COUTURES = [[1, 2], [3, 4, 5], [6, 7]]; // écarts de structure entre deux segments voisins
function traversee(v) {
  const iS = SEGMENTS.indexOf(segDe(v)), V = valeursSeg(SEGMENTS[iS]), i = Math.max(0, V.indexOf(v));
  // Le bout du rail coûte 2 pas de plus à qui doit y aller ; rien à qui y est déjà.
  const premier = iS === 0, dernier = iS === SEGMENTS.length - 1, j = V.length - 1 - i;
  const n = (a) => a.reduce((t, s) => t + nIntervalles(s), 0);
  const demi = (a) => a.reduce((t, c) => t + c.reduce((u, k) => u + STRUCT[k], 0) / 2, 0);
  return {
    sB: j + (dernier && j ? 2 : 0), aB: n(SEGMENTS.slice(iS + 1)) + (dernier ? 0 : 2), fixeB: demi(COUTURES.slice(iS)) + STRUCT[8] + LOUPE.garde,
    sH: i + (premier && i ? 2 : 0), aH: n(SEGMENTS.slice(0, iS)) + (premier ? 0 : 2), fixeH: demi(COUTURES.slice(0, iS)) + STRUCT[0] + 10 + LOUPE.garde,
  };
}
/* L'échelle du geste, choisie à la prise et gardée jusqu'au lâcher : la loupe F la plus grande (11,5 px
   au plus) avec laquelle le doigt va du houblon tenu jusqu'à J+14 de la post-fermentation en bas de
   l'écran, et jusqu'à la durée d'ébullition sans que la tête du rail passe au-dessus de sa place (si
   la loupe y tomberait sous 6 px : jusqu'en haut de l'écran, la barre d'IBU s'efface). */
function echelleGeste(vA, yA, frTop) {
  const vHaut = Math.max(0, 8 - frTop), vBas = innerHeight - LOUPE.bord - frTop;
  const t = traversee(vA);
  const pasB = t.sB + t.aB, pasH = t.sH + t.aH;
  const Fb = pasB ? (vBas - yA - t.fixeB) / pasB : Infinity, Fh = (h) => (pasH ? (yA - h - t.fixeH) / pasH : Infinity);
  let haut = vHaut, F = Math.min(Fb, Fh(haut));
  if (F < LOUPE.min.focus && Fh(haut) < Fb) { haut = 8 - frTop; F = Math.min(Fb, Fh(haut)); }
  return { F: Math.max(LOUPE.min.focus, Math.min(LOUPE.max.focus, F)), haut, vHaut, vBas };
}
/* Le rail de base, la graduation v sous le doigt : le segment de v en loupe, les autres au cinquième de
   l'échelle du geste (1,2 à 3 px). La graduation de la ligne tenue reste sous le doigt. La loupe : la
   plus grande (11,5 px au plus) qui laisse au doigt la traversée jusqu'aux deux bouts, les autres
   segments comptés à l'échelle du geste (D69).
   D67 : le doigt passé dans un autre segment, le rail se refait autour du doigt, ce segment devient la
   loupe. D68 (19.10, au téléphone, Nugget glissé à J+2 : « Toujours un petit soucis... », la tête du
   rail descendue de 220 px) : la place libre au-dessus de la tête revient aux segments au-dessus, sans
   dépasser l'échelle de la loupe, puis aux écarts de structure : la tête du rail reste en haut. Sous
   le doigt, seule la place que la traversée laisse libre va aux écarts.
   Garde-fou : un rail qui ne tiendrait pas dans l'écran resserre sa loupe ; à la prise, le bas reste
   aussi dans la hauteur du repos + 120 px (D55 : le reste du rail reste compact). */
function disposerDock(vA, yA, H0, ech, prise) {
  const plafond = prise ? Math.min(ech.vBas, H0 + LOUPE.marge - 2) : ech.vBas;
  const segA = segDe(vA), t = traversee(vA);
  const loupe = Math.min(LOUPE.max.focus,
    t.sH ? (yA - ech.haut - t.fixeH - ech.F * t.aH) / t.sH : Infinity,
    t.sB ? (ech.vBas - yA - t.fixeB - ech.F * t.aB) / t.sB : Infinity);
  const e = Object.fromEntries(SEGMENTS.map((s) => [s, s === segA ? Math.max(LOUPE.min.autre, loupe) : Math.max(LOUPE.min.autre, Math.min(LOUPE.max.autre, ech.F / LOUPE.poids))]));
  const plan = (e, x) => { const G = planFixe(e, x, 0); G.seg = segA; G.e = e; G.Pl = LOUPE.plateau * e[segA]; G.Ra = LOUPE.rampe * e[segA]; G.surplus = KG * (2 * G.Pl + G.Ra); G.cA = vA === 'fwh' ? G.P['b' + EBU] - e.ebullition : G.P[vA]; const Va = valeursSeg(segA); G.F0 = G.P[Va[0]]; G.F1 = G.P[Va[Va.length - 1]]; G.Zh = G.P['b' + EBU]; G.Zb = G.P['p' + J_MAX]; G.O = 0; G.O = yA - phi(G, G.cA); G.Z = Va.map((v) => G.P[v]); return G; };
  const tient = (G) => G.O + G.bas + G.surplus <= plafond + 0.5 && G.O + G.haut >= ech.haut - 0.5;
  if (!tient(plan(e, []))) {
    let lo = LOUPE.min.autre, hi = e[segA];
    for (let i = 0; i < 24; i++) { e[segA] = (lo + hi) / 2; if (tient(plan(e, []))) lo = e[segA]; else hi = e[segA]; }
    e[segA] = lo;
  }
  const avant = SEGMENTS.slice(0, SEGMENTS.indexOf(segA)), N = avant.reduce((t, s) => t + nIntervalles(s), 0);
  const G1 = plan(e, []), vide = G1.O + G1.haut - ech.vHaut;
  if (N && vide > 0) for (const s of avant) e[s] = Math.min(e[segA], e[s] + vide / N);
  const x = [];
  const k = structAvant(vA);
  const G0 = plan(e, x);
  const reste = Math.min(H0 - Yd(G0, G0.bas, G0.cA), ech.vBas - yA - t.fixeB - t.sB * e[segA] - t.aB * ech.F);
  if (reste > 0) { const n = STRUCT.length - 1 - k; for (let i = k; i < STRUCT.length - 1; i++) x[i] = reste / n; }
  if (segA !== 'ebullition') { const libre = G0.O + G0.haut - ech.vHaut - 10; if (libre > 0) for (let i = 0; i < k; i++) x[i] = (x[i] || 0) + libre / k; }
  return plan(e, x);
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
  const topCarte = repos.get(carte);
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
  // L'étiquette réunie : « Motueka · Nugget » quand deux houblons sont au même moment.
  const avecDe = (el) => { const n = el.querySelector('.nom'); const s = h('span', { class: 'avec' }); n.after(s); return s; };
  const avecTenu = avecDe(carte);
  const hauteur = new Map(lignes.map((r) => [r, r.getBoundingClientRect().height]));
  const hCarte = hauteur.get(carte);
  const ech = echelleGeste(vA, yA, R0.top);
  let G = disposerDock(vA, yA, R0.height, ech, true);
  const ancre = (v) => G.P[v] ?? (v === 'fwh' ? G.P['b' + EBU] - G.e.ebullition : G.P[valeursSeg(segDe(v)).slice(-1)[0]]);
  const rangees = Object.entries(tetes).filter(([k]) => k in G.R).map(([k, el]) => ({ el, k, z: G.R[k], h: hauteur.get(el) }));
  const jetons = lignes.filter((r) => r !== carte && /^L/.test(r.dataset.rang)).map((el) => {
    const x = ETAT.lignes.find((y) => 'L' + y.id === el.dataset.rang);
    const v = valeurDe(x);
    return { el, v, nom: x.nom, quand: quand(x), z: ancre(v), h: hauteur.get(el), avec: avecDe(el), fondu: false, txt: '' };
  }).sort((a, b) => a.z - b.z);
  const y0 = ev.clientY;
  const g = { id: ev.pointerId, carte, v: vA, seg: segDe(vA), bouge: false, dy: 0 };
  const plusProche = (c) => { let b = A.ticks[0], d = Infinity; for (const k of A.ticks) { const x = Math.abs(G.P[k.v] - c); if (x < d) { d = x; b = k; } } return b; };
  const croise = (a0, a1, b0, b1) => a0 < b1 + 1 && b0 < a1 + 1;
  // L'ouverture : de la place au repos à la place sur le Dock, en 170 ms (aussitôt en mouvement réduit).
  // Le point de départ du passage : la place au repos, puis (D67) la place du moment où le rail se refait.
  let p = REDUIT ? 1 : 0, t0 = performance.now(), depart = repos;
  const lisse = (k) => 1 - Math.pow(1 - k, 3);
  const placer = (el, y) => { const s = 'translateY(' + y.toFixed(1) + 'px)'; if (el._t !== s) { el._t = s; el.style.transform = s; } };
  let yDoigt = yA, txtTenu = '';
  const poserTout = () => {
    const k = p >= 1 ? 1 : lisse(p);
    const vers = (el, cible) => depart.get(el) + (cible - depart.get(el)) * k;
    const c = cran(G, borne(G, sousDoigt(G, yDoigt)));
    for (const r of rangees) { r.y = vers(r.el, Yd(G, r.z, c) - r.h / 2) + r.h / 2; placer(r.el, r.y - r.h / 2); }
    // Les autres houblons : à leur moment, jamais de côté. Sous la carte tenue, ils s'effacent ; au
    // même moment qu'elle, leur nom rejoint son étiquette ; deux autres qui se touchent, une étiquette.
    const avecT = [];
    const yC0 = topCarte + g.dy, yC1 = yC0 + hCarte;
    let prec = null;
    for (const j of jetons) {
      j.y = Yd(G, j.z, c);
      placer(j.el, vers(j.el, j.y - j.h / 2));
      let fondu = false;
      j.lie = [];
      if (croise(j.y - j.h / 2, j.y + j.h / 2, yC0, yC1)) { fondu = true; if (j.v === g.v) avecT.push(j.nom); }
      else if (prec && croise(j.y - j.h / 2, j.y + j.h / 2, prec.y - prec.h / 2, prec.y + prec.h / 2)) { fondu = true; prec.lie.push(j.v === prec.v ? j.nom : j.quand + ' ' + j.nom); }
      else prec = j;
      if (fondu !== j.fondu) { j.fondu = fondu; j.el.classList.toggle('fondu', fondu); }
    }
    for (const j of jetons) { const t = j.lie.length ? '· ' + j.lie.join(' · ') : ''; if (t !== j.txt) { j.txt = t; j.avec.textContent = t; } }
    const t = avecT.length ? '· ' + avecT.join(' · ') : '';
    if (t !== txtTenu) { txtTenu = t; avecTenu.textContent = t; }
    // Les graduations du segment sous le doigt : longues et foncées dans la loupe, courtes au loin.
    for (const tk of ticks) {
      const z = G.P[tk.v], y = Yd(G, z, c);
      if (tk.y !== y) { tk.y = y; tk.el.style.transform = 'translateY(' + (y - 1).toFixed(1) + 'px)'; }
      const etat = tk.s !== g.seg ? '' : grossi(G, z, c) >= 1.6 ? 'vue' : 'vue loin';
      if (etat !== tk.etat) { tk.etat = etat; tk.el.classList.toggle('vue', etat !== ''); tk.el.classList.toggle('loin', etat === 'vue loin'); }
    }
    // Le Dock écrit ses minutes (19.10, défaut du jury : la minute n'était lue que dans la pastille,
    // sous le pouce) : sur les graduations grossies, à droite du trait, hors de la pastille tenue
    // (20 px au moins du doigt), sans toucher une carte, une étape ni la minute écrite au-dessus.
    const occupe = [[yC0, yC1], ...rangees.map((r) => [r.y - r.h / 2, r.y + r.h / 2]), ...jetons.filter((j) => !j.fondu).map((j) => [j.y - j.h / 2, j.y + j.h / 2])];
    let dernier = -Infinity;
    for (const tk of ticks) {
      const ecrit = k >= 1 && tk.etat === 'vue' && tk.v !== g.v && Math.abs(tk.y - yDoigt) >= 20 && tk.y - dernier >= 16
        && !occupe.some(([a, b]) => tk.y + 7 > a && tk.y - 7 < b);
      if (ecrit) dernier = tk.y;
      if (ecrit !== !!tk.ecrit) { tk.ecrit = ecrit; tk.el.classList.toggle('ecrit', ecrit); }
    }
    const yTete = Yd(G, G.R['T-ebu'], c), yBas = Yd(G, G.bas, c);
    axe.style.top = yTete + 'px';
    axe.style.height = Math.max(0, yBas - 6 - yTete) + 'px';
    fr.style.height = Math.max(R0.height, yBas) + 'px';
    app.classList.toggle('rail-haut', Yd(G, G.haut, c) < -8);
    return c;
  };
  tetes[TETE_SEG[g.seg]].classList.add('focus');
  poserTout();
  const animer = (now) => { if (g.ferme) return; p = Math.min(1, (now - t0) / LOUPE.ouverture); poserTout(); if (p < 1) requestAnimationFrame(animer); };
  if (p < 1) requestAnimationFrame(animer);
  /* D67 (19.10, au téléphone : « L'échelle ne s'adapte pas ni de focus, pas là où je suis ») : le doigt
     passé dans un autre segment (de l'ébullition au whirlpool…), ce segment devient la loupe ; le rail
     se refait autour du doigt, en 170 ms depuis sa place du moment. */
  const refaire = (v) => {
    const top = fr.getBoundingClientRect().top;
    depart = new Map(lignes.map((r) => [r, r.getBoundingClientRect().top - top]));
    G = disposerDock(v, yDoigt, R0.height, ech);
    for (const r of rangees) r.z = G.R[r.k];
    for (const j of jetons) j.z = ancre(j.v);
    p = REDUIT ? 1 : 0; t0 = performance.now();
    if (p < 1) requestAnimationFrame(animer);
  };

  g.suivre = (cy) => {
    const dy = cy - y0;
    g.dy = dy; yDoigt = yA + dy;
    carte.style.transform = 'translateY(' + (topCarte + dy) + 'px)';
    if (!g.bouge && Math.abs(dy) >= 3) g.bouge = true;
    const pr = plusProche(sousDoigt(G, yDoigt));
    if (pr.s !== G.seg) refaire(pr.v);
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
    // Tout se referme : chaque rangée revient de sa place sur le Dock à sa place au repos.
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
    const v = g.bouge ? plusProche(sousDoigt(G, yA + g.dy)).v : vA;
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
