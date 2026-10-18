/* Version consolidée de l'étape (choix du brasseur, 18.10, soir) : le visuel de p2 (rail,
   cartes, ajouts proposés, stock discret), la levure comme étape du rail entre le whirlpool et
   le dry hop (D28, comme p8), et le moment qui se glisse le long du rail (D27).
   Rail (D34, D36) : l'ébullition est une échelle de temps de la durée de la recette à 0′, une
   graduation fine par tranche de 5′ (data-etape="b<minute>"), des repères écrits aux valeurs
   utiles seulement ; lâchée entre deux repères, la carte prend la tranche la plus proche.
   Geste (D35) : la carte glissée reste dans le flux (CSS order, sans sortir du document) : elle
   se range au fil du doigt, les autres s'écartent, l'origine se referme, une seule pastille. */

/* Après un glisser, le clic qui suit le lâcher est ignoré (il tomberait sous le doigt). */
let IGNORE_CLIC = 0;
document.addEventListener('click', (e) => { if (performance.now() < IGNORE_CLIC) { e.stopPropagation(); e.preventDefault(); } }, true);

/* Pendant le glisser : moment, type et IBU de l'étape visée, lus dans les tables du pack. */
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
    g = { y0: e.clientY, bouge: false, code: l.moment };
    try { poignee.setPointerCapture(e.pointerId); } catch (x) { /* rien */ }
  });
  const commencer = () => {
    // Repères à leur place d'avant le geste : le doigt descend de d, la carte prend la tranche qui
    // était d sous son repère ; ces positions ne bougent plus pendant le geste (pas de va-et-vient).
    const rc = carte.getBoundingClientRect();
    g.reperes = [...carte.parentElement.querySelectorAll('.marque')].map((x) => {
      const r = x.getBoundingClientRect();
      return { code: x.dataset.etape, el: x, ordre: Number(x.style.order), y: r.top + r.height / 2 };
    });
    const depart = g.reperes.find((x) => x.code === l.moment);
    g.base = depart ? depart.y : rc.top;
    carte.setAttribute('data-glisse', '');
    carte.classList.add('glisse');
  };
  poignee.addEventListener('pointermove', (e) => {
    if (!g) return;
    const d = e.clientY - g.y0;
    if (!g.bouge && Math.abs(d) < 6) return;
    if (!g.bouge) { g.bouge = true; commencer(); }
    const y = g.base + d;
    let best = g.reperes[0];
    for (const x of g.reperes) if (Math.abs(x.y - y) < Math.abs(best.y - y)) best = x;
    if (best.code !== g.code || !g.place) {
      g.code = best.code; g.place = true;
      carte.style.order = String(best.ordre + 1);
      apercuGlisse(carte, l, best.code);
      for (const x of g.reperes) x.el.classList.toggle('survol', x === best);
    }
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

/* Réglages libres là où le moteur donne une table : whirlpool (°C, minutes), dry hop (jour). */
function reglage(libelle, valeur, moins, plus) {
  return h('span', { class: 'regl', role: 'group', 'aria-label': libelle },
    h('button', { class: 'moins', 'aria-label': libelle + ' : moins', onclick: (e) => { e.stopPropagation(); moins(); } }),
    h('span', { class: 'regl-v' }, valeur),
    h('button', { class: 'plus', 'aria-label': libelle + ' : plus', onclick: (e) => { e.stopPropagation(); plus(); } }));
}
function reglagesMoment(l) {
  const m = mom(l.moment);
  if (l.moment === 'wp' && l.tab && l.tab.wp && D.tables.wp) {
    const T = D.tables.wp.temperatures, M = D.tables.wp.minutes, t = T.indexOf(l.wpT), n = M.indexOf(l.wpMin);
    return h('div', { class: 'reglages' },
      reglage('Température du whirlpool', l.wpT + ' °C', () => { if (t > 0) { l.wpT = T[t - 1]; rendre(true); } }, () => { if (t < T.length - 1) { l.wpT = T[t + 1]; rendre(true); } }),
      reglage('Durée du whirlpool', l.wpMin + ' min', () => { if (n > 0) { l.wpMin = M[n - 1]; rendre(true); } }, () => { if (n < M.length - 1) { l.wpMin = M[n + 1]; rendre(true); } }));
  }
  if (m.type === 'à froid') {
    const J = D.dryJours || { min: 0, max: 14 };
    return h('div', { class: 'reglages' },
      reglage('Jour du houblonnage à froid', 'J+' + l.jour, () => { if (l.jour > J.min) { l.jour -= 1; rendre(false); } }, () => { if (l.jour < J.max) { l.jour += 1; rendre(false); } }));
  }
  return null;
}

function blocRail(l, i, st, ordre) {
  const premier = i === 0;
  const m = mom(l.moment);
  const pastille = h('button', {
    class: 'quand', 'data-role': 'quand', 'data-k': 'q' + l.id, 'data-booster': premier ? 'moment qui tourne' : null,
    'aria-label': 'Moment : ' + quandLong(l) + ' ; glisser le long du rail pour le changer (tranches de 5 minutes), toucher pour passer au suivant, flèches haut et bas',
    onkeydown: (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const k = MOMENTS.findIndex((x) => x.code === l.moment) + (e.key === 'ArrowDown' ? 1 : -1);
      if (k >= 0 && k < MOMENTS.length) { ETAT.focusK = 'q' + l.id; placer(l, MOMENTS[k].code); }
    },
  }, quand(l));
  const poignee = h('span', { class: 'poignee', 'data-role': 'glisser-moment', onclick: () => { ETAT.focusK = 'q' + l.id; momentSuivant(l); } }, pastille);
  const carte = h('div', { class: 'blk', 'data-role': 'ligne-houblon', style: 'order:' + ordre },
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
function zoneRapides(code, liste, tete, premier, ordre, seule) {
  // Sous une carte de la même étape, la zone ne répète pas le moment (une seule pastille).
  return h('div', { class: 'rap-zone', 'data-etape': code, style: 'order:' + ordre },
    seule ? h('span', { class: 'rail-l plein' }, mom(code).quand) : h('span'),
    h('div', { class: 'rap-corps' },
      tete ? noteIbu() : null,
      tete ? champ() : null,
      h('ul', { class: 'rapides', 'aria-label': 'Ajouts proposés à ' + mom(code).quand + ', selon le moteur' },
        // Deux amérisants « au choix » (un seul suffit pour l'IBU visé) : un « ou » les sépare.
        liste.flatMap((r, n) => [rapideLigne(r, premier && n === 0, false), r.alternative && liste[n + 1] && liste[n + 1].alternative ? h('li', { class: 'ou' }, 'ou') : null]).filter(Boolean))));
}
/* Repère du rail : une graduation fine ; son nom n'est écrit qu'aux valeurs utiles. */
function repere(code, libelle, ordre) {
  const m = mom(code);
  return h('div', {
    class: 'marque' + (libelle ? ' ecrit' : '') + (m.type === 'ébullition' ? ' ebu' : ''), 'data-etape': code, style: 'order:' + ordre,
    'aria-label': 'Étape : ' + quandLong({ moment: code, jour: 3, wpT: 80, wpMin: 20 }),
  }, h('span', { class: 'rail-l' }), h('span', { class: 'drop' }, libelle || null));
}
VARIANTE = {
  etape(app) {
    app.append(enTete(), resume());
    const fr = h('section', { class: 'frise', 'data-role': 'houblons-recette', 'aria-label': 'Houblons de la recette, posés sur le rail du brassage', style: '--tick:' + Math.max(2, Math.min(9, Math.floor(110 / (EBU / 5)))) + 'px' },
      h('i', { class: 'axe', 'aria-hidden': 'true' }),
      // D37 : la durée d'ébullition se règle ici, par pas de 5′ ; le rail se redessine à cette durée.
      h('div', { class: 'ebu-regl', 'data-role': 'ebullition', 'data-minutes': String(EBU), style: 'order:-1' },
        h('span', { class: 'rail-ebu', 'aria-hidden': 'true' }),
        h('span', { class: 'ebu-corps' }, h('span', { class: 'cle' }, 'ébullition'),
          h('button', { class: 'moins', 'data-action': 'ebullition-moins', 'aria-label': 'Ébullition plus courte de 5 minutes', disabled: EBU <= EBU_MIN || null, onclick: () => changerEbu(EBU - 5) }),
          h('output', { class: 'ebu-v', 'aria-live': 'polite' }, EBU + '′'),
          h('button', { class: 'plus', 'data-action': 'ebullition-plus', 'aria-label': 'Ébullition plus longue de 5 minutes', disabled: EBU >= EBU_MAX || null, onclick: () => changerEbu(EBU + 5) }))));
    const et = etatsStock();
    const n = ETAT.lignes.length;
    // Propositions selon la place : 5 pour une recette vide, puis 3, 2, 1, et aucune au-delà de 3 ajouts (le champ reste).
    const proposes = rapidesVisibles(n === 0 ? 5 : Math.max(0, 4 - n));
    const parMoment = (c) => proposes.filter((r) => momentBorne(r.moment) === c);
    const codes = MOMENTS.map((m) => m.code);
    const premiereZone = codes.find((c) => parMoment(c).length) || D.rapidesMoment;
    let ordre = 0;
    const suite = () => (ordre += 2);
    for (const code of codes) {
      const blocs = ETAT.lignes.map((l, i) => [l, i]).filter(([l]) => l.moment === code);
      const zone = parMoment(code).length || code === premiereZone;
      const m = mom(code);
      // Repère écrit : étapes nommées (premier moût, whirlpool, phases à froid) et minutes utiles, quand rien ne les dit déjà.
      const ecrit = m.type === 'à froid' ? m.vide : blocs.length || zone ? null : m.vide || (REPERES.has(m.minute) ? m.quand : null);
      fr.append(repere(code, ecrit, suite()));
      blocs.forEach(([l, i]) => fr.append(blocRail(l, i, et[i], suite())));
      if (zone) fr.append(zoneRapides(code, parMoment(code), code === premiereZone, code === premiereZone, suite(), !blocs.length));
      if (code === 'wp') fr.append(h('div', { class: 'etape-levure', 'data-etape': 'levure', style: 'order:' + suite() }, h('span', { class: 'rail-lev', 'aria-hidden': 'true' }), levure()));
    }
    app.append(...[fr, goutsLigne(), panLigne()].filter(Boolean));
  },
};
