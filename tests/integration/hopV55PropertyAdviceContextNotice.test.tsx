import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import { HopV55PropertyAdviceDecisionV3 } from '../../src/ui/hopV55/PropertyAdviceDecisionV3';
import { makeHopPropertyCompensationRequestV3 } from '../fixtures/hopPropertyCompensation';

afterEach(() => cleanup());

describe('slot du contexte reçu · entrée effectivement affichée', () => {
  it('transmet la référence courante, puis la référence historique exacte et le bon geste de correction', async () => {
    const user = userEvent.setup();
    const request = makeHopPropertyCompensationRequestV3();
    const currentAnswer = buildHopPropertyAdviceV3({ ...structuredClone(request), id: 'request:context-current',
      interpretation: { id: 'interpretation:context-current', version: '2', text: 'Lecture actuelle de la fixture.', origin: 'user' } });
    const historicalAnswer = buildHopPropertyAdviceV3({ ...structuredClone(request), id: 'request:context-historical',
      interpretation: { id: 'interpretation:context-historical', version: '2', text: 'Lecture historique de la fixture.', origin: 'user' } });
    const renderContextNotice = (entry: Parameters<NonNullable<Parameters<typeof HopV55PropertyAdviceDecisionV3>[0]['renderContextNotice']>>[0],
      canCorrect: boolean, openCorrection: () => void) => <aside className="hv-property-context-notice" data-testid="context-notice"
        data-answer-reference={entry.answer.reference} data-record-reference={entry.answerRecordReference}
        data-can-correct={String(canCorrect)}>
        <strong>Contexte de la lecture</strong><p>{entry.answer.requestSnapshot.interpretation.text}</p>
        {canCorrect ? <button type="button" onClick={openCorrection}>Préciser le contexte de cette lecture</button> : null}
      </aside>;
    render(<HopV55PropertyAdviceDecisionV3 answer={currentAnswer} answerRecordReference="record:context-current"
      previousAnswers={[{ answer: historicalAnswer, answerRecordReference: 'record:context-historical' }]}
      onReinterpret={vi.fn(async () => { throw new Error('La correction ne doit pas être soumise dans ce test.'); })}
      renderContextNotice={renderContextNotice} />);

    let notice = screen.getByTestId('context-notice');
    expect(notice).toHaveAttribute('data-answer-reference', currentAnswer.reference);
    expect(notice).toHaveAttribute('data-record-reference', 'record:context-current');
    expect(notice).toHaveAttribute('data-can-correct', 'true');
    await user.click(screen.getByRole('button', { name: 'Préciser le contexte de cette lecture' }));
    expect(screen.getByLabelText('Lecture corrigée')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Annuler' }));

    await user.click(screen.getByRole('button', { name: 'Ouvrir en lecture figée' }));
    notice = screen.getByTestId('context-notice');
    expect(notice).toHaveAttribute('data-answer-reference', historicalAnswer.reference);
    expect(notice).toHaveAttribute('data-record-reference', 'record:context-historical');
    expect(notice).toHaveAttribute('data-can-correct', 'false');
    expect(notice).toHaveTextContent('Lecture historique de la fixture.');
    expect(screen.queryByRole('button', { name: 'Préciser le contexte de cette lecture' })).not.toBeInTheDocument();
  });
});
