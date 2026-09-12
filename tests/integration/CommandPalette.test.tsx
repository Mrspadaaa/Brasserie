import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CommandPalette, type CommandGroup } from '../../src/ui/CommandPalette';

afterEach(cleanup);

function Harness({ groups }: { groups: CommandGroup[] }) {
  const [open, setOpen] = useState(true);
  return <><button onClick={() => setOpen(true)}>Ouvrir la recherche</button><CommandPalette open={open} onOpenChange={setOpen} groups={groups} /></>;
}

describe('recherche universelle — accès aux archives', () => {
  it('ouvre la fiche choisie après activation des archives, puis réinitialise ce choix', () => {
    const selectArchive = vi.fn();
    render(<Harness groups={[{ heading: 'Écritures', items: [
      { id: 'archive', label: 'Cuve ancienne fictive', archived: true, onSelect: selectArchive },
      { id: 'current', label: 'Malt actuel fictif', onSelect: vi.fn() }
    ] }]} />);
    const toggle = screen.getByRole('checkbox', { name: /Inclure les archives/ });
    expect(toggle).not.toBeChecked();
    expect(screen.queryByRole('option', { name: /Cuve ancienne fictive/ })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'cuve ancienne' } });
    expect(screen.getByText('Rien ne correspond')).toBeInTheDocument();
    fireEvent.click(toggle);
    const result = screen.getByRole('option', { name: /Cuve ancienne fictive/ });
    expect(screen.getByText('Archivée')).toBeInTheDocument();
    fireEvent.click(result);
    expect(selectArchive).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir la recherche' }));
    expect(screen.getByRole('checkbox', { name: /Inclure les archives/ })).not.toBeChecked();
    expect(screen.getByRole('combobox')).toHaveValue('');
    expect(screen.queryByRole('option', { name: /Cuve ancienne fictive/ })).not.toBeInTheDocument();
  });

  it('borne le DOM mais retrouve une ancienne entrée en cherchant sa référence', () => {
    const selectOld = vi.fn();
    render(<Harness groups={[{ heading: 'Écritures', items: Array.from({ length: 350 }, (_, i) => ({
      id: `tx-${i}`, label: `Achat fictif ${i}`, keywords: [`REFERENCE-${i}`],
      onSelect: i === 310 ? selectOld : vi.fn()
    })) }]} />);
    expect(screen.getAllByRole('option')).toHaveLength(12);
    expect(screen.getByRole('status')).toHaveTextContent('12 sur 350 résultats');
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'REFERENCE-310' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    fireEvent.click(screen.getByRole('option', { name: 'Achat fictif 310' }));
    expect(selectOld).toHaveBeenCalledTimes(1);
  });

  it('distingue deux pièces avec le même libellé et ferme avec Échap', () => {
    const selectedFirst = vi.fn(), selectedSecond = vi.fn();
    render(<Harness groups={[{ heading: 'Écritures', items: [
      { id: 'one', label: 'Achat identique', onSelect: selectedFirst },
      { id: 'two', label: 'Achat identique', onSelect: selectedSecond }
    ] }]} />);
    fireEvent.click(screen.getAllByRole('option', { name: 'Achat identique' })[1]);
    expect(selectedSecond).toHaveBeenCalledTimes(1);
    expect(selectedFirst).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir la recherche' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
