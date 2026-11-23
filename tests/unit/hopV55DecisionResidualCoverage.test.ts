import { describe, expect, it } from 'vitest';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import type { BrewingScenarioCultureContext } from '../../src/domain/brewingScenario';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { loadBrewingCatalogueReferences } from '../../src/domain/brewingCatalogueReferences';
import { makeHopV55FixtureContext, makeHopV55FixtureReferences, type HopV55FixtureMode } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import { readHopV55QuestionSemanticV1 } from '../../src/services/hopV55/questionSemanticReading';
import { createHopV55DecisionReadingArchiveV2, readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';

type Line = { varietyId: string; grams: number; use: 'boil' | 'whirlpool' | 'fermentation' | 'postFermentation' };
const unique = <T extends { id: string }>(rows: readonly T[]) => [...new Map(rows.map(row => [row.id, structuredClone(row)])).values()];
const cases: Array<{ id: string; question: string; mode: HopV55FixtureMode; style?: string; lines?: Line[]; culture?: BrewingScenarioCultureContext; house?: boolean }> = [
  { id: 'Q05', question: 'Je voudrais une Lager ultra juicy, hyper aromatisée, sans qu’elle soit amère. J’ai quoi comme choix ?', mode: 'planning', style: 'Lager claire' },
  { id: 'Q08', question: 'Je veux une blanche ultra tropicale qui se marie bien avec mon goût de banane.', mode: 'unknownCulture', style: 'Blanche' },
  { id: 'Q10-planning', question: 'Ma pastry stout est trop sucrée, comment compenser ça avec le houblon ?', mode: 'planning', style: 'Pastry stout' },
  { id: 'Q10-fermenting', question: 'Ma pastry stout est trop sucrée, comment compenser ça avec le houblon ?', mode: 'fermenting', style: 'Pastry stout' },
  { id: 'F-sour', question: 'Dans une sour aux fruits rouges, chercher les baies et préserver l’acidité sans augmenter l’amertume.', mode: 'sour', style: 'Sour aux fruits rouges' },
  { id: 'F-nolo', question: 'Dans une bière NOLO, quels leviers de houblon soutiennent le fruité et gardent l’amertume basse ?', mode: 'nolo', style: 'NOLO maltée' },
  { id: 'F-culture-unknown', question: 'Dans la NEIPA, exploiter la biotransformation des thiols, préserver le floral et éviter la résine.', mode: 'unknownCulture', style: 'NEIPA' },
  { id: 'F-culture-mixed', question: 'Dans la NEIPA, exploiter la biotransformation des thiols, préserver le floral et éviter la résine.', mode: 'unknownCulture', style: 'NEIPA' },
  { id: 'F-house-hop', question: 'Mon houblon maison témoin sans analyse a une odeur résineuse; préserver le floral reste important.', mode: 'unknown', house: true },
  { id: 'Q11', question: 'Je veux une bière de Champagne, sucrée, très florale, avec légère amertume. Est-ce que la biotransformation peut aider ?', mode: 'planning', style: 'Bière de Champagne · fixture' },
];

async function prepare(input: typeof cases[number]) {
  const refs = await loadBrewingCatalogueReferences();
  const fixture = makeHopV55FixtureReferences();
  const context = makeHopV55FixtureContext(input.mode);
  let varieties = unique([...refs.varieties, ...fixture.varieties]);
  if (input.house) varieties = [...varieties, { id: 'residual-house-hop', name: 'Houblon maison témoin', aliases: [], form: 'unknown', analysis: [], descriptions: [] }];
  const knowledge = unique([...refs.knowledge, ...fixture.knowledge]);
  context.hopIndex = { ...context.hopIndex, varieties, knowledge, lots: [], predictions: [], tastings: [], truncated: [] };
  if (input.style && context.recipe) context.recipe.style = input.style;
  const saaz = varieties.find(row => row.id === 'hopsteiner-saz')!;
  const citra = varieties.find(row => row.id === 'ych-citra')!;
  const lines = input.lines ?? [
    { varietyId: saaz.id, grams: 20, use: 'boil' as const },
    { varietyId: citra.id, grams: 30, use: 'postFermentation' as const },
  ];
  if (context.recipe) context.recipe.hops = lines.map(line => {
    const variety = varieties.find(row => row.id === line.varietyId)!;
    const alpha = variety.analysis.find(row => row.analyte === 'alpha' && row.kind === 'point' && row.unit === 'percentMass')?.value ?? 0;
    return { name: variety.name, hopVarietyId: variety.id, alpha, weightG: line.grams,
      stage: line.use === 'boil' ? 'boil' as const : 'dryHop' as const,
      ...(line.use === 'boil' ? { timeMin: 60 } : { dayOffset: 3, aromaTiming: line.use === 'fermentation' ? 'fermentation' as const : 'postFermentation' as const,
        aromaContactHours: 48, aromaTemperatureC: 14 }) };
  });
  if (context.batch?.recipeSnapshot && context.recipe) context.batch.recipeSnapshot = structuredClone(context.recipe);
  const cultureRows = knowledge.filter((row): row is Extract<HopKnowledge, { kind: 'yeast' }> => row.kind === 'yeast');
  const us05 = cultureRows.find(row => row.id === 'fermentis-us05');
  const verdant = cultureRows.find(row => row.id === 'lalbrew-verdant-ipa');
  const culture = input.id === 'F-culture-mixed' ? { state: 'mixed' as const, members: [
    ...(us05 ? [{ yeastId: us05.id }] : [{ name: 'Culture locale A' }]),
    ...(verdant ? [{ yeastId: verdant.id }] : [{ name: 'Culture locale B' }]),
  ], explanation: 'Contexte mixte synthétique; proportions, viabilité et résultat restent inconnus.' } : input.culture;
  return prepareBrewingScenarioContext(context, culture ? { culture } : undefined);
}

describe('lecture résiduelle bornée à des fixtures locales — façade actuelle', () => {
  it('préserve les directions, relations et annotations des formulations restantes', async () => {
    const actual = new Map<string, Awaited<ReturnType<typeof readCase>>>();
    for (const testCase of cases) {
      actual.set(testCase.id, await readCase(testCase));
    }

    const juicy = actual.get('Q05')!;
    expect(juicy.reading.criterionDrafts).toEqual(expect.arrayContaining([
      expect.objectContaining({ term: 'juicy', direction: 'increase', requirement: 'required' }),
      expect.objectContaining({ term: 'aromatisée', direction: 'increase', requirement: 'required' }),
      expect.objectContaining({ term: 'amère', direction: 'exclude', requirement: 'required' }),
    ]));
    expect(juicy.reading.criterionDrafts.find(row => row.term === 'juicy')?.familyId).toBeUndefined();
    expect(juicy.reading.criterionDrafts.find(row => row.term === 'aromatisée')?.familyId).toBeUndefined();
    expect(juicy.reading.criterionDrafts.some(row => row.term === 'qu')).toBe(false);

    const banana = actual.get('Q08')!;
    expect(banana.reading.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ familyId: 'tropical', direction: 'increase' }),
    ]));
    expect(banana.reading.criterionDrafts.find(row => /banane/i.test(row.term))).toMatchObject({
      term: 'banane', direction: null, requirement: 'optional',
      qualification: expect.stringMatching(/préférence.*partenaire/i),
    });
    expect(banana.reading.criterionDrafts.find(row => /banane/i.test(row.term))?.familyId).toBeUndefined();
    expect(criterionStatuses(banana.reading, 'banane')).toEqual([]);
    expect(criterionStatuses(banana.reading, 'tropicale')).toEqual(expect.arrayContaining(['documentedSupport', 'unknown']));

    // Q10: the declarative complaint is a reported observation and the compensation an inquiry linked to it;
    // no reduction reaches the strategy service, and the typed meaning is carried by the semantic reading.
    const sweetCase = actual.get('Q10-planning')!;
    const sweet = sweetCase.reading;
    expect(sweet.intent.criteria.some(row => /sucrée/iu.test(row.label))).toBe(false);
    expect(sweet.criterionDrafts.find(row => row.term === 'sucrée')).toMatchObject({ direction: null, requirement: 'optional' });
    expect(sweet.response?.actionKind).toBe('exploreStrategies');
    const sweetSemantic = readHopV55QuestionSemanticV1(cases.find(row => row.id === 'Q10-planning')!.question, sweetCase.prepared);
    const sweetObservation = sweetSemantic.annotations.find(row => row.term === 'sucrée')!;
    const sweetInquiry = sweetSemantic.annotations.find(row => row.inquiry === 'compensation')!;
    expect(sweetObservation).toMatchObject({ sense: 'reportedObservation', direction: null, requirement: 'optional' });
    expect(sweetInquiry).toMatchObject({ sense: 'investigation', direction: 'investigate', relatedAnnotationIds: [sweetObservation.id] });
    expect(sweetSemantic.projectionCoverage.notProjected).toEqual(expect.arrayContaining([
      { annotationId: sweetObservation.id, reason: 'reportedObservation' },
      { annotationId: sweetInquiry.id, reason: 'linkedInquiry' },
    ]));

    const sour = actual.get('F-sour')!.reading;
    expect(sour.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ familyId: 'berries', direction: 'increase' }),
      expect.objectContaining({ label: expect.stringMatching(/acidité/i), direction: 'keep' }),
      expect.objectContaining({ label: expect.stringMatching(/amertume/i), direction: 'keep' }),
    ]));
    expect(sour.intent.criteria.some(row => /(?:dans|sour|fruits rouges)/i.test(row.label))).toBe(false);
    expect(criterionStatuses(sour, 'baies')).toEqual(expect.arrayContaining(['documentedSupport', 'unknown']));
    expect(criterionStatuses(sour, 'acidité')).toContain('unknown');

    const nolo = actual.get('F-nolo')!.reading;
    expect(nolo.criterionDrafts).toEqual(expect.arrayContaining([
      expect.objectContaining({ term: 'fruité', direction: 'investigate', requirement: 'required' }),
      expect.objectContaining({ term: 'amertume', direction: 'keep', qualification: 'basse' }),
    ]));
    expect(nolo.criterionDrafts.find(row => row.term === 'fruité')?.familyId).toBeUndefined();
    expect(criterionStatuses(nolo, 'fruité')).toContain('unknown');

    const cultureUnknown = actual.get('F-culture-unknown')!;
    const cultureMixed = actual.get('F-culture-mixed')!;
    expect(cultureUnknown.reading.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: expect.stringMatching(/biotransformation/i), direction: 'investigate' }),
      expect.objectContaining({ familyId: 'floral', direction: 'keep' }),
      expect.objectContaining({ familyId: 'resin', direction: 'exclude' }),
    ]));
    expect(cultureUnknown.reading.intent.criteria).toEqual(cultureMixed.reading.intent.criteria);
    expect(cultureUnknown.prepared.runtime.current?.culture?.state).toBe('unknown');
    expect(cultureMixed.prepared.runtime.current?.culture?.state).toBe('mixed');
    expect(criterionStatuses(cultureUnknown.reading, 'biotransformation')).toContain('unknown');
    expect(cultureUnknown.reading.response?.missingInformation.join(' ')).toMatch(/souches|viabilité|cultures/i);

    const house = actual.get('F-house-hop')!.reading;
    expect(house.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ familyId: 'floral', direction: 'keep' }),
    ]));
    expect(house.intent.criteria.some(row => row.familyId === 'resin' || /odeur/i.test(row.label))).toBe(false);
    expect(house.criterionDrafts).toEqual(expect.arrayContaining([
      expect.objectContaining({ term: 'résineuse', direction: null, requirement: 'optional', familyId: 'resin',
        qualification: expect.stringMatching(/observation/i) }),
    ]));
    const observationArchive = createHopV55DecisionReadingArchiveV2({ id: 'reading:house-observation', ownerKey: 'fixture-owner',
      workspaceId: 'workspace:house-observation', recordedAt: '2026-10-02T18:00:00.000Z', reading: house,
      source: { kind: 'exploration' }, runtimeReference: 'fixture:house-runtime' });
    expect(readHopV55DecisionReadingArchive(observationArchive)).toMatchObject({
      status: 'available', archive: { reading: { criterionDrafts: expect.arrayContaining([
        expect.objectContaining({ term: 'résineuse', direction: null, qualification: expect.stringMatching(/observation/i) }),
      ]) } },
    });
    expect(criterionStatuses(house, 'floral')).toEqual(expect.arrayContaining(['documentedSupport', 'unknown']));

    // Q11: « légère amertume » is an engaged absolute target, never a reduction. The strategy service does not receive it;
    // the projection names that omission, and the high level / wished profile keep their historical conventions only there.
    const champagneCase = actual.get('Q11')!;
    const champagne = champagneCase.reading;
    expect(champagne.intent.criteria).toEqual(expect.arrayContaining([
      expect.objectContaining({ familyId: 'floral', direction: 'increase' }),
      expect.objectContaining({ label: expect.stringMatching(/biotransformation/i), direction: 'investigate' }),
    ]));
    expect(champagne.intent.criteria.some(row => /amertume/iu.test(row.label))).toBe(false);
    expect(champagne.criterionDrafts.find(row => /florale/i.test(row.term))?.qualification).toBe('très');
    expect(champagne.criterionDrafts.find(row => row.term === 'amertume')).toMatchObject({ direction: null, requirement: 'required',
      qualification: 'légère' });
    expect(champagne.criterionDrafts.find(row => row.term === 'sucrée')?.direction).toBe('investigate');
    expect(criterionStatuses(champagne, 'florale')).toEqual(expect.arrayContaining(['documentedSupport', 'unknown']));
    expect(criterionStatuses(champagne, 'amertume')).toEqual([]);
    expect(criterionStatuses(champagne, 'sucrée')).toContain('unknown');
    expect(criterionStatuses(champagne, 'biotransformation')).toContain('unknown');
    const champagneSemantic = readHopV55QuestionSemanticV1(cases.find(row => row.id === 'Q11')!.question, champagneCase.prepared);
    const bitterness = champagneSemantic.annotations.find(row => row.term === 'amertume')!;
    expect(bitterness).toMatchObject({ sense: 'qualitativeTarget', direction: null, qualification: 'légère' });
    expect(champagneSemantic.projectionCoverage.notProjected).toEqual(expect.arrayContaining([
      { annotationId: bitterness.id, reason: 'qualitativeTargetWithoutDirection' }]));
    expect(champagneSemantic.annotations.find(row => row.term === 'florale')).toMatchObject({ sense: 'qualitativeTarget', direction: null,
      qualification: 'très', primitiveConvention: 'targetAsIncrease' });
    expect(champagneSemantic.annotations.find(row => row.term === 'sucrée')).toMatchObject({ sense: 'qualitativeTarget', direction: null,
      primitiveConvention: 'targetAsInvestigation', frameSource: { text: 'Je veux' } });
    expect(champagneSemantic.annotations.find(row => row.term === 'biotransformation')).toMatchObject({ sense: 'investigation',
      inquiry: 'question' });
  });
});

async function readCase(input: typeof cases[number]) {
  const prepared = await prepare(input);
  const before = structuredClone(prepared);
  const reading = readHopV55Question(input.question, prepared);
  expect(prepared).toEqual(before);
  for (const draft of reading.criterionDrafts) {
    expect(input.question.slice(draft.source.start, draft.source.end)).toBe(draft.source.text);
  }
  return { prepared, reading };
}

function criterionStatuses(reading: Awaited<ReturnType<typeof readCase>>['reading'], term: string): string[] {
  const criterion = reading.intent.criteria.find(row => row.label.toLocaleLowerCase('fr').includes(term.toLocaleLowerCase('fr')));
  if (!criterion || reading.response?.actionKind !== 'exploreStrategies') return [];
  return [...new Set(reading.response.result.options.flatMap(option => option.criterionEffects)
    .filter(effect => effect.criterionId === criterion.id).map(effect => effect.status))];
}
