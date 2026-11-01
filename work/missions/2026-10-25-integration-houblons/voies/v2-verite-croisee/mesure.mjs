// v2-verite-croisee (31.10) : mesure de la couverture croisée. Lecture seule : rien n'est écrit hors de cette voie (mesures.json).
// Lancement depuis la racine : node work/missions/2026-10-25-integration-houblons/voies/v2-verite-croisee/mesure.mjs
import fs from 'node:fs';
import path from 'node:path';
import { analyser, lireSources, lireTable, SOURCES_NOMS, cleFiche } from '../../../../../src/data/hopV4/rattachement.mjs';

const R = process.cwd();
const lire = (p) => JSON.parse(fs.readFileSync(path.join(R, p), 'utf8'));
const OUT = 'work/missions/2026-10-25-integration-houblons/voies/v2-verite-croisee/mesures.json';

const proto = lire('src/data/hopV4/proto-data.json');
const ajouts = lire('src/data/hopV4/catalogue-ajouts.json');
const comp = lire('src/data/hopV4/complements.json');
const base = proto.varieties; // 317 variétés « Beer Maverick »
const tous = [...base, ...ajouts.varieties]; // 505
const idsBase = new Set(base.map((v) => v.id));

// ───────── Beer Analytics (21e source) ─────────
const dirSrc = path.join(R, 'src/data/hopSources');
const lettres = fs.readdirSync(dirSrc).filter((f) => /^beeranalytics-[A-Z]\.json$/.test(f)).sort();
const baFiches = lettres.flatMap((f) => JSON.parse(fs.readFileSync(path.join(dirSrc, f), 'utf8')).fiches);

// ───────── Identité : la décision de rattachement actuelle (20 sources), puis avec Beer Analytics ─────────
const table = lireTable();
const catalogue = base.map((v) => ({ id: v.id, name: v.name, aliases: v.aliases ?? [], origin: v.origin }));
const src20 = lireSources(SOURCES_NOMS);
const A = analyser(src20, catalogue, table);
const src21 = new Map(src20); src21.set('beeranalytics', baFiches);
const B = analyser(src21, catalogue, table);

const viaCompte = {};
let nbFiches = 0, avecVarietyId = 0, rattacheSansId = 0, nouvelleVar = 0, nonRattache = 0;
for (const [sid, fiches] of src20) {
  fiches.forEach((f, i) => {
    nbFiches++;
    const d = A.decisions.get(cleFiche(sid, i));
    if (f.varietyId) avecVarietyId++;
    const k = d?.id ? (d.via === 'collecte' ? 'collecte (varietyId d\'origine, tous beermaverick-*)' : d.via === 'nouvelle variété' ? 'nouvelle variété (sources-*)' : `par nom ou alias (${d.via.split(' (')[0]})`) : `non rattachée : ${d?.statut ?? 'inconnu'}`;
    viaCompte[k] = (viaCompte[k] ?? 0) + 1;
    if (d?.id && d.via !== 'collecte' && d.via !== 'nouvelle variété') rattacheSansId++;
    if (d?.via === 'nouvelle variété') nouvelleVar++;
    if (!d?.id) nonRattache++;
  });
}

// sources par variété (identifiant de variété → ensemble d'identifiants de source), avec et sans Beer Analytics
function sourcesParVariete(dec, sources) {
  const m = new Map();
  for (const [sid, fiches] of sources) fiches.forEach((f, i) => {
    const d = dec.get(cleFiche(sid, i));
    if (!d?.id) return;
    const s = m.get(d.id) ?? new Set(); m.set(d.id, s); s.add(sid);
  });
  return m;
}
const spv20 = sourcesParVariete(A.decisions, src20);
const spv21 = sourcesParVariete(B.decisions, src21);
const idsToutes20 = [...base.map((v) => v.id), ...A.nouvelles.map((n) => n.id)];
const dist = (valeurs) => { const o = { 0: 0, 1: 0, 2: 0, 3: 0, '4+': 0 }; for (const n of valeurs) o[n >= 4 ? '4+' : n]++; return o; };
const nb = (spv, id) => spv.get(id)?.size ?? 0;
// « sources » hors Brewer's Friend (index sans valeur chimique) comme c6 (nbSources)
const nbHorsBF = (spv, id) => [...(spv.get(id) ?? [])].filter((s) => s !== 'brewersfriend').length;

const identite = {
  variétésBase: base.length, ajoutsFichier: ajouts.varieties.length, nouvellesParLAnalyseur: A.nouvelles.length, aConfirmer: A.aConfirmer.length,
  fichesTotal: nbFiches, fichesAvecVarietyIdDeLaCollecte: avecVarietyId, rattachementParFiche: viaCompte, nonRattachees: nonRattache,
  baseParNombreDeSources20: dist(base.map((v) => nb(spv20, v.id))),
  baseParNombreDeSources21: dist(base.map((v) => nb(spv21, v.id))),
  ajoutsParNombreDeSources20: dist(A.nouvelles.map((n) => nb(spv20, n.id))),
  ajoutsParNombreDeSources21: dist(B.nouvelles.map((n) => nb(spv21, n.id))),
  toutesParNombreDeSources21: dist([...base.map((v) => v.id), ...B.nouvelles.map((n) => n.id)].map((id) => nb(spv21, id))),
  baseSansAucuneAutreSource20: base.filter((v) => nb(spv20, v.id) === 0).length,
  baseSansAucuneAutreSource21: base.filter((v) => nb(spv21, v.id) === 0).length,
  nouvellesAvecBeerAnalytics: B.nouvelles.length, nouvellesAjoutéesParBA: B.nouvelles.length - A.nouvelles.length,
  nouvellesUneSeuleSourceHorsBF20: A.nouvelles.filter((n) => nbHorsBF(spv20, n.id) <= 1).length,
  nouvellesUneSeuleSourceHorsBF21: B.nouvelles.filter((n) => nbHorsBF(spv21, n.id) <= 1).length,
  fichesParSource: Object.fromEntries([...src21].map(([s, f]) => [s, f.length])),
};
// variétés de la base dont l'identité ne tient qu'à Beer Maverick + au plus une source
identite.baseSeule1ou0 = base.filter((v) => nbHorsBF(spv21, v.id) <= 1).length;

// ───────── Champs chimiques : complements.json (18 sources) + Beer Maverick (catalogue) ─────────
const nomSrc = comp.sources.map((s) => s.id);
const sourceDeFiche = (vid, k) => nomSrc[comp.varietes[vid].f[k][0]];
const CHAMPS = ['alpha', 'beta', 'cohumulone', 'huile', 'myrcene', 'linalol'];
const bmVal = (v, c) => (c === 'alpha' ? v.alpha : c === 'beta' ? v.beta : c === 'huile' ? v.oil : c === 'cohumulone' ? v.cohumulone : c === 'myrcene' ? v.oils?.myrcene : null); // linalol : Beer Maverick ne le publie pas (« autres huiles »)
const hsVal = (v, c) => (c === 'alpha' ? v.hs?.alpha : c === 'beta' ? v.hs?.beta : c === 'huile' ? v.hs?.totalOil : c === 'linalol' ? v.hsLinalool?.range : null);
const mid = (a, b) => (a != null && b != null ? (a + b) / 2 : a ?? b);
const med = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
const q = (xs, p) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);
// Classes de source (voir RESULTAT.md) ; « primaires » = ni agrégat ni copie
const AGREGATS = new Set(['hopdatabase', 'hopsjson', 'hopslist']);

const chimie = {};
for (const c of CHAMPS) {
  const comptes = []; // par variété : nombre de sources distinctes à valeur valide (+ BM)
  const comptesSansBM = [], comptesPrimaires = [];
  const ecartAbs = [], ecartRel = [], ecartsBM = [], ecartsBMRel = [], bmHorsLesAutres = [];
  let nbValides = 0, nbHors = 0, nbSuspectes = 0;
  const parSource = {};
  for (const v of tous) {
    const e = comp.varietes[v.id];
    const lesValeurs = e?.c?.[c]?.v ?? [];
    const parSrc = new Map(); // source → mids
    for (const [k, mn, mx, raison] of lesValeurs) {
      const s = sourceDeFiche(v.id, k);
      if (raison?.startsWith('h-')) { nbHors++; continue; }
      if (raison?.startsWith('s-')) { nbSuspectes++; continue; }
      const m = mid(mn, mx);
      if (m == null) continue;
      nbValides++;
      const l = parSrc.get(s) ?? []; parSrc.set(s, l); l.push(m);
      parSource[s] = (parSource[s] ?? 0) + 1;
    }
    const bm = bmVal(v, c) ?? null;
    // Hopsteiner du catalogue = la source « hopsteiner » des compléments (même fiche) : on ne le compte pas deux fois
    const nSrc = parSrc.size;
    const aBM = !!bm && idsBase.has(v.id);
    comptes.push(nSrc + (aBM ? 1 : 0));
    comptesSansBM.push(nSrc);
    comptesPrimaires.push([...parSrc.keys()].filter((s) => !AGREGATS.has(s)).length + (aBM ? 1 : 0));
    const mids = [...parSrc.values()].map((l) => l.reduce((a, b) => a + b, 0) / l.length);
    const tousMids = aBM ? [...mids, mid(bm[0], bm[1])] : mids;
    if (tousMids.length >= 2) {
      const sp = Math.max(...tousMids) - Math.min(...tousMids), mo = tousMids.reduce((a, b) => a + b, 0) / tousMids.length;
      ecartAbs.push(sp); if (mo > 0) ecartRel.push(sp / mo);
    }
    // Beer Maverick contre la médiane des autres sources (au moins 2 autres)
    if (aBM && mids.length >= 2) {
      const mb = mid(bm[0], bm[1]), md = med(mids);
      ecartsBM.push(mb - md); if (md > 0) ecartsBMRel.push((mb - md) / md);
      bmHorsLesAutres.push(mb < Math.min(...mids) || mb > Math.max(...mids) ? 1 : 0);
    }
  }
  const stat = (xs) => ({ n: xs.length, médiane: r2(med(xs)), p75: r2(q(xs, 0.75)), p90: r2(q(xs, 0.9)) });
  chimie[c] = {
    variétésAvecAuMoinsUneValeur: comptes.filter((n) => n >= 1).length,
    sourcesParVariété: dist(comptes), sourcesParVariétéSansBM: dist(comptesSansBM), sourcesPrimairesParVariété: dist(comptesPrimaires),
    écartEntreSourcesAbsolu: stat(ecartAbs), écartEntreSourcesRelatif: stat(ecartRel),
    valeurs: { valides: nbValides, horsEnveloppe_h: nbHors, suspectes_s: nbSuspectes },
    beerMaverickContreMédianeDesAutres: { n: ecartsBM.length, écartMoyenSigné: r2(ecartsBM.length ? ecartsBM.reduce((a, b) => a + b, 0) / ecartsBM.length : null), écartAbsMédian: r2(med(ecartsBM.map(Math.abs))), écartAbsP90: r2(q(ecartsBM.map(Math.abs), 0.9)), relatifAbsMédian: r2(med(ecartsBMRel.map(Math.abs))), partHorsDeLEnveloppeDesAutres: r2(bmHorsLesAutres.length ? bmHorsLesAutres.reduce((a, b) => a + b, 0) / bmHorsLesAutres.length : null) },
    valeursParSource: parSource,
  };
}

// ───────── Mots (descripteurs) ─────────
const dsrc = proto.descSources;
const motsParVar = (v, descSources) => {
  const auteurs = new Set();
  for (const d of v.descriptions ?? []) auteurs.add(d.source.author);
  for (const f of v.fiches ?? []) auteurs.add(descSources[f[0]][0]);
  return auteurs;
};
const mots = { base: [], ajouts: [], parAuteur: {} };
for (const v of base) { const a = motsParVar(v, dsrc); if ((v.tags ?? []).length === 0) a.delete('Beer Maverick'); mots.base.push(a.size); for (const x of a) mots.parAuteur[x] = (mots.parAuteur[x] ?? 0) + 1; }
for (const v of ajouts.varieties) { const a = motsParVar(v, ajouts.descSources); mots.ajouts.push(a.size); }
const motsRes = {
  base: dist(mots.base), ajouts: dist(mots.ajouts), toutes: dist([...mots.base, ...mots.ajouts]),
  baseAvecMotsBMSeuls: base.filter((v, i) => mots.base[i] === 1 && (v.tags ?? []).length > 0).length,
  baseSansAucunMot: mots.base.filter((n) => n === 0).length,
  auteursDeMots: mots.parAuteur,
};

// ───────── Usage ─────────
const aUsage = new Map(); // id variété → Set de sources qui disent l'usage
const poseU = (id, s) => { if (!id) return; const x = aUsage.get(id) ?? new Set(); aUsage.set(id, x); x.add(s); };
for (const v of base) { if (v.purpose) poseU(v.id, 'beermaverick (purpose)'); if ((v.usage ?? []).some((u) => u.roles?.length)) poseU(v.id, 'hopStyleUsageBootstrap (rôles fournisseur, IPA)'); }
const usageNonVide = (f, sid) => {
  const l = f.listes ?? {};
  if (sid === 'hopslist') return !!f.categorie || (l.usage?.length > 0);
  if (sid === 'hopsjson') return !!f.codeUsage;
  if (sid === 'johnihaas' || sid === 'hopdatabase' || sid === 'yakimavalleyhops' || sid === 'nzhops') return Array.isArray(l.usage) ? l.usage.length > 0 : !!l.usage;
  if (sid === 'brewersfriend') return (f.formes ?? []).length > 0;
  return false;
};
for (const [sid, fiches] of src21) fiches.forEach((f, i) => {
  const d = B.decisions.get(cleFiche(sid, i));
  if (!d?.id) return;
  if (sid === 'beeranalytics') { if (f.stats?.['usage-types']?.parMoment?.length || f.categorie) poseU(d.id, 'beeranalytics (recettes par moment)'); return; }
  if (usageNonVide(f, sid)) poseU(d.id, sid);
});
const idsToutes21 = [...base.map((v) => v.id), ...B.nouvelles.map((n) => n.id)];
const usageParVar = idsToutes21.map((id) => aUsage.get(id)?.size ?? 0);
const usage = { toutes: dist(usageParVar), sourcesDUsage: {} };
for (const s of aUsage.values()) for (const x of s) usage.sourcesDUsage[x] = (usage.sourcesDUsage[x] ?? 0) + 1;
usage.baseAvecBMSeul = base.filter((v) => { const s = aUsage.get(v.id); return s && s.size === 1 && s.has('beermaverick (purpose)'); }).length;
usage.variétésAvecUsageBM = base.filter((v) => v.purpose).length;
// accord entre l'étiquette BM et la catégorie de Beer Analytics
const baCat = new Map();
baFiches.forEach((f, i) => { const d = B.decisions.get(cleFiche('beeranalytics', i)); if (d?.id && f.categorie) baCat.set(d.id, f.categorie); });
const jointure = {};
for (const v of base) { if (!v.purpose || !baCat.has(v.id)) continue; const k = `${v.purpose}|BA:${baCat.get(v.id)}`; jointure[k] = (jointure[k] ?? 0) + 1; }
usage.accordBMContreBeerAnalytics = jointure;

// ───────── Données déclarées par les recettes : α des recettes (Beer Analytics) et Brewer's Friend ─────────
const recAlpha = [], recDiff = [], bfDiff = [];
const baAlphaDe = new Map();
baFiches.forEach((f, i) => { const d = B.decisions.get(cleFiche('beeranalytics', i)); const a = f.champs?.alphaDesRecettes; if (d?.id && a?.milieu != null) baAlphaDe.set(d.id, { mid: a.milieu, min: a.min, max: a.max, recettes: f.champs?.recettes?.valeur ?? null }); });
const bfAlphaDe = new Map();
(src21.get('brewersfriend') ?? []).forEach((f, i) => { const d = B.decisions.get(cleFiche('brewersfriend', i)); if (!d?.id) return; const vs = (f.formes ?? []).map((x) => x.alphaMoyenRecettes?.valeur).filter((x) => x != null); if (vs.length) { const l = bfAlphaDe.get(d.id) ?? []; bfAlphaDe.set(d.id, l); l.push(...vs); } });
for (const v of tous) {
  const e = comp.varietes[v.id]?.c?.alpha?.v ?? [];
  const mids = []; const seen = new Set();
  for (const [k, mn, mx, raison] of e) { if (raison) continue; const s = sourceDeFiche(v.id, k); if (s === 'brewersfriend') continue; const m = mid(mn, mx); if (m != null) { mids.push(m); seen.add(s); } }
  const bm = idsBase.has(v.id) && v.alpha ? mid(v.alpha[0], v.alpha[1]) : null;
  const ref = mids.length >= 2 ? med(mids) : null;
  const ba = baAlphaDe.get(v.id);
  if (ba) recAlpha.push(v.id);
  if (ba && ref != null) recDiff.push(ba.mid - ref);
  const bf = bfAlphaDe.get(v.id);
  if (bf && ref != null) bfDiff.push(bf.reduce((a, b) => a + b, 0) / bf.length - ref);
}
const recettes = {
  variétésAvecAlphaDesRecettesBA: baAlphaDe.size, variétésAvecAlphaMoyenBrewersFriend: bfAlphaDe.size,
  baMoinsMédianeDesSources: { n: recDiff.length, moyenneSignée: r2(recDiff.reduce((a, b) => a + b, 0) / (recDiff.length || 1)), absMédian: r2(med(recDiff.map(Math.abs))), absP90: r2(q(recDiff.map(Math.abs), 0.9)) },
  bfMoinsMédianeDesSources: { n: bfDiff.length, moyenneSignée: r2(bfDiff.reduce((a, b) => a + b, 0) / (bfDiff.length || 1)), absMédian: r2(med(bfDiff.map(Math.abs))), absP90: r2(q(bfDiff.map(Math.abs), 0.9)) },
  variétésBAavecRecettes1000: [...baAlphaDe.values()].filter((x) => (x.recettes ?? 0) >= 1000).length,
  variétésBAavecRecettes100: [...baAlphaDe.values()].filter((x) => (x.recettes ?? 0) >= 100).length,
};

// ───────── Typicité et radar ─────────
const typ = lire('src/data/hopV4/typicite-styles.json');
const radar = { avecRadarBM: base.filter((v) => v.bm?.arome && v.bm.arome.some((x) => x > 0)).length, sansRadar: base.filter((v) => !(v.bm?.arome && v.bm.arome.some((x) => x > 0))).length, ajoutsAvecRadar: 0 };
const typicite = { houblonsLusBA: typ.couverture?.houblonsLus, avecGraphique: typ.couverture?.houblonsAvecGraphique, variétésAvecParAuFrais: Object.keys(typ.auFrais?.parts ?? {}).length, variétésAvecRecettes: Object.keys(typ.recettes ?? {}).length };

fs.writeFileSync(path.join(R, OUT), JSON.stringify({ identite, chimie, mots: motsRes, usage, recettes, radar, typicite }, null, 1));
console.log(JSON.stringify({ identite, mots: motsRes, usage, recettes, radar, typicite }, null, 1));
for (const c of CHAMPS) {
  const x = chimie[c];
  console.log(`\n== ${c} : variétés avec au moins une valeur ${x.variétésAvecAuMoinsUneValeur}`);
  console.log(' sources (BM compris)', JSON.stringify(x.sourcesParVariété), ' sans BM', JSON.stringify(x.sourcesParVariétéSansBM), ' primaires', JSON.stringify(x.sourcesPrimairesParVariété));
  console.log(' écart abs', JSON.stringify(x.écartEntreSourcesAbsolu), ' rel', JSON.stringify(x.écartEntreSourcesRelatif));
  console.log(' valeurs', JSON.stringify(x.valeurs), ' BM vs autres', JSON.stringify(x.beerMaverickContreMédianeDesAutres));
}
