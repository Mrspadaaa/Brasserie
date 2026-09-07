import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { it, expect, vi, afterEach } from 'vitest';
import { BrewerProposalCard } from '../../src/ui/BrewerProposalCard';
afterEach(cleanup);
it('selects linked water changes together while leaving an independent name selectable', async () => {
  const decide = vi.fn().mockResolvedValue(undefined);
  render(
    <BrewerProposalCard
      disabled={false}
      draft
      onDecide={decide}
      proposal={{
        target: 'recipe',
        title: 'Eau adaptée',
        changes: [
          {
            id: 'C1',
            path: 'waterPlan.roLimitL',
            label: 'Osmosée disponible',
            value: 10,
            before: null,
            reason: '',
            group: 'water'
          },
          {
            id: 'C2',
            path: 'waterPlan.mash',
            label: 'Sels à peser',
            value: { gypse: 1 },
            before: { gypse: 2 },
            reason: '',
            group: 'water'
          },
          {
            id: 'C3',
            path: 'name',
            label: 'Nom',
            value: 'Nouvelle pale',
            before: 'Pale',
            reason: ''
          }
        ]
      }}
    />
  );
  fireEvent.click(screen.getByRole('checkbox', { name: 'Sels à peser' }));
  expect(screen.getByRole('checkbox', { name: 'Osmosée disponible' })).not.toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Nom' })).toBeChecked();
  expect(screen.getByText('Gypse (g)')).toBeInTheDocument();
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Valider 1 modification' }))
  );
  expect(decide).toHaveBeenCalledWith(['C3'], 'apply');
});
