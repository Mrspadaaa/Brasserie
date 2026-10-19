// Pack de données commun aux mini-prototypes : tous les chiffres sortent du moteur (V5.5 importé
// + ajouts v4). JSON simple, déterministe (aucune horloge), relu par tests/pack.test.ts.
import { HOP_RECIPE_ENGINE_VERSION } from '@functions/hopRecipePrediction';
import {
  CATALOGUE, FAMILIES, FAMILY_NAMES, REFERENCE, SCALE_PARAMETERS, STOCK, STOCK_SOURCE, gapVerdict, getStyleScale, hopProfile, hopRef, valueVerdict,
  proposeVoies, styleFit, trackShare, tastingFrom, situateBeer, offModelLeads, TASTING_USAGE, readBeer, readingSummary, voiesSummary, gapSummary, quickAdds, ibuByMoment, momentCatalogue,
  beerLevels, targetLevels, afterLevels, ficheLevels, recipeProfile, LEVEL_RULE, recipeIbu, loadedRecipe, recipeLines, LOADED_RECIPE_RULE,
  shoppingList, NO_GOUTS, GOUTS_RULE, beerCrans, targetCrans, afterCrans, CRANS_RULE, yeastDoubleImpact, yeastSignals,
  SUBSTITUTION_METHOD, SUBSTITUTION_RANKING, SUBSTITUTION_WEIGHTS, SUBSTITUTION_PALIERS, oilScales,
  toleranceScale, ecartTolerances, TOLERANCE_RULE, afterLevelsDelta, ROUE_AROMES, hopSheet, sheetKeys, hopAlpha, hopRole, buildFromEmpty, ibuTables, TABLES_RULE, DRY_HOP_DAY, MINUTES_5, BOIL_LENGTHS, WP_TEMPERATURES, WP_MINUTES, densityFactors, beerContinuous, targetContinuous, afterContinuous, CONTINU_RULE,
  type FamilyEstimate, type FamilyId, type HopProfile, type Profile, type Recipe, type StyleScale, type Voie, type FicheLevel,
} from '../engine';
import facts from '../../data/faits-cites.json';

export const PACK_DATE = '2026-10-18';
export const PACK_STYLES = ['16D', '3A', '3B', '21A'] as const;
export const CATALOGUE_IDS = {
  '16D': ['challenger', 'northdown', 'northern-brewer-gr', 'willamette', 'bramling-cross', 'first-gold', 'golding', 'admiral'],
  '3A': ['saaz-cz', 'styrian-golding', 'hallertau-mittelfruh', 'tettnanger', 'spalt', 'perle-gr', 'hersbrucker', 'hallertau-tradition'],
  '21A': ['mosaic', 'centennial', 'amarillo', 'columbus', 'chinook', 'el-dorado', 'strata', 'citra', 'azacca'],
} as const;

/** Recette S1 : stout export du brasseur (20 L, DI 1,066, Nugget à 60′). Levure SafAle US-05,
 * celle de sa stout de régression (tests/fixtures/monSuperStout.ts) ; couleur 70 EBC, milieu de
 * la plage BJCP 16D (30–40 SRM). Dose de Nugget : IBU au milieu de la plage du style (60). */
export function s1Recipe(): Recipe {
  return { name: 'Stout export', styleCode: '16D', volumeL: 20, og: 1.066, boilMin: 60, yeastId: 'fermentis-us05', ebc: 70,
    additions: [{ id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 46 }] };
}
export const S1_DIRECTION = { floral: 1, resin: -1 } as const;
/** Recette S2 pour l'ajout rapide : lager tchèque premium 3B, 20 L, DI 1,052 (milieu de 1,044–1,060),
 * levure LalBrew Diamond, encore sans houblon. */
export function s2Recipe(): Recipe {
  return { name: 'Lager tchèque premium', styleCode: '3B', volumeL: 20, og: 1.052, boilMin: 60, yeastId: 'lalbrew-diamond', additions: [] };
}
/** Ce que le brasseur a dit lui-même (brief v4, § 1, 18.10.2026) : « trop résineuses » → résine marquée.
 * « je la veux plus floral » est une direction, pas un niveau perçu : floral reste null. */
export const S1_TASTING = tastingFrom({ resin: 'marqué' }, {
  origin: 'parole du brasseur', date: '2026-10-18',
  quote: 'ma stout est trop résineuses, je la veux plus floral',
  source: 'Phrase du brasseur du 18.10.2026 (work/refonte-frontend/v4/brief-v4.md, § 1) : « trop résineuses ».',
});

type PackEstimate = { status: 'inconnu' } | { status: 'estimé'; min: number; max: number; central?: number; confidence: string; completeDomain?: true; display?: 'non situé' };
// display « non situé » : plage pleine (0–100) ou plage partant de 0 sans repère central ; la vue
// n'affiche pas la plage. Les champs min et max restent pour la traçabilité.
const est = (e: FamilyEstimate): PackEstimate => e.status === 'inconnu' || !e.range ? { status: 'inconnu' }
  : { status: 'estimé', min: e.range.min, max: e.range.max, ...(e.central !== undefined ? { central: e.central } : {}), confidence: e.confidence,
    ...(e.completeDomain ? { completeDomain: true as const } : {}), ...(!e.situated ? { display: 'non situé' as const } : {}) };
const profile = (p: Profile) => Object.fromEntries(FAMILIES.map((f) => [f, est(p[f])]));
const hopEntry = (h: HopProfile) => ({
  key: h.key, name: h.name, origin: h.origin, alpha: h.alpha ? { value: h.alpha.value, min: h.alpha.min, max: h.alpha.max, from: h.alpha.from } : null,
  profile: Object.fromEntries(FAMILIES.map((f) => [f, { ...est(h.families[f]), citation: h.families[f].citation, description: h.families[f].description }])),
  descriptors: h.descriptors,
});

function styleEntry(s: StyleScale) {
  return {
    code: s.code, id: s.id, name: s.name, documented: s.documented, url: s.url, ibu: s.ibu, overall: s.overall, order: s.order,
    thresholdFraction: SCALE_PARAMETERS.thresholdFraction, cranFraction: SCALE_PARAMETERS.cranFraction,
    families: Object.fromEntries(FAMILIES.map((f) => {
      const x = s.families[f];
      return [f, { status: x.status, band: x.band, width: x.width, domain: x.domain, cran: round(x.cran), threshold: round(x.threshold), sources: x.quotes }];
    })),
  };
}
const round = (x: number, n = 1) => Math.round(x * 10 ** n) / 10 ** n;
/** Durée d'ébullition de la recette et sa source (S1 : recette du prototype, reprise de la v3 à 60 min). */
const boilOf = (r: Recipe) => ({ ebullitionMinutes: r.boilMin,
  ebullitionSource: r.boilMin === 60 ? 'recette S1 du prototype (v3 : ébullition de 60 min) ; aucune durée propre à cette recette dans le dépôt' : `variante de la recette S1 : ébullition de ${r.boilMin} min`,
  ebullitionNote: 'Valeur de départ seulement : la durée se règle sur l’étape par pas de 5′ (tables de 5 à 240 min).' });
/** Tables d'IBU d'un ajout à sa dose (ibuTables), avec le whirlpool nommé ibuWhirlpool. */
const tablesOf = (key: string, grams: number | null, r: Recipe) => { const { whirlpool, ...t } = ibuTables(key, grams, r); return { ...t, ibuWhirlpool: whirlpool }; };
type WithDose = { key: string; dose: { grams: number } | null };
const withTablesQ = <T extends Record<string, unknown>>(q: T, r: Recipe): T => Object.fromEntries(Object.entries(q).map(([k, v]) =>
  [k, ['disponibles', 'amerisants', 'aromatiques'].includes(k) && Array.isArray(v) ? (v as WithDose[]).map((e) => ({ ...e, ...tablesOf(e.key, e.dose?.grams ?? null, r) })) : v])) as T;
/** Fiche compacte : niveau 0 non décrit, 1 cité, 2 marqué ; « sources sur of » fiches. Nom et statut : voir families et cibleStyle. */
const compactFiche = ({ family, level, sources, of }: FicheLevel) => ({ family, level, sources, of });

function voieEntry(v: Voie, directed: FamilyId[]) {
  return {
    rank: v.rank, type: v.type, label: v.label, domain: v.domain, estimated: v.estimated, estimatedWhy: v.estimatedWhy,
    actions: v.actions.map((a) => ({ op: a.op, hopKey: a.hopKey, hop: a.hopName, moment: a.moment, momentLabel: a.momentLabel, grams: a.grams, gramsPerLitre: a.gramsPerLitre,
      ...(a.previousGrams !== undefined ? { previousGrams: a.previousGrams } : {}), ...(a.previousHopKey ? { previousHop: hopRef(a.previousHopKey)?.name ?? a.previousHopKey } : {}) })),
    conflicts: v.conflicts,
    distance: v.distance,
    effect: Object.fromEntries(FAMILIES.map((f) => [f, v.effect[f].central === null ? { established: false } : { central: v.effect[f].central, established: true, ...(v.effect[f].partial ? { partial: true } : {}) }])),
    directedEffect: Object.fromEntries(directed.map((f) => [f, v.effect[f].central])),
    ibu: v.ibu,
    stock: v.stock,
    styleOverflow: v.styleOverflow, overflowTotal: v.overflowTotal,
    sideEffects: v.sideEffects, sideTotal: v.sideTotal,
    tieWith: v.tieWith,
    ...(v.yeastChange ? { yeastChange: v.yeastChange } : {}),
    ...(v.type === 'levure' && v.actions[0]?.moment === 'dryActive' ? { signauxLevure: yeastSignals({ id: v.actions[0].additionId, hopKey: v.actions[0].hopKey, moment: 'dryActive', grams: v.actions[0].grams }, s1Recipe()) } : {}),
  };
}

function buildPackCore() {
  const styles = Object.fromEntries(PACK_STYLES.map((c) => [c, styleEntry(getStyleScale(c))]));
  const stock = STOCK.map((s) => ({ ...hopEntry(hopProfile(s.key)), grams: s.grams, form: s.form, items: s.items, exhausted: s.grams <= 0 }));
  const catalogue = Object.entries(CATALOGUE_IDS).flatMap(([style, ids]) => ids.map((id) => ({ ...hopEntry(hopProfile(`beermaverick-${id}`)), forStyle: style })));

  // S1 : stout export, « plus floral, moins résineux ».
  const r1 = proposeVoies(s1Recipe(), S1_DIRECTION, { tasting: S1_TASTING, leviersLevure: true });
  const directed = r1.direction.map((d) => d.family);
  const S1 = {
    question: 'Ma stout export est trop résineuse ; je la veux plus florale.',
    recipe: r1.recipe, style: '16D', ...boilOf(s1Recipe()), yeast: yeastDoubleImpact(s1Recipe()), ibu: r1.ibu, matrix: r1.matrix,
    before: profile(r1.before.profile),
    direction: r1.direction.map((d) => ({ family: d.family, name: d.name, crans: d.crans, status: d.status, delta: d.delta, cran: d.cran, width: d.width, targetAbsolute: d.targetAbsolute, targetFrom: d.targetFrom, note: d.note })),
    ranking: r1.ranking, evaluated: r1.evaluated, notes: r1.notes, skipped: r1.skipped,
    voies: r1.voies.map((v) => voieEntry(v, directed)),
    // Dégustation du brasseur : seulement ce qu'il a dit (aucune valeur inventée).
    tasting: { ...S1_TASTING, usage: TASTING_USAGE,
      situated: Object.fromEntries(FAMILIES.map((f) => [f, (({ family: _f, ...rest }) => rest)(situateBeer(r1.before.profile, S1_TASTING, getStyleScale('16D'))[f])])) },
    // Pistes hors houblon, sourcées, sans chiffres.
    horsModele: offModelLeads(S1_DIRECTION),
  };
  // Lecture commune : une entrée par famille dans l'ordre du style ; la dégustation prime.
  const reading1 = readBeer(r1.before.profile, S1_TASTING, getStyleScale('16D'));
  const summary1 = readingSummary(reading1), voies1 = voiesSummary(r1);
  Object.assign(S1, { reading: reading1, readingSummary: { counts: summary1.counts, sentence: summary1.sentence, voies: voies1.byFamily, voiesSentence: voies1.sentence } });
  // Ajout en un toucher (comme l'étape Malts) : houblons du stock classés pour le style, règle écrite.
  Object.assign(S1, { ajoutsRapides: withTablesQ({ style: '16D', ...quickAdds(s1Recipe(), getStyleScale('16D'), S1_TASTING) }, s1Recipe()) });
  // Houblons de la recette, avec l'IBU de leur dose à chaque moment (BrewingMath.hopIbu).
  Object.assign(S1, { recetteHoublons: s1Recipe().additions.map((a) => ({ additionId: a.id, hopKey: a.hopKey, name: hopRef(a.hopKey)?.name ?? a.hopKey, alpha: hopAlpha(a.hopKey), role: hopRole(a.hopKey),
    moment: a.moment, grams: a.grams, gramsPerLitre: round(a.grams / s1Recipe().volumeL, 2), ibuParMoment: ibuByMoment(a.hopKey, a.grams, s1Recipe()), ...tablesOf(a.hopKey, a.grams, s1Recipe()) })) });
  // Liste d'achats (le stock informe, il ne limite pas) et goûts du brasseur (vides : aucun goût inventé).
  // voiesSansHoublon : pour chaque variété des voies, le classement recalculé par le moteur si on l'exclut.
  const s1Varieties = [...new Set(r1.voies.flatMap((v) => v.actions.map((a) => hopRef(a.hopKey)!.varietyId)))];
  Object.assign(S1, {
    achats: shoppingList(s1Recipe()), gouts: NO_GOUTS, goutsRule: GOUTS_RULE,
    voiesSansHoublon: {
      rule: 'Le moteur recalcule avec la variété exclue (domaine de recherche) : les voies qui l’utilisent disparaissent, l’ordre relatif des autres ne change pas (clés de classement indépendantes), mais des voies écartées par les plafonds (10 du stock, 4 à acheter, 2 par houblon, 2 assemblages) ou de nouveaux assemblages peuvent entrer.',
      // Forme compacte (taille du pack) : seulement ce qui change par rapport à S1.voies.
      parVariete: s1Varieties.map((id) => {
        const r = proposeVoies(s1Recipe(), S1_DIRECTION, { tasting: S1_TASTING, leviersLevure: true, gouts: { aime: [], exclut: [{ type: 'variété', id, source: 'simulation' }] } });
        const now = new Set(r.voies.map((v) => v.id)), before = new Set(r1.voies.map((v) => v.id));
        return { varietyId: id, name: CATALOGUE.find((c) => c.id === id)?.name ?? id,
          retirees: r1.voies.filter((v) => !now.has(v.id)).map((v) => v.label),
          nouvelles: r.voies.filter((v) => !before.has(v.id)).map((v) => ({ rank: v.rank, label: v.label })) };
      }),
    },
  });
  // Les quatre objets de l'écran (work/refonte-frontend/v4/ecran-1/MODELE.md), en niveaux prêts à dessiner.
  const s16d = getStyleScale('16D');
  const beer1 = beerLevels(r1.before.profile, S1_TASTING, s16d);
  S1.voies.forEach((v, i) => Object.assign(v, { profilApres: afterLevels(beer1, r1.voies[i].effect), profilApresCrans: afterCrans(beer1, r1.voies[i].effect, s16d).map(({ family, crans, display, deltaCrans }) => ({ family, crans, display, deltaCrans })),
    // Radars en intensité absolue (D24) : niveaux 0–3 après la voie et écart de niveau.
    profilApresNiveaux: afterLevelsDelta(beer1, r1.voies[i].effect, s16d).niveaux, deltaNiveaux: afterLevelsDelta(beer1, r1.voies[i].effect, s16d).delta,
    profilApresContinu: afterContinuous(beer1, r1.voies[i].effect),
    // Intervalles de confiance (lot 5) : la plage V5.5 de ma bière après la voie, à lire face à `before`.
    // Une plage complète (0–100) reste marquée « non situé » : la vue le dit, elle n'invente rien.
    apresPlage: r1.voies[i].after ? profile(r1.voies[i].after) : null }));
  const ficheKeys = [...new Set([...s1Recipe().additions.map((a) => a.hopKey), ...STOCK.map((s) => s.key)])];
  Object.assign(S1, { echellesContinu: CONTINU_RULE, profilBiereContinu: beerContinuous(beer1), cibleStyleContinu: targetContinuous(s16d) });
  // D54 : tolérance par style et a priori du brasseur (champs ajoutés, bandes inchangées).
  // Valeurs 0–100 tirées de l'échelle continue 0–3 (× 100/3) : dégustation d'abord, sinon modèle.
  const tol1 = toleranceScale('16D');
  const v100 = (x: number | null) => (x === null ? null : Math.round((x * 100) / 3 * 10) / 10);
  // Plages (D53) : une famille dégustée prend la plage de sa classe perçue (décalée par l'effet établi
  // d'une voie) ; une famille du modèle, la plage V5.5 (avant : before ; après : profil recalculé).
  // Plage complète ou non située : null (la vue dit « plage inconnue »).
  const r1d = (x: number) => Math.round(x * 10) / 10;
  const c100 = (x: number) => Math.max(0, Math.min(100, x));
  const plageEst = (e?: FamilyEstimate) => (e && e.status === 'estimé' && e.range && e.situated && !e.completeDomain ? { min: r1d(e.range.min), max: r1d(e.range.max) } : null);
  const goute = (f: FamilyId) => { const x = beer1.find((y) => y.family === f)!; return x.source === 'dégustation' && x.basis?.range ? x.basis.range : null; };
  const plageAvant = (f: FamilyId) => { const g = goute(f); return g ? { min: r1d(g.min), max: r1d(g.max) } : plageEst(r1.before.profile[f]); };
  const plageApres = (i: number) => (f: FamilyId) => {
    const g = goute(f), e = r1.voies[i].effect[f];
    if (g) return e.established && e.central !== null ? { min: r1d(c100(g.min + e.central)), max: r1d(c100(g.max + e.central)) } : null;
    return plageEst(r1.voies[i].after?.[f]);
  };
  const ecartsDe = (vals: { family: FamilyId; value: number | null }[], plage: (f: FamilyId) => { min: number; max: number } | null) => vals.map(({ family, value }) => {
    const t = tol1.familles.find((x) => x.family === family)!, p = plage(family);
    return { family, valeur: v100(value), ecart: ecartTolerances(t, v100(value)), plage: p, ecartPlage: p ? [ecartTolerances(t, p.min), ecartTolerances(t, p.max)] : null };
  }).filter((x) => x.valeur !== null || x.plage !== null); // familles sans valeur ni plage : absentes (plafond du pack)
  S1.voies.forEach((v, i) => Object.assign(v, { ecartsApres: ecartsDe(afterContinuous(beer1, r1.voies[i].effect), plageApres(i)) }));
  Object.assign(S1, { tolerance: { regle: TOLERANCE_RULE, ...tol1, biere: ecartsDe(beerContinuous(beer1), plageAvant) } });
  Object.assign(S1, { echelles: LEVEL_RULE, echellesCrans: CRANS_RULE, profilBiereCrans: beerCrans(beer1, s16d), cibleStyleCrans: targetCrans(s16d, r1.direction),
    profilBiere: beer1, cibleStyle: targetLevels(s16d),
    profilFiches: ficheKeys.map((k) => ({ key: k, name: hopRef(k)!.name, families: ficheLevels(hopRef(k)!.varietyId, s16d).map(compactFiche) })) });

  // S2 : Czech Premium Pale Lager 3B (floral attendu 33–68), trois houblons floraux du catalogue,
  // levure de lager LalBrew Diamond, sans profil dans V5.5 : enveloppe inconnue, gardée telle quelle.
  const s3b = getStyleScale('3B'), s21a = getStyleScale('21A');
  const lagerYeast = 'lalbrew-diamond';
  const trio = ['saaz-cz', 'styrian-golding', 'hallertau-mittelfruh'].map((id) => hopProfile(`beermaverick-${id}`, { yeastId: lagerYeast, og: 1.052 }));
  const est2 = (h: HopProfile, f: FamilyId) => ({ range: h.families[f].range, central: h.families[f].central });
  const pairs = [[0, 1], [0, 2], [1, 2]].map(([i, j]) => ({
    a: trio[i].name, b: trio[j].name,
    families: Object.fromEntries(s3b.order.map((f) => {
      const g = gapVerdict(est2(trio[i], f), est2(trio[j], f), s3b.families[f]);
      const g21 = gapVerdict(est2(trio[i], f), est2(trio[j], f), s21a.families[f]);
      return [f, { verdict: g.verdict, why: g.why, gap: g.gap === null ? null : round(g.gap), threshold: round(g.threshold), share: g.share === null ? null : round(g.share, 3),
        onIpa: { verdict: g21.verdict, why: g21.why, threshold: round(g21.threshold), share: g21.share === null ? null : round(g21.share, 3) } }];
    })),
  }));
  const S2 = {
    question: 'Lager tchèque premium : lequel de Saaz, Styrian Golding et Hallertau Mittelfrüh est le plus floral, et l’écart compte-t-il ?',
    style: '3B', yeast: yeastDoubleImpact(s2Recipe()), reference: trio[0].reference, inStock: false,
    hops: trio.map((h) => ({ ...hopEntry(h),
      styleVerdicts: Object.fromEntries(s3b.order.filter((f) => s3b.families[f].status === 'attendue').map((f) => [f, valueVerdict(est2(h, f), s3b.families[f])])) })),
    pairs,
    // Résumé seulement : à la référence, les profils des trois houblons sont des plages pleines
    // (non situés) ; une lecture par houblon n'écrirait que « non situé ».
    readingSummary: { ...gapSummary(trio.map((h) => h.name), pairs),
      note: 'Profils à la référence : plages pleines, non situées ; seul l’écart entre houblons se lit.' },
    // Même forme que S1.ajoutsRapides, pour une recette 3B encore sans houblon (mode amertume).
    ajoutsRapides: { style: '3B', recipe: s2Recipe(), ...quickAdds(s2Recipe(), s3b) },
    // Objets de l'écran pour 3B : cible et fiches oui ; profil de la bière calculé mais non situé
    // (recette sans houblon, levure sans profil V5.5, aucune dégustation) ; pas de voies (pas de direction).
    echelles: LEVEL_RULE,
    profilBiere: beerLevels(recipeProfile(s2Recipe()).profile, null, s3b),
    echellesCrans: CRANS_RULE, profilBiereCrans: beerCrans(beerLevels(recipeProfile(s2Recipe()).profile, null, s3b), s3b), cibleStyleCrans: targetCrans(s3b),
    profilBiereNote: 'Recette 3B sans houblon, levure LalBrew Diamond sans profil V5.5 et sans dégustation : le modèle ne situe aucune famille. Une dégustation ou des ajouts la situeraient.',
    cibleStyle: targetLevels(s3b),
    profilFiches: [...trio.map((h) => h.key), ...STOCK.map((s) => s.key)].map((k) => ({ key: k, name: hopRef(k)!.name, families: ficheLevels(hopRef(k)!.varietyId, s3b).map(compactFiche) })),
    profilApresNote: 'Pas de voies en S2 (aucune direction posée) : pas de profil après.',
    illustration: (() => {
      // « Un écart faible pour une ipa peut être très grand pour un autre style » : un cran du floral de la 3B, arrondi.
      const gap = Math.round(s3b.families.floral.cran);
      const a = { range: { min: 40, max: 40 } }, b = { range: { min: 40 + gap, max: 40 + gap } };
      return {
        style: '3B', gap,
        note: `Écart d’exemple de ${gap} points de floral (40 contre ${40 + gap}), soit un cran du style étroit (Czech Premium Pale Lager 3B, floral attendue 33–68), lu sur la piste 3B et sur la piste de l’American IPA 21A. Ce n’est pas une mesure de houblon : repères ponctuels, sans incertitude.`,
        lager: { share: round(trackShare(gap, s3b.families.floral), 3), verdict: gapVerdict(a, b, s3b.families.floral).verdict, threshold: round(s3b.families.floral.threshold) },
        ipa: { share: round(trackShare(gap, s21a.families.floral), 3), verdict: gapVerdict(a, b, s21a.families.floral).verdict, threshold: round(s21a.families.floral.threshold) },
      };
    })(),
  };

  // S4 (K2) : la même stout, sans houblon, jamais brassée. S5 (K3) : la même stout, chargée par règle.
  const caseScenario = (question: string, recipe: Recipe, notes: Record<string, string>, catalogueLimit = 10) => {
    const prof = recipeProfile(recipe);
    const reading = readBeer(prof.profile, null, s16d), summary = readingSummary(reading);
    const ibuTotal = recipeIbu(recipe);
    return {
      question, recipe, style: '16D', ...boilOf(recipe), yeast: yeastDoubleImpact(recipe),
      signauxLevure: recipe.additions.map((a) => yeastSignals(a, recipe)).filter((x) => x !== null),
      ibu: round(ibuTotal.value), ibuStyle: s16d.ibu, ibuRange: { min: round(ibuTotal.min), max: round(ibuTotal.max) },
      recetteHoublons: recipeLines(recipe).map((line) => ({ ...line, alpha: hopAlpha(line.hopKey), role: hopRole(line.hopKey), ibuParMoment: ibuByMoment(line.hopKey, line.grams, recipe), ...tablesOf(line.hopKey, line.grams, recipe) })),
      ajoutsRapides: withTablesQ(recipe.additions.length ? { style: '16D', ...quickAdds(recipe, s16d, null, { catalogueLimit }) } : buildFromEmpty(recipe, s16d), recipe),
      achats: shoppingList(recipe), gouts: NO_GOUTS,
      tasting: null,
      echelles: LEVEL_RULE, profilBiere: beerLevels(prof.profile, null, s16d), cibleStyle: targetLevels(s16d),
      echellesCrans: CRANS_RULE, profilBiereCrans: beerCrans(beerLevels(prof.profile, null, s16d), s16d), cibleStyleCrans: targetCrans(s16d),
      echellesContinu: CONTINU_RULE, profilBiereContinu: beerContinuous(beerLevels(prof.profile, null, s16d)), cibleStyleContinu: targetContinuous(s16d),
      readingSummary: { counts: summary.counts, sentence: summary.sentence },
      voies: [], ...notes,
    };
  };
  const s4 = { ...s1Recipe(), name: 'Stout export (nouvelle)', additions: [] };
  const S4 = caseScenario('Nouvelle stout export, aucun houblon : par où commencer ?', s4, {
    ibuNote: `IBU 0 face à ${s16d.ibu![0]}–${s16d.ibu![1]} : il manque l’amertume.`,
    ajoutsRapidesNote: 'Recette vide : construction de brasseur, amérisants à 60′ (au choix) puis aromatiques tardifs ; règles dans ajoutsRapides.regles.',
    profilNote: 'Rien de dégusté (jamais brassée) ; sans houblon, le modèle ne voit que le fond de levure US-05.',
    voiesNote: 'Pas de voie : aucune dégustation ni direction ; commencer par l’amertume (ajouts rapides).',
  });
  const s5 = loadedRecipe({ ...s1Recipe(), name: 'Stout export (chargée)' }, s16d);
  const S5 = { ...caseScenario('Stout export chargée : chaque ajout, son IBU, le profil prévu.', s5, {
    profilNote: 'Pas de dégustation : profil prévu par le modèle seul, ou « non situé ».',
    voiesNote: 'Pas de voie : aucune direction posée.',
    catalogueNote: 'Catalogue à acheter non repris ici (voir S1 et S4, même règle) pour tenir la taille du pack.',
  }, 0), composition: LOADED_RECIPE_RULE };

  // S1E120 : la même recette que S1, ébullition de 120 min (page cas-ebu120.html), avec les mêmes tables.
  const s1e120: Recipe = { ...s1Recipe(), name: 'Stout export (ébullition 120′)', boilMin: 120 };
  const S1E120 = {
    question: 'La même stout export, avec une ébullition de 120 minutes.',
    recipe: s1e120, style: '16D', ...boilOf(s1e120), ibu: round(recipeIbu(s1e120).value),
    recetteHoublons: s1e120.additions.map((a) => ({ additionId: a.id, hopKey: a.hopKey, name: hopRef(a.hopKey)?.name ?? a.hopKey, alpha: hopAlpha(a.hopKey), role: hopRole(a.hopKey),
      moment: a.moment, grams: a.grams, gramsPerLitre: round(a.grams / s1e120.volumeL, 2), ibuParMoment: ibuByMoment(a.hopKey, a.grams, s1e120), ...tablesOf(a.hopKey, a.grams, s1e120) })),
    note: 'Page de test. Les tables ne dépendent plus de la durée d’ébullition (minutes 0 à 240, premier moût 5 à 240) : les ajouts rapides sont ceux de S1 ; la page borne ibuParMinute5 et lit ibuPremierMout à la durée choisie.',
  };

  // S3 : American IPA, tout le stock classé par adéquation documentaire au style.
  const S3 = {
    question: 'IPA : tous mes houblons, du plus au moins adapté.',
    style: '21A', reference: REFERENCE,
    ranked: styleFit(STOCK.map((s) => s.key), s21a).map((r, i) => ({ rank: i + 1, ...r })),
  };

  return {
    meta: {
      name: 'Pack de données des mini-prototypes houblons v4', date: PACK_DATE, status: 'à valider par le brasseur',
      engine: { v55: ['functions/src/hopPredictionCore.ts', 'functions/src/hopExtrapolationCore.ts', 'functions/src/hopRecipePrediction.ts', 'src/domain/hopIndex/solver.ts (checkHopExclusions)', 'src/services/brewingMath.ts (hopIbu)'],
        recipeEngine: HOP_RECIPE_ENGINE_VERSION, v4: 'prototypes/houblons-v4/src/engine (direction relative, stock, voies, échelles au style)' },
      bands: { version: SCALE_PARAMETERS.version, words: SCALE_PARAMETERS.words, status: SCALE_PARAMETERS.status, file: 'prototypes/houblons-v4/data/style-bands.json' },
      facts: { version: facts.version, file: 'prototypes/houblons-v4/data/faits-cites.json', status: facts.status,
        items: facts.facts.map((f) => ({ id: f.id, varietyId: f.varietyId, families: f.families, quote: f.quote, source: f.description.source.title, url: f.description.source.reference })) },
      sources: {
        varieties: 'Beer Maverick (318 variétés, descripteurs), src/data/hopBeerMaverickBootstrap.json',
        hopsteiner: 'Hopsteiner 2025 (familles déclarées, descripteurs), src/data/hopManufacturerBootstrap.json',
        styles: 'BJCP 2021 Style Guidelines, pages publiques bjcp.org relevées le 18.10.2026 ; statistiques src/data/brewingStylesBootstrap.json',
        stock: STOCK_SOURCE.fixture, model: 'Connaissances V5.5 : hopKnowledgeBootstrap, hopExtrapolationBootstrap, hopYeastBootstrap, hopSolverBootstrap',
      },
      reference: { ...REFERENCE, note: 'Profils des houblons : un seul ajout à cette référence, levure SafAle US-05 (caractérisée dans V5.5). Échelles communes à tous les houblons.' },
      reading: [
        'Toute valeur est une plage {min, max} ; « central » est le repère central V5.5 (scénario aux valeurs centrales des paramètres), ni moyenne ni espérance, ni 95 %.',
        'Une famille sans donnée vaut {status: "inconnu"}, jamais 0.',
        'completeDomain : plage 0–100 entière, le modèle ne situe pas cette famille.',
        'Bandes, cran et seuil d’écart : hypothèses [H] à valider par le brasseur (table mots → bandes, data/style-bands.json).',
        'IBU, g, g/L et intensités 0–100 restent sur des échelles séparées.',
        'display: "non situé" : la plage couvre tout le domaine ou part de 0 sans repère central ; ne pas l’afficher, écrire « non situé ».',
        'description par famille : non décrit (aucune fiche), cité (une fiche), marqué (au moins deux fiches ou premier descripteur), avec « sources sur of » fiches lues.',
      ],
    },
    families: FAMILIES.map((f, i) => ({ id: f, name: FAMILY_NAMES[f], order: i })),
    // Types d'ajout et « quand », dans l'ordre d'affichage (ébullition de 60 min des recettes du pack).
    moments: momentCatalogue(60),
    // Ordre des familles pour les radars (adjacences de la roue Beer Maverick), noms courts.
    roueAromes: ROUE_AROMES,
    // Tables d’IBU libres (tranches de 5′, ébullition 60 à 120′, whirlpool) et jour du houblonnage à cru.
    tablesIbu: { regle: TABLES_RULE, minutes: MINUTES_5, dureesPremierMout: BOIL_LENGTHS, whirlpool: { temperatures: WP_TEMPERATURES, minutes: WP_MINUTES },
      densiteRecette: s1Recipe().og, facteurDensite: densityFactors(s1Recipe()), volume: 'À g/L égal, l’IBU ne dépend pas du volume (BrewingMath : IBU ∝ g/L).',
      aromeContact: 'Les prédictions d’arôme (V5.5) gardent les contacts du solveur : whirlpool 80 °C 20 min, à froid 24 h à 18 °C ; l’ébullition prend la minute de l’ajout. Non tabulé par minute.' },
    dryHopJour: DRY_HOP_DAY,
    styles,
    stock,
    catalogue,
    scenarios: { S1, S2, S3, S4, S5, S1E120 },
  };
}
export const catalogueSize = () => CATALOGUE.length;

export const PACK_MAX_BYTES = 500 * 1024;
export const FICHES_FILE = 'prototypes/houblons-v4/data/pack-fiches.json';
type Core = ReturnType<typeof buildPackCore>;
type KeyRow = { key?: string; hopKey?: string };
/** Houblons qui apparaissent dans S1, S4 ou S5 (recette, ajouts rapides, voies, profilFiches) et les comparés de S2. */
function sheetKeysOf(pack: Core) {
  const sc = pack.scenarios as unknown as Record<string, Record<string, unknown>>;
  const list = (x: unknown) => (Array.isArray(x) ? (x as KeyRow[]) : []);
  const keys: string[] = [];
  for (const id of ['S1', 'S4', 'S5']) {
    const s = sc[id];
    keys.push(...list(s.recetteHoublons).map((r) => r.hopKey!));
    const q = s.ajoutsRapides as Record<string, unknown>;
    for (const part of ['disponibles', 'epuises', 'catalogue']) keys.push(...list(q[part]).map((r) => r.key!));
    for (const v of list(s.voies) as unknown as { actions: KeyRow[] }[]) keys.push(...v.actions.map((a) => a.hopKey!));
    keys.push(...list(s.profilFiches).map((r) => r.key!));
  }
  keys.push(...list(sc.S2.hops).map((r) => r.key!));
  return sheetKeys(keys.filter(Boolean));
}
/** Pack et fiches houblons : fiches dans le pack si l'ensemble tient sous 500 ko, sinon dans pack-fiches.json. */
export function buildAll() {
  const pack = buildPackCore();
  const sc = pack.scenarios as unknown as Record<string, { recipe: Recipe }>;
  const ctx = { recipes: ['S1', 'S4', 'S5'].map((scenario) => ({ scenario, recipe: sc[scenario].recipe })), ibuBase: s1Recipe(), gouts: NO_GOUTS };
  // role : l'usage du houblon selon le moteur (hopRole : fournisseur, sinon règle rôle-α), lu par les voies
  // de Suggestions (#138, q2b : « le type de houblon pour son usage »). Golding et Columbus n'avaient de rôle
  // nulle part dans le pack ; le pack lui-même est à 2 ko de son plafond de 500 ko, d'où la fiche.
  const fiches = sheetKeysOf(pack).map((k) => ({ ...hopSheet(k, ctx), role: hopRole(k) }));
  const embedded = { ...pack, fichesHoublons: fiches };
  if (Buffer.byteLength(JSON.stringify(embedded)) + 1 <= PACK_MAX_BYTES) return { pack: embedded, fiches: null };
  const pointer = { fichier: FICHES_FILE, nombre: fiches.length, raison: 'Pack et fiches dépassent 500 ko ensemble : fiches dans un fichier à part.' };
  return { pack: { ...pack, meta: { ...pack.meta, fichesHoublons: pointer } },
    fiches: { meta: { name: 'Fiches houblons des mini-prototypes v4', date: PACK_DATE, status: 'à valider par le brasseur', pack: 'prototypes/houblons-v4/data/pack-mini-protos.json',
      lecture: ['Chaque fiche ne contient que des données du dépôt, avec leur source ; null et une raison quand la donnée manque.', 'aromes : citations des fiches (0 non décrit, 1 cité, 2 marqué), pas une intensité dans la bière.', 'ibuParGramme : BrewingMath.hopIbu, sur la base indiquée.',
        'substitutsCalcules : remplaçants calculés par le moteur depuis les fiches du dépôt (règle dans substitution) ; substituts reste null (scores Beer Maverick non importés). Top 5 parmi le catalogue et le stock, puis les 3 meilleurs du stock (« en stock d’abord », rangGeneral = rang sans préférence de stock).'],
      substitution: { methode: SUBSTITUTION_METHOD, regle: SUBSTITUTION_RANKING, poids: SUBSTITUTION_WEIGHTS, paliers: SUBSTITUTION_PALIERS, ecartTypesHuiles: oilScales() } },
      fichesHoublons: fiches } };
}
export function buildPack() { return buildAll().pack; }
