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

const FICHES = JSON.parse(fs.readFileSync(ROOT + '/prototypes/houblons-v4/data/pack-fiches.json', 'utf8')).fichesHoublons;
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
// Fiches des houblons (citations) : propriété du houblon, communes à tous les scénarios.
const S1 = pack.scenarios.S1;
const FICHES_TOUTES = Object.fromEntries([
  ...[...S1.ajoutsRapides.disponibles, ...S1.ajoutsRapides.epuises, ...(S1.ajoutsRapides.catalogue || [])].map((a) => [a.name, ficheDeCited(a.cited)]),
  ...Object.entries(fiches(S1)),
]);

function scenario(id) {
  const S = pack.scenarios[id];
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
    ibuPG: ibuPG(a.ibuParMoment), libre: Math.max(0, a.stock.free), statut: a.stock.status,
    fiche: F[a.name] || ficheDeCited(a.cited), effet: effetDe(a.key, a.moment, a.dose.grams),
    alpha: alphaDe(a, a.key, a.name), role: roleDe(a),
  });
  const AR = S.ajoutsRapides;
  // Mode « construction » (recette vide) : 1 ou 2 amérisants à 60′ au choix, puis des aromatiques.
  const construit = (a, alternative) => ({
    cle: a.key, nom: a.name, groupe: /hors stock|acheter/.test(a.stock.etat || '') ? 'catalogue' : /épuis/.test(a.stock.etat || '') ? 'epuise' : 'stock',
    moment: a.moment, g: a.dose.grams, ibu: a.ibu ? a.ibu.value : null, ibuPG: {}, libre: Math.max(0, a.stock.libre || 0),
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
      ibuPG: pg, ibu0: { moment: r.moment, g: r.grams, v: ibu0 }, libre: stockLibre, achat: false,
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
      faible: Object.fromEntries(Object.entries(v.directedEffect).map(([k, x]) => [k, x == null || Math.abs(x) < seuil[k]])),
      crans: ORDRE.map((f) => m[f].crans), delta: ORDRE.map((f) => m[f].deltaCrans),
    };
  });
  const sansHoublon = {};
  for (const pv of (S.voiesSansHoublon && S.voiesSansHoublon.parVariete) || []) {
    sansHoublon[pv.name] = { retirees: (pv.retirees || []).map((lb) => (voies.find((y) => y.label === lb) || {}).rang).filter(Boolean), nouvelles: (pv.nouvelles || []).map((x) => ({ rang: x.rank, label: x.label })) };
  }
  const phrase = S.readingSummary.sentence;
  const recNoms = [...new Set(lignes.map((l) => l.nom))];
  const comparerDefaut = [...recNoms, ...tousRapides.map((r) => r.nom).filter((n) => !recNoms.includes(n))].filter((n, k, a) => FICHES_TOUTES[n] && a.indexOf(n) === k).slice(0, 3);
  return {
    scen: id, nom: S.recipe.name, code: '16D', ibuStyle: st.ibu, og: virgule(S.recipe.og), ebc: S.recipe.ebc,
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
    degustation: S.tasting ? { date: S.tasting.date.slice(8, 10) + '.' + S.tasting.date.slice(5, 7) } : null,
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
    ]),
    groupes: Object.fromEntries([...rapides.catalogue.map((r) => [r.nom, 'catalogue']), ...pack.stock.map((x) => [x.name, x.exhausted ? 'epuise' : 'stock'])]),
    candidats: [
      ...rapides.stock.map((r) => [r.nom, 'stock']), ...rapides.epuises.map((r) => [r.nom, 'epuise']), ...rapides.catalogue.map((r) => [r.nom, 'catalogue']),
    ].filter(([n]) => !comparerDefaut.includes(n)),
    horsModele: ((S.horsModele || [])[0] || { leads: [] }).leads.map((l) => l.title),
    levure: { nom: S.yeast.name.replace(/\s*\(.*\)\s*$/, ''), statut: S.yeast.status },
    notes: { ibu: S.ibuNote || null, profil: S.profilNote || null, voies: S.voiesNote || null },
  };
}

const commun = fs.readFileSync(path.join(HERE, 'commun.js'), 'utf8');
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
};
const DATA = { S1: scenario('S1'), S4: scenario('S4'), S5: scenario('S5') };
const TITRES = { consolide: 'Houblons, rail du brassage' };
for (const id of ['consolide']) {
  const variante = fs.readFileSync(path.join(HERE, 'etape-' + id + '.js'), 'utf8');
  const css = fs.readFileSync(path.join(HERE, 'etape-' + id + '.css'), 'utf8');
  fs.mkdirSync(path.join(OUT, id), { recursive: true });
  for (const [f, [scen, vue, partie, lentille, dirs, echelle]] of Object.entries(VUES).filter(([f]) => !PAGES.length || PAGES.includes(f))) {
    const html = tpl
      .replace('@TITRE@', TITRES[id])
      .replace('/*@CSS@*/', () => css)
      .replace('/*@DATA@*/', () => 'const D = ' + JSON.stringify(DATA[scen]) + ';')
      .replace('/*@COMMUN@*/', () => commun)
      .replace('/*@VARIANTE@*/', () => variante)
      .replace('@BODY@', `data-variante="${id}" data-vue="${vue}" data-ouvre="${partie}" data-lentille="${lentille}" data-dirs="${dirs}" data-echelle="${echelle || ''}"`);
    fs.writeFileSync(path.join(OUT, id, f), html);
  }
  console.log(id, 'écrit');
}
console.log('S1 rapides stock :', DATA.S1.rapides.stock.map((r) => r.nom + (r.effet ? ' (voie ' + r.effet.rang + ')' : '')).join(', '));
console.log('S1 comparer :', DATA.S1.comparerDefaut.join(', '), '; signaux S5 :', JSON.stringify(DATA.S5.lignes.map((l) => l.signaux)));
