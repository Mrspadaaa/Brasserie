import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { BrewingReferenceIdentityV1 } from '../../domain/brewingReference';
import type { BrewingScenarioResult } from '../../domain/brewingScenario';
import type { BrewingScenarioSnapshotV1 } from '../../domain/brewingScenarioDossier';
import type { Fermentable } from '../../types';
import type { Recipe } from '../../types';
import type { HopV55Intent } from '../../services/hopV55/contracts';
import {
  inspectHopV55FutureRecipeDraft,
  materializeHopV55FutureRecipe,
  prepareHopV55FutureRecipeDraft,
  prepareHopV55FutureRecipeMassRecomputeProposal,
  readHopV55FutureRecipeDraft,
  reviseHopV55FutureRecipeDraft,
  type HopV55FutureRecipeCurrentReferences,
  type HopV55FutureRecipeCompletion,
  type HopV55FutureRecipeDeclaredFields,
  type HopV55FutureRecipeDraftV1,
  type HopV55FutureRecipeDraftPreview,
  type HopV55FutureRecipeMaterializationReceiptV1,
  type HopV55FutureRecipeMassRecomputeProposalV1,
} from '../../services/hopV55/futureRecipeDraft';
import { HopV55ExactInput } from './ExactInput';
import { Input } from '../Input';
import './future-recipe-draft-panel.css';

export interface HopV55FutureRecipeDraftPanelProps {
  result: BrewingScenarioResult;
  snapshot: BrewingScenarioSnapshotV1;
  branchId: string;
  adoptedReference: BrewingReferenceIdentityV1;
  intent: HopV55Intent;
  initialDraft?: HopV55FutureRecipeDraftV1;
  loadDraftRevision?(identity: { draftId: string; revision: number; contentReference: string }): Promise<HopV55FutureRecipeDraftV1>;
  getCurrentReferences(): Promise<HopV55FutureRecipeCurrentReferences>;
  onSaveDraft(draft: HopV55FutureRecipeDraftV1): Promise<void>;
  onMaterialize(recipe: Recipe, receipt: HopV55FutureRecipeMaterializationReceiptV1): Promise<void>;
  onExplore(draft: HopV55FutureRecipeDraftV1, proposedMassBaseline?: HopV55FutureRecipeMassRecomputeProposalV1): Promise<void> | void;
}

type DraftPreparation =
  | { status: 'ready'; draft: HopV55FutureRecipeDraftV1; preview: HopV55FutureRecipeDraftPreview; completion: HopV55FutureRecipeCompletion }
  | { status: 'blocked'; reason: string };
type UiFieldIssue = { field: string; message: string };

function completionMessage(field: string, message: string, preview: HopV55FutureRecipeDraftPreview | undefined,
  fields: HopV55FutureRecipeDeclaredFields): string {
  const match = /^hops\.(.+)\.grams$/.exec(field);
  if (!match) return message;
  const materialName = preview?.additions.find(row => row.additionId === match[1])?.materialName ?? 'cet ajout';
  return fields.hopMassChoices?.[match[1]] === undefined
    ? `La prévision affichée ne précise pas la masse pour ${materialName}. Propose une valeur pour préparer une nouvelle prévision.`
    : `La prévision affichée ne précise toujours pas la masse pour ${materialName}. La proposition doit passer par une nouvelle prévision avant de créer la recette.`;
}

function TechnicalFieldsDisclosure({ rows, label }: { rows: UiFieldIssue[]; label: string }) {
  if (!rows.length) return null;
  return <details className="hv-details hv-future-draft-technical-fields">
    <summary>{label}</summary>
    <ul>{rows.map((row, index) => <li key={`${row.field}-${index}`}><code>{row.field}</code></li>)}</ul>
  </details>;
}

const number = (value: number | null | undefined, digits = 15) => value == null || !Number.isFinite(value)
  ? 'Inconnu' : value.toLocaleString('fr-CH', { maximumFractionDigits: digits });
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

const fermentableKinds: Array<{ value: Fermentable['kind']; label: string }> = [
  { value: 'grain', label: 'Grain' }, { value: 'sucre', label: 'Sucre' }, { value: 'extrait', label: 'Extrait' },
  { value: 'fruit', label: 'Fruit' }, { value: 'lactose', label: 'Lactose' },
];
const fermentableUses: Array<{ value: Fermentable['use']; label: string }> = [
  { value: 'empatage', label: 'Empâtage' }, { value: 'ebullition', label: 'Ébullition' },
  { value: 'fermentation', label: 'Fermentation' },
];

function formLabel(value: string | undefined): string {
  return ({ pelletT90: 'Granulés T-90', pelletT45: 'Granulés T-45', cryo: 'Cryo', cone: 'Cônes', extract: 'Extrait', unknown: 'Forme inconnue' } as Record<string, string>)[value ?? '']
    ?? 'Forme non précisée';
}

function applicabilityLabel(value: string): string {
  return ({ available: 'prévision disponible', conditional: 'prévision sous conditions', unavailable: 'indisponible dans le scénario',
    hypotheticalOnly: 'scénario hypothétique' } as Record<string, string>)[value] ?? 'état non qualifié';
}

function stockStatusLabel(value: string): string {
  return ({ available: 'quantité signalée', unknown: 'disponibilité inconnue', insufficient: 'quantité insuffisante',
    referenceOnly: 'référence sans stock établi' } as Record<string, string>)[value] ?? 'état inconnu';
}

function fermentationChoice(result: BrewingScenarioResult, branchId: string): NonNullable<HopV55FutureRecipeDeclaredFields['fermentation']> | undefined {
  const branch = result.branches.find(row => row.id === branchId);
  const rows = branch?.input.fermentation ?? [];
  const kinds = ['primaire', 'reposDiacetyle', 'garde', 'refermentation', 'ajout'];
  if (!rows.length || rows.some(row => !row.kind || !kinds.includes(row.kind) || !row.name?.trim()
    || !Number.isFinite(row.tempC) || !Number.isFinite(row.days) || (row.days ?? -1) < 0)) return undefined;
  return rows.map(row => ({ kind: row.kind as NonNullable<HopV55FutureRecipeDeclaredFields['fermentation']>[number]['kind'],
    name: row.name!, tempC: row.tempC!, days: row.days!, ...(row.note !== undefined ? { note: row.note } : {}) }));
}

function matchesOrigin(props: HopV55FutureRecipeDraftPanelProps, draft: HopV55FutureRecipeDraftV1): boolean {
  const branch = props.result.branches.find(row => row.id === props.branchId);
  return !!branch && draft.origin.snapshotReference === props.snapshot.reference
    && draft.origin.resultReference === props.result.reference && draft.origin.resultRevision === props.result.revision
    && draft.origin.branchId === props.branchId && draft.origin.branchReference === branch.reference
    && same(draft.origin.adoptedReference, props.adoptedReference) && same(draft.origin.intent, props.intent);
}

function fieldsForNewOrigin(fields: HopV55FutureRecipeDeclaredFields, previous: HopV55FutureRecipeDraftV1,
  props: HopV55FutureRecipeDraftPanelProps): { fields: HopV55FutureRecipeDeclaredFields; unmappedAlpha: number; unmappedMass: number; unmappedPerformed: number } {
  const branch = props.result.branches.find(row => row.id === props.branchId);
  const additions = branch?.program?.additions ?? [];
  const currentById = new Map(additions.map(addition => [addition.id, addition]));
  const oldById = new Map(previous.origin.sourceProgram.additions.map(addition => [addition.id, addition]));
  const alphaChoices = fields.alphaChoices ?? {};
  const retainedAlpha = Object.fromEntries(Object.entries(alphaChoices).filter(([id]) => {
    const old = oldById.get(id);
    const current = currentById.get(id);
    return !!old && !!current && old.materialId === current.materialId;
  }));
  const scheduled = fields.schedulePerformedAdditionIds ?? [];
  const retainedScheduled = scheduled.filter(id => currentById.get(id)?.status === 'performed'
    && oldById.get(id)?.materialId === currentById.get(id)?.materialId);
  const massChoices = fields.hopMassChoices ?? {};
  const resolvedMassIds = new Set(Object.entries(massChoices).filter(([id, grams]) => {
    const old = oldById.get(id);
    const current = currentById.get(id);
    return !!old && old.grams === null && !!current && old.materialId === current.materialId && current.grams === grams;
  }).map(([id]) => id));
  const retainedMass = Object.fromEntries(Object.entries(massChoices).filter(([id]) => {
    const old = oldById.get(id);
    const current = currentById.get(id);
    return !!old && old.grams === null && !!current && current.grams === null && old.materialId === current.materialId;
  }));
  return {
    fields: {
      ...structuredClone(fields),
      ...(Object.keys(alphaChoices).length ? { alphaChoices: retainedAlpha } : {}),
      ...(Object.keys(massChoices).length ? { hopMassChoices: retainedMass } : {}),
      ...(fields.schedulePerformedAdditionIds !== undefined ? { schedulePerformedAdditionIds: retainedScheduled } : {}),
    },
    unmappedAlpha: Object.keys(alphaChoices).length - Object.keys(retainedAlpha).length,
    unmappedMass: Object.keys(massChoices).length - Object.keys(retainedMass).length - resolvedMassIds.size,
    unmappedPerformed: scheduled.length - retainedScheduled.length,
  };
}

function previewOutcome(props: HopV55FutureRecipeDraftPanelProps, fields: HopV55FutureRecipeDeclaredFields,
  draftId: string, currentDraft?: HopV55FutureRecipeDraftV1, historical = false) {
  if (currentDraft && (historical || matchesOrigin(props, currentDraft)) && same(fields, currentDraft.declaredFields)) {
    const read = inspectHopV55FutureRecipeDraft(currentDraft);
    return read.status === 'available' ? { status: 'ready' as const, draft: read.draft, completion: read.completion, preview: read.preview }
      : { status: 'blocked' as const, reason: read.reason };
  }
  if (currentDraft && historical) {
    const read = inspectHopV55FutureRecipeDraft(currentDraft);
    return read.status === 'available' ? { status: 'ready' as const, draft: read.draft, completion: read.completion, preview: read.preview }
      : { status: 'blocked' as const, reason: read.reason };
  }
  if (currentDraft && matchesOrigin(props, currentDraft)) {
    return reviseHopV55FutureRecipeDraft(currentDraft, { revision: currentDraft.revision + 1, declaredFields: fields });
  }
  if (currentDraft) {
    const carried = fieldsForNewOrigin(fields, currentDraft, props);
    return prepareHopV55FutureRecipeDraft({ identity: { draftId: currentDraft.draftId, revision: currentDraft.revision + 1,
      predecessor: { draftId: currentDraft.draftId, revision: currentDraft.revision, contentReference: currentDraft.contentReference } },
      result: props.result, snapshot: props.snapshot, branchId: props.branchId, adoptedReference: props.adoptedReference,
      intent: props.intent, declaredFields: carried.fields });
  }
  return prepareHopV55FutureRecipeDraft({ identity: { draftId, revision: 1 }, result: props.result, snapshot: props.snapshot,
    branchId: props.branchId, adoptedReference: props.adoptedReference, intent: props.intent, declaredFields: fields });
}

export function HopV55FutureRecipeDraftPanel(props: HopV55FutureRecipeDraftPanelProps) {
  const { result, snapshot, branchId, adoptedReference, intent, initialDraft, loadDraftRevision, getCurrentReferences, onSaveDraft, onMaterialize, onExplore } = props;
  const [latestDraft, setLatestDraft] = useState(initialDraft);
  const [draft, setDraft] = useState(initialDraft);
  const [fields, setFields] = useState<HopV55FutureRecipeDeclaredFields>(() => structuredClone(initialDraft?.declaredFields ?? {}));
  const [pendingDraft, setPendingDraft] = useState<HopV55FutureRecipeDraftV1>();
  const [pendingRecipe, setPendingRecipe] = useState<{ recipe: Recipe; receipt: HopV55FutureRecipeMaterializationReceiptV1 }>();
  const [materializationIssues, setMaterializationIssues] = useState<Array<{ field: string; message: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [materialized, setMaterialized] = useState(false);
  const draftIdRef = useRef<string | undefined>(undefined);
  draftIdRef.current ??= initialDraft?.draftId ?? uid('future-draft');
  const recipeIdRef = useRef<string | undefined>(undefined);
  const receiptIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    setLatestDraft(initialDraft); setDraft(initialDraft);
    setFields(structuredClone(initialDraft?.declaredFields ?? {}));
    setPendingDraft(undefined); setPendingRecipe(undefined); setMaterializationIssues([]); setMaterialized(false);
    if (initialDraft) draftIdRef.current = initialDraft.draftId;
    setError(''); setNotice('');
  // Hydrate only when a new immutable revision is loaded, not when the parent redraws this page.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDraft?.contentReference]);
  const sourcePhaseRows = fermentationChoice(result, branchId);
  const baseDraft = pendingDraft ?? draft;
  const isHistorical = !!latestDraft && !!draft && latestDraft.contentReference !== draft.contentReference;
  const originChanged = !!draft && !isHistorical && !matchesOrigin(props, draft);
  const carriedChoiceStatus = originChanged ? fieldsForNewOrigin(fields, draft!, props) : undefined;
  const selectedBranch = result.branches.find(row => row.id === branchId);
  const selectedVolume = selectedBranch?.program?.volumeL ?? selectedBranch?.input.volumeL ?? null;
  const volumeNeedsAcknowledgement = originChanged && fields.volumeL !== undefined && selectedVolume !== null
    && Math.abs(fields.volumeL - selectedVolume) > 1e-9;

  const preparation = useMemo(() => previewOutcome(props, fields, draftIdRef.current!, baseDraft, isHistorical),
    [props.result, props.snapshot, props.branchId, props.adoptedReference, props.intent, fields, baseDraft, isHistorical]);
  const dirty = !!draft && (!same(fields, draft.declaredFields) || originChanged);
  const hasDurableDraft = !!draft && !dirty && !pendingDraft;
  const preview = preparation.status === 'ready' ? preparation.preview : undefined;

  function updateField<K extends keyof HopV55FutureRecipeDeclaredFields>(key: K, value: HopV55FutureRecipeDeclaredFields[K]) {
    setFields(current => ({ ...current, [key]: value }));
    setMaterializationIssues([]); setMaterialized(false); setNotice(''); setError('');
  }

  function updateAlpha(additionId: string, patch: { value?: number; reason?: string }) {
    const alphaChoices = { ...(fields.alphaChoices ?? {}) };
    alphaChoices[additionId] = { ...alphaChoices[additionId], ...patch };
    updateField('alphaChoices', alphaChoices);
  }

  function updateMass(additionId: string, grams: number | undefined) {
    const hopMassChoices = { ...(fields.hopMassChoices ?? {}) };
    if (grams === undefined) delete hopMassChoices[additionId];
    else hopMassChoices[additionId] = grams;
    updateField('hopMassChoices', hopMassChoices);
  }

  async function sendDraft(value: HopV55FutureRecipeDraftV1) {
    setBusy(true); setError(''); setNotice('');
    try {
      await onSaveDraft(value);
      setDraft(value); setLatestDraft(value); setFields(structuredClone(value.declaredFields)); setPendingDraft(undefined);
      setNotice(`Brouillon local conservé · révision ${value.revision}. Aucune recette ni réservation de stock n’a été créée.`);
    } catch (cause) {
      setPendingDraft(value);
      setError(`Le brouillon reste prêt avec son contenu exact. La sauvegarde locale a échoué : ${(cause as Error).message || 'réessaie.'}`);
    } finally { setBusy(false); }
  }

  async function handleSaveDraft(event?: React.FormEvent) {
    event?.preventDefault();
    if (isHistorical) { setError('Une révision historique reste immuable. Retourne à la plus récente pour enregistrer une correction.'); return; }
    if (pendingDraft) { await sendDraft(pendingDraft); return; }
    if (preparation.status === 'blocked') { setError(preparation.reason); return; }
    await sendDraft(preparation.draft);
  }

  async function sendMaterialization(value: { recipe: Recipe; receipt: HopV55FutureRecipeMaterializationReceiptV1 }) {
    setBusy(true); setError(''); setNotice('');
    try {
      await onMaterialize(value.recipe, value.receipt);
      setPendingRecipe(undefined); setMaterialized(true);
      setNotice('La recette a été transmise pour enregistrement. Son aptitude au brassage reste indiquée séparément.');
    } catch (cause) {
      setPendingRecipe(value);
      setError(`La recette reste prête avec le même identifiant. L’enregistrement local a échoué : ${(cause as Error).message || 'réessaie.'}`);
    } finally { setBusy(false); }
  }

  async function handleMaterialize() {
    if (pendingRecipe) { await sendMaterialization(pendingRecipe); return; }
    if (isHistorical) { setError('Une révision historique ne peut pas être matérialisée directement. Reviens à la dernière version ou crée une nouvelle révision.'); return; }
    if (!draft || dirty || pendingDraft) {
      setError('Conserve d’abord cette correction comme nouvelle révision du brouillon.'); return;
    }
    setBusy(true); setError(''); setNotice(''); setMaterializationIssues([]);
    try {
      const currentRefs = await getCurrentReferences();
      const outcome = materializeHopV55FutureRecipe(draft, fields, currentRefs, {
        createRecipeId: () => recipeIdRef.current ??= uid('recipe'),
        createReceiptId: () => receiptIdRef.current ??= uid('future-recipe-receipt'),
        createdAt: new Date().toISOString(),
      });
      if (outcome.status === 'blocked') { setError(outcome.reason); return; }
      if (outcome.status === 'needsCompletion') {
        setMaterializationIssues(outcome.issues);
        setNotice('Le brouillon est conservé. Complète les champs invalides ou relance une exploration pour réévaluer le procédé.');
        return;
      }
      const value = { recipe: outcome.recipe, receipt: outcome.receipt };
      setPendingRecipe(value);
      await sendMaterialization(value);
    } catch (cause) {
      setError((cause as Error).message || 'Les références courantes n’ont pas pu être vérifiées. Le brouillon reste intact.');
    } finally { setBusy(false); }
  }

  async function handleExplore() {
    if (!draft || dirty || pendingDraft) { setError('Conserve d’abord les corrections du brouillon avant une nouvelle exploration.'); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      if (Object.keys(draft.declaredFields.hopMassChoices ?? {}).length) {
        const proposal = prepareHopV55FutureRecipeMassRecomputeProposal(draft);
        if (proposal.status === 'blocked') { setError(proposal.reason); return; }
        if (proposal.status === 'needsCompletion') {
          setMaterializationIssues(proposal.issues);
          setNotice('Déclare les masses des opérations concernées avant de préparer la nouvelle prévision.');
          return;
        }
        await onExplore(draft, proposal.proposal);
        setNotice('Nouvelle prévision préparée avec les masses proposées. Le brouillon et sa prévision d’origine restent inchangés.');
      } else {
        await onExplore(draft);
        setNotice('Nouvelle exploration ouverte sur la base hypothétique exacte du brouillon, sans recette source.');
      }
    }
    catch (cause) { setError((cause as Error).message || 'L’exploration n’a pas pu être ouverte. Le brouillon reste disponible.'); }
    finally { setBusy(false); }
  }

  async function handleOpenPreviousRevision() {
    if (!draft?.predecessor || !loadDraftRevision) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const raw = await loadDraftRevision(draft.predecessor);
      const read = readHopV55FutureRecipeDraft(raw);
      if (read.status !== 'available' || read.draft.draftId !== draft.predecessor.draftId
        || read.draft.revision !== draft.predecessor.revision || read.draft.contentReference !== draft.predecessor.contentReference) {
        throw Error(read.status === 'available' ? 'La révision chargée ne correspond pas au pointeur immuable du brouillon.' : read.reason);
      }
      setDraft(read.draft); setFields(structuredClone(read.draft.declaredFields)); setPendingDraft(undefined);
      setPendingRecipe(undefined); setMaterialized(false); setMaterializationIssues([]);
      setNotice(`Révision historique ${read.draft.revision} ouverte en lecture seule; la version la plus récente reste conservée.`);
    } catch (cause) { setError((cause as Error).message || 'La révision précédente n’a pas pu être relue.'); }
    finally { setBusy(false); }
  }

  function handleReturnToLatest() {
    if (!latestDraft) return;
    setDraft(latestDraft); setFields(structuredClone(latestDraft.declaredFields)); setPendingDraft(undefined);
    setPendingRecipe(undefined); setMaterialized(false); setMaterializationIssues([]); setError('');
    setNotice(`Dernière révision ${latestDraft.revision} rétablie.`);
  }

  function toggleSchedulePerformed(additionId: string, checked: boolean) {
    const current = new Set(fields.schedulePerformedAdditionIds ?? []);
    if (checked) current.add(additionId); else current.delete(additionId);
    updateField('schedulePerformedAdditionIds', [...current]);
  }

  function addFermentable() {
    updateField('fermentables', [...(fields.fermentables ?? []), {}]);
  }

  function editFermentable(index: number, change: Partial<Fermentable>) {
    const rows = [...(fields.fermentables ?? [])];
    rows[index] = { ...rows[index], ...change };
    updateField('fermentables', rows);
  }

  function removeFermentable(index: number) {
    updateField('fermentables', (fields.fermentables ?? []).filter((_, rowIndex) => rowIndex !== index));
  }

  const displayPreview = preview;
  const displayDraft = preparation.status === 'ready' ? preparation.draft : draft;

  return <section className="hop-v55 hv-future-recipe-draft" aria-labelledby="hv-future-draft-title">
    <header className="hv-future-draft-heading">
      <div><h2 id="hv-future-draft-title">Préparer un brouillon de recette</h2>
        <p>À partir d’une composition hypothétique choisie. Le brouillon peut être conservé avant d’avoir une levure, une formulation ou une ébullition complètes.</p>
      </div>
        <span className={`hv-future-draft-state${isHistorical ? ' is-historical' : ''}`}>{isHistorical ? 'Révision historique'
          : originChanged ? 'Nouvelle prévision à conserver' : 'Brouillon local'}</span>
    </header>

    {originChanged ? <p className="hv-future-draft-live" role="status">
      Cette branche vient d’une nouvelle prévision. Enregistre-la comme révision {draft!.revision + 1}; la révision précédente reste intacte.
      {carriedChoiceStatus && (carriedChoiceStatus.unmappedAlpha || carriedChoiceStatus.unmappedMass || carriedChoiceStatus.unmappedPerformed) ? <>
        {' '}Des choix liés aux anciens ajouts ne sont pas reportés ({carriedChoiceStatus.unmappedMass} masse, {carriedChoiceStatus.unmappedAlpha} alpha, {carriedChoiceStatus.unmappedPerformed} replanification); rechoisis-les pour les nouvelles lignes.
      </> : null}
    </p> : null}
    {preparation.status === 'blocked' ? <p className="hv-error" role="alert">{preparation.reason}</p> : null}
    {volumeNeedsAcknowledgement ? <button className="hv-future-empty-formulation" type="button" onClick={() => updateField('volumeL', selectedVolume!)}>
      Adopter explicitement les {number(selectedVolume)} L de la nouvelle prévision
    </button> : null}
    {displayPreview ? <>
      <section className="hv-future-draft-program" aria-labelledby="hv-future-program-title">
        <div className="hv-future-draft-program-heading">
          <div><h3 id="hv-future-program-title">Programme de houblon retenu</h3>
            <p>{displayPreview.scenarioLabel} · {displayPreview.volumeL == null ? 'volume inconnu' : `${number(displayPreview.volumeL)} L`}</p>
          </div>
          <strong>{displayPreview.additions.filter(row => row.futureStatus === 'planned').length} ajouts futurs</strong>
        </div>
        <ul className="hv-future-draft-additions">
          {displayPreview.additions.map(row => <li key={row.additionId} className={row.futureStatus === 'excludedPerformed' ? 'is-excluded' : undefined}>
            <div className="hv-future-draft-addition-name"><strong>{row.materialName}</strong>
              <span>{formLabel(displayDraft?.sourceMaterials.find(material => material.id === row.materialId)?.material.form)} · {row.use === 'firstWort' ? 'Premier moût' : row.use === 'boil' ? 'Ébullition'
                : row.use === 'whirlpool' ? 'Whirlpool' : row.use === 'fermentation' ? 'Fermentation' : 'Après fermentation'}</span>
            </div>
            <strong className="hv-future-draft-mass">{row.grams === null
              ? fields.hopMassChoices?.[row.additionId] === undefined ? 'Masse inconnue dans la prévision' : `Masse de la prévision inconnue · proposition : ${number(fields.hopMassChoices[row.additionId])} g`
              : `${number(row.grams)} g`}</strong>
            <small>{row.contactHours == null ? '' : `${number(row.contactHours)} h`}{row.temperatureC == null ? '' : `${row.contactHours == null ? '' : ' · '}${number(row.temperatureC)} °C`}
              {row.boilMinutes == null ? '' : `${row.contactHours == null && row.temperatureC == null ? '' : ' · '}${number(row.boilMinutes)} min`}
              {row.futureStatus === 'excludedPerformed' ? ' · effectué dans la source, exclu du futur plan' : ''}</small>
            {row.futureStatus === 'planned' && row.grams === null ? <div className="hv-future-draft-mass-choice">
              <HopV55ExactInput label={`Masse proposée · ${row.materialName}`} unit="g" min={0}
                value={fields.hopMassChoices?.[row.additionId]} onValue={grams => updateMass(row.additionId, grams)} />
              <small>La masse de la prévision affichée reste inconnue. Cette valeur prépare une nouvelle prévision; la recette attend ce nouveau calcul.</small>
            </div> : null}
          </li>)}
        </ul>
        {displayPreview.j1Applicability === 'unavailable' ? <p className="hv-future-draft-stock-note" role="status">
          Le scénario signalait un besoin à traiter avant brassage. Le brouillon reste conservé; le stock n’est ni réservé ni modifié.
        </p> : null}
      </section>

      <details className="hv-details hv-future-draft-source">
        <summary>Origine, stock observé et références du scénario</summary>
        {displayDraft?.sourceMaterials.map(row => <p key={row.id}>
          {row.material.name} · {formLabel(row.material.form)} · {row.material.availableGrams == null ? 'disponibilité inconnue dans le scénario'
            : `${number(row.material.availableGrams)} g signalés dans le scénario`}
          <code>{row.id}</code>
        </p>)}
        {displayPreview.stock?.map(row => <p key={row.materialId}>
          Besoin {row.neededGrams == null ? 'inconnu' : `${number(row.neededGrams)} g`} · {row.availableGrams == null ? 'disponibilité inconnue' : `${number(row.availableGrams)} g signalés`} · {stockStatusLabel(row.status)}
        </p>)}
        {displayPreview.conditions.map((condition, index) => <p key={`${index}-${condition}`}>{condition}</p>)}
        <p>Scénario · <code>{displayPreview.sourceScenarioReference}</code></p>
        <p>Branche · <code>{displayPreview.sourceBranchReference}</code> · {applicabilityLabel(displayPreview.sourceBranchApplicability)}</p>
        {displayDraft ? <p>Brouillon · <code>{displayDraft.draftId}</code> · révision {displayDraft.revision}</p> : null}
        <p>Référence adoptée · <code>{adoptedReference.id}/{adoptedReference.version}</code></p>
      </details>

      <form className="hv-future-draft-form" autoComplete="off" onSubmit={event => void handleSaveDraft(event)}>
        <fieldset disabled={busy || !!pendingDraft || !!pendingRecipe || isHistorical}>
          <legend>Compléter sans inventer le procédé</legend>
          <div className="hv-future-draft-grid">
            <label className="hv-field"><span>Nom de la recette</span><Input aria-label="Nom de la future recette"
              value={fields.name ?? ''} placeholder="À choisir" onChange={event => updateField('name', event.target.value)} /></label>
            <label className="hv-field"><span>Style (déclaration du brasseur)</span><Input aria-label="Style de la future recette"
              value={fields.style ?? ''} placeholder="Non déclaré" onChange={event => updateField('style', event.target.value)} /></label>
            <div className="hv-future-draft-volume"><span>Volume de la prévision choisie</span>
              <strong>{displayPreview.volumeL == null ? 'Inconnu' : `${number(displayPreview.volumeL)} L`}</strong>
              <small>Pour un autre volume, relance une exploration; les masses ne seront pas recalculées ici.</small>
            </div>
            <HopV55ExactInput label="Durée d’ébullition choisie" unit="min" min={0} value={fields.boilMin}
              onValue={value => updateField('boilMin', value)} />
          </div>

          <section className="hv-future-draft-edit-section" aria-labelledby="hv-future-yeast-title">
            <h3 id="hv-future-yeast-title">Levure · encore inconnue ou à déclarer</h3>
            <div className="hv-future-draft-grid">
              <label className="hv-field"><span>Nom déclaré</span><Input aria-label="Nom de la levure future"
                value={fields.yeast?.name ?? ''} placeholder="Non renseigné" onChange={event => updateField('yeast', { ...fields.yeast, name: event.target.value })} /></label>
              <label className="hv-field"><span>ID de souche · facultatif</span><Input aria-label="ID de souche future"
                value={fields.yeast?.hopIndexId ?? ''} placeholder="Inconnu" onChange={event => updateField('yeast', { ...fields.yeast,
                  ...(event.target.value ? { hopIndexId: event.target.value } : { hopIndexId: undefined }) })} /></label>
              <HopV55ExactInput label="Quantité de levure" unit={fields.yeast?.unit ?? 'unité à choisir'} min={0}
                value={fields.yeast?.qty} onValue={qty => updateField('yeast', { ...fields.yeast, ...(qty !== undefined ? { qty } : { qty: undefined }) })} />
              <label className="hv-field"><span>Unité de dose</span><Input aria-label="Unité de levure future"
                value={fields.yeast?.unit ?? ''} placeholder="sachet, g, mL…" onChange={event => updateField('yeast', { ...fields.yeast,
                  ...(event.target.value ? { unit: event.target.value } : { unit: undefined }) })} /></label>
              <label className="hv-field"><span>Forme · facultative</span><select aria-label="Forme de levure future" value={fields.yeast?.form ?? ''}
                onChange={event => updateField('yeast', { ...fields.yeast,
                  ...(event.target.value ? { form: event.target.value as NonNullable<HopV55FutureRecipeDeclaredFields['yeast']>['form'] } : { form: undefined }) })}>
                <option value="">Non déclarée</option><option value="sèche">Sèche</option><option value="liquide">Liquide</option><option value="levain">Levain maison</option>
              </select></label>
            </div>
            <p>La quantité, l’identité et la forme restent des choix séparés. Aucun produit, fabricant, stock ou fait technique n’est repris.</p>
          </section>

          <section className="hv-future-draft-edit-section" aria-labelledby="hv-future-fermentables-title">
            <div className="hv-future-draft-section-heading"><div><h3 id="hv-future-fermentables-title">Fermentescibles</h3>
              <p>{fields.fermentables === undefined ? 'Formulation non déclarée.' : `${fields.fermentables.length} ligne(s) déclarée(s).`}</p></div>
              <button type="button" onClick={addFermentable}>Ajouter une ligne</button></div>
            {fields.fermentables === undefined ? <button className="hv-future-empty-formulation" type="button"
              onClick={() => updateField('fermentables', [])}>Déclarer explicitement une formulation vide</button> : null}
            {fields.fermentables?.length === 0 ? <p className="hv-future-empty-formulation-note">
              Cette liste vide est une déclaration explicite; elle restera incomplète avant brassage.
              <button type="button" onClick={() => updateField('fermentables', undefined)}>Retirer cette déclaration</button>
            </p> : null}
            {(fields.fermentables ?? []).map((row, index) => <div className="hv-future-fermentable-row" key={`fermentable-${index}`}>
              <label className="hv-field"><span>Ingrédient {index + 1}</span><Input aria-label={`Nom du fermentescible ${index + 1}`}
                value={row.name ?? ''} placeholder="À identifier" onChange={event => editFermentable(index, { name: event.target.value })} /></label>
              <HopV55ExactInput label={`Masse du fermentescible ${index + 1}`} unit="kg" min={0} value={row.weightKg}
                onValue={weightKg => editFermentable(index, { ...(weightKg !== undefined ? { weightKg } : { weightKg: undefined }) })} />
              <label className="hv-field"><span>Type</span><select aria-label={`Type du fermentescible ${index + 1}`} value={row.kind ?? ''}
                onChange={event => editFermentable(index, { ...(event.target.value ? { kind: event.target.value as Fermentable['kind'] } : { kind: undefined }) })}>
                <option value="">À choisir</option>{fermentableKinds.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select></label>
              <label className="hv-field"><span>Emploi</span><select aria-label={`Emploi du fermentescible ${index + 1}`} value={row.use ?? ''}
                onChange={event => editFermentable(index, { ...(event.target.value ? { use: event.target.value as Fermentable['use'] } : { use: undefined }) })}>
                <option value="">À choisir</option>{fermentableUses.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select></label>
              <button type="button" className="hv-future-remove" onClick={() => removeFermentable(index)}>Retirer la ligne</button>
            </div>)}
          </section>

          <section className="hv-future-draft-edit-section" aria-labelledby="hv-future-alpha-title">
            <h3 id="hv-future-alpha-title">Alpha pour la recette · choix de travail</h3>
            <p>Le schéma Recipe demande un scalaire. Choisis une valeur de travail positive et explique-la; elle ne devient pas une mesure du lot.</p>
            {displayPreview.additions.filter(row => row.futureStatus === 'planned').map(row => <div className="hv-future-alpha-row" key={row.additionId}>
              <HopV55ExactInput label={`Alpha de travail · ${row.materialName}`} unit="%" min={0.01} max={100}
                value={fields.alphaChoices?.[row.additionId]?.value} onValue={value => updateAlpha(row.additionId, { value })} />
              <label className="hv-field"><span>Motif · {row.materialName}</span><Input aria-label={`Motif alpha · ${row.materialName}`}
                value={fields.alphaChoices?.[row.additionId]?.reason ?? ''} placeholder="Pourquoi ce nominal ?"
                onChange={event => updateAlpha(row.additionId, { reason: event.target.value })} /></label>
            </div>)}
          </section>

          {sourcePhaseRows ? <section className="hv-future-draft-edit-section" aria-labelledby="hv-future-fermentation-title">
            {fields.fermentation !== undefined && !same(fields.fermentation, sourcePhaseRows) ? <div>
              <h4>Phases déjà déclarées dans le brouillon précédent</h4>
              <ul className="hv-future-draft-phases">{fields.fermentation.map((step, index) => <li key={`declared-${step.kind}-${index}`}>
                {step.name} · {number(step.tempC)} °C · {number(step.days)} j
              </li>)}</ul>
            </div> : null}
            <label className="hv-future-checkbox"><input type="checkbox" checked={same(fields.fermentation, sourcePhaseRows)}
              onChange={event => updateField('fermentation', event.target.checked ? sourcePhaseRows : undefined)} />
              <span id="hv-future-fermentation-title">{fields.fermentation !== undefined && !same(fields.fermentation, sourcePhaseRows)
                ? 'Remplacer par les phases de la nouvelle prévision' : 'Reprendre explicitement les phases de la prévision'}</span></label>
            <ul className="hv-future-draft-phases">{sourcePhaseRows.map((step, index) => <li key={`${step.kind}-${index}`}>
              {step.name} · {number(step.tempC)} °C · {number(step.days)} j
            </li>)}</ul>
          </section> : <>
            {fields.fermentation !== undefined ? <section className="hv-future-draft-edit-section" aria-label="Phases déclarées">
              <h3>Phases déjà déclarées dans le brouillon</h3>
              <ul className="hv-future-draft-phases">{fields.fermentation.map((step, index) => <li key={`declared-${step.kind}-${index}`}>
                {step.name} · {number(step.tempC)} °C · {number(step.days)} j
              </li>)}</ul>
              <button type="button" onClick={() => updateField('fermentation', undefined)}>Retirer ces phases</button>
            </section> : null}
            <p className="hv-future-draft-missing">Les phases de la prévision ne sont pas assez définies pour être reprises comme consignes de recette.</p>
          </>}

          {displayPreview.additions.filter(row => row.sourceStatus === 'performed').map(row => <label className="hv-future-checkbox hv-future-performed-choice" key={row.additionId}>
            <input type="checkbox" checked={(fields.schedulePerformedAdditionIds ?? []).includes(row.additionId)}
              onChange={event => toggleSchedulePerformed(row.additionId, event.target.checked)} />
            <span>Replanifier explicitement comme futur l’ajout source effectué · {row.materialName} · {number(row.grams)} g</span>
          </label>)}
        </fieldset>

        <div className="hv-future-draft-completion" aria-live="polite">
          <strong>Le brouillon local peut être conservé maintenant.</strong>
          {preparation.status === 'ready' && preparation.completion.missing.map(row => <p key={row.field}>
            {completionMessage(row.field, row.message, displayPreview, fields)}
          </p>)}
          {preparation.status === 'ready' ? <TechnicalFieldsDisclosure rows={preparation.completion.missing}
            label="Détails techniques des champs à compléter" /> : null}
          {preparation.status === 'ready' && preparation.completion.unknownAlphaAdditionIds.length ? <p>
            Alpha de recette à choisir et justifier pour {preparation.completion.unknownAlphaAdditionIds.length} ajout(s); aucun résultat ne sert d’analyse.
          </p> : null}
          {preparation.status === 'ready' && preparation.completion.excludedPerformedAdditionIds.length ? <p>
            {preparation.completion.excludedPerformedAdditionIds.length} ajout(s) déjà effectué(s) restent hors du futur programme tant que tu ne choisis pas de les replanifier.
          </p> : null}
        </div>

        <div className="hv-future-draft-actions">
          {isHistorical ? <button type="button" disabled>Révision historique · lecture seule</button>
            : pendingDraft ? <button className="hv-primary" type="button" onClick={() => void handleSaveDraft()} disabled={busy}>
              {busy ? 'Réessai…' : 'Réessayer la même sauvegarde locale'}
            </button> : <button className="hv-primary" type="submit" disabled={busy || preparation.status === 'blocked' || !dirty && !!draft}>
              {busy ? 'Conservation…' : draft ? `Enregistrer la révision ${draft.revision + 1}` : 'Conserver le brouillon local'}
            </button>}
          {hasDurableDraft ? <button type="button" onClick={() => void handleExplore()} disabled={busy}>
            {Object.keys(draft?.declaredFields.hopMassChoices ?? {}).length ? 'Prévoir à nouveau avec les masses déclarées' : 'Explorer depuis ce brouillon'}
          </button> : null}
          {draft?.predecessor && !isHistorical && loadDraftRevision ? <button type="button" onClick={() => void handleOpenPreviousRevision()} disabled={busy}>
            Ouvrir la révision précédente
          </button> : null}
          {isHistorical && latestDraft ? <button type="button" onClick={handleReturnToLatest} disabled={busy}>Retour à la dernière révision</button> : null}
          {hasDurableDraft && !isHistorical ? <button type="button" onClick={() => void handleMaterialize()}
            disabled={busy || !!pendingRecipe || materialized || draft.additions.some(row => row.addition.grams === null)}
            title={draft.additions.some(row => row.addition.grams === null) ? 'La masse doit être intégrée à une nouvelle prévision avant la recette.' : undefined}>
            {draft.additions.some(row => row.addition.grams === null) ? 'Nouvelle prévision requise' : 'Créer la recette déclarée'}
          </button> : null}
          {pendingRecipe ? <button type="button" onClick={() => void sendMaterialization(pendingRecipe)} disabled={busy}>
            Réessayer le même enregistrement de recette
          </button> : null}
        </div>
      </form>

      {materializationIssues.length ? <section className="hv-future-draft-needs" aria-label="Champs à compléter">
        <strong>Le brouillon est conservé; la recette attend ces champs.</strong>
        {materializationIssues.map((issue, index) => <p key={`${issue.field}-${index}`}>
          {completionMessage(issue.field, issue.message, displayPreview, fields)}
        </p>)}
        <TechnicalFieldsDisclosure rows={materializationIssues} label="Détails techniques des champs à compléter" />
      </section> : null}
      {pendingDraft ? <p className="hv-future-draft-pending" role="status">Cette même révision reste en attente de sauvegarde locale.</p> : null}
      {materialized ? <p className="hv-future-draft-success" role="status">La recette a été transmise; son état de sauvegarde et son état de brassage restent distincts.</p> : null}
    </> : null}

    {error ? <p className="hv-error hv-future-draft-live" role="alert">{error}</p> : null}
    {notice ? <p className="hv-future-draft-live" role="status">{notice}</p> : null}
    {displayDraft ? <details className="hv-details hv-future-draft-readiness">
      <summary>Identifiants et statut de reprise</summary>
      <p>Brouillon · <code>{displayDraft.draftId}</code> · révision {displayDraft.revision}</p>
      <p>Référence immuable · <code>{displayDraft.contentReference}</code></p>
      <p>Prédécesseur · {displayDraft.predecessor ? <code>{displayDraft.predecessor.contentReference}</code> : 'première révision'}</p>
      <p>La matérialisation crée une nouvelle identité de recette; le brouillon source reste conservé.</p>
    </details> : null}
  </section>;
}
