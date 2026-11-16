import React, { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChoixPlage } from '../../src/components/periode/ChoixPlage';
import { serialiser, type Periode } from '../../src/components/periode/periode';

// ET-PER, saisie des jours « jj.mm » (15.11) : retaper un jour dans un champ rempli ne doit ni s'ajouter à l'ancien texte,
// ni être réécrit par la période qu'il vient de poser (« 12.1 » lu « 12.01 » mangeait le « 0 »).
const Hote: React.FC<{ sortie: { dernier: Periode | null } }> = ({ sortie }) => {
  const [p, setP] = useState<Periode>({ genre: 'trimestre', annee: 2026, trimestre: 3 });
  return <ChoixPlage periode={p} onChoisir={(n) => { sortie.dernier = n; setP(n); }} maintenant={new Date(2026, 10, 15)} />;
};

describe('ChoixPlage : saisie des jours', () => {
  afterEach(() => cleanup());

  it('retape « du » dans un champ rempli : le texte est remplacé, la plage suit à « 12.10 »', async () => {
    const sortie: { dernier: Periode | null } = { dernier: null };
    const user = userEvent.setup();
    render(<Hote sortie={sortie} />);
    const du = screen.getByLabelText('Du (jj.mm)') as HTMLInputElement;
    const au = screen.getByLabelText('Au (jj.mm)') as HTMLInputElement;
    expect(du.value).toBe('01.07');
    expect(au.value).toBe('30.09');
    await user.click(au);
    await user.keyboard('03.11');
    expect(au.value).toBe('03.11');
    await user.click(du);
    await user.keyboard('12.10');
    expect(du.value).toBe('12.10');
    expect(au.value).toBe('03.11');
    expect(serialiser(sortie.dernier as Periode)).toBe('range-2026-10-12_2026-11-03');
  });

  it('« 12.1 » attend : la plage ne se pose qu’avec le mois à deux chiffres ou en quittant le champ', async () => {
    const sortie: { dernier: Periode | null } = { dernier: null };
    const user = userEvent.setup();
    render(<Hote sortie={sortie} />);
    await user.click(screen.getByLabelText('Du (jj.mm)'));
    await user.keyboard('12.1');
    expect(sortie.dernier).toBeNull();
    expect((screen.getByLabelText('Du (jj.mm)') as HTMLInputElement).value).toBe('12.1');
  });
});
