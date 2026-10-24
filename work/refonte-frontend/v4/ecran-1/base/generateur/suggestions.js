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

/* Suggestions en Barres, base v4.10 (#138, lot 15 bis, D78 à D82 ; choix du brasseur : q2b, « cella là »,
   puis « C'est effectivement qb2 reprise le mieux ») : q2b (ecran-1/fils15-s5-complexe/q2b, fait sur c1)
   posé sur le cas de la base, S1 (la stout 16D, plus floral et moins résineux) ; les mêmes voies, dans
   le même ordre, que donnees/s1.json.
   - La réponse par objectif en tuile (verdict de SUGG.reponse, le même qu'en Radar) ; « Hors houblon »
     mène aux pistes du pack.
   - Un graphique sans fond : deux demi-pistes (← moins, plus →), ma bière au rail du milieu, la visée en
     tirets ; au style par défaut (une demi-piste = 3 crans du style de la famille), l'absolu à un toucher
     (50 points).
   - Les voies dans l'ordre du moteur. Les voies voisines au même effet sur les objectifs : la barre une
     fois, puis le tableau, où l'extra départage. Une ligne par voie : l'usage du houblon en mini picto
     (pâle s'il est déduit de l'α), le nom (appui long : la fiche, fiche.js), la dose, le stock en marque
     passive, le goût (D20) et le « + » qui l'ajoute vraiment à Comparer (ETAT.comp, ✓ une fois ajoutée).
     Dessous, une case par famille : picto plein si la famille est marquée dans les fiches, pâle si une
     seule la cite ; une jauge d'un trait par cran du style, orangée hors du style. Le dry hop actif écrit
     sa biotransformation en pictos, ouverte d'un toucher.
   - La liste défile sous l'en-tête du panneau (onglets, IBU) ; « Comparer (n) » reste à portée.
   Données (build.mjs, suggestionsQ2b) : voies[].tout, fichesV, bio, hs, estime, levureVers ; D.sugg. */
const Q2B = (() => {
  const st = { scroll: 0, bio: {}, hh: false, ibu: false };
  const ok = () => !!(D.sugg && D.voies.length && D.voies.every((v) => Array.isArray(v.tout)));
  const r1 = (x) => Math.round(x * 10) / 10;
  const fr = (x) => virgule(x, 1).replace('-', '−');
  const sg = (x) => (x > 0 ? '+' : '') + fr(x);
  const pc = (x) => r1(Math.max(0, Math.min(100, x))) + '%';
  const crTxt = (c) => sg(c) + ' cran' + (Math.abs(c) >= 2 ? 's' : '');
  const fam = (f) => D.sugg.familles[f];
  const toutDe = (v, f) => v.tout.find((t) => t.f === f) || null;
  const objectifs = () => (D.dirPack || []).filter((d) => d.f in ETAT.visee && fam(d.f)).map((d) => ({ f: d.f, sens: d.crans >= 0 ? 1 : -1, visee: d.cible }));
  // L'intensité d'un objectif : les crans du moteur (tout), 0 sous 0,05 point.
  const cransObj = (v, f) => { const t = toutDe(v, f), e = v.dir[f]; return t ? t.c : e == null ? null : r1(e / fam(f).cran); };

  /* Icônes au trait (couleur du texte) ; le stock reste une marque passive grise. */
  const I = {
    arome: '<svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 9 C4 4, 10 4, 12 9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="7" cy="10.5" r="2" fill="currentColor"/></svg>',
    amer: '<svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1 C9 5, 12 7, 12 9.5 A5 5 0 0 1 2 9.5 C2 7, 5 5, 7 1 Z" fill="currentColor"/></svg>',
    levure: '<svg width="15" height="13" viewBox="0 0 16 14" aria-hidden="true"><circle cx="6" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12.2" cy="3.8" r="2.8" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="5" cy="7" r="1.2" fill="currentColor"/></svg>',
    cuveActif: '<svg width="12" height="14" viewBox="0 0 14 16" aria-hidden="true"><path d="M2 1 H12 V9 L7 15 L2 9 Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="5.5" cy="7" r="1.2" fill="currentColor"/><circle cx="8.5" cy="4.5" r="1.2" fill="currentColor"/><circle cx="7.5" cy="9.5" r="1" fill="currentColor"/></svg>',
    cuve: '<svg width="12" height="14" viewBox="0 0 14 16" aria-hidden="true"><path d="M2 1 H12 V9 L7 15 L2 9 Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    remous: '<svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 7 m-1 0 a1 1 0 1 1 2 0 a3 3 0 1 1 -6 0 a5 5 0 1 1 10 0" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    egal: '<svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true"><rect x="2" y="4" width="10" height="2.2" rx="1" fill="currentColor"/><rect x="2" y="8" width="10" height="2.2" rx="1" fill="currentColor"/></svg>',
    bulles: '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><circle cx="5" cy="12" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="10.5" cy="8" r="2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="6.5" cy="4" r="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M13 6 V1.5 M11 3.5 L13 1.5 L15 3.5" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>',
    fleche: '<svg width="10" height="10" viewBox="0 0 12 10" aria-hidden="true"><path d="M1 5 H10 M7 2 L10 5 L7 8" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>',
    bord: '<svg width="7" height="9" viewBox="0 0 9 10" aria-hidden="true"><path d="M7 1 L2 5 L7 9" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
  };
  const STOCK = {
    suffisant: ['en stock', '<svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><rect x="1" y="3" width="10" height="8" rx="1.5" fill="currentColor"/><path d="M3.5 7 L5.3 8.8 L8.6 5.4" stroke="#fff" stroke-width="1.6" fill="none"/></svg>'],
    'à acheter': ['à acheter', '<svg width="12" height="11" viewBox="0 0 13 12" aria-hidden="true"><path d="M1 1.5 H3 L4.4 8 H10.5 L12 3.5 H3.6" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="5" cy="10.3" r="1.2" fill="currentColor"/><circle cx="9.8" cy="10.3" r="1.2" fill="currentColor"/></svg>'],
    manque: ['stock insuffisant', '<svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><rect x="1.5" y="3" width="9" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="1.5" y="8" width="9" height="3" rx="1" fill="currentColor"/></svg>'],
  };
  const svgDe = (s) => { const t = document.createElement('template'); t.innerHTML = s; return t.content.firstChild; };
  /* Le picto d'une famille (sprite #pictos de page.html) ; data-famille quand il porte seul le sens. */
  function picto(f, w = 16, marque) {
    const s = sv('svg', { class: 'q-pi', width: w, height: w, 'data-famille': marque ? f : null, role: marque ? 'img' : null, 'aria-label': marque ? D.long[f] : null, 'aria-hidden': marque ? null : 'true' });
    sv('use', { href: '#p-' + f }, s);
    return s;
  }

  /* Le moment, écrit (D81) : 10′, 60′, actif, levure… */
  function momentDe(v) { return v.levureVers ? 'levure' : (v.actionsP[0] || {}).moment; }
  const momentTexte = (code) => (code === 'levure' ? ['levure', I.levure, 'levure, toute la fermentation'] : code === 'dryActive' ? ['actif', I.cuveActif, 'dry hop en fermentation active']
    : code === 'dryPost' ? ['après', I.cuve, 'dry hop après fermentation'] : code === 'wp' ? ['whirlpool', I.remous, 'au whirlpool'] : code === 'fwh' ? ['moût', '', 'au premier moût'] : [mom(code).quand, '', 'à ' + mom(code).quand]);
  function pill(code) {
    const [t, ic, lg] = momentTexte(code);
    return h('span', { class: 'q-mo', 'data-role': 'moment', 'data-moment': code, 'aria-label': 'Moment : ' + lg }, ic ? svgDe(ic) : null, h('span', {}, t));
  }

  /* L'usage selon le moteur (hopRole) : goutte amérisant, arôme aromatique, les deux double ; pâle si déduit de l'α. */
  function usage(x) {
    const dit = x.source === 'fournisseur' ? 'attesté par le fournisseur' : 'déduit de l\'α, à valider';
    const ic = { amérisant: [I.amer], aromatique: [I.arome], double: [I.amer, I.arome] }[x.usage];
    return h('span', { class: 'q-us' + (x.source === 'règle' ? ' q-deduit' : ''), 'data-role': 'usage', 'data-usage': x.usage, 'data-source': x.source, role: 'img', 'aria-label': x.nom + ' : ' + x.usage + ', ' + dit, title: x.nom + ' : ' + x.usage + ', ' + dit },
      ic ? ic.map(svgDe) : h('b', { class: 'q-inc' }, '?'));
  }
  function stockMarque(v) {
    const s = !v.levureVers && STOCK[v.stockStatut];
    if (!s) return null;
    const txt = v.stockStatut === 'manque' && v.manque ? 'manque ' + grammes(v.manque) : s[0];
    return h('span', { class: 'q-stk', 'data-stock': v.stockStatut, role: 'img', 'aria-label': 'Stock : ' + txt }, svgDe(s[1]));
  }
  function doseTxt(v) {
    const a = v.actionsP;
    if (v.levureVers || !a.length) return '';
    if (v.type === 'assemblage' && a[1]) return virgule(a[0].g) + '+' + grammes(a[1].g) + ' ≈';
    if (v.type === 'diminuer' && a[0].gAvant != null) return virgule(a[0].gAvant) + ' → ' + grammes(a[0].g);
    return grammes(a[0].g);
  }
  const nomsDe = (v) => (v.levureVers ? [] : [...new Set(v.actionsP.map((a) => a.nom))]);
  const nomTexte = (v) => v.levureVers || nomsDe(v).join(' + ');

  /* Le niveau des fiches pour une famille qui monte : marqué (2 fiches, ou nommée en premier), cité ; une
     famille qui baisse, ou que ses fiches ne citent pas, vient du modèle seul. */
  function niv(v, f, e) {
    if (e < 0) return 'sf';
    const n = Math.max(0, ...v.fichesV.map((x) => x.niv[f] || 0));
    return n >= 2 ? 'mq' : n === 1 ? 'ci' : 'sf';
  }
  const NIVMOT = { mq: 'marqué dans ses fiches', ci: 'cité par une fiche', sf: 'modèle seul' };

  /* ---------- barres au style ou en absolu ---------- */
  // Ma bière pour un objectif : le repère du modèle, ou le bord de la plage dégustée vers la visée.
  const maBiere = (o) => { const d = D.sugg.degustation[o.f]; return d ? (o.sens < 0 ? d[0] : d[1]) : fam(o.f).avant; };
  // La marge jusqu'au bord du style, de chaque côté de ma bière ; aucune quand ma bière dégustée est déjà au-dessus.
  function zone(f) {
    const F = fam(f), d = D.sugg.degustation[f];
    if (d && d[0] > F.bande[1]) return null;
    if (F.avant == null) return undefined;
    const [b0, b1] = F.bande, c = F.cran;
    return { rS: (b1 - F.avant) / c / 3 * 100, lS: (F.avant - b0) / c / 3 * 100, rA: (b1 - F.avant) / 50 * 100, lA: (F.avant - b0) / 50 * 100 };
  }
  const largeur = (f, e) => { const s = Math.abs(e) / fam(f).cran / 3 * 100, a = Math.abs(e) / 50 * 100; return { s: Math.min(s, 100), a: Math.min(a, 100), ds: s > 100, da: a > 100 }; };
  function zt(f, cote) {
    const z = zone(f);
    if (!z) return null;
    const s0 = cote === 'r' ? z.rS : z.lS, a0 = cote === 'r' ? z.rA : z.lA;
    return h('i', { class: 'q-zt f-' + f + (s0 > 100 ? ' q-cs' : '') + (a0 > 100 ? ' q-ca' : ''), 'data-role': 'zone', 'data-famille': f, style: '--s:' + pc(s0) + ';--a:' + pc(a0) });
  }
  const arr = (c) => (Math.abs(c) < 0.5 ? (c < 0 ? '≈ −' : '≈ +') : (c > 0 ? '+' : '−') + Math.round(Math.abs(c)) + (Math.round(Math.abs(c)) >= 2 ? ' crans' : ' cran'));
  function barre(v, f, e, avecLab) {
    const b = largeur(f, e), n = niv(v, f, e), c = cransObj(v, f);
    const out = [h('i', { class: 'q-bar q-' + n + ' f-' + f + (b.ds ? ' q-ds' : '') + (b.da ? ' q-da' : ''), 'data-role': 'effet', 'data-famille': f, title: D.long[f] + ' ' + sg(e) + ' · ' + NIVMOT[n], style: '--s:' + pc(b.s) + ';--a:' + pc(b.a) })];
    // Hors du style : l'orangé au-delà du bord du style.
    if (v.hs.includes(f)) {
      const z = zone(f), cote = e >= 0 ? 'r' : 'l';
      const zs = z ? (cote === 'r' ? z.rS : z.lS) : b.s - 5, za = z ? (cote === 'r' ? z.rA : z.lA) : b.a - 5;
      out.push(h('i', { class: 'q-hs', style: '--s0:' + pc(Math.min(zs, b.s)) + ';--s1:' + pc(Math.max(0, b.s - zs)) + ';--a0:' + pc(Math.min(za, b.a)) + ';--a1:' + pc(Math.max(0, b.a - za)) }));
    }
    if (avecLab && c != null) out.push(h('span', { class: 'q-lab', style: '--s:' + pc(b.s) + ';--a:' + pc(b.a) }, arr(c)));
    return out;
  }
  const inconnu = (f) => h('i', { class: 'q-bar q-inconnu', 'data-role': 'effet', 'data-famille': f, title: D.long[f] + ' : effet non établi' });
  /* Un couloir par objectif ; ce qui monte à droite, ce qui baisse à gauche. */
  function couloirs(v, objs, avecLab) {
    const g = [], d = [];
    for (const o of objs) {
      const e = v.dir[o.f], cote = o.sens > 0 ? 'r' : 'l';
      const L = [], R = [];
      if (e == null) (cote === 'r' ? R : L).push(zt(o.f, cote), inconnu(o.f));
      else if (e >= 0) { R.push(zt(o.f, 'r'), ...barre(v, o.f, e, avecLab)); if (cote === 'l') L.push(zt(o.f, 'l')); }
      else { L.push(zt(o.f, 'l'), ...barre(v, o.f, e, avecLab)); if (cote === 'r') R.push(zt(o.f, 'r')); }
      g.push(h('div', { class: 'q-ln' }, L)); d.push(h('div', { class: 'q-ln' }, R));
    }
    return h('div', { class: 'q-bars' }, h('div', { class: 'q-m q-re' }, g), h('div', { class: 'q-g' }), h('div', { class: 'q-m q-fl' }, d));
  }
  /* La visée : sa distance à ma bière, au style (3 crans) et en absolu (50 points). */
  const ecartVisee = (o) => { const d = o.visee - maBiere(o); return { s: Math.abs(d) / fam(o.f).cran / 3 * 100, a: Math.abs(d) / 50 * 100 }; };
  function fonds(objs) {
    const moitie = (cote, os) => h('div', { class: 'q-moitie q-' + cote, 'data-role': 'piste', 'data-famille': os[0] ? os[0].f : null },
      os.slice(1).map((o) => h('i', { class: 'q-ov', 'data-role': 'piste', 'data-famille': o.f })),
      os.map((o) => { const x = ecartVisee(o); return h('i', { class: 'q-vl' + (x.s > 100 ? ' q-hs-s' : '') + (x.a > 100 ? ' q-hs-a' : ''), style: '--s:' + pc(x.s) + ';--a:' + pc(x.a) }); }));
    return h('div', { class: 'q-fonds', 'aria-hidden': 'true' }, moitie('re', objs.filter((o) => o.sens < 0)), h('div', { class: 'q-gut' }), moitie('fl', objs.filter((o) => o.sens > 0)));
  }
  function tetes(objs) {
    const puce = (o, cote) => {
      const x = ecartVisee(o);
      return [['sty', x.s], ['abs', x.a]].map(([m, p]) => (p > 100
        ? h('span', { class: 'q-puce q-bord q-en-' + m }, cote === 're' ? svgDe(I.bord) : null, picto(o.f, 12), 'visée', cote === 'fl' ? svgDe(I.bord) : null)
        : h('span', { class: 'q-puce q-en-' + m, style: '--p:' + pc(p) }, picto(o.f, 12), 'visée')));
    };
    return h('div', { class: 'q-tetes', 'aria-hidden': 'true' },
      h('div', { class: 'q-m q-re' }, h('i', { class: 'q-axe q-g-ax' }), objs.filter((o) => o.sens < 0).flatMap((o) => puce(o, 're'))),
      h('div', { class: 'q-g' }),
      h('div', { class: 'q-m q-fl' }, h('i', { class: 'q-axe q-d-ax' }), objs.filter((o) => o.sens > 0).flatMap((o) => puce(o, 'fl'))));
  }

  /* ---------- une case par famille : picto et jauge (un trait par cran du style) ---------- */
  function jauge(c, hors) {
    const n = c == null || Math.abs(c) < 0.5 ? 0 : Math.min(4, Math.round(Math.abs(c)));
    return h('span', { class: 'q-jg' + (c < 0 ? ' q-bas' : '') + (hors ? ' q-xs' : '') }, n ? Array.from({ length: n }, () => h('i')) : h('i', { class: 'q-pt' }));
  }
  function caseObj(v, o) {
    const e = v.dir[o.f];
    if (e == null) { const t = D.long[o.f] + ' : effet non établi'; return h('span', { class: 'q-cf q-o q-ne', 'data-famille': o.f, role: 'img', 'aria-label': t, title: t }, picto(o.f), h('span', { class: 'q-jg q-jg-ne' }, h('i'))); }
    const c = cransObj(v, o.f), n = niv(v, o.f, e), hs = v.hs.includes(o.f);
    const t = D.long[o.f] + ' ' + sg(e) + ' (' + crTxt(c) + ') · ' + NIVMOT[n] + (hs ? ' · hors du style' : '');
    return h('span', { class: 'q-cf q-o q-' + n + (e < 0 ? ' q-moins' : ''), 'data-famille': o.f, 'data-crans': c, role: 'img', 'aria-label': t, title: t }, picto(o.f), jauge(c, hs));
  }
  function caseExtra(v, f) {
    const x = toutDe(v, f);
    if (!x || Math.abs(x.e) < 0.5) return h('span', { class: 'q-cf q-vide', 'aria-hidden': 'true' });
    const n = niv(v, f, x.e), hs = v.hs.includes(f);
    const t = D.long[f] + ' ' + sg(x.e) + ' (' + crTxt(x.c) + ') · ' + NIVMOT[n] + (hs ? ' · hors du style' : '');
    return h('span', { class: 'q-cf q-' + n + (x.e < 0 ? ' q-moins' : ''), 'data-role': 'extra', 'data-famille': f, 'data-crans': x.c, role: 'img', 'aria-label': t, title: t }, picto(f), jauge(x.c, hs));
  }
  const extras = (v, objs) => v.tout.filter((t) => !objs.some((o) => o.f === t.f) && Math.abs(t.e) >= 0.5).map((t) => t.f);
  const slotsDe = (vs, objs) => D.ordre.filter((f) => vs.some((v) => extras(v, objs).includes(f)));

  /* La biotransformation (dry hop en fermentation active), lisible sans survol : bio, puis chaque signal
     par les pictos de son effet (floral → agrumes ; tropical, baies) et le hop creep par son mot. */
  function bioEl(v) {
    const b = v.bio;
    if (!b) return null;
    const de = (id) => b.signaux.find((s) => s.id === id);
    const pf = (f) => picto(f, 14, true);
    const t = (s) => s.titre + ' (' + s.statut + ')';
    const g = de('geraniol-citronellol'), th = de('thiols'), hc = de('hop-creep');
    return h('details', { class: 'q-bio', 'data-role': 'bio', open: st.bio[v.rang] || null, ontoggle: (e) => { st.bio[v.rang] = e.currentTarget.open; } },
      h('summary', { 'data-k': 'qb' + v.rang, 'aria-label': 'Biotransformation possible, ampleur non quantifiée : ' + b.signaux.map(t).join(' ; ') },
        h('span', { class: 'q-bio-m' }, 'bio'),
        g ? h('span', { class: 'q-bt', title: t(g) }, pf('floral'), svgDe(I.fleche), pf('citrus')) : null,
        th ? h('span', { class: 'q-bt', title: t(th) }, pf('tropical'), pf('berries')) : null,
        hc ? h('span', { class: 'q-bt q-mot', title: t(hc) }, svgDe(I.bulles), h('span', {}, 'creep')) : null),
      h('ul', {}, b.signaux.map((s) => h('li', {}, h('b', {}, s.titre), ' · ' + s.statut + '. ', h('span', { class: 'q-src' }, s.pourquoi)))));
  }

  /* Le « + » : les houblons de la voie entrent dans Comparer (ETAT.comp) ; ✓ les retire. Comparer en
     montre 4 au plus : un ajout au-delà remplace le plus ancien houblon de la liste qui n'est ni dans
     ma recette (la référence de Comparer) ni dans la voie ; l'aide du bouton le nomme. */
  const nomsComp = (v) => nomsDe(v).filter((n) => D.fichesH[cleDe(n)]);
  const nComp = () => ETAT.comp.filter((n) => D.fichesH[cleDe(n)]).length;
  function avecVoie(ns) {
    const recette = new Set(ETAT.lignes.map((l) => l.nom));
    const manque = ns.filter((n) => !ETAT.comp.includes(n)), garde = ETAT.comp.filter((n) => D.fichesH[cleDe(n)]);
    while (garde.length + manque.length > 4) {
      let k = garde.findIndex((n) => !ns.includes(n) && !recette.has(n));
      if (k < 0) k = garde.map((n) => !ns.includes(n)).lastIndexOf(true);
      if (k < 0) break;
      garde.splice(k, 1);
    }
    return [...garde, ...manque];
  }
  function ajc(v, booster) {
    const ns = nomsComp(v);
    if (!ns.length) return h('button', { class: 'q-ajc', 'data-role': 'ajouter-comparer', 'aria-pressed': 'false', disabled: true, 'aria-label': 'Comparer : aucun houblon dans cette voie' + (v.levureVers ? ' (changement de levure)' : '') });
    const on = ns.every((n) => ETAT.comp.includes(n)), lib = ns.join(' et ');
    const sort = on ? [] : ETAT.comp.filter((n) => !avecVoie(ns).includes(n));
    return h('button', {
      class: 'q-ajc', 'data-role': 'ajouter-comparer', 'data-k': 'qc' + v.rang, 'data-booster': booster || null, 'aria-pressed': String(on),
      'aria-label': on ? 'Retirer ' + lib + ' de la comparaison' : 'Ajouter ' + lib + ' à la comparaison' + (sort.length ? ', à la place de ' + sort.join(' et ') + ' (4 au plus)' : ''),
      onclick: () => { ETAT.comp = on ? ETAT.comp.filter((n) => !ns.includes(n)) : avecVoie(ns); rendre(false); },
    });
  }

  /* Une voie : l'usage, le nom, la dose, le stock, le goût, le « + » ; puis ses cases et sa biotransformation. */
  function ligne(v, slots, objs, o) {
    const d = doseTxt(v), noms = nomsDe(v);
    return h('div', { class: 'q-vr' + (o.coupe ? ' q-coupe' : ''), 'data-voie': v.rang, role: 'group', 'aria-label': v.label.replace(/\./g, ',') },
      h('div', { class: 'q-l1' },
        v.fichesV.length ? h('span', { class: 'q-uss' }, v.fichesV.map(usage)) : null,
        h('b', { class: 'q-nom' }, v.levureVers ? v.levureVers : nomsHoublons(noms)),
        h('span', { class: 'q-gr' }, d && d !== o.dose ? h('span', { class: 'q-q' }, d) : null, stockMarque(v)),
        h('span', { class: 'q-act' }, noms.length ? goutBouton(noms[0], 'q' + v.rang, o.premier ? 'goût voie' : null) : null, ajc(v, o.premier ? 'ajouter à comparer' : null))),
      h('div', { class: 'q-l2' },
        h('span', { class: 'q-cases' }, h('span', { class: 'q-objs' }, objs.map((x) => caseObj(v, x))), slots.length ? h('span', { class: 'q-exs' }, slots.map((f) => caseExtra(v, f))) : null),
        bioEl(v)));
  }

  /* Le geste d'une voie seule, écrit une fois au-dessus de ses lignes. */
  function geste(v) {
    const a = v.actionsP[0] || {};
    if (v.levureVers) return ['Changer de levure'];
    if (v.type === 'assemblage') return ['Assembler'];
    if (v.type === 'diminuer') return ['Diminuer'];
    if (a.avantNom) return ['Remplacer ', h('span', { 'data-houblon': cleDe(a.avantNom) }, a.avantNom)];
    if (/^dry/.test(a.moment || '')) return ['Dry hop'];
    return [v.verbe];
  }
  const cleGeste = (v) => geste(v).map((x) => (typeof x === 'string' ? x : x.textContent)).join('') + '|' + momentDe(v);
  // Les voies voisines au même effet sur les objectifs (au dixième de point, l'un au moins établi) et au
  // même moment font un groupe ; deux voies sans aucun effet établi n'ont pas « le même effet ».
  const cleEffet = (v, objs) => (objs.some((o) => v.dir[o.f] != null) ? objs.map((o) => (v.dir[o.f] == null ? 'ne' : r1(v.dir[o.f]))).join('|') + '|' + momentDe(v) : null);
  function blocs(vs, objs) {
    const out = [];
    for (const v of vs) {
      const k = cleEffet(v, objs), der = out[out.length - 1];
      if (k && der && der.k === k) der.voies.push(v); else out.push({ k, voies: [v] });
    }
    // Les voies seules voisines, au même geste et au même moment, partagent leur en-tête.
    const res = [];
    for (const b of out) {
      if (b.voies.length > 1) { res.push({ meme: true, voies: b.voies }); continue; }
      const der = res[res.length - 1], g = cleGeste(b.voies[0]);
      if (der && !der.meme && der.g === g) der.voies.push(b.voies[0]); else res.push({ meme: false, g, voies: b.voies });
    }
    return res;
  }
  function blocEl(b, objs, k, premier) {
    const vs = b.voies, slots = slotsDe(vs, objs), mo = momentDe(vs[0]);
    const doses = vs.map(doseTxt), dose = doses.find((d, i) => d && doses.indexOf(d) !== i) || (vs.length === 1 ? '' : null);
    const est = vs.every((v) => v.estime);
    if (b.meme) {
      const sig = (v) => extras(v, objs).join();
      return [
        h('div', { class: 'q-groupe' }, h('span', { class: 'q-t' }, svgDe(I.egal), k ? 'même effet' : 'même effet sur tes objectifs'), dose ? h('span', { class: 'q-q' }, dose) : null, pill(mo), est ? h('span', { class: 'q-est' }, 'estimé') : null),
        h('div', { class: 'q-rangee' }, couloirs(vs[0], objs, true)),
        h('div', { class: 'q-tab' }, vs.map((v, i) => ligne(v, slots, objs, { dose, coupe: i && sig(vs[i - 1]) !== sig(v), premier: premier && !i }))),
      ];
    }
    return [
      h('div', { class: 'q-groupe' }, h('span', { class: 'q-t' }, geste(vs[0])), pill(mo), est ? h('span', { class: 'q-est' }, 'estimé') : null),
      ...vs.map((v, i) => h('div', { class: 'q-tab q-seul' }, ligne(v, slots, objs, { dose: null, premier: premier && !i }), h('div', { class: 'q-rangee q-in' }, couloirs(v, objs, false)))),
    ];
  }

  /* ---------- la réponse par objectif, en tuile ---------- */
  const MOT = { atteint: 'Atteint', approche: 'Approche', aucune: 'Aucune' };
  const txtT = (x) => (x.e > 0 ? '+' + virgule(x.e, 1) + ' T' : String(Math.round(x.v)));
  function cible(o, r) {
    const w = 64, frac = (r.B.v - r.A.v) / ((o.visee - r.A.v) || 1), x = Math.round(w / 1.15), b = Math.round(Math.max(0, Math.min(1, frac / 1.15)) * w);
    const s = sv('svg', { class: 'q-cible', width: w, height: 22, viewBox: '0 0 ' + w + ' 22', 'aria-hidden': 'true' });
    sv('rect', { x: 0, y: 7, width: w, height: 8, rx: 4, fill: '#fff' }, s);
    sv('rect', { x: 0, y: 7, width: b, height: 8, rx: 4, class: 'q-cb' }, s);
    sv('line', { x1: x, y1: 1, x2: x, y2: 21, stroke: '#111', 'stroke-width': 2, 'stroke-dasharray': '4 3' }, s);
    return s;
  }
  function tuile(o) {
    const r = SUGG.reponse(o), f = o.f, nom = (o.sens > 0 ? 'Plus ' : 'Moins ') + D.court[f].toLowerCase();
    const trop = !!(r.A && r.A.e > 0), hh = r.verdict === 'aucune' && D.sugg.horsModele.length && D.horsModeleFam === f;
    const aide = nom + ' : ' + (r.verdict === 'aucune' ? 'aucune voie houblon ne le change assez' : r.verdict === 'atteint' ? 'la visée est atteinte' : 'la meilleure voie s\'en approche')
      + (r.A ? ' ; ma bière ' + txtT(r.A) + (trop ? ', au-dessus du style' : '') : '') + (r.B ? ', au mieux ' + txtT(r.B) + ' (' + r.voie.label.replace(/\./g, ',') + ')' : '') + ' ; visée ' + Math.round(o.visee);
    return h('section', { class: 'q-tuile f-' + f, 'data-role': 'objectif', 'data-famille': f, 'aria-label': aide },
      h('span', { class: 'q-tn' }, h('span', { class: 'q-pa' }, picto(f, 18), trop ? h('i', { class: 'q-alerte' }) : null), nom),
      h('div', { class: 'q-tr' },
        h('div', { class: 'q-rep q-v-' + r.verdict, 'data-role': 'reponse', 'data-famille': f, 'data-verdict': r.verdict }, MOT[r.verdict], r.verdict === 'aucune' ? h('small', {}, 'voie houblon') : null),
        hh ? h('button', { class: 'q-hh-b', 'data-k': 'qhh', 'data-booster': 'hors houblon', 'aria-controls': 'q-hh', 'aria-expanded': String(st.hh), 'aria-label': 'Pistes hors houblon (' + D.sugg.horsModele.length + ')',
          onclick: () => { st.hh = true; const d = document.getElementById('q-hh'); if (d) { d.open = true; d.scrollIntoView({ block: 'nearest', behavior: REDUIT ? 'auto' : 'smooth' }); } } }, 'Hors houblon')
          : r.B ? cible(o, r) : null));
  }

  /* Les détails, au bout de la liste : l'IBU après chaque voie, les pistes hors houblon. */
  function details(vs) {
    const hm = D.sugg.horsModele;
    return [
      h('details', { class: 'q-det', open: st.ibu || null, ontoggle: (e) => { st.ibu = e.currentTarget.open; } },
        h('summary', { 'data-k': 'qibu', 'aria-label': 'IBU après chaque voie ; ma bière ' + Math.round((vs[0] || {}).ibuAvant ?? ibuTotal()) + ', style ' + D.ibuStyle.join(' à ') }, 'IBU après chaque voie · style ' + D.ibuStyle.join('–')),
        h('ul', { class: 'q-ibus' }, vs.map((v) => h('li', {}, h('span', {}, nomTexte(v) + ' · ' + momentTexte(momentDe(v))[0]), h('b', {}, virgule(v.ibuApres, 1)))))),
      hm.length ? h('details', { class: 'q-det', id: 'q-hh', open: st.hh || null, ontoggle: (e) => { st.hh = e.currentTarget.open; } },
        h('summary', { 'data-k': 'qhhd' }, 'Hors houblon · ' + D.court[D.horsModeleFam].toLowerCase() + ' (' + hm.length + ' pistes)'),
        h('ul', {}, hm.map((x) => h('li', {}, h('b', {}, x.titre), ' : ' + x.action.charAt(0).toLowerCase() + x.action.slice(1) + ' ', h('span', { class: 'q-src' }, x.preuve))))) : null,
    ];
  }

  function partie(part) {
    const neuf = part.classList.contains('entre');
    part.classList.add('q2b');
    if (ETAT.echelle === 'absolu') part.classList.add('q-abs');
    const objs = objectifs();
    part.append(h('div', { class: 'q-outils' }, echelleSeg(), lentille()));
    if (!objs.length) { part.append(h('p', { class: 'rangee gris' }, D.notes.voies || 'Une direction ouvre les voies du moteur.')); return; }
    // Mes goûts : une variété exclue retire ses voies (le moteur, voiesSansHoublon).
    const ex = [...ETAT.gouts.exclut], retirees = new Set(ex.flatMap((n) => (D.sansHoublon[n] ? D.sansHoublon[n].retirees : [])));
    let vs = D.voies.filter((v) => !retirees.has(v.rang) && !v.houblons.some((n) => ETAT.gouts.exclut.has(n)));
    // Une direction retirée dans Ma bière, ou un lien de Ma bière : seulement les voies qui servent l'objectif.
    const sert = (v, o) => v.dir[o.f] != null && Math.sign(v.dir[o.f]) === o.sens;
    const filtre = ETAT.filtreVoies && objs.find((o) => o.f === ETAT.filtreVoies);
    if (filtre) vs = vs.filter((v) => sert(v, filtre));
    else if (objs.length < (D.dirPack || []).length) vs = vs.filter((v) => objs.some((o) => sert(v, o)));
    const g = goutsLigne();
    if (g || filtre) part.append(h('div', { class: 'q-filtres' }, filtre ? h('button', { class: 'chip sel', 'data-k': 'qfiltre', 'aria-label': 'Montrer toutes les voies', onclick: () => { ETAT.filtreVoies = null; rendre(false); } }, D.court[filtre.f] + ' seulement ×') : null, g));
    part.append(h('div', { class: 'q-reps' }, objs.map(tuile)));
    const bs = blocs(vs, objs);
    part.append(h('div', { class: 'q-graph' }, fonds(objs), tetes(objs), bs.flatMap((b, k) => blocEl(b, objs, k, !k))));
    const nouvelles = ex.length === 1 && D.sansHoublon[ex[0]] ? D.sansHoublon[ex[0]].nouvelles : [];
    // Sans cette variété, le moteur ouvre d'autres voies ; le pack n'en donne que le nom, pas l'effet.
    if (nouvelles.length) part.append(h('p', { class: 'q-nouv gris' }, 'Sans ' + ex[0] + ', le moteur ouvre ' + nouvelles.length + ' autre' + (nouvelles.length > 1 ? 's' : '') + ' voie' + (nouvelles.length > 1 ? 's' : '') + ', effet non établi ici'));
    part.append(...details(vs).filter(Boolean));
    const n = nComp();
    part.append(h('button', { class: 'q-cmp', 'data-role': 'comparer', 'data-k': 'qcmp', 'data-booster': 'vers comparer', 'aria-label': 'Comparer les ' + n + ' houblons choisis', disabled: n < 2 || null, onclick: () => ouvrir('comparer') }, 'Comparer ', h('b', {}, '(' + n + ')')));
    LENTILLE_CB = () => anime(140, (k) => { part.style.opacity = 1 - k; }, () => { part.style.opacity = 1; rendre(false); });
    // Le défilement reste où il était quand l'écran se redessine (un « + », un goût) ; à zéro en entrant.
    part.scrollTop = neuf ? 0 : st.scroll;
    part.addEventListener('scroll', () => { st.scroll = part.scrollTop; }, { passive: true });
  }
  return { ok, partie };
})();
/* La partie Suggestions : q2b en Barres, p10 en Radar (SUGG) ; sans les champs de q2b, la base d'avant. */
const partieSuggestionsAvant = partieSuggestions;
partieSuggestions = function (part) {
  if (ETAT.lentille !== 'radar' && Q2B.ok()) { Q2B.partie(part); return; }
  partieSuggestionsAvant(part);
};
