/* Lot 3, variantes de p3 (p02, p03) : logique commune. Données : pack-mini-protos (const D).
   Quatre objets (MODELE.md) : 1 ma bière et 2 la cible (crans du style), 3 les fiches des
   houblons (citations 0 à 2), 4 les voies du moteur (avant / après en crans). Aucun chiffre
   n'est calculé ici : sommes des IBU et dose × IBU par gramme du pack seulement. */
const ACC = '#c2410c';
const NS = 'http://www.w3.org/2000/svg';
let REDUIT = false;
try { REDUIT = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* rien */ }
const lerp = (a, b, t) => a + (b - a) * t;
const $ = (s, r) => (r || document).querySelector(s);
const virgule = (n, d = 1) => String(Math.round(n * 10 ** d) / 10 ** d).replace('.', ',');
const grammes = (g) => virgule(g, 1) + ' g';
const ibuTexte = (v) => (Math.abs(v) < 1 && v !== 0 ? virgule(v, 1) : String(Math.round(v)));

function sv(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs || {}) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const k in attrs || {}) {
    const v = attrs[k];
    if (v === false || v == null) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k instanceof Node ? k : String(k));
  return e;
}
function anime(duree, pas, fin) {
  if (REDUIT || duree <= 0) { pas(1); if (fin) fin(); return; }
  const t0 = performance.now();
  const f = (now) => {
    const k = Math.min(1, (now - t0) / duree);
    pas(1 - Math.pow(1 - k, 3));
    if (k < 1) requestAnimationFrame(f); else if (fin) fin();
  };
  requestAnimationFrame(f);
}
const losange = (p, r) => `M${p[0]},${p[1] - r} L${p[0] + r},${p[1]} L${p[0]},${p[1] + r} L${p[0] - r},${p[1]}Z`;
const fi = (f) => D.ordre.indexOf(f);
/* Le nom d'un houblon porte sa clé du pack (data-houblon), une fois par occurrence. */
const cleDe = (nom) => (D.cles && D.cles[nom]) || null;
function nomsHoublons(noms) { return noms.flatMap((n, k) => [k ? ' + ' : null, h('span', { 'data-houblon': cleDe(n) }, n)]).filter((x) => x != null); }
const nomCourt = (f) => D.court[f];

/* Moments du rail du brassage : premier moût ; ébullition par tranches de 5′, de la durée de la
   recette (D.ebullition, pack ebullitionMinutes) à 0′ ; whirlpool ; à froid, en fermentation active
   ou après (la phase est un choix du brasseur, le jour est libre). « vide » nomme l'étape vide. */
/* La durée d'ébullition est une donnée de la recette, réglée ailleurs dans l'application (fiche de
   brassage ; pack ebullitionMinutes) : l'étape la lit (D37 révisé), le rail et les moments en
   dépendent (45′, 60′, 120′, 200′…). */
let EBU = D.ebullition || 60, MOMENTS = [];
function construireMoments() {
  MOMENTS = [
    { code: 'fwh', type: 'premier moût', quand: 'moût', vide: 'premier moût' },
    ...Array.from({ length: EBU / 5 + 1 }, (x, k) => { const m = EBU - 5 * k; return { code: 'b' + m, type: 'ébullition', quand: m + '′', minute: m }; }),
    { code: 'wp', type: 'whirlpool', quand: '80 °C', vide: 'whirlpool' },
    { code: 'dryActive', type: 'à froid', quand: 'J+3', vide: 'fermentation' },
    { code: 'dryPost', type: 'à froid', quand: 'après', vide: 'post-fermentation' },
  ];
}
construireMoments();
/* Moment d'un ajout proposé, borné à la durée d'ébullition choisie. */
const momentBorne = (code) => { const m = /^b(\d+)$/.exec(code); return m && Number(m[1]) > EBU ? 'b' + EBU : code; };
const TYPES = ['ébullition', 'whirlpool', 'à froid', 'premier moût'];
const mom = (code) => MOMENTS.find((m) => m.code === code) || (/^b\d+$/.test(code) ? { code, type: 'ébullition', quand: code.slice(1) + '′', minute: Number(code.slice(1)) } : MOMENTS[0]);
const quand = (l) => (mom(l.moment).type === 'à froid' ? 'J+' + l.jour : l.moment === 'wp' ? (l.wpT || 80) + ' °C' : mom(l.moment).quand);
const quandLong = (l) => {
  const m = mom(l.moment);
  if (l.moment === 'fwh') return 'premier moût, ' + EBU + ' minutes d\'ébullition';
  if (m.type === 'ébullition') return m.minute === 0 ? 'fin d\'ébullition' : m.minute + ' minutes d\'ébullition';
  if (l.moment === 'wp') return 'whirlpool à ' + (l.wpT || 80) + ' °C pendant ' + (l.wpMin || 20) + ' minutes';
  return 'à froid, jour ' + l.jour + (l.moment === 'dryActive' ? ', en fermentation active' : ', après fermentation');
};

/* État de l'écran. */
const B = document.body.dataset;
const ETAT = {
  vue: B.vue, partie: B.ouvre || 'biere', lentille: B.lentille || 'barres',
  lignes: D.lignes.map((l) => ({ wpT: 80, wpMin: 20, ...l })),
  gouts: { aime: new Set(), exclut: new Set() }, goutOuvert: null,
  visee: {}, sel: null, filtreVoies: null, marques: null,
  comp: D.comparerDefaut.slice(), effet: null, ibuAffiche: null, focusK: null, momentR: {}, focusSerie: null,
  // La famille hors de sa zone s'ouvre d'emblée : ses gestes (bannir, réduire, augmenter) se voient.
  viseeAbs: {}, selFam: D.continu ? D.ordre.find((f, i) => D.continu.biere[i] != null && D.continu.biere[i] > D.continu.cible[i].haut + 0.05) || null : null,
  echelle: B.echelle || 'style', clavier: false,
  // Radars (radar.js) : la voie montrée dans Suggestions, le houblon agrandi dans Comparer.
  voieRadar: null, compGrand: null,
  // Substitution (u4) : le houblon dont on cherche les remplaçants.
  substDe: B.subst || null,
  // Ma dégustation (m4) : une note par famille, dans l'écran seulement (la maquette n'enregistre rien).
  notes: D.degustation && D.degustation.notes ? D.degustation.notes.slice() : D.ordre.map(() => null),
};
for (const f of (B.dirs ? B.dirs.split(',') : [])) ETAT.visee[f] = D.cible[fi(f)].visee;
/* Une recette dont l'ébullition est plus courte qu'un ajout (60′ dans une ébullition de 45′) : l'ajout
   se ramène au début de l'ébullition, et la ligne le dit (« ramenée au début »). */
for (const l of ETAT.lignes) { const m = /^b(\d+)$/.exec(l.moment); if (m && Number(m[1]) > EBU) { l.moment = 'b' + EBU; l.ramene = true; } }
/* D33 : le focus ne se replace qu'après une action au clavier (au doigt, la vue web du téléphone
   l'entourerait de jaune) ; le contour reste réservé à :focus-visible. */
for (const f of (B.dirs ? B.dirs.split(',') : [])) if (D.continu && D.continu.viseeDir[f] != null) ETAT.viseeAbs[f] = D.continu.viseeDir[f];
document.addEventListener('keydown', () => { ETAT.clavier = true; }, true);
document.addEventListener('pointerdown', () => { ETAT.clavier = false; }, true);
let VARIANTE = null;

/* IBU : valeur du pack au moment et à la dose de la recette, sinon IBU par gramme du pack × dose. */
/* IBU d'une ligne (pack, tablesIbu) : null à froid (« aucun IBU »), undefined sans table pour ce
   moment (« IBU à recalculer ») ; la table est donnée à la dose g0, l'IBU suit la dose. */
function ibuLigne(l) {
  const m = mom(l.moment);
  if (m.type === 'à froid') return null;
  const t = l.tab;
  if (t) {
    let v;
    if (l.moment === 'fwh') v = t.fwh[(D.tables.dureesFwh || []).indexOf(EBU)];
    else if (l.moment === 'wp') { const A = D.tables.wp; if (t.wp && A) { const ti = A.temperatures.indexOf(l.wpT || 80), di = A.minutes.indexOf(l.wpMin || 20); v = ti >= 0 && di >= 0 ? t.wp[ti][di] : null; } }
    else v = t.min5[m.minute / 5];
    if (v != null) return (v * l.g) / t.g0;
  }
  if (l.ibu0 && l.ibu0.v != null && l.ibu0.moment === l.moment && l.ibu0.g === l.g) return l.ibu0.v;
  const pg = l.ibuPG[l.moment];
  return pg == null ? undefined : pg * l.g;
}
const ibuTotal = () => ETAT.lignes.reduce((s, l) => s + (ibuLigne(l) || 0), 0);
function ibuEl(l) {
  const v = ibuLigne(l);
  if (v === undefined) return h('span', { class: 'ibu-l' }, 'IBU à recalculer');
  // À froid : le pack ne donne aucun IBU Tinseth (moments[].ibuModel : « aucun »).
  return v == null ? h('span', { class: 'ibu-l' }, 'aucun IBU') : h('span', { class: 'ibu-l' }, ibuTexte(v) + ' IBU');
}
/* Stock : il informe sans limiter (D21) et reste discret (D23) : seule l'exception s'écrit. */
function etatsStock() {
  const pris = {};
  return ETAT.lignes.map((l) => {
    if (l.achat) return { code: 'a-acheter', txt: 'à acheter', manque: l.g };
    const deja = pris[l.cle] || 0;
    pris[l.cle] = deja + l.g;
    const reste = Math.max(0, l.libre - deja), manque = Math.max(0, l.g - reste);
    if (reste <= 0 && manque > 0.05) return { code: 'a-racheter', txt: 'à racheter, manque ' + grammes(manque), manque };
    return manque > 0.05 ? { code: 'manque', txt: 'manque ' + grammes(manque), manque } : { code: '', txt: '', manque: 0 };
  });
}
/* Effet d'un ajout : celui de la voie du moteur au même houblon, moment et dose ; sinon « non établi ». */
function effetLigne(l) {
  return l.effet && l.effetCle && l.effetCle.moment === l.moment && l.effetCle.g === l.g ? l.effet : null;
}
function effetCourant() {
  const l = ETAT.effet && ETAT.lignes.find((x) => x.id === ETAT.effet);
  return l ? effetLigne(l) : null;
}
function effetTag(l) {
  if (l.ramene && mom(l.moment).minute === EBU) return h('span', { class: 'effet ne' }, 'ramenée au début');
  if (!l.nouveau) return null;
  const e = effetLigne(l);
  if (!e) return h('span', { class: 'effet ne' }, 'effet non établi');
  const idx = D.ordre.map((f, i) => i).filter((i) => typeof e.delta[i] === 'number' && e.delta[i] !== 0);
  const i = idx.find((k) => D.attendues.includes(D.ordre[k])) ?? idx[0];
  if (i == null) return h('span', { class: 'effet ne' }, '≈ inchangé');
  return h('span', { class: 'effet', 'aria-label': 'Effet prévu : ' + D.long[D.ordre[i]] + ' ' + (e.delta[i] > 0 ? '+' : '−') + Math.abs(e.delta[i]) + ' cran' }, nomCourt(D.ordre[i]).toLowerCase() + ' ' + (e.delta[i] > 0 ? '+' : '−') + Math.abs(e.delta[i]));
}

/* Ajout à froid (MODELE, « La levure ») : en fermentation active, signaux de biotransformation
   et de hop creep, sourcés dans le pack et sans chiffre ; l'effet reste « non quantifié ». */
function bioEl(l) {
  const actif = l.moment === 'dryActive';
  return h('div', { class: 'bio' },
    actif ? h('span', { class: 'sigs', 'data-role': 'biotransformation', 'aria-label': 'Avec ' + D.levure.nom + ' : biotransformation possible, non quantifiée' },
      h('span', { class: 'sig' }, 'biotransformation possible, non quantifiée'),
      l.signaux.map((x) => h('span', { class: 'sig' + (x.statut === 'possible' ? '' : ' ne'), title: x.titre + ' : ' + x.statut, 'aria-label': x.titre + ' : ' + x.statut }, x.court))) : null);
}

/* Citation utile : la fiche cite la famille que ma bière a au-dessus de la zone (résine en S1). */
function citationTag(l) {
  const i = fi('resin');
  if (!l.citation || !(D.profil[i].crans > D.cible[i].max)) return null;
  return h('span', { class: 'cite', 'aria-label': 'Résine citée par ' + l.citation.replace('résine ', '').replace('/', ' fiches sur ') }, l.citation);
}

/* Actions sur la recette. */
let SEQ = 0;
function ajouter(r, moment) {
  const id = 'n' + (++SEQ);
  ETAT.lignes.push({
    id, cle: r.cle, nom: r.nom, moment: moment || r.moment, g: r.g, alpha: r.alpha, role: r.role, tab: r.tab, wpT: 80, wpMin: 20, jour: 3, ibuPG: r.ibuPG, ibu0: { moment: r.moment, g: r.g, v: r.ibu },
    libre: r.libre, achat: r.groupe === 'catalogue', citation: null, fiche: r.fiche, effet: r.effet, effetCle: { moment: r.moment, g: r.g }, nouveau: true, signaux: [],
  });
  ETAT.effet = id;
  rendre(true);
}
function placer(l, code) { l.moment = code; rendre(true); }
function typeSuivant(l) {
  const t = TYPES[(TYPES.indexOf(mom(l.moment).type) + 1) % TYPES.length];
  placer(l, MOMENTS.find((m) => m.type === t).code);
}
function doser(l, d) { l.g = Math.max(0, Math.round((l.g + d) * 10) / 10); rendre(true); }
function retirer(l) { ETAT.lignes = ETAT.lignes.filter((x) => x !== l); rendre(true); }

/* Mes goûts (objet 5) : aimer, neutre, exclure, là où un houblon apparaît. */
function goutDe(nom) { return ETAT.gouts.exclut.has(nom) ? 'exclure' : ETAT.gouts.aime.has(nom) ? 'aimer' : 'neutre'; }
function goutBouton(nom, ctx, booster) {
  const cle = ctx + ':' + nom;
  const etat = goutDe(nom);
  const els = [h('button', {
    class: 'gout' + (etat === 'aimer' ? ' aime' : ''), 'data-role': 'gout', 'data-booster': booster || null, 'data-k': 'g' + cle,
    'aria-expanded': String(ETAT.goutOuvert === cle), 'aria-label': 'Mon goût pour ' + nom + ' : ' + etat,
    onclick: (e) => { e.stopPropagation(); ETAT.goutOuvert = ETAT.goutOuvert === cle ? null : cle; rendre(false); },
  })];
  if (ETAT.goutOuvert === cle) {
    els.push(h('span', { class: 'gout-choix', role: 'group', 'aria-label': 'Mon goût pour ' + nom },
      ['aimer', 'neutre', 'exclure'].map((c) => h('button', {
        'aria-pressed': String(etat === c), 'data-k': 'gc' + cle + c,
        onclick: (e) => { e.stopPropagation(); noterGout(nom, c); },
      }, c))));
  }
  return els;
}
function noterGout(nom, c) {
  ETAT.gouts.aime.delete(nom); ETAT.gouts.exclut.delete(nom);
  if (c === 'aimer') ETAT.gouts.aime.add(nom);
  if (c === 'exclure') ETAT.gouts.exclut.add(nom);
  ETAT.goutOuvert = null; ETAT.marques = null;
  rendre(false);
}
function goutsLigne() {
  const tous = [...ETAT.gouts.exclut].map((n) => [n, 'exclu']).concat([...ETAT.gouts.aime].map((n) => [n, 'aimé']));
  if (!tous.length) return null;
  return h('div', { class: 'goutsl', 'aria-label': 'Mes goûts' }, h('span', { class: 'gris' }, 'Mes goûts'),
    tous.map(([n, s]) => h('button', { 'aria-label': n + ' ' + s + ', remettre neutre', onclick: () => noterGout(n, 'neutre') }, s === 'exclu' ? '⊘ ' : '♥ ', h('span', { 'data-houblon': cleDe(n) }, n))));
}

/* Ajouts proposés par le moteur : stock d'abord ; « Tout » montre aussi à racheter et à acheter. */
function rapidesVisibles(n) {
  const pris = new Set(ETAT.lignes.map((l) => l.cle));
  const ok = (r) => !pris.has(r.cle) && !ETAT.gouts.exclut.has(r.nom);
  // Recette vide : la liste du moteur telle quelle ; un amérisant choisi retire l'autre (au choix).
  if (D.rapides.construction) {
    const choisi = D.rapides.construction.some((r) => r.alternative && pris.has(r.cle));
    return D.rapides.construction.filter((r) => ok(r) && !(choisi && r.alternative)).slice(0, n);
  }
  const st = D.rapides.stock.filter(ok), ep = D.rapides.epuises.filter(ok), ca = D.rapides.catalogue.filter(ok);
  const autres = [ca[0]].filter(Boolean);
  return [...st.slice(0, n - autres.length), ...autres];
}
/* Stock (D23 ter) : plus un mot sur l'étape, une petite icône grise data-stock avec son détail
   au survol et au lecteur d'écran ; le détail complet vit dans la fiche du houblon. */
function stockEl(txt) { return txt ? h('span', { class: 'st' }, txt) : null; }
function stockIcone(code, detail) { return code ? h('span', { class: 'ic-stock ic-' + code, 'data-stock': code, role: 'img', title: detail, 'aria-label': 'Stock : ' + detail }) : null; }
function statutRapide(r) {
  if (r.groupe === 'catalogue') return stockIcone('a-acheter', 'à acheter');
  if (r.groupe === 'epuise') return stockIcone('a-racheter', 'à racheter');
  if (r.libre < r.g) return stockIcone('manque', 'manque ' + grammes(r.g - r.libre));
  return null;
}
/* Acides alpha du pack (« 11,5 % α », ou la plage variétale « 6–9 % α »), en premier sur la carte. */
function alphaEl(a) {
  if (!a) return null;
  const t = a.v != null ? virgule(a.v, 1) : virgule(a.min, 1) + '–' + virgule(a.max, 1);
  return h('span', { class: 'alpha', 'aria-label': t + ' % d\'acides alpha', title: t + ' % d\'acides alpha' }, 'α ' + t);
}
function roleEl(role) { return role ? h('span', { class: 'role', 'data-role': 'role' }, role) : null; }
/* Les arômes cités par les fiches, une case par famille dans l'ordre du style, en couleur de la
   famille : on voit d'un coup d'œil ce que le houblon ajoute (D29). La case suit le nombre de fiches
   qui citent la famille, comme la roue de la fiche (D72, 19.10 : « 1/4, 2/4 mais même valeur ??? ») :
   pleine à 2 fiches ou plus, claire à 1, grise à aucune. La famille que ma bière a déjà en trop est
   soulignée de l'accent. data-famille, data-n, data-of, data-niveau : contrôle carte et fiche (D71). */
function miniProfil(fiche, nom) {
  // Sans compte de fiches (of 0 : un houblon du catalogue sans fiche), le niveau du pack.
  const compte = !!(fiche.n && fiche.of);
  const nb = (i) => (compte ? fiche.n[i] : fiche.niv[i]) || 0;
  const cites = D.ordre.filter((f, i) => nb(i) > 0).map((f) => nomCourt(f).toLowerCase());
  const w = h('span', { class: 'mini', role: 'img', 'data-role': 'aromes', 'aria-label': 'Arômes cités par les fiches de ' + nom + ' : ' + (cites.join(', ') || 'non décrit') });
  D.ordre.forEach((f, i) => {
    const n = nb(i), lv = Math.min(2, n);
    const trop = D.profil[i].crans === 4;
    w.append(h('i', { class: 'c f-' + f + (lv === 2 ? ' m' : lv === 1 ? ' ci' : '') + (trop && lv ? ' acc' : '') + (i === D.attendues.length ? ' sep' : ''), 'data-famille': f, 'data-niveau': lv, 'data-n': compte ? n : null, 'data-of': compte ? fiche.of : null, title: n ? nomCourt(f) + (compte ? ', ' + (fiche.of === 1 ? 'une seule fiche' : n + ' fiche' + (n > 1 ? 's' : '') + ' sur ' + fiche.of) : '') : null }));
  });
  return w;
}
/* Un ajout proposé, pensé en brasseur (D29, D41) : nom, α, rôle, arômes en couleur, dose, ce qu'il
   ajoute en IBU (D16) et son moment suggéré, qui dit où la ligne se posera sur le rail ; le stock
   reste une icône (D23 ter). Un toucher l'ajoute à ce moment. */
function rapideLigne(r, premier) {
  const mb = momentBorne(r.moment);
  const v = mb === r.moment ? r.ibu : ibuLigne({ ...r, moment: mb, ibu0: null, wpT: 80, wpMin: 20 });
  const ibu = v === undefined ? 'IBU à recalculer' : v == null ? 'aucun IBU' : '+' + ibuTexte(v) + ' IBU';
  const q = quand({ moment: mb, jour: 3, wpT: 80 });
  return h('li', { class: 'rapide-l' },
    h('button', {
      class: 'rapide', 'data-role': 'ajout-rapide', 'data-booster': premier ? 'ajout rapide' : null, 'data-k': 'r' + r.cle,
      'aria-label': 'Ajouter ' + r.nom + ', ' + grammes(r.g) + ', suggéré à ' + quandLong({ moment: mb, jour: 3, wpT: 80, wpMin: 20 }) + ' : ' + ibu,
      onclick: (e) => { const de = e.currentTarget.getBoundingClientRect(); ajouter(r, mb); if (typeof atterrir === 'function') atterrir(de); },
    },
    h('span', { class: 'plus-i', 'aria-hidden': 'true' }),
    h('span', { class: 'txt' },
      h('span', { class: 'r1' }, h('b', { 'data-houblon': r.cle }, r.nom), alphaEl(r.alpha), roleEl(r.role), statutRapide(r)),
      h('span', { class: 'r2' }, h('span', { class: 'dose-r' }, grammes(r.g)), h('span', { class: 'plus-ibu' }, ibu), miniProfil(r.fiche, r.nom))),
    h('span', { class: 'suggere', 'data-role': 'quand', title: 'Moment suggéré : ' + q }, q)),
    goutBouton(r.nom, 'r', premier ? 'goût' : null));
}

/* Pièces de l'étape. */
function enTete() {
  return h('header', { class: 'barre' },
    h('button', { class: 'retour', 'aria-label': 'Retour à l\'étape Malts' }),
    h('h1', {}, 'Houblons'), h('span', { class: 'etape' }, '3/7'),
    h('button', { class: 'style', 'aria-label': 'Style ' + D.code + ', échelles hypothétiques à valider ; changer de bière' }, D.code, h('span', { class: 'badge' }, 'hypothèse')));
}
function resume() {
  const [lo, hi] = D.ibuStyle;
  return h('div', { class: 'resume', role: 'group', 'aria-label': 'Résumé de la recette' },
    h('div', { class: 'ibu-bloc' }, h('span', { class: 'cle' }, 'IBU'), h('output', { id: 'ibu', 'aria-live': 'polite' }, String(Math.round(ETAT.ibuAffiche ?? ibuTotal()))),
      h('span', { id: 'ibu-delta', class: 'delta', 'aria-live': 'polite' }),
      h('span', { class: 'jauge', role: 'meter', 'aria-label': 'IBU face à la bande du style, ' + lo + ' à ' + hi, 'aria-valuemin': lo - (hi - lo) / 2, 'aria-valuemax': hi + (hi - lo) / 2, 'aria-valuenow': Math.round(ibuTotal()) }, h('i', { class: 'bde' }), h('i', { class: 'rep' }))),
    h('div', {}, h('span', { class: 'cle' }, 'OG'), h('b', {}, D.og)),
    h('div', {}, h('span', { class: 'cle' }, 'EBC'), h('b', {}, String(D.ebc))));
}
function majIbu(animer) {
  const out = $('#ibu');
  if (!out) return;
  const cible = ibuTotal(), de = ETAT.ibuAffiche ?? cible;
  ETAT.ibuAffiche = cible;
  const [lo, hi] = D.ibuStyle, a0 = lo - (hi - lo) / 2, a1 = hi + (hi - lo) / 2;
  const pos = (v) => Math.max(0, Math.min(100, (v - a0) / (a1 - a0) * 100));
  const j = $('.jauge');
  if (j) j.classList.toggle('hors', cible < lo || cible > hi);
  anime(animer ? 250 : 0, (k) => {
    const v = lerp(de, cible, k);
    out.textContent = Math.round(v);
    document.querySelectorAll('.jauge .rep').forEach((r) => { r.style.left = pos(v) + '%'; });
  });
  const delta = Math.round(cible) - Math.round(de), dl = $('#ibu-delta');
  if (animer && delta && dl) { dl.textContent = (delta > 0 ? '+' : '−') + Math.abs(delta); setTimeout(() => { if (dl.isConnected) dl.textContent = ''; }, 2000); }
}
function noteIbu() {
  if (!D.notes.ibu) return null;
  // Jauge à la largeur de son conteneur (pourcentages) : 0 à 90 IBU, bande du style, IBU actuel.
  const [lo, hi] = D.ibuStyle, max = hi + (hi - lo), pc = (v) => (2 + Math.max(0, Math.min(1, v / max)) * 96).toFixed(2) + '%';
  const v = ibuTotal();
  const s = sv('svg', { width: '100%', height: 30, role: 'img', 'aria-label': 'IBU ' + Math.round(v) + ' face à la bande du style, ' + lo + ' à ' + hi });
  sv('rect', { x: '2%', y: 9, width: '96%', height: 8, rx: 4, fill: '#ececec' }, s);
  sv('rect', { x: pc(lo), y: 9, width: ((hi - lo) / max * 96).toFixed(2) + '%', height: 8, fill: '#bdbdbd' }, s);
  sv('rect', { x: pc(v), y: 3, width: 4, height: 20, rx: 1, fill: v < lo || v > hi ? ACC : '#111', transform: 'translate(-2,0)' }, s);
  s.setAttribute('aria-label', D.notes.ibu);
  return h('div', { class: 'note-ibu', title: D.notes.ibu }, s);
}
function levure() {
  return h('div', { class: 'levure', 'data-role': 'levure', 'aria-label': 'Levure de la recette : ' + D.levure.nom + ', ' + D.levure.statut },
    h('span', { class: 'ic-levure', 'aria-hidden': 'true' }), h('span', {}, D.levure.nom), h('span', { class: 'p gris' }, D.levure.statut));
}
function champ(quandR) {
  return h('label', { class: 'champ' }, h('input', { type: 'text', placeholder: 'Ajouter' + (quandR ? ' à ' + quandR : '') + ' — houblon…', 'aria-label': 'Ajouter un houblon' + (quandR ? ' à ' + quandR : '') + ' : stock ou catalogue' }));
}
function phraseParts() {
  const parts = D.phrase.split(' · ');
  return { exc: parts.filter((p) => !/^\d/.test(p)), cpts: parts.filter((p) => /^\d/.test(p)) };
}
/* La ligne qui résume ma bière face à la cible (objets 1 et 2) et ouvre le panneau ; aperçu en crans. */
function panLigne() {
  const { exc, cpts } = phraseParts();
  return h('button', { class: 'pan', 'data-role': 'panneau', 'data-booster': 'ouvrir panneau', 'aria-label': D.phrase + ' : ouvrir Ma bière et la cible', onclick: () => ouvrir('biere') },
    h('span', { class: 'r1' }, exc.map((t) => h('span', { class: 'exc' }, t)), exc.length ? null : cpts.map((t) => h('span', { class: 'cpt' }, t)), h('span', { class: 'ouvrir', 'aria-hidden': 'true' })),
    apercu());
}
function marqueBiere(parent, p, i, c, r) {
  const P = D.profil[i];
  if (P.crans == null) return;
  const deg = P.source === 'dégustation', trop = P.crans > D.cible[i].max;
  sv('circle', { cx: c[0], cy: c[1], r, fill: deg ? (trop ? ACC : '#111') : '#fff', stroke: trop ? ACC : '#111', 'stroke-width': 1.6, 'stroke-dasharray': P.approx ? '2 1.5' : null }, parent);
}
function apercu() {
  const situees = D.profil.filter((p) => p.crans != null).length;
  if (!situees) return null;
  const fams = situees >= D.ordre.length / 2 ? D.ordre.map((f, i) => i) : D.ordre.map((f, i) => i).filter((i) => D.attendues.includes(D.ordre[i]) || D.profil[i].crans != null);
  const rows = Math.ceil(fams.length / 2), rh = 30;
  const s = sv('svg', { width: 358, height: rows * rh + 2, class: 'apercu', role: 'img', 'aria-label': 'Aperçu en crans du style : ma bière face à la zone du style' });
  const eff = effetCourant();
  fams.forEach((i, n) => {
    const f = D.ordre[i];
    const col = n < rows ? 0 : 1, row = n % rows, X = col * 184, y = row * rh + rh / 2 + 1;
    const C = D.cible[i], P = D.profil[i], sw = 21, x0 = X + 66;
    const xs = (v) => x0 + (v + 0.5) * sw;
    sv('text', { x: X, y: y + 4, 'font-size': 12, 'font-weight': D.attendues.includes(f) ? 650 : 400, fill: P.crans === 4 ? ACC : '#111' }, s).textContent = nomCourt(f);
    sv('rect', { x: x0, y: y - 4, width: 5 * sw, height: 8, rx: 4, fill: '#f0f0f0' }, s);
    sv('rect', { x: xs(C.min - 0.5) , y: y - 4, width: (C.max - C.min + 1) * sw, height: 8, rx: 4, fill: P.crans == null ? 'none' : '#d0d0d0', stroke: P.crans == null ? '#b0b0b0' : null, 'stroke-dasharray': P.crans == null ? '2 2' : null }, s);
    if (eff && eff.crans[i] != null && P.crans != null && typeof eff.delta[i] === 'number' && eff.delta[i] !== 0) {
      sv('line', { x1: xs(P.crans), y1: y, x2: xs(eff.crans[i]), y2: y, stroke: '#111', 'stroke-width': 1.5, 'stroke-dasharray': '2 2' }, s);
      sv('circle', { cx: xs(eff.crans[i]), cy: y, r: 5, fill: '#111' }, s);
    }
    marqueBiere(s, P, i, [xs(P.crans), y], 5);
  });
  return s;
}

/* ---------- Panneau : trois parties nommées, à un toucher l'une de l'autre ---------- */
const PARTIES = [['biere', 'Ma bière'], ['suggestions', 'Suggestions'], ['comparer', 'Comparer']];
function ouvrir(partie) { ETAT.vue = 'panneau'; ETAT.partie = partie; ETAT.goutOuvert = null; ETAT.entre = true; rendre(false); }
function tetePanneau() {
  return h('div', { class: 'tete' },
    h('button', { class: 'retour', 'aria-label': 'Revenir à l\'étape Houblons', onclick: () => { ETAT.vue = 'etape'; rendre(false); } }),
    h('div', { class: 'onglets', role: 'tablist', 'aria-label': 'Parties du panneau d\'analyse' },
      PARTIES.map(([k, t]) => h('button', {
        role: 'tab', 'aria-selected': String(ETAT.partie === k), 'data-k': 't' + k,
        'data-booster': ETAT.partie === k ? null : 'onglet ' + t.toLowerCase(),
        onclick: () => { if (ETAT.partie !== k) ouvrir(k); },
      }, t))));
}
let LENTILLE_CB = null;
function lentille() {
  const seg = h('span', { class: 'seg', role: 'radiogroup', 'aria-label': 'Lentille : barres ou radar', 'data-booster': 'lentille radar' },
    [['barres', 'Barres'], ['radar', 'Radar']].map(([k, t]) => h('button', { role: 'radio', 'aria-checked': String(ETAT.lentille === k), 'data-l': k }, t)));
  const vers = (l) => {
    if (l === ETAT.lentille) return;
    ETAT.lentille = l;
    seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.l === l)));
    if (LENTILLE_CB) LENTILLE_CB(l);
  };
  seg.addEventListener('click', (e) => { const b = e.target.closest('button'); vers(b && b.dataset.l !== ETAT.lentille ? b.dataset.l : ETAT.lentille === 'radar' ? 'barres' : 'radar'); });
  seg.addEventListener('keydown', (e) => { if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); vers(ETAT.lentille === 'radar' ? 'barres' : 'radar'); seg.querySelector('[aria-checked="true"]').focus(); } });
  return seg;
}
function panneau(app) {
  app.append(tetePanneau(), resume());
  const part = h('section', { class: 'partie' + (ETAT.entre ? ' entre' : ''), 'data-partie': ETAT.partie, 'aria-label': PARTIES.find((p) => p[0] === ETAT.partie)[1] });
  ETAT.entre = false;
  app.append(part);
  LENTILLE_CB = null;
  ({ biere: partieBiere, suggestions: partieSuggestions, comparer: partieComparer })[ETAT.partie](part);
}

/* Les radars des trois parties et de la fiche : un seul composant, radar.js (RADAR). */
const dirsActives = () => Object.keys(ETAT.visee);
function chipsDirection(onToggle) {
  const fams = [...new Set([...D.voiesResume.map((v) => v.fam), ...dirsActives()])];
  return h('div', { class: 'chips', role: 'group', 'aria-label': 'Direction demandée' },
    fams.map((f, n) => {
      const i = fi(f), vi = ETAT.visee[f] ?? D.cible[i].visee ?? D.cible[i].max, p = D.profil[i].crans ?? 0;
      const plus = vi > p;
      return h('button', {
        class: 'chip dir-' + (plus ? 'plus' : 'moins'), 'aria-pressed': String(f in ETAT.visee), 'data-k': 'c' + f,
        'data-booster': n === 0 ? 'puce direction' : null, 'aria-label': (plus ? 'Plus ' : 'Moins ') + D.long[f].toLowerCase(),
        onclick: () => {
          if (f in ETAT.visee) viserAbs(f, null);
          else if (D.continu && D.continu.viseeDir[f] != null) viserAbs(f, D.continu.viseeDir[f]);
          else ETAT.visee[f] = D.cible[i].visee ?? (plus ? p + 1 : D.cible[i].max);
          ETAT.filtreVoies = null; ETAT.marques = null; if (onToggle) onToggle(); else rendre(false);
        },
      }, nomCourt(f).toLowerCase());
    }),
    h('button', { class: 'chip dir-autre', 'aria-label': 'Autres directions : glisser la visée sur une famille' }));
}
/* ---------- Partie 1 : Ma bière et la cible, le détail (D31, D32, D33) ----------
   Une ligne par famille (data-famille). Deux échelles, même données (pack, échelle continue 0–3) :
   « au style » (la zone du style remplit la même largeur pour chaque famille, ses trois crans
   marqués, « au-dessus » à droite) et « absolu » (une piste commune 0–3 : absent, faible, moyen,
   marqué ; la zone du style à sa vraie place, ma bière à sa vraie valeur). Une sortie de zone dit
   son ampleur (« ×2,8 »), jamais écrasée au bord. Toucher une ligne ouvre bannir, réduire,
   augmenter : ma visée, de 0 (bannie) à 3 (marqué), qui pilote aussi les puces de direction. */
// Classes V5.5 sur l'échelle continue du pack (0–1 faible, 1–2 moyen, 2–3 marqué) ; une visée se
// pose au milieu d'une classe (la dégustation y est placée de même : 0,5 ; 1,5 ; 2,5) ou à 0, bannie.
const CLASSES = ['faible', 'moyen', 'marqué'];
const PALIERS = [0, 0.5, 1.5, 2.5];
const nomPalier = (v) => (v === 0 ? 'bannie' : PALIERS.includes(v) ? CLASSES[PALIERS.indexOf(v) - 1] : virgule(v, 1));
/* Ma visée (échelle absolue 0–3) : posée par un geste ou par une puce de direction ; la visée en
   crans des Suggestions suit (mêmes bornes que la zone du style). */
function viserAbs(f, v) {
  const i = fi(f), C = D.continu.cible[i];
  if (v == null) { delete ETAT.viseeAbs[f]; delete ETAT.visee[f]; return; }
  ETAT.viseeAbs[f] = Math.max(0, Math.min(3, v));
  const larg = Math.max(0.01, C.haut - C.bas);
  ETAT.visee[f] = ETAT.viseeAbs[f] > C.haut + 0.01 ? 4 : Math.max(0, Math.min(3, Math.floor(((ETAT.viseeAbs[f] - C.bas) / larg) * 3)));
}
/* Position (0–100 %) d'une valeur absolue sur la piste, selon l'échelle. */
function posPiste(i, v) {
  const C = D.continu.cible[i];
  if (ETAT.echelle === 'absolu') return Math.max(0, Math.min(100, (v / 3) * 100));
  if (v > C.haut + 0.01) return 90;
  const larg = Math.max(0.01, C.haut - C.bas);
  return Math.max(0, Math.min(80, ((v - C.bas) / larg) * 80));
}
function ligneFamille(f, i) {
  const P = D.profil[i], C = D.continu.cible[i], v = D.continu.biere[i], vi = ETAT.viseeAbs[f];
  const ouvert = ETAT.selFam === f, att = D.attendues.includes(f);
  const dessus = v != null && v > C.haut + 0.05;
  const piste = h('div', { class: 'piste-f' + (v == null ? ' ns' : ''), 'data-role': 'piste' });
  const zone = ETAT.echelle === 'absolu'
    ? h('span', { class: 'zone-f', 'data-role': 'zone', style: 'left:' + (C.bas / 3 * 100) + '%;width:' + ((C.haut - C.bas) / 3 * 100) + '%' })
    : h('span', { class: 'zone-f crans', 'data-role': 'zone', style: 'left:0;width:80%' });
  piste.append(zone);
  if (ETAT.echelle !== 'absolu') piste.append(h('span', { class: 'au-dessus', 'aria-hidden': 'true' }));
  if (vi != null) piste.append(h('span', { class: 'visee-f', style: 'left:' + posPiste(i, vi) + '%', 'aria-hidden': 'true' }));
  if (v != null) {
    const x = posPiste(i, v);
    if (vi != null) { const a = Math.min(x, posPiste(i, vi)), b = Math.max(x, posPiste(i, vi)); piste.append(h('span', { class: 'lien-visee', style: 'left:' + a + '%;width:' + (b - a) + '%' })); }
    piste.append(h('span', { class: 'biere-f ' + (P.source === 'dégustation' ? 'deg' : 'mod') + (dessus ? ' dessus' : ''), 'data-role': 'biere', style: 'left:' + x + '%', 'aria-hidden': 'true' }));
  }
  const droite = h('span', { class: 'droite-f' },
    dessus ? h('span', { class: 'ecart', 'data-role': 'ecart', 'aria-label': 'Au-dessus de la zone du style : ' + D.continu.ecart[i] }, D.continu.ecart[i]) : null,
    v == null ? h('span', { class: 'ns-pt', role: 'img', 'aria-label': 'non situé' }) : !dessus ? h('span', { class: 'src-f' }, P.source === 'dégustation' ? 'dégusté' : 'prévu') : null);
  const label = D.long[f] + ' : ' + (v == null ? 'non situé' : (P.source === 'dégustation' ? 'dégusté ' : 'prévu ') + virgule(v, 2) + ' sur 3') + ' ; zone du style ' + virgule(C.bas, 2) + ' à ' + virgule(C.haut, 2) + (vi != null ? ' ; ma visée ' + (vi === 0 ? 'bannie' : virgule(vi, 1)) : '');
  const ligne = h('div', {
    class: 'fam' + (att ? ' att' : '') + (ouvert ? ' ouvert' : '') + (vi === 0 ? ' bannie' : ''), 'data-famille': f, 'data-visee': vi != null ? String(Math.round(vi * 10) / 10) : null,
    onclick: (e) => { if (e.target.closest('[data-action]')) return; ETAT.selFam = ouvert ? null : f; rendre(false); },
  },
  h('button', { class: 'nom-f' + (dessus ? ' acc' : ''), 'aria-expanded': String(ouvert), 'aria-label': label + ' ; ouvrir bannir, réduire, augmenter', 'data-k': 'f' + f, 'data-booster': i === fi('resin') ? 'toucher famille' : null }, nomCourt(f)),
  piste, droite);
  if (ouvert) {
    const base = vi != null ? vi : v != null ? v : 0;
    const agir = (a) => (e) => {
      e.stopPropagation();
      const haut = PALIERS.find((p) => p > base + 1e-9), bas = [...PALIERS].reverse().find((p) => p < base - 1e-9);
      viserAbs(f, a === 'bannir' ? 0 : a === 'reduire' ? (bas ?? 0) : (haut ?? 2.5));
      ETAT.filtreVoies = null; ETAT.marques = null;
      rendre(false);
    };
    ligne.append(h('div', { class: 'actions-f', role: 'group', 'aria-label': 'Ma visée pour ' + D.long[f] },
      h('button', { 'data-action': 'bannir', 'aria-label': 'Bannir ' + D.long[f] + ' : visée absente', onclick: agir('bannir') }, 'bannir'),
      h('button', { 'data-action': 'reduire', 'aria-label': 'Réduire ma visée de ' + D.long[f] + ' d\'un niveau', onclick: agir('reduire') }, '−'),
      h('span', { class: 'niv' }, vi != null ? nomPalier(vi) : 'sans visée'),
      h('button', { 'data-action': 'augmenter', 'aria-label': 'Augmenter ma visée de ' + D.long[f] + ' d\'un niveau', onclick: agir('augmenter') }, '+'),
      vi != null ? h('button', { class: 'oublier', 'aria-label': 'Retirer ma visée', onclick: (e) => { e.stopPropagation(); viserAbs(f, null); rendre(false); } }, '×') : null));
  }
  return ligne;
}
function echelleSeg() {
  const seg = h('span', { class: 'seg', role: 'radiogroup', 'aria-label': 'Échelle : au style ou absolue', 'data-booster': 'lentille absolue' },
    [['style', 'Au style'], ['absolu', 'Absolu']].map(([k, t]) => h('button', { role: 'radio', 'aria-checked': String(ETAT.echelle === k), 'data-e': k }, t)));
  seg.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    ETAT.echelle = b && b.dataset.e !== ETAT.echelle ? b.dataset.e : ETAT.echelle === 'absolu' ? 'style' : 'absolu';
    rendre(false);
  });
  return seg;
}
/* La grille de dégustation (m4, choix du brasseur du 19.10 ; #139) : une note par famille d'un toucher
   (pas senti, faible, moyen, marqué) ; retoucher la note revient à « pas goûté » (inconnu, D65). Le
   radar au-dessus se redessine. Peu de mots : la note au-dessus du style passe à l'orangé, rien
   d'autre ne s'écrit. */
const NIV_DEG = ['pas senti', 'faible', 'moyen', 'marqué'];
/* La grille (m4, 19.10 : « attention à pas surchargé en texte ») : les quatre notes écrites une
   seule fois en tête de colonne ; chaque rangée a quatre pastilles, de l'anneau (pas senti) au gros
   point (marqué). Rien de coché : pas goûté. */
function grilleDegustation(redessiner) {
  return h('div', { class: 'deg-grille', role: 'group', 'data-role': 'degustation', 'aria-label': 'Ma dégustation : une note par famille' },
    h('div', { class: 'deg-rang deg-tete', 'aria-hidden': 'true' }, h('span'), ...NIV_DEG.map((mot) => h('span', {}, mot))),
    D.roue.map((r) => r.f).map((f) => {
      const i = fi(f), v = ETAT.notes[i], haut = D.continu.cible[i].haut;
      return h('div', { class: 'deg-rang', 'data-role': 'note', 'data-famille': f, role: 'radiogroup', 'aria-label': D.long[f] },
        h('span', { class: 'deg-nom' + (D.attendues.includes(f) ? ' attendue' : '') }, D.court[f]),
        ...NIV_DEG.map((mot, n) => h('button', {
          type: 'button', role: 'radio', 'aria-checked': String(v === n), class: 'deg-n n' + n + (v === n && n > haut + 0.05 ? ' trop' : ''), 'data-k': 'deg-' + f + '-' + n,
          'aria-label': D.long[f] + ' : ' + mot + (v === n ? ' (retoucher : pas goûté)' : ''),
          onclick: (e) => { e.stopPropagation(); ETAT.notes[i] = ETAT.notes[i] === n ? null : n; redessiner(); },
        }, h('i'))));
    }));
}
function partieBiere(part) {
  const { exc, cpts } = phraseParts();
  part.append(h('div', { class: 'titre' }, h('span', {}, exc.map((t) => h('span', { class: 'exc' }, t + ' ')), cpts.length && !exc.length ? cpts.join(' · ') : null), lentille()));
  // L'échelle (au style ou absolue) se choisit à côté des comptes ; elle ne vaut que pour les barres.
  const rangee = h('div', { class: 'rangee' }, exc.length ? cpts.map((t) => h('span', { class: 'cpt' }, t)) : null);
  part.append(rangee);
  const bloc = h('div', { class: 'bloc-lecture' });
  part.append(bloc);
  const dirs = dirsActives();
  const liens = D.voiesResume.filter((v) => dirs.includes(v.fam));
  const prevu = liens.length ? null : h('div', { class: 'rangee p gris' }, 'Prévu avec ' + D.levure.nom + ', ' + D.levure.statut);
  const dessiner = () => {
    bloc.innerHTML = '';
    if (ETAT.lentille === 'radar') {
      const ancien = rangee.querySelector('.seg'); if (ancien) ancien.remove();
      // Radar (radar.js, m4) : ce que j'ai goûté face à la zone du style, la grille dessous.
      bloc.setAttribute('data-composant', 'radar');
      // Les comptes et la levure de la prévision ne disent rien de la dégustation : cachés.
      rangee.hidden = true;
      if (prevu) prevu.hidden = true;
      RADAR.biere(bloc);
      bloc.append(grilleDegustation(dessiner));
      return;
    }
    bloc.removeAttribute('data-composant');
    rangee.hidden = false;
    if (prevu) prevu.hidden = false;
    const ancien = rangee.querySelector('.seg'); if (ancien) ancien.remove();
    const seg = echelleSeg(); seg.style.marginLeft = 'auto'; rangee.append(seg);
    bloc.append(h('div', { class: 'legende-f', 'aria-label': 'Sources de ma bière' },
      D.degustation ? h('span', {}, h('i', { class: 'pt-deg' }), 'dégusté ' + D.degustation.date) : null,
      h('span', {}, h('i', { class: 'pt-mod' }), 'prévu'),
      D.continu.biere.some((v) => v == null) ? h('span', {}, h('i', { class: 'pt-ns' }), 'non situé') : null));
    bloc.append(h('div', { class: 'tete-f' },
      ETAT.echelle === 'absolu'
        ? h('span', { class: 'graduations', 'aria-hidden': 'true' }, CLASSES.map((n) => h('span', {}, n)))
        : h('span', { class: 'graduations gr-style', 'aria-hidden': 'true' }, h('span', {}, 'zone du style'), h('span', {}, 'au-dessus'))));
    bloc.append(h('div', { class: 'familles', role: 'list', 'aria-label': 'Ma bière face à la zone du style, ' + (ETAT.echelle === 'absolu' ? 'échelle absolue' : 'échelle du style') }, D.ordre.map((f, i) => ligneFamille(f, i))));
  };
  dessiner();
  LENTILLE_CB = () => dessiner();
  part.append(chipsDirection());
  if (liens.length) part.append(h('div', { class: 'rangee', style: 'flex-wrap:wrap' }, liens.map((v) => h('button', { class: 'lien', onclick: () => { ETAT.filtreVoies = v.fam; ouvrir('suggestions'); } }, v.texte))));
  else part.append(prevu);
}

/* ---------- Partie 2 : Suggestions (objet 4), avant / après face à la cible ---------- */
const voieParRang = (r) => D.voies.find((v) => v.rang === r);
function voiesListe() {
  const ex = [...ETAT.gouts.exclut];
  // Variété exclue : le moteur retire ses voies et peut en faire entrer de nouvelles (voiesSansHoublon).
  const retirees = new Set(ex.flatMap((n) => (D.sansHoublon[n] ? D.sansHoublon[n].retirees : [])));
  let base = D.voies.filter((v) => !retirees.has(v.rang) && !v.houblons.some((n) => ETAT.gouts.exclut.has(n)));
  if (ex.length === 1 && D.sansHoublon[ex[0]]) for (const x of D.sansHoublon[ex[0]].nouvelles) base.splice(Math.max(0, x.rang - 1), 0, { nouvelle: true, label: x.label.replace(/./g, ','), rang: 'n' + x.rang, houblons: [] });
  const dirs = dirsActives();
  const f = ETAT.filtreVoies || (dirs.includes('floral') && !dirs.includes('resin') ? 'floral' : dirs.includes('resin') && !dirs.includes('floral') ? 'resin' : null);
  if (f === 'floral') base = base.filter((v) => v.nouvelle || v.dir.floral > 0);
  if (f === 'resin') base = base.filter((v) => !v.nouvelle && v.dir.resin < 0);
  return { liste: base.slice(0, 3), fam: f || (dirs.includes('floral') ? 'floral' : 'resin') };
}
function marquees(liste) {
  const connues = liste.filter((v) => !v.nouvelle);
  if (ETAT.marques == null) return connues.slice(0, 2);
  return connues.filter((v) => ETAT.marques.includes(v.rang));
}
function carteVoie(v, n, fam, marq) {
  if (v.nouvelle) return h('li', { class: 'voie' }, h('span'), h('span', { class: 'corps' }, h('span', { class: 'v1' }, h('b', {}, v.label)), h('span', { class: 'v2' }, h('span', { class: 'faible' }, 'nouvelle, effet non établi'))), h('span'));
  const on = marq.includes(v);
  const nom = v.houblons.join(' + ');
  return h('li', { class: 'voie' + (on ? ' on' : '') },
    h('input', {
      type: 'checkbox', class: 'coche', checked: on || null, 'data-k': 'v' + v.rang, 'data-booster': n === 1 ? 'marquer voie' : null,
      'aria-label': 'Voir avant / après : ' + v.label,
      onchange: () => {
        const cur = marq.map((x) => x.rang);
        ETAT.marques = on ? cur.filter((r) => r !== v.rang) : [...cur, v.rang].slice(-3);
        rendre(false);
      },
    }),
    h('span', { class: 'corps' },
      h('span', { class: 'v1' }, h('i', { class: 'op op-' + v.op, 'aria-label': v.verbe }), h('b', {}, v.cles.length ? nomsHoublons(v.houblons) : nom), h('span', { class: 'md' }, v.moment), h('span', { class: 'md' }, v.dose.replace(/\./g, ','))),
      h('span', { class: 'v2' }, ETAT.gouts.aime.has(v.houblons[0]) ? h('span', { class: 'aime-t' }, '♥ aimé') : null, v.bords.map((b) => h('span', { class: 'bord' }, b)), v.faible[fam] ? h('span', { class: 'faible' }, 'faible') : null)),
    h('span', { class: 'droite' },
      h('span', { class: 'h' }, stockEl(v.stock === 'en stock' ? '' : v.stock.replace(/\./g, ',')), goutBouton(v.houblons[0], 'v', n === 0 ? 'goût voie' : null)),
      h('span', { class: 'plus-ibu' }, (v.ibuDrift >= 0 ? '+' : '−') + ibuTexte(Math.abs(v.ibuDrift)) + ' IBU')));
}
function styleApres(k) { return [{ stroke: '#111' }, { stroke: '#111', dash: '5 3' }, { stroke: '#6e6e6e', dash: '2 2' }][k]; }
function matriceVoies(marq) {
  const cols = [{ nom: 'avant', crans: D.profil.map((p) => p.crans), avant: true }, ...marq.map((v) => ({ nom: v.houblons.join(' + '), houblons: v.cles.length ? v.houblons : null, crans: v.crans, delta: v.delta }))];
  const nameW = 72, colW = (358 - nameW) / cols.length, sw = Math.min(14, (colW - 10) / 5);
  const rows = []; let y = 26;
  D.ordre.forEach((f, i) => { const att = D.attendues.includes(f); if (i === D.attendues.length) y += 6; const rh = att ? 32 : 28; rows.push({ y: y + rh / 2, att }); y += rh; });
  const s = sv('svg', { width: 358, height: y + 2, role: 'img', 'aria-label': 'Avant et après des voies marquées, en crans du style' });
  cols.forEach((c, k) => {
    const cx = nameW + k * colW + colW / 2;
    const t = sv('text', { x: cx, y: 13, 'font-size': 12, 'text-anchor': 'middle', 'font-weight': c.avant ? 400 : 650, fill: c.avant ? '#6e6e6e' : '#111' }, s);
    if (c.houblons && c.houblons.length > 1) c.houblons.forEach((n, j) => { if (j) sv('tspan', {}, t).textContent = ' + '; sv('tspan', { 'data-houblon': cleDe(n) }, t).textContent = n; });
    else {
      if (c.houblons) t.setAttribute('data-houblon', cleDe(c.houblons[0]));
      let txt = c.nom; t.textContent = txt;
      while (t.getComputedTextLength() > colW - 4 && txt.length > 4) { txt = txt.slice(0, -2); t.textContent = txt + '…'; }
    }
    if (!c.avant) sv('line', { x1: cx - 10, y1: 19, x2: cx + 10, y2: 19, stroke: styleApres(k - 1).stroke, 'stroke-width': 2, 'stroke-dasharray': styleApres(k - 1).dash || null }, s);
  });
  D.ordre.forEach((f, i) => {
    const r = rows[i], C = D.cible[i], P = D.profil[i];
    if (r.att) sv('rect', { x: 0, y: r.y - 13, width: 358, height: 26, rx: 6, fill: '#f5f5f5' }, s);
    sv('text', { x: 4, y: r.y + 4, 'font-size': 12, 'font-weight': r.att ? 650 : 400, fill: P.crans === 4 ? ACC : '#111' }, s).textContent = nomCourt(f);
    cols.forEach((c, k) => {
      const x0 = nameW + k * colW + (colW - 5 * sw) / 2, xs = (v) => x0 + (v + 0.5) * sw;
      const situe = c.crans[i] != null || P.crans != null;
      sv('rect', { x: x0, y: r.y - 3, width: 5 * sw, height: 6, rx: 3, fill: situe ? '#f0f0f0' : 'none', stroke: situe ? null : '#b5b5b5', 'stroke-dasharray': situe ? null : '2 2' }, s);
      if (situe) sv('rect', { x: xs(C.min - 0.5), y: r.y - 3, width: (C.max - C.min + 1) * sw, height: 6, rx: 3, fill: '#d2d2d2' }, s);
      const vi = ETAT.visee[f];
      if (vi != null) sv('path', { d: losange([xs(vi), r.y], 5), fill: 'none', stroke: '#111', 'stroke-width': 1.3 }, s);
      if (c.avant) { marqueBiere(s, P, i, [xs(P.crans), r.y], 4); return; }
      if (c.crans[i] == null) return;
      const dl = c.delta[i];
      if (typeof dl === 'number' && dl !== 0) {
        if (P.crans != null) { sv('line', { x1: xs(P.crans), y1: r.y, x2: xs(c.crans[i]), y2: r.y, stroke: '#9a9a9a', 'stroke-width': 1.5 }, s); sv('circle', { cx: xs(P.crans), cy: r.y, r: 2.5, fill: '#9a9a9a' }, s); }
        sv('circle', { cx: xs(c.crans[i]), cy: r.y, r: 4.5, fill: c.crans[i] > C.max ? ACC : '#111' }, s);
      } else if (dl === '≈' || dl === 0) sv('circle', { cx: xs(c.crans[i]), cy: r.y, r: 4, fill: '#9a9a9a' }, s);
      else sv('circle', { cx: xs(c.crans[i]), cy: r.y, r: 4, fill: '#fff', stroke: '#8a8a8a', 'stroke-width': 1.3, 'stroke-dasharray': '2 1.5' }, s);
    });
  });
  return s;
}
function partieSuggestions(part) {
  // En Radar, le lot 6 choisi par le brasseur (p10, radar agrandi) : suggestions.js.
  if (ETAT.lentille === 'radar' && SUGG.ok()) { SUGG.partieRadar(part); return; }
  const dirs = dirsActives();
  part.append(h('div', { class: 'titre' }, chipsDirection(), lentille()));
  if (!dirs.length || !D.voies.length) {
    part.append(h('p', { class: 'rangee gris' }, D.notes.voies || 'Une direction ouvre les voies du moteur.'));
    return;
  }
  const { liste, fam } = voiesListe();
  const res = D.voiesResume.filter((v) => dirs.includes(v.fam));
  part.append(h('div', { class: 'reponse' }, res.map((v) => h('button', {
    class: 'moitie', 'aria-pressed': String(ETAT.filtreVoies === v.fam), 'data-k': 'm' + v.fam, 'data-booster': v.fam === 'resin' ? 'compteur voies' : null,
    onclick: () => { ETAT.filtreVoies = ETAT.filtreVoies === v.fam ? null : v.fam; ETAT.marques = null; rendre(false); },
  }, v.texte))));
  const marq = marquees(liste);
  part.append(h('ul', { class: 'voies', 'aria-label': 'Voies du moteur' }, liste.map((v, n) => carteVoie(v, n, fam, marq))));
  const g = goutsLigne();
  if (g) part.append(g);
  if (fam === 'resin' && ETAT.filtreVoies === 'resin' && D.horsModele.length) part.append(h('p', { class: 'pistes' }, 'Hors houblon : ' + D.horsModele.join(' ; ').toLowerCase()));
  const zone = h('div', { class: 'vue-voies' });
  part.append(zone);
  const dessiner = () => {
    zone.innerHTML = '';
    if (ETAT.lentille === 'radar') zone.setAttribute('data-composant', 'radar'); else zone.removeAttribute('data-composant');
    // Radar (radar.js) : l'avant en contour, une voie marquée pleine en gris ; puces ou balayage.
    if (ETAT.lentille === 'radar') RADAR.voies(zone, { marq, liste }, dessiner);
    else zone.append(matriceVoies(marq));
  };
  dessiner();
  // Passer en Radar redessine toute la partie (sa composition est autre, suggestions.js).
  LENTILLE_CB = () => anime(160, (k) => { zone.style.opacity = 1 - k; }, () => { if (ETAT.lentille === 'radar' && SUGG.ok()) { rendre(false); return; } dessiner(); anime(160, (k) => { zone.style.opacity = k; }); });
}

/* ---------- Partie 3 : Comparer des houblons (objet 3) ---------- */
/* Le lot 6 choisi par le brasseur (p06 en Barres, p02 en Radar avec son intervalle) : comparer.js. */
function partieComparer(part) { COMPARER.partie(part); }

/* ---------- Rendu ---------- */
function rendre(animerIbu) {
  const app = $('#app');
  const actif = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.k : null;
  app.innerHTML = '';
  document.body.dataset.vue = ETAT.vue;
  if (ETAT.vue === 'etape') VARIANTE.etape(app); else if (ETAT.vue === 'substitution') SUBST.vue(app); else panneau(app);
  majIbu(animerIbu);
  // La fiche ouverte suit l'état (un moment touché dans sa table déplace la ligne au-dessus).
  if (typeof ficheApresRendu === 'function') ficheApresRendu();
  const k = ETAT.focusK || actif;
  ETAT.focusK = null;
  if (k && ETAT.clavier) { const e = app.querySelector('[data-k="' + CSS.escape(k) + '"]'); if (e) e.focus({ preventScroll: true }); }
}
function demarrer() { rendre(false); }
