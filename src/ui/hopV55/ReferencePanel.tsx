import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { BrewerContext } from '../../../functions/src/companionTypes';
import type { HopSource } from '../../../functions/src/hopIndexSchema';
import {
  type BrewingReferenceCommandInput,
  type BrewingReferenceEventKind,
  type BrewingReferenceEvent,
  type BrewingReferenceEventPayload,
  type BrewingReferenceIdentityV1,
  type BrewingReferenceInterpretationV1,
  type BrewingReferenceObservationV1,
  type BrewingReferenceProjectionV1,
  type BrewingReferenceVersionV1,
} from '../../domain/brewingReference';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { BrewingScenarioCultureContext } from '../../domain/brewingScenario';
import { brewingObservationFactReference } from '../../domain/brewingObservationNumerics';
import type { BrewingSensoryDefinitionReference, BrewingSensoryScale } from '../../domain/brewingSensory';
import type { BrewingObservedHopScope } from '../../domain/brewingObservationInputs';
import type { HopDecisionProgram, HopProcessStage, HopUse } from '../../domain/hopDecision/types';
import type { HopV55Workspace } from '../../services/hopV55/contracts';
import {
  adoptHopV55ReferenceHypothesis,
  applyHopV55ReferenceEvent,
  ensureHopV55ReferenceJournal,
  getHopV55AdoptedBaseline,
  getHopV55ReferenceDefinitions,
  getHopV55ReferenceHypotheses,
  getHopV55ReferenceProjection,
} from '../../services/hopV55/referenceWorkspace';
import {
  appendHopV55CurrentPreparationRecord,
  appendHopV55ObservationAnchor,
  prepareHopV55CurrentPreparationRecord,
  prepareHopV55ObservationAnchor,
  readHopV55ObservationAnchorRecord,
  type HopV55ObservationAnchorRecordV1,
} from '../../services/hopV55/observationSession';
import { Input, Textarea } from '../Input';
import { HopV55ExactInput } from './ExactInput';
import { HopV55ObservationStateEditor, type ObservationStateDraft } from './ObservationStateEditor';
import { HopV55ReferenceEditor } from './ReferenceEditor';
import './reference-panel.css';

type ObservationSenseKind = BrewingReferenceObservationV1['sense']['kind'];
type ScaleMode = 'unknown' | 'declared';
type InterpretationComparability = 'exact' | 'nonComparable';

export interface HopV55ReferencePanelProps {
  workspace?: HopV55Workspace;
  context: BrewerContext;
  prepared: PreparedBrewingScenarioContext;
  getWorkspace(): Promise<HopV55Workspace>;
  onSave(workspace: HopV55Workspace): Promise<HopV55Workspace>;
  /** Optional exact human-rating definitions; model-index scales are never used as ordinal scales. */
  observationDefinitions?: BrewingSensoryDefinitionReference[];
  /** Optional, explicit model scope from the qualified parent; never inferred from the recipe. */
  observationScope?: BrewingObservedHopScope;
}

function localDateTimeValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function inputDateTimeToIso(value: string): string {
  if (!value.trim()) throw new Error('La date de l’observation doit être renseignée.');
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('La date de l’observation est invalide.');
  return date.toISOString();
}

function showDate(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('fr-CH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Zurich' }).format(date)
    : value;
}

function showNumber(value: number): string {
  return new Intl.NumberFormat('fr-CH', { maximumFractionDigits: 6 }).format(value);
}

function additionCount(count: number): string {
  return `${count} ajout${count === 1 ? '' : 's'}`;
}

function sameIdentity(left: BrewingReferenceIdentityV1, right: BrewingReferenceIdentityV1): boolean {
  return left.id === right.id && left.version === right.version && left.contentReference === right.contentReference;
}

function identityLabel(reference: BrewingReferenceIdentityV1): string {
  return `${reference.id} · v${reference.version} · ${reference.contentReference}`;
}

function referenceDisplayLabel(reference: BrewingReferenceVersionV1): string {
  const content = reference.content as Record<string, unknown>;
  if (typeof content.label === 'string' && content.label.trim()) return content.label;
  const baseline = content.baseline as Record<string, unknown> | undefined;
  if (baseline && typeof baseline.label === 'string' && baseline.label.trim()) return baseline.label;
  return 'Référence de comparaison';
}

function referenceAdditionCount(reference: BrewingReferenceVersionV1): number | undefined {
  const content = reference.content as Record<string, unknown>;
  const baseline = content.baseline as Record<string, unknown> | undefined;
  const input = baseline?.input as Record<string, unknown> | undefined;
  return Array.isArray(input?.additions) ? input.additions.length : undefined;
}

function metricDisplayLabel(kind: string | null | undefined): string {
  if (kind === 'ordinalNote') return 'note ordinale';
  if (kind === 'modelIndex') return 'indice de modèle';
  if (kind === 'measurement') return 'mesure analytique';
  return 'qualitatif';
}

const useOrder: Record<HopUse, number> = { firstWort: 0, boil: 1, whirlpool: 2, fermentation: 3, postFermentation: 4 };
const firstAllowedUse: Record<HopProcessStage, number> = { planning: 0, hotSide: 1, fermenting: 3, conditioning: 4, packaged: 5 };
const stageLabels: Record<HopProcessStage, string> = {
  planning: 'Avant brassage', hotSide: 'Jour de brassage', fermenting: 'Fermentation',
  conditioning: 'Garde / conditionnement', packaged: 'Conditionné',
};

function actualProgramSummary(context: BrewerContext, program: HopDecisionProgram | null | undefined) {
  const label = typeof context.batch?.name === 'string' && context.batch.name.trim() ? context.batch.name
    : typeof context.recipe?.name === 'string' && context.recipe.name.trim() ? context.recipe.name : 'Programme réel';
  const batchStages: Record<string, string> = { planifie: 'Planifié', fermentation: 'Fermentation', garde: 'Garde',
    conditionne: 'Conditionné', termine: 'Terminé', annule: 'Annulé' };
  const journalStage = Number.isFinite(context.journal?.pitchedAt) ? 'Fermentation'
    : Number.isFinite(context.journal?.startedAt) ? 'Jour de brassage' : undefined;
  if (!program) return { label, stage: context.batch ? batchStages[String(context.batch.status)] ?? 'État du brassin à préciser'
    : journalStage ?? (context.recipe ? 'Avant brassage' : 'Stade non établi'),
    futureCount: undefined as number | undefined, overdueCount: undefined as number | undefined, performedCount: undefined as number | undefined };
  const floor = firstAllowedUse[program.stage];
  return { label, stage: stageLabels[program.stage],
    futureCount: program.additions.filter(row => row.status === 'planned' && useOrder[row.use] >= floor).length,
    overdueCount: program.additions.filter(row => row.status === 'planned' && useOrder[row.use] < floor).length,
    performedCount: program.additions.filter(row => row.status === 'performed').length };
}

function sourceLabel(source: HopSource): string {
  return [source.title, source.author, source.year ?? 'année inconnue', source.kind, source.reference, source.locator]
    .filter((part): part is string | number => part !== undefined && part !== '').join(' · ');
}

function commandFor<K extends BrewingReferenceEventKind>(workspace: HopV55Workspace, kind: K,
  payload: BrewingReferenceEventPayload[K], commandId: string, recordedAt: string): BrewingReferenceCommandInput<K> {
  const journal = workspace.referenceJournal;
  if (!journal) throw new Error('Le journal de référence doit être ouvert avant une commande.');
  return { ownerKey: workspace.ownerKey, contextId: journal.record.contextId, commandId,
    expectedRevision: journal.record.revision, recordedAt, kind, payload } as BrewingReferenceCommandInput<K>;
}

function latestObservationVersions(projection: BrewingReferenceProjectionV1): BrewingReferenceObservationV1[] {
  const latest = new Map<string, BrewingReferenceObservationV1>();
  for (const observation of projection.observations) {
    if (!latest.has(observation.id) || latest.get(observation.id)!.version < observation.version) latest.set(observation.id, observation);
  }
  return [...latest.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function anchorForObservation(workspace: HopV55Workspace | undefined, observation: BrewingReferenceObservationV1 | undefined): HopV55ObservationAnchorRecordV1 | null {
  if (!workspace || !observation) return null;
  const matches = (workspace.observationAnchors ?? []).flatMap(raw => {
    const read = readHopV55ObservationAnchorRecord(raw);
    if (read.status !== 'readOnly') return [];
    const record = read.record;
    return record.anchor?.observation.id === observation.id && record.anchor.observation.version === observation.version
      && record.observationReference?.id === observation.id && record.observationReference.version === observation.version
      && record.observationReference.contentReference === brewingObservationFactReference(observation)
      ? [record] : [];
  });
  return matches.at(-1) ?? null;
}

function adoptedReferences(projection: BrewingReferenceProjectionV1): BrewingReferenceVersionV1[] {
  const adopted = new Set(projection.adoptions.map(row => `${row.reference.id}\0${row.reference.version}\0${row.reference.contentReference}`));
  return projection.references.filter(row => adopted.has(`${row.id}\0${row.version}\0${row.contentReference}`));
}

function exactDefinitionList(projection: BrewingReferenceProjectionV1): BrewingSensoryDefinitionReference[] {
  const definitions = new Map<string, BrewingSensoryDefinitionReference>();
  for (const reference of projection.references) for (const definition of reference.sensoryDefinitions) {
    definitions.set(definition.contentReference, definition);
  }
  return [...definitions.values()];
}

function observationSenseLabel(observation: BrewingReferenceObservationV1): string {
  if (observation.sense.kind === 'qualitative') return 'Qualitative';
  if (observation.sense.kind === 'sensoryRating') return `Note sensorielle · ${showNumber(observation.sense.value)}`;
  const value = typeof observation.sense.value === 'number'
    ? showNumber(observation.sense.value)
    : `${showNumber(observation.sense.value.min)}–${showNumber(observation.sense.value.max)}`;
  return `Mesure analytique · ${value} ${observation.sense.unit}`;
}

function describeScale(observation: BrewingReferenceObservationV1): string {
  if (observation.scale.status === 'unknown') return 'Échelle inconnue';
  const { metric, scale } = observation.scale;
  const domain = scale.domain ? `${showNumber(scale.domain.min)}–${showNumber(scale.domain.max)}` : 'bornes non déclarées';
  return `${metric.kind} · ${metric.name} · ${domain}${metric.unit ? ` ${metric.unit}` : ''}`;
}

function pastDescription(projection: BrewingReferenceProjectionV1): string {
  const { past } = projection.context;
  if (past.status === 'unknown') return 'Passé inconnu · aucune absence d’ajout n’est déduite.';
  if (past.status === 'partial') return `Passé partiel · ${additionCount(past.knownAdditions.length)} connu${past.knownAdditions.length === 1 ? '' : 's'}.`;
  return past.additions.length
    ? `Passé déclaré complet · ${additionCount(past.additions.length)} consigné${past.additions.length === 1 ? '' : 's'}.`
    : 'Passé déclaré complet · aucun ajout consigné (0).';
}

function ObservationFacts({ observation, events }: { observation: BrewingReferenceObservationV1; events: BrewingReferenceEvent[] }) {
  const correction = events.find(event => event.kind === 'observationCorrected'
    && event.payload.observation.id === observation.id && event.payload.observation.version === observation.version);
  const definition = observation.dimension.status === 'resolved' ? observation.dimension.definition : undefined;
  return <>
    <div className="hv55-ref-facts">
      <span><strong>Nature</strong>{observationSenseLabel(observation)}</span>
      <span><strong>Dimension</strong>{observation.dimension.status === 'resolved'
        ? `${observation.dimension.definition.dimension.name} · v${observation.dimension.definition.dimension.version}`
        : `${observation.dimension.label} · non résolue`}</span>
      <span><strong>Échelle</strong>{describeScale(observation)}</span>
      <span><strong>Comparaison</strong>{observation.comparison.kind === 'absolute' ? 'Absolue' : `Relative · ${observation.comparison.relationship}${observation.comparison.referent ? ` · référent version ${observation.comparison.referent.version}` : ' · référent initial inconnu'}`}</span>
    </div>
    <p className="hv55-ref-original">{observation.originalText}</p>
    {observation.context.conditions ? <p className="hv55-ref-context">Conditions déclarées : {String(observation.context.conditions)}</p> : null}
    {correction?.kind === 'observationCorrected' ? <p className="hv55-ref-context">Correction v{observation.version} · {correction.payload.reason}</p> : null}
    <details className="hv55-ref-evidence"><summary>Origine, auteur et références exactes</summary>
      <dl><dt>Objet</dt><dd>{observation.subject.kind} · {observation.subject.label}{observation.subject.id ? ` · ${observation.subject.id}` : ''}</dd>
        <dt>Identifiant de l’observation</dt><dd><code>{observation.id} · v{observation.version}</code></dd>
        {observation.comparison.kind === 'relative' ? <><dt>Référent initial exact</dt><dd>{observation.comparison.referent
          ? <code>{identityLabel(observation.comparison.referent)}</code> : 'Non renseigné (null).'}</dd></> : null}
        <dt>Observé le</dt><dd><time dateTime={observation.observedAt}>{showDate(observation.observedAt)}</time> · <code>{observation.observedAt}</code></dd>
        <dt>Origine</dt><dd>{observation.origin.kind} · {observation.origin.description}{observation.origin.sourceReference ? ` · ${observation.origin.sourceReference}` : ''}</dd>
        <dt>Auteur</dt><dd>{observation.author.label}{observation.author.id ? ` · ${observation.author.id}` : ''}</dd>
        {definition ? <><dt>Définition figée</dt><dd><code>{definition.contentReference}</code></dd>
          <dt>Sources de nuance</dt><dd>{definition.dimension.sourceRefs.length ? definition.dimension.sourceRefs.map(sourceLabel).join(' ; ') : 'Aucune source attachée.'}</dd></> : null}
        {observation.scale.status === 'known' ? <><dt>Sources de métrique</dt><dd>{observation.scale.metric.sourceRefs.length ? observation.scale.metric.sourceRefs.map(sourceLabel).join(' ; ') : 'Aucune source attachée.'}</dd>
          <dt>Sources d’échelle</dt><dd>{observation.scale.scale.sourceRefs.length ? observation.scale.scale.sourceRefs.map(sourceLabel).join(' ; ') : 'Aucune source attachée.'}</dd></> : null}
      </dl>
    </details>
  </>;
}

function ObservationAnchorHistory({ observation, workspace }: { observation: BrewingReferenceObservationV1; workspace?: HopV55Workspace }) {
  const anchors = (workspace?.observationAnchors ?? []).flatMap(raw => {
    const read = readHopV55ObservationAnchorRecord(raw);
    if (read.status !== 'readOnly') return [];
    const record = read.record;
    return record.anchor?.observation.id === observation.id && record.anchor.observation.version === observation.version
      ? [record] : [];
  });
  if (!anchors.length) return null;
  return <details className="hv55-ref-evidence hv55-ref-anchor-history">
    <summary>État dégusté et ancre historique · {anchors.length}</summary>
    {anchors.map(record => {
      const anchor = record.anchor!;
      return <div key={record.reference}>
        <p>{anchor.observedState.subject.kind === 'sample' ? 'Échantillon' : 'Batch'} · état au <time dateTime={anchor.observedState.asOf}>{showDate(anchor.observedState.asOf)}</time>
          {' · '}{anchor.observedState.status}</p>
        <p>Relation du sujet · {anchor.subjectRelation} · {anchor.explanation}</p>
        <p>Instant de dégustation · <time dateTime={anchor.observation.observedAt}>{showDate(anchor.observation.observedAt)}</time></p>
        {anchor.observedState.dependencies.map(row => <p key={row.id}>{row.id} · {row.status} · {row.reasons.join(' ') || 'Aucune lacune déclarée.'}</p>)}
        {anchor.observedState.contactStates.map(row => <p key={`${row.id}:${row.version}`}>{row.id} · {row.status}
          {row.elapsedSeconds !== undefined ? ` · ${showNumber(row.elapsedSeconds / 3600)} h attestées` : ''}
          {row.lowerBoundSeconds !== undefined ? ` · au moins ${showNumber(row.lowerBoundSeconds / 3600)} h` : ''}
          {row.reason ? ` · ${row.reason}` : ''}</p>)}
        <details><summary>Sources et limites exactes</summary>
          <p>Snapshot · <code>{record.preparation.sourceSnapshotReference ?? 'absent'}</code></p>
          <p>Journal source · <code>{record.preparation.sourceJournalReference ?? 'absent'}</code></p>
          <p>Résolution · <code>{anchor.observedState.resolutionReference}</code></p>
          <p>Ancre · <code>{anchor.reference}</code></p>
          {record.preparation.limitations.map((limitation, index) => <p key={index}>{limitation}</p>)}
          {record.preparation.unmapped.map(row => <p key={`${row.sourceKey}:${row.code}`}>{row.sourceKey} · {row.code} · {row.reason}</p>)}
        </details>
      </div>;
    })}
  </details>;
}

function HistoricalCorrectionContext({ context }: { context: Record<string, unknown> }) {
  const contactHours = context.contactHours;
  const state = context.state;
  const lotId = context.lotId;
  const hasDetails = typeof contactHours === 'number' || typeof state === 'string' || typeof lotId === 'string';
  if (!hasDetails) return null;
  return <div className="hv55-ref-facts" aria-label="État et lot du relevé historique">
    {typeof contactHours === 'number' ? <span><strong>Contact conservé</strong>{showNumber(contactHours)} h</span> : null}
    {typeof state === 'string' ? <span><strong>État conservé</strong>{state}</span> : null}
    {typeof lotId === 'string' ? <span><strong>Lot exact</strong><code>{lotId}</code></span> : null}
  </div>;
}

function InterpretationLinkEditor({ observation, projection, busy, onLink }: {
  observation: BrewingReferenceObservationV1;
  projection: BrewingReferenceProjectionV1;
  busy: boolean;
  onLink(interpretation: Omit<BrewingReferenceInterpretationV1, 'id' | 'author' | 'origin'>, originDescription: string): void;
}) {
  const references = adoptedReferences(projection);
  const [referenceKey, setReferenceKey] = useState(projection.currentReference?.contentReference ?? '');
  const targetReference = references.find(row => row.contentReference === referenceKey);
  const definitions = targetReference?.sensoryDefinitions ?? [];
  const [definitionReference, setDefinitionReference] = useState(definitions[0]?.contentReference ?? '');
  const targetDefinition = definitions.find(row => row.contentReference === definitionReference);
  const [relation, setRelation] = useState('');
  const [reason, setReason] = useState('');
  const [originDescription, setOriginDescription] = useState('Interprétation déclarée par le brasseur.');
  const sameDefinition = observation.dimension.status === 'resolved' && !!targetDefinition
    && observation.dimension.definition.contentReference === targetDefinition.contentReference;
  const exactAllowed = sameDefinition && observation.scale.status === 'known';
  const [comparability, setComparability] = useState<InterpretationComparability>(exactAllowed ? 'exact' : 'nonComparable');
  const linkBlockReason = busy ? 'Une commande est en cours; attends sa relecture avant un nouveau lien.'
    : !targetDefinition ? 'Choisis une définition cible exacte.'
      : !relation.trim() ? 'Déclare la relation constatée.'
        : !reason.trim() ? 'Précise le motif du lien.'
          : !originDescription.trim() ? 'Précise l’origine de l’interprétation.'
            : comparability === 'exact' && !exactAllowed ? 'Cette observation ne permet pas une comparabilité exacte.' : '';
  useEffect(() => {
    if (!references.some(row => row.contentReference === referenceKey)) {
      setReferenceKey(projection.currentReference?.contentReference ?? references[0]?.contentReference ?? '');
    }
  }, [referenceKey, references, projection.currentReference?.contentReference]);
  useEffect(() => {
    if (!definitions.some(row => row.contentReference === definitionReference)) setDefinitionReference(definitions[0]?.contentReference ?? '');
  }, [definitionReference, definitions]);
  useEffect(() => {
    setComparability(exactAllowed ? 'exact' : 'nonComparable');
  }, [exactAllowed]);

  if (!references.length) return <p className="hv55-ref-muted">Aucune référence adoptée. Un lien d’interprétation exige une cible adoptée exacte.</p>;
  if (!definitions.length) return <p className="hv55-ref-muted">Cette référence adoptée ne conserve aucune définition sensorielle. Les observations restent lisibles; aucune cible n’est inventée.</p>;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!targetReference || !targetDefinition || !relation.trim() || !reason.trim() || !originDescription.trim()) return;
    if (comparability === 'exact' && !exactAllowed) return;
    const interpretation: Omit<BrewingReferenceInterpretationV1, 'id' | 'author' | 'origin'> = {
      observationId: observation.id,
      observationVersion: observation.version,
      reference: { id: targetReference.id, version: targetReference.version, contentReference: targetReference.contentReference },
      targetDefinition,
      relation: relation.trim(),
      reason: reason.trim(),
      comparability: comparability === 'exact' ? { kind: 'exact' } : { kind: 'nonComparable', reason: reason.trim() },
    };
    onLink(interpretation, originDescription.trim());
  }

  return <form className="hv55-ref-link" autoComplete="off" onSubmit={submit}>
    <h4>Lier cette version à une référence adoptée</h4>
    <div className="hv55-ref-fields">
      <label className="hv55-ref-field"><span>Référence adoptée</span><select aria-label={`Référence pour ${observation.id} v${observation.version}`} value={referenceKey}
        onChange={event => {
          const selectedReference = references.find(row => row.contentReference === event.target.value);
          setReferenceKey(event.target.value);
          setDefinitionReference(selectedReference?.sensoryDefinitions[0]?.contentReference ?? '');
        }}>
        {references.map(row => <option key={row.contentReference} value={row.contentReference}>{referenceDisplayLabel(row)} · version {row.version}</option>)}
      </select></label>
      <label className="hv55-ref-field"><span>Dimension cible figée</span><select aria-label={`Dimension cible pour ${observation.id} v${observation.version}`} value={definitionReference}
        onChange={event => setDefinitionReference(event.target.value)}>
        {definitions.map(row => <option key={row.contentReference} value={row.contentReference}>{row.dimension.name} · {metricDisplayLabel(row.metric?.kind)}</option>)}
      </select></label>
      <label className="hv55-ref-field"><span>Relation constatée</span><Input autoComplete="off" aria-label={`Relation pour ${observation.id} v${observation.version}`} value={relation} onChange={event => setRelation(event.target.value)} /></label>
      <label className="hv55-ref-field"><span>Comparabilité</span><select aria-label={`Comparabilité pour ${observation.id} v${observation.version}`} value={comparability}
        onChange={event => setComparability(event.target.value as InterpretationComparability)}>
        <option value="nonComparable">Non comparable · préciser pourquoi</option>
        <option value="exact" disabled={!exactAllowed}>Exacte · même définition et échelle connue</option>
      </select></label>
      <label className="hv55-ref-field hv55-ref-wide"><span>Motif du lien</span><Textarea autoComplete="off" aria-label={`Motif pour ${observation.id} v${observation.version}`} rows={2} value={reason} onChange={event => setReason(event.target.value)} /></label>
      <label className="hv55-ref-field hv55-ref-wide"><span>Origine de l’interprétation</span><Input autoComplete="off" aria-label={`Origine pour ${observation.id} v${observation.version}`} value={originDescription} onChange={event => setOriginDescription(event.target.value)} /></label>
    </div>
    {!exactAllowed ? <p className="hv55-ref-muted">La dimension ou l’échelle ne permet pas une équivalence exacte. Le lien restera explicitement non comparable tant qu’aucun mapping adopté ne couvre ces définitions.</p> : null}
    {linkBlockReason ? <p className="hv55-ref-muted">{linkBlockReason}</p> : null}
    <button type="submit" disabled={busy || !targetDefinition || !relation.trim() || !reason.trim() || !originDescription.trim()
      || comparability === 'exact' && !exactAllowed}>Enregistrer le lien séparé</button>
  </form>;
}

export function HopV55ReferencePanel({ workspace, context, prepared, getWorkspace, onSave, observationDefinitions, observationScope }: HopV55ReferencePanelProps) {
  const [currentWorkspace, setCurrentWorkspace] = useState(workspace);
  const [projection, setProjection] = useState<BrewingReferenceProjectionV1 | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const busyRef = useRef(false);
  const latestProps = useRef({ context, prepared, getWorkspace, onSave, observationDefinitions, observationScope });
  latestProps.current = { context, prepared, getWorkspace, onSave, observationDefinitions, observationScope };

  const [observationMode, setObservationMode] = useState<'new' | 'correction'>('new');
  const [correctionId, setCorrectionId] = useState('');
  const [correctionVersion, setCorrectionVersion] = useState<number>();
  const [activationReferenceKey, setActivationReferenceKey] = useState('');
  const [activationReason, setActivationReason] = useState('');
  const [subjectKind, setSubjectKind] = useState(context.batch?.id ? 'batch' : 'sample');
  const [subjectId, setSubjectId] = useState(typeof context.batch?.id === 'string' ? context.batch.id : '');
  const [subjectLabel, setSubjectLabel] = useState(typeof context.batch?.name === 'string' ? context.batch.name : '');
  const [observedAt, setObservedAt] = useState(() => localDateTimeValue(new Date()));
  const [originalText, setOriginalText] = useState('');
  const [originDescription, setOriginDescription] = useState('Observation saisie par le brasseur.');
  const [sourceReference, setSourceReference] = useState('');
  const [dimensionReference, setDimensionReference] = useState('');
  const [dimensionLabel, setDimensionLabel] = useState('');
  const [senseKind, setSenseKind] = useState<ObservationSenseKind>('qualitative');
  const [ratingValue, setRatingValue] = useState<number>();
  const [scaleMode, setScaleMode] = useState<ScaleMode>('unknown');
  const [scaleMin, setScaleMin] = useState<number>();
  const [scaleMax, setScaleMax] = useState<number>();
  const [scaleLowLabel, setScaleLowLabel] = useState('');
  const [scaleHighLabel, setScaleHighLabel] = useState('');
  const [scaleDescription, setScaleDescription] = useState('');
  const [measurementValue, setMeasurementValue] = useState<number>();
  const [measurementMin, setMeasurementMin] = useState<number>();
  const [measurementMax, setMeasurementMax] = useState<number>();
  const [measurementMode, setMeasurementMode] = useState<'point' | 'range'>('point');
  const [measurementUnit, setMeasurementUnit] = useState('');
  const [measurementBasis, setMeasurementBasis] = useState('');
  const [measurementMethod, setMeasurementMethod] = useState('');
  const [conditions, setConditions] = useState('');
  const [comparisonKind, setComparisonKind] = useState<'absolute' | 'relative'>('absolute');
  const [relationship, setRelationship] = useState('');
  const [referentContentReference, setReferentContentReference] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [observationStateDraft, setObservationStateDraft] = useState<ObservationStateDraft>();
  const [observationStateReset, setObservationStateReset] = useState(0);
  const [currentStateOnlyOpen, setCurrentStateOnlyOpen] = useState(false);
  const [currentStateOnlyDraft, setCurrentStateOnlyDraft] = useState<ObservationStateDraft>();
  const [currentStateOnlyReset, setCurrentStateOnlyReset] = useState(0);
  const pendingCurrentStateOnly = useRef<{ fingerprint: string; id: string; recordedAt: string } | null>(null);
  const pendingObservationCapture = useRef<{ fingerprint: string; identity: string; commandId: string; anchorId: string;
    currentPreparationId: string; recordedAt: string } | null>(null);
  const noticeWorkspaceId = useRef(workspace?.id);

  useEffect(() => {
    const identityChanged = noticeWorkspaceId.current !== workspace?.id;
    noticeWorkspaceId.current = workspace?.id;
    if (identityChanged) {
      setError('');
      setNotice('');
    }
    setCurrentWorkspace(workspace);
    if (!workspace) {
      setProjection(null);
      setLoading(false);
      return;
    }
    try {
      setProjection(getHopV55ReferenceProjection(workspace));
      setLoading(false);
    } catch (cause) {
      setProjection(null);
      setLoading(false);
      setError(cause instanceof Error ? cause.message : 'Le journal transmis ne peut pas être lu.');
    }
  }, [workspace]);

  const supportedJournal = !!currentWorkspace?.referenceJournal && !!projection;
  const futureJournal = !!currentWorkspace?.referenceJournal && !projection && !loading;
  const latestVersions = useMemo(() => projection ? latestObservationVersions(projection) : [], [projection]);
  const adopted = useMemo(() => projection ? adoptedReferences(projection) : [], [projection]);
  const availableDefinitions = useMemo(() => projection ? exactDefinitionList(projection) : [], [projection]);
  const observationDefinitionOptions = useMemo(() => {
    const definitions = new Map<string, BrewingSensoryDefinitionReference>();
    for (const definition of [...availableDefinitions, ...(observationDefinitions ?? [])]) definitions.set(definition.contentReference, definition);
    return [...definitions.values()];
  }, [availableDefinitions, observationDefinitions]);
  const currentIdentity = projection?.currentReference ?? null;
  const currentReference = currentIdentity
    ? projection?.references.find(row => sameIdentity(row, currentIdentity)) ?? null : null;
  const adoptedBaseline = useMemo(() => currentWorkspace ? getHopV55AdoptedBaseline(currentWorkspace) : undefined, [currentWorkspace]);
  const adoptedCulture: BrewingScenarioCultureContext | undefined = adoptedBaseline?.kind === 'hypothetical'
    ? adoptedBaseline.culture : undefined;
  const adoptedCultureSourceLabel = currentReference
    ? `${typeof currentReference.content.label === 'string' ? currentReference.content.label : currentReference.id} · ${currentReference.id} · v${currentReference.version}`
    : undefined;
  const currentAdoption = currentReference && projection
    ? projection.adoptions.find(row => sameIdentity(row.reference, currentReference)) : undefined;
  const reactivationCandidates = adopted.filter(row => !currentReference || !sameIdentity(row, currentReference));
  const activationTarget = reactivationCandidates.find(row => row.contentReference === activationReferenceKey) ?? reactivationCandidates[0];
  const selectedDefinition = observationDefinitionOptions.find(row => row.contentReference === dimensionReference);
  const currentReferents = projection?.adoptions.flatMap(adoption => {
    const reference = projection.references.find(row => sameIdentity(row, adoption.reference));
    return reference ? [reference] : [];
  }) ?? [];
  const correction = latestVersions.find(row => row.id === correctionId && row.version === correctionVersion);
  const correctionAnchor = anchorForObservation(currentWorkspace, correction);
  const definitionSources = useMemo(() => getHopV55ReferenceDefinitions(prepared), [prepared]);
  const actualProgram = actualProgramSummary(context, prepared.runtime.current?.program);
  const hypothesisAdditionCount = currentReference ? referenceAdditionCount(currentReference) : undefined;
  const sourceRecipeKnown = !!context.recipe || !!context.batch?.recipeSnapshot;
  const realContextKnown = !!(context.batch || context.recipe || prepared.runtime.current);

  async function mutateWorkspace(update: (latest: HopV55Workspace, latestProjection: BrewingReferenceProjectionV1) => HopV55Workspace,
    successMessage: string): Promise<HopV55Workspace | undefined> {
    if (busyRef.current) return undefined;
    busyRef.current = true;
    setBusy(true); setError(''); setNotice('');
    try {
      const props = latestProps.current;
      const latest = await props.getWorkspace();
      const ensured = ensureHopV55ReferenceJournal(latest, props.context, props.prepared);
      const latestProjection = getHopV55ReferenceProjection(ensured);
      if (!latestProjection) throw new Error('Le journal est dans un format futur; il reste en lecture seule.');
      const updated = update(ensured, latestProjection);
      if (updated === ensured) {
        setCurrentWorkspace(ensured);
        setProjection(latestProjection);
        setNotice(successMessage);
        return ensured;
      }
      const saved = await props.onSave(updated);
      const savedProjection = getHopV55ReferenceProjection(saved);
      setCurrentWorkspace(saved);
      setProjection(savedProjection);
      setNotice(successMessage);
      return saved;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La commande n’a pas été conservée. La saisie reste disponible.');
      return undefined;
    } finally { busyRef.current = false; setBusy(false); }
  }

  function adoptHypothesis(hypothesis: HopV55Workspace['referenceHypotheses'][number], referenceVersion: string) {
    void mutateWorkspace((latest) => adoptHopV55ReferenceHypothesis(latest, hypothesis,
      latestProps.current.context, latestProps.current.prepared, { referenceVersion }), 'Référence proposée puis adoptée dans le journal.');
  }

  function reactivateReference(event: React.FormEvent) {
    event.preventDefault();
    if (!activationTarget || !activationReason.trim()) return;
    const selectedContentReference = activationTarget.contentReference;
    const reason = activationReason.trim();
    void mutateWorkspace((latest, latestProjection) => {
      const target = latestProjection.references.find(row => row.contentReference === selectedContentReference);
      if (!target) throw new Error('Cette version exacte n’existe plus dans le journal relu.');
      const identity: BrewingReferenceIdentityV1 = { id: target.id, version: target.version, contentReference: target.contentReference };
      const adoptedTarget = latestProjection.adoptions.some(row => sameIdentity(row.reference, identity));
      if (!adoptedTarget) throw new Error('Seule une référence exacte déjà adoptée peut redevenir courante.');
      if (latestProjection.currentReference && sameIdentity(latestProjection.currentReference, identity)) {
        throw new Error('Cette référence est déjà courante. Relis le journal avant de réessayer.');
      }
      const recordedAt = new Date().toISOString();
      return applyHopV55ReferenceEvent(latest, commandFor(latest, 'referenceActivated', {
        reference: identity,
        activatedBy: { id: latest.ownerKey, label: 'Brasseur' },
        reason,
      }, `reference-activate:${crypto.randomUUID()}`, recordedAt));
    }, 'Référence adoptée réactivée comme comparaison courante; aucun résultat ni fait de brassin n’a été réécrit.')
      .then(saved => { if (saved) { setActivationReason(''); setActivationReferenceKey(''); } });
  }

  function resetObservationDraft() {
    const currentContext = latestProps.current.context;
    setObservationMode('new'); setCorrectionId(''); setCorrectionVersion(undefined);
    setSubjectKind(currentContext.batch?.id ? 'batch' : 'sample');
    setSubjectId(typeof currentContext.batch?.id === 'string' ? currentContext.batch.id : '');
    setSubjectLabel(typeof currentContext.batch?.name === 'string' ? currentContext.batch.name : '');
    setObservedAt(localDateTimeValue(new Date())); setOriginalText('');
    setOriginDescription('Observation saisie par le brasseur.'); setSourceReference('');
    setDimensionReference(''); setDimensionLabel(''); setSenseKind('qualitative'); setRatingValue(undefined);
    setScaleMode('unknown'); setScaleMin(undefined); setScaleMax(undefined); setScaleLowLabel(''); setScaleHighLabel(''); setScaleDescription('');
    setMeasurementValue(undefined); setMeasurementMin(undefined); setMeasurementMax(undefined); setMeasurementMode('point');
    setMeasurementUnit(''); setMeasurementBasis(''); setMeasurementMethod(''); setConditions('');
    setComparisonKind('absolute'); setRelationship(''); setReferentContentReference(''); setCorrectionReason('');
    setObservationStateDraft(undefined); setObservationStateReset(value => value + 1); pendingObservationCapture.current = null;
  }

  async function saveCurrentPreparationWithoutObservation() {
    const draft = currentStateOnlyDraft;
    if (!draft || draft.status !== 'ready' || !draft.buildOptions || !canWrite || busyRef.current) return;
    const fingerprint = JSON.stringify({ sourceBatchId: context.batch?.id, asOf: draft.asOf,
      preparationReference: draft.preview?.reference, scope: observationScope ?? null });
    const pending = pendingCurrentStateOnly.current?.fingerprint === fingerprint
      ? pendingCurrentStateOnly.current
      : { fingerprint, id: `current-preparation:${crypto.randomUUID()}`, recordedAt: new Date().toISOString() };
    pendingCurrentStateOnly.current = pending;
    busyRef.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const props = latestProps.current;
      const latest = await props.getWorkspace();
      const options = draft.buildOptions(pending.recordedAt);
      const preparedCurrent = prepareHopV55CurrentPreparationRecord({ workspace: latest, id: pending.id,
        context: props.context, options });
      if (preparedCurrent.status === 'needs') throw new Error(preparedCurrent.requirements.join(' '));
      if (preparedCurrent.status !== 'ready') throw new Error(preparedCurrent.reasons.join(' '));
      const existing = latest.observationAnchors?.find(row => row.id === pending.id);
      let saved: HopV55Workspace;
      if (existing) {
        const read = readHopV55ObservationAnchorRecord(existing);
        if (read.status !== 'readOnly' || read.record.recordKind !== 'currentPreparation'
          || read.record.reference !== preparedCurrent.record.reference) {
          throw new Error('Cet identifiant de préparation existe avec une autre source; relis le workspace avant de continuer.');
        }
        saved = latest;
      } else {
        saved = await props.onSave(appendHopV55CurrentPreparationRecord(latest, preparedCurrent.record));
      }
      setCurrentWorkspace(saved);
      setProjection(getHopV55ReferenceProjection(saved));
      setNotice(`État physique ${preparedCurrent.record.preparation.state?.asOf ?? draft.asOf} conservé sans nouvelle note NR; aucune projection n’a été recalculée.`);
      setCurrentStateOnlyDraft(undefined);
      setCurrentStateOnlyReset(value => value + 1);
      pendingCurrentStateOnly.current = null;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'L’état physique n’a pas été conservé. La saisie reste disponible.');
    } finally { busyRef.current = false; setBusy(false); }
  }

  function recordObservation(event: React.FormEvent) {
    event.preventDefault();
    const fingerprint = JSON.stringify({ observationMode, correctionId, correctionVersion, subjectKind, subjectId, subjectLabel,
      observedAt, originalText, originDescription, sourceReference, dimensionReference, dimensionLabel, senseKind, ratingValue,
      scaleMode, scaleMin, scaleMax, scaleLowLabel, scaleHighLabel, scaleDescription, measurementValue, measurementMin,
      measurementMax, measurementMode, measurementUnit, measurementBasis, measurementMethod, conditions, comparisonKind,
      relationship, referentContentReference, correctionReason, stateStatus: observationStateDraft?.status,
      stateSubject: observationStateDraft?.subject, stateAsOf: observationStateDraft?.asOf,
      stateReference: observationStateDraft?.preview?.reference });
    const pending = pendingObservationCapture.current?.fingerprint === fingerprint ? pendingObservationCapture.current : {
      fingerprint,
      identity: observationMode === 'new' ? `observation:${crypto.randomUUID()}` : correctionId,
      commandId: `observation-${observationMode}:${crypto.randomUUID()}`,
      anchorId: `observation-anchor:${crypto.randomUUID()}`,
      currentPreparationId: `current-preparation:${crypto.randomUUID()}`,
      recordedAt: new Date().toISOString(),
    };
    pendingObservationCapture.current = pending;
    void mutateWorkspace((latest, latestProjection) => {
      const retriedEvent = latest.referenceJournal?.events.find(row => row.commandId === pending.commandId);
      if (retriedEvent) {
        const expectedKind = observationMode === 'correction' ? 'observationCorrected' : 'observationRecorded';
        if (retriedEvent.kind !== expectedKind || retriedEvent.payload.observation.id !== pending.identity
          || observationMode === 'correction' && (retriedEvent.kind !== 'observationCorrected'
            || retriedEvent.payload.correctsVersion !== correctionVersion)) {
          throw new Error('La commande de reprise porte un contenu différent; relis l’historique avant de réessayer.');
        }
        const correctionSource = observationMode === 'correction'
          ? latestProjection.observations.find(row => row.id === correctionId && row.version === correctionVersion) : undefined;
        const expectedAnchor = observationMode === 'new' ? observationStateDraft?.status === 'ready'
          : !!anchorForObservation(latest, correctionSource);
        const retriedAnchor = latest.observationAnchors?.find(row => row.id === pending.anchorId);
        if (expectedAnchor) {
          const anchorRead = retriedAnchor ? readHopV55ObservationAnchorRecord(retriedAnchor) : null;
          if (!anchorRead || anchorRead.status !== 'readOnly'
            || anchorRead.record.recordKind !== 'observationAnchor'
            || JSON.stringify(anchorRead.record.anchor?.observation) !== JSON.stringify(retriedEvent.payload.observation)) {
            throw new Error('La note a été enregistrée sans son ancre atomique attendue; relis le workspace avant de continuer.');
          }
          if (observationMode === 'new' && observationStateDraft?.status === 'ready') {
            const current = latest.observationAnchors?.find(row => row.id === pending.currentPreparationId);
            const currentRead = current ? readHopV55ObservationAnchorRecord(current) : null;
            if (!currentRead || currentRead.status !== 'readOnly' || currentRead.record.recordKind !== 'currentPreparation') {
              throw new Error('La préparation courante et l’ancre doivent être conservées ensemble; relis le workspace avant de continuer.');
            }
          }
        } else if (retriedAnchor) {
          throw new Error('Une ancre inattendue accompagne cette reprise; relis le workspace avant de continuer.');
        }
        return latest;
      }
      const recordedAt = pending.recordedAt;
      let identity: string;
      let version: number;
      let correctsVersion: number | undefined;
      let correctionSource: BrewingReferenceObservationV1 | undefined;
      if (observationMode === 'correction') {
        const current = latestProjection.observations.filter(row => row.id === correctionId).sort((a, b) => b.version - a.version)[0];
        if (!current || current.version !== correctionVersion) throw new Error('L’observation a été corrigée ailleurs; relire son historique avant une nouvelle correction.');
        if (!correctionReason.trim()) throw new Error('La correction exige un motif conservé dans le journal.');
        correctionSource = current;
        identity = current.id; version = current.version + 1; correctsVersion = current.version;
      } else {
        identity = pending.identity; version = 1;
        const retriedCommand = latest.referenceJournal?.events.some(row => row.commandId === pending.commandId) ?? false;
        if (latestProjection.observations.some(row => row.id === identity) && !retriedCommand) throw new Error('L’identité générée existe déjà; relire avant de recommencer la dégustation.');
      }

      const observedAtValue = correctionSource?.observedAt ?? inputDateTimeToIso(observedAt);
      if (!correctionSource && Date.parse(observedAtValue) > Date.parse(recordedAt)) throw new Error('La date observée ne peut pas être dans le futur.');
      if (!originalText.trim()) throw new Error('La note originale doit être renseignée.');
      const physicalSubjectReady = !correctionSource && observationStateDraft?.status === 'ready';
      if (!correctionSource && ((!physicalSubjectReady && (!subjectKind.trim() || !subjectLabel.trim())) || !originDescription.trim())) {
        throw new Error('L’objet observé et son origine doivent être renseignés.');
      }
      if (!correctionSource && latestProps.current.context.batch?.id && latestProps.current.context.batch.recipeSnapshot && observationStateDraft?.status !== 'ready') {
        throw new Error(observationStateDraft?.reason ?? 'L’état physique exact du batch doit être préparé avant sa nouvelle observation.');
      }

      let dimension: BrewingReferenceObservationV1['dimension'];
      let scale: BrewingReferenceObservationV1['scale'];
      if (correctionSource) {
        dimension = structuredClone(correctionSource.dimension);
        scale = structuredClone(correctionSource.scale);
      } else {
        const exactSelectedDefinition = dimensionReference
          ? latestProps.current.observationDefinitions?.find(row => row.contentReference === dimensionReference)
            ?? latestProjection.references.flatMap(reference => reference.sensoryDefinitions).find(row => row.contentReference === dimensionReference)
          : undefined;
        if (dimensionReference && !exactSelectedDefinition) throw new Error('La définition choisie n’est plus dans le journal; relire avant de l’enregistrer.');
        if (exactSelectedDefinition) {
          const metric = exactSelectedDefinition.metric;
          const definitionScale = exactSelectedDefinition.scale;
          if (senseKind !== 'qualitative' && metric?.kind === 'modelIndex') {
            throw new Error('Une définition d’indice de modèle ne correspond pas à une note ou une mesure humaine; garde la dimension non résolue ou choisis une définition compatible.');
          }
          if (senseKind === 'analyticalMeasurement' && metric?.kind !== 'measurement') {
            throw new Error('Une mesure analytique exige sa propre dimension de mesure; le libellé libre reste non résolu.');
          }
          if (senseKind === 'analyticalMeasurement' && metric?.unit && metric.unit !== measurementUnit.trim()) {
            throw new Error(`L’unité doit correspondre à la définition de mesure (${metric.unit}).`);
          }
          if (!metric || !definitionScale) throw new Error('La définition résolue ne porte pas de métrique et d’échelle exactes; conserve une dimension non résolue.');
          dimension = { status: 'resolved', definition: structuredClone(exactSelectedDefinition) };
          scale = { status: 'known', metric: structuredClone(metric), scale: structuredClone(definitionScale) };
        } else {
          if (!dimensionLabel.trim()) throw new Error('Le libellé libre de la dimension doit être renseigné.');
          dimension = { status: 'unresolved', label: dimensionLabel.trim() };
          if (senseKind === 'sensoryRating' && scaleMode === 'declared') {
            if (scaleMin === undefined || scaleMax === undefined || scaleMin > scaleMax || !scaleDescription.trim()) {
              throw new Error('Déclare les bornes et le sens de ton échelle ordinale.');
            }
            if (ratingValue === undefined || ratingValue < scaleMin || ratingValue > scaleMax) {
              throw new Error('La note doit rester dans les bornes de l’échelle déclarée.');
            }
            const labels = [];
            if (scaleLowLabel.trim()) labels.push({ value: scaleMin, label: scaleLowLabel.trim() });
            if (scaleHighLabel.trim()) labels.push({ value: scaleMax, label: scaleHighLabel.trim() });
            const scaleSource: HopSource = { title: 'Échelle ordinale déclarée', author: 'Brasseur', year: null, kind: 'judgment',
              reference: `user-declared-scale:${identity}:v${version}`, locator: scaleDescription.trim() };
            const metricId = `ordinal-note:${identity}:v${version}`;
            const metric = { id: metricId, version: String(version), kind: 'ordinalNote' as const,
              name: 'Note sensorielle ordinale déclarée',
              meaning: 'Échelle définie par le brasseur pour cette observation; aucune correspondance à un indice de modèle.',
              unit: null, sourceRefs: [scaleSource] };
            const declaredScale: BrewingSensoryScale = { id: `ordinal-scale:${identity}:v${version}`, version: String(version),
              metricRef: { id: metric.id, version: metric.version }, domain: { min: scaleMin, max: scaleMax },
              ...(labels.length ? { labels } : {}), sourceRefs: [scaleSource] };
            scale = { status: 'known', metric, scale: declaredScale };
          } else scale = { status: 'unknown' };
        }
      }

      let sense: BrewingReferenceObservationV1['sense'];
      if (correctionSource?.sense.kind === 'qualitative') sense = structuredClone(correctionSource.sense);
      else if (correctionSource?.sense.kind === 'sensoryRating') {
        if (ratingValue === undefined) throw new Error('Saisis une note ordinale pour corriger cette observation.');
        const domain = correctionSource.scale.status === 'known' ? correctionSource.scale.scale.domain : undefined;
        if (domain && (ratingValue < domain.min || ratingValue > domain.max)) throw new Error('La note corrigée doit rester dans les bornes de l’échelle historique.');
        sense = { kind: 'sensoryRating', value: ratingValue };
      } else if (correctionSource?.sense.kind === 'analyticalMeasurement') {
        if (measurementMode === 'range') {
          if (measurementMin === undefined || measurementMax === undefined || measurementMin > measurementMax) throw new Error('La plage analytique corrigée est incomplète ou inversée.');
          sense = { kind: 'analyticalMeasurement', value: { min: measurementMin, max: measurementMax },
            unit: correctionSource.sense.unit, basis: correctionSource.sense.basis, method: correctionSource.sense.method };
        } else {
          if (measurementValue === undefined) throw new Error('La mesure analytique corrigée est absente.');
          sense = { kind: 'analyticalMeasurement', value: measurementValue,
            unit: correctionSource.sense.unit, basis: correctionSource.sense.basis, method: correctionSource.sense.method };
        }
      } else if (senseKind === 'qualitative') sense = { kind: 'qualitative' };
      else if (senseKind === 'sensoryRating') {
        if (ratingValue === undefined) throw new Error('Saisis la note ordinale explicitement ou laisse le constat qualitatif.');
        const exactOrdinalDomain = selectedDefinition?.metric?.kind === 'ordinalNote' ? selectedDefinition.scale?.domain : undefined;
        if (exactOrdinalDomain && (ratingValue < exactOrdinalDomain.min || ratingValue > exactOrdinalDomain.max)) {
          throw new Error('La note doit rester dans les bornes de l’échelle ordinale exacte choisie.');
        }
        sense = { kind: 'sensoryRating', value: ratingValue };
      } else {
        if (!measurementUnit.trim() || !measurementBasis.trim() || !measurementMethod.trim()) {
          throw new Error('Une mesure analytique exige valeur, unité, base et méthode.');
        }
        if (measurementMode === 'range') {
          if (measurementMin === undefined || measurementMax === undefined || measurementMin > measurementMax) throw new Error('La plage analytique est incomplète ou inversée.');
          sense = { kind: 'analyticalMeasurement', value: { min: measurementMin, max: measurementMax }, unit: measurementUnit.trim(), basis: measurementBasis.trim(), method: measurementMethod.trim() };
        } else {
          if (measurementValue === undefined) throw new Error('La mesure analytique exacte est absente.');
          sense = { kind: 'analyticalMeasurement', value: measurementValue, unit: measurementUnit.trim(), basis: measurementBasis.trim(), method: measurementMethod.trim() };
        }
      }

      let comparison: BrewingReferenceObservationV1['comparison'];
      if (correctionSource) comparison = structuredClone(correctionSource.comparison);
      else if (comparisonKind === 'absolute') comparison = { kind: 'absolute' };
      else {
        if (!relationship.trim()) throw new Error('Une comparaison relative exige une relation déclarée.');
        const adoptedReference = latestProjection.adoptions.flatMap(adoption =>
          latestProjection.references.filter(reference => sameIdentity(reference, adoption.reference)))
          .find(row => row.contentReference === referentContentReference);
        comparison = { kind: 'relative', relationship: relationship.trim(), referent: adoptedReference
          ? { id: adoptedReference.id, version: adoptedReference.version, contentReference: adoptedReference.contentReference } : null };
      }
      const actor = { id: latest.ownerKey, label: 'Brasseur' };
      const physicalSubject = !correctionSource && observationStateDraft?.status === 'ready' ? observationStateDraft.subject : undefined;
      const observation: BrewingReferenceObservationV1 = {
        id: identity, version,
        subject: correctionSource ? structuredClone(correctionSource.subject) : physicalSubject
          ? { kind: physicalSubject.kind, id: physicalSubject.id, label: physicalSubject.label }
          : { kind: subjectKind.trim(), ...(subjectId.trim() ? { id: subjectId.trim() } : {}), label: subjectLabel.trim() },
        observedAt: observedAtValue,
        author: actor,
        origin: correctionSource ? structuredClone(correctionSource.origin)
          : { kind: 'userEntered', description: originDescription.trim(), ...(sourceReference.trim() ? { sourceReference: sourceReference.trim() } : {}) },
        originalText, dimension, scale, sense, comparison,
        context: correctionSource ? structuredClone(correctionSource.context)
          : { ...(conditions.trim() ? { conditions: conditions.trim() } : {}), workspaceId: latest.id },
      };
      const command = observationMode === 'correction'
        ? commandFor(latest, 'observationCorrected', { observation, correctsVersion: correctsVersion!, reason: correctionReason.trim() }, pending.commandId, recordedAt)
        : commandFor(latest, 'observationRecorded', { observation }, pending.commandId, recordedAt);

      const retainedAnchor = anchorForObservation(latest, correctionSource);
      if (correctionSource && retainedAnchor) {
        const preparedAnchor = prepareHopV55ObservationAnchor({ workspace: latest, id: pending.anchorId,
          source: { kind: 'reanchorCorrection', previousAnchorRecordId: retainedAnchor.id }, referenceCommand: command,
          anchor: { subjectRelation: retainedAnchor.anchor!.subjectRelation,
            explanation: `Correction de ${correctionSource.id} v${correctionSource.version}; état repris de l’ancre historique ${retainedAnchor.reference}.`,
            createdAt: recordedAt, createdBy: { origin: 'user', name: 'Brasseur' } } });
        if (preparedAnchor.status === 'needs') throw new Error(preparedAnchor.requirements.join(' '));
        if (preparedAnchor.status !== 'ready') throw new Error(preparedAnchor.reasons.join(' '));
        return appendHopV55ObservationAnchor(latest, preparedAnchor.record, preparedAnchor.referenceJournalPatch);
      }

      if (!correctionSource && observationStateDraft?.status === 'ready') {
        const priorAttempt = latest.observationAnchors?.find(row => row.id === pending.anchorId);
        if (priorAttempt) {
          const read = readHopV55ObservationAnchorRecord(priorAttempt);
          if (read.status === 'readOnly' && read.record.anchor?.observation.id === observation.id
            && read.record.anchor.observation.version === observation.version
            && JSON.stringify(read.record.anchor.observation) === JSON.stringify(observation)) return latest;
          throw new Error('Cet identifiant d’ancre existe avec un contenu différent; relis le workspace avant de réessayer.');
        }
        const options = observationStateDraft.buildOptions?.(recordedAt);
        if (!options) throw new Error('Les attestations d’état ne sont pas prêtes pour cette observation.');
        const currentPreparation = prepareHopV55CurrentPreparationRecord({ workspace: latest, id: pending.currentPreparationId,
          context: latestProps.current.context, options });
        if (currentPreparation.status === 'needs') throw new Error(currentPreparation.requirements.join(' '));
        if (currentPreparation.status !== 'ready') throw new Error(currentPreparation.reasons.join(' '));
        const preparedAnchor = prepareHopV55ObservationAnchor({ workspace: latest, id: pending.anchorId,
          source: { kind: 'context', context: latestProps.current.context, options }, referenceCommand: command,
          anchor: { subjectRelation: 'sameSubject',
            explanation: `La note et l’état sont liés par l’identifiant physique exact ${observationStateDraft.subject?.id ?? ''} du batch.`,
            createdAt: recordedAt, createdBy: { origin: 'user', name: 'Brasseur' } } });
        if (preparedAnchor.status === 'needs') throw new Error(preparedAnchor.requirements.join(' '));
        const withCurrent = appendHopV55CurrentPreparationRecord(latest, currentPreparation.record);
        return appendHopV55ObservationAnchor(withCurrent, preparedAnchor.record, preparedAnchor.referenceJournalPatch);
      }
      return applyHopV55ReferenceEvent(latest, command);
    }, observationMode === 'correction' ? 'Correction conservée comme nouvelle version; l’ancienne reste dans l’historique.' : 'Observation enregistrée avant tout calcul; elle reste distincte d’un indice de modèle.')
      .then(saved => { if (saved) resetObservationDraft(); });
  }

  function linkInterpretation(observation: BrewingReferenceObservationV1, interpretation: Omit<BrewingReferenceInterpretationV1, 'id' | 'author' | 'origin'>, origin: string) {
    void mutateWorkspace((latest, latestProjection) => {
      const retainedObservation = latestProjection.observations.find(row => row.id === observation.id && row.version === observation.version);
      const adoptedReference = adoptedReferences(latestProjection).find(row => sameIdentity(row, interpretation.reference));
      if (!retainedObservation || !adoptedReference) throw new Error('La version d’observation ou la référence adoptée a changé; relire avant de lier.');
      if (!adoptedReference.sensoryDefinitions.some(row => row.contentReference === interpretation.targetDefinition.contentReference)) {
        throw new Error('La définition cible ne figure plus dans cette version de référence.');
      }
      const complete: BrewingReferenceInterpretationV1 = { ...structuredClone(interpretation), id: `interpretation:${crypto.randomUUID()}`,
        author: { id: latest.ownerKey, label: 'Brasseur' }, origin: { kind: 'userInterpretation', description: origin } };
      const command = commandFor(latest, 'interpretationLinked', { interpretation: complete },
        `interpretation-link:${complete.id}`, new Date().toISOString());
      return applyHopV55ReferenceEvent(latest, command);
    }, 'Lien d’interprétation conservé séparément; l’observation et son référent initial restent inchangés.');
  }

  function selectCorrection(id: string) {
    setCorrectionId(id);
    const observation = latestVersions.find(row => row.id === id);
    setCorrectionVersion(observation?.version);
    if (!observation) return;
    const knownScale = observation.scale.status === 'known' ? observation.scale : undefined;
    setSubjectKind(observation.subject.kind); setSubjectId(observation.subject.id ?? ''); setSubjectLabel(observation.subject.label);
    setOriginalText(observation.originalText); setOriginDescription(observation.origin.description); setSourceReference(observation.origin.sourceReference ?? '');
    setDimensionReference(observation.dimension.status === 'resolved' ? observation.dimension.definition.contentReference : '');
    setDimensionLabel(observation.dimension.status === 'unresolved' ? observation.dimension.label : '');
    setSenseKind(observation.sense.kind);
    setRatingValue(observation.sense.kind === 'sensoryRating' ? observation.sense.value : undefined);
    setScaleMode(observation.scale.status === 'known' && observation.scale.metric.kind === 'ordinalNote' ? 'declared' : 'unknown');
    setScaleMin(knownScale?.scale.domain?.min);
    setScaleMax(knownScale?.scale.domain?.max);
    setScaleLowLabel(knownScale?.scale.labels?.find(row => row.value === knownScale.scale.domain?.min)?.label ?? '');
    setScaleHighLabel(knownScale?.scale.labels?.find(row => row.value === knownScale.scale.domain?.max)?.label ?? '');
    setScaleDescription(knownScale?.metric.kind === 'ordinalNote' ? knownScale.metric.sourceRefs[0]?.locator ?? '' : '');
    setMeasurementMode(observation.sense.kind === 'analyticalMeasurement' && typeof observation.sense.value !== 'number' ? 'range' : 'point');
    setMeasurementValue(observation.sense.kind === 'analyticalMeasurement' && typeof observation.sense.value === 'number' ? observation.sense.value : undefined);
    setMeasurementMin(observation.sense.kind === 'analyticalMeasurement' && typeof observation.sense.value !== 'number' ? observation.sense.value.min : undefined);
    setMeasurementMax(observation.sense.kind === 'analyticalMeasurement' && typeof observation.sense.value !== 'number' ? observation.sense.value.max : undefined);
    setMeasurementUnit(observation.sense.kind === 'analyticalMeasurement' ? observation.sense.unit : '');
    setMeasurementBasis(observation.sense.kind === 'analyticalMeasurement' ? observation.sense.basis : '');
    setMeasurementMethod(observation.sense.kind === 'analyticalMeasurement' ? observation.sense.method : '');
    setConditions(typeof observation.context.conditions === 'string' ? observation.context.conditions : '');
    setComparisonKind(observation.comparison.kind);
    setRelationship(observation.comparison.kind === 'relative' ? observation.comparison.relationship : '');
    setReferentContentReference(observation.comparison.kind === 'relative' ? observation.comparison.referent?.contentReference ?? '' : '');
    setCorrectionReason('');
  }

  const canWrite = !futureJournal && !loading && !busy;
  const dimensionOptions = observationDefinitionOptions.filter(definition => {
    if (senseKind === 'qualitative') return true;
    if (senseKind === 'sensoryRating') return definition.metric?.kind === 'ordinalNote';
    return definition.metric?.kind === 'measurement';
  });
  const scaleDeclarationInvalid = observationMode === 'new' && scaleMode === 'declared' && (scaleMin === undefined || scaleMax === undefined
    || scaleMin > scaleMax || !scaleDescription.trim() || ratingValue === undefined
    || ratingValue < (scaleMin ?? Infinity) || ratingValue > (scaleMax ?? -Infinity));
  const measurementValueInvalid = measurementMode === 'point' ? measurementValue === undefined
    : measurementMin === undefined || measurementMax === undefined || measurementMin > measurementMax;
  const measurementInvalid = senseKind === 'analyticalMeasurement' && (observationMode === 'correction'
    ? measurementValueInvalid
    : !measurementUnit.trim() || !measurementBasis.trim() || !measurementMethod.trim() || measurementValueInvalid);
  const relativeInvalid = observationMode === 'new' && comparisonKind === 'relative' && !relationship.trim();
  const ratingDomain = observationMode === 'correction'
    ? correction?.scale.status === 'known' ? correction.scale.scale.domain : undefined
    : selectedDefinition?.metric?.kind === 'ordinalNote' ? selectedDefinition.scale?.domain : undefined;
  const ratingInvalid = senseKind === 'sensoryRating' && (ratingValue === undefined || (observationMode === 'correction'
    ? !!ratingDomain && (ratingValue < ratingDomain.min || ratingValue > ratingDomain.max)
    : !!ratingDomain ? ratingValue < ratingDomain.min || ratingValue > ratingDomain.max
      : scaleMode === 'declared' && (scaleMin === undefined || scaleMax === undefined || ratingValue < (scaleMin ?? Infinity) || ratingValue > (scaleMax ?? -Infinity))));
  const dimensionInvalid = observationMode === 'correction' ? !correction : !selectedDefinition && !dimensionLabel.trim();
  const observedAtMillis = observedAt.trim() ? new Date(observedAt).getTime() : NaN;
  const observedAtInvalid = observationMode === 'new' && (!Number.isFinite(observedAtMillis) || observedAtMillis > Date.now());
  const stateCanDefineSubject = observationMode === 'new' && observationStateDraft?.status === 'ready';
  const physicalStateBlocked = observationMode === 'new' && !!context.batch?.id && !!context.batch.recipeSnapshot
    && observationStateDraft?.status !== 'ready';
  const subjectInvalid = observationMode === 'correction' ? !correction || !originalText.trim()
    : (!stateCanDefineSubject && (!subjectKind.trim() || !subjectLabel.trim())) || !originalText.trim() || !originDescription.trim() || observedAtInvalid;
  const definitionMismatch = observationMode === 'new' && !!selectedDefinition && senseKind !== 'qualitative'
    && (senseKind === 'sensoryRating' && selectedDefinition.metric?.kind !== 'ordinalNote'
      || senseKind === 'analyticalMeasurement' && (selectedDefinition.metric?.kind !== 'measurement'
        || !!selectedDefinition.metric.unit && selectedDefinition.metric.unit !== measurementUnit.trim()));
  const cannotCorrect = observationMode === 'correction' && (!correction || !correctionReason.trim());

  return <section className="hv55-reference" aria-labelledby="hv55-reference-title" data-testid="hop-v55-reference-panel">
    <header className="hv55-ref-heading">
      <div><p className="hv55-ref-kicker">Houblons · notes et références</p><h2 id="hv55-reference-title">Référence et observations</h2>
        <p>Le programme réel, les hypothèses et les observations restent distingués.</p></div>
    </header>
    {loading ? <p className="hv55-ref-status" role="status">Ouverture et relecture du contexte de référence…</p> : null}
    {busy ? <p className="hv55-ref-status" role="status">Enregistrement et relecture du journal de référence…</p> : null}
    {notice ? <p className="hv55-ref-status" role="status">{notice}</p> : null}
    {error ? <div className="hv55-ref-error" role="alert"><p>{error}</p>
      <p>La saisie reste disponible. Une nouvelle commande relira la révision courante avant de la conserver.</p>
      {currentWorkspace?.referenceJournal ? <details><summary>Journal reçu, conservé tel quel</summary><pre>{JSON.stringify(currentWorkspace.referenceJournal, null, 2)}</pre></details> : null}
    </div> : null}

    {futureJournal ? <div className="hv55-ref-readonly" role="status"><strong>Cette version de notes est conservée en lecture seule</strong>
      <p>Le journal et ses événements sont conservés tels quels. Aucune conversion, adoption ou écriture n’est proposée.</p>
      <details><summary>Détails techniques reçus · lecture seule</summary><pre>{JSON.stringify(currentWorkspace?.referenceJournal, null, 2)}</pre></details>
    </div> : null}

    {!futureJournal ? <>
      {supportedJournal && projection ? <>
      <div className="hv55-ref-current" aria-live="polite">
        <div><strong>Passé du programme</strong><span>{pastDescription(projection)}</span></div>
        <div><strong>{context.batch ? 'Brassin en cours' : context.recipe ? 'Recette source'
          : prepared.runtime.current ? 'Programme réel courant' : 'Contexte réel non renseigné'}</strong>
          <span>{realContextKnown ? `${actualProgram.label} · ${actualProgram.stage}` : 'Programme effectif inconnu.'}</span>
          {actualProgram.performedCount !== undefined ? <span>{additionCount(actualProgram.performedCount)} déjà consigné{actualProgram.performedCount === 1 ? '' : 's'} comme effectué{actualProgram.performedCount === 1 ? '' : 's'}.</span> : null}
          {actualProgram.futureCount !== undefined ? <span>{additionCount(actualProgram.futureCount)} planifié{actualProgram.futureCount === 1 ? '' : 's'} à partir de cette étape.</span> : null}
          {actualProgram.overdueCount ? <span>{additionCount(actualProgram.overdueCount)} planifié{actualProgram.overdueCount === 1 ? '' : 's'} en phase passée, sans confirmation d’exécution.</span> : null}
        </div>
        <div><strong>Hypothèse de comparaison</strong>{currentReference
          ? <><span>{referenceDisplayLabel(currentReference)} · version {currentReference.version}</span>
            {currentAdoption ? <span>Adoptée le {showDate(currentAdoption.adoptedAt)}.</span> : null}
            {hypothesisAdditionCount !== undefined ? <span>{additionCount(hypothesisAdditionCount)} déclaré{hypothesisAdditionCount === 1 ? '' : 's'} dans cette hypothèse.</span> : null}</>
          : prepared.runtime.current
            ? <span>Aucune hypothèse comparative adoptée. La recette source reste une base de calcul valide.</span>
            : <span>Aucune hypothèse adoptée. Les observations restent enregistrables; pour chiffrer une exploration sans recette, une hypothèse sera nécessaire.</span>}</div>
      </div>
      <details className="hv55-ref-context"><summary>Contexte et références exactes</summary>
        <p><strong>Espace de travail</strong> · <code>{currentWorkspace?.id}</code></p>
        <p><strong>Étape du programme</strong> · {realContextKnown ? actualProgram.stage : 'Inconnue · aucun programme effectif reçu'}</p>
        {projection.context.programReference ? <p><strong>Programme exact</strong> · <code>{projection.context.programReference.id} · {projection.context.programReference.contentReference}</code></p>
          : <p>Aucun programme houblon exact n’était lié à l’ouverture.</p>}
        {currentReference ? <p><strong>Hypothèse courante exacte</strong> · <code>{identityLabel(currentReference)}</code></p> : null}
        <pre>{JSON.stringify(projection.context.details, null, 2)}</pre>
        {projection.context.past.status === 'partial' ? <ul>{projection.context.past.knownAdditions.map(row => <li key={row.id}>{row.label} · {row.id}{row.reference ? <code>{row.reference}</code> : null}</li>)}</ul> : null}
        {projection.context.past.status === 'declaredComplete' && projection.context.past.additions.length ? <ul>{projection.context.past.additions.map(row => <li key={row.id}>{row.label} · {row.id}{row.reference ? <code>{row.reference}</code> : null}</li>)}</ul> : null}
      </details>
      </> : <>
        <div className="hv55-ref-current" aria-live="polite">
          <div><strong>{realContextKnown ? 'Contexte réel' : 'Contexte réel non renseigné'}</strong>
            <span>{realContextKnown ? `${context.batch?.name || context.recipe?.name || actualProgram.label} · ${actualProgram.stage}` : 'Aucune recette ni aucun brassin n’est transmis.'}</span></div>
          <div><strong>{realContextKnown ? 'Programme transmis' : 'Programme effectif'}</strong><span>{!realContextKnown ? 'Programme effectif inconnu.'
            : actualProgram.performedCount === undefined ? 'État des ajouts non établi.'
            : `${additionCount(actualProgram.performedCount)} consigné${actualProgram.performedCount === 1 ? '' : 's'} comme effectué${actualProgram.performedCount === 1 ? '' : 's'}.`}</span>
            {actualProgram.futureCount !== undefined ? <span>{additionCount(actualProgram.futureCount)} planifié{actualProgram.futureCount === 1 ? '' : 's'} à partir de cette étape.</span> : null}
            {actualProgram.overdueCount ? <span>{additionCount(actualProgram.overdueCount)} prévu{actualProgram.overdueCount === 1 ? '' : 's'} en phase passée, sans confirmation d’exécution.</span> : null}</div>
          <div><strong>Journal de référence</strong><span>{currentWorkspace ? 'Aucun journal ouvert dans cet espace.' : 'Aucun espace de travail de référence n’est encore créé.'}</span>
            <span>Aucune hypothèse comparative n’est adoptée pour le moment.</span>
            <span>Le contexte est consultable maintenant; la première adoption ou observation ouvrira et enregistrera le journal.</span></div>
        </div>
        <details className="hv55-ref-context"><summary>Contexte réel et raccords exacts</summary>
          {currentWorkspace ? <p><strong>Espace de travail</strong> · <code>{currentWorkspace.id}</code></p> : null}
          <p><strong>Source actuelle</strong> · {context.batch?.name ? `Brassin · ${context.batch.name}`
            : context.recipe?.name ? `Recette · ${context.recipe.name}` : realContextKnown ? actualProgram.label : 'Contexte réel non renseigné'}</p>
          <p><strong>Stade reçu</strong> · {realContextKnown ? actualProgram.stage : 'Inconnu · aucun programme effectif reçu'}</p>
          {prepared.runtime.current ? <pre>{JSON.stringify(prepared.runtime.current, null, 2)}</pre>
            : <p>Aucune Recipe n’est liée au contexte courant; le passé reste inconnu.</p>}
        </details>
      </>}

      {supportedJournal && projection ? <section className="hv55-ref-subsection hv55-ref-activation" aria-labelledby="hv55-reference-activation-title">
        <div className="hv55-ref-subheading"><div><h3 id="hv55-reference-activation-title">Retour à une référence déjà adoptée</h3>
          <p>Ce geste change la comparaison courante en retrouvant une identité exacte du journal. Il ne crée pas de nouvelle adoption, de résultat J5 ni de fait de brassin.</p></div></div>
        {reactivationCandidates.length ? <form className="hv55-ref-form" autoComplete="off" onSubmit={reactivateReference}>
          <div className="hv55-ref-fields">
            <label className="hv55-ref-field hv55-ref-wide"><span>Version adoptée à réactiver</span><select aria-label="Version adoptée à réactiver"
              value={activationTarget?.contentReference ?? ''} onChange={event => setActivationReferenceKey(event.target.value)}>
              {reactivationCandidates.map(reference => <option key={reference.contentReference} value={reference.contentReference}>
                {referenceDisplayLabel(reference)} · version {reference.version} · {reference.id}
              </option>)}
            </select></label>
            {activationTarget ? <p className="hv55-ref-activation-identity">Identité exacte sélectionnée · <code>{identityLabel(activationTarget)}</code></p> : null}
            <label className="hv55-ref-field hv55-ref-wide"><span>Motif du retour · obligatoire</span><Textarea autoComplete="off" aria-label="Motif du retour à une référence adoptée" rows={2}
              value={activationReason} onChange={event => setActivationReason(event.target.value)} /></label>
          </div>
          <div className="hv55-ref-actions"><button type="submit" className="hv55-ref-primary" disabled={!canWrite || !activationTarget || !activationReason.trim()}>
            Réactiver cette référence comme comparaison courante
          </button><span>Le motif et l’identité choisie seront inscrits dans l’historique.</span></div>
        </form> : <p className="hv55-ref-muted">Aucune autre référence adoptée n’est disponible; les versions proposées seules ne peuvent pas être réactivées.</p>}
      </section> : null}

      <details className="hv55-ref-model-definitions"><summary>Définitions sensorielles chargées · {definitionSources.length}</summary>
        {definitionSources.length ? <ul className="hv55-ref-definitions">{definitionSources.map(definition => <li key={definition.contentReference}>
          <strong>{definition.dimension.name} · version {definition.dimension.version}</strong>
          <span>{definition.metric ? `${definition.metric.name} · ${definition.metric.unit ?? 'sans unité'}` : 'Définition qualitative'}</span>
          {definition.scale?.domain ? <span>Plage de l’indice · {showNumber(definition.scale.domain.min)}–{showNumber(definition.scale.domain.max)}</span>
            : definition.scale ? <span>Plage de l’indice · bornes inconnues</span> : null}
          <small>{definition.dimension.sourceRefs.length ? definition.dimension.sourceRefs.map(sourceLabel).join(' ; ') : 'Aucune source attachée.'}</small>
          <code>{definition.contentReference}</code>
        </li>)}</ul> : <p>Aucune définition source n’est chargée; une nouvelle hypothèse ne peut pas être adoptée dans cet état.</p>}
        <p>Ces définitions décrivent les axes du modèle. Elles ne transforment pas une note observée en indice.</p>
      </details>

      <details className="hv55-ref-hypothesis" open={!sourceRecipeKnown}>
        <summary>Hypothèse de référence</summary>
        <section className="hv55-ref-subsection" aria-labelledby="hv55-reference-editor-title">
          <div className="hv55-ref-subheading"><div><h3 id="hv55-reference-editor-title">Déclarer une hypothèse de comparaison</h3>
            <p>Le passé vide n’est jamais déduit de l’absence d’une recette. Une hypothèse reste distincte du programme réel.</p></div></div>
          {definitionSources.length ? <fieldset className="hv55-ref-editor-lock" disabled={!canWrite}>
            <legend className="hv55-ref-visually-hidden">Commande de référence hypothétique</legend>
            <HopV55ReferenceEditor prepared={prepared} hypotheses={currentWorkspace ? getHopV55ReferenceHypotheses(currentWorkspace) : []}
              references={projection?.references ?? []} currentReference={projection?.currentReference ?? null}
              initialCulture={adoptedCulture} cultureSourceLabel={adoptedCultureSourceLabel} onAdopt={adoptHypothesis} />
          </fieldset> : <p className="hv55-ref-muted">Recharge les définitions de source avant de proposer une nouvelle version. Les versions déjà conservées restent consultables.</p>}
        </section>
      </details>

      {supportedJournal && projection ? <>
      <details className="hv55-ref-reference-history"><summary>Versions de référence, échelles et sources exactes · {projection.references.length}</summary>
        {projection.references.map(reference => {
          const adoption = projection.adoptions.find(row => sameIdentity(row.reference, reference));
          return <article key={`${reference.id}:v${reference.version}:${reference.contentReference}`}>
            <p><strong>{typeof reference.content.label === 'string' ? reference.content.label : 'Référence conservée'} · v{reference.version}</strong></p>
            <header><strong>{reference.id} · v{reference.version}{adoption ? ' · adoptée' : ' · proposée'}</strong><time dateTime={reference.createdAt}>{showDate(reference.createdAt)}</time></header>
            <p>{reference.origin.kind} · {reference.origin.description} · auteur {reference.author.label}{reference.author.id ? ` · ${reference.author.id}` : ''}</p>
            {reference.predecessor ? <p>Prédécesseur exact · {identityLabel(reference.predecessor)}</p> : <p>Première version · aucun prédécesseur.</p>}
            {adoption ? <p>Adoptée le <time dateTime={adoption.adoptedAt}>{showDate(adoption.adoptedAt)}</time> par {adoption.adoptedBy.label}.</p> : null}
            {reference.hypotheses.length ? <ul>{reference.hypotheses.map((hypothesis, index) => <li key={index}>{hypothesis}</li>)}</ul> : <p>Aucune hypothèse supplémentaire.</p>}
            {reference.sensoryDefinitions.length ? <ul className="hv55-ref-definitions">{reference.sensoryDefinitions.map(definition => <li key={definition.contentReference}>
              <strong>{definition.dimension.name} · v{definition.dimension.version}</strong>
              <span>{definition.metric ? `${definition.metric.kind} · ${definition.metric.name} · ${definition.metric.unit ?? 'sans unité'}` : 'Définition qualitative sans métrique.'}</span>
              {definition.scale?.domain ? <span>Échelle figée · {showNumber(definition.scale.domain.min)}–{showNumber(definition.scale.domain.max)} {definition.metric?.unit ?? ''}</span>
                : definition.scale ? <span>Échelle figée · bornes inconnues</span> : null}
              <code>{definition.contentReference}</code>
              <small>{definition.dimension.sourceRefs.length ? definition.dimension.sourceRefs.map(sourceLabel).join(' ; ') : 'Aucune source attachée.'}</small>
              {definition.metric?.kind === 'modelIndex' ? <small>Indice de modèle; aucune intensité sensorielle observée ni conversion d’une note personnelle.</small> : null}
            </li>)}</ul> : <p>Aucune définition sensorielle n’a été conservée dans cette version; elle reste lisible sans reconstruction.</p>}
            <details><summary>Contenu de référence figé</summary><pre>{JSON.stringify(reference.content, null, 2)}</pre></details>
            <code>Référence exacte · {reference.contentReference}</code>
          </article>;
        })}
      </details>
      </> : null}

      <section className="hv55-ref-subsection" aria-labelledby="hv55-observation-title">
        <div className="hv55-ref-subheading"><div><h3 id="hv55-observation-title">Observation de bière</h3>
          <p>Par défaut, la note reste qualitative et l’échelle inconnue. La date observée et la date d’enregistrement sont deux champs distincts.</p></div></div>
        <form className="hv55-ref-form" autoComplete="off" onSubmit={recordObservation}>
          <div className="hv55-ref-fields">
            <label className="hv55-ref-field"><span>Action</span><select aria-label="Action d’observation" value={observationMode} onChange={event => {
              const next = event.target.value as typeof observationMode;
              if (observationMode === 'correction' && next === 'new') { resetObservationDraft(); return; }
              setObservationMode(next);
            }}>
              <option value="new">Nouvelle dégustation · nouvel ID</option><option value="correction" disabled={!latestVersions.length}>Corriger une version existante · même ID</option>
            </select></label>
            {observationMode === 'correction' ? <label className="hv55-ref-field"><span>Version courante à corriger</span><select aria-label="Observation à corriger" value={correctionId}
              onChange={event => selectCorrection(event.target.value)}><option value="">Choisir une observation</option>{latestVersions.map(row => <option key={row.id} value={row.id}>{row.subject.label} · v{row.version} · {showDate(row.observedAt)}</option>)}</select></label> : null}
            {observationMode === 'correction' && correction ? <article className="hv55-ref-observation">
              <header><div><strong>Correction du relevé historique</strong><span>{correction.subject.label} · v{correction.version} → v{correction.version + 1} · même ID</span></div>
                <div><time dateTime={correction.observedAt}>{showDate(correction.observedAt)}</time><code>{correction.observedAt}</code></div></header>
              <p className="hv55-ref-muted">L’ancienne note reste intacte. L’objet, la date, le contact, le lot, la dimension, l’échelle et le référent sont repris tels quels; seule la valeur ou le texte peut être corrigé.</p>
              <ObservationFacts observation={correction} events={currentWorkspace?.referenceJournal?.events ?? []} />
              <ObservationAnchorHistory observation={correction} workspace={currentWorkspace} />
              <HistoricalCorrectionContext context={correction.context} />
              <details className="hv55-ref-evidence"><summary>Contexte physique historique exact</summary><pre>{JSON.stringify(correction.context, null, 2)}</pre></details>
            </article> : null}
            {observationMode === 'new' ? <>
              {!context.batch?.id || !context.batch.recipeSnapshot ? <>
                <label className="hv55-ref-field"><span>Type d’objet</span><select aria-label="Type d’objet observé" value={subjectKind} onChange={event => setSubjectKind(event.target.value)}>
                  <option value="sample">Échantillon</option><option value="beer">Bière</option><option value="batch">Brassin</option><option value="other">Autre objet observé</option>
                </select></label>
                <label className="hv55-ref-field"><span>Objet observé</span><Input autoComplete="off" aria-label="Objet observé" value={subjectLabel} onChange={event => setSubjectLabel(event.target.value)} /></label>
                <label className="hv55-ref-field"><span>ID exact de l’objet · facultatif</span><Input autoComplete="off" aria-label="ID de l’objet observé" value={subjectId} onChange={event => setSubjectId(event.target.value)} /></label>
              </> : null}
              <label className="hv55-ref-field"><span>Date observée</span><input type="datetime-local" autoComplete="off" aria-label="Date observée" aria-invalid={observedAtInvalid || undefined}
                value={observedAt} onChange={event => setObservedAt(event.target.value)} /></label>
              <HopV55ObservationStateEditor context={context} observationScope={observationScope} mode="new" observedAtLocal={observedAt} disabled={!canWrite}
                resetToken={observationStateReset} onDraftChange={draft => setObservationStateDraft(draft)} />
            </> : null}
            {observationMode === 'correction' ? <HopV55ObservationStateEditor context={context} observationScope={observationScope} mode="correction" observedAtLocal={observedAt}
              disabled={!canWrite} resetToken={observationStateReset} historicalAnchor={correctionAnchor}
              onDraftChange={draft => setObservationStateDraft(draft)} /> : null}
            <label className="hv55-ref-field"><span>Nature du constat</span><select aria-label="Nature du constat" value={senseKind} onChange={event => {
              const next = event.target.value as ObservationSenseKind; setSenseKind(next);
              if (next !== 'qualitative' && selectedDefinition && selectedDefinition.metric?.kind !== (next === 'sensoryRating' ? 'ordinalNote' : 'measurement')) setDimensionReference('');
              if (next !== 'sensoryRating') setScaleMode('unknown');
            }} disabled={observationMode === 'correction'}>
              <option value="qualitative">Qualitative · texte original seulement</option><option value="sensoryRating">Note sensorielle ordinale explicite</option><option value="analyticalMeasurement">Mesure analytique</option>
            </select></label>
            {observationMode === 'new' ? <>
              <label className="hv55-ref-field"><span>Dimension</span><select aria-label="Dimension de l’observation" value={dimensionReference} onChange={event => setDimensionReference(event.target.value)}>
                <option value="">Libellé libre · définition non résolue</option>{dimensionOptions.map(definition => <option key={definition.contentReference} value={definition.contentReference}>{definition.dimension.name} · {metricDisplayLabel(definition.metric?.kind)}</option>)}
              </select></label>
              {!selectedDefinition ? <label className="hv55-ref-field"><span>Libellé de dimension libre</span><Input autoComplete="off" aria-label="Libellé de dimension libre" value={dimensionLabel} onChange={event => setDimensionLabel(event.target.value)} placeholder="À préciser" /></label> : <p className="hv55-ref-definition">Définition retenue · {selectedDefinition.dimension.name} · {metricDisplayLabel(selectedDefinition.metric?.kind)}.</p>}
            </> : null}
            {senseKind === 'qualitative' ? <label className="hv55-ref-field hv55-ref-wide"><span>Note qualitative originale</span><Textarea autoComplete="off" aria-label="Note qualitative originale" rows={3} value={originalText} onChange={event => setOriginalText(event.target.value)} /></label> : null}
            {senseKind === 'sensoryRating' ? <>
              <HopV55ExactInput label="Note sensorielle" value={ratingValue} onValue={setRatingValue} />
              {observationMode === 'new' && selectedDefinition?.metric?.kind === 'ordinalNote' && selectedDefinition.scale?.domain ? <p className="hv55-ref-definition">
                Échelle exacte · {showNumber(selectedDefinition.scale.domain.min)}–{showNumber(selectedDefinition.scale.domain.max)} {selectedDefinition.metric.unit ?? 'sans unité'} · note ordinale, distincte d’un indice de modèle.
              </p> : null}
              {observationMode === 'new' && !selectedDefinition ? <>
                <label className="hv55-ref-field"><span>Échelle</span><select aria-label="Échelle de la note sensorielle" value={scaleMode} onChange={event => setScaleMode(event.target.value as ScaleMode)}>
                  <option value="unknown">Échelle inconnue · conserver la note telle quelle</option><option value="declared">Déclarer les bornes de cette échelle</option>
                </select></label>
              </> : null}
              {observationMode === 'new' && !selectedDefinition && scaleMode === 'declared' ? <>
                <HopV55ExactInput label="Borne minimale" value={scaleMin} onValue={setScaleMin} />
                <HopV55ExactInput label="Borne maximale" value={scaleMax} onValue={setScaleMax} />
                <label className="hv55-ref-field"><span>Libellé de la borne minimale · facultatif</span><Input autoComplete="off" aria-label="Libellé minimal de l’échelle" value={scaleLowLabel} onChange={event => setScaleLowLabel(event.target.value)} /></label>
                <label className="hv55-ref-field"><span>Libellé de la borne maximale · facultatif</span><Input autoComplete="off" aria-label="Libellé maximal de l’échelle" value={scaleHighLabel} onChange={event => setScaleHighLabel(event.target.value)} /></label>
                <label className="hv55-ref-field hv55-ref-wide"><span>Sens de l’échelle et auteur de sa déclaration</span><Textarea autoComplete="off" aria-label="Description de l’échelle déclarée" rows={2} value={scaleDescription} onChange={event => setScaleDescription(event.target.value)} /></label>
              </> : null}
              <label className="hv55-ref-field hv55-ref-wide"><span>Texte original de la note</span><Textarea autoComplete="off" aria-label="Texte original de la note" rows={2} value={originalText} onChange={event => setOriginalText(event.target.value)} /></label>
              {observationMode === 'new' && !selectedDefinition && scaleMode === 'unknown' ? <p className="hv55-ref-muted hv55-ref-wide">Cette valeur reste une note sensorielle sans échelle connue. Elle ne devient pas un indice de modèle.</p> : null}
            </> : null}
            {senseKind === 'analyticalMeasurement' ? <>
              <label className="hv55-ref-field"><span>Forme de la mesure</span><select aria-label="Forme de la mesure" value={measurementMode} disabled={observationMode === 'correction'} onChange={event => setMeasurementMode(event.target.value as typeof measurementMode)}>
                <option value="point">Valeur exacte</option><option value="range">Plage rapportée</option>
              </select></label>
              {measurementMode === 'point' ? <HopV55ExactInput label="Valeur mesurée" value={measurementValue} onValue={setMeasurementValue} /> : <>
                <HopV55ExactInput label="Minimum mesuré" value={measurementMin} onValue={setMeasurementMin} />
                <HopV55ExactInput label="Maximum mesuré" value={measurementMax} onValue={setMeasurementMax} />
              </>}
              {observationMode === 'new' ? <>
                <label className="hv55-ref-field"><span>Unité</span><Input autoComplete="off" aria-label="Unité analytique" value={measurementUnit} onChange={event => setMeasurementUnit(event.target.value)} /></label>
                <label className="hv55-ref-field"><span>Base</span><Input autoComplete="off" aria-label="Base analytique" value={measurementBasis} onChange={event => setMeasurementBasis(event.target.value)} /></label>
                <label className="hv55-ref-field hv55-ref-wide"><span>Méthode</span><Input autoComplete="off" aria-label="Méthode analytique" value={measurementMethod} onChange={event => setMeasurementMethod(event.target.value)} /></label>
              </> : null}
              <label className="hv55-ref-field hv55-ref-wide"><span>Texte original et conditions de la mesure</span><Textarea autoComplete="off" aria-label="Texte original de la mesure" rows={2} value={originalText} onChange={event => setOriginalText(event.target.value)} /></label>
              <p className="hv55-ref-muted hv55-ref-wide">Une mesure analytique garde unité, base et méthode; elle ne devient pas une note sensorielle.</p>
            </> : null}
            {observationMode === 'new' ? <>
              <label className="hv55-ref-field"><span>Comparaison</span><select aria-label="Type de comparaison" value={comparisonKind} onChange={event => setComparisonKind(event.target.value as typeof comparisonKind)}>
                <option value="absolute">Absolue</option><option value="relative">Relative · relation déclarée</option>
              </select></label>
              {comparisonKind === 'relative' ? <>
                <label className="hv55-ref-field"><span>Relation relative</span><Input autoComplete="off" aria-label="Relation relative" value={relationship} onChange={event => setRelationship(event.target.value)} /></label>
                <label className="hv55-ref-field hv55-ref-wide"><span>Référent initial · facultatif</span><select aria-label="Référent initial" value={referentContentReference} onChange={event => setReferentContentReference(event.target.value)}>
                  <option value="">Inconnu · conserver le référent initial nul</option>{currentReferents.map(row => <option key={`${row.id}:${row.version}:${row.contentReference}`} value={row.contentReference}>{row.id} · v{row.version} · {row.contentReference}</option>)}
                </select></label>
              </> : null}
              <label className="hv55-ref-field hv55-ref-wide"><span>Conditions déclarées · facultatif</span><Textarea autoComplete="off" aria-label="Conditions observées" rows={2} value={conditions} onChange={event => setConditions(event.target.value)} /></label>
              <label className="hv55-ref-field"><span>Origine de la saisie</span><Input autoComplete="off" aria-label="Origine de l’observation" value={originDescription} onChange={event => setOriginDescription(event.target.value)} /></label>
              <label className="hv55-ref-field"><span>Référence de source · facultative</span><Input autoComplete="off" aria-label="Référence de source de l’observation" value={sourceReference} onChange={event => setSourceReference(event.target.value)} /></label>
            </> : null}
            {observationMode === 'correction' ? <label className="hv55-ref-field hv55-ref-wide"><span>Motif de correction · obligatoire</span><Textarea autoComplete="off" aria-label="Motif de correction" rows={2} value={correctionReason} onChange={event => setCorrectionReason(event.target.value)} /></label> : null}
          </div>
          {scaleDeclarationInvalid ? <p className="hv55-ref-validation" role="alert">L’échelle déclarée exige des bornes cohérentes, une note dans ces bornes et son sens explicite.</p> : null}
          {observedAtInvalid ? <p className="hv55-ref-validation" role="alert">La date observée doit être valide et ne peut pas être dans le futur.</p> : null}
          {measurementInvalid ? <p className="hv55-ref-validation" role="alert">Une mesure analytique exige des valeurs cohérentes, une unité, une base et une méthode.</p> : null}
          {definitionMismatch ? <p className="hv55-ref-validation" role="alert">Cette définition ne correspond pas au type de valeur saisi; garde une dimension libre ou sélectionne une définition métrique compatible.</p> : null}
          <div className="hv55-ref-actions"><button type="submit" className="hv55-ref-primary" disabled={!canWrite || physicalStateBlocked || subjectInvalid || dimensionInvalid || ratingInvalid || relativeInvalid || scaleDeclarationInvalid || measurementInvalid || definitionMismatch || cannotCorrect}>
            {observationMode === 'correction' ? 'Enregistrer la correction comme version suivante' : 'Enregistrer cette observation'}
          </button><span>À l’enregistrement : date d’observation conservée séparément de l’heure d’écriture.</span></div>
        </form>
      </section>

      <details className="hv55-ref-subsection hv55-ref-current-preparation" data-testid="hop-v55-current-preparation" open={currentStateOnlyOpen}>
        <summary onClick={event => { event.preventDefault(); setCurrentStateOnlyOpen(open => !open); }}>
          État physique sans nouvelle dégustation
        </summary>
        <p className="hv55-ref-muted">Conserve un nouvel état physique au cutoff choisi sans créer de note NR, d’ancre d’observation ou de projection.</p>
        {currentStateOnlyOpen ? <>
          <HopV55ObservationStateEditor context={context} observationScope={observationScope} mode="currentStateOnly" observedAtLocal=""
            disabled={!canWrite || busy} resetToken={currentStateOnlyReset}
            onDraftChange={draft => setCurrentStateOnlyDraft(draft)} />
          <div className="hv55-ref-actions"><button type="button" className="hv55-ref-primary"
            disabled={!canWrite || busy || currentStateOnlyDraft?.status !== 'ready' || !currentStateOnlyDraft.buildOptions}
            onClick={() => void saveCurrentPreparationWithoutObservation()}>
            Conserver cet état sans ajouter de note
          </button><span>Le snapshot et ses attestations seront append-only; la date physique reste indépendante de toute dégustation.</span></div>
        </> : null}
      </details>

      {supportedJournal && projection ? <>
      <section className="hv55-ref-subsection" aria-labelledby="hv55-observation-history-title">
        <div className="hv55-ref-subheading"><div><h3 id="hv55-observation-history-title">Historique des observations</h3>
          <p>{projection.observations.length ? `${projection.observations.length} version${projection.observations.length === 1 ? '' : 's'} conservée${projection.observations.length === 1 ? '' : 's'}. Une nouvelle dégustation reçoit un nouvel ID.` : 'Aucune observation n’a encore été enregistrée.'}</p></div></div>
        {projection.observations.map(observation => <article className="hv55-ref-observation" key={`${observation.id}:v${observation.version}`}>
          <header><div><strong>{observation.subject.label}</strong><span>Version {observation.version}{observationMode === 'correction' && correctionId === observation.id && correctionVersion === observation.version ? ' · version courante' : ''}</span></div>
            <time dateTime={observation.observedAt}>{showDate(observation.observedAt)}</time></header>
          <ObservationFacts observation={observation} events={currentWorkspace?.referenceJournal?.events ?? []} />
          <ObservationAnchorHistory observation={observation} workspace={currentWorkspace} />
          {projection.interpretations.filter(row => row.observationId === observation.id && row.observationVersion === observation.version).map(link => <div className="hv55-ref-link-history" key={link.id}>
            <p>Interprétation · {link.relation} · {link.comparability.kind === 'nonComparable' ? `non comparable : ${link.comparability.reason}` : 'comparaison exacte déclarée'}</p>
            <details className="hv55-ref-evidence"><summary>Référence et définition exactes</summary>
              <code>{identityLabel(link.reference)}</code><p>{link.targetDefinition.dimension.name} · version {link.targetDefinition.dimension.version}</p>
              <code>{link.targetDefinition.contentReference}</code>
            </details>
          </div>)}
          <InterpretationLinkEditor observation={observation} projection={projection} busy={!canWrite} onLink={(link, origin) => linkInterpretation(observation, link, origin)} />
        </article>)}
      </section>

      <details className="hv55-ref-history"><summary>Historique des changements</summary>
        {currentWorkspace?.referenceJournal?.events.map((event, index) => <article key={event.contentReference}>
          <header><strong>r{event.resultingRevision} · {event.kind === 'referenceActivated' ? 'Réactivation d’une référence' : event.kind}</strong><time dateTime={event.recordedAt}>{showDate(event.recordedAt)}</time></header>
          <p>Commande · {event.commandId}</p><code>Événement · {event.contentReference}</code><code>Commande · {event.commandReference}</code>
          {event.kind === 'observationCorrected' ? <p>Observation {event.payload.observation.id} v{event.payload.observation.version} corrige v{event.payload.correctsVersion} · {event.payload.reason}</p> : null}
          {event.kind === 'referenceProposed' ? <p>Référence {event.payload.reference.id} v{event.payload.reference.version} · {event.payload.reference.author.label}</p> : null}
          {event.kind === 'referenceAdopted' ? <p>Adoptée · {identityLabel(event.payload.reference)}</p> : null}
          {event.kind === 'referenceActivated' ? <>
            <p>Référence réactivée · {identityLabel(event.payload.reference)}.</p>
            <p>Activation déclarée par {event.payload.activatedBy.label}{event.payload.activatedBy.id ? ` · ${event.payload.activatedBy.id}` : ''} · {event.payload.reason}</p>
            <p>Date d’activation consignée · <time dateTime={event.recordedAt}>{showDate(event.recordedAt)}</time>.</p>
          </> : null}
          {index === 0 ? <small>Ouverture du contexte · passé: {projection.context.past.status}.</small> : null}
        </article>)}
      </details>
      </> : <p className="hv55-ref-muted">Aucune observation n’est encore enregistrée; le journal s’ouvrira avec la première commande conservée.</p>}
    </> : null}
  </section>;
}
