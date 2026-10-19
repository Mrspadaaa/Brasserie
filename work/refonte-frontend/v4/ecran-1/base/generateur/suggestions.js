/* Suggestions en Radar, base v4.6 (choix du brasseur, 19.10 : « Radar suggestions: p10, p5, p3-> mais
   radar beaucoup plus grand » ; lot 6, fils6-suggestions/p10 d'abord, p05 et p03) : la réponse écrite
   par objectif en tête (p10 ; l'écart chiffré de p05 et p03), le radar commun en grand (pleine
   largeur), puis les voies en lignes d'action (p10 : numéro, changement, moment réglable, IBU, stock
   en icône, montrer sur le radar, Appliquer). Les Barres de Suggestions ne sont pas encore choisies :
   elles restent celles de la base.
   La réponse (D60) : pour chaque objectif de la direction du pack (plus floral, moins résineux),
   la meilleure voie houblon du moteur sur cette famille. Atteint : elle arrive à la visée du pack ;
   approche : elle fait au moins la moitié du chemin vers la visée, ou ramène ma bière dans le style ;
   sinon aucune voie houblon, et les pistes hors houblon du pack (pour leur famille) à un toucher. Tous les chiffres sont ceux du pack
   (S1.tolerance, voies[].ecartsApres, ibu) ; la page ne fait que les placer, et sommer les tables
   d'IBU quand le moment change. Sans légende : la voie montrée est celle dont l'œil est allumé. */
const SUGG = (() => {
  const ok = () => !!(D.tol && D.voies.some((v) => v.ea));
  // Aucune voie levure ni biotransformation (« pas pour tout de suite »).
  const VOIES = () => D.voies.filter((v) => !v.levure && v.type !== 'levure' && v.ea);
  const st = { moment: {}, applique: null, hors: null, tous: false };
  const v1 = (x) => virgule(Math.round(x * 10) / 10, 1);
  const objectifs = () => (D.dirPack || []).filter((d) => D.tol.biere[d.f]).map((d) => ({ f: d.f, sens: d.crans >= 0 ? 1 : -1, visee: d.cible }));

  /* Une valeur sur la famille : dans le style, ses points (0–100) ; au-dessus, son écart en T. */
  const txt = (x) => (x.e > 0 ? '+' + v1(x.e) + ' T' : String(Math.round(x.v)));
  function reponse(o) {
    const A = D.tol.biere[o.f];
    const cand = VOIES().filter((v) => v.ea[o.f] && v.ea[o.f].v != null);
    if (!cand.length) return { verdict: 'aucune', A, B: null, voie: null };
    const voie = cand.reduce((b, v) => ((o.sens > 0 ? v.ea[o.f].v > b.ea[o.f].v : v.ea[o.f].v < b.ea[o.f].v) ? v : b));
    const B = voie.ea[o.f];
    const atteint = o.sens > 0 ? B.v >= o.visee : B.v <= o.visee;
    const moitie = Math.abs(B.v - o.visee) <= Math.abs(A.v - o.visee) / 2;
    const entre = A.e > 0 && B.e === 0;
    return { verdict: atteint ? 'atteint' : moitie || entre ? 'approche' : 'aucune', A, B, voie };
  }
  // Le verdict en grand, la suite en texte courant (p10 : « Aucune voie houblon »).
  const MOT = { atteint: ['Atteint', ''], approche: ['Approche', ''], aucune: ['Aucune', 'voie houblon'] };
  function carte(o) {
    const r = reponse(o), hors = st.hors === o.f;
    const chiffre = r.B ? txt(r.A) + ' → ' + txt(r.B) : txt(r.A);
    const aide = D.long[o.f] + ' : ' + (o.sens > 0 ? 'plus' : 'moins') + ' ; ' + (r.verdict === 'aucune' ? 'aucune voie houblon ne le change assez' : r.verdict === 'atteint' ? 'la visée est atteinte' : 'la meilleure voie s\'en approche')
      + ' ; ma bière ' + txt(r.A) + (r.B ? ', au mieux ' + txt(r.B) + ' (' + r.voie.label.replace(/\./g, ',') + ')' : '') + ' ; visée ' + Math.round(o.visee);
    return h('div', { class: 'rep-c v-' + r.verdict, 'data-role': 'reponse', 'data-famille': o.f, 'data-verdict': r.verdict, role: 'group', 'aria-label': aide },
      h('span', { class: 'rep-i', 'aria-hidden': 'true' }),
      h('span', { class: 'rep-t' },
        h('span', { class: 'rep-f' }, h('span', { class: 'rep-s', 'aria-hidden': 'true' }, o.sens > 0 ? '▲' : '▼'), D.court[o.f]),
        h('span', { class: 'rep-v' }, h('b', {}, MOT[r.verdict][0]), MOT[r.verdict][1] ? h('span', { class: 'rep-m' }, MOT[r.verdict][1]) : null),
        h('span', { class: 'rep-n' }, chiffre)),
      r.verdict === 'aucune' && D.horsModele.length && D.horsModeleFam === o.f ? h('button', { class: 'rep-h', 'aria-expanded': String(hors), 'data-k': 'hh' + o.f, 'data-booster': 'hors houblon',
        'aria-label': 'Pistes hors houblon (' + D.horsModele.length + ')', onclick: () => { st.hors = hors ? null : o.f; rendre(false); } }, 'Hors houblon') : null,
      hors ? h('ul', { class: 'rep-p' }, D.horsModele.map((t) => h('li', {}, t))) : null);
  }

  /* Le moment, libre (D34) : premier moût, ébullition par 5′, whirlpool. */
  const momentsVoie = () => MOMENTS.filter((m) => m.type === 'ébullition' || m.code === 'wp' || m.code === 'fwh').map((m) => m.code);
  const momentDe = (v) => st.moment[v.rang] || momentBorne(v.actionsP[0].moment);
  const quandCode = (c) => (c === 'wp' ? 'whirlpool' : c === 'fwh' ? 'moût' : mom(c).quand);
  function bouger(v, d) {
    const L = momentsVoie(), i = L.indexOf(momentDe(v));
    st.moment[v.rang] = L[Math.max(0, Math.min(L.length - 1, i + d))];
    rendre(false);
  }
  function momentEl(v, booster) {
    const L = momentsVoie(), i = L.indexOf(momentDe(v));
    return h('span', { class: 'mom' },
      h('button', { class: 'mom-b tot', 'data-action': 'moment', 'data-k': 'mt' + v.rang, disabled: i <= 0 || null, 'aria-label': 'Plus tôt' + (i > 0 ? ' : ' + quandCode(L[i - 1]) : ''), onclick: (e) => { e.stopPropagation(); bouger(v, -1); } }),
      h('b', { class: 'mom-q', 'data-role': 'quand' }, quandCode(momentDe(v))),
      h('button', { class: 'mom-b tard', 'data-action': 'moment', 'data-k': 'ml' + v.rang, 'data-booster': booster || null, disabled: i >= L.length - 1 || null, 'aria-label': 'Plus tard' + (i < L.length - 1 ? ' : ' + quandCode(L[i + 1]) : ''), onclick: (e) => { e.stopPropagation(); bouger(v, 1); } }));
  }
  /* IBU : celui du pack au moment de la voie ; à un autre moment, la somme des tables d'IBU. */
  const tabDe = (cle) => { const r = [...D.rapides.stock, ...D.rapides.epuises, ...D.rapides.catalogue, ...D.lignes].find((x) => x.cle === cle && x.tab); return r ? r.tab : null; };
  // Sans table : l'IBU par gramme de la fiche du pack à ce moment (60′, 30′, 15′, 10′, 5′, 0′, whirlpool).
  const pgDe = (cle) => (D.fichesH[cle] && D.fichesH[cle].ibuPG) || {};
  const ibuA = (cle, m, g) => { const x = ibuLigne({ moment: m, g, tab: tabDe(cle), ibuPG: pgDe(cle), ibu0: null, wpT: 80, wpMin: 20 }); return typeof x === 'number' ? x : null; };
  function ibuDe(v) {
    const m = momentDe(v);
    if (m === v.actionsP[0].moment) return { apres: v.ibuApres, drift: v.ibuDrift };
    let tot = v.ibuAvant;
    for (const a of v.actionsP) {
      if (a.op === 'ajouter') { const x = ibuA(a.cle, m, a.g); if (x == null) return null; tot += x; continue; }
      const l = D.lignes.find((y) => y.nom === (a.avantNom || a.nom));
      const x0 = l ? ibuLigne({ ...l, wpT: 80, wpMin: 20 }) : null, x1 = ibuA(a.cle, m, a.g);
      if (typeof x0 !== 'number' || x1 == null) return null;
      tot += x1 - x0;
    }
    return { apres: tot, drift: tot - v.ibuAvant };
  }
  const signe = (x) => (x >= 0 ? '+' : '−') + v1(Math.abs(x));
  /* Le changement d'abord : verbe, houblon, dose. */
  const hop = (n) => h('span', { 'data-houblon': cleDe(n) }, n);
  function changement(v) {
    const a = v.actionsP, a0 = a[0];
    let c;
    if (v.type === 'assemblage') c = ['Assembler ', hop(a0.nom), ' + ', hop(a[1].nom), ' ', virgule(a0.g) + ' + ' + grammes(a[1].g)];
    else if (v.type === 'diminuer') c = ['Diminuer ', hop(a0.nom), ' ', virgule(a0.gAvant) + ' → ' + grammes(a0.g)];
    else if (v.type === 'ajouter') c = ['Ajouter ', hop(a0.nom), ' ', grammes(a0.g)];
    else c = ['Remplacer ', hop(a0.avantNom), ' par ', hop(a0.nom), ' ', grammes(a0.g)];
    return h('span', { class: 'chg', 'data-role': 'changement' }, c);
  }
  /* Appliquer : la voie entre dans la recette (une à la fois) ; Annuler la retire. */
  const libreDe = (cle) => { const s = [...D.rapides.stock, ...D.rapides.epuises].find((x) => x.cle === cle); return s ? s.libre : 0; };
  function appliquer(v) {
    if (st.applique) ETAT.lignes = st.applique.avant;
    const avant = ETAT.lignes.map((l) => ({ ...l })), m = momentDe(v);
    for (const a of v.actionsP) {
      if (a.op === 'ajouter') {
        ETAT.lignes.push({ id: 'v' + v.rang + '-' + a.cle, cle: a.cle, nom: a.nom, moment: m, g: a.g, jour: 3, wpT: 80, wpMin: 20, alpha: null, role: null, tab: tabDe(a.cle), ibuPG: pgDe(a.cle),
          ibu0: { moment: a.moment, g: a.g, v: v.actionsP.length === 1 ? v.ibuDrift : null }, libre: libreDe(a.cle), achat: v.stockStatut === 'à acheter', citation: null,
          fiche: D.fiches[a.nom] || { niv: D.ordre.map(() => 0), n: D.ordre.map(() => 0), of: 0 }, effet: null, nouveau: true, signaux: [] });
        continue;
      }
      const l = ETAT.lignes.find((y) => y.nom === (a.avantNom || a.nom));
      if (!l) continue;
      if (a.avantNom) Object.assign(l, { cle: a.cle, nom: a.nom, tab: tabDe(a.cle), ibuPG: pgDe(a.cle), ibu0: { moment: a.moment, g: a.g, v: null }, libre: libreDe(a.cle), alpha: null, role: null, citation: null, fiche: D.fiches[a.nom] || l.fiche });
      l.g = a.g; l.moment = m;
    }
    st.applique = { rang: v.rang, avant };
    rendre(true);
  }
  function annuler() { if (!st.applique) return; ETAT.lignes = st.applique.avant; st.applique = null; rendre(true); }
  /* Une voie en ligne d'action (p10). */
  function ligne(v, n, montree) {
    const x = ibuDe(v), applique = st.applique && st.applique.rang === v.rang;
    const stock = v.stockStatut === 'à acheter' ? stockIcone('a-acheter', 'à acheter') : v.stockStatut === 'manque' ? stockIcone('manque', 'manque ' + grammes(v.manque)) : null;
    return h('li', { class: 'vl' + (montree ? ' on' : ''), 'data-voie': v.rang },
      h('span', { class: 'vl-n', 'aria-hidden': 'true' }, String(n + 1)),
      h('span', { class: 'vl-c' }, changement(v), momentEl(v, n === 0 ? 'moment de la voie' : null)),
      h('span', { class: 'vl-ibu', 'data-role': 'ibu', title: x ? 'IBU après la voie : ' + v1(x.apres) : 'IBU à recalculer' }, x ? signe(x.drift) : '?'),
      h('span', { class: 'vl-st' }, stock),
      h('button', { class: 'vl-r', 'aria-pressed': String(montree), 'data-k': 'vr' + v.rang, 'data-booster': n === 1 ? 'voie sur le radar' : null,
        'aria-label': (montree ? 'Montrée sur le radar : ' : 'Montrer sur le radar : ') + v.label.replace(/\./g, ','), onclick: () => { ETAT.voieRadar = v.rang; rendre(false); } }),
      applique
        ? h('button', { class: 'vl-a fait', 'data-action': 'appliquer', 'data-k': 'an' + v.rang, 'aria-label': 'Annuler : retirer cette voie de la recette', onclick: () => annuler() })
        : h('button', { class: 'vl-a', 'data-action': 'appliquer', 'data-k': 'ap' + v.rang, 'data-booster': n === 0 ? 'appliquer' : null, 'aria-label': 'Appliquer à la recette : ' + v.label.replace(/\./g, ','), onclick: () => appliquer(v) }));
  }

  function partieRadar(part) {
    part.append(h('div', { class: 'titre' }, h('span'), lentille()));
    if (!dirsActives().length || !D.voies.length) { part.append(h('p', { class: 'rangee gris' }, D.notes.voies || 'Une direction ouvre les voies du moteur.')); return; }
    part.append(h('div', { class: 'reps' }, objectifs().map(carte)));
    const { liste } = voiesListe();
    const montrees = liste.filter((v) => !v.nouvelle && v.ea);
    if (!montrees.some((v) => v.rang === ETAT.voieRadar)) ETAT.voieRadar = (montrees[0] || {}).rang;
    const z = h('div', { class: 'vue-voies', 'data-composant': 'radar' });
    part.append(z);
    if (montrees.length) RADAR.voies(z, { marq: montrees, liste }, () => rendre(false), { sansPuces: true, grand: true });
    const autres = VOIES().filter((v) => !montrees.includes(v));
    const vus = st.tous ? [...montrees, ...autres] : montrees;
    part.append(h('ul', { class: 'vls', 'aria-label': 'Voies du moteur' }, vus.map((v, n) => ligne(v, n, v.rang === ETAT.voieRadar))));
    if (autres.length) part.append(h('button', { class: 'vl-plus', 'aria-expanded': String(st.tous), 'data-k': 'vplus', 'aria-label': (st.tous ? 'Replier les ' : 'Voir les ') + autres.length + ' autres voies', onclick: () => { st.tous = !st.tous; rendre(false); } }, st.tous ? '−' : '+' + autres.length));
    LENTILLE_CB = () => anime(140, (k) => { part.style.opacity = 1 - k; }, () => { part.style.opacity = 1; rendre(false); });
  }
  return { ok, partieRadar, reponse };
})();
