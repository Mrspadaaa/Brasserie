/* p03 = p3 + la pastille de moment qui glisse sur une frise 60′ → à froid (greffe de p08) et
   les « + N IBU » sur chaque houblon proposé (greffe de p11). La liste des ajouts reste celle
   de p3 ; chaque ligne porte sa frise : la pastille dit le moment, le tag dit le type. Les
   ajouts proposés ont la même frise : on choisit le moment avant d'ajouter, l'IBU suit. */
const crans6 = (k) => 'calc(14px + (100% - 28px) * ' + (k / (MOMENTS.length - 1)) + ')';
/* Toucher = moment suivant ; glisser = placer ; toucher un cran = placer. Après un glisser, le
   clic qui suit tomberait sur le cran redessiné sous le doigt : on l'ignore. */
let IGNORE_CLIC = 0;
document.addEventListener('click', (e) => { if (performance.now() < IGNORE_CLIC) { e.stopPropagation(); e.preventDefault(); } }, true);
function frisette(o) {
  const mi = MOMENTS.findIndex((m) => m.code === o.moment);
  const wrap = h('div', { class: 'frisette', role: 'group', 'aria-label': 'Moment de ' + o.nom + ' sur la frise, de 60′ à à froid' },
    h('span', { class: 'seg-b' }), h('span', { class: 'seg-w' }), h('span', { class: 'seg-f' }));
  MOMENTS.forEach((m, k) => wrap.append(h('button', {
    class: 'cran' + (m.couloir >= 3 ? ' hors' : ''), style: 'left:' + crans6(k), 'aria-label': 'Placer ' + o.nom + ' à ' + (m.code === 'dryActive' ? 'J+' + o.jour + ' en fermentation active' : m.code === 'dryPost' ? 'à froid après fermentation' : m.quand),
    onclick: () => o.placer(m.code),
  })));
  const pas = h('button', {
    class: 'pastille', style: 'left:' + crans6(mi), 'data-role': o.role || null, 'data-k': o.k, 'data-booster': o.booster || null,
    'aria-label': 'Moment : ' + quandLong(o) + ' ; toucher pour passer au suivant, glisser pour placer',
    onclick: () => { ETAT.focusK = o.k; o.suivant(); },
  }, quand(o));
  let drag = null;
  pas.addEventListener('pointerdown', (e) => { drag = { x0: e.clientX, bouge: false }; try { pas.setPointerCapture(e.pointerId); } catch (x) { /* rien */ } });
  pas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (Math.abs(e.clientX - drag.x0) > 6) drag.bouge = true;
    if (!drag.bouge) return;
    const r = wrap.getBoundingClientRect();
    pas.style.left = Math.max(14, Math.min(r.width - 14, e.clientX - r.left)) + 'px';
  });
  pas.addEventListener('pointerup', (e) => {
    const d = drag;
    drag = null;
    if (!d || !d.bouge) return;
    const r = wrap.getBoundingClientRect();
    const frac = (Math.max(14, Math.min(r.width - 14, e.clientX - r.left)) - 14) / (r.width - 28);
    IGNORE_CLIC = performance.now() + 400;
    ETAT.focusK = o.k;
    o.placer(MOMENTS[Math.round(frac * (MOMENTS.length - 1))].code);
  });
  pas.addEventListener('pointercancel', () => { if (drag && drag.bouge) rendre(false); drag = null; });
  wrap.append(pas);
  return wrap;
}
function lignePastille(l, i, st) {
  const premier = i === 0;
  const m = mom(l.moment);
  return h('li', { class: 'ligne', 'data-role': 'ligne-houblon' },
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
    h('div', { class: 'l-frise' },
      frisette({ ...l, k: 'q' + l.id, role: 'quand', booster: premier ? 'pastille moment' : null, placer: (c) => placer(l, c), suivant: () => momentSuivant(l) }),
      ibuEl(l)),
    h('div', { class: 'l2' },
      stockEl(st.txt),
      citationTag(l),
      effetTag(l),
      h('span', { class: 'droite-mini' }, miniProfil(l.fiche, l.nom))),
    m.type === 'à froid' ? bioEl(l) : null);
}
/* Ajout proposé : « + N IBU » en tête (greffe de p11), et sa frise pour choisir le moment. */
function rapidePastille(r, premier) {
  const code = ETAT.momentR[r.cle] || r.moment;
  const pg = r.ibuPG[code];
  const v = code === r.moment ? r.ibu : pg == null ? null : pg * r.g;
  const ibu = v == null ? 'IBU non modélisé' : '+' + ibuTexte(v) + ' IBU';
  const o = { moment: code, nom: r.nom, jour: 3, id: r.cle };
  return h('li', { class: 'rapide-l' },
    h('div', { class: 'rapide-c' },
      h('button', {
        class: 'rapide', 'data-role': 'ajout-rapide', 'data-booster': premier ? 'ajout rapide' : null, 'data-k': 'r' + r.cle,
        'aria-label': 'Ajouter ' + r.nom + ', ' + grammes(r.g) + ' à ' + quand(o) + ' : ' + ibu,
        onclick: () => ajouter(r, code),
      }, h('span', { class: 'plus-i', 'aria-hidden': 'true' }), h('b', { 'data-houblon': r.cle }, r.nom), statutRapide(r), h('b', { class: 'plus-ibu' }, ibu)),
      h('div', { class: 'r-frise' },
        frisette({ ...o, k: 'm' + r.cle, booster: premier ? 'moment proposé' : null, placer: (c) => { ETAT.momentR[r.cle] = c; rendre(false); },
          suivant: () => { const i = MOMENTS.findIndex((m) => m.code === code); ETAT.momentR[r.cle] = MOMENTS[(i + 1) % MOMENTS.length].code; rendre(false); } }),
        h('span', { class: 'dose-r' }, grammes(r.g))),
      h('div', { class: 'r-fiches' }, miniProfil(r.fiche, r.nom))),
    goutBouton(r.nom, 'r', premier ? 'goût' : null));
}
VARIANTE = {
  etape(app) {
    app.append(enTete(), resume());
    const et = etatsStock();
    const n = ETAT.lignes.length;
    app.append(h('section', { class: 'recette', 'data-role': 'houblons-recette', 'aria-label': 'Houblons de la recette' },
      h('ul', { class: 'lignes' }, ETAT.lignes.map((l, i) => lignePastille(l, i, et[i])))));
    app.append(h('section', { class: 'ajout', 'aria-label': 'Ajouts proposés par le moteur' },
      noteIbu(),
      champ(),
      h('ul', { class: 'rapides' }, rapidesVisibles(n ? Math.max(1, 4 - n) : 5).map((r, k) => rapidePastille(r, k === 0)))));
    app.append(...[levure(), goutsLigne(), panLigne()].filter(Boolean));
  },
};
