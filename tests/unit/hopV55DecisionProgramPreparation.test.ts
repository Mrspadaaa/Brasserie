import { describe, expect, it } from 'vitest';
import type { HopDecisionMaterial, HopDecisionProgram, HopProgramAddition } from '../../src/domain/hopDecision/types';
import { assertBrewingScenarioRequest, buildBrewingScenarioRequest } from '../../src/domain/brewingScenario';
import { prepareHopV55DecisionProgram, type HopV55ProgramOperationV1 } from '../../src/services/hopV55/decisionProgramPreparation';

const material = (id: string, availableGrams: number | null = 200): HopDecisionMaterial => ({
  id, name: `Matière fixture ${id}`, form: 'pelletT90', availableGrams,
  variety: { id: `variety-${id}`, name: `Variété fixture ${id}`, aliases: [], form: 'pelletT90', analysis: [], descriptions: [] },
  lot: { id: `lot-${id}`, varietyId: `variety-${id}`, name: `Lot fixture ${id}`, form: 'pelletT90', analysis: [] },
});

const addition = (over: Partial<HopProgramAddition> = {}): HopProgramAddition => ({
  id: 'line-a', materialId: 'source', grams: 30, use: 'postFermentation', status: 'planned', contactHours: 36, temperatureC: 17,
  ...over,
});

const program = (additions: HopProgramAddition[] = [addition()]): HopDecisionProgram => ({
  id: 'fixture-program', revision: 4, stage: 'planning', volumeL: 20, wortGravity: 1.05, additions,
});

const operation = (over: Partial<HopV55ProgramOperationV1> & { kind: HopV55ProgramOperationV1['kind'] }): HopV55ProgramOperationV1 => ({
  id: `op-${over.kind}`, label: `Geste ${over.kind}`, ...over,
} as HopV55ProgramOperationV1);

const prepare = (over: Partial<Parameters<typeof prepareHopV55DecisionProgram>[0]> = {}) => prepareHopV55DecisionProgram({
  branch: { id: 'future-hop-program', label: 'Programme à comparer' },
  program: program(), materials: [material('source'), material('target')],
  intent: { question: 'Préparer une variante de programme.', interpretation: 'Opérations de houblon guidées explicitement.', criteria: [] },
  operations: [], ...over,
});

describe('Préparation guidée des opérations J1 V5.5', () => {
  it('garde des opérations incomplètes et n’applique jamais une demi-composition', () => {
    const sourceProgram = program([addition({ use: 'boil', boilMinutes: 5 })]);
    const operations: HopV55ProgramOperationV1[] = [
      operation({ kind: 'remove', id: 'remove-20', label: 'Retirer 20 g dans le moût', additionId: 'line-a',
        sourceScope: 'hotSide', quantity: { kind: 'partial', grams: 20 } }),
      operation({ kind: 'add', id: 'add-20', label: 'Ajouter une matière choisie', additionId: 'line-b', materialId: 'target', grams: null,
        targetScope: 'coldSide', use: 'postFermentation', conditions: { contactHours: 24, temperatureC: 16 } }),
    ];
    const first = prepare({ program: sourceProgram, operations });
    expect(first.status).toBe('needsInput');
    expect(first.operations).toEqual(operations);
    expect(first.evaluations[0].changes).toEqual([{ kind: 'replace', additionId: 'line-a', additions: [expect.objectContaining({ grams: 10 })] }]);
    expect(first.evaluations[1].needs).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'quantity' })]));
    expect(first.branch).toBeUndefined();

    const completed = prepare({ program: sourceProgram, operations: [operations[0], { ...operations[1], grams: 20 }] });
    expect(completed.status).toBe('ready');
    expect(completed.branch?.programChanges).toHaveLength(2);
    expect(completed.proposal?.program.additions.find(row => row.id === 'line-a')?.grams).toBe(10);
    expect(completed.proposal?.program.additions.find(row => row.id === 'line-b')).toMatchObject({ grams: 20, materialId: 'target' });
    expect(completed.proposal?.stock.find(row => row.materialId === 'target')).toMatchObject({ neededGrams: 20, availableGrams: 200 });
    const scenario = buildBrewingScenarioRequest({ scenarioId: 'prepared-program-fixture', revision: 1,
      baseline: { kind: 'hypothetical', label: 'Programme de fixture', input: { volumeL: 20, yeastId: null, additions: [], fermentation: [] }, program: program() } });
    scenario.branches.push(completed.branch!);
    expect(() => assertBrewingScenarioRequest(scenario)).not.toThrow();
  });

  it('distingue une source unique de plusieurs lignes au même produit sans sélectionner la première', () => {
    const single = prepare({ operations: [operation({ kind: 'remove', sourceMaterialId: 'source', quantity: { kind: 'entire' } })] });
    expect(single.status).toBe('ready');
    expect(single.changes).toEqual([{ kind: 'remove', additionId: 'line-a' }]);

    const ambiguous = prepare({ program: program([addition({ id: 'line-a' }), addition({ id: 'line-b' })]),
      operations: [operation({ kind: 'remove', sourceMaterialId: 'source', quantity: { kind: 'entire' } })] });
    expect(ambiguous.status).toBe('needsInput');
    expect(ambiguous.evaluations[0].sourceCandidates.map(row => row.id)).toEqual(['line-a', 'line-b']);
    expect(ambiguous.evaluations[0].changes).toEqual([]);
  });

  it('filtre une source par hotSide/coldSide sans faire choisir une autre ligne ni réinterpréter la phase', () => {
    const current = program([addition({ id: 'line-hot', use: 'boil', boilMinutes: 5 }),
      addition({ id: 'line-cold', use: 'fermentation', contactHours: 24, temperatureC: 16 })]);
    const hot = prepare({ program: current, operations: [operation({ kind: 'remove', sourceMaterialId: 'source', sourceScope: 'hotSide',
      quantity: { kind: 'entire' } })] });
    expect(hot.status).toBe('ready');
    expect(hot.evaluations[0].sourceCandidates.map(row => row.id)).toEqual(['line-hot']);
    expect(hot.changes).toEqual([{ kind: 'remove', additionId: 'line-hot' }]);

    const contradiction = prepare({ program: current, operations: [operation({ kind: 'remove', additionId: 'line-cold', sourceScope: 'hotSide',
      quantity: { kind: 'entire' } })] });
    expect(contradiction.status).toBe('blocked');
    expect(contradiction.branch).toBeUndefined();
  });

  it('garde dry hop sans phase en besoin de choix et offre les seules phases coldSide', () => {
    const cold = prepare({ operations: [operation({ kind: 'add', additionId: 'cold-addition', targetScope: 'coldSide',
      materialId: 'target', grams: null })] });
    expect(cold.status).toBe('needsInput');
    expect(cold.evaluations[0].needs).toContainEqual(expect.objectContaining({ field: 'quantity' }));
    expect(cold.evaluations[0].needs.find(row => row.field === 'use')?.choices?.map(row => row.id))
      .toEqual(['fermentation', 'postFermentation']);
    expect(cold.branch).toBeUndefined();

    const hot = prepare({ operations: [operation({ kind: 'add', id: 'hot-addition', additionId: 'hot-addition', targetScope: 'hotSide',
      materialId: 'target', grams: null })] });
    expect(hot.evaluations[0].needs.find(row => row.field === 'use')?.choices?.map(row => row.id))
      .toEqual(['firstWort', 'boil', 'whirlpool']);
    const legacyDraft = prepare({ operations: [operation({ kind: 'add', id: 'legacy-addition', additionId: 'legacy-addition',
      materialId: 'target', grams: null })] });
    expect(legacyDraft.status).toBe('needsInput');
    expect(legacyDraft.evaluations[0].needs.find(row => row.field === 'use')?.choices).toBeUndefined();
  });

  it('refuse la modification d’un ajout effectué', () => {
    const result = prepare({ program: program([addition({ status: 'performed' })]),
      operations: [operation({ kind: 'setDose', additionId: 'line-a', quantity: { kind: 'target', grams: 35 } })] });
    expect(result.status).toBe('blocked');
    expect(result.evaluations[0].reasons.join(' ')).toMatch(/déjà effectuée/i);
    expect(result.branch).toBeUndefined();
  });

  it('affiche la comparaison exacte mais exige une convention ou une masse déclarée', () => {
    const exactPair = prepare({ operations: [operation({ kind: 'replace', additionId: 'line-a', materialId: 'target' })] });
    expect(exactPair.status).toBe('needsInput');
    expect(exactPair.evaluations[0].comparison).toMatchObject({ leftId: 'source', rightId: 'target' });
    expect(exactPair.branch).toBeUndefined();

    const explicitMass = prepare({ operations: [operation({ kind: 'replace', additionId: 'line-a', materialId: 'target',
      dose: { kind: 'explicit', grams: 30 } })] });
    expect(explicitMass.status).toBe('ready');
    expect(explicitMass.proposal?.program.additions[0]).toMatchObject({ materialId: 'target', grams: 30 });
  });

  it('ne transforme pas une convention non calculable en dose inventée', () => {
    const noAnalysis = [material('source'), material('target')];
    const result = prepare({ materials: noAnalysis, operations: [operation({ kind: 'replace', additionId: 'line-a', materialId: 'target',
      dose: { kind: 'basis', basis: 'alphaLoad' } })] });
    expect(result.status).toBe('needsInput');
    expect(result.evaluations[0].substitutions?.[0].doseGrams.status).toBe('unknown');
    expect(result.evaluations[0].changes).toEqual([]);
    expect(result.branch).toBeUndefined();
  });

  it('exige un emploi typé et ses conditions; aucun terme libre ne devient une phase', () => {
    const unqualified = prepare({ operations: [operation({ kind: 'move', additionId: 'line-a', quantity: { kind: 'entire' } })] });
    expect(unqualified.status).toBe('needsInput');
    expect(unqualified.needs).toContainEqual(expect.objectContaining({ field: 'use' }));
    expect(unqualified.branch).toBeUndefined();

    const missingConditions = prepare({ operations: [operation({ kind: 'move', additionId: 'line-a', use: 'boil', quantity: { kind: 'entire' } })] });
    expect(missingConditions.status).toBe('needsInput');
    expect(missingConditions.needs).toContainEqual(expect.objectContaining({ field: 'conditions' }));
    expect(missingConditions.branch).toBeUndefined();
  });

  it('déplace une portion en gardant la masse restante à l’emploi initial et l’extrait d’origine', () => {
    const source = addition({ grams: 40, use: 'fermentation', contactHours: 36, temperatureC: 17 });
    const phrase = 'déplacer 20 g à cru';
    const draft = operation({ kind: 'move', id: 'move-20', label: 'Déplacer 20 g à cru', sourceSpan: { start: 0, end: phrase.length, text: phrase },
      additionId: source.id, quantity: { kind: 'partial', grams: 20 }, newAdditionId: 'line-moved', use: 'postFermentation',
      conditions: { contactHours: 24, temperatureC: 16 } });
    const result = prepare({ program: program([source]), operations: [draft], intent: { question: phrase,
      interpretation: 'Déplacement explicite d’une partie du houblon prévu.', criteria: [] } });
    expect(result.status).toBe('ready');
    expect(result.operations).toEqual([draft]);
    expect(result.proposal?.program.additions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: source.id, grams: 20, use: 'fermentation' }),
      expect.objectContaining({ id: 'line-moved', grams: 20, use: 'postFermentation', contactHours: 24, temperatureC: 16 }),
    ]));
    expect(result.changes).toHaveLength(2);

    const corrected = prepare({ program: program([source]), operations: [{ ...draft, quantity: { kind: 'partial', grams: 12 } }],
      intent: { question: phrase, interpretation: 'Déplacement explicite d’une partie du houblon prévu.', criteria: [] } });
    expect(corrected.status).toBe('ready');
    expect(corrected.proposal?.program.additions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: source.id, grams: 28, use: 'fermentation' }),
      expect.objectContaining({ id: 'line-moved', grams: 12, use: 'postFermentation' }),
    ]));
  });

  it('couvre toutes les lignes futures seulement après choix explicite d’une voie', () => {
    const ops = [operation({ kind: 'replaceUnavailable', sourceMaterialId: 'source', coverage: { kind: 'allFuture' },
      candidateMaterialIds: ['target'], basisByUse: { postFermentation: 'sameMass' }, reason: 'Matière indiquée indisponible.' })];
    const options = prepare({ operations: ops });
    expect(options.status).toBe('needsInput');
    expect(options.evaluations[0].planner?.affectedAdditionIds).toEqual(['line-a']);
    const pathId = options.evaluations[0].planner!.paths[0].pathId;
    const selected = prepare({ operations: [{ ...ops[0], selection: { pathId } }] });
    expect(selected.status).toBe('ready');
    expect(selected.evaluations[0].selection?.selectedDoses).toEqual([expect.objectContaining({ additionId: 'line-a', materialId: 'target', grams: 30 })]);
    expect(selected.branch?.programChanges).toHaveLength(1);
  });

  it('rejette une source devenue périmée avant de préparer la branche', () => {
    const current = program();
    const result = prepare({ program: current, expectedProgramReference: 'ancienne-reference',
      operations: [operation({ kind: 'setDose', additionId: 'line-a', quantity: { kind: 'target', grams: 40 } })] });
    expect(result.status).toBe('blocked');
    expect(result.needs).toContainEqual(expect.objectContaining({ field: 'freshness' }));
    expect(result.operations).toHaveLength(1);
    expect(result.branch).toBeUndefined();
  });

  it('n’écrit ni recette, ni état de brassin, ni stock et garde les entrées intactes', () => {
    const sourceProgram = program();
    const sourceMaterials = [material('source'), material('target')];
    const beforeProgram = structuredClone(sourceProgram);
    const beforeMaterials = structuredClone(sourceMaterials);
    const result = prepare({ program: sourceProgram, materials: sourceMaterials,
      operations: [operation({ kind: 'setDose', additionId: 'line-a', quantity: { kind: 'target', grams: 40 } })] });
    expect(result.status).toBe('ready');
    expect(sourceProgram).toEqual(beforeProgram);
    expect(sourceMaterials).toEqual(beforeMaterials);
    expect(result.proposal?.stock).toContainEqual(expect.objectContaining({ materialId: 'source', status: 'available' }));
  });

  it('conserve une disponibilité inconnue dans la proposition sans la convertir en stock nul', () => {
    const result = prepare({ materials: [material('source'), material('target', null)], operations: [operation({ kind: 'add',
      additionId: 'line-new', materialId: 'target', grams: 12, use: 'postFermentation',
      conditions: { contactHours: 24, temperatureC: 16 } })] });
    expect(result.status).toBe('ready');
    expect(result.proposal?.applicability).toBe('conditional');
    expect(result.proposal?.stock).toContainEqual(expect.objectContaining({ materialId: 'target', neededGrams: 12, availableGrams: null, status: 'unknown' }));
  });
});
