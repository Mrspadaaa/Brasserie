import type { HopSource } from '../../../functions/src/hopIndexSchema';
import { assessHopBiotransformation, type HopBiotransformationInput } from './biotransformation';
import { compareHopMaterials } from './measurements';
import { analyzeHopProgram, compareHopPrograms } from './programAnalysis';
import { inspectHopProgramAvailability, previewHopProgramChanges } from './programs';
import { findHopSubstitutions, type HopSubstitutionRequest } from './substitution';
import { proposeHopBlend, proposeHopUseChange, proposeRemainingHopReplacement, samePhysicalHopMaterial } from './strategies';
import { planHopReplacement, type HopPlannerRequest, type HopPlannerResult } from './planner';
import { evaluateHopIntentEvidence, type HopIntentEvidenceCriterion, type HopIntentEvidenceEvaluation, type HopIntentEvidenceStatus } from './intentEvidence';
import { exploreHopStrategies } from './advice';
import type { HopAdviceSituation, HopAdviceInput, HopStrategyAdviceResult, HopAdviceCriterionEffect } from './adviceSchema';
import { HOP_DECISION_VERSION, type HopCommercialProduct, type HopDecisionMaterial, type HopDecisionProgram, type HopProgramProposal, type HopSubstitutionOption, type HopUse } from './types';

export interface HopDecisionIntent {
  /** Preserve the user's wording separately from the structured interpretation. */
  originalQuestion: string;
  interpretation?: string;
  assumptions?: string[];
  criteria?: HopIntentEvidenceCriterion[];
}

export type HopDecisionAction =
  | { kind: 'compareMaterials'; leftId: string; rightId: string }
  | ({ kind: 'substitute' } & Omit<HopSubstitutionRequest, 'materials'>)
  | { kind: 'comparePrograms'; before: HopDecisionProgram; after: HopDecisionProgram }
  | { kind: 'assessProgram'; program: HopDecisionProgram; bioContext?: HopBiotransformationInput }
  | ({ kind: 'changeUse' } & Omit<Parameters<typeof proposeHopUseChange>[0], 'materials'>)
  | ({ kind: 'blend' } & Omit<Parameters<typeof proposeHopBlend>[0], 'materials'>)
  | ({ kind: 'replaceRemaining' } & Omit<Parameters<typeof proposeRemainingHopReplacement>[0], 'materials'>)
  | ({ kind: 'planReplacement' } & Omit<HopPlannerRequest, 'question' | 'interpretation' | 'criteria' | 'materials'>)
  | { kind: 'understandProducts'; productIds?: string[] }
  | { kind: 'biotransformation'; context?: HopBiotransformationInput }
  | { kind: 'exploreStrategies'; situation: HopAdviceSituation; qualification?: HopAdviceInput['qualification'] };

/** Actions historically representable by dossier formats 1 and 2. */
export type HopClassicDecisionAction = Exclude<HopDecisionAction, { kind: 'exploreStrategies' }>;
export type HopClassicDecisionKind = HopClassicDecisionAction['kind'];

export interface HopProgramIntentContext {
  additionId: string;
  materialId: string;
  status: 'planned' | 'performed';
  use: HopUse;
  changed: boolean;
  evaluations: HopIntentEvidenceEvaluation[];
}

export interface HopDecisionResults {
  compareMaterials: ReturnType<typeof compareHopMaterials>;
  substitute: { options: Array<HopSubstitutionOption & { proposal: HopProgramProposal | null; programComparison: ReturnType<typeof compareHopPrograms> | null }>; searchedMaterialIds: string[]; basis: HopSubstitutionRequest['basis'] };
  comparePrograms: ReturnType<typeof compareHopPrograms>;
  assessProgram: { analysis: ReturnType<typeof analyzeHopProgram>; feasibility: ReturnType<typeof inspectHopProgramAvailability>; biotransformation: ReturnType<typeof assessHopBiotransformation> | null };
  changeUse: ReturnType<typeof proposeHopUseChange>;
  blend: ReturnType<typeof proposeHopBlend>;
  replaceRemaining: ReturnType<typeof proposeRemainingHopReplacement>;
  planReplacement: {
    request: HopPlannerRequest;
    plan: HopPlannerResult;
    comparisons: Array<{ pathId: string; comparison: ReturnType<typeof compareHopPrograms> | null }>;
    baselineEvidence: HopProgramIntentContext[];
    programEvidence: Array<{ pathId: string; additions: HopProgramIntentContext[] }>;
  };
  understandProducts: { products: HopCommercialProduct[] };
  biotransformation: ReturnType<typeof assessHopBiotransformation>;
  exploreStrategies: HopStrategyAdviceResult;
}

export interface HopDecisionResponse<K extends keyof HopDecisionResults = keyof HopDecisionResults> {
  version: typeof HOP_DECISION_VERSION;
  intent: HopDecisionIntent;
  actionKind: K;
  status: 'answered' | 'conditional' | 'noApplicableOption';
  answer: string;
  result: HopDecisionResults[K];
  criteria: Array<HopIntentEvidenceCriterion & {
    status: 'notEstablished' | 'evaluatedByOption' | 'evaluatedByStrategy'; reason: string;
    strategies?: Array<{ optionId: string; optionReference: string; evaluation: HopAdviceCriterionEffect }>;
    options?: Array<{ pathId: string; applicability: HopProgramProposal['applicability']; evaluations: Array<{
      additionId: string; materialId: string; status: HopIntentEvidenceStatus; consequence: string; changed: boolean; performed: boolean;
    }> }>;
  }>;
  missingInformation: string[];
  sources: HopSource[];
  boundaries: { offline: true; writesRecipe: false; writesBatch: false; sensoryValidation: 'notEstablished' };
}

function programIntentContext(request: HopPlannerRequest, replacements: Record<string, string> = {}): HopProgramIntentContext[] {
  // Only identity/use/status are needed for documentary context. Do not invent a mass for a path awaiting dose selection.
  const rows = request.program.additions.map(addition => {
    const changed = Object.prototype.hasOwnProperty.call(replacements, addition.id);
    return { additionId: addition.id, materialId: changed ? replacements[addition.id] : addition.materialId,
      status: addition.status, use: addition.use, changed };
  });
  return rows.map(row => {
    const candidate = request.materials.find(material => material.id === row.materialId)!;
    const evaluations = request.criteria.map(criterion => {
      const evaluation = evaluateHopIntentEvidence({ criterion, candidate, materials: request.materials });
      const partner = criterion.partner;
      if (partner?.kind === 'material' && partner.additionId) {
        const expected = request.materials.find(material => material.id === partner.id);
        const actualId = rows.find(item => item.additionId === partner.additionId)?.materialId;
        const actual = request.materials.find(material => material.id === actualId);
        if (!expected || !actual || !samePhysicalHopMaterial(expected, actual)) {
          return { ...evaluation, status: 'unknown' as const,
            missingInformation: [...evaluation.missingInformation, 'Le partenaire lié à cet ajout ne correspond pas au programme proposé.'],
            consequence: 'Les descriptions du partenaire restent des références, mais sa présence dans le programme n’est pas établie par ce lien.' };
        }
      }
      return evaluation;
    });
    return { ...row, evaluations };
  });
}

/** One local endpoint for UI/assistant consumers. No implicit NLP, target, dose or recipe write. */
export function answerHopDecision<A extends HopDecisionAction>(input: {
  intent: HopDecisionIntent;
  action: A;
  materials: HopDecisionMaterial[];
  products?: HopCommercialProduct[];
}): HopDecisionResponse<A['kind']> {
  if (!input.intent.originalQuestion.trim()) throw Error('Conserver la demande d’origine.');
  if (new Set(input.materials.map(m => m.id)).size !== input.materials.length) throw Error('Identités de matières dupliquées.');
  const material = (id: string) => {
    const result = input.materials.find(m => m.id === id);
    if (!result) throw Error(`Matière introuvable : ${id}.`);
    return result;
  };
  const action = input.action;
  let status: 'answered' | 'conditional' | 'noApplicableOption' = 'answered';
  let answer: string;
  let result: unknown;
  const sources: HopSource[] = [];
  const missing: string[] = [];
  let criteria: HopDecisionResponse['criteria'] = (input.intent.criteria ?? []).map(criterion => ({ ...structuredClone(criterion), status: 'notEstablished',
    reason: 'Ce contrat technique ne certifie pas la satisfaction sensorielle d’une intention ; lire les calculs et preuves propres aux options.' }));
  switch (action.kind) {
    case 'exploreStrategies': {
      const advice = exploreHopStrategies({ intent: input.intent, situation: action.situation, materials: input.materials,
        ...(action.qualification ? { qualification: action.qualification } : {}) });
      result = advice;
      status = advice.status;
      answer = advice.options.length
        ? 'Des pistes de stratégie sont examinées selon votre lecture et la situation fournie. Préférer une piste ne choisit aucune dose et ne modifie pas le programme ; chaque voie garde ses raisons, conditions et inconnues.'
        : 'Aucune piste dans le périmètre documenté ; les limites et informations utiles restent disponibles, sans conclure à une impossibilité brassicole générale.';
      missing.push(...advice.informationRequests.map(request => request.question));
      criteria = (input.intent.criteria ?? []).map(criterion => ({ ...structuredClone(criterion), status: 'evaluatedByStrategy',
        reason: 'Les évaluations sont propres aux pistes documentaires ; elles ne certifient ni résultat sensoriel ni applicabilité opérationnelle.',
        strategies: advice.options.flatMap(option => option.criterionEffects.filter(effect => effect.criterionId === criterion.id)
          .map(evaluation => ({ optionId: option.id, optionReference: option.reference, evaluation: structuredClone(evaluation) }))),
      }));
      break;
    }
    case 'planReplacement': {
      const request: HopPlannerRequest = {
        question: input.intent.originalQuestion, interpretation: input.intent.interpretation ?? '', criteria: input.intent.criteria ?? [],
        program: action.program, unavailable: action.unavailable, materials: input.materials,
        exclusions: action.exclusions, basisByUse: action.basisByUse, candidateMaterialIds: action.candidateMaterialIds, limits: action.limits,
      };
      const plan = planHopReplacement(request);
      const baselineEvidence = programIntentContext(request);
      const programEvidence = plan.paths.map(path => ({ pathId: path.pathId,
        additions: programIntentContext(request, Object.fromEntries(path.assignments.map(assignment => [assignment.additionId, assignment.candidateMaterialId]))) }));
      const possible = plan.paths.filter(path => path.complete && path.applicability !== 'unavailable');
      status = !possible.length ? 'noApplicableOption'
        : possible.some(path => path.status === 'ready') && !request.criteria.length && !plan.search.truncated ? 'answered' : 'conditional';
      answer = possible.length
        ? `${possible.length} piste${possible.length > 1 ? 's' : ''} de programme pour remplacer les ajouts encore prévus de ${material(action.unavailable.materialId).name}. Les doses, emplois, contraintes et preuves sont détaillés pour chaque voie ; les opérations effectuées sont conservées.`
        : 'Aucune voie complète applicable dans le périmètre exploré. Les pistes par ajout et les causes de refus restent disponibles ; cela ne démontre pas une impossibilité brassicole.';
      if (plan.search.truncated) answer += ' La recherche est limitée : d’autres voies peuvent exister.';
      const tensions = possible.filter(path => programEvidence.find(item => item.pathId === path.pathId)?.additions
        .some(row => row.evaluations.some(evaluation => evaluation.status === 'documentedTension')));
      if (tensions.length) answer += ` ${tensions.length} voie${tensions.length > 1 ? 's présentent' : ' présente'} une tension documentaire avec un caractère évité.`;
      missing.push(...plan.unresolved.map(item => item.reason));
      criteria = request.criteria.map(criterion => ({ ...structuredClone(criterion),
        status: plan.paths.length ? 'evaluatedByOption' : 'notEstablished',
        reason: plan.paths.length ? 'Évaluation propre à chaque voie ; les faits documentaires, la faisabilité technique et le résultat sensoriel restent distincts.'
          : 'Aucune voie complète disponible ; les preuves et inconnues par candidat restent accessibles dans les pistes par ajout.',
        options: plan.paths.map(path => ({ pathId: path.pathId, applicability: path.applicability,
          evaluations: programEvidence.find(item => item.pathId === path.pathId)!.additions.flatMap(row => row.evaluations
            .filter(item => item.criterion.id === criterion.id).map(item => ({ additionId: row.additionId, materialId: row.materialId,
              status: item.status, consequence: item.consequence, changed: row.changed, performed: row.status === 'performed' }))),
        })),
      }));
      result = structuredClone({ request, plan, baselineEvidence, programEvidence, comparisons: plan.paths.map(path => ({ pathId: path.pathId,
        comparison: path.preview ? compareHopPrograms(request.program, path.preview.program, input.materials) : null })) });
      break;
    }
    case 'compareMaterials': {
      result = compareHopMaterials(material(action.leftId), material(action.rightId));
      answer = 'Les teneurs et descripteurs sont comparés avec leurs bases et contextes ; aucune équivalence en bière n’est déduite.';
      break;
    }
    case 'substitute': {
      const options = findHopSubstitutions({ ...action, materials: input.materials });
      const presented = options.map(option => {
        const { programPreview, ...details } = option;
        const proposal = programPreview ?? (option.changes ? previewHopProgramChanges(action.program, option.changes, input.materials) : null);
        const applicability = proposal?.applicability === 'unavailable' ? 'blocked' as const
          : proposal?.applicability === 'conditional' && option.applicability === 'ready' ? 'conditional' as const : option.applicability;
        return { ...details, applicability, reasons: [...option.reasons, ...proposal?.conditions ?? []], proposal,
          programComparison: proposal ? compareHopPrograms(action.program, proposal.program, input.materials) : null };
      });
      result = { options: presented, searchedMaterialIds: action.candidateIds ?? input.materials.map(m => m.id), basis: action.basis };
      const possible = presented.filter(o => o.applicability !== 'blocked' && o.proposal?.applicability !== 'unavailable');
      status = !possible.length ? 'noApplicableOption' : possible.some(o => o.applicability === 'ready' && o.proposal?.applicability === 'available') ? 'answered' : 'conditional';
      answer = !possible.length ? 'Aucune option applicable dans les matières et emplois explorés. Cela ne démontre pas une impossibilité brassicole.'
        : `${possible.length} option${possible.length > 1 ? 's' : ''} à comparer selon la convention demandée ; les différences de charge et les conditions sont propres à chaque option.`;
      missing.push(...possible.flatMap(o => o.missing));
      break;
    }
    case 'comparePrograms':
      result = compareHopPrograms(action.before, action.after, input.materials);
      answer = 'Les deux programmes sont comparés sur leurs charges et estimations déclarées ; les conséquences sensorielles non établies restent inconnues.';
      break;
    case 'assessProgram':
      result = { analysis: analyzeHopProgram(action.program, input.materials), feasibility: inspectHopProgramAvailability(action.program, input.materials),
        biotransformation: action.bioContext ? assessHopBiotransformation(action.bioContext) : null };
      status = 'conditional';
      answer = 'Le bilan distingue ce qui est introduit, estimé et encore inconnu. Les observations du brasseur sont conservées ; elles ne sont pas remplacées par un score de modèle.';
      break;
    case 'changeUse':
      result = proposeHopUseChange({ ...action, materials: input.materials });
      status = 'conditional';
      answer = 'La quantité choisie est déplacée dans un programme explicite. Le bilan compare les emplois ; conserver la masse ne conserve pas automatiquement l’effet.';
      break;
    case 'blend':
      result = proposeHopBlend({ ...action, materials: input.materials });
      status = 'conditional';
      answer = 'Le mélange respecte les fractions et la convention choisies. Les charges sont calculées ; aucune moyenne de goûts ni bonus de synergie n’est supposé.';
      break;
    case 'replaceRemaining': {
      const replacement = proposeRemainingHopReplacement({ ...action, materials: input.materials });
      result = replacement;
      status = replacement.proposal?.applicability === 'available' ? 'answered'
        : replacement.proposal?.applicability === 'unavailable' ? 'noApplicableOption' : 'conditional';
      missing.push(...replacement.missing);
      answer = 'Le remplacement traite ensemble les ajouts restants de cette matière, selon leur emploi. Les opérations faites sont conservées ; le bilan et le stock sont vérifiés sur tout le programme.';
      break;
    }
    case 'understandProducts': {
      const products = (input.products ?? []).filter(p => !action.productIds || action.productIds.includes(p.id));
      result = { products };
      products.forEach(p => sources.push(p.source, ...(p.replacement ? [p.replacement.source] : [])));
      status = products.length ? 'answered' : 'conditional';
      answer = products.length ? 'Chaque produit conserve ses emplois, sa convention de dosage et ses limites propres. Une forme générique ne définit pas un ratio universel.' : 'Aucun dossier produit ne correspond à cette sélection ; préciser l’identité commerciale ou conserver la question ouverte.';
      break;
    }
    case 'biotransformation':
      result = assessHopBiotransformation(action.context);
      status = 'conditional';
      answer = 'Les voies biochimiques sont examinées séparément, avec les conditions qui changeraient leur pertinence. Aucun gain sensoriel universel n’est chiffré.';
      break;
    default:
      throw Error('Action houblon non reconnue par cette version du contrat.');
  }
  const gatherSources = (value: unknown): void => {
    if (!value || typeof value !== 'object') return;
    const candidate = value as Partial<HopSource>;
    if (typeof candidate.reference === 'string' && typeof candidate.title === 'string' && typeof candidate.author === 'string' && candidate.kind) sources.push(candidate as HopSource);
    else Object.values(value).forEach(gatherSources);
  };
  gatherSources(result);
  const distinctSources = [...new Map(sources.map(source => [JSON.stringify(source), source])).values()];
  return {
    version: HOP_DECISION_VERSION, intent: structuredClone(input.intent), actionKind: action.kind, status, answer, result: result as HopDecisionResults[A['kind']],
    criteria,
    missingInformation: [...new Set(missing)], sources: distinctSources,
    boundaries: { offline: true, writesRecipe: false, writesBatch: false, sensoryValidation: 'notEstablished' as const },
  };
}
