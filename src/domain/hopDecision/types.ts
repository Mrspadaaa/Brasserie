import type { HopAnalyte, HopDescription, HopLot, HopMeasurement, HopProductForm, HopRange, HopSource, HopVariety } from '../../../functions/src/hopIndexSchema';

/** This API describes a decision, not a persisted recipe or a sensory prediction. */
export const HOP_DECISION_VERSION = 'hop-decision-v1' as const;
export type HopUse = 'firstWort' | 'boil' | 'whirlpool' | 'fermentation' | 'postFermentation';
export type HopProcessStage = 'planning' | 'hotSide' | 'fermenting' | 'conditioning' | 'packaged';

export interface HopCommercialProduct {
  id: string;
  name: string;
  manufacturer: string;
  form: HopProductForm;
  /** A product name is not a synonym for all products of the same physical form. */
  supportedUses: HopUse[];
  source: HopSource;
  reviewedOn: string;
  cautions: string[];
  replacement?: {
    referenceForm: HopProductForm;
    uses: HopUse[];
    basis: 'manufacturerMassRatio';
    gramsPerGram: HopRange;
    source: HopSource;
    limitations: string[];
    /** Scope of the published replacement convention, not a universal safety limit. */
    maxEquivalentFraction?: number;
    maxDoseGL?: number;
  };
}

export interface HopDecisionMaterial {
  /** Stable identity chosen by the caller. Never inferred from a marketing name. */
  id: string;
  name: string;
  form: HopProductForm;
  variety?: HopVariety;
  lot?: HopLot;
  product?: HopCommercialProduct;
  /** Explicit analytical declarations. Recipe alpha belongs to alphaForModel. */
  declaredAnalysis?: HopMeasurement[];
  /** A selected model input is not a new analytical observation. */
  alphaForModel?: HopAlphaModelParameter;
  stockItemRef?: string;
  /** Null/omitted is unknown. Zero means explicitly unavailable. */
  availableGrams?: number | null;
}

export interface HopAlphaModelParameter {
  analyte: 'alpha';
  unit: 'percentAlpha';
  kind: 'point' | 'range';
  value?: number;
  range?: HopRange;
  analyticalBasis: 'asIs' | 'dryMatter' | 'unknown';
  origin: 'recipe' | 'selectedObservation' | 'workingHypothesis';
  source: HopSource;
  selectionReason: string;
  /** Exact observation selected, or informing a separately identified working hypothesis. */
  observationRef?: string;
}

export interface HopIbuModelContext {
  variant: 'tinseth-original' | 'tinseth-declared-variant';
  volumeL: number;
  volumeReference: 'finishedBeer' | 'fermenter' | 'kettleHot' | 'kettleCold';
  gravity: number;
  gravityReference: 'averageBoil' | 'atAddition' | 'originalGravity';
  explanation: string;
}

export interface HopNumericResult {
  status: 'nominal' | 'range' | 'unknown' | 'conflict';
  unit: string;
  value: number | null;
  range: HopRange | null;
  /** An arithmetic point or manufacturer range is not a confidence interval. */
  uncertainty: 'reportedBounds' | 'notReported' | 'partial' | 'unknown';
  sources: HopSource[];
  reasons: string[];
  model?: {
    id: 'tinseth-boil-v1';
    convention: 'declaredOriginal' | 'declaredVariant' | 'inputRolesUnspecified';
    volumeL: number;
    volumeReference: HopIbuModelContext['volumeReference'] | 'unspecified';
    gravity: number;
    gravityReference: HopIbuModelContext['gravityReference'] | 'unspecified';
    alphaInput: { status: HopNumericResult['status']; unit: string; value: number | null; range: HopRange | null };
  };
}

export interface HopAnalyticalReading extends HopNumericResult {
  analyte: HopAnalyte;
  scope: 'lot' | 'variety' | 'declaration' | 'unknown';
  measurements: HopMeasurement[];
}

export interface HopMaterialComparison {
  leftId: string;
  rightId: string;
  analytical: Array<{ analyte: HopAnalyte; left: HopAnalyticalReading; right: HopAnalyticalReading; difference: HopNumericResult }>;
  descriptions: Array<{ context: HopDescription['context']; left: HopDescription[]; right: HopDescription[] }>;
  limits: string[];
}

export interface HopProgramAddition {
  id: string;
  materialId: string;
  grams: number | null;
  use: HopUse;
  status: 'planned' | 'performed';
  /** Optional working model choice for this addition only; never replaces the material's assay. */
  alphaForModel?: HopAlphaModelParameter;
  /** Remaining boil time or contact time is explicit; a missing value is not a default. */
  boilMinutes?: number | null;
  contactHours?: number | null;
  temperatureC?: number | null;
  dayOffset?: number | null;
}

export interface HopDecisionProgram {
  id: string;
  revision: number;
  stage: HopProcessStage;
  volumeL: number | null;
  wortGravity: number | null;
  /** Optional qualified model inputs, separate from the programme's contact volume. */
  ibuModelContext?: HopIbuModelContext;
  additions: HopProgramAddition[];
}

export type HopProgramChange = { kind: 'replace'; additionId: string; additions: HopProgramAddition[] }
  | { kind: 'append'; addition: HopProgramAddition }
  | { kind: 'remove'; additionId: string };

export interface HopProgramProposal {
  version: typeof HOP_DECISION_VERSION;
  /** Canonical content reference, not an authorization token. */
  baseline: string;
  /** Material evidence used by the preview, independently of its changing stock quantity. */
  materialReferences: Record<string, string>;
  program: HopDecisionProgram;
  changes: HopProgramChange[];
  applicability: 'available' | 'conditional' | 'unavailable';
  stock: Array<{ materialId: string; materialIds?: string[]; stockItemRef?: string; neededGrams: number | null; availableGrams: number | null; status: 'available' | 'unknown' | 'insufficient' | 'referenceOnly' }>;
  conditions: string[];
}

export interface HopProgramApplication {
  version: typeof HOP_DECISION_VERSION;
  before: HopDecisionProgram;
  after: HopDecisionProgram;
  proposal: HopProgramProposal;
}

export type HopReplacementBasis = 'alphaLoad' | 'totalOil' | 'sameMass' | 'manufacturer';

export interface HopSubstitutionOption {
  id: string;
  materialId: string;
  basis: HopReplacementBasis;
  doseGrams: HopNumericResult;
  use: HopUse;
  applicability: 'ready' | 'chooseDose' | 'conditional' | 'blocked';
  reasons: string[];
  tradeoffs: string[];
  missing: string[];
  comparison: HopMaterialComparison;
  changes: HopProgramChange[] | null;
  introduced: { alphaGrams: HopNumericResult; oilMl: HopNumericResult };
  reference: string;
  programPreview?: HopProgramProposal;
}
