import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { BrewerContext } from '../../../functions/src/companionTypes';
import type { BrewingObservedHopScope } from '../../domain/brewingObservationInputs';
import {
  prepareBrewingObservedContext,
  type PrepareBrewingObservedContextOptions,
  type PreparedBrewingObservedContextV1,
} from '../../domain/brewingObservationContext';
import type { BrewingObservedKnownReferenceV1, BrewingObservedProvenanceV1, BrewingObservedQuantityV1 } from '../../domain/brewingObservedState';
import type { HopV55ObservationAnchorRecordV1 } from '../../services/hopV55/observationSession';
import { Input, Textarea, noAutofillProps } from '../Input';
import './observation-state-editor.css';

type ProvenanceDraft = { kind: string; reference: string; description: string; author: string };
type ContactMode = 'unknown' | 'activeThrough' | 'ended';
type ContinuityStatus = 'unknown' | 'preserved' | 'changed' | 'conflicting';
type DependencyId = 'hopMaterials' | 'hopContact';
export type ObservationStateEditorMode = 'new' | 'correction' | 'currentStateOnly';

export interface ObservationStateDraft {
  status: 'ready' | 'needs' | 'unavailable' | 'historical';
  reason?: string;
  subject?: { kind: 'beer' | 'sample'; id: string; label: string };
  /** The exact input evidence, excluding system-generated recordedAt instants. */
  asOf?: string;
  buildOptions?(recordedAt: string): PrepareBrewingObservedContextOptions;
  preview?: PreparedBrewingObservedContextV1;
}

export interface HopV55ObservationStateEditorProps {
  context: BrewerContext;
  /** Explicit model dependency scope supplied by the qualified parent; never inferred here. */
  observationScope?: BrewingObservedHopScope;
  mode: ObservationStateEditorMode;
  observedAtLocal: string;
  disabled?: boolean;
  resetToken?: number;
  historicalAnchor?: HopV55ObservationAnchorRecordV1 | null;
  onDraftChange(draft: ObservationStateDraft): void;
}

interface StateForm {
  subjectKind: 'beer' | 'sample';
  sampleId: string;
  sampleVersion: string;
  sampledAtLocal: string;
  physicalAsOfLocal: string;
  sampleSource: ProvenanceDraft;
  continuityStatus: ContinuityStatus;
  continuitySource: ProvenanceDraft;
  contactModes: Record<string, ContactMode>;
  contactAt: Record<string, string>;
  contactSource: ProvenanceDraft;
  completeDependencies: Record<DependencyId, boolean>;
  coverageFromLocal: string;
  coverageSource: ProvenanceDraft;
  legacyKeys: string[];
  legacyReason: string;
  legacySource: ProvenanceDraft;
}

const emptyProvenance = (): ProvenanceDraft => ({ kind: '', reference: '', description: '', author: '' });
const initialForm = (): StateForm => ({
  subjectKind: 'beer', sampleId: '', sampleVersion: '', sampledAtLocal: '', physicalAsOfLocal: '',
  sampleSource: emptyProvenance(), continuityStatus: 'unknown', continuitySource: emptyProvenance(),
  contactModes: {}, contactAt: {}, contactSource: emptyProvenance(),
  completeDependencies: { hopMaterials: false, hopContact: false }, coverageFromLocal: '', coverageSource: emptyProvenance(),
  legacyKeys: [], legacyReason: '', legacySource: emptyProvenance(),
});

function localDateTimeToIso(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function isoToLocalDateTime(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function cleanProvenance(value: ProvenanceDraft): BrewingObservedProvenanceV1 | null {
  const kind = value.kind.trim();
  const reference = value.reference.trim();
  const description = value.description.trim();
  const author = value.author.trim();
  if (!kind || !reference || !description) return null;
  return { kind, reference, description, ...(author ? { author } : {}) };
}

function lineKey(id: string): string | null {
  return id.match(/:(hop-(?:0|[1-9]\d*))$/)?.[1] ?? null;
}

function describeContact(status: string): string {
  switch (status) {
    case 'active': return 'Contact actif attesté';
    case 'ended': return 'Contact terminé attesté';
    case 'notStarted': return 'Ajout postérieur à la coupure';
    case 'conflicting': return 'Preuves contradictoires';
    default: return 'Continuité inconnue';
  }
}

function describePhysicalReference(value: BrewingObservedKnownReferenceV1): string {
  return value.status === 'identified'
    ? `${value.reference.id} · ${value.reference.version} · ${value.reference.contentReference}`
    : `${value.label} · identité non résolue · ${value.reason}`;
}

function describeQuantity(value: BrewingObservedQuantityV1): string {
  const format = (amount: number) => new Intl.NumberFormat('fr-CH', { maximumFractionDigits: 9 }).format(amount);
  if (value.status === 'known') return `${format(value.value)} ${value.unit}`;
  if (value.status === 'unitUnknown') return `${format(value.value)} · ${value.rawUnit ?? 'unité inconnue'} · unité non qualifiée`;
  return `quantité inconnue · ${value.reason}`;
}

function describeProvenance(value: BrewingObservedProvenanceV1): string {
  return `${value.kind} · ${value.reference} · ${value.description}${value.author ? ` · ${value.author}` : ''}`;
}

function draftFor(context: BrewerContext, mode: ObservationStateEditorMode, observedAtLocal: string, form: StateForm,
  observationScope?: BrewingObservedHopScope): ObservationStateDraft {
  if (mode === 'correction') return { status: 'historical', reason: 'La correction reprend l’ancre historique conservée; aucune donnée courante n’est relue.' };
  const batchId = typeof context.batch?.id === 'string' && context.batch.id.trim() ? context.batch.id : '';
  if (!batchId || !context.batch?.recipeSnapshot) {
    return { status: 'unavailable', reason: mode === 'currentStateOnly'
      ? 'Aucun batch avec snapshot immuable reçu; aucun état physique courant ne peut être conservé.'
      : 'Aucun batch avec snapshot immuable reçu. La note peut rester qualitative dans le journal, sans ancre d’état physique ni chiffre déduit d’une recette.' };
  }
  const stateAtLocal = mode === 'currentStateOnly' ? form.physicalAsOfLocal : observedAtLocal;
  const stateAt = localDateTimeToIso(stateAtLocal);
  if (!stateAt) return { status: 'needs', reason: mode === 'currentStateOnly'
    ? 'Renseigne l’instant physique exact de l’état à conserver.' : 'Renseigne l’instant exact de dégustation.' };
  const readAt = Number.isFinite(context.now) ? new Date(context.now).toISOString() : '';
  if (!readAt) return { status: 'needs', reason: 'L’instant de lecture de BrewerContext est absent; l’état ne peut pas être coupé honnêtement.' };

  let sample: PrepareBrewingObservedContextOptions['sample'];
  if (form.subjectKind === 'sample') {
    const sampleId = form.sampleId.trim();
    const sampleVersion = form.sampleVersion.trim();
    const sampledAt = localDateTimeToIso(form.sampledAtLocal);
    const source = cleanProvenance(form.sampleSource);
    if (!sampleId || !sampleVersion || !sampledAt || !source) {
      return { status: 'needs', reason: 'Un échantillon exige son ID, sa version, son instant de prélèvement et une source exacte pour ce fait.' };
    }
    if (mode === 'new' && Date.parse(sampledAt) > Date.parse(stateAt)) {
      return { status: 'needs', reason: 'Le prélèvement ne peut pas suivre l’instant de dégustation.' };
    }
    sample = { id: sampleId, version: sampleVersion, sourceBatchId: batchId,
      collection: { effectiveAt: sampledAt, recordedAt: readAt, provenance: source } };
    if (form.continuityStatus !== 'unknown') {
      if (!cleanProvenance(form.continuitySource)) {
        return { status: 'needs', reason: 'Une continuité d’échantillon déclarée exige sa propre source exacte.' };
      }
    }
  }

  const asOf = sample?.collection.effectiveAt ?? stateAt;
  const contactAttestations: NonNullable<PrepareBrewingObservedContextOptions['contactAttestations']> = [];
  for (const [additionKey, kind] of Object.entries(form.contactModes)) {
    if (kind === 'unknown') continue;
    const effectiveAt = localDateTimeToIso(form.contactAt[additionKey] ?? '');
    const provenance = cleanProvenance(form.contactSource);
    if (!effectiveAt || !provenance) {
      return { status: 'needs', reason: `L’attestation de ${additionKey} exige l’instant effectif et sa provenance exacte.` };
    }
    if (Date.parse(effectiveAt) > Date.parse(asOf)) {
      return { status: 'needs', reason: `L’attestation de ${additionKey} dépasse la coupure physique; elle ne prouve pas l’état à cet instant.` };
    }
    contactAttestations.push({ additionKey, kind,
      evidence: { effectiveAt, recordedAt: readAt, provenance }, epistemicStatus: 'reported' });
  }

  const coverageAttestations: NonNullable<PrepareBrewingObservedContextOptions['coverageAttestations']> = [];
  const coverageFromAt = localDateTimeToIso(form.coverageFromLocal);
  const coverageSource = cleanProvenance(form.coverageSource);
  for (const dependencyId of ['hopMaterials', 'hopContact'] as const) {
    if (!form.completeDependencies[dependencyId]) continue;
    if (!coverageFromAt || !coverageSource) {
      return { status: 'needs', reason: 'Une complétude exige une période entière et la source qui permet de l’attester.' };
    }
    if (Date.parse(coverageFromAt) > Date.parse(asOf)) {
      return { status: 'needs', reason: 'Le début de la période contrôlée ne peut pas suivre la coupure de l’état.' };
    }
    coverageAttestations.push({ id: `coverage:${dependencyId}:${Date.parse(coverageFromAt)}:${Date.parse(asOf)}`,
      version: 1, supersedesVersion: null, dependencyId, fromAt: coverageFromAt, throughAt: asOf,
      status: 'complete', recordedAt: readAt, provenance: coverageSource });
  }

  const baseOptions = { source: { kind: 'batch' as const, id: batchId }, asOf, knowledgeAsOf: readAt,
    ...(observationScope ? { hopScope: structuredClone(observationScope) } : {}),
    ...(contactAttestations.length ? { contactAttestations } : {}),
    ...(coverageAttestations.length ? { coverageAttestations } : {}),
    ...(sample ? { sample: { ...sample, ...(mode === 'new' && form.continuityStatus !== 'unknown' ? {
      continuity: [{ id: `sample-continuity:${sample.id}`, version: 1, supersedesVersion: null,
        fromAt: sample.collection.effectiveAt, throughAt: stateAt, status: form.continuityStatus,
        recordedAt: readAt, provenance: cleanProvenance(form.continuitySource)! }],
    } : {}) } } : {}),
  };

  const initial = prepareBrewingObservedContext(context, baseOptions);
  if (initial.status !== 'prepared' || !initial.state) {
    return { status: 'needs', reason: initial.refusal?.message ?? 'Le batch ne permet pas de préparer un état physique exact.', preview: initial };
  }
  const unitUnknownKeys = initial.stateInput?.facts.flatMap(fact => {
    if (fact.kind !== 'materialAdded' || fact.quantity.status !== 'unitUnknown' || fact.quantity.rawUnit !== '(unité absente)') return [];
    const key = fact.id.match(/:addition:(hop-(?:0|[1-9]\d*))$/)?.[1];
    return key ? [key] : [];
  }) ?? [];
  const legacyReason = form.legacyReason.trim();
  const legacySource = cleanProvenance(form.legacySource);
  const selectedLegacyKeys = form.legacyKeys.filter(key => unitUnknownKeys.includes(key));
  if (selectedLegacyKeys.length && (!legacyReason || !legacySource)) {
    return { status: 'needs', reason: 'Une qualification en grammes exige les clés exactes, un motif et une source.' , preview: initial };
  }

  const subject = sample
    ? { kind: 'sample' as const, id: initial.state.subject.identity.id, label: `Échantillon ${sample.id}` }
    : { kind: 'beer' as const, id: initial.state.subject.identity.id,
      label: typeof context.batch?.name === 'string' && context.batch.name.trim() ? context.batch.name : `Batch ${batchId}` };

  const buildOptions = (recordedAt: string): PrepareBrewingObservedContextOptions => ({
    ...structuredClone(baseOptions),
    knowledgeAsOf: recordedAt,
    ...(baseOptions.contactAttestations ? { contactAttestations: baseOptions.contactAttestations.map(row => ({ ...structuredClone(row), evidence: { ...row.evidence, recordedAt } })) } : {}),
    ...(baseOptions.coverageAttestations ? { coverageAttestations: baseOptions.coverageAttestations.map(row => ({ ...structuredClone(row), recordedAt })) } : {}),
    ...(baseOptions.sample ? { sample: { ...structuredClone(baseOptions.sample), collection: { ...baseOptions.sample.collection, recordedAt },
      ...(baseOptions.sample.continuity ? { continuity: baseOptions.sample.continuity.map(row => ({ ...structuredClone(row), recordedAt })) } : {}) } } : {}),
    ...(selectedLegacyKeys.length ? { legacyHopUnitQualification: { additionKeys: [...selectedLegacyKeys], unit: 'g' as const,
      reason: legacyReason, provenance: legacySource! } } : {}),
  });

  // The preview uses the context read instant. At commit, new attestations receive the actual recordedAt.
  const preview = prepareBrewingObservedContext(context, buildOptions(readAt));
  return { status: 'ready', subject, asOf, preview, buildOptions };
}

function ProvenanceFields({ prefix, value, onChange, disabled }: {
  prefix: string; value: ProvenanceDraft; onChange(value: ProvenanceDraft): void; disabled: boolean;
}) {
  return <div className="hv55-state-proof" aria-label={`Provenance ${prefix}`}>
    <label className="hv55-state-field"><span>Nature de la source · {prefix}</span><Input autoComplete="off" aria-label={`Nature de la source ${prefix}`} value={value.kind} disabled={disabled}
      onChange={event => onChange({ ...value, kind: event.target.value })} /></label>
    <label className="hv55-state-field"><span>Référence exacte</span><Input autoComplete="off" aria-label={`Référence de source ${prefix}`} value={value.reference} disabled={disabled}
      onChange={event => onChange({ ...value, reference: event.target.value })} /></label>
    <label className="hv55-state-field hv55-state-wide"><span>Ce que cette source atteste</span><Textarea autoComplete="off" aria-label={`Description de source ${prefix}`} rows={2} value={value.description} disabled={disabled}
      onChange={event => onChange({ ...value, description: event.target.value })} /></label>
    <label className="hv55-state-field"><span>Auteur, si connu</span><Input autoComplete="off" aria-label={`Auteur de source ${prefix}`} value={value.author} disabled={disabled}
      onChange={event => onChange({ ...value, author: event.target.value })} /></label>
  </div>;
}

export function HopV55ObservationStateEditor({ context, observationScope, mode, observedAtLocal, disabled = false, resetToken = 0,
  historicalAnchor = null, onDraftChange }: HopV55ObservationStateEditorProps) {
  const [form, setForm] = useState<StateForm>(initialForm);
  const callback = useRef(onDraftChange);
  callback.current = onDraftChange;

  useEffect(() => setForm(initialForm()), [resetToken, context.batch?.id]);
  const draft = useMemo(() => draftFor(context, mode, observedAtLocal, form, observationScope),
    [context, mode, observedAtLocal, form, observationScope]);
  useEffect(() => callback.current(draft), [draft]);

  const preview = draft.preview;
  const contactStates = preview?.state?.contactStates ?? [];
  const journalAdditions = context.journal?.additions && typeof context.journal.additions === 'object'
    ? context.journal.additions as Record<string, unknown> : {};
  const snapshotHops = Array.isArray(context.batch?.recipeSnapshot?.hops) ? context.batch.recipeSnapshot.hops : [];
  const contacts = Object.entries(journalAdditions).flatMap(([key, value]) => {
    const match = /^hop-(0|[1-9]\d*)$/.exec(key);
    if (!match || !value || typeof value !== 'object' || !Number.isFinite((value as Record<string, unknown>).doneAt)) return [];
    const snapshotHop = snapshotHops[Number(match[1])] as Record<string, unknown> | undefined;
    if (!snapshotHop) return [];
    const contactId = `batch:${context.batch?.id}:contact:${key}`;
    const state = contactStates.find(row => row.id === contactId);
    const actual = value as Record<string, unknown>;
    const quantityLabel = typeof actual.amount === 'number' && Number.isFinite(actual.amount)
      ? `${new Intl.NumberFormat('fr-CH', { maximumFractionDigits: 9 }).format(actual.amount)} ${actual.unit === undefined ? 'unité absente'
        : typeof actual.unit === 'string' && actual.unit.trim() ? actual.unit : 'unité vide'}`
      : 'Quantité brute absente ou invalide';
    return [{ key, label: typeof snapshotHop.name === 'string' ? snapshotHop.name : key,
      startedAt: new Date((value as Record<string, number>).doneAt).toISOString(), status: state?.status ?? 'continuityUnknown', quantityLabel }];
  });
  const unknownUnitKeys = Object.entries(journalAdditions).flatMap(([key, value]) => {
    const match = /^hop-(0|[1-9]\d*)$/.exec(key);
    if (!match || !value || typeof value !== 'object') return [];
    const actual = value as Record<string, unknown>;
    if (!Number.isFinite(actual.doneAt) || typeof actual.amount !== 'number' || actual.amount < 0 || actual.unit !== undefined
      || !snapshotHops[Number(match[1])]) return [];
    return [{ key, quantity: actual.amount }];
  });
  const stateTitleId = mode === 'currentStateOnly' ? 'hv55-current-state-title' : 'hv55-state-title';

  function update(change: Partial<StateForm>) { setForm(current => ({ ...current, ...change })); }
  function updateContactMode(key: string, value: ContactMode) {
    setForm(current => ({ ...current, contactModes: { ...current.contactModes, [key]: value } }));
  }
  function updateContactAt(key: string, value: string) {
    setForm(current => ({ ...current, contactAt: { ...current.contactAt, [key]: value } }));
  }
  function updateLegacyKey(key: string, checked: boolean) {
    setForm(current => ({ ...current, legacyKeys: checked ? [...new Set([...current.legacyKeys, key])] : current.legacyKeys.filter(row => row !== key) }));
  }
  function updateCoverage(dependencyId: DependencyId, checked: boolean) {
    setForm(current => ({ ...current, completeDependencies: { ...current.completeDependencies, [dependencyId]: checked } }));
  }

  if (mode === 'correction') {
    const anchor = historicalAnchor?.anchor;
    return <section className="hv55-state-editor" aria-labelledby={stateTitleId} data-testid="hop-v55-observation-state">
      <div className="hv55-state-heading"><div><h4 id={stateTitleId}>État dégusté et preuves</h4>
        <p>Une correction conserve l’instant et l’état de la version source; elle ne prépare pas le batch courant.</p></div></div>
      {anchor ? <div className="hv55-state-history" role="status">
        <strong>Ancre historique reprise</strong>
        <span>{anchor.observedState.subject.kind === 'sample' ? 'Échantillon' : 'Batch'} · état au <time dateTime={anchor.observedState.asOf}>{anchor.observedState.asOf}</time></span>
        <span>Snapshot exact · <code>{historicalAnchor?.preparation.sourceSnapshotReference ?? 'référence absente'}</code></span>
        <span>Identité de l’ancre · <code>{anchor.reference}</code></span>
        {anchor.observedState.contacts.map(row => <span key={`${row.id}:${row.version}`}>{lineKey(row.id) ?? row.id} · {describeContact(anchor.observedState.contactStates.find(state => state.id === row.id)?.status ?? 'unknown')}</span>)}
      </div> : <p className="hv55-state-note" role="status">Cette note n’a pas d’ancre physique historique. Sa correction restera une correction NR, sans nouvel état ni rattachement au contexte courant.</p>}
    </section>;
  }

  return <section className="hv55-state-editor" aria-labelledby={stateTitleId}
    data-testid={mode === 'currentStateOnly' ? 'hop-v55-current-preparation-state' : 'hop-v55-observation-state'}>
    <div className="hv55-state-heading"><div><h4 id={stateTitleId}>{mode === 'currentStateOnly' ? 'État physique courant' : 'État dégusté et preuves'}</h4>
      <p>{mode === 'currentStateOnly' ? 'Ce relevé n’ajoute ni dégustation ni note. Son instant physique est indépendant de la date de note.'
        : 'La note et l’état s’attachent au même ID de batch. Les trous restent inconnus jusqu’à preuve exacte.'}</p></div></div>
    {draft.status === 'unavailable' ? <p className="hv55-state-note" role="status">{draft.reason}</p> : null}
    {draft.status === 'needs' ? <p className="hv55-state-note hv55-state-warning" role="status">{draft.reason}</p> : null}
    {context.batch?.id && context.batch.recipeSnapshot ? <>
      <div className="hv55-state-source">
        <span><strong>Batch exact</strong> {context.batch.name || context.batch.id} · <code>{context.batch.id}</code></span>
        <span><strong>Snapshot</strong> {context.batch.recipeSnapshot.capturedAt} · <code>{preview?.sourceSnapshotReference ?? 'préparation requise'}</code></span>
        <span><strong>Coupure lue</strong> {Number.isFinite(context.now) ? new Date(context.now).toISOString() : 'inconnue'} · distincte de la dégustation</span>
      </div>
      {observationScope ? <div className="hv55-state-scope" aria-label="Portée du modèle fournie explicitement">
        <strong>Portée de calcul fournie</strong>
        <span><code>{observationScope.id}</code> · du {observationScope.fromAt} à la coupure affichée</span>
        <span>Dépendances · {observationScope.dependencyIds.join(', ')}</span>
        <span>Origine et limite · {observationScope.explanation}</span>
      </div> : <p className="hv55-state-note hv55-state-warning" role="status">
        Aucune portée de dépendances n’est fournie. La préparation courante et l’ancre peuvent être conservées, mais aucune entrée de modèle ni projection ne sera préparée.
      </p>}

      <fieldset className="hv55-state-fields" disabled={disabled}>
        <legend>Sujet et continuité</legend>
        <label className="hv55-state-field"><span>État du sujet</span><select aria-label="Sujet de l’état observé" value={form.subjectKind}
          onChange={event => update({ subjectKind: event.target.value as StateForm['subjectKind'] })}>
          <option value="beer">Batch entier</option><option value="sample">Échantillon prélevé</option>
        </select></label>
        {form.subjectKind === 'sample' ? <>
          <label className="hv55-state-field"><span>ID exact de l’échantillon</span><Input autoComplete="off" aria-label="ID exact de l’échantillon" value={form.sampleId}
            onChange={event => update({ sampleId: event.target.value })} /></label>
          <label className="hv55-state-field"><span>Version du prélèvement</span><Input autoComplete="off" aria-label="Version du prélèvement" value={form.sampleVersion}
            onChange={event => update({ sampleVersion: event.target.value })} /></label>
          <label className="hv55-state-field"><span>Prélevé le</span><input type="datetime-local" {...noAutofillProps} aria-label="Instant exact du prélèvement"
            value={form.sampledAtLocal} onChange={event => update({ sampledAtLocal: event.target.value })} /></label>
          <ProvenanceFields prefix="du prélèvement" value={form.sampleSource} disabled={disabled}
            onChange={sampleSource => update({ sampleSource })} />
          {mode === 'new' ? <>
            <label className="hv55-state-field"><span>État entre prélèvement et dégustation</span><select aria-label="Continuité de l’échantillon" value={form.continuityStatus}
              onChange={event => update({ continuityStatus: event.target.value as ContinuityStatus })}>
              <option value="unknown">Non établi</option><option value="preserved">Conservé</option><option value="changed">A changé</option><option value="conflicting">Contradictoire</option>
            </select></label>
            {form.continuityStatus !== 'unknown' ? <ProvenanceFields prefix="de continuité" value={form.continuitySource} disabled={disabled}
              onChange={continuitySource => update({ continuitySource })} /> : null}
          </> : null}
        </> : <p className="hv55-state-help">L’ID physique est dérivé du batch canonique. Une recette seule ne peut pas créer cet ID.</p>}
        {mode === 'currentStateOnly' && form.subjectKind === 'beer' ? <label className="hv55-state-field">
          <span>Instant physique de l’état à conserver</span><input type="datetime-local" {...noAutofillProps}
            aria-label="Instant physique de l’état à conserver" value={form.physicalAsOfLocal}
            onChange={event => update({ physicalAsOfLocal: event.target.value })} />
        </label> : null}
      </fieldset>

      {contacts.length ? <fieldset className="hv55-state-fields" disabled={disabled}>
        <legend>Contacts réalisés · clés exactes du journal</legend>
        <p className="hv55-state-help">`doneAt` établit seulement le début. Sans retrait daté ou continuité active attestée, la durée reste inconnue.</p>
        {contacts.map(({ key, label, startedAt, status, quantityLabel }) => <div className="hv55-state-contact" key={key}>
          <div><strong>{label}</strong><span><code>{key}</code> · {quantityLabel} · début {startedAt} · {describeContact(status)}</span></div>
          <label className="hv55-state-field"><span>Preuve de continuité</span><select aria-label={`État du contact ${key}`}
            value={form.contactModes[key] ?? 'unknown'} onChange={event => updateContactMode(key, event.target.value as ContactMode)}>
            <option value="unknown">Aucune attestation · durée inconnue</option><option value="activeThrough">Toujours en contact jusqu’à…</option><option value="ended">Retiré à…</option>
          </select></label>
          {form.contactModes[key] && form.contactModes[key] !== 'unknown' ? <label className="hv55-state-field"><span>{form.contactModes[key] === 'ended' ? 'Retrait effectif le' : 'Continuité attestée jusqu’au'}</span>
            <input type="datetime-local" {...noAutofillProps} aria-label={`Instant de contact ${key}`} value={form.contactAt[key] ?? ''}
              onChange={event => updateContactAt(key, event.target.value)} /></label> : null}
        </div>)}
        {Object.values(form.contactModes).some(value => value !== 'unknown') ? <ProvenanceFields prefix="des contacts" value={form.contactSource} disabled={disabled}
          onChange={contactSource => update({ contactSource })} /> : null}
      </fieldset> : <p className="hv55-state-help">Aucun contact de houblon daté par une clé de journal exacte n’a été résolu.</p>}

      <fieldset className="hv55-state-fields" disabled={disabled}>
        <legend>Couverture déclarée · période et dépendances</legend>
        <p className="hv55-state-help">Une absence de coche reste inconnue. Chaque complétude est explicitement bornée à la coupure physique et à sa dépendance.</p>
        <label className="hv55-state-check"><input type="checkbox" checked={form.completeDependencies.hopMaterials}
          onChange={event => updateCoverage('hopMaterials', event.target.checked)} />Je peux attester les matières et quantités réalisées · <code>hopMaterials</code></label>
        <label className="hv55-state-check"><input type="checkbox" checked={form.completeDependencies.hopContact}
          onChange={event => updateCoverage('hopContact', event.target.checked)} />Je peux attester la durée des contacts · <code>hopContact</code></label>
        {Object.values(form.completeDependencies).some(Boolean) ? <>
          <label className="hv55-state-field"><span>Période contrôlée depuis</span><input type="datetime-local" {...noAutofillProps}
            aria-label="Début de la période contrôlée" value={form.coverageFromLocal} onChange={event => update({ coverageFromLocal: event.target.value })} /></label>
          <p className="hv55-state-help">La période se termine à la coupure exacte affichée ci-dessus; aucune autre dépendance n’est incluse.</p>
          <ProvenanceFields prefix="de couverture" value={form.coverageSource} disabled={disabled}
            onChange={coverageSource => update({ coverageSource })} />
        </> : null}
      </fieldset>

      {unknownUnitKeys.length ? <fieldset className="hv55-state-fields" disabled={disabled}>
        <legend>Unités historiques absentes</legend>
        <p className="hv55-state-help">Aucune unité n’est supposée. Une qualification vaut seulement pour les clés choisies.</p>
        {unknownUnitKeys.map(row => <label className="hv55-state-check" key={row.key}>
          <input type="checkbox" checked={form.legacyKeys.includes(row.key)} onChange={event => updateLegacyKey(row.key, event.target.checked)} />
          {row.key} · {new Intl.NumberFormat('fr-CH', { maximumFractionDigits: 6 }).format(row.quantity)} (unité inconnue)
        </label>)}
        {form.legacyKeys.length ? <>
          <label className="hv55-state-field hv55-state-wide"><span>Motif de la qualification en grammes</span><Textarea autoComplete="off" aria-label="Motif de qualification en grammes" rows={2}
            value={form.legacyReason} onChange={event => update({ legacyReason: event.target.value })} /></label>
          <ProvenanceFields prefix="de l’unité historique" value={form.legacySource} disabled={disabled}
            onChange={legacySource => update({ legacySource })} />
        </> : null}
      </fieldset> : null}

      <details className="hv55-state-evidence"><summary>État résolu, limites et références exactes</summary>
        {preview?.status === 'prepared' && preview.state ? <>
          <p>État {preview.state.status} · {preview.state.subject.kind} · {preview.state.asOf} · connaissances au {preview.state.knowledgeAsOf}</p>
          <p>Hypothèses de formulation dans le snapshot séparées des faits réalisés; aucun chiffre de modèle n’est produit dans cette fiche.</p>
          {!preview.hopScope ? <p>Entrée du modèle absente · portée de dépendances non transmise.</p>
            : preview.observedHopInput?.status === 'available' ? <p>Entrée du modèle disponible selon la portée explicitement fournie · {preview.hopScope.id} · aucune prévision n’est calculée ici.</p>
              : <p>Portée transmise, mais entrée du modèle inconnue · {preview.observedHopInput?.issues.map(issue => issue.message).join(' ') || preview.limitations.join(' ')}</p>}
          {preview.state.contactStates.map(row => <p key={`${row.id}:${row.version}`}>{lineKey(row.id) ?? row.id} · {describeContact(row.status)}
            {row.elapsedSeconds !== undefined ? ` · ${row.elapsedSeconds / 3600} h attestées` : ''}
            {row.lowerBoundSeconds !== undefined ? ` · au moins ${row.lowerBoundSeconds / 3600} h` : ''}
            {row.reason ? ` · ${row.reason}` : ''}</p>)}
          {preview.state.facts.map(fact => {
            const disposition = preview.state!.factDispositions.find(row => row.id === fact.id && row.version === fact.version);
            if (fact.kind === 'condition') return <p key={`${fact.id}:${fact.version}`}>{fact.id} · {fact.property} · {fact.value.status === 'known'
              ? `${String(fact.value.value)} ${fact.value.unit ?? ''}` : `valeur inconnue · ${fact.value.reason}`} · {fact.epistemicStatus} · effet {fact.effectiveAt} · inscrit {fact.recordedAt}
              · {disposition?.disposition ?? 'disposition absente'} · {describeProvenance(fact.provenance)}</p>;
            return <p key={`${fact.id}:${fact.version}`}>{fact.id} · {fact.kind} · {describePhysicalReference(fact.material)} · lot {describePhysicalReference(fact.lot)}
              · {describeQuantity(fact.quantity)} · {fact.epistemicStatus} · effet {fact.effectiveAt} · inscrit {fact.recordedAt}
              · {disposition?.disposition ?? 'disposition absente'} · {describeProvenance(fact.provenance)}</p>;
          })}
          {preview.state.contacts.map(contact => <p key={`${contact.id}:${contact.version}`}>{contact.id} · début {contact.started.effectiveAt} · enregistré {contact.started.recordedAt}
            · {contact.epistemicStatus} · {describeProvenance(contact.started.provenance)}
            {contact.ended ? ` · retiré ${contact.ended.effectiveAt} · inscrit ${contact.ended.recordedAt} · ${describeProvenance(contact.ended.provenance)}` : ''}
            {contact.activeThrough ? ` · actif jusqu’au ${contact.activeThrough.effectiveAt} · inscrit ${contact.activeThrough.recordedAt} · ${describeProvenance(contact.activeThrough.provenance)}` : ''}</p>)}
          {preview.state.coverage.map(row => <p key={`${row.id}:${row.version}`}>{row.dependencyId} · {row.status} · {row.fromAt} → {row.throughAt} · inscrit {row.recordedAt} · {describeProvenance(row.provenance)}</p>)}
          {preview.state.subject.kind === 'sample' ? <p>Prélèvement · {preview.state.subject.collection.effectiveAt} · inscrit {preview.state.subject.collection.recordedAt}
            · {describeProvenance(preview.state.subject.collection.provenance)}
            {preview.state.sampleContinuity.map(row => ` · ${row.status} ${row.fromAt} → ${row.throughAt} · inscrit ${row.recordedAt} · ${describeProvenance(row.provenance)}`)}</p> : null}
          {preview.state.dependencies.map(row => <p key={row.id}>{row.id} · {row.status} · {row.reasons.join(' ') || 'Aucune lacune déclarée.'}</p>)}
          {preview.unmapped.map(row => <p key={`${row.sourceKey}:${row.code}`}>{row.sourceKey} · {row.code} · {row.reason}</p>)}
          {preview.limitations.map((row, index) => <p key={index}>{row}</p>)}
          <code>Snapshot · {preview.sourceSnapshotReference}</code><code>Journal · {preview.sourceJournalReference ?? 'absent'}</code>
          <code>Résolution · {preview.state.resolutionReference}</code>
        </> : <p>{preview?.refusal?.message ?? draft.reason ?? 'Les détails apparaîtront après résolution exacte.'}</p>}
      </details>
    </> : null}
  </section>;
}

