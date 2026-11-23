import { describe, expect, it, vi } from 'vitest';
import { buildHopDocumentaryAnswer } from '../../src/domain/hopDecision/documentaryAnswer';
import { getHopDocumentaryCorpus, HOP_DOCUMENTARY_CLAIM_IDS as CLAIM } from '../../src/domain/hopDecision/documentaryEvidence';
import { createHopDocumentaryCorpus, createHopDocumentaryDossier, readHopDocumentaryAnswer, readHopDocumentaryDossier,
  type HopDocumentaryRequest } from '../../src/domain/hopDecision/documentaryAnswerSchema';
import { hopDocumentaryAnswerViewModel } from '../../src/domain/hopDecision/documentaryAnswerViewModel';
import * as builder from '../../src/domain/hopDecision/documentaryAnswer';
import * as evidence from '../../src/domain/hopDecision/documentaryEvidence';

function fixture(kind: HopDocumentaryRequest['needs'][number]['kind'] = 'balancePerceivedSweetness'): HopDocumentaryRequest {
  const criterion = { id: 'wanted', description: kind === 'balancePerceivedSweetness' ? 'Rééquilibrer une impression trop sucrée'
    : kind === 'aromaPairing' ? 'Accorder un caractère tropical au partenaire déclaré' : 'Donner du caractère au projet faible alcool',
    role: kind === 'aromaPairing' ? 'pairWith' as const : 'seek' as const, origin: 'user' as const,
    ...(kind === 'aromaPairing' ? { familyId: 'tropical', partner: { kind: 'freeContext' as const, text: 'Banane, contexte rapporté.' } } : {}) };
  return { format: 'hop-documentary-request-v1', id: 'qa-doc-question', originalQuestion: 'Question de fixture documentaire, aucune recette réelle.',
    interpretation: { id: 'reading', version: '1', text: 'Interprétation structurée de fixture.', origin: 'proposal' },
    criteria: [criterion], needs: [{ id: 'need', kind, criterionIds: ['wanted'], explanation: 'Propriété explicitement choisie dans le test.' }],
    context: { stage: 'conditioning', stageBasis: 'Stade déclaré pour la fixture.', assertions: [
      { id: 'access-bulk', subject: 'access', statement: 'Cuve accessible dans la fixture.', state: 'reported', value: true, dimension: 'process' },
      { id: 'can-sample', subject: 'access', statement: 'Prélèvement possible dans la fixture.', state: 'reported', value: true, dimension: 'process' },
      { id: 'no-portion', subject: 'access', statement: 'Pas de portion déjà séparée dans la fixture.', state: 'reported', value: false, dimension: 'process' },
    ], access: {
      bulkBeer: { state: 'yes', basis: 'Cuve explicitement accessible.', assertionIds: ['access-bulk'] },
      sampling: { state: 'yes', basis: 'Prélèvement explicitement possible.', assertionIds: ['can-sample'] },
      separatePortion: { state: 'no', basis: 'Aucune portion déjà séparée.', assertionIds: ['no-portion'] },
    } }, exclusions: [], materials: [] };
}
function candidate(input: HopDocumentaryRequest, withDescriptions = true) {
  const source = { title: 'Description synthétique du candidat', author: 'Fixture', year: 2026, kind: 'observation' as const,
    reference: 'fixture://candidate-description', locator: 'rawHop, aucune intensité mesurée.' };
  input.materials.push({ id: 'candidate', name: 'Matière au libellé arbitraire', form: 'pelletT90', availableGrams: null,
    variety: { id: 'candidate-variety', name: 'Variété de fixture', aliases: [], form: 'pelletT90', analysis: [],
      descriptions: withDescriptions ? [{ text: 'Tropical mango aroma', context: 'rawHop', source }] : [] } });
}
function corpusWithout(...ids: string[]) {
  const corpus = getHopDocumentaryCorpus();
  return createHopDocumentaryCorpus({ version: 'test-subset', sources: corpus.sources, claims: corpus.claims.filter(row => !ids.includes(row.id)) });
}

describe('réponse documentaire conditionnelle par propriété et stade', () => {
  it('répond à la compensation avant les pistes, avec produit ISO documentaire et sans permission d’ajout', () => {
    const input = fixture(), original = structuredClone(input), result = buildHopDocumentaryAnswer(input);
    expect(result.coverage.status).toBe('answered');
    expect(result.body[0].text).toMatch(/équilibre gustatif/);
    expect(result.body[0].text).toMatch(/sans promettre une réduction de sucre/);
    const iso = result.routes.find(row => row.scope === 'bulkBeer')!;
    expect(iso.documentaryProductRefs[0].claimIds).toEqual([CLAIM.ISO_HOPSTEINER]);
    expect(iso.materialIds).toEqual([]); expect(iso.applicability.status).toBe('missingConditions');
    expect(iso.preparation.documentaryDossier.status).toBe('available');
    expect(iso.preparation.operational).toMatchObject({ status: 'notProvided', adapterId: null });
    expect(iso.preparation.missingRequirements.join(' ')).toMatch(/iso-alpha.*pas alpha\/Tinseth/);
    expect(iso.preparation.missingRequirements.join(' ')).toMatch(/précipitation/);
    expect(input).toEqual(original);
  });
  it('une quantité fournie ne lève aucune qualification ISO ni disponibilité', () => {
    const input = fixture(); input.context.assertions.push({ id: 'entered-mass', subject: 'amount', state: 'reported',
      statement: 'Quantité saisie, aucune qualification produit.', value: 12, unit: 'g', dimension: 'process' });
    const result = buildHopDocumentaryAnswer(input);
    for (const row of result.routes.filter(row => row.documentaryProductRefs.length)) {
      expect(row.materialIds).toEqual([]); expect(row.preparation.operational.status).toBe('notProvided');
      expect(row.preparation).not.toHaveProperty('dose'); expect(row).not.toHaveProperty('availableGrams');
    }
    expect(result.requestSnapshot.context.assertions[result.requestSnapshot.context.assertions.length - 1]).toMatchObject({ value: 12, unit: 'g' });
  });
  it('conditionnement et portion séparée ne deviennent pas une opération sur le lot', () => {
    const input = fixture(); input.context.stage = 'packaged';
    input.context.access.bulkBeer = { state: 'no', basis: 'Lot conditionné, pas de cuve ouverte.', assertionIds: ['no-portion'] };
    input.context.access.sampling = { state: 'no', basis: 'Pas de prélèvement de cuve.', assertionIds: ['no-portion'] };
    input.context.access.separatePortion = { state: 'yes', basis: 'Portion distincte accessible.', assertionIds: ['can-sample'] };
    const result = buildHopDocumentaryAnswer(input);
    expect(result.routes.find(row => row.scope === 'bulkBeer')?.applicability.status).toBe('incompatible');
    expect(result.routes.some(row => row.scope === 'separatePortion')).toBe(true);
    expect(result.body.some(row => /lot déjà conditionné/.test(row.text))).toBe(true);
    expect(result.routes.every(row => row.preparation.operational.status === 'notProvided')).toBe(true);
  });
  it('stade et accès inconnus conservent une réponse et des branches conditionnelles', () => {
    const input = fixture(); input.context.stage = 'unknown'; input.context.assertions = [];
    for (const key of ['bulkBeer', 'sampling', 'separatePortion'] as const) input.context.access[key] = { state: 'unknown', basis: 'Accès inconnu.', assertionIds: [] };
    const result = buildHopDocumentaryAnswer(input);
    expect(result.requestSnapshot.context.stage).toBe('unknown'); expect(result.coverage.status).toBe('answered');
    expect(result.routes.find(row => row.scope === 'bulkBeer')?.applicability.status).toBe('missingConditions');
    expect(result.body.some(row => /Si la bière est accessible après fermentation/.test(row.text))).toBe(true);
  });
  it('les noms ne choisissent aucune propriété ni branche supplémentaire', () => {
    const input = fixture(); const first = buildHopDocumentaryAnswer(input);
    input.originalQuestion = 'Pastry Champagne Bananza sans donnée supplémentaire';
    const second = buildHopDocumentaryAnswer(input);
    expect(second.body).toEqual(first.body); expect(second.routes).toEqual(first.routes);
    expect(second.reference).not.toBe(first.reference);
    input.needs = [{ ...input.needs[0], kind: 'unresolved' }];
    const unresolved = buildHopDocumentaryAnswer(input);
    expect(unresolved.coverage.status).toBe('outOfScope'); expect(unresolved.routes).toEqual([]);
  });
  it('partenaire souhaité, observation et lecture proposée restent distincts', () => {
    const input = fixture('aromaPairing'); candidate(input);
    const wished = buildHopDocumentaryAnswer(input);
    expect(wished.arguments.some(row => row.kind === 'userFact')).toBe(false);
    expect(wished.body[0].text).toMatch(/biotransformation n’est pas une condition préalable/);
    expect(wished.arguments.some(row => row.kind === 'userGoal' && /sans hausse imposée/.test(row.text))).toBe(true);
    expect(wished.arguments.some(row => row.materialEvidence.some(e => e.evaluation.candidateEvidence.length))).toBe(true);
    input.criteria[0].role = 'observation';
    const observed = buildHopDocumentaryAnswer(input);
    expect(observed.arguments.some(row => row.kind === 'userFact')).toBe(true);
    input.criteria[0].origin = 'proposal';
    const proposed = buildHopDocumentaryAnswer(input);
    expect(proposed.arguments.some(row => row.kind === 'userFact')).toBe(false);
    expect(proposed.arguments.some(row => row.kind === 'proposedReading')).toBe(true);
  });
  it('un nom commercial sans description ne devient ni goût ni preuve d’accord', () => {
    const input = fixture('aromaPairing'); candidate(input, false); input.materials[0].name = 'Bananza tropical extraordinaire';
    const result = buildHopDocumentaryAnswer(input);
    expect(result.arguments.every(row => row.materialEvidence.length === 0)).toBe(true);
    expect(result.body.some(row => /pas de nommer un candidat étayé/.test(row.text))).toBe(true);
    expect(result.routes.every(row => row.materialIds.length === 0)).toBe(true);
  });
  it('un candidat demandé manquant ne supprime pas les descriptions disponibles', () => {
    const input = fixture('aromaPairing'); candidate(input); input.needs[0].candidateIds = ['candidate', 'not-loaded'];
    const result = buildHopDocumentaryAnswer(input);
    expect(result.coverage.status).toBe('partial');
    expect(result.routes.some(row => row.materialIds.includes('candidate'))).toBe(true);
    expect(result.routes.some(row => row.materialIds.includes('not-loaded'))).toBe(false);
    expect(result.requestSnapshot.needs[0].candidateIds).toContain('not-loaded');
  });
  it('culture inconnue en NOLO ne bloque pas la voie directe et n’invente pas de cible', () => {
    const input = fixture('lowAlcoholCharacter');
    input.context.assertions.push({ id: 'culture-unknown', subject: 'culture', statement: 'Culture inconnue.', state: 'unknown', value: null, dimension: 'bioInteraction' });
    const result = buildHopDocumentaryAnswer(input);
    expect(result.coverage.status).toBe('answered');
    expect(result.routes.some(row => row.intervention === 'changeAroma')).toBe(true);
    expect(result.routes.find(row => row.intervention === 'involveCulture')?.applicability.status).toBe('missingConditions');
    expect(result.body[0].text).toMatch(/n’ajoute ni cible basse d’amertume ni arôme particulier/);
    expect(result.requestSnapshot.context.assertions[result.requestSnapshot.context.assertions.length - 1]?.value).toBeNull();
  });
  it('une demande composée garde ses trois points et une incompatibilité certaine reste telle', () => {
    const input = fixture();
    input.criteria.push({ id: 'pair', description: 'Accord à préserver', role: 'pairWith', origin: 'user', familyId: 'tropical', partner: { kind: 'freeContext', text: 'Caractère indiqué' } },
      { id: 'low', description: 'Objectif faible alcool', role: 'constraint', origin: 'user' },
      { id: 'no-bitterness', description: 'Ne pas modifier l’amertume', role: 'constraint', origin: 'user' });
    input.needs.push({ id: 'pairing', kind: 'aromaPairing', criterionIds: ['pair'], explanation: 'Accord explicite.' },
      { id: 'low', kind: 'lowAlcoholCharacter', criterionIds: ['low'], explanation: 'Objectif explicite.' });
    input.exclusions.push({ id: 'no-change', intervention: 'changeBitterness', certainty: 'certain', criterionIds: ['no-bitterness'], reason: 'Modification d’amertume explicitement exclue.' });
    const result = buildHopDocumentaryAnswer(input);
    expect(result.coverage.points).toHaveLength(3); expect(result.coverage.status).toBe('partial');
    expect(result.coverage.unresolvedCriteria.map(row => row.criterionId)).toEqual(['low']);
    expect(result.body[0].text).toMatch(/écartée par la contrainte/);
    expect(result.routes.filter(row => row.intervention === 'changeBitterness').every(row => row.applicability.status === 'incompatible')).toBe(true);
    expect(result.routes.some(row => row.intervention === 'changeAroma' && row.applicability.status !== 'incompatible')).toBe(true);
  });
  it('une exclusion sans voie correspondante ne suffit pas à prétendre avoir traité son critère', () => {
    const input = fixture('aromaPairing');
    input.criteria.push({ id: 'unused', description: 'Contrainte hors des voies examinées', role: 'constraint', origin: 'user' });
    input.exclusions.push({ id: 'unused-exclusion', intervention: 'involveCulture', certainty: 'certain', criterionIds: ['unused'], reason: 'Culture exclue.' });
    const result = buildHopDocumentaryAnswer(input);
    expect(result.coverage.status).toBe('partial'); expect(result.coverage.unresolvedCriteria.map(row => row.criterionId)).toContain('unused');
  });
  it('une source absente crée une lacune locale, sans citation orpheline ni refus des autres points', () => {
    const input = fixture(); input.criteria.push({ id: 'low', description: 'Projet faible alcool', role: 'seek', origin: 'user' });
    input.needs.push({ id: 'low', kind: 'lowAlcoholCharacter', criterionIds: ['low'], explanation: 'Autre point de la demande.' });
    const result = buildHopDocumentaryAnswer(input, corpusWithout(CLAIM.SWEETNESS_BALANCE));
    expect(result.coverage.status).toBe('partial');
    expect(result.coverage.points.find(row => row.needId === 'need')?.status).toBe('unresolved');
    expect(result.coverage.points.find(row => row.needId === 'low')?.status).toBe('answered');
    expect(result.arguments.flatMap(row => row.claimIds)).not.toContain(CLAIM.SWEETNESS_BALANCE);
    const incomplete = buildHopDocumentaryAnswer(fixture(), corpusWithout(CLAIM.ISO_HOPSTEINER));
    expect(incomplete.coverage.status).toBe('partial'); expect(incomplete.routes.every(row => row.documentaryProductRefs.length === 0)).toBe(true);
  });
  it('le transfert NOLO indépendant demeure quand le seul retour de brasseur manque', () => {
    const answer = buildHopDocumentaryAnswer(fixture('lowAlcoholCharacter'), corpusWithout(CLAIM.LF_NOLO_IDENTITY));
    expect(answer.coverage.status).toBe('partial');
    expect(answer.routes.some(route => route.intervention === 'changeAroma' && route.argumentIds.some(id =>
      answer.arguments.find(arg => arg.id === id)?.claimIds.includes(CLAIM.NOLO_DIRECT_TRANSFER)))).toBe(true);
  });
  it('une contrainte liée au besoin mais sans qualification structurée reste non résolue', () => {
    const input = fixture('aromaPairing'); candidate(input);
    input.criteria.push({ id: 'keep-bitterness', description: 'Préserver l’amertume actuelle', role: 'constraint', origin: 'user' });
    input.needs[0].criterionIds.push('keep-bitterness');
    const answer = buildHopDocumentaryAnswer(input);
    expect(answer.coverage.status).toBe('partial'); expect(answer.coverage.points[0].status).toBe('partial');
    expect(answer.coverage.unresolvedCriteria.some(row => row.criterionId === 'keep-bitterness')).toBe(true);
    expect(answer.routes.some(row => row.materialIds.includes('candidate'))).toBe(true);
  });
  it('une fiche explicitement demandée sans description ne ferme pas la comparaison de candidat', () => {
    const input = fixture('aromaPairing'); candidate(input, false); input.needs[0].candidateIds = ['candidate'];
    const answer = buildHopDocumentaryAnswer(input);
    expect(answer.coverage.status).toBe('partial'); expect(answer.coverage.points[0].status).toBe('partial');
    expect(answer.body.length).toBeGreaterThan(0);
  });
  it('l’absence d’un appui perceptif ne supprime pas la fonction ISO indépendamment documentée', () => {
    const answer = buildHopDocumentaryAnswer(fixture(), corpusWithout(CLAIM.BITTERNESS_PERCEPTION));
    expect(answer.coverage.status).toBe('partial');
    expect(answer.routes.some(row => row.documentaryProductRefs.some(product => product.claimIds.includes(CLAIM.ISO_HOPSTEINER)))).toBe(true);
    expect(answer.arguments.flatMap(row => row.claimIds)).not.toContain(CLAIM.BITTERNESS_PERCEPTION);
  });
  it('une limite lexicale manquante ne supprime pas l’hypothèse de comparaison issue des autres preuves', () => {
    const input = fixture('aromaPairing'); candidate(input);
    const answer = buildHopDocumentaryAnswer(input, corpusWithout(CLAIM.LEXICAL_NOT_PAIRING));
    expect(answer.coverage.status).toBe('partial');
    expect(answer.routes.some(row => row.intervention === 'changeAroma')).toBe(true);
    expect(answer.arguments.flatMap(row => row.claimIds)).toContain(CLAIM.PAIRING_HYPOTHESIS);
  });
  it('le retour de brasseur reste un repère documentaire si l’étude de transfert manque', () => {
    const answer = buildHopDocumentaryAnswer(fixture('lowAlcoholCharacter'), corpusWithout(CLAIM.NOLO_DIRECT_TRANSFER));
    expect(answer.coverage.status).toBe('partial');
    expect(answer.arguments.flatMap(row => row.claimIds)).toContain(CLAIM.LF_NOLO_IDENTITY);
    expect(answer.routes.some(row => row.scope === 'documentation')).toBe(true);
    expect(answer.arguments.flatMap(row => row.claimIds)).not.toContain(CLAIM.NOLO_DIRECT_TRANSFER);
  });
  it('une précaution hop-creep seule ne devient pas une stratégie NOLO substantielle', () => {
    const corpus = getHopDocumentaryCorpus();
    const riskOnly = createHopDocumentaryCorpus({ version: 'risk-only', sources: corpus.sources,
      claims: corpus.claims.filter(row => row.id === CLAIM.HOP_CREEP) });
    const answer = buildHopDocumentaryAnswer(fixture('lowAlcoholCharacter'), riskOnly);
    expect(answer.coverage.status).toBe('outOfScope'); expect(answer.routes).toEqual([]);
    expect(answer.arguments.some(row => row.claimIds.includes(CLAIM.HOP_CREEP))).toBe(true);
  });
  it.each([
    ['aromaPairing', CLAIM.LEXICAL_NOT_PAIRING],
    ['balancePerceivedSweetness', CLAIM.SWEETNESS_BALANCE],
  ] as const)('le seul cadrage %s ne ferme pas une demande de stratégie', (kind, claimId) => {
    const corpus = getHopDocumentaryCorpus();
    const framingOnly = createHopDocumentaryCorpus({ version: 'framing-only', sources: corpus.sources,
      claims: corpus.claims.filter(row => row.id === claimId) });
    const answer = buildHopDocumentaryAnswer(fixture(kind), framingOnly);
    expect(answer.coverage.status).toBe('outOfScope'); expect(answer.routes).toEqual([]);
    expect(answer.arguments.some(row => row.claimIds.includes(claimId))).toBe(true);
  });
  it('avec une lacune locale, la réponse utile précède le détail des prémisses manquantes', () => {
    const answer = buildHopDocumentaryAnswer(fixture('lowAlcoholCharacter'), corpusWithout(CLAIM.LF_NOLO_IDENTITY));
    expect(answer.body[0].text).toMatch(/preuve de transfert/);
    expect(answer.body.some(row => /Cette lacune concerne/.test(row.text))).toBe(true);
  });
  it.each([CLAIM.LF_NOLO_IDENTITY, CLAIM.NOLO_DIRECT_TRANSFER])('les preuves propres du candidat NOLO survivent sans %s', (absentClaim) => {
    const input = fixture('lowAlcoholCharacter'); input.criteria[0].familyId = 'tropical';
    candidate(input); input.needs[0].candidateIds = ['candidate'];
    const complete = buildHopDocumentaryAnswer(input), partial = buildHopDocumentaryAnswer(input, corpusWithout(absentClaim));
    const candidateArguments = complete.arguments.filter(row => row.materialEvidence.length > 0);
    const candidateRoutes = complete.routes.filter(row => row.materialIds.includes('candidate'));
    expect(candidateArguments.length).toBeGreaterThan(0); expect(candidateRoutes.length).toBeGreaterThan(0);
    expect(partial.arguments.filter(row => row.materialEvidence.length > 0)).toEqual(candidateArguments);
    expect(partial.routes.filter(row => row.materialIds.includes('candidate'))).toEqual(candidateRoutes);
    expect(partial.coverage.status).toBe('partial');
  });
  it.each(['notLoaded', 'withoutDescription'] as const)('les lacunes propres du candidat NOLO restent visibles : %s', (state) => {
    const input = fixture('lowAlcoholCharacter'); input.criteria[0].familyId = 'tropical';
    input.needs[0].candidateIds = ['candidate'];
    if (state === 'withoutDescription') candidate(input, false);
    const complete = buildHopDocumentaryAnswer(input), partial = buildHopDocumentaryAnswer(input, corpusWithout(CLAIM.LF_NOLO_IDENTITY));
    const gap = complete.arguments.find(row => state === 'notLoaded'
      ? row.text.startsWith('Identités documentaires demandées mais non chargées')
      : row.text.startsWith('Fiches explicitement demandées sans preuve'))!;
    expect(gap).toBeDefined(); expect(partial.arguments).toContainEqual(gap);
    expect(partial.coverage.status).toBe('partial');
  });
  it('deux limites biologiques seules ne deviennent pas une réponse substantielle à un accord', () => {
    const input = fixture('aromaPairing');
    input.context.assertions.push({ id: 'culture', subject: 'culture', statement: 'Culture déclarée sans effet qualifié.',
      state: 'reported', value: 'culture-fixture', dimension: 'bioInteraction' });
    const corpus = getHopDocumentaryCorpus();
    const limitsOnly = createHopDocumentaryCorpus({ version: 'culture-limits-only', sources: corpus.sources,
      claims: corpus.claims.filter(row => row.id === CLAIM.CHEMISTRY_NOT_SENSORY || row.id === CLAIM.CULTURE_CONTEXT) });
    const answer = buildHopDocumentaryAnswer(input, limitsOnly);
    expect(answer.coverage.status).toBe('outOfScope'); expect(answer.coverage.points[0].status).toBe('unresolved');
    expect(answer.arguments.flatMap(row => row.claimIds)).toEqual(expect.arrayContaining([CLAIM.CHEMISTRY_NOT_SENSORY, CLAIM.CULTURE_CONTEXT]));
    expect(answer.routes.every(row => row.preparation.operational.status === 'notProvided')).toBe(true);
  });
  it('sources fabricant, entretien et résumé gardent leurs natures/niveaux, sans identité matière Suava créée', () => {
    const result = buildHopDocumentaryAnswer(fixture('lowAlcoholCharacter'));
    expect(result.corpusSnapshot.sources.some(row => row.nature === 'manufacturerClaim')).toBe(true);
    expect(result.corpusSnapshot.sources.some(row => row.nature === 'brewerInterview')).toBe(true);
    expect(result.corpusSnapshot.sources.some(row => row.readingLevel === 'primaryAbstract' || row.readingLevel === 'primaryExcerpt')).toBe(true);
    expect(result.routes.flatMap(row => row.materialIds)).toEqual([]);
    for (const row of result.arguments) for (const claimId of row.claimIds) {
      const claim = result.corpusSnapshot.claims.find(row => row.id === claimId)!;
      expect(claim).toBeDefined();
      for (const sourceId of claim.sourceIds) expect(result.corpusSnapshot.sources.some(source => source.id === sourceId)).toBe(true);
    }
  });
  it('réutiliser un ID avec une assertion changée ou une preuve promue ne suffit pas à la qualifier', () => {
    const corpus = getHopDocumentaryCorpus();
    const iso = corpus.claims.find(row => row.id === CLAIM.ISO_HOPSTEINER)!;
    iso.statement = 'Affirmation contraire non reçue sous le même ID.';
    const changed = createHopDocumentaryCorpus({ version: 'other-editorial-content', sources: corpus.sources, claims: corpus.claims });
    const result = buildHopDocumentaryAnswer(fixture(), changed);
    expect(result.coverage.status).toBe('partial'); expect(result.routes.every(row => row.documentaryProductRefs.length === 0)).toBe(true);
    const promoted = getHopDocumentaryCorpus(), originalIso = promoted.claims.find(row => row.id === CLAIM.ISO_HOPSTEINER)!;
    promoted.sources.find(row => row.id === originalIso.sourceIds[0])!.nature = 'research';
    const alteredNature = buildHopDocumentaryAnswer(fixture(), createHopDocumentaryCorpus({ version: 'promoted-nature', sources: promoted.sources, claims: promoted.claims }));
    expect(alteredNature.arguments.flatMap(row => row.claimIds)).not.toContain(CLAIM.ISO_HOPSTEINER);
  });
  it('une source de mapping non qualifiée reste une lacune locale dans une réponse NOLO', () => {
    const input = fixture('lowAlcoholCharacter'); input.criteria[0].familyId = 'tropical'; candidate(input);
    const corpus = getHopDocumentaryCorpus();
    const lexicon = corpus.sources.find(row => row.source.reference === 'src/data/hopRecipeGuideBootstrap.json')!;
    lexicon.nature = 'research';
    const answer = buildHopDocumentaryAnswer(input, createHopDocumentaryCorpus({ version: 'changed-lexicon-nature', sources: corpus.sources, claims: corpus.claims }));
    expect(answer.coverage.status).toBe('partial');
    expect(answer.arguments.every(row => row.materialEvidence.length === 0)).toBe(true);
    expect(answer.routes.some(row => row.intervention === 'changeAroma')).toBe(true);
    expect(answer.body.some(row => /source de mapping exacte/.test(row.text))).toBe(true);
  });
  it('ancienne réponse, DTO et dossier se relisent sans builder, corpus courant ou horloge', () => {
    const input = fixture(), answer = buildHopDocumentaryAnswer(input), frozen = JSON.parse(JSON.stringify(answer));
    const selected = answer.routes.find(row => row.documentaryProductRefs.length)!;
    const dossier = createHopDocumentaryDossier({ id: 'qa-choice', answer, expectedAnswerReference: answer.reference,
      expectedInterpretationReference: answer.interpretationReference, routeId: selected.id, expectedRouteReference: selected.reference,
      motive: 'Préparer seulement un dossier à qualifier.', createdAt: '2026-10-02T17:00:00.000Z', createdBy: { origin: 'fixture', label: 'QA documentaire' } });
    const changed = fixture(); changed.interpretation.version = '2'; changed.context.stage = 'packaged';
    expect(buildHopDocumentaryAnswer(changed).reference).not.toBe(answer.reference);
    const run = vi.spyOn(builder, 'buildHopDocumentaryAnswer').mockImplementation(() => { throw Error('Pas de nouvelle synthèse'); });
    const load = vi.spyOn(evidence, 'getHopDocumentaryCorpus').mockImplementation(() => { throw Error('Pas de corpus courant'); });
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => { throw Error('Pas d’horloge'); });
    try {
      expect(readHopDocumentaryAnswer(frozen)).toEqual({ status: 'readOnly', answer: frozen });
      const view = hopDocumentaryAnswerViewModel(frozen);
      expect(view.body).toEqual(answer.body); expect(view.routes).toEqual(answer.routes); expect(view.corpusSnapshot).toEqual(answer.corpusSnapshot);
      expect(readHopDocumentaryDossier(JSON.parse(JSON.stringify(dossier)))).toEqual({ status: 'readOnly', dossier });
    } finally { run.mockRestore(); load.mockRestore(); clock.mockRestore(); }
  });
});
