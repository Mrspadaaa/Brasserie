// @vitest-environment jsdom
// Rejeu en ligne ff0f822e (08.11), BE-71 : Finances, « Apport ou prélèvement privé » refuse « -1 », « 0,004 » et « 999999 » en silence.
// Règle commune : une saisie refusée garde la valeur précédente ET le dit (role="alert", aria-invalid), encore lisible après la sortie du champ.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MoneyInput } from '../../../src/ui/finance/FinanceForms';

afterEach(cleanup);

function saisir(valeur: string, depart: number | null = 5000) {
  const onChange = vi.fn();
  render(<MoneyInput label="Montant (CHF)" value={depart ?? undefined} onChange={onChange} required />);
  const champ = screen.getByRole('textbox', { name: 'Montant (CHF)' }) as HTMLInputElement;
  fireEvent.focus(champ);
  fireEvent.change(champ, { target: { value: valeur } });
  fireEvent.blur(champ);
  return { champ, onChange };
}

describe('BE-71 — un montant refusé se dit, la valeur d’avant reste', () => {
  it.each([
    ['-1', /négative/],
    ['0,004', /2 décimales/],
    ['999999', /au plus/],
  ])('« %s » : message role="alert" après la sortie, valeur d’avant (50) gardée, champ aria-invalid', (saisi, motif) => {
    const { champ, onChange } = saisir(saisi);
    expect(champ.value).toBe('50');
    expect(onChange).not.toHaveBeenCalledWith(expect.any(Number));
    expect(champ.getAttribute('aria-invalid')).toBe('true');
    const alerte = screen.getByRole('alert');
    expect(alerte.textContent).toMatch(motif);
    expect(alerte.textContent).toContain('La valeur précédente (50) est conservée');
  });

  it('un champ vide au départ : « Le champ reste vide »', () => {
    saisir('-1', null);
    expect(screen.getByRole('alert').textContent).toContain('Le champ reste vide');
  });

  it('une saisie permise efface le message', () => {
    const { champ } = saisir('-1');
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: '12,5' } });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(champ.getAttribute('aria-invalid')).toBeNull();
  });
});
