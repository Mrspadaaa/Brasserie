import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BrewerContext, BrewerScope } from '../../../functions/src/companionTypes';
import { hopAdviceV1ClientPartitionKey } from '../../../functions/src/brewerHopAdviceTransportV1';
import type { HopV55AssistedCompanionSession } from './assistedAdviceUiContracts';
import type { Batch, BrewDayState, Recipe } from '../../types';
import { StorageService } from '../../services/storage';
import { createHopV55Services } from '../../services/hopV55/runtime';
import type { HopV55ContextSource, HopV55Services } from '../../services/hopV55/contracts';
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

/** Only the host knows the active authenticated identity and application storage. */
export function HopV55Host({ ownerKey, recipe, batch, journal, onClose, onOpenRecipe, writeError, onDismissWriteError,
  hopAdviceTransportQualified = false, createAssistedRuntimeForScope }: {
  ownerKey: string; recipe?: Recipe; batch?: Batch; journal?: BrewDayState;
  onClose(): void; onOpenRecipe?(recipe: Recipe): void;
  writeError?: string | null; onDismissWriteError?(): void;
  /** Parent capability gate; true only when the injected transport supports qualified hop advice. */
  hopAdviceTransportQualified?: boolean;
  /** Creates the isolated readonly transport for this owner's exact source partition. */
  createAssistedRuntimeForScope?: HopV55AssistedRuntimeFactory;
}) {
  const props = useRef({ recipe, batch, journal }); props.current = { recipe, batch, journal };
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
    setCompanion({ kind: 'assisted', session, runtime });
  }, []);
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
      onOpenCompanion={(question, context) => setCompanion({ kind: 'standard', question, context })}
      onOpenAssistedCompanion={assistedRuntimeAvailable ? openAssistedCompanion : undefined} /> : <p role="status">Ouverture du dossier local…</p>}
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
  </PageShell>;
}
