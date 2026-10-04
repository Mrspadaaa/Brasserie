import React, { useEffect, useMemo, useRef, useState, useId, type ReactNode } from 'react';
import type { HopDescription, HopSource } from '../../../functions/src/hopIndexSchema';
import type { HopDecisionMaterial } from '../../domain/hopDecision/types';
import type { HopAdviceAssertion } from '../../domain/hopDecision/adviceSchema';
import type { HopIntentEvidenceStatus } from '../../domain/hopDecision/intentEvidence';
import type {
  HopPropertyAdviceAnswer,
  HopPropertyAdviceAnswerViewModel,
  HopPropertyAdviceCandidatePolicy,
  HopPropertyAdviceDossier,
  HopPropertyAdviceIntentV3,
  HopPropertyAdviceRequest,
  HopPropertyAdviceStrategy,
} from '../../domain/hopDecision/propertyAdviceSchema';
import { Input, Textarea } from '../Input';
import './property-advice-decision.css';

/*
 * Noyau PRIVÉ partagé par HopV55PropertyAdviceDecision (V2) et HopV55PropertyAdviceDecisionV3.
 * Les façades fixent les DTO exacts (answer, request, dossier, view) et la projection de vue;
 * ce noyau ne reconstruit aucun conseil, n’appelle aucun builder et ne convertit jamais une V3 en V2.
 * Les types « Core* » ci-dessous sont des vues structurelles auxquelles V2 et V3 sont assignables.
 */
export type CoreIntent = HopPropertyAdviceIntentV3;
export interface CoreRequest extends Omit<HopPropertyAdviceRequest, 'format' | 'propertyIntents'> { format: string; propertyIntents: CoreIntent[] }
export interface CoreAnswer extends Omit<HopPropertyAdviceAnswer, 'format' | 'requestSnapshot'> { format: string; requestSnapshot: CoreRequest }
export interface CoreView extends Omit<HopPropertyAdviceAnswerViewModel, 'format' | 'requestSnapshot'> { format: string; requestSnapshot: CoreRequest }
export interface CoreDossier extends Omit<HopPropertyAdviceDossier, 'format' | 'answerSnapshot'> { format: string; answerSnapshot: CoreAnswer }

type Strategy = HopPropertyAdviceStrategy;
type AccessKey = keyof CoreRequest['context']['access'];
type AccessValue = CoreRequest['context']['access'][AccessKey];

export type CoreAnswerUpdate<A> =
  | { kind: 'revision'; answer: A; answerRecordReference: string }
  | { kind: 'reexamination'; answer: A; answerRecordReference: string;
      source: { answerRecordReference: string; answerReference: string; interpretationReference: string; requestId: string } };

export interface CoreReinterpretRequest<R> {
  request: R;
  expectedAnswerRecordReference: string;
  expectedAnswerReference: string;
  expectedInterpretationReference: string;
  reason: string;
}

export interface CoreDossierSaveRequest {
  commandId: string;
  expectedAnswerRecordReference: string;
  expectedAnswerReference: string;
  expectedInterpretationReference: string;
  strategyId: string;
  expectedStrategyReference: string;
  motive: string;
}

export interface CoreHistoryEntry<A> { answer: A; answerRecordReference: string }

/** Ce que le noyau transmet à l’éditeur de la façade; les intentions gardent le type exact du request R. */
export interface CoreEditorBridge<R extends CoreRequest> {
  request: R;
  materialChoices: readonly HopDecisionMaterial[];
  onSearchMaterials?(query: string, exactScopeIds: readonly string[]): Promise<HopDecisionMaterial[]>;
  onSelectMaterials?(ids: string[]): Promise<HopDecisionMaterial[]>;
  onChangeIntent(intentId: string, replacement: R['propertyIntents'][number]): void;
  onAddIntent(intent: R['propertyIntents'][number]): void;
  onChangeCandidatePolicy(policy: HopPropertyAdviceCandidatePolicy): void;
  onChangeMaterials(materials: HopDecisionMaterial[]): void;
  onChangeAccess(scope: AccessKey, value: AccessValue): void;
  onChangeAssertions(assertions: HopAdviceAssertion[]): void;
  disabled: boolean;
}

export interface DecisionCoreAdapter<A extends CoreAnswer, R extends CoreRequest> {
  versionLabel: string;
  interpretationVersion: CoreRequest['interpretation']['version'];
  /** Projection pure et vérifiée de la version exacte (lève si le format n’est pas le bon). */
  viewModel(answer: A): CoreView;
  /** Copie exacte du requestSnapshot de la même version, base de la correction. */
  requestOf(answer: A): R;
  /** Points bloquants propres à la version (ex. garde V3); aucun n’est corrigé en douce. */
  validateDraft?(request: R): string[];
  renderEditor(bridge: CoreEditorBridge<R>): ReactNode;
}

export interface DecisionCoreProps<A extends CoreAnswer, R extends CoreRequest, D extends CoreDossier> {
  adapter: DecisionCoreAdapter<A, R>;
  answer: A;
  answerRecordReference: string;
  dossiers?: readonly D[];
  previousAnswers?: readonly CoreHistoryEntry<A>[];
  readOnly?: boolean;
  materialChoices?: readonly HopDecisionMaterial[];
  onSearchMaterials?(query: string, exactScopeIds: readonly string[]): Promise<HopDecisionMaterial[]>;
  onSelectMaterials?(ids: string[]): Promise<HopDecisionMaterial[]>;
  onReinterpret?(input: CoreReinterpretRequest<R>): Promise<CoreAnswerUpdate<A>>;
  onSaveDossier?(input: CoreDossierSaveRequest): Promise<D>;
  /** Parent context linked to the exact entry displayed, including a historical snapshot. */
  renderContextNotice?(entry: CoreHistoryEntry<A>, canCorrect: boolean, openCorrection: () => void): ReactNode;
}

/* Libellés et cartes de preuve exportés pour la façade V4 (réemploi seul; rendu V2/V3 inchangé). */
export const propertyLabels = {
  aroma: 'Arôme', bitterness: 'Amertume', sweetness: 'Sucrosité', acidity: 'Acidité',
  bioContribution: 'Contribution de culture', materialCharacter: 'Caractère de matière', unresolved: 'Propriété à qualifier',
} satisfies Record<CoreIntent['property'], string>;
export const roleLabels = {
  target: 'Cible qualitative', reportedObservation: 'Observation rapportée', measurement: 'Mesure déclarée',
  investigation: 'Question à examiner', preference: 'Préférence', constraint: 'Garde déclarée',
} satisfies Record<CoreIntent['role'], string>;
export const directionLabels = {
  increase: 'Augmenter', decrease: 'Réduire', keep: 'Préserver', exclude: 'Écarter', investigate: 'Examiner',
} satisfies Record<Exclude<CoreIntent['direction'], null>, string>;
const metricLabels = { sensory: 'Perception sensorielle', pH: 'pH', titratableAcidity: 'Acidité titrable',
  analyticalBU: 'BU analytique', unspecified: 'Métrique non précisée' } as const;
const subjectKindLabels = { beer: 'Bière', material: 'Matière', culture: 'Culture', process: 'Procédé', unspecified: 'Sujet non précisé' } as const;
const sensoryContextLabels = { rawHop: 'Houblon brut', infusion: 'Infusion', beer: 'Bière', unspecified: 'Contexte non précisé' } as const;
export const contributionLabels = { option: 'Option documentaire', investigation: 'Investigation', characterization: 'Caractérisation' } as const;
export const scopeLabels = { bulkBeer: 'Lot de bière', sampling: 'Prélèvement', separatePortion: 'Portion séparée',
  futureBrew: 'Brassage futur', documentation: 'Documentation' } as const;
export const interventionLabels = { none: 'Aucune intervention définie', changeBitterness: 'Modifier l’amertume',
  changeAroma: 'Modifier l’arôme', involveCulture: 'Impliquer une culture' } as const;
export const applicabilityLabels = { conditionsMet: 'Conditions déclarées satisfaites', missingConditions: 'Conditions à qualifier',
  incompatible: 'Voie incompatible avec une contrainte', notEvaluated: 'Applicabilité non évaluée' } as const;
export const preparationLabels = { choice: 'Dossier de choix', trialToQualify: 'Dossier d’essai à qualifier', futureStudy: 'Étude future' } as const;
export const coverageStatusLabels = { answered: 'Réponse dans le domaine documenté', partial: 'Réponse partielle · lacunes nommées', outOfScope: 'Aucune réponse substantielle dans cette portée' } as const;
export const pointStatusLabels = { answered: 'Examiné', partial: 'Partiellement examiné', unresolved: 'À qualifier', contextOnly: 'Contexte conservé' } as const;
export const effectStatusLabels = { boundedSupport: 'Appui documentaire borné', tension: 'Tension documentaire', structuralGuard: 'Garde de structure',
  hypothesis: 'Hypothèse à qualifier', unresolved: 'Non résolu', notApplicable: 'Ne s’applique pas' } as const;
const evaluationStatusLabels: Record<HopIntentEvidenceStatus, string> = {
  documentedSupport: 'Appui documentaire', documentedTension: 'Tension documentaire', documentedAgainst: 'Élément allant à l’encontre',
  documentedOverlap: 'Recouvrement documentaire', candidateOnly: 'Mention du candidat seulement', partnerOnly: 'Mention du partenaire seulement',
  observationToPreserve: 'Observation à préserver', notDocumented: 'Non documenté', unknown: 'Inconnu', ambiguous: 'Ambigu', notApplicable: 'Non applicable',
};
export const argumentKindLabels = {
  userTarget: 'Cible de l’utilisateur', userQuestion: 'Question de l’utilisateur', userObservation: 'Observation rapportée',
  userMeasurement: 'Mesure déclarée', userPreference: 'Préférence déclarée', userConstraint: 'Garde déclarée',
  proposedReading: 'Lecture proposée', documentaryFact: 'Fait documentaire', adviceInference: 'Inférence conditionnelle', trialHypothesis: 'Hypothèse d’essai',
} satisfies Record<CoreAnswer['arguments'][number]['kind'], string>;
export const claimRoleLabels = { support: 'Appui', limit: 'Limite', context: 'Contexte' } as const;
const sourceNatureLabels = { manufacturerClaim: 'Déclaration fabricant', research: 'Recherche', brewerInterview: 'Entretien de brasseur', editorialMapping: 'Correspondance éditoriale' } as const;
const sourceKindLabels = { coa: 'Certificat d’analyse', manufacturer: 'Fabricant', research: 'Recherche', review: 'Revue',
  observation: 'Observation', community: 'Communauté de brasseurs', judgment: 'Déclaration ou jugement' } as const;
const readingLevelLabels = {
  primaryFullText: 'Texte intégral de source primaire', primaryAbstract: 'Résumé de source primaire', primaryExcerpt: 'Extrait de source primaire',
  secondary: 'Source secondaire', dossierSummary: 'Résumé de dossier', providedMaterialSource: 'Source fournie', curatedMapping: 'Correspondance éditoriale',
} as const;
export const conditionStateLabels = { met: 'Déclarée satisfaite', unmet: 'Déclarée incompatible', unknown: 'Inconnue' } as const;
export const stageLabels = { unknown: 'Inconnu ou non établi', planning: 'Planification', hotSide: 'Brassage chaud', fermenting: 'Fermentation',
  conditioning: 'Conditionnement', packaged: 'Bière conditionnée' } as const;
const accessStateLabels = { yes: 'Oui, accès déclaré', no: 'Non, accès déclaré', unknown: 'Inconnu / non déclaré' } as const;
const polarityLabels = { positiveMention: 'Mention positive', explicitNegation: 'Négation explicite', ambiguousMention: 'Mention ambiguë' } as const;
const originLabels = { user: 'Déclaration utilisateur', proposal: 'Interprétation proposée', fixture: 'Fixture identifiée' } as const;

interface OperationalPresentation {
  status: string;
  explanation: string;
  detailSummary: string;
}

function operationalPresentation(strategy: Strategy): OperationalPresentation {
  const scope = scopeLabels[strategy.scope].toLocaleLowerCase('fr-CH');
  if (strategy.preparation.operational.status === 'requiresReceivedAdapter') {
    return { status: 'Préparation opérationnelle possible',
      explanation: 'Une préparation peut s’ouvrir par cette voie après vérification des paramètres et conditions.',
      detailSummary: `Pourquoi cette portée · ${scope}` };
  }
  if (strategy.scope === 'documentation') {
    return { status: 'Aucune opération fournie',
      explanation: 'Cette voie reste documentaire; elle ne demande ni programme ni copie de recette.',
      detailSummary: `Pourquoi cette portée · ${scope}` };
  }
  if (strategy.scope === 'futureBrew') {
    return { status: 'Brassin futur · aucun programme fourni',
      explanation: 'Tu peux préparer et vérifier un programme si tu choisis de poursuivre cette voie.',
      detailSummary: `Pourquoi cette portée · ${scope}` };
  }
  return { status: 'Aucune opération fournie',
    explanation: 'Ce dossier ne modifie pas la recette; aucune suite opérationnelle n’est définie à cette portée.',
    detailSummary: `Pourquoi cette portée · ${scope}` };
}
const candidateStatusLabels = { documented: 'Éléments documentaires présents', notLoaded: 'Fiche non chargée dans cette réponse',
  unqualified: 'Fiche présente · lien non qualifié' } as const;
const candidateFilterLabels = { all: 'Toutes', documented: 'Avec éléments documentaires', unqualified: 'Lien non qualifié', notLoaded: 'Fiche non chargée' } as const;
type CandidateFilter = keyof typeof candidateFilterLabels;

const clone = <T,>(value: T): T => structuredClone(value);
const same = (left: unknown, right: unknown): boolean => JSON.stringify(left) === JSON.stringify(right);
const normalized = (value: string): string => value.trim().replace(/\s+/g, ' ').replace(/[.!?…]+$/u, '').toLocaleLowerCase('fr-CH');
/** Mise à jour structurelle d’un request de la même version (aucune conversion de format). */
const withRequest = <R extends CoreRequest>(request: R, change: Partial<CoreRequest>): R => ({ ...request, ...change });

function scrollToElement(element: Element | null) {
  if (!element) return;
  const run = () => (element as HTMLElement).scrollIntoView?.({ block: 'start', behavior: 'smooth' });
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run); else run();
}

function compensationText(answer: CoreAnswer, intent: CoreIntent): string {
  if (intent.investigation?.kind !== 'comparePerceptualCompensation') return '';
  const labels = intent.investigation.observationIntentIds.map((id) => answer.requestSnapshot.propertyIntents.find((row) => row.id === id)?.label ?? id);
  return `Comparer des compensations perceptives · constats comparés : ${labels.join(' · ') || 'aucun'} · ni une baisse ni un choix d’amertume`;
}

function intentText(intent: CoreIntent): string {
  const compensation = intent.investigation?.kind === 'comparePerceptualCompensation' ? ' · comparaison de compensations' : '';
  return `${propertyLabels[intent.property]} · ${roleLabels[intent.role]}${compensation} · ${intent.label}${intent.qualification ? ` · ${intent.qualification}` : ''}`;
}

function directionText(intent: CoreIntent): string {
  return intent.direction ? directionLabels[intent.direction] : 'Direction non déclarée';
}

export function SourceCard({ answer, source }: { answer: CoreAnswer; source: HopSource }) {
  const record = answer.corpusSnapshot.sources.find((row) => same(row.source, source));
  const url = /^https?:\/\//i.test(source.reference);
  return <div className="hv-property-source">
    <b>{source.title}</b><span>{source.author}{source.year === null ? '' : ` · ${source.year}`}</span>
    {record ? <><span>{sourceNatureLabels[record.nature]} · {readingLevelLabels[record.readingLevel]}</span>
      <span>Repère : {record.locator}</span><span>Domaine : {record.domain}</span>
      {record.limits.map((limit, index) => <small key={`${index}-${limit}`}>Limite : {limit}</small>)}</>
      : <><span>Nature de source : {sourceKindLabels[source.kind]}</span>{source.locator ? <span>Repère : {source.locator}</span> : null}
        <small>Niveau de lecture non indiqué dans ce corpus.</small></>}
    {url ? <a href={source.reference} target="_blank" rel="noreferrer">Consulter la source</a> : null}
    <details><summary>Référence</summary><code>{source.reference}</code></details>
  </div>;
}

function AssertionEvidence({ answer, id }: { answer: CoreAnswer; id: string }) {
  const assertion = answer.requestSnapshot.context.assertions.find((row) => row.id === id);
  if (!assertion) return <p className="hv-property-gap">Assertion de contexte non retrouvée · <code>{id}</code>.</p>;
  const assertionState = assertion.state === 'reported' ? 'Rapportée' : assertion.state === 'measured' ? 'Mesurée'
    : assertion.state === 'planned' ? 'Prévue' : assertion.state === 'performed' ? 'Effectuée' : 'Inconnue';
  return <article className="hv-property-assertion"><b>{assertion.statement}</b>
    <span>{assertionState}{assertion.value === null ? '' : ` · ${String(assertion.value)}`}{assertion.unit ? ` ${assertion.unit}` : ''}</span>
    {assertion.source ? <SourceCard answer={answer} source={assertion.source} /> : <small>Source documentaire non jointe à cette assertion.</small>}
  </article>;
}

function intentName(answer: CoreAnswer, intentId: string): string {
  const intent = answer.requestSnapshot.propertyIntents.find((row) => row.id === intentId);
  return intent ? intentText(intent) : 'Intention exacte non retrouvée';
}

function displayedMaterialName(answer: CoreAnswer, materialId: string): string {
  return answer.requestSnapshot.materials.find((row) => row.id === materialId)?.name ?? 'matière non chargée';
}

function DescriptionCard({ answer, description }: { answer: CoreAnswer; description: HopDescription }) {
  return <article className="hv-property-description"><span>Contexte : {sensoryContextLabels[description.context]}</span>
    <blockquote>« {description.text} »</blockquote><SourceCard answer={answer} source={description.source} />
  </article>;
}

type Evaluation = CoreAnswer['candidateAssessments'][number]['evaluations'][number];

function EvidenceCard({ answer, evidence }: { answer: CoreAnswer; evidence: Evaluation['candidateEvidence'][number] }) {
  return <article className="hv-property-evidence"><blockquote>« {evidence.quote} »</blockquote>
    <span>{evidence.side === 'candidate' ? 'Candidat' : 'Partenaire'} · {evidence.term} · {sensoryContextLabels[evidence.context]} · {polarityLabels[evidence.polarity]}</span>
    <SourceCard answer={answer} source={evidence.source} /><SourceCard answer={answer} source={evidence.mappingSource} />
  </article>;
}

export function EvaluationBody({ answer, evaluation }: { answer: CoreAnswer; evaluation: Evaluation }) {
  return <>
    <span>{evaluationStatusLabels[evaluation.status]}</span><p>{evaluation.consequence}</p>
    {evaluation.reason ? <small>{evaluation.reason}</small> : null}
    {evaluation.missingInformation.map((item, itemIndex) => <small key={`${itemIndex}-${item}`}>À qualifier : {item}</small>)}
    {evaluation.candidateDescriptions.map((description, index) => <DescriptionCard answer={answer} description={description} key={`candidate-${index}`} />)}
    {evaluation.partnerDescriptions.map((description, index) => <DescriptionCard answer={answer} description={description} key={`partner-${index}`} />)}
    {evaluation.candidateEvidence.map((row, index) => <EvidenceCard answer={answer} evidence={row} key={`candidate-evidence-${index}`} />)}
    {evaluation.partnerEvidence.map((row, index) => <EvidenceCard answer={answer} evidence={row} key={`partner-evidence-${index}`} />)}
  </>;
}

function DocumentaryArgument({ answer, argumentId, collapsed = false, includeMaterialEvidence = true }: {
  answer: CoreAnswer; argumentId: string; collapsed?: boolean; includeMaterialEvidence?: boolean;
}) {
  const argument = answer.arguments.find((row) => row.id === argumentId);
  if (!argument) return null;
  const claims = answer.corpusSnapshot.claims.filter((claim) => argument.claimIds.includes(claim.id));
  const sources = claims.flatMap((claim) => answer.corpusSnapshot.sources.filter((row) => claim.sourceIds.includes(row.id)));
  return <article className="hv-property-argument">
    <span className={`hv-property-kind hv-property-kind-${argument.kind}`}>{argumentKindLabels[argument.kind]}</span>
    {collapsed ? <details className="hv-property-argument-detail"><summary>Développement de cette raison</summary><p>{argument.text}</p></details>
      : <p>{argument.text}</p>}
    {argument.intentIds.length ? <small>Intentions liées : {argument.intentIds.map((id) => answer.requestSnapshot.propertyIntents.find((intent) => intent.id === id)?.label ?? id).join(' · ')}</small> : null}
    {argument.assertionIds.length ? <details><summary>Assertions liées ({argument.assertionIds.length})</summary>
      {argument.assertionIds.map((id) => <AssertionEvidence key={id} answer={answer} id={id} />)}</details> : null}
    {includeMaterialEvidence && argument.materialEvidence.length ? <details><summary>Évaluations et descriptions liées ({argument.materialEvidence.length})</summary>
      {argument.materialEvidence.map((evidence, index) => <article className="hv-property-evaluation" key={`${evidence.materialId}-${evidence.intentId}-${index}`}>
        <b>{answer.requestSnapshot.materials.find((material) => material.id === evidence.materialId)?.name ?? 'Fiche absente du snapshot'} · {intentName(answer, evidence.intentId)}</b>
        <EvaluationBody answer={answer} evaluation={evidence.evaluation} />
      </article>)}
    </details> : null}
    {claims.length || sources.length ? <details><summary>Claims et sources ({claims.length})</summary>
      {claims.map((claim) => <article className="hv-property-claim" key={claim.id}>
        <b>{claimRoleLabels[claim.role]} · {claim.statement}</b><small>Domaine : {claim.domain}</small>
        {claim.transferConditions.map((condition, index) => <small key={`transfer-${index}`}>Transfert : {condition}</small>)}
        {claim.forbiddenInferences.map((inference, index) => <small key={`forbidden-${index}`}>À ne pas déduire : {inference}</small>)}
      </article>)}
      {sources.map((row, index) => <SourceCard answer={answer} source={row.source} key={`${row.id}-${index}`} />)}
    </details> : null}
  </article>;
}

function CandidateArgumentIndex({ answer, argumentIds, includeText = false }: {
  answer: CoreAnswer; argumentIds: string[]; includeText?: boolean;
}) {
  const arguments_ = [...new Set(argumentIds)].map((id) => answer.arguments.find((row) => row.id === id))
    .filter((row): row is CoreAnswer['arguments'][number] => !!row && row.materialEvidence.length > 0);
  if (!arguments_.length) return null;
  return <details className="hv-property-candidate-argument-index">
    <summary>Raisons liées aux fiches du périmètre ({arguments_.length})</summary>
    <p>Les comparaisons détaillées, descriptions et sources restent regroupées avec chaque matière.</p>
    <ul>{arguments_.map((row) => {
      const materials = [...new Set(row.materialEvidence.map((evidence) => evidence.materialId))]
        .map((id) => answer.requestSnapshot.materials.find((material) => material.id === id)?.name ?? 'Fiche non chargée');
      const intents = [...new Set(row.materialEvidence.map((evidence) => evidence.intentId))]
        .map((id) => answer.requestSnapshot.propertyIntents.find((intent) => intent.id === id)?.label ?? 'Intention non retrouvée');
      return <li key={row.id}><span className={`hv-property-kind hv-property-kind-${row.kind}`}>{argumentKindLabels[row.kind]}</span>
        <span>{materials.join(' · ')} · {intents.join(' · ')}</span>
        {includeText ? <DocumentaryArgument answer={answer} argumentId={row.id} collapsed includeMaterialEvidence={false} />
          : <details><summary>Référence de cette raison</summary><code>{row.id}</code></details>}
      </li>;
    })}</ul>
  </details>;
}

function ArgumentGroup({ answer, argumentIds, bodyText, includeCandidateIndex = false }: {
  answer: CoreAnswer; argumentIds: string[]; bodyText?: string; includeCandidateIndex?: boolean;
}) {
  const ids = [...new Set(argumentIds)];
  const ordinary = ids.filter((id) => !answer.arguments.find((argument) => argument.id === id)?.materialEvidence.length);
  return <>
    {ordinary.map((id) => {
      const argument = answer.arguments.find((row) => row.id === id);
      return <DocumentaryArgument key={id} answer={answer} argumentId={id}
        collapsed={!!bodyText && !!argument && normalized(bodyText) === normalized(argument.text)} />;
    })}
    {includeCandidateIndex ? <CandidateArgumentIndex answer={answer} argumentIds={ids} /> : null}
  </>;
}

interface QuestionMaterialAssociation {
  key: string;
  relation: 'Sujet de la question' | 'Partenaire exact';
  intentLabel: string;
  name: string;
  materialId: string | null;
  additionId?: string;
  recordLoaded: boolean;
}

/** Explicit subjects and material partners are links, not candidate selections or assessment rows. */
function questionMaterialAssociations(answer: CoreAnswer): QuestionMaterialAssociation[] {
  const materials = new Map(answer.requestSnapshot.materials.map((row) => [row.id, row]));
  const rows: QuestionMaterialAssociation[] = [];
  for (const intent of answer.requestSnapshot.propertyIntents) {
    if (intent.subject.kind === 'material') {
      const id = intent.subject.materialId;
      const material = id ? materials.get(id) : undefined;
      rows.push({ key: `subject:${intent.id}`, relation: 'Sujet de la question', intentLabel: intent.label,
        name: material?.name ?? intent.subject.label, materialId: id, recordLoaded: !!material });
    }
    if (intent.partner?.kind === 'material') {
      const material = materials.get(intent.partner.id);
      rows.push({ key: `partner:${intent.id}`, relation: 'Partenaire exact', intentLabel: intent.label,
        name: material?.name ?? 'Matière associée · fiche non chargée', materialId: intent.partner.id,
        additionId: intent.partner.additionId, recordLoaded: !!material });
    }
  }
  return rows;
}

/** Catalogue du périmètre : groupé, compté et filtrable; toutes les évaluations restent rendues et consultables. */
export function CandidateAssessmentsSection({ answer, view, rootId, sectionRef }: {
  answer: CoreAnswer; view: Pick<CoreView, 'candidateAssessments'>; rootId: string; sectionRef: React.Ref<HTMLElement>;
}) {
  const assessments = view.candidateAssessments;
  const materials = new Map(answer.requestSnapshot.materials.map((row) => [row.id, row]));
  const associatedMaterials = questionMaterialAssociations(answer);
  const [open, setOpen] = useState(assessments.length <= 6);
  const [filter, setFilter] = useState<CandidateFilter>('all');
  const [query, setQuery] = useState('');
  const counts = { all: assessments.length,
    documented: assessments.filter((row) => row.status === 'documented').length,
    unqualified: assessments.filter((row) => row.status === 'unqualified').length,
    notLoaded: assessments.filter((row) => row.status === 'notLoaded').length };
  const q = normalized(query);
  const shown = assessments.filter((row) => (filter === 'all' || row.status === filter)
    && (!q || normalized(materials.get(row.materialId)?.name ?? '').includes(q) || row.materialId.toLocaleLowerCase('fr-CH').includes(q)));
  const policy = answer.requestSnapshot.candidatePolicy;
  return <section className="hv-property-section hv-property-candidates-section" aria-labelledby={`${rootId}-candidates-title`} ref={sectionRef}>
    <div className="hv-property-heading"><div><h3 id={`${rootId}-candidates-title`}>Matières du périmètre demandé</h3>
      <p>{policy.kind === 'discover' ? 'Recherche dans le périmètre déclaré' : 'Sélection explicite; les fiches chargées ne sont pas choisies automatiquement'} · {policy.basis}</p></div>
    </div>
    {associatedMaterials.length ? <div className="hv-property-associated-materials" role="group" aria-labelledby={`${rootId}-associated-materials-title`}>
      <h4 id={`${rootId}-associated-materials-title`}>Matières associées à la question</h4>
      <p>Ces liens restent distincts du périmètre demandé. Ils ne sélectionnent aucune matière à comparer et n’ajoutent aucune évaluation.</p>
      <ul>{associatedMaterials.map((association) => <li key={association.key}>
        <div><b>{association.name}</b><span>{association.relation} · intention « {association.intentLabel} »</span>
          {association.materialId && !association.recordLoaded ? <small>Fiche non chargée; l’identité liée reste conservée.</small>
            : !association.materialId ? <small>Libellé transmis sans fiche liée.</small> : null}
        </div>
        <details><summary>Détails de l’association</summary>
          {association.materialId ? <code>Identité matière · {association.materialId}</code>
            : <p>Libellé transmis sans identité de fiche liée.</p>}
          {association.additionId ? <code>Ajout exact · {association.additionId}</code> : null}
        </details>
      </li>)}</ul>
    </div> : null}
    {assessments.length ? <>
      <p className="hv-property-candidate-counts">{`${counts.all} évaluation${counts.all === 1 ? '' : 's'} · ${counts.documented} avec éléments documentaires · ${counts.unqualified} lien non qualifié · ${counts.notLoaded} fiche${counts.notLoaded === 1 ? '' : 's'} non chargée${counts.notLoaded === 1 ? '' : 's'}`}</p>
      <details className="hv-property-candidates-disclosure" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary>{open ? 'Évaluations matière par matière' : `Voir les ${counts.all} évaluations matière par matière`}</summary>
        <div className="hv-property-candidate-tools">
          <div className="hv-property-filters" role="group" aria-label="Filtrer les matières évaluées">
            {(Object.keys(candidateFilterLabels) as CandidateFilter[]).filter((key) => key === 'all' || counts[key] > 0).map((key) =>
              <button type="button" className="hv-property-filter" aria-pressed={filter === key} key={key} onClick={() => setFilter(key)}>
                {`${candidateFilterLabels[key]} · ${counts[key]}`}</button>)}
          </div>
          <label className="hv-property-candidate-search"><span>Chercher une matière</span>
            <Input type="search" autoComplete="off" aria-label="Chercher une matière évaluée" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        </div>
        <p className="hv-property-muted" role="status">{`${shown.length} affichée${shown.length === 1 ? '' : 's'} sur ${counts.all}`}</p>
        <div className="hv-property-candidates">{shown.map((assessment) => {
          const material = materials.get(assessment.materialId);
          return <article className={`hv-property-candidate is-${assessment.status}`} key={assessment.materialId}>
            <div className="hv-property-heading"><div><h4>{material?.name ?? 'Candidat demandé · fiche absente'}</h4>
              <span className="hv-property-muted">{candidateStatusLabels[assessment.status]}</span></div></div>
            {assessment.reasons.map((reason, index) => <p className="hv-property-gap" key={`${index}-${reason}`}>{reason}</p>)}
            {assessment.evaluations.length ? <details><summary>Comparaisons par intention ({assessment.evaluations.length})</summary>
              {assessment.evaluations.map((evaluation, index) => <article className="hv-property-evaluation" key={`${evaluation.intentId}-${index}`}>
                <b>{intentName(answer, evaluation.intentId)}</b><EvaluationBody answer={answer} evaluation={evaluation} />
              </article>)}
            </details> : null}
            <details><summary>Identité technique</summary><code>{assessment.materialId}</code>
              {assessment.recordKeys.map((key) => <span className="hv-property-reference" key={key}>Référence chargée · <code>{key}</code></span>)}
            </details>
          </article>;
        })}</div>
        {!shown.length ? <p className="hv-property-gap">Aucune matière ne correspond à ce filtre; les autres évaluations restent conservées.</p> : null}
      </details>
    </> : <p className="hv-property-gap">Aucune matière n’a été demandée à comparer. Les sujets et partenaires associés ci-dessus ne deviennent pas des évaluations.</p>}
  </section>;
}

function ContextCard({ answer, intent }: { answer: CoreAnswer; intent: CoreIntent }) {
  return <details className="hv-property-intent-details"><summary>Détails de l’interprétation · {intent.label}</summary>
    <dl><div><dt>Origine</dt><dd>{originLabels[intent.interpretationOrigin]}</dd></div>
      <div><dt>Direction</dt><dd>{directionText(intent)}</dd></div>
      <div><dt>Métrique</dt><dd>{metricLabels[intent.metric]}</dd></div>
      {intent.investigation ? <div><dt>Nature de la question</dt><dd>{compensationText(answer, intent)}</dd></div> : null}
      <div><dt>Sujet</dt><dd>{subjectKindLabels[intent.subject.kind]} · {intent.subject.label} · {sensoryContextLabels[intent.subject.sensoryContext]}</dd></div>
      <div><dt>Base de comparaison</dt><dd>{intent.comparisonBasis.kind === 'qualitativeTarget' ? 'Cible qualitative' : intent.comparisonBasis.kind === 'current' ? 'État actuel à qualifier' : 'Aucune base déclarée'}</dd></div>
      <div><dt>Base / motif</dt><dd>{intent.basis}</dd></div>
      <div><dt>Portée nécessaire</dt><dd>{intent.required ? 'Oui' : 'Non · élément de contexte optionnel'}</dd></div>
      {intent.qualification ? <div><dt>Qualification</dt><dd>{intent.qualification}</dd></div> : null}
      {intent.familyId ? <div><dt>Famille documentaire</dt><dd><code>{intent.familyId}</code></dd></div> : null}
      {intent.partner ? <div><dt>Partenaire exact</dt><dd>{intent.partner.kind === 'material'
        ? `Matière · ${displayedMaterialName(answer, intent.partner.id)}${intent.partner.additionId ? ` · ajout ${intent.partner.additionId}` : ''}`
        : intent.partner.kind === 'observation' ? `Observation · ${intent.partner.id}` : `Contexte déclaré · ${intent.partner.text}`}
        {intent.partner.kind === 'material' ? <details><summary>Identité du partenaire</summary><code>{intent.partner.id}</code></details> : null}
        {intent.partner.kind === 'observation' ? intent.partner.descriptions?.map((description, index) => <DescriptionCard answer={answer} description={description} key={`partner-${index}`} />) : null}
        {intent.partner.kind === 'freeContext' && intent.partner.source ? <SourceCard answer={answer} source={intent.partner.source} /> : null}
      </dd></div> : null}
      {intent.subject.materialId ? <div><dt>Identité matière</dt><dd><code>{intent.subject.materialId}</code></dd></div> : null}
      {intent.comparisonBasis.assertionIds.length ? <div><dt>Assertions</dt><dd>{intent.comparisonBasis.assertionIds.map((id) => <code key={id}>{id} </code>)}</dd></div> : null}
      {intent.sourceSpans.length ? <div><dt>Fragments exacts</dt><dd>{intent.sourceSpans.map((span, index) => <span key={`${span.start}-${index}`}>« {span.text} » · {span.start}–{span.end}</span>)}</dd></div> : null}
      {intent.relatedIntentIds.length ? <div><dt>Intentions liées</dt><dd>{intent.relatedIntentIds.map((id) => answer.requestSnapshot.propertyIntents.find((row) => row.id === id)?.label ?? id).join(' · ')}</dd></div> : null}
    </dl>
  </details>;
}

export function PropertyAdviceDecisionCore<A extends CoreAnswer, R extends CoreRequest, D extends CoreDossier>({ adapter, answer, answerRecordReference,
  dossiers = [], previousAnswers = [], readOnly = false, materialChoices = [], onSearchMaterials, onSelectMaterials, onReinterpret,
  onSaveDossier, renderContextNotice }: DecisionCoreProps<A, R, D>) {
  const rootId = useId().replace(/:/g, '');
  const [current, setCurrent] = useState<CoreHistoryEntry<A>>({ answer, answerRecordReference });
  const currentRef = useRef(current);
  currentRef.current = current;
  const [localHistory, setLocalHistory] = useState<CoreHistoryEntry<A>[]>([]);
  const [viewedReference, setViewedReference] = useState<string>();
  const [draft, setDraft] = useState<{ request: R; interpretationText: string }>();
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionError, setCorrectionError] = useState('');
  const [busyReinterpret, setBusyReinterpret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [motiveByStrategy, setMotiveByStrategy] = useState<Record<string, string>>({});
  const [pendingSave, setPendingSave] = useState<CoreDossierSaveRequest>();
  const [savedDossiers, setSavedDossiers] = useState<D[]>([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const strategiesRef = useRef<HTMLElement>(null);
  const correctionRef = useRef<HTMLElement>(null);
  const candidatesRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (answer.reference === currentRef.current.answer.reference) {
      currentRef.current = { answer, answerRecordReference };
      setCurrent({ answer, answerRecordReference });
      return;
    }
    setLocalHistory((rows) => rows.some((row) => row.answer.reference === currentRef.current.answer.reference)
      ? rows : [...rows, { answer: clone(currentRef.current.answer), answerRecordReference: currentRef.current.answerRecordReference }]);
    setCurrent({ answer, answerRecordReference }); currentRef.current = { answer, answerRecordReference };
    setViewedReference(undefined); setDraft(undefined); setCorrectionError('');
  }, [answer.reference, answerRecordReference]);

  const allHistory = useMemo(() => {
    const rows = [...previousAnswers, ...localHistory].filter((row) => row.answer.reference !== current.answer.reference);
    return [...new Map(rows.map((row) => [row.answer.reference, row])).values()];
  }, [current.answer.reference, localHistory, previousAnswers]);
  const displayEntry = viewedReference ? allHistory.find((row) => row.answer.reference === viewedReference)
    ?? { answer: current.answer, answerRecordReference: current.answerRecordReference } : current;
  const viewingHistory = displayEntry.answer.reference !== current.answer.reference;
  const view = useMemo<CoreView>(() => adapter.viewModel(displayEntry.answer), [adapter, displayEntry.answer]);
  const displayedAnswer = displayEntry.answer;
  const displayedIntents = displayedAnswer.requestSnapshot.propertyIntents;
  const editorEnabled = !readOnly && !viewingHistory;
  const canCorrect = editorEnabled && !!onReinterpret;
  const allDossiers = useMemo(() => [...new Map([...dossiers, ...savedDossiers].map((row) => [row.reference, row])).values()], [dossiers, savedDossiers]);
  const dossiersForAnswer = allDossiers.filter((row) => row.answerReference === displayedAnswer.reference);
  const displayedMaterials = new Map(displayedAnswer.requestSnapshot.materials.map((row) => [row.id, row]));
  const draftIssues = draft && adapter.validateDraft ? adapter.validateDraft(draft.request) : [];

  const updateIntent = (intentId: string, replacement: R['propertyIntents'][number]) => setDraft((currentDraft) => currentDraft ? ({ ...currentDraft,
    request: withRequest(currentDraft.request, { propertyIntents: currentDraft.request.propertyIntents.map((row) => row.id === intentId ? clone(replacement) : row) }) }) : currentDraft);
  const appendIntent = (intent: R['propertyIntents'][number]) => {
    if (!draft) return;
    if (draft.request.propertyIntents.some((row) => row.id === intent.id)) {
      setCorrectionError('Cette intention est déjà présente dans la lecture; ses fragments et son identité sont conservés.');
      return;
    }
    setCorrectionError('');
    setDraft((currentDraft) => currentDraft ? { ...currentDraft, request: withRequest(currentDraft.request,
      { propertyIntents: [...currentDraft.request.propertyIntents, clone(intent)] }) } : currentDraft);
  };
  const updateCandidatePolicy = (candidatePolicy: HopPropertyAdviceCandidatePolicy) => setDraft((currentDraft) => currentDraft ? ({
    ...currentDraft, request: withRequest(currentDraft.request, { candidatePolicy: clone(candidatePolicy) }) }) : currentDraft);
  const updateAccess = (scope: AccessKey, value: AccessValue) => setDraft((currentDraft) => currentDraft ? ({ ...currentDraft,
    request: withRequest(currentDraft.request, { context: { ...currentDraft.request.context,
      access: { ...currentDraft.request.context.access, [scope]: clone(value) } } }) }) : currentDraft);
  const updateAssertions = (assertions: HopAdviceAssertion[]) => setDraft((currentDraft) => currentDraft ? ({ ...currentDraft,
    request: withRequest(currentDraft.request, { context: { ...currentDraft.request.context, assertions: clone(assertions) } }) }) : currentDraft);
  const updateMaterials = (materials: HopDecisionMaterial[]) => setDraft((currentDraft) => {
    if (!currentDraft) return currentDraft;
    const byId = new Map(currentDraft.request.materials.map((row) => [row.id, row]));
    for (const material of materials) {
      const existing = byId.get(material.id);
      if (existing && !same(existing, material)) { setCorrectionError(`La matière ${material.name} change de contenu sous la même identité. Recharge sa fiche avant correction.`); return currentDraft; }
      byId.set(material.id, clone(material));
    }
    setCorrectionError('');
    return { ...currentDraft, request: withRequest(currentDraft.request, { materials: [...byId.values()] }) };
  });

  const startCorrection = () => {
    setDraft({ request: adapter.requestOf(displayedAnswer), interpretationText: displayedAnswer.requestSnapshot.interpretation.text });
    setCorrectionReason(''); setCorrectionError(''); setError(''); setNotice('');
  };
  const openCorrection = () => {
    if (!draft) startCorrection();
    scrollToElement(correctionRef.current);
  };

  const submitCorrection = async () => {
    if (!draft || !onReinterpret) return;
    const reason = correctionReason.trim();
    if (!reason) { setCorrectionError('Explique pourquoi tu corriges les intentions et leur portée.'); return; }
    if (!draft.interpretationText.trim()) { setCorrectionError('Décris l’interprétation à conserver sans réécrire la question originale.'); return; }
    if (draft.request.originalQuestion !== displayedAnswer.requestSnapshot.originalQuestion || draft.request.id !== displayedAnswer.requestSnapshot.id) {
      setCorrectionError('La question originale et l’identité du request restent celles de la réponse choisie.'); return;
    }
    if (!draft.request.propertyIntents.length) { setCorrectionError('Garde au moins une intention ou un contexte explicitement qualifié.'); return; }
    if (draftIssues.length) { setCorrectionError(`À clarifier avant la nouvelle lecture : ${draftIssues.join(' ')}`); return; }
    const request = withRequest(clone(draft.request), { interpretation: { id: `property-interpretation-${crypto.randomUUID()}`,
      version: adapter.interpretationVersion, text: draft.interpretationText.trim(), origin: 'user' } });
    try {
      setBusyReinterpret(true); setCorrectionError(''); setError(''); setNotice('');
      const updated = await onReinterpret({ request, expectedAnswerRecordReference: displayEntry.answerRecordReference,
        expectedAnswerReference: displayedAnswer.reference, expectedInterpretationReference: displayedAnswer.interpretationReference, reason });
      const nextView = adapter.viewModel(updated.answer);
      if (nextView.requestSnapshot.originalQuestion !== displayedAnswer.requestSnapshot.originalQuestion
        || nextView.answerReference === displayedAnswer.reference || !updated.answerRecordReference
        || updated.answerRecordReference === displayEntry.answerRecordReference) {
        throw Error('La nouvelle réponse doit garder la question verbatim et recevoir sa propre référence persistée.');
      }
      if (updated.kind === 'revision') {
        if (nextView.requestSnapshot.id !== request.id) throw Error('Une révision conserve l’identité exacte de son requestSnapshot.');
      } else {
        const source = updated.source;
        if (source.answerRecordReference !== displayEntry.answerRecordReference || source.answerReference !== displayedAnswer.reference
          || source.interpretationReference !== displayedAnswer.interpretationReference
          || source.requestId !== displayedAnswer.requestSnapshot.id) {
          throw Error('Le réexamen ne correspond pas à la réponse et à la demande source choisies.');
        }
        if (nextView.requestSnapshot.id === displayedAnswer.requestSnapshot.id) {
          throw Error('Un réexamen doit créer une nouvelle identité de demande; une révision garde l’identité existante.');
        }
      }
      setLocalHistory((rows) => rows.some((row) => row.answer.reference === displayedAnswer.reference) ? rows
        : [...rows, { answer: clone(displayedAnswer), answerRecordReference: displayEntry.answerRecordReference }]);
      setCurrent({ answer: updated.answer, answerRecordReference: updated.answerRecordReference });
      currentRef.current = { answer: updated.answer, answerRecordReference: updated.answerRecordReference };
      setViewedReference(undefined); setDraft(undefined);
      setNotice('Nouvelle réponse documentaire conservée. La réponse précédente reste disponible en lecture figée.');
    } catch (cause) { setCorrectionError((cause as Error).message || 'La correction n’a pas abouti; la réponse précédente reste intacte.'); }
    finally { setBusyReinterpret(false); }
  };

  const createDossierRequest = (strategy: Strategy): CoreDossierSaveRequest | undefined => {
    const motive = motiveByStrategy[strategy.id]?.trim();
    if (!motive) { setError('Explique pourquoi tu conserves ce dossier documentaire.'); return undefined; }
    return { commandId: `property-advice-dossier-${crypto.randomUUID()}`,
      expectedAnswerRecordReference: displayEntry.answerRecordReference, expectedAnswerReference: displayedAnswer.reference,
      expectedInterpretationReference: displayedAnswer.interpretationReference, strategyId: strategy.id,
      expectedStrategyReference: strategy.reference, motive };
  };

  const persistDossier = async (request: CoreDossierSaveRequest) => {
    if (!onSaveDossier || readOnly) return;
    setPendingSave(request); setSaving(true); setError(''); setNotice('');
    try {
      const dossier = await onSaveDossier(request);
      if (dossier.answerReference !== request.expectedAnswerReference || dossier.interpretationReference !== request.expectedInterpretationReference
        || dossier.strategyId !== request.strategyId || dossier.strategyReference !== request.expectedStrategyReference) {
        throw Error('Le dossier retourné ne correspond pas aux références choisies. Reprends le choix sur la réponse courante.');
      }
      setSavedDossiers((rows) => rows.some((row) => row.reference === dossier.reference) ? rows : [...rows, clone(dossier)]);
      setPendingSave(undefined); setNotice('Dossier documentaire conservé. Aucune opération, recette ou réservation n’a été créée.');
    } catch (cause) { setError((cause as Error).message || 'Le dossier reste prêt à être renvoyé avec la même commande.'); }
    finally { setSaving(false); }
  };

  const retrySave = async () => {
    if (!pendingSave || !onSaveDossier) return;
    if (displayedAnswer.reference !== pendingSave.expectedAnswerReference) {
      setError('La réponse a changé; reprends le choix du dossier sur la réponse courante.'); return;
    }
    await persistDossier(pendingSave);
  };

  const renderBodyParagraph = (paragraph: CoreAnswer['body'][number]) => <article className="hv-property-paragraph" key={paragraph.id}>
    <p>{paragraph.text}</p>
    {paragraph.argumentIds.length ? <details className="hv-property-argument-group">
      <summary>Raisons détaillées et sources ({paragraph.argumentIds.length})</summary>
      <div className="hv-property-arguments"><ArgumentGroup answer={displayedAnswer} argumentIds={paragraph.argumentIds} bodyText={paragraph.text} /></div>
    </details> : null}
  </article>;

  const strategyAnchor = (index: number) => `${rootId}-strategy-${index}`;
  const dossierFor = (strategy: Strategy) => dossiersForAnswer.find((row) => row.strategyId === strategy.id && row.strategyReference === strategy.reference);

  return <section className="hop-v55 hv-property-advice" aria-labelledby={`${rootId}-title`}>
    <header className="hv-property-header">
      <div><p className="hv-property-eyebrow">Conseil documentaire · {adapter.versionLabel}</p>
        <h2 id={`${rootId}-title`}>Réponse documentaire</h2>
        <p><b>Lecture {view.requestSnapshot.interpretation.origin === 'user' ? 'déclarée' : 'proposée'} :</b> {view.requestSnapshot.interpretation.text}</p>
        {renderContextNotice?.(displayEntry, canCorrect, openCorrection)}
        <div className="hv-property-quick">
          {view.strategies.length ? <button type="button" className="hv-property-chip-button" onClick={() => scrollToElement(strategiesRef.current)}>
            {`Voir les voies (${view.strategies.length})`}</button> : null}
          {canCorrect ? <button type="button" className="hv-property-chip-button" onClick={openCorrection}>
            {draft ? 'Reprendre ma correction' : 'Corriger la lecture'}</button> : null}
          {view.candidateAssessments.length ? <button type="button" className="hv-property-chip-button is-quiet" onClick={() => scrollToElement(candidatesRef.current)}>
            {`Matières évaluées (${view.candidateAssessments.length})`}</button> : null}
        </div>
      </div>
      <details className="hv-property-identity"><summary>Références de cette réponse</summary>
        <p>Réponse <code>{view.answerReference}</code></p><p>Interprétation <code>{view.interpretationReference}</code></p>
        <p>Corpus · {view.corpusSnapshot.version} · <code>{view.corpusSnapshot.reference}</code></p>
        <p>Règles · {view.rulesVersion} · entrée <code>{view.inputReference}</code></p>
      </details>
    </header>

    {viewingHistory ? <p className="hv-property-banner" role="status">Réponse antérieure affichée en lecture seule; aucune synthèse n’a été reconstruite.</p>
      : readOnly ? <p className="hv-property-banner" role="status">Cette réponse est affichée en lecture seule.</p> : null}

    <section className="hv-property-section hv-property-body" aria-labelledby={`${rootId}-body-title`}>
      <h3 id={`${rootId}-body-title`}>Réponse et raisons</h3>
      {view.body.length ? <>{renderBodyParagraph(view.body[0])}
        {view.body.length > 1 ? <details className="hv-property-body-more"><summary>Autres passages de la réponse ({view.body.length - 1})</summary>
          {view.body.slice(1).map(renderBodyParagraph)}
        </details> : null}
      </> : <p className="hv-property-gap">Aucune réponse substantielle n’est fournie dans cette portée; les intentions restent visibles ci-dessous.</p>}
      <CandidateArgumentIndex answer={displayedAnswer}
        argumentIds={displayedAnswer.arguments.filter((argument) => argument.materialEvidence.length > 0).map((argument) => argument.id)}
        includeText />
    </section>

    <section className="hv-property-section hv-property-strategies" aria-labelledby={`${rootId}-strategies-title`} ref={strategiesRef}>
      <div className="hv-property-heading"><div><h3 id={`${rootId}-strategies-title`}>Stratégies documentaires distinctes</h3>
        <p>Les options, investigations et caractérisations ont des rôles différents. Aucune ne prépare une opération.</p></div></div>
      {view.strategies.length > 1 ? <ol className="hv-property-overview" aria-label="Les voies en bref">
        {view.strategies.map((strategy, index) => {
          const kept = !!dossierFor(strategy);
          return <li key={strategy.reference}>
            <button type="button" onClick={() => scrollToElement(document.getElementById(strategyAnchor(index)))}>
              <span className="hv-property-way-index" aria-hidden="true">{index + 1}</span>
              <span className="hv-property-way-text">
                <span className="hv-property-way-title">{`Voie ${index + 1} · ${strategy.title}`}</span>
                <span className="hv-property-way-diff">{`En quoi elle diffère : ${strategy.distinctiveReason}`}</span>
                <span className={`hv-property-way-meta is-${strategy.applicability.status}`}>{`${contributionLabels[strategy.contribution]} · ${applicabilityLabels[strategy.applicability.status]} · portée ${scopeLabels[strategy.scope].toLocaleLowerCase('fr-CH')}${kept ? ' · dossier déjà conservé' : ''}`}</span>
              </span>
            </button>
          </li>;
        })}
      </ol> : null}
      {view.strategies.length ? <div className="hv-property-strategy-list">{view.strategies.map((strategy, index) => {
        const existingDossier = dossierFor(strategy);
        const operation = operationalPresentation(strategy);
        return <article className="hv-property-strategy" key={strategy.reference} id={strategyAnchor(index)} tabIndex={-1}>
          <div className="hv-property-strategy-head"><div><span className="hv-property-way-label">{`Voie ${index + 1}`}</span>
            <span className="hv-property-kind">{contributionLabels[strategy.contribution]}</span>
            <h4>{strategy.title}</h4><p>{strategy.purpose}</p></div>
            <span className={`hv-property-status hv-property-status-${strategy.applicability.status}`}>{applicabilityLabels[strategy.applicability.status]}</span>
          </div>
          <p className="hv-property-distinctive">{strategy.distinctiveReason}</p>
          <dl className="hv-property-strategy-meta">
            <div><dt>Portée</dt><dd>{scopeLabels[strategy.scope]}</dd></div>
            <div><dt>Intervention</dt><dd>{interventionLabels[strategy.intervention]}</dd></div>
            <div><dt>Choix à conserver</dt><dd>{strategy.preparation.documentaryDossier.status === 'available'
              ? preparationLabels[strategy.preparation.documentaryDossier.kind] : 'Dossier indisponible'}
              <details><summary>Détail du choix documentaire</summary><p>{strategy.preparation.documentaryDossier.label}</p></details>
            </dd></div>
            <div><dt>Suite du choix</dt><dd><strong>{operation.status}</strong>
              <p>{operation.explanation}</p>
              <details><summary>{operation.detailSummary}</summary><p>{strategy.preparation.operational.reason}</p>
                {strategy.preparation.operational.adapterId ? <code>{strategy.preparation.operational.adapterId}</code> : null}
              </details>
            </dd></div>
          </dl>
          <section className="hv-property-effects" aria-label={`Effets pour chaque intention · ${strategy.title}`}>
            <b>Effets par intention</b>
            {displayedIntents.map((intent) => {
              const effect = strategy.effects.find((row) => row.intentId === intent.id);
              return <article key={intent.id}><b>{intentText(intent)}</b>
                {effect ? <><span className={`hv-property-effect-status is-${effect.status}`}>{effectStatusLabels[effect.status]}</span><p>{effect.text}</p>
                  {effect.argumentIds.length ? <details className="hv-property-argument-group">
                    <summary>Raisons et sources ({effect.argumentIds.length})</summary>
                    <ArgumentGroup answer={displayedAnswer} argumentIds={effect.argumentIds} />
                  </details> : null}
                </> : <span>La stratégie ne transmet pas de qualification d’effet pour cette intention.</span>}
              </article>;
            })}
          </section>
          {strategy.tradeoffs.length ? <details className="hv-property-detail"><summary>Compromis et limites ({strategy.tradeoffs.length})</summary>
            {strategy.tradeoffs.map((tradeoff, tradeoffIndex) => <article key={`${tradeoffIndex}-${tradeoff.text}`}><p>{tradeoff.text}</p>
              {tradeoff.intentIds.length ? <small>Intentions : {tradeoff.intentIds.map((id) => displayedIntents.find((row) => row.id === id)?.label ?? id).join(' · ')}</small> : null}
              <ArgumentGroup answer={displayedAnswer} argumentIds={tradeoff.argumentIds} />
            </article>)}
          </details> : null}
          {strategy.nextSteps.length ? <details className="hv-property-detail"><summary>Prochaines étapes documentaires ({strategy.nextSteps.length})</summary>
            {strategy.nextSteps.map((step, stepIndex) => <article key={`${stepIndex}-${step.text}`}>
              <b>{step.kind === 'document' ? 'Documenter' : step.kind === 'compare' ? 'Comparer' : step.kind === 'qualify' ? 'Qualifier' : 'Projet futur'}</b><p>{step.text}</p>
              <ArgumentGroup answer={displayedAnswer} argumentIds={step.argumentIds} />
            </article>)}
          </details> : null}
          {strategy.applicability.conditions.length ? <details className="hv-property-detail"><summary>Conditions de cette voie ({strategy.applicability.conditions.length})</summary>
            {strategy.applicability.conditions.map((condition) => <article key={condition.id}>
              <b>{conditionStateLabels[condition.state]}</b><p>{condition.description}</p>
              {condition.intentIds.length ? <small>Intentions : {condition.intentIds.map((id) => displayedIntents.find((row) => row.id === id)?.label ?? id).join(' · ')}</small> : null}
              {condition.assertionIds.map((id) => <AssertionEvidence key={id} answer={displayedAnswer} id={id} />)}
              <details><summary>Référence de condition</summary><code>{condition.id}</code></details>
            </article>)}
          </details> : <p className="hv-property-gap">Aucune condition structurée n’est fournie pour cette voie.</p>}
          {strategy.preparation.missingRequirements.length || strategy.preparation.refusalReasons.length ? <details className="hv-property-detail">
            <summary>Éléments à qualifier ou motifs d’écart</summary>
            {strategy.preparation.missingRequirements.map((item, itemIndex) => <p key={`missing-${itemIndex}`}>À qualifier : {item}</p>)}
            {strategy.preparation.refusalReasons.map((item, itemIndex) => <p key={`refusal-${itemIndex}`}>Motif d’écart : {item}</p>)}
          </details> : null}
          {strategy.argumentIds.length ? <details className="hv-property-detail"><summary>Raisons liées à cette stratégie</summary>
            <ArgumentGroup answer={displayedAnswer} argumentIds={strategy.argumentIds} />
          </details> : null}
          {strategy.candidateIds.length ? <details><summary>Matières associées ({strategy.candidateIds.length})</summary>
            <ul>{strategy.candidateIds.map((id) => <li key={id}>{displayedMaterials.get(id)?.name ?? 'Identité demandée non chargée'}</li>)}</ul>
          </details> : null}
          {strategy.documentaryProductRefs.length ? <details><summary>Produits cités · références documentaires</summary>
            {strategy.documentaryProductRefs.map((product) => <article key={product.id}><b>{product.name}</b>
              <p>Produit documentaire · aucune matière, disponibilité ou autorisation d’emploi n’en découle.</p>
              {product.claimIds.map((id, claimIndex) => {
                const claim = view.corpusSnapshot.claims.find((row) => row.id === id);
                return claim ? <article className="hv-property-claim" key={id}><p>{claim.statement} · {claimRoleLabels[claim.role]}</p>
                  {claim.sourceIds.map((sourceId, sourceIndex) => { const source = view.corpusSnapshot.sources.find((row) => row.id === sourceId); return source ? <SourceCard answer={displayedAnswer} source={source.source} key={`${sourceId}-${claimIndex}-${sourceIndex}`} /> : null; })}
                </article> : <p className="hv-property-gap" key={id}>Claim non retrouvé · <code>{id}</code>.</p>;
              })}
              <details><summary>Identifiant produit</summary><code>{product.id}</code></details>
            </article>)}
          </details> : null}
          {strategy.preparation.documentaryDossier.status === 'available' && editorEnabled && onSaveDossier ? <div className="hv-property-save">
            {existingDossier ? <p role="status">Dossier déjà conservé pour cette réponse et cette stratégie.</p> : <>
              <label><span>Pourquoi conserver ce dossier documentaire ?</span><Textarea value={motiveByStrategy[strategy.id] ?? ''}
                onChange={(event) => setMotiveByStrategy((rows) => ({ ...rows, [strategy.id]: event.target.value }))}
                disabled={saving || !!pendingSave} placeholder="Motif du choix, d’une investigation ou d’une caractérisation." /></label>
              <button className="hv-property-primary" type="button" disabled={saving || !!pendingSave || !motiveByStrategy[strategy.id]?.trim()}
                onClick={() => { const request = createDossierRequest(strategy); if (request) void persistDossier(request); }}>
                Conserver ce dossier documentaire
              </button>
            </>}
            <p>Ce choix ne crée ni opération, ni recette, ni réservation ou consommation de stock.</p>
          </div> : null}
        </article>;
      })}</div> : <p className="hv-property-gap">Aucune stratégie n’est transmise pour cette réponse.</p>}
    </section>

    {canCorrect ? <section className="hv-property-section hv-property-correction" aria-labelledby={`${rootId}-correction-title`} ref={correctionRef}>
      <div className="hv-property-heading"><div><h3 id={`${rootId}-correction-title`}>Corriger les intentions documentaires</h3>
        <p>La question originale et la réponse précédente restent figées. La correction produit un nouveau snapshot après validation du parent.</p></div>
        {!draft ? <button className="hv-property-secondary" type="button" onClick={startCorrection}>Corriger cette interprétation</button> : null}
      </div>
      {draft ? <div className="hv-property-editor">
        <details className="hv-property-original-question"><summary>Question originale conservée</summary>
          <label><span>Question originale conservée</span><Textarea value={draft.request.originalQuestion} readOnly /></label>
        </details>
        {adapter.renderEditor({ request: draft.request, materialChoices, onSearchMaterials, onSelectMaterials,
          onChangeIntent: updateIntent, onAddIntent: appendIntent, onChangeCandidatePolicy: updateCandidatePolicy,
          onChangeMaterials: updateMaterials, onChangeAccess: updateAccess, onChangeAssertions: updateAssertions,
          disabled: busyReinterpret || saving || !!pendingSave })}
        <div className="hv-property-stage-source" role="group" aria-label="Stade source en lecture seule">
          <b>Stade fourni · figé pour cette correction</b><span>{stageLabels[draft.request.context.stage]}</span>
          <p>{draft.request.context.stageBasis}</p>
          <p>Pour changer de phase, actualise la source de cette réponse. Cette correction porte sur les intentions et accès explicitement déclarés.</p>
        </div>
        <label><span>Lecture corrigée</span><Textarea value={draft.interpretationText}
          onChange={(event) => setDraft((currentDraft) => currentDraft ? { ...currentDraft, interpretationText: event.target.value } : currentDraft)} /></label>
        <label><span>Pourquoi corriger cette interprétation ?</span><Textarea value={correctionReason}
          onChange={(event) => setCorrectionReason(event.target.value)} placeholder="Motif explicite; la question reste verbatim." /></label>
        {draftIssues.length ? <div className="hv-property-draft-issues" role="status"><b>À clarifier avant la nouvelle lecture</b>
          <ul>{draftIssues.map((issue, index) => <li key={`${index}-${issue}`}>{issue}</li>)}</ul>
          <p>Les corrections se choisissent dans le terme concerné ci-dessus; rien n’est retiré à ta place.</p></div> : null}
        <div className="hv-property-actions"><button className="hv-property-secondary" type="button" onClick={() => { setDraft(undefined); setCorrectionError(''); }}>Annuler</button>
          <button className="hv-property-primary" type="button" disabled={busyReinterpret || !correctionReason.trim() || !draft.interpretationText.trim() || draftIssues.length > 0}
            onClick={() => void submitCorrection()}>{busyReinterpret ? 'Nouvelle lecture…' : 'Créer une nouvelle réponse documentaire'}</button>
        </div>
      </div> : null}
      {correctionError ? <p className="hv-property-error" role="alert">{correctionError}</p> : null}
    </section> : null}

    {pendingSave ? <p className="hv-property-banner" role="status">Le dossier peut être renvoyé avec la même commande et les mêmes références.
      {!readOnly && onSaveDossier ? <button className="hv-property-secondary" type="button" disabled={saving} onClick={() => void retrySave()}>Réessayer le même choix</button> : null}
    </p> : null}
    {error ? <p className="hv-property-error" role="alert">{error}</p> : null}
    {notice ? <p className="hv-property-banner" role="status">{notice}</p> : null}

    <section className="hv-property-section hv-property-context" aria-labelledby={`${rootId}-context-title`}>
      <h3 id={`${rootId}-context-title`}>Contexte source</h3>
      <details className="hv-property-original-question"><summary>Question originale conservée</summary>
        <blockquote>{view.requestSnapshot.originalQuestion}</blockquote>
      </details>
      <article className="hv-property-stage-source" role="group" aria-label="Stade préparé et figé">
        <b>Stade fourni par la source</b><span>{stageLabels[view.requestSnapshot.context.stage]}</span>
        <p>{view.requestSnapshot.context.stageBasis}</p>
        {view.requestSnapshot.context.assertions.filter((assertion) => assertion.subject === 'batch-stage').map((assertion) =>
          <AssertionEvidence key={assertion.id} answer={displayedAnswer} id={assertion.id} />)}
      </article>
      <div className="hv-property-access">{(['bulkBeer', 'sampling', 'separatePortion'] as AccessKey[]).map((scope) => {
        const access = view.requestSnapshot.context.access[scope];
        const accessLabel = scope === 'bulkBeer' ? 'Accès au lot de bière' : scope === 'sampling' ? 'Accès au prélèvement' : 'Accès à une portion séparée';
        return <article key={scope}><b>{accessLabel}</b><span>{accessStateLabels[access.state]}</span><p>{access.basis}</p>
          {access.assertionIds.map((id) => <AssertionEvidence key={id} answer={displayedAnswer} id={id} />)}
        </article>;
      })}</div>
      {view.requestSnapshot.context.assertions.length ? <details><summary>Assertions du contexte ({view.requestSnapshot.context.assertions.length})</summary>
        {view.requestSnapshot.context.assertions.map((assertion) => <AssertionEvidence key={assertion.id} answer={displayedAnswer} id={assertion.id} />)}
      </details> : null}
    </section>

    <section className="hv-property-section hv-property-coverage-section" aria-labelledby={`${rootId}-coverage-title`}>
      <div className="hv-property-heading"><h3 id={`${rootId}-coverage-title`}>Portée de la réponse</h3>
        <strong className={`hv-property-status hv-property-status-${view.coverage.status}`}>{coverageStatusLabels[view.coverage.status]}</strong></div>
      <div className="hv-property-coverage">{view.coverage.points.map((point) => {
        const intent = displayedIntents.find((row) => row.id === point.intentId);
        return <article key={point.intentId}><b>{intent ? intentText(intent) : 'Intention exacte non retrouvée'}</b>
          <span>{pointStatusLabels[point.status]}</span>
          <details><summary>Détails de cette qualification</summary>
            <p>{point.reason}</p><code>{point.intentId}</code>
            {point.strategyIds.map((id) => <span className="hv-property-reference" key={id}>Stratégie liée · <code>{id}</code></span>)}
          </details>
        </article>;
      })}</div>
      <details className="hv-property-intents-summary"><summary>Intentions et contexte ({displayedIntents.length})</summary>
        {displayedIntents.map((intent) => <article className="hv-property-intent" key={intent.id}>
          <b>{intentText(intent)}</b><span>{directionText(intent)} · {intent.subject.label} · {sensoryContextLabels[intent.subject.sensoryContext]}</span>
          <ContextCard answer={displayedAnswer} intent={intent} />
        </article>)}
      </details>
    </section>

    <CandidateAssessmentsSection key={displayedAnswer.reference} answer={displayedAnswer} view={view} rootId={rootId} sectionRef={candidatesRef} />

    {allHistory.length ? <section className="hv-property-section hv-property-history" aria-labelledby={`${rootId}-history-title`}>
      <div className="hv-property-heading"><div><h3 id={`${rootId}-history-title`}>Réponses antérieures</h3>
        <p>Chaque snapshot conserve ses intentions, sources et interprétation; la relecture n’appelle pas le moteur.</p></div>
        {viewingHistory ? <button className="hv-property-secondary" type="button" onClick={() => setViewedReference(undefined)}>Retour à la réponse courante</button> : null}
      </div>
      <ul>{allHistory.map((entry) => <li key={entry.answer.reference}>
        <span>{entry.answer.requestSnapshot.originalQuestion} · {coverageStatusLabels[entry.answer.coverage.status]}</span>
        <details><summary>Références techniques</summary><code>{entry.answer.reference}</code> · corpus <code>{entry.answer.corpusSnapshot.reference}</code></details>
        {entry.answer.reference === displayEntry.answer.reference ? <b>Lecture ouverte</b>
          : <button className="hv-property-text-button" type="button" onClick={() => { setViewedReference(entry.answer.reference); setDraft(undefined); }}>Ouvrir en lecture figée</button>}
      </li>)}</ul>
    </section> : null}

    {allDossiers.length ? <section className="hv-property-section hv-property-history" aria-labelledby={`${rootId}-dossiers-title`}>
      <div className="hv-property-heading"><div><h3 id={`${rootId}-dossiers-title`}>Dossiers documentaires conservés</h3>
        <p>Ils conservent une stratégie et une réponse exacte, sans autoriser ni créer une opération.</p></div></div>
      <ul>{allDossiers.map((dossier) => <li key={dossier.reference}>
        <b>{dossier.strategySnapshot.title}</b><span>{dossier.answerSnapshot.requestSnapshot.originalQuestion}</span>
        <span>Motif : {dossier.motive}</span>
        <details><summary>Références du dossier</summary><code>{dossier.reference}</code> · stratégie <code>{dossier.strategyReference}</code> · réponse <code>{dossier.answerReference}</code></details>
      </li>)}</ul>
    </section> : null}

    <details className="hv-property-section hv-property-limits"><summary>Limites de cette réponse</summary>
      <ul>{view.limits.map((limit, index) => <li key={`${index}-${limit}`}>{limit}</li>)}</ul>
    </details>
  </section>;
}
