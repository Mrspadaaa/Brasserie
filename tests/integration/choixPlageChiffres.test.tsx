// NUIT-D1 (27.11, couverture D) : Finances > période, « 0110 » et « 1511 » tapés au clavier numérique (l'iPhone n'a pas de point) restaient
// sans effet, contour rouge, aucun message. Quatre chiffres se lisent jj.mm : le point se pose tout seul et la plage s'applique.
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChoixPlage } from '../../src/components/periode/ChoixPlage';
import { moisDe } from '../../src/components/periode/periode';

describe('Période : jours tapés sans point', () => {
  it('« 0110 » et « 1511 » posent la plage du 01.10 au 15.11', () => {
    const onChoisir = vi.fn();
    const maintenant = new Date(2026, 10, 27);
    render(<ChoixPlage periode={moisDe(maintenant)} onChoisir={onChoisir} maintenant={maintenant} />);
    const du = screen.getByLabelText('Du (jj.mm)') as HTMLInputElement;
    const au = screen.getByLabelText('Au (jj.mm)') as HTMLInputElement;
    fireEvent.focus(du); fireEvent.change(du, { target: { value: '0110' } });
    fireEvent.focus(au); fireEvent.change(au, { target: { value: '1511' } });
    expect(du.value).toBe('01.10');
    expect(au.value).toBe('15.11');
    const derniere = onChoisir.mock.calls.at(-1)?.[0];
    expect(JSON.stringify(derniere)).toContain('2026-10-01');
    expect(JSON.stringify(derniere)).toContain('2026-11-15');
  });
});
