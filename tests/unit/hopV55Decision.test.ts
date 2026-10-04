import { describe, expect, it } from 'vitest';
import type { HopDecisionMaterial, HopDecisionProgram, HopUse } from '../../src/domain/hopDecision/types';
import type { BrewingScenarioRuntimeCurrent } from '../../src/domain/brewingScenario';
import type { PreparedBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { HOP_COMMERCIAL_PRODUCTS } from '../../src/domain/hopDecision/products';
import { readHopV55Question, type HopV55QuestionReading } from '../../src/services/hopV55/decision';
import { createHopV55DecisionReadingArchive, readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';

const source = {
  kind: 'observation' as const,
  title: 'Fixture de test V5.5',
  author: 'Suite locale',
  year: 2026,
  reference: 'fixture:hop-v55-decision',
  locator: 'Descriptions synthétiques destinées au test; aucune analyse réelle.',
};

function material(id: string, name: string, description: string, availableGrams = 500): HopDecisionMaterial {
  return {
    id, name, form: 'pelletT90', availableGrams,
    variety: {
      id: 'variety:' + id, name, aliases: [], form: 'pelletT90', analysis: [],
      descriptions: [{ text: description, context: 'rawHop', source }],
    },
  };
}

function currentProgram(input: {
  stage?: HopDecisionProgram['stage'];
  additions?: HopDecisionProgram['additions'];
} = {}): HopDecisionProgram {
  return {
    id: 'fixture-v55-program', revision: 2, stage: input.stage ?? 'planning',
    volumeL: 20, wortGravity: 1.048,
    additions: input.additions ?? [],
  };
}

function prepared(materials: HopDecisionMaterial[], program: HopDecisionProgram | null = null): PreparedBrewingScenarioContext {
  const current: BrewingScenarioRuntimeCurrent = {
    recipeReference: 'fixture:recipe-reference',
    inputReference: 'fixture:input-reference',
    input: { volumeL: 20, additions: [], yeastId: null } as unknown as BrewingScenarioRuntimeCurrent['input'],
    program,
    performedAdditionIds: program?.additions.filter(row => row.status === 'performed').map(row => row.id) ?? [],
    culture: { state: 'unknown', members: [], explanation: 'Fixture sans identité de levure.' },
    beerContext: { facts: [{
      id: 'fixture-style-target', field: 'style.name', status: 'target', origin: 'userHypothesis',
      value: 'Lager maison fictive', source,
    }] },
  };
  return {
    version: 'brewing-scenario-context-v1',
    runtime: { engineData: { varieties: [], lots: [], knowledge: [] }, materials: structuredClone(materials), current },
    limitations: [], provenance: ['Données de démonstration du test.'],
  };
}

describe('readHopV55Question', () => {
  const resin = material('fixture:resin', 'Échantillon résineux', 'pine resin', 100);
  const tropical = material('fixture:tropical', 'Lot tropical maison', 'tropical mango', 100);
  const citrus = material('fixture:citrus', 'Référence agrumes', 'citrus grapefruit', 100);

  it('conserve la question, une amertume élevée et une mention tropicale facultative sans inventer de programme', () => {
    const question = 'Quelle forte amertume sans sapin/résine, sans rechercher forcément le tropical ?';
    const reading = readHopV55Question(question, prepared([resin, tropical, citrus], null));

    expect(reading.intent.question).toBe(question);
    expect(reading.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ familyId: 'resin', direction: 'exclude' }),
      expect.objectContaining({ label: expect.stringMatching(/amertume/i), direction: 'increase' }),
    ]));
    expect(reading.intent.criteria.some(row => row.familyId === 'tropical')).toBe(false);
    expect(reading.criterionDrafts).toEqual(expect.arrayContaining([
      expect.objectContaining({ term: 'tropical', direction: null, requirement: 'optional' }),
    ]));
    expect(reading.branches).toEqual([]);
    expect(reading.response?.actionKind).toBe('exploreStrategies');
    expect(reading.response?.intent.originalQuestion).toBe(question);
    expect(reading.response?.result.limitations.join(' ')).toMatch(/programme vaut null/);
  });

  it('garde la question exacte, une exclusion hors lexique et sa qualification manquante', () => {
    const question = 'Je veux plus de floral, garder les agrumes, sans résine ni coco, pas plus d’amertume.';
    const exact = readHopV55Question(question, prepared([resin, tropical, citrus], null));

    expect(exact.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ familyId: 'floral', direction: 'increase' }),
      expect.objectContaining({ familyId: 'citrus', direction: 'keep' }),
      expect.objectContaining({ familyId: 'resin', direction: 'exclude' }),
      expect.objectContaining({ label: 'Ne pas augmenter : amertume', direction: 'keep' }),
      expect.objectContaining({ label: 'À exclure : coco', direction: 'exclude' }),
    ]));
    expect(exact.intent.criteria.find(row => row.label === 'À exclure : coco')?.familyId).toBeUndefined();
    expect(exact.intent.question).toBe(question);
    expect(exact.unresolved.join(' ')).toMatch(/« coco ».*aucune famille ou dimension/u);
    expect(exact.response?.intent.originalQuestion).toBe(question);

    const variation = readHopV55Question(
      question.replace('coco', 'nori'),
      prepared([resin, tropical, citrus], null),
    );
    expect(variation.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'À exclure : nori', direction: 'exclude' }),
    ]));
    expect(variation.intent.criteria.find(row => row.label === 'À exclure : nori')?.familyId).toBeUndefined();
    expect(variation.unresolved.join(' ')).toMatch(/« nori ».*aucune famille ou dimension/u);

    const positiveUnknown = readHopV55Question('Je veux plus de juteux.', prepared([resin, tropical, citrus], null));
    expect(positiveUnknown.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'À rechercher : juteux', direction: 'increase' }),
    ]));
    expect(positiveUnknown.intent.criteria.find(row => row.label === 'À rechercher : juteux')?.familyId).toBeUndefined();
    expect(positiveUnknown.unresolved.join(' ')).toMatch(/« juteux ».*aucune famille ou dimension/u);
  });

  it('ne transforme pas un pronom de liaison en critère et garde les caractères sensoriels inconnus', () => {
    const question = "Je voudrais une Lager ultra juicy, hyper aromatisé, sans Quelle soit amère. J'ai quoi comme choix.";
    const reading = readHopV55Question(question, prepared([resin, tropical, citrus], currentProgram()));

    expect(reading.criterionDrafts.some(row => row.term.toLocaleLowerCase('fr') === 'quelle')).toBe(false);
    expect(reading.criterionDrafts).toEqual(expect.arrayContaining([
      expect.objectContaining({ term: 'amère', dimension: 'other', direction: 'exclude', requirement: 'required' }),
      expect.objectContaining({ term: 'juicy', direction: 'increase', requirement: 'required', origin: 'parser' }),
      expect.objectContaining({ term: 'aromatisé', direction: 'increase', requirement: 'required', origin: 'parser' }),
    ]));
    expect(reading.criterionDrafts.find(row => row.term === 'juicy')?.familyId).toBeUndefined();
    expect(reading.criterionDrafts.find(row => row.term === 'aromatisé')?.familyId).toBeUndefined();
    for (const row of reading.criterionDrafts) {
      expect(question.slice(row.source.start, row.source.end)).toBe(row.source.text);
    }

    const unknownTaste = 'Sans cette note de fraise inconnue, garder le citron.';
    const unknownReading = readHopV55Question(unknownTaste, prepared([resin, tropical, citrus], currentProgram()));
    expect(unknownReading.criterionDrafts).toEqual(expect.arrayContaining([
      expect.objectContaining({ term: 'fraise', direction: 'exclude', requirement: 'required' }),
    ]));
    expect(unknownTaste.slice(
      unknownReading.criterionDrafts.find(row => row.term === 'fraise')!.source.start,
      unknownReading.criterionDrafts.find(row => row.term === 'fraise')!.source.end,
    )).toBe('fraise');
  });

  it('lit R20 comme des actes liés et conserve les termes exacts sans choisir une amertume', () => {
    const question = 'Ma bière me paraît trop douce. Je cherche à comprendre si le houblon pourrait compenser cette impression, sans décider d’augmenter l’amertume. Je veux conserver la poire. Comment caractériser mon houblon de jardin avant de choisir ?';
    const context = prepared([resin, tropical, citrus], currentProgram());
    const reading = readHopV55Question(question, context);
    const sweetness = reading.criterionDrafts.find(row => row.source.text === 'douce');
    const compensation = reading.criterionDrafts.find(row => row.source.text === 'compenser');
    const bitterness = reading.criterionDrafts.find(row => row.source.text === 'amertume');
    const pear = reading.criterionDrafts.find(row => row.source.text === 'poire');
    const characterization = reading.criterionDrafts.find(row => row.source.text === 'mon houblon de jardin');

    expect.soft(reading.intent.question).toBe(question);
    expect.soft(sweetness).toMatchObject({ term: 'douce', direction: null, requirement: 'optional', origin: 'parser' });
    expect.soft(compensation).toMatchObject({ term: 'compenser', direction: null, requirement: 'optional', origin: 'parser',
      qualification: expect.stringMatching(/demande de compensation/i) });
    expect.soft(bitterness?.direction).not.toBe('increase');
    expect.soft(pear).toMatchObject({ term: 'poire', direction: 'keep', requirement: 'required' });
    expect.soft(characterization).toMatchObject({ term: 'mon houblon de jardin', direction: null, requirement: 'optional',
      qualification: expect.stringMatching(/caractérisation matière demandée.*identité.*non fournies/i) });
    expect.soft(reading.criterionDrafts.some(row => row.term === 'si' || row.term === 'augmenter')).toBe(false);
    expect.soft(reading.intent.criteria.some(row => /amertume/i.test(row.label) && row.direction === 'increase')).toBe(false);
    for (const row of reading.criterionDrafts) expect.soft(question.slice(row.source.start, row.source.end)).toBe(row.source.text);

    const explicitIncrease = readHopV55Question('Ma bière me paraît trop douce. Je veux augmenter l’amertume.', context);
    expect(explicitIncrease.criterionDrafts.find(row => row.source.text === 'amertume'))
      .toMatchObject({ direction: 'increase', requirement: 'required' });
    expect(explicitIncrease.criterionDrafts.find(row => row.source.text === 'douce'))
      .toMatchObject({ direction: null, requirement: 'optional' });

    const coordinated = readHopV55Question(
      'Ma bière me paraît trop douce et je veux augmenter l’amertume tout en préservant le floral.', context,
    );
    expect(coordinated.criterionDrafts.find(row => row.source.text === 'douce'))
      .toMatchObject({ direction: null, requirement: 'optional' });
    expect(coordinated.criterionDrafts.find(row => row.source.text === 'amertume'))
      .toMatchObject({ direction: 'increase', requirement: 'required' });
    expect(coordinated.criterionDrafts.find(row => row.source.text === 'floral'))
      .toMatchObject({ direction: 'keep', requirement: 'required' });
    for (const row of coordinated.criterionDrafts) {
      expect(coordinated.intent.question.slice(row.source.start, row.source.end)).toBe(row.source.text);
    }
  });

  it('garde le qualificatif haut taux lors de la proposition d’alias amertum', () => {
    const question = 'Je veux éviter le pin, mais chercher un haut taux d’amertum.';
    const reading = readHopV55Question(question, prepared([resin, tropical, citrus], currentProgram()));
    const candidate = reading.criterionDrafts.find(row => row.term === 'amertum');
    expect(candidate).toMatchObject({ source: expect.objectContaining({ text: 'amertum' }), direction: 'increase',
      qualification: expect.stringMatching(/haut taux.*proche de « amertume ».*proposé.*confirmer/i) });
    expect(question.slice(candidate!.source.start, candidate!.source.end)).toBe('amertum');
    expect(reading.intent.criteria.some(row => /amertume/i.test(row.label) && /haut taux/i.test(row.label))).toBe(true);
  });

  it('préserve les nuances fines distinctes et lit une garde de non-augmentation sans inverser son sens', () => {
    const question = 'Plus de poire et de thé, garder le floral, ne pas augmenter l’amertume, sans coco.';
    const context = prepared([resin, tropical, citrus], currentProgram());
    const before = structuredClone(context);
    const reading = readHopV55Question(question, context);

    expect(reading.intent.question).toBe(question);
    expect(context).toEqual(before);
    expect(reading.branches).toEqual([]);
    expect(reading.response?.actionKind).toBe('exploreStrategies');
    expect(reading.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'À rechercher : poire', direction: 'increase', familyId: 'pomeFruit' }),
      expect.objectContaining({ label: 'À rechercher : thé', direction: 'increase', familyId: 'herbal' }),
      expect.objectContaining({ label: 'À préserver : floral', direction: 'keep', familyId: 'floral' }),
      expect.objectContaining({ label: 'Ne pas augmenter : amertume', direction: 'keep' }),
      expect.objectContaining({ label: 'À exclure : coco', direction: 'exclude' }),
    ]));
    expect(reading.intent.criteria.find(row => row.label === 'À exclure : coco')?.familyId).toBeUndefined();

    const responseCriteria = reading.response?.criteria ?? [];
    expect(responseCriteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ description: 'À rechercher : poire', familyId: 'pomeFruit', role: 'seek', origin: 'user' }),
      expect.objectContaining({ description: 'À rechercher : thé', familyId: 'herbal', role: 'seek', origin: 'user' }),
      expect.objectContaining({ description: 'À préserver : floral', familyId: 'floral', role: 'preserve', origin: 'user' }),
      expect.objectContaining({ description: 'Ne pas augmenter : amertume', role: 'preserve', origin: 'user' }),
    ]));
    expect(reading.response?.intent.originalQuestion).toBe(question);
  });

  it('garde les termes exacts même lorsqu’ils partagent une famille et distingue les variantes directionnelles', () => {
    const sameFamily = readHopV55Question('Plus de poire et de pomme.', prepared([resin], currentProgram()));
    expect(sameFamily.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'À rechercher : poire', direction: 'increase', familyId: 'pomeFruit' }),
      expect.objectContaining({ label: 'À rechercher : pomme', direction: 'increase', familyId: 'pomeFruit' }),
    ]));
    expect(sameFamily.intent.criteria.filter(row => row.familyId === 'pomeFruit')).toHaveLength(2);

    const noMore = readHopV55Question('Pas plus d’amertume.', prepared([resin], currentProgram()));
    expect(noMore.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Ne pas augmenter : amertume', direction: 'keep' }),
    ]));

    const positive = readHopV55Question('Augmenter l’amertume.', prepared([resin], currentProgram()));
    expect(positive.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'À rechercher : amertume', direction: 'increase' }),
    ]));

    const coordinated = readHopV55Question(
      'Ne pas augmenter l’amertume ni la résine, mais augmenter la poire.',
      prepared([resin], currentProgram()),
    );
    expect(coordinated.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Ne pas augmenter : amertume', direction: 'keep' }),
      expect.objectContaining({ label: 'Ne pas augmenter : résine', direction: 'keep', familyId: 'resin' }),
      expect.objectContaining({ label: 'À rechercher : poire', direction: 'increase', familyId: 'pomeFruit' }),
    ]));

    const laterPositive = readHopV55Question(
      'Ne pas augmenter l’amertume et augmenter la résine.',
      prepared([resin], currentProgram()),
    );
    expect(laterPositive.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Ne pas augmenter : amertume', direction: 'keep' }),
      expect.objectContaining({ label: 'À rechercher : résine', direction: 'increase', familyId: 'resin' }),
    ]));

    const unresolvedGuard = readHopV55Question(
      'Ne pas augmenter le Juteux et ne pas diminuer la finale longue.',
      prepared([resin], currentProgram()),
    );
    expect(unresolvedGuard.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Ne pas augmenter : Juteux', direction: 'keep' }),
      expect.objectContaining({ label: 'Ne pas diminuer : finale', direction: 'keep' }),
    ]));
  });

  it('ne transforme pas un geste ou une durée de procédé en objectif sensoriel', () => {
    const question = 'Plus de poire et de thé, garder le floral, ne pas augmenter l’amertume, sans coco; prévoir un ajout long.';
    const reading = readHopV55Question(question, prepared([resin, tropical, citrus], currentProgram()));

    expect(reading.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'À rechercher : poire', familyId: 'pomeFruit' }),
      expect.objectContaining({ label: 'À rechercher : thé', familyId: 'herbal' }),
      expect.objectContaining({ label: 'À préserver : floral', familyId: 'floral' }),
      expect.objectContaining({ label: 'Ne pas augmenter : amertume', direction: 'keep' }),
    ]));
    expect(reading.intent.criteria.some(row => /ajout|long/iu.test(row.label))).toBe(false);
    expect(reading.response?.intent.criteria.some(row => /ajout|long/iu.test(row.description))).toBe(false);
    expect(reading.intent.question).toBe(question);
  });

  it('reconnaît les opérateurs génériques de conservation sans convertir un examen en intention', () => {
    const question = 'Plus de poire, préserver le floral et maintenir le thé, ne pas augmenter l’amertume.';
    const reading = readHopV55Question(question, prepared([resin, tropical, citrus], currentProgram()));

    expect(reading.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'À rechercher : poire', familyId: 'pomeFruit', direction: 'increase' }),
      expect.objectContaining({ label: 'À préserver : floral', familyId: 'floral', direction: 'keep' }),
      expect.objectContaining({ label: 'À préserver : thé', familyId: 'herbal', direction: 'keep' }),
      expect.objectContaining({ label: 'Ne pas augmenter : amertume', direction: 'keep' }),
    ]));
    expect(reading.response?.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ description: 'À préserver : floral', familyId: 'floral', role: 'preserve' }),
      expect.objectContaining({ description: 'À préserver : thé', familyId: 'herbal', role: 'preserve' }),
      expect.objectContaining({ description: 'Ne pas augmenter : amertume', role: 'preserve' }),
    ]));

    const conjugations = [
      { question: 'Préserve le floral.', term: 'floral', familyId: 'floral' },
      { question: 'Conserver la poire.', term: 'poire', familyId: 'pomeFruit' },
      { question: 'Maintiens le thé.', term: 'thé', familyId: 'herbal' },
      { question: 'Preserve the floral.', term: 'floral', familyId: 'floral' },
      { question: 'Maintain the tea.', term: 'tea', familyId: 'herbal' },
    ];
    for (const variant of conjugations) {
      const parsed = readHopV55Question(variant.question, prepared([resin, tropical, citrus], currentProgram()));
      expect(parsed.intent.criteria).toEqual(expect.arrayContaining([
        expect.objectContaining({ label: `À préserver : ${variant.term}`, familyId: variant.familyId, direction: 'keep' }),
      ]));
    }

    const coordinated = readHopV55Question(
      'Ne pas augmenter l’amertume et préserver le floral.',
      prepared([resin, tropical, citrus], currentProgram()),
    );
    expect(coordinated.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Ne pas augmenter : amertume', direction: 'keep' }),
      expect.objectContaining({ label: 'À préserver : floral', familyId: 'floral', direction: 'keep' }),
    ]));

    const examined = readHopV55Question(
      'Examiner pourquoi le floral est cité et comparer les descriptions de poire.',
      prepared([resin, tropical, citrus], currentProgram()),
    );
    expect(examined.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'À examiner : floral', familyId: 'floral', direction: 'investigate' }),
      expect.objectContaining({ label: 'À examiner : poire', familyId: 'pomeFruit', direction: 'investigate' }),
    ]));
    expect(examined.intent.criteria.some(row => row.direction === 'keep' || row.direction === 'increase')).toBe(false);

    const legacyReading = {
      intent: reading.intent, interpretation: reading.interpretation, response: reading.response,
      branches: reading.branches, unresolved: reading.unresolved,
    } as HopV55QuestionReading;
    const archive = createHopV55DecisionReadingArchive({ id: 'reading-preservation-v1', ownerKey: 'owner-fixture',
      workspaceId: 'workspace-preservation-fixture', recordedAt: '2026-10-02T08:10:00.000Z', reading: legacyReading,
      source: { kind: 'exploration' }, runtimeReference: 'fixture-runtime-v1' });
    const archived = readHopV55DecisionReadingArchive(archive);
    expect(archived).toMatchObject({ status: 'available', archive: { reading: { intent: { question, criteria: reading.intent.criteria } } } });
    const altered = structuredClone(archive);
    altered.reading.intent.criteria.find(row => row.familyId === 'floral')!.label = 'À examiner : floral';
    expect(readHopV55DecisionReadingArchive(altered)).toMatchObject({ status: 'invalidRecord' });
  });

  it('ne transforme pas un verbe d’opération nié en critère libre quand le terme suivant est inconnu', () => {
    const question = 'Ne pas augmenter l’amertume et sans augmenter le coco; ne pas diminuer le nori.';
    const reading = readHopV55Question(question, prepared([resin, tropical, citrus], null));

    expect(reading.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Ne pas augmenter : amertume', direction: 'keep' }),
      expect.objectContaining({ label: 'Ne pas augmenter : coco', direction: 'keep' }),
      expect.objectContaining({ label: 'Ne pas diminuer : nori', direction: 'keep' }),
    ]));
    expect(reading.intent.criteria.some(row => /^À exclure : (?:augmenter|diminuer)$/u.test(row.label))).toBe(false);
    expect(reading.intent.criteria.some(row => /coco|nori/u.test(row.label) && row.familyId)).toBe(false);
    expect(reading.response?.intent.originalQuestion).toBe(question);
    expect(reading.branches).toEqual([]);
  });

  it('lit Q07 sans inverser les gardes, conserve la qualification et annote le tropical facultatif', () => {
    const preparedContext = prepared([resin, tropical, citrus], currentProgram());
    const original = 'Je veux absolument éviter le côté sapins, résine, mais je veux quand même un haut taux d’amertume sans forcément le côté tropicale.';
    const reading = readHopV55Question(original, preparedContext);

    expect(reading.intent.question).toBe(original);
    expect(reading.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ direction: 'exclude', familyId: 'resin' }),
      expect.objectContaining({ direction: 'increase', label: expect.stringMatching(/amertume/i) }),
    ]));
    expect(reading.intent.criteria.some(row => /côté/i.test(row.label))).toBe(false);
    expect(reading.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'À exclure : sapins', direction: 'exclude' }),
    ]));
    expect(reading.intent.criteria.some(row => row.familyId === 'tropical')).toBe(false);
    expect(reading.criterionDrafts).toEqual(expect.arrayContaining([
      expect.objectContaining({ term: 'amertume', direction: 'increase', requirement: 'required', qualification: 'haut taux' }),
      expect.objectContaining({ term: 'tropicale', direction: null, requirement: 'optional', origin: 'parser' }),
    ]));
    for (const criterion of reading.criterionDrafts) {
      expect(original.slice(criterion.source.start, criterion.source.end)).toBe(criterion.source.text);
    }
    expect(reading.response?.intent.criteria.some(row => row.familyId === 'tropical')).toBe(false);
    expect(reading.response?.intent.criteria.some(row => row.role === 'observation' && /tropical/i.test(row.description))).toBe(false);

    const alternate = 'Je veux éviter pin et résine et garder une amertume élevée; le tropical est non requis et non exclu.';
    const alternativeReading = readHopV55Question(alternate, preparedContext);
    expect(alternativeReading.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ direction: 'exclude', familyId: 'resin' }),
      expect.objectContaining({ direction: 'keep', label: expect.stringMatching(/amertume/i) }),
    ]));
    expect(alternativeReading.intent.criteria.some(row => row.familyId === 'tropical')).toBe(false);
    expect(alternativeReading.criterionDrafts).toEqual(expect.arrayContaining([
      expect.objectContaining({ term: 'amertume', direction: 'keep', requirement: 'required', qualification: 'élevée' }),
      expect.objectContaining({ term: 'tropical', direction: null, requirement: 'optional' }),
    ]));
  });

  it('ne convertit pas les mots de relation et les données absentes en objectifs de bière', () => {
    const question = 'Dans ma blanche, déplacer 20 g de Saaz; la source manque, aucune autre information disponible et sans analyse.';
    const reading = readHopV55Question(question, prepared([resin, tropical, citrus], currentProgram()));
    const terms = reading.intent.criteria.map(row => row.label.toLocaleLowerCase('fr'));

    expect(terms.some(label => /\b(?:dans|côté|source|information|analyse)\b/u.test(label))).toBe(false);
    expect(reading.intent.question).toBe(question);
    expect(reading.branches).toEqual([]);
  });

  it('garde le stade temporel comme contexte et conserve une vraie demande de goût libre', () => {
    const context = prepared([resin, tropical, citrus], currentProgram());
    const question = 'Ma bière est trop sucrée. Que puis-je encore compenser avec le houblon à ce stade ?';
    const reading = readHopV55Question(question, context);

    expect(reading.intent.question).toBe(question);
    // A declarative complaint is a reported observation: no reduction is sent to the strategy service.
    expect(reading.intent.criteria.some(row => /sucrée/u.test(row.label))).toBe(false);
    expect(reading.criterionDrafts.find(row => row.term === 'sucrée')).toMatchObject({
      direction: null, requirement: 'optional', qualification: expect.stringMatching(/observation déclarée/iu),
    });
    expect(reading.criterionDrafts.some(row => /stade|stage|moment|contexte/i.test(row.term))).toBe(false);
    // Contrast: a reduction actually requested stays a directed criterion.
    const requested = readHopV55Question('Je veux une bière moins sucrée.', context);
    expect(requested.intent.criteria).toEqual([
      expect.objectContaining({ label: 'À réduire : sucrée', direction: 'decrease' }),
    ]);

    const freeTaste = readHopV55Question('À ce stade, plus de coco.', context);
    expect(freeTaste.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'À rechercher : coco', direction: 'increase' }),
    ]));
    expect(freeTaste.intent.criteria.some(row => /stade/i.test(row.label))).toBe(false);
    expect(freeTaste.criterionDrafts).toEqual(expect.arrayContaining([
      expect.objectContaining({ term: 'coco', direction: 'increase', source: expect.objectContaining({ text: 'coco' }) }),
    ]));
    expect(freeTaste.criterionDrafts.some(row => /stade/i.test(row.term))).toBe(false);
    for (const draft of freeTaste.criterionDrafts) {
      expect(freeTaste.intent.question.slice(draft.source.start, draft.source.end)).toBe(draft.source.text);
    }
  });

  it('préserve la relation de préférence partenaire et distingue le contexte sans alcool d’un levier biotransformation', () => {
    const context = prepared([resin, tropical, citrus], currentProgram());
    const pairingQuestion = 'Je veux une blanche ultra tropicale qui se marie bien avec mon goût de banane.';
    const pairing = readHopV55Question(pairingQuestion, context);

    expect(pairing.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: expect.stringMatching(/tropical/i), direction: 'increase', familyId: 'tropical' }),
    ]));
    expect(pairing.criterionDrafts).toEqual(expect.arrayContaining([
      expect.objectContaining({ term: 'banane', direction: null, requirement: 'optional', qualification: expect.stringMatching(/préférence.*partenaire/i) }),
    ]));
    expect(pairing.intent.criteria.some(row => /banane/i.test(row.label))).toBe(false);
    for (const draft of pairing.criterionDrafts) {
      expect(pairingQuestion.slice(draft.source.start, draft.source.end)).toBe(draft.source.text);
    }

    const noloQuestion = 'Dans cette bière sans alcool, quelles pistes documentaires peuvent accompagner une note de banane, et quelles limites empêchent de transférer directement une biotransformation observée en bière alcoolisée ?';
    const nolo = readHopV55Question(noloQuestion, context);
    expect(nolo.interpretation).not.toMatch(/geste direct de type move|Le geste move reste une demande/u);
    expect(nolo.operationDrafts).toBeUndefined();
    expect(nolo.criterionDrafts.some(row => row.term.toLocaleLowerCase('fr') === 'alcool')).toBe(false);
    expect(nolo.intent.criteria.some(row => /alcool/i.test(row.label))).toBe(false);
    expect(nolo.criterionDrafts).toEqual(expect.arrayContaining([
      expect.objectContaining({ term: 'biotransformation', direction: 'investigate', requirement: 'required' }),
      expect.objectContaining({ term: 'banane', direction: null, requirement: 'optional', qualification: expect.stringMatching(/note de contexte/i) }),
    ]));
    expect(nolo.intent.criteria.some(row => row.direction === 'exclude' && /biotransformation|banane|alcool/i.test(row.label))).toBe(false);
    expect(nolo.intent.question).toBe(noloQuestion);

    const realExclusion = readHopV55Question('Dans cette bière sans alcool, éviter la résine.', context);
    expect(realExclusion.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ direction: 'exclude', familyId: 'resin' }),
    ]));

    const noGuarantee = readHopV55Question(
      'Sans garantir une biotransformation, quelles limites documentaires examiner et éviter la résine.', context,
    );
    expect(noGuarantee.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ direction: 'investigate', label: expect.stringMatching(/biotransformation/i) }),
      expect.objectContaining({ direction: 'exclude', familyId: 'resin' }),
    ]));
    expect(noGuarantee.intent.criteria.some(row => row.direction === 'exclude' && /biotransformation/i.test(row.label))).toBe(false);

    const cascade = material('fixture:cascade', 'Cascade', 'citrus grapefruit');
    const physicalMoveProgram = currentProgram({ additions: [
      { id: 'cascade-boil', materialId: cascade.id, grams: 20, use: 'boil', status: 'planned' },
    ] });
    const transfer = readHopV55Question('Transférer 20 g de Cascade de l’ébullition vers le whirlpool.',
      prepared([cascade], physicalMoveProgram));
    expect(transfer.interpretation).toContain('déplacer un ajout');
    expect(transfer.interpretation).not.toMatch(/\b(?:move|add|dose|replace|remove)\b/u);
    expect(transfer.branches).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'direct-move' })]));

    const movedAddition = readHopV55Question('Déplacer un ajout de Cascade de l’ébullition au whirlpool.',
      prepared([cascade], physicalMoveProgram));
    expect(movedAddition.interpretation).toContain('déplacer un ajout');
    expect(movedAddition.interpretation).not.toMatch(/\b(?:move|add|dose|replace|remove)\b/u);
    expect(movedAddition.branches).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'direct-move' })]));

    for (const question of [
      'Déplacer Cascade après fermentation.',
      'Déplacer les ajouts de Cascade après fermentation.',
      'Déplacer cet ajout de Cascade après fermentation.',
    ]) {
      const movedByIdentity = readHopV55Question(question, prepared([cascade], physicalMoveProgram));
      expect(movedByIdentity.interpretation).toContain('déplacer un ajout');
      expect(movedByIdentity.branches).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'direct-move' })]));
    }

    const mixed = readHopV55Question(
      noloQuestion + ' Et déplacer 20 g de Cascade de l’ébullition vers le whirlpool.',
      prepared([cascade], physicalMoveProgram),
    );
    expect(mixed.branches).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'direct-move' })]));
    expect(mixed.interpretation).toContain('déplacer un ajout');
    expect(mixed.interpretation).not.toMatch(/\b(?:move|add|dose|replace|remove)\b/u);

    const gestureLabels = [
      { question: 'Ajouter 20 g de Cascade à l’ébullition.', label: 'ajouter un houblon' },
      { question: 'Augmente la dose de Cascade à l’ébullition.', label: 'régler une dose' },
      { question: 'Remplacer Cascade par Citra à l’ébullition.', label: 'remplacer un ajout' },
      { question: 'Retirer 5 g de Cascade à l’ébullition.', label: 'retirer un ajout' },
    ];
    for (const gesture of gestureLabels) {
      const described = readHopV55Question(gesture.question, prepared([cascade], physicalMoveProgram));
      expect(described.interpretation).toContain(gesture.label);
      expect(described.interpretation).not.toMatch(/(?:geste direct de type|geste demandé\s*:\s*«|demande\s*«)(?:move|add|dose|replace|remove)\b/u);
    }
  });

  it('ne confond pas le nom d’un champ de procédé nié avec un second geste', () => {
    const question = 'Remplace un ajout prévu par Hallertau, sans fixer la dose pour le moment. Je veux plus de poire, garder le floral et ne pas augmenter l’amertume.';
    const reading = readHopV55Question(question, prepared([resin, tropical, citrus], currentProgram()));
    expect(reading.interpretation).toContain('remplacer un ajout');
    expect(reading.unresolved.join(' ')).not.toMatch(/Plusieurs gestes actifs/u);
    expect(reading.interpretation).not.toContain('plusieurs gestes');
    expect(reading.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ familyId: 'pomeFruit', direction: 'increase' }),
      expect.objectContaining({ familyId: 'floral', direction: 'keep' }),
      expect.objectContaining({ label: expect.stringMatching(/amertume/i), direction: 'keep' }),
    ]));

    const noDoseYet = readHopV55Question('Remplace un ajout prévu par Hallertau, sans dose décidée.',
      prepared([resin, tropical, citrus], currentProgram()));
    expect(noDoseYet.interpretation).toContain('remplacer un ajout');
    expect(noDoseYet.unresolved.join(' ')).not.toMatch(/Plusieurs gestes actifs/u);

    const explicitDose = readHopV55Question(
      'Remplacer un ajout prévu par Hallertau et régler la dose à 10 g en gardant le floral.',
      prepared([resin, tropical, citrus], currentProgram()),
    );
    expect(explicitDose.unresolved.join(' ')).toMatch(/Plusieurs gestes actifs/u);
  });

  it('sépare un cadre de style des critères sensoriels et garde une question de levure ouverte', () => {
    const context = prepared([resin, tropical, citrus], currentProgram());
    const replacementQuestion = 'Qu’est-ce que je gagne dans ma light lager à remplacer Saaz par Styrian Gold ?';
    const replacement = readHopV55Question(replacementQuestion, context);
    expect(replacement.intent.question).toBe(replacementQuestion);
    expect(replacement.criterionDrafts.some(row => /^(?:light|lager|styrian|saaz)$/iu.test(row.term))).toBe(false);

    const yeastQuestion = 'Quand, avec ma levure, utiliser au mieux mes houblons et lesquels pour cette super NEIPA ?';
    const yeast = readHopV55Question(yeastQuestion, context);
    expect(yeast.intent.question).toBe(yeastQuestion);
    expect(yeast.criterionDrafts.some(row => /^neipa$/iu.test(row.term))).toBe(false);
    expect(yeast.criterionDrafts.some(row => /^levure$/iu.test(row.term))).toBe(false);
    expect(yeast.criterionDrafts.some(row => row.dimension === 'aroma' && row.direction === 'increase')).toBe(false);
  });

  it('garde un risque sensoriel conditionnel comme question et distingue un constat déjà déclaré', () => {
    const context = prepared([resin, tropical, citrus], currentProgram());
    const conditionalQuestion = 'Si j’amérise avec Nugget, est-ce que je ne serai pas trop résineux ou au contraire pas assez ?';
    const conditional = readHopV55Question(conditionalQuestion, context);
    const risk = conditional.criterionDrafts.find(row => row.familyId === 'resin');
    expect(risk).toMatchObject({ source: expect.objectContaining({ text: 'résineux' }), direction: 'investigate', requirement: 'required' });
    expect(risk).not.toHaveProperty('reportedProblem');
    expect(conditional.intent.question).toBe(conditionalQuestion);

    const reported = readHopV55Question('Ma bière présente une note résineuse.', context);
    expect(reported.criterionDrafts.find(row => row.familyId === 'resin')).toMatchObject({
      direction: null, requirement: 'optional', qualification: expect.stringMatching(/observation/i),
    });
    // A declared excess is a reported gap, not a chosen reduction; the requested reduction stays directed.
    const declaredProblem = readHopV55Question('Ma bière est trop résineuse.', context);
    expect(declaredProblem.criterionDrafts.find(row => row.familyId === 'resin'))
      .toMatchObject({ direction: null, requirement: 'optional', qualification: expect.stringMatching(/écart rapporté/iu) });
    expect(declaredProblem.intent.criteria.some(row => row.familyId === 'resin')).toBe(false);
    const requestedReduction = readHopV55Question('Je veux moins de résine.', context);
    expect(requestedReduction.criterionDrafts.find(row => row.familyId === 'resin'))
      .toMatchObject({ direction: 'decrease', requirement: 'required' });

    const verbatimQuestion = "Ou dans ma stout si j'amèrise avec nuget est-ce que je suis pas trop résineux ou au contraire pas assez et je peux aussi ajouter autre chose.";
    const verbatim = readHopV55Question(verbatimQuestion, context);
    expect(verbatim.intent.question).toBe(verbatimQuestion);
    expect(verbatim.criterionDrafts.find(row => row.familyId === 'resin')).toMatchObject({
      source: { text: 'résineux' }, direction: 'investigate', requirement: 'required',
      qualification: expect.stringMatching(/conditionnel|possibilit|risque/i),
    });
    expect(verbatim.criterionDrafts.find(row => row.familyId === 'resin')).not.toHaveProperty('reportedProblem');
    expect(verbatim.branches).toEqual([]);
    expect(verbatim.operationDrafts).toBeUndefined();
    for (const row of verbatim.criterionDrafts) expect(verbatimQuestion.slice(row.source.start, row.source.end)).toBe(row.source.text);
  });

  it('ne transforme pas une contrainte de non-invention en critères de goût ou de documentation', () => {
    const context = prepared([resin, tropical, citrus], currentProgram());
    const question = 'Mon houblon maison témoin a une odeur résineuse sur le houblon brut; je veux préserver le floral sans inventer son identité ni son analyse.';
    const reading = readHopV55Question(question, context);
    expect(reading.intent.question).toBe(question);
    expect(reading.criterionDrafts.some(row => /^(?:inventer|analyse)$/iu.test(row.term))).toBe(false);
    expect(reading.criterionDrafts).toEqual(expect.arrayContaining([
      expect.objectContaining({ term: 'résineuse', requirement: 'optional' }),
      expect.objectContaining({ term: 'floral', direction: 'keep', requirement: 'required' }),
    ]));
    for (const row of reading.criterionDrafts) expect(question.slice(row.source.start, row.source.end)).toBe(row.source.text);
  });

  it('ne lit pas un qualificatif de cadrage comme un objectif de bière', () => {
    const question = 'J’ai un profil de bière hyper particulier. Je veux une bière de Champagne, sucrée, très florale, légère amertume. Est-ce que la biotransformation peut m’aider ?';
    const reading = readHopV55Question(question, prepared([resin, tropical, citrus], currentProgram()));
    expect(reading.intent.question).toBe(question);
    expect(reading.criterionDrafts.some(row => row.term === 'particulier')).toBe(false);
    expect(reading.criterionDrafts).toEqual(expect.arrayContaining([
      expect.objectContaining({ term: 'florale', familyId: 'floral', direction: 'increase' }),
      expect.objectContaining({ term: 'amertume', qualification: 'légère' }),
    ]));

    const verbatim = "J'ai un profil de bière hyper particulier. Je veux une bière de Champagne, sucré, très fleural, légère amertume. Est-ce que la bio transformation peut m'aider là dedans.";
    const sourceReading = readHopV55Question(verbatim, prepared([resin, tropical, citrus], currentProgram()));
    expect(sourceReading.criterionDrafts.some(row => row.term === 'particulier')).toBe(false);
    const misspelledFloral = sourceReading.criterionDrafts.find(row => row.term === 'fleural');
    expect(misspelledFloral).toMatchObject({ source: { text: 'fleural' }, term: 'fleural', origin: 'parser',
      familyId: 'floral', dimension: 'aroma', qualification: expect.stringMatching(/proche de « floral ».*proposé.*confirmer/i) });
    for (const row of sourceReading.criterionDrafts) expect(verbatim.slice(row.source.start, row.source.end)).toBe(row.source.text);

    const profileOnly = 'J’ai un profil hyper particulier. Je veux une bière de Champagne avec une expression florale.';
    const profileReading = readHopV55Question(profileOnly, prepared([resin, tropical, citrus], currentProgram()));
    expect(profileReading.criterionDrafts.some(row => row.term === 'particulier')).toBe(false);
    expect(profileReading.criterionDrafts.some(row => row.term === 'florale' && row.familyId === 'floral')).toBe(true);

    const knownProfile = readHopV55Question('J’ai un profil hyper floral.', prepared([resin, tropical, citrus], currentProgram()));
    expect(knownProfile.criterionDrafts.find(row => row.familyId === 'floral'))
      .toMatchObject({ term: 'floral', direction: 'increase', requirement: 'required' });
    const fineProfile = readHopV55Question('J’ai un profil hyper juicy.', prepared([resin, tropical, citrus], currentProgram()));
    expect(fineProfile.criterionDrafts.find(row => row.term === 'juicy'))
      .toMatchObject({ term: 'juicy', direction: 'increase', requirement: 'required', origin: 'parser' });
  });

  it('garde une graphie proche comme critère source corrigeable sans lui attribuer une famille', () => {
    const question = "Je veux absolument éviter le côté sapins, résine, mais je veux quand même un haut taux d'amertum sans forcément le côté tropicale.";
    const reading = readHopV55Question(question, prepared([resin, tropical, citrus], currentProgram()));
    const candidate = reading.criterionDrafts.find(row => row.term === 'amertum');
    expect(candidate).toMatchObject({ source: { text: 'amertum' }, term: 'amertum', direction: 'increase',
      requirement: 'required', origin: 'parser', dimension: 'other',
      qualification: expect.stringMatching(/proche de « amertume ».*proposé.*confirmer/i) });
    expect(candidate?.familyId).toBeUndefined();
    for (const row of reading.criterionDrafts) expect(question.slice(row.source.start, row.source.end)).toBe(row.source.text);
  });

  it('route les noms de produits typés vers leurs fiches et garde les conventions propres à chaque usage', () => {
    const question = 'Pour mon dry-hop, puis-je remplacer 20 g de T-90 par Cryo Hops ou HyperBoost ?';
    const reading = readHopV55Question(question, prepared([resin, tropical, citrus], currentProgram()));
    expect(reading.response?.actionKind).toBe('understandProducts');
    expect(reading.branches).toEqual([]);
    if (reading.response?.actionKind !== 'understandProducts') throw new Error('La question produit doit utiliser le contrat catalogue typé.');
    expect(reading.response.result.products.map(product => product.id)).toEqual(['ych-cryo-hops', 'ych-hyperboost']);
    expect(reading.response.result.products).toEqual(HOP_COMMERCIAL_PRODUCTS.filter(product =>
      ['ych-cryo-hops', 'ych-hyperboost'].includes(product.id)));
    const hyperBoost = reading.response.result.products.find(product => product.id === 'ych-hyperboost')!;
    expect(hyperBoost.supportedUses).toContain('whirlpool');
    expect(hyperBoost.replacement?.uses).not.toContain('whirlpool');
    expect(reading.response.sources).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'manufacturer', reference: expect.stringContaining('yakimachief.com/products/hyperboost') }),
    ]));
    expect(reading.response.intent.originalQuestion).toBe(question);
  });

  it('lit la virgule décimale comme une dose réelle et prépare le geste sur la fiche maison exacte', () => {
    const house = material('fixture:house-vallon-7', 'Houblon maison Vallon 7', 'floral lime');
    const program = currentProgram();
    const reading = readHopV55Question(
      'Ajoute 12,25 g de Houblon maison Vallon 7 au whirlpool à 78°C pendant 20 min pour plus floral, sans déplacer les autres opérations.',
      prepared([house, resin, tropical], program),
    );

    expect(reading.branches).toHaveLength(1);
    const addition = reading.branches[0].programChanges?.[0];
    expect(addition?.kind).toBe('append');
    if (addition?.kind !== 'append') throw new Error('La branche attendue doit ajouter une ligne.');
    expect(addition.addition).toMatchObject({
      materialId: house.id, grams: 12.25, use: 'whirlpool', status: 'planned',
      temperatureC: 78, contactHours: 20 / 60,
    });
    expect(reading.response?.actionKind).toBe('exploreStrategies');
    expect(reading.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ familyId: 'floral', direction: 'increase' }),
    ]));
  });

  it('refuse de déplacer une ligne vers un emploi déjà passé au stade réel', () => {
    const house = material('fixture:house-vallon-7', 'Houblon maison Vallon 7', 'floral lime');
    const program = currentProgram({
      stage: 'fermenting',
      additions: [{ id: 'dry-hop-1', materialId: house.id, grams: 20, use: 'postFermentation', status: 'planned' }],
    });
    const reading = readHopV55Question(
      'Déplace 20 g de Houblon maison Vallon 7 du dry hop à l’ébullition.',
      prepared([house, resin], program),
    );

    expect(reading.branches).toEqual([]);
    expect(reading.unresolved.join(' ')).toMatch(/déjà passé|passé au stade/u);
    expect(reading.response?.intent.originalQuestion).toBe('Déplace 20 g de Houblon maison Vallon 7 du dry hop à l’ébullition.');
  });

  it('ne crée aucune branche destructive quand l’identité ou la ligne reste ambiguë', () => {
    const firstSaaz = material('fixture:saaz-lot-a', 'Saaz', 'floral herbal');
    const secondSaaz = material('fixture:saaz-lot-b', 'Saaz', 'spicy herbal');
    const target = material('fixture:golding', 'Golding maison', 'floral');
    const replacement = readHopV55Question(
      'Remplace Saaz par Golding maison à 20 g.',
      prepared([firstSaaz, secondSaaz, target], currentProgram({
        additions: [{ id: 'planned-boil', materialId: firstSaaz.id, grams: 20, use: 'boil', status: 'planned' }],
      })),
    );
    expect(replacement.branches).toEqual([]);
    expect(replacement.unresolved.join(' ')).toMatch(/ambig|identit/u);

    const house = material('fixture:house-vallon-7', 'Houblon maison Vallon 7', 'floral lime');
    const move = readHopV55Question(
      'Déplace 20 g de Houblon maison Vallon 7 de l’ébullition au whirlpool.',
      prepared([house], currentProgram({ additions: [
        { id: 'boil-a', materialId: house.id, grams: 20, use: 'boil', status: 'planned' },
        { id: 'boil-b', materialId: house.id, grams: 20, use: 'boil', status: 'planned' },
      ] })),
    );
    expect(move.branches).toEqual([]);
    expect(move.unresolved.join(' ')).toMatch(/Plusieurs lignes/u);
  });

  it('distingue une variation de dose explicite d’une quantité cible ambiguë', () => {
    const house = material('fixture:house-vallon-7', 'Houblon maison Vallon 7', 'floral lime');
    const program = currentProgram({
      additions: [{ id: 'planned-boil', materialId: house.id, grams: 20, use: 'boil', status: 'planned' }],
    });
    const reduced = readHopV55Question(
      'Réduis de 5 g le Houblon maison Vallon 7 à l’ébullition.',
      prepared([house], program),
    );
    const ambiguous = readHopV55Question(
      'Réduis 5 g le Houblon maison Vallon 7 à l’ébullition.',
      prepared([house], program),
    );

    expect(reduced.branches[0]?.programChanges?.[0]).toMatchObject({
      kind: 'replace', additions: [expect.objectContaining({ grams: 15 })],
    });
    expect(ambiguous.branches).toEqual([]);
    expect(ambiguous.unresolved.join(' ')).toMatch(/dose cible.*variation/u);
  });

  it('garde critères et question d’origine dans la réponse au lieu de les remplacer par des gains', () => {
    const question = 'Comment renforcer les agrumes mais éviter la résine ?';
    const reading = readHopV55Question(question, prepared([resin, tropical, citrus], currentProgram()));
    const responseCriteria = reading.response?.intent.criteria ?? [];

    expect(reading.response?.intent.originalQuestion).toBe(question);
    expect(responseCriteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ role: 'seek', familyId: 'citrus', origin: 'user' }),
      expect.objectContaining({ role: 'avoid', familyId: 'resin', origin: 'user' }),
    ]));
    expect(reading.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ familyId: 'citrus', direction: 'increase' }),
      expect.objectContaining({ familyId: 'resin', direction: 'exclude' }),
    ]));
  });

  it('utilise la façade de substitution quand identité, ligne et convention sont explicites', () => {
    const sourceHop = material('fixture:source-hop', 'Variété source des collines', 'herbal spicy');
    const targetHop = material('fixture:target-hop', 'Variété Vallon 7', 'floral lime');
    const program = currentProgram({
      additions: [{ id: 'planned-boil', materialId: sourceHop.id, grams: 20, use: 'boil' as HopUse, status: 'planned' }],
    });
    const reading = readHopV55Question(
      'Remplace Variété source des collines par Variété Vallon 7 à même masse.',
      prepared([sourceHop, targetHop], program),
    );

    expect(reading.response?.actionKind).toBe('substitute');
    expect(reading.response?.result.options).toEqual(expect.arrayContaining([
      expect.objectContaining({
        materialId: targetHop.id, basis: 'sameMass', doseGrams: expect.objectContaining({ value: 20 }),
        tradeoffs: expect.arrayContaining([expect.stringMatching(/équivalence en bière/)]),
      }),
    ]));
    expect(reading.branches).toHaveLength(1);
  });

  it('utilise le planificateur pour une matière indisponible avec convention de dose explicite', () => {
    const unavailable = material('fixture:source-hop', 'Variété source des collines', 'herbal spicy', 0);
    const alternative = material('fixture:target-hop', 'Variété Vallon 7', 'floral lime', 100);
    const program = currentProgram({
      additions: [{ id: 'planned-boil', materialId: unavailable.id, grams: 20, use: 'boil', status: 'planned' }],
    });
    const question = 'La Variété source des collines est indisponible; quelles pistes à masse égale ?';
    const reading = readHopV55Question(question, prepared([unavailable, alternative], program));

    expect(reading.response?.actionKind).toBe('planReplacement');
    expect(reading.branches.length).toBeGreaterThan(0);
    expect(reading.response?.intent.originalQuestion).toBe(question);
  });

  it('n’accorde aucun sens spécial au nom d’une recette ou à une variété commerciale absente du contexte', () => {
    const house = material('fixture:lot-atelier-17', 'Lot d’atelier 17', 'floral herbal');
    const reading = readHopV55Question(
      'Dans cette bière de garde maison, ajouter 9 g de Lot d’atelier 17 au whirlpool.',
      prepared([house], currentProgram()),
    );

    expect(reading.branches).toHaveLength(1);
    const change = reading.branches[0].programChanges?.[0];
    expect(change?.kind).toBe('append');
    if (change?.kind !== 'append') throw new Error('La branche attendue doit ajouter une ligne.');
    expect(change.addition.materialId).toBe(house.id);
    expect(reading.intent.criteria.some(row => /bière de garde/i.test(row.label))).toBe(false);
    expect(reading.intent.criteria.some(row => /maison|garde/iu.test(row.label))).toBe(false);
  });
});
