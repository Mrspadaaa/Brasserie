import { hopAdviceContentReference } from './adviceContentReference';
import { evaluateHopIntentEvidence, type HopIntentEvidenceCriterion } from './intentEvidence';
import { assertHopDocumentaryCorpus, type HopDocumentaryCorpus } from './documentaryAnswerSchema';
import { HOP_DOCUMENTARY_CLAIM_IDS as DOCUMENTARY } from './documentaryEvidence';
import { getHopPropertyAdviceCorpus, PROPERTY_ADVICE_CLAIM_IDS as CLAIM,
  PROPERTY_ADVICE_PRODUCT_PATHS } from './propertyAdviceEvidence';
import { assertHopPropertyAdviceRequest, assertHopPropertyAdviceAnswer,
  hopPropertyAdviceInputReference, hopPropertyAdviceInterpretationReference,
  hopPropertyAdviceStrategyReference, hopPropertyAdviceAnswerReference,
  assertHopPropertyAdviceRequestV3, assertHopPropertyAdviceAnswerV3,
  hopPropertyAdviceInputReferenceV3, hopPropertyAdviceInterpretationReferenceV3,
  hopPropertyAdviceStrategyReferenceV3, hopPropertyAdviceAnswerReferenceV3,
  type HopPropertyAdviceRequest, type HopPropertyAdviceAnswer,
  type HopPropertyAdviceIntentV3, type HopPropertyAdviceRequestV3, type HopPropertyAdviceAnswerV3 } from './propertyAdviceSchema';

type Intent = HopPropertyAdviceRequest['propertyIntents'][number];
type Argument = HopPropertyAdviceAnswer['arguments'][number];
type Assessment = HopPropertyAdviceAnswer['candidateAssessments'][number];
type Strategy = HopPropertyAdviceAnswer['strategies'][number];
type Effect = Strategy['effects'][number];
const RULES_VERSION = 'hop-property-advice-rules-v10';
const V3_RULES_VERSION = RULES_VERSION;
const unique = <T>(rows: T[]): T[] => [...new Set(rows)];
const nodeId = (kind: string, ...parts: string[]) => hopAdviceContentReference('hop-property-advice-node-v1', { kind, parts });
const same = (a: unknown, b: unknown) => hopAdviceContentReference('hop-property-advice-equality-v1', a)
  === hopAdviceContentReference('hop-property-advice-equality-v1', b);
const isContext = (intent: Intent) => intent.role === 'reportedObservation' || intent.role === 'measurement';
const isAromaPreservationGuard = (intent: Intent) => intent.property === 'aroma'
  && intent.direction === 'keep';

/** A pure qualitative comparison. It neither parses the question nor authorizes an operation. */
export function buildHopPropertyAdvice(request: HopPropertyAdviceRequest,
  corpus: HopDocumentaryCorpus = getHopPropertyAdviceCorpus()): HopPropertyAdviceAnswer {
  assertHopPropertyAdviceRequest(request);
  return buildPropertyAdvice(request, corpus) as HopPropertyAdviceAnswer;
}

/** V3 keeps a typed investigation separate from a target and from the lever proposed by the advice. */
export function buildHopPropertyAdviceV3(request: HopPropertyAdviceRequestV3,
  corpus: HopDocumentaryCorpus = getHopPropertyAdviceCorpus()): HopPropertyAdviceAnswerV3 {
  assertHopPropertyAdviceRequestV3(request);
  return buildPropertyAdvice(request, corpus) as HopPropertyAdviceAnswerV3;
}

function buildPropertyAdvice(request: HopPropertyAdviceRequest | HopPropertyAdviceRequestV3,
  corpus: HopDocumentaryCorpus): HopPropertyAdviceAnswer | HopPropertyAdviceAnswerV3 {
  assertHopDocumentaryCorpus(corpus);
  const v3 = request.format === 'hop-documentary-request-v3';
  const input = structuredClone(request), evidence = structuredClone(corpus), registered = getHopPropertyAdviceCorpus();
  const inputReference = v3 ? hopPropertyAdviceInputReferenceV3(input as HopPropertyAdviceRequestV3, evidence)
    : hopPropertyAdviceInputReference(input as HopPropertyAdviceRequest, evidence);
  const strategyReference = v3 ? hopPropertyAdviceStrategyReferenceV3 : hopPropertyAdviceStrategyReference;
  const known = new Set(evidence.claims.filter(claim => {
    const expected = registered.claims.find(row => row.id === claim.id);
    return !!expected && same(claim, expected) && claim.sourceIds.every(id => {
      const actualSource = evidence.sources.find(row => row.id === id), registeredSource = registered.sources.find(row => row.id === id);
      return !!actualSource && !!registeredSource && same(actualSource, registeredSource);
    });
  }).map(row => row.id));
  const has = (...ids: string[]) => ids.every(id => known.has(id));
  const intents = input.propertyIntents, active = intents.filter(intent => !isContext(intent));
  const typedInquiryIds = new Set<string>();
  const compensationQuestions = new Map<string, { intent: Intent; unsupportedObservationIds: string[] }>();
  if (v3) for (const intent of active) {
    const inquiry = (intent as HopPropertyAdviceIntentV3).investigation;
    if (inquiry?.kind !== 'comparePerceptualCompensation') continue;
    typedInquiryIds.add(intent.id);
    const linked = inquiry.observationIntentIds.map(id => intents.find(row => row.id === id)!);
    const beerPerception = (row: Intent) => (row.subject.kind === 'beer' || row.subject.kind === 'unspecified')
      && (row.subject.sensoryContext === 'beer' || row.subject.sensoryContext === 'unspecified');
    const supported = linked.filter(row => row.role === 'reportedObservation' && row.metric === 'sensory'
      && row.property === 'sweetness' && beerPerception(row) && beerPerception(intent));
    if (supported.length) compensationQuestions.set(intent.id, { intent,
      unsupportedObservationIds: linked.filter(row => !supported.includes(row)).map(row => row.id) });
  }
  const propertyGoals = active.filter(intent => !typedInquiryIds.has(intent.id));
  const aroma = propertyGoals.filter(intent => intent.property === 'aroma');
  const descriptiveIntents = aroma.filter(intent => intent.role === 'target' || intent.role === 'preference'
    || intent.role === 'constraint' && (intent.direction === 'keep' || intent.direction === 'exclude' || intent.direction === 'decrease'));
  const aromaDrivers = descriptiveIntents.filter(intent => !isAromaPreservationGuard(intent));
  const biology = propertyGoals.filter(intent => intent.property === 'bioContribution');
  const materialContext = intents.filter(intent => !typedInquiryIds.has(intent.id)
    && (intent.property === 'materialCharacter' || intent.subject.kind === 'material'));
  const decreaseSweetness = propertyGoals.filter(intent => intent.property === 'sweetness' && intent.direction === 'decrease'
    && intent.comparisonBasis.kind === 'current' && intent.role !== 'investigation');
  const balanceIntentIds = unique([...decreaseSweetness.map(intent => intent.id), ...compensationQuestions.keys()]);
  const pairingIntents = aroma.filter(intent => intent.partner
    && (intent.role === 'target' || intent.role === 'preference')
    && (intent.direction === 'increase' || intent.direction === 'keep' || intent.direction === null));
  const arguments_: Argument[] = [], strategies: Strategy[] = [], assessments: Assessment[] = [];
  const body: HopPropertyAdviceAnswer['body'] = [];
  const sourceArgs = new Map<string, string>();
  const candidateArgs = new Map<string, string>();
  const interpretationArgs = new Map<string, string>();
  const substantive = new Set<string>();

  function argument(key: string, kind: Argument['kind'], text: string, intentIds: string[] = [],
    claimIds: string[] = [], assertionIds: string[] = [], materialEvidence: Argument['materialEvidence'] = []) {
    const row: Argument = { id: nodeId('argument', key), kind, text, intentIds: unique(intentIds),
      assertionIds: unique(assertionIds), claimIds: unique(claimIds.filter(id => known.has(id))),
      materialEvidence: structuredClone(materialEvidence) };
    arguments_.push(row); return row.id;
  }
  function source(id: string) {
    if (!known.has(id)) return null;
    const existing = sourceArgs.get(id); if (existing) return existing;
    const claim = evidence.claims.find(row => row.id === id)!;
    const arg = argument(`claim:${id}`, 'documentaryFact', claim.statement, intents.map(intent => intent.id), [id]);
    sourceArgs.set(id, arg); return arg;
  }
  function sources(ids: string[]): string[] { return unique(ids.flatMap(id => { const arg = source(id); return arg ? [arg] : []; })); }
  function paragraph(key: string, text: string, argumentIds: string[]) {
    body.push({ id: nodeId('paragraph', key), text, argumentIds: unique(argumentIds) });
  }
  function intentText(intent: Intent) {
    const label = intent.qualification ? `« ${intent.label} », qualifié « ${intent.qualification} »` : `« ${intent.label} »`;
    return intent.partner ? `${label}, en relation avec ${partnerText(intent)}` : label;
  }
  function partnerText(intent: Intent) {
    const partner = intent.partner;
    return partner?.kind === 'freeContext' ? `« ${partner.text} »` : partner?.kind === 'material'
      ? `la matière partenaire « ${input.materials.find(row => row.id === partner.id)?.name ?? 'fiche non chargée'} »`
      : 'l’observation partenaire explicitement liée';
  }
  function isCompensationQuestion(intent: Intent) {
    return compensationQuestions.has(intent.id) || intent.role === 'investigation' && intent.property === 'sweetness' && decreaseSweetness.some(goal =>
      goal.subject.kind === intent.subject.kind && goal.subject.materialId === intent.subject.materialId
      && (intent.relatedIntentIds.includes(goal.id) || goal.relatedIntentIds.includes(intent.id)));
  }
  for (const intent of intents) {
    const kinds: Record<Intent['role'], Argument['kind']> = { target: 'userTarget', reportedObservation: 'userObservation',
      measurement: 'userMeasurement', investigation: 'userQuestion', preference: 'userPreference', constraint: 'userConstraint' };
    const leads: Record<Intent['role'], string> = { target: 'Objectif', reportedObservation: 'Observation rapportée sur son sujet déclaré',
      measurement: 'Mesure liée aux assertions fournies', investigation: 'Question à examiner, sans effet constaté déduit',
      preference: 'Préférence déclarée', constraint: 'Contrainte déclarée' };
    const proposed = intent.interpretationOrigin === 'proposal' ? 'Lecture proposée : ' : '';
    const frame = intent.comparisonBasis.kind === 'qualitativeTarget'
      ? ' Cible qualitative, sans niveau actuel ni valeur numérique déduits.'
      : intent.comparisonBasis.kind === 'current' && !intent.comparisonBasis.assertionIds.length
        ? ' La base actuelle n’est pas qualifiée ; elle ne reçoit aucune valeur par défaut.' : '';
    interpretationArgs.set(intent.id, argument(`intent:${intent.id}`, intent.interpretationOrigin === 'proposal' ? 'proposedReading' : kinds[intent.role],
      `${proposed}${leads[intent.role]} : ${intentText(intent)}.${frame}`, [intent.id], [], intent.comparisonBasis.assertionIds));
  }

  function mappedSource(value: unknown) {
    return evidence.sources.some(row => {
      const expected = registered.sources.find(item => item.id === row.id);
      return !!expected && same(row, expected) && same(row.source, value);
    });
  }
  function criterion(intent: Intent): HopIntentEvidenceCriterion {
    return { id: intent.id, description: intent.label, origin: intent.interpretationOrigin === 'user' ? 'user' : 'proposal',
      role: intent.partner ? 'pairWith' : intent.direction === 'exclude' || intent.direction === 'decrease' ? 'avoid'
        : intent.direction === 'keep' ? 'preserve' : 'seek',
      ...(intent.familyId ? { familyId: intent.familyId } : {}), ...(intent.partner ? { partner: structuredClone(intent.partner) } : {}) };
  }
  for (const materialId of [...input.candidatePolicy.materialIds].sort()) {
    const material = input.materials.find(row => row.id === materialId);
    if (!material) {
      assessments.push({ materialId, status: 'notLoaded', recordKeys: [], evaluations: [],
        reasons: ['Identité comprise dans le périmètre mais absente des matières fournies ; aucun substitut ou stock créé.'] });
      continue;
    }
    const evaluations: Assessment['evaluations'] = [];
    const missingMapping: string[] = [];
    for (const intent of descriptiveIntents) {
      const evaluated = evaluateHopIntentEvidence({ criterion: criterion(intent), candidate: material, materials: input.materials });
      if ([...evaluated.candidateEvidence, ...evaluated.partnerEvidence].some(row => !mappedSource(row.mappingSource))) {
        missingMapping.push(intent.id); continue;
      }
      evaluations.push({ intentId: intent.id, partnerReference: evaluated.partnerReference, status: evaluated.status,
        candidateDescriptions: evaluated.candidateDescriptions, partnerDescriptions: evaluated.partnerDescriptions,
        candidateEvidence: evaluated.candidateEvidence, partnerEvidence: evaluated.partnerEvidence,
        familyIds: evaluated.familyIds, sharedFamilyIds: evaluated.sharedFamilyIds, missingInformation: evaluated.missingInformation,
        consequence: evaluated.consequence,
        reason: 'Évaluation descriptive du critère compatible ; ni intensité ni efficacité en bière ni choix utilisateur déduits.' });
    }
    const documented = evaluations.some(row => row.candidateDescriptions.length > 0);
    const assessment: Assessment = { materialId, status: documented ? 'documented' : 'unqualified', recordKeys: [], evaluations,
      reasons: documented
        ? ['Descriptions sourcées disponibles dans le périmètre déclaré ; leur pertinence est détaillée séparément pour chaque intention.']
        : ['Aucune description qualifiée exploitable pour les propriétés fournies ; la fiche reste dans le snapshot.'] };
    if (missingMapping.length) assessment.reasons.push(`Source exacte de mapping non qualifiée pour les intentions : ${missingMapping.join(', ')}.`);
    assessments.push(assessment);
    if (documented) {
      const mentions = unique(evaluations.flatMap(row => row.candidateEvidence.map(item =>
        `${item.polarity === 'explicitNegation' ? 'négation' : item.polarity === 'ambiguousMention' ? 'mention ambiguë' : 'mention'} « ${item.term} » (${item.context})`)));
      const materialEvidence = evaluations.filter(row => row.candidateDescriptions.length).map(evaluation => ({ materialId,
        intentId: evaluation.intentId, evaluation }));
      candidateArgs.set(materialId, argument(`material:${materialId}`, 'documentaryFact',
        `${material.name} : ${mentions.length ? mentions.join(' ; ') : 'descriptions consultables, sans rapprochement de famille ni intensité établis'}. Les contextes et sources restent ceux des fiches.`,
        evaluations.map(row => row.intentId), [], [], materialEvidence));
    }
  }
  const documentedCandidates = assessments.filter(row => row.status === 'documented' && row.evaluations.some(evaluation =>
    evaluation.candidateEvidence.length || !aroma.find(intent => intent.id === evaluation.intentId)?.familyId)).map(row => row.materialId);
  const candidateMissing = assessments.filter(row => row.status !== 'documented');
  const isAromaWanted = aroma.length > 0;
  const onlyAromaReduction = aromaDrivers.length > 0 && aromaDrivers.every(intent => intent.direction === 'exclude' || intent.direction === 'decrease');
  const canDesignAroma = aromaDrivers.some(intent => intent.direction === 'increase' || intent.direction === 'keep'
    || intent.direction === null && (intent.role === 'target' || intent.role === 'preference'));
  const currentScope = (): Strategy['scope'] => input.context.stage === 'planning' || input.context.stage === 'hotSide' ? 'futureBrew'
    : input.context.stage === 'packaged' ? 'separatePortion' : 'bulkBeer';
  const comparisonScope = (): Strategy['scope'] => input.context.stage === 'planning' ? 'futureBrew'
    : input.context.access.separatePortion.state === 'yes' || input.context.stage === 'packaged' ? 'separatePortion' : 'sampling';

  function effectFor(intent: Intent, kind: string, contribution: Strategy['contribution'], scope: Strategy['scope'],
    strategyClaims: string[], candidateIds: string[], baseArgs: string[]): Effect {
    const userArg = interpretationArgs.get(intent.id)!;
    const make = (status: Effect['status'], text: string, extra: string[] = []) => ({ intentId: intent.id, status,
      text, argumentIds: unique([userArg, ...baseArgs, ...extra]) });
    if (isContext(intent)) return make('notApplicable',
      `${intentText(intent)} reste un élément de contexte sur ${intent.subject.label}, sans devenir objectif, mesure supplémentaire ou propriété calculée de bière.`);
    if (typedInquiryIds.has(intent.id) && !compensationQuestions.has(intent.id)) return make('unresolved',
      'L’enquête de compensation reste liée à ses constats et à leurs sujets déclarés. Cette tranche ne qualifie pas de voie pour ces propriétés ou contextes ; aucune observation de matière ne devient une perception de bière.');
    if (intent.property === 'sweetness' || isCompensationQuestion(intent)) {
      if (intent.role === 'investigation' && !isCompensationQuestion(intent)) return make('unresolved',
        'La question de douceur est conservée sans en déduire un excès, une cible ou du sucre mesuré. Préciser ce qui doit être comparé avant une correction.');
      if (!has(CLAIM.SWEETNESS_IS_PERCEPTION, CLAIM.PERCEPTION_NOT_IBU)) return make('unresolved',
        'Le rôle souhaité de la douceur reste visible ; les prémisses nécessaires pour parler de son équilibre ne sont pas toutes présentes.');
      if (kind === 'sweetness-balance' || kind === 'future-sweetness-balance') return make('hypothesis',
        'Comparer un autre équilibre gustatif peut répondre à la demande explicite de compensation. Cela ne retire pas de sucre ; le caractère et la préférence doivent être éprouvés au témoin.',
        sources([CLAIM.SWEETNESS_IS_PERCEPTION, CLAIM.PERCEPTION_NOT_IBU]));
      return make('unresolved', intent.comparisonBasis.kind === 'qualitativeTarget'
        ? `La douceur ${intentText(intent)} reste un objectif du profil, sans être requalifiée en défaut. Cette stratégie ne fournit pas de levier étayé pour atteindre cette cible : la conserver dans la demande ne suffit pas à la traiter.`
        : 'La perception de douceur reste un critère distinct, mais cette voie ne fournit pas de levier qualifié pour la préserver ou la modifier. Ni teneur ni retrait de sucre ne sont déduits.',
      sources([CLAIM.SWEETNESS_IS_PERCEPTION, CLAIM.PERCEPTION_NOT_IBU]));
    }
    if (intent.property === 'unresolved' && !isCompensationQuestion(intent)) return make('unresolved',
      `Le sens de ${intentText(intent)} reste à préciser. Les autres propriétés sont traitées sans lui attribuer une famille, un chiffre ou un mécanisme.`);
    if (intent.property === 'aroma') {
      if (intent.role === 'investigation') return make('unresolved',
        'La question aromatique reste à examiner dans son contexte déclaré. Un partenaire ou des descriptions de matière ne qualifient ni un accord recherché, ni un excès ou un manque dans la bière. Aucune cible d’apport n’est déduite de cette question.');
      const rows = assessments.filter(row => candidateIds.includes(row.materialId)).flatMap(row => row.evaluations
        .filter(evaluation => evaluation.intentId === intent.id).map(evaluation => ({ row, evaluation })));
      const matches = rows.filter(({ evaluation }) => evaluation.candidateEvidence.length > 0);
      const refs = matches.flatMap(({ row }) => candidateArgs.get(row.materialId) ? [candidateArgs.get(row.materialId)!] : []);
      if (isAromaPreservationGuard(intent)
        && !(kind === 'pairing-comparison' && pairingIntents.some(row => row.id === intent.id))) return make('unresolved',
        `La garde ${intentText(intent)} porte sur sa préservation. Cette voie ne suffit pas à vérifier qu’elle est respectée ; comparer ce caractère au témoin avant de retenir le changement. Une description de matière ou un autre effet ne justifie pas à lui seul d’apporter ce caractère.`, refs);
      if (intent.direction === 'exclude' || intent.direction === 'decrease') {
        if (matches.some(({ evaluation }) => evaluation.status === 'documentedTension')) {
          return make('tension', `Certaines descriptions mentionnent le caractère à éviter ou réduire ${intentText(intent)}. Cette tension distingue les candidats ; elle ne devient pas une invitation à apporter ce caractère.`, refs);
        }
        if (matches.some(({ evaluation }) => evaluation.status === 'documentedAgainst'
          && evaluation.candidateEvidence.some(item => item.polarity === 'explicitNegation'))) {
          return make('boundedSupport', `Une négation explicite du caractère ${intentText(intent)} est documentée dans son contexte source. Cela motive une comparaison du candidat, sans certifier l’absence de ce caractère dans la bière.`, refs);
        }
        return make('unresolved', kind === 'future-character-review'
          ? `Les seuls choix futurs peuvent être réexaminés pour ${intentText(intent)}. La garde reste non vérifiée faute de preuve de candidat ou de comparaison ; aucun caractère déjà présent n’est retiré.`
          : `Conserver ${intentText(intent)} comme garde d’exclusion ou de réduction. Cette voie ne fournit pas de preuve suffisante pour la vérifier ; elle ne propose pas d’apporter le caractère exclu.`);
      }
      if (kind === 'pairing-comparison' && pairingIntents.some(row => row.id === intent.id)) return make('hypothesis',
        `Comparer le caractère demandé avec ${partnerText(intent)}, en gardant le rôle du partenaire plutôt qu’en imposant sa hausse. Les interactions documentées motivent cet essai au témoin ; elles ne garantissent ni harmonie ni somme de profils.`,
        [...refs, ...sources([CLAIM.BLEND_COMPARISON, CLAIM.LEXICAL_NOT_PROFILE])]);
      if (kind === 'future-character-review') return make(input.context.stage === 'packaged' && intent.comparisonBasis.kind === 'current' ? 'unresolved' : 'hypothesis',
        `Réexaminer les matières et les seuls ajouts futurs associés à ${intentText(intent)} permet de comparer des alternatives ou un retrait planifié. Cela ne retire aucun caractère déjà présent et ne prédit pas une absence en bière.`, refs);
      if (matches.some(({ evaluation }) => evaluation.status === 'documentedTension' || evaluation.status === 'documentedAgainst')) {
        return make('tension', `Certaines fiches rapprochées de ${intentText(intent)} documentent une tension avec la direction demandée. Comparer leurs preuves séparément ; la stratégie ne garantit pas que tous ses candidats conviennent.`, refs);
      }
      if (kind === 'culture-investigation') return make('hypothesis',
        `La contribution de la culture à ${intentText(intent)} est une hypothèse séparée. Identifier souche, substrats et procédé avant de lui attribuer un bénéfice ; aucune hausse sensorielle n’est prédite.`, sources([CLAIM.CHEMISTRY_NOT_SENSORY]));
      if (kind === 'material-characterization') return make('hypothesis',
        `Caractériser l’échantillon peut départager son intérêt pour ${intentText(intent)} ; l’odeur observée sur la matière ne démontre pas son transfert dans la bière.`, sources([CLAIM.MATERIAL_CHARACTERIZATION]));
      if (matches.length) return make('boundedSupport',
        `Des descriptions rapprochent les candidats de ${intentText(intent)} dans leurs contextes déclarés. Cela motive leur comparaison, sans niveau d’arôme, harmonie ou résultat en bière garantis.`, refs);
      if (contribution === 'option' && strategyClaims.length) return make('hypothesis',
        `Cette voie propose un levier d’apport à examiner pour ${intentText(intent)}, en séparant choix de matière, emploi et comparaison sensorielle. Les descriptions ou l’intensité demandée restent à qualifier.`);
      return make('unresolved', `Aucune preuve de candidat ou d’emploi n’établit ici une réponse spécifique à ${intentText(intent)}.`);
    }
    if (intent.property === 'bitterness') {
      if (kind === 'culture-investigation') return make('unresolved',
        'L’investigation de culture ne fournit pas à elle seule un levier qualifié pour cette cible ou garde d’amertume. La garder séparée de la question biologique ; aucune amertume finale n’est prédite.');
      if (kind === 'sweetness-balance' || kind === 'future-sweetness-balance') return make('tension',
        'La compensation étudiée modifie le rôle de l’amertume ; elle peut entrer en tension avec la garde ou la cible déclarée. Ne pas la retenir comme satisfaction automatique du profil.', sources([CLAIM.PERCEPTION_NOT_IBU]));
      if (!has(CLAIM.PERCEPTION_NOT_IBU) && !has(CLAIM.COLD_BITTERNESS)) return make('unresolved',
        'Les prémisses sur l’amertume manquent dans ce corpus ; la voie aromatique ne prouve aucune garde d’amertume.');
      const qualifier = intent.comparisonBasis.kind === 'qualitativeTarget'
        ? `La cible qualitative ${intentText(intent)} est conservée sans inventer une valeur actuelle à réduire.`
        : intent.comparisonBasis.kind === 'current'
          ? 'La garde se compare à la base actuelle qualifiée ; lorsqu’elle manque, mesurer ou décrire cette base avant de vérifier le résultat.'
          : 'Le critère d’amertume demeure distinct du caractère aromatique.';
      return make(intent.metric === 'analyticalBU' ? 'unresolved' : 'hypothesis',
        `${qualifier} Séparer le rôle amérisant du nouvel apport et comparer leur résultat. Le contact froid n’est pas une garantie d’amertume nulle ; BU analytique et perception restent distincts.`,
        sources([CLAIM.PERCEPTION_NOT_IBU, CLAIM.COLD_BITTERNESS]));
    }
    if (intent.property === 'acidity') {
      if (!has(CLAIM.ACIDITY_NOT_PH)) return make('unresolved',
        'La garde d’acidité est conservée, mais ses prémisses documentaires ne sont pas qualifiées dans ce corpus.');
      const metric = intent.metric === 'pH'
        ? 'Comparer le pH de la même bière avant/après si cette mesure est réellement la garde ; les hausses publiées restent propres à leurs protocoles.'
        : intent.metric === 'titratableAcidity'
          ? 'La garde concerne l’acidité titrable : les résultats publiés de pH ne la mesurent pas ; conserver une comparaison titrable distincte.'
          : intent.metric === 'sensory'
            ? 'La garde concerne la sensation acidulée : comparer cette perception séparément ; le pH publié ne la prédit pas.'
            : 'Préciser si la garde porte sur pH, acidité titrable ou sensation acidulée ; aucune équivalence n’est imposée.';
      if (kind === 'culture-investigation') return make('unresolved',
        `L’investigation biologique ne qualifie pas une conduite d’acidification ou sa préservation. Aucune conduite connue n’est présumée à partir du contexte de culture. ${metric}`,
        sources([CLAIM.ACIDITY_NOT_PH, CLAIM.CULTURE_LIMITS]));
      return make(scope === 'sampling' || scope === 'separatePortion' ? 'structuralGuard' : 'hypothesis',
        `${scope === 'sampling' || scope === 'separatePortion'
          ? 'Le projet de comparaison porte sur une portion distincte, sans proposer de changer toute la base.'
          : 'Si une conduite d’acidification est définie, la conserver dans le projet ne garantit pas l’acidité finale ; cette voie n’en présume pas la connaissance.'} ${metric}`,
        sources([CLAIM.ACIDITY_NOT_PH]));
    }
    if (intent.property === 'bioContribution') {
      if (kind !== 'culture-investigation') return make('notApplicable',
        'Cette voie étudie l’apport direct ou la matière ; elle ne requiert pas de succès biologique. La question de culture demeure examinée séparément.');
      if (!has(CLAIM.CULTURE_PATHWAY, CLAIM.CHEMISTRY_NOT_SENSORY)) return make('unresolved',
        'Les limites de culture ne constituent pas à elles seules une preuve de mécanisme aromatique positif.');
      return make('hypothesis',
        'Une piste de précurseurs et de culture est documentée dans sa portée fabricant. Sa pertinence ici exige souche, substrats, viabilité, exposition et matrice ; culture mixte ne signifie pas moyenne de souches, et thiol mesuré ne garantit pas le fruité perçu.',
        sources([CLAIM.CULTURE_PATHWAY, CLAIM.CULTURE_LIMITS, CLAIM.CHEMISTRY_NOT_SENSORY]));
    }
    if (intent.property === 'materialCharacter') {
      if (kind === 'material-characterization' && has(CLAIM.MATERIAL_CHARACTERIZATION)) return make('boundedSupport',
        'Documenter le sujet/lot, la forme et le contexte de l’observation, puis comparer son emploi à un témoin, permet de décider ce qu’il faut qualifier. Aucune analyse, identité active, stock ou charge alpha n’est créée.',
        sources([CLAIM.MATERIAL_CHARACTERIZATION]));
      if (candidateIds.length) return make('hypothesis',
        'Une matière documentée peut servir de référence de comparaison distincte de l’échantillon peu caractérisé. Elle ne lui prête ni son analyse ni son identité.',
        candidateIds.flatMap(id => candidateArgs.get(id) ? [candidateArgs.get(id)!] : []));
      return make('unresolved', 'L’échantillon reste un sujet documentaire ; son identité et son emploi ne sont pas résolus par cette voie.');
    }
    return make('unresolved', 'Cette propriété reste sans réponse qualifiée dans cette version du corpus.');
  }

  type DraftStrategy = Pick<Strategy, 'kind' | 'contribution' | 'title' | 'purpose' | 'distinctiveReason' | 'scope' | 'intervention'> & {
    claims: string[]; candidateIds?: string[]; products?: Strategy['documentaryProductRefs'];
    extraArguments?: string[];
    conditions?: Strategy['applicability']['conditions']; tradeoff: string; steps: Strategy['nextSteps'];
  };
  function strategy(draft: DraftStrategy) {
    if (!active.length) return;
    const claimIds = draft.claims.filter(id => known.has(id));
    const candidates = draft.candidateIds ?? documentedCandidates;
    const premiseArgs = unique([...sources(claimIds), ...candidates.flatMap(id => candidateArgs.get(id) ? [candidateArgs.get(id)!] : [])]);
    if (!premiseArgs.length) return;
    const rationale = argument(`strategy:${draft.kind}`, draft.contribution === 'option' ? 'adviceInference' : 'trialHypothesis',
      `${draft.purpose} ${draft.distinctiveReason}`, active.map(intent => intent.id), claimIds);
    const argIds = unique([rationale, ...premiseArgs, ...(draft.extraArguments ?? [])]);
    const conditions: Strategy['applicability']['conditions'] = structuredClone(draft.conditions ?? []);
    if (draft.scope !== 'documentation' && draft.scope !== 'futureBrew') {
      const access = input.context.access[draft.scope];
      conditions.push({ id: `access:${draft.scope}`, state: access.state === 'yes' ? 'met' : access.state === 'no' ? 'unmet' : 'unknown',
        description: access.basis, assertionIds: [...access.assertionIds], intentIds: active.map(intent => intent.id) });
    }
    for (const exclusion of input.exclusions.filter(row => row.intervention === draft.intervention)) {
      conditions.push({ id: `exclusion:${exclusion.id}`, state: exclusion.certainty === 'certain' ? 'unmet' : 'unknown',
        description: exclusion.reason, assertionIds: [], intentIds: [...exclusion.intentIds] });
    }
    if (draft.scope !== 'documentation') conditions.push({ id: 'trial-and-material-qualification', state: 'unknown',
      description: 'Matière/produit, emploi, protocole et critères de comparaison doivent être qualifiés avant une opération ; aucun dosage n’est préparé.',
      assertionIds: [], intentIds: active.map(intent => intent.id) });
    const effects = intents.map(intent => effectFor(intent, draft.kind, draft.contribution, draft.scope, claimIds, candidates, argIds));
    const row: Strategy = { id: nodeId('strategy', draft.kind), kind: draft.kind, contribution: draft.contribution,
      title: draft.title, purpose: draft.purpose, distinctiveReason: draft.distinctiveReason,
      scope: draft.scope, intervention: draft.intervention, argumentIds: unique([...argIds, ...effects.flatMap(effect => effect.argumentIds)]),
      candidateIds: [...candidates], documentaryProductRefs: structuredClone(draft.products ?? []), effects,
      tradeoffs: [{ text: draft.tradeoff, intentIds: active.map(intent => intent.id), argumentIds: argIds }],
      nextSteps: draft.steps.map(step => ({ ...step, argumentIds: unique([...argIds, ...step.argumentIds]) })),
      applicability: { status: conditions.some(row => row.state === 'unmet') ? 'incompatible'
        : conditions.some(row => row.state === 'unknown') ? 'missingConditions' : conditions.length ? 'conditionsMet' : 'notEvaluated', conditions },
      preparation: { documentaryDossier: { status: 'available', kind: draft.scope === 'documentation' ? 'choice' : draft.scope === 'futureBrew' ? 'futureStudy' : 'trialToQualify',
        label: draft.scope === 'documentation' ? 'Conserver le choix documentaire' : 'Préparer un essai à qualifier' },
        operational: { status: 'notProvided', adapterId: null,
          reason: 'Le dossier ne prépare aucune opération. Une demande courante vers un adaptateur reçu, avec ses propres contrôles, est nécessaire pour un aperçu d’application.' },
        missingRequirements: ['Matière/lot/produit et emploi exacts si une opération est ensuite demandée.',
          'Protocole et comparaison adaptés à la bière ; aucune réussite sensorielle ou biologique présumée.'],
        refusalReasons: conditions.filter(row => row.state === 'unmet').map(row => row.description) }, reference: '' };
    row.reference = strategyReference(inputReference, row); strategies.push(row);
    if (draft.contribution === 'option' || draft.kind === 'material-characterization' || draft.kind === 'culture-investigation'
      || draft.kind === 'pairing-comparison') {
      for (const effect of effects) if (effect.status === 'boundedSupport' || effect.status === 'structuralGuard'
        || effect.status === 'hypothesis' || effect.status === 'tension') substantive.add(effect.intentId);
    }
  }

  if (onlyAromaReduction && has(CLAIM.PROCESS_ROLES)) {
    strategy({ kind: 'future-character-review', contribution: 'option', title: 'Réexaminer le caractère porté par les seuls choix futurs',
      purpose: 'Comparer les matières ou les lignes futures liées au caractère à éviter ou réduire, sans proposer automatiquement un nouvel apport aromatique.',
      distinctiveReason: 'Cette voie répond à une direction de réduction ou d’exclusion ; les faits passés et le caractère déjà présent ne sont pas effacés.',
      scope: 'futureBrew', intervention: 'changeAroma', claims: [CLAIM.PROCESS_ROLES],
      tradeoff: 'Retirer ou remplacer une contribution future peut aussi retirer des caractères recherchés. Les descriptions ne prouvent pas une absence dans la bière.',
      steps: [{ kind: 'futurePlan', text: 'Identifier la contribution future à examiner et comparer les descriptions/contradictions des alternatives avant un aperçu de programme ; ne pas réattribuer un ajout réalisé.', argumentIds: [] }] });
  } else if (isAromaWanted && (canDesignAroma && has(CLAIM.PROCESS_ROLES, CLAIM.DIRECT_AROMA_TRANSFER) || documentedCandidates.length)) {
    const process = canDesignAroma && has(CLAIM.PROCESS_ROLES, CLAIM.DIRECT_AROMA_TRANSFER);
    strategy({ kind: process ? 'direct-aroma-program' : 'documented-material-reference', contribution: 'option',
      title: process ? 'Séparer le rôle aromatique du rôle amérisant' : 'Comparer les matières dont le caractère est documenté',
      purpose: process ? 'Concevoir un apport aromatique direct en gardant séparée la garde ou la cible d’amertume.'
        : 'Examiner les mentions, négations et contextes des matières demandées pour départager les candidats.',
      distinctiveReason: process ? 'Cette voie travaille la matière et son emploi sans faire du succès d’une culture une condition préalable.'
        : 'Le choix repose ici sur les descriptions exactes ; le mécanisme ou le rendement d’un emploi restent non qualifiés.',
      scope: process ? currentScope() : 'documentation', intervention: process ? 'changeAroma' : 'none',
      claims: process ? [CLAIM.PROCESS_ROLES, CLAIM.DIRECT_AROMA_TRANSFER, CLAIM.COLD_BITTERNESS] : [],
      tradeoff: 'Séparer les rôles du programme ne conserve pas automatiquement extraction, BU ou profil. Une description de matière ne garantit pas une intensité en bière.',
      steps: [{ kind: input.context.stage === 'planning' ? 'futurePlan' : 'qualify',
        text: 'Choisir la matière et le rôle de l’ajout futur, puis l’emploi compatible ; conserver les faits déjà réalisés et comparer au témoin avant de fixer une dose.', argumentIds: [] }] });
  }
  const uses = input.context.stage === 'hotSide' ? ['whirlpool'] : input.context.stage === 'fermenting' ? ['fermentation']
    : input.context.stage === 'conditioning' || input.context.stage === 'packaged' ? ['postFermentation'] : null;
  const productPaths = PROPERTY_ADVICE_PRODUCT_PATHS.filter(product => product.claimIds.every(id => known.has(id))
    && (!uses || product.uses.some(use => uses.includes(use))));
  if (canDesignAroma && productPaths.length) {
    const productClaims = unique(productPaths.flatMap(product => product.claimIds));
    const productArguments = productPaths.map(product => argument(`product:${product.id}`, 'documentaryFact',
      `${product.name} : ${product.description} ${product.qualification.join(' ')}`, aroma.map(intent => intent.id), product.claimIds));
    strategy({ kind: 'documented-aromatic-form', contribution: 'option', title: 'Comparer une forme aromatique documentée pour cet emploi',
      purpose: 'Étudier une forme commerciale dont la fonction et les emplois sont documentés, en la comparant à la voie de matière brute ou de pellet.',
      distinctiveReason: 'Le choix porte sur la forme et ses conditions fabricant, pas sur un bonus d’arôme ni une équivalence de masse supposés.',
      scope: input.context.stage === 'packaged' ? comparisonScope() : currentScope(), intervention: 'changeAroma', claims: productClaims,
      extraArguments: productArguments,
      candidateIds: [],
      products: productPaths.map(product => ({ id: `documentary:${product.id}`, name: product.name, claimIds: [...product.claimIds] })),
      conditions: [{ id: 'exact-product-use', state: 'unknown', description: 'Choisir le produit exact et l’emploi parmi les usages documentés ; les teneurs, bases et conditions ne se transfèrent pas entre formes.',
        assertionIds: [], intentIds: aroma.map(intent => intent.id) }],
      tradeoff: 'Une forme concentrée n’établit ni faible amertume, ni acidité préservée, ni harmonie. Aucune correspondance avec les fiches variétales comparées n’est supposée ; les conventions d’un emploi ne s’étendent pas à un autre.',
      steps: [{ kind: 'document', text: 'Comparer la fiche et les conditions du produit exact, puis qualifier une comparaison au même emploi. Une fiche ne crée ni matière ni stock.', argumentIds: [] }] });
  }
  if (biology.length && has(CLAIM.CULTURE_PATHWAY, CLAIM.CHEMISTRY_NOT_SENSORY)) {
    strategy({ kind: 'culture-investigation', contribution: 'investigation', title: 'Examiner si une contribution de culture est pertinente',
      purpose: 'Étudier la piste documentée de précurseurs et de culture séparément de l’apport aromatique direct.',
      distinctiveReason: 'Elle examine un mécanisme distinct, mais n’est pas comptée comme une deuxième solution aromatique déjà étayée pour cette bière.',
      scope: 'documentation', intervention: 'involveCulture', claims: [CLAIM.CULTURE_PATHWAY, CLAIM.CULTURE_LIMITS, CLAIM.CHEMISTRY_NOT_SENSORY],
      conditions: [{ id: 'culture-mechanism-not-qualified', state: 'unknown', description: 'Identités, substrats, viabilité et pertinence au procédé restent à qualifier ; le nom ou la composition mixte ne les démontre pas.',
        assertionIds: input.context.assertions.filter(row => row.dimension === 'bioInteraction').map(row => row.id), intentIds: biology.map(intent => intent.id) }],
      tradeoff: 'Le mécanisme ajoute des dépendances propres à la souche, au substrat et au procédé. La chimie mesurée ne garantit ni expression fruitée ni préférence.',
      steps: [{ kind: 'qualify', text: 'Identifier la culture et le substrat concernés, puis choisir un comparateur qui sépare contribution fermentaire, transfert direct et perception.', argumentIds: [] }] });
  }
  if (pairingIntents.length && has(CLAIM.BLEND_COMPARISON)) {
    strategy({ kind: 'pairing-comparison', contribution: 'investigation', title: 'Comparer l’accord avec le partenaire déclaré',
      purpose: 'Préparer une comparaison qui puisse retenir ou rejeter l’accord, en gardant séparés les caractères et le rôle du partenaire.',
      distinctiveReason: 'Cette investigation départage la relation entre les apports ; elle ne constitue pas une garantie d’harmonie ou un nouvel apport automatiquement prêt.',
      scope: comparisonScope(), intervention: 'changeAroma', claims: [CLAIM.BLEND_COMPARISON, CLAIM.LEXICAL_NOT_PROFILE],
      tradeoff: 'Le rapprochement de vocabulaire n’établit pas l’accord dans une bière. Préservation du partenaire, apparition du caractère et masquage éventuel sont des questions distinctes.',
      steps: [{ kind: 'compare', text: 'Choisir le témoin, les candidats et le contexte d’emploi, puis comparer le partenaire et les autres critères séparément, sans moyenne de profils ni bonus de synergie.', argumentIds: [] }] });
  }
  if (materialContext.length && has(CLAIM.MATERIAL_CHARACTERIZATION)) {
    strategy({ kind: 'material-characterization', contribution: 'characterization', title: 'Caractériser l’échantillon avant de lui confier un rôle',
      purpose: 'Conserver l’observation sur son sujet et qualifier l’identité, la forme et l’emploi de l’échantillon sans lui attribuer une analyse.',
      distinctiveReason: 'Cette démarche porte sur la matière peu caractérisée ; elle reste distincte du choix d’une autre référence documentée.',
      scope: 'documentation', intervention: 'none', claims: [CLAIM.MATERIAL_CHARACTERIZATION], candidateIds: [],
      tradeoff: 'L’odeur de matière ne donne ni alpha ni caractère final. Un rôle amérisant chiffré attend sa propre qualification ; la comparaison descriptive peut déjà avancer.',
      steps: [{ kind: 'document', text: 'Relier explicitement l’observation au lot ou à l’aliquote, noter forme et contexte, puis décider quelle comparaison modifierait réellement le choix d’emploi.', argumentIds: [] },
        { kind: 'compare', text: 'Préparer une comparaison au témoin adaptée au futur emploi ; ne pas emprunter les analyses ou l’identité d’une référence commerciale à cet échantillon.', argumentIds: [] }] });
  }
  if (balanceIntentIds.length && has(CLAIM.SWEETNESS_IS_PERCEPTION, CLAIM.PERCEPTION_NOT_IBU, DOCUMENTARY.ISO_HOPSTEINER)) {
    strategy({ kind: 'sweetness-balance', contribution: 'option', title: 'Comparer une compensation de l’équilibre gustatif',
      purpose: v3
        ? 'Comparer une modification d’amertume comme possibilité de compensation perceptive, sans la considérer choisie ni imposer une baisse de douceur.'
        : 'Étudier la modification d’amertume explicitement demandée pour une impression de douceur à réduire.',
      distinctiveReason: 'Cette voie répond à une demande de compensation, jamais au seul souhait d’un profil sucré.',
      scope: input.context.stage === 'planning' ? 'futureBrew' : input.context.stage === 'conditioning' ? currentScope() : comparisonScope(),
      intervention: 'changeBitterness', claims: [CLAIM.SWEETNESS_IS_PERCEPTION, CLAIM.PERCEPTION_NOT_IBU, DOCUMENTARY.ISO_HOPSTEINER],
      products: [{ id: 'documentary:hopsteiner-exi-30', name: 'Hopsteiner EXI — fiche documentaire d’extrait isomérisé', claimIds: [DOCUMENTARY.ISO_HOPSTEINER] }],
      conditions: [{ id: 'iso-use-and-protocol', state: 'unknown', description: 'Emploi après fermentation, identité chimique, bases/unités et protocole de dilution/précipitation à qualifier. Aucun dosage alpha/Tinseth ou essai universel au verre.',
        assertionIds: [], intentIds: balanceIntentIds }],
      tradeoff: 'Modifier l’amertume peut déplacer la préférence ou la persistance perçue ; cela ne retire aucun sucre et peut contredire une garde d’amertume.',
      steps: [{ kind: 'qualify', text: 'Distinguer l’objectif perceptif d’une analyse des sucres, vérifier le stade et qualifier le produit/protocole avant toute comparaison sur portion ou projet futur.', argumentIds: [] }] });
  }
  if (balanceIntentIds.length && has(CLAIM.SWEETNESS_IS_PERCEPTION, CLAIM.PERCEPTION_NOT_IBU) && !has(DOCUMENTARY.ISO_HOPSTEINER)) {
    strategy({ kind: 'future-sweetness-balance', contribution: 'option', title: 'Comparer l’équilibre visé d’un projet futur',
      purpose: 'Conserver l’impression rapportée et étudier un autre équilibre gustatif dans un programme futur, sans réduire le sucre ni réécrire le brassin actuel.',
      distinctiveReason: 'Les prémisses de perception restent disponibles sans la fiche du produit tardif exact ; cette voie ne dépend pas de son existence dans le corpus.',
      scope: 'futureBrew', intervention: 'changeBitterness', claims: [CLAIM.SWEETNESS_IS_PERCEPTION, CLAIM.PERCEPTION_NOT_IBU], candidateIds: [],
      tradeoff: 'Le caractère, la persistance de l’amertume et la préférence peuvent changer. La fiche du produit tardif manque : aucun produit, dosage ou geste sur le lot actuel n’est déduit de cette étude générale.',
      steps: [{ kind: 'futurePlan', text: 'Définir le caractère d’amertume à comparer et garder l’observation initiale comme référence ; qualifier ensuite matières et programme du projet futur.', argumentIds: [] },
        { kind: 'compare', text: 'Comparer équilibre perçu et préférence au témoin ; traiter les sucres mesurés comme un objet distinct si cette analyse est demandée.', argumentIds: [] }] });
  }

  const viable = strategies.filter(row => row.contribution === 'option' && row.applicability.status !== 'incompatible');
  const requested = active.filter(intent => !isAromaPreservationGuard(intent)).map(intentText).join(' ; ')
    || (active.some(isAromaPreservationGuard) ? 'la préservation des caractères déclarés' : 'ce contexte');
  const leadArgs = unique([...intents.map(intent => interpretationArgs.get(intent.id)!), ...strategies.flatMap(row => row.argumentIds)]);
  paragraph('direct', viable.length
    ? `Pour ${requested}, ${viable.length === 1 ? 'une voie documentaire reste défendable' : 'plusieurs choix distincts restent à comparer'} : ${viable.map(row => row.title).join(' ; ')}. Leur comparaison conserve chaque objectif et chaque garde ; la réussite sensorielle reste à éprouver.`
    : strategies.some(row => row.contribution === 'option')
      ? `Les contraintes ou accès fournis écartent les voies d’apport documentées pour ${requested}. Leurs motifs restent visibles ; aucune intervention de remplacement n’est supposée autorisée.`
      : `Les informations conservées pour ${requested || 'ce contexte'} ne suffisent pas à proposer une voie d’apport étayée. Les questions de caractérisation ou de mécanisme restent visibles sans devenir des solutions présumées.`, leadArgs);
  for (const row of strategies) paragraph(`strategy:${row.kind}`,
    `${row.title}. ${row.distinctiveReason} ${row.tradeoffs.map(tradeoff => tradeoff.text).join(' ')}`, row.argumentIds);
  if (input.candidatePolicy.materialIds.length) paragraph('candidate-scope',
    `${input.candidatePolicy.kind === 'discover' ? 'Recherche documentaire dans le périmètre déclaré' : 'Périmètre de candidats explicitement demandé'} : ${assessments.filter(row => row.status === 'documented').length} fiche(s) documentée(s), ${candidateMissing.length} fiche(s) absente(s) ou non qualifiée(s). Les rapprochements et tensions restent détaillés par intention ; leur présence ne vaut ni sélection utilisateur ni disponibilité.`,
    [...interpretationArgs.values(), ...candidateArgs.values()]);
  const points: HopPropertyAdviceAnswer['coverage']['points'] = intents.map((intent): HopPropertyAdviceAnswer['coverage']['points'][number] => {
    const linked = strategies.filter(row => row.effects.some(effect => effect.intentId === intent.id && effect.status !== 'notApplicable'));
    const intentArgs = unique([interpretationArgs.get(intent.id)!, ...linked.flatMap(row => row.effects.filter(effect => effect.intentId === intent.id).flatMap(effect => effect.argumentIds))]);
    if (isContext(intent)) return { intentId: intent.id, status: 'contextOnly',
      reason: 'Élément de contexte conservé avec son rôle/sujet ; sa présence n’est pas une réponse à un objectif.', argumentIds: intentArgs, strategyIds: linked.map(row => row.id) };
    const supported = substantive.has(intent.id);
    const candidateGap = intent.property === 'aroma' && candidateMissing.length > 0;
    const pairingGap = pairingIntents.some(row => row.id === intent.id) && !has(CLAIM.BLEND_COMPARISON);
    const isoGap = (decreaseSweetness.some(goal => goal.id === intent.id) || isCompensationQuestion(intent)) && !has(DOCUMENTARY.ISO_HOPSTEINER);
    const compensationGap = (compensationQuestions.get(intent.id)?.unsupportedObservationIds.length ?? 0) > 0;
    const reason = !supported ? 'Aucune partie substantielle de cette propriété n’est étayée ici ; elle reste visible et n’efface pas les autres réponses.'
      : compensationGap ? 'La comparaison documentée concerne le constat perceptif de douceur dans la bière ; les autres constats liés restent sans réponse qualifiée et ne sont pas assimilés à la douceur.'
      : isoGap ? 'L’explication d’équilibre et l’étude future restent étayées ; la voie du produit tardif exact n’a pas sa fiche dans ce corpus.'
      : pairingGap ? 'Les candidats ou emplois restent documentés ; la prémisse d’une comparaison du mélange avec le partenaire manque dans ce corpus.'
      : candidateGap ? 'Des voies sont expliquées ; certains candidats du périmètre n’ont pas leur fiche ou leurs descriptions qualifiées.'
        : 'Réponse qualitative reliée aux preuves et aux compromis ; elle ne signifie pas que la cible est atteinte ou une opération prête.';
    return { intentId: intent.id, status: !supported ? 'unresolved' : candidateGap || pairingGap || isoGap || compensationGap ? 'partial' : 'answered', reason,
      argumentIds: intentArgs, strategyIds: linked.map(row => row.id) };
  });
  for (const point of points.filter(row => row.status === 'unresolved' || row.status === 'partial')) {
    const intent = intents.find(row => row.id === point.intentId)!;
    paragraph(`remaining:${intent.id}`, `${intentText(intent)} : ${point.reason}`, point.argumentIds);
  }
  const hasSubstantive = points.some(row => row.status === 'answered' || row.status === 'partial');
  const incomplete = points.some(row => (row.status === 'unresolved' || row.status === 'partial')
    && intents.find(intent => intent.id === row.intentId)?.required);
  const common = { corpusSnapshot: evidence, inputReference,
    coverage: { status: (!hasSubstantive ? 'outOfScope' : incomplete ? 'partial' : 'answered') as HopPropertyAdviceAnswer['coverage']['status'], points },
    body, arguments: arguments_, candidateAssessments: assessments, strategies,
    limits: ['Réponse qualitative, applicabilité et préparation sont distinctes ; aucun score global d’adéquation ou réussite sensorielle garanti.',
      'Les observations, cibles, mesures et questions restent séparées ; qualificatifs et descriptions ne deviennent pas des intensités numériques.',
      'Une forme, une culture ou un mot de style ne créent ni matière active, stock, analyse, effet biologique ni permission.',
      'Une nouvelle interprétation crée une nouvelle réponse ; les archives sont relues sans génération ni migration.'], reference: '' };
  if (v3) {
    const answer: HopPropertyAdviceAnswerV3 = { ...common, format: 'hop-documentary-answer-v3',
      requestSnapshot: input as HopPropertyAdviceRequestV3, rulesVersion: V3_RULES_VERSION,
      interpretationReference: hopPropertyAdviceInterpretationReferenceV3(input as HopPropertyAdviceRequestV3) };
    answer.reference = hopPropertyAdviceAnswerReferenceV3(answer);
    assertHopPropertyAdviceAnswerV3(answer); return answer;
  }
  const answer: HopPropertyAdviceAnswer = { ...common, format: 'hop-documentary-answer-v2',
    requestSnapshot: input as HopPropertyAdviceRequest, rulesVersion: RULES_VERSION,
    interpretationReference: hopPropertyAdviceInterpretationReference(input as HopPropertyAdviceRequest) };
  answer.reference = hopPropertyAdviceAnswerReference(answer);
  assertHopPropertyAdviceAnswer(answer); return answer;
}
