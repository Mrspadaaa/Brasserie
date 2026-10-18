/* p02 = p3 + la frise d'ébullition de p10 : un couloir par moment (60′, 10′, 0′, whirlpool,
   à froid) ; chaque ajout est posé dans son couloir, la frise porte le type et le moment. Les
   ajouts proposés par le moteur attendent dans le couloir de leur moment (10′, ou 60′ sans IBU). */
function blocFrise(l, i, st) {
  const premier = i === 0;
  const m = mom(l.moment);
  const froid = m.type === 'à froid';
  return h('li', { class: 'blk', 'data-role': 'ligne-houblon' },
    h('button', {
      class: 'quand', 'data-role': 'quand', 'data-k': 'q' + l.id, 'data-booster': premier ? 'moment qui tourne' : null,
      'aria-label': 'Moment : ' + quandLong(l) + ', toucher pour passer au suivant', onclick: () => { ETAT.focusK = 'q' + l.id; momentSuivant(l); },
    }, quand(l)),
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
      h('div', { class: 'l2' },
        stockEl(st.txt),
        citationTag(l),
        effetTag(l),
        ibuEl(l)),
      h('div', { class: 'l3' }, miniProfil(l.fiche, l.nom)),
      froid ? bioEl(l) : null));
}
function zoneRapides(avecRail) {
  const quandR = mom(D.rapidesMoment).quand;
  return h('div', { class: 'rap-zone' },
    avecRail ? h('span', { class: 'rail-l plein' }, quandR) : h('span'),
    h('div', { class: 'rap-corps' },
      noteIbu(),
      champ(),
      h('ul', { class: 'rapides', 'aria-label': 'Ajouts proposés à ' + quandR + ', selon le moteur' }, rapidesVisibles(ETAT.lignes.length ? Math.max(1, Math.min(4, 5 - ETAT.lignes.length)) : 5).map((r, n) => rapideLigne(r, n === 0, false)))));
}
VARIANTE = {
  etape(app) {
    app.append(enTete(), resume());
    const fr = h('section', { class: 'frise', 'data-role': 'houblons-recette', 'aria-label': 'Houblons de la recette, posés sur la frise d\'ébullition' }, h('i', { class: 'axe', 'aria-hidden': 'true' }));
    const et = etatsStock();
    const cr = mom(D.rapidesMoment).couloir;
    COULOIRS.forEach((nomC, c) => {
      const blocs = ETAT.lignes.map((l, i) => [l, i]).filter(([l]) => mom(l.moment).couloir === c);
      const co = h('ul', { class: 'couloir', 'aria-label': 'Couloir ' + nomC });
      blocs.forEach(([l, i]) => co.append(blocFrise(l, i, et[i])));
      if (c === cr) co.append(h('li', {}, zoneRapides(!blocs.length)));
      else if (!blocs.length) co.append(h('li', { class: 'vide-l' }, h('span', { class: 'rail-l' }), h('span', { class: 'drop' }, nomC)));
      fr.append(co);
    });
    app.append(...[fr, levure(), goutsLigne(), panLigne()].filter(Boolean));
  },
};
