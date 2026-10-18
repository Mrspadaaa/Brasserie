/* Version consolidée de l'étape (choix du brasseur, 18.10, soir) : le visuel de p2 (rail des
   couloirs, cartes, ajouts proposés, stock discret), la levure comme étape du rail entre le
   whirlpool et le dry hop en fermentation (D28, comme p8), et le moment qui se glisse comme un
   curseur le long du rail (D27) : on tient la pastille, la carte suit le doigt, l'étape survolée
   s'éclaire, l'IBU se lit en direct, et au lâcher la carte se range sous l'étape. */

/* Ordre du rail : les moments du pack, la levure entre le whirlpool et le dry hop actif. */
const ETAPES = ['fwh', 'b60', 'b30', 'b15', 'b10', 'b5', 'b0', 'wp', 'levure', 'dryActive', 'dryPost'];

/* Après un glisser, le clic qui suit le lâcher est ignoré (il tomberait sous le doigt). */
let IGNORE_CLIC = 0;
document.addEventListener('click', (e) => { if (performance.now() < IGNORE_CLIC) { e.stopPropagation(); e.preventDefault(); } }, true);

/* Pendant le glisser : moment, type et IBU de l'étape survolée, sans rien enregistrer. */
function apercuGlisse(carte, l, code) {
  const fictif = { ...l, moment: code };
  carte.querySelector('.ibu-l').textContent = ibuEl(fictif).textContent;
  carte.querySelector('[data-role="quand"]').textContent = quand(fictif);
  carte.querySelector('[data-role="type-ajout"]').textContent = mom(code).type;
}
function brancherGlisser(poignee, carte, l) {
  let g = null;
  poignee.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    const r = poignee.getBoundingClientRect();
    const etapes = [...document.querySelectorAll('[data-etape]')].filter((x) => x.dataset.etape !== 'levure')
      .map((x) => { const b = (x.querySelector('.rail-l') || x).getBoundingClientRect(); return { code: x.dataset.etape, y: b.top + b.height / 2, el: x }; });
    g = { y0: e.clientY, cy: r.top + r.height / 2, bouge: false, etapes, code: l.moment };
    try { poignee.setPointerCapture(e.pointerId); } catch (x) { /* rien */ }
  });
  poignee.addEventListener('pointermove', (e) => {
    if (!g) return;
    const dy = e.clientY - g.y0;
    if (!g.bouge && Math.abs(dy) < 6) return;
    g.bouge = true;
    carte.classList.add('glisse');
    carte.style.transform = 'translateY(' + dy + 'px)';
    const y = g.cy + dy;
    let best = g.etapes[0];
    for (const x of g.etapes) if (Math.abs(x.y - y) < Math.abs(best.y - y)) best = x;
    if (best.code !== g.code) { g.code = best.code; apercuGlisse(carte, l, best.code); }
    for (const x of g.etapes) x.el.classList.toggle('survol', x === best);
  });
  poignee.addEventListener('pointerup', () => {
    const d = g;
    g = null;
    if (!d || !d.bouge) return;
    IGNORE_CLIC = performance.now() + 400;
    ETAT.focusK = 'q' + l.id;
    if (d.code !== l.moment) placer(l, d.code); else rendre(false);
  });
  poignee.addEventListener('pointercancel', () => { if (g && g.bouge) rendre(false); g = null; });
}

function blocRail(l, i, st, etape) {
  const premier = i === 0;
  const m = mom(l.moment);
  const pastille = h('button', {
    class: 'quand', 'data-role': 'quand', 'data-k': 'q' + l.id, 'data-booster': premier ? 'moment qui tourne' : null,
    'aria-label': 'Moment : ' + quandLong(l) + ' ; glisser le long du rail pour le changer, toucher pour passer au suivant, flèches haut et bas',
    onkeydown: (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const k = MOMENTS.findIndex((x) => x.code === l.moment) + (e.key === 'ArrowDown' ? 1 : -1);
      if (k >= 0 && k < MOMENTS.length) { ETAT.focusK = 'q' + l.id; placer(l, MOMENTS[k].code); }
    },
  }, quand(l));
  const poignee = h('span', {
    class: 'poignee', 'data-role': 'glisser-moment', 'data-etape': etape || null,
    onclick: () => { ETAT.focusK = 'q' + l.id; momentSuivant(l); },
  }, pastille);
  const carte = h('li', { class: 'blk', 'data-role': 'ligne-houblon' },
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
      h('div', { class: 'l3' }, miniProfil(l.fiche, l.nom)),
      m.type === 'à froid' ? bioEl(l) : null));
  brancherGlisser(poignee, carte, l);
  return carte;
}
/* Les ajouts proposés se rangent sous l'étape de leur moment (amérisants à 60′, aromatiques
   tardifs) ; sans carte au-dessus, la zone porte elle-même data-etape. */
function zoneRapides(code, liste, marque, tete, premier) {
  return h('div', { class: 'rap-zone', 'data-etape': marque ? code : null },
    marque ? h('span', { class: 'rail-l plein' }, mom(code).quand) : h('span'),
    h('div', { class: 'rap-corps' },
      tete ? noteIbu() : null,
      tete ? champ() : null,
      h('ul', { class: 'rapides', 'aria-label': 'Ajouts proposés à ' + mom(code).quand + ', selon le moteur' },
        // Deux amérisants « au choix » (un seul suffit pour l'IBU visé) : un « ou » les sépare.
        liste.flatMap((r, n) => [rapideLigne(r, premier && n === 0, false), r.alternative && liste[n + 1] && liste[n + 1].alternative ? h('li', { class: 'ou' }, 'ou') : null]).filter(Boolean))));
}
VARIANTE = {
  etape(app) {
    app.append(enTete(), resume());
    const fr = h('section', { class: 'frise', 'data-role': 'houblons-recette', 'aria-label': 'Houblons de la recette, posés sur le rail du brassage' }, h('i', { class: 'axe', 'aria-hidden': 'true' }));
    const et = etatsStock();
    // Propositions selon la place : 5 pour une recette vide, puis 3, 2, 1, et aucune au-delà de 3 ajouts (le champ reste).
    const n = ETAT.lignes.length;
    const proposes = rapidesVisibles(n === 0 ? 5 : Math.max(0, 4 - n));
    const parMoment = (c) => proposes.filter((r) => r.moment === c);
    const premiereZone = ETAPES.find((c) => parMoment(c).length) || D.rapidesMoment;
    for (const code of ETAPES) {
      if (code === 'levure') {
        // D28 : la levure est une étape du rail, avant le dry hop en fermentation active.
        fr.append(h('div', { class: 'etape-levure', 'data-etape': 'levure' }, h('span', { class: 'rail-lev', 'aria-hidden': 'true' }), levure()));
        continue;
      }
      const blocs = ETAT.lignes.map((l, i) => [l, i]).filter(([l]) => l.moment === code);
      const co = h('ul', { class: 'couloir', 'aria-label': 'Étape ' + quandLong({ moment: code, jour: 3 }) });
      blocs.forEach(([l, i], k) => co.append(blocRail(l, i, et[i], k === 0 ? code : null)));
      if (parMoment(code).length || code === premiereZone) co.append(h('li', {}, zoneRapides(code, parMoment(code), !blocs.length, code === premiereZone, code === premiereZone)));
      else if (!blocs.length) {
        // Crans intermédiaires (30′, 15′, 5′) : un simple repère du rail ; on lit leur nom sur la pastille en glissant.
        const m = mom(code);
        co.append(h('li', { class: 'vide-l' + (m.cran ? ' cran' : ''), 'data-etape': code, 'aria-label': 'Étape vide : ' + quandLong({ moment: code, jour: 3 }) },
          h('span', { class: 'rail-l' }), h('span', { class: 'drop' }, m.cran ? null : m.vide || m.quand)));
      }
      fr.append(co);
    }
    app.append(...[fr, goutsLigne(), panLigne()].filter(Boolean));
  },
};
