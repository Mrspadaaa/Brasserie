import type { BrewerContext } from '../../../functions/src/companionTypes';
import type { Recipe } from '../../types';
import { loadBrewingCatalogueReferences } from '../../domain/brewingCatalogueReferences';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import { BrewingCatalogue } from '../brewingCatalogue';
import { createBrewingScenarioLocalRepository } from '../brewingScenarioLocalRepository';
import { createHopDecisionLocalRepository } from '../hopDecisionLocalRepository';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter } from './workspaceRepository';
import { readHopV55FutureRecipeDraft } from './futureRecipeDraft';
import { createHopV55AssistedAdviceBackendContractV1, createHopV55AssistedAdviceWorkspaceClient } from './assistedAdviceWorkspace';
import type { HopV55CatalogueClient, HopV55ContextSource, HopV55LocalFutureDraftSource,
  HopV55LocalRecipeCopySource, HopV55Services } from './contracts';

export interface CreateHopV55ServicesOptions {
  /** Explicit local account/profile partition. It makes no claim about auth. */
  ownerKey: string;
  context: BrewerContext | ((source?: HopV55ContextSource) => Promise<BrewerContext>);
  /** Shared naming prefix for the local scenario and workspace Dexie databases. */
  databasePrefix?: string;
  /** @internal Deterministic test seam; production uses the isolated Dexie workspace. */
  workspaceDatabase?: HopV55WorkspaceDatabaseAdapter;
}

function requireStablePart(value: string, label: string): string {
  if (typeof value !== 'string' || !value.trim() || value.trim() !== value || value.length > 96
    || /[\\/\u0000-\u001f]/.test(value)) throw new Error(`${label} explicite et normalisé requis.`);
  return value;
}

function catalogueRevision(value: { catalogueMeta?: { revision?: number } }): number {
  return Number.isSafeInteger(value.catalogueMeta?.revision) ? value.catalogueMeta!.revision! : 0;
}

function mergeCanonicalById<T extends { id: string; catalogueMeta?: { revision?: number; fingerprint?: string } }>(
  initial: readonly T[], additions: readonly T[], preferEqualRevision: boolean,
): T[] {
  const byId = new Map<string, T>(initial.map(row => [row.id, structuredClone(row)]));
  for (const incoming of additions) {
    const existing = byId.get(incoming.id);
    if (!existing || catalogueRevision(incoming) > catalogueRevision(existing)
      || preferEqualRevision && catalogueRevision(incoming) === catalogueRevision(existing)) {
      byId.set(incoming.id, structuredClone(incoming));
    }
  }
  return [...byId.values()];
}

function recordKind(record: { kind?: string; aliases?: unknown }): 'variety' | 'knowledge' {
  return Array.isArray(record.aliases) ? 'variety' : 'knowledge';
}

function assertContextSource(source: HopV55ContextSource | undefined): void {
  if (source === undefined) return;
  if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('Source V5.5 explicite invalide.');
  if (source.kind === 'exploration') {
    if (Object.keys(source).length !== 1) throw new Error('Source d’exploration V5.5 ambiguë.');
    return;
  }
  if (source.kind === 'localFutureDraft') {
    if (Object.keys(source).length !== 5 || typeof source.workspaceId !== 'string' || !source.workspaceId.trim()
      || typeof source.draftId !== 'string' || !source.draftId.trim() || !Number.isSafeInteger(source.revision)
      || source.revision < 1 || typeof source.contentReference !== 'string' || !source.contentReference.trim()) {
      throw new Error('Référence locale du brouillon futur invalide.');
    }
    return;
  }
  if (source.kind === 'localRecipeCopy') {
    if (Object.keys(source).length !== 5 || typeof source.workspaceId !== 'string' || !source.workspaceId.trim()
      || typeof source.copyId !== 'string' || !source.copyId.trim() || typeof source.recipeId !== 'string' || !source.recipeId.trim()
      || typeof source.recipeReference !== 'string' || !source.recipeReference.trim()) {
      throw new Error('Référence exacte de copie locale invalide.');
    }
    return;
  }
  const id = source.kind === 'recipe' ? source.recipeId : source.kind === 'batch' ? source.batchId : undefined;
  if (typeof id !== 'string' || !id.trim() || id.trim() !== id || id.length > 160 || id.includes('/')) {
    throw new Error('Identifiant explicite de source V5.5 invalide.');
  }
  if (Object.keys(source).length !== 2) throw new Error('Source V5.5 ambiguë; indique seulement un ID de recette ou de brassin.');
}

function resolveContextSource(context: BrewerContext, source: HopV55ContextSource | undefined, hasRecipeOverride: boolean): BrewerContext {
  const copy = structuredClone(context);
  if (!source) return copy;
  if (source.kind === 'localFutureDraft') {
    throw new Error('Un brouillon futur ne se transforme pas en recette source; charge sa base hypothétique dédiée.');
  }
  if (source.kind === 'localRecipeCopy') {
    throw new Error('Une copie locale proposée ne se résout pas comme recette Storage; charge sa version conservée exacte.');
  }
  if (source.kind === 'exploration') {
    const sourceTokens = [copy.recipe?.id, copy.recipe?.name, copy.batch?.id, copy.batch?.name, copy.batch?.recipeRef]
      .filter((value): value is string => typeof value === 'string' && value.length >= 4)
      .map(value => value.toLocaleLowerCase());
    delete copy.recipe; delete copy.batch; delete copy.journal; delete copy.localJournal;
    delete copy.workspace; delete copy.editableTargets;
    copy.phase = 'Exploration sans source recette ni brassin';
    copy.provenance = [...copy.provenance.filter(line => !sourceTokens.some(token => line.toLocaleLowerCase().includes(token))),
      'Source d’exploration explicitement sélectionnée; aucune recette, aucun brassin et aucun journal actif ne sont repris.'];
    return copy;
  }
  if (source.kind === 'recipe') {
    if (copy.recipe?.id !== source.recipeId) {
      throw new Error(`Recette source « ${source.recipeId} » indisponible dans le contexte résolu; aucune autre recette n’est substituée.`);
    }
    if (copy.batch && hasRecipeOverride && copy.batch.status !== 'planifie') {
      throw new Error('La recette copiée ne peut pas remplacer un brassin déjà commencé; aucun plan futur n’est appliqué à son journal.');
    }
    delete copy.batch; delete copy.journal; delete copy.localJournal;
    copy.provenance = [...copy.provenance, `Source recette exacte : ${source.recipeId}.`];
    return copy;
  }
  if (copy.batch?.id !== source.batchId) {
    throw new Error(`Brassin source « ${source.batchId} » indisponible dans le contexte résolu; aucun autre brassin n’est substitué.`);
  }
  if (!copy.batch.recipeSnapshot || typeof copy.batch.recipeSnapshot !== 'object') {
    throw new Error(`Snapshot recette absent du brassin source « ${source.batchId} »; aucun plan actif n’est substitué.`);
  }
  copy.recipe = structuredClone(copy.batch.recipeSnapshot);
  copy.provenance = [...copy.provenance, `Source brassin exacte : ${source.batchId}; la recette provient de son snapshot.`];
  return copy;
}

async function mergeCatalogueContext(
  context: BrewerContext,
  recipe?: Recipe,
  canonicalOverlay: readonly ({ id: string; kind?: string; aliases?: unknown; catalogueMeta?: { revision?: number; fingerprint?: string } })[] = [],
): Promise<BrewerContext> {
  const [copy, references] = [structuredClone(context), await loadBrewingCatalogueReferences()];
  if (recipe) {
    if (copy.batch && copy.batch.status !== 'planifie') {
      throw new Error('Le brassin est déjà commencé; le chargement d’une copie ne remplace pas sa recette ni son snapshot.');
    }
    copy.recipe = structuredClone(recipe);
  }
  const currentIndex = copy.hopIndex;
  const currentVarieties = currentIndex?.varieties ?? [];
  const currentKnowledge = currentIndex?.knowledge ?? [];
  const contextVarieties = mergeCanonicalById(references.varieties, currentVarieties, true);
  const contextKnowledge = mergeCanonicalById(references.knowledge, currentKnowledge, true);
  const overlayVarieties = canonicalOverlay.filter(row => recordKind(row) === 'variety') as typeof references.varieties;
  const overlayKnowledge = canonicalOverlay.filter(row => recordKind(row) === 'knowledge') as typeof references.knowledge;
  copy.hopIndex = {
    varieties: mergeCanonicalById(contextVarieties, overlayVarieties, true),
    lots: structuredClone(currentIndex?.lots ?? []),
    knowledge: mergeCanonicalById(contextKnowledge, overlayKnowledge, true),
    predictions: structuredClone(currentIndex?.predictions ?? []),
    tastings: structuredClone(currentIndex?.tastings ?? []),
    truncated: structuredClone(currentIndex?.truncated ?? []),
  };
  return copy;
}

/** Local, offline workspace and scenario persistence. Catalogue writes still
 * use the exact server callable adapter; nothing is queued or synchronized. */
export function createHopV55Services(options: CreateHopV55ServicesOptions): HopV55Services {
  const ownerKey = requireStablePart(options.ownerKey, 'ownerKey');
  const databasePrefix = requireStablePart(options.databasePrefix ?? 'laffinee-hop-v55-local', 'databasePrefix');
  const contextSource = options.context;
  const canonicalOverlay = new Map<string, { id: string; kind?: string; aliases?: unknown; catalogueMeta?: { revision?: number; fingerprint?: string } }>();
  const remember = (record: unknown) => {
    if (!record || typeof record !== 'object' || typeof (record as { id?: unknown }).id !== 'string') return;
    const next = structuredClone(record) as { id: string; kind?: string; aliases?: unknown; catalogueMeta?: { revision?: number; fingerprint?: string } };
    const key = `${recordKind(next)}\0${next.id}`;
    const prior = canonicalOverlay.get(key);
    if (!prior || catalogueRevision(next) >= catalogueRevision(prior)) canonicalOverlay.set(key, next);
  };
  const scenarios = createBrewingScenarioLocalRepository({ databaseName: `${databasePrefix}-scenarios-v1` });
  const qualifiedStudies = createHopDecisionLocalRepository();
  const assistedAdviceContract = createHopV55AssistedAdviceBackendContractV1();
  const workspaces = createHopV55WorkspaceRepository({ ownerKey,
    databaseName: `${databasePrefix}-workspaces-v1`, database: options.workspaceDatabase, assistedAdviceContract });
  const assistedAdvice = createHopV55AssistedAdviceWorkspaceClient({ ownerKey, workspaces, contract: assistedAdviceContract });
  const catalogue: HopV55CatalogueClient = {
    scope: 'server',
    async lookup(kind, query) {
      const result = await BrewingCatalogue.lookup(kind, query);
      for (const row of result.records) if (row.origin === 'persisted') remember(row.record);
      return result;
    },
    async write(command) {
      const result = await BrewingCatalogue.write(command);
      if (result.status === 'applied' || result.status === 'duplicate') remember(result.record);
      return { ...result, scope: 'server' };
    },
  };

  const loadFutureDraft = async (source: HopV55LocalFutureDraftSource) => {
    if (!source || source.kind !== 'localFutureDraft' || typeof source.workspaceId !== 'string'
      || source.workspaceId.trim() !== source.workspaceId || typeof source.draftId !== 'string'
      || source.draftId.trim() !== source.draftId || !Number.isSafeInteger(source.revision) || source.revision < 1
      || typeof source.contentReference !== 'string' || source.contentReference.trim() !== source.contentReference) {
      throw new Error('Source exacte de brouillon futur invalide.');
    }
    const workspace = await workspaces.read(ownerKey, source.workspaceId);
    if (!workspace || workspace.id !== source.workspaceId || workspace.ownerKey !== ownerKey) {
      throw new Error(`Workspace du brouillon futur « ${source.workspaceId} » indisponible pour cet owner.`);
    }
    const raw = workspace.futureDrafts?.find(row => row.draftId === source.draftId
      && row.revision === source.revision && row.contentReference === source.contentReference);
    const read = raw && readHopV55FutureRecipeDraft(raw);
    if (!read || read.status !== 'available') throw new Error('La révision exacte du brouillon futur est absente ou illisible.');
    return structuredClone(read.draft);
  };
  const loadLocalRecipeCopy = async (source: HopV55LocalRecipeCopySource) => {
    if (!source || source.kind !== 'localRecipeCopy' || typeof source.workspaceId !== 'string'
      || source.workspaceId.trim() !== source.workspaceId || typeof source.copyId !== 'string'
      || source.copyId.trim() !== source.copyId || typeof source.recipeId !== 'string'
      || source.recipeId.trim() !== source.recipeId || typeof source.recipeReference !== 'string'
      || source.recipeReference.trim() !== source.recipeReference) {
      throw new Error('Source exacte de copie locale invalide.');
    }
    const workspace = await workspaces.read(ownerKey, source.workspaceId);
    if (!workspace || workspace.id !== source.workspaceId || workspace.ownerKey !== ownerKey) {
      throw new Error(`Workspace de la copie locale « ${source.workspaceId} » indisponible pour cet owner.`);
    }
    const copy = workspace.copies.find(row => row.id === source.copyId && row.recipe.id === source.recipeId);
    if (!copy || hopDecisionReference(copy.recipe) !== source.recipeReference) {
      throw new Error('La copie de recette exacte est absente ou son contenu ne correspond plus à sa référence.');
    }
    return structuredClone(copy);
  };

  return {
    scope: 'local', ownerKey, catalogue, scenarios, qualifiedStudies, workspaces, assistedAdvice,
    loadFutureDraft,
    async loadContext(recipe, source) {
      assertContextSource(source);
      if (source?.kind === 'localFutureDraft') {
        if (recipe) throw new Error('Une copie Recipe ne peut pas remplacer un brouillon futur non matérialisé.');
        const draft = await loadFutureDraft(source);
        const loaded = typeof contextSource === 'function' ? await contextSource({ kind: 'exploration' }) : contextSource;
        if (!loaded || typeof loaded !== 'object') throw new Error('Le contexte d’exploration du brasseur est indisponible.');
        const resolved = resolveContextSource(loaded, { kind: 'exploration' }, false);
        resolved.phase = 'Exploration d’un brouillon futur hypothétique';
        resolved.provenance = [...resolved.provenance,
          `Brouillon futur exact ${draft.draftId} · révision ${draft.revision}; sa base est hypothétique et ne crée aucune recette physique.`];
        return mergeCatalogueContext(resolved, undefined, [...canonicalOverlay.values()]);
      }
      if (source?.kind === 'localRecipeCopy') {
        const copy = await loadLocalRecipeCopy(source);
        if (recipe && (recipe.id !== copy.recipe.id || hopDecisionReference(recipe) !== source.recipeReference)) {
          throw new Error('La Recipe fournie ne correspond pas exactement au corps de copie conservé.');
        }
        const loaded = typeof contextSource === 'function' ? await contextSource({ kind: 'exploration' }) : contextSource;
        if (!loaded || typeof loaded !== 'object') throw new Error('Le contexte d’exploration du brasseur est indisponible.');
        const resolved = resolveContextSource(loaded, { kind: 'exploration' }, false);
        resolved.recipe = structuredClone(copy.recipe);
        resolved.phase = 'Planification d’une copie locale proposée';
        resolved.provenance = [...resolved.provenance,
          `Copie locale exacte ${copy.id} · recette ${copy.recipe.id}; proposée à partir du scénario conservé, sans reprendre recette ni journal de l’hôte.`];
        return mergeCatalogueContext(resolved, undefined, [...canonicalOverlay.values()]);
      }
      if (source?.kind === 'exploration' && recipe) {
        throw new Error('Une recette détachée exige une source recette explicite; l’exploration reste sans bière source.');
      }
      const loaded = typeof contextSource === 'function' ? await contextSource(source) : contextSource;
      if (!loaded || typeof loaded !== 'object') throw new Error('Le contexte du brasseur est indisponible.');
      const resolved = resolveContextSource(loaded, source, recipe !== undefined);
      return mergeCatalogueContext(resolved, recipe, [...canonicalOverlay.values()]);
    },
    close() { scenarios.close(); qualifiedStudies.close(); workspaces.close(); },
  };
}

export type { HopV55Services } from './contracts';
