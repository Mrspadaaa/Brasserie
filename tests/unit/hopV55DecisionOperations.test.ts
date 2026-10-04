import { describe, expect, it } from 'vitest';
import type { HopDecisionMaterial, HopDecisionProgram } from '../../src/domain/hopDecision/types';
import type { BrewingScenarioRuntimeCurrent } from '../../src/domain/brewingScenario';
import type { PreparedBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { prepareHopV55DecisionProgram } from '../../src/services/hopV55/decisionProgramPreparation';
import { readHopV55Question } from '../../src/services/hopV55/decision';

const source = { kind: 'observation' as const, title: 'Fixture décision Q04', author: 'Suite locale', year: 2026, reference: 'fixture:q04' };

function material(id: string, name: string): HopDecisionMaterial {
  return { id, name, form: 'pelletT90', availableGrams: 100,
    variety: { id: `variety:${id}`, name, aliases: [], form: 'pelletT90', analysis: [],
      descriptions: [{ text: 'Description synthétique de fixture.', context: 'rawHop', source }] } };
}

function makePrepared(program: HopDecisionProgram): PreparedBrewingScenarioContext {
  const rowSource = material('fixture:saaz', 'Saaz');
  const rowTarget = material('fixture:golding', 'Golding');
  const current: BrewingScenarioRuntimeCurrent = {
    recipeReference: 'fixture:q04-recipe', inputReference: 'fixture:q04-input',
    input: { volumeL: 20, additions: [], yeastId: null } as unknown as BrewingScenarioRuntimeCurrent['input'],
    program, performedAdditionIds: program.additions.filter(row => row.status === 'performed').map(row => row.id),
    culture: { state: 'unknown', members: [], explanation: 'Culture inconnue dans cette fixture.' },
  };
  return { version: 'brewing-scenario-context-v1', runtime: { engineData: { varieties: [], lots: [], knowledge: [] },
    materials: [rowSource, rowTarget], current }, limitations: [], provenance: ['Fixture synthétique locale.'] };
}

function program(status: 'planned' | 'performed' = 'planned'): HopDecisionProgram {
  return { id: 'fixture:q04-program', revision: 3, stage: 'planning', volumeL: 20, wortGravity: 1.048,
    additions: [
      { id: 'saaz-boil', materialId: 'fixture:saaz', grams: 20, use: 'boil', status, boilMinutes: 60 },
      { id: 'golding-cold', materialId: 'fixture:golding', grams: 30, use: 'postFermentation', status: 'planned', contactHours: 36, temperatureC: 16 },
    ] };
}

describe('opérations partielles depuis les fragments explicites', () => {
  it('ne transforme pas une possibilité vague en ajout, mais conserve un ajout précis et Q04 composé', () => {
    const prepared = makePrepared(program());
    const openPossibilities = [
      "Ou dans ma stout si j'amèrise avec nuget est-ce que je suis pas trop résineux ou au contraire pas assez et je peux aussi ajouter autre chose.",
      'Est-ce que je peux aussi ajouter autre chose ?',
      "Je voudrais comparer si j'ajoute quelque chose d'autre.",
    ];
    for (const question of openPossibilities) {
      const reading = readHopV55Question(question, prepared);
      expect(reading.operationDrafts).toBeUndefined();
      expect(reading.branches).toEqual([]);
    }

    const modalSpecific = readHopV55Question('Est-ce que je peux ajouter 20 g de Saaz au whirlpool ?', prepared);
    const modalAddition = modalSpecific.operationDrafts?.find(row => row.kind === 'add');
    expect(modalAddition).toMatchObject({ kind: 'add', grams: 20, use: 'whirlpool', targetScope: 'hotSide' });
    expect(modalAddition?.materialId).toBeUndefined();
    expect(modalAddition?.sourceSpan?.text.trim()).toBe('ajouter 20 g de Saaz au whirlpool');
    expect(modalSpecific.branches).toEqual([]);

    const mentionedMaterial = readHopV55Question('Je peux aussi ajouter autre chose de Saaz ?', prepared);
    const mentionedAddition = mentionedMaterial.operationDrafts?.find(row => row.kind === 'add');
    expect(mentionedAddition?.sourceSpan?.text).toContain('autre chose de Saaz');
    expect(mentionedAddition?.materialId).toBeUndefined();

    const imperative = readHopV55Question('Ajoute 20 g de Saaz au whirlpool.', prepared);
    expect(imperative.operationDrafts?.find(row => row.kind === 'add')).toMatchObject({
      kind: 'add', grams: 20, use: 'whirlpool', targetScope: 'hotSide',
    });
    expect(imperative.branches.length).toBeGreaterThan(0);

    const modalReplace = readHopV55Question('Qu’est-ce que je gagne à remplacer Saaz par Golding à même masse ?', prepared);
    expect(modalReplace.operationDrafts?.find(row => row.kind === 'replace')).toBeDefined();
    expect(modalReplace.branches).toEqual([]);
    const imperativeReplace = readHopV55Question('Remplace Saaz par Golding à même masse.', prepared);
    expect(imperativeReplace.branches.length).toBeGreaterThan(0);

    const composed = readHopV55Question('Est-ce que dans ma blanche je peux faire du dryhopping si j’ajoute 20g de moins dans le moût ?', prepared);
    expect(composed.operationDrafts).toHaveLength(2);
    expect(composed.operationDrafts?.find(row => row.kind === 'remove')).toMatchObject({
      kind: 'remove', quantity: { kind: 'partial', grams: 20 }, sourceScope: 'hotSide',
    });
    expect(composed.operationDrafts?.find(row => row.kind === 'add')).toMatchObject({ kind: 'add', targetScope: 'coldSide', grams: null });
    expect(composed.branches).toEqual([]);
  });

  it('garde les 20 g à retirer côté moût et le dry-hop incomplet sans choisir de matière, dose ou phase', () => {
    const question = 'Est-ce que dans ma blanche je peux faire du dryhopping si j’ajoute 20g de moins dans le moût?';
    const prepared = makePrepared(program());
    const reading = readHopV55Question(question, prepared);
    const drafts = reading.operationDrafts ?? [];
    const removal = drafts.find(row => row.kind === 'remove');
    const addition = drafts.find(row => row.kind === 'add');

    expect(reading.branches).toEqual([]);
    expect(drafts).toHaveLength(2);
    expect(removal).toMatchObject({ kind: 'remove', quantity: { kind: 'partial', grams: 20 }, sourceScope: 'hotSide' });
    expect(removal?.sourceSpan?.text).toBe('20g de moins dans le moût');
    expect(removal?.sourceUse).toBeUndefined();
    expect(addition).toMatchObject({ kind: 'add', targetScope: 'coldSide', grams: null });
    expect(addition?.materialId).toBeUndefined();
    expect(addition?.use).toBeUndefined();
    expect(addition?.sourceSpan?.text).toBe('faire du dryhopping');
    expect(reading.criterionDrafts.some(row => /^(?:mo[uû]t|wort|blanche)$/iu.test(row.term))).toBe(false);
    expect(drafts.map(row => row.id)).toEqual(readHopV55Question(question, prepared).operationDrafts!.map(row => row.id));
    for (const operation of drafts) {
      const span = operation.sourceSpan!;
      expect(question.slice(span.start, span.end)).toBe(span.text);
    }
  });

  it('garde deux quantités explicites distinctes et ne déduit pas la phase de « à froid »', () => {
    const question = 'Dans ma blanche, retirer 7,5 g de Saaz à l’ébullition et ajouter 7,5 g de Saaz à froid.';
    const reading = readHopV55Question(question, makePrepared(program()));
    const drafts = reading.operationDrafts ?? [];
    const removal = drafts.find(row => row.kind === 'remove');
    const addition = drafts.find(row => row.kind === 'add');

    expect(drafts).toHaveLength(2);
    expect(removal).toMatchObject({ kind: 'remove', quantity: { kind: 'partial', grams: 7.5 },
      sourceUse: 'boil', sourceScope: 'hotSide' });
    expect(addition).toMatchObject({ kind: 'add', grams: 7.5, targetScope: 'coldSide' });
    expect(addition?.use).toBeUndefined();
    expect(addition?.materialId).toBeUndefined();
    expect(reading.branches).toEqual([]);
  });

  it('conserve un remplacement comparatif incomplet sans choisir ligne, matière ou dose', () => {
    const question = 'Qu’est-ce que je gagne dans ma light lager à remplacer Saaz par Styrian Gold ?';
    const prepared = makePrepared(program());
    const reading = readHopV55Question(question, prepared);
    const draft = reading.operationDrafts?.find(row => row.kind === 'replace');

    expect(reading.branches).toEqual([]);
    expect(draft).toMatchObject({ kind: 'replace', label: 'remplacer Saaz par Styrian Gold' });
    expect(draft?.sourceMaterialId).toBeUndefined();
    expect(draft?.materialId).toBeUndefined();
    expect(draft?.additionId).toBeUndefined();
    expect(draft?.dose).toBeUndefined();
    expect(draft?.sourceSpan?.text).toBe('remplacer Saaz par Styrian Gold');
    expect(question.slice(draft!.sourceSpan!.start, draft!.sourceSpan!.end)).toBe(draft!.sourceSpan!.text);

    const result = prepareHopV55DecisionProgram({ branch: { id: 'replace-comparison', label: 'Remplacement à comparer' },
      program: prepared.runtime.current!.program!, materials: prepared.runtime.materials,
      intent: { question, interpretation: reading.interpretation, criteria: reading.response?.intent.criteria ?? [] },
      operations: [draft!] });
    expect(result.status).toBe('needsInput');
    expect(result.branch).toBeUndefined();
    expect(result.operations).toEqual([draft]);
    expect(result.evaluations[0].needs.map(row => row.field)).toContain('source');
    expect(prepared.runtime.current!.program!.additions).toEqual(program().additions);
  });

  it('transporte une demande de substitution indisponible sans ID source, candidat ni stock inventés', () => {
    const question = 'J’ai ce houblon conseillé dans ma recette mais je ne l’ai actuellement pas disponible, avec quoi le remplacer ? Qu’est-ce que je gagne ou perds ?';
    const prepared = makePrepared(program());
    const reading = readHopV55Question(question, prepared);
    const draft = reading.operationDrafts?.find(row => row.kind === 'replaceUnavailable');

    expect(reading.intent.question).toBe(question);
    expect(reading.branches).toEqual([]);
    expect(reading.criterionDrafts.some(row => /^(?:disponible|indisponible|stock)$/iu.test(row.term))).toBe(false);
    expect(draft).toMatchObject({ kind: 'replaceUnavailable' });
    expect(draft?.sourceMaterialId).toBeUndefined();
    expect(draft?.candidateMaterialIds).toBeUndefined();
    expect(draft?.coverage).toBeUndefined();
    expect(draft?.basisByUse).toBeUndefined();
    expect(draft?.sourceSpan?.text).toContain('pas disponible');
    expect(question.slice(draft!.sourceSpan!.start, draft!.sourceSpan!.end)).toBe(draft!.sourceSpan!.text);

    const before = structuredClone(prepared.runtime.current!.program!);
    const result = prepareHopV55DecisionProgram({ branch: { id: 'unavailable-source', label: 'Source à choisir' },
      program: prepared.runtime.current!.program!, materials: prepared.runtime.materials,
      intent: { question, interpretation: reading.interpretation, criteria: reading.response?.intent.criteria ?? [] },
      operations: [draft!] });
    expect(result.status).toBe('needsInput');
    expect(result.branch).toBeUndefined();
    expect(result.operations).toEqual([draft]);
    expect(result.evaluations[0].needs.map(row => row.field)).toEqual(expect.arrayContaining(['source', 'coverage', 'candidateMaterials']));
    expect(prepared.runtime.current!.program).toEqual(before);
  });

  it('ne transforme pas une dose non décidée en exclusion sensorielle et garde une vraie garde aromatique', () => {
    const question = 'Retirer 20 g d’Identité fictive A côté moût, puis ajouter à cru de l’Identité fictive C sans dose décidée.';
    const prepared = makePrepared(program());
    const reading = readHopV55Question(question, prepared);

    expect(reading.intent.question).toBe(question);
    expect(reading.intent.criteria).toEqual([]);
    expect(reading.criterionDrafts.some(row => /dose|décidée/i.test(row.term))).toBe(false);
    expect(reading.branches).toEqual([]);
    expect(reading.operationDrafts).toHaveLength(2);
    expect(reading.operationDrafts?.find(row => row.kind === 'remove')).toMatchObject({
      kind: 'remove', quantity: { kind: 'partial', grams: 20 }, sourceScope: 'hotSide',
    });
    const add = reading.operationDrafts?.find(row => row.kind === 'add');
    expect(add).toMatchObject({ kind: 'add', grams: null, targetScope: 'coldSide' });
    expect(add?.use).toBeUndefined();
    for (const operation of reading.operationDrafts ?? []) {
      const span = operation.sourceSpan!;
      expect(question.slice(span.start, span.end)).toBe(span.text);
    }

    const guardedQuestion = question.replace('sans dose décidée.', 'sans dose décidée; sans résine.');
    const guarded = readHopV55Question(guardedQuestion, prepared);
    expect(guarded.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'À exclure : résine', direction: 'exclude', familyId: 'resin' }),
    ]));
    expect(guarded.intent.criteria.some(row => /dose|décidée/i.test(row.label))).toBe(false);

    const replacement = readHopV55Question(
      'Remplacer Saaz par Golding sans fixer la dose avant la comparaison des fiches.', makePrepared(program()),
    );
    expect(replacement.intent.criteria.some(row => /dose|fixer|avant|comparaison/i.test(row.label))).toBe(false);
  });

  it('conserve la demande mais laisse le service typed bloquer une ligne source déjà effectuée', () => {
    const question = 'Dans ma blanche, faire du dryhopping si je retire 20 g de moins dans le moût.';
    const prepared = makePrepared(program('performed'));
    const reading = readHopV55Question(question, prepared);
    const operations = reading.operationDrafts ?? [];
    const result = prepareHopV55DecisionProgram({
      branch: { id: 'q04-partial-seed', label: 'Préparation depuis la question composée' },
      program: prepared.runtime.current!.program!, materials: prepared.runtime.materials,
      intent: { question: reading.intent.question, interpretation: reading.interpretation,
        criteria: reading.response?.intent.criteria ?? [] },
      operations,
    });

    expect(result.status).toBe('blocked');
    expect(result.branch).toBeUndefined();
    expect(result.operations).toEqual(operations);
    expect(result.evaluations.find(row => row.operationId === operations.find(item => item.kind === 'remove')?.id))
      .toMatchObject({ status: 'blocked', sourceCandidates: [expect.objectContaining({ id: 'saaz-boil', status: 'performed' })] });
    expect(prepared.runtime.current!.program!.additions.find(row => row.id === 'saaz-boil')?.grams).toBe(20);
  });
});
