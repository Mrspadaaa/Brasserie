import React, { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NumberInput } from '../../src/ui/NumberInput';

afterEach(cleanup);

/** Le parent plafonne à 1000 pendant la frappe, comme « Osmosée disponible au total » (BR-80, BE-4, 08.11). */
function ParentQuiBorne({ max = 1000 }: { max?: number }) {
  const [v, setV] = useState<number | undefined>(undefined);
  return <>
    <NumberInput aria-label="champ" value={v} emptyValue={undefined} onValue={(n) => setV(n == null ? undefined : Math.max(0, Math.min(max, n)))} />
    <output data-testid="retenu">{v == null ? 'aucune' : String(v)}</output>
  </>;
}

/** Une frappe = un caractère AJOUTÉ à ce que le champ affiche à cet instant (c'est ainsi que « 1000 » + « 9 » donnait « 10009 »). */
function tape(champ: HTMLElement, texte: string) {
  fireEvent.focus(champ);
  for (const caractere of texte) fireEvent.change(champ, { target: { value: (champ as HTMLInputElement).value + caractere } });
}

describe('BR-80 : une borne du parent n’écrit pas de chiffres résiduels dans le champ en cours de frappe', () => {
  it('« 99999 » tapé : le champ affiche ce qu’on tape, jamais « 10009 »', () => {
    render(<ParentQuiBorne />);
    const champ = screen.getByLabelText('champ') as HTMLInputElement;
    tape(champ, '99999');
    expect(champ.value).toBe('99999');
    expect(screen.getByTestId('retenu')).toHaveTextContent('1000');
  });
  it('à la sortie, le champ relit la valeur retenue : on lit ce qui est gardé', () => {
    render(<ParentQuiBorne />);
    const champ = screen.getByLabelText('champ') as HTMLInputElement;
    tape(champ, '99999');
    fireEvent.blur(champ);
    expect(champ.value).toBe('1000');
    expect(screen.getByTestId('retenu')).toHaveTextContent('1000');
  });
  it('une valeur dans les bornes reste telle quelle, virgule comprise', () => {
    render(<ParentQuiBorne />);
    const champ = screen.getByLabelText('champ') as HTMLInputElement;
    tape(champ, '12,5');
    fireEvent.blur(champ);
    expect(champ.value).toBe('12,5');
    expect(screen.getByTestId('retenu')).toHaveTextContent('12.5');
  });
  it('un champ qui reçoit une valeur du parent sans avoir le focus la reflète (préréglage)', () => {
    function Avec() {
      const [v, setV] = useState<number | undefined>(5);
      return <><NumberInput aria-label="champ" value={v} emptyValue={undefined} onValue={setV} /><button onClick={() => setV(42)}>préréglage</button></>;
    }
    render(<Avec />);
    fireEvent.click(screen.getByText('préréglage'));
    expect((screen.getByLabelText('champ') as HTMLInputElement).value).toBe('42');
  });
});
