import type { HopDecisionMaterial, HopIbuModelContext, HopNumericResult, HopReplacementBasis, HopUse } from './types';
import { HOP_MODEL_ALPHA_UNIT } from './modelInputs';
import { combineNumeric, nominalResult, numericBounds, readHopAnalysis, unknownResult } from './measurements';
import type { HopSource } from '../../../functions/src/hopIndexSchema';

export const TINSETH_SOURCE: HopSource = {
  title: 'The Hop Page — Utilization', author: 'Glenn Tinseth', year: null, kind: 'research',
  reference: 'https://web.archive.org/web/20260113130811id_/https://www.realbeer.com/hops/research.html',
  locator: 'Page originale archivée le 13 janvier 2026 ; bigness factor × boil time factor. Modèle empirique, pas analyse IBU. La page vivante redirige désormais.'
};
const isMass = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;

export function introducedHopAmounts(material: HopDecisionMaterial, grams: number | HopNumericResult | null) {
  const mass = typeof grams === 'number' && isMass(grams) ? nominalResult(grams, 'g', 'Masse saisie, incertitude non renseignée.')
    : typeof grams === 'object' && grams !== null && grams.unit === 'g' ? grams : unknownResult('g', 'Masse absente ou invalide.');
  const calculate = (analyte: 'alpha' | 'totalOil', unit: string) => {
    const bounds = numericBounds(mass);
    if (bounds?.min === 0 && bounds.max === 0) return nominalResult(0, unit, 'Masse nulle : aucune charge introduite.');
    if (bounds && bounds.min < 0) return unknownResult(unit, 'Une masse ne peut pas être négative.');
    const reading = readHopAnalysis(material, analyte);
    const expectedUnit = analyte === 'totalOil' ? 'mL/100g' : '% massique';
    if (reading.unit !== expectedUnit) return unknownResult(unit, 'La base analytique ne permet pas cette charge ; aucune conversion masse/volume sans densité.', reading.sources);
    return combineNumeric([mass, reading], unit,
      ([g, a]) => ({ min: g.min * a.min / 100, max: g.max * a.max / 100 }),
      'Charge introduite = masse × teneur / 100 ; ni extraction, ni concentration finale en bière.');
  };
  return { alphaGrams: calculate('alpha', 'g alpha'), oilMl: calculate('totalOil', 'mL huile') };
}

export function replacementHopDose(input: {
  from: HopDecisionMaterial; to: HopDecisionMaterial; grams: number | null; basis: HopReplacementBasis; use: HopUse; fraction?: number;
}): HopNumericResult {
  if (!isMass(input.grams)) return unknownResult('g', 'Renseigner une masse de référence finie et positive ou nulle.');
  const fraction = input.fraction ?? 1;
  if (!Number.isFinite(fraction) || fraction <= 0 || fraction > 1) return unknownResult('g', 'Fraction à remplacer requise dans ]0,1].');
  const grams = input.grams * fraction;
  if (input.grams === 0) return nominalResult(0, 'g', 'Ajout nul : aucun remplacement nécessaire.');
  if (input.basis === 'sameMass') return nominalResult(grams, 'g', 'Convention de même masse proposée ; aucune équivalence aromatique ou amère supposée.');
  if (input.basis === 'manufacturer') {
    const rule = input.to.product?.replacement;
    if (!rule || input.to.product!.form !== input.to.form || !input.to.product!.supportedUses.includes(input.use)
      || rule.referenceForm !== input.from.form || !rule.uses.includes(input.use)) {
      return unknownResult('g', 'Aucune convention fabricant vérifiée pour ce produit, cette forme de départ et cet emploi.');
    }
    if (rule.maxEquivalentFraction !== undefined && fraction > rule.maxEquivalentFraction) return unknownResult('g', 'La convention documentée ne couvre qu’un remplacement partiel ; conserver explicitement le reste du programme.', [rule.source]);
    if (!Number.isFinite(rule.gramsPerGram.min) || !Number.isFinite(rule.gramsPerGram.max) || rule.gramsPerGram.min <= 0 || rule.gramsPerGram.max < rule.gramsPerGram.min) {
      return unknownResult('g', 'Convention fabricant invalide.', [rule.source]);
    }
    return { status: 'range', unit: 'g', value: null, range: { min: grams * rule.gramsPerGram.min, max: grams * rule.gramsPerGram.max },
      uncertainty: 'reportedBounds', sources: [rule.source], reasons: ['Plage de départ du fabricant, pas une identité sensorielle.', ...rule.limitations] };
  }
  const analyte = input.basis === 'alphaLoad' ? 'alpha' : 'totalOil';
  const from = readHopAnalysis(input.from, analyte), to = readHopAnalysis(input.to, analyte);
  const expectedUnit = analyte === 'totalOil' ? 'mL/100g' : '% massique';
  if (from.unit !== expectedUnit || to.unit !== expectedUnit) return unknownResult('g', 'Teneurs sur des bases incompatibles ; aucune équivalence masse/volume d’huile supposée.', [...from.sources, ...to.sources]);
  const denominator = numericBounds(to);
  if (denominator && denominator.min <= 0) return unknownResult('g', 'La teneur de remplacement peut être nulle ; aucune dose finie garantie.', to.sources);
  return combineNumeric([from, to], 'g', ([a, b]) => ({ min: grams * a.min / b.max, max: grams * a.max / b.min }),
    input.basis === 'alphaLoad'
      ? 'Masse × alpha initial / alpha du remplacement ; doses pouvant égaler la charge alpha selon les teneurs. Aucun point d’une plage ne garantit cette égalité ni les IBU ou le goût.'
      : 'Masse × huile initiale / huile du remplacement ; doses pouvant égaler le volume d’huile selon les teneurs, sans équivalence sensorielle.');
}

/** Published Tinseth boil equation only: no unvalidated first-wort or temperature multiplier. */
export function estimateBoilIbu(input: { grams: number | null; alpha: HopNumericResult; volumeL: number | null; wortGravity: number | null; minutes: number | null; use: HopUse; modelContext?: HopIbuModelContext }): HopNumericResult {
  if (input.use !== 'boil') return unknownResult('IBU estimés', 'Tinseth ici limité à l’ébullition ; whirlpool, premier moût et dry hop nécessitent un modèle déclaré séparé.');
  const context = input.modelContext;
  const volumeL = context ? context.volumeL : input.volumeL, gravity = context ? context.gravity : input.wortGravity;
  if (context && (context.variant !== 'tinseth-original' && context.variant !== 'tinseth-declared-variant'
    || !['finishedBeer', 'fermenter', 'kettleHot', 'kettleCold'].includes(context.volumeReference)
    || !['averageBoil', 'atAddition', 'originalGravity'].includes(context.gravityReference)
    || typeof context.explanation !== 'string' || !context.explanation.trim())) return unknownResult('IBU estimés', 'Convention de modèle incomplète.');
  if (context?.variant === 'tinseth-original' && (context.volumeReference !== 'finishedBeer' || context.gravityReference !== 'averageBoil')) {
    return unknownResult('IBU estimés', 'Tinseth original demande volume de bière finie et densité moyenne d’ébullition. Nommer une variante si ces rôles diffèrent.');
  }
  if (!isMass(input.grams) || !isMass(input.minutes) || volumeL == null || !Number.isFinite(volumeL) || volumeL <= 0
    || gravity == null || !Number.isFinite(gravity) || gravity < 1) return unknownResult('IBU estimés', 'Masse, durée, volume de référence et densité du moût requis ; aucun défaut numérique implicite.');
  const model: HopNumericResult['model'] = { id: 'tinseth-boil-v1', convention: !context ? 'inputRolesUnspecified' : context.variant === 'tinseth-original' ? 'declaredOriginal' : 'declaredVariant',
    volumeL, volumeReference: context?.volumeReference ?? 'unspecified', gravity, gravityReference: context?.gravityReference ?? 'unspecified',
    alphaInput: { status: input.alpha.status, unit: input.alpha.unit, value: input.alpha.value, range: input.alpha.range ? { ...input.alpha.range } : null } };
  if (input.grams === 0 || input.minutes === 0) return { ...nominalResult(0, 'IBU estimés', 'Contribution nulle dans l’équation à durée ou masse nulle.', [TINSETH_SOURCE]), model };
  if (!['% massique', HOP_MODEL_ALPHA_UNIT].includes(input.alpha.unit)) return unknownResult('IBU estimés', 'Un pourcentage alpha identifié est requis comme entrée du modèle.');
  const alphaBounds = numericBounds(input.alpha);
  if (alphaBounds && (alphaBounds.min < 0 || alphaBounds.max > 100)) return unknownResult('IBU estimés', 'Teneur alpha hors de 0–100 %.');
  const utilization = 1.65 * Math.pow(0.000125, gravity - 1) * (1 - Math.exp(-0.04 * input.minutes)) / 4.15;
  const factor = input.grams * 10 * utilization / volumeL;
  const result = combineNumeric([input.alpha], 'IBU estimés', ([a]) => ({ min: a.min * factor, max: a.max * factor }),
    'Estimation Tinseth : volume et densité doivent correspondre à la convention choisie ; aucune amertume à cru ni perception finale comprise.');
  return { ...result, model, sources: [...result.sources, TINSETH_SOURCE], reasons: [...result.reasons, ...input.alpha.reasons,
    context ? `${context.variant} : volume ${context.volumeReference}, densité ${context.gravityReference}. ${context.explanation}`
      : 'Évaluation conventionnelle sur les nombres fournis ; rôles du volume et de la densité non attestés. Aucune OG assimilée silencieusement à une densité moyenne mesurée.',
    'Une estimation IBU peut exister alors que la charge physique d’alpha reste inconnue.'] };
}

export function hopDosePerLitre(grams: number | null, volumeL: number | null): HopNumericResult {
  return isMass(grams) && volumeL !== null && Number.isFinite(volumeL) && volumeL > 0
    ? nominalResult(grams / volumeL, 'g/L', 'Masse divisée par le volume renseigné.')
    : unknownResult('g/L', 'Masse et volume positif requis.');
}

/** IBU target dosing under an explicitly supplied utilization, as in manufacturer calculators. */
export function doseHopExtractForIbu(input: {
  targetIbu: number | null; volumeL: number | null; utilizationFraction: number | null;
  alphaPercent: HopNumericResult; utilizationSource: HopSource;
  alphaGramsPerPackage?: number;
}) {
  const unknown = (reason: string) => ({ alphaGrams: unknownResult('g alpha', reason), productGrams: unknownResult('g', reason), packagePortions: unknownResult('portion de conditionnement', reason),
    limitation: 'Le rendement d’utilisation est une hypothèse déclarée ; ce calcul ne valide pas un emploi ni l’amertume perçue.' });
  if (!isMass(input.targetIbu) || input.volumeL == null || !Number.isFinite(input.volumeL) || input.volumeL <= 0
    || input.utilizationFraction == null || !Number.isFinite(input.utilizationFraction) || input.utilizationFraction <= 0 || input.utilizationFraction > 1) {
    return unknown('Cible IBU, volume positif et utilisation explicite entre 0 exclu et 1 requis.');
  }
  const alphaGrams = nominalResult(input.targetIbu * input.volumeL / (1000 * input.utilizationFraction), 'g alpha',
    'Cible × volume / (1000 × utilisation déclarée).', [input.utilizationSource]);
  const alpha = numericBounds(input.alphaPercent);
  const compatible = input.alphaPercent.unit === '% massique' && alpha && alpha.min > 0 && alpha.max <= 100;
  const productGrams = compatible ? combineNumeric([alphaGrams, input.alphaPercent], 'g', ([mass, pct]) => ({ min: mass.min * 100 / pct.max, max: mass.max * 100 / pct.min }),
    'Masse d’extrait sous la teneur alpha déclarée ; aucune conversion en mL sans densité.')
    : unknownResult('g', 'Alpha massique du produit tel quel requis, avec borne inférieure strictement positive.', input.alphaPercent.sources);
  const perPackage = input.alphaGramsPerPackage;
  const packagePortions = perPackage !== undefined && Number.isFinite(perPackage) && perPackage > 0 && alphaGrams.value !== null
    ? nominalResult(alphaGrams.value / perPackage, 'portion de conditionnement', 'Part de contenu alpha renseigné ; aucune quantité à commander déduite.')
    : unknownResult('portion de conditionnement', 'Contenu alpha du conditionnement non renseigné.');
  return { alphaGrams, productGrams, packagePortions,
    limitation: 'Le rendement d’utilisation est une hypothèse déclarée ; ce calcul ne valide pas un emploi ni l’amertume perçue.' };
}
