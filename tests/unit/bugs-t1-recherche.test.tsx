// @vitest-environment jsdom
import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CommandPalette, type CommandGroup } from '../../src/ui/CommandPalette';

afterEach(cleanup);

function Harness({ groups }: { groups: CommandGroup[] }) {
  const [open, setOpen] = useState(true);
  return <CommandPalette open={open} onOpenChange={setOpen} groups={groups} />;
}

const ecriture = (id: string, label: string, valeur: string, extra: Partial<CommandGroup['items'][number]> = {}) =>
  ({ id: `tx-${id}`, label, detail: '09.11 · Cascade Pellets', valeur, keywords: ['Versandkosten'], onSelect: vi.fn(), ...extra });

describe('LR1-NOTE-5 — la recherche retrouve une écriture par son montant', () => {
  it('« 17,50 » trouve l’écriture à 17,50 CHF et pas celle à 12,50 CHF ; un clic la choisit', () => {
    const choisie = vi.fn();
    render(<Harness groups={[{ heading: 'Écritures', items: [
      ecriture('a', 'ZZ TEST — achat houblon', '17,50 CHF', { onSelect: choisie }),
      ecriture('b', 'ZZ TEST — parcours 10.11 achat', '12,50 CHF')
    ] }]} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '17,50' } });
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('ZZ TEST — achat houblon');
    fireEvent.click(options[0]);
    expect(choisie).toHaveBeenCalledTimes(1);
  });

  it('la valeur d’un article (stock) n’entre pas dans l’index : « 12 » ne ramène pas tout le stock', () => {
    render(<Harness groups={[{ heading: 'Articles', items: [
      { id: 'article-1', label: 'Cascade Pellets', valeur: '12 kg', onSelect: vi.fn() },
      { id: 'article-2', label: 'Citra Pellets', valeur: '3 kg', onSelect: vi.fn() }
    ] }]} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '12' } });
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });
});

describe('LR3-NOTE-2 — seules les écritures rangées demandent « Inclure les archives »', () => {
  it('une écriture non rangée sort sans archives ; une rangée seulement avec, et la puce le dit', () => {
    render(<Harness groups={[{ heading: 'Écritures', items: [
      ecriture('vivante', 'ZZ TEST — écriture annulée', '5,00 CHF'),
      ecriture('rangee', 'ZZ TEST — écriture 2019', '5,00 CHF', { archived: true })
    ] }]} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ZZ TEST' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByText(/de plus dans les archives/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: /Inclure les archives/ }));
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });
});
