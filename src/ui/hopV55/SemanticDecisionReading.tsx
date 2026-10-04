import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { HopV55SemanticAnnotationV1, HopV55SemanticQuestionReadingV1, HopV55SemanticSenseV1 } from '../../services/hopV55/questionSemanticReading';
import {
  HOP_V55_SEMANTIC_SENSE_RULES,
  assertHopV55SemanticAnnotationsV1,
  type HopV55SemanticProjectionReasonV1,
} from '../../services/hopV55/decisionSemanticProjection';
import { Input } from '../Input';
import { Textarea } from '../Input';
import './semantic-decision-reading.css';

export interface HopV55SemanticCorrectionRequestV1 {
  /** Stable retry key supplied by the editor; the parent stamps actor/date and archives. */
  commandId: string;
  sourceReadingReference: string;
  annotations: HopV55SemanticAnnotationV1[];
  reason: string;
}

export interface HopV55SemanticDecisionReadingProps {
  question: string;
  reading: HopV55SemanticQuestionReadingV1;
  showQuestion?: boolean;
  sourceReadingReference?: string;
  historical?: boolean;
  saving?: boolean;
  error?: string;
  onSaveCorrection?(request: HopV55SemanticCorrectionRequestV1): void | Promise<void>;
  onDraftChange?(dirty: boolean): void;
}

type Annotation = HopV55SemanticAnnotationV1;
type Span = Annotation['source'];
type State = {
  sourceKey: string;
  annotations: Annotation[];
  reason: string;
  confirmed: boolean;
  failed?: HopV55SemanticCorrectionRequestV1;
  localError: string;
  saved: boolean;
};

const SENSES: Array<{ value: HopV55SemanticSenseV1; label: string }> = [
  { value: 'qualitativeTarget', label: 'Cible qualitative' },
  { value: 'directedChange', label: 'Changement choisi' },
  { value: 'guard', label: 'Garde' },
  { value: 'exclusion', label: 'Exclusion' },
  { value: 'reportedObservation', label: 'Constat rapporté' },
  { value: 'investigation', label: 'Enquête' },
  { value: 'nonDecision', label: 'Non-décision' },
  { value: 'mention', label: 'Mention' },
];
const senseLabels = Object.fromEntries(SENSES.map(row => [row.value, row.label])) as Record<HopV55SemanticSenseV1, string>;
const directionLabels = { increase: 'Hausse choisie', decrease: 'Baisse choisie', keep: 'Préserver', exclude: 'Éviter', investigate: 'Examiner' } as const;
const guardLabels = { preserve: 'Préserver', noIncrease: 'Ne pas augmenter', noDecrease: 'Ne pas diminuer' } as const;
const inquiryLabels = { question: 'Question à examiner', compensation: 'Compensation', characterization: 'Caractérisation' } as const;
const lexiconLabels: Record<Annotation['lexicon']['status'], string> = {
  lexicon: 'Terme reconnu dans le lexique', proposedAlias: 'Alias proposé', outOfLexicon: 'Hors lexique', notAProperty: 'Pas une propriété',
};
const dimensionLabels: Record<NonNullable<Annotation['dimension']>, string> = {
  aroma: 'Arôme', acidity: 'Acidité', alcohol: 'Alcool', bioInteraction: 'Interaction avec la levure',
  hopCreep: 'Reprise enzymatique de fermentation (hop creep)', matrixTransfer: 'Transfert dans la bière',
  process: 'Procédé', stock: 'Stock', documentation: 'Documentation', other: 'Autre dimension',
};
const coverageLabels: Record<HopV55SemanticProjectionReasonV1, string> = {
  qualitativeTargetWithoutDirection: 'Cible qualitative engagée; aucune direction n’est transmise aux voies.',
  reportedObservation: 'Constat rapporté conservé, non transmis comme changement.',
  nonDecision: 'Non-décision conservée, aucun changement choisi.',
  optionalMention: 'Mention facultative conservée hors des critères transmis.',
  linkedInquiry: 'Enquête liée conservée sans projection primitive.',
};
const sourceOriginLabel = (origin: Annotation['origin']) => origin === 'parser' ? 'Lecture initiale' : 'Correction du brasseur';
const jsonEqual = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

function spanLabel(span: Span): string {
  return `« ${span.text} »`;
}

function SpanDetail({ label, span }: { label: string; span?: Span }) {
  return span ? <div className="hv-semantic-reading__source-row"><dt>{label}</dt><dd>
    <blockquote>{spanLabel(span)}</blockquote>
    <details><summary>Position exacte dans la question</summary><code>UTF-16 · {span.start}–{span.end}</code></details>
  </dd></div> : null;
}

function AnnotationCard({ annotation, original, relatedTermLookup, onChange, editable }: {
  annotation: Annotation; original: Annotation; editable: boolean; onChange(next: Annotation): void;
  relatedTermLookup: ReadonlyMap<string, string>;
}) {
  const rules = HOP_V55_SEMANTIC_SENSE_RULES[annotation.sense];
  const subjectWasDropped = !!original.subject && !annotation.subject;
  const update = (patch: Partial<Annotation>) => onChange({ ...annotation, ...patch, origin: 'brasseur' });
  const changeSense = (sense: HopV55SemanticSenseV1) => {
    const nextRules = HOP_V55_SEMANTIC_SENSE_RULES[sense];
    const nextDirection = nextRules.directions.includes(annotation.direction) ? annotation.direction
      : nextRules.directions.length === 1 ? nextRules.directions[0] : null;
    const { guard: _guard, inquiry: _inquiry, mentionKind: _mentionKind, subject: _subject,
      primitiveConvention: _primitiveConvention, ...common } = annotation;
    const subjectAllowed = sense === 'reportedObservation' || sense === 'investigation';
    const next: Annotation = {
      ...common,
      sense,
      requirement: nextRules.requirement[0],
      direction: nextDirection,
      origin: 'brasseur',
      ...(subjectAllowed && annotation.subject ? { subject: annotation.subject } : {}),
      ...(sense === 'guard' && annotation.guard ? { guard: annotation.guard } : {}),
      ...(sense === 'investigation' && annotation.inquiry ? { inquiry: annotation.inquiry } : {}),
      ...(sense === 'mention' && annotation.mentionKind ? { mentionKind: annotation.mentionKind } : {}),
      ...(sense === 'qualitativeTarget' && annotation.primitiveConvention ? { primitiveConvention: annotation.primitiveConvention } : {}),
    };
    onChange(next);
  };
  const directionChoices = rules.directions.filter((direction): direction is Exclude<Annotation['direction'], null> => direction !== null);
  return <article className="hv-semantic-reading__annotation">
    <header><div><p className="hv-semantic-reading__annotation-sense">{senseLabels[annotation.sense]} · {sourceOriginLabel(annotation.origin)}</p>
      <h4>{annotation.term}</h4></div>
      <span className={`hv-semantic-reading__commitment is-${annotation.requirement}`}>{annotation.requirement === 'required' ? 'Engagé' : 'Facultatif'}</span>
    </header>
    <blockquote className="hv-semantic-reading__primary-source">{spanLabel(annotation.source)}</blockquote>
    {annotation.qualification ? <p className="hv-semantic-reading__qualifier"><strong>Qualificatif retenu</strong> · {annotation.qualification}</p>
      : annotation.sense === 'qualitativeTarget' ? <p className="hv-semantic-reading__qualifier">Niveau visé; aucun qualificatif supplémentaire n’est renseigné.</p> : null}
    {annotation.sense === 'qualitativeTarget' ? <p className="hv-semantic-reading__sense-note">Cette cible reste engagée sans direction, base actuelle ni valeur déduite.</p> : null}
    {annotation.sense === 'directedChange' && annotation.direction ? <p className="hv-semantic-reading__sense-note">{directionLabels[annotation.direction]}</p> : null}
    {annotation.sense === 'guard' && annotation.guard ? <p className="hv-semantic-reading__sense-note">Garde · {guardLabels[annotation.guard]}</p> : null}
    {annotation.sense === 'investigation' && annotation.inquiry ? <p className="hv-semantic-reading__sense-note">Enquête · {inquiryLabels[annotation.inquiry]}</p> : null}
    {annotation.note ? <p className="hv-semantic-reading__note">{annotation.note}</p> : null}
    {subjectWasDropped ? <p className="hv-semantic-reading__notice">Le sujet distinct attaché à la lecture d’origine ne correspond pas au sens choisi. Il reste consultable dans cette archive précédente.</p> : null}
    {editable ? <div className="hv-semantic-reading__editor">
      <label><span>Sens de l’annotation · {annotation.term}</span>
        <select aria-label={`Sens de l’annotation · ${annotation.term}`} value={annotation.sense} disabled={!editable}
          onChange={event => changeSense(event.target.value as HopV55SemanticSenseV1)}>
          {SENSES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      {directionChoices.length > 1 ? <label><span>Direction du changement choisi</span>
        <select aria-label={`Direction de l’annotation · ${annotation.term}`} value={annotation.direction ?? ''} disabled={!editable}
          onChange={event => update({ direction: (event.target.value || null) as Annotation['direction'] })}>
          <option value="">Choisir une direction</option>
          {directionChoices.map(value => <option key={value} value={value}>{directionLabels[value]}</option>)}
        </select>
      </label> : annotation.sense === 'qualitativeTarget' ? <p className="hv-semantic-reading__direction-note">Direction canonique · aucune. La convention des voies, si choisie, reste séparée.</p>
        : directionChoices.length === 1 ? <p className="hv-semantic-reading__direction-note">Direction · {directionLabels[directionChoices[0]]}</p> : null}
      {annotation.sense === 'guard' ? <label><span>Nature de la garde</span>
        <select aria-label={`Garde de l’annotation · ${annotation.term}`} value={annotation.guard ?? ''} disabled={!editable}
          onChange={event => update({ guard: (event.target.value || undefined) as Annotation['guard'] })}>
          <option value="">Choisir ce qui est gardé</option>
          {Object.entries(guardLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label> : null}
      {annotation.sense === 'investigation' ? <label><span>Nature de l’enquête</span>
        <select aria-label={`Enquête de l’annotation · ${annotation.term}`} value={annotation.inquiry ?? ''} disabled={!editable}
          onChange={event => update({ inquiry: (event.target.value || undefined) as Annotation['inquiry'] })}>
          <option value="">Choisir une enquête</option>
          {Object.entries(inquiryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label> : null}
      {annotation.sense === 'mention' ? <label><span>Nature de la mention · facultative</span>
        <select aria-label={`Nature de la mention · ${annotation.term}`} value={annotation.mentionKind ?? ''} disabled={!editable}
          onChange={event => update({ mentionKind: (event.target.value || undefined) as Annotation['mentionKind'] })}>
          <option value="">Mention simple</option><option value="partnerPreference">Préférence de partenaire</option><option value="contextNote">Note de contexte</option>
        </select>
      </label> : null}
      {annotation.sense === 'qualitativeTarget' ? <label><span>Convention de projection vers les voies · facultative</span>
        <select aria-label={`Convention de projection · ${annotation.term}`} value={annotation.primitiveConvention ?? ''} disabled={!editable}
          onChange={event => update({ primitiveConvention: (event.target.value || undefined) as Annotation['primitiveConvention'] })}>
          <option value="">Ne pas projeter de direction</option>
          <option value="targetAsIncrease">Rechercher · convention des voies uniquement</option>
          <option value="targetAsInvestigation">Examiner · convention des voies uniquement</option>
        </select>
      </label> : null}
      <label><span>Qualificatif retenu</span>
        <Input aria-label={`Qualificatif · ${annotation.term}`} value={annotation.qualification ?? ''} disabled={!editable}
          onChange={event => update({ qualification: event.target.value || undefined })} />
      </label>
      <label><span>Note de lecture · facultative</span>
        <Textarea rows={2} autoComplete="off" autoCorrect="off" autoCapitalize="sentences" spellCheck={false}
          aria-label={`Note de lecture · ${annotation.term}`} value={annotation.note ?? ''} disabled={!editable}
          onChange={event => update({ note: event.target.value || undefined })} />
      </label>
      <p>Le fragment et ses sources exactes restent inchangés. Une correction produit une nouvelle version sémantique.</p>
    </div> : null}
    <details><summary>Sources et liens exacts</summary>
      <dl className="hv-semantic-reading__source-list">
        <SpanDetail label="Extrait cité" span={annotation.source} />
        <SpanDetail label="Source du qualificatif" span={annotation.qualifierSource} />
        <SpanDetail label="Source du cadre" span={annotation.frameSource} />
        <SpanDetail label="Moyen nommé" span={annotation.instrumentSource} />
        <SpanDetail label="Sujet" span={annotation.subject?.source} />
      </dl>
      {annotation.partner ? <p>Partenaire mentionné · {annotation.partner.text}</p> : null}
      {annotation.relatedAnnotationIds.length ? <ul>{annotation.relatedAnnotationIds.map(id => <li key={id}>{relatedTermLookup.get(id) ?? 'Annotation liée'} <code>{id}</code></li>)}</ul> : null}
      {annotation.familyId ? <p>Famille technique · <code>{annotation.familyId}</code></p> : null}
      {annotation.dimension ? <p>Dimension utilisée · {dimensionLabels[annotation.dimension]}</p> : null}
      {annotation.lexicon.status === 'proposedAlias' ? <p>Alias · {annotation.lexicon.canonicalTerm}</p> : null}
      <p>{lexiconLabels[annotation.lexicon.status]}</p>
      {'key' in annotation.lexicon && annotation.lexicon.key ? <p>Clé exacte du lexique · <code>{annotation.lexicon.key}</code></p> : null}
    </details>
  </article>;
}

function ProjectionCoverage({ reading }: { reading: HopV55SemanticQuestionReadingV1 }) {
  const annotations = new Map(reading.annotations.map(annotation => [annotation.id, annotation]));
  const criteria = new Map(reading.intent.criteria.map(criterion => [criterion.id, criterion]));
  return <section className="hv-semantic-reading__coverage" aria-label="Couverture de la projection primitive">
    <header><div><h3>Ce que les voies reçoivent</h3>
      <p>{reading.projectionCoverage.included.length} critères transmis · {reading.projectionCoverage.notProjected.length} annotations conservées hors projection.</p></div>
    </header>
    {reading.projectionCoverage.included.length ? <details><summary>Critères transmis aux voies ({reading.projectionCoverage.included.length})</summary>
      <ul>{reading.projectionCoverage.included.map(id => <li key={id}><strong>{annotations.get(id)?.term ?? id}</strong>
        <span>{criteria.get(id)?.label ?? 'Critère exact conservé sans libellé courant.'}</span><code>{id}</code></li>)}</ul>
    </details> : <p className="hv-semantic-reading__notice">Aucun critère primitif n’est transmis; les annotations V4 restent consultables ci-dessus.</p>}
    {reading.projectionCoverage.notProjected.length ? <details open>
      <summary>Conservées mais non projetées ({reading.projectionCoverage.notProjected.length})</summary>
      <ul>{reading.projectionCoverage.notProjected.map((row, index) => <li key={`${row.annotationId}-${index}`}>
        <strong>{annotations.get(row.annotationId)?.term ?? row.annotationId}</strong>
        <span>{coverageLabels[row.reason]}</span><details><summary>Motif et identité</summary>
          <p>{coverageLabels[row.reason]}</p><code>{row.annotationId}</code><code>{row.reason}</code></details>
      </li>)}</ul>
    </details> : <p className="hv-semantic-reading__muted">Toutes les annotations sont représentées par des critères primitifs; leur sens canonique reste affiché dans la lecture V4.</p>}
  </section>;
}

export function SemanticDecisionReading({ question, reading, showQuestion = true, sourceReadingReference, historical = false, saving = false,
  error, onSaveCorrection, onDraftChange }: HopV55SemanticDecisionReadingProps) {
  const rootId = useId();
  const sourceKey = `${sourceReadingReference ?? ''}\u0000${question}\u0000${JSON.stringify(reading.annotations)}`;
  const [stored, setStored] = useState<State>(() => ({ sourceKey, annotations: structuredClone(reading.annotations), reason: '', confirmed: false,
    localError: '', saved: false }));
  const current = stored.sourceKey === sourceKey ? stored : { sourceKey, annotations: structuredClone(reading.annotations), reason: '',
    confirmed: false, localError: '', saved: false };
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);
  const [failed, setFailed] = useState<HopV55SemanticCorrectionRequestV1>();
  const inFlight = useRef(false);
  const activeSourceKey = useRef(sourceKey);
  activeSourceKey.current = sourceKey;
  const onDraftChangeRef = useRef(onDraftChange);
  onDraftChangeRef.current = onDraftChange;
  const relatedTermLookup = useMemo(() => new Map(reading.annotations.map(annotation => [annotation.id, annotation.term])), [reading.annotations]);
  const dirty = !jsonEqual(current.annotations, reading.annotations);
  const questionMatches = question === reading.intent.question;
  const correctionAvailable = !historical && !!sourceReadingReference && questionMatches && !!onSaveCorrection;
  const editable = correctionAvailable && !saving && !current.saved;
  const validationProblem = useMemo(() => {
    try { assertHopV55SemanticAnnotationsV1(current.annotations, question); return ''; }
    catch (cause) { return cause instanceof Error ? cause.message : 'Les annotations sémantiques ne sont pas vérifiables.'; }
  }, [current.annotations, question]);
  const originalById = new Map(reading.annotations.map(annotation => [annotation.id, annotation]));
  const changedIds = current.annotations.filter(annotation => !jsonEqual(annotation, originalById.get(annotation.id))).map(annotation => annotation.id);
  useEffect(() => {
    onDraftChangeRef.current?.(dirty && questionMatches && !historical);
    return () => onDraftChangeRef.current?.(false);
  }, [dirty, questionMatches, historical, sourceKey]);
  useEffect(() => {
    setFailed(undefined);
    setLocalError('');
    setSavedNotice(false);
  }, [sourceKey]);
  const updateState = (update: (state: State) => State) => setStored(previous => {
    const base = previous.sourceKey === sourceKey ? previous : { sourceKey, annotations: structuredClone(reading.annotations), reason: '',
      confirmed: false, localError: '', saved: false };
    return update(base);
  });
  const updateAnnotation = (id: string, change: (annotation: Annotation) => Annotation) => {
    updateState(state => ({ ...state,
      annotations: state.annotations.map(annotation => annotation.id === id ? change(annotation) : annotation),
      confirmed: false, saved: false, localError: '' }));
    setFailed(undefined); setSavedNotice(false);
  };
  const submit = async (request?: HopV55SemanticCorrectionRequestV1) => {
    if (!onSaveCorrection || !editable || saving || submitting || inFlight.current || !dirty || !current.reason.trim() || !current.confirmed || validationProblem) return;
    const correction: HopV55SemanticCorrectionRequestV1 = request ?? failed ?? {
      commandId: `semantic-correction:${globalThis.crypto.randomUUID()}`,
      sourceReadingReference: sourceReadingReference!, annotations: structuredClone(current.annotations), reason: current.reason.trim(),
    };
    inFlight.current = true;
    setSubmitting(true); setLocalError(''); setFailed(undefined); setSavedNotice(false);
    try {
      await onSaveCorrection(correction);
      const latest = activeSourceKey.current === sourceKey;
      if (latest) {
        setStored(state => state.sourceKey === sourceKey ? { ...state, saved: true } : state);
        setSavedNotice(true);
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'La correction sémantique n’a pas été enregistrée.';
      if (activeSourceKey.current === sourceKey) {
        setLocalError(message); setFailed(correction);
        updateState(state => ({ ...state, localError: message }));
      }
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  return <section className="hv-semantic-reading" aria-labelledby={`${rootId}-title`}>
    <header className="hv-semantic-reading__header">
      <div><p className="hv-semantic-reading__eyebrow">Lecture sémantique V4</p>
        <h2 id={`${rootId}-title`}>Sens conservé de la demande</h2>
      </div>
      {historical ? <span className="hv-semantic-reading__badge is-readonly">Version archivée · lecture seule</span>
        : <span className="hv-semantic-reading__badge">Lecture distincte des critères transmis</span>}
    </header>
    {showQuestion ? <section className="hv-semantic-reading__question" aria-label="Question originale exacte">
      <h3>Question de départ</h3><blockquote>{question}</blockquote>
    </section> : null}
    {!questionMatches ? <p className="hv-semantic-reading__error" role="alert">La question affichée ne correspond pas à la lecture sémantique reçue; aucune correction n’est proposée.</p> : null}
    <section className="hv-semantic-reading__summary" aria-label="Interprétation sémantique conservée">
      <h3>Lecture enregistrée</h3><p>{reading.interpretation}</p>
      {reading.correction ? <small>Corrigée explicitement le {new Date(reading.correction.recordedAt).toLocaleString('fr-CH', { dateStyle: 'medium', timeStyle: 'short' })} · {reading.correction.reason}</small> : null}
    </section>
    {sourceReadingReference ? <details className="hv-semantic-reading__reference"><summary>Références de cette version</summary>
      <code>Lecture · {sourceReadingReference}</code>
      <code>Question · {reading.intent.question}</code>
    </details> : <p className="hv-semantic-reading__notice">Référence exacte absente : cette lecture reste consultable sans correction.</p>}

    <section className="hv-semantic-reading__annotations" aria-label="Annotations sémantiques V4">
      <div className="hv-semantic-reading__section-head"><div><h3>Intentions, constats et réserves</h3>
        <p>Le sens, l’engagement et les fragments exacts restent distincts de la projection utilisée par les voies.</p></div>
        <span>{reading.annotations.length} {reading.annotations.length === 1 ? 'annotation' : 'annotations'}</span></div>
      {reading.annotations.length ? <div className={`hv-semantic-reading__list${reading.annotations.length === 1 ? ' is-single' : ''}`}>{reading.annotations.map((original, index) => {
        const annotation = current.annotations[index] ?? original;
        return <AnnotationCard key={original.id} annotation={annotation} original={original} relatedTermLookup={relatedTermLookup} editable={editable && !submitting}
          onChange={next => updateAnnotation(original.id, () => next)} />;
      })}</div> : <p className="hv-semantic-reading__notice">Aucune annotation sémantique n’est conservée; la question reste affichée sans sens ajouté.</p>}
    </section>
    {dirty ? <p className="hv-semantic-reading__draft-warning" role="status">
      Les annotations modifiées ci-dessus ne changent pas encore les voies ni leur couverture. Celles-ci décrivent toujours la lecture enregistrée; transmettez la correction puis recalculez pour obtenir une nouvelle lecture.
    </p> : null}
    <ProjectionCoverage reading={reading} />

    {correctionAvailable ? <section className="hv-semantic-reading__correction" aria-labelledby={`${rootId}-correction-title`}>
      <h3 id={`${rootId}-correction-title`}>Corriger cette lecture</h3>
      <p>Les fragments source restent inchangés. Toute correction produit une nouvelle version; la lecture affichée garde son historique.</p>
      {changedIds.length ? <p className="hv-semantic-reading__changed">Annotations modifiées · {changedIds.map(id => current.annotations.find(row => row.id === id)?.term ?? id).join(' · ')}</p> : null}
      <label><span>Motif de la correction</span><Textarea rows={2} autoComplete="off" autoCorrect="off" autoCapitalize="sentences" spellCheck={false}
        aria-label="Motif de la correction sémantique" value={current.reason} disabled={submitting || saving || current.saved}
        onChange={event => { updateState(state => ({ ...state, reason: event.target.value, confirmed: false, localError: '' })); setFailed(undefined); setLocalError(''); setSavedNotice(false); }} /></label>
      <label className="hv-semantic-reading__confirm-check"><input type="checkbox" aria-label="Confirmer la correction sémantique" checked={current.confirmed}
        disabled={submitting || saving || current.saved || !dirty} onChange={event => updateState(state => ({ ...state, confirmed: event.target.checked }))} />
        <span>J’ai vérifié les sens et les qualifications modifiés.</span></label>
      {validationProblem ? <p className="hv-semantic-reading__error" role="status">{validationProblem}</p> : null}
      {localError || error ? <p className="hv-semantic-reading__error" role="alert">{localError || error}</p> : null}
      {savedNotice ? <p className="hv-semantic-reading__success" role="status">Correction transmise pour créer une nouvelle version; cette lecture reste inchangée.</p> : null}
      {failed ? <small>La reprise conserve le même motif, les mêmes annotations et le même identifiant d’action.</small> : null}
      <button type="button" className="hv-semantic-reading__submit" disabled={historical || submitting || saving || current.saved
        || !dirty || !current.reason.trim() || !current.confirmed || !!validationProblem || !sourceReadingReference}
        onClick={() => void submit(failed)}>
        {submitting || saving ? 'Enregistrement…' : failed ? 'Réessayer la même correction' : 'Enregistrer cette correction'}
      </button>
    </section> : onSaveCorrection && !historical ? <p className="hv-semantic-reading__notice">La question ou la référence exacte manque; cette lecture reste consultable et immuable.</p>
      : !historical ? <p className="hv-semantic-reading__notice">La correction sémantique n’est pas disponible dans cette vue; la lecture reste inchangée.</p> : null}
  </section>;
}
