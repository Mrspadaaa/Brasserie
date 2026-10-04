import { describe, expect, it, vi } from 'vitest';
import type { HopSource, HopVariety } from '../../functions/src/hopIndexSchema';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { loadHopCatalogueQualificationInput, type HopCatalogueLoaderInput } from '../../src/domain/hopDecision/catalogueLoader';
import type { HopCatalogueVariant } from '../../src/domain/hopDecision/catalogueQualification';
import type { HopCommercialProduct } from '../../src/domain/hopDecision/types';
import { HOP_COMMERCIAL_PRODUCTS } from '../../src/domain/hopDecision/products';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { createHopV55DecisionReadingArchiveV2, createHopV55DecisionReadingArchiveV3,
  readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import { readHopV55Question, type HopV55QuestionReading } from '../../src/services/hopV55/decision';
import { createHopV55QuestionScopeLedgerV1, readHopV55QuestionWithScopesV1,
  type HopV55QuestionScopeTransitionV1 } from '../../src/services/hopV55/questionScopeReading';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import {
  inspectHopV55ProductStudyPreparedReferenceV1,
  prepareHopV55ProductStudyV1,
  type PrepareHopV55ProductStudyInputV1,
} from '../../src/services/hopV55/productStudyPreparation';

const ownerKey = 'fixture-owner-q03';
const workspaceId = 'fixture-workspace-q03';
const question = 'Hyperboost, cryo hops...';
const recordedAt = '2026-10-03T10:00:00.000Z';
const source: HopSource = {
  kind: 'observation',
  title: 'Analyse variétale enregistrée en fixture',
  author: 'Fixture brasseur',
  year: 2026,
  reference: 'fixture:q03:saved-variety',
};
const savedVariety = (alpha: number): HopVariety => ({
  id: 'fixture-q03-saved-variety',
  name: 'Variété sauvegardée de fixture',
  form: 'pelletT90',
  aliases: [],
  descriptions: [],
  analysis: [{ analyte: 'alpha', unit: 'percentMass', basis: 'asIs', kind: 'point', value: alpha, source, confidence: 'low' }],
});

interface ProductStudyFixture {
  input: PrepareHopV55ProductStudyInputV1;
  archive: ReturnType<typeof createHopV55DecisionReadingArchiveV2> | ReturnType<typeof createHopV55DecisionReadingArchiveV3>;
  displayedProductIds: string[];
  catalogueInput: HopCatalogueLoaderInput;
}

const v3Question = 'Hyperboost, cryo hops... quand les employer et lesquels ?';

function fixtureV3(): ProductStudyFixture {
  const context = makeHopV55FixtureContext('unknown');
  const prepared = prepareBrewingScenarioContext(context);
  const { reading, scopeDrafts } = readHopV55QuestionWithScopesV1(v3Question, prepared);
  if (!reading.response || reading.response.actionKind !== 'understandProducts') {
    throw new Error('La question produit V3 doit conserver une réponse understandProducts.');
  }
  if (scopeDrafts.length === 0) throw new Error('La question V3 de fixture doit fournir au moins une portée de choix/moment.');
  const transition: HopV55QuestionScopeTransitionV1 = {
    actId: 'act:q03-v3-create', kind: 'create', reason: 'Conserver les portées proposées avec la lecture produit.',
    recordedAt, actor: { origin: 'proposal', label: 'Lecteur fixture' },
  };
  const scopeLedger = createHopV55QuestionScopeLedgerV1({ question: v3Question, reading, scopeDrafts, transition });
  const archive = createHopV55DecisionReadingArchiveV3({
    id: 'reading-q03-products-v3', ownerKey, workspaceId, recordedAt, reading,
    source: { kind: 'exploration' }, runtimeReference: 'runtime-reference:q03-v3', scopeLedger, transition,
  });
  const displayedProductIds = reading.response.result.products.map(product => product.id);
  const workspace: HopV55Workspace = {
    format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 0,
    title: 'Étude produit Q03 de fixture V3', intent: { question: v3Question, criteria: [] },
    decisionReadings: [archive], scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: recordedAt,
  };
  const catalogueInput: HopCatalogueLoaderInput = { saved: { varieties: [savedVariety(5)], lots: [] } };
  const input: PrepareHopV55ProductStudyInputV1 = {
    workspace, ownerKey, workspaceId, sourceReadingReference: archive.contentReference,
    expectedRuntimeReference: archive.runtimeReference, requestedProductIds: displayedProductIds,
    sourceContext: null, catalogueInput,
    identity: { preparationId: 'preparation-q03-products-v3', dossierId: 'dossier-q03-products-v3',
      eventId: 'event-q03-products-v3', recordedAt },
  };
  return { input, archive, displayedProductIds, catalogueInput };
}

function fixture(options: {
  source?: ReturnType<typeof createHopV55DecisionReadingArchiveV2>['source'];
  sourceContext?: PrepareHopV55ProductStudyInputV1['sourceContext'];
  catalogueInput?: HopCatalogueLoaderInput;
  requestedProductIds?: string[];
  expectedRuntimeReference?: string;
  workspaceOverrides?: Partial<HopV55Workspace>;
} = {}): ProductStudyFixture {
  const context = makeHopV55FixtureContext('unknown');
  const prepared = prepareBrewingScenarioContext(context);
  const reading = readHopV55Question(question, prepared);
  if (!reading.response || reading.response.actionKind !== 'understandProducts') {
    throw new Error('Le fragment original Q03 doit être lu comme understandProducts.');
  }
  const displayedProductIds = reading.response.result.products.map(product => product.id);
  const archive = createHopV55DecisionReadingArchiveV2({
    id: 'reading-q03-products',
    ownerKey,
    workspaceId,
    recordedAt,
    reading,
    source: options.source ?? { kind: 'exploration' },
    runtimeReference: 'runtime-reference:q03',
  });
  const workspace: HopV55Workspace = {
    format: 'hop-v55-workspace-v1',
    id: workspaceId,
    ownerKey,
    revision: 0,
    title: 'Étude produit Q03 de fixture',
    intent: { question, criteria: [] },
    decisionReadings: [archive],
    scenarioIds: [],
    referenceHypotheses: [],
    copies: [],
    updatedAt: recordedAt,
    ...options.workspaceOverrides,
  };
  const catalogueInput = options.catalogueInput ?? { saved: { varieties: [savedVariety(5)], lots: [] } };
  const identity = {
    preparationId: 'preparation-q03-products',
    dossierId: 'dossier-q03-products',
    eventId: 'event-q03-products',
    recordedAt,
  };
  return {
    archive,
    displayedProductIds,
    catalogueInput,
    input: {
      workspace,
      ownerKey,
      workspaceId,
      sourceReadingReference: archive.contentReference,
      expectedRuntimeReference: options.expectedRuntimeReference ?? archive.runtimeReference,
      requestedProductIds: options.requestedProductIds ?? displayedProductIds,
      sourceContext: options.sourceContext === undefined ? null : options.sourceContext,
      catalogueInput,
      identity,
    },
  };
}

async function prepare(row: ProductStudyFixture) {
  return prepareHopV55ProductStudyV1(structuredClone(row.input));
}

function productVariant(product: HopCommercialProduct): HopCatalogueVariant {
  const changedProduct = { ...structuredClone(product), name: `${product.name} · version sauvegardée` };
  return {
    variantId: `saved-product-variant:${product.id}`,
    scope: 'product',
    recordId: product.id,
    origin: { kind: 'saved' },
    material: {
      id: `product:${product.id}`,
      name: changedProduct.name,
      form: changedProduct.form,
      product: changedProduct,
    },
  };
}

describe('préparation d’une nouvelle étude produit qualifiée depuis la lecture V2/V3', () => {
  it('reprend le résultat produit exact, requalifie le snapshot sauvegardé et prépare un command products sans persister', async () => {
    const row = fixture();
    const originalArchive = structuredClone(row.archive);
    const result = await prepare(row);

    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('Une préparation produit explicite est attendue.');
    const prepared = result.result;
    const response = row.archive.reading.response;
    if (!response || response.actionKind !== 'understandProducts') throw new Error('Source produit exacte attendue.');

    expect(prepared.displayedProductIds).toEqual(['ych-cryo-hops', 'ych-hyperboost']);
    expect(prepared.displayedProductIds).toEqual(response.result.products.map(product => product.id));
    expect(prepared.requestedProductIds).toEqual(prepared.displayedProductIds);
    expect(prepared.study).toMatchObject({ formatVersion: 2, kind: 'calculated', actionKind: 'understandProducts' });
    expect(prepared.study.request.intent).toEqual(response.intent);
    expect(prepared.study.request.action).toEqual({ kind: 'understandProducts', productIds: prepared.displayedProductIds });
    expect(prepared.study.context).toBeNull();
    expect(prepared.study.request.qualificationInput.variants.filter(row => row.scope === 'product')).toHaveLength(HOP_COMMERCIAL_PRODUCTS.length);
    expect(prepared.study.request.qualificationInput.variants).toContainEqual(expect.objectContaining({
      scope: 'variety', recordId: savedVariety(5).id, origin: { kind: 'saved' },
    }));
    expect(prepared.study.request.qualificationInput.assembly?.sources).toContainEqual(expect.objectContaining({ key: 'saved:caller', kind: 'saved' }));
    expect(prepared.study.responseSnapshot.result.products.map(product => product.id)).toEqual(prepared.displayedProductIds);
    expect(prepared.preparation).toMatchObject({
      kind: 'products', formatVersion: 2, ownerKey, workspaceId,
      sourceReadingReference: row.archive.contentReference,
      preparedReference: prepared.preparedReference,
      dossierId: 'dossier-q03-products', eventId: 'event-q03-products',
    });
    expect(prepared.preparation.createCommand).toMatchObject({ kind: 'products', study: prepared.study });
    expect(prepared.sourceContextReference).toMatch(/^hop-v55-product-study-source-context-v1:sha256:/u);
    expect(prepared.qualificationInputReference).toMatch(/^hop-v55-product-study-qualification-input-v1:sha256:/u);
    expect(prepared.reference).toMatch(/^hop-v55-product-study-preparation-v1:sha256:/u);
    expect(row.archive).toEqual(originalArchive);
  });

  it('accepte une lecture produit V3 et garde à l’identique la lecture V2 et son ledger scellé', async () => {
    const row = fixtureV3();
    const archiveRead = readHopV55DecisionReadingArchive(row.archive);
    expect(archiveRead).toMatchObject({ status: 'available', archive: { format: 'hop-v55-decision-reading-v3' } });
    if (archiveRead.status !== 'available' || archiveRead.archive.format !== 'hop-v55-decision-reading-v3') {
      throw new Error('Une archive produit V3 valide est attendue.');
    }
    const exactReading: HopV55QuestionReading = structuredClone(archiveRead.archive.reading);
    const exactLedger = structuredClone(archiveRead.archive.scopeLedger);
    const result = await prepare(row);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('La lecture produit V3 doit être admissible.');
    expect(result.result).toMatchObject({
      sourceReadingReference: archiveRead.archive.contentReference,
      sourceReadingFormat: 'hop-v55-decision-reading-v3',
      sourceReading: exactReading,
      scopeLedger: exactLedger,
      scopeLedgerReference: exactLedger.reference,
      scopeTransition: archiveRead.archive.transition,
      requestedProductIds: row.displayedProductIds,
    });
    expect(result.result.sourceReading.response?.actionKind).toBe('understandProducts');
    expect(result.result.preparation.sourceReadingReference).toBe(archiveRead.archive.contentReference);

    const inspected = await inspectHopV55ProductStudyPreparedReferenceV1(row.input);
    expect(inspected).toMatchObject({
      status: 'ready', sourceReadingReference: archiveRead.archive.contentReference,
      sourceReadingFormat: 'hop-v55-decision-reading-v3', sourceReading: exactReading,
      scopeLedger: exactLedger, scopeLedgerReference: exactLedger.reference,
      scopeTransition: archiveRead.archive.transition, requestedProductIds: row.displayedProductIds,
      preparedReference: result.result.preparedReference,
    });
  });

  it('refuse un ledger V3 futur ou une altération du ledger même si la référence d’archive est recalculée', async () => {
    const row = fixtureV3();
    const archive = row.archive;
    if (archive.format !== 'hop-v55-decision-reading-v3') throw new Error('Archive V3 attendue.');
    const resealArchive = (raw: Record<string, any>) => {
      const { contentReference: _previousReference, ...body } = raw;
      return { ...body, contentReference: hopAdviceContentReference('hop-v55-decision-reading-v3', body) };
    };

    const future = structuredClone(archive) as unknown as Record<string, any>;
    future.scopeLedger.format = 'hop-v55-question-scope-ledger-v2';
    const futureArchive = resealArchive(future);
    const futureInput = { ...row.input, sourceReadingReference: futureArchive.contentReference,
      workspace: { ...row.input.workspace, decisionReadings: [futureArchive as never] } };
    expect(readHopV55DecisionReadingArchive(futureArchive)).toMatchObject({
      status: 'unsupportedFormat', format: 'hop-v55-question-scope-ledger-v2',
    });
    expect(await prepareHopV55ProductStudyV1(futureInput)).toMatchObject({ status: 'refused', code: 'sourceReadingUnsupported' });

    const altered = structuredClone(archive) as unknown as Record<string, any>;
    altered.scopeLedger.entries[0].sourceScope.sourceSpan.start += 1;
    const alteredArchive = resealArchive(altered);
    const alteredInput = { ...row.input, sourceReadingReference: alteredArchive.contentReference,
      workspace: { ...row.input.workspace, decisionReadings: [alteredArchive as never] } };
    expect(readHopV55DecisionReadingArchive(alteredArchive)).toMatchObject({ status: 'invalidRecord' });
    expect(await prepareHopV55ProductStudyV1(alteredInput)).toMatchObject({ status: 'refused', code: 'sourceReadingInvalid' });
  });

  it('scelle le périmètre explicitement fourni même si le loader charge tous les produits; une sélection complète des fiches affichées reste possible', async () => {
    const row = fixture();
    const selected = [row.displayedProductIds[0]];
    const result = await prepare(fixture({
      requestedProductIds: selected,
      catalogueInput: row.catalogueInput,
    }));
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('Le sous-ensemble explicitement choisi doit être prêt.');
    expect(result.result.study.request.qualificationInput.variants.filter(item => item.scope === 'product')).toHaveLength(HOP_COMMERCIAL_PRODUCTS.length);
    expect(result.result.study.request.action).toEqual({ kind: 'understandProducts', productIds: selected });
    expect(result.result.study.responseSnapshot.result.products.map(product => product.id)).toEqual(selected);

    const fullVisibleSelection = await prepare(fixture({ requestedProductIds: row.displayedProductIds }));
    expect(fullVisibleSelection.status).toBe('ready');
    if (fullVisibleSelection.status === 'ready') {
      expect(fullVisibleSelection.result.study.request.action).toEqual({ kind: 'understandProducts', productIds: row.displayedProductIds });
    }

    const unsuppliedOrUnbounded = await prepare(fixture({ requestedProductIds: HOP_COMMERCIAL_PRODUCTS.map(product => product.id) }));
    expect(unsuppliedOrUnbounded).toMatchObject({ status: 'refused', code: 'requestedProductNotDisplayed' });
  });

  it('refuse le scope vide, absent, dupliqué ou contenant une fiche non affichée au geste source', async () => {
    const row = fixture();
    expect(await prepare(fixture({ requestedProductIds: [] }))).toMatchObject({ status: 'refused', code: 'requestedProductScopeMissing' });
    const omitted = structuredClone(row.input) as unknown as Record<string, unknown>;
    delete omitted.requestedProductIds;
    expect(await prepareHopV55ProductStudyV1(omitted as unknown as PrepareHopV55ProductStudyInputV1))
      .toMatchObject({ status: 'refused', code: 'requestedProductScopeMissing' });
    expect(await prepare(fixture({ requestedProductIds: [row.displayedProductIds[0], row.displayedProductIds[0]] })))
      .toMatchObject({ status: 'refused', code: 'requestedProductScopeInvalid' });
    expect(await prepare(fixture({ requestedProductIds: ['fixture:product-not-displayed'] })))
      .toMatchObject({ status: 'refused', code: 'requestedProductNotDisplayed' });
  });

  it('garde une collision de versions comme résolution requise sans choisir un produit par ordre ou nom', async () => {
    const row = fixture();
    const conflicting = HOP_COMMERCIAL_PRODUCTS.find(product => product.id === row.displayedProductIds[0]);
    if (!conflicting) throw new Error('Produit affiché de fixture introuvable.');
    const result = await prepare(fixture({
      requestedProductIds: [conflicting.id],
      catalogueInput: {
        ...row.catalogueInput,
        additionalVariants: [productVariant(conflicting)],
      },
    }));
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('Une étude collisionnée reste préparée et qualifiée.');
    expect(result.result.study.kind).toBe('resolutionRequired');
    expect(result.result.study.calculationInput).toBeNull();
    expect(result.result.study.responseSnapshot).toBeNull();
    expect(result.result.blockingIssues.length).toBeGreaterThan(0);
    expect(result.result.study.request.qualificationInput.selectedVariantByRecord).toBeUndefined();
    const group = result.result.study.qualificationSnapshot.result?.groups.find(item => item.scope === 'product' && item.recordId === conflicting.id);
    expect(group?.status).toBe('collisionNeedsSelection');
  });

  it('refuse une runtime périmée, un contexte source incompatible et un owner/workspace différent', async () => {
    const row = fixture();
    expect(await prepare(fixture({ expectedRuntimeReference: 'runtime-reference:stale' })))
      .toMatchObject({ status: 'refused', code: 'runtimeReferenceStale' });

    const recipeSource = { kind: 'recipe' as const, id: 'source-recipe-q03' };
    const recipeRow = fixture({ source: recipeSource, workspaceOverrides: { sourceRecipeId: recipeSource.id },
      sourceContext: { kind: 'recipe', recipeId: 'different-recipe', recipeReference: 'recipe-reference:different' } });
    expect(await prepare(recipeRow)).toMatchObject({ status: 'refused', code: 'sourceContextMismatch' });

    const batchSource = { kind: 'batch' as const, id: 'source-batch-q03' };
    const batchRow = fixture({ source: batchSource, workspaceOverrides: { sourceBatchId: batchSource.id }, sourceContext: {
      kind: 'batch', batchId: 'different-batch', recipeId: 'recipe-q03', recipeSnapshotReference: 'recipe-snapshot:1',
      brewDayRevision: 1, programFingerprint: 'program-fingerprint:1', stage: 'planning',
    } });
    expect(await prepare(batchRow)).toMatchObject({ status: 'refused', code: 'sourceContextMismatch' });

    const changedOwner = structuredClone(row.input);
    changedOwner.ownerKey = 'other-owner';
    expect(await prepareHopV55ProductStudyV1(changedOwner)).toMatchObject({ status: 'refused', code: 'invalidWorkspace' });
  });

  it('refuse les archives futures et les lectures dont l’action source n’est pas understandProducts', async () => {
    const row = fixture();
    const futureWorkspace = structuredClone(row.input.workspace);
    futureWorkspace.decisionReadings = [{ format: 'hop-v55-decision-reading-v99', contentReference: row.archive.contentReference } as never];
    expect(await prepareHopV55ProductStudyV1({ ...row.input, workspace: futureWorkspace }))
      .toMatchObject({ status: 'refused', code: 'sourceReadingUnsupported' });

    const otherPrepared = prepareBrewingScenarioContext(makeHopV55FixtureContext('unknown'));
    const notProduct = readHopV55Question('Je veux plus de floral dans ma bière.', otherPrepared);
    if (!notProduct.response || notProduct.response.actionKind === 'understandProducts') throw new Error('Réponse non produit attendue.');
    const archive = createHopV55DecisionReadingArchiveV2({
      id: 'reading-q03-wrong-action', ownerKey, workspaceId, recordedAt, reading: notProduct,
      source: { kind: 'exploration' }, runtimeReference: row.archive.runtimeReference,
    });
    const wrongActionWorkspace = { ...row.input.workspace, decisionReadings: [archive] };
    expect(await prepareHopV55ProductStudyV1({ ...row.input, workspace: wrongActionWorkspace, sourceReadingReference: archive.contentReference }))
      .toMatchObject({ status: 'refused', code: 'sourceActionMismatch' });
  });

  it('refuse un standalone implicite et scelle des empreintes stables qui changent avec le contexte de requalification', async () => {
    const row = fixture();
    const missingContext = structuredClone(row.input) as unknown as Record<string, unknown>;
    delete missingContext.sourceContext;
    expect(await prepareHopV55ProductStudyV1(missingContext as unknown as PrepareHopV55ProductStudyInputV1))
      .toMatchObject({ status: 'refused', code: 'invalidPreparationIdentity' });

    const first = await prepare(row);
    const second = await prepare(row);
    expect(first.status).toBe('ready');
    expect(second.status).toBe('ready');
    if (first.status !== 'ready' || second.status !== 'ready') throw new Error('Étude produit de fixture attendue.');
    expect(second.result.preparedReference).toBe(first.result.preparedReference);
    expect(second.result.preparation.reference).toBe(first.result.preparation.reference);

    const changedSource = fixture({ catalogueInput: { saved: { varieties: [savedVariety(7)], lots: [] } } });
    const changed = await prepare(changedSource);
    expect(changed.status).toBe('ready');
    if (changed.status === 'ready') expect(changed.result.preparedReference).not.toBe(first.result.preparedReference);
  });

  it('inspecte V2 et V3 sans rappeler le builder qualifié et conserve la même empreinte', async () => {
    const rows = [fixture(), fixtureV3()];
    const qualifiedDecision = await import('../../src/domain/hopDecision/qualifiedDecision');
    const builderSpy = vi.spyOn(qualifiedDecision, 'answerQualifiedHopDecision');
    try {
      builderSpy.mockClear();
      for (const row of rows) {
        const prepared = await prepare(row);
        if (prepared.status !== 'ready') throw new Error('Étude préparée requise pour comparer les empreintes.');
        builderSpy.mockClear();
        const inspected = await inspectHopV55ProductStudyPreparedReferenceV1(row.input);
        expect(inspected).toMatchObject({
          status: 'ready',
          sourceReadingReference: row.archive.contentReference,
          sourceReadingFormat: row.archive.format,
          sourceReading: row.archive.reading,
          sourceRuntimeReference: row.archive.runtimeReference,
          sourceContextReference: prepared.result.sourceContextReference,
          qualificationInputReference: prepared.result.qualificationInputReference,
          displayedProductIds: row.displayedProductIds,
          requestedProductIds: row.displayedProductIds,
          preparedReference: prepared.result.preparedReference,
        });
        if (row.archive.format === 'hop-v55-decision-reading-v3') {
          expect(inspected).toMatchObject({ scopeLedger: row.archive.scopeLedger,
            scopeLedgerReference: row.archive.scopeLedger.reference, scopeTransition: row.archive.transition });
        } else {
          expect(inspected).not.toHaveProperty('scopeLedger');
        }
        expect(builderSpy).not.toHaveBeenCalled();
      }
      expect(builderSpy).not.toHaveBeenCalled();
    } finally {
      builderSpy.mockRestore();
    }
  });
});
