/* Substitution, base v4.7 (choix du brasseur, 19.10 : « Substitution, ça serait plus du u4 » ; lot 11,
   fils11-substitution/u4) : les remplaçants calculés de mon houblon, ouverts depuis sa fiche
   (« Substituts »). La réponse écrite d'abord, puis les candidats du pack (les meilleurs du catalogue
   et du stock) sur une échelle de score 50–100 à paliers : un point quand tout est connu, une plage
   hachurée quand une composante manque (elle est laissée ouverte de 0 à 100 avec les poids du moteur
   au moment de la référence ; un « 99 » partiel peut valoir 79) ; rangés par le pire cas. Un toucher
   marque un candidat (deux au plus) ; « Face à face » ouvre Comparer sur l'original et les marqués
   (les deux premiers : le premier sans inconnue à acheter, le premier du stock qui suffit).
   Chiffres : ceux du pack (substitutsCalcules : score, composantes, dose, stock) ; la plage de score
   est le seul calcul de la page, avec les poids du pack. Sans légende. */
const SUBST = (() => {
  const st = { marques: null };
  const S = () => D.subst && D.subst[ETAT.substDe];
  // Le score en plage : composantes connues avec leur poids, l'inconnue de 0 à 100.
  function plage(c, poids) {
    let lo = 0, inc = 0;
    for (const k of ['arome', 'huiles', 'amertume']) { const w = poids[k] || 0; if (c.comp[k] == null) inc += w; else lo += w * c.comp[k]; }
    return inc > 0 ? [Math.round(lo), Math.round(lo + inc * 100)] : [c.score, c.score];
  }
  const rangees = (s) => s.cand.map((c) => ({ ...c, pl: plage(c, s.poids) })).sort((a, b) => b.pl[0] - a.pl[0] || b.pl[1] - a.pl[1]);
  function marquesDefaut(rs) {
    const a = rs.find((c) => c.pl[0] === c.pl[1] && c.stock !== 'en stock'), b = rs.find((c) => c.stock === 'en stock' && c.suffisant);
    return [a, b].filter(Boolean).map((c) => c.nom);
  }
  /* La réponse écrite : les meilleurs sans inconnue, puis ceux dont le score reste une plage. */
  function phrase(rs) {
    const surs = rs.filter((c) => c.pl[0] === c.pl[1]), top = surs.length ? surs[0].pl[0] : null;
    const tete = surs.filter((c) => c.pl[0] === top).map((c) => c.nom);
    const ouverts = rs.filter((c) => c.pl[0] !== c.pl[1]);
    const et = (ns) => (ns.length > 1 ? ns.slice(0, -1).join(', ') + ' et ' + ns[ns.length - 1] : ns[0]);
    return {
      fort: tete.length ? et(tete) + ', ' + top + ' sans inconnue.' : 'Aucun remplaçant sans inconnue.',
      suite: ouverts.length ? ouverts.map((c) => c.nom).join(', ') + ' vont de ' + Math.min(...ouverts.map((c) => c.pl[0])) + ' à ' + Math.max(...ouverts.map((c) => c.pl[1])) + '.' : null,
    };
  }
  const X0 = 50, X1 = 100, pc = (v) => (Math.max(0, Math.min(1, (v - X0) / (X1 - X0))) * 100).toFixed(2) + '%';
  function ligne(c, n, marque, s) {
    const icone = c.stock === 'en stock' ? stockIcone(c.suffisant ? 'stock' : 'manque', c.suffisant ? 'en stock' : 'en stock, ne suffit pas') : stockIcone('a-acheter', 'à acheter');
    const sur = c.pl[0] === c.pl[1];
    const aide = c.nom + ' : ' + (sur ? 'score ' + c.pl[0] : 'score de ' + c.pl[0] + ' à ' + c.pl[1] + ', une composante inconnue') + ', ' + c.palier + ' ; ' + (c.dose ? 'dose ' + Math.round(c.dose.g) + ' g pour le même IBU' : '') + ' ; ' + c.raison + (marque ? ' ; marqué pour le face-à-face' : ' ; toucher pour le marquer');
    return h('li', { class: 'sb-l' + (marque ? ' on' : ''), 'data-role': 'remplacant', 'data-houblon-cle': c.cle, 'data-score-min': c.pl[0], 'data-score-max': c.pl[1], role: 'button', tabindex: '0', 'aria-pressed': String(marque), 'aria-label': aide,
      'data-k': 'sb' + n, 'data-booster': n === 0 ? 'marquer un remplaçant' : null, onclick: () => marquer(c.nom) },
    h('span', { class: 'sb-st' }, icone),
    h('b', { class: 'sb-n', 'data-houblon': c.cle }, c.nom),
    h('span', { class: 'sb-p', 'aria-hidden': 'true' },
      sur ? h('i', { class: 'sb-pt', style: 'left:' + pc(c.pl[0]) })
        : [h('i', { class: 'sb-ha', style: 'left:' + pc(c.pl[0]) + ';width:calc(' + pc(c.pl[1]) + ' - ' + pc(c.pl[0]) + ')' }),
          h('span', { class: 'sb-v g', style: 'right:calc(100% - ' + pc(c.pl[0]) + ' + 6px)' }, String(c.pl[0]))],
      h('span', { class: 'sb-v', style: 'left:calc(' + pc(c.pl[1]) + ' + 8px)' }, String(c.pl[1]))));
  }
  function marquer(nom) {
    const m = st.marques;
    st.marques = m.includes(nom) ? m.filter((x) => x !== nom) : [...m, nom].slice(-2);
    rendre(false);
  }
  /* Le face-à-face en bref (u4 : « même IBU ») : l'original et les marqués, chacun dans la couleur qu'il
     aura dans Comparer ; la dose pour le même IBU (une plage quand l'α dépend du lot, sans lot ni
     article), son α, son rôle, ses arômes en couleur. */
  const nbF = (v) => virgule(v, Math.abs(v) < 10 ? 1 : 0);
  function bref(s, rs) {
    const noms = [s.nom, ...st.marques];
    for (const n of noms) COMPARER.couleur(n);
    // La plage d'α de chaque houblon sur une piste commune : réunion des sources, centre, mon lot (▼) ou l'article (▽).
    const uDe = (n) => { const a = D.fichesH[cleDe(n)].alpha; return a.length ? [Math.min(...a.map((x) => x.min)), Math.max(...a.map((x) => x.max))] : null; };
    const echA = Math.ceil(Math.max(5, ...noms.map(uDe).filter(Boolean).map((u) => u[1])) / 5) * 5, pa = (v) => Math.max(0, Math.min(100, (v / echA) * 100)).toFixed(2) + '%';
    const pisteA = (nom) => {
      const F = D.fichesH[cleDe(nom)], u = uDe(nom), c = COMPARER.couleur(nom);
      if (!u) return h('span', { class: 'sb-at vide' });
      const cen = F.alpha.reduce((t, x) => t + (x.min + x.max) / 2, 0) / F.alpha.length;
      return h('span', { class: 'sb-at', 'data-plage': '', 'data-mesure': 'alpha', 'data-houblon': nom, 'data-min': u[0], 'data-max': u[1], 'data-echelle-max': echA, 'aria-hidden': 'true' },
        h('i', { class: 'pl-pale', style: 'width:' + pa(u[0]) + ';background:' + c }),
        h('i', { class: 'pl-seg', style: 'left:' + pa(u[0]) + ';width:calc(' + pa(u[1]) + ' - ' + pa(u[0]) + ');background:' + c }),
        h('i', { class: 'pl-cen', style: 'left:' + pa(cen) }),
        F.lot != null ? h('i', { class: 'pl-lot', 'data-origine': F.lotOrigine || 'stock', style: 'left:' + pa(F.lot) }) : null);
    };
    const ligneF = (nom) => {
      const F = D.fichesH[cleDe(nom)], c = rs.find((x) => x.nom === nom), orig = nom === s.nom;
      const u = F.alpha.length ? [Math.min(...F.alpha.map((x) => x.min)), Math.max(...F.alpha.map((x) => x.max))] : null;
      const dose = orig ? grammes(s.ref.g) : c && c.dose ? (F.lot == null && c.dose.max > c.dose.min ? Math.round(c.dose.min) + '–' + Math.round(c.dose.max) + ' g' : Math.round(c.dose.g) + ' g') : '?';
      const alpha = F.lot != null ? nbF(F.lot) : u ? nbF(u[0]) + '–' + nbF(u[1]) : '?';
      return h('div', { class: 'sb-fl', style: '--c:' + COMPARER.couleur(nom), 'data-houblon-compare': nom, 'data-couleur': COMPARER.couleur(nom) },
        h('b', { 'data-houblon': cleDe(nom) }, nom), h('span', { class: 'sb-fd', 'data-role': 'dose-equivalente' }, dose),
        h('span', { class: 'sb-fa', 'data-role': 'alpha' }, h('span', { class: 'c-grec' }, 'α'), alpha),
        h('span', { class: 'sb-fr', 'data-role': 'role' }, F.role ? (F.role.v === 'double' ? 'double' : ROLE_MOT[F.role.v] || F.role.v) : ''),
        // Ses arômes en couleur (le code de l'étape) : ce qu'il garde ou perd de l'original, sans un mot.
        miniProfil({ niv: D.ordre.map((f) => ((F.aromes || []).find((a) => a.f === f) || { lv: 0 }).lv) }, nom),
        pisteA(nom));
    };
    return h('div', { class: 'sb-ff', role: 'group', 'aria-label': 'À IBU égal : ' + noms.join(', ') }, noms.map(ligneF));
  }
  function faceAFace(s) {
    ETAT.comp = [s.nom, ...st.marques].filter((n, k, a) => a.indexOf(n) === k);
    ETAT.focusSerie = null; ETAT.cOuvert = null;
    ouvrir('comparer');
  }
  function vue(app) {
    const s = S();
    if (!s) { app.append(h('p', { class: 'rangee gris' }, 'Aucun remplaçant calculé pour ce houblon.')); return; }
    const rs = rangees(s);
    if (!st.marques) st.marques = marquesDefaut(rs);
    const ph = phrase(rs);
    const seuils = s.paliers.filter((p) => p.min >= X0 && p.min < X1).sort((a, b) => a.min - b.min);
    app.append(
      h('div', { class: 'tete sb-tete' }, h('button', { class: 'retour', 'aria-label': 'Revenir à l\'étape', onclick: () => { ETAT.vue = 'etape'; rendre(false); } }),
        h('h1', {}, h('span', { 'data-houblon': s.cle }, s.nom)), h('span', { class: 'sb-ctx' }, 'remplaçants à ' + s.ref.quand)),
      h('section', { class: 'sb', 'data-partie': 'substitution', 'data-composant': 'substitution' },
        h('div', { class: 'sb-rep', 'data-role': 'reponse' }, h('b', {}, ph.fort), ph.suite ? h('span', {}, ph.suite) : null),
        h('div', { class: 'sb-ech', 'aria-hidden': 'true' }, h('span'), h('span', { class: 'sb-pals' }, seuils.map((p, k) => h('span', { style: 'left:' + pc(p.min) + ';width:calc(' + pc(k + 1 < seuils.length ? seuils[k + 1].min : X1) + ' - ' + pc(p.min) + ')' }, p.label)))),
        h('ul', { class: 'sb-ls', 'aria-label': 'Remplaçants de ' + s.nom + ', rangés par le pire cas' }, rs.map((c, n) => ligne(c, n, st.marques.includes(c.nom), s))),
        h('div', { class: 'sb-ax', 'aria-hidden': 'true' }, h('span'), h('span', { class: 'sb-axt' }, [X0, ...seuils.map((p) => p.min).filter((v) => v > X0), X1].map((v) => h('span', { style: 'left:' + pc(v) }, String(v))))),
        bref(s, rs),
        h('button', { class: 'sb-face', 'data-action': 'face-a-face', 'data-k': 'sbf', 'data-booster': 'face à face', disabled: !st.marques.length || null,
          'aria-label': 'Comparer ' + s.nom + ' à ' + st.marques.join(' et ') + ', à IBU égal', onclick: () => faceAFace(s) }, 'Face à face'),
        h('p', { class: 'sb-hon' }, 'Calculés sur nos fiches ; prix inconnu.')));
  }
  return { vue, plage };
})();
