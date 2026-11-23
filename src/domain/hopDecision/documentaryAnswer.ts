import { evaluateHopIntentEvidence } from './intentEvidence';
import { hopAdviceContentReference } from './adviceContentReference';
import { HOP_DOCUMENTARY_CLAIM_IDS as CLAIM, getHopDocumentaryCorpus } from './documentaryEvidence';
import {
  HOP_DOCUMENTARY_ANSWER_VERSION, assertHopDocumentaryRequest, assertHopDocumentaryCorpus, assertHopDocumentaryAnswer,
  hopDocumentaryInputReference, hopDocumentaryInterpretationReference, hopDocumentaryRouteReference, hopDocumentaryAnswerReference,
  type HopDocumentaryRequest, type HopDocumentaryCorpus, type HopDocumentaryAnswer, type HopDocumentaryArgument,
  type HopDocumentaryCondition, type HopDocumentaryRoute, type HopDocumentaryScope, type HopDocumentaryIntervention,
} from './documentaryAnswerSchema';

type Need = HopDocumentaryRequest['needs'][number];
type Point = HopDocumentaryAnswer['coverage']['points'][number];
const identity = (kind: string, ...parts: string[]) => hopAdviceContentReference('hop-documentary-node-v1', { kind, parts });
const unique = <T>(rows: T[]) => [...new Set(rows)];

/** Documentary response only. It neither computes a dose nor invokes an operational adapter. */
export function buildHopDocumentaryAnswer(request: HopDocumentaryRequest,
  corpus: HopDocumentaryCorpus = getHopDocumentaryCorpus()): HopDocumentaryAnswer {
  assertHopDocumentaryRequest(request); assertHopDocumentaryCorpus(corpus);
  const input = structuredClone(request), evidence = structuredClone(corpus);
  const arguments_: HopDocumentaryArgument[] = [], routes: HopDocumentaryRoute[] = [], body: HopDocumentaryAnswer['body'] = [];
  const points: Point[] = [];
  const evidenceGapBodyIds = new Set<string>();
  const registered = getHopDocumentaryCorpus();
  const sameEvidence = (a: unknown, b: unknown) => hopAdviceContentReference('hop-documentary-equality-v1', a)
    === hopAdviceContentReference('hop-documentary-equality-v1', b);
  // A stable ID alone does not authorize reusing its old editorial mapping with changed evidence.
  const knownClaims = new Set(evidence.claims.filter(claim => {
    const supported = registered.claims.find(row => row.id === claim.id);
    return !!supported && sameEvidence(claim, supported) && claim.sourceIds.every(sourceId => {
      const actual = evidence.sources.find(row => row.id === sourceId), expected = registered.sources.find(row => row.id === sourceId);
      return !!actual && !!expected && sameEvidence(actual, expected);
    });
  }).map(row => row.id));
  const criteriaById = new Map(input.criteria.map(row => [row.id, row]));

  function argument(need: Need, key: string, kind: HopDocumentaryArgument['kind'], text: string,
    claims: string[] = [], materialEvidence: HopDocumentaryArgument['materialEvidence'] = [], assertionIds: string[] = []) {
    const claimIds = claims.filter(id => knownClaims.has(id));
    const row: HopDocumentaryArgument = { id: identity('argument', need.id, key), kind, text,
      criterionIds: [...need.criterionIds], assertionIds, claimIds, materialEvidence: structuredClone(materialEvidence) };
    arguments_.push(row); return row.id;
  }
  function paragraph(need: Need, key: string, text: string, argumentIds: string[]) {
    body.push({ id: identity('paragraph', need.id, key), text, argumentIds });
  }
  function accessCondition(scope: HopDocumentaryScope): HopDocumentaryCondition[] {
    if (scope === 'documentation' || scope === 'futureBrew') return [];
    const access = input.context.access[scope];
    return [{ id: `access:${scope}`, state: access.state === 'yes' ? 'met' : access.state === 'no' ? 'unmet' : 'unknown',
      description: access.basis, assertionIds: [...access.assertionIds], criterionIds: [] }];
  }
  function route(need: Need, key: string, fields: {
    title: string; purpose: string; scope: HopDocumentaryScope; intervention: HopDocumentaryIntervention;
    argumentIds: string[]; conditions?: HopDocumentaryCondition[]; materialIds?: string[];
    productRefs?: HopDocumentaryRoute['documentaryProductRefs']; missing?: string[];
    dossierKind?: HopDocumentaryRoute['preparation']['documentaryDossier']['kind'];
  }) {
    const conditions = [...accessCondition(fields.scope), ...structuredClone(fields.conditions ?? [])];
    for (const exclusion of input.exclusions.filter(row => row.intervention === fields.intervention)) {
      conditions.push({ id: `exclusion:${exclusion.id}`, state: exclusion.certainty === 'certain' ? 'unmet' : 'unknown',
        description: exclusion.reason, assertionIds: [], criterionIds: [...exclusion.criterionIds] });
    }
    const status = conditions.some(row => row.state === 'unmet') ? 'incompatible'
      : conditions.some(row => row.state === 'unknown') ? 'missingConditions'
        : conditions.length ? 'conditionsMet' : 'notEvaluated';
    const row: HopDocumentaryRoute = { id: identity('route', need.id, key), needIds: [need.id], criterionIds: [...need.criterionIds],
      title: fields.title, purpose: fields.purpose, scope: fields.scope, intervention: fields.intervention,
      argumentIds: unique(fields.argumentIds), materialIds: [...(fields.materialIds ?? [])], documentaryProductRefs: structuredClone(fields.productRefs ?? []),
      applicability: { status, conditions }, preparation: {
        documentaryDossier: { status: 'available', kind: fields.dossierKind ?? (fields.scope === 'futureBrew' ? 'futureStudy' : 'trialToQualify'),
          label: fields.scope === 'documentation' ? 'Conserver un dossier de choix' : 'Préparer un dossier d’essai à qualifier' },
        operational: { status: 'notProvided', adapterId: null,
          reason: 'Cette synthèse produit un dossier documentaire. Le protocole, les quantités et toute opération exigent une qualification distincte ; aucun reçu d’exécution n’est fourni.' },
        missingRequirements: unique(fields.missing ?? ['Question d’essai, protocole et critères de comparaison à préciser.']),
        refusalReasons: conditions.filter(condition => condition.state === 'unmet').map(condition => condition.description),
      }, reference: '' };
    row.reference = hopDocumentaryRouteReference(row); routes.push(row); return row;
  }
  function scopedCriteria(need: Need) {
    return need.criterionIds.map(id => criteriaById.get(id)!).filter(Boolean);
  }
  function interpretationArguments(need: Need): string[] {
    return scopedCriteria(need).map(criterion => {
      const kind = criterion.origin === 'proposal' ? 'proposedReading' : criterion.role === 'observation' ? 'userFact' : 'userGoal';
      const lead = criterion.origin === 'proposal' ? 'Lecture proposée, à distinguer d’un fait confirmé'
        : criterion.role === 'observation' ? 'Observation rapportée, sans mesure ou origine biologique déduite'
          : criterion.role === 'pairWith' ? 'Accord demandé, sans hausse imposée du caractère partenaire'
            : criterion.role === 'preserve' ? 'Objectif de conservation' : 'Critère déclaré';
      const id = argument(need, `criterion:${criterion.id}`, kind, `${lead} : ${criterion.description}`);
      arguments_[arguments_.length - 1].criterionIds = [criterion.id];
      return id;
    });
  }
  function missingEvidence(need: Need, required: string[], baseArgs: string[], key = 'missing-source'):
    { missing: string[]; argumentId: string | null } {
    const missing = required.filter(id => !knownClaims.has(id));
    if (!missing.length) return { missing, argumentId: null };
    const id = argument(need, key, 'adviceInference',
      `Prémisses documentaires absentes ou différentes de la curation prise en charge : ${missing.join(', ')}.`);
    paragraph(need, key, 'Cette lacune concerne uniquement ces prémisses ; les autres voies ne sont conservées que si leurs propres sources et conditions le permettent.', [...baseArgs, id]);
    evidenceGapBodyIds.add(identity('paragraph', need.id, key));
    return { missing, argumentId: id };
  }
  function separateScope(): 'sampling' | 'separatePortion' {
    return input.context.access.separatePortion.state === 'yes' ? 'separatePortion'
      : input.context.access.sampling.state === 'yes' ? 'sampling'
        : input.context.stage === 'packaged' ? 'separatePortion' : 'sampling';
  }
  function inferencePoint(need: Need, argumentIds: string[], ownRoutes: HopDocumentaryRoute[],
    status: Point['status'] = 'answered', reason = 'Réponse documentaire substantielle dans le domaine déclaré ; efficacité et exécution restent distinctes.') {
    points.push({ needId: need.id, status, reason, argumentIds: unique(argumentIds), routeIds: ownRoutes.map(row => row.id) });
  }
  function exclusionSummary(need: Need, ownRoutes: HopDocumentaryRoute[], baseArgs: string[]) {
    const incompatible = ownRoutes.filter(row => row.applicability.status === 'incompatible');
    if (!incompatible.length) return;
    const reasons = unique(incompatible.flatMap(row => row.preparation.refusalReasons));
    const id = argument(need, 'known-incompatibilities', 'adviceInference',
      `Ces conditions écartent les voies concernées dans la situation fournie : ${reasons.join(' ')}`);
    const linked = input.exclusions.filter(row => ownRoutes.some(route => route.intervention === row.intervention))
      .flatMap(row => row.criterionIds);
    arguments_[arguments_.length - 1].criterionIds = unique([...need.criterionIds, ...linked]);
    paragraph(need, 'known-incompatibilities', `Les voies incompatibles sont identifiées avec leur motif : ${reasons.join(' ')}`, [...baseArgs, id]);
  }

  function sweetness(need: Need) {
    const base = interpretationArguments(need);
    const sourceGap = missingEvidence(need, [CLAIM.SWEETNESS_BALANCE, CLAIM.BITTERNESS_PERCEPTION], base, 'balance-sources-missing');
    if (sourceGap.missing.length) {
      const args = [...base, ...(sourceGap.argumentId ? [sourceGap.argumentId] : [])];
      const ownRoutes: HopDocumentaryRoute[] = [];
      const availableCore = [CLAIM.SWEETNESS_BALANCE, CLAIM.BITTERNESS_PERCEPTION].filter(id => knownClaims.has(id));
      if (availableCore.length) {
        const evidenceText = knownClaims.has(CLAIM.BITTERNESS_PERCEPTION)
          ? 'Les études présentes distinguent des dimensions de perception dans leurs domaines ; elles ne mesurent pas les sucres ni le résultat de cette bière.'
          : 'Le mapping présent conserve la sucrosité comme perception déclarée, sans la transformer en analyse des sucres ou en promesse de correction.';
        const supported = argument(need, 'balance-supported-fragment', 'adviceInference', evidenceText, availableCore);
        args.push(supported); paragraph(need, 'balance-supported-fragment', evidenceText, [supported]);
      }
      if (knownClaims.has(CLAIM.ISO_HOPSTEINER)) {
        const published = argument(need, 'iso-function-partial', 'documentaryFact',
          'La source Hopsteiner documente l’EXI comme produit iso-alpha utilisé pour corriger l’amertume après fermentation ; ce corpus ne montre pas son effet sur cette perception.', [CLAIM.ISO_HOPSTEINER]);
        const hypothesis = argument(need, 'iso-qualification-partial', 'trialHypothesis',
          'Si cette piste reste pertinente, son intérêt sensoriel devrait être éprouvé au témoin après qualification du produit et du protocole ; la fonction publiée ne prouve pas un équilibre amélioré.', [CLAIM.ISO_HOPSTEINER]);
        args.push(published, hypothesis);
        paragraph(need, 'iso-documentary-partial', 'Le dossier EXI reste consultable comme voie documentaire indépendante; il n’autorise ni dose ni ajout et ne remplace pas la prémisse sensorielle absente.', [published, hypothesis]);
        ownRoutes.push(route(need, 'iso-documentary-partial', { title: 'Conserver la voie EXI comme dossier documentaire',
          purpose: 'Examiner la fonction fabricant du produit exact sans déduire son effet sur la bière cible.', scope: 'documentation', intervention: 'none',
          argumentIds: [published, hypothesis], productRefs: [{ id: 'documentary:hopsteiner-exi-30',
            name: 'Hopsteiner EXI — dossier fabricant d’extrait isomérisé', claimIds: [CLAIM.ISO_HOPSTEINER] }], dossierKind: 'choice',
          missing: ['Pertinence pour le caractère visé et résultat sensoriel à établir.', 'Identité et conditions d’emploi ne sont pas une opération préparée.'] }));
      } else {
        const isoGap = missingEvidence(need, [CLAIM.ISO_HOPSTEINER], args, 'iso-source-missing');
        if (isoGap.argumentId) args.push(isoGap.argumentId);
      }
      exclusionSummary(need, ownRoutes, base);
      const sweetnessIntentMapped = knownClaims.has(CLAIM.SWEETNESS_BALANCE);
      const supported = sweetnessIntentMapped && ownRoutes.length > 0;
      inferencePoint(need, args, ownRoutes, supported ? 'partial' : 'unresolved',
        supported ? 'Les prémisses disponibles sont gardées séparément ; les claims manquants limitent seulement leurs propres voies.'
          : !sweetnessIntentMapped
            ? 'La source qui rattache cette intention à la sucrosité perçue manque ; les informations amertume/ISO éventuellement présentes restent des voies distinctes et ne répondent pas à ce point.'
            : 'Le cadrage de la perception reste visible ; aucune voie de réponse ne dispose de ses propres prémisses dans ce corpus.');
      return;
    }
    const principle = argument(need, 'balance', 'adviceInference',
      'Une compensation de la sucrosité perçue peut être examinée par modification de l’équilibre gustatif ; elle ne retire pas de sucre et son intérêt sensoriel doit être comparé au témoin.',
      [CLAIM.SWEETNESS_BALANCE, CLAIM.BITTERNESS_PERCEPTION]);
    const excluded = input.exclusions.some(row => row.intervention === 'changeBitterness' && row.certainty === 'certain');
    paragraph(need, 'direct', excluded
      ? 'La voie de modification de l’amertume décrite ici est écartée par la contrainte fournie. Elle ne constitue pas une correction admissible sous cette lecture ; l’observation de sucrosité demeure à conserver sans la transformer en quantité de sucre.'
      : 'La piste consiste à comparer un autre équilibre gustatif, sans promettre une réduction de sucre. Le caractère de l’amertume, sa persistance et la préférence sont aussi à comparer ; le niveau annoncé ne suffit pas à les prévoir.', [...base, principle]);
    const ownRoutes: HopDocumentaryRoute[] = [];
    const args = [...base, principle];
    let status: Point['status'] = 'answered';
    if (knownClaims.has(CLAIM.ISO_HOPSTEINER)) {
      const published = argument(need, 'iso-function', 'documentaryFact',
        'La documentation Hopsteiner EXI décrit un produit d’iso-alpha pour corriger l’amertume après fermentation, généralement avant filtration ; ce dossier ne qualifie pas encore une matière ni un dosage dans l’application.',
        [CLAIM.ISO_HOPSTEINER]);
      const trial = argument(need, 'iso-trial', 'trialHypothesis',
        'Comparer une variante au témoin peut départager l’hypothèse de meilleur équilibre. Le protocole reste à qualifier : la précipitation/dilution signalée interdit d’improviser un essai universel au verre.',
        [CLAIM.ISO_HOPSTEINER, CLAIM.BITTERNESS_PERCEPTION]);
      args.push(published, trial);
      const postFermentation: HopDocumentaryCondition = {
        id: 'published-use-after-fermentation', state: input.context.stage === 'conditioning' ? 'met' : input.context.stage === 'unknown' ? 'unknown' : 'unmet',
        description: input.context.stage === 'conditioning' ? 'Le stade déclaré est après fermentation ; les autres conditions d’emploi restent à qualifier.'
          : input.context.stage === 'unknown' ? 'Le stade n’est pas renseigné ; ne pas supposer une bière disponible après fermentation.'
            : 'L’emploi de cuve après fermentation visé ici n’est pas ouvert au stade déclaré ; ne pas reclasser le lot implicitement.',
        assertionIds: [], criterionIds: [] };
      const productRefs = [{ id: 'documentary:hopsteiner-exi-30', name: 'Hopsteiner EXI — dossier fabricant d’extrait isomérisé', claimIds: [CLAIM.ISO_HOPSTEINER] }];
      const missing = ['Identité de la matière réelle, espèces chimiques, teneurs, bases et unités à qualifier.',
        'Capacité de dosage adaptée aux iso-alpha, volume et conditions d’emploi à qualifier ; pas alpha/Tinseth.',
        'Protocole tenant compte de la dilution/précipitation publiée ; aucune dose ni manipulation déduite de cette fiche.',
        'Objectif sensoriel et comparaison au témoin permettant de rejeter l’hypothèse d’amélioration.'];
      ownRoutes.push(route(need, 'iso-bulk', { title: 'Examiner la correction d’amertume sur bière encore accessible',
        purpose: 'Étudier la fonction publiée du produit exact et ce qui doit être qualifié pour cette bière.', scope: 'bulkBeer', intervention: 'changeBitterness',
        argumentIds: [principle, published, trial], conditions: [postFermentation, { id: 'iso-operation-unqualified', state: 'unknown',
          description: 'L’identité opérationnelle, le dosage et les conditions concrètes ne sont pas qualifiés par le dossier documentaire.', assertionIds: [], criterionIds: [] }], productRefs, missing }));
      ownRoutes.push(route(need, 'iso-separate-study', { title: 'Documenter une comparaison sur portion séparée',
        purpose: 'Préparer la question et les critères d’un essai à qualifier, distinct d’un ajout au lot.', scope: separateScope(), intervention: 'changeBitterness',
        argumentIds: [principle, published, trial], productRefs, missing,
        conditions: [{ id: 'separate-protocol-unqualified', state: 'unknown', description: 'Le protocole d’essai n’est pas défini par cette synthèse, même si une portion est accessible.', assertionIds: [], criterionIds: [] }] }));
      const stageText = input.context.stage === 'conditioning'
        ? input.context.access.bulkBeer.state === 'yes'
          ? 'Après fermentation, la fonction documentée de cet extrait isomérisé fournit une voie à examiner sur la bière accessible. Le produit, le dosage et la conduite doivent encore être qualifiés.'
          : 'Après fermentation, cette piste dépend encore de l’accès réel à la bière. Sa fonction documentaire reste disponible même sans volume ou disponibilité de produit renseignés.'
        : input.context.stage === 'packaged'
          ? 'Pour le lot déjà conditionné, cette réponse ne prépare pas un ajout de cuve. Une comparaison sur portion séparée reste un dossier d’essai à qualifier ; le prochain brassin constitue une autre portée.'
          : input.context.stage === 'unknown'
            ? 'Si la bière est accessible après fermentation, examiner la voie publiée de l’extrait isomérisé. Si elle est déjà conditionnée, distinguer une portion séparée et le prochain brassin ; le stade reste à renseigner.'
            : 'Au stade fourni, distinguer les réglages encore à concevoir de l’option publiée après fermentation. Celle-ci est une voie ultérieure à qualifier, pas un ajout actuellement prêt.';
      paragraph(need, 'stage', stageText, [published, trial]);
    } else {
      status = 'partial';
      const missing = argument(need, 'iso-source-missing', 'adviceInference', 'La fonction d’un produit isomérisé exact ne peut pas être exposée : son claim est absent de ce corpus.');
      args.push(missing); paragraph(need, 'iso-source-missing', 'L’explication d’équilibre reste disponible ; la piste du produit tardif exact reste sans source dans ce corpus.', [principle, missing]);
    }
    ownRoutes.push(route(need, 'future-balance', { title: 'Comparer l’équilibre visé d’un prochain brassin',
      purpose: 'Conserver l’observation et comparer les objectifs d’amertume/caractère sans réécrire le brassin actuel.', scope: 'futureBrew', intervention: 'changeBitterness',
      argumentIds: [principle], missing: ['Objectif corrigible, recettes/produits qualifiés et comparaison sensorielle à définir.'] }));
    exclusionSummary(need, ownRoutes, base);
    inferencePoint(need, args, ownRoutes, status, status === 'partial' ? 'Équilibre expliqué ; source du produit tardif exact manquante.' : undefined);
  }

  function aromaticCandidates(need: Need, ownArgs: string[], ownRoutes: HopDocumentaryRoute[]):
    { missing: string[]; hasQualifiedCandidate: boolean } {
    const requested = need.candidateIds ?? input.materials.map(row => row.id);
    const missing = requested.filter(id => !input.materials.some(row => row.id === id));
    const unqualifiedRequested: string[] = [];
    const missingMappings: string[] = [];
    const mappedSource = (source: unknown) => evidence.sources.some(row => {
      const supported = registered.sources.find(item => item.id === row.id);
      return !!supported && sameEvidence(row, supported) && sameEvidence(row.source, source);
    });
    let documented = 0;
    for (const material of input.materials.filter(row => requested.includes(row.id))) {
      const evaluations = scopedCriteria(need).filter(row => row.role !== 'constraint').map(criterion =>
        ({ materialId: material.id, criterionId: criterion.id, evaluation: evaluateHopIntentEvidence({ criterion, candidate: material, materials: input.materials }) }));
      const relevant = evaluations.filter(row => {
        if (!row.evaluation.candidateEvidence.length) return false;
        if ([...row.evaluation.candidateEvidence, ...row.evaluation.partnerEvidence].some(item => !mappedSource(item.mappingSource))) {
          missingMappings.push(`${material.id}/${row.criterionId}`); return false;
        }
        return true;
      });
      if (!relevant.length) {
        if (need.candidateIds?.includes(material.id)) unqualifiedRequested.push(material.id);
        continue;
      }
      documented++;
      const contexts = { rawHop: 'sur houblon brut', infusion: 'en infusion', beer: 'en bière', unspecified: 'dans un contexte non précisé' };
      const mentions = unique(relevant.flatMap(row => row.evaluation.candidateEvidence.map(item => {
        const polarity = item.polarity === 'explicitNegation' ? 'négation explicite' : item.polarity === 'ambiguousMention' ? 'mention ambiguë' : 'mention';
        return `${polarity} « ${item.term} » ${contexts[item.context]}`;
      })));
      const detail = `${mentions.join(' ; ')}. ${unique(relevant.map(row => row.evaluation.consequence)).join(' ')}`;
      const arg = argument(need, `candidate:${material.id}`, 'documentaryFact',
        `Les descriptions de ${material.name} fournissent ces éléments contextualisés : ${detail}`, [], relevant);
      ownArgs.push(arg);
      paragraph(need, `candidate:${material.id}`, `${material.name} : ${detail}`, [arg]);
      ownRoutes.push(route(need, `candidate:${material.id}`, { title: `Comparer les preuves de ${material.name}`,
        purpose: 'Examiner les mentions, négations et divergences dans leurs contextes, puis la relation recherchée ; aucune intensité ni harmonie garantie.',
        scope: 'documentation', intervention: 'none', argumentIds: [arg], materialIds: [material.id], dossierKind: 'choice',
        missing: ['Comparer au partenaire et au contexte de bière pertinents avant une décision d’emploi.'] }));
    }
    if (!documented) {
      const arg = argument(need, 'candidate-evidence-missing', 'adviceInference',
        'Aucun candidat fourni ne présente ici de rapprochement documentaire qualifié avec les critères liés. Cela ne prouve ni absence de caractère ni impossibilité d’accord.');
      ownArgs.push(arg); paragraph(need, 'candidate-evidence-missing',
        'Le choix aromatique reste à éprouver ; les données fournies ne permettent pas de nommer un candidat étayé. Conserver les rôles demandés et rechercher des descriptions contextualisées avant de choisir.', [arg]);
    }
    if (missing.length) {
      const arg = argument(need, 'requested-candidates-missing', 'adviceInference', `Identités documentaires demandées mais non chargées : ${missing.join(', ')}.`);
      ownArgs.push(arg); paragraph(need, 'requested-candidates-missing',
        'Certains candidats demandés restent sans fiche dans cette entrée ; leurs identités sont conservées et aucun substitut n’est créé.', [arg]);
    }
    if (missingMappings.length) {
      const arg = argument(need, 'mapping-evidence-missing', 'adviceInference',
        `La source exacte du mapping documentaire manque dans ce corpus pour : ${unique(missingMappings).join(', ')}.`);
      ownArgs.push(arg); paragraph(need, 'mapping-evidence-missing',
        'Certains rapprochements aromatiques restent non qualifiés faute de leur source de mapping exacte ; les autres voies conservent leurs propres preuves.', [arg]);
    }
    if (unqualifiedRequested.length) {
      const arg = argument(need, 'requested-candidate-unqualified', 'adviceInference',
        `Fiches explicitement demandées sans preuve documentaire pertinente qualifiée : ${unique(unqualifiedRequested).join(', ')}.`);
      ownArgs.push(arg); paragraph(need, 'requested-candidate-unqualified',
        'La présence de ces fiches ne résout pas la comparaison explicitement demandée. Les descriptions ou leur rattachement au critère restent à qualifier.', [arg]);
    }
    return { missing: [...missing, ...missingMappings, ...unqualifiedRequested], hasQualifiedCandidate: documented > 0 };
  }
  function pairing(need: Need) {
    const base = interpretationArguments(need);
    const sourceGap = missingEvidence(need, [CLAIM.PAIRING_HYPOTHESIS, CLAIM.LEXICAL_NOT_PAIRING], base, 'pairing-sources-missing');
    if (sourceGap.missing.length) {
      const hasPairingEvidence = knownClaims.has(CLAIM.PAIRING_HYPOTHESIS);
      const hasLexicalLimit = knownClaims.has(CLAIM.LEXICAL_NOT_PAIRING);
      const args = [...base, ...(sourceGap.argumentId ? [sourceGap.argumentId] : [])];
      let rationale: string | null = null;
      if (hasPairingEvidence) {
        rationale = argument(need, 'pairing-principle-partial', 'adviceInference',
          'Les mélanges étudiés par Takoi motivent une hypothèse à comparer dans leur domaine ; ils ne démontrent pas une harmonie pour cette bière ni un bonus universel.', [CLAIM.PAIRING_HYPOTHESIS]);
        args.push(rationale); paragraph(need, 'pairing-direct-partial', 'La preuve d’interactions reste disponible même si l’autre source de limite lexicale manque ; elle soutient un essai à rejeter ou retenir, pas une promesse.', [rationale]);
      } else if (hasLexicalLimit) {
        rationale = argument(need, 'pairing-lexical-limit-only', 'adviceInference',
          'Le graphe et le mapping disponibles décrivent des associations de mots, pas la compatibilité d’un mélange ; la source d’interactions de mélange manque dans ce corpus.', [CLAIM.LEXICAL_NOT_PAIRING]);
        args.push(rationale); paragraph(need, 'pairing-lexical-limit-only', 'Les rapprochements lexicaux peuvent aider à lire les termes, mais la preuve de mélange et d’accord reste absente.', [rationale]);
      }
      const ownRoutes: HopDocumentaryRoute[] = [];
      const candidates = aromaticCandidates(need, args, ownRoutes);
      if (hasPairingEvidence && rationale) {
        const trial = argument(need, 'pairing-trial-partial', 'trialHypothesis',
          'Comparer au témoin peut départager le mélange dans son contexte ; ni harmonie ni gain ne sont déduits du seul article.', [CLAIM.PAIRING_HYPOTHESIS]);
        args.push(trial);
        ownRoutes.push(route(need, 'pairing-comparison-partial', { title: 'Préparer une comparaison de l’accord comme hypothèse',
          purpose: 'Définir une comparaison locale qui puisse rejeter l’hypothèse, sans transformer l’étude en promesse.',
          scope: input.context.stage === 'planning' ? 'futureBrew' : separateScope(), intervention: 'changeAroma',
          argumentIds: [rationale, trial], missing: ['Matières, contexte de bière et protocole sensoriel à qualifier; aucun mélange ni dosage n’est calculé.'] }));
      }
      const cultureIsRelevant = input.context.assertions.some(row => row.dimension === 'bioInteraction' && (row.state !== 'unknown' || row.value !== null));
      if (cultureIsRelevant) {
        const gap = missingEvidence(need, [CLAIM.CHEMISTRY_NOT_SENSORY, CLAIM.CULTURE_CONTEXT], args, 'pairing-culture-sources-missing');
        if (gap.argumentId) args.push(gap.argumentId);
      }
      if (cultureIsRelevant && knownClaims.has(CLAIM.CHEMISTRY_NOT_SENSORY) && knownClaims.has(CLAIM.CULTURE_CONTEXT)) {
        const culture = argument(need, 'culture-context', 'adviceInference',
          'Le contexte biologique rapporté mérite une comparaison séparée : activité enzymatique, libération chimique et expression fruitée ne sont pas interchangeables. Le bénéfice de la culture proposée pour cet accord reste à qualifier.',
          [CLAIM.CHEMISTRY_NOT_SENSORY, CLAIM.CULTURE_CONTEXT], [], input.context.assertions.filter(row => row.dimension === 'bioInteraction').map(row => row.id));
        args.push(culture);
        ownRoutes.push(route(need, 'culture-study', { title: 'Qualifier la contribution de la culture à l’accord',
          purpose: 'Relier culture, précurseurs et matrice à une hypothèse, sans changer le rôle du partenaire ni rendre cette voie obligatoire.',
          scope: 'documentation', intervention: 'involveCulture', argumentIds: [culture], dossierKind: 'choice',
          conditions: [{ id: 'culture-mechanism-unqualified', state: 'unknown', description: 'La culture rapportée n’établit pas une activité ni un bénéfice sensoriel dans cette bière.',
            assertionIds: input.context.assertions.filter(row => row.dimension === 'bioInteraction').map(row => row.id), criterionIds: [] }],
          missing: ['Identité de culture/souche, substrats, viabilité et conditions réellement pertinentes à qualifier.'] }));
      }
      exclusionSummary(need, ownRoutes, base);
      const supported = hasPairingEvidence || candidates.hasQualifiedCandidate;
      inferencePoint(need, args, ownRoutes, supported ? 'partial' : 'unresolved', supported
        ? 'Les prémisses manquantes restent locales ; les descriptions ou études présentes ne sont conservées que pour leurs propres portées.'
        : 'Aucune prémisse disponible ne permet de répondre à ce point du choix.');
      return;
    }
    const rationale = argument(need, 'pairing-principle', 'adviceInference',
      'Chercher un accord consiste à confronter les caractères souhaités au partenaire et au contexte, sans imposer d’augmenter les deux. Les descriptions peuvent motiver des candidats ; elles ne valident pas l’harmonie.',
      [CLAIM.PAIRING_HYPOTHESIS, CLAIM.LEXICAL_NOT_PAIRING]);
    paragraph(need, 'direct', 'Une voie défendable est de conserver le rôle demandé du caractère partenaire et de comparer des apports aromatiques documentés. Le transfert direct constitue une piste autonome ; la biotransformation n’est pas une condition préalable à cet accord.', [...base, rationale]);
    const args = [...base, rationale], ownRoutes: HopDocumentaryRoute[] = [];
    const { missing } = aromaticCandidates(need, args, ownRoutes);
    const trial = argument(need, 'pairing-trial', 'trialHypothesis',
      'Une comparaison au témoin peut départager préservation du partenaire, apparition du caractère recherché et masquage éventuel, sans moyenne de profils ni bonus numérique de synergie.',
      [CLAIM.PAIRING_HYPOTHESIS]); args.push(trial);
    ownRoutes.push(route(need, 'pairing-comparison', { title: 'Préparer la comparaison de l’accord recherché',
      purpose: 'Définir ce qui ferait retenir ou rejeter l’accord, en gardant la provenance du caractère partenaire.',
      scope: input.context.stage === 'planning' ? 'futureBrew' : separateScope(), intervention: 'changeAroma', argumentIds: [rationale, trial],
      missing: ['Matières/emploi et protocole de comparaison à qualifier ; aucun mélange ou dosage déduit de la co-occurrence.'] }));
    const cultureIsRelevant = input.context.assertions.some(row => row.dimension === 'bioInteraction' && (row.state !== 'unknown' || row.value !== null));
    if (cultureIsRelevant && knownClaims.has(CLAIM.CHEMISTRY_NOT_SENSORY) && knownClaims.has(CLAIM.CULTURE_CONTEXT)) {
      const culture = argument(need, 'culture-context', 'adviceInference',
        'Le contexte biologique rapporté mérite une comparaison séparée : activité enzymatique, libération chimique et expression fruitée ne sont pas interchangeables. Le bénéfice de la culture proposée pour cet accord reste à qualifier.',
        [CLAIM.CHEMISTRY_NOT_SENSORY, CLAIM.CULTURE_CONTEXT], [], input.context.assertions.filter(row => row.dimension === 'bioInteraction').map(row => row.id));
      args.push(culture);
      ownRoutes.push(route(need, 'culture-study', { title: 'Qualifier la contribution de la culture à l’accord',
        purpose: 'Relier culture, précurseurs et matrice à une hypothèse, sans changer le rôle du partenaire ni rendre cette voie obligatoire.',
        scope: 'documentation', intervention: 'involveCulture', argumentIds: [culture], dossierKind: 'choice',
        conditions: [{ id: 'culture-mechanism-unqualified', state: 'unknown', description: 'La culture rapportée n’établit pas une activité ni un bénéfice sensoriel dans cette bière.',
          assertionIds: input.context.assertions.filter(row => row.dimension === 'bioInteraction').map(row => row.id), criterionIds: [] }],
        missing: ['Identité de culture/souche, substrats, viabilité et conditions réellement pertinentes à qualifier.'] }));
    }
    exclusionSummary(need, ownRoutes, base);
    inferencePoint(need, args, ownRoutes, missing.length ? 'partial' : 'answered', missing.length
      ? 'Accord expliqué ; certains candidats ou leurs sources exactes de mapping manquent.' : undefined);
  }
  function lowAlcohol(need: Need) {
    const base = interpretationArguments(need);
    const sourceGap = missingEvidence(need, [CLAIM.NOLO_DIRECT_TRANSFER, CLAIM.LF_NOLO_IDENTITY], base, 'low-alcohol-sources-missing');
    if (sourceGap.missing.length) {
      const args = [...base, ...(sourceGap.argumentId ? [sourceGap.argumentId] : [])];
      const ownRoutes: HopDocumentaryRoute[] = [];
      if (knownClaims.has(CLAIM.NOLO_DIRECT_TRANSFER)) {
        const transfer = argument(need, 'direct-transfer-partial', 'documentaryFact',
          'Brendel documente un transfert/rétention dépendant de la matrice et du composé dans une bière sans alcool étudiée ; ce résultat n’établit pas la libération de thiols par levure.', [CLAIM.NOLO_DIRECT_TRANSFER]);
        const transferTrial = argument(need, 'direct-transfer-trial-partial', 'trialHypothesis',
          'Comparer le transfert dans la matrice visée demanderait de qualifier produit, matrice et analytes; aucun délai ni rendement n’est transféré.', [CLAIM.NOLO_DIRECT_TRANSFER]);
        args.push(transfer, transferTrial);
        paragraph(need, 'direct-transfer-partial', 'La preuve de transfert dans cette matrice reste exploitable indépendamment du retour de brasseur manquant; elle ne prédit ni biotransformation ni fruité final.', [transfer, transferTrial]);
        ownRoutes.push(route(need, 'direct-transfer-partial', { title: 'Comparer le transfert direct dans la matrice visée',
          purpose: 'Conserver une voie de transfert/rétention séparée d’une explication par levure.',
          scope: input.context.stage === 'planning' || input.context.stage === 'hotSide' ? 'futureBrew' : separateScope(),
          intervention: 'changeAroma', argumentIds: [transfer, transferTrial],
          missing: ['Matrice/procédé, produit, analytes et protocole de comparaison à qualifier; aucun calendrier universel.'] }));
      }
      if (knownClaims.has(CLAIM.LF_NOLO_IDENTITY)) {
        const interview = argument(need, 'brewer-interview-reference', 'documentaryFact',
          'LF23-18 rapporte une démarche de comparaison à l’identité visée pour Proper Job 0,5 % ; l’entretien n’est ni une recette complète ni une preuve de transfert dans cette bière.', [CLAIM.LF_NOLO_IDENTITY]);
        args.push(interview);
        paragraph(need, 'brewer-interview-reference', 'Le retour de brasseuse reste un repère documentaire indépendant de l’étude de transfert; il ne fournit pas une voie d’apport mesurée pour le lot actuel.', [interview]);
        ownRoutes.push(route(need, 'brewer-interview-reference', { title: 'Conserver le retour d’expérience comme référence documentaire',
          purpose: 'Comparer l’identité recherchée à un exemple d’ajustement qualitatif sans en faire un preset.',
          scope: 'documentation', intervention: 'none', argumentIds: [interview], dossierKind: 'choice',
          missing: ['Référence sensorielle de l’utilisateur et comparaison dans sa propre matrice.'] }));
      }
      const candidates = aromaticCandidates(need, args, ownRoutes);
      const bioContextReported = input.context.assertions.some(row => row.dimension === 'bioInteraction');
      if (bioContextReported) {
        const gap = missingEvidence(need, [CLAIM.LF_PRECURSORS, CLAIM.CHEMISTRY_NOT_SENSORY], args, 'low-alcohol-bio-sources-missing');
        if (gap.argumentId) args.push(gap.argumentId);
      }
      if (knownClaims.has(CLAIM.LF_PRECURSORS) && knownClaims.has(CLAIM.CHEMISTRY_NOT_SENSORY)) {
        const bio = argument(need, 'precursor-hypothesis', 'trialHypothesis',
          'La voie précurseurs–levure décrite par le fabricant est une hypothèse distincte : il faut relier produit/souche, précurseurs et procédé. Elle ne prouve ni activité de LoNa ni intensité tropicale de la bière cible.',
          [CLAIM.LF_PRECURSORS, CLAIM.CHEMISTRY_NOT_SENSORY]);
        args.push(bio);
        paragraph(need, 'bio', 'Une voie biologique peut être examinée séparément. Sa qualification manquante ne retire pas le transfert direct ; un claim d’enzyme ou de thiols ne prédit pas le fruité perçu.', [bio]);
        ownRoutes.push(route(need, 'precursor-study', { title: 'Documenter une hypothèse de contribution de la culture',
          purpose: 'Relier les claims de précurseurs au produit et à la matrice réellement envisagés, sans bénéfice aromatique présumé.',
          scope: 'documentation', intervention: 'involveCulture', argumentIds: [bio], dossierKind: 'choice',
          conditions: [{ id: 'precursor-culture-unqualified', state: 'unknown', description: 'Souche, substrat, viabilité et transfert au procédé ne sont pas établis par le claim général.',
            assertionIds: input.context.assertions.filter(row => row.dimension === 'bioInteraction').map(row => row.id), criterionIds: [] }],
          missing: ['Identités et preuves propres à la souche/au substrat/procédé, plutôt qu’un coefficient issu du nom du produit.'] }));
      }
      if (input.context.stage === 'conditioning' && knownClaims.has(CLAIM.HOP_CREEP)) {
        const late = argument(need, 'late-contact-qualification', 'adviceInference',
          'Si un houblonnage sec après fermentation est envisagé, distinguer potentiel enzymatique, sucres accessibles et levure viable ; la mention « fermentation terminée » ne prédit ni reprise ni alcool futur.',
          [CLAIM.HOP_CREEP]);
        args.push(late); paragraph(need, 'late-contact-qualification',
          'L’étude hop-creep reste un contexte de risque séparé; elle ne remplace ni le transfert direct ni l’identité de la culture.', [late]);
      }
      exclusionSummary(need, ownRoutes, base);
      const hasSupportingPath = candidates.hasQualifiedCandidate || knownClaims.has(CLAIM.NOLO_DIRECT_TRANSFER)
        || knownClaims.has(CLAIM.LF_NOLO_IDENTITY)
        || (knownClaims.has(CLAIM.LF_PRECURSORS) && knownClaims.has(CLAIM.CHEMISTRY_NOT_SENSORY));
      inferencePoint(need, args, ownRoutes, hasSupportingPath ? 'partial' : 'unresolved', hasSupportingPath
        ? candidates.missing.length
          ? 'Les voies étayées restent examinées ; certaines sources ou preuves propres aux candidats demandés manquent.'
          : 'Les voies disposant de leurs propres prémisses restent examinées ; la source absente limite seulement le retour ou le mécanisme concerné.'
        : 'Aucune prémisse documentaire disponible ne permet de répondre à ce point dans cette version du corpus.');
      return;
    }
    const direct = argument(need, 'low-alcohol-direct', 'adviceInference',
      'Un objectif de faible alcool peut être travaillé avec une identité aromatique choisie et des comparaisons de transfert dans la matrice correspondante. Le retour de brasseur documenté illustre une démarche d’ajustement ; il ne fournit pas un preset.',
      [CLAIM.NOLO_DIRECT_TRANSFER, CLAIM.LF_NOLO_IDENTITY]);
    paragraph(need, 'direct', 'Pour l’objectif de faible alcool, travailler le caractère recherché et le transfert dans la matrice prévue permet d’avancer. Cette lecture n’ajoute ni cible basse d’amertume ni arôme particulier, et ne transforme pas l’objectif d’alcool en mesure actuelle.', [...base, direct]);
    const args = [...base, direct], ownRoutes: HopDocumentaryRoute[] = [];
    const { missing } = aromaticCandidates(need, args, ownRoutes);
    ownRoutes.push(route(need, 'direct-transfer', { title: 'Comparer l’apport aromatique direct dans la matrice visée',
      purpose: 'Examiner les descriptions et un transfert/rétention contextualisés, indépendamment d’une hypothèse de biotransformation.',
      scope: input.context.stage === 'planning' || input.context.stage === 'hotSide' ? 'futureBrew' : separateScope(),
      intervention: 'changeAroma', argumentIds: [direct],
      missing: ['Matrice/procédé, matière, emploi et protocole de comparaison à qualifier ; aucun délai ni rendement universel.'] }));
    let partial = missing.length > 0;
    if (knownClaims.has(CLAIM.LF_PRECURSORS) && knownClaims.has(CLAIM.CHEMISTRY_NOT_SENSORY)) {
      const bio = argument(need, 'precursor-hypothesis', 'trialHypothesis',
        'La voie précurseurs–levure décrite par le fabricant est une hypothèse distincte : il faut relier produit/souche, précurseurs et procédé. Elle ne prouve ni activité de LoNa ni intensité tropicale de la bière cible.',
        [CLAIM.LF_PRECURSORS, CLAIM.CHEMISTRY_NOT_SENSORY]); args.push(bio);
      paragraph(need, 'bio', 'Une voie biologique peut être examinée séparément. Sa qualification manquante ne retire pas la voie de transfert direct ; une revendication d’enzyme ou de thiols ne prédit pas le fruité perçu.', [bio, direct]);
      ownRoutes.push(route(need, 'precursor-study', { title: 'Documenter une hypothèse de contribution de la culture',
        purpose: 'Relier les claims de précurseurs au produit et à la matrice réellement envisagés, sans bénéfice aromatique présumé.',
        scope: 'documentation', intervention: 'involveCulture', argumentIds: [bio], dossierKind: 'choice',
        conditions: [{ id: 'precursor-culture-unqualified', state: 'unknown', description: 'Souche, substrat, viabilité et transfert au procédé ne sont pas établis par le claim général.',
          assertionIds: input.context.assertions.filter(row => row.dimension === 'bioInteraction').map(row => row.id), criterionIds: [] }],
        missing: ['Identités et preuves propres à la souche/au substrat/procédé, plutôt qu’un coefficient issu du nom du produit.'] }));
    } else {
      partial = true;
      const missingBio = argument(need, 'bio-source-missing', 'adviceInference', 'La piste biologique n’est pas documentée dans ce corpus ; la voie directe garde ses propres prémisses.');
      args.push(missingBio); paragraph(need, 'bio-source-missing', 'La voie directe reste examinable. La piste biologique demeure sans source suffisante dans le corpus transmis.', [direct, missingBio]);
    }
    if (input.context.stage === 'conditioning' && knownClaims.has(CLAIM.HOP_CREEP)) {
      const late = argument(need, 'late-contact-qualification', 'adviceInference',
        'Si le projet comprend un contact de houblon sec après fermentation, distinguer le potentiel enzymatique du houblon de l’utilisation des sucres libérés par une levure viable ; ni alcool futur ni stabilité ne sont établis par la mention « fermentation terminée ».',
        [CLAIM.HOP_CREEP]);
      args.push(late); paragraph(need, 'late-contact-qualification',
        'Pour une éventuelle voie de houblonnage à cru après fermentation, l’objectif d’alcool demande aussi de qualifier ce contact et la viabilité : le constat « terminé » ne suffit pas à prédire leur effet.', [late]);
    }
    exclusionSummary(need, ownRoutes, base);
    inferencePoint(need, args, ownRoutes, partial ? 'partial' : 'answered', partial
      ? 'Voies disponibles expliquées ; candidats demandés ou source de la piste biologique manquants.' : undefined);
  }

  for (const need of input.needs) {
    const bodyStart = body.length;
    if (need.kind === 'balancePerceivedSweetness') sweetness(need);
    else if (need.kind === 'aromaPairing') pairing(need);
    else if (need.kind === 'lowAlcoholCharacter') lowAlcohol(need);
    else {
      const args = interpretationArguments(need);
      const unresolved = argument(need, 'unresolved', 'proposedReading', `La propriété à traiter n’est pas qualifiée dans cette lecture : ${need.explanation}`);
      paragraph(need, 'unresolved', 'Ce point de la question reste hors du périmètre interprété ; aucune propriété n’est déduite du nom de la bière, du style ou d’une matière.', [...args, unresolved]);
      points.push({ needId: need.id, status: 'unresolved', reason: need.explanation, argumentIds: [...args, unresolved], routeIds: [] });
    }
    const needBody = body.splice(bodyStart);
    body.push(...needBody.filter(row => !evidenceGapBodyIds.has(row.id)), ...needBody.filter(row => evidenceGapBodyIds.has(row.id)));
  }
  const coveredCriteria = new Set([...input.needs.flatMap(row => row.criterionIds.filter(id => criteriaById.get(id)?.role !== 'constraint')),
    ...routes.flatMap(row => row.applicability.conditions.flatMap(condition => condition.criterionIds))]);
  const unresolvedCriteria = input.criteria.filter(row => !coveredCriteria.has(row.id)).map(row => ({ criterionId: row.id,
    reason: row.role === 'constraint'
      ? 'Contrainte conservée sans prédicat ou qualification structurée applicable ; son simple lien au besoin ne constitue pas un traitement.'
      : 'Critère conservé mais non relié à un besoin documentaire ou à une incompatibilité structurée ; il n’est pas considéré traité.' }));
  const unresolvedIds = new Set(unresolvedCriteria.map(row => row.criterionId));
  for (const point of points) {
    const need = input.needs.find(row => row.id === point.needId)!;
    const missing = need.criterionIds.filter(id => unresolvedIds.has(id));
    if (missing.length && point.status === 'answered') {
      point.status = 'partial'; point.reason = `Réponse documentaire disponible, critères restant non qualifiés : ${missing.join(', ')}.`;
    }
  }
  const substantive = points.some(row => row.status === 'answered' || row.status === 'partial');
  const status = !substantive ? 'outOfScope' : unresolvedCriteria.length || points.some(row => row.status !== 'answered') ? 'partial' : 'answered';
  const answer: HopDocumentaryAnswer = { format: HOP_DOCUMENTARY_ANSWER_VERSION, requestSnapshot: input, corpusSnapshot: evidence,
    inputReference: hopDocumentaryInputReference(input, evidence), interpretationReference: hopDocumentaryInterpretationReference(input),
    coverage: { status, domain: 'Conseil documentaire conditionnel sur les propriétés et les candidats explicitement fournis ; aucune couverture de famille entière revendiquée.', points, unresolvedCriteria },
    body, arguments: arguments_, routes,
    limits: ['La couverture de réponse, l’applicabilité des voies et leur préparation sont trois statuts distincts.',
      'Les sources conservent nature, niveau de lecture et conditions de transfert ; aucune efficacité sensorielle garantie.',
      'Aucun dosage, cible ajoutée, disponibilité, reçu de programme, réservation ou mesure ne provient de cette synthèse.',
      'Le corpus et l’interprétation sont figés avec la réponse ; une correction produit un nouveau résultat.'], reference: '' };
  answer.reference = hopDocumentaryAnswerReference(answer);
  assertHopDocumentaryAnswer(answer); return answer;
}
