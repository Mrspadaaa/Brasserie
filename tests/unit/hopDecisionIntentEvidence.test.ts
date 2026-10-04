import { describe, expect, it } from 'vitest';
import type { HopDescription, HopSource, HopVariety } from '../../functions/src/hopIndexSchema';
import { evaluateHopIntentEvidence, listHopIntentEvidenceFamilies, type HopIntentEvidenceCriterion } from '../../src/domain/hopDecision/intentEvidence';
import type { HopDecisionMaterial } from '../../src/domain/hopDecision/types';

const source = (reference: string, kind: HopSource['kind'] = 'observation'): HopSource => ({
  title: `Fixture ${reference}`,
  author: 'Tests métier J1',
  year: 2026,
  kind,
  reference: `fixture:${reference}`,
  locator: 'Texte synthétique; aucune donnée de houblon ou bière réelle.',
});

const description = (text: string, context: HopDescription['context'], reference: string): HopDescription => ({
  text,
  context,
  source: source(reference),
});

const variety = (id: string, name: string, descriptions: HopDescription[]): HopVariety => ({
  id,
  name,
  aliases: [],
  origin: 'fixture',
  form: 'pelletT90',
  descriptions,
  analysis: [],
});

const material = (id: string, name: string, descriptions: HopDescription[]): HopDecisionMaterial => ({
  id,
  name,
  form: 'pelletT90',
  variety: variety(`variety:${id}`, name, descriptions),
});

const criterion = (overrides: Partial<HopIntentEvidenceCriterion> & Pick<HopIntentEvidenceCriterion, 'role'>): HopIntentEvidenceCriterion => ({
  id: 'criterion:aroma',
  description: 'Interprétation synthétique de fixture.',
  origin: 'user',
  ...overrides,
});

describe('évaluation documentaire des critères aromatiques', () => {
  it('relie une preuve exacte au contexte et aux deux provenances', () => {
    const candidate = material('new-material-76', 'Identité inédite-31', [description('Note agrumes dans le profil de houblon brut.', 'rawHop', 'candidate-raw')]);
    const result = evaluateHopIntentEvidence({
      criterion: criterion({ role: 'seek', familyId: 'citrus' }),
      candidate,
    });

    expect(result.status).toBe('documentedSupport');
    expect(result.candidateEvidence).toHaveLength(1);
    expect(result.candidateEvidence[0]).toMatchObject({
      familyId: 'citrus',
      term: 'agrumes',
      quote: 'Note agrumes dans le profil de houblon brut.',
      context: 'rawHop',
      source: { reference: 'fixture:candidate-raw' },
      mappingSource: { reference: 'src/data/hopRecipeGuideBootstrap.json' },
      polarity: 'positiveMention',
    });
    expect(result.consequence).toMatch(/sans cible d'intensité ni résultat garanti/u);
    expect(result).not.toHaveProperty('score');
    expect(result).not.toHaveProperty('intensity');
  });

  it('expose par copie le vocabulaire local et sa provenance de mapping', () => {
    const first = listHopIntentEvidenceFamilies();
    const citrus = first.find(family => family.id === 'citrus');
    expect(citrus?.terms).toContain('agrumes');
    expect(citrus?.source.reference).toBe('src/data/hopRecipeGuideBootstrap.json');
    first.splice(0, first.length);
    expect(listHopIntentEvidenceFamilies().some(family => family.id === 'citrus')).toBe(true);
  });

  it('garde séparées les descriptions rawHop et beer et inverse seek/avoid sans score', () => {
    const candidate = material('material-random-205', 'Nom aléatoire Bêta', [
      description('Agrumes cités à l’état de houblon brut.', 'rawHop', 'raw-context'),
      description('Floral observé dans une bière de fixture.', 'beer', 'beer-context'),
    ]);
    const seeking = evaluateHopIntentEvidence({ criterion: criterion({ role: 'seek', familyId: 'citrus' }), candidate });
    const avoiding = evaluateHopIntentEvidence({ criterion: criterion({ role: 'avoid', familyId: 'citrus' }), candidate });
    const floral = evaluateHopIntentEvidence({ criterion: criterion({ role: 'seek', familyId: 'floral' }), candidate });

    expect(seeking.status).toBe('documentedSupport');
    expect(avoiding.status).toBe('documentedTension');
    expect(seeking.candidateEvidence[0].context).toBe('rawHop');
    expect(floral.candidateEvidence[0].context).toBe('beer');
    expect(seeking.consequence).not.toBe(avoiding.consequence);
    expect(seeking.candidateEvidence.map(row => row.source.reference)).toEqual(['fixture:raw-context']);
  });

  it('préserve la divergence documentaire entre contextes au lieu de la réduire à un overlap', () => {
    const candidate = material('candidate-divergent-sources', 'Nom-X', [
      description('Résine citée dans la fiche de houblon brut.', 'rawHop', 'candidate-raw-positive'),
      description('Resin was not listed in this beer observation.', 'beer', 'candidate-beer-negative'),
    ]);
    const partner = material('partner-resin-positive', 'Nom-Y', [description('Resin is cited in this beer note.', 'beer', 'partner-beer-positive')]);
    const result = evaluateHopIntentEvidence({
      criterion: criterion({ role: 'pairWith', familyId: 'resin', partner: { kind: 'material', id: partner.id } }),
      candidate,
      materials: [partner],
    });

    expect(result.status).toBe('ambiguous');
    expect(result.sharedFamilyIds).toEqual([]);
    expect(result.candidateEvidence).toHaveLength(2);
    expect(result.candidateEvidence.map(row => row.context)).toEqual(['rawHop', 'beer']);
    expect(result.candidateEvidence.map(row => row.source.reference)).toEqual(['fixture:candidate-raw-positive', 'fixture:candidate-beer-negative']);
    expect(result.partnerEvidence[0].source.reference).toBe('fixture:partner-beer-positive');
    expect(result.consequence).toMatch(/ne prouve pas une contradiction physique/u);
    expect(result.missingInformation.some(item => item.includes('divergentes sur le candidat'))).toBe(true);
  });

  it('évalue pairWith par preuve commune, sans maximiser ni assimiler accord et intensité', () => {
    const candidate = material('candidate-new-900', 'Matière-Autre', [description('Agrumes décrits sur la matière.', 'rawHop', 'candidate-citrus')]);
    const partner = material('partner-new-901', 'Compagnon-Autre', [description('Agrumes observés dans une bière témoin.', 'beer', 'partner-citrus')]);
    const result = evaluateHopIntentEvidence({
      criterion: criterion({ role: 'pairWith', familyId: 'citrus', partner: { kind: 'material', id: partner.id, additionId: 'addition:observed' } }),
      candidate,
      materials: [candidate, partner],
    });

    expect(result.status).toBe('documentedOverlap');
    expect(result.sharedFamilyIds).toEqual(['citrus']);
    expect(result.candidateEvidence[0].context).toBe('rawHop');
    expect(result.partnerEvidence[0]).toMatchObject({ context: 'beer', source: { reference: 'fixture:partner-citrus' } });
    expect(result.partnerReference).toEqual({ kind: 'material', id: partner.id, additionId: 'addition:observed' });
    expect(result.consequence).toMatch(/pas une mesure d'accord, de synergie ou d'intensité/u);
    expect(result).not.toHaveProperty('score');

    const seeking = evaluateHopIntentEvidence({ criterion: criterion({ role: 'seek', familyId: 'citrus' }), candidate });
    expect(seeking.status).toBe('documentedSupport');
    expect(result.status).not.toBe(seeking.status);

    const observedPartner = description('Agrumes rapportés sur l’échantillon de fermentation.', 'beer', 'pairing-observation');
    const observed = evaluateHopIntentEvidence({
      criterion: criterion({ role: 'pairWith', familyId: 'citrus', partner: { kind: 'observation', id: 'sample:fermentation-22', descriptions: [observedPartner] } }),
      candidate,
    });
    expect(observed.status).toBe('documentedOverlap');
    expect(observed.partnerReference).toMatchObject({ kind: 'observation', id: 'sample:fermentation-22' });
    expect(observed.partnerEvidence[0].source.reference).toBe('fixture:pairing-observation');
  });

  it('préserve un contexte libre comme banane sans le forcer dans une famille', () => {
    const candidate = material('material-banana-case', 'Matière-une', [description('Note fruitée au contexte incertain.', 'unspecified', 'banana-case')]);
    const result = evaluateHopIntentEvidence({
      criterion: criterion({ role: 'pairWith', partner: { kind: 'freeContext', text: 'banane', context: 'levure déjà observée' } }),
      candidate,
    });

    expect(result.status).toBe('unknown');
    expect(result.familyIds).toEqual([]);
    expect(result.partnerReference).toMatchObject({ kind: 'freeContext', text: 'banane', context: 'levure déjà observée' });
    expect(result.missingInformation.some(item => item.includes('aucune famille'))).toBe(true);
    expect(result.candidateDescriptions[0].text).toBe('Note fruitée au contexte incertain.');

    const partner = material('partner-banana-context', 'Partenaire-une', [description('Banane citée sans mapping local.', 'beer', 'banana-partner')]);
    const withUnmappedObservation = evaluateHopIntentEvidence({
      criterion: criterion({ role: 'pairWith', partner: { kind: 'material', id: partner.id } }),
      candidate,
      materials: [partner],
    });
    expect(withUnmappedObservation.status).toBe('unknown');
    expect(withUnmappedObservation.familyIds).toEqual([]);
    expect(withUnmappedObservation.partnerDescriptions[0].text).toContain('Banane');
  });

  it('demande un partenaire explicite pour pairWith sans supprimer la piste candidat', () => {
    const candidate = material('material-candidate-66', 'Nom inédit', [description('Citronné dans une infusion.', 'infusion', 'candidate-alone')]);
    const result = evaluateHopIntentEvidence({ criterion: criterion({ role: 'pairWith', familyId: 'citrus' }), candidate });

    expect(result.status).toBe('unknown');
    expect(result.candidateEvidence).toHaveLength(1);
    expect(result.missingInformation).toContain('Identifier le partenaire, ou fournir une observation explicite; aucun compagnon n’est inventé.');
  });

  it('garde une preuve candidat quand le partenaire existe mais manque de descriptions', () => {
    const candidate = material('candidate-with-citrus', 'Nom-A', [description('Agrumes documentés.', 'rawHop', 'candidate-citrus-2')]);
    const partner = material('partner-without-text', 'Nom-B', []);
    const result = evaluateHopIntentEvidence({
      criterion: criterion({ role: 'pairWith', familyId: 'citrus', partner: { kind: 'material', id: partner.id } }),
      candidate,
      materials: [partner],
    });

    expect(result.status).toBe('unknown');
    expect(result.candidateEvidence).toHaveLength(1);
    expect(result.partnerEvidence).toEqual([]);
    expect(result.missingInformation.some(item => item.includes('description sourcée disponible'))).toBe(true);
  });

  it('distingue la contradiction de mention, la négation, le non-documenté et l’ambiguïté', () => {
    const negative = material('negative-evidence', 'Nom-A', [description('Sans résine et pas de pin.', 'rawHop', 'negative-text')]);
    const postNegation = material('post-negative-evidence', 'Nom-A2', [description('Pine is not listed in this report.', 'rawHop', 'post-negative-text')]);
    const notDocumented = material('no-term-evidence', 'Nom-B', [description('Fruitée sans famille plus précise.', 'unspecified', 'generic-fruity')]);
    const noDescriptions = material('no-description-evidence', 'Nom-C', []);
    const ambiguous = material('ambiguous-evidence', 'Nom-D', [description('Not only pineapple is mentioned in this fixture.', 'rawHop', 'ambiguous-text')]);
    const substringTrap = material('substring-trap', 'Nom-E', [description('Pineapple is mentioned.', 'rawHop', 'substring-text')]);

    const negated = evaluateHopIntentEvidence({ criterion: criterion({ role: 'avoid', familyId: 'resin' }), candidate: negative });
    const negatedAfter = evaluateHopIntentEvidence({ criterion: criterion({ role: 'avoid', familyId: 'resin' }), candidate: postNegation });
    const notMentioned = evaluateHopIntentEvidence({ criterion: criterion({ role: 'avoid', familyId: 'tropical' }), candidate: notDocumented });
    const unknown = evaluateHopIntentEvidence({ criterion: criterion({ role: 'avoid', familyId: 'tropical' }), candidate: noDescriptions });
    const ambiguousResult = evaluateHopIntentEvidence({ criterion: criterion({ role: 'seek', familyId: 'tropical' }), candidate: ambiguous });
    const exactBoundary = evaluateHopIntentEvidence({ criterion: criterion({ role: 'avoid', familyId: 'resin' }), candidate: substringTrap });
    const pineappleFamily = evaluateHopIntentEvidence({ criterion: criterion({ role: 'seek', familyId: 'tropical' }), candidate: substringTrap });

    expect(negated.status).toBe('documentedAgainst');
    expect(negated.candidateEvidence.every(row => row.polarity === 'explicitNegation')).toBe(true);
    expect(negatedAfter.status).toBe('documentedAgainst');
    expect(negatedAfter.candidateEvidence[0].polarity).toBe('explicitNegation');
    expect(negated.consequence).toMatch(/ne prouve pas l'absence sensorielle/u);
    expect(notMentioned.status).toBe('notDocumented');
    expect(notMentioned.candidateDescriptions).toHaveLength(1);
    expect(notMentioned.consequence).toMatch(/ne démontre pas l'absence/u);
    expect(unknown.status).toBe('unknown');
    expect(ambiguousResult.status).toBe('ambiguous');
    expect(exactBoundary.status).toBe('notDocumented');
    expect(pineappleFamily.status).toBe('documentedSupport');
  });

  it('refuse un identifiant de famille inconnu et conserve l’assertion libre', () => {
    const candidate = material('material-unmapped-2', 'Nom libre', [description('Banane citée dans la note.', 'beer', 'unmapped-description')]);
    const result = evaluateHopIntentEvidence({ criterion: criterion({ role: 'seek', familyId: 'bananaFamily' }), candidate });

    expect(result.status).toBe('unknown');
    expect(result.familyIds).toEqual([]);
    expect(result.missingInformation.some(item => item.includes('absente ou non sourcée'))).toBe(true);
    expect(result.candidateDescriptions[0].text).toContain('Banane');
  });

  it('refuse un contexte HopDescription absent ou hors des quatre valeurs qualifiées', () => {
    const validSource = source('invalid-context');
    const missingContext = { text: 'Agrumes cités.', source: validSource } as unknown as HopDescription;
    const unknownContext = { text: 'Resin citée.', context: 'kettle-sample', source: validSource } as unknown as HopDescription;
    const candidate = material('bad-context-input', 'Nom-contexte-invalide', [missingContext, unknownContext]);
    const result = evaluateHopIntentEvidence({ criterion: criterion({ role: 'seek', familyId: 'citrus' }), candidate });

    expect(result.status).toBe('unknown');
    expect(result.candidateEvidence).toEqual([]);
    expect(result.candidateDescriptions).toEqual([]);
    expect(result.missingInformation.some(item => item.includes('contexte absent ou hors des quatre contextes reconnus'))).toBe(true);
  });

  it('garde une observation liée sans la convertir en cible de gain', () => {
    const candidate = material('material-observation-new', 'Nouveau-Nom', []);
    const observation = description('Agrume perçu sur l’échantillon de cette fermentation.', 'beer', 'sample-observation');
    const result = evaluateHopIntentEvidence({
      criterion: criterion({ role: 'observation', partner: { kind: 'observation', id: 'sample:j1-17', descriptions: [observation] } }),
      candidate,
    });

    expect(result.status).toBe('observationToPreserve');
    expect(result.partnerReference).toMatchObject({ kind: 'observation', id: 'sample:j1-17' });
    expect(result.partnerDescriptions).toEqual([observation]);
    expect(result.consequence).toMatch(/ni une cible de gain ni une prévision/u);
    const preserve = evaluateHopIntentEvidence({
      criterion: criterion({ role: 'preserve', partner: { kind: 'observation', id: 'sample:j1-17', descriptions: [observation] } }),
      candidate,
    });
    expect(preserve.status).toBe('observationToPreserve');
  });

  it('ne modifie ni le candidat ni le critère transmis', () => {
    const candidate = material('unchanged-candidate', 'Nom inchangé', [description('Agrumes cités.', 'rawHop', 'unchanged-source')]);
    const partner = material('unchanged-partner', 'Partenaire inchangé', [description('Agrumes observés.', 'beer', 'unchanged-partner-source')]);
    const materials = [partner];
    const inputCriterion = criterion({ role: 'pairWith', familyId: 'citrus', partner: { kind: 'material', id: partner.id } });
    const candidateBefore = structuredClone(candidate), partnerBefore = structuredClone(partner), materialsBefore = structuredClone(materials);
    const criterionBefore = structuredClone(inputCriterion);
    evaluateHopIntentEvidence({ criterion: inputCriterion, candidate, materials });
    expect(candidate).toEqual(candidateBefore);
    expect(partner).toEqual(partnerBefore);
    expect(materials).toEqual(materialsBefore);
    expect(inputCriterion).toEqual(criterionBefore);
  });

  it('est invariant au nom et à l’identité tout en retournant la nouvelle identité', () => {
    const desc = description('Agrumes cités dans une note de fournisseur.', 'rawHop', 'identity-independent');
    const first = evaluateHopIntentEvidence({ criterion: criterion({ role: 'seek', familyId: 'citrus' }), candidate: material('id-alpha', 'Nom-A', [desc]) });
    const second = evaluateHopIntentEvidence({ criterion: criterion({ role: 'seek', familyId: 'citrus' }), candidate: material('random-id-947', 'Nom-Entièrement-Nouveau', [desc]) });

    expect(first.status).toBe(second.status);
    expect(first.candidateEvidence).toEqual(second.candidateEvidence);
    expect(second.candidateId).toBe('random-id-947');
  });

  it('ne traite pas une contrainte technique comme une assertion aromatique', () => {
    const candidate = material('material-constraint-test', 'Nom-Contraint', [description('Résine citée.', 'rawHop', 'constraint-text')]);
    const result = evaluateHopIntentEvidence({ criterion: criterion({ role: 'constraint', familyId: 'resin' }), candidate });

    expect(result.status).toBe('notApplicable');
    expect(result.consequence).toMatch(/gardes d’identité, d’emploi, de stade ou de stock/u);
  });
});
