import { describe, expect, it } from 'vitest';
import studyPack from '../../src/data/hopStudyBootstrap.json';
import { assertHopKnowledge, type HopModel, type HopKnowledge } from '../../functions/src/hopPredictionSchema';
import { guidePredictionKnowledge, guidePredictionKnowledgeQualification } from '../../src/ui/hopIndex/guideData';
import { hopKnowledgeVariantReference, qualifyHopPredictionKnowledge } from '../../src/domain/hopIndex/knowledgeQualification';

const studyModel = () => structuredClone(studyPack.hopKnowledge.find(row => row.kind === 'model') as HopModel);

describe('qualification de base de la calibration Lafontaine', () => {
  it('autorise une base documentaire inconnue seulement sur un modèle désactivé', () => {
    const suspended = studyModel();
    suspended.enabled = false;
    suspended.outputs[0].calibration!.terms[0].basis = 'unknown';

    expect(() => assertHopKnowledge(suspended)).not.toThrow();
    expect(() => assertHopKnowledge({ ...suspended, enabled: true })).toThrow();
    expect(() => assertHopKnowledge({ ...suspended, outputs: [{ ...suspended.outputs[0], calibration: {
      ...suspended.outputs[0].calibration!, terms: [{ ...suspended.outputs[0].calibration!.terms[0], unit: 'unknown' }],
    } }] })).toThrow();
    expect(() => assertHopKnowledge({ ...suspended, outputs: [{ ...suspended.outputs[0], calibration: {
      ...suspended.outputs[0].calibration!, terms: [{ ...suspended.outputs[0].calibration!.terms[0], support: { min: 4, max: 1 } }],
    } }] })).toThrow();
    expect(() => assertHopKnowledge({ ...suspended, outputs: [{ ...suspended.outputs[0], calibration: {
      ...suspended.outputs[0].calibration!, terms: [{ ...suspended.outputs[0].calibration!.terms[0], basis: 'invented' }],
    } }] })).toThrow();

    const invalidSaved = studyModel();
    invalidSaved.version = 'legacy-invalid-unit';
    invalidSaved.enabled = true;
    (invalidSaved.outputs[0].calibration!.terms[0] as { unit: string }).unit = 'unknown';
    const view = guidePredictionKnowledgeQualification([invalidSaved]);
    expect(view.knowledge.find(row => row.id === invalidSaved.id)).toBeUndefined();
    const qualification = view.modelQualifications.find(row => row.id === invalidSaved.id)!;
    expect(qualification).toMatchObject({ status: 'invalid', qualificationRevision: expect.any(String), effective: null });
    expect(qualification.rawVariants).toEqual(expect.arrayContaining([
      expect.objectContaining({ origin: 'saved', status: 'invalid', raw: invalidSaved }),
      expect.objectContaining({ origin: 'proposed', status: 'suspended' }),
    ]));
  });

  it('ne laisse pas une copie sauvegardée active de l’ancienne calibration masquer le seed suspendu', () => {
    const oldSaved = studyModel();
    oldSaved.version = 'lafontaine2015-local-1';
    oldSaved.enabled = true;
    oldSaved.outputs[0].calibration!.terms[0].basis = 'asIs';
    const before = structuredClone(oldSaved);
    const view = guidePredictionKnowledgeQualification([oldSaved]);
    const current = guidePredictionKnowledge([oldSaved]).find(row => row.id === oldSaved.id) as HopModel;
    const qualification = view.modelQualifications.find(row => row.id === oldSaved.id)!;

    expect(qualification).toMatchObject({ status: 'suspended', resolution: 'saved-current', selectedVariant: { origin: 'saved', index: 0 } });
    expect(current.enabled).toBe(false);
    expect(current.version).not.toBe(oldSaved.version);
    expect(current.version).toBe(`${oldSaved.version}-basis-suspended-lf01`);
    expect(current.outputs[0].calibration!.terms[0]).toMatchObject({ basis: 'unknown', support: { min: 0.32, max: 4.07 } });
    expect(current.outputs[0].calibration!.terms[0].coefficient).toEqual(oldSaved.outputs[0].calibration!.terms[0].coefficient);
    expect(oldSaved).toEqual(before);
  });

  it('sépare conflit et suspension, puis conserve les valeurs de la variante S12 choisie malgré ses éditions', () => {
    const exact = studyModel();
    const edited = structuredClone(exact);
    edited.version = 'atelier-revision-19';
    edited.enabled = true;
    edited.name = 'Version personnalisée du même étalonnage';
    edited.source = { ...edited.source, reference: 'fixture:source-choisie-par-ordre', locator: 'Citation modifiée; aucune qualification de base.' };
    const term = edited.outputs[0].calibration!.terms[0];
    term.basis = 'asIs';
    term.support = { min: 0.5, max: 4.4 };
    term.coefficient.range = { min: 0.31, max: 0.77 };
    const rawEdited = structuredClone(edited);

    const left = guidePredictionKnowledgeQualification([exact, edited]);
    const right = guidePredictionKnowledgeQualification([edited, exact]);
    const leftStatus = left.modelQualifications.find(row => row.id === exact.id)!;
    const rightStatus = right.modelQualifications.find(row => row.id === exact.id)!;

    expect(leftStatus).toMatchObject({ status: 'conflict', resolution: 'conflict', effective: null,
      reason: expect.stringMatching(/plusieurs variantes sauvegardées distinctes/i) });
    expect(rightStatus).toMatchObject({ status: 'conflict', resolution: 'conflict', effective: null });
    expect(left.knowledge.some(row => row.id === exact.id)).toBe(false);
    expect(right.knowledge.some(row => row.id === exact.id)).toBe(false);
    expect(leftStatus.rawVariants.filter(row => row.origin === 'saved').map(row => row.variantReference).sort())
      .toEqual(rightStatus.rawVariants.filter(row => row.origin === 'saved').map(row => row.variantReference).sort());
    expect(leftStatus.rawVariants.filter(row => row.origin === 'saved').map(row => row.raw as HopModel).sort((a, b) => a.version.localeCompare(b.version)))
      .toEqual([exact, rawEdited].sort((a, b) => a.version.localeCompare(b.version)));
    expect(leftStatus.rawVariants.filter(row => row.origin === 'saved').every(row => row.status === 'suspended')).toBe(true);
    expect((leftStatus.rawVariants.find(row => (row.raw as HopModel).version === edited.version)!.raw as HopModel).outputs[0].calibration!.terms[0])
      .toMatchObject({ support: { min: 0.5, max: 4.4 }, coefficient: { range: { min: 0.31, max: 0.77 } } });

    const editedReference = hopKnowledgeVariantReference(edited);
    const selectedLeft = guidePredictionKnowledgeQualification([exact, edited], { [exact.id]: editedReference });
    const selectedRight = guidePredictionKnowledgeQualification([edited, exact], { [exact.id]: editedReference });
    const selectedStatus = selectedLeft.modelQualifications.find(row => row.id === exact.id)!;
    const leftEffective = selectedLeft.knowledge.find(row => row.id === exact.id) as HopModel;
    const rightEffective = selectedRight.knowledge.find(row => row.id === exact.id) as HopModel;

    expect(selectedStatus).toMatchObject({ status: 'suspended', resolution: 'saved-selected',
      selectedVariant: { origin: 'saved' }, qualificationRevision: expect.any(String) });
    expect(leftEffective).toEqual(rightEffective);
    expect(leftEffective).toMatchObject({ enabled: false, version: 'atelier-revision-19-basis-suspended-lf01',
      source: edited.source });
    expect(leftEffective.outputs[0].calibration!.terms[0]).toMatchObject({ basis: 'unknown', support: { min: 0.5, max: 4.4 }, coefficient: { range: { min: 0.31, max: 0.77 } } });
    expect(leftEffective.outputs[0].calibration!.intercept.range).toEqual(edited.outputs[0].calibration!.intercept.range);
    expect(leftEffective.outputs[0].calibration!.residual.range).toEqual(edited.outputs[0].calibration!.residual.range);
    expect(guidePredictionKnowledge([edited, exact], { [exact.id]: editedReference }).find(row => row.id === exact.id))
      .toEqual(rightEffective);
    expect(edited).toEqual(rawEdited);
  });

  it('laisse disponible un autre modèle à provenance de calibration distincte', () => {
    const unrelated = studyModel();
    unrelated.id = 'other-calibration-source';
    unrelated.version = 'other-source-1';
    unrelated.enabled = true;
    unrelated.scope.notes = 'Étalonnage synthétique indépendant; l’article Lafontaine est seulement cité en contexte.';
    // A paper citation at model level is contextual; the calibration parameters
    // themselves still have independent provenance and do not use Table S12.
    unrelated.source = { ...unrelated.source, reference: 'https://doi.org/10.23763/BrSc18-19lafontaine', locator: 'Citation contextuelle seulement.' };
    const independentSource = { title: 'Fixture d’un autre étalonnage', author: 'Source distincte', year: 2025,
      kind: 'research' as const, reference: 'https://example.invalid/independent-fit', locator: 'Paramètres de calibration synthétiques.' };
    const calibration = unrelated.outputs[0].calibration!;
    calibration.intercept.source = independentSource;
    calibration.residual.source = independentSource;
    calibration.terms[0].coefficient.source = independentSource;
    calibration.terms[0].basis = 'asIs';
    assertHopKnowledge(unrelated);
    const knowledge: HopKnowledge[] = guidePredictionKnowledge([unrelated]);
    expect(knowledge.find(row => row.id === unrelated.id)).toMatchObject({ enabled: true, version: unrelated.version });
    expect(guidePredictionKnowledgeQualification([unrelated]).modelQualifications.find(row => row.id === unrelated.id)?.status).toBe('eligible');
  });

  it('la révision sauvegardée indépendante garde le même ID et prime le seed sans hériter LF01', () => {
    const independent = studyModel();
    independent.enabled = true;
    independent.version = 'independent-revision';
    independent.scope.notes = 'Paramètres de fixture issus d’une autre provenance, sans preuve S12 utilisée.';
    const independentSource = { title: 'Autre étude de fixture', author: 'Fixture', year: 2026, kind: 'observation' as const,
      reference: 'fixture:independent-same-id', locator: 'Autres paramètres, pas une confirmation des données Lafontaine.' };
    const calibration = independent.outputs[0].calibration!;
    calibration.intercept.source = independentSource;
    calibration.residual.source = independentSource;
    calibration.terms[0].coefficient.source = independentSource;
    calibration.terms[0].basis = 'asIs';
    const view = guidePredictionKnowledgeQualification([independent]);
    const status = view.modelQualifications.find(row => row.id === independent.id)!;
    const effective = view.knowledge.find(row => row.id === independent.id) as HopModel;
    expect(status).toMatchObject({ status: 'eligible', resolution: 'saved-current', selectedVariant: { origin: 'saved' } });
    expect(effective).toMatchObject({ id: independent.id, enabled: true, version: independent.version });
    expect(effective.outputs[0].calibration!.terms[0]).toMatchObject({ basis: 'asIs', coefficient: independent.outputs[0].calibration!.terms[0].coefficient });
    expect(status.rawVariants).toEqual(expect.arrayContaining([
      expect.objectContaining({ origin: 'proposed', status: 'suspended' }),
      expect.objectContaining({ origin: 'saved', status: 'eligible', variantReference: hopKnowledgeVariantReference(independent) }),
    ]));
    expect(status.qualificationRevision).toBeNull();
    expect(status.reason).toMatch(/validité empirique n’est pas évaluée/i);
  });

  it('signale une provenance paramètre Lafontaine incomplète sans inventer LF01 ni autoriser la variante', () => {
    const ambiguous = studyModel();
    ambiguous.enabled = true;
    ambiguous.version = 'local-reference-without-table-locator';
    const incompleteSource = { title: 'Reconstruction locale', author: 'Fixture', year: 2026, kind: 'judgment' as const,
      reference: 'docs/index-houblon-etalonnage.md', locator: 'Coefficients locaux; locator de table absent.' };
    const calibration = ambiguous.outputs[0].calibration!;
    calibration.intercept.source = incompleteSource;
    calibration.residual.source = incompleteSource;
    calibration.terms[0].coefficient.source = incompleteSource;
    calibration.terms[0].basis = 'asIs';

    const view = guidePredictionKnowledgeQualification([ambiguous]);
    const qualification = view.modelQualifications.find(row => row.id === ambiguous.id)!;
    expect(qualification).toMatchObject({ status: 'insufficient', resolution: 'saved-current', effective: null,
      qualificationRevision: null, reason: expect.stringMatching(/preuve insuffisante/i) });
    expect(view.knowledge.some(row => row.id === ambiguous.id)).toBe(false);
    expect(qualification.rawVariants).toEqual(expect.arrayContaining([
      expect.objectContaining({ origin: 'proposed', status: 'suspended', qualificationRevision: expect.any(String) }),
      expect.objectContaining({ origin: 'saved', status: 'insufficient', qualificationRevision: null }),
    ]));
  });

  it('déduplique des saved équivalentes, conserve un modèle désactivé et refuse une référence de sélection obsolète', () => {
    const saved = studyModel();
    saved.id = 'same-model-id-disabled';
    saved.version = 'saved-disabled';
    saved.enabled = false;
    saved.scope.notes = 'Désactivation explicite de fixture.';
    const source = { title: 'Référence indépendante', author: 'Fixture', year: 2026, kind: 'observation' as const,
      reference: 'fixture:disabled-model', locator: 'Paramètres synthétiques.' };
    const calibration = saved.outputs[0].calibration!;
    calibration.intercept.source = source;
    calibration.residual.source = source;
    calibration.terms[0].coefficient.source = source;
    calibration.terms[0].basis = 'asIs';
    assertHopKnowledge(saved);

    const equivalent = guidePredictionKnowledgeQualification([saved, structuredClone(saved)]);
    const equivalentStatus = equivalent.modelQualifications.find(row => row.id === saved.id)!;
    expect(equivalentStatus).toMatchObject({ status: 'disabled', resolution: 'saved-equivalent', effective: saved });
    expect(equivalentStatus.rawVariants.filter(row => row.origin === 'saved')).toHaveLength(2);
    expect(new Set(equivalentStatus.rawVariants.filter(row => row.origin === 'saved').map(row => row.variantReference)).size).toBe(1);
    expect(equivalent.knowledge.find(row => row.id === saved.id)).toEqual(saved);

    const exact = studyModel();
    const edited = structuredClone(exact);
    edited.version = 'different-saved-revision';
    edited.outputs[0].calibration!.terms[0].coefficient.range.min += 0.01;
    const staleChoice = guidePredictionKnowledgeQualification([exact, edited], { [exact.id]: 'variant:no-longer-present' });
    const staleStatus = staleChoice.modelQualifications.find(row => row.id === exact.id)!;
    expect(staleStatus).toMatchObject({ status: 'conflict', resolution: 'conflict', effective: null });
    expect(staleStatus.reason).toMatch(/référence choisie ne correspond plus/i);
    expect(staleChoice.knowledge.some(row => row.id === exact.id)).toBe(false);
  });

  it('refuse les propositions concurrentes par ordre et isole un modèle malformé des autres entrées', () => {
    const proposal = studyModel();
    proposal.id = 'proposed-collision';
    const otherProposal = structuredClone(proposal);
    otherProposal.version = 'different-proposed-revision';
    const collision = qualifyHopPredictionKnowledge([proposal, otherProposal], []);
    const collisionStatus = collision.modelQualifications.find(row => row.id === proposal.id)!;
    expect(collisionStatus).toMatchObject({ status: 'conflict', resolution: 'conflict', effective: null,
      reason: expect.stringMatching(/variantes proposées distinctes/i) });
    expect(collision.knowledge.some(row => row.id === proposal.id)).toBe(false);

    const equivalent = qualifyHopPredictionKnowledge([proposal, structuredClone(proposal)], []);
    expect(equivalent.modelQualifications.find(row => row.id === proposal.id)).toMatchObject({
      status: 'suspended', resolution: 'proposed-equivalent',
    });

    const malformed = structuredClone(studyModel()) as unknown as { id: string; outputs: unknown };
    malformed.id = 'malformed-current-model';
    malformed.outputs = null;
    const healthy = studyModel();
    healthy.id = 'healthy-after-malformed-model';
    healthy.version = 'independent-valid';
    healthy.enabled = true;
    const source = { title: 'Source distincte', author: 'Fixture', year: 2026, kind: 'observation' as const,
      reference: 'fixture:healthy-model', locator: 'Paramètres synthétiques.' };
    const calibration = healthy.outputs[0].calibration!;
    calibration.intercept.source = source;
    calibration.residual.source = source;
    calibration.terms[0].coefficient.source = source;
    calibration.terms[0].basis = 'asIs';
    const badParameterSource = structuredClone(healthy) as unknown as { id: string; outputs: any[] };
    badParameterSource.id = 'malformed-parameter-source';
    badParameterSource.outputs[0].calibration.intercept.source = null;

    expect(() => guidePredictionKnowledgeQualification([
      malformed as unknown as HopKnowledge, badParameterSource as unknown as HopKnowledge, healthy,
    ])).not.toThrow();
    const view = guidePredictionKnowledgeQualification([
      malformed as unknown as HopKnowledge, badParameterSource as unknown as HopKnowledge, healthy,
    ]);
    expect(view.modelQualifications.find(row => row.id === malformed.id)).toMatchObject({ status: 'invalid', effective: null });
    expect(view.modelQualifications.find(row => row.id === badParameterSource.id)).toMatchObject({ status: 'invalid', effective: null });
    expect(view.knowledge.some(row => row.id === malformed.id)).toBe(false);
    expect(view.knowledge.some(row => row.id === badParameterSource.id)).toBe(false);
    expect(view.knowledge.find(row => row.id === healthy.id)).toMatchObject({ enabled: true, version: healthy.version });
  });

  it.each([
    ['numérique', 42],
    ['objet', { unexpected: true }],
  ])('isole un locator %s malformé sans interrompre un autre modèle', (_label, locator) => {
    const malformed = studyModel();
    malformed.id = `malformed-locator-${_label}`;
    malformed.outputs[0].calibration!.intercept.source.locator = locator as unknown as string;
    const other = studyModel();
    other.id = `valid-alongside-${_label}`;
    other.enabled = true;
    const independentSource = { title: 'Source indépendante de fixture', author: 'Fixture', year: 2026,
      kind: 'observation' as const, reference: `fixture:locator-${_label}`, locator: 'Paramètres synthétiques.' };
    const calibration = other.outputs[0].calibration!;
    calibration.intercept.source = independentSource;
    calibration.residual.source = independentSource;
    calibration.terms[0].coefficient.source = independentSource;
    calibration.terms[0].basis = 'asIs';
    assertHopKnowledge(other);

    expect(() => qualifyHopPredictionKnowledge([other], [malformed])).not.toThrow();
    const view = qualifyHopPredictionKnowledge([other], [malformed]);
    const invalid = view.modelQualifications.find(row => row.id === malformed.id)!;
    expect(invalid.status).toBe('invalid');
    expect((invalid.rawVariants.find(row => row.origin === 'saved')!.raw as HopModel)
      .outputs[0].calibration!.intercept.source.locator).toEqual(locator);
    expect(view.knowledge.find(row => row.id === other.id)).toMatchObject({ enabled: true, version: other.version });
  });

  it('garde un locator absent tel quel et insuffisant au lieu de déduire une indépendance', () => {
    const withoutLocator = studyModel();
    withoutLocator.enabled = true;
    withoutLocator.outputs[0].calibration!.terms[0].basis = 'asIs';
    const source = { ...withoutLocator.outputs[0].calibration!.intercept.source };
    delete source.locator;
    const calibration = withoutLocator.outputs[0].calibration!;
    calibration.intercept.source = source;
    calibration.residual.source = source;
    calibration.terms[0].coefficient.source = source;

    const view = qualifyHopPredictionKnowledge([], [withoutLocator]);
    const qualification = view.modelQualifications.find(row => row.id === withoutLocator.id)!;
    expect(qualification).toMatchObject({ status: 'insufficient', resolution: 'saved-current', effective: null, qualificationRevision: null });
    expect(view.knowledge.some(row => row.id === withoutLocator.id)).toBe(false);
    expect((qualification.rawVariants.find(row => row.origin === 'saved')!.raw as HopModel)
      .outputs[0].calibration!.intercept.source).not.toHaveProperty('locator');
  });
});
