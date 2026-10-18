// Pack de données commun aux mini-prototypes : tous les chiffres sortent du moteur (V5.5 importé
// + ajouts v4). JSON simple, déterministe (aucune horloge), relu par tests/pack.test.ts.
import { HOP_RECIPE_ENGINE_VERSION } from '@functions/hopRecipePrediction';
import {
  CATALOGUE, FAMILIES, FAMILY_NAMES, REFERENCE, SCALE_PARAMETERS, STOCK, STOCK_SOURCE, gapVerdict, getStyleScale, hopProfile, hopRef, valueVerdict,
  proposeVoies, styleFit, trackShare, type FamilyEstimate, type FamilyId, type HopProfile, type Profile, type Recipe, type StyleScale, type Voie,
} from '../engine';

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

type PackEstimate = { status: 'inconnu' } | { status: 'estimé'; min: number; max: number; central?: number; confidence: string; completeDomain?: true };
const est = (e: FamilyEstimate): PackEstimate => e.status === 'inconnu' || !e.range ? { status: 'inconnu' }
  : { status: 'estimé', min: e.range.min, max: e.range.max, ...(e.central !== undefined ? { central: e.central } : {}), confidence: e.confidence, ...(e.completeDomain ? { completeDomain: true as const } : {}) };
const profile = (p: Profile) => Object.fromEntries(FAMILIES.map((f) => [f, est(p[f])]));
const hopEntry = (h: HopProfile) => ({
  key: h.key, name: h.name, origin: h.origin, alpha: h.alpha ? { value: h.alpha.value, min: h.alpha.min, max: h.alpha.max, from: h.alpha.from } : null,
  profile: Object.fromEntries(FAMILIES.map((f) => [f, { ...est(h.families[f]), citation: h.families[f].citation }])),
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
    after: v.after ? profile(v.after) : null,
  };
}

export function buildPack() {
  const styles = Object.fromEntries(PACK_STYLES.map((c) => [c, styleEntry(getStyleScale(c))]));
  const stock = STOCK.map((s) => ({ ...hopEntry(hopProfile(s.key)), grams: s.grams, form: s.form, items: s.items, exhausted: s.grams <= 0 }));
  const catalogue = Object.entries(CATALOGUE_IDS).flatMap(([style, ids]) => ids.map((id) => ({ ...hopEntry(hopProfile(`beermaverick-${id}`)), forStyle: style })));

  // S1 : stout export, « plus floral, moins résineux ».
  const r1 = proposeVoies(s1Recipe(), S1_DIRECTION);
  const directed = r1.direction.map((d) => d.family);
  const S1 = {
    question: 'Ma stout export est trop résineuse ; je la veux plus florale.',
    recipe: r1.recipe, style: '16D', yeast: r1.yeast, ibu: r1.ibu, matrix: r1.matrix,
    before: profile(r1.before.profile),
    direction: r1.direction.map((d) => ({ family: d.family, name: d.name, crans: d.crans, status: d.status, delta: d.delta, cran: d.cran, width: d.width, targetAbsolute: d.targetAbsolute, note: d.note })),
    ranking: r1.ranking, evaluated: r1.evaluated, notes: r1.notes, skipped: r1.skipped,
    voies: r1.voies.map((v) => voieEntry(v, directed)),
  };

  // S2 : Czech Premium Pale Lager 3B (floral attendu 33–68), trois houblons floraux du catalogue,
  // levure de lager LalBrew Diamond, sans profil dans V5.5 : enveloppe inconnue, gardée telle quelle.
  const s3a = getStyleScale('3A'), s3b = getStyleScale('3B'), s21a = getStyleScale('21A');
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
    style: '3B', yeast: trio[0].yeast, reference: trio[0].reference, inStock: false,
    hops: trio.map((h) => ({ ...hopEntry(h),
      styleVerdicts: Object.fromEntries(s3b.order.filter((f) => s3b.families[f].status === 'attendue').map((f) => [f, valueVerdict(est2(h, f), s3b.families[f])])) })),
    pairs,
    illustration: {
      style: '3A', note: 'Même écart absolu de 8 points de floral, lu sur la piste de la Czech Pale Lager 3A (floral neutre, 0–30) et de l’American IPA 21A (repères ponctuels, sans incertitude).',
      lager: { share: round(trackShare(8, s3a.families.floral), 3), verdict: gapVerdict({ range: { min: 20, max: 20 } }, { range: { min: 28, max: 28 } }, s3a.families.floral).verdict, threshold: round(s3a.families.floral.threshold) },
      ipa: { share: round(trackShare(8, s21a.families.floral), 3), verdict: gapVerdict({ range: { min: 20, max: 20 } }, { range: { min: 28, max: 28 } }, s21a.families.floral).verdict, threshold: round(s21a.families.floral.threshold) },
    },
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
      ],
    },
    families: FAMILIES.map((f, i) => ({ id: f, name: FAMILY_NAMES[f], order: i })),
    styles,
    stock,
    catalogue,
    scenarios: { S1, S2, S3 },
  };
}
export const catalogueSize = () => CATALOGUE.length;
