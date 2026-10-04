import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { assertHopPropertyAdviceRequestV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import { buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import { HopV55PropertyAdviceDecisionV3 } from '../../src/ui/hopV55/PropertyAdviceDecisionV3';
import { makeHopPropertyCompensationRequestV3 } from '../fixtures/hopPropertyCompensation';

afterEach(() => cleanup());

describe('renderer V3 · matière liée hors périmètre candidat', () => {
  it('montre le partenaire exact et le sujet transmis sans compter ni évaluer Nugget comme candidate', () => {
    const request = structuredClone(makeHopPropertyCompensationRequestV3());
    const originalQuestion = 'Je veux examiner le risque résineux si je choisis Nugget pour amériser, en décrivant mon houblon maison.';
    const span = (text: string) => {
      const start = originalQuestion.indexOf(text);
      if (start < 0 || originalQuestion.indexOf(text, start + text.length) !== -1) throw new Error(`Fragment ambigu : ${text}`);
      return { start, end: start + text.length, text };
    };
    const material = { id: 'variety:nugget-fixture', name: 'Nugget', form: 'pelletT90' as const };
    request.id = 'request:associated-nugget';
    request.originalQuestion = originalQuestion;
    request.candidatePolicy = { kind: 'explicit', materialIds: [], basis: 'Aucune matière n’est demandée à comparer.' };
    request.materials = [material];
    request.propertyIntents = [
      { id: 'intent:resinous-risk', property: 'aroma', label: 'résineux', role: 'investigation', direction: 'investigate',
        qualification: 'Risque conditionnel demandé; ni excès ni manque n’est constaté.', required: true,
        comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'sensory',
        subject: { kind: 'beer', label: 'Bière visée', materialId: null, sensoryContext: 'beer' },
        sourceSpans: [span('résineux')], interpretationOrigin: 'user',
        basis: 'Question d’examen liée à un partenaire exact, sans résultat prédit.', relatedIntentIds: ['intent:house-hop'],
        partner: { kind: 'material', id: material.id } },
      { id: 'intent:house-hop', property: 'materialCharacter', label: 'mon houblon maison', role: 'reportedObservation', direction: null,
        qualification: null, required: false, comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'sensory',
        subject: { kind: 'material', label: 'Houblon maison décrit sans fiche liée', materialId: null, sensoryContext: 'rawHop' },
        sourceSpans: [span('mon houblon maison')], interpretationOrigin: 'user',
        basis: 'Libellé de matière transmis sans identité catalogue ni analyse.', relatedIntentIds: ['intent:resinous-risk'] },
    ];
    assertHopPropertyAdviceRequestV3(request);
    const before = structuredClone(request);
    const answer = buildHopPropertyAdviceV3(request);
    expect(answer.requestSnapshot).toEqual(before);
    expect(answer.requestSnapshot.candidatePolicy.materialIds).toEqual([]);
    expect(answer.requestSnapshot.materials.map((row) => row.id)).toEqual([material.id]);
    expect(answer.candidateAssessments).toHaveLength(0);

    const view = render(<HopV55PropertyAdviceDecisionV3 answer={answer} answerRecordReference="record:associated-nugget" />);
    const associated = within(screen.getByRole('group', { name: 'Matières associées à la question' }));
    expect(associated.getByText('Nugget')).toBeInTheDocument();
    expect(associated.getByText('Partenaire exact · intention « résineux »')).toBeInTheDocument();
    expect(associated.getByText('Sujet de la question · intention « mon houblon maison »')).toBeInTheDocument();
    expect(associated.getByText('Libellé transmis sans fiche liée.')).toBeInTheDocument();
    expect(view.container.querySelectorAll('.hv-property-candidate')).toHaveLength(0);
    expect(screen.getByText('Aucune matière n’a été demandée à comparer. Les sujets et partenaires associés ci-dessus ne deviennent pas des évaluations.'))
      .toBeInTheDocument();

    const associationDetails = associated.getAllByText('Détails de l’association');
    associationDetails.forEach((summary) => summary.click());
    expect(associated.getByText(`Identité matière · ${material.id}`)).toBeInTheDocument();
    expect(associated.getByText('Libellé transmis sans identité de fiche liée.')).toBeInTheDocument();
  });
});
