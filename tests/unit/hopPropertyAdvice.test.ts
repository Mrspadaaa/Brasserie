import { describe, expect, it, vi } from 'vitest';
import { buildHopPropertyAdvice } from '../../src/domain/hopDecision/propertyAdvice';
import { getHopPropertyAdviceCorpus, PROPERTY_ADVICE_CLAIM_IDS as CLAIM } from '../../src/domain/hopDecision/propertyAdviceEvidence';
import { createHopDocumentaryCorpus, readHopDocumentaryAnswer, readHopDocumentaryDossier } from '../../src/domain/hopDecision/documentaryAnswerSchema';
import { HOP_DOCUMENTARY_CLAIM_IDS as DOCUMENTARY } from '../../src/domain/hopDecision/documentaryEvidence';
import { createHopPropertyAdviceDossier, readHopPropertyAdviceAnswer, readHopPropertyAdviceDossier,
  type HopPropertyAdviceIntent, type HopPropertyAdviceRequest } from '../../src/domain/hopDecision/propertyAdviceSchema';
import { hopPropertyAdviceViewModel } from '../../src/domain/hopDecision/propertyAdviceViewModel';
import * as propertyBuilder from '../../src/domain/hopDecision/propertyAdvice';
import * as propertyEvidence from '../../src/domain/hopDecision/propertyAdviceEvidence';

function request(): HopPropertyAdviceRequest {
  const originalQuestion = 'Je veux un arôme intense avec une amertume légère.';
  const intent = (id: string, property: HopPropertyAdviceIntent['property'], label: string, qualification: string): HopPropertyAdviceIntent => ({
    id, property, label, role: 'target', direction: property === 'aroma' ? 'increase' : null, qualification, required: true,
    comparisonBasis: { kind: 'qualitativeTarget', assertionIds: [] }, metric: 'sensory',
    subject: { kind: 'beer', label: 'Bière de fixture à concevoir', materialId: null, sensoryContext: 'beer' },
    sourceSpans: [{ start: originalQuestion.indexOf(label), end: originalQuestion.indexOf(label) + label.length, text: label }],
    interpretationOrigin: 'fixture', basis: 'Interprétation explicite de fixture, aucun fait de bière réelle.', relatedIntentIds: [] });
  const unknownAccess = () => ({ state: 'unknown' as const, basis: 'Accès non déclaré dans cette fixture.', assertionIds: [] });
  return { format: 'hop-documentary-request-v2', id: 'property-fixture', originalQuestion,
    interpretation: { id: 'property-reading', version: 'fixture-1', origin: 'proposal', text: 'Arôme fort et cible qualitative d’amertume, sans niveau actuel.' },
    propertyIntents: [intent('aroma', 'aroma', 'arôme', 'intense'), intent('bitterness', 'bitterness', 'amertume', 'légère')],
    candidatePolicy: { kind: 'explicit', materialIds: [], basis: 'Aucune matière sélectionnée ; comparer les voies de procédé/documentaires.' },
    context: { stage: 'planning', stageBasis: 'Projet explicitement planifié pour la fixture.', assertions: [],
      access: { bulkBeer: unknownAccess(), sampling: unknownAccess(), separatePortion: unknownAccess() } }, exclusions: [], materials: [] };
}
function subset(ids: string[], keep = false) {
  const corpus = getHopPropertyAdviceCorpus();
  return createHopDocumentaryCorpus({ version: 'property-evidence-subset', sources: corpus.sources,
    claims: corpus.claims.filter(row => keep ? ids.includes(row.id) : !ids.includes(row.id)) });
}

describe('conseil canonique V2 — composition entière et frontières', () => {
  it('compare des voies distinctes sur les deux objectifs sans déduire une baseline ou une opération', () => {
    const input = request(), before = structuredClone(input), answer = buildHopPropertyAdvice(input);
    expect(answer.coverage.status).toBe('answered');
    expect(answer.strategies.filter(row => row.contribution === 'option').map(row => row.kind))
      .toEqual(['direct-aroma-program', 'documented-aromatic-form']);
    for (const strategy of answer.strategies) {
      expect(strategy.effects.map(row => row.intentId)).toEqual(['aroma', 'bitterness']);
      expect(strategy.preparation.operational).toMatchObject({ status: 'notProvided', adapterId: null });
      expect(strategy.tradeoffs.length).toBeGreaterThan(0); expect(strategy.nextSteps.length).toBeGreaterThan(0);
      expect(strategy.effects.find(row => row.intentId === 'bitterness')?.text).toMatch(/sans inventer une valeur actuelle/);
    }
    expect(answer.body[0].text).toMatch(/plusieurs choix distincts/);
    expect(input).toEqual(before);
  });
  it('une propriété libre requise reste locale sans effacer les deux voies répondables', () => {
    const input = request(); input.originalQuestion += ' Juicy.';
    input.propertyIntents.push({ ...structuredClone(input.propertyIntents[0]), id: 'unresolved', property: 'unresolved', label: 'Juicy',
      qualification: null, sourceSpans: [{ start: input.originalQuestion.indexOf('Juicy'), end: input.originalQuestion.indexOf('Juicy') + 5, text: 'Juicy' }] });
    const answer = buildHopPropertyAdvice(input);
    expect(answer.coverage.status).toBe('partial');
    expect(answer.coverage.points.find(row => row.intentId === 'unresolved')?.status).toBe('unresolved');
    expect(answer.strategies.filter(row => row.contribution === 'option')).toHaveLength(2);
    expect(answer.strategies.every(row => row.effects.length === 3)).toBe(true);
  });
  it('un autre nom de bière ne crée ni propriété ni règle supplémentaire', () => {
    const first = request(), second = structuredClone(first);
    second.id = 'renamed'; second.originalQuestion += ' Projet Équinoxe, bière de Champagne.';
    const a = buildHopPropertyAdvice(first), b = buildHopPropertyAdvice(second);
    expect(a.body).toEqual(b.body); expect(a.strategies.map(({ reference, ...row }) => row))
      .toEqual(b.strategies.map(({ reference, ...row }) => row));
    expect(a.reference).not.toBe(b.reference);
  });
  it('les seules limites ne deviennent pas une stratégie ou une réponse substantielle', () => {
    const input = request();
    const answer = buildHopPropertyAdvice(input, subset([CLAIM.PERCEPTION_NOT_IBU, CLAIM.CULTURE_LIMITS, CLAIM.CHEMISTRY_NOT_SENSORY], true));
    expect(answer.coverage.status).toBe('outOfScope'); expect(answer.strategies).toEqual([]);
  });
  it('perdre les claims de produit conserve la voie directe et ne fabrique pas de second choix', () => {
    const products = [CLAIM.PRODUCT_CRYO, CLAIM.PRODUCT_HYPERBOOST, CLAIM.PRODUCT_SPECTRUM, CLAIM.PRODUCT_INCOGNITO, CLAIM.PRODUCT_LUPOMAX];
    const answer = buildHopPropertyAdvice(request(), subset(products));
    expect(answer.strategies.filter(row => row.contribution === 'option').map(row => row.kind)).toEqual(['direct-aroma-program']);
    expect(answer.strategies.flatMap(row => row.documentaryProductRefs)).toEqual([]);
    expect(answer.body[0].text).toMatch(/une voie documentaire/);
  });
  it('une fiche variétale florale ne qualifie pas le profil des formes commerciales documentaires', () => {
    const input = request(); input.propertyIntents[0].familyId = 'floral';
    input.materials = [{ id: 'floral-fixture', name: 'Référence descriptive de fixture', form: 'unknown', availableGrams: null,
      variety: { id: 'floral-variety-fixture', name: 'Variété de fixture', aliases: [], form: 'unknown', analysis: [],
        descriptions: [{ text: 'Floral aroma', context: 'rawHop', source: { title: 'Description fixture', author: 'Fixture', year: 2026,
          kind: 'manufacturer', reference: 'fixture:floral-description' } }] } }];
    input.candidatePolicy = { kind: 'explicit', materialIds: ['floral-fixture'], basis: 'Une fiche variété pour comparaison, aucun lien produit établi.' };
    const answer = buildHopPropertyAdvice(input);
    const direct = answer.strategies.find(row => row.kind === 'direct-aroma-program')!;
    const product = answer.strategies.find(row => row.kind === 'documented-aromatic-form')!;
    expect(direct.candidateIds).toContain('floral-fixture');
    expect(product.documentaryProductRefs.length).toBeGreaterThan(0);
    expect(product.candidateIds).toEqual([]);
    expect(product.effects.find(row => row.intentId === 'aroma')?.status).toBe('hypothesis');
  });
  it('le lot conditionné ne reçoit aucune voie de cuve et garde les accès inconnus', () => {
    const input = request(); input.context.stage = 'packaged'; input.context.stageBasis = 'Lot déclaré conditionné.';
    const answer = buildHopPropertyAdvice(input);
    expect(answer.strategies.every(row => row.scope === 'separatePortion')).toBe(true);
    expect(answer.strategies.every(row => row.applicability.status === 'missingConditions')).toBe(true);
    expect(answer.strategies.flatMap(row => row.documentaryProductRefs).every(row => !row.id.includes('incognito'))).toBe(true);
  });
  it('une exclusion certaine reste incompatible et le conseil peut expliquer ce refus', () => {
    const input = request(); input.exclusions.push({ id: 'no-aroma-change', intervention: 'changeAroma', certainty: 'certain',
      intentIds: ['aroma'], reason: 'Aucune intervention sur le caractère aromatique autorisée dans cette lecture.' });
    const answer = buildHopPropertyAdvice(input);
    expect(answer.strategies.every(row => row.applicability.status === 'incompatible')).toBe(true);
    expect(answer.body[0].text).toMatch(/écartent les voies/);
    expect(answer.strategies.every(row => row.preparation.refusalReasons.length)).toBe(true);
  });
  it('une seule exclusion de caractère ne devient pas une invitation à développer l’arôme', () => {
    const input = request(); input.originalQuestion = 'Éviter la résine sans changer les faits passés.';
    input.propertyIntents = [{ ...input.propertyIntents[0], label: 'résine', familyId: 'resin', role: 'constraint',
      direction: 'exclude', qualification: null, comparisonBasis: { kind: 'none', assertionIds: [] },
      sourceSpans: [{ start: input.originalQuestion.indexOf('résine'), end: input.originalQuestion.indexOf('résine') + 6, text: 'résine' }] }];
    const answer = buildHopPropertyAdvice(input);
    expect(answer.strategies.some(row => row.kind === 'direct-aroma-program' || row.kind === 'documented-aromatic-form')).toBe(false);
    expect(answer.strategies.some(row => row.kind === 'future-character-review')).toBe(true);
    expect(answer.strategies.every(row => row.scope === 'futureBrew')).toBe(true);
  });
  it('une question de compensation ne se résout que depuis son objectif relatif explicite, sans transformer le constat', () => {
    const input = request(); input.originalQuestion = 'Ma bière est trop sucrée ; comment compenser cette impression ?';
    const common = { ...input.propertyIntents[0], property: 'sweetness' as const, direction: null,
      qualification: null, comparisonBasis: { kind: 'current' as const, assertionIds: [] } };
    const observation: HopPropertyAdviceIntent = { ...common, id: 'observed-sweetness', label: 'trop sucrée', role: 'reportedObservation',
      sourceSpans: [{ start: input.originalQuestion.indexOf('trop sucrée'), end: input.originalQuestion.indexOf('trop sucrée') + 11, text: 'trop sucrée' }] };
    const question: HopPropertyAdviceIntent = { ...common, id: 'sweetness-question', label: 'compenser', role: 'investigation', direction: 'investigate',
      comparisonBasis: { kind: 'none', assertionIds: [] }, relatedIntentIds: [observation.id],
      sourceSpans: [{ start: input.originalQuestion.indexOf('compenser'), end: input.originalQuestion.indexOf('compenser') + 9, text: 'compenser' }] };
    input.propertyIntents = [observation, question];
    const unspecified = buildHopPropertyAdvice(input);
    expect(unspecified.strategies.some(row => row.kind === 'sweetness-balance')).toBe(false);
    input.propertyIntents.push({ ...question, id: 'proposed-relative-balance', role: 'target', direction: 'decrease',
      comparisonBasis: { kind: 'current', assertionIds: [] }, interpretationOrigin: 'proposal',
      basis: 'Lecture proposée de rééquilibrage perceptif, corrigible, sans retrait de sucre présumé.', relatedIntentIds: [observation.id, question.id] });
    input.propertyIntents[1].relatedIntentIds.push('proposed-relative-balance');
    const answer = buildHopPropertyAdvice(input);
    expect(answer.strategies.some(row => row.kind === 'sweetness-balance')).toBe(true);
    expect(answer.coverage.points.find(row => row.intentId === question.id)?.status).toBe('answered');
    expect(answer.coverage.points.find(row => row.intentId === observation.id)?.status).toBe('contextOnly');
    expect(answer.arguments.find(row => row.intentIds.includes(question.id) && row.kind === 'userQuestion')).toBeDefined();
  });
  it('la relation à un partenaire reçoit sa propre hypothèse sourcée et reste partielle si cet appui manque', () => {
    const input = request(); input.originalQuestion = 'Chercher le floral en accord avec une note épicée, avec une amertume légère.';
    input.propertyIntents[0] = { ...input.propertyIntents[0], label: 'floral', familyId: 'floral', qualification: null,
      partner: { kind: 'freeContext', text: 'note épicée' },
      sourceSpans: [{ start: input.originalQuestion.indexOf('floral'), end: input.originalQuestion.indexOf('floral') + 6, text: 'floral' }] };
    input.propertyIntents[1].sourceSpans = [{ start: input.originalQuestion.indexOf('amertume'), end: input.originalQuestion.indexOf('amertume') + 8, text: 'amertume' }];
    const answer = buildHopPropertyAdvice(input);
    const comparison = answer.strategies.find(row => row.kind === 'pairing-comparison');
    expect(comparison?.contribution).toBe('investigation');
    expect(comparison?.effects.find(row => row.intentId === 'aroma')?.text).toMatch(/note épicée/);
    expect(answer.body[0].text).toMatch(/note épicée/);
    const reduced = buildHopPropertyAdvice(input, subset([CLAIM.BLEND_COMPARISON]));
    expect(reduced.coverage.status).toBe('partial');
    expect(reduced.strategies.some(row => row.kind === 'direct-aroma-program')).toBe(true);
  });
  it('l’absence de la fiche ISO ne supprime pas l’étude indépendante d’équilibre', () => {
    const input = request(); input.originalQuestion = 'Diminuer mon impression de douceur, sans modifier le passé.';
    input.interpretation.text = 'Objectif relatif explicite d’équilibre perceptif; aucune diminution de sucre mesuré.';
    input.propertyIntents = [{ ...input.propertyIntents[0], property: 'sweetness', label: 'douceur', direction: 'decrease', qualification: null,
      comparisonBasis: { kind: 'current', assertionIds: [] },
      sourceSpans: [{ start: input.originalQuestion.indexOf('douceur'), end: input.originalQuestion.indexOf('douceur') + 7, text: 'douceur' }] }];
    const answer = buildHopPropertyAdvice(input, subset([DOCUMENTARY.ISO_HOPSTEINER]));
    expect(answer.coverage.status).toBe('partial');
    expect(answer.strategies.some(row => row.kind === 'future-sweetness-balance')).toBe(true);
    expect(answer.strategies.flatMap(row => row.documentaryProductRefs)).toEqual([]);
    expect(answer.arguments.some(row => row.claimIds.includes(CLAIM.PERCEPTION_NOT_IBU))).toBe(true);
    expect(answer.body.map(row => row.text).join(' ')).toMatch(/équilibre/);
  });
  it('le choix puis la relecture V2 et le DTO sont exacts sans générateur ni horloge', () => {
    const answer = buildHopPropertyAdvice(request()), strategy = answer.strategies[0];
    const dossier = createHopPropertyAdviceDossier({ id: 'property-dossier', answer,
      expectedAnswerReference: answer.reference, expectedInterpretationReference: answer.interpretationReference,
      strategyId: strategy.id, expectedStrategyReference: strategy.reference, motive: 'Comparer les rôles avant de choisir une dose.',
      createdAt: '2026-10-03T00:00:00.000Z', createdBy: { origin: 'fixture', label: 'Preuve de choix synthétique' } });
    const dto = hopPropertyAdviceViewModel(answer);
    const run = vi.spyOn(propertyBuilder, 'buildHopPropertyAdvice').mockImplementation(() => { throw Error('Pas de synthèse à la lecture'); });
    const current = vi.spyOn(propertyEvidence, 'getHopPropertyAdviceCorpus').mockImplementation(() => { throw Error('Pas de corpus courant à la lecture'); });
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => { throw Error('Pas d’horloge à la lecture'); });
    try {
      expect(readHopPropertyAdviceAnswer(JSON.parse(JSON.stringify(answer)))).toEqual({ status: 'readOnly', answer });
      expect(readHopPropertyAdviceDossier(JSON.parse(JSON.stringify(dossier)))).toEqual({ status: 'readOnly', dossier });
      expect(hopPropertyAdviceViewModel(answer)).toEqual(dto);
      expect(readHopDocumentaryAnswer(answer).status).toBe('unsupportedReadOnly');
      expect(readHopDocumentaryDossier(dossier).status).toBe('unsupportedReadOnly');
    } finally { run.mockRestore(); current.mockRestore(); clock.mockRestore(); }
  });
});
