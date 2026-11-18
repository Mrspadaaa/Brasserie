// @vitest-environment jsdom
// BE-26 : « Prix de vente TTC » 99999 CHF était accepté dans les essais de tarifs (0,004 est refusé depuis BE-64/71). Le format a sa borne, estimée et citée (`BORNES_FINANCE.formatCents`) ; la marge reste lisible dessous.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
vi.mock('../../src/services/storage', () => ({ StorageService: { getConfig: () => ({ fiscal: { isTvaRegistered: false, tvaNormalRate: 0.081 } }) } }));
vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: (read: () => unknown) => read() }));
import { CreativePricing } from '../../src/ui/finance/CreativePricing';
afterEach(cleanup);

describe('BE-26 : les essais de tarifs ont des bornes', () => {
  it('99999 CHF est refusé en le disant, 0,004 aussi ; 150 passe', () => {
    render(<CreativePricing />);
    const prix = screen.getByLabelText('Prix de vente TTC (CHF)');
    fireEvent.focus(prix); fireEvent.change(prix, { target: { value: '99999' } });
    expect(prix).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getAllByRole('alert')[0]).toHaveTextContent('au plus 10');
    fireEvent.change(prix, { target: { value: '0,004' } });
    expect(screen.getAllByRole('alert')[0]).toHaveTextContent('décimales');
    fireEvent.blur(prix);
    fireEvent.change(prix, { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText('Coût de revient de ce format (CHF)'), { target: { value: '99999' } });
    expect(screen.getByLabelText('Coût de revient de ce format (CHF)')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText('À renseigner')).toBeInTheDocument();
  });
});
