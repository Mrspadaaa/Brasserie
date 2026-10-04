import React, { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import type { HopSource } from '../../../functions/src/hopIndexSchema';
import type { HopAdviceAssertion } from '../../domain/hopDecision/adviceSchema';
import type { HopPropertyAdviceAnswerV3, HopPropertyAdviceStrategy } from '../../domain/hopDecision/propertyAdviceSchema';
import type { HopV55PropertyAdviceLedgerActionV4 } from '../../services/hopV55/propertyAdvicePreparationV4';
import type { HopV55PropertyAdviceAnswerRecordV4, HopV55PropertyAdviceDossierRecordV4 } from '../../services/hopV55/propertyAdviceRecordsV4';
import type { HopV55AdoptedContextBindingV1 } from '../../services/hopV55/adoptedContextResolution';
import type {
  HopV55PropertyAdviceDecisionV4Props,
  HopV55PropertyAdviceV4CorrectionRequest,
  HopV55PropertyAdviceV4DossierRequest,
  HopV55PropertyAdviceV4ReexaminationRequest,
  HopV55PropertyAdviceDisplayedRecordIdentityV4,
} from './propertyAdviceV4UiContracts';
import { Textarea } from '../Input';
import {
  applicabilityLabels,
  argumentKindLabels,
  CandidateAssessmentsSection,
  claimRoleLabels,
  conditionStateLabels,
  contributionLabels,
  coverageStatusLabels,
  effectStatusLabels,
  EvaluationBody,
  interventionLabels,
  pointStatusLabels,
  preparationLabels,
  scopeLabels,
  SourceCard,
  stageLabels,
  type CoreAnswer,
} from './propertyAdviceDecisionCore';
import {
  ACCESS_SCOPES_V4,
  accessScopeLabelsV4,
  accessStateLabelsV4,
  annotationActionsV4,
  annotationRowsV4,
  changeItemsV4,
  draftBlockersV4,
  DraftBlockersV4,
  emptyAnnotationDraftV4,
  formatInstantV4,
  HopV55PropertyAdviceAnnotationEditorV4,
  ledgerAnnotationsV4,
  projectedActiveV4,
  sameV4,
  withoutUndefinedV4,
  type V4AnnotationDraft,
  type V4ChangeItem,
} from './PropertyAdviceAnnotationEditorV4';
import './property-advice-decision.css';
import './property-advice-v4.css';

/*
 * Façade V4 : lecture de service (registre d’annotations + issue domainAnswer | allRejected).
 * Le DTO métier reste l’AnswerV3 exacte de `outcome.answerSnapshot`; elle est rendue telle quelle, sans projection,
 * builder, parser ni lookup au montage ou à la relecture. Le parent prépare, construit, scelle et sauvegarde;
 * ce composant envoie des gestes (commandId stable aux retries) et vérifie chaque retour avant d’annoncer un succès.
 */
export type { HopV55PropertyAdviceDecisionV4Props, HopV55PropertyAdviceDisplayedRecordIdentityV4 } from './propertyAdviceV4UiContracts';

type AnswerRecord = HopV55PropertyAdviceAnswerRecordV4;
type DossierRecord = HopV55PropertyAdviceDossierRecordV4;
type AnswerV3 = HopPropertyAdviceAnswerV3;
type Strategy = HopPropertyAdviceStrategy;
type Intent = AnswerV3['requestSnapshot']['propertyIntents'][number];
type CorrectionRequest = HopV55PropertyAdviceV4CorrectionRequest;
type ReexaminationRequest = HopV55PropertyAdviceV4ReexaminationRequest;
type DossierRequest = HopV55PropertyAdviceV4DossierRequest;
type CommandKind = 'revise' | 'reexamine';
type AccessMap = AnswerRecord['readingContext']['context']['access'];

const RECORD_FORMAT: AnswerRecord['format'] = 'hop-v55-documentary-answer-record-v4';
const DOSSIER_FORMAT: DossierRecord['format'] = 'hop-v55-documentary-dossier-record-v4';

const transitionLabels: Record<AnswerRecord['transition']['kind'], string> = {
  create: 'Première lecture', upgradeV3: 'Reprise d’une réponse antérieure', revise: 'Correction de lecture', reexamine: 'Contexte relu',
};
const assertionStateLabels: Record<string, string> = { reported: 'Déclaré', measured: 'Mesuré', planned: 'Prévu', performed: 'Réalisé', unknown: 'Inconnu' };
const nextStepLabels = { document: 'Documenter', compare: 'Comparer', qualify: 'Qualifier', futurePlan: 'Projet futur' } as const;
const certaintyLabels = { certain: 'certaine', possible: 'possible', unknown: 'incertaine' } as const;
const sourceKindLabels: Record<string, string> = { coa: 'Certificat d’analyse', manufacturer: 'Fabricant', research: 'Recherche', review: 'Revue',
  observation: 'Observation', community: 'Communauté', judgment: 'Déclaration ou jugement' };

const answerOf = (record: AnswerRecord): AnswerV3 | null => record.outcome.kind === 'domainAnswer' ? record.outcome.answerSnapshot : null;
function displayedRecordIdentityV4(record: AnswerRecord): HopV55PropertyAdviceDisplayedRecordIdentityV4 {
  return { ownerKey: record.ownerKey, workspaceId: record.workspaceId, recordId: record.id, recordReference: record.reference,
    sourceReadingReference: record.sourceReadingReference, ledgerReference: record.ledger.reference };
}
const shortRef = (value: string): string => value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`;
const formatExactNumberV4 = (value: number): string => new Intl.NumberFormat('fr-CH', { maximumSignificantDigits: 21 }).format(value);
const isGuard = (intent: Intent): boolean => intent.role === 'constraint' || intent.direction === 'keep' || intent.direction === 'exclude';
const uuid = (): string => crypto.randomUUID();

function scrollToElement(element: Element | null) {
  if (!element) return;
  const run = () => (element as HTMLElement).scrollIntoView?.({ block: 'start', behavior: 'smooth' });
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run); else run();
}

/* ---------- vérification des retours parent (structure seulement; le sceau reste l’affaire du service) ---------- */
export interface V4RecordExpectation {
  kind: CommandKind;
  base: AnswerRecord;
  commandId: string;
  /** Motif exact de la commande, repris par la transition. */
  reason: string;
  actions: readonly HopV55PropertyAdviceLedgerActionV4[];
  /** Cadre de lecture transmis pour une correction, ou base de comparaison d’une relecture. */
  expectedReadingContext: AnswerRecord['readingContext'];
  /** Autorise uniquement le résumé proposé régénéré par le parent sur une correction du cadre inchangé. */
  allowProposalRefresh?: boolean;
  expectedActiveIds?: readonly string[];
  expectedAccess?: AccessMap;
}

function projectedIntentsForActionsV4(base: AnswerRecord, actions: readonly HopV55PropertyAdviceLedgerActionV4[]): Intent[] {
  const byId = new Map<string, HopV55PropertyAdviceLedgerActionV4>();
  for (const action of actions) byId.set(action.kind === 'add' ? action.sourceAnnotation.id : action.annotationId, action);
  const projected = ledgerAnnotationsV4(base.ledger).flatMap((annotation) => {
    const action = byId.get(annotation.annotationId);
    if (action?.kind === 'reject') return [];
    if (action && action.kind !== 'add') return [action.activeIntent];
    return annotation.disposition === 'active' && annotation.active ? [annotation.active] : [];
  });
  for (const action of actions) if (action.kind === 'add') projected.push(action.activeIntent);
  return projected;
}

function sameAssertionPrefixV4(before: readonly HopAdviceAssertion[], after: readonly HopAdviceAssertion[]): boolean {
  const byId = new Map(after.map((assertion) => [assertion.id, assertion]));
  return before.every((assertion) => sameV4(byId.get(assertion.id), assertion));
}

function activeAssertionLinkProblemV4(baseAssertions: readonly HopAdviceAssertion[], currentAssertions: readonly HopAdviceAssertion[],
  activeIntents: readonly Intent[]): string | null {
  const previousById = new Map(baseAssertions.map((assertion) => [assertion.id, assertion]));
  const currentById = new Map(currentAssertions.map((assertion) => [assertion.id, assertion]));
  for (const intent of activeIntents) for (const assertionId of intent.comparisonBasis.assertionIds) {
    const current = currentById.get(assertionId);
    if (!current) return 'Une intention active conserve une référence vers un fait absent du contexte relu.';
    const previous = previousById.get(assertionId);
    if (previous && !sameV4(previous, current)) {
      return 'Une intention active conserve une référence vers un fait dont le contenu a changé au réexamen.';
    }
  }
  return null;
}

function verifyReadingContextV4(expectation: V4RecordExpectation, record: AnswerRecord): string | null {
  const base = expectation.base.readingContext;
  const expected = expectation.expectedReadingContext;
  const actual = record.readingContext;
  if (!actual || !sameV4(actual.candidatePolicy, expected.candidatePolicy) || !sameV4(actual.exclusions, expected.exclusions)) {
    return 'Le périmètre des matières ou les exclusions ont changé sans geste confirmé.';
  }
  if (expectation.kind === 'revise') {
    if (!sameAssertionPrefixV4(base.context.assertions, actual.context.assertions)) {
      return 'La correction a modifié ou retiré un fait déjà conservé.';
    }
    if (!sameV4(actual.context, expected.context)) return 'Le contexte de la correction diffère de celui confirmé.';
    if (!sameV4(actual.interpretation, expected.interpretation)) {
      const allowedRefresh = expectation.allowProposalRefresh === true && expectation.actions.length > 0
        && sameV4(expected, base) && expected.interpretation.origin === 'proposal' && actual.interpretation.origin === 'proposal';
      if (!allowedRefresh) return 'Le résumé de lecture diffère de celui confirmé.';
    }
  } else {
    const answer = record.outcome.kind === 'domainAnswer' ? record.outcome.answerSnapshot : undefined;
    if (answer && !sameV4(answer.requestSnapshot.context, actual.context)) {
      return 'Le cadre relu diffère du contexte exact utilisé pour cette réponse.';
    }
    if (answer && !sameV4(answer.requestSnapshot.interpretation, actual.interpretation)) {
      return 'Le résumé du cadre relu diffère de celui porté par cette réponse.';
    }
    if (answer) {
      const staleLink = activeAssertionLinkProblemV4(base.context.assertions, actual.context.assertions,
        answer.requestSnapshot.propertyIntents);
      if (staleLink) return staleLink;
    }
    if (base.interpretation.origin === 'user' && !sameV4(actual.interpretation, expected.interpretation)) {
      return 'La relecture a modifié un résumé rédigé par le brasseur.';
    }
    if (base.interpretation.origin === 'proposal' && actual.interpretation.origin !== 'proposal') {
      return 'La relecture a changé l’origine du résumé proposé sans déclaration du brasseur.';
    }
  }
  return null;
}

export function verifyRecordResultV4(expectation: V4RecordExpectation, result: unknown): string | null {
  const record = result as AnswerRecord | null | undefined;
  const base = expectation.base;
  if (!record || typeof record !== 'object' || record.format !== RECORD_FORMAT) return 'Le retour n’est pas une version V4 de cette lecture.';
  if (!record.reference || record.reference === base.reference || record.id === base.id) return 'Le retour ne crée pas une nouvelle version distincte.';
  if (record.ownerKey !== base.ownerKey || record.workspaceId !== base.workspaceId) return 'Le retour appartient à un autre espace de travail.';
  if (record.originalQuestion !== base.originalQuestion) return 'La question n’est plus conservée mot pour mot.';
  const transition = record.transition;
  if (!transition || transition.actId !== expectation.commandId) return 'L’acte enregistré ne correspond pas à la commande envoyée.';
  if (transition.kind !== expectation.kind) {
    return expectation.kind === 'revise' ? 'Le retour n’est pas une correction de la même lecture.' : 'Le retour n’est pas une relecture du contexte.';
  }
  if (transition.reason !== expectation.reason) return 'Le motif de la nouvelle version diffère de celui confirmé.';
  if (transition.actor?.origin !== 'user') return 'La nouvelle version n’est pas attribuée à un geste du brasseur.';
  if (transition.parentRecordReference !== base.reference || transition.parentReadingReference !== base.sourceReadingReference) {
    return 'La filiation ne cite pas la version et la lecture d’origine exactes.';
  }
  if (expectation.kind === 'revise' && record.sourceReadingReference !== base.sourceReadingReference) {
    return 'Une correction garde la même lecture source; une relecture du contexte est un geste distinct.';
  }
  if (expectation.kind === 'reexamine' && record.sourceReadingReference === base.sourceReadingReference) {
    return 'Une relecture du contexte doit citer une nouvelle lecture source.';
  }
  const ledger = record.ledger;
  if (!ledger || !Array.isArray(ledger.entries) || !Array.isArray(ledger.sourceAnnotations)) return 'Le registre des termes est absent du retour.';
  if (base.ledger.entries.some((entry, index) => ledger.entries[index]?.reference !== entry.reference)) {
    return 'Le registre retourné ne conserve pas toute la trace précédente.';
  }
  const additions = expectation.actions.filter((action) => action.kind === 'add');
  if (ledger.sourceAnnotations.length !== base.ledger.sourceAnnotations.length + additions.length
    || base.ledger.sourceAnnotations.some((annotation, index) => !sameV4(ledger.sourceAnnotations[index], annotation))) {
    return 'Les annotations source retournées ne conservent pas l’ensemble précédent exact.';
  }
  const appended = ledger.entries.slice(base.ledger.entries.length);
  if (appended.length !== expectation.actions.length || appended.some((entry) => entry.decision?.actId !== expectation.commandId)) {
    return 'Le registre retourné ne contient pas exactement les actes envoyés.';
  }
  const priorById = new Map<string, AnswerRecord['ledger']['entries'][number]>();
  for (const entry of base.ledger.entries) priorById.set(entry.annotationId, entry);
  for (const action of expectation.actions) {
    const annotationId = action.kind === 'add' ? action.sourceAnnotation.id : action.annotationId;
    const entry = appended.find((row) => row.annotationId === annotationId);
    if (!entry || entry.decision.kind !== action.kind) return `L’acte « ${action.kind} » sur ${annotationId} n’a pas été enregistré tel quel.`;
    if (entry.decision.reason !== action.reason) return `Le motif enregistré pour ${annotationId} diffère de celui confirmé.`;
    if (action.kind === 'reject' ? entry.disposition !== 'rejected' || entry.activeIntent !== undefined
      : entry.disposition !== 'active' || !sameV4(entry.activeIntent, action.activeIntent)) {
      return `La projection enregistrée pour ${annotationId} diffère de celle confirmée.`;
    }
    if (action.kind === 'add') {
      const recordedSource = ledger.sourceAnnotations.find((annotation) => annotation.id === annotationId);
      if (entry.sourceKind !== 'added' || entry.additionActId !== expectation.commandId || entry.decision.predecessorEntryReference !== undefined
        || !sameV4(entry.sourceAnnotation, action.sourceAnnotation) || !sameV4(recordedSource, action.sourceAnnotation)) {
        return `L’ajout ${annotationId} n’est pas rattaché à son acte et à son annotation source exacts.`;
      }
    } else {
      const prior = priorById.get(annotationId);
      if (!prior || entry.decision.predecessorEntryReference !== prior.reference || !sameV4(entry.sourceAnnotation, prior.sourceAnnotation)
        || entry.sourceKind !== prior.sourceKind) {
        return `La décision sur ${annotationId} ne prolonge pas exactement sa trace précédente.`;
      }
    }
  }
  const latest = new Map<string, AnswerRecord['ledger']['entries'][number]>();
  for (const entry of ledger.entries) latest.set(entry.annotationId, entry);
  const activeIds = ledger.sourceAnnotations.filter((annotation) => latest.get(annotation.id)?.disposition === 'active').map((annotation) => annotation.id);
  if (expectation.expectedActiveIds && !sameV4([...activeIds].sort(), [...expectation.expectedActiveIds].sort())) {
    return 'Les termes retenus du retour ne correspondent pas à la lecture confirmée.';
  }
  const readingProblem = verifyReadingContextV4(expectation, record);
  if (readingProblem) return readingProblem;
  const expectedIntents = projectedIntentsForActionsV4(base, expectation.actions);
  if (!sameV4(expectedIntents.map((intent) => intent.id).sort(), [...activeIds].sort())) {
    return 'Le registre et les gestes envoyés ne produisent pas les mêmes termes actifs.';
  }
  const outcome = record.outcome;
  if (!activeIds.length) {
    if (outcome?.kind !== 'allRejected') return 'Sans terme retenu, aucune réponse ne doit être produite.';
  } else {
    if (outcome?.kind !== 'domainAnswer') return 'Une lecture avec des termes retenus doit porter sa réponse.';
    const answer = outcome.answerSnapshot;
    if (!answer || answer.reference !== outcome.answerReference || answer.requestSnapshot?.originalQuestion !== record.originalQuestion) {
      return 'La réponse retournée ne correspond pas à sa référence ou à la question.';
    }
    if (!sameV4(answer.requestSnapshot.propertyIntents, expectedIntents)) return 'La réponse ne porte pas exactement les projections retenues.';
    if (!sameV4(answer.requestSnapshot.interpretation, record.readingContext.interpretation)
      || !sameV4(answer.requestSnapshot.candidatePolicy, record.readingContext.candidatePolicy)
      || !sameV4(answer.requestSnapshot.exclusions, record.readingContext.exclusions)
      || !sameV4(answer.requestSnapshot.context, record.readingContext.context)) {
      return 'Le cadre exact de la réponse ne correspond pas au contexte enregistré dans cette version.';
    }
  }
  if (expectation.expectedAccess && !sameV4(record.readingContext?.context?.access, expectation.expectedAccess)) {
    return 'Les accès enregistrés ne sont pas ceux confirmés.';
  }
  return null;
}

export function verifyDossierResultV4(request: DossierRequest, result: unknown): string | null {
  const dossier = result as DossierRecord | null | undefined;
  if (!dossier || typeof dossier !== 'object' || dossier.format !== DOSSIER_FORMAT) return 'Le retour n’est pas un dossier de service V4.';
  if (dossier.answerRecordReference !== request.expectedRecordReference || dossier.answerReference !== request.expectedAnswerReference
    || dossier.ledgerReference !== request.expectedLedgerReference || dossier.strategyId !== request.strategyId
    || dossier.strategyReference !== request.expectedStrategyReference) {
    return 'Le dossier retourné ne correspond pas à la version, à la réponse ou à la voie choisies.';
  }
  const snapshot = dossier.dossierSnapshot;
  if (!snapshot || snapshot.reference !== dossier.dossierReference || snapshot.answerReference !== request.expectedAnswerReference
    || snapshot.interpretationReference !== request.expectedInterpretationReference || snapshot.strategyId !== request.strategyId
    || snapshot.strategyReference !== request.expectedStrategyReference) {
    return 'Le contenu du dossier ne cite pas exactement la réponse, la lecture et la voie choisies.';
  }
  if (snapshot.motive !== request.motive) return 'Le motif conservé diffère de celui envoyé.';
  return null;
}

/* ---------- preuves ---------- */
function LocalSourceV4({ source }: { source: HopSource }) {
  return <div className="hv-property-source">
    <b>{source.title}</b><span>{source.author}{source.year === null ? '' : ` · ${source.year}`} · {sourceKindLabels[source.kind] ?? 'Nature non précisée'}</span>
    {source.locator ? <span>{source.locator}</span> : null}
    <details><summary>Référence</summary><code>{source.reference}</code></details>
  </div>;
}

function AdoptedCultureProvenanceV4({ binding }: { binding: HopV55AdoptedContextBindingV1 }) {
  const culture = binding.culture.status === 'declared' ? binding.culture.value : undefined;
  const cultureLabel = !culture ? 'Aucune culture déclarée dans ce cadre.'
    : culture.state === 'single' ? 'Une souche déclarée'
      : culture.state === 'mixed' ? 'Culture mixte déclarée' : 'Culture inconnue déclarée';
  return <aside className="hv4-stage" aria-label="Cadre de culture adopté">
    <b>Cadre de culture adopté</b>
    <p>{binding.origin.description}</p>
    <dl className="hv4-dl">
      <div><dt>Proposé par</dt><dd>{binding.author.label} · {formatInstantV4(binding.createdAt)}</dd></div>
      <div><dt>Adopté par</dt><dd>{binding.adoption.adoptedBy.label} · {formatInstantV4(binding.adoption.adoptedAt)}</dd></div>
      <div><dt>Culture</dt><dd>{cultureLabel}</dd></div>
    </dl>
    {culture?.explanation ? <p>{culture.explanation}</p> : null}
    {culture?.members.length ? <details><summary>Éléments déclarés ({culture.members.length})</summary>
      <ul>{culture.members.map((member, index) => <li key={`${member.yeastId ?? member.name ?? 'member'}-${index}`}>
        <b>{member.name ?? 'Nom non renseigné'}</b>
        {member.proportion ? <small>Plage déclarée · {formatExactNumberV4(member.proportion.min)}–{formatExactNumberV4(member.proportion.max)}</small> : null}
        <details><summary>Identité de la souche</summary><code>{member.yeastId ?? 'Aucun identifiant renseigné'}</code></details>
        {member.source ? <details><summary>Source jointe à cette identité</summary><LocalSourceV4 source={member.source} /></details> : null}
      </li>)}</ul>
    </details> : null}
    <details><summary>Origine et références du cadre</summary>
      {binding.origin.sourceReference ? <p>Référence indiquée avec l’origine · <code>{binding.origin.sourceReference}</code></p> : null}
      {binding.hypotheses.length ? <ul>{binding.hypotheses.map((hypothesis, index) => <li key={`${index}-${hypothesis}`}>{hypothesis}</li>)}</ul> : null}
      <code>Cadre adopté · {binding.reference.id} · {binding.reference.version}</code>
      <code>Contenu exact · {binding.reference.contentReference}</code>
    </details>
  </aside>;
}

function AssertionV4({ assertion, answer }: { assertion: HopAdviceAssertion; answer: CoreAnswer | null }) {
  const value: unknown = assertion.value;
  const valueText = typeof value === 'boolean' ? (value ? 'oui' : 'non')
    : typeof value === 'number' ? `${value}${assertion.unit ? ` ${assertion.unit}` : ''}`
      : typeof value === 'string' && value.length <= 80 && !value.trim().startsWith('{') ? value : null;
  const raw = typeof value === 'string' && valueText === null ? value : null;
  return <article className="hv4-assertion">
    <b>{assertion.statement}</b>
    <span>{assertionStateLabels[assertion.state] ?? 'État non précisé'}{valueText ? ` · ${valueText}` : ''}</span>
    {raw ? <details><summary>Valeur conservée</summary><code>{raw}</code></details> : null}
    {assertion.source ? answer ? <SourceCard answer={answer} source={assertion.source} /> : <LocalSourceV4 source={assertion.source} />
      : assertion.id === 'adopted-context-culture' ? <small>La provenance du cadre adopté est indiquée séparément dans cette version.</small>
        : <small>Aucune source jointe à ce fait.</small>}
    <details><summary>Identité</summary><code>{assertion.id}</code></details>
  </article>;
}

function ArgumentV4({ answer, argumentId, number, anchorId, labelOf }: {
  answer: CoreAnswer; argumentId: string; number?: number; anchorId?: string; labelOf(id: string): string;
}) {
  const argument = answer.arguments.find((row) => row.id === argumentId);
  if (!argument) return null;
  const claims = answer.corpusSnapshot.claims.filter((claim) => argument.claimIds.includes(claim.id));
  const sources = [...new Map(claims.flatMap((claim) => answer.corpusSnapshot.sources.filter((row) => claim.sourceIds.includes(row.id)))
    .map((row) => [row.id, row])).values()];
  const assertions = answer.requestSnapshot.context.assertions.filter((row) => argument.assertionIds.includes(row.id));
  const materials = new Map(answer.requestSnapshot.materials.map((row) => [row.id, row]));
  return <article className="hv4-argument" id={anchorId} tabIndex={anchorId ? -1 : undefined}>
    <div className="hv4-argument-head">{number ? <span className="hv4-ref is-static">{number}</span> : null}
      <span className={`hv-property-kind hv-property-kind-${argument.kind}`}>{argumentKindLabels[argument.kind]}</span></div>
    <p>{argument.text}</p>
    {argument.intentIds.length ? <small>Termes : {argument.intentIds.map((id) => `« ${labelOf(id)} »`).join(' · ')}</small> : null}
    {assertions.length ? <details><summary>Faits de contexte ({assertions.length})</summary>
      {assertions.map((assertion) => <AssertionV4 key={assertion.id} assertion={assertion} answer={answer} />)}</details> : null}
    {argument.materialEvidence.length ? <details><summary>Comparaisons par matière ({argument.materialEvidence.length})</summary>
      {argument.materialEvidence.map((evidence, index) => <article className="hv-property-evaluation" key={`${evidence.materialId}-${evidence.intentId}-${index}`}>
        <b>{materials.get(evidence.materialId)?.name ?? 'Fiche non chargée'} · « {labelOf(evidence.intentId)} »</b>
        <EvaluationBody answer={answer} evaluation={evidence.evaluation} />
      </article>)}</details> : null}
    {claims.length ? <details><summary>Appuis documentaires et sources ({claims.length})</summary>
      {claims.map((claim) => <article className="hv-property-claim" key={claim.id}>
        <b>{claimRoleLabels[claim.role]} · {claim.statement}</b><small>Domaine : {claim.domain}</small>
        {claim.transferConditions.map((condition, index) => <small key={`transfer-${index}`}>Condition de transfert : {condition}</small>)}
        {claim.forbiddenInferences.map((inference, index) => <small key={`forbidden-${index}`}>À ne pas déduire : {inference}</small>)}
      </article>)}
      {sources.map((row) => <SourceCard answer={answer} source={row.source} key={row.id} />)}
    </details> : null}
  </article>;
}

/* ---------- une voie : différence, effets sur les gardes, geste de choix, puis détails ---------- */
function WayV4({ answer, strategy, index, rootId, guardIds, labelOf, kept, choice }: {
  answer: AnswerV3; strategy: Strategy; index: number; rootId: string; guardIds: ReadonlySet<string>;
  labelOf(id: string): string; kept: boolean; choice: ReactNode;
}) {
  const poolRef = useRef<HTMLDetailsElement>(null);
  const known = new Set(answer.arguments.map((row) => row.id));
  const pool = [...new Set([...strategy.effects.flatMap((row) => row.argumentIds), ...strategy.tradeoffs.flatMap((row) => row.argumentIds),
    ...strategy.nextSteps.flatMap((row) => row.argumentIds), ...strategy.argumentIds])].filter((id) => known.has(id));
  const numbers = new Map(pool.map((id, position) => [id, position + 1]));
  const anchor = (id: string) => `${rootId}-way${index}-reason${numbers.get(id)}`;
  const jump = (id: string) => {
    if (poolRef.current) poolRef.current.open = true;
    const target = document.getElementById(anchor(id));
    target?.focus();
    target?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  };
  const refs = (ids: readonly string[]) => {
    const shown = [...new Set(ids)].filter((id) => numbers.has(id));
    return shown.length ? <span className="hv4-reason-refs"><span>Raisons</span>{shown.map((id) => <button type="button" key={id} className="hv4-ref"
      aria-label={`Voir la raison ${numbers.get(id)} de la voie ${index + 1}`} onClick={() => jump(id)}>{numbers.get(id)}</button>)}</span> : null;
  };
  const intents = answer.requestSnapshot.propertyIntents;
  const ordered = [...intents.filter((intent) => guardIds.has(intent.id)), ...intents.filter((intent) => !guardIds.has(intent.id))];
  const guards = intents.filter((intent) => guardIds.has(intent.id));
  const effectOf = (intentId: string) => strategy.effects.find((row) => row.intentId === intentId);
  const materials = new Map(answer.requestSnapshot.materials.map((row) => [row.id, row]));
  const prep = strategy.preparation;
  return <details className={`hv4-way is-${strategy.applicability.status}`} id={`${rootId}-way-${index}`}>
    <summary>
      <span className="hv-property-way-index" aria-hidden="true">{index + 1}</span>
      <span className="hv4-way-head">
        <span className="hv4-way-title">{`Voie ${index + 1} · ${strategy.title}`}</span>
        <span className="hv4-way-kind">{contributionLabels[strategy.contribution]}{kept ? ' · dossier conservé' : ''}</span>
      </span>
      <span className="hv4-way-diff">{strategy.distinctiveReason}</span>
      <span className="hv4-way-guards">{guards.length ? guards.map((intent) => {
        const effect = effectOf(intent.id);
        return <span key={intent.id} className={`hv4-guard is-${effect?.status ?? 'none'}`}>
          {`« ${intent.label} » · ${effect ? effectStatusLabels[effect.status] : 'non qualifié par cette voie'}`}</span>;
      }) : <span className="hv4-guard is-none">Aucune garde déclarée</span>}</span>
      <span className={`hv-property-status hv-property-status-${strategy.applicability.status}`}>{applicabilityLabels[strategy.applicability.status]}</span>
    </summary>
    <div className="hv4-way-body">
      <p className="hv4-way-purpose">{strategy.purpose}</p>
      <ul className="hv4-effects" aria-label={`Effets par terme · voie ${index + 1}`}>{ordered.map((intent) => {
        const effect = effectOf(intent.id);
        return <li key={intent.id} className={`is-${effect?.status ?? 'none'}`}>
          <b>« {intent.label} »{guardIds.has(intent.id) ? ' · garde' : ''}</b>
          <span className="hv4-effect-status">{effect ? effectStatusLabels[effect.status] : 'Pas d’effet qualifié par cette voie'}</span>
          {effect ? <><p>{effect.text}</p>{refs(effect.argumentIds)}</> : null}
        </li>;
      })}</ul>
      {choice}
      <div className="hv4-way-details">
        {strategy.tradeoffs.length ? <details><summary>Compromis et limites ({strategy.tradeoffs.length})</summary>
          {strategy.tradeoffs.map((tradeoff, position) => <article key={`${position}-${tradeoff.text}`}><p>{tradeoff.text}</p>
            {tradeoff.intentIds.length ? <small>Termes : {tradeoff.intentIds.map((id) => `« ${labelOf(id)} »`).join(' · ')}</small> : null}
            {refs(tradeoff.argumentIds)}</article>)}
        </details> : null}
        {strategy.nextSteps.length ? <details><summary>Étapes suivantes ({strategy.nextSteps.length})</summary>
          {strategy.nextSteps.map((step, position) => <article key={`${position}-${step.text}`}><b>{nextStepLabels[step.kind]}</b><p>{step.text}</p>{refs(step.argumentIds)}</article>)}
        </details> : null}
        {strategy.applicability.conditions.length ? <details><summary>Conditions ({strategy.applicability.conditions.length})</summary>
          {strategy.applicability.conditions.map((condition) => <article key={condition.id}><b>{conditionStateLabels[condition.state]}</b><p>{condition.description}</p>
            {condition.intentIds.length ? <small>Termes : {condition.intentIds.map((id) => `« ${labelOf(id)} »`).join(' · ')}</small> : null}
            {condition.assertionIds.map((id) => {
              const assertion = answer.requestSnapshot.context.assertions.find((row) => row.id === id);
              return assertion ? <AssertionV4 key={id} assertion={assertion} answer={answer} /> : <code key={id}>Fait de contexte absent · {id}</code>;
            })}
            <details><summary>Référence de condition</summary><code>{condition.id}</code></details>
          </article>)}
        </details> : <p className="hv4-help">Aucune condition structurée n’est fournie pour cette voie.</p>}
        {prep.missingRequirements.length || prep.refusalReasons.length ? <details><summary>À qualifier · motifs d’écart ({prep.missingRequirements.length + prep.refusalReasons.length})</summary>
          {prep.missingRequirements.map((item, position) => <p key={`missing-${position}`}>À qualifier : {item}</p>)}
          {prep.refusalReasons.map((item, position) => <p key={`refusal-${position}`}>Motif d’écart : {item}</p>)}
        </details> : null}
        {pool.length ? <details ref={poolRef}><summary>Raisons et sources de cette voie ({pool.length})</summary>
          <div className="hv4-arguments">{pool.map((id) => <ArgumentV4 key={id} answer={answer} argumentId={id} number={numbers.get(id)} anchorId={anchor(id)} labelOf={labelOf} />)}</div>
        </details> : null}
        {strategy.candidateIds.length ? <details><summary>Matières associées ({strategy.candidateIds.length})</summary>
          <ul>{strategy.candidateIds.map((id) => <li key={id}>{materials.get(id)?.name ?? 'Identité demandée, fiche non chargée'} <code>{id}</code></li>)}</ul>
        </details> : null}
        {strategy.documentaryProductRefs.length ? <details><summary>Produits cités ({strategy.documentaryProductRefs.length})</summary>
          {strategy.documentaryProductRefs.map((product) => <article key={product.id}><b>{product.name}</b>
            <p>Produit documentaire : aucune matière, disponibilité ou autorisation d’emploi n’en découle.</p>
            {product.claimIds.map((id) => {
              const claim = answer.corpusSnapshot.claims.find((row) => row.id === id);
              return claim ? <article className="hv-property-claim" key={id}><p>{claimRoleLabels[claim.role]} · {claim.statement}</p>
                {claim.sourceIds.map((sourceId) => { const source = answer.corpusSnapshot.sources.find((row) => row.id === sourceId);
                  return source ? <SourceCard answer={answer} source={source.source} key={sourceId} /> : null; })}
              </article> : <code key={id}>Appui absent · {id}</code>;
            })}
            <details><summary>Identifiant produit</summary><code>{product.id}</code></details>
          </article>)}
        </details> : null}
        <details><summary>Portée et références de cette voie</summary>
          <dl className="hv4-dl">
            <div><dt>Portée</dt><dd>{scopeLabels[strategy.scope]}</dd></div>
            <div><dt>Intervention</dt><dd>{interventionLabels[strategy.intervention]}</dd></div>
            <div><dt>Choix documentaire</dt><dd>{prep.documentaryDossier.status === 'available' ? preparationLabels[prep.documentaryDossier.kind] : 'Indisponible'} · {prep.documentaryDossier.label}</dd></div>
            <div><dt>Suite opérationnelle</dt><dd>{prep.operational.reason}{prep.operational.adapterId ? <code> {prep.operational.adapterId}</code> : null}</dd></div>
            <div><dt>Voie</dt><dd><code>{strategy.id}</code> · <code>{strategy.reference}</code></dd></div>
          </dl>
        </details>
      </div>
    </div>
  </details>;
}

type ReexaminationLineageV4 =
  | { status: 'found'; reviewed: AnswerRecord; previous?: AnswerRecord; previousUnavailable: boolean }
  | { status: 'legacyOrigin'; version: AnswerRecord }
  | { status: 'unavailable'; reason: 'missingV4Parent' | 'conflictingLineage' }
  | { status: 'none' };

/** Follows exact parent references only; an absent, conflicting or cyclic link is never guessed. */
function findReexaminationLineageV4(record: AnswerRecord, records: readonly AnswerRecord[]): ReexaminationLineageV4 {
  const byReference = new Map<string, AnswerRecord>();
  const ambiguous = new Set<string>();
  for (const row of records) {
    const previous = byReference.get(row.reference);
    if (previous && !sameV4(previous, row)) ambiguous.add(row.reference);
    else if (!previous) byReference.set(row.reference, row);
  }
  let cursor = record;
  const visited = new Set<string>();
  for (let depth = 0; depth < Math.min(64, records.length + 1); depth += 1) {
    if (cursor.transition.kind === 'reexamine') {
      const parentReference = cursor.transition.parentRecordReference;
      const previous = parentReference && !ambiguous.has(parentReference) ? byReference.get(parentReference) : undefined;
      return { status: 'found', reviewed: cursor, ...(previous ? { previous } : {}),
        previousUnavailable: !!parentReference && (!previous || ambiguous.has(parentReference)) };
    }
    if (cursor.transition.kind === 'upgradeV3') return { status: 'legacyOrigin', version: cursor };
    const parentReference = cursor.transition.parentRecordReference;
    if (!parentReference) return cursor.transition.kind === 'create' ? { status: 'none' }
      : { status: 'unavailable', reason: 'missingV4Parent' };
    if (visited.has(cursor.reference) || visited.has(parentReference) || ambiguous.has(parentReference)) {
      return { status: 'unavailable', reason: 'conflictingLineage' };
    }
    visited.add(cursor.reference);
    const parent = byReference.get(parentReference);
    if (!parent) return { status: 'unavailable', reason: 'missingV4Parent' };
    cursor = parent;
  }
  return { status: 'unavailable', reason: 'conflictingLineage' };
}

/* ---------- repère de contexte relu : la version affichée peut venir après le réexamen ---------- */
function ReexamNoticeV4({ record, lineage, canPrecise, onPrecise, onOpenRelated }: {
  record: AnswerRecord; lineage: Exclude<ReexaminationLineageV4, { status: 'none' }>;
  canPrecise: boolean; onPrecise(): void; onOpenRelated?(): void;
}) {
  if (lineage.status === 'legacyOrigin') return <div className="hv-property-context-notice hv4-notice" role="note">
    <strong>Contexte repris d’une réponse antérieure</strong>
    <p>Cette version reprend le contexte d’une réponse antérieure. L’historique disponible n’identifie pas de relecture V4 avant cette reprise.</p>
    {canPrecise ? <div className="hv4-fix-row"><button type="button" onClick={onPrecise}>Préciser les accès de cette version</button></div> : null}
  </div>;

  if (lineage.status === 'unavailable') return <div className="hv-property-context-notice hv4-notice" role="note">
    <strong>{lineage.reason === 'missingV4Parent' ? 'Version précédente non disponible' : 'Historique des versions incohérent'}</strong>
    <p>{lineage.reason === 'missingV4Parent'
      ? 'La version précédente citée dans cet historique n’est pas chargée. Les accès affichés ici ne sont pas présentés comme ayant été relus auparavant.'
      : 'Les références de versions se contredisent ou se répètent. Les accès affichés ici ne sont pas présentés comme ayant été relus auparavant.'}</p>
    {canPrecise ? <div className="hv4-fix-row"><button type="button" onClick={onPrecise}>Préciser les accès de cette version</button></div> : null}
  </div>;

  const reviewed = lineage.reviewed;
  const sameVersion = reviewed.reference === record.reference;
  const reviewedAccess = reviewed.readingContext.context.access;
  const currentAccess = record.readingContext.context.access;
  const unknownAtReview = ACCESS_SCOPES_V4.filter((scope) => reviewedAccess[scope].state === 'unknown');
  const changedSinceReview = sameVersion ? [] : ACCESS_SCOPES_V4.filter((scope) => !sameV4(reviewedAccess[scope], currentAccess[scope]));
  const accessBeforeReview = lineage.previous?.readingContext.context.access;
  const changedAtReview = sameVersion && accessBeforeReview
    ? ACCESS_SCOPES_V4.filter((scope) => !sameV4(accessBeforeReview[scope], reviewedAccess[scope])) : [];
  const stageChangedAfterReview = !sameVersion && record.readingContext.context.stage !== reviewed.readingContext.context.stage;
  const openLabel = sameVersion ? 'Voir la version précédente' : 'Voir la version relue';
  const preciseLabel = sameVersion ? 'Préciser les accès de cette lecture' : 'Préciser les accès de cette version';
  return <div className="hv-property-context-notice hv4-notice" role="note">
    <strong>{sameVersion ? 'Contexte relu pour cette version' : 'Contexte relu dans une version précédente'}</strong>
    <p>Stade retenu lors de la relecture : {stageLabels[reviewed.readingContext.context.stage] ?? 'stade non précisé'} · {formatInstantV4(reviewed.transition.recordedAt)} · motif : {reviewed.transition.reason}</p>
    {unknownAtReview.length ? <p>Accès inconnus lors de la relecture : {unknownAtReview.map((scope) => accessScopeLabelsV4[scope].toLocaleLowerCase('fr-CH')).join(', ')}.</p> : null}
    {sameVersion && changedAtReview.length ? <div className="hv4-notice-diff"><p>Déclaration de la version précédente, non reprise ici :</p>
      <ul>{changedAtReview.map((scope) => <li key={scope}>{accessScopeLabelsV4[scope]} · avant : {accessStateLabelsV4[accessBeforeReview![scope].state]} ({accessBeforeReview![scope].basis}) · cette version : {accessStateLabelsV4[reviewedAccess[scope].state]} ({reviewedAccess[scope].basis})</li>)}</ul></div> : null}
    {!sameVersion && changedSinceReview.length ? <div className="hv4-notice-diff"><p>Accès déclarés ou corrigés après la relecture dans cette version :</p>
      <ul>{changedSinceReview.map((scope) => <li key={scope}>{accessScopeLabelsV4[scope]} · lors de la relecture : {accessStateLabelsV4[reviewedAccess[scope].state]} ({reviewedAccess[scope].basis}) · maintenant : {accessStateLabelsV4[currentAccess[scope].state]} ({currentAccess[scope].basis})
        {currentAccess[scope].assertionIds.length ? <details><summary>Attestation de cette version</summary>{currentAccess[scope].assertionIds.map((id) => <code key={id}>{id}</code>)}</details> : null}</li>)}</ul></div> : null}
    {!sameVersion && !changedSinceReview.length ? <p>Les accès de cette version sont identiques à ceux relus.</p> : null}
    {stageChangedAfterReview ? <p>Stade de la version affichée : {stageLabels[record.readingContext.context.stage] ?? 'stade non précisé'} · {record.readingContext.context.stageBasis}</p> : null}
    {sameVersion && lineage.previousUnavailable ? <p>La version antérieure à cette relecture n’est pas chargée; sa comparaison reste indisponible.</p> : null}
    {canPrecise || onOpenRelated ? <div className="hv4-fix-row">
      {canPrecise ? <button type="button" onClick={onPrecise}>{preciseLabel}</button> : null}
      {onOpenRelated ? <button type="button" onClick={onOpenRelated}>{openLabel}</button> : null}
    </div> : null}
  </div>;
}

export function HopV55PropertyAdviceDecisionV4({ record, previousRecords = [], dossiers = [], materialChoices = [], readOnly = false,
  onCorrect, onSaveDossier, onReexamine, onDisplayedRecordChange, onSearchMaterials, onSelectMaterials }: HopV55PropertyAdviceDecisionV4Props) {
  const rootId = useId().replace(/:/g, '');
  const [head, setHead] = useState<AnswerRecord>(record);
  const headRef = useRef<AnswerRecord>(record);
  const [localHistory, setLocalHistory] = useState<AnswerRecord[]>([]);
  const [viewedReference, setViewedReference] = useState<string>();
  const [draft, setDraft] = useState<V4AnnotationDraft>();
  const [motive, setMotive] = useState<string | null>(null);
  const [ownReading, setOwnReading] = useState<string | null>(null);
  const [inflight, setInflight] = useState<{ kind: CommandKind; commandId: string }>();
  const activeCommandRef = useRef<string | undefined>(undefined);
  const [failedCorrection, setFailedCorrection] = useState<{ request: CorrectionRequest; expectation: V4RecordExpectation }>();
  const [failedReexam, setFailedReexam] = useState<{ request: ReexaminationRequest; expectation: V4RecordExpectation }>();
  const [correctionError, setCorrectionError] = useState('');
  const [reexamError, setReexamError] = useState('');
  const [notice, setNotice] = useState('');
  const [lateNotice, setLateNotice] = useState('');
  const [reexamOpen, setReexamOpen] = useState(false);
  const [reexamReason, setReexamReason] = useState('');
  const [accessNonce, setAccessNonce] = useState(0);
  const [motiveByStrategy, setMotiveByStrategy] = useState<Record<string, string>>({});
  const [savingDossier, setSavingDossier] = useState<string>();
  const [failedDossier, setFailedDossier] = useState<{ request: DossierRequest; message: string }>();
  const [savedDossiers, setSavedDossiers] = useState<DossierRecord[]>([]);
  const [dossierNotice, setDossierNotice] = useState('');
  const readingRef = useRef<HTMLElement>(null);
  const waysRef = useRef<HTMLElement>(null);
  const candidatesRef = useRef<HTMLElement>(null);
  const versionsRef = useRef<HTMLElement>(null);
  const contextRef = useRef<HTMLElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const displayedRef = useRef<AnswerRecord>(record);

  /* Un geste saisi sur la version A (motif de relecture, motif de dossier, reçu affiché) ne se présente jamais comme geste sur B. */
  const separateGestures = () => {
    setReexamOpen(false); setReexamReason(''); setReexamError(''); setFailedReexam(undefined);
    setMotiveByStrategy({}); setFailedDossier(undefined); setDossierNotice('');
  };
  const replaceHead = (next: AnswerRecord) => {
    const previous = headRef.current;
    if (previous.reference !== next.reference) {
      setLocalHistory((rows) => rows.some((row) => row.reference === previous.reference) ? rows : [...rows, previous]);
      separateGestures();
    }
    headRef.current = next;
    setHead(next);
  };

  /* Nouvelle tête reçue du parent : l’ancienne reste consultable; un geste non confirmé n’est pas reporté sur elle. */
  useEffect(() => {
    if (record.reference === headRef.current.reference) return;
    const ownResult = !!activeCommandRef.current && record.transition.actId === activeCommandRef.current;
    replaceHead(record);
    setViewedReference(undefined);
    if (ownResult) return;
    const discarded = !!draft || !!activeCommandRef.current;
    activeCommandRef.current = undefined;
    setInflight(undefined); setDraft(undefined); setMotive(null); setOwnReading(null);
    setFailedCorrection(undefined); setFailedReexam(undefined); setCorrectionError(''); setReexamError(''); setReexamOpen(false);
    setNotice(discarded ? 'Une autre version courante a été reçue. Ta correction en cours n’a pas été reportée sur elle; refais tes gestes si besoin.' : '');
  }, [record.reference]);

  const versions = useMemo(() => {
    const byReference = new Map<string, AnswerRecord>();
    for (const row of [head, ...localHistory, ...previousRecords]) if (!byReference.has(row.reference)) byReference.set(row.reference, row);
    return [...byReference.values()].sort((left, right) => (Date.parse(right.transition.recordedAt) || 0) - (Date.parse(left.transition.recordedAt) || 0));
  }, [head, localHistory, previousRecords]);
  const displayed = viewedReference ? versions.find((row) => row.reference === viewedReference) ?? head : head;
  const notifiedDisplayedIdentityRef = useRef<string | undefined>(undefined);
  const notifyDisplayedRecordChange = useCallback((target: AnswerRecord) => {
    if (!onDisplayedRecordChange) return;
    const identity = displayedRecordIdentityV4(target);
    const key = JSON.stringify(identity);
    if (notifiedDisplayedIdentityRef.current === key) return;
    notifiedDisplayedIdentityRef.current = key;
    onDisplayedRecordChange(identity);
  }, [onDisplayedRecordChange]);
  const showDisplayedRecord = (target: AnswerRecord) => {
    setViewedReference(target.reference === head.reference ? undefined : target.reference);
    notifyDisplayedRecordChange(target);
  };
  useEffect(() => {
    // The prop head can change before local state is synchronized; don't publish the old local row during that render.
    if (record.reference === head.reference) notifyDisplayedRecordChange(displayed);
  }, [record.reference, head.reference, displayed, notifyDisplayedRecordChange]);
  const reexaminationLineage = useMemo(() => findReexaminationLineageV4(displayed, [head, ...localHistory, ...previousRecords]),
    [displayed, head, localHistory, previousRecords]);
  displayedRef.current = displayed;
  const viewingHistory = displayed.reference !== head.reference;
  const answer = answerOf(displayed);
  const canCorrect = !readOnly && !viewingHistory && !!onCorrect;
  const busy = !!inflight;

  const headAnnotations = useMemo(() => ledgerAnnotationsV4(head.ledger), [head]);
  const displayedAnnotations = useMemo(() => displayed.reference === head.reference ? headAnnotations : ledgerAnnotationsV4(displayed.ledger),
    [displayed, head, headAnnotations]);
  const labels = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of displayedAnnotations) map.set(row.annotationId, (row.active ?? row.lastActive ?? row.source).label);
    for (const intent of answer?.requestSnapshot.propertyIntents ?? []) map.set(intent.id, intent.label);
    return map;
  }, [displayedAnnotations, answer]);
  const labelOf = (id: string): string => labels.get(id) ?? 'terme hors de cette lecture';

  /* ---------- brouillon de correction (toujours sur la tête) ---------- */
  const draftRows = useMemo(() => annotationRowsV4(headAnnotations, draft), [headAnnotations, draft]);
  const projected = useMemo(() => projectedActiveV4(draftRows), [draftRows]);
  const ownReadingChanged = ownReading !== null && !!ownReading.trim() && ownReading.trim() !== head.readingContext.interpretation.text;
  const readingItem: V4ChangeItem[] = ownReadingChanged && ownReading ? [{ key: 'reading', title: 'Résumé de lecture',
    changes: [{ field: 'Résumé', before: head.readingContext.interpretation.text, after: ownReading.trim() }], line: 'Reformuler le résumé de lecture.' }] : [];
  const changeItems = draft ? [...changeItemsV4(draftRows, draft, head.readingContext), ...readingItem] : [];
  const changeLines = changeItems.map((item) => item.line);
  const composedMotive = changeLines.join('\n');
  const effectiveMotive = (motive ?? composedMotive).trim();
  const actions = draft ? annotationActionsV4(headAnnotations, draft, effectiveMotive) : [];
  const contextChanged = !!draft && !sameV4(draft.readingContext, head.readingContext);
  const refreshesProposal = actions.length > 0 && !contextChanged
    && head.readingContext.interpretation.origin === 'proposal';
  const hasChanges = actions.length > 0 || contextChanged || ownReadingChanged;
  const changeCount = Math.max(changeLines.length, hasChanges ? 1 : 0);
  const blockers = draft ? draftBlockersV4(draftRows, draft.readingContext) : null;
  const blockerCount = blockers ? blockers.links.length + blockers.compensation.length : 0;
  const canSubmit = canCorrect && !!draft && hasChanges && !blockerCount && !!effectiveMotive && !busy && (ownReading === null || !!ownReading.trim());

  const updateDraft = (update: (current: V4AnnotationDraft) => V4AnnotationDraft) => {
    if (inflight) return;
    setDraft((current) => update(current ?? emptyAnnotationDraftV4(headRef.current.reference, headRef.current.readingContext,
      answerOf(headRef.current)?.requestSnapshot.materials ?? [])));
    setFailedCorrection(undefined); setCorrectionError(''); setNotice('');
  };
  const discardDraft = () => {
    setDraft(undefined); setMotive(null); setOwnReading(null); setFailedCorrection(undefined); setCorrectionError('');
  };

  const runCommand = async (kind: CommandKind, request: CorrectionRequest | ReexaminationRequest, expectation: V4RecordExpectation) => {
    const call = kind === 'revise' ? onCorrect && (() => onCorrect(request as CorrectionRequest))
      : onReexamine && (() => onReexamine(request as ReexaminationRequest));
    if (!call) return;
    activeCommandRef.current = request.commandId;
    setInflight({ kind, commandId: request.commandId });
    setLateNotice(''); setNotice('');
    if (kind === 'revise') setCorrectionError(''); else setReexamError('');
    try {
      const result = await call();
      const stillActive = activeCommandRef.current === request.commandId;
      const installedByParent = !!result && typeof result === 'object' && result.reference === headRef.current.reference
        && result.transition?.actId === request.commandId;
      if (!stillActive && !installedByParent) {
        setLateNotice(`Une ${kind === 'revise' ? 'correction' : 'relecture'} envoyée plus tôt (acte ${shortRef(request.commandId)}) a répondu après un changement de version. Elle n’est pas présentée comme réussie ici; la version affichée reste celle reçue.`);
        return;
      }
      const problem = verifyRecordResultV4(expectation, result);
      if (problem) throw new Error(problem);
      replaceHead(result);
      if (kind === 'revise') { setDraft(undefined); setMotive(null); setOwnReading(null); setFailedCorrection(undefined); }
      else { setReexamOpen(false); setReexamReason(''); setFailedReexam(undefined); }
      setNotice(kind === 'reexamine'
        ? 'Contexte relu : nouvelle version conservée. Tes termes sont repris; vérifie les accès indiqués.'
        : result.outcome.kind === 'allRejected'
          ? 'Nouvelle lecture conservée : tous les termes sont écartés. La question reste conservée, sans conseil; tu peux restaurer ou ajouter un terme.'
          : 'Nouvelle lecture conservée. La version précédente reste consultable dans les versions.');
    } catch (cause) {
      if (activeCommandRef.current !== request.commandId) return;
      const message = cause instanceof Error && cause.message ? cause.message : 'La demande n’a pas abouti; la version affichée reste intacte.';
      if (kind === 'revise') { setFailedCorrection({ request: request as CorrectionRequest, expectation }); setCorrectionError(message); }
      else { setFailedReexam({ request: request as ReexaminationRequest, expectation }); setReexamError(message); }
    } finally {
      if (activeCommandRef.current === request.commandId) { activeCommandRef.current = undefined; setInflight(undefined); }
    }
  };

  const submitCorrection = () => {
    if (!draft || !onCorrect || !canCorrect || busy) return;
    if (draft.baseRecordReference !== head.reference) { setCorrectionError('La version courante a changé; refais tes gestes sur elle.'); return; }
    if (blockerCount) { setCorrectionError('Résous d’abord les liens indiqués; rien n’est retiré à ta place.'); return; }
    if (!effectiveMotive) { setCorrectionError('Indique le motif de cette nouvelle lecture.'); return; }
    if (!hasChanges) return;
    const readingContext = withoutUndefinedV4(structuredClone(draft.readingContext));
    if (ownReadingChanged && ownReading) {
      readingContext.interpretation = { ...readingContext.interpretation, id: `property-interpretation-${uuid()}`, text: ownReading.trim(), origin: 'user' };
    }
    const commandId = `property-advice-v4-correction-${uuid()}`;
    const request: CorrectionRequest = { commandId, expectedRecordReference: head.reference, expectedLedgerReference: head.ledger.reference,
      actions: structuredClone(actions), readingContext, reason: effectiveMotive };
    const allowProposalRefresh = request.actions.length > 0 && sameV4(readingContext, head.readingContext)
      && head.readingContext.interpretation.origin === 'proposal';
    void runCommand('revise', request, { kind: 'revise', base: head, commandId, reason: request.reason, actions: request.actions,
      expectedReadingContext: readingContext, allowProposalRefresh,
      expectedActiveIds: projected.map((intent) => intent.id), expectedAccess: readingContext.context.access });
  };

  const submitReexam = () => {
    if (!onReexamine || readOnly || viewingHistory || busy) return;
    if (hasChanges) { setReexamError('Confirme ou abandonne d’abord ta correction en cours.'); return; }
    const reason = reexamReason.trim();
    if (!reason) { setReexamError('Dis pourquoi relire cette lecture avec le contexte actuel.'); return; }
    const commandId = `property-advice-v4-reexamination-${uuid()}`;
    const request: ReexaminationRequest = { commandId, expectedRecordReference: head.reference, expectedLedgerReference: head.ledger.reference, reason };
    void runCommand('reexamine', request, { kind: 'reexamine', base: head, commandId, reason, actions: [],
      expectedReadingContext: head.readingContext, allowProposalRefresh: head.readingContext.interpretation.origin === 'proposal',
      expectedActiveIds: headAnnotations.filter((row) => row.disposition === 'active').map((row) => row.annotationId) });
  };

  /* ---------- dossiers : liés à une seule version et une seule réponse ---------- */
  const allDossiers = useMemo(() => [...new Map([...dossiers, ...savedDossiers].map((row) => [row.reference, row])).values()], [dossiers, savedDossiers]);
  const displayedDossiers = allDossiers.filter((row) => row.answerRecordReference === displayed.reference);
  const canSaveDossier = !readOnly && !viewingHistory && !!onSaveDossier && !!answer;

  const runDossier = async (request: DossierRequest) => {
    if (!onSaveDossier) return;
    setSavingDossier(request.commandId); setFailedDossier(undefined); setDossierNotice('');
    try {
      const result = await onSaveDossier(request);
      const problem = verifyDossierResultV4(request, result);
      if (problem) throw new Error(problem);
      setSavedDossiers((rows) => rows.some((row) => row.reference === result.reference) ? rows : [...rows, result]);
      setDossierNotice(displayedRef.current.reference === request.expectedRecordReference
        ? 'Dossier documentaire conservé pour cette version. Aucune opération, recette ou réservation n’a été créée.'
        : 'Un dossier demandé sur une autre version a répondu; il reste rattaché à cette version-là.');
    } catch (cause) {
      setFailedDossier({ request, message: cause instanceof Error && cause.message ? cause.message : 'Le dossier n’a pas été conservé.' });
    } finally { setSavingDossier(undefined); }
  };
  /* Motif de dossier rattaché à la version ET à la voie exactes : un même strategyId sur une autre version repart vide. */
  const motiveKey = (strategy: Strategy) => `${displayed.reference}::${strategy.reference}`;
  const saveDossier = (strategy: Strategy) => {
    if (!answer || displayed.outcome.kind !== 'domainAnswer' || !canSaveDossier || savingDossier) return;
    const motiveText = motiveByStrategy[motiveKey(strategy)]?.trim();
    if (!motiveText) return;
    void runDossier({ commandId: `property-advice-v4-dossier-${uuid()}`, expectedRecordReference: displayed.reference,
      expectedLedgerReference: displayed.ledger.reference, expectedAnswerReference: displayed.outcome.answerReference,
      expectedInterpretationReference: answer.interpretationReference, strategyId: strategy.id, expectedStrategyReference: strategy.reference,
      motive: motiveText });
  };

  /* ---------- rendu ---------- */
  const transition = displayed.transition;
  const parentVersion = transition.parentRecordReference ? versions.find((row) => row.reference === transition.parentRecordReference) : undefined;
  const guardIds = new Set((answer?.requestSnapshot.propertyIntents ?? []).filter(isGuard).map((intent) => intent.id));
  const activeCount = displayedAnnotations.filter((row) => row.disposition === 'active').length;
  const rejectedCount = displayedAnnotations.length - activeCount;
  const context = displayed.readingContext;
  const preciseAccess = () => { setAccessNonce((value) => value + 1); scrollToElement(readingRef.current); };

  const choiceFor = (strategy: Strategy, index: number): ReactNode => {
    const kept = displayedDossiers.find((row) => row.strategyId === strategy.id && row.strategyReference === strategy.reference);
    const prep = strategy.preparation;
    const operational = prep.operational.status === 'requiresReceivedAdapter'
      ? 'Une préparation opérationnelle se vérifie séparément; conserver ce dossier ne l’ouvre pas.'
      : 'Aucune application physique n’est fournie : la voie reste documentaire.';
    const failedHere = failedDossier?.request.strategyId === strategy.id && failedDossier.request.expectedRecordReference === displayed.reference ? failedDossier : undefined;
    return <div className="hv4-choice">
      {kept ? <p className="hv4-kept" role="status">Dossier conservé · motif : {kept.dossierSnapshot.motive}</p>
        : prep.documentaryDossier.status !== 'available' ? <p className="hv4-help">Aucun dossier possible pour cette voie : {prep.documentaryDossier.label}</p>
          : canSaveDossier ? <>
            <label className="hv4-field"><span>Pourquoi conserver cette voie ?</span>
              <Textarea rows={2} value={motiveByStrategy[motiveKey(strategy)] ?? ''} disabled={!!savingDossier}
                placeholder="Ex. : je veux comparer les compensations avant de toucher à la recette."
                onChange={(event) => { const value = event.target.value, key = motiveKey(strategy); setMotiveByStrategy((rows) => ({ ...rows, [key]: value }));
                  if (failedHere) setFailedDossier(undefined); }} /></label>
            {failedHere ? <>
              <p className="hv-property-error" role="alert">{failedHere.message}</p>
              <button type="button" className="hv4-primary" disabled={!!savingDossier} onClick={() => void runDossier(failedHere.request)}>
                {savingDossier ? 'Envoi…' : 'Réessayer le même choix'}</button>
            </> : <button type="button" className="hv4-primary" aria-label={`Conserver la voie ${index + 1} · ${strategy.title}`}
              disabled={!!savingDossier || !motiveByStrategy[motiveKey(strategy)]?.trim()} onClick={() => saveDossier(strategy)}>
              {savingDossier ? 'Envoi…' : 'Conserver cette voie'}</button>}
          </> : null}
      <p className="hv4-help">{operational} Ce dossier ne crée ni opération, ni recette, ni réservation de stock.</p>
    </div>;
  };

  const tray = canCorrect && draft && hasChanges ? <div className="hv4-tray" ref={trayRef} role="group" aria-labelledby={`${rootId}-tray-title`}>
    <div className="hv4-tray-head"><h4 id={`${rootId}-tray-title`}>Nouvelle lecture à confirmer</h4>
      <span>{plural(changeCount, 'changement', 'changements')} · rien n’est enregistré avant ta confirmation</span></div>
    {changeItems.length ? <ul className="hv4-change-list" aria-label="Ce qui sera conservé">{changeItems.map((item) => <li key={item.key}>
      <b>{item.title}</b>{item.reason ? <span className="hv4-change-reason"> · motif : {item.reason}</span> : null}
      {item.changes.length ? <dl className="hv4-diff">{item.changes.map((change) => <div key={change.field}>
        <dt>{change.field}</dt><dd><del>{change.before}</del> <span aria-hidden="true">→</span> <ins>{change.after}</ins></dd>
      </div>)}</dl> : null}
    </li>)}</ul> : null}
    {!projected.length ? <p className="hv4-warn" role="status">Tous les termes seront écartés : la question restera conservée sans conseil, sans voie ni dossier. Tu pourras ensuite restaurer ou ajouter un terme.</p> : null}
    {blockers && blockerCount ? <DraftBlockersV4 blockers={blockers} rows={draftRows} readingContext={draft.readingContext} onUpdateDraft={updateDraft} disabled={busy} /> : null}
    <fieldset className="hv4-picks hv4-reading-choice"><legend>Résumé de lecture</legend>
      <label className={`hv4-pick ${ownReading === null ? 'is-on' : ''}`}><input type="radio" name={`${rootId}-reading-text`} checked={ownReading === null} disabled={busy}
        onChange={() => { setOwnReading(null); setFailedCorrection(undefined); }} /><span>{refreshesProposal ? 'Actualiser le résumé proposé après confirmation' : 'Garder le résumé enregistré'}</span></label>
      <label className={`hv4-pick ${ownReading !== null ? 'is-on' : ''}`}><input type="radio" name={`${rootId}-reading-text`} checked={ownReading !== null} disabled={busy}
        onChange={() => { setOwnReading(head.readingContext.interpretation.text); setFailedCorrection(undefined); }} /><span>Le formuler moi-même</span></label>
      {ownReading === null ? <p className="hv4-help">{refreshesProposal
        ? 'Le résumé proposé sera actualisé à la confirmation pour refléter les termes retenus.'
        : <>« {head.readingContext.interpretation.text} » — enregistré pour la version courante.</>}</p>
        : <Textarea rows={3} value={ownReading} disabled={busy} aria-label="Résumé de lecture formulé par toi"
          onChange={(event) => { setOwnReading(event.target.value); setFailedCorrection(undefined); }} />}
    </fieldset>
    <label className="hv4-field"><span>Motif de cette nouvelle lecture</span>
      <Textarea rows={Math.min(6, Math.max(2, changeLines.length))} value={motive ?? composedMotive} disabled={busy} aria-label="Motif de la nouvelle lecture"
        onChange={(event) => { setMotive(event.target.value); setFailedCorrection(undefined); setCorrectionError(''); }} />
      <small>{motive === null ? 'Rempli depuis tes gestes; tu peux le reformuler.' : 'Motif reformulé par toi.'}</small></label>
    {motive !== null ? <button type="button" className="hv4-link" disabled={busy} onClick={() => setMotive(null)}>Reprendre le motif depuis mes gestes</button> : null}
    {correctionError ? <p className="hv-property-error" role="alert">{correctionError}</p> : null}
    <div className="hv4-actions">
      {failedCorrection ? <button type="button" className="hv4-primary" disabled={busy} onClick={() => void runCommand('revise', failedCorrection.request, failedCorrection.expectation)}>
        {busy ? 'Envoi…' : 'Réessayer la même correction'}</button>
        : <button type="button" className="hv4-primary" disabled={!canSubmit} onClick={submitCorrection}>{busy ? 'Envoi…' : 'Confirmer la nouvelle lecture'}</button>}
      <button type="button" className="hv4-secondary" disabled={busy} onClick={discardDraft}>Abandonner ces changements</button>
    </div>
    {failedCorrection ? <p className="hv4-help">La même commande (même acte, mêmes données) sera renvoyée. Toute modification devient un nouveau geste.</p> : null}
  </div> : null;

  return <section className="hop-v55 hv-property-advice hv4" aria-labelledby={`${rootId}-title`}>
    <header className="hv-property-header hv4-header">
      <div>
        <p className="hv-property-eyebrow">Conseil documentaire</p>
        <h2 id={`${rootId}-title`}>{answer ? 'Réponse documentaire' : 'Lecture conservée, sans conseil'}</h2>
        <p className="hv4-version">{viewingHistory ? 'Version antérieure' : 'Version courante'} · {transitionLabels[transition.kind]} · {formatInstantV4(transition.recordedAt)} · {transition.actor.label}
          {' · '}{plural(activeCount, 'terme retenu', 'termes retenus')}{rejectedCount ? ` · ${plural(rejectedCount, 'écarté', 'écartés')}` : ''}</p>
        {viewingHistory ? <p className="hv-property-banner" role="status">Version du {formatInstantV4(transition.recordedAt)}, affichée telle qu’enregistrée et en lecture seule.
          {hasChanges ? ' Ta correction en cours reste sur la version courante.' : ''}
          <button type="button" className="hv4-secondary" onClick={() => showDisplayedRecord(head)}>Revenir à la version courante</button></p>
          : readOnly ? <p className="hv-property-banner" role="status">Cette lecture est affichée en lecture seule.</p> : null}
        {reexaminationLineage.status !== 'none' ? <ReexamNoticeV4 record={displayed} lineage={reexaminationLineage}
          canPrecise={canCorrect} onPrecise={preciseAccess}
          onOpenRelated={reexaminationLineage.status === 'found'
            ? reexaminationLineage.reviewed.reference === displayed.reference
              ? (reexaminationLineage.previous ? () => showDisplayedRecord(reexaminationLineage.previous!) : undefined)
              : () => showDisplayedRecord(reexaminationLineage.reviewed)
            : undefined} /> : null}
        <nav className="hv-property-quick" aria-label="Aller à">
          {answer?.strategies.length ? <button type="button" className="hv-property-chip-button" onClick={() => scrollToElement(waysRef.current)}>
            {`Voir les voies (${answer.strategies.length})`}</button> : null}
          <button type="button" className="hv-property-chip-button" onClick={() => scrollToElement(tray ? trayRef.current : readingRef.current)}>
            {canCorrect ? hasChanges ? `Nouvelle lecture à confirmer (${changeCount})` : 'Corriger la lecture' : 'Voir la lecture'}</button>
          {answer?.candidateAssessments.length ? <button type="button" className="hv-property-chip-button is-quiet" onClick={() => scrollToElement(candidatesRef.current)}>
            {`Matières évaluées (${answer.candidateAssessments.length})`}</button> : null}
          {versions.length > 1 ? <button type="button" className="hv-property-chip-button is-quiet" onClick={() => scrollToElement(versionsRef.current)}>
            {`Versions (${versions.length})`}</button> : null}
        </nav>
      </div>
    </header>

    {notice ? <p className="hv-property-banner" role="status">{notice}</p> : null}
    {lateNotice ? <p className="hv-property-banner hv4-late" role="status">{lateNotice}</p> : null}
    {dossierNotice ? <p className="hv-property-banner" role="status">{dossierNotice}</p> : null}

    <div className={`hv4-layout${answer ? '' : ' is-empty'}`}>
      <div className="hv4-area-answer">
        {answer ? <section className="hv-property-section hv-property-body hv4-answer" aria-labelledby={`${rootId}-answer-title`}>
          <div className="hv4-section-head"><h3 id={`${rootId}-answer-title`}>Réponse</h3>
            <span className={`hv-property-status hv-property-status-${answer.coverage.status}`}>{coverageStatusLabels[answer.coverage.status]}</span></div>
          {answer.body.length ? answer.body.slice(0, 1).map((paragraph) => <article className="hv-property-paragraph" key={paragraph.id}><p>{paragraph.text}</p>
            {paragraph.argumentIds.length ? <details><summary>Raisons et sources ({paragraph.argumentIds.length})</summary>
              <div className="hv4-arguments">{paragraph.argumentIds.map((id) => <ArgumentV4 key={id} answer={answer} argumentId={id} labelOf={labelOf} />)}</div></details> : null}
          </article>) : <p className="hv-property-gap">Aucune réponse substantielle n’est fournie dans cette portée.</p>}
          {answer.body.length > 1 ? <details className="hv4-more-body"><summary>Suite de la réponse ({answer.body.length - 1})</summary>
            {answer.body.slice(1).map((paragraph) => <article className="hv-property-paragraph" key={paragraph.id}><p>{paragraph.text}</p>
              {paragraph.argumentIds.length ? <details><summary>Raisons et sources ({paragraph.argumentIds.length})</summary>
                <div className="hv4-arguments">{paragraph.argumentIds.map((id) => <ArgumentV4 key={id} answer={answer} argumentId={id} labelOf={labelOf} />)}</div></details> : null}
            </article>)}</details> : null}
          {answer.coverage.points.length ? <details className="hv4-coverage"><summary>Portée par terme ({answer.coverage.points.length})</summary>
            <ul>{answer.coverage.points.map((point) => <li key={point.intentId}><b>« {labelOf(point.intentId)} »</b> · {pointStatusLabels[point.status]}<p>{point.reason}</p></li>)}</ul>
          </details> : null}
        </section> : <section className="hv-property-section hv4-empty-outcome" aria-labelledby={`${rootId}-empty-title`}>
          <h3 id={`${rootId}-empty-title`}>Aucun terme retenu</h3>
          <p>Tous les termes de cette version sont écartés. La question reste conservée telle quelle; aucun conseil, aucune voie et aucun dossier ne sont produits.</p>
          <p>{canCorrect ? 'Restaure un terme écarté ou ajoute un terme depuis un passage exact pour obtenir une nouvelle réponse.' : 'Les termes écartés et leur trace restent consultables ci-dessous.'}</p>
          {canCorrect ? <button type="button" className="hv4-primary" onClick={() => scrollToElement(readingRef.current)}>Restaurer ou ajouter un terme</button> : null}
        </section>}
      </div>

      <div className="hv4-area-reading">
        <HopV55PropertyAdviceAnnotationEditorV4 key={displayed.reference} rootId={rootId} question={displayed.originalQuestion}
          annotations={displayedAnnotations} readingContext={context} draft={canCorrect ? draft : undefined}
          onUpdateDraft={canCorrect ? updateDraft : undefined} materials={answer?.requestSnapshot.materials ?? []} materialChoices={materialChoices}
          onSearchMaterials={onSearchMaterials} onSelectMaterials={onSelectMaterials} disabled={busy} accessRequest={accessNonce} sectionRef={readingRef}>
          {tray}
        </HopV55PropertyAdviceAnnotationEditorV4>
      </div>

      {answer ? <div className="hv4-area-ways">
        <section className="hv-property-section hv4-ways" aria-labelledby={`${rootId}-ways-title`} ref={waysRef}>
          <div className="hv4-section-head"><h3 id={`${rootId}-ways-title`}>Voies possibles</h3>
            <span className="hv4-count">{plural(answer.strategies.length, 'voie', 'voies')}</span></div>
          <p className="hv4-help">Dans l’ordre transmis, sans classement. Chaque ligne montre ce qui distingue la voie et son effet sur tes gardes{guardIds.size
            ? ` (${[...guardIds].map((id) => `« ${labelOf(id)} »`).join(', ')})` : ''}. Ouvre-la pour ses limites, ses sources et pour la conserver. Aucune ne promet un résultat sensoriel.</p>
          {answer.strategies.length ? <ol className="hv4-way-list">{answer.strategies.map((strategy, index) => <li key={strategy.reference}>
            <WayV4 answer={answer} strategy={strategy} index={index} rootId={rootId} guardIds={guardIds} labelOf={labelOf}
              kept={displayedDossiers.some((row) => row.strategyId === strategy.id && row.strategyReference === strategy.reference)}
              choice={choiceFor(strategy, index)} />
          </li>)}</ol> : <p className="hv-property-gap">Aucune voie n’est transmise pour cette réponse.</p>}
        </section>
      </div> : null}
    </div>

    {answer ? <CandidateAssessmentsSection key={answer.reference} answer={answer} view={answer} rootId={rootId} sectionRef={candidatesRef} /> : null}

    <section className="hv-property-section hv4-context" aria-labelledby={`${rootId}-context-title`} ref={contextRef}>
      <div className="hv4-section-head"><h3 id={`${rootId}-context-title`}>Contexte de cette version</h3></div>
      <p className="hv4-help">Enregistré avec cette version; il ne vient pas du contexte actif de l’atelier.</p>
      {displayed.preparation.cultureBinding ? <AdoptedCultureProvenanceV4 binding={displayed.preparation.cultureBinding} /> : null}
      <div className="hv4-stage"><b>Stade · {stageLabels[context.context.stage]}</b><p>{context.context.stageBasis}</p></div>
      <div className="hv4-access-cards">{ACCESS_SCOPES_V4.map((scope) => {
        const access = context.context.access[scope];
        return <article key={scope} className={`is-${access.state}`}><b>{accessScopeLabelsV4[scope]} · {accessStateLabelsV4[access.state]}</b><p>{access.basis}</p>
          {access.assertionIds.map((id) => {
            const assertion = context.context.assertions.find((row) => row.id === id);
            return assertion ? <AssertionV4 key={id} assertion={assertion} answer={answer} /> : <code key={id}>Fait absent · {id}</code>;
          })}
        </article>;
      })}</div>
      {context.exclusions.length ? <div className="hv4-exclusions"><b>Interventions exclues</b>
        <ul>{context.exclusions.map((exclusion) => <li key={exclusion.id}>{interventionLabels[exclusion.intervention]} · {certaintyLabels[exclusion.certainty]} — {exclusion.reason}
          {exclusion.intentIds.length ? <small> · termes : {exclusion.intentIds.map((id) => `« ${labelOf(id)} »`).join(', ')}</small> : null}</li>)}</ul></div> : null}
      <p className="hv4-help">Matières prises en compte : {context.candidatePolicy.kind === 'explicit' ? 'liste explicite' : 'recherche dans un périmètre exact'} · {plural(context.candidatePolicy.materialIds.length, 'identité', 'identités')} · {context.candidatePolicy.basis}</p>
      {context.context.assertions.length ? <details><summary>Faits de contexte ({context.context.assertions.length})</summary>
        {context.context.assertions.map((assertion) => <AssertionV4 key={assertion.id} assertion={assertion} answer={answer} />)}</details> : null}
      {onReexamine && !readOnly && !viewingHistory ? <div className="hv4-reexam">
        {reexamOpen ? <div className="hv4-inline-form" role="group" aria-label="Relire avec le contexte actuel">
          <p className="hv4-help">Le parent relit la source actuelle et crée une nouvelle version; tes termes et leur trace sont repris tels quels. Les accès non redéclarés restent inconnus.</p>
          <label className="hv4-field"><span>Pourquoi relire ?</span><Textarea rows={2} value={reexamReason} disabled={busy} aria-label="Motif de la relecture du contexte"
            onChange={(event) => { setReexamReason(event.target.value); setFailedReexam(undefined); setReexamError(''); }} /></label>
          {reexamError ? <p className="hv-property-error" role="alert">{reexamError}</p> : null}
          <div className="hv4-actions">
            {failedReexam ? <button type="button" className="hv4-primary" disabled={busy} onClick={() => void runCommand('reexamine', failedReexam.request, failedReexam.expectation)}>
              {busy ? 'Envoi…' : 'Réessayer la même relecture'}</button>
              : <button type="button" className="hv4-primary" disabled={busy || !reexamReason.trim()} onClick={submitReexam}>{busy ? 'Envoi…' : 'Relire avec le contexte actuel'}</button>}
            <button type="button" className="hv4-secondary" disabled={busy} onClick={() => { setReexamOpen(false); setReexamError(''); }}>Fermer</button>
          </div>
        </div> : <button type="button" className="hv4-secondary" disabled={busy} onClick={() => setReexamOpen(true)}>Relire avec le contexte actuel de la source</button>}
      </div> : null}
    </section>

    <section className="hv-property-section hv4-versions" aria-labelledby={`${rootId}-versions-title`} ref={versionsRef}>
      <div className="hv4-section-head"><h3 id={`${rootId}-versions-title`}>Versions de cette lecture</h3><span className="hv4-count">{versions.length}</span></div>
      <p className="hv4-help">Chaque version garde sa question, ses termes retenus ou écartés, son contexte et sa réponse tels qu’enregistrés. Les relire ne recalcule rien.</p>
      <ol className="hv4-version-list">{versions.map((version) => {
        const rows = version.reference === head.reference ? headAnnotations : ledgerAnnotationsV4(version.ledger);
        const kept = rows.filter((row) => row.disposition === 'active').length;
        const versionAnswer = answerOf(version);
        const isOpen = version.reference === displayed.reference;
        return <li key={version.reference} className={isOpen ? 'is-open' : ''}>
          <div><b>{transitionLabels[version.transition.kind]}</b> · {formatInstantV4(version.transition.recordedAt)} · {version.transition.actor.label}
            {version.reference === head.reference ? ' · version courante' : ''}</div>
          <p>{version.transition.reason}</p>
          <span>{plural(kept, 'retenu', 'retenus')} · {plural(rows.length - kept, 'écarté', 'écartés')} · {versionAnswer ? plural(versionAnswer.strategies.length, 'voie', 'voies') : 'aucun conseil'}</span>
          {isOpen ? <b className="hv4-open-mark">Affichée</b> : <button type="button" className="hv4-link"
            onClick={() => { showDisplayedRecord(version.reference === head.reference ? head : version); scrollToElement(readingRef.current); }}>
            {version.reference === head.reference ? 'Revenir à la version courante' : 'Relire cette version'}</button>}
          <details><summary>Références exactes</summary><code>Version · {version.reference}</code><code>Acte · {version.transition.actId}</code>
            {version.transition.parentRecordReference ? <code>Version d’origine · {version.transition.parentRecordReference}</code> : null}
            <code>Lecture source · {version.sourceReadingReference}</code><code>Registre · {version.ledger.reference}</code></details>
        </li>;
      })}</ol>
      {allDossiers.length ? <div className="hv4-dossiers"><h4>{`Dossiers conservés · ${allDossiers.length}`}</h4>
        <ul>{allDossiers.map((dossier) => {
          const source = versions.find((row) => row.reference === dossier.answerRecordReference);
          return <li key={dossier.reference}><b>{dossier.dossierSnapshot.strategySnapshot.title}</b>
            <span>Motif : {dossier.dossierSnapshot.motive}</span>
            <span>{source ? `Version du ${formatInstantV4(source.transition.recordedAt)}` : 'Version non chargée ici'}{dossier.answerRecordReference === displayed.reference ? ' · version affichée' : ''}</span>
            <details><summary>Références du dossier</summary><code>Dossier · {dossier.reference}</code><code>Voie · {dossier.strategyReference}</code>
              <code>Réponse · {dossier.answerReference}</code><code>Registre · {dossier.ledgerReference}</code></details>
          </li>;
        })}</ul></div> : null}
    </section>

    {answer?.limits.length ? <details className="hv-property-section hv-property-limits"><summary>Limites de cette réponse ({answer.limits.length})</summary>
      <ul>{answer.limits.map((limit, index) => <li key={`${index}-${limit}`}>{limit}</li>)}</ul>
    </details> : null}

    <details className="hv-property-section hv4-refs"><summary>Références exactes de cette version</summary>
      <dl className="hv4-dl">
        <div><dt>Version</dt><dd><code>{displayed.reference}</code> · <code>{displayed.id}</code></dd></div>
        <div><dt>Acte</dt><dd>{transitionLabels[transition.kind]} · <code>{transition.actId}</code></dd></div>
        {transition.parentRecordReference ? <div><dt>Version d’origine</dt><dd><code>{transition.parentRecordReference}</code> · lecture <code>{transition.parentReadingReference}</code></dd></div> : null}
        <div><dt>Lecture source</dt><dd><code>{displayed.sourceReadingReference}</code></dd></div>
        <div><dt>Registre des termes</dt><dd><code>{displayed.ledger.reference}</code></dd></div>
        <div><dt>Préparation</dt><dd><code>{displayed.preparation.preparedReference}</code> · source {displayed.preparation.source.kind}{displayed.preparation.cultureBinding ? ' · culture adoptée rattachée' : ''}</dd></div>
        <div><dt>Résumé de lecture</dt><dd><code>{context.interpretation.id}</code></dd></div>
        {displayed.outcome.kind === 'domainAnswer' && answer ? <>
          <div><dt>Réponse</dt><dd><code>{displayed.outcome.answerReference}</code> · demande <code>{displayed.outcome.requestDraftReference}</code></dd></div>
          <div><dt>Interprétation</dt><dd><code>{answer.interpretationReference}</code></dd></div>
          <div><dt>Corpus</dt><dd>{answer.corpusSnapshot.version} · <code>{answer.corpusSnapshot.reference}</code></dd></div>
          <div><dt>Règles</dt><dd>{answer.rulesVersion} · entrée <code>{answer.inputReference}</code></dd></div>
        </> : <div><dt>Réponse</dt><dd>Aucune : tous les termes sont écartés dans cette version.</dd></div>}
      </dl>
    </details>
  </section>;
}
