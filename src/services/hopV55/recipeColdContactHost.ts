import type { BrewerContext } from '../../../functions/src/companionTypes';
import type { HopColdBeerContext } from '../../domain/hopDecision/coldIbuContact';
import { coldContactBeerContextReference, coldContactQualificationReference } from '../../domain/hopDecision/coldContactEvidence';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import * as brewingScenarioContext from '../../domain/brewingScenarioContext';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { BrewingScenarioBranchResult } from '../../domain/brewingScenario';
import type { HopAssembledCatalogueInput, HopCatalogueAssembly } from '../../domain/hopDecision/catalogueLoader';
import { loadHopCatalogueQualificationInput, type HopCatalogueLoaderInput } from '../../domain/hopDecision/catalogueLoader';
import { hopCatalogueRecordKey, type HopCatalogueVariant } from '../../domain/hopDecision/catalogueQualification';
import type { HopDecisionMaterial, HopDecisionProgram } from '../../domain/hopDecision/types';
import { programFingerprint } from '../../domain/hopDecision/programs';
import type { BrewingScenarioRecordRead } from '../../domain/brewingScenarioDossier';
import type { HopV55Services, HopV55Workspace } from './contracts';
import {
  prepareHopV55QualifiedColdContactEvidence,
  type HopV55QualifiedColdContactEvidenceResultV1,
} from './qualifiedColdContactEvidence';

export interface HopV55RecipeColdContactFrameV1<TScope = unknown> {
  ownerKey: string;
  scope: TScope;
  scopeReference: string;
  /** Host generation changes when the active source context is replaced. */
  generation: number | string;
  context: BrewerContext;
  /** Explicit null means that the host has no attested cold-beer context. */
  coldContext: HopColdBeerContext | null;
}

export interface HopV55RecipeColdContactSourceV1 {
  key: string;
  reference: string;
  kind: 'currentProgram' | 'selectedScenarioBranch';
  label: string;
  scopeReference: string;
  programReference: string;
  program: HopDecisionProgram;
  materials: Array<Pick<HopDecisionMaterial, 'id' | 'name' | 'form'>>;
  contextReference: string;
  coldContext: HopColdBeerContext | null;
  /** Exact source coordinates; no recipe or scenario is inferred from its label. */
  scenario?: { workspaceId: string; scenarioId: string; snapshotReference: string; branchId: string; branchReference: string };
}

export type HopV55RecipeColdContactSourceReadV1 =
  | { status: 'ready'; generation: number | string; sources: HopV55RecipeColdContactSourceV1[]; notices: string[] }
  | { status: 'unavailable'; reason: string };

export type HopV55RecipeColdContactPrepareResultV1 =
  | { status: 'refused'; reason: string; code: 'staleSource' | 'unavailable' | 'invalidInput' }
  | { status: 'prepared'; source: HopV55RecipeColdContactSourceV1; result: HopV55QualifiedColdContactEvidenceResultV1 };

export type HopV55RecipeColdContactEvidenceReadyV1 = {
  status: 'prepared';
  source: HopV55RecipeColdContactSourceV1;
  result: Extract<HopV55QualifiedColdContactEvidenceResultV1, { status: 'ready' }>;
};

export interface HopV55RecipeColdContactHostV1<TScope = unknown> {
  readSources(): Promise<HopV55RecipeColdContactSourceReadV1>;
  prepare(input: {
    sourceKey: string;
    sourceReference: string;
    generation: number | string;
    additionIds: string[];
    groupingReason: string;
  }): Promise<HopV55RecipeColdContactPrepareResultV1>;
}

export interface HopV55ColdCatalogueClosureV1 {
  input: HopAssembledCatalogueInput;
  includedVariantIds: string[];
  selectedMaterialIds: string[];
  sourceVariantCount: number;
}

type HostFrame<TScope> = HopV55RecipeColdContactFrameV1<TScope>;
type InternalSource = HopV55RecipeColdContactSourceV1 & { frame: HostFrame<unknown>; workspaceReference: string };
type StableHostState<TScope> = { frame: HostFrame<TScope>; prepared: PreparedBrewingScenarioContext; catalogueInput: HopCatalogueLoaderInput;
  workspace: HopV55Workspace | null; reference: string; frameReference: string };
type StableStateResult<TScope> = { status: 'ready'; state: StableHostState<TScope> }
  | { status: 'unavailable' | 'staleSource'; reason: string };
type InternalSourceReadResult<TScope> =
  | { status: 'ready'; generation: number | string; state: StableHostState<TScope>; sources: InternalSource[]; notices: string[] }
  | { status: 'unavailable'; reason: string };

const clone = <T,>(value: T): T => structuredClone(value);
const nonempty = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.trim() === value;
const validGeneration = (value: unknown): value is number | string =>
  (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0)
  || (typeof value === 'string' && !!value.trim() && value.trim() === value);

function currentSourceSnapshot<TScope>(frame: HostFrame<TScope>, catalogueInput: HopCatalogueLoaderInput,
  prepared: PreparedBrewingScenarioContext): {
  prepared: PreparedBrewingScenarioContext; current: NonNullable<PreparedBrewingScenarioContext['runtime']['current']> | null;
  frameReference: string; catalogueReference: string; contextReference: string;
} {
  if (!frame || !nonempty(frame.ownerKey) || !nonempty(frame.scopeReference) || !validGeneration(frame.generation)
    || !frame.context || !Object.prototype.hasOwnProperty.call(frame, 'coldContext')
    || frame.coldContext !== null && (typeof frame.coldContext !== 'object' || Array.isArray(frame.coldContext))) {
    throw new Error('Le cadre de contact doit fournir le profil, la portée, la génération et un contexte froid attesté ou null explicite.');
  }
  const current = prepared.runtime.current ?? null;
  const programReference = current?.program ? programFingerprint(current.program) : null;
  const catalogueReference = hopAdviceContentReference('hop-v55-cold-catalogue-caller-input-v1', catalogueInput);
  const contextReference = coldContactBeerContextReference(frame.coldContext);
  const frameReference = hopAdviceContentReference('hop-v55-cold-contact-frame-v1', {
    ownerKey: frame.ownerKey, scope: frame.scope, scopeReference: frame.scopeReference, generation: frame.generation,
    runtime: current ? { recipeReference: current.recipeReference, inputReference: current.inputReference,
      stockAvailabilityReference: current.stockAvailabilityReference ?? null, programReference } : null,
    catalogueReference, contextReference,
  });
  return { prepared, current, frameReference, catalogueReference, contextReference };
}

function workspaceStateReference(workspace: HopV55Workspace | null): string {
  return hopAdviceContentReference('hop-v55-cold-contact-workspace-selection-v1', workspace ? {
    ownerKey: workspace.ownerKey, id: workspace.id, revision: workspace.revision, activeScenarioId: workspace.activeScenarioId ?? null,
    scenarioIds: [...workspace.scenarioIds], selected: workspace.selected ?? null,
    sourceRecipeId: workspace.sourceRecipeId ?? null, sourceBatchId: workspace.sourceBatchId ?? null,
  } : null);
}

function stateReference<TScope>(frameReference: string, workspace: HopV55Workspace | null): string {
  return hopAdviceContentReference('hop-v55-cold-contact-host-state-v1', { frameReference, workspaceReference: workspaceStateReference(workspace) });
}

function frameReadReference<TScope>(frame: HostFrame<TScope>): string {
  // A new read time is not a source change. Its effects on prepared inputs, stock,
  // programme and catalogue are still compared through currentSourceSnapshot below.
  const { now: _readTime, ...context } = frame.context;
  return hopAdviceContentReference('hop-v55-cold-frame-read-stability-v1', { ...frame, context });
}

function same(valueA: unknown, valueB: unknown, prefix: string): boolean {
  try { return hopAdviceContentReference(prefix, valueA) === hopAdviceContentReference(prefix, valueB); }
  catch { return false; }
}

/** JSON has no undefined value. Omit only undefined object properties, and verify
 * the canonical programme fingerprint is unchanged before it reaches the wire. */
function omitUndefinedObjectProperties(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(item => {
    if (item === undefined) throw new Error('Le programme contient une entrée tableau absente; elle ne peut pas être omise sans changer son ordre.');
    return omitUndefinedObjectProperties(item);
  });
  if (!value || typeof value !== 'object') return value;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new Error('Le programme contient une valeur non JSON.');
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([, child]) => child !== undefined)
    .map(([key, child]) => [key, omitUndefinedObjectProperties(child)]));
}

function assignmentVariantsFor<TScope>(input: {
  frame: HostFrame<TScope>; prepared: PreparedBrewingScenarioContext; program: HopDecisionProgram; scopeReference: string;
}): HopCatalogueVariant[] {
  const selectedIds = new Set(input.program.additions.map(row => row.materialId));
  return input.prepared.runtime.materials.filter(material => selectedIds.has(material.id)).flatMap(material => {
    const canonicalId = material.lot ? `lot:${material.lot.id}`
      : material.variety ? `variety:${material.variety.id}`
        : material.product ? `product:${material.product.id}` : null;
    // Canonical raw catalogue IDs already resolve directly through the loader.
    if (!material.id || canonicalId === material.id) return [];
    const materialReference = hopAdviceContentReference('hop-v55-cold-contact-program-material-assignment-v1', {
      ownerKey: input.frame.ownerKey, scope: input.frame.scope, scopeReference: input.scopeReference,
      generation: input.frame.generation, programReference: programFingerprint(input.program),
      materialId: material.id, material,
    });
    const wireMaterial = omitUndefinedObjectProperties(material) as HopDecisionMaterial;
    if (hopAdviceContentReference('hop-v55-cold-assignment-material-json-v1', wireMaterial)
      !== hopAdviceContentReference('hop-v55-cold-assignment-material-json-v1', material)) {
      throw new Error('La projection JSON de la matière assignée ne conserve pas sa référence canonique.');
    }
    return [{
      variantId: `hop-catalogue-assignment-v1:${materialReference}`,
      scope: 'assignment' as const, recordId: material.id, origin: { kind: 'assignment' as const },
      material: wireMaterial,
    }];
  });
}

function loaderInputFor<TScope>(input: {
  frame: HostFrame<TScope>; prepared: PreparedBrewingScenarioContext; program: HopDecisionProgram;
  catalogueInput: HopCatalogueLoaderInput;
}): HopCatalogueLoaderInput {
  const base = input.catalogueInput;
  const assignments = assignmentVariantsFor({ frame: input.frame, prepared: input.prepared, program: input.program,
    scopeReference: input.frame.scopeReference });
  return assignments.length ? { ...base, additionalVariants: [...(base.additionalVariants ?? []), ...assignments] } : base;
}

function sourceReference<TScope>(input: {
  kind: HopV55RecipeColdContactSourceV1['kind']; frameReference: string; workspaceReference: string;
  programReference: string; scenario?: HopV55RecipeColdContactSourceV1['scenario'];
}): string {
  return hopAdviceContentReference('hop-v55-cold-contact-source-v1', {
    kind: input.kind, frameReference: input.frameReference, workspaceReference: input.workspaceReference,
    programReference: input.programReference, scenario: input.scenario ?? null,
  });
}

function buildCurrentSource<TScope>(state: StableHostState<TScope>): InternalSource | null {
  const { frame } = state;
  const prepared = state.prepared;
  const runtimeCurrent = prepared.runtime.current;
  const program = runtimeCurrent?.program;
  if (!runtimeCurrent || !program) return null;
  const programReference = programFingerprint(program);
  const materialIds = new Set(program.additions.map(row => row.materialId));
  const materials = prepared.runtime.materials.filter(row => materialIds.has(row.id))
    .map(({ id, name, form }) => ({ id, name, form }));
  const reference = sourceReference({ kind: 'currentProgram', frameReference: state.frameReference,
    workspaceReference: workspaceStateReference(state.workspace), programReference });
  return {
    key: `current:${reference}`, reference, kind: 'currentProgram',
    label: frame.context.recipe?.name ? `Programme courant · ${frame.context.recipe.name}` : 'Programme courant · recette/journal',
    scopeReference: frame.scopeReference, programReference, program: clone(program), materials: clone(materials), contextReference: coldContactBeerContextReference(frame.coldContext),
    coldContext: clone(frame.coldContext), frame: frame as HostFrame<unknown>, workspaceReference: workspaceStateReference(state.workspace),
  };
}

function branchRows(record: BrewingScenarioRecordRead['snapshots'][number]['result']): BrewingScenarioBranchResult[] {
  return [record.baseline, ...record.branches];
}

async function selectedScenarioSource<TScope>(input: {
  state: StableHostState<TScope>;
  services: Pick<HopV55Services, 'ownerKey' | 'scenarios'>;
}): Promise<{ source: InternalSource | null; notice?: string }> {
  const { state, services } = input;
  const workspace = state.workspace;
  const selected = workspace?.selected;
  if (!workspace || !selected) return { source: null };
  if (workspace.ownerKey !== state.frame.ownerKey || services.ownerKey !== state.frame.ownerKey
    || workspace.id.trim() !== workspace.id || !workspace.scenarioIds.includes(selected.scenarioId)) {
    return { source: null, notice: 'La branche choisie dans la comparaison ne correspond pas au profil ou à l’espace de travail courant; aucune branche ne sera lue.' };
  }
  let loaded: Awaited<ReturnType<HopV55Services['scenarios']['read']>>;
  try { loaded = await services.scenarios.read(state.frame.ownerKey, selected.scenarioId); }
  catch { return { source: null, notice: 'La comparaison choisie ne peut pas être relue localement.' }; }
  if (!loaded) return { source: null, notice: 'La comparaison choisie est absente du dépôt local.' };
  if (loaded.status !== 'available') return { source: null, notice: 'La comparaison choisie est dans un format futur; sa branche reste en lecture seule.' };
  const record = loaded.record;
  if (record.dossier.ownerKey !== state.frame.ownerKey || record.dossier.scenarioId !== selected.scenarioId) {
    return { source: null, notice: 'La comparaison relue porte une autre identité de profil ou de scénario.' };
  }
  const snapshot = record.snapshots.find(row => row.reference === selected.snapshotReference);
  if (!snapshot || snapshot.result.scenarioId !== selected.scenarioId) {
    return { source: null, notice: 'L’instantané exact de la comparaison choisie est absent du dossier relu.' };
  }
  const branch = branchRows(snapshot.result).find(row => row.id === selected.branchId);
  if (!branch || branch.reference !== selected.branchReference || !branch.program
    || !Array.isArray(branch.program.additions)) {
    return { source: null, notice: 'La branche choisie dans la comparaison n’a pas de programme vérifiable; aucune autre branche ne sera substituée.' };
  }
  const programReference = programFingerprint(branch.program);
  const runtimeMaterials = state.prepared.runtime.materials;
  const branchMaterialIds = new Set(branch.program.additions.map(row => row.materialId));
  const materials = runtimeMaterials.filter(row => branchMaterialIds.has(row.id)).map(({ id, name, form }) => ({ id, name, form }));
  const scenario = { workspaceId: workspace.id, scenarioId: selected.scenarioId, snapshotReference: selected.snapshotReference,
    branchId: selected.branchId, branchReference: selected.branchReference };
  const reference = sourceReference({ kind: 'selectedScenarioBranch', frameReference: state.frameReference,
    workspaceReference: workspaceStateReference(workspace), programReference, scenario });
  const branchNature = branch.applicability === 'hypotheticalOnly' ? 'Branche hypothétique sélectionnée' : 'Branche choisie dans la comparaison';
  return { source: {
    key: `scenario:${reference}`, reference, kind: 'selectedScenarioBranch',
    label: `${branchNature} · ${branch.label}`, programReference, program: clone(branch.program),
    scopeReference: state.frame.scopeReference, materials: clone(materials),
    contextReference: coldContactBeerContextReference(state.frame.coldContext), coldContext: clone(state.frame.coldContext),
    scenario, frame: state.frame as HostFrame<unknown>, workspaceReference: workspaceStateReference(workspace),
  } };
}

/** Returns a deterministic, lossless dependency closure for selected programme materials. */
export function projectHopV55ColdCatalogueClosure(input: HopAssembledCatalogueInput, selectedMaterialIds: readonly string[]): HopV55ColdCatalogueClosureV1 {
  if (!Array.isArray(input?.variants) || !input.assembly || input.assembly.version !== 'hop-catalogue-assembly-v1') {
    throw new Error('L’entrée de qualification complète et sa provenance d’assemblage sont requises.');
  }
  const selected = [...new Set(selectedMaterialIds)];
  if (!selected.length || selected.some(id => !nonempty(id)) || selected.length !== selectedMaterialIds.length) {
    throw new Error('Choisis au moins une matière avec des IDs distincts du programme.');
  }
  const allById = new Map(input.variants.map(row => [row.variantId, row]));
  const included = new Set<string>();
  const addVariant = (id: string) => { if (allById.has(id)) included.add(id); };
  const selectedMaterialSet = new Set(selected);
  for (const row of input.variants) if (selectedMaterialSet.has(row.material.id)) included.add(row.variantId);

  const recordKeyOf = (row: HopCatalogueVariant) => hopCatalogueRecordKey(row.scope, row.recordId);
  const variantsByRecord = new Map<string, HopCatalogueVariant[]>();
  for (const row of input.variants) {
    const key = recordKeyOf(row);
    variantsByRecord.set(key, [...(variantsByRecord.get(key) ?? []), row]);
  }
  const addRecordKey = (key: string) => { for (const row of variantsByRecord.get(key) ?? []) addVariant(row.variantId); };
  const parseVarietyRecordKey = (value: string): string | null => {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) && parsed.length === 2 && parsed[0] === 'variety' && nonempty(parsed[1])
        ? hopCatalogueRecordKey('variety', parsed[1]) : null;
    } catch { return null; }
  };

  // Collision-preserving closure: same record versions are indivisible evidence.
  let changed = true;
  while (changed) {
    const before = included.size;
    for (const id of [...included]) {
      const row = allById.get(id);
      if (row) {
        addRecordKey(recordKeyOf(row));
        // A programme assignment carries the exact linked lot/variety IDs from
        // its prepared material. Follow those IDs, then retain every raw version.
        if (row.scope === 'assignment') {
          if (row.material.lot?.id) addRecordKey(hopCatalogueRecordKey('lot', row.material.lot.id));
          if (row.material.variety?.id) addRecordKey(hopCatalogueRecordKey('variety', row.material.variety.id));
          if (row.material.product?.id) addRecordKey(hopCatalogueRecordKey('product', row.material.product.id));
        }
      }
    }
    // Preserve an explicit version pointer even if it is invalid for that group; the
    // qualifier must see the same conflict rather than a silently repaired subset.
    const includedKeys = new Set([...included].flatMap(id => { const row = allById.get(id); return row ? [recordKeyOf(row)] : []; }));
    for (const key of includedKeys) {
      const selectedVersion = input.selectedVariantByRecord?.[key];
      if (selectedVersion) addVariant(selectedVersion);
    }
    for (const link of input.assembly.links) {
      if (!included.has(link.lotVariantId)) continue;
      for (const id of link.varietyVariantIds) addVariant(id);
      const varietyKey = parseVarietyRecordKey(link.varietyRecordKey);
      if (varietyKey) addRecordKey(varietyKey);
    }
    const includedMaterialIds = new Set([...included].flatMap(id => {
      const row = allById.get(id); return row ? [row.material.id] : [];
    }));
    // Unresolved links are still dependencies: they preserve a collision or missing
    // variety as an explicit notice, without selecting a representative for the lot.
    for (const notice of input.assembly.notices) {
      if (!includedMaterialIds.has(notice.materialId)) continue;
      const varietyKey = parseVarietyRecordKey(notice.relatedRecordKey);
      if (varietyKey) addRecordKey(varietyKey);
    }
    for (const binding of input.assembly.evidenceBindings) {
      const target = allById.get(binding.toVariantId);
      // Evidence copied onto a selected lot depends on its exact variety source;
      // reverse traversal from a selected variety would pull in unrelated lots.
      if (included.has(binding.toVariantId) && target?.scope === 'lot') addVariant(binding.fromVariantId);
    }
    changed = included.size !== before;
  }

  const includedVariantIds = input.variants.filter(row => included.has(row.variantId)).map(row => row.variantId);
  const includedKeySet = new Set(includedVariantIds);
  const includedRows = input.variants.filter(row => includedKeySet.has(row.variantId));
  const recordKeys = new Set(includedRows.map(recordKeyOf));
  const basisEvidence = (input.basisEvidence ?? []).filter(row => includedKeySet.has(row.variantId));
  const selectedVariantByRecord = input.selectedVariantByRecord
    ? Object.fromEntries(Object.entries(input.selectedVariantByRecord).filter(([key]) => recordKeys.has(key))) : undefined;
  const includedIds = new Set(includedRows.map(row => row.material.id));
  const links = input.assembly.links.filter(row => includedKeySet.has(row.lotVariantId)).map(row => clone(row));
  const evidenceBindings = input.assembly.evidenceBindings.filter(row => includedKeySet.has(row.toVariantId)
    && includedKeySet.has(row.fromVariantId)).map(row => clone(row));
  const notices = input.assembly.notices.filter(row => includedIds.has(row.materialId)).map(row => clone(row));
  const sourceForOrigin = (row: HopCatalogueVariant): string | null => {
    if (row.origin.kind === 'saved') return 'saved:caller';
    if (row.origin.kind === 'seed') return row.origin.packPath === 'src/domain/hopDecision/products.ts'
      ? 'seed:commercial-products' : row.origin.packPath ? `seed:${row.origin.packPath}` : null;
    if (row.origin.kind === 'assignment' || row.origin.kind === 'backupImport') return 'provided:complete-materials';
    return null;
  };
  const sources: HopCatalogueAssembly['sources'] = input.assembly.sources.flatMap(source => {
    if (!includedRows.some(row => sourceForOrigin(row) === source.key)) return [];
    const rows = includedRows.filter(row => sourceForOrigin(row) === source.key);
    const counts = { varieties: rows.filter(row => row.scope === 'variety').length,
      lots: rows.filter(row => row.scope === 'lot').length, products: rows.filter(row => row.scope === 'product').length,
      assignments: rows.filter(row => row.scope === 'assignment').length };
    return [{ ...clone(source), ...counts }];
  });
  const assembly: HopCatalogueAssembly = {
    version: input.assembly.version,
    sources,
    links,
    evidenceBindings,
    notices,
    limitations: [...input.assembly.limitations],
  };
  const closureInput: HopAssembledCatalogueInput = {
    variants: includedRows.map(row => clone(row)),
    basisEvidence: basisEvidence.map(row => clone(row)),
    ...(selectedVariantByRecord ? { selectedVariantByRecord: clone(selectedVariantByRecord) } : {}),
    assembly,
  };
  return { input: closureInput, includedVariantIds, selectedMaterialIds: selected, sourceVariantCount: input.variants.length };
}

/** Host-owned source resolver; it reads only the current frame and exact selected local J5 branch. */
export function createHopV55RecipeColdContactHost<TScope>(input: {
  services: Pick<HopV55Services, 'ownerKey' | 'scenarios'>;
  getFrame(): Promise<HopV55RecipeColdContactFrameV1<TScope> | null>;
  getWorkspace(): Promise<HopV55Workspace | null>;
  catalogueInput(context: BrewerContext): HopCatalogueLoaderInput;
}): HopV55RecipeColdContactHostV1<TScope> {
  const readStableState = async (): Promise<StableStateResult<TScope>> => {
    try {
      const frameBefore = await input.getFrame();
      if (!frameBefore) return { status: 'unavailable', reason: 'Le cadre courant de recette ou de brassin est absent.' };
      const workspaceBefore = await input.getWorkspace();
      const frameAfter = await input.getFrame();
      const workspaceAfter = await input.getWorkspace();
      if (!frameAfter || frameReadReference(frameBefore) !== frameReadReference(frameAfter)
        || workspaceStateReference(workspaceBefore) !== workspaceStateReference(workspaceAfter)) {
        return { status: 'staleSource', reason: 'Le profil, la portée ou la sélection locale a changé pendant la relecture.' };
      }
      if (input.services.ownerKey !== frameAfter.ownerKey
        || workspaceAfter && (workspaceAfter.ownerKey !== frameAfter.ownerKey || workspaceAfter.id.trim() !== workspaceAfter.id)) {
        return { status: 'unavailable', reason: 'La source, le workspace et le profil actif ne partagent pas une identité exacte.' };
      }
      const preparedBefore = brewingScenarioContext.prepareBrewingScenarioContext(frameBefore.context);
      const baseCatalogueInputBefore = input.catalogueInput(frameBefore.context);
      const programBefore = preparedBefore.runtime.current?.program;
      const catalogueInputBefore = programBefore ? loaderInputFor({ frame: frameBefore, prepared: preparedBefore,
        program: programBefore, catalogueInput: baseCatalogueInputBefore }) : baseCatalogueInputBefore;
      const snapshotBefore = currentSourceSnapshot(frameBefore, catalogueInputBefore, preparedBefore);

      const preparedAfter = brewingScenarioContext.prepareBrewingScenarioContext(frameAfter.context);
      const baseCatalogueInputAfter = input.catalogueInput(frameAfter.context);
      const programAfter = preparedAfter.runtime.current?.program;
      const catalogueInputAfter = programAfter ? loaderInputFor({ frame: frameAfter, prepared: preparedAfter,
        program: programAfter, catalogueInput: baseCatalogueInputAfter }) : baseCatalogueInputAfter;
      const snapshotAfter = currentSourceSnapshot(frameAfter, catalogueInputAfter, preparedAfter);
      if (snapshotBefore.frameReference !== snapshotAfter.frameReference) {
        return { status: 'staleSource', reason: 'Les données métier ont changé pendant la relecture du contact.' };
      }
      return { status: 'ready', state: { frame: frameAfter, prepared: preparedAfter,
        catalogueInput: baseCatalogueInputAfter, workspace: workspaceAfter,
        frameReference: snapshotAfter.frameReference,
        reference: stateReference(snapshotAfter.frameReference, workspaceAfter) } };
    } catch (error) {
      return { status: 'unavailable', reason: error instanceof Error ? error.message : 'Le cadre courant ne peut pas être vérifié.' };
    }
  };

  const collectSourcesInternal = async (): Promise<InternalSourceReadResult<TScope>> => {
    const initial = await readStableState();
    if (initial.status !== 'ready') return { status: 'unavailable', reason: initial.reason };
    const state = initial.state;
    const notices: string[] = [];
    const sources: InternalSource[] = [];
    const current = buildCurrentSource(state);
    if (current) sources.push(current);
    else notices.push('Aucun programme physique courant ne peut être lié depuis la recette et le journal relus.');
    const selected = await selectedScenarioSource({ state, services: input.services });
    if (selected.source) sources.push(selected.source);
    if (selected.notice) notices.push(selected.notice);
    const final = await readStableState();
    if (final.status !== 'ready' || final.state.reference !== state.reference) {
      return { status: 'unavailable', reason: final.status === 'ready'
        ? 'Le profil, la portée ou le workspace a changé pendant la résolution de la branche.' : final.reason };
    }
    return { status: 'ready', generation: state.frame.generation, state: final.state, sources, notices };
  };
  const collectSources = async (): Promise<HopV55RecipeColdContactSourceReadV1> => {
    const result = await collectSourcesInternal();
    return result.status === 'ready'
      ? { status: 'ready', generation: result.generation,
        sources: result.sources.map(({ frame: _frame, workspaceReference: _workspaceReference, ...source }) => clone(source)),
        notices: [...result.notices] }
      : result;
  };

  return {
    async readSources() { return collectSources(); },
    async prepare(selection) {
      if (!selection || !nonempty(selection.sourceKey) || !nonempty(selection.sourceReference)
        || !validGeneration(selection.generation) || !Array.isArray(selection.additionIds)
        || selection.additionIds.length === 0 || selection.additionIds.some(id => !nonempty(id))
        || new Set(selection.additionIds).size !== selection.additionIds.length || !nonempty(selection.groupingReason)) {
        return { status: 'refused', code: 'invalidInput', reason: 'Choisis une source, une ou plusieurs lignes exactes et explique leur regroupement.' };
      }
      const before = await collectSourcesInternal();
      if (before.status !== 'ready') return { status: 'refused', code: 'unavailable', reason: before.reason };
      if (before.generation !== selection.generation) return { status: 'refused', code: 'staleSource', reason: 'La génération de contexte a changé; relis la source avant de préparer le contact.' };
      const source = before.sources.find(row => row.key === selection.sourceKey && row.reference === selection.sourceReference);
      if (!source) return { status: 'refused', code: 'staleSource', reason: 'La source choisie n’est plus celle qui est affichée. Aucune branche de remplacement n’a été choisie.' };

      const frameState = before.state;
      if (frameState.frame.generation !== selection.generation) {
        return { status: 'refused', code: 'staleSource', reason: 'Le cadre courant a changé avant le chargement des qualifications.' };
      }
      let loaderInput: HopCatalogueLoaderInput;
      let loaderInputReference: string;
      try {
        loaderInput = loaderInputFor({ frame: frameState.frame, prepared: frameState.prepared,
          program: source.program, catalogueInput: frameState.catalogueInput });
        loaderInputReference = hopAdviceContentReference('hop-v55-cold-catalogue-caller-input-v1', loaderInput);
      } catch (error) {
        return { status: 'refused', code: 'unavailable', reason: error instanceof Error ? error.message : 'Les enregistrements du catalogue sont indisponibles.' };
      }
      let loaded: HopAssembledCatalogueInput;
      try { loaded = await loadHopCatalogueQualificationInput(loaderInput); }
      catch (error) {
        return { status: 'refused', code: 'unavailable', reason: error instanceof Error ? error.message : 'Le catalogue qualifié hors ligne ne peut pas être chargé.' };
      }
      const afterLoad = await collectSourcesInternal();
      if (afterLoad.status !== 'ready' || afterLoad.generation !== selection.generation) {
        return { status: 'refused', code: 'staleSource', reason: afterLoad.status === 'ready'
          ? 'Le cadre a changé pendant le chargement du catalogue.' : afterLoad.reason };
      }
      const freshSource = afterLoad.sources.find(row => row.key === selection.sourceKey && row.reference === selection.sourceReference);
      if (!freshSource) return { status: 'refused', code: 'staleSource', reason: 'Le programme ou la branche choisie a changé pendant le chargement; relis sa référence exacte.' };
      const afterFrame = afterLoad.state;
      const afterInput = loaderInputFor({ frame: afterFrame.frame, prepared: afterFrame.prepared,
        program: freshSource.program, catalogueInput: afterFrame.catalogueInput });
      if (hopAdviceContentReference('hop-v55-cold-catalogue-caller-input-v1', afterInput) !== loaderInputReference) {
        return { status: 'refused', code: 'staleSource', reason: 'Les variantes sauvegardées du catalogue ont changé pendant le chargement.' };
      }
      if (afterFrame.frameReference !== frameState.frameReference) {
        return { status: 'refused', code: 'staleSource', reason: 'Le contexte physique ou froid a changé avant l’évaluation.' };
      }
      const selectedAdditions = selection.additionIds.map(id => freshSource.program.additions.find(row => row.id === id));
      if (selectedAdditions.some(row => !row)) {
        return { status: 'refused', code: 'staleSource', reason: 'Une ligne sélectionnée ne correspond plus au programme de la source exacte.' };
      }
      let closure: HopV55ColdCatalogueClosureV1;
      try { closure = projectHopV55ColdCatalogueClosure(loaded, selectedAdditions.map(row => row!.materialId)); }
      catch (error) {
        return { status: 'refused', code: 'unavailable', reason: error instanceof Error ? error.message : 'La fermeture des qualifications sélectionnées est invalide.' };
      }
      const programRef = programFingerprint(freshSource.program);
      const qualificationRef = coldContactQualificationReference(closure.input);
      const contextRef = coldContactBeerContextReference(afterFrame.frame.coldContext);
      const authority = {
        ownerKey: afterFrame.frame.ownerKey,
        scope: clone(afterFrame.frame.scope),
        scopeReference: afterFrame.frame.scopeReference,
        knownReferences: { program: new Set([programRef]), qualification: new Set([qualificationRef]), context: new Set([contextRef]) },
        resolveCanonicalSource: async (requested: { ownerKey: string; scope: TScope; scopeReference: string;
          programReference: string; qualificationReference: string; contextReference: string }) => {
          const latest = await collectSourcesInternal();
          const latestSource = latest.status === 'ready'
            ? latest.sources.find(row => row.key === selection.sourceKey && row.reference === selection.sourceReference) : undefined;
          if (!latestSource || latest.status !== 'ready' || latest.generation !== selection.generation
            || latest.state.frame.generation !== selection.generation
            || latest.state.frameReference !== afterFrame.frameReference
            || requested.ownerKey !== latest.state.frame.ownerKey || requested.scopeReference !== latest.state.frame.scopeReference
            || !same(requested.scope, latest.state.frame.scope, 'hop-v55-cold-contact-scope-equality-v1')
            || requested.programReference !== programRef || requested.qualificationReference !== qualificationRef
            || requested.contextReference !== contextRef) return null;
          const latestInput = loaderInputFor({ frame: latest.state.frame, prepared: latest.state.prepared,
            program: latestSource.program, catalogueInput: latest.state.catalogueInput });
          if (hopAdviceContentReference('hop-v55-cold-catalogue-caller-input-v1', latestInput) !== loaderInputReference) return null;
          let wireProgram: HopDecisionProgram;
          try {
            wireProgram = omitUndefinedObjectProperties(latestSource.program) as HopDecisionProgram;
            if (programFingerprint(wireProgram) !== programRef) return null;
          } catch { return null; }
          return {
            ownerKey: latest.state.frame.ownerKey, scope: clone(latest.state.frame.scope),
            scopeReference: latest.state.frame.scopeReference, programReference: programRef,
            qualificationReference: qualificationRef, contextReference: contextRef,
            program: wireProgram, qualificationInput: clone(closure.input),
            ...(latest.state.frame.coldContext !== null ? { context: clone(latest.state.frame.coldContext) } : {}),
          };
        },
      };
      const result = await prepareHopV55QualifiedColdContactEvidence({ selection: {
        programReference: programRef, qualificationReference: qualificationRef, contextReference: contextRef,
        additionIds: [...selection.additionIds], groupingReason: selection.groupingReason,
      }, authority });
      const latest = await collectSourcesInternal();
      if (latest.status !== 'ready' || latest.generation !== selection.generation
        || !latest.sources.some(row => row.key === selection.sourceKey && row.reference === selection.sourceReference)) {
        return { status: 'refused', code: 'staleSource', reason: 'La source a changé pendant l’évaluation; aucune preuve ne peut être présentée comme actuelle.' };
      }
      return { status: 'prepared', source: clone(freshSource), result };
    },
  };
}
