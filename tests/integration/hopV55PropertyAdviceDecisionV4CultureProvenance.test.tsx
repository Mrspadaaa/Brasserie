import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { HopV55PropertyAdviceAnswerRecordV4 } from '../../src/services/hopV55/propertyAdviceRecordsV4';
import { HopV55PropertyAdviceDecisionV4 } from '../../src/ui/hopV55/PropertyAdviceDecisionV4';

afterEach(() => cleanup());

describe('provenance du cadre culturel adopté · rendu V4', () => {
  it('montre le cadre, sa création et son adoption sans fabriquer une source documentaire', async () => {
    const user = userEvent.setup();
    const binding = {
      format: 'hop-v55-adopted-context-binding-v1', ownerKey: 'owner:fixture', workspaceId: 'workspace:fixture',
      contextId: 'context:fixture',
      reference: { id: 'culture:mixte', version: 'v2', contentReference: 'content:culture-mixte' },
      versionSnapshot: { origin: { kind: 'user', description: 'Mélange préparé à la maison.' }, author: { label: 'Mira' },
        createdAt: '2026-10-01T10:00:00.000Z', predecessor: null },
      baseline: {},
      culture: { status: 'declared', value: { state: 'mixed', explanation: 'Deux souches préparées ensemble.',
        members: [{ name: 'Ale maison A', yeastId: 'yeast:home-a' }, { name: 'Ale maison B' }] } },
      sourceContext: { journal: {}, version: {} }, origin: { kind: 'user', description: 'Mélange préparé à la maison.' },
      hypotheses: [], author: { label: 'Mira' }, createdAt: '2026-10-01T10:00:00.000Z',
      adoption: { eventReference: 'event:adopt', adoptedBy: { label: 'Noé' }, adoptedAt: '2026-10-02T11:30:00.000Z', eventSnapshot: {} },
      activations: [], bindingReference: 'binding:fixture',
    };
    const record = {
      format: 'hop-v55-documentary-answer-record-v4', id: 'record:context', ownerKey: 'owner:fixture', workspaceId: 'workspace:fixture',
      sourceReadingReference: 'reading:context', originalQuestion: 'Question de fixture conservée mot pour mot.',
      transition: { kind: 'create', actId: 'act:create', reason: 'Première lecture.', actor: { origin: 'user', label: 'Mira' },
        recordedAt: '2026-10-02T12:00:00.000Z' },
      ledger: { format: 'hop-v55-property-advice-annotation-ledger-v1', sourceAnnotations: [], entries: [], reference: 'ledger:context' },
      preparation: { preparedReference: 'prepared:context', source: { kind: 'exploration' },
        cultureBinding: binding },
      readingContext: { interpretation: { id: 'interpretation:context', version: 'v4', origin: 'user', text: 'Lecture de la fixture.' },
        candidatePolicy: { kind: 'explicit', materialIds: [], basis: 'Aucune matière sélectionnée.' },
        context: { stage: 'planning', stageBasis: 'Stade déclaré.',
          access: {
            bulkBeer: { state: 'unknown', basis: 'Non déclaré.', assertionIds: [] },
            sampling: { state: 'unknown', basis: 'Non déclaré.', assertionIds: [] },
            separatePortion: { state: 'unknown', basis: 'Non déclaré.', assertionIds: [] },
          },
          assertions: [{ id: 'adopted-context-culture', subject: 'culture', statement: 'Culture adoptée explicitement comme hypothèse.',
            state: 'planned', value: 'fixture-culture', dimension: 'bioInteraction' }] },
        exclusions: [] },
      outcome: { kind: 'allRejected' }, reference: 'record-ref:context',
    } as unknown as HopV55PropertyAdviceAnswerRecordV4;
    render(<HopV55PropertyAdviceDecisionV4 record={record} readOnly />);

    const notice = screen.getByLabelText('Cadre de culture adopté');
    expect(notice).toHaveTextContent('Mélange préparé à la maison.');
    expect(notice).toHaveTextContent(/Proposé par\s*Mira/);
    expect(notice).toHaveTextContent(/Adopté par\s*Noé/);
    expect(notice).toHaveTextContent('Culture mixte déclarée');
    expect(screen.queryByText('Aucune source jointe à ce fait.')).not.toBeInTheDocument();

    await user.click(screen.getByText('Éléments déclarés (2)'));
    expect(notice).toHaveTextContent('Ale maison A');
    expect(notice).toHaveTextContent('Ale maison B');
    expect(notice).toHaveTextContent('yeast:home-a');
  });
});
