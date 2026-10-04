import type { HopDecisionIntent } from './service';
import {
  HOP_ADVICE_VERSION,
  assertHopAdviceInput,
  assertHopStrategyAdviceResult,
  hopAdviceCanonicalReference,
  hopAdviceInputReference,
  hopAdviceOptionReference,
  hopAdviceResultReference,
  type HopAdviceCriterionEffect,
  type HopAdviceDimension,
  type HopAdviceDimensionEffect,
  type HopAdviceEvidenceSource,
  type HopAdviceExclusion,
  type HopAdviceInput,
  type HopAdviceOption,
  type HopAdviceProgramScope,
  type HopAdviceSituation,
  type HopStrategyAdviceResult,
} from './adviceSchema';
import { evaluateHopIntentEvidence, type HopIntentEvidenceCriterion, type HopIntentEvidenceEvaluation } from './intentEvidence';
import { hopAdviceEvidence } from './adviceEvidence';
import { hopSourceError } from '../../../functions/src/hopIndexSchema';
import type { HopDecisionMaterial, HopDecisionProgram, HopProgramAddition, HopUse } from './types';

type AdviceRunInput = Omit<HopAdviceInput, 'intent'> & { intent: HopDecisionIntent };
type OptionContent = Omit<HopAdviceOption, 'id' | 'reference'>;
type EvidenceSide = 'candidate' | 'partner';

const useByStage: Record<HopAdviceSituation['stage'], readonly HopUse[]> = {
  planning: ['firstWort', 'boil', 'whirlpool', 'fermentation', 'postFermentation'],
  hotSide: ['boil', 'whirlpool', 'fermentation', 'postFermentation'],
  fermenting: ['fermentation', 'postFermentation'],
  conditioning: ['postFermentation'],
  packaged: [],
};

interface EvidenceCollector {
  rows: Map<string, HopAdviceEvidenceSource>;
  identityToId: Map<string, string>;
  nextId: number;
}

interface MutableRequest {
  id: string;
  question: string;
  whyDecisionChanging: string;
  optionIds: Set<string>;
}

interface DraftOption {
  content: OptionContent;
  candidate: HopDecisionMaterial | null;
  criterionDimensions: Map<string, HopAdviceDimension[]>;
}

type AdviceRoute = 'programOperation' | 'removePlanned' | 'keepPlanned' | 'lotObservation'
  | 'documentaryReference' | 'directTransfer' | 'observeCurrent' | 'globalBalance' | 'bioInvestigation';

interface AdviceOptionSpec {
  candidate: HopDecisionMaterial | null;
  title: string;
  scope: HopAdviceProgramScope;
  route: AdviceRoute;
  relatedMaterialIds?: string[];
  extraDimensions?: HopAdviceDimension[];
  additionId?: string;
  request?: { id: string; question: string; whyDecisionChanging: string };
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function materialMap(materials: readonly HopDecisionMaterial[]): Map<string, HopDecisionMaterial> {
  return new Map(materials.map(material => [material.id, material]));
}

function selectedMaterialIds(input: HopAdviceInput): string[] {
  return input.situation.materialIds
    ? unique(input.situation.materialIds)
    : unique(input.materials.map(material => material.id));
}

function omittedMaterialIds(input: HopAdviceInput): Set<string> {
  return new Set(input.qualification?.omitted.map(row => row.materialId) ?? []);
}

function isReferenceOnly(material: HopDecisionMaterial): boolean {
  return material.lot?.referenceOnly === true;
}

function isArchived(material: HopDecisionMaterial): boolean {
  return Boolean(material.variety?.archived || material.lot?.archived);
}

function canScopeMaterial(material: HopDecisionMaterial): boolean {
  if (material.form === 'unknown' || isReferenceOnly(material) || isArchived(material) || material.availableGrams === 0) return false;
  if (material.product && material.product.form !== material.form) return false;
  return true;
}

function certainExcludedIds(situation: HopAdviceSituation): Set<string> {
  return new Set(situation.exclusions.filter(row => row.certainty === 'certain').map(row => row.materialId));
}

function intentHasDimension(input: HopAdviceInput, dimensions: readonly HopAdviceDimension[], roles?: readonly HopIntentEvidenceCriterion['role'][]): boolean {
  return (input.intent.criteria ?? []).some(criterion => (!roles || roles.includes(criterion.role))
    && criterionDimensionLinks(input, criterion).some(link => dimensions.includes(link.dimension)));
}

function hasSourcedAromaDescription(material: HopDecisionMaterial): boolean {
  return (material.variety?.descriptions ?? []).some(description => !!description
    && typeof description.text === 'string' && !!description.text.trim()
    && ['rawHop', 'infusion', 'beer', 'unspecified'].includes(description.context)
    && !hopSourceError(description.source));
}

function hasMaterialMeasurements(material: HopDecisionMaterial): boolean {
  return (material.declaredAnalysis?.length ?? 0) > 0
    || (material.lot?.analysis.length ?? 0) > 0
    || (material.variety?.analysis.length ?? 0) > 0;
}

function needsMaterialObservation(material: HopDecisionMaterial): boolean {
  return !hasSourcedAromaDescription(material) || material.lot !== undefined && (material.lot.analysis.length === 0 || !material.lot.harvestYear);
}

function scopeUsesForCandidate(
  material: HopDecisionMaterial,
  situation: HopAdviceSituation,
  addition?: HopProgramAddition,
): HopUse[] {
  const stageUses = useByStage[situation.stage];
  if (!stageUses.length) return [];
  if (material.product) return unique(material.product.supportedUses.filter(use => stageUses.includes(use))) as HopUse[];
  if (addition && stageUses.includes(addition.use)) return [addition.use];
  return [];
}

function scopeForCandidate(
  input: HopAdviceInput,
  material: HopDecisionMaterial,
  addition?: HopProgramAddition,
): HopAdviceProgramScope {
  if (!canScopeMaterial(material) || certainExcludedIds(input.situation).has(material.id) || omittedMaterialIds(input).has(material.id)) {
    return { kind: 'none' };
  }
  const uses = scopeUsesForCandidate(material, input.situation, addition);
  if (!uses.length) return { kind: 'none' };
  if (addition && addition.status === 'planned' && useByStage[input.situation.stage].length) {
    return { kind: 'addOrReplace', materialIds: [material.id], uses, additionIds: [addition.id], allowAppend: false };
  }
  if (input.situation.program === null && input.situation.stage === 'planning') {
    return { kind: 'addOrReplace', materialIds: [material.id], uses, additionIds: [], allowAppend: true };
  }
  if (uses.length && input.situation.stage !== 'packaged') {
    return { kind: 'addOrReplace', materialIds: [material.id], uses, additionIds: [], allowAppend: true };
  }
  return { kind: 'none' };
}

function createEvidenceCollector(): EvidenceCollector {
  return { rows: new Map(), identityToId: new Map(), nextId: 1 };
}

function registerEvidence(
  collector: EvidenceCollector,
  row: Omit<HopAdviceEvidenceSource, 'id'>,
): string {
  const identity = hopAdviceCanonicalReference('hop-advice-source-identity-v1', {
    source: row.source, locator: row.locator, readingLevel: row.readingLevel,
    domain: row.domain, established: row.established,
  });
  const existingId = collector.identityToId.get(identity);
  if (existingId) return existingId;
  const id = `advice-evidence-${collector.nextId++}`;
  collector.identityToId.set(identity, id);
  collector.rows.set(id, { id, ...structuredClone(row) });
  return id;
}

function staticEvidence(collector: EvidenceCollector, id: string): string {
  const source = hopAdviceEvidence(id);
  if (!source) throw Error(`Référence documentaire de conseil inconnue : ${id}.`);
  collector.rows.set(id, source);
  return id;
}

function descriptorEvidenceIds(
  collector: EvidenceCollector,
  evidence: HopIntentEvidenceEvaluation['candidateEvidence'],
  partnerEvidence: HopIntentEvidenceEvaluation['partnerEvidence'],
): string[] {
  const ids: string[] = [];
  for (const descriptor of [...evidence, ...partnerEvidence]) {
    const context = descriptor.context;
    const side: EvidenceSide = descriptor.side;
    ids.push(registerEvidence(collector, {
      source: structuredClone(descriptor.source),
      locator: descriptor.source.locator ?? 'Aucun localisateur fourni avec cette description.',
      readingLevel: 'providedMaterialSource',
      domain: `description aromatique ${side} · ${context}`,
      established: `Texte descriptif fourni : « ${descriptor.quote} » (terme local « ${descriptor.term} », famille « ${descriptor.familyName} »).`,
      limits: ['Description documentaire dans son contexte déclaré; ne prédit pas l’arôme de la bière finie.'],
    }));
    ids.push(registerEvidence(collector, {
      source: structuredClone(descriptor.mappingSource),
      locator: descriptor.mappingSource.locator ?? 'Aucun localisateur fourni avec le mapping lexical.',
      readingLevel: 'curatedMapping',
      domain: 'mapping éditorial du lexique aromatique local',
      established: `Le lexique local relie le terme « ${descriptor.term} » à la famille « ${descriptor.familyName} ».`,
      limits: ['Rapprochement lexical éditorial; aucun poids, intensité, synergie ou résultat sensoriel n’est inféré.'],
    }));
  }
  return unique(ids);
}

function registerAssertionSources(input: HopAdviceInput, collector: EvidenceCollector): Map<string, string> {
  const ids = new Map<string, string>();
  for (const assertion of input.situation.assertions) {
    if (!assertion.source) continue;
    ids.set(assertion.id, registerEvidence(collector, {
      source: structuredClone(assertion.source),
      locator: assertion.source.locator ?? 'Assertion fournie sans localisateur de source.',
      readingLevel: 'providedMaterialSource',
      domain: `assertion de situation · ${assertion.dimension ?? 'dimension non précisée'}`,
      established: assertion.statement,
      limits: ['Assertion conservée telle que fournie; sa source et son état déclaré ne certifient pas la mesure.'],
    }));
  }
  return ids;
}

function criterionDimensionLinks(input: HopAdviceInput, criterion: HopIntentEvidenceCriterion): Array<{ dimension: HopAdviceDimension; familyId?: string }> {
  const explicit = input.situation.criterionDimensions.filter(link => link.criterionId === criterion.id);
  if (explicit.length) return explicit.map(link => ({ dimension: link.dimension, familyId: link.familyId ?? criterion.familyId }));
  if (criterion.familyId) return [{ dimension: 'aroma', familyId: criterion.familyId }];
  return [];
}

function mapDocumentaryStatus(evaluation: HopIntentEvidenceEvaluation): HopAdviceCriterionEffect['status'] {
  const { criterion, status } = evaluation;
  if (criterion.role === 'constraint') return 'constraintUnverified';
  if (status === 'observationToPreserve') return 'documentedSupport';
  if (status === 'documentedSupport' || status === 'documentedTension') return status;
  if (status === 'documentedOverlap') return 'documentedSupport';
  if (status === 'documentedAgainst') {
    if (criterion.role === 'avoid') return 'documentedSupport';
    if (criterion.role === 'seek' || criterion.role === 'pairWith') return 'documentedTension';
  }
  return status === 'notApplicable' ? 'notApplicable' : 'unknown';
}

function roleAwareReason(evaluation: HopIntentEvidenceEvaluation): string {
  if (evaluation.criterion.role === 'pairWith' && evaluation.status === 'documentedOverlap') {
    return `${evaluation.consequence} Le chevauchement n’est pas une maximisation du partenaire, une synergie ni une intensité.`;
  }
  if (evaluation.criterion.role === 'avoid' && evaluation.status === 'documentedAgainst') {
    return `${evaluation.consequence} La mention absente du document ne démontre pas l’absence du caractère.`;
  }
  if (evaluation.criterion.role === 'seek' && evaluation.status === 'documentedAgainst') {
    return `${evaluation.consequence} La tension documentaire ne démontre pas une impossibilité dans la bière.`;
  }
  return evaluation.consequence;
}

function evaluateStructuralConstraint(
  input: HopAdviceInput,
  check: NonNullable<HopAdviceSituation['constraintChecks']>[number],
  scope: HopAdviceProgramScope,
): Pick<HopAdviceCriterionEffect, 'status' | 'reason'> {
  if (check.kind === 'preservePerformed') {
    const program = input.situation.program;
    if (!program) return { status: 'constraintUnverified', reason: 'Aucun programme n’est fourni pour vérifier les additions effectuées visées.' };
    const byId = new Map(program.additions.map(addition => [addition.id, addition]));
    const rows = check.additionIds.map(id => byId.get(id));
    if (rows.some(row => !row)) return { status: 'constraintUnverified', reason: 'Une addition visée par le contrôle explicite n’est pas présente dans le programme.' };
    if (rows.some(row => row!.status !== 'performed')) return { status: 'constraintUnverified', reason: 'Le contrôle vise une addition qui n’est pas marquée effectuée.' };
    if (scopeModifiesPerformed(program, scope)) return { status: 'constraintViolated', reason: 'La portée inclut une addition effectuée visée par le contrôle.' };
    return { status: 'constraintSatisfied', reason: 'Le contrôle explicite confirme que les identifiants d’additions effectuées sont absents de la portée de modification.' };
  }
  if (check.kind === 'excludeMaterials') {
    if (scope.kind === 'addOrReplace' && scope.materialIds.some(id => check.materialIds.includes(id))) {
      return { status: 'constraintViolated', reason: 'La portée de cette option inclut un ID matière explicitement exclu par le contrôle.' };
    }
    return { status: 'constraintSatisfied', reason: 'La portée de cette option n’ajoute aucun ID matière ciblé par le contrôle explicite.' };
  }
  if (scope.kind !== 'addOrReplace' || !scope.materialIds.includes(check.materialId)) {
    return { status: 'constraintUnverified', reason: 'La portée ne propose pas cet emploi matière; aucune conclusion de compatibilité n’est ajoutée.' };
  }
  if (!useByStage[input.situation.stage].includes(check.use)) {
    return { status: 'constraintViolated', reason: 'L’emploi explicite n’est plus ouvert à ce stade.' };
  }
  if (!scope.uses.includes(check.use)) {
    return { status: 'constraintUnverified', reason: 'L’emploi visé n’est pas sélectionné dans la portée de cette option.' };
  }
  const material = input.materials.find(row => row.id === check.materialId);
  if (material?.product && !material.product.supportedUses.includes(check.use)) {
    return { status: 'constraintViolated', reason: 'L’emploi explicite ne figure pas dans les usages documentés du produit.' };
  }
  return { status: 'constraintSatisfied', reason: 'L’emploi explicite est ouvert à ce stade et figure dans la portée; un aperçu devra encore vérifier les autres gardes.' };
}

function criterionEffectsForOption(
  input: HopAdviceInput,
  candidate: HopDecisionMaterial | null,
  programScope: HopAdviceProgramScope,
  collector: EvidenceCollector,
): { effects: HopAdviceCriterionEffect[]; dimensionsByCriterion: Map<string, HopAdviceDimension[]> } {
  const criteria = input.intent.criteria ?? [];
  const effects: HopAdviceCriterionEffect[] = [];
  const dimensionsByCriterion = new Map<string, HopAdviceDimension[]>();
  for (const criterion of criteria) {
    const links = criterionDimensionLinks(input, criterion);
    dimensionsByCriterion.set(criterion.id, unique(links.map(link => link.dimension)) as HopAdviceDimension[]);
    if (criterion.role === 'constraint') {
      const checks = input.situation.constraintChecks?.filter(check => check.criterionId === criterion.id) ?? [];
      if (!checks.length) {
        const alcoholSupplied = links.some(link => link.dimension === 'alcohol') && alcoholAssertionSummary(input).assertionsPresent;
        effects.push({ criterionId: criterion.id, status: 'constraintUnverified',
          reason: alcoholSupplied
            ? 'Des assertions structurées d’alcool sont fournies, mais leur rôle, leur portée et leur comparaison à une borne ne sont pas évalués par cette règle.'
            : 'Aucun prédicat structurel précis n’est lié à cette contrainte; son texte n’est pas interprété automatiquement.', evidenceIds: [] });
      } else for (const check of checks) {
        effects.push({ criterionId: criterion.id, ...evaluateStructuralConstraint(input, check, programScope), evidenceIds: [] });
      }
      continue;
    }
    if (!links.length) {
      effects.push({ criterionId: criterion.id, status: 'unknown',
        reason: 'Aucune dimension ou famille documentaire n’est explicitement liée à ce critère; son texte reste intact et aucun parsing n’est tenté.', evidenceIds: [] });
      continue;
    }
    for (const link of links) {
      if (link.dimension !== 'aroma') {
        effects.push({ criterionId: criterion.id, status: 'unknown',
          reason: `Aucune règle documentaire aromatique ne s’applique à la dimension « ${link.dimension} »; le texte du critère n’est pas réinterprété.`, evidenceIds: [] });
        continue;
      }
      if (!candidate) {
        effects.push({ criterionId: criterion.id, status: 'unknown',
          reason: 'Aucune matière candidate n’est liée à cette option; le critère reste sans conclusion pour une matière.', evidenceIds: [] });
        continue;
      }
      const mappedCriterion: HopIntentEvidenceCriterion = {
        ...criterion,
        ...(link.familyId ? { familyId: link.familyId } : {}),
      };
      const evaluation = evaluateHopIntentEvidence({ criterion: mappedCriterion, candidate, materials: input.materials });
      const evidenceIds = descriptorEvidenceIds(collector, evaluation.candidateEvidence, evaluation.partnerEvidence);
      effects.push({ criterionId: criterion.id, status: mapDocumentaryStatus(evaluation),
        reason: roleAwareReason(evaluation), evidenceIds });
    }
  }
  return { effects, dimensionsByCriterion };
}

function scopeModifiesPerformed(program: HopDecisionProgram | null, scope: HopAdviceProgramScope): boolean {
  if (!program || scope.kind === 'none') return false;
  if (scope.kind === 'removePlanned') {
    const targets = new Set(scope.additionIds);
    return program.additions.some(addition => targets.has(addition.id) && addition.status === 'performed');
  }
  const targets = new Set(scope.additionIds);
  return program.additions.some(addition => targets.has(addition.id) && addition.status === 'performed');
}

function evidenceIdsForDimensionEffects(
  input: HopAdviceInput,
  dimension: HopAdviceDimension,
  optionCriterionEffects: readonly HopAdviceCriterionEffect[],
  dimensionsByCriterion: Map<string, HopAdviceDimension[]>,
  assertionEvidence: Map<string, string>,
): { evidenceIds: string[]; assertionIds: string[]; criterionIds: string[] } {
  const criterionIds = [...dimensionsByCriterion.entries()].filter(([, dimensions]) => dimensions.includes(dimension)).map(([id]) => id);
  const assertionIds = input.situation.assertions.filter(assertion => assertion.dimension === dimension).map(assertion => assertion.id);
  return {
    evidenceIds: unique([
      ...optionCriterionEffects.filter(effect => criterionIds.includes(effect.criterionId)).flatMap(effect => effect.evidenceIds),
      ...assertionIds.map(id => assertionEvidence.get(id) ?? '').filter(Boolean),
    ]),
    assertionIds: unique(assertionIds),
    criterionIds: unique(criterionIds),
  };
}

function availableMaterialStockStatus(material: HopDecisionMaterial): 'unknown' | 'zero' | 'reported' {
  if (material.availableGrams === undefined || material.availableGrams === null) return 'unknown';
  if (material.availableGrams === 0) return 'zero';
  return 'reported';
}

function alcoholAssertionSummary(input: HopAdviceInput): {
  assertionsPresent: boolean; numericValuesPresent: boolean; measurementPresent: boolean; multipleNumericValues: boolean;
} {
  const rows = input.situation.assertions.filter(assertion => assertion.dimension === 'alcohol');
  const numeric = rows.filter(assertion => assertion.value !== null && typeof assertion.value === 'number'
    && Number.isFinite(assertion.value) && !!assertion.unit?.trim() && assertion.state !== 'unknown');
  return {
    assertionsPresent: rows.some(assertion => assertion.state !== 'unknown' || assertion.value !== null || !!assertion.unit?.trim()),
    numericValuesPresent: numeric.length > 0,
    measurementPresent: numeric.some(assertion => assertion.state === 'measured'),
    multipleNumericValues: numeric.length > 1,
  };
}

function hopCreepEffectText(
  input: HopAdviceInput,
  scope: HopAdviceProgramScope,
  route: AdviceRoute,
): { statement: string; reason: string } {
  const coldLines = input.situation.program?.additions.filter(addition => addition.use === 'postFermentation') ?? [];
  const performed = coldLines.filter(addition => addition.status === 'performed');
  const planned = coldLines.filter(addition => addition.status === 'planned');
  const removed = scope.kind === 'removePlanned' ? planned.filter(addition => scope.additionIds.includes(addition.id)) : [];
  const replaced = scope.kind === 'addOrReplace' ? planned.filter(addition => scope.additionIds.includes(addition.id)) : [];
  const remaining = planned.filter(addition => !removed.includes(addition) && !replaced.includes(addition));
  const futureUse = scope.kind === 'addOrReplace' && scope.uses.includes('postFermentation');
  const phrases: string[] = [];
  if (performed.length) phrases.push(`Contact postFermentation déjà effectué (${performed.map(row => row.id).join(', ')}); son effet passé éventuel n’est pas annulé ni attribué avec certitude.`);
  if (removed.length) phrases.push(`Cette voie retire seulement l’emploi prévu ${removed.map(row => row.id).join(', ')}; elle évite ce contact incrémental si le brouillon est ensuite appliqué.`);
  if (replaced.length) phrases.push(`L’emploi prévu ${replaced.map(row => row.id).join(', ')} serait remplacé par un nouveau scénario futur; le conseil ne réécrit pas cette ligne.`);
  if (remaining.length) phrases.push(route === 'keepPlanned'
    ? `Cette voie laisse l’emploi prévu ${remaining.map(row => row.id).join(', ')} en attente; il n’est pas exécuté ni retenu comme recommandation.`
    : `L’emploi prévu ${remaining.map(row => row.id).join(', ')} reste planifié sans modification par cette voie.`);
  if (futureUse) phrases.push('La portée décrit aussi un emploi postFermentation futur; il reste prospectif et conditionnel.');
  if (!phrases.length && route === 'directTransfer') phrases.push('La comparaison proposée est un essai futur; elle n’ajoute aucune opération au programme courant.');
  if (!phrases.length) phrases.push('Aucun emploi postFermentation n’est présent dans cette voie; aucune exposition froide n’est imputée.');
  return {
    statement: phrases.join(' '),
    reason: 'M-HC est un signal conditionnel : les études réutilisées portent surtout sur dry-hop et ne prouvent ni enzyme active, ni dextrines accessibles, ni levure viable, ni hausse globale d’alcool dans cette situation. L’emploi postFermentation n’établit pas à lui seul la forme, la température ou l’activité enzymatique.',
  };
}

function postFermentationScopeContrast(
  input: HopAdviceInput,
  scope: HopAdviceProgramScope,
  route: AdviceRoute,
): string {
  const rows = input.situation.program?.additions.filter(addition => addition.use === 'postFermentation') ?? [];
  const performed = rows.filter(addition => addition.status === 'performed');
  const planned = rows.filter(addition => addition.status === 'planned');
  const phrases: string[] = [];
  if (performed.length) phrases.push(`Les ajouts postFermentation effectués (${performed.map(row => row.id).join(', ')}) restent tels quels.`);
  if (scope.kind === 'removePlanned') {
    const removed = planned.filter(addition => scope.additionIds.includes(addition.id));
    if (removed.length) phrases.push(`Cette portée retire du brouillon seulement ${removed.map(row => row.id).join(', ')}.`);
  } else if (route === 'keepPlanned') {
    if (planned.length) phrases.push(`Les emplois prévus ${planned.map(row => row.id).join(', ')} restent en attente, pas exécutés.`);
  } else if (scope.kind === 'addOrReplace' && scope.uses.includes('postFermentation')) {
    const targets = planned.filter(addition => scope.additionIds.includes(addition.id));
    phrases.push(targets.length
      ? `La portée décrit le remplacement futur de ${targets.map(row => row.id).join(', ')}.`
      : 'La portée décrit un nouvel emploi postFermentation futur.');
  } else if (planned.length) {
    phrases.push(`Les emplois prévus ${planned.map(row => row.id).join(', ')} restent inchangés par cette voie.`);
  }
  if (!phrases.length) phrases.push('Aucun emploi postFermentation courant ou futur n’est établi par cette portée.');
  return phrases.join(' ');
}

function dimensionEffectsForOption(
  input: HopAdviceInput,
  candidate: HopDecisionMaterial | null,
  scope: HopAdviceProgramScope,
  route: AdviceRoute,
  extraDimensions: readonly HopAdviceDimension[],
  criterionEffects: readonly HopAdviceCriterionEffect[],
  dimensionsByCriterion: Map<string, HopAdviceDimension[]>,
  collector: EvidenceCollector,
  assertionEvidence: Map<string, string>,
): HopAdviceDimensionEffect[] {
  const hasPostFermentationUse = input.situation.program?.additions.some(addition => addition.use === 'postFermentation')
    || scope.kind === 'addOrReplace' && scope.uses.includes('postFermentation');
  const bioContext = hasStructuredBioContext(input);
  const dimensions = unique([
    ...input.situation.assertions.map(assertion => !assertion.dimension ? ''
      : assertion.dimension === 'bioInteraction' ? (bioContext ? assertion.dimension : '')
        : assertion.dimension === 'hopCreep' ? (hasPostFermentationUse ? assertion.dimension : '')
          : assertion.dimension),
    ...input.situation.criterionDimensions.map(link => link.dimension),
    ...[...(input.intent.criteria ?? [])].filter(criterion => criterion.familyId).map(() => 'aroma'),
    ...extraDimensions,
    ...(hasPostFermentationUse ? ['hopCreep'] : []),
  ]) as HopAdviceDimension[];
  return dimensions.map(dimension => {
    const refs = evidenceIdsForDimensionEffects(input, dimension, criterionEffects, dimensionsByCriterion, assertionEvidence);
    if (dimension === 'aroma') {
      const linked = criterionEffects.filter(effect => refs.criterionIds.includes(effect.criterionId));
      const support = linked.some(effect => effect.status === 'documentedSupport');
      const tension = linked.some(effect => effect.status === 'documentedTension');
      const status: HopAdviceDimensionEffect['status'] = support && tension ? 'conditional'
        : support ? 'documentarySupport' : tension ? 'documentaryTension' : 'unknown';
      return { dimension, status, statement: 'Les descripteurs rapprochés concernent les descriptions et leur contexte source, pas une bière finie.',
        reason: linked.length ? linked.map(effect => effect.reason).join(' ') : 'Aucun critère n’est rattaché explicitement au lexique aromatique.',
        evidenceIds: refs.evidenceIds, assertionIds: refs.assertionIds, criterionIds: refs.criterionIds };
    }
    if (dimension === 'acidity') {
      if (!hasPostFermentationUse) return { dimension, status: 'unknown',
        statement: 'Aucun emploi postFermentation n’est indiqué dans cette voie; les essais M-pH ne qualifient pas un autre emploi.',
        reason: 'Le pH, l’acidité titrable et la sensation acidulée restent des cibles distinctes; aucun effet de pH n’est transposé à une voie chaude ou non spécifiée.',
        evidenceIds: refs.evidenceIds, assertionIds: refs.assertionIds, criterionIds: refs.criterionIds };
      const maye = staticEvidence(collector, 'm-ph-maye-2018');
      const schmick = staticEvidence(collector, 'm-ph-schmick-2014');
      const scopeContrast = postFermentationScopeContrast(input, scope, route);
      return { dimension, status: 'conditional',
        statement: `${scopeContrast} Les essais M-pH concernent un dry-hop post-fermentation dans leurs propres bières. Ils n’établissent pas l’acidité titrable ni la perception acidulée de la situation fournie.`,
        reason: input.situation.stage === 'packaged'
          ? `${scopeContrast} La voie ne modifie pas le lot conditionné; les résultats M-pH servent seulement à borner une comparaison sur échantillon ou brassin futur.`
          : `${scopeContrast} La portée sèche/froide, la matrice, la cible et les mesures avant/après ne sont pas établies; aucun effet de pH n’est imputé à cette option.`,
        evidenceIds: unique([...refs.evidenceIds, maye, schmick]), assertionIds: refs.assertionIds, criterionIds: refs.criterionIds };
    }
    if (dimension === 'bioInteraction') {
      const ids = ['m-ab-sakamoto-2001', 'm-ab-dysvik-2020', 'm-ab-mahanta-2022'].map(id => staticEvidence(collector, id));
      return { dimension, status: 'conditional',
        statement: 'Les sources rapportent des interactions dépendantes de la souche, du composé et du milieu; l’effet pour la culture et le houblon fournis reste inconnu.',
        reason: 'Aucune souche/produit, viabilité au contact ou exposition équivalente aux iso-α-acides n’est établie par les seuls libellés de situation.',
        evidenceIds: unique([...refs.evidenceIds, ...ids]), assertionIds: refs.assertionIds, criterionIds: refs.criterionIds };
    }
    if (dimension === 'hopCreep') {
      const ids = ['m-hc-kirkpatrick-2018', 'm-hc-willemart-2025'].map(id => staticEvidence(collector, id));
      const effects = hopCreepEffectText(input, scope, route);
      return { dimension, status: 'conditional',
        statement: `${effects.statement} Le potentiel enzymatique et la refermentation sont distincts; la seconde suppose une levure viable qui utilise les sucres libérés.`,
        reason: effects.reason,
        evidenceIds: unique([...refs.evidenceIds, ...ids]), assertionIds: refs.assertionIds, criterionIds: refs.criterionIds };
    }
    if (dimension === 'alcohol') {
      const supplied = alcoholAssertionSummary(input);
      const scopeContrast = postFermentationScopeContrast(input, scope, route);
      const statement = supplied.assertionsPresent
        ? `Des assertions structurées d’alcool sont fournies; leur rôle, unité, portée et comparaison à une borne ne sont pas évalués par cette règle. ${scopeContrast}`
        : `Aucune assertion structurée d’alcool n’est fournie pour cette règle; une conclusion sur l’alcool final reste indisponible. ${scopeContrast}`;
      return { dimension, status: 'unknown',
        statement,
        reason: `Aucun contrat sémantique ne relie ici une mesure, une borne et la portée visée; conformité et alcool final ne sont pas évalués. ${scopeContrast}`,
        evidenceIds: refs.evidenceIds, assertionIds: refs.assertionIds, criterionIds: refs.criterionIds };
    }
    if (dimension === 'stock') {
      const stock = candidate ? availableMaterialStockStatus(candidate) : 'unknown';
      return { dimension, status: stock === 'reported' ? 'conditional' : 'unknown',
        statement: stock === 'reported' ? 'Une quantité de stock est fournie dans cette entrée; aucun stock n’est réservé par le conseil.'
          : stock === 'zero' ? 'Le stock local fourni est explicitement nul; une acquisition éventuelle n’est pas présumée.'
            : 'Le stock physique est inconnu; aucune quantité n’est imputée ni réservée.',
        reason: 'Le stock, les besoins cumulés et la faisabilité seront revérifiés lors d’un aperçu explicite du programme.',
        evidenceIds: refs.evidenceIds, assertionIds: refs.assertionIds, criterionIds: refs.criterionIds };
    }
    if (dimension === 'process') {
      const performed = input.situation.program?.additions.filter(addition => addition.status === 'performed').map(addition => addition.id) ?? [];
      return { dimension, status: 'structuralChange',
        statement: performed.length ? `Les ajouts effectués restent intacts : ${performed.join(', ')}.` : 'Aucune addition effectuée n’est modifiée par cette portée.',
        reason: scopeModifiesPerformed(input.situation.program, scope)
          ? 'La portée serait invalide car elle inclut une opération effectuée.'
          : 'Cette option décrit une portée possible seulement; elle n’exécute ni ne persiste une modification.',
        evidenceIds: refs.evidenceIds, assertionIds: refs.assertionIds, criterionIds: refs.criterionIds };
    }
    if (dimension === 'matrixTransfer') {
      const transfer = staticEvidence(collector, 'm-transfer-brendel-2020');
      return { dimension, status: 'conditional',
        statement: 'Brendel 2020 motive une comparaison future de transfert/rétention de certains volatils dans sa matrice sans alcool; il ne prédit ni le lot ni la bière fournis.',
        reason: 'Le résultat porte sur un produit et une matrice de banc; il ne démontre ni libération de thiols par levure, ni équivalence à la bière acidifiée, ni délai universel.',
        evidenceIds: unique([...refs.evidenceIds, transfer]), assertionIds: refs.assertionIds, criterionIds: refs.criterionIds };
    }
    if (dimension === 'documentation') {
      return { dimension, status: refs.evidenceIds.length ? 'documentarySupport' : 'unknown',
        statement: refs.evidenceIds.length ? 'Les sources et contextes sont conservés avec leur portée.' : 'Aucune source n’est liée à cette dimension.',
        reason: 'La présence d’une citation n’élargit pas son domaine ni ne transforme un document en mesure du lot.',
        evidenceIds: refs.evidenceIds, assertionIds: refs.assertionIds, criterionIds: refs.criterionIds };
    }
    return { dimension, status: 'unknown', statement: 'Aucune règle n’est rattachée à cette dimension.',
      reason: 'Le moteur conserve le critère sans inférer un effet depuis le texte libre.',
      evidenceIds: refs.evidenceIds, assertionIds: refs.assertionIds, criterionIds: refs.criterionIds };
  });
}

function requestsForOption(
  input: HopAdviceInput,
  optionDraftId: string,
  route: AdviceRoute,
  candidate: HopDecisionMaterial | null,
  dimensionsByCriterion: Map<string, HopAdviceDimension[]>,
  effects: readonly HopAdviceCriterionEffect[],
  requests: Map<string, MutableRequest>,
): string[] {
  const criteria = input.intent.criteria ?? [];
  const resultIds: string[] = [];
  const add = (id: string, question: string, whyDecisionChanging: string) => {
    const current = requests.get(id) ?? { id, question, whyDecisionChanging, optionIds: new Set<string>() };
    current.optionIds.add(optionDraftId); requests.set(id, current); resultIds.push(id);
  };
  for (const effect of effects) {
    if (!['unknown', 'constraintUnverified'].includes(effect.status)) continue;
    const criterion = criteria.find(row => row.id === effect.criterionId);
    const dimensions = dimensionsByCriterion.get(effect.criterionId) ?? [];
    const dimension = dimensions[0];
    if (!criterion) continue;
    if (route === 'globalBalance' && dimension === 'alcohol') {
      const alcohol = alcoholAssertionSummary(input);
      if (!alcohol.numericValuesPresent) add(`decision-${criterion.id}-alcohol`,
        alcohol.assertionsPresent
          ? 'Pour une évaluation formelle, quel rôle attribuer aux assertions d’alcool déjà fournies, avec quelles unités et quelle portée ?'
          : 'Si la contrainte est dure, quelle limite d’alcool chiffrée et quelle mesure de la bière l’évalueraient ?',
        'Le conseil ne compare pas la mesure à une limite et ne conclut pas sur la conformité; cette voie ne bloque pas les autres options.');
    }
    else if (route === 'globalBalance' && dimension === 'acidity') add(`decision-${criterion.id}-acidity`,
      'La contrainte porte-t-elle sur le pH mesuré, l’acidité titrable ou la sensation acidulée ?',
      'Ces dimensions ne sont pas interchangeables; la cible choisie décide quelles mesures sont utiles.');
    else if (route === 'bioInvestigation' && (dimension === 'bioInteraction' || dimension === 'hopCreep')) add(`decision-${criterion.id}-bio`,
      'Si la voie biologique change réellement le choix, quelles cultures/souches, viabilité au contact et expositions analytiques sont établies ?',
      'Les sources sont conditionnelles à la souche, au composé et au milieu; ces éléments ne sont pas établis dans la situation fournie.');
    else if (route === 'globalBalance' && dimension === 'stock') add(`decision-${criterion.id}-stock`,
      'Quelle quantité physique est disponible pour un aperçu local ?',
      'Le conseil ne réserve ni ne consomme de stock; une proposition concrète doit vérifier la quantité cumulée.');
    else if (route === 'documentaryReference' && dimension === 'aroma') add(`decision-${criterion.id}-aroma`,
      'Une description sourcée dans le contexte d’emploi visé ou une correction explicite de la famille documentaire départagerait-elle ces matières ?',
      'Une absence de mention n’établit pas l’absence du caractère et une description de houblon ne prédit pas la bière.');
  }
  if (route === 'directTransfer') add('decision-matrix-transfer',
    'Si cette comparaison change le choix, quelle matrice/échantillon et quels composés mesurés seraient pertinents ?',
    'Brendel motive une comparaison de transfert en sa matrice sans alcool seulement; elle ne dicte ni analyte ni protocole pour cette bière.');
  if (route === 'observeCurrent') add('decision-current-observation',
    'Quelle observation du lot actuel l’utilisateur choisit-il de consigner pour préciser sa cible perçue ?',
    'L’observation est une donnée future de l’utilisateur, pas une mesure déjà faite ni une attribution causale.');
  if (route === 'lotObservation') add(`decision-${candidate?.id ?? optionDraftId}-material-context`,
    'Si cela départage le choix, quelle identité de lot, forme, source et contexte de description peuvent être consignés ?',
    'Ces informations améliorent la traçabilité du matériau; elles ne remplacent ni une analyse ni une dégustation de bière.');
  if (route === 'documentaryReference' && (!candidate || !hasSourcedAromaDescription(candidate))) add(`decision-${candidate?.id ?? optionDraftId}-reference-source`,
    'Quelle description sourcée de ce matériau et dans quel contexte d’emploi pourraient servir à la comparaison, si elle est utile ?',
    'Aucun profil n’est inventé; une description manquante n’établit pas l’absence du caractère recherché.');
  return unique(resultIds);
}

function relevance(effects: readonly HopAdviceCriterionEffect[]): HopAdviceOption['relevance'] {
  if (!effects.length) return 'unknown';
  const support = effects.some(effect => effect.status === 'documentedSupport' || effect.status === 'constraintSatisfied');
  const tension = effects.some(effect => effect.status === 'documentedTension' || effect.status === 'constraintViolated');
  if (support && tension) return 'mixed';
  if (tension) return 'notAligned';
  if (support) return 'supportsCriteria';
  if (effects.some(effect => effect.status === 'unknown' || effect.status === 'constraintUnverified')) return 'conditional';
  return 'unknown';
}

function optionConditions(input: HopAdviceInput, candidate: HopDecisionMaterial | null, scope: HopAdviceProgramScope): string[] {
  const conditions: string[] = [];
  if (input.qualification?.conditional.some(row => row.materialId === candidate?.id)) {
    const qualification = input.qualification.conditional.find(row => row.materialId === candidate?.id)!;
    conditions.push(`Projection conditionnelle de la matière ${candidate!.id}: ${qualification.reason}`);
  }
  if (scope.kind === 'addOrReplace') {
    conditions.push('Cette portée est un scénario de conseil, pas une commande ni un aperçu appliqué; l’emploi, la dose, le stock et les gardes doivent être revalidés explicitement.');
    if (!scope.uses.length) conditions.push('Aucun emploi n’est sélectionné; le moteur ne l’infère pas du nom ou de la description.');
    if (scope.additionIds.length === 0) conditions.push('Tout ajout serait futur et demanderait une identité d’ajout lors d’un aperçu distinct.');
    if (candidate && availableMaterialStockStatus(candidate) === 'unknown') conditions.push('Stock inconnu; aucune réservation ou disponibilité n’est présumée.');
    if (candidate && availableMaterialStockStatus(candidate) === 'zero') conditions.push('Stock déclaré nul; une acquisition n’est pas incluse dans cette option.');
  }
  if (candidate?.form === 'unknown') conditions.push('Forme de la matière inconnue; elle reste documentaire et n’est pas proposée comme ingrédient actif.');
  if (candidate && isReferenceOnly(candidate)) conditions.push('Échantillon reference-only; il sert de comparaison documentaire, pas de stock possédé.');
  if (candidate && isArchived(candidate)) conditions.push('Matière archivée; elle reste documentaire et n’est pas proposée comme ingrédient actif.');
  if (candidate && candidate.product && candidate.product.form !== candidate.form) conditions.push('La forme déclarée diffère de celle du produit; aucune portée active n’est proposée.');
  if (candidate?.product && !candidate.product.supportedUses.some(use => useByStage[input.situation.stage].includes(use))) {
    conditions.push('Aucun emploi documenté pour ce produit ne correspond aux stades encore ouverts; le conseil reste documentaire.');
  }
  if (candidate && scope.kind === 'none' && input.situation.stage !== 'packaged'
    && !scopeUsesForCandidate(candidate, input.situation).length && candidate.form !== 'unknown'
    && !isReferenceOnly(candidate) && !isArchived(candidate)) {
    conditions.push('Aucun emploi explicite du programme ni usage produit fourni ne justifie encore une portée add/replace.');
  }
  if (candidate && availableMaterialStockStatus(candidate) === 'zero') conditions.push('Stock local déclaré nul; une acquisition n’est ni présumée ni incluse dans cette option.');
  if (input.situation.stage === 'packaged') conditions.push('Le lot conditionné n’est pas modifié; une opération éventuelle concerne un échantillon ou un brassin futur.');
  if (input.situation.program === null) conditions.push('Aucun programme n’est fourni; aucune addition n’est fabriquée pour remplir ce conseil.');
  if (input.situation.program?.additions.some(addition => addition.status === 'performed')) conditions.push('Les lignes effectuées et leurs valeurs nulles sont préservées exactement.');
  return unique(conditions);
}

function routeConditions(input: HopAdviceInput, spec: AdviceOptionSpec): string[] {
  switch (spec.route) {
    case 'lotObservation':
      return ['But : rendre le lot comparable avant de choisir un usage. Geste : consigner l’identité, la forme, la récolte et le stockage connus, puis une description sourcée en précisant rawHop, infusion ou bière. Cela reste une observation, pas une analyse ni une prédiction de bière.',
        'Information qui départage : provenance et contexte de description, état frais/sec si connu, et mesures réellement disponibles; l’absence de mention ne vaut pas absence du caractère.'];
    case 'documentaryReference':
      return [spec.candidate && hasSourcedAromaDescription(spec.candidate)
        ? 'But : comparer les descriptions réellement documentées. Geste : rapprocher les termes, source, forme et contexte effectivement attachés à cette matière; ils qualifient le document, pas la bière finie.'
        : 'But : obtenir un comparateur vérifiable si cela peut départager les voies. Geste : fournir une description sourcée avec son contexte; aucun cultivar, produit ou fournisseur n’est choisi à sa place.'];
    case 'directTransfer':
      return ['But : séparer le transfert/rétention physique d’une explication par levure. Geste possible sur un échantillon ou un essai futur : choisir la matrice et les analytes, puis mesurer aux points retenus; aucune masse, durée ou température n’est proposée.',
        'Information qui départage : matière et analytes mesurés, matrice réelle, et points de comparaison choisis. Cette voie n’exige pas une hypothèse de biotransformation et ne prédit pas un caractère sensoriel final.'];
    case 'observeCurrent':
      return ['Geste possible : consigner une observation sensorielle de la bière actuelle selon le critère que le brasseur veut examiner; aucune observation n’est inventée et aucun ajout n’est attribué causalement.'];
    case 'globalBalance':
      return ['Voie de bilan séparée : préciser les dimensions et valeurs que le brasseur veut évaluer; elles ne bloquent ni l’observation ni les autres pistes documentaires.'];
    case 'bioInvestigation':
      return [hasExplicitBioCriterion(input)
        ? 'Cette piste répond à un critère biologique structuré et reste séparée des voies documentaires ou de transfert direct.'
        : 'Cette piste facultative contextualise les assertions biologiques déjà fournies; aucune validation supplémentaire n’est requise pour consulter les voies d’arôme direct ou documentaire.',
        'Information qui changerait son interprétation : culture/souche précise, viabilité au contact, mesure de substrat et exposition dans la matrice réelle. Ces éléments ne sont pas présumés et leur absence ne ferme pas les autres voies.'];
    case 'keepPlanned':
      return [`But : garder visible la décision encore ouverte. L’ajout prévu ${spec.additionId ?? ''} reste planifié et non exécuté; aucun aperçu ni application n’est déclenché.`,
        'Information qui départage : confirmer ensuite la matière, la masse et l’emploi voulus avant tout aperçu; cette option ne valide ni stock ni faisabilité.'];
    case 'removePlanned':
      return ['Le retrait vise uniquement la ligne prévue sélectionnée; il ne défait pas les opérations effectuées et ne conclut pas sur le bilan global.'];
    case 'programOperation':
      return spec.scope.kind === 'addOrReplace'
        ? ['But : examiner cette matière dans un emploi encore ouvert. Geste : choisir ensuite une masse et un scénario explicites dans un aperçu complet; cette proposition ne calcule ni dose ni résultat sensoriel.',
          'Information qui départage : identité et stock réels, convention de calcul demandée le cas échéant, puis revalidation du programme entier.']
        : ['Cette voie compare ou documente la matière sans la rendre active; aucun emploi n’est déduit des mots ou d’une préférence.'];
  }
}

function uncertainExclusionsForOption(input: HopAdviceInput, spec: AdviceOptionSpec): HopAdviceExclusion[] {
  const scopedIds = spec.scope.kind === 'addOrReplace' ? spec.scope.materialIds
    : spec.candidate ? [spec.candidate.id] : spec.relatedMaterialIds ?? [];
  return input.situation.exclusions.filter(exclusion => exclusion.certainty !== 'certain' && scopedIds.includes(exclusion.materialId));
}

function optionExclusions(input: HopAdviceInput): HopAdviceOption['exclusions'] {
  return input.situation.exclusions.map(exclusion => ({
    materialId: exclusion.materialId,
    status: exclusion.certainty === 'certain' ? 'excluded' as const : exclusion.certainty === 'possible' ? 'possible' as const : 'unknown' as const,
    reason: exclusion.reason,
  }));
}

function buildDraftOption(
  input: HopAdviceInput,
  draftId: string,
  spec: AdviceOptionSpec,
  collector: EvidenceCollector,
  assertionEvidence: Map<string, string>,
  requests: Map<string, MutableRequest>,
): DraftOption {
  const { candidate, title, scope, route } = spec;
  const { effects, dimensionsByCriterion } = criterionEffectsForOption(input, candidate, scope, collector);
  const informationRequestIds = requestsForOption(input, draftId, route, candidate, dimensionsByCriterion, effects, requests);
  const dimensionEffects = dimensionEffectsForOption(input, candidate, scope, route, spec.extraDimensions ?? [], effects, dimensionsByCriterion, collector, assertionEvidence);
  const conditions = [...optionConditions(input, candidate, scope), ...routeConditions(input, spec)];
  const unresolvedExclusions = uncertainExclusionsForOption(input, spec);
  if (scope.kind === 'addOrReplace') for (const exclusion of unresolvedExclusions) {
    conditions.push(`Exclusion ${exclusion.certainty} pour ${exclusion.materialId} : ${exclusion.reason}; la voie reste conditionnelle et l’identité n’est pas déclarée exclue.`);
  }
  const nonConclusions = [
    'Aucune intensité, synergie ou qualité sensorielle de la bière finie n’est prédite.',
    'Aucune dose, masse, volume, base analytique ou résultat de conformité n’est ajouté par le conseil.',
  ];
  if (dimensionEffects.some(effect => effect.dimension === 'bioInteraction')) nonConclusions.push('Aucun taux de biotransformation, effet d’inhibition, viabilité ou conversion biologique n’est prédit.');
  if (dimensionEffects.some(effect => effect.dimension === 'acidity')) nonConclusions.push('Une observation de pH n’est ni une mesure d’acidité titrable ni une preuve de perception acidulée.');
  const relatedMaterialIds = candidate ? [candidate.id]
    : spec.relatedMaterialIds ?? (scope.kind === 'removePlanned' && input.situation.program
      ? unique(input.situation.program.additions.filter(addition => scope.additionIds.includes(addition.id)).map(addition => addition.materialId))
      : []);
  const content: OptionContent = {
    title,
    materialIds: relatedMaterialIds,
    relevance: scope.kind === 'addOrReplace' && unresolvedExclusions.length ? 'conditional' : relevance(effects),
    programScope: scope,
    criterionEffects: effects,
    dimensionEffects,
    exclusions: optionExclusions(input),
    conditions,
    nonConclusions: unique(nonConclusions),
    informationRequestIds,
  };
  return { content, candidate, criterionDimensions: dimensionsByCriterion };
}

function hasExplicitAromaCriterion(input: HopAdviceInput): boolean {
  return (input.intent.criteria ?? []).some(criterion => criterionDimensionLinks(input, criterion)
    .some(link => link.dimension === 'aroma'));
}

function hasExplicitBioCriterion(input: HopAdviceInput): boolean {
  return (input.intent.criteria ?? []).some(criterion => criterionDimensionLinks(input, criterion)
    .some(link => link.dimension === 'bioInteraction' || link.dimension === 'hopCreep'));
}

function hasStructuredBioContext(input: HopAdviceInput): boolean {
  return input.situation.assertions.some(assertion => assertion.dimension === 'bioInteraction'
    && (assertion.state !== 'unknown' || assertion.value !== null));
}

function hasExplicitGlobalConstraint(input: HopAdviceInput): boolean {
  return (input.intent.criteria ?? []).some(criterion => criterion.role === 'constraint'
    && criterionDimensionLinks(input, criterion).some(link => ['alcohol', 'acidity', 'stock'].includes(link.dimension)));
}

function optionSpecs(input: HopAdviceInput, selectedMaterials: readonly HopDecisionMaterial[]): AdviceOptionSpec[] {
  const specs: AdviceOptionSpec[] = [];
  const program = input.situation.program;
  const certain = certainExcludedIds(input.situation);
  const planned = program?.additions.filter(addition => addition.status === 'planned') ?? [];
  if (program && input.situation.stage !== 'packaged') {
    for (const addition of planned) {
      specs.push({ candidate: null,
        title: `Retirer seulement l’ajout prévu ${addition.id} du brouillon`,
        scope: { kind: 'removePlanned', additionIds: [addition.id] }, route: 'removePlanned',
        additionId: addition.id, relatedMaterialIds: [addition.materialId] });
    }
  }
  if (program) {
    for (const addition of planned) {
      if (addition.use !== 'postFermentation') continue;
      const candidate = selectedMaterials.find(material => material.id === addition.materialId) ?? null;
      specs.push({ candidate,
        title: `Laisser l’ajout ${addition.id} prévu en attente`,
        scope: { kind: 'none' }, route: 'keepPlanned', additionId: addition.id,
        relatedMaterialIds: [addition.materialId] });
    }
  }
  for (const material of selectedMaterials) {
    if (omittedMaterialIds(input).has(material.id) || certain.has(material.id)) continue;
    const replaceTargets = planned.filter(addition => addition.materialId !== material.id
      && input.situation.stage !== 'packaged' && useByStage[input.situation.stage].length);
    if (replaceTargets.length) {
      for (const addition of replaceTargets) {
        const scope = scopeForCandidate(input, material, addition);
        specs.push({ candidate: material,
          title: scope.kind === 'none'
            ? `Comparer ${material.name} à l’ajout prévu ${addition.id} sans le rendre actif`
            : `Étudier ${material.name} comme remplacement conditionnel de ${addition.id}`,
          scope, route: 'programOperation', additionId: addition.id });
      }
    } else if (!planned.some(addition => addition.materialId === material.id)) {
      const scope = scopeForCandidate(input, material);
      const hasDedicatedObservation = scope.kind === 'none' && hasExplicitAromaCriterion(input) && needsMaterialObservation(material);
      if (!hasDedicatedObservation) specs.push({ candidate: material,
        title: scope.kind === 'none' ? `Documenter ${material.name} avant de choisir un emploi`
          : `Comparer ${material.name} comme voie future`, scope, route: 'programOperation' });
    }
  }

  if (hasExplicitAromaCriterion(input)) {
    for (const material of selectedMaterials) {
      if (omittedMaterialIds(input).has(material.id)) continue;
      if (needsMaterialObservation(material)) specs.push({
        candidate: material, title: `Documenter le lot ${material.name} avant de choisir`,
        scope: { kind: 'none' }, route: 'lotObservation',
      });
      specs.push({
        candidate: material,
        title: hasSourcedAromaDescription(material)
          ? `Comparer la description sourcée de ${material.name}`
          : `Rechercher une référence documentaire pour ${material.name}`,
        scope: { kind: 'none' }, route: 'documentaryReference',
      });
      specs.push({ candidate: material,
        title: `Comparer le transfert direct de ${material.name} sur échantillon ou essai futur`,
        scope: { kind: 'none' }, route: 'directTransfer', extraDimensions: ['matrixTransfer'] });
    }
    if (input.situation.stage === 'conditioning' || input.situation.stage === 'packaged') {
      const performedIds = program?.additions.filter(addition => addition.status === 'performed').map(addition => addition.materialId) ?? [];
      specs.push({ candidate: null,
        title: 'Observer le caractère de la bière actuelle sans lui attribuer une cause',
        scope: { kind: 'none' }, route: 'observeCurrent', relatedMaterialIds: unique(performedIds) });
    }
  }
  if (hasExplicitGlobalConstraint(input)) specs.push({ candidate: null,
    title: 'Séparer le bilan des contraintes de matière et d’emploi',
    scope: { kind: 'none' }, route: 'globalBalance',
    relatedMaterialIds: selectedMaterials.map(material => material.id) });
  if (hasExplicitBioCriterion(input) || hasStructuredBioContext(input)) specs.push({ candidate: null,
    title: hasExplicitBioCriterion(input)
      ? 'Examiner séparément la question biologique explicitement posée'
      : 'Contextualiser séparément les assertions biologiques fournies',
    scope: { kind: 'none' }, route: 'bioInvestigation', relatedMaterialIds: selectedMaterials.map(material => material.id),
    extraDimensions: unique((input.intent.criteria ?? []).flatMap(criterion => criterionDimensionLinks(input, criterion)
      .map(link => link.dimension).filter(dimension => dimension === 'bioInteraction' || dimension === 'hopCreep'))
      .concat(hasStructuredBioContext(input) ? ['bioInteraction'] : [])) as HopAdviceDimension[] });
  if (!specs.length) {
    specs.push({ candidate: null,
      title: input.situation.program ? 'Conserver le programme et les faits effectués; délimiter les données manquantes'
        : 'Garder le conseil documentaire ouvert jusqu’à une matière explicitement proposée',
      scope: { kind: 'none' }, route: 'programOperation' });
  }
  return specs;
}

function scenarioAssertionLimits(input: HopAdviceInput): string[] {
  const limits = [...(input.qualification?.limitations ?? [])];
  for (const omission of input.qualification?.omitted ?? []) {
    limits.push(`Matière ${omission.materialId} omise des projections utilisables (${omission.recordKeys.join(', ') || 'dossier non précisé'}): ${omission.reason}`);
  }
  for (const conditional of input.qualification?.conditional ?? []) {
    limits.push(`Matière ${conditional.materialId} transmise avec une vue conditionnelle (${conditional.recordKeys.join(', ') || 'dossier non précisé'}): ${conditional.reason}`);
  }
  if (!input.situation.program) limits.push('Le programme vaut null dans l’entrée; aucun programme vide ni état de recette n’est inventé.');
  if (input.situation.materialIds) limits.push('Exploration limitée aux IDs de matières explicitement sélectionnés dans la situation.');
  else limits.push('Exploration limitée aux matières explicitement transmises à cette action; aucun catalogue complet ou épuisement de recherche n’est revendiqué.');
  limits.push('Conseil qualitatif/documentaire seulement : aucune dose, volume, alpha, IBU, pH final, ABV, intensité ou conformité globale n’est calculé.');
  limits.push('Les sources décrivent leurs propres matrices/protocoles; aucun effet sensoriel universel ni réponse biologique certaine n’est transféré.');
  limits.push('L’ordre des options est une liste stable dans le périmètre fourni, pas un classement ni une recommandation universelle.');
  return unique(limits);
}

/**
 * Deterministic local strategy advice over an explicit request, situation and
 * projected material list. It creates no recipe/program mutation and performs
 * no NLP or scientific prediction.
 */
export function exploreHopStrategies(input: AdviceRunInput): HopStrategyAdviceResult {
  const safeInput: HopAdviceInput = {
    intent: input.intent,
    situation: input.situation,
    materials: input.materials,
    ...(input.qualification ? { qualification: input.qualification } : {}),
  };
  assertHopAdviceInput(safeInput);
  const inputReference = hopAdviceInputReference(safeInput);
  const evidenceCollector = createEvidenceCollector();
  const assertionEvidence = registerAssertionSources(safeInput, evidenceCollector);
  const materialById = materialMap(safeInput.materials);
  const requestedIds = selectedMaterialIds(safeInput);
  const omitted = omittedMaterialIds(safeInput);
  const selectedMaterials = requestedIds.map(id => materialById.get(id)).filter((material): material is HopDecisionMaterial => !!material && !omitted.has(material.id));
  const specs = optionSpecs(safeInput, selectedMaterials);
  const requests = new Map<string, MutableRequest>();
  const drafts: DraftOption[] = [];
  for (const [index, spec] of specs.entries()) {
    drafts.push(buildDraftOption(safeInput, `draft-${index + 1}`, spec,
      evidenceCollector, assertionEvidence, requests));
  }
  const options: HopAdviceOption[] = drafts.map((draft, index) => {
    const id = `hop-advice-option-${String(index + 1).padStart(3, '0')}`;
    return { id, reference: hopAdviceOptionReference(inputReference, draft.content), ...structuredClone(draft.content) };
  });
  for (const request of requests.values()) {
    const optionIds = new Set([...request.optionIds].map(draftId => {
      const index = Number(draftId.slice('draft-'.length)) - 1;
      return options[index]?.id ?? '';
    }).filter(Boolean));
    request.optionIds = optionIds;
  }
  const informationRequests = [...requests.values()].map(request => ({
    id: request.id, question: request.question, whyDecisionChanging: request.whyDecisionChanging,
    optionIds: [...request.optionIds],
  }));
  const usedEvidenceIds = new Set<string>();
  for (const option of options) {
    for (const effect of [...option.criterionEffects, ...option.dimensionEffects]) effect.evidenceIds.forEach(id => usedEvidenceIds.add(id));
  }
  const evidenceSources = [...usedEvidenceIds].map(id => evidenceCollector.rows.get(id)).filter((row): row is HopAdviceEvidenceSource => !!row);
  const scopedIds = selectedMaterialIds(safeInput);
  const omittedMaterials = structuredClone(safeInput.qualification?.omitted ?? []);
  const conditionalMaterials = structuredClone(safeInput.qualification?.conditional ?? []);
  const unresolvedExclusions = safeInput.situation.exclusions.filter(row => row.certainty !== 'certain');
  const qualifiedContextIds = new Set([
    ...omittedMaterials.map(row => row.materialId), ...conditionalMaterials.map(row => row.materialId),
    ...safeInput.situation.exclusions.map(row => row.materialId),
  ]);
  const contextOnlyMaterialIds = scopedIds.filter(id => !materialById.has(id) && !qualifiedContextIds.has(id));
  const limits = scenarioAssertionLimits(safeInput);
  for (const exclusion of unresolvedExclusions) {
    limits.push(`Exclusion ${exclusion.certainty} de ${exclusion.materialId} non résolue: les options concernées restent conditionnelles; cette identité n’est pas comptée comme certainement exclue.`);
  }
  for (const id of contextOnlyMaterialIds) limits.push(`ID matière ${id} présent dans le contexte explicite, sans projection matière transmise; aucune portée active n’est créée.`);
  const coverageStatus: HopStrategyAdviceResult['coverage']['status'] =
    omittedMaterials.length > 0 || conditionalMaterials.length > 0 || contextOnlyMaterialIds.length > 0 || unresolvedExclusions.length > 0
      ? 'partial'
      : safeInput.situation.materialIds && scopedIds.length < safeInput.materials.length ? 'bounded'
        : selectedMaterials.length ? 'completeWithinSuppliedScope' : 'partial';
  const resultWithoutReference: Omit<HopStrategyAdviceResult, 'reference'> = {
    version: HOP_ADVICE_VERSION,
    inputReference,
    stage: safeInput.situation.stage,
    status: options.length ? 'conditional' : 'noApplicableOption',
    options,
    informationRequests,
    evidenceSources,
    coverage: {
      status: coverageStatus,
      consideredMaterialIds: selectedMaterials.map(material => material.id),
      excludedMaterialIds: safeInput.situation.exclusions.filter(exclusion => exclusion.certainty === 'certain').map(exclusion => exclusion.materialId),
      contextOnlyMaterialIds,
      omittedMaterials,
      conditionalMaterials,
      limits,
    },
    limitations: limits,
  };
  const result: HopStrategyAdviceResult = { ...resultWithoutReference, reference: hopAdviceResultReference(resultWithoutReference) };
  assertHopStrategyAdviceResult(result);
  return result;
}
