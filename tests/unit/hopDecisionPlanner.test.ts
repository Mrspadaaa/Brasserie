import { describe, expect, it } from 'vitest';
import type { HopDescription, HopSource } from '../../functions/src/hopIndexSchema';
import {
  applySelectedHopReplacement,
  planHopReplacement,
  selectHopReplacementPath,
  type HopPlannerRequest,
} from '../../src/domain/hopDecision/planner';
import { restoreHopProgramDraft } from '../../src/domain/hopDecision/programs';
import { analyzeHopProgram } from '../../src/domain/hopDecision/programAnalysis';
import type { HopCommercialProduct, HopDecisionMaterial, HopDecisionProgram, HopProgramAddition } from '../../src/domain/hopDecision/types';

const sourceRef = (key: string, kind: HopSource['kind'] = 'observation'): HopSource => ({
  title: `Fixture ${key}`, author: 'Tests J1', year: 2026, kind, reference: `fixture:${key}`,
  locator: 'Donnée synthétique, créée pour le test; aucun lot ou brassin réel.',
});

const description = (text: string, context: HopDescription['context'], key: string): HopDescription => ({
  text, context, source: sourceRef(key),
});

const product = (
  id: string,
  supportedUses: HopCommercialProduct['supportedUses'],
  maxDoseGL?: number,
): HopCommercialProduct => ({
  id, name: `Produit ${id}`, manufacturer: 'Fournisseur fictif', form: 'pelletT90', supportedUses,
  source: sourceRef(`product:${id}`, 'manufacturer'), reviewedOn: '2026-10-01', cautions: [],
  ...(maxDoseGL === undefined ? {} : { replacement: {
    referenceForm: 'pelletT90', uses: [...supportedUses], basis: 'manufacturerMassRatio' as const,
    gramsPerGram: { min: 1, max: 1 }, source: sourceRef(`limit:${id}`, 'manufacturer'),
    limitations: ['Fixture synthétique.'], maxDoseGL,
  } }),
});

const material = (
  id: string,
  over: Partial<HopDecisionMaterial> = {},
): HopDecisionMaterial => ({
  id, name: `Matière ${id}`, form: 'pelletT90', availableGrams: 100,
  variety: { id: `var:${id}`, name: `Variété ${id}`, aliases: [], form: 'pelletT90', analysis: [], descriptions: [] },
  lot: { id: `lot:${id}`, varietyId: `var:${id}`, name: `Lot ${id}`, form: 'pelletT90', analysis: [] },
  ...over,
});

const addition = (over: Partial<HopProgramAddition> = {}): HopProgramAddition => ({
  id: 'future-ferment', materialId: 'source-material', grams: 8, use: 'fermentation', status: 'planned',
  contactHours: 36, temperatureC: 18,
  ...over,
});

const program = (over: Partial<HopDecisionProgram> = {}): HopDecisionProgram => ({
  id: 'synthetic-program', revision: 4, stage: 'fermenting', volumeL: 20, wortGravity: 1.05,
  additions: [addition()],
  ...over,
});

const request = (over: Partial<HopPlannerRequest> = {}): HopPlannerRequest => ({
  question: 'Remplacer une matière indisponible et préserver les usages restants.',
  interpretation: 'La matière citée est indisponible; les critères aromatiques restent documentaires.',
  criteria: [], program: program(), unavailable: { materialId: 'source-material', reason: 'Stock signalé à zéro.', origin: 'user' },
  materials: [material('source-material'), material('candidate-material')], basisByUse: { fermentation: 'sameMass' },
  limits: { maxCandidateMaterials: 30, maxAssignments: 100, maxPrograms: 40 },
  ...over,
});

const fermentation = (id: string, materialId = 'source-material', grams = 8) => addition({ id, materialId, grams, use: 'fermentation' });
const postFermentation = (id: string, materialId = 'source-material', grams = 8) => addition({
  id, materialId, grams, use: 'postFermentation', contactHours: 48, temperatureC: 16,
});

describe('planification bornée du remplacement d’une matière', () => {
  it('découvre une voie par emploi et une matière unique couvrant les emplois sans plans préfabriqués', () => {
    const b = material('candidate-b', { product: product('product-b', ['fermentation']) });
    const c = material('candidate-c', { product: product('product-c', ['postFermentation']) });
    const d = material('candidate-d', { product: product('product-d', ['fermentation', 'postFermentation']) });
    const input = request({
      program: program({ additions: [fermentation('line-fermentation'), postFermentation('line-post')] }),
      materials: [material('source-material'), b, c, d],
      basisByUse: { fermentation: 'sameMass', postFermentation: 'sameMass' },
    });

    const result = planHopReplacement(input);
    const mixed = result.paths.find(path => path.kind === 'mixedMaterials');
    const single = result.paths.find(path => path.kind === 'singleMaterial');

    expect(mixed?.assignments.map(row => [row.use, row.candidateMaterialId])).toEqual([
      ['fermentation', 'candidate-b'], ['postFermentation', 'candidate-c'],
    ]);
    expect(single?.assignments.map(row => row.candidateMaterialId)).toEqual(['candidate-d', 'candidate-d']);
    expect(mixed?.preview?.applicability).toBe('available');
    expect(result.search.exhaustiveWithinScope).toBe(true);
    expect(result.effects).toEqual({ writesRecipe: false, writesBrewDay: false, writesStock: false });
  });

  it('regroupe le stock partagé du programme complet au lieu de compter les alias deux fois', () => {
    const b = material('candidate-b', { stockItemRef: 'shared-bin', availableGrams: 10, product: product('product-b', ['fermentation']) });
    const c = material('candidate-c', { stockItemRef: 'shared-bin', availableGrams: 10, product: product('product-c', ['postFermentation']) });
    const input = request({
      program: program({ additions: [fermentation('line-fermentation', 'source-material', 8), postFermentation('line-post', 'source-material', 8)] }),
      materials: [material('source-material'), b, c], basisByUse: { fermentation: 'sameMass', postFermentation: 'sameMass' },
    });
    const result = planHopReplacement(input);
    const mixed = result.paths.find(path => path.kind === 'mixedMaterials')!;

    expect(mixed.assignments.map(row => row.candidateMaterialId)).toEqual(['candidate-b', 'candidate-c']);
    expect(mixed.preview?.stock).toEqual([{
      materialId: 'candidate-b', materialIds: ['candidate-b', 'candidate-c'], stockItemRef: 'shared-bin',
      neededGrams: 16, availableGrams: 10, status: 'insufficient',
    }]);
    expect(mixed.applicability).toBe('unavailable');
    expect(() => selectHopReplacementPath({ request: input, plan: result, pathId: mixed.pathId }))
      .toThrow(/indisponible/i);
  });

  it('applique une exclusion d’identité à toutes les références correspondantes', () => {
    const excluded = material('alias-not-allowed', { stockItemRef: 'blocked-physical-stock' });
    const allowed = material('allowed-material');
    const input = request({ materials: [material('source-material'), excluded, allowed], exclusions: [{
      kind: 'stockItemRef', value: 'blocked-physical-stock', reason: 'Matière exclue explicitement.', origin: 'user',
    }] });
    const result = planHopReplacement(input);

    expect(result.search.excludedMaterialIds).toEqual(['alias-not-allowed']);
    expect(result.paths.every(path => path.assignments.every(row => row.candidateMaterialId !== excluded.id))).toBe(true);
    expect(result.paths.some(path => path.assignments[0].candidateMaterialId === allowed.id)).toBe(true);
  });

  it('résout une exclusion dans tout le catalogue avant filtrage de portée, sans exclure un autre lot', () => {
    const makeAlias = (id: string, descriptionText: string, productId = 'shared-product') => material(id, {
      stockItemRef: 'shared-stock',
      variety: { id: 'shared-variety', name: 'Variété partagée', aliases: [], form: 'pelletT90', analysis: [],
        descriptions: [description(descriptionText, 'rawHop', `description:${id}`)] },
      lot: { id: 'shared-lot', varietyId: 'shared-variety', name: 'Lot partagé', form: 'pelletT90',
        stockItemRef: 'shared-stock', analysis: [] },
      product: product(productId, ['fermentation']),
    });
    const excludedAlias = makeAlias('excluded-material', 'Description de la référence exclue.');
    const onlyScopedAlias = makeAlias('scoped-alias', 'Description de son alias physique.');
    const differentLot = material('different-lot', {
      stockItemRef: 'other-stock',
      variety: { id: 'shared-variety', name: 'Variété partagée', aliases: [], form: 'pelletT90', analysis: [], descriptions: [] },
      lot: { id: 'other-lot', varietyId: 'shared-variety', name: 'Lot distinct', form: 'pelletT90', stockItemRef: 'other-stock', analysis: [] },
      product: product('shared-product', ['fermentation']),
    });
    const base = request({ materials: [material('source-material'), excludedAlias, onlyScopedAlias, differentLot],
      candidateMaterialIds: ['scoped-alias', 'different-lot'] });
    const cases = [
      { kind: 'materialId' as const, value: 'excluded-material' },
      { kind: 'stockItemRef' as const, value: 'shared-stock' },
      { kind: 'lotId' as const, value: 'shared-lot' },
      { kind: 'productId' as const, value: 'shared-product' },
    ];

    for (const exclusion of cases) {
      const result = planHopReplacement({ ...base, exclusions: [{ ...exclusion, reason: 'Exclusion synthétique.', origin: 'user' }] });
      expect(result.search.excludedMaterialIds).toContain('scoped-alias');
      expect(result.search.candidateMaterialIds).not.toContain('scoped-alias');
      if (exclusion.kind === 'productId') {
        expect(result.search.excludedMaterialIds).toContain('different-lot');
        expect(result.search.candidateMaterialIds).not.toContain('different-lot');
      } else {
        expect(result.search.candidateMaterialIds).toContain('different-lot');
      }
    }
  });

  it('garde chaque variante documentaire des alias divergents et ne choisit aucune première analyse', () => {
    const shared = (id: string, words: string[]) => material(id, {
      stockItemRef: 'shared-stock',
      variety: { id: 'shared-variety', name: 'Variété commune', aliases: [], form: 'pelletT90', analysis: [],
        descriptions: words.map((word, index) => description(word, 'rawHop', `${id}:${index}`)) },
      lot: { id: 'shared-lot', varietyId: 'shared-variety', name: 'Lot partagé', form: 'pelletT90', stockItemRef: 'shared-stock', analysis: [] },
    });
    const aliasA = shared('alias-a', ['Agrumes signalés dans une fiche.']);
    const aliasB = shared('alias-b', ['Résine signalée dans une autre fiche.']);
    const input = request({ materials: [material('source-material'), aliasB, aliasA] });
    const result = planHopReplacement(input);
    const options = result.lines[0].options;

    expect(options.map(option => option.candidateMaterialId)).toEqual(['alias-a', 'alias-b']);
    expect(options.every(option => option.candidateIdentityMaterialIds.join(',') === 'alias-a,alias-b')).toBe(true);
    expect(options.map(option => option.documentaryDivergenceFields)).toEqual([['variety'], ['variety']]);
    const variants = result.search.candidateIdentityGroups[0].variants;
    expect(variants).toHaveLength(2);
    expect(variants[0].factsReference).not.toBe(variants[1].factsReference);
    expect(result.search.candidateIdentityGroups[0].aliases.map(alias => alias.materialId)).toEqual(['alias-a', 'alias-b']);
    expect(result.paths.every(path => path.applicability === 'conditional')).toBe(true);
    expect(result.paths.every(path => !path.pathId.includes('Agrumes signalés'))).toBe(true);

    const equivalentB = { ...aliasA, id: 'equivalent-alias', name: 'Autre nom stocké' };
    const equivalent = planHopReplacement({ ...input, materials: [material('source-material'), aliasA, equivalentB] });
    expect(equivalent.lines[0].options).toHaveLength(1);
    expect(equivalent.lines[0].options[0].candidateIdentityMaterialIds).toEqual(['alias-a', 'equivalent-alias']);
    expect(equivalent.lines[0].options[0].documentaryDivergenceFields).toEqual([]);
  });

  it('rend indisponible une voie qui laisserait une autre exclusion future dans le programme entier', () => {
    const forbidden = material('forbidden-existing');
    const completed = addition({ id: 'completed-forbidden', materialId: forbidden.id, grams: 4, status: 'performed' });
    const futureForbidden = postFermentation('future-forbidden', forbidden.id, 5);
    const input = request({
      program: program({ additions: [postFermentation('target-source'), completed, futureForbidden] }),
      materials: [material('source-material'), material('candidate-material'), forbidden],
      basisByUse: { postFermentation: 'sameMass' },
      exclusions: [{ kind: 'materialId', value: forbidden.id, reason: 'Cette identité est exclue du brassin.', origin: 'user' }],
    });
    const result = planHopReplacement(input);
    const path = result.paths[0];

    expect(result.excludedProgramAdditions).toEqual([
      { additionId: completed.id, materialId: forbidden.id, state: 'performed', reason: expect.stringMatching(/déjà effectuée/) },
      { additionId: futureForbidden.id, materialId: forbidden.id, state: 'future', reason: expect.stringMatching(/toujours planifiée/) },
    ]);
    expect(path.preview?.program.additions.find(row => row.id === completed.id)).toEqual(completed);
    expect(path.complete).toBe(false);
    expect(path.applicability).toBe('unavailable');
    expect(path.conditions.join(' ')).toMatch(/future-forbidden.*ne couvre pas tout le programme/u);
    expect(() => selectHopReplacementPath({ request: input, plan: result, pathId: path.pathId })).toThrow(/incomplète/i);
  });

  it('change le conseil par critère et conserve les preuves de pairing sans score', () => {
    const citrusCandidate = material('candidate-with-evidence', { variety: {
      id: 'variety-with-evidence', name: 'Nom générique 1', aliases: [], form: 'pelletT90', analysis: [],
      descriptions: [description('Agrumes signalés sur le houblon brut.', 'rawHop', 'candidate-aroma')],
    }, lot: undefined });
    const base = request({ materials: [material('source-material'), citrusCandidate] });
    const seek = planHopReplacement({ ...base, criteria: [{ id: 'criterion-1', description: 'Chercher cette famille.', role: 'seek', origin: 'user', familyId: 'citrus' }] });
    const avoid = planHopReplacement({ ...base, criteria: [{ id: 'criterion-1', description: 'Éviter cette famille.', role: 'avoid', origin: 'user', familyId: 'citrus' }] });
    const pairing = planHopReplacement({ ...base, criteria: [{
      id: 'criterion-1', description: 'Examiner l’accord avec le partenaire observé.', role: 'pairWith', origin: 'user', familyId: 'citrus',
      partner: { kind: 'observation', id: 'sample:unseen-id-1', descriptions: [description('Agrumes cités dans une bière témoin.', 'beer', 'partner-aroma')] },
    }] });
    const seekEvidence = seek.paths[0].criteria[0];
    const avoidEvidence = avoid.paths[0].criteria[0];
    const pairingEvidence = pairing.paths[0].criteria[0];

    expect(seekEvidence.status).toBe('documentedSupport');
    expect(avoidEvidence.status).toBe('documentedTension');
    expect(seek.paths[0].pathId).not.toBe(avoid.paths[0].pathId);
    expect(pairingEvidence.status).toBe('documentedOverlap');
    expect(pairingEvidence.candidateEvidence[0].source.reference).toBe('fixture:candidate-aroma');
    expect(pairingEvidence.partnerEvidence[0].source.reference).toBe('fixture:partner-aroma');
    expect(pairingEvidence.consequence).toMatch(/pas une mesure d'accord, de synergie ou d'intensité/u);
    expect(pairing.paths[0]).not.toHaveProperty('score');
  });

  it('garde une ligne à dose inconnue visible sans effacer une autre ligne calculable', () => {
    const candidate = material('candidate-partial');
    const input = request({
      program: program({ additions: [fermentation('known-line', 'source-material', 8), postFermentation('unknown-line', 'source-material', 6)] }),
      materials: [material('source-material'), candidate],
      basisByUse: { fermentation: 'sameMass', postFermentation: 'alphaLoad' },
    });
    const result = planHopReplacement(input);
    const path = result.paths[0];

    expect(path.assignments.map(row => row.status)).toEqual(['fixed', 'unknown']);
    expect(path.assignments[0].doseGrams.value).toBe(8);
    expect(path.assignments[1].doseGrams.status).toBe('unknown');
    expect(path.preview).toBeNull();
    expect(path.applicability).toBe('conditional');
    expect(() => selectHopReplacementPath({ request: input, plan: result, pathId: path.pathId }))
      .toThrow(/dose ou convention inconnue/i);
  });

  it('ne fabrique pas une convention de même masse quand l’emploi n’en a pas reçu', () => {
    const input = request({ basisByUse: {} });
    const result = planHopReplacement(input);
    const option = result.paths[0].assignments[0];

    expect(option.basis).toBeNull();
    expect(option.doseGrams.status).toBe('unknown');
    expect(option.missing).toContain('Convention de dose pour fermentation.');
    expect(result.paths[0].preview).toBeNull();
    expect(() => selectHopReplacementPath({ request: input, plan: result, pathId: result.paths[0].pathId }))
      .toThrow(/dose ou convention inconnue/i);
  });

  it('garde une plage fabricant comme choix explicite au lieu d’en prendre le milieu', () => {
    const candidate = material('candidate-range', { product: {
      ...product('product-range', ['fermentation']),
      replacement: { referenceForm: 'pelletT90', uses: ['fermentation'], basis: 'manufacturerMassRatio',
        gramsPerGram: { min: 0.8, max: 1.2 }, source: sourceRef('range-rule', 'manufacturer'),
        limitations: ['Convention synthétique de fixture.'] },
    } });
    const input = request({ materials: [material('source-material'), candidate], basisByUse: { fermentation: 'manufacturer' } });
    const plan = planHopReplacement(input);
    const path = plan.paths[0];

    expect(path.assignments[0].doseGrams).toMatchObject({ status: 'range', value: null, range: { min: 6.4, max: 9.6 } });
    expect(path.status).toBe('chooseDose');
    expect(path.preview).toBeNull();
    expect(() => selectHopReplacementPath({ request: input, plan, pathId: path.pathId }))
      .toThrow(/choisir une dose finie/i);
    const selected = selectHopReplacementPath({ request: input, plan, pathId: path.pathId, dosesByAdditionId: { 'future-ferment': 9 } });
    expect(selected.selectedDoses).toEqual([{ additionId: 'future-ferment', materialId: 'candidate-range', grams: 9, basis: 'manufacturer' }]);
    expect(selected.proposal.program.additions[0].grams).toBe(9);
  });

  it('n’utilise ni nom ni identifiant comme branche de règle', () => {
    const first = request({ materials: [material('source-material'), material('candidate-material')] });
    const rotated = request({
      unavailable: { materialId: 'xq-71', reason: 'Autre identité signalée.', origin: 'user' },
      program: program({ additions: [addition({ materialId: 'xq-71' })] }),
      materials: [material('xq-71', { name: 'Nom inédit sans vocabulaire particulier' }), material('zv-804', { name: 'Nom tout aussi inédit' })],
    });
    const left = planHopReplacement(first).paths[0];
    const right = planHopReplacement(rotated).paths[0];

    expect(left.kind).toBe(right.kind);
    expect(left.assignments.map(row => [row.use, row.basis, row.status])).toEqual(right.assignments.map(row => [row.use, row.basis, row.status]));
    expect(left.applicability).toBe(right.applicability);
  });

  it('égalise uniquement la contribution Tinseth déclarée et prend les alphas propres à chaque ajout/matière', () => {
    const alphaModel = (value: number, key: string) => ({ analyte: 'alpha' as const, unit: 'percentAlpha' as const,
      kind: 'point' as const, value, analyticalBasis: 'unknown' as const, origin: 'workingHypothesis' as const,
      source: sourceRef(key), selectionReason: 'Hypothèse de modèle explicitement choisie.' });
    const source = material('source-material');
    const candidate = material('candidate-material', { alphaForModel: alphaModel(5, 'candidate-alpha') });
    const boilAddition = addition({ id: 'boil-source', grams: 10, use: 'boil', boilMinutes: 60,
      alphaForModel: alphaModel(10, 'addition-source-alpha') });
    const input = request({
      program: program({ stage: 'hotSide', additions: [boilAddition], ibuModelContext: { variant: 'tinseth-original', volumeL: 20,
        volumeReference: 'finishedBeer', gravity: 1.05, gravityReference: 'averageBoil', explanation: 'Fixture de convention déclarée.' } }),
      materials: [source, candidate], basisByUse: { boil: 'tinsethIbu' },
    });
    const path = planHopReplacement(input).paths[0];

    expect(path.assignments[0].doseGrams.status).toBe('nominal');
    expect(path.assignments[0].doseGrams.value).toBeCloseTo(20, 10);
    expect(path.assignments[0].reasons.join(' ')).toMatch(/charge physique d’alpha.*séparées/u);
    expect(path.assignments[0].introduced.alphaGrams.status).toBe('unknown');
    const plan = planHopReplacement(input);
    const selection = selectHopReplacementPath({ request: input, plan, pathId: path.pathId });
    expect(selection.proposal.program.additions[0]).not.toHaveProperty('alphaForModel');
  });

  it('ne garantit pas l’égalité Tinseth sur une plage, puis recalcule après choix d’alpha', () => {
    const alphaModel = (range: { min: number; max: number }, key: string) => ({ analyte: 'alpha' as const, unit: 'percentAlpha' as const,
      kind: 'range' as const, range, analyticalBasis: 'unknown' as const, origin: 'workingHypothesis' as const,
      source: sourceRef(key), selectionReason: 'Plage de travail explicitement choisie.' });
    const pointAlpha = (value: number, key: string) => ({ analyte: 'alpha' as const, unit: 'percentAlpha' as const,
      kind: 'point' as const, value, analyticalBasis: 'unknown' as const, origin: 'workingHypothesis' as const,
      source: sourceRef(key), selectionReason: 'Point de travail explicitement choisi après comparaison.' });
    const source = material('source-material');
    const candidate = material('candidate-material', { alphaForModel: alphaModel({ min: 4, max: 8 }, 'candidate-alpha-range') });
    const boil = addition({ id: 'boil-range', grams: 10, use: 'boil', boilMinutes: 60,
      alphaForModel: alphaModel({ min: 8, max: 10 }, 'source-alpha-range') });
    const modelContext = { variant: 'tinseth-original' as const, volumeL: 20, volumeReference: 'finishedBeer' as const,
      gravity: 1.05, gravityReference: 'averageBoil' as const, explanation: 'Fixture avec rôles déclarés.' };
    const rangedRequest = request({ program: program({ stage: 'hotSide', additions: [boil], ibuModelContext: modelContext }),
      materials: [source, candidate], basisByUse: { boil: 'tinsethIbu' } });
    const rangePlan = planHopReplacement(rangedRequest);
    const rangePath = rangePlan.paths[0];

    expect(rangePath.assignments[0].doseGrams).toMatchObject({ status: 'range', range: { min: 10, max: 25 } });
    expect(rangePath.assignments[0].doseGrams.reasons.join(' ')).toMatch(/ne garantit pas une contribution égale pour toutes les valeurs alpha/u);
    const chosenRange = selectHopReplacementPath({ request: rangedRequest, plan: rangePlan, pathId: rangePath.pathId,
      dosesByAdditionId: { 'boil-range': 15 } });
    const preChoice = analyzeHopProgram(rangedRequest.program, rangedRequest.materials);
    const postRangeChoice = analyzeHopProgram(chosenRange.proposal.program, rangedRequest.materials);
    expect(postRangeChoice.hotIbu.range).not.toEqual(preChoice.hotIbu.range);

    const chosenRequest = { ...rangedRequest,
      program: { ...rangedRequest.program, additions: [{ ...boil, alphaForModel: pointAlpha(8, 'source-alpha-point') }] },
      materials: [source, { ...candidate, alphaForModel: pointAlpha(8, 'candidate-alpha-point') }],
    };
    const chosenPlan = planHopReplacement(chosenRequest);
    const chosenPath = chosenPlan.paths[0];
    expect(chosenPath.assignments[0].doseGrams).toMatchObject({ status: 'nominal', value: 10 });
    const finalChoice = selectHopReplacementPath({ request: chosenRequest, plan: chosenPlan, pathId: chosenPath.pathId });
    const finalAnalysis = analyzeHopProgram(finalChoice.proposal.program, chosenRequest.materials);
    expect(finalAnalysis.hotIbu.value).toBeCloseTo(analyzeHopProgram(chosenRequest.program, chosenRequest.materials).hotIbu.value!, 10);
  });

  it('vérifie le plafond fabricant sur la somme des emplois, puis applique et restaure le brouillon local', () => {
    const candidate = material('candidate-material', { product: product('product-limited', ['fermentation', 'postFermentation'], 0.6) });
    const input = request({
      program: program({ additions: [
        { ...fermentation('already-performed', 'source-material', 2), status: 'performed' },
        postFermentation('future-post', 'source-material', 10),
      ] }),
      materials: [material('source-material', { availableGrams: 0 }), candidate],
      basisByUse: { postFermentation: 'sameMass' },
    });
    const plan = planHopReplacement(input);
    const path = plan.paths[0];
    expect(path.preview?.applicability).toBe('available');

    const selection = selectHopReplacementPath({ request: input, plan, pathId: path.pathId });
    const applied = applySelectedHopReplacement(input, selection);
    const restored = restoreHopProgramDraft(applied.after, applied, input.materials);
    expect(applied.after.additions[0]).toEqual(input.program.additions[0]);
    expect(restored.program.stage).toBe('fermenting');
    expect(restored.program.revision).toBe(applied.after.revision + 1);
    expect(restored.program.additions).toEqual(input.program.additions);
    expect(restored.effects).toEqual({ writesRecipe: false, writesBrewDay: false, writesStock: false });
  });

  it('refuse une somme qui dépasse le plafond documenté du même produit', () => {
    const candidate = material('candidate-limited', { product: product('product-limited', ['fermentation', 'postFermentation'], 0.6) });
    const input = request({
      program: program({ additions: [fermentation('line-a', 'source-material', 8), postFermentation('line-b', 'source-material', 8)] }),
      materials: [material('source-material'), candidate],
      basisByUse: { fermentation: 'sameMass', postFermentation: 'sameMass' },
    });
    const path = planHopReplacement(input).paths[0];

    expect(path.preview?.applicability).toBe('unavailable');
    expect(path.conditions.join(' ')).toMatch(/dose planifiée cumulée.*au-delà du maximum documenté/u);
    expect(() => selectHopReplacementPath({ request: input, plan: planHopReplacement(input), pathId: path.pathId }))
      .toThrow(/indisponible/i);
  });

  it('refuse de sélectionner un aperçu devenu obsolète', () => {
    const input = request();
    const plan = planHopReplacement(input);
    const changed = { ...input, materials: input.materials.map(item => item.id === 'candidate-material'
      ? { ...item, availableGrams: 12 } : item) };

    expect(() => selectHopReplacementPath({ request: changed, plan, pathId: plan.paths[0].pathId }))
      .toThrow(/ont changé/i);
  });

  it('refuse l’application après modification des critères et d’un reçu falsifié', () => {
    const input = request();
    const plan = planHopReplacement(input);
    const selected = selectHopReplacementPath({ request: input, plan, pathId: plan.paths[0].pathId });
    const changedCriteria = { ...input, criteria: [{ id: 'changed-criterion', description: 'Nouvelle demande.', role: 'avoid' as const, origin: 'user' as const, familyId: 'citrus' }] };
    expect(() => applySelectedHopReplacement(changedCriteria, selected)).toThrow(/requête ou ses critères ont changé/i);
    const changedExclusions = { ...input, exclusions: [{ kind: 'materialId' as const, value: 'candidate-material', reason: 'Nouvelle exclusion.', origin: 'user' as const }] };
    expect(() => applySelectedHopReplacement(changedExclusions, selected)).toThrow(/requête ou ses critères ont changé/i);

    const inconsistent = structuredClone(selected);
    inconsistent.proposal.program.additions[0].grams = 3;
    expect(() => applySelectedHopReplacement(input, inconsistent)).toThrow(/aperçu ne correspond pas aux doses affichées/i);

    const displayedDoseChanged = structuredClone(selected);
    displayedDoseChanged.selectedDoses[0].grams = 3;
    expect(() => applySelectedHopReplacement(input, displayedDoseChanged)).toThrow(/dose finie dans la plage/i);

    const rangedCandidate = material('candidate-range', { product: {
      ...product('product-range', ['fermentation']),
      replacement: { referenceForm: 'pelletT90', uses: ['fermentation'], basis: 'manufacturerMassRatio',
        gramsPerGram: { min: 0.8, max: 1.2 }, source: sourceRef('range-rule', 'manufacturer'), limitations: ['Fixture.'] },
    } });
    const rangedRequest = request({ materials: [material('source-material'), rangedCandidate], basisByUse: { fermentation: 'manufacturer' } });
    const rangedPlan = planHopReplacement(rangedRequest);
    const rangedSelection = selectHopReplacementPath({ request: rangedRequest, plan: rangedPlan, pathId: rangedPlan.paths[0].pathId,
      dosesByAdditionId: { 'future-ferment': 9 } });
    const forgedDisplay = structuredClone(rangedSelection);
    forgedDisplay.selectedDoses[0].grams = 8.5;
    expect(() => applySelectedHopReplacement(rangedRequest, forgedDisplay)).toThrow(/changements ne correspondent pas/i);
  });

  it('valide les trois plafonds, les emplois, les conventions et les identités structurées avant recherche', () => {
    const base = request();
    const invalid = (over: Record<string, unknown>) => ({ ...base, ...over }) as HopPlannerRequest;

    expect(() => planHopReplacement(invalid({ limits: {} }))).toThrow(/trois plafonds/i);
    expect(() => planHopReplacement(invalid({ limits: { maxCandidateMaterials: 1, maxPrograms: 1 } }))).toThrow(/trois plafonds/i);
    expect(() => planHopReplacement(invalid({ limits: { maxCandidateMaterials: 1_000_000, maxAssignments: 1, maxPrograms: 1 } }))).toThrow(/plafond de recherche invalide/i);
    expect(() => planHopReplacement(invalid({ basisByUse: { fermentation: 'typo' } }))).toThrow(/convention de dose inconnue/i);
    expect(() => planHopReplacement(invalid({ basisByUse: { unknownUse: 'sameMass' } }))).toThrow(/emploi inconnu/i);
    expect(() => planHopReplacement(invalid({ criteria: [
      { id: 'duplicate', description: 'Une demande.', role: 'seek', origin: 'user' },
      { id: 'duplicate', description: 'Une autre demande.', role: 'avoid', origin: 'user' },
    ] }))).toThrow(/id unique/i);
    expect(() => planHopReplacement(invalid({ criteria: [{ id: 'origin', description: 'Une demande.', role: 'seek', origin: 'other' }] }))).toThrow(/rôle et origine/i);
    expect(() => planHopReplacement(invalid({ unavailable: { materialId: 'source-material', reason: 'fixture', origin: 'automatic' } }))).toThrow(/origine/i);
    expect(() => planHopReplacement(invalid({ program: program({ additions: [addition({ use: 'unexpected' as HopProgramAddition['use'] })] }) }))).toThrow(/emploi ou état invalide/i);
    expect(() => planHopReplacement(invalid({ exclusions: [{ kind: 'anything', value: 'x', reason: 'fixture', origin: 'user' }] }))).toThrow(/type, identifiant/i);
    expect(() => planHopReplacement(invalid({ exclusions: [{ kind: 'materialId', value: 'candidate-material', reason: 'fixture', origin: 'automatic' }] }))).toThrow(/type, identifiant/i);
  });

  it('rapporte les bornes de recherche et ne transforme pas la troncature en impossibilité', () => {
    const input = request({
      materials: [material('source-material'), material('candidate-a'), material('candidate-b')],
      limits: { maxCandidateMaterials: 1, maxAssignments: 10, maxPrograms: 10 },
    });
    const result = planHopReplacement(input);

    expect(result.search.candidateMaterialIds).toEqual(['candidate-a']);
    expect(result.search.omittedCandidateMaterialIds).toEqual(['candidate-b']);
    expect(result.search.truncated).toBe(true);
    expect(result.search.exhaustiveWithinScope).toBe(false);
    expect(result.conditions.join(' ')).toMatch(/ne démontre pas une impossibilité/u);
    const existingPath = result.paths.find(path => path.assignments[0].candidateMaterialId === 'candidate-a')!;
    const selection = selectHopReplacementPath({ request: input, plan: result, pathId: existingPath.pathId });
    expect(selection.proposal.program.additions[0].materialId).toBe('candidate-a');
    expect(applySelectedHopReplacement(input, selection).after.additions[0].materialId).toBe('candidate-a');
    expect(existingPath.pathId.length).toBeLessThan(40);
    expect(existingPath.pathId).not.toContain('Nom inédit');
    expect(existingPath.pathId).not.toContain('requestReference');
  });
});
