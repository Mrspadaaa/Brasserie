import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { BrewerContext, BrewerScope } from '../../../functions/src/companionTypes';
import { hopAdviceV1ClientPartitionKey } from '../../../functions/src/brewerHopAdviceTransportV1';
import { mapBrewerHopAdviceWizardSourceToScopeV1 } from '../../../functions/src/brewerHopAdviceWizardSourceV1';
import type { HopV55AssistedCompanionSession } from './assistedAdviceUiContracts';
import { HopV55SemanticAdviceCapabilityContext, hopV55SemanticWizardLaneDeclared } from './assistedAdviceUiContracts';
import type { HopV55SemanticAdviceCapabilityV3, HopV55SemanticCompanionRuntimeV3,
  HopV55SemanticCompanionRuntimeWizardV1, HopV55SemanticCompanionSessionAnyV1, HopV55SemanticCompanionSessionV3,
  HopV55SemanticCompanionSessionWizardV1, HopV55SemanticRuntimeFactoryWizardV1 } from './assistedAdviceUiContracts';
import type { Batch, BrewDayState, Recipe } from '../../types';
import { StorageService } from '../../services/storage';
import { createHopV55Services } from '../../services/hopV55/runtime';
import type { HopV55ContextSource, HopV55Services } from '../../services/hopV55/contracts';
import { FirebaseAuthService } from '../../services/firebaseAuth';
import { createHopV55SemanticAdoptionApplicationHostForServicesV1 } from '../../services/hopV55/semanticAdoptionApplicationHost';
import type { HopV55SemanticAdoptionApplicationHostFactoryOptionsV1, HopV55SemanticAdoptionApplicationHostV1,
  HopV55SemanticShareAuthorityRequestV1, HopV55SemanticWorkspaceAuthorityV1 } from '../../services/hopV55/semanticAdoptionApplicationHost';
import { hopAdviceSemanticV3ClientPartitionKey, hopAdviceWizardClientPartitionKey } from '../../services/brewerHopAdviceRuntime';
import { createBrewerHopAdviceApiRuntimeWizardV1 } from '../../services/brewerHopAdviceRuntimeAdapter';
import type { BrewerHopAdviceApiForWizardV1 } from '../../services/brewerHopAdviceApi';
import { saveRecipeConfirmed } from '../../services/recipeSave';
import { PageShell } from '../../pages/PageShell';
import { BrewerChat, type BrewerChatAssistedRuntime } from '../BrewerChat';
import { HopV55Page } from './Page';
import { createHopV55ScenarioConfirmer } from '../../services/hopV55/serverScenario';

type HopV55HostCompanion =
  | { kind: 'standard'; question: string; context: BrewerContext }
  | { kind: 'assisted'; session: HopV55AssistedCompanionSession; runtime: HopV55HostAssistedRuntime };

export type HopV55HostAssistedRuntime = BrewerChatAssistedRuntime & {
  dispose?: () => void | Promise<void>;
};

export interface HopV55AssistedRuntimeFactoryInput {
  ownerKey: string;
  scope: BrewerScope;
}

export type HopV55AssistedRuntimeFactory = (input: HopV55AssistedRuntimeFactoryInput) => HopV55HostAssistedRuntime;

export type HopV55HostSemanticRuntimeV3 = HopV55SemanticCompanionRuntimeV3 & { dispose?: () => void | Promise<void> };
export type HopV55HostSemanticRuntimeWizardV1 = HopV55SemanticCompanionRuntimeWizardV1 & { dispose?: () => void | Promise<void> };
export type { HopV55SemanticAdviceCapabilityV3 } from './assistedAdviceUiContracts';

/**
 * Explicit Wizard factory over the received API adapter. It consumes a provider that the caller already
 * qualified (fixture or authorized Request3) and its API builder; it never selects a transport by itself.
 * The generation is read from the conversation of the exact Wizard draft scope.
 */
export function createHopV55SemanticWizardRuntimeFactoryFromApiV1(input: {
  providerKind: HopV55SemanticCompanionRuntimeWizardV1['providerKind'];
  apiForOwner(ownerKey: string): BrewerHopAdviceApiForWizardV1;
}): HopV55SemanticRuntimeFactoryWizardV1 {
  if (input.providerKind !== 'fixture' && input.providerKind !== 'authorizedRequest3') {
    throw new Error('La voie brouillon exige un fournisseur déclaré : fixture ou Request3 autorisé.');
  }
  return request => {
    if (request.providerKind !== input.providerKind) throw new Error('Le fournisseur demandé diffère de celui de cette fabrique.');
    if (request.scope.kind !== 'draft') throw new Error('La voie brouillon n’ouvre qu’un périmètre de brouillon.');
    const api = input.apiForOwner(request.ownerKey);
    const draftScope = { kind: 'draft' as const, id: request.scope.id };
    return createBrewerHopAdviceApiRuntimeWizardV1({ ownerKey: request.ownerKey, workspaceId: request.workspaceId,
      scope: draftScope, providerKind: input.providerKind, api,
      readGeneration: async scope => {
        if (scope.kind !== 'draft' || scope.id !== draftScope.id) throw new Error('La génération demandée vise un autre brouillon.');
        const read = await api.history({ scope: draftScope });
        if (read.status !== 'available') {
          throw new Error(read.status === 'unsupportedReadOnly'
            ? 'L’historique de ce brouillon est conservé sans interprétation; aucune génération n’est déduite.' : read.reason);
        }
        if (!Number.isSafeInteger(read.value.generation) || read.value.generation < 0) {
          throw new Error('La conversation de ce brouillon ne donne pas de génération valide.');
        }
        return read.value.generation;
      } });
  };
}

const isQualifiedAssistedRuntime = (runtime: HopV55HostAssistedRuntime | undefined, expectedPartitionKey: string):
  runtime is HopV55HostAssistedRuntime => runtime?.mode === 'hopAdviceReadonlyV1'
    && typeof runtime.storeNamespace === 'string' && runtime.storeNamespace === expectedPartitionKey;

function disposeAssistedRuntime(runtime: HopV55HostAssistedRuntime): void {
  if (typeof runtime.dispose !== 'function') return;
  try { void Promise.resolve(runtime.dispose()).catch(() => {}); }
  catch { /* Disposal is best effort; it never cancels a server job. */ }
}

function disposeIfNotCached(runtime: HopV55HostAssistedRuntime, cache: ReadonlyMap<string, HopV55HostAssistedRuntime>): void {
  if ([...cache.values()].includes(runtime)) return;
  disposeAssistedRuntime(runtime);
}

function disposeSemanticRuntime(runtime: { dispose?: () => void | Promise<void> }): void {
  try { void Promise.resolve(runtime.dispose?.()).catch(() => {}); } catch { /* best effort */ }
}

type HopV55SemanticCompanionState =
  | { kind: 'classic'; session: HopV55SemanticCompanionSessionV3; runtime: HopV55HostSemanticRuntimeV3 }
  | { kind: 'wizard'; session: HopV55SemanticCompanionSessionWizardV1; runtime: HopV55HostSemanticRuntimeWizardV1 };

export interface HopV55SemanticCompanionCycleInputV1 {
  ownerKey: string;
  /** Services of the mounted workshop: Host's Recipe loader, or RecipeStep's services built on its draftRef. */
  services: HopV55Services | undefined;
  capability: HopV55SemanticAdviceCapabilityV3;
  resolveVerifiedShare?: (input: HopV55SemanticShareAuthorityRequestV1) => Promise<HopV55SemanticWorkspaceAuthorityV1 | null>;
  /** Recipe creator only: rereads the live unsaved draft after every await; absence keeps the Wizard lane closed. */
  readCurrentWizardContext?: HopV55SemanticAdoptionApplicationHostFactoryOptionsV1['readCurrentWizardContext'];
}

export interface HopV55SemanticCompanionCycleV1 {
  applicationHost: HopV55SemanticAdoptionApplicationHostV1 | undefined;
  /** Classic Request3/V6 lane over an archived Recipe/Batch/exploration source. */
  classicAvailable: boolean;
  /** Wizard lane: provider factory declared and live draft reader supplied by the creator. */
  wizardAvailable: boolean;
  /** Throws a brewer-readable reason when the actor, source or provider no longer qualifies the session. */
  open(session: HopV55SemanticCompanionSessionAnyV1): void;
  close(): void;
  companion: React.ReactNode;
}

/**
 * One companion cycle shared by the Host and the recipe creator's hop step: application host, actor checks,
 * runtime cache per exact partition, disposal and the same BrewerChat. Each lane keeps its own runtime type.
 */
export function useHopV55SemanticCompanionCycleV1(input: HopV55SemanticCompanionCycleInputV1): HopV55SemanticCompanionCycleV1 {
  const { ownerKey, services, capability } = input;
  const ownerKeyRef = useRef(ownerKey); ownerKeyRef.current = ownerKey;
  const capabilityRef = useRef(capability); capabilityRef.current = capability;
  const shareResolverRef = useRef(input.resolveVerifiedShare); shareResolverRef.current = input.resolveVerifiedShare;
  const wizardReaderRef = useRef(input.readCurrentWizardContext); wizardReaderRef.current = input.readCurrentWizardContext;
  const hasWizardReader = typeof input.readCurrentWizardContext === 'function';
  const [companion, setCompanion] = useState<HopV55SemanticCompanionState>();
  const classicCacheRef = useRef(new Map<string, HopV55HostSemanticRuntimeV3>());
  const wizardCacheRef = useRef(new Map<string, HopV55HostSemanticRuntimeWizardV1>());
  const applicationHost = useMemo<HopV55SemanticAdoptionApplicationHostV1 | undefined>(() => {
    if (!services || services.ownerKey !== ownerKey) return undefined;
    return createHopV55SemanticAdoptionApplicationHostForServicesV1({
      services,
      readActor: () => {
        const user = FirebaseAuthService.getCurrentUser();
        return user ? { uid: user.uid, displayName: user.displayName } : null;
      },
      resolveVerifiedShare: request => shareResolverRef.current
        ? shareResolverRef.current(request) : Promise.resolve(null),
      ...(hasWizardReader ? { readCurrentWizardContext: (request: Parameters<NonNullable<HopV55SemanticCompanionCycleInputV1['readCurrentWizardContext']>>[0]) => {
        const read = wizardReaderRef.current;
        if (!read) return Promise.reject(new Error('Le brouillon vivant n’est plus lisible ici; aucune recette enregistrée ne le remplace.'));
        return read(request);
      } } : {}),
      now: () => new Date().toISOString(),
      makeId: (kind, operationId) => `semantic-${kind}:${operationId ?? crypto.randomUUID()}`,
    });
  }, [services, ownerKey, hasWizardReader]);
  const classicAvailable = capability.kind !== 'unavailable'
    && typeof capability.createRuntimeForScope === 'function' && !!applicationHost;
  const wizardAvailable = classicAvailable && hasWizardReader && hopV55SemanticWizardLaneDeclared(capability);

  const disposeClassic = useCallback(() => {
    const runtimes = [...new Set(classicCacheRef.current.values())];
    classicCacheRef.current.clear();
    runtimes.forEach(disposeSemanticRuntime);
  }, []);
  const disposeWizard = useCallback(() => {
    const runtimes = [...new Set(wizardCacheRef.current.values())];
    wizardCacheRef.current.clear();
    runtimes.forEach(disposeSemanticRuntime);
  }, []);
  useEffect(() => {
    if (classicAvailable) return;
    setCompanion(current => current?.kind === 'classic' ? undefined : current);
    disposeClassic();
  }, [classicAvailable, disposeClassic]);
  useEffect(() => {
    if (wizardAvailable) return;
    setCompanion(current => current?.kind === 'wizard' ? undefined : current);
    disposeWizard();
  }, [wizardAvailable, disposeWizard]);
  useEffect(() => () => { disposeClassic(); disposeWizard(); }, [disposeClassic, disposeWizard]);

  const openClassic = useCallback((session: HopV55SemanticCompanionSessionV3) => {
    const activeOwnerKey = ownerKeyRef.current;
    const current = capabilityRef.current;
    const currentUser = FirebaseAuthService.getCurrentUser();
    if (!applicationHost || current.kind === 'unavailable'
      || !currentUser || currentUser.uid !== session.openedByPrincipalId
      || session.ownerKey !== activeOwnerKey || session.request.contextLaunch.ownerKey !== activeOwnerKey
      || session.workspaceId !== session.request.contextLaunch.workspaceId
      || session.scope.kind !== session.request.contextLaunch.scope.kind || session.scope.id !== session.request.contextLaunch.scope.id) {
      throw new Error('Le profil, la source ou le compagnon assisté n’est plus disponible. Aucune session n’a été ouverte.');
    }
    let partitionKey: string;
    try { partitionKey = hopAdviceSemanticV3ClientPartitionKey(activeOwnerKey, session.workspaceId, session.scope); }
    catch { throw new Error('Le périmètre de cette lecture ne permet pas d’ouvrir son compagnon assisté.'); }
    let runtime = classicCacheRef.current.get(partitionKey);
    const expectedProvider = current.kind;
    if (runtime && !isQualifiedSemanticRuntimeV3(runtime, partitionKey, activeOwnerKey, session.workspaceId,
      session.scope, expectedProvider)) {
      classicCacheRef.current.delete(partitionKey);
      disposeSemanticRuntime(runtime);
      throw new Error('Le compagnon conservé ne correspond plus au fournisseur, au profil, au dossier ou au périmètre de cette lecture.');
    }
    if (!runtime) {
      try { runtime = current.createRuntimeForScope({ ownerKey: activeOwnerKey, workspaceId: session.workspaceId,
        scope: session.scope, providerKind: expectedProvider }); }
      catch (cause) { throw new Error(cause instanceof Error ? cause.message : 'Le compagnon assisté n’a pas pu s’ouvrir.'); }
      if (!isQualifiedSemanticRuntimeV3(runtime, partitionKey, activeOwnerKey, session.workspaceId,
        session.scope, expectedProvider)) {
        disposeSemanticRuntime(runtime);
        throw new Error('Le fournisseur n’a pas fourni un compagnon compatible avec cette lecture.');
      }
      classicCacheRef.current.set(partitionKey, runtime);
    }
    setCompanion({ kind: 'classic', session, runtime });
  }, [applicationHost]);

  const openWizard = useCallback((session: HopV55SemanticCompanionSessionWizardV1) => {
    const activeOwnerKey = ownerKeyRef.current;
    const current = capabilityRef.current;
    const currentUser = FirebaseAuthService.getCurrentUser();
    const launch = session.request.contextLaunch;
    const createWizardRuntime = current.kind === 'unavailable' ? undefined : current.createWizardRuntimeForScope;
    if (!applicationHost || !wizardReaderRef.current || current.kind === 'unavailable'
      || typeof createWizardRuntime !== 'function'
      || !currentUser || currentUser.uid !== session.openedByPrincipalId
      || session.ownerKey !== activeOwnerKey || launch.ownerKey !== activeOwnerKey
      || session.workspaceId !== launch.workspaceId || session.scope.kind !== 'draft'
      || launch.scope.kind !== session.scope.kind || launch.scope.id !== session.scope.id) {
      throw new Error('Le profil, le brouillon ou le compagnon assisté n’est plus disponible. Aucune session n’a été ouverte.');
    }
    let partitionKey: string;
    try {
      // The draft scope derives from the durable Wizard origin, never from a title, UID or recipe ID.
      const originScope = mapBrewerHopAdviceWizardSourceToScopeV1(launch.source);
      if (originScope.id !== session.scope.id) throw new Error('scope');
      partitionKey = hopAdviceWizardClientPartitionKey(activeOwnerKey, session.workspaceId, session.scope);
    } catch { throw new Error('Le périmètre de ce brouillon ne correspond plus à son origine; aucun compagnon n’est ouvert.'); }
    let runtime = wizardCacheRef.current.get(partitionKey);
    const expectedProvider = current.kind;
    if (runtime && !isQualifiedSemanticRuntimeWizardV1(runtime, partitionKey, activeOwnerKey, session.workspaceId,
      session.scope, expectedProvider)) {
      wizardCacheRef.current.delete(partitionKey);
      disposeSemanticRuntime(runtime);
      throw new Error('Le compagnon conservé ne correspond plus au fournisseur, au profil, au dossier ou au brouillon de cette lecture.');
    }
    if (!runtime) {
      try { runtime = createWizardRuntime({ ownerKey: activeOwnerKey, workspaceId: session.workspaceId,
        scope: session.scope, providerKind: expectedProvider }); }
      catch (cause) { throw new Error(cause instanceof Error ? cause.message : 'Le compagnon assisté du brouillon n’a pas pu s’ouvrir.'); }
      if (!isQualifiedSemanticRuntimeWizardV1(runtime, partitionKey, activeOwnerKey, session.workspaceId,
        session.scope, expectedProvider)) {
        disposeSemanticRuntime(runtime);
        throw new Error('Le fournisseur n’a pas fourni un compagnon compatible avec ce brouillon.');
      }
      wizardCacheRef.current.set(partitionKey, runtime);
    }
    setCompanion({ kind: 'wizard', session, runtime });
  }, [applicationHost]);

  const open = useCallback((session: HopV55SemanticCompanionSessionAnyV1) => {
    switch (session.format) {
      case 'hop-v55-semantic-assisted-session-v3': openClassic(session); return;
      case 'hop-v55-semantic-assisted-session-wizard-v1': openWizard(session); return;
    }
  }, [openClassic, openWizard]);
  const close = useCallback(() => setCompanion(undefined), []);
  const closeExpected = useCallback((expected: HopV55SemanticCompanionState) => {
    setCompanion(current => current === expected ? undefined : current);
  }, []);

  const element = companion?.kind === 'classic' && classicAvailable ? <BrewerChat
    key={`${companion.session.scope.kind}:${companion.session.scope.id}:${companion.session.id}`}
    protocol="hopAdviceRequest3"
    scope={companion.session.scope}
    label={companion.session.context?.recipe?.name ?? 'Lecture assistée'}
    draft={companion.session.context?.recipe}
    localJournal={companion.session.context?.journal}
    phase={companion.session.context?.phase}
    editableTargets={[]}
    initialOpen initialQuestion={companion.session.request.question}
    semanticSession={companion.session} semanticRuntime={companion.runtime}
    hideLauncher onClose={() => closeExpected(companion)} />
    : companion?.kind === 'wizard' && wizardAvailable ? <BrewerChat
      key={`${companion.session.scope.kind}:${companion.session.scope.id}:${companion.session.id}`}
      protocol="hopAdviceWizardRequest3V1"
      scope={companion.session.scope}
      label={companion.session.context?.recipe?.name || 'Brouillon en cours d’écriture'}
      draft={companion.session.snapshot.recipe}
      phase={companion.session.context?.phase}
      editableTargets={[]}
      initialOpen initialQuestion={companion.session.request.question}
      wizardSession={companion.session} wizardRuntime={companion.runtime}
      hideLauncher onClose={() => closeExpected(companion)} /> : null;

  return { applicationHost, classicAvailable, wizardAvailable, open, close, companion: element };
}

/** Only the host knows the active authenticated identity and application storage. */
export function HopV55Host({ ownerKey, recipe, batch, journal, onClose, onOpenRecipe, writeError, onDismissWriteError,
  hopAdviceTransportQualified = false, createAssistedRuntimeForScope, semanticAdviceCapability: explicitSemanticCapability,
  resolveVerifiedSemanticShareAuthority }: {
  ownerKey: string; recipe?: Recipe; batch?: Batch; journal?: BrewDayState;
  onClose(): void; onOpenRecipe?(recipe: Recipe): void;
  writeError?: string | null; onDismissWriteError?(): void;
  /** Parent capability gate; true only when the injected transport supports qualified hop advice. */
  hopAdviceTransportQualified?: boolean;
  /** Creates the isolated readonly transport for this owner's exact source partition. */
  createAssistedRuntimeForScope?: HopV55AssistedRuntimeFactory;
  /**
   * V3 provider must be explicitly fixture or independently qualified; auth UID is not this capability.
   * An explicit value (local QA bench) overrides the App context, which itself defaults to unavailable.
   */
  semanticAdviceCapability?: HopV55SemanticAdviceCapabilityV3;
  /** Optional application-owned grant resolver; absence/refusal keeps V3 owner-only. */
  resolveVerifiedSemanticShareAuthority?: (input: HopV55SemanticShareAuthorityRequestV1) => Promise<HopV55SemanticWorkspaceAuthorityV1 | null>;
}) {
  const props = useRef({ recipe, batch, journal }); props.current = { recipe, batch, journal };
  const inheritedSemanticCapability = useContext(HopV55SemanticAdviceCapabilityContext);
  const semanticAdviceCapability = explicitSemanticCapability ?? inheritedSemanticCapability;
  const [services, setServices] = useState<HopV55Services>();
  const [companion, setCompanion] = useState<HopV55HostCompanion>();
  const qualifiedTransportRef = useRef(hopAdviceTransportQualified);
  qualifiedTransportRef.current = hopAdviceTransportQualified;
  const ownerKeyRef = useRef(ownerKey);
  ownerKeyRef.current = ownerKey;
  const runtimeFactoryRef = useRef(createAssistedRuntimeForScope);
  runtimeFactoryRef.current = createAssistedRuntimeForScope;
  const runtimeCacheRef = useRef(new Map<string, HopV55HostAssistedRuntime>());
  const assistedRuntimeAvailable = hopAdviceTransportQualified && typeof createAssistedRuntimeForScope === 'function';
  // The Host reads saved Recipes/Batches only; it supplies no Wizard reader, so its Wizard lane stays closed.
  const semanticCycle = useHopV55SemanticCompanionCycleV1({ ownerKey, services, capability: semanticAdviceCapability,
    resolveVerifiedShare: resolveVerifiedSemanticShareAuthority });
  const semanticRuntimeAvailable = semanticCycle.classicAvailable;
  const closeSemantic = semanticCycle.close;
  const disposeRuntimeCache = useCallback(() => {
    const runtimes = [...new Set(runtimeCacheRef.current.values())];
    runtimeCacheRef.current.clear();
    runtimes.forEach(disposeAssistedRuntime);
  }, []);
  const openAssistedCompanion = useCallback((session: HopV55AssistedCompanionSession) => {
    const factory = runtimeFactoryRef.current;
    const activeOwnerKey = ownerKeyRef.current;
    if (!qualifiedTransportRef.current || !factory || session.request.contextLaunch.ownerKey !== activeOwnerKey) return;
    const scope = session.request.contextLaunch.scope;
    let partitionKey: string;
    try { partitionKey = hopAdviceV1ClientPartitionKey(activeOwnerKey, scope); }
    catch { return; }
    let runtime = runtimeCacheRef.current.get(partitionKey);
    if (runtime && !isQualifiedAssistedRuntime(runtime, partitionKey)) {
      runtimeCacheRef.current.delete(partitionKey);
      disposeIfNotCached(runtime, runtimeCacheRef.current);
      return;
    }
    if (!runtime) {
      try { runtime = factory({ ownerKey: activeOwnerKey, scope }); }
      catch { return; }
      if (!isQualifiedAssistedRuntime(runtime, partitionKey)) {
        if (runtime) disposeIfNotCached(runtime, runtimeCacheRef.current);
        return;
      }
      runtimeCacheRef.current.set(partitionKey, runtime);
    }
    closeSemantic();
    setCompanion({ kind: 'assisted', session, runtime });
  }, [closeSemantic]);
  const openSemanticCompanion = useCallback((session: HopV55SemanticCompanionSessionAnyV1) => {
    semanticCycle.open(session);
    setCompanion(undefined);
  }, [semanticCycle.open]);
  const openPageAssistedCompanion = useCallback((session: HopV55AssistedCompanionSession | HopV55SemanticCompanionSessionV3) => {
    if ('onBeforeSend' in session) {
      if (assistedRuntimeAvailable) { openAssistedCompanion(session); return; }
      throw new Error('Cette ouverture du compagnon ne correspond pas à la lecture assistée sélectionnée.');
    }
    openSemanticCompanion(session);
  }, [assistedRuntimeAvailable, openAssistedCompanion, openSemanticCompanion]);
  const closeCompanion = useCallback((expected: HopV55HostCompanion) => {
    setCompanion(current => current === expected ? undefined : current);
  }, []);
  const confirmScenario = useMemo(() => createHopV55ScenarioConfirmer(), [ownerKey]);
  useEffect(() => {
    if (assistedRuntimeAvailable) return;
    setCompanion(current => current?.kind === 'assisted' ? undefined : current);
    disposeRuntimeCache();
  }, [assistedRuntimeAvailable, disposeRuntimeCache]);
  useEffect(() => () => disposeRuntimeCache(), [disposeRuntimeCache]);
  useEffect(() => {
    const service = createHopV55Services({ ownerKey, context: async (source?: HopV55ContextSource) => {
      const current = props.current;
      const recipes = StorageService.getRecipes();
      const batches = StorageService.getBatches();
      let contextRecipe: BrewerContext['recipe'];
      let contextBatch: Batch | undefined;
      let contextJournal: BrewDayState | undefined;
      let phase: string;
      let provenance: string[];
      if (!source) {
        // Backward-compatible active entry for first open and callers that did
        // not request a workspace source explicitly.
        const activeRecipe = current.recipe ? recipes.find(row => row.id === current.recipe!.id) ?? current.recipe : undefined;
        contextBatch = current.batch ? batches.find(row => row.id === current.batch!.id) ?? current.batch : undefined;
        contextRecipe = contextBatch ? contextBatch.recipeSnapshot : activeRecipe;
        contextJournal = current.journal ?? contextBatch?.brewDay;
        phase = contextBatch?.status ?? 'Avant brassage';
        provenance = ['Contexte de l’entrée active; un workspace sans source ne doit pas réutiliser cette entrée.'];
      } else if (source.kind === 'recipe') {
        const exactRecipe = recipes.find(row => row.id === source.recipeId);
        if (!exactRecipe) throw new Error(`Recette source « ${source.recipeId} » indisponible dans le stockage local; aucune recette active n’est substituée.`);
        contextRecipe = exactRecipe;
        phase = 'Recette source explicitement choisie';
        provenance = [`Recette source exacte résolue par ID : ${source.recipeId}. Aucun brassin ni journal d’une autre entrée n’est repris.`];
      } else if (source.kind === 'batch') {
        const exactBatch = batches.find(row => row.id === source.batchId);
        if (!exactBatch) throw new Error(`Brassin source « ${source.batchId} » indisponible dans le stockage local; aucun brassin actif n’est substitué.`);
        if (!exactBatch.recipeSnapshot) throw new Error(`Snapshot recette absent du brassin « ${source.batchId} »; aucune recette courante n’est substituée.`);
        contextBatch = exactBatch;
        contextRecipe = exactBatch.recipeSnapshot;
        contextJournal = current.batch?.id === exactBatch.id ? current.journal ?? current.batch.brewDay : exactBatch.brewDay;
        phase = exactBatch.status;
        provenance = [`Brassin source exact résolu par ID : ${source.batchId}; snapshot recette et journal associés à ce brassin.`];
      } else {
        contextRecipe = undefined;
        phase = 'Exploration sans recette ni brassin source';
        provenance = ['Exploration explicitement ouverte sans recette ni brassin actif.'];
      }
      return {
        recipe: contextRecipe,
        batch: contextBatch, journal: contextJournal,
        hopIndex: { varieties: StorageService.getHopVarieties(), lots: StorageService.getHopLots(), knowledge: StorageService.getHopKnowledge(), predictions: [], tastings: [], truncated: [] },
        inventory: StorageService.getStocks().rawMaterials,
        stockReservations: { complete: false, batches: batches.map(row => ({ ...row, stockConsumption: row.stockConsumption ?? null })), source: 'localCache' },
        material: [], waterSources: [], now: Date.now(), phase, provenance,
        editableTargets: [],
      };
    } });
    setServices(service);
    return () => service.close();
  }, [ownerKey, recipe?.id, batch?.id]);
  return <PageShell title="Atelier Houblons V5.5" onClose={onClose} wide className="hop-v55-shell">
    {writeError ? <div role="alert" className="hv-host-write-error"><p>{writeError}</p>
      {onDismissWriteError ? <button onClick={onDismissWriteError}>Fermer ce message</button> : null}</div> : null}
    {services ? <HopV55Page key={`${ownerKey}:${recipe?.id ?? batch?.id ?? 'explore'}`} services={services} onClose={onClose} hostWriteError={writeError}
      onSaveRecipeCopy={saveRecipeConfirmed} onOpenRecipe={onOpenRecipe} onConfirmScenario={confirmScenario}
      onOpenCompanion={(question, context) => { closeSemantic(); setCompanion({ kind: 'standard', question, context }); }}
      onOpenAssistedCompanion={assistedRuntimeAvailable || semanticRuntimeAvailable ? openPageAssistedCompanion : undefined}
      semanticAdoptionHost={semanticRuntimeAvailable ? semanticCycle.applicationHost : undefined}
      semanticHistoryHost={semanticCycle.applicationHost}
      onOpenSemanticCompanion={semanticRuntimeAvailable ? openSemanticCompanion : undefined}
      semanticAdviceUnavailableReason={semanticAdviceCapability.kind === 'unavailable' ? semanticAdviceCapability.reason : undefined} />
      : <p role="status">Ouverture du dossier local…</p>}
    {companion?.kind === 'standard' ? <BrewerChat scope={batch ? { kind: 'batch', id: batch.id } : recipe ? { kind: 'recipe', id: recipe.id } : { kind: 'draft', id: `hop-v55-${ownerKey}` }}
      label={companion.context.recipe?.name ?? 'Exploration Houblons'} draft={companion.context.recipe}
      localJournal={companion.context.journal} phase={companion.context.phase} editableTargets={[]} initialOpen initialQuestion={companion.question}
      hideLauncher onClose={() => closeCompanion(companion)} /> : null}
    {companion?.kind === 'assisted' && assistedRuntimeAvailable ? <BrewerChat
      key={`${companion.session.request.contextLaunch.scope.kind}:${companion.session.request.contextLaunch.scope.id}:${companion.session.id}`}
      scope={companion.session.request.contextLaunch.scope}
      label={companion.session.label}
      draft={companion.session.context.recipe}
      localJournal={companion.session.context.journal}
      phase={companion.session.context.phase}
      editableTargets={[]}
      initialOpen
      assistedAdvice={{ id: companion.session.id, request: companion.session.request, onBeforeSend: companion.session.onBeforeSend,
        onAssistedTurn: companion.session.onAssistedTurn }}
      assistedRuntime={companion.runtime}
      hideLauncher onClose={() => closeCompanion(companion)} /> : null}
    {semanticCycle.companion}
  </PageShell>;
}

function isQualifiedSemanticRuntimeV3(runtime: HopV55HostSemanticRuntimeV3 | undefined, expectedPartition: string,
  ownerKey: string, workspaceId: string, scope: BrewerScope, providerKind: Exclude<HopV55SemanticAdviceCapabilityV3['kind'], 'unavailable'>):
  boolean {
  return !!runtime && runtime.format === 'hop-v55-semantic-companion-runtime-v3'
    && runtime.protocol === 'hopAdviceRequest3' && runtime.providerKind === providerKind
    && runtime.storeNamespace === expectedPartition && runtime.ownerKey === ownerKey
    && runtime.workspaceId === workspaceId && runtime.scope.kind === scope.kind && runtime.scope.id === scope.id
    && runtime.jobs.kind === 'hopAdviceRequest3' && runtime.jobs.providerKind === providerKind;
}

function isQualifiedSemanticRuntimeWizardV1(runtime: HopV55HostSemanticRuntimeWizardV1 | undefined, expectedPartition: string,
  ownerKey: string, workspaceId: string, scope: BrewerScope, providerKind: Exclude<HopV55SemanticAdviceCapabilityV3['kind'], 'unavailable'>):
  boolean {
  return !!runtime && runtime.format === 'hop-v55-semantic-companion-runtime-wizard-v1'
    && runtime.protocol === 'hopAdviceWizardRequest3V1' && runtime.providerKind === providerKind
    && runtime.storeNamespace === expectedPartition && runtime.ownerKey === ownerKey
    && runtime.workspaceId === workspaceId && runtime.scope.kind === scope.kind && runtime.scope.id === scope.id
    && runtime.jobs.kind === 'hopAdviceWizardRequest3V1' && runtime.jobs.providerKind === providerKind
    && runtime.jobs.storeNamespace === expectedPartition && typeof runtime.readGeneration === 'function';
}
