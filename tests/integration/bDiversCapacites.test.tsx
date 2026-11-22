import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { BrewhouseSettings } from '../../src/ui/BrewhouseSettings';
import { practicalEquipment } from '../../src/domain/brewEquipment';
import { defaultConfig } from '../../src/services/storage';

const rig = { ...defaultConfig.brewhouses[0], volumeL: 24, equipment: { ...practicalEquipment } };
afterEach(() => cleanup());

// AM-49 (décision du pilote, 09.11) : une micro-brasserie n'a pas de cuve de plus de 2 000 L. Hors borne, la saisie est refusée et le message
// dit la borne, à la virgule (comme RL-9) ; la capacité d'avant reste.
const CAPACITES = ['Cuve · capacité totale (L)', 'Cuve · limite utile à chaud (L)', 'Fermenteur · capacité totale (L)'];

describe('AM-49 : capacités de la cuve et du fermenteur bornées à 2 000 L', () => {
  it.each(CAPACITES)('%s : 5000 est refusé avec « Saisis 1 à 2000 L. »', libelle => {
    const change = vi.fn();
    render(<BrewhouseSettings profile={rig} onChange={change} />);
    const champ = screen.getByLabelText(libelle) as HTMLInputElement;
    const avant = champ.value;
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: '5000' } });
    fireEvent.blur(champ);
    expect(screen.getAllByRole('alert').map(a => a.textContent).join(' ')).toContain('Saisis 1 à 2000 L.');
    expect(champ).toHaveAttribute('aria-invalid', 'true');
    expect(champ.value).toBe(avant);
  });

  it('2000 L est accepté, sans message', () => {
    const change = vi.fn();
    render(<BrewhouseSettings profile={rig} onChange={change} />);
    const champ = screen.getByLabelText('Fermenteur · capacité totale (L)') as HTMLInputElement;
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: '2000' } });
    fireEvent.blur(champ);
    expect(screen.queryByText(/Saisis 1 à 2000 L\./)).toBeNull();
    expect(change).toHaveBeenCalled();
    expect(change.mock.calls.at(-1)![0].equipment.fermenterCapacityL).toBe(2000);
  });
});
