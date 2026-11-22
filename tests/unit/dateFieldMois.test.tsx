// @vitest-environment jsdom
// D262b : « Aujourd'hui · Mois passé · Mois suivant ». Un raccourci de mois pose le jour d'aujourd'hui dans le mois visé, borné au
// dernier jour du mois (31.03 → 28.02), et la pastille de la date posée est pressée.
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DateField } from '../../src/ui/DateField';

const RACCOURCIS = [{ label: 'Aujourd’hui', offsetDays: 0 }, { label: 'Mois passé', offsetDays: 0, offsetMonths: -1 }, { label: 'Mois suivant', offsetDays: 0, offsetMonths: 1 }];

describe('DateField, raccourcis de mois (D262b)', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(2026, 2, 31, 10)); });
  afterEach(() => { vi.useRealTimers(); });

  it('« Mois passé » pose le 31.03 borné au 28.02, « Mois suivant » le 30.04', () => {
    const onChange = vi.fn();
    render(<DateField label="Date de l’achat" value="" onChange={onChange} shortcuts={RACCOURCIS} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mois passé' }));
    expect(onChange).toHaveBeenLastCalledWith('28.02.2026');
    fireEvent.click(screen.getByRole('button', { name: 'Mois suivant' }));
    expect(onChange).toHaveBeenLastCalledWith('30.04.2026');
    fireEvent.click(screen.getByRole('button', { name: 'Aujourd’hui' }));
    expect(onChange).toHaveBeenLastCalledWith('31.03.2026');
  });

  it('la pastille de la date posée est pressée', () => {
    render(<DateField label="Date de l’achat" value="28.02.2026" onChange={() => {}} shortcuts={RACCOURCIS} />);
    expect(screen.getByRole('button', { name: 'Mois passé' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Mois suivant' })).toHaveAttribute('aria-pressed', 'false');
  });
});
