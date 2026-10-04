import { describe, expect, it } from 'vitest';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopDecisionMaterial } from '../../src/domain/hopDecision/types';
import type { RecipeSnapshot, HopIngredient } from '../../src/types';
import {
  prepareBrewingObservedContext,
  type PrepareBrewingObservedContextOptions,
} from '../../src/domain/brewingObservationContext';

const BATCH = 'LOT-CANONIQUE-42';
const AS_OF = '2026-10-02T10:00:00.000Z';
const READ_AT = '2026-10-02T10:06:00.000Z';
const KNOWLEDGE_AS_OF = '2026-10-02T10:10:00.000Z';
const STARTED_AT = '2026-10-02T06:00:00.000Z';
const HOP_ID = 'hop-variety-citra';
const LOT_ID = 'lot-citra-01';
const STOCK_REF = 'inventory-hop-citra-01';

function evidence(effectiveAt: string, recordedAt: string, reference: string) {
  return { effectiveAt, recordedAt, provenance: { kind: 'fixtureAttestation', reference, description: `Fixture ${reference}` } };
}

function hop(over: Partial<HopIngredient> = {}): HopIngredient {
  return { name: 'Citra', alpha: 8, weightG: 18, stage: 'dryHop', aromaTiming: 'postFermentation',
    aromaContactHours: 48, aromaTemperatureC: 18, hopVarietyId: HOP_ID, hopLotId: LOT_ID, stockItemRef: STOCK_REF, ...over };
}

function snapshot(hops: HopIngredient[] = [hop()]): RecipeSnapshot {
  return { capturedAt: '2026-10-01T08:00:00.000Z', sourceRecipeId: 'recipe-original', name: 'Citra test', style: 'IPA',
    volumeL: 20, ogTarget: 1.05, fgTarget: 1.01, abvTarget: 5, fermentables: [], totalGristKg: 0, hops,
    yeast: { name: 'US-05', hopIndexId: 'yeast-us05', pitchTempC: 18 },
    fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 18, days: 8 }], steps: [], notes: [] } as unknown as RecipeSnapshot;
}

function context(input: {
  hops?: HopIngredient[];
  additions?: Record<string, unknown>;
  now?: string;
  snapshotMissing?: boolean;
  localJournal?: unknown;
} = {}): BrewerContext {
  const frozen = snapshot(input.hops);
  const changedContextRecipe = structuredClone(frozen);
  changedContextRecipe.hops[0] = hop({ name: 'Mutable recipe fallback', weightG: 900, hopLotId: 'wrong-lot' });
  return {
    batch: { id: BATCH, name: 'Batch fixture', status: 'fermentation', brewDate: '2026-10-02', volumeL: 20,
      ...(input.snapshotMissing ? {} : { recipeSnapshot: frozen }) },
    recipe: changedContextRecipe,
    journal: { steps: [], currentIndex: 0, startedAt: Date.parse(STARTED_AT), pitchedAt: Date.parse('2026-10-02T08:00:00.000Z'),
      revision: 4, additions: input.additions ?? { 'hop-0': { amount: 20, unit: 'g', doneAt: Date.parse(STARTED_AT) } } },
    ...(input.localJournal ? { localJournal: input.localJournal } : {}),
    inventory: [], material: [], waterSources: [], phase: 'fermentation', now: Date.parse(input.now ?? READ_AT), provenance: [],
  } as unknown as BrewerContext;
}

function material(): HopDecisionMaterial {
  const variety = { id: HOP_ID, name: 'Citra catalogue', aliases: [], form: 'pelletT90' as const, analysis: [], descriptions: [] };
  const lot = { id: LOT_ID, varietyId: HOP_ID, name: 'Lot Citra catalogue', form: 'pelletT90' as const,
    stockItemRef: STOCK_REF, analysis: [] };
  return { id: `lot:${LOT_ID}`, name: 'Citra catalogue', form: 'pelletT90', variety, lot, stockItemRef: STOCK_REF };
}

function contactAttestation(additionKey = 'hop-0') {
  return { additionKey, kind: 'activeThrough' as const,
    evidence: evidence(AS_OF, '2026-10-02T10:02:00.000Z', `contact:${additionKey}:active`), epistemicStatus: 'reported' as const };
}

function coverageAttestations(throughAt = AS_OF) {
  return ['hopMaterials', 'hopContact'].map(dependencyId => ({ id: `coverage:${dependencyId}`, version: 1, supersedesVersion: null,
    dependencyId, fromAt: '2026-10-02T00:00:00.000Z', throughAt, status: 'complete' as const,
    recordedAt: '2026-10-02T10:04:00.000Z',
    provenance: { kind: 'fixtureScope', reference: `coverage:${dependencyId}`, description: 'Portée complète explicitement déclarée.' } }));
}

function hopScope() {
  return { id: 'hop-history-for-note-1', dependencyIds: ['hopMaterials', 'hopContact'], fromAt: '2026-10-02T00:00:00.000Z',
    explanation: 'Périmètre houblon et contacts explicitement demandé pour cette observation.' };
}

function options(ctx: BrewerContext, patch: Partial<PrepareBrewingObservedContextOptions> = {}): PrepareBrewingObservedContextOptions {
  return { source: { kind: 'batch', id: BATCH }, asOf: AS_OF, knowledgeAsOf: KNOWLEDGE_AS_OF,
    contactAttestations: [contactAttestation()], coverageAttestations: coverageAttestations(), hopScope: hopScope(), materials: [material()], ...patch };
}

describe('préparation physique depuis le BrewerContext canonique', () => {
  it('lie snapshot, ajout daté et attestation au résolveur puis à l’entrée de modèle sans confondre cible et écoulé', () => {
    const ctx = context(), untouched = structuredClone(ctx);
    const prepared = prepareBrewingObservedContext(ctx, options(ctx));
    expect(prepared.status).toBe('prepared');
    expect(prepared.sourceSnapshotReference).toBeTruthy();
    expect(prepared.sourceSnapshot?.hops[0].weightG).toBe(18);
    expect(prepared.stateInput?.facts).toHaveLength(1);
    expect(prepared.stateInput?.facts[0]).toMatchObject({ effectiveAt: STARTED_AT, recordedAt: READ_AT,
      dependencyId: 'hopMaterials', epistemicStatus: 'reported', kind: 'materialAdded' });
    expect(prepared.stateInput?.facts[0].kind === 'materialAdded' && prepared.stateInput.facts[0].quantity)
      .toEqual({ status: 'known', value: 20, unit: 'g' });
    expect(prepared.state?.status).toBe('resolved');
    expect(prepared.state?.subject).toMatchObject({ kind: 'beer', identity: { id: `batch:${BATCH}` } });
    expect(prepared.state?.contactStates[0]).toMatchObject({ status: 'active', elapsedSeconds: 4 * 60 * 60 });
    expect(prepared.modelContext).toMatchObject({ origin: 'declaredHypothesis', input: { volumeL: 20, yeastId: 'yeast-us05' } });
    expect(prepared.proposedBindings[0]).toMatchObject({ materialId: `lot:${LOT_ID}`, timing: 'postFermentation', temperatureC: 18 });
    expect(prepared.observedHopInput?.status).toBe('available');
    expect(prepared.observedHopInput?.used[0]).toMatchObject({ grams: 20, elapsedHours: 4 });
    expect(prepared.observedHopInput?.input?.additions[0].triplet).toMatchObject({ doseGL: 1, contactHours: 4, temperatureC: 18 });
    expect(prepared.observedHopInput?.input?.additions[0].triplet.contactHours).not.toBe(ctx.batch.recipeSnapshot.hops[0].aromaContactHours);
    expect(prepared.state?.knowledgeReference).toMatchObject({ version: `derived-read:${READ_AT}` });
    expect(ctx).toEqual(untouched);
    const snapshotReference = prepared.sourceSnapshotReference;
    ctx.batch.recipeSnapshot.hops[0].weightG = 777;
    expect(prepared.sourceSnapshot?.hops[0].weightG).toBe(18);
    expect(prepared.sourceSnapshotReference).toBe(snapshotReference);
  });

  it('garde une identité physique stable face au recipe mutable, au nom/poids planifiés et au seul instant de lecture', () => {
    const firstContext = context();
    const first = prepareBrewingObservedContext(firstContext, options(firstContext));
    const changed = context({ now: '2026-10-02T10:07:00.000Z' });
    changed.batch.recipeSnapshot.hops[0] = hop({ name: 'Libellé révisé', weightG: 777 });
    const second = prepareBrewingObservedContext(changed, options(changed));
    expect(first.state?.physicalStateReference).toBe(second.state?.physicalStateReference);
    expect(first.state?.resolutionReference).not.toBe(second.state?.resolutionReference);
    expect(first.sourceSnapshotReference).not.toBe(second.sourceSnapshotReference);
    expect(first.stateInput?.facts[0].kind === 'materialAdded' && first.stateInput.facts[0].material)
      .toEqual(second.stateInput?.facts[0].kind === 'materialAdded' ? second.stateInput.facts[0].material : null);
  });

  it('refuse le scope recipe, le snapshot absent et un autre batch sans reprendre le contexte mutable', () => {
    const recipeOnly = context(); delete (recipeOnly as any).batch;
    const noBatch = prepareBrewingObservedContext(recipeOnly, options(recipeOnly));
    expect(noBatch).toMatchObject({ status: 'refused', refusal: { code: 'batchRequired' }, stateInput: null, state: null });
    expect(noBatch.mutableContextRecipePreserved).toEqual(recipeOnly.recipe);

    const noSnapshotContext = context({ snapshotMissing: true });
    const noSnapshot = prepareBrewingObservedContext(noSnapshotContext, options(noSnapshotContext));
    expect(noSnapshot).toMatchObject({ status: 'refused', refusal: { code: 'recipeSnapshotRequired' }, state: null });
    expect(noSnapshot.mutableContextRecipePreserved).toEqual(noSnapshotContext.recipe);

    const otherBatch = context();
    const mismatch = prepareBrewingObservedContext(otherBatch, options(otherBatch, { source: { kind: 'batch', id: 'LOT-B' } }));
    expect(mismatch).toMatchObject({ status: 'refused', refusal: { code: 'sourceBatchMismatch' }, observedBatchId: BATCH });
  });

  it('ne transforme pas une ligne prévue sans doneAt en fait, même si amount et weightG existent', () => {
    const ctx = context({ additions: { 'hop-0': { amount: 20, unit: 'g' } } });
    const prepared = prepareBrewingObservedContext(ctx, options(ctx));
    expect(prepared.stateInput?.facts).toEqual([]);
    expect(prepared.proposedBindings).toEqual([]);
    expect(prepared.unmapped).toContainEqual(expect.objectContaining({ sourceKey: 'hop-0', code: 'additionNotEffectivelyDated' }));
    expect(prepared.observedHopInput?.status).toBe('unknown');
    expect(prepared.observedHopInput?.issues.map(issue => issue.code)).toContain('scopeNotComplete');
  });

  it('conserve masse absente et unité inconnue; grams n’est utilisé sans unité que si la convention est sourcée', () => {
    const missing = context({ additions: { 'hop-0': { doneAt: Date.parse(STARTED_AT), unit: 'g' } } });
    const missingResult = prepareBrewingObservedContext(missing, options(missing));
    const missingFact = missingResult.stateInput!.facts[0];
    expect(missingFact.kind === 'materialAdded' && missingFact.quantity).toMatchObject({ status: 'unknown' });
    expect(missingResult.observedHopInput?.issues.map(issue => issue.code)).toContain('massUnknown');

    const unknownUnit = context({ additions: { 'hop-0': { amount: 20, unit: 'furlong', doneAt: Date.parse(STARTED_AT) } } });
    const unknownResult = prepareBrewingObservedContext(unknownUnit, options(unknownUnit));
    expect(unknownResult.stateInput?.facts[0].kind === 'materialAdded' && unknownResult.stateInput.facts[0].quantity)
      .toMatchObject({ status: 'unitUnknown', value: 20, rawUnit: 'furlong' });

    const unitless = context({ additions: { 'hop-0': { amount: 20, doneAt: Date.parse(STARTED_AT) } } });
    const qualified = prepareBrewingObservedContext(unitless, options(unitless, { legacyHopUnitQualification: {
      additionKeys: ['hop-0'], unit: 'g', reason: 'Le contrat historique du journal hop amount est explicitement confirmé pour cette ligne.',
      provenance: { kind: 'fixtureQualification', reference: 'fixture:legacy-hop-g', description: 'Qualification explicite de la convention grammes.' },
    } }));
    expect(qualified.stateInput?.facts[0].kind === 'materialAdded' && qualified.stateInput.facts[0].quantity)
      .toEqual({ status: 'known', value: 20, unit: 'g' });
    expect(qualified.stateInput?.facts[0].provenance.description).toMatch(/Convention explicitement qualifiée/);
  });

  it('ne garde pas l’ancienne identité quand le journal ne donne qu’un nom de remplacement', () => {
    const ctx = context({ additions: { 'hop-0': { amount: 20, unit: 'g', doneAt: Date.parse(STARTED_AT), replacement: { name: 'Cascade' } } } });
    const prepared = prepareBrewingObservedContext(ctx, options(ctx));
    const fact = prepared.stateInput?.facts[0];
    expect(fact?.kind === 'materialAdded' && fact.material).toMatchObject({ status: 'unresolved', label: 'Cascade' });
    expect(fact?.kind === 'materialAdded' && fact.lot).toMatchObject({ status: 'unresolved', label: 'Cascade' });
    expect(prepared.proposedBindings).toEqual([]);
    expect(prepared.unmapped).toContainEqual(expect.objectContaining({ code: 'materialIdentityUnresolved' }));
    expect(prepared.stateInput?.facts[0].kind === 'materialAdded' && prepared.stateInput.facts[0].quantity)
      .toEqual({ status: 'known', value: 20, unit: 'g' });

    const namedOnly = context({ hops: [hop({ hopVarietyId: undefined, hopLotId: undefined, stockItemRef: undefined })] });
    const namedResult = prepareBrewingObservedContext(namedOnly, options(namedOnly));
    expect(namedResult.stateInput?.facts[0].kind === 'materialAdded' && namedResult.stateInput.facts[0].material)
      .toMatchObject({ status: 'unresolved', label: 'Citra' });
    expect(namedResult.proposedBindings).toEqual([]);
  });

  it('ne déduit pas la continuité froide de doneAt et conserve l’écoulé uniquement avec une attestation', () => {
    const ctx = context();
    const withoutAttestation = prepareBrewingObservedContext(ctx, options(ctx, { contactAttestations: [] }));
    expect(withoutAttestation.state?.contactStates[0]).toMatchObject({ status: 'continuityUnknown' });
    expect(withoutAttestation.state?.contactStates[0]).not.toHaveProperty('elapsedSeconds');
    expect(withoutAttestation.observedHopInput?.issues.map(issue => issue.code)).toContain('contactUnknown');

    const withAttestation = prepareBrewingObservedContext(ctx, options(ctx, { contactAttestations: [contactAttestation()] }));
    expect(withAttestation.observedHopInput?.used[0].elapsedHours).toBe(4);
    expect(withAttestation.observedHopInput?.used[0].elapsedHours).not.toBe(48);
  });

  it('garde la filiation du sample et exclut les ajouts après le prélèvement', () => {
    const ctx = context({ hops: [hop(), hop({ name: 'Motueka', hopLotId: 'lot-motueka', hopVarietyId: 'hop-variety-motueka',
      stockItemRef: 'inventory-motueka', stage: 'boil', aromaTiming: undefined })],
      additions: { 'hop-0': { amount: 20, unit: 'g', doneAt: Date.parse('2026-10-02T08:00:00.000Z') },
        'hop-1': { amount: 12, unit: 'g', doneAt: Date.parse('2026-10-02T09:30:00.000Z') } } });
    const sampleCut = '2026-10-02T09:00:00.000Z';
    const result = prepareBrewingObservedContext(ctx, options(ctx, { asOf: sampleCut, sample: {
      id: 'sample-17', version: '1', sourceBatchId: BATCH,
      collection: evidence(sampleCut, '2026-10-02T09:05:00.000Z', 'sample:draw-17'),
    } }));
    expect(result.state?.subject).toMatchObject({ kind: 'sample', identity: { id: 'sample:sample-17' }, sourceBeer: { id: `batch:${BATCH}` } });
    expect(result.state?.asOf).toBe(sampleCut);
    expect(result.state?.factDispositions.map(row => [row.id, row.disposition])).toEqual([
      [`batch:${BATCH}:addition:hop-0`, 'effective'], [`batch:${BATCH}:addition:hop-1`, 'afterCutoff'],
    ]);

    const wrongSource = prepareBrewingObservedContext(ctx, options(ctx, { asOf: sampleCut, sample: {
      id: 'sample-from-B', version: '1', sourceBatchId: 'LOT-B', collection: evidence(sampleCut, '2026-10-02T09:05:00.000Z', 'sample:wrong-draw'),
    } }));
    expect(wrongSource).toMatchObject({ status: 'refused', refusal: { code: 'sampleSourceMismatch' }, state: null });
  });

  it('ne prétend pas connaître au cutoff une ligne dérivée d’un snapshot lu plus tard', () => {
    const ctx = context();
    const result = prepareBrewingObservedContext(ctx, options(ctx, { knowledgeAsOf: '2026-10-02T10:05:00.000Z' }));
    expect(result.stateInput?.facts[0].recordedAt).toBe(READ_AT);
    expect(result.state?.factDispositions[0].disposition).toBe('notYetKnown');
    expect(result.observedHopInput).toBeNull();
    expect(result.unmapped.some(row => row.code === 'coverageNotAppliedToOlderKnowledgeCutoff')).toBe(true);
  });

  it('ne traite pas un passé inconnu comme vide sans portée complète attestée', () => {
    const ctx = context();
    const incomplete = prepareBrewingObservedContext(ctx, options(ctx, { coverageAttestations: [] }));
    expect(incomplete.state?.status).not.toBe('resolved');
    expect(incomplete.observedHopInput?.status).toBe('unknown');
    expect(incomplete.observedHopInput?.issues.map(issue => issue.code)).toContain('scopeNotComplete');
    expect(incomplete.observedHopInput?.input).toBeNull();
  });
});
