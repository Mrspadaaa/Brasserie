import type { HopRange, HopSource } from '../../functions/src/hopIndexSchema';
import type { HopYeast } from '../../functions/src/hopPredictionSchema';
import type { YeastFactKey } from '../../functions/src/yeastCatalogueSchema';
import { alcoholPercentUnit, type YeastTechnicalFact } from '../../functions/src/yeastTechnicalFacts';
import type { Fermentable, YeastSpec } from '../types';
import type { TrialRecipe } from './hopIndex/trials';
import { yeastAcidifyingProductSource, yeastCultureComposition, yeastStyleEvidence } from './yeastStyleEvidence';
import { resolveBrewingStyle } from './brewingStyles';
import { readIngredientFermentationFacts, type IngredientFermentationFacts } from '../../functions/src/ingredientFermentationFacts';
import { noloScience } from './noloScience';
import type { NoloSugar } from '../../functions/src/noloSchema';

export type YeastFermentationProcess = 'unspecified' | 'preacidified' | 'acidifying-yeast' | 'mixed-culture';
export type YeastCultureRole = { name: string; role: 'alcoholic' | 'acidifying' | 'conditioning' | 'mixed' };
export type YeastAttenuationBasis = 'declared' | 'recipe' | 'measured';
export interface YeastDossierMeasurement {
  range: HopRange;
  qualifier: 'range' | 'reportedPoint' | 'atLeast' | 'upTo';
  sources: HopSource[];
  basis?: YeastAttenuationBasis;
}
export interface YeastDossier {
  facts: YeastTechnicalFact[];
  temperature?: YeastDossierMeasurement;
  attenuation?: YeastDossierMeasurement;
  documentedAttenuation?: YeastDossierMeasurement;
  alcoholTolerance?: YeastDossierMeasurement;
  warnings: string[];
}
export interface YeastProjectionEstimate {
  range: HopRange | null;
  reasons: string[];
  sources: HopSource[];
  confidence: 'low' | 'medium' | 'high';
}
export interface YeastRecipeProjection {
  modelVersion: 'yeast-projection-3';
  og: number | null;
  fg: YeastProjectionEstimate;
  abv: YeastProjectionEstimate;
  attenuation?: YeastDossierMeasurement;
  dossier: YeastDossier;
  warnings: string[];
  extract?: { totalPoints: number; wortPoints: number; sugarPoints: number; unfermentablePoints: number; lateAdditionPoints: number };
}

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const uniqueSources = (sources: HopSource[]) => [...new Map(sources.map(s => [s.reference, s])).values()];
const brewingContext = (context: string | undefined) => !context || /^(beer|bière|biere|wort|moût|mout)$/i.test(context) || context === 'Conversion exacte Fahrenheit → Celsius, arrondie au dixième.';
const point = (value: number, basis?: YeastAttenuationBasis, sources: HopSource[] = []): YeastDossierMeasurement => ({ range: { min: value, max: value }, qualifier: 'reportedPoint', sources, ...(basis ? { basis } : {}) });
const suppliedSource = (fact: YeastTechnicalFact): HopSource[] => fact.source || fact.sourceUrl ? [{
  author: fact.origin === 'manufacturer' ? 'Fiche fabricant' : fact.origin === 'personal' ? 'Fiche personnelle' : 'Source proposée',
  title: fact.source ?? fact.reported, reference: fact.sourceUrl ?? fact.source!, kind: fact.origin === 'manufacturer' ? 'manufacturer' : 'observation', year: null
}] : [];
const documentarySugarStrains = noloScience()?.strains ?? [];
function sugarCapabilities(yeast: YeastSpec, reference?: HopYeast): Pick<IngredientFermentationFacts, 'sugars' | 'hydrolysis' | 'source'> | undefined {
  if (yeast.fermentationFacts !== undefined) return readIngredientFermentationFacts(yeast.fermentationFacts);
  const known = documentarySugarStrains.find(s => s.yeastId === (reference?.id ?? yeast.hopIndexId));
  if (known && known.source.kind !== 'judgment') return { sugars: known.sugars, hydrolysis: known.hydrolysis, source: known.source };
  const cbc1 = (reference?.id ?? yeast.hopIndexId) === 'lalbrew-cbc-1' || [reference?.source.reference, yeast.technicalSource, ...(yeast.technicalFacts ?? []).map(f => f.sourceUrl)].some(source => {
    if (!source) return false;
    try { const url = new URL(source); return /(^|\.)lallemandbrewing\.com$/i.test(url.hostname) && /\/(?:lalbrew-)?cbc-1(?:[-/]|$)/i.test(url.pathname); } catch { return false; }
  });
  if (cbc1) return {
    sugars: { glucose: 'yes', fructose: 'yes', sucrose: 'yes', maltotriose: 'no' }, hydrolysis: 'unknown',
    source: { author: 'Lallemand Brewing', title: 'LalBrew CBC-1', kind: 'manufacturer', year: null, reference: 'https://www.lallemandbrewing.com/en/canada/products/lalbrew-cbc-1/',
      locator: 'Maltotriose non métabolisé ; haute atténuation annoncée pour les sucres simples avec nutrition adaptée, pas une atténuation universelle du moût.' }
  };
  return undefined;
}
const simpleSugar = (name: string): NoloSugar | undefined => {
  const s = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/\bmaltotriose\b/.test(s)) return 'maltotriose';
  if (/\bmaltose\b/.test(s)) return 'maltose';
  if (/\b(glucose|dextrose)\b/.test(s)) return 'glucose';
  if (/\bfructose\b/.test(s)) return 'fructose';
  if (/\b(saccharose|sucrose|sucre blanc|sucre de table)\b/.test(s)) return 'sucrose';
  return undefined;
};

/** The explicit style identity wins over a recipe's personal display name. */
export function yeastRecipeStyleText(recipe: TrialRecipe): string {
  if (recipe.styleRef?.styleId) return resolveBrewingStyle(recipe.style, recipe.styleRef)?.name ?? recipe.styleRef.styleId;
  return recipe.style?.trim() ? recipe.style : recipe.name ?? '';
}

type ExtractInputs = { fermentables?: readonly Fermentable[]; volumeL: number; efficiencyPct?: number };
function ingredientPoints(f: Fermentable, recipe: ExtractInputs): number | undefined {
  if (f.weightKg === 0) return 0;
  const grain = (f.kind ?? 'grain') === 'grain';
  if (!finite(f.weightKg) || f.weightKg < 0 || !finite(f.potentialPpg) || f.potentialPpg < 0 || !finite(recipe.volumeL) || recipe.volumeL <= 0 ||
    grain && (!finite(recipe.efficiencyPct) || recipe.efficiencyPct <= 0 || recipe.efficiencyPct > 100)) return;
  return f.potentialPpg * f.weightKg * 2.2046226 * (grain ? recipe.efficiencyPct! / 100 : 1) / (recipe.volumeL * .26417205);
}
/** Unrounded computed equivalent OG. Call only for a derived estimate: never
 * replace an author's supplied OG by guessing that its decimals were rounded. */
export function yeastRecipeComputedOg(recipe: ExtractInputs): number | null {
  const rows = recipe.fermentables ?? [];
  if (!rows.length) return null;
  let total = 0;
  for (const row of rows) { const points = ingredientPoints(row, recipe); if (points === undefined) return null; total += points; }
  return finite(total) && total > 0 ? 1 + total / 1000 : null;
}

/** Gravity for the existing hot-hop model. A scheduled fermenter addition was
 * not present during boiling. Uses recipe volume, not an invented kettle assay. */
export function yeastRecipeBoilOg(recipe: ExtractInputs, projection: Pick<YeastRecipeProjection, 'og'>): { og: number | null; reasons: string[] } {
  if (!finite(projection.og)) return { og: null, reasons: ['DI de recette inconnue : IBU à chaud non déterminables.'] };
  let latePoints = 0;
  for (const f of (recipe.fermentables ?? []).filter(f => f.use === 'fermentation' && f.weightKg !== 0)) {
    const points = ingredientPoints(f, recipe);
    if (points === undefined) return { og: null, reasons: [`${f.name} : apport tardif inconnu, impossible d’isoler la DI utile au calcul des IBU.`] };
    latePoints += points;
  }
  const og = projection.og - latePoints / 1000;
  if (og < 1 - 1e-10) return { og: null, reasons: ['DI équivalente inférieure aux apports tardifs : base d’ébullition incohérente.'] };
  return { og: Math.max(1, og), reasons: [latePoints > 0 ? 'IBU calculés sans les apports prévus en fermentation, au volume de recette ; DI d’ébullition estimée, non mesurée.' : 'IBU calculés avec la DI de recette, sans ajout tardif à retirer ; estimation au volume de recette.'] };
}

/** Numeric metadata never creates a source or turns a one-sided bound into a range. */
export function resolveYeastDossier(yeast: YeastSpec, reference?: HopYeast): YeastDossier {
  const catalogue = reference?.catalogue?.facts ?? [];
  const facts = [...yeast.technicalFacts ?? [], ...catalogue.map((f): YeastTechnicalFact => ({
    key: f.key, reported: f.reported, origin: 'manufacturer', ...(f.range ? { range: f.range, unit: f.unit, qualifier: f.qualifier } : {}),
    source: f.source.title, ...(f.source.reference.startsWith('http') ? { sourceUrl: f.source.reference } : {}), ...(f.context ? { context: f.context } : {})
  }))];
  const warnings: string[] = [];
  const read = (key: YeastFactKey, unit: string): YeastDossierMeasurement | undefined => {
    // A personal dossier describes the selected product. It is not overwritten by a catalogue refresh.
    const local = yeast.technicalFacts?.filter(f => f.key === key) ?? [];
    const candidates = local.length ? local : catalogue.filter(f => f.key === key);
    if (!candidates.length) return undefined;
    const first = candidates[0];
    const valid = first.range && finite(first.range.min) && finite(first.range.max) && first.range.min <= first.range.max &&
      (unit !== '%' || first.range.min >= 0 && first.range.max <= 100) &&
      candidates.every(f => f.range && (key === 'alcoholTolerance' ? alcoholPercentUnit(f.unit) : f.unit === unit) && f.qualifier === first.qualifier &&
        f.range.min === first.range!.min && f.range.max === first.range!.max && brewingContext(f.context));
    if (!valid || !first.qualifier) {
      warnings.push(`${key === 'attenuation' ? 'Atténuation' : key === 'temperature' ? 'Température' : 'Tolérance à l’alcool'} : données absentes, conditionnelles ou non concordantes ; aucune plage n’est inventée.`);
      return undefined;
    }
    return { range: { ...first.range! }, qualifier: first.qualifier, sources: uniqueSources(local.length ? local.flatMap(suppliedSource) : catalogue.filter(f => f.key === key).map(f => f.source)), ...(key === 'attenuation' ? { basis: 'declared' as const } : {}) };
  };
  const documentedAttenuation = read('attenuation', '%');
  const hasAttenuationFacts = facts.some(f => f.key === 'attenuation');
  const scalarSources = yeast.technicalSource ? [{ author: 'Fiche saisie', title: yeast.name, reference: yeast.technicalSource, kind: 'observation' as const, year: null }] : [];
  const hasScalar = finite(yeast.attenuationPct) && yeast.attenuationPct >= 0 && yeast.attenuationPct <= 100;
  const attenuation = hasScalar && yeast.attenuationBasis !== 'declared'
    ? point(yeast.attenuationPct!, yeast.attenuationBasis ?? 'recipe', scalarSources)
    : documentedAttenuation ?? (hasScalar && !hasAttenuationFacts ? point(yeast.attenuationPct!, 'declared', scalarSources) : undefined);
  const documentedTemperature = read('temperature', '°C');
  const temperature = documentedTemperature ?? (!facts.some(f => f.key === 'temperature') && finite(yeast.fermTempMinC) && finite(yeast.fermTempMaxC) && yeast.fermTempMinC <= yeast.fermTempMaxC
    ? { range: { min: yeast.fermTempMinC, max: yeast.fermTempMaxC }, qualifier: 'range' as const, sources: scalarSources } : undefined);
  const alcoholTolerance = read('alcoholTolerance', '%') ?? (!facts.some(f => f.key === 'alcoholTolerance') && finite(yeast.alcoholTolerancePct) && yeast.alcoholTolerancePct >= 0 && yeast.alcoholTolerancePct <= 100 ? point(yeast.alcoholTolerancePct, undefined, scalarSources) : undefined);
  return { facts, temperature, attenuation, documentedAttenuation, alcoholTolerance, warnings };
}

/** A recipe estimate, independent of catalogue coverage and product packaging.
 * OG is the recipe's equivalent gravity including scheduled fermentable additions.
 * A measured pre-addition OG must not be supplied as that equivalent gravity. */
export function projectYeastRecipe(recipe: TrialRecipe, options: {
  reference?: HopYeast;
  og?: number | null;
  attenuationPct?: number;
  attenuationBasis?: YeastAttenuationBasis;
  process?: YeastFermentationProcess;
  cultureRoles?: YeastCultureRole[];
} = {}): YeastRecipeProjection {
  const dossier = resolveYeastDossier(recipe.yeast, options.reference);
  const attenuation = options.attenuationPct !== undefined && finite(options.attenuationPct) && options.attenuationPct >= 0 && options.attenuationPct <= 100
    ? point(options.attenuationPct, options.attenuationBasis ?? 'recipe') : dossier.attenuation;
  const capabilities = sugarCapabilities(recipe.yeast, options.reference);
  const globalApparent = attenuation?.basis === 'measured';
  const explicitHypothesis = globalApparent || attenuation?.basis === 'recipe' && (recipe.yeast.attenuationBasis === 'recipe' || options.attenuationPct !== undefined);
  const sources = uniqueSources([...(attenuation?.sources ?? []), ...(capabilities ? [capabilities.source] : [])]);
  const warnings = dossier.warnings.filter(w => !w.startsWith('Tolérance à l’alcool'));
  const unavailable = (reason: string): YeastProjectionEstimate => ({ range: null, reasons: [reason], sources, confidence: 'low' });
  const rows = (recipe.fermentables ?? []).filter(f => f.weightKg !== 0);
  let allPoints = 0, sugarPoints = 0, unfermentablePoints = 0, lateAdditionPoints = 0;
  let complete = rows.length > 0, specialIncomplete = false;
  let compositionError: string | undefined;
  const compositionNotes: string[] = [];
  for (const f of rows) {
    const grain = (f.kind ?? 'grain') === 'grain';
    const explicitFraction = f.fermentabilityPct;
    if (!finite(f.weightKg) || f.weightKg < 0 || explicitFraction !== undefined && (!finite(explicitFraction) || explicitFraction < 0 || explicitFraction > 100)) {
      compositionError = `${f.name} : masse ou fermentescibilité invalide.`; complete = false; continue;
    }
    const special = f.kind === 'sucre' || f.kind === 'lactose' || f.kind === 'fruit' || explicitFraction !== undefined && explicitFraction < 100;
    const points = ingredientPoints(f, recipe);
    if (points === undefined) { complete = false; if (special || f.use === 'fermentation') specialIncomplete = true; continue; }
    allPoints += points;
    if (f.use === 'fermentation') lateAdditionPoints += points;
    if (!globalApparent && f.kind === 'fruit' && explicitFraction === undefined) {
      specialIncomplete = true; compositionError = `${f.name} : part fermentescible du fruit inconnue.`; continue;
    }
    // A malt/extract row's overall fermentability is not an additional inert
    // mass fraction to multiply by the yeast's apparent attenuation.
    if ((grain || f.kind === 'extrait') && explicitFraction !== undefined && explicitFraction < 100) compositionNotes.push(`${f.name} : la fermentabilité de ligne (${explicitFraction} %) et l’atténuation du moût ne sont pas multipliées ; l’hypothèse d’atténuation retenue décrit le moût.`);
    let fraction = grain || f.kind === 'extrait' ? 1 : (explicitFraction ?? (f.kind === 'lactose' ? 0 : 100)) / 100;
    if (!globalApparent && f.kind === 'sucre' && explicitFraction === undefined && (!simpleSugar(f.name) || /malto[ -]?dextrin|dextrine/i.test(f.name))) {
      specialIncomplete = true; compositionError = `${f.name} : part fermentescible à préciser ; la catégorie « sucre » ne signifie pas 100 % de sucres simples.`; continue;
    }
    if (!globalApparent && f.kind === 'sucre' && /dextrin/i.test(f.name) && capabilities?.hydrolysis === 'positive') {
      compositionError = `${f.name} : hydrolyse documentée pour cette culture ; la part restante n’est pas quantifiable par ce modèle.`; continue;
    }
    if (!globalApparent && capabilities && (f.kind === 'sucre' || f.kind === 'fruit') && fraction > 0) {
      const sugar = f.kind === 'sucre' ? simpleSugar(f.name) : undefined;
      if (sugar && capabilities.sugars[sugar] === 'no') {
        if (explicitFraction !== undefined && explicitFraction > 0) { compositionError = `${f.name} : fermentabilité saisie incompatible avec la non-assimilation documentée de ${sugar}. Clarifier cette contradiction.`; continue; }
        fraction = 0; compositionNotes.push(`${f.name} : ${sugar} non assimilé d’après la fiche, conservé dans le bilan conditionnel.`);
      } else if (sugar && capabilities.sugars[sugar] !== 'yes') { compositionError = `${f.name} : assimilation de ${sugar} inconnue pour cette souche ; aucune consommation complète n’est supposée.`; continue; }
      else if (!sugar && !(['glucose', 'fructose', 'sucrose'] as const).every(s => capabilities.sugars[s] === 'yes')) { compositionError = `${f.name} : composition en sucres et assimilation à préciser pour cette culture.`; continue; }
    }
    unfermentablePoints += points * (1 - fraction);
    if (f.kind === 'sucre' || f.kind === 'fruit') sugarPoints += points * fraction;
  }
  const suppliedOg = options.og !== undefined ? options.og : recipe.ogTarget;
  const og = finite(suppliedOg) ? suppliedOg : options.og === null ? null : complete && allPoints > 0 ? 1 + allPoints / 1000 : null;
  const base: Omit<YeastRecipeProjection, 'fg' | 'abv'> = { modelVersion: 'yeast-projection-3', og, dossier, attenuation, warnings };
  const stop = (reason: string): YeastRecipeProjection => ({ ...base, fg: unavailable(reason), abv: unavailable(reason) });
  if (recipe.nolo?.enabled) return stop('NOLO : utiliser le bilan des sucres et les analyses du panneau NOLO ; cette projection ne prédit pas l’alcool au conditionnement.');
  if (suppliedOg != null && !finite(suppliedOg)) return stop('DI fournie invalide : aucune valeur n’est substituée silencieusement.');
  if (recipe.yeast.fermentationFacts !== undefined && !readIngredientFermentationFacts(recipe.yeast.fermentationFacts)) return stop('Données d’assimilation invalides : vérifier la fiche de cette souche.');
  if (recipe.yeast.attenuationPct != null && (!finite(recipe.yeast.attenuationPct) || recipe.yeast.attenuationPct < 0 || recipe.yeast.attenuationPct > 100) || recipe.yeast.attenuationBasis !== undefined && !['declared', 'recipe', 'measured'].includes(recipe.yeast.attenuationBasis)) return stop('Atténuation saisie ou base invalide : vérifier la fiche de cette souche.');
  if (options.attenuationPct !== undefined && (!finite(options.attenuationPct) || options.attenuationPct < 0 || options.attenuationPct > 100)) return stop('Atténuation choisie invalide : une valeur entre 0 et 100 % est requise.');
  if (!finite(og) || og <= 1 || og > 1.25) return stop('DI équivalente requise entre 1,000 et 1,250 SG : renseigner les potentiels, le volume et le rendement, ou une DI de recette.');
  if (compositionError || specialIncomplete && !globalApparent) return stop(compositionError ?? 'Potentiel d’un sucre, non-fermentescible ou ajout tardif manquant : son apport ne peut pas être ignoré.');
  if (!attenuation) return stop('Atténuation absente : renseigner une hypothèse de recette ou une donnée de cette souche.');
  if (!['range', 'reportedPoint'].includes(attenuation.qualifier)) return stop('L’atténuation publiée est une borne seule, pas une plage : choisir explicitement une hypothèse pour projeter cette recette.');
  const totalPoints = (og - 1) * 1000;
  const wortPoints = totalPoints - unfermentablePoints - sugarPoints;
  if (wortPoints < -1e-8 && !globalApparent) return stop('DI incohérente avec les apports connus de sucres et non-fermentescibles ; vérifier la DI équivalente et les quantités.');
  if (wortPoints < -1e-8 && globalApparent) warnings.push('La DI et les apports connus ne concordent pas dans le bilan approché ; vérifier la recette servant de base à l’atténuation observée.');
  const wort = Math.max(0, wortPoints);
  const documentaryContext = dossier.facts.filter(f => ['styles', 'application', 'attenuation'].includes(f.key)).map(f => `${f.reported} ${f.context ?? ''}`).join(' ');
  const nonWortUse = /\b(wine|vin|cidre|cider|mead|hydromel|seltzer|distill\w*|conditioning|conditionnement|refermentation|re-fermentation)\b/i.test(documentaryContext) ||
    /\b(champagne|ec[ -]?1118|cbc[ -]?1)\b/i.test(`${recipe.yeast.name} ${recipe.yeast.strain ?? ''} ${options.reference?.name ?? ''}`) || options.reference && yeastStyleEvidence(options.reference).culture === 'other-fermentation';
  const localAttenuation = recipe.yeast.technicalFacts?.filter(f => f.key === 'attenuation') ?? [];
  const explicitWortAttenuation = (localAttenuation.length ? localAttenuation : dossier.facts.filter(f => f.key === 'attenuation')).some(f => /^(beer|bière|biere|wort|moût|mout)$/i.test(f.context ?? ''));
  const restrictedMalt = capabilities?.sugars.maltose === 'no' || capabilities?.sugars.maltotriose === 'no';
  if (wort > 1e-8 && (nonWortUse && !explicitWortAttenuation || restrictedMalt)) {
    if (!explicitHypothesis) return stop(restrictedMalt ? 'Assimilation du malt limitée : sans profil des sucres de ce moût, choisir explicitement une hypothèse d’atténuation ou une mesure comparable.' : 'Atténuation sur moût non établie : une valeur publiée pour le vin, le cidre ou le conditionnement n’est pas transférée automatiquement. Choisir une hypothèse explicite pour cette recette.');
    warnings.push(restrictedMalt ? 'Assimilation du malt limitée : l’atténuation choisie reste une hypothèse à éprouver sur ce moût ; aucune capacité supplémentaire n’est attribuée à la souche.' : 'Usage vin/cidre/conditionnement : atténuation choisie comme hypothèse de recette ; assimilation du malt non démontrée par cette valeur.');
  }
  if (!globalApparent && capabilities && (['glucose', 'fructose', 'sucrose', 'maltose', 'maltotriose'] as const).every(s => capabilities.sugars[s] === 'no') && attenuation.range.max > 0) return stop('Aucun sucre de ce bilan n’est assimilé d’après la fiche : l’atténuation positive choisie est contradictoire.');
  const range = globalApparent ? { min: 1 + (og - 1) * (1 - attenuation.range.max / 100), max: 1 + (og - 1) * (1 - attenuation.range.min / 100) } : {
    min: 1 + (unfermentablePoints + wort * (1 - attenuation.range.max / 100)) / 1000,
    max: 1 + (unfermentablePoints + wort * (1 - attenuation.range.min / 100)) / 1000
  };
  const reasons = [globalApparent ? 'Atténuation apparente observée sur l’ensemble du brassin : DF = 1 + (DI − 1) × (1 − atténuation). Hypothèse de répétition sur cette recette, sans seconde correction sucre/lactose.' : attenuation.basis === 'recipe' ? 'Hypothèse d’atténuation choisie pour le moût de cette recette.' : 'Atténuation annoncée pour la souche : estimation conditionnelle à ce moût, pas une mesure ni un intervalle statistique.',
    globalApparent ? 'Une densité apparente ne décrit pas la composition en sucres résiduels ; la recette et le procédé doivent rester comparables au brassin mesuré.' : 'Atténuation appliquée à l’extrait de moût ; apports fermentescibles déclarés et non-fermentescibles distingués. Ni DF garantie ni intervalle statistique. Aucune correction automatique liée à la température d’empâtage.', ...compositionNotes];
  if (globalApparent && unfermentablePoints > 0) warnings.push('Non-fermentescibles présents : vérifier la comparabilité de l’atténuation mesurée ; la densité apparente dépend aussi de l’alcool, pas seulement des sucres restants.');
  if (lateAdditionPoints > 0) reasons.push('La DI équivalente inclut les ajouts prévus en fermentation ; elle peut différer de la DI mesurée avant ces ajouts. Volume final supposé égal au volume de recette.');
  if (!complete) reasons.push(globalApparent ? 'La DI équivalente fournie permet la définition de l’atténuation globale ; les données manquantes empêchent le bilan détaillé des sucres.' : 'La DI fournie remplace les potentiels incomplets du moût ; aucun apport spécial manquant n’est ignoré.');
  if (recipe.hops?.some(h => h.stage === 'dryHop' && h.weightG !== 0)) reasons.push('La reprise éventuelle par hop creep n’est pas chiffrée ; contrôler la densité après le dernier ajout.');
  const fg: YeastProjectionEstimate = { range, reasons, sources, confidence: 'low' };
  const process = options.process ?? (recipe as TrialRecipe & { yeastDesign?: { process?: YeastFermentationProcess } }).yeastDesign?.process ?? 'unspecified';
  const knownProcess = ['unspecified', 'preacidified', 'acidifying-yeast', 'mixed-culture'].includes(process);
  const mixed = process === 'mixed-culture' || process === 'acidifying-yeast';
  const documentedCulture = options.reference ? yeastStyleEvidence(options.reference).culture : undefined;
  const composition = yeastCultureComposition(dossier.facts);
  const acidifyingProductSource = yeastAcidifyingProductSource([options.reference?.id, recipe.yeast.hopIndexId].filter((s): s is string => !!s),
    [options.reference?.source.reference, recipe.yeast.technicalSource, ...dossier.facts.map(f => f.sourceUrl)].filter((s): s is string => !!s));
  if (acidifyingProductSource && !sources.some(s => s.reference === acidifyingProductSource.reference)) sources.push(acidifyingProductSource);
  const cultureRoles = options.cultureRoles ?? recipe.yeastDesign?.cultureRoles ?? [];
  const knownRoles = Array.isArray(cultureRoles) && cultureRoles.every(c => c && typeof c.name === 'string' && ['alcoholic', 'acidifying', 'conditioning', 'mixed'].includes(c.role));
  const acidifyingRole = knownRoles && cultureRoles.some(c => c.role === 'acidifying' || c.role === 'mixed');
  const cultureNeedsProcess = documentedCulture === 'mixed' || documentedCulture === 'bacteria' || composition.culture === 'mixed' || composition.acidifying || !!acidifyingProductSource || acidifyingRole;
  const sourUnspecified = process === 'unspecified' && (/sour|berliner|gose|lambic|gueuze|geuze|oud bruin|flanders|mixed fermentation|wild ale/i.test(yeastRecipeStyleText(recipe)) || cultureNeedsProcess);
  const abv: YeastProjectionEstimate = !knownProcess || !knownRoles ? unavailable('Procédé ou rôle de culture non reconnu : le préciser avant de projeter l’alcool.') : sourUnspecified ? unavailable('Procédé acidulé non précisé : distinguer une fermentation alcoolique sur moût pré-acidifié d’une culture produisant des acides avant de projeter l’alcool.') : mixed || cultureNeedsProcess
    ? unavailable('Culture acidifiante ou mixte : une baisse de densité peut aussi produire des acides. La répartition alcool/acides n’est pas documentée ; aucune teneur en alcool n’est déduite de la DF seule.')
    : { range: { min: (og - range.max) * 131.25, max: (og - range.min) * 131.25 }, reasons: ['Approximation (DI équivalente − DF) × 131,25 ; ni analyse d’alcool ni prévision de refermentation au conditionnement.', ...reasons], sources, confidence: 'low' };
  if (mixed) warnings.push('Procédé acidifiant ou mixte : DF conditionnelle à l’atténuation choisie ; pH, durée et stabilité finale non simulés.');
  if (!knownProcess) warnings.push('Procédé non reconnu : vérifier les données de fermentation.');
  if (!knownRoles) warnings.push('Rôle de culture non reconnu : vérifier les données de fermentation.');
  if (composition.uninterpretedSpecies) warnings.push('Désignation biologique non interprétée : vérifier la composition et le rôle de cette culture.');
  if (process === 'preacidified' && cultureNeedsProcess) warnings.push('Culture acidifiante ou mixte sélectionnée : un moût pré-acidifié ne garantit pas une fermentation uniquement alcoolique. Vérifier le procédé et le rôle des cultures.');
  if (sourUnspecified) warnings.push('Fermentation acidulée ou culture spécialisée : préciser le rôle des cultures et le procédé avant de projeter l’alcool.');
  const tolerance = dossier.alcoholTolerance;
  const toleranceFloor = Math.min(...dossier.facts.filter(f => f.key === 'alcoholTolerance' && alcoholPercentUnit(f.unit) && f.range).map(f => f.range!.min));
  if (og > 1.1 || abv.range && abv.range.max > toleranceFloor) warnings.push(...dossier.warnings.filter(w => w.startsWith('Tolérance à l’alcool')));
  if (abv.range && tolerance && abv.range.max > tolerance.range.min) warnings.push(
    tolerance.qualifier === 'atLeast' ? `Alcool projeté au-delà de ${tolerance.range.min} % vol. La fiche annonce « au moins » cette tolérance ; la limite supérieure reste inconnue.` :
      `Alcool projeté ${abv.range.max > tolerance.range.max ? 'au-delà de la tolérance' : 'dans la zone de tolérance'} annoncée (${tolerance.range.min === tolerance.range.max ? tolerance.range.max : `${tolerance.range.min}–${tolerance.range.max}`} % vol). Atténuation non garantie ; aucun plafond d’alcool artificiel n’est appliqué.`);
  if (finite(og) && og > 1.1 && !tolerance) warnings.push('Moût de forte densité : tolérance à l’alcool non renseignée ; confirmer la souche, l’inoculum et sa conduite.');
  return { ...base, fg, abv, extract: { totalPoints, wortPoints: wort, sugarPoints, unfermentablePoints, lateAdditionPoints } };
}
