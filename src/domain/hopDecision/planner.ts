import { estimateBoilIbu, introducedHopAmounts, replacementHopDose } from './calculations';
import { evaluateHopIntentEvidence, type HopIntentEvidenceCriterion, type HopIntentEvidenceEvaluation } from './intentEvidence';
import { readHopAlphaForAddition } from './modelInputs';
import { compareHopMaterials, hopDecisionReference, numericBounds, unknownResult } from './measurements';
import { applyHopProgramProposal, previewHopProgramChanges } from './programs';
import { samePhysicalHopMaterial } from './strategies';
import type {
  HopDecisionMaterial,
  HopDecisionProgram,
  HopNumericResult,
  HopProgramAddition,
  HopProgramApplication,
  HopProgramChange,
  HopProgramProposal,
  HopReplacementBasis,
  HopUse,
} from './types';

export type HopPlannerDoseBasis = HopReplacementBasis | 'tinsethIbu';

export interface HopPlannerIdentityExclusion {
  kind: 'materialId' | 'stockItemRef' | 'lotId' | 'productId';
  value: string;
  reason: string;
  origin: 'user' | 'proposal';
}

export interface HopPlannerRequest {
  /** Kept verbatim for a reviewable local decision; never parsed into criteria here. */
  question: string;
  interpretation: string;
  criteria: HopIntentEvidenceCriterion[];
  program: HopDecisionProgram;
  unavailable: { materialId: string; reason: string; origin: 'user' | 'proposal' };
  materials: HopDecisionMaterial[];
  exclusions?: HopPlannerIdentityExclusion[];
  /** Each future use needs an explicit quantity/convention; an omitted entry stays unknown. */
  basisByUse: Partial<Record<HopUse, HopPlannerDoseBasis>>;
  /** Optional explicit catalogue scope. Omission means the supplied catalogue. */
  candidateMaterialIds?: string[];
  /** Caps physical identities and distinct documentary variants examined. */
  limits: { maxCandidateMaterials: number; maxAssignments: number; maxPrograms: number };
}

export interface HopPlannerDoseOption {
  additionId: string;
  sourceMaterialId: string;
  candidateMaterialId: string;
  /** Aliases of the same physical identity; a choice is still made against one exact material ID. */
  candidateIdentityMaterialIds: string[];
  documentaryDivergenceFields: string[];
  use: HopUse;
  basis: HopPlannerDoseBasis | null;
  doseGrams: HopNumericResult;
  status: 'fixed' | 'choose' | 'unknown';
  reasons: string[];
  missing: string[];
  tradeoffs: string[];
  introduced: ReturnType<typeof introducedHopAmounts>;
  comparison: ReturnType<typeof compareHopMaterials>;
  intent: HopIntentEvidenceEvaluation[];
}

export interface HopPlannerLine {
  additionId: string;
  sourceMaterialId: string;
  use: HopUse;
  options: HopPlannerDoseOption[];
  missingCandidates: string[];
}

export interface HopPlannerAssignment extends HopPlannerDoseOption {
  chosenGrams?: number;
}

export interface HopReplacementPath {
  pathId: string;
  kind: 'singleMaterial' | 'mixedMaterials';
  assignments: HopPlannerAssignment[];
  /** Every actionable source addition is covered and no future exclusion remains unresolved. */
  complete: boolean;
  status: 'ready' | 'chooseDose' | 'conditional' | 'unavailable';
  applicability: 'available' | 'conditional' | 'unavailable';
  criteria: HopIntentEvidenceEvaluation[];
  preview: HopProgramProposal | null;
  conditions: string[];
  tradeoffs: string[];
}

export interface HopPlannerResult {
  requestReference: string;
  question: string;
  interpretation: string;
  criteria: HopIntentEvidenceCriterion[];
  unavailable: HopPlannerRequest['unavailable'];
  exclusions: HopPlannerIdentityExclusion[];
  unresolvedExclusions: HopPlannerIdentityExclusion[];
  basisByUse: HopPlannerRequest['basisByUse'];
  affectedAdditionIds: string[];
  preservedPerformedAdditionIds: string[];
  preservedPastAdditionIds: string[];
  excludedProgramAdditions: Array<{ additionId: string; materialId: string; state: 'future' | 'past' | 'performed'; reason: string }>;
  lines: HopPlannerLine[];
  paths: HopReplacementPath[];
  unresolved: Array<{ additionId: string; reason: string }>;
  search: {
    candidateMaterialIds: string[];
    candidateIdentityGroups: Array<{ materialIds: string[]; aliases: Array<{ materialId: string; name: string }>;
      includedMaterialIds: string[]; documentaryDivergenceFields: string[];
      variants: Array<{ materialId: string; name: string; factsReference: string }> }>;
    requestedCandidateMaterialIds: string[] | null;
    excludedMaterialIds: string[];
    unresolvedExclusions: HopPlannerIdentityExclusion[];
    omittedCandidateMaterialIds: string[];
    assignmentsExamined: number;
    limits: HopPlannerRequest['limits'];
    truncated: boolean;
    exhaustiveWithinScope: boolean;
  };
  conditions: string[];
  effects: { writesRecipe: false; writesBrewDay: false; writesStock: false };
}

export interface HopPlannerSelection {
  requestReference: string;
  pathId: string;
  selectedDoses: Array<{ additionId: string; materialId: string; grams: number; basis: HopPlannerDoseBasis }>;
  changes: HopProgramChange[];
  proposal: HopProgramProposal;
}

const useOrder: Record<HopUse, number> = { firstWort: 0, boil: 1, whirlpool: 2, fermentation: 3, postFermentation: 4 };
const earliestUse: Record<HopDecisionProgram['stage'], number> = { planning: 0, hotSide: 1, fermenting: 3, conditioning: 4, packaged: 5 };
const hopUses = Object.keys(useOrder) as HopUse[];
const hopStages: HopDecisionProgram['stage'][] = ['planning', 'hotSide', 'fermenting', 'conditioning', 'packaged'];
const doseBases: HopPlannerDoseBasis[] = ['alphaLoad', 'totalOil', 'sameMass', 'manufacturer', 'tinsethIbu'];
const identityExclusionKinds: HopPlannerIdentityExclusion['kind'][] = ['materialId', 'stockItemRef', 'lotId', 'productId'];
const criterionRoles: HopIntentEvidenceCriterion['role'][] = ['seek', 'preserve', 'avoid', 'pairWith', 'observation', 'constraint'];
const origins = ['user', 'proposal'] as const;
const hardSearchLimits = { maxCandidateMaterials: 250, maxAssignments: 5000, maxPrograms: 1000 } as const;
const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))];
const sortText = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

function compactContentReference(content: string, prefix: string): string {
  const hash = (seed: number) => {
    let value = seed >>> 0;
    for (let index = 0; index < content.length; index++) {
      value ^= content.charCodeAt(index);
      value = Math.imul(value, 0x01000193);
    }
    return (value >>> 0).toString(16).padStart(8, '0');
  };
  return `${prefix}:${hash(0x811c9dc5)}${hash(0x9e3779b9)}`;
}

function validateRequest(request: HopPlannerRequest): void {
  if (!record(request) || !record(request.program) || !Array.isArray(request.materials)) throw Error('Demande de planification invalide.');
  if (typeof request.question !== 'string' || typeof request.interpretation !== 'string') throw Error('Conserver la question et son interprétation comme texte.');
  if (!record(request.unavailable) || typeof request.unavailable.materialId !== 'string' || !request.unavailable.materialId.trim()
    || typeof request.unavailable.reason !== 'string' || !request.unavailable.reason.trim()
    || !origins.includes(request.unavailable.origin)) throw Error('Identifier la matière indisponible, sa raison et son origine.');
  if (!Array.isArray(request.criteria) || !record(request.basisByUse) || !record(request.limits)) throw Error('Critères, conventions et limites de recherche requis.');
  const limitNames = Object.keys(hardSearchLimits);
  if (limitNames.some(name => !Object.prototype.hasOwnProperty.call(request.limits, name))
    || Object.keys(request.limits).some(name => !limitNames.includes(name))) throw Error('Les trois plafonds de recherche explicites sont requis, sans champ supplémentaire.');
  for (const [name, maximum] of Object.entries(hardSearchLimits)) {
    const value = request.limits[name as keyof typeof hardSearchLimits];
    if (!Number.isSafeInteger(value) || value <= 0 || value > maximum) throw Error(`Plafond de recherche invalide pour ${name} (1–${maximum}).`);
  }
  if (Object.keys(request.basisByUse).some(use => !hopUses.includes(use as HopUse))) throw Error('Emploi inconnu dans les conventions de dose.');
  if (Object.values(request.basisByUse).some(basis => !doseBases.includes(basis as HopPlannerDoseBasis))) throw Error('Convention de dose inconnue; elle ne peut pas être rabattue sur une autre formule.');
  if (request.candidateMaterialIds !== undefined && (!Array.isArray(request.candidateMaterialIds)
    || request.candidateMaterialIds.some(id => typeof id !== 'string' || !id.trim())
    || new Set(request.candidateMaterialIds).size !== request.candidateMaterialIds.length)) throw Error('Périmètre de candidats invalide ou identifiants répétés.');
  if (!hopStages.includes(request.program.stage) || !Array.isArray(request.program.additions)) throw Error('Étape ou liste d’ajouts du programme invalide.');
  const criterionIds = new Set<string>();
  for (const criterion of request.criteria) {
    if (!record(criterion) || typeof criterion.id !== 'string' || !criterion.id.trim() || criterionIds.has(criterion.id)
      || typeof criterion.description !== 'string' || !criterion.description.trim()
      || !criterionRoles.includes(criterion.role) || !origins.includes(criterion.origin)) throw Error('Critère invalide : id unique, description, rôle et origine requis.');
    criterionIds.add(criterion.id);
    if (criterion.familyId !== undefined && (typeof criterion.familyId !== 'string' || !criterion.familyId.trim())) throw Error(`Famille invalide pour le critère ${criterion.id}.`);
    if (criterion.partner !== undefined) {
      const partner = criterion.partner;
      if (!record(partner) || !['material', 'observation', 'freeContext'].includes(partner.kind)) throw Error(`Partenaire invalide pour le critère ${criterion.id}.`);
      if ((partner.kind === 'material' || partner.kind === 'observation') && (typeof partner.id !== 'string' || !partner.id.trim())) throw Error(`Identité partenaire absente pour le critère ${criterion.id}.`);
      if (partner.kind === 'freeContext' && (typeof partner.text !== 'string' || !partner.text.trim())) throw Error(`Contexte libre absent pour le critère ${criterion.id}.`);
      if (partner.kind === 'observation' && partner.descriptions !== undefined && !Array.isArray(partner.descriptions)) throw Error(`Descriptions d’observation invalides pour le critère ${criterion.id}.`);
      if (partner.kind === 'material' && partner.additionId !== undefined && (typeof partner.additionId !== 'string' || !partner.additionId.trim())) throw Error(`Ajout partenaire invalide pour le critère ${criterion.id}.`);
    }
  }
  if (request.exclusions !== undefined && !Array.isArray(request.exclusions)) throw Error('Liste d’exclusions invalide.');
  for (const exclusion of request.exclusions ?? []) {
    if (!record(exclusion) || !identityExclusionKinds.includes(exclusion.kind) || typeof exclusion.value !== 'string' || !exclusion.value.trim()
      || typeof exclusion.reason !== 'string' || !exclusion.reason.trim() || !origins.includes(exclusion.origin)) throw Error('Une exclusion doit avoir un type, identifiant, raison et origine reconnus.');
  }
  const materials = request.materials;
  if (materials.some(material => !record(material) || typeof material.id !== 'string' || !material.id.trim())
    || new Set(materials.map(material => material.id)).size !== materials.length) throw Error('Identifiants de matière répétés ou invalides dans le catalogue.');
  if (!materials.some(material => material.id === request.unavailable.materialId)) throw Error(`Matière indisponible absente du catalogue : ${request.unavailable.materialId}.`);
  if (request.candidateMaterialIds?.some(id => !materials.some(material => material.id === id))) throw Error('Un identifiant du périmètre candidat manque au catalogue fourni.');
  const additionUses = request.program.additions;
  if (additionUses.some(addition => !record(addition) || typeof addition.id !== 'string' || !addition.id.trim()
    || typeof addition.materialId !== 'string' || !addition.materialId.trim() || !hopUses.includes(addition.use)
    || !['planned', 'performed'].includes(addition.status))) throw Error('Ajout du programme avec identité, emploi ou état invalide.');
  const programIds = additionUses.map(addition => addition.id);
  if (new Set(programIds).size !== programIds.length) throw Error('Identifiants d’ajout répétés dans le programme.');
  if (additionUses.some(addition => !materials.some(material => material.id === addition.materialId))) throw Error('Une matière du programme courant manque au catalogue fourni.');
}

function stockReference(material: HopDecisionMaterial): string | undefined {
  return material.stockItemRef ?? material.lot?.stockItemRef;
}

function matchesExclusion(material: HopDecisionMaterial, exclusion: HopPlannerIdentityExclusion): boolean {
  if (exclusion.kind === 'materialId') return material.id === exclusion.value;
  if (exclusion.kind === 'stockItemRef') return material.stockItemRef === exclusion.value || material.lot?.stockItemRef === exclusion.value;
  if (exclusion.kind === 'lotId') return material.lot?.id === exclusion.value;
  return material.product?.id === exclusion.value;
}

function materialHasIdentityContradiction(material: HopDecisionMaterial): string | null {
  if (material.variety?.archived || material.lot?.archived) return 'Référence archivée.';
  if (material.lot && material.variety && material.lot.varietyId !== material.variety.id) return 'Le lot ne correspond pas à la variété.';
  if (material.lot && material.form !== 'unknown' && material.lot.form !== 'unknown' && material.form !== material.lot.form) return 'La forme du lot contredit celle de la matière.';
  if (material.product && material.product.form !== material.form) return 'La forme du produit commercial contredit celle de la matière.';
  if (material.stockItemRef && material.lot?.stockItemRef && material.stockItemRef !== material.lot.stockItemRef) return 'Deux références de stock se contredisent.';
  return null;
}

function tinsethReplacementDose(
  source: HopDecisionMaterial,
  candidate: HopDecisionMaterial,
  addition: HopProgramAddition,
  program: HopDecisionProgram,
): HopNumericResult {
  if (addition.use !== 'boil') return unknownResult('g', 'La conservation Tinseth ne couvre que les ajouts à l’ébullition.');
  if (!program.ibuModelContext) return unknownResult('g', 'Déclarer les rôles du volume et de la densité Tinseth avant cette convention.');
  const sourceAlpha = readHopAlphaForAddition(source, addition);
  const candidateAddition = { ...addition, materialId: candidate.id, alphaForModel: undefined };
  const candidateAlpha = readHopAlphaForAddition(candidate, candidateAddition);
  const sourceIbu = estimateBoilIbu({ grams: addition.grams, alpha: sourceAlpha, volumeL: program.volumeL,
    wortGravity: program.wortGravity, minutes: addition.boilMinutes ?? null, use: addition.use, modelContext: program.ibuModelContext });
  const candidatePerGram = estimateBoilIbu({ grams: 1, alpha: candidateAlpha, volumeL: program.volumeL,
    wortGravity: program.wortGravity, minutes: addition.boilMinutes ?? null, use: addition.use, modelContext: program.ibuModelContext });
  const target = numericBounds(sourceIbu), rate = numericBounds(candidatePerGram);
  if (!target || !rate) return unknownResult('g', 'Alpha de modèle, masse, durée ou paramètres Tinseth incomplets ; les entrées et sources restent distinctes.', [...sourceIbu.sources, ...candidatePerGram.sources]);
  if (rate.min <= 0) return unknownResult('g', 'La borne basse de l’estimation IBU du candidat est nulle ; aucune dose finie ne conserve cette estimation.', [...sourceIbu.sources, ...candidatePerGram.sources]);
  const range = { min: target.min / rate.max, max: target.max / rate.min };
  if (!Number.isFinite(range.min) || !Number.isFinite(range.max) || range.min < 0 || range.min > range.max) return unknownResult('g', 'Domaine d’inversion Tinseth non fini ou incohérent.', [...sourceIbu.sources, ...candidatePerGram.sources]);
  const sources = [...sourceIbu.sources, ...candidatePerGram.sources];
  const reason = 'Dose obtenue en comparant la contribution Tinseth de cet ajout, avec l’alpha modèle propre à chaque matière et le contexte déclaré.';
  if (sourceIbu.status === 'nominal' && candidatePerGram.status === 'nominal') return {
    status: 'nominal', unit: 'g', value: range.min, range: null, uncertainty: 'notReported', sources,
    reasons: [reason, 'Sous ces entrées nominales, la contribution estimée par le modèle est égale. Ce n’est ni une charge physique d’alpha égale, ni un IBU final mesuré, ni une prédiction sensorielle.'],
  };
  return { status: 'range', unit: 'g', value: null, range, uncertainty: 'partial', sources,
    reasons: [reason, 'Les bornes propagent les entrées disponibles ; elles ne sont pas un intervalle de confiance de bière. Un point de masse choisi dans cet intervalle ne garantit pas une contribution égale pour toutes les valeurs alpha possibles.',
      'Ce n’est ni une charge physique d’alpha égale, ni un IBU final mesuré, ni une prédiction sensorielle.'] };
}

function doseFor(
  source: HopDecisionMaterial,
  candidate: HopDecisionMaterial,
  addition: HopPlannerRequest['program']['additions'][number],
  request: HopPlannerRequest,
  basis: HopPlannerDoseBasis | undefined,
): HopNumericResult {
  if (!basis) return unknownResult('g', `Convention de dose non renseignée pour l’emploi « ${addition.use} ».`);
  if (basis === 'tinsethIbu') return tinsethReplacementDose(source, candidate, addition, request.program);
  return replacementHopDose({ from: source, to: candidate, grams: addition.grams, basis, use: addition.use });
}

function intentEffect(evaluation: HopIntentEvidenceEvaluation): string {
  const status = evaluation.status;
  if (evaluation.criterion.role === 'avoid' && status === 'documentedTension') return 'tensionDocumentaire';
  if ((evaluation.criterion.role === 'seek' && status === 'documentedSupport')
    || (evaluation.criterion.role === 'pairWith' && status === 'documentedOverlap')
    || (evaluation.criterion.role === 'preserve' && status === 'documentedSupport')) return 'soutienDocumentaire';
  if (status === 'observationToPreserve') return 'observationÀPréserver';
  return 'nonÉtabli';
}

function evaluateCriteria(request: HopPlannerRequest, candidate: HopDecisionMaterial): HopIntentEvidenceEvaluation[] {
  return request.criteria.map(criterion => evaluateHopIntentEvidence({ criterion, candidate, materials: request.materials }));
}

function makeDoseOption(
  request: HopPlannerRequest,
  addition: HopPlannerRequest['program']['additions'][number],
  source: HopDecisionMaterial,
  candidate: HopDecisionMaterial,
  identity: PlannerCandidateIdentity,
): HopPlannerDoseOption {
  const basis = request.basisByUse[addition.use] ?? null;
  const doseGrams = doseFor(source, candidate, addition, request, basis ?? undefined);
  const bounds = numericBounds(doseGrams);
  const missing = [...(basis ? [] : [`Convention de dose pour ${addition.use}.`])];
  const identityProblem = materialHasIdentityContradiction(candidate);
  if (identityProblem) missing.push(identityProblem);
  if (candidate.product && !candidate.product.supportedUses.includes(addition.use)) missing.push(`L’emploi « ${addition.use} » n’est pas documenté pour ce produit.`);
  if (candidate.lot?.referenceOnly) missing.push('Lot de référence documentaire : sélectionner un lot réellement possédé avant application.');
  if (candidate.availableGrams === undefined || candidate.availableGrams === null) missing.push('Stock possédé inconnu ; le besoin complet sera regroupé par référence de stock.');
  if (candidate.form === 'unknown') missing.push('Forme de houblon inconnue ; portée de la convention et du produit à confirmer.');
  if (identity.documentaryDivergenceFields.length) {
    missing.push(`Alias de la même identité physique avec faits divergents (${identity.documentaryDivergenceFields.join(', ')}); la variante choisie est référencée ci-dessous, sans moyenne ni choix arbitraire.`);
  }
  if ((basis === 'alphaLoad' || basis === 'totalOil') && (source.variety?.form === 'unknown' || candidate.variety?.form === 'unknown')) {
    missing.push('La forme d’une référence analytique est inconnue ; la transférabilité à cette matière reste conditionnelle.');
  }
  if (bounds && candidate.product?.replacement?.maxDoseGL !== undefined) {
    if (request.program.volumeL === null || request.program.volumeL <= 0) missing.push('Volume inconnu ; le plafond de dose du produit ne peut pas être vérifié.');
    else if (bounds.max / request.program.volumeL > candidate.product.replacement.maxDoseGL) {
      missing.push('Vérifier le plafond cumulé g/L du produit sur le programme complet ; une ligne isolée ne suffit pas.');
    }
  }
  const status: HopPlannerDoseOption['status'] = doseGrams.status === 'nominal' && doseGrams.value !== null ? 'fixed'
    : doseGrams.status === 'range' && doseGrams.range ? 'choose' : 'unknown';
  const reasons = [...doseGrams.reasons];
  if (basis === 'tinsethIbu') reasons.push('Alpha physique introducé, charge alpha et IBU final restent des quantités séparées.');
  const intent = evaluateCriteria(request, candidate);
  const intentTensions = intent.filter(item => intentEffect(item) === 'tensionDocumentaire');
  if (intentTensions.length) reasons.push('Une description cite un caractère explicitement évité ; cela signale une tension documentaire, pas sa présence certaine dans la bière.');
  if (intent.some(item => intentEffect(item) === 'soutienDocumentaire')) reasons.push('Une description contextualisée soutient au moins une piste recherchée ou un recouvrement demandé ; cela ne mesure ni l’accord ni l’intensité.');
  if (intent.some(item => intentEffect(item) === 'nonÉtabli')) reasons.push('Au moins un critère reste non établi ; les preuves manquantes sont conservées par critère.');
  return {
    additionId: addition.id, sourceMaterialId: source.id, candidateMaterialId: candidate.id,
    candidateIdentityMaterialIds: [...identity.materialIds],
    documentaryDivergenceFields: [...identity.documentaryDivergenceFields], use: addition.use, basis,
    doseGrams, status, reasons, missing,
    tradeoffs: [
      basis === 'tinsethIbu' ? 'Convention d’égalité d’une estimation Tinseth d’ébullition sous un contexte déclaré ; elle ne préserve pas la matière végétale ni le goût.'
        : basis === 'alphaLoad' ? 'Convention de charge alpha physique sous les teneurs qualifiées ; elle ne garantit pas les IBU ni la perception.'
          : basis === 'totalOil' ? 'Convention de volume d’huile introduit sous les analyses qualifiées ; composition, extraction et bière peuvent différer.'
            : basis === 'manufacturer' ? 'Plage fabricant limitée au produit, à la forme et aux emplois publiés.'
              : basis === 'sameMass' ? 'Convention explicite de masse égale ; aucune équivalence aromatique ou amère n’est impliquée.'
                : 'Aucune convention défendable n’a été donnée pour cet emploi.',
      'Les descriptions aromatiques documentent des mots/contextes ; elles ne prédisent ni rétention, ni intensité, ni résultat final.',
      ...candidate.product?.cautions ?? [],
    ],
    introduced: introducedHopAmounts(candidate, doseGrams),
    comparison: compareHopMaterials(source, candidate),
    intent,
  };
}

function validateCandidateForLine(candidate: HopDecisionMaterial, use: HopUse): string | null {
  const identityProblem = materialHasIdentityContradiction(candidate);
  if (identityProblem) return identityProblem;
  if (candidate.product && !candidate.product.supportedUses.includes(use)) return `Produit sans usage documenté « ${use} ».`;
  return null;
}

interface PlannerCandidateIdentity {
  material: HopDecisionMaterial;
  materialIds: string[];
  variants: Array<{ materialId: string; name: string; factsReference: string }>;
  documentaryDivergenceFields: string[];
}

function materialFacts(material: HopDecisionMaterial) {
  return {
    form: material.form,
    variety: material.variety,
    lot: material.lot,
    product: material.product,
    declaredAnalysis: material.declaredAnalysis,
    alphaForModel: material.alphaForModel,
    stockItemRef: stockReference(material),
  };
}

function candidateIdentityGroup(materials: HopDecisionMaterial[]): PlannerCandidateIdentity[] {
  const sorted = [...materials].sort((a, b) => sortText(a.id, b.id));
  if (!sorted.length) return [];
  const fields = Object.keys(materialFacts(sorted[0]));
  const divergent = fields.filter(field => {
    const values = sorted.map(material => hopDecisionReference(materialFacts(material)[field as keyof ReturnType<typeof materialFacts>]));
    return new Set(values).size > 1;
  });
  const byFacts = new Map<string, HopDecisionMaterial[]>();
  for (const material of sorted) {
    const reference = hopDecisionReference(materialFacts(material));
    byFacts.set(reference, [...(byFacts.get(reference) ?? []), material]);
  }
  const variants = [...byFacts.entries()].map(([factsSignature, aliases]) => ({
    materialId: aliases[0].id, name: aliases[0].name,
    factsReference: compactContentReference(factsSignature, 'hop-material-facts-v1'),
  }));
  return variants.map(variant => ({ material: sorted.find(material => material.id === variant.materialId)!,
    materialIds: sorted.map(material => material.id), variants: structuredClone(variants), documentaryDivergenceFields: divergent }));
}

function resolveExclusions(request: HopPlannerRequest): { excludedIds: Set<string>; unresolved: HopPlannerIdentityExclusion[] } {
  const excludedIds = new Set<string>();
  const unresolved: HopPlannerIdentityExclusion[] = [];
  for (const exclusion of request.exclusions ?? []) {
    const matched = request.materials.filter(material => matchesExclusion(material, exclusion));
    if (!matched.length) { unresolved.push(exclusion); continue; }
    for (const directlyMatched of matched) {
      for (const material of request.materials) {
        if (matchesExclusion(material, exclusion) || samePhysicalHopMaterial(directlyMatched, material)) excludedIds.add(material.id);
      }
    }
  }
  return { excludedIds, unresolved };
}

function canonicalCandidatePool(request: HopPlannerRequest, source: HopDecisionMaterial): {
  candidates: PlannerCandidateIdentity[]; excluded: string[]; omitted: string[]; eligibleCount: number;
  groups: Array<{ materialIds: string[]; aliases: Array<{ materialId: string; name: string }>;
    includedMaterialIds: string[]; documentaryDivergenceFields: string[];
    variants: Array<{ materialId: string; name: string; factsReference: string }> }>;
  unresolvedExclusions: HopPlannerIdentityExclusion[];
} {
  const resolved = resolveExclusions(request);
  const scope = request.candidateMaterialIds ? new Set(request.candidateMaterialIds) : undefined;
  const inScope = request.materials.filter(material => !scope || scope.has(material.id));
  const filtered = inScope.filter(material => !samePhysicalHopMaterial(source, material) && !resolved.excludedIds.has(material.id));
  const excluded = [...resolved.excludedIds].sort(sortText);
  const physicalGroups: HopDecisionMaterial[][] = [];
  for (const material of [...filtered].sort((a, b) => sortText(a.id, b.id))) {
    const group = physicalGroups.find(items => items.some(previous => samePhysicalHopMaterial(previous, material)));
    if (group) group.push(material);
    else physicalGroups.push([material]);
  }
  const included: PlannerCandidateIdentity[] = [];
  const omitted: string[] = [];
  for (const [index, group] of physicalGroups.entries()) {
    const identities = candidateIdentityGroup(group);
    if (index >= request.limits.maxCandidateMaterials) {
      omitted.push(...group.map(material => material.id));
      continue;
    }
    const remainingBudget = Math.max(0, request.limits.maxCandidateMaterials - included.length);
    included.push(...identities.slice(0, remainingBudget));
    omitted.push(...identities.slice(remainingBudget).map(identity => identity.material.id));
  }
  const includedIds = new Set(included.map(candidate => candidate.material.id));
  const outputGroups = physicalGroups.map(group => {
    const identities = candidateIdentityGroup(group);
    return { materialIds: group.map(material => material.id).sort(sortText),
      aliases: [...group].sort((a, b) => sortText(a.id, b.id)).map(material => ({ materialId: material.id, name: material.name })),
      includedMaterialIds: identities.filter(identity => includedIds.has(identity.material.id)).map(identity => identity.material.id),
      documentaryDivergenceFields: identities[0]?.documentaryDivergenceFields ?? [],
      variants: identities[0]?.variants ?? [] };
  });
  return { candidates: included, excluded, omitted, eligibleCount: physicalGroups.length, groups: outputGroups,
    unresolvedExclusions: resolved.unresolved };
}

function assignmentEvidence(assignments: HopPlannerAssignment[]): HopIntentEvidenceEvaluation[] {
  return assignments.flatMap(assignment => assignment.intent.map(evaluation => ({ ...evaluation, consequence:
    `${assignment.additionId} / ${assignment.candidateMaterialId} — ${evaluation.consequence}`, }))) ;
}

function pathFingerprint(requestReference: string, assignments: HopPlannerAssignment[], kind: HopReplacementPath['kind']): string {
  const scopedContent = hopDecisionReference({ requestReference, kind,
    assignments: assignments.map(({ additionId, candidateMaterialId, basis }) => ({ additionId, candidateMaterialId, basis })),
  });
  // Compact, deterministic UI reference. requestReference remains the full freshness guard;
  // these non-cryptographic checksums are not authorization or security tokens.
  return compactContentReference(scopedContent, 'hop-path-v1');
}

function buildPath(request: HopPlannerRequest, requestReference: string, choices: HopPlannerDoseOption[], programExclusions: HopPlannerResult['excludedProgramAdditions']): HopReplacementPath {
  const candidates = unique(choices.map(choice => choice.candidateMaterialId));
  const assignments: HopPlannerAssignment[] = choices.map(choice => ({ ...choice }));
  const kind = candidates.length <= 1 ? 'singleMaterial' : 'mixedMaterials';
  const conditions: string[] = [];
  const needsDose = assignments.some(assignment => assignment.status === 'choose');
  const unknownDose = assignments.some(assignment => assignment.status === 'unknown');
  for (const assignment of assignments) {
    if (assignment.status === 'choose') conditions.push(`${assignment.additionId} : choisir une dose dans les bornes explicites ${JSON.stringify(assignment.doseGrams.range)} g.`);
    if (assignment.status === 'unknown') conditions.push(`${assignment.additionId} : dose inconnue ; ${assignment.missing.join(' ') || assignment.doseGrams.reasons.join(' ')}`);
    conditions.push(...assignment.missing.map(reason => `${assignment.additionId} : ${reason}`));
  }
  conditions.push(...programExclusions.map(item => `${item.additionId} : ${item.reason}`));
  let preview: HopProgramProposal | null = null;
  let previewFailed = false;
  if (!needsDose && !unknownDose && request.program.stage !== 'packaged') {
    const changes: HopProgramChange[] = assignments.map(assignment => {
      const sourceAddition = request.program.additions.find(addition => addition.id === assignment.additionId)!;
      const candidate = request.materials.find(material => material.id === assignment.candidateMaterialId)!;
      const { alphaForModel: _sourceAlphaForModel, ...additionWithoutSourceAlpha } = sourceAddition;
      const grams = assignment.doseGrams.value!;
      assignment.chosenGrams = grams;
      assignment.introduced = introducedHopAmounts(candidate, grams);
      return { kind: 'replace', additionId: sourceAddition.id,
        additions: [{ ...additionWithoutSourceAlpha, materialId: candidate.id, grams }] };
    });
    try {
      preview = previewHopProgramChanges(request.program, changes, request.materials);
      conditions.push(...preview.conditions);
    } catch (error) {
      previewFailed = true;
      conditions.push(error instanceof Error ? error.message : 'Aperçu de programme impossible.');
    }
  }
  if (request.program.stage === 'packaged') conditions.push('Programme conditionné : aucune action immédiate ; créer une variante de brassin future.');
  const incomplete = programExclusions.some(item => item.state === 'future');
  const unresolvedOptionFacts = assignments.some(assignment => assignment.missing.length > 0);
  const applicability: HopReplacementPath['applicability'] = incomplete || previewFailed || preview?.applicability === 'unavailable' ? 'unavailable'
    : preview?.applicability === 'conditional' || needsDose || unknownDose || unresolvedOptionFacts || !preview ? 'conditional' : 'available';
  const status: HopReplacementPath['status'] = applicability === 'unavailable' ? 'unavailable'
    : needsDose ? 'chooseDose' : applicability === 'available' ? 'ready' : 'conditional';
  const criteria = assignmentEvidence(assignments);
  const tradeoffs = unique(assignments.flatMap(assignment => assignment.tradeoffs));
  return { pathId: pathFingerprint(requestReference, assignments, kind), kind, assignments, complete: !incomplete, status,
    applicability, criteria, preview, conditions: unique(conditions), tradeoffs };
}

function excludedFutureProgramAdditions(request: HopPlannerRequest): Array<{ additionId: string; materialId: string; state: 'future' | 'past' | 'performed'; reason: string }> {
  const source = request.materials.find(material => material.id === request.unavailable.materialId)!;
  const excludedIds = resolveExclusions(request).excludedIds;
  return request.program.additions.flatMap(addition => {
    const material = request.materials.find(item => item.id === addition.materialId)!;
    if (!excludedIds.has(material.id) || samePhysicalHopMaterial(source, material)) return [];
    const state = addition.status === 'performed' ? 'performed' : useOrder[addition.use] < earliestUse[request.program.stage] ? 'past' : 'future';
    const reason = state === 'future' ? `matière explicitement exclue ${material.id} toujours planifiée; la voie ne couvre pas tout le programme.`
      : state === 'performed' ? `matière explicitement exclue ${material.id} déjà effectuée; le passé reste intact.`
        : `matière explicitement exclue ${material.id} sur un emploi déjà passé; la ligne reste intacte.`;
    return [{ additionId: addition.id, materialId: material.id, state, reason }];
  });
}

/**
 * Builds bounded, candidate-derived full replacements. It does not mutate recipe,
 * brew-day or stock state and does not score or predict sensory outcomes.
 */
export function planHopReplacement(request: HopPlannerRequest): HopPlannerResult {
  validateRequest(request);
  const requestReference = `hop-planner-request-v1:${hopDecisionReference(request)}`;
  const unavailable = request.materials.find(material => material.id === request.unavailable.materialId)!;
  const pool = canonicalCandidatePool(request, unavailable);
  const excludedSet = new Set(pool.excluded);
  const excludedProgramAdditions = excludedFutureProgramAdditions(request);
  const affected = request.program.additions.filter(addition => addition.status === 'planned'
    && request.materials.some(material => material.id === addition.materialId && samePhysicalHopMaterial(unavailable, material)));
  const performed = request.program.additions.filter(addition => addition.status === 'performed'
    && request.materials.some(material => material.id === addition.materialId && samePhysicalHopMaterial(unavailable, material)));
  const active = affected.filter(addition => useOrder[addition.use] >= earliestUse[request.program.stage]);
  const past = affected.filter(addition => useOrder[addition.use] < earliestUse[request.program.stage]);
  const lines: HopPlannerLine[] = active.map(addition => {
    const source = request.materials.find(material => material.id === addition.materialId)!;
    const options: HopPlannerDoseOption[] = [];
    const missingCandidates: string[] = [];
    for (const candidateIdentity of pool.candidates) {
      const candidate = candidateIdentity.material;
      const problem = validateCandidateForLine(candidate, addition.use);
      if (problem) { missingCandidates.push(`${candidate.id} : ${problem}`); continue; }
      options.push(makeDoseOption(request, addition, source, candidate, candidateIdentity));
    }
    if (!options.length) missingCandidates.push('Aucun candidat admissible au stade, à l’emploi et à l’identité de matière de cet ajout dans le périmètre fourni.');
    return { additionId: addition.id, sourceMaterialId: source.id, use: addition.use, options, missingCandidates };
  });
  const unresolved = lines.filter(line => !line.options.length).map(line => ({ additionId: line.additionId,
    reason: line.missingCandidates.join(' ') || 'Aucun candidat dans le périmètre.' }));
  unresolved.push(...excludedProgramAdditions.filter(item => item.state === 'future').map(item => ({ additionId: item.additionId, reason: item.reason })));
  if (!active.length) unresolved.push({ additionId: '', reason: past.length
    ? 'Les ajouts prévus de cette identité ont déjà dépassé leur emploi au stade courant ; ils restent intacts.'
    : 'Aucun ajout prévu futur de cette identité physique n’a été trouvé.' });

  const paths: HopReplacementPath[] = [];
  let assignmentsExamined = 0;
  let truncated = pool.omitted.length > 0;
  const assignment: HopPlannerDoseOption[] = [];
  const enumerate = (index: number) => {
    if (paths.length >= request.limits.maxPrograms || assignmentsExamined >= request.limits.maxAssignments) { truncated = true; return; }
    if (index === lines.length) {
      assignmentsExamined++;
      paths.push(buildPath(request, requestReference, assignment, excludedProgramAdditions));
      return;
    }
    const line = lines[index];
    for (const option of line.options) {
      if (paths.length >= request.limits.maxPrograms || assignmentsExamined >= request.limits.maxAssignments) { truncated = true; return; }
      assignment.push(option);
      enumerate(index + 1);
      assignment.pop();
    }
  };
  if (lines.length && lines.every(line => line.options.length)) enumerate(0);
  const conditions = [
    `${pool.eligibleCount} identité(s) physique(s) admissible(s) avant plafonnement ; ${Math.min(pool.eligibleCount, request.limits.maxCandidateMaterials)} groupe(s) examiné(s) et ${pool.candidates.length} variante(s) documentaire(s) calculée(s).`,
    ...pool.omitted.length ? [`Recherche tronquée au plafond candidat ; identités omises : ${pool.omitted.join(', ')}.`] : [],
    ...truncated ? ['Recherche bornée ou tronquée ; l’absence de voie dans ces résultats ne démontre pas une impossibilité.'] : [],
    ...past.map(addition => `${addition.id} : emploi passé, conservé sans remplacement.`),
    ...performed.map(addition => `${addition.id} : opération effectuée conservée strictement inchangée.`),
    ...request.exclusions?.map(exclusion => `Exclusion ${exclusion.kind} « ${exclusion.value} » (${exclusion.origin}) : ${exclusion.reason}`) ?? [],
    ...pool.unresolvedExclusions.map(exclusion => `Exclusion non résolue dans le catalogue (${exclusion.kind} « ${exclusion.value} ») : aucune matière correspondante n’a été trouvée.`),
    ...excludedProgramAdditions.map(item => `${item.additionId} : ${item.reason}`),
  ];
  if (request.program.stage === 'packaged') conditions.push('Programme conditionné : seules des évaluations documentaires peuvent être lues ; aucune action immédiate ne peut être proposée.');
  if (!paths.length) conditions.push('Aucune voie complète n’a été générée à partir des conventions et candidats actuels ; consulter les options par ligne et les limites de périmètre.');
  return {
    requestReference, question: request.question, interpretation: request.interpretation,
    criteria: structuredClone(request.criteria), unavailable: structuredClone(request.unavailable),
    exclusions: structuredClone(request.exclusions ?? []), basisByUse: structuredClone(request.basisByUse),
    unresolvedExclusions: structuredClone(pool.unresolvedExclusions),
    affectedAdditionIds: affected.map(addition => addition.id),
    preservedPerformedAdditionIds: performed.map(addition => addition.id),
    preservedPastAdditionIds: past.map(addition => addition.id),
    excludedProgramAdditions,
    lines, paths, unresolved,
    search: { candidateMaterialIds: pool.candidates.map(identity => identity.material.id),
      candidateIdentityGroups: structuredClone(pool.groups),
      requestedCandidateMaterialIds: request.candidateMaterialIds ? [...request.candidateMaterialIds] : null,
      excludedMaterialIds: [...excludedSet].sort(sortText),
      unresolvedExclusions: structuredClone(pool.unresolvedExclusions),
      omittedCandidateMaterialIds: pool.omitted, assignmentsExamined, limits: structuredClone(request.limits), truncated,
      exhaustiveWithinScope: !truncated },
    conditions: unique(conditions),
    effects: { writesRecipe: false, writesBrewDay: false, writesStock: false },
  };
}

/** A few binary rounding units for computed doses, scaled to each compared endpoint.
 * No absolute gram allowance, analytical uncertainty or change to the chosen value. */
function sameComputedDose(left: number, right: number): boolean {
  return left === right || Math.abs(left - right) <= 8 * Number.EPSILON * Math.max(Math.abs(left), Math.abs(right));
}

/** Rebuilds and freezes the exact selected program proposal; never applies it. */
export function selectHopReplacementPath(input: {
  request: HopPlannerRequest;
  plan: HopPlannerResult;
  pathId: string;
  dosesByAdditionId?: Record<string, number>;
}): HopPlannerSelection {
  validateRequest(input.request);
  const fresh = planHopReplacement(input.request);
  if (fresh.requestReference !== input.plan.requestReference) throw Error('Les données, le programme ou la requête ont changé ; recalculer les voies avant sélection.');
  const path = fresh.paths.find(candidate => candidate.pathId === input.pathId);
  if (!path || !path.complete || path.applicability === 'unavailable') throw Error('Voie absente, incomplète ou techniquement indisponible.');
  if (input.dosesByAdditionId !== undefined) {
    if (!record(input.dosesByAdditionId)) throw Error('Choix de dose invalide.');
    const targetIds = new Set(path.assignments.map(assignment => assignment.additionId));
    if (Object.keys(input.dosesByAdditionId).some(additionId => !targetIds.has(additionId))) throw Error('Le choix de dose vise un ajout absent de cette voie.');
    if (Object.values(input.dosesByAdditionId).some(grams => typeof grams !== 'number' || !Number.isFinite(grams))) throw Error('Dose choisie non finie.');
  }
  const changes: HopProgramChange[] = [];
  const selectedDoses: HopPlannerSelection['selectedDoses'] = [];
  for (const assignment of path.assignments) {
    const bounds = numericBounds(assignment.doseGrams);
    if (!bounds || !assignment.basis) throw Error(`${assignment.additionId} : dose ou convention inconnue ; fournir les données ou choisir une convention avant le preview.`);
    const chosen = input.dosesByAdditionId && Object.prototype.hasOwnProperty.call(input.dosesByAdditionId, assignment.additionId)
      ? input.dosesByAdditionId[assignment.additionId] : assignment.doseGrams.value;
    if (chosen === null || chosen === undefined || !Number.isFinite(chosen) || chosen < 0
      || (chosen < bounds.min && !sameComputedDose(chosen, bounds.min))
      || (chosen > bounds.max && !sameComputedDose(chosen, bounds.max))) {
      throw Error(`${assignment.additionId} : choisir une dose finie dans la plage ${bounds.min}–${bounds.max} g.`);
    }
    if (assignment.status === 'fixed' && !sameComputedDose(chosen, assignment.doseGrams.value!)) throw Error(`${assignment.additionId} : la convention fixe ${assignment.doseGrams.value} g ; choisir une autre convention pour changer cette dose.`);
    const addition = input.request.program.additions.find(row => row.id === assignment.additionId);
    if (!addition || addition.status !== 'planned') throw Error(`${assignment.additionId} : l’ajout source n’est plus prévu.`);
    const { alphaForModel: _sourceAlphaForModel, ...additionWithoutSourceAlpha } = addition;
    changes.push({ kind: 'replace', additionId: addition.id,
      additions: [{ ...additionWithoutSourceAlpha, materialId: assignment.candidateMaterialId, grams: chosen }] });
    selectedDoses.push({ additionId: assignment.additionId, materialId: assignment.candidateMaterialId, grams: chosen, basis: assignment.basis });
  }
  if (!changes.length) throw Error('La voie ne modifie aucun ajout futur.');
  const proposal = previewHopProgramChanges(input.request.program, changes, input.request.materials);
  const selectedPathFingerprint = pathFingerprint(fresh.requestReference, path.assignments, path.kind);
  if (selectedPathFingerprint !== input.pathId) throw Error('Le manifeste de voie ne correspond plus à son contenu recalculé.');
  return { requestReference: fresh.requestReference, pathId: input.pathId, selectedDoses, changes, proposal };
}

/** Optional local transition helper; state remains in memory and inventory is untouched. */
export function applySelectedHopReplacement(
  request: HopPlannerRequest,
  selection: HopPlannerSelection,
): HopProgramApplication {
  validateRequest(request);
  if (!record(selection) || typeof selection.requestReference !== 'string' || typeof selection.pathId !== 'string'
    || !Array.isArray(selection.selectedDoses) || !Array.isArray(selection.changes) || !record(selection.proposal)) {
    throw Error('Reçu de sélection incomplet ou invalide.');
  }
  if (selection.selectedDoses.some(dose => !record(dose) || typeof dose.additionId !== 'string'
    || typeof dose.materialId !== 'string' || typeof dose.grams !== 'number' || !Number.isFinite(dose.grams)
    || !doseBases.includes(dose.basis))) throw Error('Une dose affichée dans le reçu est invalide.');
  const plan = planHopReplacement(request);
  if (selection.requestReference !== plan.requestReference) throw Error('La requête ou ses critères ont changé depuis la sélection; recalculer les voies.');
  if (new Set(selection.selectedDoses.map(dose => dose.additionId)).size !== selection.selectedDoses.length) throw Error('La dose sélectionnée apparaît plusieurs fois.');
  const dosesByAdditionId = Object.fromEntries(selection.selectedDoses.map(dose => [dose.additionId, dose.grams]));
  const expected = selectHopReplacementPath({ request, plan, pathId: selection.pathId, dosesByAdditionId });
  if (hopDecisionReference(selection.selectedDoses) !== hopDecisionReference(expected.selectedDoses)) {
    throw Error('Les doses affichées ne correspondent pas aux matières, conventions ou domaines recalculés.');
  }
  if (hopDecisionReference(selection.changes) !== hopDecisionReference(expected.changes)) throw Error('Les changements ne correspondent pas au reçu sélectionné.');
  if (hopDecisionReference(selection.proposal) !== hopDecisionReference(expected.proposal)) throw Error('L’aperçu ne correspond pas aux doses affichées; le programme ne peut pas être appliqué.');
  return applyHopProgramProposal(request.program, expected.proposal, request.materials);
}
