import React, { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MoneyInput } from '../../src/ui/finance/FinanceForms';

// BE-71 : « −1 » devenait « 0 » en silence ; « 0,004 » CHF acceptée à 3 décimales. BE-64 : idem sur un solde. MV-41 : 999 999 CHF.
afterEach(() => cleanup());
function Champ() {
  const [cents, setCents] = useState<number | undefined>();
  return <><MoneyInput label="Montant (CHF)" value={cents} onChange={setCents} /><output data-testid="cents">{cents === undefined ? 'inconnu' : cents}</output></>;
}
const saisir = (texte: string) => {
  const champ = screen.getByLabelText('Montant (CHF)') as HTMLInputElement;
  fireEvent.change(champ, { target: { value: texte } });
  return champ;
};

describe('Montant d’une feuille de finances', () => {
  it('« 12,50 » s’accepte', () => {
    render(<Champ />);
    saisir('12,50');
    expect(screen.getByTestId('cents').textContent).toBe('1250');
  });
  it('« −1 » est refusé en le disant, rien n’est retenu', () => {
    render(<Champ />);
    const champ = saisir('-1');
    expect(champ.getAttribute('aria-invalid')).toBe('true');
    expect(champ.title).toMatch(/négative/);
    expect(screen.getByTestId('cents').textContent).toBe('inconnu');
  });
  it('« 0,004 » (trois décimales) est refusé en le disant', () => {
    render(<Champ />);
    const champ = saisir('0,004');
    expect(champ.getAttribute('aria-invalid')).toBe('true');
    expect(champ.title).toMatch(/2 décimales/);
    expect(screen.getByTestId('cents').textContent).toBe('inconnu');
  });
  it('999 999 CHF dépasse la borne d’une écriture et n’est pas retenu', () => {
    render(<Champ />);
    const champ = saisir('999999');
    expect(champ.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByTestId('cents').textContent).toBe('inconnu');
  });
});
