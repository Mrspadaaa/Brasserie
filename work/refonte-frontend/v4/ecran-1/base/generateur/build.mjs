// Construit p02 et p03 du lot 3 (variantes de p3) : neuf vues chacune, données extraites du pack.
// Aucun chiffre n'est calculé ici ni dans la page : tout vient des champs du pack (crans, IBU par
// moment et par gramme, stock, achats, voies, fiches). La page ne fait que les sommes et les
// produits dose × IBU par gramme quand le brasseur change une dose.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const ARGS = process.argv.slice(2);
const OUT = (ARGS.find((a) => a.startsWith('--out=')) || '').slice(6) || ROOT + '/work/refonte-frontend/v4/ecran-1/base';
const IDS = ARGS.filter((a) => /^p\d+$/.test(a));
const PAGES = ARGS.filter((a) => a.endsWith('.html'));
const pack = JSON.parse(fs.readFileSync(ROOT + '/prototypes/houblons-v4/data/pack-mini-protos.json', 'utf8'));
const st = pack.styles['16D'];
const ORDRE = st.order;
const court = { floral: 'Floral', herbal: 'Herbacé', earthy: 'Terreux', citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', resin: 'Résineux', spice: 'Épicé', green: 'Végétal' };
const long = Object.fromEntries(pack.families.map((f) => [f.id, f.name]));
const virgule = (n) => String(n).replace('.', ',');
const parFam = (arr, k = 'family') => Object.fromEntries(arr.map((x) => [x[k], x]));
const ibuPG = (liste) => Object.fromEntries((liste || []).map((m) => [m.code, m.modelled && m.ibuPerGram ? m.ibuPerGram.value : null]));
const niveauCite = (lv) => (lv === 'marqué' ? 2 : lv === 'cité' ? 1 : 0);

// Fiches des houblons (objet 3) : profilFiches du pack, et les « cited » des ajouts du catalogue.
function fiches(S) {
  const F = {};
  for (const hp of S.profilFiches || []) {
    const m = parFam(hp.families);
    F[hp.name] = { niv: ORDRE.map((f) => m[f].level), n: ORDRE.map((f) => m[f].sources), of: hp.families[0].of };
  }
  return F;
}
function ficheDeCited(cited) {
  const m = parFam(cited || []);
  const of = (cited && cited[0] && cited[0].of) || 0;
  return { niv: ORDRE.map((f) => (m[f] ? niveauCite(m[f].level) : 0)), n: ORDRE.map((f) => (m[f] ? m[f].sources : 0)), of };
}

const PACK_FICHES = JSON.parse(fs.readFileSync(ROOT + '/prototypes/houblons-v4/data/pack-fiches.json', 'utf8'));
const FICHES = PACK_FICHES.fichesHoublons;
// Le catalogue du moteur (Beer Maverick, 318 variétés) : les remplaçants sans fiche du pack (u4).
const VARIETES = JSON.parse(fs.readFileSync(ROOT + '/prototypes/houblons-v4/data/proto-data.json', 'utf8')).varieties;
// La règle rôle-α v1 du moteur (prototypes/houblons-v4/src/engine/roles.ts, roleFromAlpha).
const roleRegle = (a, marque) => (a >= 10 ? (marque ? 'double' : 'amérisant') : a <= 6 ? 'aromatique' : 'double');
/* Un remplaçant sans fiche du pack : une fiche réduite tirée du catalogue du moteur. Ses arômes sont
   ceux de l'original corrigés par ce que le pack dit qu'il gagne ou perd ; son α de référence est le
   milieu de sa plage variétale (la règle du moteur pour la dose : l'IBU par gramme suit α) ; son IBU
   par gramme au moment de la référence vient de la dose du pack à IBU égal. Rien d'autre. */
function ficheCatalogue(v, orig, c, ref) {
  const NOMS_H = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', linalool: 'linalol' };
  const src = (a) => (Array.isArray(a) ? [{ src: 'Beer Maverick', an: v.bmYear || null, min: a[0], max: a[1] }] : []);
  const M = (v.descriptions || []).length + (v.citedFacts || []).length;
  const corr = Object.fromEntries([...c.gagne, ...c.perd].map((x) => [x.family, x.a]));
  const aromes = orig.aromes.map((a) => { const lv = a.f in corr ? corr[a.f] : a.lv; return { f: a.f, lv, n: lv && M === 1 ? 1 : 0, of: M === 1 ? 1 : 0, auteurs: lv ? ['Beer Maverick'] : [] }; });
  const aMid = Array.isArray(v.alpha) ? (v.alpha[0] + v.alpha[1]) / 2 : null;
  const comp = { ...(v.oils || {}), linalool: Array.isArray(v.hsLinalool) ? v.hsLinalool : null };
  return {
    nom: v.name, origine: v.origin || null,
    role: aMid != null ? { v: roleRegle(aMid, aromes.some((a) => a.lv === 2)), src: 'règle : règle rôle-α v1 (prototype, à valider)' } : null,
    alpha: src(v.alpha), lot: null, lotOrigine: null, alphaRef: aMid,
    beta: src(v.beta), huiles: src(v.oil),
    composants: Object.entries(NOMS_H).map(([k, nom]) => (Array.isArray(comp[k]) ? { nom, min: comp[k][0], max: comp[k][1], src: k === 'linalool' ? 'Hopsteiner' : 'Beer Maverick' } : { nom, raison: k === 'farnesene' ? 'non importé (#131)' : 'non publié dans le catalogue' })),
    aromes, desc: v.tagsFr || [], subsCalc: [], subs: [], subsRaison: null,
    styles: [], stylesSrc: [], stylesRaison: 'styles d’emploi non publiés dans le dépôt',
    ibuPG: c.dose && c.dose.g ? { [ref.moment]: ref.ibu / c.dose.g } : {}, base: c.dose ? 'dose du pack à IBU égal, ' + ref.quand : null,
    catalogue: true,
  };
}
const enAlpha = (a) => {
  if (a == null) return null;
  if (typeof a === 'number') return { v: a };
  if (a.value != null && (a.min == null || a.min === a.max)) return { v: a.value };
  if (a.min != null && a.max != null) return a.min === a.max ? { v: a.min } : { min: a.min, max: a.max };
  if (Array.isArray(a.sources) && a.sources.length) { const s = a.sources[0]; return s.min === s.max ? { v: s.min } : { min: s.min, max: s.max }; }
  return a.value != null ? { v: a.value } : null;
};
function alphaDe(item, key, nom) {
  const s = pack.stock.find((x) => x.key === key || x.name === nom);
  const c = pack.catalogue.find((x) => x.key === key || x.name === nom);
  const f = FICHES.find((x) => x.key === key || x.name === nom);
  return enAlpha(item && item.alpha) || enAlpha(s && s.alpha) || enAlpha(c && c.alpha) || enAlpha(f && f.alpha);
}
const roleDe = (item) => {
  const r = item && item.role;
  if (!r) return null;
  const v = typeof r === 'string' ? r : r.value || r.label || r.code;
  return v ? String(v).toLowerCase() : null;
};
/* Fiche d'un houblon (D25, pack-fiches.json) : champs repris tels quels ; un champ absent reste null
   (la page dit « non renseigné »). Le rôle (amérisant, aromatique, double, avec sa source) vient
   du pack courant, là où le houblon est une ligne ou un ajout proposé. */
const ROLES = {};
const CAS_COMPARER = ['Nugget', 'East Kent Goldings', 'Fuggle'];
for (const S of Object.values(pack.scenarios)) {
  const AR = S.ajoutsRapides || {};
  for (const x of [...(S.recetteHoublons || []), ...(AR.disponibles || []), ...(AR.epuises || []), ...(AR.catalogue || []), ...(AR.amerisants || []), ...(AR.aromatiques || [])]) {
    const k = x.key || x.hopKey;
    if (k && x.role && x.role.value && !ROLES[k]) ROLES[k] = { v: x.role.value, src: x.role.source || null };
  }
}
const plageSrc = (s) => ({ src: s.source, an: s.annee ?? null, min: s.min, max: s.max });
function ficheH(f) {
  const comp = (f.huiles && f.huiles.composants) || {};
  const NOMS_H = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', linalool: 'linalol' };
  const de = f.alpha && f.alpha.retenu ? f.alpha.retenu.from : null;
  return {
    nom: f.name, origine: f.origin || null, role: ROLES[f.key] || null,
    alpha: ((f.alpha && f.alpha.sources) || []).map(plageSrc),
    // La valeur de mon lot seulement (fiche de stock, article) : un milieu de plage n'est pas un lot.
    lot: de === 'fiche de stock' || de === 'lu sur l’article' ? f.alpha.retenu.value : null,
    // L'origine de mon lot (Comparer : ▼ fiche de stock, ▽ article) et l'α des tables d'IBU de la fiche.
    lotOrigine: de === 'fiche de stock' ? 'stock' : de === 'lu sur l’article' ? 'article' : null,
    alphaRef: f.alpha && f.alpha.retenu ? f.alpha.retenu.value : null,
    beta: ((f.beta && f.beta.sources) || []).map(plageSrc),
    huiles: ((f.huiles && f.huiles.totale && f.huiles.totale.sources) || []).map(plageSrc),
    composants: Object.entries(NOMS_H).map(([k, nom]) => (comp[k] ? { nom, min: comp[k].min, max: comp[k].max, src: comp[k].source } : { nom, raison: comp[k + 'Raison'] || null })),
    // #140 (lot 13, g1) : les mots des fiches qui font chaque famille, et qui la nomme en premier.
    aromes: (f.aromes || []).map((a) => ({ f: a.family, lv: a.level, n: a.sources, of: a.of, auteurs: a.authors || [], mots: a.mots || [], premier: a.premier || [] })),
    sansFamille: f.motsSansFamille || [],
    desc: (f.descripteurs && f.descripteurs.beerMaverick) || [],
    subsCalc: ((f.substitutsCalcules && f.substitutsCalcules.remplacants) || []).map((x) => x.name).filter((n) => FICHES.some((y) => y.name === n)),
    subs: Array.isArray(f.substituts) ? f.substituts.map((x) => (typeof x === 'string' ? x : x.name || x.nom || '')).filter(Boolean) : [], subsRaison: f.substitutsRaison || null,
    styles: (f.usage || []).flatMap((u) => u.styles || []), stylesSrc: (f.usage || []).map((u) => u.source).filter(Boolean), stylesRaison: f.usageRaison || null,
    ibuPG: Object.fromEntries(((f.ibuParGramme && f.ibuParGramme.moments) || []).map((m) => [m.code, m.ibuPerGram ? m.ibuPerGram.value : null])),
    base: (f.ibuParGramme && f.ibuParGramme.base) || null,
  };
}

// Fiches des houblons (citations) : propriété du houblon, communes à tous les scénarios.
const S1 = pack.scenarios.S1;
const FICHES_TOUTES = Object.fromEntries([
  ...[...S1.ajoutsRapides.disponibles, ...S1.ajoutsRapides.epuises, ...(S1.ajoutsRapides.catalogue || [])].map((a) => [a.name, ficheDeCited(a.cited)]),
  ...Object.entries(fiches(S1)),
]);

// Tables d'IBU d'un houblon à la dose g0 (tablesIbu du pack) ; null pour les listes sans table.
function tablesDe(a, g0) {
  if (!a || !Array.isArray(a.ibuParMinute5)) return null;
  // Premier moût : liste alignée sur tablesIbu.dureesPremierMout (5 à 240′ par 5) ; whirlpool : ibu[température][minutes].
  const fwh = Array.isArray(a.ibuPremierMout) ? a.ibuPremierMout.filter((x) => typeof x === 'number') : [];
  return { g0, min5: a.ibuParMinute5, fwh, wp: a.ibuWhirlpool && a.ibuWhirlpool.ibu ? a.ibuWhirlpool.ibu : null };
}

function scenario(id) {
  // Variante d'une recette (S1E120 : la même recette, 120′ d'ébullition) : ce qu'elle ne redonne pas vient de la recette de base.
  // S1E45, S1E200 : la même recette avec une autre durée d'ébullition, réglée dans la fiche de
  // brassage (D37 révisé) ; l'IBU se lit dans les tables du pack (0 à 240′ par 5, premier moût par durée).
  const base = id.replace(/E[0-9]+$/, '');
  const S = base !== id ? { ...pack.scenarios[base], ...(pack.scenarios[id] || { ebullitionMinutes: Number(id.match(/E([0-9]+)$/)[1]) }) } : pack.scenarios[id];
  const EBU = S.ebullitionMinutes || S.recipe.boilMin || 60;
  const F = fiches(pack.scenarios.S1);
  const voiesBrutes = S.voies || [];
  const effetDe = (key, moment, g) => {
    const v = voiesBrutes.find((x) => x.type === 'ajouter' && x.actions.length === 1 && x.actions[0].hopKey === key && x.actions[0].moment === moment && x.actions[0].grams === g);
    if (!v) return null;
    const m = parFam(v.profilApresCrans);
    return { rang: v.rank, crans: ORDRE.map((f) => m[f].crans), delta: ORDRE.map((f) => m[f].deltaCrans) };
  };
  const rapide = (a, groupe) => ({
    cle: a.key, nom: a.name, groupe, moment: a.moment, g: a.dose.grams, ibu: a.ibuAdded ? a.ibuAdded.value : null,
    ibuPG: ibuPG(a.ibuParMoment), tab: tablesDe(a, a.dose.grams), libre: Math.max(0, a.stock.free), statut: a.stock.status,
    fiche: F[a.name] || ficheDeCited(a.cited), effet: effetDe(a.key, a.moment, a.dose.grams),
    alpha: alphaDe(a, a.key, a.name), role: roleDe(a),
  });
  const AR = S.ajoutsRapides;
  // Mode « construction » (recette vide) : 1 ou 2 amérisants à 60′ au choix, puis des aromatiques.
  const construit = (a, alternative) => ({
    cle: a.key, nom: a.name, groupe: /hors stock|acheter/.test(a.stock.etat || '') ? 'catalogue' : /épuis/.test(a.stock.etat || '') ? 'epuise' : 'stock',
    moment: a.moment, g: a.dose.grams, ibu: a.ibu ? a.ibu.value : null, ibuPG: {}, tab: tablesDe(a, a.dose.grams), libre: Math.max(0, a.stock.libre || 0),
    fiche: FICHES_TOUTES[a.name] || { niv: ORDRE.map((f) => ((a.fiches || []).find((x) => x.family === f) || {}).level || 0), n: ORDRE.map(() => 0), of: 0 },
    effet: a.effetEtabli ? { crans: ORDRE.map(() => null), delta: ORDRE.map((f) => { const e = a.effetEtabli.find((x) => x.family === f); return e ? Math.round(e.crans) || '≈' : 'non établi'; }) } : null,
    alpha: alphaDe(a, a.key, a.name), role: roleDe(a), alternative: !!alternative,
  });
  const rapides = AR.mode === 'construction'
    ? { stock: [], epuises: [], catalogue: [], construction: [...(AR.amerisants || []).map((a) => construit(a, a.alternative)), ...(AR.aromatiques || []).map((a) => construit(a, false))] }
    : {
      stock: AR.disponibles.map((a) => rapide(a, 'stock')),
      epuises: AR.epuises.map((a) => rapide(a, 'epuise')),
      catalogue: (AR.catalogue || []).map((a) => rapide(a, 'catalogue')),
    };
  const tousRapides = [...rapides.stock, ...rapides.epuises, ...rapides.catalogue, ...(rapides.construction || [])];
  const achatsL = parFam((S.achats && S.achats.lignes) || [], 'additionId');
  const lignes = S.recetteHoublons.map((r) => {
    const stockLibre = r.stock ? Math.max(0, r.stock.grams) : achatsL[r.additionId] ? achatsL[r.additionId].stockLibre : 0;
    const pg = ibuPG(r.ibuParMoment);
    const ibu0 = r.ibu ? r.ibu.value : (r.ibuParMoment.find((m) => m.code === r.moment) || {}).ibu?.value ?? null;
    const fi = F[r.name];
    const resine = fi && fi.niv[ORDRE.indexOf('resin')] > 0 ? 'résine ' + fi.n[ORDRE.indexOf('resin')] + '/' + fi.of : null;
    return {
      id: r.additionId, cle: r.hopKey, nom: r.name, moment: r.moment, g: r.grams, jour: r.day || 3,
      alpha: alphaDe(r, r.hopKey, r.name), role: roleDe(r),
      ibuPG: pg, tab: tablesDe(r, r.grams), ibu0: { moment: r.moment, g: r.grams, v: ibu0 }, libre: stockLibre, achat: false,
      citation: resine, fiche: fi || { niv: ORDRE.map(() => 0), n: ORDRE.map(() => 0), of: 0 },
      signaux: (((S.signauxLevure || []).find((x) => x.additionId === r.additionId) || {}).signaux || []).filter((x) => !x.quantifie).map((x) => ({ titre: x.titre.split(' : ')[0], court: { 'geraniol-citronellol': 'géraniol', thiols: 'thiols', 'hop-creep': 'hop creep' }[x.id] || x.titre.split(' : ')[0], statut: x.statut })),
    };
  });
  const pb = parFam(S.profilBiereCrans);
  const cs = parFam(S.cibleStyleCrans);
  const seuil = Object.fromEntries(((S.readingSummary && S.readingSummary.voies) || []).map((v) => [v.family, v.threshold]));
  const stockMot = (v) => (v.stock.status === 'suffisant' ? 'en stock' : v.stock.status === 'manque' ? 'manque ' + virgule(v.stock.missing.reduce((s, m) => s + m.grams, 0)) + ' g' : v.stock.status);
  const verbe = { ajouter: 'Ajouter', assemblage: 'Assembler', diminuer: 'Diminuer', levure: 'Levure' };
  const momentCourt = { fwh: 'premier moût', b60: '60′', b30: '30′', b15: '15′', b10: '10′', b5: '5′', b0: '0′', wp: 'whirlpool', dryActive: 'à froid, fermentation active', dryPost: 'à froid, après' };
  const voies = voiesBrutes.map((v) => {
    const m = parFam(v.profilApresCrans);
    return {
      rang: v.rank, label: v.label, verbe: verbe[v.type] || 'Remplacer', op: v.type === 'assemblage' ? 'ajouter' : (verbe[v.type] ? v.type : 'remplacer'),
      houblons: v.actions.length ? v.actions.map((a) => a.hop) : [v.yeastChange ? v.yeastChange.toName : v.label], cles: v.actions.map((a) => a.hopKey),
      levure: v.type === 'levure', changeLevure: !!v.yeastChange,
      moment: v.actions.length ? momentCourt[v.actions[0].moment] || v.actions[0].momentLabel : 'toute la bière',
      dose: v.actions.map((a) => (a.previousGrams && !a.previousHop ? virgule(a.previousGrams) + ' → ' : '') + virgule(a.grams) + ' g').join(' + '),
      stock: v.yeastChange ? 'stock non suivi' : stockMot(v), ibuDrift: v.ibu.drift, ibuApres: v.ibu.after,
      bords: v.sideEffects.filter((e) => e.crans >= 0.5).sort((a, b) => b.crans - a.crans).map((e) => court[e.family].toLowerCase()),
      dir: v.directedEffect,
      // Suggestions, lot 6 (p10) : le changement (actions du pack), l'IBU avant, le stock, les effets de
      // bord, et l'effet sur chaque famille en tolérances du style (ecartsApres : valeur 0–100, écart en T, plage).
      type: v.type, ibuAvant: v.ibu.before, stockStatut: v.stock.status, manque: (v.stock.missing || []).reduce((t, m) => t + m.grams, 0),
      actionsP: v.actions.map((a) => ({ op: a.op, cle: a.hopKey, nom: a.hop, moment: a.moment, g: a.grams, gAvant: a.previousGrams ?? null, avantNom: a.previousHop ?? null })),
      side: (v.sideEffects || []).map((e) => ({ f: e.family, crans: e.crans })),
      ea: Object.fromEntries((v.ecartsApres || []).map((e) => [e.family, { v: e.valeur, e: e.ecart, plage: e.plage || null }])),
      faible: Object.fromEntries(Object.entries(v.directedEffect).map(([k, x]) => [k, x == null || Math.abs(x) < seuil[k]])),
      crans: ORDRE.map((f) => m[f].crans), delta: ORDRE.map((f) => m[f].deltaCrans),
      // Radar : l'après en intensité continue 0–3 (profilApresContinu), null où l'effet n'est pas établi.
      apresC: (() => { const c = parFam(v.profilApresContinu || []); return ORDRE.map((f) => (c[f] && c[f].value != null ? c[f].value : null)); })(),
    };
  });
  const sansHoublon = {};
  for (const pv of (S.voiesSansHoublon && S.voiesSansHoublon.parVariete) || []) {
    sansHoublon[pv.name] = { retirees: (pv.retirees || []).map((lb) => (voies.find((y) => y.label === lb) || {}).rang).filter(Boolean), nouvelles: (pv.nouvelles || []).map((x) => ({ rang: x.rank, label: x.label })) };
  }
  const phrase = S.readingSummary.sentence;
  const recNoms = [...new Set(lignes.map((l) => l.nom))];
  // Comparer (lot 6, controle-comparer) : la fiche de cas, Nugget de ma recette face à East Kent
  // Goldings et Fuggle, quand ma recette porte Nugget ; sinon ma recette puis les ajouts proposés.
  const comparerDefaut = recNoms.includes(CAS_COMPARER[0]) && CAS_COMPARER.every((n) => FICHES.some((f) => f.name === n)) ? CAS_COMPARER.slice()
    : [...recNoms, ...tousRapides.map((r) => r.nom).filter((n) => !recNoms.includes(n))].filter((n, k, a) => FICHES_TOUTES[n] && a.indexOf(n) === k).slice(0, 3);
  const D0 = {
    scen: id, ebullition: EBU, tables: { dureesFwh: pack.tablesIbu.dureesPremierMout, wp: pack.tablesIbu.whirlpool }, dryJours: (pack.dryHopJour && pack.dryHopJour.jours) || { min: 0, max: 14 }, nom: S.recipe.name, code: '16D', ibuStyle: st.ibu, og: virgule(S.recipe.og), ebc: S.recipe.ebc,
    ordre: ORDRE, court, long, attendues: ORDRE.filter((f) => cs[f].status === 'attendue'),
    profil: ORDRE.map((f) => ({ crans: pb[f].crans, display: pb[f].display, source: pb[f].source, approx: pb[f].approx, exact: pb[f].exact })),
    cible: ORDRE.map((f) => ({ min: cs[f].bande.min, max: cs[f].bande.max, visee: cs[f].visee ?? null, statut: cs[f].status })),
    // Échelle continue 0–3 du pack (echellesContinu) : ma bière, la zone du style, l'écart quand
    // ma bière en sort (« ×2,8 » = valeur / haut de zone), la visée posée par la direction.
    continu: (() => {
      const bc = parFam(S.profilBiereContinu || []), cc = parFam(S.cibleStyleContinu || []);
      const biere = ORDRE.map((f) => (bc[f] && bc[f].value != null ? bc[f].value : null));
      const cible = ORDRE.map((f) => (cc[f] ? { bas: cc[f].bas, haut: cc[f].haut } : { bas: 0, haut: 3 }));
      const ecart = ORDRE.map((f, i) => {
        const v = biere[i], h = cible[i].haut;
        if (v == null || !(v > h + 0.05)) return null;
        return h > 0 ? '×' + virgule(Math.round((v / h) * 10) / 10) : '+' + virgule(Math.round((v - h) * 10) / 10);
      });
      const viseeDir = Object.fromEntries((S.direction || []).map((d) => [d.family, Math.round((d.targetAbsolute / 33.33) * 10) / 10]));
      return { biere, cible, ecart, viseeDir };
    })(),
    // Ma dégustation (m4, #139) : la note perçue par famille (0 pas senti, 1 faible, 2 moyen, 3 marqué),
    // null = pas goûté ; lue dans S.tasting.axes (le 18.10 : seul le résineux, marqué).
    degustation: S.tasting ? { date: S.tasting.date.slice(8, 10) + '.' + S.tasting.date.slice(5, 7), notes: (() => {
      const ax = parFam(S.tasting.axes || []), N = { 'pas senti': 0, absent: 0, faible: 1, moyen: 2, 'marqué': 3 };
      return ORDRE.map((f) => (ax[f] && ax[f].perceived != null && N[ax[f].perceived] != null ? N[ax[f].perceived] : null));
    })() } : null,
    // Ma demande (h4) : plus (+1) ou moins (−1) par famille, depuis la direction du pack.
    direction: (S.direction || []).map((d) => ({ f: d.family, sens: Math.sign(d.crans) })),
    phrase, voiesResume: ((S.readingSummary && S.readingSummary.voies) || []).map((v) => ({ fam: v.family, texte: v.text })),
    lignes, rapides, rapidesMoment: (tousRapides[0] || {}).moment || 'b10', tousRapidesNoms: tousRapides.map((r) => r.nom),
    voies, sansHoublon, fiches: { ...FICHES_TOUTES, ...Object.fromEntries(tousRapides.map((r) => [r.nom, FICHES_TOUTES[r.nom] || r.fiche])) },
    comparerDefaut,
    // Clé du pack de chaque houblon nommé (data-houblon) : stock, ajouts proposés, fiches, recette, voies.
    cles: Object.fromEntries([
      ...pack.stock.map((x) => [x.name, x.key]),
      ...(pack.scenarios.S1.profilFiches || []).map((x) => [x.name, x.key]),
      ...tousRapides.map((x) => [x.nom, x.cle]),
      ...S.recetteHoublons.map((x) => [x.name, x.hopKey]),
      ...voiesBrutes.flatMap((v) => v.actions.map((a) => [a.hop, a.hopKey])),
      ...FICHES.filter((f) => comparerDefaut.includes(f.name)).map((f) => [f.name, f.key]),
    ]),
    groupes: Object.fromEntries([...rapides.catalogue.map((r) => [r.nom, 'catalogue']), ...pack.stock.map((x) => [x.name, x.exhausted ? 'epuise' : 'stock'])]),
    candidats: [
      ...rapides.stock.map((r) => [r.nom, 'stock']), ...rapides.epuises.map((r) => [r.nom, 'epuise']), ...rapides.catalogue.map((r) => [r.nom, 'catalogue']),
    ].filter(([n]) => !comparerDefaut.includes(n)),
    horsModele: ((S.horsModele || [])[0] || { leads: [] }).leads.map((l) => l.title),
    horsModeleFam: ((S.horsModele || [])[0] || {}).family || null,
    // Tolérances du style (D54) : bande et T par famille, ma bière en points 0–100 et en T ; la direction du pack.
    tol: S.tolerance ? { code: S.tolerance.code, familles: Object.fromEntries(S.tolerance.familles.map((f) => [f.family, { statut: f.status, apriori: f.apriori, bande: f.bande, T: f.T }])),
      biere: Object.fromEntries(S.tolerance.biere.map((b) => [b.family, { v: b.valeur, e: b.ecart, plage: b.plage || null }])) } : null,
    dirPack: (S.direction || []).map((d) => ({ f: d.family, crans: d.crans, cible: d.targetAbsolute, de: d.targetFrom })),
    levure: { nom: S.yeast.name.replace(/\s*\(.*\)\s*$/, ''), statut: S.yeast.status },
    notes: { ibu: S.ibuNote || null, profil: S.profilNote || null, voies: S.voiesNote || null },
  };
  // Radar : la roue des arômes du pack (ordre des axes). Fiche : chaque houblon nommé sur la page.
  D0.roue = pack.roueAromes.map((r) => ({ f: r.id, nom: r.nom }));
  // Substitution (u4, #137) : les remplaçants calculés du pack pour chaque houblon de ma recette (les
  // meilleurs du catalogue et du stock, substitutsCalcules : remplacants et enStock).
  D0.subst = {};
  for (const l of S.recetteHoublons || []) {
    const f = FICHES.find((x) => x.key === l.hopKey), sc = f && f.substitutsCalcules;
    if (!sc || !sc.remplacants || D0.subst[f.key]) continue;
    const cand = [...sc.remplacants, ...(sc.enStock || [])].map((r) => ({ cle: r.key, nom: r.name, score: r.score, palier: r.palier, comp: r.composantes, fiab: r.couverture ? r.couverture.fiabilite : null,
      dose: r.dose ? { g: r.dose.grams, min: r.dose.min, max: r.dose.max } : null, stock: r.stock ? r.stock.etat : null, suffisant: r.stock ? r.stock.suffisant : null, raison: r.raison, gagne: r.gagne || [], perd: r.perd || [] }))
      .filter((c, k, a) => a.findIndex((x) => x.cle === c.cle) === k);
    D0.subst[f.key] = { cle: f.key, nom: f.name, contexte: sc.contexte, poids: sc.poids, statut: sc.statut, paliers: PACK_FICHES.meta.substitution.paliers,
      ref: { moment: sc.reference.moment, quand: sc.reference.momentLabel, g: sc.reference.grams, ibu: sc.reference.ibu }, cand };
    for (const c of cand) if (!D0.cles[c.nom]) D0.cles[c.nom] = c.cle;
  }
  const cles = new Set(Object.values(D0.cles));
  D0.fichesH = Object.fromEntries(FICHES.filter((f) => cles.has(f.key)).map((f) => [f.key, ficheH(f)]));
  for (const s of Object.values(D0.subst)) for (const c of s.cand) {
    if (D0.fichesH[c.cle] || !D0.fichesH[s.cle]) continue;
    const v = VARIETES.find((x) => x.id === c.cle);
    if (v) D0.fichesH[c.cle] = ficheCatalogue(v, D0.fichesH[s.cle], c, s.ref);
  }
  return D0;
}

const commun = fs.readFileSync(path.join(HERE, 'commun.js'), 'utf8');
// Radar unique et fiche du houblon (lot 4 intégré) ; d3-shape, d3-scale et motion empaquetés par libs.mjs.
const lib = fs.readFileSync(path.join(HERE, 'lib-radar.js'), 'utf8');
// Comparer, lot 6 (comparer.js) : après la fiche, dont il reprend ROLE_MOT, ligneDe, rapideDe, stockFiche.
const radarJs = ['radar.js', 'fiche.js', 'comparer.js', 'suggestions.js', 'subst.js'].map((f) => fs.readFileSync(path.join(HERE, f), 'utf8')).join('\n');
const radarCss = ['radar.css', 'fiche.css', 'comparer.css', 'suggestions.css', 'subst.css'].map((f) => fs.readFileSync(path.join(HERE, f), 'utf8')).join('\n');
const tpl = fs.readFileSync(path.join(HERE, 'page.html'), 'utf8');
const VUES = {
  'index.html': ['S1', 'etape', '', 'barres', ''],
  'biere.html': ['S1', 'panneau', 'biere', 'barres', ''],
  'biere-radar.html': ['S1', 'panneau', 'biere', 'radar', ''],
  'biere-absolu.html': ['S1', 'panneau', 'biere', 'barres', '', 'absolu'],
  'etat-b.html': ['S1', 'panneau', 'suggestions', 'barres', 'floral,resin'],
  'suggestions-radar.html': ['S1', 'panneau', 'suggestions', 'radar', 'floral,resin'],
  'comparer.html': ['S1', 'panneau', 'comparer', 'barres', ''],
  'comparer-radar.html': ['S1', 'panneau', 'comparer', 'radar', ''],
  'cas-k2.html': ['S4', 'etape', '', 'barres', ''],
  'cas-k3.html': ['S5', 'etape', '', 'barres', ''],
  'cas-ebu45.html': ['S1E45', 'etape', '', 'barres', ''],
  'cas-ebu120.html': ['S1E120', 'etape', '', 'barres', ''],
  'cas-ebu200.html': ['S1E200', 'etape', '', 'barres', ''],
  // L'étape, la fiche de Nugget ouverte (appui long déjà fait).
  'fiche.html': ['S1', 'etape', '', 'barres', '', '', 'beermaverick-nugget'],
  // Substitution (u4) : les remplaçants de Nugget, ouverts depuis sa fiche (« Substituts »).
  'substitution.html': ['S1', 'substitution', '', 'barres', '', '', '', 'beermaverick-nugget'],
};
const DATA = Object.fromEntries(['S1', 'S4', 'S5', 'S1E45', 'S1E120', 'S1E200'].map((s) => [s, scenario(s)]));
const TITRES = { consolide: 'Houblons, rail du brassage' };
for (const id of ['consolide']) {
  const variante = fs.readFileSync(path.join(HERE, 'etape-' + id + '.js'), 'utf8');
  const css = fs.readFileSync(path.join(HERE, 'etape-' + id + '.css'), 'utf8');
  fs.mkdirSync(path.join(OUT, id), { recursive: true });
  for (const [f, [scen, vue, partie, lentille, dirs, echelle, ficheInit, subst]] of Object.entries(VUES).filter(([f]) => !PAGES.length || PAGES.includes(f))) {
    const html = tpl
      .replace('@TITRE@', TITRES[id])
      .replace('/*@CSS@*/', () => css + '\n' + radarCss)
      .replace('/*@LIB@*/', () => lib)
      .replace('/*@DATA@*/', () => 'const D = ' + JSON.stringify(DATA[scen]) + ';')
      .replace('/*@COMMUN@*/', () => commun)
      .replace('/*@VARIANTE@*/', () => variante + '\n' + radarJs)
      .replace('@BODY@', `data-variante="${id}" data-vue="${vue}" data-ouvre="${partie}" data-lentille="${lentille}" data-dirs="${dirs}" data-echelle="${echelle || ''}"` + (ficheInit ? ` data-fiche-init="${ficheInit}"` : '') + (subst ? ` data-subst="${subst}"` : ''));
    fs.writeFileSync(path.join(OUT, id, f), html);
  }
  console.log(id, 'écrit');
}
console.log('S1 rapides stock :', DATA.S1.rapides.stock.map((r) => r.nom + (r.effet ? ' (voie ' + r.effet.rang + ')' : '')).join(', '));
console.log('S1 comparer :', DATA.S1.comparerDefaut.join(', '), '; signaux S5 :', JSON.stringify(DATA.S5.lignes.map((l) => l.signaux)));
