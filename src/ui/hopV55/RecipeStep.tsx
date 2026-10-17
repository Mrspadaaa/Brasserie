import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { BrewerContext } from '../../../functions/src/companionTypes';
import type { HopIngredient, Recipe } from '../../types';
import type { HopColdContactEvidenceExpectedSourceV1 } from '../../domain/hopDecision/coldContactEvidence';
import { prepareBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { HopV55RecipeColdContactAssociationV1 } from '../../services/hopV55/recipeColdContactAssociation';
import { createHopV55Services, type CreateHopV55ServicesOptions } from '../../services/hopV55/runtime';
import type { HopV55Services } from '../../services/hopV55/contracts';
import { createHopV55ScenarioConfirmer } from '../../services/hopV55/serverScenario';
import { createHopV55RecipeDraftContextSource, hopV55RecipeDraftIdentityError,
  canonicalizeHopV55RecipeDraft, type HopV55RecipeStepStorage } from '../../services/hopV55/recipeStepContext';
import { appendHopV55RecipeApplication, assertHopV55RecipeDraftApplicationTarget, readHopV55RecipeApplications,
  type HopV55RecipeApplicationRecordV1, type HopV55RecipeDraftApplicationV1, type HopV55RecipeDraftTarget } from '../../services/hopV55/recipeDraftApplication';
import type { HopV55SemanticAdoptionApplicationHostFactoryOptionsV1 } from '../../services/hopV55/semanticAdoptionApplicationHost';
import { BrewerChat } from '../BrewerChat';
import { HOP_V55_SEMANTIC_ADVICE_UNAVAILABLE_V3, HOP_V55_SEMANTIC_WIZARD_LANE_UNAVAILABLE_V1,
  HopV55SemanticAdviceCapabilityContext, hopV55SemanticWizardLaneDeclared } from './assistedAdviceUiContracts';
import { useHopV55SemanticCompanionCycleV1 } from './Host';
import { HopV55Page } from './Page';
import { HopV55RecipeColdContactWorkbench } from './RecipeColdContactWorkbench';
import { hopV55TraceLine } from './traceLabels';
import './recipe-step.css';

/**
 * Exact change handed to the wizard once the application has been proven
 * against its current draft. The wizard only writes these values; it does not
 * save, and it keeps every other field as written.
 */
export interface HopV55RecipeDraftChange {
  draftId: string;
  /** Hop lines produced by the canonical J4 application. */
  hops: HopIngredient[];
  /** Existing traces kept verbatim (future or unreadable ones included), then the new sealed record. */
  hopV55Applications: unknown[];
  record: HopV55RecipeApplicationRecordV1;
  application: HopV55RecipeDraftApplicationV1;
}

export interface HopV55RecipeColdContactChange {
  draftId: string;
  association: HopV55RecipeColdContactAssociationV1;
  /** Resolved afresh by the canonical host, never supplied by model arguments. */
  currentSourceBinding: HopColdContactEvidenceExpectedSourceV1;
  applicationRecord?: unknown;
}

export interface HopV55RecipeStepProps {
  /** Explicit local account partition; the step stays closed without it. */
  ownerKey?: string;
  /** Live, complete wizard draft (build()), including unsaved and missing values. */
  recipe: Recipe;
  /** Remote companion and server confirmations are disabled; local V5.5 work stays available. */
  localOnly?: boolean;
  /** Writes a proven hop change into the wizard draft. Throws to refuse it. Never saves. */
  onApply(change: HopV55RecipeDraftChange): void | Promise<void>;
  onConserveColdEvidence?(change: HopV55RecipeColdContactChange): Promise<void>;
  onCorrectContext?(step: 'identite' | 'levure' | 'paliers'): void;
  /** @internal Deterministic seams for tests; production uses the local runtime and stores. */
  createServices?: (options: CreateHopV55ServicesOptions) => HopV55Services;
  storage?: HopV55RecipeStepStorage;
}

type WizardContextReader = NonNullable<HopV55SemanticAdoptionApplicationHostFactoryOptionsV1['readCurrentWizardContext']>;

function localDateTime(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleString('fr-CH', { timeZone: 'Europe/Zurich', dateStyle: 'short', timeStyle: 'short' }) : value;
}

/** The canonical V5.5 workbench, hosted natively in the recipe wizard's hop step. */
export function HopV55RecipeStep({ ownerKey, recipe, localOnly = false, onApply, onConserveColdEvidence, onCorrectContext, createServices = createHopV55Services, storage }: HopV55RecipeStepProps) {
  const draftId = recipe.id;
  const identityError = hopV55RecipeDraftIdentityError(ownerKey, draftId);
  const recipeDraftReference = useMemo(() => {
    if (!ownerKey || identityError) return null;
    try { return canonicalizeHopV55RecipeDraft({ ownerKey, draftId, draft: recipe }).reference; }
    catch { return null; }
  }, [ownerKey, draftId, recipe, identityError]);
  const draftRef = useRef(recipe); draftRef.current = recipe;
  const onApplyRef = useRef(onApply); onApplyRef.current = onApply;
  const coldWriterRef = useRef(onConserveColdEvidence); coldWriterRef.current = onConserveColdEvidence;
  const correctionRef = useRef(onCorrectContext); correctionRef.current = onCorrectContext;
  const createRef = useRef(createServices); createRef.current = createServices;
  const storageRef = useRef(storage); storageRef.current = storage;
  const [services, setServices] = useState<HopV55Services>();
  const servicesRef = useRef<HopV55Services | undefined>(undefined); servicesRef.current = services;
  const [servicesError, setServicesError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [companion, setCompanion] = useState<{ question: string; context: BrewerContext }>();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const onWorkspaceSelected = useCallback((id: string | null) => setWorkspaceId(id), []);
  const activeIdentity = useRef({ ownerKey, draftId, mounted: true });
  activeIdentity.current.ownerKey = ownerKey; activeIdentity.current.draftId = draftId;
  useEffect(() => { activeIdentity.current.mounted = true; return () => { activeIdentity.current.mounted = false; }; }, []);

  useEffect(() => {
    setServices(undefined); setServicesError(''); setWorkspaceId(null);
    if (identityError || !ownerKey) return;
    let created: HopV55Services | undefined;
    try {
      created = createRef.current({ ownerKey, context: createHopV55RecipeDraftContextSource({ ownerKey, draftId,
        readDraft: () => draftRef.current, ...(storageRef.current ? { storage: storageRef.current } : {}) }) });
      setServices(created);
    } catch (error) {
      setServicesError(error instanceof Error ? error.message : 'Le dossier local V5.5 n’a pas pu être ouvert sur cet appareil.');
    }
    return () => { try { created?.close(); } catch { /* Closing a local dossier is best effort. */ } };
  }, [ownerKey, draftId, identityError, attempt]);

  const target = useMemo<HopV55RecipeDraftTarget | undefined>(() => ownerKey && !identityError ? {
    ownerKey, draftId,
    onCorrectContext: step => correctionRef.current?.(step),
    apply: async application => {
        if (!activeIdentity.current.mounted || activeIdentity.current.ownerKey !== ownerKey || activeIdentity.current.draftId !== draftId)
          throw new Error('Le profil ou le brouillon actif a changé; aucune application n’est effectuée.');
        // Same owner, same draft ID and the exact draft content the preview was proven against.
        const current = draftRef.current;
        assertHopV55RecipeDraftApplicationTarget(application, current, { ownerKey, draftId });
        const hopV55Applications = appendHopV55RecipeApplication(current.hopV55Applications, application.record);
        await onApplyRef.current({ draftId, hops: structuredClone(application.hops), hopV55Applications, record: application.record, application });
    },
  } : undefined, [ownerKey, draftId, identityError]);

  const readActiveRecipe = useCallback(() => {
    const identity = activeIdentity.current;
    return identity.mounted && identity.ownerKey === ownerKey && identity.draftId === draftId ? draftRef.current : undefined;
  }, [ownerKey, draftId]);
  const conserveColdEvidence = useCallback(async (change: HopV55RecipeColdContactChange) => {
    if (!readActiveRecipe() || !coldWriterRef.current || change.draftId !== draftId
      || change.association.ownerKey !== ownerKey || change.association.recipeId !== draftId) {
      throw new Error('Le profil ou le brouillon actif a changé; aucune preuve froide n’est conservée.');
    }
    await coldWriterRef.current(change);
  }, [readActiveRecipe, ownerKey, draftId]);

  /**
   * Live unsaved draft for the Application host. It reads the very draftRef the workshop services read, after
   * each await, and refuses a changed owner, draft, mount, origin or content; no stored Recipe is consulted.
   */
  const readCurrentWizardContext = useCallback<WizardContextReader>(async ({ workspace, origin, scope }) => {
    const stillActive = () => {
      const identity = activeIdentity.current;
      return identity.mounted && !!ownerKey && identity.ownerKey === ownerKey && identity.draftId === draftId;
    };
    const liveServices = servicesRef.current;
    if (!stillActive() || !ownerKey || !liveServices || liveServices.ownerKey !== ownerKey) {
      throw new Error('Le profil ou le brouillon ouvert a changé; aucune lecture assistée ne part de ce brouillon.');
    }
    const durableOrigin = workspace.wizardOrigin;
    if (origin.ownerKey !== ownerKey || origin.draftId !== draftId || origin.workspaceId !== workspace.id
      || !durableOrigin || durableOrigin.ownerKey !== ownerKey || durableOrigin.draftId !== draftId
      || durableOrigin.workspaceId !== workspace.id || scope.kind !== 'draft') {
      throw new Error('Ce dossier assisté appartient à un autre brouillon; aucune recette enregistrée ne le remplace.');
    }
    const before = canonicalizeHopV55RecipeDraft({ ownerKey, draftId, draft: draftRef.current });
    const context = await liveServices.loadContext();
    if (!stillActive() || servicesRef.current !== liveServices) {
      throw new Error('Le brouillon a été fermé ou rouvert pendant la relecture; rien n’est envoyé.');
    }
    const after = canonicalizeHopV55RecipeDraft({ ownerKey, draftId, draft: draftRef.current });
    if (after.reference !== before.reference) {
      throw new Error('Le brouillon a changé pendant la relecture; relis la question sur sa version actuelle.');
    }
    if (!context.recipe || context.batch
      || canonicalizeHopV55RecipeDraft({ ownerKey, draftId, draft: context.recipe }).reference !== after.reference) {
      throw new Error('Le contexte relu ne provient pas exactement du brouillon ouvert; rien n’est envoyé.');
    }
    return { snapshot: { recipe: after.recipe, reference: after.reference }, context,
      livePrepared: prepareBrewingScenarioContext(context) };
  }, [ownerKey, draftId]);

  const confirmScenario = useMemo(() => localOnly ? undefined : createHopV55ScenarioConfirmer(), [localOnly, ownerKey]);
  // Same capability as the App and Host; the creator opens it only with an explicit Wizard runtime factory.
  const semanticCapability = useContext(HopV55SemanticAdviceCapabilityContext);
  // Local-only keeps both send lanes closed; the archive reader of assisted dossiers stays local and provider-free.
  const semanticCycle = useHopV55SemanticCompanionCycleV1({ ownerKey: ownerKey ?? '',
    services: identityError ? undefined : services,
    capability: localOnly ? HOP_V55_SEMANTIC_ADVICE_UNAVAILABLE_V3 : semanticCapability,
    ...(localOnly ? {} : { readCurrentWizardContext }) });
  const closeSemantic = semanticCycle.close;
  const openSemanticCompanion = semanticCycle.open;
  const semanticAdviceUnavailableReason = localOnly ? 'Brouillon local uniquement : rien n’est envoyé au compagnon assisté.'
    : semanticCapability.kind === 'unavailable' ? `${semanticCapability.reason} L’atelier local et le compagnon habituel restent disponibles.`
      : !hopV55SemanticWizardLaneDeclared(semanticCapability) ? HOP_V55_SEMANTIC_WIZARD_LANE_UNAVAILABLE_V1
        : semanticCycle.wizardAvailable ? undefined : 'Le dossier local de ce brouillon s’ouvre encore; le compagnon assisté sera proposé ensuite.';
  const storedApplications = recipe.hopV55Applications;
  const applications = useMemo(() => readHopV55RecipeApplications(storedApplications), [storedApplications]);
  const latest = applications.records.at(-1);
  // Catalogue entries keep their name; a recipe line index refers to the draft read by the scenario, named generically.
  const traceNames = new Map(recipe.hops.flatMap(hop => hop.hopVarietyId ? [[`variety:${hop.hopVarietyId}`, hop.name] as const] : []));

  if (identityError) {
    return <div className="recipe-hop-v55-closed" role="alert">
      <p>{identityError}</p>
      <p>Les lignes de houblon restent modifiables dans « Corriger les lignes de houblon ».</p>
    </div>;
  }

  return <div className="recipe-hop-v55" data-testid="recipe-hop-v55" data-draft-id={draftId}>
    <div className="recipe-hop-v55-scope">
      <p><strong>Atelier Houblons V5.5 · brouillon en cours</strong> · les études, prévisions et essais restent dans le dossier local de ce brouillon; un programme ne modifie la recette qu’après « Appliquer au brouillon ».</p>
      {latest ? <><p role="status">Dernière application · {localDateTime(latest.appliedAt)}
        {latest.ownerKey !== ownerKey ? ' · autre profil, dossier local conservé séparément' : ''}</p>
        <details><summary>Origine du programme appliqué</summary><p>Scénario {latest.scenarioId} · branche {latest.branchId}</p>
          {/* Hypotheses, conditions and limits stay three named readings of the sealed trace, never one merged list. */}
          {([['Hypothèses', latest.assumptions], ['Conditions', latest.conditions], ['Limites', latest.limits ?? []]] as const)
            .map(([label, lines]) => lines.length ? <div key={label}><p><strong>{label} · {lines.length}</strong></p>
              <ul>{lines.map((line, index) => <li key={index}>{hopV55TraceLine(line, traceNames)}</li>)}</ul></div> : null)}
          <details><summary>Références exactes</summary>
            {[...latest.assumptions, ...latest.conditions, ...(latest.limits ?? [])].map((line, index) => <p key={index}><code>{line}</code></p>)}
          </details>
        </details></> : null}
      {applications.unreadable.length ? <p role="status">{applications.unreadable.length} trace{applications.unreadable.length > 1 ? 's' : ''} V5.5 de cette recette {applications.unreadable.length > 1 ? 'sont conservées' : 'est conservée'} telle{applications.unreadable.length > 1 ? 's' : ''} quelle{applications.unreadable.length > 1 ? 's' : ''}, en lecture seule (format futur ou illisible).</p> : null}
    </div>
    {services ? <HopV55Page key={`${ownerKey}:${draftId}`} services={services} recipeDraftTarget={target}
      recipeDraftReference={recipeDraftReference} onWorkspaceSelected={onWorkspaceSelected}
      onConfirmScenario={confirmScenario} semanticAdviceUnavailableReason={semanticAdviceUnavailableReason}
      semanticAdoptionHost={semanticCycle.wizardAvailable ? semanticCycle.applicationHost : undefined}
      semanticHistoryHost={semanticCycle.applicationHost}
      onOpenSemanticCompanion={semanticCycle.wizardAvailable ? session => {
        // The creator opens only its Wizard lane; a classic session would address a saved Recipe of the same ID.
        if (session.format !== 'hop-v55-semantic-assisted-session-wizard-v1') {
          throw new Error('Ce brouillon s’ouvre uniquement dans son dossier assisté; aucune recette enregistrée ne le remplace.');
        }
        openSemanticCompanion(session); setCompanion(undefined);
      } : undefined}
      onOpenCompanion={localOnly ? undefined : (question, context) => { closeSemantic(); setCompanion({ question, context }); }} />
      : servicesError ? <div role="alert" className="recipe-hop-v55-closed">
        <p>{servicesError}</p>
        <button type="button" onClick={() => setAttempt(value => value + 1)}>Réessayer d’ouvrir le dossier local</button>
      </div>
        : <p role="status">Ouverture du dossier local V5.5…</p>}
    {services && ownerKey ? <HopV55RecipeColdContactWorkbench services={services} ownerKey={ownerKey} draftId={draftId}
      recipe={recipe} workspaceId={workspaceId} readRecipe={readActiveRecipe}
      onConserve={onConserveColdEvidence ? conserveColdEvidence : undefined} /> : null}
    {companion ? <BrewerChat scope={{ kind: 'draft', id: draftId }} label={companion.context.recipe?.name || 'Recette en cours d’écriture'}
      draft={companion.context.recipe} phase={companion.context.phase} editableTargets={[]} initialOpen
      initialQuestion={companion.question} hideLauncher onClose={() => setCompanion(undefined)} /> : null}
    {semanticCycle.companion}
  </div>;
}
