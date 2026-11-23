import { answerHopDecision, type HopClassicDecisionAction as HopDecisionAction, type HopDecisionIntent, type HopDecisionResponse } from './service';
import { qualifyHopCatalogueVariants, type HopCatalogueQualificationInput } from './catalogueQualification';
import { hopDecisionReference } from './measurements';
import type { HopCommercialProduct, HopDecisionMaterial } from './types';
import type {
  HopDecisionContext, HopDecisionEvaluatedRecord, HopDecisionPublicInput, HopDecisionQualifiedRequest,
  HopDecisionQualificationInput, HopDecisionResolutionIssue, HopDecisionSkippedCandidate,
  HopDecisionStudySnapshotV2,
} from './dossier';

export type HopQualifiedAssemblyInput = HopCatalogueQualificationInput & {
  /** Kept intact; only notices from this exact version may be interpreted. */
  assembly?: HopDecisionQualificationInput['assembly'];
};

export interface AnswerQualifiedHopDecisionInput<A extends HopDecisionAction = HopDecisionAction> {
  intent: HopDecisionIntent;
  action: A;
  qualificationInput: HopQualifiedAssemblyInput;
  products?: HopCommercialProduct[];
  context?: HopDecisionContext | null;
}

interface MaterialNeed {
  materialId: string;
  role: 'indispensable' | 'candidate';
  reason: string;
}

interface ActionScope {
  required: MaterialNeed[];
  candidates: MaterialNeed[];
  candidateField?: 'candidateIds' | 'candidateMaterialIds';
}

interface ResolvedMaterial {
  material: HopDecisionMaterial;
  records: HopDecisionEvaluatedRecord[];
  partial: boolean;
}

const unique = <T>(rows: T[]): T[] => [...new Set(rows)];
const nonempty = (value: unknown): value is string => typeof value === 'string' && !!value.trim();

function programMaterialIds(program: { additions: Array<{ materialId: string }> }): string[] {
  return unique(program.additions.map(addition => addition.materialId));
}

function addNeed(map: Map<string, MaterialNeed>, materialId: string, role: MaterialNeed['role'], reason: string): void {
  if (!nonempty(materialId)) throw new Error('Une identité matière requise est vide.');
  const prior = map.get(materialId);
  if (!prior || prior.role === 'candidate' && role === 'indispensable') map.set(materialId, { materialId, role, reason });
}

function allVariantIds(input: HopQualifiedAssemblyInput): string[] {
  return unique(input.variants.map(variant => variant.material.id));
}

function stockReference(material: HopDecisionMaterial): string | undefined {
  return material.stockItemRef ?? material.lot?.stockItemRef;
}

function usesProgramFeasibility(action: HopDecisionAction): boolean {
  return ['assessProgram', 'substitute', 'changeUse', 'blend', 'replaceRemaining', 'planReplacement'].includes(action.kind);
}

function futureProgramMaterialIds(action: HopDecisionAction): string[] {
  if (!('program' in action) || !action.program || !Array.isArray(action.program.additions)) return [];
  const useOrder = { firstWort: 0, boil: 1, whirlpool: 2, fermentation: 3, postFermentation: 4 } as const;
  const stageFloor = { planning: 0, hotSide: 1, fermenting: 3, conditioning: 4, packaged: 5 } as const;
  const omittedAdditionIds = new Set<string>();
  if (action.kind === 'planReplacement') {
    action.program.additions.filter(row => row.materialId === action.unavailable.materialId).forEach(row => omittedAdditionIds.add(row.id));
  } else if (action.kind === 'substitute') {
    const retainedFraction = action.fraction ?? 1;
    if (retainedFraction >= 1) omittedAdditionIds.add(action.additionId);
  } else if (action.kind === 'blend') {
    omittedAdditionIds.add(action.additionId);
  } else if (action.kind === 'replaceRemaining') {
    action.program.additions.filter(row => row.materialId === action.sourceMaterialId && row.status === 'planned')
      .forEach(row => omittedAdditionIds.add(row.id));
  }
  const futureIds = action.program.additions.filter(row => row.status === 'planned' && !omittedAdditionIds.has(row.id)
    && useOrder[row.use] >= stageFloor[action.program.stage]).map(row => row.materialId);
  if (action.kind === 'changeUse') {
    const moved = action.program.additions.find(row => row.id === action.additionId);
    // J1 can reschedule a still-planned addition from a past employment to a
    // future one. Its moved portion follows the new employment, not the old row.
    if (moved?.status === 'planned' && Number.isFinite(action.grams) && action.grams > 0
      && useOrder[action.use] >= stageFloor[action.program.stage]) futureIds.push(moved.materialId);
  }
  return unique(futureIds);
}

function actionScope(action: HopDecisionAction, qualificationInput: HopQualifiedAssemblyInput): ActionScope {
  const required = new Map<string, MaterialNeed>();
  const candidates = new Map<string, MaterialNeed>();
  let candidateField: ActionScope['candidateField'];
  const must = (id: string, reason: string) => addNeed(required, id, 'indispensable', reason);
  const maybe = (id: string, reason: string) => addNeed(candidates, id, 'candidate', reason);
  const allProgram = (program: { additions: Array<{ materialId: string }> }, reason: string) => programMaterialIds(program).forEach(id => must(id, reason));

  switch (action.kind) {
    case 'compareMaterials':
      must(action.leftId, 'Matière gauche de comparaison explicitement demandée.');
      must(action.rightId, 'Matière droite de comparaison explicitement demandée.');
      break;
    case 'substitute': {
      allProgram(action.program, 'Programme de référence utilisé par la substitution et son aperçu complet.');
      const source = action.program.additions.find(addition => addition.id === action.additionId);
      if (source) must(source.materialId, 'Matière source de l’ajout à substituer.');
      const ids = action.candidateIds ?? allVariantIds(qualificationInput);
      candidateField = 'candidateIds';
      ids.filter(id => id !== source?.materialId).forEach(id => maybe(id, 'Candidat de substitution explicitement sélectionné ou inclus dans le catalogue exploré.'));
      break;
    }
    case 'comparePrograms':
      allProgram(action.before, 'Matières du programme de départ comparé.');
      allProgram(action.after, 'Matières du programme cible comparé.');
      break;
    case 'assessProgram':
      allProgram(action.program, 'Matières du programme analysé et de son bilan de faisabilité.');
      break;
    case 'changeUse':
      allProgram(action.program, 'Programme entier requis pour comparer l’emploi modifié et ses charges.');
      break;
    case 'blend':
      allProgram(action.program, 'Programme entier requis pour vérifier le mélange sur l’ensemble des ajouts.');
      action.allocations.forEach(allocation => must(allocation.materialId, 'Matière d’une allocation explicite du mélange.'));
      break;
    case 'replaceRemaining':
      allProgram(action.program, 'Programme entier requis pour conserver les opérations et vérifier tous les ajouts restants.');
      must(action.sourceMaterialId, 'Matière source dont les ajouts prévus sont remplacés.');
      must(action.candidateId, 'Matière de remplacement explicitement choisie.');
      break;
    case 'planReplacement': {
      allProgram(action.program, 'Programme source requis pour préserver ses ajouts effectués et analyser ses emplois futurs.');
      must(action.unavailable.materialId, 'Matière signalée indisponible dans la demande originale.');
      const ids = action.candidateMaterialIds ?? allVariantIds(qualificationInput);
      candidateField = 'candidateMaterialIds';
      ids.forEach(id => maybe(id, 'Candidat de remplacement explicitement sélectionné ou inclus dans le catalogue exploré.'));
      break;
    }
    case 'understandProducts':
    case 'biotransformation':
      break;
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
  return { required: [...required.values()], candidates: [...candidates.values()], candidateField };
}

function groupIndex(result: ReturnType<typeof qualifyHopCatalogueVariants>) {
  const byMaterialId = new Map<string, typeof result.groups>();
  for (const group of result.groups) for (const variant of group.rawVariants) {
    const rows = byMaterialId.get(variant.material.id) ?? [];
    if (!rows.some(row => row.key === group.key)) rows.push(group);
    byMaterialId.set(variant.material.id, rows);
  }
  return byMaterialId;
}

function reasonsForGroup(group: ReturnType<typeof qualifyHopCatalogueVariants>['groups'][number]): string[] {
  switch (group.status) {
    case 'ready': return group.blockers;
    case 'equivalentVariants': return [...group.blockers, ...group.commonCalculationReasons];
    case 'collisionNeedsSelection': return [...group.blockers, ...group.commonCalculationReasons];
    case 'selectionInvalid': return group.blockers;
    case 'archivedTombstone': return group.blockers;
  }
}

function resolveMaterial(
  materialId: string,
  role: MaterialNeed['role'],
  index: Map<string, ReturnType<typeof qualifyHopCatalogueVariants>['groups']>,
): ResolvedMaterial | { missing: HopDecisionSkippedCandidate; issue?: HopDecisionResolutionIssue } {
  const groups = index.get(materialId) ?? [];
  const recordKeys = groups.map(group => group.key).sort();
  if (!groups.length) {
    const reason = 'Aucune variante brute ne fournit cette identité demandée; aucune autre référence n’est substituée implicitement.';
    const missing: HopDecisionSkippedCandidate = { materialId, recordKeys: [], disposition: 'missing', reasons: [reason] };
    return { missing, ...(role === 'indispensable' ? { issue: { code: 'requiredMaterialMissing', role, materialId, reason, recordKeys: [] } } : {}) };
  }
  if (groups.length !== 1) {
    const reason = 'Cette identité matière apparaît dans plusieurs enregistrements de catalogue; leurs scopes ne sont pas fusionnés implicitement.';
    const missing: HopDecisionSkippedCandidate = { materialId, recordKeys, disposition: 'ambiguous', reasons: [reason] };
    return { missing, ...(role === 'indispensable' ? { issue: { code: 'requiredMaterialAmbiguous', role, materialId, reason, recordKeys } } : {}) };
  }
  const group = groups[0];
  let projection: 'calculation' | 'commonCalculation' | 'unavailable' = 'unavailable';
  let material: HopDecisionMaterial | null = null;
  if (group.status === 'ready' || group.status === 'equivalentVariants') {
    projection = 'calculation';
    material = group.calculationProjection?.material ?? null;
  } else if (group.status === 'collisionNeedsSelection') {
    projection = 'commonCalculation';
    material = group.commonCalculationProjection?.material ?? null;
  }
  const reasons = reasonsForGroup(group);
  if (material && material.id === materialId) {
    const partial = projection === 'commonCalculation';
    const row: HopDecisionEvaluatedRecord = { recordKey: group.key, status: group.status, role,
      roles: [role],
      materialIds: groups[0].rawVariants.map(variant => variant.material.id).filter((id, i, all) => all.indexOf(id) === i), projection, reasons };
    return { material: structuredClone(material), records: [row], partial };
  }
  const disposition: HopDecisionSkippedCandidate['disposition'] = group.status === 'selectionInvalid' ? 'selectionInvalid'
    : group.status === 'archivedTombstone' ? 'archivedTombstone'
      : group.status === 'collisionNeedsSelection' ? 'collisionNeedsSelection' : 'noSafeProjection';
  const reason = reasons[0] ?? 'Aucune projection calculatoire sûre n’est disponible.';
  const missing: HopDecisionSkippedCandidate = { materialId, recordKeys, disposition, reasons: reasons.length ? reasons : [reason] };
  return { missing, ...(role === 'indispensable' ? { issue: { code: 'requiredMaterialUnresolved', role, materialId, reason, recordKeys } } : {}) };
}

function mergeEvaluatedRecordRole(
  evaluated: Map<string, HopDecisionEvaluatedRecord>,
  row: HopDecisionEvaluatedRecord,
): void {
  const previous = evaluated.get(row.recordKey);
  if (!previous) {
    evaluated.set(row.recordKey, { ...row, roles: unique([...(row.roles ?? [row.role])]) });
    return;
  }
  const roles = unique([...(previous.roles ?? [previous.role]), ...(row.roles ?? [row.role])]);
  const preferredRole = previous.role === 'support' && row.role !== 'support' ? row.role : previous.role;
  evaluated.set(row.recordKey, { ...previous, role: preferredRole, roles,
    reasons: unique([...previous.reasons, ...row.reasons]) });
}

function assemblyNotices(input: HopQualifiedAssemblyInput, relevantIds: Set<string>): Array<{ materialId: string; relatedRecordKey: string; reason: string }> {
  const assembly = input.assembly;
  if (!assembly || assembly.version !== 'hop-catalogue-assembly-v1') return [];
  const notices = (assembly as { notices?: unknown }).notices;
  if (!Array.isArray(notices)) throw new Error('Le bloc assembly v1 doit contenir notices[].');
  return notices.filter((notice): notice is { materialId: string; relatedRecordKey: string; reason: string } =>
    !!notice && typeof notice === 'object' && relevantIds.has((notice as any).materialId)
      && nonempty((notice as any).relatedRecordKey) && nonempty((notice as any).reason))
    .map(notice => structuredClone(notice));
}

/**
 * Qualify the complete supplied snapshot, then call J1 exactly once with only safe projections.
 * Resolution archives preserve the original request and qualification result, but contain no
 * fabricated J1 input or response. Historical readers do not import this module.
 */
export function answerQualifiedHopDecision<A extends HopDecisionAction>(input: AnswerQualifiedHopDecisionInput<A>): HopDecisionStudySnapshotV2<A['kind']> {
  if ((input.action?.kind as string) === 'exploreStrategies') throw Error('Le conseil utilise le raccord et le dossier de format 3, sans détendre les fabriques v1/v2.');
  if (!input.intent || !nonempty(input.intent.originalQuestion) || !input.action || !Array.isArray(input.qualificationInput?.variants)) {
    throw new Error('Demande qualifiée incomplète : conserver la question, l’action et le snapshot de variantes.');
  }
  if (input.qualificationInput.assembly !== undefined && !nonempty(input.qualificationInput.assembly.version)) {
    throw new Error('Le bloc assembly doit porter une version explicite.');
  }

  // Passing only the declared qualification fields keeps versioned assembly data opaque.
  const qualificationInputForCurrentModule: HopCatalogueQualificationInput = {
    variants: input.qualificationInput.variants,
    ...(input.qualificationInput.basisEvidence ? { basisEvidence: input.qualificationInput.basisEvidence } : {}),
    ...(input.qualificationInput.selectedVariantByRecord ? { selectedVariantByRecord: input.qualificationInput.selectedVariantByRecord } : {}),
  };
  const qualification = qualifyHopCatalogueVariants(qualificationInputForCurrentModule);
  const request: HopDecisionQualifiedRequest<A> = structuredClone({ intent: input.intent, action: input.action,
    qualificationInput: input.qualificationInput, ...(input.products ? { products: input.products } : {}) });
  const context = structuredClone(input.context ?? null);
  const scope = actionScope(input.action, input.qualificationInput);
  const byMaterialId = groupIndex(qualification);
  const requiredResolved = new Map<string, HopDecisionMaterial>();
  const candidateResolved = new Map<string, HopDecisionMaterial>();
  const evaluatedRecords = new Map<string, HopDecisionEvaluatedRecord>();
  const skippedById = new Map<string, HopDecisionSkippedCandidate>();
  const blockingIssues: HopDecisionResolutionIssue[] = [];

  for (const need of scope.required) {
    const resolved = resolveMaterial(need.materialId, 'indispensable', byMaterialId);
    if ('missing' in resolved) {
      skippedById.set(need.materialId, resolved.missing);
      if (resolved.issue) blockingIssues.push(resolved.issue);
    } else {
      requiredResolved.set(need.materialId, resolved.material);
      resolved.records.forEach(row => mergeEvaluatedRecordRole(evaluatedRecords, row));
    }
  }
  for (const need of scope.candidates) {
    const resolved = resolveMaterial(need.materialId, 'candidate', byMaterialId);
    if ('missing' in resolved) skippedById.set(need.materialId, resolved.missing);
    else {
      candidateResolved.set(need.materialId, resolved.material);
      resolved.records.forEach(row => mergeEvaluatedRecordRole(evaluatedRecords, row));
    }
  }

  // Feasibility code checks every active alias for a stockItemRef, even when that alias
  // was not admitted as a search candidate. Supply only its own qualified projection.
  const supportResolved = new Map<string, HopDecisionMaterial>();
  if (usesProgramFeasibility(input.action)) {
    const candidateIdsByStockRef = new Map<string, string[]>();
    for (const [materialId, material] of candidateResolved) {
      const ref = !material.lot?.referenceOnly && !material.lot?.archived && !material.variety?.archived ? stockReference(material) : undefined;
      if (ref) candidateIdsByStockRef.set(ref, [...(candidateIdsByStockRef.get(ref) ?? []), materialId]);
    }
    const futureIdsByStockRef = new Map<string, string[]>();
    const futureMaterialIds = futureProgramMaterialIds(input.action);
    if (input.action.kind === 'blend') futureMaterialIds.push(...input.action.allocations.map(row => row.materialId));
    if (input.action.kind === 'replaceRemaining') futureMaterialIds.push(input.action.candidateId);
    for (const materialId of unique(futureMaterialIds)) {
      const material = requiredResolved.get(materialId);
      const ref = material && !material.lot?.referenceOnly && !material.lot?.archived && !material.variety?.archived ? stockReference(material) : undefined;
      if (ref) futureIdsByStockRef.set(ref, [...(futureIdsByStockRef.get(ref) ?? []), materialId]);
    }
    const anchorStockRefs = new Set([...candidateIdsByStockRef.keys(), ...futureIdsByStockRef.keys()]);
    if (anchorStockRefs.size) for (const group of qualification.groups) {
      if (group.status === 'archivedTombstone') continue; // J1 itself excludes archived aliases from live stock.
      const activeVariants = group.status === 'ready' && group.selectedVariantId
        ? group.rawVariants.filter(row => row.variantId === group.selectedVariantId) : group.rawVariants;
      const potential = activeVariants.filter(row => !row.material.lot?.referenceOnly && !row.material.lot?.archived
        && !row.material.variety?.archived && !!stockReference(row.material) && anchorStockRefs.has(stockReference(row.material)!));
      if (!potential.length) continue;
      const matchingStockRefs = unique(potential.map(row => stockReference(row.material)!));
      const affectedCandidateIds = unique(matchingStockRefs.flatMap(ref => candidateIdsByStockRef.get(ref) ?? []));
      const affectedFutureIds = unique(matchingStockRefs.flatMap(ref => futureIdsByStockRef.get(ref) ?? []));
      const groupMaterialIds = unique(group.rawVariants.map(row => row.material.id));
      const candidateIdsOutsideThisGroup = affectedCandidateIds.filter(id => !groupMaterialIds.includes(id));
      // This exact material's own conflicted balance is already passed as unknown to J1;
      // it remains conditional (R03), while an alias may only exclude candidates relying on it.
      if (!candidateIdsOutsideThisGroup.length && !affectedFutureIds.length
        && groupMaterialIds.every(id => candidateResolved.has(id))) continue;

      const balanceReferences = new Set(potential.map(row => hopDecisionReference(row.material.availableGrams)));
      const projection = group.status === 'ready' || group.status === 'equivalentVariants' ? group.calculationProjection
        : group.status === 'collisionNeedsSelection' ? group.commonCalculationProjection : null;
      const alias = projection?.material;
      const aliasStockRef = alias && !alias.lot?.referenceOnly ? stockReference(alias) : undefined;
      const duplicateIdentity = alias ? (byMaterialId.get(alias.id)?.length ?? 0) !== 1 : false;
      const unsafeBalanceProjection = balanceReferences.size > 1;
      if (unsafeBalanceProjection || !alias || !aliasStockRef || !anchorStockRefs.has(aliasStockRef) || duplicateIdentity) {
        const reason = unsafeBalanceProjection
          ? 'Les variantes de cet alias actif rapportent des soldes différents (ou connu/inconnu) pour le même stock; le lecteur J1 ignorerait une vue commune à solde inconnu.'
          : duplicateIdentity
            ? 'Un alias potentiel de stock a plusieurs enregistrements; aucune portée calculatoire n’est choisie implicitement.'
            : 'Un alias actif du stock intervient dans la faisabilité, mais aucune projection qualifiée sûre ne permet de vérifier son solde.';
        mergeEvaluatedRecordRole(evaluatedRecords, { recordKey: group.key, status: group.status, role: 'support', roles: ['support'],
          materialIds: unique(potential.map(row => row.material.id)), projection: 'unavailable', reasons: [...reasonsForGroup(group), reason] });
        const affectedRecords = unique([group.key, ...affectedCandidateIds.flatMap(id => (byMaterialId.get(id) ?? []).map(row => row.key))]);
        if (affectedFutureIds.length) {
          blockingIssues.push({ code: 'stockAliasUnresolved', role: 'support', materialId: potential[0].material.id, reason, recordKeys: affectedRecords });
        } else {
          for (const candidateId of affectedCandidateIds) {
            const records = unique([group.key, ...(byMaterialId.get(candidateId) ?? []).map(row => row.key)]);
            skippedById.set(candidateId, { materialId: candidateId, recordKeys: records, disposition: 'stockAliasConflict', reasons: [reason] });
            candidateResolved.delete(candidateId);
          }
        }
        continue;
      }
      if (!groupMaterialIds.every(id => requiredResolved.has(id) || candidateResolved.has(id))) supportResolved.set(alias.id, structuredClone(alias));
      mergeEvaluatedRecordRole(evaluatedRecords, { recordKey: group.key, status: group.status, role: 'support', roles: ['support'],
        materialIds: groupMaterialIds, projection: group.status === 'collisionNeedsSelection' ? 'commonCalculation' : 'calculation',
        reasons: reasonsForGroup(group) });
    }
  }

  const derivedProducts: HopCommercialProduct[] = [];
  if (input.action.kind === 'understandProducts' && input.products === undefined) {
    const productGroups = qualification.groups.filter(group => group.scope === 'product');
    const ids = input.action.productIds ?? unique(productGroups.flatMap(group => group.rawVariants
      .map(variant => variant.material.product?.id).filter((id): id is string => !!id)));
    for (const productId of ids) {
      const matches = productGroups.filter(group => group.rawVariants.some(variant => variant.material.product?.id === productId));
      if (!matches.length) continue; // J1 keeps its explicit "no matching dossier" response for absent product records.
      const recordKeys = matches.map(group => group.key).sort();
      if (matches.length !== 1) {
        const reason = 'Cette référence produit apparaît dans plusieurs scopes; aucune version n’est fusionnée implicitement.';
        skippedById.set(productId, { materialId: productId, recordKeys, disposition: 'ambiguous', reasons: [reason] });
        if (input.action.productIds) blockingIssues.push({ code: 'requiredProductAmbiguous', role: 'indispensable', materialId: productId, reason, recordKeys });
        continue;
      }
      const group = matches[0];
      const projection = group.status === 'ready' || group.status === 'equivalentVariants' ? group.calculationProjection
        : group.status === 'collisionNeedsSelection' ? group.commonCalculationProjection : null;
      const safeProduct = projection?.material.product;
      const record: HopDecisionEvaluatedRecord = { recordKey: group.key, status: group.status,
        role: input.action.productIds ? 'indispensable' : 'candidate',
        roles: [input.action.productIds ? 'indispensable' : 'candidate'],
        materialIds: unique(group.rawVariants.map(variant => variant.material.id)),
        projection: group.status === 'collisionNeedsSelection' ? 'commonCalculation' : projection ? 'calculation' : 'unavailable',
        reasons: reasonsForGroup(group) };
      mergeEvaluatedRecordRole(evaluatedRecords, record);
      const productIds = unique(group.rawVariants.map(variant => variant.material.product?.id).filter((id): id is string => !!id));
      if (safeProduct && safeProduct.id === productId && productIds.length === 1) {
        derivedProducts.push(structuredClone(safeProduct));
      } else {
        const reason = reasonsForGroup(group)[0] ?? 'Aucune projection produit sûre n’est disponible.';
        const disposition: HopDecisionSkippedCandidate['disposition'] = group.status === 'selectionInvalid' ? 'selectionInvalid'
          : group.status === 'archivedTombstone' ? 'archivedTombstone'
            : group.status === 'collisionNeedsSelection' ? 'collisionNeedsSelection' : 'noSafeProjection';
        skippedById.set(productId, { materialId: productId, recordKeys, disposition, reasons: reasonsForGroup(group).length ? reasonsForGroup(group) : [reason] });
        if (input.action.productIds) blockingIssues.push({ code: 'requiredProductUnresolved', role: 'indispensable', materialId: productId, reason, recordKeys });
      }
    }
  }

  const relevantIds = new Set([...requiredResolved.keys(), ...candidateResolved.keys(), ...skippedById.keys(),
    ...[...evaluatedRecords.values()].flatMap(row => row.materialIds)]);
  const knownAssemblyVersion = !input.qualificationInput.assembly
    || input.qualificationInput.assembly.version === 'hop-catalogue-assembly-v1';
  const notices = knownAssemblyVersion ? assemblyNotices(input.qualificationInput, relevantIds) : [];
  const unknownAssembly = !!input.qualificationInput.assembly && !knownAssemblyVersion;
  if (unknownAssembly) blockingIssues.push({ code: 'assemblyVersionUnknown', reason: `Version assembly non interprétée : ${input.qualificationInput.assembly!.version}.` });

  const allSafeMaterials = new Map([...requiredResolved, ...candidateResolved, ...supportResolved]);
  const materials = [...allSafeMaterials.values()];
  let skippedCandidates = [...skippedById.values()].filter(row => row.disposition !== 'missing' || scope.candidates.some(item => item.materialId === row.materialId));
  let partialRecordKeys = unique([
    ...[...evaluatedRecords.values()].filter(row => row.projection === 'commonCalculation').map(row => row.recordKey),
    ...skippedCandidates.flatMap(row => row.recordKeys),
    ...notices.map(notice => notice.relatedRecordKey),
  ]).sort();
  let reasons = unique([
    ...[...evaluatedRecords.values()].flatMap(row => row.reasons),
    ...skippedCandidates.flatMap(row => row.reasons),
    ...notices.map(notice => notice.reason),
    ...(unknownAssembly ? [`Le bloc assembly ${input.qualificationInput.assembly!.version} est conservé sans interprétation; résoudre sa version avant calcul.`] : []),
  ]);

  const qualificationSnapshot = { version: qualification.version, result: structuredClone(qualification) };
  const base = {
    formatVersion: 2 as const,
    actionKind: input.action.kind,
    request,
    qualificationSnapshot,
    context,
    evaluatedRecords: [...evaluatedRecords.values()].sort((a, b) => a.recordKey.localeCompare(b.recordKey)),
    partialRecordKeys,
    reasons,
    skippedCandidates,
    blockingIssues,
  };

  if (blockingIssues.length || unknownAssembly) {
    return structuredClone({ ...base, kind: 'resolutionRequired' as const, calculationInput: null, responseSnapshot: null,
      resolutionCoverage: 'partial' as const }) as unknown as HopDecisionStudySnapshotV2<A['kind']>;
  }

  const calculationAction = structuredClone(input.action);
  if (scope.candidateField) {
    const safeIds = scope.candidates.filter(candidate => candidateResolved.has(candidate.materialId)).map(candidate => candidate.materialId);
    if (scope.candidateField === 'candidateIds' && calculationAction.kind === 'substitute') calculationAction.candidateIds = safeIds;
    if (scope.candidateField === 'candidateMaterialIds' && calculationAction.kind === 'planReplacement') calculationAction.candidateMaterialIds = safeIds;
  }
  if (calculationAction.kind === 'understandProducts' && input.products === undefined && calculationAction.productIds === undefined) {
    calculationAction.productIds = derivedProducts.map(product => product.id);
  }
  const calculationInput: HopDecisionPublicInput<A> = {
    intent: structuredClone(input.intent), action: calculationAction,
    materials: structuredClone(materials),
    ...(input.products ? { products: structuredClone(input.products) }
      : input.action.kind === 'understandProducts' ? { products: structuredClone(derivedProducts) } : {}),
  };

  // Intentionally no catch: a J1 validation/programming exception is not a resolution state.
  const response = answerHopDecision(calculationInput);
  const executedPlan = input.action.kind === 'planReplacement'
    ? (response as HopDecisionResponse<'planReplacement'>).result.plan : null;
  if (executedPlan?.search.truncated) {
    const omitted = executedPlan.search.omittedCandidateMaterialIds;
    skippedCandidates = [...skippedCandidates, ...omitted.map(materialId => ({ materialId,
      recordKeys: (byMaterialId.get(materialId) ?? []).map(group => group.key).sort(), disposition: 'searchLimit' as const,
      reasons: ['Le vrai planificateur J1 a atteint une limite de recherche; ce candidat sûr n’a pas été évalué.'] }))];
    partialRecordKeys = unique([...partialRecordKeys, ...skippedCandidates.filter(row => row.disposition === 'searchLimit').flatMap(row => row.recordKeys)]).sort();
    reasons = unique([...reasons, 'La recherche J1 est tronquée; les voies explorées ne représentent pas toutes les alternatives du périmètre.']);
  }
  const resolutionCoverage = partialRecordKeys.length || skippedCandidates.length || blockingIssues.length
    || !!executedPlan?.search.truncated ? 'partial' as const : 'complete' as const;
  return structuredClone({ ...base, reasons, skippedCandidates, partialRecordKeys, kind: 'calculated' as const,
    calculationInput, responseSnapshot: response, resolutionCoverage }) as unknown as HopDecisionStudySnapshotV2<A['kind']>;
}
