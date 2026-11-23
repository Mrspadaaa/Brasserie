import { describe, expect, it } from 'vitest';
import planFixture from '../fixtures/public-history/hop-strategy-plan.synthetic.json';
import conditioningFixture from '../fixtures/public-history/hop-strategy-conditioning.synthetic.json';
import { exploreHopStrategies } from '../../src/domain/hopDecision/advice';
import type { HopIntentEvidenceCriterion } from '../../src/domain/hopDecision/intentEvidence';
import {
  assertHopStrategyAdviceResult,
  hopAdviceResultReference,
  type HopAdviceInput,
  type HopAdviceOption,
} from '../../src/domain/hopDecision/adviceSchema';
import type { HopSource } from '../../functions/src/hopIndexSchema';
import type { HopDecisionMaterial, HopDecisionProgram, HopUse } from '../../src/domain/hopDecision/types';

const documentationSource: HopSource = {
  title: 'Fixture synthétique de description', author: 'Donnée de test', year: 2026,
  kind: 'observation', reference: 'fixture:hop-description', locator: 'Observation synthétique rawHop.'
};

const manufacturerFixture = {
  id: 'product-reference', name: 'Lot de référence synthétique', manufacturer: 'Fixture', form: 'pelletT90' as const,
  supportedUses: ['whirlpool', 'postFermentation'] as HopUse[],
  source: { title: 'Fiche produit synthétique', author: 'Fixture', year: 2026, kind: 'manufacturer' as const,
    reference: 'fixture:product', locator: 'Usages fictifs fournis uniquement par ce test.' },
  reviewedOn: '2026-10-01', cautions: ['Fiche synthétique de test.'],
};

function material(input: {
  id: string; name: string; form?: HopDecisionMaterial['form'];
  description?: string; context?: 'rawHop' | 'infusion' | 'beer' | 'unspecified';
  availableGrams?: number | null; withProduct?: boolean;
}): HopDecisionMaterial {
  const form = input.form ?? 'pelletT90';
  return {
    id: input.id,
    name: input.name,
    form,
    ...(input.availableGrams !== undefined ? { availableGrams: input.availableGrams } : {}),
    ...(input.description !== undefined ? { variety: {
      id: `variety-${input.id}`, name: `Source ${input.name}`, aliases: [], form,
      descriptions: [{ text: input.description, context: input.context ?? 'rawHop', source: documentationSource }],
      analysis: [],
    } } : {}),
    ...(input.withProduct ? { product: { ...structuredClone(manufacturerFixture), form } } : {}),
  };
}

function planningIntent(): HopAdviceInput['intent'] {
  return {
    originalQuestion: planFixture.request.originalQuestion,
    interpretation: 'Interprétation explicitement structurée de la fixture synthétique.',
    criteria: planFixture.request.proposedInterpretation.criteria.map(row => ({
      id: row.id, description: row.text,
      role: row.role as HopIntentEvidenceCriterion['role'],
      origin: row.origin as HopIntentEvidenceCriterion['origin'],
    })).concat([{ id: 'stock-check', description: 'Quantité physique à confirmer.', role: 'constraint' as const, origin: 'proposal' as const }]),
  };
}

function planningInput(): HopAdviceInput {
  const houseHop = material({
    id: planFixture.scenarioStatements.houseHop.materialId,
    name: planFixture.scenarioStatements.houseHop.identity,
    form: 'unknown',
    availableGrams: null,
  });
  const comparator = material({
    id: 'unfamiliar-comparator-17', name: 'Comparateur local 17', form: 'pelletT90',
    description: 'Note citronnée décrite sur la matière.', withProduct: true, availableGrams: null,
  });
  return {
    intent: planningIntent(),
    situation: {
      stage: 'planning', program: null,
      materialIds: [houseHop.id, comparator.id],
      criterionDimensions: [
        { criterionId: 'alcohol-constraint', dimension: 'alcohol' },
        { criterionId: 'acid-preservation', dimension: 'acidity' },
        { criterionId: 'aroma-seek', dimension: 'aroma', familyId: 'citrus' },
        { criterionId: 'stock-check', dimension: 'stock' },
      ],
      assertions: [
        { id: 'abv-reported', subject: 'alcohol', statement: planFixture.scenarioStatements.matrix.alcohol.description,
          state: 'reported', value: 'low', dimension: 'alcohol' },
        { id: 'ph-not-provided', subject: 'pH', statement: 'pH non fourni dans la fixture.',
          state: 'unknown', value: null, dimension: 'acidity' },
        { id: 'culture-report', subject: 'culture', statement: planFixture.scenarioStatements.culture.source,
          state: 'reported', value: planFixture.scenarioStatements.culture.reportedSpecies.join(' + '), dimension: 'bioInteraction' },
        { id: 'viability-not-observed', subject: 'viability', statement: 'Viabilité au futur contact non observée.',
          state: 'unknown', value: null, dimension: 'bioInteraction' },
      ],
      exclusions: [],
    },
    materials: [houseHop, comparator],
  };
}

function conditioningInput(): HopAdviceInput {
  const scenario = conditioningFixture.scenarioStatements;
  const planned = material({
    id: scenario.houseHop.materialId, name: scenario.houseHop.identity, form: 'unknown', availableGrams: null,
  });
  const comparator = material({
    id: 'lot-traceable-93', name: 'Lot descriptif 93', form: 'pelletT90',
    description: 'Arômes citron et pamplemousse mentionnés dans cette source.', withProduct: true, availableGrams: null,
  });
  const snapshot = scenario.programSnapshot;
  const program: HopDecisionProgram = {
    id: 'program-from-synthetic-fixture', revision: snapshot.revision, stage: 'conditioning',
    volumeL: snapshot.volumeL, wortGravity: snapshot.wortGravity,
    additions: snapshot.additions.map(addition => ({
      id: addition.id, materialId: addition.materialId, grams: addition.grams,
      use: addition.use as HopUse, status: addition.status as 'planned' | 'performed',
      contactHours: addition.contactHours, temperatureC: addition.temperatureC,
    })),
  };
  return {
    intent: {
      originalQuestion: conditioningFixture.request.originalQuestion,
      criteria: conditioningFixture.request.proposedInterpretation.criteria.map(row => ({
        id: row.id, description: row.text,
        role: row.role as HopIntentEvidenceCriterion['role'], origin: row.origin as HopIntentEvidenceCriterion['origin'],
      })).concat([{ id: 'preserve-performed', description: 'Ne pas modifier l’opération effectuée.',
        role: 'constraint' as const, origin: 'user' as const }]),
    },
    situation: {
      stage: 'conditioning', program,
      materialIds: [planned.id, comparator.id],
      criterionDimensions: [
        { criterionId: 'alcohol', dimension: 'alcohol' },
        { criterionId: 'acid', dimension: 'acidity' },
        { criterionId: 'aroma', dimension: 'aroma', familyId: 'citrus' },
        { criterionId: 'preserve-performed', dimension: 'process' },
      ],
      constraintChecks: [{ criterionId: 'preserve-performed', kind: 'preservePerformed', additionIds: ['performed-late-hop'] }],
      assertions: [
        { id: 'abv-report', subject: 'alcohol', statement: scenario.matrix.alcohol.description, state: 'reported', value: null, dimension: 'alcohol' },
        { id: 'acid-report', subject: 'acid', statement: scenario.matrix.acidity.description, state: 'reported', value: null, dimension: 'acidity' },
        { id: 'culture-unknown', subject: 'culture', statement: 'Culture non caractérisée.', state: 'unknown', value: null, dimension: 'bioInteraction' },
        { id: 'viability-unknown', subject: 'viabilityAtContact', statement: 'Viabilité au contact inconnue.', state: 'unknown', value: null, dimension: 'bioInteraction' },
        { id: 'fermentability-unknown', subject: 'fermentableDextrins', statement: 'Sucres fermentescibles non caractérisés.', state: 'unknown', value: null, dimension: 'hopCreep' },
      ],
      exclusions: [],
    },
    materials: [planned, comparator],
  };
}

function optionForMaterial(result: ReturnType<typeof exploreHopStrategies>, materialId: string): HopAdviceOption {
  const found = result.options.find(option => option.materialIds.includes(materialId));
  if (!found) throw Error(`Option de comparaison absente pour ${materialId}.`);
  return found;
}

describe('conseil de stratégie documentaire des houblons', () => {
  it('génère des voies qualitatives depuis la planification sans fabriquer un programme, une dose ou un résultat de bière', () => {
    const input = planningInput();
    const unscopedMaterial = material({ id: 'known-form-without-use-contract', name: 'Matière à forme connue', form: 'cone',
      description: 'Une source mentionne une note citronnée.', availableGrams: null });
    input.materials = [...input.materials, unscopedMaterial];
    input.situation.materialIds!.push(unscopedMaterial.id);
    const before = JSON.stringify(input);
    const result = exploreHopStrategies(input);
    const candidateId = 'unfamiliar-comparator-17';
    const candidateOption = optionForMaterial(result, candidateId);

    expect(input.situation.program).toBeNull();
    expect(candidateOption.programScope).toMatchObject({ kind: 'addOrReplace', materialIds: [candidateId], uses: ['whirlpool', 'postFermentation'], additionIds: [], allowAppend: true });
    expect(candidateOption.criterionEffects.find(effect => effect.criterionId === 'aroma-seek'))
      .toMatchObject({ status: 'documentedSupport' });
    expect(candidateOption.criterionEffects.find(effect => effect.criterionId === 'acid-preservation'))
      .toMatchObject({ status: 'unknown' });
    expect(candidateOption.dimensionEffects.find(effect => effect.dimension === 'aroma'))
      .toMatchObject({ status: 'documentarySupport' });
    expect(candidateOption.dimensionEffects.find(effect => effect.dimension === 'acidity'))
      .toMatchObject({ status: 'conditional', evidenceIds: expect.arrayContaining(['m-ph-maye-2018']) });
    expect(candidateOption.criterionEffects.find(effect => effect.criterionId === 'alcohol-constraint'))
      .toMatchObject({ status: 'constraintUnverified' });
    expect(result.informationRequests.some(request => request.id === 'decision-alcohol-constraint-alcohol')).toBe(true);
    expect(result.evidenceSources.some(source => source.readingLevel === 'providedMaterialSource' && source.domain.includes('rawHop'))).toBe(true);
    expect(result.options.some(option => /transfert direct/i.test(option.title))).toBe(true);
    expect(result.options.some(option => /description sourcée/i.test(option.title))).toBe(true);
    expect(result.options.some(option => /Documenter le lot/i.test(option.title))).toBe(true);
    expect(result.options.some(option => /bilan des contraintes/i.test(option.title))).toBe(true);
    expect(result.options.some(option => /question biologique explicitement/i.test(option.title))).toBe(false);
    expect(result.options.some(option => /Contextualiser séparément les assertions biologiques fournies/i.test(option.title))).toBe(true);
    expect(result.evidenceSources.some(source => source.id.startsWith('m-ab-'))).toBe(true);
    expect(result.informationRequests.some(request => /culture\/produit|viabilité/i.test(request.question))).toBe(false);
    expect(result.options.filter(option => option.title.startsWith('Documenter') && option.materialIds.includes('house-hop-lot-unanalysed'))).toHaveLength(1);
    expect(result.options.some(option => option.title === `Documenter ${planFixture.scenarioStatements.houseHop.identity} avant de choisir un emploi`)).toBe(false);
    const transferOption = result.options.find(option => /transfert direct/i.test(option.title))!;
    expect(transferOption?.dimensionEffects.find(effect => effect.dimension === 'matrixTransfer'))
      .toMatchObject({ status: 'conditional', evidenceIds: expect.arrayContaining(['m-transfer-brendel-2020']) });
    expect(optionForMaterial(result, unscopedMaterial.id).programScope).toEqual({ kind: 'none' });
    expect(optionForMaterial(result, unscopedMaterial.id).conditions.join(' ')).toMatch(/aucun emploi explicite/i);
    expect(JSON.stringify(result)).not.toMatch(/"(grams|volumeL|wortGravity|doseGrams)"\s*:/i);
    expect(result).toMatchObject({ version: 'hop-strategy-advice-v1', inputReference: expect.stringContaining('hop-advice-input-v1:'), reference: expect.stringContaining('hop-advice-result-v1:') });
    expect(hopAdviceResultReference(result)).toBe(result.reference);
    expect(JSON.stringify(input)).toBe(before);
    expect(() => assertHopStrategyAdviceResult(result)).not.toThrow();
  });

  it('inverse seek et avoid sur la même famille, garde le partenaire explicite sans maximiser son accord', () => {
    const input = planningInput();
    const seek = exploreHopStrategies(input);
    const seekOption = optionForMaterial(seek, 'unfamiliar-comparator-17');
    const avoidInput = structuredClone(input);
    avoidInput.intent.criteria![2].role = 'avoid';
    const avoid = exploreHopStrategies(avoidInput);
    const avoidOption = optionForMaterial(avoid, 'unfamiliar-comparator-17');
    const seekEffect = seekOption.criterionEffects.find(effect => effect.criterionId === 'aroma-seek')!;
    const avoidEffect = avoidOption.criterionEffects.find(effect => effect.criterionId === 'aroma-seek')!;
    expect(seekEffect.status).toBe('documentedSupport');
    expect(avoidEffect.status).toBe('documentedTension');
    expect(seekEffect.reason).not.toBe(avoidEffect.reason);
    expect(seekOption.reference).not.toBe(avoidOption.reference);

    const pairInput = structuredClone(input);
    pairInput.intent.criteria = [{
      id: 'pairing-goal', description: 'Comparer à un contexte communiqué.', role: 'pairWith', origin: 'user',
      partner: { kind: 'freeContext', text: 'banane mûre rapportée en dégustation' },
    }];
    pairInput.situation.criterionDimensions = [{ criterionId: 'pairing-goal', dimension: 'aroma', familyId: 'citrus' }];
    const pairing = exploreHopStrategies(pairInput);
    const pairEffect = optionForMaterial(pairing, 'unfamiliar-comparator-17').criterionEffects[0];
    expect(pairEffect.status).toBe('unknown');
    expect(pairEffect.reason).toMatch(/contexte libre|partenaire/i);
    expect(pairEffect.reason).not.toMatch(/maximiser|synergie|intensité souhaitée/i);
  });

  it('retire uniquement l’ajout prévu, garde l’opération effectuée et offre aussi une voie positive conditionnelle', () => {
    const input = conditioningInput();
    input.situation.assertions = input.situation.assertions.filter(assertion => assertion.dimension !== 'hopCreep');
    const programBefore = JSON.stringify(input.situation.program);
    const result = exploreHopStrategies(input);
    const remove = result.options.find(option => option.programScope.kind === 'removePlanned');
    expect(remove?.programScope).toEqual({ kind: 'removePlanned', additionIds: ['planned-follow-up-hop'] });
    const candidate = optionForMaterial(result, 'lot-traceable-93');
    expect(candidate.programScope).toMatchObject({ kind: 'addOrReplace', materialIds: ['lot-traceable-93'], uses: ['postFermentation'], additionIds: ['planned-follow-up-hop'], allowAppend: false });
    for (const option of result.options) {
      if (option.programScope.kind === 'removePlanned') expect(option.programScope.additionIds).not.toContain('performed-late-hop');
      if (option.programScope.kind === 'addOrReplace') expect(option.programScope.additionIds).not.toContain('performed-late-hop');
    }
    expect(candidate.dimensionEffects.find(effect => effect.dimension === 'bioInteraction')).toBeUndefined();
    expect(result.evidenceSources.some(source => source.id.startsWith('m-ab-'))).toBe(false);
    const keep = result.options.find(option => option.title.includes('Laisser l’ajout planned-follow-up-hop'))!;
    expect(keep.programScope).toEqual({ kind: 'none' });
    expect(keep.conditions.join(' ')).toMatch(/reste planifié et non exécuté/i);
    expect(candidate.dimensionEffects.find(effect => effect.dimension === 'hopCreep'))
      .toMatchObject({ status: 'conditional', evidenceIds: expect.arrayContaining(['m-hc-kirkpatrick-2018', 'm-hc-willemart-2025']) });
    const hopCreepCandidate = candidate.dimensionEffects.find(effect => effect.dimension === 'hopCreep')!;
    const removedHopCreep = remove!.dimensionEffects.find(effect => effect.dimension === 'hopCreep')!;
    const keptHopCreep = keep.dimensionEffects.find(effect => effect.dimension === 'hopCreep')!;
    expect(hopCreepCandidate.statement).toMatch(/déjà effectué.*remplacé.*futur/i);
    expect(removedHopCreep.statement).toMatch(/déjà effectué.*retire seulement/i);
    expect(keptHopCreep.statement).toMatch(/déjà effectué.*en attente/i);
    const removedAlcohol = remove!.dimensionEffects.find(effect => effect.dimension === 'alcohol')!;
    const keptAlcohol = keep.dimensionEffects.find(effect => effect.dimension === 'alcohol')!;
    const removedAcidity = remove!.dimensionEffects.find(effect => effect.dimension === 'acidity')!;
    const keptAcidity = keep.dimensionEffects.find(effect => effect.dimension === 'acidity')!;
    expect(removedAlcohol.statement).not.toBe(keptAlcohol.statement);
    expect(removedAcidity.statement).not.toBe(keptAcidity.statement);
    expect(removedAlcohol.status).toBe('unknown');
    expect(removedAcidity.status).toBe('conditional');
    expect(candidate.criterionEffects.find(effect => effect.criterionId === 'alcohol'))
      .toMatchObject({ status: 'constraintUnverified' });
    expect(candidate.criterionEffects.find(effect => effect.criterionId === 'preserve-performed'))
      .toMatchObject({ status: 'constraintSatisfied', reason: expect.stringMatching(/contrôle explicite/i) });
    expect(candidate.conditions.join(' ')).toMatch(/effectuées|dose|stock|revalidés/i);
    expect(JSON.stringify(input.situation.program)).toBe(programBefore);
    expect(result.stage).toBe('conditioning');

    const withoutCheck = structuredClone(input);
    delete withoutCheck.situation.constraintChecks;
    const unverified = exploreHopStrategies(withoutCheck);
    expect(optionForMaterial(unverified, 'lot-traceable-93').criterionEffects.find(effect => effect.criterionId === 'preserve-performed'))
      .toMatchObject({ status: 'constraintUnverified' });
  });

  it('applique les exclusions par identité et garde la raison; le retrait d’une ligne prévue reste possible', () => {
    const input = conditioningInput();
    const houseId = 'house-hop-lot-unanalysed';
    input.situation.exclusions = [{ materialId: houseId, reason: 'Exclusion explicite de la demande synthétique.', certainty: 'certain' }];
    const result = exploreHopStrategies(input);
    expect(result.options.some(option => option.programScope.kind === 'addOrReplace' && option.programScope.materialIds.includes(houseId))).toBe(false);
    expect(result.options.some(option => option.programScope.kind === 'removePlanned' && option.programScope.additionIds.includes('planned-follow-up-hop'))).toBe(true);
    expect(result.options.every(option => option.exclusions.some(row => row.materialId === houseId && row.status === 'excluded'))).toBe(true);
    expect(result.coverage.excludedMaterialIds).toContain(houseId);
  });

  it('distingue exclusion certaine de possible/inconnue sans cacher les voies conditionnelles', () => {
    const materialId = 'lot-traceable-93';
    for (const certainty of ['possible', 'unknown'] as const) {
      const input = conditioningInput();
      input.situation.exclusions = [{ materialId, certainty, reason: `Motif ${certainty} à résoudre.` }];
      const result = exploreHopStrategies(input);
      const candidate = optionForMaterial(result, materialId);
      expect(candidate.programScope.kind).toBe('addOrReplace');
      expect(candidate.relevance).toBe('conditional');
      expect(candidate.exclusions).toContainEqual({ materialId, status: certainty, reason: `Motif ${certainty} à résoudre.` });
      expect(candidate.conditions.join(' ')).toMatch(new RegExp(`Exclusion ${certainty}`));
      expect(result.coverage.excludedMaterialIds).not.toContain(materialId);
      expect(result.coverage.status).toBe('partial');
    }

    const certainInput = conditioningInput();
    certainInput.situation.exclusions = [{ materialId, certainty: 'certain', reason: 'Exclusion explicite.' }];
    const certain = exploreHopStrategies(certainInput);
    expect(certain.options.some(option => option.programScope.kind === 'addOrReplace' && option.programScope.materialIds.includes(materialId))).toBe(false);
    expect(certain.coverage.excludedMaterialIds).toContain(materialId);
  });

  it('reconnaît les assertions d’alcool fournies sans inférer leur rôle ni leur conformité', () => {
    const input = planningInput();
    input.situation.assertions = [
      { id: 'current-abv-reading', subject: 'current-abv', statement: 'Mesure rapportée pour la fixture.', state: 'measured', value: 0.6, unit: '%vol', dimension: 'alcohol' },
      { id: 'upper-limit-field', subject: 'limit-from-another-caller', statement: 'Seuil communiqué pour cette fixture.', state: 'reported', value: 1, unit: '%vol', dimension: 'alcohol' },
    ];
    const result = exploreHopStrategies(input);
    const balance = result.options.find(option => /bilan des contraintes/i.test(option.title))!;
    expect(balance.criterionEffects.find(effect => effect.criterionId === 'alcohol-constraint'))
      .toMatchObject({ status: 'constraintUnverified', reason: expect.stringMatching(/assertions structurées d’alcool sont fournies/i) });
    expect(balance.dimensionEffects.find(effect => effect.dimension === 'alcohol'))
      .toMatchObject({ status: 'unknown', statement: expect.stringMatching(/assertions structurées d’alcool sont fournies.*ne sont pas évalués/i) });
    expect(result.informationRequests.some(request => request.id === 'decision-alcohol-constraint-alcohol')).toBe(false);
    expect(JSON.stringify(result)).not.toMatch(/conforme|non conforme|plafond non fourni/i);
  });

  it('ajoute la voie biologique explicitement demandée tout en gardant la voie arôme autonome', () => {
    const input = planningInput();
    input.intent.criteria!.push({ id: 'bio-question', description: 'Examen biologique demandé séparément.', role: 'seek', origin: 'user' });
    input.situation.criterionDimensions.push({ criterionId: 'bio-question', dimension: 'bioInteraction' });
    const result = exploreHopStrategies(input);
    const bio = result.options.find(option => /question biologique explicitement/i.test(option.title))!;
    expect(bio).toBeDefined();
    expect(bio.dimensionEffects.find(effect => effect.dimension === 'bioInteraction'))
      .toMatchObject({ status: 'conditional', evidenceIds: expect.arrayContaining(['m-ab-dysvik-2020', 'm-ab-mahanta-2022']) });
    expect(result.informationRequests.some(request => /culture\/produit|viabilité/i.test(request.question))).toBe(true);
    expect(result.options.some(option => /transfert direct/i.test(option.title))).toBe(true);
  });

  it('conserve null, zéro, matières omises/conditionnelles et limites de couverture sans annuler les autres pistes', () => {
    const base = planningInput();
    const candidateId = 'unfamiliar-comparator-17';
    const unknownStock = exploreHopStrategies(base);
    const unknownOption = optionForMaterial(unknownStock, candidateId);
    expect(unknownOption.dimensionEffects.find(effect => effect.dimension === 'stock'))
      .toMatchObject({ status: 'unknown', statement: expect.stringMatching(/inconnu/i) });

    const zeroInput = structuredClone(base);
    zeroInput.materials.find(row => row.id === candidateId)!.availableGrams = 0;
    const zeroStock = exploreHopStrategies(zeroInput);
    expect(zeroStock.options.some(option => option.programScope.kind === 'addOrReplace' && option.programScope.materialIds.includes(candidateId))).toBe(false);
    expect(zeroStock.options.some(option => option.conditions.join(' ').match(/stock local déclaré nul/i))).toBe(true);

    const qualified = structuredClone(base);
    qualified.situation.materialIds = ['omitted-material-identity', candidateId];
    qualified.qualification = {
      omitted: [{ materialId: 'omitted-material-identity', recordKeys: ['lot:omitted-v'], reason: 'Aucune projection calculatoire sûre n’a été transmise.' }],
      conditional: [{ materialId: candidateId, recordKeys: ['variety:conditional-v'], reason: 'Vue commune sûre; analyses détaillées divergentes.' }],
      limitations: ['Une matière reste omise; la couverture n’est pas complète.'],
    };
    const partial = exploreHopStrategies(qualified);
    expect(partial.coverage.status).toBe('partial');
    expect(partial.coverage.omittedMaterials).toEqual(qualified.qualification.omitted);
    expect(partial.options.some(option => option.programScope.kind === 'addOrReplace' && option.programScope.materialIds.includes('omitted-material-identity'))).toBe(false);
    expect(partial.options.some(option => option.programScope.kind === 'addOrReplace' && option.programScope.materialIds.includes(candidateId))).toBe(true);
    expect(partial.options.find(option => option.programScope.kind === 'addOrReplace' && option.programScope.materialIds.includes(candidateId))!.conditions.join(' '))
      .toMatch(/vue conditionnelle|analyses détaillées/i);
    expect(partial.limitations).toContain('Une matière reste omise; la couverture n’est pas complète.');
  });

  it('ne déduit pas une famille depuis du texte libre et ne spécialise pas sa règle au nom d’une matière', () => {
    const input = planningInput();
    input.intent.criteria = [{ id: 'free-text-aroma', description: 'fruité citron vert', role: 'seek', origin: 'user' }];
    input.situation.criterionDimensions = [];
    const first = exploreHopStrategies(input);
    const firstOption = optionForMaterial(first, 'unfamiliar-comparator-17');
    expect(firstOption.criterionEffects[0]).toMatchObject({ status: 'unknown', reason: expect.stringMatching(/aucune dimension ou famille/i) });

    const renamed = structuredClone(input);
    const candidate = renamed.materials.find(row => row.id === 'unfamiliar-comparator-17')!;
    candidate.id = 'new-id-unseen-before';
    candidate.name = 'Nouvelle désignation non connue du moteur';
    if (candidate.variety) candidate.variety.id = 'variety-new-id';
    renamed.situation.materialIds = ['house-hop-lot-unanalysed', candidate.id];
    const second = exploreHopStrategies(renamed);
    const renamedOption = optionForMaterial(second, candidate.id);
    expect(renamedOption.criterionEffects[0]).toMatchObject({ status: 'unknown' });
    expect(second.inputReference).not.toBe(first.inputReference);
    expect(renamedOption.title).toContain(candidate.name);
  });

  it('garde les portées packaged sans opération immédiate et valide les références de contenu', () => {
    const input = conditioningInput();
    input.situation.stage = 'packaged';
    input.situation.program = { ...input.situation.program!, stage: 'packaged' };
    const result = exploreHopStrategies(input);
    expect(result.options.every(option => option.programScope.kind === 'none')).toBe(true);
    expect(result.options.every(option => option.conditions.join(' ').match(/conditionné|futur/i))).toBe(true);
    expect(() => assertHopStrategyAdviceResult(result)).not.toThrow();
    const altered = structuredClone(result);
    altered.options[0].conditions.push('Texte ajouté sans refaire la référence.');
    expect(() => assertHopStrategyAdviceResult(altered)).toThrow(/référence d’option incohérente/i);
    const alteredResult = structuredClone(result);
    alteredResult.limitations.push('Texte ajouté sans refaire la référence globale.');
    expect(() => assertHopStrategyAdviceResult(alteredResult)).toThrow(/référence du résultat incohérente/i);
  });
});
