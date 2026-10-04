import { describe, expect, it } from 'vitest';
import type { HopDecisionMaterial, HopDecisionProgram } from '../../src/domain/hopDecision/types';
import { prepareBrewingStockAvailability } from '../../src/domain/brewingStockAvailability';

const stockRef = 'HOP-CITRA-1';

function material(id = 'lot:citra', ref = stockRef): HopDecisionMaterial {
  return {
    id,
    name: 'Citra',
    form: 'pelletT90',
    stockItemRef: ref,
    lot: { id: 'lot-citra', varietyId: 'var-citra', name: 'Lot Citra', form: 'pelletT90', stockItemRef: ref, analysis: [] },
  };
}

function inventory(currentStock = 100, unit = 'g', ref = stockRef) {
  return [{ id: 'document-id-is-not-the-contract', ref, name: 'Citra', unit, currentStock }];
}

function coldProgram(status: 'planned' | 'performed' = 'planned'): HopDecisionProgram {
  return {
    id: 'batch-current', revision: 3, stage: 'fermenting', volumeL: 20, wortGravity: 1.05,
    additions: [{ id: 'recipe-hop:0', materialId: 'lot:citra', grams: 20, use: 'fermentation', status, contactHours: 24, temperatureC: 18 }],
  };
}

function readyLedger(stockItemRef: string, pending = 20) {
  return {
    appliedAt: '2026-10-01T12:00:00.000Z',
    eventId: 'brewday-current',
    completedStages: ['brewday'],
    items: [{ stockItemRef, quantity: 40, unit: 'g' }],
    pendingItems: [{ stockItemRef, quantity: pending, unit: 'g' }],
  };
}

function readyCurrentBatch() {
  return {
    id: 'batch-current',
    status: 'fermentation',
    stockConsumption: readyLedger(stockRef),
    recipeSnapshot: {
      fermentables: [],
      hops: [{ name: 'Citra', weightG: 20, stage: 'dryHop', alpha: 10, stockItemRef: stockRef }],
      adjuncts: [],
    },
  };
}

function noOtherReservations() {
  return { complete: true, batches: [] as unknown[] };
}

const stock01Ref = 'STOCK-HOP-A';

function stock01Material(): HopDecisionMaterial {
  return { id: 'material:a', name: 'Lot A', form: 'pelletT90', stockItemRef: stock01Ref,
    lot: { id: 'lot-a', varietyId: 'variety-a', name: 'Lot A', form: 'pelletT90', stockItemRef: stock01Ref, analysis: [] } };
}

function stock01Inventory(currentStock: number, unit: string) {
  return [{ id: 'document-distinct', ref: stock01Ref, name: 'Lot A', unit, currentStock }];
}

function stock01Recipe(weightsG: number[], adjuncts: any[] = []) {
  return { fermentables: [], hops: weightsG.map(weightG => ({ name: 'Lot A', weightG, stage: 'dryHop', alpha: 10, stockItemRef: stock01Ref })), adjuncts };
}

function stock01Ledger(pendingQuantity = 20, pendingUnit = 'g') {
  return {
    appliedAt: '2026-10-02T08:00:00Z', eventId: 'brewday-a', completedStages: ['brewday'],
    items: [{ stockItemRef: stock01Ref, quantity: 40, unit: 'g' }],
    pendingItems: [{ stockItemRef: stock01Ref, quantity: pendingQuantity, unit: pendingUnit }],
  };
}

function stock01Batch(options: { recipeSnapshot?: any; pendingQuantity?: number; pendingUnit?: string } = {}) {
  return { id: 'batch-a', status: 'fermentation', stockConsumption: stock01Ledger(options.pendingQuantity, options.pendingUnit),
    ...(options.recipeSnapshot ? { recipeSnapshot: options.recipeSnapshot } : {}) };
}

function stock01OtherBatch(quantity = 30, unit = 'g') {
  return { id: 'batch-b', status: 'fermentation', stockConsumption: {
    appliedAt: '2026-10-02T07:00:00Z', eventId: 'brewday-b', completedStages: ['brewday'], items: [],
    pendingItems: [{ stockItemRef: stock01Ref, quantity, unit }],
  } };
}

function stock01Program(weightsG: number[], status: 'planned' | 'performed' = 'planned'): HopDecisionProgram {
  return { id: 'batch-a', revision: 3, stage: 'fermenting', volumeL: 20, wortGravity: 1.05,
    additions: weightsG.map((grams, index) => ({ id: `recipe-hop:${index}`, materialId: 'material:a', grams,
      use: 'fermentation', status, contactHours: 24, temperatureC: 18 })) };
}

function stock01Reservations(batches: unknown[]) {
  return { complete: true, source: 'firestoreReadOnlyTransaction', batches };
}

describe('préparation de la disponibilité du stock houblon', () => {
  it('préserve le témoin Stock01 : 100 g bruts, 30 g autres, 20 g propres rendent 70 g mobilisables', () => {
    const snapshot = stock01Recipe([20]);
    const current = stock01Batch({ recipeSnapshot: snapshot });
    const result = prepareBrewingStockAvailability({
      materials: [stock01Material()], inventory: stock01Inventory(100, 'g'),
      reservations: stock01Reservations([stock01OtherBatch(30, 'g'), current]),
      batch: current, recipe: snapshot, program: stock01Program([20]),
    });

    expect(result.materials[0].availableGrams).toBe(70);
    expect(result.rows[0]).toMatchObject({
      physicalGrams: 100, reservedOtherGrams: 30, reservedOwnGrams: 20,
      availableGrams: 70, basis: 'mobilisableForRemainingProgram',
    });
  });

  it('Stock01 D2 : un snapshot mixte chargé en portée ne cède pas la place à une projection pure sans snapshot', () => {
    const loadedSnapshot = stock01Recipe([10], [{ name: 'Other ingredient', amount: 10, unit: 'g',
      step: 'Fermentation', stockItemRef: stock01Ref }]);
    const scopeBatch = stock01Batch({ recipeSnapshot: loadedSnapshot });
    const projectedBatch = stock01Batch(); // La projection courante n’a pas de snapshot recette.
    const mutableRecipe = stock01Recipe([20]);
    const result = prepareBrewingStockAvailability({
      materials: [stock01Material()], inventory: stock01Inventory(100, 'g'),
      reservations: stock01Reservations([stock01OtherBatch(30, 'g'), scopeBatch]),
      batch: projectedBatch, recipe: mutableRecipe, program: stock01Program([20]),
    });

    expect(result.materials[0].availableGrams).toBeNull();
    expect(result.rows[0]).toMatchObject({ availableGrams: null, basis: 'unknown', ownAllocation: 'unresolved' });
  });

  it('Stock01 D3 : une recette mutable seule ne prouve pas l’origine d’un pending propre', () => {
    const mutableRecipe = stock01Recipe([20]);
    const scopeBatch = stock01Batch();
    const projectedBatch = stock01Batch();
    const result = prepareBrewingStockAvailability({
      materials: [stock01Material()], inventory: stock01Inventory(100, 'g'),
      reservations: stock01Reservations([stock01OtherBatch(30, 'g'), scopeBatch]),
      batch: projectedBatch, recipe: mutableRecipe, program: stock01Program([20]),
    });

    expect(result.materials[0].availableGrams).toBeNull();
    expect(result.rows[0]).toMatchObject({ availableGrams: null, basis: 'unknown', ownAllocation: 'unresolved' });
  });

  it('Stock01 G2 : un pending autre incompatible ne transforme pas zéro physique en inconnu', () => {
    const snapshot = stock01Recipe([20]);
    const current = stock01Batch({ recipeSnapshot: snapshot });
    const result = prepareBrewingStockAvailability({
      materials: [stock01Material()], inventory: stock01Inventory(0, 'g'),
      reservations: stock01Reservations([stock01OtherBatch(30, 'sachet'), current]),
      batch: current, recipe: snapshot, program: stock01Program([20]),
    });

    expect(result.materials[0].availableGrams).toBe(0);
    expect(result.rows[0]).toMatchObject({ physicalGrams: 0, availableGrams: 0, basis: 'physicalZero' });
  });

  it('Stock01 G3 : zéro physique reste zéro malgré un ajout propre réalisé sans déstockage confirmé', () => {
    const snapshot = stock01Recipe([20]);
    const current = stock01Batch({ recipeSnapshot: snapshot });
    const result = prepareBrewingStockAvailability({
      materials: [stock01Material()], inventory: stock01Inventory(0, 'g'),
      reservations: stock01Reservations([stock01OtherBatch(30, 'g'), current]),
      batch: current, recipe: snapshot, program: stock01Program([20], 'performed'),
    });

    expect(result.materials[0].availableGrams).toBe(0);
    expect(result.rows[0]).toMatchObject({ physicalGrams: 0, availableGrams: 0, basis: 'physicalZero' });
  });

  it('Stock01 H2 : agrège chaque dose en kg natifs avant de vérifier le pending de 0,32 kg', () => {
    const weightsG = [5.49, 281.72, 32.79];
    const snapshot = stock01Recipe(weightsG);
    const current = stock01Batch({ recipeSnapshot: snapshot, pendingQuantity: 0.32, pendingUnit: 'kg' });
    const result = prepareBrewingStockAvailability({
      materials: [stock01Material()], inventory: stock01Inventory(1, 'kg'),
      reservations: stock01Reservations([stock01OtherBatch(30, 'g'), current]),
      batch: current, recipe: snapshot, program: stock01Program(weightsG),
    });

    expect(result.materials[0].availableGrams).toBe(970);
    expect(result.rows[0]).toMatchObject({
      physicalGrams: 1000, reservedOtherGrams: 30, reservedOwnGrams: 320,
      reusableOwnGrams: 320, nonReusableOwnGrams: 0, freeGrams: 650,
      availableGrams: 970, basis: 'mobilisableForRemainingProgram', ownAllocation: 'verifiedRemainingHops',
    });
  });

  it('Stock01 H2 : un écart réel de 0,001 kg dans le ledger laisse l’attribution inconnue', () => {
    const weightsG = [5.49, 281.72, 32.79];
    const snapshot = stock01Recipe(weightsG);
    const current = stock01Batch({ recipeSnapshot: snapshot, pendingQuantity: 0.321, pendingUnit: 'kg' });
    const result = prepareBrewingStockAvailability({
      materials: [stock01Material()], inventory: stock01Inventory(1, 'kg'),
      reservations: stock01Reservations([stock01OtherBatch(30, 'g'), current]),
      batch: current, recipe: snapshot, program: stock01Program(weightsG),
    });

    expect(result.materials[0].availableGrams).toBeNull();
    expect(result.rows[0]).toMatchObject({ availableGrams: null, basis: 'unknown', ownAllocation: 'unresolved' });
  });

  it('joint par ref, convertit la masse et dégage seulement l’allocation froide prouvée du batch courant', () => {
    const current = readyCurrentBatch();
    const other = {
      id: 'batch-other', status: 'fermentation',
      stockConsumption: {
        appliedAt: '2026-10-01T11:00:00.000Z', eventId: 'brewday-other', completedStages: ['brewday'], items: [],
        pendingItems: [{ stockItemRef: stockRef, quantity: 30, unit: 'g' }],
      },
    };
    const source = {
      materials: [material()], inventory: inventory(),
      reservations: { complete: true, batches: [other, current] },
      batch: current, recipe: current.recipeSnapshot, program: coldProgram(),
    };
    const before = structuredClone(source);

    const result = prepareBrewingStockAvailability(source);

    expect(result.version).toBe('brewing-stock-availability-v1');
    expect(result.materials[0].availableGrams).toBe(70);
    expect(result.rows).toEqual([expect.objectContaining({
      materialIds: ['lot:citra'], stockItemRef: stockRef, physicalGrams: 100,
      reservedOtherGrams: 30, reservedOwnGrams: 20, freeGrams: 50, availableGrams: 70,
      basis: 'mobilisableForRemainingProgram', ownAllocation: 'verifiedRemainingHops',
    })]);
    expect(result.reference).toBeTruthy();
    expect(source).toEqual(before);
    expect(result.materials[0]).not.toBe(source.materials[0]);
  });

  it('signale un dépassement de réservations sans augmenter le stock physique', () => {
    const current = readyCurrentBatch();
    const other = {
      id: 'batch-other', status: 'fermentation',
      stockConsumption: {
        appliedAt: '2026-10-01T11:00:00.000Z', eventId: 'brewday-other', completedStages: ['brewday'], items: [],
        pendingItems: [{ stockItemRef: stockRef, quantity: 130, unit: 'g' }],
      },
    };
    const result = prepareBrewingStockAvailability({ materials: [material()], inventory: inventory(100),
      reservations: { complete: true, batches: [other, current] }, batch: current,
      recipe: current.recipeSnapshot, program: coldProgram() });

    expect(result.rows[0]).toMatchObject({
      physicalGrams: 100, reservedOtherGrams: 130, reservedOwnGrams: 20,
      freeGrams: 0, overReservedGrams: 50, availableGrams: 0,
    });
    expect(result.materials[0].availableGrams).toBe(0);
  });

  it('garde un zéro physique connu même si la portée des réservations est absente', () => {
    const result = prepareBrewingStockAvailability({ materials: [material()], inventory: inventory(0) });

    expect(result.materials[0].availableGrams).toBe(0);
    expect(result.rows[0]).toMatchObject({ physicalGrams: 0, availableGrams: 0, basis: 'physicalZero' });
  });

  it('laisse une balance positive inconnue quand les réservations ne sont pas complètes', () => {
    const result = prepareBrewingStockAvailability({
      materials: [material()], inventory: inventory(), reservations: { complete: false, batches: [] },
    });

    expect(result.materials[0].availableGrams).toBeNull();
  });

  it('ne confond ni id de document ni nom avec le ref stock explicite', () => {
    const result = prepareBrewingStockAvailability({
      materials: [material()], inventory: [{ id: stockRef, name: 'Citra', unit: 'g', currentStock: 100 }],
      reservations: noOtherReservations(),
    });

    expect(result.materials[0].availableGrams).toBeNull();
  });

  it.each([
    ['unité à la pièce', inventory(100, 'sachet')],
    ['références de stock dupliquées', [...inventory(), ...inventory(80)]],
  ])('rend la disponibilité inconnue pour %s', (_case, rows) => {
    const result = prepareBrewingStockAvailability({ materials: [material()], inventory: rows, reservations: noOtherReservations() });

    expect(result.materials[0].availableGrams).toBeNull();
  });

  it('n’exclut pas le pending du batch courant si son lien au programme froid n’est pas prouvé', () => {
    const current = readyCurrentBatch();
    const result = prepareBrewingStockAvailability({
      materials: [material()], inventory: inventory(), reservations: { complete: true, batches: [current] },
      batch: current, recipe: current.recipeSnapshot, program: coldProgram('performed'),
    });

    expect(result.materials[0].availableGrams).toBeNull();
  });

  it('refuse l’attribution si le snapshot recette du batch en portée diffère du batch courant', () => {
    const scopedBatch = readyCurrentBatch();
    const current = { ...scopedBatch, recipeSnapshot: { ...scopedBatch.recipeSnapshot, name: 'Recette corrigée' } };
    const result = prepareBrewingStockAvailability({
      materials: [material()], inventory: inventory(), reservations: { complete: true, batches: [scopedBatch] },
      batch: current, recipe: scopedBatch.recipeSnapshot, program: coldProgram(),
    });

    expect(result.materials[0].availableGrams).toBeNull();
  });

  it('laisse inconnu un cold hop encore prévu après que le ledger a clôturé les ajouts restants', () => {
    const base = readyCurrentBatch();
    const current = { ...base, stockConsumption: { ...base.stockConsumption,
      completedStages: ['brewday', 'remaining'], pendingItems: [] } };
    const result = prepareBrewingStockAvailability({
      materials: [material()], inventory: inventory(), reservations: { complete: true, batches: [current] },
      batch: current, recipe: current.recipeSnapshot, program: coldProgram('planned'),
    });

    expect(result.materials[0].availableGrams).toBeNull();
  });

  it('accepte un cold hop réalisé après remaining avec snapshot valide et stock déjà débité', () => {
    const base = readyCurrentBatch();
    const current = { ...base, stockConsumption: { ...base.stockConsumption,
      completedStages: ['brewday', 'remaining'], pendingItems: [] } };
    const other = {
      id: 'batch-other', status: 'fermentation',
      stockConsumption: {
        appliedAt: '2026-10-01T11:00:00.000Z', eventId: 'brewday-other', completedStages: ['brewday'], items: [],
        pendingItems: [{ stockItemRef: stockRef, quantity: 30, unit: 'g' }],
      },
    };
    const program = coldProgram('performed');
    const result = prepareBrewingStockAvailability({ materials: [material()], inventory: inventory(80),
      reservations: { complete: true, batches: [other, current] }, batch: current,
      recipe: current.recipeSnapshot, program });

    expect(program.additions).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      physicalGrams: 80, reservedOtherGrams: 30, reservedOwnGrams: 0,
      availableGrams: 50, basis: 'mobilisableForRemainingProgram', ownAllocation: 'none',
    });
    expect(result.materials[0].availableGrams).toBe(50);
  });

  it('refuse de créditer un pending houblon si un autre ingrédient de fermentation partage son ref', () => {
    const base = readyCurrentBatch();
    const current = { ...base, recipeSnapshot: { ...base.recipeSnapshot,
      adjuncts: [{ name: 'Autre ingrédient', amount: 20, unit: 'g', step: 'Fermenteur', stockItemRef: stockRef }] } };
    const result = prepareBrewingStockAvailability({
      materials: [material()], inventory: inventory(), reservations: { complete: true, batches: [current] },
      batch: current, recipe: current.recipeSnapshot, program: coldProgram(),
    });

    expect(result.materials[0].availableGrams).toBeNull();
    expect(result.rows[0].ownAllocation).toBe('unresolved');
  });

  it('ne présume pas que des ajouts effectués avant clôture sont déjà déstockés', () => {
    const current = {
      id: 'batch-current', status: 'fermentation',
      brewDay: { additions: { 'hop-0': { amount: 20, unit: 'g', doneAt: 100 } } },
      recipeSnapshot: { hops: [{ name: 'Citra', weightG: 20, stage: 'dryHop', alpha: 10, stockItemRef: stockRef }] },
    };
    const result = prepareBrewingStockAvailability({
      materials: [material()], inventory: inventory(), reservations: { complete: true, batches: [current] },
      batch: current, recipe: current.recipeSnapshot, program: coldProgram('performed'),
    });

    expect(result.materials[0].availableGrams).toBeNull();
  });

  it('ne compte pas deux fois les alias d’un même stock physique', () => {
    const result = prepareBrewingStockAvailability({
      materials: [material('lot:citra'), material('alias:citra')], inventory: inventory(), reservations: noOtherReservations(),
    });

    expect(result.materials.map(row => row.availableGrams)).toEqual([100, 100]);
    expect(result.rows).toHaveLength(1);
  });

  it('change la référence de preuve si le stock ou les réservations changent', () => {
    const base = { materials: [material()], reservations: noOtherReservations() };
    const first = prepareBrewingStockAvailability({ ...base, inventory: inventory(100) });
    const changedStock = prepareBrewingStockAvailability({ ...base, inventory: inventory(90) });
    const changedReservations = prepareBrewingStockAvailability({ ...base, inventory: inventory(100), reservations: {
      complete: true,
      batches: [{ id: 'other', status: 'fermentation', stockConsumption: { pendingItems: [{ stockItemRef: stockRef, quantity: 10, unit: 'g' }] } }],
    } });

    expect(changedStock.reference).not.toBe(first.reference);
    expect(changedReservations.reference).not.toBe(first.reference);
  });
  it('garde inconnue une attribution propre dont les étapes ou lignes sources sont mal formées', () => {
    const invalidStages: any = readyCurrentBatch(); invalidStages.stockConsumption.completedStages = 42;
    const invalidRecipe: any = readyCurrentBatch(); invalidRecipe.recipeSnapshot.hops = [null];
    for (const current of [invalidStages, invalidRecipe]) {
      const result = prepareBrewingStockAvailability({ materials: [material()], inventory: inventory(),
        reservations: { complete: true, batches: [current] }, batch: current, recipe: current.recipeSnapshot, program: coldProgram() });
      expect(result.rows[0].availableGrams).toBeNull();
      expect(result.rows[0].basis).toBe('unknown');
    }
  });
});
