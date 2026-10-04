import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { assertHopPropertyAdviceRequestV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import { buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import { HopV55PropertyAdviceDecisionV3, type HopV55PropertyAdviceReinterpretRequestV3 } from '../../src/ui/hopV55/PropertyAdviceDecisionV3';
import { HopV55PropertyAdviceIntentEditorV3 } from '../../src/ui/hopV55/PropertyAdviceIntentEditorV3';
import type { PropertyAdviceIntentEditorV3Props } from '../../src/ui/hopV55/PropertyAdviceIntentEditorV3';
import { makeHopPropertyCompensationRequestV3 } from '../fixtures/hopPropertyCompensation';

afterEach(() => cleanup());

function makeAnswer() {
  return buildHopPropertyAdviceV3(makeHopPropertyCompensationRequestV3());
}

describe('éditeur V3 · cohérence investigation/constat avant callbacks', () => {
  it('bloque le réexamen si la direction de la question disparaît, puis applique le choix explicite « l’examiner »', async () => {
    const user = userEvent.setup();
    const answer = makeAnswer();
    const request = answer.requestSnapshot;
    const question = request.propertyIntents.find((intent) => intent.investigation)!;
    const number = request.propertyIntents.findIndex((intent) => intent.id === question.id) + 1;
    const onReinterpret = vi.fn(async (input: HopV55PropertyAdviceReinterpretRequestV3) => {
      assertHopPropertyAdviceRequestV3(input.request);
      const next = buildHopPropertyAdviceV3(input.request);
      return { kind: 'revision' as const, answer: next, answerRecordReference: 'record:v3:direction-fixed' };
    });
    render(<HopV55PropertyAdviceDecisionV3 answer={answer} answerRecordReference="record:v3:direction-source" onReinterpret={onReinterpret} />);
    await user.click(screen.getByRole('button', { name: 'Corriger cette interprétation' }));
    const role = screen.getByLabelText(`Rôle de l’intention ${number}`);
    await user.selectOptions(role, 'target');
    expect(screen.getByRole('button', { name: 'Créer une nouvelle réponse documentaire' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Le relire comme une question à examiner' }));
    expect(role).toHaveValue('investigation');
    const direction = screen.getByLabelText(`Direction de l’intention ${number}`);
    expect(direction).toHaveValue('investigate');
    await user.selectOptions(direction, '');
    expect(screen.getAllByText(/question de compensation doit garder la direction/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Créer une nouvelle réponse documentaire' })).toBeDisabled();
    expect(onReinterpret).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Décrire cette question comme « à examiner »' }));
    expect(direction).toHaveValue('investigate');
    await user.type(screen.getByLabelText('Lecture corrigée'), 'Lecture V3 conservée après correction explicite.');
    await user.type(screen.getByLabelText('Pourquoi corriger cette interprétation ?'), 'La question doit porter sa direction exacte.');
    await user.click(screen.getByRole('button', { name: 'Créer une nouvelle réponse documentaire' }));
    await waitFor(() => expect(onReinterpret).toHaveBeenCalledTimes(1));
    const submitted = onReinterpret.mock.calls[0][0].request;
    expect(() => assertHopPropertyAdviceRequestV3(submitted)).not.toThrow();
    expect(submitted.propertyIntents.find((intent) => intent.id === question.id)).toMatchObject({ role: 'investigation', direction: 'investigate' });
  });

  it('retire un constat à direction d’objectif du choix et ne le restaure qu’après un geste explicite', async () => {
    const user = userEvent.setup();
    const answer = makeAnswer();
    const request = answer.requestSnapshot;
    const question = request.propertyIntents.find((intent) => intent.investigation)!;
    const observation = request.propertyIntents.find((intent) => intent.id === question.investigation!.observationIntentIds[0])!;
    const questionNumber = request.propertyIntents.findIndex((intent) => intent.id === question.id) + 1;
    const observationNumber = request.propertyIntents.findIndex((intent) => intent.id === observation.id) + 1;
    const onReinterpret = vi.fn(async (input: HopV55PropertyAdviceReinterpretRequestV3) => {
      assertHopPropertyAdviceRequestV3(input.request);
      return { kind: 'revision' as const, answer: buildHopPropertyAdviceV3(input.request), answerRecordReference: 'record:v3:observation-fixed' };
    });
    render(<HopV55PropertyAdviceDecisionV3 answer={answer} answerRecordReference="record:v3:observation-source" onReinterpret={onReinterpret} />);
    await user.click(screen.getByRole('button', { name: 'Corriger cette interprétation' }));
    const direction = screen.getByLabelText(`Direction de l’intention ${observationNumber}`);
    await user.selectOptions(direction, 'increase');
    expect(screen.getAllByText(/constat rapporté doit garder sa direction nulle/i).length).toBeGreaterThan(0);
    expect(screen.queryByLabelText(`Comparer le constat ${observation.label}`)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Créer une nouvelle réponse documentaire' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Le remettre en constat perçu (« ce que je constate », perception)' }));
    expect(direction).toHaveValue('');
    const choice = screen.getByLabelText(`Comparer le constat ${observation.label}`);
    expect(choice).toBeChecked();
    await user.type(screen.getByLabelText('Lecture corrigée'), 'Constat préservé sans direction d’objectif.');
    await user.type(screen.getByLabelText('Pourquoi corriger cette interprétation ?'), 'Rétablir le constat comme observation perçue.');
    await user.click(screen.getByRole('button', { name: 'Créer une nouvelle réponse documentaire' }));
    await waitFor(() => expect(onReinterpret).toHaveBeenCalledTimes(1));
    const submitted = onReinterpret.mock.calls[0][0].request;
    expect(() => assertHopPropertyAdviceRequestV3(submitted)).not.toThrow();
    expect(submitted.propertyIntents.find((intent) => intent.id === observation.id)).toMatchObject({
      role: 'reportedObservation', metric: 'sensory', direction: null,
    });
    expect(submitted.propertyIntents.find((intent) => intent.id === question.id)?.investigation?.observationIntentIds).toEqual([observation.id]);
    expect(questionNumber).toBeGreaterThan(0);
  });

  it('refuse une nouvelle compensation à direction vide, puis valide le DTO après le choix explicite', async () => {
    const user = userEvent.setup();
    const request = structuredClone(makeHopPropertyCompensationRequestV3());
    request.originalQuestion = `🍺 ${request.originalQuestion}`;
    request.propertyIntents = request.propertyIntents.map((intent) => ({ ...intent,
      sourceSpans: intent.sourceSpans.map((span) => ({ ...span, start: span.start + 3, end: span.end + 3 })) }));
    assertHopPropertyAdviceRequestV3(request);
    const observation = request.propertyIntents.find((intent) => intent.role === 'reportedObservation')!;
    const onAddIntent = vi.fn();
    const noChange = vi.fn();
    const props: PropertyAdviceIntentEditorV3Props = {
      request, candidatePolicy: request.candidatePolicy, materialChoices: [],
      onChangeIntent: noChange, onChangeCandidatePolicy: noChange,
      onSearchMaterials: async () => [], onSelectMaterials: async () => [], onChangeMaterials: noChange,
      onChangeAccess: noChange, onChangeAssertions: noChange, onAddIntent,
    };
    render(<HopV55PropertyAdviceIntentEditorV3 {...props} />);
    await user.click(screen.getByText('Ajouter un terme oublié, depuis un passage exact de la question'));
    const questionField = screen.getByLabelText('Question originale · sélectionner un passage') as HTMLTextAreaElement;
    const start = request.originalQuestion.indexOf('comment');
    questionField.setSelectionRange(start, start + 'comment'.length);
    fireEvent.select(questionField);
    await user.click(screen.getByRole('button', { name: 'Utiliser le passage sélectionné' }));
    expect(screen.getByLabelText('Fragment exact à annoter')).toHaveValue('comment');
    await user.selectOptions(screen.getByLabelText('Rôle de la nouvelle intention'), 'investigation');
    await user.selectOptions(screen.getByLabelText('Propriété de la nouvelle intention'), 'sweetness');
    await user.selectOptions(screen.getByLabelText('Direction de la nouvelle intention'), '');
    await user.click(screen.getByLabelText('Nouvelle comparaison de compensations perceptives'));
    await user.click(screen.getByLabelText(`Comparer le constat ${observation.label} dans la nouvelle question`));
    await user.type(screen.getByLabelText('Motif de la nouvelle intention'), 'Examiner une compensation du constat rapporté.');
    const add = screen.getByRole('button', { name: 'Ajouter cette intention à la lecture' });
    expect(add).toBeDisabled();
    expect(onAddIntent).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'L’examiner' }));
    expect(screen.getByLabelText('Direction de la nouvelle intention')).toHaveValue('investigate');
    expect(add).toBeEnabled();
    await user.click(add);
    expect(onAddIntent).toHaveBeenCalledTimes(1);
    const added = onAddIntent.mock.calls[0][0];
    expect(added).toMatchObject({ role: 'investigation', direction: 'investigate',
      investigation: { kind: 'comparePerceptualCompensation', observationIntentIds: [observation.id] },
      relatedIntentIds: expect.arrayContaining([observation.id]),
      sourceSpans: [{ start, end: start + 'comment'.length, text: 'comment' }] });
    expect(() => assertHopPropertyAdviceRequestV3({ ...request, propertyIntents: [...request.propertyIntents, added] })).not.toThrow();
  });
});
