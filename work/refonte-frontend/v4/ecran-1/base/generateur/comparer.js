/* Comparer, base v4.6 (choix du brasseur, 19.10 : « Comparé: p06 » ; « Comparé : radar p2 mais avec
   ajoute d'intervalle de confiance ») : le lot 6 en fidélité (fils6-comparer/p06 pour les Barres, p02
   pour le Radar), sur les pièces du lot 5a (p03 : bandes, barres-plages, gestes ; D51, D53, D57 à D59).
   Une bande par houblon (rôle, IBU dans ma recette et sa plage, dose pour remplacer ma ligne et sa
   plage, IBU face à la bande du style) ; en Barres, la matrice p06 (12 familles × houblons, teinte du
   niveau, une pastille par fiche) ; en Radar, le radar commun (RADAR.houblons) avec son intervalle ;
   puis α, β et huiles en barres-plages (centre, mon lot, sources) ; le détail des huiles et les
   descripteurs à un toucher.
   Sans légende (19.10, sur m4 et h4) : la couleur de chaque houblon est celle de sa bande, chaque
   marque se nomme sur place (« lot 13 », « article 5,5 ») et le reste se dit au toucher.
   Aucun chiffre inventé : réunions des sources des fiches, IBU et doses rapportés à l'α de mon lot
   (l'IBU par gramme des fiches est proportionnel à α), et ces produits. */
const COMPARER = (() => {
  // Okabe et Ito : bleu, vert bleuté, pourpre, bleu ciel ; loin de l'alerte, distincts en daltonisme.
  const PALETTE = ['#0072B2', '#009E73', '#CC79A7', '#56B4E9'];
  const COUL = {};
  const couleur = (nom) => { if (!COUL[nom]) { const pris = new Set(Object.values(COUL)); COUL[nom] = PALETTE.find((c) => !pris.has(c)) || PALETTE[0]; } return COUL[nom]; };
  const F = (nom) => D.fichesH[cleDe(nom)] || null;
  const lesNoms = () => ETAT.comp.filter((n) => F(n)).slice(0, 4);
  // Nom court (« East Kent ») ; le nom entier reste dans la fiche et l'aide.
  const bref = (nom) => { const n = nom.replace(/\s*\(.*\)\s*$/, ''); const m = n.split(' '); return n.length > 12 ? (m.length > 2 ? m.slice(0, 2).join(' ') : m[0]) : n; };
  const nb = (v) => virgule(v, Math.abs(v) < 1 ? 2 : 1);
  const pl = (a, b) => (Math.abs(a - b) < 1e-9 ? nb(a) : nb(a) + '–' + nb(b));
  const ent = (a, b) => (Math.round(a) === Math.round(b) ? String(Math.round(a)) : Math.round(a) + '–' + Math.round(b));
  const r2 = (v) => Math.round(v * 100) / 100;
  const union = (arr) => (arr && arr.length ? [Math.min(...arr.map((s) => s.min)), Math.max(...arr.map((s) => s.max))] : null);
  // Le centre (D57) : la moyenne des milieux des sources, comme le trait fin de Beer Maverick.
  const milieu = (arr) => (arr && arr.length ? arr.reduce((s, x) => s + (x.min + x.max) / 2, 0) / arr.length : null);
  const pc = (v, ech) => Math.max(0, Math.min(100, (v / ech) * 100)).toFixed(2) + '%';

  /* Les mesures du plancher Beer Maverick, chaque source avec son année (D53). */
  const MES = {
    alpha: { titre: 'α', long: 'acides alpha, %', src: (f) => f.alpha },
    beta: { titre: 'β', long: 'acides bêta, %', src: (f) => f.beta },
    huiles: { titre: 'huiles', long: 'huiles totales, mL pour 100 g', src: (f) => f.huiles },
  };
  const plage = (nom, m) => { const f = F(nom); return f ? union(MES[m].src(f)) : null; };
  const PAS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100, 120, 150];
  const pasRond = (v) => PAS.find((p) => p >= v * 1.04) || Math.ceil(v);
  const echelle = (m, ns) => pasRond(Math.max(0.5, ...ns.map((n) => plage(n, m)).filter(Boolean).map((p) => p[1])));

  /* Ma ligne de recette, celle que l'on cherche à remplacer (Nugget, 46 g à 60′). */
  const ORIG = {};
  for (const l of ETAT.lignes) ORIG[l.cle] = { ...l };
  function ref() {
    if (ETAT.cRefId == null) ETAT.cRefId = (ETAT.lignes.find((l) => ETAT.comp.includes(l.nom) && mom(l.moment).type !== 'à froid') || ETAT.lignes.find((l) => mom(l.moment).type !== 'à froid') || {}).id;
    return ETAT.lignes.find((l) => l.id === ETAT.cRefId) || null;
  }
  /* IBU de ce houblon au moment et à la dose de ma ligne : tables du pack (sa ligne, sinon son ajout
     proposé), sinon IBU par gramme de sa fiche × dose. */
  function ibu(nom, code, g) {
    const cle = cleDe(nom), l = ligneDe(cle), r = l ? null : rapideDe(cle);
    const base = l || (r ? { ...r, ibu0: null, wpT: 80, wpMin: 20, jour: 3 } : null);
    if (base) { const v = ibuLigne({ ...base, moment: code, g }); if (typeof v === 'number') return v; }
    const f = F(nom), pg = f && f.ibuPG[code];
    return pg == null ? null : pg * g;
  }
  /* Dose pour remplacer ma ligne à IBU égal : IBU de ma ligne ÷ IBU par gramme du candidat. */
  function dose(nom, r) {
    const cible = r ? ibuLigne(r) : null, pg = r ? ibu(nom, r.moment, 1) : null;
    return typeof cible === 'number' && cible > 0 && pg > 0 ? cible / pg : null;
  }
  /* Un autre lot : la plage d'α des fiches rapportée à l'α de mon lot (IBU ∝ α ; la dose à IBU égal
     ∝ 1/α). Sans α de référence, pas de plage. */
  const rapportsAlpha = (nom) => { const f = F(nom), u = f && union(f.alpha), a = f && f.alphaRef; return u && a ? { bas: u[0] / a, haut: u[1] / a, centre: milieu(f.alpha) / a } : null; };

  /* Gestes : remplacer ma ligne (même moment, dose équivalente), retirer, ajouter. */
  function remplacer(nom) {
    const r = ref(), d = dose(nom, r);
    if (!r || !d) return;
    const cle = cleDe(nom), g = Math.round(d), f = F(nom), rp = rapideDe(cle), o = ORIG[cle];
    const neuve = o ? { ...o, id: r.id, moment: r.moment, g, jour: r.jour }
      : { ...r, cle, nom, g, alpha: rp ? rp.alpha : f.alphaRef != null ? { v: f.alphaRef } : null, role: rp ? rp.role : f.role ? f.role.v : null,
        ibuPG: { ...f.ibuPG }, tab: rp ? rp.tab : null, ibu0: { moment: r.moment, g, v: null }, libre: rp ? rp.libre : 0, achat: false, citation: null, fiche: D.fiches[nom] || r.fiche, signaux: [], ramene: false };
    ETAT.lignes = ETAT.lignes.map((l) => (l === r ? neuve : l));
    rendre(true);
  }
  function retirer(nom) {
    if (lesNoms().length <= 2) return;
    ETAT.comp = ETAT.comp.filter((x) => x !== nom);
    delete COUL[nom];
    if (ETAT.focusSerie === nom) ETAT.focusSerie = null;
    if (ETAT.cOuvert && ETAT.cOuvert.startsWith(nom + ':')) ETAT.cOuvert = null;
    rendre(false);
  }
  /* Candidats : les remplaçants calculés de ma ligne d'abord (fiche), puis ce que j'ai en stock. */
  function candidats(ns) {
    const r = ref(), f = r ? F(r.nom) : null;
    const subs = f ? (f.subsCalc || []).filter((n) => F(n)) : [];
    const stock = D.candidats.filter(([n, g]) => g === 'stock' && F(n)).map(([n]) => n);
    return [...new Set([...subs, ...stock])].filter((n) => !ns.includes(n)).slice(0, 4);
  }
  function ajouter(nom) { if (!ETAT.comp.includes(nom)) ETAT.comp.push(nom); ETAT.cChoix = false; couleur(nom); rendre(false); }

  /* ---------- Pièces ---------- */
  const nomEl = (nom) => h('b', { class: 'c-nom', 'data-houblon': cleDe(nom), title: nom }, bref(nom));
  function roleEl(nom) {
    const f = F(nom), r = f && f.role;
    if (!r) return null;
    const t = r.v === 'double' ? 'double' : ROLE_MOT[r.v] || r.v, regle = /^règle/.test(r.src || '');
    return h('span', { class: 'c-role' + (regle ? ' regle' : ''), 'data-role': 'role', 'data-houblon': nom, title: r.src || '', 'aria-label': 'Rôle : ' + t + (r.src ? ', ' + r.src : '') }, t);
  }
  function alphaEl(nom) {
    const f = F(nom), u = union(f.alpha), t = f.lot != null ? nb(f.lot) : u ? pl(u[0], u[1]) : '?';
    return h('span', { class: 'c-alpha' + (f.lot != null ? ' lot' : ''), 'data-role': 'alpha', 'data-houblon': nom, 'aria-label': 'Acides alpha ' + t + ' %' + (f.lot != null ? ', mon lot' : ', plage des fiches') },
      h('span', { class: 'c-grec', 'aria-hidden': 'true' }, 'α'), h('b', {}, t));
  }
  /* L'IBU dans ma recette et sa plage avec un autre lot (petit, sous la valeur). */
  function ibuEl(nom, r) {
    const v = r ? ibu(nom, r.moment, r.g) : null, ra = rapportsAlpha(nom), vr = v != null ? Math.round(v) : null;
    const lo = vr != null && ra ? vr * ra.bas : null, hi = vr != null && ra ? vr * ra.haut : null;
    return h('span', { class: 'c-ibu', 'data-role': 'ibu-recette', 'data-houblon': nom, 'data-moment': r ? r.moment : '', 'data-grammes': r ? r.g : '', 'data-min': lo != null ? Math.round(lo) : null, 'data-max': hi != null ? Math.round(hi) : null,
      'aria-label': v == null ? 'IBU non calculable' : ibuTexte(v) + ' IBU à ' + grammes(r.g) + ', ' + quandLong(r) + (lo != null ? ' ; ' + ent(lo, hi) + ' avec un autre lot' : '') },
    v == null ? 'IBU ?' : ibuTexte(v) + ' IBU');
  }
  /* Ma ligne porte sa dose ; un autre houblon, la dose qui la remplace à IBU égal (un toucher remplace). */
  function doseEl(nom, r, booster) {
    if (!r) return null;
    const ra = rapportsAlpha(nom);
    if (r.nom === nom) {
      const lo = ra ? r.g / ra.haut : null, hi = ra ? r.g / ra.bas : null;
      return h('span', { class: 'c-recette', 'data-min': lo != null ? Math.round(lo) : null, 'data-max': hi != null ? Math.round(hi) : null, 'aria-label': 'Dans ma recette : ' + grammes(r.g) + ', ' + quandLong(r) + (lo != null ? ' ; ' + ent(lo, hi) + ' g pour les mêmes IBU avec un autre lot' : '') },
        h('span', { class: 'c-rl' }, h('b', {}, grammes(r.g)), h('span', { class: 'c-sep' }), h('b', {}, quand(r))), lo != null ? h('small', { class: 'b-pl' }, ent(lo, hi)) : null);
    }
    const d = dose(nom, r);
    if (d == null) return h('span', { class: 'c-dose ne' }, 'dose ?');
    const lo = ra ? Math.round(d) / ra.haut : null, hi = ra ? Math.round(d) / ra.bas : null;
    return h('button', {
      class: 'c-dose', 'data-action': 'remplacer', 'data-role': 'dose-equivalente', 'data-houblon': nom, 'data-moment': r.moment, 'data-min': lo != null ? Math.round(lo) : null, 'data-max': hi != null ? Math.round(hi) : null, 'data-booster': booster ? 'remplacer' : null, 'data-k': 'cr' + nom,
      'aria-label': 'Remplacer ' + r.nom + ' par ' + nom + ' : ' + Math.round(d) + ' g à ' + quand(r) + ' pour ' + ibuTexte(ibuLigne(r)) + ' IBU' + (lo != null ? ' ; ' + ent(lo, hi) + ' g avec un autre lot' : ''),
      onclick: (e) => { e.stopPropagation(); remplacer(nom); },
    }, h('span', {}, Math.round(d) + ' g'), lo != null ? h('small', { class: 'b-pl' }, ent(lo, hi)) : null);
  }
  /* L'IBU de ce houblon face à la bande d'IBU du style (pointillé), sur une piste commune aux bandes :
     la plage avec un autre lot, son centre, mon lot. */
  function pisteIbu(nom, r, ech) {
    const v = r ? ibu(nom, r.moment, r.g) : null, ra = rapportsAlpha(nom), c = couleur(nom);
    if (v == null) return null;
    const lo = ra ? v * ra.bas : v, hi = ra ? v * ra.haut : v, [s0, s1] = D.ibuStyle;
    return h('span', { class: 'b-ibu', title: D.code + ' : ' + s0 + '–' + s1 + ' IBU', 'aria-hidden': 'true' }, h('span', { class: 'b-tr' },
      h('i', { class: 'b-st', 'data-role': 'bande-style', 'data-mesure': 'ibu', 'data-min': s0, 'data-max': s1, style: 'left:' + pc(s0, ech) + ';width:calc(' + pc(s1, ech) + ' - ' + pc(s0, ech) + ')' }),
      lo > 0 ? h('i', { class: 'pl-pale', style: 'width:' + pc(lo, ech) + ';background:' + c }) : null,
      h('i', { class: 'pl-seg', style: 'left:' + pc(lo, ech) + ';width:calc(' + pc(hi, ech) + ' - ' + pc(lo, ech) + ');background:' + c }),
      ra ? h('i', { class: 'pl-cen', 'data-role': 'central', 'data-valeur': r2(v * ra.centre), style: 'left:' + pc(v * ra.centre, ech) }) : null));
  }
  function retirerEl(nom, n) {
    return h('button', { class: 'c-x', 'data-action': 'retirer', 'data-houblon': nom, 'data-k': 'cx' + nom, disabled: n <= 2 || null, 'aria-label': 'Retirer ' + nom + ' de la comparaison', onclick: (e) => { e.stopPropagation(); retirer(nom); } });
  }
  function ajouterEl(ns) {
    return h('button', { class: 'c-plus', 'data-action': 'ajouter-comparaison', 'data-booster': 'ajouter au comparatif', 'data-k': 'c+', 'aria-expanded': String(!!ETAT.cChoix), disabled: ns.length >= 4 || null,
      'aria-label': 'Ajouter un houblon à la comparaison (remplaçants de ma ligne, stock)', onclick: () => { ETAT.cChoix = !ETAT.cChoix; rendre(false); } });
  }
  function choixEl(ns) {
    if (!ETAT.cChoix) return null;
    return h('div', { class: 'chips c-choix', role: 'group', 'aria-label': 'Houblons à ajouter' }, candidats(ns).map((n) => h('button', { class: 'chip ajt', 'data-k': 'ca' + n, 'aria-label': 'Comparer aussi ' + n, onclick: () => ajouter(n) }, h('span', { 'data-houblon': cleDe(n) }, n))));
  }

  /* Une barre-plage (D53, D57) : piste commune à la mesure, pâle de 0 au bas, segment de la réunion
     des sources dans la couleur du houblon, trait du centre, mon lot (▼ fiche de stock, ▽ article)
     nommé sur place ; chaque source en trait fin dessous ; le nom et la plage écrits. */
  function barre(nom, m, ech, premier, booster) {
    const f = F(nom), p = plage(nom, m);
    if (!p) return null;
    const [lo, hi] = p, c = couleur(nom), M = MES[m], src = M.src(f), cen = milieu(src);
    const lotV = m === 'alpha' ? f.lot : null, cle = nom + ':' + m, ouvert = ETAT.cOuvert === cle;
    const motLot = lotV == null ? null : (f.lotOrigine === 'article' ? 'article ' : 'lot ') + nb(lotV);
    const gauche = lotV != null && lotV / ech > 0.62;
    const piste = h('span', { class: 'pl-piste', 'data-role': 'piste' },
      lo > 0 ? h('i', { class: 'pl-pale', style: 'width:' + pc(lo, ech) + ';background:' + c }) : null,
      h('i', { class: 'pl-seg', 'data-role': 'segment', style: 'left:' + pc(lo, ech) + ';width:calc(' + pc(hi, ech) + ' - ' + pc(lo, ech) + ');background:' + c }),
      ...src.map((s, k) => h('i', { class: 'pl-src', title: s.src + (s.an ? ' ' + s.an : '') + ' : ' + pl(s.min, s.max), style: 'left:' + pc(s.min, ech) + ';width:calc(' + pc(s.max, ech) + ' - ' + pc(s.min, ech) + ');top:' + (11 + k * 3) + 'px' })),
      cen != null ? h('i', { class: 'pl-cen', 'data-role': 'central', 'data-valeur': r2(cen), style: 'left:' + pc(cen, ech) }) : null,
      lotV != null ? h('i', { class: 'pl-lot', 'data-role': 'lot', 'data-valeur': lotV, 'data-origine': f.lotOrigine || 'stock', style: 'left:' + pc(lotV, ech) }, h('span', { class: 'pl-lot-t' + (gauche ? ' g' : '') }, motLot)) : null);
    const ligne = h('button', {
      class: 'pl c-r' + (ouvert ? ' ouvert' : '') + (lotV != null ? ' lot-l' : ''), 'data-plage': '', 'data-mesure': m, 'data-houblon': nom, 'data-min': r2(lo), 'data-max': r2(hi), 'data-echelle-max': ech, 'data-central': cen != null ? r2(cen) : null,
      'aria-expanded': String(ouvert), 'data-k': 'cr-' + cle, 'data-booster': booster ? 'déplier une rangée' : null,
      'aria-label': nom + ', ' + M.long + ' : ' + pl(lo, hi) + (cen != null ? ', centre ' + nb(cen) : '') + (motLot ? ', ' + (f.lotOrigine === 'article' ? 'lu sur l\'article ' : 'mon lot ') + nb(lotV) : '') + ' (réunion de ' + src.length + ' source(s), échelle 0 à ' + ech + ') ; toucher pour ' + (ouvert ? 'replier' : 'voir') + ' les sources',
      onclick: () => { ETAT.cOuvert = ouvert ? null : cle; rendre(false); },
    }, h('span', { class: 'r-mes' }, premier ? h('b', { title: M.long, class: M.titre.length > 3 ? 'long' : null }, M.titre) : null),
      h('span', { class: 'pl-nom' }, bref(nom)),
      m === 'alpha' ? h('span', { class: 'pl-v', 'data-role': 'alpha', 'data-houblon': nom }, pl(lo, hi)) : h('span', { class: 'pl-v' }, pl(lo, hi)), piste);
    if (!ouvert) return ligne;
    const apres = (s) => s.max / ech < 0.72;
    return [ligne, h('div', { class: 'c-det', role: 'group', 'aria-label': 'Sources de ' + nom + ', ' + M.long }, src.map((s) => h('div', { class: 'd-l' },
      h('span', { class: 'd-src' }, s.src + (s.an ? ' ' + s.an : '')),
      h('span', { class: 'd-piste' }, h('i', { class: 'd-seg', style: 'left:' + pc(s.min, ech) + ';width:calc(' + pc(s.max, ech) + ' - ' + pc(s.min, ech) + ');background:' + c }),
        h('span', { class: 'd-v', style: apres(s) ? 'left:calc(' + pc(s.max, ech) + ' + 6px)' : 'right:calc(100% - ' + pc(s.min, ech) + ' + 6px)' }, pl(s.min, s.max))))))];
  }
  function groupe(m, ns, booster) {
    const ech = echelle(m, ns);
    return h('section', { class: 'c-grp', 'aria-label': MES[m].long + ', échelle 0 à ' + ech }, ns.map((n, k) => barre(n, m, ech, k === 0, booster && k === 1)).flat().filter(Boolean));
  }

  /* La bande d'un houblon : nom, rôle, IBU dans ma recette, dose, retrait ; l'IBU face au style. */
  function bande(nom, ns, r, k, echIbu) {
    const radar = ETAT.lentille === 'radar', isole = radar && ETAT.focusSerie === nom;
    return h('div', {
      class: 'c-bande' + (isole ? ' isole' : ''), 'data-houblon-compare': nom, 'data-couleur': couleur(nom), style: '--c:' + couleur(nom), 'data-k': 'cb' + nom,
      role: radar ? 'button' : null, tabindex: radar ? '0' : null, 'data-booster': radar && k === 1 ? 'isoler un houblon' : null,
      'aria-label': radar ? (isole ? 'Revoir tous les houblons sur le radar' : 'Isoler ' + nom + ' sur le radar') : null,
      onclick: radar ? () => { ETAT.focusSerie = isole ? null : nom; rendre(false); } : null,
    },
      h('span', { class: 'b-nom' }, nomEl(nom), stockFiche(cleDe(nom), nom)),
      ibuEl(nom, r), h('span', { class: 'b-dose' }, doseEl(nom, r, k === 1)), retirerEl(nom, ns.length),
      h('span', { class: 'b-l2' }, roleEl(nom)),
      pisteIbu(nom, r, echIbu));
  }

  /* Les familles : celles du style d'abord (repérées « 16D »), puis les autres, les plus citées
     d'abord ; une famille qu'aucune fiche ne décrit en dernier. */
  const aro = (nom, f) => (F(nom).aromes || []).find((x) => x.f === f) || { f, lv: 0, n: 0, of: (F(nom).aromes[0] || {}).of || 0 };
  function ordreFamilles(ns) {
    const roue = D.roue.map((r) => r.f);
    const att = roue.filter((f) => D.attendues.includes(f));
    const score = (f) => Math.max(...ns.map((n) => aro(n, f).lv)) * 10 + ns.reduce((s, n) => s + aro(n, f).n, 0);
    const autres = roue.filter((f) => !att.includes(f)).sort((a, b) => score(b) - score(a) || roue.indexOf(a) - roue.indexOf(b));
    return { att, autres };
  }
  const NIV = ['non décrit', 'cité', 'marqué'];
  /* p06 « Matrice » : 12 familles × houblons ; cellule pleine (marqué), pâle (cité) ou vide (non
     décrit) ; une pastille par fiche du houblon, pleine si elle cite la famille. */
  function matrice(ns) {
    const { att, autres } = ordreFamilles(ns);
    const cols = '12px repeat(' + att.length + ', 24px) 6px repeat(' + autres.length + ', 24px)';
    const g = h('div', { class: 'mx-g', role: 'table', 'aria-label': 'Arômes des fiches : ' + ns.join(', ') + ' ; les familles du style ' + D.code + ' d\'abord', style: 'grid-template-columns:' + cols });
    g.append(h('span'), h('span', { class: 'mx-16', 'data-role': 'style', 'data-code': D.code, title: 'familles attendues du style ' + D.code + ' (BJCP 2021)', style: 'grid-column:2 / ' + (2 + att.length) }, h('span', { class: 'r16-code' }, D.code)), h('span', { style: 'grid-column:' + (2 + att.length) + ' / -1' }));
    const tete = (f) => h('span', { class: 'mx-h' + (att.includes(f) ? ' att' : ''), 'data-famille': f, 'data-statut-style': att.includes(f) ? 'attendue' : 'neutre' }, h('span', {}, D.court[f]));
    g.append(h('span', { class: 'mx-h' }), ...att.map(tete), h('span'), ...autres.map(tete));
    for (const n of ns) {
      const cell = (f) => {
        const a = aro(n, f), of = a.of || 0;
        return h('span', { class: 'mx-c n' + a.lv + (att.includes(f) ? ' att' : '') + (of > 2 ? ' m4' : ''), 'data-role': 'arome', 'data-houblon': n, 'data-famille': f, 'data-niveau': a.lv, 'data-sources': a.n, 'data-de': of, 'data-statut-style': att.includes(f) ? 'attendue' : 'neutre',
          title: D.long[f] + ' : ' + NIV[a.lv] + ', ' + a.n + ' fiche' + (a.n > 1 ? 's' : '') + ' sur ' + of },
        ...Array.from({ length: of }, (x, i) => h('i', { class: i < a.n ? null : 'v' })));
      };
      g.append(h('span', { class: 'mx-n', style: '--c:' + couleur(n), role: 'rowheader', 'aria-label': n }), ...att.map(cell), h('span'), ...autres.map(cell));
    }
    // La couleur de chaque houblon colore ses cellules.
    for (const c of g.querySelectorAll('.mx-c')) c.style.setProperty('--c', couleur(c.dataset.houblon));
    return h('section', { class: 'c-mx' }, g);
  }

  /* Le radar (p02) et son intervalle : par famille, de ce que disent toutes les fiches du houblon
     (le noyau plein, quand deux fiches au moins s'accordent toutes) à ce que disent les fiches réunies
     (le trait et les sommets, le niveau du pack). */
  function donneesRadar(nom) {
    const of = (F(nom).aromes[0] || {}).of || 0;
    return { niv: (f) => aro(nom, f).lv, n: (f) => aro(nom, f).n, of, noyau: (f) => { const a = aro(nom, f); return of >= 2 && a.n === of ? a.lv : 0; } };
  }

  /* Le détail, à un toucher : composants des huiles en plages, descripteurs et lecture face au style. */
  const COMPOSANTS = ['myrcène', 'humulène', 'caryophyllène', 'linalol'];
  function lecture16(nom) {
    const lv = (f) => aro(nom, f).lv, n = (f) => aro(nom, f).n;
    const att = D.attendues, cites = att.filter((f) => lv(f) > 0), sans = att.filter((f) => !lv(f));
    const dessus = D.ordre.filter((f, i) => D.continu.biere[i] != null && D.continu.biere[i] > D.continu.cible[i].haut + 0.05);
    const plus = D.roue.map((r) => r.f).filter((f) => !att.includes(f) && n(f) >= 2);
    const bas = (f) => D.court[f].toLowerCase();
    const t = [cites.length === att.length ? 'les ' + att.length + ' attendues' : cites.map(bas).join(', ')];
    if (sans.length && sans.length < att.length) t.push('sans ' + sans.map(bas).join(', '));
    if (!cites.length) t.push('aucune attendue');
    if (plus.length) t.push('+ ' + plus.map(bas).join(', '));
    // Ce que ma bière a en trop (au-dessus du style) : le dire quand ce houblon ne le cite pas.
    for (const f of dessus) if (!lv(f)) t.push('sans ' + bas(f));
    return 'en ' + D.code + ' : ' + t.join(' ; ');
  }
  function detail(ns) {
    const z = h('div', { class: 'c-plus-d', role: 'group', 'aria-label': 'Composants des huiles et descripteurs' });
    const hd = h('div', { class: 'hd', role: 'table', 'aria-label': 'Composants des huiles, % de l’huile' });
    hd.append(h('div', { class: 'hd-r hd-h' }, h('span', {}, '% de l’huile'), ...ns.map((n) => h('span', { style: 'color:' + couleur(n) }, bref(n)))));
    const nonImp = [];
    for (const c of COMPOSANTS) {
      const p = (n) => (F(n).composants || []).find((x) => x.nom === c && x.min != null);
      if (!ns.some(p)) { nonImp.push(c); continue; }
      const ech = pasRond(Math.max(...ns.map(p).filter(Boolean).map((x) => x.max)));
      hd.append(h('div', { class: 'hd-r' }, h('span', { class: 'hd-n' }, h('b', {}, c)), ...ns.map((n) => {
        const x = p(n);
        if (!x) return h('span', { class: 'hd-c hd-vide' }, 'aucune source');
        return h('span', { class: 'hd-c', 'data-plage-composant': c, 'data-houblon': n, 'data-min': x.min, 'data-max': x.max, title: x.src + ' : ' + pl(x.min, x.max) + ' %' }, pl(x.min, x.max),
          h('span', { class: 'hd-p' }, h('i', { class: 's', style: 'left:' + pc(x.min, ech) + ';width:calc(' + pc(x.max, ech) + ' - ' + pc(x.min, ech) + ');background:' + couleur(n) }), h('i', { class: 'ce', style: 'left:' + pc((x.min + x.max) / 2, ech) })));
      })));
    }
    for (const n of ns) for (const x of F(n).composants || []) if (x.min == null && !nonImp.includes(x.nom) && !COMPOSANTS.includes(x.nom)) nonImp.push(x.nom);
    if (nonImp.length) hd.append(h('div', { class: 'hd-src' }, nonImp.join(', ') + ' : non importés (#131), sans valeur'));
    z.append(hd);
    for (const n of ns) {
      const f = F(n);
      z.append(h('div', { class: 'fh', style: '--c:' + couleur(n) }, h('b', {}, bref(n)), h('span', {},
        h('p', {}, f.desc.length ? f.desc.join(', ') : 'aucun descripteur importé'),
        f.styles.length ? h('p', { class: 'us' }, f.styles.join(', ')) : null,
        h('p', { class: 'lu16' }, lecture16(n)))));
    }
    z.append(h('div', { class: 'hd-src' }, 'Descripteurs : Beer Maverick. Aucune fiche ne cite la stout ; ' + D.code + ' vient du BJCP 2021.'));
    return z;
  }

  function partie(part) {
    const ns = lesNoms();
    for (const k of Object.keys(COUL)) if (!ns.includes(k)) delete COUL[k];
    ns.forEach(couleur);
    const r = ref(), radar = ETAT.lentille === 'radar';
    part.classList.add('cmp', 'cmp-l6', 'l-' + ETAT.lentille);
    part.setAttribute('data-composant', 'comparer');
    part.append(h('div', { class: 'titre c-titre' }, ajouterEl(ns), lentille()));
    const ch = choixEl(ns); if (ch) part.append(ch);
    const ibus = ns.map((n) => { const v = r ? ibu(n, r.moment, r.g) : null, ra = rapportsAlpha(n); return v == null ? 0 : ra ? v * ra.haut : v; });
    const echIbu = pasRond(Math.max(D.ibuStyle[1], ...ibus));
    part.append(h('div', { class: 'c-bandes' }, ns.map((n, k) => bande(n, ns, r, k, echIbu))));
    if (radar) {
      const z = h('div', { class: 'c-radar', 'data-composant': 'radar' });
      part.append(z);
      RADAR.houblons(z, ns, { donnees: donneesRadar, couleur, focus: ETAT.focusSerie, Hmax: 250 });
    } else part.append(matrice(ns));
    part.append(h('div', { class: 'c-tab' }, ['alpha', 'beta', 'huiles'].map((m, i) => groupe(m, ns, i === 1))));
    part.append(h('button', { class: 'c-mt repli c-plus-b', 'aria-expanded': String(!!ETAT.cPlus), 'data-k': 'cplus', 'data-booster': 'détail des huiles',
      'aria-label': (ETAT.cPlus ? 'Replier' : 'Déplier') + ' les composants des huiles et les descripteurs', onclick: () => { ETAT.cPlus = !ETAT.cPlus; rendre(false); } }, 'Détail'));
    if (ETAT.cPlus) part.append(detail(ns));
    LENTILLE_CB = () => anime(140, (k) => { part.style.opacity = 1 - k; }, () => { part.style.opacity = 1; rendre(false); });
  }
  return { partie, couleur };
})();
